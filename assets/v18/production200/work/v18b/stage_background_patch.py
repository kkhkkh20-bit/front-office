"""Build and test background revisions separately from the atlas under validation."""
import os
os.environ['OMP_NUM_THREADS']='1';os.environ['OPENBLAS_NUM_THREADS']='1'
from pathlib import Path
import json,hashlib,sys,shutil
import numpy as np
from PIL import Image
from photo_frame import extract
import measure_final as final
P=Path(__file__).resolve().parent;OUT=P.parents[1];ROOT=P.parents[4];D=P/'staged_patch'
TARGETS={'v18_165','v18_169','v18_170','v18_174'}
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def dump(p,x):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(x,indent=2))
def native(row):
 path=row['source_render'];assert sha(path)==row['source_render_sha256']
 if row.get('whole_native_photo'):
  im=Image.open(path).convert('RGB');assert im.width==im.height>=384;frame={'native_dimensions':list(im.size),'crop_xyxy':[0,0,im.width,im.height],'native_square_size':im.width,'protocol':'Already separated complete native photograph; no further edge trim','generation_origin':row['generation_origin']}
 else:im,frame=extract(path,row.get('source_grid_side',2 if row['id'] in TARGETS else 3),row['source_cell'])
 return im,frame
def prepare():
 m=json.loads((OUT/'manifest.json').read_text());selected=json.loads((P/'approved_photos.json').read_text());assert selected['complete'];photos={(x['id'],x['team']):x for x in selected['photos']};targets=[x for x in json.loads((P/'actual_pixel_exclusions.json').read_text()) if x['id'] in TARGETS];teams=sorted({x['team'] for x in targets});original={(x['id'],x['team']):x for x in json.loads((OUT/'work/approved_wardrobe_photos.json').read_text())};entries=[];jobs=[]
 for team in teams:
  for size in [128,256,384]:
   previous=next(x for x in m['sheets'] if x['sheet']=='B' and x['team']==team and x['cell_size']==size);pitch=size+16;canvas=Image.new('RGB',(pitch*10,pitch*10),'black')
   for person in m['identities']:
    if person['sheet']!='B':continue
    rid=person['id']
    if size==384 or rid in TARGETS:im,_=native(photos[rid,team])
    else:
     source=original[rid,team];assert sha(ROOT/source['path'])==source['photograph_sha256'];im=Image.open(ROOT/source['path']).convert('RGB')
    tile=im.resize((size,size),Image.Resampling.LANCZOS);r,c=divmod(person['index'],10);canvas.paste(tile,(c*pitch+8,r*pitch+8))
   file=D/f'sheets/B/{size}/{team}.webp';file.parent.mkdir(parents=True,exist_ok=True);canvas.save(file,'WEBP',quality=previous['encoding']['quality'],method=6);entries.append({'final_path':previous['path'],'staged_path':str(file.relative_to(ROOT)),'baseline_sha256':previous['sha256'],'sha256':sha(file),'bytes':file.stat().st_size,'size':size,'team':team})
 for x in targets:
  person=next(p for p in m['identities'] if p['id']==x['id']);jobs.append({'id':x['id'],'team':x['team'],'variants':{str(s):{'path':str((D/f'sheets/B/{s}/{x["team"]}.webp').relative_to(ROOT)),'rect':person['variants'][x['team']]['sheets'][str(s)]['rect']} for s in [128,256,384]}})
 dump(D/'plan.json',{'entries':entries,'jobs':jobs,'replacement_keys':[{'id':x['id'],'team':x['team'],'measurement_key':photos[x['id'],x['team']]['measurement_key']} for x in targets]});print('Prepared9 temporary atlases; delivery files remain unchanged.',flush=True)
 final.rec.initialize()
 with np.load(OUT/'identity_prescreen/embeddings.npz') as z:src={k:z[k] for k in z.files}
 with np.load(P/'baseline/delivered_embeddings.npz') as z:old={k:z[k] for k in z.files}
 ids=list(old['ids']);teams=list(old['teams']);results=[]
 for job in jobs:
  record,e=final.measure(job);assert e is not None,record;k=ids.index(job['id']);t=teams.index(job['team']);metrics={}
  for s in [128,256,384]:
   ss=min(s,256);cross=src[f'e{ss}']@e[s];other=cross.copy();other[k]=-2;legacy=src[f'ref{ss}']@e[s];same=old[f'e{ss}'][:,k]@e[s];own=(old[f'e{ss}'][t]@e[s]).argmax()==k
   metrics[str(s)]={'passed':bool(other.max()<.4 and legacy.max()<.4 and same.min()>=.6 and cross.argmax()==k and own),'other199_max':float(other.max()),'legacy160_max':float(legacy.max()),'same_original_all10_min':float(same.min())}
  row={'id':job['id'],'team':job['team'],'passed':all(x['passed'] for x in metrics.values()),'metrics':metrics,'record':record};results.append(row);print(job['id'],job['team'],'staged compressed pixels passed',row['passed'],metrics,flush=True)
 dump(D/'validation.json',{'passed':all(x['passed'] for x in results),'scope':'Three revised photographs in complete staged atlases, actual128/256/384 decoded WebP pixels','results':results});assert all(x['passed'] for x in results),'Staged repair still fails; do not apply'
def apply():
 plan=json.loads((D/'plan.json').read_text());test=json.loads((D/'validation.json').read_text());first=json.loads((OUT/'validation.json').read_text());assert test['passed'] and first['revision']=='v18b' and first['actual_decoded_webp_portrait_count']==6000
 assert all(x['passed'] for x in first['metrics'].values()),'Resolve other full-pair failures before applying this limited patch'
 shutil.copyfile(OUT/'validation.json',P/'first_compressed_validation.json');m=json.loads((OUT/'manifest.json').read_text());photos={(x['id'],x['team']):x for x in json.loads((P/'approved_photos.json').read_text())['photos']}
 for entry in plan['entries']:
  assert sha(ROOT/entry['final_path'])==entry['baseline_sha256'] and sha(ROOT/entry['staged_path'])==entry['sha256'];shutil.copyfile(ROOT/entry['staged_path'],ROOT/entry['final_path']);row=next(s for s in m['sheets'] if s['path']==entry['final_path']);row.update(sha256=entry['sha256'],bytes=entry['bytes'])
 m.update(asset_validation_passed=False,production_complete=False,review_status='v18b_compressed_pixel_validation_pending',runtime_sheet_bytes=sum((ROOT/p).stat().st_size for p in m['runtime_files']),all_sheet_bytes=sum(x['bytes'] for x in m['sheets']));dump(OUT/'manifest.json',m)
 packing=json.loads((P/'packing_result.json').read_text());packing.update(runtime_sheet_bytes=m['runtime_sheet_bytes'],max256bytes=max(x['bytes'] for x in m['sheets'] if x['cell_size']==256),max384bytes=max(x['bytes'] for x in m['sheets'] if x['cell_size']==384),background_patch_applied=True);dump(P/'packing_result.json',packing)
 f=OUT/'validation/v18b_native_provenance.json';v=json.loads(f.read_text())
 for target in plan['replacement_keys']:
  row=photos[target['id'],target['team']];assert row['measurement_key']==target['measurement_key'];im,frame=native(row);replacement={'id':row['id'],'team':row['team'],'source_render':row['source_render'],'source_render_sha256':row['source_render_sha256'],'source_cell':row['source_cell'],**frame,'native_pixels_sha256':hashlib.sha256(im.tobytes()).hexdigest(),'measurement_key':row['measurement_key'],'visual_review':str((P/'reviews'/f'{row["measurement_key"]}.json').relative_to(ROOT))};i=next(i for i,x in enumerate(v['photos']) if x['id']==row['id'] and x['team']==row['team']);v['photos'][i]=replacement
 v.update(archived_native_crop_verification_passed=False,minimum_native_photo_side=min(x['native_square_size'] for x in v['photos']));dump(f,v);dump(P/'staged_patch_applied.json',{'passed':True,'updated_sheets':9,'updated_photographs':3,'replacement_keys':plan['replacement_keys']});print('Applied9 tested atlases; rerun native archive verification and all actual-pixel checks.',flush=True)
if __name__=='__main__':prepare() if sys.argv[1]=='prepare' else apply()
