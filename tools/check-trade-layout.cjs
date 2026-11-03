/* 실제 소식함에 2:1 제안을 열어 선수 카드의 내용이 경계를 넘지 않는지 확인한다. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright'),{buildSite}=require('./build-site.cjs'),{startSiteServer}=require('./lib/site-server.cjs');
(async()=>{const root=process.env.REVIEW_ROOT||path.resolve(__dirname,'..');buildSite({root});const server=await startSiteServer(path.join(root,'site'));let browser;
try{browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));await p.goto(server.url);await p.waitForFunction(()=>typeof newGame==='function');
 await p.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;const t=G.teams.find(t=>t.id!==G.user),give=domestic(t.id).filter(p=>p.isP).slice(0,2),get=domestic(G.user).find(p=>!p.isP);const o={id:'layout-offer',from:t.id,give:give.map(p=>p.id),get:[get.id],day:G.day,exp:G.day+3};G.offers.push(o);const m=mail(t.nick+' 단장','트레이드 제안: 투수 2명과 야수 1명','선수 정보와 거래 조건을 확인해 주세요.',{kind:'트레이드',imp:true,oid:o.id});m.oid=o.id;window._layoutMail=m.id;UI.title=false;A.openMail(m.id);});
 for(const [width,height]of [[1920,1080],[1788,1125],[1366,768],[1024,768],[768,1024],[390,664],[320,568]]){await p.setViewportSize({width,height});await p.waitForTimeout(220);await p.evaluate(()=>A.openMail(_layoutMail));
  const cards=p.locator('.ibm .tcard.pc');assert.equal(await cards.count(),3,'실제 제안의 2:1 선수 카드');
  const problems=await cards.evaluateAll(cards=>cards.flatMap(card=>{const r=card.getBoundingClientRect();return [...card.querySelectorAll('.pc-top,.pc-core,.pc-ab,.pc-rec,.pc-id>span,.pc-ov,.pc-big,.pc-s,.pc-l,.tc-ft')].filter(el=>{const b=el.getBoundingClientRect();return b.width>0&&(b.left<r.left-1||b.right>r.right+1||b.bottom>r.bottom+1);}).map(el=>({card:card.dataset.v,cls:el.className,cardWidth:r.width,width:el.getBoundingClientRect().width,text:el.innerText}));}));assert.deepEqual(problems,[],width+' 선수 카드 밖으로 넘친 정보');
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2&&document.documentElement.scrollHeight<=innerHeight+2),width+' 소식함 전체 스크롤 없음');
  const accept=p.locator('.ibm [data-a="offerYes"]');await accept.scrollIntoViewIfNeeded();assert.ok(await accept.isVisible(),width+' 제안 수락/거절 접근');
  if(process.env.REVIEW_OUT){fs.mkdirSync(process.env.REVIEW_OUT,{recursive:true});await cards.first().scrollIntoViewIfNeeded();await p.screenshot({path:path.join(process.env.REVIEW_OUT,'trade-'+width+'.png'),scale:'css'});}
  console.log('트레이드 제안',width,height,'2:1 카드·이름/나이·능력/성적·수락/거절 접근 통과');
 }
 assert.deepEqual(errors,[]);
}finally{await browser?.close();await server.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
