> **최종 선택 확정 (2026-11-19): A1 / B7.** 사용자 “7로” 응답으로 1단계 승인이 완료되었습니다. 규정 경로는 확정본입니다. 아래 선택 대기 설명은 이전 시안 검토 이력입니다. 2단계 제작을 시작했으며, 사진 납품 완료 여부는 `../expansion_kits/manifest.json`을 확인하세요.

# v23b 크레스트 — 1단계 revision 3

**A1 확정, B7/B8/B9 선택 대기.** A1의 SVG/PNG는 이전 납품 원본을 그대로 보존했습니다. 840장 사진 교체는 B 최종 선택 이후입니다.

[현재 시안: B7/B8/B9, 밝은/어두운 배경](previews/candidates_expansion_b_revision3.png)

| 시안 | 이름 | 방향 |
|---|---|---|
| B7 | REGAL SCROLL | 넓은 좌우 갈래와 곡선 스크롤, 중앙의 높은 갈래로 정통형 왕관 구성 |
| B8 | SWEEP CROWN | 앞쪽으로 흐르는 비대칭 갈래와 날렵한 빈 공간으로 스포츠 인상 |
| B9 | HERITAGE CROWN | 둥근 끝 장식 5개와 아치로 구성한 클래식 왕관 |

이전의 공 위에 왕관을 얹는 구성을 없앴습니다. 하나의 왕관 실루엣 안에 곡선 밴드를 통합했고, 밴드의 XII 좌우에 작은 야구공 실밥을 넣었습니다. 이전처럼 다이아몬드·배트·방패를 쌓지 않습니다. 이 변경은 사용자의 “왕관모양이 저게 최선이니?”, “멋지게 좀 만들어주라” 피드백에 따른 재디자인입니다.

## 제작과 미리보기

- [생성형 디자인 연구판](previews/concept_study_revision3.png): 세 가지 왕관 방향을 탐색한 **래스터 콘셉트**입니다. 최종 벡터 파일이 아니며 글자도 없습니다.
- 실제 납품 후보는 그 방향을 바탕으로 새로 그린 **네이티브 Bézier SVG**입니다. 래스터 이미지를 SVG 안에 삽입하지 않았습니다. 콘셉트와 벡터의 세부 곡선은 다릅니다.
- XII는 기존 v2와 같은 Alfa Slab One Regular를 HarfBuzz로 조판한 실제 글리프 외곽선입니다.
- 마크는 XII와 미세한 실밥을 빼고 밴드 안에 큰 곡선 하나만 남겼습니다. 128/64/32/20/16/14px PNG를 제공합니다.
- 크레스트는 512/256/128px RGBA PNG입니다. `svg/primary.svg`, `svg/mark.svg`가 평면 4색 원본이고, `svg/relief/`와 PNG에는 짧은 아래 그림자를 적용했습니다.
- [기존 10구단과 비교](previews/compare_with_v2_dark_light.png): 동일한 174px 캔버스와 실제 128/64/32px 크레스트, 32/20/16/14px 마크를 밝은/어두운 배경에서 비교합니다.

이전 A2/A3와 B1~B6은 이력으로만 남겼습니다. 활성 B 후보는 B7/B8/B9입니다. 과거 비교판과 과거 검수 보고서는 현재 시안을 뜻하지 않습니다.

## 상태와 경로

`teams.json.selection`은 A1 / null이고 `approved=false`, `phase2_started=false`입니다. `svg/.../expansion_a.svg`, `png/.../expansion_a.png`는 확정된 A1입니다. **B의 규정 경로는 B7의 검토용 사본이며, B7이 선택되었다는 뜻이 아닙니다.** B 선택 후 해당 경로를 최종본으로 확정합니다.

검수 근거는 `validation.json`, `a1_preservation.json`, `typography.json`, `source_references.json`, `checksums.sha256`입니다. 실제 유니폼 위 가독성·얼굴 유사도 검수는 2단계에서 수행하며 아직 시작하지 않았습니다.

브랜치는 `assets/v23b-review`입니다. 기존 v2/v23, 게임 코드, 빌드·검사 코드는 변경하지 않았고 main에 병합하지 않았습니다.
