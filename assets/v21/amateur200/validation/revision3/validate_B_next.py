import os
os.environ['OPENBLAS_NUM_THREADS']='1'
from pathlib import Path
import json,numpy as np
W=Path('/dev/shm/v21b-work');z=np.load(W/'B_next_embeddings.npz');idx={str(k):i for i,k in enumerate(z['ids'])};es={s:z[f'e{s}'] for s in [128,256,384]};hs=np.load(W/'B_cohort_r3_next_masters.npz');he={s:hs[f'e{s}'] for s in es};people=json.load(open(W/'B_cohort_r3_next_people.json'));report=[]
for i,p in enumerate(people):
 rr={}
 for s in es:
  vv=np.stack([he[s][i]]+[es[s][idx[f'bnext_r3_{i:02}__'+v]] for v in json.load(open(W/'r3_kit_specs.json')) if v!='hs_home']);m=vv@vv.T;rr[str(s)]=float(m[np.triu_indices(12,1)].min())
 row={'person_id':p['id'],'review_id':p['review_id'],'same_min':rr,'passes':min(rr.values())>=.6};report.append(row);print(row,flush=True)
(W/'B_next_validation.json').write_text(json.dumps({'status':'individual_export_gate_not_final_atlas','people':report},indent=2))
