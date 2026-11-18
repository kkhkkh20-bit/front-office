/* 래더 v4 화면 점검(구단주 11-18, docs/design/ladder-v4-2026-11-18.md §1·§10): 실제 Worker(worker/index.js) + 가짜 D1(node:sqlite).
   1) 게임: 등록 단추 없이 자동 등록(구단명#태그 닉네임·auto 덱) → 설정 › 래더 '자동 참가 끄기'(서버 덱 지움)·다시 켜기 → 닉네임 저장 → '지금 덱으로 다시 등록' 하루 1회.
      v1이 꺼진 서버(503)에서도 오류 없이 이 기기 덱만. PC 1366 페이지 스크롤 없음, 휴대폰 390 가로 넘침 없음.
   2) 관리자 '래더 현황' 한눈 보기: 등록 현황(자동/직접·상한 초과·끔)·이상 감지(결과 불일치·비정상 승률·같은 기기)·리그 상황(진행 중·끝난 리그, 눌러서 순위표)·시즌 판·덱 목록(검색·단계·숨기기)·30초 새로고침.
      PC 1440·1366 한 화면(칸 안 스크롤), 휴대폰 390 가로 넘침 없음.
   사용: bash build.sh 후 node tools/check-ladder-auto-ui.cjs (CHROMIUM_EXECUTABLE_PATH 필요할 수 있음). SHOT_DIR=폴더면 그림. 노드 22.5 미만이면 건너뛴다 */
const assert = require('node:assert/strict'), path = require('node:path'), http = require('node:http'), fs = require('node:fs');
const { makeD1, hasSqlite } = require('./lib/d1-shim.cjs');
if (!hasSqlite) { console.log('래더 자동 등록 화면 점검 건너뜀: node:sqlite 없음'); process.exit(0); }
const { chromium } = require('playwright');
function deck(o = {}) { const P = [], POS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'C', 'SS', 'LF', '1B'], sal = o.sal || 300;
  POS.forEach((pos, i) => P.push({ id: i + 1, name: '타자' + i, age: 27, isP: false, pos, th: '우', bt: '우', r: { con: 50, pow: 50, eye: 50, spd: 50, def: 50, vit: 60 }, pot: 55, sal }));
  for (let i = 0; i < 12; i++) P.push({ id: 100 + i, name: '투수' + i, age: 28, isP: true, pos: 'P', th: '우', bt: '우', r: { stf: 50, ctl: 50, sta: i < 5 ? 60 : 40 }, pot: 55, role: i < 5 ? 'SP' : 'RP', sal });
  return { v: 1, kind: 'cup-entry', name: o.name || '와이', year: 2035, club: {}, mgr: {}, payRef: 9000, P, ln: [[1, 'C'], [2, '1B'], [3, '2B'], [4, '3B'], [5, 'SS'], [6, 'LF'], [7, 'CF'], [8, 'RF'], [10, 'DH']], bn: [9, 11, 12], rot: [100, 101, 102, 103, 104], pen: [105, 106, 107, 108, 109, 110, 111], bp: {}, ovr: o.ovr || { t: 60, p: 61, b: 59 } }; }
(async () => {
  const { handle } = await import(path.resolve(__dirname, '../worker/index.js'));
  const m = new Map(), kv = { async get(k) { return m.has(k) ? m.get(k).v : null; }, async getWithMetadata(k) { const e = m.get(k); return { value: e ? e.v : null, metadata: e ? e.meta : null }; },
    async put(k, v, o = {}) { m.set(k, { v: String(v), meta: o.metadata || null }); }, async delete(k) { m.delete(k); }, async list({ prefix }) { return { keys: [...m.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name, metadata: m.get(name).meta })), list_complete: true }; } };
  const DB = makeD1(), env = { SAVE_KV: kv, CUP_ADMIN: 'test-admin', DB }, envNoDb = { SAVE_KV: kv, CUP_ADMIN: 'test-admin' }, html = fs.readFileSync(path.resolve(__dirname, '../index.html'));
  const sql = (q, ...a) => DB._sqlite.prepare(q).all(...a); let dbDown = true;
  const call = async (method, p, body, h = {}) => { const r = await handle(new Request('http://seed.local' + p, { method, body: body == null ? undefined : JSON.stringify(body), headers: Object.assign({ 'CF-Connecting-IP': h.ip || '10.0.0.1' }, h.auth ? { Authorization: h.auth } : {}) }), env, Date.now()); return r.json(); };
  const server = http.createServer(async (q, r) => {
    if (q.url === '/') { r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return r.end(html); }
    if (!q.url.startsWith('/api/')) { r.writeHead(404); return r.end(); }
    const body = await new Promise(ok => { const c = []; q.on('data', x => c.push(x)); q.on('end', () => ok(Buffer.concat(c))); });
    const res = await handle(new Request('http://' + q.headers.host + q.url, { method: q.method, headers: q.headers, body: ['GET', 'HEAD'].includes(q.method) ? undefined : body }), dbDown ? envNoDb : env, Date.now());
    r.writeHead(res.status, Object.fromEntries(res.headers)); r.end(Buffer.from(await res.arrayBuffer()));
  });
  await new Promise(ok => server.listen(0, '127.0.0.1', ok)); const url = `http://127.0.0.1:${server.address().port}/`;
  assert.ok((await call('POST', '/api/v1/admin/migrate', null, { auth: 'Bearer test-admin' })).ok);
  const shots = process.env.SHOT_DIR; if (shots) fs.mkdirSync(shots, { recursive: true });
  const fit = async (p, pc) => p.evaluate(pc => { const s = document.scrollingElement; s.scrollTop = 9999; window.scrollTo(0, 9999); return { y: Math.max(scrollY, s.scrollTop), sw: document.documentElement.scrollWidth <= innerWidth + 1, pc }; }, pc);
  let b; try {
    b = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || '/usr/bin/chromium' });
    const errs = [];
    /* ===== 1) 게임: 자동 등록·설정 › 래더 ===== */
    const p = await b.newPage(); await p.setViewportSize({ width: 1366, height: 768 }); p.on('pageerror', e => errs.push(String(e))); p.on('dialog', d => d.accept());
    await p.goto(url); await p.waitForFunction(() => typeof A === 'object' && typeof newGame === 'function', null, { timeout: 30000 });
    await p.evaluate(() => { DEMO.on = false; newGame(6); fdStart(); fdAdvance(false); let n = 0; while (G.fd && !G.fd.done && n++ < 500) fdAdvance(true); hireMgr(G.mmarket[0].id, 3); G.tut = { done: true, step: 99 }; G.medSet = true; UI.title = false; closeSheets(); render(); });
    /* 서버 v1이 꺼진 동안(503 not_configured): 오류 없이 이 기기 덱만 */
    let r = await p.evaluate(async () => { UI.ulAutoTest = true; const x = await ulAutoTick(); return { x, deck: !!(G.uld && G.uld.deck && G.uld.deck.auto), day: G.uld.ar.day, pend: G.uld.ar.pend, signed: ulNet().signedIn() }; });
    assert.equal(r.x, 'same', '서버 없음: ' + JSON.stringify(r)); assert.ok(r.deck && r.day && !r.pend && !r.signed, '이 기기 덱만 ' + JSON.stringify(r));
    /* v1 켜짐: 다음 날 자동 등록(플레이어 조용히 만들기, 구단명#태그) */
    dbDown = false; r = await p.evaluate(async () => { G.uld.ar.day -= 1; UL.v1 = ''; UL.v1at = 0; const x = await ulAutoTick(); return { x, nick: ulNet().player() && ulNet().player().nickname, tag: localStorage.getItem('fo-ul-tag'), gm: G.gmP && G.gmP.name, club: tfull(G.user), seen: localStorage.getItem('fo-ul-auto-seen') }; });
    assert.equal(r.x, 'ok', '자동 등록 ' + JSON.stringify(r)); assert.match(r.nick, /#\d{4}$/); assert.ok(r.nick.endsWith('#' + r.tag)); assert.ok(!r.gm || !r.nick.includes(r.gm), '단장 이름 안 씀'); assert.equal(r.seen, '1', '처음 안내');
    let row = sql('SELECT r.auto, r.off, r.dev, d.name, p.nickname FROM ladder_reg r JOIN decks d ON d.player_id = r.player_id JOIN players p ON p.id = r.player_id');
    assert.equal(row.length, 1); assert.equal(row[0].auto, 1); assert.equal(row[0].off, 0); assert.ok(row[0].dev && row[0].dev.length === 16); assert.equal(row[0].nickname, r.nick);
    assert.equal(await p.evaluate(() => ulAutoTick()), '', '같은 날 다시 안 올림'); console.log('자동 등록 통과: ' + r.nick);
    /* 설정 › 래더 */
    await p.evaluate(() => { closeSheets(); A.go('cfg:uld'); }); await p.waitForSelector('.ul-auto [data-a="ulAutoSet"][data-v="0"]');
    let t = await p.evaluate(() => document.querySelector('main').textContent); assert.match(t, /래더 자동 참가/); assert.match(t, /단장 이름은 올리지 않습니다/); assert.match(t, /마지막 갱신/); assert.match(t, /래더 닉네임/); assert.match(t, /지금 덱으로 다시 등록/);
    let f = await fit(p); assert.equal(f.y, 0, 'PC 설정 › 래더 페이지 스크롤'); assert.ok(f.sw);
    if (shots) await p.screenshot({ path: path.join(shots, 'ladder-auto-settings-1366.png') });
    await p.click('.ul-auto [data-a="ulAutoSet"][data-v="0"]'); await p.waitForFunction(() => /자동 참가를 껐습니다/.test(document.body.innerText), null, { timeout: 10000 });
    assert.equal(sql('SELECT COUNT(*) AS n FROM decks')[0].n, 0, '끄면 서버 덱 지움'); assert.equal(sql('SELECT off FROM ladder_reg')[0].off, 1);
    assert.equal(await p.evaluate(() => { G.uld.ar.day -= 1; return ulAutoTick(); }), '', '끈 동안 자동 등록 안 함'); assert.equal(sql('SELECT COUNT(*) AS n FROM decks')[0].n, 0);
    await p.click('.ul-auto [data-a="ulAutoSet"][data-v="1"]'); await p.waitForFunction(() => /자동 참가를 켰습니다/.test(document.body.innerText), null, { timeout: 10000 });
    assert.equal(sql('SELECT COUNT(*) AS n FROM decks')[0].n, 1, '다시 켜면 올림'); assert.equal(sql('SELECT off FROM ladder_reg')[0].off, 0); console.log('자동 참가 끄기·켜기 통과');
    await p.fill('#ulNickIn', '새벽별단장'); await p.click('[data-a="ulNickSave"]'); await p.waitForFunction(() => /닉네임을 새벽별단장/.test(document.body.innerText), null, { timeout: 10000 });
    assert.equal(sql('SELECT nickname FROM players')[0].nickname, '새벽별단장'); assert.equal(await p.evaluate(() => localStorage.getItem('fo-ul-nick')), 'set'); console.log('닉네임 통과');
    await p.click('[data-a="ulAutoNow"]'); await p.waitForFunction(() => /덱을 다시 등록했습니다/.test(document.body.innerText), null, { timeout: 15000 });
    assert.ok(await p.evaluate(() => document.querySelector('[data-a="ulAutoNow"]').disabled && /오늘은 이미 다시 등록했습니다/.test(document.querySelector('[data-a="ulAutoNow"]').innerText)), '하루 1회');
    assert.equal(sql('SELECT auto FROM ladder_reg')[0].auto, 0, '직접 등록 표시'); assert.ok(sql('SELECT man_day FROM ladder_reg')[0].man_day);
    r = await p.evaluate(async () => { const x = await A.ulReg(); return UL.msg; }); assert.match(r, /하루에 한 번/, '덱 화면 직접 등록도 하루 1회');
    console.log('지금 덱으로 다시 등록(하루 1회) 통과');
    const ph = await b.newPage(); await ph.setViewportSize({ width: 390, height: 844 }); ph.on('pageerror', e => errs.push(String(e)));
    await ph.goto(url); await ph.waitForFunction(() => typeof A === 'object' && typeof newGame === 'function', null, { timeout: 30000 });
    const bootUld = () => { DEMO.on = false; newGame(6); fdStart(); fdAdvance(false); let n = 0; while (G.fd && !G.fd.done && n++ < 500) fdAdvance(true); hireMgr(G.mmarket[0].id, 3); G.tut = { done: true, step: 99 }; G.medSet = true; UI.title = false; closeSheets(); A.go('cfg:uld'); };
    await ph.evaluate(bootUld);
    await ph.waitForFunction(() => { const x = document.querySelector('.ul-auto'); if (x && x.offsetHeight > 0) return true; try { if (!G || UI.title) { DEMO.on = false; newGame(6); fdStart(); fdAdvance(false); let n = 0; while (G.fd && !G.fd.done && n++ < 500) fdAdvance(true); hireMgr(G.mmarket[0].id, 3); G.tut = { done: true, step: 99 }; G.medSet = true; UI.title = false; } closeSheets(); A.go('cfg:uld'); } catch (e) {} return false; }, null, { timeout: 60000, polling: 1500 }).catch(async e => { console.log('DBG', await ph.evaluate(() => JSON.stringify({ tab: UI.tab, sub: UI.sub, title: UI.title, g: !!G, n: document.querySelectorAll('.ul-auto').length, t: document.body.innerText.slice(0, 600) }))); throw e; }); f = await ph.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1); assert.ok(f, '휴대폰 설정 › 래더 가로 넘침');
    if (shots) await ph.screenshot({ path: path.join(shots, 'ladder-auto-settings-390.png'), fullPage: true }); console.log('설정 › 래더 휴대폰 390 통과');
    await ph.close();
    /* ===== 2) 관리자 한눈 보기 ===== */
    const DEV = 'a1b2c3d4e5f60718293a4b5c6d7e8f90', P = [];
    for (let i = 0; i < 8; i++) { const j = await call('POST', '/api/v1/player', { nickname: '구단' + i + '#' + String(1000 + i), platform: 'web' }, { ip: '10.3.' + i + '.1' }); P.push({ id: j.player.id, auth: 'Bearer ' + j.token });
      const d = await call('PUT', '/api/v1/ladder/deck', Object.assign({ e: deck({ name: '팀' + i, sal: i === 0 ? 1000 : 300, ovr: { t: 58 + i, p: 60, b: 60 } }), tier: 0 }, i % 3 === 2 ? { man: 1 } : { auto: 1 }, i < 2 ? { dev: DEV } : {}), { auth: P[i].auth, ip: '10.3.' + i + '.1' }); assert.ok(d.ok, JSON.stringify(d)); }
    await call('PUT', '/api/v1/ladder/auto', { on: false }, { auth: P[7].auth, ip: '10.3.7.1' });
    await call('POST', '/api/v1/ladder/live', { key: 'wx.1.live', tier: 0, round: 4, teams: [['팀1', P[1].id, 'me'], ['팀2', P[2].id, 'user'], ['AI 스톰', null, 'ai']], st: [['팀1', 8, 4, 0, 'me'], ['팀2', 6, 6, 0, 'user'], ['AI 스톰', 4, 8, 0, 'ai']] }, { auth: P[1].auth });
    const st10 = n => Array.from({ length: 10 }, (_, i) => [i === 0 ? n : 'AI ' + i, 18 - i, 9 + i, 0, i === 0 ? 'me' : 'ai']);
    await call('POST', '/api/v1/ladder/result', { key: 'lg-ok-1', rank: 1, teams: 10, w: 18, l: 9, d: 0, opps: [], ps: 'c', st: st10('팀3'), champ: '팀3', runner: 'AI 2' }, { auth: P[3].auth });
    await call('POST', '/api/v1/ladder/result', { key: 'lg-bad-1', rank: 1, teams: 10, w: 27, l: 0, d: 0, opps: [], ps: 'c', st: [['팀4', 20, 7, 0, 'me']], champ: '팀4', runner: 'AI 3' }, { auth: P[4].auth });
    await call('POST', '/api/v1/ladder/result', { key: 'lg-bad-2', rank: 1, teams: 10, w: 26, l: 1, d: 0, opps: [], ps: 'c' }, { auth: P[4].auth });
    const open = async (w, h) => { const ctx = await b.newContext({ viewport: { width: w, height: h } }); const q = await ctx.newPage(); q.on('pageerror', e => errs.push(String(e))); q.on('dialog', d => d.accept());
      await q.addInitScript(() => { try { localStorage.setItem('fo-cup-admin', 'test-admin'); } catch (e) {} }); await q.goto(url);
      await q.waitForFunction(() => typeof A === 'object' && typeof ADM === 'object', null, { timeout: 30000 });
      await q.evaluate(() => { ADM.chk = ''; admCheck(); }); await q.waitForFunction(() => ADM.chk === 'ok', null, { timeout: 30000 });
      await q.waitForFunction(() => { if (document.querySelector('[data-a="admTab"][data-v="ld"]')) return true; try { A.admOpen(); } catch (e) {} return false; }, null, { timeout: 30000, polling: 700 }); await q.click('[data-a="admTab"][data-v="ld"]');
      await q.waitForFunction(() => LDA.st === 'd1' && LDB.dash && document.querySelector('.ldb-reg .ldb-kpi'), null, { timeout: 15000 }); return q; };
    const q = await open(1440, 900);
    t = await q.evaluate(() => document.querySelector('.ldax').innerText);
    for (const k of ['등록 현황', '이상 감지', '리그 상황', '시즌 판', '덱 목록', '참여도', '서버 사용량']) assert.ok(t.includes(k), k + ' 칸');
    const D = await q.evaluate(() => LDB.dash); assert.equal(D.reg.total, 8, '등록 덱(게임 1 + 씨앗 7)'); assert.equal(D.reg.off, 1); assert.equal(D.reg.over, 1); assert.ok(D.reg.manual >= 3);
    assert.match(t, /결과 불일치/); assert.match(t, /비정상 승률/); assert.match(t, /같은 기기에서 여러 덱[\s\S]*2덱/); assert.match(t, /4\/9R/); assert.match(t, /우승 팀3/); assert.match(t, /일 남음/);
    f = await fit(q); assert.equal(f.y, 0, 'PC 1440 관리자 페이지 스크롤'); assert.ok(f.sw);
    if (shots) await q.screenshot({ path: path.join(shots, 'ladder-dash-1440.png') });
    /* 끝난 리그 눌러서 순위표 */ const id = D.recent.find(x => x.lkey === 'lg-ok-1').id; await q.click(`[data-a="ldbLg"][data-v="${id}"]`); await q.waitForSelector('[data-ldb-lg] table');
    assert.equal(await q.evaluate(() => document.querySelectorAll('[data-ldb-lg] tbody tr').length), 10); await q.click('[data-a="ldbLgClose"]');
    await q.click(`[data-a="ldbLive"][data-v="${P[1].id}"]`); await q.waitForFunction(() => /진행 중 4\/9라운드/.test((document.querySelector('[data-ldb-lg]') || {}).innerText || ''), null, { timeout: 10000 }); console.log('리그 들여다보기 통과');
    /* 덱 목록: 검색·단계·진행 중 리그·숨기기 */
    await q.fill('#ldbQ', '팀2'); await q.click('[data-a="ldbFind"]'); await q.waitForFunction(() => LDB.decks && LDB.decks.decks.length === 1, null, { timeout: 10000 });
    t = await q.evaluate(() => document.querySelector('.ldb-decks').innerText); assert.match(t, /팀2/); assert.match(t, /진행 중 리그 1/); assert.match(t, /직접/);
    await q.fill('#ldbQ', ''); await q.selectOption('#ldbTier', '1'); await q.click('[data-a="ldbFind"]'); await q.waitForFunction(() => LDB.decks && LDB.decks.decks.every(x => x.tier === 1) && LDB.decks.decks.length >= 1, null, { timeout: 10000 });
    await q.selectOption('#ldbTier', 'all'); await q.click('[data-a="ldbFind"]'); await q.waitForFunction(() => LDB.decks && LDB.decks.total === 8, null, { timeout: 10000 });
    const hp = P[5].id; await q.click(`.ldb-decks [data-a="ldaDkHide"][data-v="${hp}"]`); await q.waitForFunction(pid => /숨겼습니다/.test(document.body.innerText) && LDB.decks.decks.find(x => x.pid === pid).hidden === 1, hp, { timeout: 10000 });
    assert.equal(sql('SELECT hidden FROM players WHERE id = ?', hp)[0].hidden, 1); console.log('덱 목록 검색·단계·숨기기 통과');
    /* 30초 새로고침(시계를 당겨 확인) */ await call('PUT', '/api/v1/ladder/auto', { on: false }, { auth: P[6].auth });
    await q.evaluate(() => { document.activeElement && document.activeElement.blur && document.activeElement.blur(); LDA.at = Date.now() - 31e3; });
    await q.waitForFunction(() => LDB.dash && LDB.dash.reg.off === 2 && Date.now() - LDA.at < 10e3, null, { timeout: 15000 }); console.log('30초 새로고침 통과');
    const q2 = await open(1366, 768); f = await fit(q2); assert.equal(f.y, 0, 'PC 1366 관리자 페이지 스크롤'); assert.ok(f.sw);
    { const R = await q2.evaluate(() => ({ ih: innerHeight, c: [...document.querySelectorAll('.ldax>.setc')].map(c => [Math.round(c.getBoundingClientRect().top), Math.round(c.getBoundingClientRect().bottom), c.scrollHeight, c.clientHeight, getComputedStyle(c).overflowY]), x: (() => { const o = []; for (let e = document.querySelector('.ldax'); e; e = e.parentElement) { const r = e.getBoundingClientRect(); o.push([e.tagName + '.' + String(e.className).slice(0, 30), Math.round(r.top), Math.round(r.bottom), e.scrollHeight, e.clientHeight, getComputedStyle(e).overflowY, getComputedStyle(e).display]); } return o; })() }));
      assert.ok(R.c.every(c => c[1] <= R.ih + 1 && (c[2] <= c[3] + 1 || c[4] === 'auto')), '칸이 화면 안(칸 안 스크롤) ' + JSON.stringify(R)); }
    const q3 = await open(390, 844); assert.ok(await q3.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '휴대폰 390 관리자 가로 넘침');
    if (shots) await q3.screenshot({ path: path.join(shots, 'ladder-dash-390.png'), fullPage: true }); console.log('관리자 PC 1366·휴대폰 390 통과');
    assert.deepEqual(errs, [], '페이지 오류');
  } finally { if (b) await b.close(); server.close(); }
  console.log('래더 자동 등록·관리자 한눈 보기 화면 점검 통과');
})().catch(e => { console.error(e); process.exit(1); });
