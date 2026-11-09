/* ===== 아마추어 스카우트 지역 정보망(사용자 11-08: 지역 지도·고교 정보·연고지 정보망) =====
   실제 바탕(조사 11-08):
   - 2026 고교야구 주말리그: 전국 102개 고교(18세 이하부) 팀, 13개 권역, 3월 7일~6월 21일, 팀당 12경기(스타뉴스 2026-03-06).
   - 스카우트는 한 해 아마추어 선수 1,000명 가까이 보고 후보 50명 안팎으로 줄여 10명 정도를 뽑는다. 경기 뒤 더그아웃에서 감독·코치에게
     성격·집안·부상 이야기를 듣는다(OSEN 'KS 우승비법 16'). 겨울엔 제주·남해 전지훈련을 돌며 고교 선수 500~600명 자료를 채운다(시사저널).
   - 연고지 우선 지명(1차 지명)은 2023 드래프트부터 없어졌지만, 오래 다닌 연고 지역 학교 감독·코치와의 인맥은 남는다.
   게임: 스카우트 배치 단위(수도권·영남·호남·충청 3곳)는 그대로 두고, 그 안을 9개 권역으로 나눠 구단마다 '정보망'(0~100)을 둔다.
   정보망이 높을수록 그 권역 후보의 평가 오차가 줄고, 숨은 재능을 알아볼 확률이 오른다.
   shortcut: 학교 명단은 잘 알려진 고교 야구부 위주(전국 102개 중 일부), 권역은 주말리그 13권역 대신 9권역. 공식 명단을 받으면 늘린다 */
const AREA=[ /* k: 권역, reg: 스카우트 배치 지역, w: 고교 팀 수 비중(대략), city: 연고 도시 */
  {k:'서울',reg:'수도권',w:19,city:['서울'],hs:['덕수고','장충고','충암고','서울고','배재고','휘문고','선린인터넷고','경기고','신일고','중앙고','성남고','배명고','경동고','이대부고','서울디자인고'],un:['고려대','연세대','동국대','한양대','건국대','성균관대','홍익대','경희대']},
  {k:'인천·경기',reg:'수도권',w:18,city:['인천','수원','고양','성남','부천','안산'],hs:['인천고','동산고','제물포고','유신고','야탑고','장안고','소래고','부천고','안산공고','율곡고'],un:['인하대','단국대','강남대']},
  {k:'강원',reg:'수도권',w:5,city:['춘천','원주','강릉'],hs:['강릉고','원주고','설악고'],un:['강릉영동대']},
  {k:'충청',reg:'호남·충청',w:11,city:['대전','청주','천안'],hs:['대전고','충남고','세광고','청주고','북일고','공주고','충주성심학교'],un:['한남대','중부대']},
  {k:'전북',reg:'호남·충청',w:6,city:['전주','군산'],hs:['군산상일고','전주고','인상고'],un:['원광대','우석대']},
  {k:'광주·전남',reg:'호남·충청',w:8,city:['광주','목포','순천'],hs:['광주제일고','동성고','진흥고','효천고','화순고'],un:['송원대','동신대']},
  {k:'대구·경북',reg:'영남',w:10,city:['대구','포항','경주'],hs:['경북고','대구고','상원고','포항제철고','경주고'],un:['영남대','계명대','대구가톨릭대']},
  {k:'부산·울산·경남',reg:'영남',w:14,city:['부산','울산','창원','김해'],hs:['부산고','경남고','개성고','부산공고','부경고','마산고','마산용마고','김해고','울산공고'],un:['동아대','경성대','동의대']},
  {k:'제주',reg:'호남·충청',w:1,city:['제주'],hs:['제주고'],un:['제주국제대']}];
const AREA_K=AREA.map(a=>a.k);
const areaDef=k=>AREA.find(a=>a.k===k)||null;
/* 구단 연고 권역(도시로) */
function teamArea(tid){ const t=(G&&G.teams&&G.teams[tid])||TEAM_DEF[tid]; const c=t&&t.city; const a=AREA.find(x=>x.city.includes(c)); return a?a.k:null; }
/* 후보의 권역: 새 후보는 만들 때 정하고, 예전 후보는 지역(3곳) 안에서 고정 해시로 고른다 */
function areaOf(p){ if(!p)return null; if(p.area)return p.area; const L=AREA.filter(a=>a.reg===p.region); if(!L.length)return null; const tot=L.reduce((s,a)=>s+a.w,0); let x=u01('ar',p.id)*tot; for(const a of L){ x-=a.w; if(x<=0)return a.k; } return L[L.length-1].k; }
/* ===== 고향·모교(사용자 11-09d): FA가 고향 팀을 조금 더 반기고, 구단은 팬·구단주 앞에 데려올 명분이 선다 =====
   고향 권역은 areaOf(예전 선수는 3지역 안에서 고정 해시). 모교는 기록된 p.school(대학이면 대학 그대로, 검수 11-09s), 기록이 없는 예전 선수만 권역 고교 중 고정 해시 */
function homeSchool(p){ const a=areaDef(areaOf(p)); if(!a)return null; return p.school?p.school:a.hs[Math.floor(u01('hs',p.id)*a.hs.length)]; }
const homeTxt=p=>{ const k=areaOf(p); return k?`${k} · ${homeSchool(p)}`:(p.region||'-'); };
/* 고향 팀 연결: 국내 선수만. 기본 +4%, 처음 지명한 구단으로 돌아오면 +2%, 33세 이상 귀향은 1.5배(최대 +9%) */
function homeTie(p,tid){ if(!p||p.foreign||tid==null)return null; const k=areaOf(p); if(!k||teamArea(tid)!==k)return null;
  const first=!!(p.draft&&p.draft.tid===tid&&p.team!==tid&&p.faFrom!==tid), vet=p.age>=33; const v=(.04+(first?.02:0))*(vet?1.5:1);
  return {k,sch:homeSchool(p),first,vet,v:Math.round(v*1000)/1000,l:`고향 팀 · ${homeSchool(p)} 출신${first?' · 친정':''}`}; }
function pickArea(){ const tot=AREA.reduce((s,a)=>s+a.w,0); let x=R()*tot; for(const a of AREA){ x-=a.w; if(x<=0)return a; } return AREA[0]; }
/* 새 드래프트 후보에 권역·학교를 붙인다(10_draft.js makeDraftClass) */
function setProspectArea(b){ const a=pickArea(); b.area=a.k; b.region=a.reg; b.school=b.college?pick(a.un):pick(a.hs); return b; }
/* 정보망 0~100: 연고 권역이 가장 높고(오래 다닌 학교 감독·코치 인맥), 같은 배치 지역 안 이웃 권역이 그다음.
   그 지역에 아마추어 스카우트를 오래 둘수록, 스카우트 고향(연줄) 권역일수록, 단장이 올해 직접 관전한 권역일수록 오른다 */
function areaNet(tid,k){ const a=areaDef(k); if(!a)return 0; const home=teamArea(tid), hd=areaDef(home);
  let v=k===home?62:hd&&hd.reg===a.reg?30:12;
  if(tid===G.user){
    const sc=(G.scouts||[]).filter(s=>(s.role||'am')==='am'&&s.region===a.reg);
    for(const s of sc){ const mon=Math.max(0,Math.min(36,(G.day-(s.since??-999))/30)); const nA=AREA.filter(x=>x.reg===a.reg).length; v+=Math.min(22,(mon*.6+effSkill(s)*2.5)*(k===home?1:3/nA)); if(scHome(s)===k)v+=12; }
    v+=Math.min(8,(areaVisits(tid)[k]||0)*.5); /* 그 권역 대회를 직접 본 횟수(구단별, 해마다 절반, 상한) */
  } else v+=10; /* 다른 구단은 기본 배치를 둔 것으로 본다 */
  return Math.round(clamp(v,0,100)); }
const netLbl=v=>v>=75?'촘촘함':v>=55?'좋음':v>=35?'보통':v>=20?'약함':'거의 없음';
/* 스카우트 고향(연줄) 권역: 배치와 상관없이 고정. 그 권역 학교 감독·코치와 아는 사이 */
function scHome(s){ if(!s)return null; if(s.area)return s.area; const tot=AREA.reduce((a,x)=>a+x.w,0); let x=u01('sh',s.id)*tot; for(const a of AREA){ x-=a.w; if(x<=0)return a.k; } return AREA[0].k; }
/* 평가 오차 배수: 정보망 100이면 0.75배, 0이면 1.3배 */
function netSdM(p,tid){ if(!p||!p.prospect)return 1; const k=areaOf(p); if(!k)return 1; return (1.3-areaNet(tid??G.user,k)*.0055)*((tid??G.user)===G.user?schSdM(p):1); } /* 학교 감독 친분(91_schools.js) */
/* 권역 요약(지도·목록): 올해 드래프트 후보 */
function areaSummary(tid){ const C=(G.draftClass||[]).map(id=>G.players[id]).filter(p=>p&&p.prospect);
  return AREA.map(a=>{ const L=C.filter(p=>areaOf(p)===a.k); return {k:a.k,reg:a.reg,net:areaNet(tid,a.k),n:L.length,home:teamArea(tid)===a.k,L}; }); }
const areaVisits=tid=>(G.areaVisitT||{})[tid]||{}; /* 구단별 관전 횟수(검수 11-09e #17: 이직하면 새 구단은 0부터) */
/* 단장 고교 대회 관전(53_gm_schedule gmScoutTrip): 후보가 가장 많은 권역을 다녀온 것으로 센다 */
function areaVisitAdd(L){ const c={}; for(const p of L||[]){ const k=areaOf(p); if(k)c[k]=(c[k]||0)+1; } const k=Object.keys(c).sort((a,b)=>c[b]-c[a])[0]; if(k){ G.areaVisitT=G.areaVisitT||{}; const V=G.areaVisitT[G.user]=G.areaVisitT[G.user]||{}; V[k]=(V[k]||0)+1; } try{ const seen=new Set(); for(const p of L||[]){ const S=schOf(p); if(S&&!seen.has(S.n)){ seen.add(S.n); schAdd(S,3); } } }catch(e){} /* 대회장에서 감독들과 인사(친분 +3) */ return k; }
/* '아마 성적' 정렬(31_draft_board) 점수 */
function amRaw(p){ const h=p.am; if(!h)return null; if(p.isP){ const r=pRate(h); return 10-r.era+(h.so/Math.max(1,h.outs/3))*.8; } return bRate(h).ops*10; }
/* 투수와 타자는 점수 척도가 달라 올해 후보 안에서 각각 표준점수로 맞춘다(검수 11-09e #28) */
let _amZ=null;
function amScore(p){ const x=amRaw(p); if(x==null)return -99; const ids=G.draftClass||[], k=G.year+':'+ids.length+':'+ids[0];
  if(!_amZ||_amZ.k!==k){ const z={k}; for(const P of [true,false]){ const v=ids.map(id=>G.players[id]).filter(q=>q&&!!q.isP===P).map(amRaw).filter(y=>y!=null); const m=v.length?sum(v)/v.length:0; z[P]={m,s:Math.sqrt(v.length?sum(v.map(y=>(y-m)**2))/v.length:1)||1}; } _amZ=z; }
  const s=_amZ[!!p.isP]; return (x-s.m)/s.s; }
