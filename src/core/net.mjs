/* 서버 v1(/api/v1) 연결부: 웹·안드로이드(TWA/Capacitor)·스팀(Electron/Tauri 포장)이 같은 코드를 쓴다. 게임 상태(G)·화면을 참조하지 않는다.
   유저 래더 화면이 기본으로 쓴다(사용자 11-17 "화면도 새 서버로 바로 전환해"). 끄기(시험·문제 생겼을 때): localStorage 'fo-net-v1' = '0' 또는 주소 ?net=kv.
   주소 ?net=v1 은 '0'이어도 켠다. 화면 연결 순서: docs/design/server-v1-2026-11-17.md 12절.
   - base: 웹은 ''(같은 출처). 앱 포장은 배포 주소(예 'https://fronttime.example.workers.dev')를 넣는다(서버 V1_ORIGINS에 앱 출처도 넣어야 한다).
   - 재시도: 연결 실패·5xx(503 not_configured 제외)는 2번까지 다시(0.4초, 1.2초). 429는 다시 하지 않는다.
   - 오프라인: 리그 결과는 못 보내면 기기에 줄 세워 두었다가(최대 20개) 다음 연결 때 보낸다. 같은 key는 서버가 한 번만 센다.
   - 서버가 v1을 아직 안 켰으면(503 not_configured) status='off' → 화면은 지금의 KV 래더(/api/ladder)를 그대로 쓴다. */
export const NET_V = 1;
export const NET_FLAG = 'fo-net-v1', NET_TOKEN = 'fo-net-v1-token', NET_PLAYER = 'fo-net-v1-player', NET_QUEUE = 'fo-net-v1-queue', NET_QMAX = 20;
const g = () => (typeof globalThis !== 'undefined' ? globalThis : {});
function store(s) {
  s = s || (() => { try { return g().localStorage || null; } catch (e) { return null; } })();
  return { get: k => { try { return s ? s.getItem(k) : null; } catch (e) { return null; } }, set: (k, v) => { try { if (s) v == null ? s.removeItem(k) : s.setItem(k, v); } catch (e) {} } };
}
export function netEnabled(storage, search) {
  try { search = String((search ?? (g().location ? g().location.search : '')) || ''); } catch (e) { search = ''; }
  const q = (search.match(/(?:^|[?&])net=([^&]*)/) || [])[1];
  if (q === 'v1') return true; if (q === 'kv' || q === 'off' || q === '0') return false;
  return store(storage).get(NET_FLAG) !== '0';
}
/* 이 기기에서 서버 v1 끄기/다시 켜기(서버 기록 지우기 뒤 자동으로 다시 만들지 않게) */
export function netSetEnabled(on, storage) { store(storage).set(NET_FLAG, on ? null : '0'); }
/* 플랫폼: 앱 포장이 window.FT_PLATFORM을 정하면 그것, 아니면 흔적으로 추정 */
export function netPlatform(w) {
  w = w || g();
  try {
    const f = String(w.FT_PLATFORM || '').toLowerCase(); if (['web', 'android', 'steam'].includes(f)) return f;
    if (w.Capacitor && typeof w.Capacitor.getPlatform === 'function' && w.Capacitor.getPlatform() === 'android') return 'android';
    if (w.__TAURI__ || w.steamworks || (w.process && w.process.versions && w.process.versions.electron)) return 'steam';
    const ua = String((w.navigator && w.navigator.userAgent) || ''); if (/Electron\//.test(ua)) return 'steam';
    if (w.document && /^android-app:/.test(String(w.document.referrer || ''))) return 'android';
  } catch (e) {}
  return 'web';
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

export function netCreate(o) {
  o = o || {};
  const st = store(o.storage), fetchFn = o.fetch || ((...a) => g().fetch(...a)), base = String(o.base ?? '').replace(/\/+$/, ''), platform = o.platform || netPlatform(), client = `${platform}/${o.version || NET_V}`;
  const retries = o.retries ?? 2, wait = o.sleep || sleep, timeout = o.timeout || 8000;
  const N = { status: 'unknown', platform, base, last: null };
  const token = () => st.get(NET_TOKEN);
  N.player = () => { try { return JSON.parse(st.get(NET_PLAYER) || 'null'); } catch (e) { return null; } };
  N.signedIn = () => !!token();
  N.forget = () => { st.set(NET_TOKEN, null); st.set(NET_PLAYER, null); st.set(NET_QUEUE, null); };
  /* → {ok, status, data, offline} (던지지 않는다) */
  N.call = async (method, path, body, c) => {
    c = c || {}; const h = { 'X-FT-Client': client }; if (body != null) h['Content-Type'] = 'application/json';
    if (c.auth !== false && token()) h.Authorization = 'Bearer ' + token();
    const tries = c.retries ?? retries;
    for (let i = 0; ; i++) {
      let r = null, data = null;
      try {
        const ac = typeof AbortController !== 'undefined' ? new AbortController() : null, t = ac ? setTimeout(() => ac.abort(), timeout) : null;
        try { r = await fetchFn(base + '/api/v1' + path, { method, headers: h, body: body == null ? undefined : JSON.stringify(body), cache: 'no-store', credentials: base ? 'omit' : 'same-origin', signal: ac ? ac.signal : undefined }); }
        finally { if (t) clearTimeout(t); }
        try { data = await r.json(); } catch (e) { data = null; }
      } catch (e) { r = null; }
      if (r && r.status === 503 && data && data.error === 'not_configured') { N.status = 'off'; return N.last = { ok: false, status: 503, data, off: true }; }
      if (r && r.status < 500) { if (r.ok) N.status = 'ok'; return N.last = { ok: r.ok, status: r.status, data }; }
      if (i >= tries) { if (!r) N.status = 'offline'; return N.last = { ok: false, status: r ? r.status : 0, data, offline: !r }; }
      await wait(400 * Math.pow(3, i));
    }
  };
  N.probe = async () => { const r = await N.call('GET', '/health', null, { auth: false, retries: 0 }); if (r.ok) N.season = r.data.season; return N.status; };
  /* 처음이면 익명 플레이어를 만든다. 닉네임은 처음 한 번 */
  N.ensurePlayer = async (nickname, extra) => {
    if (token()) return { ok: true, data: { player: N.player() } };
    const r = await N.call('POST', '/player', Object.assign({ nickname, platform }, extra || {}), { auth: false, retries: 1 });
    if (r.ok && r.data && r.data.token) { st.set(NET_TOKEN, r.data.token); st.set(NET_PLAYER, JSON.stringify(r.data.player)); }
    return r;
  };
  N.rename = async nickname => { const r = await N.call('POST', '/player', { nickname, platform }); if (r.ok) st.set(NET_PLAYER, JSON.stringify(r.data.player)); return r; };
  N.putDeck = (e, tier, wid) => N.call('PUT', '/ladder/deck', { e, tier, wid });
  N.opponents = q => N.call('GET', '/ladder/opponents?' + new URLSearchParams(Object.assign({ n: 9 }, q || {})));
  N.leaderboard = (tier, season) => N.call('GET', `/ladder/leaderboard?tier=${tier === 'all' ? 'all' : tier | 0}${season ? '&season=' + (season | 0) : ''}`, null, { auth: false });
  N.meta = tier => N.call('GET', `/ladder/meta?tier=${tier === 'all' || tier == null ? 'all' : tier | 0}`, null, { auth: false }); /* 덱 구성 집계(래더 v2, 10분 캐시) */
  N.feed = () => N.call('GET', '/ladder/feed', null, { auth: false });
  N.me = () => N.call('GET', '/ladder/me');
  N.rivals = () => N.call('GET', '/ladder/rivals');
  N.h2h = pid => N.call('GET', '/ladder/h2h/' + encodeURIComponent(pid));
  /* 서버 기록 지우기(DELETE /player): 플레이어·덱·시즌·결과·맞대결·소식 전부. 지우면 이 기기 토큰도 버린다 */
  N.deleteMe = async () => { if (!token()) return { ok: true, status: 200, data: { ok: true, none: true } }; const r = await N.call('DELETE', '/player', null, { retries: 1 }); if (r.ok || r.status === 401) N.forget(); return r; };
  N.queue = () => { try { return JSON.parse(st.get(NET_QUEUE) || '[]'); } catch (e) { return []; } };
  /* 리그 결과: {key, rank, teams, w, l, d, opps}. 연결이 안 되면 줄에 넣는다 */
  N.result = async sum => {
    const r = await N.call('POST', '/ladder/result', sum);
    if (!r.ok && (r.offline || r.status >= 500) && !r.off) { const q = N.queue().filter(x => x.key !== sum.key); q.push(sum); st.set(NET_QUEUE, JSON.stringify(q.slice(-NET_QMAX))); r.queued = true; }
    else if (r.ok) await N.flush();
    return r;
  };
  N.flush = async () => {
    const q = N.queue(); if (!q.length) return 0; let sent = 0; const left = [];
    for (const s of q) { const r = await N.call('POST', '/ladder/result', s, { retries: 0 }); if (r.ok || (r.status >= 400 && r.status < 500 && r.status !== 429)) sent++; else left.push(s); }
    st.set(NET_QUEUE, left.length ? JSON.stringify(left) : null); return sent;
  };
  return N;
}
