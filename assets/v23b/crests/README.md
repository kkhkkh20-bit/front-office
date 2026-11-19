# v23b 크레스트 — 1단계 revision 2

**A는 사용자가 A1로 확정했습니다. B는 재검토 중입니다.** 840장 유니폼 교체는 B 선택 이후 시작합니다.

[현재 선택판: A1 + 새 B 시안 3개](previews/candidates_expansion_b_revision2.png)

| 선택 | 이름 | 변경 방향 |
|---|---|---|
| A1 확정 | CLASSIC LEAGUE | 기존 후보 원본을 그대로 보존 |
| B4 후보 | CROWN & BALL | 프레임 없는 큰 왕관 + 공 |
| B5 후보 | SWEEPING BASEBALL | 공과 곡선 중심, 작은 왕관, 프레임 없음 |
| B6 후보 | CLASSIC CROWN SHIELD | 방패를 남기고 왕관·공으로 단순화 |

사용자 피드백에 따라 B의 내야 다이아몬드 격자와 교차 배트를 제거했습니다. B4/B5는 외곽 프레임도 제거했습니다. MLB 공식 모자 로고 6개를 살펴보고 큰 실루엣, 여백, 적은 수의 모티프를 참고했습니다. 실존 로고의 그림이나 글리프는 사용하지 않았습니다. 관찰 근거와 출처는 [MLB_REFERENCE_NOTES.md](MLB_REFERENCE_NOTES.md)에 있습니다.

[기존 v2와 같은 크기의 밝은/어두운 배경 비교판](previews/compare_with_v2_dark_light.png)에는 A1과 B4/B5/B6, 기존 10구단이 들어 있습니다. 크레스트 128/64/32와 글자 없는 마크 32/20/16/14 실제 픽셀 크기도 포함했습니다. 이전 B1/B2/B3와 A2/A3 파일은 이력으로 남겨 두었으며 활성 후보가 아닙니다.

## 파일과 상태

- `candidates/{id}/svg/primary.svg`, `mark.svg`: 평면 4색 벡터
- 각 후보 `svg/relief/`: 짧은 아래 그림자·상단 테두리 하이라이트를 적용한 파생본
- 각 후보 `png/crest/`: 512/256/128 RGBA
- 각 후보 `png/mark/`: 128/64/32 및 검수용 20/16/14 RGBA
- 워드마크: v2와 동일한 Alfa Slab One Regular를 HarfBuzz로 조판한 글리프 외곽선. XI/XII만 사용
- `teams.json.selection`: A1 / null. `approved=false`, `phase2_started=false`
- `typography.json`, `source_references.json`, `MLB_REFERENCE_NOTES.md`: 제작·참조 근거
- `validation.json`, `a1_preservation.json`, `checksums.sha256`: 검수와 해시

**규정 경로 `svg/.../expansion_a.svg`, `png/.../expansion_a.png`는 확정된 A1입니다. B의 규정 경로는 B4의 검토용 사본입니다. B4가 선택되었다는 뜻이 아닙니다.** 사용자가 B를 고르면 선택본으로 해당 경로를 확정합니다.

기존 v2/v23와 게임 코드는 변경하지 않았습니다. `assets/v23b-review` 브랜치에서만 검토하며 main에 병합하지 않습니다. 실제 사진 배치와 ArcFace 검수는 2단계 작업으로 아직 수행하지 않았습니다.
