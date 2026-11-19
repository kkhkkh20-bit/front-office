# Claude 인계 — v23b 확장 유니폼 엠블럼 교체 완료

**제작·검수 완료.** 사용자가 A1과 B7을 선택하고, 원본 보존을 위한 프로그램 부분 합성 방식도 승인했습니다. 납품은 `assets/v23b-review` 브랜치에 한정하며 main에 병합하지 않았습니다.

## 사용할 에셋

- manifest: `assets/v23b/expansion_kits/manifest.json`
- schema_version: `v23b-expansion-kits-1`
- path_base: `assets/v23b/expansion_kits/`
- 420명 × 2구단 =840장, 시트20장
- 새 인물 없음. 기존 v23 id/index/묶음/rect 그대로 사용
- `expansion_a`: A1 마크, 기존 녹색·골드 유니폼
- `expansion_b`: B7 마크, 기존 퍼플·실버 유니폼
- 큰 UI 크레스트는 `assets/v23b/crests/svg/primary/{key}.svg` 및 `png/crest/{512,256,128}/{key}.png`
- 사진과 모자에는 `crests/svg/mark/{key}.svg`에서 만든 글자 없는 마크를 적용
- `expansion_kits/badges/{key}.png`는320px RGBA 마크 보조 에셋

## 시트와 칸 계산

시트 구조: `sheets/{v6c,v13,v18A,v18B,staff}/{128,256}/{expansion_a,expansion_b}.webp`.

10열 ×10행. 칸 크기n, padding8, pitch=n+16. 128시트는1440², 256시트는2720²입니다.

`rect=[(index%10)*(n+16)+8, floor(index/10)*(n+16)+8, n, n]`

v18은 기존처럼 A/B 두 시트이며 각 시트 index0~99입니다. 실제로는 `identities[].variants[team].sheets[resolution]`의 path/rect를 그대로 사용하는 것이 안전합니다. 이 path/rect는 기존 v23와 동일하고 path_base만 v23b로 바꿉니다. 없는 칸은 검정 빈칸으로 남겼습니다.

## 검수 결과와 보존 범위

최종 손실 WebP 1,680건(840장 ×2해상도)을 재디코드해 원 인물420명 전체 갤러리 및 해당 팀의 v23 인물420명 갤러리와 비교했습니다. 모두 자기 인물1순위, ArcFace0.60이상, bbox/5점 중심오차±4px 통과입니다.

- 원 인물 대비 최소 코사인: 0.632123828
- 원 인물 대비 최대 중심오차: 3.265594482px (256기준)
- v23 대비 최소 코사인: 0.935493946
- v23 대비 최대 중심오차: 3.811485291px (256기준)

합성 작업본에서는 엠블럼 제거 마스크와 새 마크 알파 영역 밖의 모든 픽셀이 동일합니다. 보호한 얼굴 띠도 동일 해시입니다. 최종 손실 WebP의 압축 차이는 별도로 기록했으며, 최종 파일이 마스크 밖에서도 픽셀 동일하다고 주장하지 않습니다.

모자840개와 원본에서 보이는 가슴822개를 교체했습니다. 기존 가슴 엠블럼이 보이지 않는18건은 임의로 새 가슴 위치를 만들거나 프레임을 바꾸지 않았습니다. 목록은 `validation/emblem_placements.json`, `render_provenance.json`에 있습니다. 원본에서 하단에 걸린 가슴 마크는 새 마크도 같은 위치에서 자연스럽게 잘릴 수 있습니다.

v13의 최초 인물 참조는 실제128px입니다. 이번에는 기존 v23의128/256 런타임을 각각 읽고 엠블럼만 처리했으며 인물 원본이 native256이라고 바꾸어 표기하지 않았습니다.

## 검수 자료

- `validation.json`: 최종 판정과 모든 원시 측정값
- `validation/final_measurements.json/.npz`: 최종 디코드 얼굴 측정 및 임베딩
- `validation/reference_measurements.json/.npz`: 원 인물 참조 갤러리
- `validation/pixel_preservation.json`: 합성 전후 마스크 밖/얼굴 띠 해시
- `validation/codec_face_differences.json`: 최종 손실 압축 차이
- `validation/render_provenance.json`: 소스 커밋·시트/마크 해시·합성 방식
- `validation/visual_review.json`: 전체840개 모자·822개 가슴 확대 검수
- `previews/random20_before_after_1~4.jpg`: 고정 시드 층화 무작위20명, 양팀40버전의 전후 비교와 확대
- `previews/all_portraits_00~09.jpg`: 전체 사진
- `previews/cap_all_00~09.jpg`, `chest_all_00~09.jpg`: 전체 엠블럼 확대판
- `checksums.sha256`: 이 디렉터리의 전체 파일 해시

기존 v23의 별/방패 `badges/`를 재사용하지 마세요. 새 manifest의 badges는 A1/B7 마크를 가리킵니다. 기존 v2/v23 및 게임 코드·빌드·검사 파일은 변경하지 않았습니다. 게임 연결·배포는 Claude 담당입니다.
