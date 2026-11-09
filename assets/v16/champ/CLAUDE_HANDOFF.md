# Claude handoff — v16 championship

리뷰 브랜치 `assets/v16-review`. 경로 `assets/v16/champ/`. main 병합·게임 코드 수정 없음.

요청서 기본22종을 완성했습니다.6색 A/B변형은 선택사항으로 이번 기본판에는 포함하지 않았습니다. 중립 흰색 홈 유니폼+남색 포인트 한 색입니다.

`manifest.json`의 `assets[]`를 읽으세요. `group`=moment/ceremony/party/parade/trophy/banner, `color`=navy(트로피는null), `night`=bool, `w/h`, `file.path`. 경로는 `assets/v16/champ/` 기준입니다. 장면/배너는 사이트용 개별파일입니다.

우승 카드에는1600×400배너를 배경으로,1024또는256트로피를 전면에 크게 배치할 수 있습니다. 배너 왼쪽40%(rect[0,0,640,400])를 어둡게 비웠고 글자는 굽지 않았습니다. 우승 순간 전용 연출은 A→B→C→D순서, 진열장은 E를 사용하세요. 이 게임 연결 코드는 구현하지 않았습니다.

트로피3종은1024WebP+투명PNG,128/256작은WebP를 함께 제공합니다. 한 파일 앱에는 아래128파일3개만 넣는 선택지를 권합니다. 합계49,388bytes:

- `trophy/app/trophy_series_128.webp` — 11756bytes
- `trophy/app/trophy_season_128.webp` — 17574bytes
- `trophy/app/trophy_ring_128.webp` — 20058bytes

기본파일 목록:

| id | group | 크기 | bytes | assets/v16/champ/ 기준 경로 |
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

검수: ASSET_VALIDATION_PASSED_GAME_REVIEW_PENDING. 묶음별 비교판은 `previews/`, 수치·알파·검수 범위는 validation.json/README에 있습니다. 최종 게임 연결/화면 검토는 후속 작업입니다.
