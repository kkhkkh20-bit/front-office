> **승인 완료·최종 반영:** 2026-11-18 KST, 사용자가 이 외형과 유사도0.60미만 기준을 승인했습니다. 최종본은 루트 `assets/v22/cheer_stage/manifest.json`의 revision2이며 production_complete=true입니다. `previews/revision02_idol_cast_before_after.png`에서 최종 전후 비교를 확인하세요. 아래 문서와 이 draft 폴더는 승인 전0.40기준에서의 탈락 이력을 보존한 자료이며, 현재 연결 경로가 아닙니다. 승인 기록은 `validation/revision02_similarity_policy.json`입니다.

# v22 아이돌 프로필 스타일 — 검토용 시안, 런타임 미반영

사용자의 추가 피드백에 따라 #8 navy03·#33 green04·#44 sky03은 기존 얼굴을 보존하는 화장 수정에서 새20대 성인 가상 인물 캐스팅으로 방향을 바꿨습니다. 실제 치어리더 공식 프로필과 경기 사진의 화장·헤어·사진 완성도를 스타일 기준으로 삼았습니다. 나머지45명은 원본 사진과 crop을 그대로 보존했으며,48명 모두 id/index/역할/uc를 유지했습니다.

## 확인할 사진

- `style_candidates_3.png`: 새 시안3명, 실제 후보512시트에서 자른 픽셀.
- `before_after_3.png`: 각 쌍 왼쪽 기존 통과본, 오른쪽 새 시안.
- `all48_by_color.png`: 새 시안을 넣은 전체48명 후보판.
- `sheets/`:512/256/128 후보 시트. 이 폴더 안에서만 검토합니다.

## 현재 상태와 필요한 결정

**최종 완료본이 아닙니다. 게임에 연결하지 마세요.** 원 요청서에는 “겹침 검사: ArcFace0.40미만”이라고 명시되어 있습니다. 실제 후보 시트의 원시 cosine 검수에서 신규끼리 최대0.553502083, 기존116명과 최대0.476058245로 나와 이 기준을 통과하지 못했습니다. 기준·모델·정렬·코덱·점수는 변경하지 않았습니다. 수치 조정이나 epsilon 없이 탈락 값을 그대로 남겼습니다.512구도 검사는48명 모두 통과했습니다.

예쁜 아이돌 프로필 인상을 우선해 기준을 완화할지, 원래0.40기준을 유지하고 캐스팅을 계속할지 사용자 선택을 요청한 상태입니다. 답변이 없다는 이유로 완화하지 않습니다. **기존 루트 manifest/sheets/validation과 인계 문서는 revision1의 통과본 그대로 유지합니다.** 이 draft의 manifest와 validation은 production_complete=false입니다.

## 자료

- `manifest_candidate.json`: 고정48칸·후보 원본SHA와 crop·상태.
- `validation_failed_original_threshold.json`:3개 해상도의 실제 후보 시트 raw ArcFace 점수·최근접 상대·구도·SHA.
- `actual_candidate_embeddings.npz`, `actual_candidate_pixel_measurements.json`: 측정값.
- `changes.json`:45명 원본 사진/crop 보존 검증.
- `provenance/`: 선택한 가상 인물 생성 이력. 생성 원본은 /workspace/generated_images에 변경 없이 보존.

스타일 조사: [LG 공식 응원단](https://www.lgtwins.com/fan/cheers), [김한나 경기 사진](https://sports.news.nate.com/view/20250531n08138), [안지현 경기 사진](https://www.xportsnews.com/article/2004704). 실제 사진은 런타임 에셋으로 쓰지 않습니다. main과 게임 코드는 변경하지 않습니다.
