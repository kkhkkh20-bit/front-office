/* ===== 예고 선발 · 순위 기록 · 트레이드 비교 · 모의 지명 · 스태프 의견 ===== */
function teamGames(tid,from,n){ const c=G.cal; const L=[]; if(!c||!c.sched)return L; for(let d=from;d<=c.end&&L.length<n;d++){ const gs=c.sched[d]; if(!gs)continue; const m=gs.find(x=>x.includes(tid)); if(m)L.push({d,home:m[0]===tid,op:m[0]===tid?m[1]:m[0]}); } return L; }
let _spC={k:null};
function projStarters(tid,n){ // 지금 로테이션 순번과 휴식일로 다음 경기 선발을 예상(부상·피로로 바뀔 수 있음)
  const k=G.day+':'+G.games.length+':'+G.year; if(_spC.k!==k)_spC={k}; const ck=tid+':'+n; if(_spC[ck]&&_spC[ck].every(g=>!g.sp||(g.sp.team===tid&&healthy(g.sp)&&(!entryOn()||g.sp.e1)&&g.la===g.sp.lastApp&&rpPlanOf(tid,g.sp)!=='sp2')))return _spC[ck]; /* 같은 날 2군 선발 수업·부상으로 빠진 투수도 다시 계산(검수 11-08) */ /* 같은 날 방출·이적한 투수가 남아 있으면 다시 계산 */
  const t=team(tid); const sp=depth(tid).sp; const games=teamGames(tid,G.day+1,n); const last={}; sp.forEach(p=>last[p.id]=p.lastStart); let rot=t.rot||0; const out=[]; const fr=(p,d)=>!(p.lastApp!=null&&p.lastApp!==p.lastStart&&last[p.id]===p.lastStart&&d-p.lastApp<2); /* 실제 선발 선택처럼 어제·그제 구원 등판한 투수는 순번을 넘긴다(검수 11-08) */
  for(const g of games){ let pick=null;
    if(sp.length){ for(let i0=0;i0<sp.length;i0++){ const i=(rot+i0)%sp.length; const p=sp[i]; if((last[p.id]==null||g.d-last[p.id]>=5)&&fr(p,g.d)){ rot=(i+1)%sp.length; pick=p; break; } }
      if(!pick){ const pool=[...sp].sort((a,b)=>(last[a.id]||0)-(last[b.id]||0)); pick=pool.find(p=>fr(p,g.d))||pool[0]; } last[pick.id]=g.d; }
    out.push(Object.assign({},g,{sp:pick,la:pick?pick.lastApp:null})); }
  _spC[ck]=out; return out; }
function rankSnap(day){ if(period()!=='season')return; const st=standingsNow(); const rk=G.teams.map(()=>0); st.forEach(o=>rk[o.tid]=tieRank(st,o.tid)); /* 그래프도 공동 순위(검수 11-08) */
  const S=G.sea; S.rh=S.rh||[]; if(S.rh.length&&S.rh[S.rh.length-1][0]===day)return; S.rh.push([day,rk,G.teams.map(t=>{ const r=S.rec[t.id]; return r.w-r.l; })]); }

const FIELDK=['C','1B','2B','3B','SS','LF','CF','RF'];
function canAt(p,k){ return !p.isP&&(p.pos===k||subsOf(p).includes(k)); }
/* 예상 주전 배치: 한 선수는 한 자리에만(리뷰 2026-11-01). 자리마다 할 수 있는 선수 중 상위 5명을 후보로 두고, 8자리 합이 가장 큰 배치를 찾는다.
   원래 포지션이 아니면 -2(익숙하지 않은 자리). 표시 값(val)도 같은 기준이라 선수를 빼면 합계가 늘지 않는다 */
function posStarters(list,ev){ ev=ev||new Map(list.map(p=>[p.id,scoutReport(p).cur])); const C={}; for(const k of FIELDK)C[k]=list.filter(p=>canAt(p,k)&&ev.get(p.id)!=null&&healthy(p)).map(p=>({p,v:ev.get(p.id)-(p.pos===k?0:2)})).sort((a,b)=>b.v-a.v).slice(0,5);
  const ord=[...FIELDK].sort((a,b)=>C[a].length-C[b].length); const best={s:-1e9,pick:null}; const cur={}; const used=new Set(); const ub=ord.map((k,i)=>ord.slice(i).reduce((s,kk)=>s+(C[kk][0]?C[kk][0].v:0),0));
  const go=(i,s)=>{ if(i===ord.length){ if(s>best.s){ best.s=s; best.pick=Object.assign({},cur); } return; } if(s+ub[i]<=best.s)return; const k=ord[i]; let any=false;
    for(const c of C[k]){ if(used.has(c.p.id))continue; any=true; used.add(c.p.id); cur[k]=c.p; go(i+1,s+c.v); used.delete(c.p.id); } delete cur[k]; if(!any||C[k].length===0)go(i+1,s-30); /* 자리를 채울 선수가 없으면 비운다 */ };
  go(0,0); const who={}, val={}; for(const k of FIELDK){ const p=best.pick&&best.pick[k]; who[k]=p||null; val[k]=p?ev.get(p.id)-(p.pos===k?0:2):null; } return {who,val}; }
/* 야수 주전 변화 글: 자리마다 빠지는 주전과 대신 들어가는 선수 */
function posSwapTxt(before,after){ const A=posStarters(before), B=posStarters(after); const v=p=>dv(Math.round(scoutReport(p).cur)); const L=[];
  for(const k of FIELDK){ const a=A.who[k], b=B.who[k]; if(a===b)continue; L.push(`${POSS[k]}: ${a?`${a.name}(${v(a)}) 빠짐`:'빈자리'} → ${b?`${b.name}(${v(b)})${b.pos!==k?', 포지션 이동':''} 들어감`:'채울 선수 없음'}`); }
  return L.length?`야수 예상 주전: ${L.join(' · ')}`:'야수 예상 주전 그대로'; }
/* 포지션별 활용 가능 자원(겹침 허용): 자리마다 할 수 있는 선수 상위 3명과 우리 평가 */
function posDepthList(list){ const out={}; for(const k of FIELDK)out[k]=list.filter(p=>canAt(p,k)&&healthy(p)).map(p=>({p,v:scoutReport(p).cur})).filter(x=>x.v!=null).sort((a,b)=>b.v-a.v).slice(0,3); return out; }
function posStrength(list){ const ev=new Map(list.map(p=>[p.id,scoutReport(p).cur])); const out={};
  { const S=posStarters(list,ev); for(const k of FIELDK)out[k]=S.val[k]; } /* 예상 주전 배치(한 선수 한 자리) 기준 */
  const sp=list.filter(p=>p.isP&&isSPr(p)&&ev.get(p.id)!=null&&healthy(p)).map(p=>ev.get(p.id)).sort((a,b)=>b-a).slice(0,5);
  const rp=list.filter(p=>p.isP&&!isSPr(p)&&ev.get(p.id)!=null&&healthy(p)).map(p=>ev.get(p.id)).sort((a,b)=>b-a).slice(0,5);
  if(sp.length){ const fill=list.filter(p=>p.isP&&!isSPr(p)&&ev.get(p.id)!=null&&healthy(p)).map(p=>ev.get(p.id)-6).sort((a,b)=>b-a); while(sp.length<5)sp.push(fill.length?fill.shift():35); } /* 선발이 5명 안 되면 빈자리는 불펜에서 돌려 막는다(선발 전환 -6), 그것도 없으면 35: 선발을 보내면 평균이 오르는 착시를 막는다 */
  out.SP=sp.length?Math.round(avg(sp)):null; out.RP=rp.length?Math.round(avg(rp)):null; return out; }
function rosterList(tid){ return playersOf(tid).filter(p=>!(p.joinY>G.year)); }
function tradeCompare(tid,give,get){
  const mine=rosterList(G.user), theirs=rosterList(tid); const gv=give.map(id=>G.players[id]), gt=get.map(id=>G.players[id]);
  const myAfter=mine.filter(p=>!give.includes(p.id)).concat(gt), thAfter=theirs.filter(p=>!get.includes(p.id)).concat(gv);
  return {my:[posStrength(mine),posStrength(myAfter)],th:[posStrength(theirs),posStrength(thAfter)]}; }
/* 선발진 변화: 평균 대신 빠지는 선발, 대신 로테이션에 들어갈 다음 후보, 선발 가능 인원 */
const spSeen=p=>p.team===G.user?ovr(p):(scoutReport(p).cur??-1); /* 남의 선수는 스카우트가 본 능력만(미확인은 맨 뒤, 검수 11-08) */
function spRot(list){ return list.filter(p=>p&&p.isP&&isSPr(p)&&healthy(p)&&!(p.team===G.user&&rpPlanOf(p.team,p)==='sp2')).sort((a,b)=>spSeen(b)-spSeen(a)); } /* 2군 선발 수업 중인 투수는 1군 로테이션이 아니다(검수 11-08) */
function spSwap(tid,give,get){ const mine=rosterList(G.user); const after=mine.filter(p=>!give.includes(p.id)).concat(get.map(id=>G.players[id]).filter(Boolean));
  const b=spRot(mine), a=spRot(after); const t0=b.slice(0,5), t1=a.slice(0,5); const out=t0.filter(p=>!t1.includes(p)), inn=t1.filter(p=>!t0.includes(p));
  if(!out.length&&!inn.length&&b.length===a.length)return null; return {out:out.map(p=>({p,slot:t0.indexOf(p)+1})),inn,n0:b.length,n1:a.length}; }
function spSwapTxt(x){ if(!x)return ''; const v=p=>spSeen(p)<0?'?':dv(Math.round(spSeen(p)));
  const o=x.out.map(o=>`${o.p.name}(${o.slot}선발, 능력 ${v(o.p)})`).join(', '); const i=x.inn.map(p=>`${p.name}(능력 ${v(p)})`).join(', ');
  return `선발진: ${o?`${o} 빠짐 → `:''}${i?`${i}이(가) 로테이션에 들어감`:o?'로테이션을 채울 선발 자원이 없어 불펜·2군에서 메워야 함':''} · 선발 가능 ${x.n0}명 → ${x.n1}명`; }
/* 감독 반응: 우리 트레이드가 전력과 감독 성향에 맞는지 */
function mgrTradeView(tid,give,get){ const m=G.mgr[G.user]; if(!m||m.interim)return null; const c=tradeCompare(tid,give,get); const ks=FIELDK.concat(['SP','RP']);
  let d=0; for(const k of ks){ const b=c.my[0][k]??35, a=c.my[1][k]??35; d+=(a-b)*(k==='SP'?2:1); }
  const youngOut=give.map(id=>G.players[id]).filter(p=>p&&p.age<=24&&(scoutReport(p).ofp||0)>=58).length;
  const asked=new Set(mreqs().filter(r=>r.k==='out'&&(r.st==='open'||r.st==='ask')&&r.data).map(r=>r.data.pid)); /* 감독이 정리해 달라고 한 선수: 내보내는 건 요청을 들어주는 것 */
  const allAsked=give.length>0&&give.every(id=>asked.has(id));
  const regOut=give.map(id=>G.players[id]).filter(p=>p&&isRegular(p)&&!asked.has(p.id)).length;
  let r=0; const why=[]; if(d>=6){ r+=3; why.push('전력이 좋아진다'); } else if(d<=-6&&!allAsked){ r-=4; why.push('전력이 약해진다'); }
  if(regOut&&d<0){ r-=2*regOut; why.push(`주전 ${regOut}명을 내준다`); }
  if(youngOut&&m.youth>=62){ r-=3; why.push('키우던 유망주를 내준다'); }
  if(m.ego>=70&&r<0)r-=1;
  const P=G.mpick; const pk=P&&P.back&&P.y===G.year?give.map(id=>G.players[id]).filter(p=>p&&P.ids.includes(p.id)):[];
  const ra=r; /* 약속 위반 -6은 mpickTraded가 따로 깎으므로 실제 반영에서는 뺀다 */
  if(pk.length){ r=Math.min(r-3,-2); why.unshift(`함께 밀어주기로 한 ${pk.map(p=>p.name).join('·')}을(를) 내준다(감독 관계 -6)`); }
  return {r,ra,d,txt:r>=2?`${m.name} 감독: 환영합니다. ${why.join(', ')}고 봅니다.`:r<=-2?`${m.name} 감독: 반대합니다. ${why.join(', ')}고 봅니다.`:`${m.name} 감독: 특별히 반대하지 않습니다.`}; }
function mgrTradeApply(v){ const m=G.mgr[G.user]; if(!m||!v)return; const r=v.ra??v.r; if(!r)return; m.rel=clamp(m.rel+r,0,100); note('감독',`${v.txt} (감독 관계 ${r>0?'+':''}${r})`); }
function estVal(p){ const rp=scoutReport(p); const cur=rp.cur??45; const fut=rp.ofp??cur; const eff=p.age<=25?cur+Math.max(0,fut-cur)*.6:p.age>=32?cur-(p.age-31)*1.3:cur; return Math.pow(Math.max(0,eff-36),1.7)/10-(p.sal/100)*.35; }
function asstOpinion(tid,give,get){ // 우리 부단장 의견: 스카우트 평가 기준(실제 능력과 다를 수 있음)
  if(!give.length&&!get.length)return [];
  const gv=give.map(id=>G.players[id]), gt=get.map(id=>G.players[id]); const L=[];
  const U=team(G.user); const diff=stackIn(gt.map(p=>tval(U,p,'in')))-sum(gv.map(p=>tval(U,p,'out')));
  L.push(diff>=3?'우리 평가로는 우리에게 유리한 거래입니다.':diff>=-1?'우리 평가로는 대체로 공정한 거래입니다.':diff>=-5?'우리가 조금 더 내주는 거래입니다.':'우리가 많이 손해 보는 거래로 봅니다.');
  const c=tradeCompare(tid,give,get); const lab=k=>k==='SP'?'선발진':k==='RP'?'불펜':POSK[k];
  const keys=FIELDK.concat(['SP','RP']);
  const drop=keys.map(k=>({k,b:c.my[0][k],a:c.my[1][k]})).filter(x=>x.b!=null&&(x.a==null||x.a<=x.b-5)).sort((x,y)=>(x.a??0)-x.b-((y.a??0)-y.b))[0];
  const up=keys.map(k=>({k,b:c.my[0][k],a:c.my[1][k]})).filter(x=>x.a!=null&&(x.b==null||x.a>=x.b+5)).sort((x,y)=>(y.a-(y.b??0))-(x.a-(x.b??0)))[0];
  if(drop)L.push(`트레이드 후 ${lab(drop.k)} 자리가 약해집니다(${drop.b}→${drop.a??'없음'}).`);
  if(up)L.push(`${lab(up.k)} 자리가 좋아집니다(${up.b??'없음'}→${up.a}).`);
  const young=gv.find(p=>p.age<=23&&(scoutReport(p).ofp||0)>=60); if(young)L.push(`잠재력이 큰 ${young.name}을(를) 내주는 것은 신중해야 합니다.`);
  const unk=gt.find(p=>scoutReport(p).cur==null); if(unk)L.push(`${unk.name}은(는) 우리 스카우트가 본 적이 없어 평가가 불확실합니다.`);
  return L.slice(0,3); }
function tradeHint(tid,give,get,cash,pk){ // 상대가 무엇을 더 원할지 짐작(관계가 나쁘면 못 읽음). 지명권도 실제 거래와 같게 평가(검수 11-06)
  if(!give.length&&!get.length)return null; const t=team(tid); const e=evalTrade(tid,give,get,cash,pk); const gap=e.need-e.gain; if(gap<=0)return null;
  if(t.rel<35)return {txt:'관계가 낮아 상대가 무엇을 원하는지 읽기 어렵습니다.'};
  const sd=1.2+Math.max(0,75-t.rel)/10;
  const add=domestic(G.user).filter(p=>!give.includes(p.id)&&!(p.joinY>G.year)&&!p.ys&&!ntcOf([p.id])) /* 거부권·육성선수는 제안할 수 없으니 추천하지 않는다 */.map(p=>({p,v:tval(t,p,'in')*.72+hn('th'+tid+G.year,p.id)*sd*.4})).filter(x=>x.v>=gap*.9).sort((a,b)=>a.v-b.v)[0];
  const drop=get.length>1?get.map(id=>({p:G.players[id],v:tval(t,G.players[id],'out')+hn('td'+tid+G.year,id)*sd*.4})).filter(x=>x.v>=gap*.9).sort((a,b)=>a.v-b.v)[0]:null;
  const cn=cashFor(t,gap+hn('tc'+tid+G.year,G.day)*sd*.3); return {add:add?add.p:null,drop:drop?drop.p:null,big:gap>12,cash:cn&&cn+(cash||0)<=3000?cn+(cash||0):null}; }

function draftPickOrder(){ // 드래프트 전: 실제 드래프트와 같은 기준(끝난 지난 시즌 순위의 역순, 경쟁균형세 벌칙 반영) 1라운드
  { const P=draftPlan(); if(P)return P.filter(k=>k.rd===1); } /* 지명권 거래 반영: 넘긴 순번은 받은 구단 차례(검수 11-06) */
  const st=G.history.length?G.history[G.history.length-1].order:standingsNow(); const o1=[...st].reverse().map(o=>o.tid);
  for(const t of G.teams){ if(t.pickPen!==G.year)continue; const i=o1.indexOf(t.id); if(i<0)continue; o1.splice(i,1); o1.splice(Math.min(o1.length,i+9),0,t.id); }
  return o1.map((tid,i)=>({tid,rd:1,no:i+1})); }
function mockPick(tid,pool,rd,proj){ return aiDraftChoose(tid,[...pool],rd||1,proj||0); } /* 상대 구단은 실제 AI 지명과 같은 평가·같은 패스 조건으로(검수 11-06, 11-09d) */
function mockDraft(n){ // 우리 다음 순번 전까지(드래프트 전에는 1라운드) 다른 구단 지명 예상
  const d=G.draft; const live=d&&!d.done; const pool=new Set((live?d.cls:G.draftClass||[]).filter(id=>G.players[id]&&G.players[id].prospect)); const out=[];
  if(live){ const ex={}; /* 모의로 뽑은 만큼 예상 인원에 더한다 */ let i=d.cur+(d.picks[d.cur].tid===G.user?1:0); for(;i<d.picks.length&&out.length<(n||12);i++){ const pk=d.picks[i]; if(pk.tid===G.user)break; const id=mockPick(pk.tid,pool,pk.rd,rosterProj(pk.tid)+(ex[pk.tid]||0)); if(id===-1)continue; if(id==null)break; ex[pk.tid]=(ex[pk.tid]||0)+1; pool.delete(id); out.push({pk,id}); } }
  else { for(const pk of draftPickOrder()){ const id=mockPick(pk.tid,pool); if(id==null)break; pool.delete(id); out.push({pk,id,mine:pk.tid===G.user}); } }
  return out; }

function staffNotes(p){ // 선수 카드 상단 스태프 의견
  if(p.fdPool&&G.fd){ /* 창단 드래프트 후보: 스카우트는 툴만, 데이터팀은 기록만. 종합 판단은 하지 않는다 */ 
    return [{w:'스카우트',t:fdScoutLine(p)+'.'},{w:'데이터팀',t:fdDataLine(p,G.fd.y-1)+'.'}]; }
  const own=p.team===G.user&&!p.prospect; const rp=scoutReport(p); const L=[];
  L.push({w:'스카우트',t:(rp.role?`장래 ${rp.role}. `:'')+(rp.notes&&rp.notes[0]?rp.notes[0]:'')});
  { const sn=statNotes(p); if(sn[0])L.push({w:'전력분석',t:sn[0]}); }
  if(!own)return L.filter(x=>x.t);
  const l=p.l10||[]; if(l.length>=5){ if(p.isP){ const o=sum(l.map(x=>x[0])), er=sum(l.map(x=>x[1])); const era=o?er*27/o:0; L.push({w:'코치',t:era<=3?`최근 ${l.length}경기 평균자책점 ${era.toFixed(2)}로 공이 좋습니다.`:era>=6?`최근 ${l.length}경기 평균자책점 ${era.toFixed(2)}로 흔들리고 있습니다.`:`최근 ${l.length}경기 평균자책점 ${era.toFixed(2)}, 무난합니다.`}); }
    else { const ab=sum(l.map(x=>x[0])), hh=sum(l.map(x=>x[1])); const a=ab?hh/ab:0; L.push({w:'코치',t:a>=.33?`최근 ${l.length}경기 타율 ${fmt3(a)}로 감이 좋습니다.`:a<=.2?`최근 ${l.length}경기 타율 ${fmt3(a)}로 부진합니다.`:`최근 ${l.length}경기 타율 ${fmt3(a)}, 무난합니다.`}); } }
  if((p.fat||0)>=60)L.push({w:'트레이너',t:`피로가 ${Math.round(p.fat)}까지 쌓였습니다. 감독이 쉬게 할 가능성이 큽니다.`});
  else if(p.injOut>0)L.push({w:'의무팀',t:`${injNow(p)}(으)로 약 ${p.injOut}일 더 쉬어야 합니다. 예상 복귀 ${injRetTxt(p)}.`});
  else if(injFxNow(p).length){ const f=injFxText(p).find(x=>x.open); if(f)L.push({w:'의무팀',t:`${f.n} 이후 아직 몸이 완전하지 않습니다(${f.t}). 실전을 뛰면서 돌아옵니다.`}); }
  else if(p.injHist&&p.injHist.length>=3)L.push({w:'의무팀',t:`부상 이력이 ${p.injHist.length}번 있습니다. 관리가 필요합니다.`});
  if(!p.foreign){ const v=estVal(p); const left=p.faC?Math.max(1,p.yrs):null; L.push({w:'운영팀',t:(v>=4&&p.sal<5000?'연봉 대비 가치가 높습니다. ':v<0?'연봉 대비 활약이 부족하다는 평가입니다. ':'')+(left?`${ctText(p)}입니다.`:Math.max(0,faSvc(p)-p.svc)?`${ctText(p)}.`:'올해 FA 자격을 얻습니다.')}); }
  return L.filter(x=>x.t).slice(0,5); }

/* ===== 선수 이야기(커리어 연표) ===== */
function story(p,t,k){ if(!p)return; (p.story=p.story||[]).push({y:G.year,d:G.day,t,k:k||''}); if(p.story.length>60)p.story.splice(1,1); }
const MILE={hr:[100,200,300,400,500],h:[1000,1500,2000,2500],w:[100,150,200],sv:[100,200,300,400],so:[1000,1500,2000]};
const MILEK={hr:'홈런',h:'안타',w:'승',sv:'세이브',so:'탈삼진'};
function cumInit(p){ if(p.cum)return; const one=p.hist.filter(h=>h.lvl==='1군'); const c={h:0,hr:0,w:0,sv:0,so:0}; for(const h of one){ if(p.isP){ c.w+=h.w||0; c.sv+=h.sv||0; c.so+=h.so||0; } else { c.h+=h.h||0; c.hr+=h.hr||0; } } p.cum=c; p.fl=p.fl||{}; if(one.length)p.fl.deb=1; if(c.hr)p.fl.hr1=1; if(c.w)p.fl.w1=1; if(c.sv)p.fl.sv1=1; }
function storyGame(p,x,day,opp,dec,game){ // 1군 경기 하나가 끝난 뒤
  cumInit(p); const f=p.fl, c=p.cum; const vs=`${dmd(day)} vs ${tshort(opp)}`;
  if(!f.deb){ f.deb=1; story(p,`1군 데뷔 · ${vs}`,'debut'); }
  const add=(k,v)=>{ if(!v)return; const b=c[k]; c[k]+=v; for(const m of MILE[k]) if(b<m&&c[k]>=m){ story(p,`통산 ${m}${MILEK[k]} 달성 · ${vs}`,'mile'); try{ featAdd('mile',p,`통산 ${m}${MILEK[k]}`,{vs,maj:m>=({hr:400,h:2000,w:150,sv:300,so:2000})[k]}); }catch(e){} } };
  { const S=p.sct=p.sct&&p.sct.y===G.year?p.sct:{y:G.year,h:0,hr:0,w:0,sv:0}; const up=(k,v,ms,txt)=>{ if(!v||G.ps&&G.ps.cur&&period()==='post')return; const b=S[k]; S[k]+=v; for(const m of ms)if(b<m&&S[k]>=m){ story(p,`시즌 ${m}${txt} · ${vs}`,'mile'); if(G.user!=null)wire('기록',`${p.name}(${tshort(p.team)}) 시즌 ${m}${txt} 달성`,{tid:p.team,ref:p.id}); if(p.team===G.user&&G.pr)news('선수',`${p.name}, 시즌 ${m}${txt} 고지`,`${p.name}이(가) ${vs} 경기에서 올 시즌 ${jEulReul(m+txt)} 채웠습니다. 구단 기록에 이름을 올립니다.`,2,{ref:p.id}); } }; /* 시즌 대기록은 달성한 그 경기에 바로 알린다(시즌 끝 진기록과 별도, 사용자 11-08) */
    if(p.isP){ up('w',dec.w===p.id?1:0,[20],'승'); up('sv',dec.sv===p.id?1:0,[40],'세이브'); } else { up('h',x.h||0,[200],'안타'); up('hr',x.hr||0,[40,50],'홈런'); } }
  if(p.isP){ if(dec.w===p.id&&!f.w1){ f.w1=1; story(p,`1군 첫 승 · ${vs}`,'first'); } if(dec.sv===p.id&&!f.sv1){ f.sv1=1; story(p,`1군 첫 세이브 · ${vs}`,'first'); }
    add('w',dec.w===p.id?1:0); add('sv',dec.sv===p.id?1:0); add('so',x.so||0);
    if(x.outs>=27&&x.h===0&&game?.runsAllowed===0&&game.solo)story(p,`노히트노런 · ${vs}`,'mile'); }
  else { if(x.hr&&!f.hr1){ f.hr1=1; story(p,`1군 첫 홈런 · ${vs}`,'first'); } if(x.hr>=3)story(p,`한 경기 ${x.hr}홈런 · ${vs}`,'mile'); if(x.h>=5&&(!f.h5||x.h>=6)){ f.h5=1; story(p,`한 경기 ${x.h}안타 · ${vs}`,'mile'); } add('h',x.h||0); add('hr',x.hr||0); try{ featBat(p,x,vs); }catch(e){} }
}
function storySeason(y){ // 시즌이 끝나면: 커리어 하이와 규정 이상 시즌
  for(const p of Object.values(G.players)){ if(p.team==null)continue; const h=seasonTotal(p,y,'1군'); if(!h)continue;
    const q=p.isP?h.outs>=300:h.pa>=300; if(!q)continue;
    const w=warOf(h,p); const prev=p.hist.filter(x=>x.lvl==='1군'&&x.y<y).map(x=>x.y); const best=[...new Set(prev)].map(yy=>warOf(seasonTotal(p,yy,'1군'),p));
    if(best.length&&w>Math.max(...best)+.3&&w>=2)story(p,`커리어 하이 시즌 · ${statLine(h,p)}`,'high'); } }

/* ===== 가을야구 확률(남은 일정 모의 진행) ===== */
let _poC={k:null};
function mulberry(a){ return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function playoffOdds(){
  if(period()!=='season')return null; const k=G.year+':'+G.day+':'+G.teams.map(t=>{ const r=G.sea.rec[t.id]; return r.w+'-'+r.l; }).join(','); if(_poC.k===k&&_poC.g===G)return _poC.v; /* 세이브가 바뀌어도 같은 날짜면 재사용하던 캐시(검수 11-07) */
  const rec=G.sea.rec; if(sum(G.teams.map(t=>rec[t.id].w+rec[t.id].l+(rec[t.id].t||0)))/G.teams.length<20){ _poC={k,v:null,g:G}; return null; } /* 20경기 전에는 확률을 내지 않는다(무승부도 치른 경기, 검수 11-06) */
  const str0=G.teams.map(t=>{ const r=rec[t.id]; return (r.w+(t.expW||.5)*60)/(r.w+r.l+60); });
  const rem=[]; for(const d in G.cal.sched){ if(+d>G.day)for(const m of G.cal.sched[d])rem.push(m); }
  const n=G.teams.length, N=400, top5=new Array(n).fill(0), first=new Array(n).fill(0), rnd=mulberry(G.day*7919+G.year);
  const w0=G.teams.map(t=>rec[t.id].w), l0=G.teams.map(t=>rec[t.id].l); const bi=[]; standingsNow().forEach((o,i)=>bi[o.tid]=i);
  for(let s=0;s<N;s++){ const w=w0.slice(), l=l0.slice(); const str=str0.map(x=>clamp(x+(rnd()+rnd()+rnd()-1.5)*.06,.25,.75)); /* 팀 실력 자체의 불확실성 */
    for(const [h,a] of rem){ const ph=str[h], pa=str[a]; const p=ph*(1-pa)/(ph*(1-pa)+pa*(1-ph))+.015; if(rnd()<p){w[h]++;l[a]++;} else {w[a]++;l[h]++;} }
    const pc=i=>w[i]+l[i]?w[i]/(w[i]+l[i]):.5; const ord=[...Array(n).keys()].sort((x,y)=>pc(y)-pc(x)||bi[x]-bi[y]); /* 동률은 실제 순위 규정(상대 전적·맞대결 득점)으로 정한 지금 순서대로(검수 11-08: 탈락 확정 팀이 가장 높게 나옴) */
    const eq=(a,b)=>a!=null&&b!=null&&Math.abs(pc(a)-pc(b))<1e-12; for(const i of [0,4])if(eq(ord[i],ord[i+1])&&!eq(ord[i-1],ord[i])&&!eq(ord[i+1],ord[i+2])&&rnd()<.5)[ord[i],ord[i+1]]=[ord[i+1],ord[i]]; /* 두 팀 동률은 결정전 한 경기 */ /* 동률은 팀마다 한 번 뽑은 값으로 가른다(정렬 중 난수 비교는 한쪽으로 치우쳤다, 검수 11-06) */
    for(let i=0;i<5;i++)top5[ord[i]]++; first[ord[0]]++; }
  const v=G.teams.map(t=>({tid:t.id,ps:top5[t.id]/N,first:first[t.id]/N,str:str0[t.id]})); _poC={k,v,g:G}; return v; } /* g: 다른 세이브의 확률을 쓰지 않게(검수 11-08) */

/* ===== 기록으로 보는 메모(능력치가 아니라 눈에 보이는 성적 기준) ===== */
const babipOf=h=>{ const d=(h.ab||0)-(h.so||0)-(h.hr||0); return d>0?(h.h-h.hr)/d:null; };
function amNotes(p){ const Y=p.amY; if(!Y||!Y.length)return []; const L=[];
  if(!p.isP){ const bk=Y.filter(x=>x.pa>=30).map(x=>x.so?x.bb/x.so:x.bb); const t=p.am; const tbk=t.so?t.bb/t.so:t.bb; const avg=t.ab?t.h/t.ab:0;
    if(bk.length>=2&&bk.every(v=>v>=.8))L.push(`학년마다 볼넷이 삼진만큼 많았습니다(볼삼비 ${tbk.toFixed(2)}). 선구안은 프로에 와서도 잘 변하지 않는 기록입니다.`);
    else if(bk.length>=2&&bk.every(v=>v<=.35)){ const rt=t.bb?t.so/t.bb:null; L.push(`학년마다 삼진이 볼넷보다 훨씬 많습니다(삼진 ${t.so} · 볼넷 ${t.bb}${rt?`, 약 ${rt.toFixed(1)}배`:''}). 프로 투수를 상대로 고전할 수 있습니다.`); }
    if(avg>=.36&&tbk<.5)L.push('타율은 높지만 볼삼비가 낮아, 이 타율이 프로에서 유지될지는 의문입니다.');
    if(Y.length>=3){ const a=Y[Y.length-1], b=Y[Y.length-2]; const o=x=>bRate(x).ops; if(o(a)-o(b)>=.15)L.push('마지막 학년에 기록이 크게 뛰었습니다. 성장인지 한 해 반짝인지 지켜봐야 합니다.'); } }
  else { const t=p.am; const k9=t.outs?t.so*27/t.outs:0, b9=t.outs?t.bb*27/t.outs:0; const b9s=Y.filter(x=>x.outs>=45).map(x=>x.bb*27/x.outs); const era=t.outs?(t.er||0)*27/t.outs:0;
    if(b9s.length>=2&&b9s.every(v=>v<=3))L.push(`학년 내내 볼넷이 적었습니다(9이닝당 ${b9.toFixed(1)}개). 제구는 프로에서도 비슷하게 이어지는 편입니다.`);
    else if(b9s.length>=2&&b9s.every(v=>v>=5))L.push(`학년 내내 볼넷이 많았습니다(9이닝당 ${b9.toFixed(1)}개). 제구 불안이 꾸준합니다.`);
    if(k9>=10)L.push(`탈삼진이 9이닝당 ${k9.toFixed(1)}개로 많습니다. 구위가 통한다는 신호입니다.`);
    if(era<=2&&k9<6)L.push('평균자책점에 비해 탈삼진이 적습니다. 수비와 타구 결과의 영향이 섞였을 수 있어 함께 확인할 필요가 있습니다.'); }
  return L.slice(0,2); }
function statNotes(p){ // 프로 기록에서 읽히는 신호
  const h=seasonTotal(p,G.year,'1군')||seasonTotal(p,G.year-1,'1군'); if(!h)return [];
  const L=[]; const yy=h.y===G.year?'올해':'지난해';
  if(!p.isP&&h.pa>=150){ const b=babipOf(h); const bk=h.so?h.bb/h.so:h.bb;
    if(b!=null&&b>=.37)L.push(`${yy} 인플레이 타구 타율(BABIP)이 ${fmt3(b)}로 높습니다. 타구 특성·주력·표본을 함께 확인해야 이 타율이 이어질지 판단할 수 있습니다.`);
    else if(b!=null&&b<=.25)L.push(`${yy} BABIP ${fmt3(b)}로 낮습니다. 타구 특성·주력·표본을 함께 확인할 필요가 있습니다. 타율이 오를 가능성은 있으나 지금 기록만으로 확정하기 어렵습니다.`);
    if(bk>=.9)L.push(`볼삼비 ${bk.toFixed(2)}. 선구안이 좋아 슬럼프가 길지 않은 유형입니다.`); else if(bk<=.3)L.push(`볼삼비 ${bk.toFixed(2)}. 삼진이 많아 기복이 클 수 있습니다.`); }
  if(p.isP&&h.outs>=120){ const k9=h.so*27/h.outs, b9=h.bb*27/h.outs, era=h.er*27/h.outs;
    if(era<=3.2&&k9-b9<4)L.push(`${yy} 평균자책점(${era.toFixed(2)})에 비해 탈삼진·볼넷 차이가 작습니다. 수비와 타구 결과의 영향이 있었는지 함께 확인할 필요가 있습니다.`);
    else if(era>=5&&k9-b9>=5)L.push(`${yy} 평균자책점(${era.toFixed(2)})은 나쁘지만 탈삼진·볼넷 내용은 좋습니다. 수비와 타구 결과의 영향을 함께 확인해 보세요. 나아질 가능성은 있으나 지금 기록만으로 확정하기 어렵습니다.`); }
  return L; }

