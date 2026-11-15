"""Pack only approved, coherent photos; validate actual decoded WebP portraits.
No face compositing. No completion flags until all numerical and visual gates pass.
"""
from pathlib import Path
import json,hashlib,itertools,csv,gzip
from collections import Counter
import numpy as np
from PIL import Image
P=Path(__file__).resolve().parent;OUT=P.parent;ROOT=P.parents[3]
TEAMS=json.loads((P/'teams.json').read_text());KEYS=[t['key'] for t in TEAMS]
EXPECTED={'US White':16,'US Black':14,'Dominican Latino':10,'Venezuelan Latino':8,'Mexican Latino':4,'Cuban Latino':2,'Puerto Rican Latino':2,'Canadian White':2,'Caribbean Black':2,'Japanese':8,'Taiwanese':6,'Australian':4,'Filipino':2,'Korean':120}
def dump(path,value):path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(value,ensure_ascii=False,indent=2))
def quota_check(ids):
 assert len(ids)==200 and [x['id'] for x in ids]==[f'v18_{i+1:03d}' for i in range(200)]
 assert Counter(x['ethnicity'] for x in ids)==EXPECTED
 for sheet,expected in [('A',[4,8,5,2,1]),('B',[22,38,24,11,5])]:
  people=[x for x in ids if x['sheet']==sheet and x['ethnicity']=='Korean']
  assert [sum(lo<=x['age']<=hi for x in people) for lo,hi in [(18,20),(21,24),(25,28),(29,33),(34,38)]]==expected
 assert all(x['sex']=='male' for x in ids)
 assert all(not x['tags']['facial_hair'] for x in ids if x['ethnicity']=='Korean' and x['age']<=22)
 assert all(x['age']>=23 for x in ids if x['ethnicity']!='Korean')
 assert len(set(x['appearance_brief'] for x in ids))==200
 for i,x in enumerate(ids):assert x['sheet']==('A' if i<100 else 'B') and x['index']==i%100

def pack(ids,photos):
 quota_check(ids);assert len(photos)==2000
 assert all(x.get('visual_review_passed') is True for x in ids),'Visual identity review required'
 lookup={(x['id'],x['team']):x for x in photos};assert len(lookup)==2000
 for x in photos:assert x.get('visual_review_passed') is True,'Every jersey/cap photo requires review'
 manifest={'schema_version':'v18-production200-1','path_base':str(OUT.relative_to(ROOT)),'identity_count':200,'accepted_identity_count':200,'variant_count':2000,'production_complete':False,'asset_validation_passed':False,'review_status':'validation_in_progress','delivery_branch':'assets/v18-review','image_mode':'RGB','alpha':False,'grid':{'columns':10,'rows':10,'padding':8,'pitch':{'128':144,'256':272}},'teams':TEAMS,'sheets':[],'runtime_files':[],'runtime_sheet_bytes':0,'identities':ids,'validation':'validation.json','integration_notes':['All image paths are repository relative; rect excludes 8px black padding.','Only 128 sheets are runtime files; 256 and previews are review assets.','Game code unchanged; do not merge main automatically.']}
 for sheet in ['A','B']:
  group=[x for x in ids if x['sheet']==sheet]
  for key in KEYS:
   for size in [128,256]:
    pitch=size+16;canvas=Image.new('RGB',(pitch*10,pitch*10),(0,0,0));rel=Path('sheets')/sheet/str(size)/(key+'.webp');path=OUT/rel;path.parent.mkdir(parents=True,exist_ok=True)
    for x in group:
     frame=lookup[x['id'],key];im=Image.open(ROOT/frame['path']).convert('RGB')
     if 'rect_xyxy' in frame:im=im.crop(tuple(frame['rect_xyxy']))
     assert abs(im.width-im.height)<=2,'Approved frame must be square; do not stretch anatomy'
     tile=im.resize((size,size),Image.Resampling.LANCZOS);r,c=divmod(x['index'],10);rect=[c*pitch+8,r*pitch+8,size,size];canvas.paste(tile,(rect[0],rect[1]));x.setdefault('variants',{}).setdefault(key,{'sheets':{}})['sheets'][str(size)]={'path':str(path.relative_to(ROOT)),'rect':rect}
    quality=80 if size==128 else 85
    while True:
     canvas.save(path,'WEBP',quality=quality,method=6)
     if size==128 or path.stat().st_size<=600000 or quality<=55:break
     quality-=3
    item={'sheet':sheet,'team':key,'cell_size':size,'path':str(path.relative_to(ROOT)),'size':[pitch*10,pitch*10],'mode':'RGB','bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'encoding':{'quality':quality,'method':6,'lossless':False}}
    manifest['sheets'].append(item)
    if size==128:manifest['runtime_files'].append(item['path']);manifest['runtime_sheet_bytes']+=item['bytes']
 dump(OUT/'manifest.json',manifest)
 return manifest

def validate_pixels(manifest):
 assert len(manifest['sheets'])==40 and len(manifest['runtime_files'])==20
 quota_check(manifest['identities'])
 for item in manifest['sheets']:
  im=Image.open(ROOT/item['path']);assert im.mode=='RGB' and im.format=='WEBP';assert list(im.size)==item['size'];size=item['cell_size'];pitch=size+16;a=np.asarray(im)
  # Lossy WebP can ring near the photo edge; check the middle of each 16px gutter.
  for edge in range(11):
   pos=min(edge*pitch,im.width-1);assert int(a[:,pos,:].max())<=8,'Gutter contaminated';assert int(a[pos,:,:].max())<=8,'Gutter contaminated'
  assert hashlib.sha256((ROOT/item['path']).read_bytes()).hexdigest()==item['sha256']

def validate_embeddings(manifest,master_e,reference_e,variant_e):
 vdir=OUT/'validation';vdir.mkdir(exist_ok=True);ids=[x['id'] for x in manifest['identities']];results={};complete=True
 for size in [128,256]:
  e=master_e[size];ref=reference_e[size];v=variant_e[size];assert e.shape==(200,512) and ref.shape==(160,512) and v.shape==(10,200,512)
  assert np.allclose(np.linalg.norm(e,axis=-1),1,atol=1e-4) and np.allclose(np.linalg.norm(v,axis=-1),1,atol=1e-4)
  w=e@e.T;c=e@ref.T;upper=np.triu(np.ones((200,200),bool),1);assert upper.sum()==19900 and c.size==32000
  with gzip.open(vdir/f'prescreen_{size}.csv.gz','wt') as f:
   writer=csv.writer(f);writer.writerow(['kind','a','b','cosine'])
   for i in range(200):
    for j in range(i+1,200):writer.writerow(['within',ids[i],ids[j],float(w[i,j])])
    for j in range(160):writer.writerow(['reference',ids[i],j,float(c[i,j])])
  pair_min=1.;pair_max=-1.;own_top1=True;source_top1=bool(all(np.all(np.argmax(v[t]@e.T,axis=1)==np.arange(200)) for t in range(10)));count=0;pair_scores=[]
  for i,j in itertools.combinations(range(10),2):
   matrix=v[i]@v[j].T;diagonal=np.diag(matrix);pair_min=min(pair_min,float(diagonal.min()));pair_max=max(pair_max,float(diagonal.max()));count+=200;own_top1&=bool(np.all(np.argmax(matrix,axis=1)==np.arange(200)) and np.all(np.argmax(matrix,axis=0)==np.arange(200)))
   pair_scores.extend([{'id':ids[k],'team_a':KEYS[i],'team_b':KEYS[j],'cosine':float(diagonal[k])} for k in range(200)])
  assert count==9000;dump(vdir/f'same_identity_{size}.json',pair_scores)
  passed=bool(w[upper].max()<.4 and c.max()<.4 and pair_min>=.6 and own_top1 and source_top1);complete&=passed
  results[str(size)]={'passed':passed,'within_pairs':19900,'reference_pairs':32000,'within_min':float(w[upper].min()),'within_max':float(w[upper].max()),'reference_min':float(c.min()),'reference_max':float(c.max()),'same_identity_pairs':count,'same_identity_min':pair_min,'same_identity_max':pair_max,'source_to_variant_min':float(min(np.diag(v[t]@e.T).min() for t in range(10))),'mutual_cross_team_own_identity_top1':own_top1,'prescreen_own_identity_top1':source_top1}
 dump(OUT/'validation.json',{'passed':bool(complete),'metrics':results,'scope':'actual decoded final WebP portraits, raw normalized ArcFace cosine','model':'buffalo_l/w600k_r50.onnx'})
 # This function receives measured embeddings only; flags remain false on any failure.
 if complete:
  required=['previews/A_all100_256.png','previews/B_all100_256.png','previews/B_by_age_256.png','CLAUDE_HANDOFF.md','previews/random20/index.json']
  assert all((OUT/f).exists() for f in required),'Required review artifacts missing'
  random20=json.loads((OUT/'previews/random20/index.json').read_text());assert len(random20['identities'])==20 and all((OUT/x['path']).exists() for x in random20['identities'])
  assert len(json.loads((P/'approved_wardrobe_photos.json').read_text()))==2000
  manifest.update({'production_complete':True,'asset_validation_passed':True,'review_status':'pending_game_review'});dump(OUT/'manifest.json',manifest)
 return bool(complete)

if __name__=='__main__':
 ids=json.loads((P/'approved_identities.json').read_text());photos=json.loads((P/'approved_wardrobe_photos.json').read_text());gate=json.loads((P/'full_identity_gate.json').read_text());assert gate.get('passed') is True,'Full 200-person prescreen required before wardrobe delivery';m=pack(ids,photos);validate_pixels(m);print('Packed final photos. Completion remains false until measured embedding checks pass.')
