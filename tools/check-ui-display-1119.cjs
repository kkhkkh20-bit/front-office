/* 카페 11-19 표시 요청 다섯 가지를 390x844(터치)·1440x900에서 확인한다. 화면 사진은 UIDISPLAY_OUT에 남긴다.
   1) 트라이아웃 목록·엔트리 관리에도 선수 명단과 같은 색 꼬리표와 잠재력 별(트라이아웃은 구단 추정값만, 실제 능력은 내보내지 않는다)
   2) 능력 색 구간: 화면 90(20-80 표기 67)부터 한 단계 진한 파랑. 정의는 rcol 하나, 어두운 바탕에서 글자 대비 4.5:1 이상
   3) 능력 칸 자리 나눔: 증감이 있는 줄과 없는 줄의 꼬리표가 세로로 한 줄
   4) 전력 구성 부상·재활 칸 아래 병역 현황(복무 중·입대 예정, 날짜)
   5) 선수 기록 표: 시즌 중 이적한 해는 합계 줄 → 옮긴 구단 → 떠난 구단 순서, 통산은 두 번 세지 않는다 */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
const root=path.join(__dirname,'..'),out=process.env.UIDISPLAY_OUT||'/tmp/ui-display-1119';
const lum=([r,g,b])=>{const f=v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4;};return .2126*f(r)+.7152*f(g)+.0722*f(b);};
const rgb=s=>(s.match(/[\d.]+/g)||[]).slice(0,3).map(Number);
const contrast=(a,b)=>{const x=lum(rgb(a)),y=lum(rgb(b));return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
(async()=>{fs.mkdirSync(out,{recursive:true});
const server=await startHtmlServer(process.env.UIDISPLAY_HTML||path.join(root,'index.html')),browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});
try{for(const [width,height] of [[1440,900],[390,844]]){const mob=width<1100,c=await browser.newContext({viewport:{width,height},isMobile:mob,hasTouch:mob}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));await p.goto(server.url);await p.waitForFunction(()=>performance.getEntriesByName('fronttime-menu-ready').length>0);
const shot=n=>p.screenshot({path:path.join(out,`${width}-${n}.png`)});
const into=sel=>p.evaluate(s=>{const e=document.querySelector(s);if(e)e.scrollIntoView({block:'center'});},sel);
/* 좁은 화면은 칸을 묶음 버튼으로 나눠 보여 준다: 찾는 것이 숨은 칸에 있으면 그 묶음 버튼을 누른다 */
const reveal=async sel=>{await p.locator(sel).first().waitFor({state:'attached'});await p.evaluate(s=>{const e=document.querySelector(s),panel=e&&e.closest('.ws-panel');if(panel&&panel.hidden){const b=(e.closest('#sheet')||document).querySelector(`.ws-page[data-ws-page="${panel._wsPage}"]`);if(b)b.click();}},sel);await p.locator(sel).first().waitFor();};
const noOver=async w=>assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),w+': 가로 넘침 없음');
const noPageScroll=async w=>{if(!mob)assert.ok(await p.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+2),w+': PC 페이지 스크롤 없음');};
const minFont=async(sel,w)=>{if(mob){const f=await p.evaluate(s=>Math.min(...[...document.querySelectorAll(s+', '+s+' *')].filter(e=>e.offsetParent&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())).map(e=>parseFloat(getComputedStyle(e).fontSize))),sel);assert.ok(f>=10,`${w}: 글자 ${f}px`);}};
const fx=await p.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;G.fOkY=G.year;G.day=KD(7,31);G.res=null;G.stops=[];G.evs=[];G.offers=[];for(const m of G.mail){m.read=true;m.closed={text:'확인 완료'};}UI.title=false;
  const own=playersOf(G.user),d=depth(G.user),bat=orderList(d.start,G.user);
  /* 증감: 주전 타자 1·3번째만 1년 전 기록을 두고(오름·내림) 나머지는 지운다 */
  for(const x of own)x.rm=[];const shift=(x,k)=>({d:G.day-400,r:Object.fromEntries(Object.entries(x.r).map(([a,v])=>[a,v+k]))});bat[0].rm=[shift(bat[0],-5)];bat[2].rm=[shift(bat[2],4)];
  /* 색 구간: 주전 두 명을 화면 90 이상과 84~89로 */
  const setAll=(x,v)=>{for(const k in x.r)x.r[k]=v;};setAll(bat[1],72);setAll(bat[3],66);
  /* 병역: 2군 젊은 국내 선수 한 명은 복무 중, 한 명은 입대 예정 */
  const young=own.filter(x=>!x.foreign&&!x.e1&&!x.mil&&x.age<=24&&!x.ys&&!(x.joinY>G.year)).slice(0,2);enlist(young[0],'상무',G.day-40);enlist(young[1],'현역',G.day+25);
  /* 트라이아웃: 독립리그 선수 6명으로 명단을 연다 */
  const T=tryInit(G.year);T.ann=G.day;const TP=[];for(let i=0;i<6;i++){const x=tryIndieMake(G.year);T.ids.push(x.id);TP.push(x.id);}
  /* 기록: 1군 타자 한 명이 올해 시즌 중 이적한 것으로(떠난 구단 줄 → 옮긴 구단 줄 순서로 쌓인다) */
  const tr=bat[4],other=G.teams.find(t=>t.id!==G.user).id,line=(t,pa,h,hr)=>Object.assign({},ZB,{y:G.year,t,lvl:'1군',pos:tr.pos,g:Math.round(pa/4),pa,ab:pa-10,h,d:4,tr:1,hr,bb:8,hbp:1,so:20,r:10,rbi:15,sb:2,cs:1,sf:1});
  tr.hist=[Object.assign(line(other,400,100,12),{y:G.year-1}),line(other,120,30,3),line(G.user,200,55,7)];
  UI.tab='home';render();return {d1:bat[0].id,d2:bat[2].id,none:bat[5].id,elite:bat[1].id,high:bat[3].id,serv:young[0].id,pend:young[1].id,TP,tr:tr.id,other,oName:tshort(other,G.year),uName:tshort(G.user,G.year),y:G.year,period:period(),
    eliteT:String(dvo(bat[1])),highT:String(dvo(bat[3]))};});
assert.equal(fx.period,'season');

/* ---- 2) 색 구간: 정의 하나(rcol), 화면 90부터 진한 파랑 ---- */
const tier=await p.evaluate(()=>{const cs=getComputedStyle(document.documentElement),tok=k=>cs.getPropertyValue(k).trim();const res=v=>{const e=document.createElement('b');e.className='rc';e.style.setProperty('--c',rcol(v));document.body.append(e);const s=getComputedStyle(e),r={bg:s.backgroundColor,fg:s.color};e.remove();return r;};
  const tbl=[];for(let v=20;v<=80;v+=.5)tbl.push([v,rcol(v),FrontOfficeCore.dv(v),dvKbo(v)]);
  return {r70:tok('--r70'),r65:tok('--r65'),r75:tok('--r75'),tbl,c:[66,72,78].map(res) /* 새 구간과 그 위아래(파랑 계열). 낮은 구간 색은 이번에 바꾸지 않았다 */,src:rcol.toString()};});
assert.ok(tier.r70&&tier.r70!==tier.r65&&tier.r70!==tier.r75,'새 색 --r70이 따로 있다');
{const first=tier.tbl.find(x=>x[1]==='var(--r70)');assert.ok(first,'진한 파랑 구간이 있다');assert.equal(first[2],90,'100점 표기 90부터');assert.equal(first[3],67,'20-80 표기 67부터');
  for(const [v,col,d100] of tier.tbl){if(d100>=90&&d100<=97)assert.equal(col,'var(--r70)',`화면 ${d100}(내부 ${v})은 진한 파랑`);if(d100>=84&&d100<=89)assert.equal(col,'var(--r65)',`화면 ${d100}(내부 ${v})은 청록`);}
  assert.equal(new Set(tier.tbl.map(x=>x[1])).size,8,'색 구간 여덟 단계');
  for(const x of tier.c)assert.ok(contrast(x.bg,x.fg)>=4.5,`꼬리표 글자 대비 ${contrast(x.bg,x.fg).toFixed(2)} (${x.bg})`);}

/* ---- 3) 선수 명단 '현재' 칸: 증감 유무와 상관없이 꼬리표가 한 줄 ---- */
await p.evaluate(()=>{UI.tab='roster';UI.rosterTeam=null;UI.seg='bat';UI.rs={};UI.rscope='one';UI.rlayout='table';(UI.it=UI.it||{}).roster='list';render();});
await reveal('table.rt tr[data-v="'+fx.d1+'"] .abc');
const col=await p.evaluate(ids=>{const row=id=>{const tr=document.querySelector(`table.rt tr[data-v="${id}"]`),a=tr.querySelector('.abc'),t=a.querySelector('.abc-t .rc'),dl=a.querySelector('.abc-d .ovd'),cn=a.querySelector('.abc-c .cnd');const R=e=>{if(!e)return null;const r=e.getBoundingClientRect();return {l:r.left,r:r.right,w:r.width};};
    return {tag:R(t),slot:R(a.querySelector('.abc-t')),d:R(dl),dslot:R(a.querySelector('.abc-d')),c:R(cn),cslot:R(a.querySelector('.abc-c')),txt:t.textContent,bg:getComputedStyle(t).backgroundColor,dtxt:dl?dl.textContent:''};};
  const all=[...document.querySelectorAll('table.rt tbody tr[data-v] .abc-t .rc')].map(e=>{const r=e.getBoundingClientRect();return Math.round((r.left+r.right)/2*2)/2;});
  return {d1:row(ids.d1),d2:row(ids.d2),none:row(ids.none),elite:row(ids.elite),high:row(ids.high),all,old:document.querySelectorAll('table.rt .ovw').length};},fx);
assert.ok(col.d1.d&&/^\+/.test(col.d1.dtxt),'오른 선수 증감 표시 '+col.d1.dtxt);assert.ok(col.d2.d&&/^−/.test(col.d2.dtxt),'내린 선수 증감 표시 '+col.d2.dtxt);assert.equal(col.none.d,null,'기록이 없는 선수는 증감 칸이 비어 있다');
assert.ok(col.all.length>=9,'명단 줄 수');assert.ok(Math.max(...col.all)-Math.min(...col.all)<=1,'꼬리표 가운데가 모든 줄에서 같다 '+JSON.stringify([...new Set(col.all)]));
for(const k of ['d1','d2','none']){const x=col[k];assert.ok(Math.abs(x.slot.w-col.none.slot.w)<.6&&Math.abs(x.dslot.w-col.none.dslot.w)<.6&&Math.abs(x.cslot.w-col.none.cslot.w)<.6,'자리 폭이 줄마다 같다');
  if(x.d)assert.ok(x.d.l>=x.dslot.l-.6&&x.d.r<=x.dslot.r+.6,'증감이 제 자리 안 '+JSON.stringify(x));if(x.c)assert.ok(x.c.l>=x.cslot.l-.6&&x.c.r<=x.cslot.r+.6&&x.c.l>=x.tag.r-.6,'컨디션이 제 자리 안');}
assert.equal(col.old,0,'옛 겹침 배치(.ovw)는 쓰지 않는다');
assert.equal(col.elite.txt,fx.eliteT);assert.ok(+col.elite.txt>=90&&+col.high.txt>=84&&+col.high.txt<=89,`준비 값 ${col.elite.txt}/${col.high.txt}`);assert.notEqual(col.elite.bg,col.high.bg,'90대와 80대 후반의 꼬리표 색이 다르다');assert.equal(col.elite.bg.replace(/\s/g,''),'rgb(61,125,255)');
await minFont('table.rt tr[data-v="'+fx.d1+'"] .abc','선수 명단 능력 칸');await noOver('선수 명단');await noPageScroll('선수 명단');await shot('3-roster-ability-column');await shot('2-colour-tiers-roster');

/* ---- 1a) 엔트리 관리: 같은 꼬리표·증감·별 ---- */
await p.evaluate(()=>{UI.it.roster='ent';UI.seg='bat';render();});await reveal('.ent-r .abc');
const ent=await p.evaluate(ids=>{const rows=[...document.querySelectorAll('.ent-r')],by=id=>rows.find(r=>r.querySelector(`[data-a="player"][data-v="${id}"]`));const one=id=>{const r=by(id);return r?{tag:r.querySelector('.abc .abc-t .rc')?.textContent,d:r.querySelector('.abc .abc-d .ovd')?.textContent||'',stars:!!r.querySelector('.ptier .pst, .ptier.q'),plain:/능력 \d/.test(r.textContent)}:null;};
  return {n:rows.length,tags:rows.filter(r=>r.querySelector('.abc .rc')).length,stars:rows.filter(r=>r.querySelector('.ptier')).length,d1:one(ids.d1),elite:one(ids.elite),same:document.querySelector('.ent-r .abc').className};},fx);
assert.ok(ent.n>=10,'엔트리 줄');assert.equal(ent.tags,ent.n,'모든 줄에 색 꼬리표');assert.equal(ent.stars,ent.n,'모든 줄에 잠재력 별');assert.ok(ent.d1&&ent.d1.stars&&/^\+/.test(ent.d1.d)&&!ent.d1.plain,'증감·별이 있고 "능력 61" 글자는 없다 '+JSON.stringify(ent.d1));assert.equal(ent.elite.tag,fx.eliteT);
await minFont('.ent-r','엔트리 관리');await noOver('엔트리 관리');await noPageScroll('엔트리 관리');await shot('1-entry-management');

/* ---- 1b) 트라이아웃: 구단 추정값으로 꼬리표·별 ---- */
await p.evaluate(()=>A.go('transfer:tryout'));await reveal('table.tf-t td.try-est .abc .rc');
const tr=await p.evaluate(ids=>{const rows=[...document.querySelectorAll('table.tf-t tbody tr')].filter(r=>r.querySelector('td.try-est'));
  return {n:rows.length,tags:rows.filter(r=>r.querySelector('td.try-est .abc .rc')).length,stars:rows.filter(r=>r.querySelector('td.try-est .ptier .pst')).length,
    L:ids.map(id=>{const x=G.players[id],e=tryEst(x,G.user),rp=tryRep(x,e),row=rows.find(r=>r.querySelector(`[data-v="${id}"]`)||r.textContent.includes(x.name));return {shown:row?.querySelector('.abc .rc')?.textContent,est:String(dvG(rp.cur,false)),estRaw:rp.cur,grid:rp.cur%5===0&&rp.ofp%5===0,real:Math.round(ovr(x)),pot:x.pot,ofp:rp.ofp,st:row?.querySelector('.pst')?.getAttribute('aria-label'),want:'별 '+potTierP(rp,x).st+'개',tip:row?.querySelector('.ptier')?.dataset.tip||''};})};},fx.TP);
assert.ok(tr.n>=6,'트라이아웃 줄');assert.equal(tr.tags,tr.n,'모든 줄에 색 꼬리표');assert.equal(tr.stars,tr.n,'모든 줄에 잠재력 별');
for(const x of tr.L){assert.equal(x.shown,x.est,'꼬리표는 구단 추정값');assert.ok(x.grid,'추정은 5점 눈금(다른 계약 전 화면과 같게)');assert.equal(x.st,x.want,'별은 추정 잠재력 기준');assert.match(x.tip,/우리 스카우트 추정/);}
assert.ok(tr.L.some(x=>x.estRaw!==x.real),'실제 능력 숫자를 그대로 내보내지 않는다');
await minFont('table.tf-t td.try-est','트라이아웃 추정 칸');await noOver('트라이아웃');await noPageScroll('트라이아웃');await p.evaluate(()=>document.querySelector('table.tf-t td.try-est .ptier')?.scrollIntoView({block:'center',inline:'center'}));await shot('1-tryout');

/* ---- 4) 전력 구성: 부상·재활 아래 병역 현황 ---- */
await p.evaluate(()=>{UI.tab='roster';UI.it.roster='depth';render();});await reveal('[data-milp]');if(mob)await into('[data-milp]');
const mil=await p.evaluate(ids=>{const m=document.querySelector('[data-milp]'),sec=m.closest('section'),h=[...sec.querySelectorAll('h2')].map(e=>e.textContent.trim()),card=id=>{const b=m.querySelector(`[data-a="player"][data-v="${id}"]`);return b?(b.closest('.pcard,.tc,.item,article,div')||b).textContent:'';};
  return {h,text:m.textContent,serv:milText(G.players[ids.serv]),pend:milText(G.players[ids.pend]),below:!!(sec.querySelector('h2').compareDocumentPosition(m)&Node.DOCUMENT_POSITION_FOLLOWING),pills:[...m.querySelectorAll('.milp-r .pill')].map(e=>e.textContent),rows:m.querySelectorAll('.milp-r').length,rowH:Math.max(...[...m.querySelectorAll('.milp-r')].map(e=>e.getBoundingClientRect().height))};},fx);
assert.match(mil.h[0],/부상·재활/);assert.ok(mil.h.includes('병역 현황'),'병역 현황 제목');assert.ok(mil.below,'부상·재활 아래');
assert.match(mil.serv,/상무 복무 중 · .*전역/);assert.match(mil.pend,/현역 입대 예정 · /);assert.ok(mil.text.includes(mil.serv),'복무 중 선수와 전역 날짜');assert.ok(mil.text.includes(mil.pend),'입대 예정 선수와 입대 날짜');
assert.match(mil.text,/복무 중 1명 · 입대 예정 1명/);assert.ok(mil.rows>=2&&mil.pills.includes('상무')&&mil.pills.includes('현역'),'부대 꼬리표는 병역 탭과 같게 '+mil.pills);assert.ok(mil.rowH<=90,'한 선수 한 줄(높이 '+mil.rowH+')');
if(!mob){const r=await p.locator('[data-milp]').boundingBox();assert.ok(r.y+Math.min(r.height,120)<=height,'병역 현황이 첫 화면 안에서 시작 '+JSON.stringify(r));}
await minFont('[data-milp]','병역 현황');await noOver('전력 구성');await noPageScroll('전력 구성');await shot('4-depth-military');

/* ---- 5) 선수 기록: 이적한 해는 합계 → 옮긴 구단 → 떠난 구단, 통산은 한 번만 ---- */
await p.evaluate(id=>{UI.cLvl='1';UI.cSea='reg';A.player(id);A.ptab('rec');},fx.tr);await reveal('#sheet .pf-rec-season table tbody tr.st-sum');
const rec=await p.evaluate(()=>{const cells=tr=>[...tr.children].map(td=>td.textContent.trim()),head=[...document.querySelectorAll('#sheet .pf-rec-season table thead th')].map(e=>e.textContent.trim()),rows=[...document.querySelectorAll('#sheet .pf-rec-season table tbody tr')].map(tr=>({sum:tr.classList.contains('st-sum'),c:cells(tr),bg:getComputedStyle(tr.children[0]).backgroundColor,fw:getComputedStyle(tr.children[0]).fontWeight}));return {head,rows};});
{const i=k=>rec.head.indexOf(k),Y=String(fx.y),yr=rec.rows.filter(r=>r.c[0]===Y);assert.equal(yr.length,3,'그해 줄 셋(합계·두 구단) '+JSON.stringify(yr.map(r=>r.c.slice(0,2))));
  assert.ok(yr[0].sum&&!yr[1].sum&&!yr[2].sum,'합계 줄이 맨 위');assert.equal(yr[0].c[1],`${fx.oName}/${fx.uName}`,'합계 줄 구단 칸에 두 구단');assert.equal(yr[1].c[1],fx.uName,'옮긴 구단이 위');assert.equal(yr[2].c[1],fx.oName,'떠난 구단이 아래');
  for(const k of ['타석','안타','홈런','경기'])assert.equal(+yr[0].c[i(k)],+yr[1].c[i(k)]+ +yr[2].c[i(k)],k+' 합계');assert.equal(+yr[0].c[i('타석')],320);assert.equal(rec.rows.filter(r=>r.sum).length,1,'이적하지 않은 해에는 합계 줄이 없다');
  assert.ok(yr[0].bg!==yr[1].bg&&+yr[0].fw>=600,'합계 줄은 바탕·굵기로 구분');
  const tot=rec.rows.find(r=>r.c[0]==='통산');assert.ok(tot,'통산 줄');const parts=rec.rows.filter(r=>!r.sum&&r.c[0]!=='통산'&&/^\d{4}$/.test(r.c[0]));assert.equal(+tot.c[i('타석')],parts.reduce((a,r)=>a+ +r.c[i('타석')],0),'통산은 합계 줄을 다시 더하지 않는다');assert.equal(+tot.c[i('타석')],720);assert.equal(+tot.c[i('홈런')],parts.reduce((a,r)=>a+ +r.c[i('홈런')],0));
  const ys=rec.rows.filter(r=>/^\d{4}$/.test(r.c[0])).map(r=>+r.c[0]);assert.deepEqual(ys,[...ys].sort((a,b)=>b-a),'연도는 최신이 위');}
await into('#sheet .pf-rec-season tr.st-sum');await minFont('#sheet .pf-rec-season tr.st-sum','기록 합계 줄');await noOver('선수 기록');await noPageScroll('선수 기록');await shot('5-record-traded-season');
/* 능력 탭의 시즌 통계도 같은 표 */
await p.evaluate(()=>A.ptab('ovr'));
const ov=await p.evaluate(()=>{const d=document.createElement('div');d.innerHTML=seasonStatsBlock(G.players[UI.sheet]);return [...d.querySelectorAll('tbody tr')].map(tr=>[tr.className,tr.children[0].textContent,tr.children[1].textContent]);});
{const yr=ov.filter(r=>r[1]===String(fx.y));assert.deepEqual(yr.map(r=>[r[0],r[2]]),[['st-sum',`${fx.oName}/${fx.uName}`],['',fx.uName],['',fx.oName]],'시즌 통계 묶음도 같은 순서');}
await p.evaluate(()=>{closeSheets();render();renderSheet();});
assert.deepEqual(errors,[],'화면 오류 없음');await c.close();console.log(`${width}x${height} 통과`);}
console.log('카페 11-19 표시 다섯 가지(꼬리표·별, 색 구간, 능력 칸 정렬, 병역 현황, 이적 시즌 기록) 통과');
}finally{await browser.close();await server.close();}})().catch(e=>{console.error(e);process.exit(1);});
