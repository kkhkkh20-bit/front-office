# Claude handoff — v13 production60

에셋만 포함한 리뷰 브랜치 `assets/v13-faces-review`. main에 병합하지 않았습니다. `src/`, `index.html`, 빌드·검사 코드에 손대지 않았습니다.

납품 루트: `assets/v6/batch01d/production60/`

`manifest.json`을 기준으로 기존 v6c100명 풀에60명을 추가하면 됩니다. 새 ID는 `v6d60_001`~`v6d60_060`. 앱에는 `runtime_files`의128 시트10개만 포함하고256 시트와 검수판은 사이트용 별도 파일로 사용하세요. 시트 경로는 저장소 루트 기준이며, 사진은 각 `rect` 안에 있습니다. 시트피치와8px검정 여백을 혼동하지 마세요.

출신 세부 할당: US White7, Canadian2, US Black7, Dominican5, Venezuelan4, Cuban2, Puerto Rican1, Japanese3, Taiwanese2, Australian White1, Australian Asian1, Filipino1, Korean24. 외국인 수염13/36.

검수 수치·한계·용량은 README와 validation.json에 있습니다. ArcFace0.40은 기존 v6c와 동일하게 독립 인물 선검수 범위입니다. 완성 의상 사진끼리의 교차 점수는 참고 수치로 공개했으므로 전체 최종 사진이0.40미만이라는 의미로 해석하지 마세요. 동일인 유지0.60과 자기 인물 최근접1위는 실제128/256WebP 모두에서 확인합니다.

게임 코드 연결/인라인 용량/실제 선수 카드 렌더링 검토는 후속 작업입니다.
