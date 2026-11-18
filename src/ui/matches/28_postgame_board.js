/* ---------- 경기 후 전광판(사용자 11-18) ----------
   "경기가 끝나면 전광판처럼 한눈에: 누가 승·패, 어느 이닝에 점수를 냈는지."
   그래픽 중계 마지막 화면, 문자 중계 끝, 경기 결과 카드, 박스스코어 맨 위(다른 구단끼리 경기 포함)에 같은 판을 쓴다.
   이닝 점수(연장·치르지 않은 9회말 X) · R/H/E/B · 승·패·세·홀 · 결승타 · 홈런(시즌 n호) · 경기 MVP · 구장·관중.
   기록은 경기 기록(g.line·g.hits·박스스코어·g.pg)만 읽는다. g.pg가 없는 옛 기록은 남은 타석 기록에서 다시 계산한다. */
const PGB_KIND={'1B':'안타','2B':'2루타','3B':'3루타','HR':'홈런','BB':'볼넷','HBP':'몸에 맞는 공','SF':'희생플라이','SAC':'희생번트','GB':'땅볼','FB':'뜬공','LD':'직선타','PU':'뜬공','OUT':'타점'};
function pgbFacts(g){ let s=g.pg; if(!s||(!s.hr&&!s.gw)){ try{ s=Object.assign({},s||{},pgSum(g,false)); }catch(e){ s=s||{}; } } return s; }
function pgbName(g,id){ try{ const q=['h','a'].map(k=>g.box[k]).flatMap(B=>[...(B.bat||[]),...(B.pit||[])]).find(x=>x.id===id); return (q&&q.n)||G.players[id]?.name||''; }catch(e){ return G.players[id]?.name||''; } }
function pgbSideOf(g,id){ return (g.box.a.bat||[]).some(x=>x.id===id)||(g.box.a.pit||[]).some(x=>x.id===id)?'a':'h'; }
function pgbInn(h){ return `${Math.floor(h/2)+1}회${h%2?'말':'초'}`; }
/* opts.slim: 머리(큰 점수·팀)를 빼고 이닝 표·결정 투수만(이미 점수를 크게 보여 주는 카드 안) */
function pgBoard(g,opts){ if(!g||!g.line||!g.box)return ''; opts=opts||{};
  try{
  const n=Math.max(9,g.line.a.length,g.line.h.length), cols=[...Array(n).keys()], tie=g.hs===g.as, win=tie?null:g.hs>g.as?'h':'a';
  const sum0=L=>(L||[]).reduce((a,v)=>a+(typeof v==='number'?v:0),0);
  const hasE=(g.box.h.bat||[]).some(b=>b.e!=null), E=k=>(g.box[k].bat||[]).reduce((a,b)=>a+(b.e||0),0), B=k=>(g.box[k].bat||[]).reduce((a,b)=>a+(b.bb||0)+(b.hbp||0),0);
  const H=k=>g.hits&&g.hits[k]?sum0(g.hits[k]):(g.box[k].bat||[]).reduce((a,b)=>a+(b.h||0),0);
  const tid=k=>k==='h'?g.home:g.away, R=k=>k==='h'?g.hs:g.as;
  const cell=(k,i)=>{ const v=g.line[k][i]; if(v==='X')return '<i class="pgb-x">X</i>'; if(v==null)return '<i class="pgb-no"></i>'; return `<i class="${v>0?'pgb-on':''}">${v}</i>`; };
  const nameCol=`<div class="pgb-col pgb-tcol"><i class="hd">팀</i>${['a','h'].map(k=>`<i class="tn${win===k?' w':''}${tid(k)===G.user?' me':''}" style="--tc:${pgbCol(tid(k))}">${esc(tshort(tid(k)))}</i>`).join('')}</div>`;
  const innCols=`<div class="pgb-inn" tabindex="0" aria-label="이닝별 점수">${cols.map(i=>`<div class="pgb-col${i>=9?' ex':''}"><i class="hd">${i+1}</i>${cell('a',i)}${cell('h',i)}</div>`).join('')}</div>`;
  const tot=(lab,f,cls,ti)=>`<div class="pgb-col ${cls||''}"><i class="hd"${ti?` title="${ti}"`:''}>${lab}</i>${['a','h'].map(k=>`<i>${f(k)}</i>`).join('')}</div>`;
  const totCols=`<div class="pgb-tot">${tot('R',R,'r','득점')}${tot('H',H,'','안타')}${hasE?tot('E',E,'','실책'):''}${tot('B',B,'','4사구(볼넷+몸에 맞는 공)')}</div>`;
  const grid=`<div class="pgb-grid" role="table" aria-label="이닝별 점수 전광판">${nameCol}${innCols}${totCols}</div>`;
  /* 결정 투수 */
  const S=pgbFacts(g), rec=S.rec||{}; const pits=['a','h'].flatMap(k=>(g.box[k].pit||[]).map(q=>({...q,k})));
  const recTxt=(q,d)=>{ const r=rec[q.id]; if(!r)return ''; return d==='승'||d==='패'?`${r[0]}승 ${r[1]}패${r[2]?` ${r[2]}세`:''}`:d==='세'?`시즌 ${r[2]}세이브`:`시즌 ${r[3]}홀드`; };
  const dec=(d,lab,cls)=>{ const L=pits.filter(q=>q.d===d); if(!L.length)return ''; return `<span class="pgb-d ${cls}"><em>${lab}</em>${L.map(q=>`<button data-a="player" data-v="${q.id}" style="--tc:${pgbCol(tid(q.k))}"><b>${esc(pgbName(g,q.id))}</b><small>${esc(tshort(tid(q.k)))}${recTxt(q,d)?` · ${recTxt(q,d)}`:''}</small></button>`).join('')}</span>`; };
  const decs=[dec('승','승','w'),dec('패','패','l'),dec('세','세','s'),dec('홀','홀드','hd')].filter(Boolean).join('');
  /* 결승타·홈런·MVP */
  const info=[];
  if(win){ const gw=S.gw; if(gw&&gw[1]!=null)info.push(`<span class="pgb-i"><em>결승타</em><button data-a="player" data-v="${gw[1]}"><b>${esc(pgbName(g,gw[1]))}</b></button><small>${pgbInn(gw[0])} ${esc(PGB_KIND[gw[2]]||'타점')}</small></span>`);
    else if(!S.gw&&!(g.pbp&&g.pbp.length)&&!g.pg){ const k=typeof gmKey==='function'?gmKey(g):{}; if(k.gw)info.push(`<span class="pgb-i"><em>결승</em><small>${esc(k.gw)}</small></span>`); }
    else info.push('<span class="pgb-i"><em>결승타</em><small>없음</small></span>'); }
  { let L=(S.hr||[]).map(x=>({h:x[0],id:x[1],r:x[2],n:x[3]}));
    if(!L.length&&!(g.pbp&&g.pbp.length)&&!g.pg)for(const k of ['a','h'])for(const b of g.box[k].bat||[])for(let j=0;j<(b.hr||0);j++)L.push({h:null,id:b.id,r:0,n:null}); /* 문자 기록이 지워진 옛 경기: 이닝 없이 */
    if(L.length)info.push(`<span class="pgb-i pgb-hr"><em>홈런</em>${L.map(x=>`<button data-a="player" data-v="${x.id}" style="--tc:${pgbCol(tid(pgbSideOf(g,x.id)))}"><b>${esc(pgbName(g,x.id))}</b><small>${x.h!=null?pgbInn(x.h):''}${x.r>1?` ${x.r===4?'만루':x.r+'점'}`:x.h!=null?' 솔로':''}${x.n?` · 시즌 ${x.n}호`:''}</small></button>`).join('')}</span>`); }
  { let m=null; try{ m=typeof gameMvpOf==='function'?gameMvpOf(g):null; }catch(e){}
    if(m)info.push(`<span class="pgb-i pgb-mvp"><em>경기 MVP</em><b>${esc(m.n)}</b><small>${esc(tshort(m.t))} · ${esc(m.line||'')}</small></span>`);
    else if(g.pbp&&g.pbp.length&&typeof gameMvp==='function'){ try{ const t=gameMvp(g); if(t&&t.p)info.push(`<span class="pgb-i pgb-mvp"><em>오늘의 선수</em><button data-a="player" data-v="${t.p.id}"><b>${esc(t.p.name)}</b></button></span>`); }catch(e){} } }
  const xi=Math.max(g.line.a.length,g.line.h.length);
  const meta=[(()=>{ try{ return typeof stadNameAt==='function'?stadNameAt(g.home,g.day):stadName(g.home); }catch(e){ return ''; } })(), g.day!=null?dstr(g.day):'', g.att?`관중 ${g.att.toLocaleString('ko-KR')}명${g.so?'(매진)':''}`:''].filter(Boolean).map(esc).join(' · ');
  const st=tie?'무승부':xi>9?`연장 ${xi}회 · 경기 종료`:'경기 종료';
  const tm=k=>`<div class="pgb-tm ${k}${win===k?' w':win?' l':''}" style="--tc:${pgbCol(tid(k))}">${badge(tid(k),opts.small?28:40)}<span><b>${esc(tname(tid(k)))}</b><small>${k==='a'?'원정':'홈'}${win===k?' · 승리':win?' · 패배':''}</small></span></div>`;
  const head=opts.slim?'':`<header class="pgb-head">${tm('a')}<div class="pgb-sc"><span class="pgb-led${win==='a'?' w':''}">${g.as}</span><i>:</i><span class="pgb-led${win==='h'?' w':''}">${g.hs}</span><em>${esc(st)}</em></div>${tm('h')}</header>${meta?`<div class="pgb-meta">${g.kind?`<b>${esc(g.kind)}</b> · `:''}${meta}</div>`:''}`;
  return `<section class="pgb${opts.slim?' slim':''}${opts.cls?' '+opts.cls:''}" aria-label="경기 결과 전광판">${head}${grid}${decs?`<div class="pgb-decs">${decs}</div>`:''}${info.length&&!opts.noInfo?`<div class="pgb-info">${info.join('')}</div>`:''}</section>`;
  }catch(e){ console.error(e); return typeof lineScore==='function'?lineScore(g,null):''; }
}
function pgbCol(tid){ try{ const t=G.teams[tid]; return t?tpal(t)[3]:'#888'; }catch(e){ return '#888'; } }
