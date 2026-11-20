# v21b A100 revision3 및 B 수정 중간본

브랜치: `assets/v21-review`. 경로: `assets/v21/amateur200/`. main에는 병합하지 않습니다.

A062·A047·A038·A083·A061·A069·A093의 12변형을 교체했습니다. A061은 12종 모두 모자 크라운과 위 여백을 추가 보완했습니다. A100의 ID·index·나이·level은 모두 그대로입니다. 번호·나이 잠금 SHA256: `a3fbff50ddc24bdb8ab5bb0943c629011a2c3d4de5ebdef51d6f71f9179ee437`.

현재 공식 납품은 A100명×12종×3크기, 시트36장입니다. `sheets_ready=["A"]`, `stage_a_complete=true`, `asset_validation_passed=true`, `production_complete=false`, `human_age_review="pending"`입니다. B100 정식 시트는 아직 없습니다.

## 게임 입력

`manifest.json`의 schema는 `v21-amateur-1`입니다. 각 identity의 `variants[variant_key].sheets["384"|"256"|"128"]`에 있는 path·rect를 그대로 사용합니다. 사진384 시트는4000×4000(q89),256은2720×2720(q88),128은1440×1440(q85), 모두 RGB 손실 WebP입니다. 사진 주위8px, pitch=size+16, localIndex=index%100, rect=[(localIndex%10)*pitch+8, floor(localIndex/10)*pitch+8,size,size]입니다. 고해상도 카드에는384 시트를 사용합니다.

변형 순서: hs_home, univ, seoul_comets, seoul_hounds, incheon_seagulls, suwon_sparks, goyang_storm, daejeon_redfox, gwangju_blazes, daegu_thunders, busan_waves, changwon_anchors. hs_away는 런타임에서 제외했습니다. 게임 코드는 수정하지 않았습니다.

## A 검수

| 크기 | 같은 인물 최저 | A 대표끼리 최고 | 기존486명과 최고 |
|---|---:|---:|---:|
| 128 | 0.606188 | 0.398291 | 0.379783 |
| 256 | 0.633675 | 0.392670 | 0.392386 |
| 384 | 0.649565 | 0.395337 | 0.384882 |

12변형의 모든66쌍이0.60 이상이고, hs_home 대표끼리 및 기존486명과0.40 미만입니다. 최종 시트에서 잘라낸3600개 RGB 칸이 측정본과 같은 SHA256인지 확인했습니다. ArcFace 원시 float32 코사인, buffalo_l, 기존5점 정렬을 유지했고 기준이나 임베딩을 변환하지 않았습니다.384 후보는 기존256 갤러리와 비교합니다.

얼굴 중심은5점 평균, v18 기준 [130.98235626,118.22048492]에서 최대 1.318556px(256 기준, 허용±4px)입니다. 원본 사진의 보존된 최소 변은384px 이상, 사진 확대·얼굴 변형·얼굴/몸 합성은 없습니다. 기존 A93의 사진 원본을 보존하며 외부 회색 캔버스를 재구성했습니다. A041 수원 사진은 실제 중심 잔차로 계산한1 native px 전체 사진 위치 보정을 했습니다. 상세 원본·좌표·처리 기록은 validation/stage_a/photo_provenance.json 및 validation/revision3/에 있습니다. 이전 A1 자료는 validation/history/stage_a_before_revision3/에 보존했습니다.

A 전체 나이 검토판: previews/age_review_A_256.png. 전체: previews/all100_hs_home_256.png. 무작위10명: previews/random10_variants_A_256.png. 교체7명: previews/revision3_A7_all12.jpg.

## B 수정 현황

17명×12종=204장의 개별 사진 검수본입니다. 공식 B100, B 시트36장 또는 게임 ID 배정을 뜻하지 않습니다. 후보판을 게임 런타임 B로 연결하지 마세요.

Q001·Q024·Q033은 크기 보정, Q054·Q055는 무지 아마추어 유니폼, Q083은 검은 머리로 수정했으며 이6명의 전체12종은 개별 사진 검사를 통과했습니다. Q071·Q042·Q047·Q064·Q074·Q067·Q075는 최종 선정에서 제외합니다. 첫8명 중 candidate8의 hs_home 배경은 다른 변형과 가까운 중립 회색(모서리 RGB102)으로 맞췄습니다. Q 번호는82c94805의 리뷰 번호를 그대로 사용합니다.

변경표: revision3_review.json. 수정 비교: previews/revision3_B_requested_changes.jpg. 전체17명: previews/revision3_B17_all12.jpg. 후보 번호표: stage_b_candidate_manifest.json. 12종 사진 경로: stage_b_family_review_manifest.json. 수치 자료: validation/revision3/B_family_raw_embeddings.npz 및 B_family_measurements.json.

B100 선정, 고교60·대학40 구성 및 최종 시트36장의 실제 픽셀 검사가 남아 있습니다. B IDs와 나이는 공식 납품 때 고정합니다. 나이 확인은 구단주 검토 전이므로 pending입니다.


## B100 master checkpoint (revision3)

B100 provisional canonical masters are now available at `review/revision3/B100_masters/hs_home_{128,256,384}.webp`; review image: `previews/revision3_B100_provisional_masters.jpg`. These are screening/master atlases, not final game runtime. Actual decoded atlas representatives pass raw ArcFace separation <0.40 against each other, final A100 and legacy486. B runtime remains incomplete:83 identities still need11 wardrobe variants each. A7 correction and A100 runtime remain complete. Human age review pending.
