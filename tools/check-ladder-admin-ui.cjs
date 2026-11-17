/* 관리자 페이지 › 래더 현황 화면 점검: 실제 Worker(worker/index.js)를 가짜 KV + 가짜 D1(node:sqlite)로 띄워
   플레이어·덱·리그 결과를 만든 뒤 관리자 키로 열어 집계 숫자·막대·숨김 버튼을 확인하고, D1이 없을 때 KV 기본 정보 안내도 본다.
   사용: bash build.sh 후 node tools/check-ladder-admin-ui.cjs (CHROMIUM_EXECUTABLE_PATH 필요할 수 있음). SHOT_DIR=폴더 이면 PC 1440·휴대폰 390 그림을 남긴다.
   노드 22.5 미만(node:sqlite 없음)이면 건너뛴다 */
const assert = require('node:assert/strict'), path = require('node:path'), http = require('node:http'), fs = require('node:fs');
const { makeD1, hasSqlite } = require('./lib/d1-shim.cjs');
if (!hasSqlite) { console.log('래더 현황 화면 점검 건너뜀: node:sqlite 없음'); process.exit(0); }
const { chromium } = require('playwright');
function deck(o = {}) { const P = []; const POS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'C', 'SS', 'LF', '1B'];
  POS.forEach((pos, i) => P.push({ id: i + 1, name: '타자' + i, age: 27, isP: false, pos, th: '우', bt: '우', r: { con: 50, pow: 50, eye: 50, spd: 50, def: 50, vit: 60 }, pot: 55, sal: 300 }));
  for (let i = 0; i < 12; i++) P.push({ id: 100 + i, name: '투수' + i, age: 28, isP: true, pos: 'P', th: '우', bt: '우', r: { stf: 50, ctl: 50, sta: i < 5 ? 60 : 40 }, pot: 55, role: i < 5 ? 'SP' : 'RP', sal: 300 });
  return Object.assign({ v: 1, kind: 'cup-entry', name: '와이', year: 2035, club: {}, mgr: {}, payRef: 9000, P, ln: [[1, 'C'], [2, '1B'], [3, '2B'], [4, '3B'], [5, 'SS'], [6, 'LF'], [7, 'CF'], [8, 'RF'], [10, 'DH']], bn: [9, 11, 12], rot: [100, 101, 102, 103, 104], pen: [105, 106, 107, 108, 109, 110, 111], bp: {}, ovr: { t: 60, p: 61, b: 59 } }, o); }
(async () => {
  const { handle } = await import(path.resolve(__dirname, '../worker/index.js'));
  const m = new Map(), kv = { async get(k) { return m.has(k) ? m.get(k).v : null; }, async getWithMetadata(k) { const e = m.get(k); return { value: e ? e.v : null, metadata: e ? e.meta : null }; },
    async put(k, v, o = {}) { m.set(k, { v: String(v), meta: o.metadata || null }); }, async delete(k) { m.delete(k); }, async list({ prefix }) { return { keys: [...m.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name, metadata: m.get(name).meta })), list_complete: true }; } };
  const env = { SAVE_KV: kv, CUP_ADMIN: 'test-admin', DB: makeD1() }, html = fs.readFileSync(path.resolve(__dirname, '../index.html'));
  const ORIGIN = 'http://seed.local';
  const call = async (method, p, body, h = {}, now = Date.now()) => { const r = await handle(new Request(ORIGIN + p, { method, body: body == null ? undefined : JSON.stringify(body), headers: Object.assign({ 'CF-Connecting-IP': h.ip || '10.0.0.1' }, h.auth ? { Authorization: h.auth } : {}) }), env, now); return r.json(); };
  /* 씨앗: 플레이어 24명, 지난 10일에 걸쳐 리그 결과 */
  assert.ok((await call('POST', '/api/v1/admin/migrate', null, { auth: 'Bearer test-admin' })).ok);
  const DAY = 86400e3, t0 = Date.now() - 10 * DAY, P = [];
  const names = ['새벽별', '한강라이온', '돌직구', '번개발', '빨간양말', '푸른곰', '느림보', '홈런왕', '불펜장인', '대타요정', '도루왕', '뜬공박사', '마무리달인', '좌완파이어', '내야요새', '외야벽', '포수왕', '번트장인', '4번타자', '에이스킬러', '신인왕', '타격기계', '수비요정', '감독님'];
  for (let i = 0; i < names.length; i++) { const day = t0 + (i % 10) * DAY + 3600e3 * (i % 12);
    const j = await call('POST', '/api/v1/player', { nickname: names[i], platform: 'web' }, { ip: '10.0.' + i + '.1' }, day); P.push({ id: j.player.id, auth: 'Bearer ' + j.token, day });
    await call('PUT', '/api/v1/ladder/deck', { e: deck({ name: names[i].slice(0, 4) + '즈', ovr: { t: 58 + (i % 9), p: 60, b: 60 } }), tier: i % 5 }, { auth: 'Bearer ' + j.token, ip: '10.0.' + i + '.1' }, day + 60e3); }
  let k = 0;
  for (let d = 0; d < 10; d++) for (let i = 0; i < P.length; i++) { if ((i + d) % 3) continue; const at = t0 + d * DAY + (8 + (i * 5 + d) % 15) * 3600e3; if (at > Date.now()) continue;
    const opp = P[(i + 1) % P.length]; await call('POST', '/api/v1/ladder/result', { key: 'seed-' + (k++), rank: 1 + (i * 7 + d) % 10, teams: 10, w: 14, l: 13, opps: [{ pid: opp.id, w: 2, l: 1 }] }, { auth: P[i].auth, ip: '10.9.' + i + '.1' }, at); }
  const server = http.createServer(async (q, r) => {
    if (q.url === '/') { r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return r.end(html); }
    if (!q.url.startsWith('/api/')) { r.writeHead(404); return r.end(); }
    const body = await new Promise(ok => { const c = []; q.on('data', x => c.push(x)); q.on('end', () => ok(Buffer.concat(c))); });
    const origin = 'http://' + q.headers.host, useEnv = q.headers['x-test-nodb'] ? { SAVE_KV: kv, CUP_ADMIN: 'test-admin' } : env;
    const res = await handle(new Request(origin + q.url, { method: q.method, headers: Object.assign({}, q.headers), body: ['GET', 'HEAD'].includes(q.method) ? undefined : body }), useEnv, Date.now());
    r.writeHead(res.status, Object.fromEntries(res.headers)); r.end(Buffer.from(await res.arrayBuffer()));
  });
  await new Promise(ok => server.listen(0, '127.0.0.1', ok)); const url = `http://127.0.0.1:${server.address().port}/`;
  /* 예전 KV 래더 덱(없을 때 안내 화면용) */
  await kv.put('ulD:w0000000000000001', '{}', { metadata: { name: '옛날팀', year: 2030, ovr: { t: 61, p: 60, b: 62 }, tier: 2, at: Date.now() } }); await kv.put('ulT:2:w0000000000000001', '1', { metadata: { wid: 'w0000000000000001' } });
  const shots = process.env.SHOT_DIR; if (shots) fs.mkdirSync(shots, { recursive: true });
  let b; try {
    b = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || '/usr/bin/chromium' });
    const errs = [];
    const open = async (w, h, nodb) => { const ctx = await b.newContext({ viewport: { width: w, height: h }, extraHTTPHeaders: nodb ? { 'x-test-nodb': '1' } : {} }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(String(e)));
      await p.addInitScript(() => { try { localStorage.setItem('fo-cup-admin', 'test-admin'); } catch (e) {} }); await p.goto(url);
      await p.waitForFunction(() => typeof A === 'object' && typeof ADM === 'object', null, { timeout: 30000 });
      await p.evaluate(() => { ADM.chk = ''; admCheck(); }); await p.waitForFunction(() => ADM.chk === 'ok', null, { timeout: 10000 });
      await p.evaluate(() => { A.admOpen(); }); await p.waitForSelector('[data-a="admTab"][data-v="ld"]', { timeout: 10000 }); await p.click('[data-a="admTab"][data-v="ld"]'); return p; };
    const p = await open(1440, 900);
    await p.waitForFunction(() => LDA.st === 'd1' && document.querySelector('.lda-t'), null, { timeout: 15000 });
    const t = await p.evaluate(() => ({ text: document.querySelector('.ldax').innerText, bars: document.querySelectorAll('.lda-trend>span').length, hours: document.querySelectorAll('.lda-hours>span').length, decks: document.querySelectorAll('[data-a="ldaHide"]').length, d: LDA.d }));
    assert.match(t.text, /참여도/); assert.match(t.text, /완료한 리그/); assert.match(t.text, /서버 사용량/); assert.match(t.text, /웹 \d+%/); assert.match(t.text, /최근 등록 덱/);
    assert.equal(t.bars, 28, '14일 막대 2줄'); assert.equal(t.hours, 24); assert.equal(t.decks, 20);
    assert.equal(t.d.totals.players, 24); assert.equal(t.d.windows.d30.leagues, k, '30일 리그 수 = 씨앗 리그 수'); assert.equal(t.d.tiers.reduce((a, x) => a + x.decks, 0), 24);
    const rowLeagues = await p.evaluate(() => [...document.querySelectorAll('.lda-t tr')].find(r => /완료한 리그/.test(r.innerText)).innerText); assert.match(rowLeagues, new RegExp(String(k)));
    const fit = await p.evaluate(() => { window.scrollTo(0, 9999); return { scroll: scrollY, sw: document.documentElement.scrollWidth <= innerWidth + 1 }; }); assert.equal(fit.scroll, 0, 'PC에서 화면이 통째로 스크롤됨'); assert.ok(fit.sw);
    console.log(`래더 현황(D1) 통과: 플레이어 ${t.d.totals.players}, 리그 ${k}, 7일 활성 ${t.d.windows.d7.active}, D1 쓰기 추정 ${t.d.usage.d1_w}`);
    if (shots) await p.screenshot({ path: path.join(shots, 'ladder-admin-1440.png') });
    /* 숨기기 → 서버 반영 */
    const pid = await p.evaluate(() => LDA.d.decks[0].pid); await p.click(`[data-a="ldaHide"][data-v="${pid}"]`);
    await p.waitForFunction(() => /숨겼습니다/.test(document.body.innerText), null, { timeout: 10000 });
    await p.waitForFunction(() => LDA.st === 'd1' && LDA.d.totals.hidden === 1 && LDA.meta && LDA.meta.agg && LDA.meta.agg.n === 23, null, { timeout: 10000 }); /* 숨긴 뒤 현황·메타를 다시 받는다(srv2 #56) */
    assert.equal(env.DB._sqlite.prepare('SELECT hidden FROM players WHERE id = ?').get(pid).hidden, 1); console.log('숨기기 통과');
    /* 래더 v2(사용자 11-17): 덱 구성(메타) 칸과 CSV 내보내기(등록 덱·리그 결과) */
    { const mt = await p.evaluate(() => ({ n: LDA.meta && LDA.meta.agg && LDA.meta.agg.n, t: document.querySelector('.ldax').innerText }));
      assert.equal(mt.n, 23, '메타 집계 덱 수(숨긴 1명 빼고 다시 받음) ' + mt.n); assert.match(mt.t, /덱 구성\(메타\)[\s\S]*등록 덱 23개/); assert.match(mt.t, /균형형|거포형|교타형|기동력형|수비형|선발 왕국|불펜 야구/);
      await p.click('[data-a="ldaCsv"][data-v="decks"]'); await p.waitForFunction(() => /줄을 CSV로 받았습니다/.test(document.body.innerText), null, { timeout: 10000 });
      const dc = await p.evaluate(() => LDA.csv.split('\r\n')); assert.equal(dc.length, 25, '덱 CSV 줄(머리글 + 24)'); assert.match(dc[0], /^닉네임,플레이어,플랫폼,숨김,덱,연도,단계,OVR/);
      await p.click('[data-a="ldaCsv"][data-v="results"]'); await p.waitForFunction(() => /^닉네임,플레이어,시즌/.test(LDA.csv || ''), null, { timeout: 10000 });
      assert.equal(await p.evaluate(() => LDA.csv.split('\r\n').length), k + 1, '결과 CSV 줄'); console.log('덱 구성(메타)·CSV 내보내기 통과'); }
    /* srv2(11-17): CSV 페이지(전체 수·잘림·다음 페이지), 사용량 실제 %, 막대 값 표, 숨기기 뒤 다시 받기·캐시 안내 */
    { await p.evaluate(() => { LDA.csvN = 10; }); await p.click('[data-a="ldaCsv"][data-v="decks"]');
      await p.waitForFunction(() => /등록 덱 1쪽/.test((document.querySelector('[data-csv-info]') || {}).innerText || ''), null, { timeout: 10000 }); let info = await p.evaluate(() => document.querySelector('[data-csv-info]').innerText);
      assert.match(info, /전체 24줄 중 1~10번째 10줄/); assert.match(info, /잘림/); await p.click('[data-a="ldaCsv"][data-v="decks"][data-u]');
      await p.waitForFunction(() => /2쪽/.test(document.querySelector('[data-csv-info]').innerText), null, { timeout: 10000 });
      info = await p.evaluate(() => document.querySelector('[data-csv-info]').innerText); assert.match(info, /11~20번째/);
      await p.click('[data-a="ldaCsv"][data-v="decks"][data-u]'); await p.waitForFunction(() => /3쪽/.test(document.querySelector('[data-csv-info]').innerText), null, { timeout: 10000 });
      info = await p.evaluate(() => ({ t: document.querySelector('[data-csv-info]').innerText, next: !!document.querySelector('[data-a="ldaCsv"][data-u]'), rows: LDA.csv.split('\r\n').length }));
      assert.match(info.t, /21~24번째 4줄/); assert.match(info.t, /마지막 쪽/); assert.equal(info.next, false); assert.equal(info.rows, 5);
      await p.evaluate(() => { LDA.csvN = 0; }); console.log('CSV 페이지 통과');
      const mt = await p.evaluate(() => { LDA.d.usage.pct.d1_w = 150; LDA.d.usage.d1_w = 150000; render(); const m = [...document.querySelectorAll('.lda-m')].find(x => /D1 쓰기/.test(x.innerText)); return { t: m.innerText, w: m.querySelector('.lda-mb i').style.width }; });
      assert.match(mt.t, /150%/); assert.equal(mt.w, '100%'); console.log('사용량 150% 통과');
      const dt = await p.evaluate(() => [...document.querySelectorAll('.lda-dt')].map(d => d.querySelectorAll('tbody tr').length)); assert.deepEqual(dt, [14, 14, 24], '막대마다 값 표');
      assert.ok(await p.evaluate(() => [...document.querySelectorAll('.lda-bars')].every(b => b.getAttribute('role') === 'img' && /\d/.test(b.getAttribute('aria-label')))));
      const before = await p.evaluate(() => LDA.d.totals.hidden || 0), pid2 = await p.evaluate(() => LDA.d.decks.find(x => !x.hidden).pid);
      await p.click(`[data-a="ldaHide"][data-v="${pid2}"]`); await p.waitForFunction(b => LDA.st === 'd1' && (LDA.d.totals.hidden || 0) === b + 1, before, { timeout: 10000 });
      const ht = await p.evaluate(() => document.querySelector('.ldax').innerText); assert.match(ht, /숨겼습니다/); assert.match(ht, /최대 \d+초/); console.log('숨기기 뒤 다시 받기·캐시 안내 통과'); }
    const ph = await open(390, 844);
    await ph.waitForFunction(() => LDA.st === 'd1' && document.querySelector('.lda-t'), null, { timeout: 15000 });
    assert.ok(await ph.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '휴대폰 폭에서 가로 스크롤');
    if (shots) await ph.screenshot({ path: path.join(shots, 'ladder-admin-390.png'), fullPage: true }); console.log('휴대폰 390 통과');
    const pk = await open(1440, 900, true);
    await pk.waitForFunction(() => LDA.st === 'kv' && /D1을 연결하면/.test(document.body.innerText), null, { timeout: 15000 });
    const kt = await pk.evaluate(() => document.querySelector('.ldax').innerText); assert.match(kt, /등록 덱 1개/); assert.match(kt, /옛날팀/);
    if (shots) await pk.screenshot({ path: path.join(shots, 'ladder-admin-kv-1440.png') }); console.log('D1 없을 때 KV 기본 정보 통과');
    assert.deepEqual(errs, [], '페이지 오류');
  } finally { if (b) await b.close(); server.close(); }
  console.log('래더 현황 화면 점검 통과');
})().catch(e => { console.error(e); process.exit(1); });
