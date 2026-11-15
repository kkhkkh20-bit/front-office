"""Re-measure missing gray photos using the same real frame extraction as packing."""
import os
os.environ['OMP_NUM_THREADS']='1';os.environ['OPENBLAS_NUM_THREADS']='1'
from pathlib import Path
import json,hashlib,copy
import numpy as np
from photo_frame import extract,PROTOCOL
import measure as rec
P=Path(__file__).resolve().parent;OUT=P.parents[1]
TARGETS={'v18_165','v18_169','v18_170','v18_174'}
def main():
 progress=json.loads((P/'numerical_photo_progress.json').read_text());missing=[x for x in progress['missing'] if x['id'] in TARGETS];source=np.load(OUT/'identity_prescreen/embeddings.npz');old=np.load(P/'baseline/delivered_embeddings.npz');ids=list(source['ids']);teams=list(old['teams']);batches=[json.loads(f.read_text()) for f in (P/'measurements').glob('gray*.json')];rec.initialize()
 for target in missing:
  rid,team=target['id'],target['team'];candidates=[]
  for batch in batches:
   for photo in batch.get('photos',[]):
    if photo['id']==rid and photo['team']==team:
     maximum=max(max(y['other199_max'],y['legacy160_max']) for y in photo['metrics'].values());candidates.append((maximum,batch,photo))
  if not candidates:continue
  _,batch,original=min(candidates,key=lambda x:x[0]);native,frame=extract(original['source_render'],2,original['source_cell']);folder=P/'clean_frame_probes';folder.mkdir(exist_ok=True);dst=folder/f'{team}_{rid}.png';native.save(dst)
  record,features=rec.measure({'id':rid,'team':team,'path':str(dst.resolve())})
  if features is None:print('Probe detection failed',rid,team,record,flush=True);continue
  index=ids.index(rid);t=teams.index(team);metrics={};passed=True
  for s in [128,256,384]:
   ss=min(s,256);e=features[s];same=old[f'e{ss}'][:,index]@e;gallery=old[f'e{ss}'][t]@e;canonical=e@source[f'e{ss}'].T;others=canonical.copy();others[index]=-2;legacy=e@source[f'ref{ss}'].T
   ok=bool(same.min()>=.6 and gallery.argmax()==index and canonical.argmax()==index and others.max()<.4 and legacy.max()<.4);passed&=ok
   metrics[str(s)]={'passed':ok,'same_original_all10_min':float(same.min()),'same_original_all10_max':float(same.max()),'old_gallery_top1':str(ids[gallery.argmax()]),'source_own_top1':str(ids[canonical.argmax()]),'other199_max':float(others.max()),'other199_id':str(ids[others.argmax()]),'legacy160_max':float(legacy.max())}
  key=f'gray_{team}_clean_{rid}';photo={**original,'path':str(dst.resolve()),'native_sha256':hashlib.sha256(dst.read_bytes()).hexdigest(),'native_crop_xyxy':frame['crop_xyxy'],'metrics':metrics,'numerical_passed':bool(passed),'visual_review_passed':False,'frame_protocol':PROTOCOL}
  result={'key':key,'kind':'gray','team':team,'render':batch['render'],'native_dimensions':frame['native_dimensions'],'passed':bool(passed),'errors':[],'photos':[photo],'detection_records':[record],'frame_protocol':PROTOCOL}
  np.savez_compressed(P/'measurements'/f'{key}.npz',ids=np.array([rid]),teams=np.array([team]),**{f'e{s}':features[s][None,:] for s in [128,256,384]});(P/'measurements'/f'{key}.json').write_text(json.dumps(result,indent=2));print('Clean actual frame',rid,team,'passed',passed,'max',max(max(y['other199_max'],y['legacy160_max']) for y in metrics.values()),flush=True)
if __name__=='__main__':main()
