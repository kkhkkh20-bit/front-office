/* 계정 연결(나중에 앱을 낼 때 켠다). 비밀값이 없으면 501 not_implemented.
   스팀: 게임(Steamworks)이 GetAuthTicketForWebApi('fronttime')로 받은 티켓(16진수) → 서버가 ISteamUserAuth/AuthenticateUserTicket로 확인 → steamid.
     비밀값 STEAM_WEB_API_KEY(퍼블리셔 키), 변수 STEAM_APP_ID. 주소는 partner.steam-api.com(퍼블리셔 키 전용).
   구글 플레이 게임즈(PGS v2): 앱이 requestServerSideAccess로 받은 server auth code → oauth2.googleapis.com/token 교환 → games/v1/players/me의 playerId.
     비밀값 GPGS_CLIENT_SECRET, 변수 GPGS_CLIENT_ID(웹 애플리케이션 OAuth 클라이언트).
   확인한 계정 id는 identities(provider, provider_uid)에 한 번만: 다른 플레이어에 이미 붙어 있으면 409 */
export const PROVIDERS = ['steam', 'gpgs'];
export const STEAM_IDENTITY = 'fronttime';

export function linkReady(env, provider) {
  if (provider === 'steam') return !!(env.STEAM_WEB_API_KEY && env.STEAM_APP_ID);
  if (provider === 'gpgs') return !!(env.GPGS_CLIENT_ID && env.GPGS_CLIENT_SECRET);
  return false;
}
/* → {uid} | {error} */
export async function verify(env, provider, b, fetcher = fetch) {
  try {
    if (provider === 'steam') {
      const ticket = String(b.ticket || ''); if (!/^[0-9a-fA-F]{16,4096}$/.test(ticket)) return { error: 'link_failed' };
      const u = 'https://partner.steam-api.com/ISteamUserAuth/AuthenticateUserTicket/v1/?' + new URLSearchParams({ key: env.STEAM_WEB_API_KEY, appid: String(env.STEAM_APP_ID), ticket, identity: STEAM_IDENTITY });
      const j = await (await fetcher(u)).json(); const p = j && j.response && j.response.params;
      if (!p || p.result !== 'OK' || !/^\d{17}$/.test(String(p.steamid || ''))) return { error: 'link_failed' };
      if (p.vacbanned || p.publisherbanned) return { error: 'link_failed' };
      return { uid: String(p.steamid) };
    }
    if (provider === 'gpgs') {
      const code = String(b.code || ''); if (!code || code.length > 2048) return { error: 'link_failed' };
      const t = await (await fetcher('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'authorization_code', code, client_id: env.GPGS_CLIENT_ID, client_secret: env.GPGS_CLIENT_SECRET, redirect_uri: '' }) })).json();
      if (!t || !t.access_token) return { error: 'link_failed' };
      const me = await (await fetcher('https://games.googleapis.com/games/v1/players/me', { headers: { Authorization: 'Bearer ' + t.access_token } })).json();
      if (!me || !/^[\w-]{4,64}$/.test(String(me.playerId || ''))) return { error: 'link_failed' };
      return { uid: String(me.playerId) };
    }
  } catch (e) { return { error: 'link_failed' }; }
  return { error: 'not_implemented' };
}
