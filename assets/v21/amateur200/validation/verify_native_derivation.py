"""Verify every candidate export is directly reduced from its exact native crop."""
from pathlib import Path
import json,hashlib,io
from PIL import Image,features
ROOT=Path(__file__).resolve().parent.parent
def main():
 manifest=json.loads((ROOT/'review_manifest.json').read_text());cache={};count=0;edges=[]
 for candidate in manifest['candidates']:
  native=candidate['native'];path=ROOT/native['path']
  if str(path) not in cache:cache[str(path)]=Image.open(path).convert('RGB')
  crop=cache[str(path)].crop(native['crop_xyxy']);assert crop.width==crop.height and crop.width>=384;edges.append(crop.width)
  for size,quality in [(128,85),(256,88),(384,89)]:
   buffer=io.BytesIO();crop.resize((size,size),Image.Resampling.LANCZOS).save(buffer,'WEBP',quality=quality,method=6)
   assert hashlib.sha256(buffer.getvalue()).hexdigest()==candidate['photos'][str(size)]['sha256'],candidate['candidate_id'];count+=1
 result={'scope':'Candidate individual WebPs, not final runtime atlases','checked_exports':count,'native_original_png_count':len(cache),'minimum_native_crop_edge':min(edges),'maximum_native_crop_edge':max(edges),'all_direct_native_crop_derivations_byte_identical':True,'upsampled_from_128':False,'geometric_transform':'whole-photo square crop, isotropic LANCZOS reduction only','webp_version':features.version('webp'),'qualities':{'128':85,'256':88,'384':89}}
 (ROOT/'validation/native_derivation_verification.json').write_text(json.dumps(result,indent=2)+'\n');print(result)
if __name__=='__main__':main()
