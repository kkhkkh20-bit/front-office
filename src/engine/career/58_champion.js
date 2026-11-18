/* ===== 우승의 순간: 연출 · 구단주 포상 · 선수단 · 스폰서 =====
   한국시리즈 우승이 확정되면 신문이 1면으로 떠들고, 구단주가 감격해 포상 세 가지 중 하나를 고르게 한다.
   선수단 기분과 팬 여론이 오르고, 우승 직후 스폰서 제안이 몰려든다. 우승은 구단 명성(clubPrestige)에도 오래 남는다 */
/* 구단 사업은 단장 상태와 분리한다. 전역 필드는 옛 저장·화면 호환용 참조다. */
function champRecord(tid,y){ const all=G.champEvents||(G.champEvents={}); const k=tid+':'+y; return all[k]||(all[k]={tid,y}); }
function champOwner(y,tid){ if(tid!=null)return tid; const h=(G.history||[]).find(h=>h.y===y&&h.champ!=null); return h?h.champ:(y===G.year&&G.ps&&G.ps.champ!=null?G.ps.champ:G.user); }
function champEventsInit(){
  for(const [key,field] of [['parade','parade'],['champPop0','sales'],['champNew','news']]){ const v=G[key]; if(!v)continue; v.tid=champOwner(v.y,v.tid); const r=champRecord(v.tid,v.y); const old=r[field];
    if(old){ for(const flag of ['done','noted','seen'])if(v[flag])old[flag]=true; G[key]=old; } else r[field]=v; }
  if(G.ringY!=null){ G.ringT=champOwner(G.ringY-1,G.ringT); const r=champRecord(G.ringT,G.ringY-1); r.ringY=G.ringY; if(G.ringDone===G.ringY)r.ringDone=G.ringDone; }
}
function champAdopt(tid){ champEventsInit(); const r=Object.values(G.champEvents||{}).filter(r=>r.tid===tid).sort((a,b)=>b.y-a.y)[0]; if(!r)return;
  if(r.parade)G.parade=r.parade; if(r.sales)G.champPop0=r.sales; if(r.news)G.champNew=r.news;
  if(r.ringY!=null){ G.ringY=r.ringY; G.ringT=tid; G.ringDone=r.ringDone; } }
function champSchedule(tid,y){ champEventsInit(); const r=champRecord(tid,y); if(!r.parade)r.parade={tid,y,d:G.day+3,done:false}; if(!r.sales)r.sales={tid,y,pop:team(tid).pop}; r.ringY=y+1; return r; }
function champRing(tid){ champEventsInit(); return Object.values(G.champEvents||{}).find(r=>r.tid===tid&&r.ringY===G.year&&r.ringDone!==G.year); }
function champSeriesMvp(y,tid){ tid=tid??G.user;
  { const K=G.psSer&&G.psSer[y]&&G.psSer[y].ks; if(K){ const L=Object.entries(K).filter(([,o])=>o.t===tid).map(([id,o])=>{ const v=o.isP?(o.outs||0)/3*.7-(o.er||0)*1.3+(o.so||0)*.2+(o.w||0)*1.5+(o.sv||0):(o.h||0)+(o.d||0)*.5+(o.hr||0)*2+(o.rbi||0)*.8+(o.bb||0)*.3; return {id:+id,o,v}; }).sort((a,b)=>b.v-a.v); const b=L[0];
    if(b){ const o=b.o; const line=o.isP?`${o.w||0}승${o.sv?` ${o.sv}세이브`:''} · ${ipStr(o.outs||0)}이닝 ${o.er||0}자책 · 탈삼진 ${o.so||0}`:`${o.ab||0}타수 ${o.h||0}안타 ${o.hr||0}홈런 ${o.rbi||0}타점`; return {id:b.id,n:o.n,line,games:Math.max(...L.map(x=>x.o.g))}; } } } /* 모든 구단의 한국시리즈 기록(psRec)으로. 옛 저장은 아래 우리 경기 기록으로 */
  const R=psStoredGames().filter(r=>r.kind&&r.kind.startsWith('한국시리즈')&&psGameSeason(r)===y&&(r.home===tid||r.away===tid)&&r.box&&r.box[r.home===tid?'h':'a']); const sc={};
  for(const r of R){ const s=r.box[r.home===tid?'h':'a'];
    for(const b of s.bat||[]){ if(!b||b.id==null)continue; const v=(b.h||0)+(b.d||0)*.5+(b.hr||0)*2+(b.rbi||0)*.8+(b.bb||0)*.3; const o=sc[b.id]=sc[b.id]||{id:b.id,n:b.n,v:0,b:{ab:0,h:0,hr:0,rbi:0},p:null}; o.v+=v; o.b.ab+=b.ab||0; o.b.h+=b.h||0; o.b.hr+=b.hr||0; o.b.rbi+=b.rbi||0; }
    for(const x of s.pit||[]){ if(!x||x.id==null)continue; const v=(x.outs||0)/3*.7-(x.er||0)*1.3+(x.so||0)*.2+(x.d==='승'?1.5:x.d==='세'?1:0); const o=sc[x.id]=sc[x.id]||{id:x.id,n:x.n,v:0,b:null,p:{outs:0,er:0,so:0,w:0,sv:0}}; o.v+=v; o.p=o.p||{outs:0,er:0,so:0,w:0,sv:0}; o.p.outs+=x.outs||0; o.p.er+=x.er||0; o.p.so+=x.so||0; if(x.d==='승')o.p.w++; if(x.d==='세')o.p.sv++; } }
  const best=Object.values(sc).sort((a,b)=>b.v-a.v)[0]; if(!best)return null;
  const line=best.p&&best.p.outs>=9&&(!best.b||best.b.ab<6)?`${best.p.w}승${best.p.sv?` ${best.p.sv}세이브`:''} · ${ipStr(best.p.outs)}이닝 ${best.p.er}자책 · 탈삼진 ${best.p.so}`:best.b?`${best.b.ab}타수 ${best.b.h}안타 ${best.b.hr}홈런 ${best.b.rbi}타점`:'';
  return {id:best.id,n:best.n,line,games:R.length}; }
/* 발표된 MVP의 인물 ID를 우선한다. 은퇴 보관 대상도 같은 상을 한 번만 받고 현역 사기만 올린다. */
function champMvpAward(y,tid,record){ const announced=record.news?.mvp||(G.champNew?.y===y&&G.champNew.tid===tid?G.champNew.mvp:null), m=announced||champSeriesMvp(y,tid); if(!m){record.mvpDone=1;return null;} const q=G.players[m.id]||G.arch?.[m.id]; if(!q)return m;
  const added=addAward(q,y+' 한국시리즈 최우수선수',tid); if(added&&G.players[m.id]===q)q.mor=clamp((q.mor??60)+5,0,100); record.mvpDone=1; return m; }
/* 옛 보관 수상은 실제 MVP 발표 영수증이 있을 때만 복구한다. 새 시상 기사나 현재 선수 재평가를 만들지 않는다. */
function champArchiveMvpMigrate(){ let n=0; const L=Object.values(G.champEvents||{}).map(r=>r.news).concat(G.champNew||[]),seen=new Set(); for(const c of L){ if(!c||!Number.isFinite(c.y)||c.tid==null||c.mvp?.id==null)continue; const k=c.y+':'+c.mvp.id; if(seen.has(k))continue;seen.add(k);const a=G.arch?.[c.mvp.id];if(!a)continue;const label=c.y+' 한국시리즈 최우수선수';if(!(a.aw||[]).includes(label)){(a.aw=a.aw||[]).push(label);n++;} }return n; }
function champCelebrate(){const P=G.ps;if(!P||P.champ==null)return;const tid=P.champ,y=P.y??G.year,key=tid+':'+y,pending=G.champEvents?.[key]?.pending;
  return postAtomic('champ:'+key,()=>{const r=champCelebrateCore();const c=G.champEvents?.[key];if(c)delete c.pending;return r;},pending,(v,native)=>{champRecord(tid,y).pending=native?{v}:{};});}
function champCelebrateCore(){ const P=G.ps; if(!P||P.champ==null)return; const y=P.y??G.year; const record=champSchedule(P.champ,y);champRingCapture(record);if(!record.chron){const H=typeof clubChron==='function'?clubChron(P.champ):(G.chron||[]);if(!H.some(x=>x.tid===P.champ&&x.y===y&&x.k==='champ'&&/한국시리즈.*우승/.test(x.t)))chron('champ',`${y} 한국시리즈 우승 · 상대 ${tname(P.runner)}${P.res?.ks?` · ${P.res.ks[2]}승 ${P.res.ks[3]}패`:''}`,null,P.champ);record.chron=1;}
  /* 우승 구단 효과(인기·선수단 기분·구단주 신뢰)는 플레이어가 맡았는지와 상관없이 같게(검수 11-09zo) */ if(!record.fx){ record.fx=1; const tc=team(P.champ); for(const p of playersOf(P.champ))p.mor=clamp((p.mor??60)+8,0,100); tc.pop=clamp(tc.pop+.1,.7,1.5); tc.trust=clamp(tc.trust+3,0,100); }
  champMvpAward(y,P.champ,record); /* 우승 당시 후보의 현역·보관 수상 이력을 함께 확정한다. */
  if(G.unemp||P.champ!==G.user)return; if(record.news)return; const t=team(G.user);
  const prev=(G.history||[]).filter(h=>h.champ===G.user).map(h=>h.y); const last=prev.length?Math.max(...prev):null; const n=prev.length+1;
  const ks=P.res&&P.res.ks?P.res.ks:null; const mvp=champSeriesMvp(y);
  const gap=last?y-last:null; let streak=1; for(let k=y-1;prev.includes(k);k--)streak++; const tag=!prev.length?(G.startY&&G.startY>=y-3?`창단 ${y-G.startY+1}년 만의 첫 우승`:'구단 첫 한국시리즈 우승'):gap>=10?`${gap}년 만의 우승`:gap===1?`${streak}년 연속 우승`:`통산 ${n}번째 우승`;
  G.champNew=record.news={tid:G.user,y,n,tag,ks:ks?[ks[2],ks[3]]:null,opp:P.runner,mvp,seen:false};
  /* 신문 1면 */
  news('구단',`${tname(G.user)}, ${y} 한국시리즈 정상… ${tag}`,`${tname(G.user)}이(가) ${tname(P.runner)}을(를) ${ks?`${ks[2]}승 ${ks[3]}패로`:''} 꺾고 우승했습니다. 홈구장은 밤늦게까지 팬들의 함성으로 가득했습니다.`,5,{fanW:4});
  if(mvp){ news('선수',`한국시리즈 MVP ${mvp.n}`,`${mvp.n}이(가) ${mvp.line}로 시리즈를 지배했습니다.`,3,{ref:mvp.id}); }
  news('구단',`'우승 설계자' 단장, 부임 ${G.gmSince!=null?`${y-G.gmSince+1}년`:''} 만의 결실`,`선수 구성과 굵직한 결정이 결실을 맺었다는 평가입니다. 구단 안팎에서 단장의 판단이 옳았다는 말이 나옵니다.`,3);
  /* 선수단 · 팬 */
  G.champPop0=record.sales; /* 우승 효과: 다음 시즌 관중·유니폼·굿즈 판매가 늘어난다(인기는 해마다 조금씩 원래대로 돌아간다) */ prInit(); G.pr.fan=clamp(G.pr.fan+12,0,100); G.pr.press=clamp(G.pr.press+8,0,100);
  /* 구단주 포상: 세 가지 중 하나 */
  const B=bossOf(G.user);
  const gift=evNew('champGift',`구단주 포상: ${tag}`,`${B.own.name} 회장이 라커룸까지 내려와 단장의 손을 잡았습니다. "약속을 지켜 줘서 고마워요. 원하는 걸 말해 보세요."\n\n포상 하나를 고르세요.`,
    champGiftOpts(t,y), /* 현금 포상은 줄였다: 우승팀이 바로 전력을 사 오면 쏠림이 커진다. 보상은 인기·명성·판매로 */
    {exp:14,def:0,from:'구단주실',data:{tid:t.id,y}});champGiftBind(gift);
  /* 우승 직후 스폰서 제안 쇄도: 비거나 올해 끝나는 자리에 웃돈 제안 */
  try{ sponInit(); const S=G.spon; const made=[]; for(const k of Object.keys(SPON_SLOT)){ if(SPON_SLOT[k].indie&&!t.indie)continue; const c=S.c[k]; if(c&&c.until>y)continue; if(made.length>=3)break; const o=sponMake(k); o.amt=round5(o.amt*1.18); o.exp=G.day+30; S.off.push(o); made.push(o); }
    if(made.length)mail('마케팅팀',`우승 효과: 스폰서 제안 ${made.length}건`,`우승 소식이 나가자마자 기업들의 연락이 몰려들었습니다. 평소보다 18% 높은 조건입니다.\n${made.map(o=>`${o.co}(${SPON_SLOT[o.slot].l}) 연 ${money(o.amt)}`).join('\n')}`,{kind:'스폰서',acts:[{l:'스폰서 보기',a:'go',v:'club:spon'}]}); }catch(e){}
  G.parade=record.parade; G.ringY=y+1; G.ringT=G.user; /* 행사는 우승 구단 몫(단장이 이직해도 따라가지 않는다) */ /* 사흘 뒤 퍼레이드, 다음 시즌 홈 개막전에 반지 수여식 */
  addLog(`${y} 한국시리즈 우승 (${tag})`); }
/* 우승 포상 선택지. 모기업이 없는 구단은 모기업 부담 보너스·시설 투자를 받을 수 없고(투자사 지원금만), 시설 투자는 3년에 한 번(연속 우승 때마다 시설이 두 칸씩 오르던 문제, 커뮤니티 피드백 11-07) */
/* 시설 투자 포상을 받은 해: 단장이 아니라 구단 기록(옛 저장의 전역 값은 그해 우승 구단 몫, 검수 11-09zo) */
/* FA 특별 자금은 우승 시즌의 겨울에 속한다. 확정 계약 영수증만 용도 이행으로 센다. */
function champFundKey(f){return (f.tid??G.user)+':'+(Number.isInteger(f.y)?f.y:'due'+f.due);}
function champFundAll(){const M=new Map();for(const f of Object.values(G.faFunds||{}))if(f)M.set(champFundKey(f),f);if(G.faFund&&!M.has(champFundKey(G.faFund)))M.set(champFundKey(G.faFund),G.faFund);return [...M.values()];}
function champFundMigrate(){if(!G.faFund&&!G.faFunds)return 0;const B=G.faFunds=G.faFunds||{};let n=0;
  const put=f=>{const e=f.giftId&&((G.evs||[]).find(e=>e.id===f.giftId)||Object.values(G.champEvents||{}).map(r=>r.gift).find(e=>e&&e.id===f.giftId));if(e&&e.pick===2&&e.data&&e.data.tid!=null&&Number.isInteger(e.data.y)&&(f.tid==null||e.data.tid===f.tid)){if(f.tid==null){f.tid=e.data.tid;n++;}if(f.y!==e.data.y){f.y=e.data.y;n++;}const due=dnum(f.y+1,2,1);if(f.due!==due){f.due=due;n++;}}
    if(!Number.isInteger(f.y)&&Number.isFinite(f.due)){const d=dobj(f.due);if(d.m===2&&d.d===1){f.y=d.y-1;n++;}}
    if(f.tid==null){f.tid=champOwner(f.y);n++;}const k=champFundKey(f),old=B[k];if(!old){B[k]=f;n++;return f;}if(old!==f){for(const [a,v] of Object.entries(f))if(old[a]==null){old[a]=v;n++;}for(const a of ['used','done'])if(f[a]&&!old[a]){old[a]=true;n++;}}return old;};
  const legacy=G.faFund;for(const [key,f] of Object.entries(B)){if(!f)continue;const canonical=put(f);if(champFundKey(canonical)!==key){delete B[key];n++;}if(legacy===f)G.faFund=canonical;}if(legacy){const canonical=put(legacy);if(G.faFund!==canonical){G.faFund=canonical;n++;}}return n;}

function champFundProof(f){if(!Number.isInteger(f.y)||!Number.isFinite(f.due))return null;const from=dnum(f.y,11,1),valid=r=>r&&r.to===f.tid&&r.from!=null&&r.from!==f.tid&&Number.isFinite(r.day??r.d)&&(r.day??r.d)>=from&&(r.day??r.d)<f.due;
  const r=(G.fa&&G.fa.results||[]).find(valid);if(r)return {pid:r.id,from:r.from,to:r.to,d:r.day,source:'FA 결과'};const m=(G.moves||[]).find(r=>r.t==='FA'&&valid(r));return m?{pid:m.pid,from:m.from,to:m.to,d:m.d,source:'확정 이적 장부'}:null;}
function champFundUsed(f){return f.assessed?!!f.used:!!(f.used||champFundProof(f));}
function champFundUse(tid){champFundMigrate();let n=0;for(const f of champFundAll()){if(f.tid!==tid||f.done||f.used||f.assessed||G.day>=f.due)continue;const proof=champFundProof(f);if(proof){f.used=true;f.usedProof=proof;n++;}}return n;}
function champFundAward(t,y){champFundMigrate();const B=G.faFunds=G.faFunds||{},k=t.id+':'+y;if(B[k]){G.faFund=B[k];return B[k];}const f={tid:t.id,y,amt:3000,used:false,due:dnum(y+1,2,1)},gift=G.champEvents?.[k]?.gift;if(gift&&gift.pick===2&&gift.data?.tid===t.id&&gift.data?.y===y)f.giftId=gift.id;const proof=champFundProof(f);if(proof){f.used=true;f.usedProof=proof;}t.cash+=f.amt;B[k]=f;G.faFund=f;return f;}
function champFundEarmark(tid){return sum(champFundAll().filter(f=>(f.tid??G.user)===tid&&!f.done&&!f.used).map(f=>Math.max(0,f.amt||0)));}
function champFacYOf(t){ return t.champFacY??(G.champFacY!=null&&champOwner(G.champFacY)===t.id?G.champFacY:null); }
function champFacilityTargets(t,S){S=S||(t.id===G.user?G.fac:t.fi||{it:facAlloc(t,t.fac||3).it});return S?.it?FACK.filter(k=>!S.bld?.[k]&&S.it[k]<FAC_MAX).sort((a,b)=>S.it[a]-S.it[b]).slice(0,2):[];}
function champFacilityCan(t,y){const fy=champFacYOf(t);return !t.indie&&!(fy!=null&&y-fy<3)&&champFacilityTargets(t).length>0;}
function champFacilityGift(t,y){const fy=champFacYOf(t);if(t.indie)return '모기업이 없는 독립구단은 시설 투자 포상을 받을 수 없습니다.';if(fy!=null&&y-fy<3)return '시설 투자 포상은 3년에 한 번입니다.';const S=facSt(t.id),L=champFacilityTargets(t,S);if(!L.length){t.cash=(t.cash||0)+2000;return '진행 중인 공사를 보존하고, 추가 투자할 시설이 없어 운영 자금 20억으로 대신 받았습니다.';}for(const k of L){S.it[k]=Math.min(FAC_MAX,S.it[k]+1);(S.dn=S.dn||{})[k]=G.day;}t.champFacY=y;if(t.id===G.user)facRecalc();else{S.lv=facCalcLv(S.it);t.fac=S.lv;}return L.map(k=>FACI[k].l+': '+FACI[k].lv[S.it[k]]).join(', ')+'(으)로 바로 올렸습니다. 진행 중인 유상 공사는 그대로 유지됩니다.';}
function champGiftOpts(t,y){ facInit(); const fac=champFacilityCan(t,y); /* 모두 최고 단계면 시설 포상을 내지 않는다(검수 11-09zo) */
  return [t.indie?{l:'선수단 우승 보너스(구단 부담 5억)',fx:'선수 전원 기분 상승, 충성도가 조금 오릅니다. 구단 현금 -5억'}:{l:'선수단 우승 보너스(모기업 부담)',fx:'선수 전원 기분 상승, 충성도가 조금 오릅니다. 구단 돈은 들지 않습니다'},
    t.indie?{l:'투자사 운영 자금 10억 지원',fx:'구단 현금 +10억(바로 입금)'}:{l:'운영 자금 20억 지원',fx:'구단 현금 +20억(바로 입금)'},
    {l:'FA 영입 특별 자금 30억',fx:'구단 현금 +30억. 단, 이번 겨울 FA를 한 명도 데려오지 않으면 2월 1일에 절반을 돌려받습니다'},
    fac?{l:'훈련 시설 투자',fx:'공사 중인 항목을 제외한 훈련 시설 최대 두 곳을 모기업 돈으로 한 단계 올려 줍니다(3년에 한 번)'}:null].filter(Boolean); }
EVH.champGift={ can(e,i){ const tid=e.data&&e.data.tid; if(G.unemp||tid!=null&&tid!==G.user)return '이 포상은 원래 우승 구단의 후임 단장이 처리합니다.';return i===0&&team(tid??G.user).indie&&spendable(tid??G.user)<500?'선수단 보너스에 쓸 현금 5억이 부족합니다.':''; }, pick(e,i){ const t=team(e.data&&e.data.tid!=null?e.data.tid:G.user); const y=e.data&&e.data.y!=null?e.data.y:G.year;
  if(t.indie&&i===0){if(spendable(t.id)<500){if(!e.auto)return '선수단 보너스에 쓸 현금 5억이 부족합니다.';i=1;e.pick=1;}else t.cash-=500;} if(t.indie&&i===1){ t.cash+=1000; return '투자사가 운영 자금 10억을 보냈습니다.'; } if(t.indie&&i===2){ champFundAward(t,y); return champFundReceipt(t,y); } if(t.indie&&i>2)return '';
  if(i===0){ for(const p of playersOf(t.id)){ p.mor=clamp((p.mor??60)+6,0,100); initPers(p); if(!p.foreign&&R()<.35)p.pers.loy=Math.min(20,p.pers.loy+1); } return (t.indie?'구단이':'모기업이')+' 선수단에 우승 보너스를 지급했습니다. 선수 전원 기분 상승, 일부 선수는 구단에 더 애착을 갖습니다.'; }
  if(i===1){ t.cash+=2000; return '운영 자금 20억이 입금되었습니다.'; }
  if(i===2){ champFundAward(t,y); return champFundReceipt(t,y); }
  return champFacilityGift(t,y); } };
/* 미결 포상은 구단과 원래 기한에 남는다. 퇴임은 수령이나 거절로 기록하지 않는다. */
function champGiftBind(e){ if(!e)return; e.data=e.data||{}; const y=e.data.y??(dobj(e.day).m<=2?dobj(e.day).y-1:dobj(e.day).y);
  let tid=e.data.tid; if(tid==null){ const h=(G.history||[]).find(h=>h.y===y&&h.champ!=null), r=Object.values(G.champEvents||{}).find(r=>r.y===y&&r.news); tid=h?h.champ:r?r.tid:G.ps&&G.ps.champ!=null&&(G.ps.y??G.year)===y?G.ps.champ:null; }
  if(tid==null)return; e.data.tid=tid;e.data.y=y;champRecord(tid,y).gift=e;return e; }
function champGiftMail(e,active){ const m=(G.mail||[]).find(m=>m.id===e.mid); if(!m)return; m.acts=active?e.opts.map((o,i)=>({l:o.l,a:'evPick',v:e.id+':'+i})):[]; m.imp=!!active;
  if(active){delete m.closed; m.read=false;}else{m.closed={label:'후임 단장에게 인계',text:'우승 포상은 원래 구단과 답변 기한을 유지합니다.'};m.read=true;} G.stops=(G.stops||[]).filter(s=>s.id!==e.mid); }
function champGiftMigrate(){ if(!G)return;evInit();for(const r of Object.values(G.champEvents||{}))if(r.gift&&!G.evs.some(e=>e.id===r.gift.id))G.evs.push(r.gift);
  for(const e of G.evs.filter(e=>e.k==='champGift')){ if(!champGiftBind(e)||e.pick!=null||e.res&&!e.handoff)continue; const away=!!G.unemp||e.data.tid!==G.user;
    if(away){e.handoff=true;e.done=true;champGiftMail(e,false);}else if(e.handoff||e.done){delete e.handoff;e.done=false;champGiftMail(e,true);} }
}
function champGiftHandOff(tid){champGiftMigrate();for(const e of G.evs||[])if(e.k==='champGift'&&e.data&&e.data.tid===tid&&e.pick==null&&(!e.done||e.handoff)){e.handoff=true;e.done=true;champGiftMail(e,false);} }
function champGiftAdopt(tid){champGiftMigrate();for(const e of G.evs||[])if(e.k==='champGift'&&e.handoff&&e.data.tid===tid&&!G.unemp){delete e.handoff;e.done=false;champGiftMail(e,true);} }
function champGiftDaily(){champGiftMigrate();for(const e of G.evs||[])if(e.k==='champGift'&&e.handoff&&e.pick==null&&G.day>e.exp){
    e.done=false;const m=(G.mail||[]).find(m=>m.id===e.mid);if(m)delete m.closed;
    const logs=G.autoLog,rows=logs&&logs.slice(),other=e.data.tid!==ME();evPick(e.id,e.def,true);delete e.handoff;
    if(other){if(logs){logs.splice(0,logs.length,...rows);G.autoLog=logs;}else delete G.autoLog;}
    const result=(G.evlog||[]).find(x=>x.id===e.id);if(result)result.tid=e.data.tid;
  } }
/* 회수할 몫은 선택 지출에 쓰지 않는다. 옛 저장에서 부족해진 몫은 면제하지 않고 남긴다. */
function champFundReserve(tid){return sum(champFundAll().filter(f=>(f.tid??G.user)===tid&&!f.done&&!f.used).map(f=>Math.max(0,(f.assessed??Math.round((f.amt||0)/2))-(f.recovered||0))));}
function champFundReceipt(t,y){const cap=financeReserveLimit(t.id,y,3000);return `FA 영입 특별 자금 30억이 입금되었습니다. 이번 겨울 외부 FA를 영입하지 않으면 2월 1일에 15억을 반환합니다. 반환할 15억은 영입 전까지 다른 지출에서 유보합니다. ${t.indie?'투자사 지원금입니다.':`결산의 기본 유보금 상한 ${money(cap.base)}에 특별 자금 ${money(cap.ear)}을 별도로 더합니다(회수 기준 ${money(cap.total)}).`}`;}
/* FA 특별 자금: 2월 1일까지 FA를 한 명도 데려오지 않으면 절반 회수 */
/* 우승 퍼레이드(우승 사흘 뒤): 연고 도시 카퍼레이드. 팬 여론·인기가 한 번 더 오른다 */
function champParade(){ champEventsInit(); for(const r of Object.values(G.champEvents||{}))champParadeRun(r.parade); }
function champParadeRun(P){ if(!P||P.done||G.day<P.d)return; const tid=P.tid;chron('champ',`${P.y} 우승 퍼레이드 개최`,null,tid);
  if(tid!==G.user||G.unemp){ P.done=true; const t=team(tid); t.pop=clamp(t.pop+.02,.7,1.5); wire('구단',`${tfull(t)}, 도심 우승 퍼레이드`,{tid}); return; } /* 우승 뒤 단장이 떠났으면 우승 구단이 퍼레이드를 하고, 새 구단에는 아무 일도 없다 */
  P.done=true; const t=team(G.user); prInit(); const n=Math.round(4+t.market*7+(G.pr.fan-50)/8); P.n=n;
  news('구단',`${t.city} 도심 우승 퍼레이드…팬 ${n}만 명 운집`,`${tname(G.user)} 선수단이 오픈카를 타고 ${t.city} 도심을 돌았습니다. 거리를 메운 팬들이 선수 이름을 연호했고, 단장도 손을 흔들며 화답했습니다.`,3,{fanW:3});
  mail('홍보팀',`우승 퍼레이드를 마쳤습니다`,`${t.city} 도심 퍼레이드에 팬 약 ${n}만 명이 모였습니다. 우승 기념 유니폼과 굿즈 주문이 밀려들고 있습니다.

다음 시즌 홈 개막전에서 우승 반지 수여식을 엽니다. 그날 표는 이미 매진 분위기입니다.`,{kind:'구단'});
  G.pr.fan=clamp(G.pr.fan+3,0,100); t.pop=clamp(t.pop+.02,.7,1.5); }
/* 다음 시즌(2월 1일): 우승 효과로 늘어날 관중·굿즈 판매를 알린다 */
function champSalesNote(){ champAdopt(G.user);const c=G.champPop0;if(!c||c.y!==G.year-1||G.unemp||c.noted||(c.tid!=null&&c.tid!==G.user))return;c.noted=true;const t=team(G.user),att=Math.round(((.82+.3*t.pop)/(.82+.3*c.pop)-1)*100),mer=Math.round((t.pop/c.pop-1)*100),up=att>0||mer>0,down=att<0||mer<0;
  const delta=(label,v)=>v?`${label}은 약 ${Math.abs(v)}% ${v>0?'증가':'감소'}할 것으로 봅니다.`:`${label}은 비슷한 수준으로 봅니다.`,text=delta('관중',att)+' '+delta('유니폼·굿즈 판매',mer);
  news('구단',`'디펜딩 챔피언' ${tshort(G.user)}, 시즌권 ${up?'판매 호조':down?'판매 감소 전망':'판매 전망'}`,text,up?1:0,{fanW:up?1:0});
  mail('마케팅팀','우승 효과: 올 시즌 판매 전망',`지난 시즌 우승 이후 현재 구단 인기를 반영한 전망입니다. 우승 전과 비교하면 ${text} 인기는 성적이 따라 주지 않으면 해마다 조금씩 원래대로 돌아갑니다.`,{kind:'구단',acts:[{l:'구단 재정',a:'go',v:'club:fin'}]}); }

function champDaily(){ champGiftDaily();try{ champParade(); }catch(e){} { const o=dobj(G.day); if(o.m===2&&o.d===1)try{ champSalesNote(); }catch(e){} }
  champFundMigrate();for(const f of champFundAll()){if(f.done||G.day<f.due)continue; if(f.assessed==null){if(champFundUsed(f)){f.used=true;f.done=true;continue;}f.assessed=Math.round((f.amt||0)/2);const t=team(f.tid??G.user);t.trust=clamp(t.trust-2,0,100);}
    const t=team(f.tid??G.user),left=Math.max(0,f.assessed-(f.recovered||0)),cash=Math.max(0,Math.min(t.cash||0,sdCash(t.id)+champFundReserve(t.id))),paid=Math.min(left,cash);t.cash-=paid;f.recovered=(f.recovered||0)+paid;f.done=f.recovered>=f.assessed;
    if(t.id===G.user&&!G.unemp&&(paid||!f.noted)){mail('구단주실','FA 특별 자금 회수',`이번 겨울 외부 FA 영입이 없어 ${t.indie?'투자사':'모기업'}에 특별 자금의 절반 ${money(f.assessed)}을 반환합니다. 이번 회수액은 ${money(paid)}입니다.${f.done?'':` 현금이 부족해 남은 ${money(f.assessed-f.recovered)}은 반환 의무로 유지합니다.`}`,{kind:'구단주'});f.noted=true;}
  } }
/* ===== FA가 보는 구단 매력: 돈이 가장 크고, 그 위에 명성·우승 가능성·출전 기회·연고를 얹는다 =====
   비슷한 금액이면 명성 높고 이길 수 있고 주전으로 뛸 수 있고 고향 팀인 구단이 이긴다(대략 ±20% 범위) */
let _faCtx=null;
function faCtx(){ const k=G.year+':'+G.day+':'+(G.mvN||0); /* 같은 날 방출·영입하면 다시 계산(검수 11-09zl) */ if(_faCtx&&_faCtx.k===k)return _faCtx; const R=G.teams.map(t=>({t:t.id,v:teamRating(t.id)})).sort((a,b)=>b.v-a.v); const rank={}; R.forEach((x,i)=>rank[x.t]=i+1);
  const winter=sponSeason()!==G.year; const unsure=p=>winter&&p.foreign&&!fNextOwed(p); /* 결산 뒤 겨울: 다음 시즌 계약이 없는 외국인은 그 자리 주전으로 치지 않는다(사용자 11-14: FA가 재계약 미정인 외국인과 같은 포지션이라고 바로 불리하게 봄) */
  const slot={}; for(const t of G.teams){ const d=depth(t.id); const ln=Object.values(d.ln).some(q=>q&&unsure(q))?makeLineupFrom(t.id,actOf(t.id).filter(q=>!unsure(q))):d.ln; const s={}; for(const k in ln){ if(ln[k])s[k]=ovr(ln[k]); } const sps=d.sp.filter(q=>!unsure(q)); s.SP5=sps.length>=5?spV(sps[4]):0; slot[t.id]=s; }
  const pres={}; for(const t of G.teams)pres[t.id]=clubPrestige(t.id); return _faCtx={k,rank,slot,pres}; }
function faAppeal(p,tid){ const C=faCtx(); const P=[]; const t=team(tid);
  const pr=(C.pres[tid]-55)/300; P.push([`명성 ${starTxt(prestigeStars(C.pres[tid]))}`,pr]);
  const r=C.rank[tid]||5.5; const cont=.04*(5.5-r)/4.5*(p.age>=30?1.6:1); P.push(['우승 가능성',cont]);
  let pt=0; const s=C.slot[tid]||{}; if(p.isP){ if(isSPr(p))pt=spV(p)>s.SP5+1?.05:spV(p)<s.SP5-6?-.08:spV(p)<s.SP5-2?-.03:0; } else { const inc=s[p.pos]; pt=inc==null?.05:ovr(p)>inc+2?.05:ovr(p)<inc-5?-.12:ovr(p)<inc-1?-.05:0; } P.push(['주전 기회',pt*(p.age<=29?1.3:1)]); /* 주전 경쟁이 막힌 구단은 돈만으로 데려오기 어렵게(설문 11-12: 경쟁자가 많아도 돈만 주면 영입). 확실한 주전 자리 +5%, 밀리면 최대 -12%(29세 이하 -16%) */
  { const h=homeTie(p,tid); if(h)P.push([h.l,h.v]); else if(p.region&&t.region===p.region)P.push([`연고(${p.region} 출신)`,.03]); } /* 같은 권역(고향 도시)이면 고향 팀, 넓은 지역만 같으면 조금(11-09d) */
  { const fv=ppFond(p,tid); if(fv)P.push(['단장의 공개 구애',fv/250]); }
  { const ft=typeof foundTie==='function'?foundTie(p,tid):0; if(ft)P.push(['단장 장학재단과의 인연',ft]); } /* 오래 운영한 장학재단은 연고 출신 FA에게 조금 끌린다(11-13) */
  const f=1+sum(P.map(x=>x[1])); return {f:clamp(f,.8,1.3),parts:P.filter(x=>Math.abs(x[1])>=.005)}; }
/* 연고 출신 스타: 구단 연고 지역 출신 주전급(능력 64 이상)이 있으면 팬 인기가 더 오른다(최대 +0.03) */
function c476Region(region){ return region==='호남'||region==='충청'?'호남·충청':region; }
function localStarPop(tid){ const t=team(tid); if(!t||!t.region)return 0; const n=playersOf(tid).filter(p=>!p.foreign&&c476Region(p.region)===c476Region(t.region)&&ovr(p)>=64).length; return Math.min(.03,n*.008); }
