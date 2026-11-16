/* 유저 래더 화면 점검: 실제 Worker(worker/index.js)를 가짜 KV로 띄워 덱 등록 → 같은 단계 다른 유저 덱 → 리그 시작(서버 덱 + AI 채우기)
   → 다음 연전 → 덱 고치기(다음 연전부터) → 끝까지 → 결과(승강·MVP) → 단계표 → 관리자 숨김. PC 1440×900 한 화면, 휴대폰 390 가로 스크롤 없음.
 사용: bash build.sh 후 node tools/check-uladder-ui.cjs (CHROMIUM_EXECUTABLE_PATH 필요할 수 있음). SHOT=경로 접두어면 리그 화면 PC·휴대폰 그림 */
const assert = require('node:assert/strict'), path = require('node:path'), http = require('node:http'), fs = require('node:fs');
const { chromium } = require('playwright');
(async () => {
  const { handle } = await import(path.resolve(__dirname, '../worker/index.js'));
  const m = new Map(), kv = { async get(k) { return m.has(k) ? m.get(k).v : null; }, async getWithMetadata(k) { const e = m.get(k); return { value: e ? e.v : null, metadata: e ? e.meta : null }; },
    async put(k, v, o = {}) { m.set(k, { v: String(v), meta: o.metadata || null }); }, async delete(k) { m.delete(k); }, async list({ prefix }) { return { keys: [...m.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name, metadata: m.get(name).meta })), list_complete: true }; } };
  const env = { SAVE_KV: kv, CUP_ADMIN: 'test-admin' }, html = fs.readFileSync(path.resolve(__dirname, '../index.html'));
  let opp = 0;
  const server = http.createServer(async (q, r) => {
    if (q.url === '/') { r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return r.end(html); }
    if (!q.url.startsWith('/api/')) { r.writeHead(404); return r.end(); }
    if (q.url.startsWith('/api/ladder/opp')) opp++;
    const body = await new Promise(ok => { const c = []; q.on('data', x => c.push(x)); q.on('end', () => ok(Buffer.concat(c))); });
    const res = await handle(new Request('http://' + q.headers.host + q.url, { method: q.method, headers: q.headers, body: ['GET', 'HEAD'].includes(q.method) ? undefined : body }), env, Date.now());
    r.writeHead(res.status, Object.fromEntries(res.headers)); r.end(Buffer.from(await res.arrayBuffer()));
  });
  await new Promise(ok => server.listen(0, '127.0.0.1', ok)); const url = `http://127.0.0.1:${server.address().port}/`;
  let b; try {
    b = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || '/usr/bin/chromium' }); const p = await b.newPage(); await p.setViewportSize({ width: 1440, height: 900 });
    const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('dialog', d => d.accept());
    await p.goto(url); await p.evaluate(() => { DEMO.on = false; newGame(6); fdStart(); fdAdvance(false); let n = 0; while (G.fd && !G.fd.done && n++ < 500) fdAdvance(true); hireMgr(G.mmarket[0].id, 3); G.tut = { done: true, step: 99 }; G.medSet = true; UI.title = false; A.go('club:uld'); });
    await p.waitForSelector('.ul-first .ul-big[data-a="ulReg"]', { timeout: 20000 }); { const t = await p.evaluate(() => document.querySelector('.ul-first').innerText); assert.match(t, /내 덱 등록[\s\S]*리그 시작[\s\S]*승격/, '첫 안내 3줄'); assert.match(t, /지금 1군으로 덱 등록/); assert.equal(await p.evaluate(() => !!document.getElementById('ulName')), false, '처음엔 등록 버튼만'); }
    if (process.env.SHOT) await p.screenshot({ path: process.env.SHOT + '_first_1440.png' });
    /* 같은 단계(루키)에 다른 유저 덱 4개: 다른 구단 1군을 서버에 올린다 */
    await p.evaluate(async () => { for (let k = 1; k <= 4; k++) { const e = cupEntryNow({ tid: (G.user + k) % 10, name: '유저' + k }); await fetch('/api/ladder/deck', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wid: 'w' + String(k).padStart(16, '0'), tier: 0, e }) }); } });
    await p.click('[data-a="ulPick"]'); await p.fill('#ulName', '와이'); await p.click('[data-a="ulReg"]'); await p.waitForFunction(() => /덱을 등록했습니다/.test(document.body.innerText), null, { timeout: 30000 });
    const mine = [...m.entries()].find(([k, v]) => k.startsWith('ulD:') && JSON.parse(v.v).name === '와이'); assert.ok(mine, '서버에 내 덱이 없음'); assert.ok(m.has('ulT:0:' + mine[0].slice(4)), '단계 색인'); assert.ok(mine[1].v.length < 15000, '덱 크기 ' + mine[1].v.length);
    const deckFaces = await p.evaluate(() => document.querySelectorAll('.dk img.dk-f').length); console.log(`덱 등록 통과(서버 ${Math.round(mine[1].v.length / 1024)}KB, 얼굴 ${deckFaces}장)`);
    await p.evaluate(() => { UI.it.uld = 'lg'; render(); }); await p.click('[data-a="ulStart"]'); await p.waitForFunction(() => /리그를 시작했습니다/.test(document.body.innerText), null, { timeout: 60000 });
    assert.match(await p.evaluate(() => document.body.innerText), /AI 구단 5팀이 채웠습니다/); assert.ok(await p.evaluate(() => [...document.querySelectorAll('.ul-k-ai')].some(x => x.innerText === 'AI 구단')), 'AI 구단 표시');
    const src = await p.evaluate(() => G.uld.league.src); assert.deepEqual(src, { user: 4, cup: 0, ai: 5 }); assert.equal(opp, 1, '리그 시작에 서버를 한 번만');
    await p.click('[data-a="ulNext"]'); await p.waitForFunction(() => G.uld.league && G.uld.league.next === 5 && !UL.busy, null, { timeout: 60000 });
    { const t = await p.evaluate(() => ({ feed: document.querySelectorAll('.ul-feed p').length, me: document.querySelectorAll('.ul-feed p.me').length, txt: document.querySelector('.ul-lg').innerText, lines: [...document.querySelectorAll('.ul-st tr.ul-line')].map(x => x.innerText), sticky: getComputedStyle(document.querySelector('.ul-act')).position }));
      assert.equal(t.feed, 5, '연전 결과 한 줄씩 ' + t.feed); assert.equal(t.me, 1); assert.match(t.txt, /남은 연전 8/); assert.match(t.txt, /다음 상대/); assert.match(t.txt, /(승격권|강등권)/); assert.deepEqual(t.lines.map(x => x.slice(0, 3)), ['승격선', '강등선']); assert.equal(t.sticky, 'sticky'); }
    await p.click('[data-a="ulEditOpen"]'); await p.waitForSelector('.ul-edit'); const h0 = await p.evaluate(() => G.uld.league.teams[0].e.h);
    await p.click('.ul-edit [data-a="ulUp"][data-v="1"]'); const pid = await p.evaluate(() => UL.edit.pen[2]); await p.selectOption(`.ul-edit select[data-a="ulBp"][data-i="${pid}"]`, 'cl');
    await p.click('[data-a="ulEditSave"]'); await p.waitForFunction(() => /다음 연전부터/.test(document.body.innerText), null, { timeout: 10000 }); const h1 = await p.evaluate(() => G.uld.league.teams[0].e.h); assert.notEqual(h0, h1);
    assert.equal(await p.evaluate(pid => G.uld.league.teams[0].e.bp[pid], pid), 'cl'); console.log('리그 시작(서버 덱 4 + AI 5)·다음 연전·덱 고치기 통과');
    await p.click('[data-a="ulNext"]'); await p.waitForFunction(() => G.uld.league.next === 10 && !UL.busy, null, { timeout: 60000 });
    const used = await p.evaluate(() => { const L = G.uld.league, s = L.series.slice(5).find(x => x.a === 0 || x.b === 0); return s.a === 0 ? s.ha : s.hb; }); assert.equal(used, h1, '고친 덱이 다음 연전에 안 나감');
    const fit = await p.evaluate(() => { window.scrollTo(0, 9999); return { scroll: scrollY, h: document.documentElement.scrollHeight, v: innerHeight }; }); assert.ok(fit.scroll === 0 && fit.h <= fit.v + 2, 'PC 리그 화면이 통째로 스크롤됨 ' + JSON.stringify(fit));
    const shot = process.env.SHOT; if (shot) { await p.evaluate(() => { render(); document.querySelectorAll('.setc,.ws-own,main,.main').forEach(e => { e.scrollTop = 0; }); }); await p.waitForTimeout(1500); await p.evaluate(() => { render(); document.querySelectorAll('.setc').forEach(e => { e.scrollTop = 0; }); }); await p.screenshot({ path: shot + '_1440.png' }); }
    const p2 = await b.newPage(); await p2.setViewportSize({ width: 390, height: 844 }); p2.on('pageerror', e => errs.push(String(e)));
    const save = await p.evaluate(() => JSON.stringify(G)); await p2.goto(url); await p2.evaluate(s => { G = JSON.parse(s); migrateDraft(); UI.title = false; UI.it = { uld: 'lg' }; A.go('club:uld'); }, save);
    await p2.waitForSelector('[data-a="ulNext"]', { timeout: 20000 }); const sw = await p2.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1); assert.ok(sw, '휴대폰 폭에서 가로 스크롤');
    if (shot) { await p2.waitForTimeout(1500); await p2.evaluate(() => render()); await p2.screenshot({ path: shot + '_390.png', fullPage: false }); } console.log('PC 한 화면·휴대폰 폭 통과');
    await p.click('[data-a="ulAll"]'); await p.waitForFunction(() => /리그가 끝났습니다/.test(document.body.innerText), null, { timeout: 120000 });
    const res = await p.evaluate(() => ({ last: G.uld.last, tier: G.uld.tier, hist: G.uld.hist.length, t: document.body.innerText }));
    assert.equal(res.hist, 1); assert.match(res.t, /리그 결과/); assert.match(res.t, /시즌 MVP/); assert.match(res.t, /내 최고 단계/); assert.ok(await p.evaluate(() => !!document.querySelector('.ul-badge')), '승강 배지');
    if (shot) await p.screenshot({ path: shot + '_result_1440.png' }); assert.equal(JSON.parse(m.get('ulD:' + mine[0].slice(4)).v).name, '와이');
    for (let i = 0; i < 50 && m.get('ulD:' + mine[0].slice(4)).meta.tier !== res.tier; i++) await new Promise(r => setTimeout(r, 100)); const meta = m.get('ulD:' + mine[0].slice(4)).meta; assert.equal(meta.tier, res.tier, '서버 단계가 안 바뀜 ' + meta.tier + '/' + res.tier);
    console.log(`끝까지·결과 통과: ${res.last.rank}위 → ${res.last.move}`);
    await p.evaluate(() => { UL.tiersSt = ''; UI.it.uld = 'tier'; render(); }); await p.waitForFunction(() => UL.tiers && /◀ 내 위치/.test(document.querySelector('.ulx').innerText), null, { timeout: 10000 });
    const tc = await p.evaluate(() => UL.tiers); assert.equal(tc.reduce((a, b) => a + b, 0), 5, '단계별 등록 덱 수 ' + tc); assert.match(await p.evaluate(() => document.querySelector('.ulx').innerText), /치른 리그 1[\s\S]*/); console.log('단계표(서버 등록 덱 수·내 위치) 통과');
    /* 관리자: 래더 덱 검색·숨김 */
    await p.evaluate(() => { localStorage.setItem('fo-cup-admin', 'test-admin'); ADM.chk = ''; A.go('club:cupadm'); }); await p.waitForSelector('#admLdQ', { timeout: 20000 });
    await p.fill('#admLdQ', '유저2'); await p.click('[data-a="admLdFind"]'); await p.waitForFunction(() => /래더 덱 1개/.test(document.body.innerText), null, { timeout: 10000 });
    await p.click('[data-a="admLdHide"]'); await p.waitForFunction(() => /숨겼습니다/.test(document.body.innerText), null, { timeout: 10000 }); assert.ok(!m.has('ulT:' + 0 + ':w0000000000000002') && !m.has('ulT:1:w0000000000000002'), '숨긴 덱 색인'); console.log('관리자 래더 숨김 통과');
    assert.deepEqual(errs, []);
  } catch (e) { try { const ps = b.contexts().flatMap(c => c.pages()); console.error('화면: ' + await ps[0].evaluate(() => [...document.querySelectorAll('.note')].map(x => x.innerText).join(' / ') + ' | ' + (UL.msg || ''))); } catch (x) {} throw e; } finally { await b?.close(); server.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
