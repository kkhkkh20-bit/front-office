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
  /* 2) 새 게임: 실제 버튼으로 */
  where='구단 고르기'; try{ await pg.click('[data-a="tsGo"][data-v="team"]',{timeout:3000}); await pg.waitForTimeout(300); await blank(); await pg.click('[data-a="start"]',{timeout:3000}); await pg.waitForTimeout(300);
    where='단장 소개'; await blank(); await pg.fill('#gp-name','점검단장'); await pg.click('[data-a="gpStart"]'); await pg.waitForTimeout(600); }catch(e){ add('진행 실패',e.message); }
  where='드래프트'; await ev(()=>{ DEMO.on=false; G.tut={done:true,step:99}; A.fdBegin(); }); await pg.waitForTimeout(400); await blank();
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
  where='시즌 준비'; await crawl('시즌 준비'); await sheets('시즌 준비'); await space('시즌 준비',4);
  if(!QUICK){
    where='시뮬 → 시즌 중'; console.log('  시즌 중:',await sim('period()==="season"&&G.day>=G.cal.open+60',400)); await crawl('시즌 중'); await sheets('시즌 중'); await space('시즌 중',6);
    await monkey('시즌 중',+process.env.MONKEY||4);
    where='시뮬 → FA'; console.log('  FA:',await sim('G.fa&&!G.fa.closed&&G.day>=KD(11,6)',600)); await crawl('스토브리그 FA');
    where='FA 협상 창'; await ev(()=>{ const id=(G.fa.pool||[]).find(i=>G.players[i]); if(id!=null)A.negOpen('fa:'+id); }); await pg.waitForTimeout(100); await ev(()=>closeSheets());
    await monkey('스토브리그 FA',+process.env.MONKEY||4);
    where='사임 → 야인'; await ev(()=>{ A.tab('me'); A.resignAsk(); A.resignGo(); }); await pg.waitForTimeout(200); await crawl('야인'); }
  await b.close();
  console.log(`  막 누르기 ${clicks}번`);
  if(probs.length){ console.log(probs.join('\n')); console.log(`화면 점검: 문제 ${probs.length}건`); process.exit(1); }
  console.log('화면 점검: 문제 없음'); })();
