"""Build lossless atlases from visually approved independent portraits only."""
from pathlib import Path
import json,hashlib,shutil,csv,gzip,sys
import numpy as np
from PIL import Image,ImageDraw
P=Path(__file__).resolve().parent;OUT=P.parent;ROOT=P.parents[3]
def dump(path,obj):path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(obj,ensure_ascii=False,indent=2))
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def pack():
 sel=json.loads((P/'selection.json').read_text());assert sel['count']==20 and sel['female_count']==16 and sel['male_count']==4 and sel['glasses_count']==3
 review=json.loads((P/'visual_review.json').read_text());assert review['passed'] and set(review['approved_candidates'])=={x['candidate'] for x in sel['chosen']}
 reviewed={x['candidate']:x['master_sha256'] for x in review['sources']}
 assert all(reviewed[x['candidate']]==x['master_sha256'] for x in sel['chosen'])
 chosen=sel['chosen'];ids=[]
 for i,x in enumerate(chosen):
  rid=f'v19_sec_{i+1:02}';source=OUT/'sources'/f'{rid}.png';assert sha(Path(x['master_path']))==x['master_sha256'];shutil.copyfile(x['master_path'],source)
  ids.append({'id':rid,'identity_id':rid,'r':'sec','age':x['age'],'f':x['f'],'sex':'female' if x['f'] else 'male','tags':x['tags'],'glasses':x['tags']['glasses'],'fictional':True,'sheet':'secretary20','index':i,'rect':{},'sheets':{},'appearance_brief':x['brief'],'source':{'path':str(source.relative_to(OUT)),'sha256':sha(source),'candidate':x['candidate'],'native_sha256':x['native_sha256']},'natural_continuous_upper_body':True})
 m={'schema_version':'v19-secretary20-1','count':20,'identity_count':20,'accepted_identity_count':20,'role_counts':{'sec':{'count':20,'female':16,'male':4}},'path_base':'assets/v19/secretary20/','image_mode':'RGB','alpha':False,'grid':{'rows':10,'columns':10,'occupied':20,'empty_cells':80,'padding':8,'pitch':{'128':144,'256':272}},'sheets':{},'runtime_files':['sheets/128.webp','sheets/256.webp'],'runtime_sheet_bytes':0,'identities':ids,'asset_validation_passed':False,'production_complete':False,'review_status':'validation_in_progress','game_connected':False,'validation':'validation.json','integration_notes':['Paths are relative to path_base.','r=sec, f=1 female; identities.sheets[size] supplies path and rect.','128 pitch144 and256 pitch272 with8px black padding.','All20 secretary identities are new. Keep v8 eight secretary options available.','Game code unchanged; separate Claude integration.']}
 jobs=[]
 for size in [128,256]:
  pitch=size+16;canvas=Image.new('RGB',(pitch*10,pitch*10),(0,0,0))
  for i,x in enumerate(ids):
   im=Image.open(OUT/x['source']['path']).convert('RGB').resize((size,size),Image.Resampling.LANCZOS);r,c=divmod(i,10);rect=[c*pitch+8,r*pitch+8,size,size];canvas.paste(im,rect[:2]);x['rect'][str(size)]=rect;x['sheets'][str(size)]={'path':f'sheets/{size}.webp','rect':rect,'index':i}
  dest=OUT/'sheets'/f'{size}.webp';canvas.save(dest,'WEBP',lossless=True,method=6,exact=True)
  m['sheets'][str(size)]={'path':f'sheets/{size}.webp','width':pitch*10,'height':pitch*10,'mode':'RGB','cell_size':size,'pitch':pitch,'padding':8,'count':20,'empty_cells':80,'encoding':'lossless WebP','bytes':dest.stat().st_size,'sha256':sha(dest)};m['runtime_sheet_bytes']+=dest.stat().st_size
  decoded=Image.open(dest);assert decoded.mode=='RGB' and np.array_equal(np.asarray(canvas),np.asarray(decoded))
  for i,x in enumerate(ids):
   left,top,w,h=x['rect'][str(size)];tile=decoded.crop((left,top,left+w,top+h));file=P/'decoded'/f'{x["id"]}_{size}.png';file.parent.mkdir(exist_ok=True);tile.save(file)
  assert np.asarray(decoded)[pitch*2:,:,:].max()==0
 for x in ids:jobs.append({'id':x['id'],**{str(s):str(P/'decoded'/f'{x["id"]}_{s}.png') for s in [128,256]}})
 dump(P/'delivery_jobs.json',jobs);dump(OUT/'manifest.json',m)
 # Preview is extracted from delivered WebP cells, so review sees real runtime pixels.
 preview=Image.new('RGB',(5*256,4*284),'white');draw=ImageDraw.Draw(preview);sheet=Image.open(OUT/'sheets/256.webp')
 for i,x in enumerate(ids):
  r,c=divmod(i,5);a,b,w,h=x['rect']['256'];preview.paste(sheet.crop((a,b,a+w,b+h)),(c*256,r*284));draw.text((c*256+6,r*284+262),f'{x["id"]}  age{x["age"]}',fill='black')
 preview.save(OUT/'previews/all20_256.png');print('Packed20 portraits, two lossless WebP sheets. Final flags remain false.')
def validate():
 m=json.loads((OUT/'manifest.json').read_text());z=np.load(OUT/'validation/delivered_embeddings.npz');refs=np.load(OUT/'validation/reference_embeddings.npz');source=json.loads((P/'selection.json').read_text());metrics={};passed=True
 assert list(z['ids'])==[x['id'] for x in m['identities']]
 assert len(m['identities'])==20 and [x['id'] for x in m['identities']]==[f'v19_sec_{i+1:02}' for i in range(20)]
 assert sum(x['f'] for x in m['identities'])==16 and sum(x['tags']['glasses'] for x in m['identities'])==3
 assert all(x['r']=='sec' and (24<=x['age']<=28 if x['f'] else 26<=x['age']<=36) for x in m['identities'])
 assert m['runtime_sheet_bytes']==sum((OUT/f).stat().st_size for f in m['runtime_files'])
 runtime_hashes={}
 for size in [128,256]:
  info=m['sheets'][str(size)];path=OUT/info['path'];sheet=Image.open(path);pitch=size+16
  assert sheet.format=='WEBP' and sheet.mode=='RGB' and sheet.size==(pitch*10,pitch*10) and sha(path)==info['sha256'] and path.stat().st_size==info['bytes']
  outside=np.ones((pitch*10,pitch*10),bool)
  for i,x in enumerate(m['identities']):
   r,c=divmod(i,10);rect=[c*pitch+8,r*pitch+8,size,size];assert x['index']==i and x['rect'][str(size)]==rect and x['sheets'][str(size)]['rect']==rect
   left,top,w,h=rect;outside[top:top+h,left:left+w]=False;source_path=OUT/x['source']['path'];native=Image.open(source_path);assert native.mode=='RGB' and min(native.size)>=256 and sha(source_path)==x['source']['sha256']
   actual=sheet.crop((left,top,left+w,top+h));assert actual.tobytes()==native.resize((size,size),Image.Resampling.LANCZOS).tobytes();runtime_hashes[x['id'],str(size)]=hashlib.sha256(actual.tobytes()).hexdigest()
  assert np.asarray(sheet)[outside].max()==0
 detection=json.loads((OUT/'validation/delivered_embeddings.json').read_text());assert not detection['errors'] and len(detection['records'])==20
 for row in detection['records']:
  for size in ['128','256']:assert row['details'][size]['pixel_sha256']==runtime_hashes[row['id'],size]
 for s in [128,256]:
  e=z[f'e{s}'];r=refs[f'e{s}'];within=e@e.T;cross=e@r.T;mask=np.triu(np.ones((20,20),bool),1);ok=bool(within[mask].max()<.4 and cross.max()<.4);passed&=ok
  metrics[str(s)]={'passed':ok,'within_pairs':190,'within_min':float(within[mask].min()),'within_max':float(within[mask].max()),'unique_reference_identity_count':406,'reference_photo_count':len(r),'cross_photo_pairs':20*len(r),'reference_min':float(cross.min()),'reference_max':float(cross.max())}
  with gzip.open(OUT/'validation'/f'all_pairs_{s}.csv.gz','wt') as f:
   w=csv.writer(f);w.writerow(['kind','a','b','cosine'])
   for i in range(20):
    for j in range(i+1,20):w.writerow(['within',z['ids'][i],z['ids'][j],float(within[i,j])])
    for j in range(len(r)):w.writerow(['reference',z['ids'][i],refs['ids'][j],float(cross[i,j])])
  # Aggregate multiple reference photos to the worst case for each of406 identities.
  logical=list(refs['identity_ids']);unique=sorted(set(logical));maxima=np.stack([cross[:,[i for i,v in enumerate(logical) if v==rid]].max(axis=1) for rid in unique],axis=1)
  with gzip.open(OUT/'validation'/f'cross406_{s}.csv.gz','wt') as f:
   w=csv.writer(f);w.writerow(['new_id','reference_id','max_cosine'])
   for i in range(20):
    for j,rid in enumerate(unique):w.writerow([z['ids'][i],rid,float(maxima[i,j])])
 v={'passed':bool(passed),'metrics':metrics,'identity_count':20,'female_count':16,'male_count':4,'glasses_count':3,'visual_review':json.loads((P/'visual_review.json').read_text()),'actual_decoded_runtime_pixels':True,'asset_geometry':'Full coherent photo crop and isotropic resize only; alignment only for recognition model input','protocol':json.loads((OUT/'validation/reference_provenance.json').read_text())['protocol'],'cached_protocol_reproduction':json.loads((OUT/'validation/protocol_reproduction_summary.json').read_text())}
 dump(OUT/'validation.json',v);assert passed,'Face similarity criteria failed; completion flags remain false'
 print(json.dumps(metrics,indent=2));print('Final decoded WebP identity gate passed.')
if __name__=='__main__':pack() if sys.argv[1]=='pack' else validate()
