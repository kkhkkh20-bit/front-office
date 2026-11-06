# 프런트야구 · 구단 크레스트 v2

10개 가상 구단의 평면 SVG 원본과 입체 PNG. 요청서: `docs/asset-requests/2026-11-06-codex-badges-v2-crests.md`. 리뷰 브랜치 `assets/v2-badges-review`, 기준 main `13e5e8f200b35913d114ffc8c9c8cab5a938e723`. 게임 연결은 Claude가 진행한다.

[전체 미리보기](preview.png) · [평면 원본 비교](previews/flat_masters.png) · [밝은·어두운 배경](previews/crests_dark_light.png) · [32·64px 실제 크기](previews/marks_actual_size.png)

## 원본과 스타일

기본은 2–4색의 평면 벡터다. 심벌 콘셉트를 탐색한 뒤 새 Bézier 경로로 정리했으며 최종 SVG에 래스터 이미지는 들어 있지 않다. v1의 구단 key·이름·design_palette를 유지했다. 실제 구단·기업·후원사 로고나 타게임 참고 그림을 소스로 사용하지 않았다.

- 방패 3개, 원형 메달 3개, 홈플레이트 2개, 팔각형 2개로 나눴다. 같은 외곽 유형 안에서도 각 심벌의 실루엣과 주색으로 구분된다.
- 512 좌표계의 주 외곽선은 11px. 어두운 바깥선 → 밝은 금속 띠 → 안쪽 구단색 면 순서다.
- 입체판은 평면 원본의 경로와 글자를 유지하고, **금속 테두리 경사 1단 + 면 위아래 2단 명암 + 아래 8px 그림자**만 적용했다. 8/512=1.5625%로 요청의 3% 이내다. 블러·광택 입자·추가 효과 필터는 없다. 테두리 조명은 모두 왼쪽 위다.
- 32px판은 별도 SVG로 관리한다. 작은 실밥·눈·밧줄 잔선을 덜고 심벌 비율을 조정했다. 이미 최소 형태인 스파크·스톰도 32px용 배치와 비율을 따로 적용했다.

| key | 영문 워드마크 | 외곽 | 주색 |
|---|---|---|---|
| `seoul_comets` | SEOUL COMETS | homeplate | #A50034 |
| `seoul_hounds` | SEOUL HOUNDS | shield | #131230 |
| `incheon_seagulls` | INCHEON SEAGULLS | medallion | #CE0E2D |
| `suwon_sparks` | SUWON SPARKS | octagon | #141414 |
| `goyang_storm` | GOYANG STORM | medallion | #570514 |
| `daejeon_redfox` | DAEJEON RED FOX | shield | #F37321 |
| `gwangju_blazes` | GWANGJU BLAZES | homeplate | #EA0029 |
| `daegu_thunders` | DAEGU THUNDERS | octagon | #074CA1 |
| `busan_waves` | BUSAN WAVES | medallion | #041E42 |
| `changwon_anchors` | CHANGWON ANCHORS | shield | #1D467B |

## 워드마크

**Barlow Condensed ExtraBold, 800** 한 종류를 사용했다. 실제 TTF를 HarfBuzz로 커닝 조판한 뒤 FontTools로 글리프 외곽선을 변환했다. 도시명과 구단명을 두 줄로 배치하되 요청서의 영문 철자와 공백은 그대로 유지했다. 글자를 이미지 생성으로 그리지 않았다.

SVG에는 `<text>`, 외부 폰트, 래스터 글자가 없다. 런타임 폰트 의존성도 없다. [typography.json](typography.json)에 조판 정보와 원본 글꼴 SHA-256을 기록했다.

- 글꼴 출처: https://github.com/google/fonts/tree/main/ofl/barlowcondensed
- TTF SHA-256: `724c9c25952d5f4a2d87185d9767aa006144c5f0d944dc05bf7d5d603551c260`
- 라이선스: [SIL OFL 1.1](licenses/BarlowCondensed-OFL.txt)

## 파일

| 경로 | 내용 |
|---|---|
| `svg/primary/{key}.svg` | 워드마크가 있는 평면 크레스트 10개 |
| `svg/mark/{key}.svg` | 워드마크 없는 평면 마크 10개 |
| `svg/mark32/{key}.svg` | 32px 전용 평면 마크 10개 |
| `svg/relief/crest/{key}.svg` | primary에서 만든 입체 변형 10개 |
| `svg/relief/mark/{key}.svg` | mark에서 만든 입체 변형 10개 |
| `svg/relief/mark32/{key}.svg` | mark32에서 만든 입체 변형 10개 |
| `png/crest/{512,256,128}/{key}.png` | 입체 크레스트 30장, 투명 RGBA |
| `png/mark/{128,64,32}/{key}.png` | 입체 마크 30장, 투명 RGBA |
| `teams.json` | v1과 같은 teams 배열, wordmark·SVG·크기별 assets 경로 |

입체 SVG도 함께 보관해 PNG가 어떤 원본에서 나왔는지 확인할 수 있다. PNG는 대응 SVG를 해당 크기로 직접 렌더링한 것이다. `png/mark/32`는 큰 마크를 축소한 파일이 아니라 전용 mark32 SVG에서 출력했다.

PNG 60장 합계 **1,092,187 bytes**. 512px 크레스트를 제외한 게임용 PNG 50장은 **567,241 bytes**다. 요청서의 연결 계획에 따라 512px은 저장소 원본으로 두고, 게임에는 크레스트 256·128 및 마크 128·64·32만 연결한다.

## 검수

[validation.json](validation.json)에 구단별 검수와 PNG 원본 SVG·크기·투명 영역·해시를 기록했다.

- 평면 SVG 30개 모두 2–4색, 외부 리소스·텍스트 요소·래스터 삽입 없음.
- 입체 SVG 30개는 허용한 효과를 복원하면 평면 원본과 전체 경로·워드마크가 동일함을 확인했다.
- PNG 60장 모두 지정 크기·RGBA이며, 투명 캔버스의 네 가장자리에서 잘림이 없고 SVG 재렌더와 픽셀이 같다.
- 10개 영문 철자와 실제 글리프 수, v1 팔레트·key·이름 일치 확인.
- 밝은 배경 `#F4F5F7`, 어두운 배경 `#11161D`, 마크 32·64px 실제 크기를 육안 검토했다. 알아볼 수 있는 실제 구단 로고나 타게임 도안의 복제는 발견하지 않았다. 이는 상표 데이터베이스 전수 대조 결과를 뜻하지 않는다.

[checksums.json](checksums.json)은 자기 자신을 제외한 납품 파일의 SHA-256과 용량을 담는다. 연결 규칙과 경로는 [CLAUDE_HANDOFF.md](CLAUDE_HANDOFF.md)에 있다. 이번 변경은 `assets/badges/v2/` 추가만 포함한다.
