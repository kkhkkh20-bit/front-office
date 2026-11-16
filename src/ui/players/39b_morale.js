/* ===== 기분 이유 목록·팀 분위기 화면(엔진: 30_chemistry) =====
 한 줄에 한 가지, 오른쪽에 방향과 크기만 말로. 숫자는 보이지 않는다. 설명은 ⓘ 안에 */
const MOR_TIP='기분은 매주 출전·팀 성적·팀 분위기·주장·수석코치로 조금씩 움직이고, 면담·약속·연봉·부상 같은 일로 한 번에 움직입니다. 최근 5주 동안 실제로 기분을 움직인 것만 보입니다. 쌓인 불만은 기분과 따로 쌓이며, 커지면 언론 플레이·트레이드 요구로 번집니다.';
const MOR_TIP_SC='맡은 프로 스카우트가 그 구단 주변에서 들은 이야기입니다. 출전 상황·팀 성적·팀 분위기·밖으로 알려진 일만 들립니다.';
function morMark(x,scout){ if(x.wait)return ['','대기']; if(x.grv)return ['warn','불만']; const c=x.v>0?'good':'bad'; return [c,scout?(x.v>0?'좋게':'나쁘게'):`${x.big?'크게':'조금'} ${x.v>0?'좋게':'나쁘게'}`]; }
function morRows(L,scout){ return `<ul class="mrl">${L.map(x=>{ const [c,m]=morMark(x,scout); return `<li><span>${esc(x.t)}</span><em class="${c}">${m}</em></li>`; }).join('')}</ul>`; }
/* 선수 기분 이유: 우리 선수는 전체(max줄까지), 다른 구단 선수는 스카우트가 들은 것만 */
function moraleBox(p,max){ if(!p||p.team==null||p.prospect)return ''; const mine=p.team===G.user&&!G.unemp;
  if(mine){ const L=moraleList(p).slice(0,max||8); return `<div class="mrl-box"><div class="mrl-h">기분에 영향을 주는 것${hiI(MOR_TIP)}</div>${L.length?morRows(L):'<p class="small muted">요즘은 기분을 크게 움직인 일이 없습니다.</p>'}</div>`; }
  const L=moraleScout(p); return `<div class="mrl-box"><div class="mrl-h">들리는 이야기${hiI(MOR_TIP_SC)}</div>${L.length?morRows(L,true):`<p class="small muted">${(()=>{ try{ return coverOf(p.team).sc; }catch(e){ return null; } })()?'특별히 들리는 이야기는 없습니다.':'이 구단을 맡은 프로 스카우트가 없어 들리는 이야기가 없습니다.'}</p>`}</div>`; }
/* 팀 분위기 한 단어 + ⓘ(이유를 말로). 우리 구단은 이름까지, 다른 구단은 보도로 알려진 정도 */
function chemTip(tid){ const me=tid===G.user&&!G.unemp; const W=chemWhy(tid,me).slice(0,me?4:2).map(x=>`${x.t}(${x.v>0?'좋게':'나쁘게'})`);
  return `${me?'':'언론 보도와 소문으로 본 분위기입니다. '}${W.length?W.join(' · '):'눈에 띄는 이유는 없습니다.'} · 분위기는 주장·고참, 분위기를 흐리는 선수, 성적, 선수단 변화, 감독·기강, 출전 불만, 선수들 기분으로 정해지고 선수 기분에 조금씩 영향을 줍니다.`; }
function chemLine(tid){ const c=clubChem(tid); return `<span class="pill ${chemCls(c.v)}">${chemWord(c.v)}</span>${hiI(chemTip(tid))}`; }
/* 리더십 탭 카드: 분위기 단어, 흐름, 이유 몇 줄 */
function chemCard(tid){ if(G.unemp||tid==null)return ''; const c=clubChem(tid), me=tid===G.user; const W=chemWhy(tid,me).slice(0,5);
  const tr=c.T-c.v>=3?'좋아지는 중':c.T-c.v<=-3?'나빠지는 중':'';
  return `<section class="card chem-card"><div class="row between"><h2 class="sec">팀 분위기${hiI('분위기는 주장·고참, 분위기를 흐리는 선수, 성적, 선수단 변화, 감독·기강, 출전 불만, 선수들 기분으로 정해집니다. 한 주에 조금씩 움직이고, 선수 기분에 조금씩 영향을 줍니다. 다른 구단도 같은 규칙입니다.')}</h2><span><span class="pill ${chemCls(c.v)}">${chemWord(c.v)}</span>${tr?` <span class="small muted">${tr}</span>`:''}</span></div>
    ${W.length?morRows(W.map(x=>({t:x.t,v:x.v,big:Math.abs(x.v)>=4}))):'<p class="small muted">눈에 띄는 이유는 없습니다.</p>'}</section>`; }
