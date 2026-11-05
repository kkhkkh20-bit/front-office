/* ===== 진기록: 경기·시즌·통산 이정표를 한곳에 모은다 ===== */
const FEATK={cyc:'사이클링 히트',hr4:'한 경기 4홈런',hr3:'한 경기 3홈런',h6:'한 경기 6안타',h5:'한 경기 5안타',rbi8:'한 경기 8타점',hrc:'연타석 홈런',gs:'만루 홈런',wohr:'끝내기 홈런',woh:'끝내기 안타',pg:'퍼펙트게임',nh:'노히트노런',tnh:'팀 노히트노런',k15:'한 경기 15탈삼진',cg0:'무사사구 완봉',r20:'한 경기 20득점',hs:'연속 경기 안타',
  mile:'통산 이정표',s3030:'30-30',hr40:'시즌 40홈런',s330:'3할·30홈런·100타점',s4040:'40-40',hr50:'시즌 50홈런',h200:'시즌 200안타',avg400:'4할 타율',tcB:'타격 3관왕',tcP:'투수 3관왕',w20:'시즌 20승',sv40:'시즌 40세이브',k200:'시즌 200탈삼진',era1:'1점대 평균자책점',srec:'시즌 신기록',ovs:'해외 진출'};
const FEATG={hrc:'g',gs:'g',wohr:'g',woh:'g',cyc:'g',hr4:'g',hr3:'g',h6:'g',h5:'g',rbi8:'g',pg:'g',nh:'g',tnh:'g',k15:'g',cg0:'g',r20:'g',hs:'g',mile:'m'};
const FEATMAJ=new Set(['cyc','hr4','h6','pg','nh','tnh','s4040','hr50','h200','avg400','tcB','tcP','srec']);
/* 리그 통산 몇 번째(종류별 누계). 옛 저장은 남아 있는 연표로 시작한다 */
function featNth(k){ const N=G.featN=G.featN||{}; if(N[k]==null)N[k]=(G.feats||[]).filter(x=>x.k===k).length; return ++N[k]; }
/* 선수별 기록(프로필용, 최근 40건). 옛 저장은 리그 연표에 남은 그 선수 기록으로 시작한다 */
function pFeats(p){ if(!p.feats)p.feats=(G.feats||[]).filter(x=>x.pid===p.id).slice(0,40).map(x=>({i:x.id,y:x.y,d:x.d,k:x.k,txt:x.txt,vs:x.vs||'',n:x.n})); return p.feats; }
const FEAT_PONLY=new Set(['gs','woh']); /* 한 시즌 수십 번 나오는 기록은 리그 연표(600건)를 밀어내지 않게 선수 기록과 누계만 */
function featAdd(k,p,txt,o){ o=o||{}; G.feats=G.feats||[]; const tid=o.tid??(p?p.team:null); const n=k==='mile'||k==='srec'||k==='hs'?null:featNth(k); const f={id:(G.featSeq=(G.featSeq||0)+1),y:G.year,d:G.day,k,pid:p?p.id:null,name:p?p.name:(o.name||''),tid,txt,vs:o.vs||'',maj:FEATMAJ.has(k)||!!o.maj,v:o.v??null}; if(n)f.n=n;
  if(p){ const L=pFeats(p); L.unshift({i:f.id,y:f.y,d:f.d,k,txt,vs:f.vs,n}); if(L.length>40)L.length=40; }
  if(!FEAT_PONLY.has(k)){ G.feats.unshift(f); if(G.feats.length>600)G.feats.length=600; }
  o.wire=o.wire&&G.user!=null; /* 개막 전 가상 2025시즌(구단 선택 전)에는 잦은 기록 소식을 내지 않는다 */ const nth=n&&(f.maj||o.wire)?` · 리그 통산 ${n}번째`:'';
  if(f.maj||o.wire){ wire('기록',`${p?p.name+' ':''}${txt}${o.vs?` (${o.vs})`:''}${nth}`,{tid,ref:p?p.id:null}); if(tid===G.user&&G.pr&&period()!=='pre'){ news('선수',`${p?p.name+', ':''}${FEATK[k]}${n&&f.maj?` (리그 ${n}번째)`:''}`,`${txt}${o.vs?` · ${o.vs}`:''}${nth}`,f.maj?3:1,{ref:p?p.id:null,fanW:f.maj?2:1}); } }
  return f; }
/* 타석 기록(pbp)에서: 만루 홈런, 연타석 홈런(3연타석 이상, 경기를 넘어 이어짐), 끝내기 홈런·안타. 조회만 하고 난수는 쓰지 않는다 */
function featPbp(day,g){ const P=g.pbp||[]; const sideOf=id=>g.S.h.box.has(id)?'h':'a'; const vsOf=k=>`${dmd(day)} vs ${tshort(g.S[k==='h'?'a':'h'].tid)}`;
  const B=P.filter(r=>typeof r[1]==='number'); const cut=P.length>=260; /* 기록 상한에 걸려 뒤 타석이 빠진 경기는 연타석을 끊는다 */
  for(const r of B){ const p=G.players[r[1]]; if(!p)continue; const k=sideOf(p.id);
    if(r[3]==='HR'&&r[6]===4)featAdd('gs',p,'만루 홈런',{vs:vsOf(k)});
    if(r[3]==='HR'){ p.hrab=(p.hrab||0)+1; if(p.hrab>=3){ const L=pFeats(p), f0=L.find(x=>x.i===p.hrabF); const txt=`${p.hrab}연타석 홈런`; if(f0){ f0.txt=txt; f0.d=G.day; const lf=(G.feats||[]).find(x=>x.id===f0.i); if(lf){ lf.txt=txt; lf.v=p.hrab; lf.maj=p.hrab>=4; } } else p.hrabF=featAdd('hrc',p,txt,{vs:vsOf(k),v:p.hrab,wire:1}).id; } }
    else if(p.hrab){ delete p.hrab; delete p.hrabF; } }
  if(cut)for(const r of B){ const p=G.players[r[1]]; if(p){ delete p.hrab; delete p.hrabF; } }
  if(g.walk){ const r=B[B.length-1]; const p=r&&G.players[r[1]]; if(p&&!cut&&['HR','1B','2B','3B'].includes(r[3])){ const k=sideOf(p.id), hr=r[3]==='HR'; featAdd(hr?'wohr':'woh',p,hr?`끝내기 ${r[6]===4?'만루 홈런':'홈런'} (${g.inn}회말)`:`끝내기 ${({'1B':'안타','2B':'2루타','3B':'3루타'})[r[3]]} (${g.inn}회말)`,{vs:vsOf(k),wire:hr}); } } }
/* 경기 단위 투수·팀 기록 */
function featGame(day,g){ if(!G.cal)return; try{ featPbp(day,g); }catch(e){} for(const k of ['h','a']){ const s=g.S[k], ok=k==='h'?'a':'h', os=g.S[ok]; const vs=`${dmd(day)} vs ${tshort(os.tid)}`;
    const P=s.pitchers.map(id=>[id,s.box.get(id)]).filter(x=>x[1]); const ha=sum(P.map(x=>x[1].h||0)), bba=sum(P.map(x=>(x[1].bb||0)+(x[1].hbp||0))), outs=sum(P.map(x=>x[1].outs||0)), bf=sum(P.map(x=>x[1].bf||0)); const roe=sum(P.map(x=>x[1].roe||0)); const perfect=bba===0&&roe===0&&bf>0&&bf<=outs; /* 실책 출루 등 어떤 출루도 없어야 퍼펙트(상대 타자 수 = 잡은 아웃 수) */
    if(outs>=27&&ha===0&&g.score[ok]===0){ if(P.length===1){ const p=G.players[P[0][0]]; if(p)featAdd(perfect?'pg':'nh',p,perfect?'퍼펙트게임':'노히트노런',{vs}); } else featAdd('tnh',null,`${tname(s.tid)} 투수 ${P.length}명 합작 노히트노런`,{tid:s.tid,vs,name:tname(s.tid)}); }
    else if(P.length===1&&outs>=27&&g.score[ok]===0&&bba===0){ const p=G.players[P[0][0]]; if(p)featAdd('cg0',p,`무사사구 완봉 (${ha}피안타)`,{vs}); }
    for(const [id,x] of P)if((x.so||0)>=15){ const p=G.players[id]; if(p)featAdd('k15',p,`한 경기 ${x.so}탈삼진`,{vs,maj:x.so>=17}); }
    if(g.score[k]>=20)featAdd('r20',null,`${tname(s.tid)} ${g.score[k]}득점`,{tid:s.tid,vs,name:tname(s.tid)}); } }
/* 경기 단위 타자 기록 (storyGame에서 부른다) */
function featBat(p,x,vs){ const sg=(x.h||0)-(x.d||0)-(x.tr||0)-(x.hr||0);
  if(sg>=1&&x.d>=1&&x.tr>=1&&x.hr>=1)featAdd('cyc',p,`사이클링 히트 (${x.ab}타수 ${x.h}안타)`,{vs});
  if(x.hr>=4)featAdd('hr4',p,`한 경기 ${x.hr}홈런`,{vs}); else if(x.hr===3)featAdd('hr3',p,'한 경기 3홈런',{vs});
  if(x.h>=6)featAdd('h6',p,`한 경기 ${x.h}안타`,{vs}); else if(x.h===5)featAdd('h5',p,'한 경기 5안타',{vs});
  if((x.rbi||0)>=8)featAdd('rbi8',p,`한 경기 ${x.rbi}타점`,{vs,maj:x.rbi>=10});
  if((x.ab||0)+(x.bb||0)+(x.sf||0)>0){ if(x.h>0){ p.hstk=(p.hstk||0)+1; if(p.hstk>=20){ const f=(G.feats||[]).find(z=>z.id===p.hstkF); if(f&&f.pid===p.id){ f.v=p.hstk; f.txt=`${p.hstk}경기 연속 안타`; f.d=G.day; f.maj=p.hstk>=28; const pf=pFeats(p).find(z=>z.i===f.id); if(pf){ pf.txt=f.txt; pf.d=G.day; } } else p.hstkF=featAdd('hs',p,`${p.hstk}경기 연속 안타`,{vs,v:p.hstk}).id; } } else if(x.ab>0||(x.sf||0)>0){ p.hstk=0; p.hstkF=null; } } } /* 희생플라이는 연속 경기 안타를 끊는다(희생번트·볼넷·사구만 친 경기는 이어진다) */
/* 시즌 기록: 정규시즌이 끝날 때 */
const SBK={hr:['홈런',1],rbi:['타점',1],h:['안타',1],sb:['도루',1],w:['승',1],sv:['세이브',1],so:['탈삼진',1]};
function featSeason(y){ const B=[], P=[]; for(const p of Object.values(G.players)){ const h=seasonTotal(p,y,'1군'); if(!h)continue; (p.isP?P:B).push({p,h}); }
  const qB=B.filter(x=>x.h.pa>=446), qP=P.filter(x=>x.h.outs>=432);
  for(const {p,h} of B){ const r=bRate(h); if(h.hr>=40&&h.sb>=40)featAdd('s4040',p,`40-40 (${h.hr}홈런 ${h.sb}도루)`); else if(h.hr>=30&&h.sb>=30)featAdd('s3030',p,`30-30 (${h.hr}홈런 ${h.sb}도루)`);
    if(h.hr>=50)featAdd('hr50',p,`시즌 ${h.hr}홈런`); else if(h.hr>=40)featAdd('hr40',p,`시즌 ${h.hr}홈런`); if(h.pa>=446&&r.avg>=.3&&h.hr>=30&&h.rbi>=100)featAdd('s330',p,`타율 ${fmt3(r.avg)} · ${h.hr}홈런 · ${h.rbi}타점`); if(h.h>=200)featAdd('h200',p,`시즌 ${h.h}안타`); if(h.pa>=446&&r.avg>=.4)featAdd('avg400',p,`시즌 타율 ${fmt3(r.avg)}`); }
  if(qB.length){ const ma=Math.max(...qB.map(x=>bRate(x.h).avg)), mh=Math.max(...B.map(x=>x.h.hr)), mr=Math.max(...B.map(x=>x.h.rbi)); for(const {p,h} of qB)if(bRate(h).avg===ma&&h.hr===mh&&h.rbi===mr)featAdd('tcB',p,`타격 3관왕 (타율 ${fmt3(ma)} · ${mh}홈런 · ${mr}타점)`); }
  for(const {p,h} of P){ if(h.w>=20)featAdd('w20',p,`시즌 ${h.w}승`); if(h.sv>=40)featAdd('sv40',p,`시즌 ${h.sv}세이브`); if(h.so>=200)featAdd('k200',p,`시즌 ${h.so}탈삼진`); if(h.outs>=432&&pRate(h).era<2)featAdd('era1',p,`평균자책점 ${pRate(h).era.toFixed(2)}`); }
  if(qP.length){ const me=Math.min(...qP.map(x=>pRate(x.h).era)), mw=Math.max(...P.map(x=>x.h.w)), mk=Math.max(...P.map(x=>x.h.so)); for(const {p,h} of qP)if(pRate(h).era===me&&h.w===mw&&h.so===mk)featAdd('tcP',p,`투수 3관왕 (${mw}승 · 평균자책점 ${me.toFixed(2)} · ${mk}탈삼진)`); }
  // 리그 단일 시즌 최고 기록 갱신
  G.sbest=G.sbest||{}; const first=!Object.keys(G.sbest).length;
  for(const k in SBK){ const L=(k==='w'||k==='sv'||k==='so')?P:B; let best=null; for(const x of L){ const v=x.h[k]||0; if(!best||v>best.v)best={v,p:x.p}; } if(!best||!best.v)continue;
    const cur=G.sbest[k]; if(!cur||best.v>cur.v){ G.sbest[k]={v:best.v,name:best.p.name,pid:best.p.id,tid:best.p.team,y}; if(!first&&cur)featAdd('srec',best.p,`시즌 최다 ${SBK[k][0]} 신기록 ${best.v} (종전 ${cur.v}, ${cur.name} ${cur.y})`); } }
  const ab=qB.map(x=>({v:bRate(x.h).avg,p:x.p})).sort((a,b)=>b.v-a.v)[0]; if(ab&&(!G.sbest.avg||ab.v>G.sbest.avg.v)){ const cur=G.sbest.avg; G.sbest.avg={v:+ab.v.toFixed(3),name:ab.p.name,pid:ab.p.id,tid:ab.p.team,y}; if(cur&&!first)featAdd('srec',ab.p,`시즌 최고 타율 신기록 ${fmt3(ab.v)} (종전 ${fmt3(cur.v)})`); }
  const eb=qP.map(x=>({v:pRate(x.h).era,p:x.p})).sort((a,b)=>a.v-b.v)[0]; if(eb&&(!G.sbest.era||eb.v<G.sbest.era.v)){ const cur=G.sbest.era; G.sbest.era={v:+eb.v.toFixed(2),name:eb.p.name,pid:eb.p.id,tid:eb.p.team,y}; if(cur&&!first)featAdd('srec',eb.p,`시즌 최저 평균자책점 신기록 ${eb.v.toFixed(2)} (종전 ${cur.v.toFixed(2)})`); } }

function retWarT(){ return (G&&G.cfg&&G.cfg.retWar)||60; }

