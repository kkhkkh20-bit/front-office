/* 유저 래더(덱 리그) 공용 규칙: 단계·승강·상대 고르기·기록 요약. 게임 상태(G)·화면을 참조하지 않는다. 게임과 Worker(/api/ladder)가 같은 코드를 쓴다.
   덱 = 프런트컵 엔트리 형식(src/core/cup.mjs) 그대로. 리그 = 내 덱 + 같은 단계 덱 9개, 짝마다 3연전(팀당 27경기). 1·2위 승격, 9·10위 강등.
   리그는 유저 기기에서 돈다(평범한 난수). 결과 조작은 신경 쓰지 않는다(구단주: 래더는 덱 전력을 재는 곳) */
export const UL_V = 1;
export const UL_TIERS = Object.freeze(['루키', '마이너', '1부', '챔피언스', '레전드']);
export const UL_TEAMS = 10, UL_UP = 2, UL_DOWN = 2;
/* 단계별 AI 덱 기준 OVR(총): 그 단계 등록 덱이 모자랄 때 채우는 AI 구단 전력. 서버가 그 단계 평균을 주면 그 값을 쓴다 */
export const UL_TIER_OVR = Object.freeze([60, 63, 66, 69, 72]);
export const ulTierName = t => UL_TIERS[Math.max(0, Math.min(UL_TIERS.length - 1, t | 0))];
/* 승강: 1·2위 한 단계 위(레전드는 그대로), 9·10위 한 단계 아래(루키는 그대로), 나머지 그대로 */
export function ulTierAfter(tier, rank, n) {
  n = n || UL_TEAMS; tier = Math.max(0, Math.min(UL_TIERS.length - 1, tier | 0));
  if (rank <= UL_UP) return { tier: Math.min(UL_TIERS.length - 1, tier + 1), move: tier < UL_TIERS.length - 1 ? 'up' : 'stay' };
  if (rank > n - UL_DOWN) return { tier: Math.max(0, tier - 1), move: tier > 0 ? 'down' : 'stay' };
  return { tier, move: 'stay' };
}
/* 상대 고르기: 같은 단계에서 내 OVR과 가장 가까운 덱부터 n개(같으면 최근 등록 먼저). list: [{wid, ovr:{t}, at}] */
export function ulPick(list, myOvr, n, skip) {
  const no = new Set(skip || []);
  return (list || []).filter(x => x && !no.has(x.wid) && !x.hide).map(x => [Math.abs(((x.ovr && x.ovr.t) || 0) - (myOvr || 0)), x])
    .sort((a, b) => a[0] - b[0] || (b[1].at || 0) - (a[1].at || 0)).slice(0, Math.max(0, n | 0)).map(x => x[1]);
}
/* 서버에 올릴 덱: 사진(f)·세계 id·지난 성적처럼 경기에 안 쓰는 값을 빼서 작게(약 8KB) */
export function ulSlim(e) {
  const x = JSON.parse(JSON.stringify(e || {})); delete x.wid; delete x.ts; delete x.at; delete x.flags;
  if (x.club) { delete x.club.badge; } for (const p of x.P || []) delete p.f; return x;
}
/* 기록 요약: hist [{tier(그 리그 단계), rank, to(다음 단계), move, d(등록한 덱 번호: 리그 중 고쳐도 같은 덱), name, at}]
   → 단계별 리그 수·우승·승격·강등, 최고 단계, 마지막 덱이 그 단계에서 연달아 치른 리그 수(stay) */
export function ulSummary(hist, cur) {
  hist = hist || []; const by = UL_TIERS.map(() => ({ n: 0, win: 0, up: 0, down: 0 })); let best = cur | 0;
  for (const x of hist) { const b = by[x.tier | 0]; if (!b) continue; b.n++; if (x.rank === 1) b.win++; if (x.move === 'up') b.up++; if (x.move === 'down') b.down++; best = Math.max(best, x.tier | 0, x.to | 0); }
  const last = hist[hist.length - 1]; let n = 0;
  if (last) for (let i = hist.length - 1; i >= 0 && hist[i].d === last.d && hist[i].tier === last.tier; i--) n++;
  return { leagues: hist.length, best, by, stay: last ? { tier: last.tier, n, name: last.name } : null };
}
