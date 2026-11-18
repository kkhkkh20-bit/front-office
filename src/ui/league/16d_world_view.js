/* ---------- 해외 리그 > 세계 선수(세계척도 P2·P3 11-19): 해외 구단 주목 선수 · 스카우트 지식 · 관찰 기록 ----------
   엔진: 35e_world_players(G.wps), 35f_world_scout(지식·추정·추천). 화면은 읽기만 한다(관찰 등록은 기존 ovwT). */
const WPS_TAB=[['MLB','MLB'],['AAA','트리플A'],['NPB','NPB'],['CPBL','CPBL'],['LMB','멕시코']];
const wpsPos=e=>e.P?(e.ro==='SP'?'선발':'불펜'):POSK[e.ps]||'';
const wpsFlagH=e=>wpsFlags(e).map(([l,c])=>`<span class="pill ${c}">${esc(l)}</span>`).join('');
function wpsLineH(e,l){ const club=l.c!=null?ovlNm(l.lg||e.lg,l.c):''; return `<tr${l.live?' class="live"':''}><td>${l.y}${l.live?' <span class="small muted">진행 중</span>':''}</td><td class="wps-lc">${esc(ovsLvlL(l.lvl||l.l))}${club?`<span class="small muted">${esc(club)}</span>`:''}</td><td class="wps-ln">${lineTxt(l,!!e.P)}</td></tr>`; }
const wpsHistT=(e,L)=>L.length?`<div class="tw"><table class="tbl wps-ht"><thead><tr><th>시즌</th><th>리그·구단</th><th>기록</th></tr></thead><tbody>${L.slice().reverse().map(l=>wpsLineH(e,l)).join('')}</tbody></table></div>`:'<p class="small muted">기록이 없습니다.</p>';
/* 추정 능력 칸: 지식이 모자라면 '기록만' */
function wpsEstH(v){ if(!v||v.s==='stat')return '<span class="wps-est muted" title="스카우트 지식이 45% 이상이어야 능력을 추정합니다">기록만</span>'; return `<span class="wps-est ${v.s}" title="${v.s==='tight'?'좁은 범위':'대략(범위가 넓음)'}"><b>${v.mid}</b><i>${v.lo}~${v.hi}</i></span>`; }
/* 심층 보고서(지식 70% 이상): 번호로 펼친 전체 선수에서 투타·구종 */
function wpsDeepH(e,v){ if(!v||v.s!=='tight')return ''; let p=null; try{ p=wpsExpand(e); }catch(x){} if(!p)return ''; let ar=''; try{ if(p.isP)ar=arsenal(p,p.r.stf).map(x=>x[0]).join('·'); }catch(x){}
  return `<p class="small">심층 보고서 · ${esc(p.th||'우')}투 ${esc(p.bt||'우')}타${ar?` · 구종 ${esc(ar)}`:''}</p>`; }
function wpsRowH(e,v,K){ const L=wpsLines(e), last=L[L.length-1], w=(G.ovw||[]).find(x=>String(x.id)===String(e.i)), on=!!w;
  const sum=`<summary><span class="wps-nm"><b>${esc(e.n)}</b><i>${e.a}세 · ${esc(wpsPos(e))} · ${esc(e.na||'')}</i></span><span class="wps-fl">${wpsFlagH(e)}</span><span class="wps-last small">${last?`${last.y}${last.live?'(진행)':''} ${lineTxt(last,!!e.P)}`:''}</span>${wpsEstH(v)}</summary>`;
  const ai=v.s==='stat'?'':` · 같은 수준으로 파악한 다른 KBO 구단 ${wkClubs(e)}곳`;
  const why=v.s==='stat'?'능력은 아직 모릅니다. 이 지역 해외망을 넓히거나 스카우트를 파견하면 추정이 열립니다.':`예상 능력 ${v.mid}(범위 ${v.lo}~${v.hi})${v.k?` · 관찰 파악도 ${v.k}%`:''}`;
  const btn=G.unemp?'':`<button class="tc-i ovq-b${on?' on':''}" data-a="ovwT" data-v="${esc(String(e.i))}" aria-pressed="${on}">${on?'관찰 해제':'관찰 등록'}</button>`;
  return `<details class="wp" data-k="wp_${e.i}"${UI.open&&UI.open['wp_'+e.i]?' open':''}>${sum}<div class="wp-b"><p class="small">${esc(wpsCtTxt(e,K))} · ${esc(why)}${ai}</p>${wpsDeepH(e,v)}${wpsHistT(e,L)}<div class="ovq-row">${btn}<span class="small muted">관찰하면 해마다 기록을 따로 남기고, 관찰한 주만큼 범위가 좁아집니다.</span></div></div></details>`; }
function wpsKnowCard(lg,S){ const K=S[lg].K, cls=K>=WK.tight?'good':K>=WK.rough?'acc':K>=25?'warn':'bad';
  const lvl=K>=WK.tight?'좁은 범위로 능력 추정':K>=WK.rough?'대략적인 능력 추정(범위가 넓음)':'기록·나이·계약만';
  const ev=((G.wps&&G.wps.ev)||[]).filter(x=>{ const e=wpsGet(x.id); return x.t.includes(OVL_LBL[lg])||e&&e.lg===lg; }).slice(0,5);
  const dig=G.unemp?'':`<label class="chk wps-dig"><input type="checkbox" data-a="wkDigT"${G.cfg&&G.cfg.wkDig===false?'':' checked'}> 해외 스카우트 주간 추천 받기<span class="small muted">(해외 파견 스카우트나 해외망 2단계 이상 지역이 있을 때)</span></label>`;
  return csec(`스카우트 지식${hiI('리그(지역)마다 우리 구단이 아는 정도입니다. 해외망 단계, 그 지역에 파견한 스카우트가 머문 날과 능력, 리그가 얼마나 알려졌는지로 정합니다. 지식이 낮으면 이름난 선수만 보이고 기록만 압니다. 45% 이상이면 대략적인 능력(넓은 범위), 70% 이상이면 좁은 범위로 봅니다. 다른 구단도 같은 식으로 봅니다(해외망 대신 스카우트진 수준).')}`,
    `<div class="wps-k"><b class="${cls}">${K}%</b><span class="bar"><i style="width:${K}%"></i></span></div><p class="small">${esc(lvl)} · 보이는 주목 선수 ${S[lg].vis}/${S[lg].n}명</p><ul class="wps-why small">${wkWhy(G.user,lg).map(t=>`<li>${esc(t)}</li>`).join('')}</ul>${dig}`+
    (ev.length?`<div class="eyebrow">최근 움직임</div><ul class="wps-ev small">${ev.map(x=>`<li>${x.y} ${esc(x.t)}</li>`).join('')}</ul>`:''));
}
function wpsClubsH(lg,K){ const W=G.wps, n=OVL_C[lg].length, y=G.year, watched=new Set((G.ovw||[]).map(w=>String(w.id))); let out='';
  for(let c=0;c<n;c++){ const L=W.L.filter(e=>e.lg===lg&&e.c===c), V=L.map(e=>({e,v:wkView(G.user,e,K)})), vis=V.filter(x=>x.v.s!=='hide').sort((a,b)=>(b.e.t==='s')-(a.e.t==='s')||b.e.a-a.e.a), hid=V.length-vis.length; if(!L.length)continue;
    const key=`wpc_${lg}_${c}`, hasW=L.some(e=>watched.has(String(e.i))), op=UI.open&&UI.open[key]!=null?UI.open[key]:hasW||c===0; let tr=null; try{ tr=ovlTeamRec(lg,c,y)||ovlTeamRec(lg,c,y-1); }catch(x){}
    out+=`<details class="ovl-d wpc" data-k="${key}"${op?' open':''}><summary><b>${esc(ovlNm(lg,c))}</b><span class="small muted">${lg==='AAA'?esc(OVL_C.MLB[c][1])+' 산하 · ':''}${tr?`${tr.w}승 ${tr.l}패 · `:''}주목 ${vis.length}명${hid?` · 미파악 ${hid}명`:''}${hasW?' · 관찰 중':''}</span></summary>${vis.length?vis.map(x=>wpsRowH(x.e,x.v,K)).join(''):'<p class="small muted wps-none">스카우트 지식이 모자라 아직 눈에 띈 선수가 없습니다.</p>'}</details>`; }
  return out; }
/* 관찰 기록: 관찰을 시작한 시즌부터 해마다 한 줄(은퇴·명단 제외 뒤에도 남는다) */
function wpsWatchView(){ const L=(G.ovw||[]).filter(w=>w.h||wpsGet(w.id)); const other=(G.ovw||[]).length-L.length;
  const card=w=>{ const e=wpsGet(w.id); const K=e?wkKnow(G.user,e.lg):0, v=e?wkView(G.user,e,K):null; const isP=e?!!e.P:!!(w.h&&w.h[0]&&w.h[0].outs!=null);
    const H=(w.h||[]).map(l=>Object.assign(wpsH(l,isP),{lg:l.lg})); if(e){ const cur=wpsLines(e).find(l=>l.live); if(cur&&!H.some(l=>l.y===cur.y))H.push(cur); }
    const nm=e?e.n:(w.nm||'선수'), sub=e?`${e.a}세 · ${wpsPos(e)} · ${OVL_LBL[e.lg]} ${ovlNm(e.lg,e.c)}`:'은퇴했거나 주목 선수 명단에서 빠졌습니다';
    return `<div class="wpw"><div class="wpw-h"><span class="wps-nm"><b>${esc(nm)}</b><i>${esc(sub)}</i></span>${e?`<span class="wps-fl">${wpsFlagH(e)}</span>${wpsEstH(v)}`:''}<button class="tc-i ovq-b on" data-a="ovwT" data-v="${esc(String(w.id))}">관찰 해제</button></div>
      <p class="small muted">${G.year>=w.y0?`${w.y0} 시즌부터 관찰`:'관찰 시작'} · 관찰 ${Math.max(0,Math.floor((G.day-w.since)/7))}주${e?' · '+esc(wpsCtTxt(e,K)):''}</p>${wpsHistT(e||{P:isP?1:0,lg:''},H)}</div>`; };
  return csec(`관찰 중인 세계 선수 ${L.length}명${hiI(`해외 관찰 명단(최대 ${OVQ.wMax}명)에 올린 해외 구단 주목 선수입니다. 관찰을 시작한 시즌부터 해마다 기록을 한 줄씩 남깁니다. KBO 출신 외국인·해외 후보군 관찰은 '주목 선수'·'KBO 출신' 탭에서 봅니다.`)}`,
    (L.length?`<div class="wpw-l">${L.map(card).join('')}</div>`:emptyState('관찰 중인 세계 선수가 없습니다. 구단별 명단에서 선수를 펼쳐 관찰 등록을 누르세요.'))+(other?`<p class="small muted">이 밖에 해외 관찰 ${other}명(KBO 출신·후보군)</p>`:'')); }
function ovlWorldView(){ if(!G.wps||!G.wps.L)return csec('세계 선수','<p class="small muted">다음 날짜 진행 때 해외 구단 주목 선수 명단이 만들어집니다.</p>');
  const S=wkSummary(G.user), nW=(G.ovw||[]).filter(w=>w.h||wpsGet(w.id)).length;
  const lt=inTabs('wpsl',[...WPS_TAB.map(([k,l])=>[k,`${l} ${S[k].vis}`]),['watch',`관찰 ${nW}`]],'MLB');
  if(lt.cur==='watch')return lt.bar+wpsWatchView();
  const lg=lt.cur, K=S[lg].K;
  const list=csec(`${OVL_LBL[lg]} 구단별 주목 선수${hiI('해외 구단마다 눈여겨볼 선수 3~6명입니다. 기록은 리그 수준대로 쌓이고, 해마다 나이를 먹고 은퇴·승격·이적이 일어납니다. 노장·부상 후 부진·부진 꼬리표는 공개 기록과 부상 소식으로 붙습니다. 해외 구단 소속 선수를 데려오는 길은 아직 없습니다(관찰만).')}`,`<div class="wpc-l">${wpsClubsH(lg,K)}</div>`);
  return lt.bar+list+`<div class="ovs-side">${wpsKnowCard(lg,S)}</div>`; } /* 작업 화면 두 칸(KBO 출신 탭과 같은 구조): 명단 · 지식 */
Object.assign(A,{
  ovlWorld(v){ UI.it=UI.it||{}; UI.it.ovlv='world'; if(v)UI.it.wpsl=String(v); closeSheets(); A.go('league:ovs'); },
  wkDigT(){ G.cfg=G.cfg||{}; G.cfg.wkDig=G.cfg.wkDig===false; save(); render(); }
});
