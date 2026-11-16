/* ===== 프런트컵 관리자 페이지: 주최자가 터미널 없이 게임 안에서 대회를 운영한다 =====
   진입: 설정 › 정보 맨 아래 '관리자' → 관리자 키(서버 비밀값 CUP_ADMIN과 같은 값). 키는 이 기기(localStorage)에만 둔다. 모든 관리 요청은 Worker가 키를 검사한다(틀리면 401).
   흐름: 1) 대회 만들기·접수 열기/닫기 → 2) 접수 현황(덱 보기·제외/복구·참가 파일 올리기) → 3) 시드 확정 + 리그·가을야구 실행(이 브라우저에서, 평범한 난수. 공개 전이면 다시 돌리기)
         → 4) 연재 공개(1~7일차를 하나씩: 게임의 프런트컵 화면에 반영, 날짜별 카페 글 복사, 그림 저장) → 5) 명예의 전당 등록(우승 단장 이름 입력/수정).
   돌린 결과 전체(경기 기록 포함)는 서버의 관리자 전용 자리(cupRun)에 둔다: 다른 기기에서 이어서 공개할 수 있고, 공개 전에는 누구도 못 본다.
   tools/cup-host.cjs는 예비 길로 남는다 */
const ADM_KEY='fo-cup-admin';
const ADM={key:'',chk:'',cup:null,ents:null,drop:[],run:null,runSt:'',busy:false,prog:'',msg:'',bad:false,ask:false,f:null,hof:null};
function admKeyGet(){ try{ return localStorage.getItem(ADM_KEY)||''; }catch(e){ return ''; } }
function admKeySet(k){ try{ if(k)localStorage.setItem(ADM_KEY,k); else localStorage.removeItem(ADM_KEY); }catch(e){} }
const admApi=(p,o)=>{ o=o||{}; const h=Object.assign({Authorization:'Bearer '+ADM.key},o.body!=null?{'Content-Type':'application/json'}:{},o.headers||{});
  return fetch('/api/cup'+p,Object.assign({cache:'no-store',credentials:'same-origin'},o,{headers:h})).then(async r=>{ const j=await cupJson(r); return {r,j}; }); };
function admSay(m,bad){ ADM.msg=m; ADM.bad=!!bad; try{ render(); }catch(e){} }
/* 키 확인: 맞으면 관리자 메뉴가 보인다. 틀리면 지운다 */
function admCheck(){ if(ADM.chk||!xfAvail())return; ADM.key=ADM.key||admKeyGet(); if(!ADM.key){ ADM.chk='none'; return; } ADM.chk='checking';
  admApi('/admin/check').then(({r,j})=>{ if(r.ok){ ADM.chk='ok'; ADM.cup=j.cup||null; } else { ADM.chk=r.status===401?'bad':'off'; if(r.status===401){ admKeySet(''); ADM.key=''; } } },()=>{ ADM.chk='off'; }).finally(()=>{ try{ render(); }catch(e){} }); }
/* 설정 › 정보 맨 아래 한 줄(일반 유저에게는 작은 글자 하나) */
function cupAdminLink(){ if(!xfAvail())return ''; admCheck();
  if(ADM.chk==='ok')return `<p class="adm-link"><button class="btn small" data-a="admOpen">관리자 페이지</button> <button class="lnk small" data-a="admOut">관리자 키 지우기</button></p>`;
  if(!ADM.ask)return `<p class="adm-link"><button class="lnk small muted" data-a="admAsk">관리자</button></p>`;
  return `<p class="adm-link row"><input id="admKey" type="password" placeholder="관리자 키" autocomplete="off" style="max-width:16em"><button class="btn small" data-a="admKeyOk">확인</button>${ADM.chk==='bad'?'<span class="small muted">키가 맞지 않습니다.</span>':''}</p>`; }
const ADM_DAYS=[[1,'1일차 · 참가팀·전력표'],[2,'2일차 · 리그 1~3라운드'],[3,'3일차 · 리그 4~6라운드'],[4,'4일차 · 리그 7~9라운드·최종 순위'],[5,'5일차 · 와일드카드·준PO'],[6,'6일차 · PO'],[7,'7일차 · 한국시리즈·최종 결과']];
const admLd=(p,o)=>{ o=o||{}; return fetch('/api/ladder/admin'+p,Object.assign({cache:'no-store',credentials:'same-origin'},o,{headers:Object.assign({Authorization:'Bearer '+ADM.key},o.body!=null?{'Content-Type':'application/json'}:{})})).then(async r=>{ const j=await cupJson(r); return {r,j}; }); };
Object.assign(A,{
  /* 6) 유저 래더 관리: 등록 덱 검색, 부적절한 팀명 숨김(상대 목록에서 빠짐)·삭제 */
  async admLdFind(){ const el=document.getElementById('admLdQ'); const q=el?el.value.trim():''; ADM.ldq=q; const {r,j}=await admLd('/list?q='+encodeURIComponent(q)).catch(()=>({r:{ok:false},j:{}})); if(!r.ok)return admSay(j.message||'래더 덱을 받지 못했습니다.',true); ADM.ld=j.decks||[]; admSay(`래더 덱 ${j.n}개를 찾았습니다.`); },
  async admLdHide(v,el){ const hide=el&&el.dataset.u!=='1'; const {r,j}=await admLd('/hide',{method:'PUT',body:JSON.stringify({wid:v,hide})}).catch(()=>({r:{ok:false},j:{}})); if(!r.ok)return admSay(j.message||'바꾸지 못했습니다.',true); const x=(ADM.ld||[]).find(d=>d.wid===v); if(x)x.hide=hide?1:0; admSay(hide?'숨겼습니다. 다른 유저의 상대 목록에 나오지 않습니다.':'다시 보이게 했습니다.'); },
  async admLdDel(v){ if(!confirm('이 래더 덱을 지웁니다.'))return; const {r,j}=await admLd('/deck/'+v,{method:'DELETE'}).catch(()=>({r:{ok:false},j:{}})); if(!r.ok)return admSay(j.message||'지우지 못했습니다.',true); ADM.ld=(ADM.ld||[]).filter(d=>d.wid!==v); admSay('지웠습니다.'); },
  admAsk(){ ADM.ask=true; render(); setTimeout(()=>{ const el=document.getElementById('admKey'); if(el)el.focus(); },30); },
  admKeyOk(){ const el=document.getElementById('admKey'), k=(el?el.value:'').trim(); if(!k)return; ADM.key=k; admKeySet(k); ADM.chk=''; admCheck(); },
  admOut(){ admKeySet(''); Object.assign(ADM,{key:'',chk:'none',ask:false,ents:null,run:null,runSt:''}); render(); },
  admOpen(){ if(G&&!UI.title)return A.go('club:cupadm'); UI.sstep='cupadmin'; render(); },
  /* 1) 대회 만들기·열기·닫기 */
  async admCfg(v){ const q=id=>{ const el=document.getElementById(id); return el?el.value.trim():''; };
    const id=q('admId')||'cup1', title=q('admTitle')||'제1회 프런트컵', deadline=q('admDl'), teams=Math.max(4,Math.min(10,+q('admTeams')||10)), minSeasons=+q('admMinS')||0, payCap=+q('admPay')||0;
    if(!/^[A-Za-z0-9_-]{1,32}$/.test(id))return admSay('대회 id는 영문·숫자로 적어 주세요(예: cup1).',true);
    if(deadline&&FrontOfficeCore.cupKstMs(deadline)==null)return admSay('마감은 2026-12-05 21:00 형식(한국시간)으로 적어 주세요.',true);
    const prev=ADM.cup&&ADM.cup.id===id?ADM.cup:{}; const open=v==='open'?true:v==='close'?false:prev.open!==false&&v!=='new'?prev.open:false;
    const c=Object.assign({},FrontOfficeCore.CUP_DEFAULT,{id,title,deadline,format:'league',teams,meet:3,minSeasons,payCap,open});
    ADM.busy=true; const {r,j}=await admApi('/admin/config',{method:'PUT',body:JSON.stringify(c)}).catch(()=>({r:{ok:false},j:{}})); ADM.busy=false;
    if(!r.ok)return admSay(j.message||'저장하지 못했습니다.',true); ADM.cup=Object.assign({},c); CUP.st=''; ADM.ents=null; ADM.run=null; ADM.runSt=''; admSay(open?'접수를 열었습니다. 게임의 프런트컵 화면에 신청 버튼이 보입니다.':'저장했습니다. 접수는 닫혀 있습니다.'); },
  /* 2) 접수 현황 */
  async admEnts(){ ADM.busy=true; render(); const {r,j}=await admApi('/admin/entries').catch(()=>({r:{ok:false},j:{}})); ADM.busy=false;
    if(!r.ok)return admSay(j.message||'신청 목록을 받지 못했습니다.',true); ADM.ents=j.entries||[]; ADM.drop=j.drop||[]; admSay(`신청 ${ADM.ents.length}팀을 받았습니다.`); },
  async admDrop(v,el){ const undo=el&&el.dataset.u==='1'; const {r,j}=await admApi('/admin/drop',{method:'PUT',body:JSON.stringify({h:v,undo})}).catch(()=>({r:{ok:false},j:{}}));
    if(!r.ok)return admSay(j.message||'바꾸지 못했습니다.',true); ADM.drop=j.drop||[]; admSay(undo?'다시 넣었습니다.':'이 팀을 뺐습니다.'); },
  async admFile(){ const el=document.getElementById('admFiles'); const F=el&&el.files?[...el.files]:[]; if(!F.length)return admSay('참가 파일(.json)을 골라 주세요.',true); let ok=0; const bad=[];
    for(const f of F){ try{ const t=await f.text(); const {r,j}=await admApi('/admin/entry',{method:'POST',body:t}); if(r.ok)ok++; else bad.push(`${f.name}: ${(j.errors&&j.errors[0])||j.message||r.status}`); }catch(x){ bad.push(f.name+': 읽지 못함'); } }
    await A.admEnts(); admSay(`참가 파일 ${ok}개를 올렸습니다.${bad.length?' 실패: '+bad.join(' / '):''}`,!!bad.length); },
  /* 3) 대회 돌리기 */
  async admRunLoad(){ ADM.runSt='loading'; render(); const {r,j}=await admApi('/admin/run').catch(()=>({r:{ok:false,status:0},j:{}})); ADM.run=r.ok&&j&&j.v?j:null; ADM.runSt=r.ok?'ok':r.status===404?'none':'off'; render(); },
  async admRun(){ if(ADM.busy)return; if(ADM.run&&ADM.run.day>0)return admSay('이미 공개를 시작한 대회는 다시 돌리지 않습니다.',true);
    if(!ADM.ents)await A.admEnts(); const cfg=Object.assign({},FrontOfficeCore.CUP_DEFAULT,ADM.cup||{}); ADM.busy=true; admSay('시드를 정하고 경기를 돌리는 중입니다.');
    try{ ADM.run=await admRunAll(cfg,ADM.ents||[],ADM.drop||[],t=>{ ADM.prog=t; render(); }); ADM.prog='';
      const {r,j}=await admApi('/admin/run',{method:'PUT',body:JSON.stringify(ADM.run)}); ADM.busy=false; ADM.runSt='ok';
      if(!r.ok)return admSay('경기는 돌렸지만 서버에 저장하지 못했습니다: '+(j.message||r.status),true);
      admSay(`다 돌렸습니다. 우승 ${ADM.run.ents[ADM.run.champ].name}. 아직 아무것도 공개하지 않았습니다.`); }
    catch(x){ console.error(x); ADM.busy=false; ADM.prog=''; admSay('경기를 돌리지 못했습니다: '+(x&&x.message||x),true); } },
  /* 4) 연재 공개: N일차까지 */
  async admPub(v){ const R=ADM.run, d=+v; if(!R||ADM.busy)return; if(d!==R.day+1)return admSay(`${R.day+1}일차를 먼저 공개해 주세요.`,true); ADM.busy=true; admSay(`${d}일차를 올리는 중입니다.`);
    try{ for(const s of R.series.filter(x=>x.day===d)){ const rec=R.recs[s.id]; if(!rec)continue; const id=`${R.id}-${s.id}`;
        let q=await admApi('/admin/game/'+id,{method:'PUT',body:JSON.stringify({v:2,id,title:rec.title,a:rec.a,b:rec.b,g:rec.g})}); if(!q.r.ok)throw new Error(q.j.message||q.r.status);
        for(let i=0;i<rec.games.length;i++){ q=await admApi(`/admin/game/${id}-g${i+1}`,{method:'PUT',body:JSON.stringify(Object.assign({v:2,id:`${id}-g${i+1}`},rec.games[i]))}); if(!q.r.ok)throw new Error(q.j.message||q.r.status); } }
      R.day=d; const p=await admApi('/admin/pub',{method:'PUT',body:JSON.stringify(admPubOf(R))}); if(!p.r.ok)throw new Error(p.j.message||p.r.status);
      await admApi('/admin/run',{method:'PUT',body:JSON.stringify(R)}); ADM.busy=false; CUP.pub=null; CUP.pubSt=''; admSay(`${d}일차를 공개했습니다. 카페 글은 '글 복사'로 옮겨 주세요.`); }
    catch(x){ ADM.busy=false; R.day=Math.min(R.day,d-1); admSay('공개하지 못했습니다: '+(x&&x.message||x),true); } },
  admCopy(v){ const R=ADM.run, t=R&&R.posts[v]; if(!t)return; const done=()=>toast(`${v==='final'?'최종':v+'일차'} 글을 복사했습니다.`);
    try{ navigator.clipboard.writeText(t).then(done,()=>{ admShowText(t); }); }catch(e){ admShowText(t); } },
  admPng(v){ const R=ADM.run; if(!R)return; try{ const c=admDraw(R,v); const a=document.createElement('a'); a.href=c.toDataURL('image/png'); a.download=`frontcup-${R.id}-${v}.png`; document.body.appendChild(a); a.click(); setTimeout(()=>a.remove(),500); }catch(e){ admSay('그림을 만들지 못했습니다.',true); } },
  /* 5) 명예의 전당 등록 */
  async admHof(){ const R=ADM.run; if(!R||R.day<7)return admSay('7일차(한국시리즈)까지 공개한 뒤 등록합니다.',true); const q=id=>{ const el=document.getElementById(id); return el?el.value.trim():''; };
    const gm=FrontOfficeCore.cupName(q('admGm')), rgm=FrontOfficeCore.cupName(q('admRgm')); if(gm&&FrontOfficeCore.cupBadName(gm)||rgm&&FrontOfficeCore.cupBadName(rgm))return admSay('쓸 수 없는 말이 들어 있습니다.',true);
    ADM.busy=true; let H={v:1,cups:[]}; try{ const t=await fetch('/api/cup/results',{cache:'no-store'}); if(t.ok){ const j=await cupJson(t); if(j&&Array.isArray(j.cups))H=j; } }catch(e){}
    const c=admHallOf(R,gm,rgm); H.cups=H.cups.filter(x=>x.id!==c.id).concat([c]);
    const {r,j}=await admApi('/admin/results',{method:'PUT',body:JSON.stringify(H)}).catch(()=>({r:{ok:false},j:{}})); ADM.busy=false;
    if(!r.ok)return admSay(j.message||'등록하지 못했습니다.',true); R.hof={gm,rgm}; await admApi('/admin/run',{method:'PUT',body:JSON.stringify(R)}).catch(()=>{}); HOF.st=''; HOF.data=null; admSay('명예의 전당에 올렸습니다. 처음 화면·설정 › 정보에서 보입니다.'); },
});
function admShowText(t){ ADM.text=t; render(); }
/* 신청 엔트리 → 참가 가능 여부(검증·자격·제외) */
function admEntOk(e,cfg,drop){ const v=FrontOfficeCore.cupValidate(e,cfg); return {v,ok:v.ok&&!v.elig.length&&!drop.includes(e.h)}; }
/* 시드 확정(OVR 순, 정원까지) → 모자라면 AI → 리그 45연전 + 가을야구. 연전 사이마다 화면을 돌려준다 */
async function admRunAll(cfg,ents,drop,prog){ const C=FrontOfficeCore, N=cfg.teams||10; const tick=()=>new Promise(r=>setTimeout(r,0));
  const H=ents.map(e=>Object.assign({},e,{h:e.h||C.cupEntryHash(e)})).filter(e=>admEntOk(e,cfg,drop).ok);
  let hum=C.cupSeed(H.map(e=>Object.assign(e,{ovr:e.ovr||cupOvr(e)}))).slice(0,N); prog(`AI 구단 ${Math.max(0,N-hum.length)}팀을 만드는 중입니다.`); await tick();
  const ai=hum.length<N?cupAiEntries(N-hum.length,cfg.id):[]; const all=C.cupSeed(hum.concat(ai)); const ents2={}; for(const e of all)ents2[e.h]={...e};
  const keys=all.map(e=>e.h), sched=C.cupLeagueSched(keys.length,cfg.meet||3), RR=sched[sched.length-1].r, cnt=keys.map(()=>0), series=[], flat=[], recs={};
  const lab=h=>{ const e=ents2[h]; return e.ai?e.name:`${e.name} ${e.year}`; };
  const stats={L:{bat:{},pit:{}},P1:{bat:{},pit:{}},P2:{bat:{},pit:{}},P3:{bat:{},pit:{}},PS:{bat:{},pit:{}}};
  const add=(T,res,labs)=>{ for(const g of res.games){ for(const b of g.stats.bat){ const t=T.bat[b.key]||(T.bat[b.key]={key:b.key,team:labs[b.k],name:b.name,g:0}); t.g++; for(const k of ['pa','ab','h','d','tr','hr','bb','hbp','sf','rbi','r','sb','so'])t[k]=(t[k]||0)+(b[k]||0); }
    for(const p of g.stats.pit){ const t=T.pit[p.key]||(T.pit[p.key]={key:p.key,team:labs[p.k],name:p.name,g:0}); t.g++; for(const k of ['outs','h','bb','so','r','er','hr','w','l','sv','gs'])t[k]=(t[k]||0)+(p[k]||0); } } };
  const keep=(id,title,a,b,res)=>{ recs[id]={title,a:lab(a),b:lab(b),g:res.games.map(g=>[g.sa,g.sb,g.inn||9,g.walk?1:0]),games:res.games.map(g=>({sa:g.sa,sb:g.sb,log:g.log,bat:g.bat,pit:g.pit,line:g.line}))}; };
  const slim=g=>({sa:g.sa,sb:g.sb,walk:!!g.walk,inn:g.inn||9,lc:g.lc||0,mvp:g.mvp||null});
  for(let i=0;i<sched.length;i++){ const s=sched[i], a=keys[s.a], b=keys[s.b]; const o={cup:cfg.id,round:'L'+s.r,match:s.id,best:cfg.meet||3,all:1,tie:1,home:s.home,ri:[cnt[s.a],cnt[s.b]]};
    const res=cupMatch(ents2[a],ents2[b],o); if(!res.ok)throw new Error('경기 실패 '+JSON.stringify(res.errors||'').slice(0,120)); const labs={A:lab(a),B:lab(b)}, part=C.cupLeaguePart(s.r,RR);
    add(stats.L,res,labs); add(stats['P'+part],res,labs); const G0=res.games.map(slim); cnt[s.a]+=G0.length; cnt[s.b]+=G0.length; for(const g of G0)flat.push({a,b,sa:g.sa,sb:g.sb});
    series.push({id:s.id,kind:'L',r:s.r,day:part+1,a,b,games:G0}); keep(s.id,`리그 ${s.r}라운드`,a,b,res);
    if(i%3===2){ prog(`리그 ${s.r}/${RR}라운드 · ${i+1}/${sched.length}연전`); await tick(); } }
  const stand=C.cupStandings(keys,flat), top=stand.slice(0,5).map(x=>x.key), W={}; let champ=null, runner=null;
  if(top.length>=5)for(const P of C.CUP_POST){ const a=top[P.hi-1], b=typeof P.lo==='number'?top[P.lo-1]:W[P.lo]; prog(`${P.name}`); await tick();
    const res=cupMatch(ents2[a],ents2[b],{cup:cfg.id,round:P.id,match:P.id,best:P.best,home:P.home,...(P.wc?{wc:1,tie:1}:{})}); if(!res.ok)throw new Error(P.name+' 실패');
    add(stats.PS,res,{A:lab(a),B:lab(b)}); const G0=res.games.map(slim), st=C.cupSeriesState(P,G0); W[P.id]=st.win==='A'?a:b;
    series.push({id:P.id,kind:P.id,day:{WC:5,SPO:5,PO:6,KS:7}[P.id],a,b,games:G0,win:W[P.id]}); keep(P.id,P.name,a,b,res); if(P.id==='KS'){ champ=W.KS; runner=champ===a?b:a; } }
  const R={v:1,id:cfg.id,title:cfg.title,at:Date.now(),day:0,cfg:{id:cfg.id,title:cfg.title,teams:N,meet:cfg.meet||3},seeds:keys,ents:ents2,series,stand,top,champ,runner,R:RR,recs};
  R.posts=admPosts(R,stats); R.titles=admTitles(R,stats); return R; }
const admLab=(R,h)=>{ const e=R.ents[h]; return e?(e.ai?e.name:`${e.name} ${e.year}`):'-'; };
const admPct=x=>(x.w+x.l?x.w/(x.w+x.l):0).toFixed(3).replace(/^0/,'');
function admTitles(R,stats){ const C=FrontOfficeCore, no=Object.values(R.ents).filter(e=>e.ai).map(e=>e.h), q=C.cupQual((R.seeds.length-1)*(R.cfg.meet||3));
  return C.cupTitles(Object.values(stats.L.bat),Object.values(stats.L.pit),Object.assign({no},q)); }
function admStandTxt(R,st){ return ['순위 팀 경기 승 패 무 승률 승차 득실',...st.map(x=>`${x.rank}. ${admLab(R,x.key)} ${x.g} ${x.w}승 ${x.l}패 ${x.t}무 ${admPct(x)} ${x.gb?x.gb.toFixed(1):'-'} ${(x.diff>0?'+':'')+x.diff}${x.tb?` (${x.tb})`:''}`)].join('\n'); }
/* 날짜별 카페 글(주최 도구 out/dayN/post.txt와 같은 짜임) */
function admPosts(R,stats){ const C=FrontOfficeCore, T=R.title, L=h=>admLab(R,h), no=Object.values(R.ents).filter(e=>e.ai).map(e=>e.h), P={};
  const POSN={C:'포수','1B':'1루수','2B':'2루수','3B':'3루수',SS:'유격수',LF:'좌익수',CF:'중견수',RF:'우익수',DH:'지명타자'};
  const power=R.seeds.map((h,i)=>{ const e=R.ents[h], M=new Map(e.P.map(p=>[p.id,p])), o=p=>cupPOvr(p);
    return `${i+1}. ${L(h)}${e.ai?' (AI)':''} · OVR ${C.cupOvrTxt(e.ovr)}${e.mgr&&e.mgr.name?` · 감독 ${e.mgr.name}`:''}\n   타순: ${e.ln.map(([id,pos],k)=>`${k+1}.${(M.get(id)||{}).name}(${POSN[pos]||pos} ${o(M.get(id))})`).join(' ')}\n   선발: ${e.rot.map(id=>`${(M.get(id)||{}).name} ${o(M.get(id))}`).join(' · ')}`; }).join('\n\n');
  P[1]=[`[${T}] 참가팀과 진행 방식`,'',`${T}에 ${R.seeds.length-no.length}팀이 참가했습니다.${no.length?` 빈자리 ${no.length}곳은 리그 평균 전력의 AI 구단이 채웁니다(AI는 개인 타이틀·칭호를 받지 않습니다).`:''}`,'',
    '■ 진행',`- 정규리그: ${R.seeds.length}팀이 서로 3연전씩, 팀당 ${(R.seeds.length-1)*3}경기. 모든 구장 같은 규격, 홈 어드밴티지 없음.`,'- 순위: 승률 → 동률 팀끼리 맞대결 → 득실차.','- 가을야구: 와일드카드(4위 vs 5위, 4위가 1승을 안고 시작) → 준플레이오프(3위, 5전3선승) → 플레이오프(2위, 5전3선승) → 한국시리즈(1위, 7전4선승).','','■ 전력표 (OVR 총|투수 타자)',power].join('\n');
  const lg=R.series.filter(s=>s.kind==='L');
  for(let part=1;part<=3;part++){ const ser=lg.filter(s=>s.day===part+1); if(!ser.length)continue; const from=Math.min(...ser.map(s=>s.r)), upto=Math.max(...ser.map(s=>s.r));
    const st=C.cupStandings(R.seeds,lg.filter(s=>s.r<=upto).flatMap(s=>s.games.map(g=>({a:s.a,b:s.b,sa:g.sa,sb:g.sb})))); const S=stats['P'+part], mvp=C.cupMvp(Object.values(S.bat),Object.values(S.pit),no);
    let best=null; for(const s of ser)s.games.forEach((g,gi)=>{ const d=C.cupDrama(g); if(!best||d>best.d)best={d,s,gi}; });
    const res=[]; for(let r=from;r<=upto;r++){ res.push(`${r}라운드`); for(const s of ser.filter(x=>x.r===r)){ const wa=s.games.filter(x=>x.sa>x.sb).length, wb=s.games.filter(x=>x.sb>x.sa).length, t=s.games.length-wa-wb; res.push(`  ${L(s.a)} ${wa}승 ${wb}패${t?` ${t}무`:''} ${L(s.b)} (${s.games.map(x=>x.sa+':'+x.sb).join(', ')})`); } }
    const g=best.s.games[best.gi]; const post=[`[${T} 정규리그 ${part}주차] ${from}~${upto}라운드`,'','■ 결과',...res,'',`■ 순위 (${upto}라운드까지)`,admStandTxt(R,st),'','■ 주간 MVP',mvp?`${mvp.name}(${mvp.team}): ${mvp.txt}`:'-','','■ 이번 주 명경기',`${best.s.r}라운드 ${best.gi+1}차전 ${L(best.s.a)} ${g.sa}:${g.sb} ${L(best.s.b)}${g.walk?' (끝내기)':g.inn>9?` (${g.inn}회)`:''}`,`게임 › 구단 › 프런트컵 › 대회 경기 보기: ${R.id}-${best.s.id}`];
    if(part===3){ const q=C.cupQual((R.seeds.length-1)*3); post.push('','■ 가을야구 진출',...st.slice(0,5).map(x=>`${x.rank}위 ${L(x.key)}`),'',`■ 정규리그 개인 1위 (타율·출루율 ${q.pa}타석, 평균자책점 ${q.outs/3}이닝 이상)`,...admTitles(R,stats).map(t=>`- ${t.k}: ${t.name}(${t.team}) ${t.v}`)); }
    P[part+1]=post.join('\n'); }
  for(const d of [5,6,7]){ const L2=[]; for(const s of R.series.filter(x=>x.day===d&&x.kind!=='L')){ const PP=C.CUP_POST.find(x=>x.id===s.kind), st=C.cupSeriesState(PP,s.games);
      L2.push(`■ ${PP.name}: ${PP.hi}위 ${L(s.a)} vs ${L(s.b)}`,...s.games.map((g,i)=>`  ${i+1}차전 ${L(s.a)} ${g.sa}:${g.sb} ${L(s.b)}${g.walk?' (끝내기)':g.inn>9?` (${g.inn}회)`:''}${g.mvp?` · MVP ${g.mvp.name}`:''}`),`  → ${L(s.win)} ${PP.wc?'진출':`${Math.max(st.wa,st.wb)}승 ${Math.min(st.wa,st.wb)}패로 ${PP.id==='KS'?'우승':'진출'}`} · 경기 보기 ${R.id}-${s.id}`,''); }
    if(L2.length)P[d]=[`[${T} 가을야구] ${d===5?'와일드카드 결정전 · 준플레이오프':d===6?'플레이오프':'한국시리즈'}`,'',...L2].join('\n'); }
  if(R.champ){ const e=R.ents[R.champ], M=new Map(e.P.map(p=>[p.id,p]));
    P[7]=(P[7]||'')+['',`[${T} 최종 결과]`,`우승 ${L(R.champ)} · OVR ${C.cupOvrTxt(e.ovr)}`,`준우승 ${L(R.runner)}`,'','■ 우승 로스터',...e.ln.map(([id,pos],k)=>`${k+1}. ${POSN[pos]||pos} ${(M.get(id)||{}).name}`),`선발: ${e.rot.map(id=>(M.get(id)||{}).name).join(' · ')}`,'','■ 정규리그 최종 순위',admStandTxt(R,R.stand)].join('\n'); }
  return P; }
/* 게임에 보일 공개분(연재): 공개한 날까지의 글·순위·경기 번호 */
function admPubOf(R){ const C=FrontOfficeCore, d=R.day, lg=R.series.filter(s=>s.kind==='L'&&s.day<=d), seen=R.series.filter(s=>s.day<=d);
  const st=d>=2?C.cupStandings(R.seeds,lg.flatMap(s=>s.games.map(g=>({a:s.a,b:s.b,sa:g.sa,sb:g.sb})))).map(x=>({rank:x.rank,name:admLab(R,x.key),ai:R.ents[x.key].ai?1:0,g:x.g,w:x.w,l:x.l,t:x.t,pct:admPct(x),gb:x.gb})):[];
  return {v:1,id:R.id,title:R.title,day:d,at:Date.now(),teams:R.seeds.map(h=>({name:admLab(R,h),ovr:R.ents[h].ovr,ai:R.ents[h].ai?1:0})),stand:st,
    days:ADM_DAYS.filter(([k])=>k<=d).map(([k,t])=>({d:k,t,post:R.posts[k]||''})),games:seen.map(s=>({id:`${R.id}-${s.id}`,day:s.day,t:R.recs[s.id]?R.recs[s.id].title:s.id,a:admLab(R,s.a),b:admLab(R,s.b),g:s.games.map(g=>[g.sa,g.sb])})),
    champ:d>=7&&R.champ?admLab(R,R.champ):null}; }
/* 명예의 전당 한 회차(주최 도구 hall.json과 같은 모양 + 우승 덱) */
function admHallOf(R,gm,rgm){ const C=FrontOfficeCore; const who=(h,g2)=>{ const e=R.ents[h]; return Object.assign({name:e.name,year:e.year,ovr:e.ovr,seed:R.seeds.indexOf(h)+1,wh:!e.ai&&e.wid?C.cupHashStr('wid:'+e.wid):null},e.ai?{ai:true}:{},g2?{gm:g2}:{}); };
  const deck=JSON.parse(JSON.stringify(R.ents[R.champ])); delete deck.wid; delete deck.ts; delete deck.at; deck.h=C.cupEntryHash(deck);
  const ps=R.series.filter(s=>s.kind!=='L').map(s=>{ const P=C.CUP_POST.find(x=>x.id===s.kind), st=C.cupSeriesState(P,s.games); return {id:s.id,name:P.name,a:admLab(R,s.a),b:admLab(R,s.b),w:[st.wa,st.wb],win:admLab(R,s.win)}; });
  return {id:R.id,title:R.title,format:'league',date:new Date().toISOString().slice(0,10),n:R.seeds.filter(h=>!R.ents[h].ai).length,ai:R.seeds.filter(h=>R.ents[h].ai).length,
    champ:Object.assign(who(R.champ,gm),{deck}),runner:who(R.runner,rgm),stand:R.stand.map(x=>({rank:x.rank,name:admLab(R,x.key),...(R.ents[x.key].ai?{ai:true}:{}),w:x.w,l:x.l,t:x.t,pct:admPct(x)})),post:ps,titles:R.titles||[]}; }
/* 그림: 순위표·가을야구 대진·우승 로스터 카드(PNG 저장) */
function admDraw(R,k){ const c=document.createElement('canvas'), W=1080; const rows=k==='stand'?R.stand.length+3:k==='ps'?R.series.filter(s=>s.kind!=='L').length*2+3:16; c.width=W; c.height=120+rows*56; const g=c.getContext('2d');
  g.fillStyle='#10161f'; g.fillRect(0,0,W,c.height); g.fillStyle='#d4a017'; g.fillRect(0,0,W,10); g.fillStyle='#fff'; g.font='bold 44px sans-serif'; g.fillText(`${R.title} ${k==='stand'?'정규리그 순위':k==='ps'?'가을야구':'우승 로스터'}`,48,84);
  g.font='32px sans-serif'; let y=160; const line=(t,c2)=>{ g.fillStyle=c2||'#e8edf3'; g.fillText(t,48,y); y+=56; };
  if(k==='stand')for(const x of R.stand)line(`${x.rank}. ${admLab(R,x.key)}   ${x.w}승 ${x.l}패 ${x.t}무   ${admPct(x)}`,x.rank<=5?'#fff':'#9aa6b2');
  else if(k==='ps')for(const s of R.series.filter(x=>x.kind!=='L')){ const P=FrontOfficeCore.CUP_POST.find(x=>x.id===s.kind); line(`${P.name}: ${admLab(R,s.a)} vs ${admLab(R,s.b)}`,'#d4a017'); line(`   ${s.games.map(x=>x.sa+':'+x.sb).join('  ')}  → ${admLab(R,s.win)}`); }
  else { const e=R.ents[R.champ], M=new Map(e.P.map(p=>[p.id,p])); line(`${admLab(R,R.champ)} · OVR ${FrontOfficeCore.cupOvrTxt(e.ovr)}`,'#d4a017'); e.ln.forEach(([id,pos],i)=>line(`${i+1}. ${CUP_POSK[pos]||pos}  ${(M.get(id)||{}).name}  ${cupPOvr(M.get(id))}`)); line(`선발: ${e.rot.map(id=>(M.get(id)||{}).name).join(' · ')}`); }
  return c; }
function cupAdminView(){ admCheck(); if(!xfAvail())return '<section class="card"><p class="small muted">관리자 페이지는 웹 사이트에서만 쓸 수 있습니다.</p></section>';
  if(ADM.chk!=='ok')return `<section class="card"><h2 class="sec">프런트컵 관리자</h2>${ADM.chk==='checking'?'<p class="small muted">관리자 키를 확인하는 중입니다.</p>':'<p class="small muted">설정 › 정보 맨 아래 \'관리자\'에서 관리자 키를 넣어 주세요.</p>'}</section>`;
  if(ADM.cup&&!ADM.runSt)A.admRunLoad(); const C=FrontOfficeCore, c=ADM.cup||{}, cfg=Object.assign({},C.CUP_DEFAULT,c), R=ADM.run;
  const inp=(id,lab,v,ph,w)=>`<label class="adm-in"><span>${lab}</span><input id="${id}" value="${esc(v??'')}" placeholder="${esc(ph||'')}" autocomplete="off"${w?` style="max-width:${w}"`:''}></label>`;
  const s1=`<section class="card"><h2 class="sec">1. 대회 만들기·열기</h2>${c.id?`<p class="small">지금: <b>${esc(c.title)}</b> (${esc(c.id)}) · ${c.open!==false?'<b>접수 중</b>':'접수 닫힘'}${c.deadline?` · 마감 ${esc(c.deadline)}`:''}</p>`:'<p class="small muted">아직 만든 대회가 없습니다.</p>'}
    ${inp('admId','대회 id',c.id||'cup1','cup1','8em')}${inp('admTitle','대회 이름',c.title||'제1회 프런트컵')}${inp('admDl','접수 마감(한국시간)',c.deadline||'','2026-12-05 21:00','12em')}
    ${inp('admTeams','팀 수(리그 + KBO식 가을야구)',cfg.teams||10,'10','5em')}${inp('admMinS','자격: 최소 시즌',c.minSeasons||'','0','5em')}${inp('admPay','자격: 1군 연봉 합 상한',c.payCap||'','0','8em')}
    <div class="btns"><button class="btn" data-a="admCfg" data-v="save"${ADM.busy?' disabled':''}>저장</button><button class="btn primary" data-a="admCfg" data-v="open"${ADM.busy?' disabled':''}>접수 열기</button><button class="btn" data-a="admCfg" data-v="close"${ADM.busy?' disabled':''}>접수 닫기</button></div></section>`;
  const E=ADM.ents, drop=ADM.drop||[];
  const s2=`<section class="card"><h2 class="sec">2. 접수 현황</h2><div class="btns"><button class="btn small" data-a="admEnts"${ADM.busy||!c.id?' disabled':''}>신청 목록 받기</button></div>
    ${E?`<p class="small">${E.length}팀 신청 · 참가 가능 ${E.filter(e=>admEntOk(e,cfg,drop).ok).length}팀${E.length>cfg.teams?` · 정원 ${cfg.teams}팀을 넘으면 OVR 순으로 나갑니다`:''}</p>
    <div class="adm-ents">${C.cupSeed(E.map(e=>Object.assign(e,{ovr:e.ovr||cupOvr(e)}))).map(e=>{ const x=admEntOk(e,cfg,drop), dr=drop.includes(e.h), fl=x.v.flags.concat(x.v.elig).map(f=>f.msg);
      return `<details class="adm-e${dr?' adm-drop':''}"><summary><b>${esc(e.name)} ${esc(e.year)}</b> <span class="num">${esc(C.cupOvrTxt(e.ovr))}</span> <span class="small muted">${e.at?cupDate(e.at):''}${e.file?' · 파일':''}</span>${dr?' <span class="pill">제외</span>':''}${!x.v.ok?' <span class="pill">오류</span>':''}${fl.length?` <span class="pill">이상치 ${fl.length}</span>`:''}</summary>
        ${fl.length?`<p class="small adm-warn">${fl.map(esc).join('<br>')}</p>`:''}${cupDeckHtml(e)}<div class="btns"><button class="btn small" data-a="admDrop" data-v="${esc(e.h)}" data-u="${dr?1:0}">${dr?'다시 넣기':'제외'}</button></div></details>`; }).join('')||'<p class="small muted">아직 신청이 없습니다.</p>'}</div>`:''}
    <p class="small muted">파일로 받은 참가 덱 올리기</p><div class="row"><input id="admFiles" type="file" accept=".json,application/json" multiple style="min-width:0;flex:1"><button class="btn small" data-a="admFile"${ADM.busy||!c.id?' disabled':''}>올리기</button></div></section>`;
  const pubd=R?R.day:0;
  const s3=`<section class="card"><h2 class="sec">3. 대회 돌리기</h2><p class="small muted">접수를 닫은 뒤 시드(OVR 순)를 정하고 리그 27경기와 가을야구를 이 브라우저에서 돌립니다. 경기는 돌릴 때마다 달라지고, 돌린 결과가 공식 결과입니다. 공개를 시작하기 전에는 다시 돌릴 수 있습니다.</p>
    <div class="btns"><button class="btn primary" data-a="admRun"${ADM.busy||!c.id||pubd>0?' disabled':''}>${R?'다시 돌리기':'시드 확정 + 돌리기'}</button></div>${ADM.prog?`<p class="small">${esc(ADM.prog)}</p>`:''}
    ${R?`<p class="small">돌린 시각 ${cupDate(R.at)} · 우승 <b>${esc(admLab(R,R.champ))}</b> · 준우승 ${esc(admLab(R,R.runner))}</p><details class="hof-d"><summary class="small">최종 순위</summary><pre class="cup-pre">${esc(admStandTxt(R,R.stand))}</pre></details>`:ADM.runSt==='loading'?'<p class="small muted">저장된 결과를 확인하는 중입니다.</p>':''}</section>`;
  const s4=R?`<section class="card"><h2 class="sec">4. 결과 공개(연재)</h2><p class="small muted">하루치씩 공개하면 게임의 프런트컵 화면에 그날까지의 결과·순위·경기 기록이 보입니다.</p>
    <div class="adm-days">${ADM_DAYS.map(([d,t])=>`<div class="adm-day${d<=pubd?' on':''}"><span>${t}</span><span class="btns">${d<=pubd?'<span class="small muted">공개함</span>':`<button class="btn small${d===pubd+1?' primary':''}" data-a="admPub" data-v="${d}"${ADM.busy||d!==pubd+1?' disabled':''}>공개</button>`}<button class="btn small" data-a="admCopy" data-v="${d}">글 복사</button></span></div>`).join('')}</div>
    <div class="btns"><span class="small muted">그림 저장</span><button class="btn small" data-a="admPng" data-v="stand">순위표</button><button class="btn small" data-a="admPng" data-v="ps">가을야구</button><button class="btn small" data-a="admPng" data-v="card">우승 로스터</button></div>
    ${ADM.text?`<textarea class="adm-text" readonly>${esc(ADM.text)}</textarea>`:''}</section>`:'';
  const s5=R&&R.champ?`<section class="card"><h2 class="sec">5. 명예의 전당 등록</h2><p class="small">우승 <b>${esc(admLab(R,R.champ))}</b> · 준우승 ${esc(admLab(R,R.runner))}</p>
    ${inp('admGm','우승 단장 이름(비우면 팀명)',R.hof&&R.hof.gm||'','',null)}${inp('admRgm','준우승 단장 이름(비우면 팀명)',R.hof&&R.hof.rgm||'','',null)}
    <div class="btns"><button class="btn primary" data-a="admHof"${ADM.busy||pubd<7?' disabled':''}>${R.hof?'다시 등록(수정)':'명예의 전당에 등록'}</button>${pubd<7?'<span class="small muted">7일차까지 공개한 뒤 등록합니다.</span>':''}</div></section>`:'';
  const s6=`<section class="card"><h2 class="sec">6. 유저 래더 관리</h2><div class="row"><input id="admLdQ" value="${esc(ADM.ldq||'')}" placeholder="팀명 검색(비우면 최근 등록 순)" autocomplete="off" style="flex:1;min-width:0"><button class="btn small" data-a="admLdFind">찾기</button></div>
    ${ADM.ld?`<div class="adm-ents">${ADM.ld.map(d=>`<div class="adm-day"><span><b>${esc(d.name)}</b> ${esc(d.year||'')} <span class="small muted">${FrontOfficeCore.ulTierName(d.tier)} · OVR ${esc(C.cupOvrTxt(d.ovr))}</span>${d.hide?' <span class="pill">숨김</span>':''}</span><span class="btns"><button class="btn small" data-a="admLdHide" data-v="${esc(d.wid)}" data-u="${d.hide?1:0}">${d.hide?'보이기':'숨기기'}</button><button class="btn small" data-a="admLdDel" data-v="${esc(d.wid)}">삭제</button></span></div>`).join('')||'<p class="small muted">없습니다.</p>'}</div>`:''}</section>`;
  const msg=ADM.msg?`<div class="note${ADM.bad?' bad':''}">${esc(ADM.msg)}</div>`:'';
  return `<div class="setx ws-own cupx admx"><div class="setc">${msg}${s1}${s3}</div><div class="setc">${s2}</div><div class="setc">${s4}${s5}${s6}</div></div>`; }
