/* 래더 시즌: 14일. 첫 시즌은 2026-11-16(월) 00:00 KST 기준 14일 칸에 맞춘다.
   바꾸는 시점: 요청이 들어왔을 때 끝난 시즌이면 그 자리에서 닫고 다음 시즌을 연다(게으른 교체). Cron Trigger가 있으면 매일 한 번 같은 일을 한다(scheduled).
   두 요청이 동시에 닫아도 UPDATE … WHERE status='open'의 변경 수로 한 번만 시상한다.
   새 시즌 단계: 그 플레이어가 새 시즌에 처음 덱을 올리거나 결과를 낼 때 지난 시즌 단계 - 1(루키는 그대로). 포인트 0부터. 미리 모두를 옮기지 않는다(쓰기 비용) */
import { UL_TIERS } from '../../src/core/uladder.mjs';
import { statStmts } from './usage.js';

export const SEASON_DAYS = 14, PERIOD = SEASON_DAYS * 86400e3;
export const EPOCH = Date.UTC(2026, 10, 15, 15); // 2026-11-16 00:00 KST
export const RETAIN = { results: 180 * 86400e3, events: 60 * 86400e3, stats: 400 * 86400e3 };
const TIERS = UL_TIERS.length;
let memo = null; // {s, until}
export function _resetSeason() { memo = null; }

export async function currentSeason(db, now) {
  if (memo && now < memo.until) return memo.s;
  let s = await db.prepare('SELECT id, starts, ends, status FROM ladder_seasons ORDER BY id DESC LIMIT 1').first();
  if (!s) {
    const starts = EPOCH + Math.floor((now - EPOCH) / PERIOD) * PERIOD;
    await db.prepare("INSERT OR IGNORE INTO ladder_seasons (id, starts, ends, status) VALUES (1, ?, ?, 'open')").bind(starts, starts + PERIOD).run();
    s = await db.prepare('SELECT id, starts, ends, status FROM ladder_seasons ORDER BY id DESC LIMIT 1').first();
  }
  if (now >= s.ends || s.status !== 'open') s = await rollSeason(db, s, now, false);
  memo = { s, until: Math.min(s.ends, now + 60e3) };
  return s;
}

/* 닫기 + 시상(단계별 1~3위 칭호·소식) + 다음 시즌 열기 + 오래된 기록 지우기. early=true는 관리자가 지금 끊는 경우.
   srv2 #59: 닫기·시상·다음 시즌을 한 batch(트랜잭션)로 쓴다. 중간에 실패하면 아무것도 안 바뀌어(시즌은 열린 채) 다음 요청이 처음부터 다시 한다.
   두 요청이 동시에 닫으면 먼저 쓴 쪽만 남고(닫기 UPDATE가 0줄이면 지킴이가 batch를 되돌린다) 다른 쪽은 그 결과를 읽는다. 시상 순서는 순위표와 같은 RANK_ORDER */
const ORDER = 'e.points DESC, e.wins DESC, e.updated ASC, e.player_id ASC'; /* worker/v1/ladder.js RANK_ORDER와 같다(점검이 비교) */
export async function rollSeason(db, s, now, early) {
  memo = null;
  const starts = early ? now : s.ends + Math.max(0, Math.floor((now - s.ends) / PERIOD)) * PERIOD;
  const next = () => db.prepare("INSERT OR IGNORE INTO ladder_seasons (id, starts, ends, status) VALUES (?, ?, ?, 'open')").bind(s.id + 1, starts, starts + PERIOD);
  if (s.status === 'open') {
    const st = [db.prepare("UPDATE ladder_seasons SET status = 'closed', closed_at = ?, ends = MIN(ends, ?) WHERE id = ? AND status = 'open'").bind(now, now, s.id),
      db.prepare("INSERT INTO meta (k, v) SELECT '_cas', NULL WHERE changes() = 0")];
    const top = (await db.prepare(`SELECT player_id, nickname, points, tier, rn FROM (SELECT e.player_id, p.nickname, e.points, e.tier, ROW_NUMBER() OVER (PARTITION BY e.tier ORDER BY ${ORDER}) AS rn FROM ladder_entries e JOIN players p ON p.id = e.player_id WHERE e.season = ? AND p.hidden = 0 AND e.leagues > 0) WHERE rn <= 3 ORDER BY tier, rn`).bind(s.id).all()).results || [];
    for (const x of top) {
      const title = JSON.stringify({ s: s.id, tier: x.tier, rank: x.rn, pts: x.points });
      st.push(db.prepare("UPDATE ladder_entries SET titles = json_insert(titles, '$[#]', json(?)) WHERE season = ? AND player_id = ?").bind(title, s.id, x.player_id));
      st.push(db.prepare("INSERT INTO events (season, kind, player_id, nickname, tier_from, tier_to, info, at) VALUES (?, 'season_top', ?, ?, ?, ?, ?, ?)").bind(s.id, x.player_id, x.nickname, x.tier, x.tier, title, now));
    }
    st.push(db.prepare('DELETE FROM league_results WHERE at < ?').bind(now - RETAIN.results));
    st.push(db.prepare('DELETE FROM events WHERE at < ?').bind(now - RETAIN.events));
    st.push(db.prepare('DELETE FROM daily_stats WHERE day < ?').bind(new Date(now - RETAIN.stats).toISOString().slice(0, 10)));
    st.push(...statStmts(db, now, { rolls: 1 }), next());
    try { await db.batch(st); }
    catch (e) { /* 다른 요청이 먼저 닫았으면 괜찮다. 아직 열려 있으면(진짜 실패) 이 요청은 실패하고 다음 요청이 다시 한다 */
      const cur = await db.prepare('SELECT status FROM ladder_seasons WHERE id = ?').bind(s.id).first(); if (!cur || cur.status === 'open') throw e; }
  } else await next().run(); /* 닫혔는데 다음 시즌 줄이 없는 경우(예전 서버가 그 사이에 멈춤) */
  return await db.prepare('SELECT id, starts, ends, status FROM ladder_seasons ORDER BY id DESC LIMIT 1').first();
}

/* 이번 시즌 내 칸. 없으면 만든다(지난 시즌 단계 - 1, 처음이면 firstTier: 예전 KV 래더에서 옮겨 올 때의 단계). create=false면 만들지 않고 예상값만(fresh).
   srv2 #60: 동시에 두 요청이 만들면 먼저 들어간 줄이 이긴다 → 내가 못 넣었으면 저장된 줄을 다시 읽어 그것을 쓴다(시작 단계·포인트가 하나).
   srv2 #61: 플레이어가 그 사이 지워졌으면 만들지 않고 null */
export async function entryFor(db, season, pid, now, firstTier, create = true) {
  const sel = () => db.prepare('SELECT * FROM ladder_entries WHERE season = ? AND player_id = ?').bind(season, pid).first();
  const e = await sel();
  if (e) return e;
  const prev = await db.prepare('SELECT tier FROM ladder_entries WHERE player_id = ? AND season < ? ORDER BY season DESC LIMIT 1').bind(pid, season).first();
  const tier = prev ? Math.max(0, prev.tier - 1) : Math.max(0, Math.min(TIERS - 1, firstTier | 0));
  const row = { season, player_id: pid, tier, start_tier: tier, best_tier: tier, points: 0, leagues: 0, wins: 0, ups: 0, downs: 0, titles: '[]', updated: now };
  if (!create) return Object.assign(row, { fresh: true });
  const r = await db.prepare('INSERT OR IGNORE INTO ladder_entries (season, player_id, tier, start_tier, best_tier, updated) SELECT ?, ?, ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM players WHERE id = ?)').bind(season, pid, tier, tier, tier, now, pid).run();
  return r.meta && r.meta.changes === 1 ? row : await sel();
}
