# v18 제작 중 — 게임 연결 금지

작업 브랜치: `assets/v18-review`. 에셋 외 파일 수정 없음. 아직 납품 완료가 아닙니다.

`production_status.json`이 현재 상태입니다. `work/planned_identities.json`은 요청서 비율에 맞춘 200명의 계획이며 생성 완료 명단이 아닙니다. 구단 규격은 v13 manifest의 teams를 `work/teams.json`에 원문 복사했습니다.

첫 후보 20명은 `work/B_001_020.png`, 개별 원본은 `work/candidates/pilot_*.png`입니다. 최종 v18 ID를 부여하지 않았습니다. 사진과 계획의 헤어·태그는 아직 연결하지 않았습니다.

## 실제 선검수

CPU InsightFace buffalo_l, 원시 정규화 ArcFace 코사인. 모델 해시는 `work/first20_prescreen.json`, 패키지 버전은 `work/environment.json`에 기록했습니다.

후보 내 190쌍과 기존 160명 교차 3,200쌍을 계산했습니다. 기존 기준 이미지는 두 세트의 서울 코메츠 128 WebP를 실제 rect에서 디코딩했습니다. 후보 내 최고 0.611251, 기존 얼굴 교차 최고 0.481128, 기준 0.40 이상 58쌍으로 실패했습니다. 전체 200명 검수를 수행한 결과가 아닙니다.

모든 점수는 `work/first20_pairs.json`, 임베딩은 `work/first20_embeddings.npz`에 보존했습니다. 재실행은 저장소 루트에서 `OPENBLAS_NUM_THREADS=1 OMP_NUM_THREADS=1 python assets/v18/production200/work/prescreen.py`. 모델은 `/workspace/models/buffalo_l/`에 있습니다.

## 남은 작업

후보 재생성과 선검수, 최종 얼굴·태그·나이 육안 검수, 200명 전체 19,900쌍 및 기존 160명 32,000쌍 검수 이후 유니폼 2,000장 생성. 최종 WebP 40장, 양 해상도 동일인 검수, 미리보기와 manifest를 제작해야 합니다. 현재 게임에 연결할 파일은 없습니다.

최종 사진 rect는 `x=(index%10)*pitch+8`, `y=(index//10)*pitch+8`, 크기 n×n. pitch는 128에서144, 256에서272입니다. 최종 시트가 없으므로 현재 런타임 용량은 0입니다.
