from measure_A_revision3 import work,W,R
import os,json,hashlib,concurrent.futures,multiprocessing
from pathlib import Path
import numpy as np
from PIL import Image
import measure
if __name__=='__main__':
 S=[128,256,384];cache={s:{} for s in S}
 for npz,js in [(R/'validation/stage_a/raw_embeddings.npz',R/'validation/stage_a/photo_measurements.json'),(W/'A_revision3_atlas_embeddings.npz',W/'A_revision3_atlas_measurements.json'),(W/'A_hs_revision3_embeddings.npz',W/'A_hs_revision3_embeddings.json')]:
  z=np.load(npz);idx={str(k):i for i,k in enumerate(z['ids'])};es={s:z[f'e{s}'] for s in S};records=json.load(open(js))['records']
  for p in records:
   for s in S:cache[s][p['details'][str(s)]['pixel_sha256']]=(p['details'][str(s)],es[s][idx[p['id']]])
 rows=json.load(open(W/'A_revision3_provenance.json'));jobs={p['photo_id']:{'id':p['photo_id']} for p in rows};folder=W/'A_restored_cells';folder.mkdir(exist_ok=True);reused=0;inputs=[]
 for v in dict.fromkeys(p['variant'] for p in rows):
  for s in S:
   path=W/f'A_revision3_restored_sheets/{s}/{v}.webp'
   if not path.exists():path=W/f'A_revision3_sheets/{s}/{v}.webp'
   inputs.append({'variant':v,'size':s,'path':str(path),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()});atlas=Image.open(path).convert('RGB')
   for p in [p for p in rows if p['variant']==v]:
    i=p['index'];x=i%10*(s+16)+8;y=i//10*(s+16)+8;photo=atlas.crop((x,y,x+s,y+s));digest=hashlib.sha256(np.asarray(photo).tobytes()).hexdigest()
    if digest in cache[s]:
     d,e=cache[s][digest];jobs[p['photo_id']][str(s)]={'cached':True,'details':dict(d),'feature':e.tolist(),'pixel_sha256':digest};reused+=1
    else:
     dest=folder/f'{p["photo_id"]}_{s}.png';photo.save(dest,compress_level=1);jobs[p['photo_id']][str(s)]={'cached':False,'path':str(dest),'pixel_sha256':digest}
 (W/'A_restored_sheet_inputs.json').write_text(json.dumps(inputs,indent=2));(W/'A_restored_measure_jobs.json').write_text(json.dumps(list(jobs.values()),indent=2));print('Actual decoded cell reuse',reused,'/3600',flush=True);records=[];ids=[];errors=[];es={s:[] for s in S}
 with concurrent.futures.ProcessPoolExecutor(max_workers=2,mp_context=multiprocessing.get_context('spawn'),initializer=measure.initialize) as pool:
  for k,(row,e) in enumerate(pool.map(work,jobs.values()),1):
   if e is None:errors.append(row)
   else:
    records.append(row);ids.append(row['id'])
    for s in S:es[s].append(e[s])
   if k%100==0:print('restored A actual atlas',k,'/1200',flush=True)
 np.savez_compressed(W/'A_restored_embeddings.npz',ids=np.array(ids),**{f'e{s}':np.array(v) for s,v in es.items()});(W/'A_restored_measurements.json').write_text(json.dumps({'records':records,'errors':errors,'RGB_verified_cache_cells':reused},indent=2));print('Done',len(ids),'errors',len(errors),flush=True)
