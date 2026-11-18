const path=require('node:path');
async function runPanels({page,width,out,check}){
  // Reuse the harness's initialized world and browser. The record sheet hosts the
  // production legacy matchup component, which the modern desktop cast hides.
  await page.evaluate(()=>{
    CT.tok++;CT.run=false;UI.cast=null;UI.castRet=null;UI.game=null;UI.sheet=null;UI.mail=null;UI.menu=false;G.live=null;G.res=null;delete G.castHold;SPOIL_SNAP=null;G.ps=null;G.day=G.cal.open+20;
    for(const t of G.teams)setEntry(t.id);
    const h=G.user,a=G.teams.find(t=>t.id!==h).id,sim=simGame(G.day,h,a,false),base=gameRecord(G.day,h,a,sim,''),b=G.players[base.box.a.bat[0].id],p=G.players[base.box.h.pit[0].id];
    window.__gp776={base,bid:b.id,pid:p.id};
    window.__gp776show=(kind,k,legacy=false)=>{
      const b=G.players[__gp776.bid],p=G.players[__gp776.pid],g=JSON.parse(JSON.stringify(__gp776.base)),x=[0,b.id,p.id,'OUT',1,[0,0,0],0,0,0],end=[0,b.id,p.id,'OUT',2,[0,0,0],0,0,0];
      if(kind==='sf'){x[13]=true;x[18]={ab:0,sf:true};b.vs={y:G.year,m:{[p.id]:[11,10,2,0,0,0,0,0,0]}};}
      else if(kind==='fc'){x[16]=g.box.a.bat[1].id;x[5]=[b.id,0,0];x[14]=[{id:x[16],from:1,to:2,result:'out'}];x[15]={pitches:[{res:'번트'}]};x[18]={bunt:'fc',fc:true,outBase:2,outRunner:x[16],ab:1};b.vs={y:G.year,m:{[p.id]:[11,11,2,0,0,0,0,0,0]}};}
      else if(kind==='hbp'){b.vs={y:G.year,m:{[p.id]:[12,11,2,0,1,0,0,1,0]}};}
      else if(kind==='unknown'){x[3]='BB';b.vs={y:G.year,m:{[p.id]:[13,10,2,0,3,0,1,0,2]}};}
      if(legacy)delete x[18];g.pbp=[x,end];G.games=[g];UI.cast=null;UI.castRet=null;UI.sheet=null;UI.game=null;A.openGame('0');
      const host=document.querySelector('#sheet .sheet.gut');if(!host)throw Error('actual game record sheet did not render');const section=document.createElement('section');section.className='card';section.dataset.review='matchup';section.innerHTML=abPanel(g,k)+'<div class="small">'+cMatchupHtml(cMatchup(g,k,b.id,p.id))+'</div>';host.querySelector('.sheet-head').after(section);
      return {story:section.querySelector('.ab-story')?.textContent||'',match:section.querySelector('.cs-mu')?.textContent||'',chips:section.querySelector('.ab-pk')?.textContent||'',state:JSON.stringify(b.vs)};
    };
  });
  let r=await page.evaluate(()=>[__gp776show('sf',0),__gp776show('sf',1)]);
  check(r.every(x=>x.story.includes('9타수')),'776 SF leaves matchup AB at9 before and after [real component]');
  r=await page.evaluate(()=>[__gp776show('fc',0),__gp776show('fc',1)]);
  check(r[0].story.includes('9타수')&&r[1].story.includes('10타수')&&r[1].chips.includes('번트 실패'),'776 FC changes matchup AB9 to10 and shows bunt failure');
  r=await page.evaluate(()=>[__gp776show('fc',0,true),__gp776show('fc',1,true)]);
  check(r[0].story.includes('9타수')&&r[1].story.includes('10타수'),'776 old trace FC also adds one AB');
  r=await page.evaluate(()=>__gp776show('hbp',0));
  check(r.story.includes('사구 1')&&!r.story.includes('볼넷 1')&&r.match.includes('사구 1')&&!r.match.includes('볼넷 1'),'778 both actual cards label HBP1 without BB1');
  await page.locator('[data-review="matchup"]').scrollIntoViewIfNeeded();
  check(await page.locator('[data-review="matchup"] .ab-story').isVisible(),'778 actual matchup component is visible');
  if(out)await page.screenshot({path:path.join(out,'panels-hbp-'+width+'.png'),scale:'css'});
  r=await page.evaluate(()=>[__gp776show('unknown',0),__gp776show('unknown',1)]);
  check(r[0].story.includes('볼넷·사구 2')&&!r[0].story.includes('볼넷 1')&&r[1].story.includes('볼넷 1')&&r[1].story.includes('볼넷·사구 2'),'778 old unknown counts stay honest while new BB remains hidden until shown');
  r=await page.evaluate(()=>{const b=G.players[__gp776.bid],p=G.players[__gp776.pid],g=JSON.parse(JSON.stringify(__gp776.base));g.pbp=[[0,b.id,p.id,'HBP',0,[b.id,0,0],0,0,0]];b.vs={y:G.year,m:{[p.id]:[10,9,2,0,1,0]}};vsAdd(b,p,'BB',true,0);const later={...g,day:g.day+1,pbp:[[0,b.id,p.id,'BB',0,[b.id,0,0],0,0,0]]};G.games=[later,g];UI.game=null;A.openGame('1');const section=document.createElement('section');section.className='card';section.dataset.review='legacy-replay';section.innerHTML=cMatchupHtml(cMatchup(g,0,b.id,p.id));document.querySelector('#sheet .sheet-head').after(section);return section.textContent;});
  check(r.includes('9타수')&&!r.includes('볼넷·사구')&&!r.includes('볼넷 1')&&!r.includes('사구 1'),'778 migrated legacy replay hides old unknown HBP as well as later BB');
  r=await page.evaluate(()=>{
    const {base,bid,pid}=__gp776,g=JSON.parse(JSON.stringify(base)),b=G.players[bid],p=G.players[pid];g.pbp=['sac','hit','out','fc'].map((kind,i)=>{const x=[i*2,b.id,p.id,kind==='sac'?'SAC':kind==='hit'?'1B':'OUT',1,kind==='hit'||kind==='fc'?[b.id,0,0]:[0,0,0],0,0,0];x[15]={pitches:[{res:'번트'}]};x[18]={bunt:kind,fc:kind==='fc',ab:kind==='sac'?0:1};if(kind==='fc')x[16]=g.box.a.bat[1].id;return x;});G.games=[g];A.openGame('0');const host=document.querySelector('#sheet .sheet.gut'),section=document.createElement('section');section.className='card';section.dataset.review='manager';section.innerHTML=mdMgr(g,{k:4});host.querySelector('.sheet-head').after(section);return {text:section.textContent,items:section.querySelectorAll('li').length};
  });
  check(r.items===4&&r.text.includes('번트 안타')&&r.text.includes('희생번트')&&r.text.includes('번트 실패 · 포스아웃'),'777 actual manager component includes all4 bunt decisions');
  await page.locator('[data-review="manager"]').scrollIntoViewIfNeeded();if(out)await page.screenshot({path:path.join(out,'panels-bunt-manager-'+width+'.png'),scale:'css'});
  r=await page.evaluate(()=>{const g=JSON.parse(JSON.stringify(__gp776.base));for(const sd of ['a','h'])for(const q of [...g.box[sd].bat,...g.box[sd].pit])q.e=0;g.box.h.pit[0].e=1;g.box.h.pit[0].n='실책확인투수';G.games=[g];UI.cast=null;UI.castRet=null;UI.game=null;A.openGame('0');return [...document.querySelectorAll('#sheet .sheet.gut p.small')].map(p=>p.textContent).filter(t=>t.includes('실책:'));});
  check(r.some(t=>t.includes('실책: 실책확인투수')),'779 actual box sheet includes pitcher error name');
  const error=page.locator('#sheet p.small').filter({hasText:'실책: 실책확인투수'});await error.scrollIntoViewIfNeeded();check(await error.isVisible(),'779 pitcher error line is visible');if(out)await page.screenshot({path:path.join(out,'panels-pitcher-error-'+width+'.png'),scale:'css'});
  r=await page.evaluate(()=>{
    UI.game=null;UI.sheet=null;UI.cast=null;UI.castRet=null;G.live=null;G.res=null;G.games=[];G.ps=null;delete G.castHold;SPOIL_SNAP=null;G.day=G.cal.open+10;const [B,TA,C,D]=G.teams.slice(0,4).map(t=>t.id),rec={},tl={};for(const t of G.teams){rec[t.id]={w:0,l:0,t:0};tl[t.id]=[];}G.sea.rec=rec;G.sea.tl=tl;G.sea.rh=[];G.sea.ulog=[];G.last={y:G.year-1,order:G.teams.map(t=>({tid:t.id,w:70,l:74,t:0}))};const add=(h,a,hs,as)=>{for(const [id,op,s,opS,home] of [[h,a,hs,as,1],[a,h,as,hs,0]]){const r=s>opS?1:s<opS?-1:0;tl[id].push([r,s,opS,home,op,G.day-1]);rec[id][r>0?'w':r<0?'l':'t']++;}};add(TA,B,3,2);add(TA,C,1,0);add(D,TA,2,1);add(B,C,4,0);add(B,D,2,1);add(C,D,4,0);const snap=broadcastTeamFacts(G.day,TA,B),order=standingsNow().map(t=>t.tid);UI.it=UI.it||{};UI.it.stand='tbl';A.go('league:stand');render();const table=document.querySelector('main.content table.fx-st,main.content table.stt');if(!table)throw Error('actual league table route did not render');const rows=[...table.tBodies[0].rows].filter(tr=>tr.querySelector('[data-a="lteamGo"]')).map(tr=>({tid:+tr.querySelector('[data-a="lteamGo"]').dataset.v,rank:tr.querySelector('.ticker')?.textContent||tr.cells[0].textContent}));return {A:TA,B,rows,order,snapRanks:{A:snap.teams[TA].rank,B:snap.teams[B].rank},desktop:table.classList.contains('fx-st')};
  });
  check(r.rows.map(x=>x.tid).join(',')===r.order.join(',')&&r.order[0]===r.A&&r.snapRanks.A===1&&r.snapRanks.B===2,'780 actual league row order matches pregame h2h snapshot');
  check(r.desktop?r.rows[0].rank==='1'&&r.rows[1].rank==='2':r.rows[0].rank==='1'&&r.rows[1].rank==='1','780 preserves existing desktop sequential / mobile joint rank labels');
  if(out)await page.screenshot({path:path.join(out,'panels-league-rank-'+width+'.png'),scale:'css'});
}
module.exports={runPanels};
