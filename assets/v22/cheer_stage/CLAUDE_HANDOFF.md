# 사용자 검수 반영 v22 수정판 (revision 1)

지적한21명은 교체했고, 나머지 단발5명은 얼굴을 유지하는 방향으로 긴 머리로 수정했습니다. 총27칸을 수정했습니다. 원본 사진은22칸 보존했고, 그중21칸은 crop도 그대로입니다. 나머지1칸(orange05,index28)은 최종 압축 후 눈높이 기준을 맞추기 위해 전체 crop만1.54% 작게 조정했습니다. 얼굴·머리·의상은 변경하지 않았습니다. 48명의 runtime id/index/역할/색 계열이 모두 이전과 같습니다. 같은 번호의 새 사진으로 교체하시면 됩니다.

이번48명에 단발은 없으며, 긴 웨이브·긴 포니테일·긴 반묶음을 사용했습니다. 검정 머리와 갈색 계열 염색을 섞었습니다. 교체한 팀장은24세 성인 캐스팅으로, 팀장이라는 이유로 나이 든 얼굴을 만들지 않았습니다.

비교판 `previews/revision_before_after.png`는 각 쌍의 왼쪽 BEFORE, 오른쪽 AFTER입니다. 원본/crop 보존 내역과 같은 인물의 머리 수정 참고값은 `validation/revision01_changes.json`, 조사 출처와 수정 범위는 `REVISION_NOTES.md`에 있습니다. 단원40·팀장8명,3개 시트 규격과 기존 경로는 같습니다. 수치 통과와 별도로 아래 전체 비교판을 검토할 수 있습니다.

# v22 치어리더 무대 사진 최종 인계

단원40명 + 팀장8명, 색8개×(단원5+팀장1) 총48명의 새 가상 성인 응원단 사진입니다. 사용자의 추가 지시인 실제로 있을 법한 한국인 성인 인상, 자연스러운 얼굴 비율과 피부 질감을 반영했습니다. 같은 색은 같은 의상 디자인으로 맞췄고, 전부 밤 야구장 조명입니다. 활짝 웃음34명·미소14명이며 V 손짓은 계열당1–2명입니다.

브랜치 `assets/v22-cheer-review`, 루트 `assets/v22/cheer_stage/`. 최종판은 `manifest.json`, `validation.json`, `sheets/`, `previews/by_color.png`, `previews/all_256.png`, `previews/all_128.png` 입니다. `production_complete=true`, `asset_validation_passed=true`, `runtime_ready=48`을 확인했습니다. `checkpoints/`와 `previews/progress_256.png`는 제작 이력이며 런타임 경로로 쓰지 않습니다.

## 시트와 칸 계산

- `sheets/cheer_stage_512.webp`: 4096×3072, 8열×6행, 1,217,518 bytes, 손실 WebP q80.
- `sheets/cheer_stage_256.webp`: 2560×2560, 10열×10행, 448,300 bytes, 손실 WebP q80.
- `sheets/cheer_stage_128.webp`: 1280×1280, 10열×10행, 172,138 bytes, 손실 WebP q80.

512는8열,256·128은10열입니다. 해상도를 바꿀 때 열 수를 함께 바꿔야 합니다. 모든 칸은 정사각이며 간격·여백0입니다.256·128은48칸 뒤52칸을 검정으로 채웠습니다. 손실 WebP의 미세 경계 복원 오차는 validation의 empty_decoded 항목에 기록했습니다.

`n=512`이면 `cols=8`, 아니면 `cols=10`. `rect=[(index%cols)*n, floor(index/cols)*n, n, n]`. 실제값은 각 identity의 `rects[해상도]`를 우선하세요. `rect` 기본값은512용입니다. `path_base` 뒤에 `_512.webp`, `_256.webp`, `_128.webp`를 붙이며, 정확한 저장소 경로는 `sheets[해상도].repository_path`입니다. 카드에는512시트를 써서185px급 카드의 배율2 화면에도 충분한 픽셀을 제공합니다.

## 구단 색 배정

| uc | 대표색 | 단원 index (cheer22) | 팀장 index (ccap22) |
|---|---|---|---|
| red | #D3263A | 0–4 | 5 |
| navy | #172A50 | 6–10 | 11 |
| blue | #2161C6 | 12–16 | 17 |
| black | #181C24 | 18–22 | 23 |
| orange | #F3792A | 24–28 | 29 |
| green | #16835A | 30–34 | 35 |
| purple | #7546AD | 36–40 | 41 |
| sky | #62BCE6 | 42–46 | 47 |

구단 대표색에 가장 가까운 uc의 단원5명을 먼저 배정하고, 단원이 더 필요하면 비슷한 색 계열의 `r=cheer22` 후보에서 보충합니다. 팀장에는 같은 uc의 `r=ccap22`1명을 씁니다. 단원·팀장 합계가 계열당6명이며, 단원 풀을 만들 때 팀장 index를 섞지 않습니다. 기존 저장 번호 `m.ph15`를 재해석하지 말고 새 키 `m.ph22`로 재배정하고 저장하세요. `index`가 실제 시트 칸 번호이며 기존 캐스팅 시안의 번호와 다릅니다. 그 밖의 저장 필드·배정 알고리즘·게임 연결은 Claude 작업입니다.

## 검수와 출처

- 128px: 신규끼리 최대 0.399675667, 기존116명과 최대 0.374706507; 모두 raw cosine <0.40.
- 256px: 신규끼리 최대 0.385354996, 기존116명과 최대 0.392861933; 모두 raw cosine <0.40.
- 512px: 신규끼리 최대 0.398134887, 기존116명과 최대 0.394055367; 모두 raw cosine <0.40.

해상도마다 신규끼리1,128쌍·기존116명과5,568쌍을 최종 WebP를 디코딩한 실제 rect에서 검사했습니다. InsightFace 기본5점 정렬 norm_crop112, buffalo_l w600k_r50의 정규화 원시 cosine입니다.512는 기존 자료의 최대 원본인256과 비교하고 기존 사진을 확대하지 않았습니다. 모델SHA·픽셀SHA·최근접 상대·랜드마크·얼굴 높이와 눈높이·머리 여백은 `validation.json` 및 `validation/final_pixel_measurements.json`에 있습니다. 특징벡터와 기존 비교벡터는 `validation/arcface_embeddings.npz`에 있습니다. 정렬은 인식 분석에만 사용했으며 납품 사진을 얼굴 기준으로 왜곡하지 않았습니다.

512사진은 새로 생성한512px 이상 원본에서 전체 사진 영역을 잘라 축소했습니다. 각 `native_crop_edge>=512`이며256·128은 같은RGB512마스터에서 축소했습니다. 작은 합성 인물 캐스팅 자료는 이미지 생성용 참고일 뿐 런타임 확대 재료가 아닙니다. 원본 생성 사진은 `/workspace/generated_images`에 변경 없이 보존했고, manifest에 원본SHA와 전체 사진 crop·원본 시트에서의 tile rect를 기록했습니다. 원본이4분할 생성판인 경우 `whole_photo_crop_xyxy`는 해당 native tile 기준이고 `source_original_tile_rect_xyxy`는 전체 생성판 기준입니다. 이 좌표들은 런타임 `rect`와 별개입니다.

최종 압축 방식은 용량만 보고 정한 q80·method6이며 모든 해상도에 동일하게 고정했습니다. 실제 최종 픽셀 재검사에서 탈락한 초안과 과거 정렬·캐스팅 검수 이력은 `validation/` 및 `checkpoints/`에 남겼습니다. 최종 연결에는 위 최종 manifest만 사용하세요. 실제 인물·연예인 이름이나 실제 구단 로고를 생성 참고로 사용하지 않았습니다.

이번 브랜치에는 에셋과 인계·검수 자료만 있습니다. `src/`, `index.html`, 기존 빌드·검사 코드는 변경하지 않았으며 main에 병합하지 않았습니다.
