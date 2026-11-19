# Claude 인계 — v23b 1단계

납품 브랜치: `assets/v23b-review`.
경로: `assets/v23b/crests/`.
상태: **팀별 3개 시안 검토 대기. 사진 교체 및 게임 연결 금지.**

요청서 [3절](../../../docs/asset-requests/2026-11-19-codex-v23b-expansion-crests.md#3-진행-순서-2단계-1단계-승인-후-2단계)의 지시:
> 2단계, 1단계 승인 후 2단계
> 사용자가 고른 시안으로 최종본을 만듭니다.

사용자가 A1/A2/A3 하나, B1/B2/B3 하나를 선택해야 합니다. `teams.json.selection`은 아직 null입니다. 규격 경로의 A1/B1은 검토용 사본이므로 자동 선택하거나 게임에 연결하지 마세요.

## 검토 경로

`previews/candidates_overview.png`에서 6개를 한 번에 비교합니다. `candidates_expansion_a.png`, `candidates_expansion_b.png`는 팀별 밝은/어두운 배경입니다. `compare_with_v2_dark_light.png`는 기존 v2 10개 원본과 후보 6개를 동일한 174px 캔버스로 비교하고, 크레스트 128/64/32와 마크 32/20/16/14 실제 픽셀 크기를 담습니다.

기본 원본은 각 후보 `svg/primary.svg`, `svg/mark.svg`입니다. `svg/relief`와 PNG는 그 벡터의 파생본입니다. 모든 파일 경로는 `teams.json`의 path_base에 대한 상대 경로입니다. 후보의 마크 PNG는 128/64/32 외에 20/16/14도 제공합니다.

## 선택 이후에만 진행할 일

1. 선택한 후보로 규격 경로를 확정하고 선택 기록을 남깁니다.
2. 새 `assets/v23b/expansion_kits/` 아래에서만 v23 840장 가슴·모자 엠블럼 교체를 수행합니다. 기존 `assets/v23/expansion_kits/`는 수정하지 않습니다.
3. 얼굴·헤어·안경·수염·색·무늬·구도를 유지합니다. 단순화된 글자 없는 마크를 사용합니다.
4. ArcFace 0.60 이상, 자기 인물 1순위, 얼굴 중심 ±4px, 256px 사진에서 마크 가독성, 무작위 20명 확대 비교를 검수합니다. **이 검수는 아직 수행하지 않았습니다.**
5. 요청서의 20시트와 manifest/validation/previews/checksums를 별도 납품합니다. schema_version은 `v23b-expansion-kits-1`입니다.

본 1단계에서는 src/, index.html, 빌드·검사 코드, 기존 에셋을 수정하지 않았으며 main 병합도 하지 않았습니다.
