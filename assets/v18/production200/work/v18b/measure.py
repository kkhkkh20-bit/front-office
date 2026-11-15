import os
os.environ['OMP_NUM_THREADS']='1';os.environ['OPENBLAS_NUM_THREADS']='1'
from pathlib import Path
import json,hashlib,sys,concurrent.futures,multiprocessing
import numpy as np
from PIL import Image
P=Path(__file__).resolve().parent;OUT=P.parents[1];ROOT=P.parents[4]
APP=None
SIZES=[128,256,384]
def initialize():
 global APP
 import cv2,onnxruntime as ort
 from insightface.app import FaceAnalysis
 cv2.setNumThreads(1);opt=ort.SessionOptions();opt.intra_op_num_threads=1;opt.inter_op_num_threads=1
 APP=FaceAnalysis(name='buffalo_l',root='/workspace',allowed_modules=['detection','recognition'],providers=['CPUExecutionProvider'],sess_options=opt);APP.prepare(ctx_id=-1,det_size=(640,640),det_thresh=.55)
def measure(job):
 import cv2
 dst=np.array([[38.2946,51.6963],[73.5318,51.5014],[56.0252,71.7366],[41.5493,92.3655],[70.7299,92.2041]],np.float32);features={};details={}
 photo=Image.open(job['path']).convert('RGB');assert photo.width>=384 and photo.height>=384 and abs(photo.width-photo.height)<2
 for s in SIZES:
  tile=photo.resize((s,s),Image.Resampling.LANCZOS);img=cv2.cvtColor(np.array(tile),cv2.COLOR_RGB2BGR);boxes,kps=APP.det_model.detect(img,max_num=0)
  if len(boxes)!=1:return {**job,'error':f'{s}: face_count={len(boxes)}'},None
  M,_=cv2.estimateAffinePartial2D(kps[0],dst,method=cv2.LMEDS)
  if M is None:return {**job,'error':f'{s}: alignment'},None
  chip=cv2.warpAffine(img,M,(112,112),flags=cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT,borderValue=(0,0,0));e=APP.models['recognition'].get_feat(chip).flatten();features[s]=e/np.linalg.norm(e);details[str(s)]={'bbox':boxes[0].tolist(),'landmarks':kps[0].tolist(),'pixel_sha256':hashlib.sha256(np.asarray(tile).tobytes()).hexdigest()}
 return {**job,'details':details,'native_sha256':hashlib.sha256(Path(job['path']).read_bytes()).hexdigest()},features
if __name__=='__main__':
 jobs=json.loads(Path(sys.argv[1]).read_text());rows=[];errors=[];E={s:[] for s in SIZES}
 with concurrent.futures.ProcessPoolExecutor(max_workers=2,mp_context=multiprocessing.get_context('spawn'),initializer=initialize) as pool:
  for row,e in pool.map(measure,jobs):
   if e is None:errors.append(row)
   else:
    rows.append(row)
    for s in SIZES:E[s].append(e[s])
 out=Path(sys.argv[2]);out.with_suffix('.json').write_text(json.dumps({'records':rows,'errors':errors},indent=2));np.savez_compressed(out.with_suffix('.npz'),ids=np.array([r['id'] for r in rows]),teams=np.array([r['team'] for r in rows]),**{f'e{s}':np.array(E[s]) for s in SIZES});print('Measured',len(rows),'errors',len(errors))
