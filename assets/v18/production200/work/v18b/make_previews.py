"""All previews use exact delivered WebP crops;384 individual previews are unscaled."""
from pathlib import Path
from functools import lru_cache
import json,random,hashlib
from PIL import Image,ImageDraw
P=Path(__file__).resolve().parent;OUT=P.parents[1];ROOT=P.parents[4]
@lru_cache(maxsize=4)
def sheet(path):return Image.open(path).convert('RGB')
def crop(person,team,size,baseline=False):
 v=person['variants'][team]['sheets'][str(size)];path=ROOT/v['path']
 if baseline:path=P/'baseline'/Path(v['path']).relative_to(OUT.relative_to(ROOT))
 im=sheet(str(path));x,y,w,h=v['rect'];photo=im.crop((x,y,x+w,y+h));assert photo.size==(size,size);return photo
def main():
 m=json.loads((OUT/'manifest.json').read_text());base=json.loads((P/'baseline/manifest.json').read_text());byid={x['id']:x for x in m['identities']};old={x['id']:x for x in base['identities']};teams=[t['key'] for t in m['teams']];preview=OUT/'previews';preview.mkdir(exist_ok=True)
 # Existing review names stay available and show the refreshed actual256 delivery.
 for name,people in [('A_all100_256.png',[x for x in m['identities'] if x['sheet']=='A']),('B_all100_256.png',[x for x in m['identities'] if x['sheet']=='B']),('B_by_age_256.png',sorted([x for x in m['identities'] if x['sheet']=='B'],key=lambda x:(x['age'],x['index'])))]:
  canvas=Image.new('RGB',(2560,2800),'white');draw=ImageDraw.Draw(canvas)
  for i,x in enumerate(people):
   r,c=divmod(i,10);canvas.paste(crop(x,teams[0],256),(c*256,r*280));draw.text((c*256+5,r*280+260),f'{x["id"]} age{x["age"]} {x["ethnicity"]}',fill='black')
  canvas.save(preview/name)
 sample_path=preview/'random20/index.json';existing=json.loads(sample_path.read_text());sample_ids=[x['id'] for x in existing['identities']];assert len(sample_ids)==20
 index=[]
 for rid in sample_ids:
  x=byid[rid];canvas=Image.new('RGB',(1280,590),'white');draw=ImageDraw.Draw(canvas);draw.text((6,7),f'{rid} age{x["age"]}',fill='black')
  for i,t in enumerate(teams):
   r,c=divmod(i,5);canvas.paste(crop(x,t,256),(c*256,30+r*280));draw.text((c*256+5,30+r*280+260),t,fill='black')
  path=preview/'random20'/f'{rid}.png';canvas.save(path);index.append({'id':rid,'age':x['age'],'path':str(path.relative_to(OUT)),'teams':teams})
 sample_path.write_text(json.dumps({'seed':18,'source':'actual v18b256 WebP crops','identities':index},ensure_ascii=False,indent=2))
 d=preview/'v18b';d.mkdir(exist_ok=True)
 for rid in ['v18_165','v18_169','v18_170','v18_174']:
  x=byid[rid];canvas=Image.new('RGB',(2560,610),'white');draw=ImageDraw.Draw(canvas);draw.text((8,8),f'{rid} age{x["age"]}: BEFORE original256 / AFTER revised256',fill='black')
  for i,t in enumerate(teams):
   draw.text((i*256+5,30),t,fill='black');canvas.paste(crop(old[rid],t,256,True),(i*256,50));canvas.paste(crop(x,t,256),(i*256,334))
  canvas.save(d/f'{rid}_before_after_10clubs.png')
 rng=random.Random(1802);chosen=rng.sample(m['identities'],10);native_dir=d/'random10';native_dir.mkdir(exist_ok=True);canvas=Image.new('RGB',(1920,828),'white');draw=ImageDraw.Draw(canvas);records=[]
 for i,x in enumerate(chosen):
  t=teams[i];photo=crop(x,t,384);path=native_dir/f'{x["id"]}_{t}.png';photo.save(path);r,c=divmod(i,5);canvas.paste(photo,(c*384,r*414));draw.text((c*384+5,r*414+388),f'{x["id"]} age{x["age"]} {t}',fill='black');v=x['variants'][t]['sheets']['384']
  records.append({'id':x['id'],'team':t,'age':x['age'],'path':str(path.relative_to(OUT)),'size':[384,384],'source_webp':v['path'],'rect':v['rect'],'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
 canvas.save(d/'random10_384.png');(native_dir/'index.json').write_text(json.dumps({'seed':1802,'source':'actual final384 WebP cells; individual images are not resized','identities':records},ensure_ascii=False,indent=2));print('Refreshed23 existing previews plus4 before/after panels and10 native384 previews with a combined overview.')
if __name__=='__main__':main()
