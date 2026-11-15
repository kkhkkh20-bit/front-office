from pathlib import Path
import json,hashlib,sys
from PIL import Image
P=Path(__file__).resolve().parent;ROOT=P.parents[3];D=P/'wardrobe_lowcaps';A=D/'anchors';A.mkdir(exist_ok=True)
for arg in sys.argv[1:]:
 b=int(arg);f=D/f'render_seoul_comets_batch{b:02d}_validation.json';v=json.loads(f.read_text());assert v['passed'],v['metrics'];assert len(v['photos'])==20
 canvas=Image.new('RGB',(1024,1280))
 for i,x in enumerate(v['photos']):canvas.paste(Image.open(ROOT/x['path']),(i%4*256,i//4*256))
 out=A/f'batch{b:02d}.png';canvas.save(out);canvas.thumbnail((800,1000));canvas.save(A/f'batch{b:02d}.jpg',quality=90)
 print('Prepared anchor',b,{s:v['metrics'][s]['source_own_min'] for s in ['128','256']},flush=True)
