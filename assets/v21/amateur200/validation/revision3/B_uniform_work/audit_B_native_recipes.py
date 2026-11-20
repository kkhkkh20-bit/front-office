import os
os.environ['OPENBLAS_NUM_THREADS']='1'
from pathlib import Path
from PIL import Image
import numpy as np,cv2,json,functools
W=Path('/dev/shm/v21b-work')
@functools.lru_cache(maxsize=4)
def native(p):return Image.open(p).convert('RGB')
rows=json.load(open(W/'B_current_variant_sources.json'));bad=[];edge=99999
for c in rows:
 tile=native(c['native_path']).crop(c['crop']);n=min(tile.size);edge=min(n,edge);a=np.asarray(tile.crop((0,0,n,n)));x,y=c['translation_origin_xy'];v=cv2.copyMakeBorder(a,n,n,n,n,cv2.BORDER_REPLICATE)[n+y:2*n+y,n+x:2*n+x];dest=np.asarray(Image.open(c['normalized_path']).convert('RGB'))
 if v.shape!=dest.shape or not np.array_equal(v,dest):bad.append({'id':c['id'],'shape':list(v.shape),'expected_shape':list(dest.shape),'max_error':int(abs(v.astype(int)-dest.astype(int)).max()) if v.shape==dest.shape else None})
r={'checked_photos':len(rows),'minimum_native_edge':edge,'native_whole_photo_crop_translation_rgb_exact':not bad,'upsampled':False,'face_warp':False,'failures':bad};(W/'B_native_recipe_audit.json').write_text(json.dumps(r,indent=2));print(json.dumps(r,indent=2),flush=True)
