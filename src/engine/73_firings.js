/* ===== 다른 구단 단장·감독 교체를 기사로 =====
 단장도 계약이 끝나고 다른 구단으로 옮기는 사람이라, 리그의 단장·감독 교체는 리그 소식(한 줄)뿐 아니라 기사로도 나온다.
 AI 구단 감독은 계약 만료 말고도 성적이 나쁘면 시즌 뒤 경질되고, 시즌 중(6~8월 1일) 최하위권이면 감독대행 체제로 바뀌기도 한다.
 (실제 리그에서도 성적 부진에 따른 시즌 중 감독 교체·자진 사퇴와 감독대행 체제는 드물지 않다) */
function gmFireNews(t,old,rk,ten,age,succ){ const why=age>=64&&rk<6?`${age}세로 물러났습니다`:`지난 시즌 ${rk}위에 그친 책임을 물었습니다${ten>=4?`(재임 ${ten}년)`:''}`;
  news('리그',`${tshort(t.id)}, ${old} 단장 ${age>=64&&rk<6?'퇴임':'경질'}${succ?` · 후임 ${succ.name}`:''}`,`${tname(t.id)}이(가) ${old} 단장과 결별했습니다. ${why}. ${succ?`새 단장은 ${succ.name}(${succ.car||'프런트 출신'}, ${GMT[succ.trait]?GMT[succ.trait].l:''})입니다.`:'후임을 물색 중이며, 다른 구단 출신이나 야인 단장에게도 연락하고 있다는 이야기가 나옵니다.'}`,0); }
function mgrNew(tid,act){ const n=(!act&&(()=>{ try{ return obAiMgr(tid); }catch(e){ return null; } })())||mkMgr(); n.yrs=act?1:(n.yrs||ri(2,3)); if(act)n.act=true; G.mgr[tid]=n;
  if(!act){ n.clan=n.ob?[]:mkClan(n); if(G.coach&&G.coach[tid])for(const c of n.clan){ c.yrs=n.yrs; G.coach[tid][c.role]=c; } } return n; }
/* 시즌 뒤: 성적이 나쁜 AI 구단 감독 경질(계약 기간이 남아 있어도) */
function mgrFireOff(){ const st=G.last&&G.last.order; if(!st)return; for(const t of G.teams){ if(t.id===ME())continue; const m=G.mgr[t.id]; if(!m)continue; const rk=st.findIndex(o=>o.tid===t.id)+1;
    if(m.act){ if(rk<=5||R()<.35){ delete m.act; m.yrs=3; /* 아래 해마다 1년 빼는 처리 뒤 2년 */ news('리그',`${tshort(t.id)}, ${m.name} 감독대행 정식 감독 승격`,`시즌 중 지휘봉을 잡은 ${m.name} 감독대행이 ${rk}위로 시즌을 마치고 2년 계약으로 정식 감독이 됐습니다.`,0); } else { const old=m.name; const n=mgrNew(t.id,false); n.yrs++; news('리그',`${tshort(t.id)}, 새 감독에 ${n.name}`,`${old} 감독대행 체제로 ${rk}위에 그친 ${tname(t.id)}이(가) ${n.name} 감독을 선임했습니다(${n.yrs-1}년).`,0); wire('감독',`${tname(t.id)}이(가) ${n.name} 감독을 새로 선임했습니다.`,{tid:t.id,x:{mid:n.id,hire:1}}); } continue; }
    if(m.yrs<=0)continue; const p=rk>=9?.5:rk>=7?.22:0; if(!p||R()>=p)continue; const old=m.name; const n=mgrNew(t.id,false); n.yrs++; try{ gmInc(t.id,'mgrFire'); }catch(e){}
    news('리그',`${tshort(t.id)}, ${old} 감독 경질 · 후임 ${n.name}`,`${rk}위로 시즌을 마친 ${tname(t.id)}이(가) 계약 기간이 남은 ${old} 감독을 경질하고 ${n.name} 감독(${n.yrs-1}년)을 선임했습니다.`,0); wire('감독',`${tname(t.id)}, ${old} 감독 경질 · ${n.name} 감독 선임`,{tid:t.id,x:{mid:n.id,hire:1}}); } }
/* 시즌 중(6·7·8월 1일): 최하위권 AI 구단은 감독대행 체제로 바꾸기도 한다 */
function mgrMidSeason(){ if(period()!=='season')return; const st=standingsNow(); for(const x of st.slice(-2)){ const t=team(x.tid); if(t.id===ME())continue; const m=G.mgr[t.id]; if(!m||m.act)continue; const r=G.sea.rec[t.id]; if(!r||r.w+r.l<40||r.w/(r.w+r.l)>=.42||R()>=.2)continue;
    const old=m.name; const self=R()<.5; const n=mgrNew(t.id,true); try{ gmInc(t.id,'mgrFire'); }catch(e){}
    news('리그',`${tshort(t.id)} ${old} 감독 ${self?'자진 사퇴':'경질'}, ${n.name} 감독대행 체제`,`${r.w}승 ${r.l}패로 최하위권에 머문 ${tname(t.id)}의 ${old} 감독이 ${self?'성적 부진의 책임을 지고 물러났습니다':'경질됐습니다'}. 남은 시즌은 ${n.name} 감독대행이 이끕니다.`,0);
    wire('감독',`${tname(t.id)}, ${old} 감독 ${self?'자진 사퇴':'경질'} · ${n.name} 감독대행`,{tid:t.id,x:{fire:1,nm:old}}); } }
/* 야인 기간: 전 소속 구단 스카우트·분석원 빈자리를 채운다(다른 AI 구단처럼) */
function unempStaff(){ if(!G.unemp)return; try{ const mk=scoutMkt(); while((G.scouts||[]).length<4&&mk.length){ const s=mk.sort((a,b)=>b.skill-a.skill)[0]; G.scoutMarket=G.scoutMarket.filter(x=>x!==s); s.since=G.day; s.role=s.role||'am'; G.scouts.push(s); } }catch(e){}
  try{ const am=anaMarket(); while(anaList().length<2&&am.length){ const a=am.sort((x,y)=>y.skill-x.skill)[0]; G.amarket=(G.amarket||[]).filter(x=>x!==a); a.since=G.day; G.analysts.push(a); } }catch(e){} }
