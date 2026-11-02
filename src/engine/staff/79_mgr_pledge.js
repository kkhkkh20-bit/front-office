/* ===== 감독 영입 면담: 들어올 때 약속을 받아 둔다 =====
 단장은 감독에게 건의할 수 있을 뿐 기용 권한은 없다. 그래서 영입할 때 면담으로 몇 가지를 약속받고 들어오게 할 수 있다.
 후보마다 받아들이는 정도가 다르다: 그대로 수용 / 연봉을 10% 더 주면 수용 / 거절(고집이 세고 자기 방식과 맞지 않으면).
 약속은 그 감독의 계약 기간 동안 유지된다. 지키지 않는 감독은 단장이 경질할 수 있다(기존 경질). */
const MPL={listen:{l:'단장 건의 존중',d:'콜업·보직·포지션 전환 같은 단장 건의를 거의 받아들입니다.'},
  youth:{l:'유망주 기회 보장',d:'2군에서 잘하는 24세 이하 선수를 1군에 더 빨리 올리고, 특정 유망주 기회 합의도 잘 받아들입니다.'},
  arm:{l:'투수 혹사 금지',d:'투수를 무리하게 쓰지 않습니다.'},
  rest:{l:'주전 휴식 보장',d:'주전도 쉬게 하면서 시즌을 치릅니다.'}};
function mplStance(m,k){ mgrAttr(m); mgrFix(m); const e=m.ego;
  const v=k==='listen'?e:k==='youth'?e-((m.youth??50)-50)*.6:k==='arm'?e+((m.arm??50)-50)*.6:e+(50-(m.rest??50))*.6;
  return v<55?'ok':v<78?'pay':'no'; }
const MPL_ST={ok:'수용',pay:'연봉 10% 더 주면 수용',no:'거절'};
function mplOn(k){ const m=G.mgr&&G.mgr[G.user]; return !!(m&&!m.interim&&m.pl&&m.pl[k]); }
function mplApply(m,ks){ ks=(ks||[]).filter(k=>MPL[k]); if(!ks.length)return ''; const bad=ks.filter(k=>mplStance(m,k)==='no'); if(bad.length)return `${m.name} 감독은 '${bad.map(k=>MPL[k].l).join("', '")}' 약속을 받아들이지 않습니다.`;
  const pay=ks.filter(k=>mplStance(m,k)==='pay').length; if(pay)m.sal=round5(m.sal*(1+.1*pay)); m.pl={}; for(const k of ks)m.pl[k]=true;
  const d=mgrDir(); for(const k of ks)if(k==='arm'||k==='rest')d[k]={ok:true,mid:m.id,day:G.day}; return ''; }
/* 1군에 올려 달라는 2군 선수: 2군에서 잘 치거나 잘 던지고, 1군 같은 자리와 비교해 해볼 만하며, 욕심이 있거나 나이가 찬 선수 */
function callWish(p,rk){ if(!entryOn()||p.team!==G.user||p.e1||p.ys||!healthy(p)||p.foreign||(p.joinY>G.year))return null; if(p.isP&&rpPlanOf(G.user,p)==='sp2')return null;
  const h=seasonTotal(p,G.year,'퓨처스'); if(!h)return null; initPers(p);
  const good=p.isP?(h.outs>=45&&pRate(h).era<=3.3):(h.pa>=50&&bRate(h).ops>=.82); if(!good)return null;
  if(!(p.pers.amb>=11||p.age>=26))return null; let gap=0; try{ rk=rk||slotRanks(G.user); const sl=rk[pSlot(p)]; const worst=sl&&sl.ps&&sl.ps.length?Math.min(...sl.ps.map(q=>ovr(q))):0; gap=ovr(p)-worst; }catch(e){} if(gap<-4)return null;
  return {t:p.isP?`2군 ERA ${pRate(h).era.toFixed(2)}, ${ipStr(h.outs)}이닝`:`2군 OPS ${fmt3(bRate(h).ops)}, ${h.pa}타석`,gap}; }
/* 매주: 올려 달라고 했는데 3주 넘게 2군이면 기분이 조금씩 떨어진다 */
function callWishWeek(){ if(period()!=='season'||G.unemp)return; let rk=null; try{ rk=slotRanks(G.user); }catch(e){} for(const p of playersOf(G.user)){ const w=callWish(p,rk); if(w){ p.wishW=(p.wishW||0)+1; if(p.wishW===1)note('선수',`${p.name}(${posLabel(p)})이(가) 1군에 올려 달라고 합니다. ${w.t}. 선수단 > 2군에서 감독에게 콜업을 건의할 수 있습니다.`); if(p.wishW>3){ initPers(p); p.mor=clamp(p.mor-.6,0,100); } } else if(p.wishW)p.wishW=0; } }
/* ===== 약속 위반: 성적이 급하면 감독도 약속을 어긴다 =====
 압박: 30경기 이상 치르고 승률 .420 미만이거나, 최근 10경기 3승 이하.
 - 단장 건의 존중: 압박 중이면 건의를 35% 확률로 거절한다.
 - 유망주 기회 보장: 압박 중인데 올려 달라는 24세 이하 선수를 4주 넘게 2군에 두면 위반.
 - 투수 혹사 금지·주전 휴식 보장: 압박 중이면 달마다 30% 확률로 그달은 본래 성향대로 운영한다(다음 달 압박이 풀리면 되돌린다).
 위반은 기록되고 단장에게 보고된다. 위반이 2번 이상이면 경질할 때 계약 위반 조항으로 잔여 연봉을 절반만 주고, 선수단도 동요하지 않는다. */
function mplPress(){ const t=G.sea&&G.sea.rec&&G.sea.rec[G.user]; if(!t||period()!=='season')return false; const n=t.w+t.l; if(n>=30&&t.w/Math.max(1,n)<.42)return true;
  const L=(G.sea.tl&&G.sea.tl[G.user]||[]).slice(-10); return L.length>=10&&L.filter(x=>x[0]>0).length<=3; }
function mplViol(k,t){ const m=G.mgr[G.user]; if(!m||m.interim)return; (m.plv=m.plv||[]).push({d:G.day,k,t}); if(m.plv.length>12)m.plv.shift();
  mail('운영팀',`${m.name} 감독 약속 위반: ${MPL[k].l}`,`${t}\n\n영입 면담에서 받은 '${MPL[k].l}' 약속과 다릅니다. 지금까지 위반 ${m.plv.length}회.${m.plv.length>=2?' 위반이 2회 이상이라 경질하면 계약 위반 조항으로 잔여 연봉을 절반만 지급하고, 선수단도 동요하지 않습니다.':''}`,{kind:'감독'}); }
/* 건의를 받을 때: 약속이 있어도 압박 중이면 가끔 거절 */
function mplBreakListen(what){ if(!mplOn('listen')||!mplPress()||R()>=.35)return null; const m=G.mgr[G.user]; mplViol('listen',`${m.name} 감독이 성적 압박을 이유로 ${what} 건의를 거절했습니다.`); return `${m.name} 감독: "약속은 압니다. 그런데 지금은 성적이 급합니다. 이번만큼은 제 판단대로 하겠습니다." (약속 위반으로 기록)`; }
function mplMonth(){ const m=G.mgr[G.user]; if(!m||m.interim||!m.pl||G.unemp||period()!=='season')return; const P=mplPress(); const d=mgrDir();
  for(const k of ['arm','rest']){ if(!m.pl[k])continue; const x=d[k];
    if(x&&x.brk&&!P){ x.ok=true; delete x.brk; note('감독',`${m.name} 감독이 다시 '${MPL[k].l}' 약속대로 운영합니다.`); }
    else if(P&&x&&x.ok&&R()<.3){ x.ok=false; x.brk=G.day; mplViol(k,`${m.name} 감독이 성적 압박 속에 이번 달은 ${k==='arm'?'투수를 본래 방식대로 몰아 쓰겠다':'주전을 쉬게 하지 않겠다'}고 합니다.`); } }
  if(m.pl.youth&&P){ const L=playersOf(G.user).filter(p=>p.age<=24&&(p.wishW||0)>=4&&!p.e1); if(L.length&&!(m.plvY===dobj(G.day).m)){ m.plvY=dobj(G.day).m; mplViol('youth',`${L.slice(0,3).map(p=>p.name).join(', ')}이(가) 2군에서 잘하며 올려 달라고 한 지 한 달이 넘었지만, ${m.name} 감독은 성적 압박 속에 경험 많은 선수를 씁니다.`); } } }
