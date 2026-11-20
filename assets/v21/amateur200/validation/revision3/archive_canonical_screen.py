from pathlib import Path
import json,hashlib,shutil,numpy as np
from PIL import Image
W=Path('/dev/shm/v21b-work');R=W/'repo/assets/v21/amateur200';V=R/'validation/revision3';D=R/'review/revision3/canonical_master_screens';D.mkdir(parents=True,exist_ok=True);cs=json.load(open(W/'B_canonical_pool_candidates.json'));meas=json.load(open(W/'B_canonical_pool_embeddings.json'));md={p['id']:p for p in meas['records']};out=[];copied={}
for c in cs:
 batch=c['canonical_screen_batch'];i=c['canonical_screen_index'];paths={}
 for s in [128,256,384]:
  src=W/f'B_canonical_pool/batch{batch:02}/hs_home_{s}.webp';dst=D/f'batch{batch:02}/hs_home_{s}.webp';key=(batch,s)
  if key not in copied:
   dst.parent.mkdir(exist_ok=True);shutil.copyfile(src,dst);copied[key]=Image.open(dst).convert('RGB')
  x=i%10*(s+16)+8;y=i//10*(s+16)+8;tile=copied[key].crop((x,y,x+s,y+s));sha=hashlib.sha256(np.asarray(tile).tobytes()).hexdigest();assert sha==md[c['id']]['details'][str(s)]['pixel_sha256'];paths[str(s)]={'path':str(dst.relative_to(R)),'rect':[x,y,s,s],'decoded_rgb_sha256':sha}
 out.append({**c,'screen_atlas_photos':paths,'status':'candidate_screen_only_not_official_game_identity'})
shutil.copyfile(W/'B_canonical_pool_embeddings.npz',V/'canonical_master_screen_embeddings.npz');shutil.copyfile(W/'B_canonical_pool_embeddings.json',V/'canonical_master_screen_measurements.json');(V/'canonical_master_screen_provenance.json').write_text(json.dumps({'scope':'838 canonical-encoder candidate screening trials, not runtime B100; rejected trials included','game_ids_assigned':False,'photos':out},ensure_ascii=False,indent=2)+'\n');shutil.copyfile(W/'B_canonical_plan.json',V/'B_canonical_visual_review.json');shutil.copyfile(W/'B_canonical_extended_plan.json',V/'B_provisional_master_plan.json');shutil.copyfile(W/'archive_canonical_screen.py',V/'archive_canonical_screen.py')
# Only reproducible decoded-atlas PNG caches are removed. All native originals and atlases remain.
removed=[];freed=0
for folder in [W/'A_revision3_cells',W/'A_restored_cells',W/'A_recentered_cells',W/'A61final_cells']+list((W/'B_canonical_pool').glob('batch*')):
 for p in folder.glob('*.png'):
  if p.is_file():freed+=p.stat().st_size;p.unlink();removed.append(str(p))
(W/'pruned_decoded_atlas_cache_receipt.json').write_text(json.dumps({'freed_bytes':freed,'removed_count':len(removed),'scope':'reproducible decoded cells only; native originals and encoded source atlases retained','removed_paths':removed},indent=2));print('Archived838 measured candidate cells and pruned decoded PNG caches',len(removed),'bytes',freed,flush=True)
