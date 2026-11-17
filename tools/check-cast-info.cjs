/* 중계 정보 검증(사용자 11-17: 해설과 좌우 정보가 제대로 반영되는가). 여러 경기의 모든 타석에서 좌우 선수 카드(이름·오늘 기록), 점수판(점수·주자·이닝), 결과 해설(결과 단어·다른 경기 선수 이름), 수비 위치 해설(상황)을 기록과 맞춰 본다 */
const path=require('node:path');const {chromium}=require('playwright');const {startHtmlServer}=require('./lib/ui-server.cjs');
(async()=>{const server=await startHtmlServer(path.resolve(__dirname,'../index.html'));const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium',args:['--disable-webgl']});
const p=await browser.newPage({viewport:{width:1440,height:900}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.setDefaultTimeout(900000);
await p.route('https://**',r=>r.fulfill({body:'',contentType:'text/css'}));await p.goto(server.url);
await p.waitForFunction(()=>typeof newGame==='function');
const R=await p.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;G.day=G.cal.open+2;for(const t of G.teams)setEntry(t.id);const op=G.teams.find(t=>t.id!==G.user).id;G.games=[];
 for(let i=0;i<8;i++){G.day++;const g=simGame(G.day,G.user,op,false);applyGame(G.day,G.user,op,g,false);G.games.unshift(gameRecord(G.day,G.user,op,g,''));}
 UI.title=false;UI.tab='home';render();A.cast(0);
 const bad=[],cnt={pa:0,faces:0,score:0,call:0,align:0};const nm=id=>mdPlayer(G.games[UI.cast.g],id).name;
 const KW={K:/삼진/,BB:/볼넷|밀어내기/,HR:/홈런/,DP:/병살/,HBP:/몸에 맞|사구/,SAC:/희생번트/};
 for(let gi=0;gi<G.games.length;gi++){UI.cast.g=gi;const g=G.games[gi];const ids=new Set();for(const sd of ['a','h']){g.box[sd].bat.forEach(q=>ids.add(q.id));g.box[sd].pit.forEach(q=>ids.add(q.id));}
  const inGame=new Set([...ids].map(id=>G.players[id]?.name).filter(Boolean)), others=Object.values(G.players).filter(q=>!ids.has(q.id)&&q.name&&q.name.length>=3&&!inGame.has(q.name)).map(q=>q.name); /* 이 경기 선수와 동명이인은 빼고 본다(무작위 리그에서 거짓 실패) */
  for(let k=0;k<g.pbp.length;k++){const x=g.pbp[k];if(typeof x[1]!=='number')continue;cnt.pa++;castJump(k,false);
   const b=cBefore(g,k),pid=cPit(g,k);
   // faces
   const L=document.querySelector('.cs-face.bat b')?.textContent, Rr=document.querySelector('.cs-face.pit b')?.textContent;
   { const top=x[0]%2===0, bs=document.querySelector('.cs-face.bat')?.classList.contains(top?'l':'r'), ps=document.querySelector('.cs-face.pit')?.classList.contains(top?'r':'l'); if(!bs||!ps)bad.push({gi,k,t:'card side',want:top?'타자 왼쪽(원정)·투수 오른쪽':'타자 오른쪽(홈)·투수 왼쪽'}); } /* 카드 쪽 = 팀 패널 쪽 */
   if(L!==nm(x[1]))bad.push({gi,k,t:'batter card',got:L,want:nm(x[1])}); if(Rr!==nm(pid))bad.push({gi,k,t:'pitcher card',got:Rr,want:nm(pid)});
   // today line brute
   let ab=0,h=0;for(let i=0;i<k;i++){const y=g.pbp[i];if(typeof y[1]!=='number'||y[1]!==x[1])continue;if(!['BB','HBP','SAC'].includes(y[3])&&!y[13])ab++;if(['1B','2B','3B','HR'].includes(y[3]))h++;}
   const sm=document.querySelector('.cs-face.bat .cf-today')?.textContent||'';if(!sm.includes(`${ab}타수 ${h}안타`))bad.push({gi,k,t:'batter today',got:sm.slice(0,30),want:`${ab}타수 ${h}안타`});
   let so=0,pc=0,ok=true;for(let i=0;i<k;i++){const y=g.pbp[i];if(typeof y[1]!=='number'||y[2]!==pid)continue;if(y[3]==='K')so++;const q=storedPitchSequence(y);if(q)pc+=q.length;else ok=false;}
   const ps=document.querySelector('.cs-face.pit .cf-today')?.textContent||'';if(!ps.includes(`${so}삼진`)||ok&&!ps.includes(`${pc}구`))bad.push({gi,k,t:'pitcher today',got:ps.slice(0,40),want:`${so}삼진 ${pc}구`});
   cnt.faces++;
   // score bug
   { const rows=[...document.querySelectorAll('.mb-teams > *')].map(e=>{const m=(e.textContent||'').match(/(\d+)\s*$/);return m?+m[1]:null;}); const dia=[...document.querySelectorAll('.mb-dia i')].map(e=>e.classList.contains('on')); const inn=+(document.querySelector('.mb-inn b')?.textContent||-1);
     if(rows.length===2){cnt.score++; if(rows[0]!==b.sa||rows[1]!==b.sh)bad.push({gi,k,t:'score',got:rows,want:[b.sa,b.sh]});}
     const wantDia=[1,0,2].map(i=>!!b.bases[i]); if(dia.length===3&&JSON.stringify(dia)!==JSON.stringify(wantDia))bad.push({gi,k,t:'bases',got:dia,want:wantDia});
     if(inn!==Math.floor(b.half/2)+1)bad.push({gi,k,t:'inning',got:inn,want:Math.floor(b.half/2)+1}); }
   // commentary
   const c=pbpCall(g,k).c||'';cnt.call++;const kw=KW[x[3]];if(kw&&!kw.test(c))bad.push({gi,k,t:'call kw '+x[3],got:c.slice(0,60)});
   if(!kw&&/삼진|볼넷|병살|홈런/.test(c)&&['1B','2B','3B','OUT'].includes(x[3])&&!/홈런 타자|홈런왕|병살타 이후/.test(c))bad.push({gi,k,t:'call wrong '+x[3],got:c.slice(0,70)});
   if(['2B','3B'].includes(x[3])||(x[3]==='1B'&&!/내야 안타/.test(c))){ const hs=hitShape(g,k,x[3]); cnt.shape=(cnt.shape||0)+1; if(!hs||!c.includes(hs.c))bad.push({gi,k,t:'call shape '+x[3],got:c.slice(0,70),want:hs&&hs.c}); } /* 해설의 타구 묘사가 화면 타구(hitShape)와 같은지 */
   const other=others.find(n=>c.includes(n));if(other)bad.push({gi,k,t:'call other-team name',got:other,c:c.slice(0,60)});
   // align consistency
   const al=cAlign(g,b,b.half%2===0?g.away:g.home)._k;cnt.align+=al?1:0;
   if(al==='in'&&!(b.bases[2]&&b.outs<2))bad.push({gi,k,t:'align in'});if(al==='dp'&&!(b.bases[0]&&b.outs<2))bad.push({gi,k,t:'align dp'});if(al==='hold'&&!(b.bases[0]&&!b.bases[1]))bad.push({gi,k,t:'align hold'});if(al==='bunt'&&!(b.outs===0&&(b.bases[0]||b.bases[1])&&!b.bases[2]))bad.push({gi,k,t:'align bunt'});
  }}
 return {cnt,bad:bad.slice(0,40),nbad:bad.length,types:bad.reduce((m,x)=>(m[x.t]=(m[x.t]||0)+1,m),{})};});
await browser.close();await server.close();if(R.nbad||errs.length){console.error(JSON.stringify({bad:R.bad.slice(0,20),types:R.types,errs:errs.slice(0,3)},null,1));console.error('중계 정보 검증 실패');process.exit(1);}console.log(`중계 정보 검증: ${R.cnt.pa}타석(안타 묘사 ${R.cnt.shape||0}건) · 좌우 카드·점수판·결과 해설·수비 위치 해설 통과`);})().catch(e=>{console.error(e);process.exit(1);});
