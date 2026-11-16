/* 단장 대전(비동기 대전) 공용 규칙: 구단 스냅샷 형식과 검증.
   게임 상태(G)·화면을 참조하지 않는다. 화면(구단 만들기)·노드 실행기(tools/ladder-series.cjs)·서버(Worker)가 같은 코드를 쓴다.
   선수 풀(pool)은 엔진의 ladderPool(시즌 id)이 만든다: {season, v, cap, rules, players:[{id,isP,pos,role,sal,...}], mgrs:[{id,sal,...}]} */
export const LADDER_V = 1;
export const LADDER_RULES = Object.freeze({
  roster: 26,          /* 1군 26명 */
  minP: 11, maxP: 14,  /* 투수 수 */
  rot: 5,              /* 선발 5명(풀에서 선발형 SP만) */
  setup: 3,            /* 필승조 최대 3명(마무리는 따로 1명) */
  minPos: Object.freeze({ C: 2, SS: 1, '2B': 1, '3B': 1, CF: 1 }), /* 포지션 최소 인원 */
  slots: Object.freeze(['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH']), /* 타순 9자리의 수비 위치 */
  nameMax: 12,
});
const POS_L = { C: '포수', '1B': '1루수', '2B': '2루수', '3B': '3루수', SS: '유격수', LF: '좌익수', CF: '중견수', RF: '우익수', DH: '지명타자' };
export const ladderPosLabel = pos => POS_L[pos] || pos;

/* 스냅샷을 정해진 모양으로(키 순서·숫자형). 해시와 서버 저장이 같은 값을 보게 */
export function ladderSnapPack(o) {
  o = o || {};
  const ids = a => (Array.isArray(a) ? a : []).map(x => +x).filter(Number.isFinite);
  return {
    v: LADDER_V,
    season: String(o.season || ''),
    name: String(o.name || '').trim().slice(0, 40),
    hue: Math.round(+o.hue || 0) % 360,
    mgr: o.mgr == null ? '' : String(o.mgr),
    roster: ids(o.roster),
    lineup: (Array.isArray(o.lineup) ? o.lineup : []).map(x => [+(x && x[0]), String((x && x[1]) || '')]),
    rot: ids(o.rot),
    cl: o.cl == null || o.cl === '' ? null : +o.cl,
    su: ids(o.su),
  };
}
/* 스냅샷 해시(16진 8자리): 시리즈 재현 키(구단 A 해시, 구단 B 해시, 시리즈 시드) */
export function ladderSnapHash(o) {
  const s = JSON.stringify(ladderSnapPack(o));
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  h ^= h >>> 16; h = Math.imul(h, 2246822507) >>> 0; h ^= h >>> 13; h = Math.imul(h, 3266489909) >>> 0; h ^= h >>> 16;
  return (h >>> 0).toString(16).padStart(8, '0');
}
/* 연봉 합(선수 + 감독) */
export function ladderPay(o, pool) {
  const snap = ladderSnapPack(o), P = ladderIndex(pool);
  let pay = 0; for (const id of snap.roster) { const p = P.p.get(id); if (p) pay += +p.sal || 0; }
  const m = P.m.get(snap.mgr); if (m) pay += +m.sal || 0;
  return pay;
}
const IDX = new WeakMap();
function ladderIndex(pool) {
  if (!pool || typeof pool !== 'object') return { p: new Map(), m: new Map() };
  let x = IDX.get(pool); if (x) return x;
  x = { p: new Map((pool.players || []).map(p => [+p.id, p])), m: new Map((pool.mgrs || []).map(m => [String(m.id), m])) };
  IDX.set(pool, x); return x;
}
/* 검증: 같은 시즌 풀에 있는 id인가, 26명·투수 수·포지션 최소 인원, 타순 9자리, 선발 5명, 마무리·필승조, 감독, 연봉 한도.
   반환 {ok, errors:[{k, msg}], pay, cap, left}. 오류 문구는 화면에 그대로 보여 준다 */
export function ladderValidate(o, pool) {
  const err = [], add = (k, msg) => err.push({ k, msg });
  const R = (pool && pool.rules) || LADDER_RULES;
  if (!pool || !Array.isArray(pool.players)) { add('pool', '선수 풀이 없습니다.'); return { ok: false, errors: err, pay: 0, cap: 0, left: 0 }; }
  const snap = ladderSnapPack(o), P = ladderIndex(pool), cap = +pool.cap || 0;
  if (!o || o.v !== LADDER_V) add('ver', '구단 형식 판이 다릅니다.');
  if (snap.season !== pool.season) add('season', `이번 시즌(${pool.season}) 선수 풀로 만든 구단이 아닙니다.`);
  if (!snap.name) add('name', '구단 이름을 정해 주세요.');
  else if ([...snap.name].length > (R.nameMax || 12)) add('name', `구단 이름은 ${R.nameMax || 12}자 이하여야 합니다.`);
  if (!P.m.has(snap.mgr)) add('mgr', '감독을 골라 주세요.');
  const seen = new Set(), roster = [];
  for (const id of snap.roster) {
    if (seen.has(id)) { add('dup', '같은 선수가 두 번 들어 있습니다.'); continue; }
    seen.add(id); const p = P.p.get(id);
    if (!p) { add('id', `풀에 없는 선수(${id})가 들어 있습니다.`); continue; }
    roster.push(p);
  }
  if (snap.roster.length !== R.roster) add('roster', `1군은 ${R.roster}명이어야 합니다(지금 ${snap.roster.length}명).`);
  const pit = roster.filter(p => p.isP), bat = roster.filter(p => !p.isP);
  if (pit.length < R.minP || pit.length > R.maxP) add('pitch', `투수는 ${R.minP}~${R.maxP}명이어야 합니다(지금 ${pit.length}명).`);
  for (const [pos, n] of Object.entries(R.minPos || {})) { const c = bat.filter(p => p.pos === pos).length; if (c < n) add('pos', `${ladderPosLabel(pos)}가 ${n}명 이상 있어야 합니다(지금 ${c}명).`); }
  /* 타순 */
  const inR = id => seen.has(id) && P.p.has(id);
  if (snap.lineup.length !== 9) add('lineup', '타순 9명을 정해 주세요.');
  const lnId = new Set(), lnPos = new Set();
  for (const [id, pos] of snap.lineup) {
    const p = P.p.get(id);
    if (!inR(id) || !p) { add('lineup', '타순에 1군에 없는 선수가 있습니다.'); continue; }
    if (p.isP) add('lineup', `투수 ${p.name || id}는 타순에 넣을 수 없습니다.`);
    if (lnId.has(id)) add('lineup', '타순에 같은 선수가 두 번 있습니다.');
    if (!R.slots.includes(pos)) add('lineup', '타순의 수비 위치가 올바르지 않습니다.');
    else if (lnPos.has(pos)) add('lineup', `${ladderPosLabel(pos)} 자리가 두 번 있습니다.`);
    if (pos === 'C' && p.pos !== 'C') add('lineup', '포수 자리에는 포수만 설 수 있습니다.');
    lnId.add(id); lnPos.add(pos);
  }
  /* 선발·불펜 */
  if (snap.rot.length !== R.rot || new Set(snap.rot).size !== snap.rot.length) add('rot', `선발 ${R.rot}명을 정해 주세요.`);
  for (const id of snap.rot) { const p = P.p.get(id); if (!inR(id) || !p || !p.isP) add('rot', '선발에 1군 투수가 아닌 선수가 있습니다.'); else if (p.role !== 'SP') add('rot', `${p.name || id}는 선발형 투수가 아닙니다.`); }
  const rot = new Set(snap.rot);
  if (snap.cl == null) add('pen', '마무리를 정해 주세요.');
  for (const id of [snap.cl, ...snap.su].filter(x => x != null)) { const p = P.p.get(id); if (!inR(id) || !p || !p.isP) add('pen', '불펜 역할에 1군 투수가 아닌 선수가 있습니다.'); else if (rot.has(id)) add('pen', `${p.name || id}는 선발과 불펜에 함께 들 수 없습니다.`); }
  if (snap.su.length > R.setup || new Set([snap.cl, ...snap.su]).size !== snap.su.length + 1) add('pen', `필승조는 마무리와 다른 투수로 ${R.setup}명까지입니다.`);
  const pay = ladderPay(snap, pool);
  if (cap && pay > cap) add('cap', `연봉 합이 한도를 ${Math.round(pay - cap)} 넘습니다.`);
  const errors = err.filter((e, i) => err.findIndex(x => x.msg === e.msg) === i);
  return { ok: !errors.length, errors, pay, cap, left: cap - pay };
}

/* ===== 리그 팩: 서버가 제출된 구단 8~10개를 묶어 내려보내고, 각 기기가 같은 시즌을 직접 돌린다 =====
   {v, kind:'ladder-pack', leagueId, season, seed, meet, clubs:[스냅샷…], sched:[[날, 홈 번호, 원정 번호]…]}
   같은 팩 → 모든 기기에서 같은 순위·기록(엔진 ladderPackRun). 팩 안 구단은 모두 잠긴다(내 구단 포함): 하나라도 바꾸면 기기마다 결과가 달라진다 */
export const LADDER_PACK_V = 1;
/* 일정: 원형 순환(구단 수가 홀수면 쉬는 자리). meet번 돌고, 돌 때마다 홈·원정을 바꾼다. 하루에 구단마다 한 경기 */
export function ladderSchedule(n, meet) {
  n = Math.max(2, Math.min(10, n | 0)); meet = Math.max(1, Math.min(20, meet | 0));
  const m = n % 2 ? n + 1 : n, out = []; let d = 0;
  for (let c = 0; c < meet; c++) {
    const r0 = [...Array(m).keys()];
    for (let r = 0; r < m - 1; r++) {
      for (let i = 0; i < m / 2; i++) {
        const x = r0[i], y = r0[m - 1 - i]; if (x >= n || y >= n) continue;
        const flip = (c + r + i) % 2 === 1; out.push([d, flip ? y : x, flip ? x : y]);
      }
      r0.splice(1, 0, r0.pop()); d++;
    }
  }
  return out;
}
export function ladderPackMake(snaps, o) {
  o = o || {}; const clubs = (snaps || []).map(ladderSnapPack), meet = Math.max(1, Math.min(20, (o.meet ?? 6) | 0));
  return { v: LADDER_PACK_V, kind: 'ladder-pack', leagueId: String(o.leagueId || ''), season: String(o.season || (clubs[0] && clubs[0].season) || ''), seed: String(o.seed ?? '0'), meet, clubs, sched: ladderSchedule(clubs.length, meet) };
}
/* 팩 검증: 구단마다 ladderValidate, 일정이 규칙대로인가(하루 한 경기, 원형 순환) */
export function ladderPackValidate(pack, pool) {
  const err = [], add = (k, msg) => err.push({ k, msg });
  if (!pack || pack.kind !== 'ladder-pack' || pack.v !== LADDER_PACK_V) { add('ver', '리그 팩 형식이 다릅니다.'); return { ok: false, errors: err }; }
  const n = (pack.clubs || []).length;
  if (n < 2 || n > 10) add('clubs', `리그 팩은 2~10개 구단이어야 합니다(지금 ${n}개).`);
  if (pool && pack.season !== pool.season) add('season', '선수 풀 시즌과 팩 시즌이 다릅니다.');
  (pack.clubs || []).forEach((c, i) => { const v = ladderValidate(Object.assign({}, c, { v: LADDER_V }), pool); for (const e of v.errors) add('club' + i, `${i + 1}번 구단(${c.name || '이름 없음'}): ${e.msg}`); });
  if (JSON.stringify(pack.sched || []) !== JSON.stringify(ladderSchedule(n, pack.meet))) add('sched', '일정이 규칙(원형 순환)과 다릅니다.');
  const errors = err.filter((e, i) => err.findIndex(x => x.msg === e.msg) === i);
  return { ok: !errors.length, errors };
}
