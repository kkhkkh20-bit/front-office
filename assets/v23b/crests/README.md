# v23b 크레스트 — 1단계 시안

**선택 대기 중입니다. 최종 승인본이 아닙니다.** 팀별 3개, 총 6개 시안입니다.

| 팀 | 시안 | 구성 |
|---|---|---|
| expansion_a / XI | A1 | 곡선 상단 방패, 중앙 야구공, 안쪽 월계수, 곡선 리본 |
| expansion_a / XI | A2 | 넓은 방패, 큰 야구공과 XI, 사다리꼴 리본 |
| expansion_a / XI | A3 | 세로 방패, 바깥 월계수, 곡선 리본 |
| expansion_b / XII | B1 | 정형 홈플레이트, 왕관과 내야, 곡선 리본 |
| expansion_b / XII | B2 | 넓은 홈플레이트 위로 돌출한 왕관, 큰 XII |
| expansion_b / XII | B3 | 세로 홈플레이트, 큰 내야 다이아몬드, 곡선 리본 |

- [전체 시안](previews/candidates_overview.png)
- [11번째 구단: 밝은/어두운 배경](previews/candidates_expansion_a.png)
- [12번째 구단: 밝은/어두운 배경](previews/candidates_expansion_b.png)
- [기존 10구단 v2 비교 및 실제 크기](previews/compare_with_v2_dark_light.png)

평면 SVG 원본은 4색입니다. 입체 SVG와 PNG에는 왼쪽 위 테두리 경사 한 단계, 면 위아래 두 톤, 아래로 6px 그림자만 적용했습니다. 외곽선은 512 기준 12px입니다. 워드마크는 기존 v2와 동일한 **Alfa Slab One Regular**를 HarfBuzz로 조판한 실제 글리프 외곽선입니다. 폰트 SHA-256도 v2와 같습니다. 글자는 리본의 XI/XII만 사용합니다.

작은 마크는 별도 벡터입니다. 리본과 글자를 제거하고, 월계수·실밥·내야의 세부를 줄였습니다. 32/20/16/14px 원본 크기는 비교판에 포함했습니다. 사진에 붙였을 때의 가독성 검수는 2단계에서 수행합니다.

## 파일

- `candidates/{A1,A2,A3,B1,B2,B3}/svg/primary.svg`, `mark.svg`: 평면 원본
- 각 후보의 `svg/relief/`: 같은 도형에서 파생한 입체판
- 각 후보의 `png/crest/`: 512/256/128 RGBA PNG
- 각 후보의 `png/mark/`: 128/64/32 및 검수용 20/16/14 RGBA PNG
- `teams.json`: v2 형식의 팀 경로 + 후보/선택 상태
- `typography.json`, `source_references.json`: 글꼴·요청서·기존 v2 참조 근거
- `validation.json`, `checksums.sha256`: 기술 검수와 전체 파일 해시
- `licenses/`: 글꼴 라이선스

**규정 경로 `svg/primary/{key}.svg`, `svg/mark/{key}.svg`, `png/.../{key}.png`는 A1/B1의 검토용 사본입니다. 선택을 뜻하지 않습니다.** `selection`은 둘 다 null이고 `approved=false`입니다. 사용자가 고르면 해당 경로를 선택본으로 확정합니다.

기존 v2, v23, 게임 코드는 수정하지 않았습니다. 리뷰 브랜치만 납품하며 main에 병합하지 않습니다. 840장 유니폼 교체는 아직 시작하지 않았습니다.
