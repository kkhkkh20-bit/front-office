/* v1 래더: 덱 등록·상대 받기·리그 결과(포인트·단계·맞대결·소식)·순위표·소식·내 기록·라이벌.
   리그는 지금처럼 유저 기기에서 돈다. 서버는 결과 요약만 받는다(조작은 신경 쓰지 않는다: src/core/uladder.mjs 머리말). 단계 계산은 서버가 공용 규칙(ulTierAfter)으로 한다 */
import { cupValidate, cupName, cupBadName, cupEntryHash } from '../../src/core/cup.mjs';
import { UL_TIERS, UL_TEAMS, ulTierAfter, ulSlim, ulDeckMeta, ulMetaAgg, ulCap, ulCapGate } from '../../src/core/uladder.mjs';
import { json, err, pub, readJson, cached, kstHour, kstDay, qInt, byteLen } from './http.js';
import { PID } from './auth.js';
import { currentSeason, entryFor } from './season.js';
import { statStmts, takeUsage, addUsage } from './usage.js';
import { ladderKvPool, ladderKvTier } from '../uladder.js';
import { ensureRec, recParse, recStmts, PS_BONUS } from './records.js';
import { ensureAuto, regGet, regCheck, regStmt, leagueStmts } from './ladauto.js';

export const DECK_MAX = 40 * 1024, OPP_MAX = 9, BOARD_N = 20, FEED_N = 30, STALE = 45 * 86400e3;
/* 순위 규칙 하나(srv2 #36): 포인트 많은 순 → 우승(리그 1위) 많은 순 → 그 점수에 먼저 도달한 순(updated 이른 순) → 플레이어 id.
   순위표(단계별·전체)·내 순위·시즌 시상·관리자 상위가 모두 이 순서. 순위 자격(#37): 이번 시즌 리그를 하나 이상 마쳤고 숨김이 아닌 플레이어 */
export const RANK_ORDER = 'e.points DESC, e.wins DESC, e.updated ASC, e.player_id ASC';
const AHEAD = '(e.points > ? OR (e.points = ? AND (e.wins > ? OR (e.wins = ? AND (e.updated < ? OR (e.updated = ? AND e.player_id < ?))))))';
const aheadArgs = en => [en.points, en.points, en.wins, en.wins, en.updated, en.updated, en.player_id];
/* 내 순위: {rank(단계 안), rank_all(전체)}. 자격이 없으면 null. 색인(season, tier, points) 범위 읽기라 읽는 줄 ≈ 내 앞 사람 수 */
export async function boardRank(db, en, hidden) {
  if (!en || !(en.leagues > 0) || hidden) return { rank: null, rank_all: null };
  const R = 'FROM ladder_entries e JOIN players p ON p.id = e.player_id WHERE e.season = ? AND p.hidden = 0 AND e.leagues > 0';
  const r = await db.prepare(`SELECT (SELECT COUNT(*) ${R} AND e.tier = ? AND ${AHEAD}) AS a, (SELECT COUNT(*) ${R} AND e.tier > ?) AS b`).bind(en.season, en.tier, ...aheadArgs(en), en.season, en.tier).first() || { a: 0, b: 0 };
  return { rank: 1 + (r.a || 0), rank_all: 1 + (r.a || 0) + (r.b || 0) };
}
/* 공개 캐시 세대(srv2 #62): 숨김·삭제 때 하나 올린다 → 순위표·소식·메타 캐시 열쇠가 바뀌어 모든 데이터센터에서 바로 새로 읽는다.
   세대 값은 isolate마다 GEN_SEC초 기억한다(다른 서버 인스턴스는 그만큼 늦을 수 있다. 바꾼 인스턴스는 바로) */
export const GEN_SEC = 10;
let gen = null; export function _genReset() { gen = null; } /* 이 isolate의 기억을 버린다(세대를 올린 뒤) */
export async function cacheGen(db, now) {
  if (gen && now < gen.until) return gen.v;
  let v = 0; try { const r = await db.prepare("SELECT v FROM meta WHERE k = 'cgen'").first(); v = r ? +r.v || 0 : 0; } catch (e) {}
  gen = { v, until: now + GEN_SEC * 1000 }; return v;
}
export const bumpStmt = db => db.prepare("INSERT INTO meta (k, v) VALUES ('cgen', '1') ON CONFLICT (k) DO UPDATE SET v = CAST(CAST(v AS INTEGER) + 1 AS TEXT)");
export async function bumpCache(db) { gen = null; try { await bumpStmt(db).run(); } catch (e) {} }
/* 동시 쓰기 지킴이(srv2 #58·#59): 바로 앞 UPDATE가 한 줄도 못 바꿨으면(다른 요청이 먼저 바꿈) NOT NULL 오류를 내서 batch(트랜잭션) 전체를 되돌린다 */
export const casGuard = db => db.prepare("INSERT INTO meta (k, v) SELECT '_cas', NULL WHERE changes() = 0");
export const isCas = e => /NOT NULL constraint failed: meta\.v/i.test(String(e && e.message));
const isDupKey = e => /UNIQUE constraint failed: league_results/i.test(String(e && e.message));
const live = 'EXISTS (SELECT 1 FROM players WHERE id = ?)'; /* 지운 플레이어에 줄을 남기지 않게(srv2 #61) */
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
  e.h = cupEntryHash(e); const body = JSON.stringify(e), bytes = byteLen(body); if (bytes > DECK_MAX) return err(413, 'too_large');
  const s = await currentSeason(db, now);
  const anyEntry = await db.prepare('SELECT 1 AS x FROM ladder_entries WHERE player_id = ? LIMIT 1').bind(me.id).first();
  let first = 0; if (!anyEntry) { first = clampTier(b.tier); const cap = await ladderKvTier(env, String(b.wid || me.wid || '')); if (cap != null) first = Math.min(first, cap); }
  const had = await db.prepare('SELECT 1 AS x FROM decks WHERE player_id = ?').bind(me.id).first();
  const tier0 = (await entryFor(db, s.id, me.id, now, first, false)).tier;
  /* 래더 v4(구단주 11-18 §1): auto 자동 등록(자동 참가를 끈 플레이어는 409) · man 직접 등록(하루 1회, 이미 덱이 있으면 429 reg_wait). 표를 못 만들면 예전처럼 */
  const rg = (await ensureAuto(db)) ? await regCheck(db, me, b, e, tier0, had, now) : null; if (rg && rg.error) return rg.error;
  const bad = capErr(e, tier0); if (bad && !(rg && rg.auto && rg.cap.known && rg.cap.each)) return bad; /* 연봉 상한(사용자 11-17): 쓰기 전에 그 단계 상한을 본다. 자동 등록은 넘어도 받고 그 단계 리그에서만 막는다(상대 고르기·리그 시작) */
  const en = await entryFor(db, s.id, me.id, now, first); if (!en) return err(401, 'auth'); /* 그 사이 지운 플레이어 */
  const ovr = e.ovr && typeof e.ovr === 'object' ? e.ovr : null;
  const consent = rg ? " AND NOT EXISTS (SELECT 1 FROM ladder_reg WHERE player_id = ? AND off = 1)" : "";
  const wrote = await db.batch([
    ...(rg ? [regStmt(db, me.id, rg, now)] : []),
    db.prepare(`INSERT INTO decks (player_id, name, year, ovr, ovr_json, tier, h, body, bytes, created, at) SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? WHERE ${live}${consent} ON CONFLICT (player_id) DO UPDATE SET name = excluded.name, year = excluded.year, ovr = excluded.ovr, ovr_json = excluded.ovr_json, tier = excluded.tier, h = excluded.h, body = excluded.body, bytes = excluded.bytes, at = excluded.at`)
      .bind(me.id, e.name, e.year | 0, ovr ? (ovr.t | 0) : 0, ovr ? JSON.stringify(ovr) : null, en.tier, e.h, body, bytes, now, now, me.id, ...(rg ? [me.id] : [])),
    ...(String(b.wid || '').match(/^w[0-9a-f]{16}$/) ? [db.prepare('UPDATE players SET wid = ? WHERE id = ?'+consent).bind(b.wid, me.id, ...(rg ? [me.id] : []))] : []),
    ...statStmts(db, now, Object.assign(had ? { decks_upd: 1 } : { decks_new: 1 }, takeUsage())),
  ]);
  /* 검사 뒤 끄기 요청이 먼저 확정되면 같은 batch의 쓰기도 막는다. 거절된 덱을 성공으로 알리거나 구성 요약을 되살리지 않는다. */
  if (!wrote[rg ? 1 : 0]?.meta?.changes) { const stopped = await regGet(db, me.id); return err(stopped?.off ? 409 : 401, stopped?.off ? 'auto_off' : 'auth'); }
  await metaPut(db, me.id, e, now); /* 덱 구성 요약(래더 v2 메타, 사용자 11-17): 실패해도 덱 등록은 된다 */
  return json(200, { ok: true, at: now, man_day: rg&&rg.man ? kstDay(now) : null, season: s.id, name: e.name, ovr, tier: en.tier, bytes, h: e.h, auto: rg ? rg.auto : null, cap_ok: rg ? rg.capOk : !bad, pay_x: rg ? rg.payX : null });
}

/* 연봉 상한 검사(사용자 11-17 "레더나 대회마다 연봉에 제약을 두게 하면 좋을것 같음 공평하게"): 화면과 같은 공용 규칙(ulCap).
   서버는 덱 선수(P)마다 적힌 연봉(sal)으로 합을 다시 세고, 그 세계 기준(payRef)으로 나눈다. 연봉이 없는 새 덱은 받지 않는다(예전 덱은 상대 고르기에서 유예) */
export function capErr(e, tier) {
  const c = ulCap(e, tier); if (!c.known || !c.each) return err(400, 'no_pay', { errors: ['연봉 기록이 없는 덱입니다. 게임을 새로 고친 뒤 다시 등록해 주세요.'] });
  if (!c.ok) return err(400, 'over_cap', { errors: [ulCapGate(e, tier).msg], cap: { x: c.x, pay: c.pay, ref: c.ref, cap: c.cap, r: c.r } });
  return null;
}
/* 상대: 같은 단계, 내 OVR 위·아래로 가까운 덱(색인 (tier, ovr) 범위 읽기 두 번: 읽는 줄 수 ≈ 2n). 숨긴 플레이어·나·45일 넘게 안 고친 덱은 뺀다.
   D1 덱이 n개보다 모자라면 예전 KV 래더 덱(같은 단계)으로 채운다(사용자 11-17: 옮겨 가는 첫날에도 상대가 비지 않게). KV 덱은 pid가 없다(맞대결 기록 없음, kv:1).
   이미 v1로 옮겨 온 유저의 KV 덱(players.wid가 같은 것)과 내 세계 id는 뺀다. D1 덱이 충분해지면 KV는 읽지 않는다 */
export async function opponents(url, db, me, now, env) {
  const s = await currentSeason(db, now);
  const mine = await db.prepare('SELECT ovr, tier FROM decks WHERE player_id = ?').bind(me.id).first();
  const en = await entryFor(db, s.id, me.id, now, mine ? mine.tier : 0, false);
  const tier = url.searchParams.has('tier') ? qInt(url.searchParams.get('tier'), en.tier, 0, TOP) : en.tier;
  const ovr = url.searchParams.has('ovr') ? qInt(url.searchParams.get('ovr'), 0, 0, 999) : mine ? mine.ovr : 0;
  const n = qInt(url.searchParams.get('n'), OPP_MAX, 1, OPP_MAX), lim = n * 2, since = now - STALE; /* 정수만(srv2 #40) */
  const q = dir => db.prepare(`SELECT d.player_id, d.name, d.year, d.ovr, d.ovr_json, d.at, d.body, p.nickname FROM decks d JOIN players p ON p.id = d.player_id WHERE d.tier = ? AND d.ovr ${dir === 'up' ? '>=' : '<'} ? AND d.player_id != ? AND p.hidden = 0 AND d.at >= ? ORDER BY d.ovr ${dir === 'up' ? 'ASC' : 'DESC'} LIMIT ?`).bind(tier, ovr, me.id, since, lim).all();
  const [up, dn] = await Promise.all([q('up'), q('dn')]);
  /* 연봉 상한(사용자 11-17): 그 단계 상한을 넘는 덱(승격 뒤 그대로인 덱)·유예가 끝난 예전 덱(연봉 기록 없음)은 상대로 내보내지 않는다 */
  const all = [...(up.results || []), ...(dn.results || [])].map(x => { try { x.e = JSON.parse(x.body); } catch (e) { return null; } return ulCapGate(x.e, tier, now).ok ? x : null; }).filter(Boolean);
  const pick = all.map(x => [Math.abs(x.ovr - ovr), x]).sort((a, b) => a[0] - b[0] || b[1].at - a[1].at).slice(0, n).map(x => x[1]);
  const avg = all.length ? Math.round(all.reduce((a, x) => a + x.ovr, 0) / all.length * 10) / 10 : 0;
  const decks = [];
  for (const x of pick) decks.push({ pid: x.player_id, nickname: x.nickname, name: x.name, year: x.year, ovr: x.ovr_json ? JSON.parse(x.ovr_json) : { t: x.ovr }, at: x.at, e: x.e });
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

/* 리그 결과 요약. 본문 {key(리그 id, 같은 key는 한 번만), rank, teams, w, l, d, opps:[{pid, w, l, d}], ps?('c'|'r'|'s'), rec?(기록실: records.js recParse)} */
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
  const ps = teams >= 4 && (b.ps === 'c' || b.ps === 'r' || b.ps === 's') ? b.ps : ''; /* 포스트시즌(3연전 리그, 사용자 11-18): c 우승 · r 준우승 · s 4강 */
  const rec = recParse(b.rec), recOn = !!rec && await ensureRec(db); /* 기록실 줄(사용자 11-18). 표를 못 만들면 결과만 넣는다 */
  const lgOn = await ensureAuto(db); /* 래더 v4 관리자 한눈 보기: 끝난 리그 요약(순위표·우승·이상 표시)·진행 중 줄 지우기 */
  const s = await currentSeason(db, now);
  const deck = await db.prepare('SELECT tier FROM decks WHERE player_id = ?').bind(me.id).first();
  /* 동시에 온 결과(srv2 #58): 칸(tier·leagues)을 읽고 계산한 뒤, 읽은 값 그대로일 때만 바꾼다(compare-and-set). 다른 요청이 먼저 바꿨으면 batch 전체를 되돌리고 다시 읽어 계산한다.
     같은 key가 동시에 두 번 오면 UNIQUE(player_id, lkey)로 하나만 들어가고, 다른 하나는 중복 응답을 받는다 */
  for (let tryN = 0; tryN < 5; tryN++) {
    const dup = await db.prepare('SELECT season, tier, to_tier, rank, teams, delta FROM league_results WHERE player_id = ? AND lkey = ?').bind(me.id, key).first();
    if (dup) return dupReply(db, me, dup, s);
    const en = await entryFor(db, s.id, me.id, now, deck ? deck.tier : 0); if (!en) return err(401, 'auth'); /* 그 사이 지운 플레이어 */
    const mv = ulTierAfter(en.tier, rank, teams, ps), delta = rankPoints(rank, teams) + (PS_BONUS[ps] || 0), crown = rank === 1 && en.tier === TOP; /* 포스트시즌 우승·준우승 보너스(사용자 11-18). 단계는 정규 순위, 래더 v4(구단주 11-18 §3): 우승팀은 순위와 무관하게 승격 */
    const up = mv.move === 'up' ? 1 : 0, down = mv.move === 'down' ? 1 : 0, win = rank === 1 ? 1 : 0;
    const st = [
      db.prepare(`UPDATE ladder_entries SET tier = ?, best_tier = MAX(best_tier, ?), points = points + ?, leagues = leagues + 1, wins = wins + ?, ups = ups + ?, downs = downs + ?, updated = ? WHERE season = ? AND player_id = ? AND tier = ? AND leagues = ? AND ${live}`)
        .bind(mv.tier, mv.tier, delta, win, up, down, now, s.id, me.id, en.tier, en.leagues, me.id),
      casGuard(db),
      db.prepare('INSERT INTO league_results (player_id, season, lkey, tier, to_tier, rank, teams, w, l, d, delta, opps, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(me.id, s.id, key, en.tier, mv.tier, rank, teams, w, l, d, delta, JSON.stringify(opps.map(o => o.pid)), now),
      db.prepare('UPDATE decks SET tier = ? WHERE player_id = ?').bind(mv.tier, me.id),
    ];
    for (const o of opps) st.push(db.prepare('INSERT INTO h2h (player_id, opp_id, n, w, l, d, at) SELECT ?, ?, ?, ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM players WHERE id = ?) ON CONFLICT (player_id, opp_id) DO UPDATE SET n = n + excluded.n, w = w + excluded.w, l = l + excluded.l, d = d + excluded.d, at = excluded.at')
      .bind(me.id, o.pid, o.w + o.l + o.d, o.w, o.l, o.d, now, o.pid));
    if (recOn) st.push(...recStmts(db, { pid: me.id, season: s.id, tier: en.tier, key, rank, w, l, d, ps, rec, now }));
    if (lgOn) st.push(...leagueStmts(db, { pid: me.id, season: s.id, tier: en.tier, key, rank, teams, w, l, d, ps, st: b.st, champ: b.champ, runner: b.runner, now }));
    const ev = crown ? 'crown' : up ? 'promo' : down ? 'demote' : '';
    if (ev) st.push(db.prepare('INSERT INTO events (season, kind, player_id, nickname, tier_from, tier_to, info, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(s.id, ev, me.id, me.nickname, en.tier, mv.tier, JSON.stringify({ rank, teams }), now));
    const hh = String(kstHour(now)).padStart(2, '0'), use = takeUsage();
    st.push(...statStmts(db, now, Object.assign({ leagues: 1, promos: up, demos: down, ['lh:' + hh]: 1 }, use)));
    try { await db.batch(st); }
    catch (e) { if (isCas(e) || isDupKey(e)) { addUsage(use); continue; } throw e; }
    const after = Object.assign({}, en, { tier: mv.tier, best_tier: Math.max(en.best_tier, mv.tier), points: en.points + delta, leagues: en.leagues + 1, wins: en.wins + win, ups: en.ups + up, downs: en.downs + down, updated: now });
    return json(200, { ok: true, season: s.id, tier_from: en.tier, tier: mv.tier, move: mv.move, rank, delta, ps, rec: recOn ? rec.b.length + rec.p.length : 0, points: after.points, best_tier: after.best_tier, crown, entry: await entryView(db, after, me) });
  }
  return err(503, 'busy', null, { 'Retry-After': '2' }); /* 계속 겹치면(거의 없음) 잠시 뒤 다시: 5xx라 앱이 줄에 남겨 다시 보낸다 */
}
/* 지금 칸 요약 + 순위(결과 응답·중복 응답·내 기록이 같이 쓴다) */
async function entryView(db, en, me) {
  const r = await boardRank(db, en, me.hidden);
  return { season: en.season, tier: en.tier, start_tier: en.start_tier, best_tier: en.best_tier, points: en.points, leagues: en.leagues, wins: en.wins, ups: en.ups, downs: en.downs, rank: r.rank, rank_all: r.rank_all, ranked: r.rank != null };
}
/* 같은 key를 다시 보냈을 때(srv2 #39): 그 리그 결과 값 + 지금 칸(포인트·단계·순위). 그 결과가 지난 시즌 것이면 그 시즌 칸 */
async function dupReply(db, me, dup, s) {
  const en = await db.prepare('SELECT * FROM ladder_entries WHERE season = ? AND player_id = ?').bind(dup.season, me.id).first();
  const entry = en ? await entryView(db, en, me) : null;
  return json(200, { ok: true, dup: true, season: dup.season, tier_from: dup.tier, tier: dup.to_tier, move: dup.to_tier > dup.tier ? 'up' : dup.to_tier < dup.tier ? 'down' : 'stay', rank: dup.rank, delta: dup.delta,
    points: entry ? entry.points : null, best_tier: entry ? entry.best_tier : null, current: dup.season === s.id, entry });
}

export async function leaderboard(url, db, now) {
  const s = await currentSeason(db, now);
  const season = url.searchParams.has('season') ? int(url.searchParams.get('season'), 1, 1e6) : s.id; if (!season) return err(400, 'bad_json');
  const g = await cacheGen(db, now), B = 'FROM ladder_entries e JOIN players p ON p.id = e.player_id LEFT JOIN decks d ON d.player_id = e.player_id WHERE e.season = ? AND p.hidden = 0 AND e.leagues > 0';
  if (url.searchParams.get('tier') === 'all') return cached(url, `board/g${g}/${season}/all`, 60, async () => { /* 전체 순위(래더 v2): 높은 단계 먼저, 같은 단계는 RANK_ORDER */
    const r = await db.prepare(`SELECT e.player_id AS pid, p.nickname, e.tier, e.points, e.leagues, e.wins, e.best_tier, d.name AS team, d.ovr ${B} ORDER BY e.tier DESC, ${RANK_ORDER} LIMIT ?`).bind(season, BOARD_N).all();
    return pub({ ok: true, season, tier: 'all', current: season === s.id, ends: season === s.id ? s.ends : null, rows: (r.results || []).map((x, i) => Object.assign({ rank: i + 1 }, x)) }, 60);
  });
  const tier = qInt(url.searchParams.get('tier'), 0, 0, TOP);
  return cached(url, `board/g${g}/${season}/${tier}`, 60, async () => {
    const r = await db.prepare(`SELECT e.player_id AS pid, p.nickname, e.points, e.leagues, e.wins, e.best_tier, d.name AS team, d.ovr ${B} AND e.tier = ? ORDER BY ${RANK_ORDER} LIMIT ?`).bind(season, tier, BOARD_N).all();
    return pub({ ok: true, season, tier, current: season === s.id, ends: season === s.id ? s.ends : null, rows: (r.results || []).map((x, i) => Object.assign({ rank: i + 1 }, x)) }, 60);
  });
}

/* 소식: 캐시는 늘 FEED_N개 하나(세대별)만 두고, n이 더 작으면 잘라서 준다(srv2: n마다 캐시가 따로 생기지 않게) */
export async function feed(url, db, now) {
  const n = qInt(url.searchParams.get('n'), FEED_N, 1, FEED_N), g = await cacheGen(db, now);
  const res = await cached(url, `feed/g${g}`, 30, async () => {
    const r = await db.prepare("SELECT e.id, e.season, e.kind, e.player_id AS pid, e.nickname, e.tier_from, e.tier_to, e.info, e.at FROM events e JOIN players p ON p.id = e.player_id WHERE p.hidden = 0 AND e.kind IN ('promo', 'crown', 'season_top') ORDER BY e.id DESC LIMIT ?").bind(FEED_N).all();
    return pub({ ok: true, items: (r.results || []).map(x => Object.assign(x, { info: x.info ? JSON.parse(x.info) : null })) }, 30);
  });
  if (n >= FEED_N || res.status !== 200) return res;
  const j = await res.json(); j.items = (j.items || []).slice(0, n); return pub(j, 30);
}

export async function meView(db, me, now) {
  const s = await currentSeason(db, now);
  const deck = await db.prepare('SELECT name, year, ovr_json, tier, h, at FROM decks WHERE player_id = ?').bind(me.id).first();
  const en = await entryFor(db, s.id, me.id, now, deck ? deck.tier : 0, false);
  const entry = await entryView(db, en, me); entry.fresh = !!en.fresh; /* 순위(srv2 #36·#37): 순위표와 같은 규칙. 리그를 안 마쳤거나 숨김이면 rank null(화면은 '순위 없음') */
  const past = (await db.prepare("SELECT season, tier, best_tier, points, leagues, titles FROM ladder_entries WHERE player_id = ? AND season < ? ORDER BY season DESC LIMIT 10").bind(me.id, s.id).all()).results || [];
  const recent = (await db.prepare('SELECT lkey AS key, season, tier, to_tier, rank, teams, w, l, d, delta, at FROM league_results WHERE player_id = ? ORDER BY id DESC LIMIT 10').bind(me.id).all()).results || [];
  const titles = past.flatMap(x => JSON.parse(x.titles || '[]')), reg = await regGet(db, me.id);
  return json(200, { ok: true, player: { id: me.id, nickname: me.nickname, hidden: !!me.hidden }, season: { id: s.id, starts: s.starts, ends: s.ends },
    entry, reg: reg ? {man_day:reg.man_day,at:reg.at,off:reg.off,auto:reg.auto} : null,
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

/* ===== 래더 v2 덱 구성(메타, 사용자 11-17 "래더 선수 구성"): 덱마다 작은 요약(deck_meta, 약 300바이트)을 덱 등록 때 적고,
   GET /ladder/meta?tier=N|all 은 최근 45일 덱 요약을 최대 META_N개만 읽어 공용 집계(ulMetaAgg)로 묶는다. 10분 캐시(Cache API, 무료).
   요약이 없는 예전 덱은 요청 한 번에 META_FILL개까지만 본문에서 만들어 채운다(읽는 줄·CPU를 작게: 무료 플랜 요청당 10ms) */
export const META_N = 400, META_FILL = 20, META_SEC = 600;
export const META_SQL = 'CREATE TABLE IF NOT EXISTS deck_meta (player_id TEXT PRIMARY KEY, sum TEXT NOT NULL, at INTEGER NOT NULL) WITHOUT ROWID';
let metaOk = false; export function _metaReset() { metaOk = false; }
/* 표가 없으면(0002 SQL을 아직 안 돌린 서버) 한 번 만든다. 같은 문장(IF NOT EXISTS)이라 여러 번 해도 안전 */
export async function ensureMeta(db) { if (metaOk) return true; try { await db.prepare(META_SQL).run(); metaOk = true; } catch (e) { metaOk = false; } return metaOk; }
export async function metaPut(db, pid, e, now) { try { if (!(await ensureMeta(db))) return; const m = ulDeckMeta(e); if (!m) return;
  await db.prepare(`INSERT INTO deck_meta (player_id, sum, at) SELECT ?, ?, ? WHERE ${live} AND EXISTS (SELECT 1 FROM decks WHERE player_id = ? AND h = ?) ON CONFLICT (player_id) DO UPDATE SET sum = excluded.sum, at = excluded.at`).bind(pid, JSON.stringify(m), now, pid, pid, cupEntryHash(e)).run(); } catch (x) {} }
export async function meta(url, db, now) {
  const q = url.searchParams.get('tier'), all = q == null || q === 'all', tier = all ? null : qInt(q, 0, 0, TOP), since = now - STALE, g = await cacheGen(db, now);
  return cached(url, `meta/g${g}/${all ? 'all' : tier}/${Math.floor(now / (META_SEC * 1000))}`, META_SEC, async () => {
    await ensureMeta(db);
    const r = await db.prepare(`SELECT d.player_id AS pid, d.tier, m.sum FROM decks d JOIN players p ON p.id = d.player_id LEFT JOIN deck_meta m ON m.player_id = d.player_id WHERE p.hidden = 0 AND d.at >= ?${all ? '' : ' AND d.tier = ?'} ORDER BY d.at DESC LIMIT ?`).bind(...(all ? [since, META_N] : [since, tier, META_N])).all();
    const rows = r.results || [], list = [], miss = rows.filter(x => !x.sum).slice(0, META_FILL).map(x => x.pid);
    if (miss.length) { const b = (await db.prepare(`SELECT player_id AS pid, body FROM decks WHERE player_id IN (${miss.map(() => '?').join(',')})`).bind(...miss).all()).results || [];
      const put = []; for (const x of b) { try { const m = ulDeckMeta(JSON.parse(x.body)); if (!m) continue; const row = rows.find(y => y.pid === x.pid); if (row) row.sum = JSON.stringify(m); put.push(db.prepare('INSERT OR REPLACE INTO deck_meta (player_id, sum, at) VALUES (?, ?, ?)').bind(x.pid, row.sum, now)); } catch (e) {} }
      if (put.length) { try { await db.batch(put); } catch (e) {} } }
    for (const x of rows) { if (!x.sum) continue; try { list.push(Object.assign(JSON.parse(x.sum), { tier: x.tier })); } catch (e) {} }
    const tr = (await db.prepare('SELECT d.tier, COUNT(*) AS n, AVG(d.ovr) AS avg FROM decks d JOIN players p ON p.id = d.player_id WHERE p.hidden = 0 AND d.at >= ? GROUP BY d.tier').bind(since).all()).results || [];
    const tiers = UL_TIERS.map((name, t) => { const x = tr.find(y => y.tier === t); return { tier: t, name, n: x ? x.n : 0, avg: x && x.avg ? Math.round(x.avg * 10) / 10 : 0 }; });
    return pub({ ok: true, tier: all ? 'all' : tier, at: now, n: list.length, of: rows.length, agg: ulMetaAgg(list), tiers }, META_SEC);
  });
}
