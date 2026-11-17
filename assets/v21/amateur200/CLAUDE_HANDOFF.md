# v21 — 미완료 중간 결과

목표는 새 아마추어 200명, 13종 2,600장, 최종 RGB WebP 아틀라스 78장입니다. 현재 작업은 검토용이며 `production_complete=false`, `asset_validation_passed=false`입니다. 게임 코드는 수정하지 않았고 main에 병합하지 않습니다.

`family_review_manifest.json`에는 새로 제작한 가족별 사진·생성 원본·크롭·세 크기 내보내기와 SHA256이 있습니다. 인물 ID와 설계 나이는 임시값이며 게임에 고정 배정하지 마세요. `previews/family_cohort_*_13variants.png`와 `previews/all_review_families_hs_home_256.png`에서 확인합니다. 사진 없는 칸은 아직 제작 전입니다.

최신 인원·사진 수와 보류 건수는 `validation.json`, 세부 수치는 `validation/families/production_audit.json`을 봅니다. 같은 인물의 존재하는 모든 변형 쌍, 다른 인물의 모든 존재하는 사진 조합, 기존 486명 기준 원본과 세 크기를 원시 ArcFace 코사인으로 비교했습니다. 기존 384 비교 기준은 기존 세트의 256 원본입니다. 임계값은 같은 인물 >=0.60, 다른 인물 <0.40이며 v20b의 예외는 적용하지 않습니다.

`review/partial_atlases/`는 선택된 일부 인물만 채운 39장 실험판입니다. 빈칸이 많고 정식 `sheets/`가 아닙니다. 이 실험판을 실제 디코딩한 사진의 별도 측정은 `validation/families/atlas_audit.json`입니다. 개별 WebP가 통과해도 판 압축 후 수치가 달라질 수 있으므로, 최종 200명 78장을 만든 뒤 반드시 다시 측정해야 합니다. 다른 인물과 충돌하는 경우 얼굴을 바꾸어 강제로 맞추지 말고 보류 또는 새 인물 선별로 처리합니다.

연령 목표는 성인 직전의 골격에 앳된 인상이 남은 고교 후반, 그리고 대학 초반입니다. 어린아이처럼 보이는 시드는 제외했습니다. 모자는 깊이 쓰고 정상 비율·약한 미소·자연스러운 피부를 유지합니다. 보조 시각 검수는 실제 사람의 연령 승인으로 대체하지 않으며 전원 사람 검수 대기입니다.

앞서 올린 `review_manifest.json`의 230명 단일 사진 후보와 당시 84명 임시 선택·117명 상한 증명은 별도 초기 스냅샷입니다. 이후 추가 사진이나 새 원본에 그 상한을 적용하지 않습니다. 당시 생성 도구 한도 보고도 과거 기록입니다. 새 생성 원본은 전역 `/workspace/generated_images`에 모두 보존했고, 일부 원본 복사본은 `native/`에 있습니다. 이후 원본은 전역 생성 폴더에 그대로 보존하며, 저장소 밖 원본은 사진별 `native_storage`, `native_original_filename`, SHA256으로 표시했습니다. `verify_native_exports.py`는 원본 폴더를 `V21_NATIVE_ORIGINALS_DIR`로 지정해 전체 사진의 직접 축소를 검증합니다. 128px 확대나 얼굴·몸 합성은 사용하지 않았습니다.

재개 시에는 충돌 보류 인물을 교체하고 나머지 새 인물/13종 사진을 확충한 뒤, 고교 약60%·대학 약40%·안경 약10%를 맞추세요. 최종 아틀라스 규격은 `REQUEST.md`와 `validation/protocol.json`을 따릅니다. 최종 200명 사람 검수, manifest, 최종 미리보기, 전체 수치 검수, checksums가 끝나기 전 게임에 연결하지 마세요. 브랜치는 `assets/v21-review`입니다. 기준 main의 77_assets_ui.js에서는 요청서의 amIdx/amSrc/FACE21을 확인하지 못했으므로 Claude가 통합 대상 코드를 별도로 확인해야 합니다.

요청서 5절은 다른 인물의 비교 사진 조합을 명시하지 않습니다. 현재 보수적으로 모든 유니폼 사진끼리 비교하며, 대표 얼굴끼리인지 전체 13종끼리인지 사용자에게 범위 확인을 요청했습니다. 답변 전에는 범위나 임계값을 바꾸지 않습니다. 128판은 같은 q85의 lossy RGB WebP 안에서 method0/segments1/SNS0/filter0/sharpYUV로 출력 안정성을 높였습니다. 256/384는 q88/q89, method6입니다. 실제 디코딩 픽셀을 모두 확인했으며, 이전 측정 벡터 재사용은 픽셀 SHA256이 완전히 같은 크기에만 허용합니다. 원본과 ArcFace 모델·정렬·정규화·임계값은 바꾸지 않습니다. 최종 판을 다시 만들면 반드시 다시 검사합니다.

수치 통과 26명도 외관 승인 완료가 아닙니다. `validation/families/visual_review_notes.json`에 사진 위쪽 경계 흔적과 연령감 추가 보류를 기록했습니다. 출고 전 수정·재검사가 필요합니다.
