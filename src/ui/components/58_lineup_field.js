/* ---------- 경기장 라인업(사용자 11-18): 골든글러브 보드(ggField)처럼 야구장 그림 위 포지션마다 얼굴·이름·타순·현재 능력(OVR)
   경기 전 라인업 소개(중계)와 선수단 → 전력 구성이 함께 쓴다. 지명타자는 옆(왼쪽 아래), 선발투수는 마운드.
   능력 숫자는 scoutReport(공개 범위·20-80 표시 설정 그대로)라 상대 2군처럼 모르는 선수는 '-' */
const LF_W=160, LF_H=100; /* 넓은 그림(16:10): PC 중계 패널 높이에 맞춰 카드가 겹치지 않게 */
const LF_SPOT={CF:[80,15],LF:[35,26],RF:[125,26],SS:[57,45],'2B':[103,45],'3B':[45,67],'1B':[115,67],P:[80,64],C:[80,88],DH:[18,87]};
/* 야구장 그림: 홈(80,92)에서 45° 파울라인, 담장은 양 폴과 중견수 쪽을 지나는 원호. 색은 골든글러브 보드와 같은 잔디·흙 */
let lfSeq=0; /* 그림마다 그라디언트 id를 따로(숨긴 쪽 id를 참조하면 잔디가 안 그려진다) */
function lfParkSVG(){ const u='lf'+(++lfSeq), hx=80,hy=93,L=76,q=L/Math.SQRT2,lx=hx-q,ly=hy-q,rx=hx+q,top=5,cy=((hx-lx)**2+ly*ly-top*top)/(2*(ly-top)),r=cy-top,d=21,dl=d*1.5;
  const base=(x,y)=>`<rect x="${(x-1.4).toFixed(1)}" y="${(y-1.4).toFixed(1)}" width="2.8" height="2.8" fill="#fff" transform="rotate(45 ${x} ${y})"/>`;
  return `<svg class="lf-bg" viewBox="0 0 ${LF_W} ${LF_H}" preserveAspectRatio="none" aria-hidden="true"><defs><radialGradient id="${u}G" cx="50%" cy="85%" r="80%"><stop offset="0" stop-color="#3f9a4e"/><stop offset="1" stop-color="#1c4d2a"/></radialGradient><linearGradient id="${u}D" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b98450"/><stop offset="1" stop-color="#7e5229"/></linearGradient><pattern id="${u}S" width="10" height="${LF_H}" patternUnits="userSpaceOnUse"><rect width="5" height="${LF_H}" fill="#fff" opacity=".05"/></pattern></defs>
    <path d="M${hx} ${hy+2} L${lx-2.5} ${ly-1} A${r+3} ${r+3} 0 0 1 ${rx+2.5} ${ly-1} Z" fill="#6b4a2a" opacity=".9"/><path d="M${hx} ${hy} L${lx} ${ly} A${r} ${r} 0 0 1 ${rx} ${ly} Z" fill="url(#${u}G)"/><path d="M${hx} ${hy} L${lx} ${ly} A${r} ${r} 0 0 1 ${rx} ${ly} Z" fill="url(#${u}S)"/>
    <path d="M${hx} ${hy+3} L${hx-dl} ${hy-dl+3} Q${hx} ${hy-2*dl} ${hx+dl} ${hy-dl+3} Z" fill="url(#${u}D)"/><path d="M${hx} ${hy-3} L${hx+d-3} ${hy-d} L${hx} ${hy-2*d+3} L${hx-d+3} ${hy-d} Z" fill="#3a8a47"/><ellipse cx="${hx}" cy="${hy-d-1}" rx="3.4" ry="2.6" fill="#a9733f"/>
    <path d="M${hx} ${hy} L${lx} ${ly} M${hx} ${hy} L${rx} ${ly}" stroke="#f3f1e4" stroke-width=".5"/>${base(hx+d,hy-d)}${base(hx,hy-2*d)}${base(hx-d,hy-d)}<path d="M${hx-1.4} ${hy-.6} h2.8 v1.3 l-1.4 1.3 l-1.4 -1.3 z" fill="#fff"/></svg>`; }
const lfOvr=p=>{ if(!p)return null; try{ const r=scoutReport(p); return r&&r.cur!=null?r.cur:null; }catch(e){ return null; } };
/* 카드 하나: 얼굴(타순 원·OVR 칩) + 이름표(이름·포지션). act면 눌러서 선수 화면 */
function lfCard(x,act){ const [sx,sy]=LF_SPOT[x.pos]||LF_SPOT.DH, p=x.p, nm=p?p.name:x.name||'', ov=lfOvr(p), tag=x.pos==='P'?'선발':x.no||'', pk=x.pos==='P'?'선발투수':x.pos==='DH'?'지명타자':POSK[x.pos]||x.pos;
  const at=act&&p?`button type="button" data-a="player" data-v="${p.id}"`:'div';
  return `<${at} class="lf-m${x.pos==='P'?' sp':''}${x.me?' me':''}" style="left:${(sx/LF_W*100).toFixed(2)}%;top:${(sy/LF_H*100).toFixed(2)}%" data-pos="${x.pos}" title="${esc(pk)} ${esc(nm)}${ov!=null?' · 현재 능력 '+dv(ov):''}"><span class="lf-ph">${p?avImg(p,true):`<span class="av ini big">${esc(nm.slice(0,1)||'?')}</span>`}<i class="lf-no">${tag}</i><span class="lf-ov">${rchip(ov)}</span></span><span class="lf-nb"><b>${esc(nm)}</b><em>${esc(x.pos==='P'?'선발':POSS[x.pos]||x.pos)}</em></span></${at.split(' ')[0]}>`; }
/* o={tid, rows:[{p,name,pos,no}], sp:{p,name}, sub, act, note} → 경기장 보드 한 장 */
function lineupField(o){ const tid=o.tid, col=typeof cTeamCol==='function'?cTeamCol(tid):'#c33';
  const cards=(o.rows||[]).map(r=>lfCard(r,o.act)).join('')+(o.sp?lfCard({...o.sp,pos:'P'},o.act):'');
  const ovs=(o.rows||[]).map(r=>lfOvr(r.p)).filter(v=>v!=null), avg=ovs.length===(o.rows||[]).length&&ovs.length?Math.round(ovs.reduce((a,b)=>a+b,0)/ovs.length):null;
  return `<div class="lf" style="--tc:${col}"><div class="lf-box">${lfParkSVG()}<div class="lf-hd">${badge(tid,30)}<span><b>${esc(tname(tid))}</b>${o.sub?`<small>${esc(o.sub)}</small>`:''}</span></div>${avg!=null?`<div class="lf-avg" title="선발 타자 9명 현재 능력 평균"><span>야수 평균</span>${rchip(avg)}</div>`:''}${cards}${o.note?`<div class="lf-note">${o.note}</div>`:''}</div></div>`; }
/* 다음 경기 기준 감독 라인업(전력 구성): 타순·수비 위치(depth)와 예상 선발(projStarters) */
function lineupFieldTeam(tid,act){ const d=depth(tid), order=orderList(d.start,tid), posOf={}; for(const k in d.ln)posOf[d.ln[k].id]=k;
  let sp=null; try{ sp=(projStarters(tid,1)[0]||{}).sp||null; }catch(e){}
  return lineupField({tid,act,sub:`${G.mgr[tid]?G.mgr[tid].name+' 감독 · ':''}${tid===G.user?'감독 라인업':'예상 라인업'}`,rows:order.map((p,i)=>({p,pos:posOf[p.id]||p.pos,no:i+1,me:false})),sp:sp?{p:sp}:null}); }
/* 벤치·투수진 요약(경기장 보기 아래): 이름 + 자리 + 능력 칩 */
function lineupFieldBench(tid){ const d=depth(tid), chip=(p,l)=>`<button class="lnk" data-a="player" data-v="${p.id}">${esc(p.name)}<i>${l} ${rchip(lfOvr(p))}</i></button>`, roles=['마무리','필승조','필승조','추격조','추격조','롱릴리프','롱릴리프'];
  let next=null; try{ next=(projStarters(tid,1)[0]||{}).sp||null; }catch(e){}
  return `<div class="lf-sum">${d.bench.length?`<div><div class="eyebrow">벤치 ${d.bench.length}명</div><div class="gl-chips">${d.bench.map(p=>chip(p,SLK[pSlot(p)]||posLabel(p))).join('')}</div></div>`:''}<div><div class="eyebrow">선발 로테이션</div><div class="gl-chips">${d.sp.filter(p=>p!==next).map((p,i)=>chip(p,`${d.sp.indexOf(p)+1}선발`)).join('')}</div></div><div><div class="eyebrow">불펜</div><div class="gl-chips">${d.pen.slice(0,7).map((p,i)=>chip(p,roles[i]||'불펜')).join('')}</div></div></div>`; }
/* 전력 구성 오른쪽 카드: '목록 보기 / 경기장 보기' 전환(기본 목록) + 경기장 보기는 우리 팀·다음 상대 탭 */
function lineupFieldToggle(){ const v=UI.lufView==='field'?'field':'list'; return `<div class="seg lf-seg" role="group" aria-label="라인업 보기 방식"><button type="button" data-a="lufView" data-v="list" class="${v==='list'?'on':''}" aria-pressed="${v==='list'}">목록 보기</button><button type="button" data-a="lufView" data-v="field" class="${v==='field'?'on':''}" aria-pressed="${v==='field'}">경기장 보기</button></div>`; }
function lineupFieldPanel(tid){ let op=null; if(tid===G.user){ try{ const x=nextGames(1)[0]; op=x&&x.op!=null&&G.teams[x.op]?x.op:null; }catch(e){} }
  const cur=op!=null&&UI.lufTeam===op?op:tid;
  const tabs=op!=null?`<div class="chips optrow lf-tabs" role="group" aria-label="구단">${[tid,op].map(t=>`<button type="button" data-a="lufTeam" data-v="${t}" class="${t===cur?'on':''}" aria-pressed="${t===cur}">${badge(t,14)} ${esc(tshort(t))}${t===op?' <small>다음 상대</small>':''}</button>`).join('')}</div>`:'';
  return `<div class="lf-panel">${tabs}${lineupFieldTeam(cur,true)}${lineupFieldBench(cur)}</div>`; }
Object.assign(A,{
  lufView(v){ UI.lufView=v==='field'?'field':'list'; render(); },
  lufTeam(v){ UI.lufTeam=+v; render(); },
  /* 경기 전 화면: 경기장 보기 ↔ 목록 보기(다시 그리지 않고 표시만 바꾼다. 3D 로딩 중이라) */
  prepView(v){ UI.prepView=v==='list'?'list':'field'; UI.prepAt=Date.now(); const el=document.querySelector('.cs-prep'); if(el)el.dataset.view=UI.prepView; document.querySelectorAll('.cs-prep-view button').forEach(b=>{ const on=b.dataset.v===UI.prepView; b.classList.toggle('on',on); b.setAttribute('aria-pressed',on); }); }
});
