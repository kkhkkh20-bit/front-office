/* v1 관리자(Authorization: Bearer CUP_ADMIN): 래더 현황 집계·플레이어 찾기·숨김·삭제·시즌 끊기·표 만들기.
   집계는 하루 단위 daily_stats(쓸 때마다 몇 줄 더하기) + 가벼운 D1 쿼리. 관리자 화면: src/ui/cup/03_ladder_admin.js */
import { UL_TIERS } from '../../src/core/uladder.mjs';
import { json, err, readJson, kstDay, qInt } from './http.js';
import { PID, PLATFORMS } from './auth.js';
import { currentSeason, rollSeason } from './season.js';
import { statStmts, takeUsage } from './usage.js';
import { SCHEMA_VERSION, schemaStatements } from './schema.js';
import { cloudStatements, cloudStats, deleteCloud } from './cloud.js';
import { ensureRec, recDelete, recStatements } from './records.js';
import { ensureMeta, META_SQL, RANK_ORDER, bumpCache, bumpStmt, GEN_SEC, _genReset } from './ladder.js';
import { ensureAuto, autoDelete, autoStatements, adminDash, adminDecks, adminLeague } from './ladauto.js';

/* 무료 한도(2026-11 Cloudflare 문서 기준. 바뀔 수 있다) */
export const FREE = Object.freeze({ d1_r: 5e6, d1_w: 1e5, kv_w: 1000, req: 1e5 });
export const PAID_MONTH = Object.freeze({ d1_r: 25e9, d1_w: 5e7, kv_w: 1e6, req: 1e7 });
const DAY = 86400e3;
const KEYS = ['active', 'players_new', 'decks_new', 'decks_upd', 'leagues', 'promos', 'demos', 'd1_r', 'd1_w', 'kv_w'];

export async function stats(db, now, env) {
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
  const top = (await db.prepare('SELECT e.player_id AS pid, p.nickname, p.hidden, e.tier, e.points, e.leagues, e.wins FROM ladder_entries e JOIN players p ON p.id = e.player_id WHERE e.season = ? AND e.leagues > 0 ORDER BY e.tier DESC, ' + RANK_ORDER + ' LIMIT 10').bind(s.id).all()).results || [];
  const feed = (await db.prepare("SELECT e.kind, e.player_id AS pid, e.nickname, e.tier_from, e.tier_to, e.at, p.hidden FROM events e LEFT JOIN players p ON p.id = e.player_id ORDER BY e.id DESC LIMIT 10").all()).results || [];
  const decks = (await db.prepare('SELECT d.player_id AS pid, p.nickname, p.hidden, p.platform, d.name, d.year, d.ovr, d.tier, d.created, d.at FROM decks d JOIN players p ON p.id = d.player_id ORDER BY d.at DESC LIMIT 20').all()).results || [];
  const totals = { players: await cnt('SELECT COUNT(*) AS n FROM players'), decks: await cnt('SELECT COUNT(*) AS n FROM decks'), hidden: await cnt('SELECT COUNT(*) AS n FROM players WHERE hidden = 1') };
  const today = by[days[days.length - 1]];
  const usage = { day: days[days.length - 1], d1_r: today.d1_r || 0, d1_w: today.d1_w || 0, kv_w: today.kv_w || 0, free: FREE, pct: { d1_r: pct(today.d1_r, FREE.d1_r), d1_w: pct(today.d1_w, FREE.d1_w), kv_w: pct(today.kv_w, FREE.kv_w) }, note: '이 서버 인스턴스가 센 추정치입니다. 정확한 값은 Cloudflare 대시보드 › D1 › 측정항목.' };
  const cloud = await cloudStats(env, db, now); /* 클라우드 저장: 슬롯 수·용량·오늘 올리기(본문은 읽지 않는다) */
  return json(200, { ok: true, source: 'd1', at: now, season: s, windows, tiers, hours, platforms, trend, top, feed, decks, totals, usage, cloud, cache: CACHE_NOTE });
}
const pct = (v, max) => Math.round((v || 0) / max * 1000) / 10;
/* 숨김·삭제 뒤 공개 화면에 남는 시간(srv2 #62). 관리자 화면이 그대로 보여 준다 */
export const CACHE_NOTE = Object.freeze({ gen_sec: GEN_SEC, text: `순위표·소식·덱 구성은 바로 새로 고칩니다. 다른 서버 인스턴스에는 최대 ${GEN_SEC}초 늦게 반영될 수 있습니다. 상대 목록·맞대결은 바로 빠집니다.` });
/* CSV 내보내기 범위(srv2 #52): from·to = ms 또는 'YYYY-MM-DD'(한국시간 그날 하루, to는 그날 끝까지) */
const dayMs = d => Date.parse(d + 'T00:00:00+09:00');
function range(url) {
  const f = url.searchParams.get('from'), t = url.searchParams.get('to'), D = /^\d{4}-\d{2}-\d{2}$/;
  const from = f == null || f === '' ? null : D.test(f) ? dayMs(f) : qInt(f, null, 0, 9e15);
  const to = t == null || t === '' ? null : D.test(t) ? dayMs(t) + 86400e3 - 1 : qInt(t, null, 0, 9e15);
  return { from: Number.isFinite(from) ? from : null, to: Number.isFinite(to) ? to : null };
}
export const EXPORT_MAX = 2000;
/* 덱(최근 갱신 순, 커서 'at.pid')·리그 결과(최근 순, 커서 id). n+1개를 읽어 다음 장이 있는지 본다. total은 같은 범위의 전체 수 */
async function exportRows(url, db) {
  const kind = url.searchParams.get('kind') === 'results' ? 'results' : 'decks', n = qInt(url.searchParams.get('n'), EXPORT_MAX, 1, EXPORT_MAX), cur = String(url.searchParams.get('cursor') || '');
  const { from, to } = range(url), col = kind === 'decks' ? 'd.at' : 'r.at', W = [], A = [];
  if (from != null) { W.push(col + ' >= ?'); A.push(from); } if (to != null) { W.push(col + ' <= ?'); A.push(to); }
  const where = L => L.length ? ' WHERE ' + L.join(' AND ') : '';
  const PW = W.slice(), PA = A.slice();
  if (kind === 'decks') {
    await ensureMeta(db);
    const m = cur.match(/^(\d+)\.(p[0-9a-f]{16})$/); if (m) { PW.push('(d.at < ? OR (d.at = ? AND d.player_id < ?))'); PA.push(+m[1], +m[1], m[2]); }
    const total = ((await db.prepare('SELECT COUNT(*) AS n FROM decks d' + where(W)).bind(...A).first()) || { n: 0 }).n;
    const r = await db.prepare('SELECT d.player_id AS pid, p.nickname, p.platform, p.hidden, d.name, d.year, d.ovr, d.ovr_json, d.tier, d.bytes, d.created, d.at, m.sum FROM decks d JOIN players p ON p.id = d.player_id LEFT JOIN deck_meta m ON m.player_id = d.player_id' + where(PW) + ' ORDER BY d.at DESC, d.player_id DESC LIMIT ?').bind(...PA, n + 1).all();
    const all = r.results || [], more = all.length > n, rows = all.slice(0, n), last = rows[rows.length - 1];
    return { kind, total, returned: rows.length, truncated: more, next: more && last ? last.at + '.' + last.pid : null, rows: rows.map(x => { let mm = null, o = null; try { mm = x.sum ? JSON.parse(x.sum) : null; o = x.ovr_json ? JSON.parse(x.ovr_json) : null; } catch (e) {} delete x.sum; delete x.ovr_json; return Object.assign(x, { ovr_p: o ? o.p : null, ovr_b: o ? o.b : null, meta: mm }); }) };
  }
  const c = qInt(cur, null, 1, 9e15); if (c != null) { PW.push('r.id < ?'); PA.push(c); }
  const total = ((await db.prepare('SELECT COUNT(*) AS n FROM league_results r' + where(W)).bind(...A).first()) || { n: 0 }).n;
  const r = await db.prepare('SELECT r.id, r.player_id AS pid, p.nickname, r.season, r.lkey, r.tier, r.to_tier, r.rank, r.teams, r.w, r.l, r.d, r.delta, r.at FROM league_results r LEFT JOIN players p ON p.id = r.player_id' + where(PW) + ' ORDER BY r.id DESC LIMIT ?').bind(...PA, n + 1).all();
  const all = r.results || [], more = all.length > n, rows = all.slice(0, n);
  return { kind, total, returned: rows.length, truncated: more, next: more && rows.length ? String(rows[rows.length - 1].id) : null, rows };
}

export async function handleAdmin(rest, req, url, db, now, env) {
  if (rest === 'stats' && req.method === 'GET') return stats(db, now, env);
  /* 래더 v4 관리자 한눈 보기(구단주 11-18 §10): 등록 현황·리그 상황·시즌 판·이상 감지 | 덱 목록(검색·단계) | 리그 들여다보기 */
  if (rest === 'dash' && req.method === 'GET') return adminDash(db, now, await currentSeason(db, now));
  if (rest === 'decks' && req.method === 'GET') return adminDecks(url, db, now);
  if (rest === 'league' && req.method === 'GET') return adminLeague(url, db);
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
    await bumpCache(db); /* 공개 캐시 새로(srv2 #62) */
    return json(200, { ok: true, pid: b.pid, hide: b.hide ? 1 : 0, cache: CACHE_NOTE });
  }
  const dm = rest.match(/^player\/(p[0-9a-f]{16})$/);
  if (dm && req.method === 'DELETE') { await deletePlayer(db, dm[1], env); return json(200, { ok: true, cache: CACHE_NOTE }); }
  const dd = rest.match(/^deck\/(p[0-9a-f]{16})$/);
  if (dd && req.method === 'DELETE') { await deleteDeck(db, dd[1]); return json(200, { ok: true, cache: CACHE_NOTE }); }
  /* CSV 내보내기용 줄(래더 v2, 사용자 11-17; srv2 #52 페이지): ?kind=decks|results&n=(최대 2000)&cursor=&from=&to= → {rows, total, returned, truncated, next}. 화면이 CSV로 바꾼다 */
  if (rest === 'export' && req.method === 'GET') return json(200, Object.assign({ ok: true }, await exportRows(url, db)));
  if (rest === 'season/roll' && req.method === 'POST') { const s = await currentSeason(db, now); const n = await rollSeason(db, s, now, true); return json(200, { ok: true, closed: s.id, season: n }); }
  return err(404, 'not_found');
}
/* 플레이어와 그 기록 전부 지우기(본인 요청 DELETE /player, 관리자 삭제). 다른 사람 h2h에 남은 상대 기록도 지운다.
   한 batch(트랜잭션)라 동시에 온 결과·덱 등록과 섞여도 반쯤 지워진 상태가 없다(그쪽 쓰기는 플레이어가 있을 때만 들어간다: srv2 #61). 공개 캐시 세대도 올린다 */
export async function deletePlayer(db, pid, env) {
  await deleteCloud(env, db, pid); /* 클라우드 저장: R2 본문과 cloud_* 줄(먼저: 실패하면 플레이어도 남아 다시 지울 수 있다) */
  const meta = await ensureMeta(db), rec = await ensureRec(db), au = await ensureAuto(db); /* 기록실 줄·자동 등록 줄도 지운다(사용자 11-18) */
  await db.batch((meta ? [db.prepare('DELETE FROM deck_meta WHERE player_id = ?').bind(pid)] : []).concat(rec ? recDelete(db, pid) : [], au ? autoDelete(db, pid) : [])
    .concat(['devices', 'identities', 'decks', 'ladder_entries', 'league_results', 'events'].map(t => db.prepare(`DELETE FROM ${t} WHERE player_id = ?`).bind(pid)))
    .concat([db.prepare('DELETE FROM h2h WHERE player_id = ? OR opp_id = ?').bind(pid, pid), db.prepare('DELETE FROM players WHERE id = ?').bind(pid), bumpStmt(db)]));
  _genReset();
}
/* 덱만 지우기(관리자·본인): 덱 요약도 같이 */
export async function deleteDeck(db, pid) {
  const meta = await ensureMeta(db), au = await ensureAuto(db);
  await db.batch([db.prepare('DELETE FROM decks WHERE player_id = ?').bind(pid), ...(meta ? [db.prepare('DELETE FROM deck_meta WHERE player_id = ?').bind(pid)] : []), ...(au ? [db.prepare('DELETE FROM ladder_live WHERE player_id = ?').bind(pid)] : []), bumpStmt(db)]);
  _genReset();
}
/* 표 만들기: 같은 SQL을 문장별로(여러 번 해도 안전) */
export async function migrate(db) {
  const L = schemaStatements().concat([META_SQL], cloudStatements(), recStatements(), autoStatements()); /* ladder_reg·ladder_live·ladder_leagues: migrations/0005_ladder_auto.sql(래더 v4) */ await db.batch(L.map(q => db.prepare(q))); /* ladder_lines·ladder_teams: migrations/0004_ladder_records.sql(래더 기록실) */ /* deck_meta: migrations/0002_deck_meta.sql(래더 v2), cloud_*: migrations/0003_cloud_saves.sql(클라우드 저장) */
  return json(200, { ok: true, schema: SCHEMA_VERSION, statements: L.length });
}
