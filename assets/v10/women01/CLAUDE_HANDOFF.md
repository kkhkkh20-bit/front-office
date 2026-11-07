# Claude 인계 · v10 women01

에셋 검수 통과 / 게임 연결 검수 대기. 브랜치 `assets/v10-women01-review`. 루트 `assets/v10/women01/`. 요청서 `docs/asset-requests/2026-11-07-codex-v10-women-staff-faces.md`. 코드 수정과 main 병합은 이 작업에 포함하지 않았다.

## 읽을 파일

- `manifest.json`: 40명과 역할·묶음·나이·성별·안경·수염·사진 rect.
- `validation.json`: 최종 시트에서 재계산한0.40 기준 검수, 최대값·최근접 상대.
- `previews/overview_128.png`: 전체 비교판.
- `previews/{group}_256.png`: 요청한 묶음별256px 사진 비교판.

`r`은 front/staff/gm이다. 분석원·코치 보조 묶음은 staff를 사용한다. 전원 `f:1`이다.

## 시트

모자 없는 완성 RGB 사진이다. 합성용 모자/의상 데이터 시트가 아니므로 완성 사진을 그대로 표시한다. 런타임은 아래2장과 manifest만 필요하다.

| 파일 | 크기 | 바이트 |
|---|---|---:|
| [sheets/128/women01.webp](sheets/128/women01.webp) | 1280×1280 | 667,028 |
| [sheets/256/women01.webp](sheets/256/women01.webp) | 2560×2560 | 2,585,510 |

사진 시트 합계 3,252,538 bytes. `identities[].sheets["128" 또는 "256"].path`는 에셋 루트 기준 상대 경로다. `manifest.path_base`인 `assets/v10/women01/`를 앞에 붙인다.

## 인물·칸 위치

- `id` / `identity_id`: 동일한 안정 ID, 회차를 포함해 기존 인물과 충돌하지 않는다.
- `r`: 역할 키. `r`은 front/staff/gm이다. 분석원·코치 보조 묶음은 staff를 사용한다. 전원 `f:1`이다.
- `a` / `age`: 같은 가상 설정 나이.
- `f`: **정수0=남성,1=여성**. `sex` 문자열도 male/female로 같은 값을 제공한다.
- `casting_origin`: 가상 인물 생성 캐스팅 분류. 게임 국적을 강제하지 않는다. 한국인80% 이상을 유지했다.
- `glasses`, `beard`와 `tags.glasses`, `tags.beard`: boolean.
- `index` / `cell_index` / `cell`: 0–39, `page:0`.
- `row=floor(index/10)`, `column=index%10`.
- 해상도 n=128 또는256에서 pitch=n, padding=0, `rect=[column*n,row*n,n,n]`.
- 시트 크기=(10*n)×(10*n). cell40–99는 검정 빈칸이므로 manifest의 인물 목록만 순회한다.

| 묶음 | 역할·인상 | 인원 | 남 / 여 | 나이 |
|---|---|---:|---:|---:|
| `front` | 프런트 직원 | 16 | 0 / 16 | 24–34 |
| `staff` | 전력분석원·코치 보조 | 12 | 0 / 12 | 26–36 |
| `gm` | 여성 단장 후보 | 12 | 0 / 12 | 30–42 |



## 검수

최종 무손실 WebP의 RGB를 읽어 크기·칸 좌표·빈칸·원본 사진과 픽셀 일치·얼굴 검출·ArcFace0.40을 검사했다. 128·256 각각 독립 검출·정렬이며 점수를 반올림·보정하지 않았다. 비교는 신규 인물끼리 및 신규↔v6c100명(홈10구단 사진1,000장)/v7 126명/v8 120명/v9 60명이다. 최대값과 최근접 상대는 validation.json, 원본 수치는 validation/*.npz에 있다. NPZ·검수 PNG·보고서를 게임 번들에 넣지 않는다.

이번 v10은 v9 리뷰 브랜치 커밋 `81d5bbb3d0ce7c58efac1273b638ddb1b51248a2`의 최종 60명과도 비교했다. v9 에셋은 별도 브랜치 `assets/v9-gm01-review`에 있으며 이 v10 변경에 복사하지 않았다. 참조 파일·커밋 해시는 검수 자료에 남겼다.

모든 사진은 자신의 목·어깨·옷까지 연속적으로 생성됐고 얼굴 붙이기·공통 상체·모자·구단 의상 합성은 없다. 육안 검수 기록은 validation/visual_review.json에 있다. 실존 인물 전수 대조나 게임 연결 완료를 주장하는 자료가 아니다.
