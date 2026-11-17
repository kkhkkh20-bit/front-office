# 점진적 모듈화 계획 (2026-11-17)

구단주 승인(2026-11-17)에 따라 전역 공간 하나에 이어 붙이는 현재 구조를 단계적으로 나눕니다. 한 번에 다시 쓰지 않고, 저장 호환을 지키면서 규칙부터 `src/core`로 옮기고, 도메인 사이 호출을 좁은 API로 모읍니다. 기존 구조 설명은 `docs/architecture.md`를 따릅니다.

해결하려는 문제는 세 가지입니다.

- 병렬 작업 충돌: 여러 에이전트가 같은 파일(`40_actions.js`, `modules.json`, `check-logic.js`, `index.html`)을 동시에 고칩니다.
- 이름 의존 파손: 전역 이름을 바꾸면 다른 브랜치의 호출부가 조용히 깨집니다(얼굴 함수 이름 변경, `amOn`→`amFaceOn` 충돌).
- 공유 가변 상태: 비동기 응답이 도착할 때 이미 다른 저장 슬롯이 열려 있어 엉뚱한 저장에 반영됩니다.

## 1. 현재 상태 (main `c75a074c` 기준 측정)

측정 방법: `modules.json`의 engine·ui·graphics·scene3d 묶음에 있는 `.js` 324개를 acorn으로 읽고, 최상위 선언(함수·클래스·변수)을 선언한 파일의 도메인(`src/<층>/<도메인>/`)에 귀속했습니다. 다른 도메인의 최상위 이름을 가리키는 식별자를 교차 참조 1건으로 셉니다. 지역 변수가 같은 이름이면 과대 집계되므로 절대값보다 순위를 보십시오. 한 줄이 긴 밀집 코드라 줄 수는 실제 분량보다 작게 나옵니다.

### 규모

| 구분 | 파일 | 줄 | 최상위 선언 |
|---|---:|---:|---:|
| engine (16개 도메인) | 166 | 20,063 | 4,856 |
| ui + gfx (23개 도메인) | 158 | 15,847 | 2,316 |
| core (`.mjs`, 실제 모듈) | 11 | 900 | 내보내기 127 |
| 합계(전역 공간) | 324 | 35,910 | 7,172 |

engine 도메인별:

| 도메인 | 파일 | 줄 | 선언 | `G.` 접근 |
|---|---:|---:|---:|---:|
| staff | 30 | 3,133 | 751 | 2,410 |
| players | 20 | 2,463 | 595 | 1,274 |
| career | 17 | 2,268 | 554 | 2,374 |
| league | 16 | 2,004 | 542 | 1,429 |
| draft | 15 | 1,722 | 534 | 1,060 |
| contracts | 11 | 2,024 | 500 | 1,285 |
| market | 11 | 1,423 | 359 | 932 |
| media | 16 | 1,917 | 303 | 1,517 |
| finance | 9 | 979 | 269 | 936 |
| development | 5 | 577 | 175 | 570 |
| progression | 3 | 481 | 87 | 584 |
| matches | 5 | 409 | 67 | 79 |
| runtime | 3 | 231 | 49 | 170 |
| ladder / cup / uladder | 5 | 432 | 71 | 84 |

ui에서 큰 도메인은 media(2,377줄, 대부분 패치 노트), matches(1,498줄·286선언), career(1,300줄·221선언), players(1,213줄)입니다.

### 교차 도메인 참조

- 전체 교차 참조 56,443건 중 `G`·`UI`·`A` 세 이름이 23,762건(42%)입니다. 이를 빼면 32,681건, 도메인 쌍 675개입니다.
- 층별(`G`·`UI`·`A` 제외): engine→engine 14,547건, ui→engine 10,378건, **engine→ui 188건**(층 역전. draft→ui/runtime 40, league→ui/market 13, draft→ui/market 13 등).
- 허브: `league/01_rules.js`(team, ovr, tname, posLabel, playersOf, capOf, payroll)와 `runtime/00_base.js`(R, N, dv, sum, clamp)가 각각 36·37개 도메인에서 쓰입니다. 모든 engine 도메인의 최대 참조 대상은 league입니다(players 799, staff 649, career 566, market 502).
- 자리를 잘못 잡은 공용 함수: `money`(금액 표기)가 `market/17_scouting.js`에 있어 31개 도메인이 market에 묶입니다. `nm`은 `staff/90_mgr_scenes.js`에 있으며 27개 도메인이 씁니다. `seasonTotal`은 `contracts/14_salary.js`에 있으며 24개 도메인이 씁니다.
- league·runtime을 뺀 engine 사이 상위 간선: contracts→market 283, staff→players 237, career→staff 209, contracts→players 202, staff→market 193, players→media 178, career→market 173, staff→career 145, market→contracts 143, players→staff 142. contracts↔market, players↔staff, staff↔career는 서로를 부르는 순환입니다.

### 변경 빈도 (2026-11-03 이후, 커밋 1,043개 중 병합 302개)

| 파일 | 변경 커밋 |
|---|---:|
| `index.html` (빌드 결과물) | 524 |
| `tools/check-logic.js` (6,278줄) | 238 |
| `src/ui/media/75_patch_notes.js` | 198 |
| `src/scene3d/scene.mjs` | 85 |
| `src/ui/actions/40_actions.js` | 77 |
| `src/modules.json` | 67 |
| `src/engine/contracts/09_stoveleague.js` | 64 |
| `src/ui/finance/35_club.js` | 62 |
| `src/ui/players/39_player_sheet.js` | 54 |
| `src/engine/progression/07_daily.js` | 53 |

상위 여섯 개 중 다섯 개는 규칙 코드가 아니라 공용 목록·결과물·검사 파일입니다. 충돌의 상당 부분은 모듈화 전에 파일을 나누는 것만으로 줄일 수 있습니다. 얼굴 관련 두 파일(`ui/assets/77_assets_ui.js`, `engine/career/32_people.js`)은 같은 기간 27개 커밋에서 바뀌었습니다.

### 큰 파일

`ui/media/75_patch_notes.js` 1,837줄, `ui/actions/40_actions.js` 579줄, `engine/contracts/09_stoveleague.js` 506줄(84선언), `ui/players/39_player_sheet.js` 418줄, `engine/draft/13_amateur_league.js` 391줄(125선언), `engine/career/27_other_gms.js` 381줄.

## 2. 원칙

1. **새 규칙은 `src/core`의 순수 모듈로 작성합니다.** `G`·`UI`·`window`·DOM을 읽지 않고, 필요한 값은 인자로 받으며 난수는 주입합니다. worker와 같은 코드를 씁니다.
2. **engine 도메인은 작은 API를 내보냅니다.** 다른 도메인은 그 API만 부르고 내부 함수를 직접 부르지 않습니다.
3. **ui는 engine을 API로만 부릅니다.** engine은 ui를 부르지 않습니다(알림·재그리기는 이벤트나 반환값으로 넘깁니다).
4. **`G` 접근은 도메인별 접근자로 모읍니다.** 한 필드의 쓰기 주인은 한 도메인입니다(예: `G.fa`, `G.contract`는 contracts).
5. **한 번에 다시 쓰지 않습니다.** 옮긴 함수 자리에는 같은 이름의 호환 함수를 남기고, 호출부는 나중에 천천히 바꿉니다.
6. **저장 호환을 지킵니다.** 저장 형식(`ver:4`)과 키는 바꾸지 않습니다. 옮기기 전후로 같은 저장을 불러 같은 결과가 나오는지 확인합니다.

## 3. 1단계: core 추출 (앞으로 1~2주)

작은 것부터 순서대로 진행합니다. 각 항목은 PR 하나이며, 옮긴 함수는 기존 전역 이름의 호환 함수로 연결합니다(`00_base.js`·`05_calendar.js`와 같은 방식).

| 순서 | 대상 | 노력 | 위험 |
|---|---|---|---|
| 0 | 공용 표기 함수 위치 정리 | S | 낮음 |
| 1 | 기기 옮기기 코드 규칙 공유 | S | 낮음 |
| 2 | 래더·컵 규칙 마무리 | S | 낮음 |
| 3 | 계약 금액 계산 | M | 중간 |
| 4 | 얼굴 배정 | M | 중간 |
| 5 | 저장소 층 | M | 중상 |

**0. 공용 표기 함수 위치 정리.** `money`(market/17_scouting), `nm`(staff/90_mgr_scenes), `seasonTotal`(contracts/14_salary)의 선언을 `engine/runtime`이나 `core/format.mjs`로 옮깁니다. 동작은 그대로입니다. 효과: 가짜 교차 간선 수백 건이 사라져 이후 측정이 정확해집니다. 검사: 빌드와 `check-static`만으로 충분합니다.

**1. 기기 옮기기(transfer).** `ui/shell/01c_transfer.js`의 `XF_ABC`·`xfNorm`·`xfFmt`·`XF_MAX`가 `worker/index.js`의 `ALPHABET`·`normCode`·크기 제한과 중복됩니다. `core/transfer.mjs`로 합쳐 두 쪽이 가져다 씁니다. 네트 기능(`core/net.mjs`)은 이미 core에 있으므로 손대지 않습니다. 검사: `tools/test/save-transfer.test.cjs`가 있습니다. `xfNorm` 직접 검사는 없으므로 정규화 표 검사를 추가합니다. 효과: 서버와 화면의 코드 규칙이 어긋날 수 없게 됩니다.

**2. 래더·컵.** `core/ladder.mjs`·`cup.mjs`·`uladder.mjs`가 이미 있고 `engine/cup/01_cup.js`도 `FrontOfficeCore`를 씁니다. 남은 규칙인 `engine/ladder/01~03`(21선언, 선수 풀·시리즈·팩)과 `cupOvr`·`cupMatch`의 판정 부분을 옮깁니다. 검사: `cup-worker.test.cjs`, `uladder-worker.test.cjs`, `check-cup-ui.cjs`. 효과: worker가 대회 결과를 같은 코드로 다시 계산해 검증할 수 있습니다.

**3. 계약 금액 계산 (효과가 가장 큼).** `core/contract-money.mjs`를 만들고 `G`에서 꺼낸 값(연도, `capY`, 서비스 연수, 에이전트 배수)을 인자로 받게 합니다.
- 상한: `capOf`(league/01_rules), `payroll`의 합산부, `salCapCheck`(41_salary_talks), `extCapCheck`(14_salary)
- 옵션·조건 가치: `CT_BON`·`CT_OPT`·`optV`·`termsEq`·`termsMul`·`termsVal`·`termsFit`(61_contract_terms)
- 삭감 하한: `salCutFloor`·`salCutRate`·`extFloor`
- 연장 가격: `extParts`·`extDemand`·`extDemandAll`·`extCutEq`·`extCutFit`·`preCap`(14_salary)

검사: `check-logic.js`에 관련 이름 참조가 63건 있지만, `termsEq`·`optV`·`extCapCheck`·`salCapCheck`의 직접 검사는 없습니다. 옮기기 전에 현재 값을 표로 고정하는 검사(선수 표본 × 연수 × 연도)를 먼저 만듭니다. 위험: 금액이 1원만 달라도 진행 중인 저장의 협상 결과가 바뀝니다. 반올림(`round5`) 순서까지 유지해야 합니다. 효과: contracts→market·players 간선(합계 485건)과 가장 자주 고치는 engine 파일(`09_stoveleague.js`)의 계산부가 분리됩니다.

**4. 얼굴 배정.** `engine/career/32_people.js`(`faceKey`, `ageP`, `grayB`, `faceTone`, `FACE_SWAP`)와 `ui/assets/77_assets_ui.js`(`face6Pool`·`face6Idx`·`face7Pool`·`face7Idx`·`face17Idx`·`face8Role`·`faceKeyOf`, 떠난 선수 얼굴 쉬는 기간)의 선택 규칙을 `core/faces.mjs`로 옮깁니다. 이미지 주소·자르기·SVG 그리기는 ui에 남깁니다. 검사: `check-face-pipeline.cjs`, `check-face-cooldown.cjs`가 있습니다. `faceKey`·`faceTone`의 직접 검사는 없습니다. 위험: 같은 사람의 얼굴이 바뀌면 사용자가 바로 알아챕니다. 표본 저장 세 개에서 모든 인물의 얼굴 키를 스냅숏으로 고정한 뒤 옮깁니다. 효과: 이름이 `export`로 고정되므로 이름을 바꾸면 빌드가 실패합니다. 다른 브랜치가 조용히 깨지는 일이 없어집니다.

**5. 저장소 층.** `ui/runtime/00_core.js`의 `SaveStore`, `meta`·`setMeta`·`slotKey`, IndexedDB 보조 저장(`sbGet`·`sbMark` 등)을 `core/save-store.mjs`로 옮깁니다. 저장소 구현은 `net.mjs`의 `store(storage)`처럼 주입합니다(`docs/design/save-storage-adapter.md`와 일치). 이때 **저장 식별자** `saveIdentity()`(슬롯·판번호 `rev`·불러오기 순번)를 함께 만들어 3단계의 응답 검사에 씁니다. 검사: `check-save*.cjs` 8개(브라우저)와 `save-transfer.test.cjs`가 있습니다. 메모리 저장소로 슬롯·용량 초과·다른 탭 충돌을 확인하는 노드 단위 검사를 추가합니다. 위험: 잘못되면 저장이 사라집니다. 그래서 마지막 순서에 두고, 키와 값은 한 글자도 바꾸지 않습니다.

1단계 완료 기준: core 내보내기 127개에서 약 200개로 늘고, 전역 선언은 150개 이상 줄며, 위 다섯 영역에 노드 단위 검사가 생깁니다.

## 4. 2단계: 도메인 창구와 소유권

**창구(facade).** 도메인마다 마지막 파일로 `src/engine/<도메인>/99_api.js`를 두고 `Engine.<도메인>`을 고정 객체로 등록합니다. contracts를 예로 들면 `Engine.contracts = Object.freeze({ demand, floor, apply, canExtend, capRoom })`입니다. 다른 도메인과 ui는 이 객체를 통해서만 부릅니다. 순서는 간선이 많은 곳부터입니다: contracts, players, staff, market, draft.

**교차 호출 금지 검사.** `tools/check-static.js`에 다음을 추가합니다.
- 파일 경로로 도메인을 정하고, 다른 도메인의 최상위 이름을 직접 쓰면 위반으로 봅니다.
- 공용 핵심은 예외입니다: `core`, `engine/runtime`, league의 기본 조회(`G`, `team`, `ovr`, `tname`, `playersOf` 등 목록으로 지정), `ui/runtime`, `ui/components`.
- 기존 위반은 `tools/xdomain-allow.json`에 (파일, 이름) 단위로 기록합니다. 새 위반은 실패시킵니다. 목록은 줄어들기만 하고 늘리려면 검토가 필요합니다(톱니바퀴 방식).
- engine→ui 참조(현재 188건)는 별도 목록으로 관리하고 0을 목표로 합니다.

**`G` 필드 소유권.** `tools/g-owners.json`에 최상위 필드별 쓰기 도메인을 적습니다(예: `fa`·`contract`→contracts, `sea.optPd`→contracts). 다른 도메인이 쓰기를 하면 처음에는 경고만 하고, 목록이 안정되면 오류로 바꿉니다. 읽기는 도메인 접근자(`ctState()` 등)로 옮겨 갑니다.

**도메인 소유권과 충돌 줄이기.**
- `src/OWNERS.json`에 도메인별 담당 작업 줄기를 적고, 한 번의 병렬 작업에서는 한 도메인에 에이전트 하나만 배정합니다.
- 충돌이 잦은 공용 파일은 도메인별로 나눕니다: `check-logic.js` → `tools/logic/<도메인>.cjs`, `40_actions.js` → 도메인별 동작 등록 파일, `75_patch_notes.js` → 판별 자료 파일, `modules.json` → 도메인 목록 조각을 빌드에서 합치는 방식.
- `index.html`(빌드 결과물)은 기능 브랜치에서 커밋하지 않고 병합 후 다시 생성합니다. 지금 가장 많이 충돌하는 파일입니다.

## 5. 3단계: 화면 상태 분리 (선택)

- **화면별 상태 객체.** 거대한 `UI` 객체를 `UI.screen.<화면>`으로 나누고, 저장을 불러오거나 바꾸면 화면 상태를 통째로 초기화합니다. 화면 상태는 저장에 들어가지 않습니다.
- **응답 검사.** 비동기 요청을 보낼 때 `saveIdentity()`를 함께 기록하고, 응답이 오면 같은지 확인한 뒤에만 반영합니다. 공용 도우미 `guardAsync(promise)`로 감쌉니다. 지금은 `.g===G` 비교(11곳)와 `curSlot` 검사(36곳)가 제각각입니다. `fetch`를 쓰는 ui 파일 7개(cup·cup 관리·래더 관리·uladder·기기 옮기기·통계 전송·장면 동작)부터 적용합니다.
- 1·2단계가 끝난 뒤 실제 사고 빈도를 보고 진행 여부를 정합니다.

## 6. 안전장치와 진척 측정

빌드 시점에 추가할 검사:

1. **교차 도메인 톱니바퀴**(2단계): 새 직접 호출과 engine→ui 참조를 금지합니다.
2. **core 순수성**: 지금의 경계 검사에 더해 `G`·`UI`·`A`·`window`·`document`·`localStorage`와 직접 `Math.random` 사용을 금지합니다.
3. **core 내보내기 고정**: `tools/core-api.txt`에 내보낸 이름 목록을 두고, 이름을 지우거나 바꾸면 실패시킵니다. 바꾸려면 호환 별칭을 남깁니다. 얼굴 함수 이름 변경 사고를 막는 장치입니다.
4. **전역 선언 증가 경고**: engine의 최상위 선언 수가 늘면 경고합니다. 새 규칙은 core로 가야 합니다.
5. **저장 호환**: 표본 저장(초기, 2시즌, 5시즌)을 불러와 정해진 시드로 30일을 진행한 뒤 상태 요약 해시를 비교합니다. 의도한 규칙 변경이 있을 때만 기준값을 갱신합니다.

진척 지표: 이번 측정에 쓴 스크립트를 `tools/modularity-report.cjs`로 정식 추가합니다. 1단계 첫 PR에 포함하고, 주 1회 아래 표를 갱신합니다.

| 지표 | 현재 | 1단계 목표 | 2단계 목표 |
|---|---:|---:|---:|
| core 내보내기 | 127 | ~200 | 계속 증가 |
| 전역 최상위 선언 | 7,172 | −150 | −500 |
| 교차 참조(`G`·`UI`·`A` 제외) | 32,681 | 측정만 | −30% |
| engine→ui 참조 | 188 | <100 | 0 |
| contracts→market·players | 485 | <200 | 창구 경유만 |
| 허용 목록 항목 수 | 해당 없음 | 기준 고정 | 감소만 |

## 결정할 사항

1. 1단계 순서(0→5)와 계약 금액 계산을 가장 큰 목표로 삼는 것을 승인할지 결정해 주십시오.
2. 기능 브랜치에서 `index.html`을 커밋하지 않도록 바꿀지 결정해 주십시오. 충돌이 가장 빨리 줄어드는 조치입니다.
3. 2단계 교차 호출 검사를 경고로 시작할지, 처음부터 실패로 둘지(기존 위반은 허용 목록으로 처리) 결정해 주십시오.
