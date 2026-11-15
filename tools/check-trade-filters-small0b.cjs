/* 국사왕 건의(11-15): 관심 선수 잠재력 열, 트레이드 매물·불가 표시와 검색 조건, 통산 기록 1군/2군 범위 선택을 실제 화면에서 확인한다. */
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
(async()=>{const server=await startHtmlServer(path.resolve(__dirname,'../index.html'));let browser;const out=process.env.REVIEW_OUT;
try{browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});
for(const [width,height,touch] of [[1366,768,false],[390,664,true]]){
 const c=await browser.newContext({viewport:{width,height},isMobile:touch,hasTouch:touch,deviceScaleFactor:2}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));await p.goto(server.url);
 const shot=async name=>{ if(out){ fs.mkdirSync(out,{recursive:true}); await p.screenshot({path:path.join(out,name+'-'+width+'.png')}); } };
 const fx=await p.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;UI.title=false;G.day=dnum(G.year,6,15);
  const tid=G.teams.find(t=>t.id!==G.user).id, L=domestic(tid).filter(q=>!q.ys&&!q.isP&&!(q.joinY>G.year)).sort((a,b)=>ovr(b)-ovr(a));
  const blk=L[0], urg=L[1], fa=L[2], ntc=L[3];
  blk.aiListed=true; blk.aiUrg=false; blk.aiLd=G.day; urg.aiListed=true; urg.aiUrg=true; urg.aiLd=G.day;
  fa.faTrY=G.year+1; ntc.ctT=ntc.team; ntc.ntc=G.year+1;
  const mine=domestic(G.user).filter(q=>!q.ys&&!q.isP&&!(q.joinY>G.year)).sort((a,b)=>ovr(b)-ovr(a)); mine[0].noTrade=true; mine[1].faTrY=G.year+1;
  return {tid,blk:blk.id,urg:urg.id,fa:fa.id,ntc:ntc.id,mineNo:mine[0].id,mineFa:mine[1].id}; });
 /* 1. 선수 찾기: 트레이드 불가 기본 숨김, 매물만 */
 const ids=()=>p.evaluate(()=>UI._findPool.map(q=>q.id));
 await p.evaluate(()=>{UI.it=Object.assign(UI.it||{},{mkv:'find'});UI.findTeam='all';A.go('trade:market');});
 let pool=await ids(); assert.ok(!pool.includes(fx.fa)&&!pool.includes(fx.ntc),'트레이드 불가 선수는 기본으로 숨김');assert.ok(pool.includes(fx.blk)&&pool.includes(fx.urg));
 assert.ok(await p.locator('[data-a="opt"][data-k="findBlk"]').count()>=2,'매물만 조건 버튼');
 await p.evaluate(()=>document.querySelectorAll('details.ws-filter-controls').forEach(d=>d.open=true));await p.locator('[data-a="opt"][data-k="findBlk"][data-v="blk"]').first().click();pool=await ids();
 assert.ok(pool.length>=2&&await p.evaluate(()=>UI._findPool.every(q=>q.aiListed)),'매물만: 매물 선수만');assert.ok(pool.includes(fx.blk)&&pool.includes(fx.urg));
 await p.evaluate(t=>{UI.findTeam=String(t);render();},fx.tid);
 const tags=await p.locator('.trtag').allInnerTexts();assert.ok(tags.includes('매물')&&tags.includes('급매'),'매물·급매 꼬리표 '+tags.join(','));
 await shot('find-blk');
 await p.evaluate(()=>{UI.findBlk='all';UI.findNT='show';render();});pool=await ids();assert.ok(pool.includes(fx.fa)&&pool.includes(fx.ntc),'트레이드 불가 포함');
 const why=await p.evaluate(()=>[...document.querySelectorAll('.trtag')].filter(e=>e.textContent==='트레이드 불가').map(e=>e.dataset.tip));assert.ok(why.some(t=>/FA로 계약/.test(t))&&why.some(t=>/거부권/.test(t)),'불가 이유 말풍선 '+why.join('|'));
 await p.waitForTimeout(250);const tg=p.locator('.trtag:visible',{hasText:'트레이드 불가'}).first();await tg.scrollIntoViewIfNeeded();await tg.click();assert.ok(await p.locator('#tipb.on').isVisible(),'꼬리표를 누르면 이유가 뜸');
 await shot('find-nt');
 await p.evaluate(()=>{UI.findNT='hide';UI.findName='';render();});
 /* 2. 협상하기: 상대 선수 숨김·표시, 우리 선수는 숨기지 않음 */
 await p.evaluate(t=>{A.tpartnerGo(t);},fx.tid);
 const poolIds=()=>p.evaluate(()=>[...document.querySelectorAll('.trws [data-a="tpick"]')].map(b=>+b.dataset.v.split(':')[1]));
 await p.evaluate(()=>{UI.trade.sort='cur';render();});
 if(width<700)await p.evaluate(()=>{UI.trade.stage=null;render();});
 let tp=await poolIds();assert.ok(!tp.includes(fx.fa)&&!tp.includes(fx.ntc)&&tp.includes(fx.blk),'협상 상대 목록 기본 숨김');
 await p.evaluate(()=>{UI.findBlk='blk';render();});tp=await poolIds();assert.ok(tp.length>=2&&await p.evaluate(v=>v.every(id=>G.players[id].aiListed),tp),'협상 목록 매물만');
 await shot('table-get');
 await p.evaluate(()=>{UI.findBlk='all';A.tside('give');});
 tp=await poolIds();assert.ok(tp.includes(fx.mineNo)&&tp.includes(fx.mineFa),'우리 선수는 숨기지 않음');
 const mineTags=await p.evaluate(f=>{const r=[...document.querySelectorAll('.trws .trw')].find(e=>e.querySelector(`[data-v="give:${f}"]`));return r?[...r.querySelectorAll('.trtag')].map(e=>e.textContent+'|'+e.dataset.tip):[];},fx.mineFa);assert.ok(mineTags.some(t=>t.startsWith('트레이드 불가|FA로 계약')),'우리 FA 계약 선수 꼬리표 '+mineTags);
 const noTags=await p.evaluate(f=>{const r=[...document.querySelectorAll('.trws .trw')].find(e=>e.querySelector(`[data-v="give:${f}"]`));return r?[...r.querySelectorAll('.trtag')].map(e=>e.dataset.tip):[];},fx.mineNo);assert.ok(noTags.some(t=>/지정한 선수/.test(t)),'트레이드 불가 지정 꼬리표');
 await shot('table-give');
 assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'가로 넘침 없음');
 /* 3. 관심 선수 명단: 잠재력 열(스카우트 추정만) */
 const pw=await p.evaluate(f=>{G.pwatch=[f.blk,f.urg,f.fa];const h=pwatchTable(false);return {head:h.includes('<th>잠재력</th>'),same:G.pwatch.every(id=>{const q=G.players[id];return h.includes('<td class="pw-pot">'+potChip(scoutReport(q),q)+'</td>');}),chip:(h.match(/class="ptier/g)||[]).length};},fx);
 assert.ok(pw.head&&pw.chip===3,'잠재력 열 '+JSON.stringify(pw));assert.ok(pw.same,'다른 목록과 같은 스카우트 추정 잠재력(scoutReport) 사용');
 await p.evaluate(()=>{UI.it=Object.assign(UI.it||{},{scoutpg:'watch'});A.go('staff:scouts');});await p.waitForTimeout(100);assert.ok(await p.locator('.scn-watch th',{hasText:'잠재력'}).count()===1,'관심 선수 화면 잠재력 열');
 await shot('watch');
 /* 4. 통산 기록: 1군만(기본) · 2군 포함 · 2군만 */
 const cid=await p.evaluate(()=>{const q=domestic(G.user).find(q=>!q.isP&&!q.ys);const Y=G.year;const B=(y,lvl,pa,h,hr)=>Object.assign({},ZB,{y,lvl,t:G.user,g:30,pa,ab:pa-5,h,hr,bb:5,so:20,d:5,tr:0,r:10,rbi:12,sb:1});q.hist=[B(Y-1,'1군',300,80,10),B(Y-2,'1군',200,50,5),B(Y-1,'퓨처스',100,30,4),B(Y-2,'퓨처스',150,40,6)];q.prev=null;q.am=null;UI.cLvl=undefined;A.player(q.id);return q.id;});
 const rows=()=>p.evaluate(()=>[...document.querySelectorAll('.sheet .tw table:not(.sqt), .pf-season-table .tw table:not(.sqt)')].slice(0,1).flatMap(t=>[...t.querySelectorAll('tbody tr')].map(r=>r.children[1].textContent+'|'+r.children[13]?.textContent)));
 await p.evaluate(()=>{const b=document.querySelector('[data-a="ptab"][data-v="stats"],[data-a="ptab"][data-v="rec"]');if(b)b.click();});
 let R=await rows();
 if(!R.length){ const tabs=await p.evaluate(()=>[...document.querySelectorAll('[data-a="ptab"]')].map(b=>b.dataset.v+':'+b.textContent)); throw Error('기록 표를 찾지 못함 '+tabs.join(',')); }
 assert.ok(R.some(r=>r.startsWith('1군 합계'))&&!R.some(r=>r.startsWith('2군 합계'))&&!R.some(r=>/ F\|/.test(r)),'1군만 기본 '+R);
 assert.ok(R.find(r=>r.startsWith('1군 합계')).endsWith('|15'),'1군 합계 홈런 15 '+R);
 await shot('career-1');
 await p.locator('[data-a="opt"][data-k="cLvl"][data-v="2"]').first().click();R=await rows();
 assert.ok(R.some(r=>r.startsWith('2군 합계|10'))||R.find(r=>r.startsWith('2군 합계')).endsWith('|10'),'2군만 합계 '+R);assert.ok(!R.some(r=>r.startsWith('1군 합계'))&&R.filter(r=>/ F\|/.test(r)).length===2,'2군만 '+R);
 await p.locator('[data-a="opt"][data-k="cLvl"][data-v="all"]').first().click();R=await rows();
 assert.ok(R.some(r=>r.startsWith('1군 합계'))&&R.some(r=>r.startsWith('2군 합계'))&&R.length===6,'2군 포함 '+R);
 await shot('career-all');
 assert.equal(await p.evaluate(()=>UI.cLvl),'all','선택이 UI 상태에 남음');
 assert.deepEqual(errors,[]);console.log(width+'×'+height+' 관심 선수 잠재력·매물/불가 표시·매물만·불가 숨김·통산 범위 통과');await c.close();
}
}finally{await browser?.close();await server.close();}console.log('small0b 검사 통과');})().catch(e=>{console.error(e.stack);process.exitCode=1;});
