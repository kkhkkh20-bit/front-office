# Claude 전달 — v11 people02 후보 리뷰

**검수 미통과. 게임에 연결하지 말 것.**

- 리뷰 브랜치: `assets/v11-people02-review`
- 에셋 루트: `assets/v11/people02/`
- 상태: `REVIEW_ONLY_ARCFACE_FAILED_DO_NOT_CONNECT`
- 후보 컷 80개, 승인된 신규 인물 0명. `manifest.identities[].eligible_for_game`는 모두 false.
- 이전 채팅 후보를 그대로 저장한 것이 아니라, 최신 얼굴·어깨 확대 구도로 재생성한 별도 후보이다.

## 시트 경로와 칸 계산

| 상대 경로 | 크기 | 형식 |
|---|---|---|
| `sheets/128/people02.webp` | 1280×1280 | RGB 무손실 WebP |
| `sheets/256/people02.webp` | 2560×2560 | RGB 무손실 WebP |

합계 7,155,510 bytes. 개별 파일의 정확한 bytes·SHA-256은 manifest에 있다. `identities[].sheets["128"|"256"].path`에 `manifest.path_base`를 앞에 붙인다. `rect=[(index%10)*n, floor(index/10)*n, n, n]`; index 0–79 사용, 80–99 검정. page 0, pitch n, padding 0.

| 묶음 | 컷 수 | 역할 | 성별 | 나이 설정 |
|---|---:|---|---|---|
| female_front | 20 | front | 여 | 24–34 |
| female_staff | 14 | staff | 여 | 26–36 |
| male_gm | 16 | gm | 남 | 30–42 |
| male_front_analyst | 16 | front 8 / staff 8 | 남 | 26–38 |
| female_gm | 14 | gm | 여 | 32–45 |

`a`는 가상 설정 나이, `f`는 0 남 / 1 여, glasses·beard는 boolean. `pose`는 실제 보이는 `arms_crossed` / `holding_tablet` / `other`. `pose_requested`에는 생성 시 요청을 보존했다. 확대 구도로 손이 프레임 밖인 주머니 포즈는 `other`로 기록했다.

## 확인할 검수 자료

`validation.json`에 최근접 상대와 실제 최대값, 기준 초과 쌍/후보가 있다. `previews/arcface_failed_pairs_256.png`에서 중복 경향을 바로 볼 수 있다. 전체 비교판은 `previews/overview_128.png`, 묶음별 큰 비교판은 `previews/{group}_256.png`다.

ArcFace 기준 raw cosine <0.40. 신규끼리 최대 0.7064329386, 기존 회차와 최대 0.5946263075로 **실패**했다. 128과256에서 독립적으로 검출·정렬해 비교했으며 v6c·v7·v8·v9·v10의 기존 검증 임베딩을 참조 아틀라스 SHA-256 대조 후 재사용했다. 원본 점수 NPZ·모델 해시·참조 파일 해시는 `validation/`에 있다. 검수 파일·원본 생성 보드를 게임 번들에 넣지 말 것.

픽셀 무결성·규격 검사는 통과했지만 인물 중복 기준을 통과한 납품은 아니다. 재제작 후 전체 검수 재실행 전에는 후보 풀에 추가하지 말 것. 코드 수정·빌드/검사 코드 변경·게임 연결·main 병합은 수행하지 않았다.
