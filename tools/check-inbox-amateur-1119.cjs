/* 카페 11-19 화면 제안 두 가지를 390x844(터치)·1440x900에서 확인한다. 화면 사진은 INBOXAM_OUT에 남긴다.
   1) 소식함: 분류 탭 아래 보낸이 칩·'읽지 않음만'. 보낸이를 고르면 그 보낸이 소식만, 읽지 않음만을 켜면 안 읽은 소식만, 둘은 함께 걸린다.
      필터는 화면 상태(UI)에만 있고 저장(G)에는 들어가지 않는다. 분류 탭을 바꿔 그 보낸이가 없으면 필터가 풀린다.
   2) 아마추어 선수 목록: '전 학년'으로 고1~대4가 한 목록에 나오고 포지션·권역으로 걸러진다. 100명씩 쪽을 나눠 한 쪽에 100행만 그린다.
      수천 명(저학년 명단을 불려서)이어도 목록을 만드는 시간을 재서 기록한다. 숨은 능력(pot·hidT)은 화면에 나오지 않는다.
      '대형 재목 자동 관심 등록'은 기본 꺼짐. 켜면 대형 재목이 관심 목록(80명 상한)에 들어가고 손으로 넣은 관심 선수는 남는다. 난수 호출 수는 변하지 않는다.
   공통: PC 페이지 스크롤 없음, 390px 가로 넘침 없음, 페이지 오류 없음. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
const root=path.join(__dirname,'..'),out=process.env.INBOXAM_OUT||'/tmp/inbox-amateur-1119';
const PW='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',CHROME=process.env.CHROMIUM_EXECUTABLE_PATH||(fs.existsSync(PW)?PW:'/usr/bin/chromium');
(async()=>{fs.mkdirSync(out,{recursive:true});
const server=await startHtmlServer(process.env.INBOXAM_HTML||path.join(root,'index.html')),browser=await chromium.launch({executablePath:CHROME});
try{for(const [width,height] of [[1440,900],[390,844]]){const mob=width<1100,c=await browser.newContext({viewport:{width,height},isMobile:mob,hasTouch:mob}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('https://**',r=>r.fulfill({body:'',contentType:'text/css'}));await p.goto(server.url);await p.waitForFunction(()=>performance.getEntriesByName('fronttime-menu-ready').length>0);await p.waitForFunction(()=>typeof newGame==='function'&&typeof DEMO!=='undefined');await p.waitForTimeout(1500);
const shot=n=>p.screenshot({path:path.join(out,`${width}-${n}.png`)});
const fit=async w=>{const r=await p.evaluate(()=>({v:document.documentElement.scrollHeight-innerHeight,h:document.documentElement.scrollWidth-innerWidth}));assert.ok(r.h<=2,`${width} ${w}: 가로 넘침 ${r.h}`);if(!mob)assert.ok(r.v<=2,`${width} ${w}: PC 페이지 스크롤 ${r.v}`);};
/* 새 리그. 소식함에 보낸이가 여러 명 섞이도록 소식을 몇 통 더 넣고 반은 읽음 처리 */
const base=await p.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;UI.title=false;
  for(let i=0;i<4;i++){mail('스카우트팀',`시험 스카우트 보고 ${i+1}`,'시험용 보고입니다.',{kind:'스카우트'});mail('구단주실',`시험 구단주 소식 ${i+1}`,'시험용 소식입니다.',{kind:'구단주'});mail('의무팀',`시험 부상 소식 ${i+1}`,'시험용 소식입니다.',{kind:'부상'});}
  G.mail.forEach((m,i)=>{if(i%2)m.read=true;});
  UI.tab='inbox';UI.mf='all';UI.mfFrom=null;UI.mfUnread=false;render();
  const by={};for(const m of G.mail)by[m.from]=(by[m.from]||0)+1;return {n:G.mail.length,unread:G.mail.filter(m=>!m.read).length,by,gkeys:Object.keys(G)};});
assert.ok(base.n>=12,'소식 수 '+base.n);
/* 1. 보낸이 칩 */
const chips=await p.evaluate(()=>[...document.querySelectorAll('.ibx-from button[data-a=mfFrom]')].map(b=>b.dataset.v));
assert.ok(chips.includes('')&&chips.includes('스카우트팀')&&chips.includes('구단주실'),'보낸이 칩 '+chips.join(','));
assert.ok(await p.evaluate(()=>!!document.querySelector('.ibx-from .ibx-unread-only')),'읽지 않음만 단추');
await shot('1-inbox-all');await fit('소식함 전체');
await p.evaluate(()=>A.mfFrom('스카우트팀'));
let rows=await p.evaluate(()=>[...document.querySelectorAll('.ibx-list .ibr')].map(b=>G.mail.find(m=>m.id===b.dataset.mid)).map(m=>[m.from,m.read]));
assert.ok(rows.length>=2&&rows.every(r=>r[0]==='스카우트팀'),'보낸이 필터: '+JSON.stringify(rows));
assert.equal(await p.evaluate(()=>document.querySelector('.ibx-from button.on[data-a=mfFrom]').dataset.v),'스카우트팀');
await p.evaluate(()=>A.mfUnread());
rows=await p.evaluate(()=>[...document.querySelectorAll('.ibx-list .ibr')].map(b=>G.mail.find(m=>m.id===b.dataset.mid)).map(m=>[m.from,m.read]));
assert.ok(rows.length>=1&&rows.every(r=>r[0]==='스카우트팀'&&!r[1]),'보낸이+읽지 않음: '+JSON.stringify(rows));
assert.equal(await p.evaluate(()=>document.querySelector('.ibx-unread-only').getAttribute('aria-pressed')),'true');
await shot('2-inbox-filtered');await fit('소식함 필터');
/* 저장에 안 남는다 */
const saved=await p.evaluate(()=>{const s=JSON.stringify(G);return {from:/mfFrom/.test(s),un:/mfUnread/.test(s),ui:[UI.mfFrom,UI.mfUnread]};});
assert.deepEqual(saved,{from:false,un:false,ui:['스카우트팀',true]},'필터는 UI 상태만');
/* 읽지 않음만 끄고, 분류를 '언론·기록'으로 바꾸면 스카우트팀이 없어 보낸이 필터가 풀린다 */
await p.evaluate(()=>{A.mfUnread();A.mf('media');});
const after=await p.evaluate(()=>({from:UI.mfFrom,n:document.querySelectorAll('.ibx-list .ibr').length,rows:[...document.querySelectorAll('.ibx-list .ibr')].map(b=>G.mail.find(m=>m.id===b.dataset.mid).from)}));
assert.ok(after.from===null||after.rows.every(f=>f==='스카우트팀'),'분류 바꿈 뒤 보낸이 필터 '+JSON.stringify(after));
await p.evaluate(()=>{A.mf('all');A.mfFrom('');});
assert.equal(await p.evaluate(()=>document.querySelectorAll('.ibx-list .ibr').length>0),true);
/* 2. 아마추어 전 학년 목록 */
const am=await p.evaluate(()=>{ /* 저학년 명단을 불려 수천 명으로(화면 성능 재기): 기존 항목을 복제해 번호만 바꾼다 */
  const L=amPipe().L,ids=Object.keys(L);let k=0;const src=ids.map(i=>L[i]);const want=3000;let id=Math.max(...ids.map(Number))+1;
  while(Object.keys(L).length<want&&src.length){const e=src[k++%src.length];const c=JSON.parse(JSON.stringify(e));c.id=id;c.n=e.n+'·'+id;L[id]=c;id++;}
  UI.tab='staff';UI.sub=UI.sub||{};UI.sub.staff='scouts';UI.it=Object.assign({},UI.it||{},{scoutpg:'am',amhub:'ply'});UI.amF={gr:'all',pg:'all',ar:'all',srt:'est',p:0};
  const t0=performance.now();render();const ms=performance.now()-t0;
  const rows=document.querySelectorAll('.am-ptable tbody tr').length,N=amProspectRows('all').length;
  const html=document.querySelector('.am-plist').innerHTML;const hid=Object.values(L).filter(e=>e.hidT).slice(0,20).some(e=>new RegExp('\\b'+e.pot+'\\b').test(html.split(e.n+'<')[1]?.slice(0,300)||''));
  return {ms:Math.round(ms),build:Math.round(UI._amPlyMs||0),rows,N,pool:Object.keys(L).length,auto:!!(G.cfg&&G.cfg.amAuto),chk:document.querySelector('input[data-a=amAuto]')?.checked,pager:!!document.querySelector('.am-pager'),grs:[...document.querySelectorAll('.am-pfilt .chips')[0].querySelectorAll('button')].map(b=>b.textContent),hid,r0:document.querySelector('.am-ptable tbody tr')?.textContent.slice(0,120)};});
console.log(`${width}: 전 학년 ${am.N}명(명단 ${am.pool}) · 화면 그리기 ${am.ms}ms(목록 만들기 ${am.build}ms) · 행 ${am.rows}`);
assert.ok(am.N>=2000,'전 학년 수 '+am.N);assert.equal(am.rows,100,'한 쪽 100행');assert.ok(am.pager,'쪽 넘김');assert.ok(am.grs[0]==='전 학년'&&am.grs.includes('대4'),'학년 칩 '+am.grs);
assert.equal(am.auto,false,'자동 관심 기본 꺼짐');assert.equal(am.chk,false);assert.ok(am.ms<3000,'그리는 시간 '+am.ms+'ms');
assert.ok(!/pot|hidT/.test(am.r0),'숨은 능력 노출 '+am.r0);
await shot('3-amateur-all');await fit('아마추어 전 학년');
/* 쪽 넘김·포지션·권역 필터 */
const pg2=await p.evaluate(()=>{A.amF('p:1');const a=document.querySelector('.am-pager span').textContent;A.amF('pg:P');const b=document.querySelector('.am-pager span, .am-plist .row span.small').textContent;const allP=[...document.querySelectorAll('.am-ptable tbody tr td:first-child small')].every(s=>/투수/.test(s.textContent));
  const ar=AREA[0].k;A.amF('ar:'+ar);const allA=[...document.querySelectorAll('.am-ptable tbody tr td:nth-child(2) small')].every(s=>s.textContent.includes(ar));return {a,b,allP,allA,p:UI.amF.p};});
assert.match(pg2.a,/^101~/,'둘째 쪽 '+pg2.a);assert.ok(pg2.allP,'투수만');assert.ok(pg2.allA,'권역만');assert.equal(pg2.p,0,'조건 바꾸면 첫 쪽');
await shot('4-amateur-filtered');await fit('아마추어 필터');
/* 자동 관심 등록: 난수 호출 수 불변, 손으로 넣은 관심은 남고 80명 상한 */
const auto=await p.evaluate(()=>{A.amF('ar:all');A.amF('pg:all');const first=amProspectRows('all').find(x=>amTier(amEstOf(x)).t!=='대형 재목');amFollow(first.id,true);const before=amFollowL(G.user).length;
  let calls=0;const R0=R;window.R=function(){calls++;return R0.apply(this,arguments);};
  A.amAuto();const n=amFollowL(G.user).length;const big=amProspectRows('all').filter(x=>amTier(amEstOf(x)).t==='대형 재목').length;window.R=R0;
  const kept=amFollowing(G.user,first.id);const allBig=amFollowL(G.user).filter(id=>typeof id==='number').every(id=>{const x=amProspectRows('all').find(y=>y.id===id);return !x||x.id===first.id||amTier(amEstOf(x)).t==='대형 재목';});
  const on=!!G.cfg.amAuto,chk=document.querySelector('input[data-a=amAuto]').checked;A.amAuto();return {before,n,big,calls,kept,allBig,on,chk,off:!G.cfg.amAuto,still:amFollowL(G.user).length};});
console.log(`${width}: 대형 재목 ${auto.big}명 · 관심 ${auto.before}→${auto.n}명 · R() 호출 ${auto.calls}`);
assert.equal(auto.calls,0,'자동 관심 등록은 난수를 쓰지 않는다');assert.ok(auto.on&&auto.chk,'토글 켜짐');assert.ok(auto.kept,'손으로 넣은 관심 유지');assert.ok(auto.n>auto.before&&auto.n<=80,'관심 수 '+auto.n);assert.ok(auto.allBig,'대형 재목만 추가');assert.ok(auto.off&&auto.still===auto.n,'끄면 관심 목록은 그대로');
await shot('5-amateur-auto');
assert.deepEqual(errors,[],`${width} 페이지 오류`);console.log(`${width}x${height} 통과`);await c.close();}}
finally{await browser.close();await server.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1});
