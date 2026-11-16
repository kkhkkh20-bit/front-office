"""Re-measure the actual delivered WebP pixels and enforce the v20b pair-specific baseline gates.

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
from baseline_audit import evaluate
def main():
 protocol=json.loads((OUT/'validation/protocol.json').read_text())
 for filename,key in [('w600k_r50.onnx','recognizer_sha256'),('det_10g.onnx','detector_sha256')]:
  assert hashlib.sha256((Path('/workspace/models/buffalo_l')/filename).read_bytes()).hexdigest()==protocol[key]
 manifest=json.loads((OUT/'manifest.json').read_text());ready=[x for x in manifest['identities'] if x['status']=='ready'];refs=np.load(OUT/'validation/reference_embeddings.npz');b={k:refs[k] for k in refs.files};refids=b['ids'].tolist();assert len(set(refids))==486
 frozen=json.loads((OUT/'validation/v20b/frozen_035_manifest.json').read_text());proof=json.loads((OUT/'validation/v20b/frozen_035_pixel_proof.json').read_text());frozenhash={(x['team'],str(x['size'])):x['pixel_sha256'] for x in proof['proof']}
 with tempfile.TemporaryDirectory(prefix='v20-pixel-recheck-') as directory:
  temp=Path(directory);jobs=[]
  for person in ready:
   for team,variant in person['variants'].items():
    job={'id':person['v7_identity_id']+'__'+team}
    for size in ['128','256','384']:
     sheet=variant['sheets'][size];path=OUT/'sheets'/size/(team+'.webp');im=Image.open(path);assert im.mode=='RGB';x,y,w,h=sheet['rect'];dest=temp/f'{job["id"]}_{size}.png';im.crop((x,y,x+w,y+h)).save(dest);job[size]=str(dest)
     if person['v7_identity_id'].endswith('_035'):
      assert variant['source']==frozen['variants'][team]['source']
      assert hashlib.sha256(im.crop((x,y,x+w,y+h)).tobytes()).hexdigest()==frozenhash[team,size]
    jobs.append(job)
  run(jobs,temp/'actual');z=np.load(temp/'actual.npz');a={k:z[k] for k in z.files};assert len(a['ids'])==len(ready)*10
  saved=np.load(OUT/'validation/v20b/sealed_embeddings.npz');savedids=saved['ids'].tolist();savedfeatures={k:saved[k] for k in saved.files};pair_count=0;old_count=0
  evaluated=evaluate(a,b);assert len(evaluated)==len(jobs) and all(x['passed'] for x in evaluated),[x for x in evaluated if not x['passed']]
  for size in [128,256,384]:
   e=a[f'e{size}'];r=b[f'e{128 if size==128 else 256}'];scores=e@r.T
   for i,identity in enumerate(a['ids']):
    person=identity.split('__')[0];own=refids.index(person);assert scores[i,own]>=.60
    assert e[i]@savedfeatures[f'e{size}'][savedids.index(identity)]>.999999
    old_count+=485
   for i,j in itertools.combinations(range(len(e)),2):
    same=a['ids'][i].split('__')[0]==a['ids'][j].split('__')[0]
    if same:assert float(e[i]@e[j])>=.60;pair_count+=1
  print(json.dumps({'policy':'v20b','published_subset_passed':True,'full_request_complete':len(ready)==60,'published_people':len(ready),'published_photos':len(jobs),'other_reference_comparisons':old_count,'same_person_team_pair_comparisons':pair_count,'new_collisions':0,'frozen_035_photo_sizes_verified':30}))
if __name__=='__main__':main()
