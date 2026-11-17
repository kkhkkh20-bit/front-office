#!/usr/bin/env node
/* 프런트컵(유저 대회) 주최 도구. 대회 상태는 폴더 하나(DIR/cup.json)에 두고 한 경기씩 이어서 돌린다. 안내: docs/design/cup-kit-host-guide.md
 사용(dist/engine.js 필요: bash build.sh --engine-out dist/engine.js):
   node tools/cup-host.cjs init DIR [--id cup1] [--title "제1회 프런트컵"] [--format league|knockout] [--teams 10] [--min-seasons 2] [--pay-cap 0] [--pay-cap-x 1.25(연봉 상한: 리그 평균 배수, 사용자 11-17)] [--deadline "2026-11-30 21:00"]
        (knockout 형식만: [--size 32] [--best "1,8:7,4:7,2:7"] [--playin 16:4] [--shuffle 8] [--blocks 4])
   node tools/cup-host.cjs pull DIR --url https://사이트                    서버 신청 목록 받기(환경 변수 CUP_ADMIN 필요)
   node tools/cup-host.cjs add DIR 파일…                                   참가 파일(게임의 '참가 파일 저장')이나 서버 목록 JSON 넣기
   node tools/cup-host.cjs list DIR                                        참가팀·OVR·이상치·자격
   node tools/cup-host.cjs drop DIR 해시 [--undo]                          참가에서 빼기(되돌리기)
   node tools/cup-host.cjs seed DIR                                        시드 확정(리그: 10팀이 안 되면 AI 구단으로 채움 → out/day1 전력표)
   node tools/cup-host.cjs run DIR                                         리그: 리그 27경기 + 가을야구를 한 번에 → out/day1~day7, out/final
                                                                           토너먼트: 남은 경기 모두(next DIR [--count 1]은 한 경기씩)
   node tools/cup-host.cjs status DIR                                      대진 현황
   node tools/cup-host.cjs faces DIR                                       사진이 빠진 선수 얼굴을 게임 얼굴 묶음에서 채우기(브라우저)
   node tools/cup-host.cjs cards DIR [--only 해시]                          로스터 카드 PNG(브라우저) → DIR/out/cards/
   node tools/cup-host.cjs bracket DIR                                     대진표 PNG(브라우저) → DIR/out/bracket.png
   node tools/cup-host.cjs results DIR                                     결과 파일(우승·준우승·4강·미션상·개인 타이틀) → DIR/out/results.json, 요약 글
   node tools/cup-host.cjs publish DIR --url https://사이트                 대회 설정·경기 다시 보기·결과를 서버에 올리기(CUP_ADMIN)
   node tools/cup-host.cjs mock DIR [--n 32] [--seeds 7,11] [--seasons 2]  시험용: headless 커리어에서 가짜 엔트리 만들기
 브라우저: Playwright(tools/node_modules), CHROMIUM_EXECUTABLE_PATH가 있으면 그 실행 파일. 같은 입력이면 같은 경기(시드 = 대회 id·라운드·경기·두 엔트리 해시). */
const fs = require('node:fs'), path = require('node:path');
const LEAGUE = require('./cup-league.cjs');
const ROOT = path.join(__dirname, '..');
const ENGINE = process.env.ENGINE || path.join(ROOT, 'dist', 'engine.js');
const args = process.argv.slice(2), cmd = args[0], DIR = args[1];
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 && args[i + 1] != null ? args[i + 1] : d; }, flag = k => args.includes(k);
const VALS = new Set(['--format', '--teams', '--id', '--title', '--size', '--best', '--playin', '--shuffle', '--blocks', '--min-seasons', '--pay-cap', '--pay-cap-x', '--deadline', '--url', '--count', '--only', '--n', '--seeds', '--seasons']);
const files = args.slice(2).filter((a, i, L) => !a.startsWith('--') && !VALS.has(L[i - 1]));
const quiet = { log() {}, warn() {}, error() {}, info() {} };
let E = null;
function engine() {
  if (E) return E;
  if (!fs.existsSync(ENGINE)) { console.error('엔진 파일이 없습니다: ' + ENGINE + ' (bash build.sh --engine-out dist/engine.js)'); process.exit(2); }
  E = new Function('console', fs.readFileSync(ENGINE, 'utf8') + `
;function __mock(seed,seasons,per,names){ DEMO.on=false; newGame(seed%10,seed); fdStart(); fdAdvance(false); let g0=0; while(G.fd&&!G.fd.done&&g0++<500)fdAdvance(true); G.tut={done:true,step:99}; hireMgr(G.mmarket[0].id,3); G.medSet=true;
  for(const id of [...(G.fmarket||[])]){ const p=G.players[id]; try{ if(p&&!foreignCheck(G.user,p))signForeign(G.user,id); }catch(e){} }
  const step=()=>{ G.live=null; G.res=null; G.stops=[]; for(const e of (G.evs||[]))if(!e.done)try{ evPick(e.id,e.def??0,true); }catch(x){ e.done=true; }
    if(G.iv&&!G.iv.done){ let k=0; while(!G.iv.done&&k++<9)ivAnswer(0); } if(G.offers&&G.offers.length)try{ answerOffer(G.offers[0].id,false); }catch(x){} if(G.draft&&!G.draft.done)try{ advanceDraft(false); }catch(x){}
    (G.comp||[]).forEach(c=>{ try{ if(c.stage!=='done')compAuto(c); }catch(x){} }); try{ if(rosterN(G.user)>ROSTER_MAX)trimRoster(G.user,ROSTER_MAX); }catch(x){} advance('day'); };
  const out=[]; let ni=0; const Y0=G.year;
  for(let s=0;s<seasons;s++){ let n=0; while(!(period()==='season'&&G.year===Y0+s&&G.day>=G.cal.open+100)&&n++<900)step();
    const L=G.teams.map(t=>t.id).sort((a,b)=>((seed*7+a*13+s*5)%10)-((seed*7+b*13+s*5)%10)).slice(0,per);
    for(const tid of L){ const e=cupEntryNow({tid,name:names[ni++%names.length]}); const r=G.sea&&G.sea.rec&&G.sea.rec[tid]; if(r)e.res={w:r.w,l:r.l,t:r.t||0}; e.wid='w'+(seed*1000+s*10+tid).toString(16).padStart(16,'0'); e.seasons=s+2; e.h=FrontOfficeCore.cupEntryHash(e); out.push(e); } }
  return out; }
return {cupMatch, cupOvr, cupAiEntries, FrontOfficeCore, __mock};`)(quiet);
  return E;
}
const C = () => engine().FrontOfficeCore;
const J = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const W = (f, s) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); };
const stPath = () => path.join(DIR, 'cup.json');
function load() { if (!DIR || !fs.existsSync(stPath())) { console.error('대회 폴더가 없습니다. 먼저: node tools/cup-host.cjs init DIR'); process.exit(2); } return J(stPath()); }
function save(S) { W(stPath(), JSON.stringify(S, null, 1)); }
const entryFile = h => path.join(DIR, 'entries', h + '.json');
const entryOf = (h) => J(entryFile(h));
const lab = m => m ? (m.ai ? m.name : `${m.name} ${m.year}`) : '미정';
const isLeague = S => (S.cfg.format || 'knockout') === 'league'; /* 예전 대회 폴더(형식 없음)는 토너먼트 */
/* 조사: 마지막 글자 받침(숫자는 읽는 소리)으로 이/가, 을/를 */
function jo(w, pair) { const c = String(w).trim().slice(-1); let bat;
  if (/[0-9]/.test(c)) bat = '013678'.includes(c); else { const k = c.charCodeAt(0) - 0xAC00; bat = k >= 0 && k <= 11171 ? k % 28 !== 0 : false; }
  const [a, b] = pair.split('/'); return w + (bat ? a : b); }
const ovrTxt = o => o ? `${o.t}|${o.p} ${o.b}` : '-';

function parseBest(s) { const o = { default: 1 }; for (const part of String(s || '').split(',')) { const [a, b] = part.split(':'); if (b == null) o.default = +a || 1; else o[+a] = +b || 1; } return o; }
function cmdInit() {
  if (fs.existsSync(stPath())) { console.error('이미 대회 폴더가 있습니다: ' + stPath()); process.exit(1); }
  const D = { ...C().CUP_DEFAULT };
  const cfg = Object.assign({}, D, { format: opt('--format', D.format), teams: +opt('--teams', D.teams), best: opt('--best') ? parseBest(opt('--best')) : D.best, id: opt('--id', D.id), title: opt('--title', D.title), size: +opt('--size', D.size),
    shuffleTop: +opt('--shuffle', 0), blocks: +opt('--blocks', 0), minSeasons: +opt('--min-seasons', 0), payCap: +opt('--pay-cap', 0), payCapX: +opt('--pay-cap-x', 0), deadline: opt('--deadline', '') });
  if (!C().cupTeamsOk(cfg)) { console.error(`리그 대회 팀 수는 ${C().CUP_TEAMS_MIN}~${C().CUP_TEAMS_MAX}팀입니다(가을야구가 4·5위 와일드카드부터).`); process.exit(1); } /* 외부 검수 11-17 P2 */
  if (opt('--playin')) { const [d, g] = opt('--playin').split(':'); cfg.playIn = { direct: +d, groupSize: +g || 4 }; }
  save({ v: 1, cfg, entries: {}, seeds: null, bracket: null, series: {}, stats: { bat: {}, pit: {} }, created: new Date().toISOString() });
  if (!/^[A-Za-z0-9_]{1,20}$/.test(cfg.id)) { console.error('대회 id는 영문·숫자 20자 이내로 정해 주세요(예: cup1).'); process.exit(2); }
  console.log(`대회 폴더를 만들었습니다: ${DIR}\n${cfg.title} (${cfg.id}) · ${cfg.format === 'league' ? `${cfg.teams}팀 리그(팀당 ${(cfg.teams - 1) * cfg.meet}경기) → 와일드카드·준PO·PO·KS` : `${cfg.size}강 · 경기 수 ${JSON.stringify(cfg.best)}`}`);
}
/* 엔트리 넣기: 형식·자격 검사, 팀 OVR은 주최 도구가 다시 계산(게임이 보낸 값과 1 넘게 다르면 표시) */
function addEntry(S, e, src) {
  const Core = C(); if (!e || e.kind !== 'cup-entry') return console.log(`  건너뜀(엔트리 아님): ${src}`);
  const v = Core.cupValidate(e, S.cfg); const ovr = engine().cupOvr(e), h = Core.cupEntryHash(e);
  const flags = v.flags.map(x => x.msg); if (e.ovr && (Math.abs(e.ovr.t - ovr.t) > 1 || Math.abs(e.ovr.p - ovr.p) > 1 || Math.abs(e.ovr.b - ovr.b) > 1)) flags.push(`게임이 보낸 OVR ${ovrTxt(e.ovr)}와 다시 계산한 OVR ${ovrTxt(ovr)}가 다릅니다.`);
  const same = Object.values(S.entries).find(x => x.wid && e.wid && x.wid === e.wid && x.h !== h);
  if (same) { console.log(`  같은 세계 id의 예전 엔트리를 바꿉니다: ${lab(same)} → ${e.name} ${e.year}`); delete S.entries[same.h]; }
  e.ovr = ovr; e.h = h; W(entryFile(h), JSON.stringify(e));
  S.entries[h] = { h, name: e.name, year: e.year, wid: e.wid || '', ovr, n: e.P.length, faces: e.P.filter(p => p.f).length, errors: v.errors.map(x => x.msg), elig: e.ai ? [] : v.elig.map(x => x.msg), flags, src: path.basename(String(src)), drop: false, ...(e.ai ? { ai: true } : {}) };
  if (!e.ai) console.log(`  ${v.ok && !v.elig.length ? '받음' : '문제'} ${e.name} ${e.year} · OVR ${ovrTxt(ovr)}${flags.length ? ' · 이상치 ' + flags.length : ''}${v.errors.length ? ' · 오류: ' + v.errors[0].msg : ''}${v.elig.length ? ' · 자격: ' + v.elig[0].msg : ''}`);
}
function cmdAdd() {
  const S = load(); if ((S.bracket && S.bracket.started) || S.league) { console.error('경기를 시작한 뒤에는 엔트리를 더할 수 없습니다.'); process.exit(1); }
  if (!files.length) { console.error('넣을 파일을 적어 주세요: node tools/cup-host.cjs add DIR 참가파일.json'); process.exit(2); }
  for (const f of files) { const x = J(f); const L = Array.isArray(x) ? x : x.entries ? x.entries : [x]; for (const e of L) addEntry(S, e, f); }
  save(S); console.log(`참가 ${Object.keys(S.entries).length}팀`);
}
async function cmdPull() {
  const url = opt('--url'), key = process.env.CUP_ADMIN; if (!url || !key) { console.error('--url과 환경 변수 CUP_ADMIN이 필요합니다.'); process.exit(2); }
  const r = await fetch(url.replace(/\/$/, '') + '/api/cup/admin/entries', { headers: { Authorization: 'Bearer ' + key } }); if (!r.ok) { console.error('받지 못했습니다: ' + r.status); process.exit(1); }
  const j = await r.json(); const S = load(); for (const e of j.entries || []) addEntry(S, e, 'server'); save(S); console.log(`서버 신청 ${(j.entries || []).length}개를 넣었습니다.`);
}
const playable = S => Object.values(S.entries).filter(x => !x.drop && !x.errors.length && !x.elig.length);
const humans = S => playable(S).filter(x => !x.ai);
function cmdList() {
  const S = load(); const Core = C(); const L = Core.cupSeed(Object.values(S.entries));
  L.filter(x => !x.ai).forEach((x, i) => console.log(`${String(i + 1).padStart(3)} ${x.h} ${lab(x).padEnd(16)} ${ovrTxt(x.ovr).padEnd(9)} ${x.drop ? '[제외] ' : ''}${x.errors.length ? '[오류] ' + x.errors.join(' / ') : ''}${x.elig.length ? '[자격] ' + x.elig.join(' / ') : ''}${x.flags.length ? ' [이상치] ' + x.flags.join(' / ') : ''}${x.faces < x.n ? ` (사진 ${x.faces}/${x.n})` : ''}`));
}
function cmdDrop() { const S = load(); const h = files[0]; if (!S.entries[h]) { console.error('그 해시의 엔트리가 없습니다.'); process.exit(1); } if (S.bracket && S.bracket.started) { console.error('경기를 시작한 뒤에는 뺄 수 없습니다.'); process.exit(1); } S.entries[h].drop = !flag('--undo'); save(S); console.log(`${lab(S.entries[h])} ${flag('--undo') ? '다시 넣었습니다' : '뺐습니다'}.`); }
function cmdSeed() {
  const S = load(); if (isLeague(S)) return seedLeague(S); if (S.bracket && S.bracket.started) { console.error('이미 경기를 시작했습니다. 시드를 바꾸지 않습니다.'); process.exit(1); }
  const Core = C(), L = Core.cupSeed(playable(S)); if (L.length < 2) { console.error('참가팀이 2팀 이상이어야 합니다.'); process.exit(1); }
  S.seeds = L.map(x => x.h); L.forEach((x, i) => { S.entries[x.h].seed = i + 1; });
  S.bracket = Core.cupBracket(S.seeds, S.cfg); S.bracket.started = false; save(S);
  console.log(`시드 확정: ${L.length}팀 · ${S.bracket.size}강${S.bracket.playIn.length ? ` · 플레이인 ${S.bracket.playIn.length}조` : ''}`);
  L.forEach((x, i) => console.log(`${String(i + 1).padStart(3)} ${lab(x).padEnd(16)} ${ovrTxt(x.ovr)}`));
}
/* 블록: 대진표를 같은 크기로 나눈 구간(A·B…). 경기가 한 블록 안이면 그 블록 */
function blockOf(B, mid) { if (!B.blocks) return null; const m = mid.match(/^R(\d+)M(\d+)$/); if (!m) return null; const r = +m[1] - 1, i = +m[2] - 1, span = 2 ** (r + 1), per = B.size / B.blocks; if (span > per) return null; return String.fromCharCode(65 + Math.floor(i * span / per)); }
function roundName(n, pi) { return pi ? `플레이인 ${pi}조` : C().cupRoundName(n); }
/* 경기 다시 보기(게임 › 구단 › 프런트컵 › 대회 경기 보기): 주최자가 돌린 그 기록을 그대로 올린다(게임은 다시 돌리지 않는다).
   games/ID.json = 시리즈 요약(팀·차전 점수), games/ID-gN.json = 그 차전의 중계·박스·줄 점수. 게임은 요약을 먼저 받고, 차전을 고를 때 그 차전만 받는다 */
function gameRecs(id, title, A, B, res) {
  W(path.join(DIR, 'games', id + '.json'), JSON.stringify({ v: 2, id, title, a: A, b: B, g: res.games.map(g => [g.sa, g.sb, g.inn || 9, g.walk ? 1 : 0]) }));
  res.games.forEach((g, i) => W(path.join(DIR, 'games', `${id}-g${i + 1}.json`), JSON.stringify({ v: 2, id: `${id}-g${i + 1}`, sa: g.sa, sb: g.sb, log: g.log, bat: g.bat, pit: g.pit, line: g.line })));
}
/* 명예의 전당 우승 덱: 엔트리 그대로(타순·선발·불펜·감독·얼굴 사진). 세계 id는 빼고 해시만 남긴다. 게임에서 '이 덱 가져오기'로 유저 래더 도전 덱이 된다 */
function hallDeck(h) { const e = JSON.parse(JSON.stringify(entryOf(h))); delete e.wid; delete e.ts; delete e.at; e.h = C().cupEntryHash(e); return e; }
function stripFaces(e) { const x = JSON.parse(JSON.stringify(e)); for (const p of x.P) delete p.f; return x; }
function addStats(S, res, T, labs) {
  T = T || S.stats; const tm = k => labs ? labs[k] : res[k.toLowerCase()].name + ' ' + res[k.toLowerCase()].year;
  for (const g of res.games) {
    for (const b of g.stats.bat) { const t = T.bat[b.key] || (T.bat[b.key] = { key: b.key, team: tm(b.k), name: b.name, g: 0 }); t.g++; for (const k of ['pa', 'ab', 'h', 'd', 'tr', 'hr', 'bb', 'hbp', 'sf', 'rbi', 'r', 'sb', 'so']) t[k] = (t[k] || 0) + (b[k] || 0); }
    for (const p of g.stats.pit) { const t = T.pit[p.key] || (T.pit[p.key] = { key: p.key, team: tm(p.k), name: p.name, g: 0 }); t.g++; for (const k of ['outs', 'h', 'bb', 'so', 'r', 'er', 'hr', 'w', 'l', 'sv', 'gs']) t[k] = (t[k] || 0) + (p[k] || 0); }
  }
}
/* 게시글 초안(합니다체) */
function postOf(S, info, res, g, gi, note, labs) {
  const A = res.a, B = res.b, LA = labs ? labs.A : `${A.name} ${A.year}`, LB = labs ? labs.B : `${B.name} ${B.year}`, side = k => k === 'A' ? LA : LB;
  const wL = g.sa > g.sb ? LA : LB, lL = g.sa > g.sb ? LB : LA, ws = Math.max(g.sa, g.sb), ls = Math.min(g.sa, g.sb);
  const ser = info.ser != null ? info.ser : res.best > 1 ? ` ${gi + 1}차전` : '';
  const out = [`[${S.cfg.title} ${info.rname}${ser}] ${LA} vs ${LB}`, ''];
  out.push('■ 선발 매치업', `${LA} ${g.sp.A ? `${g.sp.A.name}(${g.sp.A.o})` : '-'} vs ${LB} ${g.sp.B ? `${g.sp.B.name}(${g.sp.B.o})` : '-'}`, '');
  out.push('■ 하이라이트');
  if (g.hl.length) for (const h of g.hl) out.push(`[${h.inn}회${h.half}] ${h.team} ${h.runs}득점: ${h.plays.join(', ')} · ${h.score}`); else out.push('양 팀 모두 점수를 내지 못했습니다.');
  if (g.sa === g.sb) out.push('', '■ 경기 결과', `${LA}와 ${LB}는 ${g.sa}:${g.sb}로 비겼습니다(${g.inn}회).`);
  else out.push('', '■ 경기 결과', `${jo(wL, '이/가')} ${jo(lL, '을/를')} ${ws}:${ls}${'036'.includes(String(ls).slice(-1)) ? '으로' : '로'} 이겼습니다.${g.walk ? ` ${g.inn}회 끝내기 승리입니다.` : g.inn > 9 ? ` ${g.inn}회 연장 승부였습니다.` : ''}`);
  if (g.wh) out.push(`결승타는 ${g.wh.name}(${side(g.wh.k)})의 ${g.wh.txt}입니다.`);
  if (g.sa !== g.sb) out.push(`승리투수 ${g.dec.w} / 세이브 ${g.dec.sv || '없음'} / 패전투수 ${g.dec.l}`);
  out.push('', '■ 줄 점수', g.line, '');
  out.push('■ 선수 기록', '타자·투수 기록은 첨부한 EventLog_bat.txt, EventLog_pit.txt에 있습니다.');
  const top = g.stats.bat.filter(b => b.h >= 2 || b.hr || b.rbi >= 2).sort((a, b) => (b.hr - a.hr) || (b.rbi - a.rbi) || (b.h - a.h)).slice(0, 4);
  for (const b of top) out.push(`- ${b.name}(${side(b.k)}): ${b.ab}타수 ${b.h}안타${b.hr ? ` ${b.hr}홈런` : ''} ${b.rbi}타점`);
  const sp = g.stats.pit.filter(p => p.gs); for (const p of sp) out.push(`- 선발 ${p.name}(${side(p.k)}): ${Math.floor(p.outs / 3)}${p.outs % 3 ? '.' + p.outs % 3 : ''}이닝 ${p.h}피안타 ${p.so}탈삼진 ${p.er}자책`);
  out.push('', '■ MVP 후보', g.mvp && g.sa !== g.sb ? `${g.mvp.name}(${side(g.mvp.k)}): ${g.mvp.txt}` : '-', '', info.noteH || '■ 대진표 갱신', note, '');
  out.push(`경기 다시 보기 번호: ${S.cfg.id}-${info.mid}${res.games.length > 1 ? ` (${gi + 1}차전)` : ''} (게임 › 구단 › 프런트컵 › 대회 경기 보기)`);
  return out.join('\n');
}
function nextNote(S, info, res, done) {
  const A = res.a, B = res.b, LA = `${A.name} ${A.year}`, LB = `${B.name} ${B.year}`;
  if (!done) return `시리즈는 ${LA} ${res.wa}승, ${LB} ${res.wb}승입니다. 다음 경기가 이어집니다.`;
  const W = res.win === 'A' ? LA : LB, wins = `${Math.max(res.wa, res.wb)}승 ${Math.min(res.wa, res.wb)}패`;
  const Core = C(), B2 = S.bracket; const champ = Core.cupChampion(B2);
  if (champ) return `${jo(W, '이/가')} ${res.best > 1 ? wins + '로 ' : ''}${S.cfg.title} 우승을 차지했습니다.`;
  const nx = Core.cupNext(B2);
  return `${jo(W, '이/가')} ${res.best > 1 ? wins + '로 ' : ''}다음 라운드에 올랐습니다.${nx ? ` 다음 경기는 ${lab(S.entries[nx.a])} vs ${lab(S.entries[nx.b])}입니다.` : ''}`;
}
function runOne(S) {
  const Core = C(); const B = S.bracket; if (!B) { console.error('먼저 seed를 실행하세요.'); process.exit(1); }
  const nx = Core.cupNext(B); if (!nx) return false;
  const { m, pi } = nx; let a = nx.a, b = nx.b; const sa0 = S.entries[a].seed, sb0 = S.entries[b].seed; const swap = sb0 < sa0; if (swap) [a, b] = [b, a]; /* A = 높은 시드(1차전 홈) */
  const mid = (pi ? pi + '-' : '') + m.id, rname = roundName(m.n, pi), EA = entryOf(a), EB = entryOf(b);
  const t0 = Date.now(); const res = engine().cupMatch(EA, EB, { cup: S.cfg.id, round: pi || ('R' + m.n), match: mid, best: m.best }); const ms = Date.now() - t0;
  if (!res.ok) { console.error('경기 실패: ' + JSON.stringify(res.errors || res)); process.exit(1); }
  const winKey = res.win === 'A' ? a : b; m.win = winKey; const wA = swap ? res.wb : res.wa, wB = swap ? res.wa : res.wb; m.w = [wA, wB];
  m.games = res.games.map(g => swap ? { sa: g.sb, sb: g.sa, walk: g.walk } : { sa: g.sa, sb: g.sb, walk: g.walk }); B.started = true;
  S.series[mid] = { id: mid, n: m.n, pi: pi || null, a, b, seedA: S.entries[a].seed, seedB: S.entries[b].seed, win: winKey, label: `${rname} ${lab(S.entries[a])} vs ${lab(S.entries[b])}`, block: blockOf(B, m.id), best: m.best, games: res.games.map(g => ({ sa: g.sa, sb: g.sb, walk: g.walk })), ms };
  addStats(S, res);
  const dir = path.join(DIR, 'out', mid); const info = { mid, rname };
  res.games.forEach((g, gi) => {
    const gd = res.games.length > 1 ? path.join(dir, 'g' + (gi + 1)) : dir;
    W(path.join(gd, 'EventLog.txt'), g.log + '\n'); W(path.join(gd, 'EventLog_bat.txt'), g.bat + '\n'); W(path.join(gd, 'EventLog_pit.txt'), g.pit + '\n'); W(path.join(gd, 'LineScore.txt'), g.line + '\n');
    W(path.join(gd, 'post.txt'), postOf(S, info, res, g, gi, nextNote(S, info, res, gi === res.games.length - 1)) + '\n');
  });
  gameRecs(`${S.cfg.id}-${mid}`, rname, lab(S.entries[a]), lab(S.entries[b]), res);
  console.log(`${mid} ${rname}: ${lab(S.entries[a])} ${res.wa}-${res.wb} ${lab(S.entries[b])} → ${lab(S.entries[winKey])} (${res.games.map(g => g.sa + ':' + g.sb).join(', ')}) · ${ms}ms, 경기당 ${Math.round(ms / res.games.length)}ms`);
  return true;
}
function cmdNext(all) { const S = load(); if (isLeague(S)) return runLeague(S); let n = all ? 1e9 : +opt('--count', 1), k = 0; while (k < n && runOne(S)) { k++; save(S); } if (!k) console.log(C().cupChampion(S.bracket) ? '모든 경기가 끝났습니다.' : '치를 경기가 없습니다(시드를 먼저 정하세요).'); }
function cmdStatus() {
  const S = load(); if (isLeague(S)) return statusLeague(S);
  const Core = C(), B = S.bracket; if (!B) return console.log('아직 시드를 정하지 않았습니다.');
  const nm = v => { const k = Core.cupResolve(B, v); return k === null ? '(부전승)' : k === undefined ? '미정' : `${S.entries[k].seed}. ${lab(S.entries[k])}`; };
  for (const p of B.playIn || []) console.log(`플레이인 ${p.id}: ${p.teams.map(k => lab(S.entries[k])).join(', ')} → ${nm('Q:' + p.id)}`);
  B.rounds.forEach(L => { console.log(`== ${Core.cupRoundName(L[0].n)} (${L[0].best === 1 ? '단판' : L[0].best + '전 ' + (Math.floor(L[0].best / 2) + 1) + '선승'})`); for (const m of L) console.log(`  ${m.id} ${nm(m.a)} vs ${nm(m.b)}${m.win ? ` → ${lab(S.entries[m.win])} ${m.w.join('-')}` : ''}`); });
  const c = Core.cupChampion(B); if (c) console.log(`우승: ${lab(S.entries[c])}`);
}
/* 결과: 우승·준우승·4강·8강, 미션상, 개인 타이틀(기준 타석·이닝은 대회 경기 수에 맞춰 줄인다) */
function cmdResults() {
  const S = load(); if (isLeague(S)) return resultsLeague(S);
  const Core = C(), B = S.bracket; if (!B) { console.error('시드가 없습니다.'); process.exit(1); }
  const champ = Core.cupChampion(B), fin = B.rounds[B.rounds.length - 1][0], runner = fin.win ? (Core.cupResolve(B, fin.a) === fin.win ? Core.cupResolve(B, fin.b) : Core.cupResolve(B, fin.a)) : null;
  const lost = n => { const L = B.rounds.find(R => R[0].n === n) || []; return L.filter(m => m.win).map(m => { const a = Core.cupResolve(B, m.a), b = Core.cupResolve(B, m.b); return a === m.win ? b : a; }).filter(Boolean); };
  const ros = h => { const e = entryOf(h), P = new Map(e.P.map(p => [p.id, p])), dv = p => Core.dv(p.isP ? p.r.stf * .44 + p.r.ctl * .44 + p.r.sta * .12 : p.r.con * .3 + p.r.pow * .25 + p.r.eye * .15 + p.r.spd * .1 + p.r.def * .2);
    return [...e.ln.map(([id, pos]) => ({ pos, n: P.get(id).name, o: dv(P.get(id)) })), ...e.rot.map((id, i) => ({ pos: `선발${i + 1}`, n: P.get(id).name, o: dv(P.get(id)) })), ...(e.pen[0] ? [{ pos: '마무리', n: P.get(e.pen[0]).name, o: dv(P.get(e.pen[0])) }] : [])]; };
  const who = h => h ? { name: S.entries[h].name, year: S.entries[h].year, ovr: S.entries[h].ovr, seed: S.entries[h].seed, wh: S.entries[h].wid ? Core.cupHashStr('wid:' + S.entries[h].wid) : null } : null;
  const series = Object.values(S.series).map(s => Object.assign({}, s, { label: s.label }));
  const missions = Core.cupMissions(series).map(m => Object.assign(m, { team: m.who ? lab(S.entries[m.who]) : '' }));
  const gTot = Object.values(S.series).reduce((a, s) => a + s.games.length, 0), teams = playable(S).length, gpt = teams ? gTot * 2 / teams : 1;
  const q = { pa: Math.min(65, Math.max(3, Math.round(gpt * 3.1))), outs: Math.min(63, Math.max(3, Math.round(gpt * 3))) };
  const titles = Core.cupTitles(Object.values(S.stats.bat), Object.values(S.stats.pit), q);
  const out = { v: 1, id: S.cfg.id, title: S.cfg.title, date: new Date().toISOString().slice(0, 10), n: teams, games: gTot, done: !!champ,
    champ: champ ? Object.assign(who(champ), { roster: ros(champ), deck: hallDeck(champ) }) : null, runner: runner ? Object.assign(who(runner), { roster: ros(runner) }) : null,
    semis: lost(4).map(who), eight: lost(8).map(who), missions, titles, q };
  W(path.join(DIR, 'out', 'results.json'), JSON.stringify(out, null, 1));
  /* 서버 공개 결과(유저의 전당): 지난 회차를 이어 붙인 목록 */
  const hall = path.join(DIR, 'out', 'hall.json'); let H = { v: 1, cups: [] }; if (process.env.CUP_HALL && fs.existsSync(process.env.CUP_HALL)) H = J(process.env.CUP_HALL);
  H.cups = H.cups.filter(c => c.id !== out.id).concat([{ id: out.id, title: out.title, date: out.date, n: out.n, champ: out.champ, runner: out.runner, semis: out.semis, eight: out.eight, missions: out.missions.map(m => ({ k: m.k, msg: m.msg })), titles: out.titles }]); W(hall, JSON.stringify(H));
  /* 파워랭킹: 회차(목록 순서)별 도달 라운드 점수, 덱 = 팀명 */
  const hist = []; H.cups.forEach((c, i) => { const add = (x, best) => x && hist.push({ no: i + 1, deck: x.name, best }); add(c.champ, 1); add(c.runner, 2); (c.semis || []).forEach(x => add(x, 4)); (c.eight || []).forEach(x => add(x, 8)); });
  const power = Core.cupPower(hist, H.cups.length);
  const L = [`[${S.cfg.title} 결과]`, ''];
  if (champ) L.push(`우승 ${lab(S.entries[champ])} (${S.entries[champ].seed}번 시드, OVR ${ovrTxt(S.entries[champ].ovr)})`, `준우승 ${lab(S.entries[runner])}`, `4강 ${lost(4).map(h => lab(S.entries[h])).join(', ')}`, '');
  else L.push('아직 대회가 끝나지 않았습니다.', '');
  L.push('■ 미션상'); if (missions.length) for (const m of missions) L.push(`- ${m.msg} → ${m.team}`); else L.push('- 해당 없음');
  L.push('', `■ 개인 타이틀 (타율·출루율 ${q.pa}타석, 평균자책점·WHIP·K/9 ${Math.floor(q.outs / 3)}이닝 이상)`); for (const t of titles) L.push(`- ${t.k}: ${t.name}(${t.team}) ${t.v}`);
  L.push('', '■ 파워랭킹(상위 10)'); power.slice(0, 10).forEach((x, i) => L.push(`${i + 1}. ${x.deck} ${x.pts}점`));
  W(path.join(DIR, 'out', 'results.txt'), L.join('\n') + '\n'); console.log(L.join('\n'));
}
async function cmdPublish() {
  const url = (opt('--url') || '').replace(/\/$/, ''), key = process.env.CUP_ADMIN; if (!url || !key) { console.error('--url과 환경 변수 CUP_ADMIN이 필요합니다.'); process.exit(2); }
  const S = load(), H = { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }, put = async (p, body) => { const r = await fetch(url + p, { method: 'PUT', headers: H, body }); console.log(`${r.ok ? '올림' : '실패 ' + r.status} ${p}`); };
  await put('/api/cup/admin/config', JSON.stringify(Object.assign({}, S.cfg, { open: isLeague(S) ? !S.league && !S.seeds : !S.bracket || !S.bracket.started })));
  const gd = path.join(DIR, 'games'); if (fs.existsSync(gd)) for (const f of fs.readdirSync(gd)) await put('/api/cup/admin/game/' + f.replace(/\.json$/, ''), fs.readFileSync(path.join(gd, f), 'utf8'));
  const hall = path.join(DIR, 'out', 'hall.json'); if (fs.existsSync(hall)) await put('/api/cup/admin/results', fs.readFileSync(hall, 'utf8'));
}
function cmdMock() {
  const n = +opt('--n', 32), seeds = String(opt('--seeds', '7,11')).split(',').map(Number), seasons = +opt('--seasons', 2), per = Math.ceil(n / (seeds.length * seasons));
  const names = ['와이', '제이지', '미르', '한빛', '청솔', '새벽별', '은하수', '돌직구', '강철팔', '번개발', '흑표범', '백호', '청룡', '주작', '현무', '봉황', '해오름', '달빛', '별똥별', '파도', '태풍', '눈보라', '불꽃', '소나기', '천둥', '무지개', '솔바람', '노을', '다솜', '가람', '한울', '초롱'];
  if (!fs.existsSync(stPath())) { console.error('먼저 init으로 대회 폴더를 만드세요.'); process.exit(2); }
  const S = load(); let all = [];
  seeds.forEach((sd, i) => { const t = Date.now(); const L = engine().__mock(sd, seasons, per, names.slice(i * seasons * per).concat(names)); console.log(`커리어 시드 ${sd}: ${L.length}개 · ${Math.round((Date.now() - t) / 1000)}초`); all = all.concat(L); });
  for (const e of all.slice(0, n)) addEntry(S, e, 'mock'); save(S); console.log(`가짜 엔트리 ${Math.min(n, all.length)}개`);
}
/* ===== 이미지(Playwright) ===== */
async function browser() {
  let pw; try { pw = require(path.join(ROOT, 'tools', 'node_modules', 'playwright')); } catch (e) { pw = require('playwright'); }
  return pw.chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {});
}
let BADGES = null;
function badgeSrc(e) { if (!BADGES) { try { const t = fs.readFileSync(path.join(ROOT, 'src', 'ui', 'assets', '00a_badges_data.js'), 'utf8'); BADGES = JSON.parse(t.slice(t.indexOf('{', t.indexOf('BADGE_IMG=')), t.lastIndexOf('}') + 1)); } catch (x) { BADGES = {}; } }
  const c = e.club || {}; const B = Object.values(BADGES).find(b => b.k === c.badge) || BADGES[String(c.tid)]; return B ? B.s : null; }
const hx = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const FONT = `"Noto Sans KR","Noto Sans CJK KR","Malgun Gothic","Apple SD Gothic Neo",sans-serif`;
/* 얼굴: 게임 화면(index.html)의 얼굴 함수(face6Src)를 그대로 써서, 엔트리 구단 유니폼 시트에서 나이에 맞는 얼굴을 고른다 */
async function cmdFaces() {
  const S = load(); const L = Object.values(S.entries).filter(x => x.faces < x.n); if (!L.length) return console.log('모든 선수에게 사진이 있습니다.');
  const br = await browser(); const pg = await br.newPage(); await pg.goto('file://' + path.join(ROOT, 'index.html')); await pg.waitForFunction(() => typeof face6Src === 'function' && typeof FACE6 !== 'undefined', null, { timeout: 60000 });
  for (const x of L) {
    const e = entryOf(x.h); const want = e.P.filter(p => !p.f).map(p => ({ id: p.id, team: e.club && e.club.tid != null ? e.club.tid : 0, age: p.age, foreign: p.foreign || null, name: p.name }));
    const got = await pg.evaluate(async (want) => {
      const P0 = face6Pool; face6Pool = p => P0(p).filter(i => i < 100); /* 내장 시트(100명)만: 추가 얼굴(v13)은 사이트 파일이 있어야 열린다 */ const G0 = G; G = { f6: {}, f6r: {}, f6v: FACE6.v === '6c' ? 3 : 2, players: {}, games: [], teams: [] }; for (const w of want) G.players[w.id] = w; const out = {};
      try { for (let k = 0; k < 40; k++) { let wait = 0; for (const w of want) { if (out[w.id]) continue; let u = null; try { u = face6Src(w); } catch (x) {} if (!u || u === F6WAIT) { wait++; continue; }
            const im = new Image(); await new Promise(r => { im.onload = r; im.onerror = r; im.src = u; }); const c = document.createElement('canvas'); c.width = c.height = 64; c.getContext('2d').drawImage(im, 0, 0, 64, 64); out[w.id] = c.toDataURL('image/webp', .72); }
          if (!wait) break; await new Promise(r => setTimeout(r, 250)); } } finally { G = G0; face6Pool = P0; }
      return out; }, want);
    let n = 0; for (const p of e.P) if (!p.f && got[p.id]) { p.f = got[p.id]; n++; }
    W(entryFile(x.h), JSON.stringify(e)); x.faces = e.P.filter(p => p.f).length; console.log(`  ${lab(x)}: 사진 ${n}장 채움`);
  }
  await br.close(); save(S);
}
function cardHtml(e, seed) {
  const Core = C(), P = new Map(e.P.map(p => [p.id, p])), dv = p => Core.dv(p.isP ? p.r.stf * .44 + p.r.ctl * .44 + p.r.sta * .12 : p.r.con * .3 + p.r.pow * .25 + p.r.eye * .15 + p.r.spd * .1 + p.r.def * .2);
  const pal = (e.club && e.club.pal) || [`hsl(${(e.club && e.club.hue) || 210} 55% 35%)`, '#e8ecf2', `hsl(${(e.club && e.club.hue) || 210} 45% 16%)`, '#9fb0c4'];
  const face = p => p && p.f ? `<img class="f" src="${p.f}">` : `<div class="f nf">${hx((p && p.name || '?').slice(0, 1))}</div>`;
  const posOf = new Map(e.ln.map(([id, pos]) => [id, pos])); const bench = e.bn.map(id => P.get(id)).filter(Boolean);
  const backups = pos => bench.filter(p => p.pos === pos || (pos === 'DH' && !['C'].includes(p.pos) && !e.ln.some(([, q]) => q === p.pos))).slice(0, 2);
  const used = new Set(); const spot = (pos, x, y) => { const id = [...posOf].find(([, q]) => q === pos); const p = id ? P.get(id[0]) : null; const bk = backups(pos).filter(b => !used.has(b.id)); bk.forEach(b => used.add(b.id));
    return `<div class="sp" style="left:${x}px;top:${y}px">${face(p)}<div class="t"><i>${pos}</i><b>${hx(p ? p.name : '-')}</b><em>${p ? dv(p) : ''}</em></div>${bk.length ? `<div class="bk">${bk.map(b => `${hx(b.name)} ${dv(b)}`).join(' · ')}</div>` : ''}</div>`; };
  const rot = e.rot.map(id => P.get(id)).filter(Boolean), pen = e.pen.map(id => P.get(id)).filter(Boolean), cl = pen[0], setup = pen.slice(1, 4), rest = pen.slice(4);
  const row = (k, p) => `<div class="r">${face(p)}<i>${k}</i><b>${hx(p.name)}</b><em>${dv(p)}</em></div>`;
  const badge = badgeSrc(e); const res = e.res ? `${e.res.rank ? e.res.rank + '위 · ' : ''}${e.res.w}승 ${e.res.l}패${e.res.champ ? ' · 우승' : ''}` : '';
  return `<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box}body{margin:0;font-family:${FONT};background:#0d1117;color:#e8ecf2}
.card{width:960px;height:640px;position:relative;overflow:hidden;background:linear-gradient(150deg,${pal[0]} 0%,${pal[2]} 55%,#0b0f14 100%)}
.hd{position:absolute;left:24px;top:18px;right:24px;display:flex;align-items:center;gap:14px}.hd img{width:56px;height:56px}.hd h1{margin:0;font-size:30px;letter-spacing:-.5px}.hd .s{font-size:14px;opacity:.85}
.ovr{margin-left:auto;text-align:right}.ovr b{font-size:34px;font-variant-numeric:tabular-nums}.ovr span{display:block;font-size:13px;opacity:.85}
.field{position:absolute;left:16px;top:88px;width:600px;height:536px}.dia{position:absolute;left:150px;top:150px;width:300px;height:300px;transform:rotate(45deg);border:3px solid rgba(255,255,255,.25);background:rgba(60,140,80,.18)}
.sp{position:absolute;width:150px;display:grid;grid-template-columns:44px 1fr;gap:2px 6px;align-items:center}.sp .t{display:grid;line-height:1.15}.sp i{font-style:normal;font-size:11px;opacity:.8}.sp b{font-size:14px}.sp em{font-style:normal;font-weight:800;color:#ffd166;font-size:15px}
.sp .bk{grid-column:1/-1;font-size:10.5px;opacity:.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.f{width:44px;height:44px;border-radius:8px;object-fit:cover;background:#2a3340;border:1px solid rgba(255,255,255,.25)}.nf{display:grid;place-items:center;font-weight:800}
.side{position:absolute;right:20px;top:92px;width:320px;bottom:16px;display:grid;align-content:start;gap:4px}
.side h3{margin:6px 0 2px;font-size:13px;opacity:.85;border-bottom:1px solid rgba(255,255,255,.2);padding-bottom:2px}
.r{display:grid;grid-template-columns:30px 44px 1fr 30px;gap:6px;align-items:center;font-size:13.5px}.r .f{width:30px;height:30px;border-radius:6px}.r i{font-style:normal;font-size:11px;opacity:.75}.r em{font-style:normal;font-weight:800;color:#ffd166;text-align:right}
.m{font-size:13px;opacity:.9}.sm{font-size:11.5px;opacity:.75}
</style></head><body><div class="card">
<div class="hd">${badge ? `<img src="${badge}">` : ''}<div><h1>${hx(e.name)} ${e.year}</h1><div class="s">${seed ? seed + '번 시드 · ' : ''}${hx((e.club && (e.club.city + ' ' + e.club.nick)) || '')}${res ? ' · ' + res : ''}</div></div>
<div class="ovr"><b>${e.ovr.t}</b><span>투수 ${e.ovr.p} · 타자 ${e.ovr.b}</span></div></div>
<div class="field"><div class="dia"></div>
${spot('CF', 225, 0)}${spot('LF', 20, 70)}${spot('RF', 430, 70)}${spot('SS', 120, 180)}${spot('2B', 330, 180)}${spot('3B', 30, 300)}${spot('1B', 420, 300)}${spot('C', 225, 440)}${spot('DH', 420, 440)}</div>
<div class="side"><h3>선발</h3>${rot.map((p, i) => row(i + 1 + '선발', p)).join('')}<h3>마무리 · 필승조</h3>${cl ? row('마무리', cl) : ''}${setup.map(p => row('필승조', p)).join('')}
${rest.length ? `<div class="sm">불펜: ${rest.map(p => `${hx(p.name)} ${dv(p)}`).join(' · ')}</div>` : ''}<h3>감독</h3><div class="m">${hx((e.mgr && e.mgr.name) || '-')}</div></div>
</div></body></html>`;
}
async function shot(pg, html, file, w, h) { await pg.setViewportSize({ width: w, height: h }); await pg.setContent(html, { waitUntil: 'load' }); W(file, ''); await pg.screenshot({ path: file, clip: { x: 0, y: 0, width: w, height: h } }); }
async function cmdCards() {
  const S = load(); const only = opt('--only'); const L = Object.values(S.entries).filter(x => !x.drop && (!only || x.h === only));
  const br = await browser(), pg = await br.newPage();
  for (const x of L) { const f = path.join(DIR, 'out', 'cards', `${x.seed ? String(x.seed).padStart(3, '0') + '_' : ''}${x.h}.png`); await shot(pg, cardHtml(entryOf(x.h), x.seed), f, 960, 640); console.log('  ' + f); }
  await br.close();
}
function bracketHtml(S) {
  const Core = C(), B = S.bracket, R = B.rounds, rows = R[0].length * 2, H = 30, gap = 4, colW = 230, top = 60;
  const cell = (v, m, k) => { const key = Core.cupResolve(B, v); const x = key ? S.entries[key] : null; const win = m.win && key && m.win === key, lose = m.win && key && m.win !== key;
    return `<div class="c${win ? ' w' : ''}${lose ? ' l' : ''}${key === null ? ' bye' : ''}">${x ? `<i>${x.seed}</i><b>${hx(lab(x))}</b><em>${ovrTxt(x.ovr)}</em>${m.w && (m.best > 1) ? `<u>${m.w[k]}</u>` : ''}` : key === null ? '<b>부전승</b>' : '<b class="tbd">TBD</b>'}</div>`; };
  let body = ''; R.forEach((L, r) => L.forEach((m, i) => { const center = i * 2 ** (r + 1) + 2 ** r, y0 = top + (center - 1) * (H + gap); body += `<div class="m" style="left:${20 + r * colW}px;top:${y0}px">${cell(m.a, m, 0)}${cell(m.b, m, 1)}</div>`; }));
  const champ = Core.cupChampion(B); const cx = 20 + R.length * colW; const W = cx + 240, Ht = top + rows * (H + gap) + 30;
  const heads = R.map((L, r) => `<div class="h" style="left:${20 + r * colW}px">${Core.cupRoundName(L[0].n)}${L[0].best > 1 ? ` · ${L[0].best}전${Math.floor(L[0].best / 2) + 1}선승` : ' · 단판'}</div>`).join('');
  return { w: W, h: Ht, html: `<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;font-family:${FONT};background:#f4f6f9;color:#16202b}
.b{position:relative;width:${W}px;height:${Ht}px}.t{position:absolute;left:20px;top:10px;font-size:20px;font-weight:800}.h{position:absolute;top:36px;font-size:12px;color:#5b6876;font-weight:700}
.m{position:absolute;width:${colW - 18}px;display:grid;gap:${gap}px}.c{height:${H}px;display:grid;grid-template-columns:22px 1fr auto auto;gap:6px;align-items:center;padding:0 8px;background:#fff;border:1px solid #d5dbe2;border-radius:6px;font-size:12.5px;white-space:nowrap;overflow:hidden}
.c i{font-style:normal;color:#7a8794;font-size:11px}.c b{overflow:hidden;text-overflow:ellipsis}.c em{font-style:normal;font-size:11px;color:#5b6876;font-variant-numeric:tabular-nums}.c u{text-decoration:none;font-weight:800}
.c.w{background:#fff6d6;border-color:#e0b100;font-weight:700}.c.l{opacity:.55}.c.bye{background:#eef1f4;color:#8a96a3}.tbd{color:#a0aab4;font-weight:400}
.ch{position:absolute;left:${cx}px;top:${top + rows / 2 * (H + gap) - 40}px;width:220px;padding:10px 12px;border-radius:10px;background:#16202b;color:#fff}.ch i{font-style:normal;font-size:12px;opacity:.8}.ch b{display:block;font-size:17px}</style></head>
<body><div class="b"><div class="t">${hx(S.cfg.title)} 대진표</div>${heads}${body}<div class="ch"><i>우승</i><b>${champ ? hx(lab(S.entries[champ])) : 'TBD'}</b>${champ ? `<i>OVR ${ovrTxt(S.entries[champ].ovr)}</i>` : ''}</div></div></body></html>` };
}
async function cmdBracket() { const S = load(); if (!S.bracket) { console.error('시드가 없습니다.'); process.exit(1); } const { w, h, html } = bracketHtml(S); const br = await browser(), pg = await br.newPage(); const f = path.join(DIR, 'out', 'bracket.png'); await shot(pg, html, f, w, h); await br.close(); console.log(f); }

const { seedLeague, runLeague, statusLeague, resultsLeague } = LEAGUE({ C, engine, entryOf, entryFile, addEntry, playable, humans, lab, jo, ovrTxt, save, load, W, J, postOf, addStats, stripFaces, gameRecs, hallDeck, DIR: () => DIR, opt });
const CMDS = { init: cmdInit, add: cmdAdd, pull: cmdPull, list: cmdList, drop: cmdDrop, seed: cmdSeed, next: () => cmdNext(false), run: () => cmdNext(true), status: cmdStatus, results: cmdResults, publish: cmdPublish, mock: cmdMock, faces: cmdFaces, cards: cmdCards, bracket: cmdBracket };
if (!CMDS[cmd] || !DIR) { console.error(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 20).join('\n')); process.exit(2); }
Promise.resolve(CMDS[cmd]()).catch(e => { console.error(e); process.exit(1); });
