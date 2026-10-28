/* ---------- 휴대폰 표: 가로 스크롤 대신 버튼으로 열 묶음을 넘긴다 ----------
   세로는 페이지 스크롤 하나만 쓰고(표 안에 스크롤 상자를 만들지 않는다), 첫 열(이름)은 늘 보인다.
   열 폭을 재서 화면에 들어가는 만큼씩 묶고 '◀ 1/3 ▶'로 넘긴다. 넓은 화면도 표가 넘칠 때만 같은 방식 */
const TWP_W=600;
function twPager(){ if(typeof document==='undefined')return; const narrow=innerWidth<=TWP_W; UI.twPg=UI.twPg||{};
  document.querySelectorAll('.tw,.fdt-w').forEach((tw,ix)=>{ if(tw.closest('.cs-bg'))return; const tb=tw.querySelector(':scope > table'); if(!tb||!tb.tHead)return;
    tw.querySelectorAll(':scope > .twpg').forEach(x=>x.remove()); tb.querySelectorAll('.twh').forEach(c=>c.classList.remove('twh')); tw.classList.remove('twp');
    if(tb.scrollWidth<=tw.clientWidth+4)return; void narrow; /* 넓은 화면도 표가 넘치면 같은 방식으로 넘긴다 */
    const hr=tb.tHead.rows[tb.tHead.rows.length-1]; const H=[...hr.cells]; const n=H.length; if(n<3||H.some(c=>c.colSpan>1))return;
    tw.classList.add('twp'); /* 줄인 이름 칸 기준으로 폭을 잰다 */
    const rows=[...tb.rows].filter(r=>r.cells.length===n); /* 그룹 제목처럼 칸이 합쳐진 줄은 그대로 둔다 */
    const w=H.map(c=>c.getBoundingClientRect().width); const avail=tw.clientWidth-w[0]-2; const pages=[]; let cur=[],sum=0;
    for(let i=1;i<n;i++){ if(cur.length&&sum+w[i]>avail){ pages.push(cur); cur=[]; sum=0; } cur.push(i); sum+=w[i]; } if(cur.length)pages.push(cur);
    if(pages.length<2){ tw.classList.remove('twp'); return; }
    const key=(UI.sheet!=null&&tw.closest('#sheet')?'s':UI.tab)+':'+ix+':'+n; let pg=Math.min(UI.twPg[key]||0,pages.length-1);
    const show=new Set([0,...pages[pg]]);
    for(const r of rows)[...r.cells].forEach((c,i)=>{ if(!show.has(i))c.classList.add('twh'); });
    tw.classList.add('twp');
    const hn0=c=>{ const e=c.querySelector('button')||c; const t=[...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim(); return (t||e.innerText.split('\n')[0]).replace(/[▲▼]/g,'').trim(); };
    const lab=i=>{ const a=hn0(H[pages[i][0]]), b=hn0(H[pages[i][pages[i].length-1]]); return a===b||!b?a:`${a} ~ ${b}`; };
    const bar=document.createElement('div'); bar.className='twpg';
    bar.innerHTML=`<button type="button" ${pg>0?'':'disabled'} aria-label="앞 열">◀</button><span><b>${pg+1}/${pages.length}</b> ${esc(lab(pg))}</span><button type="button" ${pg<pages.length-1?'':'disabled'} aria-label="다음 열">▶</button>`;
    const [bp,bn]=bar.querySelectorAll('button'); const go=d=>{ UI.twPg[key]=pg+d; twPager(); };
    bp.onclick=()=>go(-1); bn.onclick=()=>go(1); tw.insertBefore(bar,tb); });
  document.documentElement.style.setProperty('--toph',(document.querySelector('.top')?.offsetHeight||56)+'px'); }
if(typeof addEventListener!=='undefined'){ let t=0; addEventListener('resize',()=>{ clearTimeout(t); t=setTimeout(()=>{ try{ twPager(); }catch(e){} },150); }); }
