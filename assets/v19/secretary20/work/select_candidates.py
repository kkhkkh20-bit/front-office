"""Exact quotas and unchanged raw cosine threshold; never lower gates to fill slots."""
from pathlib import Path
import json,numpy as np
from ortools.sat.python import cp_model
P=Path(__file__).resolve().parent;OUT=P.parent
def select():
 pools=[(np.load(P/f'{stem}_embeddings.npz'),json.loads((P/f'{stem}_records.json').read_text())) for stem in ['candidate','single','extra'] if (P/f'{stem}_embeddings.npz').exists()]
 z={k:np.concatenate([a[k] for a,b in pools]) for k in ['ids','e128','e256']};refs=np.load(OUT/'validation/reference_embeddings.npz')
 rows=[x for a,b in pools for x in b];assert list(z['ids'])==[x['candidate'] for x in rows]
 invalid=set(json.loads((P/'visual_exclusions.json').read_text()).get('excluded',[])) if (P/'visual_exclusions.json').exists() else set()
 cross={s:z[f'e{s}']@refs[f'e{s}'].T for s in [128,256]}
 mutual={s:z[f'e{s}']@z[f'e{s}'].T for s in [128,256]}
 valid=[i for i,x in enumerate(rows) if x['candidate'] not in invalid and max(cross[s][i].max() for s in [128,256])<.4]
 model=cp_model.CpModel();xs={i:model.NewBoolVar(rows[i]['candidate']) for i in valid}
 for a,i in enumerate(valid):
  for j in valid[a+1:]:
   if max(mutual[s][i,j] for s in [128,256])>=.4:model.Add(xs[i]+xs[j]<=1)
 for female,limit in [(1,16),(0,4)]:
  model.Add(sum(xs[i] for i in valid if rows[i]['f']==female)<=limit)
  model.Add(sum(xs[i] for i in valid if rows[i]['f']==female and rows[i]['tags']['glasses'])<= (2 if female else 1))
 model.Maximize(sum(xs[i]*(100000+(100 if rows[i]['tags']['glasses'] else 0)+(200 if rows[i].get('quality_tier') in ['young_individual','natural_diverse_individual'] else 0)+(28-rows[i]['age'] if rows[i]['f'] else 0)) for i in valid))
 solver=cp_model.CpSolver();solver.parameters.max_time_in_seconds=15;solver.parameters.num_search_workers=2
 status=solver.Solve(model);chosen=[i for i in valid if solver.Value(xs[i])] if status in [cp_model.OPTIMAL,cp_model.FEASIBLE] else []
 chosen.sort(key=lambda i:(not rows[i]['f'],rows[i]['age'],rows[i]['candidate']))
 selection={'solver_status':solver.StatusName(status),'count':len(chosen),'female_count':sum(rows[i]['f'] for i in chosen),'male_count':sum(not rows[i]['f'] for i in chosen),'glasses_count':sum(rows[i]['tags']['glasses'] for i in chosen),'source_candidates':len(rows),'cross_reference_passed_candidates':len(valid),'chosen':[rows[i] for i in chosen],'metrics':{str(s):{'within_max':float(mutual[s][np.ix_(chosen,chosen)][np.triu_indices(len(chosen),1)].max()) if len(chosen)>1 else None,'reference_max':float(cross[s][chosen].max()) if chosen else None} for s in [128,256]},'rejected_reference':[{'candidate':rows[i]['candidate'],'max':float(max(cross[s][i].max() for s in [128,256]))} for i in range(len(rows)) if i not in valid and rows[i]['candidate'] not in invalid]}
 (P/'selection.json').write_text(json.dumps(selection,ensure_ascii=False,indent=2));print(json.dumps({k:v for k,v in selection.items() if k not in ['chosen','rejected_reference']},indent=2))
 return selection
if __name__=='__main__':select()
