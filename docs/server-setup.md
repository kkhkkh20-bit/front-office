# 서버 v1 켜기 (구단주용 설정 순서)

서버 v1(`/api/v1`, 래더 시즌·순위표·소식·맞대결·관리자 '래더 현황')은 Cloudflare **D1** 데이터베이스 하나가 있어야 켜집니다. 설계는 `docs/design/server-v1-2026-11-17.md`에 있습니다.

D1을 만들기 전에도 배포는 안전합니다. 그동안 `/api/v1/*`는 `503 not_configured`를 돌려주고, 게임은 지금 래더(KV)를 그대로 씁니다. 관리자 '래더 현황' 탭은 등록 덱 수·단계별만 보여 줍니다.

## 1. D1 데이터베이스 만들기 (약 1분)

1. https://dash.cloudflare.com 에 로그인합니다.
2. 왼쪽 메뉴 **Storage & databases** → **D1 SQL database**를 누릅니다.
3. 오른쪽 위 **Create Database**(또는 **Create**)를 누릅니다.
4. **Name**에 `fronttime-db`를 적습니다. Location은 비워 두거나 **Asia-Pacific**을 고릅니다. **Create**를 누릅니다.
5. 만들어진 데이터베이스 화면 위쪽의 **Database ID**(`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` 모양)를 복사해 둡니다. 3단계에서 씁니다.

## 2. 표 만들기 (SQL 붙여 넣기)

1. 방금 만든 `fronttime-db` 화면에서 **Console** 탭을 누릅니다.
2. 아래 SQL 전체(저장소 `migrations/0001_init.sql`과 같습니다)를 복사해 입력 칸에 붙여 넣고 **Execute**를 누릅니다.
3. 왼쪽(또는 **Tables** 탭)에 `players`, `decks`, `ladder_entries` 등 11개 표가 보이면 됩니다. 여러 번 실행해도 안전합니다(`IF NOT EXISTS`).

콘솔이 여러 문장을 한 번에 받지 않으면(오류가 나면): 4단계의 바인딩을 먼저 한 뒤, 게임 사이트를 연 브라우저에서 개발자 도구(F12) › Console에 아래 한 줄을 붙여 넣습니다. `관리자키`는 프런트컵 관리자 키(`CUP_ADMIN`)입니다. `{ok: true, schema: 1, ...}`가 나오면 표가 만들어진 것입니다.

```js
fetch('/api/v1/admin/migrate',{method:'POST',headers:{Authorization:'Bearer 관리자키'}}).then(r=>r.json()).then(console.log)
```

<details><summary>붙여 넣을 SQL 전문</summary>

```sql
-- 프런트야구 서버 v1 (Cloudflare D1, SQLite) 첫 스키마. docs/design/server-v1-2026-11-17.md
-- 대시보드 D1 콘솔에 전부 붙여 넣고 실행해도 되고(여러 번 실행해도 안전: IF NOT EXISTS), wrangler d1 migrations apply fronttime-db --remote 로 넣어도 된다.
-- 같은 SQL이 worker/v1/schema.js에도 있다(관리자 POST /api/v1/admin/migrate). 둘은 점검(tools/test/server-v1.test.cjs)이 같은지 본다.
CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'web',
  created INTEGER NOT NULL,
  last_seen INTEGER NOT NULL,
  nick_at INTEGER NOT NULL DEFAULT 0,
  hidden INTEGER NOT NULL DEFAULT 0,
  wid TEXT
);
CREATE INDEX IF NOT EXISTS players_seen ON players (last_seen);
CREATE TABLE IF NOT EXISTS devices (
  secret_hash TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'web',
  created INTEGER NOT NULL,
  last_seen INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS devices_player ON devices (player_id);
CREATE TABLE IF NOT EXISTS identities (
  provider TEXT NOT NULL,
  provider_uid TEXT NOT NULL,
  player_id TEXT NOT NULL,
  created INTEGER NOT NULL,
  PRIMARY KEY (provider, provider_uid)
);
CREATE INDEX IF NOT EXISTS identities_player ON identities (player_id);
CREATE TABLE IF NOT EXISTS decks (
  player_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  year INTEGER,
  ovr INTEGER NOT NULL DEFAULT 0,
  ovr_json TEXT,
  tier INTEGER NOT NULL DEFAULT 0,
  h TEXT,
  body TEXT NOT NULL,
  bytes INTEGER NOT NULL DEFAULT 0,
  created INTEGER NOT NULL,
  at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS decks_tier_ovr ON decks (tier, ovr);
CREATE INDEX IF NOT EXISTS decks_at ON decks (at);
CREATE TABLE IF NOT EXISTS ladder_seasons (
  id INTEGER PRIMARY KEY,
  starts INTEGER NOT NULL,
  ends INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  closed_at INTEGER
);
CREATE TABLE IF NOT EXISTS ladder_entries (
  season INTEGER NOT NULL,
  player_id TEXT NOT NULL,
  tier INTEGER NOT NULL DEFAULT 0,
  start_tier INTEGER NOT NULL DEFAULT 0,
  best_tier INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  leagues INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  ups INTEGER NOT NULL DEFAULT 0,
  downs INTEGER NOT NULL DEFAULT 0,
  titles TEXT NOT NULL DEFAULT '[]',
  updated INTEGER NOT NULL,
  PRIMARY KEY (season, player_id)
);
CREATE INDEX IF NOT EXISTS entries_board ON ladder_entries (season, tier, points);
CREATE INDEX IF NOT EXISTS entries_player ON ladder_entries (player_id, season);
CREATE TABLE IF NOT EXISTS league_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  season INTEGER NOT NULL,
  lkey TEXT NOT NULL,
  tier INTEGER NOT NULL,
  to_tier INTEGER NOT NULL,
  rank INTEGER NOT NULL,
  teams INTEGER NOT NULL,
  w INTEGER NOT NULL DEFAULT 0,
  l INTEGER NOT NULL DEFAULT 0,
  d INTEGER NOT NULL DEFAULT 0,
  delta INTEGER NOT NULL DEFAULT 0,
  opps TEXT NOT NULL DEFAULT '[]',
  at INTEGER NOT NULL,
  UNIQUE (player_id, lkey)
);
CREATE INDEX IF NOT EXISTS results_at ON league_results (at);
CREATE TABLE IF NOT EXISTS h2h (
  player_id TEXT NOT NULL,
  opp_id TEXT NOT NULL,
  n INTEGER NOT NULL DEFAULT 0,
  w INTEGER NOT NULL DEFAULT 0,
  l INTEGER NOT NULL DEFAULT 0,
  d INTEGER NOT NULL DEFAULT 0,
  at INTEGER NOT NULL,
  PRIMARY KEY (player_id, opp_id)
) WITHOUT ROWID;
CREATE INDEX IF NOT EXISTS h2h_opp ON h2h (opp_id, n);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  season INTEGER NOT NULL,
  kind TEXT NOT NULL,
  player_id TEXT NOT NULL,
  nickname TEXT NOT NULL,
  tier_from INTEGER,
  tier_to INTEGER,
  info TEXT,
  at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS events_at ON events (at);
CREATE TABLE IF NOT EXISTS daily_stats (
  day TEXT NOT NULL,
  k TEXT NOT NULL,
  v INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, k)
) WITHOUT ROWID;
INSERT OR IGNORE INTO meta (k, v) VALUES ('schema', '1');
```

</details>

위 SQL은 `migrations/0001_init.sql`과 글자 하나까지 같습니다(점검 `tools/test/server-v1.test.cjs`가 비교합니다).

## 3. 워커에 바인딩 `DB` 연결하기

바인딩은 **설정 파일(`wrangler.jsonc`)에 넣어야 오래 갑니다.** 대시보드에서만 추가하면 다음 자동 배포(main에 합칠 때) 때 설정 파일 기준으로 다시 덮여 사라질 수 있습니다(KV `SAVE_KV`도 같은 이유로 설정 파일에 넣었습니다).

- **A. 권장(오래 가는 방법)**: 1단계의 **Database ID**를 Claude에게 알려 주세요. `wrangler.jsonc`의 주석 줄을 풀어 넣고 main에 합치면 자동 배포가 바인딩까지 올립니다.

  ```jsonc
  "d1_databases": [{ "binding": "DB", "database_name": "fronttime-db", "database_id": "여기에-ID", "migrations_dir": "migrations" }],
  ```

- **B. 지금 바로 확인해 보기(대시보드)**: 다음 자동 배포 전까지만 유지될 수 있습니다.
  1. 왼쪽 메뉴 **Compute (Workers)** → **Workers & Pages** → `fronttime`을 누릅니다.
  2. **Settings** 탭 → **Bindings** → **+ Add**(또는 **Add binding**)를 누릅니다.
  3. **D1 database**를 고르고 **Variable name**에 `DB`(대문자), **D1 database**에서 `fronttime-db`를 고릅니다.
  4. **Add Binding**(또는 **Save** / **Deploy**)을 누릅니다.

## 4. 확인

브라우저에서 아래 주소를 엽니다.

https://fronttime.kkhkkh-20.workers.dev/api/v1/health

| 보이는 것 | 뜻 |
|---|---|
| `{"ok":true,"schema":1,"season":{"id":1,...}}` | 완료. 서버 v1이 켜졌습니다. |
| `{"error":"not_configured",...}` | 바인딩 `DB`가 아직 없습니다(3단계). 이름이 정확히 `DB`인지 확인하세요. |
| `{"error":"schema_missing",...}` | 바인딩은 됐지만 표가 없습니다(2단계). |

게임 안 **설정 › 정보 › 관리자 → 관리자 페이지 → 래더 현황** 탭에서 "서버 v1(D1)"이라고 보이면 관리자 집계도 켜진 것입니다.

**게임 화면(11-17부터)**: 유저 래더 화면이 health가 위처럼 나오면 자동으로 v1을 씁니다(따로 켤 것 없음). 예전 KV 래더에 덱을 올린 유저는 래더 화면을 열 때 덱·단계가 옮겨지고, D1 덱이 모자라는 동안 상대는 예전 KV 덱에서도 채웁니다(설계 문서 12-1절). 한 기기에서 v1을 끄고 예전 길을 시험하려면 주소 끝에 `?net=kv`(또는 콘솔 `localStorage.setItem('fo-net-v1','0')`). D1이 고장 나 health가 503이 되면 게임은 저절로 예전 KV 길로 돌아갑니다.

## 5. (선택) 유료 플랜으로 올리기 — 월 $5

하루 활성 유저가 1,000명 가까이 되면 D1 하루 쓰기 무료 한도(10만 줄)에 닿을 수 있습니다. 그때 올리면 됩니다.

1. 대시보드 왼쪽 **Compute (Workers)** → **Workers & Pages** → 오른쪽 **Plans**(또는 **Upgrade**)를 누릅니다.
2. **Workers Paid**($5/월)를 고르고 결제 수단을 넣습니다.
3. 따로 바꿀 설정은 없습니다. 같은 Worker·D1·KV가 유료 한도로 바뀝니다(요청 월 1,000만, D1 쓰기 월 5,000만 줄, KV 쓰기 월 100만 번 포함).

한도는 관리자 '래더 현황'의 **서버 사용량(오늘 추정)** 칸과 대시보드 **D1 › fronttime-db › Metrics**에서 봅니다.

## 6. (선택) 나중에

- **매일 시즌 확인(Cron Trigger, 무료)**: `wrangler.jsonc`의 `"triggers"` 주석을 풀면 됩니다. 없어도 요청이 들어올 때 시즌을 바꿉니다.
- **백업**: D1은 Time Travel로 무료 7일(유료 30일) 안의 어느 시점으로든 되돌릴 수 있습니다. `npx wrangler d1 time-travel restore fronttime-db --timestamp=<유닉스 시각>`.
- **앱(안드로이드·스팀)을 낼 때**: Worker 변수 `V1_ORIGINS`(앱 출처), 비밀값 `STEAM_WEB_API_KEY`·변수 `STEAM_APP_ID`, 비밀값 `GPGS_CLIENT_SECRET`·변수 `GPGS_CLIENT_ID`. 설계 문서 6절 참고.

## 7. 클라우드 저장 켜기 (R2, 11-18)

클라우드 저장(설정 › 저장의 '클라우드 저장 켜기', 설계 `docs/design/cloud-save-2026-11-17.md`)은 저장 본문을 Cloudflare **R2** 버킷에, 목록·판번호·연결 코드를 D1에 둡니다. 코드: `worker/v1/cloud.js`, 화면: `src/ui/shell/01d_cloud.js`.

R2 바인딩 `SAVES`가 없으면 클라우드 저장 API만 `503 not_configured`를 돌려주고, 게임 화면은 클라우드 카드를 숨기고 설정에 "준비 중" 한 줄만 보입니다. 나머지(래더·기기 옮기기·로컬 저장)는 그대로입니다.

### 7-1. R2 버킷과 바인딩

1. 대시보드 → **Storage & databases → R2 Object Storage → Create bucket**. 이름 `fronttime-saves`, 위치 힌트는 **Asia-Pacific**(선택). 공개 접근(Public access)은 켜지 않습니다. *(11-18 운영자가 만들었습니다.)*
2. `wrangler.jsonc`에 바인딩이 들어 있습니다(Worker와 같은 계정의 버킷이어야 합니다).

   ```jsonc
   "r2_buckets": [{ "binding": "SAVES", "bucket_name": "fronttime-saves" }],
   ```

   main에 합치면 자동 배포가 바인딩까지 올립니다. 대시보드 Worker(`fronttime`) → Settings → Bindings에 `SAVES`(R2)가 보이면 됩니다. 버킷이 없는 계정에 이 줄을 넣으면 배포가 실패하므로, 버킷을 지우거나 이름을 바꿨으면 이 줄도 고치거나 주석(`//`)으로 돌리세요.

### 7-2. D1 표(migrations/0003)

서버가 클라우드 요청을 처음 받을 때 표를 스스로 만들므로(같은 SQL, `IF NOT EXISTS`) 꼭 할 필요는 없습니다. 미리 만들어 두려면 둘 중 하나를 합니다(여러 번 해도 안전).

- D1 콘솔(`fronttime-db` → **Console**)에 `migrations/0003_cloud_saves.sql` 전체를 붙여 넣고 **Execute**. `cloud_saves`, `cloud_codes`, `cloud_devices`, `cloud_usage` 4개 표가 생깁니다.
- 또는 배포 뒤 게임 사이트의 개발자 도구 Console에서 관리자 마이그레이션(0001·0002·0003·0004를 모두 실행합니다. 0004는 래더 기록실 표 `ladder_lines`·`ladder_teams`이며, 이것도 서버가 처음 쓸 때 스스로 만듭니다):

  ```js
  fetch('/api/v1/admin/migrate',{method:'POST',headers:{Authorization:'Bearer 관리자키'}}).then(r=>r.json()).then(console.log)
  ```

  `{ok: true, schema: 1, statements: 35}`처럼 나오면 됩니다.

### 7-3. 확인

- `https://fronttime.kkhkkh-20.workers.dev/api/v1/cloud` → `{"ok":true,"max_slots":3,...}`이면 켜진 것입니다. `{"error":"not_configured",...}`이면 `SAVES` 바인딩이 없습니다(7-1).
- 게임 설정 › 저장·기기 › **클라우드 저장** 카드에 '클라우드 저장 켜기'가 보입니다.
- 관리자 '래더 현황' 응답(`GET /api/v1/admin/stats`)의 `cloud`에 슬롯 수·용량·오늘 올리기 수가 나옵니다(본문은 읽지 않습니다).

### 7-4. 한도와 비용

- 플레이어당 클라우드 슬롯 3개(게임 세계 번호마다 하나), 슬롯마다 최근 3판 보관, 본문 16MB 이하.
- 올리기는 플레이어당 분당 6번·하루 200번, 받기는 분당 30번, 기기 연결 코드·복구 코드 입력은 IP당 시간당 10번. 넘으면 429.
- R2 무료: 저장 10GB, 쓰기(Class A) 월 100만 회, 읽기 월 1,000만 회. 하루 활성 1,000명까지는 무료 범위로 봅니다(설계 문서 2절). 사용량은 대시보드 **R2 → fronttime-saves → Metrics**.
- 플레이어가 래더의 **서버 기록 지우기**(`DELETE /api/v1/player`)를 하거나 관리자가 플레이어를 지우면 그 플레이어의 R2 본문과 클라우드 표 줄도 함께 지웁니다.
