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

/* 닫기 + 시상(단계별 1~3위 칭호·소식) + 다음 시즌 열기 + 오래된 기록 지우기. early=true는 관리자가 지금 끊는 경우 */
export async function rollSeason(db, s, now, early) {
  memo = null;
  const r = await db.prepare("UPDATE ladder_seasons SET status = 'closed', closed_at = ?, ends = MIN(ends, ?) WHERE id = ? AND status = 'open'").bind(now, now, s.id).run();
  const mine = r.meta && r.meta.changes === 1;
  const starts = early ? now : s.ends + Math.max(0, Math.floor((now - s.ends) / PERIOD)) * PERIOD;
  if (mine) {
    const st = [];
    for (let t = 0; t < TIERS; t++) {
      const top = (await db.prepare('SELECT e.player_id, p.nickname, e.points FROM ladder_entries e JOIN players p ON p.id = e.player_id WHERE e.season = ? AND e.tier = ? AND p.hidden = 0 AND e.leagues > 0 ORDER BY e.points DESC, e.updated ASC LIMIT 3').bind(s.id, t).all()).results || [];
      top.forEach((x, i) => {
        const title = JSON.stringify({ s: s.id, tier: t, rank: i + 1, pts: x.points });
        st.push(db.prepare("UPDATE ladder_entries SET titles = json_insert(titles, '$[#]', json(?)) WHERE season = ? AND player_id = ?").bind(title, s.id, x.player_id));
        st.push(db.prepare("INSERT INTO events (season, kind, player_id, nickname, tier_from, tier_to, info, at) VALUES (?, 'season_top', ?, ?, ?, ?, ?, ?)").bind(s.id, x.player_id, x.nickname, t, t, title, now));
      });
    }
    st.push(db.prepare('DELETE FROM league_results WHERE at < ?').bind(now - RETAIN.results));
    st.push(db.prepare('DELETE FROM events WHERE at < ?').bind(now - RETAIN.events));
    st.push(db.prepare('DELETE FROM daily_stats WHERE day < ?').bind(new Date(now - RETAIN.stats).toISOString().slice(0, 10)));
    st.push(...statStmts(db, now, { rolls: 1 }));
    await db.batch(st);
  }
  await db.prepare("INSERT OR IGNORE INTO ladder_seasons (id, starts, ends, status) VALUES (?, ?, ?, 'open')").bind(s.id + 1, starts, starts + PERIOD).run();
  return await db.prepare('SELECT id, starts, ends, status FROM ladder_seasons ORDER BY id DESC LIMIT 1').first();
}

/* 이번 시즌 내 칸. 없으면 만든다(지난 시즌 단계 - 1, 처음이면 firstTier: 예전 KV 래더에서 옮겨 올 때의 단계). create=false면 만들지 않고 예상값만 */
export async function entryFor(db, season, pid, now, firstTier, create = true) {
  const e = await db.prepare('SELECT * FROM ladder_entries WHERE season = ? AND player_id = ?').bind(season, pid).first();
  if (e) return e;
  const prev = await db.prepare('SELECT tier FROM ladder_entries WHERE player_id = ? AND season < ? ORDER BY season DESC LIMIT 1').bind(pid, season).first();
  const tier = prev ? Math.max(0, prev.tier - 1) : Math.max(0, Math.min(TIERS - 1, firstTier | 0));
  const row = { season, player_id: pid, tier, start_tier: tier, best_tier: tier, points: 0, leagues: 0, wins: 0, ups: 0, downs: 0, titles: '[]', updated: now, fresh: true };
  if (create) await db.prepare('INSERT OR IGNORE INTO ladder_entries (season, player_id, tier, start_tier, best_tier, updated) VALUES (?, ?, ?, ?, ?, ?)').bind(season, pid, tier, tier, tier, now).run();
  return row;
}
