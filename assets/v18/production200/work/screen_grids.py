"""Measure additional 4x4 candidate sheets, retaining real pixels and every score.
Reject rows with an incorrect layout; never invent missing cells or stretch faces.
"""
from pathlib import Path
import json,time,hashlib
import numpy as np,cv2,onnxruntime as ort
from PIL import Image,ImageOps
from insightface.app import FaceAnalysis
P=Path(__file__).resolve().parent;ROOT=P.parents[3];D=P/'round05_grids';D.mkdir(exist_ok=True);(D/'candidates').mkdir(exist_ok=True)
s=ort.SessionOptions();s.intra_op_num_threads=1;s.inter_op_num_threads=1
app=FaceAnalysis(name='buffalo_l',root='/workspace',allowed_modules=['detection','recognition'],providers=['CPUExecutionProvider'],sess_options=s);app.prepare(ctx_id=-1,det_size=(640,640))
seen=set();records=[];errors=[];values={128:[],256:[]};batch_reports=[]
while True:
 changed=False
 for meta in sorted(D.glob('batch[0-9][0-9].json')):
  if meta.stem in seen:continue
  try:b=json.loads(meta.read_text())
  except json.JSONDecodeError:continue
  seen.add(meta.stem);changed=True;im=Image.open(ROOT/b['source_path']).convert('RGB');w,h=im.size;assert len(b['ids'])==16 and len(set(b['ids']))==16
  # Detect sheet layout separately from the actual 128/256 recognition pipeline.
  img=cv2.cvtColor(np.array(im),cv2.COLOR_RGB2BGR);app.det_model.det_thresh=.35;boxes,_=app.det_model.detect(img,max_num=0);app.det_model.det_thresh=.5
  boxes=[q for q in boxes if (q[2]-q[0])*(q[3]-q[1])>=w*h*.004];bad_rows=[]
  for row in range(4):
   row_boxes=[q for q in boxes if row<=((q[1]+q[3])/2)/h*4<row+1];cx=sorted((q[0]+q[2])/2 for q in row_boxes)
   if len(cx)!=4 or any(abs(x-(i+.5)*w/4)>w/4*.17 for i,x in enumerate(cx)):bad_rows.append(row)
  batch_reports.append({'batch':b['batch'],'detected_faces':len(boxes),'rejected_rows':bad_rows})
  for i,rid in enumerate(b['ids']):
   row,col=divmod(i,4);key=f"r05_b{b['batch']:02d}_{rid}"
   if row in bad_rows:errors.append({'candidate_key':key,'id':rid,'error':'incorrect or uncertain row layout'});continue
   rect=[round(col*w/4)+2,round(row*h/4)+2,round((col+1)*w/4)-2,round((row+1)*h/4)-2];photo=ImageOps.fit(im.crop(rect),(256,256),Image.Resampling.LANCZOS,centering=(.5,.25));path=D/'candidates'/(key+'.png');photo.save(path);e={}
   try:
    for n in values:
     faces=app.get(cv2.cvtColor(np.array(photo.resize((n,n),Image.Resampling.LANCZOS)),cv2.COLOR_RGB2BGR))
     if len(faces)!=1:raise ValueError(f'{n}: expected 1 face, got {len(faces)}')
     e[n]=faces[0].normed_embedding
   except ValueError as err:errors.append({'candidate_key':key,'id':rid,'error':str(err)});continue
   records.append({'candidate_key':key,'id':rid,'crop':str(path.relative_to(ROOT)),'source':b['source_path'],'rect_xyxy':rect,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
   for n in values:values[n].append(e[n])
  print('screened grid',b['batch'],'valid candidates',len(records),'errors',len(errors),flush=True)
 if changed:
  (D/'candidate_sources.json').write_text(json.dumps(records,indent=2));np.savez_compressed(D/'arcface_scores.tmp.npz',ids=np.array([x['id'] for x in records]),candidate_keys=np.array([x['candidate_key'] for x in records]),embeddings_128=np.array(values[128]),embeddings_256=np.array(values[256]));(D/'arcface_scores.tmp.npz').replace(D/'arcface_scores.npz');(D/'screen_progress.json').write_text(json.dumps({'processed_batches':len(seen),'scored_candidates':len(records),'errors':errors,'batch_layouts':batch_reports,'production_complete':False},indent=2))
 if (D/'GENERATION_FINISHED').exists() or len(seen)>=14:break
 time.sleep(4)
