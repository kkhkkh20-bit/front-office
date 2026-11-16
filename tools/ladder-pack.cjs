/* 단장 대전 리그 팩: 만들기와 headless 시즌 실행(기기에서 도는 것과 같은 엔진 코드).
 사용(dist/engine.js 필요: bash build.sh --engine-out dist/engine.js, 또는 ENGINE=경로):
   node tools/ladder-pack.cjs make A.json B.json … [--seed 시드] [--league id] [--meet 6] > pack.json   스냅샷 N개(2~10)로 팩
   node tools/ladder-pack.cjs make --auto 8 [--season L2026W47] [--seed 시드] [--meet 6]              자동 편성 구단으로 팩(시험용)
   node tools/ladder-pack.cjs run pack.json [--check] [--full]                                        팩 시즌 실행. 기본 출력은 순위·기록 요약과 결과 해시
   node tools/ladder-pack.cjs run --auto 8 [--meet 6] --check                                          팩을 만들어 바로 두 번 돌리고 해시 비교(다르면 종료 코드 1)
 시간은 표준 오류에만 적는다. 결과 해시(hash)는 순위·전 경기 점수·기록 1위를 모두 담는다: 기기·브라우저가 같은 팩에서 같은 해시를 내야 한다. */
const fs = require('node:fs'), path = require('node:path');
const ENGINE = process.env.ENGINE || path.join(__dirname, '..', 'dist', 'engine.js');
if (!fs.existsSync(ENGINE)) { console.error('엔진 파일이 없습니다: ' + ENGINE); process.exit(2); }
const args = process.argv.slice(2), cmd = args[0], flag = k => args.includes(k), VAL = ['--seed', '--league', '--meet', '--season', '--auto'];
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 && args[i + 1] != null ? args[i + 1] : d; };
const files = args.slice(1).filter((a, i, L) => !a.startsWith('--') && !VAL.includes(L[i - 1]));
const quiet = { log() {}, warn() {}, error() {}, info() {} };
const t0 = Date.now();
const E = new Function('console', fs.readFileSync(ENGINE, 'utf8') + '\n;return {ladderPackRun, ladderPackDemo, ladderPool, FrontOfficeCore};')(quiet);
const tLoad = Date.now() - t0, read = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const season = opt('--season', 'L2026W47'), meet = +opt('--meet', 6), seed = opt('--seed', '0');
const make = () => flag('--auto') ? E.ladderPackDemo(season, +opt('--auto', 8), { seed, meet, leagueId: opt('--league', 'auto') })
  : E.FrontOfficeCore.ladderPackMake(files.map(read), { seed, meet, leagueId: opt('--league', 'local'), season: files.length ? read(files[0]).season : season });
if (cmd === 'make') { const p = make(); const v = E.FrontOfficeCore.ladderPackValidate(p, E.ladderPool(p.season)); if (!v.ok) { console.error(JSON.stringify(v.errors)); process.exit(1); } process.stdout.write(JSON.stringify(p) + '\n'); console.error(`팩: 구단 ${p.clubs.length}개 · 경기 ${p.sched.length}개 · ${Math.round(JSON.stringify(p).length / 1024)}KB`); process.exit(0); }
if (cmd !== 'run') { console.error('사용: node tools/ladder-pack.cjs make … | run pack.json [--check] | run --auto 8 --check'); process.exit(2); }
const pack = flag('--auto') ? make() : read(files[0]);
const go = () => { const t = Date.now(); const r = E.ladderPackRun(pack); return { r, ms: Date.now() - t }; };
const a = go(); if (!a.r.ok) { process.stdout.write(JSON.stringify(a.r) + '\n'); process.exit(1); }
let b = null; if (flag('--check')) b = go();
const same = b ? JSON.stringify(b.r) === JSON.stringify(a.r) : null;
const summary = { ok: true, leagueId: a.r.leagueId, season: a.r.season, seed: a.r.seed, clubs: a.r.clubs, games: a.r.gamesTotal, hash: a.r.hash,
  standings: a.r.standings.map(s => [s.rank, s.name, s.w, s.l, s.t, s.pct, s.gb, s.runs, s.allowed]), leaders: Object.fromEntries(Object.entries(a.r.leaders).map(([k, L]) => [k, L[0] ? [L[0].name, L[0][k]] : null])) };
process.stdout.write(JSON.stringify(flag('--full') ? a.r : summary) + '\n');
const per = a.r.gamesTotal ? (a.ms / a.r.gamesTotal).toFixed(1) : '-';
console.error(`엔진 읽기 ${tLoad}ms · 팩 시즌 ${a.ms}ms(경기 ${a.r.gamesTotal}개, 경기당 ${per}ms, 기준 세계 만들기 포함)${b ? ` · 두 번째 ${b.ms}ms · 해시 ${a.r.hash}/${b.r.hash} ${same ? '같음' : '다름'}` : ''}`);
if (same === false) process.exit(1);
