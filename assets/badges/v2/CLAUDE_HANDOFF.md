# Claude 인계 · cap-locked-03

루트 `assets/badges/v2/`, 리뷰 브랜치 `assets/v2-badges-review`. 기존 모자 심벌을 그대로 되살리고 메인 레터링·구성만 바꾼 수정안이다. **모자, 유니폼, 합성 키트, 선수·스태프 사진을 교체하거나 재생성하지 않는다.** main 병합과 게임 코드 수정은 이 작업에 포함하지 않는다.

## 연결

`teams.json`의 `teams` 배열과 key·이름·design_palette·assets 구조는 유지한다. `revision`은 `cap-locked-03`. 모든 상대 경로 앞에 `path_base`인 `assets/badges/v2/`를 붙인다.

```json
{
  "crest": {"512":"png/crest/512/{key}.png","256":"png/crest/256/{key}.png","128":"png/crest/128/{key}.png"},
  "mark": {"128":"png/mark/128/{key}.png","64":"png/mark/64/{key}.png","32":"png/mark/32/{key}.png"}
}
```

- 큰 구단 로고: `crest` 256/128. 로고의 원형·개방형·다이아몬드 등 실루엣을 임의로 자르지 않는다.
- 목록·순위·일정: `mark` 32/64. 기존 모자의 심벌과 같은 도형이다. 32px판은 심벌을 다시 그리지 않고 균일 크기·여백만 조정했다.
- `crest/512`는 저장소 원본용. 게임용 50장 합계 **486,031 bytes**.
- PNG 모두 정사각 RGBA. 투명 캔버스를 유지한다.
- `teams[].svg.native_cap`, `native_cap_symbol`, [cap_provenance.json](cap_provenance.json)은 기존 심벌의 출처 확인용이다. 기존 사진 합성용 마크 경로를 이 파일로 교체하지 않는다.
- 글자는 실제 Alfa Slab One Regular 외곽선이며 런타임 폰트 의존성이 없다.

## 디자인·검토

| key | 표기 | 구성 |
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

[모자와 새 로고 비교](previews/cap_to_identity.png), [전체](preview.png), [이전/수정 비교](previews/before_after.png), [평면](previews/flat_masters.png), [32·64px](previews/marks_actual_size.png).

평면 메인/마크 30개, 입체판 30개, 출처용 원본 심벌 10개, PNG 60장이다. 평면 2–4색, 입체 효과는 기존 테두리 경사 1단·면 2단 명암·6px 아래 그림자만이다. 모든 파생판의 심벌 경로·채움·선 굵기는 기존 모자 원본과 동일하다.

[validation.json](validation.json): 원본 자수 입력과 10구단 심벌 일치, 60개 SVG 내부의 심벌 일치, 기존 에셋 2,543개 해시 유지, PNG 크기·RGBA·투명 가장자리·픽셀 렌더 일치 통과. 기술 검사 결과이며 사용자 디자인 승인이나 게임 연결 완료를 뜻하지 않는다. 게임 연결 검수 대기.
