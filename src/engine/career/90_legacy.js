/* ===== 단장 레거시: 오래 한 단장에게 남는 것 (피드백 11-09p) =====
 실제 KBO에는 단장을 구단 레전드로 기리는 공식 제도가 뚜렷하지 않다. 그래서 과장하지 않고 '구단이 공로를 기리는' 정도로만 둔다.
 - G.gmRec: 리그 역대 단장 재임 요약. 사람·구단마다 한 줄 {k:사람, n:이름, t:구단, y0, y1, s:시즌, w, l, c:우승, u:내 계보}. 시즌 결산 때 그해 단장에게 한 시즌을 더한다.
   AI 단장의 지난 기록은 이 기능 전에는 남지 않았으므로, 옛 저장은 지금 재임 중인 AI 단장(부임 해부터)과 내 경력만 되살린다.
 - G.gmLeg: 구단 공로자 기사(구단별 한 번)·구단주의 사장·고문 제안(게임당 한 번).
 아래 기준값은 게임 기준이다(실제 제도 근거 없음, 보수적으로 잡았다). */
const LEG_MAX=240; /* 역대 단장 줄 상한(한 줄 약 80바이트) */
const LEG_HON={s:10,c:2,c5:5}; /* 구단 공로자: 한 구단 10시즌 이상 + 우승 2회 이상, 또는 그 구단 우승 5회 */
const LEG_PRES={s:15,trust:60}; /* 사장·고문 제안: 한 구단 연속 15시즌 이상 + 구단주 신뢰 60 이상 */
function legMeK(){ return 'u'+(G.gmLine||[]).length; } /* 내 계보의 몇 대 단장인가(세대 교체마다 다른 사람) */
function legMeName(){ return (G.gmP&&G.gmP.name)||'단장'; }
function legRec(){ if(G.gmRec)return G.gmRec; const D={y:null,L:[]}; try{ legBackfill(D); }catch(e){} return D; }
function legEnsure(){ return G.gmRec||(G.gmRec=legRec()); }
/* 옛 저장: 단장 계보·내 시즌 기록·지금 AI 단장의 재임 기간으로 되살린다 */
function legBackfill(D){ const H=(G.history||[]).filter(h=>h.order&&h.order[0]&&h.order[0].w!=null); D.y=H.length?H[H.length-1].y:null;
  (G.gmLine||[]).forEach((x,i)=>D.L.push({k:'u'+i,n:x.name,t:x.tid,y0:x.from,y1:x.to,s:x.seas||x.n||0,w:x.w||0,l:x.l||0,c:x.champ||0,u:1}));
  const S=((G.myC&&G.myC.seas)||[]).filter(s=>!s.part).slice().sort((a,b)=>a.y-b.y); let cur=null;
  for(const s of S){ if(!cur||cur.t!==s.tid||s.y>cur.y1+1){ cur={k:legMeK(),n:legMeName(),t:s.tid,y0:s.y,y1:s.y,s:0,w:0,l:0,c:0,u:1}; D.L.push(cur); } cur.y1=s.y; cur.s++; cur.w+=s.w||0; cur.l+=s.l||0; if(s.ch===1)cur.c++; }
  for(const t of G.teams){ const g=t.gm; if(!g||g.interim||t.id===G.user&&!G.unemp)continue; const Hs=H.filter(h=>h.y>=g.since); if(!Hs.length)continue; const r={k:g.id,n:g.name,t:t.id,y0:Hs[0].y,y1:Hs[Hs.length-1].y,s:0,w:0,l:0,c:0};
    for(const h of Hs){ const o=h.order.find(o=>o.tid===t.id); if(!o)continue; r.s++; r.w+=o.w||0; r.l+=o.l||0; if(h.champ===t.id)r.c++; } if(r.s)D.L.push(r); } }
const legPct=x=>x.w+x.l?x.w/(x.w+x.l):0;
/* 단장 명예의 전당 점수 = 우승 ×10 + 재임 시즌 + (승률 − .500) ×100 (짧은 재임은 승률 몫을 줄인다) */
function legScore(x){ return x.c*10+x.s+Math.round((legPct(x)-.5)*100*Math.min(1,x.s/5)); }
function legTrim(D){ if(D.L.length<=LEG_MAX)return; const ranked=D.L.slice().sort((a,b)=>(b.y1>=D.y)-(a.y1>=D.y)||Number(!!b.u)-Number(!!a.u)||legScore(b)-legScore(a)||b.y1-a.y1),keep=new Set(ranked.slice(0,LEG_MAX));D.L=D.L.filter(x=>keep.has(x)); }
/* 결산 전에 초기화하고, 개인 경력과 같은 부임 후 승패·시즌 종료 당시 단장에게 귀속한다. */
function legSeason(owners){ const L=G.last; if(!L||!L.order)return; const D=legEnsure(), y=L.y; if(D.y!=null&&y<=D.y)return; D.y=y; const champ=L.ps&&L.ps.champ;
  for(const o of L.order){const tid=o.tid,finished=G.gmLegFinish?.y===y&&G.gmLegFinish.by?.[tid],owner=finished||(owners&&owners[tid]);let k,n,u=0,w=o.w||0,l=o.l||0,c=champ===tid?1:0;
    if(owner?.u&&owner.psDone)continue;if(owner){({k,n,u=0}=owner);if(u){w=Math.max(0,w-(owner.w||0));l=Math.max(0,l-(owner.l||0));if(owner.psDone)c=0;}}
    else if(tid===G.user&&!G.unemp){const J=G.gmJoin;if(J&&J.y===y&&J.tid===tid&&J.psDone)continue;k=legMeK();n=legMeName();u=1;const mine=(G.myC?.seas||[]).find(s=>s.y===y&&s.tid===tid&&!s.part);w=mine?mine.w:Math.max(0,w-(J?.w||0));l=mine?mine.l:Math.max(0,l-(J?.l||0));}
    else{const g=team(tid).gm;if(!g||g.interim)continue;k=g.id;n=g.name;}
    let r=D.L.find(x=>x.k===k&&x.t===tid&&(!x.endD||owner?.endD===x.endD)&&x.y1>=y-1);if(!r){r={k,n,t:tid,y0:y,y1:y,s:0,w:0,l:0,c:0};if(u)r.u=1;if(owner?.endD)r.endD=owner.endD;D.L.push(r);}r.n=n;r.y1=y;r.s++;r.w+=w;r.l+=l;r.c+=c;
  }if(G.gmLegFinish?.y===y)delete G.gmLegFinish;legTrim(D);try{legOwnerOffer();}catch(e){} }
function legOwners(){const O={};for(const t of G.teams){if(t.id===G.user&&!G.unemp){const J=G.gmJoin&&G.gmJoin.y===G.year&&G.gmJoin.tid===t.id?G.gmJoin:null;O[t.id]={k:legMeK(),n:legMeName(),u:1,w:J?.w||0,l:J?.l||0,psDone:!!J?.psDone};}else if(t.gm&&!t.gm.interim)O[t.id]={k:t.gm.id,n:t.gm.name};}return O;}
/* 한 사람이 한 구단에서 쌓은 합(여러 번 맡았으면 더한다) */
function legAt(k,tid){ const A=legRec().L.filter(x=>x.k===k&&x.t===tid); return {s:sum(A.map(x=>x.s)),c:sum(A.map(x=>x.c)),w:sum(A.map(x=>x.w)),l:sum(A.map(x=>x.l)),y0:A.length?Math.min(...A.map(x=>x.y0)):null,y1:A.length?Math.max(...A.map(x=>x.y1)):null}; }
const legHonQ=a=>(a.s>=LEG_HON.s&&a.c>=LEG_HON.c)||a.c>=LEG_HON.c5;
/* 지금 그 구단을 맡고 있는가 */
function legCur(x){if(x.endD)return false;const match=y=>!y.endD&&y.k===x.k&&y.t===x.t;const last=legRec().L.filter(match).reverse().sort((a,b)=>b.y0-a.y0||b.y1-a.y1).at(0);if(last&&last!==x&&(G.gmRec||last.y0!==x.y0||last.y1!==x.y1))return false;if(x.u)return x.k===legMeK()&&x.t===G.user&&!G.unemp;const g=team(x.t)&&team(x.t).gm;return !!(g&&g.id===x.k);}
/* 구단 공로자: 기준을 채운 단장이 그 구단을 떠나거나 물러나면 구단 역사에 이름을 남기고 기사가 난다(내 단장만 기사, 구단마다 한 번) */
function legHonor(tid){ if(tid==null)return null; const k=legMeK(), a=legAt(k,tid); if(!legHonQ(a))return null; G.gmLeg=G.gmLeg||{hon:[],pres:null}; if(G.gmLeg.hon.some(h=>h.k===k&&h.t===tid))return null;
  const n=legMeName(), pct=legPct(a).toFixed(3).replace(/^0/,''), h={k,n,t:tid,y:G.year,y0:a.y0,y1:a.y1,s:a.s,c:a.c}; G.gmLeg.hon.push(h);
  try{ chron('gm',`${n} 단장, 구단 공로자로 이름을 남김 (${a.y0}~${a.y1}, ${a.s}시즌, 우승 ${a.c}회)`,null,tid); }catch(e){}
  try{ news('구단',`${tshort(tid)}, ${n} 전 단장의 공로를 기린다`,`${a.y0}년부터 ${a.s}시즌 동안 ${tname(tid)}을(를) 이끈 ${n} 단장이 물러났습니다. 한국시리즈 우승 ${a.c}회, 정규시즌 승률 ${pct}. 구단은 구단 역사에 그의 이름을 공로자로 남기기로 했습니다.`,2); }catch(e){}
  return h; }
/* 구단주의 사장(대표이사)·고문 제안: 한 번만. 수락 여부는 기록만 하고 게임은 그대로 이어진다 */
function legOwnerOffer(){ G.gmLeg=G.gmLeg||{hon:[],pres:null}; if(G.gmLeg.pres||G.unemp||G.user==null||G.gameOver)return null; const t=team(G.user);if(!t||t.indie)return null;const r=legRec().L.find(x=>x.k===legMeK()&&x.t===G.user&&!x.endD&&x.y1===legRec().y);
  if(!r||r.s<LEG_PRES.s||(t.trust??0)<LEG_PRES.trust)return null; const age=typeof meAge==='function'?meAge():null; const adv=age!=null&&age>=65; const role=adv?'구단 고문':'대표이사(사장)';
  G.gmLeg.pres={y:G.year,tid:G.user,k:legMeK(),n:legMeName(),role,ans:null,s:r.s};
  mail('구단주실',`${role} 자리를 제안합니다`,`${r.y0}년부터 ${r.s}시즌 동안 구단을 맡아 주셨습니다. 구단주는 단장님께 ${adv?'물러나신 뒤에도 구단 고문으로 남아 주실 것':'대표이사(사장)를 겸해 구단 운영 전반을 맡아 주실 것'}을 제안합니다.\n\n수락하든 사양하든 단장 업무는 지금처럼 이어집니다. 답은 구단 연대기와 단장 레거시에 남습니다.`,{imp:true,kind:'경력',acts:[{l:'수락합니다',a:'legPres',v:'1'},{l:'정중히 사양합니다',a:'legPres',v:'0'}]});
  return G.gmLeg.pres; }
function legPresAns(v){ const P=G.gmLeg&&G.gmLeg.pres; if(!P||P.ans!=null)return '이미 답했습니다.';if(G.unemp||P.tid!==G.user||P.k!==legMeK())return '이전 구단 또는 전임 단장에게 온 제안이라 답할 수 없습니다.'; P.ans=v?1:0; P.ad=G.year;
  try{ chron('gm',`${legMeName()} 단장, 구단주의 ${P.role} 제안을 ${v?'수락':'사양'}`,null,P.tid); }catch(e){}
  if(v)try{ news('구단',`${tshort(P.tid)} ${legMeName()} 단장, ${P.role}${P.role.startsWith('대표')?' 겸임':''}`,`${P.s}시즌 동안 구단을 이끈 ${legMeName()} 단장이 구단주의 제안을 받아들였습니다.`,1); }catch(e){}
  return ''; }
/* 5년 구간: 리그 역대 최고 5년(구단마다 겹치지 않게)과 내 최고 5년 */
function legWins5(){ const H=(G.history||[]).filter(h=>h.order&&h.order[0]&&h.order[0].w!=null); const W=[];
  for(const t of G.teams)for(let i=0;i+5<=H.length;i++){ const S=H.slice(i,i+5); if(S[4].y-S[0].y!==4)continue; let w=0,l=0,c=0; for(const h of S){ const o=h.order.find(o=>o.tid===t.id); if(!o){ w=-1; break; } w+=o.w||0; l+=o.l||0; if(h.champ===t.id)c++; } if(w>=0)W.push({t:t.id,y0:S[0].y,y1:S[4].y,w,l,c}); }
  const sc=x=>x.c*1000+legPct(x); W.sort((a,b)=>sc(b)-sc(a)); const pick=[]; for(const x of W)if(!pick.some(p=>p.t===x.t&&p.y1>=x.y0&&x.y1>=p.y0))pick.push(x);
  const gmOf5=x=>{ const r=legRec().L.find(r=>r.t===x.t&&r.y0<=x.y0+2&&r.y1>=x.y0+2); return r?r.n:null; }; /* 가운데 해 단장 */
  for(const x of pick){ x.gm=gmOf5(x); x.sc=sc(x); }
  const S=((G.myC&&G.myC.seas)||[]).filter(s=>!s.part).slice().sort((a,b)=>a.y-b.y); let me=null;
  for(let i=0;i+5<=S.length;i++){ const Q=S.slice(i,i+5); if(Q[4].y-Q[0].y!==4||Q.some(s=>s.tid!==Q[0].tid))continue; const x={t:Q[0].tid,y0:Q[0].y,y1:Q[4].y,w:sum(Q.map(s=>s.w)),l:sum(Q.map(s=>s.l)),c:Q.filter(s=>s.ch===1).length}; x.sc=sc(x); if(!me||x.sc>me.sc)me=x; }
  if(me){ me.gm=legMeName(); me.rk=W.filter(p=>sc(p)>me.sc).length+1; }
  return {top:pick,me}; }
/* 사람별 합계(단장 명예의 전당) */
function legPeople(){ const M=new Map(); for(const x of legRec().L){ let p=M.get(x.k); if(!p){ p={k:x.k,n:x.n,u:!!x.u,ts:[],s:0,w:0,l:0,c:0,y0:x.y0,y1:x.y1,cur:false}; M.set(x.k,p); }
    if(!p.ts.includes(x.t))p.ts.push(x.t); p.s+=x.s; p.w+=x.w; p.l+=x.l; p.c+=x.c; p.y0=Math.min(p.y0,x.y0); if(x.y1>=p.y1){ p.y1=x.y1; p.n=x.n; } if(legCur(x))p.cur=true; }
  const L=[...M.values()]; L.forEach(p=>p.sc=legScore(p)); return L.sort((a,b)=>b.sc-a.sc||b.c-a.c||b.s-a.s); }
(function(){
  const wrap=(name,after,before)=>{ try{ const f=eval(name); if(typeof f!=='function')return; const g=function(){ let b; if(before)try{ b=before.apply(this,arguments); }catch(e){} const r=f.apply(this,arguments); if(after)try{ after.call(this,r,arguments,b); }catch(e){} return r; }; eval(name+'=g'); }catch(e){} };
  wrap('settlement',(r,a,b)=>legSeason(b),()=>{legEnsure();return legOwners();});
  wrap('switchTeam',null,function(tid){legEnsure();if(myCOver()){const g=team(tid)?.gm;if(g&&!g.interim){const F=G.gmLegFinish?.y===G.year?G.gmLegFinish:(G.gmLegFinish={y:G.year,by:{}});F.by[tid]={k:g.id,n:g.name,endD:G.day};}}});
  wrap('archPlayer',(r,a)=>{const p=a[0],x=p&&G.arch?.[p.id];if(x&&p.fr)x.fr={...p.fr};});
  /* 맡은 구단을 떠나는 모든 길(이직·사임·경질·계약 만료·세대 교체)이 지나는 곳 */
  wrap('myCClose',(r,a,b)=>{if(b?.tid!=null){const D=legEnsure();for(const x of D.L)if(x.k===b.k&&x.t===b.tid&&!x.endD)x.endD=G.day;legHonor(b.tid);}},()=>{legEnsure();const tid=G.myC&&G.myC.tid,J=G.gmJoin;if(tid!=null&&myCOver()&&!(J&&J.y===G.year&&J.tid===tid&&J.psDone)){const F=G.gmLegFinish?.y===G.year?G.gmLegFinish:(G.gmLegFinish={y:G.year,by:{}});F.by[tid]={k:legMeK(),n:legMeName(),u:1,w:J?.w||0,l:J?.l||0,endD:G.day};}return {tid,k:legMeK()};});
})();
