// 이름 잘림 전수 점검: 모든 메뉴·하위 탭과 선수 정보 창 탭을 PC(1440·1280)·휴대폰(390)에서 열어, 구단·선수 이름이 든 글자가 칸에서 잘리면 실패. 소식함 제목 미리보기(.ibr-s)는 일부러 말줄임이라 제외. 사용: node tools/check-names.cjs
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const out={};
for(const vp of [{n:'pc',width:1440,height:900},{n:'pc1280',width:1280,height:800},{n:'phone',width:390,height:844}]){
 const p=await b.newPage({viewport:{width:vp.width,height:vp.height},hasTouch:vp.n==='phone'}); p.on('pageerror',e=>{});
 await p.goto('file://'+require('path').resolve(__dirname,'..','index.html'));await p.waitForTimeout(2000);
 await p.evaluate(()=>{ newGame(6); hireMgr(G.mmarket[0].id,3); G.fdWait=false; UI.title=false; UI.sstep='main'; for(let i=0;i<70;i++){ G.stops=[];G.matchAwait=null; try{advance('day',{skipMatchStop:true});}catch(e){} } });
 const targets=await p.evaluate(()=>{ const L=[]; for(const [t] of NAV){ L.push(t); for(const [s] of (SUBS[t]||[]))L.push(t+':'+s); } for(const k of Object.keys(MFOLD||{}))L.push(k); return [...new Set(L)]; });
 const pid=await p.evaluate(()=>playersOf(G.user).find(x=>!x.foreign).id);
 const scan=()=>p.evaluate(()=>{ const names=new Set(); for(const t of G.teams){ names.add(t.city+' '+t.nick); names.add(t.nick); names.add(tshort(t.id)); } const pn=new Set(Object.values(G.players).filter(x=>x.team!=null).map(x=>x.name));
   const hits=[]; document.querySelectorAll('body *').forEach(e=>{ if(e.children.length>1||!e.offsetParent||e.closest('.ibr-s'))return; const t=(e.textContent||'').trim(); if(!t||t.length>60)return;
     const has=[...names].some(n=>t.includes(n))||[...pn].some(n=>t.includes(n)); if(!has)return; const cs=getComputedStyle(e);
     const cut=(e.scrollWidth>e.clientWidth+1&&(cs.overflow==='hidden'||cs.overflowX==='hidden'||cs.textOverflow==='ellipsis'))||(e.getBoundingClientRect().width<24&&t.length>=3);
     if(cut)hits.push((e.className&&typeof e.className==='string'?e.className.split(' ')[0]:e.tagName)+'「'+t.slice(0,24)+'」 '+e.clientWidth+'/'+e.scrollWidth); }); return hits; });
 for(const k of targets){ await p.evaluate(k=>{ try{ closeSheets(); }catch(e){} A.go(k); },k); await p.waitForTimeout(250); const h=await scan(); if(h.length)out[vp.n+' '+k]=h.slice(0,8); }
 for(const tab of ['abil','grow','sum','rec','ana','car','mgmt']){ await p.evaluate(([id,tab])=>{ A.player(id); try{ A.ptab(tab); }catch(e){} },[pid,tab]); await p.waitForTimeout(250); const h=await scan(); if(h.length)out[vp.n+' 선수:'+tab]=h.slice(0,8); }
 await p.close(); }
const n=Object.keys(out).length; for(const [k,v] of Object.entries(out))console.log(k,'|',v.slice(0,3).join(' ; ')); console.log(n?`이름 잘림 점검: ${n}개 화면에서 잘림`:'이름 잘림 점검: 문제 없음'); if(n)process.exitCode=1;
await b.close();})();
