import os
os.environ['OPENBLAS_NUM_THREADS']='1';os.environ['OMP_NUM_THREADS']='1'
from pathlib import Path
import json,hashlib,shutil,concurrent.futures,multiprocessing
import numpy as np
from PIL import Image
import measure
from measure_A_revision3 import work
from reconstruct_A_native import encode
W=Path('/dev/shm/v21b-work');R=W/'repo/assets/v21/amateur200';SIZES=[128,256,384]
def main():
 people=json.load(open(W/'B100_stage3_selected_people.json'));rows=json.load(open(W/'B_current_variant_sources.json'));variants=json.load(open(R/'manifest.json'))['variant_keys'];assert len(rows)==1200 and len({c['id'] for c in rows})==1200
 (W/'B_final_source_snapshot.json').write_text(json.dumps([{'id':c['id'],'normalized_native_sha256':hashlib.sha256(Path(c['normalized_path']).read_bytes()).hexdigest(),'native_path':c['native_path'],'crop':c['crop'],'translation_origin_xy':c['translation_origin_xy']} for c in rows],indent=2))
 pool=[('B100_hs_selected_embeddings.npz','B100_hs_selected_embeddings.json')]+[(f'B_uniform_cohort_{k:02}_embeddings.npz',f'B_uniform_cohort_{k:02}_embeddings.json') for k in range(11)]+[('B_uniform_existing17_embeddings.npz','B_uniform_existing17_embeddings.json')];cache={s:{} for s in SIZES}
 for nz,jz in pool:
  z=np.load(W/nz);ix={str(k):i for i,k in enumerate(z['ids'])};ee={s:z[f'e{s}'] for s in SIZES};mm=json.load(open(W/jz));assert not mm['errors']
  for r in mm['records']:
   for s in SIZES:d=r['details'][str(s)];cache[s][d['pixel_sha256']]=(d,ee[s][ix[r['id']]])
 D=W/'B_final_cells';D.mkdir(exist_ok=True);sheetroot=W/'B_final_sheets';mapping={(c['index'],c['variant']):c for c in rows};jobs={c['id']:{'id':c['id']} for c in rows};reused=0;total=0;receipts=[]
 for v in variants:
  for size in SIZES:
   dest=sheetroot/str(size)/(v+'.webp');dest.parent.mkdir(parents=True,exist_ok=True)
   if v=='hs_home':shutil.copyfile(W/f'B100_hs_selected/hs_home_{size}.webp',dest)
   else:
    canvas=Image.new('RGB',((size+16)*10,(size+16)*10),(128,128,128))
    for c in people:
     p=mapping[(c['index'],v)];i=c['index']%100;im=Image.open(p['normalized_path']).convert('RGB');assert min(im.size)>=384;canvas.paste(im.resize((size,size),Image.Resampling.LANCZOS),(i%10*(size+16)+8,i//10*(size+16)+8))
    encode(canvas,dest,size)
   atlas=Image.open(dest).convert('RGB');receipts.append({'variant':v,'size':size,'path':str(dest),'sha256':hashlib.sha256(dest.read_bytes()).hexdigest()})
   for c in people:
    p=mapping[(c['index'],v)];i=c['index']%100;x=i%10*(size+16)+8;y=i//10*(size+16)+8;photo=atlas.crop((x,y,x+size,y+size));sha=hashlib.sha256(np.asarray(photo).tobytes()).hexdigest();total+=1
    if sha in cache[size]:d,ft=cache[size][sha];jobs[p['id']][str(size)]={'cached':True,'details':dict(d),'feature':ft.tolist(),'pixel_sha256':sha};reused+=1
    else:pp=D/f'{p["id"]}_{size}.png';photo.save(pp,compress_level=1);jobs[p['id']][str(size)]={'cached':False,'path':str(pp),'pixel_sha256':sha}
  print('FINAL_B_ENCODED',v,'exact_RGB_reused',reused,'/',total,flush=True)
 (W/'B_final_sheet_receipts.json').write_text(json.dumps(receipts,indent=2));(W/'B_final_measure_jobs.json').write_text(json.dumps(list(jobs.values())));ids=[];records=[];errors=[];vectors={s:[] for s in SIZES}
 def save(stem):
  np.savez_compressed(W/(stem+'.npz'),ids=ids,**{f'e{s}':np.array(v) for s,v in vectors.items()});(W/(stem+'.json')).write_text(json.dumps({'records':records,'errors':errors,'exact_RGB_reused':reused,'total_cells':total},indent=2))
 with concurrent.futures.ProcessPoolExecutor(max_workers=2,mp_context=multiprocessing.get_context('spawn'),initializer=measure.initialize) as pool:
  for n,(row,e) in enumerate(pool.map(work,jobs.values()),1):
   if e is None:errors.append(row)
   else:
    records.append(row);ids.append(row['id'])
    for s in SIZES:vectors[s].append(e[s])
   if n%50==0:print('FINAL_B_MEASURED',n,'/1200',flush=True)
   if n%100==0:save('B_final_checkpoint')
 save('B_final_embeddings');print('FINAL_B_DONE',len(ids),'errors',errors,flush=True)
if __name__=='__main__':main()
