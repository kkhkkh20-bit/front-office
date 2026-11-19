# v21b 시트 A — Claude 연결 안내

리뷰 브랜치: `assets/v21-review`  
기준 경로: `assets/v21/amateur200/`

시트 A100명,12변형,3크기의 정식 시트36장을 납품합니다. 고교60명·대학40명, 안경11명입니다. 수치 검수는 통과했으며 사람의 나이 확인은 `pending`입니다. 시트 B100명은 다음 단계이므로 `production_complete`는 `false`입니다.

## 런타임 입력

`manifest.json`의 `schema_version`은 `v21-amateur-1`이고 `identities`에는 이번100명만 들어 있습니다. `sheets_ready`는 `["A"]`입니다. `id`, `age`, `sheet`, `index`를 저장 파일의 고정 배정에 사용하고 납품 뒤 번호나 설계 나이를 바꾸지 않습니다. 번호·나이 잠금 SHA256: `a3fbff50ddc24bdb8ab5bb0943c629011a2c3d4de5ebdef51d6f71f9179ee437`.

`variants[variant_key].sheets["384"|"256"|"128"]`의 `path`와 `rect`를 그대로 읽으세요. 크기별 시트는 `sheets/A/{size}/{variant_key}.webp`입니다. 각 시트는10×10칸, 사진 둘레8px입니다.

```js
const localIndex = identity.index % 100;
const pitch = size + 16;
const rect = [
  (localIndex % 10) * pitch + 8,
  Math.floor(localIndex / 10) * pitch + 8,
  size, size
];
```

384px 시트는4000×4000(q89),256px는2720×2720(q88),128px는1440×1440(q85)입니다. 모두 RGB 손실 WebP입니다. 고해상도 카드에는384px 시트를 사용합니다.

변형 순서: `hs_home`, `univ`, `seoul_comets`, `seoul_hounds`, `incheon_seagulls`, `suwon_sparks`, `goyang_storm`, `daejeon_redfox`, `gwangju_blazes`, `daegu_thunders`, `busan_waves`, `changwon_anchors`. 고교는 `hs_home`, 대학은 `univ`, 지명 후에는 구단 키를 사용합니다. `hs_away`는 런타임 변형에서 제외했습니다. 기존 후보·실험판 자료는 제작 기록이며 런타임 번호표는 이번 `manifest.json`입니다.

## 검수

| 크기 | 같은 인물 최저값 | 대표 사진끼리 최고값 | 기존486명과 최고값 |
|---|---:|---:|---:|
| 128 | 0.614290 | 0.398272 | 0.379359 |
| 256 | 0.640446 | 0.394158 | 0.392079 |
| 384 | 0.649693 | 0.396785 | 0.384992 |

같은 인물은12변형의 모든66쌍을 검사했습니다. 다른 인물은 `hs_home` 대표 사진끼리, 그리고 기존 v6c100·v1360·v18200·v7126명 총486명의 대표 사진과 비교했습니다.384 비교의 기존 갤러리는256px입니다. 같은 인물 기준은0.60 이상, 다른 인물은0.40 미만입니다.

최종 WebP에서 실제로 잘라낸3600개 RGB 셀을 확인했습니다. 측정본과 디코딩 RGB SHA256이 같은 경우에만 원시 벡터를 재사용하고, 달라진 셀은 최종 시트에서 다시 측정했습니다. ArcFace 모델·5점 정렬·L2 정규화·코사인 기준은 `validation/protocol.json`에 기록했습니다.

얼굴 중심은5점 랜드마크의 산술평균이며, v18 `seoul_comets`200명의 중앙값을 기준점으로 삼았습니다.256px 기준 좌표는 `[130.98235626,118.22048492]`, 최대 축 편차는1.327020px입니다(허용±4px). 원본 사진의 보존된 최소 변은384px 이상이며 작은 사진을 확대한 납품물은 없습니다. 원본 PNG와 잘라낸 위치·프레임 정보는 `native/`와 `validation/stage_a/photo_provenance.json`에 보관했습니다.

## 구단주 나이 확인

`previews/age_review_A_256.png`는 최종 WebP의 고교 사진100명을256px 그대로10×10으로 놓고, 사진 바깥에 `A017 · 18` 형식으로 번호와 설계 나이를 표시했습니다. 나이 들어 보이거나 지나치게 어려 보이는 번호를 받으면 그 인물의 사진을 교체하고 수치 검수를 다시 합니다. ID와 설계 나이는 유지합니다. 현재 사람의 나이 확인은0/100명, `human_age_review: "pending"`입니다.

추가 확인 자료: `previews/all100_hs_home_256.png`, `previews/random10_variants_A_256.png`(고정 난수로 고른10명의12변형).

## 연결 범위

이 브랜치는 에셋 납품용입니다. Claude가 `FACE21` 번호표 모듈과 기존 `amVar` 연결에 이번100명을 사용하면 됩니다. B가 추가되기 전에는 `FACE21.ids`100명으로 연결합니다. 시트 B가 준비되면 기존 A의 ID와 나이를 유지하며100명을 더합니다.
