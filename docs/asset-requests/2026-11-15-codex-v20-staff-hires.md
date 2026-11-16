# 코덱스 요청서 v20: 감독·코치 고화질 사진 (기존 60명, 384·256)

작성일: 2026-11-15

## 1. 배경

감독 화면과 코치 카드를 선수 카드처럼 큰 사진으로 바꿨습니다. 폰에서는 폭 220px, PC에서는 240px로 보입니다. 그런데 감독·코치 사진은 구단 유니폼판이 128px뿐이라 크게 보이면 흐립니다.

`assets/v7/staff01/sheets/coaches/256`은 모자만 따로 그린 겹침용 판입니다. 얼굴 사진이 아니라서 큰 사진으로 쓸 수 없습니다.

## 원본 위치
- 512px 원본 ZIP 3개는 main이 아니라 v7 납품 리뷰 브랜치에 있습니다.
- 브랜치: `assets/v7-staff01-review` (커밋 0ebd534a)
- 경로: `assets/v7/staff01/archive/portraits_part01.zip` ~ `portraits_part03.zip` (각 약 13~14MB)
- 목록: `assets/v7/staff01/archive_manifest.json`
- manifest의 각 인물 `archive.png512_entry`(예: `512/v7_staff01_coach_001.png`)로 ZIP 안 파일을 찾으면 됩니다.

## 2. 요청

- **대상 인물:** v7 `manager_coach` 60명입니다. `assets/v7/staff01/manifest.json`의 `identities` 중 `role_group`이 manager_coach인 인물입니다.
- **유지할 것:** 얼굴, 나이, 안경, 수염은 그대로 둡니다. 새 인물을 만들지 않습니다.
- **만들 판:** 10개 구단 홈 유니폼과 모자를 쓴 완성 사진입니다. 얼굴과 모자를 합성한 판이 아니라, 머리·목·어깨가 이어지는 한 장의 사진이어야 합니다.
- **유니폼 기준:** 유니폼, 모자 색, 가슴 표시는 `assets/v6/batch01d/production60/manifest.json`의 `teams[].home_kit`과 `cap_color`를 따릅니다. 코치용 바람막이·훈련복이 아니라 홈 유니폼으로 통일합니다.
- **구단 키(순서 고정):** `seoul_comets, seoul_hounds, incheon_seagulls, suwon_sparks, goyang_storm, daejeon_redfox, gwangju_blazes, daegu_thunders, busan_waves, changwon_anchors`
- **구도:** v18 선수 사진과 같습니다. 정면에서 살짝 비스듬한 상반신이고 머리 위에 여백을 둡니다. 배경은 중립 회색, 조명은 균일하게 합니다.
- **품질:**
  - 피부 질감과 주름이 보이는 실제 사진 수준이어야 합니다. 나이 든 감독이 많기 때문입니다.
  - 과한 보정이나 뭉개짐이 없어야 합니다.
  - 생성 원본에서 바로 줄여서 만들어 주세요. 128px 판을 키우면 안 됩니다.

## 3. 시트 규격

시트는 모두 10×10 격자이고, 60명이 칸 0~59를 씁니다. 칸 순서는 manifest 순서와 같습니다.

| 크기 | 칸 간격(pitch) | 사진 위치(rect) | 형식 | 장당 목표 |
|---|---:|---|---|---|
| 384 | 400 | `[col*400+8,row*400+8,384,384]` | WebP q88~90, RGB | 2.5MB 이하. 용량보다 화질 우선 |
| 256 | 272 | `[col*272+8,row*272+8,256,256]` | WebP q88 | 900KB 이하 |
| 128 | 144 | `[col*144+8,row*144+8,128,128]` | WebP q85 | 지금처럼 목록용 |

경로는 `assets/v20/staff60/sheets/{384|256|128}/{team_key}.webp`입니다. 3종 × 10구단으로 30장입니다.

## 4. 검수

- **같은 인물인지:** v7 같은 인물과의 ArcFace 코사인이 0.60 이상이어야 합니다. 다른 인물과는 0.40 미만이어야 합니다. 비교 대상은 v7 126명, v6c 100명, v13 60명, v18 200명입니다.
- **구단 간 비교:** 같은 인물의 구단 버전끼리 모든 쌍이 0.60 이상이어야 합니다.
- **결함:** 안경테, 귀, 손이 깨지면 안 됩니다. 모자 로고가 다른 구단 것과 섞이면 안 됩니다. 글자나 실존 구단 로고가 들어가면 안 됩니다.

## 5. 납품

- **위치:** `assets/v20/staff60/`
  - `manifest.json`: `identities[]`에 `v7_identity_id`, `age`, `tags`, `variants[team].sheets["384"|"256"|"128"]`(path·rect)를 넣습니다.
  - `validation.json`
  - `previews/all60_384.png`
  - 무작위 10명의 10구단 비교판
  - `checksums.sha256`
  - `CLAUDE_HANDOFF.md`
- **브랜치:** `assets/v20-review`. main에는 병합하지 않습니다.
- **게임 코드:** 고치지 않습니다. 연결은 Claude가 합니다. 감독 카드와 코치 카드의 큰 사진은 384를, 목록은 128을 씁니다.
