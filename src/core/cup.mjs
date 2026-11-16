/* 유저 대회(프런트컵) 공용 규칙: 참가 엔트리 형식·해시·검증, 금칙어, 시드·대진표, 미션상·개인 타이틀·파워랭킹.
   게임 상태(G)·화면을 참조하지 않는다. 게임(신청 버튼)·Worker(/api/cup)·주최 도구(tools/cup-host.cjs)가 같은 코드를 쓴다.
   엔트리는 그 순간의 1군 명단(능력·나이·포지션·투타·타순·선발·불펜·감독)을 담는다. 경기는 엔진 cupMatch(엔트리 A, B, 시드)가 본게임 simGame으로 치른다.
   대회는 회차마다 따로 여는 단발 행사다(정기 일정 없음). 회차마다 대회 id(cup1, cup2…)를 새로 정한다 */
import { ladderSchedule } from './ladder.mjs';
export const CUP_V = 1;
export const CUP_RULES = Object.freeze({
  nameMax: 12,           /* 팀명 12자 */
  minPl: 20, maxPl: 32,  /* 1군 인원 */
  minP: 9,               /* 투수 최소 */
  rot: 5,
  ratingMax: 85,         /* 능력치 상한(게임 안 잠재력 상한 80 + 컨디션 여유). 넘으면 이상치 */
  ageMin: 16, ageMax: 48,
});
/* 기본 대회 설정(첫 대회, 형식 A): 10팀 리그(맞대결 3연전 × 9 = 팀당 27경기) → KBO식 가을야구(와일드카드·준PO·PO·KS).
   참가가 10팀보다 적으면 리그 평균 AI 구단으로 채운다(AI는 타이틀·칭호 없음).
   format 'knockout'이면 예전 토너먼트(size강, best 라운드별 경기 수, 플레이인·추첨·블록) */
export const CUP_DEFAULT = Object.freeze({
  id: 'cup1', title: '제1회 프런트컵', format: 'league', teams: 10, meet: 3, size: 32,
  best: Object.freeze({ default: 1, 8: 7, 4: 7, 2: 7 }), /* 라운드(남은 팀 수)별 경기 수: 1=단판, 3=3판2선승, 7=7전4선승 */
  playIn: null,          /* {direct: N, groupSize: k}: 상위 N 직행, 나머지는 조별 단판 → 본선 남은 자리 */
  shuffleTop: 0,         /* 8이면 Top-8 시드 자리를 추첨으로 섞는다 */
  blocks: 0,             /* 대진표를 블록(A·B…)으로 나눠 보여 준다(0이면 없음) */
  minSeasons: 0, payCap: 0, deadline: '', /* 접수 마감(한국시간 'YYYY-MM-DD HH:mm') */
});
const NUM = x => (typeof x === 'number' && isFinite(x) ? x : 0);
/* 해시(16진 8자리): FNV-1a + 섞기. 엔트리·경기 키 */
export function cupHashStr(s) {
  s = String(s); let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  h ^= h >>> 16; h = Math.imul(h, 2246822507) >>> 0; h ^= h >>> 13; h = Math.imul(h, 3266489909) >>> 0; h ^= h >>> 16;
  return (h >>> 0).toString(16).padStart(8, '0');
}
/* 키 순서를 정렬한 JSON(해시가 기기·서버마다 같게). 사진(f)·해시(h)는 뺀다 */
function stable(v) {
  if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).filter(k => v[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}';
  return JSON.stringify(v === undefined ? null : v);
}
export function cupEntryCore(e) {
  const o = Object.assign({}, e || {}); delete o.h; delete o.ovr; delete o.flags;
  o.P = (o.P || []).map(p => { const q = Object.assign({}, p); delete q.f; return q; });
  return o;
}
export function cupEntryHash(e) { return cupHashStr(stable(cupEntryCore(e))); }

/* 팀명: 앞뒤 공백·겹친 공백 정리, 12자까지 */
export function cupName(s) { return [...String(s || '').replace(/[\u0000-\u001f<>"'`\\]/g, '').replace(/\s+/g, ' ').trim()].slice(0, CUP_RULES.nameMax).join(''); }
/* 금칙어: 띄어쓰기·숫자·기호를 지운 뒤 찾는다(시1발 → 시발) */
const BAD = ['시발', '씨발', 'ㅅㅂ', 'ㅆㅂ', '병신', 'ㅂㅅ', '좆', '존나', '지랄', '개새', '새끼', '썅', '미친놈', '미친년', '닥쳐', '꺼져', '느금', '니애미', '니미', '애미', '애비', '엠창', '섹스', '보지', '자지', '야동', '일베', '한남', '김치녀', '장애인', '틀딱', '좆밥', '빠구리', 'fuck', 'shit', 'bitch', 'sex', 'porn', 'nigg', '운영자', '관리자', 'admin'];
export function cupBadName(s) {
  const t = String(s || '').toLowerCase().replace(/[\s0-9_.\-~!@#$%^&*()+=|/?,:;[\]{}]/g, '');
  return BAD.some(w => t.includes(w));
}
/* 한국시간 마감 'YYYY-MM-DD HH:mm' → ms(UTC) */
export function cupKstMs(s) {
  const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/); if (!m) return null;
  return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) - 9 * 3600e3;
}
export const cupKstDay = ms => new Date(ms + 9 * 3600e3).toISOString().slice(0, 10);

/* 엔트리 검증. errors: 받지 않음(형식·인원·타순). flags: 받되 주최자가 볼 이상치(능력 상한·나이·잠재력). elig: 대회 자격(시즌 수·연봉 합) */
export function cupValidate(e, cfg) {
  const R = CUP_RULES, err = [], flags = [], add = (k, msg) => err.push({ k, msg }), flag = (k, msg) => flags.push({ k, msg });
  cfg = Object.assign({}, CUP_DEFAULT, cfg || {});
  if (!e || e.kind !== 'cup-entry' || e.v !== CUP_V) { add('ver', '대회 엔트리 형식이 아닙니다.'); return { ok: false, errors: err, flags, elig: [] }; }
  const name = cupName(e.name);
  if (!name) add('name', '팀명을 적어 주세요.');
  else if (name !== e.name) add('name', `팀명은 ${R.nameMax}자 이하, 기호 없이 적어 주세요.`);
  if (cupBadName(e.name)) add('name', '팀명에 쓸 수 없는 말이 들어 있습니다.');
  const P = Array.isArray(e.P) ? e.P : [], ids = new Map();
  for (const p of P) { if (!p || !Number.isFinite(p.id) || ids.has(p.id)) { add('id', '선수 번호가 비었거나 겹칩니다.'); continue; } ids.set(p.id, p); }
  if (P.length < R.minPl || P.length > R.maxPl) add('roster', `1군은 ${R.minPl}~${R.maxPl}명이어야 합니다(지금 ${P.length}명).`);
  const pit = P.filter(p => p && p.isP), bat = P.filter(p => p && !p.isP);
  if (pit.length < R.minP) add('pitch', `투수가 ${R.minP}명 이상 있어야 합니다(지금 ${pit.length}명).`);
  const ln = Array.isArray(e.ln) ? e.ln : [], seen = new Set(), pos = new Set();
  if (ln.length !== 9) add('lineup', '타순 9명이 필요합니다.');
  for (const x of ln) { const p = ids.get(x && x[0]); if (!p || p.isP) { add('lineup', '타순에 1군 야수가 아닌 선수가 있습니다.'); continue; } if (seen.has(p.id)) add('lineup', '타순에 같은 선수가 두 번 있습니다.'); if (pos.has(x[1])) add('lineup', '타순에 같은 수비 자리가 두 번 있습니다.'); if (x[1] === 'C' && p.pos !== 'C') flag('lineup', `${p.name}: 포수가 아닌데 포수 자리에 있습니다(게임의 비상 배치).`); seen.add(p.id); pos.add(x[1]); }
  const rot = Array.isArray(e.rot) ? e.rot : [];
  if (!rot.length || rot.length > R.rot || rot.some(id => !(ids.get(id) || {}).isP)) add('rot', `선발은 1군 투수 1~${R.rot}명이어야 합니다.`);
  if ((e.pen || []).some(id => !(ids.get(id) || {}).isP || rot.includes(id))) add('pen', '불펜에 선발이거나 투수가 아닌 선수가 있습니다.');
  if ((e.bn || []).some(id => { const p = ids.get(id); return !p || p.isP || seen.has(id); })) add('bench', '벤치에 타순 선수나 투수가 있습니다.');
  for (const p of P) {
    if (!p || !p.r) continue;
    const vals = Object.entries(p.r).filter(([k]) => k !== 'vit');
    const hi = vals.filter(([, v]) => NUM(v) > R.ratingMax || NUM(v) < 1);
    if (hi.length) flag('rating', `${p.name}: 능력치가 게임 범위를 벗어납니다(${hi.map(([k, v]) => k + ' ' + Math.round(v)).join(', ')}).`);
    if (NUM(p.age) < R.ageMin || NUM(p.age) > R.ageMax) flag('age', `${p.name}: 나이 ${p.age}세는 게임에서 나올 수 없습니다.`);
    if (p.pot != null && (NUM(p.pot) > 80.5 || NUM(p.pot) < 20)) flag('pot', `${p.name}: 잠재력 ${Math.round(p.pot)}은 게임 범위(20~80)를 벗어납니다.`);
  }
  const elig = [];
  if (cfg.minSeasons && NUM(e.seasons) < cfg.minSeasons) elig.push({ k: 'seasons', msg: `최소 ${cfg.minSeasons}시즌을 치른 저장만 참가할 수 있습니다(지금 ${NUM(e.seasons)}시즌).` });
  if (cfg.payCap && NUM(e.pay) > cfg.payCap) elig.push({ k: 'pay', msg: `1군 연봉 합이 상한(${cfg.payCap})을 넘습니다(${Math.round(NUM(e.pay))}).` });
  if (e.h && e.h !== cupEntryHash(e)) flag('hash', '엔트리 해시가 맞지 않습니다(손으로 고친 파일일 수 있습니다).');
  const errors = err.filter((x, i) => err.findIndex(y => y.msg === x.msg) === i);
  return { ok: !errors.length, errors, flags, elig };
}
/* 팀 OVR 표시: '총|투수 타자' (예: 63|65 61) */
export const cupOvrTxt = o => o ? `${o.t}|${o.p} ${o.b}` : '-';
export const cupLabel = e => `${e.name} ${e.year}`;

/* ===== 시드·대진표 ===== */
/* 시드: 팀 OVR(총 → 투수 → 타자) 높은 순, 같으면 엔트리 해시 */
export function cupSeed(list) {
  return [...list].sort((a, b) => (b.ovr.t - a.ovr.t) || (b.ovr.p - a.ovr.p) || (b.ovr.b - a.ovr.b) || String(a.h).localeCompare(String(b.h)));
}
/* 표준 대진 순서(1번 시드와 2번 시드가 결승에서 만나게): size=8 → [1,8,4,5,2,7,3,6] */
export function cupSlots(size) {
  let s = [1, 2];
  while (s.length < size) { const n = s.length * 2 + 1; s = s.flatMap(x => [x, n - x]); }
  return s;
}
/* 작은 결정적 난수(대회 id 기준 추첨) */
function rng(seed) { let a = parseInt(cupHashStr(seed), 16) | 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const pow2 = n => { let s = 2; while (s < n) s *= 2; return s; };
/* 대진표 만들기. seeds: 시드 순 엔트리 키 배열. 반환 {size, rounds:[[{id, a, b, best, win:null, games:[]}, …], …], playIn:[…]}
   a·b는 엔트리 키(null = 부전승 자리, 'W:경기id' = 앞 경기 승자). 1라운드에서 상대가 없는 팀은 부전승으로 다음 라운드에 바로 올라간다 */
export function cupBracket(seeds, cfg) {
  cfg = Object.assign({}, CUP_DEFAULT, cfg || {});
  const bestOf = n => +(cfg.best && (cfg.best[n] ?? cfg.best.default)) || 1;
  let main = seeds.slice(), playIn = [];
  let size = Math.min(128, Math.max(2, cfg.size || pow2(seeds.length)));
  if (cfg.playIn && cfg.playIn.direct != null && seeds.length > size) {
    /* 플레이인: 상위 direct팀은 본선 직행, 나머지는 (size - direct)개 조로 나눠(뱀 모양 배정) 조마다 단판 토너먼트 → 조 1위가 본선 */
    const D = Math.max(0, Math.min(size - 1, cfg.playIn.direct | 0)), rest = seeds.slice(D), G = size - D;
    const groups = Array.from({ length: G }, () => []);
    rest.forEach((k, i) => { const r = Math.floor(i / G), c = i % G; groups[r % 2 ? G - 1 - c : c].push(k); });
    playIn = groups.map((g, gi) => ({ id: 'P' + (gi + 1), teams: g, bracket: g.length > 1 ? cupBracket(g, { size: pow2(g.length), best: { default: 1 }, playIn: null, shuffleTop: 0 }) : null }));
    main = seeds.slice(0, D).concat(playIn.map(p => 'Q:' + p.id));
  } else if (seeds.length > size) main = seeds.slice(0, size); /* 정원을 넘으면 시드 순으로 자른다(주최 도구가 미리 알린다) */
  size = Math.max(size, pow2(main.length));
  const order = cupSlots(size).map(s => main[s - 1] ?? null);
  if (cfg.shuffleTop > 1) {
    /* Top-N 시드 추첨: 1~N번 시드가 앉을 자리(표준 대진의 1~N 자리)를 대회 id로 섞는다 */
    const N = Math.min(cfg.shuffleTop | 0, main.length), at = [], who = [];
    cupSlots(size).forEach((s, i) => { if (s <= N) { at.push(i); who.push(order[i]); } });
    const r = rng('draw:' + cfg.id); for (let i = who.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [who[i], who[j]] = [who[j], who[i]]; }
    at.forEach((i, k) => { order[i] = who[k]; });
  }
  const rounds = []; let prev = null, R = 0;
  for (let n = size; n >= 2; n /= 2, R++) {
    const L = [];
    for (let i = 0; i < n / 2; i++) {
      const a = prev ? prev[2 * i] : order[2 * i], b = prev ? prev[2 * i + 1] : order[2 * i + 1];
      L.push({ id: `R${R + 1}M${i + 1}`, n, a, b, best: bestOf(n), win: null, w: [0, 0], games: [] });
    }
    rounds.push(L); prev = L.map(m => 'W:' + m.id);
  }
  const blocks = cfg.blocks > 1 ? Math.min(cfg.blocks, size / 2) : 0;
  return { size, rounds, playIn, blocks };
}
/* 라운드 이름: 32강·16강·8강·4강(준결승)·결승 */
export const cupRoundName = n => n === 2 ? '결승' : n === 4 ? '4강' : `${n}강`;
/* 대진표의 자리 값을 실제 엔트리 키로(부전승·앞 경기 승자·플레이인 승자). 아직 정해지지 않았으면 undefined, 빈 자리는 null */
export function cupResolve(B, v) {
  if (v == null) return null;
  if (typeof v !== 'string') return v;
  if (v.startsWith('W:')) { const m = cupMatchById(B, v.slice(2)); if (!m) return undefined; const a = cupResolve(B, m.a), b = cupResolve(B, m.b); if (a === null && b === null) return null; if (a === null && b !== undefined) return b; if (b === null && a !== undefined) return a; return m.win ?? undefined; }
  if (v.startsWith('Q:')) { const p = (B.playIn || []).find(x => x.id === v.slice(2)); if (!p) return undefined; if (!p.bracket) return p.teams[0] ?? null; const f = p.bracket.rounds[p.bracket.rounds.length - 1][0]; return cupResolve(p.bracket, 'W:' + f.id); }
  return v;
}
export function cupMatchById(B, id) { for (const L of B.rounds) for (const m of L) if (m.id === id) return m; return null; }
/* 다음에 치를 경기: 플레이인 먼저, 그다음 라운드 순. 양쪽이 정해졌고 아직 승자가 없는 경기(부전승 자리는 건너뜀) */
export function cupNext(B) {
  for (const p of B.playIn || []) if (p.bracket) { const m = cupNext(p.bracket); if (m) return Object.assign({ pi: p.id }, m); }
  for (const L of B.rounds) for (const m of L) {
    if (m.win != null) continue; const a = cupResolve(B, m.a), b = cupResolve(B, m.b);
    if (a === undefined || b === undefined) continue; if (a === null || b === null) continue;
    return { m, a, b };
  }
  return null;
}
export function cupChampion(B) { const f = B.rounds[B.rounds.length - 1][0]; return cupResolve(B, 'W:' + f.id) ?? null; }

/* ===== 집계: 미션상·개인 타이틀·파워랭킹 ===== */
/* series: [{id, n(라운드 팀 수), a, b, win, games:[{sa, sb, walk, winA}], block, seedA, seedB}] */
export function cupMissions(series) {
  const out = [];
  for (const s of series) {
    const G = s.games || []; if (!G.length) continue;
    if (G.length >= 4 && G.every(g => Math.abs(g.sa - g.sb) <= 3)) out.push({ k: 'close', id: s.id, who: s.win, msg: `${s.label}: 모든 경기 3점 차 이내 시리즈` });
    let wa = 0, wb = 0, down3 = null;
    for (const g of G) { if (g.sa > g.sb) wa++; else if (g.sb > g.sa) wb++; if (wa === 0 && wb === 3) down3 = 'A'; if (wb === 0 && wa === 3) down3 = 'B'; }
    if (G.length === 7 && ((down3 === 'A' && wa === 4) || (down3 === 'B' && wb === 4))) out.push({ k: 'sweep', id: s.id, who: s.win, msg: `${s.label}: 0-3에서 4-3 역스윕` });
    const g7 = G[6]; if (g7 && g7.walk) out.push({ k: 'walk7', id: s.id, who: s.win, msg: `${s.label}: 7차전 끝내기` });
  }
  /* 블록 최대 시드 차 업셋: 블록마다 (이긴 팀 시드 - 진 팀 시드)가 가장 큰 경기 */
  const byB = {};
  for (const s of series) { if (s.win == null || s.seedA == null || s.seedB == null) continue; const ws = s.win === s.a ? s.seedA : s.seedB, ls = s.win === s.a ? s.seedB : s.seedA, d = ws - ls; if (d <= 0) continue; const k = s.block || '-'; if (!byB[k] || d > byB[k].d) byB[k] = { d, s }; }
  for (const k of Object.keys(byB).sort()) out.push({ k: 'upset', id: byB[k].s.id, who: byB[k].s.win, block: k, msg: `${k === '-' ? '' : k + '블록 '}최대 시드 차 업셋(${byB[k].d}계단): ${byB[k].s.label}` });
  return out;
}
/* 개인 타이틀. bat: [{key, team, name, pa, ab, h, bb, hbp, hr, rbi, sb}], pit: [{key, team, name, outs, h, bb, er, w, sv, so}] */
export function cupTitles(bat, pit, q) {
  q = Object.assign({ pa: 65, outs: 63 }, q || {});
  if (q.no && q.no.length) { const skip = new Set(q.no), ok = x => !skip.has(String(x.key).split(':')[0]); bat = bat.filter(ok); pit = pit.filter(ok); } /* AI 구단 선수는 타이틀 없음 */
  const top = (L, f, okf, low) => { const C = L.filter(okf || (() => true)).map(x => [f(x), x]).filter(x => isFinite(x[0])); if (!C.length) return null; C.sort((a, b) => low ? a[0] - b[0] : b[0] - a[0]); return { v: C[0][0], x: C[0][1] }; };
  const avg = x => x.ab ? x.h / x.ab : 0, obp = x => { const d = x.ab + x.bb + (x.hbp || 0) + (x.sf || 0); return d ? (x.h + x.bb + (x.hbp || 0)) / d : 0; };
  const era = x => x.outs ? x.er * 27 / x.outs : 99, whip = x => x.outs ? (x.h + x.bb) * 3 / x.outs : 99, k9 = x => x.outs ? x.so * 27 / x.outs : 0;
  const L = [
    ['타율', top(bat, avg, x => x.pa >= q.pa), v => v.toFixed(3).replace(/^0/, '')],
    ['출루율', top(bat, obp, x => x.pa >= q.pa), v => v.toFixed(3).replace(/^0/, '')],
    ['홈런', top(bat, x => x.hr), v => v + '개'], ['타점', top(bat, x => x.rbi), v => v + '점'],
    ['도루', top(bat, x => x.pa ? x.sb / x.pa : 0, x => x.sb > 0), v => '타석당 ' + v.toFixed(3)],
    ['평균자책점', top(pit, era, x => x.outs >= q.outs, true), v => v.toFixed(2)],
    ['WHIP', top(pit, whip, x => x.outs >= q.outs, true), v => v.toFixed(2)],
    ['다승', top(pit, x => x.w), v => v + '승'], ['세이브', top(pit, x => x.sv), v => v + '세이브'],
    ['K/9', top(pit, k9, x => x.outs >= q.outs), v => v.toFixed(2)],
  ];
  return L.filter(x => x[1] && x[1].v > 0 || (x[1] && ['평균자책점', 'WHIP'].includes(x[0]))).map(([k, t, f]) => ({ k, key: t.x.key, team: t.x.team, name: t.x.name, v: f(t.v) }));
}
/* 파워랭킹: 회차별 성적 점수(우승 20·준우승 17·4강 14·8강 11·16강 8), 오래된 회차일수록 회차당 -2(0 아래로는 안 감), 덱(팀명)별 상위 3개 합 */
export const CUP_PTS = Object.freeze({ 1: 20, 2: 17, 4: 14, 8: 11, 16: 8 });
export function cupPower(hist, nowNo) {
  /* hist: [{no(회차), deck(팀 이름 키), best(도달 라운드 팀 수: 1=우승, 2=준우승, 4, 8, 16…)}] */
  const by = {};
  for (const h of hist) { const p = Math.max(0, (CUP_PTS[h.best] || 0) - 2 * Math.max(0, nowNo - h.no)); if (!p) continue; (by[h.deck] = by[h.deck] || []).push(p); }
  return Object.entries(by).map(([deck, L]) => ({ deck, pts: L.sort((a, b) => b - a).slice(0, 3).reduce((a, b) => a + b, 0) })).sort((a, b) => b.pts - a.pts || a.deck.localeCompare(b.deck));
}


/* ===== 리그 형식(형식 A): 일정·순위·가을야구 ===== */
/* 일정: 단장 대전 원형 순환(ladderSchedule)으로 라운드마다 짝을 정하고, 짝마다 meet경기 연전(홈·원정 번갈아: 홈, 원정, 홈).
   반환 [{id:'L라운드-번호', r(1부터), a, b(참가 번호, a가 1차전 홈), day0(그 연전 첫날, 0부터), home:[1,0,1]}] */
export function cupLeagueSched(n, meet) {
  meet = Math.max(1, Math.min(5, (meet ?? 3) | 0)); const base = ladderSchedule(n, 1), k = {}, na = Array(n).fill(0);
  /* 1차전 홈(연전에서 홈 2경기)을 고르게: 지금까지 1차전 홈이 적은 쪽이 홈 → 팀마다 홈 경기 수 차이 1 이내(10팀 3연전: 13~14) */
  return base.map(([d, h, a]) => { if (na[h] > na[a]) [h, a] = [a, h]; na[h]++; k[d] = (k[d] || 0) + 1; return { id: `L${d + 1}-${k[d]}`, r: d + 1, a: h, b: a, day0: d * meet, home: Array.from({ length: meet }, (_, i) => i % 2 ? 0 : 1) }; });
}
/* 리그 라운드 → 게시 묶음(1~3: 리그를 셋으로 나눈 구간) */
export const cupLeaguePart = (r, R) => Math.min(3, Math.max(1, Math.ceil(r * 3 / Math.max(1, R))));
const pctOf = x => x.w + x.l ? x.w / (x.w + x.l) : 0;
/* 순위: 승률(승 ÷ (승+패), 무승부 제외) → 동률 팀끼리 맞대결 승률 → 득실차 → 엔트리 키(결정적).
   games: [{a, b, sa, sb}] (a·b = 엔트리 키). 반환 [{key, rank, g, w, l, t, rs, ra, diff, pct, gb, tb('맞대결'|'득실차'|null)}] */
export function cupStandings(keys, games) {
  const R = new Map(keys.map(k => [k, { key: k, g: 0, w: 0, l: 0, t: 0, rs: 0, ra: 0 }]));
  for (const g of games) { const A = R.get(g.a), B = R.get(g.b); if (!A || !B) continue; A.g++; B.g++; A.rs += g.sa; A.ra += g.sb; B.rs += g.sb; B.ra += g.sa;
    if (g.sa > g.sb) { A.w++; B.l++; } else if (g.sb > g.sa) { B.w++; A.l++; } else { A.t++; B.t++; } }
  const L = [...R.values()]; for (const x of L) { x.diff = x.rs - x.ra; x.pct = pctOf(x); x.tb = null; }
  const same = (x, y) => Math.abs(x.pct - y.pct) < 1e-12;
  L.sort((x, y) => same(x, y) ? 0 : y.pct - x.pct);
  /* 승률 동률 묶음마다 맞대결 → 득실차 → 키 */
  const out = [];
  for (let i = 0; i < L.length;) {
    let j = i + 1; while (j < L.length && same(L[i], L[j])) j++;
    const grp = L.slice(i, j);
    if (grp.length > 1) {
      const ks = new Set(grp.map(x => x.key)), h = new Map(grp.map(x => [x.key, { w: 0, l: 0 }]));
      for (const g of games) { if (!ks.has(g.a) || !ks.has(g.b)) continue; if (g.sa > g.sb) { h.get(g.a).w++; h.get(g.b).l++; } else if (g.sb > g.sa) { h.get(g.b).w++; h.get(g.a).l++; } }
      for (const x of grp) x.h2h = pctOf(h.get(x.key));
      grp.sort((x, y) => (y.h2h - x.h2h) || (y.diff - x.diff) || String(x.key).localeCompare(String(y.key)));
      grp.forEach((x, gi) => { const nb = grp[gi + 1] || grp[gi - 1]; x.tb = nb.h2h !== x.h2h ? '맞대결' : nb.diff !== x.diff ? '득실차' : '추첨'; });
    }
    out.push(...grp); i = j;
  }
  const top = out[0];
  out.forEach((x, i) => { x.rank = i + 1; x.gb = top ? ((top.w - x.w) + (x.l - top.l)) / 2 : 0; delete x.h2h; });
  return out;
}
/* 가을야구(KBO식). hi·lo: 정규 순위(숫자) 또는 앞 시리즈 승자('WC' 등). home: 차전별 hi 홈 여부 */
export const CUP_POST = Object.freeze([
  Object.freeze({ id: 'WC', name: '와일드카드 결정전', short: '와일드카드', hi: 4, lo: 5, best: 2, wc: true, home: [1, 1] }),
  Object.freeze({ id: 'SPO', name: '준플레이오프', short: '준PO', hi: 3, lo: 'WC', best: 5, home: [1, 1, 0, 0, 1] }),
  Object.freeze({ id: 'PO', name: '플레이오프', short: 'PO', hi: 2, lo: 'SPO', best: 5, home: [1, 1, 0, 0, 1] }),
  Object.freeze({ id: 'KS', name: '한국시리즈', short: 'KS', hi: 1, lo: 'PO', best: 7, home: [1, 1, 0, 0, 1, 1, 1] }),
]);
/* 시리즈 진행 상태. spec: {best, wc}. games: [{sa, sb}] (A = 상위 팀).
   와일드카드: 4위(A)는 1승을 안고 시작한다. A가 한 번 이기거나 비기면 A, B는 두 번 이겨야 올라간다(최대 2경기).
   그 밖: 먼저 (best/2+1)승. 무승부는 승수에 넣지 않는다 */
export function cupSeriesState(spec, games) {
  let wa = 0, wb = 0, t = 0; for (const g of games || []) { if (g.sa > g.sb) wa++; else if (g.sb > g.sa) wb++; else t++; }
  if (spec.wc) { const aOk = wa > 0 || t > 0, bOk = wb >= 2; const done = aOk || bOk || (games || []).length >= 2; return { wa, wb, t, lead: [1, 0], done, win: done ? (bOk ? 'B' : 'A') : null }; }
  const need = Math.floor((spec.best || 1) / 2) + 1, done = wa >= need || wb >= need;
  return { wa, wb, t, lead: [0, 0], done, win: done ? (wa >= need ? 'A' : 'B') : null, need };
}
/* 리그 + 가을야구 전체 진행. keys: 시드 순 엔트리 키(10개). play(a, b, o) → {games:[{sa, sb, walk, inn, …}], …}: 주최 도구는 엔진 cupMatch를, 시험은 가짜 경기를 넘긴다.
   o: {cup, round, match, best, all(정해진 경기 수를 모두), tie(무승부 허용), wc, home:[1/0…](차전별 A 홈), ri:[A, B](그 팀이 앞서 치른 경기 수: 선발 순번을 이어 간다)}
   반환 {sched, series:[{id, kind('L'|'WC'|'SPO'|'PO'|'KS'), r, day0, a, b, o, games, win, res}], stand, top, champ, runner} */
export function cupLeagueRun(keys, cfg, play) {
  cfg = Object.assign({}, CUP_DEFAULT, cfg || {}); const n = keys.length, meet = cfg.meet || 3, sched = cupLeagueSched(n, meet), cnt = keys.map(() => 0), series = [], flat = [];
  const slim = g => ({ sa: g.sa, sb: g.sb, walk: !!g.walk, inn: g.inn || 9, lc: g.lc || 0 });
  for (const s of sched) {
    const a = keys[s.a], b = keys[s.b], o = { cup: cfg.id, round: 'L' + s.r, match: s.id, best: meet, all: 1, tie: 1, home: s.home, ri: [cnt[s.a], cnt[s.b]] };
    const res = play(a, b, o), G = (res.games || []).map(slim); cnt[s.a] += G.length; cnt[s.b] += G.length;
    for (const g of G) flat.push({ a, b, sa: g.sa, sb: g.sb });
    const wa = G.filter(g => g.sa > g.sb).length, wb = G.filter(g => g.sb > g.sa).length;
    series.push({ id: s.id, kind: 'L', r: s.r, day0: s.day0, a, b, o, games: G, win: wa > wb ? a : wb > wa ? b : null, res });
  }
  const stand = cupStandings(keys, flat), top = stand.slice(0, 5).map(x => x.key), W = {};
  let champ = null, runner = null;
  if (top.length >= 5) for (const P of CUP_POST) {
    const a = top[P.hi - 1], b = typeof P.lo === 'number' ? top[P.lo - 1] : W[P.lo];
    const o = { cup: cfg.id, round: P.id, match: P.id, best: P.best, home: P.home, ...(P.wc ? { wc: 1, tie: 1 } : {}) };
    const res = play(a, b, o), G = (res.games || []).map(slim), st = cupSeriesState(P, G);
    W[P.id] = st.win === 'A' ? a : b; series.push({ id: P.id, kind: P.id, a, b, o, games: G, win: W[P.id], st, res });
    if (P.id === 'KS') { champ = W.KS; runner = champ === a ? b : a; }
  }
  return { sched, series, stand, top, champ, runner };
}
/* 규정 타석·이닝(KBO: 팀 경기 수 × 3.1타석, × 1이닝) */
export const cupQual = g => ({ pa: Math.round(g * 3.1), outs: g * 3 });
/* 주간 MVP: 타자·투수를 한 점수로(AI 구단 선수 제외: no = 뺄 엔트리 해시 목록). bat·pit은 cupTitles와 같은 모양 */
export function cupMvp(bat, pit, no) {
  const skip = new Set(no || []), ok = x => !skip.has(String(x.key).split(':')[0]);
  let best = null;
  for (const b of bat.filter(ok)) { const tb = b.h + (b.d || 0) + 2 * (b.tr || 0) + 3 * b.hr, v = tb + .8 * b.bb + .7 * b.rbi + .5 * (b.r || 0) + .5 * (b.sb || 0) - .3 * (b.ab - b.h);
    if (!best || v > best.v) best = { v, key: b.key, team: b.team, name: b.name, isP: false, txt: `${b.ab}타수 ${b.h}안타${b.hr ? ` ${b.hr}홈런` : ''} ${b.rbi}타점${b.sb ? ` ${b.sb}도루` : ''} · 타율 ${(b.ab ? b.h / b.ab : 0).toFixed(3).replace(/^0/, '')}` }; }
  for (const p of pit.filter(ok)) { const v = p.outs / 3 * 1.2 + p.so * .4 - p.er * 2 - (p.h + p.bb) * .4 + (p.w || 0) * 2 + (p.sv || 0) * 1.5;
    if (!best || v > best.v) best = { v, key: p.key, team: p.team, name: p.name, isP: true, txt: `${Math.floor(p.outs / 3)}${p.outs % 3 ? '.' + p.outs % 3 : ''}이닝 ${p.so}탈삼진 평균자책점 ${(p.outs ? p.er * 27 / p.outs : 0).toFixed(2)}${p.w ? ` ${p.w}승` : ''}${p.sv ? ` ${p.sv}세이브` : ''}` }; }
  return best;
}
/* 명경기 점수: 끝내기·연장·역전 횟수·점수 차·득점 */
export const cupDrama = g => (g.walk ? 6 : 0) + (g.inn > 9 ? 3 + (g.inn - 10) : 0) + 2 * (g.lc || 0) + (Math.abs(g.sa - g.sb) <= 1 ? 3 : Math.abs(g.sa - g.sb) === 2 ? 1 : 0) + .1 * (g.sa + g.sb);
