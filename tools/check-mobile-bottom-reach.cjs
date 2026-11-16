/* 휴대폰 화면 맨 아래까지 닿는지(안드로이드 3버튼 내비·동적 주소창 제보, 11-16 낙하산·마스터쉐프).
   작업 화면마다 안쪽 스크롤 칸을 끝까지 내린 뒤(머리 접기 ws-slid 포함) 마지막 내용의 아래 끝이
   ① 하단 탭(.bnav) 위쪽 끝보다 위에 있고 ② 그 칸이나 바깥 칸에 잘려 가려지지 않는지 잰다.
   주소창·내비 막대 때문에 보이는 영역(visualViewport)이 창 높이(innerHeight·100vh)보다 짧은 경우도 흉내 낸다.
   사용: node tools/check-mobile-bottom-reach.cjs [--json] (CAPTURE=폴더 면 화면 캡처) */
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{chromium,devices}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
const SCREENS=[['home','home'],['inbox','inbox'],['roster','roster:list'],['staff-mgr','staff:mgr'],['meet-mgr',"js:meetOpen('mgr')"],['staff-coach','staff:coach'],['staff-smkt-coach',"js:A.smkGo('coach')"],['staff-smkt-scout',"js:A.smkGo('scout')"],['staff-scouts','staff:scouts'],['staff-data','staff:data'],['trade','trade:market'],['transfer','transfer:free'],['league','league:stand']];
/* toolbar: 보이는 영역이 창보다 그만큼 짧은 경우(동적 주소창·내비 막대가 덮은 상태)를 흉내 낸다 */
const SIZES=[{name:'360x640',width:360,height:640,toolbar:0},{name:'360x700-vv644',width:360,height:700,toolbar:56},{name:'390x844',width:390,height:844,toolbar:0},{name:'412x780-vv732',width:412,height:780,toolbar:48,ua:'Galaxy S9+'},{name:'740x360-landscape',width:740,height:360,toolbar:0}];
const TOL=1;
async function measure(p){return p.evaluate(async TOL=>{
  const sleep=ms=>new Promise(r=>setTimeout(r,ms)),frame=()=>new Promise(r=>requestAnimationFrame(()=>r()));
  const bnav=document.querySelector('.bnav'),bs=bnav&&getComputedStyle(bnav);const navTop=bnav&&bs.display!=='none'&&bnav.getBoundingClientRect().height>0?bnav.getBoundingClientRect().top:innerHeight;
  const limit=Math.min(navTop,visualViewport?visualViewport.offsetTop+visualViewport.height:innerHeight);
  const roots=[document.querySelector('#app .mainc')||document.querySelector('#app'),document.querySelector('#sheet')].filter(Boolean);
  const scrollable=el=>{const s=getComputedStyle(el);return /(auto|scroll)/.test(s.overflowY)&&el.scrollHeight>el.clientHeight+2&&el.getClientRects().length>0;};
  const visible=el=>{if(!el.getClientRects().length)return false;if(el.checkVisibility&&!el.checkVisibility({contentVisibilityAuto:true,visibilityProperty:true,opacityProperty:true}))return false;const c=el.closest('details:not([open])');if(c&&!(el.closest('summary')&&el.closest('summary').parentElement===c))return false;return true;};
  const lastBottom=el=>{let b=-Infinity,who=null;for(const d of el.querySelectorAll('*')){if(d.closest('[hidden]'))continue;const r=d.getBoundingClientRect();if(r.height<1||r.width<1)continue;if(!visible(d))continue;
      /* 안쪽 칸이 따로 스크롤하면 그 칸 몫으로 잰다 */let q=d.parentElement,inner=false;while(q&&q!==el){if(scrollable(q)){inner=true;break;}q=q.parentElement;}if(inner)continue;
      if(r.bottom>b){b=r.bottom;who=d;}}
    const pad=parseFloat(getComputedStyle(el).paddingBottom)||0;return {b,who,pad};};
  const clipBottom=el=>{let b=Infinity,q=el.parentElement;while(q&&q!==document.documentElement){const s=getComputedStyle(q);if(s.overflowY!=='visible'||s.overflowX!=='visible')b=Math.min(b,q.getBoundingClientRect().bottom);q=q.parentElement;}return b;};
  const desc=el=>{if(!el)return '';const c=(el.className&&typeof el.className==='string'?'.'+el.className.trim().split(/\s+/).slice(0,2).join('.'):'');return el.tagName.toLowerCase()+c+(el.textContent?` "${el.textContent.trim().slice(0,24)}"`:'');};
  const out=[];
  const vb=visualViewport?visualViewport.offsetTop+visualViewport.height:innerHeight;if(bnav&&navTop<innerHeight){const nb=bnav.getBoundingClientRect().bottom;out.push({el:'bnav',last:'',end:Math.round(nb),visEnd:Math.round(vb),navTop:Math.round(navTop),reach:Math.round(vb-nb),ok:nb<=vb+TOL});}
  const list=roots.flatMap(root=>[...root.querySelectorAll('*')]).filter(scrollable);
  const docScroll=document.scrollingElement;const all=[...list];if(docScroll.scrollHeight>innerHeight+2)all.push(docScroll);
  for(const el of all){
    /* 손가락으로 내리는 것처럼 조금씩: 스크롤 이벤트가 머리 접기(wsSet)를 일으킨다 */
    for(let i=0;i<400;i++){const before=el.scrollTop;el.scrollTop=before+60;await frame();if(Math.abs(el.scrollTop-before)<0.5&&el.scrollTop+el.clientHeight>=el.scrollHeight-1)break;}
    await sleep(30);await frame();
    const isDoc=el===docScroll;const lb=lastBottom(isDoc?document.body:el);const r=isDoc?{top:0,bottom:innerHeight}:el.getBoundingClientRect();
    const visEnd=Math.min(isDoc?innerHeight:r.bottom,isDoc?innerHeight:clipBottom(el),limit);
    const end=lb.b; /* 마지막 내용 끝 */if(!isFinite(end))continue;
    out.push({el:isDoc?'document':desc(el),last:desc(lb.who),end:Math.round(end),visEnd:Math.round(visEnd),navTop:Math.round(navTop),reach:Math.round(visEnd-end),ok:end<=visEnd+TOL});
  }
  /* 스크롤도 안 되는데 잘린 칸(overflow hidden 안에 내용이 넘친 큰 칸) */
  for(const el of roots.flatMap(root=>[...root.querySelectorAll('.ws-panel,.ws-panels,main.ws-frame,.ws-own,.card')])){if(el.closest('[hidden]')||!el.getClientRects().length)continue;const r=el.getBoundingClientRect();if(r.height<80)continue;
    const lb=lastBottom(el);if(!isFinite(lb.b))continue;const visEnd=Math.min(r.bottom,clipBottom(el),limit);const s=getComputedStyle(el);
    if(lb.b>visEnd+TOL&&!scrollable(el)&&!list.some(x=>el.contains(x)&&x!==el))out.push({el:'clipped '+desc(el)+' ov='+s.overflowY,last:desc(lb.who),end:Math.round(lb.b),visEnd:Math.round(visEnd),navTop:Math.round(navTop),reach:Math.round(visEnd-lb.b),ok:false});}
  /* 코치 줄(휴대폰): 연봉·계약 글자가 지도·육성 칸 위로 넘쳐 겹치지 않게(카페 11-16) */
  const hit=(a,b)=>a.left<b.right-.5&&b.left<a.right-.5&&a.top<b.bottom-.5&&b.top<a.bottom-.5;
  for(const row of document.querySelectorAll('.st-r:not(.st-h)')){if(!visible(row))continue;const sal=row.querySelector(':scope>.st-sal');if(!sal)continue;const g=document.createRange();g.selectNodeContents(sal);const sr=[...g.getClientRects()];
    for(const v of row.querySelectorAll(':scope>.st-v')){const vr=[...v.getClientRects()];if(sr.some(a=>vr.some(b=>hit(a,b)))){out.push({el:'overlap .st-v/.st-sal',last:desc(row.querySelector('.st-n b')),end:0,visEnd:0,navTop:0,reach:0,ok:false});break;}}}
  /* 감독과 대화: 감독 답을 자르지 않는다(홈 요약 카드만 세 줄) */
  for(const p of document.querySelectorAll('.mchat:not(.mchat-c) .mc-a p'))if(p.scrollHeight>p.clientHeight+2)out.push({el:'clamped .mchat .mc-a p',last:desc(p),end:p.scrollHeight,visEnd:p.clientHeight,navTop:0,reach:p.clientHeight-p.scrollHeight,ok:false});
  return {vv:visualViewport?Math.round(visualViewport.height):null,ih:innerHeight,rows:out};
},TOL);}
async function setup(p){await p.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;UI.title=false;UI.menu=false;UI._clk=null;
  /* 받은 편지·대화가 있어야 소식함·감독실 끝을 잰다 */for(let i=0;i<30;i++)mail('알림','점검용 소식 '+i,'본문 '+i);
  G.mgrChat=[{d:G.day,t:'now',a:'지금은 선발 뒤가 얇습니다. 불펜에서 길게 던질 투수가 한 명 더 있어야 하고, 타선은 하위 타순 출루가 문제입니다. 젊은 포수는 수비가 늘었지만 타격은 아직입니다. 외국인 타자가 살아나면 순위 싸움은 해 볼 만합니다. 다만 부상자가 돌아오기 전까지는 무리하지 않겠습니다.'}];render();});}
async function go(p,route){await p.evaluate(r=>{closeSheets?.();UI._clk=null;if(r.startsWith('js:'))(0,eval)(r.slice(3));else A.go(r);},route);await p.waitForTimeout(250);}
(async()=>{const json=process.argv.includes('--json');const capture=process.env.CAPTURE;if(capture)fs.mkdirSync(capture,{recursive:true});
  const server=await startHtmlServer(process.env.HTML||path.resolve(__dirname,'../index.html'));let browser;const failures=[],errors=[],report={};
  try{browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});
    for(const size of SIZES){
      const base=size.ua?devices[size.ua]:{};const ctx=await browser.newContext({...base,viewport:{width:size.width,height:size.height},deviceScaleFactor:capture?2:(base.deviceScaleFactor||2),isMobile:true,hasTouch:true});
      const p=await ctx.newPage();
      /* 보이는 영역(visualViewport)이 창(innerHeight)보다 짧은 안드로이드: 아래쪽 toolbar px 만큼 가려진 것처럼 */
      if(size.toolbar)await p.addInitScript(t=>{const v=window.visualViewport;if(!v)return;const P=Object.getPrototypeOf(v);const h=Object.getOwnPropertyDescriptor(P,'height');Object.defineProperty(v,'height',{configurable:true,get(){return Math.max(0,h.get.call(v)-t);}});addEventListener('load',()=>v.dispatchEvent(new Event('resize')));},size.toolbar);p.on('pageerror',e=>errors.push(size.name+': '+e.message));
      await p.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));await p.route('https://www.googletagmanager.com/**',r=>r.fulfill({body:'',contentType:'text/javascript'}));
      await p.goto(server.url,{waitUntil:'domcontentloaded'});await setup(p);
      for(const [name,route] of SCREENS){await go(p,route);const m=await measure(p);report[size.name+' '+name]=m.rows;
        for(const r of m.rows)if(!r.ok)failures.push(`${size.name} ${name}: ${r.el} 마지막 ${r.last} 끝 ${r.end} > 보이는 끝 ${r.visEnd} (${-r.reach}px 가려짐)`);
        if(capture)await p.screenshot({path:path.join(capture,`${size.name}-${name}.png`)});}
      await ctx.close();}
    if(json)console.log(JSON.stringify(report,null,1));
    else for(const [k,rows] of Object.entries(report))console.log(k.padEnd(30),rows.length?rows.map(r=>(r.ok?'':'!')+(r.el==='bnav'?'탭':'')+r.reach).join(' '):'(스크롤 칸 없음)');
    assert.deepEqual(errors,[]);assert.deepEqual(failures,[],failures.join('\n'));console.log('휴대폰 화면 맨 아래 닿기:',SIZES.length,'크기 ×',SCREENS.length,'화면 통과');
  }finally{await browser?.close();await server.close();}})().catch(e=>{console.error(e.message||e);process.exitCode=1;});
