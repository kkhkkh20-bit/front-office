/* 화면 점검: 브라우저(Playwright)로 index.html을 열어 실제로 눌러 보며 오류를 찾는다
 - 첫 화면이 그려지는지(비면 실패)
 - 새 게임: 구단 고르기 → 단장 소개 → 드래프트 → 시즌 준비
 - 여러 시점(시즌 준비, 시즌 중, 스토브리그 FA, 야인)에서 모든 메뉴·하위 메뉴·안쪽 탭을 차례로 연다
 - 선수 정보 창의 모든 탭, 사람 카드, 협상 창, 스페이스바 진행
 각 단계에서 페이지 오류(예외)·콘솔 오류·빈 화면을 모아 보고한다. 하나라도 있으면 실패(종료 코드 1).
 사용: node tools/check-ui.js [index.html 경로]   (playwright 필요: cd tools && npm i && npx playwright install chromium) */
const path=require('path');
let chromium; try{ ({chromium}=require('playwright')); }catch(e){ console.error('playwright가 없습니다. cd tools && npm i && npx playwright install chromium'); process.exit(2); }
const SRC_FILE=path.resolve(process.argv[2]||path.join(__dirname,'..','index.html'));
/* 숨은 오류: 빈 catch(e){}가 삼키는 예외를 드러내려고 점검용 사본을 만든다(원본은 그대로) */
const fs=require('fs'), os=require('os');
const FILE=(()=>{ if(process.env.HIDDEN==='0')return SRC_FILE; let h=fs.readFileSync(SRC_FILE,'utf8'); h=h.replace(/catch\((\w+)\)\{\s*\}/g,(m,v)=>`catch(${v}){window.__sw&&window.__sw(${v})}`);
  h=h.replace('<script','<script>window.__sw=function(e){ try{ console.error("[숨은 오류] "+(e&&e.message||e)+" @"+String(e&&e.stack||"").split("\\n")[1]); }catch(x){} };</script><script');
  const out=path.join(os.tmpdir(),'dsj-check-'+process.pid+'.html'); fs.writeFileSync(out,h); return out; })();
const QUICK=process.env.QUICK==='1';
(async()=>{ const b=await chromium.launch(); const W=+process.env.W||1280; const ctx=await b.newContext({viewport:{width:W,height:W<600?844:860},isMobile:W<600,hasTouch:W<600}); const pg=await ctx.newPage();
  const probs=[]; let where='부팅'; const seen=new Set();
  const add=(k,msg)=>{ const key=k+'|'+msg.slice(0,160); if(seen.has(key))return; seen.add(key); probs.push(`[${k}] ${where}: ${msg.slice(0,300)}`); };
  pg.on('pageerror',e=>add('예외',e.message+(e.stack?' @'+(e.stack.split('\n')[1]||'').trim():'')));
  pg.on('console',m=>{ if(m.type()==='error'&&!/Failed to load resource|posthog|googletagmanager|fonts\.g/.test(m.text()))add('콘솔 오류',m.text()); });
  pg.on('dialog',d=>{ add('대화상자',d.message()); d.dismiss().catch(()=>{}); });
  const appText=()=>pg.evaluate(()=>{ const a=document.getElementById('app'); return a?a.innerText.trim().length:0; });
  const blank=async min=>{ const n=await appText(); if(n<(min||20))add('빈 화면',`글자 ${n}개`); };
  const ev=(fn,arg)=>pg.evaluate(fn,arg).catch(e=>{ add('실행 실패',String(e.message||e)); });
  /* 1) 첫 화면 */
  await pg.goto('file://'+FILE); await pg.waitForTimeout(1200); where='첫 화면'; await blank(30);
  /* 문서 기본: 표준 모드(doctype)·문자셋·휴대폰 화면 폭(viewport). itch.io처럼 파일을 그대로 띄우는 곳에서 필요 */
  { const d=await ev(()=>({mode:document.compatMode,cs:document.characterSet,vp:!!document.querySelector('meta[name=viewport]'),w:document.documentElement.clientWidth}));
    if(d){ if(d.mode!=='CSS1Compat')add('문서','표준 모드가 아님(doctype 없음)'); if(!/utf-8/i.test(d.cs))add('문서','문자셋이 UTF-8이 아님: '+d.cs); if(!d.vp)add('문서','viewport 메타가 없어 휴대폰에서 PC 화면으로 보임'); if(W<600&&d.w>W+20)add('문서',`휴대폰 폭 ${W}인데 화면 폭이 ${d.w}`); } }
  /* 2) 새 게임: 실제 버튼으로 */
  where='구단 고르기'; try{ await pg.click('[data-a="tsGo"][data-v="team"]',{timeout:3000}); await pg.waitForTimeout(300); await blank(); await pg.click('[data-a="start"]',{timeout:3000}); await pg.waitForTimeout(300);
    where='단장 소개'; await blank(); await pg.fill('#gp-name','점검단장'); await pg.click('[data-a="gpStart"]'); await pg.waitForTimeout(600); }catch(e){ add('진행 실패',e.message); }
  where='드래프트'; await ev(()=>{ DEMO.on=false; G.tut={done:true,step:99}; A.fdBegin(); }); await pg.waitForTimeout(400); await blank();
  /* 창단 드래프트 시작 버튼: 시작을 눌러야 지명이 되므로 크게 보여야 한다(작은 버튼이라 못 찾던 문제). 선수 정보 창에서도 시작할 수 있어야 한다 */
  { const r=await ev(()=>{ if(!G.fd||G.fd.open!==false)return null; const b=document.querySelector('.fd-gob'); const h=b?Math.round(b.getBoundingClientRect().height):0; const p=Object.values(G.players).find(q=>q.fdPool); A.player(p.id); const s=document.querySelector('#sheet [data-a="fdOpen"]'); closeSheets(); return {h,txt:b?b.innerText:'',sheet:!!s}; });
    if(r){ if(r.h<40)add('드래프트 시작',`시작 버튼이 작거나 없음(높이 ${r.h}px)`); if(!/시작/.test(r.txt))add('드래프트 시작','시작 버튼 문구에 "시작"이 없음'); if(!r.sheet)add('드래프트 시작','시작 전 선수 정보 창에 지명 대신 시작 안내 버튼이 없음'); } }
  /* 시작을 누르면 다른 구단 지명이 저절로 흘러가야 한다(멈춰 있으면 '진행'을 눌러야 했던 문제) */
  { const first=await ev(()=>{ if(!G.fd||G.fd.open!==false)return null; const pk=G.fd.picks[0]; A.fdOpen(); return pk&&pk.tid!==G.user; }); if(first){ await pg.waitForTimeout(1500); const r=await ev(()=>({on:!!(UI.dl&&UI.dl.on),cur:G.fd.cur})); if(!r.on&&!r.cur)add('드래프트 진행','시작했는데 다른 구단 지명이 흐르지 않음'); await ev(()=>{ try{ dliveStop(); }catch(e){} }); } }
  /* 휴대폰: 위에 고정된 드래프트 상황판이 화면을 너무 많이 차지하지 않는지(우리 차례 기준) */
  if(W<600){ await ev(()=>{ try{ fdAdvance(false); }catch(e){} const F=G.fd; let g=0; while(F.picks[F.cur]&&F.picks[F.cur].tid!==G.user&&g++<60)fdStep(); render(); }); await pg.waitForTimeout(300);
    const hdr=await ev(()=>{ const h=document.querySelector('.dtop'); return h?Math.round(h.getBoundingClientRect().height):0; }); if(hdr>260)add('휴대폰 배치',`드래프트 상단 고정 영역 ${hdr}px(844px 화면의 ${Math.round(hdr/8.44)}%)`); }
  await ev(()=>{ try{ fdAdvance(false); }catch(e){} for(let i=0;i<3;i++){ const r=fdUserRec&&fdUserRec(1)[0]; if(r)A.fdPick(r.id); } });
  await ev(()=>{ let g=0; while(G.fd&&!G.fd.done&&g++<500)fdAdvance(true); if(!G.mgr[G.user])hireMgr(G.mmarket[0].id,3); G.medSet=true; for(const id of [...(G.fmarket||[])]){ const p=G.players[id]; try{ if(p&&!foreignCheck(G.user,p))signForeign(G.user,id); }catch(e){} } closeSheets(); render(); });
  /* 시간 흘리기: 결정은 기본안, 인터뷰는 첫 답, 제안은 거절 */
  const sim=(cond,max)=>ev(([cond,max])=>{ const C=new Function('return '+cond); let n=0; while(n++<max&&!C()){ G.live=null; G.res=null; G.stops=[]; for(const e of (G.evs||[]))if(!e.done)try{ evPick(e.id,e.def??0,true); }catch(x){ e.done=true; } if(G.iv&&!G.iv.done){ let k=0; while(!G.iv.done&&k++<9)ivAnswer(0); } if(G.offers&&G.offers.length)try{ answerOffer(G.offers[0].id,false); }catch(x){} if(G.draft&&!G.draft.done)try{ advanceDraft(false); }catch(x){} (G.comp||[]).forEach(c=>{ try{ if(c.stage!=='done')compAuto(c); }catch(x){} }); if(G.contract&&!G.contract.done&&G.day>=KD(12,10))try{ confirmContracts(); }catch(x){} for(const j of (G.jobs||[]))if(!j.done)try{ jobAnswer(j.tid,false,true); }catch(x){} try{ advance('day'); }catch(e){ console.error('advance '+e.message); G.day++; } } G.live=null; G.res=null; G.stops=[]; closeSheets(); render(); return dstr(G.day); },[cond,max]);
  /* 모든 화면 순회 */
  const crawl=async label=>{ const list=(await ev(()=>{ const L=[]; for(const [k] of NAV){ L.push(k); for(const [s] of (SUBS[k]||[]))L.push(k+':'+s); } L.push('cfg:set','cfg:auth','me','inbox'); return [...new Set(L)]; }))||[];
    for(const t of list){ where=`${label} · ${t}`; await ev(t=>{ closeSheets(); UI.cfm=null; if(t.includes(':'))A.go(t); else A.tab(t); },t); await pg.waitForTimeout(60); await blank();
      /* 안쪽 탭과 분류 버튼 */
      const tabs=(await ev(()=>[...document.querySelectorAll('#app [data-a="itab"],#app [data-a="mf"],#app [data-a="nseg"],#app [data-a="fbf"]')].map(x=>[x.dataset.a,x.dataset.v]).slice(0,24)))||[];
      for(const [a,v] of tabs){ where=`${label} · ${t} · ${a}=${v}`; await ev(([a,v])=>{ try{ A[a](v); }catch(e){ console.error(a+' '+e.message); } },[a,v]); await pg.waitForTimeout(30); await blank(); } } };
  const sheets=async label=>{ where=`${label} · 선수 정보`; const tabs=await ev(()=>{ const p=playersOf(G.user)[0]; A.player(p.id); return [...document.querySelectorAll('#sheet [data-a="ptab"]')].map(x=>x.dataset.v); });
    for(const v of (tabs||[])){ where=`${label} · 선수 정보 · ${v}`; await ev(v=>A.ptab(v),v); await pg.waitForTimeout(40); }
    await ev(()=>{ const p=Object.values(G.players).find(q=>q.team!=null&&q.team!==G.user); if(p)A.player(p.id); }); where=`${label} · 다른 구단 선수`; await pg.waitForTimeout(60);
    for(const k of ['mgr','own','ceo','fan','press']){ where=`${label} · 사람 카드 ${k}`; await ev(k=>{ closeSheets(); A.person(k); },k); await pg.waitForTimeout(40); }
    where=`${label} · 기자 카드`; await ev(()=>{ closeSheets(); const r=pressInit()[0]; if(r)A.person('rep:'+r.id); }); await pg.waitForTimeout(40);
    await ev(()=>closeSheets()); };
  const space=async(label,n)=>{ for(let i=0;i<n;i++){ where=`${label} · 스페이스바 ${i+1}`; await ev(()=>{ G.live=null; G.res=null; closeSheets(); if(UI.tab!=='inbox')A.tab('inbox'); }); await pg.keyboard.press('Space'); await pg.waitForTimeout(250); await ev(()=>{ if(UI.cfm)UI.cfm=null; }); } };
  /* 막 누르기: 화면마다 보이는 버튼 몇 개를 무작위로 눌러 본다(되돌릴 수 없는 버튼은 뺀다). 시드 고정이라 같은 결과가 다시 나온다 */
  const NO=new Set(['newgame','askNew','toTitle','resignGo','resignAsk','slotDel','slotNew','slotOver','impFile','expFile','retireGM','fireMgr','confirmFire','delete','readAll','hireMgr','tsGo','tsCont','gpStart','closeSheet','fdAutoN','calOpen']);
  let seed=+process.env.MSEED||12345, clicks=0; const rnd=()=>{ seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff; };
  const monkey=async(label,per)=>{ const list=(await ev(()=>{ const L=[]; for(const [k] of NAV){ for(const [s] of (SUBS[k]||[]))L.push(k+':'+s); } return L; }))||[];
    for(const t of list){ for(let i=0;i<per;i++){ await ev(t=>{ closeSheets(); UI.cfm=null; A.go(t); },t);
        const r=rnd(); where=`${label} · ${t} · 누름`; const hit=await ev(([NO,r])=>{ const L=[...document.querySelectorAll('#app [data-a]')].filter(x=>!x.disabled&&x.offsetParent!==null&&!NO.includes(x.dataset.a)&&typeof A[x.dataset.a]==='function'); if(!L.length)return null; const x=L[Math.floor(r*L.length)]; const info=[x.dataset.a,x.dataset.v||'']; x.click(); return info; },[[...NO],r]);
        if(!hit)break; clicks++; where=`${label} · ${t} · 누름 ${hit[0]}(${hit[1]})`; await pg.waitForTimeout(40); await ev(()=>{ if(UI.cfm){ UI.cfm=null; } }); await blank(5); } } await ev(()=>{ closeSheets(); UI.cfm=null; render(); }); };
  /* 계약 협상 결과가 눈에 보이는지: 선수단 화면에서 연 다년계약 협상. 거절은 결과 줄(.ng-res)과 다음 제안 가능일, 합의는 도장이 맨 위에 떠야 한다 */
  const negResult=async label=>{ where=`${label} · 다년계약 결과`;
    const r=await ev(()=>{ const out={}; closeSheets(); A.tab('roster'); const L=playersOf(G.user).filter(p=>canExtend(p)).sort((a,b)=>ovr(b)-ovr(a)); if(L.length<2)return {skip:true};
      const a=L[0], b=L[1]; G.agRel=G.agRel||{};
      A.player(a.id); A.ngtOpen('ext:'+a.id); UI.ngt.T.annual=MIN_SAL; UI.ngt.T.bonus=0; UI.ngt.T.opt=0; A.ngtSubmit();
      const res=document.querySelector('#sheet .ng-res'); out.noRes=res?res.innerText:''; const sb=document.querySelector('#sheet [data-a="ngtSubmit"]'); out.noBtn=sb?(sb.disabled?'off':'on'):'none';
      A.ngtSubmit(); out.again=(document.querySelector('#sheet .ng-res')||{}).innerText||'';
      closeSheets(); A.player(b.id); A.ngtOpen('ext:'+b.id); const d=ngtExtDem(b,UI.ngt.T.years); UI.ngt.T.annual=round5(d*1.5); UI.ngt.T.bonus=0; UI.ngt.T.opt=0; A.ngtSubmit();
      if(UI.ngt&&b.extCounter){ A.ngtCounter(); }
      out.done=!!b.extNext||(b.ext&&b.faC); const st=document.querySelector('.stamp-w'); out.stamp=!!st;
      if(st){ const r=st.getBoundingClientRect(); const e=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2); out.top=!!(e&&e.closest('.stamp-w')); }
      out.log=(b.extLast||{}).st||''; return out; });
    if(!r||r.skip)return;
    if(!/거절|안 됩니다|시장/.test(r.noRes))add('협상 결과','낮은 다년계약 제안 뒤 결과 줄이 없음: '+JSON.stringify(r.noRes));
    if(!/다음 주|\d+\/\d+/.test(r.noRes))add('협상 결과','거절 뒤 다음 제안 가능일이 안 보임: '+JSON.stringify(r.noRes));
    if(r.noBtn==='on')add('협상 결과','이번 주에 더 제안할 수 없는데 제안하기 버튼이 그대로 켜져 있음');
    if(!r.done)add('협상 결과','요구의 1.5배 제안에도 합의되지 않음(시나리오 준비 실패)');
    else if(!r.stamp)add('협상 결과','다년계약 합의 도장이 선수단 화면에 안 뜸');
    else if(!r.top)add('협상 결과','합의 도장이 선수 정보 창에 가려짐');
    await ev(()=>{ UI.stamp=null; closeSheets(); render(); }); };
  /* 경기 결과 정리 창: '다음 일까지'로 경기를 넘기면 결과 창이 떠야 하고, 박스스코어를 닫으면 결과 창으로 돌아오고, 스페이스바로 닫힌다 */
  /* 기록 순위: 홈런·타점 같은 누적 기록으로 정렬하면 규정 타석을 못 채운 선수도 나와야 한다(20홈런 80타점인데 안 보이던 문제). 타율·OPS 같은 비율 기록은 규정 기준 이상만 */
  const recCheck=async label=>{ where=`${label} · 기록 순위`;
    const r=await ev(()=>{ closeSheets(); const y=G.year; const B=playerRows(y).filter(x=>!x.p.isP&&x.h.hr>0&&!isQual(x,y)).sort((a,b)=>b.h.hr-a.h.hr); const p=B[0]; if(!p)return null;
      UI.lrf={q:true,t:'all'}; UI.lrec='bat'; UI.lrAll=true; UI.ls=UI.ls||{}; const has=()=>!!document.querySelector(`#app table [data-a="player"][data-v="${p.p.id}"]`);
      UI.ls.bat={k:'hr',dir:-1}; A.go('league:rec'); const hr=has(); UI.ls.bat={k:'rbi',dir:-1}; render(); const rbi=has(); UI.ls.bat={k:'ops',dir:-1}; render(); const ops=has(); UI.lrAll=false; UI.ls.bat={k:'ops',dir:-1};
      return {name:p.p.name,hr,rbi,ops}; });
    if(!r)return; if(!r.hr||!r.rbi)add('기록 순위',`규정 타석 미달 ${r.name}이(가) 홈런${r.hr?'':'·'}${r.rbi?'':'타점'} 정렬에 안 나옴`); if(r.ops)add('기록 순위',`규정 타석 미달 ${r.name}이(가) OPS 정렬(규정 이상)에 나옴`); };
  const wkCheck=async label=>{ where=`${label} · 경기 결과 창`;
    const r=await ev(()=>{ G.live=null; G.res=null; G.stops=[]; (G.evs||[]).forEach(e=>{ if(!e.done)try{ evPick(e.id,e.def??0,true); }catch(x){ e.done=true; } }); G.mail.forEach(m=>m.read=true); closeSheets(); A.adv('event');
      const n=G.dig&&G.dig.games?G.dig.games.length:0; const rows=document.querySelectorAll('#sheet .wkres .wk-g').length; return {n,rows,res:!!G.res}; });
    if(!r||r.res||!r.n)return; if(r.rows!==r.n)add('경기 결과',`경기 ${r.n}개를 넘겼는데 결과 창 경기 ${r.rows}개`);
    await ev(()=>{ const b=document.querySelector('#sheet .wk-g [data-a="openGame"]'); if(b)b.click(); }); await pg.waitForTimeout(80); await pg.keyboard.press('Escape'); await pg.waitForTimeout(80);
    if(!(await ev(()=>!!document.querySelector('#sheet .wkres'))))add('경기 결과','박스스코어를 닫으면 결과 창으로 돌아오지 않음');
    await pg.keyboard.press(' '); await pg.waitForTimeout(120); if(await ev(()=>!!document.querySelector('#sheet .wkres')))add('경기 결과','스페이스바로 결과 창이 닫히지 않음'); };
  /* 넓은 모니터(1920px): 본문이 가운데 좁은 폭(1180px)에 갇혀 태블릿처럼 보이면 안 된다(itch 전체화면에서 발견) */
  if(W>=1000){ where='넓은 모니터'; await pg.setViewportSize({width:1920,height:1080}); await ev(()=>{ closeSheets(); A.tab('home'); }); await pg.waitForTimeout(150);
    const ww=await ev(()=>{ const w=document.querySelector('main.content'); return w?Math.round(w.getBoundingClientRect().width):0; }); if(ww&&ww<1500)add('넓은 모니터',`1920px 화면에서 본문 폭 ${ww}px(1500px 이상이어야 함)`);
    await pg.setViewportSize({width:W,height:860}); await pg.waitForTimeout(100); }
  /* 1군 홈구장 그림: 관중석의 방사선(통로선)이 관중석 밖(하늘·화면 위)으로 튀어나오면 안 된다(itch 플레이 스크린샷) */
  { where='홈구장 그림'; const r=await ev(()=>{ closeSheets(); UI.cmap='home'; A.go('staff:train'); const svg=document.querySelector('svg.campus'); if(!svg)return null;
      const st=[...svg.querySelectorAll('path')].find(e=>e.getAttribute('fill')==='#5d6670'); const L=[...svg.querySelectorAll('path')].filter(e=>e.getAttribute('stroke')==='#4c545c'); if(!st||!L.length)return {n:0};
      let bad=0; for(const e of L){ const n=e.getTotalLength(); const a=e.getPointAtLength(0), b=e.getPointAtLength(n*.97); const pt=svg.createSVGPoint(); pt.x=b.x; pt.y=b.y; if(!st.isPointInFill(pt))bad++; } return {n:L.length,bad}; });
    if(r&&r.n&&r.bad)add('홈구장 그림',`관중석 방사선 ${r.n}개 중 ${r.bad}개가 관중석 밖으로 나감`); }
  where='시즌 준비'; await crawl('시즌 준비'); await sheets('시즌 준비'); await negResult('시즌 준비'); await space('시즌 준비',4);
  if(!QUICK){
    where='시뮬 → 시즌 중'; console.log('  시즌 중:',await sim('period()==="season"&&G.day>=G.cal.open+60',400)); await crawl('시즌 중'); await sheets('시즌 중'); await wkCheck('시즌 중'); await recCheck('시즌 중'); await space('시즌 중',6);
    await monkey('시즌 중',+process.env.MONKEY||4);
    where='시뮬 → FA'; console.log('  FA:',await sim('G.fa&&!G.fa.closed&&G.day>=KD(11,6)',600)); await crawl('스토브리그 FA');
    where='FA 협상 창'; await ev(()=>{ const id=(G.fa.pool||[]).find(i=>G.players[i]); if(id!=null)A.negOpen('fa:'+id); }); await pg.waitForTimeout(100); await ev(()=>closeSheets());
    await monkey('스토브리그 FA',+process.env.MONKEY||4);
    where='사임 → 야인'; await ev(()=>{ A.tab('me'); A.resignAsk(); A.resignGo(); }); await pg.waitForTimeout(200); await crawl('야인'); }
  await b.close();
  console.log(`  막 누르기 ${clicks}번`);
  if(probs.length){ console.log(probs.join('\n')); console.log(`화면 점검: 문제 ${probs.length}건`); process.exit(1); }
  console.log('화면 점검: 문제 없음'); })();
