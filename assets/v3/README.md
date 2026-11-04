# 프런트야구 에셋 v3

요청서: `docs/asset-requests/2026-11-04-codex-v3.md`

게임 코드를 포함하지 않는 에셋 납품입니다. 기존 `assets/v2_1/`과 승인된 원형 구단 배지는 그대로 유지합니다. 실제 화면 연결은 Claude가 진행합니다.

## 구성

| 폴더 | 원본 수 | PNG 해상도 | 내용 |
| --- | ---: | --- | --- |
| `trophies/` | 19 | 32·64·128·256 | 우승·준우승·정규 1위·MVP·신인왕·골든글러브·타격/투수 상패와 무문자판·올스타 MVP·드림/나눔·국가대표 금은동·반지·명예의 전당·감독상 |
| `uniforms/` | 66 | 128·256·512 | 11팀 × 홈/원정 × 앞뒤 44장 + 번호 없는 앞면 22장 |
| `caps/` | 11 | 64·128·256 | 10개 구단과 국가대표의 정면 3/4 모자 |
| `feats/` | 11 | 32·64 | 사이클링·노히트·퍼펙트·4홈런·연타석 홈런·끝내기·만루·15K·연속 안타·통산/시즌 공용 틀 |
| `logos/` | 40 | 심벌 64·128·256 / 워드마크 폭 256·512 | 10팀의 독립 심벌·가로 워드마크·각 흰색판. 승인 원형 배지의 대체물이 아닌 보조 로고 |
| `stage/` | 3 | 배경 1920×1080 / 리본 폭 256·512·1024 | 시상식 무대·포스트시즌 배경·우승 리본. 배경에는 WebP도 동봉 |

각 원본은 편집 가능한 실제 SVG 경로·도형·그라디언트입니다. PNG를 SVG에 넣거나 외부 이미지를 참조하지 않습니다. 워드마크는 경로로 변환해 외부 폰트 없이 표시됩니다.

파일 위치는 `분류/svg/이름.svg`, `분류/png/폭/이름.png`입니다. 배경 두 장을 제외한 납품 에셋은 투명 배경입니다. 미리보기 이미지는 검수용 배경을 포함합니다.

## 디자인

- 트로피는 금속의 면·하이라이트·에나멜·명판을 공유하면서 컵, 은제 원형 조형, 페넌트, 별, 글러브, 상패 등으로 실루엣을 구분했습니다.
- 유니폼에는 앞단추·단추 줄·칼라·이중 소매 파이핑·봉제선·원단 명암·가슴 워드마크·허리 벨트와 바지 상단을 넣었습니다. 뒷면의 선수 이름과 번호 자리는 비어 있습니다.
- 모자는 패널 봉제선, 챙 윗면/아랫면과 그림자, 독립 심벌을 포함합니다.
- 구단의 key·이름·순서·기준색은 v2.1 manifest를 그대로 사용합니다. 국가대표는 별도 `korea` 항목입니다. 구단 배열 순서를 게임 구단 ID로 해석하지 마세요.
- 실존 구단 로고, KBO 공식 마크, 실제 트로피 도안, 선수 사진/얼굴을 사용하지 않았습니다. 가칭 리그명도 그림에 넣지 않았습니다.

## manifest 계약

`manifest.json`의 `assets`는 에셋 ID를 key로 하는 사전입니다. `svg`, `png`, `webp`의 파일 경로는 **`assets/v3/` 기준 상대 경로**입니다. 크기는 `view_box`, 글자 영역은 `text_slots`, 색 편집 위치는 `color_tokens`에 기록했습니다.

`teams[].uniform_sets.home/away`의 `front`, `back`, `front_sample` 및 `cap`, `logos` 값은 파일 경로가 아니라 **`assets` 사전의 ID**입니다. 국가대표도 `national`에서 같은 계약을 사용합니다. `approved_round_badge`만 기존 승인 배지를 가리키는 상대 참조입니다. 구단 배지는 실제 저장소의 `assets/badges/v1/png/320/`, 국가대표는 `assets/v2_1/national/` 원본을 참조합니다.

### 번호·이름

- **실제 선수 번호를 넣을 때는 `front`가 가리키는 `_front_blank`를 사용하세요.** 앞면 장식 번호 24가 없는 SVG/PNG입니다.
- `front_sample`은 작은 앞번호 24가 포함된 디자인 확인용 원본입니다. 24는 선수 데이터가 아닙니다. SVG에서는 `hide_svg_layer`를 숨길 수도 있지만 PNG의 숫자는 이미 구워져 있으므로 빈 앞면이 권장됩니다.
- 뒷면은 전부 이름·번호가 비어 있습니다. `player_name`과 `player_number`의 좌표·기준선·최대 글자 크기를 사용하세요.
- 좌표는 SVG viewBox 단위입니다. PNG 위에 글자를 올릴 경우 `PNG 폭 / view_box[2]`를 좌표와 글자 크기에 곱합니다. 앞면·뒷면 원본은 모두 512×512입니다.
- 원본에는 점선 박스나 임의 선수명이 들어 있지 않습니다. SVG의 빈 이름/번호 그룹은 편집 편의를 위한 레이어입니다.

### 상패·대기록·색

- 타격/투수 상패는 `_blank`가 글자 없는 판입니다. 타율·홈런·탈삼진 등 부문 이름은 `department` 영역에 표시하세요.
- `career_milestone_frame`과 `season_record_frame`은 숫자가 비어 있습니다. 100·200·300·400·500 / 30-30·40HR 등의 실제 값은 게임 데이터에서 표시합니다.
- 반지는 `championship_ring__ring_gem` 레이어와 `championship_ring__gem` 그라디언트를 분리했습니다. manifest의 `gradient_stop_policy`를 따라 보석만 구단색으로 바꿀 수 있습니다. 금속 링은 그대로 유지하세요.
- 우승 리본도 색 레이어·그라디언트와 제목 자리 좌표를 제공합니다.
- SVG는 표준 fill/stroke/그라디언트를 사용합니다. 부모 HTML의 CSS 변수로 외부 `<img>` 내부 색이 자동 변경되는 구조가 아닙니다. 이름 있는 레이어/그라디언트를 편집하거나 SVG 문자열에서 파생본을 만드세요. PNG는 색이 고정됩니다.

## 미리보기

- `ASSET_PREVIEW.png`, `ASSET_PREVIEW_LIGHT.png`: 전체 구성.
- `previews/trophies_dark.png`, `trophies_light.png`: 트로피 전체.
- `previews/uniforms_dark.png`, `uniforms_light.png`: 홈 앞·뒤 / 원정 앞·뒤 44장.
- `previews/caps_dark.png`, `feats_dark.png`, `logos_dark.png`: 모자·대기록·독립 심벌.
- `previews/trophies_size_proof.png`, `feats_size_proof.png`: 실제 24·32·64px를 어두운/밝은 배경에서 비교.
- `previews/record_overlay_examples.png`: 숫자 영역의 사용 예시. 실제 선수 기록이 아닙니다.

미리보기에는 새 번호 없는 앞면 22장이 중복 표시되지 않습니다. 해당 파일과 매핑은 manifest에 모두 포함됩니다.

## 용량과 적용

UI 아이콘은 SVG 또는 표시 크기에 맞는 PNG를 선택하세요. 24px 표시에는 32/64px 원본을, 고밀도 화면에는 적절한 배수를 사용합니다. 배경은 WebP를 우선 권장합니다. 미리보기·README·checksums를 게임 HTML에 포함하지 마세요. 512px 유니폼 전체를 작은 아이콘 자리에 일괄 삽입하지 않는 것이 좋습니다.

`checksums.json`은 납품 파일의 SHA-256과 바이트 크기 목록입니다. 자기 자신만 제외합니다. 에셋을 수정하거나 파생본을 만들면 원본 체크섬과 달라지는 것이 정상입니다. 적용 지침은 `CLAUDE_HANDOFF.md`를 참고하세요.

## 납품 검증

- SVG 150종, 납품 PNG 434개, 배경 WebP 2개. 미리보기 PNG 12개 별도.
- 10개 구단 key·이름·순서·기준색은 v2.1 manifest와 일치합니다.
- SVG에 래스터 삽입·외부 이미지/폰트·스크립트가 없고 ID, 그라디언트, 글자/색 레이어 참조가 모두 유효합니다.
- PNG 전체의 크기·알파 채널·잘림을 확인했습니다. 모든 SVG는 대응 PNG 최소 해상도와 가시 픽셀이 일치합니다.
- 64×64 PNG 61개 모두 10KiB 이하이며 최대 5,583바이트입니다.
- SVG 150종을 Chromium에서 직접 열어 이미지 디코딩·원본 크기·페이지 오류 없음까지 확인했습니다.
- SVG/PNG/WebP 원본 합계 7,454,234바이트입니다. 검수용 미리보기는 런타임에서 제외하세요.
- 게임 화면 연결은 이 납품 범위에 포함되지 않습니다.

## 제작 출처와 서체 고지

도형과 배치는 이번 요청을 위해 새로 작성했습니다. 워드마크/숫자 외곽선에는 범용 DejaVu Sans Condensed Bold 글리프를 사용하고 별도로 배치했습니다. 실제 구단 워드마크를 트레이싱하지 않았습니다. 미리보기의 한국어 표기는 Noto Sans CJK를 사용합니다. 폰트 바이너리는 포함하지 않습니다. DejaVu/Bitstream 서체 고지는 아래에 함께 제공합니다.

```text
Copyright: Copyright (c) 2003 by Bitstream, Inc. All Rights Reserved.
Bitstream Vera is a trademark of Bitstream, Inc.
DejaVu changes are in public domain.
License: bitstream-vera
Permission is hereby granted, free of charge, to any person obtaining a copy
of the fonts accompanying this license ("Fonts") and associated
documentation files (the "Font Software"), to reproduce and distribute the
Font Software, including without limitation the rights to use, copy, merge,
publish, distribute, and/or sell copies of the Font Software, and to permit
persons to whom the Font Software is furnished to do so, subject to the
following conditions:

The above copyright and trademark notices and this permission notice shall
be included in all copies of one or more of the Font Software typefaces.

The Font Software may be modified, altered, or added to, and in particular
the designs of glyphs or characters in the Fonts may be modified and
additional glyphs or characters may be added to the Fonts, only if the fonts
are renamed to names not containing either the words "Bitstream" or the word
"Vera".

This License becomes null and void to the extent applicable to Fonts or Font
Software that has been modified and is distributed under the "Bitstream
Vera" names.

The Font Software may be sold as part of a larger software package but no
copy of one or more of the Font Software typefaces may be sold by itself.

THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT OF COPYRIGHT, PATENT,
TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL BITSTREAM OR THE GNOME
FOUNDATION BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, INCLUDING
ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF
THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM OTHER DEALINGS IN THE
FONT SOFTWARE.

Except as contained in this notice, the names of Gnome, the Gnome
Foundation, and Bitstream Inc., shall not be used in advertising or
otherwise to promote the sale, use or other dealings in this Font Software
without prior written authorization from the Gnome Foundation or Bitstream
Inc., respectively. For further information, contact: fonts at gnome dot
org.
```
