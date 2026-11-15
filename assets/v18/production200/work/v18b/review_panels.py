"""Create contact sheets and record explicit visual reviews, bound to native hashes."""
from pathlib import Path
import sys,json,hashlib
from PIL import Image,ImageDraw
from photo_frame import extract,PROTOCOL
P=Path(__file__).resolve().parent
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def make(label):
 d=P/'render_qc'/label;d.mkdir(parents=True,exist_ok=True);review=P/'reviews';review.mkdir(exist_ok=True)
 rows=[]
 for f in sorted((P/'measurements').glob('*.json')):
  x=json.loads(f.read_text())
  if x.get('photos') and not (review/(x['key']+'.json')).exists():rows.append(x)
 panels=[]
 for b in range(0,len(rows),4):
  group=rows[b:b+4];canvas=Image.new('RGB',(1280,1320),'white');draw=ImageDraw.Draw(canvas)
  for i,x in enumerate(group):
   side=x.get('source_grid_side',2 if x['kind']=='gray' else 3);im=Image.new('RGB',(640,640),'black');tile_size=640//side
   for photo in x['photos']:
    cell=photo['source_cell']
    if x.get('whole_native_photo'):tile=Image.open(x['render']['path']).convert('RGB')
    else:tile,_=extract(x['render']['path'],side,cell)
    tile=tile.resize((tile_size,tile_size),Image.Resampling.LANCZOS);rr,cc=divmod(cell,side);im.paste(tile,(cc*tile_size,rr*tile_size))
   r,c=divmod(i,2);canvas.paste(im,(c*640,r*660));draw.text((c*640+8,r*660+642),x['key'],fill='black')
  name=f'panel{b//4:02}.jpg';canvas.save(d/name,quality=91);panels.append({'file':str(d/name),'keys':[x['key'] for x in group],'render_sha256':[sha(x['render']['path']) for x in group]})
 (d/'index.json').write_text(json.dumps(panels,indent=2));print('Review panels',len(panels),'for',len(rows),'renders',flush=True)
def approve(label,numbers):
 panels=json.loads((P/'render_qc'/label/'index.json').read_text());d=P/'reviews';d.mkdir(exist_ok=True)
 excluded=set(json.loads((P/'visual_exclusions.json').read_text()).get('excluded_render_keys',[])) if (P/'visual_exclusions.json').exists() else set()
 for n in numbers:
  panel=panels[n]
  for key,digest in zip(panel['keys'],panel['render_sha256']):
   if key in excluded:print('Excluded from delivery:',key);continue
   x=json.loads((P/'measurements'/f'{key}.json').read_text());assert sha(x['render']['path'])==digest
   record={'key':key,'passed':True,'review_method':'Explicit visual review of whole-photo frames cropped on actual contact-sheet boundaries','frame_protocol':PROTOCOL,'frame_extractor_sha256':sha(P/'photo_frame.py'),'panel':panel['file'],'render_sha256':digest,'checks':{'identity_and_apparent_age':True,'natural_human_proportions':True,'deep_cap_fit_eyes_visible':True,'correct_home_uniform':True,'coherent_head_neck_shoulders':True,'ears_glasses_facial_hair':True,'neutral_gray_background':True,'no_extra_figures_or_anatomical_defects':True}}
   (d/f'{key}.json').write_text(json.dumps(record,indent=2));print('Visually approved',key)
if __name__=='__main__':
 if sys.argv[1]=='make':make(sys.argv[2])
 else:approve(sys.argv[2],[int(x) for x in sys.argv[3:]])
