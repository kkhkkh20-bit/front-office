/* FA 협상 제안 전 경고·확인창·남은 제안 횟수/분위기 표시·원소속 유예(운영 결정 2026-11-17).
 PC 1366·휴대폰 390에서: 예상 반응 문구가 엔진 미리보기(faPreview)와 같고, 결렬될 조건은 확인창이 뜨며 '조건 다시 보기'는 보내지 않고,
 '그래도 보내기'는 보내서 원소속 유예(14일 중단) 안내와 재개일·규칙이 보이는지 본다. 사용: node tools/check-fa-grace-ui.cjs (SHOT=경로 앞부분이면 화면 저장) */
const {chromium}=require('playwright');const {startHtmlServer}=require('./lib/ui-server.cjs');
const ok=(c,m)=>{ console.log((c?'통과':'실패')+' '+m); if(!c)process.exitCode=1; };
(async()=>{const server=await startHtmlServer(require('path').resolve(__dirname,'../index.html'));const b=await chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{});
for(const vp of [{width:1366,height:800,pc:true},{width:390,height:844}]){ const tag=vp.pc?'PC':'휴대폰';
 const ctx=await b.newContext({viewport:{width:vp.width,height:vp.height}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route(/fonts\.g/,r=>r.abort());
 await p.goto(server.url);await p.waitForFunction(()=>performance.getEntriesByName('fronttime-menu-ready').length>0);await p.waitForFunction(()=>typeof newGame==='function');
 const id=await p.evaluate(()=>{ localStorage.clear(); DEMO.on=false; newGame(6); try{ hireMgr(G.mmarket[0].id,3); }catch(e){} G.tut={done:true,step:99}; G.medSet=true; UI.title=false;
   G.fa={pool:[],offers:{},ai:{},open:true,openDay:G.day-20,closed:false,results:[],cap:3,outN:{},y0:G.year};
   const q=newPlayer({age:29,isP:false,base:60,pot:62,team:G.user}); q.team=null; q.faFrom=G.user; q.faGrade='A'; q.faPrevSal=500; q.sal=500; q.ask={annual:900,years:4}; q.ask0=900; G.fa.pool.push(q.id); G.fa.ai[q.id]={};
   const A0=agInit(); q.agId=A0.findIndex(a=>a.style==='rel'&&a.size!=='big'); negOf(q.id).mood=34; render(); A.ngtOpen('fa:'+q.id); return q.id; });
 const shot=async k=>{ if(process.env.SHOT)await p.screenshot({path:`${process.env.SHOT}-${vp.width}-${k}.png`}); };
 const kpi=await p.evaluate(()=>[...document.querySelectorAll('#sheet .ng-kp')].map(x=>x.innerText.replace(/\s+/g,' ')));
 ok(kpi.some(x=>/남은 제안 횟수/.test(x)&&/\d+회/.test(x))&&kpi.some(x=>/협상 분위기/.test(x)&&/34 · 결렬 직전/.test(x)),tag+' 남은 제안 횟수·분위기(라벨) 표시: '+kpi.join(' | '));
 /* 요구의 60%로 낮춘다: 결렬 위험 */
 const g=await p.evaluate(()=>{ const N=UI.ngt; N.T.annual=Math.round(N.T.annual*.45); N.T.bonus=Math.round((N.T.bonus||0)*.45); renderSheet(); const P=ngtPrev(N); const el=document.querySelector('#sheet .ng-gap'); return {txt:el&&el.innerText.replace(/\s+/g,' '),exp:faPreviewTxt(P),brk:P.brk}; });
 ok(g.brk&&g.txt.includes(g.exp)&&/결렬 위험\(분위기 −25, 지금 분위기 34 → 결렬\)/.test(g.txt),tag+' 제안 전 예상 반응이 엔진 미리보기와 같음: '+g.txt);
 await shot('warn');
 const sub=p.locator('#sheet [data-a="ngtSubmit"]'); await sub.scrollIntoViewIfNeeded(); await sub.click();
 const dlg=p.locator('#cfm [role="dialog"]'); await dlg.waitFor({timeout:3000}).catch(()=>{});
 const dt=await dlg.innerText().catch(()=>''); ok(/이 조건이면 협상이 결렬될 수 있습니다\. 보내시겠습니까\?/.test(dt)&&/원소속 구단이라/.test(dt),tag+' 확인창: '+dt.replace(/\s+/g,' ').slice(0,160));
 const box=await dlg.boundingBox(); ok(box&&box.x>=0&&box.x+box.width<=vp.width+1,tag+' 확인창이 화면 안');
 await shot('confirm');
 await p.click('#cfm [data-a="cfmNo"]'); const n1=await p.evaluate(i=>({log:(G.fa.neg[i].log||[]).length,cfm:!!document.querySelector('#cfm [role="dialog"]')}),id);
 ok(n1.log===0&&!n1.cfm,tag+' 조건 다시 보기: 보내지 않음');
 await sub.click(); await p.locator('#cfm [data-a="cfmOk"]').click();
 const s=await p.evaluate(i=>{ const n=G.fa.neg[i]; const r=document.querySelector('#sheet .ng-res'); return {closed:n.closed,fold:n.fold,day:G.day,mood:n.mood,res:r&&r.innerText.replace(/\s+/g,' '),kpi:[...document.querySelectorAll('#sheet .ng-kp')].map(x=>x.innerText.replace(/\s+/g,' ')),mail:(G.mail||[]).some(m=>/결재/.test(m.subj||''))}; },id);
 ok(!s.closed&&s.fold===s.day+14&&s.mood===30,tag+' 그래도 보내기: 원소속 유예(14일 중단·분위기 30)');
 ok(/원소속 구단이라 한 번 더 기회/.test(s.res||'')&&/부터 다시 제안할 수 있습니다/.test(s.res)&&/14일 협상 중단/.test(s.res)&&/45일\+14일/.test(s.res),tag+' 재개일·규칙 안내: '+s.res);
 ok(s.kpi.some(x=>/중단/.test(x)),tag+' 남은 제안 칸에 중단 표시: '+s.kpi.join(' | ')); ok(!s.mail,tag+' 확인창이 결재 소식을 남기지 않음');
 await shot('grace');
 /* 두 번째 결렬: 원래 규칙 */
 const c=await p.evaluate(i=>{ G.day=G.fa.neg[i].fold; const N=UI.ngt; N.res=null; renderSheet(); UI._cfmPass=true; try{ A.ngtSubmit(); }finally{ UI._cfmPass=false; } const r=document.querySelector('#sheet .ng-res'); const a=document.querySelector('#sheet .ng-acts .note'); return {closed:G.fa.neg[i].closed,res:r&&r.innerText.replace(/\s+/g,' '),acts:a&&a.innerText}; },id);
 ok(c.closed&&/협상 결렬/.test(c.res||'')&&/시장 개장 45일 뒤/.test(c.res)&&/마지막 협상 14일 뒤/.test(c.res),tag+' 두 번째 결렬: 결렬 규칙과 재개일: '+c.res);
 await shot('closed');
 const h=await p.evaluate(()=>document.scrollingElement.scrollWidth-innerWidth); ok(h<=1,tag+' 가로 스크롤 없음 '+h);
 ok(errs.length===0,tag+' 페이지 오류 없음 '+errs.join('|')); await ctx.close(); }
await b.close();await server.close();})().catch(e=>{console.error(e);process.exit(1);});
