# 제작 레퍼런스와 원본

## 국가대표 인상

요청서 `docs/asset-requests/2026-11-05-codex-v5c-korea-kit.md`에 정리된 2023/2026 WBC 조사 내용을 텍스트 디자인 기준으로 사용했습니다. 남색 원정 상의의 흰색 필기체 Korea, 흰 홈 상의의 남색 필기체와 빨간 포인트, 남색 모자의 흰색 K라는 구성을 반영했습니다. 이 작업에서 SportsLogos/AOL의 실제 대표팀 로고 이미지를 내려받거나 보관·비교판에 넣지 않았습니다. 해당 사이트의 로고 파일을 새 도형의 입력으로 쓰지도 않았습니다.

`source/k_home.svg`, `k_away.svg`, `korea_wordmark_home.svg`, `korea_wordmark_away.svg`는 이 작업에서 새로 작성한 베지어 글씨입니다. 제품 사진의 자수 글씨는 이 자체 레터링 가이드를 입력해 제작했습니다. 모자·얼굴용 K는 동일한 자체 도형을 네이티브 자수로 렌더링했습니다.

## 태극기

정확한 국기 도형은 공개 국가별 국기 자료의 대한민국 SVG를 사용했습니다.

- 원본: https://raw.githubusercontent.com/hampusborgos/country-flags/main/svg/kr.svg
- 출처 설명: https://github.com/hampusborgos/country-flags#readme
- 확인일: 2026-11-05
- 저장 파일: `source/taegeukgi.svg`
- 출처 README 설명: “The source files were taken from Wikimedia Commons … The flags are not under copyright protection since flags are in public domain”.

viewBox는 72×48(3:2), 태극 색은 #CD2E3A/#0047A0입니다. 좌상 건(세 줄 모두 온전함), 우상 감(바깥 두 줄 끊김), 좌하 리(가운데 줄 끊김), 우하 곤(세 줄 모두 끊김)의 위치를 확인했습니다. 생성된 국기 근사치를 제거한 원단에 이 SVG를 투영해 사용합니다. 실제 구단·연맹 로고는 포함하지 않습니다.
