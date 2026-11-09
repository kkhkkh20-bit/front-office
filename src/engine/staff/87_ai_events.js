/* ===== 다른 구단 사정: 기강 사고 · 출전 불만 · 감독 불화설 =====
 우리 구단처럼 다른 구단도 실제 상태에서 일이 생긴다(무작위 사건이 아님):
 - 기강 사고: 그 구단 기강(주장 성향·감독 규율, climateOf)이 느슨할수록 잦다. 프로의식이 낮은 선수가 사고를 친다.
 - 출전 불만: 주전급 능력인데 기회를 못 받아 기분이 크게 떨어진 선수. 심하면 트레이드를 요청해 매물로 나온다(급매).
 - 감독 불화설: 예상보다 크게 처진 구단의 고집 센 감독. 시즌 중 경질 가능성이 커진다.
 리그 소식(구단 사정)에 쌓이고, 우리 전략에 쓸 만한 큰 일(트레이드 요청, 불화설)은 소식함으로도 온다 */
function aiTeamWeek(){ if(period()!=='season'||!G.cal||G.day<G.cal.open+14)return; for(const t of G.teams){ if(t.id===ME())continue; try{ aiDisc(t); }catch(e){} try{ aiGripe(t); }catch(e){} try{ aiRift(t); }catch(e){} } }
function aiDisc(t){ const cl=climateOf(t.id); const ch=cl.band==='loose'?.04+.1*(40-cl.S)/40:clamp(.01+(62-cl.S)*.0015,.006,.035); if(R()>=ch)return; /* 느슨할수록 잦고, 보통 구단도 한 시즌에 한두 번은 생긴다 */
  const ps=domestic(t.id).filter(p=>!p.ys&&healthy(p)&&!isAway(p)&&((p.pers&&p.pers.pro)||10)<=11); const p=ps.length?pick(ps):null; if(!p)return;
  const k=pick([['늦은 귀가','벌금'],['SNS 논란','벌금'],['훈련 불참','3일 출장 정지']]); p.mor=clamp((p.mor??60)-4,0,100); if(k[1]!=='벌금')p.susp=Math.max(p.susp||0,G.day+gDays(3));
  story(p,`${G.year} ${k[0]}로 구단 징계(${k[1]})`,'inj'); wire('구단 사정',`${tshort(t.id)} ${p.name}, ${k[0]}로 구단 징계(${k[1]}) · 선수단 기강 ${cl.S}`,{tid:t.id,ref:p.id}); }
function aiGripe(t){ const d=depth(t.id); const reg=new Set([...d.start,...d.sp,...d.pen.slice(0,4)].map(p=>p.id));
  const wasReg=q=>{ const h=seasonTotalT(q,G.year-1,'1군',t.id); return !!h&&((h.pa||0)>=300||(h.outs||0)>=240); }; /* 작년 주전이었는데 올해 밀린 선수, 또는 주전급 능력인데 기회가 없는 선수 */
  const p=domestic(t.id).filter(q=>!q.ys&&healthy(q)&&!reg.has(q.id)&&(ovr(q)>=55||wasReg(q))&&(q.mor??60)<45&&q.gripeY!==G.year).sort((a,b)=>ovr(b)-ovr(a))[0]; if(!p||R()>.3)return;
  p.gripeY=G.year; const big=ovr(p)>=58||(p.mor??60)<28; if(big&&!hasNtc(p)){ p.aiListed=true; p.aiWhy='mood'; p.aiLd=G.day; p.aiUrg=true; }
  wire('구단 사정',`${tshort(t.id)} ${p.name}(${posLabel(p)}, ${p.age}세), 출전 기회 불만${big?' · 트레이드 요청':''}`,{tid:t.id,ref:p.id});
  if(big&&!G.unemp&&hasNtc(p))mail('전력분석팀',`${tshort(t.id)} ${p.name} 트레이드 요청`,`${tname(t.id)}의 ${p.name}(${posLabel(p)}, ${p.age}세, 능력 ${dv(Math.round(ovr(p)))})이 주전 기회를 받지 못해 트레이드를 요청했습니다. 다만 트레이드 거부권이 있어 구단이 매물로 내놓지는 않았습니다. 데려오려면 본인 동의가 필요합니다.`,{kind:'트레이드',acts:[{l:'선수 보기',a:'player',v:p.id}]});
  else if(big&&!G.unemp)mail('전력분석팀',`${tshort(t.id)} ${p.name} 트레이드 요청`,`${tname(t.id)}의 ${p.name}(${posLabel(p)}, ${p.age}세, 능력 ${dv(Math.round(ovr(p)))})이 주전 기회를 받지 못해 트레이드를 요청했고, 구단도 매물로 내놓았습니다. 연봉 ${money(p.sal)}${p.faC?` · 남은 계약 ${p.yrs}년`:''}.\n상대가 팔아야 하는 처지라 평소보다 덜 주고 데려올 수 있습니다.`,{kind:'트레이드',acts:[{l:'선수 보기',a:'player',v:p.id}]}); }
function aiRift(t){ if(t.riftY===G.year)return; const r=G.sea.rec[t.id]; if(!r||r.w+r.l<30)return; const m=G.mgr[t.id]; if(!m||m.interim||m.act)return; mgrFix(m);
  const st=standingsNow(); const rk=st.findIndex(x=>x.tid===t.id)+1; const pr=(G.proj||[]).indexOf(t.id)+1; if(!pr||rk-pr<4||m.ego<62||R()>.25)return;
  t.riftY=G.year; wire('구단 사정',`${tshort(t.id)} ${m.name} 감독과 선수단 불화설 · 예상 ${pr}위 → 지금 ${rk}위`,{tid:t.id});
  if(!G.unemp)mail('전력분석팀',`${tshort(t.id)} 감독 불화설`,`${tname(t.id)}이(가) 시즌 전 예상(${pr}위)보다 크게 처진 ${rk}위입니다. 고집 센 ${m.name} 감독과 선수단 사이가 틀어졌다는 말이 돕니다. 시즌 중 감독 교체 가능성이 커졌고, 구단이 방향을 바꾸면 베테랑이 매물로 나올 수 있습니다.`,{kind:'트레이드'}); }
