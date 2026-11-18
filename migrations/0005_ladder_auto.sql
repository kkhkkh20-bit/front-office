-- 래더 v4(2026-11-18): 자동 등록·자동 참가 끄기·진행 중 리그·끝난 리그 요약(관리자 한눈 보기). 설계 docs/design/ladder-v4-2026-11-18.md
-- 서버가 처음 쓸 때 스스로 만들므로(같은 문장, IF NOT EXISTS) 꼭 돌릴 필요는 없다. 미리 넣으려면 D1 콘솔에 붙여 넣거나, 관리자 POST /api/v1/admin/migrate, wrangler d1 migrations apply.
-- 같은 SQL이 worker/v1/ladauto.js AUTO_SQL에 있다(점검 tools/test/ladder-auto.test.cjs가 같은지 본다).
CREATE TABLE IF NOT EXISTS ladder_reg (
  player_id TEXT PRIMARY KEY,
  auto INTEGER NOT NULL DEFAULT 0,
  off INTEGER NOT NULL DEFAULT 0,
  cap_ok INTEGER NOT NULL DEFAULT 1,
  pay_x REAL,
  dev TEXT,
  man_day TEXT,
  created INTEGER NOT NULL,
  at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS reg_dev ON ladder_reg (dev);
CREATE TABLE IF NOT EXISTS ladder_live (
  player_id TEXT PRIMARY KEY,
  lkey TEXT NOT NULL,
  tier INTEGER NOT NULL,
  round INTEGER NOT NULL DEFAULT 0,
  post INTEGER NOT NULL DEFAULT 0,
  teams TEXT NOT NULL DEFAULT '[]',
  st TEXT NOT NULL DEFAULT '[]',
  started INTEGER NOT NULL,
  at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS live_at ON ladder_live (at);
CREATE TABLE IF NOT EXISTS ladder_leagues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  lkey TEXT NOT NULL,
  season INTEGER NOT NULL,
  tier INTEGER NOT NULL,
  rank INTEGER NOT NULL,
  teams INTEGER NOT NULL DEFAULT 10,
  w INTEGER NOT NULL DEFAULT 0,
  l INTEGER NOT NULL DEFAULT 0,
  d INTEGER NOT NULL DEFAULT 0,
  ps TEXT NOT NULL DEFAULT '',
  champ TEXT,
  runner TEXT,
  top TEXT,
  st TEXT NOT NULL DEFAULT '[]',
  flag TEXT NOT NULL DEFAULT '',
  at INTEGER NOT NULL,
  UNIQUE (player_id, lkey)
);
CREATE INDEX IF NOT EXISTS leagues_at ON ladder_leagues (at);
