from pathlib import Path
import json,hashlib,subprocess
from functools import lru_cache
import numpy as np
from PIL import Image
W=Path('/dev/shm/v21b-work');R=W/'repo/assets/v21/amateur200';CWEBP=W/'libwebp-1.6.0-linux-x86-64/bin/cwebp'
@lru_cache(maxsize=4)
def parent(path):return Image.open(R/path).convert('RGB')
def render(p,mode=0):
 f=p['whole_photo_frame'];n=f['normalized_native_edge'];ox,oy=f['whole_photo_crop_origin'];d=f['canvas_edge_inset'];x0,y0,x1,y1=p['native_cell_xyxy'];arr=np.array(parent(p['native_path']).crop((x0+d,y0+d,x1-d,y1-d)));h,w=arr.shape[:2];xx=np.clip(np.arange(n)+ox,0,w-1);yy=np.clip(np.arange(n)+oy,0,h-1);out=arr[yy[:,None],xx[None,:]].copy();g=f.get('added_top_canvas_background')
 if g:
  t=g['height_native_px'];left=np.array(g['left_rgb']);right=np.array(g['right_rgb']);bg=left[None,:]*(1-np.linspace(0,1,n)[:,None])+right[None,:]*np.linspace(0,1,n)[:,None];edge=out[t].astype(float)
  if mode==0:weights=np.arange(t)/max(1,t)
  elif mode==1:weights=np.arange(1,t+1)/max(1,t)
  elif mode==2:weights=np.linspace(0,1,t)
  elif mode==3:weights=np.zeros(t)
  elif mode>=12:
   u=np.linspace(0,1,t);weights={12:u*u,13:(np.arange(t)/max(1,t))**2,14:((np.arange(t)+1)/max(1,t+1))**2,15:u**3,16:u*u*(3-2*u),17:(1-np.cos(u*np.pi))/2}[mode]
  elif mode>=5:
   junction={5:12,6:8,7:6,8:4,9:3,10:2,11:1}[mode];junction=min(t,junction);weights=np.concatenate([np.zeros(t-junction),np.linspace(0,1,junction)])
  else:weights=np.arange(t)/max(1,t)
  vals=bg[None,:,:]*(1-weights[:,None,None])+edge[None,:,:]*weights[:,None,None]
  out[:t]=(np.rint(vals) if mode!=4 else vals).clip(0,255).astype('uint8')
 return Image.fromarray(out)
def encode(canvas,path,size):
 png=path.with_suffix('.png');canvas.save(png,compress_level=0);subprocess.run([str(CWEBP),'-quiet','-q',str({128:85,256:88,384:89}[size]),'-m','0','-segments','1','-sns','0','-f','0','-sharp_yuv',str(png),'-o',str(path)],check=True);png.unlink()
if __name__=='__main__':
 import sys
 variant=sys.argv[1] if len(sys.argv)>1 else 'univ';rows=[p for p in json.load(open(R/'validation/stage_a/photo_provenance.json')) if p['variant']==variant];old=Image.open(R/f'sheets/A/256/{variant}.webp').convert('RGB');report=[]
 for mode in range(5):
  sheet=Image.new('RGB',(2720,2720),(128,128,128))
  for p in rows:sheet.paste(render(p,mode).resize((256,256),Image.Resampling.LANCZOS),((p['index']%10)*272+8,(p['index']//10)*272+8))
  out=W/f'A_reconstruction_test_{variant}_{mode}.webp';encode(sheet,out,256);new=Image.open(out).convert('RGB');diff=np.abs(np.asarray(new,dtype=float)-np.asarray(old,dtype=float));equal=[]
  for p in rows:
   x=p['index']%10*272+8;y=p['index']//10*272+8;equal.append(np.array_equal(np.asarray(new.crop((x,y,x+256,y+256))),np.asarray(old.crop((x,y,x+256,y+256)))))
  row={'mode':mode,'identical_cells':sum(equal),'mae':float(diff.mean()),'max':float(diff.max())};print(row,flush=True);report.append(row)
 (W/'A_reconstruction_regression.json').write_text(json.dumps(report,indent=2))
