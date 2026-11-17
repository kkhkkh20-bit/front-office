/* 요청 횟수 제한.
   1) env.V1_RL(Workers Rate Limiting 바인딩)이 있으면 그것을 먼저 쓴다(데이터센터별, 10초·60초 창만 가능. 설정은 wrangler.jsonc 주석 참고).
   2) 없으면 이 isolate 메모리에서 센다(같은 서버 인스턴스 안에서만: 대략적인 제한). DB·KV에 쓰지 않는다(쓰기 비용·개인정보).
   IP는 해시만 메모리에 잠깐 둔다. 저장하지 않는다 */
export const LIMITS = Object.freeze({
  create: [10, 3600],   // IP당 시간당 새 플레이어 10명
  write: [60, 600],     // 플레이어당 10분에 쓰기 60번(덱·결과·닉네임)
  read: [240, 600],     // 플레이어(또는 IP)당 10분에 읽기 240번
  admin: [120, 60],
});
const mem = new Map();
export function _resetRL() { mem.clear(); }
export async function limited(env, kind, key, now) {
  const [max, win] = LIMITS[kind] || [60, 60];
  if (env.V1_RL && typeof env.V1_RL.limit === 'function') {
    try { const r = await env.V1_RL.limit({ key: kind + ':' + key }); if (r && r.success === false) return true; } catch (e) {}
  }
  const slot = Math.floor(now / 1000 / win), k = kind + ':' + key + ':' + slot;
  const n = (mem.get(k) || 0) + 1; mem.set(k, n);
  if (mem.size > 20000) { for (const kk of mem.keys()) { if (!kk.endsWith(':' + slot)) mem.delete(kk); } if (mem.size > 20000) mem.clear(); }
  return n > max;
}
export async function ipKey(req, env) {
  const ip = req.headers.get('CF-Connecting-IP') || '';
  if (!ip) return 'noip';
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode((env.RL_SALT || 'fronttime-v1') + '|' + ip));
  return [...new Uint8Array(d).slice(0, 10)].map(b => b.toString(16).padStart(2, '0')).join('');
}
