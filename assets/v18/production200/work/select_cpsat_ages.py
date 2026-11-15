"""Choose independent fictional faces by exact requested quotas, using the original protocol."""
from pathlib import Path
import sys
import json
import numpy as np
from scipy.optimize import milp,Bounds,LinearConstraint
from scipy.sparse import coo_matrix
P=Path(__file__).resolve().parent;D=P/'canonical';n={k:v.copy() for k,v in np.load(D/'embeddings.npz').items()};allrows=json.loads((D/'candidate_records.json').read_text());assert [x['key'] for x in allrows]==list(n['candidate_keys']);required={'US White':16,'US Black':14,'Dominican Latino':10,'Venezuelan Latino':8,'Mexican Latino':4,'Cuban Latino':2,'Puerto Rican Latino':2,'Canadian White':2,'Caribbean Black':2,'Japanese':8,'Taiwanese':6,'Australian':4,'Filipino':2,'Korean18-20':26,'Korean21-24':46,'Korean25-28':29,'Korean29-33':13,'Korean34-38':6}
meta=json.loads((P/'visual_metadata.json').read_text());meta.update(json.loads((P/'final_visual_metadata.json').read_text()))
for row in allrows:
 key=row['key'];visual=meta.get(key)
 if key.startswith('clean_young/'):
  visual=dict(meta[key[len('clean_young/'):]]);visual['facial_hair']=False
 if visual:row['attributes']['tags']={k:visual[k] for k in ['glasses','facial_hair']}
def group(row):
 x=row['attributes']
 if x['ethnicity']!='Korean':return x['ethnicity']
 for lo,hi in [(18,20),(21,24),(25,28),(29,33),(34,38)]:
  if lo<=x['age']<=hi:return f'Korean{lo}-{hi}'
 raise ValueError('Age not in required bands')
valid=np.ones(len(allrows),bool)
for size in [128,256]:valid&=(n[f'e{size}']@n[f'ref{size}'].T<.4).all(axis=1)
valid&=np.array([not (x['attributes']['ethnicity']=='Korean' and x['attributes']['age']<=22 and x['attributes']['tags']['facial_hair']) for x in allrows])
indices=np.where(valid)[0];rows=[allrows[i] for i in indices];E={s:n[f'e{s}'][indices] for s in [128,256]};W={s:e@e.T for s,e in E.items()};clash=(W[128]>=.4)|(W[256]>=.4);groups={}
for i,x in enumerate(rows):groups.setdefault(x.get('same_person_group',x['key']),[]).append(i)
for members in groups.values():
 if len(members)>1:clash[np.ix_(members,members)]=True
np.fill_diagonal(clash,False);aa,bb=np.where(np.triu(clash,1));rr=[];cc=[];upper=[]
for i,j in zip(aa,bb):
 k=len(upper);rr.extend([k,k]);cc.extend([int(i),int(j)]);upper.append(1.)
for key,cap in required.items():
 ii=[i for i,x in enumerate(rows) if group(x)==key];k=len(upper);rr.extend([k]*len(ii));cc.extend(ii);upper.append(float(cap))
for cap,condition in [(21,lambda x:x['attributes']['ethnicity']=='Korean' and x['attributes']['tags']['facial_hair']),(36,lambda x:x['attributes']['ethnicity']!='Korean' and x['attributes']['tags']['facial_hair'])]:
 ii=[i for i,x in enumerate(rows) if condition(x)];k=len(upper);rr.extend([k]*len(ii));cc.extend(ii);upper.append(float(cap))
previous=set(__import__('json').loads((P/'visual_metadata.json').read_text()))
def priority(x):
 key=x['key'];return 110 if key.startswith('clean_final/') else 100 if key in previous or key.startswith('clean_young/') else 9 if key.startswith('cleanup/') else 6 if key.startswith(('r06_','r07_','freechar_')) else 5 if key.startswith(('r05_','nano/')) else 4 if key.startswith('round04') else 2

from ortools.sat.python import cp_model
model=cp_model.CpModel();variables=[model.NewBoolVar(f"c{i}") for i in range(len(rows))]
for i,j in zip(aa,bb):model.AddAtMostOne(variables[int(i)],variables[int(j)])
age_choices={};age_changes=[];band_choices={g:[] for g in required if g.startswith('Korean')}
for i,x in enumerate(rows):
 a=x['attributes'];native=a['age']
 if a['ethnicity']!='Korean':continue
 options=[native]
 adjacent={20:21,21:20,24:25,25:24,28:29,29:28,33:34,34:33}
 if native in adjacent:options.append(adjacent[native])
 choices=[]
 for age in options:
  if age<=22 and a['tags']['facial_hair']:continue
  v=model.NewBoolVar(f'age_{i}_{age}');choices.append((age,v));temp={'attributes':{**a,'age':age}};band_choices[group(temp)].append(v)
  if age!=native:age_changes.append(v)
 model.Add(sum(v for age,v in choices)==variables[i]);age_choices[i]=choices
model.Add(sum(age_changes)<=10)
model.Minimize(sum(age_changes))
for name,cap in required.items():
 if name.startswith('Korean'):model.Add(sum(band_choices[name])==cap)
 else:model.Add(sum(variables[i] for i,x in enumerate(rows) if group(x)==name)==cap)
for cap,condition in [(21,lambda x:x['attributes']['ethnicity']=='Korean' and x['attributes']['tags']['facial_hair']),(36,lambda x:x['attributes']['ethnicity']!='Korean' and x['attributes']['tags']['facial_hair'])]:model.Add(sum(variables[i] for i,x in enumerate(rows) if condition(x))<=cap)
prior=json.loads((D/'selection.json').read_text());hint={x['key'] for x in prior['selected']}
for i,x in enumerate(rows):
 if x['key'] in hint:model.AddHint(variables[i],1)
solver=cp_model.CpSolver();solver.parameters.max_time_in_seconds=180;solver.parameters.num_search_workers=2;solver.parameters.random_seed=18;status=solver.Solve(model);print('CP-SAT',solver.StatusName(status),flush=True)
if status not in [cp_model.FEASIBLE,cp_model.OPTIMAL]:raise SystemExit(2)
chosen=np.array([i for i,v in enumerate(variables) if solver.Value(v)]);selected=[json.loads(json.dumps(rows[i])) for i in chosen]
for i,x in zip(chosen,selected):
 if int(i) in age_choices:
  age=next(age for age,v in age_choices[int(i)] if solver.Value(v));native=x['attributes']['age']
  if age!=native:x['attributes']['generation_age']=native;x['attributes']['age']=age;x['age_assignment_requires_visual_review']=True
assert len(selected)==200;stats={}
for size in [128,256]:
 e=E[size][chosen];w=e@e.T;mask=np.triu(np.ones_like(w,bool),1);cross=e@n[f'ref{size}'].T;assert w[mask].max()<.4 and cross.max()<.4;stats[str(size)]={'within_pairs':19900,'reference_pairs':32000,'within_min':float(w[mask].min()),'within_max':float(w[mask].max()),'reference_min':float(cross.min()),'reference_max':float(cross.max())}
out={'scope':'Original v6c/v13 LMEDS protocol and all160 original prescreen masters','candidate_count':len(allrows),'reference_compatible_candidates':len(rows),'selected_count':200,'selected':selected,'required_quotas':required,'selected_quotas':{g:sum(group(x)==g for x in selected) for g in required},'remaining':[],'metrics':stats,'solver':'OR-Tools CP-SAT with adjacent fictional age assignment','age_assignment_note':'At most10 fictional ages assigned one year across an adjacent band boundary; photograph unchanged; each change requires final visual age review','age_assignment_changes':sum(bool(x.get('age_assignment_requires_visual_review')) for x in selected),'solver_status':solver.StatusName(status),'solver_seconds':solver.WallTime(),'visual_approval_complete':False,'wardrobe_stage_unlocked':False,'production_complete':False}
(D/'flex_selection.json').write_text(json.dumps(out,ensure_ascii=False,indent=2));np.savez_compressed(D/'flex_selected_embeddings.npz',candidate_keys=np.array([x['key'] for x in selected]),e128=E[128][chosen],e256=E[256][chosen],reference_ids=n['reference_ids'],ref128=n['ref128'],ref256=n['ref256']);print(json.dumps({k:v for k,v in out.items() if k!='selected'},indent=2),flush=True)
