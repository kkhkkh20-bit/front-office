/* v1 래더: 덱 등록·상대 받기·리그 결과(포인트·단계·맞대결·소식)·순위표·소식·내 기록·라이벌.
   리그는 지금처럼 유저 기기에서 돈다. 서버는 결과 요약만 받는다(조작은 신경 쓰지 않는다: src/core/uladder.mjs 머리말). 단계 계산은 서버가 공용 규칙(ulTierAfter)으로 한다 */
import { cupValidate, cupName, cupBadName, cupEntryHash } from '../../src/core/cup.mjs';
import { UL_TIERS, UL_TEAMS, ulTierAfter, ulSlim } from '../../src/core/uladder.mjs';
import { json, err, pub, readJson, cached, kstHour } from './http.js';
import { PID } from './auth.js';
import { currentSeason, entryFor } from './season.js';
import { statStmts, takeUsage } from './usage.js';
import { ladderKvPool, ladderKvTier } from '../uladder.js';

export const DECK_MAX = 40 * 1024, OPP_MAX = 9, BOARD_N = 20, FEED_N = 30, STALE = 45 * 86400e3;
/* 리그 순위 → 포인트(10팀 기준). 팀 수가 다르면 같은 비율 자리 값. 모두 0 이상: 많이 할수록 오르는 시즌 점수 */
export const RANK_PTS = Object.freeze([30, 24, 19, 15, 12, 9, 7, 5, 3, 1]);
export const rankPoints = (rank, teams) => { teams = Math.max(2, teams | 0); const i = Math.round((Math.max(1, Math.min(teams, rank | 0)) - 1) * (RANK_PTS.length - 1) / (teams - 1)); return RANK_PTS[i]; };
const TOP = UL_TIERS.length - 1;
const clampTier = t => Math.max(0, Math.min(TOP, (+t) | 0));
const int = (x, lo, hi) => { const n = Math.floor(+x); return Number.isFinite(n) && n >= lo && n <= hi ? n : null; };

/* 첫 덱(이 플레이어의 첫 시즌 칸)만 보낸 단계(tier)로 시작한다: 예전 KV 래더에서 옮겨 오는 유저(사용자 11-17).
   그 단계는 같은 세계 id(wid)로 KV에 올린 덱의 단계까지만 받는다(없으면 루키). 조작 방지는 이 정도로 충분하다(구단주: 래더는 덱 전력을 재는 곳) */
export async function putDeck(req, db, me, now, env) {
  const { body: b, error } = await readJson(req); if (error) return err(error === 'too_large' ? 413 : 400, error);
  if (!b.e || typeof b.e !== 'object') return err(400, 'bad_deck');
  if (cupBadName(b.e.name)) return err(400, 'bad_name');
  const e = ulSlim(b.e); e.name = cupName(e.name); const v = cupValidate(e, {}); if (!v.ok) return err(400, 'bad_deck', { errors: v.errors.map(x => x.msg) });
  e.h = cupEntryHash(e); const body = JSON.stringify(e); if (body.length > DECK_MAX) return err(413, 'too_large');
  const s = await currentSeason(db, now);
  const anyEntry = await db.prepare('SELECT 1 AS x FROM ladder_entries WHERE player_id = ? LIMIT 1').bind(me.id).first();
  let first = 0; if (!anyEntry) { first = clampTier(b.tier); const cap = await ladderKvTier(env, String(b.wid || me.wid || '')); if (cap != null) first = Math.min(first, cap); }
  const en = await entryFor(db, s.id, me.id, now, first);
  const had = await db.prepare('SELECT 1 AS x FROM decks WHERE player_id = ?').bind(me.id).first();
  const ovr = e.ovr && typeof e.ovr === 'object' ? e.ovr : null;
  await db.batch([
    db.prepare('INSERT INTO decks (player_id, name, year, ovr, ovr_json, tier, h, body, bytes, created, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (player_id) DO UPDATE SET name = excluded.name, year = excluded.year, ovr = excluded.ovr, ovr_json = excluded.ovr_json, tier = excluded.tier, h = excluded.h, body = excluded.body, bytes = excluded.bytes, at = excluded.at')
      .bind(me.id, e.name, e.year | 0, ovr ? (ovr.t | 0) : 0, ovr ? JSON.stringify(ovr) : null, en.tier, e.h, body, body.length, now, now),
    ...(String(b.wid || '').match(/^w[0-9a-f]{16}$/) ? [db.prepare('UPDATE players SET wid = ? WHERE id = ?').bind(b.wid, me.id)] : []),
    ...statStmts(db, now, Object.assign(had ? { decks_upd: 1 } : { decks_new: 1 }, takeUsage())),
  ]);
  return json(200, { ok: true, season: s.id, name: e.name, ovr, tier: en.tier, bytes: body.length, h: e.h });
}

/* 상대: 같은 단계, 내 OVR 위·아래로 가까운 덱(색인 (tier, ovr) 범위 읽기 두 번: 읽는 줄 수 ≈ 2n). 숨긴 플레이어·나·45일 넘게 안 고친 덱은 뺀다.
   D1 덱이 n개보다 모자라면 예전 KV 래더 덱(같은 단계)으로 채운다(사용자 11-17: 옮겨 가는 첫날에도 상대가 비지 않게). KV 덱은 pid가 없다(맞대결 기록 없음, kv:1).
   이미 v1로 옮겨 온 유저의 KV 덱(players.wid가 같은 것)과 내 세계 id는 뺀다. D1 덱이 충분해지면 KV는 읽지 않는다 */
export async function opponents(url, db, me, now, env) {
  const s = await currentSeason(db, now);
  const mine = await db.prepare('SELECT ovr, tier FROM decks WHERE player_id = ?').bind(me.id).first();
  const en = await entryFor(db, s.id, me.id, now, mine ? mine.tier : 0, false);
  const tier = url.searchParams.has('tier') ? clampTier(url.searchParams.get('tier')) : en.tier;
  const ovr = url.searchParams.has('ovr') ? (+url.searchParams.get('ovr') || 0) : mine ? mine.ovr : 0;
  const n = Math.max(1, Math.min(OPP_MAX, +url.searchParams.get('n') || OPP_MAX)), lim = n * 2, since = now - STALE;
  const q = dir => db.prepare(`SELECT d.player_id, d.name, d.year, d.ovr, d.ovr_json, d.at, d.body, p.nickname FROM decks d JOIN players p ON p.id = d.player_id WHERE d.tier = ? AND d.ovr ${dir === 'up' ? '>=' : '<'} ? AND d.player_id != ? AND p.hidden = 0 AND d.at >= ? ORDER BY d.ovr ${dir === 'up' ? 'ASC' : 'DESC'} LIMIT ?`).bind(tier, ovr, me.id, since, lim).all();
  const [up, dn] = await Promise.all([q('up'), q('dn')]);
  const all = [...(up.results || []), ...(dn.results || [])];
  const pick = all.map(x => [Math.abs(x.ovr - ovr), x]).sort((a, b) => a[0] - b[0] || b[1].at - a[1].at).slice(0, n).map(x => x[1]);
  const avg = all.length ? Math.round(all.reduce((a, x) => a + x.ovr, 0) / all.length * 10) / 10 : 0;
  const decks = [];
  for (const x of pick) { try { decks.push({ pid: x.player_id, nickname: x.nickname, name: x.name, year: x.year, ovr: x.ovr_json ? JSON.parse(x.ovr_json) : { t: x.ovr }, at: x.at, e: JSON.parse(x.body) }); } catch (e) {} }
  let kv = 0, near = all.length, av = avg;
  if (decks.length < n && env && env.SAVE_KV) {
    const hs = new Set(decks.map(d => d.e && d.e.h));
    const drop = async wids => new Set(((await db.prepare(`SELECT wid FROM players WHERE wid IN (${wids.map(() => '?').join(',')})`).bind(...wids).all()).results || []).map(x => x.wid));
    try {
      const P = await ladderKvPool(env, url, now, tier, ovr, n - decks.length, { skip: [me.wid].filter(Boolean), since, drop });
      for (const d of P.decks) { if (hs.has(d.e && d.e.h)) continue; hs.add(d.e && d.e.h); decks.push({ pid: null, nickname: null, kv: 1, name: d.name, year: d.year, ovr: d.ovr, at: d.at, e: d.e }); kv++; }
      if (P.count) { av = Math.round((avg * all.length + P.avg * P.count) / (all.length + P.count) * 10) / 10; near += P.count; }
    } catch (e) {}
  }
  return json(200, { ok: true, season: s.id, tier, avg: av, near, kv, decks });
}

/* 리그 결과 요약. 본문 {key(리그 id, 같은 key는 한 번만), rank, teams, w, l, d, opps:[{pid, w, l, d}]} */
export async function postResult(req, db, me, now) {
  const { body: b, error } = await readJson(req, 16 * 1024); if (error) return err(error === 'too_large' ? 413 : 400, error);
  const key = String(b.key || ''), teams = int(b.teams ?? UL_TEAMS, 2, 20), rank = teams && int(b.rank, 1, teams);
  const w = int(b.w ?? 0, 0, 999), l = int(b.l ?? 0, 0, 999), d = int(b.d ?? 0, 0, 999);
  if (!/^[\w.:-]{4,64}$/.test(key) || !teams || !rank || w == null || l == null || d == null) return err(400, 'bad_result');
  const opps = [], seen = new Set();
  for (const o of Array.isArray(b.opps) ? b.opps.slice(0, 19) : []) {
    if (!o || typeof o !== 'object') continue;
    const pid = String(o.pid || ''), ow = int(o.w ?? 0, 0, 99), ol = int(o.l ?? 0, 0, 99), od = int(o.d ?? 0, 0, 99);
    if (!PID.test(pid) || pid === me.id || seen.has(pid) || ow == null || ol == null || od == null || ow + ol + od === 0) continue;
    seen.add(pid); opps.push({ pid, w: ow, l: ol, d: od });
  }
  const dup = await db.prepare('SELECT season, tier, to_tier, rank, delta FROM league_results WHERE player_id = ? AND lkey = ?').bind(me.id, key).first();
  if (dup) return json(200, { ok: true, dup: true, season: dup.season, tier_from: dup.tier, tier: dup.to_tier, rank: dup.rank, delta: dup.delta });
  const s = await currentSeason(db, now);
  const deck = await db.prepare('SELECT tier FROM decks WHERE player_id = ?').bind(me.id).first();
  const en = await entryFor(db, s.id, me.id, now, deck ? deck.tier : 0);
  const mv = ulTierAfter(en.tier, rank, teams), delta = rankPoints(rank, teams), crown = rank === 1 && en.tier === TOP;
  const up = mv.move === 'up' ? 1 : 0, down = mv.move === 'down' ? 1 : 0;
  const st = [
    db.prepare('INSERT INTO league_results (player_id, season, lkey, tier, to_tier, rank, teams, w, l, d, delta, opps, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(me.id, s.id, key, en.tier, mv.tier, rank, teams, w, l, d, delta, JSON.stringify(opps.map(o => o.pid)), now),
    db.prepare('UPDATE ladder_entries SET tier = ?, best_tier = MAX(best_tier, ?), points = points + ?, leagues = leagues + 1, wins = wins + ?, ups = ups + ?, downs = downs + ?, updated = ? WHERE season = ? AND player_id = ?')
      .bind(mv.tier, mv.tier, delta, rank === 1 ? 1 : 0, up, down, now, s.id, me.id),
    db.prepare('UPDATE decks SET tier = ? WHERE player_id = ?').bind(mv.tier, me.id),
  ];
  for (const o of opps) st.push(db.prepare('INSERT INTO h2h (player_id, opp_id, n, w, l, d, at) SELECT ?, ?, ?, ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM players WHERE id = ?) ON CONFLICT (player_id, opp_id) DO UPDATE SET n = n + excluded.n, w = w + excluded.w, l = l + excluded.l, d = d + excluded.d, at = excluded.at')
    .bind(me.id, o.pid, o.w + o.l + o.d, o.w, o.l, o.d, now, o.pid));
  const ev = crown ? 'crown' : up ? 'promo' : down ? 'demote' : '';
  if (ev) st.push(db.prepare('INSERT INTO events (season, kind, player_id, nickname, tier_from, tier_to, info, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(s.id, ev, me.id, me.nickname, en.tier, mv.tier, JSON.stringify({ rank, teams }), now));
  const hh = String(kstHour(now)).padStart(2, '0');
  st.push(...statStmts(db, now, Object.assign({ leagues: 1, promos: up, demos: down, ['lh:' + hh]: 1 }, takeUsage())));
  await db.batch(st);
  return json(200, { ok: true, season: s.id, tier_from: en.tier, tier: mv.tier, move: mv.move, rank, delta, points: en.points + delta, best_tier: Math.max(en.best_tier, mv.tier), crown });
}

export async function leaderboard(url, db, now) {
  const s = await currentSeason(db, now);
  const season = url.searchParams.has('season') ? int(url.searchParams.get('season'), 1, 1e6) : s.id; if (!season) return err(400, 'bad_json');
  const tier = clampTier(url.searchParams.get('tier'));
  return cached(url, `board/${season}/${tier}`, 60, async () => {
    const r = await db.prepare('SELECT e.player_id AS pid, p.nickname, e.points, e.leagues, e.wins, e.best_tier, d.name AS team, d.ovr FROM ladder_entries e JOIN players p ON p.id = e.player_id LEFT JOIN decks d ON d.player_id = e.player_id WHERE e.season = ? AND e.tier = ? AND p.hidden = 0 AND e.leagues > 0 ORDER BY e.points DESC, e.updated ASC LIMIT ?').bind(season, tier, BOARD_N).all();
    return pub({ ok: true, season, tier, current: season === s.id, ends: season === s.id ? s.ends : null, rows: (r.results || []).map((x, i) => Object.assign({ rank: i + 1 }, x)) }, 60);
  });
}

export async function feed(url, db, now) {
  const n = Math.max(1, Math.min(FEED_N, +url.searchParams.get('n') || FEED_N));
  return cached(url, `feed/${n}`, 30, async () => {
    const r = await db.prepare("SELECT e.id, e.season, e.kind, e.player_id AS pid, e.nickname, e.tier_from, e.tier_to, e.info, e.at FROM events e JOIN players p ON p.id = e.player_id WHERE p.hidden = 0 AND e.kind IN ('promo', 'crown', 'season_top') ORDER BY e.id DESC LIMIT ?").bind(n).all();
    return pub({ ok: true, items: (r.results || []).map(x => Object.assign(x, { info: x.info ? JSON.parse(x.info) : null })) }, 30);
  });
}

export async function meView(db, me, now) {
  const s = await currentSeason(db, now);
  const deck = await db.prepare('SELECT name, year, ovr_json, tier, h, at FROM decks WHERE player_id = ?').bind(me.id).first();
  const en = await entryFor(db, s.id, me.id, now, deck ? deck.tier : 0, false);
  const rank = en.fresh ? null : 1 + ((await db.prepare('SELECT COUNT(*) AS n FROM ladder_entries e JOIN players p ON p.id = e.player_id WHERE e.season = ? AND e.tier = ? AND e.points > ? AND p.hidden = 0 AND e.leagues > 0').bind(s.id, en.tier, en.points).first()) || { n: 0 }).n;
  const past = (await db.prepare("SELECT season, tier, best_tier, points, leagues, titles FROM ladder_entries WHERE player_id = ? AND season < ? ORDER BY season DESC LIMIT 10").bind(me.id, s.id).all()).results || [];
  const recent = (await db.prepare('SELECT lkey AS key, season, tier, to_tier, rank, teams, w, l, d, delta, at FROM league_results WHERE player_id = ? ORDER BY id DESC LIMIT 10').bind(me.id).all()).results || [];
  const titles = past.flatMap(x => JSON.parse(x.titles || '[]'));
  return json(200, { ok: true, player: { id: me.id, nickname: me.nickname, hidden: !!me.hidden }, season: { id: s.id, starts: s.starts, ends: s.ends },
    entry: { tier: en.tier, start_tier: en.start_tier, best_tier: en.best_tier, points: en.points, leagues: en.leagues, wins: en.wins, ups: en.ups, downs: en.downs, rank, fresh: !!en.fresh },
    deck: deck ? { name: deck.name, year: deck.year, ovr: deck.ovr_json ? JSON.parse(deck.ovr_json) : null, tier: deck.tier, h: deck.h, at: deck.at } : null,
    past: past.map(x => ({ season: x.season, tier: x.tier, best_tier: x.best_tier, points: x.points, leagues: x.leagues })), titles, recent });
}

/* 라이벌: 내가 가장 많이 상대한 덱(공격) + 내 덱을 가장 많이 상대한 유저(수비, 그쪽 기록을 내 쪽으로 뒤집어 보여 준다) */
export async function rivals(db, me) {
  const atk = (await db.prepare('SELECT h.opp_id AS pid, p.nickname, h.n, h.w, h.l, h.d, h.at FROM h2h h JOIN players p ON p.id = h.opp_id WHERE h.player_id = ? AND p.hidden = 0 ORDER BY h.n DESC, h.at DESC LIMIT 5').bind(me.id).all()).results || [];
  const def = (await db.prepare('SELECT h.player_id AS pid, p.nickname, h.n, h.l AS w, h.w AS l, h.d, h.at FROM h2h h JOIN players p ON p.id = h.player_id WHERE h.opp_id = ? AND p.hidden = 0 ORDER BY h.n DESC, h.at DESC LIMIT 5').bind(me.id).all()).results || [];
  return json(200, { ok: true, attack: atk, defense: def });
}
export async function h2hWith(db, me, pid) {
  if (!PID.test(pid)) return err(400, 'bad_json');
  const a = await db.prepare('SELECT n, w, l, d, at FROM h2h WHERE player_id = ? AND opp_id = ?').bind(me.id, pid).first();
  const b = await db.prepare('SELECT n, w, l, d, at FROM h2h WHERE player_id = ? AND opp_id = ?').bind(pid, me.id).first();
  const p = await db.prepare('SELECT nickname, hidden FROM players WHERE id = ?').bind(pid).first();
  if (!p || p.hidden) return err(404, 'not_found');
  return json(200, { ok: true, pid, nickname: p.nickname, attack: a || { n: 0, w: 0, l: 0, d: 0 }, defense: b ? { n: b.n, w: b.l, l: b.w, d: b.d, at: b.at } : { n: 0, w: 0, l: 0, d: 0 } });
}
