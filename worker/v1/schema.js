/* D1 스키마(migrations/0001_init.sql과 글자 하나까지 같아야 한다: 점검이 비교). 관리자 POST /api/v1/admin/migrate가 문장별로 나눠 실행한다 */
export const SCHEMA_VERSION = 1;
export const SCHEMA_SQL = `-- 프런트야구 서버 v1 (Cloudflare D1, SQLite) 첫 스키마. docs/design/server-v1-2026-11-17.md
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
`;
/* 주석을 빼고 ; 로 나눈다(트리거 없음: 문장 안에 ; 가 없다) */
export const schemaStatements = (sql = SCHEMA_SQL) => sql.split("\n").filter(l => !/^\s*--/.test(l)).join("\n").split(";").map(x => x.trim()).filter(Boolean);
