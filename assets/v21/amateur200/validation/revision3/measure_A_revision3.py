import os
os.environ['OPENBLAS_NUM_THREADS']='1';os.environ['OMP_NUM_THREADS']='1'
from pathlib import Path
import concurrent.futures,multiprocessing,json,hashlib
import numpy as np
from PIL import Image
import measure
W=Path('/dev/shm/v21b-work');R=W/'repo/assets/v21/amateur200';D=W/'A_revision3_cells';D.mkdir(exist_ok=True)
def work(job):
 import cv2
 dst=np.array([[38.2946,51.6963],[73.5318,51.5014],[56.0252,71.7366],[41.5493,92.3655],[70.7299,92.2041]],np.float32);row={'id':job['id'],'details':{}};e={}
 for s in [128,256,384]:
  data=job[str(s)]
  if data['cached']:
   row['details'][str(s)]=data['details'];e[s]=np.array(data['feature'],np.float32);row['details'][str(s)]['embedding_source']='exact decoded final-atlas RGB SHA256 equality to prior measured photo';continue
  im=np.array(Image.open(data['path']).convert('RGB'));assert hashlib.sha256(im.tobytes()).hexdigest()==data['pixel_sha256'];bgr=cv2.cvtColor(im,cv2.COLOR_RGB2BGR);boxes,kps=measure.APP.det_model.detect(bgr,max_num=0)
  if len(boxes)!=1:return {'id':job['id'],'error':str(s)+' face_count '+str(len(boxes))},None
  m,_=cv2.estimateAffinePartial2D(kps[0],dst,method=cv2.LMEDS);chip=cv2.warpAffine(bgr,m,(112,112),flags=cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT,borderValue=(0,0,0));v=measure.APP.models['recognition'].get_feat(chip).flatten();e[s]=v/np.linalg.norm(v);row['details'][str(s)]={'bbox':boxes[0].tolist(),'landmarks':kps[0].tolist(),'pixel_sha256':data['pixel_sha256'],'embedding_source':'fresh raw recognition from decoded revision3 final atlas cell'}
 return row,e
if __name__=='__main__':
 original=json.load(open(R/'validation/stage_a/photo_measurements.json'))['records'];old=np.load(R/'validation/stage_a/raw_embeddings.npz');arr={s:old[f'e{s}'] for s in [128,256,384]};oid={str(k):i for i,k in enumerate(old['ids'])};cache={s:{p['details'][str(s)]['pixel_sha256']:(p['details'][str(s)],arr[s][oid[p['id']]]) for p in original} for s in arr};rows=json.load(open(W/'A_revision3_provenance.json'));jobs={p['photo_id']:{'id':p['photo_id']} for p in rows};copies=0;total=0;sheet_receipts=[]
 for variant in dict.fromkeys(p['variant'] for p in rows):
  ps=[p for p in rows if p['variant']==variant]
  for s in [128,256,384]:
   path=W/f'A_revision3_sheets/{s}/{variant}.webp';sheet=Image.open(path).convert('RGB');sheet_receipts.append({'path':str(path),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'size':s,'variant':variant})
   for p in ps:
    i=p['index'];x=i%10*(s+16)+8;y=i//10*(s+16)+8;tile=sheet.crop((x,y,x+s,y+s));digest=hashlib.sha256(np.asarray(tile).tobytes()).hexdigest();total+=1
    if digest in cache[s]:
     d,v=cache[s][digest];jobs[p['photo_id']][str(s)]={'cached':True,'details':dict(d),'feature':v.tolist(),'pixel_sha256':digest};copies+=1
    else:
     dst=D/f'{p["photo_id"]}_{s}.png';tile.save(dst,compress_level=1);jobs[p['photo_id']][str(s)]={'cached':False,'path':str(dst),'pixel_sha256':digest}
  print('extracted',variant,'cached',copies,'/',total,flush=True)
 (W/'A_revision3_atlas_measure_jobs.json').write_text(json.dumps(list(jobs.values()),indent=2));(W/'A_revision3_sheet_receipts.json').write_text(json.dumps(sheet_receipts,indent=2));records=[];errors=[];vectors={s:[] for s in arr};ids=[]
 with concurrent.futures.ProcessPoolExecutor(max_workers=2,mp_context=multiprocessing.get_context('spawn'),initializer=measure.initialize) as pool:
  for i,(row,e) in enumerate(pool.map(work,jobs.values()),1):
   if e is None:errors.append(row)
   else:
    ids.append(row['id']);records.append(row)
    for s in vectors:vectors[s].append(e[s])
   if i%25==0:print('final A atlas measured',i,'/1200',flush=True)
   if i%100==0:
    np.savez_compressed(W/'A_revision3_atlas_checkpoint.npz',ids=np.array(ids),**{f'e{s}':np.array(v) for s,v in vectors.items()});(W/'A_revision3_atlas_checkpoint.json').write_text(json.dumps({'records':records,'errors':errors},indent=2))
 np.savez_compressed(W/'A_revision3_atlas_embeddings.npz',ids=np.array(ids),**{f'e{s}':np.array(v) for s,v in vectors.items()});(W/'A_revision3_atlas_measurements.json').write_text(json.dumps({'records':records,'errors':errors,'reused_exact_RGB_cells':copies,'total_cells':total},indent=2));print('Done',len(ids),'errors',len(errors),'exact_RGB_reused',copies,flush=True)
