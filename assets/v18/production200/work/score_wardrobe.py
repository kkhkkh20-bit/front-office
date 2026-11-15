"""Measure whole generated portraits, never composite faces or bodies."""
import os
os.environ['OMP_NUM_THREADS']='1';os.environ['OPENBLAS_NUM_THREADS']='1'
from pathlib import Path
import json,time,concurrent.futures,multiprocessing
import numpy as np
from PIL import Image,ImageOps
from scipy.optimize import linear_sum_assignment
import canonical_rescreen as recognition
P=Path(__file__).resolve().parent;ROOT=P.parents[3];D=P/'wardrobe_lowcaps';APP=None

def init():
 recognition.D=D/'measurement';recognition.D.mkdir(parents=True,exist_ok=True);recognition.initialize()
def task(x):return recognition.measure(x)

def score_batch(job,pool):
 im=Image.open(ROOT/job['path']).convert('RGB');b=job['batch'];team=job['team'];d=D/'photos'/team;d.mkdir(parents=True,exist_ok=True);tasks=[]
 for i in range(20):
  r,c=divmod(i,4);rect=[round(c*im.width/4),round(r*im.height/5),round((c+1)*im.width/4),round((r+1)*im.height/5)];photo=ImageOps.fit(im.crop(rect),(256,256),Image.Resampling.LANCZOS,centering=(.5,.25));out=d/f'b{b:02d}_cell{i:02d}.png';photo.save(out);tasks.append({'key':f'{team}_b{b:02d}_cell{i:02d}','kind':'variant','path':str(out),'cell':i})
 measured=list(pool.map(task,tasks));errors=[x[0] for x in measured if x[1] is None]
 if errors:return {'job':job,'passed':False,'errors':errors}
 e128=np.array([x[1] for x in measured]);e256=np.array([x[2] for x in measured]);source=np.load(P.parent/'identity_prescreen/embeddings.npz');expected=np.arange(b*20,(b+1)*20);similar=(e128@source['e128'][expected].T+e256@source['e256'][expected].T)/2;ri,ci=linear_sum_assignment(-similar);order=ri[np.argsort(ci)];e128=e128[order];e256=e256[order];photos=[]
 for i,rowindex in enumerate(order):
  rid=f'v18_{b*20+i+1:03d}';out=d/(rid+'.png');Image.open(tasks[rowindex]['path']).save(out);photos.append({'id':rid,'team':team,'path':str(out.relative_to(ROOT)),'render_source':job['path'],'source_cell':int(rowindex),'visual_review_passed':False})
 scores={};passed=True
 for size,e in [(128,e128),(256,e256)]:
  matrix=e@source[f'e{size}'].T;own=matrix[np.arange(20),expected];top1=np.argmax(matrix,axis=1);ok=bool(np.all(top1==expected));passed&=ok;scores[str(size)]={'source_own_cosine':own.tolist(),'source_own_min':float(own.min()),'top1':top1.tolist(),'passed':ok}
 np.savez_compressed(D/f'{team}_batch{b:02d}_scores.npz',ids=source['ids'][expected],e128=e128,e256=e256)
 return {'job':job,'passed':passed,'metrics':scores,'photos':photos}

if __name__=='__main__':
 D.mkdir(exist_ok=True);outputs=[json.loads(f.read_text()) for f in sorted(D.glob('render_*_validation.json'))];done={Path(x['job']['path']).stem.replace('seoul_comets_batch','render_seoul_comets_batch')+'.json' for x in outputs}
 done={f.name.replace('_validation.json','.json') for f in D.glob('render_*_validation.json')}
 with concurrent.futures.ProcessPoolExecutor(max_workers=2,mp_context=multiprocessing.get_context('spawn'),initializer=init) as pool:
  while True:
   changed=False
   for f in sorted(D.glob('render_*.json')):
    if f.name in done or f.stem.endswith('_validation'):continue
    job=json.loads(f.read_text());result=score_batch(job,pool);done.add(f.name);outputs.append(result);(D/(f.stem+'_validation.json')).write_text(json.dumps(result,indent=2));changed=True;print('wardrobe',job['team'],job['batch'],'passed',result['passed'],flush=True)
   if changed:(D/'scoring_progress.json').write_text(json.dumps({'scored':len(outputs),'passed':sum(x['passed'] for x in outputs),'results':outputs},indent=2))
   if (D/'RENDERING_FINISHED').exists():break
   time.sleep(5)
