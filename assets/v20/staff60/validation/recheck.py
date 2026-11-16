"""Re-measure the actual delivered WebP pixels and enforce the unchanged gates.

Requires Pillow, numpy, opencv-python-headless, insightface, onnxruntime, and
the buffalo_l models at /workspace/models/buffalo_l (same paths as production).
Run: python assets/v20/staff60/validation/recheck.py
"""
import os
os.environ['OPENBLAS_NUM_THREADS']='1'
from pathlib import Path
import json,hashlib,sys,tempfile,itertools
import numpy as np
from PIL import Image
OUT=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(OUT/'work'))
from measure3 import run
def main():
 protocol=json.loads((OUT/'validation/protocol.json').read_text())
 for filename,key in [('w600k_r50.onnx','recognizer_sha256'),('det_10g.onnx','detector_sha256')]:
  assert hashlib.sha256((Path('/workspace/models/buffalo_l')/filename).read_bytes()).hexdigest()==protocol[key]
 manifest=json.loads((OUT/'manifest.json').read_text());ready=[x for x in manifest['identities'] if x['status']=='ready'];refs=np.load(OUT/'validation/reference_embeddings.npz');b={k:refs[k] for k in refs.files};refids=b['ids'].tolist()
 with tempfile.TemporaryDirectory(prefix='v20-pixel-recheck-') as directory:
  temp=Path(directory);jobs=[]
  for person in ready:
   for team,variant in person['variants'].items():
    job={'id':person['v7_identity_id']+'__'+team}
    for size in ['128','256','384']:
     sheet=variant['sheets'][size];path=OUT/'sheets'/size/(team+'.webp');im=Image.open(path);assert im.mode=='RGB';x,y,w,h=sheet['rect'];dest=temp/f'{job["id"]}_{size}.png';im.crop((x,y,x+w,y+h)).save(dest);job[size]=str(dest)
    jobs.append(job)
  run(jobs,temp/'actual');z=np.load(temp/'actual.npz');a={k:z[k] for k in z.files};assert len(a['ids'])==len(ready)*10
  saved=np.load(OUT/'validation/final_embeddings.npz');savedids=saved['ids'].tolist();pair_count=0;old_count=0
  for size in [128,256,384]:
   e=a[f'e{size}'];r=b[f'e{128 if size==128 else 256}'];scores=e@r.T
   for i,identity in enumerate(a['ids']):
    person=identity.split('__')[0];own=refids.index(person);assert scores[i,own]>=.60;scores[i,own]=-1;assert scores[i].max()<.40
    assert e[i]@saved[f'e{size}'][savedids.index(identity)]>.999999
    old_count+=485
   for i,j in itertools.combinations(range(len(e)),2):
    same=a['ids'][i].split('__')[0]==a['ids'][j].split('__')[0];score=float(e[i]@e[j]);assert score>=.60 if same else score<.40
    if same:pair_count+=1
  print(json.dumps({'published_subset_passed':True,'full_request_complete':False,'published_people':len(ready),'published_photos':len(jobs),'other_reference_comparisons':old_count,'same_person_team_pair_comparisons':pair_count}))
if __name__=='__main__':main()
