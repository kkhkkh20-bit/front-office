/* 중계 수비 연출 검증(사용자 11-19: 2루수가 뒤로 달리며 직선타를 잡거나, 2루수 뒤로 빠진 땅볼을 쫓아가 병살을 잡는 장면).
   여러 경기의 모든 인플레이 타석에서 화면 계획(cContactPlan)이 정한 타구 자리·처리 야수·야수가 서 있던 자리를 3D 경기장 좌표(m)로 옮겨 본다.
   - 내야수 직선타 아웃인데 1.5m 넘게 물러나며 잡는 장면
   - 땅볼 아웃·병살·야수선택인데 내야 흙(마운드 중심 29m) 밖이나 1.5m 넘게 물러난 자리에서 잡는 장면
   - 내야를 빠져나간 안타를 내야수가 쫓아가 잡는 장면
   - 뜬공을 물러나며 잡을 때 공이 떠 있는 시간이 야수가 뛰는 시간보다 짧은 장면
   사용: node tools/check-cast-fielding.cjs [index.html]  (GAMES=경기 수, REPORT=1이면 실패 없이 수만 출력) */
const path=require('node:path');const {chromium}=require('playwright');const {startHtmlServer}=require('./lib/ui-server.cjs');
(async()=>{const html=path.resolve(process.argv[2]||path.resolve(__dirname,'../index.html')),games=+(process.env.GAMES||44);
const server=await startHtmlServer(html);const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium',args:['--disable-webgl']});
const p=await browser.newPage({viewport:{width:1440,height:900}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.setDefaultTimeout(900000);
await p.route('https://**',r=>r.fulfill({body:'',contentType:'text/css'}));await p.goto(server.url);await p.waitForFunction(()=>typeof newGame==='function');
const R=await p.evaluate(games=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;G.day=G.cal.open+2;for(const t of G.teams)setEntry(t.id);const ops=G.teams.filter(t=>t.id!==G.user).map(t=>t.id);G.games=[];
 for(let i=0;i<games;i++){G.day++;const op=ops[i%ops.length],g=simGame(G.day,G.user,op,false);applyGame(G.day,G.user,op,g,false);G.games.unshift(gameRecord(G.day,G.user,op,g,''));}
 /* 3D 경기장 좌표(src/scene3d/scene.mjs point와 같은 식). 새 빌드는 공용 함수(FrontOfficeCore.fieldMetres)를 쓴다 */
 const CTRL=[[[50,89],[0,0]],[[68,73],[-19.3975,19.3975]],[[50,56],[0,38.795]],[[32,73],[19.3975,19.3975]],[[50,72],[0,18.44]],[[50,97],[0,-1.45]],[[40,89],[.95,0]],[[60,89],[-.95,0]],[[74,66],[-25,25]],[[62,50],[-12,38]],[[38,50],[12,38]],[[26,66],[25,25]],[[18,31],[48,75]],[[50,17],[0,98]],[[82,31],[-48,75]]];
 const M=pt=>{const e=CTRL.find(([a])=>Math.hypot(a[0]-pt[0],a[1]-pt[1])<.02);if(e)return e[1];return [-(pt[0]-50)*(pt[1]>56?19.3975/18:1.5),(89-pt[1])*(pt[1]>56?38.795/33:98/72)];};
 const outPlay0=o=>['OUT','DP','SAC'].includes(o),dm=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]),depth=m=>Math.hypot(m[0],m[1]),dirt=m=>Math.hypot(m[0],m[1]-18.44),INF=['P','C','1B','2B','3B','SS'],OF=['LF','CF','RF'];
 const cnt={pa:0,inplay:0,lineInf:0,lineBack:0,gbOut:0,gbDeep:0,gbBack:0,hit:0,hitInf:0,popInf:0,popBack:0,popShort:0,lineSlow:0,gbRun:0,d2Line:0,d2Gb:0},bad=[],worst={lineBack:0,gbBack:0,gbDirt:0,hitInf:0};
 const add=(t,gi,k,o)=>{if(bad.filter(b=>b.t===t).length<4)bad.push({t,gi,k,...o});};
 for(let gi=0;gi<G.games.length;gi++){UI.cast={g:gi,k:0,spd:1};const g=G.games[gi];
  for(let k=0;k<g.pbp.length;k++){const x=g.pbp[k];if(typeof x[1]!=='number')continue;cnt.pa++;const o=x[3];if(!['1B','2B','3B','OUT','DP','SAC'].includes(o))continue;
   const b=cBefore(g,k),cup=!outPlay0(o)&&x[17]==null&&!gamePA(x).bunt;if(cup)x[17]='GB:'+['2B','SS','1B','3B','P'][k%5]; /* 컵 경기 기록처럼 안타에도 타구 방향(내야수 쪽 땅볼)을 넣어 본다 */const m18=x[18]&&typeof x[18]==='object'?x[18]:null,line=o==='OUT'&&m18&&m18.bipType==='GB'&&!m18.fc&&!m18.error&&k%4===0;if(line)m18.bipType='LD'; /* 엔진은 직선타를 외야수 자리로만 보내므로, 내야 땅볼 아웃 넷에 하나를 내야수 직선타 기록으로 바꿔 화면 계획만 본다(기록은 되돌린다) */const plan=cContactPlan(g,k,b,true);if(cup)delete x[17];if(line)m18.bipType='GB';if(!plan.spot)continue;cnt.inplay++;const outPlay=['OUT','DP','SAC'].includes(o),oT=b.half%2===0?g.away:g.home;
   const start=pos=>typeof cFieldStart==='function'?cFieldStart(g,b,pos,true):(pos!=='P'&&pos!=='C'&&cAlign(g,b,oT)[pos])||CFP[pos];
   let fpos=plan.fpos||plan.opos;if(!fpos){const pool=outPlay?[...INF,...OF]:OF;fpos=pool.reduce((best,q)=>!best||cDist(CFP[q],plan.spot)<cDist(CFP[best],plan.spot)?q:best,null);} /* 예전 화면이 고르던 방식 */
   const s2=start(fpos),sm=M(s2),tm=M(plan.spot),back=depth(tm)-depth(sm),run=dm(sm,tm),inf=INF.includes(fpos),air=outPlay&&!plan.errPos&&!plan.gb&&!['DP','SAC'].includes(o),spd=G.players[(fpos==='P'?{id:cPit(g,k)}:cFielders(g,x[0],k).find(f=>f.pos===fpos))?.id]?.r.spd??50;
   const T=FrontOfficeCore.contactTiming({distance:dm([0,0],tm),fieldDistance:run,speed:spd,arc:plan.arc,airOut:air}),info={o,fpos,kind:plan.kind,back:+back.toFixed(1),run:+run.toFixed(1),dirt:+dirt(tm).toFixed(1),flight:T.flight};
   const back2=cDist(CHM,plan.spot)-cDist(CHM,(fpos!=='P'&&fpos!=='C'&&cAlign(g,b,oT)[fpos])||CFP[fpos]); /* 2D 화면(칸) */
   if(outPlay&&inf&&air&&!plan.arc){cnt.lineInf++;if(back>1.5){cnt.lineBack++;worst.lineBack=Math.max(worst.lineBack,back);add('직선타를 물러나며 포구',gi,k,info);}if(T.flight>1500){cnt.lineSlow++;add('느린 직선타',gi,k,info);}if(back2>1.5)cnt.d2Line++;}
   if(outPlay&&inf&&air&&plan.arc){cnt.popInf++;if(back>1.5){cnt.popBack++;if(T.flight<T.reaction+T.run||T.flight<2000){cnt.popShort++;add('물러나며 잡는 뜬공의 체공 시간 부족',gi,k,info);}}}
   if(outPlay&&inf&&plan.gb&&!x[16]&&!gamePA(x).bunt){cnt.gbOut++;const deep=dirt(tm)>29;if(deep){cnt.gbDeep++;worst.gbDirt=Math.max(worst.gbDirt,dirt(tm));}if(back>1.5){cnt.gbBack++;worst.gbBack=Math.max(worst.gbBack,back);}if(deep||back>1.5)add('땅볼 아웃을 내야 뒤에서 처리',gi,k,info);if(run>9){cnt.gbRun++;add('땅볼 아웃 이동 거리 9m 초과',gi,k,info);}if(back2>1.5)cnt.d2Gb++;}
   if(!outPlay&&!plan.infHit&&!gamePA(x).bunt){cnt.hit++;if(inf&&(dirt(tm)>29||back>1.5)){cnt.hitInf++;worst.hitInf=Math.max(worst.hitInf,run);add('내야를 빠진 안타를 내야수가 처리',gi,k,info);}}
  }}
 for(const k in worst)worst[k]=+worst[k].toFixed(1);return {cnt,worst,bad};},games);
await browser.close();await server.close();const c=R.cnt,v=c.lineBack+c.gbDeep+c.gbBack+c.hitInf+c.popShort+c.lineSlow+c.gbRun+c.d2Line+c.d2Gb;
console.log(`중계 수비 연출: ${c.pa}타석 · 인플레이 ${c.inplay}\n - 내야수 직선타 아웃 ${c.lineInf}건 중 물러나며 포구 ${c.lineBack}건(최대 ${R.worst.lineBack}m), 1.5초 넘게 걸리는 직선타 ${c.lineSlow}건\n - 내야 땅볼 아웃·병살 ${c.gbOut}건 중 내야 흙 밖 ${c.gbDeep}건(마운드에서 최대 ${R.worst.gbDirt}m), 물러나며 처리 ${c.gbBack}건(최대 ${R.worst.gbBack}m), 9m 넘게 이동 ${c.gbRun}건\n - 안타 ${c.hit}건 중 내야 뒤 타구를 내야수가 처리 ${c.hitInf}건(최대 ${R.worst.hitInf}m 이동)\n - 내야수 뜬공 ${c.popInf}건 중 물러나며 포구 ${c.popBack}건, 체공 시간 부족 ${c.popShort}건\n - 2D 화면: 직선타 물러남 ${c.d2Line}건, 땅볼 물러남 ${c.d2Gb}건`);
if(errs.length||v&&!process.env.REPORT){console.error(JSON.stringify({bad:R.bad,errs:errs.slice(0,3)},null,1));console.error('중계 수비 연출 검증 실패');process.exit(1);}console.log(process.env.REPORT?'(REPORT: 수만 출력)':'중계 수비 연출 검증 통과');})().catch(e=>{console.error(e);process.exit(1);});
