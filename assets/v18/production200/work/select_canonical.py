"""Choose independent fictional faces by exact requested quotas, using the original protocol."""
from pathlib import Path
import json
import numpy as np
from scipy.optimize import milp,Bounds,LinearConstraint
from scipy.sparse import coo_matrix
P=Path(__file__).resolve().parent;D=P/'canonical';n=np.load(D/'embeddings.npz');allrows=json.loads((D/'candidate_records.json').read_text());assert [x['key'] for x in allrows]==list(n['candidate_keys']);required={'US White':16,'US Black':14,'Dominican Latino':10,'Venezuelan Latino':8,'Mexican Latino':4,'Cuban Latino':2,'Puerto Rican Latino':2,'Canadian White':2,'Caribbean Black':2,'Japanese':8,'Taiwanese':6,'Australian':4,'Filipino':2,'Korean18-20':26,'Korean21-24':46,'Korean25-28':29,'Korean29-33':13,'Korean34-38':6}
def group(row):
 x=row['attributes']
 if x['ethnicity']!='Korean':return x['ethnicity']
 for lo,hi in [(18,20),(21,24),(25,28),(29,33),(34,38)]:
  if lo<=x['age']<=hi:return f'Korean{lo}-{hi}'
 raise ValueError('Age not in required bands')
valid=np.ones(len(allrows),bool)
for size in [128,256]:valid&=(n[f'e{size}']@n[f'ref{size}'].T<.4).all(axis=1)
indices=np.where(valid)[0];rows=[allrows[i] for i in indices];E={s:n[f'e{s}'][indices] for s in [128,256]};W={s:e@e.T for s,e in E.items()};clash=(W[128]>=.4)|(W[256]>=.4);np.fill_diagonal(clash,False);aa,bb=np.where(np.triu(clash,1));rr=[];cc=[];upper=[]
for i,j in zip(aa,bb):
 k=len(upper);rr.extend([k,k]);cc.extend([int(i),int(j)]);upper.append(1.)
for key,cap in required.items():
 ii=[i for i,x in enumerate(rows) if group(x)==key];k=len(upper);rr.extend([k]*len(ii));cc.extend(ii);upper.append(float(cap))
previous=set(__import__('json').loads((P/'visual_metadata.json').read_text()))
def priority(x):
 key=x['key'];return 100 if key in previous or key.startswith('clean_young/') else 9 if key.startswith('cleanup/') else 6 if key.startswith(('r06_','r07_','freechar_')) else 5 if key.startswith(('r05_','nano/')) else 4 if key.startswith('round04') else 2
A=coo_matrix((np.ones(len(rr)),(rr,cc)),shape=(len(upper),len(rows))).tocsc();result=milp(-np.array([1.+priority(x)*0.00001 for x in rows]),integrality=np.ones(len(rows)),bounds=Bounds(0,1),constraints=LinearConstraint(A,-np.inf,np.array(upper)),options={'time_limit':55.,'mip_rel_gap':0.0});assert result.x is not None,result.message;chosen=np.where(result.x>.5)[0];selected=[rows[i] for i in chosen];stats={}
for size in [128,256]:
 e=E[size][chosen];matrix=e@e.T;mask=np.triu(np.ones_like(matrix,bool),1);cross=e@n[f'ref{size}'].T;assert matrix[mask].max()<.4 and cross.max()<.4;stats[str(size)]={'within_pairs':int(mask.sum()),'reference_pairs':int(cross.size),'within_max':float(matrix[mask].max()),'reference_max':float(cross.max())}
quotas={g:sum(group(x)==g for x in selected) for g in required};out={'scope':'Original v6c/v13 model and LMEDS protocol, all160 original prescreen masters','candidate_count':len(allrows),'reference_compatible_candidates':len(rows),'selected_count':len(selected),'selected':selected,'required_quotas':required,'selected_quotas':quotas,'remaining':[{'group':g,'missing':v-quotas[g]} for g,v in required.items() if quotas[g]<v],'metrics':stats,'solver_status':int(result.status),'solver_message':result.message,'visual_approval_complete':False,'wardrobe_stage_unlocked':False,'production_complete':False};(D/'selection.json').write_text(json.dumps(out,ensure_ascii=False,indent=2));np.savez_compressed(D/'selected_embeddings.npz',candidate_keys=np.array([x['key'] for x in selected]),e128=E[128][chosen],e256=E[256][chosen],reference_ids=n['reference_ids'],ref128=n['ref128'],ref256=n['ref256']);print(json.dumps({k:v for k,v in out.items() if k!='selected'},indent=2),flush=True)
