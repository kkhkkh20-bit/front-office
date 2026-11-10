/* 화면 비율 점검: 모든 메뉴·하위 탭·선수 상세·중계를 휴대폰(세로·가로)·태블릿·노트북·PC·대형 화면에서 열고
   가로 넘침, 화면 밖으로 나간 요소, 넘침 숨김에 잘린 버튼, 다른 요소에 가려진 버튼을 찾는다.
   SIZES=390x844,844x390 처럼 크기를, VIEWS=home,trade:block 처럼 화면을 골라 돌릴 수 있다. */
const path=require('node:path');
const {chromium}=require('playwright');
const {startHtmlServer}=require('./lib/ui-server.cjs');
const SIZES=(process.env.SIZES||'360x640,390x844,844x390,768x1024,1024x768,1280x600,1366x768,1920x1080,2560x1440').split(',').map(s=>{const [width,height]=s.split('x').map(Number);return {width,height};});
(async()=>{
  const server=await startHtmlServer(process.env.REVIEW_HTML||path.resolve(__dirname,'../index.html'));
  let browser; const fails=[], errors=[];
  try{
    browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium',args:['--disable-webgl']});
    const page=await browser.newPage({viewport:SIZES[0]}); page.on('pageerror',e=>errors.push(e.message));
    await page.goto(server.url,{waitUntil:'domcontentloaded'});
    await page.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;G.day=G.cal.open;for(const t of G.teams)setEntry(t.id);const op=G.teams.find(t=>t.id!==G.user).id;const g=simGame(G.day,G.user,op,false);applyGame(G.day,G.user,op,g,false);G.games=[gameRecord(G.day,G.user,op,g)];closeSheets();UI.title=false;render();});
    const all=await page.evaluate(()=>{const L=[];for(const t of ['home','inbox','roster','trade','transfer','staff','league','club','cal']){const s=SUBS[t];if(s&&s.length)for(const x of s)L.push(t+':'+x[0]);else L.push(t);}return [...L,'player:bat','player:pit','cast'];});
    const views=process.env.VIEWS?process.env.VIEWS.split(','):all;
    for(const size of SIZES){
      await page.setViewportSize(size);
      for(const v of views){
        await page.evaluate(v=>{if(UI.cast)A.castClose(true);closeSheets();scrollTo(0,0);const [t,s]=v.split(':');
          if(t==='cast')return A.cast(0); if(t==='player')return A.player(playersOf(G.user).find(q=>s==='pit'?q.isP:!q.isP).id); if(s)A.go(t+':'+s);else A.tab(t);},v).catch(e=>errors.push(v+': '+e.message));
        await page.waitForTimeout(v==='cast'?500:120);
        const r=await page.evaluate(()=>{
          const W=innerWidth,H=innerHeight,out=[],cut=[],hid=[];
          const vis=e=>{const s=getComputedStyle(e);return s.display!=='none'&&s.visibility!=='hidden'&&e.getClientRects().length>0;};
          const desc=e=>e.tagName.toLowerCase()+(e.className&&typeof e.className==='string'?'.'+e.className.trim().split(/\s+/).slice(0,2).join('.'):'')+' "'+(e.textContent||e.value||'').trim().replace(/\s+/g,' ').slice(0,12)+'"';
          const scrollX=e=>{for(let a=e.parentElement;a&&a!==document.body;a=a.parentElement)if(/(auto|scroll|hidden|clip)/.test(getComputedStyle(a).overflowX))return true;return false;};
          const pinned=x=>{for(let a=x;a&&a!==document.body;a=a.parentElement){const p=getComputedStyle(a).position;if(p==='sticky'||p==='fixed')return true;}return false;};
          for(const e of document.body.querySelectorAll('*')){if(e.closest('svg,.fb-sr')||!vis(e))continue;const b=e.getBoundingClientRect();if(b.width<1||b.height<1)continue;if((b.right>W+1||b.left<-1)&&!scrollX(e))out.push(desc(e)+' '+Math.round(b.left)+'~'+Math.round(b.right));}
          /* 중계 판 위 선수 표지(.cs-stage>.cc)는 공을 쫓아 담장 끝까지 움직이므로 잘림 판정에서 뺀다 */
          const ctl=[...document.body.querySelectorAll('button,select,input,a[data-a],[role=button]')].filter(e=>vis(e)&&!e.closest('svg,.fb-sr,.cs-stage>.cc')&&!(e.closest('details:not([open])')&&!e.closest('summary')));
          const bars=[...document.querySelectorAll('.bnav,.top,.dtop,.fmtop')].filter(vis).map(e=>e.getBoundingClientRect());
          const topY=Math.max(0,...bars.filter(r=>r.top<5&&r.height<150).map(r=>r.bottom)),botY=Math.min(H,...bars.filter(r=>r.bottom>H-5&&r.height<150).map(r=>r.top));
          for(const e of ctl){const b=e.getBoundingClientRect();if(b.width<6||b.height<6)continue;
            /* 넘침 숨김(스크롤 안 되는 칸)에 잘림 */
            for(let a=e.parentElement;a&&a!==document.documentElement;a=a.parentElement){const s=getComputedStyle(a);if(s.overflowX==='visible'&&s.overflowY==='visible')continue;const r=a.getBoundingClientRect();
              const part=b.top<r.bottom-2&&b.bottom>r.top+2&&b.left<r.right-2&&b.right>r.left+2; /* 일부만 보이는 경우가 잘림(완전히 접어 둔 칸은 의도) */
              const clipY=part&&/hidden|clip/.test(s.overflowY)&&(b.bottom>r.bottom+2||b.top<r.top-2),clipX=part&&/hidden|clip/.test(s.overflowX)&&(b.right>r.right+2||b.left<r.left-2);
              if(clipY||clipX){cut.push(desc(e));break;} if(/(auto|scroll)/.test(s.overflowY+s.overflowX))break;}
            /* 보이는 자리에서 다른 요소에 가려짐(스크롤로 지나간 자리·고정 막대 밑은 제외) */
            const cx=b.left+b.width/2,cy=b.top+Math.min(b.height/2,8);if(cy<=topY+1||cy>=botY-1||cx<0||cx>W||pinned(e))continue;
            let inView=true;for(let a=e.parentElement;a&&a!==document.body;a=a.parentElement){const s=getComputedStyle(a);if(/(auto|scroll)/.test(s.overflowY+s.overflowX)){const r=a.getBoundingClientRect();if(cy<=r.top+1||cy>=r.bottom-1||cx<=r.left+1||cx>=r.right-1){inView=false;break;}}}
            if(!inView)continue;const hit=document.elementFromPoint(cx,cy);if(!hit||e.contains(hit)||hit.contains(e)||pinned(hit)||hit.closest('svg'))continue;hid.push(desc(e)+' ← '+desc(hit));}
          const fb=document.querySelector('.md-field-body');const bk=document.querySelector('.blk'),cast=document.querySelector('.cast.match-dashboard');
          return {castBottom:cast?.getBoundingClientRect().bottom,blk:bk?Math.round(bk.getBoundingClientRect().height):0,field:fb?Math.round(fb.getBoundingClientRect().height):null,over:document.documentElement.scrollWidth-W,out:[...new Set(out)],cut:[...new Set(cut)],hid:[...new Set(hid)]};
        });
        const tag=size.width+'x'+size.height+' '+v;
        if(r.over>2)fails.push(tag+': 가로 넘침 '+r.over+'px');
        if(v==='cast'&&r.castBottom>size.height+2)fails.push(tag+': 중계 하단이 화면 밖 '+Math.round(r.castBottom)+'px');
        if(v==='cast'&&!(r.field>=200))fails.push(tag+': 경기장 높이 '+r.field+'px(200px 미만이면 선수·타구가 납작하게 보임)');
        if(r.blk>90)fails.push(tag+': 막힘 안내 띠 높이 '+r.blk+'px(한두 줄이어야 함)');
        if(r.out.length)fails.push(tag+': 화면 밖 '+r.out.slice(0,3).join(', '));
        if(r.cut.length)fails.push(tag+': 잘린 버튼 '+r.cut.slice(0,3).join(', '));
        if(r.hid.length)fails.push(tag+': 가려진 버튼 '+r.hid.slice(0,3).join(', '));
      }
      console.log('화면 비율 '+size.width+'×'+size.height+' '+views.length+'개 화면 확인');
    }
  }finally{await browser?.close();await server.close();}
  if(errors.length)fails.push('오류: '+errors.slice(0,5).join(' / '));
  if(fails.length){console.log('화면 비율 점검 실패 '+fails.length+'건\n  '+fails.slice(0,60).join('\n  '));process.exitCode=1;}
  else console.log('화면 비율 점검: 통과');
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
