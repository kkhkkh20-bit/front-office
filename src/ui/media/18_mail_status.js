/* 당시 소식의 업무 상태. 읽음과 완료는 별개이며, 기록을 여는 링크는 계속 쓸 수 있다. */
const MAIL_TASK_ACTS=new Set(['evPick','ivOpen','ivSkip','faOpen','faMatch','faLL','agPitchOk','renewMgr','mdRep','posReqOk','posReqNo','posConv','proleSet','keepP','listP','fcampSet','stKeep','stLet','cmKeep','cmLet','jobYes','jobNo','pactKeep','pactEnd','scoutPlanGo','retNo','cwOpen','fdBegin','pmgmt']);
const mailStamp=m=>m.day0??m.day;
const mailEnd=(text,expired=false)=>({label:expired?'기한 종료':'처리 완료',text,expired});
/* 이전 구단 업무: 같은 구단으로 돌아오면 다시 열리므로 종료 상태로 저장하지 않는다(검수 11-09za) */
const MAIL_CLUB_TXT='이전 구단에서 받은 업무입니다. 현재 구단에서는 처리할 수 없습니다.';
const mailOldYear=m=>dobj(mailStamp(m)).y!==G.year;
function mailActionStatus(m,a){
  if(a.done)return mailEnd(a.done==='skip'?'다른 안을 선택해 처리했습니다.':a.res||'이미 처리했습니다.');
  const id=String(a.v??'').split(':')[0],p=G.players[+id],d=mailStamp(m),old=mailOldYear(m),c=m.ctx||{};
  if(MAIL_TASK_ACTS.has(a.a)&&!['jobYes','jobNo'].includes(a.a)&&(G.unemp||(c.tid!=null&&c.tid!==G.user)))return mailEnd(MAIL_CLUB_TXT,true);
  if(a.a==='watchPlan'){const d=+a.v,P=gmPlanAt(d),nx=nextGames(1)[0];if(!P||P.k!=='attend'||P.done||!nx||nx.d!==d)return mailEnd('열리지 않거나 이미 지난 경기입니다.',true);return null;} /* 시리즈가 끝나 열리지 않는 경기의 직관 버튼(검수 11-08) */
  if(a.a==='evPick'){const e=(G.evs||[]).find(x=>String(x.id)===id);if(!e)return mailEnd('이미 처리되었거나 종료된 결정입니다.');if(e.done)return mailEnd(e.auto?'답변 기한이 지나 기본안으로 처리했습니다.':'이미 결정을 마쳤습니다.');if(evExpired(e))return mailEnd('결정 답변 기한이 지났습니다.',true);return null;}
  if(a.a==='ivOpen'||a.a==='ivSkip'){const v=G.iv;if(!v||String(v.id)!==String(a.v))return mailEnd('이 인터뷰 요청은 종료되었습니다.',true);if(v.done)return mailEnd(v.ans?.length?'이미 인터뷰를 마쳤습니다.':'이미 인터뷰를 거절했습니다.');return G.day>v.exp?mailEnd('인터뷰 응답 기한이 지났습니다.',true):null;}
  if(['faOpen','faMatch','faLL','agPitchOk'].includes(a.a)){
    if(p?.team!=null)return mailEnd(p.team===G.user?'이미 우리 구단과 계약한 선수입니다.':'이미 다른 구단과 계약한 선수입니다.');
    const F=G.fa,fy=c.fa??dobj(d).y;if(!p||!F||F.closed||F.y0!==fy)return mailEnd('이 FA 협상 기간은 종료되었습니다.',true);
    if(a.a==='agPitchOk'){const o=F.pitch?.[id];if(!o||G.day>o.until)return mailEnd('우선 제안이 처리되었거나 제안 기한이 지났습니다.',true);}
    if(a.a==='faLL'){const o=F.mk?.[id]?.ll;if(!o||G.day>o.until)return mailEnd('라스트 룩 제안이 처리되었거나 기한이 지났습니다.',true);}return null;
  }
  if(a.a==='renewMgr'){const [,tid,mid]=String(a.v).split(':'),M=G.mgr[G.user];if(!M||M.interim||old||(tid!=null&&+tid!==G.user)||(mid&&mid!==M.id))return mailEnd('당시 감독의 재계약 요청은 종료되었습니다.',true);return M.yrs>0?mailEnd('이미 감독 계약을 확정했습니다.'):null;}
  if(a.a==='mdRep'){const D=G.md;if(!D||old||D.y!==G.year||d>D.day||G.day>=D.day)return mailEnd('이 미디어데이의 참석자 결정 기간이 지났습니다.',true);return D.res?mailEnd('이미 미디어데이 참석 선수를 확정했습니다.'):null;}
  if(['posReqOk','posReqNo','keepP','listP','posConv','proleSet','pmgmt'].includes(a.a)){
    if(!p||p.team!==G.user)return mailEnd('대상 선수가 우리 구단을 떠났거나 더 이상 처리할 수 없습니다.',true);
    if(a.a==='pmgmt')return !canExtend(p)?mailEnd('이미 계약을 정했거나 현재 다년계약 대상이 아닙니다.'):null;
    if(a.a==='posReqOk'||a.a==='posReqNo'){const r=p.posReq;return !r?.open||r.d>d?mailEnd('이미 답변했거나 종료된 포지션 도전 요청입니다.'):null;}
    if(a.a==='keepP'||a.a==='listP'){const r=p.treq;return !r||r.done||r.day>d?mailEnd('이미 답변했거나 종료된 트레이드 요청입니다.'):null;}
    if(a.a==='posConv'){const pos=String(a.v).split(':')[1];if(p.pos===pos||p.pconv?.pos===pos)return mailEnd('이미 해당 포지션으로 전환했거나 전환 훈련 중입니다.');return old?mailEnd('지난 시즌의 포지션 전환 제안입니다.',true):null;}
    if(a.a==='proleSet')return !G.prole?.[id]||G.prole[id].k!=='sp2'||old?mailEnd('이미 투수 보직을 정했거나 지난 시즌의 제안입니다.'):null;
  }
  if(a.a==='fcampSet')return !G.fcamp||G.fcamp.done||G.fcamp.y!==dobj(d).y?mailEnd('이 마무리캠프는 종료되었습니다.',true):null;
  if(a.a==='stKeep'||a.a==='stLet'){const r=(G.stRaid||[]).find(x=>x.id===id&&(c.raid!=null?x.exp===c.raid:x.exp===d+7));return !r?mailEnd('이미 직원 잔류·이적을 결정한 제안입니다.'):G.day>r.exp?mailEnd('직원 영입 제안의 답변 기한이 지났습니다.',true):null;} /* 마감일 당일까지 답할 수 있다(자동 처리는 다음 날, 검수 11-07) */
  if(a.a==='cmKeep'||a.a==='cmLet'){const ex=+String(a.v).split(':')[2],r=(G.cmRaid||[]).find(x=>x.id===id&&x.exp===ex);return !r?mailEnd('이미 코치 잔류·이적을 결정한 제안입니다.'):G.day>r.exp?mailEnd('코치 영입 제안의 답변 기한이 지났습니다.',true):null;}
  if(a.a==='jobYes'||a.a==='jobNo'){const j=(G.jobs||[]).find(x=>x.tid===+a.v&&(c.job!=null?x.exp===c.job:x.exp>d&&x.exp<=d+20));return !j||j.done?mailEnd('이미 답변했거나 종료된 단장직 제의입니다.'):G.day>=j.exp?mailEnd('단장직 제의의 답변 기한이 지났습니다.',true):null;}
  if(a.a==='pactKeep'||a.a==='pactEnd'){const P=G.pact;return !P?.on||old||(c.mid&&G.mgr[G.user]?.id!==c.mid)||(c.pact!=null&&P.day!==c.pact)||dobj(d).m!==dobj(G.day).m?mailEnd('이 유망주 기회 점검은 종료되었습니다.'):null;}
  if(a.a==='scoutPlanGo'){
    if(scoutWorkStatus().delegated)return mailEnd('스카우트팀장에게 배치를 맡겼습니다. 단장의 별도 승인은 필요하지 않습니다.');
    if(old||dobj(d).m!==dobj(G.day).m)return mailEnd('지난달의 배치 제안입니다. 최신 제안은 스카우트팀에서 확인하세요.',true);
    const P=c.scout;if(P){if(P.every(x=>G.scouts.some(s=>s.id===x.id&&(s.role||'am')===x.role&&s.region===x.key)))return mailEnd('이미 제안한 스카우트 배치를 마쳤습니다.');const now=scoutPlan().filter(x=>x.move);if(P.some(x=>!now.some(z=>z.s.id===x.id&&z.role===x.role&&z.key===x.key)&&!G.scouts.some(s=>s.id===x.id&&(s.role||'am')===x.role&&s.region===x.key)))return mailEnd('직원·배치 상황이 바뀌었습니다. 최신 제안을 확인하세요.',true);}
    else if(!scoutPlan().some(x=>x.move))return mailEnd('이미 스카우트 배치를 마쳤습니다.');return null;
  }
  if(a.a==='retNo'){const r=String(a.v)[0]==='p'?(G.legends||[]).find(r=>'p'+r.pid===String(a.v)):(G.legends||[])[+a.v];return !r||r.retNo||!r.canRetNo||(r.tid!=null&&r.tid!==G.user)?mailEnd('이미 영구결번을 지정했거나 지정 대상이 아닙니다.'):null;}
  if(a.a==='cwOpen'){const S=G.cwS,id=c.cw??a.v;return !S||(id!=null?String(S.id)!==String(id):S.day!==d)||S.done||G.day>S.until?mailEnd('이 경기 관전 뒤 건의 기간은 종료되었습니다.',true):null;}
  if(a.a==='fdBegin')return !G.fdWait?mailEnd('이미 창단 드래프트를 시작했습니다.'):null;
  return null;
}
function mailStatus(m){
  if(m.closed&&m.closed.text!==MAIL_CLUB_TXT)return m.closed;
  if(m.done)return mailEnd('이미 처리한 소식입니다.');
  const A=m.acts||[],s=m.subj||'',d=mailStamp(m),old=mailOldYear(m),c=m.ctx||{},M=G.mgr[G.user],end=mailEnd;
  if(/^\[인터뷰 요청\]/.test(s)&&!A.some(a=>a.a==='ivOpen'||a.a==='ivSkip')){const v=G.iv;return !v||v.done||d<v.day?end('이미 끝난 인터뷰 요청입니다.'):G.day>v.exp?end('인터뷰 응답 기한이 지났습니다.',true):null;}
  if(!A.length&&m.kind==='결정'&&/\n\[(결정|종료)\] /.test(m.body||'')){const e=(G.evs||[]).find(x=>x.mid===m.id);return end(e&&e.void?'적용하지 않고 끝난 결정입니다.':e&&e.auto?'답변 기한이 지나 기본안으로 처리했습니다.':'이미 결정을 마쳤습니다.');} /* 답한 결정은 버튼을 지우고 본문에 기록하므로 그 기록으로 완료를 본다(검수 11-09za) */
  if(m.oid){const o=(G.offers||[]).find(x=>x.id===m.oid);return !o?end('이미 답변했거나 종료된 트레이드 제안입니다.'):G.day>o.exp?end('트레이드 제안의 답변 기한이 지났습니다.',true):null;}
  /* 제목은 이전 저장의 업무에도 사용한다. 단순 보고/기록의 이동 링크는 끝난 업무로 보지 않는다. */
  const task=/감독 자리가 비어|감독 계약이 끝납니다|코치 자리가 비어|부상 방지 프로그램과 병원 제휴|훈련 방향과 해외 연수 안내|스카우트 담당 지역에 공백|감독이 정한 선수단 배치|개막 준비가 끝났습니다|외국인 선수를 구성|연봉 협상이 시작|연봉 미계약|연봉 계약 마감|연봉조정 신청|신인 드래프트가 열립니다|스프링캠프가 시작|스폰서 제안|상무 지원 기간|보호선수 명단|보상선수 지명|영입 보상: 보호선수|FA 승인 선수|FA 협상이 열립니다|스토브리그가 시작|트레이드 마감|마감 보강안|내일 직관|개막합니다/.test(s);
  if(task&&(G.unemp||(c.tid!=null&&c.tid!==G.user)))return end(MAIL_CLUB_TXT,true);
  if(/감독 자리가 비어/.test(s)){if(M&&!M.interim)return end('이미 감독을 선임했습니다.');if(old)return end('지난 시즌의 감독 선임 안내입니다.',true);}
  if(/감독 계약이 끝납니다/.test(s)){if(old||G.unemp||!M||M.interim||(c.mid&&M.id!==c.mid))return end('당시 감독의 재계약 요청은 종료되었습니다.',true);if(M.yrs>0)return end('이미 감독 재계약 또는 후임 선임을 마쳤습니다.');}
  if(/코치 자리가 비어/.test(s)&&G.coach&&!CKEYS.some(k=>!coachesOf(G.user)[k]))return end('이미 코치진을 모두 구성했습니다.');
  if(/부상 방지 프로그램과 병원 제휴/.test(s)&&G.medSet)return end('이미 의무 운영안을 설정했습니다.');
  if(/훈련 방향과 해외 연수 안내/.test(s)&&Object.keys(G.trn||{}).length)return end('이미 선수 훈련 방향을 지정했습니다.');
  if(/스카우트 담당 지역에 공백/.test(s)){const S=scoutWorkStatus();if(!S.needs)return end(S.delegated?'팀장이 시기에 맞게 스카우트를 배치하고 있습니다.':scoutDraftSea()?'이미 필요한 아마추어 담당을 배치했습니다.':'현재는 해외·프로 관찰을 우선하는 시기이며 필요한 스카우트 인원을 확보했습니다.');}
  if(/감독이 정한 선수단 배치/.test(s)&&(G.tutFlags?.roster||(G.cal&&G.day>G.cal.open+7)))return end('이미 선수단 배치를 확인했거나 안내 기간이 지났습니다.');
  if(/개막 준비가 끝났습니다/.test(s)&&(old||G.day>=G.cal.camp))return end('이미 스프링캠프 시작일에 도달했습니다.');
  if(/창단 드래프트(가 끝|: 모든)/.test(s)&&G.fd?.done)return end('이미 창단 드래프트를 마쳤습니다.');
  if(/외국인 선수를 구성/.test(s)){const F=foreignOf(G.user);if(F.filter(p=>p.foreign==='용병').length>=3&&F.some(p=>p.foreign==='아시아'))return end('이미 외국인 3명과 아시아쿼터 1명을 영입했습니다.');if(old||G.day>=G.cal.open)return end('개막 전 외국인 구성 안내 기간이 지났습니다.',true);}
  if(/연봉 협상이 시작|연봉 미계약|연봉 계약 마감|연봉조정 신청/.test(s)){const C=G.contract,y=c.contract??(dobj(d).m<=2?dobj(d).y-1:dobj(d).y);return !C||C.done||C.y!==y?end('이미 연봉 계약을 확정했거나 해당 협상 기간이 끝났습니다.'):null;}
  if(/신인 드래프트가 열립니다/.test(s))return !G.draft||G.draft.done||G.draft.y!==dobj(d).y?end('이 신인 드래프트는 종료되었습니다.'):null;
  if(/스프링캠프가 시작/.test(s))return old||!G.camp||G.camp.done?end('이 스프링캠프는 종료되었습니다.',true):G.camp.seen?end('이미 스프링캠프 훈련 방향을 확인했습니다.'):null;
  if(/스폰서 제안/.test(s)){const L=(G.spon?.off||[]).filter(x=>c.spon?c.spon.includes(x.id):(x.day??x.exp-21)<=d);return !L.length?end('이 소식의 스폰서 제안은 모두 처리되었거나 종료되었습니다.'):L.every(x=>G.day>x.exp)?end('스폰서 제안 기한이 지났습니다.',true):null;}
  if(/상무 지원 기간/.test(s)&&(!sangmuWave()||old||sangmuWave()!==(dobj(d).m>=9?'dec':'jun')))return end('이 상무 지원 기간은 종료되었습니다.',true);
  if(/보호선수 명단|보상선수 지명|영입 보상: 보호선수/.test(s)){const L=(G.comp||[]).filter(x=>((x.stage==='protect'&&x.to===G.user)||(x.stage==='pick'&&x.from===G.user))&&(c.comp!=null?x.id===c.comp:x.day==null||x.day<=d));if(!L.length)return end('이미 보상 절차를 마쳤거나 해당 지명 기간이 끝났습니다.');if(L.every(x=>G.day>x.exp))return end('보상 절차의 답변 기한이 지났습니다.',true);}
  if(/FA 승인 선수|FA 협상이 열립니다|스토브리그가 시작/.test(s)&&(!G.fa||G.fa.closed||G.fa.y0!==(c.fa??dobj(d).y)))return end('이 FA 협상 기간은 종료되었습니다.',true);
  if(/관심 FA|우리 FA|시장 보고/.test(s)){const a=A.find(a=>a.a==='player'),p=a&&G.players[+a.v];if(p?.team!=null)return end('이미 계약을 마친 선수의 FA 소식입니다.');}
  if(/트레이드 마감|마감 보강안/.test(s)&&(old||!tradeOpen()||G.day>tradeDL()))return end('이 시즌의 트레이드 마감일이 지났습니다.',true);
  if(/내일 직관|개막합니다/.test(s)&&G.day>d+1)return end('이미 지난 일정입니다.',true);
  const tasks=A.filter(a=>MAIL_TASK_ACTS.has(a.a)||a.done);if(tasks.length){const S=tasks.map(a=>mailActionStatus(m,a));if(S.every(Boolean))return S[0];}
  return null;
}
function mailButtonStatus(m,a){if(a.done)return mailActionStatus(m,a);const st=mailActionStatus(m,a);if(st)return st;return /^(player|fbOpen|cerOpen|wkOpen|leagueEvents|fdEvalGo)$/.test(a.a)?null:mailStatus(m);}
function mailActionHTML(m,a,i){const st=mailButtonStatus(m,a);return `<span class="ibm-act${st?' ended':''}"><button class="btn${st?' ibm-act-done':i===0?' primary':''}" ${st?`disabled aria-disabled="true" title="${esc(st.text)}"`:`data-a="mailAct" data-v="${m.id}:${i}"`}>${esc(a.l)}</button>${st?`<span class="ibm-act-state">${esc(st.label)}</span>`:''}</span>`;}
