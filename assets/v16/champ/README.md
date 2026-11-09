# v16 — 우승 연출 기본22종

리뷰 브랜치 `assets/v16-review`, 루트 `assets/v16/champ/`. main 병합과 게임 코드·빌드·검사 코드 변경 없음.

우승 순간6장(밤4·낮2), 트로피 세리머니4장, 축승회/샴페인3장, 퍼레이드3장, 트로피/반지3종, 배너3장입니다. 장면은1600×900WebP, 배너는1600×400WebP. 모든 장면·배너를700,000bytes이하로 맞췄습니다. 트로피3종은1024×1024WebP와 **진짜 알파가 있는 투명PNG**를 함께 제공합니다.

이번은 요청서의 **기본22종** 납품입니다. 유니폼은 중립 흰색+남색 한 가지 포인트로 통일했습니다. 선택사항인 A/B 6색 변형은 이번 기본판에 포함하지 않았습니다.

## 연결

`manifest.json`의 각 항목은 `id`, `group`, `color`, `night`, `w`, `h`, `file.path`를 제공합니다. 모든 path는 `path_base`인 `assets/v16/champ/` 기준입니다. 장면은 각각의 개별파일이며 런타임 시트로 합치지 않았습니다.

- 우승 카드: `banner/`에서 배경을 골라 사용. 왼쪽40%는 어두운 글자 여백이며 글자를 그림에 넣지 않았습니다. `text_safe_rect`=[0,0,640,400].
- 우승 화면: `moment/`→`ceremony/`→`party/`→`parade/` 흐름으로 연결할 수 있습니다.
- 진열장: `trophy/`1024WebP/투명PNG 사용. 시리즈/정규시즌 트로피와 반지 모두 독자적인 가상 디자인입니다.
- 한 파일 앱에는 `app_inline_files`의 작은128WebP3장만 넣는 선택지를 제공합니다.256작은판도 함께 있습니다.1024PNG/WebP·장면·검수판은 사이트용 별도파일로 두세요.

## 검수

상태: **ASSET_VALIDATION_PASSED_GAME_REVIEW_PENDING**.

이미지를 실제 디코딩해 RGB/RGBA·크기·용량·해시·알파를 확인했습니다.1024트로피WebP와PNG의 RGBA픽셀이 정확히 같습니다. 실제 구단/기업/학교 로고·글자, 뚜렷한 실존 인물 연상을 배제하도록 생성했고 육안 확인했습니다. 인물은 작은 얼굴·뒷모습·옆모습, 감정은 포옹·점프·팔 들기 등의 몸짓으로 표현했습니다. 전수 실존인물 비교나 게임 내 연결 테스트를 수행한 것은 아닙니다.

`previews/`에 묶음별 비교판이 있습니다. 트로피 비교판의 체크무늬는 알파 확인용 검수 배경일 뿐 실제PNG/WebP에 들어있지 않습니다.

기본22WebP합계 11,344,626bytes. 앱용128트로피3장합계 49,388bytes.

## 기본파일 목록

| id | group | 크기 | bytes | 경로 |
|---|---|---|---:|---|
| moment_01_final_out | moment | 1600×900 | 548290 | `moment/moment_01_final_out.webp` |
| moment_02_battery_hug | moment | 1600×900 | 403406 | `moment/moment_02_battery_hug.webp` |
| moment_03_dugout_rush | moment | 1600×900 | 506640 | `moment/moment_03_dugout_rush.webp` |
| moment_04_stands_confetti | moment | 1600×900 | 668814 | `moment/moment_04_stands_confetti.webp` |
| moment_05_day_mound | moment | 1600×900 | 596422 | `moment/moment_05_day_mound.webp` |
| moment_06_day_dugout | moment | 1600×900 | 547246 | `moment/moment_06_day_dugout.webp` |
| ceremony_01_lift | ceremony | 1600×900 | 505582 | `ceremony/ceremony_01_lift.webp` |
| ceremony_02_captain_kiss | ceremony | 1600×900 | 336104 | `ceremony/ceremony_02_captain_kiss.webp` |
| ceremony_03_manager_toss | ceremony | 1600×900 | 494254 | `ceremony/ceremony_03_manager_toss.webp` |
| ceremony_04_team_photo | ceremony | 1600×900 | 546646 | `ceremony/ceremony_04_team_photo.webp` |
| party_01_champagne | party | 1600×900 | 632384 | `party/party_01_champagne.webp` |
| party_02_goggles | party | 1600×900 | 493022 | `party/party_02_goggles.webp` |
| party_03_front_office | party | 1600×900 | 250988 | `party/party_03_front_office.webp` |
| parade_01_open_bus | parade | 1600×900 | 631402 | `parade/parade_01_open_bus.webp` |
| parade_02_city_square | parade | 1600×900 | 682624 | `parade/parade_02_city_square.webp` |
| parade_03_confetti | parade | 1600×900 | 618766 | `parade/parade_03_confetti.webp` |
| trophy_series | trophy | 1024×1024 | 411764 | `trophy/trophy_series.webp` |
| trophy_season | trophy | 1024×1024 | 874546 | `trophy/trophy_season.webp` |
| trophy_ring | trophy | 1024×1024 | 957398 | `trophy/trophy_ring.webp` |
| banner_01 | banner | 1600×400 | 240564 | `banner/banner_01.webp` |
| banner_02 | banner | 1600×400 | 200376 | `banner/banner_02.webp` |
| banner_03 | banner | 1600×400 | 197388 | `banner/banner_03.webp` |
