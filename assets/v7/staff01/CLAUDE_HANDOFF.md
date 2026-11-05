# Claude handoff · v7 staff01

manifest.release_ready와 validation.passed를 먼저 봅니다. ArcFace0.40 미통과인 세트를 합격품으로 표시하지 마세요. 게임 코드는 변경하지 않았습니다.

## 묶음·셀

runtime_files는 이미지5장+manifest1개입니다. 모두10×10, 회전/거터 없음. `identities[].sheets[128|256].rect`는 시트의 좌상단 `(x,y,w,h)`입니다. 감독·코치는 coaches 시트60셀, RGB 단장·구단주·프런트는 civilian 시트66셀입니다. kind=kit_plate만 합성하고 kind=rgb_portrait는 RGB를 그대로 표시합니다. 사용하지 않는40/34셀을 인물로 배정하지 않습니다.

## 단장 선택 자료

role_group=gm은36명, 남28·여8입니다. gm_filter_pools는 성별·나이대별 실제 ID 목록입니다. 여성은 나이별2/3/3명이라 같은 성별·같은 나이대만 엄격히 고르면6장에 못 미칩니다.6장 표시는 게임의 인접 나이 범위 정책과 맞춰 사용하세요. gm_selection_groups는 나이·성별·인상을 섞은 검수용6명 예시6묶음이고 UI 추첨 정책을 강제하지 않습니다. 선택된 우리 단장 사진의 재배정 금지 등 게임 정책은 요청서의 Claude 연결 계획을 따릅니다.

## 모자 없는66명

단장36·구단주20·직원10은 RGB 판입니다. 알파/의상 마스크/UV/모자 심벌이 없습니다. v6b capMask 해석이나 구단 유니폼 합성을 적용하지 마세요.

## 감독·코치 RGB+A 판

RGB는 온전한 상반신 사진, A는 모자 마스크 DATA이며 불투명도가 아닙니다. 비결합 RGB를 보존하는 WebP 디코더를 사용합니다. Python/Pillow `convert('RGB')`처럼 숨은 RGB를 유지하는 읽기가 가능합니다. Canvas2D drawImage→getImageData는 얼굴 RGB를 지웁니다. 브라우저 직접 경로라면 `createImageBitmap(blob,{premultiplyAlpha:'none',colorSpaceConversion:'none'})`에서 WebGL로 직접 업로드하고 `UNPACK_PREMULTIPLY_ALPHA_WEBGL=false`, `UNPACK_COLORSPACE_CONVERSION_WEBGL=NONE`를 설정합니다. 중간 Canvas2D를 거치지 않습니다. Safari 지원을 실기기 검증한 것은 아닙니다.

원본 R과 A를 보관한 뒤 표시 불투명도는1로 복원합니다. RGBA 전체를 opacity처럼 리사이즈하면 숨은 RGB가 없어지므로 RGB와 마스크를 독립 처리합니다. 납품128/256은 이 처리를 마쳤습니다. 마스크는 BOX 면적 축소라 여백 밖 알파 링잉이 없습니다.

## 의상 정렬 시트

coach.registration.rect로128×128 칸을 읽습니다. 무손실 RGB8 WebP이며 색 변환/감마/sRGB 텍스처 자동 디코딩을 적용하지 않는 데이터입니다.256 출력 픽셀 `(x,y)`의 칸 내부 샘플 좌표는:

```
q = ((x+0.5)*128/256-0.5, (y+0.5)*128/256-0.5)
q = clamp(q,0,127) // 해당 셀 안에서만 bilinear; 이웃 셀 혼합 금지
gm = sample.R/255
sx = sample.G/255*511
sy = sample.B/255*511
canonicalUV = ((sx+0.5)/512,(sy+0.5)/512)
```

정규화 shader sample이면 gm=sample.r, sx=sample.g*511, sy=sample.b*511입니다. RGB 바이트를 bilinear한 뒤 좌표로 풀며,8bit 좌표 양자화 오차는512 기준 약1px입니다. 사진 자체는 이 UV로 움직이지 않습니다.

## 합성 식 ·256에서 만들고 완성128로 축소

모든 색 계산은0..255 sRGB 바이트 수치입니다. 기존 v5b manifest의 home kit_overlay/chest/cap와 canonical ko_late20s_01의512 판을 사용합니다.

```
kc = clamp((R-1.65*max(G,B)-12)/28,0,1)*clamp((R-35)/35,0,1)
wk = bilinear(kitOverlay,sx,sy)
m = gm*kc*clamp(wk.A/255*4,0,1)
neutralR = bilinear(canonicalPhoto.R,sx,sy)
shade = clamp(originalPlate.R/max(neutralR,50),0.55,1.45)
cloth = clamp(wk.RGB*shade,0,255)
out = plate.RGB*(1-m)+cloth*m
chest = bilinear(chestImage,sx,sy)
ca = chest.A/255*m
out = out*(1-ca)+chest.RGB*ca
a = originalPlate.A/255
out = out*(1-a)+teamCapColorRGB*(originalPlate.R/255)*a
```

새 사진 자신의 옷 명암을 기준 사진 대비 비율로 바꾸므로 기존 donor 음영을 무조건 한 번 더 곱하지 않습니다. 가슴 심벌도 같은 의상 UV로 이동하며 단추 줄에서 잘라내지 않습니다. 얼굴/목/배경은 의상 마스크 밖에서 보존됩니다.

## v7 모자 · 임시 늘리기 금지

v7 사진은 생성 단계에서 모자를 깊게 썼습니다. **tools/gen-faces-v6b.py의 기존 선수용 모자 아래쪽 늘리기 임시 보정을 적용하지 않습니다.** 모자/챙 RGB나 마스크를 아래로 늘리지 마세요. 모자 변경은 위 키 색 교체뿐입니다.

심벌은 `cap_mark_transform_512=[sx,sy,tx,ty]`로 기존 전체512 심벌 이미지만 변환합니다. `(x',y')=(sx*x+tx,sy*y+ty)`. sx=sy라 심벌 비율을 보존합니다.256에서는 심벌512를256으로 축소하고 tx/ty만 절반으로 줄여 같은 sx/sy를 사용합니다. 심벌 알파에 원본 capMask를 곱해 모자 밖으로 새지 않게 합니다. 크라운 정면 중앙을 기준으로 배치했고 챙과의 측정 간격을 cap_fit_validation에 기록했습니다. 이 변환을 모자 사진 전체에 적용하지 마세요.

다음 선수 v6c도 cap_fit_spec.json처럼 생성 단계에서 낮게 fitted cap, 눈썹 가까운 챙, 거의 보이지 않는 이마,512 상단40px 이상 여백, 크라운 중앙/챙과 떨어진 심벌을 따릅니다. 이번 패키지는 v7 직원126명이며 v6c 선수는 생성하지 않았습니다.

## 검수·보관

이번126명7,875쌍과 v6b 선수100명12,600쌍을 같은 v6 ArcFace 모델·정렬로 검사했습니다. actual delivered256 RGB를 입력으로 썼고0.40은 바꾸지 않았습니다. NPZ에 실제 임베딩/ID, JSON에 고정 SHA·최근접 상대·초과 쌍을 보관했습니다. 후보 선별의 최소최대 상한 탐색값을 합격 기준으로 오해하지 마세요.

검수판은 원본126명,3구단×감독·코치60명×128/256, 모자 확대20명, 단장6명씩6묶음입니다. 다른 구단·원정 합성 및 게임 연결을 완료했다고 주장하지 않습니다. source/portrait의 실제 유명인 사진 입력은 없으며, 실존 인물 유사성의 육안 검토는 모든 실존 인물과의 전수 검색이 아닙니다.

archive ZIP3개는512 정규화126장+낱장128/256 252장입니다. 배포는 runtime_files만 하며 ZIP·PNG 검수판·NPZ·보고서를 포함하지 않습니다. 캐시 키에는 identity_id+team+kit+v7을 포함합니다.
