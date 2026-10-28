/* ---------- 트레이드 제안 받았을 때: 감독·전력분석팀·스카우트(메디컬)에게 의견 묻기 ----------
   소식함에서 바로 묻고, 답이 제안 카드 아래에 쌓인다. 감독에게 먼저 물으면 존중받았다고 느껴 관계 +1(제안당 한 번) */
function offerAdvise(o,who){ o.adv=o.adv||{}; if(o.adv[who])return; const give=o.get, get=o.give; /* 우리 기준: give=보내는 선수, get=받는 선수 */
  const P=id=>G.players[id]; const L=[];
  if(who==='mgr'){ const m=G.mgr[G.user]; if(!m||m.interim){ o.adv.mgr='감독이 없어 의견을 들을 수 없습니다.'; return; } const mv=mgrTradeView(o.from,give,get);
    let t=mv?mv.txt.replace(/^.*?감독:\s*/,''):'판단은 단장님께 맡기겠습니다.'; mgrAttr(m); const ty=mgrType(m).k;
    const inc=get.map(P).filter(Boolean); if((ty==='dfn'||ty==='combo_d')&&inc.some(p=>!p.isP&&p.r.def>=60))t+=' 수비가 되는 선수라 마음에 듭니다.'; if((ty==='pen_all')&&inc.some(p=>p.isP&&!isSPr(p)))t+=' 불펜 한 장이 더 생기는 건 언제나 환영입니다.'; if(m.youth>=65&&give.map(P).some(p=>p&&p.age<=23))t+=' 다만 어린 선수를 보내는 건 아쉽습니다.';
    o.adv.mgr=`${m.name} 감독: "${mvWrap(m,'need',t)}"`; if(!o.advMgrRel){ o.advMgrRel=1; m.rel=clamp(m.rel+1,0,100); } return; }
  if(who==='ana'){ const lv=dataLv(G.user); const c=tradeCompare(o.from,give,get); const ks=FIELDK.concat(['SP','RP']); const ch=[];
    for(const k of ks){ const b=c.my[0][k], a=c.my[1][k]; if(b==null&&a==null)continue; const d=(a??35)-(b??35); if(Math.abs(d)>=2)ch.push([k,d]); }
    ch.sort((x,y)=>Math.abs(y[1])-Math.abs(x[1]));
    const lab=k=>k==='SP'?'선발진':k==='RP'?'불펜':POSK[k];
    if(lv<=0){ o.adv.ana='전력분석원이 없어 깊이 있는 분석은 어렵습니다. 자리별 전력 변화만 대략 보면 '+(ch.length?ch.slice(0,2).map(([k,d])=>`${lab(k)} ${d>0?'좋아짐':'약해짐'}`).join(', '):'큰 변화가 없습니다')+'.'; return; }
    const sal=sum(get.map(id=>P(id)?P(id).sal:0))-sum(give.map(id=>P(id)?P(id).sal:0)); const war=x=>{ const p=P(x); const h=p&&seasonTotal(p,G.year,'1군'); return h?warOf(h,p):0; };
    const wd=sum(get.map(war))-sum(give.map(war));
    L.push(ch.length?`자리별 주전 전력: ${ch.slice(0,lv>=2?4:2).map(([k,d])=>`${lab(k)} ${d>0?'+':''}${dv(50+d)-dv(50)}`).join(', ')}`:'자리별 주전 전력은 거의 그대로입니다.');
    L.push(`올해 WAR 합계 ${wd>=0?'+':''}${wd.toFixed(1)} · 연봉 ${sal>=0?'+':''}${money(sal)}/년`);
    if(lv>=2){ const yrs=id=>{ const p=P(id); return p?ctrlYears(p):0; }; L.push(`보유 기간: 받는 선수 ${get.map(yrs).join('·')}년 / 보내는 선수 ${give.map(yrs).join('·')}년`); }
    if(lv>=3){ const U=team(G.user); const diff=stackIn(get.map(id=>tval(U,P(id),'in')))-sum(give.map(id=>tval(U,P(id),'out'))); L.push(`데이터 랩 가치 평가: ${diff>=1.5?'우리에게 유리한 거래':diff<=-1.5?'우리가 손해 보는 거래':'대체로 공정한 거래'}`); }
    o.adv.ana=L.join('\n'); return; }
  if(who==='sc'){ for(const id of get){ const p=P(id); if(!p)continue; const rp=scoutReport(p); const md=medReport(p);
      L.push(`${p.name}: 현재 ${rp.cur!=null?dv(rp.cur):'?'}${rp.ofp!=null?` · 잠재력: ${potTier(rp.ofp,rp.cur).l}`:' · 잠재력 판단 불가(담당 스카우트 필요)'} · 몸 상태 ${md.g}${md.L.length?` (${md.L[0]})`:''}${md.sure?'':' · 검진 정확도 낮음'}`); }
    o.adv.sc=L.join('\n')||'받는 선수가 없습니다.'; } }
function offerAdvBox(o){ const A=o.adv||{}; const row=(k,l,who)=>A[k]?`<div class="oadv-r"><span class="pill">${l}</span><span class="small">${esc(A[k])}</span></div>`:`<button class="btn small" data-a="offerAsk" data-v="${o.id}:${k}">${who}</button>`;
  return `<div class="oadv"><div class="eyebrow">결정 전에 의견 듣기</div><div class="oadv-b">${row('mgr','감독','감독 의견 묻기')}${row('ana','전력분석팀','전력분석팀 분석')}${row('sc','스카우트·의무','스카우트·메디컬 확인')}</div>
    <button class="btn small" data-a="offerCounter" data-v="${o.id}">조건 바꿔 역제안하기</button></div>`; }
