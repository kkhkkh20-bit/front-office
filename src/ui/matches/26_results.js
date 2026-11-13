/* ---------- 경기 결과 확인 ---------- */
/* 중계 시점 기록: 이 경기 시작 전 누적 + 지금 타석 직전까지의 오늘 기록. 경기 결과가 미리 새지 않게 한다 */
function seasonAt(g,k,id,isP){ const p=G.players[id]||(/차전/.test(g?.kind||'')&&G.arch?.[id]?archP(G.arch[id]):null),saved=g?.broadcast?.players?.[id]?.pre; const hasPre=!!saved||g&&g.box&&['h','a'].some(sd=>((g.box[sd]||{})[isP?'pit':'bat']||[]).some(x=>x.id===id&&x.pre)); if(!p&&!hasPre)return null; /* 리그를 떠난 선수도 경기 직전 저장값으로(검수 11-08) */ const gy=g?dobj(g.day).y:G.year, tot=p?seasonTotal(p,gy,'1군'):null; /* 지난 시즌 경기는 그 시즌 기록 기준(검수 11-07) */ const z=isP?{outs:0,er:0,h:0,bb:0,hbp:0,so:0,hr:0}:{pa:0,ab:0,h:0,d:0,tr:0,hr:0,bb:0,hbp:0,so:0,sf:0};
  const o=Object.assign({},z); if(tot)for(const key in z)o[key]=tot[key]||0;
  const gi=g?G.games.indexOf(g):-1; const yr=gy; const pre=saved||(g&&g.box&&(()=>{ for(const sd of ['h','a']){ const q=((g.box[sd]||{})[isP?'pit':'bat']||[]).find(x=>x.id===id); if(q&&q.pre)return q.pre; } return null; })());
  if(!pre&&!/차전/.test(g?.kind||'')&&g&&g.box&&['h','a'].some(sd=>(g.box[sd]||{}).tid!==G.user&&((g.box[sd]||{})[isP?'pit':'bat']||[]).some(x=>x.id===id)))return null; /* 경기 직전 누계가 없는 옛 기록의 상대 선수: 상대 팀끼리 치른 경기는 되돌릴 수 없어 시즌 누계를 보이지 않는다(검수 11-08) */
  if(pre){ (isP?PRE_P:PRE_B).forEach((k,i)=>{ if(k in o)o[k]=Array.isArray(pre)?pre[i]:pre[k]||0; }); } /* 경기 직전 저장값이 있으면 그대로(검수 11-08) */
  else if(gi>=0)for(let i=0;i<=gi;i++){ const r=G.games[i]; if(!r||!r.box||/차전/.test(r.kind||'')||dobj(r.day).y!==yr)continue; for(const sd of ['h','a']){ const S=r.box[sd]; if(!S)continue;
      if(isP){ const q=(S.pit||[]).find(x=>x.id===id); if(q){ o.outs-=q.outs||0; o.er-=q.er||0; o.h-=q.h||0; o.bb-=q.bb||0;o.hbp-=q.hbp||0; o.so-=q.so||0; o.hr-=q.hr||0; } }
      else { const q=(S.bat||[]).find(x=>x.id===id); if(q){ o.ab-=q.ab||0; o.h-=q.h||0; o.d-=q.d||0; o.tr-=q.tr||0; o.hr-=q.hr||0; o.bb-=q.bb||0;o.hbp-=q.hbp||0; o.so-=q.so||0; o.sf-=q.sf||0; o.pa-=q.pa??((q.ab||0)+(q.bb||0)+(q.hbp||0)+(q.sf||0)); } } } }
  if(g&&g.pbp&&!/차전/.test(g.kind||'')){ /* 포스트시즌 경기는 정규시즌 누적에 더하지 않는다(검수 11-06) */ const L=g.pbp; let half=-1,o0=0,cp=null; for(let i=0;i<k&&i<L.length;i++){ const x=L[i]; if(x[0]!==half){ half=x[0]; o0=0; } if(x[1]==='PC'){ cp=x[2]; continue; } if(x[1]==='SB'||x[1]==='CS'){ if(isP&&x[1]==='CS'&&cp===id)o.outs+=Math.max(0,x[3]-o0); o0=x[3]; continue; } if(typeof x[1]!=='number')continue; cp=x[2];
      if(isP&&Array.isArray(x[11]))o.er+=x[11].filter(z=>z===id).length;
      if(isP&&x[2]===id){ o.outs+=Math.max(0,x[4]-o0); if(!Array.isArray(x[11]))o.er+=x[6]||0; if(x[3]==='K')o.so++; if(x[3]==='HBP')o.hbp++;if(x[3]==='BB')o.bb++; if(['1B','2B','3B','HR'].includes(x[3]))o.h++; if(x[3]==='HR')o.hr++; }
      if(!isP&&x[1]===id){ o.pa++; if(x[3]==='HBP')o.hbp++;if(x[3]==='BB')o.bb++; else if(x[3]!=='HBP'&&x[3]!=='SAC'&&!x[13])o.ab++; if(x[13])o.sf++; if(['1B','2B','3B','HR'].includes(x[3]))o.h++; if(x[3]==='2B')o.d++; if(x[3]==='3B')o.tr++; if(x[3]==='HR')o.hr++; if(x[3]==='K')o.so++; }
      o0=x[4]; } }
  for(const key in o)o[key]=Math.max(0,o[key]); return o; }
function eraAt(g,k,id){ const o=seasonAt(g,k,id,true); return o&&o.outs?(o.er*27/o.outs).toFixed(2):'-'; }
function batAt(g,k,id){ const o=seasonAt(g,k,id,false); if(!o||!o.pa)return null; const avg=o.ab?o.h/o.ab:0, obp=obpOf(o), slg=o.ab?(o.h+o.d+2*o.tr+3*o.hr)/o.ab:0; return {avg,ops:obp+slg,hr:o.hr}; }
function avgOpsAt(g,k,id){ const r=batAt(g,k,id); return r?`${fmt3(r.avg)} / ${fmt3(r.ops)}`:'-'; }
function seasonAvgOps(id){ const p=G.players[id]; if(!p)return ''; const h=seasonTotal(p,G.year,'1군'); if(!h||!h.pa)return '-'; const r=bRate(h); return `${fmt3(r.avg)} / ${fmt3(r.ops)}`; }
function seasonEra(id){ const p=G.players[id]; if(!p)return '-'; const h=seasonTotal(p,G.year,'1군'); return h&&h.outs?pRate(h).era.toFixed(2):'-'; }
function hBadge(id,isP,x){ const p=G.players[id]; const h=isP?(x&&x.th)||(p&&p.th):(x&&x.bt)||(p&&p.bt); /* 경기 기록에 남은 당시 손잡이 먼저(은퇴·이탈 선수도, 검수 11-09l) */ if(!h)return ''; return `<em class="cc-h sm ${h==='좌'?'l':h==='양'?'s':'r'}">${h}${isP?'투':'타'}</em>`; }
function batBox(s,mine){
  const t=s.bat.reduce((a,x)=>{ for(const k of ['ab','h','d','tr','hr','rbi','r','bb','hbp','so','sb','cs','sh','sf'])a[k]=(a[k]||0)+(x[k]||0); return a; },{});
  return `<div class="tw"><table class="box"><thead><tr><th class="opt">#</th><th class="stk">타자</th><th>타수</th><th class="key">안타</th><th class="opt">2루타</th><th class="opt">3루타</th><th>홈런</th><th class="key">타점</th><th>득점</th><th>볼넷</th><th class="opt">사구</th><th>삼진</th><th class="opt">도루</th><th class="opt">도루 실패</th><th class="opt">희생번트</th><th class="opt">희생플라이</th><th class="opt" title="이 경기 기록이 아니라 지금까지의 시즌 누적">현재 시즌 타율/OPS</th></tr></thead><tbody>
    ${[...s.bat].sort((a,b)=>((a.o??99)-(b.o??99))||((a.pos==null?0:1)-(b.pos==null?0:1))).map((x,i)=>`<tr class="${x.h>=3||x.hr?'hot':x.ab>=3&&!x.h?'cold':''}"><td class="opt">${x.o!=null&&x.o<9?x.o+1:i+1}</td><td class="stk"><button class="lnk" data-a="player" data-v="${x.id}">${esc(x.n)}</button> ${hBadge(x.id,false,x)} <span class="muted">${POSS[x.pos||((s.lineup||[]).find(r=>r.id===x.id)||{}).pos]||''}</span></td><td>${x.ab}</td><td class="key">${x.h}</td><td class="opt">${x.d||0}</td><td class="opt">${x.tr||0}</td><td class="${x.hr?'bhl':''}">${x.hr}</td><td class="key${x.rbi?' bhl':''}">${x.rbi}</td><td>${x.r}</td><td>${x.bb}</td><td class="opt">${x.hbp||0}</td><td>${x.so}</td><td class="opt">${x.sb||0}</td><td class="opt">${x.cs||0}</td><td class="opt">${x.sh||0}</td><td class="opt">${x.sf||0}</td><td class="muted opt">${seasonAvgOps(x.id)}</td></tr>`).join('')}
    <tr class="tot"><td class="opt"></td><td class="stk">합계</td><td>${t.ab}</td><td class="key">${t.h}</td><td class="opt">${t.d}</td><td class="opt">${t.tr}</td><td>${t.hr}</td><td class="key">${t.rbi}</td><td>${t.r}</td><td>${t.bb}</td><td class="opt">${t.hbp||0}</td><td>${t.so}</td><td class="opt">${t.sb}</td><td class="opt">${t.cs}</td><td class="opt">${t.sh}</td><td class="opt">${t.sf}</td><td class="opt"></td></tr></tbody></table></div>${(()=>{ const E=s.bat.filter(x=>x.e); return E.length?`<p class="small">실책: ${E.map(x=>`${esc(x.n)}${x.e>1?' '+x.e+'개':''}`).join(', ')}</p>`:''; })()}`;
}
function pitBox(s){
  return `<div class="tw"><table class="box"><thead><tr><th class="stk">투수</th><th></th><th class="key">이닝</th><th>투구수</th><th>피안타</th><th class="opt">피홈런</th><th>볼넷</th><th class="opt">사구</th><th>삼진</th><th title="실점(실책으로 난 점수 포함)">실점</th><th class="key" title="자책점(실책으로 난 점수는 빠짐)">자책</th><th class="opt" title="지금까지의 시즌 누적">현재 시즌 ERA</th></tr></thead><tbody>
    ${s.pit.map(q=>`<tr><td class="stk"><button class="lnk" data-a="player" data-v="${q.id}">${esc(q.n)}</button> ${hBadge(q.id,true,q)}</td><td>${q.d?`<span class="pill ${q.d==='승'?'good':q.d==='패'?'bad':'acc'}">${q.d}</span>`:''}</td><td class="key">${ipStr(q.outs)}</td><td class="${q.pc>=100?'warn':''}">${q.pc}</td><td>${q.h}</td><td class="opt">${q.hr||0}</td><td>${q.bb}</td><td class="opt">${q.hbp||0}</td><td>${q.so}</td><td>${q.r??''}</td><td class="key">${q.er}</td><td class="muted opt">${seasonEra(q.id)}</td></tr>`).join('')}</tbody></table></div>`;
}
function fullBox(g,openOpp){
  const me=g.home===G.user?'h':g.away===G.user?'a':'h', op=me==='h'?'a':'h';
  const hl=[]; const ms=g.box[me];
  const star=[...ms.bat].sort((a,b)=>(b.h*2+b.hr*3+b.rbi*1.5)-(a.h*2+a.hr*3+a.rbi*1.5))[0];
  if(star&&star.h)hl.push(`${esc(star.n)} ${star.ab}타수 ${star.h}안타${star.hr?` ${star.hr}홈런`:''}${star.rbi?` ${star.rbi}타점`:''}`);
  const sp=ms.pit[0]; if(sp)hl.push(`선발 ${esc(sp.n)} ${ipStr(sp.outs)}이닝 ${sp.er}자책 ${sp.so}탈삼진${sp.d?` (${sp.d})`:''}`);
  const sv=ms.pit.find(q=>q.d==='세'); if(sv)hl.push(`${esc(sv.n)} 세이브`);
  return `${lineScore(g,null)}
    ${hl.length?`<div class="hl">${hl.map(x=>`<span>${x}</span>`).join('')}</div>`:''}
    <details class="evs"><summary class="eyebrow">득점 상황 ${g.ev.filter(e=>e.run).length}건</summary><div class="log">${g.ev.filter(e=>e.run).map(e=>`<p><span class="ticker">${Math.floor(e.h/2)+1}회${e.h%2?'말':'초'}</span> ${esc(e.t)}</p>`).join('')||'<p class="small muted">득점이 없었습니다.</p>'}</div></details>
    <div class="eyebrow">${badge(ms.tid,16)} ${tname(ms.tid)} 타자</div>${batBox(ms,true)}
    <div class="eyebrow">${tname(ms.tid)} 투수</div>${pitBox(ms)}
    <details ${openOpp?'open':''}><summary class="eyebrow" style="cursor:pointer">${badge(g.box[op].tid,16)} ${tname(g.box[op].tid)} 기록 보기</summary>${batBox(g.box[op])}${pitBox(g.box[op])}</details>`;
}
function schedView(){
  const c=G.cal; const ms=[3,4,5,6,7,8,9,10]; const cm=UI.smon||Math.min(10,Math.max(3,dobj(G.day).m));
  const played=(G.sea.ulog||[]).filter(x=>!/차전/.test(x.k)); const w=played.filter(x=>x.res==='승').length,l=played.filter(x=>x.res==='패').length;
  const days=Object.keys(c.sched).map(Number).filter(d=>dobj(d).m===cm&&c.sched[d].some(m=>m.includes(G.user))&&!played.some(x=>x.d===d)).sort((a,b)=>a-b);
  const its=[...played.filter(x=>dobj(x.d).m===cm).map(x=>({d:x.d,m:[x.h,x.a],r:x})),...days.map(d=>({d,m:c.sched[d].find(x=>x.includes(G.user))}))].sort((a,b)=>a.d-b.d); /* 치른 경기는 경기 기록마다 한 줄: 더블헤더·휴식일 연기 경기도 빠지지 않게(검수 11-09k) */
  const rows=its.map(({d,m,r})=>{ const home=m[0]===G.user; const op=home?m[1]:m[0]; const gi=r?G.games.findIndex(g=>r.gid!=null?g.gid===r.gid:g.day===d&&g.home===r.h&&g.away===r.a):-1;
    const o=dobj(d); return `<div class="srow${d===G.day?' today':''}${r?'':' up'}" ${gi>=0?`data-a="openGame" data-v="${gi}" role="button" tabindex="0"`:''}><span class="sd">${o.m}/${o.d} <i>${WD[o.w]}</i></span><span class="so">${home?'vs':'@'} ${badge(op,20)} ${esc(tshort(op))}</span>${r?`<span class="sr"><span class="pill ${r.res==='승'?'good':r.res==='패'?'bad':''}">${r.res}</span> <b class="num">${home?r.hs:r.as}:${home?r.as:r.hs}</b></span>`:`<span class="sr muted">${d<G.day?'-':home?'홈':'원정'}</span>`}</div>`; }).join('');
  return csec(`${G.year} 정규시즌 일정`,`<p class="small">정규시즌 144경기 중 <b>${played.length}</b>경기 · ${w}승 ${l}패${played.length-w-l?` ${played.length-w-l}무`:''} · 남은 경기 ${144-played.length}</p>
    <div class="chips">${ms.map(m=>`<button data-a="smon" data-v="${m}" class="${cm===m?'on':''}">${m}월</button>`).join('')}</div>
    <div class="sched">${rows||'<p class="small muted">이 달에는 경기가 없습니다.</p>'}</div>
    <p class="small muted">월요일은 휴식일입니다. 결과를 누르면 최근 경기의 박스스코어를 볼 수 있습니다(최근 25경기 보관). 정규시즌 1~5위가 와일드카드·준플레이오프·플레이오프·한국시리즈로 이어지는 가을야구에 나갑니다.</p>`)
   +(G.ps?csec('포스트시즌',psBody()):'');
}
function busView(){ const t=team(G.user); return csec('구단 버스',`<div class="tgrid">${(()=>{ const bl=busLv(); return `<div class="tcard fci" id="fci-bus" style="cursor:default"><div class="row between" style="flex-wrap:nowrap"><div><b>구단 버스</b><div class="small muted">${BUS[bl].l}</div></div><span class="fpip">${[1,2].map(i=>`<i class="${i<=bl?'on':''}"></i>`).join('')}<em>${bl}/2</em></span></div>${busIsoPic()}<p class="dnote">원정 경기 이동 피로를 바꿉니다. 일반 버스는 원정 피로 +10%, 우등 +2%, 리무진 -6%(다른 구단은 우등 기준).</p><div class="tc-ft">${bl>=2?'<span class="pill good">최고 등급</span>':`<span class="small">${BUS[bl+1].l} 구입 <b class="num">${money(BUS[bl+1].c)}</b> · 운영비 연 ${money(BUS[bl+1].up)}</span><button class="btn small primary" data-a="buyBus" data-v="${bl+1}" ${spendable(G.user)<BUS[bl+1].c?'disabled':''}>구입 · ${money(BUS[bl+1].c)}</button>`}</div></div>`; })()}</div>${UI.facMsg?`<div class="note bad">${esc(UI.facMsg)}</div>`:''}`); }
function invView(){ const sf=(f,l)=>{ try{ return f(); }catch(e){ console.error(e); return `<div class="note bad">${esc(l)}을(를) 그리지 못했습니다(${esc(e.message)}). 다른 시설 화면은 그대로 쓸 수 있습니다.</div>`; } }; /* 한 칸의 오류가 시설 탭 전체를 막지 않게(피드백 11-09j) */ if(fmOn()){ /* PC: 훈련 시설·버스·홈구장을 한 화면(invFM)으로, 신구장은 따로 */ UI.it=UI.it||{}; const m={bus:'bus',home:'stad:seat'}[UI.it.inv]; if(m){ UI.invSel=m; UI.it.inv='train'; }
    const it=inTabs('inv',[['train','시설 현황'],['new','신구장']],'train'); return it.bar+(it.cur==='new'?sf(()=>stadView('new'),'신구장'):sf(invFM,'시설 현황')); }
  const it=inTabs('inv',[['train','훈련 시설'],['bus','구단 버스'],['home','홈구장'],['new','신구장']],'train');
  if(it.cur==='bus')return it.bar+sf(busView,'구단 버스'); if(it.cur==='home')return it.bar+sf(()=>stadView('now'),'홈구장')+sf(()=>stadView('fac'),'구장 시설')+`<details class="moreg"><summary><span>리그 관중 비교</span></summary><div class="moreb">${sf(()=>stadView('lg'),'리그 관중 비교')}</div></details>`; if(it.cur==='new')return it.bar+sf(()=>stadView('new'),'신구장'); return it.bar+sf(facView,'훈련 시설')+sf(acadCard,'특수 아카데미'); }
/* PC 시설(FM '구단 정보'의 시설·구장 칸처럼): 왼쪽 위 훈련·육성 시설, 왼쪽 아래 구장 시설·구단 버스(별 + 단계 + 등급 이름 + 리그 순위),
   가운데 위 구장 정보, 가운데 아래 리그 비교(항목당 한 줄 순위 막대), 오른쪽 고른 시설의 효과·다음 단계·투자 버튼. 값은 모두 실제 시설·구장 데이터 */
function invFM(){ facInit(); try{ aiFacAll(); }catch(e){} const tid=G.user, t=team(tid), F=G.fac, S=stadOf(tid), nb=Object.keys(F.bld).length, tids=G.teams.map(x=>x.id);
  const star=(lv,mx)=>`<span class="fvx-st">${'★'.repeat(lv)}<i>${'★'.repeat(Math.max(0,mx-lv))}</i></span>`;
  const rank=(v,all)=>all.filter(x=>x>v).length+1;
  const fAll=k=>tids.map(i=>{ const s=facSt(i); return s&&s.it?s.it[k]||0:0; }), sAll=k=>tids.map(i=>stadOf(i).lv[k]||0);
  const sel=UI.invSel||('fac:'+FACK[0]);
  const tile=(key,name,lv,mx,grade,rk,bld,nx)=>`<button class="fvx-t${sel===key?' on':''}${bld?' bld':''}" data-a="invSel" data-v="${key}"><span class="fvx-n">${esc(name)}</span><b class="fvx-lv">${lv}<i>/${mx}</i></b>${star(lv,mx)}<span class="fvx-g">${esc(grade)}</span><em>${bld?esc(bld):`리그 ${rk}위${lv>=mx?' · 최고 단계':nx?' · 다음 '+nx:''}`}</em></button>`;
  const trT=FACK.map(k=>{ const lv=F.it[k], b=F.bld[k]; return tile('fac:'+k,FACI[k].l,lv,FAC_MAX,FACI[k].lv[lv],rank(lv,fAll(k)),b?`${FACI[k].lv[b.lv]} 공사 · ${dmd(b.done)} 완공`:'',lv<FAC_MAX?money(FACI[k].c[lv+1]):''); }).join('');
  const lgLv=tids.map(facLv), rkAll=rank(F.lv,lgLv);
  const tr=`<section class="card fvx-box"><h3>훈련·육성 시설 <em>종합 ${F.lv}단계 · 리그 ${rkAll}위</em><span class="fvx-k">연 유지비 <b>${money(facUpkeep())}</b> · ${esc(spendTxt())} · 공사 <b>${nb}/2</b></span></h3><div class="fvx-tiles">${trT}</div></section>`;
  const bl=busLv();
  const sdT=STAD_ITEMS.map(it=>{ const lv=S.lv[it.k], b=(S.build||[]).find(x=>x.k===it.k); return tile('stad:'+it.k,it.l,lv,STAD_MAX,`${lv}단계`,rank(lv,sAll(it.k)),b?`${b.lv}단계 공사 · ${dmd(b.done)} 완공`:'',lv<STAD_MAX?money(STAD_COST[lv+1]):''); }).join('')+tile('bus','구단 버스',bl,BUS.length-1,BUS[bl].l,rank(bl,tids.map(busLv)),'',BUS[bl+1]?money(BUS[bl+1].c):'');
  const sd=`<section class="card fvx-box"><h3>구장 시설 · 구단 버스 <em>구장은 시 소유 · 구단 임대 운영</em></h3><div class="fvx-tiles">${sdT}</div></section>`;
  /* 구장 정보 */
  const cap=stadCap(tid), A=(G.sea.att&&G.sea.att[tid])||{n:0,sum:0,so:0}, P=stadProj(tid), D=stadDim(tid), age=G.year-stadBuilt(tid);
  const o=stadIsoOpts(tid); o.col=cTeamCol(tid);
  const kv=(k,v)=>`<div><span>${k}</span><b>${v}</b></div>`;
  const st=`<section class="card fvx-stad"><h3>${esc(stadName(tid))}</h3><div class="fvx-top">${kv('개장',stadBuilt(tid)+'년')}${kv('구장 상태',age>=30?`<span class="bad">노후(${age}년째) · 관중 수요 -4%</span>`:age<3?`<span class="good">새 구장(${age}년째)</span>`:`${age}년째`)}${kv('지붕',S.dome?'돔구장':'개방형')}</div>
    <div class="fvx-pic">${isoStadiumSvg(o)}</div>
    <div class="fvx-kv">${kv('수용 인원',cap.toLocaleString('ko-KR')+'석')}${kv('올해 홈 평균',A.n?Math.round(A.sum/A.n).toLocaleString('ko-KR')+'명':P.n?'예상 '+P.avg.toLocaleString('ko-KR')+'명':'-')}${kv('좌석 점유율',A.n?Math.min(100,Math.round(A.sum/(A.cap||A.n*cap)*100))+'%':'-') /* 경기 당시 좌석 수 합으로(구장이 바뀌어도 100%를 넘지 않게) */}${kv('매진',`${A.so||0}회 / ${A.n}경기`)}
      ${kv('담장 거리',`좌 ${D.lf} · 중 ${D.cf} · 우 ${D.rf}m`)}${kv('담장 높이',`좌 ${D.wl} · 중 ${D.wc} · 우 ${D.wr}m`)}${kv('홈런 지수',`우타 ${Math.round(parkHRM(tid,'R')*100)} · 좌타 ${Math.round(parkHRM(tid,'L')*100)}`)}${kv('시즌 예상 관중',P.att.toLocaleString('ko-KR')+'명')}
      ${kv('표값 수입',money(P.ticket))}${kv('구장 부대 수입',P.fnb+P.prem+P.ad>0?money(P.fnb+P.prem+P.ad):'<span class="muted">없음 · 매점·프리미엄석·전광판을 3단계 이상으로 올리면 생깁니다</span>')}</div>
    <div class="fvx-pr"><span>티켓 가격</span><div class="seg">${PRICE.map((x,i)=>`<button data-a="stadPrice" data-v="${i}" class="${S.price===i?'on':''}">${x.l}</button>`).join('')}</div></div><p class="fvx-note">${esc(PRICE[S.price].d)} 홈런 지수 100 = 리그 평균.</p>${fenceBox(tid)}</section>`;
  /* 리그 비교 */
  const att=i=>{ const x=(G.sea.att&&G.sea.att[i])||{n:0,sum:0}; return x.n?x.sum/x.n:0; }, occ=i=>{ const x=(G.sea.att&&G.sea.att[i])||{n:0,sum:0}; return x.n?Math.min(100,x.sum/(x.cap||x.n*stadCap(i))*100):0; }, sTot=i=>sum(STAD_ITEMS.map(x=>stadOf(i).lv[x.k]||0));
  const cmp=`<section class="card fvx-cmp">${sfChart(`훈련 시설 · 리그 ${G.teams.length}개 구단`,[...FACK.map(k=>({l:FACI[k].l,v:F.it[k],all:fAll(k)})),{l:'종합 등급',v:F.lv,all:lgLv}],0,FAC_MAX)}
    ${sfChart(`구장 · 리그 ${G.teams.length}개 구단`,[{l:'수용 인원',v:cap,all:tids.map(stadCap)},{l:'홈 평균 관중',v:att(tid),all:tids.map(att)},{l:'좌석 점유율 %',v:occ(tid),all:tids.map(occ)},{l:'구장 시설 합계',v:sTot(tid),all:tids.map(sTot)},{l:'구단 버스',v:bl,all:tids.map(busLv)}],0,0,v=>Math.round(v).toLocaleString('ko-KR'))}</section>`;
  /* 오른쪽: 고른 시설 */
  const [kind,k]=sel.split(':'); let dh='';
  if(kind==='fac'&&FACI[k]){ const D0=FACI[k], lv=F.it[k], b=F.bld[k], nx=lv+1;
    dh=`<h2>${esc(D0.l)}</h2>${star(lv,FAC_MAX)}<p class="fvx-cur"><b>${lv}단계</b> ${esc(D0.lv[lv])} · 리그 ${rank(lv,fAll(k))}위 · 유지비 연 ${money(D0.up[lv])}</p><p>${esc(D0.d)}</p>${(()=>{ const t=facGainTxt(k,lv); return t?`<p class="small"><b>${esc(t)}</b></p>`:''; })()}
      ${b?`<div class="note warn">${esc(D0.lv[b.lv])} 공사 중 · ${dmd(b.done)} 완공</div>`:lv>=FAC_MAX?'<div class="note good">최고 단계입니다.</div>':`<dl class="fvx-nx"><div><dt>다음 단계</dt><dd>${nx}단계 · ${esc(D0.lv[nx])}</dd></div><div><dt>공사비</dt><dd>${money(D0.c[nx])}</dd></div><div><dt>공사 기간</dt><dd>${D0.days[nx]}일</dd></div><div><dt>유지비</dt><dd>연 ${money(D0.up[nx])}</dd></div></dl>
      <div class="fvx-btn"><button class="btn small primary" data-a="buildFacItem" data-v="${k}" ${nb>=2||spendable(G.user)<D0.c[nx]?'disabled':''}>구단 자금으로 · ${money(D0.c[nx])}</button>${t.indie?'':`<button class="btn small" data-a="capex" data-v="fac:${k}" ${nb>=2?'disabled':''}>모기업 투자 요청 · ${Math.round(capexOdds('fac',D0.c[nx])*100)}%</button>`}</div>${nb>=2?'<p class="muted">동시 공사는 2곳까지입니다.</p>':spendable(G.user)<D0.c[nx]?`<p class="bad">자금 부족(${esc(spendTxt())})</p>`:''}`}
      ${lv>=2?(()=>{ const age=facAgeOf(G.user,k); return `<p class="small">시설 연식 <b>${age}년</b> · 10년이 넘으면 해마다 낡아 한 단계씩 내려갈 수 있습니다.${age>=6&&!b?` <button class="btn small" data-a="facRefurb" data-v="${k}">보수 공사 · ${money(facRefurbCost(k))}</button>`:''}</p>`; })():''}<p class="fvx-note">재원 안내 ${hiI('큰 시설 투자는 운영 예산이 아니라 구단 현금(적립금)이나 모기업 투자로 합니다. 모기업 요청은 구단주 신뢰·성향·금액에 따라 승인되고, 거절되면 신뢰 -1, 60일마다 1번입니다. 성장 효과는 겨울 성장 때, 부상·회복 효과는 바로 반영됩니다.')}</p>`; }
  else if(kind==='stad'&&STAD_ITEMS.find(x=>x.k===k)){ const it=STAD_ITEMS.find(x=>x.k===k), lv=S.lv[k], b=(S.build||[]).find(x=>x.k===k), nx=lv+1, can=stadWindow();
    dh=`<h2>${esc(it.l)}</h2>${star(lv,STAD_MAX)}<p class="fvx-cur"><b>${lv}단계</b> · 리그 ${rank(lv,sAll(k))}위</p><p>${esc(it.d)}</p>
      ${b?`<div class="note warn">${b.lv}단계 공사 중 · ${dmd(b.done)} 완공</div>`:lv>=STAD_MAX?'<div class="note good">최고 단계입니다.</div>':`<dl class="fvx-nx"><div><dt>다음 단계</dt><dd>${nx}단계</dd></div><div><dt>공사비</dt><dd>${money(STAD_COST[nx])}</dd></div><div><dt>공사 기간</dt><dd>${STAD_DAYS[nx]}일</dd></div><div><dt>유지비 증가</dt><dd>연 +${money(STAD_UP[nx]-STAD_UP[lv])}</dd></div></dl><p class="fvx-eff">효과: ${stadGainTxt(k)}</p>
      <div class="fvx-btn"><button class="btn small${can?' primary':''}" data-a="stadBuild" data-v="${k}" ${can?'':'disabled'}>구단 현금으로 · ${money(STAD_COST[nx])}</button><button class="btn small" data-a="capex" data-v="stad:${k}" ${can?'':'disabled'}>지자체 분담 협의 · ${Math.round(capexOdds('stad',STAD_COST[nx])*100)}%</button></div>${can?'':'<p class="muted">구장 공사는 시즌이 끝난 뒤(10월~2월)에만 시작할 수 있습니다.</p>'}`}
      <p class="fvx-note">수입 효과는 올해 예상 관중·가격 기준이고 그 효과가 이어진다고 본 값입니다(공사 기간·팬 여론 변화 제외). 6단계부터 효과 증가폭이 완만해집니다.</p>`; }
  else { const nx=bl+1; dh=`<h2>구단 버스</h2>${star(bl,BUS.length-1)}<p class="fvx-cur"><b>${esc(BUS[bl].l)}</b> · 원정 피로 ${BUS[bl].f>0?'+':''}${Math.round(BUS[bl].f*100)}% · 유지비 연 ${money(BUS[bl].up)}</p><p>원정 경기 이동 피로를 바꿉니다. 다른 구단은 우등 버스 기준입니다.</p>
      ${nx>=BUS.length?'<div class="note good">최고 등급입니다.</div>':`<dl class="fvx-nx"><div><dt>다음 등급</dt><dd>${esc(BUS[nx].l)}</dd></div><div><dt>구입비</dt><dd>${money(BUS[nx].c)}</dd></div><div><dt>원정 피로</dt><dd>${BUS[nx].f>0?'+':''}${Math.round(BUS[nx].f*100)}%</dd></div><div><dt>유지비</dt><dd>연 ${money(BUS[nx].up)}</dd></div></dl><div class="fvx-btn"><button class="btn small primary" data-a="buyBus" data-v="${nx}" ${spendable(G.user)<BUS[nx].c?'disabled':''}>구입 · ${money(BUS[nx].c)}</button></div>`}`; }
  /* 고른 시설의 구단별 단계(리그 시설 비교 표의 한 열) */
  const [lvOf,mxS,nmS]=kind==='fac'&&FACI[k]?[i=>{ const x=facSt(i); return x&&x.it?x.it[k]||0:0; },FAC_MAX,FACI[k].l]:kind==='stad'&&STAD_ITEMS.find(x=>x.k===k)?[i=>stadOf(i).lv[k]||0,STAD_MAX,STAD_ITEMS.find(x=>x.k===k).l]:[busLv,BUS.length-1,'구단 버스'];
  const byT=tids.map(i=>[i,lvOf(i)]).sort((a,b)=>b[1]-a[1]||(b[0]===tid)-(a[0]===tid));
  const lgL=`<h3>구단별 ${esc(nmS)}</h3>${byT.map(([i,lv])=>`<div class="fvx-li${i===tid?' me':''}"><span>${esc(team(i).city)} ${esc(team(i).nick)}</span>${star(lv,mxS)}<b>${lv}단계</b></div>`).join('')}`;
  const msg=[UI.facMsg,UI.stadMsg].filter(Boolean).map(m=>`<div class="note bad">${esc(m)}</div>`).join('');
  const bl2=[...Object.entries(F.bld).map(([k,b])=>[b.done,`${FACI[k].l} · ${FACI[k].lv[b.lv]}`]),...(S.build||[]).map(b=>[b.done,`${(STAD_ITEMS.find(x=>x.k===b.k)||{}).l} · ${b.lv}단계`])].sort((a,b)=>a[0]-b[0]);
  const H=[]; for(const i of tids){ if(i===tid)continue; const s=facSt(i); for(const h of ((s&&s.hist)||[]))H.push({...h,i}); } H.sort((a,b)=>b.d-a.d);
  const det=`<section class="card fvx-det"><div class="fvx-db">${dh}${msg}
    ${lgL}<h3>공사 현황 <em>${bl2.length}건</em></h3>${bl2.length?bl2.map(([d,l])=>`<div class="fvx-li"><span>${esc(l)}</span><b>${dmd(d)} 완공</b></div>`).join(''):'<p class="muted">진행 중인 공사가 없습니다.</p>'}
    <h3>최근 다른 구단 시설 투자</h3>${H.length?H.slice(0,8).map(h=>`<div class="fvx-li"><span>${esc(team(h.i).nick)} · ${esc(facHistLbl(h))}${h.src==='cap'?' · 모기업 투자':h.sup?' · 구단주 지원 '+money(h.sup):''}</span><b>${dobj(h.d).y}년 ${dmd(h.d)}</b></div>`).join(''):'<p class="muted">기록이 없습니다.</p>'}</div></section>`;
  return `<div class="fvx ws-own">${tr}${st}${det}${sd}${cmp}</div>`; }
function facView(){ facInit(); const F=G.fac; const t=team(G.user); const nb=Object.keys(F.bld).length;
  const league=G.teams.map(x=>({x,lv:facLv(x.id)})); const rk=league.filter(q=>q.lv>F.lv).length+1;
  const card=k=>{ const D=FACI[k], lv=F.it[k], b=F.bld[k], nx=lv+1;
    const pips=[...Array(FAC_MAX)].map((_,j)=>j+1).map(i=>`<i class="${i<=lv?'on':''}${b&&i===b.lv?' bld':''}"></i>`).join('');
    return `<div class="tcard fci" id="fci-${k}" style="cursor:default">${facThumb(k)}<div class="row between" style="flex-wrap:nowrap;align-items:flex-start"><div style="min-width:0"><b>${D.l}</b> ${hiI(D.d)}<div class="small muted">${D.lv[lv]}</div></div><span class="fpip" title="${lv}/${FAC_MAX}단계">${pips}<em>${lv}/${FAC_MAX}</em></span></div>
      <div class="tc-ft">${b?`<span class="pill warn">${D.lv[b.lv]} 공사 중 · ${dmd(b.done)} 완공</span>`:lv>=FAC_MAX?'<span class="pill good">최고 단계</span>' /* 6단계까지(검수 11-06: 모바일에서 3단계에 막힘) */:`<span class="small">다음: <b>${D.lv[nx]}</b> · 공사비 <b class="num">${money(D.c[nx])}</b> · ${D.days[nx]}일 · 유지비 연 ${money(D.up[nx])}</span><button class="btn small primary" data-a="buildFacItem" data-v="${k}" ${nb>=2||spendable(G.user)<D.c[nx]?'disabled':''}>구단 자금으로 · ${money(D.c[nx])}</button>${t.indie?'':`<button class="btn small" data-a="capex" data-v="fac:${k}" ${nb>=2?'disabled':''} title="승인 가능성 ${Math.round(capexOdds('fac',D.c[nx])*100)}%">모기업 투자 요청 · ${Math.round(capexOdds('fac',D.c[nx])*100)}%</button>`}${nb>=2?'<span class="small muted">동시 공사는 2곳까지</span>':t.cash<D.c[nx]?`<span class="small bad">현금 부족(보유 ${money(t.cash)})</span>`:''}`}</div></div>`; };
  return csec(`훈련·육성 시설 ${hiI('실제 구단의 2군 훈련 단지·재활센터·트래킹 장비 투자를 항목별로 나눴습니다. 실제 구단처럼 큰 시설 투자는 연간 운영 예산이 아니라 별도 재원으로 합니다. 구단 보유 현금(적립금)으로 바로 짓거나, 모기업에 투자를 요청할 수 있습니다(구단주 신뢰·성향·금액에 따라 승인, 거절되면 신뢰 -1, 60일마다 1번). 완공 뒤 유지비만 운영비에서 매년 나갑니다. 공사는 동시에 2곳까지 할 수 있습니다. 성장 효과는 매년 겨울 성장 때 반영되고, 부상·회복 효과는 바로 적용됩니다.')}`,`
    <dl class="tsum"><div><dt>종합 등급</dt><dd>${F.lv}단계 · 리그 ${rk}위</dd></div><div><dt>연 유지비</dt><dd class="num">${money(facUpkeep())}</dd></div><div><dt>보유 현금</dt><dd class="num">${money(t.cash)}</dd></div><div><dt>공사 중</dt><dd>${nb}/2</dd></div></dl>
    ${UI.facMsg?`<div class="note bad">${esc(UI.facMsg)}</div>`:''}
    <div class="tgrid">${FACK.map(card).join('')}</div>${facCompare()}
    <div class="eyebrow" style="margin-top:8px">성장에 영향을 주는 것</div>
    <p class="small muted">1) 출전 시간: 1군에서 많이 뛸수록 잘 큽니다(2군 출전은 2군 구장 수준에 따라 60~75% 인정). 2) 시설. 3) 코치 수준과 감독의 육성 성향. 4) 잠재력과 성장 의지. 5) 훈련 방향과 해외 연수. 선수마다 숨은 성장 유형이 있습니다.</p>`); }


/* 담장 공사 상자: 자리마다 '몇 m 옮길지/높일지'를 선택지에서 고른다(숫자 입력 대신, 사용자 11-11). 고르는 즉시 공사 뒤 홈런 지수·공사비를 보여 준다 */
const FENCE_STEP={d:[-5,-3,-2,-1,0,1,2,3,5],h:[-2,-1,-.5,0,.5,1,2]};
const FENCE_ROW=[['lf','좌측 담장 거리','d'],['cf','가운데 담장 거리','d'],['rf','우측 담장 거리','d'],['wl','좌측 담장 높이','h'],['wc','가운데 담장 높이','h'],['wr','우측 담장 높이','h']];
function fenceTarget(tid){ const D=stadDim(tid), Z=UI.fenceD||{}; const o={}; for(const [k] of FENCE_ROW)o[k]=Math.round((D[k]+(Z[k]||0))*10)/10; return o; }
function fenceBox(tid){ if(tid!==G.user||G.unemp)return ''; const D=stadDim(tid), Z=UI.fenceD||{}, ok=stadWindow(), S=stadOf(tid), done=S.fenceY===sponSeason(), T=fenceTarget(tid), any=FENCE_ROW.some(([k])=>Z[k]);
    const row=([k,l,t])=>{ const L=FENCE_LIM[k]; return `<div class="fence-r"><span class="fence-l"><b>${l}</b><i>지금 ${D[k]}m${Z[k]?` → <em>${T[k]}m</em>`:''}</i></span><div class="fence-seg">${FENCE_STEP[t].map(v=>{ const x=Math.round((D[k]+v)*10)/10, bad=x<L[0]||x>L[1]; return `<button class="fc-b${(Z[k]||0)===v?' on':''}" data-a="fenceD" data-v="${k}:${v}" ${bad?'disabled':''} title="${x}m">${v>0?'+'+v:v<0?'−'+(-v):'0'}</button>`; }).join('')}</div></div>`; };
  let pv=''; if(any){ const ix=fenceIdx(tid,T), c=fenceCost(D,T); pv=`<p class="small fence-pv">공사 뒤 홈런 지수 <b>우타 ${Math.round(ix.R*100)} · 좌타 ${Math.round(ix.L*100)}</b> (지금 ${Math.round(parkHRM(tid,'R')*100)} · ${Math.round(parkHRM(tid,'L')*100)}) · 공사비 <b>${money(c)}</b></p>`; }
  return `<details class="fence-box"${any||UI.fenceMsg?' open':''}><summary>담장 공사 <span class="muted">(거리·높이 조절)</span></summary><p class="small muted">담장을 앞(−)으로 당기거나 뒤(+)로 밀고, 높이를 낮추거나(−) 높이세요(+).</p><div class="fence-rows">${FENCE_ROW.map(row).join('')}</div>${pv}${UI.fenceMsg?`<p class="small ${UI.fenceOk?'':'bad'}">${esc(UI.fenceMsg)}</p>`:''}
    <div class="row"><button class="btn small" data-a="fenceReset" ${any?'':'disabled'}>처음으로</button><button class="btn small primary" data-a="fenceGo" ${ok&&!done&&any?'':'disabled'}>공사하기</button></div>
    <p class="small muted">담장이 1m 가까우면 그 방향 홈런이 약 4% 늘고, 1m 높으면 약 4% 줄어듭니다. 높은 담장에 막힌 타구는 2루타가 됩니다. 우타자는 좌측, 좌타자는 우측으로 당겨 친 홈런이 많습니다. 거리 좌우 ${FENCE_LIM.lf[0]}~${FENCE_LIM.lf[1]}m · 가운데 ${FENCE_LIM.cf[0]}~${FENCE_LIM.cf[1]}m · 높이 ${FENCE_LIM.wl[0]}~${FENCE_LIM.wl[1]}m 안에서만 고를 수 있습니다. ${done?'올해 공사를 이미 했습니다.':ok?'비시즌에 한 해 한 번 할 수 있습니다.':'시즌이 끝난 뒤(10월~2월)에 할 수 있습니다.'}</p></details>`; }
