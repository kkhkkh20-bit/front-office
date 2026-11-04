# Front Office 에셋 v4

요청서: `docs/asset-requests/2026-11-05-codex-v4-render.md`.
게임 코드 수정 없이 추가하는 이미지·3D 원본·메타데이터 납품입니다. 화면 연결은 Claude 담당입니다.

## A — 실제 3D 모델 / PBR 렌더

v3의 트로피·상 **19종**, 대기록 배지 **11종**을 같은 ID로 제공합니다. 기존의 도상, 기본 실루엣, 명판·부문명·공용 숫자 자리를 유지했습니다. 원본 도형을 두께·베벨이 있는 금속/에나멜 입체로 재구성했고, 컵·공·배트·글러브 포켓·반지·메달 몸체에는 별도 곡면/회전체 모델을 사용했습니다. 2D 그림에 그림자만 덧붙인 결과물이 아닙니다.

| 납품 | 위치 | 수량 |
| --- | --- | ---: |
| 트로피 PNG | `trophies/png/{64,128,256,512}/` | 76 |
| 트로피 WebP | `trophies/webp/{64,128,256,512}/` | 76 |
| 대기록 PNG | `feats/png/{64,128,256,512}/` | 44 |
| 대기록 WebP | `feats/webp/{64,128,256,512}/` | 44 |
| 편집 가능한 3D 스튜디오 | `source/pbr_collectibles.blend` | 1 |

모든 A 이미지는 **정사각형 RGBA / 투명 배경**입니다. WebP는 각 PNG와 같은 해상도의 무손실 파일입니다. 64px는 파일당 15KiB 이하이며 PNG 실측 최댓값은 **7,336바이트**입니다. 상세 실측값은 `manifest.json`의 `validation.png64_actual_max_bytes`에 기록합니다.

Blender **4.3.2 / Cycles CPU / 128 samples**, 금·은·동의 금속성 재질, 코팅 에나멜, 광학 크리스털, 절차적 월넛 재질을 사용했습니다. 대형 키/필/림/상부 소프트박스 4개와 중립 환경광으로 렌더링했습니다. 동일한 정사영 3/4 카메라의 높이 각도는 약 **13도**, 좌우 각도는 약 **16.5도**입니다. AgX / Medium High Contrast 색 변환 후 Open Image Denoise 1.4.3로 컬러 노이즈를 줄였으며, 렌더러의 알파는 유지했습니다. 투명 필름과 제한된 면적의 섀도 캐처가 접지 그림자를 만듭니다.

`.blend`에는 30개의 ID별 컬렉션과 `STUDIO`가 있습니다. 처음에는 에셋 컬렉션의 렌더가 모두 꺼져 있습니다. 원하는 ID 컬렉션 하나의 렌더를 켜고 `STUDIO`를 유지하면 같은 구도로 수정·렌더할 수 있습니다. 생성 스크립트나 외부 텍스처 의존성은 포함하지 않았습니다. 재렌더에는 별도 OIDN 후처리를 적용해야 납품 PNG와 같은 노이즈 수준이 됩니다.

## 글자 자리

`manifest.json`의 `assets[ID].text_slots`와 `source/text_slots.json`에 실제 카메라로 투영한 **512×512 기준 좌표**를 기록했습니다.

- `quad`: 좌상 → 우상 → 우하 → 좌하 순서의 명판 사각형. 3/4 투시 방향을 반영합니다.
- `rect`: 해당 사각형을 감싸는 바운딩 박스. 정밀한 합성에는 `quad`를 사용합니다.
- `baseline_segment`, `anchor`, `max_font_size`: 렌더 기준 글자 배치 정보.
- `source_v3`: v3 원래 좌표/라벨 정보. v4 이미지에 이 좌표를 직접 사용하지 마세요.
- 다른 해상도에서는 모든 좌표와 글자 크기에 `출력 폭 / 512`를 곱합니다.

부문명을 동적으로 쓰는 경우 `batting_title_blank`, `pitching_title_blank`를 선택하세요. 일반 버전의 BATTING/PITCHING은 모델에 새겨진 고정 글자입니다. 공용 `career_milestone_frame`, `season_record_frame`에는 선수명·기록 숫자를 넣지 않았습니다. 명판에는 이름이나 연도가 구워져 있지 않습니다. `previews/text_slots.png`에서 빈 영역과 좌표를 확인할 수 있습니다.

## B — 실사풍 얼굴 시험 세트

이미지 생성 도구로 제작한 **가상 인물 10명 × 모자 미착용/착용 = 20장**입니다. 각 장면은 머리부터 어깨·가슴 윗부분까지 정면으로 촬영한 구도입니다. 512px와 128px RGB PNG를 `faces_test/png/{512,128}/`에 제공합니다. 총 40개 PNG입니다.

| 구성 | 인원 |
| --- | ---: |
| 한국인 남성 20대 초반 / 후반 | 각 2 |
| 한국인 남성 30대 | 2 |
| 한국인 남성 30대 후반·수염 / 안경 | 각 1 |
| 히스패닉 남성 / 흑인 남성 | 각 1 |

서울 코메츠와 광주 블레이즈의 v3 홈 유니폼·모자를 참고했습니다. 단추 줄, 칼라, 파이핑, 가슴 워드마크 일부를 표현했습니다. 모자 유무를 같은 생성 묶음에서 짝으로 제작해 얼굴의 연속성을 우선했습니다. 실존 인물 사진을 입력하지 않았으며 특정 선수·연예인의 닮은꼴을 지시하지 않았습니다.

배경은 `#20262e`를 목표로 한 불투명 짙은 회색이며 생성 이미지 특유의 작은 색조 차이가 있습니다. 투명 이미지로 간주하지 마세요. 모자 착용 쌍과 유니폼의 미세한 형태에도 생성 오차가 있을 수 있습니다. **정식 전 선수 얼굴 교체 전 스타일 평가용**입니다. 피부톤·연령·수염·안경·모자·구단 태그와 쌍 관계는 루트 manifest 및 `faces_test/manifest.json`에 있습니다.

## 미리보기와 검증

- `ASSET_PREVIEW.png`: A 30종과 B 20장을 모은 전체 미리보기.
- `previews/trophies_dark.png`, `feats_dark.png`: 어두운 배경의 전수 미리보기.
- `previews/collectibles_light.png`: 밝은 배경에서 알파/그림자 확인.
- `previews/collectibles_64px.png`: 실제 64px 표시.
- `previews/faces_pairs.png`: 모자 미착용/착용을 나란히 비교.
- `previews/text_slots.png`: 빈 명판과 숫자 틀의 글자 영역 확인.

납품 검증은 ID 30종 일치, 모든 이미지 크기·알파·테두리 잘림·파일 경로, 64px 용량, 얼굴 구성과 쌍, SHA-256 체크섬을 포함합니다. `checksums.json`은 자기 자신을 제외한 모든 납품 파일의 크기와 해시를 기록합니다. 미리보기·3D 원본·문서를 런타임 번들에 넣지 마세요.

## 제작 출처·서체

A는 이 프로젝트의 v3 원형을 바탕으로 새로 모델링·렌더링했습니다. 실존 대회 트로피나 실존 구단 로고를 복제하지 않았습니다. B는 이미지 생성으로 만든 가상 인물이며 실제 사진 라이브러리를 사용하지 않았습니다. 새 이미지 생성물과 이 프로젝트의 가상 구단 디자인을 결합한 시험 이미지입니다.

v3의 고정 글자 외곽선은 DejaVu Sans Condensed Bold를 사용하며 미리보기 한국어는 Noto Sans CJK를 사용합니다. 폰트 바이너리는 포함하지 않습니다. DejaVu/Bitstream 고지는 아래에 포함합니다.

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
