/* ===== 유저 대회(프런트컵): 엔트리·출전 로스터 앨범·경기 실행·중계 글 =====
   엔트리(공용 형식 src/core/cup.mjs): 그 순간 우리 1군(능력·나이·포지션·투타·타순·선발·불펜·감독). 투수 피로만 0, 부상은 그대로.
   경기: 단장 대전의 가벼운 기준 세계(ladderWorldJson)에 두 엔트리를 0·1번 자리로 넣고 본게임 simGame(가을야구 규칙, 무승부 없음)으로 치른다.
   난수는 본게임과 같은 평범한 난수다: 같은 엔트리라도 돌릴 때마다 결과가 다르다(구단주 11-17: 공은 둥글다. 주최자가 돌린 그 결과가 정답). 홈 어드밴티지는 끈다 */
const CUP_ALB_MAX=20;
/* 경기 엔진이 읽는 선수 값만(기록·이력·계약은 뺀다). 사기는 60으로, 시즌 컨디션(sf)·누적 피로(wear)는 넣지 않는다: 그날 운이 대회 전력을 흔들지 않게 */
const CUP_PK=['id','name','age','isP','pos','th','bt','r','pot','inj','injOut','role','velo','pers','delivery','pexp','vers','foreign','nat','addP','chem','dt']; /* 경기 중 읽는 값(프록시로 확인, 11-17) + 표시용(잠재력·투구 폼·국적). dt(성장 유형): 세부 수비의 나이 몫(dsubAge)이 읽는다 — 없으면 defAt가 본게임과 달라 팀 OVR·대회 경기 수비가 어긋남(11-17) */
const CUP_MK=['id','name','small','pen','youth','disc','tac','ego','rest','arm','dfn','eye','sty','voice'];
const r1=x=>typeof x==='number'?Math.round(x*10)/10:x;
/* 세계 id: 저장마다 하나(새 게임이면 새로). 대회 신청 때 처음 만든다(엔진 난수를 쓰지 않는다) */
function cupWid(){ if(!G.wid){ let s=''; try{ const a=new Uint8Array(8); crypto.getRandomValues(a); s=[...a].map(x=>x.toString(16).padStart(2,'0')).join(''); }catch(e){ s=(Date.now().toString(16)+String(Math.random()).slice(2)).slice(0,16); } G.wid='w'+s; } return G.wid; }
function cupPSnap(p){ const q={}; for(const k of CUP_PK)if(p[k]!=null)q[k]=k==='r'?Object.fromEntries(Object.entries(p.r).map(([a,v])=>[a,r1(v)])):k==='pot'?r1(p[k]):k==='inj'||k==='velo'?Math.round(p[k]*1000)/1000:JSON.parse(JSON.stringify(p[k]));
  q.fat=p.isP?0:Math.round(p.fat||0); const n=typeof jno==='function'?jno(p):p.no; if(n!=null)q.no=n; q.sal=Math.round(p.sal||0); /* 연봉(백만원): 래더·대회 연봉 상한(사용자 11-17) */ return q; }
/* 연봉 상한 기준(사용자 11-17 "공평하게"): 우리 구단(tid)을 뺀 KBO 구단마다 연봉 상위 26명 합의 평균(백만원). 세계·시대가 달라도 덱 연봉을 이 값으로 나눠 비교한다(공용 cupPay) */
function cupPayRef(tid){ const by=new Map(G.teams.filter(t=>t.id!==tid&&!t.indie).map(t=>[t.id,[]])); for(const p of Object.values(G.players)){ const L=by.get(p.team); if(L&&!(p.joinY>G.year)&&!isAway(p))L.push(p.sal||0); }
  const T=[...by.values()].filter(L=>L.length).map(L=>L.sort((a,b)=>b-a).slice(0,26).reduce((a,b)=>a+b,0)); return T.length?Math.round(T.reduce((a,b)=>a+b,0)/T.length):0; }
/* 지금 우리 1군으로 엔트리. o: {name(팀명), cup(대회 id)} */
function cupEntryNow(o){ o=o||{}; const tid=o.tid??G.user, t=team(tid); if(!t)return null;
  const d=depth(tid), act=actOf(tid); /* act: 1군 등록 */ const posOf={}; for(const k in d.ln)posOf[d.ln[k].id]=k;
  const order=orderList(ORDER.filter(k=>d.ln[k]).map(k=>d.ln[k]),tid);
  /* 1군: 엔트리 제도가 켜진 시즌에는 등록 선수 전부(다친 선수 포함), 비시즌에는 감독 뎁스의 주전 9 + 벤치 5 + 선발 5 + 불펜 7 */
  const seen=new Set(), P=[]; for(const p of [...order,...d.bench,...d.sp,...d.pen,...(entryOn()?act.filter(q=>!healthy(q)):[])])if(!seen.has(p.id)){ seen.add(p.id); P.push(cupPSnap(p)); }
  const ln=order.map(p=>[p.id,posOf[p.id]]), lnIds=new Set(ln.map(x=>x[0]));
  const bn=P.filter(p=>!p.isP&&!lnIds.has(p.id)).map(p=>p.id); /* 다친 야수도 벤치 뒤쪽에(시리즈 중 회복하면 쓴다) */
  const rot=d.sp.map(p=>p.id).slice(0,5), pen=[...d.pen.map(p=>p.id)]; for(const p of P)if(p.isP&&!rot.includes(p.id)&&!pen.includes(p.id))pen.push(p.id);
  const bp={}; for(const p of P){ const x=G.bprole&&G.bprole[p.id]; if(x&&x.tid===tid)bp[p.id]=x.k; }
  const m=G.mgr[tid]||{}, mgr={}; for(const k of CUP_MK)if(m[k]!=null)mgr[k]=m[k];
  const hist=(G.history||[]).filter(h=>h.user); const last=o.res||null;
  const e={v:FrontOfficeCore.CUP_V,kind:'cup-entry',cup:String(o.cup||''),wid:o.wid||G.wid||'',name:FrontOfficeCore.cupName(o.name||t.nick),
    club:{tid,city:t.city||'',nick:t.nick||'',code:t.code||'',hue:t.hue??0,pal:(()=>{ try{ return tpal(t).slice(0,4); }catch(x){ return null; } })()},year:G.year,seasons:hist.length,pay:Math.round(P.reduce((a,p)=>a+(p.sal||0),0)),payRef:cupPayRef(tid),capRef:(()=>{ try{ return capOf(G.year); }catch(x){ return 0; } })(), /* 사용자 11-17: 기준은 그 해 샐러리캡 */
    mgr,P,ln,bn,rot,pen,bp,...(last?{res:last}:{}),ts:o.ts||0};
  e.h=FrontOfficeCore.cupEntryHash(e); e.ovr=cupOvr(e); return e; }
/* 팀 OVR(표시 척도): 총 = 본게임 teamRating과 같은 식(공격 .4 · 투수 .45 · 수비 .15), 투수 = 선발 .65 + 불펜 .35, 타자 = 공격·수비만 */
function cupOvr(e){ const P=new Map(e.P.map(p=>[p.id,p])), ok=p=>p&&!(p.injOut>0); const D=FrontOfficeCore.dv;
  const L=e.ln.map(([id,pos])=>[P.get(id),pos]).filter(x=>x[0]);
  const off=avg(L.map(x=>offV(x[0])))*(Math.min(9,L.length)/9), def=avg(L.filter(x=>x[1]!=='DH').map(x=>defAt(x[0],x[1])));
  const rot=e.rot.map(id=>P.get(id)).filter(ok), pen=e.pen.map(id=>P.get(id)).filter(ok);
  const sp=avg(rot.map(spV))*(Math.min(5,rot.length)/5), pv=pen.length?avg(pen.map(penV)):0, pit=sp*.65+pv*.35;
  return {t:D(off*.4+pit*.45+def*.15),p:D(pit),b:D((off*.4+def*.15)/.55)}; }
/* ===== 출전 로스터 앨범: 시즌이 끝날 때마다 자동으로, 또는 '지금 로스터 저장'. 최대 20개(오래된 자동 저장부터 지운다, 우승 시즌은 남긴다) ===== */
function cupAlbum(){ return G.cupAlb||(G.cupAlb=[]); }
function cupAlbumAdd(kind,res){ const e=cupEntryNow({res}); if(!e)return null; const A=cupAlbum(); const x={id:(G.cupAlbN=(G.cupAlbN||0)+1),y:G.year,d:G.day,k:kind,e};
  if(kind==='auto'){ const i=A.findIndex(a=>a.k==='auto'&&a.y===G.year); if(i>=0)A.splice(i,1); }
  if(A.length>=CUP_ALB_MAX&&cupAlbumNext()==null)return null; /* 모두 '보관 고정'이면 지우지 않고 담지 않는다 */
  A.push(x); while(A.length>CUP_ALB_MAX){ const i=cupAlbumNext(); if(i==null)break; A.splice(i,1); } return x; }
/* 가득 찼을 때 다음에 지울 칸(외부 검수 11-17: 직접 저장한 것도 말없이 지우던 것): 고정(pin) 빼고, 우승 아닌 자동 저장 → 자동 저장 → 직접 저장 순, 오래된 것부터. 없으면 null */
function cupAlbumNext(){ const A=cupAlbum(), ok=a=>!a.pin; for(const f of [a=>a.k==='auto'&&!(a.e.res&&a.e.res.champ),a=>a.k==='auto',()=>true]){ const i=A.findIndex(a=>ok(a)&&f(a)); if(i>=0)return i; } return null; }
function cupAlbumPin(id){ const a=cupAlbum().find(x=>x.id===+id); if(!a)return false; a.pin=a.pin?0:1; return true; }
function cupAlbumAuto(y,rank,champ,uo){ try{ if(G.unemp||G.user==null)return; cupAlbumAdd('auto',{rank,champ:champ?1:0,w:uo&&uo.w||0,l:uo&&uo.l||0,t:uo&&uo.t||0}); }catch(e){ console.error(e); } }
function cupAlbumDel(id){ const A=cupAlbum(), i=A.findIndex(a=>a.id===+id); if(i<0)return null; return {x:A.splice(i,1)[0],i}; } /* 되돌리기용으로 지운 칸·자리를 돌려준다 */

/* ===== 경기 ===== */
/* 엔트리를 세계의 tid 자리에. 선수 id = 원래 id + 100만 × k(엔트리 해시로 정한 1~256): 대회 내내 같은 선수는 같은 id(타구 방향 버릇 등 id로 정해지는 값이 경기마다 같게) */
function cupIdBase(e,taken){ let k=1+parseInt(String(e.h||FrontOfficeCore.cupEntryHash(e)).slice(0,2),16); while(taken===k)k=k%256+1; return k; }
function cupInstall(tid,e,k){ const off=k*1e6, get=id=>G.players[id+off];
  for(const s of e.P){ const q=JSON.parse(JSON.stringify(s)); q.id=s.id+off; q.team=tid; if(q.chem&&typeof q.chem==='object'&&!Array.isArray(q.chem))q.chem=Object.fromEntries(Object.entries(q.chem).map(([c,v])=>[/^\d+$/.test(c)?String(+c+off):c,v])); /* 배터리 호흡: 포수 id도 같이 옮긴다 */ q.mor=60; q.injOut=s.injOut||0; q.fat=s.fat||0; q.sal=q.sal||MIN_SAL; if(!q.inj)q.inj=.15; G.players[q.id]=q; }
  G.mgr[tid]=Object.assign({small:50,pen:50,youth:50,disc:50,tac:50,ego:50,rest:50,arm:50,dfn:50,eye:50},JSON.parse(JSON.stringify(e.mgr||{})),{interim:false,id:'CM'+tid+(e.mgr&&e.mgr.id||'')});
  G.bprole=G.bprole||{}; for(const id in (e.bp||{}))G.bprole[+id+off]={tid,k:e.bp[id]};
  const T=team(tid); T.city=''; T.nick=e.name; T.lname=e.name;
  const lineup=e.ln.map(([id,pos])=>[get(id),pos]).filter(x=>x[0]);
  return {tid,e,off,lineup,bench:e.bn.map(get).filter(Boolean),rot:e.rot.map(get).filter(Boolean),pen:e.pen.map(get).filter(Boolean),ri:0}; }
/* 시리즈(단판이면 best=1). o: {cup, round, match, best, all, tie, wc, home, ri}. 반환 {ok, key, a, b, wa, wb, t, win:'A'|'B'|'T', games:[…]}
   all: best경기를 모두 치른다(리그 연전). tie: 무승부 허용(리그 정규 규칙 11회, 와일드카드 15회). wc: 와일드카드(A가 1승을 안고 시작, 공용 cupSeriesState).
   home: 차전별 A 홈 여부(없으면 1차전 A 홈부터 번갈아). ri: [A, B] 앞서 치른 경기 수(선발 순번을 이어 간다) */
function cupMatch(EA,EB,o){ o=o||{}; const Core=FrontOfficeCore; const best=Math.max(1,Math.min(9,o.best|0||1)), spec={best,wc:!!o.wc};
  for(const [k,e] of [['A',EA],['B',EB]]){ const v=Core.cupValidate(e,{}); if(!v.ok)return {ok:false,side:k,errors:v.errors}; }
  const hA=Core.cupEntryHash(EA), hB=Core.cupEntryHash(EB), key=[o.cup||'cup',o.round||'',o.match||'',hA,hB].join(':');
  const json=ladderWorldJson({season:'cup'}); const LG0=LRULE, PK0=PARK, SD0=SIMDAY, HA0=HOME_ADV;
  try{ HOME_ADV=0; return ladderSwap(JSON.parse(json),()=>{
    const kA=cupIdBase(EA), kB=cupIdBase(EB,kA), CA=cupInstall(0,EA,kA), CB=cupInstall(1,EB,kB); let day=G.day; const games=[];
    if(Array.isArray(o.ri)){ CA.ri=(o.ri[0]|0)%Math.max(1,CA.rot.length); CB.ri=(o.ri[1]|0)%Math.max(1,CB.rot.length); }
    for(let i=0;i<best;i++){ const st=Core.cupSeriesState(spec,games.map(g=>({sa:g.sa,sb:g.sb}))); if(!o.all&&st.done)break;
      const aHome=Array.isArray(o.home)&&o.home[i]!=null?!!o.home[i]:i%2===0, H=aHome?CA:CB, W=aHome?CB:CA; G.day=day;
      const need=st.need||2, elim=o.all?[]:[...(st.wb===need-1||best===1||o.wc?[CB.tid]:[]),...(st.wa===need-1||best===1||(o.wc&&i>0)?[CA.tid]:[])];
      const ps=o.all&&o.tie?false:{noTie:!o.tie,elimT:elim,cup:1};
      const g=simGame(day,H.tid,W.tid,ps,{sides:{h:ladderSide(H,day),a:ladderSide(W,day)},pitchRecords:false,bipLog:true});
      games.push(cupGameOut(g,{i,aHome,CA,CB,key,best})); ladderAfter(g,day); day++; ladderRest(); }
    const wa=games.filter(g=>g.sa>g.sb).length, wb=games.filter(g=>g.sb>g.sa).length, t=games.length-wa-wb, fin=Core.cupSeriesState(spec,games);
    const win=o.all?(wa>wb?'A':wb>wa?'B':'T'):fin.win||(wa>=wb?'A':'B');
    const side=(E,h,w)=>({name:E.name,year:E.year,h,w});
    return {ok:true,v:Core.CUP_V,key,cup:o.cup||'',round:o.round||'',match:o.match||'',best,a:side(EA,hA,wa),b:side(EB,hB,wb),wa,wb,t,win,games}; }); }
  finally{ LRULE=LG0; PARK=PK0; SIMDAY=SD0; HOME_ADV=HA0; } }
/* 리그 평균 AI 구단: 새 리그(가벼운 세계)의 구단 가운데 팀 OVR이 중간에 가까운 순으로 n개(seed는 이름표일 뿐, 만들 때마다 새 구단) */
function cupAiEntries(n,seed){ seed=String(seed||'cup'); let out=[];
  ladderSwap(null,()=>{ buildWorld({lite:true}); G.year=2026; G.cal=G.cal||buildCalendar(2026); G.day=G.cal.open+10; G.user=0;
    const L=G.teams.map(t=>{ const e=cupEntryNow({tid:t.id,name:FrontOfficeCore.cupName('AI '+t.nick),wid:''}); if(!e)return null; e.ai=1; delete e.club.badge; e.seasons=0; e.pay=0; e.h=FrontOfficeCore.cupEntryHash(e); e.ovr=cupOvr(e); return e; }).filter(Boolean);
    const ts=L.map(e=>e.ovr.t).sort((a,b)=>a-b), med=ts[Math.floor(ts.length/2)];
    out=L.sort((a,b)=>Math.abs(a.ovr.t-med)-Math.abs(b.ovr.t-med)||a.club.tid-b.club.tid).slice(0,Math.max(0,n|0)); });
  return out; }
/* ===== 중계 글(카페 게시 형식) =====
   경기 기록(pbp)을 한 줄씩: '투수 이준서(91) 1번타자 손선준(81), 루킹 삼진 아웃. #1사 주자없음'. 타구 유형·방향은 경기 엔진이 정한 값(bipLog), 비거리·루킹/헛스윙은 경기 키로 정한 값 */
const CUP_OUTS=['무사','1사','2사','3아웃'];
function cupBases(b){ const on=[0,1,2].filter(i=>b&&b[i]); return !on.length?'주자없음':on.length===3?'만루':on.map(i=>i+1).join(',')+'루'; }
const cupU=(key,k)=>parseInt(FrontOfficeCore.cupHashStr(key+':'+k),16)/4294967296;
const CUP_DIR={LF:'좌측',CF:'중앙',RF:'우측'};
function cupBipTxt(o,bip,u,n,b){ const [t,pos]=String(bip||'').split(':'), PK=POSK[pos]||(pos==='P'?'투수':''); const of=pos==='LF'||pos==='CF'||pos==='RF';
  if(o==='HR'){ const dir=CUP_DIR[pos]||'중앙', nm=['솔로','투런','쓰리런','만루'][Math.max(0,Math.min(3,n-1))], dist=Math.round(clamp(103+(((b&&b.r&&b.r.pow)||50)-50)*.45+(pos==='CF'?9:0)+u*16,98,145)); return `${dir}방향 ${nm} 홈런! (비거리: ${dist}m)`; }
  if(o==='3B')return `${pos==='LF'?'좌중간':pos==='RF'?'우중간':'중견수 키를 넘기는'} 3루타!`;
  if(o==='2B')return of?`${pos==='LF'?(u<.5?'좌익선상':'좌중간'):pos==='RF'?(u<.5?'우익선상':'우중간'):'중견수 키를 넘기는'} 2루타!`:`${PK||'3루'} 옆을 빠지는 2루타!`;
  if(o==='1B')return of?`${pos==='LF'?'좌전':pos==='CF'?'중전':'우전'} 안타.`:t==='GB'||t==='PU'?`${PK||'내야'} 내야안타.`:`${PK||'내야'} 옆을 빠지는 안타.`;
  if(o==='DP')return `${PK||'유격수'} 땅볼, 병살타.`;
  if(o==='OUT'){ if(t==='GB')return `${PK||'유격수'} 땅볼 아웃.`; if(t==='LD')return `${PK||'중견수'} 직선타 아웃.`; if(t==='PU')return pos==='C'?'포수 파울플라이 아웃.':`${PK||'유격수'} 뜬공 아웃.`; return `${PK||'중견수'} 플라이 아웃.`; }
  return ''; }
/* 한 경기 → {sa, sb, inn, walk, log, bat, pit, line, hl, wh, dec, mvp, sp, stats} */
function cupGameOut(g,c){ const {aHome,CA,CB,key,i}=c; const kOf=k=>(k==='h')===aHome?'A':'B', E={A:CA.e,B:CB.e}, off={A:CA.off,B:CB.off};
  const lab=k=>E[kOf(k)].name, P=id=>G.players[id], dvO=p=>p?FrontOfficeCore.dv(ovr(p)):0, gk=key+':'+i;
  const S=g.S, score={a:0,h:0}, L=[], hl=[]; let curH=-1, before=[0,0,0], outs=0, hlBuf=null, hlRuns=0, lastLead=null, wh=null, lc=0;
  const slotOf=(s,id,at)=>{ let ln=s.start; for(const ch of s.changes||[])if(ch.at<=at)ln=ch.lineup; const x=ln.find(q=>q.id===id); return x?x.o+1:null; };
  const pitN={h:1,a:1}, curP={h:S.h.sp?S.h.sp.id:null,a:S.a.sp?S.a.sp.id:null};
  const scoreTxt=()=>{ const a=score.a, h=score.h; if(a===h)return `스코어 ${a}:${h} 동점`; const k=a>h?'a':'h'; return `스코어 ${Math.max(a,h)}:${Math.min(a,h)} ${lab(k)} 리드`; };
  const closeHalf=()=>{ if(curH<0)return; const bk=curH%2?'h':'a'; L.push(`[공수교대] ${scoreTxt()}. #무사 주자없음`); if(hlBuf&&hlRuns){ hl.push({inn:Math.floor(curH/2)+1,half:curH%2?'말':'초',team:lab(bk),k:kOf(bk),runs:hlRuns,plays:hlBuf,score:scoreTxt()}); } hlBuf=null; hlRuns=0; };
  g.pbp.forEach((x,k)=>{ const half=x[0], bk=half%2?'h':'a', fk=bk==='h'?'a':'h';
    if(half!==curH){ closeHalf(); curH=half; before=[0,0,0]; outs=0; L.push(`[${Math.floor(half/2)+1}회${half%2?'말':'초'}] ${lab(bk)} 공격`); hlBuf=[]; }
    const st=()=>`#${CUP_OUTS[Math.min(3,outs)]} ${outs>=3?'':cupBases(before)}`.trim();
    if(x[1]==='PC'){ const prev=P(curP[fk]), nx=P(x[2]); pitN[fk]++; L.push(`투수교체: ${prev?prev.name:'-'} out, ${pitN[fk]}번째 투수 ${nx?nx.name:'-'} in`); curP[fk]=x[2]; return; }
    if(x[1]==='SB'||x[1]==='CS'){ const r=P(x[2]); outs=x[3]; before=x[4]; L.push(`${r?r.name:'주자'} ${x[1]==='SB'?'도루 성공':'도루 실패 아웃'}. ${st()}`); return; }
    if(typeof x[1]!=='number')return;
    const b=P(x[1]), p=P(x[2]), o=x[3], n=x[6]||0, slot=slotOf(S[bk],x[1],k), u=cupU(gk,k);
    const head=`투수 ${p?p.name:'-'}(${dvO(p)}) ${slot?slot+'번타자':'대타'} ${b?b.name:'-'}(${dvO(b)}), `;
    const lead0=score[bk]-score[fk], b0=before.slice(), o0=outs;
    let body;
    if(o==='K')body=`${u<.27?'루킹':'헛스윙'} 삼진 아웃.`; else if(o==='BB')body='볼넷 출루.'; else if(o==='HBP')body='몸에 맞는 공 출루.';
    else if(o==='SAC')body=x[16]?'타격.\n번트 실패, 앞 주자 포스아웃.':'타격.\n희생번트 성공.';
    else { const err=o==='OUT'&&!!x[9]; body='타격.\n'+(err?`${POSK[String(x[17]||'').split(':')[1]]||'야수'} 실책으로 출루.`:cupBipTxt(o,x[17],u,n,b)); if(o==='OUT'&&n>0&&x[13])body=body.replace(/플라이 아웃\./,'희생플라이 아웃.'); }
    score.a=x[7]; score.h=x[8]; outs=x[4];
    let runL='';
    if(n>0){ const after=x[5]||[0,0,0], outIds=new Set((x[14]||[]).filter(m=>m.result==='out').map(m=>m.id)); const who=[];
      for(const bi of [2,1,0]){ const id=b0[bi]; if(id&&!after.includes(id)&&!outIds.has(id)&&who.length<n)who.push(`${bi+1}루주자`); }
      if(o==='HR'&&who.length<n)who.push('타자주자'); runL=`\n${who.join(' 및 ')} 홈인. `;
      const lead1=score[bk]-score[fk]; const tag=lead1===0?'동점':lead1<0?'리드':lead0<0?'역전':lead0===0?'리드':'리드 유지';
      const sc=`스코어 ${Math.max(score.a,score.h)}:${Math.min(score.a,score.h)}`+(lead1===0?' 동점':` ${lab(lead1>0?bk:fk)} ${tag}`);
      runL+=`\n${sc}.`; hlRuns+=n; hlBuf.push(`${b?b.name:'-'} ${o==='HR'?['솔로','투런','쓰리런','만루'][Math.min(3,n-1)]+' 홈런':o==='1B'?'적시타':o==='2B'?'적시 2루타':o==='3B'?'적시 3루타':o==='BB'?'밀어내기 볼넷':o==='HBP'?'밀어내기 사구':o==='OUT'&&x[13]?'희생플라이':o==='OUT'?'땅볼 타점':'득점타'}(${n}점)`);
      if(lead0<0&&lead1>0)lc++; if(lead0<=0&&lead1>0)lastLead={bk,id:x[1],inn:Math.floor(half/2)+1,o0,b0,o,n}; }
    before=x[5]||[0,0,0];
    L.push(head+body+runL+' '+st()); });
  closeHalf(); if(L[L.length-1].startsWith('[공수교대]'))L.pop();
  const sa=aHome?g.score.h:g.score.a, sb=aHome?g.score.a:g.score.h, wK=g.score.h>g.score.a?'h':'a';
  L.push(`[경기종료] 스코어 ${Math.max(g.score.a,g.score.h)}:${Math.min(g.score.a,g.score.h)} ${g.score.h===g.score.a?`${g.inn}회 무승부`:`${lab(wK)} ${g.walk?'끝내기 ':''}승리`}. #${CUP_OUTS[Math.min(3,outs)]} ${outs>=3?'':cupBases(before)}`.trim());
  if(lastLead&&lastLead.bk===wK&&g.score.h!==g.score.a){ const b=P(lastLead.id), kd={HR:'홈런','1B':'안타','2B':'2루타','3B':'3루타',BB:'밀어내기 볼넷',HBP:'밀어내기 사구',OUT:'땅볼',DP:'병살타',SAC:'번트'}[lastLead.o]||'타격';
    wh={id:lastLead.id,k:kOf(lastLead.bk),name:b?b.name:'-',txt:`${lastLead.inn}회 ${CUP_OUTS[lastLead.o0]} ${cupBases(lastLead.b0)} 상황에서 ${kd}`}; L.push(`결승타 ${wh.name} ${wh.txt}`); } else L.push('결승타 없음');
  const nm=id=>id!=null&&P(id)?P(id).name:'없음'; L.push(`승리투수:${nm(g.dec.w)} / 세이브:${nm(g.dec.sv)} / 패전투수:${nm(g.dec.l)}`);
  /* 박스: 타자·투수(탭 구분) */
  const sideK={A:aHome?'h':'a',B:aHome?'a':'h'}, label=k=>`${E[k].name} ${E[k].year}`, bat=[`팀 연도 이름\tAB\tH\tBB\t HR\tRBI\tR\tSB\t교\t결`], pit=[`팀 연도 이름\tIP\tH\tBB\tSO\tR\tER\t승/패/세`], stats={bat:[],pit:[]};
  const ip=o=>`${Math.floor(o/3)}${o%3?'.'+(o%3):''}`;
  for(const k of ['A','B']){ const s=S[sideK[k]], st=new Set(s.start.map(q=>q.id));
    const ids=[...s.start.map(q=>q.id),...[...s.box.keys()].filter(id=>!st.has(id)&&P(id)&&!P(id).isP)];
    for(const id of ids){ const x=s.box.get(id), p=P(id); if(!x||!p)continue; bat.push(`${label(k)} ${p.name}\t${x.ab}\t${x.h}\t${x.bb+(x.hbp||0)}\t ${x.hr}\t${x.rbi}\t${x.r}\t${x.sb||0}\t${st.has(id)?'':'교'}\t${wh&&wh.id===id?'결':''}`);
      stats.bat.push({key:E[k].h+':'+(id-off[k]),k,name:p.name,pa:x.pa,ab:x.ab,h:x.h,d:x.d,tr:x.tr,hr:x.hr,bb:x.bb,hbp:x.hbp||0,sf:x.sf||0,rbi:x.rbi,r:x.r,sb:x.sb||0,so:x.so}); }
    for(const id of s.pitchers){ const x=s.box.get(id), p=P(id); if(!x||!p)continue; const dec=g.dec.w===id?'승':g.dec.l===id?'패':g.dec.sv===id?'세':(g.dec.hld||[]).includes(id)?'홀':'';
      pit.push(`${label(k)} ${p.name}\t${ip(x.outs)}\t${x.h}\t${x.bb+(x.hbp||0)}\t${x.so}\t${x.r||0}\t${x.er}\t${dec}`);
      stats.pit.push({key:E[k].h+':'+(id-off[k]),k,name:p.name,outs:x.outs,h:x.h,bb:x.bb+(x.hbp||0),so:x.so,r:x.r||0,er:x.er,hr:x.hr||0,w:dec==='승'?1:0,l:dec==='패'?1:0,sv:dec==='세'?1:0,gs:id===s.pitchers[0]?1:0}); } }
  /* 줄 점수 */
  const lineA=g.line[sideK.A], lineB=g.line[sideK.B], n=Math.max(lineA.length,lineB.length,9), err=k=>[...S[sideK[k]].box.values()].reduce((a,x)=>a+(x.e||0),0);
  const row=(k,Ln,first)=>`${label(k)}\t${Array.from({length:n},(_,j)=>Ln[j]==null?(first?'':'-'):Ln[j]).join('\t')}\t${k==='A'?sa:sb}\t${stats.bat.filter(b=>b.k===k).reduce((a,b)=>a+b.h,0)}\t${err(k)}`;
  const awayK=aHome?'B':'A', homeK=aHome?'A':'B';
  const line=[`팀\t${Array.from({length:n},(_,j)=>j+1).join('\t')}\tR\tH\tE`,row(awayK,awayK==='A'?lineA:lineB,true),row(homeK,homeK==='A'?lineA:lineB,false)].join('\n');
  /* 선발 매치업·MVP 후보 */
  const spOf=k=>{ const s=S[sideK[k]], p=s.sp, x=p&&s.box.get(p.id); return p?{name:p.name,o:dvO(p),line:x?`${ip(x.outs)}이닝 ${x.h}피안타 ${x.so}탈삼진 ${x.er}자책`:''}:null; };
  const wk=sa>sb?'A':'B'; let mvp=null, mv=-1e9;
  for(const b of stats.bat.filter(b=>b.k===wk)){ const tb=b.h+b.d+2*b.tr+3*b.hr, v=tb*1.2+b.rbi*1.5+b.r+b.bb*.6+b.sb*.6+(wh&&wh.k===wk&&b.name===wh.name?2:0); if(v>mv){ mv=v; mvp={name:b.name,k:wk,txt:`${b.ab}타수 ${b.h}안타${b.hr?`(${b.hr}홈런)`:''} ${b.rbi}타점 ${b.r}득점`}; } }
  for(const x of stats.pit.filter(x=>x.k===wk)){ const v=x.outs/3*1.1+x.so*.5-x.er*1.8-(x.h+x.bb)*.3+(x.w?2:0)+(x.sv?1.5:0); if(v>mv){ mv=v; mvp={name:x.name,k:wk,txt:`${ip(x.outs)}이닝 ${x.h}피안타 ${x.so}탈삼진 ${x.er}자책${x.w?' 승리':x.sv?' 세이브':''}`}; } }
  return {i,home:homeK,sa,sb,inn:g.inn,walk:!!g.walk,lc,log:L.join('\n'),bat:bat.join('\n'),pit:pit.join('\n'),line,hl,wh,dec:{w:nm(g.dec.w),l:nm(g.dec.l),sv:g.dec.sv!=null?nm(g.dec.sv):null},mvp,sp:{A:spOf('A'),B:spOf('B')},stats}; }
