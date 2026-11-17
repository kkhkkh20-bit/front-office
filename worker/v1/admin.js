/* v1 관리자(Authorization: Bearer CUP_ADMIN): 래더 현황 집계·플레이어 찾기·숨김·삭제·시즌 끊기·표 만들기.
   집계는 하루 단위 daily_stats(쓸 때마다 몇 줄 더하기) + 가벼운 D1 쿼리. 관리자 화면: src/ui/cup/03_ladder_admin.js */
import { UL_TIERS } from '../../src/core/uladder.mjs';
import { json, err, readJson, kstDay } from './http.js';
import { PID, PLATFORMS } from './auth.js';
import { currentSeason, rollSeason } from './season.js';
import { statStmts, takeUsage } from './usage.js';
import { SCHEMA_VERSION, schemaStatements } from './schema.js';

/* 무료 한도(2026-11 Cloudflare 문서 기준. 바뀔 수 있다) */
export const FREE = Object.freeze({ d1_r: 5e6, d1_w: 1e5, kv_w: 1000, req: 1e5 });
export const PAID_MONTH = Object.freeze({ d1_r: 25e9, d1_w: 5e7, kv_w: 1e6, req: 1e7 });
const DAY = 86400e3;
const KEYS = ['active', 'players_new', 'decks_new', 'decks_upd', 'leagues', 'promos', 'demos', 'd1_r', 'd1_w', 'kv_w'];

export async function stats(db, now) {
  /* 지금까지 모은 사용량을 먼저 적는다 */
  const u = takeUsage(); if (u.d1_r || u.d1_w || u.kv_w) await db.batch(statStmts(db, now, u));
  const s = await currentSeason(db, now);
  const days = []; for (let i = 29; i >= 0; i--) days.push(kstDay(now - i * DAY));
  const rows = (await db.prepare('SELECT day, k, v FROM daily_stats WHERE day >= ?').bind(days[0]).all()).results || [];
  const by = {}; for (const d of days) by[d] = {}; for (const r of rows) if (by[r.day]) by[r.day][r.k] = r.v;
  const sum = (k, n) => days.slice(-n).reduce((a, d) => a + (by[d][k] || 0), 0);
  const win = n => { const o = {}; for (const k of KEYS) o[k] = sum(k, n); return o; };
  const cnt = async (q, ...a) => ((await db.prepare(q).bind(...a).first()) || { n: 0 }).n;
  const startOf = n => { const d = days[days.length - n]; return Date.parse(d + 'T00:00:00+09:00'); };
  const active = { today: await cnt('SELECT COUNT(*) AS n FROM players WHERE last_seen >= ?', startOf(1)), d7: await cnt('SELECT COUNT(*) AS n FROM players WHERE last_seen >= ?', startOf(7)), d30: await cnt('SELECT COUNT(*) AS n FROM players WHERE last_seen >= ?', startOf(30)) };
  const windows = { today: win(1), d7: win(7), d30: win(30) };
  for (const k of ['today', 'd7', 'd30']) windows[k].active = active[k];
  const tierRows = (await db.prepare('SELECT tier, COUNT(*) AS n, SUM(leagues) AS leagues FROM ladder_entries WHERE season = ? GROUP BY tier').bind(s.id).all()).results || [];
  const deckRows = (await db.prepare('SELECT tier, COUNT(*) AS n FROM decks GROUP BY tier').all()).results || [];
  const tiers = UL_TIERS.map((name, t) => { const e = tierRows.find(x => x.tier === t), d = deckRows.find(x => x.tier === t); return { tier: t, name, players: e ? e.n : 0, leagues: e ? e.leagues || 0 : 0, decks: d ? d.n : 0 }; });
  const hours = { today: [], d7: [] }; for (let h = 0; h < 24; h++) { const k = 'lh:' + String(h).padStart(2, '0'); hours.today.push(sum(k, 1)); hours.d7.push(sum(k, 7)); }
  const platforms = {}; for (const p of PLATFORMS) platforms[p] = sum('act:' + p, 7);
  const trend = days.slice(-14).map(d => ({ day: d, active: by[d].active || 0, leagues: by[d].leagues || 0, decks_new: by[d].decks_new || 0, promos: by[d].promos || 0 }));
  const top = (await db.prepare('SELECT e.player_id AS pid, p.nickname, p.hidden, e.tier, e.points, e.leagues, e.wins FROM ladder_entries e JOIN players p ON p.id = e.player_id WHERE e.season = ? AND e.leagues > 0 ORDER BY e.tier DESC, e.points DESC LIMIT 10').bind(s.id).all()).results || [];
  const feed = (await db.prepare("SELECT e.kind, e.player_id AS pid, e.nickname, e.tier_from, e.tier_to, e.at, p.hidden FROM events e LEFT JOIN players p ON p.id = e.player_id ORDER BY e.id DESC LIMIT 10").all()).results || [];
  const decks = (await db.prepare('SELECT d.player_id AS pid, p.nickname, p.hidden, p.platform, d.name, d.year, d.ovr, d.tier, d.created, d.at FROM decks d JOIN players p ON p.id = d.player_id ORDER BY d.at DESC LIMIT 20').all()).results || [];
  const totals = { players: await cnt('SELECT COUNT(*) AS n FROM players'), decks: await cnt('SELECT COUNT(*) AS n FROM decks'), hidden: await cnt('SELECT COUNT(*) AS n FROM players WHERE hidden = 1') };
  const today = by[days[days.length - 1]];
  const usage = { day: days[days.length - 1], d1_r: today.d1_r || 0, d1_w: today.d1_w || 0, kv_w: today.kv_w || 0, free: FREE, pct: { d1_r: pct(today.d1_r, FREE.d1_r), d1_w: pct(today.d1_w, FREE.d1_w), kv_w: pct(today.kv_w, FREE.kv_w) }, note: '이 서버 인스턴스가 센 추정치입니다. 정확한 값은 Cloudflare 대시보드 › D1 › 측정항목.' };
  return json(200, { ok: true, source: 'd1', at: now, season: s, windows, tiers, hours, platforms, trend, top, feed, decks, totals, usage });
}
const pct = (v, max) => Math.round((v || 0) / max * 1000) / 10;

export async function handleAdmin(rest, req, url, db, now) {
  if (rest === 'stats' && req.method === 'GET') return stats(db, now);
  if (rest === 'players' && req.method === 'GET') {
    const q = String(url.searchParams.get('q') || '').trim().slice(0, 20);
    const r = q ? await db.prepare("SELECT id, nickname, platform, created, last_seen, hidden FROM players WHERE nickname LIKE ? OR id = ? ORDER BY last_seen DESC LIMIT 100").bind('%' + q.replace(/[%_]/g, '') + '%', q).all()
      : await db.prepare('SELECT id, nickname, platform, created, last_seen, hidden FROM players ORDER BY last_seen DESC LIMIT 100').all();
    return json(200, { ok: true, players: r.results || [] });
  }
  if (rest === 'hide' && req.method === 'PUT') {
    const { body: b, error } = await readJson(req, 4096); if (error) return err(400, error);
    if (!PID.test(String(b.pid || ''))) return err(400, 'bad_json');
    const r = await db.prepare('UPDATE players SET hidden = ? WHERE id = ?').bind(b.hide ? 1 : 0, b.pid).run();
    if (!r.meta || !r.meta.changes) return err(404, 'not_found');
    return json(200, { ok: true, pid: b.pid, hide: b.hide ? 1 : 0 });
  }
  const dm = rest.match(/^player\/(p[0-9a-f]{16})$/);
  if (dm && req.method === 'DELETE') { await deletePlayer(db, dm[1]); return json(200, { ok: true }); }
  const dd = rest.match(/^deck\/(p[0-9a-f]{16})$/);
  if (dd && req.method === 'DELETE') { await db.prepare('DELETE FROM decks WHERE player_id = ?').bind(dd[1]).run(); return json(200, { ok: true }); }
  if (rest === 'season/roll' && req.method === 'POST') { const s = await currentSeason(db, now); const n = await rollSeason(db, s, now, true); return json(200, { ok: true, closed: s.id, season: n }); }
  return err(404, 'not_found');
}
/* 플레이어와 그 기록 전부 지우기(본인 요청 DELETE /player, 관리자 삭제). 다른 사람 h2h에 남은 상대 기록도 지운다 */
export async function deletePlayer(db, pid) {
  await db.batch(['devices', 'identities', 'decks', 'ladder_entries', 'league_results', 'events'].map(t => db.prepare(`DELETE FROM ${t} WHERE player_id = ?`).bind(pid))
    .concat([db.prepare('DELETE FROM h2h WHERE player_id = ? OR opp_id = ?').bind(pid, pid), db.prepare('DELETE FROM players WHERE id = ?').bind(pid)]));
}
/* 표 만들기: 같은 SQL을 문장별로(여러 번 해도 안전) */
export async function migrate(db) {
  const L = schemaStatements(); await db.batch(L.map(q => db.prepare(q)));
  return json(200, { ok: true, schema: SCHEMA_VERSION, statements: L.length });
}
