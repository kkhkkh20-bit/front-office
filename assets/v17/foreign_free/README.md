# v17 — 소속 없는 외국인 선수 60명

리뷰 브랜치 `assets/v17-review`, 에셋 루트 `assets/v17/foreign_free/`입니다. 가상 성인 남성 야구선수 60명의 새 사진을 제공합니다. 코드 변경과 main 병합은 하지 않았으며, 게임 연결은 후속 작업입니다.

회색·남색 무지 훈련복, 모자 없음, 가슴 위 정면 구도와 어두운 스튜디오 배경으로 제작했습니다. 로고·글자·실제 구단 유니폼을 넣지 않았습니다. 각 인물의 머리·목·어깨·옷이 이어지는 완전한 사진이며, 공통 몸통에 얼굴을 붙이지 않았습니다. 여백을 맞추는 생성 사진 수정과 사진 전체의 동일 비율 자르기·리사이즈만 사용했습니다.

## 구성

- A 미국·캐나다 24명: 백인 12·흑인 8·기타 4, 22~36세.
- B 중남미 18명: 도미니카·베네수엘라·쿠바·멕시코·푸에르토리코, 22~35세.
- C 아시아쿼터 12명: 일본 6·대만 3·호주 2·필리핀 1, 21~32세.
- D 기타 6명: 퀴라소 출신 네덜란드 2·남아공 2·독일 1·이탈리아 1, 23~33세.

국적·캐스팅별 실제 수:

- US White: 9명
- Canadian White: 3명
- US Black: 6명
- Canadian Black: 2명
- US Asian: 1명
- US Native American: 2명
- Canadian Mixed: 1명
- Dominican Latino: 5명
- Venezuelan Latino: 4명
- Cuban Latino: 3명
- Mexican Latino: 3명
- Puerto Rican Latino: 3명
- Japanese: 6명
- Taiwanese: 3명
- Australian White: 1명
- Australian Asian: 1명
- Filipino: 1명
- Curacao Dutch: 2명
- South African Black: 1명
- South African White: 1명
- German White: 1명
- Italian White: 1명

국적·나이·인종 구분은 가상 캐릭터의 제작 지정값이며, 실존 인물의 국적을 얼굴로 추정한 자료가 아닙니다.

## 시트와 좌표

v6c `assets/v6/batch01c/production100/manifest.json`의 셀 규격을 그대로 사용합니다. 사진 사방 여백 8px, 피치=사진 크기+16px, RGB 10×10, 손실 WebP **q80**입니다. 앞 60칸에 사진을 순서대로 넣고 나머지 40칸은 검정으로 채웠습니다. 손실압축에 따른 작은 경계·예측 오차 통계는 validation.json에 기록했습니다.

| 사진 크기 | 시트 크기 | 피치 | bytes | 파일 |
|---|---|---:|---:|---|
| 128 | 1440×1440 | 144 | 81868 | `sheets/128/foreign_free.webp` |
| 256 | 2720×2720 | 272 | 227368 | `sheets/256/foreign_free.webp` |

두 런타임 시트 합계 309,236bytes. 비교판과 검수 데이터는 앱에 포함할 필요가 없습니다.

`identities[].sheets[128|256].path·rect`를 사용하세요. 모든 path는 `path_base`인 `assets/v17/foreign_free/` 기준입니다. 인덱스 i의 좌표는 `x=(i%10)*(n+16)+8`, `y=floor(i/10)*(n+16)+8`, 너비·높이=n입니다.

각 인물은 `id`, `a`, `e`, `asia`, `country`, `group`, `sex:"male"`, `team:null`, `unaffiliated:true`를 가집니다. 선수 데이터 호환용 `f:1`은 외국인 표시이며 성별 필드가 아닙니다. `asia`는 아시아쿼터 자격입니다. 호주 2명도 true입니다. 인종 구분과는 별개의 국적·쿼터 자격 플래그입니다. `NL-CW`는 퀴라소 출신 네덜란드 캐스팅입니다.

## 검수

상태: **ASSET_VALIDATION_PASSED_GAME_REVIEW_PENDING**.

실제 납품 q80WebP를 디코딩한 뒤 각 rect에서 얼굴을 검출·정렬하고 동일한 ArcFace 모델로 비교했습니다. 인물 60명의 1,770쌍이 두 해상도 모두 raw cosine **0.40 미만**입니다. 점수 보정·재스케일·whitening은 하지 않았습니다.

- 128: 최대 0.391304493, 최근접 ['v17_foreign_free_010', 'v17_foreign_free_011'].
- 256: 최대 0.369414449, 최근접 ['v17_foreign_free_029', 'v17_foreign_free_034'].

이번 60명 사이의 비중복 검수입니다. 과거 모든 버전과 비교한 검수나 모든 실존 인물 데이터베이스와의 비교는 수행하지 않았습니다. 실존 인물을 모방하지 않는 가상 캐스팅과 육안 검수를 적용했습니다. 게임 내 연결·동작 검사는 수행하지 않았습니다.

`previews/all60_256.jpg`와 묶음별 `previews/group_A_256.jpg`~`group_D_256.jpg`는 최종 시트를 실제로 디코딩한 비교판입니다. 출처·생성 지시·검출 좌표·임베딩·쌍별 점수는 `validation/`에 있습니다.
