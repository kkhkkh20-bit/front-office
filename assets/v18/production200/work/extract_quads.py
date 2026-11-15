from pathlib import Path
import json,time,hashlib
import numpy as np,cv2,onnxruntime as ort
from PIL import Image,ImageOps
from insightface.app import FaceAnalysis
P=Path(__file__).resolve().parent;ROOT=P.parents[3];D=P/'round12_quads';D.mkdir(exist_ok=True);(D/'candidates').mkdir(exist_ok=True)
s=ort.SessionOptions();s.intra_op_num_threads=1;s.inter_op_num_threads=1;a=FaceAnalysis(name='buffalo_l',root='/workspace',allowed_modules=['detection'],providers=['CPUExecutionProvider'],sess_options=s);a.prepare(ctx_id=-1,det_size=(640,640),det_thresh=.35);seen=set();records=[];errors=[]
while True:
 changed=False
 for f in sorted(D.glob('batch[0-9][0-9].json')):
  if f.stem in seen:continue
  try:b=json.loads(f.read_text())
  except json.JSONDecodeError:continue
  seen.add(f.stem);changed=True;im=Image.open(ROOT/b['source_path']).convert('RGB');w,h=im.size;boxes,_=a.det_model.detect(cv2.cvtColor(np.array(im),cv2.COLOR_RGB2BGR),max_num=0);boxes=[q for q in boxes if (q[2]-q[0])*(q[3]-q[1])>=w*h*.004];bad=[]
  for r in range(2):
   xs=sorted((q[0]+q[2])/2 for q in boxes if r<=(q[1]+q[3])/2/h*2<r+1)
   if len(xs)!=2 or any(abs(x-(c+.5)*w/2)>w/2*.17 for c,x in enumerate(xs)):bad.append(r)
  for i,x in enumerate(b['entries']):
   r,c=divmod(i,2);key=x['id']
   if r in bad:errors.append({'key':key,'error':'incorrect row layout'});continue
   rect=[round(c*w/2)+2,round(r*h/2)+2,round((c+1)*w/2)-2,round((r+1)*h/2)-2];photo=ImageOps.fit(im.crop(rect),(256,256),Image.Resampling.LANCZOS,centering=(.5,.25));path=D/'candidates'/(key+'.png');photo.save(path);records.append({'key':key,'kind':'candidate','path':str(path.relative_to(ROOT)),'source':b['source_path'],'rect_xyxy':rect,'attributes':x,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
  print('extracted diverse grid',b['batch'],'portraits',len(records),'errors',len(errors),flush=True)
 if changed:
  (D/'candidate_sources.json').write_text(json.dumps(records,ensure_ascii=False,indent=2));(D/'progress.json').write_text(json.dumps({'processed_grids':len(seen),'candidate_count':len(records),'errors':errors},indent=2))
 if (D/'GENERATION_FINISHED').exists() or len(seen)>=8:break
 time.sleep(4)
