# v21b 아마추어 선수 사진 — A100 + B100 완료

200명(고교120·대학80), 인물당12변형,3크기, 정식 RGB WebP 시트72장입니다. 안경은23명(11.5%)입니다. A 교체7명과 B 후보 수정·제외 사항을 반영했습니다.

- `stage_a_complete: true`, `stage_b_complete: true`
- `asset_validation_passed: true`, `production_complete: true`
- `human_age_review: pending` — 나이·인상에 대한 사용자 검토 대기

연결 규격은 [CLAUDE_HANDOFF.md](CLAUDE_HANDOFF.md), 최종 수치는 [validation.json](validation.json), 번호·설계 나이 확인판은 [A](previews/age_review_A_256.png)와 [B](previews/age_review_B_256.png)입니다. 런타임 입력은 `manifest.json`의200명이며, 기존 A100의 ID·인덱스·나이·레벨은 유지했습니다. 과거 후보·부분 실험판과 실패 시안은 제작 기록으로 보관하며 현재 런타임은 manifest가 지정한72장입니다.

납품 브랜치 `assets/v21-review`. 게임 코드 변경이나 main 병합은 하지 않았습니다.
