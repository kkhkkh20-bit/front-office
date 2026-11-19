"""Read-only independent delivery audit: python assets/v23/expansion_kits/validation/audit_delivery.py
Requires Pillow and numpy. Stored ArcFace features are bound to exact decoded final RGB cells;
this verifies raw scores/420-way ranks, geometry and all hashes without downloading models.
Full recognition model hashes/protocol and original measurement records accompany this file.
"""
from pathlib import Path
import json,hashlib,collections,numpy as np
from PIL import Image
R=Path(__file__).resolve().parents[1];repo=R.parents[2]
m=json.load(open(R/'manifest.json'));v=json.load(open(R/'validation.json'))
assert m['schema_version']=='v23-expansion-kits-1'
assert len(m['identities'])==420 and len({c['id'] for c in m['identities']})==420
assert collections.Counter(c['set'] for c in m['identities'])=={'v6c':100,'v13':60,'v18':200,'staff':60}
assert len(m['sets'])==4 and {s['key']:s['count'] for s in m['sets']}=={'v6c':100,'v13':60,'v18':200,'staff':60}
assert {t['key'] for t in m['teams']}=={'expansion_a','expansion_b'}
expected={f'sheets/{s}/{n}/{t}.webp' for s in ['v6c','v13','v18A','v18B','staff'] for n in [128,256] for t in ['expansion_a','expansion_b']}
assert set(m['runtime_files'])==expected and len(list((R/'sheets').rglob('*.webp')))==20
cache={};sums={s['path']:s for s in v['sheets']}
for p in sorted(expected):
 im=Image.open(R/p);n=int(p.split('/')[2]);assert im.mode=='RGB' and im.size==(10*(n+16),)*2
 assert hashlib.sha256((R/p).read_bytes()).hexdigest()==sums[p]['sha256']
 assert n!=256 or (R/p).stat().st_size<=600000
 cache[p]=im.copy()
 # Empty rows of the two60-person sheets must remain black after decoding.
 if '/v13/' in p or '/staff/' in p:assert np.asarray(im.crop((0,6*(n+16),im.width,im.height))).max()<=2
refs=json.load(open(R/'validation/reference_measurements.json'));rows=json.load(open(R/'validation/final_measurements.json'))
E=np.load(R/'validation/reference_measurements.npz')['embeddings'];F=np.load(R/'validation/final_measurements.npz')['embeddings']
assert len(refs)==840 and len(rows)==1680 and E.shape==(840,512) and F.shape==(1680,512)
assert np.isfinite(E).all() and np.isfinite(F).all()
assert np.allclose(np.linalg.norm(E,axis=1),1,atol=1e-5) and np.allclose(np.linalg.norm(F,axis=1),1,atol=1e-5)
ri={(r['id'],r['resolution']):i for i,r in enumerate(refs)};pools={n:[i for i,r in enumerate(refs) if r['resolution']==n] for n in [128,256]}
people={c['id']:c for c in m['identities']};report={(r['id'],r['team'],r['resolution']):r for r in v['identities']}
assert len(report)==1680
measured=set();scores=[];errors=[]
for k,r in enumerate(rows):
 n=r['resolution'];t=r['team'];c=people[r['id']];i=c['index'];s=c['variants'][t]['sheets'][str(n)];pitch=n+16
 assert s['rect']==[i%10*pitch+8,i//10*pitch+8,n,n]
 x,y,w,h=s['rect'];pixels=cache[s['path']].crop((x,y,x+w,y+h))
 assert hashlib.sha256(pixels.tobytes()).hexdigest()==r['pixel_sha256']
 j=ri[r['id'],n];ref=refs[j];assert r['face_count']==ref['face_count']==1
 score=float(F[k]@E[j]);sim=F[k]@E[pools[n]].T;nearest=refs[pools[n][int(np.argmax(sim))]]['id']
 assert score>=.60 and nearest==r['id'],(r['id'],t,n,score,nearest)
 deltas=[(np.array(r[field])-ref[field])*256/n for field in ['center_5pt','center_bbox']];error=float(max(np.abs(a).max() for a in deltas));assert error<=4,(r['id'],t,n,error)
 z=report[r['id'],t,n];assert z['passed'] and abs(z['same_identity_cosine']-score)<1e-6 and abs(z['max_center_error_px256']-error)<1e-6
 scores.append(score);errors.append(error);measured.add((r['id'],t,n))
assert len(measured)==1680
# Original source assets must still match the native RGB hashes recorded before editing.
source_cache={}
for c in m['identities']:
 for n,s in c['source_reference']['sheets'].items():
  p=s['path'];f=repo/p
  if p not in source_cache:source_cache[p]=Image.open(f).convert('RGB')
  x,y,w,h=s['rect'];assert hashlib.sha256(source_cache[p].crop((x,y,x+w,y+h)).tobytes()).hexdigest()==c['source_reference']['pixel_sha256'][n]
for t,b in m['badges'].items():
 im=Image.open(R/b['path']);assert im.mode=='RGBA' and im.size==(320,320)
 a=np.array(im.getchannel('A'));assert a.min()==0 and a.max()==255 and not a[0].any() and not a[-1].any() and not a[:,0].any() and not a[:,-1].any()
 assert hashlib.sha256((R/b['path']).read_bytes()).hexdigest()==b['sha256']
assert v['asset_validation_passed'] and m['asset_validation_passed'] and v['production_complete'] and m['production_complete']
assert m['review_status']=='pending_game_review' and not v['issues']
vis=json.load(open(R/'validation/visual_review.json'));assert vis['passed'] and len(vis['reviewed_identity_variants'])==840 and vis['runtime_sheets_sha256']=={p:sums[p]['sha256'] for p in sums}
for line in (R/'checksums.sha256').read_text().splitlines():
 h,p=line.split('  ',1);assert hashlib.sha256((R/p).read_bytes()).hexdigest()==h,p
print(f'PASS:420 original identities,840 variants,20 RGB atlases,1680 raw ArcFace/rank/geometry checks; min cosine={min(scores):.9f}; max center={max(errors):.9f}px256; originals unchanged;2 transparent320px badges; all checksums.')
