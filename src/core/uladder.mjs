/* 유저 래더(덱 리그) 공용 규칙: 단계·승강·상대 고르기·기록 요약. 게임 상태(G)·화면을 참조하지 않는다. 게임과 Worker(/api/ladder)가 같은 코드를 쓴다.
   덱 = 프런트컵 엔트리 형식(src/core/cup.mjs) 그대로. 리그 = 내 덱 + 같은 단계 덱 9개, 짝마다 3연전(팀당 27경기). 1·2위 승격, 9·10위 강등.
   리그는 유저 기기에서 돈다(평범한 난수). 결과 조작은 신경 쓰지 않는다(구단주: 래더는 덱 전력을 재는 곳) */
import { dv } from './ratings.mjs';
import { cupPayCheck, cupValidate, cupWon } from './cup.mjs';
export const UL_V = 2; /* 2: 래더 v2(선수·상대 누적 기록, 사용자 11-17) */
export const UL_TIERS = Object.freeze(['루키', '마이너', '1부', '챔피언스', '레전드']);
export const UL_TEAMS = 10, UL_UP = 2, UL_DOWN = 2;
/* 단계별 AI 덱 기준 OVR(총): 그 단계 등록 덱이 모자랄 때 채우는 AI 구단 전력(사용자 11-17 "레더 ai 도 챔피언스 이런곳은 고 오버롤로").
   예전 60·63·66·69·72는 실제 등록 덱(서버 11-17: 루키 평균 74.3, 레전드 77.5~82.5)보다 한참 약해 윗단계가 쉬웠다.
   새 게임 1군 63~68(시드 6개)이 루키·마이너를 넘고, 1부부터는 덱을 다듬어야 하며, 챔피언스·레전드는 상한 안에서 잘 짠 덱(실제 78~79 덱이 1군 연봉 1~1.3배 수준)이라야 이긴다.
   서버가 그 단계 평균(등록 덱 3개 이상)을 주면 기준 ~ 기준+3 안에서 그 값을 쓴다(ulAiTarget) */
export const UL_TIER_OVR = Object.freeze([62, 66, 70, 75, 79]);
export const ulAiTarget = (tier, avg, count) => { const b = UL_TIER_OVR[Math.max(0, Math.min(UL_TIER_OVR.length - 1, tier | 0))]; return avg && count >= 3 ? Math.max(b, Math.min(b + 3, Math.round(avg))) : b; };
/* 한 리그 AI 9팀의 OVR 벌림(평균 0): 모두 같은 전력이면 순위표가 밋밋하다 */
export const UL_AI_SPREAD = Object.freeze([2, -2, 1, -1, 1, -1, 0, 0, 0]);
/* ===== 연봉 상한(사용자 11-17 "레더나 대회마다 연봉에 제약을 두게 하면 좋을것 같음 공평하게") =====
   덱 연봉 합 ≤ 단계 배수 × 그 세계 리그 평균(cupPay: 우리 구단을 뺀 구단마다 연봉 상위 26명 합의 평균). 세계·시대가 달라도 같은 잣대.
   루키·마이너 1.5배: 새 게임 1군(최대 1.35배)이 바로 시작한다. 1부부터 모두 1.25배: 윗단계는 같은 예산 안에서 덱 짜는 실력 싸움.
   AI 구단은 연봉이 없는 가상 구단이라 상한을 보지 않는다(단계 난이도 기준일 뿐, 시즌 포인트·칭호를 받지 않는다).
   예전 덱(연봉 기록 없음)은 다음 시즌(UL_CAP_FROM: 11.30 0시 한국시간, S23)이 시작될 때까지 그대로 쓴다. 그 뒤에는 다시 등록해야 리그를 시작하고 상대로 나온다 */
export const UL_CAP = Object.freeze([1.5, 1.5, 1.25, 1.25, 1.25]);
export const ulCapX = t => UL_CAP[Math.max(0, Math.min(UL_CAP.length - 1, t | 0))];
export const ulCap = (e, tier) => Object.assign(cupPayCheck(e, ulCapX(tier)), { tier: tier | 0 });
/* 이 덱으로 이 단계 리그에 나갈 수 있나: 상한 안 → ok. 연봉 기록이 없는 예전 덱 → 유예 기간(UL_CAP_FROM 전)만 ok(grace). AI 덱은 언제나 ok */
export function ulCapGate(e, tier, now) {
  if (e && e.ai) return { ok: true, ai: true };
  const c = ulCap(e, tier), name = ulTierName(tier);
  if (!c.known) { const g = (now == null ? Date.now() : now) < UL_CAP_FROM; return Object.assign(c, { ok: g, grace: g, msg: g ? `연봉 기록이 없는 예전 덱입니다. ${ulSeason(UL_CAP_FROM).label.split('~')[0]} 시즌부터는 다시 등록해야 리그를 시작할 수 있습니다.` : '연봉 기록이 없는 예전 덱입니다. 덱을 다시 등록해 주세요.' }); }
  return Object.assign(c, { msg: c.ok ? '' : `덱 연봉 ${cupWon(c.pay)}이 ${name} 상한 ${cupWon(c.cap)}(리그 평균의 ${c.x}배)을 ${cupWon(-c.room)} 넘습니다.` });
}
/* 덱에서 선수 빼기(상한 맞추기): 타순에서 빠지면 그 자리에 벤치 야수(같은 포지션 먼저, 그다음 OVR 높은 순), 선발에서 빠지면 불펜 투수(OVR 높은 순)가 들어간다.
   {e(새 엔트리), err}. 검증(20명·투수 9명·타순 9명)에 걸리면 err */
export function ulCapDrop(e, ids) {
  const x = JSON.parse(JSON.stringify(e || {})), no = new Set((ids || []).map(Number)); if (!Array.isArray(x.P)) return { e: x, err: '덱이 없습니다.' };
  x.P = x.P.filter(p => !no.has(p.id)); const P = new Map(x.P.map(p => [p.id, p])), O = p => ulPOvr(p);
  x.bn = (x.bn || []).filter(id => P.has(id)); x.pen = (x.pen || []).filter(id => P.has(id));
  for (const s of x.ln || []) { if (P.has(s[0])) continue; const c = x.bn.map(id => P.get(id)).filter(p => p && !p.isP && !(p.injOut > 0)).sort((a, b) => (b.pos === s[1]) - (a.pos === s[1]) || O(b) - O(a))[0];
    if (!c) return { e: x, err: '타순을 채울 벤치 야수가 없습니다.' }; s[0] = c.id; x.bn = x.bn.filter(id => id !== c.id); }
  x.rot = (x.rot || []).map(id => { if (P.has(id)) return id; const c = x.pen.map(i => P.get(i)).filter(p => p && p.isP).sort((a, b) => O(b) - O(a))[0]; if (!c) return null; x.pen = x.pen.filter(i => i !== c.id); return c.id; }).filter(id => id != null);
  if (x.bp) for (const k in x.bp) if (!P.has(+k)) delete x.bp[k];
  x.pay = Math.round(x.P.reduce((a, p) => a + (+p.sal || 0), 0)); delete x.h;
  const v = cupValidate(x, {}); return { e: x, err: v.ok ? '' : v.errors[0].msg };
}
/* 상한에 맞추려면 뺄 선수(추천): 넘는 돈을 한 명으로 메울 수 있으면 그중 OVR이 가장 낮은 선수, 아니면 연봉 대비 OVR이 가장 낮은(연봉 ÷ (OVR − 35)이 큰) 선수부터.
   빼도 덱 규칙(20명·투수 9명·타순)이 지켜지는 선수만 고른다. 6명까지. {ids, ok(빼면 들어가는지)} */
export function ulCapSuggest(e, tier) {
  let c = ulCap(e, tier); if (!c.known || c.ok) return { ids: [], ok: c.ok }; const ids = [];
  for (let k = 0; k < 6 && !c.ok; k++) {
    const can = e.P.filter(p => !ids.includes(p.id) && !ulCapDrop(e, ids.concat(p.id)).err), over = -c.room; if (!can.length) break;
    const one = can.filter(p => (+p.sal || 0) >= over).sort((a, b) => ulPOvr(a) - ulPOvr(b) || a.sal - b.sal)[0];
    const p = one || can.slice().sort((a, b) => (b.sal || 0) / Math.max(1, ulPOvr(b) - 35) - (a.sal || 0) / Math.max(1, ulPOvr(a) - 35))[0];
    ids.push(p.id); c = ulCap(ulCapDrop(e, ids).e, tier); }
  return { ids, ok: c.ok };
}
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
export const UL_CAP_FROM = UL_SEASON_0 + 23 * UL_SEASON_MS; /* 연봉 상한 유예 끝(사용자 11-17): S23 시작 = 2026-11-30 0시 한국시간 */
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
/* ===== 래더 v2(사용자 11-17 "디테일한 데이터 뽑아보게해 계속적으로 우리선수나 래더 선수구성이나 등"): 선수 누적 기록·팀 시즌 기록·덱 구성(메타)·미션·CSV =====
   모두 게임 상태(G)를 모르는 순수 함수. 저장(G.uld)에는 묶음 합계만 둔다(선수 120명 × 시즌·단계 칸 24개까지). 서버 v1 메타 집계(worker/v1/ladder.js)도 같은 함수를 쓴다 */
export const UL_BF = Object.freeze(['g', 'pa', 'ab', 'h', 'd', 'tr', 'hr', 'bb', 'hbp', 'sf', 'rbi', 'r', 'sb', 'so']);
export const UL_PF = Object.freeze(['g', 'gs', 'outs', 'h', 'bb', 'so', 'r', 'er', 'hr', 'w', 'l', 'sv']);
export const UL_PS_MAX = 120, UL_SPLIT_MAX = 24, UL_OPP_MAX = 60;
const arrOf = (o, F) => F.map(f => +(o && o[f]) || 0), objOf = (a, F) => { const o = {}; F.forEach((f, i) => { o[f] = (a && a[i]) || 0; }); return o; };
const addArr = (a, b) => { for (let i = 0; i < b.length; i++) a[i] = (a[i] || 0) + (b[i] || 0); return a; };
const sidN = s => +String(s || '').slice(1) || 0;
/* 리그 하나의 우리 선수 기록 더하기. ps: G.uld.ps(고쳐 쓴다). x: {sid(시즌), tier, lid(리그 번호), P:[{id,name,pos,isP,age,foreign}], bat:[{id,...UL_BF}], pit:[{id,...UL_PF}]} */
export function ulPsAdd(ps, x) {
  const info = new Map((x.P || []).map(p => [String(p.id), p])), key = `${x.sid}|${x.tier | 0}`;
  const slot = (id, isP) => { id = String(id); const p = info.get(id) || {}; const o = ps[id] || (ps[id] = { n: p.name || '', pos: p.pos || '', P: isP ? 1 : 0, s: {} });
    if (p.name) o.n = p.name; if (p.pos) o.pos = p.pos; if (p.age != null) o.age = p.age; if (p.foreign) o.fr = 1; if (isP) o.P = 1; o.at = x.lid | 0; return o.s[key] || (o.s[key] = {}); };
  for (const b of x.bat || []) { const s = slot(b.id, 0); s.b = addArr(s.b || UL_BF.map(() => 0), arrOf(b, UL_BF)); }
  for (const p of x.pit || []) { const s = slot(p.id, 1); s.p = addArr(s.p || UL_PF.map(() => 0), arrOf(p, UL_PF)); }
  /* 한도: 시즌 칸은 오래된 시즌부터, 선수는 가장 오래 안 나온 선수부터 뺀다 */
  for (const id in ps) { const S = ps[id].s, ks = Object.keys(S); if (ks.length > UL_SPLIT_MAX) ks.sort((a, b) => sidN(a.split('|')[0]) - sidN(b.split('|')[0])).slice(0, ks.length - UL_SPLIT_MAX).forEach(k => delete S[k]); }
  const ids = Object.keys(ps); if (ids.length > UL_PS_MAX) ids.sort((a, b) => (ps[a].at || 0) - (ps[b].at || 0)).slice(0, ids.length - UL_PS_MAX).forEach(id => delete ps[id]);
  return ps;
}
const r3 = x => Math.round(x * 1000) / 1000, r2 = x => Math.round(x * 100) / 100;
export function ulBatRates(t) { const ab = t.ab || 0, ob = ab + (t.bb || 0) + (t.hbp || 0) + (t.sf || 0), tb = (t.h || 0) + (t.d || 0) + 2 * (t.tr || 0) + 3 * (t.hr || 0);
  const obp = ob ? ((t.h || 0) + (t.bb || 0) + (t.hbp || 0)) / ob : 0, slg = ab ? tb / ab : 0; return { avg: ab ? r3(t.h / ab) : 0, obp: r3(obp), slg: r3(slg), ops: r3(obp + slg) }; }
export function ulPitRates(t) { const o = t.outs || 0; return { ip: `${Math.floor(o / 3)}${o % 3 ? '.' + (o % 3) : ''}`, ipn: o / 3, era: o ? r2((t.er || 0) * 27 / o) : null, whip: o ? r2(((t.h || 0) + (t.bb || 0)) * 3 / o) : null, k9: o ? r2((t.so || 0) * 27 / o) : null }; }
/* 표 줄: kind 'b'(타자)·'p'(투수), f: {season:'S12'|'', tier:-1|0~4, pos:''|'C'|…|'SP'|'RP'}. 줄마다 시즌별 나눔(splits)도 붙인다 */
export function ulPsRows(ps, kind, f) {
  f = f || {}; const k = kind === 'p' ? 'p' : 'b', F = k === 'p' ? UL_PF : UL_BF, rate = k === 'p' ? ulPitRates : ulBatRates, out = [];
  for (const id in ps || {}) { const o = ps[id], tot = F.map(() => 0), by = {};
    for (const sk in o.s) { const [sid, t] = sk.split('|'); if (f.season && sid !== f.season) continue; if (f.tier != null && f.tier >= 0 && +t !== +f.tier) continue; const a = o.s[sk][k]; if (!a) continue; addArr(tot, a); addArr(by[sid] || (by[sid] = F.map(() => 0)), a); }
    if (!tot[0]) continue; const t = objOf(tot, F), pos = k === 'p' ? (t.gs * 2 >= t.g ? 'SP' : 'RP') : o.pos;
    if (f.pos && f.pos !== pos) continue;
    out.push(Object.assign({ id, name: o.n, pos, age: o.age, fr: o.fr ? 1 : 0, at: o.at || 0 }, t, rate(t),
      { splits: Object.keys(by).sort((a, b) => sidN(b) - sidN(a)).map(sid => { const x = objOf(by[sid], F); return Object.assign({ sid }, x, rate(x)); }) })); }
  return out;
}
/* 팀 시즌 칸(ulSeasonAdd 확장): 승·패·무·득점·실점·강등·순위 합. 예전 칸에 없는 값은 0으로 본다 */
export function ulSeasonAdd2(s, sid, label, x) { const o = ulSeasonAdd(s, sid, label, x), was = s && s.id === sid ? s : {};
  for (const f of ['w', 'l', 't', 'rs', 'ra']) o[f] = (was[f] || 0) + (x[f] || 0); o.dn = (was.dn || 0) + (x.move === 'down' ? 1 : 0); o.rk = (was.rk || 0) + (x.rank | 0); return o; }
/* 시즌 미션(이번 시즌 기록만으로 정한다: 따로 저장하지 않는다) */
export function ulMissions(seas, hist, sid, tier) {
  tier = tier | 0; const S = seas && seas.id === sid ? seas : { n: 0, up: 0, win: 0, top: 0, best: 0 }, H = (hist || []).filter(x => x.s === sid), top = UL_TIERS.length - 1, goal = Math.min(top, tier + 1), pts = tier * 100 + 70;
  return [
    { k: 'play', n: '리그 3번 치르기', cur: Math.min(3, S.n | 0), goal: 3 },
    { k: 'top3', n: '3위 안에 들기', cur: Math.min(1, H.filter(x => x.rank <= 3).length), goal: 1 },
    { k: 'plus', n: '승률 5할 넘긴 리그 2번', cur: Math.min(2, H.filter(x => (x.w || 0) > (x.l || 0)).length), goal: 2 },
    tier >= top ? { k: 'up', n: '레전드 리그 우승', cur: Math.min(1, S.win | 0), goal: 1 } : { k: 'up', n: `${ulTierName(goal)} 승격`, cur: (S.best | 0) >= goal ? 1 : 0, goal: 1 },
    { k: 'pts', n: `리그 점수 ${pts}점`, cur: Math.min(pts, S.top | 0), goal: pts },
  ].map(m => Object.assign(m, { done: m.cur >= m.goal }));
}
/* ---- 덱 구성(메타) ---- 선수 OVR은 본게임 종합 능력(ovr)과 같은 식, 표시 척도(dv) */
export const ulPOvr = p => { const r = (p && p.r) || {}; return dv(p && p.isP ? (r.stf || 0) * .44 + (r.ctl || 0) * .44 + (r.sta || 0) * .12 : (r.con || 0) * .3 + (r.pow || 0) * .25 + (r.eye || 0) * .15 + (r.spd || 0) * .1 + (r.def || 0) * .2); };
export const UL_POS = Object.freeze(['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH']);
export const UL_ARCH = Object.freeze({ pow: '거포형', con: '교타형', spd: '기동력형', def: '수비형', sp: '선발 왕국', pen: '불펜 야구', bal: '균형형' });
/* 갈래별 기준(표시 척도, 리그 평균 수준 덱·AI 덱 15개로 맞춤 11-17). 덱 성향 = 기준보다 가장 크게 앞선 갈래(3 미만이면 균형형) */
export const UL_ARCH_BASE = Object.freeze({ pow: 63, con: 62, spd: 64, def: 67, sp: 69, pen: 63 });
export const UL_OVR_BK = Object.freeze([50, 55, 60, 65, 70, 75]); /* 칸: ~49 · 50~54 · … · 75~ */
export const UL_AGE_BK = Object.freeze([25, 29, 33]); /* ~24 · 25~28 · 29~32 · 33~ */
const bk = (v, B) => { let i = 0; while (i < B.length && v >= B[i]) i++; return i; };
const mean = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
export function ulDeckMeta(e) {
  if (!e || !Array.isArray(e.P)) return null; const P = new Map(e.P.map(p => [p.id, p])), ok = p => p && p.r && !(p.injOut > 0);
  const L = (e.ln || []).map(([id, pos]) => [P.get(id), pos]).filter(x => x[0] && x[0].r), pos = {};
  for (const [p, k] of L) pos[k] = ulPOvr(p);
  const rot = (e.rot || []).map(id => P.get(id)).filter(ok), pen = (e.pen || []).map(id => P.get(id)).filter(ok), R = k => mean(L.map(x => x[0].r[k] || 0));
  const pf = { pow: dv(R('pow')), con: dv(R('con')), spd: dv(R('spd')), def: dv(mean(L.filter(x => x[1] !== 'DH').map(x => x[0].r.def || 0))),
    sp: dv(mean(rot.map(p => p.r.stf * .45 + p.r.ctl * .4 + p.r.sta * .15))), pen: dv(mean(pen.map(p => p.r.stf * .55 + p.r.ctl * .45).sort((a, b) => b - a).slice(0, 5))) };
  let a = 'bal', best = 2.99; for (const k in UL_ARCH_BASE) { const d = (pf[k] || 0) - UL_ARCH_BASE[k]; if (d > best) { best = d; a = k; } }
  const age = [0, 0, 0, 0]; for (const p of e.P) age[bk(p.age || 0, UL_AGE_BK)]++;
  const o = e.ovr && typeof e.ovr === 'object' ? e.ovr : {};
  return { v: 1, t: o.t | 0, p: o.p | 0, b: o.b | 0, pos, sp: Math.round(mean(rot.map(ulPOvr))), rp: Math.round(mean(pen.map(ulPOvr).sort((x, y) => y - x).slice(0, 5))), fr: e.P.filter(p => p.foreign).length, n: e.P.length, age, aa: Math.round(mean(e.P.map(p => p.age || 0)) * 10) / 10, pf, a };
}
/* 여러 덱 구성 → 집계: 평균·분포(OVR 칸)·외국인 비율·나이 분포·덱 성향 수 */
export function ulMetaAgg(list) {
  list = (list || []).filter(x => x && x.v); const n = list.length;
  const dist = vals => { vals = vals.filter(v => v > 0); const h = UL_OVR_BK.map(() => 0).concat(0); for (const v of vals) h[bk(v, UL_OVR_BK)]++; return { avg: Math.round(mean(vals) * 10) / 10, h }; };
  const pos = {}; for (const k of UL_POS) pos[k] = dist(list.map(x => x.pos && x.pos[k]));
  const age = [0, 0, 0, 0]; for (const x of list) (x.age || []).forEach((c, i) => { if (i < 4) age[i] += c || 0; });
  const arch = {}; for (const k in UL_ARCH) arch[k] = 0; for (const x of list) if (x.a in arch) arch[x.a]++;
  const pf = {}; for (const k in UL_ARCH_BASE) pf[k] = Math.round(mean(list.map(x => (x.pf && x.pf[k]) || 0)) * 10) / 10;
  const pl = list.reduce((s, x) => s + (x.n || 0), 0);
  return { n, t: dist(list.map(x => x.t)), p: dist(list.map(x => x.p)), b: dist(list.map(x => x.b)), sp: dist(list.map(x => x.sp)), rp: dist(list.map(x => x.rp)), pos,
    fr: pl ? Math.round(list.reduce((s, x) => s + (x.fr || 0), 0) / pl * 1000) / 1000 : 0, frDeck: Math.round(mean(list.map(x => x.fr || 0)) * 10) / 10, age, aa: Math.round(mean(list.map(x => x.aa || 0)) * 10) / 10, arch, pf };
}
/* CSV 한 덩어리(엑셀에서 한글이 깨지지 않게 화면이 앞에 BOM을 붙인다). cols: [[키 또는 함수, 제목], …] */
export function ulCsv(rows, cols) { const q = v => { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  return [cols.map(c => q(c[1])).join(','), ...(rows || []).map(r => cols.map(c => q(typeof c[0] === 'function' ? c[0](r) : r[c[0]])).join(','))].join('\r\n'); }
/* 예전 저장(G.uld v1) → v2: 선수 기록(ps)·상대 기록(opp) 칸을 만들고, 마지막 리그 결과의 승패를 기록 줄에 채운다. 여러 번 해도 같다(난수 없음) */
export function ulMigrate(U) {
  if (!U || typeof U !== 'object' || (U.v | 0) >= 2) return U;
  U.ps = U.ps && typeof U.ps === 'object' ? U.ps : {}; U.opp = U.opp && typeof U.opp === 'object' ? U.opp : {}; U.hist = Array.isArray(U.hist) ? U.hist : [];
  const L = U.last, h = U.hist[U.hist.length - 1];
  if (L && h && h.w == null && h.rank === L.rank && h.tier === L.tier) { const me = (L.stand || []).find(x => x.kind === 'me'); Object.assign(h, { w: L.w | 0, l: L.l | 0, t: L.t | 0, pts: L.pts != null ? L.pts : ulPts(L.tier, L.rank) }); if (me && me.diff != null) h.rd = me.diff; }
  U.v = 2; return U;
}
