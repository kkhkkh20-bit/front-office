/* 래더 3연전 리그 화면 점검(사용자 11-18): 실제 Worker(worker/index.js)를 가짜 D1(node:sqlite)로 띄우고
   덱 등록 → 리그 시작(예상 순위) → '다음 3연전'으로 한 라운드씩(순위표·소식·박스·팀 기록·개인 순위·팀 페이지) → 정규 끝(대진) → 시리즈 하나씩 → 결과(포스트시즌·시상·예상 대비 실제)
   → 끝난 리그 다시 보기(박스) → 서버 기록 줄(ladder_teams·ladder_lines) → 기록실 탭(순위표·우승 벽)·로비 알림 띠.
   PC 1366×768·1600×900은 페이지가 통째로 스크롤되지 않고, 휴대폰 390은 가로로 넘치지 않는다.
 사용: bash build.sh 후 node tools/check-ladder-series.cjs (CHROMIUM_EXECUTABLE_PATH 필요할 수 있음). SHOT=경로 접두어면 그림. 노드 22.5 미만(node:sqlite 없음)이면 건너뛴다 */
const assert = require('node:assert/strict'), path = require('node:path'), http = require('node:http'), fs = require('node:fs');
const { makeD1, hasSqlite } = require('./lib/d1-shim.cjs');
if (!hasSqlite) { console.log('래더 3연전 화면 점검 건너뜀: node:sqlite 없음'); process.exit(0); }
const { chromium } = require('playwright');
(async () => {
  const { handle } = await import(path.resolve(__dirname, '../worker/index.js'));
  const m = new Map(), kv = { async get(k) { return m.has(k) ? m.get(k).v : null; }, async getWithMetadata(k) { const e = m.get(k); return { value: e ? e.v : null, metadata: e ? e.meta : null }; },
    async put(k, v, o = {}) { m.set(k, { v: String(v), meta: o.metadata || null }); }, async delete(k) { m.delete(k); }, async list({ prefix }) { return { keys: [...m.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name, metadata: m.get(name).meta })), list_complete: true }; } };
  const DB = makeD1(), env = { SAVE_KV: kv, CUP_ADMIN: 'test-admin', DB }, html = fs.readFileSync(path.resolve(__dirname, '../index.html')), sql = (q, ...a) => DB._sqlite.prepare(q).all(...a);
  let recReads = 0;
  const server = http.createServer(async (q, r) => {
    if (q.url === '/') { r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return r.end(html); }
    if (!q.url.startsWith('/api/')) { r.writeHead(404); return r.end(); }
    if (q.url.startsWith('/api/v1/ladder/records')) recReads++;
    const body = await new Promise(ok => { const c = []; q.on('data', x => c.push(x)); q.on('end', () => ok(Buffer.concat(c))); });
    const res = await handle(new Request('http://' + q.headers.host + q.url, { method: q.method, headers: q.headers, body: ['GET', 'HEAD'].includes(q.method) ? undefined : body }), env, Date.now());
    r.writeHead(res.status, Object.fromEntries(res.headers)); r.end(Buffer.from(await res.arrayBuffer()));
  });
  await new Promise(ok => server.listen(0, '127.0.0.1', ok)); const url = `http://127.0.0.1:${server.address().port}/`;
  assert.equal((await (await handle(new Request('http://seed.local/api/v1/admin/migrate', { method: 'POST', headers: { Authorization: 'Bearer test-admin' } }), env, Date.now())).json()).ok, true);
  const shot = process.env.SHOT; let b;
  try {
    b = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || '/usr/bin/chromium' }); const p = await b.newPage(); await p.setViewportSize({ width: 1366, height: 768 });
    const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('dialog', d => d.accept());
    await p.route('https://fonts.googleapis.com/**', r => r.fulfill({ body: '', contentType: 'text/css' })); await p.goto(url);await p.waitForFunction(()=>performance.getEntriesByName('fronttime-menu-ready').length>0); await p.waitForFunction(() => typeof newGame === 'function', null, { timeout: 60000 }); await p.waitForTimeout(1500); await p.evaluate(() => { DEMO.on = false; newGame(6); fdStart(); fdAdvance(false); let n = 0; while (G.fd && !G.fd.done && n++ < 500) fdAdvance(true); hireMgr(G.mmarket[0].id, 3); G.tut = { done: true, step: 99 }; G.medSet = true; UI.title = false; A.go('uld:deck'); });
    const fit = async (lab) => { const f = await p.evaluate(() => { window.scrollTo(0, 9999); return { scroll: scrollY, h: document.documentElement.scrollHeight, v: innerHeight, w: document.documentElement.scrollWidth, iw: innerWidth }; }); assert.ok(f.scroll === 0 && f.h <= f.v + 2 && f.w <= f.iw + 1, lab + ' 페이지가 통째로 스크롤됨 ' + JSON.stringify(f)); };
    const wait = (f, a, t) => p.waitForFunction(f, a, { timeout: t || 60000 });
    await p.waitForSelector('#ulName', { timeout: 20000 }).catch(async e => { console.log('DBG0', await p.evaluate(() => JSON.stringify({ tab: UI.tab, sub: UI.sub && UI.sub.uld, t: document.body.innerText.slice(0, 600) })), errs); throw e; }); await p.fill('#ulName', '와이'); await p.click('[data-a="ulReg"]'); await wait(() => /덱을 등록했습니다/.test(document.body.innerText), null, 30000);
    assert.equal(await p.evaluate(() => UL.v1), 'ok', '서버 v1');
    await p.evaluate(() => A.ulGoPg('league')); await p.waitForTimeout(300); await p.click('[data-a="ulStart"]'); await wait(() => /리그를 시작했습니다/.test(document.body.innerText));
    { const t = await p.evaluate(() => document.querySelector('.ul-lg').innerText); assert.match(t, /이번 리그 10팀 · 전력 순[\s\S]*예상 \d+위 · 27경기/, '리그 시작 전 예상 순위'); assert.match(t, /다음 3연전/, '다음 3연전 단추');
      assert.equal(await p.evaluate(() => typeof G.uld.league.seed === 'number' && G.uld.league.v === 2), true, '씨앗 리그'); }
    await fit('PC 1366 리그 시작');
    /* 한 라운드씩: 순위·소식·박스 */
    await p.waitForTimeout(450); await p.click('[data-a="ulNext"]'); await wait(() => G.uld.league.next === 5 && !UL.busy);
    { const r = await p.evaluate(() => ({ rows: document.querySelectorAll('.ul-stx tbody tr:not(.ul-line)').length, l5: document.querySelectorAll('.ul-stx .ul-l5 i').length, news: (document.querySelector('.ul-nwl') || {}).innerText || '', g: [...document.querySelectorAll('.ul-stx tbody tr:not(.ul-line) td:nth-child(3)')].map(x => +x.innerText) }));
      assert.equal(r.rows, 10, '순위표 10팀'); assert.equal(r.l5, 30, '최근 5경기(3경기씩)'); assert.match(r.news, /리그 소식[\s\S]*1위/, '라운드 소식'); assert.ok(r.g.every(x => x <= 3), '1라운드 뒤 승 수 ' + r.g); }
    await p.evaluate(() => { UI.it = UI.it || {}; UI.it.ulg2 = 'sch'; render(); });
    { const si = await p.evaluate(() => G.uld.league.series.findIndex(s => s.a === 0 || s.b === 0)); await p.click(`[data-a="ulBx"][data-v="r:${si}:0"]`); await p.waitForSelector('.ul-bxv table.ls');
      const r = await p.evaluate(() => ({ t: document.querySelector('.ul-bxv').innerText, box: document.querySelectorAll('.ul-bxv table.box').length, ls: document.querySelectorAll('.ul-bxv table.ls tbody tr').length }));
      assert.equal(r.ls, 2, '줄 점수 두 줄'); assert.equal(r.box, 4, '우리 경기 박스(타자·투수 두 팀)'); assert.match(r.t, /박스 스코어[\s\S]*1라운드 1차전[\s\S]*합계/);
      const oi = await p.evaluate(() => G.uld.league.series.findIndex(s => s.a !== 0 && s.b !== 0)); await p.click(`[data-a="ulBx"][data-v="r:${oi}:1"]`); await p.waitForFunction(() => /2차전/.test(document.querySelector('.ul-bxv').innerText));
      assert.equal(await p.evaluate(() => document.querySelectorAll('.ul-bxv table.box').length), 0, '다른 경기는 줄 점수만'); await p.click('.ul-bxv [data-a="ulBx"][data-v=""]'); assert.equal(await p.evaluate(() => !!document.querySelector('.ul-bxv')), false, '박스 닫기'); }
    await fit('PC 1366 박스');
    for (const k of ['ts', 'ld', 'ps', 'nw']) { await p.evaluate(k => { UI.it.ulg2 = k; render(); }, k); await p.waitForTimeout(80); }
    await p.evaluate(() => { UI.it.ulg2 = 'ts'; render(); });
    { const r = await p.evaluate(() => ({ n: document.querySelectorAll('.ul-ts').length, rows: document.querySelectorAll('.ul-ts tbody tr').length, vs: document.querySelectorAll('.ul-vsa').length, rank: /\d+위/.test(document.querySelector('.ul-ts').innerText) }));
      assert.equal(r.n, 2, '팀 타격·투구 표'); assert.equal(r.rows, 22, '10팀 + 리그 평균 × 2'); assert.ok(r.vs >= 5 && r.rank, '리그 평균 대비·리그 순위'); }
    await p.evaluate(() => { UI.it.ulg2 = 'ld'; render(); }); assert.equal(await p.evaluate(() => document.querySelectorAll('.ul-lt .ltile').length), 19, '개인 순위 19부문(래더 기록 세분화 11-18)');
    await p.click('.ul-lt .ltile .l1'); await p.waitForSelector('.ul-team .ul-ros2'); { const t = await p.evaluate(() => document.querySelector('.ul-team').innerText); assert.match(t, /타자[\s\S]*OPS[\s\S]*투수[\s\S]*ERA/, '팀 선수 기록'); }
    await p.evaluate(() => { UI.it.ulg2 = 'st'; UL.opp = null; render(); }); await p.click('.ul-stx [data-a="ulOpp"][data-v="3"]'); await p.waitForFunction(() => /팀 기록/.test(document.querySelector('.ul-team').innerText) && document.querySelector('.ul-team').innerText.includes(G.uld.league.teams[3].name));
    await p.click('.ul-team [data-a="ulTmT"][data-v="deck"]'); await p.waitForFunction(() => !!document.querySelector('.setc .dk')); await p.click('[data-a="ulTmT"][data-v="st"]');
    await fit('PC 1366 팀 페이지'); await p.setViewportSize({ width: 1600, height: 900 }); await p.waitForTimeout(200); await fit('PC 1600 리그');
    if (shot) await p.screenshot({ path: shot + '_league_1600.png' });
    /* 남은 정규 라운드 → 대진 */
    for (let r = 2; r <= 9; r++) { await p.waitForTimeout(450); await p.click('[data-a="ulNext"]'); await wait(r => G.uld.league.next === r * 5 && !UL.busy, r); assert.equal(await p.evaluate(() => G.uld.league.news.length), r, r + '라운드 소식'); }
    await wait(() => /정규 시즌이 끝났습니다/.test(UL.msg)).catch(async e => { console.log("DBG", await p.evaluate(() => JSON.stringify({ msg: UL.msg, n: G.uld.league && G.uld.league.next, post: !!(G.uld.league && G.uld.league.post), busy: UL.busy })), errs); throw e; }); assert.equal(await p.evaluate(() => !!G.uld.league.post && G.uld.league.post.next === 0 && UI.it.ulg2 === 'ps'), true, '정규가 끝나면 대진을 보여 주고 멈춘다');
    { const r = await p.evaluate(() => ({ c: document.querySelectorAll('.ul-bk .ul-bkc').length, btn: document.querySelector('[data-a="ulNext"]').innerText, three: document.querySelector('[data-a="ulRun3"]').disabled })); assert.equal(r.c, 3, '대진 카드 3'); assert.match(r.btn, /다음 시리즈 · 준결승 1/); assert.equal(r.three, true); }
    await p.waitForTimeout(450); await p.click('[data-a="ulNext"]'); await wait(() => G.uld.league.post.next === 1 && !UL.busy); assert.match(await p.evaluate(() => UL.msg), /준결승 1 .*결승 진출/);
    await p.waitForTimeout(450); await p.click('[data-a="ulNext"]'); await wait(() => G.uld.league.post.next === 2 && !UL.busy).catch(async e => { console.log("DBG2", await p.evaluate(() => JSON.stringify({ msg: UL.msg, pn: G.uld.league.post.next, busy: UL.busy, btn: document.querySelector("[data-a=ulNext]").outerHTML })), errs); throw e; }); assert.match(await p.evaluate(() => document.querySelector('[data-a="ulNext"]').innerText), /결승/);
    { await p.evaluate(() => { UI.it.ulg2 = 'ps'; render(); }); await p.click('[data-a="ulBx"][data-v="p:0:0"]'); await p.waitForFunction(() => /준결승 1 1차전/.test((document.querySelector('.ul-bxv') || {}).innerText || '')); assert.equal(await p.evaluate(() => document.querySelectorAll('.ul-bxv table.box').length), 4, '포스트시즌 박스는 전체'); }
    await fit('PC 1600 포스트시즌');
    await p.waitForTimeout(450); await p.click('[data-a="ulNext"]'); await wait(() => /리그가 끝났습니다/.test(document.body.innerText) && !UL.busy && G.uld.last);
    await wait(() => G.uld.last && G.uld.last.srv, null, 20000);
    const R = await p.evaluate(() => ({ ps: G.uld.last.ps, srv: G.uld.last.srv, rank: G.uld.last.rank, t: document.querySelector('.ulx').innerText, hist: G.uld.hist[0] }));
    assert.ok(R.ps && R.ps.champN && ['c', 'r', 's', ''].includes(R.ps.my), '포스트시즌 결과'); assert.match(R.t, /포스트시즌[\s\S]*리그 시상[\s\S]*(MVP|홈런왕)/, '결과 카드 시상'); assert.match(R.t, /예상 \d+위[\s\S]*실제 \d+위/, '예상 대비 실제');
    assert.equal(R.hist.ps || '', R.ps.my || '', '덱 기록 포스트시즌');
    { const me = sql("SELECT id FROM players")[0].id, T = sql('SELECT team, rank, w, ps FROM ladder_teams WHERE player_id = ?', me), Ln = sql('SELECT kind, COUNT(*) AS n FROM ladder_lines WHERE player_id = ? GROUP BY kind ORDER BY kind', me), LR = sql('SELECT delta FROM league_results WHERE player_id = ?', me);
      assert.equal(T.length, 1, '기록실 팀 줄'); assert.equal(T[0].team, '와이'); assert.equal(T[0].rank, R.rank); assert.equal(T[0].ps, R.ps.my || ''); assert.ok(Ln.length === 2 && Ln[0].n >= 9 && Ln[1].n >= 5, '선수 줄 ' + JSON.stringify(Ln));
      assert.equal(LR[0].delta, R.srv.delta, '서버 포인트(포스트시즌 보너스 포함)'); }
    /* 끝난 리그 다시 보기 */
    { await p.evaluate(() => { UI.it.ulg2 = 'sch'; UI.ulSchR = 9; render(); }); const si = await p.evaluate(() => G.uld.last.lg.series.findIndex(s => s.r === 9 && (s.a === 0 || s.b === 0)));
      await p.click(`[data-a="ulBx"][data-v="r:${si}:2"]`); await p.waitForSelector('.ul-bxv table.box'); assert.match(await p.evaluate(() => document.querySelector('.ul-bxv').innerText), /9라운드 3차전/, '끝난 리그 박스'); await p.click('.ul-bxv [data-a="ulBx"][data-v=""]'); }
    for (const k of ['st', 'ts', 'ld', 'ps', 'nw']) { await p.evaluate(k => { UI.it.ulg2 = k; render(); }, k); await p.waitForTimeout(60); await fit('PC 1600 결과 ' + k); }
    if (shot) { await p.evaluate(() => { UI.it.ulg2 = 'ps'; render(); }); await p.screenshot({ path: shot + '_result_1600.png' }); }
    /* 래더 기록 세분화(구단주 11-18): 팀 기록 BB%·K%·K/9·BB/9·HR/9·FIP, 개인 순위 19부문, 팀 페이지 시즌 전체 줄(정렬), 서버 세분화 칸 */
    { await p.evaluate(() => { UI.it.ulg2 = 'ts'; UL.opp = null; UL.bx = null; render(); }); const t = await p.evaluate(() => document.querySelector('.ul-mid').innerText);
      for (const h of ['BB%', 'K%', 'K/9', 'BB/9', 'HR/9', 'FIP']) assert.ok(t.includes(h), '팀 기록 ' + h); assert.match(t, /우리 덱 vs 리그 평균[\s\S]*출루율[\s\S]*FIP/);
      await p.evaluate(() => { UI.it.ulg2 = 'ld'; render(); }); assert.equal(await p.evaluate(() => document.querySelectorAll('.ul-lt .ltile').length), 19, '개인 순위 19부문');
      await p.evaluate(() => { UI.it.ulg2 = 'ts'; UL.opp = 0; render(); }); await p.waitForSelector('.ul-team .ul-srt');
      const hd = await p.evaluate(() => [...document.querySelectorAll('.ul-team .ul-srt')].map(t => [...t.querySelectorAll('th')].map(x => x.innerText.replace(/[ ▼▲]/g, '')).join(',')));
      assert.equal(hd[0], '타자,포지션,G,PA,AB,H,2B,3B,HR,RBI,R,SB,BB,K,AVG,OBP,SLG,OPS'); assert.equal(hd[1], '투수,G,GS,W,L,SV,HLD,IP,H,ER,BB,K,ERA,WHIP,K/9');
      await p.click('.ul-team [data-a="ulSrt"][data-v="tb:hr"]'); const hr = await p.evaluate(() => [...document.querySelectorAll('.ul-team .ul-srt[data-t="tb"] tbody tr')].map(r => +r.children[8].innerText)); assert.deepEqual(hr, hr.slice().sort((a, b) => b - a), '홈런 정렬');
      await fit('PC 1600 팀 기록 세분화'); if (shot) await p.screenshot({ path: shot + '_stats_1600.png' });
      const me = sql("SELECT id FROM players")[0].id, X = sql("SELECT SUM(d2) AS d2, SUM(r) AS r, SUM(so) AS so FROM ladder_lines WHERE player_id = ? AND kind = 'b'", me)[0]; assert.ok(X.d2 > 0 && X.r > 0 && X.so > 0, '서버 세분화 칸 ' + JSON.stringify(X)); }
    /* 내 덱 래더 통산·라이벌(기록·데이터 › 팀 기록) */
    { await p.evaluate(() => { UI.it.uldata = 'team'; A.ulGoPg('data'); }); await p.waitForSelector('.ul-car'); const t = await p.evaluate(() => document.querySelector('.ul-car').innerText);
      assert.match(t, /내 덱 래더 통산[\s\S]*우승[\s\S]*준우승[\s\S]*정규 1위[\s\S]*승격 · 강등[\s\S]*최고 단계[\s\S]*라이벌/); await fit('PC 1600 통산'); }
    /* 기록실 */
    await p.evaluate(() => A.go('uld:rec')); await p.waitForSelector('.ul-recw .ul-rb', { timeout: 20000 }).catch(() => {}); await wait(() => document.querySelectorAll('.ul-rb li').length > 0, null, 20000);
    { const r = await p.evaluate(() => ({ t: document.querySelector('.ulx').innerText, me: document.querySelectorAll('.ul-rb li.me').length, wall: !!document.querySelector('.ul-wall') }));
      assert.match(r.t, /래더 기록실[\s\S]*우승 벽[\s\S]*홈런[\s\S]*평균자책점[\s\S]*최다 우승/, '기록실 칸'); assert.ok(r.me >= 3, '내 기록 강조 ' + r.me); assert.ok(r.wall);
      if (R.ps.my === 'c') assert.ok(await p.evaluate(() => document.querySelectorAll('.ul-wc').length === 1), '우승 벽에 우리 팀'); }
    for (const sc of ['league', 'career']) { await p.click(`[data-a="ulRecC"][data-v="${sc}"]`); await wait(sc => { const k = Object.keys(UL.rec || {}).find(x => x.endsWith('|' + sc)); return k && UL.rec[k].data && UL.rec[k].data.scope === sc; }, sc, 20000); }
    { const t = await p.evaluate(() => document.querySelector('.ulx').textContent); assert.match(t.replace(/\s+/g, ' '), /통산 = 모든 시즌[\s\S]*출루율[\s\S]*2루타[\s\S]*홀드[\s\S]*한 리그 최다 득점/, '기록실 세분화 ' + t.replace(/\s+/g, ' ').slice(0, 1500)); }
    await p.click('[data-a="ulRecC"][data-v="season"]');
    await p.click('[data-a="ulRecT"][data-v="4"]'); await wait(() => /아직/.test(document.querySelector('.ul-recb').innerText)); await p.click('[data-a="ulRecT"][data-v="all"]');
    await fit('PC 1600 기록실'); if (shot) await p.screenshot({ path: shot + '_rec_1600.png' });
    await p.setViewportSize({ width: 1366, height: 768 }); await p.waitForTimeout(200); await fit('PC 1366 기록실');
    await p.evaluate(() => A.go('uld:lobby')); await p.waitForSelector('.ul-banner', { timeout: 20000 }); assert.match(await p.evaluate(() => document.querySelector('.ul-banner').innerText), /기록실[\s\S]*홈런 1위[\s\S]*와이|홈런 1위/, '로비 알림 띠');
    await fit('PC 1366 로비'); await p.click('.ul-banner'); await wait(() => UI.sub.uld === 'rec');
    assert.ok(recReads >= 1 && recReads <= 8, '기록실 요청 수(캐시) ' + recReads);
    /* 휴대폰 390 */
    const tok = await p.evaluate(() => [localStorage.getItem('fo-net-v1-token'), localStorage.getItem('fo-net-v1-player')]);
    const ctx2 = await b.newContext({ viewport: { width: 390, height: 844 } }); await ctx2.addInitScript(t => { try { localStorage.setItem('fo-net-v1-token', t[0]); localStorage.setItem('fo-net-v1-player', t[1]); } catch (e) {} }, tok);
    const p2 = await ctx2.newPage(); p2.on('pageerror', e => errs.push(String(e))); const save = await p.evaluate(() => JSON.stringify(G)); await p2.goto(url);await p2.waitForFunction(()=>performance.getEntriesByName('fronttime-menu-ready').length>0); await p2.waitForTimeout(1500);
    await p2.evaluate(s => { G = JSON.parse(s); migrateDraft(); UI.title = false; A.go('uld:league'); }, save); await p2.waitForSelector('.ul-mid', { timeout: 20000 });
    const ow = async lab => { const o = await p2.evaluate(() => ({ w: document.documentElement.scrollWidth, iw: innerWidth })); assert.ok(o.w <= o.iw + 1, '휴대폰 390 가로 넘침 ' + lab + ' ' + JSON.stringify(o)); };
    for (const k of ['st', 'sch', 'ts', 'ld', 'ps', 'nw']) { await p2.evaluate(k => { UI.it = UI.it || {}; UI.it.ulg2 = k; render(); }, k); await p2.waitForTimeout(80); await ow('결과 ' + k); }
    await p2.evaluate(() => { UI.it.ulg2 = 'sch'; render(); }); await p2.waitForTimeout(450); await p2.click('summary[data-a="ulSchR"][data-v="1"]'); /* 펼치기는 누른 자리에서 */ { const si = await p2.evaluate(() => G.uld.last.lg.series.findIndex(s => s.r === 1 && (s.a === 0 || s.b === 0))); await p2.click(`[data-a="ulBx"][data-v="r:${si}:0"]`); await p2.waitForSelector('.ul-bxv'); await ow('박스'); }
    await p2.evaluate(() => { UL.bx = null; UL.opp = 0; render(); }); await p2.waitForSelector('.ul-team'); await ow('팀 페이지');
    for (const pg of ['rec', 'lobby']) { await p2.evaluate(pg => A.go('uld:' + pg), pg); await p2.waitForTimeout(500); await ow(pg); }
    if (shot) await p2.screenshot({ path: shot + '_390.png' });
    /* 진행 중 리그 휴대폰: 새 리그 시작 */
    await p2.evaluate(() => A.go('uld:league')); await p2.waitForSelector('[data-a="ulStart"]'); await p2.click('.ul-again [data-a="ulStart"]'); await p2.waitForFunction(() => G.uld.league && !UL.busy, null, { timeout: 60000 });
    await p2.click('[data-a="ulNext"]'); await p2.waitForFunction(() => G.uld.league.next === 5 && !UL.busy, null, { timeout: 60000 }); await ow('진행 중 리그');
    assert.deepEqual(errs, [], '페이지 오류');
    console.log(`래더 3연전 화면 점검 통과: 우리 ${R.rank}위 · 포스트시즌 ${R.ps.my || '진출 못 함'} · 우승 ${R.ps.champN} · 서버 +${R.srv.delta} · 기록실 요청 ${recReads}번`);
  } finally { if (b) await b.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
