/* ===== 예고 선발 · 순위 기록 · 트레이드 비교 · 모의 지명 · 스태프 의견 ===== */
function teamGames(tid,from,n){ const c=G.cal; const L=[]; if(!c||!c.sched)return L; for(let d=from;d<=c.end&&L.length<n;d++){ const gs=c.sched[d]; if(!gs)continue; const m=gs.find(x=>x.includes(tid)); if(m)L.push({d,home:m[0]===tid,op:m[0]===tid?m[1]:m[0]}); } return L; }
let _spC={k:null};
function projStarters(tid,n){ // 지금 로테이션 순번과 휴식일로 다음 경기 선발을 예상(부상·피로로 바뀔 수 있음)
  const k=G.day+':'+G.games.length+':'+G.year; if(_spC.k!==k)_spC={k}; const ck=tid+':'+n; if(_spC[ck])return _spC[ck];
  const t=team(tid); const sp=depth(tid).sp; const games=teamGames(tid,G.day+1,n); const last={}; sp.forEach(p=>last[p.id]=p.lastStart); let rot=t.rot||0; const out=[];
  for(const g of games){ let pick=null;
    if(sp.length){ for(let i0=0;i0<sp.length;i0++){ const i=(rot+i0)%sp.length; const p=sp[i]; if(last[p.id]==null||g.d-last[p.id]>=5){ rot=(i+1)%sp.length; pick=p; break; } }
      if(!pick)pick=[...sp].sort((a,b)=>(last[a.id]||0)-(last[b.id]||0))[0]; last[pick.id]=g.d; }
    out.push(Object.assign({},g,{sp:pick})); }
  _spC[ck]=out; return out; }
function rankSnap(day){ if(period()!=='season')return; const st=standingsNow(); const rk=G.teams.map(()=>0); st.forEach((o,i)=>rk[o.tid]=i+1);
  const S=G.sea; S.rh=S.rh||[]; if(S.rh.length&&S.rh[S.rh.length-1][0]===day)return; S.rh.push([day,rk,G.teams.map(t=>{ const r=S.rec[t.id]; return r.w-r.l; })]); }

const FIELDK=['C','1B','2B','3B','SS','LF','CF','RF'];
function canAt(p,k){ return !p.isP&&(p.pos===k||subsOf(p).includes(k)); }
function posStrength(list){ const ev=new Map(list.map(p=>[p.id,scoutReport(p).cur])); const out={};
  for(const k of FIELDK){ const c=list.filter(p=>canAt(p,k)&&ev.get(p.id)!=null&&healthy(p)).map(p=>ev.get(p.id)).sort((a,b)=>b-a); out[k]=c.length?c[0]:null; }
  const sp=list.filter(p=>p.isP&&isSPr(p)&&ev.get(p.id)!=null&&healthy(p)).map(p=>ev.get(p.id)).sort((a,b)=>b-a).slice(0,5);
  const rp=list.filter(p=>p.isP&&!isSPr(p)&&ev.get(p.id)!=null&&healthy(p)).map(p=>ev.get(p.id)).sort((a,b)=>b-a).slice(0,5);
  out.SP=sp.length?Math.round(avg(sp)):null; out.RP=rp.length?Math.round(avg(rp)):null; return out; }
function rosterList(tid){ return playersOf(tid).filter(p=>!(p.joinY>G.year)); }
function tradeCompare(tid,give,get){
  const mine=rosterList(G.user), theirs=rosterList(tid); const gv=give.map(id=>G.players[id]), gt=get.map(id=>G.players[id]);
  const myAfter=mine.filter(p=>!give.includes(p.id)).concat(gt), thAfter=theirs.filter(p=>!get.includes(p.id)).concat(gv);
  return {my:[posStrength(mine),posStrength(myAfter)],th:[posStrength(theirs),posStrength(thAfter)]}; }
/* 감독 반응: 우리 트레이드가 전력과 감독 성향에 맞는지 */
function mgrTradeView(tid,give,get){ const m=G.mgr[G.user]; if(!m||m.interim)return null; const c=tradeCompare(tid,give,get); const ks=FIELDK.concat(['SP','RP']);
  let d=0; for(const k of ks){ const b=c.my[0][k]??35, a=c.my[1][k]??35; d+=(a-b)*(k==='SP'?2:1); }
  const youngOut=give.map(id=>G.players[id]).filter(p=>p&&p.age<=24&&(scoutReport(p).ofp||0)>=58).length;
  const regOut=give.map(id=>G.players[id]).filter(p=>p&&isRegular(p)).length;
  let r=0; const why=[]; if(d>=6){ r+=3; why.push('전력이 좋아진다'); } else if(d<=-6){ r-=4; why.push('전력이 약해진다'); }
  if(regOut&&d<0){ r-=2*regOut; why.push(`주전 ${regOut}명을 내준다`); }
  if(youngOut&&m.youth>=62){ r-=3; why.push('키우던 유망주를 내준다'); }
  if(m.ego>=70&&r<0)r-=1;
  const P=G.mpick; const pk=P&&P.back&&P.y===G.year?give.map(id=>G.players[id]).filter(p=>p&&P.ids.includes(p.id)):[];
  if(pk.length){ r=Math.min(r-3,-2); why.unshift(`함께 밀어주기로 한 ${pk.map(p=>p.name).join('·')}을(를) 내준다(감독 관계 -6)`); }
  return {r,d,txt:r>=2?`${m.name} 감독: 환영합니다. ${why.join(', ')}고 봅니다.`:r<=-2?`${m.name} 감독: 반대합니다. ${why.join(', ')}고 봅니다.`:`${m.name} 감독: 특별히 반대하지 않습니다.`}; }
function mgrTradeApply(v){ const m=G.mgr[G.user]; if(!m||!v||!v.r)return; m.rel=clamp(m.rel+v.r,0,100); note('감독',`${v.txt} (감독 관계 ${v.r>0?'+':''}${v.r})`); }
function estVal(p){ const rp=scoutReport(p); const cur=rp.cur??45; const fut=rp.ofp??cur; const eff=p.age<=25?cur+Math.max(0,fut-cur)*.6:p.age>=32?cur-(p.age-31)*1.3:cur; return Math.pow(Math.max(0,eff-36),1.7)/10-(p.sal/100)*.35; }
function asstOpinion(tid,give,get){ // 우리 부단장 의견: 스카우트 평가 기준(실제 능력과 다를 수 있음)
  if(!give.length&&!get.length)return [];
  const gv=give.map(id=>G.players[id]), gt=get.map(id=>G.players[id]); const L=[];
  const U=team(G.user); const diff=stackIn(gt.map(p=>tval(U,p,'in')))-sum(gv.map(p=>tval(U,p,'out')));
  L.push(diff>=3?'우리 평가로는 우리에게 유리한 거래입니다.':diff>=-1?'우리 평가로는 대체로 공정한 거래입니다.':diff>=-5?'우리가 조금 더 내주는 거래입니다.':'우리가 많이 손해 보는 거래로 봅니다.');
  const c=tradeCompare(tid,give,get); const lab=k=>k==='SP'?'선발진':k==='RP'?'불펜':POSK[k];
  const keys=FIELDK.concat(['SP','RP']);
  const drop=keys.map(k=>({k,b:c.my[0][k],a:c.my[1][k]})).filter(x=>x.b!=null&&(x.a==null||x.a<=x.b-5)).sort((x,y)=>(x.a??0)-x.b-((y.a??0)-y.b))[0];
  const up=keys.map(k=>({k,b:c.my[0][k],a:c.my[1][k]})).filter(x=>x.a!=null&&(x.b==null||x.a>=x.b+5)).sort((x,y)=>(y.a-(y.b??0))-(x.a-(x.b??0)))[0];
  if(drop)L.push(`트레이드 후 ${lab(drop.k)} 자리가 약해집니다(${drop.b}→${drop.a??'없음'}).`);
  if(up)L.push(`${lab(up.k)} 자리가 좋아집니다(${up.b??'없음'}→${up.a}).`);
  const young=gv.find(p=>p.age<=23&&(scoutReport(p).ofp||0)>=60); if(young)L.push(`잠재력이 큰 ${young.name}을(를) 내주는 것은 신중해야 합니다.`);
  const unk=gt.find(p=>scoutReport(p).cur==null); if(unk)L.push(`${unk.name}은(는) 우리 스카우트가 본 적이 없어 평가가 불확실합니다.`);
  return L.slice(0,3); }
function tradeHint(tid,give,get,cash){ // 상대가 무엇을 더 원할지 짐작(관계가 나쁘면 못 읽음)
  if(!give.length&&!get.length)return null; const t=team(tid); const e=evalTrade(tid,give,get,cash); const gap=e.need-e.gain; if(gap<=0)return null;
  if(t.rel<35)return {txt:'관계가 낮아 상대가 무엇을 원하는지 읽기 어렵습니다.'};
  const sd=1.2+Math.max(0,75-t.rel)/10;
  const add=domestic(G.user).filter(p=>!give.includes(p.id)&&!(p.joinY>G.year)).map(p=>({p,v:tval(t,p,'in')*.72+hn('th'+tid+G.year,p.id)*sd*.4})).filter(x=>x.v>=gap*.9).sort((a,b)=>a.v-b.v)[0];
  const drop=get.length>1?get.map(id=>({p:G.players[id],v:tval(t,G.players[id],'out')+hn('td'+tid+G.year,id)*sd*.4})).filter(x=>x.v>=gap*.9).sort((a,b)=>a.v-b.v)[0]:null;
  const cn=cashFor(t,gap+hn('tc'+tid+G.year,G.day)*sd*.3); return {add:add?add.p:null,drop:drop?drop.p:null,big:gap>12,cash:cn&&cn+(cash||0)<=3000?cn+(cash||0):null}; }

function draftPickOrder(){ // 드래프트 전: 지금 순위의 역순 1라운드
  const st=period()==='season'||period()==='post'?standingsNow():(G.history.length?G.history[G.history.length-1].order:standingsNow()); return [...st].reverse().map((o,i)=>({tid:o.tid,rd:1,no:i+1})); }
function mockPick(tid,pool){ const t=team(tid); let best=null,bs=-1e9;
  for(const id of pool){ const p=G.players[id]; const rp=scoutReport(p); const sc=(rp.ofp??rp.cur+6)+hn('mk'+tid+G.year,id)*(t.scoutSd+3)+(rp.cur-35)*(t.mode==='contend'?.5:.25); if(sc>bs){bs=sc;best=id;} } return best; }
function mockDraft(n){ // 우리 다음 순번 전까지(드래프트 전에는 1라운드) 다른 구단 지명 예상
  const d=G.draft; const live=d&&!d.done; const pool=new Set((live?d.cls:G.draftClass||[]).filter(id=>G.players[id]&&G.players[id].prospect)); const out=[];
  if(live){ let i=d.cur+(d.picks[d.cur].tid===G.user?1:0); for(;i<d.picks.length&&out.length<(n||12);i++){ const pk=d.picks[i]; if(pk.tid===G.user)break; const id=mockPick(pk.tid,pool); if(id==null)break; pool.delete(id); out.push({pk,id}); } }
  else { for(const pk of draftPickOrder()){ const id=mockPick(pk.tid,pool); if(id==null)break; pool.delete(id); out.push({pk,id,mine:pk.tid===G.user}); } }
  return out; }

function staffNotes(p){ // 선수 카드 상단 스태프 의견
  if(p.fdPool&&G.fd){ /* 창단 드래프트 후보: 스카우트는 툴만, 데이터팀은 기록만. 종합 판단은 하지 않는다 */ const d=fdData(p);
    return [{w:'스카우트',t:fdScoutLine(p)+'. 컨택·선구안·제구는 눈으로 판단하기 어려워 기록을 함께 보세요.'},{w:'데이터팀',t:d?`최근 ${d.ys}시즌 ${p.isP?'실점 억제':'타격 생산'}: 다른 후보 중 ${pctW(d.it[3][1])}(상위 ${100-d.it[3][1]}%).${d.small?' 표본이 적어 믿기 어렵습니다.':''}${d.luck?` ${d.luck[0]}(${d.luck[1]}).`:''}`:dataLv(G.user)<1?'분석원이 없어 의견이 없습니다.':'1군·2군 기록이 부족합니다.'}]; }
  const own=p.team===G.user&&!p.prospect; const rp=scoutReport(p); const L=[];
  L.push({w:'스카우트',t:(rp.role?`장래 ${rp.role}. `:'')+(rp.notes&&rp.notes[0]?rp.notes[0]:'')});
  { const sn=statNotes(p); if(sn[0])L.push({w:'전력분석',t:sn[0]}); }
  if(!own)return L.filter(x=>x.t);
  const l=p.l10||[]; if(l.length>=5){ if(p.isP){ const o=sum(l.map(x=>x[0])), er=sum(l.map(x=>x[1])); const era=o?er*27/o:0; L.push({w:'코치',t:era<=3?`최근 ${l.length}경기 평균자책점 ${era.toFixed(2)}로 공이 좋습니다.`:era>=6?`최근 ${l.length}경기 평균자책점 ${era.toFixed(2)}로 흔들리고 있습니다.`:`최근 ${l.length}경기 평균자책점 ${era.toFixed(2)}, 무난합니다.`}); }
    else { const ab=sum(l.map(x=>x[0])), hh=sum(l.map(x=>x[1])); const a=ab?hh/ab:0; L.push({w:'코치',t:a>=.33?`최근 ${l.length}경기 타율 ${fmt3(a)}로 감이 좋습니다.`:a<=.2?`최근 ${l.length}경기 타율 ${fmt3(a)}로 부진합니다.`:`최근 ${l.length}경기 타율 ${fmt3(a)}, 무난합니다.`}); } }
  if((p.fat||0)>=60)L.push({w:'트레이너',t:`피로가 ${Math.round(p.fat)}까지 쌓였습니다. 감독이 쉬게 할 가능성이 큽니다.`});
  else if(p.injOut>0)L.push({w:'의무팀',t:`${injNow(p)}(으)로 약 ${p.injOut}일 더 쉬어야 합니다. 예상 복귀 ${injRetTxt(p)}.`});
  else if(injFxNow(p).length){ const f=injFxText(p).find(x=>x.open); if(f)L.push({w:'의무팀',t:`${f.n} 이후 아직 몸이 완전하지 않습니다(${f.t}). 실전을 뛰면서 돌아옵니다.`}); }
  else if(p.injHist&&p.injHist.length>=3)L.push({w:'의무팀',t:`부상 이력이 ${p.injHist.length}번 있습니다. 관리가 필요합니다.`});
  if(!p.foreign){ const v=estVal(p); const left=p.faC?Math.max(1,p.yrs):null; L.push({w:'운영팀',t:(v>=4&&p.sal<5000?'연봉 대비 가치가 높습니다. ':v<0?'연봉 대비 활약이 부족하다는 평가입니다. ':'')+(left?`${ctText(p)}입니다.`:Math.max(0,faSvc(p)-p.svc)?`${ctText(p)}.`:'올해 FA 자격을 얻습니다.')}); }
  return L.filter(x=>x.t).slice(0,5); }

/* ===== 선수 이야기(커리어 연표) ===== */
function story(p,t,k){ if(!p)return; (p.story=p.story||[]).push({y:G.year,d:G.day,t,k:k||''}); if(p.story.length>60)p.story.splice(1,1); }
const MILE={hr:[100,200,300,400,500],h:[1000,1500,2000,2500],w:[100,150,200],sv:[100,200,300,400],so:[1000,1500,2000]};
const MILEK={hr:'홈런',h:'안타',w:'승',sv:'세이브',so:'탈삼진'};
function cumInit(p){ if(p.cum)return; const one=p.hist.filter(h=>h.lvl==='1군'); const c={h:0,hr:0,w:0,sv:0,so:0}; for(const h of one){ if(p.isP){ c.w+=h.w||0; c.sv+=h.sv||0; c.so+=h.so||0; } else { c.h+=h.h||0; c.hr+=h.hr||0; } } p.cum=c; p.fl=p.fl||{}; if(one.length)p.fl.deb=1; if(c.hr)p.fl.hr1=1; if(c.w)p.fl.w1=1; if(c.sv)p.fl.sv1=1; }
function storyGame(p,x,day,opp,dec){ // 1군 경기 하나가 끝난 뒤
  cumInit(p); const f=p.fl, c=p.cum; const vs=`${dmd(day)} vs ${tshort(opp)}`;
  if(!f.deb){ f.deb=1; story(p,`1군 데뷔 · ${vs}`,'debut'); }
  const add=(k,v)=>{ if(!v)return; const b=c[k]; c[k]+=v; for(const m of MILE[k]) if(b<m&&c[k]>=m){ story(p,`통산 ${m}${MILEK[k]} 달성 · ${vs}`,'mile'); try{ featAdd('mile',p,`통산 ${m}${MILEK[k]}`,{vs,maj:m>=({hr:400,h:2000,w:150,sv:300,so:2000})[k]}); }catch(e){} } };
  if(p.isP){ if(dec.w===p.id&&!f.w1){ f.w1=1; story(p,`1군 첫 승 · ${vs}`,'first'); } if(dec.sv===p.id&&!f.sv1){ f.sv1=1; story(p,`1군 첫 세이브 · ${vs}`,'first'); }
    add('w',dec.w===p.id?1:0); add('sv',dec.sv===p.id?1:0); add('so',x.so||0);
    if(x.outs>=27&&x.h===0)story(p,`노히트노런 · ${vs}`,'mile'); }
  else { if(x.hr&&!f.hr1){ f.hr1=1; story(p,`1군 첫 홈런 · ${vs}`,'first'); } if(x.hr>=3)story(p,`한 경기 ${x.hr}홈런 · ${vs}`,'mile'); if(x.h>=5&&(!f.h5||x.h>=6)){ f.h5=1; story(p,`한 경기 ${x.h}안타 · ${vs}`,'mile'); } add('h',x.h||0); add('hr',x.hr||0); try{ featBat(p,x,vs); }catch(e){} }
}
function storySeason(y){ // 시즌이 끝나면: 커리어 하이와 규정 이상 시즌
  for(const p of Object.values(G.players)){ if(p.team==null)continue; const h=seasonTotal(p,y,'1군'); if(!h)continue;
    const q=p.isP?h.outs>=300:h.pa>=300; if(!q)continue;
    const w=warOf(h,p); const prev=p.hist.filter(x=>x.lvl==='1군'&&x.y<y).map(x=>x.y); const best=[...new Set(prev)].map(yy=>warOf(seasonTotal(p,yy,'1군'),p));
    if(best.length&&w>Math.max(...best)+.3&&w>=2)story(p,`커리어 하이 시즌 · ${statLine(h,p)}`,'high'); } }

/* ===== 가을야구 확률(남은 일정 모의 진행) ===== */
let _poC={k:null};
function mulberry(a){ return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function playoffOdds(){
  if(period()!=='season')return null; const k=G.year+':'+G.day; if(_poC.k===k)return _poC.v;
  const rec=G.sea.rec; if(sum(G.teams.map(t=>rec[t.id].w+rec[t.id].l))/G.teams.length<20){ _poC={k,v:null}; return null; } /* 20경기 전에는 확률을 내지 않는다 */
  const str0=G.teams.map(t=>{ const r=rec[t.id]; return (r.w+(t.expW||.5)*60)/(r.w+r.l+60); });
  const rem=[]; for(const d in G.cal.sched){ if(+d>G.day)for(const m of G.cal.sched[d])rem.push(m); }
  const n=G.teams.length, N=400, top5=new Array(n).fill(0), first=new Array(n).fill(0), rnd=mulberry(G.day*7919+G.year);
  const w0=G.teams.map(t=>rec[t.id].w), l0=G.teams.map(t=>rec[t.id].l);
  for(let s=0;s<N;s++){ const w=w0.slice(), l=l0.slice(); const str=str0.map(x=>clamp(x+(rnd()+rnd()+rnd()-1.5)*.06,.25,.75)); /* 팀 실력 자체의 불확실성 */
    for(const [h,a] of rem){ const ph=str[h], pa=str[a]; const p=ph*(1-pa)/(ph*(1-pa)+pa*(1-ph))+.015; if(rnd()<p){w[h]++;l[a]++;} else {w[a]++;l[h]++;} }
    const ord=[...Array(n).keys()].sort((x,y)=>(w[y]/(w[y]+l[y]))-(w[x]/(w[x]+l[x]))||rnd()-.5);
    for(let i=0;i<5;i++)top5[ord[i]]++; first[ord[0]]++; }
  const v=G.teams.map(t=>({tid:t.id,ps:top5[t.id]/N,first:first[t.id]/N,str:str0[t.id]})); _poC={k,v}; return v; }

/* ===== 기록으로 보는 메모(능력치가 아니라 눈에 보이는 성적 기준) ===== */
const babipOf=h=>{ const d=(h.ab||0)-(h.so||0)-(h.hr||0); return d>0?(h.h-h.hr)/d:null; };
function amNotes(p){ const Y=p.amY; if(!Y||!Y.length)return []; const L=[];
  if(!p.isP){ const bk=Y.filter(x=>x.pa>=30).map(x=>x.so?x.bb/x.so:x.bb); const t=p.am; const tbk=t.so?t.bb/t.so:t.bb; const avg=t.ab?t.h/t.ab:0;
    if(bk.length>=2&&bk.every(v=>v>=.8))L.push(`학년마다 볼넷이 삼진만큼 많았습니다(볼삼비 ${tbk.toFixed(2)}). 선구안은 프로에 와서도 잘 변하지 않는 기록입니다.`);
    else if(bk.length>=2&&bk.every(v=>v<=.35))L.push(`학년마다 삼진이 볼넷의 3배 가까이 됩니다(볼삼비 ${tbk.toFixed(2)}). 프로 투수를 상대로 고전할 수 있습니다.`);
    if(avg>=.36&&tbk<.5)L.push('타율은 높지만 볼삼비가 낮아, 이 타율이 프로에서 유지될지는 의문입니다.');
    if(Y.length>=3){ const a=Y[Y.length-1], b=Y[Y.length-2]; const o=x=>bRate(x).ops; if(o(a)-o(b)>=.15)L.push('마지막 학년에 기록이 크게 뛰었습니다. 성장인지 한 해 반짝인지 지켜봐야 합니다.'); } }
  else { const t=p.am; const k9=t.outs?t.so*27/t.outs:0, b9=t.outs?t.bb*27/t.outs:0; const b9s=Y.filter(x=>x.outs>=45).map(x=>x.bb*27/x.outs); const era=t.outs?(t.er||0)*27/t.outs:0;
    if(b9s.length>=2&&b9s.every(v=>v<=3))L.push(`학년 내내 볼넷이 적었습니다(9이닝당 ${b9.toFixed(1)}개). 제구는 프로에서도 비슷하게 이어지는 편입니다.`);
    else if(b9s.length>=2&&b9s.every(v=>v>=5))L.push(`학년 내내 볼넷이 많았습니다(9이닝당 ${b9.toFixed(1)}개). 제구 불안이 꾸준합니다.`);
    if(k9>=10)L.push(`탈삼진이 9이닝당 ${k9.toFixed(1)}개로 많습니다. 구위가 통한다는 신호입니다.`);
    if(era<=2&&k9<6)L.push('평균자책점에 비해 탈삼진이 적습니다. 수비나 운의 도움을 받았을 수 있습니다.'); }
  return L.slice(0,2); }
function statNotes(p){ // 프로 기록에서 읽히는 신호
  const h=seasonTotal(p,G.year,'1군')||seasonTotal(p,G.year-1,'1군'); if(!h)return [];
  const L=[]; const yy=h.y===G.year?'올해':'지난해';
  if(!p.isP&&h.pa>=150){ const b=babipOf(h); const bk=h.so?h.bb/h.so:h.bb;
    if(b!=null&&b>=.37)L.push(`${yy} 인플레이 타구 타율(BABIP)이 ${fmt3(b)}로 높습니다. 운이 섞여 타율이 내려올 수 있습니다.`);
    else if(b!=null&&b<=.25)L.push(`${yy} BABIP ${fmt3(b)}로 운이 없었습니다. 타율은 반등할 여지가 있습니다.`);
    if(bk>=.9)L.push(`볼삼비 ${bk.toFixed(2)}. 선구안이 좋아 슬럼프가 길지 않은 유형입니다.`); else if(bk<=.3)L.push(`볼삼비 ${bk.toFixed(2)}. 삼진이 많아 기복이 클 수 있습니다.`); }
  if(p.isP&&h.outs>=120){ const k9=h.so*27/h.outs, b9=h.bb*27/h.outs, era=h.er*27/h.outs;
    if(era<=3.2&&k9-b9<4)L.push(`${yy} 평균자책점(${era.toFixed(2)})에 비해 탈삼진·볼넷 차이가 작습니다. 다음 시즌 평균자책점이 오를 수 있습니다.`);
    else if(era>=5&&k9-b9>=5)L.push(`${yy} 평균자책점(${era.toFixed(2)})은 나쁘지만 탈삼진·볼넷 내용은 좋습니다. 반등 후보입니다.`); }
  return L; }

