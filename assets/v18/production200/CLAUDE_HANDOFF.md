# v18 제작 중 — 게임 연결 금지

작업 브랜치: `assets/v18-review`. 에셋 외 파일 수정 없음. 아직 납품 완료가 아닙니다.

`production_status.json`이 현재 상태입니다. `work/planned_identities.json`은 요청서 비율에 맞춘 200명의 계획이며 생성 완료 명단이 아닙니다. 구단 규격은 v13 manifest의 teams를 `work/teams.json`에 원문 복사했습니다.

## 진행 결과

초기 시험 20명과 별도로 1차 후보를 20명씩 10묶음 생성했습니다. 한 이미지가 19칸으로 생성되어 실제 인물은 199명입니다. 이 묶음의 마지막 줄 5개 계획 슬롯은 순서 매핑을 신뢰할 수 없어 제외했습니다. 남은 195개 슬롯 중 6개는 얼굴 검출 실패, 189명은 실제128/256 이미지의 ArcFace 점수를 계산했습니다.

`work/round01/prescreen.json`과 `pairs_128.csv.gz`, `pairs_256.csv.gz`가 실제 결과입니다. 각 해상도 17,766개 후보 쌍, 기존 160명과 30,240개 교차 쌍을 계산했습니다. 200명 전체에 요구되는 19,900/32,000쌍 검수가 아닙니다. 74명의 상호 양립 가능한 수치 조합을 추렸습니다.

이어 소규모 후보 20명을 생성했으나 비율이 과장되어 사용자가 지적했습니다. 이 20명 전원은 제외했습니다. 기록은 `work/rejected_exaggerated_candidates.json`, 필수 외형 방향은 `work/visual_direction.json`입니다. 해당 이미지는 런타임이나 선택 명단에 포함하지 마세요.

자연스러운 비율과 약한 미소로 20명을 다시 생성했습니다. `work/round02_natural/`에 원본과 프롬프트, 개별 사진, 실제 점수를 보관했습니다. 이 중 3명이 기존 74명과 함께 기준을 통과해 현재 수치 조합은 77명입니다.

`work/candidate_selection.json`이 그 77명의 원본 경로를 담고 있습니다. 이는 수치 선별일 뿐 최종 승인 명단이 아닙니다. 실제 사진과 나이·태그·외형 설명의 일치 여부, 잘린 머리·안경 등의 육안 검수가 남았습니다.

## 검수 방법과 재실행

CPU InsightFace buffalo_l의 ArcFace 원시 정규화 코사인만 사용합니다. 임베딩 점수 보정, whitening 등은 하지 않았습니다. 모델 해시와 패키지 버전은 검수 JSON 및 `work/environment.json`에 있습니다. 기존 160명 기준 사진은 두 세트의 서울 코메츠 128 WebP를 실제 rect로 디코딩했습니다. 원본 해시와 경로는 `work/reference_sources.json`입니다.

1차 사진은 등방성 정사각 크롭으로 만들어 얼굴 비율을 늘리거나 줄이지 않았습니다. 128 얼굴 검출만 실패하고256 검출이 가능한 경우256 랜드마크를1/2로 축소해 실제128 픽셀을 정렬했습니다. 해당1명은1차 결과에 기록되어 있습니다.

저장소 루트에서 실행:

```bash
OPENBLAS_NUM_THREADS=1 OMP_NUM_THREADS=1 python assets/v18/production200/work/screen_round.py
OPENBLAS_NUM_THREADS=1 OMP_NUM_THREADS=1 python assets/v18/production200/work/screen_replacements.py
```

모델 파일은 `/workspace/models/buffalo_l/`에 설치했습니다. 호환 가능한77명 조합 검증은 `work/compatible_subset_validation.json`입니다. 현재123개 슬롯에 추가 후보·교체가 필요합니다.

## 남은 납품 작업

200명 전체 선검수와 육안 확인 후 유니폼2,000장 생성, 실제128/256 동일인·최근접1위 검수, WebP40장과 미리보기, 최종 manifest 제작이 필요합니다. 현재 게임에 연결할 런타임 파일은 없습니다.

최종 rect는 `x=(index%10)*pitch+8`, `y=(index//10)*pitch+8`, 크기 n×n. pitch는128에서144,256에서272입니다. 현재 최종 런타임 용량은0입니다.
