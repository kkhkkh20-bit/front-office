# 코덱스 요청서: v18 선수 얼굴 가운데 맞춤 (원본 그림 고침)

작성일: 2026-11-17 · 대상 에셋: `assets/v18/production200` (v18b, 시트 A·B × 128·256·384 × 10구단)

## 1. 무엇이 문제인가

선수 상세 큰 사진에서 일부 선수의 머리가 칸 왼쪽으로 쏠려 보인다는 제보가 있었습니다("중앙 안맞는놈들 있는데").
게임 쪽 자르기 계산(칸 간격 144·272·400, 칸 안 8px, manifest `rect`)은 맞았고, CSS도 정사각형 사진을 그대로 보여 줍니다. **원본 그림 자체에서 사람이 왼쪽으로 밀려 있습니다.**

- 2,000칸(200명 × 10구단) 중 머리 가로 중심이 칸 가운데에서 **8% 넘게** 벗어난 칸이 **248칸**(시트 A 194칸, 시트 B 54칸), 73명입니다. 12% 넘게는 146칸, 16% 넘게는 81칸입니다. 모두 **왼쪽**으로 쏠렸고 오른쪽으로 쏠린 칸은 없습니다.
- 4칸 묶음마다 뒤쪽 칸일수록 더 밀립니다(묶음 안 1번째 ≈ 0%, 2번째 ≈ −7%, 3번째 ≈ −14%, 4번째 ≈ −20%). 쏠린 248칸 중 225칸이 묶음 안 3·4번째 칸입니다.
  4장을 이어 붙여 만든 그림을 칸으로 자를 때 폭이 조금씩 어긋난 것으로 보입니다. 이런 칸은 오른쪽 끝에 **옆 사람 어깨가 몇 px 보이기도** 합니다.
- 384·256·128은 같은 그림을 줄인 것이라 쏠림이 같습니다(384와 128의 차이 평균 0.3%, 최대 1%). 384와 256은 세로로 약 4~5px(256 기준) 어긋난 칸이 많지만 가로는 0~1px입니다.
- v6c(`assets/v6/batch01c`)는 쏠림이 없습니다. v13(`assets/v13/face256`)은 44·48·51번 칸이 6~9% 왼쪽으로 쏠렸습니다(구단 대부분).

## 2. 지금 게임에서 한 임시 조치

`tools/gen-face-centers.py`가 칸마다 머리 중심을 재서 `src/ui/assets/00j2_face_centers_data.js`(칸 너비 천분율)를 만들고, 화면(`77_assets_ui.js` `fcWin`)이 자르는 창을 머리 쪽으로 옮깁니다.
칸 밖으로는 나갈 수 없어 큰 사진은 창을 줄여(최대 1.39배 확대) 맞춥니다. 그래서 아래 칸은 **얼굴이 다른 선수보다 크게 보이고**, 가장 심한 7칸은 여전히 10% 넘게 쏠립니다.
원본을 고치면 이 표를 다시 만들어(`python3 tools/gen-face-centers.py`) 빈 표가 되는지 확인하겠습니다.

## 3. 고쳐 주실 칸 (머리 중심이 칸 가운데에서 벗어난 정도, 칸 너비 %)

가장 급한 칸(임시 조치 뒤에도 10% 넘게 쏠림):
`v18_024`·`v18_028`·`v18_032`·`v18_036`·`v18_040`의 `incheon_seagulls`, `v18_004`의 `goyang_storm`, `v18_144`의 `suwon_sparks`.

전체 목록(8% 넘게 쏠린 칸):

| 신원 | 구단 (쏠림) |
|---|---|
| v18_002 | goyang_storm −13, busan_waves −11, daegu_thunders −9, daejeon_redfox −8 |
| v18_003 | goyang_storm −20, busan_waves −14, daegu_thunders −13, daejeon_redfox −12 |
| v18_004 | goyang_storm −23, busan_waves −19, daejeon_redfox −15, daegu_thunders −15 |
| v18_006 | goyang_storm −11 |
| v18_007 | goyang_storm −19, busan_waves −12, daegu_thunders −11, daejeon_redfox −10 |
| v18_008 | goyang_storm −20, busan_waves −13, daegu_thunders −12, daejeon_redfox −10 |
| v18_010 | goyang_storm −10 |
| v18_011 | goyang_storm −17, busan_waves −11, daegu_thunders −10, daejeon_redfox −9 |
| v18_012 | goyang_storm −18, busan_waves −14, daegu_thunders −11 |
| v18_014 | goyang_storm −10 |
| v18_015 | goyang_storm −16, busan_waves −11, daegu_thunders −10, daejeon_redfox −9 |
| v18_016 | goyang_storm −20, busan_waves −13, daegu_thunders −12, daejeon_redfox −9 |
| v18_018 | goyang_storm −9 |
| v18_019 | goyang_storm −16, busan_waves −10, daejeon_redfox −9, daegu_thunders −9 |
| v18_020 | goyang_storm −18, busan_waves −12, daegu_thunders −10, daejeon_redfox −9 |
| v18_022 | incheon_seagulls −11 |
| v18_023 | 10구단 모두 −15 안팎 (incheon_seagulls −21) |
| v18_024 | 10구단 모두 −21 안팎 (incheon_seagulls −29) |
| v18_026 | incheon_seagulls −9 |
| v18_027 | 10구단 모두 −13 안팎 (incheon_seagulls −18) |
| v18_028 | 10구단 모두 −19 안팎 (incheon_seagulls −26) |
| v18_030 | incheon_seagulls −9 |
| v18_031 | 10구단 모두 −14 안팎 (incheon_seagulls −18) |
| v18_032 | 10구단 모두 −19 안팎 (incheon_seagulls −26) |
| v18_034 | incheon_seagulls −10 |
| v18_035 | 10구단 모두 −13 안팎 (incheon_seagulls −18) |
| v18_036 | 10구단 모두 −19 안팎 (incheon_seagulls −25) |
| v18_038 | incheon_seagulls −9 |
| v18_039 | 10구단 모두 −13 안팎 (incheon_seagulls −18) |
| v18_040 | 10구단 모두 −20 안팎 (incheon_seagulls −25) |
| v18_042 | daegu_thunders −10 |
| v18_043 | daegu_thunders −17, suwon_sparks −11, goyang_storm −9 |
| v18_044 | daegu_thunders −16, goyang_storm −11, suwon_sparks −8 |
| v18_047 | daegu_thunders −14, suwon_sparks −9, goyang_storm −8 |
| v18_048 | daegu_thunders −10 |
| v18_051 | daegu_thunders −9 |
| v18_055 | daegu_thunders −10 |
| v18_058 | daegu_thunders −9 |
| v18_059 | suwon_sparks −9, goyang_storm −9 |
| v18_062 | busan_waves −10, daegu_thunders −9, seoul_hounds −8 |
| v18_063 | busan_waves −15, incheon_seagulls −12, seoul_hounds −11, gwangju_blazes −9, daegu_thunders −9 |
| v18_064 | busan_waves −20, incheon_seagulls −15, seoul_hounds −11, daegu_thunders −11, gwangju_blazes −10 |
| v18_067 | incheon_seagulls −10, busan_waves −9 |
| v18_068 | incheon_seagulls −12, busan_waves −12 |
| v18_071 | incheon_seagulls −10, busan_waves −10, seoul_hounds −8 |
| v18_072 | incheon_seagulls −10 |
| v18_075 | incheon_seagulls −10, busan_waves −9 |
| v18_076 | incheon_seagulls −11 |
| v18_079 | busan_waves −9, incheon_seagulls −8 |
| v18_101 | suwon_sparks −9 |
| v18_102 | suwon_sparks −12 |
| v18_103 | suwon_sparks −15 |
| v18_104 | suwon_sparks −18, seoul_hounds −9, changwon_anchors −9, gwangju_blazes −8 |
| v18_107 | suwon_sparks −12 |
| v18_108 | suwon_sparks −14 |
| v18_111 | suwon_sparks −11 |
| v18_115 | suwon_sparks −11 |
| v18_118 | suwon_sparks −9 |
| v18_119 | suwon_sparks −12 |
| v18_124 | gwangju_blazes −8 |
| v18_142 | suwon_sparks −10 |
| v18_143 | suwon_sparks −17, incheon_seagulls −11, goyang_storm −10, daejeon_redfox −10 |
| v18_144 | suwon_sparks −24, incheon_seagulls −16, daejeon_redfox −14, goyang_storm −12 |
| v18_146 | suwon_sparks −10 |
| v18_147 | suwon_sparks −17, incheon_seagulls −8, goyang_storm −8 |
| v18_148 | suwon_sparks −22, incheon_seagulls −9, goyang_storm −9, daejeon_redfox −9 |
| v18_151 | suwon_sparks −17, goyang_storm −10, incheon_seagulls −9, daejeon_redfox −9 |
| v18_152 | suwon_sparks −19, daejeon_redfox −10, goyang_storm −9 |
| v18_155 | suwon_sparks −17, goyang_storm −9, daejeon_redfox −9, incheon_seagulls −8 |
| v18_156 | suwon_sparks −20, daejeon_redfox −11, goyang_storm −10, incheon_seagulls −8 |
| v18_159 | suwon_sparks −16, incheon_seagulls −9, goyang_storm −9, daejeon_redfox −9 |
| v18_160 | suwon_sparks −19, incheon_seagulls −10, daejeon_redfox −9 |
| v18_184 | seoul_hounds −9 |

v13: `assets/v13/face256` 44·48·51번 칸(구단 0~9 대부분, −6~−9%).

## 4. 고칠 때 지켜 주실 것

- 신원·나이·순서·태그·파일 이름·시트 크기·칸 간격(`grid.pitch`)·`rect`는 그대로 둡니다. 쏠린 칸만 다시 자르거나 다시 만듭니다.
- 머리(모자 끝~턱) 가로 중심이 칸 가운데에서 **4% 안**에 오게 합니다. 모자 끝은 지금처럼 칸 위 가장자리 가까이에 둡니다.
- 칸 오른쪽·왼쪽 끝에 옆 사람(어깨·팔)이 보이지 않게 합니다.
- 384·256·128은 같은 그림을 줄여 만들고, 384와 256의 세로 위치 차이(지금 4~5px)도 1px 안으로 맞춥니다.
- `manifest.json` `sheets[].sha256`·`bytes`와 `checksums.sha256`을 새 파일로 고칩니다.
- 측정 방법: 칸마다 위 4~42% 줄에서 배경(채도 낮은 회색)을 줄마다 직선으로 맞춘 뒤, 배경과 다른 가장 긴 구간의 가운데를 줄마다 구해 중앙값을 씁니다. 게임 저장소 `tools/gen-face-centers.py`와 같은 방법입니다. 이 도구로 다시 쟀을 때 v18 표가 비면 통과입니다.
