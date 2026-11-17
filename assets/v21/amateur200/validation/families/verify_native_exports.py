"""Verify whole-photo exports against lossless native sources without editing them."""
from pathlib import Path
import hashlib,io,json,os
from PIL import Image
R=Path(__file__).resolve().parents[2]
photos=json.loads((R/'family_review_manifest.json').read_text())['photos']
native_cache={};verified=0;minimum=None
for p in photos:
    path=R/p['native_path'] if p.get('native_path') else Path(os.environ.get('V21_NATIVE_ORIGINALS_DIR','/workspace/generated_images'))/p['native_original_filename']
    assert path.exists(),f"Original required: {path}. Set V21_NATIVE_ORIGINALS_DIR to the preserved generation originals directory."
    if path not in native_cache:
        digest=hashlib.sha256(path.read_bytes()).hexdigest()
        native_cache[path]=(digest,Image.open(path).convert('RGB'))
    digest,im=native_cache[path]
    assert digest==p['native_sha256'],p['photo_id']
    x0,y0,x1,y1=p['crop_xyxy'];side=x1-x0
    assert side==y1-y0 and side>=384 and 0<=x0<x1<=im.width and 0<=y0<y1<=im.height,(p['photo_id'],p['crop_xyxy'])
    minimum=min(minimum,side) if minimum is not None else side
    crop=im.crop((x0,y0,x1,y1))
    for size,quality in [(128,85),(256,88),(384,89)]:
        encoded=io.BytesIO();crop.resize((size,size),Image.Resampling.LANCZOS).save(encoded,format='WEBP',quality=quality,method=6)
        actual=(R/p['photos'][str(size)]['path']).read_bytes()
        assert encoded.getvalue()==actual,(p['photo_id'],size,'export differs from direct native reduction')
        verified+=1
print(json.dumps({'scope':'individual review exports, separate from atlas re-encoding','photos':len(photos),'verified_exports':verified,'native_files':len(native_cache),'minimum_native_crop_edge':minimum,'upscaled_from_128':False,'all_exports_match_direct_native_reductions':True}))
