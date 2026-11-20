from pathlib import Path
from PIL import Image
import json,numpy as np,hashlib,shutil
W=Path('/dev/shm/v21b-work');R=W/'repo/assets/v21/amateur200';V=R/'validation/revision3';a=json.load(open(R/'manifest.json'))['identities'];am={p['id']:p for p in json.load(open(R/'validation/stage_a/photo_measurements.json'))['records']};bm={p['id']:p for p in json.load(open(V/'B_family_measurements.json'))['records']};B=json.load(open(R/'stage_b_family_review_manifest.json'))['photos']
def span(im,box):
 aa=np.asarray(im,dtype=float);x0,y0,x1,y1=box[:4];h=y1-y0;yy0=int(y0+.12*h);yy1=int(y0+.70*h);cx=(x0+x1)/2;w=x1-x0;left=max(0,int(cx-.9*w));right=min(256,int(cx+.9*w));r,g,b=aa[:,:,0],aa[:,:,1],aa[:,:,2];skin=(r>g+4)&(r>b+6)&(g>b-12)&(r>70);sp=[]
 for y in range(yy0,yy1):
  xs=np.flatnonzero(skin[y,left:right])
  if len(xs)>10:sp.append(xs[-1]-xs[0]+1)
 return float(np.median(sorted(sp)[-6:]))
im=Image.open(R/'sheets/A/256/hs_home.webp').convert('RGB');values=[]
for p in a:
 i=p['index'];x=i%10*272+8;y=i//10*272+8;values.append(span(im.crop((x,y,x+256,y+256)),am[p['source_person_id']+'__hs_home']['details']['256']['bbox']))
median=float(np.median(values));out={'status':'selected actual photo measurements, not a biometric size or an exact anatomy claim','method':'RGB skin-span proxy: R>G+4, R>B+6, G>B-12, R>70; median of six widest scanlines within12%-70% of detected face height, x within0.9 face widths from center','A_sample_count':100,'A_median_visible_head_width_256':median,'requested_candidates':[]}
for q in ['Q001','Q024','Q033']:
 p=next(p for p in B if p.get('review_id')==q and p['variant']=='hs_home');d=bm[p['id']]['details']['256']['bbox'];photo=Image.open(R/p['photos']['256']['path']).convert('RGB');s=span(photo,d);out['requested_candidates'].append({'review_id':q,'selected_person_id':p['person_id'],'photo_path':p['photos']['256']['path'],'selected_visible_head_width_256':s,'target_A_median_256':median,'relative_difference':s/median-1,'detected_face_width_256':d[2]-d[0]})
p=V/'head_scale_calibration.json';history=R/'validation/history/head_scale_calibration_initial_trial.json'
if not history.exists():shutil.copyfile(p,history)
p.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');shutil.copyfile(W/'measure_head_scale_selected.py',V/'measure_head_scale_selected.py');checks=[]
for p in sorted(R.rglob('*')):
 if p.is_file() and p.name!='checksums.sha256':checks.append(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+str(p.relative_to(R)))
(R/'checksums.sha256').write_text('\n'.join(checks)+'\n');print(json.dumps(out,indent=2),flush=True)
