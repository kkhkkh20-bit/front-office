# 프런트야구 · 구단 로고 v2 / professional-02

이전 시안 `88e94b6`을 재제작했다. 사용자의 “실제 KBO·메이저리그 로고를 보고 참고해 달라”는 피드백에 따라 **실제 KBO 10구단·MLB 12구단의 공개 로고 SVG를 확인**하고, 구단별 구성과 레터링부터 바꿨다. 조사 출처·관찰·적용 내용은 [REFERENCES.md](REFERENCES.md)에 있다.

[새 전체 미리보기](preview.png) · [이전/새 시안 비교](previews/before_after.png) · [평면 SVG 비교](previews/flat_masters.png) · [32·64px 실제 크기](previews/marks_actual_size.png)

## 새 디자인

구단명이 먼저 읽히는 워드마크, 실루엣 중심의 심벌, 구단별로 다른 문장 구성을 사용했다. 공통 리본·캐릭터 표정·목에 달린 작은 야구공을 제거했다. v1의 구단 key·이름·design_palette는 유지한다.

| key | 워드마크 | 구성 |
|---|---|---|
| `seoul_comets` | SEOUL COMETS | 개방형 워드마크 |
| `seoul_hounds` | SEOUL HOUNDS | 개방형 워드마크 |
| `incheon_seagulls` | INCHEON SEAGULLS | 원형 구단 문장 |
| `suwon_sparks` | SUWON SPARKS | 개방형 워드마크 |
| `goyang_storm` | GOYANG STORM | 원형 구단 문장 |
| `daejeon_redfox` | DAEJEON RED FOX | 다이아몬드 워드마크 |
| `gwangju_blazes` | GWANGJU BLAZES | 다이아몬드 워드마크 |
| `daegu_thunders` | DAEGU THUNDERS | 야구공 문장 |
| `busan_waves` | BUSAN WAVES | 개방형 워드마크 |
| `changwon_anchors` | CHANGWON ANCHORS | 원형 구단 문장 |

이전 요청서의 2–4색 평면 SVG, 실제 글꼴 외곽선, 크기별 PNG와 전용 32px 마크 규격은 유지했다. 모든 로고를 같은 방패·리본 틀에 넣는 구성은 이번 사용자 피드백에 따라 위의 네 가지 구성으로 대체했다.

## 글자와 원본

**Barlow Semi Condensed ExtraBold Italic / 800** 한 종류로 조판했다. HarfBuzz 커닝을 적용하고 FontTools로 글리프를 외곽선화했다. 원형 문장의 글자도 같은 글리프를 원주에 맞게 배치한 것이다. 글자를 이미지 생성으로 그리지 않았다.

- 실제 글꼴 출처: https://github.com/google/fonts/tree/main/ofl/barlowsemicondensed
- TTF SHA-256: `b9f5c879fa952b2b5356200a079b3f600f53d273c4dbc088585678d6c7456ae7`
- [조판 정보](typography.json) · [SIL OFL 1.1](licenses/BarlowSemiCondensed-OFL.txt)

최종 SVG는 도형과 외곽선뿐이다. `<text>`, 래스터 이미지, 외부 폰트 로딩을 사용하지 않는다. 실제 구단의 로고 도형이나 레터링을 복사하지 않고 새 경로로 만들었다.

## 파일 규격

| 경로 | 내용 |
|---|---|
| `svg/primary/{key}.svg` | 구단별 평면 기본 로고 10개 |
| `svg/mark/{key}.svg` | 워드마크 없는 평면 심벌 10개 |
| `svg/mark32/{key}.svg` | 크기·잔선을 조정한 32px 전용 심벌 10개 |
| `svg/relief/{crest,mark,mark32}/{key}.svg` | 같은 평면 원본에서 만든 제한된 입체 변형 30개 |
| `png/crest/{512,256,128}/{key}.png` | 기본 로고 30장, 정사각 RGBA |
| `png/mark/{128,64,32}/{key}.png` | 심벌 30장, 정사각 RGBA |

기본 로고와 보통 마크의 외곽 경계는 512 좌표계에서 11px을 기준으로 정리했다. 32px판은 얇은 경계가 사라지지 않도록 비율·경계 두께를 별도로 조정했다. 마크는 공통 프레임을 빼고 단독 심벌로 사용한다.

입체판은 실제 테두리가 있는 로고에만 금속 경사 1단을 적용했다. 구단색 면의 위아래 명암은 최대 2단, 아래 그림자는 512 기준 6px(1.172%)이며 블러·입자·추가 효과 필터는 없다. 개방형 워드마크와 단독 심벌에는 프레임을 새로 붙이지 않고 짧은 그림자만 적용했다. 조명 방향은 왼쪽 위다.

PNG 60장 합계 **1,083,636 bytes**. 게임용 50장(512px 제외)은 **485,286 bytes**다. 512px은 저장소 원본용이며 기존 계획대로 게임에는 256 이하를 연결한다.

## 검수와 인계

[validation.json](validation.json): 30개 평면 SVG의 2–4색·외부 리소스 없음, 실제 글리프 수와 영문 철자, 30개 입체판의 원본 경로 동일성·효과 제한, PNG 60장의 지정 크기·RGBA·투명 여백·SVG 렌더 일치를 검사했다. 밝은 배경 `#F4F5F7`, 어두운 배경 `#11161D`, 마크 32·64px 실제 크기를 육안 확인했다.

[checksums.json](checksums.json)은 자기 자신을 제외한 납품 파일의 SHA-256과 바이트를 담는다. `teams.json`의 assets 경로와 크기 구조는 이전 납품과 같고, `revision`은 `professional-02`다.

같은 리뷰 브랜치 `assets/v2-badges-review`에 올린다. 변경 범위는 `assets/badges/v2/`이며 코드 수정·main 병합은 포함하지 않는다. 게임 연결은 [CLAUDE_HANDOFF.md](CLAUDE_HANDOFF.md)를 참고한다.
