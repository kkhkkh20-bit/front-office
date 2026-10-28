/* ===== 2군 연수 ===== */
const DEVP={bat:{l:'타격 집중',k:['con','eye'],P:false},pow:{l:'장타력 강화',k:['pow'],P:false},run:{l:'주루·수비',k:['spd','def'],P:false},stf:{l:'구위 강화',k:['stf'],P:true},ctl:{l:'제구 교정',k:['ctl'],P:true},sta:{l:'체력·선발 전환',k:['sta'],P:true}};
const OVS={jp:{l:'일본 교육리그',c:50,d:'가을 교육리그에서 실전 경험을 쌓습니다.',inj:.02},au:{l:'호주리그 파견',c:80,d:'겨울 동안 호주 프로리그에서 뜁니다. 실전이 많지만 부상 위험이 조금 있습니다.',inj:.06},us:{l:'미국 연수',c:120,d:'미국 훈련 시설에서 기술과 체계를 배웁니다.',inj:.01}};
function ovsOpen(){ const per=period(); return per==='off'||per==='post'||(per==='season'&&G.day>=KD(9,1)); }
function setDev(id,prog){ G.devProg=(G.devProg||[]).filter(x=>x.pid!==id); if(prog){ if(G.devProg.length>=6)return '2군 연수는 6명까지입니다.'; G.devProg.push({pid:id,prog,since:G.day}); } return ''; }
function setOvs(id,prog){ { const prev=(G.ovs||[]).find(x=>x.pid===id); if(prev&&OVS[prev.prog])G.spend.dev=Math.max(0,(G.spend.dev||0)-OVS[prev.prog].c); } /* 떠나기 전에 바꾸거나 취소하면 비용을 돌려받는다 */ G.ovs=(G.ovs||[]).filter(x=>x.pid!==id); if(prog){ if(G.ovs.length>=4)return '해외 연수는 4명까지입니다.'; G.ovs.push({pid:id,prog}); G.spend.dev+=OVS[prog].c; addLog(`${G.players[id].name}을(를) ${OVS[prog].l}에 보냅니다(비용 ${money(OVS[prog].c)}).`); } return ''; }
function devWeek(){
  G.devProg=(G.devProg||[]).filter(x=>{ const p=G.players[x.pid]; return p&&p.team===G.user; });
  const m=mgrOf(G.user); const yf=1+(m.youth-50)/120;
  for(const x of G.devProg){ const p=G.players[x.pid]; const pr=DEVP[x.prog]; devApply(p,pr.k,yf); }
  try{ aiDevWeek(); }catch(e){}
}
/* 2군 연수 한 주 효과. 해마다 쌓이는 양에 상한(능력치 합 +6)을 두고, 목표치도 잠재력+2까지로 묶는다(겨울마다 잠재력이 현재 능력까지 올라가 천장이 사라지는 것을 막는다) */
const DEV_YCAP=6;
function devApply(p,keys,yf){ if(!p||p.age>28)return; if(!p.dvY||p.dvY.y!==G.year)p.dvY={y:G.year,s:0}; if(p.dvY.s>=DEV_YCAP)return;
  const half=isRegular(p)?.5:1; const room=Math.max(0,p.pot-ovr(p));
  for(const k of keys){ const cap=Math.max(p.pot,ovr(p))+2; if(p.r[k]>=cap)continue; const add=rnd(.06,.16)*half*yf*(room>0?1:.35); p.r[k]=clamp(p.r[k]+add,20,80); p.dvY.s+=add; }
  roundR(p); }
/* AI 구단도 같은 2군 연수를 돌린다: 구단마다 24세 이하 중 더 클 여지가 큰 4~6명(리빌딩이면 6명), 가장 약한 툴 둘을 집중 훈련 */
function aiDevWeek(){ for(const t of G.teams){ if(t.id===ME())continue; const m=mgrOf(t.id); const yf=1+(((m&&m.youth)||50)-50)/120; const n=t.mode==='rebuild'?6:4;
    const ps=domestic(t.id).filter(p=>p.age<=24&&!(p.joinY>G.year)).sort((a,b)=>(b.pot-ovr(b))-(a.pot-ovr(a))).slice(0,n);
    for(const p of ps){ const keys=Object.keys(p.r).filter(k=>p.isP?['stf','ctl','sta'].includes(k):['con','pow','eye','spd','def'].includes(k)).sort((a,b)=>p.r[a]-p.r[b]).slice(0,2); devApply(p,keys,yf); } } }
function ovsApply(){
  const out=[];
  for(const x of (G.ovs||[])){ const p=G.players[x.pid]; if(!p||p.team!==G.user)continue; const o=OVS[x.prog]; const gap=Math.max(0,p.pot-ovr(p));
    const g=rnd(.6,1.6)*Math.min(1,gap/5+.35);
    for(const k in p.r)p.r[k]=clamp(p.r[k]+g*rnd(.6,1.3),20,80); roundR(p);
    let msg=`${p.name}이(가) ${o.l}을 마치고 돌아왔습니다.`; if(R()<o.inj){ p.injOut=ri(10,40); delete p.injK; msg+=` 연수 중 부상으로 약 ${p.injOut}일 재활이 필요합니다.`; } else msg+=' 코치진이 성장을 확인했습니다.';
    out.push(msg); }
  G.ovs=[]; if(out.length)mail('육성팀','해외 연수 결과',out.join('\n'),{kind:'연수'});
}

/* ===== 부상 방지와 병원 ===== */
const PREV=[{l:'없음',c:0,m:1},{l:'기본',c:500,m:.9},{l:'강화',c:1200,m:.8},{l:'최고 수준',c:2200,m:.7}];
const HOSP={none:{name:'제휴 없음',c:0,rec:0,dx:false,d:'부상 때마다 외부 병원을 이용합니다.'},c:{name:'다온재활병원',c:400,rec:.08,dx:false,d:'재활 위주. 재활 기간이 조금 줄어듭니다.'},b:{name:'청명정형외과',c:700,rec:.12,dx:false,d:'정형외과 전문. 재활 기간이 줄어듭니다.'},a:{name:'새봄스포츠의학센터',c:1500,rec:.25,dx:true,d:'종합 스포츠의학. 재활 기간이 크게 줄고, 정밀 검진으로 선수의 부상 체질을 알려 줍니다.'}};
/* 리그 전체 부상 빈도 보정: 1군·퓨처스를 합쳐 구단당 한 해 10~12건(그중 1군 이탈 7~10건)에 맞춘다. 부상 종류·체질 차이는 그대로 둔다 */
const INJ_RATE=.58;
function injMult(p){ return INJ_RATE*(p.team===G.user?(G.campInj||1)*PREV[G.med.prev].m*(1-facOf('weight')*.05):facAiInj(p.team))*(p.rush&&G.day<=p.rush?3:1)*(p.reInj&&p.reInj.left>0?p.reInj.m:1); }
function recMult(p){ return p.team===G.user?(1-HOSP[G.med.hosp].rec)*(1-facOf('rehab')*.07):facAiRec(p.team); }
function facWeek(){ const dl=facOf('dorm'); if(!dl||G.unemp)return; for(const p of domestic(G.user))if(p.age<=23&&(p.mor??60)<75)p.mor=clamp((p.mor??60)+dl*.3,0,75); }
function dailyCost(){ const m=G.mgr[G.user]; if(m)G.spend.mgr+=m.sal/365; if(G.coach)G.spend.coach=(G.spend.coach||0)+coachSal(G.user)/365; G.spend.med+=PREV[G.med.prev].c/365; G.spend.hosp+=HOSP[G.med.hosp].c/365; G.spend.intl=(G.spend.intl||0)+sum(Object.keys(IREG).map(r=>INET[intlLv(r)].c))/365; G.spend.fac=(G.spend.fac||0)+facUpkeep()/365; G.spend.data=(G.spend.data||0)+anaSal()/365;
  try{ facDaily(); }catch(e){} try{ aiFacDaily(); }catch(e){}
  if(G.fac&&G.fac.build&&G.day>=G.fac.build.done){ G.fac.lv=G.fac.build.lv; G.fac.build=null; mail('육성팀','훈련 시설 완공',`훈련 시설이 ${FAC[G.fac.lv].l}(${G.fac.lv}단계)로 완공되었습니다. 다음 겨울 성장부터 반영됩니다.`,{kind:'일반'}); } }

