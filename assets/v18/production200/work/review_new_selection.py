from pathlib import Path
import json,sys
from PIL import Image,ImageDraw
P=Path(__file__).resolve().parent;D=P/'review_current';D.mkdir(exist_ok=True);selection=json.loads((P/(sys.argv[1] if len(sys.argv)>1 else 'canonical/selection.json')).read_text());meta=json.loads((P/'visual_metadata.json').read_text());meta.update(json.loads((P/'final_visual_metadata.json').read_text()));new=[x for x in selection['selected'] if (x['key'] not in meta and not x['key'].startswith('clean_young/')) or (x.get('age_assignment_requires_visual_review') and meta.get(x['key'],{}).get('assigned_age_visual_review')!=x['attributes']['age'])];(D/'pending_records.json').write_text(json.dumps(new,indent=2))
for b in range((len(new)+31)//32):
 out=Image.new('RGB',(1280,((min(32,len(new)-b*32)+7)//8)*230),'white');draw=ImageDraw.Draw(out)
 for i,x in enumerate(new[b*32:(b+1)*32]):
  r,c=divmod(i,8);im=Image.open(x['master_path']);im.thumbnail((160,160));out.paste(im,(c*160,r*230));a=x['attributes'];draw.text((c*160,r*230+165),f'{b*32+i} {x["key"]}\n{a["ethnicity"]} {a["age"]}({a.get("generation_age",a["age"])})\nG{int(a["tags"]["glasses"])} B{int(a["tags"]["facial_hair"])}',fill='black')
 out.save(D/f'pending_{b}.jpg',quality=90)
print(json.dumps({'selected':selection['selected_count'],'unreviewed':len(new),'pages':(len(new)+31)//32,'keys':[x['key'] for x in new]},indent=2))
