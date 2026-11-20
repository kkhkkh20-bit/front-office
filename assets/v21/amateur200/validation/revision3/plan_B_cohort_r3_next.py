import os
os.environ['OPENBLAS_NUM_THREADS']='1'
from pathlib import Path
from PIL import Image
import numpy as np,json
from scipy.optimize import milp,Bounds,LinearConstraint
W=Path('/dev/shm/v21b-work');S=[128,256,384]
def load(p):
 z=np.load(p);return {k:z[k] for k in z.files}
bank=json.load(open(W/'r3_master_preview_index.json'));z=load(W/'r3_master_bank_embeddings.npz');idx={str(k):i for i,k in enumerate(z['ids'])};sources=[]
for c in bank:
 if c['review_id'] in ['Q033','Q054','Q055','Q075','Q083'] and (c['must_keep'] or c['id'].startswith('br2_')):sources.append((dict(c),{s:z[f'e{s}'][idx[c['id']]] for s in S}))
co=load(W/'cohort_r3_embeddings.npz');ci={str(k):i for i,k in enumerate(co['ids'])};meta={p['id']:p for p in json.load(open(W/'cohort_r3_normalization.json'))}
for key in ['br3_Q024_retry2','br3_Q024_retry3']:
 c=dict(meta[key]);c.update(seed_id='pool_0083_3',person_id='b_base_pool_0083_3',must_keep=True,review_id='Q024');sources.append((c,{s:co[f'e{s}'][ci[key]] for s in S}))
plan=json.load(open(W/'r3_B_master_plan.json'))['reviewed_options'];allowed={c['id']:c for c in plan};seeds={c['seed_id'] for c,e in sources};fixed=[c for c in bank if c['must_keep'] and c['review_id']!='Q033'];fx={s:np.stack([z[f'e{s}'][idx[c['id']]] for c in fixed]) for s in S}
for c in bank:
 if c['id'] in allowed and not c['must_keep'] and not c['needs_master_framing_repair'] and c['seed_id'] not in seeds and c['review_id'] not in ['Q001','Q024'] and c['seed_id'] not in {f['seed_id'] for f in fixed} and not allowed[c['id']]['glasses']:
  c=dict(allowed[c['id']]);c['selection_group']='supplement';sources.append((c,{s:z[f'e{s}'][idx[c['id']]] for s in S}))
old=load(W/'repo/assets/v21/amateur200/validation/reference_embeddings.npz');aa=load(W/'planned_active_A100_representatives.npz');nodes=[]
for c,e in sources:
 guard=max(max(float((old[f'e{min(s,256)}']@e[s]).max()),float((aa[f'e{s}']@e[s]).max()),float((fx[s]@e[s]).max())) for s in S)
 if c.get('review_id') in ['Q024','Q033','Q054','Q055','Q075','Q083']:print('target',c['id'],guard,flush=True)
 if guard<.4:c['guard_max']=guard;nodes.append((c,e))
N=len(nodes);rows=[];lo=[];hi=[]
def add(a,l,h):rows.append(a);lo.append(l);hi.append(h)
add(np.ones(N),8,8)
for q in ['Q024','Q033','Q054','Q055','Q083']:add(np.array([c.get('review_id')==q for c,e in nodes],float),1,1)
for seed in {c['seed_id'] for c,e in nodes}:add(np.array([c['seed_id']==seed for c,e in nodes],float),0,1)
for i,(c,e) in enumerate(nodes):
 for j in range(i+1,N):
  if max(float(e[s]@nodes[j][1][s]) for s in S)>=.4:a=np.zeros(N);a[i]=a[j]=1;add(a,0,1)
cost=np.array([c['guard_max']+.01*(c.get('level')=='univ') for c,e in nodes]);res=milp(c=cost,integrality=np.ones(N),bounds=Bounds(0,1),constraints=LinearConstraint(np.array(rows),lo,hi));assert res.x is not None,res.message
sel=[c for i,(c,e) in enumerate(nodes) if res.x[i]>.5];sel=sorted(sel,key=lambda c:({'Q024':0,'Q033':1,'Q054':2,'Q055':3,'Q075':4,'Q083':5}.get(c['review_id'],6),c['id']));features={s:np.stack([e[s] for c in sel for cc,e in nodes if cc['id']==c['id']]) for s in S};np.savez_compressed(W/'B_cohort_r3_next_masters.npz',ids=np.array([c['id'] for c in sel]),**{f'e{s}':e for s,e in features.items()});canvas=Image.new('RGB',(768,1536),(128,128,128))
for i,c in enumerate(sel):canvas.paste(Image.open(c['normalized_path']).convert('RGB').resize((384,384)),(i%2*384,i//2*384))
canvas.save(W/'B_cohort_r3_next_reference.png');(W/'B_cohort_r3_next_people.json').write_text(json.dumps(sel,indent=2));print([(c['review_id'],c['id'],c['guard_max']) for c in sel])
