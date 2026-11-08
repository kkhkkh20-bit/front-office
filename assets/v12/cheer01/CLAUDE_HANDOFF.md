# Claude 전달 · v12 cheer01

**에셋 검수 통과 / 게임 연결 대기.** 리뷰 브랜치 `assets/v12-cheer01-review`. 루트 `assets/v12/cheer01/`. 코드 수정과 main 병합 없음.

## 시트

| 상대 경로 | 크기 | bytes |
|---|---|---:|
| `sheets/128/cheer01.webp` | 1280×1280 | 881,588 |
| `sheets/256/cheer01.webp` | 2560×2560 | 3,291,058 |

시트 합계 **4,172,646 bytes**. 두 판은 완성 RGB 사진이며 의상/모자 합성 데이터가 아니다. `manifest.json`과 필요한 해상도 시트만 런타임에서 사용한다. PNG/NPZ/검수 보고서는 번들에서 제외한다.

`fullPath=manifest.path_base+identity.sheets[String(n)].path`, `rect=[col*n,row*n,n,n]`, `col=index%10`, `row=floor(index/10)`. 10×10, 간격·여백0, page0. manifest의48명만 순회한다. index48–99 검정 빈칸.

| index | r | 인원 | 남 / 여 | 나이 범위 |
|---|---|---:|---|---|
|0–15|clead|16|12 / 4|25–45|
|16–31|ccap|16|0 / 16|23–33|
|32–47|front|16|16 / 0|25–38|

ID는 회차를 포함한 안정 ID다. `a/age`는 같은 가상 나이, `f`는 정수0남·1여, glasses/beard는 boolean. `pose`는 사진에서 관찰한 arms_crossed/holding_tablet/other이고, 프레임 밖 주머니 손 등 확인하기 어려운 자세는 other다. `pose_requested`는 원래 생성 지시만 보존한 필드다.

## 구도 변경

사용자 최신 피드백을 우선해 얼굴·어깨·가슴 윗부분 중심으로 확대하고 자연스러운 비스듬한 어깨·팔짱·태블릿을 섞었다. 원래 요청서의 경직된 정면·손 없는 구도를 그대로 재현한 판이 아니다. 몸과 얼굴이 이어진 자기 사진이며, 얼굴 붙이기/공통 상체/구단 합성/모자는 없다.

## 검수와 연결

`validation.json`과 `validation/visual_review.json`을 확인한다. 최종128/256무손실WebP에서 독립적으로 재계산한 raw ArcFace: 신규끼리 최대 **0.3886989653**, 기존 회차와 최대 **0.3974152803**, 모두0.40미만. 참조는 v6c100(홈10변형)/v7 126/v8 120/v9 60/v10 40, 사진1,346개/해상도. 원본 점수·최근접 상대·모델/아틀라스 SHA-256을 남겼다. SHA가 일치하는 기존 검증 참조 임베딩을 재사용했다.

읽을 비교판: `previews/overview_128.png`, `previews/{clead,ccap,front}_256.png`.

연결 시 응원단장·팀장 카드는 역할·성별·나이로 고정 배정하고 갤러리 사진 우선 정책을 유지한다. 젊은 남성 프런트는 front16명을 후보로 사용할 수 있다. 실제 게임 연결/번들 작업은 하지 않았다. 브랜치는 리뷰용이며 main에 병합하지 않았다.
