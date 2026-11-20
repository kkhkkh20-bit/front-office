import os
os.environ['OPENBLAS_NUM_THREADS']='1'
from pathlib import Path
import json,numpy as np
from scipy.optimize import milp,Bounds,LinearConstraint
W=Path('/dev/shm/v21b-work')
# Assistant review of all 153 passing canonical-candidate photographs, not human approval.
holds={
 'b_base_pool_0001_3':'older-looking eyes and cheeks',
 'b_base_pool_0043_0':'older-looking eyes and cheeks',
 'b_base_pool_0071_1':'older-looking eyes and cheeks',
 'b_d2base_pool_0233_0':'older-looking eyes and cheeks',
 'b_direct_pool_0023_0':'older-looking eyes and cheeks',
 'b_base_pool_0072_2':'childlike face',
}
for s in '0203_1 0211_0 0222_3 0225_1 0229_2 0233_3 0234_2 0235_3 0238_0 0239_0 0239_1 0239_3 0252_1 0255_0 0262_2 0264_3 0274_2 0281_3 0289_1 0202_1 0202_2 0218_1 0260_3 0265_3 0281_1'.split():holds['b_native_pool_'+s]='childlike or overly stylized face; needs recasting before use'
for s in '0220_0 0224_1 0228_3 0250_0 0275_0'.split():holds['b_native_pool_'+s]='facial hair or older-looking facial detail; hold'
glasses=set('0022_0 0078_1 0209_2 0213_2 0215_1 0220_3 0233_2 0245_2 0255_3 0256_0 0265_0 0277_3 0279_2 0279_3 0002_3 0062_3 0065_0 0209_3 0226_2 0237_1'.split())
x=json.load(open(W/'b_prescreen.json'))['records']
for c in x:
 if c['id'].startswith('b_native_pool_'):c['glasses']=c['id'].removeprefix('b_native_pool_') in glasses
 c['assistant_visual_review']={'status':'held' if c['id'] in holds else 'face_appearance_pass_photograph_repairs_pending','reason':holds.get(c['id']),'human_age_review':'pending'}
 c['requires_whole_photograph_rerender']=c['source']=='retained_native_requires_visual_review' or c['translation_origin_xy'][1]>8
z=np.load(W/'b_embeddings.npz');ids=z['ids'].tolist();ix={p:i for i,p in enumerate(ids)};cs=[c for c in x if c['id'] not in holds];n=len(cs);indices=[ix[c['id']] for c in cs]
cross=np.maximum.reduce([z[f'e{s}'][indices]@z[f'e{s}'][indices].T for s in [128,256,384]]);rows=[];hi=[]
for i in range(n):
 for j in range(i+1,n):
  if cross[i,j]>=.4:
   row=np.zeros(n);row[i]=row[j]=1;rows.append(row);hi.append(1)
res=milp(c=-np.ones(n),integrality=np.ones(n),bounds=Bounds(0,1),constraints=LinearConstraint(np.array(rows).reshape(-1,n),np.full(len(rows),-np.inf),hi),options={'time_limit':30});chosen=[cs[i]['id'] for i in range(n) if res.x is not None and res.x[i]>.5]
for c in x:c['selected_after_assistant_face_review']=c['id'] in chosen
out={'status':'MASTER_CANDIDATE_PRESCREEN_NOT_FINAL_ATLASES','candidate_count':len(ids),'old_and_a_representative_pass_count':len(x),'assistant_face_holds':len([c for c in x if c['id'] in holds]),'mutually_distinct_after_face_review':len(chosen),'requested_final_count':100,'game_ids_assigned':False,'records':x}
(W/'b_visual_screen.json').write_text(json.dumps(out,indent=2));print({k:v for k,v in out.items() if k!='records'})
