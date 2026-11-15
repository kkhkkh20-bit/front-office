"""Pack genuine generated native frames, with completion flags held false."""
from pathlib import Path
import json,hashlib,copy
import numpy as np
from PIL import Image
from photo_frame import extract,PROTOCOL
P=Path(__file__).resolve().parent;OUT=P.parents[1];ROOT=P.parents[4]
TARGETS={'v18_165','v18_169','v18_170','v18_174'}
def dump(p,v):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(v,ensure_ascii=False,indent=2))
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def main():
 options=json.loads((P/'pack_options.json').read_text());selected=json.loads((P/'approved_photos.json').read_text())
 assert selected['complete'] and selected['require_visual_review'] and selected['selected_photo_count']==2000
 photos={(x['id'],x['team']):x for x in selected['photos']};assert len(photos)==2000 and all(x['visual_review_passed'] for x in photos.values())
 old=json.loads((P/'baseline/manifest.json').read_text());m=copy.deepcopy(old);ids=m['identities'];original={(x['id'],x['team']):x for x in json.loads((OUT/'work/approved_wardrobe_photos.json').read_text())};provenance=[];verified={}
 assert [x['id'] for x in ids]==[f'v18_{i+1:03}' for i in range(200)]
 m.update(production_complete=False,asset_validation_passed=False,review_status='v18b_validation_in_progress',revision='v18b')
 dump(OUT/'manifest.json',m)
 dump(OUT/'production_status.json',{'production_complete':False,'asset_validation_passed':False,'review_status':'v18b_packing_in_progress','revision':'v18b'})
 m['grid']['pitch']['384']=400
 for x in ids:
  if x['id'] in TARGETS:x['revision']='v18b'
 for size in [128,256,384]:
  for group in ['A','B']:
   for team in [t['key'] for t in m['teams']]:
    if size==128 and (group=='A' or not options['update128_targets']):continue
    if size==256 and not options['reexport256'] and group=='A':continue
    pitch=size+16;canvas=Image.new('RGB',(pitch*10,pitch*10),(0,0,0));people=[x for x in ids if x['sheet']==group]
    for person in people:
     rid=person['id'];row=photos[rid,team]
     if size==384 or rid in TARGETS:
      render=row['source_render'];digest=row['source_render_sha256']
      if render not in verified:assert sha(render)==digest;verified[render]=digest
      review=json.loads((P/'reviews'/f'{row["measurement_key"]}.json').read_text());assert review['passed'] and review['render_sha256']==digest and review['frame_extractor_sha256']==sha(P/'photo_frame.py')
      if row.get('whole_native_photo'):
       native=Image.open(render).convert('RGB');assert native.width==native.height and native.width>=384;frame={'native_dimensions':list(native.size),'crop_xyxy':[0,0,native.width,native.height],'native_square_size':native.width,'protocol':'Already separated complete native photograph; no further edge trim','generation_origin':row['generation_origin']}
      else:native,frame=extract(render,row.get('source_grid_side',2 if rid in TARGETS else 3),row['source_cell'])
      assert min(native.size)>=384
      if size==384:provenance.append({'id':rid,'team':team,'source_render':render,'source_render_sha256':digest,'source_cell':row['source_cell'],**frame,'native_pixels_sha256':hashlib.sha256(np.asarray(native).tobytes()).hexdigest(),'measurement_key':row['measurement_key'],'visual_review':str((P/'reviews'/f'{row["measurement_key"]}.json').relative_to(ROOT))})
      tile=native.resize((size,size),Image.Resampling.LANCZOS)
     else:
      src=ROOT/original[rid,team]['path'];assert sha(src)==original[rid,team]['photograph_sha256'];native=Image.open(src).convert('RGB');assert native.size==(256,256);tile=native if size==256 else native.resize((size,size),Image.Resampling.LANCZOS)
     r,c=divmod(person['index'],10);rect=[c*pitch+8,r*pitch+8,size,size];canvas.paste(tile,rect[:2]);person['variants'][team]['sheets'][str(size)]={'path':str((OUT/'sheets'/group/str(size)/(team+'.webp')).relative_to(ROOT)),'rect':rect}
    path=OUT/'sheets'/group/str(size)/(team+'.webp');path.parent.mkdir(parents=True,exist_ok=True);quality={128:80,256:88,384:90}[size]
    while True:
     canvas.save(path,'WEBP',quality=quality,method=6)
     if size!=384 or path.stat().st_size<=2500000 or quality==88:break
     quality-=1
    entry={'sheet':group,'team':team,'cell_size':size,'path':str(path.relative_to(ROOT)),'size':[pitch*10,pitch*10],'mode':'RGB','bytes':path.stat().st_size,'sha256':sha(path),'encoding':{'quality':quality,'method':6,'lossless':False}}
    previous=[i for i,x in enumerate(m['sheets']) if x['sheet']==group and x['team']==team and x['cell_size']==size]
    if previous:m['sheets'][previous[0]]=entry
    else:m['sheets'].append(entry)
    print('Packed',group,size,team,entry['bytes'],flush=True)
 assert len(m['sheets'])==60 and len(provenance)==2000
 m['runtime_files']=old['runtime_files']+[s['path'] for s in m['sheets'] if s['cell_size']==384]
 assert len(m['runtime_files'])==40 and len(set(m['runtime_files']))==40
 m['runtime_sheet_bytes']=sum((ROOT/f).stat().st_size for f in m['runtime_files']);m['all_sheet_bytes']=sum(x['bytes'] for x in m['sheets']);m['runtime_file_count']=40
 m['integration_notes']=['All image paths are repository-relative; rect excludes8px black padding; do not prepend path_base again.','128 sheets are for lists;384 sheets are for large detail photos loaded on demand;256 is retained as a compatibility/review size.','runtime_files includes20x128 and20x384 sheets. Do not preload all384 sheets at once.','Only v18_165,v18_169,v18_170,v18_174 have identity revision flags; IDs,ages,order,tags unchanged.','Game code unchanged; separate Claude integration; do not merge main automatically.']
 for group in ['A','B']:
  for team in [x['key'] for x in m['teams']]:
   if group=='A' or not options['update128_targets']:
    assert sha(OUT/'sheets'/group/'128'/(team+'.webp'))==sha(P/'baseline/sheets'/group/'128'/(team+'.webp'))
 for before,after in zip(old['identities'],ids):
  assert {k:v for k,v in before.items() if k not in ['variants','revision']}=={k:v for k,v in after.items() if k not in ['variants','revision']}
 dump(OUT/'manifest.json',m);dump(OUT/'validation/v18b_native_provenance.json',{'protocol':PROTOCOL,'count':2000,'minimum_native_photo_side':min(x['native_square_size'] for x in provenance),'photos':provenance})
 dump(P/'packing_result.json',{'complete':True,'sheet_count':60,'runtime_file_count':40,'runtime_sheet_bytes':m['runtime_sheet_bytes'],'options':options,'max256bytes':max(x['bytes'] for x in m['sheets'] if x['cell_size']==256),'max384bytes':max(x['bytes'] for x in m['sheets'] if x['cell_size']==384)})
 dump(OUT/'production_status.json',{'production_complete':False,'asset_validation_passed':False,'review_status':'v18b_compressed_pixel_validation_pending','revision':'v18b','identity_count':200,'completed_variant_count':2000,'completed_sheet_count':60,'runtime_sheet_bytes':m['runtime_sheet_bytes']})
 print('Packed60 sheets from native generated whole photos. Completion flags remain false pending actual compressed-pixel validation.')
if __name__=='__main__':main()
