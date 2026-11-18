-- 래더 진행 보고(검수 1019~1020): 종료한 리그의 늦은 보고를 막고, 보고된 포스트시즌 단계만 보관합니다.
CREATE TABLE IF NOT EXISTS ladder_live_state (
  player_id TEXT NOT NULL,
  lkey TEXT NOT NULL,
  ended INTEGER NOT NULL DEFAULT 0,
  stage TEXT NOT NULL DEFAULT '',
  post_done INTEGER,
  post_total INTEGER,
  revision INTEGER NOT NULL DEFAULT 0,
  progress INTEGER NOT NULL DEFAULT 0,
  opened INTEGER NOT NULL,
  at INTEGER NOT NULL,
  PRIMARY KEY (player_id, lkey)
);
CREATE INDEX IF NOT EXISTS live_state_player ON ladder_live_state (player_id, opened);
