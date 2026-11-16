// 화면 맞춤 전수 점검(UI 3단계 3-0, docs/design/ui-noscroll-sweep-2026-11-17.md). node tools/measure-ui-fit.cjs <outDir> [phases=mid,off] [sizes=1366x768,...]
// 각 화면: 페이지 넘침(px), 안쪽 스크롤 칸 수, 잘린 상자 수, 겹친 상자 쌍 수, 빈 늘어남 비율. 스크린샷(DSF 1, SHOTDSF로 변경).
const fs=require('fs'),path=require('path');
const ROOT=require('path').resolve(__dirname,'..');const [OUT,PH,SZ]=process.argv.slice(2);
const {chromium}=require('playwright');const {startHtmlServer}=require('./lib/ui-server.cjs');
const ST=process.env.STATE_DIR||path.join(require('os').tmpdir(),'ui-density'); /* state-mid.json·state-off.json(measure-ui-density.cjs가 만든 상태) 폴더 */
const phases=(PH||'mid,off').split(','),sizes=(SZ||'1366x768,1440x900,1874x915,1920x1080,390x844').split(',').map(s=>s.split('x').map(Number));
fs.mkdirSync(OUT,{recursive:true});
const SHEETS=[
 ['sheet-player-own-p',"A.player(domestic(G.user).filter(p=>p.isP).sort((a,b)=>ovr(b)-ovr(a))[0].id)"],
 ['sheet-player-own-h',"A.player(domestic(G.user).filter(p=>!p.isP).sort((a,b)=>ovr(b)-ovr(a))[0].id)"],
 ['sheet-player-other',"A.player(Object.values(G.players).find(p=>p.team!=null&&p.team!==G.user&&!p.foreign&&ovr(p)>=50).id)"],
 ['sheet-mgr',"A.person('mgr')"],
 ['sheet-coach',"A.person('c:'+Object.keys(coachesOf(G.user)).find(k=>coachesOf(G.user)[k]))"],
 ['sheet-coach2',"A.person('c:'+Object.keys(coachesOf(G.user)).filter(k=>coachesOf(G.user)[k])[3])"],
 ['sheet-scout',"A.person('sc:'+(G.scouts||[])[0].id)"],
 ['sheet-analyst',"A.person('an:'+(G.analysts||[])[0].id)"],
 ['sheet-owner',"A.person('own')"],
 ['sheet-team',"A.lteamGo(G.teams.find(t=>t.id!==G.user).id)"],
 ['sheet-trade',"A.toTrade(Object.values(G.players).find(p=>p.team!=null&&p.team!==G.user&&!p.foreign&&ovr(p)>=50).id)"],
 ['sheet-neg-ext',"const q=domestic(G.user).find(p=>typeof canExtend==='function'&&canExtend(p))||domestic(G.user)[0];A.ngtOpen('ext:'+q.id)"],
 ['sheet-neg-fa',"const id=(G.fa&&G.fa.pool||[]).find(i=>G.players[i]&&G.players[i].team==null);if(id==null)throw new Error('no fa');A.ngtOpen('fa:'+id)"],
 ['sheet-match-entry',"A.tab('home');A.matchOpen()"],
 ['sheet-menu',"UI.menu=true;renderSheet()"],
];
const MET=()=>{
  const H=innerHeight,W=innerWidth;const sheet=document.querySelector('#sheet');const sheetOn=sheet&&sheet.querySelector('.sheet,.scrim,.ngt,.negw')&&sheet.getBoundingClientRect().height>50;
  const root=sheetOn?sheet:document.querySelector('#app');
  const vis=e=>{const r=e.getBoundingClientRect();if(r.width<2||r.height<2)return false;const s=getComputedStyle(e);return s.visibility!=='hidden'&&s.display!=='none';};
  const docOver=document.scrollingElement.scrollHeight-H;
  const sc=[];for(const e of root.querySelectorAll('*')){const s=getComputedStyle(e);if(!/(auto|scroll)/.test(s.overflowY))continue;if(e.scrollHeight<=e.clientHeight+4||e.clientHeight<30||!vis(e))continue;sc.push(e);}
  // 주 스크롤: 가장 큰 스크롤 칸이 화면의 60% 이상이면 페이지로 본다
  const big=[...sc].sort((a,b)=>b.clientHeight*b.clientWidth-a.clientHeight*a.clientWidth)[0];
  /* 화면 전체 스크롤(구단주 11-17): 문서, 본문(#app main.content), 상세 창(#sheet .sheet)이 내려가는 것만 센다. 상자 안 스크롤은 괜찮다 */
  const pageEls=[document.querySelector('#app main.content'),sheetOn?document.querySelector('#sheet .sheet'):null].filter(Boolean);
  /* 본문 전체를 감싼 칸(본문 넓이·높이의 85% 이상)이 스크롤하면 그것도 화면 전체 스크롤로 본다 */
  for(const base of [...pageEls]){const R=base.getBoundingClientRect();for(const e of sc){const r=e.getBoundingClientRect();if(base.contains(e)&&r.width>=R.width*.85&&r.height>=Math.min(R.height,H-R.top)*.85)pageEls.push(e);}}
  const mainSc=pageEls.filter(e=>e.scrollHeight>e.clientHeight+4).sort((a,b)=>(b.scrollHeight-b.clientHeight)-(a.scrollHeight-a.clientHeight))[0]||null;
  const pageOver=Math.max(docOver,mainSc?mainSc.scrollHeight-mainSc.clientHeight:0);
  const inner=sc.filter(e=>e!==mainSc);
  const cls=e=>e.tagName.toLowerCase()+(typeof e.className==='string'&&e.className?'.'+e.className.trim().split(/\s+/).slice(0,2).join('.'):'');
  const PANEL='.card,.ws-panel,.hw-panel,.panel,section,.md-panel,.tcard,.pc-card';
  const panels=[...root.querySelectorAll(PANEL)].filter(e=>vis(e)&&!e.closest('header.top,.bnav,.fm-side,.fmside')&&e.getBoundingClientRect().width>120&&e.getBoundingClientRect().height>40);
  const clipped=panels.filter(e=>{const s=getComputedStyle(e);return /(hidden|clip)/.test(s.overflowY)&&e.scrollHeight>e.clientHeight+6&&!sc.includes(e);});
  // 화면 밖으로 잘린 상자(뷰포트 아래로 나간 고정 높이 틀 안)
  let overlap=0;const ov=[];const top=panels.filter(e=>!panels.some(o=>o!==e&&o.contains(e)));
  for(let i=0;i<top.length;i++)for(let j=i+1;j<top.length;j++){const a=top[i].getBoundingClientRect(),b=top[j].getBoundingClientRect();const x=Math.min(a.right,b.right)-Math.max(a.left,b.left),y=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);if(x>8&&y>8){overlap++;if(ov.length<4)ov.push(cls(top[i])+'×'+cls(top[j]));}}
  // 빈 늘어남: 200px 넘는 상자에서 내용 아래 빈 높이 비율
  let maxEmpty=0,emptyN=0,emptyL=[];
  for(const e of top){const r=e.getBoundingClientRect();if(r.height<200)continue;let bottom=r.top;for(const c of e.querySelectorAll('*')){if(!c.getClientRects().length)continue;const cr=c.getBoundingClientRect();if(cr.height<1||cr.bottom>r.bottom+1)continue;if(cr.bottom>bottom)bottom=cr.bottom;}
    const ratio=(r.bottom-bottom)/r.height;if(ratio>maxEmpty)maxEmpty=ratio;if(ratio>.35){emptyN++;if(emptyL.length<4)emptyL.push(cls(e)+':'+Math.round(ratio*100)+'%');}}
  return {sheet:!!sheetOn,pageOver,docOver,inner:inner.length,innerL:inner.slice(0,6).map(e=>cls(e)+' '+e.scrollHeight+'/'+e.clientHeight),clipped:clipped.length,clipL:clipped.slice(0,5).map(e=>cls(e)+' '+e.scrollHeight+'/'+e.clientHeight),overlap,ovL:ov,maxEmpty:+maxEmpty.toFixed(2),emptyN,emptyL};
};
(async()=>{const srv=await startHtmlServer(ROOT+'/index.html');const b=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});const res=[];
 const ctx=await b.newContext({viewport:{width:1366,height:768},deviceScaleFactor:+(process.env.SHOTDSF||1)});const p=await ctx.newPage();p.setDefaultTimeout(30000);
 await p.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));await p.route('https://www.googletagmanager.com/**',r=>r.fulfill({body:'',contentType:'text/javascript'}));
 await p.goto(srv.url,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>typeof newGame==='function');await p.waitForTimeout(800);
 const ONLY=process.env.ONLY?process.env.ONLY.split(','):null;
 for(const ph of phases){const base=fs.readFileSync(ST+'/state-'+ph+'.json','utf8');
  await p.evaluate(b=>{DEMO.on=false;G=JSON.parse(b);UI.title=false;UI.menu=false;closeSheets();UI.tab='home';render();},base);
  const routes=await p.evaluate(()=>{const L=[];for(const [t] of NAV){L.push(t);for(const [s] of (SUBS[t]||[]))L.push(t+':'+s);}for(const k of Object.keys(typeof MFOLD!=='undefined'?MFOLD:{}))L.push(k);return [...new Set(L)];});
  const screens=[...routes.map(r=>['tab-'+r.replace(':','-'),`A.go('${r}')`]),...SHEETS].filter(([n])=>!ONLY||ONLY.includes(n));
  for(const [w,h] of sizes){await p.setViewportSize({width:w,height:h});
   for(const [name,code] of screens){
    try{await p.evaluate(([b,code])=>{DEMO.on=false;G=JSON.parse(b);UI.title=false;UI.menu=false;UI.ngt=null;UI.negWin=null;UI.person=null;UI.teamSh=null;closeSheets();UI.tab='home';render();new Function(code)();},[base,code]);
     await p.waitForTimeout(450);const m=await p.evaluate(MET);
     const file=`${ph}-${w}x${h}-${name}.png`;await p.screenshot({path:path.join(OUT,file)});
     res.push({ph,w,h,name,file,...m});process.stdout.write(`${ph} ${w}x${h} ${name} over ${m.pageOver} inner ${m.inner} clip ${m.clipped} ovl ${m.overlap} empty ${m.maxEmpty}\n`);
    }catch(e){res.push({ph,w,h,name,err:e.message.slice(0,120)});console.log('ERR',ph,w,name,e.message.slice(0,100));}
   }}
 }
 fs.writeFileSync(path.join(OUT,process.env.JSON_NAME||'sweep.json'),JSON.stringify(res,null,1));await b.close();await srv.close();})().catch(e=>{console.error(e);process.exit(1);});
