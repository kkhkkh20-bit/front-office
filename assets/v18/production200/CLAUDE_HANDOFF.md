# v18 production200 — 유니폼 제작 중

**미완료입니다. 아직 게임에 연결하지 마세요.**

브랜치: `assets/v18-review`. 게임 코드는 수정하지 않았고 main에 병합하지 않습니다.

200명 원본 선검수와 외형 검수가 끝났습니다. `identity_prescreen/approved_roster.json`, `identity_prescreen/validation.json`, `identity_prescreen/masters256/`에서 확인할 수 있습니다. 새 인물끼리19,900쌍, 기존160명과32,000쌍을 원본 v6c/v13 ArcFace/LMEDS 방식으로128·256 각각 검사했고 모두0.40미만입니다. 실제 원점수는 `validation/prescreen_128.csv.gz`, `validation/prescreen_256.csv.gz`에 있습니다.

나이는 가상 인물의 최종 설정입니다. 외형 검수에 따라 5명만 최초 생성 나이에서1살 조정했고, 원래 값과 최종 값은 `identity_prescreen/provenance.json`에 기록했습니다. 국내 수염19/120명, 외국인 수염30/80명, 안경21/200명이며 국내18~22세는 모두 수염이 없습니다.

현재10구단 전체 인물 사진2,000장 제작을 진행하고 있습니다. 최종40WebP 시트·구단 간 동일인 검수·미리보기·납품 해시는 아직 완료되지 않았습니다. 최종 `asset_validation_passed`와 `production_complete`는 false입니다.
