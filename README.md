# 프런트타임 (Front Time)

**내 팀을 꾸리고, 키우고, 지켜라.** 가상 한국 프로야구 리그의 단장이 되어 구단을 운영하는 한국어 브라우저 게임입니다. 경기는 감독이 합니다. 단장은 선수를 뽑고(드래프트), 사고팔고(트레이드), 붙잡고(FA·계약), 키웁니다(육성).

- **꾸린다**: 창단 드래프트(능력치는 숨겨져 있고 기록·스카우트 눈·데이터로 판단), 성향이 다른 AI 단장과 트레이드, 에이전트와 FA 협상, 샐러리캡·경쟁균형세·FA 등급과 보상선수·외국인 한도 등 KBO식 제도
- **키운다**: 훈련 방향, 2군 출전, 포지션 전환, 선발 수업, 해외 연수. 내가 데려온 선수가 자란 순간은 소식과 '내가 꾸린 팀' 화면으로 돌아온다
- **관리한다**: 모든 일이 소식함으로 온다(스페이스바로 읽고 진행). 감독은 기용 권한을 갖고 단장은 건의·약속·경질을 한다. 인터뷰·미디어데이·기사·팬 게시판으로 여론이 움직이고, 구단주 신뢰가 바닥나면 단장도 경질된다
- 단장 이름·얼굴·출신을 직접 정하고, 행동이 쌓여 단장 스타일과 별명이 붙는다. 사임하고 다른 구단으로 옮길 수도 있다

구단, 선수, 단장, 감독은 모두 가상입니다. 설치 없이 HTML 파일 하나로 실행되고, 진행 상황은 브라우저에 자동 저장됩니다.

## 실행

`index.html`을 브라우저로 열면 됩니다. 3D 경기장·선수·디코더를 포함해 파일 크기는 약 34 MB입니다. 모델의 출처와 사용 조건은 [3D 에셋 안내](assets/match3d/README.md)에 정리했습니다. 글꼴은 Google Fonts에서 불러오므로, 인터넷이 없으면 기본 글꼴로 표시됩니다.

## 구조

공용 계산은 `src/core/`의 자바스크립트 모듈로, 게임과 화면 코드는 기능별 폴더로 나뉩니다. `src/modules.json`이 전체 입력과 로딩 순서를 관리합니다. `build.sh`는 공용 모듈을 번들로 만들고 기존 게임·화면 코드를 결합해 단일 `index.html`을 생성합니다.

| 경로 | 내용 |
| --- | --- |
| `src/core/` | 상태와 독립적인 수학·난수·능력 척도·UTC 날짜 모듈 |
| `src/engine/` | `league`, `players`, `matches`, `progression`, `contracts`, `draft`, `market`, `career`, `staff`, `development`, `finance`, `media`, `runtime` 도메인 |
| `src/ui/` | 기능별 화면, 공용 `components`, `shell`, `actions`, `runtime`, 데이터 `assets` |
| `src/css/` | 기능별 스타일. 적용 순서는 소스 목록에 명시 |
| `src/gfx/` | 경기 중계와 시설 그림 |
| `src/scene3d/`, `assets/match3d/` | 타자 뒤 시점의 3D 중계·원본 모델·사용 고지 |
| `src/html/`, `vendor/` | 문서 틀과 포함 배포하는 외부 라이브러리 |
| `src/modules.json` | 전체 소스·공용 진입점·동작/결재/부팅 순서 |
| `tools/build.cjs`, `tools/lib/sources.cjs` | 공용 소스 목록 검증과 번들 생성 |
| `index.html`, `dist/engine.js` | 배포 HTML과 엔진 검사 결과물 |

게임·화면 전역 호출은 호환 계층으로 유지됩니다. 전체 게임의 전역 상태를 제거한 구조는 아닙니다. 모듈 경계와 다음 기능을 분리하는 방법은 [구조 문서](docs/architecture.md)를 참고하세요.

### 지켜야 할 규칙 (점검 도구가 확인합니다)

1. **호환 스크립트에서 같은 전역 이름을 두 번 선언하지 않는다.** 엔진과 화면은 전역을 함께 써서, 나중 선언이 앞 선언을 조용히 덮어씁니다. 일부러 덮어쓸 때만 `tools/dup-allow.txt`에 적습니다.
2. **파일 맨 위에서 바로 실행되는 코드는 소스 목록에서 뒤에 오는 파일의 상수(`const`)를 쓰지 않는다.** 저장 불러오기와 첫 화면 그리기는 `src/ui/runtime/99_boot.js`(가장 뒤)에서만 합니다. 동작 표 `A`는 `actions/40_actions.js`에서 만들어지므로 `Object.assign(A, …)`은 소스 목록에서 그 뒤 파일에만 둡니다. 새 파일은 `src/modules.json`에 등록해야 하며, 누락·중복·부팅 순서 위반은 빌드가 거절합니다.

## 빌드와 점검

```bash
cd tools && npm ci && npx playwright install chromium && cd ..   # 처음 한 번
bash build.sh              # index.html, dist/engine.js 만들기
node --test tools/test/*.test.cjs   # 모듈 경계·순수 계산·빌드 계약
bash tools/check.sh        # 전체 점검
QUICK=1 bash tools/check.sh   # 빠른 점검
```

화면 검사는 실행 중에만 로컬 HTTP 서버를 직접 열고 종료하므로 별도 서버가 필요 없습니다. 시스템 Chromium을 쓰는 환경은 `CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium bash tools/check.sh`로 실행할 수 있습니다. 변수를 지정하지 않으면 Playwright가 설치한 Chromium을 사용합니다.

| 점검 | 파일 | 찾는 것 |
| --- | --- | --- |
| 모듈·빌드 | `tools/test/modules.test.cjs` | 소스 누락·중복·경계·순환 참조, 부팅 순서, 결정적 빌드와 순수 계산 |
| 문법 | `check.sh` | 빌드된 스크립트의 문법 오류 |
| 정적 점검 | `tools/check-static.js` | 이름 충돌, 초기화 전 사용(첫 화면이 비는 종류의 오류) |
| 규칙 점검 | `tools/check-logic.js` | 오류 없이 결과만 틀린 버그(리뷰에서 나온 버그를 시나리오로 고정) |
| 장기 시뮬 | `tools/check-sim.js` | 여러 시즌을 돌리며 예외, 빈 `catch`가 삼킨 숨은 오류, NaN·음수 연봉, 진행 멈춤, 불변식(경기마다 투수 아웃=이닝×3·득점·안타·볼넷 합계·타점·자책·승패, 하루마다 나이·계약 조건 정리·입대일·외국인 수·로스터·1군 엔트리 한도). `ACT=1`이면 트레이드·이직·영입·방출·FA·외국인 교체·감독 교체를 직접 해 보며 상태 전환 경로를 돈다 |
| 화면 점검 | `tools/check-ui.js` | 브라우저로 첫 화면·새 게임·모든 메뉴와 안쪽 탭·선수 정보·사람 카드·협상 창·스페이스바 진행을 시즌 준비/시즌 중/FA/야인 시점에서 열고, 버튼을 무작위로 눌러 예외·콘솔 오류·숨은 오류·빈 화면을 찾음 |

GitHub에 올리면 `.github/workflows/check.yml`이 빠른 점검을 자동으로 돌립니다. 고친 뒤 커밋·배포 전에는 `bash tools/check.sh`가 통과해야 합니다.

## 배포

- **Cloudflare**: `wrangler.jsonc`의 build.command가 `tools/build-site.cjs`를 실행하고 `site/`를 배포합니다. 사이트 HTML은 약 7.1 MB이며, 경기장·선수 모델은 파일당 25 MiB 이하의 별도 파일로 제공합니다. 모델은 경기 화면에서 불러오고 주소에는 내용 해시를 붙입니다. `index.html`만 복사하면 단독 다운로드용 34 MB 파일이 Cloudflare 파일 한도를 넘으므로 이 빌드 단계를 생략하면 안 됩니다. 배포 버전은 `/release.json`으로 확인합니다. `node tools/check-site.cjs`가 실제 배포 구성을 브라우저에서 검사합니다.

- **itch.io**: `index.html`을 zip으로 묶어 올리고(Kind of project: HTML) "This file will be played in the browser"를 켭니다. 화면 1280×800, Mobile friendly, Fullscreen button. 화면이 800px보다 길어서 **Enable scrollbars를 반드시 켭니다**(끄면 아래가 잘리고 스크롤이 안 됨). 저장은 플레이어 브라우저의 localStorage(`danjang-*`)에 남아 파일을 다시 올려도 이어집니다.
- **플레이 기록(기본으로 켜짐)**: `src/ui/runtime/72_telemetry.js`의 `TELE.ga`에 GA4 측정 ID(`G-78C5MN0LHM`)가 들어 있어, 웹 배포판(Cloudflare, itch 등)에서는 플레이어가 끄기 전까지 Google Analytics로 플레이 기록을 보냅니다. 보내는 것: 기기마다 무작위로 만든 번호(`dsj_uid`, GA `user_id`), 시작 퍼널과 몇 년 차까지 했는지, 화면 이동과 머문 시간, 기능 사용(트레이드·FA 금액 같은 게임 수치 포함), 게임 날짜·구단 번호, 오류 메시지 앞 200자와 위치, 세션 길이. GA 스크립트는 `_ga` 쿠키와 IP·브라우저 정보를 Google로 보냅니다. 이름·얼굴·저장 내용은 보내지 않습니다. `file://`, localhost, 자동화 브라우저에서는 보내지 않습니다. 플레이어는 처음 화면 설정과 게임 설정의 '플레이 기록' 카드에서 끌 수 있습니다. `TELE.ph`(PostHog 키)는 비어 있어 PostHog는 쓰지 않습니다. 넣으면 화면 녹화가 기본으로 켜지니 따로 고지와 동의를 정해야 합니다. 개인정보 처리방침 초안: [docs/privacy.md](docs/privacy.md).

## 크레딧

외부 자료와 라이선스는 [CREDITS.md](CREDITS.md)에 정리했습니다. 라이선스 전문은 [docs/licenses/](docs/licenses/)에 있고, 빌드할 때 `index.html`에 함께 실려 게임 크레딧의 '라이선스 전문 보기'로 열 수 있습니다(사이트판은 `licenses/*.txt`).

이 게임은 가상의 프로야구 단장 시뮬레이션입니다. KBO(한국야구위원회)와 KBO 리그 구단, 실제 선수·스폰서와 관련이 없으며 승인이나 후원을 받지 않았습니다.
