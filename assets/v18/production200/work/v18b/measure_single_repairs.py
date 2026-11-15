"""Measure complete individual replacement photographs against the unchanged criteria."""
import os
os.environ['OMP_NUM_THREADS']='1';os.environ['OPENBLAS_NUM_THREADS']='1'
from pathlib import Path
import json,hashlib
import numpy as np
from PIL import Image
from photo_frame import extract,PROTOCOL
import measure as rec
P=Path(__file__).resolve().parent;OUT=P.parents[1]
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def main():
 src=np.load(OUT/'identity_prescreen/embeddings.npz');old=np.load(P/'baseline/delivered_embeddings.npz');ids=list(src['ids']);teams=list(old['teams']);rec.initialize()
 for f in sorted((P/'single_repairs').glob('*.json')):
  job=json.loads(f.read_text());rid,team=job['id'],job['team'];kind=job.get('kind','gray');key=kind+'_'+f.stem+'_single';k=ids.index(rid);t=teams.index(team)
  cached=P/'measurements'/f'{key}.json'
  if cached.exists():
   previous=json.loads(cached.read_text())
   if previous.get('frame_protocol')==PROTOCOL and previous.get('photos') and previous['photos'][0]['source_render_sha256']==sha(job['path']):continue
  if job.get('whole_native_photo'):
   native=Image.open(job['path']).convert('RGB');assert native.width==native.height and native.width>=384;frame={'native_dimensions':list(native.size),'crop_xyxy':[0,0,native.width,native.height]}
  else:native,frame=extract(job['path'],1,0)
  folder=P/'native_candidates'/key;folder.mkdir(parents=True,exist_ok=True);dst=folder/(rid+'.png');native.save(dst)
  record,e=rec.measure({'id':rid,'team':team,'path':str(dst.resolve())});assert e is not None,record
  metrics={};passed=True
  for s in [128,256,384]:
   ss=min(s,256);same=old[f'e{ss}'][:,k]@e[s];gallery=old[f'e{ss}'][t]@e[s];canonical=src[f'e{ss}']@e[s];others=canonical.copy();others[k]=-2;legacy=src[f'ref{ss}']@e[s]
   ok=bool(same.min()>=.6 and gallery.argmax()==k)
   if kind=='gray':ok&=bool(canonical.argmax()==k and others.max()<.4 and legacy.max()<.4)
   if kind=='gray' or s==384:passed&=ok
   metrics[str(s)]={'passed':ok,'same_original_all10_min':float(same.min()),'same_original_all10_max':float(same.max()),'old_gallery_top1':str(ids[gallery.argmax()]),'source_own_top1':str(ids[canonical.argmax()]),'other199_max':float(others.max()),'other199_id':str(ids[others.argmax()]),'legacy160_max':float(legacy.max())}
  photo={'id':rid,'team':team,'path':str(dst.resolve()),'native_sha256':sha(dst),'source_render':job['path'],'source_render_sha256':sha(job['path']),'source_grid_side':1,'source_cell':0,'native_crop_xyxy':frame['crop_xyxy'],'metrics':metrics,'numerical_passed':bool(passed),'visual_review_passed':False}
  photo.update(whole_native_photo=bool(job.get('whole_native_photo')),generation_origin=job.get('generation_origin'))
  result={'key':key,'kind':kind,'team':team,'render':job,'source_grid_side':1,'whole_native_photo':bool(job.get('whole_native_photo')),'native_dimensions':frame['native_dimensions'],'passed':bool(passed),'errors':[],'photos':[photo],'detection_records':[record],'frame_protocol':PROTOCOL}
  np.savez_compressed(P/'measurements'/f'{key}.npz',ids=np.array([rid]),teams=np.array([team]),**{f'e{s}':e[s][None,:] for s in [128,256,384]});(P/'measurements'/f'{key}.json').write_text(json.dumps(result,indent=2));print(key,'passed',passed,'max',max(max(v['other199_max'],v['legacy160_max']) for v in metrics.values()),flush=True)
if __name__=='__main__':main()
