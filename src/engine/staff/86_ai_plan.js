/* ===== AI 구단의 운영 전략(여러 해 계획) =====
 사람 단장처럼 구단마다 몇 년짜리 계획을 세우고, 모든 판단(트레이드 가치·지명권 값·FA·다년계약·시설 투자·드래프트·기용·연봉 정리)이 그 계획을 본다.
 - win   우승 도전: 스타에 돈을 쓰고, 유망주·지명권을 내주고 주전을 사 온다. 우승이 보이면 상한(세금)도 넘긴다.
 - next  내년 도전: 25~30세 주전감을 모으고 지명권은 지킨다.
 - build 유망주 수집(5년 계획): 서른 넘은 베테랑을 팔아 지명권과 어린 선수를 모으고, 남는 돈은 2군·숙소·실내 훈련장에 쓴다. 노장 FA는 보지 않는다.
 - tight 긴축: 돈이 없는 구단. 연봉을 덜어내고 외부 FA를 잡지 않는다. 받을 때는 싸고 어린 선수만.
 - star  흥행: 인기 우선 구단주. 스타·연고 출신 선수에게 웃돈을 준다.
 고르는 기준: 전력 순위(지난 시즌 순위와 섞음)·주축 나이·현금·구단주 성향·단장 성향(승부사는 일찍 우승 도전, 데이터·유망주형은 일찍 리빌딩, 짠돌이는 일찍 긴축)·구단 설계 능력(낮으면 전력을 높게 착각).
 관성: 시즌이 끝나고 FA 시장이 열리기 전에 한 번, 7월 1일에 한 번만 다시 본다. 유망주 수집은 세 시즌은 이어 가고(뜻밖에 우승권이면 예외), 우승 도전은 순위가 두 계단 넘게 밀려야 접는다.
 계획은 t.plan={k,y(시작 시즌),d,prev}에 두고 t.mode(contend/mid/rebuild)·t.stance(win/next/rebuild)를 거기서 맞춘다. 화면에는 수치로 보이지 않고 리그 소식·단장 대화·트레이드 답변으로만 드러난다 */
const AIPLAN={win:{l:'우승 도전',mode:'contend',st:'win'},next:{l:'내년 도전',mode:'mid',st:'next'},build:{l:'유망주 수집',mode:'rebuild',st:'rebuild'},tight:{l:'긴축',mode:'rebuild',st:'rebuild'},star:{l:'흥행',mode:'mid',st:'next'}};
function planOf(t){ if(!t||t.id===ME())return null; if(t.plan&&AIPLAN[t.plan.k])return t.plan.k; return t.mode==='rebuild'?'build':t.mode==='contend'?'win':'next'; }
function planYears(t){ return t&&t.plan?Math.max(0,sponSeason()-t.plan.y):0; }
/* 예전 판단(순위·나이·구단주·현금 → contend/mid/rebuild). 계획이 없는 예전 저장과 점검에서 쓴다 */
function aiPlanBase(rk,age,owner,cash){ if(cash<-5000)return 'rebuild'; if(rk<=3||(rk<=5&&owner==='win'))return 'contend'; if(rk>=8&&(age>=29.5||cash<-2000))return 'rebuild'; return 'mid'; }
/* 계획을 고른다. c={rk(1~10으로 맞춘 전력 순위), rkL(실제 순위), age(주축 평균 나이), cash, owner, tr(단장 성향), mid}. cur: 지금 계획, yrs: 이어 온 시즌 수, free: 새 단장·첫 판단이라 관성 없음 */
function aiPlanChoose(c,cur,yrs,free,prev){ const tr=c.tr, ow=c.owner; if(free)cur=null;
  /* 긴축: 시즌 뒤에 정한다(시즌 중에는 빚이 40억을 넘을 때만). 빚을 다 갚거나 네 시즌이 지나면 푼다(빚이 30억 넘게 남았으면 계속) */
  const tightIn=c.mid?c.cash<-4000:c.cash<-3000||((ow==='profit'||tr==='miser'||c.allInY)&&c.cash<-1500); /* 올인 뒤 빚이 남으면 긴축이 빨리 온다 */
  if(cur==='tight'?(c.mid||c.cash<-3000||(c.cash<0&&yrs<4)):tightIn)return 'tight';
  const winIn=3.2+(ow==='win'?1:ow==='profit'?-.4:0)+(tr==='gambler'?1.2:tr==='data'||tr==='prospect'?-.6:tr==='miser'?-.4:0)+(c.arms||0)+(c.desp||0)*1.2; /* 군비 경쟁(독주 구단이 있으면 상위권이 우승 도전을 앞당김)·벼랑 끝 단장의 승부수(86b_dynasty) */
  const bldIn=7.6+(ow==='pr'?.9:ow==='win'?.5:0)+(tr==='gambler'?1.2:tr==='data'||tr==='prospect'?-1.1:0)+(c.age>=30?-.6:c.age<=26.5?.8:0);
  const soft=()=>ow==='pr'&&c.cash>1500?'star':'next';
  if(cur==='build'){ if(c.rk<=Math.min(winIn,3.5)&&(!c.mid||c.rkL<=3))return 'win'; /* 뜻밖에 우승권: 계획을 앞당긴다 */
    if(yrs<3||c.mid)return 'build'; if(c.rk<=winIn+.6)return 'win'; if(c.rk<=6.2||yrs>=6)return soft(); return 'build'; }
  if(c.mid){ /* 시즌 중에는 크게 어긋날 때만 */
    if(cur==='win')return c.rkL>=(tr==='gambler'?10:tr==='data'?7:8)?(c.age>=29.5&&c.rk>=bldIn-1.5?'build':soft()):'win';
    if(cur&&c.rkL<=(tr==='gambler'?4:3)&&c.rk<=winIn+1.8)return 'win'; if(cur)return cur; }
  if(cur==='win'&&c.rk<=winIn+(yrs<2?3.2:2))return 'win'; /* 우승 도전은 두 계단 넘게 밀려야 접는다(막 시작한 도전은 더 버틴다) */
  if(c.rk<=winIn)return 'win';
  if(c.rk>=bldIn&&!(prev==='build'&&yrs<2)&&!((cur==='next'||cur==='star')&&yrs<1&&c.rk<bldIn+1))return 'build';
  return soft(); }
function aiPlanList(t,k){ const ds=domestic(t.id).filter(p=>!p.ys&&!hasNtc(p)&&!mvRecent(p)&&!p.aiListed&&!(p.joinY>G.year)); let L=[];
  if(k==='build')L=ds.filter(p=>p.age>=29&&ovr(p)>=50).sort((a,b)=>b.sal-a.sal).slice(0,2);
  else if(k==='tight'){ const top=new Set([...ds].sort((a,b)=>ovr(b)-ovr(a)).slice(0,3).map(p=>p.id)); L=ds.filter(p=>!top.has(p.id)&&p.sal>=300&&p.age>=27).sort((a,b)=>b.sal-a.sal).slice(0,2); }
  for(const p of L){ p.aiListed=true; p.aiWhy=k==='tight'?'sal':'reb'; p.aiLd=G.day; } return L; }
/* 계획을 정하고 t.mode·t.stance를 맞춘다. 바뀌면(quiet가 아니면) 리그 소식으로 알린다: 사용자가 다른 구단의 방향을 아는 길은 이 소식과 단장의 말뿐이다 */
function aiPlanSet(t,k,why,quiet){ if(!AIPLAN[k])return false; const had=!!(t.plan&&AIPLAN[t.plan.k]), old=had?t.plan.k:null;
  if(old!==k)t.plan={k,y:sponSeason(),d:G.day,...(old?{prev:old}:{})}; t.mode=AIPLAN[k].mode; t.stance=AIPLAN[k].st; t.modeY=G.year; t.modeD=G.day; if(old===k)return false; try{ _tcC.k=null; }catch(e){} /* 같은 날 계산해 둔 구단 사정(teamCtx)은 버린다 */
  if(quiet)return true; const L=aiPlanList(t,k); const g=t.gm&&!t.gm.interim?`${t.gm.name} 단장`:'단장대행'; const nm=tshort(t.id), fn=tname(t.id);
  const who=L.length?` ${L.map(p=>`${p.name}(${posLabel(p)}, ${p.age}세)`).join(', ')}이(가) 시장에 나올 수 있습니다.`:''; const w=why&&why!=='arms'&&why!=='desp'?`(${why})`:'';
  const N={build:[`${nm}, 리빌딩 선언… 베테랑 정리 나선다`,`${fn} ${g}이 "당장의 순위보다 몇 년 뒤를 보고 팀을 다시 짓겠다"고 밝혔습니다${w}. 신인 지명권과 어린 선수를 모으고, 2군 시설에도 투자할 계획으로 알려졌습니다.${who}`],
    tight:[`${nm}, 허리띠 졸라맨다… 고액 연봉 정리 전망`,`${fn}이(가) 재정 사정으로 긴축에 들어갑니다${w}. 외부 FA 영입은 접고, 연봉이 큰 선수를 내보내면서 싸고 어린 선수를 받으려 한다는 이야기가 나옵니다.${who}`],
    win:why==='arms'?[`${nm}, "더는 못 내준다" 우승 도전 선언`,`${fn} ${g}이 "한 팀이 계속 우승하는 걸 보고만 있을 수 없다"며 우승 도전에 나섰습니다. 유망주와 지명권을 내주더라도 당장 뛸 주전을 찾을 전망입니다.`]:why==='desp'?[`${nm}, 벼랑 끝 승부수… 우승 도전`,`${fn} ${g}이 올해 성적에 자리를 걸었다는 이야기가 나옵니다. FA 시장과 트레이드 마감 전에 크게 움직일 전망입니다.`]:old==='build'?[`${nm}, 리빌딩 끝… 우승 도전 선언`,`${fn} ${g}이 "모아 둔 선수들이 올라왔다. 이제 성적을 낼 때"라고 말했습니다${w}. 유망주와 지명권을 내주더라도 당장 뛸 주전을 찾을 전망입니다.`]:[`${nm}, "지금이 적기" 우승 도전`,`${fn} ${g}이 우승 도전으로 방향을 잡았습니다${w}. FA 시장과 트레이드 마감 전 보강에 적극적으로 나설 전망입니다.`],
    next:[`${nm}, 내년을 본다… 20대 후반 주전감 물색`,`${fn} ${g}이 "올해는 전력을 가다듬고 내년에 승부를 건다"고 밝혔습니다${w}. 지명권은 지키면서 25~30세 주전감을 찾는다는 이야기입니다.`],
    star:[`${nm}, 스타 영입으로 흥행 노린다`,`${fn} 구단주가 관중과 화제를 먼저 챙기라고 주문했다는 소식입니다${w}. 이름값 있는 선수와 연고 출신 스타에게 지갑을 열 전망입니다.`]}[k];
  try{ news('리그',N[0],N[1],0,{tid:t.id}); }catch(e){} try{ wire('구단',N[0],{tid:t.id}); }catch(e){} return true; }
/* 계획이 아직 없는 AI 구단(새 게임에서 우리가 고르기 전 자리였던 구단, 예전 저장, 우리가 떠난 구단)은 지금 방침(mode)에서 조용히 이어받는다 */
function aiPlanEnsure(){ if(G.user==null)return; for(const t of G.teams){ if(t.id===ME()||(t.plan&&AIPLAN[t.plan.k])||!t.mode)continue; const k=planOf(t); aiPlanSet(t,k==='next'&&t.owner==='pr'?'star':k,'',true); } }
/* 예전 이름(contend/mid/rebuild)으로 부르는 곳과 점검용 */
function aiPlanApply(t,nw,why){ return aiPlanSet(t,{contend:'win',mid:'next',rebuild:'build'}[nw]||nw,why); }
function aiPlanCtx(t,mid,rate){ const n=G.teams.length; rate=rate||G.teams.map(x=>({id:x.id,r:teamRating(x.id)})).sort((a,b)=>b.r-a.r); const rkS=rate.findIndex(x=>x.id===t.id)+1; let rkL=rkS;
  if(mid){ const st=standingsNow(); const i=st.findIndex(x=>x.tid===t.id); if(i>=0)rkL=i+1; } else { const o=(G.last&&G.last.order)||[]; const i=o.findIndex(x=>(x.tid??x)===t.id); if(i>=0)rkL=i+1; }
  const top=domestic(t.id).filter(p=>!p.ys).sort((a,b)=>ovr(b)-ovr(a)).slice(0,12); const age=top.length?top.reduce((a,p)=>a+p.age,0)/top.length:28;
  let rk=(mid?rkL*.65+rkS*.35:rkS*.6+rkL*.4)*10/n; rkL=rkL*10/n;
  /* 구단 설계가 서툰 단장은 자기 전력을 실제보다 높게 본다(무리한 우승 도전·늦은 리빌딩). 구단·연도로 고정된 값이라 난수 흐름을 건드리지 않는다 */
  const ab=t.gm?gmAbil(t.gm):null; if(ab&&!mid&&u01('plm'+G.year,t.id*13+7)<(1-ab.plan/100)*.35)rk-=2;
  let arms=0, desp=0; try{ arms=domArms(t,rk); desp=despOf(t); }catch(e){}
  return {rk,rkL,rkS,age,cash:t.cash||0,owner:t.owner,tr:gmTrait(t.id),mid:!!mid,arms,desp,allInY:!!(t.allInY&&sponSeason()-t.allInY<=1)}; }
function aiPlanYear(mid,quiet){ const rate=G.teams.map(x=>({id:x.id,r:teamRating(x.id)})).sort((a,b)=>b.r-a.r);
  for(const t of G.teams){ if(t.id===ME())continue; const had=!!(t.plan&&AIPLAN[t.plan.k]); const c=aiPlanCtx(t,mid,rate); const free=!had||(!mid&&!!t.plan.free); if(had&&!mid)delete t.plan.free; /* 새 단장은 시즌이 끝난 뒤 계획을 새로 짠다 */
    const k=aiPlanChoose(c,had?t.plan.k:null,planYears(t),free,had?t.plan.prev:null);
    let cause=null; if(k==='win'&&had&&t.plan.k!=='win'&&(c.arms>0||c.desp>=.3)&&aiPlanChoose({...c,arms:0,desp:0},t.plan.k,planYears(t),free,t.plan.prev)!=='win'){ cause=c.arms>0?'arms':'desp'; domLog(cause); } /* 견제·벼랑 끝 때문에 우승 도전으로 바꾼 구단 */
    aiPlanSet(t,k,cause||(mid?`${Math.round(c.rkL)}위`:''),quiet||!had); } }
/* 시즌 뒤 FA 시장이 열리기 직전(FA 공시)과 7월 1일에 다시 본다 */
function aiPlanDaily(){ const o=dobj(G.day); if(o.m===7&&o.d===1&&G.aiPlanM!==G.year){ G.aiPlanM=G.year; aiPlanYear(true); try{ domNews(); }catch(e){} } }
function aiPlanOff(){ if(G.aiPlanY===G.year)return; G.aiPlanY=G.year; aiPlanYear(false); try{ domNews(); }catch(e){} } /* 독주 구단이 있으면 견제 소식(86b_dynasty) */
/* ----- 계획별 판단 값(다른 파일이 여기서 읽는다) ----- */
/* 트레이드 가치 배율: 유망주 수집 구단은 어린 선수를 훨씬 높게, 스물아홉 넘은 주전은 훨씬 낮게 본다. 우승 도전은 반대 */
function planTradeMul(t,p,dir){ const pl=planOf(t); if(!pl)return 1; const a=p.age, gap=Math.max(0,p.pot-ovr(p));
  if(pl==='build'){ if(dir==='in')return a<=23?(gap>=6?1.35:1.2):a<=25?1.18:a<=28?1:a<=31?.6:.4; return a<=25?1.2:a>=30?.8:1; }
  if(pl==='tight'){ if(dir==='in')return (p.sal>=500?.5:p.sal>=200?.75:1)*(a<=25?1.12:a>=31?.8:1); return p.sal>=500?.75:1; }
  if(pl==='win'){ const hot=t.allIn===sponSeason()||despOf(t)>=.5; /* 올인·벼랑 끝: 검증된 주전에 확실성 웃돈, 유망주는 더 싸게 본다(86b_dynasty) */
    if(dir==='in')return a>=27&&ovr(p)>=54?(hot?1.22:1.12):a<=23&&ovr(p)<48?(hot?.72:.8):1; return a<=24&&ovr(p)<52?(hot?.8:.9):1; }
  if(pl==='next'){ return dir==='in'?(a>=25&&a<=30?1.1:a>=33?.8:1):1; }
  if(pl==='star'){ return dir==='in'&&planStar(t,p)?1.2:1; } return 1; }
/* 흥행 구단이 웃돈을 주는 선수: 최근 수상·대기록으로 이름값이 있거나 연고 출신 주전급 */
function planStar(t,p){ try{ return !!p&&!p.foreign&&(starPower(p)>=15||(!!t.region&&p.region===t.region&&ovr(p)>=56)); }catch(e){ return false; } }
/* 지명권 값 배율: 우승 도전 구단도 지명권을 헐값에 넘기지 않는다(사용자 11-13: 지명권을 소중히). 싸게 내주는 건 올인·벼랑 끝 구단뿐이다 */
const planPickMul=t=>{ const m={build:1.5,tight:1.3,win:.9,next:1,star:.95}[planOf(t)]; if(!m)return null; return t.allIn===sponSeason()?Math.min(m,.7):despOf(t)>=.5?Math.min(m,.8):m; };
/* FA 평가액 배율 */
function planFaMul(t,p){ const pl=planOf(t); return pl==='star'&&planStar(t,p)?1.18:pl==='build'&&p.age>=29?.85:pl==='tight'?.8:pl==='win'&&ovr(p)>=58?1.05:1; }
/* 구단 카드의 운영 방침 표시(예전부터 보이던 큰 갈래만: 세부 계획은 보여 주지 않는다). 예전에는 전력 정비(mid) 구단도 '리빌딩'으로 나왔다 */
function modeLabel(t){ return t.mode==='contend'?'우승 경쟁':t.mode==='rebuild'?'리빌딩':'전력 정비'; }
/* 단장 대화·트레이드 센터의 '구단 사정' 한마디 */
function planTalk(t){ return {win:'올해 우승을 노림 · 당장 뛸 주전을 원함',next:'내년 승부 · 25~30세 주전감을 찾음',build:'몇 년 뒤를 봄 · 지명권과 어린 선수를 원함',tight:'지갑을 닫음 · 연봉 큰 선수는 사절',star:'흥행 우선 · 이름값 있는 선수에 관심'}[planOf(t)]||''; }
/* AI 감독 선임: 후보 여럿 중 지금 선수단과 맞는 감독(원하는 역할을 이미 갖춘 정도)을 구단 설계 능력만큼 더 본다 */
function aiMgrFit(tid,m){ const L=mgrRolesOf(m); if(!L.length)return .4; return L.reduce((a,k)=>a+Math.min(1,roleHaveAs(tid,k)/MROLE[k].tgt),0)/L.length; }
function roleHaveAs(tid,k){ const R0=MROLE[k]; return playersOf(tid).filter(p=>!p.prospect&&!p.ys&&roleOk(p,k)).sort((a,b)=>ovr(b)-ovr(a)).slice(0,R0.bat?9:5).filter(p=>ovr(p)>=45).length; }
/* 다른 구단도 우리와 같은 감독 시장(G.mmarket)에서 고른다(사용자 11-05: 상대 단장도 같은 일을 겪게). 시장 후보를 데려가면 목록에서 빠져 우리도 놓친다 */
function aiMgrHire(t){ const M=(G.mmarket||[]).filter(m=>!m.ob); const I=typeof ipMgrCands==='function'?ipMgrCands(t):[]; const C=M.concat([mkMgr(),mkMgr()],I); const n=aiMgrPick(t,C); if(I.includes(n)){ ipMgrTaken(t,n); return n; } /* 수석코치·2군 감독 내부 승격(74_internal_promo) */ if(M.includes(n)){ G.mmarket=G.mmarket.filter(x=>x!==n); if(!G.unemp)note('감독',`감독 후보 ${n.name}이(가) ${tname(t.id)} 감독이 됐습니다.`); } return n; }
function aiMgrPick(t,C){ const ab=t.gm?gmAbil(t.gm):null; const w=ab?ab.plan/100:.5; let best=C[0], bs=-1e9; for(const m of C){ const s=(m.fame||50)*.05+((m.tac||50)-50)*.08+aiMgrFit(t.id,m)*10*w+R()*1.5+(m.inner?1.3+(t.plan&&(t.plan.k==='build'||t.plan.k==='tight')?.8:0):0)+relHireBias(t.id,m,'mgr'); /* 단장이 좋아하는 사람은 조금 더, 싫어하는 사람은 피한다(84b_person_rels) */ /* 내부 인물은 팀을 알고 연봉 부담이 적다: 리빌딩·긴축 구단일수록 더 */ /* 경기 운영(tac)도 본다: 우리가 고르는 기준과 같게(검수 11-05) */ if(s>bs){ bs=s; best=m; } } return best; }
