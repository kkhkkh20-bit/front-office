"""Verify checkpoint pixel hashes and recompute raw-cosine gates from saved features.

This checks saved measurements, not a fresh ArcFace model inference. Model and
alignment details are fixed in ../protocol.json. Human age approval is separate.
"""
import os
os.environ['OPENBLAS_NUM_THREADS']='1'
from pathlib import Path
import json,hashlib
import numpy as np
from PIL import Image
R=Path(__file__).resolve().parents[2];V=R/'validation/families'
manifest=json.loads((R/'family_review_manifest.json').read_text())
photos={p['photo_id']:p for p in manifest['photos']}
layout=json.loads((R/'review/partial_atlases/layout.json').read_text())
rects={(p['photo_id'],p['size']):p for p in layout['photos']}
with np.load(R/'validation/reference_embeddings.npz') as z:refs={s:z[f'e{s}'] for s in [128,256]}
for prefix in ['production','atlas']:
    meta=json.loads((V/(prefix+'_photo_measurements.json')).read_text())
    assert not meta['errors'],meta['errors']
    records={p['id']:p for p in meta['records']}
    with np.load(V/(prefix+'_embeddings.npz')) as z:ids=z['ids'].tolist();es={s:z[f'e{s}'] for s in [128,256,384]}
    assert set(ids)==set(records)
    families=np.array([p.split('__')[0] for p in ids]);same=families[:,None]==families[None,:];upper=np.triu(np.ones(same.shape,dtype=bool),1)
    failures=0;summary={}
    for size,e in es.items():
        for pid in ids:
            if prefix=='production':im=Image.open(R/photos[pid]['photos'][str(size)]['path']).convert('RGB')
            else:
                p=rects[pid,size];x,y,w,h=p['rect'];im=Image.open(R/p['atlas']).convert('RGB').crop((x,y,x+w,y+h))
            assert im.size==(size,size)
            assert hashlib.sha256(im.tobytes()).hexdigest()==records[pid]['details'][str(size)]['pixel_sha256'],(prefix,pid,size)
        matrix=e@e.T;old=e@refs[min(size,256)].T
        a=matrix[same&upper];b=matrix[(~same)&upper]
        failures+=int((a<.60).sum()+(b>=.40).sum()+(old>=.40).sum())
        summary[str(size)]={'same_min':float(a.min()),'different_max':float(b.max()),'old_max':float(old.max())}
    expected=json.loads((V/(prefix+'_audit.json')).read_text())
    assert failures==expected['failure_count'],(prefix,failures,expected['failure_count'])
    print(json.dumps({'scope':prefix,'photos':len(ids),'failures':failures,'metrics':summary}))
print('Pixel hashes and frozen-feature audits match; whole delivery and human age review remain incomplete.')
