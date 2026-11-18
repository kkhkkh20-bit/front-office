/* 서버 v1(/api/v1/*): Cloudflare D1(env.DB) 위의 플레이어·래더 시즌·순위표·소식·맞대결. 설계: docs/design/server-v1-2026-11-17.md, 설정: docs/server-setup.md
   env.DB가 없으면 health를 포함한 모든 v1 요청이 503 not_configured → 게임은 지금의 KV 래더(/api/ladder)를 그대로 쓴다. 그래서 이 코드는 DB를 만들기 전에 배포해도 안전하다.
   로그인: Authorization: Bearer ft1.… (POST /player가 처음 한 번 준다). 관리자: Authorization: Bearer CUP_ADMIN.
     GET    /api/v1/health                        {ok, schema, season}
     POST   /api/v1/player                        새 익명 플레이어 {nickname, platform} → {player, token}. 토큰을 붙이면 닉네임·플랫폼 바꾸기
     GET    /api/v1/player/me                     DELETE /api/v1/player  (내 기록 전부 지우기)
     POST   /api/v1/player/link  {provider, ticket|code}   POST /api/v1/player/login {provider, ticket|code, platform} → 새 기기 토큰
     PUT    /api/v1/ladder/deck  {e, tier?, wid?, auto?, man?, dev?}  PUT /api/v1/ladder/auto {on}  POST /api/v1/ladder/live {key, tier, round, post, teams, st} (래더 v4: worker/v1/ladauto.js)  GET /api/v1/ladder/opponents?tier=&ovr=&n=9
     POST   /api/v1/ladder/result {key, rank, teams, w, l, d, opps:[{pid,w,l,d}], ps?, rec?}
     GET    /api/v1/ladder/leaderboard?tier=|all&season=   GET /api/v1/ladder/feed   GET /api/v1/ladder/meta?tier=|all (덱 구성 집계, 10분 캐시)   GET /api/v1/ladder/records?season=&tier=|all (기록실: 시즌 개인·팀 순위·우승 벽, 120초 캐시)   GET /api/v1/ladder/me   GET /api/v1/ladder/rivals   GET /api/v1/ladder/h2h/PID
     클라우드 저장(R2 env.SAVES, 없으면 503 not_configured): GET cloud · GET/PUT/DELETE saves[/SLOT] · POST player/link-code[/redeem] · POST player/recovery[/redeem] · GET player/devices · PUT player/devices/me · DELETE player/devices/ID (worker/v1/cloud.js)
     관리자: GET admin/stats · GET admin/export?kind=decks|results&n=&cursor=&from=&to= (CSV용 줄, 페이지) · GET admin/players?q= · PUT admin/hide {pid, hide} · DELETE admin/player/PID · DELETE admin/deck/PID · POST admin/season/roll · POST admin/migrate · GET admin/dash · GET admin/decks?q=&tier= · GET admin/league?id=|live= (래더 v4 한눈 보기)
   계정 연결과 기기 토큰(srv2 #64): 연결(POST player/link)은 지금 플레이어에 계정을 붙일 뿐 토큰을 바꾸지 않는다. 그래서 연결 전의 익명 기기 토큰과
     새 기기에서 login으로 받은 토큰이 모두 같은 플레이어로 풀린다(기기마다 devices 한 줄). 다른 익명 플레이어가 있는 기기에서 login하면 그 기기는 받은 토큰으로
     바꿔 쓰면 되고, 예전 익명 플레이어는 따로 남는다(합치지 않는다. 원하면 DELETE /player). 한 계정은 한 플레이어에만: 이미 다른 플레이어에 붙어 있으면 409 linked_other(동시에 와도 하나만 성공).
   CORS(srv2 #65): 허용한 앱 출처(V1_ORIGINS)면 401·429·503·500·OPTIONS에도 CORS 머리글을 붙여 앱이 진짜 오류를 본다. Retry-After도 읽을 수 있다 */
import { json, err, readJson, cors, originOk } from './http.js';
import { authPlayer, isAdmin, issueDevice, newPid, nickOk, platformOf, profile, PLATFORMS } from './auth.js';
import { limited, ipKey } from './ratelimit.js';
import { currentSeason, rollSeason } from './season.js';
import { putDeck, opponents, postResult, leaderboard, feed, meView, rivals, h2hWith, meta } from './ladder.js';
import { handleAdmin, deletePlayer, deleteDeck, migrate } from './admin.js';
import { PROVIDERS, linkReady, verify } from './link.js';
import { countDB, statStmts, takeUsage } from './usage.js';
import { SCHEMA_VERSION } from './schema.js';
import { cloudPublic, cloudRoute, _cloudReset } from './cloud.js';
import { records, _recReset } from './records.js';
import { cacheGen } from './ladder.js';
import { autoSet, livePut, _autoReset } from './ladauto.js';

let schemaOk = false, fetcher = (...a) => fetch(...a);
export function _v1Reset() { schemaOk = false; _cloudReset(); _recReset(); _autoReset(); }
export function _setFetch(f) { fetcher = f || ((...a) => fetch(...a)); }

async function schemaVersion(db) {
  try { const r = await db.prepare("SELECT v FROM meta WHERE k = 'schema'").first(); return r ? +r.v : 0; } catch (e) { return 0; }
}

export async function handleV1(req, env, url, now) {
  if (req.method === 'OPTIONS') return cors(req, url, env, new Response(null, { status: originOk(req, url, env) ? 204 : 403 }));
  let res; try { res = await route(req, env, url, now); } catch (e) { res = err(500, 'server'); try { if (env.DB) await env.DB.batch(statStmts(env.DB, now, { err5: 1 })); } catch (x) {} } /* 어떤 오류든 CORS를 붙여 돌려준다. 500은 daily_stats err5로 센다(관리자 대시보드 상태 칸) */
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
      return await handleAdmin(rest.slice(6), req, url, db, now, env);
    }
    if (!(await ensureSchema(db))) return err(503, 'schema_missing');
    if (rest === 'health' && req.method === 'GET') { const s = await currentSeason(db, now); return json(200, { ok: true, schema: SCHEMA_VERSION, season: { id: s.id, starts: s.starts, ends: s.ends }, platforms: PLATFORMS }); }
    /* 공개 읽기 */
    if (req.method === 'GET' && (rest === 'ladder/leaderboard' || rest === 'ladder/feed' || rest === 'ladder/meta' || rest === 'ladder/records')) {
      if (await limited(env, 'read', await ipKey(req, env), now)) return err(429, 'rate_limited');
      if (rest === 'ladder/records') return await records(url, db, now, await currentSeason(db, now), await cacheGen(db, now)); /* 래더 기록실(사용자 11-18) */
      return rest === 'ladder/feed' ? await feed(url, db, now) : rest === 'ladder/meta' ? await meta(url, db, now) : await leaderboard(url, db, now);
    }
    if (rest === 'player' && req.method === 'POST') return await postPlayer(req, env, db, now);
    if (rest === 'player/login' && req.method === 'POST') return await login(req, env, db, now);
    { const c = await cloudPublic(rest, req, env, db, now); if (c) return c; } /* 클라우드 저장: 기능 확인·코드로 기기 연결(로그인 없이) */
    /* 여기부터 로그인 필요 */
    const me = await authPlayer(req, db, now);
    if (!me) return err(401, 'auth');
    const write = req.method !== 'GET';
    if (await limited(env, write ? 'write' : 'read', me.id, now)) return err(429, 'rate_limited', null, { 'Retry-After': '60' });
    if (rest === 'player/me' && req.method === 'GET') return json(200, { ok: true, player: profile(me) });
    if (rest === 'player' && req.method === 'DELETE') { await deletePlayer(db, me.id, env); return json(200, { ok: true, deleted: me.id }); } /* 클라우드 저장(R2 본문)까지 */
    { const c = await cloudRoute(rest, req, env, db, me, now); if (c) return c; }
    if (rest === 'player/link' && req.method === 'POST') return await link(req, env, db, me, now);
    if (rest === 'ladder/deck' && req.method === 'PUT') return await putDeck(req, db, me, now, env);
    if (rest === 'ladder/deck' && req.method === 'DELETE') { await deleteDeck(db, me.id); return json(200, { ok: true }); }
    if (rest === 'ladder/auto' && req.method === 'PUT') return await autoSet(req, db, me, now); /* 래더 v4: 자동 참가 켜기·끄기(끄면 서버 덱 지움) */
    if (rest === 'ladder/live' && req.method === 'POST') return await livePut(req, db, me, now); /* 진행 중 리그(관리자 한눈 보기) */
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
  const said = b.platform || req.headers.get('X-FT-Client'), platform = platformOf(said);
  if (me) {
    if (await limited(env, 'write', me.id, now)) return err(429, 'rate_limited');
    /* 닉네임과 플랫폼을 따로 본다(srv2 #38: 플랫폼만 바뀐 요청도 반영). 플랫폼을 안 보내면 그대로 둔다 */
    let nick = null;
    if (b.nickname != null && b.nickname !== me.nickname) {
      nick = nickOk(b.nickname); if (!nick) return err(400, 'bad_name');
      if (nick === me.nickname) nick = null; else if (now - me.nick_at < 86400e3) return err(429, 'name_wait');
    }
    const plat = said && platform !== me.platform ? platform : null;
    if (nick || plat) {
      await db.prepare('UPDATE players SET nickname = COALESCE(?, nickname), nick_at = CASE WHEN ? IS NULL THEN nick_at ELSE ? END, platform = COALESCE(?, platform) WHERE id = ?').bind(nick, nick, now, plat, me.id).run();
      if (nick) { me.nickname = nick; me.nick_at = now; } if (plat) me.platform = plat;
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
  /* srv2 #63: 확인-후-넣기 사이에 다른 플레이어가 끼어들 수 있어서, 먼저 넣어 보고(이미 있으면 그대로) 주인을 다시 읽는다 → 하나만 성공, 다른 쪽은 409 */
  await db.prepare('INSERT INTO identities (provider, provider_uid, player_id, created) SELECT ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM players WHERE id = ?) ON CONFLICT (provider, provider_uid) DO NOTHING').bind(provider, v.uid, me.id, now, me.id).run();
  const cur = await db.prepare('SELECT player_id FROM identities WHERE provider = ? AND provider_uid = ?').bind(provider, v.uid).first();
  if (!cur) return err(401, 'auth'); /* 그 사이 지운 플레이어 */
  if (cur.player_id !== me.id) return err(409, 'linked_other');
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
