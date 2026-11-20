from pathlib import Path
import json,hashlib
from PIL import Image
from reconstruct_A_native import render,encode,W,R
people=json.load(open(W/'cohort_r3_a7_q001_people.json'));hs={c['person_key']:c for c in people if c['kind']=='A'};new={c['person_key']+'__'+c['variant']:c for c in json.load(open(W/'cohort_r3_normalization.json')) if c.get('kind')=='A'};rows=json.load(open(R/'validation/stage_a/photo_provenance.json'));variants=list(json.load(open(W/'r3_kit_specs.json')));out=W/'A_revision3_sheets';out.mkdir(exist_ok=True);records=[]
for v in variants:
 canvases={s:Image.new('RGB',((s+16)*10,(s+16)*10),(128,128,128)) for s in [128,256,384]}
 for p in [p for p in rows if p['variant']==v]:
  aid=p['game_id'].split('_')[-1];c=(hs[aid] if v=='hs_home' else new[aid+'__'+v]) if aid in hs else None;photo=Image.open(c['normalized_path']).convert('RGB') if c else render(p,0)
  for s,canvas in canvases.items():canvas.paste(photo.resize((s,s),Image.Resampling.LANCZOS),((p['index']%10)*(s+16)+8,(p['index']//10)*(s+16)+8))
  records.append({'photo_id':p['photo_id'],'game_id':p['game_id'],'variant':v,'index':p['index'],'revision3_source':c,'original_provenance':p,'retained_existing_identity_and_age':True,'non_replaced_photograph_pixels_restored_from_native':c is None})
 for s,canvas in canvases.items():
  d=out/str(s);d.mkdir(exist_ok=True);path=d/(v+'.webp');encode(canvas,path,s);print(v,s,path.stat().st_size,flush=True)
(W/'A_revision3_provenance.json').write_text(json.dumps(records,indent=2));print('Done',len(records),flush=True)
