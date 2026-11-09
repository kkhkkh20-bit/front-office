/* 직원 성격·희망 보직·관계. 조회는 난수를 쓰거나 저장 상태를 바꾸지 않는다. */
const STAFF_MENTAL={pro:'프로의식',pat:'인내심',adapt:'적응력'};
const STAFF_BIOS=new WeakMap();
function staffProfile(s,kind){
  if(s.staff&&(s.staff.identity==null||s.staff.identity===s.id))return s.staff;
  const cached=STAFF_BIOS.get(s);if(cached?.kind===kind&&cached.id===s.id)return cached.profile;
  const val=k=>Math.round(30+u01('staff:'+k,s.id)*55),mental={pro:val('pro'),pat:val('pat'),adapt:val('adapt')},office={};
  for(const k of ['pitch','bat','potential','opp','trk','vid'])office[k]=Math.round((u01('staff:office:'+k,s.id)-.5)*16);
  const role=s.role||(kind==='scout'?'am':'opp'),promotion={fp:'pc',fb:'bc',pc:'hc',bc:'hc',cc:'hc',rc:'hc',dc:'hc',fm:'hc',hc:'mgr'};
  const pref=kind==='coach'&&u01('staff:pref',s.id)>.78?(promotion[role]||role):role;
  const profile={v:1,identity:s.id,mental,office,pref,rels:{}};STAFF_BIOS.set(s,{kind,id:s.id,profile});return profile;
}
function staffAttach(s,kind){if(s)s.staff=staffProfile(s,kind);return s;}
/* 단장과의 관계는 사람 사이의 관계라 구단이 바뀌어도 따라간다(rels.me, 카페 11-09: 전 구단에서 쌓은 관계가 다시 영입하면 초기화). 감독 관계는 그 구단 감독 기준 그대로 */
function staffRel(s,tid,who){if(who!=='mgr'&&tid===G.user){const R0=s?.staff?.rels;if(R0){if(R0.me!=null)return R0.me;const V=Object.keys(R0).map(k=>R0[k]&&R0[k].gm).filter(v=>v!=null);if(V.length)return Math.max(...V);}} /* 옛 저장: 구단별로 남은 단장 관계 중 가장 높은 값 */const key=who==='mgr'?'mgr:'+(G.mgr[tid]?.id||'none'):'gm';return s?.staff?.rels?.[tid]?.[key]??50;}
function staffRelAdd(s,kind,tid,who,delta){staffAttach(s,kind);const P=s.staff;if(who!=='mgr'&&tid===G.user){P.rels.me=clamp(staffRel(s,tid,'gm')+delta,0,100);return;}const key=who==='mgr'?'mgr:'+(G.mgr[tid]?.id||'none'):'gm';P.rels[tid]=P.rels[tid]||{};P.rels[tid][key]=clamp((P.rels[tid][key]??50)+delta,0,100);}
function staffQuality(s,kind,tid){if(!s)return 1;const P=staffProfile(s,kind),M=P.mental;return clamp(1+(M.pro-50)/2000+(M.adapt-50)/5000+(M.pat-50)/6000+(staffRel(s,tid,'mgr')-50)/5000+(staffRel(s,tid,'gm')-50)/10000-(P.pref!==(s.role||(kind==='scout'?'am':'opp'))?(100-M.adapt)/5000:0),.94,1.06);}
function staffOfficeV(s,kind,key){const P=staffProfile(s,kind);return clamp(25+s.skill*11+(P.office[key]||0),20,90);}
function staffScoutFactor(s,p,tid){if(!G.coach)return 1;const P=staffProfile(s,'scout'),key=p?.isP?'pitch':'bat',type=P.office[key]||0,pot=P.office.potential||0;return clamp((1-(type*(p?.prospect ? .45 : .8)+pot*(p?.prospect ? .55 : .2))/200)/staffQuality(s,'scout',tid??G.user),.88,1.12);}
function anaRoleQuality(tid,role){if(!G.coach)return 1;const L=tid===G.user&&!G.unemp?anaList():(G.lgStaff?.[tid]?.an||[]),S=L.filter(s=>s.role===role).sort((a,b)=>anaNow(b)-anaNow(a));let sumV=0,w=0;S.slice(0,3).forEach((s,i)=>{const z=[1,.6,.3][i]*anaNow(s);sumV+=z*(1+(staffProfile(s,'analyst').office[role]||0)/200)*staffQuality(s,'analyst',tid);w+=z;});return w?clamp(sumV/w,.9,1.1):1;}
function staffOwned(kind,id){const L=kind==='coach'?Object.values(coachesOf(G.user)).concat(G.coachX||[]):kind==='scout'?G.scouts:kind==='analyst'?anaList():[];return (L||[]).find(s=>s&&s.id===id);}
function staffTalk(kind,id,topic){
  if(G.unemp||!['listen','coord'].includes(topic))return '지금은 면담할 수 없습니다.';
  const s=staffOwned(kind,id);if(!s)return '우리 구단 직원만 면담할 수 있습니다.';
  if(topic==='coord'&&!G.mgr[G.user])return '먼저 감독을 선임해 주세요.';
  if(s.staff?.talk?.tid===G.user&&G.day-s.staff.talk.day<14)return '다음 면담은 '+dmd(s.staff.talk.day+14)+'부터 가능합니다.';
  staffAttach(s,kind);s.staff.talk={tid:G.user,day:G.day,topic};staffRelAdd(s,kind,G.user,'gm',topic==='listen'?4:2);
  if(topic==='coord')staffRelAdd(s,kind,G.user,'mgr',3);
  const msg=s.name+' 직원과 '+(topic==='listen'?'업무·희망 보직을 논의했습니다. 단장 관계 +4.':'감독과의 업무 조율을 진행했습니다. 단장 관계 +2 · 감독 관계 +3.');addLog(msg);return msg;
}
/* 분야별 지도: 1·2군 출전 비중과 담당 코치의 실제 세부 능력으로 계산한다. */
function coachToolV(p,k){
  if(p.team==null||!G.coach)return 55;const tid=p.team,C=coachesOf(tid),a=seasonTotal(p,G.year,'1군'),f=seasonTotal(p,G.year,'퓨처스'),n=p.isP?'outs':'pa';
  const share=(a?.[n]||0)+(f?.[n]||0)>0?oneShare(p):p.e1?1:0;
  const v=(role,tool)=>{const c=C[role];if(!c)return 45;const M=staffProfile(c,'coach').mental;return trnCoachV(c,tid,tool)+(p.age<=25?(M.pat-50)*.025:0);};
  let first,farm;
  if(p.isP){first=k==='ctl'?v('pc',k)*.75+v('cc',k)*.25:v('pc',k);farm=v('fp',k)*.75+v('fm',k)*.25;}
  else if(k==='def'){first=p.pos==='C'?v('cc','cat')*.8+v('dc','def')*.2:v('dc','def');farm=p.pos==='C'?v('cc','cat')*.5+v('fm','def')*.5:v('fm','def');}
  else if(k==='spd'){first=v('rc','spd');farm=v('rc','spd')*.5+v('fm','spd')*.5;}
  else if(k==='vit'){first=v('hc','sta');farm=v('fm','sta');}
  else{first=v('bc',k);farm=v('fb',k)*.75+v('fm',k)*.25;}
  return clamp(first*share+farm*(1-share),25,90);
}
function coachToolMult(p,k){return clamp(1+(coachToolV(p,k)-55)/200,.85,1.18);}
function coachBatteryPlan(tid){if(tid==null||!G.coach)return 0;const c=coachesOf(tid).cc;if(!c)return -.2;const a=cAb(c);return clamp(((a.cat*.6+a.ana*.25+a.ctl*.15+(effC(c,tid)-c.sk))*staffQuality(c,'coach',tid)-55)*.025,-.75,.75);}
function coachRunAdj(tid){if(tid==null||!G.coach)return 0;const f=c=>{if(!c)return 47;const a=cAb(c);return (a.spd*.65+a.ana*.2+a.com*.15+(effC(c,tid)-c.sk))*staffQuality(c,'coach',tid);};const C=coachesOf(tid);if(!C.rc)return -.01;return clamp((f(C.rc)*.8+(C.r1===undefined?f(C.rc):f(C.r1))*.2-55)*.0012,-.035,.035);} /* 1루 주루코치가 20% 몫(11-08c) */
/* 진루는 보내기/정지와 송구 승부를 분리한다. 강제 진루·홈런에는 적용하지 않는다. */
function runAdvance(r,fs,ctx,roll){
  /* 사전 기록 생성처럼 코치진 구성 전인 단계는 검증된 중립 진루 모형을 유지한다. */
  if(!G.coach){const chance=ctx.from===3?ctx.base+runAdj(r,fs):ctx.from===2&&ctx.to===3?ctx.base:ctx.base+(r.r.spd-50)*(ctx.spd??.006)+runAdj(r,fs);return {send:(roll||R)()<chance,safe:true};}
  const next=roll||R,op=clamp(ctx.base+(r.r.spd-50)*(ctx.spd??.006)+runAdj(r,fs)+(ctx.outs===2&&ctx.to===4?.015:0),0,1),coach=coachRunAdj(r.team);
  /* 유리한 송구 승부를 읽고 보낸다. 낮은 판단력은 불리한 기회도 드물게 잘못 보낸다. */
  const favourable=next()<op,send=next()<clamp(favourable?.97+coach:.025-coach,.002,.995);
  if(!send)return {send:false,safe:false};
  return {send:true,safe:next()<clamp((favourable?.97:.35)+coach*.3,.1,.995)};
}
