/* 덱 이상치·편집 표시 거절(에디터 기획 1단계, 구단주 11-18 §8): 래더 v1·예전 KV 래더·프런트컵이 같이 쓴다.
   규칙은 공용 cupAnomaly(src/core/cup.mjs): 편집 표시(edited)·능력치 범위(20~80)·덱 OVR 분포(정상급 수)·연봉 합계.
   래더(v1·예전 KV, where 'v1'|'kv')는 구단주 11-18 "래더는 일단 상한을 두지 말고 자유롭게"로 편집 표시·능력치 범위만 본다(strict:false).
   OVR 분포(bad_ovr)·연봉 일관성(bad_pay)은 프런트컵(where 'cup')에만 남는다(같은 코드 경로라 깃발로 나눔).
   거절은 Worker 로그(wrangler tail)에 한 줄 남기고, v1은 daily_stats에도 센다(rej_코드). 오류 코드: edited(403) · bad_rating · bad_ovr · bad_pay(400) */
import { cupAnomaly } from '../../src/core/cup.mjs';
export const GUARD_MSG = {
  edited: '편집 기능을 쓴 저장의 덱은 래더·대회에 올릴 수 없습니다.',
  bad_rating: '능력치가 게임 범위를 벗어난 덱입니다.',
  bad_ovr: '게임에서 나올 수 없는 전력 분포의 덱입니다.',
  bad_pay: '연봉 기록이 선수 명단과 맞지 않는 덱입니다.',
};
export const guardStatus = a => a && a.code === 'edited' ? 403 : 400;
/* e: 받은 엔트리(ulSlim 뒤), b: 요청 본문(위쪽 edited 표시). 통과면 null, 아니면 {code, errors, n} */
export function deckGuard(e, b, where, who) {
  const a = cupAnomaly(e, { edited: !!(b && b.edited), strict: where === 'cup' }); if (a.ok) return null;
  try { console.warn('[deck_reject] ' + JSON.stringify({ where: where || '', who: String(who || '').slice(0, 24), code: a.code, n: a.n, msg: a.errors[0] || '' })); } catch (x) {}
  return a;
}
