"""Measure high-resolution whole photographs and background-only edits as they arrive."""
from pathlib import Path
import json,time,hashlib,concurrent.futures,multiprocessing,traceback
import numpy as np
from PIL import Image
from scipy.optimize import linear_sum_assignment
import measure as rec
P=Path(__file__).resolve().parent;OUT=P.parents[1];ROOT=P.parents[4]
TARGETS=['v18_165','v18_169','v18_170','v18_174'];SIZES=[128,256,384]
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def main():
 H={x['key']:x for x in json.loads((P/'hires_jobs.json').read_text())};old=np.load(OUT/'validation/delivered_embeddings.npz');source=np.load(OUT/'identity_prescreen/embeddings.npz');teams=list(old['teams']);sourceids=list(source['ids']);D=P/'measurements';D.mkdir(exist_ok=True);done={f.stem for f in D.glob('*.json')};summary=[]
 for f in D.glob('*.json'):summary.append(json.loads(f.read_text()))
 with concurrent.futures.ProcessPoolExecutor(max_workers=2,mp_context=multiprocessing.get_context('spawn'),initializer=rec.initialize) as pool:
  while True:
   files=[('gray',f) for f in sorted((P/'gray_renders').glob('*.json'))]+[('hires',f) for f in sorted((P/'hires_renders').glob('*.json'))]
   for kind,f in files:
    key=kind+'_'+f.stem
    if key in done:continue
    job=json.loads(f.read_text());team=job['team'];t=teams.index(team);expected=TARGETS if kind=='gray' else [x['id'] for x in H[job['key']]['items']];side=2 if kind=='gray' else 3
    try:
     im=Image.open(job['path']).convert('RGB');assert abs(im.width-im.height)<=2 and min(im.size)//side>=384,'Insufficient native resolution or non-square portrait grid'
     native=P/'native_candidates'/key;native.mkdir(parents=True,exist_ok=True);tasks=[]
     for i,rid in enumerate(expected):
      r,c=divmod(i,side);box=[round(c*im.width/side),round(r*im.height/side),round((c+1)*im.width/side),round((r+1)*im.height/side)];photo=im.crop(box);dst=native/f'cell{i:02}.png';photo.save(dst);tasks.append({'id':rid,'team':team,'path':str(dst.resolve()),'native_crop_xyxy':box})
     measured=list(pool.map(rec.measure,tasks));errors=[x[0] for x in measured if x[1] is None]
     if errors:result={'key':key,'kind':kind,'team':team,'passed':False,'errors':errors,'photos':[]}
     else:
      E={s:np.array([x[1][s] for x in measured]) for s in SIZES};indices=np.array([sourceids.index(rid) for rid in expected]);similar=E[384]@old['e256'][t,indices].T;ri,ci=linear_sum_assignment(-similar);order=ri[np.argsort(ci)];E={s:e[order] for s,e in E.items()};photos=[]
      for k,(rid,index,cell) in enumerate(zip(expected,indices,order)):
       row=measured[cell][0];metrics={};passed=True
       for s in SIZES:
        ss=min(s,256);e=E[s][k];old_same=old[f'e{ss}'][:,index]@e;gallery=old[f'e{ss}'][t]@e;new_source=e@source[f'e{ss}'].T;others=new_source.copy();others[index]=-2;legacy=e@source[f'ref{ss}'].T
        ok=bool(old_same.min()>=.6 and gallery.argmax()==index)
        if kind=='gray':ok&=bool(others.max()<.4 and legacy.max()<.4 and new_source.argmax()==index)
        metrics[str(s)]={'passed':ok,'same_original_all10_min':float(old_same.min()),'same_original_all10_max':float(old_same.max()),'old_gallery_top1':str(source['ids'][gallery.argmax()]),'source_own_top1':str(source['ids'][new_source.argmax()]),'other199_max':float(others.max()),'other199_id':str(source['ids'][others.argmax()]),'legacy160_max':float(legacy.max())}
        # Only384 is a new deliverable for196 unchanged identities. Gray revisions use all sizes.
        if kind=='gray' or s==384:passed&=ok
       photos.append({'id':rid,'team':team,'path':row['path'],'native_sha256':row['native_sha256'],'source_render':job['path'],'source_render_sha256':sha(job['path']),'source_cell':int(cell),'native_crop_xyxy':row['native_crop_xyxy'],'metrics':metrics,'numerical_passed':bool(passed),'visual_review_passed':False})
      np.savez_compressed(D/f'{key}.npz',ids=np.array(expected),teams=np.array([team]*len(expected)),**{f'e{s}':E[s] for s in SIZES})
      result={'key':key,'kind':kind,'team':team,'render':job,'native_dimensions':list(im.size),'passed':all(x['numerical_passed'] for x in photos),'errors':[],'photos':photos,'detection_records':[x[0] for x in measured]}
    except Exception as e:result={'key':key,'kind':kind,'team':team,'passed':False,'errors':[str(e)],'photos':[]}
    (D/f'{key}.json').write_text(json.dumps(result,indent=2));done.add(key);summary.append(result)
    stats={'measured_batches':len(summary),'hires_batches':sum(x['kind']=='hires' for x in summary),'gray_batches':sum(x['kind']=='gray' for x in summary),'hires_photos_measured':sum(len(x['photos']) for x in summary if x['kind']=='hires'),'hires_photos_passed':sum(y['numerical_passed'] for x in summary if x['kind']=='hires' for y in x['photos']),'gray_photos_passed_candidates':sum(y['numerical_passed'] for x in summary if x['kind']=='gray' for y in x['photos']),'failed_batches':[{'key':x['key'],'errors':x['errors'],'failed_ids':[y['id'] for y in x['photos'] if not y['numerical_passed']]} for x in summary if not x['passed']]}
    (P/'scoring_progress.json').write_text(json.dumps(stats,indent=2));print('measured',key,'passed',result['passed'],flush=True)
   if (P/'ALL_RENDERING_FINISHED').exists():break
   time.sleep(4)
 print('Render measurement worker finished',flush=True)
if __name__=='__main__':main()
