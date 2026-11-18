/* 감독·구단주 갈등 화면(11-12): 시즌 구상 결정 카드·주간 회의 안건·경질 요청(구단주 동의) 화면이 오류 없이 그려진다. 사용: node tools/check-mgr-conflict.cjs */
const {chromium}=require('playwright');const {startHtmlServer}=require('./lib/ui-server.cjs');
const ok=(c,m)=>{ console.log((c?'통과':'실패')+' '+m); if(!c)process.exitCode=1; };
(async()=>{const server=await startHtmlServer(require('path').resolve(__dirname,'../index.html'));const b=await chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{});
for(const w of [1366,390]){ const ctx=await b.newContext({viewport:{width:w,height:820}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route(/fonts\.g/,r=>r.abort());
await p.goto(server.url);await p.waitForFunction(()=>typeof newGame==='function');
await p.evaluate(()=>{ localStorage.clear(); DEMO.on=false; newGame(6); try{hireMgr(G.mmarket[0].id,3);}catch(e){} G.tut={done:true,step:99}; G.medSet=true; UI.title=false; G.day=G.cal.exh+1; G.evs=[]; mcfPlan(); render(); });
const r1=await p.evaluate(()=>{ const e=G.evs.find(x=>x.k==='mplan'); UI.tab='inbox'; render(); return {e:!!e,opts:e?e.opts.length:0,txt:document.body.innerText.includes('시즌 구상')}; });
ok(r1.e&&r1.opts>=2&&r1.txt,w+' 시즌 구상 결정이 소식함에 보임 '+JSON.stringify(r1));
const r2=await p.evaluate(()=>{ const e=G.evs.find(x=>x.k==='mplan'); A.evPick(e.id+':'+(e.opts.length-1)); return {done:e.done,res:e.res}; });
ok(r2.done,w+' 구상 결정 처리 '+JSON.stringify(r2));
const r3=await p.evaluate(()=>{ G.day=G.cal.open+30; const d=depth(G.user); const q=d.start[0]; q.hist=(q.hist||[]).filter(h=>!(h.y===G.year&&h.lvl==='1군')); q.hist.push({y:G.year,lvl:'1군',tid:G.user,g:30,pa:110,ab:100,h:12,d:1,tr:0,hr:0,bb:8,hbp:0,sf:2,so:40,rbi:3}); mcfWeek(); UI.tab='inbox'; render(); const e=G.evs.find(x=>x.k==='magd'&&!x.done); return {e:!!e,t:e&&e.title,txt:document.body.innerText.includes('주간 회의 안건')}; });
ok(r3.e&&r3.txt,w+' 주간 회의 안건 표시 '+JSON.stringify(r3));
const r4=await p.evaluate(()=>{ G.mgr[G.user].hD=G.day-5; A.go('staff:mgr'); render(); A.fireAsk(); render(); const t=document.body.innerText; return {msg:G.mcf&&G.mcf.fire&&G.mcf.fire.k, req:t.includes('구단주 동의'), cf:!!UI.confirmFire}; });
ok(r4.msg==='no'&&r4.req&&!r4.cf,w+' 경질 요청: 구단주 반대가 화면에 보이고 확인 단계로 가지 않음 '+JSON.stringify(r4));
/* 검수 11-17 #244: 구단주가 반대한 뒤 새 감독 선임(= 현 감독 경질)은 결재로 넘어가지 않고 막힌다. #251: 동의 뒤 결재 문서 연봉은 영입 약속 할증을 포함한다 */
const r5=await p.evaluate(()=>{ const cur=G.mgr[G.user].id, s0=G.spend.mgr||0; const c=G.mmarket.find(x=>x.id!==cur); UI.cfm=null; UI.mplSel=[]; A.go('staff:mgr'); A.hireMgr(c.id+':2:0'); const blocked={cfm:!!UI.cfm,same:G.mgr[G.user].id===cur,spend:(G.spend.mgr||0)===s0,msg:String(UI.mgrMsg||'')};
  mcf().fire={k:'ok',day:G.day,until:G.day+14,msg:'동의'}; c.ego=65; UI.mplSel=['listen']; A.hireMgr(c.id+':3:0'); const d=UI.cfm&&UI.cfm.doc; const want=mplSal(c,['listen']); const line=d?d.lines[0]:''; const btn=!!document.querySelector('.cfm [data-a="cfmOk"]');
  if(UI.cfm)A.cfmOk(); const hired=G.mgr[G.user]; return {blocked,line,want:money(want),btn,sal:hired.id===c.id?hired.sal:null,wantN:want}; });
ok(!r5.blocked.cfm&&r5.blocked.same&&r5.blocked.spend&&/반대/.test(r5.blocked.msg),w+' 구단주 반대 뒤 감독 선임 결재가 막힘 '+JSON.stringify(r5.blocked));
ok(r5.btn&&r5.line.includes(r5.want)&&/할증/.test(r5.line)&&r5.sal===r5.wantN,w+' 결재 문서 연봉이 약속 할증 포함 실제 계약과 같음 '+JSON.stringify(r5));
ok(errs.length===0,w+' 페이지 오류 없음 '+errs.join('|'));
await ctx.close(); }
await b.close();await server.close();})().catch(e=>{console.error(e);process.exit(1);});
