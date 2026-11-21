# 해외 카드와 화면 설명 정리

- 해외 후보군·세계 주목 선수의 이름에서 선수 카드를 연다. 공개 기록과 기존 스카우트 추정·관찰·문의 조건을 사용한다.
- 해외 구단 카드는 시즌 성적·보관된 우승 기록·확인된 선수·MLB/트리플A 연계를 보여 준다. 과거 구단 성적이 없으면 선택한 연도를 유지하고 미보관 상태를 알린다.
- 선수와 구단 사이를 이동한 뒤 뒤로 가기로 직전 카드와 목록에 복귀한다.
- 의료·연수·출장·행사 장식 사진은 기본으로 숨긴다. 설정의 표시 탭에서 다시 켠다. 선수 얼굴·구단 로고·경기 그래픽은 유지한다.
- 22개 UI 소스의 설명 51개를 다듬었다. 숫자·기한·비용·조건을 보존하고 반복 설명을 줄였다. 참고: https://github.com/byungjunjang/slop-rewrite
- 날짜 진행 검사는 짧게 표시되는 패널을 브라우저 통신 사이에 놓치지 않도록, 실제 표시 프레임에서 크기와 위치를 기록한다. 게임의 표시 시간은 변경하지 않았다.

## 검증 범위

main의 기존 수정과 합친 상태에서 빌드·정적·모듈 검사 및 변경 기능과 관련 화면의 회귀 검사를 수행했다.

- `bash build.sh`
- `NODE_PATH=tools/node_modules node tools/check-static.js`
- `NODE_PATH=tools/node_modules node --test tools/test/*.test.cjs`
- `tools/check-overseas-cards-ui.cjs`: PC·태블릿·휴대폰, 실제 목록 클릭·뒤로 이동·과거 시즌·미확인 선수 제외·관찰·사진 설정
- `tools/check-operations-art.cjs`: 사진을 켠 연수·의료 화면, 신청·환급·이미지 누락 대응
- `tools/check-ovs-hub-1121.cjs`: 리그별 순위·선수·기록·역대 화면
- `tools/check-continue.cjs`: 날짜 진행 표시와 기존 확인 동작
- `tools/check-critical-warn-1121.cjs`: 병합한 방출 경고와 취소 동작
- `tools/check-management-ui-reference-1121.cjs`: 병합한 계약창 닫기·의료 회복·일정 표시
- `tools/check-site.cjs`: 배포 파일·3D 지연 로드·실패 후 재시도

로컬의 전체 게임 규칙 검사는 사용자 요청에 따라 중단했다. 관련 검사 통과를 전체 CI 통과로 표현하지 않는다. 게임 엔진과 배포 워크플로는 이번 수정에서 변경하지 않았다.
