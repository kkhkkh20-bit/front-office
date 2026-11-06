# Claude 인계 · 구단 크레스트 v2

브랜치: `assets/v2-badges-review`. 에셋 루트: `assets/badges/v2/`. 기준 main: `13e5e8f200b35913d114ffc8c9c8cab5a938e723`. 요청서: `docs/asset-requests/2026-11-06-codex-badges-v2-crests.md`.

에셋 검수 완료, 게임 연결 검수 대기. main 병합은 하지 않았다.

## 매핑

`assets/badges/v2/teams.json`은 v1과 같은 `teams` 배열이다. `key`, `name`, `design_palette`를 유지하고 `wordmark`와 새 `assets` 구조를 추가했다. key는 에셋 key이며 게임 내부 team ID와는 별도다. v1 자료의 실제 구단 색상 참고명은 새 파일에 넣지 않았다.

각 `teams[].assets`는 아래 구조다. 경로는 모두 **에셋 루트 기준 상대 경로**이므로 `teams.json.path_base`를 앞에 붙인다.

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

| key | 워드마크 | 외곽 | 주색 |
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

## 게임 연결 크기

- 헤더·구단 선택·대진·우승 등 40px 이상: `crest`의 128 또는 256 원본.
- 목록·순위표·일정 등 32px 이하: `mark`의 32 또는 64 원본.
- `png/mark/32`는 별도 32px 도안이다. 축소 과정에서 큰 마크로 덮어쓰지 않는다.
- 512px 크레스트 10장은 저장소 원본용이다. 게임 번들에는 256 이하 PNG만 연결한다.
- 모든 PNG는 정사각 RGBA이며, 캔버스 안에 짧은 아래 그림자가 포함되어 있다. 이미지 자체를 추가로 자르거나 효과를 겹칠 필요 없다.

전체 PNG는 1,092,187 bytes. 512px을 제외한 게임용 50장은 **567,241 bytes**다. SVG·미리보기·검수 자료·라이선스는 편집 및 검토용이다.

## 원본 편집

평면 기본 크레스트는 `svg/primary/{key}.svg`, 기본 마크는 `svg/mark/{key}.svg`, 32px 마크는 `svg/mark32/{key}.svg`다. 각 `viewBox`는 `0 0 512 512`다. `teams[].svg`에 평면과 대응 입체 SVG 경로를 기록했다. 입체 PNG는 `svg/relief/crest`, `svg/relief/mark`, `svg/relief/mark32`의 대응 SVG에서 렌더링했다.

평면은 2–4색이고 주 외곽선은 512 기준 11px이다. 입체 효과는 금속 테두리 1단 경사, 위아래 2단 면 명암, y=8px의 블러 없는 그림자다. 32px 출력에서는 그림자 이동량이 0.5px이다. 네 가장자리의 투명 여백을 검사했다.

워드마크는 실제 **Barlow Condensed ExtraBold 800** 글꼴을 HarfBuzz로 조판한 외곽선이다. 폰트 로딩은 필요 없다. 문구를 바꾸려면 임의로 path를 찌그러뜨리지 말고 같은 글꼴로 재조판하면 된다. 원본 글꼴 출처·SHA-256·라이선스와 조판 정보는 `typography.json`, `teams.json.typography`, `licenses/BarlowCondensed-OFL.txt`에 있다.

## 검수 자료

- [preview.png](preview.png): 10개 크레스트를 어두운·밝은 배경에 각각 표시하고, 아래에 32·64px 마크 실제 크기 줄을 넣었다.
- [previews/flat_masters.png](previews/flat_masters.png): 평면 SVG 원본 비교.
- [previews/crests_dark_light.png](previews/crests_dark_light.png): 입체 크레스트 배경 비교.
- [previews/marks_actual_size.png](previews/marks_actual_size.png): 마크 실제 크기.
- [validation.json](validation.json): SVG 색상 수·효과 제한·경로 동일성·PNG 투명 여백·SVG 렌더 일치 검수.
- [checksums.json](checksums.json): SHA-256 및 바이트, 자기 자신 제외.

입체판과 평면판은 마스코트·글자·외곽 도형이 같다. 실제 구단·후원사·타게임 로고를 가져오지 않았고, 10구단끼리 주색과 큰 실루엣이 다르게 보이는지 검토했다. 게임 화면에서의 최종 크기·배치는 Claude가 연결 후 확인하면 된다.
