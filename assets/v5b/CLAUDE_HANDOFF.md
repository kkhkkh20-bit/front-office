# Claude 연결 안내 · v5b

게임 연결 코드는 변경하지 않았습니다. 경로 기준은 `assets/v5b/`이며, 의상과 마크는 **얼굴에 적용할 위치를 이미 가진 전체 512×512 RGBA 이미지**입니다. 작은 그림의 바운딩박스만 잘라 재배치하거나 기존 v5 워드마크 quad로 다시 투영하지 마세요.

## A 소개용 상의 교체

`collections.uniforms`의 44개 ID는 v5와 같습니다. 각 ID의 `png`/`webp` 경로를 v5b로 바꾸면 됩니다. 256/512, 구단 key, 앞·뒤·홈·원정, 원단/동적 글씨 색, `text_slots` quad·baseline·max_font_size는 유지했습니다. 모자 제품과 등번호 숫자 에셋은 이번 수정 대상이 아니므로 기존 v5를 계속 사용합니다.

## B 공통 의상 합성

1. `assets[identity_id].png[512]` 기준 판을 그립니다. 두 인물 모두 v5와 같은 사진이며 팀 마크가 없습니다.
2. `kits[team_key][kit].kit_overlay`를 읽습니다. 홈 키트 ID는 `{team}_kit_overlay`, 원정은 `{team}_away_kit_overlay`입니다.
3. **의상만 인물별 UV 좌표로 정렬**합니다. `garment_registration.source_x_rgb16`과 `source_y_rgb16`은 각각 출력 픽셀에서 공통 의상의 어느 x/y를 읽을지 기록한 512px RGB 데이터 PNG입니다. 목둘레의 좌우 이동까지 포함해 칼라의 세로 찢김을 방지합니다. 얼굴 사진 자체는 이동하거나 늘리지 않습니다.

   `sourceX = (xMap.R * 256 + xMap.G) / 65535 * 511`

   `sourceY = (yMap.R * 256 + yMap.G) / 65535 * 511`

   두 맵은 B=0, 알파=255인 일반 RGB PNG입니다. 색 변환/리사이즈 없이 원래 512px에서 `ImageData`를 읽으면 됩니다. 읽은 좌표에서 공통 의상 RGBA를 bilinear 샘플링하고, 결과 알파에 인물별 의상 마스크를 곱합니다. 레이어에는 두 인물에게 필요한 가장자리 의상 픽셀 여유분이 포함되므로 **마스크 적용을 생략하면 안 됩니다.** 마스크 밖 RGB는 합성하지 않습니다.

   WebGL 텍스처 샘플링이나 오프스크린 Canvas의 `ImageData` 처리 중 편한 방식으로 한 번 합성해 캐시합니다. 캐시 키는 `identity_id + team_key + kit + v5b`입니다. 기준 인물 `ko_late20s_01`의 UV는 항등변환이므로 공통 의상을 그대로 읽을 수 있습니다. `controls`에는 thin-plate-spline의 원본 대응점/커널/평활 계수도 기록했습니다. `source_top_y`/`target_top_y`는 윤곽 검수용이며 이 두 배열만으로 2D UV를 대체하지 않습니다. 단일 채널 `source_y_u16`은 보조 원본입니다.

4. 정렬된 의상의 알파에 `assets[identity_id].masks.garment/255`를 곱하고 기준 판 위에 source-over 합니다. 몸판·소매·칼라 개별 마스크도 제공합니다. 세 마스크는 겹치지 않으며 전체 의상 마스크와 합이 같습니다. `collar`는 기존 기준 판의 칼라 바인딩과 짧은 상단 단추 줄 영역입니다. 새 의상 레이어는 이 세 영역을 이미 모두 포함하므로 같은 레이어를 세 번 중첩하지 않습니다.
5. `kits[team_key][kit].chest`를 (0,0)에 source-over 합니다. 원단에 포함된 음영을 다시 곱하지 않습니다. 가슴 심벌은 viewer-right의 x337~401, y430~494 부근에 있으며, 단추 줄 x244~282와 떨어져 있습니다. 심벌은 의상 정렬 후에 적용합니다. 심벌을 단추 줄에서 자르는 처리를 넣지 마세요.
6. 모자만 기존 빨간 키를 교체합니다. `cap_key`는 모자 전용 마스크, `cap_shading`은 원래 R채널 음영입니다. `color=kits[team_key][kit].cap_color`:

   `out = plate*(1-capMask/255) + colorRGB*(capShading/255)*(capMask/255)`

   색 교체는 현재 합성 이미지에 모자 마스크 영역만 적용합니다. legacy 키 마스크는 기록용으로 보존했지만, 칼라·소매까지 다시 물들이는 데 사용하지 않습니다.
7. `kits[team_key][kit].cap`을 (0,0)에 source-over 합니다. 홈·원정의 모자는 동일한 검수된 구단 색/심벌을 공용으로 씁니다.
8. 완성한 512px 합성을 마지막에 256/128로 축소합니다. 각 레이어를 따로 128px에서 정렬하면 경계/심벌 품질이 달라질 수 있습니다.

## 검수 파일

- `ASSET_PREVIEW.png`: 요약 미리보기.
- `previews/uniforms_44.png`: 상의 44장 한 판.
- `previews/wrinkle_crops.png`, `wrinkle_overlaps.png`, `uniforms_before_after.png`: 동일 위치와 겹침 비교.
- `previews/home_ko_late20s_01_sizes.png`, `home_black_01_sizes.png`: 각 인물의 11팀 홈, 매 행에 128·256·512 크기 나란히.
- 같은 이름의 `away_...`: 원정 예비 키트도 같은 방법으로 확인.
- `previews/home_all_teams.png`, `away_all_teams.png`: 두 인물 × 11팀 조합.
- `previews/design_match.png`: 소개용 상의와 얼굴의 홈·원정 배색 비교.
- `previews/region_masks.png`: 영역 분리와 인물별 윤곽.
- `validation.json`: 원본 얼굴/배경 보존, 가슴 심벌의 단추 줄 비침범, 이미지 경로·해시·슬롯 검증.

기준 판 2명에 맞춘 시험 패키지입니다. 향후 새 인물은 동일 기준 구도로 만들고 그 인물의 의상 마스크와 정렬 좌표를 검수해야 합니다. v6 10,000명은 제작하지 않았습니다. 기존 v5 파일은 수정하지 않았습니다.
