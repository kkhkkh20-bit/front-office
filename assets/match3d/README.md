# 3D 경기장과 선수

출처: [Taylor Beeston / Claudeball](https://github.com/TaylorBeeston/claudeball), 커밋 `424b1b512fd34a28d5078c9f644988b64e67b4ec`.

원작 README는 자체 코드·모델·애니메이션을 MIT 라이선스로 명시한다. [저작권 및 MIT 전문](LICENSE.txt)을 유지한다. 외부 HDRI와 음원은 가져오지 않았다.

출처 확인(2026-11-09, 같은 커밋의 `assets/CREDITS.md`, `assets/README.md`, `assets/src/*.py`): 애니메이션 클립은 원작자가 Blender 파이썬 스크립트(`assets/src/player_anim.py`, `player_clips.py`)로 직접 키프레임을 만든 것이고 Mixamo 애니메이션이 아니다. 골격 이름 `mixamorig:*`는 이름 규칙만 따른 것이다. 기본 인체 메시·머리카락·눈·피부 텍스처는 MakeHuman/MPFB2 에셋(CC0 1.0), 재질 텍스처는 ambientCG(CC0 1.0)다.

| 로컬 | 원본 |
| --- | --- |
| field.glb | assets/optimized/field.glb |
| stadium.glb | assets/optimized/stadium.glb |
| player.glb | assets/optimized/players_1k/player_base.glb |
| bat.glb, ball.glb | assets/optimized/의 같은 이름 |
| gear_defaults.json | assets/optimized/players/gear_defaults.json |
| animation-events.json | assets/players/player_manifest.json의 clips.events_s를 추출 |
| field-look.ts | src/engine/fieldLook.ts |

`src/scene3d/scene.mjs`가 모델·구장 재질을 렌더링하고 기존 중계의 선수·주자·공 이동과 연결한다. `tools/build-match3d.cjs`가 Three.js, Meshopt, Basis 디코더와 모델을 HTML에 포함한다. 런타임 CDN이나 모델 서버가 필요하지 않는다. HTML 크기는 약 34 MB다.

현재 중계에 필요한 역할은 투수·타자·포수·수비수·주자이며, 추가 감독·심판 모델이나 원작 시뮬레이션 코드는 가져오지 않았다. 경기 결과·투구 기록은 기존 게임 엔진이 결정한다. 기록에 없는 타구 좌표와 움직임은 중계 연출이다.

기본 카메라는 타자 뒤, 타격 후에는 같은 위치에서 타구 방향을 바라본다. `ResizeObserver`로 카메라 종횡비를 갱신하며 이미지를 늘려 맞추지 않는다. 모바일은 그림자를 끄고 픽셀 비율을 제한한다. 정지 장면은 매 프레임 다시 그리지 않는다. WebGL 실패 시 기존 2D 중계로 돌아간다.

검사: `CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium CAPTURE=1 node tools/check-match3d.cjs`

타격 모델 방향은 원본 에셋의 좌표 규칙을 따른다. 모델의 기본 정면은 +Z이고 타격 자세는 왼쪽 어깨 너머로 투수를 본다. 따라서 +X의 우타자는 Y 회전 -90도, -X의 좌타자는 모델 X 반사와 Y 회전 +90도를 적용해야 둘 다 +Z의 마운드를 바라본다. 모델을 단순히 정면에 세우면 머리와 스윙 방향이 옆으로 틀어진다. 방향·릴리스·카메라 검사는 `node tools/check-match3d-review.cjs`로 실행한다.

중계 어댑터는 `scene.mjs`(장면), `motion.mjs`(애니메이션), `labels.mjs`(이름표), `scoreboard.mjs`(전광판)로 나뉜다. 투수는 좌우 측면 준비 자세에서 포수를 보며 오버핸드·스리쿼터·사이드암·언더핸드를 구분하고, 주자 상황에서는 세트 동작을 사용한다. 포구·송구·스윙은 클립 이벤트 시각에 연결한다. 전광판은 모델 UV에 맞춰 `CanvasTexture.flipY=false`를 사용한다.

사이트 배포는 `tools/build-site.cjs`로 모델을 같은 출처의 내용 해시 파일로 나누며, 단일 HTML 다운로드 빌드는 그대로 유지한다. 첫 진입은 준비 화면을 표시하고, 모델 병렬 해석과 셰이더 준비가 끝난 뒤 3D 화면을 공개한다. `tools/check-gameplay.cjs`에서 실제 경기 기록을 재생하여 수비·착지·전광판·좌우 투구폼을 검사한다.

11월 3일 동작/처리량 보완: `player.glb`는 같은 원본을 glTF-Transform 4.2.1의 `simplify --ratio 0.35 --error 0.003`와 `meshopt`로 경량화했다. 118개 애니메이션과 스킨을 유지하며 원본은 위 고정 커밋에서 받을 수 있다. 모델 파일은 약 9.01 MB에서 7.11 MB로 줄었다. 구장·관중 모델의 배치와 수는 유지하고, 화면 밖 관중·좌석 인스턴스만 넓힌 시야 범위로 생략한다.

원본 `pitcher_set` 자체에 몸을 옆으로 세운 자세와 정면을 보는 머리 방향이 들어 있다. 투구 루트는 홈 방향으로 고정하고 클립의 골반·어깨 회전을 그대로 쓴다. 준비 자세를 만들기 위해 루트를 추가로 90도 돌리면 목과 투구폼이 틀어진다.
