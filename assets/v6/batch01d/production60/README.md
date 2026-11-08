# v13 선수 사진 추가60명 — 리뷰 납품

리뷰 브랜치: `assets/v13-faces-review`. main 병합 및 게임 코드 변경 없음.

60명(외국인36·국내24) ×10구단 홈 의상=600사진. 얼굴·목·어깨·의상이 연결된 사진 전체를 생성·편집했으며, 공통 상체에 얼굴을 붙이지 않았습니다. 자연스러운 어깨 자세와 얼굴·쇄골 중심 구도, 깊은 모자와 실제 천·자수 질감을 사용했습니다.

## 파일과 연결

- `manifest.json`: 기존 v6c와 같은 `identities[].variants[team].sheets[128|256].path·rect`, `age`, `ethnicity`, `tags.glasses`, `tags.facial_hair`.
- `sheets/*_128.webp`: 앱용10장, 각350,000bytes 이하. 합계 **3,309,504bytes**.
- `sheets/*_256.webp`: 사이트 상세사진용10장, RGB 무손실.
- 각 시트10×10,60칸 사용·40칸 검정.128피치144/256피치272, 양쪽8px검정 여백. `rect`는 사진만 가리킵니다.
- `previews/`: 출신 묶음별256px, 구단별60명256px, 모자 여백128px 가이드, 3명×10구단 비교판.
- `identity_prescreen/`: 의상 편집 전60명 선검수·원본 출처·비교판·임베딩.
- `validation/`: 실제 납품 WebP를 디코딩한1200개 얼굴 검사 자료와 임베딩.

## 검수 범위

기존 v6c 프로토콜처럼 **독립 인물 선검수에 cosine<0.40**을 적용했습니다. 새60명끼리 최대0.397783, 기존 v6c100명 선검수 원본 대비 최대0.368844, 기존1000구단 완성사진 대비 최대0.395065입니다. 의상 편집은 이 선검수가 끝난 뒤 진행했습니다.

완성된10구단 사진은 동일인 유지(>=0.60), 자기 선검수 인물 최근접1위, 실제 파일 크기·RGB·rect·모자·의상 육안 검수를 적용했습니다. 완성사진끼리 서로 다른 인물/기존 완성사진과의 raw cosine는 참고 지표로 별도 공개합니다. **최종 의상 사진의 모든 교차 쌍이0.40미만이라고 주장하지 않습니다.**

실제128: 구단 사이 동일인 최솟값 0.756728, 자기 선검수 대비 0.769868, 최근접1위 600/600.

실제256: 구단 사이 동일인 최솟값 0.782415, 자기 선검수 대비 0.784185, 최근접1위 600/600.

상태: **ASSET_VALIDATION_PASSED_GAME_REVIEW_PENDING**. 게임 연결 및 게임 내 최종 판단은 Claude/사용자 검토 대상입니다. 실존 인물 전체와의 비유사성을 수학적으로 증명한 것은 아니며, 생성 지시와 육안 확인으로 뚜렷한 실존 인물 연상·실제 브랜드를 배제했습니다.

## 앱용128 시트 용량

| 구단키 | bytes | 파일 |
|---|---:|---|
| seoul_comets | 329584 | seoul_comets_128.webp |
| seoul_hounds | 326764 | seoul_hounds_128.webp |
| incheon_seagulls | 346052 | incheon_seagulls_128.webp |
| suwon_sparks | 324852 | suwon_sparks_128.webp |
| goyang_storm | 341116 | goyang_storm_128.webp |
| daejeon_redfox | 318280 | daejeon_redfox_128.webp |
| gwangju_blazes | 332322 | gwangju_blazes_128.webp |
| daegu_thunders | 304592 | daegu_thunders_128.webp |
| busan_waves | 341404 | busan_waves_128.webp |
| changwon_anchors | 344538 | changwon_anchors_128.webp |
