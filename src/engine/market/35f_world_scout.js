/* ===== 지역 스카우트 지식(세계척도 P3 11-19) =====
   리그마다 '스카우트 지식 %'를 둔다. 우리와 AI 구단이 같은 식(wkPctOf)이고, 다른 것은 들어가는 값뿐이다.
   - 들어가는 값: 그 리그 지역(IREG)의 해외망 단계(G.intl, 0~3), 그 지역에 파견한 스카우트(role 'intl')가 머문 날과 능력, 리그가 얼마나 알려졌나(MLB는 기록·중계가 많다).
     AI는 해외망 투자 모형이 없어 외국인 후보처럼 스카우트진 수준(fScoutLv, 최대 2)을 망 단계로 쓰고 파견은 없다(fInfo와 같은 규칙).
   - 지식에 따라 보이는 것
     · 선수마다 '눈에 띄는 정도'(간판 선수 0, 나머지 8~40, MLB는 절반)보다 지식이 낮으면 명단에 안 보인다.
     · 45 미만: 기록·나이·계약(아는 만큼)만. 45~69: 대략 능력(넓은 범위). 70 이상: 좁은 범위.
     · 능력 추정은 외국인 후보와 같은 오차 식(fCandSd·fCandCur·fCandMix)을 쓴다. 해외 관찰 명단에 올린 선수는 관찰한 주만큼(주당 5%) 파악도가 올라 범위가 좁아진다.
   - 저장하지 않는다(날마다 계산, 해시만 쓴다). 본게임 난수 없음.
   - 스카우트 추천(주간 소식): 우리 구단의 가장 약한 두 자리에 맞는 해외 주목 선수를 해외 스카우트가 골라 한 주에 한 통(최대 3명)으로 보낸다. 같은 선수는 1년 동안 다시 추천하지 않고, 한 해 추천은 12명까지다. 기본 꺼짐: 해외에 스카우트를 파견했거나 해외망 2단계 이상인 지역이 있을 때만 보낸다(화면에서 끌 수 있다).
     KBO 몸값으로 닿을 만한 사람만 고른다(wkTarget). 영입 경로(P4)는 아직 없어 관찰만 권한다. */
const WK={reg:{MLB:'us',AAA:'us',NPB:'jp',CPBL:'tw',LMB:'la'},fame:{MLB:20,AAA:0,NPB:10,CPBL:-5,LMB:-5},base:10,net:18,dayK:6,dayMax:30,rough:45,tight:70,watchWk:5,rcN:3,rcGap:365,rcYr:12};
/* 구단이 그 리그를 보는 값(우리: 해외망·파견 스카우트 / AI: 스카우트진 수준을 망 단계로) */
function wkIn(tid,lg){ const r=WK.reg[lg]; if(tid==null||tid===G.user){ const s=intlScoutFor(r); return {lg,r,net:intlNet(r),days:s?Math.max(0,G.day-(s.since??G.day)):0,sk:s?effSkill(s):0,isc:s||null,tag:''}; }
  return {lg,r,net:Math.min(2,Math.floor(fScoutLv(tid)||0)),days:0,sk:0,isc:null,tag:'t'+tid}; }
/* 지식 % (우리와 AI 같은 식) */
function wkPctOf(I){ const sc=I.days>0?Math.min(WK.dayMax,I.days/WK.dayK)*(.7+.1*I.sk):0; return clamp(Math.round(WK.base+I.net*WK.net+(WK.fame[I.lg]||0)+sc),0,100); }
const wkKnow=(tid,lg)=>wkPctOf(wkIn(tid,lg));
/* 선수마다 눈에 띄는 정도(해시): 간판은 늘 보이고 MLB는 반쯤 공개 */
function wkThr(e){ if(e.t==='s')return 0; const t=8+Math.floor(rngHash('wkv',e.i)/4294967296*33); return e.lg==='MLB'?Math.round(t/2):t; }
/* 외국인 후보 오차 식에 넣을 값: 지식 → 망 단계(lv), 관찰 주 수 → 파악도(k) */
function wkInfo(tid,e,K){ const I0=wkIn(tid,e.lg), me=tid==null||tid===G.user, w=me?(G.ovw||[]).find(x=>String(x.id)===String(e.i)):null;
  const k=w?clamp(Math.floor(Math.max(0,G.day-(w.since??G.day))/7)*WK.watchWk,0,100):0;
  return {r:I0.r,lv:K>=90?3:K>=WK.tight?2:K>=58?1:0,k,mine:false,sis:false,isc0:I0.isc,isc:I0.isc,tag:I0.tag+'w',kbo:false}; }
/* 오차 식에 넣을 가벼운 선수(능력·역할·지난 시즌 기록). 기록 해석표(FREC)는 해외 시즌 오프셋과 같은 리그(트리플A·CPBL·멕시코리그)만 쓴다 */
const WK_FREC={AAA:1,CPBL:1,LMB:1};
function wkPseudo(e){ const p={id:e.i,isP:!!e.P,r:e.r,role:e.ro,sx:0,mlbG:0}; if(WK_FREC[e.lg]){ const l=e.L[e.L.length-1]; if(l){ p.prev=wpsH(l,!!e.P); p.prevLvl=WPS_LV[e.lg]; } } return p; }
/* 구단 tid가 보는 주목 선수: s = hide(안 보임) · stat(기록만) · rough(대략) · tight(좁은 범위) */
function wkView(tid,e,K){ K=K??wkKnow(tid,e.lg); if(K<wkThr(e))return {K,s:'hide'}; if(K<WK.rough)return {K,s:'stat'};
  const I=wkInfo(tid,e,K), p=wkPseudo(e), sd=fCandSd(p,I), sc=fCandCur(p,I,sd), x=fCandMix(p,I,sd,sc);
  const mid=dv(x.m), band=dvSd(x.m,x.ms*1.3); return {K,s:K>=WK.tight?'tight':'rough',m:x.m,ms:x.ms,mid,band,lo:Math.max(20,mid-band),hi:Math.min(100,mid+band),lv:I.lv,k:I.k}; }
/* 우리 말고 이 선수를 능력까지 파악한 KBO 구단 수(같은 식) */
function wkClubs(e){ let n=0; for(const t of G.teams){ if(t.id===G.user)continue; const K=wkKnow(t.id,e.lg); if(K>=WK.rough&&K>=wkThr(e))n++; } return n; }
/* 리그별 요약(화면): 지식 · 보이는 사람 수 */
function wkSummary(tid){ const out={}; for(const lg of WPS_LGS){ const K=wkKnow(tid,lg), L=((G.wps&&G.wps.L)||[]).filter(e=>e.lg===lg); out[lg]={K,n:L.length,vis:L.filter(e=>K>=wkThr(e)).length,rate:K>=WK.rough}; } return out; }
/* 지식이 어떻게 정해졌는지(화면 도움말) */
function wkWhy(tid,lg){ const I=wkIn(tid,lg); const L=[`${IREG[I.r].l} 해외망 ${INET[Math.min(3,I.net)].l}(+${I.net*WK.net})`];
  if(I.isc)L.push(`${I.isc.name} 파견 ${I.days}일(+${Math.round(Math.min(WK.dayMax,I.days/WK.dayK)*(.7+.1*I.sk))}, 180일이면 최대)`); else if(tid===G.user||tid==null)L.push('파견 스카우트 없음(스카우트 배치에서 이 지역에 보내면 날마다 오릅니다)');
  const f=WK.fame[lg]||0; if(f)L.push(`${OVL_LBL[lg]} ${f>0?'공개 정보가 많음 +'+f:'공개 정보가 적음 '+f}`); return L; }
/* 우리 구단이 보강할 자리 두 곳(지금 주전·5선발·4번째 불펜 능력이 가장 낮은 자리) */
function wkNeeds(tid){ const d=depth(tid), S=[]; for(const k of ['C','1B','2B','3B','SS','LF','CF','RF']){ const p=d.ln&&d.ln[k]; S.push({k,v:p?ovr(p):30}); }
  S.push({k:'SP',v:d.sp&&d.sp[4]?ovr(d.sp[4]):30}); S.push({k:'RP',v:d.pen&&d.pen[3]?ovr(d.pen[3]):30}); return S.sort((a,b)=>a.v-b.v||a.k.localeCompare(b.k)).slice(0,2); }
const WK_OF=new Set(['LF','CF','RF']);
const wkFits=(e,k)=>k==='SP'?!!e.P&&e.ro==='SP':k==='RP'?!!e.P:!e.P&&(e.ps===k||WK_OF.has(k)&&WK_OF.has(e.ps));
/* 영입을 생각해 볼 만한 사람(KBO 몸값으로 닿을 만한 사람만)
   - MLB: 계약 마지막 해이면서 노장이거나 부진한 선수, 또는 연봉이 적은(연 300만 달러 이하) 부진·부상 후 부진 선수
   - NPB: 외국인 선수, 또는 33세 이상 일본 선수 · 트리플A·CPBL·멕시코리그: 모두 */
function wkTarget(e){ const sl=wpsFlags(e).some(f=>f[0]==='부상 후 부진'||f[0]==='부진'), c=e.ct||{};
  if(e.lg==='MLB')return (c.y<=1&&(e.a>=33||sl))||(sl&&e.a>=27&&(c.amt||0)<=300); if(e.lg==='NPB')return e.o!=='jp'||e.a>=33; return true; }
function wkRecs(tid){ const W=G.wps; if(!W||!W.L)return []; const rc=W.rc||{}, out=[], N=wkNeeds(tid), K={}; for(const lg of WPS_LGS)K[lg]=wkKnow(tid,lg);
  for(const nd of N)for(const e of W.L){ if(!wkFits(e,nd.k)||rc[e.i]!=null&&G.day-rc[e.i]<WK.rcGap||ovwOn(e.i)||!wkTarget(e))continue; const v=wkView(tid,e,K[e.lg]); if(v.s!=='rough'&&v.s!=='tight')continue; if(v.m<nd.v+2)continue; out.push({e,v,nd,g:v.m-nd.v,s:Math.min(8,v.m-nd.v)+(e.lg!=='MLB'?2:0)+(wpsFlags(e).some(f=>f[0]==='부상 후 부진')?1:0)}); } /* 보강 폭은 8까지만 치고 MLB 밖·부상 뒤 반등 후보를 조금 앞에(모두 MLB 간판으로 채워지지 않게) */
  const seen=new Set(); return out.sort((a,b)=>b.s-a.s||b.g-a.g||a.e.i-b.e.i).filter(x=>!seen.has(x.e.i)&&seen.add(x.e.i)).slice(0,WK.rcN); }
const wkDigOn=()=>!(G.cfg&&G.cfg.wkDig===false)&&!G.unemp&&((G.scouts||[]).some(s=>s.role==='intl')||Object.values(G.intl||{}).some(v=>v>=2));
/* 주간(aiWeekly → ovqWeek): 해외 스카우트 추천 한 통. 본게임 난수 없음 */
function wkDigestWeek(){ if(!G.wps||!wkDigOn())return 0; const W=G.wps; if(W.rcY&&W.rcY.y===G.year&&W.rcY.n>=WK.rcYr)return 0; const L=wkRecs(G.user).slice(0,W.rcY&&W.rcY.y===G.year?WK.rcYr-W.rcY.n:WK.rcN); if(!L.length)return 0; W.rc=W.rc||{}; for(const x of L)W.rc[x.e.i]=G.day; W.rcY=W.rcY&&W.rcY.y===G.year?W.rcY:{y:G.year,n:0}; W.rcY.n+=L.length;
  for(const id in W.rc)if(G.day-W.rc[id]>=WK.rcGap*2)delete W.rc[id];
  const ln=x=>{ const e=x.e, l=wpsLines(e).filter(q=>!q.live).slice(-1)[0], fl=wpsFlags(e).map(f=>f[0]).join('·');
    return `· ${e.n}(${e.a}세 · ${e.P?(e.ro==='SP'?'선발':'불펜'):POSK[e.ps]}) ${OVL_LBL[e.lg]} ${ovlNm(e.lg,e.c)}${fl?` [${fl}]`:''}\n  ${SLOTK[x.nd.k]} 보강 후보 · 예상 능력 ${x.v.mid}(±${x.v.band})${l?` · ${l.y} ${ovsLineTxt(l,!!e.P)}`:''} · ${wpsCtTxt(e,x.v.K)}`; };
  mail('스카우트팀장',`해외 주목 선수 추천 ${L.length}명`,`해외 스카우트가 우리 약한 자리(${wkNeeds(G.user).map(n=>SLOTK[n.k]).join('·')})에 맞는 해외 리그 선수를 골랐습니다.\n\n${L.map(ln).join('\n')}\n\n해외 구단 소속 선수를 데려오는 길은 아직 없습니다. 관찰 명단에 올려 두면 해마다 기록이 쌓이고 능력 범위가 좁아집니다. 추천 소식은 해외 리그 > 세계 선수에서 끌 수 있습니다.`,
    {kind:'외국인',acts:[{l:'세계 선수 보기',a:'ovlWorld',v:L[0].e.lg}]}); return L.length; }
