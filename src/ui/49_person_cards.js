/* ---------- 모든 인물 카드: 능력 · 성격 · 관계 ----------
   관계도에 있는 사람(구단주·사장·감독·코치·다른 구단 단장·에이전트)에 더해 스카우트·전력분석원·기자·다른 구단 감독·다른 구단 스태프도
   같은 카드 형식으로 연다. 카드 위쪽에 능력(막대), 성격(특징), 관계(단장과의 수치와 주변 인물)를 공통으로 보여 준다 */
function pcBar(l,v,inv){ const c=Math.round(clamp(v,0,100)); return `<div class="pab"><span>${esc(l)}</span><i><b style="width:${c}%;background:${inv?rcol(20+(100-c)*.6):rcol(20+c*.6)}"></b></i><em class="num">${c}</em></div>`; }
const sk100=s=>Math.round(20+s*16); /* 별 1~5 → 100점 척도 */
function personX(k){ const [kind,a,b]=String(k).split(':');
  if(kind==='sc'||kind==='an'){ const s=(kind==='sc'?G.scouts:anaList()).find(x=>x.id===a); if(!s)return null; stAttr(s);
    return {k,name:s.name,role:kind==='sc'?`스카우트 · ${SROLE[s.role||'am']} ${s.role==='intl'?IREG[s.region].l:s.region||''}`:`전력분석원 · ${AROLE[s.role].l}`,av:{persona:'staff',pid:s.id,team:G.user,age:s.age,name:s.name},rel:Math.round(s.loy),rl:'충성도',lab:s.loy>=70?'구단 사람':s.loy>=40?'자리 잡음':'아직 손님',sub:`${s.age}세 · 연 ${money(s.sal)}${s.car?' · '+s.car:''}`}; }
  if(kind==='rep'){ const r=repById(a); if(!r)return null; return {k,name:r.name,role:`${r.outlet} 기자 · ${r.field}`,av:{persona:'agent',pid:r.id+r.name,age:r.age,female:r.female,expr:relEx(r.rel),name:r.name},rel:Math.round(r.rel),rl:'관계',lab:relLabel(r.rel),sub:`${PR_STYLE[r.style].l} · 영향력 ${'★'.repeat(r.inf)}`}; }
  if(kind==='omgr'){ const m=G.mgr[+a]; if(!m)return null; mgrFix(m); return {k,name:m.name,role:`${tname(+a)} 감독`,av:{persona:'mgr',pid:m.id,team:+a,age:m.age,name:m.name},rel:null,lab:mgrType(m).n,sub:m.career||''}; }
  if(kind==='ost'){ const L=stInit()[+b]; const s=L&&(a==='sc'?L.sc:L.an).find(x=>x.id===String(k).split(':')[3]); if(!s)return null; stAttr(s);
    return {k,name:s.name,role:`${tname(+b)} ${a==='sc'?'스카우트':'전력분석원'}`,av:{persona:'staff',pid:s.id,team:+b,age:s.age,name:s.name},rel:null,lab:`구단 충성도 ${Math.round(s.loy)}`,sub:`${s.age}세 · 연 ${money(s.sal)}`}; }
  return null; }
/* 카드 공통 상단: 능력·성격·관계 */
function personTop(k){ const [kind,a]=String(k).split(':'); const t=team(G.user); let ab=[], pe=[], li=[], sty='';
  if(kind==='own'){ const w=OWNER[t.owner].w; ab=[['순위 중시',w[0]*100],['재정 중시',w[2]*100],['여론 중시',w[3]*100]]; pe=[[OWNER[t.owner].label,OWNTRAIT[t.owner]]]; li=[['사장',bossOf(G.user).ceo.name+' (예산 집행 창구)'],['단장',`신뢰 ${Math.round(t.trust)}`]]; }
  else if(kind==='ceo'){ const B=bossOf(G.user); const c=u01('ceoP',B.ceo.id); ab=[['예산 재량',40+c*40],['현장 이해',30+u01('ceoQ',B.ceo.id)*50]]; pe=[[c>.5?'진취적':'보수적',c>.5?'투자에 비교적 열려 있습니다.':'지출 하나하나를 따집니다.']]; li=[['구단주',bossOf(G.user).own.name+'의 뜻을 전합니다']]; }
  else if(kind==='mgr'||kind==='omgr'){ const m=kind==='mgr'?G.mgr[G.user]:G.mgr[+a]; if(m){ mgrAttr(m); const ty=mgrType(m);
      ab=[['장악력',m.disc],['운영',m.tac],['안목',m.eye],['휴식 관리',m.rest]]; sty=mgrStyleBox(m);
      pe=[[ty.n,ty.d],[`말투 · ${MV[mgrVoice(m)].l}`,MV[mgrVoice(m)].d],[m.ego>=70?'고집 셈':m.ego<=35?'유연함':'보통 고집',m.ego>=70?'단장 지시를 잘 받아들이지 않습니다.':'단장 지시를 비교적 받아들입니다.'],...(m.fame>=70?[['스타 감독','이름값으로 팬과 언론의 관심을 끕니다.']]:[])];
      if(kind==='mgr'&&G.coach){ const C=coachesOf(G.user); const cl=CKEYS.filter(r=>C[r]&&C[r].clan===m.id).map(r=>C[r].name); if(cl.length)li.push(['감독 사단',cl.join(', ')]); }
      if(kind==='mgr'){ const fav=playersOf(G.user).filter(p=>p.promise&&p.promise.until>=G.day).map(p=>p.name); if(fav.length)li.push(['출전 약속한 선수',fav.join(', ')]); } } }
  else if(kind==='c'){ const c=coachesOf(G.user)[a]; if(c){ ab=[['지도력',c.sk],['육성',c.dv]]; const h=u01('cpers',c.id); pe=[[h<.33?'원칙형':h<.66?'소통형':'열정형',h<.33?'규율을 중시합니다.':h<.66?'선수와 대화를 많이 합니다.':'훈련량이 많고 목소리가 큽니다.']]; } }
  else if(kind==='gm'){ const g=gmOf(+a); if(g){ pe=[[GMT[g.trait].l,GMT[g.trait].d]]; ab=[['협상력',45+u01('gmN',g.id)*45],['선수 보는 눈',40+(9-(team(+a).scoutSd||6))*8]]; li=[['구단',tname(+a)],['단장과 친분',String(team(+a).rel)]]; } }
  else if(kind==='agt'){ const ag=agById(+a); if(ag){ const st=AG_STYLE[ag.style]||AG_STYLE.rel; pe=[[st.l,st.d],[AG_SIZE[ag.size],ag.size==='big'?'대형 고객이 많고 자존심이 셉니다.':'고객 수가 적고 실속을 챙깁니다.']]; ab=[['협상력',ag.size==='big'?80:ag.size==='mid'?62:48],['시장 정보',ag.size==='big'?75:55]];
      const cl=(faLive()?agClients(ag):[]).map(p=>p.name); if(cl.length)li.push(['FA 고객',cl.join(', ')]); li.push(['우리와 계약',`${(ag.deals&&ag.deals[G.user])||0}건`]); } }
  else if(kind==='sc'||kind==='an'||kind==='ost'){ const x=personX(k); const s=kind==='ost'?((stInit()[+String(k).split(':')[2]]||{})[a==='sc'?'sc':'an']||[]).find(z=>z.id===String(k).split(':')[3]):(kind==='sc'?G.scouts:anaList()).find(z=>z.id===a); if(s){
      ab=[['실력',sk100(s.skill)],['경험(나이)',clamp((s.age-25)*2.2,10,95)]]; pe=[[s.amb>=65?'야망가':s.amb<=35?'안정 추구':'보통',s.amb>=65?'더 큰 구단을 원합니다. 다른 구단 제안에 흔들리기 쉽습니다.':s.amb<=35?'지금 자리에 만족하는 편입니다.':'조건이 좋으면 움직입니다.'],...(s.spec?[[SC_SPEC[s.spec],'그 유형 선수를 볼 때 한 단계 정확합니다.']]:[]),...(s.region?[[`${s.region} 연고`,'연고 지역 구단을 선호합니다.']]:[])];
      li=[['소속',kind==='ost'?tname(+String(k).split(':')[2]):tname(G.user)],['근속 충성도',String(Math.round(s.loy))]]; void x; } }
  else if(kind==='rep'){ const r=repById(a); if(r){ ab=[['영향력',r.inf*20],['단장과 관계',r.rel]]; pe=[[PR_STYLE[r.style].l,PR_STYLE[r.style].d],[r.field,'주로 다루는 분야입니다.']]; if(r.last)li.push(['최근 변화',`${dsh(r.last.d)} ${r.last.why} ${r.last.dv>0?'+':''}${r.last.dv}`]); li.push(['인터뷰',`관계 70 이상이면 다른 구단 동향을 귀띔해 줍니다.`]); } }
  if(!ab.length&&!pe.length&&!li.length)return '';
  return `<div class="pcard">${sty?`<div class="pc-sec"><div class="eyebrow">성향</div>${sty}</div>`:''}${ab.length?`<div class="pc-sec"><div class="eyebrow">능력</div>${ab.map(([l,v,inv])=>pcBar(l,v,inv)).join('')}</div>`:''}${pe.length?`<div class="pc-sec"><div class="eyebrow">성격</div>${pe.map(([l,d])=>`<div class="pc-tr"><span class="pill">${esc(l)}</span><span class="small">${esc(d)}</span></div>`).join('')}</div>`:''}${li.length?`<div class="pc-sec"><div class="eyebrow">관계</div>${li.map(([l,d])=>`<div class="pc-li"><span class="small muted">${esc(l)}</span><span class="small">${esc(d)}</span></div>`).join('')}</div>`:''}</div>`; }
