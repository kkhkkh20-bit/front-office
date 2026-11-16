/* 프런트컵 화면 점검: 실제 Worker 코드(worker/index.js)를 가짜 KV로 띄워 신청 → 내 신청 상태 → 참가 파일 저장 → 앨범 저장 → 대회 경기 보기(주최자가 올린 기록, 차전별 지연 받기) → PC 한 화면
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
    /* 대회 경기 보기: 주최자가 올린 기록(시리즈 요약 + 차전별 기록)을 받아 그대로 보여 준다. 차전 기록은 고를 때만 받는다 */
    const recs = await p.evaluate(() => { const a = cupEntryNow({ name: '와이' }), b = cupEntryNow({ tid: (G.user + 1) % 10, name: '제이지' }); const r = cupMatch(a, b, { cup: 'cup1', round: 'L4', match: 'L4-2', best: 3, all: 1, tie: 1, home: [1, 0, 1], ri: [9, 9] });
      return { idx: { v: 2, id: 'cup1-L4-2', title: '리그 4라운드', a: '와이 2026', b: '제이지 2026', g: r.games.map(g => [g.sa, g.sb, g.inn, g.walk ? 1 : 0]) }, games: r.games.map((g, i) => ({ v: 2, id: 'cup1-L4-2-g' + (i + 1), sa: g.sa, sb: g.sb, log: g.log, bat: g.bat, pit: g.pit, line: g.line })) }; });
    await kv.put('cupG:cup1-L4-2', JSON.stringify(recs.idx)); for (const g of recs.games) await kv.put('cupG:' + g.id, JSON.stringify(g));
    const seen = []; p.on('request', q => { if (q.url().includes('/api/cup/game/')) seen.push(q.url().split('/api/cup/game/')[1]); });
    await p.fill('#cupGame', 'cup1-L4-2'); await p.click('[data-a="cupWatch"]'); await p.waitForFunction(() => document.querySelectorAll('[data-a="cupVG"]').length === 3 && document.querySelector('.cup-pre'), null, { timeout: 30000 });
    assert.equal(await p.evaluate(() => document.querySelector('.cup-pre').innerText.split('\n')[0]), recs.games[0].log.split('\n')[0]); assert.deepEqual(seen, ['cup1-L4-2', 'cup1-L4-2-g1'], '차전 기록을 미리 다 받음 ' + seen);
    await p.click('[data-a="cupVG"][data-v="2"]'); await p.click('[data-a="cupVT"][data-v="line"]'); await p.waitForFunction(t => document.querySelector('.cup-pre') && document.querySelector('.cup-pre').innerText.trim() === t.trim(), recs.games[2].line, { timeout: 20000 });
    assert.deepEqual(seen, ['cup1-L4-2', 'cup1-L4-2-g1', 'cup1-L4-2-g3']); console.log('대회 경기 보기(올린 기록 그대로·차전별 지연 받기) 통과');
    const fit = await p.evaluate(() => { window.scrollTo(0, 9999); return { scroll: scrollY, h: document.documentElement.scrollHeight, v: innerHeight }; }); assert.ok(fit.scroll === 0 && fit.h <= fit.v + 2, 'PC 화면이 통째로 스크롤됨 ' + JSON.stringify(fit)); console.log('PC 한 화면 통과');
    if (process.env.SHOT) await p.screenshot({ path: process.env.SHOT });
    /* 프런트컵 명예의 전당: 서버 공개 결과 → 설정 › 정보 · 처음 화면 메뉴. 연결이 끊겨도 이 기기에 남은 결과 */
    const ros = [{ pos: 'SS', n: '김유격', o: 70 }, { pos: '선발1', n: '박에이스', o: 80 }];
    const deck = await p.evaluate(() => { const e = cupEntryNow({ name: '새벽별' }); delete e.wid; return e; });
    const hall = { v: 1, cups: [{ id: 'cup1', title: '제1회 프런트컵', format: 'league', date: '2026-12-06', n: 7, ai: 3, champ: { name: '새벽별', year: 2027, ovr: deck.ovr, wh: 'deadbeef', roster: ros, deck }, runner: { name: 'AI 하운즈', year: 2026, ai: true, ovr: { t: 65, p: 69, b: 62 }, wh: null, roster: ros },
      stand: [{ rank: 1, name: '새벽별 2027', w: 20, l: 7, t: 0, pct: '.741' }, { rank: 2, name: 'AI 하운즈', ai: true, w: 14, l: 12, t: 1, pct: '.538' }], post: [{ id: 'KS', name: '한국시리즈', a: '새벽별 2027', b: 'AI 하운즈', w: [4, 2], win: '새벽별 2027' }], titles: [{ k: '타율', name: '이연우', team: '미르 2026', v: '.383' }] }] };
    await kv.put('cup:results', JSON.stringify(hall));
    await p.evaluate(() => { HOF.st = ''; HOF.data = null; A.go('cfg:set'); }); await p.waitForFunction(() => /프런트컵 명예의 전당/.test(document.body.innerText), null, { timeout: 20000 });
    await p.evaluate(() => { const d = [...document.querySelectorAll('details.mfold')].find(x => /프런트컵 명예의 전당/.test(x.querySelector('summary').innerText)); d.open = true; });
    await p.waitForFunction(() => /우승 단장 새벽별 2027/.test(document.querySelector('.cuphof').innerText), null, { timeout: 20000 }); console.log('설정 명예의 전당 통과');
    /* 처음 화면(게임을 열지 않은 새 탭) → 메뉴 → 명예의 전당. 서버를 끊어도 남은 결과를 보여 준다 */
    const p2 = await b.newPage(); await p2.setViewportSize({ width: 390, height: 844 }); p2.on('pageerror', e => errs.push(String(e))); await p2.goto(url);
    await p2.click('[data-a="tsGo"][data-v="cuphof"]'); await p2.waitForFunction(() => /우승 단장 새벽별 2027/.test(document.body.innerText) && /준우승 AI 하운즈/.test(document.body.innerText) && document.querySelector('.hof-badge'), null, { timeout: 20000 });
    await p2.click('.cuphof .hof-win .hof-d summary'); const dk = await p2.evaluate(() => { const d = document.querySelector('.cuphof .hof-win .dk'); return { t: d.innerText, rows: d.querySelectorAll('.dk-r').length, faces: d.querySelectorAll('img.dk-f').length }; });
    assert.match(dk.t, /OVR 총 \d+ \| 투 \d+ \| 타 \d+/); assert.match(dk.t, /선발1/); assert.match(dk.t, /마무리/); assert.ok(dk.rows >= 9 + 5 + 5, '덱 줄 수 ' + dk.rows); assert.ok(await p2.evaluate(() => !!localStorage.getItem('fo-cup-hof')));
    await p2.click('[data-a="cupDeckGet"]'); const got = await p2.evaluate(() => JSON.parse(localStorage.getItem('fo-ul-decks') || '[]')); assert.equal(got.length, 1); assert.equal(got[0].ro, 1); assert.equal(got[0].name, '새벽별'); assert.ok(!got[0].e.wid);
    await p2.waitForFunction(() => /가져온 덱에 있습니다/.test(document.body.innerText), null, { timeout: 5000 }); console.log(`우승 덱 보기(${dk.rows}줄, 얼굴 ${dk.faces}장)·이 덱 가져오기 통과`);
    const sw = await p2.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1); assert.ok(sw, '휴대폰 폭에서 가로 스크롤'); console.log('처음 화면 명예의 전당 통과');
    await p2.route('**/api/cup/results', r => r.abort()); await p2.reload(); await p2.click('[data-a="tsGo"][data-v="cuphof"]');
    await p2.waitForFunction(() => /마지막으로 받은 결과/.test(document.body.innerText) && /우승 단장 새벽별 2027/.test(document.body.innerText), null, { timeout: 20000 }); console.log('연결 끊김 때 남은 결과 통과');
    /* 관리자 페이지: 설정 맨 아래 '관리자' → 틀린 키는 거절 → 맞는 키 → 대회 열기 → 참가 파일 올리기 → 돌리기 → 1~7일차 공개 → 명예의 전당 등록 */
    await p.evaluate(() => { A.go('cfg:set'); }); await p.click('[data-a="admAsk"]'); await p.fill('#admKey', 'wrong-key'); await p.click('[data-a="admKeyOk"]');
    await p.waitForFunction(() => /키가 맞지 않습니다/.test(document.body.innerText), null, { timeout: 10000 }); assert.equal(await p.evaluate(() => !!document.querySelector('[data-a="admOpen"]')), false, '틀린 키인데 관리자 메뉴');
    await p.fill('#admKey', 'test-admin'); await p.click('[data-a="admKeyOk"]'); await p.waitForSelector('[data-a="admOpen"]', { timeout: 10000 }); await p.click('[data-a="admOpen"]');
    await p.waitForSelector('#admId', { timeout: 10000 }); await p.fill('#admId', 'cup2'); await p.fill('#admTitle', '제2회 프런트컵'); await p.fill('#admDl', '2099-12-31 21:00'); await p.click('[data-a="admCfg"][data-v="open"]');
    await p.waitForFunction(() => /접수를 열었습니다/.test(document.body.innerText), null, { timeout: 10000 }); const cfg2 = JSON.parse(m.get('cup:cfg').v); assert.equal(cfg2.id, 'cup2'); assert.equal(cfg2.open, true); assert.equal(cfg2.format, 'league');
    const fp = path.join(require('node:os').tmpdir(), 'cup-entry-test.json'); fs.writeFileSync(fp, JSON.stringify(fe)); await p.setInputFiles('#admFiles', fp); await p.click('[data-a="admFile"]');
    await p.waitForFunction(() => /참가 파일 1개를 올렸습니다/.test(document.body.innerText) && document.querySelectorAll('.adm-e').length === 1, null, { timeout: 20000 }); console.log('관리자: 키 확인·대회 열기·참가 파일 올리기 통과');
    await p.click('[data-a="admCfg"][data-v="close"]'); await p.waitForFunction(() => /접수는 닫혀/.test(document.body.innerText), null, { timeout: 10000 });
    const t0 = Date.now(); await p.click('[data-a="admRun"]'); await p.waitForFunction(() => /다 돌렸습니다/.test(document.body.innerText), null, { timeout: 600000 });
    const run = JSON.parse(m.get('cupRun:cup2').v); assert.equal(run.seeds.length, 10); assert.equal(run.series.filter(x => x.kind === 'L').length, 45); assert.ok(run.champ && run.runner); assert.ok(!m.has('cup:pub'), '돌리기만 했는데 공개됨');
    console.log(`관리자: 리그+가을야구 돌리기 ${Math.round((Date.now() - t0) / 1000)}초, 결과 ${Math.round(m.get('cupRun:cup2').v.length / 1024)}KB 통과`);
    const fit2 = await p.evaluate(() => { window.scrollTo(0, 9999); return { scroll: scrollY, h: document.documentElement.scrollHeight, v: innerHeight }; }); assert.ok(fit2.scroll === 0 && fit2.h <= fit2.v + 2, '관리자 PC 화면이 통째로 스크롤됨 ' + JSON.stringify(fit2));
    for (let d = 1; d <= 7; d++) { await p.click(`[data-a="admPub"][data-v="${d}"]`); await p.waitForFunction(d => /공개했습니다/.test(document.body.innerText) && document.querySelectorAll('.adm-day.on').length === d, d, { timeout: 60000 }); }
    const pub = JSON.parse(m.get('cup:pub').v); assert.equal(pub.day, 7); assert.equal(pub.days.length, 7); assert.ok(pub.champ); assert.ok(m.has('cupG:cup2-KS') && m.has('cupG:cup2-L1-1-g3'), '경기 기록이 올라가지 않음');
    const [png] = await Promise.all([p.waitForEvent('download'), p.click('[data-a="admPng"][data-v="stand"]')]); assert.match(png.suggestedFilename(), /^frontcup-cup2-stand\.png$/);
    await p.fill('#admGm', '김단장'); await p.click('[data-a="admHof"]'); await p.waitForFunction(() => /명예의 전당에 올렸습니다/.test(document.body.innerText), null, { timeout: 20000 });
    const H2 = JSON.parse(m.get('cup:results').v), c2 = H2.cups.find(c => c.id === 'cup2'); assert.equal(c2.champ.gm, '김단장'); assert.ok(c2.champ.deck && c2.champ.deck.P.length >= 20 && !c2.champ.deck.wid); assert.ok(H2.cups.some(c => c.id === 'cup1'), '지난 회차가 사라짐');
    if (process.env.SHOT_ADMIN) await p.screenshot({ path: process.env.SHOT_ADMIN });
    await p.evaluate(() => { CUP.pubSt = ''; CUP.pub = null; A.go('club:cup'); }); await p.waitForFunction(() => document.querySelector('.cup-pub') && /우승/.test(document.querySelector('.cup-pub').innerText), null, { timeout: 20000 });
    console.log('관리자: 1~7일차 연재 공개·게임 화면 반영·그림 저장·명예의 전당 등록 통과');
    assert.deepEqual(errs, []);
  } catch (e) { try { const ps = b.contexts().flatMap(c => c.pages()); console.error('화면 알림: ' + await ps[0].evaluate(() => [...document.querySelectorAll('.note')].map(x => x.innerText).join(' / '))); } catch (x) {} throw e; } finally { await b?.close(); server.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
process.on('exit', () => {});
