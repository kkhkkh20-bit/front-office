/* ===== 기자단: 기자도 인물이다 =====
   기자마다 소속 매체·성향(우호·중립·비판)·전문 분야·영향력·단장과의 관계가 있다.
   인터뷰에 성실히 응하면 관계가 오르고, 거절·회피·공격적 답변은 관계를 깎는다.
   비판 성향 기자는 나쁜 답을 더 크게 쓰고, 우호 기자는 좋은 답을 더 크게 쓴다. 영향력이 클수록 효과가 크다.
   관계 70 이상 기자는 가끔 다른 구단 동향을 귀띔해 준다 */
const PR_STYLE={fr:{l:'우호적',d:'구단 사정을 이해해 주는 편입니다. 좋은 말은 크게, 나쁜 말은 작게 씁니다.'},ne:{l:'중립',d:'들은 대로 씁니다.'},cr:{l:'비판적',d:'프런트를 날카롭게 봅니다. 실수 하나를 크게 씁니다.'}};
const PR_FIELD=['현장 취재','데이터 분석','이적 시장','구단 경영','인물 기획'];
function pressInit(){ if(G.reporters&&G.reporters.length)return G.reporters; const L=G.reporters=[];
  REPORTERS.forEach((n,i)=>L.push({id:'rp'+i,name:n,outlet:OUTLETS[i%4],age:ri(27,55),female:/서진|하람|가은|세라/.test(n),style:pick(['fr','ne','ne','cr','cr']),field:pick(PR_FIELD),inf:ri(1,5),rel:50,iv:0,last:null}));
  return L; }
function repById(id){ return pressInit().find(r=>r.id===id); }
function repPick(){ const L=pressInit(); return L[Math.floor(R()*L.length)]; }
function repMul(r,v){ if(!r)return v; const s=r.style==='cr'?(v<0?1.5:.7):r.style==='fr'?(v>0?1.4:.7):1; return Math.round(v*s*(.8+r.inf*.1)); }
function repRel(r,d,why){ if(!r)return; r.rel=clamp(r.rel+d,0,100); r.last={d:G.day,dv:d,why}; }
/* 귀띔: 관계 좋은 기자가 다른 구단이 노리는 자리와 우리 선수를 알려 준다(2주에 한 번 정도) */
function pressTips(){ if(G.unemp)return; const r=pressInit().filter(x=>x.rel>=70).sort(()=>R()-.5)[0]; if(!r||R()>.5)return;
  const t=pick(G.teams.filter(x=>x.id!==G.user)); let txt=''; try{ const SR=slotRanks(t.id); const k=PSLOTS.filter(s=>s!=='DH').sort((a,b)=>SR[b].rank-SR[a].rank)[0];
    const mine=playersOf(G.user).filter(p=>pSlot(p)===k||(k==='SP'&&isSPr(p))||(k==='RP'&&p.isP&&!isSPr(p))).sort((a,b)=>ovr(b)-ovr(a))[0];
    txt=`${tname(t.id)}이(가) ${SLOTK[k]} 보강을 서두르고 있습니다.${mine?` 우리 ${mine.name}을(를) 눈여겨본다는 얘기가 있습니다.`:''}`; }catch(e){ return; }
  mail(`${r.outlet} ${r.name} 기자`,`[귀띔] ${tshort(t.id)} 동향`,`"단장님께만 드리는 얘기입니다." ${txt}\n\n(관계 ${Math.round(r.rel)} 기자의 비공식 정보입니다. 기사로는 아직 나가지 않았습니다.)`,{kind:'언론'}); }
