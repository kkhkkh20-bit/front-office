# Claude handoff · v6b batch01b

**검수 미통과. manifest.release_ready=false / deployment_manifest.do_not_deploy=true입니다.** 이 파일은 합성 포맷 검토용입니다. ArcFace0.40 통과100명을 확보한 뒤 게임 연결·대량 제작을 판단해야 합니다. 코드는 변경하지 않았습니다.

## 1. 파일과 좌표

런타임 후보는 manifest의 runtime_files4개뿐입니다:256 판,128 판,128px 정렬 시트, manifest. 모든 시트는10×10, 회전·거터 없음입니다. 인물의 `sheets[256].rect`와 `registration.rect`는 각 시트의 좌상단 픽셀 `(x,y,w,h)`입니다. 정렬 시트는 칸마다128×128이며 판256의 같은 인물을 나타냅니다. ZIP·PNG 검수판·NPZ·보고서는 배포하지 않습니다.

## 2. 판 RGB와 알파

판은 **RGBA 데이터**입니다. RGB=완전한 사진, A=모자 키 마스크이며 표시 불투명도가 아닙니다. 디코더는 알파0 뒤 RGB를 보존해야 합니다. `createImageBitmap(blob,{premultiplyAlpha:'none',colorSpaceConversion:'none'})`에서 WebGL로 직접 올립니다. `UNPACK_PREMULTIPLY_ALPHA_WEBGL=false`, `UNPACK_COLORSPACE_CONVERSION_WEBGL=NONE`. Canvas2D drawImage/getImageData를 중간에 쓰지 마세요. ImageBitmap의 premultiplyAlpha 옵션은 업로드 때의 pixelStore 설정보다 먼저 필요합니다. 지원이 불확실한 브라우저는 비결합 RGBA를 반환하는 WebP 디코더 경로가 필요합니다. Safari 실기기 지원은 확인하지 않았습니다.

샘플링한 원본 `(rgb,capMask)`를 따로 보존하고 표시할 때 alpha=1로 복원합니다. 모자 음영은 **원본 판 R**입니다. RGBA를 일반 이미지로 리사이즈하면 숨은 RGB가 사라질 수 있으므로 RGB·마스크를 독립 처리하세요. 납품128은 이미 독립 처리했습니다.

## 3. 정렬 시트 디코딩

정렬 시트는 **불투명 RGB8 무손실 WebP**입니다. R=의상 마스크, G/B=공통 의상의 source_x/y. 감마·sRGB 변환 없이 선형 데이터로 읽습니다. 시트 전체를 뭉뚱그려 리사이즈하지 말고, 해당128px 칸 내부에서 bilinear 샘플링하며 반 픽셀 중심으로 clamp해 이웃 인물 UV가 섞이지 않게 합니다.

대상256 좌표 `(x,y)`에 대응하는 칸 내부 데이터 픽셀은 `q=((x+0.5)*128/256-0.5,(y+0.5)*128/256-0.5)`입니다. q를 `[0,127]`로 clamp하고 RGB를 bilinear 보간합니다. 보간된 바이트 `(r,g,b)`에서:

```
garmentMask = r/255
sourceX512 = g/255*511
sourceY512 = b/255*511
canonicalTextureUV = ((sourceX512+0.5)/512, (sourceY512+0.5)/512)
```

정규화된 shader sample을 쓰면 `sourceX512=sample.g*511`, `sourceY512=sample.b*511`입니다. 좌표는 signed가 아니며0..511 범위입니다.8bit 양자화 오차는512 기준 약1px입니다.128→256 보간은 칸 내부에 한정합니다. 사진 자체를 이 UV로 변형하지 마세요. 정렬 대상은 의상·가슴 심벌뿐입니다.

낮은 해상도 마스크의 피부/배경 침범을 막기 위해 원본 키 색의 coverage로 보조 clip했습니다. 아래 식은 **0..255 sRGB 바이트 수치**로 계산하며 GPU texture format에서 sRGB→linear 자동 변환을 적용하지 않습니다:

```
keyCoverage = clamp((R-1.65*max(G,B)-12)/28,0,1)*clamp((R-35)/35,0,1)
m = garmentMask*keyCoverage
```

## 4. 합성 순서 · 검수판과 같은 식

1. 판256 RGB를 읽고 불투명 표시를 복원합니다. 원본 R·capMask를 보관합니다.
2. `assets/v5b/manifest.json`의 `kits[team].home.kit_overlay`와 `chest`의512 RGBA를 위 UV로 bilinear 샘플링합니다. source 좌표는 canonical `ko_late20s_01` 사진 기준입니다. 새로운 얼굴을 공통 몸판 위에 얹지 않습니다.
3. 새 사진 자신의 옷 주름 음영을 유지하기 위해 `canonicalNeutralR`도 v5b `assets.ko_late20s_01.png[512]`에서 같은 UV로 읽습니다. `shade=clamp(originalPlateR/max(canonicalNeutralR,50),0.55,1.45)`. `clothRGB=clamp(warpedKitRGB*shade,0,255)`. 기존 키트 음영을 무조건 한 번 더 곱하는 것이 아니라, 기준 사진 대비 새 사진의 명암 비율로 교체합니다.
4. `out=plateRGB*(1-m)+clothRGB*m`. UV는 canonical 의상 안쪽을 가리키며 인물 마스크로 clip합니다. `chestAlpha=warpedChestA/255*m`으로 가슴 심벌을 그립니다. 가슴 심벌도 인물 의상 UV로 함께 이동하며 단추 줄에서 글씨를 자르지 않습니다.
5. 모자: `a=capMask/255`; `out=out*(1-a)+teamCapColorRGB*(originalPlateR/255)*a`. 상의에 이 모자 색 공식을 적용하지 마세요.
6. `kits[team].home.cap`의512 심벌 이미지를 각 인물의 `cap_mark_transform_512=[sx,sy,tx,ty]`로 변환합니다.512좌표 식은 `(x',y')=(sx*x+tx,sy*y+ty)`.256 합성에서는 tx/ty만 절반으로 줄이고, 전체512 심벌 이미지를256으로 축소한 뒤 같은 sx/sy를 적용합니다. 심벌 알파에 capMask를 곱해 모자 밖으로 새지 않게 합니다.
7. 완성 불투명256을 캐시하고128 목록용으로 축소합니다. 캐시 키에 identity_id·team·kit·v6b를 포함합니다.

이번 검수는 코메츠·하운즈·블레이즈 홈3팀×100명입니다. 다른 구단·원정 연결 검수는 완료했다고 주장하지 않습니다. 모자/상의 원래 키 색은 명암 때문에 모든 픽셀 R255,G0,B0인 평면색이 아니라 #FF0000 albedo의 사진입니다.

## 5. 검수·보관

validation.json / arcface_validation.json / validation_embeddings.npz에 실제256 시트 검사와 이전122판 비교가 있습니다. 기준은 사용자 지정0.40이며 모델·정렬은 v6과 동일합니다. 실패한 쌍과 최근접 상대를 숨기지 않았습니다. 눈높이·모자 위의 검출치와 전체 사진 affine은 camera_validation.json에 있습니다. 턱 하단 검출 박스를 실제 해부학적 턱 측정으로 오인하지 마세요.

ASSET_PREVIEW와 키 색100명 판,3구단128/256 총6장,20명 경계 확대4장을 같이 봅니다. 사진 생성 입력으로 실존 선수나 유명인 사진을 사용하지 않았습니다. ArcFace 구별성은 모든 실존 인물과 닮지 않았다는 보증이 아닙니다.

512 원본100개와 낱장128/256 200개는 `assets/v6/archive/batch01b/` ZIP2개에 보관했습니다. person별 mask/UV/shading 파일은0개입니다. 정렬 정보는 시트1개에만 있습니다.
