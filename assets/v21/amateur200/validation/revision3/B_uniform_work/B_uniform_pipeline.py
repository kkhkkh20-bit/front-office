import os
os.environ['OPENBLAS_NUM_THREADS']='1';os.environ['OMP_NUM_THREADS']='1'
from pathlib import Path
from PIL import Image
import json,subprocess,sys,re,hashlib,numpy as np,time
from reconstruct_A_native import encode
W=Path('/dev/shm/v21b-work');R=W/'repo/assets/v21/amateur200';SIZES=[128,256,384];people=json.load(open(W/'B100_stage3_selected_people.json'));cohorts=json.load(open(W/'B_kits_cohorts.json'));spec=json.load(open(W/'r3_kit_specs.json'));variants=[v for v in spec if v!='hs_home'];registry=W/'B_current_variant_sources.json'
def sources():
 if registry.exists():return json.load(open(registry))
 rows=[];families=json.load(open(R/'stage_b_family_review_manifest.json'))['photos']
 for c in people:
  rows.append({**c,'id':c['source_person_id']+'__hs_home','variant':'hs_home'})
  if c['existing_family_person_id']:
   for p in families:
    if p['person_id']==c['existing_family_person_id'] and p['variant']!='hs_home':
     rows.append({**c,'id':c['source_person_id']+'__'+p['variant'],'variant':p['variant'],'native_path':str(R/p['native']['path']),'crop':p['crop'],'native_edge':p['native_edge'],'translation_origin_xy':p['translation_origin_xy'],'normalized_path':str(R/p['normalized_native_path'])})
 registry.write_text(json.dumps(rows,indent=2));return rows
def run(k):
 stem=f'B_uniform_cohort_{k:02}' if k>=0 else 'B_uniform_existing17';done=W/(stem+'_validation.json')
 if done.exists():return
 rows=sources()
 if k>=0:
  results=[json.loads(l) for l in open(W/'B_kits_generation_results.jsonl') if l.strip()];rs={r['variant']:r for r in results if r['cohort']==k}
  if not all(v in rs for v in variants):raise RuntimeError('not ready '+str(k))
  cs=[]
  for v in variants:
   r=rs[v];native=re.search(r'/workspace/generated_images/[^\s]+\.png',r['output_hint']).group();im=Image.open(native);cw=im.width//2;ch=im.height//4;assert min(cw,ch)-6>=384
   for j,c in enumerate(cohorts[k]['people']):
    x=j%2*cw+3;y=j//2*ch+3;edge=min(cw,ch)-6;q={**c,'id':c['source_person_id']+'__'+v,'variant':v,'native_path':native,'crop':[x,y,x+edge,y+edge],'source':'same_identity_uniform_only_image_edit','cohort':k};cs.append(q)
  (W/(stem+'_candidates.json')).write_text(json.dumps(cs,indent=2));s=(W/'normalize_family_b_000.py').read_text().replace('family_b_000',stem);p=W/('normalize_'+stem+'.py');p.write_text(s);subprocess.run([sys.executable,str(p)],check=True)
  normalized=json.load(open(W/(stem+'_normalization.json')));assert not any('error' in c for c in normalized)
  target=[c for c in normalized if c['index'] is not None]
  ids={c['id'] for c in target};rows=[c for c in rows if c['id'] not in ids]+target;registry.write_text(json.dumps(rows,indent=2))
 else:target=[c for c in rows if c['variant']!='hs_home' and c['existing_family_person_id']]
 target_ids={c['id'] for c in target};jobs={c['id']:{'id':c['id']} for c in target};D=W/(stem+'_encoded');D.mkdir(exist_ok=True);receipts=[];mapping={(c['index'],c['variant']):c for c in rows};actual=[]
 for v in variants:
  vv=[c for c in target if c['variant']==v]
  if not vv:continue
  for size in SIZES:
   canvas=Image.new('RGB',((size+16)*10,(size+16)*10),(128,128,128))
   for c in people:
    im=mapping.get((c['index'],v),c);local=c['index']%100;canvas.paste(Image.open(im['normalized_path']).convert('RGB').resize((size,size),Image.Resampling.LANCZOS),(local%10*(size+16)+8,local//10*(size+16)+8))
   path=D/f'{v}_{size}.webp';encode(canvas,path,size);atlas=Image.open(path).convert('RGB');receipts.append({'variant':v,'size':size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
   for c in vv:
    i=c['index']%100;x=i%10*(size+16)+8;y=i//10*(size+16)+8;tile=atlas.crop((x,y,x+size,y+size));p=D/f'{c["id"]}_{size}.png';tile.save(p,compress_level=1);jobs[c['id']][str(size)]=str(p)
   print(stem,'encoded',v,size,flush=True)
 (W/(stem+'_sheet_receipts.json')).write_text(json.dumps(receipts,indent=2));(W/(stem+'_jobs.json')).write_text(json.dumps(list(jobs.values()),indent=2));out=W/(stem+'_embeddings');subprocess.run([sys.executable,str(W/'measure.py'),str(W/(stem+'_jobs.json')),str(out)],check=True)
 z=np.load(str(out)+'.npz');zi={str(k):i for i,k in enumerate(z['ids'])};e={s:z[f'e{s}'] for s in SIZES};hs=np.load(W/'B100_hs_selected_embeddings.npz');hi={str(k):i for i,k in enumerate(hs['ids'])};h={s:hs[f'e{s}'] for s in SIZES};pids=sorted({c['source_person_id'] for c in target});fail=[];minimum={str(s):1. for s in SIZES}
 for pid in pids:
  for size in SIZES:
   vs=[h[size][hi[pid+'__hs_home']]]+[e[size][zi[pid+'__'+v]] for v in variants];m=np.stack(vs)@np.stack(vs).T;tr=np.triu_indices(12,1);minimum[str(size)]=min(minimum[str(size)],float(m[tr].min()))
   for a,b in zip(*np.where(np.triu(m<.6,1))):fail.append({'person_id':pid,'size':size,'variants':[['hs_home']+variants][0][a]+' / '+[['hs_home']+variants][0][b],'similarity':float(m[a,b])})
 mm=json.load(open(str(out)+'.json'));assert not mm['errors'];center=max(float(abs(np.mean(r['details'][str(size)]['landmarks'],axis=0)*256/size-np.array([130.98235626,118.22048492])).max()) for r in mm['records'] for size in SIZES);report={'cohort':k,'photo_count':len(target),'identity_count':len(pids),'same_person_min':minimum,'same_person_failures':fail,'center_deviation_max':center,'passed':not fail and center<=4,'scope':'actual WebP carrier atlas prototype; final all-B runtime atlas recheck still required'};done.write_text(json.dumps(report,indent=2));print('COHORT_COMPLETE',json.dumps(report),flush=True)
 # Only decoded/encoded carrier caches are removed. Original generation outputs, normalized native photos, receipts and measurements remain.
 for p in D.iterdir():
  if p.suffix in ['.webp','.png']:p.unlink()
 D.rmdir()
def main():
 sources();queue=[0,-1]+list(range(1,11))
 for k in queue:
  if k>=0:
   while True:
    try:rs=[json.loads(l) for l in open(W/'B_kits_generation_results.jsonl') if l.strip()];ready={r['variant'] for r in rs if r['cohort']==k};ok=all(v in ready for v in variants)
    except FileNotFoundError:ok=False
    if ok:break
    print('WAITING_GENERATION',k,flush=True);time.sleep(10)
  run(k)
 print('ALL_COHORTS_MEASURED',flush=True)
if __name__=='__main__':main()
