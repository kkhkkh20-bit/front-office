# v6 batch01 합성·연결 규격

**현재 파일은100명 후보의 포맷 검토본입니다. ArcFace 코사인 상한0.35를 통과한100명이 아니며, `release_ready=false`입니다. 게임 배정·다음 대량 제작에 승인된 데이터로 취급하지 마세요.** 실제 최근접 상대·수치는 manifest와 `arcface_validation.json`에 있습니다.

## 파일 구조

게임용 후보 파일은 `sheets/128/b01_s01.webp`, `sheets/256/b01_s01.webp`, `shared/garment_mask_256.png`, `manifest.json` 네 파일입니다. 각 시트는10×10, 여백0, 좌상 기준입니다. `identities[].sheets[size].rect`로 자릅니다. 다른 인물의 마스크·정렬·음영 파일은 없습니다.

512 정규화 판과 낱장128/256 WebP는 `assets/v6/archive/batch01/portraits_part01.zip`, `part02.zip`에만 보관합니다. `batch01/` 배포 후보 폴더에512 이미지를 넣지 않았습니다. ZIP, 검수 PNG, validation 데이터는 배포에서 제외합니다. 현재는 `deployment_manifest.json`의 `do_not_deploy=true`도 확인하세요.

## 알파는 불투명도가 아닙니다

판의 RGB에는 얼굴·목·배경·공통 상체가 모두 들어 있고, 알파에는 **모자 키 마스크**만 들어 있습니다. 모자 밖의 알파0 픽셀에도 RGB가 있습니다. 원본을 일반 이미지 뷰어에 열면 모자 위주로 보이는 것이 이 데이터 규격 때문입니다. `ASSET_PREVIEW.png`는 RGB의 표시 불투명도를 복원한 검수 이미지입니다.

**일반 Canvas2D의 drawImage→getImageData 경로는 사용하지 마세요.** 알파0인 얼굴 RGB가 검정/0으로 소실되는 것을 Chromium에서 실제 확인했습니다.

검증한 경로는 다음과 같습니다.

1. WebP Blob을 `createImageBitmap(blob, {premultiplyAlpha:'none', colorSpaceConversion:'none'})`로 디코딩합니다.
2. WebGL에서 `UNPACK_PREMULTIPLY_ALPHA_WEBGL=false`로 RGBA 텍스처에 업로드합니다. RGBA의 A는 모자 마스크 데이터로 보존합니다.
3. 얼굴 표시용 첫 패스는 RGB를 읽고 출력 불투명도만1로 둡니다. 원본 A를 얼굴 표시 불투명도로 쓰면 안 됩니다.
4. Canvas2D가 후속 합성에 필요하면 이 GPU 패스의 불투명 RGB 결과를 넘깁니다. 모자 마스크는 별도 GPU 패스에서 A를 RGB 그레이스케일로 내보내고 출력 알파를1로 둘 수 있습니다. 이는 메모리 버퍼이며 인물별 파일을 추가하는 방식이 아닙니다. 또는 WebP 디코더로 비결합 RGBA 배열을 직접 읽어도 됩니다.

128/256 원본 제작 때도 RGB와 A를 **따로 축소한 다음 결합**했습니다. 일반 RGBA 리사이즈나 알파 합성으로 원본 판을 가공하면 숨은 RGB를 잃을 수 있습니다. WebP는 `exact` 투명 RGB 보존 옵션으로 인코딩했고 알파 왕복 일치를 검사했습니다.

## 구단 합성 순서(256px)

1. 판 RGB를 불투명 이미지로 복원합니다. 원본 판의 A와 R을 모자 키·음영 용도로 확보합니다.
2. 구단 홈 의상 레이어를256으로 축소하고 공통 `garment_mask_256.png`로 알파를 clip한 뒤 source-over 합니다. 상체는 `ko_late20s_01`과 같은 기준이므로 **항등 정렬**입니다. v5b의 인물별 UV·부위 마스크를 로드하지 않습니다.
3. 작은 가슴 심벌을 얹습니다.
4. 모자 영역만 `out = current*(1-mask) + teamRGB*(originalR/255)*mask`로 바꿉니다. mask는 판 A/255입니다. RGB에는 원단 명암이 있으므로 R채널을 사용합니다.
5. 구단 모자 심벌을 얹고 최종 결과의 표시 불투명도를1로 둡니다.
6. 완성한256 결과를128로 축소해 목록에 씁니다. 캐시 키는 인물ID·구단·키트·에셋 버전입니다.

11팀 홈 키트 경로는 manifest의 `kit_dependencies`에 있습니다. 기존10구단은 v5b, 대한민국은 새 v5c 필기체 K 키트입니다. 마크는 전체512 좌표가 이미 적용된 파일이므로 축소만 하고 다시 quad로 투영하지 않습니다.

## 검수 자료

- 대표3팀(코메츠 핀스트라이프, 하운즈 남색 소매, 블레이즈 빨간 소매) ×100명 ×128/256 합성판6장: `previews/`.
- 전체11팀×100명 합성에서 얼굴 영역 보존을 검사했습니다.
- `arcface_validation.json`: 고정 ArcFace 모델과 SHA-256, 정렬 방법, 실측 최근접 상대·코사인,0.35 초과 쌍. 현재 이 게이트가 미통과입니다.
- `validation_embeddings.npz`: 실제256 시트 디코딩 RGB에서 얻은 정규화 임베딩. 배포용이 아닙니다.
- `validation.json`: 포맷/인코딩/합성 검사와 **전체 합격 여부 false**를 구분합니다.

현재 중복 검수 미통과 상태는 합성 파일 규격이 준비됐다는 의미와 별개입니다. 후보를 재선정·재생성해 게이트를 통과하거나, 사용자가 기준 변경을 명시적으로 결정하기 전에는 승인된100명으로 처리하지 않습니다.
