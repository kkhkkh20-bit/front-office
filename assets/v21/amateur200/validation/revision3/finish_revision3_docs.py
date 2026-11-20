from pathlib import Path
from PIL import Image,ImageDraw
import json,hashlib,shutil,numpy as np
W=Path('/dev/shm/v21b-work');R=W/'repo/assets/v21/amateur200';V=R/'validation/revision3';PRE=R/'previews';m=json.load(open(R/'manifest.json'));a=m['identities'];vs=m['variant_keys'];allhs=Image.open(R/'sheets/A/256/hs_home.webp').convert('RGB');plain=Image.new('RGB',(2560,2560),(128,128,128));age=Image.new('RGB',(2600,2820),'white');draw=ImageDraw.Draw(age)
for p in a:
 i=p['index'];x=i%10*272+8;y=i//10*272+8;im=allhs.crop((x,y,x+256,y+256));plain.paste(im,(i%10*256,i//10*256));xx=i%10*260;yy=i//10*282;age.paste(im,(xx,yy));draw.text((xx+4,yy+259),p['review_id']+' / '+str(p['age']),fill='black')
plain.save(PRE/'all100_hs_home_256.png');age.save(PRE/'age_review_A_256.png');ids=json.load(open(R/'validation/stage_a/preview_sample_ids.json'));canvas=Image.new('RGB',(12*260,10*282),'white');draw=ImageDraw.Draw(canvas)
for col,v in enumerate(vs):
 sheet=Image.open(R/f'sheets/A/256/{v}.webp').convert('RGB')
 for row,key in enumerate(ids):
  p=next(p for p in a if p['id']==key);i=p['index'];x=i%10*272+8;y=i//10*272+8;canvas.paste(sheet.crop((x,y,x+256,y+256)),(col*260,row*282));draw.text((col*260+2,row*282+259),p['review_id']+' '+v,fill='black')
canvas.save(PRE/'random10_variants_A_256.png')
# The baseline Q labels remain stable; corrected or held entries supersede their old pictures.
bm=json.load(open(R/'stage_b_family_review_manifest.json'));q=json.load(open(R/'stage_b_candidate_manifest.json'));rr=json.load(open(R/'revision3_review.json'));hs={p['person_id']:p for p in bm['photos'] if p['variant']=='hs_home'};ordered=[]
for i,p in enumerate(q['identities']):
 label=f'Q{i+1:03}';p['review_id']=label
 if p['id'] in hs:
  c=hs[p['id']]
  for f in ['photos','native','crop','native_edge','translation_origin_xy','normalized_native_path']:p[f]=c[f]
  p['status']='FULL12_CANDIDATE_INDIVIDUAL_EXPORTS_PASS_NOT_RUNTIME';p['source_revision']=3
 elif rr['B_changes'].get(label,{}).get('status')=='excluded_from_final_selection':p['status']='EXCLUDED_BY_REVISION3_REVIEW';p['source_revision']=3
 else:p['numeric_status']='legacy_trial_recheck_required_for_final_B100'
 ordered.append(p)
q.update(revision=3,production_complete=False,game_ids_assigned=False,review_dispositions=rr['B_changes'],current_change_manifest='revision3_review.json');(R/'stage_b_candidate_manifest.json').write_text(json.dumps(q,ensure_ascii=False,indent=2)+'\n');board=Image.new('RGB',(2600,10*282),'white');draw=ImageDraw.Draw(board)
for i,p in enumerate(ordered):
 xx=i%10*260;yy=i//10*282
 if p['status']=='EXCLUDED_BY_REVISION3_REVIEW':draw.rectangle((xx,yy,xx+255,yy+255),fill=(35,35,35));draw.text((xx+80,yy+120),'EXCLUDED',fill='white')
 else:board.paste(Image.open(R/p['photos']['256']['path']).convert('RGB'),(xx,yy))
 draw.text((xx+3,yy+259),p['review_id']+' / '+str(p['proposed_age']),fill='black')
board.save(PRE/'stage_b_face_candidates_256.png')
checkpoint=R/'validation/stage_b/checkpoint.json';c=json.load(open(checkpoint));c.update(revision=3,A7_ids_missing=False,A7_requested_ids=rr['A_corrected_ids'],A7_runtime_corrected=True,stage_b_runtime_sheet_count=0,stage_b_complete_candidate_families=17,stage_b_review_photo_count=204,production_complete=False,superseding_review='revision3_review.json');c['current_scope']='A7 corrected in full A100 runtime; B17 complete candidate families; B100 runtime remains incomplete';checkpoint.write_text(json.dumps(c,ensure_ascii=False,indent=2)+'\n')
# Explicitly separate the first experimental HS picks from the final atlas sources.
sources={}
for p in json.load(open(R/'validation/stage_a/photo_provenance.json')):
 if p['game_id'].split('_')[-1] in rr['A_corrected_ids']:sources[p['photo_id']]={k:p[k] for k in ['game_id','variant','native_path','native_sha256','native_cell_xyxy','whole_photo_frame']}
(V/'A7_final_sources.json').write_text(json.dumps(sources,ensure_ascii=False,indent=2)+'\n');p=V/'a7_actual_hs_selection.json';initial=json.load(open(p));initial['superseded_for_final_A_atlas_by']='validation/revision3/A7_final_sources.json';p.write_text(json.dumps(initial,ensure_ascii=False,indent=2)+'\n')
shutil.copyfile('/workspace/attachments/32d66335-39f7-404e-9876-d366bf7292df/2026-11-19-codex-v21b-amateur-faces-finish.md',R/'REQUEST_v21b.md')
val=json.load(open(R/'validation.json'));table='\n'.join(f'| {s} | {v["same_identity_all_pairs"]["minimum"]:.6f} | {v["different_representatives"]["maximum"]:.6f} | {v["existing_representatives"]["maximum"]:.6f} |' for s,v in val['resolutions'].items());text=f'''# v21b A100 revision3 및 B 수정 중간본

브랜치: `assets/v21-review`. 경로: `assets/v21/amateur200/`. main에는 병합하지 않습니다.

A062·A047·A038·A083·A061·A069·A093의 12변형을 교체했습니다. A061은 12종 모두 모자 크라운과 위 여백을 추가 보완했습니다. A100의 ID·index·나이·level은 모두 그대로입니다. 번호·나이 잠금 SHA256: `{val['identity_age_lock_sha256']}`.

현재 공식 납품은 A100명×12종×3크기, 시트36장입니다. `sheets_ready=["A"]`, `stage_a_complete=true`, `asset_validation_passed=true`, `production_complete=false`, `human_age_review="pending"`입니다. B100 정식 시트는 아직 없습니다.

## 게임 입력

`manifest.json`의 schema는 `v21-amateur-1`입니다. 각 identity의 `variants[variant_key].sheets["384"|"256"|"128"]`에 있는 path·rect를 그대로 사용합니다. 사진384 시트는4000×4000(q89),256은2720×2720(q88),128은1440×1440(q85), 모두 RGB 손실 WebP입니다. 사진 주위8px, pitch=size+16, localIndex=index%100, rect=[(localIndex%10)*pitch+8, floor(localIndex/10)*pitch+8,size,size]입니다. 고해상도 카드에는384 시트를 사용합니다.

변형 순서: hs_home, univ, seoul_comets, seoul_hounds, incheon_seagulls, suwon_sparks, goyang_storm, daejeon_redfox, gwangju_blazes, daegu_thunders, busan_waves, changwon_anchors. hs_away는 런타임에서 제외했습니다. 게임 코드는 수정하지 않았습니다.

## A 검수

| 크기 | 같은 인물 최저 | A 대표끼리 최고 | 기존486명과 최고 |
|---|---:|---:|---:|
{table}

12변형의 모든66쌍이0.60 이상이고, hs_home 대표끼리 및 기존486명과0.40 미만입니다. 최종 시트에서 잘라낸3600개 RGB 칸이 측정본과 같은 SHA256인지 확인했습니다. ArcFace 원시 float32 코사인, buffalo_l, 기존5점 정렬을 유지했고 기준이나 임베딩을 변환하지 않았습니다.384 후보는 기존256 갤러리와 비교합니다.

얼굴 중심은5점 평균, v18 기준 [130.98235626,118.22048492]에서 최대 {val['face_center']['maximum_deviation_256_px']:.6f}px(256 기준, 허용±4px)입니다. 원본 사진의 보존된 최소 변은384px 이상, 사진 확대·얼굴 변형·얼굴/몸 합성은 없습니다. 기존 A93의 사진 원본을 보존하며 외부 회색 캔버스를 재구성했습니다. A041 수원 사진은 실제 중심 잔차로 계산한1 native px 전체 사진 위치 보정을 했습니다. 상세 원본·좌표·처리 기록은 validation/stage_a/photo_provenance.json 및 validation/revision3/에 있습니다. 이전 A1 자료는 validation/history/stage_a_before_revision3/에 보존했습니다.

A 전체 나이 검토판: previews/age_review_A_256.png. 전체: previews/all100_hs_home_256.png. 무작위10명: previews/random10_variants_A_256.png. 교체7명: previews/revision3_A7_all12.jpg.

## B 수정 현황

17명×12종=204장의 개별 사진 검수본입니다. 공식 B100, B 시트36장 또는 게임 ID 배정을 뜻하지 않습니다. 후보판을 게임 런타임 B로 연결하지 마세요.

Q001·Q024·Q033은 크기 보정, Q054·Q055는 무지 아마추어 유니폼, Q083은 검은 머리로 수정했으며 이6명의 전체12종은 개별 사진 검사를 통과했습니다. Q071·Q042·Q047·Q064·Q074·Q067·Q075는 최종 선정에서 제외합니다. 첫8명 중 candidate8의 hs_home 배경은 다른 변형과 가까운 중립 회색(모서리 RGB102)으로 맞췄습니다. Q 번호는82c94805의 리뷰 번호를 그대로 사용합니다.

변경표: revision3_review.json. 수정 비교: previews/revision3_B_requested_changes.jpg. 전체17명: previews/revision3_B17_all12.jpg. 후보 번호표: stage_b_candidate_manifest.json. 12종 사진 경로: stage_b_family_review_manifest.json. 수치 자료: validation/revision3/B_family_raw_embeddings.npz 및 B_family_measurements.json.

B100 선정, 고교60·대학40 구성 및 최종 시트36장의 실제 픽셀 검사가 남아 있습니다. B IDs와 나이는 공식 납품 때 고정합니다. 나이 확인은 구단주 검토 전이므로 pending입니다.
''';(R/'CLAUDE_HANDOFF.md').write_text(text)
# Preserve the cap review tooling and final input receipts.
for name in ['publish_revision3_cap.py','finish_revision3_docs.py','A61final_validation.json','A061_cap_generation_registry.json','A061_cap_plan.json','A061_cap_normalization.json']:
 shutil.copyfile(W/name,V/name)
checks=[]
for p in sorted(R.rglob('*')):
 if p.is_file() and p.name!='checksums.sha256':checks.append(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+str(p.relative_to(R)))
(R/'checksums.sha256').write_text('\n'.join(checks)+'\n');print('Updated current A100 previews, stable Q review labels, handoff and',len(checks),'checksums',flush=True)
