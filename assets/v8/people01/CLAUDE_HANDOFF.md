# Claude 인계 · v8 people01

에셋 검수 통과 / 게임 연결 검수 대기. 브랜치: `assets/v8-people01-review`. 루트: `assets/v8/people01/`. 요청서: `docs/asset-requests/2026-11-06-codex-v8-people-faces.md`. 기준 main: `b4761781230d73a058d491cd432e33d46e53f1eb`.

## 읽을 파일

- `assets/v8/people01/manifest.json`: 인물 120명, 역할·성별·나이·안경·수염, 크기별 사진 좌표.
- `assets/v8/people01/validation.json`: 최종 런타임 시트에서 재계산한 0.40 검수 결과.
- `assets/v8/people01/previews/overview_128.png`: 전체 비교판.
- `assets/v8/people01/previews/{r}_256.png`: 역할별 원본 크기 비교판 9장.

런타임 시트는 아래 4장이다. 표의 경로와 `identities[].sheets[size].path`는 **에셋 루트 기준 상대 경로**이므로 `manifest.path_base`를 앞에 붙인다.

| 파일 | 크기 | 인원 | 바이트 |
|---|---|---:|---:|
| [sheets/128/people01_01.webp](sheets/128/people01_01.webp) | 1280×1280 | 100 | 1,636,342 |
| [sheets/128/people01_02.webp](sheets/128/people01_02.webp) | 1280×1280 | 20 | 331,242 |
| [sheets/256/people01_01.webp](sheets/256/people01_01.webp) | 2560×2560 | 100 | 6,167,988 |
| [sheets/256/people01_02.webp](sheets/256/people01_02.webp) | 2560×2560 | 20 | 1,243,568 |

시트 합계 9,379,140 bytes. 사진은 모자 없는 RGB 완성본이며 128·256 모두 무손실 WebP다. 시트 4장과 manifest만 런타임 대상이다.

## 인물 데이터

- `id`와 `identity_id`: 같은 안정 ID, 예: `v8_people01_agent_001`.
- `r`: 아래 표의 역할 키. 이를 기준으로 역할별 인물 풀을 만든다.
- `age`: 역할 범위 안의 가상 나이.
- `f`: **boolean, true=여성 / false=남성**. `sex`는 같은 값을 `female` / `male` 문자열로도 제공한다.
- `glasses`, `beard`: boolean. `tags.glasses`, `tags.beard`도 같은 값이다.
- `index`: 전체 시트 순서 0–119. `page`, `cell`, `row`, `column`은 모두 0부터 센다.
- `sheets["128" 또는 "256"]`: `path`, `rect=[x,y,width,height]`, `index`(페이지 안 칸 번호), `row`, `column`.

| 역할 키 | 역할 | 인원 | 남 / 여 | 나이 |
|---|---|---:|---:|---:|
| `agent` | 에이전트 | 16 | 12 / 4 | 32–58 |
| `doc` | 팀 닥터·트레이너 | 12 | 9 / 3 | 30–60 |
| `sec` | 비서 | 8 | 2 / 6 | 25–38 |
| `scout` | 스카우트 | 16 | 14 / 2 | 30–65 |
| `ana` | 전력분석원 | 12 | 8 / 4 | 26–45 |
| `ceo` | 구단 사장 | 12 | 11 / 1 | 50–68 |
| `fan` | 팬 대표 | 12 | 6 / 6 | 20–55 |
| `press` | 기자 | 12 | 7 / 5 | 27–55 |
| `front` | 프런트 직원 | 20 | 10 / 10 | 27–55 |

## 칸 계산

`page=floor(index/100)`, `cell=index%100`, `row=floor(cell/10)`, `column=cell%10`.

해상도를 n이라고 하면 pitch=n, 패딩=0, rect=`[column*n, row*n, n, n]`이다. 각 파일 크기는 `(10*n) × (10*n)`이다. 페이지 0은 `people01_01.webp`의 100명, 페이지 1은 `people01_02.webp`의 앞 20명이다. 페이지 1의 cell 20–99는 검정 빈칸이다. 풀을 만들 때 manifest의 120명만 순회한다.

같은 인물을 다른 역할로 재사용하지 않도록 안정 ID로 관리한다. 첫 100명은 agent→doc→sec→scout→ana→ceo→fan→press, 두 번째 시트 20명은 front다. 얼굴 합성·색 치환·알파·정렬 시트는 필요 없다. 사진 전체 rect를 그대로 표시하면 된다.

## 검수 근거

128·256 같은 해상도끼리 각각 비교했다. v8 내부 및 v8↔v6c(100명×홈10구단), v8↔v7(126명), 총 284,520회에서 raw cosine 0.40 이상은 0회다.

| 크기 | v8 내부 최대 | v6c 교차 최대 | v7 교차 최대 | 기준 이상 |
|---|---:|---:|---:|---:|
| 128 | 0.394315988 | 0.390122175 | 0.397228450 | 0 |
| 256 | 0.398505330 | 0.395405501 | 0.399598807 | 0 |

`validation.json.per_identity[].nearest[size]`에 내부·선수·v7 각 최근접 상대를 넣었다. `validation/arcface_embeddings.npz`의 `ids`, `e128`, `e256`은 manifest 순서이고, `reference_ids`, `reference_groups`, `reference_e128`, `reference_e256`은 1,126장 참조 사진이다. `arcface_scores.npz`는 `within_128`, `within_256`(120×120, 대각선 -inf), `cross_128`, `cross_256`(120×1126)이다. 점수 행·열 순서는 임베딩 ID 순서와 같다. 출처·모델 해시는 `validation/reference_provenance.json`에 있다.

전원 256px 비교판에서 얼굴·목·칼라, 무지 의상, 모자 없음, 안경·수염 태그, 명백한 유명인 닮음을 육안 확인했다. 게임 화면에 연결한 검수는 Claude 측에서 진행하면 된다. main 병합은 이 작업에 포함하지 않는다.
