"""Evaluate exact decoded WebP cells independently at each requested resolution."""
import os
os.environ['OMP_NUM_THREADS']='1';os.environ['OPENBLAS_NUM_THREADS']='1'
from pathlib import Path
import json,hashlib,concurrent.futures,multiprocessing
import numpy as np
from PIL import Image
import canonical_rescreen as rec
P=Path(__file__).resolve().parent;ROOT=P.parents[3];OUT=P.parent;D=P/'decoded_delivery';D.mkdir(exist_ok=True)
def init():rec.initialize()
def measure(job):
 import cv2
 dst=np.array([[38.2946,51.6963],[73.5318,51.5014],[56.0252,71.7366],[41.5493,92.3655],[70.7299,92.2041]],np.float32);values={};details={};landmarks={}
 for size in [256,128]:
  photo=Image.open(job[str(size)]).convert('RGB');assert photo.size==(size,size);img=cv2.cvtColor(np.array(photo),cv2.COLOR_RGB2BGR);boxes,kps=rec.APP.det_model.detect(img,max_num=0);fallback=False
  if len(boxes)!=1:
   if size==128 and 256 in landmarks:kp=landmarks[256]*.5;fallback=True
   else:return {'id':job['id'],'team':job['team'],'error':f'{size}: face_count={len(boxes)}'},None,None
  else:kp=kps[0]
  landmarks[size]=kp;M,_=cv2.estimateAffinePartial2D(kp,dst,method=cv2.LMEDS)
  if M is None:return {'id':job['id'],'team':job['team'],'error':f'{size}: alignment'},None,None
  aligned=cv2.warpAffine(img,M,(112,112),flags=cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT,borderValue=(0,0,0));feat=rec.APP.models['recognition'].get_feat(aligned).flatten();values[size]=feat/np.linalg.norm(feat);details[str(size)]={'landmarks':kp.tolist(),'fallback_128_landmarks_from256':fallback,'actual_pixels_sha256':hashlib.sha256(np.array(photo).tobytes()).hexdigest()}
 return {'id':job['id'],'team':job['team'],'details':details},values[128],values[256]
if __name__=='__main__':
 manifest=json.loads((OUT/'manifest.json').read_text());ids=manifest['identities'];teams=[x['key'] for x in manifest['teams']];jobs=[];cache={}
 for t in teams:
  for x in ids:
   job={'id':x['id'],'team':t}
   for size in [128,256]:
    v=x['variants'][t]['sheets'][str(size)];path=ROOT/v['path']
    if str(path) not in cache:cache[str(path)]=Image.open(path).convert('RGB')
    left,top,w,h=v['rect'];tile=cache[str(path)].crop((left,top,left+w,top+h));dest=D/f'{t}_{x["id"]}_{size}.png';tile.save(dest);job[str(size)]=str(dest)
   jobs.append(job)
  cache.clear()
 E={128:[],256:[]};records=[];errors=[]
 with concurrent.futures.ProcessPoolExecutor(max_workers=2,mp_context=multiprocessing.get_context('spawn'),initializer=init) as pool:
  for i,(record,e128,e256) in enumerate(pool.map(measure,jobs),1):
   if e128 is None:errors.append(record)
   else:records.append(record);E[128].append(e128);E[256].append(e256)
   if i%50==0:(D/'progress.json').write_text(json.dumps({'processed':i,'total':len(jobs),'errors':errors},indent=2));print('decoded WebP measured',i,flush=True)
 (OUT/'validation/detection_records.json').write_text(json.dumps(records,indent=2));(OUT/'validation/detection_errors.json').write_text(json.dumps(errors,indent=2));assert not errors,errors
 np.savez_compressed(OUT/'validation/delivered_embeddings.npz',ids=np.array([x['id'] for x in ids]),teams=np.array(teams),e128=np.array(E[128]).reshape(10,200,512),e256=np.array(E[256]).reshape(10,200,512))
 from build_delivery import validate_embeddings,validate_pixels
 validate_pixels(manifest);source=np.load(OUT/'identity_prescreen/embeddings.npz');assert list(source['ids'])==[x['id'] for x in ids];good=validate_embeddings(manifest,{s:source[f'e{s}'] for s in [128,256]},{s:source[f'ref{s}'] for s in [128,256]},{s:np.array(E[s]).reshape(10,200,512) for s in [128,256]});print('ALL final numerical gates passed:',good)
