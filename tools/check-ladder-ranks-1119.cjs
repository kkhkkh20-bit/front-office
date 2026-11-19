/* 래더 순위표 50위 · 내 순위 둘레 · 덱 구경 화면 점검(구단주 11-19 "래더에 다른 일반 유저들 리그의 랭킹 리스트 … 상위 팀들 덱도 관전").
   실제 Worker(worker/index.js)를 가짜 D1(node:sqlite)로 띄우고, 유저 56명이 루키 단계에서 리그를 하나씩 마친 상태를 만든다.
   1) 순위 탭: 순위표 50줄 + 50위 밖인 나의 '내 순위 둘레' · 유저 이름 단추 · '상위 50명' 문구
   2) 이름을 누르면 덱 구경(타순 9 · 선발 5 · 불펜 · 시즌 기록), 고치는 칸 없음, '순위표로' 돌아가기
   3) 못 받는 경우: 연결 끊김 · 덱 없음(404 not_found) · 예전 서버(404, 본문 없음) · 순위표 실패 · 빈 단계
   4) 응답에 토큰·세계 id가 없다. PC 1440×900 한 화면(안쪽만 스크롤), 휴대폰 390 가로 넘침 없음
 사용: bash build.sh 후 node tools/check-ladder-ranks-1119.cjs (CHROMIUM_EXECUTABLE_PATH 필요할 수 있음). SHOT=경로 접두어면 그림. 노드 22.5 미만이면 건너뛴다 */
const assert = require('node:assert/strict'), path = require('node:path'), http = require('node:http'), fs = require('node:fs');
const { makeD1, hasSqlite } = require('./lib/d1-shim.cjs');
if (!hasSqlite) { console.log('래더 순위·덱 구경 화면 점검 건너뜀: node:sqlite 없음'); process.exit(0); }
const { chromium } = require('playwright');
(async () => {
  const { handle } = await import(path.resolve(__dirname, '../worker/index.js'));
  const DB = makeD1(), env = { CUP_ADMIN: 'test-admin', DB }, html = fs.readFileSync(path.resolve(__dirname, '../index.html'));
  const call = async (method, p, body, h = {}) => { const r = await handle(new Request('http://seed.local' + p, { method, body: body == null ? undefined : JSON.stringify(body), headers: Object.assign({ 'CF-Connecting-IP': h.ip || '10.0.0.1' }, h.auth ? { Authorization: h.auth } : {}) }), env, Date.now()); return r.json(); };
  const seen = [], mode = { deck: '', board: '' }; /* 화면이 받은 순위·덱 응답(개인 정보 검사) · 실패 흉내 */
  const server = http.createServer(async (q, r) => {
    if (q.url === '/') { r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return r.end(html); }
    if (!q.url.startsWith('/api/')) { r.writeHead(404); return r.end(); }
    if (q.url.startsWith('/api/v1/ladder/deck/') && q.method === 'GET' && mode.deck) { if (mode.deck === 'drop') return q.socket.destroy(); if (mode.deck === 'old') { r.writeHead(404); return r.end(); } }
    if (q.url.startsWith('/api/v1/ladder/leaderboard') && mode.board === 'drop') return q.socket.destroy();
    const body = await new Promise(ok => { const c = []; q.on('data', x => c.push(x)); q.on('end', () => ok(Buffer.concat(c))); });
    const res = await handle(new Request('http://' + q.headers.host + q.url, { method: q.method, headers: q.headers, body: ['GET', 'HEAD'].includes(q.method) ? undefined : body }), env, Date.now());
    const buf = Buffer.from(await res.arrayBuffer()); if (/\/ladder\/(leaderboard|near|deck\/)/.test(q.url) && q.method === 'GET') seen.push({ url: q.url, status: res.status, text: buf.toString('utf8') });
    r.writeHead(res.status, Object.fromEntries(res.headers)); r.end(buf);
  });
  await new Promise(ok => server.listen(0, '127.0.0.1', ok)); const url = `http://127.0.0.1:${server.address().port}/`;
  assert.ok((await call('POST', '/api/v1/admin/migrate', null, { auth: 'Bearer test-admin' })).ok);
  let b; try {
    b = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || '/usr/bin/chromium' }); const p = await b.newPage(); await p.setViewportSize({ width: 1440, height: 900 });
    const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('dialog', d => d.accept());
    await p.goto(url); await p.waitForFunction(() => typeof newGame === 'function' && UI.title === true, null, { timeout: 90000 });
    await p.evaluate(() => { DEMO.on = false; newGame(6); fdStart(); fdAdvance(false); let n = 0; while (G.fd && !G.fd.done && n++ < 500) fdAdvance(true); hireMgr(G.mmarket[0].id, 3); G.tut = { done: true, step: 99 }; G.medSet = true; UI.title = false; A.go('uld:deck'); });
    /* 다른 유저 56명: 이 게임의 다른 구단 덱(진짜 명단)으로 루키 단계에 등록하고 리그를 하나씩 마친다. 먼저 마친 유저가 위(같은 점수) */
    const decks = await p.evaluate(() => [1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => { let e = cupEntryNow({ tid: (G.user + k) % 10, name: '구단' + k }); { const C = FrontOfficeCore, sg = C.ulCapSuggest(e, 0); if (sg.ids.length) { e = C.ulCapDrop(e, sg.ids).e; e.ovr = cupOvr(e); e.h = C.cupEntryHash(e); } } e.payRef = Math.max(e.payRef, Math.ceil(e.pay / 1.4)); return e; }));
    const others = [];
    for (let i = 1; i <= 56; i++) { const ip = '10.7.' + (i >> 4) + '.' + (i & 15), wid = 'w' + String(i).padStart(16, '0'), j = await call('POST', '/api/v1/player', { nickname: '단장' + i, platform: 'web', wid }, { ip }); assert.ok(j.ok, '플레이어 ' + i + ' ' + JSON.stringify(j));
      const e = Object.assign({}, decks[(i - 1) % decks.length], { name: '팀' + i }); delete e.h; const auth = 'Bearer ' + j.token;
      const d = await call('PUT', '/api/v1/ladder/deck', { e, tier: 0, wid }, { auth, ip }); assert.ok(d.ok, '덱 ' + i + ' ' + JSON.stringify(d).slice(0, 300));
      const rs = await call('POST', '/api/v1/ladder/result', { key: 'CHK-' + i, rank: i <= 2 ? 3 : 5, teams: 10, w: 15, l: 12, d: 0, opps: [] }, { auth, ip }); assert.ok(rs.ok, '결과 ' + i + ' ' + JSON.stringify(rs));
      others.push({ id: j.player.id, token: j.token, wid }); }
    /* 나: 덱 등록 → 리그 하나를 꼴찌로 마침(1점) → 57위 */
    await p.waitForSelector('#ulName', { timeout: 30000 }); await p.fill('#ulName', '와이'); await p.click('[data-a="ulReg"]');
    await p.waitForFunction(() => UL.me && UL.me.v1 && ulNet().signedIn(), null, { timeout: 60000 });
    const me = await p.evaluate(async () => { const r = await ulNet().result({ key: 'CHK-ME-1', rank: 10, teams: 10, w: 3, l: 24, d: 0, opps: [] }); ulSvStale(); return { ok: r.ok, pid: ulNet().player().id, token: localStorage.getItem('fo-net-v1-token'), wid: G.wid, ls: Object.fromEntries(Object.keys(localStorage).filter(k => k.startsWith('fo-net')).map(k => [k, localStorage.getItem(k)])) }; });
    assert.ok(me.ok, '내 리그 결과'); assert.match(String(me.token), /^ft1\./, '토큰 열쇠 이름');
    /* 1) 순위 탭 */
    await p.evaluate(() => A.go('uld:rank'));
    await p.waitForFunction(() => document.querySelectorAll('.ul-bd .ul-lb').length === 2 && UL.sv.meSt === 'ok', null, { timeout: 20000 });
    const T = await p.evaluate(() => { const tb = [...document.querySelectorAll('.ul-bd .ul-lb')]; return { rows: tb[0].querySelectorAll('tr').length - 1, near: [...tb[1].querySelectorAll('tr')].slice(1).map(r => [r.cells[0].innerText.trim(), r.className]), btn: tb[0].querySelectorAll('button.ul-bdn[data-a="ulBdDeck"]').length, first: tb[0].rows[1].innerText, head: tb[0].rows[0].innerText, txt: document.querySelector('.ul-bd').innerText, all: document.querySelector('.ul-bd').textContent }; });
    assert.equal(T.rows, 50, '순위표 50줄'); assert.equal(T.btn, 50, '유저 이름마다 덱 보기 단추'); assert.match(T.first, /단장1[\s\S]*팀1[\s\S]*OVR/); assert.match(T.head, /순위[\s\S]*유저 · 팀[\s\S]*포인트[\s\S]*리그[\s\S]*우승/);
    assert.deepEqual(T.near.map(x => x[0]), ['54', '55', '56', '57'], '내 순위 둘레(위 3명 + 나)'); assert.equal(T.near[3][1], 'me'); assert.match(T.txt, /내 순위 둘레/); assert.match(T.all, /루키 단계 상위 50명/, '설명(PC에서는 ⓘ 안)'); assert.match(T.head, /이름을 누르면 덱/, '덱 보기 안내는 표 머리에 늘 보인다');
    const fitNow = async () => p.evaluate(() => { window.scrollTo(0, 9999); return { scroll: scrollY, h: document.documentElement.scrollHeight, v: innerHeight, w: document.documentElement.scrollWidth, vw: innerWidth }; });
    { const f = await fitNow(); assert.ok(f.scroll === 0 && f.h <= f.v + 2 && f.w <= f.vw + 1, 'PC 순위 화면이 통째로 스크롤됨 ' + JSON.stringify(f)); }
    const shot = process.env.SHOT; if (shot) await p.screenshot({ path: shot + '_list_1440.png' });
    console.log('순위표 50줄 + 내 순위 둘레 통과');
    /* 2) 덱 구경 */
    const n0 = seen.filter(x => /\/ladder\/deck\//.test(x.url)).length;
    await p.click('.ul-bd .ul-lb tr:nth-child(2) button.ul-bdn'); await p.waitForSelector('.ul-bd .ul-dv .ulps', { timeout: 15000 });
    const D = await p.evaluate(() => { const v = document.querySelector('.ul-bd .ul-dv'), n = k => v.querySelectorAll(`.ulps[data-k="${k}"] .ulp`).length, L = k => [...v.querySelectorAll(`.ulps[data-k="${k}"] .ulp-l`)].map(x => x.innerText.trim()); return { txt: v.innerText, all: v.textContent, ln: n('ln'), rot: n('rot'), pen: n('pen'), bn: n('bn'), lnL: L('ln'), penL: L('pen'), bat: v.querySelector('.ulps[data-k="ln"] .ulp-s').innerText, pit: v.querySelector('.ulps[data-k="rot"] .ulp-s').innerText, links: v.querySelectorAll('a.pl,[data-a="player"]').length,
      edit: v.querySelectorAll('select,input,textarea,[data-a^="ulEdit"],[data-a="ulReg"],[data-a="ulSwap"]').length, acts: [...v.querySelectorAll('[data-a]')].map(x => x.dataset.a), chips: document.querySelectorAll('.ul-bd .ul-bt').length, ovr: [...v.querySelectorAll('.ulp .dk-o')].every(x => /^\d+$/.test(x.innerText.trim())) }; });
    assert.equal(D.ln, 9, '타순 9명'); assert.match(D.lnL[0], /^1 /); assert.equal(D.rot, 5, '선발 5명'); assert.ok(D.pen >= 3 && D.penL[0] === '마무리', '불펜 ' + D.pen); assert.ok(D.ln + D.rot + D.pen + D.bn >= 24, '명단 전체 ' + (D.ln + D.rot + D.pen + D.bn));
    assert.match(D.bat, /\d+세 · [좌우양]타 · 컨택 \d+ · 파워 \d+ · 선구 \d+ · 주루 \d+ · 수비 \d+/, '타자 주요 능력 ' + D.bat); assert.match(D.pit, /\d+세 · [좌우]투 · 구위 \d+ · 제구 \d+ · 체력 \d+/, '투수 주요 능력 ' + D.pit);
    assert.match(D.txt, /팀1[\s\S]*단장1/); assert.match(D.txt, /OVR 총\s*\d+[\s\S]*투수\s*\d+[\s\S]*타자\s*\d+[\s\S]*시즌 포인트\s*19/); assert.match(D.txt, /루키 · 이번 시즌 리그 1 · 우승 0/); assert.match(D.all, /보기만 할 수 있습니다/); assert.ok(D.ovr, '선수 능력 숫자'); assert.equal(D.links, 0, '남의 덱 선수 이름이 내 세계 선수 카드로 이어지면 안 된다');
    assert.equal(D.edit, 0, '덱 구경에는 고치는 칸이 없다'); assert.deepEqual(D.acts, ['ulBdDeck'], '단추는 순위표로 돌아가기뿐'); assert.equal(D.chips, 0, '덱 구경 중에는 순위표 대신 덱');
    assert.equal(seen.filter(x => /\/ladder\/deck\//.test(x.url)).length, n0 + 1, '덱은 누른 한 팀만 받는다');
    { const f = await fitNow(); assert.ok(f.scroll === 0 && f.h <= f.v + 2 && f.w <= f.vw + 1, 'PC 덱 구경 화면이 통째로 스크롤됨 ' + JSON.stringify(f)); }
    if (shot) { await p.evaluate(() => document.querySelector('.ul-bd').scrollIntoView({ block: 'start' })); await p.screenshot({ path: shot + '_deck_1440.png' }); }
    await p.click('.ul-dv [data-a="ulBdDeck"]'); await p.waitForFunction(() => !document.querySelector('.ul-dv') && document.querySelectorAll('.ul-bd .ul-lb').length === 2, null, { timeout: 10000 });
    /* 같은 팀을 다시 열면 다시 받지 않는다 */
    await p.click('.ul-bd .ul-lb tr:nth-child(2) button.ul-bdn'); await p.waitForSelector('.ul-bd .ul-dv .ulps'); assert.equal(seen.filter(x => /\/ladder\/deck\//.test(x.url)).length, n0 + 1, '이미 받은 덱을 또 받음'); await p.click('.ul-dv [data-a="ulBdDeck"]');
    console.log(`덱 구경 통과(타순 ${D.ln} · 선발 ${D.rot} · 불펜 ${D.pen} · 벤치 ${D.bn})`);
    /* 3) 못 받는 경우 */
    mode.deck = 'drop'; await p.click('.ul-bd .ul-lb tr:nth-child(3) button.ul-bdn'); await p.waitForFunction(() => /연결이 끊겨 덱을 받지 못했습니다/.test((document.querySelector('.ul-dv') || {}).innerText || ''), null, { timeout: 40000 });
    mode.deck = ''; await p.click('.ul-dv [data-a="ulBdDeckRe"]'); await p.waitForSelector('.ul-bd .ul-dv .ulps', { timeout: 15000 }); assert.match(await p.evaluate(() => document.querySelector('.ul-dv').innerText), /팀2[\s\S]*단장2/, '다시 받기'); await p.click('.ul-dv [data-a="ulBdDeck"]');
    mode.deck = 'old'; await p.click('.ul-bd .ul-lb tr:nth-child(4) button.ul-bdn'); await p.waitForFunction(() => /서버가 아직 덱 구경을 지원하지 않습니다/.test((document.querySelector('.ul-dv') || {}).innerText || ''), null, { timeout: 20000 }); mode.deck = ''; await p.click('.ul-dv [data-a="ulBdDeck"]');
    /* 순위표를 받은 뒤 덱을 내린 유저(자동 참가 끔) → 404 not_found */
    assert.ok((await call('PUT', '/api/v1/ladder/auto', { on: false }, { auth: 'Bearer ' + others[4].token, ip: '10.7.0.5' })).ok);
    await p.click('.ul-bd .ul-lb tr:nth-child(6) button.ul-bdn'); await p.waitForFunction(() => /지금 서버에 덱이 없습니다/.test((document.querySelector('.ul-dv') || {}).innerText || ''), null, { timeout: 20000 }); await p.click('.ul-dv [data-a="ulBdDeck"]');
    /* 빈 단계 · 전체(단계 문장) · 순위표 실패 */
    await p.click('[data-a="ulBoardT"][data-v="4"]'); await p.waitForFunction(() => /리그를 마친 유저가 아직 없습니다/.test(document.querySelector('.ul-bd').innerText), null, { timeout: 10000 });
    await p.click('[data-a="ulBoardT"][data-v="all"]'); await p.waitForFunction(() => document.querySelectorAll('.ul-bd .ul-lb tr').length === 51 && document.querySelector('.ul-bd .ul-lb svg.ul-emb') && /전체 상위 50명/.test(document.querySelector('.ul-bd').textContent), null, { timeout: 10000 });
    assert.equal(await p.evaluate(() => document.querySelectorAll('.ul-bd .ul-lb').length), 1, '전체 순위표에는 내 순위 둘레를 붙이지 않는다');
    mode.board = 'drop'; await p.evaluate(() => A.ulSvRe()); await p.waitForFunction(() => /순위표를 받지 못했습니다/.test(document.querySelector('.ul-bd').innerText) && document.querySelector('.ul-bd [data-a="ulSvRe"]'), null, { timeout: 40000 });
    mode.board = ''; await p.click('.ul-bd [data-a="ulSvRe"]'); await p.waitForFunction(() => document.querySelectorAll('.ul-bd .ul-lb tr').length === 51, null, { timeout: 15000 });
    console.log('못 받는 경우(연결 끊김 · 예전 서버 · 덱 없음 · 빈 단계 · 순위표 실패) 통과');
    /* 4) 개인 정보: 화면이 받은 순위·둘레·덱 응답에 토큰·세계 id·숨길 칸이 없다 */
    { const ok = seen.filter(x => x.status === 200); assert.ok(ok.some(x => /leaderboard/.test(x.url)) && ok.some(x => /near/.test(x.url)) && ok.some(x => /deck\//.test(x.url)), '세 응답을 모두 봄');
      const HIDE = /ft1\.|"wid"|"dev"|"ip"|"token"|"email"|"device|"platform"|"hidden"|test-admin/;
      for (const x of ok) { assert.ok(!HIDE.test(x.text), x.url + ' 숨길 칸 ' + (x.text.match(HIDE) || [])[0]); for (const o of [...others, me]) { assert.ok(!x.text.includes(o.token), x.url + ' 토큰'); assert.ok(!x.text.includes(o.token.slice(4)), x.url + ' 토큰 뒷부분'); if (o.wid) assert.ok(!x.text.includes(o.wid), x.url + ' 세계 id'); } }
      assert.ok(seen.filter(x => /deck\//.test(x.url) && x.status === 200).every(x => x.text.length < 45000), '덱 응답 크기'); console.log(`응답 ${ok.length}개 개인 정보 검사 통과`); }
    /* 휴대폰 390: 같은 플레이어 */
    const ctx2 = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); const p2 = await ctx2.newPage(); p2.on('pageerror', e => errs.push(String(e)));
    await p2.addInitScript(ls => { try { for (const k in ls) localStorage.setItem(k, ls[k]); } catch (e) {} }, me.ls);
    await p2.goto(url); await p2.waitForFunction(() => typeof newGame === 'function' && UI.title === true, null, { timeout: 90000 });
    await p2.evaluate(s => { DEMO.on = false; G = JSON.parse(s); UI.title = false; A.go('uld:rank'); }, await p.evaluate(() => JSON.stringify(G)));
    await p2.waitForFunction(() => document.querySelectorAll('.ul-bd .ul-lb tr').length >= 51, null, { timeout: 30000 });
    const over = () => p2.evaluate(() => { const w = innerWidth, bad = [...document.querySelectorAll('.ul-bd, .ul-bd *')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > w + 1 || r.left < -1) && !e.closest('.ul-lbw'); }).map(e => e.className || e.tagName).slice(0, 5); return { sw: document.documentElement.scrollWidth, w, bad, lbw: (() => { const e = document.querySelector('.ul-lbw'); return e ? e.scrollWidth - e.clientWidth : 0; })() }; });
    { const o = await over(); assert.ok(o.sw <= o.w + 1 && !o.bad.length, '휴대폰 순위표 가로 넘침 ' + JSON.stringify(o)); assert.ok(o.lbw <= 1, '휴대폰에서 순위표가 옆으로 밀림 ' + o.lbw); }
    if (shot) { await p2.evaluate(() => document.querySelector('.ul-bd').scrollIntoView({ block: 'start' })); await p2.screenshot({ path: shot + '_list_390.png' }); }
    await p2.click('.ul-bd .ul-lb tr:nth-child(2) button.ul-bdn'); await p2.waitForSelector('.ul-bd .ul-dv .ulps', { timeout: 15000 });
    { const o = await over(); assert.ok(o.sw <= o.w + 1 && !o.bad.length, '휴대폰 덱 구경 가로 넘침 ' + JSON.stringify(o)); assert.equal(await p2.evaluate(() => document.querySelectorAll('.ul-dv .ulps[data-k="ln"] .ulp').length), 9); }
    if (shot) { await p2.evaluate(() => document.querySelector('.ul-bd').scrollIntoView({ block: 'start' })); await p2.screenshot({ path: shot + '_deck_390.png' }); }
    console.log('휴대폰 390 순위표·덱 구경 가로 넘침 없음 통과');
    assert.deepEqual(errs, []); console.log('래더 순위·덱 구경 화면 점검 통과');
  } catch (e) { try { const ps = b.contexts().flatMap(c => c.pages()); console.error('화면: ' + await ps[0].evaluate(() => [...document.querySelectorAll('.note')].map(x => x.innerText).join(' / ') + ' | ' + (UL.msg || '') + ' | ' + ((document.querySelector('.ul-bd') || document.querySelector('.ulx') || {}).innerText || '').slice(0, 400))); } catch (x) {} throw e; } finally { await b?.close(); server.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
