# v6c production100 게임 연결 안내

납품 위치: `assets/v6/batch01c/production100/`

브랜치: `assets/v6c-production-review`

상태: 100명 × 10구단 홈 1,000장 제작·에셋 검수 완료, 게임 연결 검토 대기.

이번 변경은 에셋 파일만 추가합니다. 게임 연결 코드는 포함하지 않았습니다.

## 읽을 데이터

`manifest.json`의 `path_base`를 기준으로 다음 경로를 읽습니다.

```text
identities[i].variants[team].sheets["128"].path
identities[i].variants[team].sheets["128"].rect
identities[i].variants[team].sheets["256"].path
identities[i].variants[team].sheets["256"].rect
```

예: `v6c100_001`, `seoul_comets`, 256px → `sheets/256/seoul_comets.webp`, `[8,8,256,256]`.
`v6c100_100`은 같은 시트에서 `[2456,2456,256,256]`입니다.

`rect`는 픽셀 좌표 `[x,y,width,height]`입니다. 사진 번호를 0부터 `i`, 크기를 `n`이라 하면 `x=(i%10)*(n+16)+8`, `y=floor(i/10)*(n+16)+8`입니다. 전체 시트는 `(n+16)*10`의 정사각형입니다. 8px 패딩은 사진 좌표 밖에 있으므로 manifest rect만 표시합니다.

구단 키는 다음 10개입니다.

```text
seoul_comets, seoul_hounds, incheon_seagulls, suwon_sparks,
goyang_storm, daejeon_redfox, gwangju_blazes, daegu_thunders,
busan_waves, changwon_anchors
```

동일 인물 ID를 구단 변경 시에도 유지하고 `variants[team]`만 바꿉니다. 128·256 시트 모두 인물 순서가 같습니다. 시범판 ID와 이번 ID는 별도이며, `source_candidate_id`는 제작 증빙용입니다. 새 가상 선수 데이터에 적용하는 나이는 게임 설정에 맞게 매핑하고, manifest의 나이는 외형 제작 설정으로 취급하면 됩니다.

완성된 RGB 사진을 그대로 사각형으로 표시하는 방식입니다. 모자 마스크·정렬 시트·키 색 변환은 없습니다. 기존 v6b용 모자 늘리기·UV 의상 입히기·사진 아래로 내리기 처리는 이 세트에 적용하지 않습니다. 머리 위 여백도 사진 안에 포함되어 있습니다.

## 용량과 캐시

런타임 이미지 20장 합계 10,607,372바이트입니다. `runtime_files`에 manifest와 시트만 나열했습니다. 목록·작은 카드에는 128, 선수 상세 큰 사진에는 256을 사용하면 됩니다. 필요한 구단·해상도의 시트만 지연 로드하고, 인물 캐시 키에 버전·인물 ID·구단·홈을 포함하면 구단 변경 시 잘못된 유니폼 재사용을 피할 수 있습니다.

선검수 원본·임베딩·전원 PNG 비교판·확대판은 검수 자료이므로 게임 에셋 선로딩 대상에서 제외합니다. WebP 파일별 바이트·치수·SHA256은 manifest의 `sheets`에 있습니다. 전체 파일 해시는 `checksums.sha256`입니다.

## 검수 범위

- 인물 선검수는 의상 편집 전 새 100명 4,950쌍, 최대 코사인 0.3997032344로 0.40 미만입니다. `identity_prescreen/stage1_gate.json`과 원본·임베딩·전 쌍 점수를 보존했습니다.
- 최종 WebP의 구단 간 동일인 4,500쌍씩을 각 크기에서 비교했습니다. 최저 128px 0.8444136381, 256px 0.8579791784로 모두 0.60 이상입니다. `validation/same_identity_pairs.json`에 9,000쌍이 있습니다.
- 최종 사진의 서로 다른 인물 점수는 별도 참고 통계이며 모두 0.40 미만은 아닙니다. 기존 v6b와의 교차 비교도 0.40 이상 7쌍이므로 새 세트와 기존 세트를 합친 200명 통과로 해석하지 않습니다. 세부 값과 적용 범위는 README·validation.json에 명시했습니다.
- `previews/*_all100_256.png`는 최종 256 WebP의 전원 사진입니다. `previews/random20/`은 무작위 20명의 전 구단 모자·칼라 확대판, `validation/headroom/`은 512 기준 40px 여백에 해당하는 128px y10 가이드 검수판입니다.

에셋 검수 상태와 게임 연결 상태를 구분하기 위해 manifest는 `asset_validation_passed:true`, `production_complete:true`, `review_status:"pending_game_review"`로 기록했습니다. 사용자 게임 검토 후에 이 브랜치의 병합 여부를 결정합니다.
