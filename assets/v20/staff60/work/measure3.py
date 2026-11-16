"""Raw ArcFace; only recognition input is aligned. Delivered photos are never warped."""
import os
os.environ['OMP_NUM_THREADS']='1'
os.environ['OPENBLAS_NUM_THREADS']='1'
from pathlib import Path
import json,hashlib,sys,concurrent.futures,multiprocessing
import numpy as np
from PIL import Image
P=Path(__file__).resolve().parent;OUT=P.parent
APP=None
def initialize():
 global APP
 import cv2,onnxruntime as ort
 from insightface.app import FaceAnalysis
 cv2.setNumThreads(1)
 options=ort.SessionOptions();options.intra_op_num_threads=1;options.inter_op_num_threads=1
 APP=FaceAnalysis(name='buffalo_l',root='/workspace',allowed_modules=['detection','recognition'],providers=['CPUExecutionProvider'],sess_options=options)
 APP.prepare(ctx_id=-1,det_size=(640,640),det_thresh=.55)
def measure(job):
 import cv2
 dst=np.array([[38.2946,51.6963],[73.5318,51.5014],[56.0252,71.7366],[41.5493,92.3655],[70.7299,92.2041]],np.float32)
 e={};record={'id':job['id'],'details':{}}
 for s in [128,256,384]:
  photo=Image.open(job[str(s)]).convert('RGB');assert photo.size==(s,s)
  img=cv2.cvtColor(np.array(photo),cv2.COLOR_RGB2BGR);boxes,kps=APP.det_model.detect(img,max_num=0)
  if len(boxes)!=1:return {**record,'error':f'{s}: face count {len(boxes)}'},None,None,None
  matrix,_=cv2.estimateAffinePartial2D(kps[0],dst,method=cv2.LMEDS)
  if matrix is None:return {**record,'error':f'{s}: alignment'},None,None,None
  aligned=cv2.warpAffine(img,matrix,(112,112),flags=cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT,borderValue=(0,0,0))
  feature=APP.models['recognition'].get_feat(aligned).flatten();e[s]=feature/np.linalg.norm(feature)
  record['details'][str(s)]={'bbox':boxes[0].tolist(),'landmarks':kps[0].tolist(),'pixel_sha256':hashlib.sha256(np.array(photo).tobytes()).hexdigest()}
 return record,e[128],e[256],e[384]
def run(jobs,destination):
 records=[];errors=[];ids=[];e128=[];e256=[];e384=[]
 with concurrent.futures.ProcessPoolExecutor(max_workers=2,mp_context=multiprocessing.get_context('spawn'),initializer=initialize) as pool:
  for i,(row,a,b,c) in enumerate(pool.map(measure,jobs),1):
   if a is None:errors.append(row)
   else:records.append(row);ids.append(row['id']);e128.append(a);e256.append(b);e384.append(c)
   if i%10==0:print('measured',i,'/',len(jobs),flush=True)
 destination=Path(destination)
 np.savez_compressed(destination.with_suffix('.npz'),ids=np.array(ids),e128=np.array(e128),e256=np.array(e256),e384=np.array(e384))
 destination.with_suffix('.json').write_text(json.dumps({'records':records,'errors':errors},indent=2))
 print('measurement complete:',len(ids),'valid;',len(errors),'errors',flush=True)
if __name__=='__main__':run(json.loads(Path(sys.argv[1]).read_text()),sys.argv[2])
