/* ---------- 해외 리그(MLB·트리플A·NPB, 기타 CPBL·멕시코리그): KBO 출신 해외파 · 순위 · 역대 우승 · 진출 기록 ----------
   경기를 돌리지 않는 가벼운 리그(35a_ovs_league). 화면은 읽기만 한다(만들기는 날짜 진행 때) */
const ovsAwPills=(L,lg)=>(L&&L.aw||[]).map(k=>`<span class="pill warn">${esc(ovsAwNm(k,lg))}</span>`).join(' ');
function ovlView(){ if(!G.ovl||OVL_LGS.some(l=>!G.ovl[l]))return csec('해외 리그','<p class="small muted">다음 날짜 진행 때 해외 리그 기록이 시작됩니다.</p>');
  { const I=UI.it=UI.it||{}, o=I.ovlv; if(['MLB','AAA','NPB'].includes(o)){ I.ovlv='stand'; I.ovls=o; } else if(o==='etc'){ I.ovlv='stand'; I.ovls=I.ovle==='LMB'?'LMB':'CPBL'; } } /* 예전 탭(리그별 5개) → 순위 한 탭(해외 활성화 2-4) */
  const t=inTabs('ovlv',[['alum','KBO 출신'],['top','주목 선수'],['stand','순위'],['champ','역대 우승'],['moves','진출 기록']],'alum');
  if(t.cur==='stand'){ const e=inTabs('ovls',[['MLB','MLB'],['AAA','트리플A'],['NPB','NPB'],['CPBL','CPBL'],['LMB','멕시코리그']],'MLB'); return t.bar+e.bar+ovlStandView(e.cur); }
  if(t.cur==='top')return t.bar+ovlTopView();
  if(t.cur==='champ')return t.bar+ovlChampView();
  if(t.cur==='moves')return t.bar+abroadView();
  return t.bar+ovlAlumView(); }
/* 주목 선수: 게임이 기록을 쌓는 선수(KBO 출신 해외파·외국인 후보·관찰 명단)의 리그별 TOP 10. 공개 기록만 보인다(ovlTop) */
function ovlTopView(){ const P=ovlTopPool(), K=[['MLB','MLB'],['AAA','트리플A'],['NPB','NPB'],['etc','기타']], BB={}; for(const [k] of K)BB[k]=ovlTop(k,P);
  const lt=inTabs('ovlt',K.map(([k,l])=>[k,`${l} ${BB[k].bat.length+BB[k].pit.length}`]),K.map(([k])=>k).sort((a,b)=>(BB[b].bat.length+BB[b].pit.length)-(BB[a].bat.length+BB[a].pit.length))[0]), B=BB[lt.cur];
  const who=r=>{ if(r.pool)return {av:{id:r.id,name:r.name,age:r.age,isP:r.isP,foreign:'용병'},age:r.age}; if(!r.abr){ const p=G.players[r.id]; return {av:p,age:p.age}; } const a=(G.abroad||[]).find(z=>String(z.id)===String(r.id))||{}; let pj=null; try{ pj=a.pj?JSON.parse(a.pj):null; }catch(e){}
    const av=G.players[a.id]||pj||{id:a.id,name:a.name,age:a.age,isP:a.isP,foreign:a.foreign}; return {av,age:a.foreign?a.age+(G.year-a.y):av.age}; };
  const tg=r=>`<span class="pill${r.tag==='KBO 출신'?' acc':r.tag==='관찰 중'||ovqWatched(r.id)?' good':''}">${esc(ovqWatched(r.id)&&r.tag!=='관찰 중'?r.tag+' · 관찰':r.tag)}</span>`;
  const clubC=r=>{ const q=r.h||{}; return q.c!=null&&q.c>=0&&r.lvl!=='NPB 2군'&&OVL_C[ovlKey(r.lvl)]?ovqTeamBtn(r.lvl,q.c,r.club):esc(r.club); };
  const row=(r,i,cells)=>{ const w=who(r); return `<tr${r.pool?'':rowTap(r.abr?'person':'player',r.abr?'abr:'+r.id:r.id,r.name)}><td>${i+1}</td><td class="ovt-n"><span class="pm-n">${avImg(Object.assign({},w.av,{name:r.name}))}<span><b>${esc(r.name)}</b><i>${w.age??'-'}세 · ${esc(r.pos)} · ${clubC(r)}</i></span></span></td><td>${tg(r)}</td>${cells.map((c,k)=>`<td${k===0?' class="key"':''}>${c}</td>`).join('')}<td class="ovq-td">${ovqBtns(r.id,'ovq-tbl')}</td></tr>`; };
  const tb=(ttl,head,L,cell,none)=>csec(ttl,L.length?`<div class="tw ovt-w"><table class="tbl ovt-t"><thead><tr><th>#</th><th>선수</th><th>구분</th>${head.map(h=>`<th>${h}</th>`).join('')}<th>할 일</th></tr></thead><tbody>${L.map((r,i)=>row(r,i,cell(r))).join('')}</tbody></table></div>`:`<div class="muted ovt-e">${none}</div>`);
  const bat=tb(`타자 TOP 10 <span class="small muted">${B.minPA}타석 이상</span>`,['OPS','타율','홈런','타석'],B.bat,r=>[fmt3(r.s.ops),fmt3(r.s.avg),r.h.hr||0,r.h.pa],'기준 타석을 채운 타자가 없습니다.');
  const pit=tb(`투수 TOP 10 <span class="small muted">${ipStr(B.minOuts)}이닝 이상</span>`,['ERA','이닝','삼진','WHIP'],B.pit,r=>[r.s.era.toFixed(2),ipStr(r.h.outs),r.h.so||0,r.s.whip.toFixed(2)],'기준 이닝을 채운 투수가 없습니다.');
  const note=`<div class="note ovt-h">${B.last?`시즌 초반이라 ${B.y} 시즌 기록입니다.`:`${B.y} 시즌 진행 중 기록입니다.`} KBO 출신 해외파·외국인 후보·관찰 명단·해외 후보군 선수만 집계합니다.${hiI('게임이 기록을 쌓는 선수만 순위에 오릅니다. 해외 후보군은 트리플A·NPB·CPBL 등에서 뛰며 해마다 기록을 쌓다가 외국인 시장에 나오는 선수입니다. 기록은 시장 화면과 같은 공개 기록이고, 다른 구단도 똑같이 봅니다. 관찰 등록을 하면 해외 소식에 먼저 오르고, 외국인 시장에 나오면 시장 관찰 명단으로 옮깁니다. 영입 문의는 MLB 밖에서 뛰는 선수를 외국인 시장으로 불러 영입 협상 창을 엽니다. 겨울 시장(12월 1일~)과 시즌 중 교체 기간(8월 15일까지, 교체 횟수가 남았을 때)에 기간마다 3번까지 할 수 있고, 다른 구단도 같은 조건으로 문의합니다.')}</div>`;
  return lt.bar+note+bat+pit; }
function ovlYears(lg){ const L=G.ovl[lg]; const S=new Set([...(L.cur?[L.cur.y]:[]),...(L.h||[]).map(h=>h.y)]); return [...S].sort((a,b)=>b-a); }
const OVL_HELP={MLB:'30개 구단, 팀당 162경기. 지구 1위 3팀과 승률 상위 3팀이 리그마다 가을야구에 나갑니다(와일드카드 3전 2승 → 디비전 5전 3승 → 챔피언십 7전 4승 → 월드시리즈). 구단 전력은 해마다 조금씩 바뀝니다.',
  AAA:'30개 구단, 팀당 150경기. 인터내셔널리그(IL) 20개·퍼시픽코스트리그(PCL) 10개 구단이고, 구단마다 MLB 구단 하나의 산하입니다. 리그마다 두 지구 1위가 3전 2승으로 리그 우승을 가리고, 두 리그 우승팀이 단판 트리플A 챔피언십을 치릅니다.',
  NPB:'12개 구단, 팀당 143경기. 리그마다 3위까지 클라이맥스 시리즈(1위는 1승을 안고 시작)를 거쳐 재팬시리즈에서 맞붙습니다. 구단 전력은 해마다 조금씩 바뀝니다.',
  CPBL:'6개 구단, 팀당 120경기. 2·3위가 5전 3승으로 겨루고, 이긴 팀이 1위와 타이완시리즈(7전 4승)를 치릅니다.',
  LMB:'20개 구단(북부·남부 10개씩), 팀당 90경기. 지구마다 4위까지 7전 4승으로 지구 우승을 가리고, 두 지구 우승팀이 세리에 델 레이에서 맞붙습니다.'};
function ovlStandView(lg){ const ys=ovlYears(lg), nm=OVL_LBL[lg]; if(!ys.length)return csec(nm,emptyState('기록이 없습니다.'));
  const yt=inTabs('ovly'+lg,ys.slice(0,5).map(y=>[String(y),String(y)]),String(ys[0])); const y=+yt.cur; const T=ovlTable(lg,y); if(!T)return yt.bar;
  const S=T.S, AL=ovlAlumMap(lg,y), pct=r=>r.w+r.l?fmt3(r.w/(r.w+r.l)):'-', g=OVL_G[lg];
  const head=T.live?(T.gp?`정규시즌 진행 중 · 팀당 ${T.gp}경기(${g}경기 중)`:`${y} 시즌 개막 전 · 3월 말 개막`)+(T.gp>=g?' · 포스트시즌은 시즌을 마치면 발표':''):`${OVL_PS[lg]} <b>${esc(ovlNm(lg,S.ch))}</b> ${esc(S.sr||'')} · 준우승 ${esc(ovlNm(lg,S.ru))}`;
  const pnL=lg==='LMB'?'지구 우승':lg==='CPBL'?'결승 진출':'리그 우승';
  const D=T.div.map((d,k)=>{ const top=d.L[0], has=d.L.some(r=>AL[r.i]), key=`ovd_${lg}_${k}`, op=UI.open&&UI.open[key]!=null?UI.open[key]:has||lg==='NPB'||lg==='CPBL';
    const rows=d.L.map((r,i)=>{ const A=AL[r.i]||[]; const tag=!T.live&&S.ch===r.i?' <span class="pill warn">우승</span>':!T.live&&(S.pn||[]).includes(r.i)?` <span class="pill acc">${pnL}</span>`:!T.live&&(S.po||[]).includes(r.i)?' <span class="pill">가을야구</span>':'';
      const af=lg==='AAA'?`<span class="ovl-af">${esc(OVL_C.MLB[r.i][1])} 산하</span>`:'';
      return `<tr class="${A.length?'me':''}"><td class="ovl-c">${i+1} ${esc(ovlNm(lg,r.i))}${af}${tag}${A.length?`<span class="ovl-al">${A.map(a=>`<button class="lnk" data-a="person" data-v="abr:${a.id}">${esc(a.name)}</button>`).join(' ')}</span>`:''}</td><td>${r.w}</td><td>${r.l}</td><td class="key">${pct(r)}</td><td>${i?r.gb.toFixed(1):'-'}</td></tr>`; }).join('');
    return `<details class="ovl-d" data-k="${key}"${op?' open':''}><summary><b>${esc(d.nm)}</b><span class="small muted">1위 ${esc(ovlNm(lg,top.i))} ${top.w}승 ${top.l}패${has?' · KBO 출신 있음':''}</span></summary><div class="tbl-wrap"><table class="tbl ovl-t"><thead><tr><th>구단</th><th>승</th><th>패</th><th>승률</th><th>차</th></tr></thead><tbody>${rows}</tbody></table></div></details>`; }).join('');
  return yt.bar+csec(`${y} ${esc(nm)}${hiI(OVL_HELP[lg]||'')}`,`<p class="small">${head}</p>${D}`); }
/* KBO 출신 해외파: 지금 해외에 있는 선수(국내 선수·KBO를 떠난 외국인·관찰하던 후보) */
function ovlAlumView(){ const FT=inTabs('ovla',[['all','전체'],['mine','우리 구단 출신'],['kr','국내 선수'],['fo','외국인']],'all'), f=FT.cur, ft=FT.bar;
  const A=(G.abroad||[]).filter(a=>!a.back&&a.end==null&&(f==='all'||f==='mine'&&a.from===G.user||f==='kr'&&!a.foreign&&!a.cand||f==='fo'&&(a.foreign||a.cand)));
  const fr=ovlFrac(G.year), cur=a=>a.cur&&a.cur.y===G.year&&fr>0?ovsCurPart(a,fr):null;
  const rk=a=>(a.from===G.user?0:10)+(a.lg==='MLB'?0:a.lg==='NPB'?1:3)+(a.foreign||a.cand?4:0);
  const L=A.map(a=>({a,c:cur(a),l:(a.lines||[]).slice(-1)[0]})).sort((x,y)=>rk(x.a)-rk(y.a)||(y.l?ovsVal(y.l,y.a.isP):0)-(x.l?ovsVal(x.l,x.a.isP):0));
  const row=({a,c,l})=>{ const y1=a.y1??a.y+1, h=c||l, hc=h&&h.c!=null&&h.c>=0&&OVL_C[ovlKey(h.lvl)];
    const tr=hc?ovlTeamRec(h.lvl,h.c,h.y):a.ci!=null&&a.ci>=0?ovlTeamRec(a.lg,a.ci,h?h.y:G.year):null;
    const ln=h?`<span class="small">${h.y}${h.live?' 진행 중':''} ${esc(ovsLvlL(h.lvl))} · ${lineTxt(h,a.isP)}</span>${h.aw?` ${ovsAwPills(h,ovlKey(h.lvl))}`:''}${h.x?`<span class="small muted">시즌 중 ${esc(ovsLvlL(h.x.lvl))} · ${lineTxt(h.x,a.isP)}</span>`:''}`:`<span class="small muted">${y1>G.year?`${y1} 시즌부터 뜁니다`:'시즌 기록 집계 전'}</span>`;
    const tm=tr?`<span class="small muted">팀 ${tr.w}승 ${tr.l}패 · ${esc(tr.dn)} ${tr.rk}위${tr.ch?' · 우승':tr.pn?' · 결승 진출':tr.po?' · 가을야구':''}</span>`:'';
    const mv=(a.mv||[]).slice(-1)[0], mvT=mv&&mv.y>=G.year-1?`<span class="small muted">${mv.y} ${esc(mv.f)} → ${esc(mv.t)} 이적</span>`:'';
    const club=hc&&h.lvl==='트리플A'?`<b>${ovqTeamBtn('트리플A',h.c,ovsClubNm(h))}</b> (트리플A · ${esc(a.club||a.lg)} 산하)`:`<b>${a.ci!=null&&a.ci>=0&&OVL_C[ovlKey(a.lg)]?ovqTeamBtn(a.lg,a.ci,a.club||a.lg):esc(a.club||a.lg)}</b>${a.club&&a.club!==a.lg?` (${esc(a.lg)})`:''}`;
    const act=a.foreign||a.cand?ovqRowActs(a.id):'';
    return `<div class="abr" data-a="person" data-v="abr:${a.id}" role="button" tabindex="0">${a.from!=null?badge(a.from,26):''}<div><b>${esc(a.name)} <span class="small muted">${esc(a.pos)}${a.foreign?' · 외국인':''}${a.cand?' · 관찰했던 후보':''}</span></b>
      <span class="small">${club}</span>${mvT}${ln}${tm}${ovsBackTag(a)?`<span class="small"><b>${esc(ovsBackTag(a))}</b></span>`:''}${act}</div></div>`; };
  const list=csec(`KBO 출신 해외파 ${A.length}명${hiI('해외로 간 국내 선수, KBO를 떠나 해외에서 뛰는 외국인, 우리가 관찰하다 놓친 후보의 해외 성적입니다. KBO 출신 외국인·관찰했던 후보는 MLB 밖에서 뛰면 영입 문의로 외국인 시장에 부를 수 있고, 국내 선수가 돌아오면 이 화면 위에 복귀 협상이 보입니다. MLB 구단 소속이라도 실력이 모자라면 산하 트리플A에서 뜁니다. 시즌 중에는 지금까지의 기록이고, 시즌을 마치면 확정됩니다. 해외 기록은 외국인 영입·복귀 협상에서 우리와 다른 구단이 똑같이 참고합니다.')}`,
    ft+ovqBackList()+(L.length?`<div class="abl">${L.map(row).join('')}</div>`:emptyState('지금 해외에서 뛰는 KBO 출신 선수가 없습니다.')));
  return list+`<div class="ovs-side">${ovsSumCard()}${ovsFeedCard()}</div>`; } /* 작업 화면 두 칸(PC는 나란히, 휴대폰은 칸 넘김): 해외파 목록 · 시즌 요약과 소식 */
/* 해외파 시즌 요약(사용자 11-17): 국내 선수 해외파의 리그별 인원 · 부문 1위 · 소속 구단 순위. 이름을 누르면 인물 카드 */
function ovsSumCard(){ const S=ovsSeasonSum(), nmB=a=>`<button class="lnk" data-a="person" data-v="abr:${a.id}">${esc(a.name)}</button>`;
  const chip=(l,n)=>`<span class="ovs-chip${n?'':' muted'}"><b>${n}</b>${l}</span>`;
  const ld=(l,r,v)=>r?`<div class="ovs-ld"><span class="small muted">${l}</span>${nmB(r.a)}<b>${v}</b></div>`:'';
  const lds=[ld('홈런',S.hrL,S.hrL&&S.sb(S.hrL,'hr')+'개'),ld('OPS',S.opsL,S.opsL&&fmt3(bRate(S.opsL.l).ops)),ld('ERA',S.eraL,S.eraL&&pRate(S.eraL.l).era.toFixed(2)),ld('탈삼진',S.soL,S.soL&&S.sb(S.soL,'so')+'개')].join('');
  const LV=[['MLB','MLB'],['NPB','NPB'],['트리플A','트리플A']], seen=new Set();
  const rows=S.R.filter(r=>LV.some(([k])=>k===r.lv)).sort((x,z)=>LV.findIndex(([k])=>k===x.lv)-LV.findIndex(([k])=>k===z.lv)||(z.tr?z.tr.w-z.tr.l:-99)-(x.tr?x.tr.w-x.tr.l:-99)).map(r=>{ const k=r.lv+':'+(r.l.c??r.a.id); const on=S.R.filter(z=>z.lv===r.lv&&r.l.c!=null&&z.l.c===r.l.c); if(seen.has(k))return ''; seen.add(k); const tr=r.tr;
    return `<tr><td>${esc(r.lv==='트리플A'?'AAA':r.lv)}</td><td class="ovs-cl">${esc(ovsClubNm(r.l)||r.a.club||r.lv)}<span>${(on.length?on:[r]).map(z=>nmB(z.a)).join(' ')}</span></td><td>${tr?`${tr.w}-${tr.l}`:'-'}</td><td class="ovs-rk">${tr?`${esc(tr.dn)} ${tr.rk}위${tr.ch?' · 우승':tr.pn?' · 결승':tr.po?' · 가을야구':''}`:'-'}</td></tr>`; }).join('');
  const hd=S.live?(S.fr>0?`${S.y} 시즌 진행 중(${Math.round(S.fr*100)}%)`:`${S.y} 시즌`):`${S.y} 시즌 최종`;
  return csec(`해외파 시즌 요약${hiI('해외에서 뛰는 국내 선수(포스팅·해외 FA·아마추어 직행)만 셉니다. 시즌 중에는 지금까지의 기록입니다. 이름을 누르면 인물 카드가 열립니다.')}`,
    `<p class="small muted">${hd} · 국내 선수 ${S.R.length}명</p><div class="ovs-chips">${chip('MLB',S.n.MLB)}${chip('NPB',S.n.NPB)}${chip('트리플A',S.n.AAA)}${chip('기타',S.n.etc)}</div>`+(lds?`<div class="ovs-lds">${lds}</div>`:'')+(rows?`<div class="tbl-wrap"><table class="tbl ovs-st"><thead><tr><th>리그</th><th>구단 · 해외파</th><th>승-패</th><th>순위</th></tr></thead><tbody>${rows}</tbody></table></div>`:emptyState('올해 해외에서 뛰는 국내 선수가 없습니다.'))); }
/* 해외파 소식(사용자 11-17): 매주 홈런·무실점·콜업·강등·부상·올스타·시상. 저장은 최근 40건 */
function ovsFeedCard(){ const F=G.ovsFeed||[];
  const it=x=>`<li data-a="person" data-v="abr:${x.id}" role="button" tabindex="0"${x.p>=7?' class="hot"':''}><span class="small muted">${x.y!==G.year?x.y+' ':''}${esc(dmd(x.d))}</span><span>${esc(x.t)}</span></li>`;
  return csec(`해외파 소식${hiI('해외에서 뛰는 국내 선수의 한 주: 홈런·무실점·콜업·강등·부상·올스타·시상. KBO를 떠난 외국인·관찰했던 후보의 콜업·홈런·큰 시즌·한국행 추진도 함께 오릅니다. 우리 구단 출신과 해외 관찰 선수를 먼저 올립니다. 최근 40건까지 남습니다.')}`,F.length?`<ul class="ovs-feed">${F.map(it).join('')}</ul>`:emptyState('시즌이 시작되면 해외파 소식이 쌓입니다.')); }
function ovlChampView(){ const K=['MLB','AAA','NPB','CPBL','LMB'], H=K.map(lg=>G.ovl[lg].h||[]); const ys=[...new Set(H.flat().map(h=>h.y))].sort((a,b)=>b-a);
  const c=(lg,X)=>X?`<b>${esc(ovlNm(lg,X.ch))}</b><span class="small muted"> ${esc(X.sr||'')} · ${esc(ovlNm(lg,X.ru))}</span>`:'-';
  const cnt=lg=>{ const C={}; for(const h of G.ovl[lg].h||[])C[h.ch]=(C[h.ch]||0)+1; return Object.entries(C).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([i,n])=>`${esc(ovlNm(lg,+i))} ${n}회`).join(' · '); };
  return csec(`역대 우승${hiI(`최근 ${OVL_KEEP}시즌까지 남깁니다.`)}`,ys.length?`<div class="tbl-wrap"><table class="tbl ovl-ch"><thead><tr><th>시즌</th><th>우승 · 결승 점수 · 준우승</th></tr></thead><tbody>${ys.map(y=>`<tr><td>${y}</td><td>${K.map((lg,k)=>`<div class="ovl-chl"><span class="small muted">${esc(OVL_PS[lg])}</span> ${c(lg,H[k].find(h=>h.y===y))}</div>`).join('')}</td></tr>`).join('')}</tbody></table></div>
    <p class="small muted">최다 우승 · ${K.map(lg=>`${OVL_LBL[lg]} ${cnt(lg)||'-'}`).join(' · ')}</p>`:emptyState('아직 끝난 시즌이 없습니다.')); }
/* ----- 해외 활성화 5: 줄마다 할 수 있는 일(관찰 등록/해제 · 영입 문의 · 복귀 협상 · 구단 순위) ----- */
const ovqWatched=id=>{ try{ return ovwOn(id)||fwatchOn(id); }catch(e){ return false; } };
function ovqWhyShort(w){ w=String(w||''); if(!w)return ''; const y=w.match(/(\d{4})년부터/); return /12월 1일/.test(w)&&/교체/.test(w)?'교체 소진 · 12월 1일부터':/12월 1일/.test(w)?'12월 1일부터 문의':/개막 뒤/.test(w)?'시즌 중 교체 기간에 문의':y?`${y[1]}년부터 문의`:/MLB/.test(w)?'MLB에서 뛰는 중':/세라/.test(w)?'나이 많음':/보류권/.test(w)?'다른 구단 보류권':/시즌을 마친 뒤/.test(w)?'첫 해외 시즌 뒤':/다음 겨울/.test(w)?'다음 겨울에 문의':'문의 불가'; }
function ovqBtns(id,cls){ if(G.unemp)return ''; let t=null, why=''; try{ t=ovqTarget(id); why=t?ovqWhy(G.user,id):''; }catch(e){ return ''; } if(!t)return '';
  const on=t.k==='mkt'?fwatchOn(t.p.id):ovwOn(id), v=esc(String(t.id)), ask=t.k==='mkt'?'영입 협상':'영입 문의';
  return `<span class="ovq-acts${cls?' '+cls:''}"><button class="tc-i ovq-b${on?' on':''}" data-a="ovwT" data-v="${v}" aria-pressed="${on}" title="${on?'관찰을 그만둡니다':'관찰 명단에 올립니다'}">${on?'관찰 해제':'관찰 등록'}</button><button class="tc-i ovq-b${why?' off':''}" data-a="ovqAsk" data-v="${v}" title="${esc(why||(t.k==='mkt'?'외국인 영입 협상 창을 엽니다':'외국인 시장으로 불러 영입 협상 창을 엽니다'))}">${ask}</button></span>`; }
function ovqRowActs(id){ const b=ovqBtns(id); if(!b)return ''; let w=''; try{ w=ovqWhy(G.user,id); }catch(e){} return `<span class="ovq-row">${b}${w?`<span class="small muted">${esc(ovqWhyShort(w))}</span>`:''}</span>`; }
function ovqTeamBtn(lvl,c,label){ const k=ovlKey(lvl); if(!OVL_C[k]||c==null||c<0||lvl==='NPB 2군')return esc(label||''); return `<button class="lnk ovq-tm" data-a="ovlTeam" data-v="${k}:${c}" title="${esc(ovlNm(k,c))} 순위 보기">${esc(label||ovlNm(k,c))}</button>`; }
/* 돌아오는 국내 선수: 원소속 우선협상(우리 구단) 또는 자유계약으로 풀린 해외 복귀 선수 */
function ovqBackList(){ if(G.unemp)return ''; const R=[]; for(const a of G.abroad||[]){ if(!a.back||a.foreign||a.cand)continue; const p=G.players[a.id]; if(!p||p.team!=null)continue;
    if(p.retAsk&&p.retFrom===G.user){ const e=(G.evs||[]).find(x=>x.k==='ovsback'&&!x.done&&x.data&&x.data.pid===p.id); R.push({a,p,t:`원소속 ${p.retAsk.post?'보류권':'우선협상'} · 요구 ${p.retAsk.yrs}년 연 ${money(p.retAsk.sal)}`,b:e&&e.mid!=null?`<button class="tc-i ovq-b" data-a="openMail" data-v="${esc(String(e.mid))}">복귀 협상</button>`:''}); }
    else if(!p.retAsk&&p.freeSince!=null&&a.backY>=G.year-1)R.push({a,p,t:`자유계약 선수 · ${p.retMin?`복귀 요구액 근처 ${money(p.retMin.sal)} 이상`:'누구나 계약 가능'}`,b:`<button class="tc-i ovq-b" data-a="go" data-v="transfer:free">영입 협상</button>`}); }
  if(!R.length)return ''; return `<div class="ovq-back"><div class="eyebrow">국내 복귀 협상</div>${R.map(x=>`<div class="abr" data-a="person" data-v="abr:${x.a.id}" role="button" tabindex="0">${x.a.from!=null?badge(x.a.from,26):''}<div><b>${esc(x.p.name)} <span class="small muted">${esc(x.a.pos)} · ${x.p.age}세 · ${esc(x.a.lg)} ${(x.a.lines||[]).length}시즌</span></b><span class="small">${esc(x.t)}</span><span class="ovq-row">${x.b}</span></div></div>`).join('')}</div>`; }
/* 해외파 한 줄(인물 창·선수 기록 공통): 연도 · 수준 · 구단 · 기록 · 시상. 시즌 중 오르내린 다른 수준(x)은 뒤에 붙인다 */
function ovsLineRow(a,l){ const one=q=>`${esc(ovsLvlL(q.lvl))}${ovsClubNm(q)?` · ${esc(ovsClubNm(q))}`:''}: ${lineTxt(q,a.isP)}`;
  return `${l.y}${l.live?' 진행 중':''} ${one(l)}${l.aw?' '+ovsAwPills(l,ovlKey(l.lvl)):''}${l.x?` / ${one(l.x)}`:''}`; }
