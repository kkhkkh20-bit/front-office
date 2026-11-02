/* ===== 리그 협회: 협회장 · 이사회(사장단) · 실행위원회(단장 회의) · 총회(구단주) =====
 실제 한국 프로야구의 의사결정 구조를 본뜬 가상 기구다.
 - 실행위원회: 10개 구단 단장. 안건을 먼저 심의하고, 과반이 지지한 안만 이사회에 올린다.
 - 이사회: 10개 구단 사장과 협회장. 실행위원회 안을 대부분 그대로 의결하지만, 협회장 성향에 따라 한 단계 조정할 때가 있다.
 - 총회: 10개 구단 구단주. 협회장은 이사회가 재적 4분의 3 이상으로 추천하고 총회가 4분의 3 이상으로 선출한다(임기 3년).
 경쟁균형세 상한은 2029년부터 실행위원회가 열려야만 오른다.
 시즌을 마친 시점(결산) 연봉이 상한의 90% 이상인 구단이 5곳 이상이면 12월 10일에 소집된다.
 12월 기준으로 세면 계약 만료·FA 이탈로 연봉이 가장 낮은 때라 거의 열리지 않는다(20시즌 시뮬레이션에서 95% 기준은 소집 0회). */
const ASSOC={name:'대한프로야구협회',s:'KPBA',head:'협회장'};
const AS_STANCE={tight:{l:'긴축형',v:0,d:'구단 재정 건전성을 앞세워 상한 인상을 억제합니다. 큰 인상안은 이사회에서 한 단계 낮출 때가 있습니다.'},
  bal:{l:'균형형',v:.03,d:'단장 회의 결정을 그대로 존중합니다.'},
  grow:{l:'확장형',v:.06,d:'리그 사업을 키웁니다. 중계권 배분이 3% 늘고, 작은 인상안은 이사회에서 한 단계 올릴 때가 있습니다.'}};
const AS_CAR=['전 구단 사장','모기업 그룹 부회장','야구 해설위원 출신','전 구단주 대행','스포츠 행정학 교수','전 체육 단체 사무총장','전 국회 문화체육관광위원'];
const CMT_OPT=[0,.03,.05,.08], CMT_TH=.9, CMT_N=5;
const pctTxt=x=>x?`${Math.round(x*100)}% 인상`:'동결';

function asMk(y,st){ return {name:genName(),age:ri(58,72),stance:st||pick(Object.keys(AS_STANCE)),car:pick(AS_CAR),since:y+1,until:y+3,terms:1}; }
function asInit(){ if(G.assoc)return G.assoc; const h=asMk(2025); h.since=2026; h.until=2028; G.assoc={head:h,cmt:[],els:[],rel:50,cur:null,el:null}; return G.assoc; }
function asHead(){ return asInit().head; }
/* 확장형 협회장은 중계권 계약을 키운다 */
function asRev(){ try{ return G&&G.assoc&&G.assoc.head.stance==='grow'?1.03:1; }catch(e){ return 1; } }
function asRelLabel(){ const r=asInit().rel; return r>=62?'우호적':r>=45?'무난함':'냉랭함'; }
const asEmp=()=>!G.unemp&&G.user!=null;

/* ---------- 실행위원회: 경쟁균형세 상한 ---------- */
function asSnap(){ const A=asInit(); const cap=capOf(G.year); A.snap={y:G.year,r:G.teams.map(t=>+(capPay(t.id)/cap).toFixed(3))}; }
function cmtRatio(t){ const A=asInit(); return A.snap&&A.snap.y===G.year?A.snap.r[t.id]:capPay(t.id)/capOf(G.year); }
function cmtNear(){ return G.teams.filter(t=>cmtRatio(t)>=CMT_TH||(t.capOver||0)>0); }
/* 구단이 바라는 인상 폭: 상한에 붙을수록, 우승을 노릴수록, 구단주가 성적파일수록 높다. 돈이 없거나 수익파 구단주면 낮다 */
function cmtIdeal(t){ const r=cmtRatio(t); let x=(r-.82)*.4; let c={}; try{ c=teamCtx(t); }catch(e){}
  x+=t.owner==='win'?.01:t.owner==='profit'?-.015:0; if(t.indie)x-=.025; if(t.cash<0)x-=.01; if(c.contend)x+=.005;
  const tr=gmTrait(t.id); if(tr==='gambler')x+=.01; if(tr==='miser')x-=.015; return clamp(x,0,.1); }
const cmtSnap=x=>CMT_OPT.reduce((b,o)=>Math.abs(o-x)<Math.abs(b-x)?o:b,0);
function cmtWhy(t){ const r=Math.round(cmtRatio(t)*100); const L=[`상한의 ${r}%`]; if(t.indie)L.push('모기업 없음'); else L.push(`구단주 ${OWNER[t.owner].label}`); if(t.cash<0)L.push('적자'); return L.join(' · '); }

/* 12월 3일: 소집 요건을 보고 통지한다 */
function cmtCall(){ const y=G.year+1; if(y<=2028)return; const A=asInit(); if(A.cur&&A.cur.y===y)return;
  const near=cmtNear(); A.cur={y,near:near.map(t=>t.id),on:near.length>=CMT_N,uv:undefined};
  if(!A.cur.on)return;
  wire('리그',`${ASSOC.s} 실행위원회 소집: ${y}년 경쟁균형세 상한 조정 논의(상한 90% 이상 ${near.length}개 구단)`);
  if(!asEmp())return;
  const cap=capOf(G.year); const hint=G.teams.filter(t=>t.id!==G.user&&(t.rel??50)>=60).map(t=>`${tshort(t.id)} ${gmOf(t.id).name} 단장: ${pctTxt(cmtSnap(cmtIdeal(t)))} 쪽`);
  const sit=`올 시즌 연봉이 상한의 90% 이상이었거나 상한을 넘긴 구단이 ${near.length}곳(${near.map(t=>tshort(t.id)).join(', ')})이라 12월 10일 실행위원회(단장 회의)가 열립니다. 안건은 ${y}년 경쟁균형세 상한입니다.
현재 상한 ${money(cap)} · 우리 구단 시즌 연봉 상한 대비 ${Math.round(cmtRatio(team(G.user))*100)}%.
상한이 오르면 하한도 같은 비율로 오르고, 리그 수입 규모(중계권·광고)도 함께 커집니다. 상한에 여유가 많은 구단에는 부담만 늘 수 있습니다.
과반이 지지한 안을 이사회(사장단)에 올립니다. 과반이 없으면 상위 두 안으로 결선 투표를 합니다.
${hint.length?`친분 있는 단장들에게 들은 분위기:\n${hint.join('\n')}`:'미리 속내를 들을 만큼 가까운 단장은 없습니다.'}`;
  evNew('cmt',`실행위원회 소집: ${y}년 상한 조정 표결`,sit,
    CMT_OPT.map(o=>({l:pctTxt(o),fx:o?`상한 ${money(Math.round(cap*(1+o)))}, 하한 ${money(Math.round(floorOf(G.year)*(1+o)))}`:`상한 ${money(cap)} 유지`})).concat([{l:'기권',fx:'표를 던지지 않습니다.'}]),
    {from:ASSOC.s,exp:Math.max(1,KD(12,9)-G.day),def:CMT_OPT.length}); }
EVH.cmt={ pick(e,i){ const A=asInit(); if(!A.cur)return ''; A.cur.uv=i<CMT_OPT.length?CMT_OPT[i]:null; return A.cur.uv==null?'이번 표결은 기권합니다.':`12월 10일 회의에서 "${pctTxt(A.cur.uv)}"에 표를 던집니다.`; } };

/* 12월 10일: 표결 → 이사회 의결 → 상한 확정 */
function capCouncil(){ const y=G.year+1; if(y<=2028)return; G.capY=G.capY||{}; if(G.capY[y])return; const A=asInit(); const cap=capOf(G.year);
  if(!A.cur||A.cur.y!==y){ const near=cmtNear(); A.cur={y,near:near.map(t=>t.id),on:near.length>=CMT_N}; }
  const C=A.cur;
  if(!C.on){ G.capY[y]=cap; A.cmt.unshift({y,n:C.near.length,held:false,fin:0}); A.cmt.length=Math.min(A.cmt.length,15);
    note('일정',`${y}년 경쟁균형세 상한은 ${money(cap)}으로 동결됩니다. 올 시즌 상한 90% 이상 구단이 ${C.near.length}곳으로 실행위원회 소집 요건(5곳)에 못 미쳤습니다.`); A.cur=null; return; }
  /* 1차 표결 */
  const ideal={}, vote={}; const userVotes=asEmp();
  for(const t of G.teams){ ideal[t.id]=cmtIdeal(t); if(userVotes&&t.id===G.user){ if(C.uv!=null)vote[t.id]=C.uv; continue; } vote[t.id]=cmtSnap(ideal[t.id]); }
  const swayed=[]; if(userVotes&&C.uv!=null){ const ui=CMT_OPT.indexOf(C.uv);
    for(const t of G.teams){ if(t.id===G.user||vote[t.id]===C.uv)continue; if((t.rel??50)>=70&&Math.abs(CMT_OPT.indexOf(vote[t.id])-ui)===1&&R()<.5){ vote[t.id]=C.uv; swayed.push(t.id); } } }
  const voters=Object.keys(vote).map(Number); const half=Math.floor(voters.length/2)+1;
  const tally=v=>{ const c={}; for(const o of CMT_OPT)c[o]=0; for(const id of voters)c[v[id]]++; return c; };
  const t1=tally(vote); const rank=CMT_OPT.slice().sort((a,b)=>t1[b]-t1[a]||a-b);
  let res=rank[0], run=null;
  if(t1[res]<half){ const [a,b]=rank; const v2={}; for(const id of voters){ const x=id===G.user&&userVotes?C.uv:ideal[id]; v2[id]=Math.abs(a-x)<Math.abs(b-x)?a:Math.abs(b-x)<Math.abs(a-x)?b:Math.min(a,b); }
    const ca=voters.filter(id=>v2[id]===a).length, cb=voters.length-ca; res=ca>cb?a:cb>ca?b:Math.min(a,b); run={a,b,ca,cb}; }
  /* 이사회: 협회장 성향에 따라 한 단계 조정할 때가 있다. 협회장과 우리 사이가 좋고 우리 안이 통과안이면 손대지 않는다 */
  const H=A.head; let fin=res, adj=null; const keep=userVotes&&C.uv===res&&A.rel>=62;
  if(res>0&&!keep){ const i=CMT_OPT.indexOf(res);
    if(H.stance==='tight'&&res>=.05&&R()<.35){ fin=CMT_OPT[i-1]; adj='down'; }
    else if(H.stance==='grow'&&res<=.03&&R()<.35){ fin=CMT_OPT[i+1]; adj='up'; } }
  G.capY[y]=Math.round(cap*(1+fin));
  const rec={y,n:C.near.length,held:true,vote,t1,run,res,fin,adj,head:H.name,uv:userVotes?C.uv:undefined,sw:swayed};
  A.cmt.unshift(rec); A.cmt.length=Math.min(A.cmt.length,15); A.cur=null;
  const t1s=CMT_OPT.filter(o=>t1[o]).map(o=>`${pctTxt(o)} ${t1[o]}표`).join(', ');
  const runs=run?` 과반이 없어 상위 두 안으로 결선을 치렀습니다: ${pctTxt(run.a)} ${run.ca}표, ${pctTxt(run.b)} ${run.cb}표.`:'';
  const adjs=adj?` 이사회에서 ${H.name} ${ASSOC.head}(${AS_STANCE[H.stance].l})의 의견으로 ${pctTxt(fin)}로 ${adj==='down'?'낮춰':'올려'} 의결했습니다.`:' 이사회는 실행위원회 안을 그대로 의결했습니다.';
  news('리그',`${ASSOC.s} 이사회, ${y}년 경쟁균형세 상한 ${fin?`${money(G.capY[y])}으로 ${Math.round(fin*100)}% 인상`:'동결'}`,`실행위원회 1차 표결: ${t1s}.${runs}${adjs} 하한은 ${money(floorOf(y))}입니다.`,0);
  if(userVotes){ const my=C.uv==null?'우리 구단은 기권했습니다.':`우리 구단은 ${pctTxt(C.uv)}에 표를 던졌고 ${C.uv===fin?'최종안과 같습니다':C.uv===res?'실행위원회는 통과했지만 이사회에서 조정됐습니다':'다른 안이 채택됐습니다'}.`;
    note('일정',`${y}년 경쟁균형세 상한이 ${money(G.capY[y])}으로 정해졌습니다(${pctTxt(fin)}). 1차 표결: ${t1s}.${runs}${adjs} ${my}${swayed.length?` 친분 덕에 ${swayed.map(tshort).join(', ')}이(가) 우리 안에 표를 보탰습니다.`:''} 구단별 표는 리그 > 협회에서 볼 수 있습니다.`); } }

/* ---------- 협회장 선거 ---------- */
function asPref(t,c){ let x=.03; try{ x=cmtIdeal(t); }catch(e){} return -Math.abs(AS_STANCE[c.stance].v-x)*30+(c.inc?.3:0)+(c.nz||0); }
/* 11월 10일: 임기가 끝나는 해에 후보를 발표한다 */
function asElCall(){ const A=asInit(); const H=A.head; if(H.until!==G.year||(A.el&&A.el.y===G.year))return;
  const C=[]; if(H.terms<3&&H.age<76&&R()<.6)C.push(Object.assign({},H,{inc:true}));
  const st=Object.keys(AS_STANCE).filter(s=>!C.some(c=>c.stance===s)); while(C.length<(R()<.5?3:2)&&st.length){ const s=st.splice(Math.floor(R()*st.length),1)[0]; C.push(asMk(G.year,s)); }
  for(const c of C)c.nz=N(0,.6);
  A.el={y:G.year,c:C,uv:undefined};
  news('리그',`${ASSOC.s} 차기 ${ASSOC.head} 후보 ${C.length}명 압축`,`${C.map(c=>`${c.name}(${c.age}세, ${c.car}, ${AS_STANCE[c.stance].l}${c.inc?', 현직':''})`).join(', ')}. 12월 15일 이사회가 재적 4분의 3 이상으로 추천하고 총회가 선출합니다.`,0);
  if(!asEmp())return; const B=bossOf(G.user);
  evNew('asEl',`${ASSOC.head} 선거: 지지 후보를 밝히겠습니까`,`${H.name} ${ASSOC.head}의 임기가 올해로 끝납니다. 12월 15일 이사회에서 사장단이 차기 ${ASSOC.head}을 추천하고, 구단주 총회가 선출합니다. 우리 구단 표는 ${B.ceo.name} 사장이 행사합니다.
단장이 지지 후보를 밝히면 사장이 그 뜻에 따라 표를 던지고, 가까운 단장(친분 65 이상)들에게도 같은 후보를 권합니다. 당선되면 ${ASSOC.head}과의 관계가 좋아지고, 떨어지면 서먹해집니다. 같은 후보를 민 구단 단장과는 친분이 조금 오르고, 다른 후보를 민 구단과는 조금 내립니다.
${C.map(c=>`· ${c.name}(${c.age}세, ${c.car}${c.inc?', 현직':''}): ${AS_STANCE[c.stance].l}. ${AS_STANCE[c.stance].d}`).join('\n')}`,
    C.map(c=>({l:`${c.name} 지지`,fx:`${AS_STANCE[c.stance].l}${c.inc?' · 현직':''}`})).concat([{l:'밝히지 않음',fx:'사장이 구단 사정에 맞게 알아서 투표합니다. 관계 변화는 없습니다.'}]),
    {from:'사장실',exp:Math.max(1,KD(12,14)-G.day),def:C.length}); }
EVH.asEl={ pick(e,i){ const A=asInit(); if(!A.el)return ''; A.el.uv=i<A.el.c.length?i:null; return A.el.uv==null?'지지 후보를 밝히지 않았습니다.':`${A.el.c[i].name} 후보 지지를 사장에게 전했습니다. 12월 15일 이사회에서 우리 표는 이 후보에게 갑니다.`; } };

/* 12월 15일: 이사회 추천(4분의 3) → 총회 선출 */
function asElect(){ const A=asInit(); const E=A.el; if(!E||E.y!==G.year||E.done)return; E.done=true; const C=E.c; const ids=G.teams.map(t=>t.id); const need=Math.ceil(ids.length*.75);
  const uv=asEmp()?E.uv:null; const pref={};
  for(const t of G.teams){ pref[t.id]=C.map(c=>asPref(t,c)); if(uv!=null&&t.id!==G.user&&(t.rel??50)>=65)pref[t.id][uv]+=.6; }
  const best=(id,set)=>(id===G.user&&uv!=null&&set.includes(uv))?uv:set.slice().sort((a,b)=>pref[id][b]-pref[id][a])[0];
  const count=v=>C.map((_,i)=>ids.filter(id=>v[id]===i).length);
  const rounds=[]; let set=C.map((_,i)=>i); let v={}; for(const id of ids)v[id]=best(id,set); let cn=count(v); rounds.push({l:'1차',cn}); const v1={...v};
  let lead=cn.indexOf(Math.max(...cn));
  if(cn[lead]<need&&C.length>2){ set=cn.map((n,i)=>[n,i]).sort((a,b)=>b[0]-a[0]).slice(0,2).map(x=>x[1]); for(const id of ids)v[id]=best(id,set); cn=count(v); rounds.push({l:'결선',cn}); lead=cn.indexOf(Math.max(...cn)); }
  if(cn[lead]<need){ /* 조율: 뒤진 후보 쪽 구단들이 대세를 따라갈지 정한다 */ for(const id of ids){ if(v[id]===lead||(id===G.user&&uv!=null))continue; if(R()<.55)v[id]=lead; } cn=count(v); rounds.push({l:'조율',cn}); }
  const ok=cn[lead]>=need; E.rounds=rounds; E.v=v; E.ok=ok; const c1=rounds[0].cn;
  if(ok){ const w=C[lead]; const nh={name:w.name,age:w.age,stance:w.stance,car:w.car,since:G.year+1,until:G.year+3,terms:w.inc?(A.head.terms||1)+1:1}; E.win=lead; A.head=nh;
    news('리그',`${ASSOC.s} 차기 ${ASSOC.head}에 ${w.name}${w.inc?' 연임':''}`,`이사회가 ${cn[lead]}표(재적 ${ids.length}명 중 4분의 3 이상)로 추천했고 구단주 총회가 선출했습니다. ${AS_STANCE[w.stance].l}. 임기는 ${G.year+1}~${G.year+3}년입니다.`,0); }
  else { A.head.until++; E.win=null; news('리그',`${ASSOC.s} ${ASSOC.head} 추천 무산, ${A.head.name} ${ASSOC.head} 1년 더 직무`,`이사회가 어느 후보에게도 4분의 3(${need}표)을 모으지 못했습니다. 최다 득표는 ${C[lead].name} ${cn[lead]}표. 내년에 다시 뽑습니다.`,0); }
  A.els.unshift(E); A.els.length=Math.min(A.els.length,8); A.el=null;
  if(uv==null||!asEmp())return;
  const won=ok&&lead===uv; A.rel=clamp(won?Math.max(A.rel,50)+12:ok?A.rel-8:A.rel,0,100);
  const same=[], diff=[]; for(const t of G.teams){ if(t.id===G.user)continue; if(v1[t.id]===uv){ t.rel=clamp((t.rel??50)+2,0,100); same.push(t.id); } else { t.rel=clamp((t.rel??50)-1,0,100); diff.push(t.id); } }
  note('일정',`${ASSOC.head} 선거 결과: ${ok?`${C[lead].name} 당선`:'추천 무산(현 협회장 1년 연장)'}. 우리 구단이 지지한 ${C[uv].name} 후보는 1차에서 ${c1[uv]}표${rounds.length>1?`, 마지막 표결에서 ${cn[uv]}표`:''}를 받았습니다. ${won?`${ASSOC.head}과의 관계가 좋아졌습니다.`:ok?`새 ${ASSOC.head}과는 서먹하게 시작합니다.`:''} 1차에서 같은 후보를 민 구단 ${same.length}곳 단장과 친분 +2, 다른 후보를 민 ${diff.length}곳과 -1.`); }

/* 매일 훅: 07_daily에서 부른다 */
function assocDaily(day){ try{ asInit(); }catch(e){ return; }
  if(day===KD(11,10))try{ asElCall(); }catch(e){}
  if(day===KD(12,3))try{ cmtCall(); }catch(e){}
  if(day===KD(12,15))try{ asElect(); }catch(e){} }
EV_KEY.add('cmt'); EV_KEY.add('asEl'); /* 상한 표결·협회장 지지는 놓치면 안 되는 결정이라 진행을 멈춘다 */
