/* ===== 신인 드래프트: 담당 스카우트의 주장 =====
   '숨은 진주' 같은 정답 표시 대신, 담당 스카우트가 언론 평가와 다르게 보는 후보를 주장으로 낸다.
   주장은 스카우트 추정(관찰 오차 + 스카우트마다 좋아하는 툴에 후한 버릇)에서 나오므로 틀릴 수 있다.
   확신도는 관찰 횟수와 스카우트 실력에서 나오고, 버릇에서 오는 오차는 확신도에 드러나지 않는다 */
const DC_PETB=['pow','spd','con','def'], DC_PETP=['stf','stf','ctl','sta'];
/* 스카우트마다 좋아하는 툴(야수 하나·투수 하나). 그 툴이 좋아 보이면 잠재력을 4 정도 후하게 본다 */
function scoutPet(sc,isP){ if(!sc)return null; const L=isP?DC_PETP:DC_PETB; const h=Math.abs(Math.floor(hn('pet'+(isP?'p':'b'),String(sc.id))*1000)); return L[h%L.length]; }
const DC_PET_ADD=4, DC_LIKE_SD=2.5;
/* 관찰 횟수: 3월부터 담당 스카우트가 지역 대회를 돈다. 실력이 좋을수록 자주 보고, 단장이 직접 보면 2회 더 */
function dcObs(p,sc){ const gm=p.gmSeen===G.year?2:0; if(!sc)return gm; const end=G.cal&&G.cal.draft?Math.min(G.day,G.cal.draft):G.day, st=Math.max(dnum(G.year,3,1),sc.since||0); /* 배치일부터 센다(검수 11-06: 오늘 배치했는데 9회) */
  if(end<=st)return gm; /* 배치 첫날·시작 전에는 관찰 0회(검수 11-07) */ const base=Math.max(0,(end-st)/30)*(.45+.15*(sc.skill||0)); return Math.max(1,Math.round(base+u01('dob'+sc.id+G.year,p.id)*1.5))+gm; }
const DC_CONF=sd=>sd<=4.6?'높음':sd<=7?'보통':'낮음';
let _dcc=null; /* 저장하지 않는 계산 캐시 */
function draftClaims(){ const live=G.draft&&!G.draft.done; const ids=(live?G.draft.cls:G.draftClass)||[];
  const pool=ids.map(id=>G.players[id]).filter(p=>p&&p.prospect); const key=G.day+':'+pool.length+':'+pool.map(p=>p.id).join('.')+':'+(G.scouts||[]).map(s=>s.id+'.'+s.skill+'.'+s.region+'.'+(s.role||'')+'.'+(s.since||0)).join(',') /* 담당 역할·배치일이 바뀌면 같은 날에도 다시 계산(검수 11-08) */+':'+pool.filter(p=>p&&p.gmSeen===G.year).map(p=>p.id).join('.'); /* 인원수가 아니라 누구를 봤는지(검수 11-06) */ /* 단장이 직접 본 후보 수도 키에(같은 날 출장 반영) */
  if(_dcc&&_dcc.k===key)return _dcc.m; const m={};
  const L=pool.map(p=>{ const rp=scoutReport(p); return {p,rp,v:(rp.ofp??rp.cur+6)+rp.cur*.2}; }).sort((a,b)=>b.v-a.v); L.forEach((x,i)=>x.rk=i+1);
  [...L].sort((a,b)=>(a.p.press||999)-(b.p.press||999)).forEach((x,i)=>x.prk=i+1); /* 남은 후보 안에서 언론 순위 */
  const reason=x=>{ const T=x.rp.tools.filter(t=>t.k!=='vit'&&(x.p.isP?['stf','ctl','sta'].includes(t.k):!['stf','ctl','sta'].includes(t.k))); const pet=scoutPet(x.rp.sc,x.p.isP); const tp=T.find(t=>t.k===pet&&t.fut>=55); const best=tp||[...T].sort((a,b)=>b.fut-a.fut)[0]; return best?{k:best.k,g:FD_G(best.fut)}:null; };
  /* 강력 추천: 언론보다 25계단 이상 높게 보는 후보 중 스카우트가 가장 높게 보는 4명 */
  const up=L.filter(x=>x.rp.ofp!=null&&x.rp.ofp>=50&&x.rk<=45&&x.prk-x.rk>=25).sort((a,b)=>(b.rp.ofp+(b.prk-b.rk)*.1)-(a.rp.ofp+(a.prk-a.rk)*.1)).slice(0,4);
  const dn=L.filter(x=>x.rp.ofp!=null&&x.prk<=25&&x.rk-x.prk>=25).sort((a,b)=>(b.rk-b.prk)-(a.rk-a.prk)).slice(0,4);
  for(const [k,A] of [['up',up],['down',dn]])for(const x of A){ const sc=x.rp.sc; m[x.p.id]={k,rk:x.rk,prk:x.prk,obs:dcObs(x.p,sc),conf:DC_CONF(x.rp.sd||9),tool:reason(x),who:sc?sc.name:'단장'}; }
  _dcc={k:key,m}; return m; }
function draftClaim(p){ return p&&p.prospect?draftClaims()[p.id]||null:null; }
/* 화면·메일용 한 줄 */
function draftClaimTxt(c){ if(!c)return ''; const why=c.tool?` · 근거: ${TOOLK[c.tool.k]} ${c.tool.g}등급 전망`:'';
  return c.k==='up'?`담당 스카우트 강력 추천 · 언론 평가보다 높게 봅니다 · 관찰 ${c.obs}회 · 확신도 ${c.conf}${why}`:`담당 스카우트 신중론 · 언론 평가보다 낮게 봅니다 · 관찰 ${c.obs}회 · 확신도 ${c.conf}`; }
