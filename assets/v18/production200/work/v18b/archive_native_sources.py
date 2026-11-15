"""Keep lossless native sources and verify every delivered whole-photo crop."""
from pathlib import Path
import json,hashlib
from PIL import Image
from functools import lru_cache
P=Path(__file__).resolve().parent;OUT=P.parents[1];ROOT=P.parents[4]
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def pixels(im):return hashlib.sha256(im.tobytes()).hexdigest()
@lru_cache(maxsize=6)
def archived_image(path):return Image.open(path).convert('RGB')
def main():
 f=OUT/'validation/v18b_native_provenance.json';v=json.loads(f.read_text());d=OUT/'sources/v18b_native';d.mkdir(parents=True,exist_ok=True);archive={}
 for photo in v['photos']:
  raw=photo.get('original_generation_path',photo['source_render']);digest=photo.get('original_generation_sha256',photo['source_render_sha256'])
  if photo.get('generation_origin'):
   origin=photo['generation_origin'];assert sha(origin['source_render'])==origin['source_render_sha256'];parent=Image.open(origin['source_render']).convert('RGB');assert pixels(parent.crop(origin['crop_xyxy']))==pixels(Image.open(raw).convert('RGB'))
  if raw not in archive:
   assert sha(raw)==digest;im=Image.open(raw).convert('RGB');dst=d/(digest[:24]+'.webp')
   if not dst.exists():im.save(dst,'WEBP',lossless=True,quality=100,method=3)
   saved=Image.open(dst);assert saved.mode=='RGB' and saved.size==im.size and saved.tobytes()==im.tobytes()
   archive[raw]={'path':str(dst.relative_to(ROOT)),'sha256':sha(dst),'bytes':dst.stat().st_size,'dimensions':list(im.size),'mode':'RGB','lossless':True,'native_pixels_sha256':pixels(im),'original_generation_sha256':digest}
   print('Archived native render',len(archive),flush=True)
  entry=archive[raw];native=archived_image(str(ROOT/entry['path'])).crop(photo['crop_xyxy']);assert native.width==native.height==photo['native_square_size']>=384 and pixels(native)==photo['native_pixels_sha256']
  photo.update(original_generation_path=raw,original_generation_sha256=digest,source_render=entry['path'],source_render_sha256=entry['sha256'],archived_native_crop_verified=True)
 assert v['count']==len(v['photos'])==2000 and all(x['archived_native_crop_verified'] for x in v['photos'])
 for photo in v['photos']:
  if photo.get('generation_origin'):
   origin=photo['generation_origin'];parent=archive[origin['source_render']];origin.update(archived_source_render=parent['path'],archived_source_sha256=parent['sha256'],whole_photo_crop_verified=True)
 index={'passed':True,'render_count':len(archive),'whole_photo_crop_count':2000,'archive_bytes':sum(x['bytes'] for x in archive.values()),'sources':list(archive.values()),'protocol':'Lossless RGB encoding of original generated native images; every integer whole-photo crop matches its recorded native pixel SHA256 exactly; no resampling'}
 (OUT/'validation/v18b_native_source_archive.json').write_text(json.dumps(index,indent=2));v.update(native_source_archive='validation/v18b_native_source_archive.json',archived_native_crop_verification_passed=True);f.write_text(json.dumps(v,indent=2));print('Verified archived native sources for all2000 portraits',flush=True)
if __name__=='__main__':main()
