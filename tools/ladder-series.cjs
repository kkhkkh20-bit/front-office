/* 단장 대전 시리즈 실행기(노드, 서버 쪽 예약 작업이 쓸 형태).
 사용(dist/engine.js 필요: bash build.sh --engine-out dist/engine.js, 또는 ENGINE=경로):
   node tools/ladder-series.cjs A.json B.json [--games 30] [--seed 시드]     두 구단 스냅샷으로 시리즈, 결과 JSON을 표준 출력에
   node tools/ladder-series.cjs --auto [--season L2026W47] [--seed 시드]      자동 편성 구단 둘로(시험용)
   node tools/ladder-series.cjs ... --check                                   같은 입력으로 두 번 돌려 결과가 같은지 확인(다르면 종료 코드 1)
   node tools/ladder-series.cjs --pool [--season L2026W47]                    시즌 선수 풀 JSON
 스냅샷 형식·검증: src/core/ladder.mjs. 시간은 표준 오류에만 적는다(출력 JSON은 입력만으로 정해진다). */
const fs = require('node:fs'), path = require('node:path');
const ENGINE = process.env.ENGINE || path.join(__dirname, '..', 'dist', 'engine.js');
if (!fs.existsSync(ENGINE)) { console.error('엔진 파일이 없습니다: ' + ENGINE + ' (bash build.sh --engine-out dist/engine.js)'); process.exit(2); }
const args = process.argv.slice(2), flag = k => args.includes(k), opt = (k, d) => { const i = args.indexOf(k); return i >= 0 && args[i + 1] != null ? args[i + 1] : d; };
const files = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && ['--games', '--seed', '--season'].includes(args[i - 1])));
const quiet = { log() {}, warn() {}, error() {}, info() {} };
const t0 = Date.now();
const E = new Function('console', fs.readFileSync(ENGINE, 'utf8') + '\n;return {ladderSeries, ladderPool, ladderAuto, ladderSeasonId, FrontOfficeCore};')(quiet);
const tLoad = Date.now() - t0;
const read = f => JSON.parse(fs.readFileSync(f, 'utf8'));
let A, B;
const season = opt('--season', null);
if (flag('--pool')) { process.stdout.write(JSON.stringify(E.ladderPool(season || E.ladderSeasonId())) + '\n'); process.exit(0); }
if (flag('--auto')) { const s = season || 'L2026W47'; A = E.ladderAuto(s, { name: '자동 가', hue: 210, bias: 0 }); B = E.ladderAuto(s, { name: '자동 나', hue: 20, bias: 2, mgr: 'LM3' }); }
else if (files.length === 2) { A = read(files[0]); B = read(files[1]); }
else { console.error('사용: node tools/ladder-series.cjs A.json B.json [--games 30] [--seed 시드] [--check] | --auto | --pool'); process.exit(2); }
const o = { games: +opt('--games', 30), seed: opt('--seed', '0') };
const run = () => { const t = Date.now(); const r = E.ladderSeries(A, B, o); return { r, ms: Date.now() - t }; };
const first = run();
if (!first.r.ok) { process.stdout.write(JSON.stringify(first.r) + '\n'); process.exit(1); }
let same = null, second = null;
if (flag('--check')) { second = run(); same = JSON.stringify(second.r) === JSON.stringify(first.r); }
process.stdout.write(JSON.stringify(first.r, null, flag('--pretty') ? 1 : 0) + '\n');
console.error(`엔진 읽기 ${tLoad}ms · 시리즈 ${first.ms}ms(기준 세계 만들기 포함)${second ? ` · 두 번째 ${second.ms}ms · 결과 ${same ? '같음' : '다름'}` : ''} · ${first.r.a.name} ${first.r.a.w}승 ${first.r.a.l}패 ${first.r.a.t}무 / ${first.r.b.name} ${first.r.b.w}승`);
if (same === false) process.exit(1);
