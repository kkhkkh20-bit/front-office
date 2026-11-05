# Front Office v5 — 실사 키트와 얼굴 합성 기준

요청서: `docs/asset-requests/2026-11-05-codex-v5-photoreal-kit.md`.
**A·B 및 지정된 기준 판 2명만 납품합니다. C의 10,000명 대량 제작은 시작하지 않았습니다.** 게임 연결은 Claude 담당이며 게임 코드는 수정하지 않았습니다.

## A / 구단 소개용

10개 구단과 국가대표의 홈·원정 × 앞·뒤 **상의 44장**, 3/4 모자 **11종**, 등번호 **0~9의 본체·테두리 20개 레이어**입니다. 구단 key·대표색과 가상 심벌을 유지하고, A 소개용 유니폼은 2026-11-05 피드백에 따라 해외 야구·축구 사례를 조사해 새로 디자인했습니다.

| 종류 | 폴더 | 크기·포맷 |
| --- | --- | --- |
| 유니폼 상의 44장 | `uniforms/` | 투명 PNG / 무손실 WebP, 256·512 |
| 모자 11종 | `caps/` | 투명 PNG / 무손실 WebP, 128·256 |
| 숫자 10종 × 본체·테두리 | `digits/` | 투명 PNG / 무손실 WebP, 256·512 |

유니폼은 매끈한 새 원단, 얇은 V넥 마감과 야구 단추 여밈을 기준으로 제작했습니다. 코메츠·썬더스는 핀스트라이프와 필기체, 하운즈·앵커스는 작은 가슴 심벌, 시걸스는 가슴 띠, 스파크스는 각진 어깨와 사선 패널, 스톰은 옅은 소용돌이 패턴 등으로 구분했습니다. 홈·원정도 소매 배색·패널·레터링 구성을 달리했습니다. 깊고 촘촘한 몸판 주름을 줄이고 원단의 잔잔한 질감과 얕은 굴곡을 사용했습니다.

실제 사진을 열람한 9개 레퍼런스와 출처·확인 범위는 `UNIFORM_REFERENCE_STUDY.md`, 구단별 새 디자인·홈/원정 원단색·레터링 색은 `uniforms/designs.json`에 있습니다. v3는 가상 구단의 정체성 참고 자료이며, 새 A 디자인을 v3와 같은 도안으로 간주하지 마세요. 일부 원정 몸판색도 새로 구성했습니다. 대표색은 루트 `teams`, 실제 키트의 몸판·글자색은 각 에셋의 `kit_colors`와 `text_slots.fill`을 사용합니다.

A의 새로운 핀스트라이프·소매·어깨 패널·필기체는 **소개용 유니폼 이미지**에 적용했습니다. B의 기존 기준 판·합성 마크와 키 마스크는 이전의 단색 홈 키트 규격입니다. 새 A 디자인의 무늬나 필기체가 B 얼굴에 자동으로 합성되지는 않습니다. 게임 연결은 Claude가 담당합니다.

모자·B 마크·숫자는 Blender 4.3.2 Cycles에서 실제 입체 모델로 렌더링했습니다. 곡면 모자, 패널 봉제선, 챙의 스티치, 표면에 올라간 자수와 글리프 내부에 맞춰 잘라낸 새틴 스티치 줄을 포함합니다. 트윌/실 재질, 키·필·림 조명을 사용하고, sRGB Standard / -0.4EV / 96 samples 후 OIDN 컬러 디노이즈를 적용했습니다. 원본은 `source/embroidery_studio.blend`, 컬렉션·카메라 매핑은 `source/render_metadata.json`입니다. 외부 텍스처·생성 스크립트는 포함하지 않습니다.

앞면 선수 번호도 비웠습니다. 뒷면 이름·번호 자리는 모두 비어 있고 각 이미지의 `text_slots`에 **512px 기준 quad**를 기록했습니다. 다른 해상도에서는 좌표와 글자 크기를 같은 비율로 줄이세요. `previews/text_slots.png`에서 영역을 볼 수 있습니다.

숫자는 `0_fill` / `0_outline`처럼 같은 캔버스에 정렬된 독립 레이어입니다. 둘 다 흰색의 음영 있는 트윌 원본입니다. 먼저 테두리를 원하는 색으로 곱해 깔고 본체를 올리세요. RGB를 한 색으로 덮어쓰면 실의 음영이 없어집니다. 2자리 번호는 각 숫자를 같은 높이로 조합한 뒤 번호 quad 안에 맞춥니다. 문자 이름은 게임에서 렌더링합니다.

## B / 얼굴 위에 얹는 실사 질감 마크

구단·국가대표 11세트의 가슴 워드마크와 모자 앞판 심벌, **총 22종**입니다. v3의 원래 보조 심벌·글리프를 입체 자수로 만들어 모자/가슴 곡면의 작은 굴곡과 그림자를 반영했습니다. 실제 구단 로고나 KBO 로고는 사용하지 않았습니다.

`face_marks/`에 256·512px 투명 PNG와 무손실 WebP를 제공합니다. 모든 파일은 얼굴과 같은 **정사각 전체 캔버스**입니다. 미리 휨·좌표 배치를 적용했으므로 512 기준 판에 **(0,0)으로 source-over 합성**하면 됩니다. quad로 다시 변형하면 두 번 휘어집니다. quad는 위치 설명·후속 제작용입니다. 작은 얼굴에는 기준 판과 오버레이 전체를 같은 크기로 축소합니다. 가슴의 중앙 단추 줄 영역 x=256~265는 투명하게 비워 두었습니다.

| 마크 | 512px 기준 quad, TL → TR → BR → BL |
| --- | --- |
| 가슴 | `(94,440), (418,440), (424,510), (88,510)` |
| 모자 | `(231,26), (280,26), (285,83), (227,83)` |

## 기준 판 2명 / C 시험분

v4의 **`ko_late20s_01` / `black_01`**을 같은 인물로 유지해 모자 착용 기준 판을 만들었습니다. 새 인물 10,000명을 생성한 세트가 아닙니다. 흰 홈 상의, 빨간 모자·칼라·파이핑·소매 줄, 빈 가슴·빈 모자 앞판입니다. 글자·숫자·패치는 없습니다. 기본 PNG 512와 WebP 128·256, 피부톤·나이·헤어·수염·안경 태그를 제공합니다.

키색 **#FF0000은 재질의 기준 알베도**입니다. 사진의 빨강에는 조명과 원단 음영이 있어 모든 픽셀이 FF0000일 수 없습니다. RGB 동일성 비교로 재색칠하지 말고 다음 파일을 사용하세요.

- `*_key_mask.png`: 기준 판과 정확히 정렬된 512px L 마스크. 피부·머리·단추·흰 원단은 제외합니다.
- `*_key_albedo.png`: RGB가 정확히 **255,0,0**이고 알파가 키 마스크인 RGBA 레이어.
- `*_key_shading.png`: 512px L 음영 맵. 마스크 안에서만 사용합니다.

합성 순서는 **기준 판 → 키 영역 색 변경 → 가슴 마크 → 모자 마크**입니다. sRGB 실용식은 `결과 = 원본 × (1−mask) + 구단색 × shading × mask`이며 mask와 shading은 0~1로 정규화합니다. 키 마스크 밖 RGB는 재색칠 전후 동일하도록 확인했습니다. `previews/composites_all_teams.png`는 같은 기준 판 두 명에 10개 구단과 국가대표를 적용한 22뷰의 검수용 미리보기입니다. 새 인물 22명이 아닙니다.

배경은 불투명 짙은 회색 #20262e 목표이며 생성된 스튜디오 배경의 미세한 색조 차이가 있습니다. v4와 마찬가지로 스타일/합성 시험용입니다. 두 기준 판의 모자·눈높이·가슴 구도를 확인한 후 Claude가 게임 합성에 연결할 수 있습니다.

## v6 얼굴 규격

**규격만 확정합니다. 이번 v5에서는 대량 생성·임베딩 모델 다운로드·10,000명 유사도 검사를 수행하지 않았습니다.** 기계 판독용 사양은 `v6_face_spec.json`입니다.

- 총 **10,000명**, **1,000명 × 10회**. 모자 착용 판 1장만. 나이 든 별도 판은 만들지 않습니다.
- 구도·카메라·조명·배경과 머리 크기를 B 기준 판에 맞춥니다. 512px 제작 기준은 모자 위 y≈15, 눈높이 y≈143, 턱 y≈266, 단추 줄 중앙 x≈256입니다. 기준 판에서 벗어나 합성 위치가 어긋난 결과는 정렬·검수 후 재제작합니다.
- 한국인 **85% / 8,500명**, 외국인 **15% / 1,500명**. 외국인은 미국·중남미·일본·대만 등 다양한 구성을 사용합니다.
- 한국인의 나이는 **18~23세 60% / 5,100명**, **24~29세 30% / 2,550명**, **30~34세 10% / 850명**입니다. 외국인은 **24~33세**입니다. 매 1,000명 회차에는 한국인 850명(510/255/85명)과 외국인 150명을 배정합니다.
- 헤어·안경·수염·피부톤·체형·인상을 다양하게 하고, 인물마다 나이·피부톤·헤어·수염·안경 태그를 기록합니다. 키트는 흰 상의 / #FF0000 키 영역 / 글자·마크 없음으로 통일합니다.
- 겹침 검사는 **정렬한 얼굴 부분만** 고정된 ArcFace 모델로 임베딩하고 L2 정규화한 코사인 유사도로 비교합니다. 초기 상한은 **0.35 미만**입니다. 0.35 이상인 최근접 인물이 있으면 후보를 버리고 재생성합니다. 이 수치는 v6 시험 회차에서 모델·정렬 방식에 맞게 보정하고 변경 이력을 기록한 뒤, 승인된 전체에 같은 기준을 적용합니다.
- 회차 안뿐 아니라 **이전 회차 전체**와 비교합니다. `validation.json`에는 모델 ID/해시, 정렬 방법, 상한·보정 내역, 인물별 최근접 ID·유사도, 회차/전체 최대 쌍 유사도, 거절·재생성 수, 비교한 이전 회차를 기록합니다. 전체 쌍 행렬 대신 인물별 최근접 및 전체 최댓값을 저장할 수 있습니다.
- CLIP을 쓰게 되면 옷·배경을 제외한 얼굴 크롭과 별도로 보정한 상한을 사용해야 합니다. ArcFace의 0.35를 CLIP에 적용하지 않습니다. 실존 선수·연예인 사진 입력이나 닮은꼴 지시는 금지하고 시각 검수도 진행합니다. 생성 인물끼리의 임베딩 비교만으로 모든 실존 인물과 닮지 않았다고 증명할 수는 없습니다.
- 출력은 WebP **128·256px** 낱장과 **100명 / 10×10** 시트입니다. 시트 크기는 각각 **1280×1280 / 2560×2560**이며 여백·회전 없이 순서대로 배치합니다. manifest에는 낱장 경로와 크기별 시트 경로·index·행·열·x·y·폭·높이를 기록합니다.
- 회차당 크기별 시트 10장, 두 크기 합계 20장입니다. 최종 10회에는 시트 파일 200장입니다. 낱장 20,000개를 다른 게임 에셋과 함께 Cloudflare에 모두 배포하면 무료 파일 한도를 넘으므로, **배포는 시트+manifest를 기본으로 하고 낱장은 별도 보관**합니다. 낱장 목표는 128px 약 3KB / 256px 약 7KB이며 품질·용량을 함께 확인합니다.

## 미리보기 / 검증 / 출처

`previews/uniform_design_directions.png`는 구단별 홈·원정 앞면 비교판이고 `previews/uniforms_before_after.png`는 변경 전후 비교입니다. `ASSET_PREVIEW.png`에 전체를 모았고 `previews/`에 홈·원정, 모자, 숫자, 마크, 기준 판, 전체 구단 합성, 글자 자리, 밝은 배경 검수를 나누었습니다. 루트 manifest의 경로를 사용하세요. `validation.json`에 납품 범위 검증을, `checksums.json`에 자기 자신을 제외한 파일의 SHA-256/바이트 수를 기록합니다. 원본·미리보기·문서는 게임 런타임 번들에 넣지 마세요.

실존 인물 사진은 사용하지 않았습니다. 얼굴은 기존 가상 v4 인물을 기준으로 이미지 생성 도구로 편집했고, A의 유니폼은 가상 구단 정체성과 해외 야구·축구에서 관찰한 디자인 원리를 바탕으로 새로 생성했습니다. 외부 유니폼 사진·실존 로고 파일은 납품 에셋에 포함하지 않았습니다. 모자·마크·숫자는 원래 v3 도형과 DejaVu Sans Condensed Bold 글리프에서 제작한 자체 3D 모델입니다. 미리보기 한글은 Noto Sans CJK입니다. 폰트 바이너리는 포함하지 않습니다. DejaVu/Bitstream 고지를 아래에 제공합니다.

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
