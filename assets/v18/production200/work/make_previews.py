from pathlib import Path
import json,random
from PIL import Image,ImageDraw
P=Path(__file__).resolve().parent;ROOT=P.parents[3];OUT=P.parent;D=OUT/'previews';D.mkdir(exist_ok=True)
m=json.loads((OUT/'manifest.json').read_text());ids=m['identities'];teams=m['teams'];cache={}
def tile(person,team):
 v=person['variants'][team]['sheets']['256'];p=ROOT/v['path']
 if str(p) not in cache:cache[str(p)]=Image.open(p).convert('RGB')
 x,y,w,h=v['rect'];return cache[str(p)].crop((x,y,x+w,y+h))
def grid(people,path,cols=10):
 out=Image.new('RGB',(cols*256,((len(people)+cols-1)//cols)*286),(245,245,245));draw=ImageDraw.Draw(out)
 for i,x in enumerate(people):
  left,top=(i%cols)*256,(i//cols)*286;out.paste(tile(x,'seoul_comets'),(left,top));draw.text((left+8,top+260),f'{x["id"]} age{x["age"]} {x["ethnicity"]}',fill='black')
 out.save(path)
grid(ids[:100],D/'A_all100_256.png');grid(ids[100:],D/'B_all100_256.png');grid(sorted(ids[100:],key=lambda x:(x['age'],x['id'])),D/'B_by_age_256.png')
rdir=D/'random20';rdir.mkdir(exist_ok=True);chosen=random.Random(18).sample(ids,20);index=[]
for x in chosen:
 out=Image.new('RGB',(1280,572),(245,245,245));draw=ImageDraw.Draw(out)
 for i,t in enumerate(teams):
  left,top=(i%5)*256,(i//5)*286;out.paste(tile(x,t['key']),(left,top));draw.text((left+5,top+260),t['key'],fill='black')
 path=rdir/(x['id']+'.png');out.save(path);index.append({'id':x['id'],'age':x['age'],'path':str(path.relative_to(OUT)),'team_order':[t['key'] for t in teams]})
(rdir/'index.json').write_text(json.dumps({'seed':18,'sampling':'random.Random(18).sample(manifest.identities,20)','source':'actual decoded delivered256WebP rects','identities':index},indent=2))
print('Created actual delivered WebP review previews and20 seeded ten-team enlargements.')
