/* UI 밀도 측정(3단계 계획용, docs/design/ui-phase3-plan-2026-11-16.md).
   node tools/measure-ui-density.cjs <mid|off|new>  (OUT=저장 폴더, SHOT=1이면 스크린샷, 기본 deviceScaleFactor 2)
   mid: 6구단 창단 → 2026-06-20, off: 2026-11-06(스토브리그), new: 첫 실행(타이틀·창단 지명·첫 홈).
   상태는 OUT/state-<phase>.json에 남겨 다음 실행에서 다시 쓴다. 결과는 OUT/metrics-<phase>.json.
   지표: 본문 조작 요소(첫 화면/전체), 강조 버튼, 첫 화면 글자 수, 12px 미만 글자, 잘린 글, 빈 상태 문구,
   안쪽 스크롤 칸, 화면보다 넓은 표, 카드 스타일 수, 화면 길이(뷰포트 배수). 테스트가 아니라 측정만 한다. */
const path=require('path'),fs=require('fs');
const ROOT=path.resolve(__dirname,'..');
const {chromium}=require('playwright');const {startHtmlServer}=require('./lib/ui-server.cjs');
const ONLY=process.env.ONLY?process.env.ONLY.split(','):null; /* ONLY=home,transfer-fa: 고른 화면만 잰다 */
const OUT=process.env.OUT||path.join(require('os').tmpdir(),'ui-density');const SHOT=process.env.SHOT==='1';const PHASE=process.argv[2]||'mid';
fs.mkdirSync(path.join(OUT,'shots'),{recursive:true});

const METRICS=()=>{
  const H=innerHeight,W=innerWidth;
  const vcache=new Map();
  const vis=e=>{if(vcache.has(e))return vcache.get(e);const r=e.getBoundingClientRect();let ok=true;if(r.width<2||r.height<2)ok=false;else{const s=getComputedStyle(e);if(s.visibility==='hidden'||s.display==='none'||+s.opacity===0)ok=false;else ok=!!e.offsetParent||s.position==='fixed';}vcache.set(e,ok);return ok;};
  const sheet=document.querySelector('#sheet');const sheetOn=sheet&&sheet.innerHTML.trim()&&sheet.getBoundingClientRect().height>50;
  const castEl=document.querySelector('.cast');
  const root=castEl&&vis(castEl)?castEl:sheetOn?sheet:document.querySelector('#app');
  const chromeSel='header.top,.bnav,.fm-top,.fmh,.fm-nav,.fm-side,.fm-subs,.fmbar,.tbar';
  const chromeOf=e=>!!e.closest(chromeSel);
  const sel='button,a[href],[data-a],[role=button],[role=tab],select,input:not([type=hidden]),summary';
  let all=[...root.querySelectorAll(sel)].filter(vis);
  all=all.filter(e=>!all.some(o=>o!==e&&o.contains(e)));
  const content=all.filter(e=>!chromeOf(e));
  const inView=r=>r.top<H&&r.bottom>0&&r.left<W&&r.right>0;
  const above=content.filter(e=>inView(e.getBoundingClientRect()));
  const primEls=content.filter(e=>e.matches('.btn.primary'));
  const primAbove=primEls.filter(e=>inView(e.getBoundingClientRect()));
  const filled=content.filter(e=>{if(!e.matches('button,.btn,.tc-i'))return false;const s=getComputedStyle(e);const m=s.backgroundColor.match(/rgba?\(([^)]+)\)/);if(!m)return false;const v=m[1].split(',').map(Number);if(v.length>3&&v[3]<.6)return false;const [r,g,b]=v;const mx=Math.max(r,g,b),mn=Math.min(r,g,b);return mx-mn>60&&mx>110;});
  const lab=e=>(e.innerText||e.getAttribute('aria-label')||'').trim().replace(/\s+/g,' ').slice(0,16);
  /* 글자: 텍스트 노드 단위 */
  let charsAbove=0,charsAll=0,small=0,smallAbove=0,smallChars=0;const smallS=new Map();const empty=new Set();
  const tw=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n,cnt=0;const rg=document.createRange();
  const EMPTY=/(없습니다|없어요|아직[^.]{0,14}(없|않|안 )|불러오는 중|준비 중|로딩|기록이 없|비어 있)/;
  while((n=tw.nextNode())&&cnt<40000){const t=n.nodeValue.replace(/\s+/g,'');if(!t)continue;const p=n.parentElement;if(!p||p.closest('script,style,svg title')||!vis(p)||chromeOf(p))continue;cnt++;
    rg.selectNodeContents(n);const r=rg.getBoundingClientRect();if(r.width<1)continue;const iv=inView(r);charsAll+=t.length;if(iv)charsAbove+=t.length;
    const fs=parseFloat(getComputedStyle(p).fontSize);if(fs<12&&!p.closest('svg')){small++;smallChars+=t.length;if(iv)smallAbove++;const k=(p.className&&typeof p.className==='string'?p.tagName.toLowerCase()+'.'+p.className.split(' ')[0]:p.tagName.toLowerCase())+'@'+fs;smallS.set(k,(smallS.get(k)||0)+1);}
    if(t.length<60&&EMPTY.test(n.nodeValue))empty.add(n.nodeValue.trim().replace(/\s+/g,' ').slice(0,40));}
  const smallTop=[...smallS.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6).map(([k,v])=>k+'×'+v);
  /* 잘린 글: 말줄임/숨김으로 글이 넘친 요소 */
  const trunc=[];for(const e of root.querySelectorAll('*')){if(chromeOf(e)||!vis(e))continue;const s=getComputedStyle(e);const clampY=s.webkitLineClamp&&s.webkitLineClamp!=='none';
    if(!(s.textOverflow==='ellipsis'||clampY||(/hidden|clip/.test(s.overflowX)&&s.whiteSpace==='nowrap')))continue;
    if(![...e.childNodes].some(c=>c.nodeType===3&&c.nodeValue.trim())&&!(e.children.length<=2&&e.innerText&&e.innerText.trim().length<30))continue;
    if(e.scrollWidth>e.clientWidth+1||(clampY&&e.scrollHeight>e.clientHeight+1)){trunc.push((e.innerText||'').trim().replace(/\s+/g,' ').slice(0,14));}}
  /* 스크롤 칸 */
  const scrollers=[];for(const e of root.querySelectorAll('*')){const s=getComputedStyle(e);if(!/(auto|scroll)/.test(s.overflowY))continue;if(e.scrollHeight<=e.clientHeight+8||e.clientHeight<40||!vis(e))continue;scrollers.push(e);}
  const docScroll=document.scrollingElement.scrollHeight>H+8;
  const main=[...scrollers].sort((a,b)=>b.clientHeight*b.clientWidth-a.clientHeight*a.clientWidth)[0];
  const mainIsDoc=docScroll||!main||main.clientHeight<H*.45;
  const pageH=mainIsDoc?document.scrollingElement.scrollHeight:main.scrollHeight;const pageVH=mainIsDoc?H:main.clientHeight;
  const inner=scrollers.filter(e=>mainIsDoc||e!==main);
  const nested=inner.filter(e=>{let a=e.parentElement;while(a&&a!==document.body){if(scrollers.includes(a))return true;a=a.parentElement;}return docScroll;});
  const cls=e=>e.tagName.toLowerCase()+(typeof e.className==='string'&&e.className?'.'+e.className.trim().split(/\s+/).slice(0,2).join('.'):'');
  /* 넓은 표 */
  const wide=[];for(const t of root.querySelectorAll('table')){if(!vis(t)||chromeOf(t))continue;const r=t.getBoundingClientRect();let a=t.parentElement,c=null;while(a&&a!==document.body){const s=getComputedStyle(a);if(/(auto|scroll|hidden|clip)/.test(s.overflowX)){c=a;break;}a=a.parentElement;}const cw=c?c.clientWidth:W;
    if(r.width>cw+2||r.right>W+2)wide.push(Math.round(r.width)+'/'+Math.round(cw)+(c?'':'!'));}
  /* 카드 스타일 */
  const cards=[...root.querySelectorAll('.card,.panel,.hw-panel,.ws-panel,.md-panel,.tcard,.pcard,[class*="-card"],[class*="card-"]')].filter(e=>vis(e)&&!chromeOf(e)&&e.getBoundingClientRect().width>120);
  const csig=new Map();for(const e of cards){const s=getComputedStyle(e);if(s.display==='contents')continue;const k=[s.borderTopLeftRadius,s.backgroundColor,s.borderTopWidth+' '+s.borderTopColor,s.boxShadow==='none'?'':'sh',Math.round(parseFloat(s.paddingTop)/2)*2].join('|');if(!csig.has(k))csig.set(k,cls(e));}
  const tabbars=[...root.querySelectorAll('.subtabs,.itabs,.seg,.ptabs,[role=tablist],.tabs,.fm-subs,.chips')].filter(vis).filter(e=>e.querySelectorAll('button,[data-a]').length>=2&&inView(e.getBoundingClientRect())).length;
  /* 줄 겹침(3-1): 같은 목록 안 이웃한 줄 누르기 줄이 세로로 겹치는 수 */
  let rowOverlap=0;for(const e of root.querySelectorAll('[data-rowtap]')){const q=e.previousElementSibling;if(!q||!q.matches('[data-rowtap]')||!vis(e)||!vis(q))continue;const a=q.getBoundingClientRect(),b=e.getBoundingClientRect();if(b.top<a.top+Math.max(a.height,q.scrollHeight)-1)rowOverlap++;} /* 내용이 줄 높이를 넘쳐 다음 줄을 덮는 것도 겹침 */
  const s44=content.filter(e=>{const r=e.getBoundingClientRect();return inView(r)&&(r.height<36||r.width<36)&&e.matches('button,.btn,.tc-i,[role=tab],select');}).length;
  return {root:root.id||cls(root),total:content.length,above:above.length,primary:primEls.length,primAbove:primAbove.length,primL:primEls.map(lab).slice(0,8),filled:filled.length,filledL:filled.map(lab).slice(0,8),
    charsAbove,charsAll,small,smallAbove,smallChars,smallTop,trunc:trunc.length,truncL:[...new Set(trunc)].slice(0,8),empty:[...empty].slice(0,6),
    scrollers:inner.length,nested:nested.length,scrollL:inner.slice(0,6).map(cls),pageVH:+(pageH/pageVH).toFixed(1),wide:wide.length,wideL:wide.slice(0,5),cardStyles:csig.size,cardL:[...csig.values()].slice(0,10),tabbars,rowOverlap,small36:s44,overflow:document.documentElement.scrollWidth-W,renderer:(document.querySelector('.cs-stage')||{}).dataset?.renderer||null};
};

const other="Object.values(G.players).find(p=>p.team!=null&&p.team!==G.user&&!p.foreign&&ovr(p)>=50)";
const SCREENS=[
  ['home',"A.tab('home')"],['inbox',"A.tab('inbox')"],['cal',"A.tab('cal')"],['roster',"A.tab('roster')"],['gm',"A.tab('me')"],['menu',"UI.menu=true;renderSheet()"],
  ['league-stand',"A.go('league:stand')"],['league-score',"A.go('league:score')"],['league-rec',"A.go('league:rec')"],['league-stat',"A.go('league:stat')"],['league-wire',"A.go('league:wire')"],['league-nt',"A.go('league:nt')"],['league-hist',"A.go('league:hist')"],['league-abroad',"A.go('league:abroad')"],
  ['club-info',"A.go('club:info')"],['club-owner',"A.go('club:owner')"],['club-fans',"A.go('club:fans')"],['club-fin',"A.go('club:fin')"],['club-spon',"A.go('club:spon')"],['club-inv',"A.go('club:inv')"],['club-chron',"A.go('club:chron')"],
  ['cfg-set',"A.go('cfg:set')"],['cfg-auth',"A.go('cfg:auth')"],
  ['transfer-fa',"A.go('transfer:fa')"],['transfer-draft',"A.go('transfer:draft')"],['transfer-kbo',"A.go('transfer:kbo')"],['transfer-contract',"A.go('transfer:contract')"],['transfer-foreign',"A.go('transfer:foreign')"],
  ['trade-market',"A.go('trade:market')"],['trade-compare',`A.toTrade(${other}.id)`],['trade-block',"A.go('trade:block')"],
  ['staff-mgr',"A.go('staff:mgr')"],['staff-train',"A.go('staff:train')"],['staff-scouts',"UI.it=UI.it||{};UI.it.scoutpg='team';A.go('staff:scouts')"],['staff-scoutmap',"UI.it=UI.it||{};UI.it.scoutpg='map';A.go('staff:scouts')"],['staff-sister',"UI.it=UI.it||{};UI.it.scoutpg='ovs';A.go('staff:scouts')"],['staff-anl',"A.go('staff:anl')"],['staff-smkt',"A.go('staff:smkt')"],
  ['player-own',"A.player(domestic(G.user).sort((a,b)=>ovr(b)-ovr(a))[0].id)"],['player-other',`A.player(${other}.id)`],
  ['neg-ext',"const q=domestic(G.user).find(p=>typeof canExtend==='function'&&canExtend(p))||domestic(G.user)[0];A.ngtOpen('ext:'+q.id)"],
  ['neg-fa',"const id=(G.fa&&G.fa.pool||[]).find(i=>G.players[i]&&G.players[i].team==null);if(id!=null)A.ngtOpen('fa:'+id)"],
  ['match-entry',"A.tab('home');A.matchOpen()"]];
const NEW_SCREENS=[['title',"UI.title=true;render()"]];

async function shoot(p,name,w,res,code){
  try{ if(code)await p.evaluate(code=>{UI._clk=null;try{closeSheets();UI.ngt=null;UI.negWin=null;UI.matchPreview=false;UI.menu=false;UI.title=false;}catch(e){}new Function(code)();},code);
    await p.waitForTimeout(350); await p.evaluate(()=>{window.scrollTo(0,0);document.querySelectorAll('.sf-tw,.tw,.fnd-w').forEach(e=>e.scrollLeft=0);});
    const m=await p.evaluate(METRICS); if(SHOT)await p.screenshot({path:path.join(OUT,'shots',`${PHASE}-${w}-${name}.png`)});
    res.push({phase:PHASE,w,name,...m}); console.log(PHASE,w,name,'above',m.above,'prim',m.primary,'chars',m.charsAbove,'small',m.small,'trunc',m.trunc,'nest',m.nested,'wide',m.wide,'vh',m.pageVH,'ovl',m.rowOverlap);
  }catch(e){ console.log('FAIL',PHASE,w,name,e.message.slice(0,150)); res.push({phase:PHASE,w,name,err:e.message.slice(0,200)}); }
}
async function cast(p,w,res,base){
  await p.evaluate(b=>{G=JSON.parse(b);UI.title=false;closeSheets();UI.tab='home';render();},base);
  await p.evaluate(()=>{for(const t of G.teams)setEntry(t.id);const op=G.teams.find(t=>t.id!==G.user).id,g=simGame(G.day,G.user,op,false);G.games.push(gameRecord(G.day,G.user,op,g,''));A.cast(G.games.length-1);});
  await p.waitForTimeout(1200); await shoot(p,'cast-2d',w,res,null);
  const ok=await p.waitForFunction(()=>window.Match3D&&Match3D.ready(),{},{timeout:90000}).then(()=>true,()=>false);
  await p.waitForTimeout(1500); await shoot(p,ok?'cast-3d':'cast-3d-timeout',w,res,null);
  await p.evaluate(()=>{try{A.castClose(true);}catch(e){}});
}
(async()=>{
  const srv=await startHtmlServer(ROOT+'/index.html');
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/opt/pw-browsers/chromium',args:['--enable-unsafe-swiftshader']});
  const res=[],errs=[];
  try{
    const ctx=await browser.newContext({viewport:{width:1366,height:768},deviceScaleFactor:+(process.env.DSF||2)});const p=await ctx.newPage();p.setDefaultTimeout(60000);p.on('pageerror',e=>errs.push(e.message.slice(0,200)));
    await p.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));await p.route('https://www.googletagmanager.com/**',r=>r.fulfill({body:'',contentType:'text/javascript'}));
    await p.goto(srv.url,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>performance.getEntriesByName('fronttime-menu-ready').length>0);await p.waitForFunction(()=>typeof newGame==='function');await p.waitForTimeout(800);
    if(PHASE==='new'){
      for(const [w,h] of [[390,844],[1366,768]]){ await p.setViewportSize({width:w,height:h});
        await p.evaluate(()=>{G=null;UI.title=true;render();}); await shoot(p,'title',w,res,null);
        await p.evaluate(()=>{DEMO.on=false;newGame(6);UI.title=false;UI.menu=false;render();}); await shoot(p,'after-newgame',w,res,null);
        await p.evaluate(()=>{fdStart();render();}); await shoot(p,'founding-draft',w,res,null);
        await p.evaluate(()=>{fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);UI.tab='home';render();}); await shoot(p,'first-home',w,res,null);
        await shoot(p,'first-inbox',w,res,"A.tab('inbox')"); await shoot(p,'first-staff-mgr',w,res,"A.go('staff:mgr')");
      }
    } else {
      const stateFile=path.join(OUT,`state-${PHASE}.json`);let base;
      if(fs.existsSync(stateFile))base=fs.readFileSync(stateFile,'utf8');
      else{
        await p.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;UI.title=false;UI.menu=false;});
        for(let chunk=0;chunk<80;chunk++){
          const done=await p.evaluate((target)=>{const goal=target==='mid'?dnum(G.year,6,20):null;
            const step=()=>{G.live=null;G.res=null;G.stops=[];G.matchAwait=null;for(const e of (G.evs||[]))if(!e.done)try{evPick(e.id,e.def??0,true);}catch(x){e.done=true;}
              if(G.iv&&!G.iv.done){let k=0;while(!G.iv.done&&k++<9)try{ivAnswer(0);}catch(x){break;}} if(G.offers&&G.offers.length)try{answerOffer(G.offers[0].id,false);}catch(x){} if(G.draft&&!G.draft.done)try{advanceDraft(false);}catch(x){}
              (G.comp||[]).forEach(c=>{try{if(c.stage!=='done')compAuto(c);}catch(x){}});try{if(rosterN(G.user)>ROSTER_MAX)trimRoster(G.user,ROSTER_MAX);}catch(x){}
              for(let i=0;i<3;i++)try{aiForeignFill(G.user);}catch(x){}
              const d0=G.day;try{advance('day',{skipMatchStop:true});}catch(e){} if(G.day===d0)G.day++;};
            for(let i=0;i<15;i++){ if(target==='mid'&&G.day>=goal)return true; if(target==='off'&&faLive()&&G.day>=dnum(G.fa.y0??G.year,11,6))return true; step(); }
            return false;},PHASE);
          if(done)break;
        }
        await p.evaluate(()=>{G.live=null;G.res=null;G.stops=[];UI.wkres=null;});
        base=await p.evaluate(()=>JSON.stringify(G)); fs.writeFileSync(stateFile,base);
      }
      console.log('state',await p.evaluate(b=>{G=JSON.parse(b);return dstr(G.day)+' '+period();},base));
      for(const [w,h] of [[390,844],[1366,768]]){ await p.setViewportSize({width:w,height:h});
        await p.evaluate(b=>{DEMO.on=false;G=JSON.parse(b);UI.title=false;UI.menu=false;closeSheets();UI.tab='home';render();},base); await p.waitForTimeout(300);
        for(const [name,code] of SCREENS){ if(name==='neg-fa'&&PHASE!=='off')continue; if(ONLY&&!ONLY.includes(name))continue; await shoot(p,name,w,res,code); }
        await p.evaluate(()=>{try{closeSheets();UI.menu=false;renderSheet();}catch(e){}});
        if(process.env.CAST!=='0'&&(!ONLY||ONLY.some(n=>n.startsWith('cast'))))await cast(p,w,res,base);
      }
    }
    fs.writeFileSync(path.join(OUT,`metrics-${PHASE}${ONLY?'-part':''}.json`),JSON.stringify(res,null,1));
    console.log('errors',JSON.stringify(errs).slice(0,1500));
  }catch(e){console.error('setup',e.stack);process.exitCode=1;}
  finally{await browser.close();await srv.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
