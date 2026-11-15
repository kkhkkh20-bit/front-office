"""Measure exact final atlas cells at each resolution; cache only identical pixels."""
import os
os.environ['OMP_NUM_THREADS']='1';os.environ['OPENBLAS_NUM_THREADS']='1'
from pathlib import Path
from functools import lru_cache
import json,hashlib,concurrent.futures,multiprocessing,shutil
import numpy as np
from PIL import Image
import measure as rec
P=Path(__file__).resolve().parent;OUT=P.parents[1];ROOT=P.parents[4]
MODEL_SHA='4c06341c33c2ca1f86781dab0e829f88ad5b64be9fba56e56bc9ebdefc619e43'
DETECTOR_SHA='5838f7fe053675b1c7a08b633df49e7af5495cee0493c7dcf6697200b85b5b91'
SIG=hashlib.sha256(Path(__file__).read_bytes()+Path(rec.__file__).read_bytes()+MODEL_SHA.encode()+DETECTOR_SHA.encode()).hexdigest()
CACHE=P/'final_pixel_cache';CACHE.mkdir(exist_ok=True)
def sha(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()
@lru_cache(maxsize=6)
def sheet(path):
 im=Image.open(path);assert im.format=='WEBP' and im.mode=='RGB';return im.copy()
def measure(job):
 import cv2
 pixels={};hashes={}
 for s in [128,256,384]:
  v=job['variants'][str(s)];im=sheet(str(ROOT/v['path']));assert im.size==((s+16)*10,)*2;x,y,w,h=v['rect'];assert w==h==s
  tile=im.crop((x,y,x+w,y+h));pixels[s]=np.asarray(tile);hashes[str(s)]=hashlib.sha256(pixels[s].tobytes()).hexdigest()
 key=hashlib.sha256((SIG+json.dumps(hashes,sort_keys=True)).encode()).hexdigest();cache=CACHE/f'{job["team"]}_{job["id"]}_{key[:20]}.npz';meta=cache.with_suffix('.json')
 if cache.exists() and meta.exists():
  saved=json.loads(meta.read_text());data=np.load(cache)
  if saved['pixel_hashes']==hashes and saved['protocol_signature']==SIG:return saved['record'],{s:data[f'e{s}'] for s in [128,256,384]}
 dst=np.array([[38.2946,51.6963],[73.5318,51.5014],[56.0252,71.7366],[41.5493,92.3655],[70.7299,92.2041]],np.float32);E={};landmarks={};details={}
 for s in [256,128,384]:
  img=cv2.cvtColor(pixels[s],cv2.COLOR_RGB2BGR);boxes,kps=rec.APP.det_model.detect(img,max_num=0);fallback=False
  if len(boxes)!=1:
   if s==128 and 256 in landmarks:kp=landmarks[256]*.5;fallback=True
   else:return {'id':job['id'],'team':job['team'],'error':f'{s}:face_count={len(boxes)}'},None
  else:kp=kps[0]
  landmarks[s]=kp;M,_=cv2.estimateAffinePartial2D(kp,dst,method=cv2.LMEDS)
  if M is None:return {'id':job['id'],'team':job['team'],'error':f'{s}:alignment'},None
  chip=cv2.warpAffine(img,M,(112,112),flags=cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT,borderValue=(0,0,0));feature=rec.APP.models['recognition'].get_feat(chip).flatten();E[s]=feature/np.linalg.norm(feature)
  details[str(s)]={'landmarks':kp.tolist(),'pixel_sha256':hashes[str(s)],'fallback_128_landmarks_from256':fallback}
 record={'id':job['id'],'team':job['team'],'details':details};np.savez_compressed(cache.with_suffix('.partial.npz'),**{f'e{s}':E[s] for s in [128,256,384]});cache.with_suffix('.partial.npz').replace(cache)
 data={'record':record,'pixel_hashes':hashes,'protocol_signature':SIG};tmp=meta.with_suffix('.partial.json');tmp.write_text(json.dumps(data));tmp.replace(meta)
 return record,E
def main():
 assert sha('/workspace/models/buffalo_l/w600k_r50.onnx')==MODEL_SHA and sha('/workspace/models/buffalo_l/det_10g.onnx')==DETECTOR_SHA
 assert (P/'baseline/delivered_embeddings.npz').exists(),'Preserve original v18 embeddings before final measurement'
 m=json.loads((OUT/'manifest.json').read_text());assert len(m['sheets'])==60;teams=[x['key'] for x in m['teams']];jobs=[{'id':x['id'],'team':t,'variants':x['variants'][t]['sheets']} for t in teams for x in m['identities']]
 targets={'v18_165','v18_169','v18_170','v18_174'};jobs.sort(key=lambda x:(x['id'] not in targets,teams.index(x['team']),x['id']))
 ids=[x['id'] for x in m['identities']];source=np.load(OUT/'identity_prescreen/embeddings.npz');old=np.load(P/'baseline/delivered_embeddings.npz');gray_results=[]
 E={s:np.zeros((10,200,512),np.float32) for s in [128,256,384]};records=[];errors=[]
 with concurrent.futures.ProcessPoolExecutor(max_workers=2,mp_context=multiprocessing.get_context('spawn'),initializer=rec.initialize) as pool:
  for i,(record,e) in enumerate(pool.map(measure,jobs,chunksize=4),1):
   if e is None:errors.append(record)
   else:
    records.append(record)
    ti=teams.index(record['team']);ki=ids.index(record['id'])
    for s in E:E[s][ti,ki]=e[s]
    if record['id'] in targets:
     metrics={}
     for s in [128,256,384]:
      ss=min(s,256);cross=source[f'e{ss}']@e[s];other=cross.copy();other[ki]=-2;legacy=source[f'ref{ss}']@e[s];same=old[f'e{ss}'][:,ki]@e[s];own=(old[f'e{ss}'][ti]@e[s]).argmax()==ki
      metrics[str(s)]={'passed':bool(other.max()<.4 and legacy.max()<.4 and same.min()>=.6 and cross.argmax()==ki and own),'other199_max':float(other.max()),'legacy160_max':float(legacy.max()),'same_original_all10_min':float(same.min())}
     item={'id':record['id'],'team':record['team'],'passed':all(x['passed'] for x in metrics.values()),'metrics':metrics};gray_results.append(item);(P/'final_gray_preflight.json').write_text(json.dumps(gray_results,indent=2));print('Actual compressed background revision',item['id'],item['team'],'passed',item['passed'],flush=True)
   if i%50==0:(P/'final_measurement_progress.json').write_text(json.dumps({'processed':i,'total':2000,'resolution_count':3,'errors':errors},indent=2));print('Measured actual final WebP',i,'/2000 at128,256,384',flush=True)
 d=OUT/'validation';(d/'v18b_detection_errors.json').write_text(json.dumps(errors,indent=2));(d/'v18b_detection_records.json').write_text(json.dumps(records,indent=2));assert not errors,errors
 np.savez_compressed(d/'v18b_delivered_embeddings.npz',ids=np.array([x['id'] for x in m['identities']]),teams=np.array(teams),**{f'e{s}':np.array(E[s]).reshape(10,200,512) for s in E})
 print('All6000 final decoded portraits measured. Final numerical validation is still required.',flush=True)
if __name__=='__main__':main()
