/* ---------- 선수단 탭: 야구장 배치도 ---------- */
const FPOS={CF:[180,40],LF:[62,92],RF:[298,92],SS:[118,152],'2B':[242,152],'3B':[62,212],'1B':[298,212],P:[180,240],C:[180,298],DH:[60,298]};
const fname=p=>{ let n=p.name.includes(' ')?p.name.split(' ').pop():p.name; return n.length>4?n.slice(0,4):n; };
/* 배치도에서 고른 자리에 쓸 수 있는 선수들: 능력과 연봉을 먼저 */
function fposList(tid,pos){ if(!pos)return '';
  const d=depth(tid); const own=tid===G.user; const ps=playersOf(tid).filter(p=>own||!scoutReport(p).unseen||publicP(p)); const startIds=new Set(Object.values(d.ln).map(p=>p.id)); const y=G.year;
  const where=p=>!healthy(p)?`<span class="pill bad">${outTxt(p)}</span>`:isAway(p)?'<span class="pill">군 복무</span>':startIds.has(p.id)?`<span class="pill good">${d.ln[pos]&&d.ln[pos].id===p.id?'이 자리 주전':'다른 자리 주전'}</span>`:d.sp.includes(p)?`<span class="pill good">${d.sp.indexOf(p)+1}선발</span>`:d.pen.includes(p)?`<span class="pill">${d.pen.indexOf(p)===0?'마무리':'불펜'}</span>`:(entryOn()&&!p.e1)||d.futB.includes(p)||d.futP.includes(p)?'<span class="pill">2군</span>':'<span class="pill">벤치</span>';
  const st=p=>{ const h0=seasonTotal(p,y,'1군'); const h=(p.isP?h0&&h0.outs:h0&&h0.pa)?h0:seasonTotal(p,y,'퓨처스'); if(!h)return '기록 없음'; const f=h===h0?'':'2군 '; return p.isP?(h.outs?`${f}ERA ${pRate(h).era.toFixed(2)} · ${ipStr(h.outs)}이닝`:'-'):(h.pa?`${f}${fmt3(bRate(h).avg)} · OPS ${fmt3(bRate(h).ops)} · ${h.hr}홈런`:'-'); };
  const row=(p,extra)=>`<button class="fpl-r" data-a="player" data-v="${p.id}">${avImg(p)}<span class="fpl-m"><b>${esc(p.name)}</b><i>${p.isP?`${p.th}투 · 체력 ${Math.round(p.r.sta)}`:`${POSS[p.pos]}${subsOf(p).length?' · '+subsOf(p).map(k=>POSS[k]).join('·'):''}`} · ${p.age}세 · ${st(p)}</i></span><span class="fpl-r2">${where(p)}${extra||''}</span><span class="fpl-o">${rchip(Math.round(scoutReport(p).cur))}<em>${money(p.sal)}</em></span></button>`;
  let L, title;
  if(pos==='P'){ const pit=ps.filter(p=>p.isP); const ord=p=>d.sp.includes(p)?d.sp.indexOf(p):d.pen.includes(p)?10+d.pen.indexOf(p):100-ovr(p); L=pit.sort((a,b)=>ord(a)-ord(b)); title=`투수 ${L.length}명`; }
  else { L=ps.filter(p=>!p.isP&&(pos==='DH'||p.pos===pos||(subsOf(p)||[]).includes(pos))).sort((a,b)=>posScore(b,pos)-posScore(a,pos)); title=`${POSK[pos]} 가능 ${L.length}명`; }
  const [fx,fy]=FPOS[pos]||[180,160]; const up=fy>200; const pos2=up?`bottom:${((330-(fy-26))/330*100).toFixed(1)}%`:`top:${((fy+26)/330*100).toFixed(1)}%`;
  return `<div class="fdd ${up?'up':''}" style="${pos2};--cx:${(fx/360*100).toFixed(1)}%"><div class="fdd-h"><b>${title}</b><button class="x" data-a="fpos" data-v="" aria-label="닫기">×</button></div><div class="fdd-l">${L.map(p=>row(p,!p.isP&&pos!=='DH'?`<span class="small muted">수비 ${Math.round(defAt(p,pos))}</span>`:'')).join('')||'<p class="small muted">선수가 없습니다.</p>'}</div></div>`; }
function fieldSVG(tid,interactive,inline){
  const d=depth(tid); const ps=playersOf(tid); const order=orderList(d.start,tid); const t=team(tid);
  const next=d.sp.length?d.sp[(t.rot||0)%d.sp.length]:null;
  const node=(pos)=>{ const [x,y]=FPOS[pos];
    let name='빈자리',stat='',cnt=0,face='',no=0,off=false,ov=null;
    if(pos==='P'){ const p=next; name=p?fname(p):'선발 미정'; face=p?faceSVG(p):''; ov=p?scoutReport(p).cur:null; const h0=p?seasonTotal(p,G.year,'1군'):null; const h=h0&&h0.outs?h0:p?seasonTotal(p,G.year-1,'1군'):null; stat=h&&h.outs?`${h===h0?'':String(G.year-1).slice(2)+'년 '}ERA ${pRate(h).era.toFixed(2)}`:'기록 없음'; }
    else { const p=d.ln[pos]; if(p){ name=fname(p); face=faceSVG(p); ov=scoutReport(p).cur; no=order.indexOf(p)+1; off=pos!=='DH'&&p.pos!==pos; const h0=seasonTotal(p,G.year,'1군'); const h=h0&&h0.pa?h0:seasonTotal(p,G.year-1,'1군'); stat=h&&h.pa?`${h===h0?'':String(G.year-1).slice(2)+'년 '}${fmt3(bRate(h).avg)} ${h.hr}홈런`:'기록 없음'; }
      cnt=pos==='DH'?0:ps.filter(q=>!q.isP&&q.pos===pos&&(!p||q.id!==p.id)).length; }
    const da=inline?`data-a="fpos" data-v="${pos}"`:interactive?`data-a="posSheet" data-v="${pos}"`:`data-a="tposSheet" data-v="${tid}:${pos}"`;
    const bx=x-59, by=y-24;
    const salP=pos==='P'?next:d.ln[pos]; if(salP)stat=`연봉 ${money(salP.sal)}`;
    return `<g class="pos${off?' ov':''}${inline&&UI.fpos===pos?' sel':''}" ${da} tabindex="0" role="button" aria-label="${POSK[pos]||'투수'} ${esc(name)}">
      <rect class="box" x="${bx}" y="${by}" width="118" height="48" rx="8"></rect>
      ${face?`<rect x="${bx+4}" y="${by+5}" width="38" height="38" rx="4" fill="#0a0f13"></rect><image href="${face}" x="${bx+4}" y="${by+5}" width="38" height="38"></image>`:''}
      <text class="pl" x="${bx+46}" y="${by+13}">${pos==='P'?'다음 선발':POSS[pos]}${off?' *':''}</text>
      <text class="pn" x="${bx+46}" y="${by+28}">${esc(name)}</text>
      <text class="ps" x="${bx+46}" y="${by+40}">${stat}</text>
      ${ov!=null?`<rect x="${bx+90}" y="${by+17}" width="24" height="16" rx="2" fill="${rcol(ov)}"></rect><text class="ovt" x="${bx+102}" y="${by+29}" text-anchor="middle">${dv(ov)}</text>`:''}
      ${salP&&ov!=null?(()=>{ const L=condLv(salP); return `<g transform="translate(${bx+102} ${by+41}) rotate(${L.deg})" style="color:${L.c}"><title>컨디션 ${L.l}</title><path d="M-4.5 0h7M0.5 -3.5 4 0 0.5 3.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></g>`; })():''}
      ${no?`<circle class="ord" cx="${bx+4}" cy="${by+5}" r="8"></circle><text class="ordt" x="${bx+4}" y="${by+8.5}" text-anchor="middle">${no}</text>`:''}
      ${cnt?`<circle class="bd" cx="${bx+114}" cy="${by+4}" r="8"></circle><text class="bdt" x="${bx+114}" y="${by+7.5}" text-anchor="middle">+${cnt}</text>`:''}
    </g>`; };
  return `<svg class="field" viewBox="-14 -10 388 350" role="group" aria-label="포지션 배치도">
    <path d="M180 322 L14 156 A234 234 0 0 1 346 156 Z" fill="var(--grass)"></path>
    <path d="M180 312 L272 220 L180 128 L88 220 Z" fill="var(--dirt)"></path>
    <path d="M180 290 L250 220 L180 150 L110 220 Z" fill="var(--grass2)"></path>
    <circle cx="180" cy="220" r="11" fill="var(--dirt)"></circle>
    ${[[180,302],[262,220],[180,138],[98,220]].map(([x,y])=>`<rect x="${x-5}" y="${y-5}" width="10" height="10" transform="rotate(45 ${x} ${y})" fill="var(--chalk)"></rect>`).join('')}
    ${inline&&UI.fpos?'<rect x="0" y="0" width="360" height="330" fill="transparent" data-a="fpos" data-v=""></rect>':''}${Object.keys(FPOS).map(node).join('')}
  </svg>`;
}
function rosterView(){
  const tid=UI.rosterTeam??G.user; const own=tid===G.user; const t=team(tid);
  const d=depth(tid); const rv=UI.rview||'table';
  const vis0=p=>tid===G.user||!scoutReport(p).unseen||publicP(p);
  /* 탭 정리: 같은 선수를 필터만 바꿔 보여 주던 탭을 합친다. 선수 명단(야수·투수 전환) / 전력 구성(배치도·한눈에·포지션 진단) / 병역 */
  { UI.it=UI.it||{}; const r=UI.it.roster; if(r==='bat'||r==='pit'){ UI.seg=r; UI.it.roster='list'; } else if(r==='field'||r==='glance'||r==='diag'){ UI.it.rdepth=r; UI.it.roster='depth'; } else if(r==='cmp')UI.it.roster='list'; }
  const RT=[['list','선수 명단'],['depth','전력 구성'],...(tid===G.user?[['mil','병역']]:[])];
  const it=inTabs('roster',RT,'list'); const seg=UI.seg==='pit'?'pit':'bat';
  const rookies=own?Object.values(G.players).filter(p=>p.team===G.user&&p.joinY>G.year):[];
  const pf=(UI.rpos=UI.rpos||{bat:'all',pit:'all'})[seg];
  const cv=own?null:coverOf(tid);
  const vis=p=>own||!scoutReport(p).unseen||publicP(p);
  const hidden=own?0:playersOf(tid).filter(p=>!vis(p)).length;
  const sel=`<select data-a="rosterTeam" aria-label="구단 선택">${G.teams.map(x=>`<option value="${x.id}" ${x.id===tid?'selected':''}>${x.id===G.user?'우리 구단':esc(x.city+' '+x.nick)}${x.id!==G.user&&!coverOf(x.id).sc?' (스카우트 없음)':''}</option>`).join('')}</select>`;
  const cover=own?'':`<section class="card covc"><div class="row between"><div class="row">${badge(tid,32)}<div><b>${tname(tid)}</b><div class="small muted">${t.mode==='contend'?'우승 경쟁':'리빌딩'} · 구단주 ${OWNER[t.owner].label} · 단장 관계 ${t.rel}</div></div></div><button class="btn small" data-a="tpartnerGo" data-v="${tid}">트레이드 협상</button></div>
    <p class="small">${cv.sc?`<b>${esc(cv.sc.name)} 스카우트</b>(${cv.reg} · 능력 ${'★'.repeat(cv.sc.skill)})가 담당합니다. ${cv.sc.skill>=3?'1군과 2군 선수까지 현재 능력을 평가합니다.':'1군 선수만 평가합니다. 2군까지 보려면 능력 3 이상 스카우트가 필요합니다.'}`:`<b>${cv.reg}</b> 지역을 맡은 스카우트가 없습니다. 1군 기록만 볼 수 있고 능력 평가는 없습니다.`} 다른 구단 선수의 잠재력은 알 수 없습니다.${hidden?` 파악하지 못한 2군 선수 ${hidden}명은 명단에서 빠졌습니다.`:''}</p></section>`;
  const eN=playersOf(tid).filter(p=>p.e1).length;
  const head=(own?trimCard():'')+`<div class="row between wrapr"><div class="row" style="flex:1;min-width:0">${sel}</div><div class="row small"><span class="chipn">1군 <b>${entryOn()?eN:'-'}</b>/${entryLimit()}</span><span class="chipn">정식 <b>${rosterN(tid)}</b>/${ROSTER_MAX}</span><span class="chipn">육성 <b>${ysN(tid)}</b>/${YS_MAX}</span></div></div>`+cover;
  const fieldC=`<section class="card"><div class="row between"><h2 class="sec">포지션 배치도</h2><span class="small muted">${own?'':'현재 능력 기준'}</span></div><div class="fwrap">${fieldSVG(tid,own,true)}${fposList(tid,UI.fpos||null)}</div><p class="small keep fpl-h">자리를 누르면 그 자리에 쓸 수 있는 선수가 펼쳐집니다. 투수 자리를 누르면 투수 전원이 나옵니다.</p><p class="small muted">오른쪽 색 숫자는 현재 능력(종합)입니다. 원 숫자는 타순, +는 같은 포지션 선수 수, *는 본래 포지션이 아닌 자리입니다.${own?'':' 평가가 없는 선수는 숫자가 비어 있습니다.'}</p></section>`;
  if(it.cur==='depth'){ const dt=inTabs('rdepth',[['field','배치도'],['glance','한눈에'],...(own?[['diag','포지션 진단']]:[])],'field'); return head+it.bar+dt.bar+(dt.cur==='glance'?glanceView(tid):dt.cur==='diag'?posDiag('bat')+posDiag('pit'):fieldC); }
  if(it.cur==='glance')return head+it.bar+glanceView(tid);
  if(it.cur==='mil'&&tid===G.user)return head+it.bar+milView();
  if(it.cur==='lineup')return head+it.bar+lineupCard(tid);
  if(it.cur==='staff')return head+it.bar+staffCard(tid);
  if(it.cur==='field')return head+it.bar+fieldC;
  if(it.cur==='diag')return head+it.bar+posDiag('bat')+posDiag('pit');
  const posOf={}; for(const k in d.ln)posOf[d.ln[k].id]=k;
  let groups;
  if(seg==='bat'){
    const lineup=orderList(d.start,tid);
    const posf=p=>posOf[p.id]?POSS[posOf[p.id]]+(posOf[p.id]!==p.pos&&posOf[p.id]!=='DH'?`(${POSS[p.pos]})`:''):POSS[p.pos];
    groups=[['주전 (타순)',lineup,posf],[entryOn()?'1군 백업':'백업',d.bench],['2군',d.futB.filter(p=>!p.ys)],['육성선수',d.futB.filter(p=>p.ys)],['부상·출장 정지',d.inj.filter(p=>!p.isP)],['군 복무',awayOf(tid).filter(p=>!p.isP&&p.mil&&p.mil.until)],['입단 예정',rookies.filter(p=>!p.isP)]];
  } else {
    const role=arr=>p=>arr===d.pen?(arr.indexOf(p)===0?'마무리':arr.indexOf(p)<4?'필승조':'추격조'):arr===d.sp?(arr.indexOf(p)+1)+'선발':posLabel(p);
    groups=[['선발 로테이션',d.sp,role(d.sp)],[entryOn()?'1군 불펜':'불펜',d.pen,role(d.pen)],['2군',d.futP.filter(p=>!p.ys)],['육성선수',d.futP.filter(p=>p.ys)],['부상·출장 정지',d.inj.filter(p=>p.isP)],['군 복무',awayOf(tid).filter(p=>p.isP&&p.mil&&p.mil.until)],['입단 예정',rookies.filter(p=>p.isP)]];
  }
  const keep=p=>vis(p)&&(pf==='all'||(seg==='bat'?p.pos===pf:(pf==='SP'?isSPr(p):!isSPr(p))));
  groups=groups.map(([g,arr,f])=>[g,arr.filter(keep),f]);
  const chipsP=seg==='bat'?[['all','전체'],...['C','1B','2B','3B','SS','LF','CF','RF'].map(k=>[k,POSS[k]])]:[['all','전체'],['SP','선발형'],['RP','불펜형']];
  const filt=`<div class="chips">${chipsP.map(([k,l])=>`<button data-a="rpos" data-v="${k}" class="${pf===k?'on':''}">${l}${k!=='all'?` <i class="cnt">${playersOf(tid).filter(p=>vis(p)&&(seg==='bat'?!p.isP&&p.pos===k:p.isP&&(k==='SP'?isSPr(p):!isSPr(p)))).length}</i>`:''}</button>`).join('')}</div>`;
  UI._own=own;
  const body=rv==='card'?sqCards(groups):rosterTable(groups,seg==='pit');
  const segT=`<div class="seg rseg"><button data-a="seg" data-v="bat" class="${seg==='bat'?'on':''}">야수 ${playersOf(tid).filter(p=>!p.isP&&vis0(p)).length}</button><button data-a="seg" data-v="pit" class="${seg==='pit'?'on':''}">투수 ${playersOf(tid).filter(p=>p.isP&&vis0(p)).length}</button></div>`;
  return head+it.bar+segT+`<section class="card"><div class="row between"><h2 class="sec">${seg==='bat'?'야수':'투수'} 명단</h2><div class="row"><span class="small muted">${statBasis()} · 이름 옆 화살표는 컨디션(↑최상 ↗좋음 →보통 ↘나쁨 ↓최악: 시즌 폼·기분·피로)</span><div class="seg sm"><button data-a="rview" data-v="table" class="${rv==='table'?'on':''}">목록</button><button data-a="rview" data-v="card" class="${rv==='card'?'on':''}">상세</button></div></div></div>${filt}${body}
    <p class="small muted">열 제목을 누르면 그 기준으로 정렬합니다(한 번 더 누르면 반대로). 현재는 정확한 능력, 잠재력은 코치진·스카우트 평가입니다.${own?' 기분 점은 선수 만족도, 막대는 피로입니다.':' 다른 구단 선수의 잠재력·기분·피로는 알 수 없습니다.'} 주전과 타순은 감독이 정합니다.</p></section>`;
}
function statY(){ const per=period(); return per==='season'||per==='post'||(G.cal&&G.cal.y===G.year&&G.day>G.cal.end)?G.year:G.year-1; }
function statBasis(){ return statY()===G.year&&period()!=='off'?`${G.year} 1군 성적 (F 표시는 2군 기록)`:`${statY()} 성적 기준`; }
const RCOL_B=[['g','경기'],['pa','타석'],['avg','타율'],['obp','출루율'],['slg','장타율'],['ops','OPS'],['hr','홈런'],['rbi','타점'],['sb','도루'],['bb','볼넷'],['so','삼진'],['bbk','볼삼비'],['war','WAR']];
const RCOL_P=[['g','경기'],['gs','선발'],['ip','이닝'],['era','ERA'],['whip','WHIP'],['w','승'],['l','패'],['sv','세'],['hld','홀'],['so','탈삼진'],['bb','볼넷'],['k9','K/9'],['bb9','BB/9'],['war','WAR']];
function rline(p){ const y=statY(); return seasonTotal(p,y,'1군')||seasonTotal(p,y,'퓨처스'); }
function rstat(p,k){ const h=rline(p); if(!h)return null;
  if(k==='war')return wOf(h,p);
  if(p.isP){ const r=pRate(h); return {g:h.g||0,gs:h.gs||0,ip:h.outs,era:h.outs?r.era:null,whip:h.outs?r.whip:null,w:h.w||0,l:h.l||0,sv:h.sv||0,hld:h.hld||0,so:h.so,bb:h.bb,k9:h.outs?r.k9:null,bb9:h.outs?r.bb9:null,h:h.h||0,hra:h.hr||0,fip:h.outs?(13*(h.hr||0)+3*h.bb-2*h.so)/(h.outs/3)+3.2:null}[k]; }
  const r=bRate(h); return {g:h.g||0,pa:h.pa,avg:h.pa?r.avg:null,obp:h.pa?r.obp:null,slg:h.pa?r.slg:null,ops:h.pa?r.ops:null,hr:h.hr,rbi:h.rbi,sb:h.sb,bb:h.bb,so:h.so,bbk:h.so?h.bb/h.so:(h.bb?9:null),h:h.h||0,d:h.d||0,r:h.r||0,cs:h.cs||0}[k]; }
function rfmt(k,v,p){ if(v==null)return '-';
  if(['avg','obp','slg','ops'].includes(k)){ const s=fmt3(v); if(k==='ops'){ const c=v>=.9?'var(--good)':v>=.78?'var(--r50)':v<.62?'var(--bad)':'inherit'; return `<b style="color:${c}">${s}</b>`; } return s; }
  if(k==='era'){ const c=v<=3.3?'var(--good)':v<=4.2?'var(--r50)':v>=5.8?'var(--bad)':'inherit'; return `<b style="color:${c}">${v.toFixed(2)}</b>`; }
  if(k==='bbk')return `<span style="color:${v>=.8?'var(--good)':v<=.3?'var(--bad)':'inherit'}">${v.toFixed(2)}</span>`; if(k==='k9'||k==='bb9')return v.toFixed(1);
  if(k==='whip'||k==='fip')return v.toFixed(2); if(k==='ip')return ipStr(v); if(k==='war')return `<b style="color:${v>=3?'var(--good)':v<0?'var(--bad)':'inherit'}">${v.toFixed(1)}</b>`; return v; }
/* ===== 선수 표 열 설정: 사용자가 보이는 열과 순서를 고른다(브라우저에 저장) ===== */
const RCOL_X_B=[['h','안타'],['d','2루타'],['r','득점'],['cs','도루자']], RCOL_X_P=[['h','피안타'],['hra','피홈런'],['fip','FIP'],['arm','팔 부하']];
const RBASE=[['cur','현재'],['sal','연봉'],['pos','포지션'],['age','나이'],['fut','잠재력'],['mor','기분'],['fat','피로']];
function rcolAll(pit){ return RBASE.map(([k,l])=>[k,k==='pos'&&pit?'역할':l]).concat(pit?RCOL_P:RCOL_B,pit?RCOL_X_P:RCOL_X_B,[['ct','계약'],['org','입단'],['inj','부상']]); }
function rcolDef(pit){ return RBASE.map(x=>x[0]).concat((pit?RCOL_P:RCOL_B).map(x=>x[0]),UI._own?['ct','org']:[]); }
function rcolLoad(){ if(UI.rcols)return UI.rcols; try{ UI.rcols=JSON.parse(localStorage.getItem('danjang-rcols')||'null')||{}; }catch(e){ UI.rcols={}; } return UI.rcols; }
function rcolSave(){ try{ localStorage.setItem('danjang-rcols',JSON.stringify(UI.rcols||{})); }catch(e){} }
function rcolKeys(pit){ const c=rcolLoad()[pit?'pit':'bat']; const all=new Set(rcolAll(pit).map(x=>x[0])); const L=(c&&c.length?c:rcolDef(pit)).filter(k=>all.has(k)); return UI._own?L:L.filter(k=>!['mor','fat','ct','org'].includes(k)||k==='mor'||k==='fat'); }
function rcolPanel(pit){ const on=rcolKeys(pit); const all=rcolAll(pit); const lab=k=>(all.find(x=>x[0]===k)||[k,k])[1];
  const off=all.filter(x=>!on.includes(x[0]));
  return `<div class="rcp"><div class="row between"><b class="small">보이는 열 · 순서</b><span class="row"><button class="tc-i" data-a="rcolReset">기본값</button><button class="tc-i" data-a="rcolCfg">닫기</button></span></div>
    <div class="rcp-on">${on.map((k,i)=>`<span class="rcp-c"><button class="rcp-m" data-a="rcolMv" data-v="${k}:-1" ${i?'':'disabled'} aria-label="${lab(k)} 앞으로">◀</button><b>${lab(k)}</b><button class="rcp-m" data-a="rcolMv" data-v="${k}:1" ${i<on.length-1?'':'disabled'} aria-label="${lab(k)} 뒤로">▶</button><button class="rcp-x" data-a="rcolTg" data-v="${k}" aria-label="${lab(k)} 숨기기">×</button></span>`).join('')}</div>
    ${off.length?`<div class="rcp-off"><span class="small muted">숨긴 열(누르면 맨 뒤에 추가)</span>${off.map(([k,l])=>`<button class="chipn" data-a="rcolTg" data-v="${k}">+ ${l}</button>`).join('')}</div>`:''}</div>`; }
function rosterTable(groups,pit){
  const statL=(pit?RCOL_P:RCOL_B).concat(pit?RCOL_X_P:RCOL_X_B); const rs=UI.rs||{}; const sk=rs[pit?'pit':'bat']; const keys=rcolKeys(pit); const all=rcolAll(pit); const lab=k=>(all.find(x=>x[0]===k)||[k,k])[1];
  const th=(k,l)=>`<th data-a="rsort" data-v="${k}" class="sortable${sk&&sk.k===k?' on':''}">${l}${sk&&sk.k===k?(sk.dir<0?' ▼':' ▲'):''}</th>`;
  const head=`<tr>${th('name','선수')}${keys.map(k=>['ct','org'].includes(k)?`<th>${lab(k)}</th>`:th(k,lab(k))).join('')}</tr>`;
  const row=(p,pos,grp)=>{ const rp=scoutReport(p); const m=p.mor??60; const h=rline(p); const fut=h&&h.lvl==='퓨처스'; const mine=p.team===G.user;
    const tags=[p.injOut>0||p.susp>G.day?`<span class="pill bad">${outTxt(p)}</span>`:'',p.foreign?'<span class="pill">외국인</span>':'',isRookie(p)?'<span class="pill acc">신인</span>':''].join('');
    const td=k=>{ switch(k){ case 'cur':return `<td class="ovc"><span class="ovw">${rchip(rp.cur)}${condChip(p)}</span></td>`; case 'sal':return `<td class="num">${money(p.sal)}</td>`;
      case 'pos':return `<td>${grp?`<span class="muted">${grp}</span> `:''}${pos||posLabel(p)}${!p.isP&&subsOf(p).length?` <i class="f">${subsOf(p).map(k=>POSS[k]).join('·')}</i>`:''}</td>`; case 'age':return `<td>${p.age}</td>`; case 'fut':return `<td>${rchip(rp.ofp)}</td>`;
      case 'mor':return `<td>${mine?`<span class="mood" style="--c:${m>=65?'var(--good)':m>=45?'var(--r50)':m>=30?'var(--warn)':'var(--bad)'}" title="${moodLabel(m)}"></span>`:'-'}</td>`; case 'fat':return `<td>${mine?fatBar(p):'-'}</td>`; case 'arm':{ const r=armRatio(p), cd=consecDays(p,G.day+1); return `<td class="num ${r>=1.3?'bad':r>=1.1?'warn':''}" title="${esc(loadText(p))}">${Math.round(r*100)}%${cd>=2?` <i class="f">${cd}연투</i>`:''}</td>`; }
      case 'inj':return `<td class="small">${p.injOut>0?`${p.injOut}일 · ${dmd(G.day+p.injOut)} 복귀`:'-'}</td>`; case 'ct':return `<td class="small">${esc(tContract(p))}</td>`; case 'org':return `<td class="small"><span class="org">${esc(originOf(p))}</span></td>`;
      default:return `<td>${rfmt(k,rstat(p,k),p)}${fut&&k===(pit?'era':'ops')?' <i class="f">F</i>':''}</td>`; } };
    return `<tr class="click${fut?' fut':''}" data-a="player" data-v="${p.id}"><td><span class="pn">${avImg(p)}<span>${esc(p.name)} ${tags}</span></span></td>${keys.map(td).join('')}</tr>`; };
  const n=keys.length+1;
  const cfg=`<div class="row between rcp-bar">${UI._own?rviewBar(pit):'<span></span>'}<button class="tc-i${UI.rcolOpen?' on':''}" data-a="rcolCfg">열 설정</button></div>${UI.rcolOpen?rcolPanel(pit):''}`;
  if(!sk){ return cfg+`<div class="tw"><table class="sqt rt"><thead>${head}</thead><tbody>${groups.filter(g=>g[1].length).map(([g,arr,posf])=>`<tr class="grp"><td colspan="${n}">${g} · ${arr.length}명</td></tr>`+arr.map(p=>row(p,posf?posf(p):null)).join('')).join('')}</tbody></table></div>`; }
  const allR=[]; for(const [g,arr,posf] of groups)for(const p of arr)allR.push({p,g,pos:posf?posf(p):null});
  const rpC=new Map(); const rpv=p=>{ if(!rpC.has(p.id))rpC.set(p.id,scoutReport(p)); return rpC.get(p.id); };
  const val=x=>{ const p=x.p; switch(sk.k){ case 'name':return p.name; case 'pos':return x.pos||posLabel(p); case 'age':return p.age; case 'cur':return rpv(p).cur; case 'fut':return rpv(p).ofp??0; case 'mor':return p.mor??60; case 'fat':return p.fat||0; case 'arm':return armRatio(p); case 'sal':return p.sal; case 'inj':return p.injOut||0; default:{ const v=rstat(p,sk.k); return v==null?null:v; } } };
  const asc=['era','whip','l','bb9','fip','hra'].includes(sk.k)&&pit;
  allR.sort((a,b)=>{ const va=val(a),vb=val(b); if(va==null&&vb==null)return 0; if(va==null)return 1; if(vb==null)return -1; const c=typeof va==='string'?va.localeCompare(vb):va-vb; let s=sk.dir<0?-c:c; if(asc)s=-s; return s; });
  return cfg+`<div class="row between"><span class="small muted">${allR.length}명 · ${sk.k==='name'?'선수':lab(sk.k)} 기준 정렬</span><button class="tc-i" data-a="rsort" data-v="">기본 배치로</button></div>
    <div class="tw"><table class="sqt rt"><thead>${head}</thead><tbody>${allR.map(x=>row(x.p,x.pos,x.g.split(' ')[0])).join('')}</tbody></table></div>`;
}
function posDiag(seg){
  const all=G.teams.map(t=>({t:t.id,d:depth(t.id)}));
  const rankOf=f=>{ const vs=all.map(x=>({t:x.t,v:f(x.d)})).sort((a,b)=>b.v-a.v); return vs.findIndex(x=>x.t===G.user)+1; };
  const rc=k=>k<=3?'var(--good)':k<=7?'var(--warn)':'var(--bad)';
  const me=all.find(x=>x.t===G.user).d; const ps=playersOf(G.user);
  let cells;
  if(seg==='bat'){
    cells=['C','1B','2B','3B','SS','LF','CF','RF','DH'].map(pos=>{ const p=me.ln[pos]; const rk=rankOf(d=>d.ln[pos]?posScore(d.ln[pos],pos):0);
      const bk=pos==='DH'?0:ps.filter(q=>!q.isP&&q.pos===pos&&(!p||q.id!==p.id)).length; const h=p?curLine(p):null; const rp=p?scoutReport(p):null;
      return `<button class="dg" data-a="posSheet" data-v="${pos}" style="--rc:${rc(rk)}"><span class="dg-h"><b>${POSS[pos]}</b><i>리그 ${rk}위</i></span><span class="dg-n">${p?esc(p.name):'빈자리'}</span><span class="dg-s">${rp?rchip(rp.cur):''} ${h&&h.pa?'OPS '+fmt3(bRate(h).ops):''}</span><span class="dg-b ${pos!=='DH'&&bk===0?'warn':''}">${pos==='DH'?'타격 전담':bk?`백업 ${bk}명`:'백업 없음'}</span></button>`; });
  } else {
    const spR=rankOf(d=>avg(d.sp.slice(0,5).map(spV))), rpR=rankOf(d=>avg(d.pen.slice(0,5).map(penV))), clR=rankOf(d=>d.pen[0]?penV(d.pen[0]):0);
    const era=arr=>{ const hs=arr.map(curLine).filter(h=>h&&h.outs); const o=sum(hs.map(h=>h.outs)); return o?(sum(hs.map(h=>h.er))*27/o).toFixed(2):'-'; };
    const cell=(l,rk,n,s,b)=>`<div class="dg" style="--rc:${rc(rk)}"><span class="dg-h"><b>${l}</b><i>리그 ${rk}위</i></span><span class="dg-n">${n}</span><span class="dg-s">${s}</span><span class="dg-b">${b}</span></div>`;
    cells=[cell('선발진',spR,`${me.sp.length}명 로테이션`,`ERA ${era(me.sp)}`,`2군 선발형 ${me.futP.filter(isSP).length}명`),
      cell('불펜',rpR,`${me.pen.length}명`,`ERA ${era(me.pen)}`,`필승조 ${me.pen.slice(1,4).map(p=>esc(p.name)).join(', ')}`),
      cell('마무리',clR,me.pen[0]?esc(me.pen[0].name):'없음',me.pen[0]?`${rchip(scoutReport(me.pen[0]).cur)} ${(curLine(me.pen[0])||{}).sv||0}세이브`:'',' ')];
  }
  return `<section class="card"><div class="row between"><h2 class="sec">${seg==='bat'?'야수':'투수'} 포지션 진단</h2><span class="small muted">주전 기준 10개 구단 중 순위 · 초록 상위 / 노랑 중위 / 빨강 하위</span></div><div class="dgrid2">${cells.join('')}</div></section>`;
}
function playerRow(p,showTeam){
  const h=curLine(p); const rp=scoutReport(p);
  const tags=[p.foreign?`<span class="pill">${p.foreign==='아시아'?'아시아':'외국인'}</span>`:'',p.faC?`<span class="pill">${p.ext?'다년':'FA'} ${p.yrs}년</span>`:'',p.extNext?'<span class="pill good">다년 합의</span>':'',p.injOut>0?`<span class="pill bad">부상 ${p.injOut}일</span>`:'',isRookie(p)?'<span class="pill acc">신인</span>':'',p.team===G.user&&p.mor!=null&&p.mor<45?`<span class="pill ${moodClass(p.mor)}">${moodLabel(p.mor)}</span>`:'',p.listed?'<span class="pill warn">매물</span>':''].join(' ');
  return `<button class="item wa" data-a="player" data-v="${p.id}">${avImg(p)}<span class="nm">${esc(p.name)} <span class="small muted">${showTeam?tshort(p.team)+' · ':''}${posLabel(p)} · ${p.age}세</span> ${tags}</span><span class="sub">${esc(rp.arch)} · ${statLine(h,p)}</span><span class="rt num">${money(p.sal)}</span></button>`;
}
