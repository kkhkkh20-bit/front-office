import os
os.environ['OPENBLAS_NUM_THREADS']='1'
from pathlib import Path
import json,numpy as np
W=Path('/dev/shm/v21b-work');R=W/'repo/assets/v21/amateur200';S=[128,256,384]
def load(p):
 z=np.load(p);return {k:z[k] for k in z.files}
z=load(W/'A61final_embeddings.npz');zi={str(k):i for i,k in enumerate(z['ids'])};hz=load(W/'A_hs_revision3_embeddings.npz');hi={str(k):i for i,k in enumerate(hz['ids'])};old=load(R/'validation/reference_embeddings.npz');master=json.load(open(R/'manifest.json'))['identities'];meta={p['id']:p for p in json.load(open(W/'A61final_measurements.json'))['records']};hm={p['id']:p for p in json.load(open(W/'A_hs_revision3_embeddings.json'))['records']};report=[]
for case in [-1]:
 es={s:z[f'e{s}'].copy() for s in S};measurements=dict(meta)
 for p in ([] if case==-1 else master):
  k=p['source_person_id']+'__hs_home';ck=f'case{case}_'+k
  for s in S:es[s][zi[k]]=hz[f'e{s}'][hi[ck]]
  measurements[k]={**hm[ck],'id':k}
 result={'case':case,'sizes':{},'failures':[],'center_max':0}
 for s in S:
  same=1.;pair=None
  for p in master:
   ix=[i for k,i in zi.items() if k.startswith(p['source_person_id']+'__')];v=es[s][ix];m=v@v.T;mx=float(m[np.triu_indices(12,1)].min())
   if mx<same:same=mx;pair=p['id']
   if mx<.6:result['failures'].append({'type':'same','id':p['id'],'size':s,'value':mx})
  reps=es[s][[zi[p['source_person_id']+'__hs_home'] for p in master]];m=reps@reps.T;np.fill_diagonal(m,-1);between=float(m.max());om=reps@old[f'e{min(s,256)}'].T;oldmax=float(om.max());result['sizes'][str(s)]={'same_min':same,'same_min_person':pair,'between_max':between,'old_max':oldmax}
  for i,j in zip(*np.where(np.triu(m>=.4,1))):result['failures'].append({'type':'between','id1':master[i]['id'],'id2':master[j]['id'],'size':s,'value':float(m[i,j])})
  if oldmax>=.4:result['failures'].append({'type':'old','size':s,'value':oldmax})
  for k,p in measurements.items():result['center_max']=max(result['center_max'],float(np.abs(np.mean(p['details'][str(s)]['landmarks'],axis=0)*256/s-np.array([130.98235626,118.22048492])).max()))
 result['passes']=not result['failures'] and result['center_max']<=4;report.append(result);print(json.dumps(result,indent=2),flush=True)
(W/'A61final_validation.json').write_text(json.dumps(report,indent=2))
