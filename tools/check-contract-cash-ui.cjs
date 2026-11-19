/* 다년계약 협상 화면의 연도별 지출 줄(외부 검수 11-17 P2): 3칸 협상 화면 왼쪽 보고서에 접는 줄로 연도별 지출이 보이고,
 펼치면 계약금·연봉·옵션(달성 시)·상한 반영액이 따로 적히는지, 넓은 화면에서 페이지 전체가 스크롤되지 않는지 본다. 사용: node tools/check-contract-cash-ui.cjs */
const {chromium}=require('playwright');const {startHtmlServer}=require('./lib/ui-server.cjs');
const ok=(c,m)=>{ console.log((c?'통과':'실패')+' '+m); if(!c)process.exitCode=1; };
(async()=>{const server=await startHtmlServer(require('path').resolve(__dirname,'../index.html'));const b=await chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{});
for(const vp of [{width:1366,height:800,pc:true},{width:390,height:844}]){
 const ctx=await b.newContext({viewport:{width:vp.width,height:vp.height}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route(/fonts\.g/,r=>r.abort());
 await p.goto(server.url);await p.waitForFunction(()=>performance.getEntriesByName('fronttime-menu-ready').length>0);await p.waitForFunction(()=>typeof newGame==='function');
 const r=await p.evaluate(()=>{ localStorage.clear(); DEMO.on=false; newGame(6); try{ hireMgr(G.mmarket[0].id,3); }catch(e){} G.tut={done:true,step:99}; G.medSet=true; UI.title=false; render();
   const L=playersOf(G.user).filter(p=>canExtend(p)&&!p.foreign).sort((a,b)=>ovr(b)-ovr(a)); if(!L.length)return {skip:'다년계약 대상 없음'}; const pl=L[0];
   A.player(pl.id); A.ngtOpen('ext:'+pl.id); const T=UI.ngt.T; T.years=3; T.annual=500; T.bonus=1500; T.opt=100; render();
   const s=document.querySelector('#sheet .ng-rep .ng-cash'); if(!s)return {none:true};
   const sum=s.querySelector('summary').innerText; s.open=true; const li=[...s.querySelectorAll('li')].map(x=>x.innerText.replace(/\s+/g,' ')); const note=s.querySelector('p').innerText;
   const de=document.scrollingElement; const rep=document.querySelector('#sheet .ng-rep').getBoundingClientRect(), sh=document.querySelector('#sheet .ngt').getBoundingClientRect();
   const exp=[...new Set(ctCashYears(T,ngtSeasons(UI.ngt)[0]).map(x=>money(x.v)))];
   return {sum,li,note,exp,m:{b:money(T.bonus),a:money(T.annual),o:money(T.opt),c:money(T.annual+Math.round(T.bonus/3))},pageScroll:de.scrollHeight-innerHeight,hScroll:de.scrollWidth-innerWidth,repIn:rep.bottom<=innerHeight+1,sheetIn:sh.bottom<=innerHeight+1};
 });
 const tag=vp.pc?'PC':'휴대폰';
 if(r.skip){ ok(false,tag+' 준비: '+r.skip); await ctx.close(); continue; }
 ok(!r.none,tag+' 연도별 지출 줄이 있음');
 if(!r.none){
  ok(/연도별 지출/.test(r.sum)&&r.sum.split('/').length>=3&&r.exp.every(x=>r.sum.includes(x)),tag+' 접은 줄에 연도별 금액이 / 로 나뉨: '+r.sum);
  ok(r.li.length>=3,tag+' 펼치면 연도마다 한 줄: '+r.li.length);
  ok(r.li.some(x=>x.includes('계약금 '+r.m.b))&&r.li.some(x=>x.includes('연봉 '+r.m.a)),tag+' 계약금·연봉을 나눠 적음: '+r.li.join(' | '));
  ok(r.li.some(x=>x.includes('옵션(달성 시) 최대 +'+r.m.o)),tag+' 옵션(달성 시)을 따로 적음');
  ok(r.li.filter(x=>x.includes('상한 반영 '+r.m.c)).length===3,tag+' 계약 시즌마다 상한 반영액을 따로 적음');
  ok(/합의 때 바로 지급/.test(r.note),tag+' 계약금 지급 시점 안내');
  ok(r.hScroll<=1,tag+' 가로 스크롤 없음 '+r.hScroll);
  if(vp.pc){ ok(r.pageScroll<=1,'PC 페이지 전체 스크롤 없음 '+r.pageScroll); ok(r.sheetIn&&r.repIn,'PC 협상 창·보고서가 화면 안'); }
 }
 if(process.env.SHOT)await p.screenshot({path:process.env.SHOT+'-'+vp.width+'.png'});
 ok(errs.length===0,tag+' 페이지 오류 없음 '+errs.join('|')); await ctx.close(); }
await b.close();await server.close();})().catch(e=>{console.error(e);process.exit(1);});
