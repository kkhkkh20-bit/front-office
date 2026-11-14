/* ===== 감독이 먼저 하는 요청: 보강·정리·외국인 교체·FA·드래프트 ===== */
const MREQK={fit:'원하는 선수 유형 요청',slot:'보강 요청',out:'정리 요청',frep:'외국인 교체 요청',fa:'FA 영입 요청',draft:'드래프트 기조 추천'};
function mreqs(){ return G.mreq=G.mreq||[]; }
function mreqOpen(k){ return mreqs().filter(r=>r.st==='open'&&(!k||r.k===k)); }
/* 외국인 교체 판정(감독 요청·구단주 지원금 공통): 기존 선수가 떠났는지(out)와 그 뒤 새 외국인을 데려왔는지(inn). 둘 다면 교체 완료 */
function fRepState(pid,an,d0,until,kind0){ const p=G.players[pid]; const out=!p||p.team!==G.user; const kind=kind0||(p&&p.foreign); const inn=foreignOf(G.user).some(q=>q.acq&&q.acq.tid===G.user&&q.acq.k==='외국인'&&!q.ftmp&&(!kind||q.foreign===kind)&&(q.acq.n!=null?q.acq.n>(an||0):q.acq.d>(d0||0))&&(until==null||q.acq.d<=until)); return {out,inn,ok:out&&inn}; } /* 같은 쿼터(일반·아시아)를 마감 안에 채워야 교체(검수 11-08) */
function mreqAdd(k,data,until){ const r={id:'r'+(G.mreqSeq=(G.mreqSeq||0)+1),k,day:G.day,y:G.year,until,data,an:G.acqSeq||0,ids:Object.values(G.players).filter(p=>p.team===G.user).map(p=>p.id),st:'ask',mid:(G.mgr[G.user]||{}).id,tid:G.user}; mreqs().unshift(r); if(G.mreq.length>40)G.mreq.length=40; return r; }
function mgrSays(m){ return `${m.name} 감독`; }
function mreqAsk(r,title,sit,opts,def,face){ const m=G.mgr[G.user]; evNew('mreq',title,sit,opts,{from:'감독실',face:null,ref:face??null,data:{rid:r.id},def:def??opts.length-1,exp:7}); }
const DPOL={P:'투수 위주',C:'포수',IF:'내야수',OF:'외야수',HS:'고졸 유망주',COL:'대졸 즉시 전력'};
/* 감독 드래프트 기조: 수락한 그 구단·그해에만(검수 11-09d: 이직 뒤에도 전 구단 기조가 남음) */
function draftPolK(){ const P=G.draftPol; const m=G.mgr&&G.mgr[G.user]; return P&&P.y===G.year&&P.tid===G.user&&!G.unemp&&(P.mid==null||m&&!m.interim&&P.mid===m.id)?P.k:null; } /* 감독이 바뀌면 전임 추천도 끝(검수 11-09m) */
function draftFit(p,k){ if(!k||!p)return false; return k==='P'?p.isP:k==='C'?p.pos==='C':k==='IF'?['1B','2B','3B','SS'].includes(p.pos)&&!p.isP:k==='OF'?['LF','CF','RF'].includes(p.pos)&&!p.isP:k==='HS'?!p.college:k==='COL'?p.college:false; }
/* 요청은 생성·수락 시 실제 규정과 필요를 확인한다. 수락 후 자금·정원을 소비해 약속을 지우지는 않는다. */
const MREQ_PLAYER=new Set(['fit','slot','frep','fa']);
const mreqFaReady=p=>!!p&&!p.prospect&&!p.ys&&!isAway(p)&&healthy(p)&&!(p.joinY>ctSeason());
function mreqGate(k,d,r){
  const m=G.mgr&&G.mgr[G.user],per=period();if(!m||m.interim||G.unemp||G.gameOver)return '요청한 감독이 현재 구단을 맡고 있지 않습니다.';
  if(r&&((r.mid!=null&&r.mid!==m.id)||(r.tid!=null&&r.tid!==G.user)||G.day>r.until))return '요청한 감독·구단 또는 기한이 달라 요청을 종료합니다.';
  if(MREQ_PLAYER.has(k)){
    const q=G.mgrReq;if(q&&['rp','sp','bat','def'].includes(q.k)&&q.mid===m.id&&(q.tid==null||q.tid===G.user)&&q.until>=G.day)return '이미 선수 보강 요청을 진행 중입니다.';
    if(mreqs().some(x=>x!==r&&['ask','open'].includes(x.st)&&MREQ_PLAYER.has(x.k)&&(x.tid==null||x.tid===G.user)&&(x.mid==null||x.mid===m.id)))return '이미 선수 보강 요청을 진행 중입니다.';
    if(k!=='frep'&&rosterN(G.user)>=ROSTER_MAX)return '정식 선수 정원이 찼습니다. 선수단 정리 후 보강을 의논하겠습니다.';
  }
  if(k==='fit'){const role=d&&(d.role||d.k);G._rg=null;if(!MROLE[role]||roleGap(G.user,role)<=0)return '필요한 역할을 이미 갖추고 있습니다.';if(!(per==='season'&&tradeOpen()||G.fa&&G.fa.open&&!G.fa.closed))return '선수 보강을 약속할 수 있는 시장 기간이 아닙니다.';}
  if(k==='slot'){const sk=d&&(d.sk||d.k);if(per!=='season'||!tradeOpen()||!PSLOTS.includes(sk)||sk==='DH')return '현재 해당 자리 보강을 추진할 수 있는 트레이드 기간이 아닙니다.';const w=slotRanks(G.user)[sk];if(!w||w.rank<8)return '해당 자리는 현재 보강을 조를 만큼 부족하지 않습니다.';if(domestic(G.user).some(p=>pSlot(p)===sk&&p.injOut>0&&p.injOut<=45&&ovr(p)>=w.v+3))return '같은 자리의 주전이 곧 부상에서 복귀합니다.';}
  if(k==='frep'){const p=d&&G.players[d.pid||d.id];if(per!=='season'||!foreignOpen()||!p||p.team!==G.user||!p.foreign||fReplLeft(G.user,p.foreign)<=0)return '현재 외국인 교체를 추진할 수 없습니다.';}
  if(k==='fa'){const F=G.fa;if(!F||!F.open||F.closed)return 'FA 시장이 닫혀 있습니다.';if(d&&d.pid){const p=G.players[d.pid];if(!mreqFaReady(p)||p.team!=null||!(F.pool||[]).includes(p.id)||faOutBlocked(G.user,p)||!p.ask||p.ask.annual>capOf(sponSeason())-capPayNext(G.user)||(p.relBan&&p.relBan[G.user]>G.day))return '현재 계약을 추진할 수 있는 FA가 아닙니다.';const w=slotRanks(G.user)[pSlot(p)];if(w&&w.rank<7)return '해당 FA가 보강할 자리를 이미 갖췄습니다.';}}
  if(k==='out'){const p=d&&G.players[d.pid||d.id];if(per!=='season'||!tradeOpen()||!p||p.team!==G.user||p.ys||!p.e1)return '현재 정리 요청의 트레이드·말소 선택지를 실행할 수 있는 1군 선수가 아닙니다.';}
  if(k==='draft'&&(G.day>G.cal.draft||G.draft&&G.draft.done&&G.draft.y===G.year))return '이번 신인 드래프트는 이미 끝났습니다.';
  return '';
}
function mreqAcquired(p,r){const a=p&&p.acq;return !!(p&&p.team===G.user&&a&&a.tid===G.user&&a.d>=r.day&&a.d<=r.until&&(r.an==null||a.n>r.an)&&!(r.ids||[]).includes(p.id));}
/* 매주: 새 요청을 꺼내고, 진행 중인 요청을 점검한다 */
function mreqWeek(){ const m=G.mgr[G.user]; if(!m||m.interim||G.gameOver||G.unemp)return; mgrFix(m); mreqCheck();
  const per=period(); const open=mreqs().filter(r=>r.st==='open'||r.st==='ask'); if(open.length>=2)return;
  const recent=mreqs().filter(r=>r.day>G.day-28).length; if(recent)return;
  const C=[];
  if(per==='season'&&tradeOpen()&&!open.some(r=>r.k==='slot')&&!mreqs().some(r=>r.k==='slot'&&r.day>G.day-50)){ const rk=slotRanks(G.user); const w=PSLOTS.filter(k=>k!=='DH').map(k=>({k,r:rk[k].rank})).sort((a,b)=>b.r-a.r)[0];
    const back=w&&domestic(G.user).some(p=>pSlot(p)===w.k&&p.injOut>0&&p.injOut<=45&&ovr(p)>=rk[w.k].v+3); /* 그 자리 주전이 부상 중이고 곧 돌아오면 보강을 조르지 않는다(커뮤니티 피드백 11-07) */ if(w&&w.r>=8&&!back)C.push(['slot',w,1.2+(m.ego-50)/60]); }
  if(per==='season'&&G.day>G.cal.open+25&&!open.some(r=>r.k==='out')){ const bad=domestic(G.user).filter(p=>{ if(p.ys||p.age<29||!p.e1)return false; const h=seasonTotal(p,G.year,'1군'); if(!h)return false; return p.isP?(h.outs>=60&&pRate(h).era>6):(h.pa>=90&&bRate(h).ops<.600); }).sort((a,b)=>b.sal-a.sal)[0]; if(bad&&!mreqs().some(r=>r.k==='out'&&r.data.pid===bad.id))C.push(['out',bad,.8+(m.disc-50)/80]); }
  if(per==='season'&&G.day<=foreignDL()&&!open.some(r=>r.k==='frep')){ const f=foreignOf(G.user).find(p=>{ if(fReplLeft(G.user,p.foreign)<=0)return false; const h=seasonTotal(p,G.year,'1군'); return h&&(p.isP?(h.outs>=90&&pRate(h).era>5.4):(h.pa>=130&&bRate(h).ops<.690)); }); if(f)C.push(['frep',f,1]); }
  if((per==='season'&&tradeOpen()||G.fa&&G.fa.open&&!G.fa.closed)&&!open.some(r=>r.k==='fit')&&G.day-(G.mgrFitD??-99)>=50){ const nd=mgrNeedRole(G.user); if(nd)C.push(['fit',nd,1.3+(m.ego-50)/80]); }
  if(G.day>=KD(8,20)&&G.day<KD(9,10)&&!mreqs().some(r=>r.k==='draft'&&r.y===G.year&&(r.tid==null||r.tid===G.user)))C.push(['draft',null,3]); /* 이직한 구단 감독은 따로 낸다 */
  if(G.fa&&G.fa.open&&!G.fa.closed&&!mreqs().some(r=>r.k==='fa'&&r.y===G.year))C.push(['fa',null,3]);
  const ready=C.filter(c=>!mreqGate(c[0],c[1]));if(!ready.length||R()>.45)return;C.length=0;C.push(...ready); let x=R()*sum(C.map(c=>Math.max(.2,c[2]))); for(const c of C){ x-=Math.max(.2,c[2]); if(x<=0){ mreqMake(c[0],c[1]); return; } } }
/* 현실적으로 데려오기 어려운 선수: 그 구단 핵심(능력 상위 3명)·프랜차이즈 스타·트레이드 거부권 보유·우리 상한 여유로 감당 못 할 연봉(커뮤니티 피드백 11-07: 다른 구단 간판을 자꾸 요구) */
function mgrUnreal(p){ try{ const top=domestic(p.team).filter(q=>!q.ys).map(ovr).sort((a,b)=>b-a); if(ovr(p)>=(top[2]??99))return true; if(p.ntc||franId(p.team)===p.id)return true; if(p.sal>Math.max(0,capOf(sponSeason())-capPay(G.user))+3000)return true; }catch(e){} return false; }
function mreqMake(k,d){ const m=G.mgr[G.user]; if(mreqGate(k,d))return;const nm=mgrSays(m);
  if(k==='fit'){ G.mgrFitD=G.day; const R0=MROLE[d.k]; const cs=roleCands(G.user,d.k,3).filter(p=>!isAway(p)); const ins=roleInside(G.user,d.k); const ty=mgrType(m); const until=period()==='season'?Math.min(G.day+35,tradeDL()):G.day+40;
    const r=mreqAdd('fit',{role:d.k,have:d.have,cands:cs.map(p=>p.id)},until);
    mreqAsk(r,`${nm}: ${R0.l}이(가) 필요합니다`,`"제 야구는 ${ty.n}입니다. 지금 주전 중 ${R0.l}이(가) ${d.have}명뿐입니다(${R0.tgt}명은 있어야 합니다). ${R0.need}이(가) 좋은 선수를 찾아 주십시오. ${R0.acc}은(는) 감수하겠습니다. 쓰임새는 ${R0.role}입니다."
기준: ${crTxt(d.k)}${cs.length?`\n예: ${cs.map(p=>`${p.name}(${p.team!=null?tshort(p.team):'FA'}, ${posLabel(p)}, ${roleTags(p,d.k)})`).join(' / ')}`:''}\n내부 대안: ${ins?`${ins.name}(${posLabel(ins)}, ${roleTags(ins,d.k)})`:'없음'}. 꼭 이 선수들이 아니어도 조건에 맞는 선수면 됩니다.`,
      [{l:'맞는 선수를 찾아보겠다',fx:`${dmd(until)}까지 조건에 맞는 선수를 데려오면 감독과 사이가 좋아지고, 감독은 그 선수를 원하는 자리에 씁니다. 못 하면 감독이 실망합니다.`},{l:'지금 선수로 간다',fx:`감독 관계 악화.`}],1,cs[0]?cs[0].id:null); return; }
  if(k==='slot'){ if(G.day-(G.mgrReqD??-99)<45)return; G.mgrReqD=G.day; const sk=d.k; const cur=slotRanks(G.user)[sk]; const rv=cur.v;
    const cands=Object.values(G.players).filter(p=>p.team!=null&&p.team!==G.user&&!p.foreign&&!p.ys&&!(p.joinY>G.year)&&pSlot(p)===sk&&ovr(p)>=rv+4&&healthy(p)&&!mgrUnreal(p)).sort((a,b)=>(ovr(b)+mgrFitB(G.user,b)*3)-(ovr(a)+mgrFitB(G.user,a)*3)).slice(0,8); /* 같은 자리라도 감독 야구에 맞는 선수를 먼저 */
    const t=cands.find(p=>{ try{ return findPackages(p.id).length>0; }catch(e){ return false; } })||null; const until=Math.min(G.day+30,tradeDL());
    const r=mreqAdd('slot',{sk,rank:d.r,v:rv,target:t?t.id:null},until);
    mreqAsk(r,`${nm}: ${SLOTK[sk]} 보강 요청`,`"${SLOTK[sk]} 자리가 리그 ${d.r}위입니다. 이대로는 버티기 어렵습니다.${t?` ${tname(t.team)}의 ${t.name}(${posLabel(t)}, ${t.age}세) 같은 선수가 필요합니다.`:''}" ${dmd(until)}까지 ${SLOTK[sk]}을(를) 보강해 달라고 합니다.`,
      [{l:'알겠다, 보강하겠다',fx:`${dmd(until)}까지 ${SLOTK[sk]} 자리에 지금보다 나은 선수를 데려오면 감독과 사이가 좋아집니다. 못 하면 감독이 크게 실망합니다.`},{l:'지금 전력으로 간다',fx:`감독 관계 악화.`}],1,t?t.id:null); return; }
  if(k==='out'){ const p=d; const h=seasonTotal(p,G.year,'1군'); const r=mreqAdd('out',{pid:p.id},G.day+30);
    mreqAsk(r,`${nm}: ${p.name} 정리 요청`,`"${p.name}은(는) ${statLine(h,p)}입니다. 엔트리 한 자리가 아깝습니다. 정리하고 그 자리를 다른 선수에게 주고 싶습니다." 연봉 ${money(p.sal)}${p.faC?` · 잔여 ${p.yrs}년`:''}.`,
      [{l:'트레이드 매물로 내놓는다',fx:'30일 안에 내보내면 감독 관계 개선. 매물로 내놓기만 해도 감독은 일단 받아들입니다.'},{l:'방출한다',fx:`바로 정리합니다. ${relCost(p).tot?`확정 보장액 절반(${money(relCost(p).tot)})을 지급합니다. `:''}감독 관계 개선, 선수단 분위기 조금 하락.`},{l:'2군으로 내린다',fx:'1군에서 말소합니다(계약은 그대로 두고 엔트리만 정리). 감독 관계 조금 개선, 선수 기분 조금 하락.'},{l:'더 기회를 준다',fx:`감독 관계 악화. 선수 기분은 오릅니다.`}],3,p.id); return; }
  if(k==='frep'){ const p=d; const alt=(G.fwatch||[]).map(w=>G.players[w.id]).filter(q=>q&&q.isP===p.isP&&q.foreign===p.foreign); const dl=foreignDL(); const r=mreqAdd('frep',{pid:p.id,foreign:p.foreign},Math.min(G.day+21,dl)); r.an=G.acqSeq||0; const left=Math.max(0,r.until-G.day); /* 기한: 21일과 외국인 등록 마감 중 빠른 날 */
    mreqAsk(r,`${nm}: 외국인 ${p.name} 교체 요청`,`"${p.name}로는 안 됩니다. 시즌을 포기할 수 없으니 바꿔 주십시오."${alt.length?` 관찰 명단의 ${alt.map(q=>q.name).join(', ')}을(를) 언급합니다.`:' 관찰 명단에 같은 유형 후보가 없습니다.'}`,
      [{l:'교체를 추진한다',fx:`${dmd(r.until)}까지(${left}일${r.until===dl?', 외국인 등록 마감':''}) 기존 선수를 내보내고 새 외국인을 데려오면 감독과 사이가 좋아집니다. 못 하면 감독이 실망합니다. 내보내기만 하면 정리 완료로 보고 고마워하지 않습니다.`},{l:'좀 더 지켜본다',fx:'감독 관계 악화.'}],1,p.id); return; }
  if(k==='fa'){ const rk=slotRanks(G.user); const weak=PSLOTS.filter(s=>s!=='DH'&&rk[s].rank>=7).sort((a,b)=>rk[b].rank-rk[a].rank).slice(0,3);
    const capRoom=capOf(sponSeason())-capPayNext(G.user); /* 연봉 상한 여유 안에서 잡을 수 있는 FA만 요청(커뮤니티 피드백 11-07: 돈만 보고 상한을 넘는 FA를 요구) */
    const pool=G.fa.pool.map(id=>G.players[id]).filter(p=>mreqFaReady(p)&&p.team==null&&weak.includes(pSlot(p))&&!faOutBlocked(G.user,p)&&!(p.relBan&&p.relBan[G.user]>G.day)&&p.ask&&p.ask.annual<=capRoom).sort((a,b)=>ovr(b)-ovr(a)); const p=pool[0]; if(!p)return;
    const o=dobj(G.day); const close=o.m<=2?KD(1,23):dnum(G.year+1,1,23); if(!G.fa||G.fa.closed||close-G.day<7)return;
    const r=mreqAdd('fa',{pid:p.id},Math.min(close,G.day+21)); const b=budget();
    mreqAsk(r,`${nm}: FA ${p.name} 영입 요청`,`"${SLOTK[pSlot(p)]}이(가) 우리 약점입니다. FA ${p.name}(${posLabel(p)}, ${p.age}세)만 잡아 주시면 내년은 다르게 싸울 수 있습니다." 선수 요구는 ${p.ask.years}년 연 ${money(p.ask.annual)}, 우리 예산 여유는 ${money(b.roomGoal)}, 연봉 상한 여유는 ${money(capRoom)}입니다.`,
      [{l:'영입에 나서겠다',fx:`${dmd(r.until)}까지 잡으면 감독과 사이가 크게 좋아집니다. 다른 팀에 뺏기거나 기한을 넘기면 감독이 실망합니다.`},{l:'예산상 어렵다',fx:'감독 관계 조금 악화. 감독도 사정은 압니다.'}],1,p.id); return; }
  if(k==='draft'){ const ps=playersOf(G.user); const pit=ps.filter(p=>p.isP).length; const C=ps.filter(p=>p.pos==='C'&&!p.isP).length; const rk=slotRanks(G.user);
    let pol=m.youth>=62?'HS':teamCtx(team(G.user)).contend?'COL':'HS'; if(pit<15||rk.SP.rank>=7)pol='P'; else if(C<3||rk.C.rank>=8)pol='C'; else if(['2B','SS','3B'].some(s=>rk[s].rank>=8))pol='IF'; else if(['LF','CF','RF'].some(s=>rk[s].rank>=8))pol='OF';
    const why={P:`투수가 ${pit}명뿐이고 선발진이 리그 ${rk.SP.rank}위입니다`,C:`포수가 ${C}명이고 포수 자리가 리그 ${rk.C.rank}위입니다`,IF:'내야가 약합니다',OF:'외야가 약합니다',HS:'당장보다 몇 년 뒤를 봐야 합니다',COL:'바로 쓸 선수가 필요합니다'}[pol];
    const r=mreqAdd('draft',{pol},G.cal.draft+1);
    mreqAsk(r,`${nm}: 드래프트는 ${DPOL[pol]}(으)로`,`"${why}. 이번 드래프트는 ${DPOL[pol]}(으)로 가 주셨으면 합니다." 스카우트팀 판단과는 다를 수 있습니다.`,
      [{l:'감독 의견대로 간다',fx:`드래프트 화면에 "감독 추천" 표시가 붙습니다. 1·2라운드에서 이 기조 선수를 뽑으면 감독 관계 개선.`},{l:'스카우트 판단을 따른다',fx:'감독 관계 조금 악화. 감독은 크게 개의치 않습니다.'}],0); return; } }
/* 감독이 바뀌면 전임 감독이 보낸 미응답 요청을 끝낸다(소식은 기록으로 남고 결정 버튼만 사라진다) */
function mreqCloseOld(){ const m=G.mgr[G.user]; const mid=m&&!m.interim?m.id:null; if(G.dirFr&&G.dirFr.mid!==mid)G.dirFr=null; /* 지시 충돌 횟수도 감독마다 */ const end=e=>{ e.done=true; e.res='요청한 감독이 팀을 떠나 종료'; const ml=(G.mail||[]).find(x=>x.id===e.mid); if(ml){ ml.acts=[]; ml.imp=false; ml.body+='\n\n[종료] 요청한 감독이 팀을 떠나 이 요청은 끝났습니다.'; } };
  for(const r of mreqs())if((r.st==='ask'||r.st==='open')&&r.mid!==mid){ r.st='void'; const e=(G.evs||[]).find(x=>x.k==='mreq'&&!x.done&&x.data&&x.data.rid===r.id); if(e)end(e); } /* 수락해 진행 중인 요청도 전임 감독 것(검수 11-09m: 전임 정리 요청을 새 감독 요청처럼 처리) */
  for(const e of (G.evs||[]))if(e.k==='mpick'&&!e.done&&(e.data||{}).mid!==mid)end(e); }
EVH.mreq={ pick(e,i){ const r=mreqs().find(x=>x.id===e.data.rid); const m=G.mgr[G.user]; if(!r||!m)return ''; if((r.mid!=null&&r.mid!==m.id)||(r.tid!=null&&r.tid!==G.user)){ r.st='void'; return '요청한 감독·구단이 달라 이 요청은 끝났습니다. 아무것도 바꾸지 않았습니다.'; }if(r.st!=='ask')return '이미 처리한 감독 요청입니다.';const gate=mreqGate(r.k,r.data,r);if(gate){r.st='void';return gate+' 감독 관계 변화는 없습니다.';} /* 응답 때도 요청한 감독인지 다시 본다 */ const L=e.opts.length;
    const neg=d=>{ m.rel=clamp(m.rel-d,0,100); return `감독 관계 악화.`; };
    if(r.k==='fit'){ if(i===0){ r.st='open'; return `${dmd(r.until)}까지 ${MROLE[r.data.role].l}을(를) 찾기로 했습니다.`; } r.st='no'; return neg(m.ego>=70?4:2); }
    if(r.k==='slot'){ if(i===0){ r.st='open'; return `${dmd(r.until)}까지 ${SLOTK[r.data.sk]} 보강을 약속했습니다.`; } r.st='no'; return neg(m.ego>=70?5:3); }
    if(r.k==='out'){ const p=G.players[r.data.pid]; if(!p||p.team!==G.user){ r.st='done'; return ''; }
      if(i===0){r.until=Math.min(r.until,tradeDL()); p.listed=true; p.mor=clamp((p.mor??60)-4,0,100); r.st='open'; m.rel=clamp(m.rel+1,0,100); return `${p.name}을(를) 트레이드 매물로 내놓았습니다. 감독 관계 조금 개선.`; }
      if(i===1){ const nm=p.name; releasePlayer(p.id); r.st='done'; m.rel=clamp(m.rel+4,0,100); for(const q of playersOf(G.user))q.mor=clamp((q.mor??60)-1,0,100); return `${nm}을(를) 방출했습니다. 감독 관계 개선.`; }
      if(i===2){ r.st='done'; m.rel=clamp(m.rel+2,0,100); p.mor=clamp((p.mor??60)-2,0,100); if(p.e1){ p.e1=false; p.downDay=G.day; try{ entryManage(G.user,false,true); }catch(e){} } return `${p.name}을(를) 2군으로 내렸습니다(${dmd(G.day+10)}부터 재등록 가능). 감독 관계 조금 개선.`; } /* 감독이 정리를 요청한 선수는 말소로도 요청을 들어준다(카페 11-08) */
      r.st='no'; p.mor=clamp((p.mor??60)+5,0,100); return `${p.name}에게 기회를 더 줍니다. 기분 상승. `+neg(m.ego>=70?5:3); }
    if(r.k==='frep'){ if(i===0){ r.st='open'; return `${dmd(r.until)}까지 교체를 추진합니다(기존 선수 정리 + 새 외국인 영입). 외국인 시장과 관찰 명단을 확인하세요.`; } r.st='no'; return neg(3); }
    if(r.k==='fa'){ if(i===0){ r.st='open'; return 'FA 협상에 나섭니다.'; } r.st='no'; return neg(2); }
    if(r.k==='draft'){ if(i===0){ r.st='open'; G.draftPol={y:G.year,k:r.data.pol,tid:G.user,mid:m.id}; return `드래프트 기조: ${DPOL[r.data.pol]}.`; } r.st='no'; if(draftPolK())G.draftPol=null; /* 다른 구단 기조는 건드리지 않는다 */ return neg(1); }
    return ''; } };
/* 약속을 지켰는지 */
function mreqCheck(){ const m=G.mgr[G.user]; if(!m)return; for(const r of mreqs()){ if(r.st!=='open')continue; if((r.mid!=null&&r.mid!==m.id)||(r.tid!=null&&r.tid!==G.user)){ r.st='void'; continue; } /* 그 감독·그 구단과 한 약속 */ let ok=false, fail=false;
    if(r.k==='fit'){ const got=Object.values(G.players).some(p=>mreqAcquired(p,r)&&mgrReinforceReady(p)&&roleOk(p,r.data.role)); G._rg=null; ok=got||(G.day<=r.until&&roleGap(G.user,r.data.role)===0); if(!ok&&G.day>r.until)fail=true; }
    else if(r.k==='slot'){ const cur=slotRanks(G.user)[r.data.sk]; const tg=r.data.target&&G.players[r.data.target]; const got=tg&&mreqAcquired(tg,r)&&mgrReinforceReady(tg); const sk=r.data.sk, fits=p=>sk==='SP'||sk==='RP'?p.isP&&pSlot(p)===sk:!p.isP&&(p.pos===sk||subsOf(p).includes(sk)); const AQ=Object.values(G.players).filter(p=>mreqAcquired(p,r)&&mgrReinforceReady(p)&&fits(p)); const acq=AQ.length>0; ok=!!(got&&fits(tg))||(acq&&(cur.v>r.data.v||AQ.some(p=>ovr(p)>=r.data.v))); /* 그 자리 선수를 데려왔고 그 자리가 나아졌거나 데려온 선수가 지금 주전급이면 약속을 지킨 것(사용자 피드백 11-06: 보강했는데 안 됐다고 함) */ /* 요청한 자리의 선수를 데려와야 약속을 지킨 것(검수 11-05: 선발 요청을 야수 영입으로 충족) */ if(!ok&&G.day>r.until)fail=true; }
    else if(r.k==='out'){ const p=G.players[r.data.pid]; ok=!p||p.team!==G.user; if(!ok&&G.day>r.until){ r.st='half'; continue; } }
    else if(r.k==='frep'){ const s=fRepState(r.data.pid,r.an,r.day,r.until,r.data.foreign); ok=s.ok&&foreignOf(G.user).some(p=>mreqAcquired(p,r)&&!p.ftmp&&(!r.data.foreign||p.foreign===r.data.foreign)&&mgrReinforceReady(p)); if(s.out&&!s.inn&&!r.outD){ r.outD=G.day; } if(!ok&&G.day>r.until){ if(s.out){ r.st='half'; r.end=G.day; mail('감독실',`${m.name} 감독: 정리는 됐는데 빈자리가 남았습니다`,`외국인 교체 요청 중 기존 선수 정리는 끝났지만 새 선수가 오지 않았습니다. 감독 관계 변화 없음.`,{kind:'감독'}); continue; } fail=true; } } /* 내보내기만 하면 '정리 완료', 새 외국인까지 와야 '교체 완료'. 수락 후 다른 선수에 교체 횟수를 쓰는 것으로 기존 약속을 지우지는 않는다 */
    else if(r.k==='fa'){ const p=G.players[r.data.pid]; const signed=(G.fa&&G.fa.results||[]).some(x=>x.id===r.data.pid&&x.to===G.user&&x.day>=r.day&&x.day<=r.until);ok=p&&p.team===G.user&&(mreqAcquired(p,r)||signed)&&mreqFaReady(p); if(!ok&&(p&&p.team!=null&&p.team!==G.user||G.fa&&G.fa.closed||G.day>r.until))fail=true; } /* 요청 화면의 기한까지(검수 11-09m) */
    else if(r.k==='draft'){ if(G.draft&&G.draft.done&&G.draft.y===G.year){ const mine=G.draft.picks.filter(x=>x.tid===G.user&&x.pid>0&&x.rd<=2).map(x=>G.players[x.pid]).filter(Boolean); ok=mine.some(p=>draftFit(p,r.data.pol)); fail=!ok; } }
    const gain={fit:5,slot:6,out:4,frep:5,fa:7,draft:4}[r.k], loss={fit:3,slot:5,out:0,frep:4,fa:4,draft:1}[r.k];
    if(ok){ r.st='done'; r.end=G.day; m.rel=clamp(m.rel+gain,0,100); mail('감독실',`${m.name} 감독: "고맙습니다"`,`${MREQK[r.k]}을(를) 들어주셨습니다. 감독 관계 개선.${r.k==='slot'||r.k==='fa'?' 선수단 분위기도 좋아졌습니다.':''}`,{kind:'감독'}); if(r.k==='slot'||r.k==='fa'){ if(!G.form||G.day>G.form.until)G.form={until:G.day+10,b:.4}; } }
    else if(fail){ r.st='fail'; r.end=G.day; m.rel=clamp(m.rel-loss,0,100); if(loss)mail('감독실',`${m.name} 감독: "약속은 어떻게 된 겁니까"`,`${MREQK[r.k]}이(가) 지켜지지 않았습니다. 감독 관계 악화.`,{kind:'감독',imp:true}); } } }

/* ===== 구단주와의 소통: 단장이 돈을 요청하고, 구단주가 먼저 주문하기도 한다 ===== */
/* 지원금 기록: 받는 순간의 영입 순번(an)을 함께 남긴다(그 뒤 영입만 '목적대로 씀') */
function grantAdd(g){ if(g&&g.an==null)g.an=G.acqSeq||0; if(g&&g.tid==null)g.tid=G.user; /* 어느 구단 구단주에게 받은 지원인지 */ grants().unshift(g); }
function grants(){ const L=G.grants=G.grants||[]; for(const g of L)if(g.an==null)g.an=G.acqSeq||0; return L; } /* an: 지원금을 받을 때까지의 영입 순번(그 뒤 영입만 '목적대로 씀'으로 센다) */
function grantAmt(y){ return sum(grants().filter(g=>g.y===(y??G.year)&&g.ok&&g.st!=='void'&&(g.tid==null||g.tid===G.user)).map(g=>g.amt)); } /* 지금 구단이 받은 것만(이직 전 구단 지원금 제외, 검수 11-08) */
function ownAskLeft(){ const o=dobj(G.day); const mk=o.y*100+o.m; return grants().some(g=>g.mk===mk&&g.by==='gm'&&(g.tid==null||g.tid===G.user))?0:1; } /* 이직하면 새 구단주에게는 처음 요청 */
/* 성사 가능성: 신뢰, 구단주 성향, 순위, 목적 */
function ownOdds(amt,pur){ return ownOddsT(G.user,amt,pur); }
/* 어느 구단 단장이든 같은 승인 식(사용자 11-13: AI 단장도 구단주에게 자금을 요청한다). 우리 구단만 쓰는 몫: 예산 외 수입 여유·구단주 동석 친밀도 */
function ownOddsT(tid,amt,pur){ const t=team(tid); if(t.indie)return 0; const me=tid===G.user&&!G.unemp; const ow=t.owner; const rk=me?uRank():rankNowT(tid); let p=.35+(t.trust-50)/80;
  const contend=rk<=5||teamCtx(t).contend; if(ow==='win')p+=contend?.2:-.05; if(ow==='profit')p-=.18; if(austOn(t)?.strict)p-=.1; if(ow==='pr')p+=.05;
  if(pur&&pur.k==='fa'){ const q=G.players[pur.pid]; if(q){ if(ovr(q)>=62)p+=ow==='pr'?.2:.1; } p+=.08; } if(pur&&pur.k==='frep')p+=.05;
  if(me){ const ex=budgetExtra(); if(ex>0)p+=clamp(ex/Math.max(500,amt),0,1)*.2; } /* 예상보다 수입이 늘었으면(관중·광고) 구단주도 더 내줄 여유가 있다 */
  p-=Math.max(0,amt-1000)/4000; const asked=me?grants().filter(g=>g.y===sponSeason()&&g.by==='gm'&&(g.tid==null||g.tid===G.user)).length:(t.ownAsk||[]).filter(g=>g.y===sponSeason()).length; p-=asked*.08; if(me)p+=cwRapMod(); /* 구단주·사장 친밀도(동석 관람) */ return clamp(p,.03,.92); }
function rankNowT(tid){ try{ const i=standingsNow().findIndex(x=>x.tid===tid); return i>=0?i+1:5; }catch(e){ return 5; } }
function oddsShort(p){ return p>=.7?'가능성 높음':p>=.45?'반반':p>=.25?'가능성 낮음':'거의 어려움'; }
function oddsTxt(p){ return p>=.7?'받아들일 가능성이 큽니다':p>=.45?'반반입니다':p>=.25?'쉽지 않습니다':'거의 어렵습니다'; }
/* w: 사유를 고른 요청(ownWhy 결과). 승인 확률·목적·구단주 대답이 사유에 따라 정해진다. 없으면 예전 방식(면담·동석 관람) */
function ownerAsk(amt,pur,w){ const t=team(G.user); if(t.indie)return '독립구단이라 모기업 지원이 없습니다. 스폰서와 자체 수익으로 운영합니다.'; if(pur&&pur.k==='frep'&&G.day>foreignDL())return '외국인 등록 마감이 지나 교체 자금을 요청할 수 없습니다.'; if(pur&&pur.k==='fa'){ const q=G.players[pur.pid]; if(!(G.fa&&G.fa.open&&!G.fa.closed&&q&&q.team==null&&q.ask&&G.fa.pool.includes(q.id)&&!faOutBlocked(G.user,q)))return '지금 계약할 수 있는 FA가 아니라 영입 자금을 요청할 수 없습니다.'; } /* 시장이 닫혔거나 외부 FA 한도를 채운 선수(검수 11-09zzd) */ /* 이행할 수 없는 요청은 받지 않는다(검수 11-08) */ if(!ownAskLeft())return '이번 달에는 이미 요청했습니다. 다음 달에 다시 요청할 수 있습니다.'; if(w&&w.block)return w.block;
  /* 자주·크게 요청할수록 더 자주 거절한다(설문 11-12: 좋은 구단주는 너무 쉽게 내준다): 최근 120일 요청 1건마다 ×0.85, 2천만 원 단위 이상 큰 요청 ×0.9 */ const rec=grants().filter(g=>g.by==='gm'&&(g.tid==null||g.tid===G.user)&&G.day-(g.d||0)<=120).length;
  const p=(w?w.p:ownOdds(amt,pur))*(HARD()?.75:1)*Math.pow(.85,rec)*(amt>=2000?.9:1); /* 하드 모드: 구단주 승인이 더 어렵다 */ const ok=R()<p; const B=bossOf(G.user); const o=dobj(G.day); const g={y:sponSeason(),mk:o.y*100+o.m,d:G.day,amt,pur:pur||null,ok,by:'gm', /* y: 이 돈이 들어가는 시즌(겨울 승인분은 다음 시즌, 검수 11-08) */st:ok?'open':'no',until:pur&&pur.k==='fa'?grantFaEnd():pur&&pur.k==='frep'?Math.min(G.day+30,foreignDL()):pur&&pur.k==='boost'?(w&&w.until):null};
  if(w)g.why=w.k; grantAdd(g); if(G.grants.length>40)G.grants.length=40; const what=w?`${OWN_WHY[w.k].l} 자금${pur&&pur.k==='fa'?`(${G.players[pur.pid]?.name||''})`:pur&&pur.k==='frep'?`(${G.players[pur.pid]?.name||''})`:''}`:pur?pur.k==='fa'?`FA ${G.players[pur.pid]?.name||''} 영입 자금`:pur.k==='frep'?'외국인 교체 자금':'운영 자금':'운영비 증액';
  const say=w?(ok?w.lineOk:w.lineNo):null; if(w)w.said=say;
  if(ok){ grantApply(amt); if(!pur)g.st='done'; mail('구단주실',`구단주 승인: ${what} ${money(amt)}`,`${B.own.name} 회장이 ${what} ${money(amt)}을(를) 승인했습니다.${say?` "${say}"`:''} ${pur?'목적대로 쓰지 않으면 신뢰가 깎입니다. ':''}${g.y>G.year?`${g.y}시즌`:'올해'} 모기업 지원 한도와 구단주 목표가 그만큼 늘었습니다.`,{kind:'구단주'}); return `승인됐습니다. ${what} ${money(amt)}.`; }
  t.trust=clamp(t.trust-1,0,100); mail('구단주실',`구단주 반려: ${what}`,`${B.own.name} 회장이 요청을 반려했습니다. "${say||(t.owner==='profit'?'지금 적자부터 줄이세요.':t.owner==='win'?'성적으로 먼저 증명하세요.':'지금은 때가 아닙니다.')}" 구단주 신뢰 조금 하락.`,{kind:'구단주'}); return `반려됐습니다. 구단주 신뢰 조금 하락.`; }
/* ===== 사유를 들고 가는 자금 요청: 사유 × 상황(구단주 성향·신뢰·순위·시기·재정·지난 지원의 결과)으로 확률과 대답이 달라진다 ===== */
const OWN_WHY={fa:{l:'FA 영입',d:'FA 시장에서 데려올 선수 몫'},frep:{l:'외국인 교체',d:'부진한 외국인을 바꿀 돈'},fac:{l:'시설 투자',d:'훈련·구장 시설에 쓸 돈'},dev:{l:'육성·스카우트',d:'2군·스카우트에 쓸 돈. 금액이 작다'},push:{l:'우승 도전 보강',d:'트레이드·외국인으로 당장 전력을 채울 돈'},deficit:{l:'재정 적자 메우기',d:'구멍 난 살림을 메울 돈'}};
const OWN_AMT={fac:[1000,2000,3000],dev:[500,1000,1500],push:[1000,2000,3000],deficit:[1000,2000,3000],fa:[1000,2000,3000]};
function ownWhyFA(){ return G.fa&&G.fa.open&&!G.fa.closed?G.fa.pool.map(id=>G.players[id]).filter(p=>p&&p.team==null&&p.ask&&!faOutBlocked(G.user,p)).sort((a,c)=>ovr(c)-ovr(a)).slice(0,3):[]; }
function ownWhyBadF(){ return foreignOf(G.user).filter(p=>{ const h=seasonTotal(p,G.year,'1군'); return h&&(p.isP?(h.outs>=60&&pRate(h).era>5):(h.pa>=100&&bRate(h).ops<.700)); }); }
function ownChance(p){ return p>=.6?'높음':p>=.35?'보통':'낮음'; }
function ownWhy(k,amt,pid){ const t=team(G.user); const W=OWN_WHY[k]; if(!W)return null; const ow=t.owner, per=period(), inS=per==='season', rk=uRank(), tr=t.trust; const F=[]; const f=(d,txt)=>F.push([d,txt]); let block=null, pur=null, until=null;
  const lastRk=G.last&&G.last.order?G.last.order.findIndex(o=>o.tid===G.user)+1||5:5; let room=0; try{ room=budget().roomGoal; }catch(e){}
  if(k==='fa'){ const p=pid!=null?G.players[pid]:null; if(p&&p.team==null&&ownWhyFA().includes(p)){ amt=p.ask.annual; pur={k:'fa',pid:p.id}; f(.05,'FA 철이니 지금 아니면 못 잡겠지.'); { const h=homeTie(p,G.user); if(h)f(h.vet?.08:.05,`${h.sch} 나온 고향 선수라, 지역 팬들한테 명분은 서겠소.`); } }
    else { amt=amt||1000; block=G.fa&&G.fa.open&&!G.fa.closed?'데려올 수 있는 FA를 골라야 요청할 수 있습니다(외부 FA 영입 한도를 채웠으면 원 소속 FA만).':'FA 영입 자금은 FA 시장이 열려 있을 때만 요청할 수 있습니다.'; } } /* 대상 없는 FA 자금은 조건 없이 끝나 버린다(검수 11-09zzd) */
  if(k==='frep'){ const p=pid!=null?G.players[pid]:null; if(!inS||G.day>foreignDL())block='외국인 교체 자금은 시즌 중 외국인 등록 마감 전에만 요청할 수 있습니다.'; else if(!p||!ownWhyBadF().includes(p))block='교체할 만큼 부진한 외국인 선수가 없습니다.'; else { amt=frepAmtOf(p); pur={k:'frep',pid:p.id}; f(G.day>KD(7,1)?-.08:.04,G.day>KD(7,1)?'시즌 후반에 바꿔서 얼마나 달라지겠소.':'일찍 바꾸면 남은 시즌이 기니 해 볼 만하오.'); } }
  if(k==='push'){ if(inS&&G.day>tradeDL())block='트레이드 마감이 지나 지금은 보강할 방법이 없습니다.'; else { pur={k:'boost'}; until=inS?tradeDL():G.day+60;
      if(inS){ if(rk<=3)f(.25,`지금 ${rk}위요. 이럴 때 밀어줘야지.`); else if(rk<=5)f(.06,`${rk}위면 가을야구는 보이지만 우승은 아직 멀었소.`); else if(rk>=7)f(-.28,`${rk}위에서 우승 보강이라니, 꿈이 크시군.`); }
      else { if(lastRk<=3)f(.12,`지난해 ${lastRk}위였으니 한 번 더 노려 볼 만하오.`); else if(lastRk>=7)f(-.2,`지난해 ${lastRk}위 팀이 우승 보강이라니 순서가 틀렸소.`); }
      if(ow==='win')f(.08,'우승이라면 내가 마다할 리 있소.'); if(ow==='profit')f(-.06,'우승도 좋지만 돈은 돌아와야 하오.'); } }
  if(k==='fac'){ if(!inS)f(.06,'공사는 비시즌에 하는 게 맞소.'); else f(-.04,'시즌 한복판에 공사판을 벌이자는 거요?'); if(tr>=60)f(.06,'그동안 맡긴 일은 해냈으니 믿어 보겠소.'); if((t.cash||0)<0)f(-.12,'통장이 마이너스인데 시설부터 짓자는 거요?'); if(ow==='pr')f(.05,'팬들이 좋아할 시설이면 환영이오.'); if(ow==='profit')f(-.06,'시설은 돈 먹는 하마요.'); }
  if(k==='dev'){ if(t.mode==='rebuild'||rk>=7||lastRk>=7)f(.12,'멀리 보는 건 좋소. 이번엔 씨앗에 투자합시다.'); else if(ow==='win'&&rk<=3)f(-.06,'우승 경쟁 중에 2군 걱정이오?'); if(ow==='profit')f(.06,'적은 돈으로 오래 쓸 선수를 만든다니 마음에 드오.'); f(.04,'액수가 크지 않으니 부담은 덜하오.'); }
  if(k==='deficit'){ const hole=(t.cash||0)<0||room<0; if(!hole)f(-.7,'적자도 아닌데 무슨 메울 구멍이 있다는 거요.'); /* 메울 적자가 없으면 사실상 반려(구단주 대사와 결과가 어긋나지 않게) */ else if(tr<40)f(-.3,'구멍을 낸 사람에게 또 돈을 맡기라는 거요?'); else if(tr>=65)f(.06,'살림 사정은 아오. 이번엔 막아 주겠소.'); if(ow==='profit')f(-.12,'적자는 메우는 게 아니라 안 내는 거요.'); if(ow==='pr')f(.04,'팬들 앞에서 구단이 휘청이는 건 보기 싫소.'); }
  /* 지난 1년 지원금의 결과: 목적을 지킨 돈은 믿음, 못 지킨 돈은 의심 */
  const past=grants().filter(g=>g.by==='gm'&&g.ok&&g.pur&&(g.tid==null||g.tid===G.user)&&g.d>G.day-365); const nf=past.filter(g=>g.st==='fail').length, nd=past.filter(g=>g.st==='done').length;
  if(nf)f(-Math.min(.3,nf*.12),`지난번 받아 간 돈은 목적대로 못 썼잖소(${nf}건).`); else if(nd)f(Math.min(.15,nd*.05),`지난번 돈은 제대로 썼더군(${nd}건).`);
  const base=ownOdds(amt,pur&&pur.k!=='boost'?pur:null); const p=clamp(base+sum(F.map(x=>x[0])),.03,.92);
  if(tr>=65)F.push([0,'단장을 믿는 편이오.']); else if(tr<35)F.push([0,'요즘 단장 하는 일이 영 미덥지 않소.']);
  const pos=F.filter(x=>x[0]>=0).sort((a,b)=>b[0]-a[0])[0], neg=F.filter(x=>x[0]<0).sort((a,b)=>a[0]-b[0])[0];
  const ok0=ow==='win'?'좋소. 대신 결과로 보여 주시오.':ow==='profit'?'...이번만이오. 쓴 만큼 벌어 오시오.':'알겠소. 팬들을 실망시키지 마시오.', no0=ow==='profit'?'지금 적자부터 줄이시오.':ow==='win'?'성적으로 먼저 증명하시오.':'지금은 때가 아니오.';
  const name=pur&&pur.pid!=null?G.players[pur.pid]?.name:''; const my=`${mySay('ask')||'회장님, 요청드릴 것이 있습니다.'} ${k==='fa'?`FA ${name||'영입'}에 ${money(amt)}이(가) 필요합니다.`:k==='frep'?`외국인 ${name}을(를) 바꾸려면 ${money(amt)}이(가) 필요합니다.`:`${W.l}에 ${money(amt)}을(를) 부탁드립니다.`}`;
  return {k,amt,pur,until,p,base,f:F,block,my,lineOk:(pos&&pos[0]>0?pos[1]+' ':'')+ok0,lineNo:(neg?neg[1]+' ':'')+no0}; }
function frepAmtOf(p){ return round5(Math.max(500,p.sal*.6)); }
/* 사유 요청 실행 */
function ownerAskWhy(k,amt,pid){ const w=ownWhy(k,amt,pid); if(!w)return {msg:'사유를 고르세요.'}; if(w.block)return {msg:w.block,w}; const r=ownerAsk(w.amt,w.pur,w); return {msg:r,w,ok:/^승인/.test(r),said:w.said}; }
/* 겨울(결산 뒤)에 받은 지원금은 다음 시즌 몫이다. FA 자금 기한은 FA 시장이 닫히는 1월 24일 */
function grantFaEnd(){ return dnum(G.year+(dobj(G.day).m>=10?1:0),1,24); }
function grantApply(amt){ const t=team(G.user); const sy=sponSeason(); const cap0=supportCap(t); t.grant=(t.grant&&t.grant.y===sy?t.grant.amt:0)+amt; t.grant={y:sy,amt:t.grant}; const g=G.goals; if(g&&g.y===sy){ const cap1=supportCap(t); g.sup=clamp((g.sup*cap0+amt)/Math.max(1,cap1),0,1.5); } } /* 지원 목표(비율×한도)가 정확히 받은 금액만큼 늘게: 한도도 함께 늘어나므로 비율은 새 한도로 다시 계산한다 */
/* 목적이 있는 지원금: 지켰는지 */
function grantCheck(){ const t=team(G.user); for(const g of grants()){ if(g.st!=='open'||!g.pur)continue; let ok=false, fail=false;
    if(g.pur.k==='fa'){ const tid=g.tid??G.user; const M=(G.moves||[]).filter(m=>m.t==='FA'&&m.pid===g.pur.pid&&m.d>=g.d); ok=M.some(m=>m.to===tid&&m.d<=g.until); fail=!ok&&(M.some(m=>m.to!==tid)||G.fa&&G.fa.closed||G.day>g.until); } /* FA 계약 기록으로 판정: 점검 날 소속(뒤이은 트레이드)이 아니라 실제 FA 계약 상대(검수 11-09zzd) */
    else if(g.pur.k==='frep'){ const s=fRepState(g.pur.pid,g.an,g.d,g.until); ok=s.ok; fail=!ok&&G.day>g.until; } /* 내보내고 새로 데려와야 교체(감독 요청과 같은 판정) */
    else if(g.pur.k==='boost'){ const fit=(o,q)=>o&&o.tid===G.user&&(o.k==='트레이드'||o.k==='외국인')&&!o.tmp&&!(q&&q.ftmp)&&(o.n!=null?o.n>(g.an||0):o.d>g.d)&&(g.until==null||o.d<=g.until); ok=(G.mineL||[]).some(x=>fit(x.o,G.players[x.id]))||Object.values(G.players).some(p=>p.team===G.user&&fit(p.acq,p)); /* 영입 기록으로 판정(점검 날 로스터에 남았는지와 무관), 부상 대체 임시 계약은 보강이 아니다(검수 11-08) */ /* 구단주가 요구한 대로: 마감 전 트레이드·외국인 교체만 */ /* 자금을 받은 뒤 실제로 데려온 선수(트레이드·FA·외국인·무적 영입 등)가 있어야 한다 */ fail=!ok&&G.day>g.until; }
    if(ok){ g.st='done'; t.trust=clamp(t.trust+(g.by==='own'?4:2),0,100); note('구단주',`구단주가 지원한 돈이 목적대로 쓰였습니다. 구단주 신뢰 상승.`); }
    else if(fail){ g.st='fail'; t.trust=clamp(t.trust-(g.by==='own'?4:3),0,100); mail('구단주실','구단주: "지원한 목적이 이뤄지지 않았습니다"',`기한까지 지원 목적(${g.pur.k==='fa'?'FA 영입':g.pur.k==='frep'?'외국인 교체':'전력 보강'})을 이루지 못했습니다. 돈을 다른 데 쓴 것으로 보지는 않고, 약속한 보강이 없었던 점을 문제 삼습니다. 구단주 신뢰 하락.`,{kind:'구단주',imp:true}); } } }
/* 구단주가 먼저: FA 기간 스타 영입 주문, 7월 우승 보강 자금 */
function ownerPush(){ const t=team(G.user); if(t.indie||G.gameOver||G.unemp)return; const B=bossOf(G.user); const o=dobj(G.day); const mk=o.y*100+o.m; { const faOn=G.fa&&G.fa.open&&!G.fa.closed; if(grants().some(g=>g.by==='own'&&(g.tid==null||g.tid===G.user)&&(faOn?g.kind==='fa'&&g.until===grantFaEnd():g.kind==='boost'&&g.y===G.year)))return; } /* FA 주문은 그 FA 시장(마감일)마다 한 번, 보강 자금은 그 구단에서 한 해 한 번(검수 11-08: 새해에 같은 주문 반복·이직 뒤 막힘) */
  if(G.fa&&G.fa.open&&!G.fa.closed&&t.trust>=35&&(t.owner==='pr'||t.owner==='win')&&R()<.5){ /* 데려올 수 있는 선수만: 외부 FA 영입 한도(2~3명)를 다 채웠으면 원 소속(우리) FA만 남는다 */ const room=faOutN(G.user)<faCapN(); const ci=capInfo(G.user), capRoom=ci.cap-ci.pay; const d=depth(G.user); const need=p=>{ const o=ovr(p)-3; if(!p.isP){ const c=d.ln&&d.ln[p.pos]; return !c||ovr(c)<o; } const L=isSPr(p)?d.sp:d.pen; return !L||!L.length||Math.min(...L.map(ovr))<o; };
    const star=G.fa.pool.map(id=>G.players[id]).filter(p=>p&&p.team==null&&p.ask&&ovr(p)>=60&&(room||p.faFrom===G.user)&&p.ask.annual<=capRoom&&need(p)).sort((a,b)=>ovr(b)-ovr(a))[0]; if(!star)return; /* 샐러리캡 여유 안에서, 지금 주전보다 확실히 나은 포지션만 주문한다(커뮤니티 피드백 11-08) */
    const amt=round5(star.ask.annual*(t.owner==='pr'?1:.8)); const g={y:sponSeason(),mk,d:G.day,amt,pur:{k:'fa',pid:star.id},ok:true,by:'own',kind:'fa',st:'open',until:grantFaEnd()}; grantAdd(g); grantApply(amt);
    mail('구단주실',`구단주 주문: "${star.name}을(를) 잡으세요"`,`${B.own.name} 회장이 직접 연락했습니다. "${t.owner==='pr'?'팬들이 원하는 스타가 필요합니다':'우승하려면 저런 선수가 있어야 합니다'}. ${star.name} 영입 자금으로 ${money(amt)}을(를) 더 내겠습니다." 영입하면 구단주 신뢰가 오르고, 놓치면 떨어집니다.`,{imp:true,kind:'구단주',ref:star.id,acts:[{l:`${star.name} 협상실`,a:'faOpen',v:star.id}]}); return; }
  if(period()==='season'&&G.day>=KD(7,1)&&G.day<=KD(7,10)&&t.owner==='win'&&t.trust>=40&&uRank()<=4&&R()<.6){ const amt=1500; const g={y:G.year,mk,d:G.day,amt,pur:{k:'boost'},ok:true,by:'own',kind:'boost',st:'open',until:tradeDL()}; grantAdd(g); grantApply(amt);
    mail('구단주실','구단주: "올해 우승을 노립시다"',`${B.own.name} 회장이 보강 자금 ${money(amt)}을(를) 내놨습니다. 7월 31일까지 트레이드나 외국인 교체로 전력을 보강하면 구단주 신뢰가 오르고, 아무것도 안 하면 떨어집니다.`,{imp:true,kind:'구단주',acts:[{l:'트레이드 센터',a:'go',v:'trade:market'}]}); } }

function uRank(){ try{ const i=standingsNow().findIndex(x=>x.tid===G.user); return i>=0?i+1:5; }catch(e){ return 5; } }

/* ===== 감독과의 공생: 선수 보는 눈 · 미는 선수 · 휴식/투수 관리 성향과 단장 지시 ===== */
function mgrAttr(m){ if(!m)return m; const k=m.id||'x'; if(m.rest==null)m.rest=Math.round(clamp(30+u01('mrest',k)*55+(m.youth-50)*.25,20,90)); if(m.arm==null)m.arm=Math.round(clamp(25+u01('marm',k)*60-(m.pen-50)*.2,20,90)); if(m.dfn==null)m.dfn=Math.round(clamp(22+u01('mdfn',k)*62+((m.small??50)-50)*.2,20,90)); if(m.eye==null)m.eye=Math.round(clamp(m.tac*.45+(m.youth||50)*.2+m.fame*.15+u01('meye',k)*25,25,90)); return m; }
function mgrDir(){ return G.mgrDir=G.mgrDir||{}; }
/* 단장 지시가 반영된 실제 성향 */
function mgrRestEff(m){ mgrAttr(m); const d=mgrDir(); return d.rest&&d.rest.ok&&m.id===d.rest.mid?Math.max(m.rest,70):m.rest; }
/* 우리 구단에 '투수 혹사 금지' 지시가 걸려 있나(지금 감독이 받아들인 지시) */
function armOkM(m){ const d=mgrDir(); return !!(m&&!m.interim&&d.arm&&d.arm.ok&&d.arm.mid===m.id); }
function armDirOn(tid){ return armOkM(G.mgr&&G.mgr[tid]); } /* 지시를 받아들인 그 감독이면 이직한 전 구단에서도 투구 수 제한과 성향 보정을 함께(검수 11-09m) */
function mgrArmEff(m){ mgrAttr(m); return armOkM(m)?Math.min(m.arm,35):m.arm; }
/* 거절된 지시는 관계가 5 이상 오르거나 30일이 지나야 다시 꺼낼 수 있다(같은 날 다시 눌러 관계만 깎이지 않게) */
function mgrDirWait(k){ const m=G.mgr[G.user]; const x=mgrDir()[k]; if(!m||!x||x.ok||x.mid!==m.id)return null; const dd=x.day+30-G.day, need=(x.rel0??m.rel)+5; if(dd<=0||m.rel>=need)return null; return `관계 개선 후 재논의(관계 ${need} 이상 또는 ${dmd(x.day+30)}부터)`; }
function setMgrDir(k,on){ const m=G.mgr[G.user]; if(!m||m.interim)return '감독이 없습니다.'; mgrAttr(m); mgrFix(m); const d=mgrDir(); G._push=null; /* 그날 캐시된 투수 운용 값을 버린다(검수 11-09m) */
  if(on){ const w=mgrDirWait(k); if(w)return `${m.name} 감독이 얼마 전 거절한 지시입니다. ${w}.`; }
  if(!on){ delete d[k]; return k==='arm'?'투수 관리 지시를 풀었습니다. 감독 본래 성향대로 운영합니다.':'휴식 보장 지시를 풀었습니다.'; }
  if(!G.dirFr||G.dirFr.y!==G.year||G.dirFr.mid!==m.id)G.dirFr={y:G.year,mid:m.id}; /* 충돌 횟수는 감독마다 센다 */ const fr=G.dirFr[k]||0; /* 같은 해 같은 사안으로 거절당한 횟수: 많을수록 감독이 더 굳어진다(이 사안 수용도) */
  const gap=k==='arm'?Math.max(0,m.arm-35)/55:Math.max(0,70-m.rest)/50; const s=1-gap*.45-(m.ego-50)/70+(m.rel-60)/80-fr*.08; const ok=R()<clamp(s,.15,.97);
  d[k]={ok,mid:m.id,day:G.day}; if(ok){ m.rel=clamp(m.rel-(gap>.5?2:0),0,100); return `${m.name} 감독: "알겠습니다. ${k==='arm'?'투수들 무리시키지 않겠습니다':'주전도 쉬게 하면서 가겠습니다'}."${gap>.5?' (본래 성향과 달라 관계 조금 악화)':''}${k==='arm'?' 선발은 95구 이내 교체가 목표입니다. 교체 가능한 건강한 등록 투수가 모두 소진되면 부상자를 강제 투입하지 않고 비상 계속 투구하며, 경기 기록에 예외를 남깁니다.':''}`; }
  G.dirFr[k]=fr+1; const rep=fr>=1; if(rep)m.rel=clamp(m.rel-3,0,100); d[k].rel0=m.rel;
  return `${m.name} 감독: "${k==='arm'?'이길 수 있는 경기는 잡아야 합니다. 투수 운용은 제게 맡겨 주십시오':'주전은 뛰어야 주전입니다'}." 지시를 따르지 않습니다. ${rep?`올해 같은 문제로 ${fr+1}번째 부딪혀 감독 관계 악화(선수단 분위기에도 영향).`:'이 문제는 더 협의가 필요합니다. 첫 의견 충돌이라 관계는 그대로이고, 같은 해 다시 부딪히면 관계가 떨어집니다.'}`; }
/* 감독의 눈: 잠재력 예측. 안목이 좋을수록 실제와 가깝다 */
function mgrView(p){ const m=G.mgr[G.user]; if(!m||m.interim||!p||p.team!==G.user)return null; mgrAttr(m); if(m.rel<30)return {mute:true};
  const sd=Math.max(1.5,9.5-m.eye/10); const fut=clamp(Math.round(p.pot+hn('meye'+m.id+':'+G.year,p.id)*sd),20,80); const cur=Math.round(ovr(p));
  const line=fut-cur>=8?(fut>=62?'2~3년 안에 팀의 기둥이 됩니다':'꾸준히 쓰면 1군 주전감입니다'):fut-cur>=3?'조금 더 올라옵니다':p.age>=31?'내려가는 길입니다. 길게 보지 않는 게 좋습니다':'지금이 거의 다 큰 모습입니다';
  return {fut,line,sd,eye:m.eye}; }
/* 감독이 미는 선수: 시즌마다 1~2명. 단장이 함께 밀어주면 성장이 빨라진다 */
function mpickPlan(){ try{ aiMpickPlan(); }catch(e){} try{ aiMentorPick(); }catch(e){} /* 다른 구단 감독도 미는 선수를 정하고, 단장이 받아 준다(99_ai_parity) */ const m=G.mgr[G.user]; if(!m||m.interim)return; mgrAttr(m); const P=G.mpick; if(P&&P.y===G.year&&P.mid===m.id)return;
  const last=P&&P.y===G.year-1&&P.mid===m.id?new Set(P.ids||[]):new Set(); /* 작년에 민 선수는 빼고(플레이 테스트 11-13: 해마다 같은 선수·같은 문장) */
  const cands=domestic(G.user).filter(p=>p.age<=26&&!p.ys&&!(p.joinY>G.year)&&!last.has(p.id)).map(p=>({p,v:mgrView(p)})).filter(x=>x.v&&!x.v.mute&&x.v.fut-ovr(x.p)>=5).sort((a,b)=>(b.v.fut-ovr(b.p)*.3)-(a.v.fut-ovr(a.p)*.3)).slice(0,2);
  G.mpick={y:G.year,mid:m.id,ids:cands.map(x=>x.p.id),back:null,day:G.day}; if(!cands.length)return;
  evNew('mpick',`${m.name} 감독이 미는 선수`,`"${cands.map(x=>`${x.p.name}(${posLabel(x.p)}, ${x.p.age}세)`).join(', ')}. 제가 보기엔 ${cands[0].v.line.replace(/[.]$/,'')}. 올해 출전 기회와 훈련을 몰아주고 싶습니다." 감독의 선수 보는 눈(안목) ${dv(m.eye)}.`,
    [{l:'함께 밀어준다',fx:`올해 이 선수들의 성장이 눈에 띄게 빨라지고 기분이 오릅니다. 감독 관계 개선. 대신 같은 자리 경쟁자${(()=>{ const L=[]; for(const x of cands)for(const q of playersOf(G.user))if(q!==x.p&&!cands.some(c=>c.p===q)&&q.isP===x.p.isP&&pSlot(q)===pSlot(x.p)&&!q.ys&&!L.includes(q.name))L.push(q.name); return L.length?`(${L.slice(0,3).join('·')}${L.length>3?' 등':''})`:''; })()}는 출전 기회가 줄어 기분이 내려가고, 시즌 중 이 선수를 트레이드하면 감독이 크게 서운해합니다(-6).`},{l:'성적이 먼저다',fx:'변화 없음. 감독 관계 조금 악화.'}],{from:'감독실',ref:cands[0].p.id,data:{ids:cands.map(x=>x.p.id),mid:m.id},def:0,exp:7}); }
EVH.mpick={ pick(e,i){ const m=G.mgr[G.user]; if(!m)return ''; const P=G.mpick; if(m.interim||!P||P.mid!==m.id||(e.data.mid!==undefined?e.data.mid!==m.id:String(P.ids)!==String(e.data.ids)))return '제안한 감독이 팀을 떠나 이 제안은 끝났습니다. 아무것도 바꾸지 않았습니다.'; /* 전임 감독 제안(검수 11-09m) */ if(i===0){ G.mpick.back=true; m.rel=clamp(m.rel+4,0,100); for(const id of e.data.ids){ const p=G.players[id]; if(p)p.mor=clamp((p.mor??60)+5,0,100); } const hurt=[]; for(const id of e.data.ids){ const p=G.players[id]; if(!p)continue; for(const q of playersOf(G.user))if(q!==p&&!e.data.ids.includes(q.id)&&q.isP===p.isP&&pSlot(q)===pSlot(p)&&!q.ys){ q.mor=clamp((q.mor??60)-3,0,100); hurt.push(q.name); } } /* 같은 자리 경쟁자는 출전 기회가 줄어 기분이 내려간다 */ return '감독과 함께 밀어주기로 했습니다. 감독 관계 개선.'; } G.mpick.back=false; m.rel=clamp(m.rel-2,0,100); return '감독 관계 조금 악화.'; } };
function mpickMult(p){ if(p.team!=null&&(p.team!==G.user||G.unemp))return aiMpickMult(p); const P=G.mpick; const m=G.mgr[G.user]; return P&&P.back&&P.y===G.year&&P.ids.includes(p.id)&&p.team===G.user&&m&&!m.interim&&(P.mid==null||P.mid===m.id)?1.3:1; } /* 그 감독이 밀던 선수: 감독이 바뀌거나 대행 체제면 끝 */
/* 감독 안목 성적표: 예측과 실제 성장 비교 (시즌 끝에) */
function mgrEyeReport(){ const m=G.mgr[G.user]; const P=G.mpick; if(!m||!P||P.y!==G.year||!P.ids.length)return; const L=P.ids.map(id=>G.players[id]).filter(Boolean); if(!L.length)return;
  const txt=L.map(p=>{ const h=(p.oh||[]).slice(-2); const d=h.length===2?h[1].o-h[0].o:0; return `${p.name} ${d>=0?'+':''}${d}`; }).join(', '); (G.mpickLog=G.mpickLog||[]).unshift({y:G.year,mid:m.id,txt,back:P.back}); if(G.mpickLog.length>10)G.mpickLog.length=10; }
/* 관계가 주는 것: 선수단 분위기(경기력), 좋으면 공개 지지, 나쁘면 언론 불화설·사퇴 */
function mgrRelBoost(p){ if(p.team==null)return 0; const m=G.mgr[p.team]; if(!m||m.interim)return 0; const rel=p.team===G.user?m.rel:65; /* AI 구단은 프런트·감독이 무난한 관계(65)로 본다: 우리만 받던 보정의 비대칭(검수 11-05) */ return clamp((rel-55)/60,-.5,.4); }
function mgrRelWeek(){ const m=G.mgr[G.user]; if(!m||m.interim||period()!=='season')return; mgrFix(m); prInit();
  if(m.rel>=78&&R()<.08){ news('언론',`${m.name} 감독 "단장님과 호흡 최고"`,'프런트와 현장이 한 방향을 보고 있다는 평가입니다.',2); G.pr.press=clamp(G.pr.press+1,0,100); }
  if(m.rel<=25&&R()<.15){ news('언론',`${tshort(G.user)} 감독-단장 불화설`,`${m.name} 감독이 프런트 결정에 불만을 드러냈습니다.`,-2); G.pr.fan=clamp(G.pr.fan-1,0,100); G.pr.press=clamp(G.pr.press-2,0,100);
    if(m.ego>=65&&m.rel<=15&&R()<.3){ const nm=m.name; resignMgr(); mail('감독실',`${nm} 감독 자진 사퇴`,`${nm} 감독이 "더는 함께하기 어렵다"며 물러났습니다. 수석코치가 감독대행을 맡습니다. 새 감독을 선임하세요.`,{imp:true,kind:'감독',acts:[{l:'감독 후보',a:'go',v:'staff:mgr'}]}); } } }
/* ===== 스타 파워: 수상·기록·활약이 마케팅 수입이 된다 ===== */
function starPower(p){ let s=0; for(const a of (p.aw||[])){ const y=+String(a).slice(0,4); const age=G.year-y; if(age>2||isNaN(y))continue; const w=age===0?1:age===1?.7:.4;
    s+=(a.includes('대표팀 영웅')?22:a.includes('MVP')?40:a.includes('신인왕')?20:a.includes('골든')?15:5)*w; }
  const f=(G.feats||[]).filter(x=>x.pid===p.id&&x.maj&&x.y>=G.year-1).length; s+=f*8; const h=seasonTotal(p,G.year,'1군'); if(h){ const w=warOf(h,p); if(w>=4)s+=(w-3)*5; } if(p.hype&&p.hype.until>=G.day)s+=p.hype.v||0; /* 언론 플레이로 띄운 선수 */ if(p.foreign)s*=.6; return Math.round(s); }
function teamStar(tid){ const L=playersOf(tid??G.user).map(p=>({p,s:starPower(p)})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s).slice(0,3); return {v:sum(L.map(x=>x.s)),L}; }

/* ===== FA 영입 설득: 꼭 잡아야 하는 FA를 위해 구단주에게 근거를 들고 가서 자금을 받아 온다 =====
   샐러리캡(경쟁균형세 상한) 안에서만 요청할 수 있다. 근거는 실제 데이터로 힘이 정해지고, 구단주 성향마다 귀에 들어오는 근거가 다르다.
   목표를 약속하면 승인 가능성이 오르지만, 그 약속은 다음 시즌 구단주 목표에 그대로 들어간다 */
const PITCH_ARG={
  win:{l:'전력 보강',d:'이 자리가 약점이고, 이 선수가 오면 순위가 오른다'},
  star:{l:'흥행·마케팅',d:'스타가 오면 관중·광고·상품 수입이 오른다'},
  value:{l:'계약 가치',d:'나이와 기량을 보면 이 금액이 오히려 싸다'},
  keep:{l:'우리 선수 지키기',d:'떠나면 전력과 팬심을 함께 잃는다'}};
const PITCH_W={win:{win:1,star:.45,value:.35,keep:.6},profit:{win:.35,star:.55,value:1,keep:.45},pr:{win:.5,star:1,value:.3,keep:.9}};
const PITCH_CMT={rank:{l:'시즌 목표 순위 한 계단 상향',v:1},fan:{l:'팬 여론 목표 +5',v:5},sup:{l:'모기업 적자 보전 목표 5%p 축소',v:.05}};
function pitchInfo(pid){ const p=G.players[pid]; const t=team(G.user); if(!p||!p.ask)return null; const amt=p.ask.annual;
  const capRoom=capOf(G.year)-capPay(G.user); const capOK=amt<=capRoom; let room=0; try{ room=budget().roomGoal; }catch(e){}
  const k=pSlot(p); const sr=slotRanks(G.user)[k]; const cur=k==='SP'||k==='RP'?null:depth(G.user).ln[k]; const gap=cur?ovr(p)-ovr(cur):ovr(p)-50;
  const own=p.faFrom===G.user; const S={
    win:clamp((sr.rank-2)/7,0,1)*clamp((gap+2)/9,0,1)*(uRank()<=7?1:.7),
    star:clamp((ovr(p)-53)/10,0,1)+(p.aw&&p.aw.length?.15:0)+(p.fr?.1:0),
    value:clamp((31-p.age)/6,0,1)*clamp(1.15-amt/Math.max(1,faWorth(t,p)),0,1)+(p.age<=28?.15:0),
    keep:own?(p.fr?1:.6):0};
  for(const x in S)S[x]=Math.round(clamp(S[x],0,1)*100)/100;
  const w=PITCH_W[t.owner]||PITCH_W.win; return {p,amt,capOK,capRoom,room,need:Math.max(0,amt-room),S,w,own,done:(G.pitched||{})[pid]===G.year,slot:SLOTK[k]||posLabel(p),rank:sr.rank,gap}; }
function pitchOdds(pid,args,cmts){ const I=pitchInfo(pid); if(!I)return 0; const t=team(G.user); let o=ownOdds(I.amt,{k:'fa',pid});
  for(const a of (args||[]).slice(0,2))o+=.22*(I.w[a]||0)*(I.S[a]||0);
  for(const c of (cmts||[]))o+=c==='rank'?(t.owner==='win'?.12:.06):c==='fan'?(t.owner==='pr'?.1:.04):c==='sup'?(t.owner==='profit'?.12:.05):0;
  return clamp(o,.03,.95); }
function ownerPitch(pid,args,cmts){ const I=pitchInfo(pid); const t=team(G.user); const B=bossOf(G.user); if(!I)return '대상 선수가 없습니다.';
  if(t.indie)return '독립구단이라 모기업 지원이 없습니다.'; if(!I.capOK)return `샐러리캡 안에서만 요청할 수 있습니다. 남은 캡 ${money(I.capRoom)}, 필요 ${money(I.amt)}.`;
  if(I.done)return '이 선수 건은 올해 이미 구단주에게 보고했습니다.'; if(!ownAskLeft())return '이번 달에는 이미 구단주에게 요청했습니다.';
  args=(args||[]).filter(a=>PITCH_ARG[a]).slice(0,2); cmts=(cmts||[]).filter(c=>PITCH_CMT[c]); if(!args.length)return '설득할 근거를 하나 이상 고르세요.';
  const pr=pitchOdds(pid,args,cmts); const ok=R()<pr; (G.pitched=G.pitched||{})[pid]=G.year; const o=dobj(G.day);
  const best=[...args].sort((a,b)=>I.w[b]*I.S[b]-I.w[a]*I.S[a])[0]; const weak=args.filter(a=>I.S[a]<.35);
  const g={y:G.year,mk:o.y*100+o.m,d:G.day,amt:I.amt,pur:{k:'fa',pid},ok,by:'gm',st:ok?'open':'no',until:grantFaEnd(),pitch:{args,cmts}}; grantAdd(g); if(G.grants.length>40)G.grants.length=40;
  if(ok){ grantApply(I.amt); const ny=G.year+(period()==='off'||period()==='post'?1:0); for(const c of cmts)(G.pitchCommit=G.pitchCommit||[]).push({y:ny,k:c,v:PITCH_CMT[c].v,l:PITCH_CMT[c].l});
    mail('구단주실',`구단주 승인: FA ${I.p.name} 영입 자금 ${money(I.amt)}`,`${B.own.name} 회장: "${PITCH_ARG[best].l} 이야기가 설득력 있었습니다. ${I.p.name}을(를) 꼭 잡으세요."\n\n올해 모기업 지원 한도가 ${money(I.amt)} 늘었습니다.${cmts.length?`\n약속한 목표: ${cmts.map(c=>PITCH_CMT[c].l).join(', ')}. 다음 시즌 구단주 목표에 들어갑니다.`:''}\n영입하지 못하면 구단주 신뢰가 깎입니다.`,{kind:'구단주',imp:true,acts:[{l:'FA 시장',a:'go',v:'transfer:fa'}]});
    return `승인: ${money(I.amt)}을(를) 받았습니다.`; }
  t.trust=clamp(t.trust-1,0,100);
  const why=weak.length?`${weak.map(a=>PITCH_ARG[a].l).join(', ')} 근거가 약합니다.`:t.owner==='profit'?'숫자로 보면 아직 확신이 안 섭니다.':t.owner==='win'?'그 돈이면 다른 데 쓰는 게 낫겠습니다.':'지금은 때가 아닙니다.';
  mail('구단주실',`구단주 반려: FA ${I.p.name} 영입 자금`,`${B.own.name} 회장: "${why}" 구단주 신뢰 조금 하락.`,{kind:'구단주'});
  return `반려: ${why}`; }
