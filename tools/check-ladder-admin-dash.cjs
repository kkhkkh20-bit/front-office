/* 관리자 › 래더 현황 대시보드 점검(구단주 11-18 "관리자에 래더를 좀 더 앞의 탭으로 … 여러 통계 등 데이터를 볼 수 있게").
   실제 Worker(worker/index.js)를 가짜 KV + 가짜 D1(node:sqlite)로 띄워 플레이어 30명·지난 14일 리그 결과·거절 덱을 만든 뒤 관리자 키로 연다.
   - 래더가 첫 탭이고 기본으로 열린다. 탭 7개(개요·참여·유지·단계·메타·경쟁 균형·플레이어·운영·상태), 범위(오늘·7일·30일·시즌)
   - 개요: KPI 카드(큰 숫자 + 설명 + 직전 대비) · 먼저 확인할 것 · 평소와 다른 것 · 추이 선 그래프와 패치 점선(제목)
   - 참여·유지: 깔때기(가장 큰 감소 빨강) · 코호트 · 날짜 × 시간 / 단계·메타: 분포·승강 흐름·덱 구성 / 경쟁 균형: 산점도 / 플레이어: 검색·정렬·자세히·CSV / 상태: 거절 사유
   - PC 1440·1366: 페이지 스크롤 없음(칸 안 스크롤), 휴대폰 390: 가로 넘침 없음. SHOT_DIR=폴더면 그림을 남긴다 */
const assert = require('node:assert/strict'), path = require('node:path'), http = require('node:http'), fs = require('node:fs');
const { makeD1, hasSqlite } = require('./lib/d1-shim.cjs');
if (!hasSqlite) { console.log('래더 대시보드 점검 건너뜀: node:sqlite 없음'); process.exit(0); }
const { chromium } = require('playwright');
function deck(o = {}) { const P = []; const POS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'C', 'SS', 'LF', '1B'];
  POS.forEach((pos, i) => P.push({ id: i + 1, name: '타자' + i, age: 27, isP: false, pos, th: '우', bt: '우', r: { con: 50, pow: 50 + (o.k || 0) % 9, eye: 50, spd: 50, def: 50, vit: 60 }, pot: 55, sal: 300 }));
  for (let i = 0; i < 12; i++) P.push({ id: 100 + i, name: '투수' + i, age: 28, isP: true, pos: 'P', th: '우', bt: '우', r: { stf: 50 + (o.k || 0) % 7, ctl: 50, sta: i < 5 ? 60 : 40 }, pot: 55, role: i < 5 ? 'SP' : 'RP', sal: 300 });
  return Object.assign({ v: 1, kind: 'cup-entry', name: '와이', year: 2035, club: {}, mgr: {}, payRef: 9000, P, ln: [[1, 'C'], [2, '1B'], [3, '2B'], [4, '3B'], [5, 'SS'], [6, 'LF'], [7, 'CF'], [8, 'RF'], [10, 'DH']], bn: [9, 11, 12], rot: [100, 101, 102, 103, 104], pen: [105, 106, 107, 108, 109, 110, 111], bp: {} }, o.e || {}); }
(async () => {
  const { handle } = await import(path.resolve(__dirname, '../worker/index.js'));
  const m = new Map(), kv = { async get(k) { return m.has(k) ? m.get(k).v : null; }, async getWithMetadata(k) { const e = m.get(k); return { value: e ? e.v : null, metadata: e ? e.meta : null }; },
    async put(k, v, o = {}) { m.set(k, { v: String(v), meta: o.metadata || null }); }, async delete(k) { m.delete(k); }, async list({ prefix }) { return { keys: [...m.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name, metadata: m.get(name).meta })), list_complete: true }; } };
  const env = { SAVE_KV: kv, CUP_ADMIN: 'test-admin', DB: makeD1() }, html = fs.readFileSync(path.resolve(__dirname, '../index.html')), ORIGIN = 'http://seed.local';
  const call = async (method, p, body, h = {}, now = Date.now()) => { const r = await handle(new Request(ORIGIN + p, { method, body: body == null ? undefined : JSON.stringify(body), headers: Object.assign({ 'CF-Connecting-IP': h.ip || '10.0.0.1', Origin: ORIGIN }, h.auth ? { Authorization: h.auth } : {}) }), env, now); return r.json(); };
  assert.ok((await call('POST', '/api/v1/admin/migrate', null, { auth: 'Bearer test-admin' })).ok);
  /* 씨앗: 30명이 지난 13일에 걸쳐 등록, 그 뒤 리그 결과(일부는 3개 이상·승격·우승) · 같은 기기 2덱 · 거절 덱 */
  const DAY = 86400e3, now0 = Date.now(), t0 = now0 - 13 * DAY, P = [], DEV = 'b1b2c3d4e5f60718293a4b5c6d7e8f90';
  for (let i = 0; i < 30; i++) { const day = t0 + (i % 13) * DAY + 3600e3 * (i % 9);
    const j = await call('POST', '/api/v1/player', { nickname: '대시' + String(i).padStart(2, '0') + '별', platform: 'web' }, { ip: '10.1.' + i + '.1' }, day); P.push({ id: j.player.id, auth: 'Bearer ' + j.token, day });
    await call('PUT', '/api/v1/ladder/deck', Object.assign({ e: deck({ k: i, e: { name: '대시팀' + i, ovr: { t: 58 + (i % 12), p: 60, b: 60 } } }) }, i % 4 ? { auto: 1 } : { man: 1 }, i < 2 ? { dev: DEV } : {}), { auth: 'Bearer ' + j.token, ip: '10.1.' + i + '.1' }, day + 60e3); }
  let k = 0;
  for (let d = 0; d < 13; d++) for (let i = 0; i < P.length; i++) { if ((i + d) % 4 || t0 + d * DAY < P[i].day) continue; const at = t0 + d * DAY + (9 + (i * 5 + d) % 13) * 3600e3; if (at > now0) continue;
    const rank = 1 + (i * 3 + d) % 10, opp = P[(i + 1) % P.length]; await call('POST', '/api/v1/ladder/result', { key: 'dash-' + (k++), rank, teams: 10, w: 27 - rank * 2, l: rank * 2, d: 0, opps: [{ pid: opp.id, w: 2, l: 1 }], ps: rank === 1 ? 'c' : '' }, { auth: P[i].auth, ip: '10.9.' + i + '.1' }, at); }
  { const bad = deck({ e: { name: '편집' } }); await call('PUT', '/api/v1/ladder/deck', { e: bad, edited: true }, { auth: P[5].auth }); }
  await call('PUT', '/api/v1/ladder/auto', { on: false }, { auth: P[29].auth });
  const server = http.createServer(async (q, r) => {
    if (q.url === '/') { r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return r.end(html); }
    if (!q.url.startsWith('/api/')) { r.writeHead(404); return r.end(); }
    const body = await new Promise(ok => { const c = []; q.on('data', x => c.push(x)); q.on('end', () => ok(Buffer.concat(c))); });
    const res = await handle(new Request('http://' + q.headers.host + q.url, { method: q.method, headers: Object.assign({}, q.headers), body: ['GET', 'HEAD'].includes(q.method) ? undefined : body }), env, Date.now());
    r.writeHead(res.status, Object.fromEntries(res.headers)); r.end(Buffer.from(await res.arrayBuffer()));
  });
  await new Promise(ok => server.listen(0, '127.0.0.1', ok)); const url = `http://127.0.0.1:${server.address().port}/`;
  const shots = process.env.SHOT_DIR; if (shots) fs.mkdirSync(shots, { recursive: true });
  let b; try {
    b = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || '/usr/bin/chromium' });
    const errs = [];
    const open = async (w, h) => { const ctx = await b.newContext({ viewport: { width: w, height: h } }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(String(e)));
      await p.addInitScript(() => { try { localStorage.setItem('fo-cup-admin', 'test-admin'); } catch (e) {} }); await p.goto(url);
      await p.waitForFunction(() => typeof A === 'object' && typeof ADM === 'object' && typeof LDX === 'object', null, { timeout: 30000 });
      await p.evaluate(() => { ADM.chk = ''; admCheck(); }); await p.waitForFunction(() => ADM.chk === 'ok', null, { timeout: 10000 });
      await p.evaluate(() => { A.admOpen(); }); await p.waitForSelector('.ldx-tabs', { timeout: 30000 }).catch(async e => { throw new Error('대시보드가 열리지 않음: ' + (await p.evaluate(() => document.body.innerText.slice(0, 400)))); }); /* 래더가 기본 탭(누르지 않아도 열림) */
      await p.waitForFunction(() => LDX.st === 'ok' && document.querySelector('.ldx-kpi'), null, { timeout: 20000 }); return p; };
    const fit = p => p.evaluate(() => { window.scrollTo(0, 9999); return { y: scrollY, sw: document.documentElement.scrollWidth <= innerWidth + 1 }; });
    const p = await open(1440, 900);
    assert.equal(await p.evaluate(() => document.querySelector('.adm-tabs button').dataset.v), 'ld', '래더가 첫 탭');
    assert.deepEqual(await p.evaluate(() => [...document.querySelectorAll('.ldx-tabs button')].map(x => x.innerText)), ['개요', '참여·유지', '단계·메타', '경쟁 균형', '플레이어', '운영', '상태']);
    let t = await p.evaluate(() => document.querySelector('.ldax').innerText);
    for (const s of ['등록 덱', '실제 플레이어', '활성 1일', '활성 7일', '활성 30일', '완료 리그', '승격 · 강등', '거절 덱', '먼저 확인할 것', '평소와 다른 것', '날마다', '용어 설명']) assert.ok(t.includes(s), s);
    const D = await p.evaluate(() => LDX.d); assert.equal(D.people.decks, 29, '끈 1명 빼고 29덱'); assert.equal(D.people.dev_groups, 28, '같은 기기 2덱은 한 묶음'); assert.equal(D.cur.leagues > 0, true);
    assert.ok(await p.evaluate(() => document.querySelectorAll('.ldx-kpi').length) >= 10); assert.ok(await p.evaluate(() => document.querySelectorAll('.ldx-ln').length) === 3, '추이 선 3개');
    assert.match(await p.evaluate(() => document.querySelector('.ldx-kpi').innerText), /직전/);
    /* 패치 표시선: 오늘 날짜 패치를 하나 끼워 넣어 확인 */
    const pt = await p.evaluate(() => { const d = LDX.d.trend[LDX.d.trend.length - 1].day; PATCH.unshift({ id: d + '-t', d: '', t: '점검용 패치', items: [] }); render(); const g = document.querySelector('.ldx-patch title'); PATCH.shift(); return g && g.textContent; });
    assert.match(pt || '', /패치: 점검용 패치/);
    let f = await fit(p); assert.equal(f.y, 0, 'PC 1440 페이지 스크롤'); assert.ok(f.sw);
    if (shots) await p.screenshot({ path: path.join(shots, 'dash-overview-1440.png') }); console.log('개요 통과: 덱 ' + D.people.decks + ' · 리그 ' + D.cur.leagues);
    /* 범위 */ await p.click('[data-a="ldxRange"][data-v="30d"]'); await p.waitForFunction(() => LDX.st === 'ok' && LDX.d.range.key === '30d', null, { timeout: 10000 });
    /* 참여·유지 */ await p.click('[data-a="ldxTab"][data-v="eng"]'); t = await p.evaluate(() => document.querySelector('.ldax').innerText);
    assert.match(t, /깔때기[\s\S]*첫 리그 완료[\s\S]*리그 3개 이상[\s\S]*승격 1번 이상[\s\S]*우승 1번 이상/); assert.match(t, /가장 크게 빠지는 곳/); assert.ok(await p.evaluate(() => document.querySelectorAll('.ldx-fun>.bad').length) === 1, '가장 큰 감소 빨강');
    assert.ok(await p.evaluate(() => document.querySelectorAll('.ldx-coh tbody tr').length) >= 5, '코호트 줄'); assert.equal(await p.evaluate(() => document.querySelectorAll('.ldx-heat tbody tr').length), 14, '날짜 × 시간 14일');
    if (shots) await p.screenshot({ path: path.join(shots, 'dash-engagement-1440.png') }); console.log('참여·유지 통과');
    /* 단계·메타 */ await p.click('[data-a="ldxTab"][data-v="tier"]'); t = await p.evaluate(() => document.querySelector('.ldax').innerText); assert.match(t, /단계 분포[\s\S]*승강 흐름[\s\S]*덱 구성/); assert.match(t, /상위 덱 · OVR/);
    /* 경쟁 균형 */ await p.click('[data-a="ldxTab"][data-v="bal"]'); assert.ok(await p.evaluate(() => document.querySelectorAll('.ldx-dot').length) >= 5, '산점도 점'); t = await p.evaluate(() => document.querySelector('.ldax').innerText); assert.match(t, /OVR ↔ 승률 상관[\s\S]*우승 쏠림[\s\S]*이변 비율/);
    if (shots) await p.screenshot({ path: path.join(shots, 'dash-balance-1440.png') }); console.log('단계·메타·경쟁 균형 통과');
    /* 플레이어 */ await p.click('[data-a="ldxTab"][data-v="pl"]'); await p.waitForFunction(() => LDX.plSt === 'ok' && document.querySelectorAll('.ldx-pt tbody tr').length === 29, null, { timeout: 10000 });
    await p.click('[data-a="ldxSort"][data-v="leagues"]'); await p.waitForFunction(() => LDX.plSt === 'ok' && LDX.pl.sort === 'leagues', null, { timeout: 10000 });
    const lg = await p.evaluate(() => LDX.pl.players.map(x => x.leagues)); assert.deepEqual(lg, lg.slice().sort((a, b) => b - a), '리그 수 정렬');
    await p.fill('#ldxQ', '대시팀1'); await p.click('[data-a="ldxFind"]'); await p.waitForFunction(() => LDX.plSt === 'ok' && LDX.pl.total >= 1 && LDX.pl.players.every(x => /대시팀1/.test(x.name)), null, { timeout: 10000 });
    await p.click('.ldx-pt tbody tr'); await p.waitForFunction(() => LDX.one && document.querySelector('.ldx-one'), null, { timeout: 10000 }); assert.match(await p.evaluate(() => document.querySelector('.ldx-one').innerText), /최근 리그[\s\S]*시즌/);
    await p.click('[data-a="ldxCsv"][data-v="pl"]'); await p.waitForFunction(() => /ladder-players\.csv/.test(document.body.innerText), null, { timeout: 10000 });
    if (shots) await p.screenshot({ path: path.join(shots, 'dash-players-1440.png') }); console.log('플레이어 표·자세히·CSV 통과');
    /* 상태 */ await p.click('[data-a="ldxTab"][data-v="hl"]'); t = await p.evaluate(() => document.querySelector('.ldax').innerText); assert.match(t, /거절된 덱[\s\S]*편집된 저장/); assert.match(t, /연봉 상한이 없습니다/); assert.match(t, /서버 사용량/);
    /* 운영 = 예전 화면 */ await p.click('[data-a="ldxTab"][data-v="ops"]'); await p.waitForFunction(() => LDA.st === 'd1' && document.querySelector('.ldb-reg'), null, { timeout: 15000 }); console.log('상태·운영 통과');
    await p.click('[data-a="ldxTab"][data-v="ov"]'); await p.click('summary:has-text("용어 설명")'); assert.match(await p.evaluate(() => document.querySelector('.ldx-gl').innerText), /실제 플레이어[\s\S]*기기를 연결하지 않고/);
    const q2 = await open(1366, 768); f = await fit(q2); assert.equal(f.y, 0, 'PC 1366 페이지 스크롤'); assert.ok(f.sw);
    { const R = await q2.evaluate(() => ({ ih: innerHeight, c: [...document.querySelectorAll('.ldax>.setc')].map(c => [Math.round(c.getBoundingClientRect().bottom), c.scrollHeight, c.clientHeight, getComputedStyle(c).overflowY]) }));
      assert.ok(R.c.length === 2 && R.c.every(c => c[0] <= R.ih + 1 && (c[1] <= c[2] + 1 || c[3] === 'auto')), '칸 안 스크롤 ' + JSON.stringify(R)); }
    const q3 = await open(390, 844);
    for (const tb of ['ov', 'eng', 'tier', 'bal', 'pl', 'hl']) { await q3.evaluate(v => A.ldxTab(v), tb); await q3.waitForTimeout(tb === 'pl' ? 600 : 100); assert.ok(await q3.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '휴대폰 390 가로 넘침 ' + tb); }
    await q3.evaluate(() => A.ldxTab('ov')); if (shots) await q3.screenshot({ path: path.join(shots, 'dash-overview-390.png'), fullPage: true }); console.log('PC 1366·휴대폰 390 통과');
    assert.deepEqual(errs, [], '페이지 오류');
  } finally { if (b) await b.close(); server.close(); }
  console.log('래더 대시보드 점검 통과');
})().catch(e => { console.error(e); process.exit(1); });
