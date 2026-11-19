> **최종 선택 확정 (2026-11-19): A1 / B7.** 사용자 “7로” 응답으로 1단계 승인이 완료되었습니다. 규정 경로는 확정본입니다. 아래 선택 대기 설명은 이전 시안 검토 이력입니다. 2단계 제작을 시작했으며, 사진 납품 완료 여부는 `../expansion_kits/manifest.json`을 확인하세요.

# Claude 인계 — v23b 1단계 revision 3

브랜치: `assets/v23b-review`. 경로: `assets/v23b/crests/`.

**A1은 사용자 선택으로 확정. B7/B8/B9은 선택 대기.** `teams.json.selection`은 `expansion_a: A1`, `expansion_b: null`입니다. A1 후보의 SVG/PNG 바이트는 이전 납품 그대로입니다. `a1_preservation.json`으로 확인합니다.

현재 선택판은 `previews/candidates_expansion_b_revision3.png`입니다. B1~B6은 이력으로만 남았으며 `superseded`입니다. 왕관 자체가 조잡하다는 추가 피드백에 따라 공·왕관을 쌓는 구성을 없애고, 곡선과 빈 공간으로 조형한 단일 왕관 마크를 새로 만들었습니다. XII 밴드를 왕관 하단에 통합했습니다. 공식 MLB 마크 조사 출처와 판단은 `MLB_REFERENCE_NOTES.md`에 있습니다.

규정 경로의 A는 확정된 A1이고, B는 **B7의 검토용 사본**입니다. B7이 선택된 것이 아니므로 연결·사진 교체를 시작하지 마세요.

요청서 [3절](../../../docs/asset-requests/2026-11-19-codex-v23b-expansion-crests.md#3-진행-순서-2단계-1단계-승인-후-2단계)의 “1단계 승인 후 2단계”, “사용자가 고른 시안으로 최종본” 지시를 따릅니다. 남은 선택은 B 하나입니다.

평면 SVG와 파생 입체 SVG는 각 후보의 `svg/`, `svg/relief/`에 있습니다. 생성형 래스터 콘셉트 연구판은 `previews/concept_study_revision3.png`이고, 실제 납품 SVG는 네이티브 Bézier 도형으로 새로 그린 별도 파일입니다. 이미지 임베딩이 아니며, 콘셉트와 세부 곡선은 다릅니다. PNG 크레스트 512/256/128, 마크 128/64/32/20/16/14입니다. `compare_with_v2_dark_light.png`는 기존 10개와 A1/B7/B8/B9을 같은 캔버스 크기로 비교하며 실제 픽셀 크기 줄도 포함합니다.

## 선택 이후에만 진행할 일

1. 선택한 후보로 규격 경로를 확정하고 선택 기록을 남깁니다.
2. 새 `assets/v23b/expansion_kits/` 아래에서만 v23 840장 가슴·모자 엠블럼 교체를 수행합니다. 기존 `assets/v23/expansion_kits/`는 수정하지 않습니다.
3. 얼굴·헤어·안경·수염·색·무늬·구도를 유지합니다. 단순화된 글자 없는 마크를 사용합니다.
4. ArcFace 0.60 이상, 자기 인물 1순위, 얼굴 중심 ±4px, 256px 사진에서 마크 가독성, 무작위 20명 확대 비교를 검수합니다. **이 검수는 아직 수행하지 않았습니다.**
5. 요청서의 20시트와 manifest/validation/previews/checksums를 별도 납품합니다. schema_version은 `v23b-expansion-kits-1`입니다.

본 1단계에서는 src/, index.html, 빌드·검사 코드, 기존 에셋을 수정하지 않았으며 main 병합도 하지 않았습니다.
