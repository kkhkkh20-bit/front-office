/* ---------- 모든 인물 카드: 능력 · 성격 · 관계 ----------
   관계도에 있는 사람(구단주·사장·감독·코치·다른 구단 단장·에이전트)에 더해 스카우트·전력분석원·기자·다른 구단 감독·다른 구단 스태프도
   같은 카드 형식으로 연다. 카드 위쪽에 능력(막대), 성격(특징), 관계(단장과의 수치와 주변 인물)를 공통으로 보여 준다 */
function pcBar(l,v,inv){ const c=Math.round(clamp(v,0,100)); return `<div class="pab"><span>${esc(l)}</span><i><b style="width:${c}%;background:${inv?rcol(20+(100-c)*.6):rcol(20+c*.6)}"></b></i><em class="num">${c}</em></div>`; }
const sk100=s=>Math.round(20+s*16); /* 별 1~5 → 100점 척도 */
function personX(k){ { const e=personXExt(k); if(e)return e; } const [kind,a,b]=String(k).split(':');
  if(kind==='sc'||kind==='an'){ const s=(kind==='sc'?G.scouts:anaList()).find(x=>x.id===a); if(!s)return null; stAttr(s);
    return {k,name:s.name,role:kind==='sc'?`스카우트 · ${SROLE[s.role||'am']} ${s.role==='intl'?IREG[s.region].l:s.region||''}`:`전력분석원 · ${AROLE[s.role].l}`,av:{persona:'staff',role:kind==='sc'?'scout':'ana',pid:s.id,team:G.user,age:s.age,name:s.name},rel:staffRel(s,G.user,'gm'),rl:'단장 관계',lab:relLabel(staffRel(s,G.user,'gm')),sub:`${s.age}세 · 연 ${money(s.sal)}${s.car?' · '+s.car:''}`}; }
  if(kind==='c'){const s=coachesOf(G.user)[a]||staffOwned('coach',String(k).slice(2));if(!s)return null;return {k,name:s.name,role:(s.ax?'보조 ':'')+(CROLE[s.role]?.l||'코치'),av:{persona:'coach',pid:s.id,name:s.name,age:s.age,team:G.user},rel:staffRel(s,G.user,'gm'),rl:'단장 관계',lab:relLabel(staffRel(s,G.user,'gm')),sub:`${s.age}세 · 연 ${money(s.sal)}`};}
  if(kind==='rep'){ const r=repById(a); if(!r)return null; return {k,name:r.name,role:`${r.outlet} 기자 · ${r.field}`,av:{persona:'agent',pid:r.id+r.name,age:r.age,female:r.female,expr:relEx(r.rel),name:r.name},rel:Math.round(r.rel),rl:'관계',lab:relLabel(r.rel),sub:`${PR_STYLE[r.style].l} · 영향력 ${'★'.repeat(r.inf)}`}; }
  if(kind==='omgr'){ const m=G.mgr[+a]; if(!m)return null; mgrFix(m); return {k,name:m.name,role:`${tname(+a)} 감독`,av:{persona:'mgr',pid:m.id,team:+a,age:m.age,name:m.name},rel:null,lab:mgrType(m).n,sub:m.career||''}; }
  if(kind==='ob'||kind==='abr'||kind==='xmgr')return personGone(kind,a,k);
  if(kind==='ost'){ const L=stInit()[+b]; const s=L&&(a==='sc'?L.sc:L.an).find(x=>x.id===String(k).split(':')[3]); if(!s)return null; stAttr(s);
    return {k,name:s.name,role:`${tname(+b)} ${a==='sc'?'스카우트':'전력분석원'}`,av:{persona:'staff',role:a==='sc'?'scout':'ana',pid:s.id,team:+b,age:s.age,name:s.name},rel:null,lab:staffLoyWord(s.loy),sub:`${s.age}세 · 연 ${money(s.sal)}`}; }
  return null; }
/* 카드 공통 상단: 능력·성격·관계 */
function personTop(k){ { const e=personTopExt(k); if(e!=null)return e; }const staff=staffPerson(k);if(staff)return (staff.kind==='coach'?coachBaseStats(staff.s)+coachAbBox(staff.s):'')+staffBioBox(staff.s,staff.kind,staff.tid,true)+networkPersonBlock(staff.s,staff.kind); const [kind,a]=String(k).split(':'); const t=team(G.user); let ab=[], pe=[], li=[], sty='';
  if(kind==='own'){ const w=OWNER[t.owner].w; ab=[['순위 중시',w[0]*100],['재정 중시',w[2]*100],['여론 중시',w[3]*100]]; pe=[[OWNER[t.owner].label,OWNTRAIT[t.owner]]]; li=[['사장',bossOf(G.user).ceo.name+' (예산 집행 창구)'],['단장',`신뢰 ${Math.round(t.trust)}`]]; }
  else if(kind==='ceo'){ const B=bossOf(G.user); const c=u01('ceoP',B.ceo.id); ab=[['예산 재량',40+c*40],['현장 이해',30+u01('ceoQ',B.ceo.id)*50]]; pe=[[c>.5?'진취적':'보수적',c>.5?'투자에 비교적 열려 있습니다.':'지출 하나하나를 따집니다.']]; li=[['구단주',bossOf(G.user).own.name+'의 뜻을 전합니다']]; }
  else if(kind==='mgr'||kind==='omgr'||kind==='xmgr'){ const m=kind==='mgr'?G.mgr[G.user]:kind==='xmgr'?exMgrOf(a):G.mgr[+a]; if(m){ mgrAttr(m); const ty=mgrType(m);
      ab=[['장악력',m.disc],['운영',m.tac],['안목',m.eye],['휴식 관리',m.rest]]; sty=mgrStyleBox(m);
      pe=[[ty.n,ty.d],[`말투 · ${MV[mgrVoice(m)].l}`,MV[mgrVoice(m)].d],[m.ego>=70?'고집 셈':m.ego<=35?'유연함':'보통 고집',m.ego>=70?'단장 지시를 잘 받아들이지 않습니다.':'단장 지시를 비교적 받아들입니다.'],...(m.fame>=70?[['스타 감독','이름값으로 팬과 언론의 관심을 끕니다.']]:[])];
      if(kind==='mgr'&&G.coach){ const C=coachesOf(G.user); const cl=CKEYS.filter(r=>C[r]&&C[r].clan===m.id).map(r=>C[r].name); if(cl.length)li.push(['감독 사단',cl.join(', ')]); }
      if(kind==='mgr'){ const fav=playersOf(G.user).filter(p=>p.promise&&p.promise.until>=G.day).map(p=>p.name); if(fav.length)li.push(['출전 약속한 선수',fav.join(', ')]); } } }
  else if(kind==='c'){ const c=coachesOf(G.user)[a]; if(c){ ab=[['기본 지도',dv(c.sk)],['기본 육성',dv(c.dv)]]; const h=u01('cpers',c.id); pe=[[h<.33?'원칙형':h<.66?'소통형':'열정형',h<.33?'규율을 중시합니다.':h<.66?'선수와 대화를 많이 합니다.':'훈련량이 많고 목소리가 큽니다.']]; } }
  else if(kind==='gm'){ const g=gmOf(+a); if(g){ pe=[[GMT[g.trait].l,GMT[g.trait].d],...(gmVoice(g)?[[`말투 · ${GMV[gmVoice(g)].l}`,GMV[gmVoice(g)].d]]:[])]; const A=gmAbil(g)||{eye:50,neg:50,plan:50,money:50}; ab=[['선수 보는 눈',A.eye],['협상력',A.neg],['구단 설계',A.plan],['재정 운영',A.money]]; const rc=gmRecord(+a); li=[['구단',tname(+a)],...(g.age?[['나이',`${g.age}세`]]:[]),...(gmCon(g,+a)?[['계약',`연봉 ${money(gmCon(g,+a).sal)} · ${gmCon(g,+a).y1}년까지`]]:[]),['단장과 친분',relLabel(team(+a).rel)],['재임',rc&&rc.n?`${rc.n}시즌 평균 ${rc.avg.toFixed(1)}위${rc.ch?` · 우승 ${rc.ch}회`:''}`:`${g.since}년 취임`]]; } }
  else if(kind==='agt'){ const ag=agById(+a); if(ag){ const st=AG_STYLE[ag.style]||AG_STYLE.rel; pe=[[st.l,st.d],[AG_SIZE[ag.size],ag.size==='big'?'대형 고객이 많고 자존심이 셉니다.':'고객 수가 적고 실속을 챙깁니다.']]; ab=[['협상력',ag.size==='big'?80:ag.size==='mid'?62:48],['시장 정보',ag.size==='big'?75:55]];
      const cl=(faLive()?agClients(ag):[]).map(p=>p.name); if(cl.length)li.push(['FA 고객',cl.join(', ')]); li.push(['우리와 계약',`${(ag.deals&&ag.deals[G.user])||0}건`]); } }
  else if(kind==='sc'||kind==='an'||kind==='ost'){ const x=personX(k); const s=kind==='ost'?((stInit()[+String(k).split(':')[2]]||{})[a==='sc'?'sc':'an']||[]).find(z=>z.id===String(k).split(':')[3]):(kind==='sc'?G.scouts:anaList()).find(z=>z.id===a); if(s){
      ab=[['실력',sk100(s.skill)],['경험(나이)',clamp((s.age-25)*2.2,10,95)]]; pe=[[s.amb>=65?'야망가':s.amb<=35?'안정 추구':'보통',s.amb>=65?'더 큰 구단을 원합니다. 다른 구단 제안에 흔들리기 쉽습니다.':s.amb<=35?'지금 자리에 만족하는 편입니다.':'조건이 좋으면 움직입니다.'],...(s.spec?[[SC_SPEC[s.spec],'그 유형 선수를 볼 때 한 단계 정확합니다.']]:[]),...(s.region?[[`${s.region} 연고`,'연고 지역 구단을 선호합니다.']]:[])];
      li=[['소속',kind==='ost'?tname(+String(k).split(':')[2]):tname(G.user)],['구단 애착',staffLoyWord(s.loy)]]; void x; } }
  else if(kind==='rep'){ const r=repById(a); if(r){ ab=[['영향력',r.inf*20],['단장과 관계',r.rel]]; pe=[[PR_STYLE[r.style].l,PR_STYLE[r.style].d],[r.field,'주로 다루는 분야입니다.']]; if(r.last)li.push(['최근 변화',`${dsh(r.last.d)} ${r.last.why} ${r.last.dv>0?'+':''}${r.last.dv}`]); li.push(['인터뷰',`관계 70 이상이면 다른 구단 동향을 귀띔해 줍니다.`]); } }
  const networkSubject=kind==='ob'?obOf(a):kind==='mgr'?G.mgr[G.user]:kind==='omgr'?G.mgr[+a]:kind==='xmgr'?exMgrOf(a):null,network=networkPersonBlock(networkSubject,kind==='ob'?'ob':'mgr');
  if(!ab.length&&!pe.length&&!li.length)return network;
  return `<div class="pcard">${sty?`<div class="pc-sec"><div class="eyebrow">성향</div>${sty}</div>`:''}${ab.length?`<div class="pc-sec"><div class="eyebrow">능력</div>${ab.map(([l,v,inv])=>pcBar(l,v,inv)).join('')}</div>`:''}${pe.length?`<div class="pc-sec"><div class="eyebrow">성격</div>${pe.map(([l,d])=>`<div class="pc-tr"><span class="pill">${esc(l)}</span><span class="small">${esc(d)}</span></div>`).join('')}</div>`:''}${li.length?`<div class="pc-sec"><div class="eyebrow">관계</div>${li.map(([l,d])=>`<div class="pc-li"><span class="small muted">${esc(l)}</span><span class="small">${esc(d)}</span></div>`).join('')}</div>`:''}</div>`+network; }
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
    const m=w.k==='mgr'?G.mgr[w.tid]:null, rn=obRetNoText(o);
    const info=P(`선수 시절: ${tys.length?tys.join(' / '):`${esc(tshort(o.team))} ${o.ys}시즌`}`)+P(`통산 1군 ${o.seasons}시즌 · WAR ${o.war}${o.awards?` · 수상 ${o.awards}회`:''}${o.hof?' · 명예의 전당':''}${rn?` · ${esc(rn)}`:''}`)
      +P(`${o.retY}년 은퇴 · ${OBPATH[o.path]}의 길${o.aim?` · ${o.aim==='mgr'?'감독':'단장'}을 꿈꿈`:''}${job?` · 은퇴 뒤 ${job}`:''}`)+(m?P(`감독: ${esc(m.career||'')}`):'')
      +(()=>{ /* 지도자 평가(질수없뜸 11-12): 은퇴 선수를 코치로 데려올지 판단할 수 있게 지도·육성 수준과 맞는 보직, 강한 지도 분야 */ try{ if(o.sk==null)return ''; const ab=obAb(o,o.isP?'pc':o.pos==='포수'?'cc':'bc'); const R2={stf:'pc',ctl:'pc',sta:'pc',con:'bc',pow:'bc',eye:'bc',def:'dc',spd:'rc',cat:'cc'}; const best=Object.entries(ab).filter(([k])=>R2[k]&&(o.isP?['stf','ctl','sta'].includes(k):!['stf','ctl','sta'].includes(k))).sort((x,y)=>y[1]-x[1])[0]; const role=o.cy>=6&&o.sk>=62?'hc':best?R2[best[0]]:(o.isP?'pc':'bc'); /* 가장 강한 지도 분야의 보직 */ const top=Object.entries(ab).filter(([k])=>CAB[k]).sort((x,y)=>y[1]-x[1]).slice(0,3).map(([k,v])=>`${esc(CAB[k])} ${dv(v)}`).join(' · ');
        const can=o.path==='coach'||o.path==='media'&&o.my>=3||o.cy>0; return `<div class="ps-s"><div class="eyebrow">지도자 평가</div><p class="small">지도 ${rchip(o.sk)} · 육성 ${rchip(o.dv)} · 맞는 보직 ${esc(CROLE[role]?CROLE[role].l:'코치')}${o.cy?` · 지도자 경력 ${o.cy}년`:''}</p>${top?`<p class="small">강한 지도 분야: ${top}</p>`:''}<p class="small">${can?(w.k==='free'?'지금 코치 시장에서 데려올 수 있는 지도자 후보입니다(코치진 → 후보).':'지도자로 일하고 있습니다.'):`${esc(OBPATH[o.path]||'다른')} 길을 가고 있어 지금은 코치 후보가 아닙니다.`} 지도 경력이 쌓이면 수준이 오릅니다.</p></div>`; }catch(e){ return ''; } })()
      +((o.log||[]).length?`<div class="ps-s"><div class="eyebrow">발자취</div>${L((o.log||[]).slice(-6).reverse().map(x=>`${x.y} · ${esc(x.t)}`))}</div>`:'');
    return {k,name:o.name,role:w.t,av:obAvO(o,w),rel:null,lab:obMine(o)?'우리 구단 출신':`${tshort(o.team)} 출신`,sub:`${o.pos} · ${o.retY}년 은퇴 · ${o.age}세`,info,
      acts:[pgRecBtn(o.fid,'선수 시절 기록'),obMine(o)?`<button class="btn" data-a="go" data-v="club:ob">구단 OB</button>`:''].filter(Boolean)}; }
  if(kind==='abr'){ const r=abrOf(a); if(!r)return null; const yrs=(r.back?r.backY:G.year)-(r.y1??r.y+1)+1; let pj=null; try{ pj=r.pj?JSON.parse(r.pj):null; }catch(e){}
    const av=G.players[r.id]||pj||{id:r.id,name:r.name,age:r.age,isP:r.isP,foreign:r.foreign};
    const info=P(`${r.from!=null?`${esc(tshort(r.from))} · `:''}${r.y}년 ${esc(r.how)} → <b>${esc(r.club)}(${esc(r.lg)})</b> ${r.yrs}년 ${r.amt*r.yrs}만 달러${r.fee?` · 포스팅 비용 ${money(r.fee)}`:''}`)
      +(r.back?P(`${r.backY}년 국내 복귀`):'')+`<div class="ps-s"><div class="eyebrow">해외 성적</div>${r.lines.length?L(r.lines.map(l=>`${l.y} ${esc(l.lvl)}: ${lineTxt(l,r.isP)}`)):'<p class="small muted">아직 해외 시즌 기록이 없습니다.</p>'}</div>`;
    return {k,name:r.name,role:r.back?`${r.backY}년 국내 복귀`:`${r.lg} ${r.club}`,av,rel:null,lab:r.back?'복귀':r.foreign?'역수출':`해외 ${Math.max(0,yrs)}년차`,sub:`${r.pos} · ${r.foreign?r.age+(G.year-r.y):av.age}세${r.foreign?' · 외국인':''}`,info,
      acts:[pgRecBtn(r.id,G.players[r.id]?'선수 정보':'국내 시절 기록')].filter(Boolean)}; }
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

/* ===== 모든 것의 카드화(사용자 11-11, FM처럼): 다른 구단 구단주·사장·코치, 치어리더·응원단장·치어리더 팀장, 고등학교와 고교 감독도 같은 인물 창으로 연다 =====
   키: oown:<tid> · oceo:<tid> · oc:<tid>:<역할> · chm:<단원id> · crew:<lead|cap> · hs:<학교> · hsc:<학교>
   creature는 기존 personSheet(07_relation_map)가 그대로 그린다: 이름·역할·사진(av)·한 줄 설명(sub)·정보(info)·버튼(acts) + 위쪽 능력·성격·관계(personTopExt) */
const HS_STY_D={엄격형:'규율과 반복 훈련을 중시합니다. 기본기가 탄탄한 선수가 나옵니다.',자율형:'선수에게 맡기는 편입니다. 개성 있는 선수가 자랍니다.',데이터형:'기록과 영상을 꼼꼼히 봅니다. 귀띔이 구체적입니다.',육성형:'저학년부터 길게 키웁니다. 잠재력 있는 선수를 잘 알아봅니다.'};
function hsCrest(n){ const h=shash('hs'+n)%360; const ch=esc(String(n).slice(0,1)); return 'data:image/svg+xml;utf8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M32 3 58 12v20c0 15-11 25-26 29C17 57 6 47 6 32V12z" fill="hsl(${h} 45% 32%)" stroke="hsl(${h} 50% 70%)" stroke-width="2.5"/><text x="32" y="41" text-anchor="middle" font-size="24" font-weight="700" fill="#fff" font-family="sans-serif">${ch}</text></svg>`); }
function cheerOf(id){ const F=G.fanOps; const S=F&&F.cs; const m=S&&(S.L||[]).find(x=>x.id===+id); return m?{S,m}:null; }
function personXExt(k){ const P=String(k).split(':'), kind=P[0];
  const btn=(l,a,v,pri)=>`<button class="btn ${pri?'primary':''}" data-a="${a}" data-v="${v}">${l}</button>`;
  if(kind==='oown'||kind==='oceo'){ const tid=+P[1]; if(!team(tid))return null; if(tid===G.user)return null; const B=bossOf(tid), t=team(tid), x=kind==='oown'?B.own:B.ceo, ow=OWNER[t.owner];
    return {k,name:x.name,role:`${tname(tid)} ${kind==='oown'?'구단주':'사장'}`,av:{persona:kind==='oown'?'own':'staff',pid:x.id,team:tid,age:x.age,name:x.name},rel:null,lab:kind==='oown'?ow.label:'',sub:`${x.age}세${kind==='oceo'&&x.car?' · '+x.car:''}`,
      info:kind==='oown'?`<p>${esc(OWNTRAIT[t.owner]||ow.msg)}</p><p class="small">올해 목표 ${goalRankOf(tid)}위 이내 · ${modeLabel(t)} · ${t.indie?'독립구단(투자사)':'모기업 구단'}</p>`:`<p class="small">${esc(x.car||'')}. ${esc(B.own.name)} 구단주의 뜻을 단장에게 전하고 예산 집행을 맡습니다.</p>`,
      acts:[btn('구단 정보','lteamGo',tid,1),btn('단장','person','gm:'+tid)]}; }
  if(kind==='oc'){ const tid=+P[1], role=P[2]; const c=G.coach&&coachesOf(tid)[role]; if(!c)return null;
    return {k,name:c.name,role:`${tname(tid)} ${CROLE[role]?.l||'코치'}`,av:{persona:'coach',pid:c.id,team:tid,age:c.age,name:c.name},rel:null,lab:'',sub:`${c.age}세${c.ob?' · OB':''}`,
      acts:[btn('구단 정보','lteamGo',tid,1),...(c.ob&&obOf(c.ob)?[btn('선수 시절','person','ob:'+c.ob)]:[])]}; }
  if(kind==='chm'){ const o=cheerOf(P[1]); if(!o)return null; const {S,m}=o; const img=(G.cimg&&G.cimg['P:cheerm:'+m.id])||(typeof face8Src==='function'&&cheerPh(S,m)!=null?face8Src(cheerPh(S,m)):null);
    const fol=m.fol>=10000?(m.fol/10000).toFixed(1)+'만':String(m.fol);
    return {k,name:m.name,role:`${tname(G.user)} 치어리더`,av:{img,name:m.name},rel:null,lab:'',sub:`${m.age}세 · ${m.yrs?m.yrs+'년차':'신인'} · 팔로워 ${fol}`,
      info:`<p class="small">${m.inj?`부상 ${m.inj}일 · `:''}${m.sl?`슬럼프 ${m.sl}일 · `:''}무대 ${m.app||0}회 · 피로 ${Math.round(m.fat||0)} · 월 수수료 ${money(cheerFee(m,S.ag))}</p>`,acts:[btn('응원단','go','club:fans',1)]}; }
  if(kind==='crew'){ const c=crewOf()[P[1]]; if(!c)return null; const ph=typeof crewPh==='function'?crewPh(c):null; const img=(G.cimg&&G.cimg['P:cheer:'+c.id])||(ph!=null&&typeof face8Src==='function'?face8Src(ph):null);
    return {k,name:c.name,role:`${tname(G.user)} ${CREW_JOB[c.job].l}`,av:{img,name:c.name},rel:null,lab:'',sub:`${c.age}세 · 월 ${money(c.sal)}`,acts:[btn('팬 운영','go','club:fans',1)]}; }
  if(kind==='spn'){ const S=G.spon, c=S&&S.c&&S.c[P[1]]; if(!c||!c.co)return null; const H=(S.hist||[]).filter(h=>h.co===c.co);
    return {k,name:c.co,role:`${SPON_SLOT[P[1]].l} 스폰서 · ${c.ind}`,av:{img:hsCrest(c.co),name:c.co},rel:null,lab:'',sub:`${c.y0}~${c.until} · 연 ${money(c.amt)}`,
      info:`<p class="small">${c.ps?`가을야구 진출 보너스 ${money(c.ps)} · `:''}${c.champ?`우승 보너스 ${money(c.champ)} · `:''}${c.img?'언론 논조가 30 아래면 다음 해 20% 감액 조항':'이미지 조항 없음'}</p>${H.length?`<p class="small muted">지난 계약 ${H.length}건: ${H.map(h=>`${h.y0}~${h.until} ${SPON_SLOT[h.slot].l}`).join(', ')}</p>`:''}`,
      acts:[btn('스폰서','go','club:spon',1)]}; }
  if(kind==='doc'){ const d=teamDoc(); const H=HOSP[(G.med&&G.med.hosp)||'none'], IL=injNowList().filter(x=>x.st==='out');
    return {k,name:d.name,role:`${tname(G.user)} 팀 닥터 · 의무팀장`,av:{persona:'staff',pid:'doc'+G.user,team:G.user,age:d.age,name:d.name},rel:null,lab:'',sub:`${d.age}세 · ${d.car}`,
      info:`<p class="small">제휴 병원: <b>${esc(H.name)}</b> · ${esc(H.d)}</p><p class="small">지금 재활 중 ${IL.length}명${IL.length?`: ${IL.slice(0,6).map(x=>`<button class="lnk" data-a="player" data-v="${x.p.id}">${esc(x.p.name)}</button>`).join(', ')}`:''}</p>`,
      acts:[btn('부상 관리','go','staff:med',1)]}; }
  if(kind==='hs'||kind==='hsc'){ const n=P.slice(1).join(':'); const S=schList()[n]; if(!S)return null; const r=schRel(S);
    const Ls=Object.values(G.players).filter(p=>p.school===n);
    const pros=Ls.filter(p=>p.team!=null&&!p.prospect), cands=Ls.filter(p=>p.prospect);
    const plist=L=>L.slice(0,8).map(p=>`<button class="lnk" data-a="player" data-v="${p.id}">${esc(p.name)}</button>${p.team!=null&&!p.prospect?`<i class="small muted">(${esc(tshort(p.team))})</i>`:''}`).join(' · ');
    if(kind==='hs')return {k,name:n,role:`고교 야구부 · ${S.area}`,av:{img:hsCrest(n),name:n},rel:r,rl:'우리 구단 친분',lab:schRelLbl(r),sub:`전력 ${S.lv} · 감독 ${S.coach?S.coach.name:'공석'}`,
      info:`${cands.length?`<p class="small">올해 드래프트 후보: ${plist(cands)}</p>`:''}${pros.length?`<p class="small">프로에 있는 졸업생 ${pros.length}명: ${plist(pros)}</p>`:'<p class="small muted">아직 프로에 있는 졸업생이 없습니다.</p>'}`,
      acts:[...(S.coach?[btn('고교 감독','person','hsc:'+n,1)]:[]),btn('지역 정보망','go','staff:scouts')]};
    const c=S.coach; if(!c)return null;
    return {k,name:c.name,role:`${n} 감독`,av:{persona:'coach',pid:c.id,age:c.age,name:c.name},rel:r,rl:'우리 구단 친분',lab:schRelLbl(r),sub:`${c.age}세 · ${c.sty}${c.alma?' · 모교 출신':''}`,
      info:`<p class="small">${esc(c.car||'')}</p><p class="small muted">친분은 스카우트 방문·단장 대회 관전·그 학교 선수 지명·후원으로 오릅니다. 높을수록 이 학교 후보 평가 오차가 줄고 귀띔 메일이 옵니다.</p>`,
      acts:[btn('학교','person','hs:'+n,1),...(c.ob&&obOf(c.ob)?[btn('선수 시절','person','ob:'+c.ob)]:[])]}; }
  return null; }
function personTopExt(k){ const P=String(k).split(':'), kind=P[0]; let ab=[], pe=[], li=[];
  if(kind==='oown'){ const tid=+P[1]; if(tid===G.user)return null; const t=team(tid); if(!t)return null; const w=OWNER[t.owner].w; ab=[['순위 중시',w[0]*100],['재정 중시',w[2]*100],['여론 중시',w[3]*100]]; pe=[[OWNER[t.owner].label,OWNTRAIT[t.owner]||'']]; li=[['사장',bossOf(tid).ceo.name],['단장',gmOf(tid)?gmOf(tid).name:'-']]; }
  else if(kind==='oceo'){ const tid=+P[1]; if(tid===G.user)return null; const B=bossOf(tid); const c=u01('ceoP',B.ceo.id); ab=[['예산 재량',40+c*40],['현장 이해',30+u01('ceoQ',B.ceo.id)*50]]; pe=[[c>.5?'진취적':'보수적',c>.5?'투자에 비교적 열려 있습니다.':'지출 하나하나를 따집니다.']]; li=[['구단주',B.own.name]]; }
  else if(kind==='oc'){ const tid=+P[1]; const c=G.coach&&coachesOf(tid)[P[2]]; if(!c)return null; ab=[['기본 지도',dv(c.sk)],['기본 육성',dv(c.dv)]]; const h=u01('cpers',c.id); pe=[[h<.33?'원칙형':h<.66?'소통형':'열정형',h<.33?'규율을 중시합니다.':h<.66?'선수와 대화를 많이 합니다.':'훈련량이 많고 목소리가 큽니다.']]; li=[['감독',G.mgr[tid]?G.mgr[tid].name:'-']]; if(c.clan)li.push(['감독 사단','감독과 함께 온 코치입니다']); }
  else if(kind==='chm'){ const o=cheerOf(P[1]); if(!o)return null; const m=o.m, s=v=>v*5; ab=[['외모·무대 존재감',s(m.vis)],['인기',s(m.pop)],['팬 서비스',s(m.svc)],['댄스',s(m.dance)],['체력',s(m.sta)],['성실',s(m.dil)]]; pe=[[m.pop>=15?'스타 단원':m.yrs>=5?'고참':'성장 중',m.pop>=15?'관중과 SNS의 관심을 끕니다.':m.yrs>=5?'후배를 이끄는 경험이 있습니다.':'무대를 거듭하며 인기가 오릅니다.']]; li=[['대행사',(typeof CHEER_AG!=='undefined'&&CHEER_AG[o.S.ag]&&CHEER_AG[o.S.ag].l)||o.S.ag]]; }
  else if(kind==='crew'){ const c=crewOf()[P[1]]; if(!c)return null; ab=CREW_AT.map(([key,l])=>[l,c[key]*5]); pe=[[c.star>=15?'스타 응원단장':'현장형',c.star>=15?'이름만으로 관중을 부릅니다.':'관중석 분위기를 직접 끌어올립니다.']]; }
  else if(kind==='spn'){ const c=G.spon&&G.spon.c&&G.spon.c[P[1]]; if(!c||!c.co)return null; const yrs=c.until-c.y0+1, left=Math.max(0,c.until-sponSeason()+1); ab=[['계약 규모(기준 대비)',clamp(c.amt/Math.max(1,SPON_SLOT[P[1]].b)*60,5,100)],['남은 기간',yrs?left/yrs*100:0]]; li=[['업종',c.ind],['계약',`${yrs}년 · 연 ${money(c.amt)}`],['남은 해',`${left}년`]]; }
  else if(kind==='doc'){ const hk=(G.med&&G.med.hosp)||'none'; const tier={none:0,c:1,b:2,a:3}[hk]; const d=teamDoc();
    const yc=t=>sum(Object.values(G.players).map(p=>(p.injHist||[]).filter(x=>x.y===G.year&&injTm(p,x)===t).length)); const me=yc(G.user), lg=avg(G.teams.map(t=>yc(t.id)));
    ab=[['검진 정확도',40+tier*20],['재활 지원',35+tier*20],['경력',clamp((d.age-30)*3,20,95)]]; pe=[[d.sty,DOC_STY[d.sty]]]; li=[['올해 부상',`우리 ${me}건 · 리그 평균 ${lg.toFixed(1)}건`],['협업',`${G.mgr[G.user]?G.mgr[G.user].name+' 감독':'감독 공석'}과 선수 기용·휴식을 상의합니다`]]; }
  else if(kind==='hs'){ const S=schList()[P.slice(1).join(':')]; if(!S)return null; ab=[['팀 전력',S.lv],['우리 구단 친분',schRel(S)]]; pe=S.coach?[[S.coach.sty,HS_STY_D[S.coach.sty]||'']]:[]; li=[['권역',S.area],...(S.coach?[['감독',`${S.coach.name} (${S.coach.y0||G.year}년부터)`]]:[])]; }
  else if(kind==='hsc'){ const S=schList()[P.slice(1).join(':')]; const c=S&&S.coach; if(!c)return null; ab=[['지도자 명성',c.rep],['우리 구단 친분',schRel(S)]]; pe=[[c.sty,HS_STY_D[c.sty]||'']]; li=[['학교',`${S.n} · 전력 ${S.lv}`],...(c.from!=null&&team(c.from)?[['연고 구단',tname(c.from)]]:[])]; }
  else return null;
  return `<div class="pcard">${ab.length?`<div class="pc-sec"><div class="eyebrow">능력</div>${ab.map(([l,v])=>pcBar(l,v)).join('')}</div>`:''}${pe.length?`<div class="pc-sec"><div class="eyebrow">성격</div>${pe.map(([l,d])=>`<div class="pc-tr"><span class="pill">${esc(l)}</span><span class="small">${esc(d)}</span></div>`).join('')}</div>`:''}${li.length?`<div class="pc-sec"><div class="eyebrow">관계</div>${li.map(([l,d])=>`<div class="pc-li"><span class="muted small">${esc(l)}</span><span class="small">${esc(d)}</span></div>`).join('')}</div>`:''}</div>`; }

/* 팀 닥터(의무팀장): 의료 효과는 제휴 병원·시설이 정하고, 이 사람은 그 정보를 보여 주는 얼굴이다. 이름·나이·경력은 구단마다 고정(저장 없이 같은 값) */
const DOC_STY={보수형:'복귀를 서두르지 않습니다. 재발을 가장 경계합니다.',적극형:'선수가 빨리 돌아오도록 재활을 몰아붙입니다.',데이터형:'투구 수와 피로 기록을 꼼꼼히 봅니다.'};
function teamDoc(tid){ tid=tid??G.user; const s='doc'+tid+':'+(team(tid).code||tid); return {name:nameH(s),age:40+Math.floor(u01(s,'da')*20),sty:Object.keys(DOC_STY)[Math.floor(u01(s,'ds')*3)],car:['정형외과 전문의','스포츠의학 전문의','재활의학 전문의','대학병원 스포츠의학센터 출신'][Math.floor(u01(s,'dc')*4)]}; }

/* 좋아하는 인물·싫어하는 인물(사용자 11-14, FM의 Favoured/Disliked personnel처럼). 수치 없이 이름과 사유 한 마디만. 규칙은 i 설명에 */
const REL_TIP='함께 일한 시간, 선임과 경질, 식사와 연락, 트레이드 결과, 출전 기회가 쌓여 정해집니다. 오래 만나지 않으면 옅어집니다.\n단장끼리 사이가 좋으면 트레이드가 조금 수월하고, 아주 나쁘면 거래하지 않습니다. 감독·코치를 뽑을 때도 단장이 좋아하는 사람을 조금 더 봅니다.';
function relLikesBox(key){ if(!key||typeof relLikes!=='function')return ''; let R; try{ R=relLikes(key,3); }catch(e){ return ''; } if(!R.like.length&&!R.dis.length)return '';
  const row=x=>`<li>${x.link?`<button class="lnk" data-a="${esc(x.link.a)}" data-v="${esc(x.link.v)}">${esc(x.n)}</button>`:`<b>${esc(x.n)}</b>`} <span class="small muted">${esc(x.r)} · ${esc(x.w)}</span></li>`;
  const sec=(h,L,tip)=>L.length?`<div class="ps-s rel-likes"><div class="eyebrow">${h}${tip?hiI(REL_TIP):''}</div><ul class="ps-l">${L.map(row).join('')}</ul></div>`:'';
  return `<div class="rel-likes-box">${sec('좋아하는 인물',R.like,true)}${sec('싫어하는 인물',R.dis,!R.like.length)}</div>`; }
function relLikesCard(k){ try{ return relLikesBox(relCardKey(k)); }catch(e){ return ''; } }
