from pathlib import Path
import json
from PIL import Image
P=Path(__file__).resolve().parent;ROOT=P.parents[3];D=P/'wardrobe_lowcaps';pending=[]
for f in sorted(D.glob('render_*_validation.json'),key=lambda x:(not x.name.startswith('render_seoul_comets'),x.name)):
 v=json.loads(f.read_text());job=v['job'];out=D/'review'/(Path(job['path']).stem+'.jpg');review=D/'reviews'/(Path(job['path']).stem+'.json')
 if not v['passed'] or review.exists():continue
 if not out.exists():
  im=Image.open(ROOT/job['path']).convert('RGB');im.thumbnail((800,1000));im.save(out,quality=90)
 pending.append({'team':job['team'],'batch':job['batch'],'preview':str(out.resolve())})
(D/'pending_visual_reviews.json').write_text(json.dumps(pending,indent=2));print(json.dumps(pending[:8],indent=2));print('Pending visual render reviews:',len(pending))
