from pathlib import Path
from PIL import Image
import json
W=Path('/dev/shm/v21b-work');plan=json.load(open(W/'A061_cap_plan.json'));reg=json.load(open(W/'A061_cap_generation_registry.json'));out=[]
for r in reg:
 im=Image.open(r['native_path']);w,h=im.size
 for i,v in enumerate(plan[r['cohort']]['variants']):
  x=i%2;y=i//2;out.append({'id':'a061_cap__'+v,'person_key':'A061','game_id':'v21_amateur_A061','person_id':'c007_p05','review_id':'A061','kind':'A','age':20,'level':'univ','glasses':False,'variant':v,'native_path':r['native_path'],'crop':[round(x*w/2)+3,round(y*h/2)+3,round((x+1)*w/2)-3,round((y+1)*h/2)-3],'source':'same_face_low_profile_cap_crown_correction'})
(W/'A061_cap_candidates.json').write_text(json.dumps(out,indent=2));s=(W/'normalize_family_b_000.py').read_text().replace('normalized_family_b_000','normalized_A061_cap').replace('family_b_000_candidates','A061_cap_candidates').replace('family_b_000_normalization','A061_cap_normalization').replace('family_b_000_jobs','A061_cap_jobs');(W/'normalize_A061_cap.py').write_text(s)
