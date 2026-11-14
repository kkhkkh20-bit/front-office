/* ===== 구단주에게 다시 들이박기(사용자 11-14: "구단주가 안 된다고 해도 라이벌 핑계든 뭐든 이야기하고, 몇 번 반복하면 사퇴할 수도") =====
   자금 요청(ownerAsk·ownerPitch)이나 모기업 시설 투자(capexAsk)가 반려되면, 7일 안에 근거 하나를 들고 한 번 더 찾아갈 수 있다.
   근거는 실제 데이터가 받쳐 줄 때만 나오고(라이벌 비교·팬 여론·우승 기회·숫자), 성적 약속과 사퇴 카드는 언제나 꺼낼 수 있다.
   - 확률: 신뢰·단장 명성·구단주 성향×근거 힘·최근 들이박은 횟수·금액. 근거가 약하면 거의 안 되고 더 깎인다
   - 대가: 성공해도 신뢰 -1, 실패 -2(약한 근거 -4). 사퇴 카드가 안 통하면 구단주가 사표를 받기도 한다
   - 참을성: 최근 180일 들이박은 횟수+실패 횟수가 3이 되면 경고("한 번만 더 이러면"). 경고 뒤 또 밀었다 실패하면 사퇴 권고
   - 성적 약속: 받아 주면 그 시즌 결산에서 지키면 +2, 못 지키면 -8
   AI 단장도 반려되면 같은 식·같은 대가로 고른다(aiOwnerAsk·aiFacPlan). 사퇴 권고를 받으면 그 구단 단장이 바뀐다(gmReplace). */
const OP_ARG={rival:{l:'라이벌 비교'},fan:{l:'팬·언론 압박'},title:{l:'우승 기회'},money:{l:'숫자로 설득'},promise:{l:'성적 약속'},resign:{l:'사퇴 카드'}};
/* 구단주 성향별로 귀에 들어오는 근거(곱하는 값) */
const OP_W={win:{rival:1,fan:.4,title:1.2,money:.3,promise:.9},profit:{rival:.5,fan:.7,title:.5,money:1.1,promise:.6},pr:{rival:.7,fan:1.2,title:.7,money:.4,promise:.7}};
const OP_DAYS=180, OP_WARN=3, OP_WIN=7;
function opSt(tid){ const t=team(tid); const S=t.opush=t.opush||{L:[],prom:[]}; S.L=S.L||[]; S.prom=S.prom||[]; return S; }
/* 지금 그 구단을 맡은 단장: 사람 단장은 'me', AI 단장은 그 단장 id(단장이 바뀌면 기록이 이어지지 않는다) */
function opGm(tid){ if(tid===ME())return 'me'; const g=gmOf(tid); return g?g.id:'x'; }
function opRecent(tid){ const gm=opGm(tid); return opSt(tid).L.filter(x=>x.gm===gm&&G.day-x.d<=OP_DAYS); }
function opStrikes(tid){ const L=opRecent(tid); return L.length+L.filter(x=>!x.ok).length; }
function opWarned(tid){ const w=opSt(tid).warn; return !!(w&&w.gm===opGm(tid)&&G.day-w.d<=OP_DAYS); }
function opLevel(tid){ return opWarned(tid)||opStrikes(tid)>=OP_WARN?2:opStrikes(tid)>=1?1:0; }
function opPatience(tid){ return ['구단주가 아직 들어 줄 여유가 있습니다','구단주가 같은 이야기를 반기지 않습니다','구단주의 참을성이 바닥나고 있습니다. 또 밀어붙였다 안 되면 사퇴 권고를 받을 수 있습니다'][opLevel(tid)]; }
/* 단장 명성: 사람 단장은 G.rep, AI 단장은 재임 기간으로 어림한다 */
function opRep(tid){ if(tid===ME())return G.rep??50; const g=gmOf(tid); return clamp(45+Math.min(15,(G.year-((g&&g.since)??G.year))*3),30,60); }
function opStand(){ try{ return period()==='season'?standingsNow():null; }catch(e){ return null; } }
function opGB(a,b){ const r=G.sea&&G.sea.rec; if(!r||!r[a]||!r[b])return 99; return ((r[a].w-r[b].w)+(r[b].l-r[a].l))/2; } /* a가 b보다 앞선 경기 수 */
function opLastRk(tid){ const o=G.last&&G.last.order; if(!o)return null; const i=o.findIndex(x=>(x.tid??x)===tid); return i<0?null:i+1; }
/* --- 근거: 지금 그 구단에 사실인 것만 힘(s, 0~1)을 갖는다 --- */
function opRival(tid){ const st=opStand(); const ord=st||((G.last&&G.last.order)||[]).map(o=>({tid:o.tid??o})); const myI=ord.findIndex(o=>o.tid===tid);
  const named=new Set(Object.values((G.rivalries||{}).pairs||{}).filter(r=>r&&r.label&&(r.a===tid||r.b===tid)).map(r=>r.a===tid?r.b:r.a));
  const C=new Set(named); if(myI>=0)for(let k=-3;k<=2;k++){ const o=ord[myI+k]; if(o&&o.tid!==tid)C.add(o.tid); }
  const since=G.day-120, inc=x=>(G.moves||[]).filter(m=>m.to===x&&m.from!==x&&m.d>=since&&/FA|트레이드|외국인/.test(m.t||'')); const mine=sum(inc(tid).map(m=>m.sal||0));
  let pay0=0; try{ pay0=capPay(tid); }catch(e){} let best=null;
  for(const c of C){ if(c==null||!team(c)||c===tid)continue; const M=inc(c), sal=sum(M.map(m=>m.sal||0)); let s=0, txt='';
    if(sal-mine>=500){ s=clamp((sal-mine)/2500,.2,.9); txt=`${tshort(c)}은(는) 최근 ${M.length}명을 데려오며 연봉 ${money(sal)}을(를) 더 썼습니다`; }
    let pay=0; try{ pay=capPay(c); }catch(e){} if(pay-pay0>=1000){ const s2=clamp((pay-pay0)/5000,.2,.7); if(s2>s){ s=s2; txt=`${tshort(c)} 연봉 총액이 우리보다 ${money(pay-pay0)} 많습니다`; } else s+=.1; }
    if(st){ const ci=ord.findIndex(o=>o.tid===c), gb=opGB(c,tid); if(ci>=0&&ci<myI&&gb<=5&&myI<=6){ const s3=.45; if(s3>s){ s=s3; txt=`${tshort(c)}에 ${gb}경기 뒤져 있는데 그쪽이 치고 나갑니다`; } else s+=.15; } }
    if(!s)continue; if(named.has(c))s+=.15; s=clamp(s,0,1); if(!best||s>best.s)best={s,c,txt:(named.has(c)?'라이벌 ':'')+txt}; }
  return best?{s:Math.round(best.s*100)/100,c:best.c,my:`회장님, ${best.txt}. 이대로면 밀립니다.`}:null; }
function opFan(tid){ const P=prOf(tid); if(!P)return null; const f=Math.round(P.fan), pr=Math.round(P.press); const s=clamp(clamp((50-f)/20,0,1)*.7+clamp((45-pr)/20,0,1)*.5,0,1); if(s<=0)return null;
  return {s:Math.round(s*100)/100,my:f<50?`팬 여론이 ${f}까지 떨어졌습니다. 이번에도 손 놓고 있으면 더 나빠집니다.`:`언론 논조가 ${pr}입니다. 프런트가 아무것도 안 한다는 기사가 나옵니다.`}; }
function opTitle(tid){ const st=opStand(); if(st){ const i=st.findIndex(o=>o.tid===tid); if(i<0)return null; const rk=i+1, gb=rk===1?0:opGB(st[0].tid,tid); const s=rk===1?1:rk===2?.8:rk===3?.6:rk<=5&&gb<=4?.35:0; if(!s)return null;
    return {s,my:rk===1?'지금 1위입니다. 이런 기회는 자주 오지 않습니다.':`지금 ${rk}위, 1위와 ${gb}경기 차입니다. 이런 기회는 자주 오지 않습니다.`}; }
  const lr=opLastRk(tid); if(lr==null||lr>3)return null; return {s:[.5,.4,.3][lr-1],my:`지난해 ${lr}위였습니다. 한 번 더 노려 볼 때입니다.`}; }
function opMoney(tid){ const A=G.sea&&G.sea.att&&G.sea.att[tid], occ=A&&A.cap&&A.n>=10?A.sum/A.cap:null; let f=null; try{ f=capexLastFin(tid); }catch(e){}
  const a=occ!=null?clamp((occ-.75)/.2,0,1)*.6:0, b=f&&f.net>0?clamp(f.net/3000,0,1)*.5:0; const s=clamp(a+b,0,1); if(s<=0)return null;
  const L=[]; if(a>0)L.push(`관중석이 ${Math.round(occ*100)}% 찼고`); if(b>0)L.push(`지난 시즌 ${money(f.net)} 흑자였습니다`); return {s:Math.round(s*100)/100,my:`${L.join(' ')}${b>0?'':' 표가 팔립니다'}. 쓸 여력은 있습니다.`}; }
/* 성적 약속: 그 시즌(sponSeason) 결산에서 판정. 포스트시즌·8월 중순 뒤에는 꺼낼 수 없다(거의 정해진 순위로 약속하는 공략 방지). 한 시즌 하나 */
function opPromiseOf(tid){ const per=period(); if(per==='post')return null; if(per==='season'&&G.day>KD(8,15))return null; const y=sponSeason(), gm=opGm(tid);
  if(opSt(tid).prom.some(p=>p.y===y&&p.gm===gm&&!p.done))return null; const st=opStand(); let rk;
  if(st){ const i=st.findIndex(o=>o.tid===tid); rk=i<0?5:i+1; } else rk=opLastRk(tid)??6;
  const tgt=rk<=3?3:5; const s=rk<=tgt?.75:rk<=tgt+2?.5:.25; return {k:'promise',s,y,tgt,l:tgt===3?'정규시즌 3위 안':'가을야구(5위 안)',my:`이번에 밀어주시면 ${tgt===3?'정규시즌 3위 안에':'가을야구에'} 꼭 들겠습니다.`}; }
/* 꺼낼 수 있는 근거 목록(사퇴 카드는 늘 마지막) */
function opArgs(tid){ const L=[]; const add=(k,x)=>{ if(x)L.push(Object.assign({k},x)); };
  add('rival',opRival(tid)); add('fan',opFan(tid)); add('title',opTitle(tid)); add('money',opMoney(tid)); add('promise',opPromiseOf(tid));
  if(!opResignWhy(tid))L.push({k:'resign',s:1,my:opLegend(tid)>=.4?'이 구단에서 보낸 세월을 걸고 말씀드립니다. 이게 안 되면 물러나겠습니다.':'이게 안 되면 제가 물러나겠습니다.'}); return L; }
/* --- 사퇴 카드(사용자 11-14 추가): 드물게만. 한 시즌 한 번, 쓰고 나면(성패 무관) 두 시즌 뒤에야 다시. 전에 통했으면 구단주가 기억해 약해진다.
   이 구단의 레전드 단장(오래 맡고 우승·높은 승률)이면 구단주가 더 쉽게 물러서고 사표도 잘 받지 않는다. 우리·AI 같은 규칙 --- */
const OP_RS_GAP=2;
function opRsUses(tid){ const gm=opGm(tid); return (opSt(tid).rs||[]).filter(x=>x.gm===gm); }
function opResignWhy(tid){ const U=opRsUses(tid); if(!U.length)return ''; const ly=Math.max(...U.map(x=>x.y)); if(ly===G.year)return '사퇴 카드는 이번 시즌에는 더 쓸 수 없습니다'; if(G.year-ly<OP_RS_GAP)return `사퇴 카드는 ${ly+OP_RS_GAP}시즌부터 다시 꺼낼 수 있습니다`; return ''; }
/* 이 구단에서 쌓은 단장 유산 0~1: 재임 시즌·우승·승률(90_legacy legAt). 새로 온 평범한 단장은 0 */
function opLegend(tid){ let a=null; try{ a=legAt(tid===ME()?legMeK():(gmOf(tid)||{}).id,tid); }catch(e){} if(!a||!a.s)return 0; const pct=a.w+a.l?a.w/(a.w+a.l):.5;
  return Math.round(clamp(clamp((a.s-3)/9,0,1)*.45+Math.min(3,a.c||0)/3*.45+(a.s>=3?clamp((pct-.5)*2,0,.1):0),0,1)*100)/100; }
/* 다시 설득할 확률(우리·AI 같은 식) */
function opBase(tid,ctx){ const t=team(tid); return .16+((t.trust??55)-50)/110+(opRep(tid)-50)/300-.06*opStrikes(tid)-(ctx&&ctx.k==='cap'?Math.max(0,(ctx.amt||0)-2000)/20000:Math.max(0,((ctx&&ctx.amt)||1000)-1000)/6000)+(t.owner==='pr'?.03:0); }
function opOdds(tid,ctx,a){ const t=team(tid); if(!t||t.indie||!a)return 0; const base=opBase(tid,ctx); let p;
  if(a.k==='resign')p=base+.3+.25*opLegend(tid)-.12*opRsUses(tid).filter(x=>x.ok).length; else { const W=(OP_W[t.owner]||OP_W.win)[a.k]||.5; p=base+.34*W*a.s-(a.s<.25?.06:0); }
  return clamp(p*(tid===ME()&&HARD()?.8:1),.03,a.k==='resign'?.8:.7); }
function opHint(p,a){ return a&&a.k!=='resign'&&a.s<.25?'근거가 약합니다':p>=.5?'먹힐 것 같습니다':p>=.33?'해 볼 만합니다':p>=.2?'쉽지 않습니다':'거의 안 통합니다'; }
/* 구단주 대답(해요체) */
function opLine(tid,a,ok,x){ const ow=team(tid).owner||'win'; const R0=a&&a.c!=null?tshort(a.c):'';
  if(ok){ const T={rival:{win:`${R0} 쪽이 그렇게 나온다니 가만있을 수 없죠. 이번엔 해 봅시다.`,profit:`${R0}가 쓴다고 따라 쓰는 건 싫지만… 이번 한 번은 받아 줄게요.`,pr:`${R0}한테 밀린다는 소리는 듣기 싫어요. 좋아요.`},
      fan:{win:'팬들 성화가 대단하긴 하네요. 대신 성적으로 갚으세요.',profit:'여론이 나쁘면 표도 안 팔리죠. 알겠어요.',pr:'팬들이 그렇게까지 말한다면 들어야죠. 진행하세요.'},
      title:{win:'해 볼 만한 순위죠. 지금 밀어줄게요.',profit:'우승하면 남는 것도 있겠죠. 이번만이에요.',pr:'우승 경쟁이면 그림이 좋네요. 승인할게요.'},
      money:{win:'숫자는 괜찮네요. 쓰세요.',profit:'숫자로 가져오니 얘기가 되네요. 승인할게요.',pr:'관중이 찬다니 다행이에요. 해 보세요.'},
      promise:{win:`좋아요, ${a&&a.l||'약속'} 받았어요. 못 지키면 그땐 각오하세요.`,profit:`${a&&a.l||'약속'}이라… 적어 둘게요. 못 지키면 책임지세요.`,pr:`${a&&a.l||'약속'}, 팬들 앞에서도 한 말로 알게요.`},
      resign:{win:'그렇게까지 나오니… 알겠어요. 대신 이번이 마지막이에요.',profit:'사표로 협박하는 건 처음이자 마지막이에요. 이번만 들어줄게요.',pr:'그렇게까지 하겠다면 믿어 볼게요. 다시는 이러지 마세요.'}};
    return (T[a.k]||T.money)[ow]; }
  if(x==='out')return '더는 같이 못 하겠어요. 스스로 물러나 주세요.';
  if(x==='accept')return '그럼 그렇게 하세요. 그동안 수고 많았어요.';
  if(x==='refuse')return '사표 같은 소리 하지 말고 하던 일이나 하세요. 돈은 안 돼요.';
  if(a&&a.k!=='resign'&&a.s<.25){ const W={rival:`${R0}랑 비교하는 건 억지예요.`,fan:'팬 여론이 그렇게 나쁘지도 않던데요?',title:'그 순위에서 우승 얘기는 이르죠.',money:'숫자를 보니 더 못 주겠네요.',promise:'말로만 하는 약속은 안 믿어요.'}; return W[a.k]||'근거가 약해요.'; }
  return ow==='profit'?'숫자가 안 맞으면 안 되는 거예요. 같은 말 두 번 하게 하지 마세요.':ow==='win'?'성적이 먼저예요. 같은 말 두 번 하게 하지 마세요.':'지금은 모양이 안 좋아요. 이 얘기는 그만해요.'; }
/* 한 번 들이박기: 굴림·신뢰·기록·경고·약속까지. 돈이나 공사 승인은 부른 쪽이 한다.
   돌려주는 것: {ok,p,cost,out(사퇴 권고/사표 수리),warned,line} */
var OP_TEST=null; /* 점검용 고정 굴림(배열) */
function opRun(tid,ctx,a,rolls){ rolls=rolls||OP_TEST; const roll=()=>rolls&&rolls.length?rolls.shift():R(); const t=team(tid); const lv=opLevel(tid), p=opOdds(tid,ctx,a); const ok=roll()<p; const S=opSt(tid), gm=opGm(tid); let cost=0, out=null, warned=false; const lines=[];
  if(ok){ cost=1; lines.push(opLine(tid,a,true)); if(a.k==='promise')S.prom.push({y:a.y,gm,tgt:a.tgt,l:a.l,d:G.day}); }
  else if(a.k==='resign'){ const q=clamp(.3+(50-(t.trust??55))/70+.12*opStrikes(tid)-.4*opLegend(tid),.05,.9); /* 레전드의 사표는 잘 받지 않는다 */ if(roll()<q){ out='accept'; lines.push(opLine(tid,a,false,'accept')); } else { cost=5; lines.push(opLine(tid,a,false,'refuse')); } }
  else { cost=a.s<.25?4:2; if(lv>=2&&roll()<clamp(.45+(50-(t.trust??55))/80,.25,.9)){ out='out'; lines.push(opLine(tid,a,false,'out')); } else lines.push(opLine(tid,a,false)); }
  if(a.k==='resign'){ S.rs=(S.rs||[]).concat({y:G.year,d:G.day,gm,ok}).slice(-6); }
  t.trust=clamp((t.trust??55)-cost,0,100); S.L.push({d:G.day,gm,a:a.k,ok,k:ctx&&ctx.k}); if(S.L.length>20)S.L.splice(0,S.L.length-20);
  if(!out&&!opWarned(tid)&&opStrikes(tid)>=OP_WARN){ S.warn={gm,d:G.day}; warned=true; lines.push('이 얘기는 여기까지 해요. 한 번만 더 이러면 저도 생각이 있어요.'); }
  (G.opLog=G.opLog||[]).push({y:G.year,tid,me:gm==='me',a:a.k,ok,p:Math.round(p*100)/100,out:!!out,amt:(ctx&&ctx.amt)||0,k:ctx&&ctx.k}); if(G.opLog.length>300)G.opLog.splice(0,G.opLog.length-300);
  return {ok,p,cost,out,warned,line:lines.join(' ')}; }
/* 구단주가 사표를 받거나 사퇴를 권고하면: 사람 단장은 야인, AI 단장은 교체 */
function opForcedOut(tid,kind){ const t=team(tid);
  if(tid===ME()){ G.rep=clamp((G.rep??50)-3,0,100); const msg=kind==='accept'?'자금 문제로 구단주에게 사표 카드를 꺼냈다가 그대로 수리됐습니다.':'자금 문제로 구단주와 거듭 부딪힌 끝에 사퇴 권고를 받고 물러났습니다.';
    try{ news('언론',`${tshort(tid)} ${meName()?meName()+' ':''}단장 사퇴`,`${tname(tid)} 단장이 구단주와 갈등 끝에 물러났습니다.`,-1); }catch(e){} firedFlow(G.year,`${msg} 명성 하락.`,'resign'); return; }
  const g=gmOf(tid); if(!g||g.interim)return; t.trust=45; delete t.opush;
  gmReplace(t,g,{chron:`${g.name} 단장 사퇴 · 구단주와 자금 갈등`,why:kind==='accept'?'자금 문제로 사표를 던졌고 구단주가 받아들였다는 이야기입니다':'자금 문제로 구단주와 거듭 부딪힌 끝에 사퇴 권고를 받았다는 평가입니다'}); }
/* 결산: 그 시즌 약속을 지켰는지(우리는 settlement, AI는 aiOwnerYear에서 부른다). 돌려주는 값은 신뢰 변화 */
function opPromSettle(tid,y,rk){ const S=team(tid).opush; if(!S||!S.prom)return 0; const gm=opGm(tid); let d=0;
  for(const p of S.prom){ if(p.done||p.y!==y)continue; p.done=true; if(p.gm!==gm){ p.void=true; continue; } const kept=rk<=p.tgt; p.kept=kept; d+=kept?2:-8;
    if(gm==='me')mail('구단주실',kept?'구단주: "약속은 지켰네요"':'구단주: "약속하지 않았나요"',kept?`${p.l} 약속을 지켰습니다(${rk}위). 구단주 신뢰 +2.`:`다시 설득하며 ${p.l}을(를) 약속했지만 ${rk}위에 그쳤습니다. 구단주 신뢰 -8.`,{kind:'구단주',imp:!kept}); }
  S.prom=S.prom.filter(p=>!p.done||p.y>=y-1); return d; }

/* --- 사람 단장: 반려 소식에 '다시 설득하기' 결정을 붙인다(7일). 붙였으면 true(부른 쪽은 반려 메일을 따로 보내지 않는다) --- */
function ownPushOffer(ctx,subj,body,g){ const t=team(G.user); if(!t||t.indie||G.unemp||G._away)return false;
  if(g){ g.pk='op'+(G.opSeq=(G.opSeq||0)+1); ctx.pk=g.pk; }
  const A=opArgs(G.user); const opts=A.map(a=>{ const p=opOdds(G.user,ctx,a); return {l:`${OP_ARG[a.k].l} · ${opHint(p,a)}`,fx:`"${a.my}"${a.k==='promise'?` 받아 주면 ${a.l}이(가) 약속이 됩니다. 못 지키면 결산 때 신뢰가 크게 깎입니다.`:a.k==='resign'?' 안 통하면 사표가 수리될 수 있습니다.':''}`}; });
  opts.push({l:'물러선다',fx:'반려를 받아들입니다. 변화 없음.'});
  evNew('opush',subj,`${body}\n\n${OP_WIN}일 안에 근거 하나를 들고 다시 설득해 볼 수 있습니다. 성공해도 신뢰가 조금 깎이고, 실패하면 더 깎입니다. 지금 ${opPatience(G.user)}.${opResignWhy(G.user)?` ${opResignWhy(G.user)}.`:''}`,opts,{from:'구단주실',exp:OP_WIN,def:opts.length-1,data:{tid:G.user,ctx,args:A.map(a=>a.k)}});
  return true; }
/* 결정할 때 다시 본다: 그 구단 일인지, 아직 쓸 데가 있는지 */
function opCtxWhy(ctx){ if(!ctx)return '설득할 일이 없습니다.';
  if(ctx.k==='cap'){ try{ const e=facCanStart(G.user,ctx.fk); if(e)return e; }catch(e){} return ''; }
  const g=grants().find(x=>x.pk===ctx.pk); if(!g||g.st!=='no'||(g.tid!=null&&g.tid!==G.user))return '이미 끝난 요청입니다.'; const pur=g.pur;
  if(pur&&pur.k==='fa'){ const q=G.players[pur.pid]; if(!(G.fa&&G.fa.open&&!G.fa.closed&&q&&q.team==null&&q.ask&&G.fa.pool.includes(q.id)&&!faOutBlocked(G.user,q)))return '그 FA는 이제 데려올 수 없어 설득할 이유가 없습니다.'; }
  if(pur&&pur.k==='frep'&&G.day>foreignDL())return '외국인 등록 마감이 지났습니다.';
  if(pur&&pur.k==='boost'&&period()==='season'&&G.day>tradeDL())return '트레이드 마감이 지났습니다.'; return ''; }
function opApplyUser(ctx){
  if(ctx.k==='cap'){ const r=capexAsk('fac',ctx.fk,true); return r||'모기업 투자로 공사를 시작했습니다.'; }
  const g=grants().find(x=>x.pk===ctx.pk); g.ok=true; g.st=g.pur?'open':'done'; g.push=1; if(g.pur&&g.pur.k==='fac')g.until=G.day+FAC_GRANT_DAYS; /* 공사 기한은 승인한 날부터 */ grantApply(g.amt);
  if(g.pitch&&g.pitch.cmts&&g.pitch.cmts.length){ const ny=G.year+(period()==='off'||period()==='post'?1:0); for(const c of g.pitch.cmts)if(PITCH_CMT[c])(G.pitchCommit=G.pitchCommit||[]).push({y:ny,k:c,v:PITCH_CMT[c].v,l:PITCH_CMT[c].l}); }
  return `${money(g.amt)}을(를) 받았습니다. ${g.pur?'목적대로 쓰지 않으면 신뢰가 깎입니다.':''}`; }
EVH.opush={
  can(e,i){ if(i>=e.opts.length-1)return ''; if(e.data.tid!==G.user||G.unemp)return '이제 그 구단 일이 아닙니다.'; return opCtxWhy(e.data.ctx); },
  pick(e,i){ if(i>=e.opts.length-1)return '반려를 받아들였습니다.'; if(e.data.tid!==G.user||G.unemp)return '구단을 떠나 이 일은 끝났습니다.'; const why=opCtxWhy(e.data.ctx); if(why)return why;
    const k=(e.data.args||[])[i]; const a=opArgs(G.user).find(x=>x.k===k); if(!a){ e.pick=e.opts.length-1; return '그 근거는 이제 사실이 아니라 꺼낼 수 없었습니다. 반려를 받아들였습니다.'; } /* 기다리는 사이 상황이 바뀌면 그 근거는 없다 */
    const B=bossOf(G.user); const r=opRun(G.user,e.data.ctx,a); let txt=`${B.own.name} 회장: "${r.line}"`;
    if(r.ok){ const got=opApplyUser(e.data.ctx); txt+=`\n다시 설득했습니다. ${got} 구단주 신뢰 -${r.cost}.${a.k==='promise'?` 약속: ${a.l}(${a.y}시즌 결산 때 확인).`:''}`; }
    else txt+=`\n설득하지 못했습니다.${r.cost?` 구단주 신뢰 -${r.cost}.`:''}`;
    if(r.warned)txt+='\n구단주가 경고했습니다. 한 번 더 밀어붙였다 안 되면 자리가 위험합니다.';
    mail('구단주실',r.ok?`구단주 승인(재설득): ${OP_ARG[a.k].l}`:r.out?'구단주: "물러나 주세요"':`구단주 재반려: ${OP_ARG[a.k].l}`,txt,{kind:'구단주',imp:!r.ok});
    if(r.out){ opForcedOut(G.user,r.out); return '구단주가 사표를 받았습니다.'; } return r.ok?'다시 설득했습니다.':'설득하지 못했습니다.'; } };

/* --- AI 단장: 반려되면 같은 식으로 근거를 고르고, 될 성싶을 때만 다시 찾아간다. 돌려주는 값: 설득 성공 여부 --- */
function aiPushTry(t,ctx){ if(!t||t.indie||t.id===ME())return false; const g=gmOf(t.id); if(!g||g.interim)return false;
  const lv=opLevel(t.id); const A=opArgs(t.id).map(a=>({a,p:opOdds(t.id,ctx,a)})); const tr=gmTrait(t.id); const bar=(lv>=2?.5:.33)+(tr==='gambler'?-.04:tr==='data'||tr==='miser'?.04:0);
  let best=A.filter(x=>x.a.k!=='resign'&&x.a.s>=.25).sort((x,y)=>y.p-x.p)[0]; const rs=A.find(x=>x.a.k==='resign');
  if(rs&&lv===0&&(t.trust??55)>=65&&rs.p>=(best?best.p:0)+.15)best=rs; /* 신뢰가 두터울 때만 사표를 건다 */
  if(!best||best.p<bar)return false; const r=opRun(t.id,ctx,best.a);
  if(r.out){ opForcedOut(t.id,r.out); return false; }
  if(r.ok)try{ wire('구단',`${t.city} ${t.nick} 단장, 구단주 다시 설득해 ${ctx.k==='cap'?'시설 투자':'추가 지원'} 받아 내`,{tid:t.id}); }catch(e){}
  return r.ok; }
