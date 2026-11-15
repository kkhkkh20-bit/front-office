"""Create v18 planned roster. Does not assert generated or validated assets."""
import json,random
from pathlib import Path
from collections import Counter
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[3];rng=random.Random(18)
def ages(bands):
 return [lo+(i%(hi-lo+1)) for lo,hi,count in bands for i in range(count)]
eth=[e for e,n in [('US White',16),('US Black',14),('Dominican Latino',10),('Venezuelan Latino',8),('Mexican Latino',4),('Cuban Latino',2),('Puerto Rican Latino',2),('Canadian White',2),('Caribbean Black',2),('Japanese',8),('Taiwanese',6),('Australian',4),('Filipino',2)] for _ in range(n)]+['Korean']*120
age=[23+(i*7%12) for i in range(80)]+ages([(18,20,4),(21,24,8),(25,28,5),(29,33,2),(34,38,1)])+ages([(18,20,22),(21,24,38),(25,28,24),(29,33,11),(34,38,5)])
glasses=set(rng.sample(range(80),8)+rng.sample(range(80,200),12))
beards=set(rng.sample(range(80),32)+rng.sample([i for i in range(80,200) if age[i]>22],18))
choices=[['round full cheeks','square wide jaw','long rectangular','oval high cheekbones','heart shaped','triangular narrow chin'],['wide set almond eyes','narrow deep set eyes','round open eyes','slightly hooded eyes','upswept eyes'],['straight thick brows','arched fine brows','low broad brows','short angled brows'],['low wide nose','slender straight nose','rounded broad nose','prominent bridge nose'],['thin wide lips','full lower lip','small defined mouth','wide curved mouth'],['short crew cut','short two block cut','close buzz cut','short straight fringe','short side part','short tight curls','long tied back hair'],['lean athletic','average athletic','stocky catcher build'],['light','medium light','medium tan','deep tan']]
ids=[]
for i in range(200):
 traits=[rng.choice(c) for c in choices]
 if age[i]<=20:traits[5]=rng.choice(choices[5][:5])
 brief=f'{eth[i]} male, apparent age {age[i]}; face: {traits[0]}; eyes: {traits[1]}; eyebrows: {traits[2]}; nose: {traits[3]}; mouth: {traits[4]}; hair: {traits[5]}; build: {traits[6]}; skin tone: {traits[7]} within natural ancestry range; accessories: '+('thin sports glasses' if i in glasses else 'none')+'; facial hair: '+('neatly trimmed moustache and chin beard' if i in beards else 'clean shaven')+'.'
 ids.append({'id':f'v18_{i+1:03d}','sheet':'A' if i<100 else 'B','index':i%100,'age':age[i],'sex':'male','ethnicity':eth[i],'appearance_brief':brief,'tags':{'glasses':i in glasses,'facial_hair':i in beards},'status':'planned'})
assert len(ids)==200 and len(set(x['appearance_brief'] for x in ids))==200
assert Counter(eth)['Korean']==120
assert sum(x['age']<=24 for x in ids if x['ethnicity']=='Korean')==72
assert not any(x['tags']['facial_hair'] for x in ids if x['ethnicity']=='Korean' and x['age']<=22)
(OUT/'planned_identities.json').write_text(json.dumps(ids,ensure_ascii=False,indent=2))
source=json.loads((ROOT/'assets/v6/batch01d/production60/manifest.json').read_text())
(OUT/'teams.json').write_text(json.dumps(source['teams'],ensure_ascii=False,indent=2))
(OUT/'roster_check.json').write_text(json.dumps({'passed':True,'identity_count':200,'ethnicity_counts':dict(Counter(eth)),'Korean_under25':72,'Korean_beards':18,'foreign_beards':32,'glasses':20,'scope':'planned metadata only; photos not validated'},indent=2))
print('200 planned identities, quotas verified')
