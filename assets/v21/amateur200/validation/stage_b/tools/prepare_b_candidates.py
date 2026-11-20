import os
os.environ['OPENBLAS_NUM_THREADS']='1'
from pathlib import Path
import json,hashlib
from PIL import Image
R=Path('/dev/shm/v21b-work/repo/assets/v21/amateur200');W=Path('/dev/shm/v21b-work')
official=json.load(open(R/'manifest.json'))['identities']; families=json.load(open(R/'family_review_manifest.json'))['identities'];fm={p['id']:p for p in families}
used={fm[p['source_person_id']]['seed_id'] for p in official if p['source_person_id'] in fm}
# The remaining eight first-delivery identities were added from these frozen seed people.
new={'n000':'pool_0266_0','n002':'pool_0032_1','n008':'pool_0006_0','n009':'pool_0002_0','n012':'pool_0021_0','n016':'pool_0065_1','n019':'pool_0005_2','n020':'pool_0090_2'}
used.update(new[p['source_person_id']] for p in official if p['source_person_id'] in new)
qc=json.load(open(R/'validation/source_pool_screen.json'))['reviews'];sources=[];seen=set(used)
for filename in ['direct_master_review_manifest.json','review_manifest.json','new_master_review_manifest.json']:
 for c in json.load(open(R/filename))['candidates']:
  seed=c['seed_id']
  if seed in seen or qc.get(seed,{}).get('status')=='rejected':continue
  seen.add(seed);sources.append({'id':'b_'+c['candidate_id'],'seed_id':seed,'age':c['proposed_age'],'level':c['proposed_level'],'glasses':c['tags']['glasses'],'native_path':str(R/c['native']['path']),'crop':c['native']['crop_xyxy'],'source':'retained_review_candidate'})
for p in sorted(Path('/workspace/generated_images').glob('v21_firefly_pool_*.png')):
 n=int(p.stem.rsplit('_',1)[1]);im=Image.open(p)
 for k in range(4):
  seed=f'pool_{n:04}_{k}'
  if seed in seen or qc.get(seed,{}).get('status')=='rejected':continue
  seen.add(seed);x=k%2*im.width//2;y=k//2*im.height//2
  sources.append({'id':'b_native_'+seed,'seed_id':seed,'age':qc.get(seed,{}).get('suggested_age',19),'level':'hs','glasses':qc.get(seed,{}).get('glasses_observed',False),'native_path':str(p),'crop':[x+4,y+4,x+im.width//2-4,y+im.height//2-4],'source':'retained_native_requires_visual_review'})
p=Path('/workspace/generated_images/exec-c4df3705-e898-46a0-96eb-31d347fc2662.png');im=Image.open(p)
for k,age in enumerate([18,19,18,19,17,20,21,20]):
 x0=k%2*im.width//2;x1=(k%2+1)*im.width//2;y0=k//2*im.height//4;y1=(k//2+1)*im.height//4;s=min(x1-x0,y1-y0)-12
 sources.append({'id':f'b_new000_{k}','seed_id':f'b_new000_{k}','age':age,'level':'hs' if age<20 else 'univ','glasses':k==2,'native_path':str(p),'crop':[x0+6,y0+6,x0+6+s,y0+6+s],'source':'new_generated_candidate'})
(W/'b_candidates.json').write_text(json.dumps(sources,indent=2));print('Unused candidate sources',len(sources),'official seed people excluded',len(used))
