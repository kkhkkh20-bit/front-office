/* ===== 감독 유형: 공격 작전(스몰볼·빅볼), 수비 중시·타격 중시, 투수 운용, 투수 관리, 기조 =====
   수비 중시 감독은 수비가 좋은 선수를 주전으로 쓰고, 8회 이후 근소하게 앞서면 수비 강화 교체를 한다.
   타격 중시 감독은 수비가 약해도 잘 치는 선수를 쓴다. 야수 수비력은 경기에서 인플레이 타구 안타 확률과 실책에 반영된다 */
const DEF0=53;
const DEFW={C:.8,SS:1.4,'2B':1.1,CF:1.3,'3B':1,RF:.8,LF:.7,'1B':.5};
function teamDefV(ln){ let s=0,w=0; for(const pos in DEFW){ const p=ln[pos]; if(!p)continue; s+=defAt(p,pos)*DEFW[pos]; w+=DEFW[pos]; } return w?s/w:DEF0; }
function sideDefV(fs){ const ln={}; for(const p of fs.order){ const k=fs.posOf[p.id]; if(k&&k!=='DH')ln[k]=p; } return teamDefV(ln); }
function mgrDefW(tid){ const m=tid!=null?mgrOf(tid):null; if(!m||m.interim)return .38; mgrAttr(m); return clamp(.38+(m.dfn-50)*.005,.2,.6); }
/* 8회 이후 1~3점 앞설 때 수비 강화 교체 */
function defSub(fs){ const m=mgrOf(fs.tid); if(!m||m.interim)return ''; mgrAttr(m); if(R()>=(m.dfn-45)/40)return '';
  const need=m.dfn>=70?5:7, maxN=m.dfn>=70?2:1; const out=[];
  for(let k=0;k<maxN;k++){ let best=null;
    for(const p of fs.order){ const pos=fs.posOf[p.id]; if(!pos||pos==='DH'||pos==='C')continue;
      for(const q of fs.bench){ if(!healthy(q)||fs.order.includes(q)||fs.out.includes(q))continue; const g=defAt(q,pos)-defAt(p,pos); if(g>=need&&(!best||g>best.g))best={p,q,pos,g}; } }
    if(!best)break; const i=fs.order.indexOf(best.p); fs.order[i]=best.q; fs.posOf[best.q.id]=best.pos; fs.out.push(best.p); fs.bench.splice(fs.bench.indexOf(best.q),1); fs.box.set(best.q.id,bz());
    out.push(`${best.p.name} → ${best.q.name}(${POSS[best.pos]||best.pos})`); }
  if(out.length)fs.defv=sideDefV(fs); return out.join(', '); }
/* 유형 이름: 성향 조합으로 한 줄 요약 */
const MTYPE={combo_d:['수비·작전 야구형','수비가 좋은 선수를 쓰고 번트·도루로 한 점을 짜냅니다. 앞서면 수비를 굳힙니다.'],combo_o:['공격 야구형','수비가 약해도 잘 치는 선수를 씁니다. 번트 없이 장타로 이깁니다.'],
  pen_all:['불펜 총력형','선발을 일찍 내리고 필승조를 연투·멀티이닝으로 쏟아붓습니다. 투수 부상 위험이 큽니다.'],sp_care:['선발 관리형','선발에게 긴 이닝을 맡기고 불펜 연투를 피합니다.'],
  youth:['육성형','젊은 선수에게 기회를 줍니다. 당장 성적보다 성장을 봅니다.'],dfn:['수비 중시형','수비가 좋은 선수를 주전으로 쓰고, 근소하게 앞서면 수비 강화 교체를 합니다.'],bat:['타격 중시형','수비보다 타격을 보고 주전을 정합니다.'],
  small:['스몰볼형','번트·도루로 한 점씩 쌓습니다.'],big:['빅볼형','번트를 거의 대지 않고 최고 타자를 2번에 두며 장타로 승부합니다.'],gamble:['승부사형','이길 경기는 투수를 무리해서라도 잡습니다.'],care:['투수 보호형','투구 수와 연투를 엄격히 관리합니다.'],bal:['균형형','특정 방식에 치우치지 않습니다.']};
/* 가장 두드러진 성향 조합으로 유형을 정한다 */
function mgrType(m){ if(!m)return {n:'-',d:''}; mgrAttr(m); const s=(m.small-50)*.8, d=(m.dfn-50)*1.05, p=(m.pen-50)*.8, a=(m.arm-50)*1.05, y=(m.youth-50)*.8;
  const c=[['combo_d',Math.min(s,d)+6],['combo_o',Math.min(-s,-d)+6],['pen_all',Math.min(p,a)+6],['sp_care',Math.min(-p,-a)+6],['youth',y-4],['dfn',d],['bat',-d],['small',s],['big',-s],['gamble',a-3],['care',-a-3]];
  c.sort((x,z)=>z[1]-x[1]); const k=c[0][1]>=14?c[0][0]:'bal'; return {k,n:MTYPE[k][0],d:MTYPE[k][1]}; }
/* 성향 축 5개: 화면 표시용 */
function mgrAxes(m){ mgrAttr(m); const ax=(v,lo,mid,hi)=>v>=62?hi:v<=38?lo:mid;
  return [['공격',ax(m.small,'빅볼','균형','스몰볼')],['수비',ax(m.dfn,'타격 중시','균형','수비 중시')],['투수 교체',ax(m.pen,'선발 중심','보통','불펜 중심')],['투수 관리',ax(m.arm,'보호형','보통','혹사형')],['기조',ax(m.youth,'성적형','균형','육성형')]]; }
