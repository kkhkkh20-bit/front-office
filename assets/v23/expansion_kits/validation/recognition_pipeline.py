import os
os.environ['OMP_NUM_THREADS']='1';os.environ['OPENBLAS_NUM_THREADS']='1'
from pathlib import Path
import json,hashlib,numpy as np
W=Path('/dev/shm/v23-work');APP=None
def initialize():
 global APP
 import cv2,onnxruntime as ort
 from insightface.app import FaceAnalysis
 cv2.setNumThreads(1);so=ort.SessionOptions();so.intra_op_num_threads=1;so.inter_op_num_threads=1
 APP=FaceAnalysis(name='buffalo_l',root=str(W),allowed_modules=['detection','recognition'],providers=['CPUExecutionProvider'],sess_options=so);APP.prepare(ctx_id=-1,det_size=(640,640),det_thresh=.5)
def measure(job):
 from PIL import Image
 import cv2
 from insightface.utils.face_align import norm_crop
 im=Image.open(job['path']).convert('RGB')
 if 'rect' in job:
  x,y,w,h=job['rect'];im=im.crop((x,y,x+w,y+h))
 bgr=cv2.cvtColor(np.array(im),cv2.COLOR_RGB2BGR);b,k=APP.det_model.detect(bgr,max_num=0)
 row={k:v for k,v in job.items() if k!='path'};row.update(pixel_sha256=hashlib.sha256(im.tobytes()).hexdigest(),face_count=len(b))
 if len(b)!=1:return row,None
 e=APP.models['recognition'].get_feat(norm_crop(bgr,landmark=k[0],image_size=112)).flatten();e=(e/np.linalg.norm(e)).astype(np.float32)
 row.update(bbox=b[0].tolist(),landmarks=k[0].tolist(),center_5pt=k[0].mean(axis=0).tolist(),center_bbox=((b[0][:2]+b[0][2:4])/2).tolist())
 return row,e
def run(jobs,name):
 import concurrent.futures,multiprocessing
 rows=[];E=[]
 with concurrent.futures.ProcessPoolExecutor(max_workers=2,initializer=initialize,mp_context=multiprocessing.get_context('spawn')) as ex:
  for i,(r,e) in enumerate(ex.map(measure,jobs),1):
   rows.append(r);E.append(e if e is not None else np.full(512,np.nan,np.float32))
   if i%40==0:print(name,i,'/',len(jobs),flush=True)
 (W/(name+'.json')).write_text(json.dumps(rows,indent=2));np.savez_compressed(W/(name+'.npz'),embeddings=np.array(E,dtype=np.float32));print(name,'DONE',len(rows),flush=True)
if __name__=='__main__':
 import sys
 people=json.load(open(W/'people.json'))
 if sys.argv[1]=='refs':jobs=[{'id':c['id'],'resolution':n,'path':str(W/'refs'/f"{c['id']}_{n}.png")} for n in [128,256] for c in people];run(jobs,'reference_measurements')
 else:run(json.load(open(sys.argv[1])),'final_measurements')
