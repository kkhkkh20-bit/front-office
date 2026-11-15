from pathlib import Path
import json,hashlib,numpy as np,cv2,onnxruntime as ort
from PIL import Image
from insightface.app import FaceAnalysis
P=Path(__file__).resolve().parent;ROOT=P.parents[3];D=P/'nano';b=json.loads((D/'batch04.json').read_text());im=Image.open(ROOT/b['source_path']).convert('RGB');w,h=im.size;(D/'masters').mkdir(exist_ok=True)
s=ort.SessionOptions();s.intra_op_num_threads=1;s.inter_op_num_threads=1;a=FaceAnalysis(name='buffalo_l',root='/workspace',allowed_modules=['detection','recognition'],providers=['CPUExecutionProvider'],sess_options=s);a.prepare(ctx_id=-1,det_size=(640,640));E={128:[],256:[]};records=[]
for i,rid in enumerate(b['ids']):
 r,c=divmod(i,2);rect=[round(c*w/2),round(r*h/2),round((c+1)*w/2),round((r+1)*h/2)];photo=im.crop(rect).resize((256,256),Image.Resampling.LANCZOS);path=D/'masters'/(rid+'.png');photo.save(path)
 for n in E:
  faces=a.get(cv2.cvtColor(np.array(photo.resize((n,n),Image.Resampling.LANCZOS)),cv2.COLOR_RGB2BGR));assert len(faces)==1;E[n].append(faces[0].normed_embedding)
 records.append({'id':rid,'candidate_key':'nano/'+rid,'crop':str(path.relative_to(ROOT)),'source':b['source_path'],'rect_xyxy':rect,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'visual_review_passed':True})
(D/'candidate_sources.json').write_text(json.dumps(records,indent=2));np.savez_compressed(D/'arcface_scores.npz',ids=np.array(b['ids']),embeddings_128=np.array(E[128]),embeddings_256=np.array(E[256]));print('Measured 4 natural Nano candidates at actual128/256')
