# 중계 화면 개선 비교안

검토용이며 병합·배포하지 않았습니다. [화면 비교](preview.html) · [PC 기존](previews/pc-before.png) · [PC 개선](previews/pc-after.png) · [상세 기록](previews/pc-detail.png)

## 변경

- PC 마우스 환경의 3D 중계 선수 카드: 기본 높이 264 → 92px. 투수 경고가 있으면 128px. 마우스 또는 키보드 포커스로 기존 상세 카드가 펼쳐집니다. 터치 PC와 모바일 카드 방식은 유지합니다.
- 작은 화면의 투구 공: 화면 투영 크기 2.75 CSS px를 목표로 보정합니다. 기존 크기 1.45배보다 작아지지 않고 최대 2.4배로 제한하므로 먼 공이 항상 2.75px가 되는 것은 아닙니다. 실제 390px 세로 장면에서 투구 초반 1.43 → 2.37px, 중간 2.14 → 2.75px였습니다.
- 추가 설명·버튼은 없습니다. 경기 엔진·저장 구조·난수·카메라·투구 이동과 시간은 변경하지 않았습니다.

## 파일과 영향

| 파일 | 내용 / 영향 |
| --- | --- |
| `src/css/matches/26_match_3d.css` | PC 카드 접기·상세·투수 경고 배치 |
| `src/scene3d/visibility.mjs` | 화면 투영 크기의 순수 계산 |
| `src/scene3d/scene.mjs` | 투구 시각 크기에만 계산 적용, 기존 프레임의 화면 크기 조회 재사용 |
| `index.html` | 소스 재빌드 |
| `tools/check-broadcast-{ball,hud,pitch}-1121.cjs`, `tools/check.sh` | 독립 재현·회귀 검사와 공통 점검 연결 |

기존 선수 정보 클릭·카드 숨기기·얼굴 시트 늦은 갱신·재생/배속·3D 해제에 영향이 가능한 변경입니다. 이 경로를 별도 확인했습니다.

## 확인 결과

- 수정 전 공 크기 3개, PC 기본 카드 2개 재현 검사 실패 → 수정 후 통과. [수정 전](checks/ball-before.log) / [수정 후](checks/ball-after.log), [카드 수정 전](checks/hud-before.log) / [수정 후](checks/hud-final.log).
- 빌드 2종 및 정적 검사 통과. 엔진 산출물은 기준과 바이트 단위 동일합니다. [동일성](checks/engine-parity.log).
- PC 1440·1280, 모바일 390 세로·844 가로의 실제 Chromium 렌더링 통과. 카드 상세·투수 경고·선수 정보 복귀·숨김·경기 상태 불변과 페이지 오류를 확인했습니다.
- 좌/우 투수 × PC/모바일 × 4시점, 실제 WebGL 투구 16장면 통과. [결과](checks/pitch-after-clock-final.log). 기존과 같은 시간의 공 좌표·출발/도착·카메라·FOV가 일치합니다. [수치 비교](checks/pitch-comparison.log).
- 기존 모션·구종·시야 순수 검사 10/10, 중계 정보 626타석, 3D 상태·공 연결·메모리 검사 통과. [순수 검사](checks/scene-units.log), [중계 정보](checks/cast-info.log), [3D 상태](checks/3d-state.log).
- 기존 휴대폰 2D/3D 세로·가로 상황판 20장면, PC/모바일 얼굴 지연 로딩·재생 유지 검사 통과. [상황판](checks/portrait-hud.log), [얼굴](checks/face-redraw.log).
- `QUICK=1 bash tools/check.sh` 실행 중. 종료 결과가 나오지 않았으므로 통과로 보고하지 않습니다.
- 이 브랜치 전체 점검·장기 시즌 시뮬레이션은 미실행. 실제 휴대폰의 장시간 FPS·발열도 미검증입니다.

## 반영 조건과 남은 위험

브랜치 `codex/broadcast-polish-1121`. 최신 main `83de5da9`에서 시작해 구장 PR #326의 고정 HEAD `7eee4e18`을 비교 기준으로 포함했습니다. #326 이후 이 브랜치의 변경만 적용할 수 있도록 최신 main을 다시 반영해야 합니다. 거절된 UI PR #328의 변경은 포함하지 않았습니다.

#326의 GitHub 규칙 검사는 16/16 성공, browser-and-sim 및 최종 check는 실패 상태입니다. 트레이드 매물 비교와 스카우트 #77 실패가 확인됐으며 이 작업에서는 관련 없는 로직이나 검사를 고치지 않았습니다. 이 브랜치의 GitHub 검사도 별도 완료가 필요합니다. 기존 실패나 미완료 검사를 무시하고 병합하지 않습니다.

현재 단계는 비교안입니다. 새 시안 승인과 필요한 검사 완료 전 병합·배포하지 않습니다.
