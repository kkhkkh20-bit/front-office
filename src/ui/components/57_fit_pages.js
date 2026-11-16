/* ---------- PC 목록 쪽 나눔(UI 3단계 3-0, 구단주 11-16 "드래그 없게, 넘치면 탭처럼") ----------
   PC(1100px 이상)에서 상자 안 목록·표가 칸보다 길어 스크롤바가 생기면, 칸에 들어가는 줄만 보이고 '‹ 1/4 ›'로 넘긴다.
   페이지와 상자가 같이 스크롤되는 이중 스크롤을 없앤다. 휴대폰은 화면 전체가 한 번에 내려가므로 그대로 둔다.
   표는 tbody 줄, 그 밖의 목록은 칸의 직계 자식(같은 모양 줄 4개 이상)을 나눈다. 이미 쪽 나눔이 있는 목록(.pgr 옆)과 경기 중계는 건드리지 않는다. */
const FP_SKIP='.cast,.cs-bg,.match-dashboard,.fdl-main,.free-list,.pf-overview,.mmenu,.cfm,.ws-tab-row,.chips,.seg,.subtabs,.fbar-p,.ibx-list,.ibs-box,.talk,.meet';
function fpRows(c){
  const tb=c.matches('table')?c:c.querySelector(':scope>table,:scope>.tw>table,:scope>div>table');
  if(tb&&tb.tBodies[0]&&c.contains(tb)){ const rows=[...tb.tBodies[0].rows].filter(r=>r.getClientRects().length); return {rows,table:tb}; }
  const kids=[...c.children].filter(e=>e.getClientRects().length&&!e.matches('h2,h3,h4,.fp-bar,.pgr,.twpg,summary,p.small,p.note,.note'));
  if(kids.length<4)return null;
  const big=kids.filter(e=>e.getBoundingClientRect().height>c.clientHeight-34).length; if(big)return null; /* 한 쪽에 한 줄도 안 들어가면 목록이 아니다 */
  return {rows:kids,table:null};
}
function fitPages(){
  if(typeof document==='undefined')return;
  document.querySelectorAll('.fp-bar').forEach(b=>b.remove()); document.querySelectorAll('.fp-off').forEach(r=>r.classList.remove('fp-off')); document.querySelectorAll('.fp-on').forEach(c=>c.classList.remove('fp-on'));
  if(innerWidth<1100||(typeof workspaceCompact==='function'&&workspaceCompact()))return;
  UI.fpPg=UI.fpPg||{}; let ix=0; const scope=(UI.sheet!=null||UI.person||UI.teamSh!=null)?'s':(UI.tab+':'+(UI.sub||''));
  const roots=[...document.querySelectorAll('#app main.content,#sheet .sheet')];
  for(const root of roots){
    const cands=[...root.querySelectorAll('*')].filter(c=>{ const s=getComputedStyle(c); return /(auto|scroll)/.test(s.overflowY)&&c.scrollHeight>c.clientHeight+4&&c.clientHeight>=80&&c.getClientRects().length&&!c.closest(FP_SKIP)&&!(c.nextElementSibling&&c.nextElementSibling.matches('.pgr')); });
    /* 안쪽부터: 바깥 칸이 안쪽 칸을 줄로 삼지 않게 */
    for(const c of cands.reverse()){
      if(c.querySelector('.fp-on'))continue;
      const R=fpRows(c); if(!R||R.rows.length<4)continue;
      const key=scope+':'+(ix++)+':'+R.rows.length;
      const firstTop=R.rows[0].getBoundingClientRect().top, avail=c.clientHeight-(firstTop-c.getBoundingClientRect().top+c.scrollTop)-34;
      if(avail<40)continue;
      const pages=[]; let start=0, st=firstTop;
      R.rows.forEach((r,i)=>{ const b=r.getBoundingClientRect(); if(i>start&&b.bottom-st>avail){ pages.push([start,i]); start=i; st=b.top; } }); pages.push([start,R.rows.length]);
      if(pages.length<2)continue;
      const pg=Math.min(UI.fpPg[key]||0,pages.length-1); const [a,z]=pages[pg];
      R.rows.forEach((r,i)=>{ if(i<a||i>=z)r.classList.add('fp-off'); });
      c.classList.add('fp-on'); c.scrollTop=0;
      const bar=document.createElement('div'); bar.className='fp-bar';
      bar.innerHTML=`<button type="button" class="tc-i" ${pg>0?'':'disabled'} aria-label="앞 쪽">‹</button><span class="num">${pg+1} / ${pages.length}</span><button type="button" class="tc-i" ${pg<pages.length-1?'':'disabled'} aria-label="다음 쪽">›</button>`;
      const [bp,bn]=bar.querySelectorAll('button'); const go=d=>{ UI.fpPg[key]=pg+d; fitPages(); };
      bp.onclick=()=>go(-1); bn.onclick=()=>go(1); c._fpGo=go; c._fpPages=pages; c._fpKey=key; c._fpRows=R.rows;
      c.append(bar); c._fpH=c.clientHeight; fpObs()?.observe(c);
    }
  }
}
/* 칸 높이가 나중에 바뀌면(작업 화면 높이 재계산·창 크기 변경) 다시 나눈다. 같은 높이면 아무것도 하지 않아 되풀이되지 않는다 */
let _fpRO=null,_fpRAF=0;
function fpObs(){ if(_fpRO||typeof ResizeObserver==='undefined')return _fpRO; _fpRO=new ResizeObserver(es=>{ if(!es.some(e=>e.target.isConnected&&Math.abs(e.target.clientHeight-(e.target._fpH||0))>2))return; cancelAnimationFrame(_fpRAF); _fpRAF=requestAnimationFrame(()=>{ try{ _fpRO.disconnect(); fitPages(); }catch(e){} }); }); return _fpRO; }
/* 숨은 쪽에 있는 줄을 보여 준다(검색·바로 가기·검사용 workspaceReveal) */
function fitPagesReveal(el){ const row=el&&el.closest('.fp-off'); if(!row)return; const c=row.closest('.fp-on'); if(!c||!c._fpPages)return; const i=(c._fpRows||[]).indexOf(row); if(i<0)return; const p=c._fpPages.findIndex(([a,z])=>i>=a&&i<z); if(p>=0){ UI.fpPg[c._fpKey]=p; fitPages(); } }
if(typeof addEventListener!=='undefined'){ let t=0; addEventListener('resize',()=>{ try{ fitPages(); }catch(e){} cancelAnimationFrame(t); t=requestAnimationFrame(()=>{ try{ fitPages(); }catch(e){} }); }); } /* 크기가 바뀌는 그 자리에서 다시 나눈다(이전 크기의 쪽이 남아 줄이 잘려 보이지 않게) */
