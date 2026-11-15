"""Extract whole-photo frames along actual generated contact-sheet row boundaries.

Only integer crops are used here. No face warping, retouching, or compositing.
The source retains at least384 native pixels on both axes before any resize.
"""
from pathlib import Path
from functools import lru_cache
import numpy as np
from PIL import Image
PROTOCOL='whole-photo adaptive horizontal grid boundaries within12px; integer square crop centered(.5,.25), native edge guard up to8px; no native upscaling'
@lru_cache(maxsize=6)
def _load(path,side):
 im=Image.open(path).convert('RGB');assert abs(im.width-im.height)<=2
 a=np.asarray(im,dtype=np.int16);columns=[round(c*im.width/side) for c in range(side+1)];rows=[]
 for c in range(side):
  x0,x1=columns[c:c+2];cell=min(im.width,im.height)//side;tol=min(12,max(0,(cell-384)//2))
  strength=np.abs(np.diff(a[:,x0:x1,:],axis=0)).mean(axis=(1,2));bounds=[0]
  for r in range(1,side):
   expected=round(r*im.height/side)
   if tol:
    start=max(1,expected-tol);stop=min(im.height-1,expected+tol)
    edge=int(np.argmax(strength[start-1:stop]))+start
   else:edge=expected
   bounds.append(edge)
  bounds.append(im.height);rows.append(bounds)
 return im,columns,rows
def extract(path,side,cell):
 im,columns,rows=_load(str(Path(path)),side);r,c=divmod(cell,side);box=[columns[c],rows[c][r],columns[c+1],rows[c][r+1]]
 w,h=box[2]-box[0],box[3]-box[1];n=min(w,h);assert n>=384,(path,cell,box)
 left=round((w-n)*.5);top=round((h-n)*.25)
 crop=[box[0]+left,box[1]+top,box[0]+left+n,box[1]+top+n]
 guard=min(8,(n-384)//2)
 crop=[crop[0]+guard,crop[1]+guard,crop[2]-guard,crop[3]-guard];n-=2*guard
 photo=im.crop(crop);assert photo.size==(n,n) and n>=384
 return photo,{'native_dimensions':list(im.size),'crop_xyxy':crop,'native_square_size':n,'native_edge_guard':guard,'protocol':PROTOCOL}
