/* 프런트컵 화면 점검: 실제 Worker 코드(worker/index.js)를 가짜 KV로 띄워 신청 → 내 신청 상태 → 참가 파일 저장 → 앨범 저장 → 대회 경기 보기(같은 경기 재현, 리그 연전) → PC 한 화면
   → 설정 › 정보·처음 화면의 프런트컵 명예의 전당(서버 결과, 연결이 끊기면 이 기기에 남은 결과).
 사용: bash build.sh 후 node tools/check-cup-ui.cjs (CHROMIUM_EXECUTABLE_PATH 필요할 수 있음) */
const assert = require('node:assert/strict'), path = require('node:path'), http = require('node:http'), fs = require('node:fs');
const { chromium } = require('playwright');
(async () => {
  const { handle } = await import(path.resolve(__dirname, '../worker/index.js'));
  const m = new Map(), kv = { async get(k) { return m.has(k) ? m.get(k).v : null; }, async getWithMetadata(k) { const e = m.get(k); return { value: e ? e.v : null, metadata: e ? e.meta : null }; },
    async put(k, v, o = {}) { m.set(k, { v: String(v), meta: o.metadata || null }); }, async delete(k) { m.delete(k); }, async list({ prefix }) { return { keys: [...m.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name, metadata: m.get(name).meta })), list_complete: true }; } };
  const env = { SAVE_KV: kv, CUP_ADMIN: 'test-admin' }, html = fs.readFileSync(path.resolve(__dirname, '../index.html'));
  const server = http.createServer(async (q, r) => {
    if (q.url === '/') { r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return r.end(html); }
    if (!q.url.startsWith('/api/')) { r.writeHead(404); return r.end(); }
    const body = await new Promise(ok => { const c = []; q.on('data', x => c.push(x)); q.on('end', () => ok(Buffer.concat(c))); });
    const origin = 'http://' + q.headers.host, h = Object.assign({}, q.headers); const res = await handle(new Request(origin + q.url, { method: q.method, headers: h, body: ['GET', 'HEAD'].includes(q.method) ? undefined : body }), env, Date.now());
    r.writeHead(res.status, Object.fromEntries(res.headers)); r.end(Buffer.from(await res.arrayBuffer()));
  });
  await new Promise(ok => server.listen(0, '127.0.0.1', ok)); const url = `http://127.0.0.1:${server.address().port}/`;
  await kv.put('cup:cfg', JSON.stringify({ id: 'cup1', title: '제1회 프런트컵', deadline: '2099-12-31 21:00', size: 32 }));
  let b; try {
    b = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || '/usr/bin/chromium' }); const p = await b.newPage(); await p.setViewportSize({ width: 1280, height: 720 });
    const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto(url); await p.evaluate(() => { DEMO.on = false; newGame(6); fdStart(); fdAdvance(false); let n = 0; while (G.fd && !G.fd.done && n++ < 500) fdAdvance(true); hireMgr(G.mmarket[0].id, 3); G.tut = { done: true, step: 99 }; G.medSet = true; UI.title = false; A.go('club:cup'); });
    await p.waitForSelector('[data-a="cupApply"]', { timeout: 20000 });
    await p.fill('#cupName', '와이'); await p.click('[data-a="cupApply"]'); await p.waitForFunction(() => /신청했습니다/.test(document.body.innerText), null, { timeout: 30000 });
    const my = await p.evaluate(() => document.querySelector('.cup-my').innerText); assert.match(my, /내 신청: 와이 \d{4} · OVR \d+\|\d+ \d+/, my);
    const stored = JSON.parse([...m.entries()].find(([k]) => k.startsWith('cupE:cup1:'))[1].v); assert.equal(stored.name, '와이'); assert.ok(stored.P.length >= 24);
    console.log(`신청 통과: ${stored.P.length}명, 사진 ${stored.P.filter(x => x.f).length}장, 본문 ${Math.round(JSON.stringify(stored).length / 1024)}KB`);
    await p.click('[data-a="cupApply"]'); await p.waitForFunction(() => /하루에 한 번/.test(document.body.innerText), null, { timeout: 20000 }); console.log('하루 1회 통과');
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-a="cupFileNow"]')]); const fe = JSON.parse(fs.readFileSync(await dl.path(), 'utf8'));
    assert.match(dl.suggestedFilename(), /^frontcup-cup1-\d{4}-[0-9a-f]{6}\.json$/); assert.equal(fe.kind, 'cup-entry'); assert.equal(fe.cup, 'cup1'); assert.ok(/^w[0-9a-f]{16}$/.test(fe.wid)); console.log('참가 파일 저장 통과: ' + dl.suggestedFilename());
    await p.click('[data-a="cupAlbSave"]'); assert.equal(await p.evaluate(() => G.cupAlb.length), 1); console.log('앨범 저장 통과');
    /* 대회 경기 보기: 같은 엔트리로 만든 경기 묶음을 서버에 올리고, 번호로 다시 돌린다 */
    const pk = await p.evaluate(() => { const a = cupEntryNow({ name: '와이' }), b = cupEntryNow({ tid: (G.user + 1) % 10, name: '제이지' }); const o = { cup: 'cup1', round: 'R32', match: 'R1M1', best: 1 }; const r = cupMatch(a, b, o); return { v: 1, id: 'cup1-R1M1', a, b, o, sum: r.games.map(g => [g.sa, g.sb]) }; });
    await kv.put('cupG:cup1-R1M1', JSON.stringify(pk));
    await p.fill('#cupGame', 'cup1-R1M1'); await p.click('[data-a="cupWatch"]'); await p.waitForFunction(() => /주최자 결과와 같은 경기/.test(document.body.innerText), null, { timeout: 30000 });
    const pre = await p.evaluate(() => document.querySelector('.cup-pre').innerText); assert.match(pre, /^\[1회초\]/); console.log('경기 다시 보기 통과');
    /* 리그 연전(3경기, 무승부 허용, 선발 순번 이어 가기)도 같은 번호로 다시 돌린다 */
    const pk2 = await p.evaluate(() => { const a = cupEntryNow({ name: '와이' }), b = cupEntryNow({ tid: (G.user + 1) % 10, name: '제이지' }); const o = { cup: 'cup1', round: 'L4', match: 'L4-2', best: 3, all: 1, tie: 1, home: [1, 0, 1], ri: [9, 9] }; const r = cupMatch(a, b, o); return { v: 1, id: 'cup1-L4-2', a, b, o, sum: r.games.map(g => [g.sa, g.sb]) }; });
    await kv.put('cupG:cup1-L4-2', JSON.stringify(pk2)); await p.evaluate(() => { CUP.view = null; CUP.msg = ''; render(); });
    await p.fill('#cupGame', 'cup1-L4-2'); await p.click('[data-a="cupWatch"]'); await p.waitForFunction(() => /주최자 결과와 같은 경기/.test(document.body.innerText) && document.querySelectorAll('[data-a="cupVG"]').length === 3, null, { timeout: 30000 }); console.log('리그 연전 다시 보기 통과');
    const fit = await p.evaluate(() => { window.scrollTo(0, 9999); return { scroll: scrollY, h: document.documentElement.scrollHeight, v: innerHeight }; }); assert.ok(fit.scroll === 0 && fit.h <= fit.v + 2, 'PC 화면이 통째로 스크롤됨 ' + JSON.stringify(fit)); console.log('PC 한 화면 통과');
    if (process.env.SHOT) await p.screenshot({ path: process.env.SHOT });
    /* 프런트컵 명예의 전당: 서버 공개 결과 → 설정 › 정보 · 처음 화면 메뉴. 연결이 끊겨도 이 기기에 남은 결과 */
    const ros = [{ pos: 'SS', n: '김유격', o: 70 }, { pos: '선발1', n: '박에이스', o: 80 }];
    const hall = { v: 1, cups: [{ id: 'cup1', title: '제1회 프런트컵', format: 'league', date: '2026-12-06', n: 7, ai: 3, champ: { name: '새벽별', year: 2027, ovr: { t: 65, p: 66, b: 65 }, wh: 'deadbeef', roster: ros }, runner: { name: 'AI 하운즈', year: 2026, ai: true, ovr: { t: 65, p: 69, b: 62 }, wh: null, roster: ros },
      stand: [{ rank: 1, name: '새벽별 2027', w: 20, l: 7, t: 0, pct: '.741' }, { rank: 2, name: 'AI 하운즈', ai: true, w: 14, l: 12, t: 1, pct: '.538' }], post: [{ id: 'KS', name: '한국시리즈', a: '새벽별 2027', b: 'AI 하운즈', w: [4, 2], win: '새벽별 2027' }], titles: [{ k: '타율', name: '이연우', team: '미르 2026', v: '.383' }] }] };
    await kv.put('cup:results', JSON.stringify(hall));
    await p.evaluate(() => { HOF.st = ''; HOF.data = null; A.go('cfg:set'); }); await p.waitForFunction(() => /프런트컵 명예의 전당/.test(document.body.innerText), null, { timeout: 20000 });
    await p.evaluate(() => { const d = [...document.querySelectorAll('details.mfold')].find(x => /프런트컵 명예의 전당/.test(x.querySelector('summary').innerText)); d.open = true; });
    await p.waitForFunction(() => /우승 새벽별 2027/.test(document.querySelector('.cuphof').innerText), null, { timeout: 20000 }); console.log('설정 명예의 전당 통과');
    /* 처음 화면(게임을 열지 않은 새 탭) → 메뉴 → 명예의 전당. 서버를 끊어도 남은 결과를 보여 준다 */
    const p2 = await b.newPage(); await p2.setViewportSize({ width: 390, height: 844 }); p2.on('pageerror', e => errs.push(String(e))); await p2.goto(url);
    await p2.click('[data-a="tsGo"][data-v="cuphof"]'); await p2.waitForFunction(() => /우승 새벽별 2027/.test(document.body.innerText) && /준우승 AI 하운즈/.test(document.body.innerText), null, { timeout: 20000 });
    await p2.click('.cuphof .hof-d summary'); assert.match(await p2.evaluate(() => document.querySelector('.cuphof .hof-ros').innerText), /SS 김유격 70/); assert.ok(await p2.evaluate(() => !!localStorage.getItem('fo-cup-hof')));
    const sw = await p2.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1); assert.ok(sw, '휴대폰 폭에서 가로 스크롤'); console.log('처음 화면 명예의 전당 통과');
    await p2.route('**/api/cup/results', r => r.abort()); await p2.reload(); await p2.click('[data-a="tsGo"][data-v="cuphof"]');
    await p2.waitForFunction(() => /마지막으로 받은 결과/.test(document.body.innerText) && /우승 새벽별 2027/.test(document.body.innerText), null, { timeout: 20000 }); console.log('연결 끊김 때 남은 결과 통과');
    assert.deepEqual(errs, []);
  } finally { await b?.close(); server.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
