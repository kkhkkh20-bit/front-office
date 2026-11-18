-- 클라우드 저장(2026-11-18): 슬롯 목록·판번호, 기기 연결 코드·복구 코드, 기기 이름, 하루 올리기 횟수. 설계 docs/design/cloud-save-2026-11-17.md
-- 저장 본문은 D1이 아니라 R2(바인딩 SAVES, saves/<player_id>/<slot>/<rev>.bin)에 둔다.
-- 서버가 처음 쓸 때 스스로 만들므로(같은 문장, IF NOT EXISTS) 꼭 돌릴 필요는 없다. 미리 넣으려면 D1 콘솔에 붙여 넣거나, 관리자 POST /api/v1/admin/migrate, wrangler d1 migrations apply.
-- 같은 SQL이 worker/v1/cloud.js CLOUD_SQL에 있다(점검 tools/test/cloud-save.test.cjs가 같은지 본다).
CREATE TABLE IF NOT EXISTS cloud_saves (
  player_id TEXT NOT NULL,
  slot TEXT NOT NULL,
  rev INTEGER NOT NULL DEFAULT 0,
  wid TEXT,
  day INTEGER,
  date_label TEXT,
  team TEXT,
  ver TEXT,
  device_id TEXT,
  device_name TEXT,
  bytes INTEGER NOT NULL DEFAULT 0,
  sha256 TEXT,
  saved_at INTEGER,
  updated INTEGER NOT NULL,
  pending TEXT,
  pending_at INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (player_id, slot)
) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS cloud_codes (
  code_hash TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  created INTEGER NOT NULL,
  expires INTEGER NOT NULL DEFAULT 0
) WITHOUT ROWID;
CREATE INDEX IF NOT EXISTS cloud_codes_player ON cloud_codes (player_id, kind);
CREATE TABLE IF NOT EXISTS cloud_devices (
  secret_hash TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  name TEXT NOT NULL,
  at INTEGER NOT NULL
) WITHOUT ROWID;
CREATE INDEX IF NOT EXISTS cloud_devices_player ON cloud_devices (player_id);
CREATE TABLE IF NOT EXISTS cloud_usage (
  player_id TEXT NOT NULL,
  day TEXT NOT NULL,
  n INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (player_id, day)
) WITHOUT ROWID;
