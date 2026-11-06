# Claude 인계 · 구단 로고 v2 professional-02

브랜치: `assets/v2-badges-review` / 루트: `assets/badges/v2/`. 이전 시안 커밋 `88e94b6`을 대체하는 재제작분이다. 사용자 피드백에 따라 실제 KBO·MLB 로고를 조사해 공통 캐릭터 방패·리본 구성을 워드마크 중심의 구단별 구성으로 바꿨다.

## 연결 인터페이스

`teams.json`은 기존 `teams` 배열, key·이름·design_palette와 크기별 assets 경로를 유지했다. `revision`은 **`professional-02`**다. `teams[].layout`은 구단별 구성 종류다. 실제 구단 로고 이미지는 포함하지 않는다.

`teams[].assets`:

```json
{
  "crest": {
    "512": "png/crest/512/{key}.png",
    "256": "png/crest/256/{key}.png",
    "128": "png/crest/128/{key}.png"
  },
  "mark": {
    "128": "png/mark/128/{key}.png",
    "64": "png/mark/64/{key}.png",
    "32": "png/mark/32/{key}.png"
  }
}
```

경로는 모두 에셋 루트 기준 상대 경로다. `path_base` (`assets/badges/v2/`)를 앞에 붙인다.

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

## 표시 규칙

- 기본 로고는 `crest` 128·256을 사용한다. 정사각 캔버스 안에 개방형 워드마크·원형 문장 등이 들어 있으므로 서로의 실루엣을 같게 자르지 않는다.
- 목록·순위·일정 등 32px 이하에는 `mark`를 사용한다. 새 마크는 프레임 없는 단독 심벌이다.
- `mark/32`는 전용 원본에서 출력했다. 큰 마크를 일괄 축소해 덮어쓰지 않는다.
- `crest/512` 10장은 저장소 원본용이다. 게임용 50장(256 이하) 합계는 **485,286 bytes**다.
- PNG는 모두 RGBA다. 원 안이나 동일한 방패 안으로 강제 크롭하지 않고 투명 캔버스를 그대로 표시한다.

## 편집 원본

- 평면: `svg/primary`, `svg/mark`, `svg/mark32`. viewBox는 모두 `0 0 512 512`.
- 제한된 입체판: `svg/relief/crest`, `svg/relief/mark`, `svg/relief/mark32`.
- `teams[].svg`가 정확한 경로를 제공한다.
- 워드마크: 실제 **Barlow Semi Condensed ExtraBold Italic 800**, HarfBuzz 조판 후 외곽선. 원형 문장도 같은 글꼴의 글리프 경로다. 런타임 폰트가 필요 없다.
- 효과: 실제 테두리에만 최대 1단 금속 경사, 최대 2단 면 명암, 512 기준 6px 아래 그림자. 블러·추가 효과 필터 없음.

## 검토 자료

- [전체 새 시안](preview.png)
- [이전/새 시안 비교](previews/before_after.png): 이전 그림도 우리 이전 납품분이며 실제 KBO·MLB 로고 이미지는 들어 있지 않다.
- [평면 원본 비교](previews/flat_masters.png)
- [32·64px 실제 크기](previews/marks_actual_size.png)
- [조사 출처·적용 원칙](REFERENCES.md): KBO 10구단·MLB 12구단.
- [검수](validation.json) · [조판 정보](typography.json) · [해시](checksums.json)

PNG 60장을 원본 SVG와 픽셀 단위로 대조했으며 크기·RGBA·투명 가장자리를 확인했다. 평면 30개는 2–4색이고, 파생 입체판은 허용 효과를 제외한 경로·글자가 원본과 같다. 게임 연결 검수는 대기 상태이며 main에는 병합하지 않는다.
