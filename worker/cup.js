/* 유저 대회(프런트컵) API. 기기 옮기기와 같은 KV(SAVE_KV)를 쓴다. 규칙·검증은 공용 모듈(src/core/cup.mjs) 그대로.
 *   GET    /api/cup                    지금 대회 공개 설정 {ok, cup:{id,title,deadline,…}} | 404 no_cup
 *   POST   /api/cup/entry              본문: 엔트리 JSON(게임의 '대회 참가 신청') → 201 {ok, name, ovr, at}. 세계 id당 대회마다 1개(다시 내면 덮어쓰기), 하루 1회, 마감 뒤 거절
 *   GET    /api/cup/entry/WID          내 신청 상태 → 200 {entered, name, year, ovr, at} (세계 id를 아는 사람만)
 *   DELETE /api/cup/entry/WID          신청 취소
 *   GET    /api/cup/entries            참가팀 명단(JSON, 시드 순 OVR). 세계 id는 내보내지 않는다
 *   GET    /api/cup/entries.html       같은 명단의 단순 HTML 페이지
 *   GET    /api/cup/results            공개 결과(프런트컵 명예의 전당) JSON: 회차마다 우승·준우승 로스터, 순위, 개인 타이틀. 누구나(게임 처음 화면에서도) 읽는다
 *   GET    /api/cup/game/ID            대회 경기 다시 보기 묶음(두 엔트리 + 경기 키)
 *   주최자(Authorization: Bearer CUP_ADMIN 비밀값):
 *   PUT /api/cup/admin/config · GET /api/cup/admin/entries · PUT /api/cup/admin/results · PUT /api/cup/admin/game/ID
 * 보관: 엔트리 본문과 메타데이터(이름·연도·OVR·시각). IP는 기기 옮기기와 같이 해시로만 횟수를 센다. */
import { CUP_DEFAULT, cupValidate, cupName, cupBadName, cupKstMs, cupKstDay, cupEntryHash, cupSeed, cupOvrTxt } from '../src/core/cup.mjs';

export const CUP_MAX_BYTES = 400 * 1024;
const MSG = {
  no_cup: '지금 열린 대회가 없습니다.',
  closed: '접수가 마감됐습니다.',
  daily: '신청은 하루에 한 번만 할 수 있습니다. 내일 다시 시도해 주세요.',
  too_large: '엔트리가 너무 큽니다.',
  bad_entry: '대회 엔트리가 아닙니다.',
  bad_name: '팀명에 쓸 수 없는 말이 들어 있습니다.',
  not_eligible: '참가 자격이 맞지 않습니다.',
  not_found: '신청 기록이 없습니다.',
  bad_wid: '세계 id가 올바르지 않습니다.',
  auth: '주최자 인증이 필요합니다.',
  method: '지원하지 않는 요청입니다.',
};
const WID = /^w[0-9a-f]{16}$/;
const GID = /^[A-Za-z0-9_-]{1,64}$/;
function json(status, body) { return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } }); }
const err = (status, error, extra) => json(status, Object.assign({ error, message: MSG[error] || '' }, extra || {}));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
async function cfgOf(kv) { const t = await kv.get('cup:cfg'); if (!t) return null; try { return Object.assign({}, CUP_DEFAULT, JSON.parse(t)); } catch (e) { return null; } }
const pub = c => ({ id: c.id, title: c.title, format: c.format || 'knockout', teams: c.teams, deadline: c.deadline, size: c.size, best: c.best, minSeasons: c.minSeasons, payCap: c.payCap, open: c.open !== false, note: c.note || '' });
function admin(req, env) { const a = req.headers.get('Authorization') || ''; return !!env.CUP_ADMIN && a === 'Bearer ' + env.CUP_ADMIN; }
async function listEntries(kv, id, full) {
  const out = []; let cursor;
  do {
    const r = await kv.list({ prefix: `cupE:${id}:`, cursor }); cursor = r.list_complete ? null : r.cursor;
    for (const k of r.keys) {
      if (full) { const v = await kv.get(k.name); if (v) out.push(JSON.parse(v)); }
      else if (k.metadata) out.push(k.metadata);
    }
  } while (cursor);
  return out;
}
function seeded(list) { return cupSeed(list.map(m => Object.assign({ h: m.h || '', ovr: m.ovr || { t: 0, p: 0, b: 0 } }, m))).map((m, i) => ({ seed: i + 1, name: m.name, year: m.year, ovr: m.ovr, seasons: m.seasons, at: m.at })); }

export async function handleCup(req, env, url, now, rateLimited) {
  const kv = env.SAVE_KV, path = url.pathname.replace(/\/+$/, '');
  const m = path.match(/^\/api\/cup(?:\/(.*))?$/); const rest = m && m[1] || '';
  if (rest.startsWith('admin/')) {
    if (!admin(req, env)) return err(401, 'auth');
    const sub = rest.slice(6);
    if (sub === 'config' && req.method === 'PUT') { const c = JSON.parse(await req.text()); if (!c || !GID.test(String(c.id || ''))) return err(400, 'bad_entry'); await kv.put('cup:cfg', JSON.stringify(c)); return json(200, { ok: true }); }
    if (sub === 'entries' && req.method === 'GET') { const c = await cfgOf(kv); if (!c) return err(404, 'no_cup'); return json(200, { cup: c, entries: await listEntries(kv, c.id, true) }); }
    if (sub === 'results' && req.method === 'PUT') { const t = await req.text(); JSON.parse(t); await kv.put('cup:results', t); return json(200, { ok: true }); }
    const g = sub.match(/^game\/(.+)$/); if (g && req.method === 'PUT' && GID.test(g[1])) { const t = await req.text(); if (t.length > 2 * CUP_MAX_BYTES) return err(413, 'too_large'); JSON.parse(t); await kv.put('cupG:' + g[1], t); return json(200, { ok: true }); }
    return err(405, 'method');
  }
  if (rest === '' && req.method === 'GET') { const c = await cfgOf(kv); return c ? json(200, { ok: true, cup: pub(c), now }) : err(404, 'no_cup'); }
  if (rest === 'results' && req.method === 'GET') { const t = await kv.get('cup:results'); return t ? new Response(t, { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300' } }) : err(404, 'not_found'); }
  const gm = rest.match(/^game\/(.+)$/); if (gm && req.method === 'GET') { if (!GID.test(gm[1])) return err(400, 'bad_entry'); const t = await kv.get('cupG:' + gm[1]); return t ? new Response(t, { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } }) : err(404, 'not_found'); }
  if (rest === 'entries' || rest === 'entries.html') {
    if (req.method !== 'GET') return err(405, 'method');
    const c = await cfgOf(kv); if (!c) return err(404, 'no_cup');
    const L = seeded(await listEntries(kv, c.id, false));
    if (rest === 'entries') return json(200, { cup: pub(c), n: L.length, entries: L });
    const rows = L.map(e => `<tr><td>${e.seed}</td><td>${esc(e.name)} ${esc(e.year)}</td><td class="n">${esc(cupOvrTxt(e.ovr))}</td></tr>`).join('');
    const html = `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(c.title)} 참가팀</title>
<style>body{font:15px/1.5 system-ui,sans-serif;margin:0 auto;max-width:560px;padding:16px;background:#f6f7f9;color:#1b1f24}h1{font-size:20px}table{width:100%;border-collapse:collapse;background:#fff}td,th{padding:6px 8px;border-bottom:1px solid #e3e6ea;text-align:left}.n{font-variant-numeric:tabular-nums;white-space:nowrap}p{color:#5b6470}</style>
<h1>${esc(c.title)} 참가팀 ${L.length}팀</h1><p>시드 순입니다. OVR은 총|투수 타자입니다.${c.deadline ? ` 접수 마감 ${esc(c.deadline)}(한국시간).` : ''}</p>
<table><tr><th>시드</th><th>팀</th><th>OVR</th></tr>${rows}</table></html>`;
    return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
  }
  const em = rest.match(/^entry(?:\/([^/]*))?$/);
  if (!em) return err(404, 'not_found');
  const c = await cfgOf(kv); if (!c) return err(404, 'no_cup');
  if (em[1] != null) {
    const wid = decodeURIComponent(em[1]); if (!WID.test(wid)) return err(400, 'bad_wid');
    const key = `cupE:${c.id}:${wid}`;
    if (req.method === 'GET') { const r = await kv.getWithMetadata(key); if (r.value == null) return json(200, { entered: false, cup: pub(c) }); return json(200, Object.assign({ entered: true, cup: pub(c) }, r.metadata || {})); }
    if (req.method === 'DELETE') { const dl = cupKstMs(c.deadline); if (dl != null && now > dl) return err(403, 'closed'); await kv.delete(key); return json(200, { ok: true }); }
    return err(405, 'method');
  }
  if (req.method !== 'POST') return err(405, 'method');
  if (c.open === false) return err(403, 'closed');
  const dl = cupKstMs(c.deadline); if (dl != null && now > dl) return err(403, 'closed');
  const len = +req.headers.get('Content-Length'); if (len > CUP_MAX_BYTES) return err(413, 'too_large');
  const rl = rateLimited ? await rateLimited(req, env, now) : null; if (rl && rl.limited) return err(429, 'daily');
  const t = await req.text(); if (t.length > CUP_MAX_BYTES) return err(413, 'too_large');
  let e; try { e = JSON.parse(t); } catch (x) { return err(400, 'bad_entry'); }
  if (!e || !WID.test(String(e.wid || ''))) return err(400, 'bad_wid');
  if (cupBadName(e.name)) return err(400, 'bad_name');
  e.name = cupName(e.name); e.cup = c.id;
  const v = cupValidate(Object.assign({}, e, { h: undefined }), c);
  if (!v.ok) return err(400, 'bad_entry', { errors: v.errors.map(x => x.msg) });
  if (v.elig.length) return err(403, 'not_eligible', { errors: v.elig.map(x => x.msg) });
  const day = `cupD:${c.id}:${e.wid}:${cupKstDay(now)}`;
  if (await kv.get(day)) return err(429, 'daily');
  e.h = cupEntryHash(e); e.at = now;
  const meta = { name: e.name, year: e.year, ovr: e.ovr || null, seasons: e.seasons || 0, h: e.h, at: now, flags: v.flags.length };
  await kv.put(`cupE:${c.id}:${e.wid}`, JSON.stringify(e), { metadata: meta });
  await kv.put(day, '1', { expirationTtl: 2 * 86400 });
  if (rl && rl.key) await kv.put(rl.key, String(rl.n + 1), { expirationTtl: 3660 });
  return json(201, Object.assign({ ok: true }, meta));
}
