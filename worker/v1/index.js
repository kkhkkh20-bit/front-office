/* 서버 v1(/api/v1/*): Cloudflare D1(env.DB) 위의 플레이어·래더 시즌·순위표·소식·맞대결. 설계: docs/design/server-v1-2026-11-17.md, 설정: docs/server-setup.md
   env.DB가 없으면 health를 포함한 모든 v1 요청이 503 not_configured → 게임은 지금의 KV 래더(/api/ladder)를 그대로 쓴다. 그래서 이 코드는 DB를 만들기 전에 배포해도 안전하다.
   로그인: Authorization: Bearer ft1.… (POST /player가 처음 한 번 준다). 관리자: Authorization: Bearer CUP_ADMIN.
     GET    /api/v1/health                        {ok, schema, season}
     POST   /api/v1/player                        새 익명 플레이어 {nickname, platform} → {player, token}. 토큰을 붙이면 닉네임·플랫폼 바꾸기
     GET    /api/v1/player/me                     DELETE /api/v1/player  (내 기록 전부 지우기)
     POST   /api/v1/player/link  {provider, ticket|code}   POST /api/v1/player/login {provider, ticket|code, platform} → 새 기기 토큰
     PUT    /api/v1/ladder/deck  {e, tier?, wid?}  GET /api/v1/ladder/opponents?tier=&ovr=&n=9
     POST   /api/v1/ladder/result {key, rank, teams, w, l, d, opps:[{pid,w,l,d}]}
     GET    /api/v1/ladder/leaderboard?tier=&season=   GET /api/v1/ladder/feed   GET /api/v1/ladder/me   GET /api/v1/ladder/rivals   GET /api/v1/ladder/h2h/PID
     관리자: GET admin/stats · GET admin/players?q= · PUT admin/hide {pid, hide} · DELETE admin/player/PID · DELETE admin/deck/PID · POST admin/season/roll · POST admin/migrate */
import { json, err, readJson, cors, originOk } from './http.js';
import { authPlayer, isAdmin, issueDevice, newPid, nickOk, platformOf, profile, PLATFORMS } from './auth.js';
import { limited, ipKey } from './ratelimit.js';
import { currentSeason, rollSeason } from './season.js';
import { putDeck, opponents, postResult, leaderboard, feed, meView, rivals, h2hWith } from './ladder.js';
import { handleAdmin, deletePlayer, migrate } from './admin.js';
import { PROVIDERS, linkReady, verify } from './link.js';
import { countDB, statStmts, takeUsage } from './usage.js';
import { SCHEMA_VERSION } from './schema.js';

let schemaOk = false, fetcher = (...a) => fetch(...a);
export function _v1Reset() { schemaOk = false; }
export function _setFetch(f) { fetcher = f || ((...a) => fetch(...a)); }

async function schemaVersion(db) {
  try { const r = await db.prepare("SELECT v FROM meta WHERE k = 'schema'").first(); return r ? +r.v : 0; } catch (e) { return 0; }
}

export async function handleV1(req, env, url, now) {
  if (req.method === 'OPTIONS') return cors(req, url, env, new Response(null, { status: originOk(req, url, env) ? 204 : 403 }));
  const res = await route(req, env, url, now);
  return cors(req, url, env, res);
}

async function route(req, env, url, now) {
  if (req.method !== 'GET' && !originOk(req, url, env)) return err(403, 'cross_origin');
  if (!env.DB) return err(503, 'not_configured', { fallback: 'kv' });
  const db = countDB(env.DB), rest = (url.pathname.replace(/\/+$/, '').match(/^\/api\/v1(?:\/(.*))?$/) || [])[1] || '';
  try {
    if (rest.startsWith('admin/') || rest === 'admin') {
      if (!isAdmin(req, env)) return err(401, 'admin');
      if (await limited(env, 'admin', 'admin', now)) return err(429, 'rate_limited');
      if (rest === 'admin/migrate' && req.method === 'POST') { const r = await migrate(db); schemaOk = true; return r; }
      if (!(await ensureSchema(db))) return err(503, 'schema_missing');
      return await handleAdmin(rest.slice(6), req, url, db, now);
    }
    if (!(await ensureSchema(db))) return err(503, 'schema_missing');
    if (rest === 'health' && req.method === 'GET') { const s = await currentSeason(db, now); return json(200, { ok: true, schema: SCHEMA_VERSION, season: { id: s.id, starts: s.starts, ends: s.ends }, platforms: PLATFORMS }); }
    /* 공개 읽기 */
    if (req.method === 'GET' && (rest === 'ladder/leaderboard' || rest === 'ladder/feed')) {
      if (await limited(env, 'read', await ipKey(req, env), now)) return err(429, 'rate_limited');
      return rest === 'ladder/feed' ? await feed(url, db, now) : await leaderboard(url, db, now);
    }
    if (rest === 'player' && req.method === 'POST') return await postPlayer(req, env, db, now);
    if (rest === 'player/login' && req.method === 'POST') return await login(req, env, db, now);
    /* 여기부터 로그인 필요 */
    const me = await authPlayer(req, db, now);
    if (!me) return err(401, 'auth');
    const write = req.method !== 'GET';
    if (await limited(env, write ? 'write' : 'read', me.id, now)) return err(429, 'rate_limited', null, { 'Retry-After': '60' });
    if (rest === 'player/me' && req.method === 'GET') return json(200, { ok: true, player: profile(me) });
    if (rest === 'player' && req.method === 'DELETE') { await deletePlayer(db, me.id); return json(200, { ok: true, deleted: me.id }); }
    if (rest === 'player/link' && req.method === 'POST') return await link(req, env, db, me, now);
    if (rest === 'ladder/deck' && req.method === 'PUT') return await putDeck(req, db, me, now, env);
    if (rest === 'ladder/deck' && req.method === 'DELETE') { await db.prepare('DELETE FROM decks WHERE player_id = ?').bind(me.id).run(); return json(200, { ok: true }); }
    if (rest === 'ladder/opponents' && req.method === 'GET') return await opponents(url, db, me, now, env);
    if (rest === 'ladder/result' && req.method === 'POST') return await postResult(req, db, me, now);
    if (rest === 'ladder/me' && req.method === 'GET') return await meView(db, me, now);
    if (rest === 'ladder/rivals' && req.method === 'GET') return await rivals(db, me);
    const hm = rest.match(/^ladder\/h2h\/([^/]+)$/); if (hm && req.method === 'GET') return await h2hWith(db, me, decodeURIComponent(hm[1]));
    return err(404, 'not_found');
  } catch (e) {
    if (/no such table/i.test(String(e && e.message))) { schemaOk = false; return err(503, 'schema_missing'); }
    return err(500, 'server');
  }
}
async function ensureSchema(db) { if (schemaOk) return true; schemaOk = (await schemaVersion(db)) >= 1; return schemaOk; }

/* 새 익명 플레이어 / 토큰이 있으면 닉네임·플랫폼 바꾸기 */
async function postPlayer(req, env, db, now) {
  const { body: b, error } = await readJson(req, 4096); if (error) return err(400, error);
  const me = await authPlayer(req, db, now);
  if (!me && req.headers.get('Authorization')) return err(401, 'auth');
  const platform = platformOf(b.platform || req.headers.get('X-FT-Client'));
  if (me) {
    if (await limited(env, 'write', me.id, now)) return err(429, 'rate_limited');
    if (b.nickname != null && b.nickname !== me.nickname) {
      const nick = nickOk(b.nickname); if (!nick) return err(400, 'bad_name');
      if (now - me.nick_at < 86400e3) return err(429, 'name_wait');
      await db.prepare('UPDATE players SET nickname = ?, nick_at = ?, platform = ? WHERE id = ?').bind(nick, now, platform, me.id).run(); me.nickname = nick;
    }
    return json(200, { ok: true, player: profile(me) });
  }
  if (await limited(env, 'create', await ipKey(req, env), now)) return err(429, 'rate_limited', null, { 'Retry-After': '3600' });
  const nick = nickOk(b.nickname); if (!nick) return err(400, 'bad_name');
  const pid = newPid(), dev = await issueDevice(db, pid, platform, now);
  const wid = /^w[0-9a-f]{16}$/.test(String(b.wid || '')) ? b.wid : null;
  await db.batch([db.prepare('INSERT INTO players (id, nickname, platform, created, last_seen, nick_at, wid) VALUES (?, ?, ?, ?, ?, 0, ?)').bind(pid, nick, platform, now, now, wid), dev.stmt,
    ...statStmts(db, now, Object.assign({ players_new: 1, active: 1, ['act:' + platform]: 1 }, takeUsage()))]);
  return json(201, { ok: true, player: { id: pid, nickname: nick, platform, created: now, hidden: false }, token: dev.token });
}
async function link(req, env, db, me, now) {
  const { body: b, error } = await readJson(req, 16384); if (error) return err(400, error);
  const provider = String(b.provider || ''); if (!PROVIDERS.includes(provider) || !linkReady(env, provider)) return err(501, 'not_implemented', { providers: PROVIDERS.filter(p => linkReady(env, p)) });
  const v = await verify(env, provider, b, fetcher); if (v.error) return err(v.error === 'not_implemented' ? 501 : 400, v.error);
  const cur = await db.prepare('SELECT player_id FROM identities WHERE provider = ? AND provider_uid = ?').bind(provider, v.uid).first();
  if (cur && cur.player_id !== me.id) return err(409, 'linked_other');
  if (!cur) await db.prepare('INSERT INTO identities (provider, provider_uid, player_id, created) VALUES (?, ?, ?, ?)').bind(provider, v.uid, me.id, now).run();
  return json(200, { ok: true, provider, linked: true });
}
/* 새 기기에서: 연결한 계정으로 같은 플레이어의 새 토큰 받기 */
async function login(req, env, db, now) {
  if (await limited(env, 'create', await ipKey(req, env), now)) return err(429, 'rate_limited');
  const { body: b, error } = await readJson(req, 16384); if (error) return err(400, error);
  const provider = String(b.provider || ''); if (!PROVIDERS.includes(provider) || !linkReady(env, provider)) return err(501, 'not_implemented');
  const v = await verify(env, provider, b, fetcher); if (v.error) return err(v.error === 'not_implemented' ? 501 : 400, v.error);
  const cur = await db.prepare('SELECT p.* FROM identities i JOIN players p ON p.id = i.player_id WHERE i.provider = ? AND i.provider_uid = ?').bind(provider, v.uid).first();
  if (!cur) return err(404, 'not_found');
  const dev = await issueDevice(db, cur.id, platformOf(b.platform), now); await dev.stmt.run();
  return json(200, { ok: true, player: profile(cur), token: dev.token });
}

/* Cron Trigger(선택): 매일 한 번 시즌 교체를 확인한다. 트리거가 없어도 요청이 들어올 때 같은 일을 한다 */
export async function scheduledV1(env, now) {
  if (!env.DB) return;
  const db = countDB(env.DB); if (!(await ensureSchema(db))) return;
  await currentSeason(db, now);
}
export { rollSeason };
