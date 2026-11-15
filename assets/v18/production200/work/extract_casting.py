from pathlib import Path
import json,hashlib,time
from PIL import Image,ImageOps
P=Path(__file__).resolve().parent;ROOT=P.parents[3];D=P/'round10_casting';seen=set();rows=[];(D/'masters').mkdir(exist_ok=True)
while True:
 changed=False
 for f in sorted(D.glob('photo[0-9][0-9].png')):
  if f.name in seen:continue
  i=f.stem[-2:];a=json.loads((D/f'plan{i}.json').read_text());im=Image.open(f).convert('RGB');out=D/'masters'/(a['id']+'.png');ImageOps.fit(im,(256,256),Image.Resampling.LANCZOS,centering=(.5,.25)).save(out);rows.append({'key':a['id'],'kind':'candidate','path':str(out.relative_to(ROOT)),'attributes':a,'source':str(f.relative_to(ROOT)),'sha256':hashlib.sha256(out.read_bytes()).hexdigest()});seen.add(f.name);changed=True
 if changed:(D/'candidate_sources.json').write_text(json.dumps(rows,indent=2));print('individual candidates',len(rows),flush=True)
 if len(seen)==20 or (D/'GENERATION_FINISHED').exists():break
 time.sleep(5)
