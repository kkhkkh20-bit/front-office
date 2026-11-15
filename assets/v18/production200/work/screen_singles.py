"""Incremental real ArcFace screening of round03 photographs; all scores retained."""
from pathlib import Path
import json,time,hashlib
import numpy as np,cv2,onnxruntime as ort
from PIL import Image,ImageOps
from insightface.app import FaceAnalysis
P=Path(__file__).resolve().parent;ROOT=P.parents[3];D=P/'round04_single';D.mkdir(parents=True,exist_ok=True)
s=ort.SessionOptions();s.intra_op_num_threads=1;s.inter_op_num_threads=1
app=FaceAnalysis(name='buffalo_l',root='/workspace',allowed_modules=['detection','recognition'],providers=['CPUExecutionProvider'],sess_options=s);app.prepare(ctx_id=-1,det_size=(640,640))
base=np.load(P/'frozen146.npz');ref=np.load(P/'first20_embeddings.npz')['references'];fixed=list(base['ids']);E={n:[] for n in [128,256]};ids=[];errors=[];seen=set();sources=[]
while True:
 previous=len(seen)
 for f in sorted(D.glob('v18_*.json')):
  if f.stem in seen:continue
  seen.add(f.stem);x=json.loads(f.read_text());path=ROOT/x['source_path'];original=Image.open(path).convert('RGB');im=ImageOps.fit(original,(256,256),Image.Resampling.LANCZOS,centering=(.5,.25));(D/'cropped').mkdir(exist_ok=True);path=D/'cropped'/(x['id']+'.png');im.save(path);x['source_path']=str(path.relative_to(ROOT));values={}
  try:
   for n in E:
    photo=im.resize((n,n),Image.Resampling.LANCZOS);faces=app.get(cv2.cvtColor(np.array(photo),cv2.COLOR_RGB2BGR))
    if len(faces)!=1:raise ValueError(f'{n}: expected exactly one face, got {len(faces)}')
    values[n]=faces[0].normed_embedding
  except ValueError as err:errors.append({'id':x['id'],'error':str(err)});continue
  ids.append(x['id']);sources.append({'id':x['id'],'path':x['source_path'],'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
  for n in E:E[n].append(values[n])
 if len(seen)==previous and not (D/'GENERATION_FINISHED').exists():
  time.sleep(4);continue
 if ids:
  count=len(ids);blocked=np.zeros(count,bool);clash=np.zeros((count,count),bool);payload={'ids':np.array(ids)};metrics={}
  for n in E:
   e=np.array(E[n]);a=e@e.T;b=e@base[f'e{n}'].T;c=e@ref.T;blocked|=(b>=.4).any(axis=1)|(c>=.4).any(axis=1);clash|=a>=.4
   payload.update({f'embeddings_{n}':e,f'within_{n}':a,f'vs_fixed_{n}':b,f'vs_reference_{n}':c});m=np.triu(np.ones_like(a,bool),1)
   metrics[str(n)]={'within_pairs':int(m.sum()),'within_max':float(a[m].max()) if m.any() else None,'fixed_max':float(b.max()),'reference_max':float(c.max())}
  np.fill_diagonal(clash,False);best=[];rng=np.random.default_rng(18)
  for attempt in range(10):
   left=set(np.where(~blocked)[0]);chosen=[]
   while left:
    degree={i:int(clash[i,list(left)].sum()) for i in left};v=min(degree.values());i=int(rng.choice([i for i in left if degree[i]==v]));chosen.append(i);left-={i,*[j for j in left if clash[i,j]]}
   if len(chosen)>len(best):best=chosen
  accepted=[ids[i] for i in sorted(best)];result={'scope':'numerical prescreen only, visual checks pending','scored':len(ids),'processed':len(seen),'errors':errors,'fixed_count':len(fixed),'additional_count':len(accepted),'additional_ids':accepted,'combined_count':len(fixed)+len(accepted),'combined_ids':fixed+accepted,'metrics':metrics,'threshold':.4,'production_complete':False}
  np.savez_compressed(D/'arcface_scores.npz',**payload);(D/'screen_progress.json').write_text(json.dumps(result,indent=2));(D/'candidate_sources.json').write_text(json.dumps(sources,indent=2));print('processed',len(seen),'scored',len(ids),'combined',result['combined_count'],flush=True)
 if (D/'GENERATION_FINISHED').exists() or len(seen)>=54:break
 time.sleep(4)
