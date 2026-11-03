# 3D 경기장과 선수

출처: [Taylor Beeston / Claudeball](https://github.com/TaylorBeeston/claudeball), 커밋 `424b1b512fd34a28d5078c9f644988b64e67b4ec`.

원작 README는 자체 코드·모델·애니메이션을 MIT 라이선스로 명시한다. [저작권 및 MIT 전문](LICENSE.txt)을 유지한다. 외부 HDRI와 음원은 가져오지 않았다.

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
