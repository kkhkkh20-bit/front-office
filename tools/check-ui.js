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
  /* itch 껍데기에서 옛 저장 옮겨 오기: 저장이 없을 때 itch 주소에서 온 저장만 받는다(다른 주소·이미 저장이 있으면 무시) */
  { where='옛 저장 옮겨 오기'; const r=await ev(()=>{ const keep={}; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); keep[k]=localStorage.getItem(k); } localStorage.clear();
      const items={[META]:JSON.stringify({active:1,slots:{1:{tid:3,name:'점검',date:'x',y:2027,at:1}}}),[slotKey(1)]:'점검저장'};
      const bad=ftMigrateAccept(new MessageEvent('message',{data:{type:'ft-migrate',items},origin:'https://evil.example.com',source:window}));
      const ok=ftMigrateAccept(new MessageEvent('message',{data:{type:'ft-migrate',items},origin:'https://html.itch.zone',source:window})); const got=localStorage.getItem(slotKey(1));
      const again=ftMigrateAccept(new MessageEvent('message',{data:{type:'ft-migrate',items:{[META]:items[META],[slotKey(1)]:'덮어쓰기'}},origin:'https://html.itch.zone',source:window})); const after=localStorage.getItem(slotKey(1));
      localStorage.clear(); for(const k in keep)localStorage.setItem(k,keep[k]); return {bad,ok,got,again,after}; });
    if(r){ if(r.bad)add('옛 저장','itch가 아닌 주소에서 온 저장을 받아들임'); if(!r.ok||r.got!=='점검저장')add('옛 저장','itch에서 온 저장을 옮기지 못함'); if(r.again||r.after!=='점검저장')add('옛 저장','이미 저장이 있는데 덮어씀'); } }
  where='드래프트'; await ev(()=>{ DEMO.on=false; G.tut={done:true,step:99}; A.fdBegin(); }); await pg.waitForTimeout(400); await blank();
  /* 창단 드래프트 시작 버튼: 시작을 눌러야 지명이 되므로 크게 보여야 한다(작은 버튼이라 못 찾던 문제). 선수 정보 창에서도 시작할 수 있어야 한다 */
  { const r=await ev(()=>{ if(!G.fd||G.fd.open!==false)return null; const b=document.querySelector('.fd-gob'); const h=b?Math.round(b.getBoundingClientRect().height):0; const p=Object.values(G.players).find(q=>q.fdPool); A.player(p.id); const s=document.querySelector('#sheet [data-a="fdOpen"]'); closeSheets(); return {h,txt:b?b.innerText:'',sheet:!!s}; });
    if(r){ if(r.h<40)add('드래프트 시작',`시작 버튼이 작거나 없음(높이 ${r.h}px)`); if(!/시작/.test(r.txt))add('드래프트 시작','시작 버튼 문구에 "시작"이 없음'); if(!r.sheet)add('드래프트 시작','시작 전 선수 정보 창에 지명 대신 시작 안내 버튼이 없음'); } }
  /* wRC+: 창단 드래프트 타자 기록표와 선수 정보 창(시즌 기록·최근 3년)에도 보여야 한다 */
  { const r=await ev(()=>{ if(!G.fd)return null; const ov=[UI.fdG,UI.fdV]; UI.fdG='B'; UI.fdV='rec'; render(); const th=[...document.querySelectorAll('#app th')].map(x=>x.innerText.trim()); const fd=th.includes('wRC+');
      const p=Object.values(G.players).find(q=>q.fdPool&&!q.isP&&(q.hist||[]).some(h=>h.lvl==='1군'&&h.pa>=100)); let sh=null; if(p){ A.player(p.id); const t=document.querySelector('#sheet'); sh=!!t&&/wRC\+/.test(t.innerText); closeSheets(); }
      UI.fdV='sc'; render(); const prof=/우리 스카우트 성향/.test((document.querySelector('#app')||document.body).innerText); UI.fdV='dt'; render(); const xh=[...document.querySelectorAll('#app th')].some(x=>/기대 홈런/.test(x.innerText)); UI.fdV='rec'; render(); const y3b=!!document.querySelector('#app [data-a="fdY3"][data-v="1"]'); A.fdY3('1'); const y3on=UI.fdY3===true&&!!document.querySelector('#app [data-a="fdY3"][data-v="1"].on'); A.fdY3('0'); UI.fdG=ov[0]; UI.fdV=ov[1]; render(); return {fd,sh,prof,xh,y3b,y3on}; });
    if(r){ if(!r.fd)add('wRC+','창단 드래프트 타자 기록표에 wRC+ 열이 없음'); if(r.sh===false)add('wRC+','선수 정보 창에 wRC+가 없음'); if(!r.prof)add('스카우트 성향','창단 드래프트 스카우트 탭에 우리 스카우트 성향이 없음'); if(!r.xh)add('기대 홈런','창단 드래프트 데이터팀 탭에 기대 홈런 열이 없음'); if(!r.y3b||!r.y3on)add('최근 3년','창단 드래프트 성적 탭의 최근 3년 전환이 없거나 안 됨'); } }
  /* 지명 직후 카드: 실제 툴 숫자의 색이 그 툴 등급 글자의 색과 같아야 한다(스카우트 등급과 같은 기준·같은 색) */
  { const r=await ev(()=>{ if(!G.fd)return null; const p=Object.values(G.players).find(q=>q.fdPool&&!q.isP); if(!p)return null; const t0=p.team; p.team=G.user; UI.rev={pid:p.id,rd:1,no:1,n:1,open:true}; render();
      const C={S:'r75',A:'r65',B:'r55',C:'r50',D:'r45',E:'r35',F:'r20'}; const box=document.querySelector('.fde-rv .fde-ts:not(.fde-old)'); const bad=[];
      if(box)for(const sp of box.querySelectorAll('.fde-t')){ const em=sp.querySelector('em'), b=sp.querySelector('b'); const L=(em&&em.innerText||'').trim()[0]; if(!C[L])continue; if(!(b.getAttribute('style')||'').includes('--'+C[L]))bad.push(sp.querySelector('i').innerText+' '+L+' '+b.getAttribute('style')); }
      UI.rev=null; p.team=t0; render(); return {has:!!box,bad}; });
    if(r){ if(!r.has)add('지명 카드','실제 능력 툴 칸이 없음'); if(r.bad.length)add('지명 카드','실제 툴 숫자 색이 등급 색과 다름: '+r.bad.join(', ')); } }
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
  /* 팬 게시판: 정규시즌이 끝나고 가을야구를 하는 동안 정규시즌 연패·순위 글이 계속 올라오지 않고, 시리즈 결과(업셋·탈락) 글이 올라와야 한다 */
  const psFanCheck=async()=>{ where='팬 게시판 · 가을야구'; const r=await ev(()=>{ const keep={day:G.day,ps:G.ps}; const oS=window.streakOf; try{
      window.streakOf=()=>'5연패'; G.day=G.cal.end+6; const st=standingsNow().map(x=>x.tid).filter(t=>t!==G.user); const seeds=[st[0],st[1],st[2],st[3],G.user];
      G.ps={seeds,order:[],res:{wc:[G.user,st[3],2,0],spo:[st[2],G.user,3,1]},resD:{wc:G.day-4,spo:G.day-1},round:'po',done:false,cur:null};
      const T=fanThreads(); return {streak:T.filter(t=>/^st/.test(t.id)).map(t=>t.title),rank:T.filter(t=>/^rk/.test(t.id)).map(t=>t.title),ps:T.filter(t=>/^ps/.test(t.id)).map(t=>t.title)};
    } finally { window.streakOf=oS; G.day=keep.day; G.ps=keep.ps; } });
    if(r){ if(r.streak.length)add('팬 게시판','가을야구 중에도 정규시즌 연승·연패 글이 올라옴: '+r.streak.join(' / ')); if(r.rank.length)add('팬 게시판','정규시즌이 끝났는데 순위 글이 올라옴: '+r.rank.join(' / '));
      if(!r.ps.some(t=>/업셋/.test(t)))add('팬 게시판','와일드카드 업셋 글이 없음'); if(!r.ps.some(t=>/탈락/.test(t)))add('팬 게시판','준플레이오프 탈락 글이 없음'); } };
  /* 되돌릴 수 없는 단장 결정: 재계약 거절은 결재로 한 번 더 묻는다(버튼이 밀려 잘못 눌러 사임하던 문제). 야인이어도 게임 설정(저장·불러오기)은 열려야 한다 */
  const gmCheck=async()=>{ where='단장 재계약·야인 설정'; const r=await ev(()=>{ const id='t_gm'; (G.evs=G.evs||[]).push({id,k:'gmRenew',t:'재계약 제안',b:'',opts:[{l:'수락',fx:''},{l:'연봉 인상 요구(+15%)',fx:''},{l:'재계약 거절',fx:''}],d:G.day,exp:G.day+14,def:0,done:false});
      const u0=G.unemp; UI.cfm=null; A.evPick(id+':2'); const asked=!!UI.cfm&&!G.unemp; UI.cfm=null; G.evs=G.evs.filter(e=>e.id!==id);
      const keep={u:G.unemp,tab:UI.tab}; G.unemp={since:G.day}; UI.tab='cfg'; render(); const txt=(document.querySelector('#app')||document.body).innerText; const set=/저장 슬롯/.test(txt)&&/내보내기/.test(txt); G.unemp=keep.u; UI.tab=keep.tab; render(); return {asked,set,u0:!!u0}; });
    if(r){ if(!r.asked)add('재계약','재계약 거절을 한 번 더 묻지 않고 바로 처리함'); if(!r.set)add('야인 설정','야인일 때 게임 설정(저장·불러오기)이 안 열림'); } };
  /* 패치 노트: 안 본 업데이트가 있으면 게임 화면에서 한 번 띄우고, 확인하면 다시 뜨지 않는다. 게임 설정에서 다시 볼 수 있다 */
  const patchCheck=async()=>{ where='패치 노트'; const r=await ev(()=>{ if(typeof PATCH==='undefined')return {none:true}; const k='fronttime-patch-seen'; const keep=localStorage.getItem(k); localStorage.removeItem(k); UI.patchTest=true; UI.patchClosed=false; UI.tab='home'; render();
      const pop=!!document.querySelector('.pn-w'); A.patchOk(); const gone=!document.querySelector('.pn-w'); const seen=localStorage.getItem(k)===PATCH[0].id; UI.patchClosed=false; render(); const again=!!document.querySelector('.pn-w');
      UI.tab='cfg'; UI.sub=Object.assign({},UI.sub||{},{cfg:'set'}); render(); const cfg=/패치 노트/.test((document.querySelector('#app')||document.body).innerText); UI.patchTest=false; UI.tab='home'; if(keep!=null)localStorage.setItem(k,keep); render(); return {pop,gone,seen,again,cfg}; });
    if(r){ if(r.none)add('패치 노트','패치 노트가 없음'); else { if(!r.pop)add('패치 노트','안 본 업데이트가 있는데 띄우지 않음'); if(!r.gone||!r.seen)add('패치 노트','확인해도 닫히지 않거나 기록되지 않음'); if(r.again)add('패치 노트','확인한 뒤에도 다시 뜸'); if(!r.cfg)add('패치 노트','게임 설정에 패치 노트가 없음'); } } };
  /* 국가대표 탭: 상비군(지금 뽑는다면) 명단, 최종 명단이 나오면 우리 선수 옆에 차출 거부 버튼 */
  const ntCheck=async()=>{ where='국가대표'; const r=await ev(()=>{ if(typeof ntView==='undefined')return {none:true}; const keep={nt:G.nt,tab:UI.tab,l:UI.lseg}; UI.tab='league'; UI.lseg='nt'; render(); const txt=(document.querySelector('#app')||document.body).innerText; const proj=/상비군|예비 명단|최종 명단/.test(txt)&&document.querySelectorAll('#app table tr').length>20;
      const S=ntSquad('ag'); const ids=S.map(x=>x.id); const mine=domestic(G.user).find(p=>!ids.includes(p.id)); if(mine)ids[0]=mine.id; G.nt={k:'ag',y:G.year,ids,wild:[],ref:[],res:null}; const d0=G.day; G.day=Math.min(G.day,KD(9,1)); render(); const btn=!!document.querySelector('[data-a="ntRefuse"]'); G.day=d0; G.nt=keep.nt; UI.tab=keep.tab; UI.lseg=keep.l; render(); return {proj,btn}; });
    if(r){ if(r.none)add('국가대표','국가대표 화면이 없음'); else { if(!r.proj)add('국가대표','상비군 명단이 안 보임'); if(!r.btn)add('국가대표','최종 명단의 우리 선수에게 차출 거부 버튼이 없음'); } } };
  const recCheck=async label=>{ where=`${label} · 기록 순위`;
    const r=await ev(()=>{ closeSheets(); const y=G.year; const B=playerRows(y).filter(x=>!x.p.isP&&x.h.hr>0&&!isQual(x,y)).sort((a,b)=>b.h.hr-a.h.hr); const p=B[0]; if(!p)return null;
      UI.lrf={q:true,t:'all'}; UI.lrec='bat'; UI.lrAll=true; UI.ls=UI.ls||{}; const has=()=>!!document.querySelector(`#app table [data-a="player"][data-v="${p.p.id}"]`);
      UI.ls.bat={k:'hr',dir:-1}; A.go('league:rec'); const hr=has(); UI.ls.bat={k:'rbi',dir:-1}; render(); const rbi=has(); UI.ls.bat={k:'ops',dir:-1}; render(); const ops=has(); UI.lrAll=false; UI.ls.bat={k:'ops',dir:-1};
      return {name:p.p.name,hr,rbi,ops}; });
    if(!r)return; if(!r.hr||!r.rbi)add('기록 순위',`규정 타석 미달 ${r.name}이(가) 홈런${r.hr?'':'·'}${r.rbi?'':'타점'} 정렬에 안 나옴`); if(r.ops)add('기록 순위',`규정 타석 미달 ${r.name}이(가) OPS 정렬(규정 이상)에 나옴`); };
  /* 신인 드래프트(드래프트 시즌): 홈 타일과 드래프트 화면에 남은 날과 우리 1라운드 순위(지난 시즌 역순)가 보여야 한다. 드래프트 화면이 현재 순위로 계산하던 문제 */
  const draftCheck=async label=>{ where=`${label} · 신인 드래프트 안내`;
    const r=await ev(()=>{ if(!(G.day>=KD(3,1)&&G.day<G.cal.draft)||G.unemp)return null; const h=[...G.history].reverse().find(x=>x.y<G.year); const n=[...h.order].reverse().findIndex(o=>o.tid===G.user)+1;
      closeSheets(); A.tab('home'); const tl=[...document.querySelectorAll('#app .dtl')].map(x=>x.innerText).find(t=>t.includes('신인 드래프트'))||'';
      UI.it=Object.assign(UI.it||{},{dr:'now'}); A.go('transfer:draft'); const hd=(document.querySelector('#app .dhead')||{}).innerText||''; return {n,tl,hd}; });
    if(!r)return; if(!r.tl.includes('1라운드 '+r.n+'순위'))add('신인 드래프트',`홈 타일에 '1라운드 ${r.n}순위' 없음: ${r.tl.replace(/\n/g,' ')||'타일 없음'}`); if(!r.hd.includes('1라운드 '+r.n+'순위'))add('신인 드래프트',`드래프트 화면에 '1라운드 ${r.n}순위' 없음`); };
  /* FA 예정자: 시즌 중 FA 시장 화면에서 다른 구단의 올 시즌 뒤 FA 예정자를 미리 볼 수 있어야 한다(자금 준비) */
  const faUpCheck=async label=>{ where=`${label} · FA 예정자`; const r=await ev(()=>{ closeSheets(); A.go('transfer:fa'); const sec=[...document.querySelectorAll('#app section')].find(x=>x.innerText.includes('올 시즌 뒤 FA 예정자')); return sec?sec.querySelectorAll('.fur').length:-1; });
    if(r===-1)add('FA 예정자','FA 시장 화면에 올 시즌 뒤 FA 예정자 목록이 없음'); else if(r===0)add('FA 예정자','FA 예정자 목록이 비어 있음'); };
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
  /* 구단 이름 바꾸기(설정): 입력하고 저장하면 화면 이름이 바뀌고, 기본 이름으로 되돌릴 수 있다 */
  { where='구단 이름 바꾸기'; const r=await ev(()=>{ closeSheets(); A.go('cfg:set'); const c=document.querySelector('input[data-tn="0"][data-k="nick"]'); if(!c)return {no:1}; c.value='점검트윈스'; A.tnSave(); const a=tshort(0); const shown=document.body.innerText.includes('점검트윈스'); A.tnReset(); return {a,shown,b:tshort(0)}; });
    if(!r||r.no)add('구단 이름','설정에 구단 이름 바꾸기가 없음'); else { if(!/점검트윈스/.test(r.a))add('구단 이름','저장해도 이름이 안 바뀜: '+r.a); if(/점검트윈스/.test(r.b))add('구단 이름','기본 이름으로 안 돌아옴'); } }
  /* 백업 권유: itch처럼 다른 사이트 안에서 실행 중이면 게임 날짜 60일마다 상단에 백업 권유가 뜨고, '나중에'를 누르면 닫힌다 */
  { where='백업 권유'; const r=await ev(()=>{ const f0=inFrame; inFrame=()=>true; try{ G.bkAt=G.day-61; closeSheets(); A.tab('home'); const on=!!document.querySelector('.blk.bkn'); A.bkLater(); const off=!document.querySelector('.blk.bkn'); G.bkAt=G.day; A.expCode(); const set=G.bkAt===G.day; UI.expCode=null; return {on,off,set}; } finally { inFrame=f0; render(); } });
    if(r){ if(!r.on)add('백업 권유','다른 사이트 안에서 60일이 지났는데 백업 권유가 안 뜸'); if(!r.off)add('백업 권유',"'나중에'를 눌러도 안 닫힘"); if(!r.set)add('백업 권유','내보내기를 해도 백업 날짜가 기록되지 않음'); } }
  /* 저장은 몰아서(0.7초) 한다: 하루 진행·버튼마다 압축 저장(수백 ms)을 하면 굼떴다. 탭을 숨기면 바로 저장한다. 코드 내보내기는 복사 버튼으로 */
  { where='저장 몰아 하기'; const r=await ev(async()=>{ saveNow(); const k=slotKey(meta().active||1); const a=localStorage.getItem(k); G.day+=0; G._svProbe=(G._svProbe||0)+1; save(); const b=localStorage.getItem(k); let c=b; for(let i=0;i<30&&c===b;i++){ await new Promise(z=>setTimeout(z,100)); c=localStorage.getItem(k); }
      G._svProbe++; save(); saveFlush(); const d=localStorage.getItem(k); delete G._svProbe; saveNow(); return {same:a===b,changed:b!==c,flushed:c!==d}; });
    if(r){ if(!r.same)add('저장','save()가 바로 저장함(몰아 하기가 안 됨)'); if(!r.changed)add('저장','0.9초가 지나도 저장되지 않음'); if(!r.flushed)add('저장','탭을 숨길 때(saveFlush) 남은 저장이 끝나지 않음'); } }
  /* 저장 압축: LZ 대신 deflate(브라우저 기본 압축·fflate)로 바꿔 저장 한 번에 화면이 굳는 시간을 줄인다. 옛 LZ 저장도 그대로 열려야 하고,
     몰아 저장(비동기)이 끝나기 전에 바로 저장(saveNow)이 끼어들어도 마지막 상태가 남아야 한다 */
  { where='저장 압축'; const r=await ev(async()=>{ const k=slotKey(meta().active||1); saveNow(); const s=localStorage.getItem(k); const g=unpack(s); const fmt=s&&s[0]==='\u0001';
      const back=!!g&&g.day===G.day&&g.year===G.year&&Object.keys(g.players).length===Object.keys(G.players).length;
      const lz=LZString.compressToUTF16(JSON.stringify(G)); const g2=unpack(lz); const old=!!g2&&g2.day===G.day;
      const J=JSON.stringify(G); let t=performance.now(); LZString.compressToUTF16(J); const tLZ=performance.now()-t; t=performance.now(); saveStore(); const tNew=performance.now()-t;
      G._zProbe=1; save(); await new Promise(z=>setTimeout(z,750)); G._zProbe=2; saveNow(); await new Promise(z=>setTimeout(z,600)); const g3=unpack(localStorage.getItem(k)); const last=!!g3&&g3._zProbe===2; delete G._zProbe; saveNow();
      return {fmt,back,old,tLZ:Math.round(tLZ),tNew:Math.round(tNew),last}; });
    if(r){ if(!r.fmt)add('저장 압축','새 압축 형식으로 저장되지 않음'); if(!r.back)add('저장 압축','저장한 것을 다시 읽지 못함'); if(!r.old)add('저장 압축','옛 LZ 저장을 읽지 못함');
      if(r.tNew>r.tLZ*.6)add('저장 압축',`저장이 충분히 빨라지지 않음(LZ ${r.tLZ}ms · 새 방식 ${r.tNew}ms)`); if(!r.last)add('저장 압축','몰아 저장이 늦게 끝나며 더 새 저장을 덮어씀'); console.log('  저장 압축:',r.tLZ+'ms → '+r.tNew+'ms'); } }
  { where='코드 복사'; const r=await ev(async()=>{ closeSheets(); A.go('cfg:set'); A.expCode(); await new Promise(z=>setTimeout(z,100)); const b=!!document.querySelector('[data-a="expCopy"]'); const p=!!document.querySelector('[data-a="impPaste"]'); UI.expCode=null; render(); return {b,p}; });
    if(r){ if(!r.b)add('코드 복사','코드를 만들어도 복사 버튼이 없음'); if(!r.p)add('코드 복사','붙여넣기 버튼이 없음'); } }
  /* 표시 일관성(외부 리뷰): 홈 상단 전력 예상과 오른쪽 전력 예상 순위가 같아야 하고, 감독 운영 유형과 말투 이름이 겹치지 않아야 하며,
     감독 선임 한 번에 소식함이 여러 건으로 쌓이지 않아야 한다(결재 완료 하나로 묶고, 답이 필요한 인터뷰만 따로) */
  { where='표시 일관성'; const r=await ev(()=>{ closeSheets(); UI.tab='home'; render();
      const tl=[...document.querySelectorAll('.dtl')].find(b=>/전력/.test((b.querySelector('.dtl-l')||{}).textContent||'')); const tv=tl?(tl.querySelector('.dtl-v').textContent.match(/(\d+)위/)||[])[1]:null;
      const me=document.querySelector('.mst tr.me .rk'); const sv=me?me.textContent.trim():null;
      const tyN=Object.values(MTYPE).map(x=>x[0]); const clash=Object.values(MV).map(x=>x.l).filter(l=>tyN.includes(l)||/형$/.test(l));
      const s0=G.mailSeq||0; const c=(G.mmarket||[]).find(x=>!(x.clan||[]).length)||(G.mmarket||[])[0]; let n=-1, subj=[];
      if(c){ UI.cfm=null; A.hireMgr(c.id+':2:1'); if(UI.cfm)A.cfmOk(); closeSheets(); const nw=G.mail.filter(m=>+String(m.id).slice(1)>s0&&!/인터뷰/.test(m.subj)); n=nw.length; subj=nw.map(m=>m.subj); }
      render(); return {tv,sv,clash,n,subj}; });
    if(r){ if(r.tv&&r.sv&&r.tv!==r.sv)add('전력 예상',`홈 상단 ${r.tv}위 · 오른쪽 전력 예상 ${r.sv}위`); if(r.clash.length)add('감독 표시','운영 유형과 헷갈리는 말투 이름: '+r.clash.join(', '));
      if(r.n>1)add('소식 묶기',`감독 선임 한 번에 소식 ${r.n}건: ${r.subj.join(' / ')}`); } }
  /* 정보 신뢰성(외부 리뷰): 계약 전 외국인 후보는 협상 창·선수 정보에서도 목록과 같은 '예상' 값을 보여야 한다(스카우트 툴 평가만 '현재'로 보이면 정답처럼 읽힘).
     선수 요약 줄의 기록에는 몇 년 기록인지 붙인다 */
  { where='정보 신뢰성'; const r=await ev(()=>{ closeSheets(); const p=(G.fmarket||[]).map(id=>G.players[id]).find(q=>q&&q.foreign&&q.team==null); let neg=null, sh=null, mid=null;
      if(p){ const f=fScout(p); mid=f.mid; UI.negWin={k:'fm',id:p.id}; renderSheet(); const h=(document.querySelector('.sheet.negw .sheet-head')||{}).textContent||''; neg={cur:/현재/.test(h),est:/예상/.test(h)&&h.includes(String(mid)),h:h.slice(0,160)}; UI.negWin=null;
        A.player(p.id); const tx=(document.querySelector('#sheet .sheet')||document.querySelector('.sheet')||{}).textContent||''; sh={cur:/현재 종합/.test(tx),est:tx.includes(String(mid)),tx:tx.slice(0,200)}; closeSheets(); }
      const q=domestic(G.user).find(x=>curLine(x)); const pm=q?pMini(q):''; const yr=/20\d\d(년)?( 2군)? (OPS|ERA)/.test(pm.replace(/<[^>]+>/g,''));
      const o=G.teams.find(t=>t.id!==G.user); const gp=domestic(o.id).sort((a,b)=>ovr(b)-ovr(a))[0]; const md=gp?tradeMood(o.id,[],[gp.id],0):null; const mk=md?md.k:null;
      render(); return {mk,has:!!p,mid,neg,sh,yr,pm:pm.replace(/<[^>]+>/g,' ').slice(0,120)}; });
    if(r){ if(r.neg&&(r.neg.cur||!r.neg.est))add('정보 신뢰성',`외국인 후보 협상 창이 목록 예상(${r.mid})과 다른 '현재' 값을 보여 줌: ${r.neg.h}`); if(r.sh&&(r.sh.cur||!r.sh.est))add('정보 신뢰성',`외국인 후보 선수 정보가 목록 예상(${r.mid})과 다른 '현재 종합'을 보여 줌: ${r.sh.tx}`);
      if(r.mk!=null&&r.mk!=='no'&&r.mk!=='more')add('트레이드 예상','상대 에이스를 공짜로 달라는 제안이 수락 가능으로 보임: '+r.mk); if(r.mk===undefined)add('트레이드 예상','반응 예상이 세 단계(수락 가능·추가 대가 필요·거절 가능)로 나뉘지 않음');
      if(!r.yr)add('기록 연도','선수 요약 줄 기록에 연도가 없음: '+r.pm); } }
  where='시즌 준비'; await crawl('시즌 준비'); await sheets('시즌 준비'); await negResult('시즌 준비'); await space('시즌 준비',4);
  if(!QUICK){
    where='시뮬 → 시즌 중'; console.log('  시즌 중:',await sim('period()==="season"&&G.day>=G.cal.open+60',400)); await crawl('시즌 중'); await sheets('시즌 중'); await wkCheck('시즌 중'); await recCheck('시즌 중'); await psFanCheck(); await gmCheck(); await patchCheck(); await ntCheck(); await draftCheck('시즌 중'); await faUpCheck('시즌 중'); await space('시즌 중',6);
    await monkey('시즌 중',+process.env.MONKEY||4);
    where='시뮬 → FA'; console.log('  FA:',await sim('G.fa&&!G.fa.closed&&G.day>=KD(11,6)',600)); await crawl('스토브리그 FA');
    where='FA 협상 창'; await ev(()=>{ const id=(G.fa.pool||[]).find(i=>G.players[i]); if(id!=null)A.negOpen('fa:'+id); }); await pg.waitForTimeout(100); await ev(()=>closeSheets());
    await monkey('스토브리그 FA',+process.env.MONKEY||4);
    where='사임 → 야인'; await ev(()=>{ A.tab('me'); A.resignAsk(); A.resignGo(); }); await pg.waitForTimeout(200); await crawl('야인'); }
  await b.close();
  console.log(`  막 누르기 ${clicks}번`);
  if(probs.length){ console.log(probs.join('\n')); console.log(`화면 점검: 문제 ${probs.length}건`); process.exit(1); }
  console.log('화면 점검: 문제 없음'); })();
