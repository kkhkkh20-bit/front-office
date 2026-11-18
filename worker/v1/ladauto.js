/* 래더 v4(구단주 11-18, docs/design/ladder-v4-2026-11-18.md §1·§10): 자동 등록·자동 참가 끄기·하루 1회 직접 재등록·진행 중 리그·끝난 리그 요약·관리자 한눈 보기.
   표(처음 쓸 때 스스로 만든다 = migrations/0005_ladder_auto.sql):
     ladder_reg     플레이어마다 한 줄: 자동/직접(auto)·자동 참가 끔(off)·연봉 상한 안(cap_ok)·연봉 배수(pay_x)·기기 표식(dev, 기기 번호의 해시 앞 16자)·직접 등록한 날(man_day)
     ladder_live    진행 중 리그(플레이어마다 하나): 단계·라운드·포스트시즌·팀 이름(상대 pid)·지금 순위. 라운드마다 덮어쓰고 결과가 오면 지운다
     ladder_leagues 끝난 리그 요약(결과와 같은 batch): 순위표·우승·준우승·정규 1위·이상 표시(flag: mismatch 결과 대조 불일치 · winrate 비정상 승률)
   개인 정보: 닉네임·덱 이름 말고 없다. 기기 번호는 기기에서 만든 무작위 값의 해시(이름·IP 아님), '같은 기기에서 여러 덱' 감지에만 쓴다(docs/privacy.md) */
import { UL_TIERS } from '../../src/core/uladder.mjs';
import { cupName, cupBadName } from '../../src/core/cup.mjs';
import { json, err, readJson, kstDay, qInt } from './http.js';
import { PID, sha256 } from './auth.js';
import { bumpStmt, _genReset, ensureMeta, RANK_ORDER } from './ladder.js';
import { ensureRec, recData } from './records.js';

export const AUTO_SQL = `-- 래더 v4(2026-11-18): 자동 등록·자동 참가 끄기·진행 중 리그·끝난 리그 요약(관리자 한눈 보기). 설계 docs/design/ladder-v4-2026-11-18.md
-- 서버가 처음 쓸 때 스스로 만들므로(같은 문장, IF NOT EXISTS) 꼭 돌릴 필요는 없다. 미리 넣으려면 D1 콘솔에 붙여 넣거나, 관리자 POST /api/v1/admin/migrate, wrangler d1 migrations apply.
-- 같은 SQL이 worker/v1/ladauto.js AUTO_SQL에 있다(점검 tools/test/ladder-auto.test.cjs가 같은지 본다).
CREATE TABLE IF NOT EXISTS ladder_reg (
  player_id TEXT PRIMARY KEY,
  auto INTEGER NOT NULL DEFAULT 0,
  off INTEGER NOT NULL DEFAULT 0,
  cap_ok INTEGER NOT NULL DEFAULT 1,
  pay_x REAL,
  dev TEXT,
  man_day TEXT,
  created INTEGER NOT NULL,
  at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS reg_dev ON ladder_reg (dev);
CREATE TABLE IF NOT EXISTS ladder_live (
  player_id TEXT PRIMARY KEY,
  lkey TEXT NOT NULL,
  tier INTEGER NOT NULL,
  round INTEGER NOT NULL DEFAULT 0,
  post INTEGER NOT NULL DEFAULT 0,
  teams TEXT NOT NULL DEFAULT '[]',
  st TEXT NOT NULL DEFAULT '[]',
  started INTEGER NOT NULL,
  at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS live_at ON ladder_live (at);
CREATE TABLE IF NOT EXISTS ladder_leagues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  lkey TEXT NOT NULL,
  season INTEGER NOT NULL,
  tier INTEGER NOT NULL,
  rank INTEGER NOT NULL,
  teams INTEGER NOT NULL DEFAULT 10,
  w INTEGER NOT NULL DEFAULT 0,
  l INTEGER NOT NULL DEFAULT 0,
  d INTEGER NOT NULL DEFAULT 0,
  ps TEXT NOT NULL DEFAULT '',
  champ TEXT,
  runner TEXT,
  top TEXT,
  st TEXT NOT NULL DEFAULT '[]',
  flag TEXT NOT NULL DEFAULT '',
  at INTEGER NOT NULL,
  UNIQUE (player_id, lkey)
);
CREATE INDEX IF NOT EXISTS leagues_at ON ladder_leagues (at);
`;
export const LIVE_SQL = `-- 래더 진행 보고(검수 1019~1020): 종료한 리그의 늦은 보고를 막고, 보고된 포스트시즌 단계만 보관합니다.
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
`;
export const autoStatements = () => (AUTO_SQL + LIVE_SQL).split('\n').filter(l => !/^\s*--/.test(l)).join('\n').split(';').map(x => x.trim()).filter(Boolean);
let autoOk = false; export function _autoReset() { autoOk = false; }
export async function ensureAuto(db) { if (autoOk) return true; try { await db.batch(autoStatements().map(q => db.prepare(q))); autoOk = true; } catch (e) { autoOk = false; } return autoOk; }

export const LIVE_SEC = 3 * 86400e3, LIVE_MAX = 4 * 1024, ST_MAX = 20;
const TOP = UL_TIERS.length - 1;
const int = (x, lo, hi) => { const n = Math.floor(+x); return Number.isFinite(n) && n >= lo && n <= hi ? n : null; };
const nm = s => { const x = cupName(s); return x && !cupBadName(x) ? x : '?'; };
const live = 'EXISTS (SELECT 1 FROM players WHERE id = ?)';
/* 기기 번호(기기에서 만든 무작위 16~64자 16진수) → 해시 앞 16자. 형식이 아니면 null */
export async function devHash(d) { const s = String(d || ''); return /^[0-9a-f]{16,64}$/.test(s) ? (await sha256('dev|' + s)).slice(0, 16) : null; }
export async function regGet(db, pid) { if (!(await ensureAuto(db))) return null; return db.prepare('SELECT * FROM ladder_reg WHERE player_id = ?').bind(pid).first(); }
/* 덱 등록(putDeck)과 같은 batch에 넣는 줄. auto: 1 자동 · 0 직접 · null(맞추기: 지금 값 그대로). man: 직접 등록이면 그날 */
export function regStmt(db, pid, o, now) {
  const a = o.auto == null ? 0 : o.auto ? 1 : 0, keep = o.auto == null ? 1 : 0;
  return db.prepare(`INSERT INTO ladder_reg (player_id, auto, off, cap_ok, pay_x, dev, man_day, created, at) SELECT ?, ?, 0, ?, ?, ?, ?, ?, ? WHERE ${live} AND NOT EXISTS (SELECT 1 FROM ladder_reg WHERE player_id = ? AND off = 1)
    ON CONFLICT (player_id) DO UPDATE SET auto = CASE WHEN ? THEN auto ELSE excluded.auto END, cap_ok = excluded.cap_ok, pay_x = excluded.pay_x, dev = COALESCE(excluded.dev, dev), man_day = COALESCE(excluded.man_day, man_day), at = excluded.at`)
    .bind(pid, a, o.capOk ? 1 : 0, o.payX, o.dev, o.man ? kstDay(now) : null, now, now, pid, pid, keep);
}
/* 덱 등록 전 검사: {auto, man, dev, capOk, payX} 또는 {error: Response}. 연봉 상한은 없다(구단주 11-18) */
export async function regCheck(db, me, b, e, tier, had, now) {
  const auto = b.auto ? 1 : b.man ? 0 : null, man = b.man ? 1 : 0, reg = await regGet(db, me.id);
  if (reg && reg.off) return { error: err(409, 'auto_off') };
  if (man && had && reg && reg.man_day === kstDay(now)) return { error: err(429, 'reg_wait', {at:now,man_day:reg.man_day}) };
  return { auto, man, dev: await devHash(b.dev), capOk: 1, payX: null }; /* 래더 상한 없음(구단주 11-18): cap_ok·pay_x 열은 남기되 1·null로만 적는다 */
}
/* PUT /ladder/auto {on}: 끄면 서버 덱(덱·구성 요약·진행 중 리그)을 지우고 off=1. 켜면 off=0(덱은 다음 자동 갱신 때 다시 올라온다) */
export async function autoSet(req, db, me, now) {
  const { body: b, error } = await readJson(req, 1024); if (error) return err(400, error);
  if (!(await ensureAuto(db))) return err(503, 'schema_missing');
  const on = !!b.on, meta = await ensureMeta(db);
  const st = [db.prepare(`INSERT INTO ladder_reg (player_id, auto, off, cap_ok, created, at) SELECT ?, 0, ?, 1, ?, ? WHERE ${live} ON CONFLICT (player_id) DO UPDATE SET off = excluded.off, at = excluded.at`).bind(me.id, on ? 0 : 1, now, now, me.id)];
  if (!on) st.push(db.prepare('DELETE FROM decks WHERE player_id = ?').bind(me.id), ...(meta ? [db.prepare('DELETE FROM deck_meta WHERE player_id = ?').bind(me.id)] : []), db.prepare('DELETE FROM ladder_live WHERE player_id = ?').bind(me.id), bumpStmt(db));
  await db.batch(st); if (!on) _genReset();
  return json(200, { ok: true, on, deck: on ? undefined : null });
}
/* 순위 줄 [이름, 승, 패, 무, 종류('me'|'user'|'cup'|'ai')] 정리(최대 20줄) */
function stParse(x) {
  const out = []; for (const r of Array.isArray(x) ? x.slice(0, ST_MAX) : []) {
    if (!Array.isArray(r)) continue; const w = int(r[1] ?? 0, 0, 99), l = int(r[2] ?? 0, 0, 99), d = int(r[3] ?? 0, 0, 99); if (w == null || l == null || d == null) continue;
    out.push([nm(r[0]), w, l, d, ['me', 'user', 'cup', 'ai'].includes(r[4]) ? r[4] : 'user']);
  }
  return out;
}
/* 진행 보고는 인증된 플레이어·리그 키에 귀속합니다. 종료 표는 같은 키의 늦은 보고만 막습니다.
   자동 참가 끄기는 일시 중단이므로 종료 표를 만들지 않습니다. 구형 보고에는 단계를 추측해 붙이지 않습니다. */
const LIVE_STAGES = ['regular', 'regular-done', 'semi-ready', 'semi-one-done', 'final-ready', 'complete'];
function livePhase(b, post) {
  if (b.stage == null && b.postDone == null && b.postTotal == null) return { stage: '', done: null, total: null };
  const done = int(b.postDone, 0, 3), total = int(b.postTotal, 3, 3), stage = String(b.stage || '');
  const expected = post ? ['semi-ready', 'semi-one-done', 'final-ready', 'complete'][done] : stage === 'regular-done' ? 'regular-done' : 'regular';
  return done == null || total == null || !LIVE_STAGES.includes(stage) || stage !== expected || (!post && done !== 0) ? null : { stage, done, total };
}
export async function livePut(req, db, me, now) {
  const { body: b, error } = await readJson(req, LIVE_MAX); if (error) return err(error === 'too_large' ? 413 : 400, error);
  const key = String(b.key || ''); if (!/^[\w.:-]{4,64}$/.test(key)) return err(400, 'bad_result');
  if (!(await ensureAuto(db))) return err(503, 'schema_missing');
  if (b.ended === 1 || b.ended === true) {
    await db.batch([db.prepare(`INSERT INTO ladder_live_state (player_id, lkey, ended, opened, at) SELECT ?, ?, 1, ?, ? WHERE ${live}
      ON CONFLICT (player_id, lkey) DO UPDATE SET ended = 1, at = excluded.at`).bind(me.id, key, 0, now, me.id),
      db.prepare('DELETE FROM ladder_live WHERE player_id = ? AND lkey = ?').bind(me.id, key)]);
    return json(200, { ok: true, ended: true });
  }
  const tier = int(b.tier, 0, TOP), round = int(b.round ?? 0, 0, 99), post = b.post ? 1 : 0, phase = livePhase(b, post);
  const revision = b.revision == null ? now * 1024 : int(b.revision, 0, Math.min(Number.MAX_SAFE_INTEGER, (now + 300e3) * 1024)), opened = b.opened == null ? now : int(b.opened, 1, now + 300e3);
  if (tier == null || round == null || !Array.isArray(b.teams) || !phase || revision == null || opened == null) return err(400, 'bad_result');
  const teams = b.teams.slice(0, ST_MAX).filter(Array.isArray).map(t => [nm(t[0]), PID.test(String(t[1] || '')) ? String(t[1]) : null, ['me', 'user', 'cup', 'ai'].includes(t[2]) ? t[2] : 'user']);
  const reg = await regGet(db, me.id); if (reg && reg.off) return err(409, 'auto_off');
  const progress = round * 4 + (post ? (phase.done || 0) + 1 : 0);
  await db.batch([db.prepare(`INSERT INTO ladder_live_state (player_id, lkey, stage, post_done, post_total, revision, progress, opened, at)
    SELECT ?, ?, ?, ?, ?, ?, ?, ?, ? WHERE ${live} AND NOT EXISTS (SELECT 1 FROM ladder_reg WHERE player_id = ? AND off = 1)
    ON CONFLICT (player_id, lkey) DO UPDATE SET stage = excluded.stage, post_done = excluded.post_done, post_total = excluded.post_total, revision = excluded.revision, progress = excluded.progress, at = excluded.at
    WHERE ended = 0 AND excluded.revision > revision AND excluded.progress >= progress`)
    .bind(me.id, key, phase.stage, phase.done, phase.total, revision, progress, opened, now, me.id, me.id),
    db.prepare(`INSERT INTO ladder_live (player_id, lkey, tier, round, post, teams, st, started, at)
      SELECT ?, ?, ?, ?, ?, ?, ?, ?, ? WHERE ${live}
      AND NOT EXISTS (SELECT 1 FROM ladder_reg WHERE player_id = ? AND off = 1)
      AND EXISTS (SELECT 1 FROM ladder_live_state WHERE player_id = ? AND lkey = ? AND ended = 0 AND revision = ?)
      AND NOT EXISTS (SELECT 1 FROM ladder_live_state WHERE player_id = ? AND revision > ?)
      ON CONFLICT (player_id) DO UPDATE SET started = CASE WHEN lkey = excluded.lkey THEN started ELSE excluded.started END, lkey = excluded.lkey, tier = excluded.tier, round = excluded.round, post = excluded.post, teams = excluded.teams, st = excluded.st, at = excluded.at`)
      .bind(me.id, key, tier, round, post, JSON.stringify(teams), JSON.stringify(stParse(b.st)), opened, now, me.id, me.id, me.id, key, revision, me.id, revision)]);
  return json(200, { ok: true });
}
/* 결과 대조(§10 이상 감지): mismatch = 보낸 순위표와 결과 줄(순위·승패무)이 다르거나, 승 합 ≠ 패 합, 10팀인데 경기 수가 27이 아니거나, 4위 밖 우승.
   winrate = 20경기 넘게 1패 이하(예: 27전 27승) */
export function leagueFlags(o) {
  const { rank, teams, w, l, d, ps, st } = o, F = [];
  if (st.length) {
    const mi = st.findIndex(r => r[4] === 'me'), m = st[mi], sw = st.reduce((a, r) => a + r[1], 0), sl = st.reduce((a, r) => a + r[2], 0);
    if (st.length !== teams || mi < 0 || mi + 1 !== rank || m[1] !== w || m[2] !== l || m[3] !== d || sw !== sl) F.push('mismatch');
  }
  if (!F.length && ((teams === 10 && w + l + d !== 27) || (ps === 'c' && rank > 4))) F.push('mismatch');
  if (w + l + d >= 20 && l <= 1) F.push('winrate');
  return F.join(',');
}
/* 결과(postResult)와 같은 batch: 끝난 리그 요약 한 줄 + 진행 중 줄 지우기 */
export function leagueStmts(db, o) {
  const st = stParse(o.st), champ = o.champ ? nm(o.champ) : null, runner = o.runner ? nm(o.runner) : null, top = st.length ? st[0][0] : null;
  const flag = leagueFlags({ rank: o.rank, teams: o.teams, w: o.w, l: o.l, d: o.d, ps: o.ps, st });
  return [db.prepare(`INSERT INTO ladder_leagues (player_id, lkey, season, tier, rank, teams, w, l, d, ps, champ, runner, top, st, flag, at) SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? WHERE ${live}`)
    .bind(o.pid, o.key, o.season, o.tier, o.rank, o.teams, o.w, o.l, o.d, o.ps || '', champ, runner, top, JSON.stringify(st), flag, o.now, o.pid),
  db.prepare(`INSERT INTO ladder_live_state (player_id, lkey, ended, stage, opened, at) SELECT ?, ?, 1, 'complete', ?, ? WHERE ${live} ON CONFLICT (player_id, lkey) DO UPDATE SET ended = 1, stage = 'complete', at = excluded.at`).bind(o.pid, o.key, 0, o.now, o.pid),
  db.prepare('DELETE FROM ladder_live WHERE player_id = ? AND lkey = ?').bind(o.pid, o.key)];
}
export const autoDelete = (db, pid) => ['ladder_reg', 'ladder_live', 'ladder_live_state', 'ladder_leagues'].map(t => db.prepare(`DELETE FROM ${t} WHERE player_id = ?`).bind(pid));

/* ===== 관리자 한눈 보기(§10) ===== */
const DAY = 86400e3, j = s => { try { return JSON.parse(s || '[]'); } catch (e) { return []; } };
const dayStart = now => Date.parse(kstDay(now) + 'T00:00:00+09:00');
/* 진행 중 리그(최근 3일 안에 소식이 온 것) */
async function liveRows(db, now) { return ((await db.prepare('SELECT l.player_id AS pid, p.nickname, p.hidden, l.lkey, l.tier, l.round, l.post, s.stage, s.post_done, s.post_total, l.teams, l.st, l.started, l.at FROM ladder_live l LEFT JOIN ladder_live_state s ON s.player_id = l.player_id AND s.lkey = l.lkey LEFT JOIN players p ON p.id = l.player_id WHERE l.at >= ? ORDER BY l.at DESC LIMIT 200').bind(now - LIVE_SEC).all()).results || []).map(x => Object.assign(x, { teams: j(x.teams), st: j(x.st) })); }
/* 덱마다 나가 있는 진행 중 리그 수(주인 리그 + 상대로 들어간 리그) */
const activeBy = L => { const m = new Map(); for (const x of L) { const s = new Set([x.pid, ...x.teams.map(t => t[1]).filter(Boolean)]); for (const p of s) m.set(p, (m.get(p) || 0) + 1); } return m; };
export async function adminDash(db, now, s) {
  await ensureAuto(db); const t0 = dayStart(now), cnt = async (q, ...a) => ((await db.prepare(q).bind(...a).first()) || { n: 0 }).n || 0;
  const tr = (await db.prepare('SELECT d.tier, SUM(CASE WHEN r.auto = 1 THEN 1 ELSE 0 END) AS auto, SUM(CASE WHEN r.auto = 1 THEN 0 ELSE 1 END) AS manual, COUNT(*) AS n FROM decks d LEFT JOIN ladder_reg r ON r.player_id = d.player_id GROUP BY d.tier').all()).results || [];
  const tiers = UL_TIERS.map((name, t) => { const x = tr.find(y => y.tier === t) || {}; return { tier: t, name, n: x.n || 0, auto: x.auto || 0, manual: x.manual || 0 }; });
  const reg = { tiers, total: tiers.reduce((a, x) => a + x.n, 0), auto: tiers.reduce((a, x) => a + x.auto, 0), manual: tiers.reduce((a, x) => a + x.manual, 0),
    new_today: await cnt('SELECT COUNT(*) AS n FROM decks WHERE created >= ?', t0), new_7d: await cnt('SELECT COUNT(*) AS n FROM decks WHERE created >= ?', t0 - 6 * DAY), off: await cnt('SELECT COUNT(*) AS n FROM ladder_reg WHERE off = 1') };
  const L = await liveRows(db, now);
  const live = L.slice(0, 40).map(x => ({ pid: x.pid, nickname: x.nickname, hidden: x.hidden, key: x.lkey, tier: x.tier, round: x.round, post: x.post, stage: x.stage || null, postDone: x.post_done, postTotal: x.post_total, decks: x.teams.length, users: x.teams.filter(t => t[2] === 'user').length, at: x.at, started: x.started }));
  const recent = (await db.prepare('SELECT g.id, g.player_id AS pid, p.nickname, g.lkey, g.season, g.tier, g.rank, g.teams, g.w, g.l, g.d, g.ps, g.champ, g.runner, g.top, g.flag, g.at FROM ladder_leagues g LEFT JOIN players p ON p.id = g.player_id ORDER BY g.id DESC LIMIT 20').all()).results || [];
  const br = (await db.prepare(`SELECT pid, nickname, team, tier, points, leagues, wins, rn FROM (SELECT e.player_id AS pid, p.nickname, d.name AS team, e.tier, e.points, e.leagues, e.wins, ROW_NUMBER() OVER (PARTITION BY e.tier ORDER BY ${RANK_ORDER}) AS rn FROM ladder_entries e JOIN players p ON p.id = e.player_id LEFT JOIN decks d ON d.player_id = e.player_id WHERE e.season = ? AND p.hidden = 0 AND e.leagues > 0) WHERE rn <= 10 ORDER BY tier DESC, rn`).bind(s.id).all()).results || [];
  const board = UL_TIERS.map((name, t) => ({ tier: t, name, rows: br.filter(x => x.tier === t).map(x => ({ rank: x.rn, pid: x.pid, nickname: x.nickname, team: x.team, points: x.points, leagues: x.leagues, wins: x.wins })) })).reverse();
  let leaders = {}; if (await ensureRec(db)) { try { const R = await recData(db, s.id, true, null); for (const k of ['hr', 'avg', 'ops', 'rbi', 'sb', 'era', 'so', 'sv', 'w']) leaders[k] = (R.boards[k] || [])[0] || null; leaders.titles = (R.boards.titles || [])[0] || null; } catch (e) { leaders = {}; } }
  const results = (await db.prepare("SELECT g.id, g.player_id AS pid, p.nickname, g.tier, g.rank, g.w, g.l, g.d, g.ps, g.flag, g.at FROM ladder_leagues g LEFT JOIN players p ON p.id = g.player_id WHERE g.flag != '' ORDER BY g.id DESC LIMIT 20").all()).results || [];
  const winrate = (await db.prepare('SELECT r.player_id AS pid, p.nickname, COUNT(*) AS leagues, SUM(r.w) AS w, SUM(r.l) AS l, SUM(r.d) AS d FROM league_results r JOIN players p ON p.id = r.player_id WHERE r.season = ? GROUP BY r.player_id HAVING COUNT(*) >= 2 AND SUM(r.w) >= 9 * (SUM(r.l) + 1) ORDER BY SUM(r.w) DESC LIMIT 20').bind(s.id).all()).results || [];
  const dv = (await db.prepare('SELECT r.dev, COUNT(*) AS n, GROUP_CONCAT(p.nickname, \' · \') AS nicks FROM ladder_reg r JOIN players p ON p.id = r.player_id JOIN decks d ON d.player_id = r.player_id WHERE r.dev IS NOT NULL GROUP BY r.dev HAVING COUNT(*) > 1 ORDER BY n DESC LIMIT 20').all()).results || [];
  return json(200, { ok: true, at: now, season: { id: s.id, starts: s.starts, ends: s.ends, days_left: Math.max(0, Math.ceil((s.ends - now) / DAY)) }, reg, live, recent, board, leaders,
    flags: { results, winrate, dev: dv.map(x => ({ dev: String(x.dev).slice(0, 6), n: x.n, nicks: x.nicks })) } });
}
/* 덱 목록: ?q=(닉네임·덱 이름·pid) &tier= &n=(최대 200) */
export async function adminDecks(url, db, now) {
  await ensureAuto(db); const q = String(url.searchParams.get('q') || '').trim().slice(0, 20).replace(/[%_]/g, ''), tq = url.searchParams.get('tier'), tier = tq == null || tq === '' || tq === 'all' ? null : qInt(tq, 0, 0, TOP), n = qInt(url.searchParams.get('n'), 80, 1, 200);
  const W = [], A = []; if (q) { W.push('(p.nickname LIKE ? OR d.name LIKE ? OR d.player_id = ?)'); A.push('%' + q + '%', '%' + q + '%', q); } if (tier != null) { W.push('d.tier = ?'); A.push(tier); }
  const where = W.length ? ' WHERE ' + W.join(' AND ') : '';
  const total = ((await db.prepare('SELECT COUNT(*) AS n FROM decks d JOIN players p ON p.id = d.player_id' + where).bind(...A).first()) || { n: 0 }).n;
  const rows = (await db.prepare('SELECT d.player_id AS pid, p.nickname, p.hidden, p.platform, d.name, d.tier, d.ovr, d.created, d.at, r.auto FROM decks d JOIN players p ON p.id = d.player_id LEFT JOIN ladder_reg r ON r.player_id = d.player_id' + where + ' ORDER BY d.at DESC LIMIT ?').bind(...A, n).all()).results || [];
  const act = activeBy(await liveRows(db, now));
  return json(200, { ok: true, total, returned: rows.length, decks: rows.map(x => Object.assign(x, { auto: x.auto ? 1 : 0, active: act.get(x.pid) || 0 })) });
}
/* 리그 들여다보기: ?id=(끝난 리그) 순위표·팀 기록·선수 줄 | ?live=PID 진행 중 리그 순위·팀 */
export async function adminLeague(url, db) {
  await ensureAuto(db); const lp = String(url.searchParams.get('live') || '');
  if (lp) { if (!PID.test(lp)) return err(400, 'bad_json'); const x = await db.prepare('SELECT l.*, p.nickname, s.stage, s.post_done, s.post_total FROM ladder_live l LEFT JOIN ladder_live_state s ON s.player_id = l.player_id AND s.lkey = l.lkey LEFT JOIN players p ON p.id = l.player_id WHERE l.player_id = ?').bind(lp).first(); if (!x) return err(404, 'not_found');
    return json(200, { ok: true, live: true, league: { pid: x.player_id, nickname: x.nickname, key: x.lkey, tier: x.tier, round: x.round, post: x.post, stage: x.stage || null, postDone: x.post_done, postTotal: x.post_total, teams: j(x.teams), st: j(x.st), started: x.started, at: x.at } }); }
  const id = qInt(url.searchParams.get('id'), null, 1, 9e15); if (id == null) return err(400, 'bad_json');
  const g = await db.prepare('SELECT g.*, p.nickname FROM ladder_leagues g LEFT JOIN players p ON p.id = g.player_id WHERE g.id = ?').bind(id).first(); if (!g) return err(404, 'not_found');
  let team = null, lines = []; if (await ensureRec(db)) { team = await db.prepare('SELECT team, rank, w, l, d, rs, ra, hr, ps FROM ladder_teams WHERE player_id = ? AND lkey = ?').bind(g.player_id, g.lkey).first(); lines = (await db.prepare('SELECT kind, name, g, pa, ab, h, tb, hr, rbi, sb, ob, sf, outs, er, so, sv, w, wh FROM ladder_lines WHERE player_id = ? AND lkey = ? ORDER BY kind, id').bind(g.player_id, g.lkey).all()).results || []; }
  return json(200, { ok: true, league: { id: g.id, pid: g.player_id, nickname: g.nickname, key: g.lkey, season: g.season, tier: g.tier, rank: g.rank, teams: g.teams, w: g.w, l: g.l, d: g.d, ps: g.ps, champ: g.champ, runner: g.runner, top: g.top, st: j(g.st), flag: g.flag, at: g.at }, team, lines });
}
