/* 휴대폰 중계 상황판(사용자 ddddddd 11-17: "주자상황이랑 공 갯수 같은게 예전처럼 안나옵니다").
   세로 390×844·가로 844×390에서 기본 중계(3D 대체)를 열고 여러 타석으로 옮겨 가며 본다:
   경기장 안 점수판의 주자 다이아몬드가 그 타석 주자와 같은지, B·S·O와 아웃 수, 투수 투구 수(점수판·아래 줄)가 보이는지,
   아래 타자·투수 줄 글자가 말줄임으로 잘리지 않는지, 3D 대체 안내·득점권 띠가 점수판을 덮지 않는지, 가로 넘침·페이지 오류가 없는지.
   CAST_HUD_3D=1 이면 3D(소프트웨어 WebGL)로도 같은 검사를 한다. CAST_HUD_SHOTS=폴더 이면 화면을 남긴다 */
const path=require('node:path');const {chromium}=require('playwright');const {startHtmlServer}=require('./lib/ui-server.cjs');
const SHOTS=process.env.CAST_HUD_SHOTS||'';
(async()=>{const server=await startHtmlServer(path.resolve(__dirname,'../index.html'));const fails=[];let browser;let seen=0;
 const modes=[{name:'2d',args:['--disable-webgl']}];if(process.env.CAST_HUD_3D)modes.push({name:'3d',args:['--enable-unsafe-swiftshader']});
 try{for(const mode of modes){browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium',args:mode.args});
  for(const vp of [{width:390,height:844},{width:844,height:390}]){
   const p=await browser.newPage({viewport:vp,isMobile:true,hasTouch:true});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
   await p.route('https://**',r=>r.fulfill({body:'',contentType:'text/css'}));await p.goto(server.url);await p.waitForFunction(()=>performance.getEntriesByName('fronttime-menu-ready').length>0);await p.waitForFunction(()=>typeof newGame==='function');
   await p.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;G.day=G.cal.open+2;for(const t of G.teams)setEntry(t.id);const op=G.teams.find(t=>t.id!==G.user).id;G.games=[];G.day++;const g=simGame(G.day,G.user,op,false);applyGame(G.day,G.user,op,g,false);G.games.unshift(gameRecord(G.day,G.user,op,g,''));UI.title=false;UI.tab='home';render();A.cast(0);UI.cast.play=false;castJump(1,false);});
   const want=mode.name==='3d'?'ready':'fallback';
   await p.waitForFunction(w=>document.querySelector('#cs-3d')?.dataset.state===w,want,{timeout:mode.name==='3d'?180000:30000}).catch(()=>fails.push(`${mode.name} ${vp.width}: 3D 상태가 ${want}가 아님`));
   /* 주자 없음·1명·2명 이상·만루, 투수 교체 뒤 등 여러 타석 */
   const ks=await p.evaluate(()=>{const g=G.games[0],out=[],want=[0,1,2,3];for(const n of want){const k=g.pbp.findIndex((x,i)=>typeof x[1]==='number'&&i>3&&cBefore(g,i).bases.filter(Boolean).length===n);if(k>=0)out.push(k);}const late=g.pbp.findLastIndex(x=>typeof x[1]==='number');if(late>0)out.push(late);return [...new Set(out)];});
   for(const k of ks){
    await p.evaluate(k=>{UI.cast.play=false;castJump(k,false);},k);await p.waitForTimeout(250);
    const r=await p.evaluate(()=>{const g=G.games[0],k=UI.cast.k,b=cBefore(g,k),pid=cPit(g,k),pc=cPitchTotalBefore(g,k,pid),q=s=>document.querySelector(s);
     const R=e=>e&&e.getBoundingClientRect(),shown=e=>{if(!e)return false;const r=R(e),cs=getComputedStyle(e);return r.width>0&&r.height>0&&cs.visibility!=='hidden'&&cs.display!=='none'&&+cs.opacity>0;};
     const inside=(a,o)=>a.left>=o.left-1&&a.right<=o.right+1&&a.top>=o.top-1&&a.bottom<=o.bottom+1,hit=(a,o)=>a.left<o.right-1&&o.left<a.right-1&&a.top<o.bottom-1&&o.top<a.bottom-1;
     const stage=q('#cs-stage'),panel=q('#cs-stage>.md-count-panel'),bad=[];
     if(!shown(panel)||!inside(R(panel),R(stage)))bad.push('점수판이 경기장 안에 보이지 않음');
     const dia=[...document.querySelectorAll('#cs-stage .mb-dia i')];const wantDia=[1,0,2].map(i=>!!b.bases[i]);
     if(dia.length!==3||!dia.every(e=>shown(e)&&inside(R(e),R(panel))))bad.push('주자 다이아몬드가 보이지 않음');
     else if(JSON.stringify(dia.map(e=>e.classList.contains('on')))!==JSON.stringify(wantDia))bad.push('주자 다이아몬드가 주자와 다름 '+JSON.stringify({got:dia.map(e=>e.classList.contains('on')),want:wantDia}));
     for(const id of ['cs-B','cs-S','cs-Ob']){const e=q('#cs-stage #'+id);if(!shown(e)||!inside(R(e),R(panel))||![...e.children].every(shown))bad.push(id+' 볼카운트가 보이지 않음');}
     const outs=q('#cs-stage #cs-Ob')?.querySelectorAll('.on').length;if(outs!==Math.min(2,b.outs))bad.push(`아웃 ${outs}/${b.outs}`);
     const bpc=q('#md-bug-pc');if(pc!=null&&(!shown(bpc)||bpc.textContent!==pc+'구'||!inside(R(bpc),R(panel))||bpc.scrollWidth>bpc.clientWidth+1))bad.push('점수판 투구 수 '+(bpc&&bpc.textContent)+' / '+pc);
     const dpc=q('#cs-pitcher-count');if(pc!=null&&(!shown(dpc)||dpc.textContent!==pc+'구'))bad.push('타자·투수 줄 투구 수 '+(dpc&&dpc.textContent)+' / '+pc);
     const duel=q('.md-duel');if(!shown(duel))bad.push('타자·투수 줄이 보이지 않음');
     else{const dr=R(duel);for(const e of duel.querySelectorAll('b,small,em,i')){if(!shown(e))continue;const er=R(e);if(e.scrollWidth>e.clientWidth+1&&getComputedStyle(e).display!=='inline'||er.right>dr.right+1||er.left<dr.left-1)bad.push('잘린 글자: '+e.textContent.slice(0,30));}
      const pl=[...duel.querySelectorAll('.md-duel-player')].filter(shown);if(pl.length!==2)bad.push('타자·투수 '+pl.length+'명');
      for(const el of pl){const sp=el.querySelector(':scope>span');if(sp&&sp.scrollWidth>sp.clientWidth+1)bad.push('줄 넘침: '+sp.textContent.slice(0,30));}
      const pit=pl[1]?.querySelector(':scope>span>small');if(!pit||!shown(pit)||!/이닝/.test(pit.textContent))bad.push('투수 오늘 기록이 보이지 않음');
      const bat=pl[0]?.querySelector(':scope>span>small');if(!bat||!shown(bat)||!/타수/.test(bat.textContent))bad.push('타자 오늘 기록이 보이지 않음');}
     for(const s of ['.cs-3d-status','.cs-3d-acts','#cs-stage>.cs-sit.on','#cs-stage>.cs-board-view','#cs-stage>.cs-cam-view']){const e=q(s);if(shown(e)&&(e.textContent||'').trim()&&hit(R(e),R(panel)))bad.push(s+'가 점수판을 덮음');}
     const root=q('.cast');if(document.documentElement.scrollWidth>innerWidth+1||root.scrollWidth>root.clientWidth+2)bad.push('가로 넘침');
     return {k,bad,bases:b.bases.filter(Boolean).length};});
    if(r.bad.length)fails.push(`${mode.name} ${vp.width}×${vp.height} k=${r.k} 주자${r.bases}: ${r.bad.join(' · ')}`);seen++;
    if(SHOTS&&r.bases>=2)await p.screenshot({path:path.join(SHOTS,`cast-hud-${mode.name}-${vp.width}x${vp.height}-k${r.k}.png`)});
   }
   if(errs.length)fails.push(`${mode.name} ${vp.width}: 페이지 오류 ${errs.slice(0,3).join(' | ')}`);
   await p.close();}
  await browser.close();browser=null;}
 }finally{await browser?.close();await server.close();}
 if(fails.length){console.error(fails.slice(0,30).join('\n'));console.error('휴대폰 중계 상황판 검사 실패');process.exit(1);}
 console.log(`휴대폰 중계 상황판: ${modes.map(m=>m.name).join('·')} · 세로·가로 ${seen}장면 주자·볼카운트·투구 수·타자/투수 줄 통과`);
})().catch(e=>{console.error(e);process.exit(1);});
