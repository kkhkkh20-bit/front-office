/* 래더 기록실(서버 v1, 사용자 11-18 "서버 전체 기록"): 리그 결과(POST /ladder/result)에 붙어 온 rec(팀 요약 + 우리 선수 상위 기록 줄, 몇 KB)를
   ladder_teams(리그마다 한 줄) · ladder_lines(선수 줄)에 넣고, GET /api/v1/ladder/records?season=&tier= 가 시즌 순위표·우승 벽을 만든다.
   닉네임 말고 다른 개인 정보는 없다(선수 이름은 덱 안 이름, 팀 이름은 덱 이름). 표는 처음 쓸 때 만든다(migrations/0004_ladder_records.sql과 같은 문장).
   비용: 리그당 쓰기 1 + 선수 줄 최대 REC_B + REC_P. 읽기는 120초 캐시(Cache API) · 요청 제한 'read' */
import { cupName, cupBadName } from '../../src/core/cup.mjs';
import { UL_TIERS } from '../../src/core/uladder.mjs';
import { err, pub, cached, qInt } from './http.js';

export const REC_SQL = `-- 래더 기록실(2026-11-18): 리그가 끝날 때 올린 우리 선수 상위 기록 줄과 팀 요약(정규 순위·포스트시즌 우승/준우승). 설계 docs/design/ladder-series-2026-11-18.md
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
`;
/* 래더 기록 세분화(구단주 11-18 "통계랑 이런 것들 좀 더 세밀하게"): ladder_lines에 칸을 더한다(지우는 것 없음, 리그당 쓰는 줄 수는 그대로).
   타자 d2 2루타 · d3 3루타 · r 득점(삼진은 원래 so 칸) / 투수 l 패 · gs 선발 · ha 피안타 · bb 볼넷 · hra 피홈런 · hld 홀드.
   ALTER에는 IF NOT EXISTS가 없어 마이그레이션 파일로 두지 않고, 서버가 PRAGMA table_info로 없는 칸만 더한다(ensureRec). 칸을 못 더하면 예전 칸만 쓴다(recX false) */
export const REC_X = Object.freeze(['d2', 'd3', 'r', 'l', 'gs', 'ha', 'bb', 'hra', 'hld']);
export const recXStatements = have => REC_X.filter(c => !(have || []).includes(c)).map(c => `ALTER TABLE ladder_lines ADD COLUMN ${c} INTEGER NOT NULL DEFAULT 0`);
let recX = false; export const recXOn = () => recX;
export const recStatements = () => REC_SQL.split('\n').filter(l => !/^\s*--/.test(l)).join('\n').split(';').map(x => x.trim()).filter(Boolean);
let recOk = false; export function _recReset() { recOk = false; recX = false; }
/* 표가 없으면(0004를 안 돌린 서버) 한 번 만든다. 같은 문장(IF NOT EXISTS)이라 여러 번 해도 안전. 세분화 칸(REC_X)은 없는 것만 더한다 */
export async function ensureRec(db) { if (recOk) return true; try { await db.batch(recStatements().map(q => db.prepare(q))); recOk = true; } catch (e) { recOk = false; }
  if (recOk) { try { const have = ((await db.prepare('PRAGMA table_info(ladder_lines)').all()).results || []).map(x => x.name), add = recXStatements(have); if (add.length) await db.batch(add.map(q => db.prepare(q))); recX = true; } catch (e) { recX = false; } }
  return recOk; }

/* 한 리그에서 받는 줄 수·값 한도(팀당 정규 27경기 + 포스트시즌 최대 8경기라 넉넉히) */
export const REC_B = 12, REC_P = 10, REC_G = 40, REC_SEC = 120, REC_N = 10, REC_CH = 12;
/* 시즌 순위 자격(사용자 11-18 "27경기에 맞춘 규정"): 리그 하나(27경기)의 규정 타석 3.1 × 27 ≈ 84, 규정 이닝 1 × 27 = 27이닝(81아웃) */
export const REC_MIN_PA = 84, REC_MIN_OUTS = 81;
/* 포스트시즌 보너스(사용자 11-18 "우승·준우승 시즌 포인트 조금"): 승강 규칙(정규 순위)은 그대로, 시즌 포인트만 더한다 */
export const PS_BONUS = Object.freeze({ c: 3, r: 1 });
const int = (x, lo, hi) => { const n = Math.floor(+x); return Number.isFinite(n) && n >= lo && n <= hi ? n : null; };
const nm = s => { const x = cupName(s); return x && !cupBadName(x) ? x : null; };

/* rec 검사: {team:{n, rs, ra, hr}, b:[[이름, g, pa, ab, h, tb, hr, rbi, sb, ob, sf, (d2, d3, r, so)]], p:[[이름, g, outs, er, so, sv, w, wh, (l, gs, ha, bb, hra, hld)]]}.
   괄호 칸은 래더 기록 세분화(11-18) 뒤 앱이 붙인다(예전 앱은 없음 = 0). 틀린 줄은 버리고, 팀이 틀리면 rec 전체를 버린다 */
export function recParse(rec) {
  if (!rec || typeof rec !== 'object' || !rec.team || typeof rec.team !== 'object') return null;
  const T = rec.team, team = { n: nm(T.n) || '', rs: int(T.rs ?? 0, 0, 9999), ra: int(T.ra ?? 0, 0, 9999), hr: int(T.hr ?? 0, 0, 999) };
  if (team.rs == null || team.ra == null || team.hr == null) return null;
  const B = [], P = [], seen = new Set();
  for (const x of Array.isArray(rec.b) ? rec.b.slice(0, REC_B) : []) {
    if (!Array.isArray(x)) continue; const n = nm(x[0]); const [g, pa, ab, h, tb, hr, rbi, sb, ob, sf] = x.slice(1, 11).map(v => int(v ?? 0, 0, 999));
    const [d2, d3, r, so] = [11, 12, 13, 14].map(k => int(x[k] ?? 0, 0, 999));
    if (!n || seen.has('b' + n) || [g, pa, ab, h, tb, hr, rbi, sb, ob, sf, d2, d3, r, so].some(v => v == null) || g < 1 || g > REC_G || pa > REC_G * 7 || ab > pa || h > ab || hr > h || tb < h || tb > 4 * h || ob + ab + sf > pa) continue;
    if (d2 + d3 + hr > h || so > pa || r > pa || ((d2 || d3) && tb !== h + d2 + 2 * d3 + 3 * hr)) continue; /* 세분화 칸이 앞 칸과 안 맞으면 버린다 */
    seen.add('b' + n); B.push({ name: n, g, pa, ab, h, tb, hr, rbi, sb, ob, sf, d2, d3, r, so });
  }
  for (const x of Array.isArray(rec.p) ? rec.p.slice(0, REC_P) : []) {
    if (!Array.isArray(x)) continue; const n = nm(x[0]); const [g, outs, er, so, sv, w, wh] = x.slice(1, 8).map(v => int(v ?? 0, 0, 9999));
    const [l, gs, ha, bb, hra, hld] = [8, 9, 10, 11, 12, 13].map(k => int(x[k] ?? 0, 0, 9999));
    if (!n || seen.has('p' + n) || [g, outs, er, so, sv, w, wh, l, gs, ha, bb, hra, hld].some(v => v == null) || g < 1 || g > REC_G || outs > REC_G * 36 || er > 999 || so > outs + 3 || sv > g || w > g) continue;
    if (l > g || gs > g || hld > g || w + l > g || ha + bb > wh || hra > ha) continue;
    seen.add('p' + n); P.push({ name: n, g, outs, er, so, sv, w, wh, l, gs, ha, bb, hra, hld });
  }
  return { team, b: B, p: P };
}
/* 결과를 넣는 같은 batch에 붙일 문장(중복 결과·지운 플레이어면 결과와 함께 되돌아간다) */
export function recStmts(db, o) {
  const { pid, season, tier, key, rank, w, l, d, ps, rec, now } = o, live = 'WHERE EXISTS (SELECT 1 FROM players WHERE id = ?)';
  const st = [db.prepare(`INSERT INTO ladder_teams (season, tier, player_id, lkey, team, rank, w, l, d, rs, ra, hr, ps, at) SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? ${live}`)
    .bind(season, tier, pid, key, rec.team.n, rank, w, l, d, rec.team.rs, rec.team.ra, rec.team.hr, ps || '', now, pid)];
  const X = o.x == null ? recX : !!o.x; /* 세분화 칸이 있으면 같이 적는다(줄 수는 같다) */
  for (const x of rec.b) st.push(X ? db.prepare(`INSERT INTO ladder_lines (season, tier, player_id, lkey, kind, name, team, g, pa, ab, h, tb, hr, rbi, sb, ob, sf, d2, d3, r, so, at) SELECT ?, ?, ?, ?, 'b', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? ${live}`)
    .bind(season, tier, pid, key, x.name, rec.team.n, x.g, x.pa, x.ab, x.h, x.tb, x.hr, x.rbi, x.sb, x.ob, x.sf, x.d2 | 0, x.d3 | 0, x.r | 0, x.so | 0, now, pid)
    : db.prepare(`INSERT INTO ladder_lines (season, tier, player_id, lkey, kind, name, team, g, pa, ab, h, tb, hr, rbi, sb, ob, sf, at) SELECT ?, ?, ?, ?, 'b', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? ${live}`)
    .bind(season, tier, pid, key, x.name, rec.team.n, x.g, x.pa, x.ab, x.h, x.tb, x.hr, x.rbi, x.sb, x.ob, x.sf, now, pid));
  for (const x of rec.p) st.push(X ? db.prepare(`INSERT INTO ladder_lines (season, tier, player_id, lkey, kind, name, team, g, outs, er, so, sv, w, wh, l, gs, ha, bb, hra, hld, at) SELECT ?, ?, ?, ?, 'p', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? ${live}`)
    .bind(season, tier, pid, key, x.name, rec.team.n, x.g, x.outs, x.er, x.so, x.sv, x.w, x.wh, x.l | 0, x.gs | 0, x.ha | 0, x.bb | 0, x.hra | 0, x.hld | 0, now, pid)
    : db.prepare(`INSERT INTO ladder_lines (season, tier, player_id, lkey, kind, name, team, g, outs, er, so, sv, w, wh, at) SELECT ?, ?, ?, ?, 'p', ?, ?, ?, ?, ?, ?, ?, ?, ?, ? ${live}`)
    .bind(season, tier, pid, key, x.name, rec.team.n, x.g, x.outs, x.er, x.so, x.sv, x.w, x.wh, now, pid));
  return st;
}
export const recDelete = (db, pid) => ['ladder_lines', 'ladder_teams'].map(t => db.prepare(`DELETE FROM ${t} WHERE player_id = ?`).bind(pid));

const r3 = x => Math.round(x * 1000) / 1000, r2 = x => Math.round(x * 100) / 100;
/* 시즌 줄 합(플레이어·선수 이름마다) → 부문별 상위 REC_N. 같은 값이면 먼저 닿은 쪽(at 이른 쪽) → 이름.
   래더 기록 세분화(구단주 11-18): 타자 안타·득점·2루타·3루타·볼넷·출루율·장타율·루타, 투수 승·패 대신 홀드·이닝·K/9·WHIP를 더했다. 세분화 칸이 없는 예전 줄은 0으로 센다 */
export const REC_BOARDS = Object.freeze({ b: ['hr', 'avg', 'ops', 'obp', 'slg', 'rbi', 'h', 'r', 'd2', 'd3', 'tb', 'bb', 'sb'], p: ['era', 'whip', 'k9', 'so', 'w', 'sv', 'hld', 'ip'] });
export function recBoards(B, P) {
  const top = (L, f, q, asc) => L.filter(x => (q ? q(x) : true) && f(x) != null && (asc || f(x) > 0)).sort((a, b) => (asc ? f(a) - f(b) : f(b) - f(a)) || a.at - b.at || String(a.name).localeCompare(String(b.name))).slice(0, REC_N);
  const row = (x, v) => ({ pid: x.pid, nick: x.nick, name: x.name, team: x.team, tier: x.tier, v, ...(x.season != null ? { season: x.season } : {}) });
  for (const x of B) { x.avg = x.ab ? x.h / x.ab : 0; const obd = x.ab + x.ob + x.sf; x.obp = obd ? (x.h + x.ob) / obd : 0; x.slg = x.ab ? x.tb / x.ab : 0; x.ops = x.obp + x.slg; }
  for (const x of P) { x.era = x.outs ? x.er * 27 / x.outs : null; x.whip = x.outs ? x.wh * 3 / x.outs : null; x.k9 = x.outs ? x.so * 27 / x.outs : null; }
  const qb = x => x.pa >= REC_MIN_PA, qp = x => x.outs >= REC_MIN_OUTS, n = k => x => x[k] || 0;
  return {
    hr: top(B, n('hr')).map(x => row(x, x.hr)), avg: top(B, x => x.avg, qb).map(x => row(x, r3(x.avg))), ops: top(B, x => x.ops, qb).map(x => row(x, r3(x.ops))),
    obp: top(B, x => x.obp, qb).map(x => row(x, r3(x.obp))), slg: top(B, x => x.slg, qb).map(x => row(x, r3(x.slg))),
    rbi: top(B, n('rbi')).map(x => row(x, x.rbi)), h: top(B, n('h')).map(x => row(x, x.h)), r: top(B, n('r')).map(x => row(x, x.r)), d2: top(B, n('d2')).map(x => row(x, x.d2)), d3: top(B, n('d3')).map(x => row(x, x.d3)),
    tb: top(B, n('tb')).map(x => row(x, x.tb)), bb: top(B, n('ob')).map(x => row(x, x.ob)), sb: top(B, n('sb')).map(x => row(x, x.sb)),
    era: top(P, x => x.era, qp, true).map(x => row(x, r2(x.era))), whip: top(P, x => x.whip, qp, true).map(x => row(x, r2(x.whip))), k9: top(P, x => x.k9, qp).map(x => row(x, r2(x.k9))),
    so: top(P, n('so')).map(x => row(x, x.so)), sv: top(P, n('sv')).map(x => row(x, x.sv)), w: top(P, n('w')).map(x => row(x, x.w)), hld: top(P, n('hld')).map(x => row(x, x.hld)),
    ip: top(P, n('outs')).map(x => row(x, Math.floor(x.outs / 3) + (x.outs % 3 ? '.' + x.outs % 3 : ''))),
  };
}
/* GET /api/v1/ladder/records?season=N&tier=N|all&scope=season|league|career
   scope: season(시즌 합, 기본) · league(한 리그 최고 기록, 그 시즌) · career(모든 시즌 합). career는 모든 줄을 읽으므로 캐시를 길게(REC_CAREER_SEC) */
export const REC_SCOPES = Object.freeze(['season', 'league', 'career']), REC_CAREER_SEC = 3600;
export async function records(url, db, now, s, gen) {
  const season = url.searchParams.has('season') ? int(url.searchParams.get('season'), 1, 1e6) : s.id; if (!season) return err(400, 'bad_json');
  const q = url.searchParams.get('tier'), all = q == null || q === '' || q === 'all', tier = all ? null : qInt(q, 0, 0, UL_TIERS.length - 1);
  const sc = REC_SCOPES.includes(url.searchParams.get('scope')) ? url.searchParams.get('scope') : 'season', sec = sc === 'career' ? REC_CAREER_SEC : REC_SEC;
  return cached(url, `rec/g${gen}/${sc}/${sc === 'career' ? 0 : season}/${all ? 'all' : tier}`, sec, async () => {
    if (!(await ensureRec(db))) return err(503, 'schema_missing');
    const R = await recData(db, season, all, tier, sc);
    return pub({ ok: true, season, scope: sc, tier: all ? 'all' : tier, current: season === s.id, at: now, leagues: R.leagues, min: { pa: REC_MIN_PA, ip: REC_MIN_OUTS / 3 }, boards: R.boards, champs: R.champs }, sec);
  });
}
/* 시즌 기록 계산(기록실·관리자 한눈 보기 '서버 기록 1위'가 같이 쓴다). all이면 단계를 넘어 합한다. sc: season | league | career */
export async function recData(db, season, all, tier, sc) {
  sc = sc || 'season';
  const tw = all ? '' : ' AND l.tier = ?', ta = all ? [] : [tier], J = 'JOIN players p ON p.id = l.player_id AND p.hidden = 0';
  const sw = sc === 'career' ? '1 = 1' : 'l.season = ?', sa = sc === 'career' ? [] : [season], X = recX;
  const xb = X ? ', SUM(l.d2) AS d2, SUM(l.d3) AS d3, SUM(l.r) AS r, SUM(l.so) AS so' : '', xp = X ? ', SUM(l.hld) AS hld, SUM(l.l) AS l' : '';
  let B, P;
  if (sc === 'league') { /* 한 리그 기록: 줄을 묶지 않는다 */
    const cb = X ? ', l.d2, l.d3, l.r, l.so' : '', cp = X ? ', l.hld, l.l' : '';
    B = (await db.prepare(`SELECT l.player_id AS pid, p.nickname AS nick, l.name, l.team, l.tier, l.season, l.g, l.pa, l.ab, l.h, l.tb, l.hr, l.rbi, l.sb, l.ob, l.sf${cb}, l.at FROM ladder_lines l ${J} WHERE ${sw} AND l.kind = 'b'${tw} LIMIT 6000`).bind(...sa, ...ta).all()).results || [];
    P = (await db.prepare(`SELECT l.player_id AS pid, p.nickname AS nick, l.name, l.team, l.tier, l.season, l.g, l.outs, l.er, l.so, l.sv, l.w, l.wh${cp}, l.at FROM ladder_lines l ${J} WHERE ${sw} AND l.kind = 'p'${tw} LIMIT 6000`).bind(...sa, ...ta).all()).results || [];
  } else {
    B = (await db.prepare(`SELECT l.player_id AS pid, p.nickname AS nick, l.name, MAX(l.team) AS team, MAX(l.tier) AS tier, SUM(l.g) AS g, SUM(l.pa) AS pa, SUM(l.ab) AS ab, SUM(l.h) AS h, SUM(l.tb) AS tb, SUM(l.hr) AS hr, SUM(l.rbi) AS rbi, SUM(l.sb) AS sb, SUM(l.ob) AS ob, SUM(l.sf) AS sf${xb}, MIN(l.at) AS at FROM ladder_lines l ${J} WHERE ${sw} AND l.kind = 'b'${tw} GROUP BY l.player_id, l.name LIMIT 3000`).bind(...sa, ...ta).all()).results || [];
    P = (await db.prepare(`SELECT l.player_id AS pid, p.nickname AS nick, l.name, MAX(l.team) AS team, MAX(l.tier) AS tier, SUM(l.g) AS g, SUM(l.outs) AS outs, SUM(l.er) AS er, SUM(l.so) AS so, SUM(l.sv) AS sv, SUM(l.w) AS w, SUM(l.wh) AS wh${xp}, MIN(l.at) AS at FROM ladder_lines l ${J} WHERE ${sw} AND l.kind = 'p'${tw} GROUP BY l.player_id, l.name LIMIT 3000`).bind(...sa, ...ta).all()).results || [];
  }
  if (!X) for (const x of B) Object.assign(x, { d2: 0, d3: 0, r: 0, so: 0 });
  const boards = recBoards(B, P);
  const TT = 'FROM ladder_teams l JOIN players p ON p.id = l.player_id AND p.hidden = 0';
  /* 팀 기록(한 리그): 최다승·최다 득점·최소 실점·최다 홈런·최고 득실. 시즌·통산 범위는 같고 '한 리그'라 묶지 않는다 */
  const tq = async o => ((await db.prepare(`SELECT l.player_id AS pid, p.nickname AS nick, l.team, l.tier, l.season, l.w, l.l, l.d, l.rank, l.ps, l.rs, l.ra, l.hr, l.at ${TT} WHERE ${sw}${tw} ORDER BY ${o}, l.at ASC LIMIT ?`).bind(...sa, ...ta, REC_N).all()).results || []);
  boards.tw = (await tq('l.w DESC, l.l ASC')).map(x => Object.assign(x, { v: x.w }));
  boards.trs = (await tq('l.rs DESC')).map(x => Object.assign(x, { v: x.rs }));
  boards.tra = (await tq('l.ra ASC')).filter(x => x.w + x.l + x.d > 0).map(x => Object.assign(x, { v: x.ra }));
  boards.thr = (await tq('l.hr DESC')).map(x => Object.assign(x, { v: x.hr }));
  boards.trd = (await tq('(l.rs - l.ra) DESC')).map(x => Object.assign(x, { v: x.rs - x.ra }));
  boards.titles = ((await db.prepare(`SELECT l.player_id AS pid, p.nickname AS nick, MAX(l.team) AS team, MAX(l.tier) AS tier, COUNT(*) AS v, MIN(l.at) AS at ${TT} WHERE ${sw} AND l.ps = 'c'${tw} GROUP BY l.player_id ORDER BY v DESC, at ASC LIMIT ?`).bind(...sa, ...ta, REC_N).all()).results || []);
  const champs = (await db.prepare(`SELECT l.player_id AS pid, p.nickname AS nick, l.team, l.tier, l.w, l.l, l.d, l.rank, l.at ${TT} WHERE ${sw} AND l.ps = 'c'${tw} ORDER BY l.id DESC LIMIT ?`).bind(...sa, ...ta, REC_CH).all()).results || [];
  const n = await db.prepare(`SELECT COUNT(*) AS n FROM ladder_teams l WHERE ${sw}${tw}`).bind(...sa, ...ta).first();
  return { leagues: (n && n.n) || 0, boards, champs };
}
