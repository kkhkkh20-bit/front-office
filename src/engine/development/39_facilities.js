/* ===== 훈련 시설·구단 버스: 단계, 공사, 유지비, 성장·부상 효과 ===== */
const FAC=[null,{l:'낡은 시설',g:.88,d:1.1},{l:'기본 시설',g:.94,d:1.05},{l:'중급 시설',g:1,d:1},{l:'최신 시설',g:1.06,d:.95},{l:'최고 수준 시설',g:1.12,d:.9}];
const FAC_COST=[0,0,1200,2500,4500,7000], FAC_UPKEEP=[0,80,160,280,450,700], FAC_DAYS=[0,0,120,150,180,210];
const facLv=tid=>tid===G.user?((G.fac&&G.fac.lv)||2):(G.teams[tid].fac||3);
/* 세부 시설: 실제 구단 2군 훈련 단지·재활센터·트래킹 장비 투자를 항목별로 나눈다. 단계 0~3 */
const FACI={
  indoor:{l:'실내 연습장',lv:['없음','간이 실내 연습장','실내 연습장','실내 훈련동'],c:[0,1500,4000,8000],days:[0,120,180,240],up:[0,40,90,160],d:'비·한겨울에도 훈련합니다. 모든 선수의 성장이 조금씩 빨라집니다.'},
  weight:{l:'웨이트·컨디셔닝',lv:['없음','기본 웨이트장','컨디셔닝 센터','퍼포먼스 센터'],c:[0,600,1500,3000],days:[0,60,90,120],up:[0,30,60,110],d:'근력·유연성을 관리합니다. 부상이 줄고 30대 선수의 하락이 느려집니다.'},
  rehab:{l:'재활·회복 센터',lv:['없음','물리치료실','재활센터(수중 치료)','회복 센터(냉각·수면 관리)'],c:[0,800,2000,4000],days:[0,60,90,150],up:[0,30,70,120],d:'부상 복귀가 빨라지고 시즌 중 피로가 더 빨리 풀립니다.'},
  lab:{l:'피칭·타격 랩',lv:['없음','랩소도·영상 장비','트래킹 랩(고속 카메라)','바이오메카닉스 랩'],c:[0,500,1500,3500],days:[0,30,60,90],up:[0,40,90,180],d:'투구·스윙을 측정해 고칩니다. 젊은 선수의 성장이 빨라지고, 트래킹 분석원이 있으면 효과가 커집니다.'},
  fut:{l:'2군 구장',lv:['낡은 공용 구장','천연잔디 교체','조명·불펜·라커룸 개선','2군 전용 구장'],c:[0,2000,5000,10000],days:[0,150,210,300],up:[0,50,100,180],d:'2군 경기 환경입니다. 2군에서 뛰는 시간이 성장에 더 많이 인정되고 2군 부상이 줄어듭니다.'},
  dorm:{l:'선수 숙소·식당',lv:['없음','기숙사','기숙사·영양 식당','선수촌'],c:[0,1000,2500,5000],days:[0,120,180,240],up:[0,30,60,100],d:'젊은 선수의 생활과 영양을 관리합니다. 23세 이하 선수 성장과 기분이 좋아집니다.'}};
const FAC_MAX=6;
const facImpact=lv=>lv<=3?lv:3+(lv-3)*.2; /* 4~6단계는 한 단계 .2(사용자 피드백 11-12: 시설만 올려도 몇 년 안에 우승권이 되던 것. 예전 .35) */
for(const F of Object.values(FACI)){const c=F.c[3],days=F.days[3],up=F.up[3];F.lv.push(F.l+' 전문화',F.l+' 통합 캠퍼스',F.l+' 선도 연구센터');for(let lv=4;lv<=FAC_MAX;lv++){F.c.push(Math.round(c*Math.pow(1.7,lv-3)/100)*100);F.days.push(days+(lv-3)*90);F.up.push(Math.round(up*Math.pow(1.45,lv-3)));}}
const FACK=Object.keys(FACI);
/* 구단 버스: 원정 경기 피로. 다른 구단은 우등 버스 기준 */
const BUS=[{l:'일반 버스',f:.10,c:0,up:0},{l:'우등 버스',f:.02,c:250,up:40},{l:'리무진 버스',f:-.06,c:600,up:100}];
function busLv(tid){ if(tid!=null&&tid!==G.user){ const t=G.teams[tid]; return t&&t.bus!=null?t.bus:1; } return G.bus!=null?G.bus:1; } /* 우리가 떠난 구단은 우리가 산 버스를 그대로 쓴다(team.bus) */
/* 공사·운영 변경이 실제 확정된 구단에 단계·비용·예정일의 스냅숏을 남긴다. */
function clubFacilityHistory(kind,tid,label,stage,b){ b=b||{}; const info=[]; if(b.c!=null)info.push(`${b.costLabel||'공사비'} ${money(b.c)}`); if(b.src)info.push(b.src); if(b.done!=null)info.push(`${stage==='착공'?'완공 예정':'당초 완공 예정'} ${dstr(b.done)}`); if(typeof b.cap==='number')info.push(`${b.cap.toLocaleString('ko-KR')}석`); if(stage==='완공'||stage==='개장')info.push(`실제 ${dstr(G.day)}`); chron(kind,`${label}${b.lv!=null?` ${b.lv}단계`:''} ${stage}${info.length?` (${info.join(' · ')})`:''}`,null,tid,{source:`facility:${kind}:${stage}:${label}:${b.lv??''}:${b.done??G.day}`}); }
function buyBus(lv){ lv=+lv; if(!BUS[lv]||lv<=busLv())return '지금보다 좋은 버스만 살 수 있습니다.'; const t=team(G.user); const c=BUS[lv].c; if(spendable(G.user)<c)return `쓸 수 있는 돈이 부족합니다(${money(c)} 필요, ${spendTxt()}).`; spendPay(c); G.bus=lv; clubFacilityHistory('fac',G.user,`구단 버스 ${BUS[lv].l}`,'교체',{lv,c,costLabel:'구입비'}); addLog(`구단 버스를 ${BUS[lv].l}(으)로 바꿨습니다(${money(c)}).`); return ''; }
function facInit(){ G.fac=G.fac||{lv:2,build:null}; if(!G.fac.it){ const b=clamp(Math.round(((G.fac.lv||2)-1)*.75),0,3); G.fac.it={}; for(const k of FACK)G.fac.it[k]=k==='lab'?Math.max(0,b-1):b; if(G.fac.build){ for(const k of FACK)G.fac.it[k]=Math.min(3,G.fac.it[k]+1); G.fac.build=null; } G.fac.bld={}; G.fac.up0=facUpOf(G.fac.it); /* 처음 맡을 때 유지비: 이직하면 이보다 늘어난 만큼이 AI 결산의 증설분 */ } G.fac.bld=G.fac.bld||{}; G.fac.dn=G.fac.dn||{}; facRecalc(); }
function facRecalc(){ const it=G.fac.it; const avg=sum(FACK.map(k=>it[k]))/FACK.length; G.fac.lv=clamp(Math.round(1+avg*4/3),1,5); const u=G.teams&&G.teams[G.user]; if(u)u.fac=G.fac.lv; } /* team.fac(스태프 영입 매력 등)도 실제 시설과 맞춘다 */
function facUpkeep(){ const bu=BUS[busLv()].up; if(!G.fac||!G.fac.it)return FAC_UPKEEP[facLv(G.user)]+bu; return sum(FACK.map(k=>FACI[k].up[G.fac.it[k]]))+bu+(typeof facCityUp==='function'?facCityUp(team(G.user)):0); } /* 지자체 약속(지역 채용) 몫 포함 */ /* 버스 운영비 포함 */
function facOf(k){ return G.fac&&G.fac.it?G.fac.it[k]||0:1; }
/* 성장·노화 배수: 모든 구단이 세부 시설을 쓴다(다른 구단 시설은 team.fi, 66_fac_ai.js) */
function facEff(p){ if(p.team==null)return FAC[2]; const mine=p.team===G.user; const S=mine?G.fac:(()=>{ try{ return facSt(p.team); }catch(e){ return null; } })(); if(!S||!S.it)return FAC[facLv(p.team)];
  const fo=k=>Math.max(0,facImpact(S.it[k]||0)-facDis(S,k)); /* 공사 중인 시설은 훈련 효율이 잠시 떨어진다(57_club_econ) */
  const young=p.age<=23; const futP=(()=>{ const a=seasonTotal(p,G.year,'1군'), f=seasonTotal(p,G.year,'퓨처스'); return f&&(!a||(p.isP?(f.outs||0)>(a.outs||0):(f.pa||0)>(a.pa||0))); })();
  /* 다른 구단: 예전 종합 등급 효과(1단계 .88 ~ 5단계 1.12)를 세부 시설 평균으로 이어 쓰고, 숙소·2군 구장·웨이트는 구단 평균과의 차이만큼 더한다.
     그래서 투자하면 바로 효과가 오르고, 시작 시점 리그 균형은 예전과 같다 */
  if(!mine){ const av=sum(FACK.map(fo))/FACK.length, c=1+av*4/3;
    const g=.94+av*.03+ /* 우리 구단 식과 같은 기울기(시설 1단계당 약 .03). 시작 시점(평균 2단계 안팎)은 예전과 같고, 3단계 이상에서 우리 구단보다 더 크게 오르던 것(예전 .82+.06×종합)을 맞췄다(11-12) */(young?(fo('dorm')-av)*.015:0)+(futP?(fo('fut')-av)*.02:0), d=1.15-.05*c-(fo('weight')-av)*.01;
    return {l:`세부 시설(종합 ${S.lv}단계)`,g:Math.round(g*1000)/1000,d:Math.round(d*1000)/1000}; }
  const g=.94+fo('indoor')*.01+fo('lab')*.012*(1+anaPow('trk')*.08)+(young?fo('dorm')*.012:0)+(futP?fo('fut')*.016:0); /* 전부 최고 단계여도 성장 배수 약 1.12~1.13(예전 1.19 안팎): 예전 종합 5단계 시설(1.12)과 같은 천장 */
  const d=1.05-fo('weight')*.025-fo('rehab')*.012;
  return {l:`세부 시설(종합 ${S.lv}단계)`,g:Math.round(g*1000)/1000,d:Math.round(d*1000)/1000}; }
function buildFacItem(k){ facInit(); const F=FACI[k]; if(!F)return '없는 시설입니다.'; const lv=G.fac.it[k]; { const e=facCanStart(G.user,k); if(e)return e; } /* 선행 조건·큰 공사 한 곳(57_club_econ) */
  const c=F.c[lv+1]; const t=team(G.user); const free=spendable(G.user); /* 트레이드로 약정한 현금은 이미 쓴 돈(검수 11-09v), 모기업 구단은 구단주 지원 여유까지(피드백 11-09j) */ if(free<c)return `쓸 수 있는 돈이 부족합니다. 공사비 ${money(c)}이 필요합니다(${spendTxt()}).`;
  const k0=spendPay(c); G.spend.facB=(G.spend.facB||0)+k0; G.fac.inv=(G.fac.inv||0)+c; (G.fac.hist=G.fac.hist||[]).push({d:G.day,k,lv:lv+1,c,src:'cash',...(k0<c?{sup:c-k0}:{})}); /* 구단주 지원 예산으로 낸 몫은 따로(검수 11-09zza) */ const b=facStartBuild(G.user,k,{src:'cash'}); clubFacilityHistory('fac',G.user,F.l,'착공',{...b,src:'구단 현금·예산'}); /* 현금 투자 내역(결산 비용 아님)과 구단 시설 투자 이력(검수 11-08) */ facStartNews(G.user,k,b); addLog(`${F.l} ${F.lv[lv+1]} 공사를 ${b.pm>G.day?`발표했습니다. 시 인허가 뒤 착공합니다`:'시작했습니다'}(공사비 ${money(c)}, ${dmd(b.done)} 완공 예정).`); return ''; } /* 구단 돈으로 짓는다고 구단주 신뢰가 오르지는 않는다(11-13) */
/* 시설 투자 이력 한 줄 이름: 이력에는 특수 아카데미 제휴(k:'acad')도 섞여 있다. 이직 뒤 옛 구단 이력에서 FACI에 없는 키로 시설 화면 전체가 멈췄다(피드백 11-09j) */
function facHistLbl(h){ const F=FACI[h.k]; if(F)return F.lv[h.lv]||F.l; return h.k==='acad'&&typeof ACAD!=='undefined'&&ACAD[h.lv]?'특수 아카데미 · '+ACAD[h.lv].l:'시설 투자'; }
function facDaily(){ if(!G.fac||!G.fac.bld)return; for(const k of Object.keys(G.fac.bld)){ const b=G.fac.bld[k]; if(G.day>=b.done){ G.fac.it[k]=b.lv; (G.fac.dn=G.fac.dn||{})[k]=G.day; delete G.fac.bld[k]; facRecalc(); addLog(`${FACI[k].l} ${FACI[k].lv[b.lv]} 완공.`); clubFacilityHistory('fac',G.user,FACI[k].l,'완공',b); try{ facDoneNews(G.user,k,b); }catch(e){} mail('육성팀',`${FACI[k].l} 완공: ${FACI[k].lv[b.lv]}`,`${FACI[k].l}이(가) ${b.lv}단계(${FACI[k].lv[b.lv]})로 완공됐습니다. ${FACI[k].d} 연 유지비는 ${money(FACI[k].up[b.lv])}입니다.`,{kind:'시설',acts:[{l:'시설 보기',a:'go',v:'staff:fac'}]}); } } }
/* 시설 한 단계 효과를 말로만(사용자 11-05: 시뮬 게임이라 수치는 보여 주지 않고 '영향을 준다' 정도로. 실제 배수는 facEff) */
function facGainTxt(k,lv){ if(lv>=FAC_MAX)return ''; const who={indoor:'모든 선수의 성장',lab:'모든 선수의 성장(트래킹 분석원이 있으면 더)',dorm:'23세 이하 선수의 성장과 기분',fut:'2군에서 주로 뛰는 선수의 성장',weight:'30대 선수의 하락 속도와 부상',rehab:'부상 복귀와 피로 회복'}[k]; if(!who)return '';
  return `다음 단계로 올리면 ${who}에 영향을 줍니다${lv>=3?'(4단계부터는 효과가 완만해집니다)':''}.`; }
