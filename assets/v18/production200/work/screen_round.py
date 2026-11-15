"""Measure real, unmodified ArcFace cosine on 128/256 candidate crops.
No identity accepted solely by this numerical screen; visual review remains required.
"""
import os
os.environ.setdefault('OMP_NUM_THREADS','1')
import json,hashlib,csv,gzip,argparse
from pathlib import Path
import numpy as np
import cv2,onnxruntime as ort
from PIL import Image,ImageOps
from insightface.app import FaceAnalysis
from insightface.utils import face_align
P=Path(__file__).resolve().parent;ROOT=P.parents[3]
parser=argparse.ArgumentParser();parser.add_argument('round',nargs='?',default='round01');args=parser.parse_args();D=P/args.round
opts=ort.SessionOptions();opts.intra_op_num_threads=1;opts.inter_op_num_threads=1
app=FaceAnalysis(name='buffalo_l',root='/workspace',allowed_modules=['detection','recognition'],providers=['CPUExecutionProvider'],sess_options=opts)
app.prepare(ctx_id=-1,det_size=(640,640))
def embedding(im):
 faces=app.get(cv2.cvtColor(np.asarray(im),cv2.COLOR_RGB2BGR))
 if len(faces)!=1:raise ValueError(f'exactly one detected face required, got {len(faces)}')
 return faces[0].normed_embedding
refs=np.load(P/'first20_embeddings.npz');R=refs['references'];refids=refs['reference_ids'];assert R.shape==(160,512)
cache={}
if (D/'arcface_scores.npz').exists():
 old=np.load(D/'arcface_scores.npz')
 for j,rid in enumerate(old['ids']):cache[str(rid)]={n:old[f'embeddings_{n}'][j] for n in (128,256)}
fallbacks=json.loads((D/'prescreen.json').read_text()).get('alignment_fallback_128_from256',[]) if (D/'prescreen.json').exists() else []
roster=json.loads((P/'planned_identities.json').read_text());catalog=json.loads((D/'batches.json').read_text());records=[];errors=[];emb={128:[],256:[]}
(D/'candidates').mkdir(exist_ok=True)
for batch in catalog:
 source=ROOT/batch['source_path'];sheet=Image.open(source).convert('RGB');w,h=sheet.size
 for i in range(20):
  idx=batch['start']-1+i;x=roster[idx];r,c=divmod(i,5)
  if i in batch.get('skip_cells',[]):
   errors.append({'id':x['id'],'error':batch['invalid_reason']});continue
  rect=[round(c*w/5)+2,round(r*h/4)+2,round((c+1)*w/5)-2,round((r+1)*h/4)-2]
  native=sheet.crop(rect)
  # Isotropic square crop: no stretching of facial anatomy.
  square=ImageOps.fit(native,(256,256),Image.Resampling.LANCZOS,centering=(.5,.25))
  path=D/'candidates'/f"{x['id']}.png"
  cached=path.exists() and x['id'] in cache and np.array_equal(np.asarray(Image.open(path)),np.asarray(square))
  square.save(path)
  try:
   if cached:e=cache[x['id']]
   else:
    e256=embedding(square);small=square.resize((128,128),Image.Resampling.LANCZOS)
    try:e128=embedding(small)
    except ValueError:
     faces=app.get(cv2.cvtColor(np.asarray(square),cv2.COLOR_RGB2BGR))
     if len(faces)!=1:raise ValueError('cannot obtain unique 256 landmarks for 128 alignment')
     aligned=face_align.norm_crop(cv2.cvtColor(np.asarray(small),cv2.COLOR_RGB2BGR),faces[0].kps*.5)
     raw=app.models['recognition'].get_feat(aligned).flatten();e128=raw/np.linalg.norm(raw);fallbacks.append(x['id'])
    e={128:e128,256:e256}
  except ValueError as err:errors.append({'id':x['id'],'error':str(err)});continue
  for n in emb:emb[n].append(e[n])
  records.append({'id':x['id'],'roster_index':idx,'source':str(source.relative_to(ROOT)),'source_rect_xyxy':rect,'crop':str(path.relative_to(ROOT)),'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest()})
 print('embedded batch',batch['batch'], 'valid total',len(records),flush=True)
ids=[x['id'] for x in records];count=len(ids);scores={};conflicts=np.zeros((count,count),dtype=bool);blocked=np.zeros(count,dtype=bool);payload={'ids':np.array(ids),'reference_ids':refids}
for n in emb:
 E=np.array(emb[n]);W=E@E.T;C=E@R.T;payload[f'embeddings_{n}']=E;payload[f'within_{n}']=W;payload[f'cross_{n}']=C
 mask=np.triu(np.ones_like(W,dtype=bool),1);within=W[mask];blocked|=(C>=.4).any(axis=1);conflicts|=W>=.4
 summary={'within_pair_count':int(len(within)),'cross_pair_count':int(C.size),'within_min':float(within.min()),'within_max':float(within.max()),'cross_min':float(C.min()),'cross_max':float(C.max()),'within_violations':int((within>=.4).sum()),'cross_violations':int((C>=.4).sum())};scores[str(n)]=summary
 with gzip.open(D/f'pairs_{n}.csv.gz','wt') as f:
  writer=csv.writer(f);writer.writerow(['kind','identity_a','identity_b','cosine'])
  for i in range(count):
   for j in range(i+1,count):writer.writerow(['within',ids[i],ids[j],float(W[i,j])])
   for j,rid in enumerate(refids):writer.writerow(['reference',ids[i],str(rid),float(C[i,j])])
np.fill_diagonal(conflicts,False)
# Deterministic largest-of-100 greedy independent subsets, preserving all original scores.
best=[];rng=np.random.default_rng(18)
for attempt in range(100):
 remaining=set(np.where(~blocked)[0]);chosen=[]
 while remaining:
  degrees={i:sum(bool(conflicts[i,j]) for j in remaining) for i in remaining};minimum=min(degrees.values());ties=[i for i in remaining if degrees[i]==minimum];i=int(rng.choice(ties));chosen.append(i);remaining-={i,*[j for j in remaining if conflicts[i,j]]}
 if len(chosen)>len(best):best=chosen
compatible=[ids[i] for i in sorted(best)];replace=[x['id'] for x in roster if x['id'] not in compatible]
result={'scope':'candidate screening only; not final asset validation','threshold':.4,'model':'buffalo_l/w600k_r50.onnx','model_sha256':hashlib.sha256(Path('/workspace/models/buffalo_l/w600k_r50.onnx').read_bytes()).hexdigest(),'reference_scope':'all existing 160 identities, one decoded 128 runtime portrait each; reference embeddings reused from first20_embeddings.npz with same model','candidate_count':count,'detection_errors':errors,'alignment_fallback_128_from256':sorted(set(fallbacks)),'metrics':scores,'passed':count==200 and not errors and not blocked.any() and not conflicts.any(),'numerically_compatible_subset':compatible,'numerically_compatible_count':len(best),'regeneration_ids':replace,'visual_review_passed':False,'wardrobe_stage_unlocked':False}
(D/'prescreen.json').write_text(json.dumps(result,indent=2));(D/'candidate_sources.json').write_text(json.dumps(records,indent=2));np.savez_compressed(D/'arcface_scores.npz',**payload)
print(json.dumps({k:v for k,v in result.items() if k not in ['numerically_compatible_subset','regeneration_ids']},indent=2),flush=True)
