/* 유저 래더 API. 기기 옮기기·프런트컵과 같은 KV(SAVE_KV). 규칙은 공용 모듈(src/core/uladder.mjs, cup.mjs) 그대로.
 *   PUT    /api/ladder/deck             본문 {wid, tier, e(엔트리)} → 덱 등록·갱신(세계 id당 하나, 언제든 덮어쓰기). 사진은 빼고 저장(약 8KB)
 *   PUT    /api/ladder/tier             본문 {wid, tier} → 리그를 마친 뒤 단계만 바꾸기
 *   GET    /api/ladder/opp?wid=&tier=&ovr=&n=9  같은 단계에서 내 OVR과 가까운 덱 n개(나는 빼고) + 그 단계 평균 OVR. 리그를 시작할 때 한 번
 *   GET    /api/ladder/tiers            단계별 등록 덱 수(숨긴 덱 빼고) {counts:[루키…레전드]}
 *   GET    /api/ladder/me/WID           내 등록 상태
 *   DELETE /api/ladder/deck/WID         등록 지우기
 *   관리자(Authorization: Bearer CUP_ADMIN): GET /api/ladder/admin/list?q= · PUT /api/ladder/admin/hide {wid, hide} · DELETE /api/ladder/admin/deck/WID
 * 보관: ulD:WID(덱 본문, 메타 {name, year, ovr, tier, h, at, hide}) · ulT:단계:WID(단계 색인, 메타 {wid, name, year, ovr, at}) */
import { cupValidate, cupName, cupBadName, cupEntryHash } from '../src/core/cup.mjs';
import { UL_TIERS, ulPick, ulSlim } from '../src/core/uladder.mjs';

export const UL_MAX_BYTES = 120 * 1024, UL_DECK_MAX = 40 * 1024;
const WID = /^w[0-9a-f]{16}$/;
const MSG = { bad_wid: '세계 id가 올바르지 않습니다.', bad_deck: '덱 형식이 아닙니다.', bad_name: '팀명에 쓸 수 없는 말이 들어 있습니다.', too_large: '덱이 너무 큽니다.', not_found: '등록한 덱이 없습니다.', auth: '관리자 인증이 필요합니다.', method: '지원하지 않는 요청입니다.' };
function json(status, body) { return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } }); }
const err = (s, e, x) => json(s, Object.assign({ error: e, message: MSG[e] || '' }, x || {}));
const tierOf = t => Math.max(0, Math.min(UL_TIERS.length - 1, (+t) | 0));
function admin(req, env) { const a = req.headers.get('Authorization') || ''; return !!env.CUP_ADMIN && a === 'Bearer ' + env.CUP_ADMIN; }
async function listAll(kv, prefix) { const out = []; let cursor; do { const r = await kv.list({ prefix, cursor }); cursor = r.list_complete ? null : r.cursor; for (const k of r.keys) out.push(k); } while (cursor); return out; }
async function setTier(kv, wid, meta, tier) {
  if (meta.tier !== tier) await kv.delete(`ulT:${meta.tier}:${wid}`);
  meta.tier = tier; if (!meta.hide) await kv.put(`ulT:${tier}:${wid}`, '1', { metadata: { wid, name: meta.name, year: meta.year, ovr: meta.ovr, at: meta.at } });
}
export async function handleLadder(req, env, url, now) {
  const kv = env.SAVE_KV, rest = (url.pathname.replace(/\/+$/, '').match(/^\/api\/ladder(?:\/(.*))?$/) || [])[1] || '';
  if (rest.startsWith('admin/')) {
    if (!admin(req, env)) return err(401, 'auth');
    const sub = rest.slice(6);
    if (sub === 'list' && req.method === 'GET') { const q = String(url.searchParams.get('q') || '').trim(); const L = (await listAll(kv, 'ulD:')).map(k => Object.assign({ wid: k.name.slice(4) }, k.metadata || {})).filter(x => !q || String(x.name || '').includes(q));
      return json(200, { ok: true, n: L.length, decks: L.sort((a, b) => (b.at || 0) - (a.at || 0)).slice(0, 300) }); }
    if (sub === 'hide' && req.method === 'PUT') { const b = JSON.parse(await req.text()); if (!b || !WID.test(String(b.wid || ''))) return err(400, 'bad_wid'); const r = await kv.getWithMetadata('ulD:' + b.wid); if (r.value == null) return err(404, 'not_found');
      const meta = Object.assign({}, r.metadata || {}); meta.hide = b.hide ? 1 : 0; await kv.put('ulD:' + b.wid, r.value, { metadata: meta }); if (meta.hide) await kv.delete(`ulT:${meta.tier}:${b.wid}`); else await setTier(kv, b.wid, meta, meta.tier); return json(200, { ok: true, hide: meta.hide }); }
    const dm = sub.match(/^deck\/(.+)$/); if (dm && req.method === 'DELETE') { const wid = decodeURIComponent(dm[1]); if (!WID.test(wid)) return err(400, 'bad_wid'); const r = await kv.getWithMetadata('ulD:' + wid); if (r.metadata) await kv.delete(`ulT:${r.metadata.tier}:${wid}`); await kv.delete('ulD:' + wid); return json(200, { ok: true }); }
    return err(405, 'method');
  }
  if (rest === 'deck' && req.method === 'PUT') {
    const len = +req.headers.get('Content-Length'); if (len > UL_MAX_BYTES) return err(413, 'too_large');
    const t = await req.text(); if (t.length > UL_MAX_BYTES) return err(413, 'too_large');
    let b; try { b = JSON.parse(t); } catch (x) { return err(400, 'bad_deck'); }
    if (!b || !WID.test(String(b.wid || ''))) return err(400, 'bad_wid');
    if (!b.e || cupBadName(b.e.name)) return err(400, b.e ? 'bad_name' : 'bad_deck');
    const e = ulSlim(b.e); e.name = cupName(e.name); const v = cupValidate(e, {}); if (!v.ok) return err(400, 'bad_deck', { errors: v.errors.map(x => x.msg) });
    e.h = cupEntryHash(e); const body = JSON.stringify(e); if (body.length > UL_DECK_MAX) return err(413, 'too_large');
    const prev = (await kv.getWithMetadata('ulD:' + b.wid)).metadata || null, tier = tierOf(b.tier);
    const meta = { name: e.name, year: e.year, ovr: e.ovr || null, tier, h: e.h, at: now, hide: prev && prev.hide ? 1 : 0 };
    if (prev && prev.tier !== tier) await kv.delete(`ulT:${prev.tier}:${b.wid}`);
    await kv.put('ulD:' + b.wid, body, { metadata: meta }); await setTier(kv, b.wid, Object.assign({}, meta), tier);
    return json(200, { ok: true, name: meta.name, ovr: meta.ovr, tier: meta.tier, bytes: body.length });
  }
  if (rest === 'tier' && req.method === 'PUT') { const b = JSON.parse(await req.text() || '{}'); if (!b || !WID.test(String(b.wid || ''))) return err(400, 'bad_wid');
    const r = await kv.getWithMetadata('ulD:' + b.wid); if (r.value == null) return err(404, 'not_found'); const meta = Object.assign({}, r.metadata || {}); await setTier(kv, b.wid, meta, tierOf(b.tier)); await kv.put('ulD:' + b.wid, r.value, { metadata: meta }); return json(200, { ok: true, tier: meta.tier }); }
  if (rest === 'tiers' && req.method === 'GET') { const counts = []; for (let t = 0; t < UL_TIERS.length; t++) counts.push((await listAll(kv, `ulT:${t}:`)).length);
    return new Response(JSON.stringify({ ok: true, counts }), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=60' } }); }
  if (rest === 'opp' && req.method === 'GET') {
    const tier = tierOf(url.searchParams.get('tier')), wid = String(url.searchParams.get('wid') || ''), ovr = +url.searchParams.get('ovr') || 0, n = Math.max(1, Math.min(9, +url.searchParams.get('n') || 9));
    const L = (await listAll(kv, `ulT:${tier}:`)).map(k => k.metadata).filter(Boolean);
    const all = L.filter(x => x.wid !== wid), avg = all.length ? all.reduce((a, x) => a + ((x.ovr && x.ovr.t) || 0), 0) / all.length : 0;
    const pick = ulPick(all, ovr, n, [wid]), decks = [];
    for (const m of pick) { const t = await kv.get('ulD:' + m.wid); if (!t) continue; try { const e = JSON.parse(t); decks.push({ name: m.name, year: m.year, ovr: m.ovr, at: m.at, e }); } catch (x) {} }
    return new Response(JSON.stringify({ ok: true, tier, count: all.length, avg: Math.round(avg * 10) / 10, decks }), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
  }
  const mm = rest.match(/^(me|deck)\/(.+)$/);
  if (mm) { const wid = decodeURIComponent(mm[2]); if (!WID.test(wid)) return err(400, 'bad_wid');
    if (mm[1] === 'me' && req.method === 'GET') { const r = await kv.getWithMetadata('ulD:' + wid); return json(200, r.value == null ? { registered: false } : Object.assign({ registered: true }, r.metadata || {})); }
    if (mm[1] === 'deck' && req.method === 'DELETE') { const r = await kv.getWithMetadata('ulD:' + wid); if (r.metadata) await kv.delete(`ulT:${r.metadata.tier}:${wid}`); await kv.delete('ulD:' + wid); return json(200, { ok: true }); } }
  return err(404, 'not_found');
}
