/* 클라우드 저장(서버 v1, 사용자 11-18): 저장 본문은 R2(env.SAVES), 목록·판번호·연결 코드는 D1. 설계 docs/design/cloud-save-2026-11-17.md, 설정 docs/server-setup.md 7절.
   env.SAVES가 없으면(R2 버킷을 아직 안 만듦) 아래 API가 모두 503 not_configured → 화면은 클라우드 저장 카드를 숨긴다. 그래서 버킷 없이 배포해도 안전하다.
   로그인은 지금 v1 기기 토큰(ft1.…, 서버에는 SHA-256만) 그대로. 경로에 player_id를 받지 않는다: 늘 토큰 주인의 것만 읽고 쓴다.
     GET    /api/v1/cloud                            기능 확인(로그인 없이) {ok, max_slots, max_bytes, daily_max}
     GET    /api/v1/saves                            내 클라우드 슬롯 목록(본문 없음)
     GET    /api/v1/saves/SLOT[?rev=]                본문(application/octet-stream), ETag "<rev>". 최근 3판까지
     PUT    /api/v1/saves/SLOT                       본문 = 'FTS1' + deflate 바이트. If-Match "<base>"(새 슬롯은 If-None-Match: *) 필수(없으면 428)
                                                     서버 판번호 ≠ base → 409 conflict(서버 쪽 요약). 말없이 덮지 않는다
     DELETE /api/v1/saves/SLOT                       If-Match 필수. R2 판 전부 지움
     POST   /api/v1/player/link-code                 기기 연결 코드(8자리, 10분, 한 번) → {code, expiresAt}
     POST   /api/v1/player/link-code/redeem {code, platform, name}   (로그인 없이) → 같은 플레이어의 새 기기 토큰 {player, token}
     POST   /api/v1/player/recovery                  복구 코드(24자리) 새로 만들기 → {code}. 한 번만 보여 주고 서버에는 해시만. 예전 복구 코드는 무효. GET은 {has, created}만
     POST   /api/v1/player/recovery/redeem {code, platform, name}    (로그인 없이) → 새 기기 토큰. 쓴 복구 코드는 무효(새로 만들게 안내)
     GET    /api/v1/player/devices                   연결된 기기 목록 · PUT player/devices/me {name} 이 기기 이름 · DELETE player/devices/ID 연결 끊기(그 토큰은 바로 401)
   순서(R2와 D1 사이): ① D1에서 rev = base인 줄을 차지(pending) → ② R2에 <base+1>.bin → ③ D1 rev = base+1(pending이 내 것일 때만). 읽기는 D1 rev가 가리키는 판만 읽으므로 ②까지만 된 판은 보이지 않는다.
   횟수: 올리기 플레이어당 분당 6번·하루 200번(D1 cloud_usage), 받기 분당 30번, 코드 입력 IP당 시간당 10번. 슬롯 3개, 본문 16MB. 관리자 API는 본문을 읽지 않는다 */
import { json, err, readJson, readBytes, kstDay, qInt } from './http.js';
import { issueDevice, platformOf, profile, sha256 } from './auth.js';
import { limited, ipKey } from './ratelimit.js';

export const CLOUD_SQL = `-- 클라우드 저장(2026-11-18): 슬롯 목록·판번호, 기기 연결 코드·복구 코드, 기기 이름, 하루 올리기 횟수. 설계 docs/design/cloud-save-2026-11-17.md
-- 저장 본문은 D1이 아니라 R2(바인딩 SAVES, saves/<player_id>/<slot>/<rev>.bin)에 둔다.
-- 서버가 처음 쓸 때 스스로 만들므로(같은 문장, IF NOT EXISTS) 꼭 돌릴 필요는 없다. 미리 넣으려면 D1 콘솔에 붙여 넣거나, 관리자 POST /api/v1/admin/migrate, wrangler d1 migrations apply.
-- 같은 SQL이 worker/v1/cloud.js CLOUD_SQL에 있다(점검 tools/test/cloud-save.test.cjs가 같은지 본다).
CREATE TABLE IF NOT EXISTS cloud_saves (
  player_id TEXT NOT NULL,
  slot TEXT NOT NULL,
  rev INTEGER NOT NULL DEFAULT 0,
  wid TEXT,
  day INTEGER,
  date_label TEXT,
  team TEXT,
  ver TEXT,
  device_id TEXT,
  device_name TEXT,
  bytes INTEGER NOT NULL DEFAULT 0,
  sha256 TEXT,
  saved_at INTEGER,
  updated INTEGER NOT NULL,
  pending TEXT,
  pending_at INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (player_id, slot)
) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS cloud_codes (
  code_hash TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  created INTEGER NOT NULL,
  expires INTEGER NOT NULL DEFAULT 0
) WITHOUT ROWID;
CREATE INDEX IF NOT EXISTS cloud_codes_player ON cloud_codes (player_id, kind);
CREATE TABLE IF NOT EXISTS cloud_devices (
  secret_hash TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  name TEXT NOT NULL,
  at INTEGER NOT NULL
) WITHOUT ROWID;
CREATE INDEX IF NOT EXISTS cloud_devices_player ON cloud_devices (player_id);
CREATE TABLE IF NOT EXISTS cloud_usage (
  player_id TEXT NOT NULL,
  day TEXT NOT NULL,
  n INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (player_id, day)
) WITHOUT ROWID;
`;
export const cloudStatements = () => CLOUD_SQL.split('\n').filter(l => !/^\s*--/.test(l)).join('\n').split(';').map(x => x.trim()).filter(Boolean);
export const MAX_SLOTS = 3, KEEP_REVS = 3, SAVE_MAX = 16 * 1024 * 1024, SAVE_MIN = 64, DAILY_MAX = 200, LINK_TTL = 600e3, PENDING_MS = 120e3;
export const MAGIC = [0x46, 0x54, 0x53, 0x31]; /* 'FTS1': 게임 클라우드 저장 형식 1(뒤는 deflate-raw 바이트). 서버는 풀어 보지 않는다 */
export const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', LINK_LEN = 8, REC_LEN = 24; /* 기기 옮기기와 같은 글자표(0·O·1·I·L 없음) */
export const SLOT_RE = /^[a-z0-9]{1,24}$/, DEV_RE = /^d[0-9a-f]{16}$/;
export const objKey = (pid, slot, rev) => `saves/${pid}/${slot}/${rev}.bin`;
const hex = a => [...a].map(b => b.toString(16).padStart(2, '0')).join('');

let ready = false; export function _cloudReset() { ready = false; }
/* 표가 없으면(0003 SQL을 아직 안 돌린 서버) 한 번 만든다. 같은 문장(IF NOT EXISTS)이라 여러 번 해도 안전 */
export async function ensureCloud(db) { if (ready) return true; await db.batch(cloudStatements().map(q => db.prepare(q))); ready = true; return true; }

export function newCode(len, rand) {
  const out = [], buf = new Uint8Array(32);
  while (out.length < len) { (rand || (b => crypto.getRandomValues(b)))(buf); for (const x of buf) if (x < 248 && out.length < len) out.push(ALPHABET[x % 31]); } /* 248 = 31×8: 치우침 없이 */
  return out.join('');
}
export function normCode(s, len) { const c = String(s || '').toUpperCase().replace(/[\s-]/g, ''); return c.length === len && [...c].every(ch => ALPHABET.includes(ch)) ? c : ''; }
const codeHash = (kind, c) => sha256('fts-' + kind + ':' + c);
/* 화면용 짧은 글(기기 이름·구단 이름·날짜): 머리글은 encodeURIComponent로 온다. 제어 문자를 빼고 자른다 */
export function cleanText(s, max) { let t = String(s == null ? '' : s); try { t = decodeURIComponent(t); } catch (e) {} t = t.replace(/[\u0000-\u001f\u007f\u200b-\u200f\u2028-\u202e\u2060-\u206f\ufeff]/g, '').trim(); return [...t].slice(0, max).join(''); }
const devId = h => 'd' + String(h || '').slice(0, 16);
const nextKstMidnight = now => { const d = Date.parse(kstDay(now) + 'T00:00:00+09:00') + 86400e3; return Math.max(60, Math.ceil((d - now) / 1000)); };
const summary = r => r && r.rev > 0 ? { slot: r.slot, rev: r.rev, wid: r.wid || null, day: r.day, date: r.date_label || '', team: r.team || '', ver: r.ver || '', device_id: r.device_id || '', device_name: r.device_name || '', bytes: r.bytes, saved_at: r.saved_at || null, updated: r.updated } : null;
function parseRev(req) {
  const inm = (req.headers.get('If-None-Match') || '').trim(), im = (req.headers.get('If-Match') || '').trim();
  if (inm === '*') return { base: 0 };
  if (!im) return { error: 'precondition_required' };
  const m = im.match(/^(?:W\/)?"?(\d{1,12})"?$/); if (!m || +m[1] < 1) return { error: 'bad_rev' };
  return { base: +m[1] };
}

/* 접두어 아래 R2 객체 지우기: 지운 뒤 늘 첫 장을 다시 읽는다(커서는 지우는 사이 어긋날 수 있다). 한 장 최대 1000개 */
async function dropPrefix(env, prefix, pages) {
  for (let i = 0; i < pages; i++) { const l = await env.SAVES.list({ prefix }); const keys = (l.objects || []).map(o => o.key); if (keys.length) await env.SAVES.delete(keys); if (!keys.length || !l.truncated) break; }
}
/* 이 플레이어의 클라우드 저장 전부 지우기(DELETE /player, 관리자 삭제): R2 판까지. 본문은 읽지 않는다 */
export async function deleteCloud(env, db, pid) {
  if (env && env.SAVES) {
    await dropPrefix(env, `saves/${pid}/`, 50);
  }
  try { await ensureCloud(db); await db.batch(['cloud_saves', 'cloud_codes', 'cloud_devices', 'cloud_usage'].map(t => db.prepare(`DELETE FROM ${t} WHERE player_id = ?`).bind(pid))); } catch (e) {}
}

/* 로그인 없이 받는 것: 기능 확인·코드로 새 기기 토큰 받기. 아니면 null(다음 처리로) */
export async function cloudPublic(rest, req, env, db, now) {
  if (rest === 'cloud' && req.method === 'GET') return env.SAVES ? json(200, { ok: true, max_slots: MAX_SLOTS, max_bytes: SAVE_MAX, daily_max: DAILY_MAX, keep_revs: KEEP_REVS, link_ttl: LINK_TTL }) : err(503, 'not_configured', { feature: 'cloud' });
  const kind = rest === 'player/link-code/redeem' ? 'link' : rest === 'player/recovery/redeem' ? 'rec' : '';
  if (!kind || req.method !== 'POST') return null;
  if (!env.SAVES) return err(503, 'not_configured', { feature: 'cloud' });
  if (await limited(env, 'link', await ipKey(req, env), now)) return err(429, 'rate_limited', null, { 'Retry-After': '3600' });
  const { body: b, error } = await readJson(req, 4096); if (error) return err(400, error);
  const code = normCode(b.code, kind === 'link' ? LINK_LEN : REC_LEN); if (!code) return err(400, 'bad_code');
  await ensureCloud(db);
  /* 지우면서 읽는다(RETURNING): 같은 코드가 동시에 와도 하나만 성공 */
  const hit = await db.prepare('DELETE FROM cloud_codes WHERE code_hash = ? AND kind = ? AND (expires = 0 OR expires > ?) RETURNING player_id').bind(await codeHash(kind, code), kind, now).first();
  const p = hit && await db.prepare('SELECT * FROM players WHERE id = ?').bind(hit.player_id).first();
  if (!p) return err(404, 'bad_code');
  const dev = await issueDevice(db, p.id, platformOf(b.platform), now), name = cleanText(b.name, 24) || '새 기기';
  await db.batch([dev.stmt, db.prepare('INSERT OR REPLACE INTO cloud_devices (secret_hash, player_id, name, at) VALUES (?, ?, ?, ?)').bind(await sha256(dev.token), p.id, name, now)]);
  return json(200, { ok: true, player: profile(p), token: dev.token, via: kind === 'link' ? 'link' : 'recovery' });
}

/* 로그인한 플레이어(me)의 클라우드 요청. 해당 없으면 null */
export async function cloudRoute(rest, req, env, db, me, now) {
  const isCloud = rest === 'saves' || rest.startsWith('saves/') || rest === 'player/link-code' || rest === 'player/recovery' || rest === 'player/devices' || rest.startsWith('player/devices/');
  if (!isCloud) return null;
  if (!env.SAVES) return err(503, 'not_configured', { feature: 'cloud' });
  await ensureCloud(db);
  const M = req.method;
  if (rest === 'saves' && M === 'GET') return listSaves(db, me, now);
  const sm = rest.match(/^saves\/([^/]+)$/);
  if (sm) {
    let slot = ''; try { slot = decodeURIComponent(sm[1]); } catch (e) {} if (!SLOT_RE.test(slot)) return err(400, 'bad_slot');
    if (M === 'GET') return getSave(req, env, db, me, slot, now);
    if (M === 'PUT') return putSave(req, env, db, me, slot, now);
    if (M === 'DELETE') return delSave(req, env, db, me, slot, now);
    return err(405, 'method');
  }
  if (rest === 'player/link-code' && M === 'POST') {
    if (await limited(env, 'code', me.id, now)) return err(429, 'rate_limited', null, { 'Retry-After': '600' });
    const code = newCode(LINK_LEN), exp = now + LINK_TTL;
    await db.batch([db.prepare("DELETE FROM cloud_codes WHERE player_id = ? AND kind = 'link'").bind(me.id), db.prepare("DELETE FROM cloud_codes WHERE kind = 'link' AND expires < ?").bind(now),
      db.prepare("INSERT INTO cloud_codes (code_hash, player_id, kind, created, expires) VALUES (?, ?, 'link', ?, ?)").bind(await codeHash('link', code), me.id, now, exp)]);
    return json(201, { ok: true, code, expiresAt: exp, ttl: LINK_TTL });
  }
  if (rest === 'player/recovery' && M === 'POST') {
    if (await limited(env, 'code', me.id, now)) return err(429, 'rate_limited', null, { 'Retry-After': '600' });
    const code = newCode(REC_LEN);
    await db.batch([db.prepare("DELETE FROM cloud_codes WHERE player_id = ? AND kind = 'rec'").bind(me.id),
      db.prepare("INSERT INTO cloud_codes (code_hash, player_id, kind, created, expires) VALUES (?, ?, 'rec', ?, 0)").bind(await codeHash('rec', code), me.id, now)]);
    return json(201, { ok: true, code, created: now });
  }
  if (rest === 'player/recovery' && M === 'GET') { const r = await db.prepare("SELECT created FROM cloud_codes WHERE player_id = ? AND kind = 'rec'").bind(me.id).first(); return json(200, { ok: true, has: !!r, created: r ? r.created : null }); }
  if (rest === 'player/devices' && M === 'GET') {
    const r = (await db.prepare('SELECT d.secret_hash AS h, d.platform, d.created, d.last_seen, n.name FROM devices d LEFT JOIN cloud_devices n ON n.secret_hash = d.secret_hash WHERE d.player_id = ? ORDER BY d.last_seen DESC, d.created DESC LIMIT 50').bind(me.id).all()).results || [];
    return json(200, { ok: true, devices: r.map(x => ({ id: devId(x.h), platform: x.platform, name: x.name || '', created: x.created, last_seen: x.last_seen, current: x.h === me.secret_hash })) });
  }
  if (rest === 'player/devices/me' && M === 'PUT') {
    const { body: b, error } = await readJson(req, 2048); if (error) return err(400, error);
    const name = cleanText(b.name, 24); if (!name) return err(400, 'bad_name');
    await db.prepare('INSERT INTO cloud_devices (secret_hash, player_id, name, at) VALUES (?, ?, ?, ?) ON CONFLICT (secret_hash) DO UPDATE SET name = excluded.name, at = excluded.at').bind(me.secret_hash, me.id, name, now).run();
    return json(200, { ok: true, id: devId(me.secret_hash), name });
  }
  const dm = rest.match(/^player\/devices\/([^/]+)$/);
  if (dm && M === 'DELETE') {
    const id = dm[1]; if (!DEV_RE.test(id)) return err(400, 'bad_device');
    const row = await db.prepare('SELECT secret_hash FROM devices WHERE player_id = ? AND substr(secret_hash, 1, 16) = ?').bind(me.id, id.slice(1)).first();
    if (!row) return err(404, 'not_found');
    await db.batch([db.prepare('DELETE FROM devices WHERE player_id = ? AND secret_hash = ?').bind(me.id, row.secret_hash), db.prepare('DELETE FROM cloud_devices WHERE secret_hash = ?').bind(row.secret_hash)]);
    return json(200, { ok: true, id, current: row.secret_hash === me.secret_hash });
  }
  return err(404, 'not_found');
}

async function listSaves(db, me, now) {
  const r = (await db.prepare('SELECT * FROM cloud_saves WHERE player_id = ? AND rev > 0 ORDER BY updated DESC').bind(me.id).all()).results || [];
  const u = await db.prepare('SELECT n FROM cloud_usage WHERE player_id = ? AND day = ?').bind(me.id, kstDay(now)).first();
  return json(200, { ok: true, slots: r.map(summary), max_slots: MAX_SLOTS, daily: { used: u ? u.n : 0, max: DAILY_MAX }, device_id: devId(me.secret_hash) });
}
async function getSave(req, env, db, me, slot, now) {
  if (await limited(env, 'cloud_get', me.id, now)) return err(429, 'rate_limited', null, { 'Retry-After': '60' });
  const row = await db.prepare('SELECT * FROM cloud_saves WHERE player_id = ? AND slot = ? AND rev > 0').bind(me.id, slot).first();
  if (!row) return err(404, 'not_found');
  const url = new URL(req.url), want = qInt(url.searchParams.get('rev'), row.rev, 1, row.rev);
  if (want < row.rev - KEEP_REVS + 1) return err(404, 'not_found');
  const obj = await env.SAVES.get(objKey(me.id, slot, want));
  if (!obj) return err(404, 'not_found');
  const h = { 'Content-Type': 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ETag: `"${want}"`, 'X-Save-Rev': String(want), 'X-Save-Current': String(row.rev) };
  if (want === row.rev) { if (row.day != null) h['X-Save-Day'] = String(row.day); if (row.wid) h['X-Save-Wid'] = row.wid; }
  return new Response(obj.body, { status: 200, headers: h });
}
async function conflict(db, me, slot) {
  const cur = await db.prepare('SELECT * FROM cloud_saves WHERE player_id = ? AND slot = ?').bind(me.id, slot).first();
  return err(409, 'conflict', { current: summary(cur), busy: !!(cur && cur.pending) });
}
async function putSave(req, env, db, me, slot, now) {
  if (await limited(env, 'cloud_put', me.id, now)) return err(429, 'rate_limited', null, { 'Retry-After': '60' });
  const pr = parseRev(req); if (pr.error) return err(pr.error === 'bad_rev' ? 400 : 428, pr.error);
  const base = pr.base, H = k => req.headers.get(k);
  if (+H('Content-Length') > SAVE_MAX) return err(413, 'too_large', { max: SAVE_MAX });
  const rb = await readBytes(req, SAVE_MAX); if (rb.error) return err(413, 'too_large', { max: SAVE_MAX });
  const body = rb.bytes;
  if (body.byteLength < SAVE_MIN || MAGIC.some((x, i) => body[i] !== x)) return err(400, 'bad_format');
  const cur = await db.prepare('SELECT * FROM cloud_saves WHERE player_id = ? AND slot = ?').bind(me.id, slot).first();
  if ((cur ? cur.rev : 0) !== base) return conflict(db, me, slot);
  if (base === 0) { const c = await db.prepare('SELECT COUNT(*) AS n FROM cloud_saves WHERE player_id = ? AND slot <> ? AND (rev > 0 OR pending_at >= ?)').bind(me.id, slot, now - PENDING_MS).first(); if (c && c.n >= MAX_SLOTS) return err(403, 'slot_limit', { max: MAX_SLOTS }); }
  /* 하루 상한: 차지하기 전에 센다(상한이면 한 줄도 바꾸지 않는다) */
  const use = await db.prepare('INSERT INTO cloud_usage (player_id, day, n) VALUES (?, ?, 1) ON CONFLICT (player_id, day) DO UPDATE SET n = n + 1 WHERE n < ?').bind(me.id, kstDay(now), DAILY_MAX).run();
  if (!use.meta || !use.meta.changes) return err(429, 'daily_limit', { max: DAILY_MAX }, { 'Retry-After': String(nextKstMidnight(now)) });
  /* ① 차지: rev = base이고 다른 쓰기가 진행 중이 아닐 때만 */
  const nonce = hex(crypto.getRandomValues(new Uint8Array(8))), stale = now - PENDING_MS;
  const claim = base === 0
    ? await db.prepare('INSERT INTO cloud_saves (player_id, slot, rev, pending, pending_at, updated) VALUES (?, ?, 0, ?, ?, ?) ON CONFLICT (player_id, slot) DO UPDATE SET pending = excluded.pending, pending_at = excluded.pending_at WHERE cloud_saves.rev = 0 AND cloud_saves.pending_at < ?').bind(me.id, slot, nonce, now, now, stale).run()
    : await db.prepare('UPDATE cloud_saves SET pending = ?, pending_at = ? WHERE player_id = ? AND slot = ? AND rev = ? AND pending_at < ?').bind(nonce, now, me.id, slot, base, stale).run();
  if (!claim.meta || !claim.meta.changes) return conflict(db, me, slot);
  const release = () => db.prepare(base === 0 ? 'DELETE FROM cloud_saves WHERE player_id = ? AND slot = ? AND rev = 0 AND pending = ?' : 'UPDATE cloud_saves SET pending = NULL, pending_at = 0 WHERE player_id = ? AND slot = ? AND pending = ?').bind(me.id, slot, nonce).run().catch(() => {});
  const rev = base + 1, sha = await sha256Bytes(body);
  /* ② R2 */
  try { await env.SAVES.put(objKey(me.id, slot, rev), body, { httpMetadata: { contentType: 'application/octet-stream' }, customMetadata: { rev: String(rev), n: nonce } }); }
  catch (e) { await release(); return err(500, 'server'); }
  /* ③ 판번호 올리기(차지가 그대로일 때만) */
  const dev = await db.prepare('SELECT name FROM cloud_devices WHERE secret_hash = ?').bind(me.secret_hash).first();
  const wid = /^w[0-9a-f]{16}$/.test(H('X-Save-Wid') || '') ? H('X-Save-Wid') : null, dayN = qInt(H('X-Save-Day'), null, -100000, 10000000), at = qInt(H('X-Save-At'), null, 0, 9e15);
  const ver = /^[\w.-]{1,24}$/.test(H('X-Save-Ver') || '') ? H('X-Save-Ver') : null;
  const done = await db.prepare('UPDATE cloud_saves SET rev = ?, wid = ?, day = ?, date_label = ?, team = ?, ver = ?, device_id = ?, device_name = ?, bytes = ?, sha256 = ?, saved_at = ?, updated = ?, pending = NULL, pending_at = 0 WHERE player_id = ? AND slot = ? AND rev = ? AND pending = ?')
    .bind(rev, wid, dayN, cleanText(H('X-Save-Date'), 30) || null, cleanText(H('X-Save-Team'), 30) || null, ver, devId(me.secret_hash), dev ? dev.name : null, body.byteLength, sha, at, now, me.id, slot, base, nonce).run();
  if (!done.meta || !done.meta.changes) return conflict(db, me, slot); /* 차지가 시간 초과로 넘어감: 이 판은 보이지 않는다 */
  /* 최근 3판만 남긴다 */
  if (rev - KEEP_REVS >= 1) { try { await env.SAVES.delete(objKey(me.id, slot, rev - KEEP_REVS)); } catch (e) {} }
  return json(200, { ok: true, slot, rev, updated: now, bytes: body.byteLength });
}
async function delSave(req, env, db, me, slot, now) {
  const pr = parseRev(req); if (pr.error || pr.base === 0) return err(pr.error === 'bad_rev' ? 400 : 428, pr.error || 'precondition_required');
  const r = await db.prepare('DELETE FROM cloud_saves WHERE player_id = ? AND slot = ? AND rev = ? AND pending_at < ?').bind(me.id, slot, pr.base, now - PENDING_MS).run();
  if (!r.meta || !r.meta.changes) return conflict(db, me, slot);
  await dropPrefix(env, `saves/${me.id}/${slot}/`, 10);
  return json(200, { ok: true, slot, deleted: true });
}
async function sha256Bytes(u) { return hex(new Uint8Array(await crypto.subtle.digest('SHA-256', u))); }
/* 관리자 현황용 숫자(본문은 읽지 않는다): 슬롯 수·용량·오늘 올리기 */
export async function cloudStats(env, db, now) {
  if (!env || !env.SAVES) return { configured: false };
  try { await ensureCloud(db); const a = await db.prepare('SELECT COUNT(*) AS n, COALESCE(SUM(bytes), 0) AS b, COUNT(DISTINCT player_id) AS p FROM cloud_saves WHERE rev > 0').first() || {}; const u = await db.prepare('SELECT COALESCE(SUM(n), 0) AS n FROM cloud_usage WHERE day = ?').bind(kstDay(now)).first() || {};
    return { configured: true, slots: a.n || 0, bytes: a.b || 0, players: a.p || 0, uploads_today: u.n || 0 }; } catch (e) { return { configured: true, error: true }; }
}
