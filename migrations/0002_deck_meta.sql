-- 래더 v2(2026-11-17): 덱 구성 요약(메타). docs/design/ladder-v2-2026-11-17.md
-- 서버가 처음 쓸 때 스스로 만들므로(같은 문장, IF NOT EXISTS) 꼭 돌릴 필요는 없다. 미리 넣으려면 D1 콘솔에 붙여 넣거나 wrangler d1 migrations apply.
-- 같은 문장이 worker/v1/ladder.js META_SQL에 있다(점검 tools/test/server-v1.test.cjs가 같은지 본다).
CREATE TABLE IF NOT EXISTS deck_meta (player_id TEXT PRIMARY KEY, sum TEXT NOT NULL, at INTEGER NOT NULL) WITHOUT ROWID;
