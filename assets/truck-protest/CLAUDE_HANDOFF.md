# 팬 트럭 시위 사진 연결 안내

납품 경로: `assets/truck-protest/`

리뷰 브랜치: `assets/truck-protest-review`

사진 30종 × 2크기 = **RGB WebP 60개**입니다. 실제 KBO 구단·기업·사건의 사진을 사용하지 않은 가상 장면입니다. 에셋만 추가했고 게임 연결 코드는 수정하지 않았습니다.

## 경로와 선택

|크기|경로 패턴|파일 수|합계 용량|
|---|---|---|---|
|960×540|`assets/truck-protest/960/{team}/{scene}.webp`|30|2,700,884바이트|
|480×270|`assets/truck-protest/480/{team}/{scene}.webp`|30|843,306바이트|
|전체|두 크기를 모두 합한 값|60|**3,544,190바이트**|

`scene`은 `stadium_day`(홈구장 앞 낮), `stadium_night`(홈구장 앞 밤), `headquarters_day`(모기업 본사 빌딩 앞 낮)입니다.

`manifest.json`의 `lookup[team][scene]`로 사진 ID를 찾고, `images`의 해당 항목에서 `variants["960"]` 또는 `variants["480"]`을 읽습니다. `path`는 manifest의 `path_base`인 `assets/truck-protest/` 기준 상대 경로입니다. 각 variant에 `width`, `height`, `bytes`, `sha256`, `led_rect`, `text_safe_rect`가 있습니다.

예: 서울 코메츠·홈구장 앞 낮·960 버전은 `960/seoul_comets/stadium_day.webp`, 사진 ID는 `seoul_comets__stadium_day`입니다. 같은 구단·장면에서 크기를 바꿔도 구도는 같습니다. 작은 기사에는 480, 확대 기사에는 960을 선택하고 필요한 파일만 불러오면 됩니다.

## 전광판 rect

좌표는 이미지 왼쪽 위가 원점인 **`[x,y,width,height]` 픽셀**입니다. 오른쪽·아래 끝은 포함하지 않습니다. 검은 전광판의 베젤을 제외하고 안쪽으로 조금 여유를 둔 사용 가능 영역이며, 해당 장면의 10구단 모두 같은 좌표를 사용합니다. 화면을 정면으로 생성했으므로 원근 변환 없이 사각형으로 문구를 얹을 수 있습니다.

|장면|960×540 `led_rect`|480×270 `led_rect`|
|---|---|---|
|`stadium_day`|`[346,76,474,226]`|`[173,38,237,113]`|
|`stadium_night`|`[338,78,504,220]`|`[169,39,252,110]`|
|`headquarters_day`|`[350,82,498,224]`|`[175,41,249,112]`|

문구는 더 안쪽의 `text_safe_rect`에 배치하는 것을 권장합니다.

|장면|960×540 `text_safe_rect`|480×270 `text_safe_rect`|
|---|---|---|
|`stadium_day`|`[360,86,446,206]`|`[180,43,223,103]`|
|`stadium_night`|`[352,88,476,200]`|`[176,44,238,100]`|
|`headquarters_day`|`[364,92,470,204]`|`[182,46,235,102]`|

Canvas로 표시하면 사진을 먼저 그리고 해당 rect 안에 문구를 클립해 얹습니다. DOM 오버레이면 `left=x/imageWidth`, `top=y/imageHeight`, `width=w/imageWidth`, `height=h/imageHeight`의 비율을 사용합니다. 사진 컨테이너는 16:9를 유지합니다. `object-fit:cover`로 별도 잘라낼 경우에는 동일한 크롭·오프셋을 문구 좌표에도 적용해야 합니다.

사진의 전광판은 어두운 중성색의 미세 LED 질감을 유지하고 있으며 문구는 없습니다. 게임이 흰색·노란색 등의 글자를 얹으면 됩니다. `previews/*_overlay_example.png`의 청록선은 `led_rect`, 금색선은 `text_safe_rect`입니다. 이 PNG에는 위치 확인용 문구가 있지만 런타임 WebP에는 없습니다.

## 구단과 현수막 색

색은 기존 `assets/v5b/manifest.json`의 구단 기본색을 기준으로 했습니다. 사진 속 천에는 자연광·야간 조명·주름의 명암이 있어 모든 픽셀이 해당 HEX와 같지는 않습니다. 사진에 구단명이나 로고는 넣지 않았습니다.

|구단 키|현수막 목표색|
|---|---|
|`seoul_comets`|`#A50034`|
|`seoul_hounds`|`#131230`|
|`incheon_seagulls`|`#CE0E2D`|
|`suwon_sparks`|`#141414`|
|`goyang_storm`|`#570514`|
|`daejeon_redfox`|`#F37321`|
|`gwangju_blazes`|`#EA0029`|
|`daegu_thunders`|`#074CA1`|
|`busan_waves`|`#041E42`|
|`changwon_anchors`|`#1D467B`|

## 납품·검수

- 30종 전부를 최종 480px 비교판에서 육안 확인했습니다. 세 장소의 문구 오버레이 예시도 960px로 확인했습니다. 로고·실존 명칭·식별 가능한 얼굴·전광판 문구가 보이지 않도록 검수했습니다.
- WebP 60개의 크기·RGB·파일 해시·좌표 경계·480/960 좌표의 정확한 1:2 관계를 확인했습니다. 모든 `led_rect`의 밝은 픽셀 비율과 명도도 검사했습니다. 이는 육안 검수의 보조 검사이며 OCR 또는 얼굴 인식 결과를 뜻하지 않습니다.
- 생성 원본은 1672×941px입니다. 종횡비를 16:9로 맞추는 미세한 중앙 크롭과 균일 축소 후 WebP quality 90으로 저장했습니다. 구단별 현수막 색 편집은 이미지 생성 도구로 했습니다. 사진별 원본 파일 이름·해시는 manifest에 기록했습니다.
- `previews/`, `validation.json`, `checksums.sha256`는 검수 자료입니다. 런타임에서 미리 불러올 필요가 없습니다.

에셋 검수 완료, 게임 연결 후 리뷰 대기 상태입니다. main에는 병합하지 않고 요청하신 리뷰 브랜치로 납품합니다.
