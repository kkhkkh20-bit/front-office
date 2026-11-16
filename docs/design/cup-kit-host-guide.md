# 프런트컵 주최 안내 (주최 도구 1단계)

유저가 게임에서 낸 1군 로스터로 대회를 엽니다. 경기는 게임과 같은 엔진(simGame)으로 돌고, 같은 입력이면 누가 돌려도 같은 결과가 나옵니다.

## 0. 처음 한 번

1. 엔진을 만듭니다: `bash build.sh --engine-out dist/engine.js`
2. 이미지(카드·대진표)를 만들려면 `npm --prefix tools ci`로 Playwright를 깝니다.
3. 서버 신청을 받으려면 Worker 비밀값을 정합니다: `npx wrangler secret put CUP_ADMIN` (KV는 기기 옮기기와 같은 `SAVE_KV`를 씁니다. 설정 파일은 바꾸지 않습니다.)
4. 주최 컴퓨터에서 같은 값을 환경 변수로 둡니다: `export CUP_ADMIN=비밀값`

## 1. 대회 만들기

```
node tools/cup-host.cjs init cups/c1 --id cup1 --title "제1회 프런트컵" --size 32 --best "1,8:7,4:7,2:7" --min-seasons 2 --deadline "2026-11-30 21:00"
node tools/cup-host.cjs publish cups/c1 --url https://사이트     # 대회 설정을 서버에 올립니다(접수 시작)
```

- `--best "1,8:7"`: 기본 단판, 8강부터 7전4선승. `3`이면 3판2선승입니다.
- 128강까지 됩니다(`--size 128`). 참가팀이 모자라면 높은 시드가 부전승입니다.
- 플레이인: `--playin 16:4`(상위 16팀 직행, 나머지는 조별 단판으로 남은 자리). Top-8 추첨: `--shuffle 8`. 블록 표시: `--blocks 4`.
- 자격: `--min-seasons N`(최소 진행 시즌), `--pay-cap 금액`(1군 연봉 합 상한, 게임 연봉 단위).

참가팀 명단은 `https://사이트/api/cup/entries.html`에서 누구나 볼 수 있습니다(시드 순 OVR).

## 2. 접수 마감 뒤

```
node tools/cup-host.cjs pull cups/c1 --url https://사이트     # 서버 신청 받기
node tools/cup-host.cjs add cups/c1 받은파일.json              # 파일로 받은 엔트리(게임의 '엔트리 파일 받기')
node tools/cup-host.cjs list cups/c1                           # OVR·오류·자격·이상치 확인
node tools/cup-host.cjs drop cups/c1 해시                      # 문제 있는 엔트리 빼기(--undo로 되돌리기)
node tools/cup-host.cjs faces cups/c1                          # 사진이 빠진 선수 얼굴 채우기
node tools/cup-host.cjs seed cups/c1                           # 시드·대진표 확정
```

- OVR은 `총|투수 타자`입니다. 총점은 게임의 팀 전력(teamRating)과 같은 식이고, 주최 도구가 다시 계산합니다.
- 이상치(능력 85 초과, 나이·잠재력 범위 밖, 해시 불일치, 포수 아닌 포수)는 받되 `list`에 표시합니다. 빼는 것은 주최자가 정합니다.

## 3. 경기

```
node tools/cup-host.cjs next cups/c1          # 다음 경기(시리즈) 하나
node tools/cup-host.cjs status cups/c1        # 대진 현황
node tools/cup-host.cjs bracket cups/c1       # 대진표 PNG
node tools/cup-host.cjs cards cups/c1         # 로스터 카드 PNG
```

경기마다 `cups/c1/out/경기id/`(시리즈면 `g1`, `g2`…)에 다음 파일이 생깁니다.

- `EventLog.txt` 중계, `EventLog_bat.txt`·`EventLog_pit.txt` 박스(탭 구분), `LineScore.txt` 줄 점수
- `post.txt` 게시글 초안(선발 매치업·하이라이트·결과·선수 기록·MVP 후보·대진표 갱신)

중간에 멈춰도 됩니다. 상태는 `cup.json`에 남고, 다시 `next`를 부르면 이어집니다.

## 4. 끝난 뒤

```
node tools/cup-host.cjs results cups/c1                     # 우승·준우승·4강·미션상·개인 타이틀
node tools/cup-host.cjs publish cups/c1 --url https://사이트  # 경기 다시 보기·유저의 전당 올리기
```

- 지난 회차를 유저의 전당에 이어 붙이려면 `CUP_HALL=지난/out/hall.json`을 두고 `results`를 부릅니다.
- 게임에서 `구단 › 프런트컵 › 대회 경기 보기`에 `cup1-R32M3` 같은 번호를 넣으면 같은 경기를 다시 돌려 봅니다.
- 우승·준우승한 저장에는 칭호(예: 제1회 프런트컵 우승 단장)가 붙습니다. 전력에 영향을 주는 보상은 없습니다.

## 규칙 메모

- 엔트리: 신청 순간의 1군(타순·선발·불펜·부상 그대로), 투수 피로만 0. 사기는 60, 시즌 컨디션은 넣지 않습니다.
- 경기: 가을야구 규칙(무승부 없음), 모든 구장 같은 규격, 홈 어드밴티지 없음. 시리즈는 1차전을 높은 시드가 홈으로 하고 번갈아 합니다.
- 경기 시드: 대회 id · 라운드 · 경기 번호 · 두 엔트리 해시.
- 신청: 세계 id(저장마다 하나)당 대회마다 1개, 다시 내면 덮어쓰기, 하루 1회, 마감(한국시간) 뒤 거절, 팀명 12자·금칙어 거절.
