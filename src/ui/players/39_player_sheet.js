/* ---------- 선수 카드와 경기 기록 ---------- */
function statTable(p){
  const rows=[...p.hist].sort((a,b)=>b.y-a.y||(a.lvl<b.lvl?-1:1));
  const pre=p.prev?[Object.assign({y:G.year-1,pre:p.prev.lvl},p.prev)]:p.am?[Object.assign({y:G.year,pre:'아마'},p.am)]:[];
  const one=p.hist.filter(h=>h.lvl==='1군'); let tot=null; if(one.length>1){ tot=Object.assign({},p.isP?ZP:ZB,{y:'통산',tot:true,war:sum(one.map(h=>wOf(h,p)))}); for(const h of one)addTo(tot,h); tot.y='통산'; }
  const all=[...(tot?[tot]:[]),...rows,...pre]; if(!all.length)return '<p class="small muted">기록이 없습니다.</p>';
  const lab=h=>h.tot?'1군 합계':typeof h.pre==='string'?h.pre:`${h.t!=null&&G.teams[h.t]?tshort(h.t):'이전 소속'}${h.lvl==='퓨처스'?' F':''}`; /* pre:1은 지난 시즌 기록 표시(구단 이름 아님) */
  if(p.isP){
    return `<table><thead><tr><th>시즌</th><th>구단</th><th class="key">ERA</th><th class="key">WAR</th><th>경기</th><th>선발</th><th>이닝</th><th>승</th><th>패</th><th>세</th><th>홀</th><th>탈삼진</th><th>볼넷</th><th>피안타</th><th>피홈런</th><th>WHIP</th><th>K/9</th><th>BB/9</th></tr></thead><tbody>${all.map(h=>{const r=pRate(h); return `<tr><td>${h.y2?`${h.y}~${String(h.y2).slice(2)}`:h.y}</td><td>${lab(h)}</td><td class="key">${h.outs?r.era.toFixed(2):'-'}</td><td class="key">${h.tot?h.war.toFixed(1):h.pre?'-':wOf(h,p).toFixed(1)}</td><td>${h.g||0}</td><td>${h.gs||0}</td><td>${ipStr(h.outs)}</td><td>${h.w||0}</td><td>${h.l||0}</td><td>${h.sv||0}</td><td>${h.hld||0}</td><td>${h.so}</td><td>${h.bb}</td><td>${h.h}</td><td>${h.hr}</td><td>${h.outs?r.whip.toFixed(2):'-'}</td><td>${h.outs?r.k9.toFixed(1):'-'}</td><td>${h.outs?r.bb9.toFixed(1):'-'}</td></tr>`}).join('')}</tbody></table>`;
  }
  return `<table><thead><tr><th>시즌</th><th>구단</th><th class="key">OPS</th><th class="key">wRC+</th><th class="key">WAR</th><th>경기</th><th>타석</th><th>타율</th><th>출루율</th><th>장타율</th><th>안타</th><th>2루타</th><th>3루타</th><th>홈런</th><th>타점</th><th>득점</th><th>도루</th><th>볼넷</th><th>삼진</th><th>볼삼비</th><th>BABIP</th></tr></thead><tbody>${all.map(h=>{const r=bRate(h); return `<tr><td>${h.y2?`${h.y}~${String(h.y2).slice(2)}`:h.y}</td><td>${lab(h)}</td><td class="key">${h.pa?fmt3(r.ops):'-'}</td><td class="key">${h.tot?(wrcMulti(one)??'-'):h.pre||h.y2||!h.pa?'-':(wrcPlus(h,h.y)??'-')}</td><td class="key">${h.tot?h.war.toFixed(1):h.pre?'-':wOf(h,p).toFixed(1)}</td><td>${h.g||0}</td><td>${h.pa}</td><td>${fmt3(r.avg)}</td><td>${fmt3(r.obp)}</td><td>${fmt3(r.slg)}</td><td>${h.h}</td><td>${h.d}</td><td>${h.tr}</td><td>${h.hr}</td><td>${h.rbi}</td><td>${h.r}</td><td>${h.sb}</td><td>${h.bb}</td><td>${h.so}</td><td>${h.so?(h.bb/h.so).toFixed(2):'-'}</td><td>${babipOf(h)!=null?fmt3(babipOf(h)):'-'}</td></tr>`}).join('')}</tbody></table>`;
}
function keyBar(p,rp,isFA,isFM){ if((p.fdPool&&G.fd)||fdHideNow(p))return fdKeyBar(p); const fsx=p.foreign&&p.team==null?fScout(p,rp):null; /* 외국인 후보: 스카우트 평가와 기록을 합친 종합 추정 */ const cur=p.fdPool?null:fsx&&fsx.raw!=null?fsx.raw:rp.cur, pot=p.fdPool?null:rp.ofp; const fg=p.fdPool?fdGrade(p):null; const sal=isFM?p.ask:isFA&&p.ask?p.ask.annual:p.sal;
  const ct=p.prospect?'드래프트 대상':p.fdPool?tContract(p):isFM?`요구 · ${Math.round(p.ask/USD)}만 달러`:isFA?`FA 요구 ${p.ask?p.ask.years+'년':''}`:ctText(p);
  const box=(l,v,c,sub,st)=>`<div class="kb"><span>${l}</span><b style="color:${c}">${v}</b>${st||''}${sub?`<i>${sub}</i>`:''}</div>`;
  return `<div class="kbar">${box(fg?'추정 등급':'현재',fg?fg.g:dv(cur)??'?',fg?fg.c:cur!=null?rcol(cur):'var(--muted)',fg?'스카우트 추정 · 지명 후 공개':rp.exact?'현재 능력 확인됨':fsx&&cur!=null?`종합 추정 ${fsx.lo}~${fsx.hi} · ${fsx.l}`:'추정',fg||cur==null?'':starsH(dv(cur)))}${fsx?box('올해 역할',esc(rp.role||(p.isP?(isSPr(p)?'선발':'불펜'):posLabel(p))),'var(--ink)','외국인은 올해 성적으로 평가'):box('잠재력',fg?(fg.up?'↑':'-'):pot!=null?potTierP(rp,p).s:'?',pot!=null?['','var(--muted)','var(--muted)','var(--ink)','#5aa9ff','#6fe39a','#ffd166'][potTierP(rp,p).n]:'var(--muted)',pot==null?(p.fdPool?(fg&&fg.up?'성장 여지 있음':'지명 후 공개'):'알 수 없음'):pot-(cur||0)>=8?'성장 여지 큼':pot-(cur||0)>=3?'조금 더 성장':p.age>=33?'하락 시작':p.age>=29?'전성기':'거의 완성','')}${box('연봉',p.prospect?'-':money(sal||0),'#e8ecf3',ct)}</div>${valueLine(p,rp)}`; }
/* 현재 전력·잠재력 예상·구단 기여를 나눠 보여 준다. 우리 젊은 선수는 스카우트와 감독의 시각을 함께 */
/* 타자 포지션 가치: 같은 종합 능력이라도 유격·포수·2루는 귀하고 1루·지명은 흔하다. 구단들이 트레이드·FA·연봉에서 이 값으로 본다 */
function posValLine(p,rp){ if(p.isP||p.prospect||p.fdPool||hideOvr(p)||!p.r)return ''; const b=posBest(p); const d=dv(b.v)-dvo(p);
  return `<div class="pvline small"><span class="muted">포지션 가치</span> <b class="num">${dv(b.v)}</b> <span class="muted">${POSK[b.pos]||b.pos} 기준 · 종합보다 ${d>0?'+':''}${d}</span> <span class="i" title="종합 능력은 수비를 어느 자리든 같게 칩니다. 실제로는 유격·3루·2루·중견 수비가 실점을 훨씬 크게 바꾸고, 포수·유격·2루는 쓸 만한 선수가 드뭅니다. 구단들은 트레이드·FA·연봉에서 이 포지션 가치로 봅니다. 1루·지명타자로는 누구나 옮길 수 있어 가치가 낮습니다.">?</span></div>`; }
function valueLine(p,rp){ if(p.prospect||p.fdPool||p.team==null)return ''; const L=[];
  const CW=clubWar(p,p.team,G.startY||0); const ys=CW.ys; const w=sum(ys.map(y=>{ const h=seasonTotalT(p,y,'1군',p.team); return h?wOf(h,p):0; })); /* 우리 구단 소속으로 낸 기록만(시즌 중 이적 전 기록 제외) */
  L.push(`<span><i>구단 기여</i>${ys.length?`${esc(tshort(p.team))} ${ys.length}시즌 · 1군 WAR <b>${w.toFixed(1)}</b>`:`${esc(tshort(p.team))} 첫 시즌`}</span>`);
  if(p.team===G.user&&!p.foreign&&p.age<=25){ if(rp.ofp!=null)L.push(`<span><i>스카우트</i>${esc(potLine(p,rp,{who:false}))}</span>`);
    try{ const d=depth(G.user); const k=pSlot(p); const st=k==='SP'?d.sp[4]:k==='RP'?d.pen[3]:d.ln[k]; const reg=[...d.start,...d.sp,...d.pen.slice(0,4)].some(x=>x.id===p.id);
      const v=reg?'주전으로 씁니다':st&&ovr(st)-ovr(p)>=6?`지금은 ${esc(st.name)}(${dvo(st)}) 뒤입니다. 1군 기용은 어렵다고 봅니다`:st?`${esc(st.name)}(${dvo(st)})와 경쟁할 수 있다고 봅니다`:'기회를 줄 수 있다고 봅니다'; L.push(`<span><i>감독</i>${v}</span>`); }catch(e){} }
  return `<div class="vline">${L.join('')}</div>`; }
function curExBox(p,rp){ let L=null; try{ L=curExplain(p,rp); }catch(e){} return L&&L.length?`<div class="curex"><div class="eyebrow">현재 평가 근거</div><ul>${L.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:''; }
/* 외국인 후보: 얼마나 조사했는지, 그래서 추정을 얼마나 믿을 수 있는지 한눈에 */
function fsBox(p,rp){ const f=fScout(p,rp); const st=[0,1,2,3].map(i=>`<i class="${i<=f.n?'on':''}"></i>`).join(''); const k=fwatchOn(p.id)?fwatchK(p.id):null; const U=fUnknown(p,f);
  return `<div class="fsbox ${f.cls}"><div class="fs-h"><span class="fs-st">${st}</span><b>종합 평가 신뢰도 ${fRel(f)}</b>${f.mid!=null?`<span class="fs-r">종합 추정 <b class="num">${f.mid}</b> <span class="muted">(실제는 대체로 ${f.lo}~${f.hi})</span></span>`:''}</div>${f.sc!=null||f.rec!=null?`<p class="small">${f.sc!=null?`스카우트 평가 <b class="num">${f.sc}</b>`:''}${f.sc!=null&&f.rec!=null?' · ':''}${f.rec!=null?`기록으로 본 수준 <b class="num">${f.rec}</b>`:''} <span class="muted">→ 믿을 만한 쪽에 더 무게를 둬 합쳤습니다</span></p>`:''}
    <dl class="kv fs-kv"><dt>현장 관찰</dt><dd>${k!=null?`관찰 명단 · 진행 ${k}%`:'관찰 명단 밖'} · 스카우트 정보 ${esc(f.l)}</dd><dt>종합 평가 신뢰도</dt><dd>${fRel(f)} · 스카우트 평가와 지난 리그 기록을 합친 범위 폭 ±${f.band??'-'} (관찰 진행률과 별개: 기록이 믿을 만하면 관찰이 덜 됐어도 높을 수 있습니다)</dd><dt>미확인 항목</dt><dd>${U.length?esc(U.join(' · ')):'없음'}</dd></dl>
    <p class="small fs-why">근거: ${esc(f.why.join(' · '))}</p>${f.tip?`<p class="small">${esc(f.tip)}</p>`:''}</div>`; }
/* 선수 비교: 담은 2~3명을 같은 시즌·같은 군 기록과 같은 평가 기준으로 나란히. 추천 순위는 매기지 않는다 */
function pcmpView(){ const P=(UI.pcmp||[]).map(id=>G.players[id]).filter(Boolean); if(!P.length)return '<p class="small muted">선수 정보 위쪽의 \'비교에 담기\'로 2~3명을 담으세요.</p>';
  const y=UI.pcSea==='prev'?statY()-1:statY(), lv=UI.pcLvl==='퓨처스'?'퓨처스':'1군'; const anyP=P.some(p=>p.isP), anyB=P.some(p=>!p.isP);
  const RP=new Map(P.map(p=>[p.id,scoutReport(p)])); const tl=(p,k)=>{ const t=(RP.get(p.id).tools||[]).find(x=>x.k===k); return t?rchip(t.cur):'-'; };
  const H=p=>seasonTotal(p,y,lv); const small=(p,h)=>h&&(p.isP?(h.outs||0)<30:(h.pa||0)<60);
  const rows=[['구단 · 포지션 · 나이',p=>`${p.team!=null?esc(tshort(p.team)):'-'} · ${esc(posLabel(p))} · ${p.age}세`],['현재',p=>{ const cv=curView(p,RP.get(p.id)); return hideOvr(p)&&!cv.est?'?':`${rchip(cv.v)}${cv.est?` <span class="small muted">${cv.lo}~${cv.hi}</span>`:''}`; }],['잠재력',p=>potChip(RP.get(p.id),p)],['평가 확신도',p=>esc(RP.get(p.id).conf||'-')]];
  if(anyP)rows.push(['구위',p=>p.isP?tl(p,'stf'):'-'],['제구',p=>p.isP?tl(p,'ctl'):'-'],['체력',p=>p.isP?tl(p,'sta'):'-'],['구속',p=>p.isP?`${veloOf(p)}km`:'-']);
  if(anyB)rows.push(['컨택',p=>p.isP?'-':tl(p,'con')],['파워',p=>p.isP?'-':tl(p,'pow')],['선구',p=>p.isP?'-':tl(p,'eye')],['주력',p=>p.isP?'-':tl(p,'spd')],['수비',p=>p.isP?'-':tl(p,'def')]);
  rows.push([`${y} ${lv} 성적`,p=>{ const h=H(p); if(!h)return '<span class="muted">기록 없음</span>'; const sm=small(p,h)?' <b class="warn">적은 표본</b>':''; if(p.isP){ const r=pRate(h); return `${ipStr(h.outs||0)}이닝${sm} · ERA ${h.outs?r.era.toFixed(2):'-'} · K/9 ${h.outs?r.k9.toFixed(1):'-'} · BB/9 ${h.outs?r.bb9.toFixed(1):'-'} · WAR ${wOf(h,p).toFixed(1)}`; } const r=bRate(h); return `${h.pa}타석${sm} · 타율 ${fmt3(r.avg)} · OPS ${fmt3(r.ops)} · ${h.hr}홈런 · 볼삼비 ${h.so?(h.bb/h.so).toFixed(2):'-'} · WAR ${wOf(h,p).toFixed(1)}`; }],
    ['계약',p=>`${money(p.sal)} · ${esc(ctText(p))}`],['병역',p=>p.foreign?'해당 없음':esc(milText(p))]);
  const opt=(k,v,l,cur)=>`<button data-a="pcOpt" data-v="${k}:${v}" class="${cur?'on':''}">${l}</button>`;
  return `<div class="row wrapr"><div class="seg sm">${opt('sea','cur',`${statY()} 시즌`,UI.pcSea!=='prev')}${opt('sea','prev',`${statY()-1} 시즌`,UI.pcSea==='prev')}</div><div class="seg sm">${opt('lvl','1군','1군',lv==='1군')}${opt('lvl','퓨처스','2군',lv==='퓨처스')}</div></div>
    <div class="tw"><table class="sqt pcmp"><thead><tr><th></th>${P.map(p=>`<th><button class="lnk" data-a="player" data-v="${p.id}">${esc(p.name)}</button> <button class="tc-i" data-a="pcmpTg" data-v="${p.id}" aria-label="빼기">×</button></th>`).join('')}</tr></thead><tbody>${rows.map(([l,f])=>`<tr><td class="small muted">${l}</td>${P.map(p=>`<td>${f(p)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
    <p class="small muted">같은 시즌·같은 군 기록만 나란히 둡니다(60타석·10이닝 미만은 적은 표본). 능력은 선수 화면 스카우트 리포트와 같은 평가이고, 다른 구단 선수는 담당 스카우트가 본 범위입니다. 순위나 추천은 매기지 않습니다.</p>`; }
/* 리그 백분위(Baseball Savant식): 같은 시즌 1군에서 기준(타자 50타석·투수 20이닝)을 넘긴 선수 중 위치. 빨강=상위, 파랑=하위. 기록과 공개 트래킹만 쓴다 */
function pctCard(p,year){ if(hideOvr(p))return ''; const y=year??statY(); const h=seasonTotal(p,y,'1군'); const qual=h&&(p.isP?(h.outs||0)>=60:(h.pa||0)>=50); const pool=pctPool(!!p.isP,y); if(pool.length<15)return '';
  const V=pctVals(p,h); const M=p.isP?PCT_P:PCT_B; const col=v=>{ const t=(v-50)/50; const a=[59,111,182],m=[178,178,178],b=[210,59,59]; const c=t<0?a.map((x,i)=>Math.round(m[i]+(x-m[i])*-t)):b.map((x,i)=>Math.round(m[i]+(x-m[i])*t)); return `rgb(${c.join(',')})`; };
  const row=([k,l,dir,trk])=>{ const v=V[k]; if(v==null||!isFinite(v)||(!trk&&!qual))return `<div class="pct-r off"><span>${l}</span><span class="pct-b"></span><b>-</b><i>${trk?'':'기준 미달'}</i></div>`; const all=pool.map(x=>x[k]).filter(x=>x!=null&&isFinite(x)); const below=all.filter(x=>dir>0?x<v:x>v).length; const pc=Math.round(below/Math.max(1,all.length)*100);
    const fv=['ops','obp','iso'].includes(k)?fmt3(v):['era','whip','run'].includes(k)?v.toFixed(2):['k9','bb9','hr9','bbp','kp','kpp','bbpp'].includes(k)?v.toFixed(1):Math.round(v); return `<div class="pct-r"><span>${l}</span><span class="pct-b"><i style="width:${pc}%;background:${col(pc)}"></i><em style="left:${pc}%;background:${col(pc)}">${pc}</em></span><b>${fv}</b><i></i></div>`; };
  const n=h?(p.isP?ipStr(h.outs||0)+'이닝':(h.pa||0)+'타석'):'기록 없음'; const recM=M.filter(x=>!x[3]), trkM=M.filter(x=>x[3]);
  return `<div class="pct"><div class="row between"><span class="eyebrow">${y} 리그 백분위</span><span class="small muted">1군 ${p.isP?'20이닝':'50타석'} 이상 ${pool.length}명 기준${qual?'':` · 이 선수는 기준 미달이라 기록 항목은 비움(트래킹만)`}</span></div><div class="pct-g" title="실제 경기에서 쌓인 기록입니다. ${y} 정규시즌 1군만 셉니다."><b>경기 기록</b> <span class="small muted">실제 누적 · ${y} 1군 · 이 선수 ${n}</span></div>${recM.map(row).join('')}
    <div class="pct-g" title="경기 기록이 아니라 선수 능력에서 만든 측정값입니다. 측정 오차가 있고 시즌 중에는 변하지 않습니다."><b>측정값</b> <span class="small muted">${y<G.year?`${y} 시즌 측정이 아니라 지금(${G.year}) 능력 기반 값 · `:''}능력 기반 측정 · 측정 오차 포함 · 경기 결과로 바뀌지 않음</span></div>${trkM.map(row).join('')}
    <p class="small muted">숫자는 백분위(100에 가까울수록 리그 상위, 빨강), 오른쪽은 실제 값입니다. 삼진%·볼넷 허용처럼 낮을수록 좋은 항목은 뒤집어 계산했습니다. 비교 집단은 같은 시즌 1군 기준 이상 선수입니다.</p></div>`; }
/* 좌우 상대 비교(정규시즌 1군): 타자는 좌투수·우투수 상대, 투수는 좌타자·우타자 상대. 타석 수와 적은 표본을 함께 */
function splLine(a){ if(!a||!a[0])return null; const [pa,ab,h,tb,bb,so,hr,hbp=0]=a; const obp=(h+bb+hbp)/pa, slg=ab?tb/ab:0; return {pa,obp,slg,ops:obp+slg,kp:so/pa*100,bbp:bb/pa*100,hr}; }
function splitCard(p){ const S=UI.splP&&p.splP?p.splP:p.spl; if(!S||(!S.L&&!S.R))return p.splP&&!UI.splP?'':'<p class="small muted">좌우 상대 기록은 이 업데이트 이후 1군 경기부터 쌓입니다.</p>';
  const L=splLine(S.L), Rr=splLine(S.R); const vs=p.isP?['좌타자','우타자']:['좌투수','우투수']; const M=p.isP?[['ops','피OPS'],['kp','삼진%'],['bbp','볼넷%']]:[['ops','OPS'],['kp','삼진%'],['bbp','볼넷%']];
  const mx=k=>Math.max(k==='ops'?1:30,...[L,Rr].filter(Boolean).map(x=>x[k])); const fv=(k,v)=>k==='ops'?fmt3(v):v.toFixed(1)+'%';
  const bar=(x,k,cls)=>x?`<span class="spl-b ${cls}"><i style="width:${Math.round(x[k]/mx(k)*100)}%"></i><b>${fv(k,x[k])}</b></span>`:'<span class="spl-b"><b>-</b></span>';
  const sm=x=>x&&x.pa<40?' <b class="warn">적은 표본</b>':'';
  return `<div class="spl"><div class="row between"><span class="eyebrow">${S.y} 좌우 상대 비교</span>${p.splP?`<button class="tc-i" data-a="splP">${UI.splP?'이번 시즌':'지난 시즌'}</button>`:''}</div>
    <div class="spl-h"><span></span><span>${vs[0]} 상대 · ${L?L.pa:0}타석${sm(L)}</span><span>${vs[1]} 상대 · ${Rr?Rr.pa:0}타석${sm(Rr)}</span></div>
    ${M.map(([k,l])=>`<div class="spl-r"><span>${l}</span>${bar(L,k,'l')}${bar(Rr,k,'r')}</div>`).join('')}
    <p class="small muted">실제 경기 기록입니다(능력치의 좌우 평가와 다를 수 있음). 40타석 미만은 적은 표본입니다. 실제 기용은 감독이 정합니다.</p></div>`; }
/* 이동 구간 추세(최근 100타석·상대 100타자 창을 옮기며): 우리 선수만 경기별 기록을 보관 */
function rollSeries(p,W){ const G0=(p.gl&&p.gl.g)||[]; const out=[]; for(let i=0;i<G0.length;i++){ let n=0,a=[0,0,0,0,0,0,0]; for(let j=i;j>=0&&n<W;j--){ const g=G0[j]; n+=g[1]; for(let k=0;k<7;k++)a[k]+=g[k+1]; } if(n<W)continue; out.push({i,day:G0[i][0],a}); } return out; }
function rollCard(p){ if(p.team!==G.user)return ''; const W=100; const L=rollSeries(p,W); const tot=sum(((p.gl&&p.gl.g)||[]).map(g=>g[1]));
  const st=seasonTotal(p,G.year,'1군'), sAll=st?(p.isP?(st.bf||0):(st.pa||0)):0, u=p.isP?'명':'타석'; const part=sAll>tot; /* 경기별 기록은 우리 구단에서 뛴 경기만 보관한다(이적 전 경기는 시즌 합계에만) */
  const scope=part?`우리 구단에서 모은 경기별 기록 ${tot}${u}(이번 시즌 전체 ${sAll}${u} 중 이적 전 기록은 경기별로 없음)`:`이번 시즌 ${tot}${u}`;
  if(L.length<2)return `<p class="small muted">이동 구간 추세: ${scope}. ${W}${u}부터 추세를 표시합니다.</p>`;
  const w=520,h=130,l=40,r=10,t=8,b=18; const n=(p.gl.g||[]).length; const X=i=>l+(w-l-r)*i/Math.max(1,n-1);
  const chart=(vals,lo,hi,fmt,lab,ref)=>{ const Y=v=>t+(h-t-b)*(1-(clamp(v,lo,hi)-lo)/(hi-lo)); return `<p class="small">${lab}</p><svg class="ds" viewBox="0 0 ${w} ${h}" role="img" aria-label="${lab}">${[lo,(lo+hi)/2,hi].map(v=>`<line class="gr" x1="${l}" x2="${w-r}" y1="${Y(v)}" y2="${Y(v)}"></line><text class="tk" x="${l-4}" y="${Y(v)+4}" text-anchor="end">${fmt(v)}</text>`).join('')}${ref!=null?`<line class="md" x1="${l}" x2="${w-r}" y1="${Y(ref)}" y2="${Y(ref)}"></line>`:''}<polyline class="gl-l" points="${vals.map(x=>`${X(x.i).toFixed(1)},${Y(x.v).toFixed(1)}`).join(' ')}"></polyline><circle class="gl-d" cx="${X(vals[vals.length-1].i).toFixed(1)}" cy="${Y(vals[vals.length-1].v).toFixed(1)}" r="4"><title>최근 ${W}${p.isP?'명':'타석'} ${fmt(vals[vals.length-1].v)}</title></circle></svg>`; };
  const lg=lgRates(p.isP);
  if(p.isP){ const k=L.map(x=>({i:x.i,v:x.a[2]/x.a[0]*100})), bb=L.map(x=>({i:x.i,v:x.a[3]/x.a[0]*100}));
    return `<div class="roll"><span class="eyebrow">이동 구간 추세 · 최근 상대 타자 ${W}명</span>${chart(k,0,40,v=>v.toFixed(0)+'%','탈삼진율(K%)',lg.k)}${chart(bb,0,20,v=>v.toFixed(0)+'%','볼넷율(BB%)',lg.bb)}<p class="small muted">${part?scope+'. ':''}점선은 리그 평균. 기록의 오르내림은 표본·상대 영향이 크고, 능력 변화를 뜻하지는 않습니다.</p></div>`; }
  const ob=L.map(x=>({i:x.i,v:(x.a[2]+x.a[4])/x.a[0]})), kp=L.map(x=>({i:x.i,v:x.a[5]/x.a[0]*100}));
  return `<div class="roll"><span class="eyebrow">이동 구간 추세 · 최근 ${W}타석</span>${chart(ob,.2,.5,v=>fmt3(v),'출루율(타석 기준)',lg.obp)}${chart(kp,0,40,v=>v.toFixed(0)+'%','삼진율(K%)',lg.k)}<p class="small muted">${part?scope+'. ':''}점선은 리그 평균. 기록의 오르내림은 표본·상대 영향이 크고, 능력 변화를 뜻하지는 않습니다.</p></div>`; }
let _lgR={k:null}; function lgRates(isP){ const k=G.day+':'+isP; if(_lgR.k===k)return _lgR.v; let pa=0,h=0,bb=0,so=0,bf=0,pso=0,pbb=0; for(const q of Object.values(G.players)){ const x=seasonTotal(q,G.year,'1군'); if(!x)continue; if(q.isP){ bf+=x.bf||0; pso+=x.so||0; pbb+=x.bb||0; } else { pa+=x.pa||0; h+=x.h||0; bb+=x.bb||0; so+=x.so||0; } }
  const v=isP?{k:bf?pso/bf*100:null,bb:bf?pbb/bf*100:null}:{obp:pa?(h+bb)/pa:null,k:pa?so/pa*100:null}; _lgR={k,v}; return v; }
/* 타구 분포도: 방향(자리)별 타구 비중과 안타 비율, 유형(땅볼·라인드라이브·뜬공·팝플라이) 비중. 정규시즌 1군 기록 */
const SPR_Z={LF:[-45,-15,1],CF:[-15,15,1],RF:[15,45,1],'3B':[-45,-22.5,0],SS:[-22.5,0,0],'2B':[0,22.5,0],'1B':[22.5,45,0]}; const SPR_TL={GB:'땅볼',LD:'라인드라이브',FB:'뜬공',PU:'팝플라이'};
function sprayCard(p,selected){ const S=selected||(UI.sprP&&p.sprP?p.sprP:p.spr); if(!S)return ''; const T=S.t||{}; const tot=Object.values(T).reduce((a,x)=>a+x[0],0); if(!tot)return '';
  const mix=`<div class="spr-mix">${['GB','LD','FB','PU'].map(k=>{ const x=T[k]||[0,0]; const pc=Math.round(x[0]/tot*100); return `<span style="flex:${Math.max(pc,1)}" class="spr-t ${k}" title="${SPR_TL[k]} ${x[0]}개 · 안타 ${x[1]}"><b>${SPR_TL[k]}</b> ${pc}%</span>`; }).join('')}</div>`;
  if(p.isP)return `<div class="spr"><div class="row between"><span class="eyebrow">${S.y} 맞은 타구 유형 · ${tot}개</span>${!selected&&p.sprP?`<button class="tc-i" data-a="sprP">${UI.sprP?'이번 시즌':'지난 시즌'}</button>`:''}</div>${mix}</div>`;
  const Z=S.z||{}; const zt=Object.keys(SPR_Z).reduce((a,k)=>a+((Z[k]||[0])[0]),0)||1; const cx=170,cy=196; const pt=(r,a)=>[cx+r*Math.sin(a*Math.PI/180),cy-r*Math.cos(a*Math.PI/180)];
  const wedge=(k)=>{ const [a0,a1,of]=SPR_Z[k]; const r0=of?104:22, r1=of?180:100; const z=Z[k]||[0,0,0,0]; const sh=z[0]/zt; const p1=pt(r0,a0),p2=pt(r1,a0),p3=pt(r1,a1),p4=pt(r0,a1); const op=(.12+sh/.35*.75).toFixed(2); const mid=pt((r0+r1)/2,(a0+a1)/2);
    return `<g><path class="spr-w" d="M${p1} L${p2} A${r1} ${r1} 0 0 1 ${p3} L${p4} A${r0} ${r0} 0 0 0 ${p1} Z" style="fill-opacity:${op}"><title>${POSS[k]||k} 방향 타구 ${z[0]}개(${Math.round(sh*100)}%) · 안타 ${z[1]} · 장타 ${z[2]} · 홈런 ${z[3]}</title></path><text x="${mid[0].toFixed(1)}" y="${(mid[1]+4).toFixed(1)}" text-anchor="middle">${Math.round(sh*100)}%</text></g>`; };
  const ZO=['LF','CF','RF','3B','SS','2B','1B']; const zr=k=>{ const z=Z[k]||[0,0,0,0]; return `<tr><td>${POSS[k]||k} 쪽</td><td class="num">${z[0]}</td><td class="num">${Math.round(z[0]/zt*100)}%</td><td class="num">${z[0]?Math.round(z[1]/z[0]*100)+'%':'-'}</td><td class="num">${z[2]}</td><td class="num">${z[3]}</td></tr>`; };
  const tbl=`<table class="sqt spr-z"><thead><tr><th>방향</th><th>타구</th><th>비중</th><th>안타 비율</th><th>장타</th><th>홈런</th></tr></thead><tbody>${ZO.map(zr).join('')}</tbody></table>`;
  return `<div class="spr"><div class="row between"><span class="eyebrow">${S.y} 타구 분포 · 인플레이 타구와 홈런 ${tot}개</span>${!selected&&p.sprP?`<button class="tc-i" data-a="sprP">${UI.sprP?'이번 시즌':'지난 시즌'}</button>`:''}</div>
    <div class="spr-g"><svg class="spr-f" viewBox="0 0 340 206" role="img" aria-label="방향별 타구 분포">${Object.keys(SPR_Z).map(wedge).join('')}<path class="spr-l" d="M${pt(180,-45)} L${cx} ${cy} L${pt(180,45)}"></path></svg><div class="tw">${tbl}</div></div>${mix}
    <p class="small muted">그림의 숫자는 그 방향 타구 비중(진할수록 많이 보냄)입니다. 안타 비율·장타·홈런은 옆 표에 있습니다. ${p.bt==='좌'?'좌타자라 당겨치면 1루·우익 쪽입니다.':p.bt==='양'?'양타자는 투수에 따라 타석이 바뀝니다.':'우타자라 당겨치면 3루·좌익 쪽입니다.'}</p></div>`; }
function reportCard(p,noTools){
  const rp=scoutReport(p);
  if(hideOvr(p))return `<section class="card"><div class="row between"><h2 class="sec">스카우트 의견</h2><span class="small muted">${fdHideNow(p)?'우리 스카우트 추정':p.foreign&&p.team==null?`조사 단계 · ${fScout(p,rp).l}`:`${esc(rp.who)} · 정확도 ${rp.conf}`}</span></div>${p.foreign&&p.team==null?fsBox(p,rp):''}
    <div class="row">${(()=>{ const m=G.mgr[G.user]; if(!m||m.interim||G.unemp)return ''; const k=mgrRolesOf(m).find(x=>roleOk(p,x)); return k?`<span class="pill acc" title="${esc(`${m.name} 감독이 원하는 역할: ${MROLE[k].role}. ${roleTags(p,k)}`)}">감독 야구에 맞음 · ${esc(MROLE[k].l)}</span>`:''; })()}${(()=>{ const fv=ppFond(p,G.user); return fv&&p.team!==G.user?`<span class="pill good" title="단장이 언론을 통해 공개적으로 원한 선수입니다. FA 때 우리 구단을 더 좋게 봅니다">우리 구단에 호감 +${fv}</span>`:''; })()}${p.team!=null&&team(p.team).cap===p.id?'<span class="pill good">주장</span>':''}${p.team!=null&&!p.foreign&&p.region&&team(p.team).region===p.region?`<span class="pill good" title="구단 연고 지역(${esc(p.region)}) 출신. 팬 인기가 더 오르고 FA·재계약 때 이 구단을 조금 더 원합니다">연고 출신</span>`:''}${p.team!=null&&isFranchise(p)?`<span class="pill acc">${esc(tshort(p.team))} 프랜차이즈 스타 · ${teamTenure(p,p.team).n}시즌</span>`:''}${fdHideNow(p)?`<span class="pill">예상 역할 ${esc(fdRole(p,fdEstOf(p)))}</span>`:`<span class="pill acc">${esc(rp.arch)}</span>${p.foreign?(rp.role?`<span class="pill">올해 예상 ${esc(rp.role)}</span>`:''):rp.role?`<span class="pill">장래 ${esc(rp.role)}</span>`:'<span class="pill">잠재력 판단 불가</span>'}<span class="pill ${rp.risk==='높음'?'bad':rp.risk==='낮음'?'good':''}">위험도 ${rp.risk}</span>`}${rp.eta?`<span class="pill">1군까지 약 ${rp.eta}년</span>`:''}</div>
    <div class="quote">${(fdHideNow(p)?[fdScoutLine(p),fdDataLine(p,G.fd.y-1)]:p.prospect?(()=>{ const V=draftView(p,rp); const rw=riskWhy(p,rp); return [`확인된 기록: ${V.rec}`,`관찰 의견: ${V.obs}`,`성장 전망: ${V.fut}`,`위험도 ${rp.risk}: ${rw.length?rw.join(' · '):'특이 위험 없음'}`,...(draftClaim(p)?[draftClaimTxt(draftClaim(p))+'. 스카우트 의견이라 틀릴 수 있습니다.']:[])]; })():rp.notes).map(n=>`<p>${esc(n)}</p>`).join('')}</div>${p.foreign?curExBox(p,rp):''}
    <p class="small muted">${p.fdPool||fdHideNow(p)?'창단 드래프트 선수는 능력치가 공개되지 않습니다. 지난 시즌 기록과 나이, 스카우트 의견으로 판단하세요. 지명되면(우리든 다른 구단이든) 현재 능력은 바로 공개되고, 잠재력은 추정으로 남습니다.':p.prospect?'아마추어 선수는 능력치를 알 수 없습니다. 학년별 기록과 스카우트 의견으로 판단하세요. 지명하면 우리 코치진이 능력치를 파악합니다.':'위 능력치는 스카우트 추정입니다. 조사 단계가 낮을수록 실제와 차이가 크니 지난 리그 기록과 함께 보세요. 영입하면 코치진이 정확히 파악합니다.'}</p></section>`;
  const bar=t=>{ const w=v=>Math.round((v-20)/60*100); const fut=rp.ofp!=null&&t.fut>t.cur; return `<div class="tool" style="--c:${rcol(t.cur)};--c2:${rcol(t.fut)}"><span>${TOOLK[t.k]}</span>${rchip(t.cur)}<span class="track"><span class="mid"></span>${fut?`<span class="fut" style="width:${w(t.fut)}%"></span>`:''}<span class="now" style="width:${w(t.cur)}%"></span></span>${fut?'<span class="small muted">성장 예상</span>':'<span></span>'}</div>`; };
  return `<section class="card">
    <div class="row between"><h2 class="sec">스카우트 리포트</h2><span class="small muted">${esc(rp.who)} · ${rp.exact?'잠재력 추정 ':''}정확도 ${rp.conf}</span></div>
    <div class="tiles">${(()=>{ const cv=curView(p,rp); return `<div class="tile"><span class="g" style="color:${rcol(cv.v)}">${dv(cv.v)}</span><span class="l">${cv.est?`예상 종합 ${cv.lo}~${cv.hi}`:'현재 종합'}</span></div>`; })()}${p.foreign?(()=>{ const cv=curView(p,rp); const pj=projKBO(p,cv.v,cv.sd); return `<div class="tile key"><span class="g" style="font-size:16px">${pj?pj.mid:'?'}</span><span class="l">올해 예상 ${pj?(pj.k==='era'?'ERA':'OPS'):''}</span></div>`; })():`<div class="tile key"><span class="g" style="font-size:16px">${rp.ofp!=null?potTierP(rp,p).s:'?'}</span><span class="l">잠재력 추정</span></div>`}<div class="tile"><span class="g" style="font-size:16px">${rp.sd>=90?'판단 불가':rp.exact&&p.team!=null&&!p.foreign?'낮음':rp.sd>=8?'높음':rp.sd>=5?'보통':'낮음'}</span><span class="l">평가 불확실성</span></div><div class="tile"><span class="g" style="font-size:16px">${p.inj>.26?'높음':p.inj>.18?'보통':'낮음'}</span><span class="l">건강 위험</span></div>${rp.eta?`<div class="tile"><span class="g" style="font-size:16px">${rp.eta}년</span><span class="l">1군 도달 예상</span></div>`:''}</div>
    ${rp.role&&!p.fdPool?`<p class="small"><span class="muted">${p.foreign?'올해 예상 역할':'장래 역할'}</span> <b>${esc(rp.role)}</b></p>`:''}${curExBox(p,rp)}
    ${noTools?'':`<div class="tools">${rp.tools.map(bar).join('')}</div>
    <p class="small muted">${p.foreign?'외국인 선수는 올해 기량만 평가합니다. 막대는 현재 수준입니다.':'왼쪽 숫자는 현재, 막대 끝은 스카우트가 보는 미래(추정)입니다.'}</p>`}
    <div class="quote">${rp.notes.map(n=>`<p>${esc(n)}</p>`).join('')}</div>
  </section>`;
}
function entryForm(p){
  const on=entryOn(); let st;
  if(p.ys)st=`<b>육성선수</b> · 정식 로스터(${ROSTER_MAX}명) 밖에서 2군 경기에 나갑니다.`;
  else if(!on)st='시즌 중이 아니라 1군 엔트리가 없습니다.';
  else if(p.e1)st=`<b>1군 등록</b> · ${p.upDay!=null?dmd(p.upDay)+' 등록':''}`;
  else st=`<b>2군</b>${p.downDay!=null?` · ${dmd(p.downDay)} 말소 · ${G.day-p.downDay>=10?'재등록 가능':dmd(p.downDay+10)+'부터 재등록 가능'}`:''}`;
  const btns=[];
  if(on&&!p.ys)btns.push(p.e1?`<button class="btn small" data-a="reqDown" data-v="${p.id}">2군 말소 요청</button>`:`<button class="btn small" data-a="reqUp" data-v="${p.id}" ${canUp(p)?'':'disabled'}>1군 콜업 요청</button>`);
  if(p.ys)btns.push(`<button class="btn small" data-a="fromYS" data-v="${p.id}">정식 선수로 등록</button>`);
  else if(!p.foreign&&!p.faC&&p.sal<=100)btns.push(`<button class="btn small" data-a="toYS" data-v="${p.id}">육성선수로 전환</button>`);
  return `<section class="card"><span class="eyebrow">엔트리</span><p class="small">${st}</p><div class="row">${btns.join('')}</div>${UI.entMsg&&UI.entMsg.id===p.id?`<div class="note">${esc(UI.entMsg.t)}</div>`:''}<p class="small muted">1군 엔트리(${entryLimit()}명)는 감독이 관리합니다. 단장은 콜업·말소를 요청할 수 있고, 감독 성향과 관계에 따라 받아들여지지 않을 수 있습니다. 말소된 선수는 10일이 지나야 다시 올라옵니다. 육성선수는 5월 1일부터 정식 선수로 등록할 수 있습니다.</p></section>`;
}
function growthCard(p){
  if(p.prospect||p.team!==G.user||!p.oh||!p.oh.length)return '';
  const pts=p.oh.map(x=>({y:x.y,v:clamp(r5(x.o+hn('gh'+x.y,p.id)*1.5),20,80)}));
  const lg=p.devLog; const pl=lg?(lg.play>=1.08?'주전급 출전':lg.play>=1?'충분한 출전':lg.play>=.92?'출전 부족':'거의 못 뜀'):'';
  return `<section class="card"><div class="row between"><span class="eyebrow">연도별 코치진 평가</span><span class="small muted">매년 겨울 성장 반영</span></div>
    <div class="growth">${pts.map(x=>`<div><i style="height:${Math.max(6,(x.v-20)*1.6)}px;background:${rcol(x.v)}"></i><b>${dv(x.v)}</b><span>${String(x.y).slice(2)}</span></div>`).join('')}</div>
    ${lg?`<p class="small muted">지난 겨울 성장 요인: ${lg.y}시즌 ${pl} · ${esc(lg.fac)}${G.mgr[G.user]?` · ${esc(G.mgr[G.user].name)} 감독 육성 ${G.mgr[G.user].youth}`:''}</p>`:''}</section>`;
}
/* 이름·등번호 고치기 */
function pEditBox(p){ const e=UI.pEditErr; return `<div class="pe-box"><label>이름<input id="pe-nm" maxlength="12" value="${esc(p.name)}" autocomplete="off"></label>${p.team!=null?`<label>등번호<input id="pe-no" inputmode="numeric" maxlength="2" value="${jno(p)}" autocomplete="off"></label>`:''}<div class="row"><button class="btn small" data-a="pEditSave" data-v="${p.id}">저장</button><button class="btn small" data-a="pEditOpen" data-v="">취소</button></div>${e?`<p class="small bad">${esc(e)}</p>`:''}${p.renamed&&p.renamed.length?`<p class="small muted">이전 이름: ${p.renamed.map(r=>esc(r.from)).join(', ')}</p>`:''}<p class="small muted">기사·이야기에 이미 적힌 이름은 그대로 남습니다.</p></div>`; }
function archSheet(a){ const tw=a.rows.reduce((s,r)=>s+(r.war||0),0); const f3=v=>fmt3(v);
  const row=r=>a.isP?`<tr><td>${r.y}</td><td>${badge(r.t,14)} ${esc(tshort(r.t))}</td><td>${r.g||'-'}</td><td>${ipStr(r.outs||0)}</td><td>${r.outs?archLine(r).era.toFixed(2):'-'}</td><td>${r.w||0}-${r.l||0}${r.sv?` ${r.sv}세`:''}</td><td>${r.so||0}</td><td>${(r.war||0).toFixed(1)}</td></tr>`
    :(()=>{ const ab=r.ab||0, L=archLine(r); /* 현역과 같은 계산 */ return `<tr><td>${r.y}</td><td>${badge(r.t,14)} ${esc(tshort(r.t))}</td><td>${r.pa||0}</td><td>${ab?f3(L.avg):'-'}</td><td>${r.hr||0}</td><td>${ab?f3(L.ops):'-'}</td><td>${r.sb||0}</td><td>${(r.war||0).toFixed(1)}</td></tr>`; })();
  return `<div class="scrim" data-a="closeSheet"><div class="sheet gut" data-stop="1" role="dialog" aria-label="${esc(a.name)} 기록"><div class="sheet-head"><div><span class="eyebrow">리그를 떠난 선수${a.foreign?` · ${a.foreign==='아시아'?'아시아쿼터':'외국인'}`:''}</span><h2 class="sec">${esc(a.name)} <span class="small muted">${esc(a.isP?a.pos:(POSK[a.pos]||a.pos||''))} · ${a.y}년 ${a.age}세</span></h2></div><button class="x" data-a="closeSheet" aria-label="닫기">×</button></div>
    ${a.why?`<p class="small">${esc(a.why)}</p>`:''}<p class="small muted">1군 통산 WAR ${tw.toFixed(1)} · 마지막 소속 ${a.t!=null?esc(tshort(a.t)):'-'}. 리그를 떠나 지금 능력은 볼 수 없고, 남긴 기록만 보관합니다.</p>
    <div class="tw"><table class="mst"><thead><tr>${a.isP?'<th>시즌</th><th>구단</th><th>경기</th><th>이닝</th><th>ERA</th><th>승-패</th><th>탈삼진</th><th>WAR</th>':'<th>시즌</th><th>구단</th><th>타석</th><th>타율</th><th>홈런</th><th>OPS</th><th>도루</th><th>WAR</th>'}</tr></thead><tbody>${a.rows.slice().sort((x,y)=>x.y-y.y).map(row).join('')}</tbody></table></div></div></div>`; }
/* 상단바와 메뉴를 남긴 채 상세 본문에 사용할 실제 영역을 계산한다. */
let _appFrameObserver=null,_appFrameHeader=null;
function appFrameSync(){const root=document.documentElement,head=document.querySelector('#app .fmtop,#app .top,#app .dtop'),nav=document.querySelector('#app .bnav'),side=document.querySelector('#app .fmside,#app .rail');const visible=e=>e&&getComputedStyle(e).display!=='none'&&e.getBoundingClientRect().height>0;const top=visible(head)?Math.max(0,head.getBoundingClientRect().bottom):0,bottom=visible(nav)?Math.max(0,innerHeight-nav.getBoundingClientRect().top):0,left=visible(side)?Math.max(0,side.getBoundingClientRect().right):0;root.style.setProperty('--app-header-h',top+'px');root.style.setProperty('--app-footer-h',bottom+'px');root.style.setProperty('--app-side-w',left+'px');root.style.setProperty('--detail-height',Math.max(160,innerHeight-top-bottom)+'px');
  if(head!==_appFrameHeader&&typeof ResizeObserver!=='undefined'){_appFrameObserver?.disconnect();_appFrameHeader=head;_appFrameObserver=new ResizeObserver(()=>appFrameSync());if(head)_appFrameObserver.observe(head);}}
function sheetScrollHost(){const host=$('#sheet'),sheet=host?.querySelector('.sheet');return document.documentElement.classList.contains('detail-page-open')&&innerWidth<1100?host:sheet||host;}
function sheetScrollY(){return sheetScrollHost()?.scrollTop||0;}
function sheetScrollTo(y){const e=sheetScrollHost();if(e)e.scrollTop=y;}
function detailViewKey(sh){const label=sh.getAttribute('aria-label')||'상세';let target='';if(sh.matches('.ngt'))target=[UI.ngt?.k,UI.ngt?.id];else if(sh.matches('.negw'))target=[UI.negWin?.k,UI.negWin?.id];else if(sh.matches('.psh'))target=[UI.sheet,UI.ptab||'abil'];else if(sh.matches('.cast'))target=UI.cast?.g;else if(sh.matches('.manager-profile'))target=UI.mgrCandidate;else if(UI.person)target=UI.person;else if(UI.teamSh!=null)target=UI.teamSh;else if(UI.game!=null)target=UI.game;return JSON.stringify([label,target]);}
function detailPageSync(el){
  const sh=el&&el.querySelector('.sheet,.cast'),active=!!sh,cast=sh?.classList.contains('cast');
  const was=document.documentElement.classList.contains('detail-page-open');
  if(active&&!was)UI._detailReturn={y:scrollY,tab:UI.tab,focus:document.activeElement};
  document.documentElement.classList.toggle('detail-page-open',active);
  document.documentElement.classList.toggle('cast-page-open',!!cast);
  if(!cast&&typeof Match3D!=='undefined')Match3D.dispose();
  document.querySelectorAll('#app main.content,#app .subhead,#app .fmmain,#app .dshell>.gut').forEach(e=>{e.inert=active;});appFrameSync();
  if(active){
    const key=detailViewKey(sh);UI._detailKey=key;sh.dataset.detailKey=key;
    let history=UI._detailStack;if(!was||!history)history=UI._detailStack=[];const index=history.findIndex(x=>x.key===key);
    if(index>=0)history.length=index+1;else{history.push({key,y:0});if(history.length>24)history.shift();}
    const position=history[history.length-1];
    sh.classList.add('detail-page'); sh.setAttribute('role','region'); sh.removeAttribute('aria-modal');
    const scrim=sh.closest('.scrim'); if(scrim){scrim.classList.add('detail-page-wrap');scrim.removeAttribute('data-a');}
    const bar=document.createElement('nav');bar.className='detail-navigation';bar.setAttribute('aria-label','상세 화면 이동');
    bar.innerHTML='<button class="btn small detail-back" data-a="detailBack">‹ 뒤로</button><span>이전 화면으로 · Esc</span>';
    if(!cast)sh.prepend(bar);
    if(UI.stamp){ document.querySelectorAll('#app .stamp-w').forEach(x=>x.remove()); el.insertAdjacentHTML('beforeend',stampView()); }
    UI._detailPendingScroll=position.y;
    if(UI.ngt&&sh.classList.contains('ngt')&&UI._ngtY!=null){UI._detailPendingScroll=UI._ngtY;UI._ngtY=null;}
  }else if(was){
    const ret=UI._detailReturn;UI._detailReturn=null;UI._detailKey=null;UI._detailStack=null;UI._detailPendingScroll=null;
    if(UI.stamp&&!document.querySelector('.stamp-w'))$('#app').insertAdjacentHTML('beforeend',stampView());
    if(ret&&ret.tab===UI.tab){scrollTo(0,ret.y);if(ret.focus&&ret.focus.isConnected)ret.focus.focus({preventScroll:true});}
  }
}
function renderSheet(){ const el=$('#sheet');rememberReading(el); const had=el&&!!el.querySelector('.sheet');const old=el?.querySelector('.sheet,.cast'),position=UI._detailStack?.at(-1);if(old&&position&&position.key===old.dataset.detailKey)position.y=sheetScrollY(); renderSheet0(); detailPageSync(el); UI._rN=(UI._rN||0)+1; try{ document.documentElement.classList.toggle('modal-open',!!(el&&el.querySelector('.scrim,.sheet'))); }catch(e){} /* 창이 열리면 뒤 화면 스크롤 잠금(아이폰에서 고정 창 터치 위치가 어긋나는 것 방지) */ try{ autoLink(el); }catch(e){} if(had){ const sh=el.querySelector('.sheet'); if(sh)sh.classList.add('noanim'); } markHints(el); try{ twPager(); workspaceFit(); workspaceDetail(); }catch(e){} if(UI._detailPendingScroll!=null){sheetScrollTo(UI._detailPendingScroll);UI._detailPendingScroll=null;}restoreReading(el);if(UI.meet)meetWire(); }
function renderSheet0(){
  const el=$('#sheet');
  if(!G){ el.innerHTML=''; return; }
  if(UI.matchPreview){el.innerHTML=matchEntrySheet();return;}
  if(UI.fmKeys){el.innerHTML=fmKeysSheet();return;}
  if(UI.meet&&!UI.menu){el.innerHTML='';return;}
  if(UI.mgrCandidate&&!UI.menu){ el.innerHTML=mgrCandidatePage(); return; }
  if(UI.ngt&&!UI.menu){ const sc=el.querySelector('.ng-rows'); const top=sc?sc.scrollTop:0; el.innerHTML=ngtSheet(); const s2=el.querySelector('.sheet.ngt'); if(s2&&UI._ngtY!=null)s2.scrollTop=UI._ngtY; return; }
  if(UI.negWin&&!UI.menu&&G.players[UI.negWin.id]){ const sc=el.querySelector('.sheet.negw'); const y=sc?sc.scrollTop:0; el.innerHTML=negWinSheet(); const s2=el.querySelector('.sheet.negw'); if(s2&&sc)s2.scrollTop=y; return; }

  if(UI.sheet==null&&UI.game==null&&!UI.posSheet&&cwSheetOn()){ el.innerHTML=cwSheet(); const lg=el.querySelector('#mt-log'); if(lg)lg.scrollTop=lg.scrollHeight; return; } /* 동석 관람 */
  if(UI.cast&&UI.sheet==null&&!UI.menu){ const ex=el.querySelector('.cast'); if(!ex||+ex.dataset.g!==UI.cast.g){ el.innerHTML=castSheet(); castMount(); } return; }
  if(UI.cer&&UI.sheet==null&&!UI.menu){ el.innerHTML=cerSheet(); return; }
  if(UI.ivSh&&UI.sheet==null&&!UI.menu){ el.innerHTML=ivSheet(); return; }
  if(UI.pcmpSh&&UI.sheet==null&&!UI.menu){ el.innerHTML=`<div class="scrim" data-a="closeSheet"><div class="sheet gut" data-stop="1" role="dialog" aria-label="선수 비교"><div class="sheet-head"><h2 class="sec">선수 비교</h2><button class="x" data-a="closeSheet" aria-label="닫기">×</button></div>${pcmpView()}</div></div>`; return; }
  if(UI.cmpSh&&UI.sheet==null&&!UI.menu){ el.innerHTML=`<div class="scrim" data-a="closeSheet"><div class="sheet gut" data-stop="1" role="dialog" aria-label="전력 비교"><div class="sheet-head"><h2 class="sec">전력 비교</h2><button class="x" data-a="closeSheet" aria-label="닫기">×</button></div>${cmpView()}</div></div>`; return; }
  if(UI.menu){ el.innerHTML=menuSheet(); return; }
  if(UI.teamSh!=null&&UI.sheet==null){ el.innerHTML=teamSheet(UI.teamSh); return; }
  if(UI.myRos&&UI.sheet==null){ G.tutFlags=G.tutFlags||{}; G.tutFlags.roster=true; el.innerHTML=myRosterSheet(); return; }
  if(UI.person&&UI.sheet==null){ el.innerHTML=personSheet(UI.person); return; }
  if(UI.game!=null){ el.innerHTML=gameSheet(UI.game); return; }
  if(UI.posSheet){ el.innerHTML=UI.posSheet.includes(':')?teamPosSheet(UI.posSheet):posSheet(UI.posSheet); return; }
  if(UI.wkres&&UI.sheet==null&&!UI.menu){ el.innerHTML=wkResSheet(); return; } /* 경기 결과 정리(박스스코어·선수 정보는 그 위에 뜨고, 닫으면 돌아온다) */
  if(UI.sheet==null){ el.innerHTML=''; return; }
  if(UI.sheet!=null&&!G.players[UI.sheet]&&G.arch&&G.arch[UI.sheet]){ el.innerHTML=archSheet(G.arch[UI.sheet]); return; } /* 리그를 떠난 선수: 보관된 1군 기록 */
  const p=G.players[UI.sheet]; if(!p){UI.sheet=null; el.innerHTML=''; return;}
  const rp=scoutReport(p); const h=curLine(p); const per=period();
  const isFA=G.fa&&G.fa.open&&!G.fa.closed&&G.fa.pool.includes(p.id)&&p.team==null;
  const isFM=p.foreign&&p.team==null&&(G.fmarket||[]).includes(p.id);
  const d=G.draft; const canPick=p.prospect&&d&&!d.done&&d.picks[d.cur].tid===G.user;
  let actions='';
  if(canPick)actions=`<button class="btn primary block" data-a="pick" data-v="${p.id}">${d.picks[d.cur].rd}라운드 ${d.picks[d.cur].no}순위로 지명 · 계약금 약 ${money(bonusOf(d.picks[d.cur].rd,d.picks[d.cur].no,p))}</button>`;
  if(p.fdPool&&G.fd&&!G.fd.done){ const fk=G.fd.picks[G.fd.cur]; actions=`<div class="row" style="gap:6px">${G.fd.open===false?`<button class="btn primary" style="flex:1" data-a="fdOpen">드래프트 시작하기 · 시작해야 지명할 수 있습니다</button>`:fk&&fk.tid===G.user?`<button class="btn primary" style="flex:1" data-a="fdPick" data-v="${p.id}">${fk.rd}라운드 ${fk.no}번째로 지명</button>`:fk?`<button class="btn" style="flex:1" disabled>지금은 ${esc(tshort(fk.tid))} 차례입니다</button>`:''}<button class="btn" data-a="star" data-v="${p.id}">${(G.shortlist||[]).includes(p.id)?'★ 관심 해제':'☆ 관심'}</button></div>`; }
  if(isFA)actions=''; /* 협상은 위쪽 '협상 창 열기'에서 */
  if(isFM){ const err=foreignOpen()?foreignCheck(G.user,p):'지금은 외국인 선수를 영입할 수 없습니다.'; const mid=per==='season'; const repl=mid&&fReplLeft(G.user,p.foreign)<=0;
    actions=''; }
  if(p.team!=null&&p.team!==G.user&&!p.foreign&&!(p.joinY>G.year)){ actions=tradeOpen()?`<button class="btn block" data-a="toTrade" data-v="${p.id}">데려오기 협상</button>`:'<p class="small muted">트레이드 기간이 아닙니다.</p>'; }
  if(isFM)actions+=`<div class="row"><button class="btn" data-a="fwatch" data-v="${p.id}">${fwatchOn(p.id)?'관찰 명단에서 빼기':'대체 후보 관찰 명단에 올리기'}</button>${fwatchOn(p.id)?`<span class="small muted">스카우트 현장 관찰 ${fwatchK(p.id)}% · 스카우트 단독 오차 약 ±${dvSd(rp.cur,rp.sd)} · 기록을 합친 최종 범위 ${(f=>f.mid!=null?`${f.lo}~${f.hi}`:'-')(fScout(p,rp))}(판단에는 이 범위)</span>`:''}</div>${UI.fwMsg?`<p class="small muted">${esc(UI.fwMsg)}</p>`:''}`;
  if(p.team===G.user&&!(p.joinY>G.year)){
    const parts=[];
    parts.push(entryForm(p));
    if(canExtend(p))parts.push('<div id="s-ext"></div>'+`<section class="card"><div class="eyebrow">비FA 다년계약 · ${ctText(p)}</div>${p.extCounter&&p.extCounter.until>=G.day?`<p class="small">역제안이 와 있습니다(${dsh(p.extCounter.until)}까지): ${esc(p.extCounter.terms?termsTxt(p.extCounter.terms,true):`${p.extCounter.years}년 연 ${money(p.extCounter.annual)}`)}</p>`:extNextDay(p)?`<p class="small bad">지난 제안(${dsh((p.extLast||{}).d??G.day)})은 거절됐습니다. 다음 제안은 ${dsh(extNextDay(p))}부터 할 수 있습니다.</p>`:''}${ngtDoor('ext',p)}<p class="small muted">시즌 중 합의는 다음 시즌부터, 시즌이 끝난 뒤~개막 전 합의는 다가오는 시즌부터 적용됩니다. 한 선수와는 일주일에 한 번 협상할 수 있습니다.</p></section>`);
    else if(UI.ext&&UI.ext.id===p.id&&UI.ext.msg)parts.push(`<div class="note ${UI.ext.ok?'good':''}">${esc(UI.ext.msg)}</div>`);
    parts.push(`<div class="row" style="margin-top:14px;justify-content:flex-end">${UI.confirmRel===p.id?`<button class="btn danger" data-a="release" data-v="${p.id}">정말 방출${relCost(p).tot?` (정산 ${money(relCost(p).tot)})`:''}</button><button class="btn" data-a="relCancel">취소</button>`:`<button class="btn danger" data-a="relAsk" data-v="${p.id}">방출</button>`}</div>`);
    actions=parts.join('');
  }
  const status=p.injOut>0?`<span class="pill bad">${esc(injNow(p))} · 복귀까지 약 ${p.injOut>=300?Math.round(p.injOut/30)+'개월':p.injOut+'일'} (${injRetTxt(p)})</span>`:'';
  const injFx=injFxText(p); const injBox=injFx.length?`<div class="injfx"><b>${p.injOut>0?'부상 · 재활 중':'부상 후유증'}</b>${injFx.map(x=>`<div class="small">${x.y}년 ${esc(x.n)}: ${esc(x.t)}</div>`).join('')}<div class="small muted">회복 중인 능력은 1군·2군 실전을 뛰면서 되찾습니다. 1년 이상 걸린 부상과 수술은 일부가 돌아오지 않을 수 있습니다.</div></div>`:'';
  const meas=p.isP?`직구 평균 ${veloOf(p)}km/h · 최고 ${veloMax(p)}km/h`:`타구속도 평균 ${evOf(p)}km/h · 홈→1루 ${runOf(p)}초`;
  const tiles=h?(p.isP?[['ERA',h.outs?pRate(h).era.toFixed(2):'-',1],['WAR',wOf(h,p).toFixed(1),1],['이닝',ipStr(h.outs)],['탈삼진',h.so],[h.sv?'세이브':h.hld?'홀드':'승',h.sv||h.hld||h.w]]
    :[['OPS',h.pa?fmt3(bRate(h).ops):'-',1],['wRC+',h.pa?(wrcPlus(h,h.y)??'-'):'-',1],['WAR',wOf(h,p).toFixed(1),1],['타율',fmt3(bRate(h).avg)],['홈런',h.hr]]):null;
  const where=p.prospect?`드래프트 대상 · ${p.region}`:p.fdPool?`창단 드래프트 후보${p.fdFrom!=null?` · 전 ${tshort(p.fdFrom)}`:''}`:p.foreign&&p.team==null?`외국인 영입 후보 · ${p.nat}`:p.joinY>G.year?`${tname(p.team)} 입단 예정`:tname(p.team??p.faFrom);
  const pt=p.team!=null?team(p.team):null; const pst=pt?`--pt:${tpal(pt)[2]};--pt2:${tpal(pt)[3]}`:'';
  const ownP=p.team===G.user&&!(p.joinY>G.year); const st=careerStory(p);
  const hasM=ownP;
  const tabs=[...(p.prospect||p.fdPool||isFM?[]:[['card','선수 카드'],['abil','능력']]),...(hasM?[['dev','육성']]:[]),['sum','요약'],['rec','기록'],...(!p.prospect&&!p.fdPool&&!isFM?[['analysis','분석']]:[]),...(st?[['story','이야기']]:[]),...(hasM?[['mgmt','관리']]:[])]; /* 능력(정보) 다음에 육성(보직·훈련·전환·연수) */
  let T=UI.ptab||'abil'; if(!tabs.some(t=>t[0]===T))T='sum';
  const fullProfile=!p.prospect&&!p.fdPool&&!isFM;
  const tabBar=`<select class="player-tab-select" data-a="playerTab" aria-label="선수 화면 선택">${tabs.map(([k,l])=>`<option value="${k}" ${T===k?'selected':''}>${l}</option>`).join('')}</select><div class="seg ptabs">${tabs.map(([k,l])=>`<button data-a="ptab" data-v="${k}" class="${T===k?'on':''}">${l}</button>`).join('')}</div>`;
  el.innerHTML=`<div class="scrim" data-a="closeSheet"><div class="sheet gut psh pf-screen${T==='card'?' collection-mode':''}${T==='sum'||T==='abil'?' psh2':''}" style="${pst}" role="dialog" aria-modal="true" aria-label="${esc(p.name)} 선수 정보" data-stop="1">
   ${fullProfile?'<div class="pf-topnav">':''}
   ${fullProfile?(T==='card'?collectionHeader(p):playerFullscreenHeader(p,rp,where,isFA)):`   <div class="sheet-head"><div class="row" style="flex-wrap:nowrap;align-items:flex-start">${avImg(p,true)}<div><div class="eyebrow">${where}${isFA?' · FA':''}${p.foreign&&p.team!=null?` · ${p.foreign==='아시아'?'아시아쿼터':'외국인'} · ${p.nat}`:''}</div>
    <h2 class="sec" style="font-size:24px">${p.team!=null?`<span class="pno" title="등번호">${jno(p)}</span>`:''}${esc(p.name)}${condChip(p)}<button class="pe-b" data-a="pEditOpen" data-v="${p.id}" title="이름·등번호 고치기">고치기</button></h2>${UI.pEdit===p.id?pEditBox(p):''}${p.aw&&p.aw.length?`<div class="row" style="gap:4px;margin:2px 0">${p.aw.slice(-6).map(a=>`<span class="awp">${awArt(a,18)}${esc(a)}</span>`).join('')}</div>`:''}
    <p class="pinfo keep"><b class="pinfo-pos">${posLabel(p)}</b>${!p.isP&&typeof subsOf==='function'&&subsOf(p).length?`<span class="pinfo-sub">(${subsOf(p).map(k=>POSK[k]||k).join('·')} 가능)</span>`:''} · <b>${p.age}세</b> · ${hand(p)}${p.foreign?'':` · ${p.college?'대졸':'고졸'} · ${esc(milText(p))}`}${p.draft?` · ${p.draft.y} ${p.draft.rd}R ${p.draft.no}순위`:''}${p.dev?' · 육성선수 출신':''}</p></div></div><button class="tc-i pcmp-b${(UI.pcmp||[]).includes(p.id)?' on':''}" data-a="pcmpTg" data-v="${p.id}" title="같은 시즌·같은 군 기준으로 2~3명을 나란히 비교">${(UI.pcmp||[]).includes(p.id)?'비교에서 빼기':`비교에 담기${(UI.pcmp||[]).length?` (${(UI.pcmp||[]).length}/3)`:''}`}</button>${(UI.pcmp||[]).length>=2?'<button class="tc-i go" data-a="pcmpOpen">비교 보기</button>':''}<button class="x" data-a="closeSheet" aria-label="닫기">×</button></div>
   ${keyBar(p,rp,isFA,isFM)}${posValLine(p,rp)}${playerReadout(p,rp)}
   <div class="row">${p.fdPool||fdHideNow(p)?'':`<span class="pill acc">${esc(rp.arch)}</span>`}${rp.role&&!p.fdPool&&!fdHideNow(p)?`<span class="pill">${p.foreign?'올해 예상':'장래'} ${esc(rp.role)}</span>`:''}${status}</div>
   ${quickActs(p)}
   ${isFA?negDoor('fa',p):isFM?negDoor('fm',p):p.team===G.user&&p.foreign&&G.contract&&!G.contract.done&&G.contract.foreignEnd.includes(p.id)&&!G.contract.foreignDrop.includes(p.id)?negDoor('fre',p):''}
`}
   ${tabBar}
   ${fullProfile?'</div>':''}
   ${T==='card'?playerCollectionView(p,rp):''}
   ${T==='sum'?`
   ${staffCardP(p)}
   ${p.team===G.user&&!(p.joinY>G.year)?`<section class="card"><div class="row between"><span class="eyebrow">컨디션</span><span class="small muted">피로 ${Math.round(p.fat||0)} · ${fatText(p)}</span></div>${fatBar(p)}<p class="small">${l10Text(p)||'최근 1군 경기 기록이 없습니다.'}${p.isP?`</p><p class="small">투구 부하: ${esc(loadText(p))}`:''}</p><p class="small muted">연속 출장하면 피로가 쌓여 성적이 떨어지고 부상 위험이 커집니다. 감독은 지친 선수를 쉬게 합니다. ${p.isP?'투수는 투구 수만큼 지치고 체력(스태미나)이 좋을수록 빨리 회복합니다.':'포수는 더 빨리 지칩니다. 체력이 좋을수록 덜 지치고 빨리 회복하며, 시즌 후반 성적 하락도 적습니다.'}</p></section>`:''}
   ${tiles?`<div><div class="eyebrow" style="margin-bottom:6px">${h.y} ${h.lvl==='퓨처스'?'2군':'1군'} 성적</div><div class="tiles">${tiles.map(t=>`<div class="tile${t[2]?' key':''}" data-a="recGo" data-v="${p.isP?'pit':'bat'}:${({OPS:'ops',WAR:'war',타율:'avg',홈런:'hr',타점:'rbi',ERA:'era',이닝:'ip',탈삼진:'so',세이브:'sv',홀드:'hld',승:'w'})[t[0]]||'war'}" role="button" title="리그 순위 보기"><span class="g">${t[1]}</span><span class="l">${t[0]}</span></div>`).join('')}</div></div>`:''}
   ${h&&h.lvl==='퓨처스'?'':fut2Card(p)}
   ${!p.prospect&&h?recent3(p,h.y):''}
   ${p.prospect?`<section class="card"><div class="row between"><span class="eyebrow">아마추어 프로필</span><button class="btn small${(G.shortlist||[]).includes(p.id)?' primary':''}" data-a="star" data-v="${p.id}">${(G.shortlist||[]).includes(p.id)?'★ 관심 선수':'☆ 관심 표시'}</button></div><dl class="kv"><dt>학교</dt><dd>${esc(p.school||'-')} (${p.college?'대학 4년':'고교 3년'})</dd><dt>체격</dt><dd>${p.ht||'-'}cm · ${p.wt||'-'}kg</dd><dt>${p.isP?'최고 구속':'1루 도달'}</dt><dd>${p.isP?amVmax(p)+'km/h <span class="small muted">(아마 대회 측정)</span>':(p.amRun||runOf(p))+'초'}</dd><dt>언론 순위</dt><dd>${p.press||'-'}위</dd><dt>의료 기록</dt><dd>${p.amInj?esc(p.amInj):'특이 사항 없음'}</dd>${(()=>{const sc=bestScout(p.region); return sc&&sc.skill>=3?`<dt>면담 평가</dt><dd>${esc(persText(p))}</dd>`:'';})()}</dl><div class="eyebrow">학년별 기록</div>${amYearTable(p)}${amNotes(p).map(t=>`<p class="small amn">${esc(t)}</p>`).join('')}</section>`:''}
   ${p.prospect||isFM?reportCard(p):''}
   ${hideOvr(p)&&!p.prospect?trackCard(p):''}
   ${!p.prospect&&!isFM?`<dl class="kv"><dt>연봉</dt><dd>${money(p.sal)}</dd><dt>계약</dt><dd>${p.extNext?`다년 합의(${p.extNext.years}년, 다음 시즌부터)`:p.faC?`${ctText(p)} · ${ctSeason()+Math.max(1,p.yrs)-1}시즌까지`:p.foreign?'1년':`단년 · ${ctText(p)}`}</dd>${ctMoneyKv(p)}${p.foreign?'':`<dt>등록 연차</dt><dd>${p.svc}년 (FA 자격 ${faSvc(p)}시즌 · ${p.college?'대졸':'고졸'})</dd><dt>샐러리캡 산정</dt><dd>${isRookie(p)?'신인이라 제외':'포함'}</dd>`}</dl>`:''}
   ${!hasM&&!(p.team!=null&&p.team!==G.user)?actions:''}
   `:''}
   ${T==='abil'?(fullProfile?playerProfileOverview(p,rp,h,tiles,injBox):`
   ${injBox}${pitcherRepertoireCard(p,rp)}${mgrOpinion(p)}${detailCard(p)}${p.isP?'':trackCard(p)}${reportCard(p,true)}
   ${!p.isP?posCard(p,true):''}
   ${hasM?'':growthCard(p)}
   `):''}
   ${T==='dev'?devTab(p):''}
   ${T==='analysis'?playerAnalysisTab(p):''}
   ${T==='rec'?`
   ${pctCard(p)}${hideOvr(p)?'':splitCard(p)}${hideOvr(p)?'':sprayCard(p)}${rollCard(p)}<div><div class="row between" style="margin-bottom:6px"><span class="eyebrow">기록</span><span class="small muted">F는 2군</span></div><div class="tw">${statTable(p)}</div></div>
   ${p.injHist.length?`<p class="small"><b>부상 이력</b> ${p.injHist.map(i=>`${i.y}년 ${i.k?esc(injName(i.k))+' ':''}${i.days}일`).join(' · ')}</p>`:''}
   `:''}
   ${T==='story'?`
   ${st}
   `:''}
   ${T==='mgmt'?`
   <div id="s-bond"></div>${p.team===G.user&&!(p.joinY>G.year)?bondCard(p):''}
   ${actions}
   `:''}
  </div></div>`;
}
function posSheet(pos){
  const d=depth(G.user);
  if(pos==='P'){
    const li=(p,role)=>`<button class="item" data-a="player" data-v="${p.id}"><span class="nm">${role} · ${esc(p.name)} <span class="small muted">${p.age}세</span></span><span class="sub">${esc(scoutReport(p).arch)} · ${statLine(curLine(p),p)}</span><span class="rt num">${money(p.sal)}</span></button>`;
    return `<div class="scrim" data-a="closeSheet"><div class="sheet gut" data-stop="1"><div class="sheet-head"><h2 class="sec">투수진</h2><button class="x" data-a="closeSheet" aria-label="닫기">×</button></div>
      <section class="card"><div class="eyebrow">선발 로테이션</div><div class="list">${d.sp.map((p,i)=>li(p,(i+1)+'선발')).join('')}</div></section>
      <section class="card"><div class="eyebrow">불펜</div><div class="list">${d.pen.map((p,i)=>li(p,i===0?'마무리':i<4?'필승조':'추격조')).join('')}</div></section></div></div>`;
  }
  const cur=d.ln[pos]; const role=p=>d.start.includes(p)?'주전':d.bench.includes(p)?'1군 백업':d.futB.includes(p)?'2군':'부상';
  const ok=p=>pos==='DH'?true:p.pos===pos||subsOf(p).includes(pos);
  const all=playersOf(G.user).filter(p=>!p.isP);
  const cands=all.filter(ok).sort((a,b)=>(b===cur)-(a===cur)||posScore(b,pos)-posScore(a,pos)).slice(0,pos==='DH'?8:99);
  const others=pos==='DH'?[]:all.filter(p=>!ok(p));
  const card=p=>{ const rp=scoutReport(p); const fitv=pos==='DH'?null:clamp(r5(defAt(p,pos)+hn('pf'+pos,p.id)*2),20,80);
    return pcard(p,{rp,on:cur&&cur.id===p.id,mark:role(p),sub:`${pos==='DH'?posLabel(p):p.pos===pos?'주 포지션':'서브 포지션'} · ${p.age}세 · ${hand(p)}`,
      tags:pos==='DH'?'':`<span class="pill">이 자리 수비 ${fitv}</span>`,stat:`${bLine(p)}`,foot:`<span>${esc(useText(p))}</span><button class="tc-i" data-a="player" data-v="${p.id}">프로필</button>`}); };
  return `<div class="scrim" data-a="closeSheet"><div class="sheet gut" data-stop="1">
    <div class="sheet-head"><div><div class="eyebrow">포지션 · 감독 결정</div><h2 class="sec">${POSK[pos]}</h2><p class="small muted">${pos==='DH'?'타격이 좋은 순으로 보여 줍니다.':`이 자리를 맡을 수 있는 선수 ${cands.length}명 (주 포지션·서브 포지션)`}</p></div><button class="x" data-a="closeSheet" aria-label="닫기">×</button></div>
    <div class="tgrid">${cands.map(card).join('')||'<p class="small muted">이 포지션을 맡을 선수가 없습니다. 영입이 필요합니다.</p>'}</div>
    ${cands.length<=1&&pos!=='DH'?'<div class="note bad">이 포지션은 백업이 없습니다. 주전이 다치면 다른 포지션 선수가 무리해서 맡게 됩니다.</div>':''}
    ${others.length?`<details><summary class="small muted" style="cursor:pointer">이 자리를 맡기 어려운 선수 ${others.length}명 보기</summary><div class="list">${others.map(p=>`<button class="item" data-a="player" data-v="${p.id}"><span class="nm">${esc(p.name)} <span class="small muted">${POSS[p.pos]} · ${p.age}세</span></span><span class="sub">${bLine(p)}</span></button>`).join('')}</div></details>`:''}
  </div></div>`;
}
function teamPosSheet(v){
  const [tid,pos]=v.split(':'); const t=+tid; const d=depth(t);
  const arr=pos==='P'?d.sp.concat(d.pen):playersOf(t).filter(p=>!p.isP&&(p.pos===pos||subsOf(p).includes(pos)||d.ln[pos]===p)).sort((a,b)=>posScore(b,pos)-posScore(a,pos));
  return `<div class="scrim" data-a="closeSheet"><div class="sheet gut" data-stop="1"><div class="sheet-head"><div><div class="eyebrow">${tname(t)}</div><h2 class="sec">${pos==='P'?'투수진':POSK[pos]}</h2></div><button class="x" data-a="closeSheet" aria-label="닫기">×</button></div>
    <section class="card"><div class="list">${arr.map(p=>playerRow(p)).join('')}</div></section></div></div>`;
}
function offerForm(p){
  const cur=(UI.offer&&UI.offer.id===p.id)?UI.offer:(G.fa.offers[p.id]||p.ask); const ann=cur.annual, yrs=cur.years;
  const min=round5(p.ask.annual*.6), max=round5(p.ask.annual*1.6); const n=Object.keys(G.fa.ai[p.id]||{}).length;
  const comp=p.faFrom===G.user?'원소속 구단이라 보상 없음':p.faGrade==='A'?`보상: 보호 ${COMP.A.prot}명 외 1명 + ${money(p.faPrevSal*2)}, 또는 선수 없이 ${money(p.faPrevSal*3)} (상대 선택)`:p.faGrade==='B'?`보상: 보호 ${COMP.B.prot}명 외 1명 + ${money(p.faPrevSal)}, 또는 선수 없이 ${money(p.faPrevSal*2)} (상대 선택)`:`보상: 현금 ${money(Math.round(p.faPrevSal*1.5))}만`;
  return `<section class="card"><div class="eyebrow">FA 조건 제시 · 선수 요구 ${p.ask.years}년 연 ${money(p.ask.annual)} · 관심 구단 ${n}곳</div>
    <label class="small" for="offA">연봉 <b class="num" id="offAv">${money(ann)}</b></label>
    <input type="range" id="offA" min="${min}" max="${max}" step="5" value="${ann}" data-a="offA" data-v="${p.id}">
    <div class="seg">${[1,2,3,4,5,6].map(y=>`<button data-a="offY" data-v="${p.id}:${y}" class="${yrs===y?'on':''}">${y}년</button>`).join('')}</div>
    <p class="small sdesc"><span id="offTot">총액 ${money(ann*yrs)}</span> · ${comp}</p>
    ${G.day<G.fa.openDay?'<p class="small muted">11월 6일부터 선수가 제안을 검토합니다.</p>':''}
    <div class="row"><button class="btn primary" data-a="offer" data-v="${p.id}">${G.fa.offers[p.id]?'조건 수정':'제시하기'}</button>${G.fa.offers[p.id]?`<button class="btn danger" data-a="unoffer" data-v="${p.id}">철회</button>`:''}</div></section>`;
}
function extForm(p){
  /* 슬라이더 범위는 에이전트 요구 수준을 기준으로 잡는다(요구액까지 올릴 수 있게) */
  const dem=y=>round5(extDemand(p,y)*agExtMul(p)); const e=UI.ext&&UI.ext.id===p.id?UI.ext:{id:p.id,years:4,annual:round5(Math.max(p.sal,dem(4)*.92)),msg:''};
  UI.ext=e; const d=dem(e.years);
  const min=round5(Math.max(MIN_SAL,Math.min(p.sal,d*.5))), max=round5(Math.max(d*1.6,p.sal*1.5,min+100));
  const agk=hasAgent(p)?agRel(agentOf(p)):50; const est=round5(d*(1+(agk>=60?0:agk>=40?.03:.06)+hn('xe'+G.year,p.id)*.02));
  const ag=hasAgent(p)?agentOf(p):null;
  return `<section class="card"><div class="eyebrow">비FA 다년계약 제안 · ${ctText(p)}</div>
    ${ag?`<div class="tgm" style="margin:6px 0">${agAv(ag)}<div><b>${esc(ag.name)} 에이전트 · ${esc(ag.firm)}</b><span class="agl">${agLine(ag)}</span><span class="small muted">${esc((AG_STYLE[ag.style]||AG_STYLE.rel).d)}${agExtTestMarket(p)?' FA를 1년 앞둔 대어라 시장 평가를 받아 보려 합니다.':''}</span></div></div>`:'<p class="small muted">에이전트 없이 선수 본인과 협상합니다.</p>'}
    <label class="small" for="extA">연봉 <b class="num" id="extAv">${money(e.annual)}</b></label>
    <input type="range" id="extA" min="${min}" max="${max}" step="5" value="${e.annual}" data-a="extA" data-v="${p.id}">
    <div class="seg">${[2,3,4,5,6].map(y=>`<button data-a="extY" data-v="${p.id}:${y}" class="${e.years===y?'on':''}">${y}년</button>`).join('')}</div>
    ${(()=>{ const X=extParts(p,e.years); const ytf=Math.max(0,faSvc(p)-(p.svc||0)); const st=(period()==='season'||period()==='post')?G.year+1:sponSeason(); const en=st+e.years-1;
      return `<div class="note ext-cmp small"><div><b>이 계약</b> ${st}~${en}년 · ${e.years>ytf?`FA가 됐을 시즌 ${e.years-ytf}년 포함`:'FA 전 시즌만 묶음'} · 보장 총액 ${money(e.annual*e.years)}(부상·성장 정체에도 그대로 나감)</div><div><b>계약하지 않으면</b> FA까지 ${ytf}시즌은 해마다 연봉 협상(성적 따라 오르내림) · FA 때 예상 몸값 연 ${money(Math.round(X.expFA))} 안팎</div></div>`; })()}
    <p class="small muted"><span id="extTot">총액 ${money(e.annual*e.years)}</span> · ${e.years}년 기준 예상 요구 연 <b>${money(est)}</b> 안팎(친분이 높을수록 정확) · 시즌 중 합의는 다음 시즌부터, 시즌이 끝난 뒤~개막 전 합의는 다가오는 시즌부터 적용됩니다. 한 선수와는 일주일에 한 번 협상할 수 있습니다.</p>
    ${e.msg?`<div class="note ${e.ok?'good':''}">${esc(e.msg)}</div>`:''}
    ${p.extCounter&&p.extCounter.until>=G.day?`<button class="btn primary" data-a="extAcc" data-v="${p.id}">역제안 수락 (${p.extCounter.years}년 연 ${money(p.extCounter.annual)})</button> `:''}<button class="btn ${p.extCounter&&p.extCounter.until>=G.day?'':'primary'}" data-a="extOffer" data-v="${p.id}">제안하기</button></section>`;
}


/* FA 영입 설득 카드: 근거 2개까지, 약속(선택), 승인 가능성 */
function pitchCard(p){ if(G.unemp||team(G.user).indie)return ''; const I=pitchInfo(p.id); if(!I)return ''; const st=UI.pitch&&UI.pitch.id===p.id?UI.pitch:(UI.pitch={id:p.id,args:[],cmts:[]});
  const B=bossOf(G.user); const t=team(G.user); const od=pitchOdds(p.id,st.args,st.cmts);
  const lv=v=>v>=.7?'강함':v>=.4?'보통':v>0?'약함':'해당 없음';
  const argB=Object.entries(PITCH_ARG).map(([k,a])=>`<button class="pa${st.args.includes(k)?' on':''}" data-a="pitchArg" data-v="${k}" ${I.S[k]<=0?'disabled':''}><b>${a.l}</b><span>${a.d}</span><em>근거 ${lv(I.S[k])} · 회장 관심 ${I.w[k]>=.9?'높음':I.w[k]>=.5?'보통':'낮음'}</em></button>`).join('');
  const cmtB=Object.entries(PITCH_CMT).map(([k,c])=>`<label class="chk"><input type="checkbox" data-a="pitchCmt" data-v="${k}" ${st.cmts.includes(k)?'checked':''}> ${c.l}</label>`).join('');
  const blocked=!I.capOK?`샐러리캡을 넘습니다(남은 캡 ${money(I.capRoom)}).`:I.done?'올해 이미 보고했습니다.':!ownAskLeft()?'이번 달에는 이미 구단주에게 요청했습니다.':'';
  return `<section class="card pitch"><div class="row between"><h3 class="sec">구단주 설득: 영입 자금 요청</h3><span class="small muted">${esc(B.own.name)} 회장 · ${OWNER[t.owner].label} · 신뢰 ${t.trust}</span></div>
    <p class="small">요구 연봉 <b>${money(I.amt)}</b> · 지금 예산 여유 ${money(I.room)}${I.need>0?` · <b class="bad">${money(I.need)} 부족</b>`:' · 예산 안에서 가능'} · 남은 캡 ${money(I.capRoom)}</p>
    <p class="small muted">${I.slot} 리그 ${I.rank}위 자리${I.gap>0?`, 지금 주전보다 능력 +${Math.round(I.gap)}`:''}. 근거를 2개까지 고르세요. 근거의 힘은 실제 기록·나이·순위로 정해지고, 회장 성향에 맞는 근거가 잘 먹힙니다.</p>
    <div class="pag">${argB}</div>
    <div class="eyebrow" style="margin-top:6px">약속(선택) · 다음 시즌 구단주 목표에 들어갑니다</div><div class="row" style="gap:10px;flex-wrap:wrap">${cmtB}</div>
    <div class="row between" style="margin-top:8px"><span class="small">승인 가능성 <b>${Math.round(od*100)}%</b> · ${oddsTxt(od)}</span><button class="btn primary small" data-a="pitchGo" data-v="${p.id}" ${blocked||!st.args.length?'disabled':''}>회장에게 보고</button></div>
    ${blocked?`<p class="small bad">${blocked}</p>`:''}${UI.pitchMsg&&UI.pitchMsg.id===p.id?`<div class="note">${esc(UI.pitchMsg.t)}</div>`:''}</section>`; }

/* 최근 3년 한눈에: 한 해 기록의 운(컨디션·타구 운)을 걸러 보게 한다 */
function recent3(p,y){ const R=recentLines(p,y,3); if(R.length<2)return '';
  const row=x=>{ const h=x.h; if(p.isP){ const ip=h.outs/3, era=h.er*9/ip, fip=(13*(h.hr||0)+3*((h.bb||0)+(h.hbp||0))-2*h.so)/ip+3.2; const d=era-fip; return `<tr><td>${x.y}</td><td>${x.lvl===1?'1군':'2군'}</td><td class="num">${era.toFixed(2)}</td><td class="num">${fip.toFixed(2)}</td><td class="num ${d<=-.6?'lk':d>=.6?'ul':''}">${d>0?'+':''}${d.toFixed(2)}</td><td class="num">${ipStr(h.outs)}</td></tr>`; }
    const r=bRate(h), bp=(h.h-h.hr)/Math.max(1,h.ab-h.so-h.hr); return `<tr><td>${x.y}</td><td>${x.lvl===1?'1군':'2군'}</td><td class="num">${fmt3(r.ops)}</td><td class="num">${wrcPlus(h,x.y)??'-'}</td><td class="num">${fmt3(r.avg)}</td><td class="num">${h.hr}</td><td class="num ${bp>=.34?'lk':bp<=.27?'ul':''}">${fmt3(bp)}</td><td class="num">${h.pa}</td></tr>`; };
  return `<div class="r3"><div class="eyebrow">최근 ${R.length}년</div><table class="r3t"><thead><tr><th>시즌</th><th></th>${p.isP?'<th>ERA</th><th>FIP</th><th>ERA−FIP</th><th>이닝</th>':'<th>OPS</th><th>wRC+</th><th>타율</th><th>홈런</th><th>BABIP</th><th>타석</th>'}</tr></thead><tbody>${R.map(row).join('')}</tbody></table>
    <p class="small muted">${p.isP?'ERA−FIP가 크게 음수면 평균자책점이 탈삼진·볼넷·피홈런으로 본 기대보다 낮았던 해, 양수면 높았던 해입니다. 수비와 타구 결과의 영향을 함께 봐야 합니다.':'BABIP(인플레이 타구 안타 비율)가 .340을 넘거나 .270 아래면 리그 평균과 차이가 큰 해입니다. 타구 특성·주력·표본을 함께 봐야 합니다.'} 한 해만 튀는지, 해마다 비슷한지를 여러 시즌으로 비교해 보세요.</p></div>`; }

/* 창단 드래프트 후보: 종합 등급 대신 스카우트(툴)·데이터팀(기록) 의견을 나란히 */
function fdKeyBar(p){ const S=fdScoutTools(p); const d=fdData(p);
  const box=(l,v,sub)=>`<div class="kb"><span>${l}</span><b>${v}</b>${sub?`<i>${sub}</i>`:''}</div>`;
  return `<div class="kbar fdk">${box('스카우트 · 툴',esc(fdScoutLine(p)),`${S.ht}cm · ${S.wt}kg`)}${box('데이터팀 · 기록',esc(fdDataLine(p,G.fd.y-1)),'최근 3년 실제 기록 기준')}${(()=>{ const v=fdPotEst(p); return v==null?'':box('장래성',`<span style="color:${rcol(v)}">${GRD(v)}</span>`,`최대 예상(${fdPeakAge(p)>p.age?fdPeakAge(p)+'세 무렵 전성기':'이미 전성기'}) · 스카우트 추정${p.age<=24?' · 어려서 오차 큼':''}`); })()}${box('연봉',money(p.sal||0),tContract(p))}</div>
    <div class="fdop">${S.L.map(t=>`<span class="fdtg" style="--c:${fdGc(t.g)}">${t.l} <b>${t.g}</b></span>`).join('')}</div>`; }
