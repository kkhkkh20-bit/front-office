import os
os.environ['OPENBLAS_NUM_THREADS']='1'
from pathlib import Path
import json,numpy as np
from scipy.optimize import milp,Bounds,LinearConstraint
from PIL import Image,ImageDraw
W=Path('/dev/shm/v21b-work');R=W/'repo/assets/v21/amateur200'
z=np.load(W/'b_embeddings.npz');a=np.load(R/'validation/stage_a/raw_embeddings.npz');old=np.load(R/'validation/reference_embeddings.npz');ids=z['ids'].tolist();ai=[i for i,s in enumerate(a['ids']) if s.endswith('__hs_home')]
source={c['id']:c for c in json.load(open(W/'b_normalization.json'))};mxold=np.maximum.reduce([(z[f'e{s}']@old[f'e{min(s,256)}'].T).max(1) for s in [128,256,384]]);mxa=np.maximum.reduce([(z[f'e{s}']@a[f'e{s}'][ai].T).max(1) for s in [128,256,384]])
cross=np.maximum.reduce([z[f'e{s}']@z[f'e{s}'].T for s in [128,256,384]])
keep=[i for i,c in enumerate(ids) if mxold[i]<.4 and mxa[i]<.4];n=len(keep);rows=[];hi=[]
for ii,i in enumerate(keep):
 for jj in range(ii+1,n):
  j=keep[jj]
  if cross[i,j]>=.4:
   row=np.zeros(n);row[ii]=row[jj]=1;rows.append(row);hi.append(1)
res=milp(c=-np.ones(n),integrality=np.ones(n),bounds=Bounds(0,1),constraints=LinearConstraint(np.array(rows).reshape(-1,n),np.full(len(rows),-np.inf),hi),options={'time_limit':30})
selected=[keep[i] for i in range(n) if res.x is not None and res.x[i]>.5];out=[]
for i in keep:out.append({**source[ids[i]],'old_max':float(mxold[i]),'stage_a_max':float(mxa[i]),'selected_distinct_prescreen':i in selected,'visual_review':'pending','scope':'individual normalized candidate WebPs; final atlas validation pending'})
(W/'b_prescreen.json').write_text(json.dumps({'candidate_count':len(ids),'old_and_a_pass_count':n,'maximum_distinct_prescreen_count':len(selected),'records':out},indent=2))
for start in range(0,len(selected),30):
 chunk=selected[start:start+30];im=Image.new('RGB',(6*208,5*238),'white');d=ImageDraw.Draw(im)
 for k,i in enumerate(chunk):
  x=k%6*208;y=k//6*238;c=source[ids[i]];im.paste(Image.open(c['normalized_path']).resize((204,204)),(x,y));d.text((x,y+206),ids[i].removeprefix('b_native_'),fill='black');d.text((x,y+220),f'age {c["age"]} old {mxold[i]:.3f} A {mxa[i]:.3f}',fill='black')
 im.save(W/f'b_prescreen_{start//30:02}.jpg',quality=90)
print('Measured candidates',len(ids),'old + A pass',n,'distinct prescreen',len(selected),'errors',len(json.load(open(W/'b_embeddings.json'))['errors']))
