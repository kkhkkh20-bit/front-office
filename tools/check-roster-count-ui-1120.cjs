/* 카페 11-20 '60명으로 줄였는데 FA는 68명이라며 정리하래요': 선수단 화면 정원 패널(지금 정식 · 다음 개막 / 한도 + 내역 + 세지 않는 군 복무)이
   마우스를 올리지 않아도 PC·390에서 보이고 숫자가 rosterParts와 같은지, FA 협상실·무적 계약 화면에도 같은 한 줄 요약이 390에서 보이는지 본다. SHOT=폴더면 화면을 저장 */
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
const SHOT=process.env.SHOT||'';
(async()=>{const server=await startHtmlServer(path.resolve(__dirname,'../index.html'));let browser;
try{browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});
for(const [width,height] of [[1440,900],[390,844]]){const touch=width<1100,ctx=await browser.newContext({viewport:{width,height},isMobile:touch,hasTouch:touch,deviceScaleFactor:SHOT?2:1}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));await p.goto(server.url);await p.waitForFunction(()=>performance.getEntriesByName('fronttime-menu-ready').length>0);
  /* 지금 정식 60명 + 올해 지명 신인 + 개막 전 전역 1 − 개막 전 입대 1, 개막 뒤까지 복무하는 선수 1(세지 않음) */
  const exp=await p.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;UI.title=false;
    G.day=G.cal.end+8; const op=rosterOpenDay(), act=()=>domestic(G.user).filter(p=>!p.foreign&&!p.ys&&!(p.joinY>G.year)&&!milServing(p)&&!p.mil);
    const L=act(); L[0].mil={unit:'상무',from:G.day-300,until:op-20}; L[1].mil={unit:'상무',from:G.day-100,until:op+400}; L[2].mil={unit:'현역',from:G.day+20,until:G.day+20+540};
    for(let i=0;i<9;i++){const q=newPlayer({age:19,isP:i%2===0,base:35,pot:50,team:G.user});q.joinY=G.year+1;q.draft={y:G.year,rd:i+1,no:i+1};}
    while(rosterN(G.user)>60){const q=act().filter(x=>!x.mil).sort((a,b)=>ovr(a)-ovr(b))[0];releasePlayer(q.id);} while(rosterN(G.user)<60)newPlayer({age:22,isP:false,base:40,pot:42,team:G.user});
    const snap=JSON.stringify(G),r=rosterParts(G.user,true); if(JSON.stringify(G)!==snap)throw new Error('rosterParts가 상태를 바꿈'); A.go('roster'); return {...r,L:undefined,mxN:r.L.mx.map(id=>G.players[id].name)}; });
  assert.equal(exp.now,60,'준비: 지금 60'); assert.ok(exp.rk>=9&&exp.mb===1&&exp.out===1&&exp.mx===1,'준비: 내역 '+JSON.stringify(exp)); assert.equal(exp.next,exp.now+exp.rk+exp.nx+exp.mb-exp.out,'다음 개막 = 지금 + 합류 − 입대');
  await p.waitForTimeout(300); const P=p.locator('[data-rcnt]').first(); assert.ok(await P.isVisible(),'정원 패널이 보이지 않음 '+width);
  /* 카페 11-20(정원표를 한 줄로): 휴대폰 세로는 한 줄 요약만 보이고 내역·경고는 '내역'을 눌러 펼친다. 펼치기 전 접힘을 확인하고, 펼친 뒤 같은 숫자를 본다 */
  if(touch){ assert.ok(!(await P.locator('[data-k="mx"]').isVisible()),'390: 펼치기 전에는 내역이 접혀 있어야 함'); const tg=P.locator('.rcnt-tog'); assert.ok(await tg.isVisible(),'390: 내역 버튼이 없음'); await tg.tap(); await p.waitForTimeout(150); }
  const num=async k=>+(await P.locator(`[data-n="${k}"]`).first().innerText()).replace(/[^0-9]/g,'');
  for(const k of ['now','next','rk','nx','mb','out','mx'])assert.equal(await num(k),exp[k],`${width} 패널 ${k} 숫자가 rosterParts와 다름`);
  assert.equal(await num('max'),await p.evaluate(()=>ROSTER_MAX));
  const ex=P.locator('[data-k="mx"]'); assert.ok(await ex.isVisible(),'세지 않는 군 복무 줄이 없음'); assert.match(await ex.innerText(),/세지 않음/);
  const top=await P.locator('.rcnt-top').innerText(); assert.match(top,/지금 정식\s*60/); assert.match(top,new RegExp(`다음 개막\\s*${exp.next}\\s*/\\s*한도\\s*68`));
  if(exp.next>=68)assert.match(await P.locator('[data-rcnt-warn]').innerText(),/FA·무적·트라이아웃 계약이 막힙니다/);
  /* 숫자를 눌러 이름 보기 */ const it=P.locator('details[data-k="mx"]>summary'); await (touch?it.tap():it.click()); await p.waitForTimeout(150); const pop=P.locator('details[data-k="mx"] .rcnt-pop'); assert.ok(await pop.isVisible(),'명단이 펼쳐지지 않음'); assert.match(await pop.innerText(),new RegExp(exp.mxN[0]));
  if(touch){ const h=(await it.boundingBox()).height; assert.ok(h>=40,'탭 크기 '+h); }
  const ov=()=>p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth); assert.ok(await ov()<=1,'가로 넘침 '+width);
  if(!touch){ assert.ok(await p.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1),'PC 선수단 화면에 페이지 스크롤'); if(SHOT){ await P.locator('details[data-k="rk"]>summary').click(); await p.waitForTimeout(150); await p.screenshot({path:path.join(SHOT,'roster-1440.png')}); } }
  /* FA 협상실(390 포함)·무적 화면: 같은 한 줄 요약 */
  const sum=await p.evaluate(()=>{ const q=Object.values(G.players).find(x=>x.team!=null&&x.team!==G.user&&!x.foreign&&!x.ys&&!(x.joinY>G.year)&&ovr(x)>=50); const from=q.team; q.team=null; q.faFrom=from; q.faGrade='B'; q.faPrevSal=q.sal; q.ask={annual:Math.max(5000,q.sal),years:2};
    G.fa={pool:[q.id],offers:{},ai:{},neg:{},mk:{},open:true,openDay:G.day-5,closed:false,results:[],cap:3,outN:{},y0:G.year}; UI.faSel=q.id; A.go('transfer:fa'); return rosterSumTxt(G.user); });
  await p.waitForTimeout(400); const S=p.locator('.faroom [data-ros-sum]').first(); assert.ok(await S.isVisible(),'FA 협상실 정원 요약이 안 보임 '+width); assert.ok((await S.innerText()).includes(sum),'FA 요약 숫자 다름: '+await S.innerText()); assert.match(sum,new RegExp(`^다음 개막 ${exp.next}/68 · 지금 60 \\+ 합류 예정 ${exp.rk+exp.nx+exp.mb} − 입대 1$`));
  assert.match(await S.innerText(),/세지 않음/,'요약에 세지 않는 군 복무 안내 없음');
  if(touch){ const anyHead=p.locator('.fahero [data-ros-sum], .tf-top .tf-k'); assert.ok(await anyHead.first().isVisible(),'390 FA 시장 머리 줄 정원 요약'); }
  const msg=await p.evaluate(()=>{ while(rosterProj(G.user)<ROSTER_MAX){const q=newPlayer({age:19,isP:true,base:35,pot:50,team:G.user});q.joinY=G.year+1;q.draft={y:G.year};} return rosterFullMsg(G.user); }); assert.match(msg,/군 복무 중인 1명은 세지 않았습니다/,'막힌 이유에 군 복무 안내 없음: '+msg);
  await p.evaluate(()=>render()); await p.waitForTimeout(200); assert.ok(await ov()<=1,'FA 화면 가로 넘침 '+width);
  if(touch&&SHOT){ await S.scrollIntoViewIfNeeded(); await p.screenshot({path:path.join(SHOT,'fa-390.png')}); }
  await p.evaluate(()=>{ UI.faSel=null; A.go('transfer:free'); }); await p.waitForTimeout(300); const F=p.locator('.free-workspace [data-ros-sum]'); if(await F.count())assert.ok(await F.first().isVisible(),'무적 화면 정원 요약');
  assert.deepEqual(errors,[],'페이지 오류 '+errors.join('|')); await ctx.close(); }
}finally{await browser?.close();await server.close();}console.log('정원 화면 검사 통과');})().catch(e=>{console.error(e.stack);process.exitCode=1;});
