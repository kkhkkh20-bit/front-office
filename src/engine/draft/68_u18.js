/* ===== U-18 청소년 대표팀 (사용자 11-17 "고교와 해외리그 활성화"): 가벼운 해마다 행사 =====
   - 8월 1일 선발: 협회가 공개 정보(그해 고교 기록·언론 순위·대회 측정 구속)만으로 20명(투수 10·포수 2·내야 5·외야 3)을 뽑는다. 잘하는 2학년도 들어간다.
   - 9월 1~8일 대회: 홀수 해 U-18 야구 월드컵, 짝수 해 아시아 청소년 선수권. 결과는 9월 8일 소식으로(조별 리그 → 슈퍼 라운드 → 결승).
   - 효과: 국제 대회 중계는 모든 구단이 똑같이 본다 → 대표 선수마다 모든 구단 관찰 +1(다른 정보는 주지 않는다). 선수 화면에 'U-18 대표' 표시.
   - 난수: 대회 결과는 seededRand('u18:연도')만 쓴다(본 게임 난수 순서 그대로). 결과에는 실제 능력이 들어가지만 결과(승패·기록 한 줄)만 공개된다 */
const U18_N={P:10,C:2,IF:5,OF:3};
const U18_EV=y=>y%2?'U-18 야구 월드컵':'아시아 청소년 야구 선수권';
const U18_OPP={w:[['일본',60],['미국',58],['대만',56],['쿠바',51],['베네수엘라',50],['호주',47],['멕시코',47],['파나마',46],['네덜란드',44],['푸에르토리코',46],['니카라과',42]],a:[['일본',60],['대만',56],['중국',42],['필리핀',33],['홍콩',29],['파키스탄',27],['스리랑카',25]]};
function u18Pos(x){ const pos=x.pos||(x.e&&x.e.pos)||(x.p&&x.p.pos)||''; return x.isP?'P':pos==='C'?'C':['1B','2B','3B','SS'].includes(pos)?'IF':'OF'; }
/* 공개 점수: amSuggest와 같은 기록 점수 + 언론 순위(졸업 학년 후보) + 측정 구속. 2학년은 조금 깎는다(경험) */
function u18Score(x){ const h=x.row; let s; if(x.isP){ if(h.outs<30)return -9; s=(4.5-h.er*27/h.outs)*.6+(h.so*27/h.outs-7)*.25; } else { if(h.pa<35)return -9; s=(bRate(h).ops-.8)*5; }
  const p=x.kind==='p'?x.p:null, src=p||x.e; if(p&&p.press)s+=Math.max(0,(40-p.press)/40)*1.6; const v=src&&amVm(src); if(x.isP&&v)s+=Math.max(0,v.v-145)*.12; if(x.gr<3)s-=.35; return s; }
function u18Select(y){ if(!amOn())return null; if(G.u18&&G.u18.y===y)return G.u18; const L=amYearRows(y,'hs').filter(x=>x.gr>=2).map(x=>Object.assign({s:u18Score(x),g:u18Pos(x)},x)).filter(x=>x.s>-9).sort((a,b)=>b.s-a.s||(String(a.id)<String(b.id)?-1:1));
  const out=[], used=new Set(), bySch={}; for(const g of ['P','C','IF','OF']){ for(const x of L){ if(out.filter(o=>o.g===g).length>=U18_N[g])break; if(x.g!==g||used.has(x.id))continue; if((bySch[x.sch]||0)>=3)continue; /* 한 학교 3명까지 */ used.add(x.id); bySch[x.sch]=(bySch[x.sch]||0)+1; out.push(x); } }
  const U={y,ev:U18_EV(y),L:out.map(x=>({id:x.id,kind:x.kind,n:x.n,sch:x.sch,gr:x.gr,isP:x.isP,g:x.g,s:Math.round(x.s*100)/100})),res:null}; G.u18=U;
  for(const x of U.L){ const o=u18Src(x); if(o)o.u18=y; }
  if(!G.unemp&&U.L.length){ const n2=U.L.filter(x=>x.gr<3).length; const top=Object.entries(bySch).sort((a,b)=>b[1]-a[1])[0]; const ace=U.L.find(x=>x.isP);
    wire('아마',`U-18 청소년 대표 ${U.L.length}명 발표(${U.ev}) · 투수 ${U.L.filter(x=>x.isP).length}·야수 ${U.L.filter(x=>!x.isP).length}${n2?` · 2학년 ${n2}명`:''}${top&&top[1]>=2?` · ${top[0]} ${top[1]}명`:''}${ace?` · 에이스 ${ace.n}(${ace.sch})`:''}`,{ref:ace&&ace.kind==='p'?ace.id:null}); }
  return U; }
/* 대표 선수 원본(후보 G.players · 저학년 G.amU · 부원은 없음) */
function u18Src(x){ return x.kind==='p'?G.players[x.id]:x.kind==='e'?amPipe().L[x.id]:null; }
const u18Of=x=>{ const U=G.u18; return !!(U&&U.L&&U.L.some(o=>o.id===(x&&x.id))&&U.y>=G.year-1)||!!(x&&x.u18&&x.u18>=G.year-1); };
/* 대회: 대표 전력(실제 능력, 아마 척도) 대 상대 전력. 조별 5경기 → 3승 이상 슈퍼 라운드 3경기 → 상위 둘 결승, 3·4위전 */
function u18Strength(U){ const v=U.L.map(x=>{ const o=u18Src(x); if(o)return amOvr(!!x.isP,o.amR||o.r||{}); const e=amDepE(x.id,U.y); return e?amOvr(!!x.isP,e.r):12; }).sort((a,b)=>b-a); const m=v.length?v.slice(0,14).reduce((a,b)=>a+b,0)/Math.min(14,v.length):12; return clamp(50+(m-19)*1.4,38,66); }
function u18Play(y){ const U=G.u18; if(!U||U.y!==y||U.res||!U.L.length)return null; const rr=seededRand('u18:'+y), K=u18Strength(U), opp=U18_OPP[y%2?'w':'a'].slice();
  for(let i=opp.length-1;i>0;i--){ const j=Math.floor(rr()*(i+1)); [opp[i],opp[j]]=[opp[j],opp[i]]; }
  const game=(o,st)=>{ const pw=1/(1+Math.exp(-(K-o[1])/6)); const w=rr()<pw; const a=1+Math.floor(rr()*7), b=Math.max(0,a-1-Math.floor(rr()*4)); return {o:o[0],st,w,s:w?[a,b]:[b,a]}; };
  const G0=[]; const grp=opp.slice(0,5); for(const o of grp)G0.push(game(o,'조별'));
  const gw=G0.filter(g=>g.w).length; let rank, sup=[]; if(gw>=3){ const S=[...opp.slice(5),...grp.slice().sort((a,b)=>b[1]-a[1])].slice(0,3); /* 다른 조 팀 먼저, 모자라면 같은 조 강팀 */ for(const o of S)sup.push(game(o,'슈퍼 라운드'));
    const sw=gw+sup.filter(g=>g.w).length; const best=opp.slice().sort((a,b)=>b[1]-a[1]); const fin=sw>=6?game(best[0],'결승'):game(best[2]||best[0],'3·4위전'); sup.push(fin); rank=fin.st==='결승'?(fin.w?1:2):(fin.w?3:4); } else rank=gw>=2?5:6;
  /* 눈에 띈 선수: 대표 선수 중 기량이 좋을수록 자주(공개되는 것은 한 줄뿐) */
  const W=U.L.map(x=>{ const o=u18Src(x); const r=o?(o.amR||o.r):((amDepE(x.id,y)||{}).r||{}); return Math.exp((amOvr(!!x.isP,r)-18)/6); }); let t=rr()*W.reduce((a,b)=>a+b,0), k=0; while(k<W.length-1&&(t-=W[k])>0)k++;
  const st=U.L[k]; const line=st.isP?`${2+Math.floor(rr()*2)}경기 ${8+Math.floor(rr()*8)}이닝 ${Math.floor(rr()*3)}실점 ${8+Math.floor(rr()*10)}탈삼진`:`타율 .${380+Math.floor(rr()*180)} ${Math.floor(rr()*3)}홈런`;
  U.res={rank,games:[...G0,...sup],star:{id:st.id,kind:st.kind,n:st.n,sch:st.sch,line},K:Math.round(K)};
  /* 모든 구단이 같은 중계를 본다: 대표 선수 관찰 +1(구단 공통) */
  for(const x of U.L){ const o=u18Src(x); for(const t of G.teams||[]){ if(o)obsAdd(o,t.id,1); else { const O=amFS().ob[x.id]||(amFS().ob[x.id]={}); O[t.id]=Math.round(((O[t.id]||0)+1)*100)/100; } } }
  (G.u18H=G.u18H||[]).unshift({y,ev:U.ev,rank,star:st.n,sch:st.sch}); if(G.u18H.length>12)G.u18H.length=12;
  if(!G.unemp){ const rk=rank===1?'우승':rank===2?'준우승':rank===3?'3위':rank===4?'4위':rank===5?'슈퍼 라운드 진출 실패':'조별 리그 탈락'; const w=U.res.games.filter(g=>g.w).length;
    wire('아마',`${U.ev} 한국 ${rk} · ${w}승 ${U.res.games.length-w}패 · 눈에 띈 선수 ${st.n}(${st.sch}) ${line}`,{ref:st.kind==='p'?st.id:null}); }
  return U.res; }
function u18Daily(o){ if(!amOn()||!G.teams)return; if(o.m===8&&o.d===1)u18Select(o.y); if(o.m===9&&o.d===8){ if(!G.u18||G.u18.y!==o.y)u18Select(o.y); u18Play(o.y); } }
