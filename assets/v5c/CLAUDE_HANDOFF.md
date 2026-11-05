# v5c 연결 안내

변경 ID는 `korea_home_front`, `korea_home_back`, `korea_away_front`, `korea_away_back`, `korea`(제품 모자), `korea_kit_overlay`, `korea_away_kit_overlay`, `korea_chest`, `korea_away_chest`, `korea_cap`입니다. `assets/v5c/manifest.json`은 변경 ID만 담은 v5b 형식입니다. 기존 manifest에 동일 ID를 덮어 적용하는 방식으로 연결하면 됩니다.

1. 소개용 상의의 ID·해상도·슬롯 quad/baseline/max_font_size는 v5b와 같습니다. 동적 이름·등번호 색은 홈 남색, 원정 아이보리로 기록했습니다.
2. 제품 모자 `korea`는 `caps/`의 128/256 버전을 사용합니다. 제품 모자 이미지와 얼굴에 얹을 `korea_cap` 마크는 별개입니다.
3. 얼굴 합성은 기존 v5b 순서·좌표를 그대로 사용합니다: 기준 판 → 인물별 UV로 정렬한 의상(의상 마스크로 clip) → 가슴 K → 모자 키 색 교체 → 모자 K. 기준 판·마스크·UV 파일은 v5b의 것을 재사용하며, 새로 복제하지 않았습니다.
4. 모든 얼굴용 레이어는 전체 512px 투명 캔버스에 이미 배치되어 있습니다. 다시 quad로 투영하거나 알파 바운딩박스를 잘라 재배치하지 마세요. 작은 가슴 K는 viewer-right x337~401 부근이며 단추 줄 x244~282를 넘지 않습니다. 중앙을 자르는 기존 워드마크 처리도 필요 없습니다.
5. 모자색은 기존 `#142E53`이며 R채널 음영×색 교체 식도 같습니다. 원단 음영은 의상 RGB에 포함되어 있어 두 번 곱하지 않습니다. 완성본을 마지막에 256/128로 축소합니다.
6. v6 공통 상체가 `ko_late20s_01`과 일치하면 의상 정렬은 항등입니다. v6 판의 특수 알파(모자 마스크)는 일반 투명도가 아니므로 v6 인계 문서의 RGB 보존 디코딩 규격을 따릅니다.

`ASSET_PREVIEW.png`는 요청한 검수 항목을 한 판에 모은 이미지입니다. `previews/flag_detail.png`는 실제 상의의 국기 패치 확대와 공개 국기 SVG만 보여 주며 실제 대표팀 로고 비교판은 아닙니다. 국기 SVG는 공공 영역의 국가 상징이고, 글씨 K/Korea는 새로 그린 자체 도형입니다.

`source/korea_embroidery.blend`에는 제품 모자와 세 종류 자수 마크가 있습니다. 소개용 국기 위치는 각 상의의 `sleeve_flag_quad`입니다. 같은 구단 앞·뒤에서 착용자의 왼쪽 소매가 바뀌지 않도록 위치를 확인했습니다.
