"""Select a genuine mutually dissimilar candidate per planned ID from measured pools.
Raw ArcFace cosine only. No score correction. Mixed integer optimization chooses photos,
not altered embeddings. Numerical selection is never visual approval.
"""
from pathlib import Path
import json,hashlib
import numpy as np
from scipy.optimize import milp,Bounds,LinearConstraint
from scipy.sparse import coo_matrix
P=Path(__file__).resolve().parent;ROOT=P.parents[3];roster=json.loads((P/'planned_identities.json').read_text());plan={x['id']:x for x in roster};refs=np.load(P/'first20_embeddings.npz')['references'];rows=[];values={128:[],256:[]}
corrected={'v18_083','v18_104','v18_106','v18_109'}
def add(rid,key,path,e128,e256,priority):
 if rid not in plan or not (ROOT/path).exists():return
 if max(float((refs@e128).max()),float((refs@e256).max()))>=.4:return
 rows.append({'id':rid,'candidate_key':key,'path':str(path),'sha256':hashlib.sha256((ROOT/path).read_bytes()).hexdigest(),'priority':priority});values[128].append(e128);values[256].append(e256)
for folder,priority in [('round01',1),('round02_natural',2)]:
 data=np.load(P/folder/'arcface_scores.npz');sources={x['id']:x for x in json.loads((P/folder/'candidate_sources.json').read_text())}
 for i,rid in enumerate(data['ids']):
  rid=str(rid);path=sources[rid]['crop'];add(rid,folder+'/'+rid,path,data['embeddings_128'][i],data['embeddings_256'][i],priority)
for folder,priority in [('firefly/round03',2),('round04_single',3)]:
 data=np.load(P/folder/'arcface_scores.npz');sources={x['id']:x for x in json.loads((P/folder/'candidate_sources.json').read_text())}
 for i,rid in enumerate(data['ids']):
  rid=str(rid)
  if folder=='firefly/round03' and rid in corrected:continue
  add(rid,folder+'/'+rid,sources[rid]['path'],data['embeddings_128'][i],data['embeddings_256'][i],priority)
if (P/'round05_grids/arcface_scores.npz').exists():
 data=np.load(P/'round05_grids/arcface_scores.npz');sources={x['candidate_key']:x for x in json.loads((P/'round05_grids/candidate_sources.json').read_text())}
 for i,key in enumerate(data['candidate_keys']):
  key=str(key);rid=str(data['ids'][i]);add(rid,key,sources[key]['crop'],data['embeddings_128'][i],data['embeddings_256'][i],5)
if (P/'nano/arcface_scores.npz').exists():
 data=np.load(P/'nano/arcface_scores.npz');sources={x['id']:x for x in json.loads((P/'nano/candidate_sources.json').read_text())}
 for i,rid in enumerate(data['ids']):
  rid=str(rid);add(rid,'nano/'+rid,sources[rid]['crop'],data['embeddings_128'][i],data['embeddings_256'][i],5)
clean=np.load(P/'cleanup/cleanup_00_embeddings.npz')
for rid in sorted(corrected):add(rid,'cleanup/'+rid,str((P/'cleanup/masters'/(rid+'.png')).relative_to(ROOT)),clean[f'{rid}_128'],clean[f'{rid}_256'],4)
n=len(rows);E={k:np.array(v) for k,v in values.items()};W={k:e@e.T for k,e in E.items()};conflict=(W[128]>=.4)|(W[256]>=.4);np.fill_diagonal(conflict,False);a,b=np.where(np.triu(conflict,1));edges=list(zip(a,b));rr=[];cc=[];upper=[]
for i,j in edges:
 k=len(upper);rr.extend([k,k]);cc.extend([int(i),int(j)]);upper.append(1.)
# Production IDs are assigned after selection. Independent generations with the same
# draft brief are different candidates, not a locked existing person. Real same-person
# edits already conflict through measured cosine. Enforce the user's actual quotas.
required={'US White':16,'US Black':14,'Dominican Latino':10,'Venezuelan Latino':8,'Mexican Latino':4,'Cuban Latino':2,'Puerto Rican Latino':2,'Canadian White':2,'Caribbean Black':2,'Japanese':8,'Taiwanese':6,'Australian':4,'Filipino':2,'Korean18-20':26,'Korean21-24':46,'Korean25-28':29,'Korean29-33':13,'Korean34-38':6}
def group(record):
 x=plan[record['id']]
 if x['ethnicity']!='Korean':return x['ethnicity']
 for lo,hi in [(18,20),(21,24),(25,28),(29,33),(34,38)]:
  if lo<=x['age']<=hi:return f'Korean{lo}-{hi}'
 raise ValueError('Korean age outside required bands')
for key,capacity in required.items():
 indices=[i for i,x in enumerate(rows) if group(x)==key];k=len(upper);rr.extend([k]*len(indices));cc.extend(indices);upper.append(float(capacity))
A=coo_matrix((np.ones(len(rr)),(rr,cc)),shape=(len(upper),n)).tocsc();c=-np.array([1000.+x['priority'] for x in rows]);result=milp(c,integrality=np.ones(n),bounds=Bounds(np.zeros(n),np.ones(n)),constraints=LinearConstraint(A,-np.inf,np.array(upper)),options={'time_limit':55.,'mip_rel_gap':0.0})
assert result.x is not None,result.message;chosen=np.where(result.x>.5)[0];selected=[rows[i] for i in chosen];selected.sort(key=lambda x:x['id']);indices=[rows.index(x) for x in selected];metrics={}
for nsize in [128,256]:
 e=E[nsize][indices];w=e@e.T;mask=np.triu(np.ones_like(w,bool),1);cross=e@refs.T;assert w[mask].max()<.4 and cross.max()<.4;metrics[str(nsize)]={'within_max':float(w[mask].max()),'reference_max':float(cross.max()),'within_pairs':int(mask.sum()),'reference_pairs':int(cross.size)}
selids={x['id'] for x in selected};out={'scope':'numerical selection by required nationality and age quotas; final IDs assigned after approval','candidate_count':len(rows),'selected_count':len(selected),'selected':selected,'remaining':[{'group':g,'required':cap,'selected':sum(group(x)==g for x in selected),'missing':cap-sum(group(x)==g for x in selected)} for g,cap in required.items() if sum(group(x)==g for x in selected)<cap],'metrics':metrics,'solver_status':int(result.status),'solver_message':result.message,'production_complete':False,'required_quotas':required,'selected_quotas':{g:sum(group(x)==g for x in selected) for g in required}}
(P/'aggregate_pool_selection.json').write_text(json.dumps(out,ensure_ascii=False,indent=2));np.savez_compressed(P/'aggregate_pool_embeddings.npz',candidate_keys=np.array([x['candidate_key'] for x in rows]),ids=np.array([x['id'] for x in rows]),e128=E[128],e256=E[256]);print(json.dumps({k:v for k,v in out.items() if k not in ['selected','remaining']},indent=2),flush=True)
