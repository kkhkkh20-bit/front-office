# v21 인계 — 미완료, 게임 연결 대기

요청서는 `REQUEST.md`이며 목표는 새 한국인 남자 아마추어 200명, 13변형 2,600장, RGB WebP 아틀라스 78장입니다. **현재는 후보 검토 단계이고 정식 납품이 아닙니다. `production_complete=false`, `asset_validation_passed=false`입니다.**

## 확보한 자료

- `review_manifest.json`에 고교 홈 후보 230장의 경로·원본·크롭·가상 설계 나이가 있습니다. 후보 ID를 게임 선수에게 고정 배정하지 마세요.
- `native/hs_home/base_000.png`~`base_022.png`는 각 2열×5행 생성 원본의 변경 없는 복사본입니다. SHA256을 보존했습니다. 각 사진은 중심 정사각형 크롭 392px 이상에서 직접 축소했습니다. 128px 확대나 얼굴·몸 합성은 하지 않았습니다.
- `review/candidates/{128,256,384}/`의 후보 파일 690개를 실제 디코딩한 픽셀로 측정했습니다. q85/q88/q89, RGB입니다. 최종 아틀라스 측정 결과가 아닙니다.
- 기존 기준 486명 대비 세 크기 모두 원시 코사인 <0.40인 후보는 227명입니다. 시각 결함 보류와 후보 사이 충돌까지 반영한 단일 사진 임시 선택은 84명입니다. 84명이 최대 독립 집합이라는 주장은 하지 않습니다.
- `validation/disjoint_collision_certificate.json`의 서로 겹치지 않는 충돌 쌍으로 현재 고정 사진 묶음의 선택 가능 인원이 117명 이하임을 검증할 수 있습니다. 사진을 다시 만들거나 새 인물을 추가한 경우에는 다시 측정해야 합니다.
- 안경 반사로 눈이 가려진 후보는 `hold_visual_defect`로 남겼습니다. 연령은 전원 사람 검수 대기입니다. 나이·level은 가상 설계값이며 최종 승인값이 아닙니다.

## 재개할 순서

1. 추가로 서로 구분되는 새 가상 인물 또는 적합한 원본 사진을 확보합니다. Adobe 도구는 일일 한도, Higgsfield는 기존 크레딧 부족으로 추가 새 얼굴 생성이 막혔습니다. 도구 응답은 `validation/generation_blockers.json`에 기록했습니다. 임계값을 완화하지 않습니다.
2. 전체 200명을 새로 선별하고 고교 약60%·대학 약40%, 안경 약10%를 맞춥니다. 현재 임시 84명도 새 후보와 다시 비교해야 합니다. 전역 작업 폴더 `/workspace/front-office-v21/assets/v21/amateur200/work/`에 후보 380명의 시드 검수와 전체 생성 기록이 남아 있습니다. 전역 생성 원본 `/workspace/generated_images`는 보존 대상입니다.
3. 같은 인물로 `hs_away`, `univ`, 프로 홈 10종을 생성합니다. 아마추어 3종은 글자·숫자·로고 없는 유니폼/모자, 모자는 깊이 착용, 정상 비율, 옅은 미소를 유지합니다. 13장 모두 같은 얼굴·머리·안경이어야 합니다. 각 변형은 동일한 기준 원본에서 시작해 순차 편집 누적을 피합니다.
4. 프로 구단 순서는 `seoul_comets, seoul_hounds, incheon_seagulls, suwon_sparks, goyang_storm, daejeon_redfox, gwangju_blazes, daegu_thunders, busan_waves, changwon_anchors`입니다. 최신 v6 production60 manifest의 `home_kit`, `cap_color`와 v18 모습에 맞춥니다. 현지 작업 폴더 `work/kits/`에 유니폼 참조가 있습니다.
5. 최종 78개 아틀라스를 원본 크롭에서 직접 만들고 실제 디코딩한 아틀라스 픽셀을 다시 측정합니다. pitch144/272/400, inset8, 사진128/256/384, q85/88/88~90, RGB, A/B 각100명, 10×10입니다.
6. 같은 인물의 13변형 모든78쌍 >=0.60, 다른 인물 <0.40을 크기별로 검사합니다. v20b의 기존 쌍 기준 완화 규칙은 v21에 적용하지 않습니다. 가능한 모든 최종 사진 쌍을 비교한 검수 범위를 정확히 기록합니다.
7. 실제 사람에게 최종 200명의 17~22세 인상을 검토받습니다. 보조 시각 검수로 사람 검수를 완료 처리하지 않습니다.
8. 최종 `manifest.json`, `previews/all200_hs_home_256.png`, 무작위10명×13변형 비교판, checksums와 인계서를 완성합니다. 현재 정식 manifest와 runtime `sheets/`는 없습니다.

## 코드 및 브랜치

브랜치는 `assets/v21-review`이며 main 병합과 게임 코드 수정은 하지 않았습니다. 기준 main은 `656eb75f8b475ac5a8e7c8f93931c853a1b6a844`입니다. 이 기준의 `src/ui/assets/77_assets_ui.js`에서는 요청서의 `amIdx`, `amSrc`, `FACE21` 문자열을 확인하지 못했습니다. 현재 자산 작업과 별도로 Claude가 통합 대상 코드 상태를 확인해야 합니다. FACE21 번호표를 이미 연결했다고 가정하지 마세요.
