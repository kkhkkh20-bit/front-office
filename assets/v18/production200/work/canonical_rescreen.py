"""Reproduce the existing v6c/v13 ArcFace protocol against all 160 original masters.
Photos are never geometrically warped as assets. LMEDS alignment is only the model input.
"""
import os
os.environ.setdefault('OMP_NUM_THREADS','1');os.environ.setdefault('OPENBLAS_NUM_THREADS','1')
from pathlib import Path
import json,hashlib,shutil,concurrent.futures,multiprocessing
import numpy as np
P=Path(__file__).resolve().parent;ROOT=P.parents[3];D=P/'canonical';D.mkdir(exist_ok=True)
PROTO={'recognizer':'w600k_r50.onnx','recognizer_sha256':'4c06341c33c2ca1f86781dab0e829f88ad5b64be9fba56e56bc9ebdefc619e43','detector':'det_10g.onnx','detector_sha256':'5838f7fe053675b1c7a08b633df49e7af5495cee0493c7dcf6697200b85b5b91','detector_size':640,'detector_threshold':.55,'alignment':'cv2.estimateAffinePartial2D LMEDS to standard ArcFace112, RGB [-1,1], raw L2-normalized cosine','source_resize':'PIL LANCZOS, isotropic square fit centered .5,.25; asset pixels are not affine aligned'}
SIG=hashlib.sha256(json.dumps(PROTO,sort_keys=True).encode()).hexdigest()[:12]
APP=None
OLD_BY_KEY={}
for prior_file in [D/"candidate_records.json",D/"reference_records.json"]:
 if prior_file.exists():
  for prior in json.loads(prior_file.read_text()):OLD_BY_KEY[prior["key"]]=prior

def initialize():
 global APP
 import cv2,onnxruntime as ort
 from insightface.app import FaceAnalysis
 cv2.setNumThreads(1);s=ort.SessionOptions();s.intra_op_num_threads=1;s.inter_op_num_threads=1
 APP=FaceAnalysis(name='buffalo_l',root='/workspace',allowed_modules=['detection','recognition'],providers=['CPUExecutionProvider'],sess_options=s);APP.prepare(ctx_id=-1,det_size=(640,640),det_thresh=.55)

def measure(task):
 import cv2
 from PIL import Image,ImageOps
 key=task['key'];safe=key.replace('/','__');raw=Path(task['path']);source_sha=hashlib.sha256(raw.read_bytes()).hexdigest();cache=D/'cache'/(SIG+'_'+source_sha+'.npz');meta=D/'cache'/(SIG+'_'+source_sha+'.json');cache.parent.mkdir(exist_ok=True)
 out=D/('reference_masters' if task['kind']=='reference' else 'masters')/(safe+'.png');out.parent.mkdir(exist_ok=True)
 prior=OLD_BY_KEY.get(key)
 if prior and prior.get('source_sha256')==source_sha and out.exists() and cache.exists() and meta.exists():
  master_sha=hashlib.sha256(out.read_bytes()).hexdigest()
  if master_sha==prior.get('master_sha256'):
   saved=json.loads(meta.read_text());data=np.load(cache);record={**task,'original_path':str(raw),'source_sha256':source_sha,'master_path':str(out.relative_to(ROOT)),'master_sha256':master_sha};return {**record,**saved},data['e128'],data['e256']
 im=Image.open(raw).convert('RGB');photo=ImageOps.fit(im,(256,256),Image.Resampling.LANCZOS,centering=(.5,.25));photo.save(out)
 record={**task,'original_path':str(raw),'source_sha256':source_sha,'master_path':str(out.relative_to(ROOT)),'master_sha256':hashlib.sha256(out.read_bytes()).hexdigest()}
 if cache.exists() and meta.exists():
  saved=json.loads(meta.read_text());data=np.load(cache);return {**record,**saved},data['e128'],data['e256']
 dst=np.array([[38.2946,51.6963],[73.5318,51.5014],[56.0252,71.7366],[41.5493,92.3655],[70.7299,92.2041]],dtype=np.float32);emb={};landmarks={};details={};fallback=[]
 for n in [256,128]:
  img=cv2.cvtColor(np.array(photo.resize((n,n),Image.Resampling.LANCZOS)),cv2.COLOR_RGB2BGR);boxes,kps=APP.det_model.detect(img,max_num=0)
  if len(boxes)!=1:
   if n==128 and 256 in landmarks:kp=landmarks[256]*.5;fallback.append('128 landmarks scaled from256; recognition uses actual128 pixels')
   else:return {**record,'error':f'{n}: expected exactly1 detected face, got {len(boxes)}'},None,None
  else:kp=kps[0];details[str(n)]={'bbox':boxes[0].tolist(),'landmarks':kp.tolist()}
  landmarks[n]=kp;matrix,inliers=cv2.estimateAffinePartial2D(kp,dst,method=cv2.LMEDS)
  if matrix is None:return {**record,'error':f'{n}: affine alignment failed'},None,None
  chip=cv2.warpAffine(img,matrix,(112,112),flags=cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT,borderValue=(0,0,0));feature=APP.models['recognition'].get_feat(chip).flatten();emb[n]=feature/np.linalg.norm(feature)
 metadata={'details':details,'fallback':fallback};np.savez_compressed(cache,e128=emb[128],e256=emb[256]);meta.write_text(json.dumps(metadata));return {**record,**metadata},emb[128],emb[256]

def catalog():
 plan={x['id']:x for x in json.loads((P/'planned_identities.json').read_text())};tasks=[]
 for folder in ['round01','round02_natural','firefly/round03','round04_single','round05_grids','nano']:
  path=P/folder/'candidate_sources.json'
  if not path.exists():continue
  for row in json.loads(path.read_text()):
   rid=row['id'];key=row.get('candidate_key',folder+'/'+rid)
   if folder=='firefly/round03' and rid in ['v18_083','v18_104','v18_106','v18_109']:continue
   tasks.append({'key':key,'kind':'candidate','path':str(ROOT/(row.get('crop') or row['path'])),'attributes':plan[rid]})
 for rid in ['v18_083','v18_104','v18_106','v18_109']:
  x=dict(plan[rid]);x['appearance_brief']=json.loads((P/'source_overrides.json').read_text())[rid]['brief'];tasks.append({'key':'cleanup/'+rid,'kind':'candidate','path':str(P/'cleanup/masters'/(rid+'.png')),'attributes':x,'visual_review_passed':True})
 for i in range(20):
  x=dict(plan['v18_114' if i in [5,13] else 'v18_082']);x.update({'age':19,'ethnicity':'Korean','tags':{'glasses':i in [5,13],'facial_hair':False}})
  tasks.append({'key':f'pilot_{i+1:03d}','kind':'candidate','path':str(P/'candidates'/f'pilot_{i+1:03d}.png'),'attributes':x})
 for folder in ['round06_diverse','round07_targeted','round08_pool','round09_individual','round10_casting','round11_young_adults','round12_quads','free_characters','cleanup_young','cleanup_final']:
  extra=P/folder/'candidate_sources.json'
  if extra.exists():
   for item in json.loads(extra.read_text()):
    tasks.append({'key':item['key'],'kind':'candidate','path':str(ROOT/item['path']),'attributes':item['attributes']})
 old100=ROOT/'assets/v6/batch01c/production100/identity_prescreen/masters256';old60=Path('/workspace/v13_prescreen_refs/assets/v6/batch01d/production60/identity_prescreen/masters256')
 for source in sorted(old100.glob('*.png'))+sorted(old60.glob('*.png')):tasks.append({'key':source.stem,'kind':'reference','path':str(source)})
 excluded=set(json.loads((P/'visual_exclusions.json').read_text())['excluded_keys'])
 excluded.update(x['replaces'] for x in json.loads((P/'cleanup_young/candidate_sources.json').read_text()))
 tasks=[t for t in tasks if t['key'] not in excluded]
 final_clean=P/'cleanup_final/candidate_sources.json'
 if final_clean.exists():
  groups={t['key']:t['replaces'] for t in json.loads(final_clean.read_text())}
  for t in tasks:t['same_person_group']=groups.get(t['key'],t['key'])
 assert sum(x['kind']=='reference' for x in tasks)==160
 assert len(set(x['key'] for x in tasks))==len(tasks)
 return tasks

if __name__=='__main__':
 for name,field in [('w600k_r50.onnx','recognizer_sha256'),('det_10g.onnx','detector_sha256')]:assert hashlib.sha256((Path('/workspace/models/buffalo_l')/name).read_bytes()).hexdigest()==PROTO[field]
 tasks=catalog();(D/'catalog.json').write_text(json.dumps(tasks,ensure_ascii=False,indent=2));(D/'protocol.json').write_text(json.dumps(PROTO,indent=2));records=[];E={128:[],256:[]};refrows=[];R={128:[],256:[]};errors=[]
 with concurrent.futures.ProcessPoolExecutor(max_workers=2,mp_context=multiprocessing.get_context('spawn'),initializer=initialize) as pool:
  futures=[pool.submit(measure,t) for t in tasks]
  for done,future in enumerate(concurrent.futures.as_completed(futures),1):
   row,e128,e256=future.result()
   if e128 is None:errors.append(row)
   elif row['kind']=='reference':refrows.append(row);R[128].append(e128);R[256].append(e256)
   else:records.append(row);E[128].append(e128);E[256].append(e256)
   if done%25==0:
    (D/'progress.json').write_text(json.dumps({'processed':done,'total':len(tasks),'valid_candidates':len(records),'valid_references':len(refrows),'errors':errors},indent=2));print('canonical measured',done,'/',len(tasks),'errors',len(errors),flush=True)
 assert len(refrows)==160,'All160 original references must be measurable'
 order=sorted(range(160),key=lambda i:refrows[i]['key']);refrows=[refrows[i] for i in order];R={k:np.array(v)[order] for k,v in R.items()};E={k:np.array(v) for k,v in E.items()}
 np.savez_compressed(D/'embeddings.partial.npz',candidate_keys=np.array([x['key'] for x in records]),e128=E[128],e256=E[256],reference_ids=np.array([x['key'] for x in refrows]),ref128=R[128],ref256=R[256]);(D/'embeddings.partial.npz').replace(D/'embeddings.npz');(D/'candidate_records.json').write_text(json.dumps(records,ensure_ascii=False,indent=2));(D/'reference_records.json').write_text(json.dumps(refrows,indent=2));(D/'errors.json').write_text(json.dumps(errors,indent=2))
 # Compare the reproduced reference features to the original v13 delivery's cached ones.
 legacy=np.load('/workspace/v13_prescreen_refs/assets/v6/batch01d/production60/identity_prescreen/arcface_embeddings.npz');oldids=list(legacy['ids']);newids=[x['key'] for x in refrows];check={}
 for n in [128,256]:
  similarities=[float(R[n][newids.index(str(rid))]@legacy[f'e{n}'][j]) for j,rid in enumerate(oldids)];check[str(n)]={'same_original_master_cosine_min':min(similarities),'mean':float(np.mean(similarities))}
 (D/'legacy_protocol_reproduction.json').write_text(json.dumps(check,indent=2));(D/'progress.json').write_text(json.dumps({'complete':True,'processed':len(tasks),'total':len(tasks),'valid_candidates':len(records),'valid_references':len(refrows),'error_count':len(errors),'legacy_reproduction':check},indent=2));print(json.dumps({'canonical_candidates':len(records),'references':len(refrows),'errors':len(errors),'legacy_reproduction':check},indent=2))
