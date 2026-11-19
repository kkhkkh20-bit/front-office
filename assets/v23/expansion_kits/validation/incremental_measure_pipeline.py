from pathlib import Path
import json,hashlib,numpy as np
from PIL import Image
from recognition import run,W
if __name__=='__main__':
 jobs=json.load(open(W/'final_jobs.json'));oldrows=json.load(open(W/'final_measurements.json')) if (W/'final_measurements.json').exists() else [];oldE=np.load(W/'final_measurements.npz')['embeddings'] if oldrows else [];key=lambda j:(j['id'],j['team'],j['resolution']);old={key(j):(j,oldE[i]) for i,j in enumerate(oldrows)};cache={};reuse={};pending=[]
 for j in jobs:
  if j['path'] not in cache:cache[j['path']]=Image.open(j['path']).convert('RGB')
  x,y,w,h=j['rect'];digest=hashlib.sha256(cache[j['path']].crop((x,y,x+w,y+h)).tobytes()).hexdigest();k=key(j)
  if k in old and old[k][0]['pixel_sha256']==digest:reuse[k]=old[k]
  else:pending.append(j)
 print('reuse exact decoded pixels',len(reuse),'new',len(pending),flush=True)
 if pending:
  run(pending,'delta_measurements');dr=json.load(open(W/'delta_measurements.json'));de=np.load(W/'delta_measurements.npz')['embeddings'];reuse.update({key(j):(j,de[i]) for i,j in enumerate(dr)})
 rows=[];es=[]
 for j in jobs:r,e=reuse[key(j)];rows.append(r);es.append(e)
 (W/'final_measurements.json').write_text(json.dumps(rows,indent=2));np.savez_compressed(W/'final_measurements.npz',embeddings=np.array(es,dtype=np.float32));print('FINAL',len(rows),flush=True)
