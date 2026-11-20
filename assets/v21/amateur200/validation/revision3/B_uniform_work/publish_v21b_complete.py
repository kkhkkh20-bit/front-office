import os
os.environ['OPENBLAS_NUM_THREADS']='1'
from pathlib import Path
from PIL import Image,ImageDraw
import json,hashlib,shutil,numpy as np
W=Path('/dev/shm/v21b-work');R=W/'repo/assets/v21/amateur200';V=R/'validation/stage_b';V.mkdir(exist_ok=True);history=R/'validation/history/stage_a_before_B_completion';history.mkdir(exist_ok=True)
def digest(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
report=json.load(open(W/'final200_validation.json'));assert report['asset_validation_passed'];audit=json.load(open(W/'B_native_recipe_audit.json'));assert audit['checked_photos']==1200 and audit['native_whole_photo_crop_translation_rgb_exact'];manifest=json.load(open(R/'manifest.json'));ap=manifest['identities'][:100];lock=json.load(open(R/'validation/stage_a/identity_age_lock.json'));assert [{k:p[k] for k in ['id','sheet','index','age','level']} for p in ap]==lock['identities'];people=json.load(open(W/'B100_stage3_selected_people.json'));variants=manifest['variant_keys'];rows=json.load(open(W/'B_current_variant_sources.json'));assert len(rows)==1200
snapshot={c['id']:c for c in json.load(open(W/'B_final_source_snapshot.json'))};assert all(digest(c['normalized_path'])==snapshot[c['id']]['normalized_native_sha256'] for c in rows)
for name in ['manifest.json','validation.json','CLAUDE_HANDOFF.md']:
 dest=history/name
 if not dest.exists():shutil.copyfile(R/name,dest)
# A atlases are fixed at the reviewed revision3 bytes.
for r in json.load(open(R/'validation/stage_a/sheet_encoding_receipts.json')):
 assert digest(R/r['path'])==r['sha256']
receipts=[]
for c in json.load(open(W/'B_final_sheet_receipts.json')):
 dst=R/f'sheets/B/{c["size"]}/{c["variant"]}.webp';dst.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(c['path'],dst);assert digest(dst)==c['sha256'];im=Image.open(dst);assert im.size==((c['size']+16)*10,)*2 and im.mode=='RGB';raw=dst.read_bytes();assert b'VP8 ' in raw[:100] and b'VP8L' not in raw[:32] and b'ALPH' not in raw[:100];receipts.append({**c,'path':str(dst.relative_to(R)),'quality':{128:85,256:88,384:89}[c['size']],'method':0,'segments':1,'sns_strength':0,'filter_strength':0,'sharp_yuv':True,'bytes':dst.stat().st_size})
(V/'sheet_encoding_receipts.json').write_text(json.dumps(receipts,indent=2));shutil.copyfile(W/'B_final_embeddings.npz',V/'raw_embeddings.npz');shutil.copyfile(W/'B_final_embeddings.json',V/'photo_measurements.json');shutil.copyfile(W/'B_native_recipe_audit.json',V/'native_derivation_verification.json')
# Keep source image-generation PNGs byte-for-byte. Copy; never move or edit originals.
N=R/'native/revision3/B_uniforms';N.mkdir(exist_ok=True,parents=True);existing={digest(p):p for p in (R/'native').rglob('*') if p.is_file()};natives={}
def archive(p):
 p=Path(p);sha=digest(p)
 if sha not in existing:
  dst=N/p.name
  if dst.exists():assert digest(dst)==sha
  else:shutil.copyfile(p,dst)
  existing[sha]=dst
 dst=existing[sha];rel=str(dst.relative_to(R));natives[rel]={'path':rel,'sha256':sha,'bytes':dst.stat().st_size};return rel
prov=[]
for c in rows:
 native=archive(c['native_path']);q={'photo_id':c['id'],'person_id':c['source_person_id'],'game_id':c['game_id'],'index':c['index'],'variant':c['variant'],'native':{'path':native,'sha256':digest(R/native)},'crop':c['crop'],'native_edge':c['native_edge'],'translation_origin_xy':c['translation_origin_xy'],'normalization':'Whole-native-photo square crop and integer translation; BORDER_REPLICATE on external canvas only. No face warp or upsampling.','normalized_native_sha256':digest(c['normalized_path'])}
 if c.get('generation_native_path'):q.update(generation_native_path=archive(c['generation_native_path']),generation_native_crop=c['generation_native_crop'],lossless_frame_chain=c['lossless_frame_chain'])
 p=Path(c['normalized_path'])
 if p.is_relative_to(R):q['normalized_native_path']=str(p.relative_to(R))
 prov.append(q)
(V/'photo_provenance.json').write_text(json.dumps(prov,indent=2));(V/'native_files.json').write_text(json.dumps(list(natives.values()),indent=2));(V/'numeric_validation.json').write_text(json.dumps(report,indent=2));centers={r['id']:{s:np.mean(r['details'][s]['landmarks'],axis=0).tolist() for s in ['128','256','384']} for r in json.load(open(V/'photo_measurements.json'))['records']};(V/'face_centers.json').write_text(json.dumps(centers,indent=2))
# Validate exact decoded runtime RGB against the data actually measured.
mm={r['id']:r for r in json.load(open(V/'photo_measurements.json'))['records']};mapping={(c['index'],c['variant']):c for c in rows};verified=0
for variant in variants:
 for size in [128,256,384]:
  atlas=Image.open(R/f'sheets/B/{size}/{variant}.webp').convert('RGB')
  for c in people:
   i=c['index']%100;x=i%10*(size+16)+8;y=i//10*(size+16)+8;p=mapping[c['index'],variant];tile=atlas.crop((x,y,x+size,y+size));assert hashlib.sha256(np.asarray(tile).tobytes()).hexdigest()==mm[p['id']]['details'][str(size)]['pixel_sha256'];verified+=1
(V/'runtime_pixel_equivalence.json').write_text(json.dumps({'actual_B_runtime_cells_verified':verified,'passed':verified==3600,'A_atlas_bytes_unchanged_from_revision3':True,'A_prior_verified_cells':3600,'raw_vectors_reused_only_on_exact_decoded_full_photo_RGB_SHA256_equality':True},indent=2))
bi=[]
for c in people:
 p={'id':c['game_id'],'review_id':c['review_id'],'sheet':'B','index':c['index'],'age':c['age'],'level':c['level'],'tags':{'glasses':c['glasses']},'source_person_id':c['source_person_id'],'human_age_review':'pending','variants':{}}
 for v in variants:
  p['variants'][v]={'sheets':{}}
  for size in [384,256,128]:i=c['index']%100;p['variants'][v]['sheets'][str(size)]={'path':f'assets/v21/amateur200/sheets/B/{size}/{v}.webp','rect':[i%10*(size+16)+8,i//10*(size+16)+8,size,size]}
 bi.append(p)
manifest.update(revision='v21b-complete-3',identities=ap+bi,identity_count=200,photo_count=2400,sheets_ready=['A','B'],stage_a_complete=True,stage_b_complete=True,production_complete=True,asset_validation_passed=True,human_age_review='pending');full_lock=[{k:p[k] for k in ['id','sheet','index','age','level']} for p in manifest['identities']];sha=hashlib.sha256(json.dumps(full_lock,sort_keys=True,separators=(',',':')).encode()).hexdigest();manifest['full_identity_age_lock_sha256']=sha;manifest['stage_a_identity_age_lock_sha256']=manifest['identity_age_lock_sha256'];(R/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2));(V/'identity_age_lock.json').write_text(json.dumps({'sha256':sha,'identities':full_lock},indent=2));report['glasses_percentage']=report['glasses_count']/2;report['age_direction']='성인 직전 골격에 앳된 인상, 정상 비율, 약한 미소';(R/'validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
# Previews use decoded final runtime photos.
def tile(c,v,size=256):
 atlas=atlases[c['sheet'],v];i=c['index']%100;stride=272;x=i%10*stride+8;y=i//10*stride+8;return atlas.crop((x,y,x+256,y+256))
atlases={(sheet,v):Image.open(R/f'sheets/{sheet}/256/{v}.webp').convert('RGB') for sheet in ['A','B'] for v in variants};P=R/'previews';preview=Image.new('RGB',(2600,2820),'white');draw=ImageDraw.Draw(preview);plain=Image.new('RGB',(2560,2560))
for i,c in enumerate(bi):im=tile(c,'hs_home');preview.paste(im,(i%10*260,i//10*282));draw.text((i%10*260+4,i//10*282+260),f'{c["review_id"]} / {c["age"]} / {c["level"]}',fill='black');plain.paste(im,(i%10*256,i//10*256))
preview.save(P/'age_review_B_256.png');plain.save(P/'all100_B_hs_home_256.png');both=Image.new('RGB',(5120,2560));
for i,c in enumerate(ap+bi):both.paste(tile(c,'hs_home'),(i%20*256,i//20*256))
both.save(P/'all200_hs_home_256.png');pick=[0,7,10,18,24,36,53,74,87,97];random=Image.new('RGB',(3120,2850),'white');d=ImageDraw.Draw(random)
for j,v in enumerate(variants):d.text((j*260+2,3),v[:18],fill='black')
for r,i in enumerate(pick):
 for j,v in enumerate(variants):im=tile(bi[i],v);random.paste(im,(j*260,30+r*282));d.text((j*260+2,30+r*282+259),bi[i]['review_id']+'/'+str(bi[i]['age']),fill='black')
random.save(P/'random10_variants_B_256.png')
checkpoint=json.load(open(V/'checkpoint.json'));checkpoint.update(scope='Final B100 runtime complete; all200 representatives and all12-variant pairs pass at three resolutions',stage_b_complete=True,runtime_identity_count=100,runtime_sheet_count=36,production_complete=True,remaining_new_wardrobe_photos=0,final_numeric_validation_path='validation.json',human_age_review='pending');(V/'checkpoint.json').write_text(json.dumps(checkpoint,indent=2))
(R/'CLAUDE_HANDOFF.md').write_text('''# v21b complete: A100 + B100 (revision3)\n\nDelivery branch: `assets/v21-review`. Assets only; no main merge or game-code changes.\n\n## Runtime\n\n`manifest.json`: schema `v21-amateur-1`, 200 identities, 2400 photos, `sheets_ready:["A","B"]`, `production_complete:true`, `asset_validation_passed:true`, `human_age_review:"pending"`.\n\n72 RGB lossy WebP sheets: `assets/v21/amateur200/sheets/{A|B}/{128|256|384}/{variant}.webp`. Variants in fixed manifest order: hs_home, univ, seoul_comets, seoul_hounds, incheon_seagulls, suwon_sparks, goyang_storm, daejeon_redfox, gwangju_blazes, daegu_thunders, busan_waves, changwon_anchors. No hs_away runtime.\n\nLocal cell index = global index %100; col=local%10, row=floor(local/10). `rect=[col*(size+16)+8,row*(size+16)+8,size,size]`; eight-pixel padding around every tile. Use manifest paths/rects directly.\n\nA IDs, indices, ages and levels remain exactly as first A delivery. A062, A047, A038, A083, A061, A069 and A093 have their corrected revision3 photos in all12 variants; all other A runtime bytes remain at the validated revision3 state. B001–B100 are now first delivered as official runtime identities (global indices100–199); full identity-age lock is in `validation/stage_b/identity_age_lock.json`.\n\n## B review feedback\n\nQ071, Q042, Q047, Q064, Q074, Q067 and Q075 were excluded, including same-seed aliases. Q054/Q055 now have plain high-school jerseys. Q083 has dark hair. Q001/Q024/Q033 use the reviewed larger natural head framing near the A median. Candidate8 (B008) has hs_home gray-background brightness matched to the remaining family. Full B master selection, original trials and repair provenance remain under review/revision3 and validation/revision3.\n\n## Validation and review\n\nEach100 has60 high-school and40 university identities; A11/B12 wear glasses (23/200, about10%). Actual final decoded128/256/384 photos were measured with the fixed raw ArcFace protocol. Every same-person pair among12 variants is >=0.60; all200 hs_home representatives are <0.40 against each other and legacy486. Full results and nearest pairs are in `validation.json`; raw vectors, exact decoded RGB SHA256, face centers, original native provenance and encoding receipts are under `validation/stage_a` and `validation/stage_b`. All final7200 decoded photo cells have corresponding raw measurement proof.\n\nThe original native images remain unchanged. Delivered photos use square crops, integer whole-photo positioning and reduction only; native edges are >=384. No face warps or upsampling.\n\nHuman age review remains pending. Review `previews/age_review_A_256.png` and `previews/age_review_B_256.png`; the owner can identify age-appearance replacements by stable A/B label. `previews/all200_hs_home_256.png`, random10 comparisons and all-family B comparison books are also included. Historical screening/partial statuses under validation/history and review are not current runtime status.\n\nSource code, index.html and build tools were not changed. Game integration belongs to Claude.\n''')
# JSON checksum inventory and standard sha256 list, neither self-references.
checks={str(p.relative_to(R)):digest(p) for p in sorted(R.rglob('*')) if p.is_file() and p.name not in ['checksums.json','checksums.sha256']};(R/'checksums.json').write_text(json.dumps(checks,indent=2));(R/'checksums.sha256').write_text(''.join(h+'  '+p+'\n' for p,h in checks.items()));print('COMPLETE_PUBLISHED',len(checks),'files; B cells',verified,'same_min',report['same_identity_minimum'],'different_max',report['different_representatives_maximum'],'legacy_max',report['existing_representatives_maximum'],flush=True)
