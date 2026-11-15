from pathlib import Path
import json,itertools
import numpy as np
P=Path(__file__).resolve().parent;D=P/'wardrobe_lowcaps';teams=[x['key'] for x in json.loads((P/'teams.json').read_text())];failures=[];stats={}
for size in [128,256]:
 minimum=1.;maximum=-1.;count=0
 for b in range(10):
  measured={t:np.load(D/f'{t}_batch{b:02d}_scores.npz')[f'e{size}'] for t in teams if (D/f'{t}_batch{b:02d}_scores.npz').exists()}
  for a,c in itertools.combinations(measured,2):
   values=np.sum(measured[a]*measured[c],axis=1);minimum=min(minimum,float(values.min()));maximum=max(maximum,float(values.max()));count+=len(values)
   for k in np.where(values<.6)[0]:failures.append({'size':size,'id':f'v18_{b*20+int(k)+1:03d}','team_a':a,'team_b':c,'cosine':float(values[k])})
 stats[str(size)]={'same_person_pairs_measured':count,'min':minimum if count else None,'max':maximum if count else None}
out={'metrics':stats,'failures':failures,'complete':all(s['same_person_pairs_measured']==9000 for s in stats.values()),'scope':'intermediate PNG photos; final decoded WebP still required'};(D/'live_identity_validation.json').write_text(json.dumps(out,indent=2));print(json.dumps({'metrics':stats,'failure_count':len(failures),'failures':failures[:12]},indent=2))
