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
/* 리그 점수: 단계 × 100 + (10 − 순위) × 10. 루키 1위 90 · 마이너 10위 100 · 레전드 1위 490. 십의 자리 = 아래에 둔 팀 수라 단계를 넘어 한 줄로 비교된다 */
export const ulPts = (tier, rank, n) => Math.max(0, Math.min(UL_TIERS.length - 1, tier | 0)) * 100 + Math.max(0, (n || UL_TEAMS) - (rank | 0)) * 10;
/* 래더 시즌: 한국 시간 월요일 0시에 시작하는 2주. 기준 2026-01-12(월): 11.16(월)에 시즌이 바뀐다. 단계는 시즌이 바뀌어도 그대로, 시즌 기록(최고 단계·점수)만 새로 센다 */
export const UL_SEASON_MS = 14 * 864e5, UL_SEASON_0 = Date.UTC(2026, 0, 11, 15);
export function ulSeason(ms) { const n = Math.floor(((ms == null ? Date.now() : ms) - UL_SEASON_0) / UL_SEASON_MS), start = UL_SEASON_0 + n * UL_SEASON_MS;
  const md = t => { const d = new Date(t + 9 * 3600e3); return `${d.getUTCMonth() + 1}.${d.getUTCDate()}`; };
  return { id: 'S' + n, n, start, end: start + UL_SEASON_MS, label: `${md(start)}~${md(start + UL_SEASON_MS - 864e5)}` }; }
/* 시즌 기록에 리그 하나 더하기(새 객체). s: {id, label, n(리그 수), best(최고 단계: 승격 뒤 단계 포함), top(최고 리그 점수), sum(점수 합), win, up} */
export function ulSeasonAdd(s, sid, label, x) { const o = s && s.id === sid ? Object.assign({}, s) : { id: sid, label, n: 0, best: 0, top: 0, sum: 0, win: 0, up: 0 };
  const p = ulPts(x.tier, x.rank); o.n++; o.best = Math.max(o.best, x.tier | 0, x.to | 0); o.top = Math.max(o.top, p); o.sum += p; if (x.rank === 1) o.win++; if (x.move === 'up') o.up++; return o; }
/* 배지(칭호): 기록(hist)만으로 정한다. 본게임에는 영향이 없다 */
export const UL_BADGES = Object.freeze([
  ['up1', '첫 승격', '처음으로 승격했습니다.'],
  ['win', '리그 우승', '리그를 1위로 마쳤습니다.'],
  ['up3', '파죽지세', '세 리그 연달아 승격했습니다.'],
  ['keep5', '장기 집권', '같은 덱으로 같은 단계에서 5리그를 치렀습니다(1부 이상).'],
  ['back', '오뚝이', '강등된 바로 다음 리그에서 다시 승격했습니다.'],
  ['legend', '레전드', '레전드 단계에 올랐습니다.'],
  ['king', '레전드 우승', '레전드 리그를 1위로 마쳤습니다.'],
]);
export function ulBadges(hist) { hist = hist || []; const got = new Set(); let run = 0, keep = 0;
  hist.forEach((x, i) => { const pv = hist[i - 1];
    if (x.move === 'up') { got.add('up1'); run++; if (run >= 3) got.add('up3'); if (pv && pv.move === 'down') got.add('back'); } else run = 0;
    if (x.rank === 1) { got.add('win'); if ((x.tier | 0) === UL_TIERS.length - 1) got.add('king'); }
    if ((x.to | 0) === UL_TIERS.length - 1 || (x.tier | 0) === UL_TIERS.length - 1) got.add('legend');
    keep = pv && pv.d === x.d && pv.tier === x.tier ? keep + 1 : 1; if (keep >= 5 && (x.tier | 0) >= 2) got.add('keep5'); });
  return UL_BADGES.map(([k, n, d]) => ({ k, n, d, on: got.has(k) })); }
