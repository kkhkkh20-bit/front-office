/* 신원: 익명 플레이어(기기에서 처음 한 번 만들고 토큰을 기기에 둔다) → 나중에 구글 플레이 게임즈·스팀 계정을 같은 플레이어에 연결(identities).
   토큰 'ft1.' + 32자 16진수. 서버에는 SHA-256 해시만 둔다(devices.secret_hash). 플레이어 하나에 기기 여러 개. 관리자 키(CUP_ADMIN)와는 모양이 달라 섞이지 않는다 */
import { cupName, cupBadName } from '../../src/core/cup.mjs';
import { kstDay } from './http.js';
import { statStmts } from './usage.js';

export const PID = /^p[0-9a-f]{16}$/, TOKEN = /^ft1\.[0-9a-f]{32}$/;
export const PLATFORMS = ['web', 'android', 'steam'];
const hex = a => [...a].map(b => b.toString(16).padStart(2, '0')).join('');
export const newPid = () => 'p' + hex(crypto.getRandomValues(new Uint8Array(8)));
export const newToken = () => 'ft1.' + hex(crypto.getRandomValues(new Uint8Array(16)));
export async function sha256(s) { return hex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))); }
export const platformOf = s => PLATFORMS.includes(String(s || '').toLowerCase()) ? String(s).toLowerCase() : 'web';
/* 닉네임: 팀명 규칙(프런트컵)과 같은 정리·금칙어, 2~12자 */
export function nickOk(s) { const n = cupName(s); return n.length >= 2 && !cupBadName(n) ? n : ''; }

export function bearer(req) { const a = req.headers.get('Authorization') || ''; return a.startsWith('Bearer ') ? a.slice(7).trim() : ''; }
export function isAdmin(req, env) { return !!env.CUP_ADMIN && bearer(req) === String(env.CUP_ADMIN); }

/* 토큰 → 플레이어. 그날 처음이면 last_seen을 고치고 일별 활성 수를 더한다(하루 한 번만 쓰기) */
export async function authPlayer(req, db, now) {
  const t = bearer(req); if (!TOKEN.test(t)) return null;
  const h = await sha256(t);
  const p = await db.prepare('SELECT p.id, p.nickname, p.platform, p.created, p.last_seen, p.nick_at, p.hidden, p.wid, d.platform AS dplat FROM devices d JOIN players p ON p.id = d.player_id WHERE d.secret_hash = ?').bind(h).first();
  if (!p) return null;
  p.secret_hash = h;
  if (kstDay(p.last_seen) !== kstDay(now)) {
    await db.batch([
      db.prepare('UPDATE players SET last_seen = ? WHERE id = ?').bind(now, p.id),
      db.prepare('UPDATE devices SET last_seen = ? WHERE secret_hash = ?').bind(now, h),
      ...statStmts(db, now, { active: 1, ['act:' + platformOf(p.dplat)]: 1 }),
    ]);
    p.last_seen = now;
  }
  return p;
}
export async function issueDevice(db, pid, platform, now) {
  const token = newToken();
  return { token, stmt: db.prepare('INSERT INTO devices (secret_hash, player_id, platform, created, last_seen) VALUES (?, ?, ?, ?, ?)').bind(await sha256(token), pid, platform, now, now) };
}
export const profile = p => ({ id: p.id, nickname: p.nickname, platform: p.platform, created: p.created, hidden: !!p.hidden });
