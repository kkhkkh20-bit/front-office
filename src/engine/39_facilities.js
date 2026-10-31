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
const FACK=Object.keys(FACI);
/* 구단 버스: 원정 경기 피로. 다른 구단은 우등 버스 기준 */
const BUS=[{l:'일반 버스',f:.10,c:0,up:0},{l:'우등 버스',f:.02,c:250,up:40},{l:'리무진 버스',f:-.06,c:600,up:100}];
function busLv(tid){ if(tid!=null&&tid!==G.user){ const t=G.teams[tid]; return t&&t.bus!=null?t.bus:1; } return G.bus!=null?G.bus:1; } /* 우리가 떠난 구단은 우리가 산 버스를 그대로 쓴다(team.bus) */
function buyBus(lv){ lv=+lv; if(!BUS[lv]||lv<=busLv())return '지금보다 좋은 버스만 살 수 있습니다.'; const t=team(G.user); const c=BUS[lv].c; if(t.cash<c)return `보유 현금이 부족합니다(${money(c)} 필요).`; t.cash-=c; G.bus=lv; addLog(`구단 버스를 ${BUS[lv].l}(으)로 바꿨습니다(${money(c)}).`); return ''; }
function facInit(){ G.fac=G.fac||{lv:2,build:null}; if(!G.fac.it){ const b=clamp(Math.round(((G.fac.lv||2)-1)*.75),0,3); G.fac.it={}; for(const k of FACK)G.fac.it[k]=k==='lab'?Math.max(0,b-1):b; if(G.fac.build){ for(const k of FACK)G.fac.it[k]=Math.min(3,G.fac.it[k]+1); G.fac.build=null; } G.fac.bld={}; } G.fac.bld=G.fac.bld||{}; G.fac.dn=G.fac.dn||{}; facRecalc(); }
function facRecalc(){ const it=G.fac.it; const avg=sum(FACK.map(k=>it[k]))/FACK.length; G.fac.lv=clamp(Math.round(1+avg*4/3),1,5); const u=G.teams&&G.teams[G.user]; if(u)u.fac=G.fac.lv; } /* team.fac(스태프 영입 매력 등)도 실제 시설과 맞춘다 */
function facUpkeep(){ const bu=BUS[busLv()].up; if(!G.fac||!G.fac.it)return FAC_UPKEEP[facLv(G.user)]+bu; return sum(FACK.map(k=>FACI[k].up[G.fac.it[k]]))+bu; } /* 버스 운영비 포함 */
function facOf(k){ return G.fac&&G.fac.it?G.fac.it[k]||0:1; }
/* 성장·노화 배수: 모든 구단이 세부 시설을 쓴다(다른 구단 시설은 team.fi, 66_fac_ai.js) */
function facEff(p){ if(p.team==null)return FAC[2]; const mine=p.team===G.user; const S=mine?G.fac:(()=>{ try{ return facSt(p.team); }catch(e){ return null; } })(); if(!S||!S.it)return FAC[facLv(p.team)];
  const fo=k=>S.it[k]||0;
  const young=p.age<=23; const futP=(()=>{ const a=seasonTotal(p,G.year,'1군'), f=seasonTotal(p,G.year,'퓨처스'); return f&&(!a||(p.isP?(f.outs||0)>(a.outs||0):(f.pa||0)>(a.pa||0))); })();
  /* 다른 구단: 예전 종합 등급 효과(1단계 .88 ~ 5단계 1.12)를 세부 시설 평균으로 이어 쓰고, 숙소·2군 구장·웨이트는 구단 평균과의 차이만큼 더한다.
     그래서 투자하면 바로 효과가 오르고, 시작 시점 리그 균형은 예전과 같다 */
  if(!mine){ const av=sum(FACK.map(fo))/FACK.length, c=1+av*4/3;
    const g=.82+.06*c+(young?(fo('dorm')-av)*.015:0)+(futP?(fo('fut')-av)*.02:0), d=1.15-.05*c-(fo('weight')-av)*.01;
    return {l:`세부 시설(종합 ${S.lv}단계)`,g:Math.round(g*1000)/1000,d:Math.round(d*1000)/1000}; }
  const g=.94+fo('indoor')*.012+fo('lab')*.015*(1+anaPow('trk')*.08)+(young?fo('dorm')*.015:0)+(futP?fo('fut')*.02:0);
  const d=1.05-fo('weight')*.03-fo('rehab')*.015;
  return {l:`세부 시설(종합 ${S.lv}단계)`,g:Math.round(g*1000)/1000,d:Math.round(d*1000)/1000}; }
function buildFacItem(k){ facInit(); const F=FACI[k]; if(!F)return '없는 시설입니다.'; const lv=G.fac.it[k]; if(lv>=3)return '이미 최고 단계입니다.'; if(G.fac.bld[k])return '이미 공사 중입니다.'; if(Object.keys(G.fac.bld).length>=2)return '공사는 동시에 2곳까지만 할 수 있습니다.';
  const c=F.c[lv+1]; const t=team(G.user); if(t.cash<c)return `보유 현금이 부족합니다. 공사비 ${money(c)}이 필요합니다(보유 ${money(t.cash)}).`;
  t.cash-=c; G.spend.facB=(G.spend.facB||0); G.fac.bld[k]={lv:lv+1,done:G.day+F.days[lv+1],c}; addLog(`${F.l} ${F.lv[lv+1]} 공사를 시작했습니다(공사비 ${money(c)}, ${F.days[lv+1]}일).`); t.trust=clamp(t.trust+1,0,100); return ''; }
function facDaily(){ if(!G.fac||!G.fac.bld)return; for(const k of Object.keys(G.fac.bld)){ const b=G.fac.bld[k]; if(G.day>=b.done){ G.fac.it[k]=b.lv; (G.fac.dn=G.fac.dn||{})[k]=G.day; delete G.fac.bld[k]; facRecalc(); addLog(`${FACI[k].l} ${FACI[k].lv[b.lv]} 완공.`); chron('fac',`${FACI[k].l} ${FACI[k].lv[b.lv]} 완공`); mail('육성팀',`${FACI[k].l} 완공: ${FACI[k].lv[b.lv]}`,`${FACI[k].l}이(가) ${b.lv}단계(${FACI[k].lv[b.lv]})로 완공됐습니다. ${FACI[k].d} 연 유지비는 ${money(FACI[k].up[b.lv])}입니다.`,{kind:'시설',acts:[{l:'시설 보기',a:'go',v:'staff:fac'}]}); } } }
