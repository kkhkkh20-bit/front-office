/* 노트북 본문·상세 화면 이동 회귀. 임시 서버와 브라우저는 이 검사가 소유한다. */
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');
const {startHtmlServer}=require('./lib/ui-server.cjs');
(async()=>{
  const server=await startHtmlServer(path.resolve(__dirname,'../index.html'));
  let browser; const failures=[];
  const check=(v,message)=>{try{assert.ok(v,message);}catch(e){failures.push(e.message);}};
  try{
    browser=await chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{});
    const page=await browser.newPage({viewport:{width:1366,height:768}});
    page.on('pageerror',e=>failures.push(e.message));
    await page.goto(server.url,{waitUntil:'domcontentloaded'});
    console.log('배치 검사: 새 게임 준비');
    await page.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);G.tut={done:true,step:99};hireMgr(G.mmarket[0].id,3);G.medSet=true;UI.menu=false;UI.title=false;UI.tab='home';render();});
    for(const size of [{width:1280,height:720},{width:1366,height:768},{width:1440,height:900},{width:1920,height:1080},{width:390,height:844}]){
      console.log('배치 검사: '+size.width+'×'+size.height);
      await page.setViewportSize(size);
      await page.evaluate(()=>{closeSheets();UI.tab='home';render();});
      await page.waitForTimeout(200);
      let r=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+2,grid:!!document.querySelector('.home-dashboard'),games:document.querySelectorAll('.home-dashboard .ug-r').length}));
      check(!r.overflow,`${size.width}: 홈 가로 넘침`);
      if(size.width>=1100){const fit=await page.evaluate(()=>({page:document.documentElement.scrollHeight,h:innerHeight}));check(fit.page<=fit.h+3,`${size.width}: 홈에서 페이지 스크롤이 필요함 (${fit.page}/${fit.h})`);}
      if(size.width>=1100){check(r.grid,`${size.width}: 열 전체를 묶지 않는 홈 카드 그리드 없음`);check(r.games<=4,`${size.width}: 홈 예정 경기가 4개보다 많음`);
        const side=await page.evaluate(()=>{const s=document.querySelector('.fmside');return {count:s.querySelectorAll('button').length,fits:s.scrollHeight<=s.clientHeight+2};});
        check(side.count===8&&side.fits,`${size.width}: 사이드바가 8개 핵심 메뉴로 줄지 않거나 세로로 넘침 (${side.count}개)`);
      }
      if(size.width>=1100){const p=await page.evaluate(()=>({todo:document.querySelector('.home-priority #todoCard')?.getBoundingClientRect().top,next:document.querySelector('.home-priority .nextc')?.getBoundingClientRect().top,compare:!!document.querySelector('.home-priority details[data-k="nxCmp"][open]')}));check(p.todo<350&&p.next<350&&!p.compare,`${size.width}: 할 일·다음 경기 우선 배치 실패`);}
      await page.evaluate(()=>A.tab('roster'));await page.waitForTimeout(200);
      r=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+2,top:document.querySelector('.rt tbody tr.click')?.getBoundingClientRect().top,pager:!!document.querySelector('.roster-list .twpg')}));
      check(!r.overflow,`${size.width}: 명단 가로 넘침`);
      if(size.width>=1100){check(r.top<350,`${size.width}: 명단 첫 선수가 너무 아래에 있음 (${Math.round(r.top)}px)`);check(!r.pager,`${size.width}: PC 명단에서 열을 페이지로 숨김`);}
      const returnY=await page.evaluate(()=>{scrollTo(0,240);const y=scrollY;A.player(playersOf(G.user).find(p=>!p.isP).id);A.ptab('abil');return y;});
      r=await page.evaluate(()=>{const sheet=document.querySelector('#sheet .sheet'),radar=document.querySelector('.pf-radar'),core=document.querySelector('.pf-core-compact');return{app:getComputedStyle(document.querySelector('#app')).display,back:!!document.querySelector('.detail-back'),left:sheet.getBoundingClientRect().left,width:sheet.getBoundingClientRect().width,core:!!core,under:!!core&&!!radar&&radar.contains(core),large:!!document.querySelector('.pf-main .pf-core'),overflow:sheet.scrollWidth>sheet.clientWidth+2};});
      check(r.app==='none'&&r.back,`${size.width}: 상세가 한 화면으로 전환되지 않음`);check(r.left===0&&Math.abs(r.width-size.width)<2,`${size.width}: 상세 화면 폭 불일치`);
      check(r.core&&r.under&&!r.large,`${size.width}: 핵심 능력이 레이더 아래의 작은 요약으로 이동하지 않음`);check(!r.overflow,`${size.width}: 프로필 가로 넘침`);
      if(size.width>=1100){const fit=await page.evaluate(()=>{const bat=UI.sheet,a=document.documentElement.scrollHeight;A.player(playersOf(G.user).find(p=>p.isP).id);const p=document.documentElement.scrollHeight;A.player(bat);return {page:a,pitcher:p,h:innerHeight};});check(fit.page<=fit.h+3&&fit.pitcher<=fit.h+3,`${size.width}: 능력 화면에서 페이지 스크롤이 필요함 (타자 ${fit.page}, 투수 ${fit.pitcher}/${fit.h})`);}
      if(size.width===1366){
        await page.keyboard.press('F1');check(await page.locator('#sheet .fmkeys.detail-page').count()===1,'선수 상세에서 F1 안내가 숨겨짐');await page.keyboard.press('Escape');check(await page.locator('#sheet .pf-overview').count()===1,'F1 안내에서 선수 상세로 복귀 실패');
        const y=await page.evaluate(()=>{A.ngtOpen('ext:'+UI.sheet);UI._ngtY=300;renderSheet();A.fmKeysOpen();return scrollY;});
        check(y===0,'협상 화면의 스크롤 위치가 F1 안내에 섞임');await page.keyboard.press('Escape');check(await page.locator('#sheet .ngt.detail-page').count()===1,'F1 안내에서 협상 화면으로 복귀 실패');await page.locator('.detail-back').click();
        check(await page.locator('#sheet .pf-overview').count()===1,'협상 화면에서 선수 상세로 복귀 실패');
      }
      await page.locator('.detail-back').click({timeout:500}).catch(()=>{});
      r=await page.evaluate(()=>({sheet:!!document.querySelector('#sheet .sheet'),tab:UI.tab,y:scrollY}));
      check(!r.sheet&&r.tab==='roster'&&Math.abs(r.y-returnY)<3,`${size.width}: 목록·스크롤 복귀 실패 (${r.y}/${returnY})`);
    }
    await page.setViewportSize({width:1366,height:768});
    await page.evaluate(()=>A.tab('home'));await page.locator('[data-a="homePanel"][data-v="work"]').click();
    check(await page.locator('.hw-work .card').count()>0,'홈 업무·보고 탭 내용 누락');await page.locator('[data-a="homePanel"][data-v="team"]').click();check(await page.locator('.hw-work .card').count()>0,'홈 선수단 요약 탭 내용 누락');await page.locator('[data-a="homePanel"][data-v="overview"]').click();
    const home=await page.evaluate(()=>{const n=(G.news||[]).filter(x=>!x.oth)[1];if(n){A.homeNews(n.id);if(!document.querySelector('.hw-news h3')?.textContent.includes(n.t))return false;}const d=G.day;G.day=G.cal.open;render();const L=standOrder().order,R=[...document.querySelectorAll('.hw-stand tbody tr')];let rank=1;const valid=R.length===10&&R.every((r,i)=>{if(i&&!tieOf(L[i-1],L[i]))rank=i+1;return +r.cells[0].textContent===rank&&r.cells[2].textContent===L[i].w+'-'+L[i].l+(L[i].t?'-'+L[i].t:'');});G.day=d;render();return valid;});check(home,'홈 기사 선택·실제 승패·공동 순위 연결 실패');await page.evaluate(()=>A.tab('roster'));
    const mode=await page.evaluate(()=>{A.rview('add');const cols=rcolKeys(false).join(',');A.rviewMode('card');const card=UI.rlayout==='card'&&!document.querySelector('.roster-list .rt');A.rviewMode('table');const back=!!document.querySelector('.roster-list .rt')&&rcolKeys(false).join(',')===cols&&UI.rview.bat==='add';A.rview('base');return {card,back};});
    check(mode.card&&mode.back,'명단의 표시 방식과 열 프리셋이 충돌');
    const diagnosis=await page.evaluate(()=>{A.itab('roster:depth');const depth=!document.querySelector('#app').textContent.includes('야수 포지션 진단');A.itab('roster:diag');render();return depth&&UI.it.roster==='diag'&&document.querySelectorAll('#app .dg').length===12;});check(diagnosis,'포지션 진단이 전력 구성에서 독립 탭으로 분리되지 않음');await page.evaluate(()=>A.itab('roster:list'));
    const marketing=await page.evaluate(()=>{const p=playersOf(G.user).find(p=>!p.foreign),aw=p.aw;p.aw=[G.year+' MVP'];const div=document.createElement('div');div.innerHTML=starPanel();const button=div.querySelector('[data-v="'+p.id+':m"]'),income=Math.round(smEst(p,'m')*clamp((finYearEnd()-G.day)/365,0,1)),net=income-300;const valid=!!button&&div.textContent.includes('자동 수입 예상')&&button.textContent.includes('비용 '+money(300))&&button.textContent.includes('추가 수입 예상 '+money(income))&&button.querySelector('.sm-net').textContent.includes((net>=0?'+':'−')+money(Math.abs(net)));p.aw=aw;return valid;});check(marketing,'선수 홍보의 자동 수입·비용·추가 수입·순이익 설명 누락');
    await page.evaluate(()=>A.go('staff:smkt'));
    let candidates=await page.locator('.mgrg .mgrc [data-a="mgrCandidate"]').count();
    check(candidates>0,'감독 후보가 평가·계약이 있는 카드로 표시되지 않음');
    await page.locator('.mgrg .mgrc [data-a="mgrCandidate"]').first().click({timeout:1000}).catch(()=>{});
    check(await page.locator('.manager-profile.detail-page').count()===1,'감독 후보 상세가 전체 페이지로 열리지 않음');
    await page.keyboard.press('Escape');
    await page.evaluate(()=>{A.go('transfer:foreign');A.player(G.fmarket[0]);});
    let r=await page.evaluate(()=>({page:document.documentElement.classList.contains('detail-page-open'),app:getComputedStyle(document.querySelector('#app')).display,box:document.querySelector('.sheet').getBoundingClientRect().toJSON()}));
    check(r.page&&r.app==='none'&&r.box.left===0&&r.box.width===1366,'외국인 후보가 별도 우측 창으로 열림');
    await page.keyboard.press('Escape');
    r=await page.evaluate(()=>({app:getComputedStyle(document.querySelector('#app')).display,tab:UI.tab,sub:curSub('transfer')}));
    check(r.app!=='none'&&r.tab==='transfer'&&r.sub==='foreign','외국인 후보에서 Escape로 시장 복귀 실패');
    check(await page.locator('.foreign-candidates .tgrid .pc').count()>0&&await page.locator('.foreign-candidates .candidate-table').count()===0,'외국인 시장이 선수 카드로 표시되지 않음');
    await page.evaluate(()=>A.go('transfer:draft'));
    const dr=await page.evaluate(()=>({frame:!!document.querySelector('.draft-page'),top:document.querySelector('.draft-candidates tbody tr')?.getBoundingClientRect().top,width:document.querySelector('.draft-candidate-body')?.getBoundingClientRect().width}));
    check(dr.frame&&dr.top<440&&dr.width>800,'신인 드래프트 후보 표 비율·첫 화면 배치 실패 '+JSON.stringify(dr));
    if(process.env.CAPTURE)await page.screenshot({path:'/workspace/front-office-amateur-draft-final.png'});
    await page.evaluate(()=>{for(const p of Object.values(G.players)){if(p.team!=null)Object.assign(lineFor(p,G.year,p.team,'1군'),p.isP?{g:20,gs:8,outs:180,er:20,so:60,w:6}:{g:60,pa:240,ab:200,h:65,hr:10});}G.day=G.cal.asg-14;allStarDaily();A.leagueEvents();});
    check(await page.locator('.league-event-grid .candidate-table tbody tr').count()===52,'올스타 선정 명단이 화면과 연결되지 않음');
    await page.evaluate(()=>{UI.it.histv='aw';G.day=KD(11,25);const p=playersOf(G.user).find(p=>!p.isP);const C=[ggCandidate({p,h:seasonTotal(p,G.year,'1군'),w:5},'1B')];ggReporterVote(C,288,1,G.year);G.awards={[G.year]:{y:G.year,gg:{},cand:{gg:{'1B':C}},pend:{mvp:true,gg:true},ggVote:{voters:288,start:KD(11,25),end:KD(12,5),news:{}}}};render();});
    check(await page.locator('.candidate-list').filter({hasText:'기자단 투표 중'}).count()===1,'골든글러브 투표 진행 화면 누락');
    if(process.env.CAPTURE){await page.evaluate(()=>{G.day=KD(1,2);A.tab('home');});await page.screenshot({path:'/workspace/front-office-home-laptop.png',fullPage:true});await page.evaluate(()=>A.tab('roster'));await page.screenshot({path:'/workspace/front-office-roster-laptop.png'});await page.evaluate(()=>A.player(playersOf(G.user).find(p=>!p.isP).id));await page.screenshot({path:'/workspace/front-office-profile-laptop.png'});await page.evaluate(()=>{closeSheets();A.go('staff:smkt');A.mgrCandidate(G.mmarket[0].id);});await page.screenshot({path:'/workspace/front-office-manager-laptop.png'});}
    await page.evaluate(()=>{closeSheets();newGame(6);fdStart();UI.title=false;UI.tab='home';G.tut={done:true,step:99};render();});
    for(const size of [{width:1366,height:768},{width:390,height:844}]){
      await page.setViewportSize(size);await page.evaluate(()=>render());await page.waitForTimeout(200);
      const r=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+2,top:document.querySelector('.fdt tbody tr')?.getBoundingClientRect().top,width:document.querySelector('.fdl-main')?.getBoundingClientRect().width,header:document.querySelector('.dtop')?.getBoundingClientRect().height}));
      check(!r.overflow,`${size.width}: 창단 드래프트 가로 넘침`);check(r.header<size.height*.35,`${size.width}: 드래프트 상단 높이 과다 (${r.header})`);
      if(size.width>=1100){check(r.width>size.width*.65,`${size.width}: 드래프트 후보 표 비율 부족`);check(r.top<440,`${size.width}: 드래프트 첫 후보가 너무 아래에 있음 (${r.top})`);}
      if(process.env.CAPTURE)await page.screenshot({path:`/workspace/front-office-draft-${size.width}.png`});
    }
  }finally{await browser?.close();await server.close();}
  if(failures.length)throw new Error(failures.join('\n'));
  console.log('본문 배치·상세 이동: 5개 화면 크기 통과');
})().catch(e=>{console.error(e.message);process.exitCode=1;});
