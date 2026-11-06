# 구단 로고 v2 · 기존 모자 심벌 유지 수정안

리비전: **cap-locked-03**. 사용자 피드백에 따라 기존 모자 마크를 고정하고 메인 로고의 레터링·배치만 다시 만들었다. 앞선 `abc2f3a` 시안의 새 심벌은 사용하지 않는다. 기존 모자·유니폼·선수 사진을 새로 만들거나 수정할 필요가 없다.

[기존 모자 → 동일 심벌 → 새 로고](previews/cap_to_identity.png) · [전체 어두운/밝은 배경](preview.png) · [이전 시안과 비교](previews/before_after.png) · [평면 원본](previews/flat_masters.png) · [32·64px 실제 크기](previews/marks_actual_size.png)

## 유지한 원본과 변경 범위

v3의 원본 `team_symbol` 도형은 v5 실사 모자 자수 렌더와 v5/v5b 모자 합성 마크에도 사용됐다. 그 원본을 복원해 모든 경로·내부 빈 공간·채움색·선 굵기를 그대로 사용했다. 코메츠의 별과 궤적, 하운즈의 각진 옆얼굴 등 **실제 기존 모자와 같은 심벌**이다. 심벌에는 균일 확대·축소와 위치 이동만 적용한다. 개방형 메인 로고에서는 심벌 뒤에 별도의 구단색 외곽선을 받친다. 원본 도형을 새로 그리거나 내부 모양을 바꾸지 않는다.

- `svg/native/`: 기존 모자 심벌 10개의 100×100 원본. 런타임 교체용이 아니라 출처·일치 확인용이다.
- [cap_provenance.json](cap_provenance.json): 기존 모자 경로와 SHA-256, 심벌 원본 경로, 원본 도형 지문.
- [validation.json](validation.json): v5 실제 자수 렌더 입력과 10개 심벌의 좌표·색·선 데이터가 정확히 일치한다. 평면·입체 60개 SVG 내부의 심벌도 같은 원본과 대조했다.
- 기존 에셋 **2,543개**를 작업 전 SHA-256과 비교했다. 모자·키트·인물 사진을 포함해 변경 0개다.

변경 파일은 `assets/badges/v2/` 안에만 있다. `src/`, `index.html`, 빌드·검사 코드와 게임 연결은 수정하지 않는다. main 병합도 하지 않는다.

## 메인 로고

실제 KBO·MLB 로고 조사에서 본 글자 위계·간격·심벌과 워드마크의 역할 분담을 참고했다. 실존 구단의 글자나 로고 도형은 가져오지 않았다. 구단별 구성은 다음과 같다.

| key | 영문 표기 | 구성 |
|---|---|---|
| `seoul_comets` | SEOUL COMETS | 개방형 워드마크 |
| `seoul_hounds` | SEOUL HOUNDS | 원형 문장 |
| `incheon_seagulls` | INCHEON SEAGULLS | 개방형 워드마크 |
| `suwon_sparks` | SUWON SPARKS | 다이아몬드 |
| `goyang_storm` | GOYANG STORM | 개방형 워드마크 |
| `daejeon_redfox` | DAEJEON RED FOX | 홈플레이트 |
| `gwangju_blazes` | GWANGJU BLAZES | 개방형 워드마크 |
| `daegu_thunders` | DAEGU THUNDERS | 원형 문장 |
| `busan_waves` | BUSAN WAVES | 개방형 워드마크 |
| `changwon_anchors` | CHANGWON ANCHORS | 원형 문장 |

모든 구단은 **Alfa Slab One Regular 한 종류**의 실제 글꼴을 HarfBuzz로 조판하고 FontTools로 외곽선화했다. 구단별 자간·폭·기울기·얕은 아치 배치를 조정했다. 글자를 이미지 생성으로 납품하지 않는다. 라이선스는 [SIL OFL](licenses/AlfaSlabOne-OFL.txt), 출처는 [Google Fonts](https://github.com/google/fonts/tree/main/ofl/alfaslabone), 조판 정보는 [typography.json](typography.json)에 있다.

## 파일 규격

| 경로 | 내용 |
|---|---|
| `svg/primary/{key}.svg` | 512 좌표계, 2–4색 평면 메인 로고 10개 |
| `svg/mark/{key}.svg` | 기존 모자 심벌과 구단색 바탕, 평면 마크 10개 |
| `svg/mark32/{key}.svg` | 같은 심벌의 여백·배치만 조정한 32px 전용 원본 10개 |
| `svg/relief/{crest,mark,mark32}/{key}.svg` | 위 원본에서 파생한 입체판 30개 |
| `svg/native/{key}.svg` | 출처 확인용 기존 모자 심벌 10개 |
| `png/crest/{512,256,128}/{key}.png` | RGBA 메인 로고 30장 |
| `png/mark/{128,64,32}/{key}.png` | RGBA 마크 30장 |

입체판은 기존 테두리에만 금속 경사 1단, 구단색 면 최대 2단 명암, 512 기준 6px 아래 그림자만 넣었다. 광택 입자·블러·추가 필터가 없다. 개방형 로고에는 새 금속 프레임을 붙이지 않았다. 심벌 자체는 입체판에서도 원래 색·도형 그대로다.

`teams.json`의 key·이름·design_palette·assets 경로와 크기 구조를 유지했다. PNG 60장 합계 **1,002,094 bytes**, 게임용 50장(512 제외) **486,031 bytes**다. 기존 모자·유니폼·인물 시트를 다시 배포할 필요가 없다.

## 검수 상태

SVG 구조·색 수·실제 글리프 수·영문 철자, 파생판 도형 일치·효과 제한, PNG 지정 크기·RGBA·투명 가장자리·원본 렌더와 픽셀 일치를 검사했다. 어두운/밝은 배경과 32·64px 마크를 확인했다. 기술 검수 통과는 실제 프로 구단 로고와 같은 디자인 완성도라는 뜻이 아니다. **사용자 디자인 검토와 게임 표시 검수는 대기 중**이다.

리뷰 브랜치: `assets/v2-badges-review`. 게임 연결은 [CLAUDE_HANDOFF.md](CLAUDE_HANDOFF.md), 파일별 해시는 [checksums.json](checksums.json)을 참고한다.
