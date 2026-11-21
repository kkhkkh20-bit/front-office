/* 치명 실수 경고(사용자 11-21 "용병 교체 못하는 기간에는 용병 방출할 때 경고문을 주고"):
   1) 8월 15일 뒤 선수 상세에서 외국인 선수 방출을 누르면 경고 문장과 '그래도 방출'이 나오고, 취소하면 선수가 그대로 남는다
   2) 외국인 시장 방출 결재 창도 같은 경고를 띄우고, 취소하면 그대로 남는다
   3) 경고할 일이 없는 국내 선수 방출에는 경고가 없다 · 390px 가로 넘침 없음
   사용: CHROMIUM_EXECUTABLE_PATH=/opt/pw-browsers/chromium node tools/check-critical-warn-1121.cjs */
const {chromium}=require('playwright');const {startHtmlServer}=require('./lib/ui-server.cjs');
const ok=(c,m)=>{ console.log((c?'통과':'실패')+' '+m); if(!c)process.exitCode=1; };
(async()=>{const server=await startHtmlServer(require('path').resolve(__dirname,'../index.html'));
const b=await chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{});
for(const vp of [{width:1280,height:900},{width:390,height:844}]){
const p=await (await b.newContext({viewport:vp})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route(/fonts\.g/,r=>r.abort());
await p.goto(server.url);await p.waitForFunction(()=>performance.getEntriesByName('fronttime-menu-ready').length>0);await p.waitForFunction(()=>typeof newGame==='function');
const fid=await p.evaluate(()=>{ localStorage.clear(); DEMO.on=false; newGame(4); try{ fdStart(); fdAdvance(false); let n=0; while(G.fd&&!G.fd.done&&n++<400)fdAdvance(true); }catch(e){} UI.title=false; CUR_SLOT=1; SLOT_REV=0; SLOT_NEW=true;
  G.day=foreignDL()+1; G.sea=Object.assign(G.sea||{},{y:G.year}); let f=foreignOf(G.user).find(x=>x.foreign==='용병'); if(!f){ f=newForeign('용병'); f.team=G.user; f.sal=f.ask; } render(); A.player(f.id); return f.id; });
const tag=vp.width+'px';
const mg=()=>p.locator('#sheet [data-a="ptab"][data-v="mgmt"]:visible').first().click();
await mg();
await p.locator(`#sheet [data-a="relAsk"][data-v="${fid}"]:visible`).first().click(); await p.waitForTimeout(150);
const s1=await p.evaluate(()=>{ const w=document.querySelector('#sheet .rel-warn'); const btn=document.querySelector('#sheet [data-a="release"]'); const sh=document.getElementById('sheet');
  return {w:w?w.textContent:'',btn:btn?btn.textContent:'',over:document.documentElement.scrollWidth>innerWidth+1||(w&&w.getBoundingClientRect().right>innerWidth+1)}; });
ok(/새로 데려올 수 없습니다/.test(s1.w)&&/8월 15일/.test(s1.w)&&/그래도 방출할까요/.test(s1.w),`${tag} 선수 상세: 마감 뒤 외국인 방출 경고 `+s1.w);
ok(/그래도 방출/.test(s1.btn),`${tag} 확인 버튼이 '그래도 방출' `+s1.btn);
ok(!s1.over,`${tag} 경고가 가로로 넘치지 않음`);
{ const c=p.locator('#sheet [data-a="relCancel"]:visible').first(); await c.evaluate(e=>e.scrollIntoView({block:'center'})); await p.waitForTimeout(300); await c.click(); await p.waitForTimeout(150); } /* 휴대폰: 아래 탭 막대 뒤에 걸리지 않게 가운데로 */
{ const r=await p.evaluate(id=>({team:G.players[id]&&G.players[id].team===G.user,warn:!!document.querySelector('#sheet .rel-warn'),c:UI.confirmRel}),fid); ok(r.team&&!r.warn,`${tag} 취소하면 선수가 그대로 남음 `+JSON.stringify(r)); }
/* 외국인 시장 방출 결재 창 */
await p.evaluate(()=>{ closeSheets(); render(); });
await p.evaluate(id=>A.relNow(String(id)),fid); await p.waitForTimeout(100);
const s2=await p.evaluate(()=>{ const c=document.querySelector('#cfm .cfm'); return c?{x:(c.querySelector('.cfm-x')||{}).textContent||'',ok:(c.querySelector('[data-a="cfmOk"]')||{}).textContent||''}:null; });
ok(s2&&/새로 데려올 수 없습니다/.test(s2.x)&&/그래도 방출/.test(s2.ok),`${tag} 외국인 시장 방출 결재 창 경고 `+JSON.stringify(s2));
await p.click('#cfm [data-a="cfmNo"]'); await p.waitForTimeout(100);
ok(await p.evaluate(id=>G.players[id].team===G.user&&!document.querySelector('#cfm .cfm'),fid),`${tag} 결재 창 취소하면 선수가 그대로 남음`);
/* 경고할 일이 없는 국내 선수 */
const did=await p.evaluate(()=>{ const q=domestic(G.user).find(x=>!x.ys&&x.isP&&!x.faC&&!x.extNext); A.player(q.id); return q.id; });
await mg();
await p.locator(`#sheet [data-a="relAsk"][data-v="${did}"]:visible`).first().click(); await p.waitForTimeout(100);
ok(await p.evaluate(()=>!document.querySelector('#sheet .rel-warn')&&/정말 방출/.test((document.querySelector('#sheet [data-a="release"]')||{}).textContent||'')),`${tag} 경고할 일이 없는 방출에는 경고 없음`);
await p.locator('#sheet [data-a="relCancel"]:visible').first().click();
ok(errs.length===0,`${tag} 페이지 오류 없음 `+errs.slice(0,3).join('|'));
await p.context().close(); }
await b.close();await server.close();})().catch(e=>{console.error(e);process.exit(1);});
