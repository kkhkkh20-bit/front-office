# Claude handoff — v14

리뷰 브랜치: `assets/v14-review`. 납품 루트: `assets/v14/`. main 병합 없음. 코드 수정 없음.

## A 단장 나이 변화

`gm_age/manifest.json`에서 같은 `base`의 `age_step`0/10/20사진을 찾아 쓰면 됩니다. `base`는 기존v9단장ID입니다. 요청서의 교체 시점은 원래 사진 나이보다8살 이상일 때+10,18살 이상일 때+20입니다. 이 로직은 에셋에 구현하지 않았습니다.

아래20명만 대상이고 나머지v9인물은 기존사진을 계속 사용하세요. 남14·여6의20명, 사진60장입니다. 모든 나이사진을 별개 후보60명으로 등록하지 마세요.

| v9 base | 성별 | 나이 | 새 identity_id |
|---|---|---|---|
| v9_gm01_gm_002 | 남 | 28 → 38 → 48 | v14_gmage_001 |
| v9_gm01_gm_007 | 남 | 30 → 40 → 50 | v14_gmage_002 |
| v9_gm01_gm_010 | 남 | 31 → 41 → 51 | v14_gmage_003 |
| v9_gm01_gm_012 | 남 | 31 → 41 → 51 | v14_gmage_004 |
| v9_gm01_gm_014 | 남 | 32 → 42 → 52 | v14_gmage_005 |
| v9_gm01_gm_017 | 남 | 32 → 42 → 52 | v14_gmage_006 |
| v9_gm01_gm_021 | 남 | 35 → 45 → 55 | v14_gmage_007 |
| v9_gm01_gm_026 | 여 | 29 → 39 → 49 | v14_gmage_008 |
| v9_gm01_gm_029 | 여 | 32 → 42 → 52 | v14_gmage_009 |
| v9_gm01_gm_030 | 여 | 33 → 43 → 53 | v14_gmage_010 |
| v9_gm01_gm_031 | 남 | 30 → 40 → 50 | v14_gmage_011 |
| v9_gm01_gm_032 | 남 | 33 → 43 → 53 | v14_gmage_012 |
| v9_gm01_gm_033 | 남 | 33 → 43 → 53 | v14_gmage_013 |
| v9_gm01_gm_034 | 남 | 33 → 43 → 53 | v14_gmage_014 |
| v9_gm01_gm_037 | 남 | 35 → 45 → 55 | v14_gmage_015 |
| v9_gm01_gm_038 | 남 | 36 → 46 → 56 | v14_gmage_016 |
| v9_gm01_gm_041 | 남 | 38 → 48 → 58 | v14_gmage_017 |
| v9_gm01_gm_047 | 여 | 32 → 42 → 52 | v14_gmage_018 |
| v9_gm01_gm_048 | 여 | 32 → 42 → 52 | v14_gmage_019 |
| v9_gm01_gm_049 | 여 | 33 → 43 → 53 | v14_gmage_020 |

## B 치어리더·응원 무대

인물: `cheer/portraits/manifest.json`, 새12명입니다. 모두 모자 없이 자연스러운 가까운 어깨 사진이고, 납품된v12의48명과 중복을 제외했습니다. 사용하지 않았던 가상 캐스팅 후보에서 선별했으며 출처는 `cheer/portraits/validation/source_candidates.json`에 있습니다.

무대: 기본3장(단장1+여성4), 확대3장(여성8+북/단장), 대폭확대3장(여성12명이상+북/단장/관중). 이벤트: 팬사인회·하이파이브, 레트로유니폼데이, 시구행사 각1장입니다. 무대 출연자는 독립 가상 인물이며 인물카드12명과 일대일 얼굴 연결을 약속하는 사진은 아닙니다.

## C 스카우트

출장/보고서용10장. 고교주말리그3, 전국대회2, 더그아웃면담2, 겨울전훈2, 회의1. 면담 장면은 감독 얼굴을 식별하기 어렵도록 뒷모습으로 수정했습니다.

## 경로·용량

인물 manifest의 시트 path는 각 `path_base` 기준, 장면의 file.path는 `assets/v14/` 기준입니다. 인물은128·256RGB10×10, 패딩0입니다. 앱용 두128시트 합계 **1,223,028bytes**.256과 장면은 사이트용 별도 파일로 두세요.22장 장면은 각1280×720WebP·600KB이하이며 개별파일입니다.

| 장면ID | bytes | assets/v14/ 기준 경로 |
|---|---:|---|
| cheer_basic_1 | 261440 | `cheer/stage/cheer_basic_1.webp` |
| cheer_basic_2 | 200888 | `cheer/stage/cheer_basic_2.webp` |
| cheer_basic_3 | 245436 | `cheer/stage/cheer_basic_3.webp` |
| cheer_expanded_1 | 330518 | `cheer/stage/cheer_expanded_1.webp` |
| cheer_expanded_2 | 242062 | `cheer/stage/cheer_expanded_2.webp` |
| cheer_expanded_3 | 262716 | `cheer/stage/cheer_expanded_3.webp` |
| cheer_large_1 | 428340 | `cheer/stage/cheer_large_1.webp` |
| cheer_large_2 | 309452 | `cheer/stage/cheer_large_2.webp` |
| cheer_large_3 | 295478 | `cheer/stage/cheer_large_3.webp` |
| event_fan_highfive | 236050 | `cheer/events/event_fan_highfive.webp` |
| event_retro_uniform | 249392 | `cheer/events/event_retro_uniform.webp` |
| event_first_pitch | 246796 | `cheer/events/event_first_pitch.webp` |
| scout_weekend_1 | 283104 | `scout/scenes/scout_weekend_1.webp` |
| scout_weekend_2 | 306714 | `scout/scenes/scout_weekend_2.webp` |
| scout_weekend_3 | 279518 | `scout/scenes/scout_weekend_3.webp` |
| scout_tournament_1 | 330422 | `scout/scenes/scout_tournament_1.webp` |
| scout_tournament_2 | 274332 | `scout/scenes/scout_tournament_2.webp` |
| scout_dugout_1 | 273318 | `scout/scenes/scout_dugout_1.webp` |
| scout_dugout_2 | 329086 | `scout/scenes/scout_dugout_2.webp` |
| scout_winter_1 | 275800 | `scout/scenes/scout_winter_1.webp` |
| scout_winter_2 | 221158 | `scout/scenes/scout_winter_2.webp` |
| scout_draft_meeting | 203952 | `scout/scenes/scout_draft_meeting.webp` |

## 검수 상태

`validation.json`: ASSET_VALIDATION_PASSED_GAME_REVIEW_PENDING. ArcFace의 범위·수치·한계는 README와 validation에 있습니다. 메인 병합/게임 연결/실제 화면 확인은 후속 작업입니다.
