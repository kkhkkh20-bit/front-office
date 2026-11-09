# 크레딧과 라이선스

이 게임은 가상의 프로야구 단장 시뮬레이션입니다. KBO(한국야구위원회)와 KBO 리그 구단, 실제 선수·스폰서와 관련이 없으며 승인이나 후원을 받지 않았습니다. 구단·선수·인물은 모두 가상입니다.

라이선스 전문은 [docs/licenses/](docs/licenses/)에 있습니다. 빌드할 때 `index.html` 안에 함께 실리고(게임 크레딧의 '라이선스 전문 보기'), 사이트판은 `licenses/*.txt`로 올라갑니다.

## 코드

| 항목 | 출처 | 라이선스 | 쓰는 곳 | 전문 |
| --- | --- | --- | --- | --- |
| faces.js | ZenGM — https://github.com/zengm-games/facesjs | Apache License 2.0 (**수정본**) | 선수 얼굴 (`vendor/faces.min.js`) | [facesjs.txt](docs/licenses/facesjs.txt) |
| lz-string | pieroxy — https://github.com/pieroxy/lz-string | MIT License | 저장 데이터 압축 (`vendor/lz-string.min.js`) | [lz-string.txt](docs/licenses/lz-string.txt) |
| fflate 0.8.2 | Arjun Barrett — https://github.com/101arrowz/fflate | MIT License | 저장 데이터 압축 (`vendor/fflate.min.js`) | [fflate.txt](docs/licenses/fflate.txt) |
| three.js r180 | three.js authors — https://threejs.org | MIT License | 3D 중계 | [match3d.txt](docs/licenses/match3d.txt) |
| Claudeball | Taylor Beeston — https://github.com/TaylorBeeston/claudeball | MIT License | 3D 선수·구장 모델, 애니메이션, 구장 질감 코드 (`assets/match3d/`) | [match3d.txt](docs/licenses/match3d.txt) |
| meshoptimizer 디코더 | Arseny Kapoulkine | MIT License | 3D 모델 압축 해제 | [match3d.txt](docs/licenses/match3d.txt) |
| Basis Universal 트랜스코더 | Binomial LLC | Apache License 2.0 | 3D 텍스처 변환 | [match3d.txt](docs/licenses/match3d.txt) |
| Lucide 아이콘 | https://lucide.dev | ISC License | 메뉴·버튼의 선 아이콘 일부 | [lucide.txt](docs/licenses/lucide.txt) |

- faces.js 수정 고지(Apache 2.0 4(b)): 게임에 들어간 사본은 축소 빌드에 브라우저 전역(`window.FJS`), 문서 도우미(`__FJDOC`), SVG 래퍼를 덧붙인 수정본입니다. 덧붙인 코드는 `vendor/faces.min.js` 끝에 있습니다.

## 3D 에셋 출처 (Claudeball)

- 3D 선수·구장: Claudeball(Taylor Beeston, MIT). 인체 메시·머리카락·눈·피부 텍스처는 MakeHuman/MPFB2 에셋(CC0 1.0), 재질 텍스처는 ambientCG(CC0 1.0), 애니메이션은 원작자가 Blender 파이썬 스크립트로 직접 만든 것입니다. 골격 이름 `mixamorig:*`는 이름 규칙만 따른 것이고 Mixamo 애니메이션은 쓰지 않았습니다. 자세한 내용은 [assets/match3d/README.md](assets/match3d/README.md).

## 글꼴

| 항목 | 라이선스 | 쓰는 곳 | 전문 |
| --- | --- | --- | --- |
| Noto Sans KR, Black Han Sans, Barlow Condensed | SIL Open Font License 1.1 | 글꼴(웹판은 실행 시 Google Fonts에서 불러옴, 파일은 포함 안 함) | [fonts.txt](docs/licenses/fonts.txt) |
| Alfa Slab One | SIL Open Font License 1.1 | 구단 배지 글자 외곽선(글꼴 파일 포함 안 함) | [fonts.txt](docs/licenses/fonts.txt) |
| DejaVu Sans Condensed Bold | Bitstream Vera 라이선스 | v3 배지 고정 글자 외곽선(글꼴 파일 포함 안 함) | [fonts.txt](docs/licenses/fonts.txt) |

## 지도·그림

| 항목 | 출처 | 라이선스 | 쓰는 곳 |
| --- | --- | --- | --- |
| 한국 권역 지도 | 통계청(KOSTAT) 2013 센서스용 행정구역경계, southkorea/southkorea-maps 단순화본 | "KOSTAT: free to share or remix" | `src/ui/assets/00g_korea_map.js` |
| 일본 지도 | Natural Earth 1:50m, world-atlas 2.0.2 | 공공 영역 | `src/ui/assets/00h_overseas_map.js` |
| 미국 주 경계 | 미국 인구조사국 2017, us-atlas 3.0.1 | 공공 영역 | `src/ui/assets/00h_overseas_map.js` |
| Sports Pack | Kenney — https://kenney.nl | CC0 1.0 (퍼블릭 도메인) | 카드 중계 경기장의 위에서 본 선수·방망이 그림 (`src/gfx/matches/kart.js`) |

출처 요약 전문: [data-sources.txt](docs/licenses/data-sources.txt)

- Kenney Sports Pack의 벡터 파일에서 몸통·팔·방망이 경로만 추출해 좌표를 옮기고, 셔츠 색을 팀 색으로 바꿀 수 있게 수정했습니다. CC0라 표기 의무는 없지만 출처를 남깁니다.
- 그 밖의 그림(구단 엠블럼, 트로피, 필드 등)과 게임 코드는 이 프로젝트에서 직접 만든 것입니다.
- 선수·스태프·팬 얼굴, 유니폼, 관중석, 트럭 시위 사진 등은 이미지 생성 도구로 만든 가상 인물·장면입니다.
- 경기 관중석은 이 프로젝트용으로 생성한 원화를 사용합니다. `assets/match/grandstand-source.png`가 원본이고 `grandstand.webp`는 웹 배포용 인코딩 파일입니다. 실제 경기장·관객 사진이나 다른 게임의 에셋은 아닙니다. 포함 방식은 [관중석 에셋 안내](assets/match/README.md)에 기록했습니다.

## 개인정보

웹판은 Google Analytics로 플레이 기록을 보냅니다(무작위 기기 번호, 화면 이동, 기능 사용, 오류). 설정에서 끌 수 있습니다. 처리방침 초안: [docs/privacy.md](docs/privacy.md).
