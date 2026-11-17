/* 래더 v3 회귀 점검(외부 검수 11-17, 사용자 11-17 "레더랑 대회 쪽 유아이랑 시스템 제대로 더 개선해야하고"). 서버 없이(/api는 404 또는 가짜 길) 실제 브라우저에서:
   1) [P1 저장] 본게임은 손대지 않고 앨범 담기·래더 덱 등록·리그 시작·다음 연전·덱 고치기만 한 뒤 새로 고쳐 불러오면 그대로 남는다
   2) [P1 칸 바꾸기] 칸 A에서 리그 시작 → 상대 응답을 늦추는 동안 칸 B를 열면, 늦게 온 응답이 B의 리그·등록·화면을 바꾸지 않는다(A의 저장도 그대로)
   3) [P2 신청 두 번] 대회 신청에서 사진 준비를 늦추고 550ms 간격으로 두 번 누르면 POST는 한 번, 마지막 글은 '신청했습니다'
   4) 화면: 결과 공개 카드(순위·승강·점수·우리 MVP·목표 진척·다음 리그), 우리 연전 카드·3라운드 단추, 로비 목표·상대 미리보기, 붙어 보기, 대회 상태 단계·내 신청 카드
   사용: bash build.sh 후 node tools/check-ladder-v3-ui.cjs (CHROMIUM_EXECUTABLE_PATH). SHOT=폴더 이면 PC 1440·휴대폰 390 그림 */
const assert = require('node:assert/strict'), path = require('node:path'), fs = require('node:fs');
const { chromium } = require('playwright'), { startHtmlServer } = require('./lib/ui-server.cjs');
const SHOT = process.env.SHOT; if (SHOT) fs.mkdirSync(SHOT, { recursive: true });
const boot = () => { DEMO.on = false; newGame(6); fdStart(); fdAdvance(false); let n = 0; while (G.fd && !G.fd.done && n++ < 500) fdAdvance(true); hireMgr(G.mmarket[0].id, 3); G.tut = { done: true, step: 99 }; G.medSet = true; UI.title = false; CUR_SLOT = 1; slotRevSync(1); SLOT_NEW = true; uiSaveSync(); render(); saveNow(); };
(async () => {
  const server = await startHtmlServer(path.resolve(__dirname, '../index.html')), b = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || '/usr/bin/chromium' }), errs = [];
  const open = async (ctx, w, h) => { const p = await ctx.newPage(); await p.setViewportSize({ width: w || 1440, height: h || 900 }); p.on('pageerror', e => errs.push(String(e))); p.on('dialog', d => d.accept()); await p.route('https://fonts.googleapis.com/**', r => r.fulfill({ body: '', contentType: 'text/css' })); await p.goto(server.url); await p.waitForFunction(() => typeof newGame === 'function', null, { timeout: 60000 }); return p; };
  const fit = p => p.evaluate(() => { window.scrollTo(0, 9999); return { scroll: scrollY, h: document.documentElement.scrollHeight, v: innerHeight, sw: document.documentElement.scrollWidth, iw: innerWidth }; });
  const top = p => p.evaluate(() => { document.querySelectorAll('.setc').forEach(e => { e.scrollTop = 0; }); });
  try {
    /* ---- 1) 저장 ---- */
    const ctx = await b.newContext(), p = await open(ctx); await p.evaluate(boot);
    const t0 = await p.evaluate(() => ({ alb: cupAlbum().length, day: G.day }));
    await p.evaluate(() => { A.go('club:cup'); }); await p.waitForTimeout(300); await p.evaluate(() => A.cupAlbSave());
    await p.evaluate(() => { A.go('uld:deck'); }); await p.waitForSelector('#ulName'); await p.fill('#ulName', '와이'); await p.click('[data-a="ulReg"]'); await p.waitForFunction(() => uld().deck && !UL.busy, null, { timeout: 30000 });
    await p.evaluate(() => A.ulGoPg('league')); await p.click('[data-a="ulStart"]'); await p.waitForFunction(() => uld().league && !UL.busy, null, { timeout: 60000 });
    { const t = await p.evaluate(() => document.querySelector('.ul-lg').innerText); assert.match(t, /이번 리그 10팀 · 전력 순[\s\S]*번째/, '리그 시작 직후 상대 9팀 전력 순'); assert.ok(await p.evaluate(() => !!document.querySelector('[data-a="ulRun3"]')), '3라운드 단추'); }
    if (SHOT) { await top(p); await p.screenshot({ path: SHOT + '/league0_1440.png' }); }
    await p.click('[data-a="ulNext"]'); await p.waitForFunction(() => uld().league.next === 5 && !UL.busy, null, { timeout: 60000 });
    assert.match(await p.evaluate(() => document.querySelector('.ul-ser').innerText), /1라운드 우리 연전[\s\S]*1차전[\s\S]*2차전[\s\S]*3차전[\s\S]*\d승 \d패/, '우리 연전 카드');
    await p.click('[data-a="ulEditOpen"]'); await p.waitForSelector('.ul-edit'); await p.click('.ul-edit [data-a="ulUp"][data-v="1"]'); await p.click('[data-a="ulEditSave"]'); await p.waitForFunction(() => /다음 연전부터/.test(UL.msg));
    const mem = await p.evaluate(() => ({ alb: cupAlbum().length, deck: uld().deck.e.name, next: uld().league.next, edits: uld().league.edits.length, day: G.day }));
    assert.equal(mem.alb, t0.alb + 1); assert.equal(mem.day, t0.day, '본게임은 손대지 않음');
    await p.waitForTimeout(1600); await p.reload(); await p.waitForFunction(() => typeof A === 'object' && typeof A.slotLoad === 'function', null, { timeout: 60000 });
    await p.evaluate(() => { if (!G || curSlot() !== 1) A.slotLoad(1); UI.title = false; });
    const disk = await p.evaluate(() => ({ alb: cupAlbum().length, deck: uld().deck && uld().deck.e.name, next: uld().league && uld().league.next, edits: uld().league && uld().league.edits.length }));
    assert.deepEqual(disk, { alb: mem.alb, deck: mem.deck, next: mem.next, edits: mem.edits }, '새로 고친 뒤 래더·앨범 ' + JSON.stringify({ mem, disk }));
    console.log('[P1 저장] 앨범·덱 등록·리그 시작·다음 연전·덱 고치기 → 새로 고침 뒤 그대로 통과 ' + JSON.stringify(disk));
    /* 끝까지 → 결과 공개 카드 → 저장 */
    await p.evaluate(() => A.go('uld:league')); await p.click('[data-a="ulAll"]'); await p.waitForFunction(() => uld().last && !uld().league && !UL.busy, null, { timeout: 180000 });
    { const t = await p.evaluate(() => document.querySelector('.ul-rv').innerText); assert.match(t, /리그 결과[\s\S]*\d+\s*위[\s\S]*(승격|강등|잔류)[\s\S]*리그 점수[\s\S]*시즌 목표 \d\/5[\s\S]*오늘의 목표 \d\/3[\s\S]*내 최고 단계[\s\S]*다음 리그 · /, '결과 공개 카드');
      assert.match(t, /우리 MVP\s*\S+\s*\d+(타수|이닝|\.)/, '우리 MVP 기록 줄이 보임'); assert.ok(await p.evaluate(() => !!document.querySelector('.ul-rv.ul-anim')), '처음 그릴 때 공개 움직임');
      const f = await fit(p); assert.ok(f.scroll === 0 && f.h <= f.v + 2, 'PC 결과 화면 통째 스크롤 ' + JSON.stringify(f)); }
    if (SHOT) { await p.waitForTimeout(2800); await p.evaluate(() => render()); await top(p); await p.screenshot({ path: SHOT + '/result_1440.png' }); }
    await p.evaluate(() => A.go('uld:lobby')); await p.waitForTimeout(400);
    { const t = await p.evaluate(() => document.querySelector('.ulx').innerText); assert.match(t, /오늘의 목표[\s\S]*이번 주 목표[\s\S]*도장/, '로비 목표 카드'); assert.match(t, /이번 리그 상대 미리보기[\s\S]*AI 구단 기준/, '로비 상대 미리보기'); const f = await fit(p); assert.ok(f.scroll === 0, 'PC 로비 통째 스크롤'); }
    if (SHOT) { await top(p); await p.screenshot({ path: SHOT + '/lobby_1440.png' }); }
    /* 붙어 보기: 가져온 덱(다른 구단 1군)과 3경기 */
    await p.evaluate(() => { const e = cupEntryNow({ tid: (G.user + 2) % 10, name: '챔프' }); e.year = 2030; ulDeckImport(e, '제1회 프런트컵 우승'); A.go('uld:deck'); });
    const g0 = await p.evaluate(() => { const x = JSON.parse(JSON.stringify(G)); delete x.uld; return JSON.stringify(x).length; });
    await p.click('[data-a="ulEx"]'); await p.waitForSelector('.ul-ex', { timeout: 60000 }); assert.match(await p.evaluate(() => document.querySelector('.ul-ex').innerText), /붙어 보기[\s\S]*\d-\d[\s\S]*1차전/, '붙어 보기 결과');
    await p.click('.ul-ex [data-a="ulKey"][data-v="0"]'); await p.click('.ul-ex [data-a="ulKeyT"][data-v="line"]'); assert.ok(await p.evaluate(() => document.querySelectorAll('.ul-ex table.ul-bx tr').length >= 3), '점수표가 표로');
    assert.equal(await p.evaluate(() => { const x = JSON.parse(JSON.stringify(G)); delete x.uld; return JSON.stringify(x).length; }), g0, '붙어 보기는 G를 바꾸지 않음');
    if (SHOT) { await top(p); await p.screenshot({ path: SHOT + '/exhibit_1440.png' }); }
    console.log('결과 공개 카드·로비 목표·상대 미리보기·붙어 보기 통과');
    /* 휴대폰 390 */
    { const save = await p.evaluate(() => JSON.stringify(G)), ctx2 = await b.newContext(), m = await open(ctx2, 390, 844);
      for (const pg of ['lobby', 'league', 'deck']) { await m.evaluate(([s, pg]) => { if (!G) { G = JSON.parse(s); migrateDraft(); } UI.title = false; A.go('uld:' + pg); }, [save, pg]); await m.waitForTimeout(500); const f = await fit(m); assert.ok(f.sw <= f.iw + 1, `휴대폰 ${pg} 가로 스크롤 ` + JSON.stringify(f)); if (SHOT) { await m.evaluate(() => window.scrollTo(0, 0)); await m.screenshot({ path: `${SHOT}/${pg}_390.png` }); } }
      await ctx2.close(); console.log('휴대폰 390 가로 스크롤 없음 통과'); }
    /* ---- 2) 칸 바꾸기: 늦은 상대 응답 ---- */
    await p.evaluate(() => { uld().league = null; saveNow(); const B = JSON.parse(JSON.stringify(G)); B.wid = 'wB' + Date.now(); B.uld = { v: 2, tier: 0, hist: [], deck: null, league: null, last: null, dn: 0, ps: {}, opp: {} }; localStorage.setItem(slotKey(2), packJ(JSON.stringify(B))); const m = meta(); m.slots[2] = Object.assign(slotInfoOf(B), { rev: 20 }); setMeta(m); });
    let release; const gate = new Promise(r => { release = r; }); let oppHits = 0;
    await p.route('**/api/ladder/opp**', async r => { oppHits++; await gate; await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, decks: [], avg: 0, count: 0 }) }); });
    await p.evaluate(() => A.go('uld:league')); await p.click('[data-a="ulStart"]'); await p.waitForFunction(() => /같은 단계 덱을 받는 중/.test(UL.msg), null, { timeout: 10000 });
    await p.waitForFunction(() => true); for (let i = 0; i < 40 && !oppHits; i++) await p.waitForTimeout(100); assert.ok(oppHits >= 1, '상대 요청이 나감');
    const aLid = await p.evaluate(() => uld().lid | 0);
    await p.evaluate(() => { A.slotLoad(2); if (UI.confLoad === 2) A.slotLoad(2); UI.title = false; A.go('uld:league'); }); assert.equal(await p.evaluate(() => curSlot()), 2);
    const bBefore = await p.evaluate(() => ({ wid: G.wid, deck: !!uld().deck, league: !!uld().league, me: UL.me, busy: UL.busy, msg: UL.msg }));
    assert.deepEqual([bBefore.deck, bBefore.league, bBefore.me, bBefore.busy], [false, false, null, false], '칸 B를 열면 래더 화면 상태가 비워짐 ' + JSON.stringify(bBefore));
    release(); await p.waitForTimeout(1500);
    const bAfter = await p.evaluate(() => ({ league: !!uld().league, me: UL.me, msg: UL.msg, txt: document.querySelector('.ulx').innerText }));
    assert.equal(bAfter.league, false, '늦은 응답이 칸 B에 리그를 만듦'); assert.equal(bAfter.me, null); assert.doesNotMatch(bAfter.msg, /리그를 시작했습니다/, 'B 화면에 A의 시작 글'); assert.doesNotMatch(bAfter.txt, /남은 연전/);
    await p.evaluate(() => { A.slotLoad(1); if (UI.confLoad === 1) A.slotLoad(1); }); assert.equal(await p.evaluate(() => (uld().lid | 0)), aLid, '칸 A 저장에도 리그가 생기지 않음'); assert.equal(await p.evaluate(() => !!uld().league), false);
    console.log('[P1 칸 바꾸기] 늦게 온 상대 응답이 칸 B의 리그·등록·화면을 바꾸지 않음 통과');
    /* ---- 3) 대회 신청 두 번 누르기 ---- */
    let posts = 0; const cfg = { id: 'cupT', title: '점검컵', format: 'league', teams: 10, deadline: new Date(Date.now() + 3 * 864e5 + 9 * 36e5).toISOString().slice(0, 16).replace('T', ' '), open: true, payCapX: 0 };
    await p.route('**/api/cup**', async r => { const u = new URL(r.request().url()), m = r.request().method(), J = (s, o) => r.fulfill({ status: s, contentType: 'application/json', body: JSON.stringify(o) });
      if (u.pathname === '/api/cup' && m === 'GET') return J(200, { cup: cfg }); if (/\/api\/cup\/entry\//.test(u.pathname) && m === 'GET') return J(200, { entered: false });
      if (u.pathname === '/api/cup/entry' && m === 'POST') { posts++; await new Promise(z => setTimeout(z, 300)); return posts === 1 ? J(201, { ok: true, name: '와이', year: 2026, ovr: { t: 65, p: 64, b: 66 }, at: Date.now() }) : J(429, { error: 'daily', message: '신청은 하루에 한 번만 할 수 있습니다.' }); }
      if (u.pathname === '/api/cup/entries') return J(200, { cup: cfg, n: 3, entries: [{ seed: 1, name: '와이', year: 2026, ovr: { t: 65, p: 64, b: 66 } }] }); if (u.pathname === '/api/cup/pub') return J(404, {}); if (u.pathname === '/api/cup/results') return J(200, { v: 1, cups: [] }); return J(404, {}); });
    await p.evaluate(() => { cupFaces = async e => { await new Promise(r => setTimeout(r, 1500)); return e; }; Object.assign(CUP, { st: '', cfg: null, my: null, pubSt: '', entsSt: '' }); A.go('club:cup'); });
    await p.waitForSelector('[data-a="cupApply"]', { timeout: 15000 }); assert.match(await p.evaluate(() => document.querySelector('.cup-st').innerText), /접수 중[\s\S]*마감[\s\S]*진행[\s\S]*결과 공개[\s\S]*마감까지/, '대회 상태 단계');
    await p.click('[data-a="cupApply"]'); await p.waitForTimeout(550); await p.evaluate(() => { const x = document.querySelector('[data-a="cupApply"]'); if (x) { x.disabled = false; x.click(); } else A.cupApply(); }); /* 잠긴 단추를 억지로 눌러도(빠른 두 번 누르기) 한 번만 */
    await p.waitForFunction(() => !CUP.busy && /신청했습니다|신청은/.test(CUP.msg), null, { timeout: 15000 }); await p.waitForTimeout(500);
    assert.equal(posts, 1, 'POST ' + posts + '번'); assert.match(await p.evaluate(() => CUP.msg), /신청했습니다/); assert.ok(await p.evaluate(() => !!(G.cupMine && G.cupMine.cup === 'cupT')));
    assert.match(await p.evaluate(() => document.querySelector('.cup-mine').innerText), /접수됨[\s\S]*와이[\s\S]*시드 1번/, '내 신청 카드');
    if (SHOT) { await top(p); await p.screenshot({ path: SHOT + '/cup_1440.png' }); }
    console.log('[P2 신청 두 번] 사진 준비를 늦추고 두 번 눌러도 POST 한 번·성공 글 통과');
    assert.deepEqual(errs, [], '페이지 오류 ' + errs.join(' | ')); console.log('래더 v3 화면 점검 통과');
  } finally { await b.close(); await server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
