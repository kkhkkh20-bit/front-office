"""Early diagnostic of cached actual-pixel results; never marks delivery complete."""
import os
os.environ['OMP_NUM_THREADS']='1';os.environ['OPENBLAS_NUM_THREADS']='1'
from pathlib import Path
import json
import numpy as np
import measure_final as final
P=Path(__file__).resolve().parent;OUT=P.parents[1]
def main():
 with np.load(P/'baseline/delivered_embeddings.npz') as z:old={k:z[k] for k in z.files}
 with np.load(OUT/'identity_prescreen/embeddings.npz') as z:src={k:z[k] for k in z.files}
 ids=list(old['ids']);teams=list(old['teams']);rows={}
 for f in sorted((P/'final_pixel_cache').glob('*.json'),key=lambda p:p.stat().st_mtime):
  x=json.loads(f.read_text())
  if x.get('protocol_signature')!=final.SIG:continue
  r=x['record'];rows[r['team'],r['id']]=(f,x)
 failures=[];retention_min=1.
 for (team,rid),(f,x) in rows.items():
  e=np.load(f.with_suffix('.npz'));t=teams.index(team);k=ids.index(rid)
  for s in [128,256,384]:
   ss=min(s,256);same=old[f'e{ss}'][:,k]@e[f'e{s}'];own=(old[f'e{ss}'][t]@e[f'e{s}']).argmax()==k;source_own=(src[f'e{ss}']@e[f'e{s}']).argmax()==k
   if s==384:retention_min=min(retention_min,float(same.min()))
   if same.min()<.6 or not own or (s in [128,256] and not source_own):failures.append({'id':rid,'team':team,'size':s,'same_original_min':float(same.min()),'old_own_top1':bool(own),'source_own_top1':bool(source_own)})
 result={'scope':'Diagnostic of already measured actual WebP pixels; final full-pair validation remains required','measured_portraits':len(rows),'old_retention384_min':retention_min,'failures':failures};(P/'actual_pixel_early_audit.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
if __name__=='__main__':main()
