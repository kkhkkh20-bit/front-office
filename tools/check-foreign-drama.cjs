/* 외국인 선수 사건(사용자 11-12): 향수병 결정 메일이 소식함에 뜨고, 선택하면 결과가 붙고, 선수 화면에 오류가 없다 */
const {chromium}=require('playwright');const {startHtmlServer}=require('./lib/ui-server.cjs');
const ok=(c,m)=>{ console.log((c?'통과':'실패')+' '+m); if(!c)process.exitCode=1; };
(async()=>{const server=await startHtmlServer(require('path').resolve(__dirname,'../index.html'));const b=await chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{});
for(const vp of [{width:1366,height:900},{width:390,height:844}]){ const p=await b.newPage({viewport:vp}); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
await p.goto(server.url);await p.waitForFunction(()=>typeof newGame==='function');
const r=await p.evaluate(()=>{ localStorage.clear(); DEMO.on=false; newGame(3); try{hireMgr(G.mmarket[0].id,3);}catch(e){} G.tut={done:true,step:99}; G.medSet=true; UI.title=false; G.day=G.cal.open+40;
  let f=foreignOf(G.user).find(x=>x.foreign==='용병'); if(!f){ f=newForeign('용병',{isP:true}); f.team=G.user; f.fy=G.year; } fDramaUser(f,'home'); const e=G.evs.find(x=>x.k==='fdrama'&&!x.done); UI.tab='inbox'; render(); return {pid:f.id,eid:e&&e.id,mid:e&&e.mid,name:f.name}; });
ok(!!r.eid,'향수병 결정 생성');
const html=await p.evaluate(()=>document.body.innerText);
ok(html.includes('향수병')||html.includes(r.name),'소식함에 사건이 보임');
const res=await p.evaluate(id=>{ const e=G.evs.find(x=>x.id===id); const msg=evPick(id,e.data.keys.indexOf('family')); render(); return {msg,done:e.done}; },r.eid);
ok(res.done&&res.msg,'선택 결과 '+res.msg);
await p.evaluate(id=>{ try{ A.player(id); }catch(e){ UI.sheet=id; render(); } },r.pid); await p.waitForTimeout(300);
const txt=await p.evaluate(()=>document.body.innerText); ok(/평판|프로의식|적응/.test(txt),'선수 화면 표시');
await p.screenshot({path:require('path').resolve(process.env.SHOT_DIR||'/tmp','fdrama_'+vp.width+'.png')});
ok(errs.length===0,'페이지 오류 없음 '+vp.width+' '+errs.join('|')); await p.close(); }
await b.close();await server.close();})().catch(e=>{console.error(e);process.exit(1);});
