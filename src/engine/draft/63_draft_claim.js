/* ===== 신인 드래프트: 담당 스카우트의 주장 =====
   '숨은 진주' 같은 정답 표시 대신, 담당 스카우트가 언론 평가와 다르게 보는 후보를 주장으로 낸다.
   주장은 스카우트 추정(관찰 오차 + 스카우트마다 좋아하는 툴에 후한 버릇)에서 나오므로 틀릴 수 있다.
   확신도는 관찰 횟수와 스카우트 실력에서 나오고, 버릇에서 오는 오차는 확신도에 드러나지 않는다 */
const DC_PETB=['pow','spd','con','def'], DC_PETP=['stf','stf','ctl','sta'];
/* 스카우트마다 좋아하는 툴(야수 하나·투수 하나). 그 툴이 좋아 보이면 잠재력을 4 정도 후하게 본다 */
function scoutPet(sc,isP){ if(!sc)return null; const L=isP?DC_PETP:DC_PETB; const h=Math.abs(Math.floor(hn('pet'+(isP?'p':'b'),String(sc.id))*1000)); return L[h%L.length]; }
const DC_PET_ADD=4, DC_LIKE_SD=2.5;
/* 직접 관전은 실제 관측일마다 누적한다. 옛 gmSeen 표시는 한 차례 관전으로 호환한다. */
function gmObsCount(p){const o=p&&p.gmObs;return o&&o.y===G.year?Math.max(0,o.n||0):p&&p.gmSeen===G.year?1:0;}
function gmObserve(p){if(!p)return;let o=p.gmObs;if(!o||o.y!==G.year)o=p.gmObs={y:G.year,n:gmObsCount(p),days:[]};if(!(o.days||[]).includes(G.day)){o.days=(o.days||[]).concat(G.day);o.n++;}p.gmSeen=G.year;}
function dcScoutObs(p,sc){if(!sc)return 0;const end=G.cal&&G.cal.draft?Math.min(G.day,G.cal.draft):G.day,st=Math.max(dnum(G.year,3,1),sc.since||0);if(end<=st)return 0;const base=Math.max(0,(end-st)/30)*(.45+.15*(sc.skill||0));return Math.max(1,Math.round(base+u01('dob'+sc.id+G.year,p.id)*1.5));}
/* 기존 단장 직접 관찰 한 번의 평가 가산(2회 상당)은 유지한다. 관전 횟수는 별도로 공개한다. */
function dcObs(p,sc){return dcScoutObs(p,sc)+gmObsCount(p);}
const dcEvalObs=(p,sc)=>dcObs(p,sc)+gmObsCount(p);
const DC_CONF=sd=>sd<=4.5?'높음':sd<=7?'보통':'낮음';
let _dcc=null; /* 저장하지 않는 계산 캐시 */
function draftClaims(){ const live=G.draft&&!G.draft.done; const ids=(live?G.draft.cls:G.draftClass)||[];
  const pool=ids.map(id=>G.players[id]).filter(p=>p&&p.prospect);
  const key=JSON.stringify([G.user,G.year,G.day,(G.scouts||[]),pool.map(p=>{const sc=bestScout(p.region,p);return [p.id,p.press,p.age,p.isP,p.pot,p.r,p.hidT,p.hidR,gmObsCount(p),areaNet(G.user,areaOf(p)),sc?[sc.id,sc.skill,prosSd(sc,p)]:null];})]);
  if(_dcc&&_dcc.g===G&&_dcc.k===key)return _dcc.m; const m={};
  const L=pool.map(p=>{ const rp=scoutReport(p); return {p,rp,v:(rp.ofp??rp.cur+6)+rp.cur*.2}; }).sort((a,b)=>b.v-a.v); L.forEach((x,i)=>x.rk=i+1);
  [...L].sort((a,b)=>(a.p.press||999)-(b.p.press||999)).forEach((x,i)=>x.prk=i+1); /* 남은 후보 안에서 언론 순위 */
  const reason=x=>{ const T=x.rp.tools.filter(t=>t.k!=='vit'&&(x.p.isP?['stf','ctl','sta'].includes(t.k):!['stf','ctl','sta'].includes(t.k))); const pet=scoutPet(x.rp.sc,x.p.isP); const tp=T.find(t=>t.k===pet&&t.fut>=55); const best=tp||[...T].sort((a,b)=>b.fut-a.fut)[0]; return best?{k:best.k,g:FD_G(best.fut)}:null; };
  /* 강력 추천: 언론보다 25계단 이상 높게 보는 후보 중 스카우트가 가장 높게 보는 4명 */
  const seen=x=>dcObs(x.p,x.rp.sc)>0; /* 한 번도 못 본 후보는 주장하지 않는다(검수 11-09ze: 배치 첫날 관찰 0회 강력 추천) */
  const up=L.filter(x=>seen(x)&&x.rp.ofp!=null&&x.rp.ofp>=50&&x.rk<=45&&x.prk-x.rk>=25).sort((a,b)=>(b.rp.ofp+(b.prk-b.rk)*.1)-(a.rp.ofp+(a.prk-a.rk)*.1)).slice(0,4);
  const dn=L.filter(x=>seen(x)&&x.rp.ofp!=null&&x.prk<=25&&x.rk-x.prk>=25).sort((a,b)=>(b.rk-b.prk)-(a.rk-a.prk)).slice(0,4);
  for(const [k,A] of [['up',up],['down',dn]])for(const x of A){ const sc=x.rp.sc; m[x.p.id]={k,rk:x.rk,prk:x.prk,obs:dcObs(x.p,sc),conf:DC_CONF(x.rp.sd||9),tool:reason(x),source:gmObsCount(x.p)>0?(dcScoutObs(x.p,sc)>0?'joint':'gm'):'scout',gmObs:gmObsCount(x.p),who:sc?sc.name:'단장'}; }
  _dcc={g:G,k:key,m}; return m; }
function draftClaim(p){ return p&&p.prospect?draftClaims()[p.id]||null:null; }
/* 화면·메일용 한 줄: 관찰하지 않은 스카우트에게 단장 의견을 귀속하지 않는다. */
function draftClaimWho(c){return c&&c.source==='gm'?'단장 직접 관찰':c&&c.source==='joint'?'단장·담당 스카우트':'담당 스카우트';}
function draftClaimTxt(c){if(!c)return '';const who=draftClaimWho(c),why=c.tool?` · 근거: ${TOOLK[c.tool.k]} ${c.tool.g}등급 전망`:'';return `${who} ${c.k==='up'?'강력 추천 · 언론 평가보다 높게 봅니다':'신중론 · 언론 평가보다 낮게 봅니다'} · 관찰 ${c.obs}회${c.gmObs?`(단장 직접 관전 ${c.gmObs}회 포함)`:''} · 확신도 ${c.conf}${c.k==='up'?why:''}`;}
