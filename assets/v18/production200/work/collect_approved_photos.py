from pathlib import Path
import json,hashlib
from PIL import Image
P=Path(__file__).resolve().parent;ROOT=P.parents[3];D=P/'wardrobe_lowcaps';teams=[x['key'] for x in json.loads((P/'teams.json').read_text())];photos=[];missing=[]
for team in teams:
 for b in range(10):
  validation=D/f'render_{team}_batch{b:02d}_validation.json';review=D/'reviews'/f'{team}_batch{b:02d}.json'
  if not validation.exists() or not review.exists():missing.append({'team':team,'batch':b,'numerical':validation.exists(),'visual':review.exists()});continue
  v=json.loads(validation.read_text());r=json.loads(review.read_text());assert v['passed'] and all(r.get(k) is True for k in ['visual_review_passed','cap_fit_passed','uniform_review_passed','identity_anatomy_glasses_ears_passed']);assert len(v['photos'])==20
  assert hashlib.sha256((ROOT/v['job']['path']).read_bytes()).hexdigest()==r['render_sha256'],'Render changed after visual approval'
  assert [x['id'] for x in v['photos']]==[f'v18_{b*20+i+1:03d}' for i in range(20)]
  for x in v['photos']:
   photo=dict(x);im=Image.open(ROOT/photo['path']);assert im.size==(256,256) and im.mode=='RGB';photo.update(visual_review_passed=True,cap_fit_passed=True,uniform_review_passed=True,photograph_sha256=hashlib.sha256((ROOT/photo['path']).read_bytes()).hexdigest(),visual_review_path=str(review.relative_to(ROOT)),render_sha256=r['render_sha256']);photos.append(photo)
progress={'approved_photograph_count':len(photos),'required':2000,'missing_batches':missing};(D/'approval_progress.json').write_text(json.dumps(progress,indent=2))
if not missing:
 assert len(photos)==2000 and len({(x['id'],x['team']) for x in photos})==2000;live=json.loads((D/'live_identity_validation.json').read_text());assert live['complete'] and not live['failures'],'All9000 same-person PNG pair checks required before final packing';(P/'approved_wardrobe_photos.json').write_text(json.dumps(photos,indent=2));print('All2000 deeply fitted home-uniform photographs approved. Final decoded WebP checks still required.')
else:print(json.dumps({'approved_photograph_count':len(photos),'missing_batch_count':len(missing)},indent=2))
