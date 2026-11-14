/* ===== 해외 네트워크 · 자매결연(사용자 11-09) =====
 실제 KBO: 여러 구단이 일본 프로 구단과 자매결연을 맺고 캠프지 협조·연습경기·코치 연수·교육리그 참가·정보 교환을 한다. 미국은 메이저리그 구단의 스프링캠프 단지(애리조나·플로리다)와 협약을 맺는다.
 게임 규칙
 - 해외 구단은 모두 가상의 구단이다(실제 구단 이름·상징을 쓰지 않는다). 일본 12개, 미국 8개 조직(스프링캠프 단지 기준).
 - 관계(0~100)는 KBO 구단마다 따로 쌓인다: 그 구단 캠프지에서 캠프(+5), 그 구단과 연습경기(경기당 +2), 단장 해외 프런트 견학(+5), 교류 방문단(+6), 교육리그·코치 연수(+4). 매달 1씩 식는다.
 - 관계 55 이상이면 결연을 제안할 수 있다. 수락은 관계·단장 명성·구단 위상·그 구단의 개방성으로 정한다. 해외 구단 하나는 KBO 구단 하나와만 결연하고, KBO 구단은 나라마다 하나만.
 - 결연은 해마다 11월 1일 연회비를 내고 이어진다. 그날 관계가 30 아래면 상대가 끝내고, 다른 KBO 구단과 훨씬 가까워졌으면(관계 20 이상 차이) 그쪽으로 옮긴다.
 - 혜택: 그 구단 캠프지 예약 우선(성사 +25%p, 자리가 차도 잡아 줌, 비용 20% 할인)·연습경기 잡기 쉬움, 가을 교육리그 파견(최대 4명), 코치 연수(1명 6주), 선수 정보 교환(외국인 후보 귀띔, 평가 오차 감소). */
const OCL=[
  {id:'sap',c:'jp',n:'삿포로 스노우베어스',city:'삿포로',lon:141.35,lat:43.06,st:'기타 돔 필드',lv:3,f2:56,fac:72,op:.6,s:[2,'oki']},
  {id:'sen',c:'jp',n:'센다이 그린타이드',city:'센다이',lon:140.87,lat:38.27,st:'아오바 볼파크',lv:3,f2:54,fac:66,op:.7,s:[2,'oki']},
  {id:'nii',c:'jp',n:'니가타 실버리버스',city:'니가타',lon:139.02,lat:37.9,st:'시나노 스타디움',lv:2,f2:50,fac:58,op:.8,s:[1,'jk']},
  {id:'tok',c:'jp',n:'도쿄 센트럴스타즈',city:'도쿄',lon:139.69,lat:35.69,st:'스미다 돔',lv:5,f2:64,fac:86,op:.35,s:[2,'miy']},
  {id:'utu',c:'jp',n:'우쓰노미야 썬더볼츠',city:'우쓰노미야',lon:139.88,lat:36.56,st:'기누 필드',lv:2,f2:52,fac:60,op:.75,s:[2,'oki']},
  {id:'shz',c:'jp',n:'시즈오카 마운트피크스',city:'시즈오카',lon:138.38,lat:34.98,st:'스루가 구장',lv:2,f2:55,fac:62,op:.7,s:[2,'miy']},
  {id:'nag',c:'jp',n:'나고야 골드캐슬즈',city:'나고야',lon:136.9,lat:35.18,st:'긴조 돔',lv:4,f2:60,fac:78,op:.5,s:[2,'oki']},
  {id:'kan',c:'jp',n:'가나자와 블루크레인즈',city:'가나자와',lon:136.65,lat:36.56,st:'겐로쿠 스타디움',lv:2,f2:51,fac:57,op:.8,s:[1,'jk']},
  {id:'osa',c:'jp',n:'오사카 썬라이저스',city:'오사카',lon:135.5,lat:34.69,st:'나니와 돔',lv:4,f2:61,fac:80,op:.45,s:[2,'oki']},
  {id:'hir',c:'jp',n:'히로시마 리버스톤즈',city:'히로시마',lon:132.46,lat:34.39,st:'아키 볼파크',lv:3,f2:62,fac:70,op:.55,s:[2,'miy']},
  {id:'mat',c:'jp',n:'마쓰야마 오렌지웨이브',city:'마쓰야마',lon:132.77,lat:33.84,st:'도고 스타디움',lv:1,f2:48,fac:52,op:.85,s:[1,'jk']},
  {id:'fuk',c:'jp',n:'후쿠오카 레드피닉스',city:'후쿠오카',lon:130.4,lat:33.59,st:'하카타 돔',lv:5,f2:66,fac:88,op:.4,s:[2,'miy']},
  {id:'sco',c:'us',n:'스코츠데일 레드메사',city:'애리조나 스코츠데일',lon:-111.93,lat:33.49,st:'페이드 캐니언 콤플렉스',lv:4,f2:62,fac:90,op:.4,s:[1,'az']},
  {id:'tem',c:'us',n:'템피 선더버즈',city:'애리조나 템피',lon:-111.94,lat:33.43,st:'듀랑고 필드',lv:3,f2:58,fac:84,op:.5,s:[1,'az']},
  {id:'peo',c:'us',n:'피오리아 캑터스킹즈',city:'애리조나 피오리아',lon:-112.24,lat:33.58,st:'사와로 파크',lv:3,f2:57,fac:82,op:.55,s:[1,'az']},
  {id:'goo',c:'us',n:'굿이어 더스트데빌즈',city:'애리조나 굿이어',lon:-112.36,lat:33.44,st:'에스트렐라 스포츠파크',lv:2,f2:54,fac:78,op:.6,s:[1,'az']},
  {id:'jup',c:'us',n:'주피터 펠리컨즈',city:'플로리다 주피터',lon:-80.09,lat:26.93,st:'로즈마리 볼파크',lv:4,f2:63,fac:88,op:.35,s:[1,'fl']},
  {id:'ftm',c:'us',n:'포트마이어스 팜코스트',city:'플로리다 포트마이어스',lon:-81.87,lat:26.64,st:'칼루사 필드',lv:3,f2:59,fac:85,op:.45,s:[1,'fl']},
  {id:'brd',c:'us',n:'브레이든턴 맹그로브스',city:'플로리다 브레이든턴',lon:-82.57,lat:27.5,st:'마나티 스타디움',lv:2,f2:55,fac:76,op:.6,s:[1,'fl']},
  {id:'clw',c:'us',n:'클리어워터 블루헤론즈',city:'플로리다 클리어워터',lon:-82.8,lat:27.97,st:'헤론 베이 콤플렉스',lv:3,f2:58,fac:80,op:.5,s:[1,'fl']}];
const OCL_BY=Object.fromEntries(OCL.map(c=>[c.id,c]));
const OCN={jp:'일본',us:'미국'};
const sisFee=c=>c.c==='jp'?30+c.lv*6:60+c.lv*8; /* 연회비(100만 원 단위): 일본 3,600만~6,000만, 미국 6,800만~1억 */
const SIS_FL={jp:{c:15,l:'일본 가을 교육리그'},us:{c:25,l:'미국 가을 교육리그'}}; /* 1인 비용 */
const SIS_CT={jp:20,us:30}, SIS_CTD=42, SIS_VIS=20;
function sisInit(){ if(G.sis)return G.sis; G.sis={r:{},p:{},fl:null,ct:null,cd:{},vis:{}};
  /* 새 게임·옛 저장: 몇몇 다른 구단은 이미 결연을 맺고 있다 */
  const hs=(L,f)=>L.map(x=>[x,hn("sis"+f(x),G.year)]).sort((x,y)=>x[1]-y[1]).map(x=>x[0]); /* 난수를 쓰지 않는 고정 섞기: 처음 불릴 때 리그 난수 흐름을 바꾸지 않게 */
  const ai=hs(G.teams.filter(t=>t.id!==ME()).map(t=>t.id),x=>x); const jp=hs(OCL.filter(c=>c.c==='jp'),x=>x.id), us=hs(OCL.filter(c=>c.c==='us'),x=>x.id);
  ai.slice(0,4).forEach((tid,i)=>{ G.sis.p[jp[i].id]={tid,y:G.year}; G.sis.r[tid+':'+jp[i].id]=62+i*2; });
  ai.slice(4,6).forEach((tid,i)=>{ G.sis.p[us[i].id]={tid,y:G.year}; G.sis.r[tid+':'+us[i].id]=60+i*3; });
  return G.sis; }
function sisRel(tid,cid){ const S=sisInit(), c=OCL_BY[cid]; const v=S.r[tid+':'+cid]; return v!=null?v:Math.round(12+c.op*25); }
function sisAdd(tid,cid,d){ if(!OCL_BY[cid])return; const S=sisInit(); S.r[tid+':'+cid]=clamp(Math.round(sisRel(tid,cid)+d),0,100); }
const sisPtn=cid=>{ const x=sisInit().p[cid]; return x?x.tid:null; };
function sisMine(tid,c){ const S=sisInit(); return Object.keys(S.p).find(id=>S.p[id].tid===tid&&OCL_BY[id].c===c)||null; }
/* 캠프지(lvl,k)에 이 구단의 자매구단이 있으면 그 구단 id */
function sisSite(tid,lvl,k){ const S=sisInit(); return Object.keys(S.p).find(id=>S.p[id].tid===tid&&OCL_BY[id].s[0]===lvl&&OCL_BY[id].s[1]===k)||null; }
/* 연습경기 상대 구단: 자매구단이 그 캠프지에 있으면 60%는 그 구단 */
function sisOppClub(tid,lvl,k){ const L=OCL.filter(c=>c.s[0]===lvl&&c.s[1]===k); if(!L.length)return null; const mine=sisSite(tid,lvl,k); return mine&&R()<.6?mine:pick(L).id; }
const sprcOppName=g=>g.k==='kbo'?tname(g.tid):g.cid&&OCL_BY[g.cid]?`${OCL_BY[g.cid].n}${g.k==='npb2'?' 2군':g.k==='us'?' 마이너':''}`:SPRC_OPP[g.k].l;
/* 결연 수락 확률 */
function sisOdds(cid){ const c=OCL_BY[cid], tid=G.user; const rel=sisRel(tid,cid), rep=G.rep??50, pres=clubPrestige(tid);
  return {q:clamp(.2+(rel-55)/50+(rep-50)/150+(pres-50)/200+(c.op-.5)*.5,.05,.95),rel,rep,pres}; }
function sisCan(cid){ const c=OCL_BY[cid]; if(!c)return '없는 구단입니다.'; if(G.unemp)return '구단을 맡고 있지 않습니다.'; const S=sisInit(); const o=sisPtn(cid);
  if(o===G.user)return '이미 자매결연 중입니다.'; if(o!=null)return `${tshort(o)}와(과) 결연 중이라 지금은 받을 수 없습니다.`; const m=sisMine(G.user,c.c); if(m)return `${OCN[c.c]}에는 이미 ${OCL_BY[m].n}와(과) 결연 중입니다(나라마다 하나).`;
  if(sisRel(G.user,cid)<55)return '관계가 55 이상이어야 제안할 수 있습니다.'; const f=S.cd[G.user+':'+cid]; if(f!=null&&G.day-f<30)return `거절당한 지 얼마 안 됐습니다. ${30-(G.day-f)}일 뒤 다시 제안할 수 있습니다.`; return ''; }
function sisPropose(cid){ const no=sisCan(cid); if(no)return no; const c=OCL_BY[cid], S=sisInit(); const o=sisOdds(cid);
  if(R()>=o.q){ S.cd[G.user+':'+cid]=G.day; sisAdd(G.user,cid,-2); return `${c.n} 측이 결연 제안을 정중히 거절했습니다. 관계를 더 쌓거나 단장 명성이 오르면 다시 제안해 보세요.`; }
  const fee=sisFee(c); S.p[cid]={tid:G.user,y:G.year,d:G.day}; G.spend.etc=(G.spend.etc||0)+fee; sisAdd(G.user,cid,5);
  mail(c.n,`${c.n}와(과) 자매결연 체결`,`${c.n}(${c.city}, ${c.st})와(과) 자매결연을 맺었습니다. 첫해 연회비 ${money(fee)}를 냈고, 해마다 11월 1일 갱신합니다.\n\n혜택: ${c.s[1]==='oki'?'오키나와':c.s[1]==='miy'?'미야자키':c.s[1]==='jk'?'가고시마':c.s[1]==='az'?'애리조나':'플로리다'} 캠프지 예약 우선·할인, 연습경기 주선, 가을 교육리그 파견(최대 4명), 코치 연수, 선수 정보 교환.\n관계가 30 아래로 떨어지면 상대가 결연을 끝낼 수 있습니다.`,{kind:'캠프'});
  news('구단',`${tshort(G.user)}, ${OCN[c.c]} ${c.n}와(과) 자매결연`,`${tname(G.user)}이(가) ${c.n}와(과) 자매결연을 맺었습니다. 캠프 협조와 교육리그·코치 연수 교류를 함께 하기로 했습니다.`,1); return ''; }
function sisEnd(cid,why){ const S=sisInit(), x=S.p[cid], c=OCL_BY[cid]; if(!x)return '결연 중인 구단이 아닙니다.'; const tid=x.tid; delete S.p[cid];
  if(tid===G.user&&!why)sisAdd(tid,cid,-10);
  { const F=sisFlOf(tid); if(F&&F.cid===cid&&!F.go){ sisFlRefund(F,F.ids.length*SIS_FL[c.c].c); sisFlDrop(F); } } /* 떠나기 전 교육리그 신청은 취소하고 돌려받는다 */
  if(tid===G.user&&!G.unemp)mail(c.n,`${c.n}와(과) 자매결연 종료`,why||`우리 구단 요청으로 ${c.n}와(과)의 자매결연을 끝냈습니다. 관계가 조금 식었습니다.`,{kind:'캠프'});
  news('구단',`${tshort(tid)}·${c.n} 자매결연 종료`,`${tname(tid)}과(와) ${c.n}의 자매결연이 끝났습니다.`,0); return ''; }
/* 교류 방문단: 구단 돈으로 프런트·코치진을 보내 인사를 다닌다. 구단마다 60일에 한 번 */
function sisVisit(cid){ const c=OCL_BY[cid]; if(!c||G.unemp)return '지금은 할 수 없습니다.'; const S=sisInit(); const v=S.vis[G.user+':'+cid]; if(v!=null&&G.day-v<60)return `${60-(G.day-v)}일 뒤 다시 보낼 수 있습니다.`;
  S.vis[G.user+':'+cid]=G.day; G.spend.etc=(G.spend.etc||0)+SIS_VIS; const d=6+((G.rep??50)>=70?2:0); sisAdd(G.user,cid,d); addLog(`${c.n}에 교류 방문단을 보냈습니다(${money(SIS_VIS)}, 관계 개선).`); return ''; }
/* 단장 해외 프런트 견학(83_personal_life.js): 그 나라 구단들과 관계 +5 */
function sisTour(k){ if(G.unemp)return ''; const c=k==='mlb'?'us':'jp'; for(const x of OCL)if(x.c===c)sisAdd(G.user,x.id,5); return ` ${OCN[c]} 구단들과 관계 개선.`; }
/* 가을 교육리그: 9월 1일~10월 10일 신청(fallOpen), 10월 11일 출국, 11월 15일 결과. 25세 이하 국내 선수 최대 4명 */
/* 파견 예약은 구단별 보존. fl은 옛 저장/호출과의 호환용 최근 예약, flT가 전체 구단 장부다. */
/* 가을야구를 치르는 구단(아직 탈락 안 함)은 교육리그 파견 선수도 팀에 남는다. 탈락·우승 확정 뒤 합류(커뮤니티 11-12: 파견이 10월 11일부터라 한국시리즈 핵심 선수가 빠짐) */
function sisPsAlive(tid){ const P=G.ps; if(!P||P.done||!G.cal)return false; let per=''; try{ per=period(); }catch(e){ return false; } if(per!=='post')return false; if(!(P.seeds||[]).includes(tid))return false; return !Object.values(P.res||{}).some(r=>r&&r[1]===tid); }
function sisFlAwayOn(p){ if(!p)return false; if(p.team!=null&&sisPsAlive(p.team))return false; const a=p.sisFlAway; if(a&&a.from<=G.day&&a.until>G.day)return true; const S=G.sis,F=S&&(S.flT&&S.flT[p.team]||(S.fl&&S.fl.tid===p.team?S.fl:null)); return !!(F&&F.go&&F.y===G.year&&F.ids.includes(p.id)&&G.day>=dnum(F.y,10,11)&&G.day<dnum(F.y,11,15)); }
function sisFlOf(tid){ const S=sisInit(); return S.flT&&S.flT[tid]||(S.fl&&S.fl.tid===tid?S.fl:null); }
function sisFlAll(){ const S=sisInit(), by=Object.assign({},S.flT); if(S.fl&&!by[S.fl.tid])by[S.fl.tid]=S.fl; return Object.values(by); }
function sisFlStore(F){ const S=sisInit(); (S.flT=S.flT||{})[F.tid]=F; S.fl=F; return F; }
function sisFlDrop(F){ const S=sisInit(); if(S.flT)delete S.flT[F.tid]; if(S.fl&&S.fl.tid===F.tid)S.fl=null; }
function sisFlRefund(F,n){ const c=SIS_FL[OCL_BY[F.cid].c].c, paid=F.paid??F.ids.length*c, amount=Math.min(paid,n); if(!(amount>0))return 0; F.paid=paid-amount;
  if(F.tid===G.user&&!G.unemp&&(F.ep==null||F.ep===(G.spEp||0))){ G.spend=G.spend||{}; if(F.fy==null||F.fy===fyNow())G.spend.dev=Math.max(0,(G.spend.dev||0)-amount); else G.spend.devRef=(G.spend.devRef||0)+amount; }
  else { const t=team(F.tid); if(t){t.cash+=amount;hoBook(F.tid,[['교육리그 참가비 환급',amount]],[]);} } return amount; }
const sisFlElig=p=>sisFlCan(p,G.user);
function sisFlCan(p,tid){ return !!p&&p.team===tid&&!p.foreign&&p.age<=25&&!p.hold&&!(p.joinY>G.year)&&!(p.injOut>0)&&!isAway(p)&&!ovsAbroad(p); }
function sisFlToggle(cid,pid){ const c=OCL_BY[cid]; if(!c||sisPtn(cid)!==G.user)return '자매구단에만 보낼 수 있습니다.'; if(!fallOpen())return '교육리그 신청은 9월 1일~10월 10일입니다.'; let F=sisFlOf(G.user);
  if(F&&F.y===G.year&&F.cid!==cid&&F.ids.length)return `올해는 이미 ${OCL_BY[F.cid].n} 교육리그에 신청했습니다.`;
  if(!F||F.y!==G.year||F.cid!==cid)F=sisFlStore({y:G.year,cid,tid:G.user,ids:[],names:{},go:false,paid:0,fy:fyNow(),ep:G.spEp||0}); if(F.go)return '이미 출국한 파견은 취소할 수 없습니다.'; const i=F.ids.indexOf(pid), cost=SIS_FL[c.c].c;
  if(i>=0){ sisFlRefund(F,cost); F.ids.splice(i,1); sisFlStore(F); return ''; }
  const p=G.players[pid]; if(!sisFlElig(p))return '보낼 수 없는 선수입니다(25세 이하 국내 선수, 부상·복무·미계약·해외 파견 제외).'; if(F.ids.length>=4)return '최대 4명까지 보낼 수 있습니다.';
  F.paid=(F.paid??F.ids.length*cost)+cost; F.ids.push(pid); (F.names=F.names||{})[pid]=p.name; sisFlStore(F); G.spend.dev=(G.spend.dev||0)+cost; return ''; }
function sisFlDepart(F){ if(!F||F.y!==G.year||F.go)return; const ids=F.ids.filter(id=>sisFlCan(G.players[id],F.tid)), lost=F.ids.length-ids.length; if(lost)sisFlRefund(F,lost*SIS_FL[OCL_BY[F.cid].c].c); F.ids=ids;
  if(!ids.length){sisFlDrop(F);return;} F.go=true; F.from=dnum(F.y,10,11); F.until=dnum(F.y,11,15); for(const id of ids)G.players[id].sisFlAway={from:F.from,until:F.until,tid:F.tid,cid:F.cid}; sisFlStore(F); }
function sisFlRun(F=sisFlOf(G.user)){ const S=sisInit(); if(!F||F.y!==G.year||!F.go)return; sisFlDrop(F); for(const id of F.ids){const p=G.players[id];if(p&&p.sisFlAway&&p.sisFlAway.tid===F.tid&&p.sisFlAway.cid===F.cid)delete p.sisFlAway;} const c=OCL_BY[F.cid]; const b=(55-c.f2)/5; /* 상대 2군이 강할수록 기록이 덜 나온다 */ const L=[];
  for(const id of F.ids){ const p=G.players[id]; if(!p||p.team!==F.tid||isAway(p))continue; let line;
    if(p.isP){ const o=simPit(p,ri(30,54),b); line=`${Math.floor(o.outs/3)}이닝 평균자책 ${(o.er*27/Math.max(1,o.outs)).toFixed(2)} 삼진 ${o.so}`; } else { const o=simBat(p,ri(50,70),b); line=`타율 ${exhF3(o.h/Math.max(1,o.ab))} ${o.hr}홈런 볼넷 ${o.bb}`; }
    const ks=TRN_TOOLS[trnG(p)], room=Math.min(1,Math.max(0,p.pot-ovr(p))/6+.3), g=rnd(.4,1.3)*room*(c.fac/75); for(const k of ks)p.r[k]=clamp(p.r[k]+g*rnd(.6,1.2),20,80);
    let hot=''; if(R()<.1){ const k=pick(ks); p.r[k]=clamp(p.r[k]+rnd(2,4),20,80); hot=` · ${OVS_TOOLN[k]}이(가) 눈에 띄게 좋아짐`; } roundR(p); p.mor=clamp((p.mor??60)+2,0,100); L.push(`${p.name}(${posLabel(p)}): ${line}${hot}`); }
  if(L.length)sisAdd(F.tid,F.cid,4); if(F.tid===G.user&&!G.unemp&&L.length)mail('육성팀',`${c.n} 가을 교육리그 결과`,`${c.n} 2군·육성군과 약 5주 동안 실전을 치르고 돌아왔습니다.\n\n${L.join('\n')}\n\n상대 2군 전력 ${c.f2} · 시설 ${c.fac}. 시설이 좋을수록 성장 폭이 큽니다. 관계 개선.`,{kind:'연수'}); return L; }
/* 코치 교육·해외 연수: 실제 인물·지원 구단·출국일을 고정하고 한 번만 귀국 정산한다. */
const COACH_STUDY={dom:{l:'국내 지도자 교육',days:14,cost:10,gain:[1,1]},jp:{l:'일본 코치 연수',days:42,cost:40,gain:[1,3]},us:{l:'미국 코치 연수',days:42,cost:60,gain:[1,3]}};
function coachStudyTickets(){const S=G.sis;return S?[S.ct,...(S.ctq||[])].filter(Boolean):[];}
function coachStudyCoach(ref,tid=G.user){const C=G.coach?.[tid]||{},X=tid===G.user?G.coachX||[]:G.orgT?.[tid]?.coachX||[];return C[ref]||[...Object.values(C),...X].find(c=>c&&c.id===ref)||null;}
function coachStudyOf(ref){return coachStudyTickets().find(T=>!T.done&&(typeof ref==='number'?T.tid===ref:T.id===ref))||null;}
function coachStudyHistory(id){const C=[...Object.values(G.coach||{}).flatMap(C=>Object.values(C||{})),...(G.coachX||[]),...Object.values(G.orgT||{}).flatMap(o=>o.coachX||[]),...(G.cmarket||[])].find(c=>c&&c.id===id);return (C?coachStudyLedger(C):(G.sis?.studyHistory||[]).filter(h=>h&&h.id===id)).map(coachStudyCopy);}
function coachStudyQuota(tid,y){const seen=new Set(),L=[];for(const T of [...coachStudyTickets(),...(G.sis?.studyHistory||[])])if(T.tid===tid&&T.y===y){const key=T.key||T.id+':'+T.y+':'+T.tid;if(!seen.has(key)){seen.add(key);L.push(T);}}const used=G.sis?.ctUsed?.[tid+':'+y];return Math.max(L.length,typeof used==='number'?used:used?1:0);}
function coachStudyFunds(tid){let v=sdCash(tid);if(tid===ME()){const P=G.spend||{};v-=Math.max(0,(P.etc||0)-(P.trC||0))+(P.fan||0);}if(team(tid).indie)v-=newStadDue(tid);return Math.max(0,v);}
function coachStudyPartner(tid,program){const P=G.sis?.p||{};return Object.keys(P).find(cid=>P[cid].tid===tid&&OCL_BY[cid]?.c===program)||null;}
function coachStudyProgram(program,tid=G.user,cid){const P=COACH_STUDY[program];if(!P)return null;const partner=program!=='dom'?(cid&&G.sis?.p?.[cid]?.tid===tid&&OCL_BY[cid]?.c===program?cid:coachStudyPartner(tid,program)):null;return {k:program,...P,cost:partner?SIS_CT[program]:P.cost,partner:!!partner,cid:partner};}
function coachStudyCheck(ref,program,focus,tid=G.user,cid,automatic=false){const c=coachStudyCoach(ref,tid),P=coachStudyProgram(program,tid,cid),o=dobj(G.day);if(!c||!P)return '재직 중인 코치와 교육 과정을 고르세요.';if(tid===G.user&&G.unemp&&!automatic)return '구단을 맡고 있지 않습니다.';if(!(o.m===11||(o.m===12&&o.d<=15))||period()!=='off'||G.ps&&!G.ps.done)return '코치 교육·연수는 시즌과 포스트시즌이 끝난 11월 1일~12월 15일에 시작합니다.';if(G.live||G.castHold)return '진행 중인 경기를 마친 뒤 교육·연수를 신청하세요.';if(staffPending(c))return '아직 합류 전인 코치는 보낼 수 없습니다.';const m=G.mgr?.[tid];if(m?.interim&&(m.cid===c.id||m.cid==null&&m.name===c.name+'(감독대행)'))return '감독대행을 맡은 코치는 자리를 비울 수 없습니다.';if(c.sisAway>G.day||coachStudyOf(c.id))return '이미 교육·연수 중인 코치입니다.';if(coachStudyOf(tid))return '구단에서 동시에 한 명만 교육·연수를 보낼 수 있습니다.';if(coachStudyQuota(tid,o.y)>=2)return '구단 교육·연수는 한 해 두 명까지입니다.';if(coachStudyLedger(c).some(h=>h.y===o.y)||coachStudyTickets().some(T=>T.id===c.id&&T.y===o.y))return '이 코치는 올해 이미 교육·연수 지원을 받았습니다.';if(!(c.yrs>0)||dnum(ctEndY(c)+1,1,1)<=G.day+P.days)return '귀국 전에 코치 계약이 끝납니다. 먼저 계약을 연장하세요.';if(!coachStudyFields(c).some(f=>f.k===focus))return '코치 보직의 주요 분야·유망주 육성·소통·데이터 중에서 고르세요.';if(coachStudyForecast(c,focus,P.gain[1])<=0)return '선택 분야가 최고 능력이거나 생애 교육 성장 한도에 도달했습니다.';if(coachStudyFunds(tid)<P.cost)return '구단 교육·연수 자금이 부족합니다('+money(P.cost)+' 필요).';return '';}
function coachStudyOptions(ref,focus){const c=coachStudyCoach(ref),fields=c?coachStudyFields(c):[],selected=fields.some(f=>f.k===focus)?focus:fields[0]?.k,programs=Object.keys(COACH_STUDY).map(k=>{const P=coachStudyProgram(k);return {...P,why:coachStudyCheck(ref,k,selected),forecast:{min:c?coachStudyForecast(c,selected,P.gain[0]):0,max:c?coachStudyForecast(c,selected,P.gain[1]):0}};});return {coach:c,fields,focus:selected,programs,active:c?coachStudyOf(c.id):null,history:c?coachStudyHistory(c.id):[],gained:c?coachStudyGained(c):0,remaining:c?Math.max(0,COACH_STUDY_LIMIT-coachStudyGained(c)):0,limit:COACH_STUDY_LIMIT,quota:{used:coachStudyQuota(G.user,dobj(G.day).y),max:2},support:coachSupportView(c,G.user)};}
function coachStudySend(ref,program,focus,tid=G.user,cid,automatic=false){const why=coachStudyCheck(ref,program,focus,tid,cid,automatic);if(why)return why;const c=coachStudyCoach(ref,tid),P=coachStudyProgram(program,tid,cid),S=sisInit(),y=dobj(G.day).y,key='coachStudy:'+tid+':'+c.id+':'+G.day;
  const T={key,y,tid,id:c.id,name:c.name,role:c.role,ob:c.ob??null,program,focus,cid:P.cid,from:G.day,to:G.day+P.days,cost:P.cost,paid:P.cost,fy:fyNow(),ep:G.spEp||0,coachSnapshot:JSON.parse(JSON.stringify(c))};
  /* 참가비는 현금에서 한 번 낸다. 이미 낸 비용은 인계 원장으로 결산에 반영하여 이중 지출하지 않는다. */
  team(tid).cash-=P.cost;hoBook(tid,[],[['코치 교육·연수',P.cost]]);if(S.ct&&!S.ct.done)(S.ctq=S.ctq||[]).push(S.ct);S.ct=T;(S.ctUsed=S.ctUsed||{})[tid+':'+y]=coachStudyQuota(tid,y);c.sisAway=T.to;
  (c.studyHist=Array.isArray(c.studyHist)?c.studyHist:[]).push({key,id:c.id,y,tid,program,focus,from:T.from,to:T.to,cost:P.cost,status:'away',name:c.name});
  chron('coach',`${c.name} ${P.l} 출발 · ${CAB[focus]} · ${P.days}일 · 구단 지원 ${money(P.cost)} · ${dmd(T.to)} 복귀 예정`,null,tid,{source:key+':start'});if(tid===G.user&&!G.unemp)addLog(`${c.name} 코치의 ${P.l}를 구단에서 지원했습니다(${money(P.cost)}). ${dmd(T.to)}까지 보직은 빈자리로 운영합니다.`);return '';}
function sisCoachUsed(tid,y){return coachStudyQuota(tid,y)>=2;}
function sisCoachOf(tid){return coachStudyOf(tid);}
function sisCoachSend(cid,role){const country=OCL_BY[cid]?.c;if(!country||G.sis?.p?.[cid]?.tid!==G.user)return '자매구단에만 보낼 수 있습니다.';return coachStudySend(role,country,'yng',G.user,cid);}
function coachStudyTarget(T){const all=[...Object.values(G.coach||{}).flatMap(C=>Object.values(C||{})),...(G.coachX||[]),...Object.values(G.orgT||{}).flatMap(o=>o.coachX||[]),...(G.cmarket||[])],c=all.find(c=>c&&c.id===T.id);if(c)return {person:c,coach:c};const m=Object.values(G.mgr||{}).find(m=>m&&(m.cid===T.id||(T.ob!=null&&m.ob===T.ob)));if(m)return {person:m,coach:m.coachStudySnapshot||T.coachSnapshot||null};return {person:null,coach:T.coachSnapshot||null};}
function sisCtBack(T){if(!T||T.done||G.day<T.to)return;const S=sisInit(),key=T.key||('coachStudy:legacy:'+T.tid+':'+T.id+':'+T.y);T.key=key;const prior=(S.studyHistory||[]).find(h=>h.key===key);if(prior){T.done=1;const q=coachStudyTarget(T);if(q.person&&q.person.sisAway<=G.day)delete q.person.sisAway;return;}
  const target=coachStudyTarget(T),person=target.person,c=target.coach;if(!c){T.done=1;(S.studyHistory=S.studyHistory||[]).push({...T,key,status:'completed',gain:0,loyalty:0,unavailable:true});return;}
  const focus=CAB[T.focus]?T.focus:null,raw=T.program==='dom'?1:ri(1,3),result=coachStudyGrow(c,focus,raw),program=T.program||OCL_BY[T.cid]?.c||'jp',row={key,id:T.id,y:T.y,tid:T.tid,name:T.name||c.name,program,focus:focus||'legacy',from:T.from??T.to-SIS_CTD,to:T.to,completed:G.day,cost:T.cost??SIS_CT[OCL_BY[T.cid]?.c]??0,status:'completed',...result,loyalty:program==='dom'?6:10};
  const P=person||c;P.studyHist=coachStudyLedger(P).filter(h=>h.key!==key);P.studyHist.push(row);if(person&&person!==c)person.coachStudySnapshot=c;if(person)delete person.sisAway;(S.studyHistory=S.studyHistory||[]).push(JSON.parse(JSON.stringify(row)));T.done=1;
  const outcome=Number.isFinite(row.before?.value)&&Number.isFinite(row.after?.value)?`${CAB[focus]||'선택 분야'} ${Number(dvRaw(row.before.value).toFixed(1))} → ${Number(dvRaw(row.after.value).toFixed(1))}(화면 능력치 기준)`:'보직 주요 분야 학습 완료';
  if(T.cid)sisAdd(T.tid,T.cid,4);try{chron('coach',`${row.name} ${COACH_STUDY[program]?.l||'자매구단 연수'} 수료 · ${outcome} · 지원 구단과 인연이 깊어짐`,null,T.tid,{source:key+':end'});}catch(e){}
  if(T.tid===G.user&&!G.unemp)try{mail(`${row.name} 코치`,`${COACH_STUDY[program]?.l||'자매구단 연수'}를 마쳤습니다`,`${CAB[focus]||'보직 주요 분야'} 학습을 마쳤습니다. ${outcome}. 교육 지원에 감사해 ${tshort(T.tid)}에 남으려는 마음이 강해졌습니다. 능력 상한 때문에 상승하지 않아도 교육 지원 인연은 남습니다.`,{kind:'코치'});}catch(e){}
}
function sisCoachBack(){const S=sisInit();for(const T of coachStudyTickets())sisCtBack(T);if(S.ctq)S.ctq=S.ctq.filter(T=>!T.done);}
function coachStudyAi(day){const o=dobj(day);if(o.m!==11||o.d!==2||period()!=='off')return;for(const t of G.teams){if(t.id===ME()||coachStudyQuota(t.id,o.y)>0||coachStudyFunds(t.id)<100||u01('coachStudyAI:'+o.y,t.id)>.35)continue;const choices=Object.values(G.coach?.[t.id]||{}).filter(Boolean).map(c=>({c,focus:coachStudyFields(c).sort((a,b)=>a.value-b.value).find(f=>coachStudyForecast(c,f.k,1)>0)?.k})).filter(x=>x.focus&&!coachStudyCheck(x.c.id,'dom',x.focus,t.id,undefined,true)).sort((a,b)=>(a.c.age||50)-(b.c.age||50)||String(a.c.id).localeCompare(String(b.c.id)));const pick=choices[0];if(!pick)continue;
  /* 우리와 같은 선택지: 자매구단이 있는 나라는 그쪽 연수(할인), 돈이 넉넉하면 해외 연수, 아니면 국내 교육(사용자 11-13) */
  const f=coachStudyFunds(t.id),pl=planOf(t),abroad=['jp','us'].filter(k=>{const P=coachStudyProgram(k,t.id);return P&&(P.partner||(f>=3000&&pl!=='tight'))&&f>=P.cost+1500&&!coachStudyCheck(pick.c.id,k,pick.focus,t.id,P.cid,true);}).sort((a,b)=>(coachStudyProgram(b,t.id).partner?1:0)-(coachStudyProgram(a,t.id).partner?1:0));
  const k=abroad[0]||'dom';coachStudySend(pick.c.id,k,pick.focus,t.id,k==='dom'?undefined:coachStudyProgram(k,t.id).cid,true);}}
/* 선수 정보 교환: 관계 50 이상 자매구단이 외국인 후보를 귀띔한다(12_foreign.js scoutFindWeek에서 매주). 우리 스카우트가 찾은 후보로 들어가고 평가 오차가 더 작다 */
function sisLeadWeek(found){ if(G.unemp||(G.fmarket||[]).length>=46)return; for(const c of ['jp','us']){ if(G.fmarket.length>=46)break; const cid=sisMine(G.user,c); if(!cid)continue; const rel=sisRel(G.user,cid); if(rel<50||R()>=.05+(rel-50)/500)continue;
    const q=newForeign(c==='jp'?'아시아':'용병',{src:'scout',finder:G.user,flv:3,reg:c}); q.fsis=cid; G.fmarket.push(q.id); if(found)found.push(q);
    mail(OCL_BY[cid].n,`자매구단 정보: ${q.name}(${posLabel(q)})`,`${OCL_BY[cid].n} 프런트가 ${c==='jp'?'일본 리그':'마이너리그'}에서 눈여겨본 선수를 알려 왔습니다. 오래 지켜본 구단의 정보라 평가가 비교적 정확합니다. 외국인 시장에서 확인하세요.`,{kind:'외국인',ref:q.id}); } }
/* 캠프 시작: 캠프지가 겹치는 구단과 관계 +5. 경기 관계 +2는 97에서 실제 경기 완료 때만 정산한다. */
function sisCampStart(){ const S=G.scp; if(!S||!S.t)return; for(const t of G.teams){ const P=S.t[t.id]; if(!P)continue;
  for(const c of OCL)if((c.s[0]===1&&P.s1===c.s[1])||(c.s[0]===2&&P.s2===c.s[1]))sisAdd(t.id,c.id,5); } }
/* 11월 1일: 연회비 갱신 · 관계가 식은 결연 종료 · 더 가까운 구단으로 옮김 · 다른 구단의 새 결연 */
function sisYear(){ const S=sisInit(); const L=[];
  for(const cid of Object.keys(S.p)){ const x=S.p[cid], c=OCL_BY[cid], rel=sisRel(x.tid,cid);
    const riv=G.teams.filter(t=>t.id!==x.tid&&t.id!==G.user&&!sisMine(t.id,c.c)).map(t=>({tid:t.id,r:sisRel(t.id,cid)})).sort((a,b)=>b.r-a.r)[0];
    if(rel<30){ sisEnd(cid,`${c.n}이(가) 관계가 소원해졌다며 자매결연을 끝내자고 알려 왔습니다(관계 ${rel}). 캠프·교류로 관계를 다시 쌓으면 다시 맺을 수 있습니다.`); continue; }
    if(riv&&riv.r>=60&&riv.r>=rel+20){ sisEnd(cid,`${c.n}이(가) ${tname(riv.tid)}과(와) 새로 결연하기로 했다며 우리와의 결연을 끝냈습니다(우리 관계 ${rel}, 상대 ${riv.r}).`); S.p[cid]={tid:riv.tid,y:G.year}; team(riv.tid).cash-=sisFee(c); L.push(`${tshort(riv.tid)}-${c.n}`); continue; }
    const fee=sisFee(c); if(x.tid===G.user&&!G.unemp){ G.spend.etc=(G.spend.etc||0)+fee; mail(c.n,`${c.n} 자매결연 갱신`,`올해도 결연을 이어 갑니다. 연회비 ${money(fee)}. 지금 관계 ${rel}.${rel<45?' 관계가 많이 식었습니다. 30 아래면 상대가 결연을 끝낼 수 있습니다.':''}`,{kind:'캠프'}); } else { const t=team(x.tid); if(t)t.cash-=fee; } }
  for(const t of G.teams){ if(t.id===G.user&&!G.unemp)continue; for(const cn of ['jp','us']){ if(sisMine(t.id,cn)||R()>=.5)continue; const b=OCL.filter(c=>c.c===cn&&sisPtn(c.id)==null).map(c=>({c,r:sisRel(t.id,c.id)})).filter(x=>x.r>=50).sort((a,b)=>b.r-a.r)[0];
    if(b){ S.p[b.c.id]={tid:t.id,y:G.year}; t.cash-=sisFee(b.c); L.push(`${tshort(t.id)}-${b.c.n}`); } } }
  if(L.length)news('리그','국내 구단 해외 자매결연 소식',`새로 맺은 자매결연: ${L.join(', ')}.`,0); }
function sisDaily(day){ const o=dobj(day); sisInit();
  if(o.d===1){ const S=G.sis; for(const k in S.r)if(S.r[k]>15)S.r[k]--; } /* 매달 1씩 식는다 */
  if(o.m===11&&o.d===1)sisYear();
  if(o.m===10&&o.d===11)for(const F of sisFlAll())sisFlDepart(F);
  if(o.m===11&&o.d===15)for(const F of sisFlAll())sisFlRun(F);
  sisCoachBack(); coachStudyAi(day); }
