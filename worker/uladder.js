/* 유저 래더 API. 기기 옮기기·프런트컵과 같은 KV(SAVE_KV). 규칙은 공용 모듈(src/core/uladder.mjs, cup.mjs) 그대로.
 * 경기는 모두 유저 기기에서 돈다. 서버는 덱과 단계만 보관한다.
 *   PUT    /api/ladder/deck             본문 {wid, tier, e(엔트리)} → 덱 등록·갱신(세계 id당 하나, 언제든 덮어쓰기). 사진은 빼고 저장(약 8KB)
 *                                       바뀐 것이 없으면(본문 해시·단계 같음) 아무것도 쓰지 않고 {same:true}. 세계 id당 하루 UL_REG_DAY번까지
 *   PUT    /api/ladder/tier             본문 {wid, tier} → 리그를 마친 뒤 단계만 바꾸기(같은 단계면 쓰지 않음)
 *   GET    /api/ladder/opp?wid=&tier=&ovr=&n=9  같은 단계에서 내 OVR과 가까운 덱 n개(나는 빼고) + 그 단계 평균 OVR. 리그를 시작할 때 한 번
 *   GET    /api/ladder/tiers            단계별 등록 덱 수(숨긴 덱 빼고) {counts:[루키…레전드]}
 *   GET    /api/ladder/me/WID           내 등록 상태
 *   DELETE /api/ladder/deck/WID         등록 지우기
 *   관리자(Authorization: Bearer CUP_ADMIN): GET /api/ladder/admin/list?q= · PUT /api/ladder/admin/hide {wid, hide} · DELETE /api/ladder/admin/deck/WID
 *     · GET /api/ladder/admin/usage(= /api/admin/usage) 오늘 쓰기 추정·단계별 덱 수
 * 보관: ulD:WID(덱 본문, 메타 {name, year, ovr, tier, h, bh, at, hide, dd, rn, tn})
 *       ulIdx(색인 한 키: {v, rb, T:[단계마다 [{wid,name,year,ovr,at}…] 최신순 UL_IDX_CAP개], wd, wn})
 *   색인은 상대 고르기·단계별 수에 쓰는 사본이다. 없거나 하루가 지나면 ulD: 목록에서 다시 만든다(목록 1회/1000덱).
 *   wd/wn은 오늘(UTC, KV 한도가 초기화되는 기준) 래더가 한 KV 쓰기 수의 추정치다.
 *   옛 단계 색인 키(ulT:단계:WID)는 더 쓰지 않는다. 남아 있어도 읽지 않는다.
 * 서버 v1(worker/v1)이 쓰는 읽기 도우미(사용자 11-17): ladderKvPool(D1 덱이 모자랄 때 상대 채우기), ladderKvTier(옮겨 올 때 시작 단계 상한). 둘 다 KV에 쓰지 않는다. */
import { readText, byteLen } from './v1/http.js';
import { cupValidate, cupName, cupBadName, cupEntryHash } from '../src/core/cup.mjs';
import { deckGuard, guardStatus, GUARD_MSG } from './v1/guard.js';
import { UL_TIERS, ulPick, ulSlim, ulCap, ulCapGate } from '../src/core/uladder.mjs';
import { cached, cacheGet, cachePut, cacheBust, memLimited, utcDay, shortHash } from './kvcache.js';

export const UL_MAX_BYTES = 120 * 1024, UL_DECK_MAX = 40 * 1024;
export const UL_IDX_CAP = 500;          // 단계마다 색인에 두는 덱 수(오래된 등록부터 뺀다)
export const UL_REG_DAY = 20;           // 세계 id당 하루 덱 등록·갱신(실제로 바뀐 것만 센다)
export const UL_TIER_DAY = 40;          // 세계 id당 하루 단계 바꾸기
export const UL_IP_MAX = 60, UL_IP_WIN = 600e3; // 인스턴스 메모리: IP당 10분에 쓰기 요청 60번
export const UL_TTL = 60;               // 공개 GET 캐시(초)
export const UL_REBUILD_MS = 86400e3;   // 색인 다시 만들기 주기(놓친 갱신 바로잡기)
const IDX = 'ulIdx';
const WID = /^w[0-9a-f]{16}$/;
const MSG = { ...GUARD_MSG, bad_wid: '세계 id가 올바르지 않습니다.', bad_deck: '덱 형식이 아닙니다.', bad_name: '팀명에 쓸 수 없는 말이 들어 있습니다.', too_large: '덱이 너무 큽니다.', over_cap: '덱 연봉이 이 단계 상한을 넘습니다.', no_pay: '연봉 기록이 없는 덱입니다. 게임을 새로 고친 뒤 다시 등록해 주세요.', not_found: '등록한 덱이 없습니다.', auth: '관리자 인증이 필요합니다.', method: '지원하지 않는 요청입니다.', rate_limited: '오늘은 더 등록할 수 없습니다. 내일 다시 시도해 주세요. 이 기기 리그는 그대로 할 수 있습니다.' };
function json(status, body) { return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } }); }
const err = (s, e, x) => json(s, Object.assign({ error: e, message: MSG[e] || '' }, x || {}));
const tierOf = t => Math.max(0, Math.min(UL_TIERS.length - 1, (+t) | 0));
function admin(req, env) { const a = req.headers.get('Authorization') || ''; return !!env.CUP_ADMIN && a === 'Bearer ' + env.CUP_ADMIN; }
async function listAll(kv, prefix) { const out = []; let cursor; do { const r = await kv.list({ prefix, cursor }); cursor = r.list_complete ? null : r.cursor; for (const k of r.keys) out.push(k); } while (cursor); return out; }
/* 밖으로 내보내는 메타(예전과 같은 모양): 횟수 세기용 값은 뺀다 */
const pubMeta = m => { const o = Object.assign({}, m || {}); delete o.bh; delete o.dd; delete o.rn; delete o.tn; return o; };

/* ---- 색인 ---- */
const idxKey = url => url.origin + '/api/ladder/__idx';
const tiersKey = url => url.origin + '/api/ladder/tiers';
const entOf = (wid, m) => ({ wid, name: m.name, year: m.year, ovr: m.ovr, at: m.at });
function idxNorm(o) { if (!o || typeof o !== 'object' || !Array.isArray(o.T)) return null; const T = UL_TIERS.map((_, i) => Array.isArray(o.T[i]) ? o.T[i] : []); return { v: 1, rb: +o.rb || 0, T, wd: o.wd || '', wn: +o.wn || 0 }; }
function idxParse(t) { if (!t) return null; try { return idxNorm(JSON.parse(t)); } catch (e) { return null; } }
/* wid를 어느 단계에서든 빼고, ent가 있으면 tier 맨 앞(최신)에 넣는다. 바뀌었으면 true */
function idxSet(o, wid, ent, tier) {
  let was = null, wasT = -1;
  o.T.forEach((L, t) => { const i = L.findIndex(x => x.wid === wid); if (i >= 0) { was = L[i]; wasT = t; } });
  if (ent && was && wasT === tier && JSON.stringify(was) === JSON.stringify(ent)) return false;
  if (!ent && !was) return false;
  o.T = o.T.map(L => L.filter(x => x.wid !== wid));
  if (ent) { o.T[tier].unshift(ent); if (o.T[tier].length > UL_IDX_CAP) o.T[tier].length = UL_IDX_CAP; }
  return true;
}
function idxCount(o, now, n) { const d = utcDay(now); if (o.wd !== d) { o.wd = d; o.wn = 0; } o.wn += n; }
/* ulD: 목록(메타)에서 다시 만든다. 쓰기 1회 */
async function idxRebuild(kv, url, now, old) {
  const o = { v: 1, rb: now, T: UL_TIERS.map(() => []), wd: old ? old.wd : '', wn: old ? old.wn : 0 };
  for (const k of await listAll(kv, 'ulD:')) { const m = k.metadata; if (!m || m.hide) continue; const t = tierOf(m.tier); o.T[t].push(entOf(k.name.slice(4), m)); }
  for (const L of o.T) { L.sort((a, b) => (b.at || 0) - (a.at || 0)); if (L.length > UL_IDX_CAP) L.length = UL_IDX_CAP; }
  await idxSave(kv, url, now, o, 1);
  return o;
}
async function idxSave(kv, url, now, o, writes) {
  idxCount(o, now, writes); const t = JSON.stringify(o);
  await kv.put(IDX, t);
  await cachePut(kv, idxKey(url), { status: 200, body: t, headers: {} }, UL_TTL, now);
  await cacheBust(kv, [tiersKey(url)]);
}
/* 읽기용: 캐시 → KV. 쓰기 전(읽고 고쳐 쓰기)에는 fresh로 KV를 바로 읽는다 */
async function idxRead(kv, url, now, fresh) {
  if (!fresh) { const c = await cacheGet(kv, idxKey(url), now); const o = c && idxParse(c.body); if (o) return o; }
  const t = await kv.get(IDX); const o = idxParse(t);
  if (!o || now - o.rb > UL_REBUILD_MS) return idxRebuild(kv, url, now, o);
  if (!fresh) await cachePut(kv, idxKey(url), { status: 200, body: t, headers: {} }, UL_TTL, now);
  return o;
}
/* 덱 한 개의 색인을 맞춘다. extra = 같은 요청에서 색인 말고 쓴 KV 쓰기 수(오늘 쓰기 추정에 더한다) */
async function idxApply(kv, url, now, wid, meta, extra) {
  const o = await idxRead(kv, url, now, true);
  const ch = idxSet(o, wid, meta && !meta.hide ? entOf(wid, meta) : null, meta ? tierOf(meta.tier) : 0);
  if (ch || extra) await idxSave(kv, url, now, o, (extra || 0) + 1);
  return o;
}
export async function ladderUsage(env, url, now) {
  const kv = env.SAVE_KV, o = await idxRead(kv, url, now, true), d = utcDay(now);
  const counts = o.T.map(L => L.length);
  return { ok: true, day: d, writes: o.wd === d ? o.wn : 0, counts, decks: counts.reduce((a, b) => a + b, 0), cap: UL_IDX_CAP, rebuiltAt: o.rb,
    scope: 'ladder', limits: { free: { reads: 100000, writes: 1000, deletes: 1000, lists: 1000 } } };
}

/* 서버 v1 상대 채우기(사용자 11-17 "화면도 새 서버로 바로 전환해"): D1에 같은 단계 덱이 모자라는 동안 예전 KV 덱을 읽기만 해서 빈자리를 채운다.
   색인 읽기(캐시) + 고른 덱 본문 n개. 쓰기는 없다(색인이 하루 지나 다시 만들 때 1번 말고). since보다 오래된 등록·skip(나)·drop(이미 D1로 옮겨 온 세계 id)은 뺀다 */
export async function ladderKvPool(env, url, now, tier, ovr, n, o = {}) {
  const kv = env && env.SAVE_KV; if (!kv || n <= 0) return { count: 0, avg: 0, decks: [] };
  tier = tierOf(tier); const no = new Set(o.skip || []);
  const L = (await idxRead(kv, url, now, false)).T[tier].filter(x => !no.has(x.wid) && (x.at || 0) >= (o.since || 0));
  const avg = L.length ? L.reduce((a, x) => a + ((x.ovr && x.ovr.t) || 0), 0) / L.length : 0;
  let pick = ulPick(L, ovr, n * 3, []);
  if (o.drop && pick.length) { const d = await o.drop(pick.map(x => x.wid)); pick = pick.filter(x => !d.has(x.wid)); }
  const decks = [];
  for (const m of pick) { if (decks.length >= n) break; const r = await kv.getWithMetadata('ulD:' + m.wid); const mt = r.metadata;
    if (!r.value || (mt && (mt.hide || tierOf(mt.tier) !== tier))) continue;
    try { const e = JSON.parse(r.value); if (ulCapGate(e, tier, now).ok) decks.push({ wid: m.wid, name: m.name, year: m.year, ovr: m.ovr, at: m.at, e }); } catch (x) {} } /* 연봉 상한(사용자 11-17): 넘는 덱·유예 끝난 예전 덱은 뺀다 */
  return { count: L.length, avg: Math.round(avg * 10) / 10, decks };
}
/* 서버 v1 첫 덱의 시작 단계 상한(사용자 11-17): 같은 세계 id로 KV에 올린 덱이 있으면 그 단계까지, 없으면 루키. KV가 없는 배포면 null(상한 없음) */
export async function ladderKvTier(env, wid) {
  const kv = env && env.SAVE_KV; if (!kv) return null; if (!WID.test(String(wid || ''))) return 0;
  try { const m = (await kv.getWithMetadata('ulD:' + wid)).metadata; return m ? tierOf(m.tier) : 0; } catch (e) { return 0; }
}

export async function handleLadder(req, env, url, now) {
  const kv = env.SAVE_KV, rest = (url.pathname.replace(/\/+$/, '').match(/^\/api\/ladder(?:\/(.*))?$/) || [])[1] || '';
  const ip = req.headers.get('CF-Connecting-IP') || '';
  if (req.method !== 'GET' && ip && !rest.startsWith('admin/') && memLimited('ul:' + ip, UL_IP_MAX, UL_IP_WIN, now)) return err(429, 'rate_limited');
  if (rest.startsWith('admin/')) {
    if (!admin(req, env)) return err(401, 'auth');
    const sub = rest.slice(6);
    if (sub === 'usage' && req.method === 'GET') return json(200, await ladderUsage(env, url, now));
    if (sub === 'list' && req.method === 'GET') { const q = String(url.searchParams.get('q') || '').trim(); const L = (await listAll(kv, 'ulD:')).map(k => Object.assign({ wid: k.name.slice(4) }, pubMeta(k.metadata))).filter(x => !q || String(x.name || '').includes(q));
      return json(200, { ok: true, n: L.length, decks: L.sort((a, b) => (b.at || 0) - (a.at || 0)).slice(0, 300) }); }
    if (sub === 'hide' && req.method === 'PUT') { const b = JSON.parse(await req.text()); if (!b || !WID.test(String(b.wid || ''))) return err(400, 'bad_wid'); const r = await kv.getWithMetadata('ulD:' + b.wid); if (r.value == null) return err(404, 'not_found');
      const meta = Object.assign({}, r.metadata || {}), hide = b.hide ? 1 : 0;
      if ((meta.hide ? 1 : 0) !== hide) { meta.hide = hide; await kv.put('ulD:' + b.wid, r.value, { metadata: meta }); await idxApply(kv, url, now, b.wid, meta, 1); }
      else await idxApply(kv, url, now, b.wid, meta, 0);
      return json(200, { ok: true, hide }); }
    const dm = sub.match(/^deck\/(.+)$/); if (dm && req.method === 'DELETE') { const wid = decodeURIComponent(dm[1]); if (!WID.test(wid)) return err(400, 'bad_wid'); await kv.delete('ulD:' + wid); await idxApply(kv, url, now, wid, null, 0); return json(200, { ok: true }); }
    return err(405, 'method');
  }
  if (rest === 'deck' && req.method === 'PUT') {
    const len = +req.headers.get('Content-Length'); if (len > UL_MAX_BYTES) return err(413, 'too_large');
    const rt = await readText(req, UL_MAX_BYTES); if (rt.error) return err(413, 'too_large'); const t = rt.text; /* 바이트로 센다(srv2 #43) */
    let b; try { b = JSON.parse(t); } catch (x) { return err(400, 'bad_deck'); }
    if (!b || !WID.test(String(b.wid || ''))) return err(400, 'bad_wid');
    if (!b.e || cupBadName(b.e.name)) return err(400, b.e ? 'bad_name' : 'bad_deck');
    const e = ulSlim(b.e); e.name = cupName(e.name); const v = cupValidate(e, {}); if (!v.ok) return err(400, 'bad_deck', { errors: v.errors.map(x => x.msg) });
    { const an = deckGuard(e, b, 'kv', b.wid); if (an) return err(guardStatus(an), an.code, { errors: an.errors }); delete e.edited; } /* 편집 표시·이상치 거절(구단주 11-18 §8) */
    { const c = ulCap(e, tierOf(b.tier)); if (!c.known || !c.each) return err(400, 'no_pay', { errors: [MSG.no_pay] }); if (!c.ok) return err(400, 'over_cap', { errors: [ulCapGate(e, tierOf(b.tier), now).msg] }); } /* 연봉 상한(사용자 11-17): 화면과 같은 공용 규칙 */
    e.h = cupEntryHash(e); const body = JSON.stringify(e); if (byteLen(body) > UL_DECK_MAX) return err(413, 'too_large');
    const bh = await shortHash(body), prev = (await kv.getWithMetadata('ulD:' + b.wid)).metadata || null, tier = tierOf(b.tier), day = utcDay(now);
    /* 그대로면 쓰지 않는다(색인에서 빠져 있을 때만 색인을 채운다) */
    if (prev && prev.bh === bh && tierOf(prev.tier) === tier) {
      if (!prev.hide) await idxApply(kv, url, now, b.wid, prev, 0);
      return json(200, { ok: true, name: prev.name, ovr: prev.ovr, tier, bytes: body.length, same: true });
    }
    const today = prev && prev.dd === day, rn = today ? prev.rn | 0 : 0;
    if (rn >= UL_REG_DAY) return err(429, 'rate_limited');
    const meta = { name: e.name, year: e.year, ovr: e.ovr || null, tier, h: e.h, bh, at: now, hide: prev && prev.hide ? 1 : 0, dd: day, rn: rn + 1, tn: today ? prev.tn | 0 : 0 };
    await kv.put('ulD:' + b.wid, body, { metadata: meta }); await idxApply(kv, url, now, b.wid, meta, 1);
    return json(200, { ok: true, name: meta.name, ovr: meta.ovr, tier: meta.tier, bytes: body.length });
  }
  if (rest === 'tier' && req.method === 'PUT') { const b = JSON.parse(await req.text() || '{}'); if (!b || !WID.test(String(b.wid || ''))) return err(400, 'bad_wid');
    const r = await kv.getWithMetadata('ulD:' + b.wid); if (r.value == null) return err(404, 'not_found'); const meta = Object.assign({}, r.metadata || {}), tier = tierOf(b.tier);
    if (tierOf(meta.tier) === tier) return json(200, { ok: true, tier }); // 잔류: 쓰지 않는다
    const day = utcDay(now), today = meta.dd === day, tn = today ? meta.tn | 0 : 0;
    if (tn >= UL_TIER_DAY) return err(429, 'rate_limited');
    Object.assign(meta, { tier, dd: day, tn: tn + 1, rn: today ? meta.rn | 0 : 0 });
    await kv.put('ulD:' + b.wid, r.value, { metadata: meta }); await idxApply(kv, url, now, b.wid, meta, 1);
    return json(200, { ok: true, tier }); }
  if (rest === 'tiers' && req.method === 'GET') return cached(kv, tiersKey(url), UL_TTL, now, async () => {
    const o = await idxRead(kv, url, now, false);
    return new Response(JSON.stringify({ ok: true, counts: o.T.map(L => L.length) }), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=60' } }); });
  if (rest === 'opp' && req.method === 'GET') {
    const tier = tierOf(url.searchParams.get('tier')), wid = String(url.searchParams.get('wid') || ''), ovr = +url.searchParams.get('ovr') || 0, n = Math.max(1, Math.min(9, +url.searchParams.get('n') || 9));
    const L = (await idxRead(kv, url, now, false)).T[tier];
    const all = L.filter(x => x.wid !== wid), avg = all.length ? all.reduce((a, x) => a + ((x.ovr && x.ovr.t) || 0), 0) / all.length : 0;
    const pick = ulPick(all, ovr, n * 2, [wid]), decks = [];
    for (const m of pick) { if (decks.length >= n) break; const r = await kv.getWithMetadata('ulD:' + m.wid); const mt = r.metadata;
      if (!r.value || (mt && (mt.hide || tierOf(mt.tier) !== tier))) continue; // 색인이 늦은 경우: 숨김·다른 단계는 건너뛴다
      try { const e = JSON.parse(r.value); if (ulCapGate(e, tier, now).ok) decks.push({ name: m.name, year: m.year, ovr: m.ovr, at: m.at, e }); } catch (x) {} } /* 연봉 상한(사용자 11-17) */
    return new Response(JSON.stringify({ ok: true, tier, count: all.length, avg: Math.round(avg * 10) / 10, decks }), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
  }
  const mm = rest.match(/^(me|deck)\/(.+)$/);
  if (mm) { const wid = decodeURIComponent(mm[2]); if (!WID.test(wid)) return err(400, 'bad_wid');
    if (mm[1] === 'me' && req.method === 'GET') { const r = await kv.getWithMetadata('ulD:' + wid); return json(200, r.value == null ? { registered: false } : Object.assign({ registered: true }, pubMeta(r.metadata))); }
    if (mm[1] === 'deck' && req.method === 'DELETE') { const r = await kv.getWithMetadata('ulD:' + wid); if (r.value != null) await kv.delete('ulD:' + wid); await idxApply(kv, url, now, wid, null, 0); return json(200, { ok: true }); } }
  return err(404, 'not_found');
}
