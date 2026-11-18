-- 래더 기록실(2026-11-18): 리그가 끝날 때 올린 우리 선수 상위 기록 줄과 팀 요약(정규 순위·포스트시즌 우승/준우승). 설계 docs/design/ladder-series-2026-11-18.md
-- 서버가 처음 쓸 때 스스로 만들므로(같은 문장, IF NOT EXISTS) 꼭 돌릴 필요는 없다. 미리 넣으려면 D1 콘솔에 붙여 넣거나, 관리자 POST /api/v1/admin/migrate, wrangler d1 migrations apply.
-- 같은 SQL이 worker/v1/records.js REC_SQL에 있다(점검 tools/test/ladder-records.test.cjs가 같은지 본다).
CREATE TABLE IF NOT EXISTS ladder_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  season INTEGER NOT NULL,
  tier INTEGER NOT NULL,
  player_id TEXT NOT NULL,
  lkey TEXT NOT NULL,
  kind TEXT NOT NULL,
  name TEXT NOT NULL,
  team TEXT,
  g INTEGER NOT NULL DEFAULT 0,
  pa INTEGER NOT NULL DEFAULT 0,
  ab INTEGER NOT NULL DEFAULT 0,
  h INTEGER NOT NULL DEFAULT 0,
  tb INTEGER NOT NULL DEFAULT 0,
  hr INTEGER NOT NULL DEFAULT 0,
  rbi INTEGER NOT NULL DEFAULT 0,
  sb INTEGER NOT NULL DEFAULT 0,
  ob INTEGER NOT NULL DEFAULT 0,
  sf INTEGER NOT NULL DEFAULT 0,
  outs INTEGER NOT NULL DEFAULT 0,
  er INTEGER NOT NULL DEFAULT 0,
  so INTEGER NOT NULL DEFAULT 0,
  sv INTEGER NOT NULL DEFAULT 0,
  w INTEGER NOT NULL DEFAULT 0,
  wh INTEGER NOT NULL DEFAULT 0,
  at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS lines_board ON ladder_lines (season, kind, tier);
CREATE INDEX IF NOT EXISTS lines_player ON ladder_lines (player_id);
CREATE TABLE IF NOT EXISTS ladder_teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  season INTEGER NOT NULL,
  tier INTEGER NOT NULL,
  player_id TEXT NOT NULL,
  lkey TEXT NOT NULL,
  team TEXT,
  rank INTEGER NOT NULL,
  w INTEGER NOT NULL DEFAULT 0,
  l INTEGER NOT NULL DEFAULT 0,
  d INTEGER NOT NULL DEFAULT 0,
  rs INTEGER NOT NULL DEFAULT 0,
  ra INTEGER NOT NULL DEFAULT 0,
  hr INTEGER NOT NULL DEFAULT 0,
  ps TEXT NOT NULL DEFAULT '',
  at INTEGER NOT NULL,
  UNIQUE (player_id, lkey)
);
CREATE INDEX IF NOT EXISTS teams_board ON ladder_teams (season, tier, w);
CREATE INDEX IF NOT EXISTS teams_ps ON ladder_teams (ps, id);
