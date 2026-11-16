# 프런트컵 주최 안내

제1회 프런트컵은 **한 번 여는 대회**입니다(정기 일정 없음). 다음에 또 열면 대회 id만 새로 정합니다(`cup2`…).

- 형식(A): 10팀 리그 → KBO식 가을야구
  - 리그: 짝마다 3연전 한 번씩(홈·원정·홈), 팀당 27경기. 모든 구장 같은 규격, 홈 어드밴티지 없음.
  - 순위: 승률(무승부 제외) → 동률 팀끼리 맞대결 → 득실차.
  - 와일드카드: 4위 vs 5위, 최대 2경기. 4위가 1승을 안고 시작해 한 번 이기거나 비기면 진출.
  - 준PO 3위(5전3선승) → PO 2위(5전3선승) → 한국시리즈 1위(7전4선승).
  - 10팀이 안 되면 리그 평균 AI 구단으로 채웁니다. AI는 개인 타이틀·칭호를 받지 않습니다.
- 같은 참가 파일이면 누가 돌려도 같은 결과입니다(대회 id·경기 번호·엔트리 해시로 시드).

---

## 0. 첫 대회 전에 한 번만

1. **cup-kit을 main에 합칩니다.** main에 올라가면 Cloudflare가 자동으로 사이트와 Worker를 새로 배포합니다.
   배포 확인: `https://fronttime.kkhkkh-20.workers.dev/release.json`의 빌드가 새것인지 봅니다.
2. **주최자 비밀값(CUP_ADMIN)을 정합니다.** 길고 아무도 모르는 값(예: 32자 무작위)으로.
   - 대시보드: Cloudflare › Workers & Pages › `fronttime` › Settings › Variables and Secrets › Add › 종류 **Secret**, 이름 `CUP_ADMIN`.
   - 또는 명령: `npx wrangler secret put CUP_ADMIN`
   - KV는 기기 옮기기와 같은 `SAVE_KV`를 씁니다. `wrangler.jsonc`는 고치지 않습니다.
3. **주최 컴퓨터 준비**
   ```
   git pull                                   # main 최신
   bash build.sh --engine-out dist/engine.js  # 엔진 파일(dist/engine.js)
   export CUP_ADMIN=정한비밀값                 # 창을 새로 열면 다시
   ```
   카드·대진표 그림을 만들 때만 `npm --prefix tools ci`(Playwright)가 필요합니다. 리그 진행에는 필요 없습니다.

## 1. 대회 열기(접수 시작)

```
node tools/cup-host.cjs init cups/c1 --id cup1 --title "제1회 프런트컵" --deadline "2026-12-05 21:00"
node tools/cup-host.cjs publish cups/c1 --url https://fronttime.kkhkkh-20.workers.dev
```

- `--deadline`은 한국시간 접수 마감입니다. 마감 뒤 서버 신청은 자동으로 거절됩니다.
- 자격을 걸려면 `--min-seasons 2`(최소 2시즌 진행), `--pay-cap 금액`(1군 연봉 합 상한).
- 확인: `…/api/cup`이 `ok`를 돌려주면 게임의 **구단 › 프런트컵**에 '대회 참가 신청' 버튼이 보입니다.
- 참가팀 명단(누구나): `…/api/cup/entries.html`

## 2. 참가 받기 — 두 가지 길

**길 1. 게임 안 '대회 참가 신청'(기본)**
유저가 버튼을 누르면 서버(KV)에 저장됩니다. 저장마다 1개, 다시 내면 덮어쓰기, 하루 1회.
마감 뒤 주최자가 한 번에 받습니다.
```
node tools/cup-host.cjs pull cups/c1 --url https://fronttime.kkhkkh-20.workers.dev
```

**길 2. '참가 파일 저장'(예비)**
서버 신청이 안 될 때(내려받은 게임, 연결 문제) 유저가 같은 화면의 **참가 파일 저장**을 누르면
`frontcup-cup1-2026-xxxxxx.json` 파일이 생깁니다. 유저는 이 파일을 카페 쪽지·메일로 보냅니다.
받은 파일을 넣습니다.
```
node tools/cup-host.cjs add cups/c1 받은파일1.json 받은파일2.json
```
- 같은 저장(세계 id)에서 두 번 오면 새 파일이 예전 것을 바꿉니다. 서버 신청과 파일이 겹쳐도 하나만 남습니다.

## 3. 마감 뒤 확인

```
node tools/cup-host.cjs list cups/c1        # 참가팀·OVR·오류·자격·이상치
node tools/cup-host.cjs drop cups/c1 해시    # 문제 엔트리 빼기(--undo 되돌리기)
```
- 이상치(능력 85 초과, 나이·잠재력 범위 밖, 해시 불일치)는 받되 표시만 합니다. 뺄지는 주최자가 정합니다.
- 10팀이 넘으면 OVR 순 상위 10팀만 나갑니다. 미리 `drop`으로 정리하세요.

## 4. 시드 → 경기

```
node tools/cup-host.cjs seed cups/c1     # 시드 확정(모자라면 AI로 채움) → out/day1
node tools/cup-host.cjs run cups/c1      # 리그 27경기 + 가을야구 전부(몇 초) → out/day2~day7, out/final
node tools/cup-host.cjs status cups/c1   # 순위·가을야구 확인
```
결과는 미리 다 나오고, 게시는 하루씩 나눠 올립니다.

## 5. 날짜별 게시

| 날 | 올릴 것 | 폴더 |
|---|---|---|
| 1일 | 참가팀·진행 방식·전력표 | `out/day1/post.txt` |
| 2일 | 리그 1~3라운드: 결과·순위·주간 MVP·명경기 | `out/day2/post.txt`, `out/day2/명경기/` |
| 3일 | 리그 4~6라운드 | `out/day3/` |
| 4일 | 리그 7~9라운드 + 최종 순위·가을야구 진출·개인 1위 | `out/day4/` |
| 5일 | 와일드카드 + 준PO | `out/day5/post.txt`, `out/day5/WC/g1…`, `out/day5/SPO/g1…` |
| 6일 | PO | `out/day6/` |
| 7일 | 한국시리즈 | `out/day7/` |
| 마지막 | 최종 결과·개인 타이틀·다시 보기 번호 | `out/final/post.txt`, `out/final/codes.txt` |

- 경기 폴더마다 `post.txt`(글), `EventLog.txt`(중계), `EventLog_bat.txt`·`EventLog_pit.txt`(박스), `LineScore.txt`(줄 점수).
- 개인 타이틀 규정: 타율·출루율 84타석, 평균자책점·WHIP·K/9 27이닝(27경기 기준 KBO 비율).

## 6. 끝난 뒤 올리기

```
node tools/cup-host.cjs publish cups/c1 --url https://fronttime.kkhkkh-20.workers.dev
```
- 접수를 닫고, 경기 다시 보기 묶음과 명예의 전당 결과(`out/hall.json`)를 올립니다.
- 유저는 **구단 › 프런트컵 › 대회 경기 보기**에 `cup1-KS`, `cup1-L1-1` 같은 번호를 넣어 같은 경기를 다시 봅니다.
- **프런트컵 명예의 전당**: 처음 화면 메뉴, 설정 › 정보에서 누구나(참가 안 해도) 우승·준우승 로스터를 봅니다. 한 번 받으면 연결이 없어도 보입니다.
- 우승·준우승 저장에는 칭호가 붙습니다(전력 영향 없음, AI 제외).
- 다음 회차: 새 폴더로 `init --id cup2 …`, 결과를 만들 때 `CUP_HALL=cups/c1/out/hall.json`을 두면 지난 회차가 전당에 이어집니다.

## 참고

- 시험: `node tools/cup-host.cjs mock cups/test --n 10`(가짜 참가 10팀, 몇 분) → `seed` → `run`. 예시 결과: `docs/cup-sample/league/`.
- 예전 토너먼트 형식도 남아 있습니다: `init … --format knockout --size 32 --best "1,8:7,4:7,2:7"` 뒤 `seed`·`next`·`bracket`·`results`.
- 엔트리: 신청 순간의 1군(타순·선발·불펜·부상 그대로), 투수 피로만 0, 사기 60. 리그에서는 선발 순번이 연전을 넘어 이어집니다.
