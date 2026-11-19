/* 유저 래더 화면 점검: 실제 Worker(worker/index.js)를 가짜 KV + 가짜 D1(node:sqlite)로 띄운다. 사용자 11-17 "화면도 새 서버로 바로 전환해": 기본은 서버 v1(D1).
   1) D1이 꺼진 동안(503 not_configured): 예전 KV 길로 덱 등록 → 리그 시작(KV 덱 + AI) → 그만두기. 게임은 D1 없이도 그대로 돈다.
   2) D1이 켜지면: 화면을 다시 열 때 이 저장의 덱·단계를 v1으로 옮긴다(KV 단계까지) → 리그 시작(D1 덱 + 모자란 만큼 KV 덱 + AI, 상대 pid·닉네임)
   → 다음 연전·맞대결 → 덱 고치기(다음 연전부터) → 끝까지 → 결과(서버 포인트·단계) → 순위 탭(내 시즌·순위표·소식) → 단계표
   → 관리자(KV 래더 덱 숨김, 래더 현황 D1 숫자) → 서버 기록 지우기. PC 1440×900 한 화면, 휴대폰 390 가로 스크롤 없음.
 사용: bash build.sh 후 node tools/check-uladder-ui.cjs (CHROMIUM_EXECUTABLE_PATH 필요할 수 있음). SHOT=경로 접두어면 PC·휴대폰 그림. 노드 22.5 미만(node:sqlite 없음)이면 건너뛴다 */
const assert = require('node:assert/strict'), path = require('node:path'), http = require('node:http'), fs = require('node:fs');
const { makeD1, hasSqlite } = require('./lib/d1-shim.cjs');
if (!hasSqlite) { console.log('유저 래더 화면 점검 건너뜀: node:sqlite 없음'); process.exit(0); }
const { chromium } = require('playwright');
(async () => {
  const { handle } = await import(path.resolve(__dirname, '../worker/index.js'));
  const m = new Map(), kv = { async get(k) { return m.has(k) ? m.get(k).v : null; }, async getWithMetadata(k) { const e = m.get(k); return { value: e ? e.v : null, metadata: e ? e.meta : null }; },
    async put(k, v, o = {}) { m.set(k, { v: String(v), meta: o.metadata || null }); }, async delete(k) { m.delete(k); }, async list({ prefix }) { return { keys: [...m.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name, metadata: m.get(name).meta })), list_complete: true }; } };
  const DB = makeD1(), env = { SAVE_KV: kv, CUP_ADMIN: 'test-admin', DB }, envNoDb = { SAVE_KV: kv, CUP_ADMIN: 'test-admin' }, html = fs.readFileSync(path.resolve(__dirname, '../index.html'));
  const sql = (q, ...a) => DB._sqlite.prepare(q).all(...a);
  let opp = 0, v1opp = 0, dbDown = true, testOffset = 0;
  const testNow = () => Date.now() + testOffset;
  const initClock = async page => page.addInitScript(() => { const realNow = Date.now.bind(Date); window.__uladderTestOffset = 0; Date.now = () => realNow() + window.__uladderTestOffset; });
  const call = async (method, p, body, h = {}) => { const r = await handle(new Request('http://seed.local' + p, { method, body: body == null ? undefined : JSON.stringify(body), headers: Object.assign({ 'CF-Connecting-IP': h.ip || '10.0.0.1' }, h.auth ? { Authorization: h.auth } : {}) }), env, testNow()); return r.json(); };
  const server = http.createServer(async (q, r) => {
    if (q.url === '/') { r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return r.end(html); }
    if (!q.url.startsWith('/api/')) { r.writeHead(404); return r.end(); }
    if (q.url.startsWith('/api/ladder/opp')) opp++; if (q.url.startsWith('/api/v1/ladder/opponents')) v1opp++;
    const body = await new Promise(ok => { const c = []; q.on('data', x => c.push(x)); q.on('end', () => ok(Buffer.concat(c))); });
    const res = await handle(new Request('http://' + q.headers.host + q.url, { method: q.method, headers: q.headers, body: ['GET', 'HEAD'].includes(q.method) ? undefined : body }), dbDown ? envNoDb : env, testNow());
    r.writeHead(res.status, Object.fromEntries(res.headers)); r.end(Buffer.from(await res.arrayBuffer()));
  });
  await new Promise(ok => server.listen(0, '127.0.0.1', ok)); const url = `http://127.0.0.1:${server.address().port}/`;
  assert.ok((await call('POST', '/api/v1/admin/migrate', null, { auth: 'Bearer test-admin' })).ok);
  let b; try {
    b = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || '/usr/bin/chromium' }); const p = await b.newPage(); await p.setViewportSize({ width: 1440, height: 900 });
    await initClock(p); const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('dialog', d => d.accept());
    await p.goto(url);await p.waitForFunction(()=>performance.getEntriesByName('fronttime-menu-ready').length>0); await p.waitForFunction(() => typeof newGame === 'function' && UI.title === true, null, { timeout: 60000 }); await p.evaluate(() => { DEMO.on = false; newGame(6); fdStart(); fdAdvance(false); let n = 0; while (G.fd && !G.fd.done && n++ < 500) fdAdvance(true); hireMgr(G.mmarket[0].id, 3); G.tut = { done: true, step: 99 }; G.medSet = true; UI.title = false; A.go('club:uld'); });
    await p.waitForSelector('.ul-hero .ul-big[data-a="ulReg"]', { timeout: 20000 }); { const t = await p.evaluate(() => document.querySelector('.ul-hero').innerText);
      assert.equal(await p.evaluate(() => UI.tab), 'uld', '예전 자리(구단 › 유저 래더)는 래더 주 메뉴로'); assert.ok(await p.evaluate(() => !!document.querySelector('.fm-r .fm-i[data-a="tab"][data-v="uld"].on') && !document.querySelector('.fmside [data-v="uld"]') && document.querySelectorAll('.fm-sub [data-a="sub"][data-v^="uld:"]').length === 6), 'PC 위 오른쪽 래더 아이콘(왼쪽 메뉴에는 없음) + 하위 탭 여섯');
      assert.ok(await p.evaluate(() => document.querySelectorAll('.ul-hero svg.ul-emb').length === 1 && document.querySelectorAll('.ul-lad .ul-lr').length === 5), '단계 문장·승강 사다리'); assert.match(await p.evaluate(() => document.querySelector('.ulx').innerText), /시즌 목표[\s\S]*리그 3번 치르기/); assert.match(t, /내 덱 등록[\s\S]*리그 시작[\s\S]*승격/, '첫 안내 3줄'); assert.match(t, /지금 1군으로 덱 등록/); assert.equal(await p.evaluate(() => !!document.getElementById('ulName')), false, '처음엔 등록 버튼만'); }
    if (process.env.SHOT) await p.screenshot({ path: process.env.SHOT + '_first_1440.png' });
    /* 예전 KV 래더: 1부(단계 1)에 다른 유저 덱 6개. 5·6번은 이미 v1으로 옮겨 온 유저(D1에도 덱, 같은 세계 id) */
    const decks = await p.evaluate(() => [1, 2, 3, 4, 5, 6].map(k => { let e = cupEntryNow({ tid: (G.user + k) % 10, name: k <= 4 ? '유저' + k : '브이원' + k }); { const C = FrontOfficeCore, sg = C.ulCapSuggest(e, 1); if (sg.ids.length) { e = C.ulCapDrop(e, sg.ids).e; e.ovr = cupOvr(e); e.h = C.cupEntryHash(e); } } /* 새 게임 구단 연봉이 상한을 넘으면 빼고 올린다(점검이 가끔 실패하던 것, 래더 v3) */ e.payRef = Math.max(e.payRef, Math.ceil(e.pay / 1.4)); return e; })); /* 다른 유저 덱은 1부(1.5배) 상한 안으로(사용자 11-17 연봉 상한) */
    const wid = k => 'w' + String(k).padStart(16, '0');
    for (let k = 1; k <= 6; k++) { const j = await call('PUT', '/api/ladder/deck', { wid: wid(k), tier: 1, e: decks[k - 1] }, { ip: '10.5.0.' + k }); assert.ok(j.ok, 'KV 덱 ' + k + ' ' + JSON.stringify(j)); }
    const V = [];
    for (const k of [5, 6]) { const j = await call('POST', '/api/v1/player', { nickname: '감독' + k, platform: 'web', wid: wid(k) }, { ip: '10.6.0.' + k }); V.push(j.player.id);
      assert.equal((await call('PUT', '/api/v1/ladder/deck', { e: decks[k - 1], tier: 1, wid: wid(k) }, { auth: 'Bearer ' + j.token, ip: '10.6.0.' + k })).tier, 1); }
    /* 1) D1 꺼짐: KV 길 */
    await p.evaluate(() => A.ulGoPg('deck')); await p.fill('#ulName', '와이'); await p.click('[data-a="ulReg"]'); await p.waitForFunction(() => /덱을 등록했습니다/.test(document.body.innerText), null, { timeout: 30000 });
    const mine = [...m.entries()].find(([k, v]) => k.startsWith('ulD:') && JSON.parse(v.v).name === '와이'); assert.ok(mine, '서버(KV)에 내 덱이 없음'); assert.ok(JSON.parse(m.get('ulIdx').v).T[0].some(x => x.wid === mine[0].slice(4)), '단계 색인'); assert.ok(mine[1].v.length < 15000, '덱 크기 ' + mine[1].v.length);
    assert.equal(await p.evaluate(() => UL.v1), 'off', 'D1이 없으면 v1 off'); assert.equal(sql('SELECT COUNT(*) AS n FROM players')[0].n, 2, 'D1이 꺼진 동안 v1 플레이어를 만듦');
    const myWid = mine[0].slice(4); /* 예전에 1부로 올라간 유저: KV에도 1부 */
    await p.evaluate(async w => { G.uld.tier = 1; await fetch('/api/ladder/tier', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wid: w, tier: 1 }) }); }, myWid);
    const deckFaces = await p.evaluate(() => document.querySelectorAll('.dk img.dk-f').length); console.log(`KV 길 덱 등록 통과(서버 ${Math.round(mine[1].v.length / 1024)}KB, 얼굴 ${deckFaces}장)`);
    await p.evaluate(() => A.ulGoPg('league')); await p.waitForTimeout(450); await p.click('[data-a="ulStart"]'); await p.waitForFunction(() => /리그를 시작했습니다/.test(document.body.innerText), null, { timeout: 60000 });
    assert.deepEqual(await p.evaluate(() => G.uld.league.src), { user: 6, cup: 0, ai: 3 }, 'KV 길 리그'); assert.equal(opp, 1); assert.equal(await p.evaluate(() => !!G.uld.league.net), false);
    await p.evaluate(() => A.ulQuit()); assert.equal(await p.evaluate(() => G.uld.league), null); console.log('D1 꺼짐 → KV 길 리그 시작 통과');
    /* 2) D1 켜짐: 다시 열면 v1으로 옮긴다 */
    dbDown = false; await p.evaluate(() => { Object.assign(UL, { v1: '', srv: '', v1sync: '', msg: '' }); A.ulGoPg('deck'); });
    await p.waitForFunction(() => UL.me && UL.me.v1 && /새 래더 서버로 옮겼습니다/.test(UL.msg), null, { timeout: 20000 });
    { const pl = sql('SELECT id, nickname, wid FROM players WHERE wid = ?', myWid); assert.equal(pl.length, 1, 'v1 플레이어(세계 id)'); const dk = sql('SELECT tier, name FROM decks WHERE player_id = ?', pl[0].id)[0]; assert.equal(dk.tier, 1, '단계 옮기기'); assert.equal(dk.name, '와이');
      assert.equal(sql('SELECT tier FROM ladder_entries WHERE player_id = ?', pl[0].id)[0].tier, 1); assert.equal(await p.evaluate(() => G.uld.tier), 1);
      assert.match(await p.evaluate(() => document.querySelector('.ulx').innerText), /새 래더 서버/); console.log(`v1 옮기기 통과(${pl[0].nickname} · 1부)`); }
    await p.evaluate(() => A.ulGoPg('league')); await p.waitForTimeout(450); await p.click('[data-a="ulStart"]'); await p.waitForFunction(() => /리그를 시작했습니다/.test(document.body.innerText), null, { timeout: 60000 });
    assert.match(await p.evaluate(() => document.body.innerText), /AI 구단 3팀이 채웠습니다/); assert.ok(await p.evaluate(() => [...document.querySelectorAll('.ul-k-ai')].some(x => x.innerText === 'AI 구단')), 'AI 구단 표시');
    { const L = await p.evaluate(() => ({ src: G.uld.league.src, net: G.uld.league.net, kvn: G.uld.league.kvn, pids: G.uld.league.teams.filter(t => t.pid).map(t => t.pid).sort(), nicks: G.uld.league.teams.filter(t => t.nick).map(t => t.nick).sort() }));
      assert.deepEqual(L.src, { user: 6, cup: 0, ai: 3 }, 'D1 덱 2 + KV 덱 4(옮겨 온 유저·나는 KV에서 뺌) ' + JSON.stringify(L)); assert.equal(L.net, 1); assert.equal(L.kvn, 4); assert.deepEqual(L.pids, V.slice().sort()); assert.deepEqual(L.nicks, ['감독5', '감독6']);
      assert.equal(opp, 1, 'v1이면 KV 상대를 따로 받지 않음'); assert.equal(v1opp, 1, '리그 시작에 서버를 한 번만'); assert.ok(await p.evaluate(() => [...document.querySelectorAll('.ul-st .ul-k-user')].some(x => /감독5/.test(x.innerText))), '순위표에 상대 닉네임'); }
    await p.click('[data-a="ulNext"]'); await p.waitForFunction(() => G.uld.league && G.uld.league.next === 5 && !UL.busy, null, { timeout: 60000 });
    { const t = await p.evaluate(() => ({ feed: document.querySelectorAll('.ul-feed p').length, me: document.querySelectorAll('.ul-feed p.me').length, txt: document.querySelector('.ul-lg').innerText, lines: [...document.querySelectorAll('.ul-st tr.ul-line')].map(x => x.innerText), sticky: getComputedStyle(document.querySelector('.ul-act')).position }));
      assert.equal(t.feed, 5, '연전 결과 한 줄씩 ' + t.feed); assert.equal(t.me, 1); assert.match(t.txt, /남은 연전 8/); assert.match(t.txt, /다음 상대/); assert.match(t.txt, /(승격권|강등권)/); assert.deepEqual(t.lines.map(x => x.slice(0, 3)), ['승격선', '강등선']); assert.equal(t.sticky, 'sticky');
      assert.equal(await p.evaluate(() => document.querySelectorAll('.ul-next .ul-vs .ul-vr:not(.ul-vh)').length), 6, '상대 덱 비교 6갈래'); assert.match(t.txt, /(상대 우위|우리 우위|고르게 비슷)/); assert.match(t.txt, /명경기 · 이 경기 보기/);
      await p.click('.ul-lg [data-a="ulKey"][data-v="0"]'); await p.waitForSelector('.ul-lg .ul-pre'); assert.match(await p.evaluate(() => document.querySelector('.ul-lg .ul-pre').innerText), /\[경기종료\]/, '명경기 중계'); await p.click('.ul-lg .ul-gv [data-a="ulKey"]'); }
    /* 상대 유저 덱을 누르면 맞대결 */
    { const k = await p.evaluate(() => G.uld.league.teams.findIndex(t => t.pid)); await p.click(`.ul-st [data-a="ulOpp"][data-v="t${k}"], .ul-st [data-a="ulOpp"][data-v="${k}"]`);
      await p.waitForFunction(() => [...document.querySelectorAll('.ul-hh')].some(x => /맞대결 · 감독/.test(x.innerText)), null, { timeout: 10000 }); console.log('상대 유저 맞대결 칸 통과'); }
    await p.click('[data-a="ulEditOpen"]'); await p.waitForSelector('.ul-edit'); const h0 = await p.evaluate(() => G.uld.league.teams[0].e.h);
    await p.click('.ul-edit [data-a="ulUp"][data-v="1"]'); const pid = await p.evaluate(() => UL.edit.pen[2]); await p.selectOption(`.ul-edit select[data-a="ulBp"][data-i="${pid}"]`, 'cl');
    await p.click('[data-a="ulEditSave"]'); await p.waitForFunction(() => /다음 연전부터/.test(document.body.innerText), null, { timeout: 10000 }); const h1 = await p.evaluate(() => G.uld.league.teams[0].e.h); assert.notEqual(h0, h1);
    assert.equal(await p.evaluate(pid => G.uld.league.teams[0].e.bp[pid], pid), 'cl'); console.log('리그 시작(D1 덱 2 + KV 덱 4 + AI 3)·다음 연전·덱 고치기 통과');
    await p.click('[data-a="ulNext"]'); await p.waitForFunction(() => G.uld.league.next === 10 && !UL.busy, null, { timeout: 60000 });
    const used = await p.evaluate(() => { const L = G.uld.league, s = L.series.slice(5).find(x => x.a === 0 || x.b === 0); return s.a === 0 ? s.ha : s.hb; }); assert.equal(used, h1, '고친 덱이 다음 연전에 안 나감');
    const fitNow = async () => p.evaluate(() => { window.scrollTo(0, 9999); return { scroll: scrollY, h: document.documentElement.scrollHeight, v: innerHeight }; });
    { const fit = await fitNow(); assert.ok(fit.scroll === 0 && fit.h <= fit.v + 2, 'PC 리그 화면이 통째로 스크롤됨 ' + JSON.stringify(fit)); }
    const shot = process.env.SHOT; if (shot) { await p.evaluate(() => { render(); document.querySelectorAll('.setc,.ws-own,main,.main').forEach(e => { e.scrollTop = 0; }); }); await p.waitForTimeout(1500); await p.evaluate(() => { render(); document.querySelectorAll('.setc').forEach(e => { e.scrollTop = 0; }); }); await p.screenshot({ path: shot + '_1440.png' }); }
    /* 휴대폰: 같은 기기 토큰(기기 옮기기와 같은 모양)으로 */
    const tok = await p.evaluate(() => [localStorage.getItem('fo-net-v1-token'), localStorage.getItem('fo-net-v1-player')]); assert.match(tok[0] || '', /^ft1\./, '기기 토큰');
    const ctx2 = await b.newContext({ viewport: { width: 390, height: 844 } }); await ctx2.addInitScript(t => { try { localStorage.setItem('fo-net-v1-token', t[0]); localStorage.setItem('fo-net-v1-player', t[1]); } catch (e) {} }, tok);
    const p2 = await ctx2.newPage(); await initClock(p2); p2.on('pageerror', e => errs.push(String(e)));
    const save = await p.evaluate(() => JSON.stringify(G)); await p2.goto(url);await p2.waitForFunction(()=>performance.getEntriesByName('fronttime-menu-ready').length>0); await p2.waitForFunction(() => typeof newGame === 'function' && UI.title === true, null, { timeout: 60000 }); await p2.evaluate(s => { G = JSON.parse(s); migrateDraft(); UI.title = false; A.go('uld:league'); }, save);
    await p2.waitForSelector('[data-a="ulNext"]', { timeout: 20000 }); const sw = await p2.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1); assert.ok(sw, '휴대폰 폭에서 가로 스크롤');
    if (shot) { await p2.waitForTimeout(1500); await p2.evaluate(() => render()); await p2.screenshot({ path: shot + '_390.png', fullPage: false }); } console.log('PC 한 화면·휴대폰 폭 통과');
    /* 첫 직접 등록과 다음 직접 등록은 실제 날짜를 하루 넘긴다. 클라이언트 표를 지우지 않고 Worker도 같은 시간을 본다. */
    assert.equal(await p.evaluate(() => FrontOfficeCore.ulManOk(G.uld.ar, Date.now())), false, '첫 직접 등록의 당일 제한 유지');
    testOffset += 86400e3; for (const page of [p, p2]) await page.evaluate(offset => { window.__uladderTestOffset = offset; render(); }, testOffset);
    assert.equal(await p.evaluate(() => FrontOfficeCore.ulManOk(G.uld.ar, Date.now())), true, '다음 날 직접 등록 가능');
    await p.click('[data-a="ulAll"]'); await p.waitForFunction(() => /리그가 끝났습니다/.test(document.body.innerText), null, { timeout: 120000 }).catch(async e => { console.log('DBG', await p.evaluate(() => JSON.stringify({ n: G.uld.league && G.uld.league.next, busy: UL.busy, last: !!G.uld.last, msg: UL.msg, tab: UI.tab, gen: UL.gen })), errs); throw e; });
    await p.waitForFunction(() => G.uld.last && G.uld.last.srv, null, { timeout: 20000 });
    const res = await p.evaluate(() => ({ last: G.uld.last, tier: G.uld.tier, hist: G.uld.hist.length, t: document.body.innerText }));
    assert.equal(res.hist, 1); assert.match(res.t, /리그 결과/); assert.match(res.t, /시즌 MVP/); assert.match(res.t, /내 최고 단계/); assert.ok(await p.evaluate(() => !!document.querySelector('.ul-badge')), '승강 배지');
    { const S = res.last.srv; assert.ok(!S.queued, '결과를 서버에 못 보냄'); assert.equal(res.tier, S.tier, '단계는 서버 응답'); assert.equal(S.tier, res.last.to, '서버와 기기 승강이 다름');
      const me = sql('SELECT id FROM players WHERE wid = ?', myWid)[0].id, lr = sql('SELECT rank, tier, to_tier, delta FROM league_results WHERE player_id = ?', me);
      assert.equal(lr.length, 1); assert.equal(lr[0].rank, res.last.rank); assert.equal(lr[0].tier, 1); assert.equal(lr[0].delta, S.delta);
      const hh = sql('SELECT opp_id, n FROM h2h WHERE player_id = ? ORDER BY opp_id', me); assert.deepEqual(hh.map(x => x.opp_id), V.slice().sort(), '맞대결은 pid 있는 상대만'); assert.ok(hh.every(x => x.n === 3), '상대마다 3경기 ' + JSON.stringify(hh));
      assert.equal(sql('SELECT tier FROM decks WHERE player_id = ?', me)[0].tier, res.tier); assert.match(res.t, /서버 시즌 포인트 \+\d+/); }
    { const r = await p.evaluate(() => ({ t: document.querySelector('.ulx').innerText, keys: document.querySelectorAll('[data-a="ulKey"][data-k="res"]').length })); assert.match(r.t, /리그 점수\s*\d+/); assert.match(r.t, /리그 하이라이트[\s\S]*리그 1위 기록[\s\S]*상대별 전적/); assert.equal(r.keys, 3, '결과 명경기 3');
      await p.click('[data-a="ulKey"][data-k="res"][data-v="0"]'); await p.waitForTimeout(450); await p.click('[data-a="ulKeyT"][data-v="line"]'); assert.match(await p.evaluate(() => document.querySelector('.ul-gv .ul-bx').innerText), /R\tH\tE/, '점수표(표, 래더 v3)');
      const fit2 = await fitNow(); assert.ok(fit2.scroll === 0 && fit2.h <= fit2.v + 2, 'PC 결과 화면이 통째로 스크롤됨 ' + JSON.stringify(fit2)); }
    if (shot) await p.screenshot({ path: shot + '_result_1440.png' });
    if (shot) { await p2.evaluate(s => { G = JSON.parse(s); A.go('uld:league'); }, await p.evaluate(() => JSON.stringify(G))); await p2.waitForTimeout(800); await p2.screenshot({ path: shot + '_result_390.png' }); }
    assert.equal(m.get('ulD:' + myWid).meta.tier, 1, 'v1이면 KV 단계는 쓰지 않음(KV 쓰기 아끼기)');
    console.log(`끝까지·결과(서버 포인트·단계) 통과: ${res.last.rank}위 → ${res.last.move}, +${res.last.srv.delta}`);
    /* 순위 탭: 내 시즌·순위표·소식 */
    await p.evaluate(() => A.go('uld:rank'));
    await p.waitForFunction(() => document.querySelector('.ul-lb') && UL.sv.meSt === 'ok' && UL.sv.feedSt === 'ok', null, { timeout: 15000 });
    { const t = await p.evaluate(() => ({ txt: document.querySelector('.ulx').innerText, me: !!document.querySelector('.ul-lb tr.me'), rows: document.querySelectorAll('.ul-lb tr').length - 1 }));
      assert.match(t.txt, /내 시즌[\s\S]*시즌 포인트/); assert.match(t.txt, /순위표/); assert.match(t.txt, /최근 소식/); assert.ok(t.me, '순위표에 나'); assert.ok(t.rows >= 1);
      assert.match(t.txt, /서버 기록 지우기/); if (res.last.move === 'up') assert.match(t.txt, /승격/); const fit3 = await fitNow(); assert.ok(fit3.scroll === 0 && fit3.h <= fit3.v + 2, 'PC 순위 화면이 통째로 스크롤됨 ' + JSON.stringify(fit3)); }
    await p.click('[data-a="ulBoardT"][data-v="all"]'); await p.waitForFunction(() => UL.sv.board.all && UL.sv.board.all.st === 'ok' && document.querySelector('.ul-lb tr.me svg.ul-emb'), null, { timeout: 10000 });
    await p.click('[data-a="ulBoardT"][data-v="4"]'); await p.waitForFunction(() => UL.sv.board[4] && UL.sv.board[4].st === 'ok' && /리그를 마친 유저가 아직 없습니다/.test(document.querySelector('.ulx').innerText), null, { timeout: 10000 });
    if (shot) await p.screenshot({ path: shot + '_rank_1440.png' });
    await p2.evaluate(s => { G = JSON.parse(s); A.go('uld:rank'); }, await p.evaluate(() => JSON.stringify(G))); await p2.waitForFunction(() => document.querySelector('.ul-lb'), null, { timeout: 15000 });
    assert.ok(await p2.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '휴대폰 순위 탭 가로 스크롤'); if (shot) await p2.screenshot({ path: shot + '_rank_390.png' }); console.log('순위 탭(내 시즌·순위표·소식) 통과');
    await p.evaluate(() => { UL.tiersSt = ''; A.ulGoPg('lobby'); }); await p.waitForFunction(() => UL.tiers && /등록 덱 \d/.test(document.querySelector('.ul-lad').innerText), null, { timeout: 10000 });
    const tc = await p.evaluate(() => UL.tiers); assert.equal(tc.reduce((a, b) => a + b, 0), 7, '단계별 등록 덱 수(KV) ' + tc);
    { const t = await p.evaluate(() => document.querySelector('.ulx').innerText); assert.match(t, /승강 사다리[\s\S]*최근 리그[\s\S]*이번 시즌 우리 선수/); assert.match(t, /시즌 목표\s*\d\/5/); const ladderText = await p.evaluate(() => document.querySelector('.ul-lad').innerText); assert.match(ladderText, /레전드\s*AI 기준 OVR 79/, '사다리 AI 기준'); assert.doesNotMatch(ladderText, /연봉 상한/, 'PR242 래더 사다리에 연봉 상한 표시 없음'); assert.ok(await p.evaluate(() => document.querySelectorAll('.ul-strip .ul-rs').length === 1), '최근 리그 띠');
      const fit = await fitNow(); assert.ok(fit.scroll === 0, 'PC 로비 통째 스크롤 ' + JSON.stringify(fit)); } if (shot) await p.screenshot({ path: shot + '_lobby_1440.png' }); console.log('로비 통과');
    /* 덱: 선수 카드마다 래더 기록 */
    await p.evaluate(() => A.ulGoPg('deck')); { const d = await p.evaluate(() => ({ n: document.querySelectorAll('.ulp').length, st: [...document.querySelectorAll('.ulp-s')].filter(x => /경기/.test(x.innerText)).length, arch: (document.querySelector('.ul-arch') || {}).innerText }));
      assert.ok(d.n >= 24 && d.st >= 14, '덱 선수 카드·래더 기록 ' + JSON.stringify(d)); assert.ok(d.arch, '덱 성향'); } console.log('덱 화면 통과');
    /* 래더 연봉 상한 없음(구단주 11-18 "래더는 일단 상한을 두지 말고 자유롭게"): 상한 칸·선수 빼기가 없고, 예전 상한을 넘는 1군도 그대로 등록된다(서버 D1도 받음) */
    { assert.equal(await p.evaluate(() => document.querySelectorAll('.ul-cap,[data-a="ulCapDrop"],[data-a="ulCapAuto"]').length), 0, '상한 칸 없음'); assert.match(await p.evaluate(() => document.querySelector('.ul-free').innerText), /연봉 상한이 없습니다/);
      const h0 = await p.evaluate(() => { const e = ulRegEntry().e, c = FrontOfficeCore.ulCap(e, G.uld.tier), top = e.P.slice().sort((a, b) => b.sal - a.sal)[0], q = G.players[top.id]; UL.capT = [q.id, q.sal]; q.sal += c.room + 500; render(); return G.uld.deck.e.h; });
      assert.equal(await p.evaluate(() => document.querySelector('[data-a="ulReg"]').disabled), false, '예전 상한을 넘어도 등록 단추가 열림');
      await p.click('[data-a="ulReg"]'); await p.waitForFunction(h => /덱을 등록했습니다/.test(document.body.innerText) && G.uld.deck.e.h !== h, h0, { timeout: 30000 });
      const sv = await p.evaluate(() => { const e = G.uld.deck.e; return { n: e.P.length, ok: FrontOfficeCore.ulCap(e, G.uld.tier).ok }; }); assert.ok(!sv.ok && sv.n >= 24, '1군 그대로(예전 상한 초과) ' + JSON.stringify(sv));
      const body = JSON.parse(sql('SELECT d.body FROM decks d JOIN players p ON p.id = d.player_id WHERE p.wid = ?', myWid)[0].body);
      assert.ok(body.P.length >= 24, '서버(D1)에 그대로 저장');
      await p.evaluate(() => { G.players[UL.capT[0]].sal = UL.capT[1]; UL.msg = ''; render(); }); console.log('래더 연봉 상한 없음(상한 칸 없음·넘는 덱 등록·서버 저장) 통과'); }
    /* 기록·데이터: 우리 선수(정렬·거르기·시즌별)·팀·선수 구성(서버 집계)·상대 분석·CSV */
    await p.evaluate(() => { UI.it.uldata = 'pl'; A.ulGoPg('data'); }); await p.waitForSelector('.ul-dt tbody tr');
    { const n0 = await p.evaluate(() => document.querySelectorAll('.ul-dt tbody tr').length); assert.ok(n0 >= 9, '타자 줄 ' + n0); await p.click('.ul-dt [data-a="ulDsSort"][data-v="hr"]');
      const hr = await p.evaluate(() => [...document.querySelectorAll('.ul-dt tbody tr')].map(r => +r.children[8].innerText)); assert.deepEqual(hr, hr.slice().sort((a, b) => b - a), '홈런 정렬');
      await p.selectOption('select[data-a="ulDs"][data-f="tier"]', '3'); assert.equal(await p.evaluate(() => document.querySelectorAll('.ul-dt tbody tr').length), 0, '단계 거르기'); await p.selectOption('select[data-a="ulDs"][data-f="tier"]', '-1');
      await p.click('[data-a="ulDsK"][data-v="p"]'); const np = await p.evaluate(() => document.querySelectorAll('.ul-dt tbody tr').length); assert.ok(np >= 5, '투수 줄 ' + np); assert.match(await p.evaluate(() => document.querySelector('.ul-c2').innerText), /ERA[\s\S]*WHIP[\s\S]*K\/9/);
      await p.click('.ul-dt tbody tr:nth-child(2)'); assert.match(await p.evaluate(() => document.querySelectorAll('.ulx .setc')[1].innerText), /시즌별/);
      const csv = await p.evaluate(() => ulCsvFile('bat')[1]); assert.match(csv, /^시즌,단계,선수,포지션,G,PA/); assert.ok(csv.split('\r\n').length >= 10, 'CSV 줄'); assert.match(csv.split('\r\n')[1], /^[^,]+,(루키|마이너|1부|챔피언스|레전드),/, '단계 열(#51)');
      { const f = await p.evaluate(() => ulCsvFile('cur')); assert.match(f[0], /-filtered$/); assert.ok(f[1].split('\r\n').length >= 2, '지금 조건 내보내기(#50)'); assert.ok(await p.evaluate(() => !!document.querySelector('th[aria-sort="descending"],th[aria-sort="ascending"]') && !!document.querySelector('button.ul-pn')), 'aria-sort·이름 단추(#53·#54)'); }
      const fit = await fitNow(); assert.ok(fit.scroll === 0, 'PC 데이터 통째 스크롤 ' + JSON.stringify(fit)); if (shot) await p.screenshot({ path: shot + '_data_1440.png' }); }
    await p.click('[data-a="itab"][data-v="uldata:team"]'); assert.ok(await p.evaluate(() => !!document.querySelector('svg.ul-chart circle') && /팀 래더 기록 · 시즌별[\s\S]*통산/.test(document.querySelector('.ulx').innerText)), '팀 기록·흐름 그림');
    await p.click('[data-a="itab"][data-v="uldata:meta"]'); await p.waitForFunction(() => UL.meta && Object.values(UL.meta).some(x => x.st === 'ok' && x.src === 'srv' && x.agg.n >= 1) && document.querySelector('.ul-mt'), null, { timeout: 15000 });
    { const t = await p.evaluate(() => document.querySelector('.ulx').innerText); assert.match(t, /래더 선수 구성[\s\S]*유격수[\s\S]*덱 OVR/); assert.match(t, /외국인 비율[\s\S]*나이 분포[\s\S]*많이 쓰는 덱 성향[\s\S]*우리 덱 vs 평균/); }
    assert.equal(sql('SELECT COUNT(*) AS n FROM deck_meta')[0].n, 3, '서버 덱 구성 요약(D1 덱 3)'); if (shot) await p.screenshot({ path: shot + '_meta_1440.png' });
    await p.click('[data-a="itab"][data-v="uldata:opp"]'); assert.equal(await p.evaluate(() => document.querySelectorAll('.ul-dt tbody tr').length), 9, '상대 9팀'); await p.click('.ul-dt tbody tr[data-v^="p:"]');
    await p.waitForFunction(() => /강점[\s\S]*약점/.test(document.querySelector('.ulx').innerText) && [...document.querySelectorAll('.ul-hh')].some(x => /맞대결 · 감독/.test(x.innerText)), null, { timeout: 10000 }); console.log('기록·데이터(선수·팀·선수 구성·상대·CSV) 통과');
    await p2.evaluate(s => { G = JSON.parse(s); UI.it.uldata = 'pl'; A.go('uld:data'); }, await p.evaluate(() => JSON.stringify(G))); await p2.waitForSelector('.ul-dt'); assert.ok(await p2.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '휴대폰 데이터 가로 스크롤');
    for (const pg of ['lobby', 'deck']) { await p2.evaluate(pg => A.go('uld:' + pg), pg); await p2.waitForTimeout(300); assert.ok(await p2.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '휴대폰 가로 스크롤 ' + pg); }
    /* 관리자: 예전 KV 래더 덱 검색·숨김, 래더 현황은 D1 숫자 */
    await p.evaluate(() => { localStorage.setItem('fo-cup-admin', 'test-admin'); ADM.chk = ''; A.go('club:cupadm'); }); await p.waitForSelector('[data-a="admTab"][data-v="cup"]', { timeout: 20000 }); assert.equal(await p.evaluate(() => document.querySelector('.adm-tabs button').dataset.v), 'ld', '관리자 기본 첫 탭은 래더'); await p.click('[data-a="admTab"][data-v="cup"]'); await p.waitForSelector('#admLdQ', { timeout: 20000 });
    await p.waitForFunction(() => /래더 덱 7개 · 오늘 쓰기 약 \d+회/.test(document.querySelector('.adm-now').innerText), null, { timeout: 10000 }); console.log('관리자 상태 줄(래더 덱 수·오늘 쓰기) 통과');
    await p.fill('#admLdQ', '유저2'); await p.click('[data-a="admLdFind"]'); await p.waitForFunction(() => /래더 덱 1개/.test(document.body.innerText), null, { timeout: 10000 });
    await p.click('[data-a="admLdHide"]'); await p.waitForFunction(() => /숨겼습니다/.test(document.body.innerText), null, { timeout: 10000 }); assert.ok(!JSON.parse(m.get('ulIdx').v).T.some(L => L.some(x => x.wid === 'w0000000000000002')), '숨긴 덱 색인'); console.log('관리자 래더 숨김 통과');
    await p.click('[data-a="admTab"][data-v="ld"]'); await p.evaluate(() => A.ldxTab('ops')); await p.waitForFunction(() => LDA.st === 'd1' && document.querySelector('.lda-t'), null, { timeout: 15000 });
    { const d = await p.evaluate(() => LDA.d), t = await p.evaluate(() => document.querySelector('.ldax').innerText);
      assert.equal(d.totals.players, 3, '플레이어(감독5·6 + 나)'); assert.equal(d.totals.decks, 3); assert.equal(d.windows.today.leagues, 1, '오늘 완료한 리그'); assert.equal(d.tiers.reduce((a, x) => a + x.players, 0), 3);
      assert.equal(d.windows.today.promos + d.windows.today.demos, res.last.move === 'stay' ? 0 : 1); assert.ok(d.top.some(x => x.leagues === 1), '상위 플레이어'); assert.match(t, /완료한 리그/); console.log('관리자 래더 현황(D1 숫자) 통과'); }
    /* 서버 기록 지우기 */
    await p.evaluate(() => A.go('uld:rank')); await p.waitForSelector('[data-a="ulSvDel"]', { timeout: 15000 }); await p.click('.card [data-a="ulSvDel"]');
    await p.waitForFunction(() => /서버 기록을 지웠습니다/.test(document.body.innerText), null, { timeout: 15000 });
    assert.equal(sql('SELECT COUNT(*) AS n FROM players WHERE wid = ?', myWid)[0].n, 0, 'D1 플레이어 지움'); assert.equal(m.has('ulD:' + myWid), false, 'KV 덱 지움');
    assert.deepEqual(await p.evaluate(() => [localStorage.getItem('fo-net-v1'), localStorage.getItem('fo-net-v1-token'), FrontOfficeCore.netEnabled()]), ['0', null, false]);
    assert.match(await p.evaluate(() => document.querySelector('.ulx').innerText), /서버 래더 다시 켜기/); console.log('서버 기록 지우기 통과');
    assert.deepEqual(errs, []);
  } catch (e) { try { const ps = b.contexts().flatMap(c => c.pages()); console.error('화면: ' + await ps[0].evaluate(() => [...document.querySelectorAll('.note')].map(x => x.innerText).join(' / ') + ' | ' + (UL.msg || '') + ' | meta ' + JSON.stringify(UL.meta || null).slice(0, 300) + ' | ' + JSON.stringify(UI.it) + ' | ' + (document.querySelector('.ulx') || {}).innerText.slice(0, 300))); } catch (x) {} throw e; } finally { await b?.close(); server.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
