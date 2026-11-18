/* 래더 관리자 대시보드(구단주 11-18 "관리자에 래더를 … 여러 통계 등 데이터를 볼 수 있게", 설계 docs/design/ladder-admin-dashboard-2026-11-18.md).
   모두 관리자 키(CUP_ADMIN) 뒤의 읽기 전용 집계다. 쓰는 줄은 없다(오류 수 err5만 500 응답 때 daily_stats에 1줄: worker/v1/index.js).
   GET admin/lstats?range=today|7d|30d|season  KPI(직전 같은 기간 대비)·일별 추이·날짜×시간 활동·깔때기·코호트·단계 분포·승강 흐름·덱 구성·OVR↔승률·경쟁 균형·거절·상태
   GET admin/lplayers?q=&tier=&sort=&desc=&n=&off=  플레이어 표(검색·정렬·쪽)
   GET admin/lplayer?pid=  플레이어 한 명(덱 요약·최근 리그·시즌·맞대결 상위)
   개인 정보: 닉네임·덱 이름·익명 플레이어 id(p+16자)만. 기기 번호는 해시 묶음 수로만 센다.
   비용(읽기): lstats 한 번에 daily_stats 최근 60일(키 × 날) + decks·players·ladder_reg(덱 수만큼) + league_results(범위 안 + 플레이어별 묶음) + h2h(최대 3000줄).
   화면은 30초마다가 아니라 탭을 열 때·새로고침 단추·범위를 바꿀 때만 받는다(관리자 혼자 보는 화면) */
import { UL_TIERS, ulMetaAgg } from '../../src/core/uladder.mjs';
import { json, err, kstDay, kstHour, qInt } from './http.js';
import { PID } from './auth.js';
import { currentSeason } from './season.js';
import { ensureMeta } from './ladder.js';
import { ensureAuto } from './ladauto.js';
import { FREE } from './admin.js';

const DAY = 86400e3, TOP = UL_TIERS.length - 1;
const dayMs = d => Date.parse(d + 'T00:00:00+09:00');
const r1 = x => Math.round(x * 10) / 10, r3 = x => Math.round(x * 1000) / 1000;
export const LS_RANGES = Object.freeze({ today: 1, '7d': 7, '30d': 30 });
/* 범위: 오늘 · 7일 · 30일 · 이번 시즌(시즌 시작부터). {days, from(ms), prevFrom, label} */
function rangeOf(q, now, s) {
  const today = dayMs(kstDay(now));
  if (q === 'season') { const days = Math.max(1, Math.ceil((now - s.starts) / DAY)); return { key: 'season', days, from: s.starts, prevFrom: s.starts - days * DAY }; }
  const days = LS_RANGES[q] || 7; return { key: LS_RANGES[q] ? q : '7d', days, from: today - (days - 1) * DAY, prevFrom: today - (2 * days - 1) * DAY };
}
const cnt = async (db, q, ...a) => ((await db.prepare(q).bind(...a).first()) || { n: 0 }).n || 0;
const rows = async (db, q, ...a) => (await db.prepare(q).bind(...a).all()).results || [];

export async function ladderStats(url, db, now, env) {
  await ensureAuto(db); await ensureMeta(db);
  const s = await currentSeason(db, now), R = rangeOf(url.searchParams.get('range'), now, s);
  /* ---- 일별(daily_stats, 최근 60일: 30일 범위의 직전 30일까지) ---- */
  const days = []; for (let i = 59; i >= 0; i--) days.push(kstDay(now - i * DAY));
  const ds = await rows(db, 'SELECT day, k, v FROM daily_stats WHERE day >= ?', days[0]);
  const by = {}; for (const d of days) by[d] = {}; for (const x of ds) if (by[x.day]) by[x.day][x.k] = x.v;
  const inR = (d, from, to) => { const m = dayMs(d); return m >= from - DAY + 1 && m < to; };
  const sumK = (k, from, to) => days.reduce((a, d) => a + (inR(d, from, to) ? by[d][k] || 0 : 0), 0);
  const today0 = dayMs(kstDay(now)), end = today0 + DAY;
  const KS = ['decks_new', 'decks_upd', 'leagues', 'promos', 'demos', 'players_new', 'err5'];
  const cur = {}, prev = {}; for (const k of KS) { cur[k] = sumK(k, R.from, end); prev[k] = sumK(k, R.prevFrom, R.from); }
  const rejK = [...new Set(ds.map(x => x.k).filter(k => k.startsWith('rej_')))];
  const rej = rejK.map(k => ({ code: k.slice(4), n: sumK(k, R.from, end), prev: sumK(k, R.prevFrom, R.from), d7: sumK(k, today0 - 6 * DAY, end) })).sort((a, b) => b.n - a.n);
  const trend = days.slice(-30).map(d => ({ day: d, active: by[d].active || 0, decks_new: by[d].decks_new || 0, leagues: by[d].leagues || 0, promos: by[d].promos || 0, demos: by[d].demos || 0, rej: rejK.reduce((a, k) => a + (by[d][k] || 0), 0), d1_w: by[d].d1_w || 0, d1_r: by[d].d1_r || 0, err5: by[d].err5 || 0 }));
  const heat = days.slice(-14).map(d => ({ day: d, h: Array.from({ length: 24 }, (_, h) => by[d]['lh:' + String(h).padStart(2, '0')] || 0) }));
  /* ---- 덱·플레이어(덱 수만큼 한 번 읽어 JS로 묶는다) ---- */
  const D = await rows(db, `SELECT d.player_id AS pid, d.tier, d.ovr, d.ovr_json, d.created, d.at, p.last_seen, p.created AS pc, p.hidden, r.auto, r.off, r.dev, m.sum,
      (SELECT COUNT(*) FROM devices v WHERE v.player_id = d.player_id) AS devs, (SELECT MAX(best_tier) FROM ladder_entries e WHERE e.player_id = d.player_id) AS bt
    FROM decks d JOIN players p ON p.id = d.player_id LEFT JOIN ladder_reg r ON r.player_id = d.player_id LEFT JOIN deck_meta m ON m.player_id = d.player_id ORDER BY d.at DESC LIMIT 5000`);
  const seen = x => Math.max(x.last_seen || 0, x.at || 0), act = t => D.filter(x => seen(x) >= t).length;
  const devGroups = new Set(D.map(x => x.dev || 'p:' + x.pid)).size;
  const devHist = [0, 0, 0, 0]; for (const x of D) devHist[Math.min(3, x.devs | 0)]++;
  const people = { decks: D.length, players: new Set(D.map(x => x.pid)).size, all_players: await cnt(db, 'SELECT COUNT(*) AS n FROM players'), dev_groups: devGroups,
    active: { d1: act(today0), d7: act(today0 - 6 * DAY), d30: act(today0 - 29 * DAY) },
    active_prev: { d1: D.filter(x => seen(x) >= today0 - DAY && seen(x) < today0).length, d7: D.filter(x => seen(x) >= today0 - 13 * DAY && seen(x) < today0 - 6 * DAY).length },
    devices: devHist, linked: await cnt(db, 'SELECT COUNT(DISTINCT player_id) AS n FROM identities'),
    auto: D.filter(x => x.auto === 1).length, manual: D.filter(x => x.auto !== 1).length, off: await cnt(db, 'SELECT COUNT(*) AS n FROM ladder_reg WHERE off = 1'), hidden: D.filter(x => x.hidden).length,
    new_range: D.filter(x => x.created >= R.from).length, new_prev: D.filter(x => x.created >= R.prevFrom && x.created < R.from).length };
  /* ---- 리그 결과: 플레이어별 묶음(깔때기·산점도·균형) + 범위 안 승강 흐름 ---- */
  const LR = await rows(db, 'SELECT player_id AS pid, COUNT(*) AS n, SUM(w) AS w, SUM(l) AS l, SUM(d) AS d, MAX(CASE WHEN to_tier > tier THEN 1 ELSE 0 END) AS up, MIN(at) AS first FROM league_results GROUP BY player_id LIMIT 20000');
  const LRm = new Map(LR.map(x => [x.pid, x]));
  const champs = await rows(db, "SELECT player_id AS pid, COUNT(*) AS n FROM ladder_leagues WHERE ps = 'c' GROUP BY player_id");
  const champSet = new Set(champs.map(x => x.pid));
  /* 깔때기는 단계마다 앞 조건을 모두 채운 덱만 센다(겹쳐 줄어든다): 등록 → 첫 리그 → 3리그 이상 → 그중 승격 1번 이상 → 그중 우승 1번 이상 */
  const st = [x => true, x => LRm.has(x.pid), x => (LRm.get(x.pid) || {}).n >= 3, x => !!(LRm.get(x.pid) || {}).up, x => champSet.has(x.pid)];
  const funnel = ['등록 덱', '첫 리그 완료', '리그 3개 이상', '승격 1번 이상', '우승 1번 이상'].map((k, i) => [k, D.filter(x => st.slice(0, i + 1).every(f => f(x))).length])
    .map(([k, n], i, a) => ({ k, n, pct: a[0][1] ? r3(n / a[0][1]) : 0, step: i && a[i - 1][1] ? r3(n / a[i - 1][1]) : null }));
  const flow = await rows(db, 'SELECT tier, to_tier, COUNT(*) AS n FROM league_results WHERE at >= ? GROUP BY tier, to_tier', R.from);
  /* ---- 코호트: 처음 등록한 날(최근 14일) × 며칠 뒤에도 왔나(1·3·7일) · 오른 단계 ---- */
  const cohort = []; for (let i = 13; i >= 0; i--) { const d0 = today0 - i * DAY, C = D.filter(x => x.created >= d0 && x.created < d0 + DAY), n = C.length, ret = k => (now - d0 >= k * DAY) ? C.filter(x => seen(x) >= x.created + k * DAY).length : null;
    cohort.push({ day: kstDay(d0), n, r1: ret(1), r3: ret(3), r7: ret(7), tier: UL_TIERS.map((_, t) => C.filter(x => Math.max(x.bt | 0, x.tier | 0) >= t).length) }); }
  /* ---- 단계 분포·덱 구성 ---- */
  const tiers = UL_TIERS.map((name, t) => { const T = D.filter(x => x.tier === t), o = T.map(x => { try { return JSON.parse(x.ovr_json || 'null'); } catch (e) { return null; } }).filter(Boolean);
    const M = T.map(x => { try { return x.sum ? JSON.parse(x.sum) : null; } catch (e) { return null; } }).filter(Boolean), A = M.length ? ulMetaAgg(M) : null;
    const up = flow.filter(f => f.tier === t && f.to_tier > t).reduce((a, f) => a + f.n, 0), down = flow.filter(f => f.tier === t && f.to_tier < t).reduce((a, f) => a + f.n, 0), stay = flow.filter(f => f.tier === t && f.to_tier === t).reduce((a, f) => a + f.n, 0);
    return { tier: t, name, n: T.length, active7: T.filter(x => seen(x) >= today0 - 6 * DAY).length, avg: T.length ? r1(T.reduce((a, x) => a + (x.ovr || 0), 0) / T.length) : 0, p: o.length ? r1(o.reduce((a, x) => a + (+x.p || 0), 0) / o.length) : 0, b: o.length ? r1(o.reduce((a, x) => a + (+x.b || 0), 0) / o.length) : 0,
      sp: A && A.sp ? A.sp.avg : null, rp: A && A.rp ? A.rp.avg : null, arch: A ? A.arch : null, meta_n: M.length, up, down, stay, leagues: up + down + stay }; });
  /* ---- 덱 OVR ↔ 승률(이번 시즌, 리그를 마친 덱) · 경쟁 균형 ---- */
  const SR = await rows(db, 'SELECT r.player_id AS pid, COUNT(*) AS n, SUM(r.w) AS w, SUM(r.l) AS l, SUM(r.d) AS d, SUM(CASE WHEN r.rank = 1 THEN 1 ELSE 0 END) AS firsts, MAX(r.tier) AS tier FROM league_results r WHERE r.season = ? GROUP BY r.player_id LIMIT 3000', s.id);
  const ovrOf = new Map(D.map(x => [x.pid, x.ovr || 0])), nick = new Map();
  const scatter = SR.filter(x => ovrOf.has(x.pid) && (x.w + x.l) > 0).map(x => ({ pid: x.pid, ovr: ovrOf.get(x.pid), wp: r3((x.w + x.d / 2) / (x.w + x.l + x.d)), n: x.n, tier: x.tier })).slice(0, 600);
  const q = scatter.filter(x => x.n >= 1), mean = q.length ? q.reduce((a, x) => a + x.wp, 0) / q.length : 0, sd = q.length > 1 ? Math.sqrt(q.reduce((a, x) => a + (x.wp - mean) ** 2, 0) / (q.length - 1)) : 0;
  const corr = (() => { if (q.length < 3) return null; const mo = q.reduce((a, x) => a + x.ovr, 0) / q.length; let sxy = 0, sxx = 0, syy = 0; for (const x of q) { sxy += (x.ovr - mo) * (x.wp - mean); sxx += (x.ovr - mo) ** 2; syy += (x.wp - mean) ** 2; } return sxx && syy ? r3(sxy / Math.sqrt(sxx * syy)) : null; })();
  const cr = await rows(db, "SELECT player_id AS pid, COUNT(*) AS n FROM ladder_leagues WHERE ps = 'c' AND at >= ? GROUP BY player_id ORDER BY n DESC", R.from);
  const ctot = cr.reduce((a, x) => a + x.n, 0), ctop = cr.slice(0, Math.max(1, Math.ceil(cr.length * .1))).reduce((a, x) => a + x.n, 0);
  const H = await rows(db, 'SELECT h.w, h.l, a.ovr AS oa, b.ovr AS ob FROM h2h h JOIN decks a ON a.player_id = h.player_id JOIN decks b ON b.player_id = h.opp_id WHERE h.at >= ? LIMIT 3000', R.from);
  let dec = 0, ups = 0; for (const x of H) { if (x.oa === x.ob || x.w === x.l) continue; dec++; if ((x.w > x.l) === (x.oa < x.ob)) ups++; }
  const balance = { n: q.length, wp_sd: r3(sd), wp_mean: r3(mean), corr, titles: ctot, champs: cr.length, top10_share: ctot ? r3(ctop / ctot) : null, upset: dec ? r3(ups / dec) : null, upset_n: dec };
  /* ---- 상위 덱(OVR · 성적) ---- */
  const topOvr = await rows(db, 'SELECT d.player_id AS pid, p.nickname, d.name, d.tier, d.ovr, d.ovr_json FROM decks d JOIN players p ON p.id = d.player_id WHERE p.hidden = 0 ORDER BY d.ovr DESC LIMIT 10');
  const topRes = await rows(db, 'SELECT e.player_id AS pid, p.nickname, d.name, e.tier, e.points, e.leagues, e.wins, d.ovr FROM ladder_entries e JOIN players p ON p.id = e.player_id LEFT JOIN decks d ON d.player_id = e.player_id WHERE e.season = ? AND p.hidden = 0 AND e.leagues > 0 ORDER BY e.tier DESC, e.points DESC LIMIT 10', s.id);
  for (const x of topOvr) { try { x.ovr_j = JSON.parse(x.ovr_json || 'null'); } catch (e) { x.ovr_j = null; } delete x.ovr_json; }
  /* ---- 상태 ---- */
  const liveN = await cnt(db, 'SELECT COUNT(*) AS n FROM ladder_live'), liveStale = await cnt(db, 'SELECT COUNT(*) AS n FROM ladder_live WHERE at < ?', now - DAY);
  const lastLeague = ((await db.prepare('SELECT MAX(at) AS t FROM league_results').first()) || {}).t || null;
  const td = by[days[days.length - 1]];
  const health = { d1_w: td.d1_w || 0, d1_r: td.d1_r || 0, kv_w: td.kv_w || 0, free: FREE, err5_today: td.err5 || 0, err5_7d: sumK('err5', today0 - 6 * DAY, end), live: liveN, live_stale: liveStale, last_league: lastLeague,
    season: { id: s.id, starts: s.starts, ends: s.ends, days_left: Math.max(0, Math.ceil((s.ends - now) / DAY)) } };
  return json(200, { ok: true, at: now, range: { key: R.key, days: R.days, from: R.from, prev_from: R.prevFrom }, cur, prev, people, rej, trend, heat, funnel, cohort, tiers, flow, scatter, balance, top: { ovr: topOvr, res: topRes }, health,
    hour: kstHour(now) });
}

/* 플레이어 표: ?q=(닉네임·덱 이름·pid) &tier= &sort=seen|leagues|titles|ovr|tier|created|wp &desc=1 &n=(≤200) &off= */
const SORTS = Object.freeze({ seen: 'seen', leagues: 'leagues', titles: 'titles', ovr: 'ovr', tier: 'tier', created: 'created', wp: 'wp', devs: 'devs' });
export async function ladderPlayers(url, db, now) {
  await ensureAuto(db);
  const q = String(url.searchParams.get('q') || '').trim().slice(0, 20).replace(/[%_]/g, ''), tq = url.searchParams.get('tier'), tier = tq == null || tq === '' || tq === 'all' ? null : qInt(tq, 0, 0, TOP);
  const sort = SORTS[url.searchParams.get('sort')] || 'seen', desc = url.searchParams.get('desc') !== '0', n = qInt(url.searchParams.get('n'), 50, 1, 200), off = qInt(url.searchParams.get('off'), 0, 0, 1e6);
  const W = [], A = []; if (q) { W.push('(p.nickname LIKE ? OR d.name LIKE ? OR d.player_id = ?)'); A.push('%' + q + '%', '%' + q + '%', q); } if (tier != null) { W.push('d.tier = ?'); A.push(tier); }
  const where = W.length ? ' WHERE ' + W.join(' AND ') : '';
  const total = await cnt(db, 'SELECT COUNT(*) AS n FROM decks d JOIN players p ON p.id = d.player_id' + where, ...A);
  const list = await rows(db, `SELECT * FROM (SELECT d.player_id AS pid, p.nickname, p.hidden, p.platform, p.created AS pc, d.name, d.tier, d.ovr, d.created, d.at, MAX(p.last_seen, d.at) AS seen, r.auto, r.off,
      COALESCE(g.n, 0) AS leagues, COALESCE(g.w, 0) AS w, COALESCE(g.l, 0) AS l, COALESCE(g.d, 0) AS d, CASE WHEN COALESCE(g.w, 0) + COALESCE(g.l, 0) > 0 THEN (g.w + g.d / 2.0) / (g.w + g.l + g.d) ELSE NULL END AS wp,
      (SELECT COUNT(*) FROM ladder_leagues c WHERE c.player_id = d.player_id AND c.ps = 'c') AS titles, (SELECT COUNT(*) FROM devices v WHERE v.player_id = d.player_id) AS devs,
      (SELECT COUNT(*) FROM ladder_reg x WHERE r.dev IS NOT NULL AND x.dev = r.dev) AS same_dev
    FROM decks d JOIN players p ON p.id = d.player_id LEFT JOIN ladder_reg r ON r.player_id = d.player_id
    LEFT JOIN (SELECT player_id, COUNT(*) AS n, SUM(w) AS w, SUM(l) AS l, SUM(d) AS d FROM league_results GROUP BY player_id) g ON g.player_id = d.player_id${where})
    ORDER BY ${sort} ${desc ? 'DESC' : 'ASC'} NULLS LAST, pid ASC LIMIT ? OFFSET ?`, ...A, n, off);
  return json(200, { ok: true, total, off, returned: list.length, sort: Object.keys(SORTS).find(k => SORTS[k] === sort), desc, players: list.map(x => Object.assign(x, { auto: x.auto ? 1 : 0, off: x.off ? 1 : 0, wp: x.wp == null ? null : r3(x.wp) })) });
}
/* 플레이어 한 명: 덱 요약(본문은 보내지 않는다)·등록·기기 수·최근 리그·시즌 칸·맞대결 상위 */
export async function ladderPlayer(url, db) {
  await ensureAuto(db); await ensureMeta(db);
  const pid = String(url.searchParams.get('pid') || ''); if (!PID.test(pid)) return err(400, 'bad_json');
  const p = await db.prepare('SELECT id, nickname, platform, created, last_seen, hidden FROM players WHERE id = ?').bind(pid).first(); if (!p) return err(404, 'not_found');
  const deck = await db.prepare('SELECT d.name, d.year, d.tier, d.ovr, d.ovr_json, d.bytes, d.created, d.at, m.sum FROM decks d LEFT JOIN deck_meta m ON m.player_id = d.player_id WHERE d.player_id = ?').bind(pid).first();
  if (deck) { try { deck.ovr_j = JSON.parse(deck.ovr_json || 'null'); deck.meta = deck.sum ? JSON.parse(deck.sum) : null; } catch (e) {} delete deck.ovr_json; delete deck.sum; }
  const reg = await db.prepare('SELECT auto, off, man_day, created, at, dev FROM ladder_reg WHERE player_id = ?').bind(pid).first();
  const sameDev = reg && reg.dev ? await cnt(db, 'SELECT COUNT(*) AS n FROM ladder_reg WHERE dev = ?', reg.dev) : 0; if (reg) delete reg.dev;
  const devs = await cnt(db, 'SELECT COUNT(*) AS n FROM devices WHERE player_id = ?', pid), linked = await cnt(db, 'SELECT COUNT(*) AS n FROM identities WHERE player_id = ?', pid);
  const recent = await rows(db, 'SELECT r.season, r.lkey, r.tier, r.to_tier, r.rank, r.teams, r.w, r.l, r.d, r.delta, r.at, g.ps, g.flag FROM league_results r LEFT JOIN ladder_leagues g ON g.player_id = r.player_id AND g.lkey = r.lkey WHERE r.player_id = ? ORDER BY r.id DESC LIMIT 15', pid);
  const seasons = await rows(db, 'SELECT season, tier, best_tier, points, leagues, wins, ups, downs FROM ladder_entries WHERE player_id = ? ORDER BY season DESC LIMIT 10', pid);
  const h2h = await rows(db, 'SELECT h.opp_id AS pid, o.nickname, h.n, h.w, h.l, h.d FROM h2h h LEFT JOIN players o ON o.id = h.opp_id WHERE h.player_id = ? ORDER BY h.n DESC LIMIT 5', pid);
  return json(200, { ok: true, player: p, deck: deck || null, reg: reg || null, same_dev: sameDev, devices: devs, linked, recent, seasons, h2h });
}
