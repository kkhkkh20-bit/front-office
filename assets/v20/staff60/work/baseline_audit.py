"""v20b: pair-specific original baseline +0.02, with no new >=0.40 pairs."""
import os
os.environ['OPENBLAS_NUM_THREADS']='1'
from pathlib import Path
import json,itertools
import numpy as np
P=Path(__file__).resolve().parent;OUT=P.parent
def evaluate(a,b):
 refs=b['ids'].tolist();rows=[]
 for n,photo in enumerate(a['ids']):
  person=str(photo).split('__')[0];own=refs.index(person);row={'photo_id':str(photo),'identity_id':person,'sizes':{},'passed':True}
  for size in [128,256,384]:
   if f'e{size}' not in a:continue
   rs=128 if size==128 else 256;ref=b[f'e{rs}'];base=ref[own]@ref.T;new=a[f'e{size}'][n]@ref.T;mask=np.arange(len(refs))!=own
   limits=np.maximum(.40,base)+.02;newcoll=(base<.40)&(new>=.40)&mask;over=(new>limits)&mask
   nearest=int(np.where(mask,new,-2).argmax());worst=int(np.where(mask,new-limits,-2).argmax());nondup=(base<.40)&mask;nd=int(np.where(nondup,new,-2).argmax())
   conflicts=[{'identity_id':refs[k],'baseline':float(base[k]),'new':float(new[k]),'limit':float(limits[k]),'new_collision':bool(newcoll[k]),'baseline_limit_exceeded':bool(over[k])} for k in np.where(newcoll|over)[0]]
   ok=new[own]>=.60 and not conflicts
   row['sizes'][str(size)]={'passed':bool(ok),'same_v7':float(new[own]),'reference_size':rs,'other_max':float(new[nearest]),'nearest_id':refs[nearest],'nearest_baseline':float(base[nearest]),'min_limit_excess':float((new-limits)[mask].min()),'max_limit_excess':float((new-limits)[mask].max()),'nonduplicate_other_max':float(new[nd]),'nonduplicate_margin':float(.40-float(new[nd])),'nonduplicate_nearest_id':refs[nd],'nonduplicate_baseline':float(base[nd]),'worst_limit_id':refs[worst],'worst_limit_baseline':float(base[worst]),'worst_limit_new':float(new[worst]),'new_collision_count':int(newcoll.sum()),'baseline_limit_failure_count':int(over.sum()),'conflicts':conflicts}
   row['passed'] &= bool(ok)
  rows.append(row)
 return rows
def audit(name,location=P):
 z=np.load(location/f'{name}_embeddings.npz');a={k:z[k] for k in z.files};z=np.load(OUT/'validation/reference_embeddings.npz');b={k:z[k] for k in z.files};rows=evaluate(a,b)
 result={'policy':'v20b','raw_cosine':True,'own_min':.60,'baseline_formula':'new <= max(0.40, baseline) + 0.02 for every one of the 485 others','no_new_collision':'baseline <0.40 and new >=0.40 fails','results':rows,'passed_ids':[r['photo_id'] for r in rows if r['passed']]}
 dest=P/'v20b'/f'{name}_audit.json';dest.write_text(json.dumps(result,indent=2));print(name,len(result['passed_ids']),'/',len(rows),result['passed_ids'],flush=True);return result
if __name__=='__main__':
 import sys
 audit(sys.argv[1],Path(sys.argv[2]) if len(sys.argv)>2 else P)
