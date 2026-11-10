# 표 안 반별 겹침·잘림 재검증

제보의 소속·종합·잠재력·기록 표와 같은 실제 `findTable()`을 Chromium에서 실행했다. 기존 프로필 수정 이후에는 회색 별과 금색 별의 글꼴·텍스트 원점이 같지만, 공통 `.pst`가 `line-height:1`이어서 12px 박스 안에 높이 17px인 별 글리프가 놓였다. 회색은 박스 밖까지 그려지는 반면 금색 층은 `overflow:hidden`으로 위 3px·아래 2px가 잘려 두 별이 어긋나 겹친 것처럼 보였다. 요소 원점만 비교하던 기존 검사로는 글리프 자체가 잘리는 문제를 잡지 못했다.

소스 수정은 `src/css/players/22_full_player_profile.css`의 기존 별 전용 `.pst` 규칙에 `line-height:1.5`를 지정한 한 속성과 설명 주석뿐이다. 금색 층의 기존 글꼴 상속·원점·너비·반별 클리핑 방식은 유지하고, 두 층 모두 별 글리프가 들어갈 줄 높이를 확보했다. `58_pot_tier.js` 및 다른 JS/CSS는 변경하지 않았다.

새 검사 `tools/check-rating-stars-tables.cjs`는 1366×768, 768×1024, 390×664, 568×320에서 실제 다구단 검색표와 별 0~5개를 0.5개 간격으로 검사한다. Arial/Georgia/monospace와 11/13/17px 확대 글자 조합 99개씩을 사용한다. DOM 요소 위치 외에 Range로 측정한 실제 회색/금색 글리프의 원점·높이·너비, 채움 비율, 금색의 위아래 잘림을 확인한다. 기존 데스크톱/모바일 선수 상세 현재 별의 가시성·원점·높이·가로 넘침도 검사한다. 앱 비동기 렌더가 검사표를 교체하지 않도록 실제 표 렌더 함수의 출력을 동일 CSS 문맥의 별도 검사 호스트에 둔다.

```sh
RATING_STARS_CSS=/tmp/rating-stars-profile-before.css REVIEW_OUT=/tmp/rating-stars-before node tools/check-rating-stars-tables.cjs --expect-clipping
REVIEW_OUT=/tmp/rating-stars-after node tools/check-rating-stars-tables.cjs
```

수정 전 규칙은 실제 글리프 클리핑을 재현하고, 수정 후 규칙은 4개 화면 모두 클리핑 없이 통과했다. 검사기는 현재 소스에서 별 전용 CSS 블록만 기존 게임 HTML에 주입하므로 디스크 빌드 없이 검증할 수 있다. 기존 프로필 별 검사 파일과 이전 수정은 유지했다. Chromium은 환경의 소켓 제한 때문에 승인된 `require_escalated` 실행 경로를 사용했다.

전후 스크린샷과 결과 JSON은 `/tmp/rating-stars-before`, `/tmp/rating-stars-after`에 저장했다. Google Fonts는 네트워크 없이 검사했고, 글자 확대는 표의 11→17px 크기 조합으로 확인했다. 정식 통합 HTML의 생성은 상위 작업자에게 맡겼다.
