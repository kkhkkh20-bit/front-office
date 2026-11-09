/* ---------- 모든 인물 카드: 능력 · 성격 · 관계 ----------
   관계도에 있는 사람(구단주·사장·감독·코치·다른 구단 단장·에이전트)에 더해 스카우트·전력분석원·기자·다른 구단 감독·다른 구단 스태프도
   같은 카드 형식으로 연다. 카드 위쪽에 능력(막대), 성격(특징), 관계(단장과의 수치와 주변 인물)를 공통으로 보여 준다 */
function pcBar(l,v,inv){ const c=Math.round(clamp(v,0,100)); return `<div class="pab"><span>${esc(l)}</span><i><b style="width:${c}%;background:${inv?rcol(20+(100-c)*.6):rcol(20+c*.6)}"></b></i><em class="num">${c}</em></div>`; }
const sk100=s=>Math.round(20+s*16); /* 별 1~5 → 100점 척도 */
function personX(k){ const [kind,a,b]=String(k).split(':');
  if(kind==='sc'||kind==='an'){ const s=(kind==='sc'?G.scouts:anaList()).find(x=>x.id===a); if(!s)return null; stAttr(s);
    return {k,name:s.name,role:kind==='sc'?`스카우트 · ${SROLE[s.role||'am']} ${s.role==='intl'?IREG[s.region].l:s.region||''}`:`전력분석원 · ${AROLE[s.role].l}`,av:{persona:'staff',role:kind==='sc'?'scout':'ana',pid:s.id,team:G.user,age:s.age,name:s.name},rel:staffRel(s,G.user,'gm'),rl:'단장 관계',lab:relLabel(staffRel(s,G.user,'gm')),sub:`${s.age}세 · 연 ${money(s.sal)}${s.car?' · '+s.car:''}`}; }
  if(kind==='rep'){ const r=repById(a); if(!r)return null; return {k,name:r.name,role:`${r.outlet} 기자 · ${r.field}`,av:{persona:'agent',pid:r.id+r.name,age:r.age,female:r.female,expr:relEx(r.rel),name:r.name},rel:Math.round(r.rel),rl:'관계',lab:relLabel(r.rel),sub:`${PR_STYLE[r.style].l} · 영향력 ${'★'.repeat(r.inf)}`}; }
  if(kind==='omgr'){ const m=G.mgr[+a]; if(!m)return null; mgrFix(m); return {k,name:m.name,role:`${tname(+a)} 감독`,av:{persona:'mgr',pid:m.id,team:+a,age:m.age,name:m.name},rel:null,lab:mgrType(m).n,sub:m.career||''}; }
  if(kind==='ob'||kind==='abr'||kind==='xmgr')return personGone(kind,a,k);
  if(kind==='ost'){ const L=stInit()[+b]; const s=L&&(a==='sc'?L.sc:L.an).find(x=>x.id===String(k).split(':')[3]); if(!s)return null; stAttr(s);
    return {k,name:s.name,role:`${tname(+b)} ${a==='sc'?'스카우트':'전력분석원'}`,av:{persona:'staff',role:a==='sc'?'scout':'ana',pid:s.id,team:+b,age:s.age,name:s.name},rel:null,lab:`구단 충성도 ${Math.round(s.loy)}`,sub:`${s.age}세 · 연 ${money(s.sal)}`}; }
  return null; }
/* 카드 공통 상단: 능력·성격·관계 */
function personTop(k){const staff=staffPerson(k);if(staff)return (staff.kind==='coach'?coachAbBox(staff.s):'')+staffBioBox(staff.s,staff.kind,staff.tid,true); const [kind,a]=String(k).split(':'); const t=team(G.user); let ab=[], pe=[], li=[], sty='';
  if(kind==='own'){ const w=OWNER[t.owner].w; ab=[['순위 중시',w[0]*100],['재정 중시',w[2]*100],['여론 중시',w[3]*100]]; pe=[[OWNER[t.owner].label,OWNTRAIT[t.owner]]]; li=[['사장',bossOf(G.user).ceo.name+' (예산 집행 창구)'],['단장',`신뢰 ${Math.round(t.trust)}`]]; }
  else if(kind==='ceo'){ const B=bossOf(G.user); const c=u01('ceoP',B.ceo.id); ab=[['예산 재량',40+c*40],['현장 이해',30+u01('ceoQ',B.ceo.id)*50]]; pe=[[c>.5?'진취적':'보수적',c>.5?'투자에 비교적 열려 있습니다.':'지출 하나하나를 따집니다.']]; li=[['구단주',bossOf(G.user).own.name+'의 뜻을 전합니다']]; }
  else if(kind==='mgr'||kind==='omgr'||kind==='xmgr'){ const m=kind==='mgr'?G.mgr[G.user]:kind==='xmgr'?exMgrOf(a):G.mgr[+a]; if(m){ mgrAttr(m); const ty=mgrType(m);
      ab=[['장악력',m.disc],['운영',m.tac],['안목',m.eye],['휴식 관리',m.rest]]; sty=mgrStyleBox(m);
      pe=[[ty.n,ty.d],[`말투 · ${MV[mgrVoice(m)].l}`,MV[mgrVoice(m)].d],[m.ego>=70?'고집 셈':m.ego<=35?'유연함':'보통 고집',m.ego>=70?'단장 지시를 잘 받아들이지 않습니다.':'단장 지시를 비교적 받아들입니다.'],...(m.fame>=70?[['스타 감독','이름값으로 팬과 언론의 관심을 끕니다.']]:[])];
      if(kind==='mgr'&&G.coach){ const C=coachesOf(G.user); const cl=CKEYS.filter(r=>C[r]&&C[r].clan===m.id).map(r=>C[r].name); if(cl.length)li.push(['감독 사단',cl.join(', ')]); }
      if(kind==='mgr'){ const fav=playersOf(G.user).filter(p=>p.promise&&p.promise.until>=G.day).map(p=>p.name); if(fav.length)li.push(['출전 약속한 선수',fav.join(', ')]); } } }
  else if(kind==='c'){ const c=coachesOf(G.user)[a]; if(c){ ab=[['지도력',c.sk],['육성',c.dv]]; const h=u01('cpers',c.id); pe=[[h<.33?'원칙형':h<.66?'소통형':'열정형',h<.33?'규율을 중시합니다.':h<.66?'선수와 대화를 많이 합니다.':'훈련량이 많고 목소리가 큽니다.']]; } }
  else if(kind==='gm'){ const g=gmOf(+a); if(g){ pe=[[GMT[g.trait].l,GMT[g.trait].d],...(gmVoice(g)?[[`말투 · ${GMV[gmVoice(g)].l}`,GMV[gmVoice(g)].d]]:[])]; const A=gmAbil(g)||{eye:50,neg:50,plan:50,money:50}; ab=[['선수 보는 눈',A.eye],['협상력',A.neg],['구단 설계',A.plan],['재정 운영',A.money]]; const rc=gmRecord(+a); li=[['구단',tname(+a)],...(g.age?[['나이',`${g.age}세`]]:[]),...(gmCon(g,+a)?[['계약',`연봉 ${money(gmCon(g,+a).sal)} · ${gmCon(g,+a).y1}년까지`]]:[]),['단장과 친분',String(team(+a).rel)],['재임',rc&&rc.n?`${rc.n}시즌 평균 ${rc.avg.toFixed(1)}위${rc.ch?` · 우승 ${rc.ch}회`:''}`:`${g.since}년 취임`]]; } }
  else if(kind==='agt'){ const ag=agById(+a); if(ag){ const st=AG_STYLE[ag.style]||AG_STYLE.rel; pe=[[st.l,st.d],[AG_SIZE[ag.size],ag.size==='big'?'대형 고객이 많고 자존심이 셉니다.':'고객 수가 적고 실속을 챙깁니다.']]; ab=[['협상력',ag.size==='big'?80:ag.size==='mid'?62:48],['시장 정보',ag.size==='big'?75:55]];
      const cl=(faLive()?agClients(ag):[]).map(p=>p.name); if(cl.length)li.push(['FA 고객',cl.join(', ')]); li.push(['우리와 계약',`${(ag.deals&&ag.deals[G.user])||0}건`]); } }
  else if(kind==='sc'||kind==='an'||kind==='ost'){ const x=personX(k); const s=kind==='ost'?((stInit()[+String(k).split(':')[2]]||{})[a==='sc'?'sc':'an']||[]).find(z=>z.id===String(k).split(':')[3]):(kind==='sc'?G.scouts:anaList()).find(z=>z.id===a); if(s){
      ab=[['실력',sk100(s.skill)],['경험(나이)',clamp((s.age-25)*2.2,10,95)]]; pe=[[s.amb>=65?'야망가':s.amb<=35?'안정 추구':'보통',s.amb>=65?'더 큰 구단을 원합니다. 다른 구단 제안에 흔들리기 쉽습니다.':s.amb<=35?'지금 자리에 만족하는 편입니다.':'조건이 좋으면 움직입니다.'],...(s.spec?[[SC_SPEC[s.spec],'그 유형 선수를 볼 때 한 단계 정확합니다.']]:[]),...(s.region?[[`${s.region} 연고`,'연고 지역 구단을 선호합니다.']]:[])];
      li=[['소속',kind==='ost'?tname(+String(k).split(':')[2]):tname(G.user)],['근속 충성도',String(Math.round(s.loy))]]; void x; } }
  else if(kind==='rep'){ const r=repById(a); if(r){ ab=[['영향력',r.inf*20],['단장과 관계',r.rel]]; pe=[[PR_STYLE[r.style].l,PR_STYLE[r.style].d],[r.field,'주로 다루는 분야입니다.']]; if(r.last)li.push(['최근 변화',`${dsh(r.last.d)} ${r.last.why} ${r.last.dv>0?'+':''}${r.last.dv}`]); li.push(['인터뷰',`관계 70 이상이면 다른 구단 동향을 귀띔해 줍니다.`]); } }
  if(!ab.length&&!pe.length&&!li.length)return '';
  return `<div class="pcard">${sty?`<div class="pc-sec"><div class="eyebrow">성향</div>${sty}</div>`:''}${ab.length?`<div class="pc-sec"><div class="eyebrow">능력</div>${ab.map(([l,v,inv])=>pcBar(l,v,inv)).join('')}</div>`:''}${pe.length?`<div class="pc-sec"><div class="eyebrow">성격</div>${pe.map(([l,d])=>`<div class="pc-tr"><span class="pill">${esc(l)}</span><span class="small">${esc(d)}</span></div>`).join('')}</div>`:''}${li.length?`<div class="pc-sec"><div class="eyebrow">관계</div>${li.map(([l,d])=>`<div class="pc-li"><span class="small muted">${esc(l)}</span><span class="small">${esc(d)}</span></div>`).join('')}</div>`:''}</div>`; }
/* ---------- 리그를 떠났거나 자리를 옮긴 사람: OB(은퇴 선수)·해외파·물러난 감독 ----------
   "어디 갔는지"만 글로 나오던 사람도 같은 인물 창으로 연다. 창에는 지금 하는 일과 이미 남아 있는 경력·기록만 보여 준다 */
function exMgrOf(id){ return (G.mmarket||[]).find(x=>x.id===id)||(G.exMgr||[]).find(x=>x.id===id)||null; }
function abrOf(id){ return (G.abroad||[]).find(z=>String(z.id)===String(id))||null; }
/* 선수 시절 기록을 열 수 있으면 그 버튼(현역이면 선수 창, 떠났으면 보관 기록) */
const pgRecBtn=(id,l)=>id!=null&&(G.players[id]||(G.arch&&G.arch[id]))?`<button class="btn primary" data-a="player" data-v="${id}">${l}</button>`:'';
function personGone(kind,a,k){ const P=s=>`<p class="small">${s}</p>`, L=a=>a.length?`<ul class="ps-l">${a.map(s=>`<li>${s}</li>`).join('')}</ul>`:'';
  if(kind==='ob'){ const o=obOf(a); if(!o)return null; const w=obWhere(o);
    const tys=Object.entries(o.tys||{}).filter(([,v])=>v&&v.ys).map(([t,v])=>`${esc(tshort(+t))} ${v.ys}시즌${v.war?` · WAR ${v.war}`:''}`);
    const job=[o.cy?`지도자 ${o.cy}년`:'',o.sy?`스카우트 ${o.sy}년`:'',o.fy?`프런트 ${o.fy}년`:'',o.my?`해설 ${o.my}년`:''].filter(Boolean).join(' · ');
    const m=w.k==='mgr'?G.mgr[w.tid]:null;
    const info=P(`선수 시절: ${tys.length?tys.join(' / '):`${esc(tshort(o.team))} ${o.ys}시즌`}`)+P(`통산 1군 ${o.seasons}시즌 · WAR ${o.war}${o.awards?` · 수상 ${o.awards}회`:''}${o.hof?' · 명예의 전당':''}${o.retNo?` · ${o.no}번 영구결번`:''}`)
      +P(`${o.retY}년 은퇴 · ${OBPATH[o.path]}의 길${o.aim?` · ${o.aim==='mgr'?'감독':'단장'}을 꿈꿈`:''}${job?` · 은퇴 뒤 ${job}`:''}`)+(m?P(`감독: ${esc(m.career||'')}`):'')
      +((o.log||[]).length?`<div class="ps-s"><div class="eyebrow">발자취</div>${L((o.log||[]).slice(-6).reverse().map(x=>`${x.y} · ${esc(x.t)}`))}</div>`:'');
    return {k,name:o.name,role:w.t,av:obAvO(o,w),rel:null,lab:obMine(o)?'우리 구단 출신':`${tshort(o.team)} 출신`,sub:`${o.pos} · ${o.retY}년 은퇴 · ${o.age}세`,info,
      acts:[pgRecBtn(o.fid,'선수 시절 기록'),obMine(o)?`<button class="btn" data-a="go" data-v="club:ob">구단 OB</button>`:''].filter(Boolean)}; }
  if(kind==='abr'){ const r=abrOf(a); if(!r)return null; const yrs=(r.back?r.backY:G.year)-(r.y1??r.y+1)+1; let pj=null; try{ pj=r.pj?JSON.parse(r.pj):null; }catch(e){}
    const av=G.players[r.id]||pj||{id:r.id,name:r.name,age:r.age,isP:r.isP,foreign:r.foreign};
    const info=P(`${r.from!=null?`${esc(tshort(r.from))} · `:''}${r.y}년 ${esc(r.how)} → <b>${esc(r.club)}(${esc(r.lg)})</b> ${r.yrs}년 ${r.amt*r.yrs}만 달러${r.fee?` · 포스팅 비용 ${money(r.fee)}`:''}`)
      +(r.back?P(`${r.backY}년 KBO 복귀`):'')+`<div class="ps-s"><div class="eyebrow">해외 성적</div>${r.lines.length?L(r.lines.map(l=>`${l.y} ${esc(l.lvl)}: ${lineTxt(l,r.isP)}`)):'<p class="small muted">아직 해외 시즌 기록이 없습니다.</p>'}</div>`;
    return {k,name:r.name,role:r.back?`${r.backY}년 KBO 복귀`:`${r.lg} ${r.club}`,av,rel:null,lab:r.back?'복귀':r.foreign?'역수출':`해외 ${Math.max(0,yrs)}년차`,sub:`${r.pos} · ${r.foreign?r.age+(G.year-r.y):av.age}세${r.foreign?' · 외국인':''}`,info,
      acts:[pgRecBtn(r.id,G.players[r.id]?'선수 정보':'KBO 시절 기록')].filter(Boolean)}; }
  if(kind==='xmgr'){ const m=exMgrOf(a); if(!m)return null; mgrFix(m); const inM=(G.mmarket||[]).includes(m);
    return {k,name:m.name,role:inM?'감독 후보':'쉬고 있는 전 감독',av:{persona:'mgr',pid:m.id,age:m.age,name:m.name},rel:null,lab:mgrType(m).n,sub:`${m.age}세 · ${m.career||''}`,
      info:P(`${esc(mgrStyle(m))}`)+(m.exT!=null?P(`${m.exY}년 ${esc(tshort(m.exT))} 감독에서 물러났습니다.${inM?' 지금 감독 시장에 나와 있습니다.':' 1년 넘게 쉬면 감독 시장에 다시 나옵니다.'}`):''),
      acts:inM?[`<button class="btn primary" data-a="go" data-v="staff:mgr">감독 후보 보기</button>`]:[]}; }
  return null; }
/* 리그를 떠난 선수 줄을 누르면: OB면 인물 창, 해외파면 해외파 창, 보관 기록만 있으면 기록 창 */
/* 선수 줄 공통: 지금 리그에 있으면 선수 창, 떠났으면 해외파·OB·보관 기록 창(카페 11-09c: 포스팅 간 선수가 메일·이동 기록에서 안 열렸다) */
function pAttr(pid){ return pid!=null&&G.players[pid]?` data-a="player" data-v="${pid}" role="button" tabindex="0"`:goneAttr(pid); }
function goneAttr(pid,ob){ if(pid==null)return ''; const v=ob?`ob:${ob.id}`:abrOf(pid)?`abr:${pid}`:null; const at=(a,x)=>` data-a="${a}" data-v="${x}" role="button" tabindex="0"`;
  return v?at('person',v):G.arch&&G.arch[pid]?at('player',pid):''; }
