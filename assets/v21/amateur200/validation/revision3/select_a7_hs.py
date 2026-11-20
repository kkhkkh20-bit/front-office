import os
os.environ['OPENBLAS_NUM_THREADS']='1'
from pathlib import Path
import json,numpy as np
from PIL import Image
from scipy.optimize import milp,Bounds,LinearConstraint
W=Path('/dev/shm/v21b-work');R=W/'repo/assets/v21/amateur200';S=[128,256,384]
def arrays(p):
 z=np.load(p);return {k:z[k] for k in z.files}
a=arrays(R/'validation/stage_a/raw_embeddings.npz');old=arrays(R/'validation/reference_embeddings.npz');family=arrays(W/'family_b_000_embeddings.npz');fidx={str(p):i for i,p in enumerate(family['ids'])};master=json.load(open(R/'manifest.json'));wanted=['A062','A047','A038','A083','A061','A069','A093'];people={p['review_id']:p for p in master['identities'] if p['review_id'] in wanted};pids={p['source_person_id'] for p in people.values()};fixed=[i for i,p in enumerate(a['ids']) if p.endswith('__hs_home') and p.split('__')[0] not in pids];aid={str(p):i for i,p in enumerate(a['ids'])};bp=json.load(open(W/'b_uniform_pilot_people.json'));bfix=[fidx[p['id']+'__hs_home'] for p in bp[:7]]
qfeat={};initial=arrays(W/'r2_initial_embeddings.npz');ini={str(p):i for i,p in enumerate(initial['ids'])};brep=arrays(W/'r2_b_repairs_embeddings.npz');bri={str(p):i for i,p in enumerate(brep['ids'])}
for s in S:qfeat[s]=np.stack([initial[f'e{s}'][ini['br2_Q001']],initial[f'e{s}'][ini['br2_Q033']],brep[f'e{s}'][bri['br2_Q024_gen0']]])
nodes=[]
for stem in ['r2_initial','a7_singles','a2_hair','bg2']:
 z=arrays(W/(stem+'_embeddings.npz'));meta={p['id']:p for p in json.load(open(W/(stem+'_normalization.json')))};details={p['id']:p for p in json.load(open(W/(stem+'_embeddings.json')))['records']}
 for i,key in enumerate(z['ids']):
  key=str(key)
  if not (key.startswith('ar2_') or key.startswith('br2_candidate8_')):continue
  c=dict(meta[key]);group=c.get('review_id') if key.startswith('ar2_') else 'B8_BG';es={s:z[f'e{s}'][i] for s in S};guard=max(max(float((old[f'e{min(s,256)}']@es[s]).max()),float((a[f'e{s}'][fixed]@es[s]).max()),float((family[f'e{s}'][bfix]@es[s]).max()),float((qfeat[s]@es[s]).max())) for s in S)
  deviation=max(float(np.max(np.abs(np.mean(details[key]['details'][str(s)]['landmarks'],axis=0)*256/s-np.array([130.98235626,118.22048492])))) for s in S)
  if guard>=.4 or deviation>4:continue
  image_path=Path(c['normalized_path']).with_name(key+'_256.webp');im=np.asarray(Image.open(image_path).convert('RGB'),dtype=float);bg=np.median(np.concatenate([im[:28,:28].reshape(-1,3),im[:28,-28:].reshape(-1,3)]),axis=0);luma=float(bg@np.array([.2126,.7152,.0722]));capmask=im[:95,65:195].mean(2)<bg.mean()*.65;ys=np.flatnonzero(capmask.sum(1)>=10);headroom=int(ys[0]) if len(ys) else 0
  if headroom<3:continue
  if group=='B8_BG':
   own=[j for p,j in fidx.items() if p.startswith('b_direct_pool_0091_0__') and not p.endswith('__hs_home')];same=min(float((family[f'e{s}'][own]@es[s]).min()) for s in S)
   if same<.6:continue
   cost=guard+.003*abs(luma-106.2166)
  else:
   p=people[group];assert c['age']==p['age'] and c['level']==p['level'];oldref=aid[p['source_person_id']+'__hs_home'];same=min(float(a[f'e{s}'][oldref]@es[s]) for s in S)
   if same<.6:continue
   cost=guard-.02*same
  nodes.append({'group':group,'source':c,'embeddings':es,'guard_max':guard,'same_identity_reference_min':same,'headroom_256':headroom,'background_corner_rgb':bg.tolist(),'background_luma':luma,'cost':cost})
n=len(nodes);groups=wanted+['B8_BG'];print('Eligible actual photograph options',{g:sum(c['group']==g for c in nodes) for g in groups},flush=True);rows=[];lo=[];hi=[]
for g in groups:rows.append(np.array([c['group']==g for c in nodes],float));lo.append(1);hi.append(1)
for i,c in enumerate(nodes):
 for j in range(i+1,n):
  d=nodes[j]
  if c['group']==d['group']:continue
  if max(float(c['embeddings'][s]@d['embeddings'][s]) for s in S)>=.4:
   row=np.zeros(n);row[i]=row[j]=1;rows.append(row);lo.append(0);hi.append(1)
res=milp(c=np.array([c['cost'] for c in nodes]),integrality=np.ones(n),bounds=Bounds(0,1),constraints=LinearConstraint(np.array(rows),lo,hi),options={'time_limit':30});assert res.x is not None,res.message
sel=[{k:v for k,v in c.items() if k!='embeddings'} for i,c in enumerate(nodes) if res.x[i]>.5];out={'status':'ACTUAL_HS_PHOTO_SELECTION_INDIVIDUAL_EXPORTS_NOT_FINAL_ATLASES','selected':sel};(W/'a7_actual_hs_selection.json').write_text(json.dumps(out,indent=2));print([(c['group'],c['source']['id'],c['guard_max'],c['same_identity_reference_min']) for c in sel])
