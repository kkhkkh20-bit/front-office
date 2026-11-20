import os
os.environ['OPENBLAS_NUM_THREADS']='1';os.environ['OMP_NUM_THREADS']='1'
from pathlib import Path
import json,sys,concurrent.futures,multiprocessing,hashlib
import numpy as np
from PIL import Image
import measure
W=Path('/dev/shm/v21b-work');D=W/'normalized_single_repair'
ANCHOR=np.array([130.98235626,118.22048492])
def process(c):
 import cv2
 try:
  native=Image.open(c['native_path']).convert('RGB');box=c['crop'];tile=native.crop(box);edge=min(tile.size);assert edge>=384
  tile=tile.crop((0,0,edge,edge));arr=np.array(tile);origin=np.array([0,0],dtype=int)
  for iteration in range(3):
   used_origin=origin.copy();rendered=cv2.copyMakeBorder(arr,edge,edge,edge,edge,cv2.BORDER_REPLICATE)[edge+origin[1]:2*edge+origin[1],edge+origin[0]:2*edge+origin[0]]
   preview=cv2.resize(rendered,(256,256),interpolation=cv2.INTER_AREA)
   boxes,kps=measure.APP.det_model.detect(cv2.cvtColor(preview,cv2.COLOR_RGB2BGR),max_num=0)
   if len(boxes)!=1:raise ValueError('face_count '+str(len(boxes)))
   delta=np.rint((kps[0].mean(0)-ANCHOR)*edge/256).astype(int)
   if np.max(np.abs(delta))<=1:break
   origin+=delta
  # Added canvas contains only extension of existing photo background/edge; retained facial pixels are unwarped.
  path=D/(c['id']+'.png');Image.fromarray(rendered).save(path,compress_level=1)
  record={**c,'normalized_path':str(path),'native_edge':edge,'translation_origin_xy':used_origin.tolist(),'center_256':kps[0].mean(0).tolist(),'status':'normalized_not_approved'}
  job={'id':c['id']}
  for s,q in [(128,85),(256,88),(384,89)]:
   path=D/f'{c["id"]}_{s}.webp';Image.fromarray(rendered).resize((s,s),Image.Resampling.LANCZOS).save(path,quality=q,method=0);job[str(s)]=str(path)
  return record,job
 except Exception as e:return {**c,'error':str(e)},None
if __name__=='__main__':
 D.mkdir(exist_ok=True);cs=json.load(open(W/'single_repair_candidates.json'));rows=[];jobs=[]
 with concurrent.futures.ProcessPoolExecutor(max_workers=2,mp_context=multiprocessing.get_context('spawn'),initializer=measure.initialize) as pool:
  for n,(row,job) in enumerate(pool.map(process,cs),1):
   rows.append(row)
   if job:jobs.append(job)
   if n%50==0:print('normalized',n,'/',len(cs),flush=True)
 (W/'single_repair_normalization.json').write_text(json.dumps(rows,indent=2));(W/'single_repair_jobs.json').write_text(json.dumps(jobs,indent=2));print('Normalized',len(jobs),'errors',len(cs)-len(jobs),flush=True)
