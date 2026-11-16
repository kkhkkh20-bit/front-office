/* 프런트컵 화면 점검: 실제 Worker 코드(worker/index.js)를 가짜 KV로 띄워 신청 → 내 신청 상태 → 앨범 저장 → 대회 경기 보기(같은 경기 재현) → PC 한 화면.
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
    await p.click('[data-a="cupAlbSave"]'); assert.equal(await p.evaluate(() => G.cupAlb.length), 1); console.log('앨범 저장 통과');
    /* 대회 경기 보기: 같은 엔트리로 만든 경기 묶음을 서버에 올리고, 번호로 다시 돌린다 */
    const pk = await p.evaluate(() => { const a = cupEntryNow({ name: '와이' }), b = cupEntryNow({ tid: (G.user + 1) % 10, name: '제이지' }); const o = { cup: 'cup1', round: 'R32', match: 'R1M1', best: 1 }; const r = cupMatch(a, b, o); return { v: 1, id: 'cup1-R1M1', a, b, o, sum: r.games.map(g => [g.sa, g.sb]) }; });
    await kv.put('cupG:cup1-R1M1', JSON.stringify(pk));
    await p.fill('#cupGame', 'cup1-R1M1'); await p.click('[data-a="cupWatch"]'); await p.waitForFunction(() => /주최자 결과와 같은 경기/.test(document.body.innerText), null, { timeout: 30000 });
    const pre = await p.evaluate(() => document.querySelector('.cup-pre').innerText); assert.match(pre, /^\[1회초\]/); console.log('경기 다시 보기 통과');
    const fit = await p.evaluate(() => { window.scrollTo(0, 9999); return { scroll: scrollY, h: document.documentElement.scrollHeight, v: innerHeight }; }); assert.ok(fit.scroll === 0 && fit.h <= fit.v + 2, 'PC 화면이 통째로 스크롤됨 ' + JSON.stringify(fit)); console.log('PC 한 화면 통과');
    if (process.env.SHOT) await p.screenshot({ path: process.env.SHOT });
    assert.deepEqual(errs, []);
  } finally { await b?.close(); server.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
