"""Screen natural replacement photographs against frozen compatible candidates and 160 references."""
from pathlib import Path
import json,hashlib
import numpy as np,cv2,onnxruntime as ort
from PIL import Image
from insightface.app import FaceAnalysis
P=Path(__file__).resolve().parent;ROOT=P.parents[3];D=P/'round02_natural';D.mkdir(exist_ok=True);(D/'candidates').mkdir(exist_ok=True)
opts=ort.SessionOptions();opts.intra_op_num_threads=1;opts.inter_op_num_threads=1
app=FaceAnalysis(name='buffalo_l',root='/workspace',allowed_modules=['detection','recognition'],providers=['CPUExecutionProvider'],sess_options=opts);app.prepare(ctx_id=-1,det_size=(640,640))
base=np.load(P/'round01/arcface_scores.npz');ref=np.load(P/'first20_embeddings.npz')['references'];gate=json.loads((P/'round01/prescreen.json').read_text());fixed=gate['numerically_compatible_subset'];positions=[list(base['ids']).index(x) for x in fixed]
ids=[];errors=[];E={128:[],256:[]};sources=[]
for b in json.loads((D/'batches.json').read_text()):
 im=Image.open(ROOT/b['source_path']).convert('RGB');w,h=im.size
 for i,rid in enumerate(b['ids']):
  r,c=divmod(i,2);box=(round(c*w/2)+2,round(r*h/2)+2,round((c+1)*w/2)-2,round((r+1)*h/2)-2);crop=im.crop(box);assert abs(crop.width-crop.height)<=1
  photo=crop.resize((256,256),Image.Resampling.LANCZOS);photo.save(D/'candidates'/f'{rid}.png');emb={}
  try:
   for n in E:
    scaled=photo.resize((n,n),Image.Resampling.LANCZOS);faces=app.get(cv2.cvtColor(np.asarray(scaled),cv2.COLOR_RGB2BGR))
    if len(faces)!=1:raise ValueError(f'{n}: expected 1 face, got {len(faces)}')
    emb[n]=faces[0].normed_embedding
  except ValueError as err:errors.append({'id':rid,'error':str(err)});continue
  ids.append(rid)
  for n in E:E[n].append(emb[n])
  sources.append({'id':rid,'source':b['source_path'],'source_rect_xyxy':box,'crop':str((D/'candidates'/f'{rid}.png').relative_to(ROOT))})
 print('screened natural batch',b['batch'],flush=True)
N=len(ids);blocked=np.zeros(N,bool);clash=np.zeros((N,N),bool);metrics={};payload={'ids':np.array(ids),'fixed_ids':np.array(fixed)}
for n in E:
 e=np.array(E[n]);f=base[f'embeddings_{n}'][positions];a=e@e.T;b=e@f.T;c=e@ref.T;blocked|=(b>=.4).any(axis=1)|(c>=.4).any(axis=1);clash|=a>=.4
 payload.update({f'embeddings_{n}':e,f'within_{n}':a,f'vs_fixed_{n}':b,f'vs_reference_{n}':c});mask=np.triu(np.ones_like(a,bool),1)
 metrics[str(n)]={'candidate_pairs':int(mask.sum()),'fixed_pairs':int(b.size),'reference_pairs':int(c.size),'candidate_max':float(a[mask].max()),'fixed_max':float(b.max()),'reference_max':float(c.max())}
np.fill_diagonal(clash,False);best=[];rng=np.random.default_rng(18)
for _ in range(100):
 left=set(np.where(~blocked)[0]);chosen=[]
 while left:
  degree={i:sum(clash[i,j] for j in left) for i in left};minimum=min(degree.values());i=int(rng.choice([i for i in left if degree[i]==minimum]));chosen.append(i);left-={i,*[j for j in left if clash[i,j]]}
 if len(chosen)>len(best):best=chosen
selected=[ids[i] for i in sorted(best)];allids=fixed+selected
for n in E:
 all_e=np.vstack([base[f'embeddings_{n}'][positions],np.array(E[n])[sorted(best)]]);cos=all_e@all_e.T;assert np.max(cos-np.eye(len(all_e)))<.4;assert (all_e@ref.T).max()<.4
 payload[f'combined_embeddings_{n}']=all_e
result={'scope':'provisional numerical subset, not production completion','model_sha256':gate['model_sha256'],'threshold':.4,'candidate_count':N,'detection_errors':errors,'metrics':metrics,'fixed_subset_count':len(fixed),'additional_compatible_ids':selected,'combined_compatible_count':len(allids),'combined_compatible_ids':allids,'visual_direction':'natural proportions and gentle smile; exaggerated candidates excluded','visual_review_complete':False,'wardrobe_stage_unlocked':False}
(D/'prescreen.json').write_text(json.dumps(result,indent=2));(D/'candidate_sources.json').write_text(json.dumps(sources,indent=2));np.savez_compressed(D/'arcface_scores.npz',**payload)
print(json.dumps({k:v for k,v in result.items() if k!='combined_compatible_ids'},indent=2))
