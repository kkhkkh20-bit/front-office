# v23b expansion kits — A1 / B7

사용자가 선택한 **A1(숲녹색·골드) / B7(퍼플·실버)** 마크를 v23의 420명 × 2구단, **840장**에 적용했습니다. 원본 인물·색·구도·유니폼 디자인을 유지하고 엠블럼 주변만 프로그램으로 합성했습니다.

- 경로: `assets/v23b/expansion_kits/`
- 브랜치: `assets/v23b-review` — main 병합 및 게임 연결 없음
- schema_version: `v23b-expansion-kits-1`
- 시트 20장: 5묶음 × 2구단 × 128/256. RGB 손실 WebP q80
- 128: 1440×1440 / 256: 2720×2720. 10×10, 칸별 padding8, pitch n+16
- 모자 840개, 원본에서 보이는 가슴 엠블럼 822개 교체. 기존 가슴 엠블럼이 보이지 않는 18장은 그 부분을 그대로 보존

[대표 사진](previews/delivery_sample.png) · [무작위20명 비교1](previews/random20_before_after_1.jpg) · [비교2](previews/random20_before_after_2.jpg) · [비교3](previews/random20_before_after_3.jpg) · [비교4](previews/random20_before_after_4.jpg)

## 최종 파일 검수

최종 WebP를 다시 읽은 1,680건 모두 ArcFace ≥0.60, 자기 인물1순위, 원 인물 대비 얼굴 중심±4px를 통과했습니다. 최소 코사인 **0.632124**, 최대 중심 오차 **3.265594px**입니다. 기존 v23 사진과의 별도 비교도 모두 통과했고 최소 코사인 **0.935494**, 최대 중심 오차 **3.811485px**입니다. 코사인·중심은 원시 값으로 판정하며 기준을 완화하거나 얼굴 위치를 이동하지 않았습니다.

합성 작업본은 엠블럼 마스크 밖의 픽셀이 바이트 단위로 같고, 보호한 얼굴 띠의 해시도 동일합니다. 최종 런타임은 손실 WebP이므로 압축 때문에 마스크 밖에서도 미세한 픽셀 차이가 생깁니다. 이를 픽셀 동일이라고 표현하지 않으며, 최종 압축본에 얼굴 검사를 별도로 적용했습니다. `validation/pixel_preservation.json`, `codec_face_differences.json`을 참조하세요.

검수 자료는 `validation.json`, `validation/`, `previews/`, `checksums.sha256`에 있습니다. `badges/`의320px 투명 PNG는 글자 없는 A1/B7 마크입니다. XI/XII가 들어간 큰 크레스트 원본은 `../crests/`입니다. 유니폼에는 로마 숫자를 넣지 않았습니다.

원본 v2/v23, 게임 코드, 빌드·검사 코드를 변경하지 않았습니다. 게임 연결은 Claude가 합니다.
