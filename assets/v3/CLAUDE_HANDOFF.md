# Claude 적용 지침 — 에셋 v3

이 커밋은 에셋 납품만 수행합니다. `src/`, `index.html`, 빌드/검사 코드, 기존 `assets/v2_1/`은 변경하지 않습니다. 기존 게임 화면과 얼굴 생성은 그대로입니다.

## 적용 순서

1. `manifest.json`의 `assets` ID 사전을 읽습니다. key로 연결하고 배열 인덱스를 게임 구단 ID로 사용하지 않습니다.
2. `trophyImg()`·`awArt()`의 수상 분류를 `collections.trophies`의 ID와 연결합니다. 함수 이름이나 현재 게임 enum을 이 납품이 자동으로 변경하지 않습니다.
3. 선수 경력·수상, 우승 진열장, 시상식·대진표, 골든글러브·올스타 화면에 맞는 원본을 선택합니다. 색이나 개수, 연도는 게임 데이터로 표시합니다.
4. 유니폼은 `teams[].uniform_sets` 및 `national.uniform_sets`, 모자는 `cap`으로 찾습니다. 홈/원정·정면/뒷면을 혼동하지 마세요.
5. 대기록은 `collections.feats`에서 분류합니다. 통산·시즌 공용 틀에 표시하는 숫자는 관측된 실제 기록만 사용합니다.

## 바로 사용할 주요 ID

| 용도 | ID |
| --- | --- |
| 한국시리즈 우승 / 준우승 | `championship_trophy` / `runner_up_trophy` |
| 정규시즌 1위 | `regular_season_pennant` |
| MVP / 신인왕 / 골든글러브 | `mvp_trophy` / `rookie_trophy` / `golden_glove` |
| 타격 / 투수 타이틀 무문자판 | `batting_title_blank` / `pitching_title_blank` |
| 올스타 MVP / 선정 | `all_star_mvp` / `all_star_dream_badge` / `all_star_nanum_badge` |
| 국가대표 메달 | `national_gold_medal` / `national_silver_medal` / `national_bronze_medal` |
| 반지 / 명예의 전당 / 감독상 | `championship_ring` / `hall_of_fame_plaque` / `manager_trophy` |
| 사이클링 / 노히트 / 퍼펙트 | `cycling_hit` / `no_hitter` / `perfect_game` |
| 한 경기 4홈런 / 연타석 / 끝내기 / 만루 | `four_home_runs` / `consecutive_home_runs` / `walk_off_home_run` / `grand_slam` |
| 15K / 연속 안타 | `fifteen_strikeouts` / `hitting_streak` |
| 통산 / 시즌 공용 틀 | `career_milestone_frame` / `season_record_frame` |

## 그림과 데이터를 분리할 부분

- 실제 선수 앞번호를 넣는 화면에는 `_front_blank`를 사용합니다. `front_sample`에 그려진 24는 디자인 예시입니다. PNG 위에 24를 덮어 다른 숫자인 척 표시하지 마세요.
- 뒷면 이름·등번호, 상패 부문, 명예의 전당 이름, 대기록 숫자, 우승 연도/개수는 manifest의 `text_slots`에 렌더링합니다.
- 명판·글자 영역의 사각형은 `[x,y,w,h]`, anchor는 `[x,baseline_y]`입니다. 폰트 크기도 viewBox 단위이며 출력 폭에 비례해 변환합니다. 긴 선수명/부문명은 사각형 안에 맞춰 줄이세요.
- SVG의 각 ID는 에셋 ID로 접두어 처리했습니다. 같은 SVG를 DOM에 여러 번 직접 넣을 때는 인스턴스 접두어도 추가하세요. `<img>`로 쓸 때는 문서별로 분리되므로 해당 문제가 없습니다.
- 반지 보석은 `color_tokens.gem`의 레이어와 그라디언트만 변경합니다. 빛/그림자 면을 유지하세요. 유니폼/모자 색은 11팀별로 이미 제작되어 있으므로 기존 구단색을 임의로 재해석할 필요가 없습니다.
- 로고 폴더는 추가 보조 심벌/워드마크입니다. 승인된 원형 배지의 대체물이 아닙니다. 흰색판은 어두운 배경에, 유색판은 밝은 배경에 사용합니다.
- 배경의 `safe_area` 안에는 글자를 올릴 수 있습니다. 무대/대진표 배경에는 실제 우승팀·대진·성적·행사명이 구워져 있지 않습니다.

## 배포와 검수

- 모든 SVG는 실제 벡터이며 `<image>`, 외부 폰트, 스크립트가 없습니다. CSS 변수에 의존하지 않습니다.
- 배경 두 장 외 PNG는 알파 채널을 사용합니다. 미리보기의 검수용 배경을 실제 에셋으로 사용하지 마세요.
- 작은 아이콘에는 32/64px, 유니폼에는 실제 표시 크기와 DPR에 맞는 PNG/SVG를 선택합니다. 시상식·대진표 배경은 WebP 우선입니다.
- 기존 단일 HTML/웹 분리 배포 방식에 맞춰 필요한 파일만 포함하세요. `ASSET_PREVIEW*`, `previews/`, README와 체크섬은 런타임 번들에서 제외합니다.
- 체크섬은 납품 원본에 대한 것입니다. 게임에서 파생 SVG를 만들었다면 별도 결과물로 취급합니다.
- 연결 후 작은 트로피 진열장, 수상 연표, 흰색/어두운 UI, 모바일 유니폼·모자, 긴 이름·세 자리 번호·30-30, 반지 색 변경을 실제 게임에서 확인하세요.

필수 제작 범위 A~D와 선택 항목 E/F 및 감독상을 포함했습니다. 인게임 연결 완료를 의미하지는 않습니다.
