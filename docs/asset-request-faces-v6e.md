# 에셋 요청서: 선수 실사 얼굴 추가 200명 (v6e production200)

> 이 요청서는 납품되지 않았고 `docs/asset-requests/2026-11-14-codex-v18-player-faces-young.md`(v18)가 대신합니다.

## 1. 목적

프런트야구 게임 안 선수 사진 얼굴의 수를 늘립니다.

현재 160명(국내 109, 외국인 51)으로는 다음 문제가 있습니다.

- 리그의 외국인 선수(시즌마다 약 30명, 해마다 교체)가 같은 얼굴로 반복해서 나옵니다. 아시아 외 외국인 얼굴은 41개뿐입니다.
- 아시아쿼터 얼굴은 10개뿐입니다.

이번 요청은 기존 v6c production100(`assets/v6/batch01c/production100`)·v13 production60(`assets/v6/batch01d/production60`)과 **같은 방식·같은 규격**으로 200명을 추가하는 것입니다.

## 2. 인원 구성 (총 200명 = 시트 2장 × 100칸)

### 시트 A (100명): 외국인 중심

| 구분 | 인원 | 세부 |
|---|---|---|
| 아시아 외 외국인 | 60 | US White 16, US Black 14, Dominican Latino 10, Venezuelan Latino 8, Mexican Latino 4, Cuban/Puerto Rican Latino 4, Canadian White 2, Curaçao/Caribbean Black 2 |
| 아시아쿼터 | 20 | Japanese 8, Taiwanese 6, Australian 4, Filipino 2 |
| 국내(Korean) | 20 | 아래 국내 기준과 같음 |

### 시트 B (100명): 국내

| 구분 | 인원 |
|---|---|
| Korean | 100 |

### 나이(외형) 분포 (두 시트 각각)

| 외형 나이 | 비율 |
|---|---|
| 18~22세 | 약 20% |
| 23~27세 | 약 30% |
| 28~32세 | 약 28% |
| 33~38세 | 약 22% |

- 외국인은 23~34세 위주로 합니다(신인급 18~20세는 넣지 않음).
- 성별은 전원 남성입니다.

### 외형 다양성 (두 시트 공통)

- **얼굴형·헤어:** 둥근형, 각진형, 긴 얼굴 등 얼굴형을 고르게 섞습니다. 헤어도 짧은 머리, 투블럭, 반삭, 곱슬, 긴 머리 묶음 등을 고르게 섞습니다.
- **수염:** 약 25%가 콧수염이나 턱수염을 기릅니다. 외국인은 약 40%까지 기릅니다.
- **안경:** 약 12%가 안경을 씁니다.
- **체형:** 마른형, 보통, 덩치 큰 체형(포수·거포 느낌)을 섞습니다.
- **피부톤:** 같은 출신 안에서도 밝음부터 짙음까지 범위를 둡니다.
- **얼굴 묘사:** `appearance_brief`는 기존처럼 인물마다 겹치지 않게 구체적으로 씁니다. 얼굴형, 눈, 눈썹, 코, 입, 헤어, 체형, 피부, 액세서리를 모두 적습니다.

## 3. 제작 방식 (기존과 동일)

- **방식:** B. 각 구단 홈 유니폼을 입은 완성 실사 인물 사진입니다(`method: "B: complete photographic portraits in each club home kit"`).
- **변형:** 인물 200명 × 10구단 홈 = 2,000장입니다. 같은 인물은 구단이 바뀌어도 같은 얼굴이어야 하고, 유니폼·모자만 바뀝니다.
- **구단 키(10개, 순서 고정):** `seoul_comets, seoul_hounds, incheon_seagulls, suwon_sparks, goyang_storm, daejeon_redfox, gwangju_blazes, daegu_thunders, busan_waves, changwon_anchors`
- **유니폼 기준:** 기존 production100 `manifest.json`의 `teams[].home_kit`과 `design_spec`을 그대로 따릅니다. 모자 색은 `cap_color`를 씁니다.
- **구도·조명:** 기존 세트와 맞춥니다.
  - 정면에서 살짝 비스듬한 상반신 증명사진 구도입니다.
  - 머리 위 여백을 포함합니다(512 기준 약 40px).
  - 중립 배경과 균일한 조명을 씁니다.
- **이미지:** RGB이고 알파 채널은 없습니다. 모자 마스크, 키 색, 별도 정렬 시트는 만들지 않습니다.

## 4. 시트 규격 (기존과 동일)

- 시트 한 장에 10×10 = 100칸이고, 인물 순서는 manifest `identities` 순서와 같습니다.
- 크기는 128과 256 두 가지입니다.
  - 칸 간격(pitch)은 `n+16`입니다: 128 → 144, 256 → 272.
  - 시트 한 변은 `(n+16)*10`입니다: 1440 / 2720.
  - 사진 좌표는 `x=(i%10)*(n+16)+8`, `y=floor(i/10)*(n+16)+8`, 크기 `n×n`입니다(8px 패딩은 사진 밖).
- 형식은 WebP입니다. 품질은 128 시트 q80 안팎으로 하고, 256 시트는 장당 600KB 이하를 목표로 합니다.
- 파일 경로는 다음과 같습니다.
  - `sheets/{A|B}/128/{team_key}.webp`
  - `sheets/{A|B}/256/{team_key}.webp`
  - 시트 2장 × 크기 2종 × 10구단 = 40장입니다.

## 5. 검수 기준

1. **인물 선검수(의상 편집 전):**
   - 새 200명 안의 모든 쌍은 얼굴 임베딩 코사인 0.40 미만이어야 합니다.
   - **기존 160명(v6c 100 + v13 60)과의 교차 비교도 모든 쌍 0.40 미만**이어야 합니다. 이번 요청의 핵심입니다. 기존 얼굴과 닮은 인물은 탈락시키고 다시 뽑습니다.
2. **동일 인물 유지:** 같은 인물의 구단 간 모든 쌍이 128·256 각각 코사인 0.60 이상이어야 합니다.
3. **외형 확인:**
   - 안경과 수염 태그가 실제 사진과 일치해야 합니다.
   - 외국인이 한국인처럼, 한국인이 외국인처럼 보이지 않아야 합니다.
4. **유니폼 확인:**
   - 모자 색, 가슴 로고, 칼라가 구단별 `home_kit`과 맞아야 합니다.
   - 다른 구단 유니폼이 섞이지 않아야 합니다.
5. **결함 확인:**
   - 손가락, 귀, 안경테가 깨지면 안 됩니다.
   - 글자 왜곡, 실존 인물 닮음, 실존 구단 로고·워터마크가 없어야 합니다.

## 6. 납품물

`assets/v6/batch01e/production200/` 아래에 다음 파일을 넣습니다.

- **`manifest.json`:** 기존 production100과 같은 스키마입니다.
  - `schema_version`: `"v6e-production200-B-1"`
  - `identity_count: 200`
  - `grid`, `teams`, `sheets`, `runtime_files`, `validation`
  - `identities[]`의 각 항목:
    - `id`: `v6e200_001`~`v6e200_200`
    - `sheet`: `"A"` 또는 `"B"`
    - `index`: 시트 안 0~99
    - `age`, `sex`, `ethnicity`, `group`, `appearance_brief`
    - `tags.glasses`, `tags.facial_hair`
    - `variants[team].sheets["128"|"256"].path/rect`
  - `ethnicity`는 기존 표기를 그대로 씁니다: `Korean`, `US White`, `US Black`, `Mexican Latino`, `Venezuelan Latino`, `Japanese`, `Taiwanese` 등.
  - 새 표기는 `Dominican Latino`, `Cuban Latino`, `Puerto Rican Latino`, `Canadian White`, `Caribbean Black`, `Australian`, `Filipino`입니다.
  - 게임은 `Japanese|Taiwanese|Filipino|Australian`을 아시아쿼터로 분류합니다. 이 네 표기는 정확히 지켜 주세요.
- **시트 40장:** 위 4절 경로를 따릅니다.
- **`validation.json`과 `validation/`:**
  - 선검수 점수: 새 200명 안 19,900쌍, 기존 160명과의 교차 32,000쌍
  - 동일 인물 점수
  - 최저·최고값 요약
- **`previews/`:**
  - 시트별 전원 256 미리보기(`A_all100_256.png`, `B_all100_256.png`)
  - 무작위 20명의 10구단 확대판
- **`checksums.sha256`**
- **`CLAUDE_HANDOFF.md`:** 기존 production100의 안내 문서와 같은 형식입니다. 읽을 경로, rect 계산, 용량, 검수 범위를 적습니다.
- **상태 표기:** `asset_validation_passed:true`, `production_complete:true`, `review_status:"pending_game_review"`

## 7. 주의

- 이번 변경은 에셋 파일만 추가합니다. 게임 코드는 수정하지 않습니다(게임 연결은 따로 진행).
- 기존 에셋(`batch01c`, `batch01d`)은 수정하거나 삭제하지 않습니다.
- 실존 선수, 연예인, 유명인을 닮은 얼굴은 쓰지 않습니다.
- 납품 브랜치: `assets/v6e-production-review`
