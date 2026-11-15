"""Reproducible candidate prescreen, CPU buffalo_l, unmodified ArcFace cosine."""
import json,sys,hashlib
from pathlib import Path
import numpy as np
import cv2
from insightface.app import FaceAnalysis
ROOT=Path(__file__).resolve().parents[4]
OUT=Path(__file__).resolve().parent
app=FaceAnalysis(name='buffalo_l',root='/workspace',allowed_modules=['detection','recognition'],providers=['CPUExecutionProvider'])
app.prepare(ctx_id=-1,det_size=(640,640))
def embed(img):
    faces=app.get(img)
    if len(faces)!=1: raise ValueError(f'Expected exactly one face; got {len(faces)}')
    return faces[0].normed_embedding
sheet=cv2.imread(str(OUT/'B_001_020.png')); h,w=sheet.shape[:2]
emb=[]
for i in range(20):
    r,c=divmod(i,5)
    img=sheet[round(r*h/4)+2:round((r+1)*h/4)-2,round(c*w/5)+2:round((c+1)*w/5)-2]
    (OUT/'candidates').mkdir(exist_ok=True)
    cv2.imwrite(str(OUT/'candidates'/f'v18_{101+i:03d}.png'),img)
    emb.append(embed(img))
refs=[];refids=[]
for folder in ['batch01c/production100','batch01d/production60']:
    base=ROOT/'assets/v6'/folder;m=json.loads((base/'manifest.json').read_text())
    for x in m['identities']:
        v=x['variants']['seoul_comets']['sheets']['128'];p=Path(v['path'])
        if not (ROOT/p).exists(): p=base/p
        else: p=ROOT/p
        im=cv2.imread(str(p));a,b,c,d=v['rect'];refs.append(embed(im[b:b+d,a:a+c]));refids.append(x['id'])
e=np.array(emb);ref=np.array(refs);within=e@e.T;cross=e@ref.T
pairs=[{'a':f'pilot_{i+1:03d}','b':f'pilot_{j+1:03d}','cosine':float(within[i,j])} for i in range(20) for j in range(i+1,20)]
cp=[{'a':f'pilot_{i+1:03d}','b':rid,'cosine':float(cross[i,j])} for i in range(20) for j,rid in enumerate(refids)]
summary={'scope':'first 20 candidates only; not full production validation','model':'buffalo_l/w600k_r50.onnx','recognition_sha256':hashlib.sha256(Path('/workspace/models/buffalo_l/w600k_r50.onnx').read_bytes()).hexdigest(),'reference_scope':'existing 160 identities, decoded seoul_comets 128 runtime portraits','threshold':0.4,'within_pair_count':len(pairs),'cross_pair_count':len(cp),'within_max':max(x['cosine'] for x in pairs),'cross_max':max(x['cosine'] for x in cp),'violations':[x for x in pairs+cp if x['cosine']>=0.4]}
summary['passed']=not summary['violations']
(OUT/'first20_prescreen.json').write_text(json.dumps(summary,indent=2))
(OUT/'first20_pairs.json').write_text(json.dumps({'within':pairs,'cross':cp},indent=2))
np.savez_compressed(OUT/'first20_embeddings.npz',candidates=e,references=ref,reference_ids=refids)
print(json.dumps({k:v for k,v in summary.items() if k!='violations'},indent=2));print('violations',len(summary['violations']))
