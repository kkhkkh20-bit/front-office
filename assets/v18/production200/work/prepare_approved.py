from pathlib import Path
import json,shutil,hashlib,csv,gzip
import numpy as np
from PIL import Image,ImageDraw
from collections import Counter
P=Path(__file__).resolve().parent;ROOT=P.parents[3];OUT=P.parent
selection=json.loads((P/'canonical/selection.json').read_text());assert selection['selected_count']==200,'Cannot start wardrobe before all200 identities pass'
rows=selection['selected'];meta=json.loads((P/'visual_metadata.json').read_text());extra=P/'final_visual_metadata.json'
if extra.exists():meta.update(json.loads(extra.read_text()))
for x in rows:
 key=x['key'];v=meta.get(key)
 if key.startswith('clean_young/'):
  v=dict(meta[key[len('clean_young/'):]]);v['facial_hair']=False
 assert v and v.get('visual_review_passed'),f'Unreviewed source: {key}'
 x['attributes']['tags']={k:v[k] for k in ['glasses','facial_hair']}
 assert not (x['attributes']['ethnicity']=='Korean' and x['attributes']['age']<=22 and v['facial_hair']),key
foreign=[]
for ethnicity in selection['required_quotas']:
 if ethnicity.startswith('Korean'):continue
 foreign.extend(x for x in rows if x['attributes']['ethnicity']==ethnicity)
assert len(foreign)==80
ak=[];bk=[]
for (lo,hi),cap in zip([(18,20),(21,24),(25,28),(29,33),(34,38)],[4,8,5,2,1]):
 group=sorted([x for x in rows if x['attributes']['ethnicity']=='Korean' and lo<=x['attributes']['age']<=hi],key=lambda x:(x['attributes']['age'],x['key']));ak.extend(group[:cap]);bk.extend(group[cap:])
ordered=foreign+ak+bk;assert len(ordered)==200
ids=[];keys=[];source_dir=OUT/'identity_prescreen/masters256';source_dir.mkdir(parents=True,exist_ok=True)
for i,row in enumerate(ordered):
 a=dict(row['attributes']);rid=f'v18_{i+1:03d}';a.update(id=rid,sheet='A' if i<100 else 'B',index=i%100,visual_review_passed=True,source_candidate_key=row['key']);a.pop('status',None);target=source_dir/(rid+'.png');shutil.copyfile(ROOT/row['master_path'],target);a['source_path']=str(target.relative_to(ROOT));a['source_sha256']=hashlib.sha256(target.read_bytes()).hexdigest()
 brief=a['appearance_brief'];brief=brief.split('; accessories:')[0].split('; facial hair:')[0];kp=row['details']['256']['landmarks'];box=row['details']['256']['bbox'];distance=np.linalg.norm(np.array(kp[1])-kp[0])/(box[2]-box[0]);mouth=np.linalg.norm(np.array(kp[4])-kp[3])/(box[2]-box[0]);brief+=f'; observed eye spacing {distance:.4f} and mouth width {mouth:.4f} relative to face width; accessories: '+('thin framed glasses' if a['tags']['glasses'] else 'none')+'; facial hair: '+('neatly groomed moustache or chin beard' if a['tags']['facial_hair'] else 'clean shaven')+'.';a['appearance_brief']=brief;ids.append(a);keys.append(row['key'])
from build_delivery import quota_check
quota_check(ids);assert len(set(x['appearance_brief'] for x in ids))==200
(P/'approved_identities.json').write_text(json.dumps(ids,ensure_ascii=False,indent=2))
n=np.load(P/'canonical/embeddings.npz');order=[list(n['candidate_keys']).index(k) for k in keys];metrics={};vdir=OUT/'validation';vdir.mkdir(exist_ok=True)
for size in [128,256]:
 e=n[f'e{size}'][order];ref=n[f'ref{size}'];w=e@e.T;c=e@ref.T;mask=np.triu(np.ones((200,200),bool),1);assert w[mask].max()<.4 and c.max()<.4
 with gzip.open(vdir/f'prescreen_{size}.csv.gz','wt') as f:
  writer=csv.writer(f);writer.writerow(['kind','a','b','cosine'])
  for i in range(200):
   for j in range(i+1,200):writer.writerow(['within',ids[i]['id'],ids[j]['id'],float(w[i,j])])
   for j in range(160):writer.writerow(['reference',ids[i]['id'],str(n['reference_ids'][j]),float(c[i,j])])
 metrics[str(size)]={'within_pairs':19900,'reference_pairs':32000,'within_min':float(w[mask].min()),'within_max':float(w[mask].max()),'reference_min':float(c.min()),'reference_max':float(c.max())}
np.savez_compressed(OUT/'identity_prescreen/embeddings.npz',ids=np.array([x['id'] for x in ids]),e128=n['e128'][order],e256=n['e256'][order],reference_ids=n['reference_ids'],ref128=n['ref128'],ref256=n['ref256'])
gate={'passed':True,'count':200,'metrics':metrics,'protocol':json.loads((P/'canonical/protocol.json').read_text()),'visual_review_passed':True,'quota_passed':True,'tag_counts':dict(Counter(('Korean' if x['ethnicity']=='Korean' else 'Foreign')+('_beard' if x['tags']['facial_hair'] else '_clean') for x in ids)),'glasses_count':sum(x['tags']['glasses'] for x in ids)};(P/'full_identity_gate.json').write_text(json.dumps(gate,indent=2));(OUT/'identity_prescreen/validation.json').write_text(json.dumps(gate,indent=2))
D=P/'wardrobe';D.mkdir(exist_ok=True)
for b in range(10):
 canvas=Image.new('RGB',(1024,1280),(90,90,90))
 for j,x in enumerate(ids[b*20:(b+1)*20]):canvas.paste(Image.open(ROOT/x['source_path']),(j%4*256,j//4*256))
 canvas.save(D/f'sources{b:02d}.png');canvas.thumbnail((800,1000));canvas.save(D/f'sources{b:02d}.jpg',quality=90)
print(json.dumps(gate,indent=2))
