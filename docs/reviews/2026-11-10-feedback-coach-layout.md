# 코치 카드 내부 잘림 회귀

사용자가 보는 실제 화면을 기준으로 `/tmp/feedback-6395-ui/390-pending-coach.png`를 확인했다. 문서 전체 가로 넘침 검사는 통과했지만 미래 합류 코치 카드의 오른쪽과 합류 안내가 보이지 않았고, 능력치 100이 10/0으로 갈라졌다.

원인은 공통 9행 subgrid에 합류 전 안내가 열 번째 직접 자식으로 추가되면서 생긴 암시적 열이었다. 기존 거절 쿨다운 안내와 자유계약 후보의 특성 설명도 같은 경계를 넘을 수 있었다. 별도로 합류 전 안내 `p.small.muted`는 일반 도움말 분류 `markHints`에 의해 기본 설정에서 숨었다.

수정은 코치 카드에 한정했다.

- 합류 전·거절 쿨다운 안내를 기존 영입 조작 행에 묶고, 후보 특성 설명을 기존 경력 설명 행 안에 넣었다. PC의 9행 subgrid 정렬을 유지한다.
- 카드 열을 `minmax(0,1fr)`로 정하고 능력 줄의 상태 문구는 줄바꿈한다. 숫자 칩과 지표 이름은 축소·자릿수 줄바꿈을 막는다.
- 계약 가능 여부를 설명하는 상태 안내와 후보 특성에 `keep`를 붙여 도움말을 꺼도 읽을 수 있게 했다.

`tools/check-feedback-coach-layout-6395.cjs`는 1366×768, 768×844, 390×844에서 다음을 검사한다.

- 미래 합류 100/100 코치와 거절 쿨다운이 동시에 있는 카드의 직접 자식·실제 텍스트 Range가 카드 가로 경계를 넘지 않는지 확인.
- 문서 폭과 별개로 카드 자체 `scrollWidth/clientWidth` 검사. 능력치 100의 실제 텍스트가 단일 행인지 확인.
- 기본 도움말 off에서도 합류 안내의 실제 텍스트 높이가 있고 화면에서 읽히는지 확인.
- PC 인접 카드의 이름·능력·설명·영입 버튼 행이 정렬되는지 확인.
- 실제 모바일 검색·필터 summary를 열고 자유계약 후보 → 카드 보기 버튼을 눌러, 특성 설명이 있는 자유 후보도 같은 경계를 지키는지 확인.

최종 검사는 root가 빌드한 `index.html`을 읽어 실행한다. 검사 도구는 배포 HTML을 쓰지 않는다.

```sh
COACH_LAYOUT_HTML=/workspace/front-office/index.html node tools/check-feedback-coach-layout-6395.cjs
```

증거: `/tmp/feedback-coach-layout-6395.log`, `/tmp/feedback-coach-layout-6395/results.json`, 같은 디렉터리의 `*-pending-top.png`, `*-pending-explanation.png`, `*-pending-cooldown.png`, `*-free-candidate-kind.png`.

변경 파일: `src/ui/staff/34_staff.js`, `src/css/foundation/30_design_system.css`, 신규 검사와 본 문서. 엔진 변경은 없다. 기존 `tools/check-feedback-ui-6395.cjs`는 수정하지 않았다.
