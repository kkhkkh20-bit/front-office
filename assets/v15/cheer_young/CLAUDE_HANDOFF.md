# Claude handoff — v15 cheer_young

브랜치 `assets/v15-review`, 루트 `assets/v15/cheer_young/`. main 병합 없음, 코드 수정 없음.

젊은 한국인 치어리더 단원40명입니다. 요청대로 기존v14단원12명·v12팀장사진을 단원 카드에서 대체할 수 있도록 새 풀로 납품합니다. 게임 연결 코드는 작성하지 않았습니다. 여성40·한국인 캐스팅40·20~26세, 모두 반팔 응원 유니폼과 흐린 야구장 배경입니다.

`manifest.json`의 path는 해당 `path_base` 기준입니다.128·256RGB10×10, 패딩0, 앞40칸이 인물순서이고 나머지60칸은 검정 채움입니다(손실압축 경계 번짐 통계는 validation.json 참고). `identities[].sheets[128|256].path·rect`를 사용하세요. `hair`는 straight/pony/wave/bob, `smile`은 broad/soft, `bg`는 day/night입니다. `id`, `a`, `f:1`, `r:"cheer"`를 제공합니다.

| 해상도 | WebP q | bytes | 파일 |
|---|---:|---:|---|
| 128 | 80 | 180696 | `sheets/128/cheer_young.webp` |
| 256 | 80 | 495350 | `sheets/256/cheer_young.webp` |

이번40명 사이 ArcFace raw<0.40을 실제 납품128/256에서 통과했습니다. 최대값128=0.399586,256=0.398948. 검수 범위와 한계는 README/validation.json을 참조하세요. 사진 원본과 미납품 가상 캐스팅 출처를 메타데이터에 구분했고 공통몸통/얼굴붙이기 합성은 없습니다.

검수판: `previews/all40_256.jpg`, `previews/card_size180.jpg`. 게임 연결 및 게임 내 최종 확인은 후속 작업입니다.
