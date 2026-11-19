/* 선수 정보 창 얼굴 크기·선명도(카페 고기고 11-18 "선수 사진이 작게 나온다", 같은 날 "사진이 작아지고 화질도 떨어졌다", 구단주 11-18 "가운데 정렬, 더 크게").
   1. PC 능력 탭 인물 카드: 사진은 카드 가운데(±8px) 머리, 카드 안쪽 폭을 가득 채운다("사진이 가득 차야 해": 폭 ≥ 카드 안쪽 폭 − 2px, 옆 띠 없음). 실제로 그려진 얼굴 높이 1366·1920 180px 이상, 1600×900 180px 이상(외국인 후보는 110px 이상).
      1600px 이상은 계약 상자가 카드 아래로 오면서 사진 칸이 52px까지 눌렸었다.
      카드 안 요소(등번호·이름·고치기·현재 능력·잠재력·올해 성적·연봉·비교에 담기)가 다 있고 카드 밖으로 잘리지 않는다.
   2. 휴대폰(390): 머리말 사진 96px 이상(연필 틀 .ph-w에 싸이며 112px 규칙이 빠져 84px였다). 능력·육성·요약·기록 탭 모두.
   3. 선명도: 받은 사진의 naturalWidth가 화면 크기 × 기기 배율 이상(1600 DPR 1·1.5, 390 DPR 3). 얼굴 시트(128·256·384)는 사이트처럼 assets/에서 받는다.
   4. PC 화면 전체 세로 스크롤·가로 넘침·페이지 오류 없음. 사진은 SHEETFACE_OUT(기본 /tmp/sheet-face-1118). */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');const {chromium}=require('playwright');
const ROOT=path.join(__dirname,'..'),HTML=process.env.SHEETFACE_HTML||path.join(ROOT,'index.html'),OUT=process.env.SHEETFACE_OUT||'/tmp/sheet-face-1118';
/* index.html과 assets/만 내준다(사이트 배포와 같은 경로로 얼굴 시트를 받게) */
function serve(){const s=http.createServer((q,r)=>{const u=decodeURIComponent((q.url||'/').split('?')[0]);const f=u==='/'?HTML:u.startsWith('/assets/')&&!u.includes('..')?path.join(ROOT,u):null;
  if(!f||q.method!=='GET'){r.writeHead(404);return r.end();}fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);return r.end();}r.writeHead(200,{'Content-Type':f.endsWith('.html')?'text/html; charset=utf-8':f.endsWith('.webp')?'image/webp':'application/octet-stream','Cache-Control':'no-store'});r.end(d);});});
  return new Promise(res=>s.listen(0,'127.0.0.1',()=>res({url:`http://127.0.0.1:${s.address().port}/`,close:()=>new Promise(r=>s.close(r))})));}
const BOOT=()=>{DEMO.on=false;newGame(6);G.tut={done:true,step:99};G.medSet=true;UI.title=false;render();};
/* 보이는 얼굴 사진 하나(PC 능력 탭은 인물 카드, 그 밖은 머리말) */
/* w·h: object-fit(contain·cover)을 반영해 실제로 그려진 사진 크기, sc: CSS px당 원본 px(선명도는 sc ≥ 기기 배율), cx: 사진 가운데와 카드 가운데 차이 */
const FACE=()=>{const im=[...document.querySelectorAll('#sheet .pf-fm-face>img.av,#sheet .pf-name img.av')].find(e=>e.getClientRects().length&&e.getBoundingClientRect().width>0);if(!im)return null;const r=im.getBoundingClientRect(),fit=getComputedStyle(im).objectFit,nw=im.naturalWidth||1,nh=im.naturalHeight||1;
  const s=fit==='contain'?Math.min(r.width/nw,r.height/nh):fit==='cover'?Math.max(r.width/nw,r.height/nh):r.width/nw,w=Math.min(r.width,nw*s),h=Math.min(r.height,nh*s),card=im.closest('.pf-fmcard'),cb=card&&card.getBoundingClientRect();
  return {w,h,nw,nh,sc:1/s,dpr:devicePixelRatio,card:!!card,iw:card?card.clientWidth:0,cx:cb?Math.abs((r.left+r.width/2)-(cb.left+cb.width/2)):0,ok:im.complete};};
(async()=>{fs.mkdirSync(OUT,{recursive:true});const server=await serve(),browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});
try{for(const [W,H,dpr] of [[1366,768,1],[1600,900,1],[1600,900,1.5],[1920,1080,1],[390,844,3]]){const pc=W>=1100,c=await browser.newContext({viewport:{width:W,height:H},deviceScaleFactor:dpr,isMobile:!pc,hasTouch:!pc}),p=await c.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));await p.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));await p.goto(server.url);await p.waitForFunction(()=>performance.getEntriesByName('fronttime-menu-ready').length>0);
  await p.waitForFunction(()=>typeof newGame==='function'&&typeof DEMO!=='undefined',null,{timeout:30000});await p.waitForTimeout(1800);/* 앱 비동기 부팅이 끝난 뒤 새 게임(느린 컨테이너에서 BOOT가 부팅과 겹치면 G가 비워진다) */await p.evaluate(BOOT);
  const tag=`${W}x${H}@${dpr}`,fit=async what=>{const r=await p.evaluate(()=>({v:document.scrollingElement.scrollHeight-innerHeight,h:document.documentElement.scrollWidth-innerWidth}));assert.ok(r.h<=1,`${tag} ${what}: 가로 넘침 ${r.h}`);if(pc)assert.ok(r.v<=1,`${tag} ${what}: PC 화면 전체 세로 스크롤 ${r.v}`);};
  /* 얼굴 묶음마다 한 명(v6c 0~99 · v13 100~159 · v18 160~): 시트가 달라 크기·선명도가 다를 수 있다 */
  const ids=await p.evaluate(()=>{const L=playersOf(G.user),o=[];for(const [a,b] of [[0,100],[100,160],[160,1e9]]){const q=L.find(x=>{const i=face6Idx(x);return i!=null&&i>=a&&i<b;});if(q)o.push(q.id);}return o;});
  assert.ok(ids.length>=2,`${tag} 얼굴 있는 선수 ${ids.length}명`);
  for(const id of ids){await p.evaluate(id=>{UI.ptab='abil';A.player(id);},id);
    /* 선명한 시트(256·384)가 받아질 때까지 기다린다: 받으면 faceImg가 다시 그린다 */
    let f=null;for(let i=0;i<40;i++){await p.waitForTimeout(150);f=await p.evaluate(FACE);if(f&&f.ok&&f.sc>=f.dpr-.01)break;}
    assert.ok(f,`${tag} 선수 ${id}: 얼굴 사진 없음`);
    const need=pc?180:96;assert.ok(f.h>=need&&f.w>=need*.85,`${tag} 선수 ${id}: 얼굴 ${Math.round(f.w)}×${Math.round(f.h)} (기준 높이 ${need}px)`);
    assert.ok(f.sc>=f.dpr-.01,`${tag} 선수 ${id}: 흐림 — 사진 ${f.nw}px를 ${Math.round(f.w)}px에 (기기 배율 ${f.dpr}, CSS px당 원본 ${f.sc.toFixed(2)}px)`);
    if(pc){assert.ok(f.card,`${tag}: PC 능력 탭은 인물 카드 사진`);assert.ok(f.cx<=8,`${tag} 선수 ${id}: 사진이 카드 가운데가 아님(${Math.round(f.cx)}px)`);assert.ok(f.w>=f.iw-2,`${tag} 선수 ${id}: 사진이 카드 폭을 채우지 않음(${Math.round(f.w)} < ${f.iw})`);
      const k=await p.evaluate(()=>{const c=document.querySelector('#sheet .pf-fmcard'),cb=c.getBoundingClientRect(),miss=['.pf-fm-no','.pf-fm-name b','.pf-fm-name .pe-b','.pf-fm-name span','.pf-fm-key>div:nth-child(1)','.pf-fm-key>div:nth-child(2)','.pf-fm-stats','.pf-fm-role','.pf-fm-pay','.pf-fm-pay [data-a=pcmpTg]'].filter(s=>{const e=c.querySelector(s);if(!e||!e.getClientRects().length)return true;const r=e.getBoundingClientRect();if(r.bottom>cb.bottom+1)window.__clip=(window.__clip||[]).concat(s+" "+Math.round(r.bottom-cb.bottom));return r.height<1||r.bottom>cb.bottom+1||r.right>cb.right+1||r.left<cb.left-1;});
        const no=c.querySelector('.pf-fm-no').getBoundingClientRect(),im=c.querySelector('.pf-fm-face').getBoundingClientRect();return {miss,clip:c.scrollHeight-c.clientHeight,noOnFace:no.left>=im.left-1&&no.top>=im.top-1&&no.bottom<=im.bottom+1};});
      assert.deepEqual(k.miss,[],`${tag} 선수 ${id}: 인물 카드 요소가 없거나 잘림 `+await p.evaluate(()=>JSON.stringify([window.__clip,[...document.querySelectorAll("#sheet .pf-fmcard>*")].map(e=>e.className+":"+Math.round(e.getBoundingClientRect().height))])));assert.ok(k.clip<=1,`${tag} 선수 ${id}: 인물 카드 넘침 ${k.clip}`);assert.ok(k.noOnFace,`${tag}: 등번호는 사진 위 배지`);}
    await fit('선수 능력');}
  await p.screenshot({path:path.join(OUT,`${W}-${dpr}-abil.png`)});
  /* 같은 머리말을 쓰는 다른 탭 */
  for(const t of ['dev','sum','rec','analysis','story']){await p.evaluate(t=>{UI.ptab=t;renderSheet();},t);await p.waitForTimeout(200);await fit('탭 '+t);
    if(!pc){const f=await p.evaluate(FACE);assert.ok(f&&f.h>=96,`${tag} 탭 ${t}: 머리말 얼굴 ${f&&Math.round(f.h)}`);}}
  if(!pc)await p.screenshot({path:path.join(OUT,`${W}-${dpr}-dev.png`)});
  /* 외국인 후보(사진 없는 카드·범위 표시)도 같은 카드 */
  const fid=await p.evaluate(()=>{const q=Object.values(G.players).find(x=>x.foreign&&x.team==null);if(!q)return null;UI.ptab='abil';A.player(q.id);return q.id;});
  if(fid!=null){await p.waitForTimeout(400);await p.screenshot({path:path.join(OUT,`${W}-${dpr}-foreign.png`)});await fit('외국인 후보');if(pc){const ff=await p.evaluate(FACE);if(ff&&ff.card)assert.ok(ff.h>=110&&ff.cx<=8,`${tag} 외국인 후보 얼굴 ${Math.round(ff.h)}px, 가운데 차이 ${Math.round(ff.cx)}px`);const clip=await p.evaluate(()=>{const c=document.querySelector('#sheet .pf-fmcard');return c?c.scrollHeight-c.clientHeight:0;});assert.ok(clip<=1,`${tag} 외국인 후보 카드 넘침 ${clip} `+await p.evaluate(()=>JSON.stringify([...document.querySelectorAll("#sheet .pf-fmcard>*")].map(e=>e.className+":"+Math.round(e.getBoundingClientRect().height)))));}}
  await p.evaluate(()=>closeSheets());
  assert.deepEqual(errors,[],`${tag} 페이지 오류`);console.log(`${tag} 통과`);await c.close();}}
finally{await browser.close();await server.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1});
