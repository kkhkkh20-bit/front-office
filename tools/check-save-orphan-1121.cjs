/* 본문 없는 슬롯(목록만 남음) 정리·덮어쓰기와 큰 저장 여러 개(카페 11-21 마스터쉐프: "저장 본문 없음" 슬롯을 지울 수도 덮어쓸 수도 없음).
   실제 Chromium(localStorage + IndexedDB)에서 확인한다. 사용: bash build.sh 뒤 node tools/check-save-orphan-1121.cjs
   1) 목록은 IndexedDB 본문을 가리키는데 본문 키가 없다 → 안내 문구, 삭제 성공, 덮어 저장 성공, 새로고침 뒤 덮어쓴 본문이 열림
   2) 본문 읽기가 오류로 실패(큰 값 읽기 실패 흉내) → 삭제 성공
   3) 지우다 멈춘 슬롯(deleting 표시가 남고 본문은 이미 없음) → 새로고침 뒤 덮어쓰기·삭제 가능
   4) 같은 슬롯의 다른 확정본이 남아 있으면(목록이 가리키는 키만 없음) 새로고침 때 그 본문으로 되살린다. 확정 기록의 판번호만 어긋난 본문도 되살린다
   5) 큰 저장(약 2MB) 7개: localStorage가 차서 IndexedDB로 옮겨도 모든 목록 항목의 본문이 남는다. IndexedDB 쓰기가 실패하면 앞 본문을 지키고 공간 안내를 띄운다
   6) 1366·390 폭에서 슬롯 목록이 가로로 넘치지 않는다 */
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
const root=path.resolve(__dirname,'..');
const ready=pg=>pg.waitForFunction(()=>performance.getEntriesByName('fronttime-menu-ready').length>0,null,{timeout:120000});
(async()=>{ const server=await startHtmlServer(path.join(root,'index.html')); let b; const fails=[]; let pass=0;
 const ok=(c,m)=>{ if(c)pass++; else { fails.push(m); console.log('FAIL '+m); } };
 try{ b=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});
  const ctx=await b.newContext({viewport:{width:1366,height:768}}), pg=await ctx.newPage(), errs=[]; pg.on('pageerror',e=>errs.push(e.message));
  await pg.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
  const reload=async()=>{ await pg.goto(server.url); await ready(pg); await pg.waitForTimeout(300); };
  await reload();
  /* 슬롯 1에 실제 새 게임 */
  await pg.click('[data-a="tsGo"][data-v="mode"]'); await pg.click('[data-a="smode"][data-v="take"]',{timeout:120000}); await pg.waitForSelector('.tmk',{timeout:120000}); await pg.click('.tmk [data-a="start"].btn'); await pg.fill('#gp-name','점검'); await pg.click('[data-a="gpStart"]'); await pg.waitForTimeout(1500);
  ok(await pg.evaluate(()=>{ G.tut={done:true,step:99}; closeSheets(); return saveNow()&&curSlot()===1; }),'준비: 슬롯 1 저장');
  const s1=await pg.evaluate(()=>({body:sbGet(1),row:meta().slots[1]}));
  /* 목록 항목만 심는다(본문은 IndexedDB 어디에도 없음) */
  const plant=(n,extra)=>pg.evaluate(([n,row,extra])=>{ const m=meta(); m.slots[n]=Object.assign({},row,{memo:'트레이드 이후',rev:Date.now()+n/10,idb:true,idbKey:'slot:'+n+':gone',idbCommit:'slot:'+n+':gone:commit',writeKey:'slot:'+n+':gone'},extra||{}); return setMeta(m); },[n,s1.row,extra||null]);
  const slotText=n=>pg.evaluate(n=>{ const el=[...document.querySelectorAll('.slot')].find(x=>x.querySelector('b')&&x.querySelector('b').textContent.startsWith('슬롯 '+n+'')&&!/^슬롯 \d\d/.test(x.querySelector('b').textContent)); return el?el.innerText:''; },n);
  const openSlots=async()=>{ await pg.evaluate(()=>{ if(G){ saveNow(); A.go('cfg:save'); } else { UI.sstep='slots'; render(); } }); await pg.waitForTimeout(200); };
  const click2=async(a,n)=>{ for(let i=0;i<2;i++){ await pg.evaluate(([a,n])=>A[a](n),[a,n]); await pg.waitForTimeout(50); } await pg.waitForTimeout(300); return pg.evaluate(()=>UI.slotMsg||''); };

  /* 1) 본문 키가 없는 슬롯 2·3: 안내·삭제·덮어쓰기 */
  ok(await plant(2)&&await plant(3),'1 준비: 목록 항목 심기');
  await reload(); await pg.evaluate(()=>{ UI.sstep='slots'; render(); }); await pg.waitForTimeout(200);
  const t2=await slotText(2); ok(/저장 본문이 사라져 불러올 수 없습니다/.test(t2)&&/삭제하거나 덮어 저장할 수 있습니다/.test(t2),'1 안내 문구: '+t2.replace(/\s+/g,' ').slice(0,120));
  let msg=await click2('slotDel',2); ok(/지웠습니다/.test(msg)&&!/막았습니다/.test(msg),'1 본문 없는 슬롯 삭제: '+msg);
  ok(await pg.evaluate(()=>!meta().slots[2]),'1 삭제 뒤 목록 항목이 남음');
  await pg.evaluate(()=>A.slotLoad(1)); await pg.waitForTimeout(800); ok(await pg.evaluate(()=>!!G&&curSlot()===1),'1 슬롯 1 열기');
  await openSlots(); msg=await click2('slotOver',3); ok(/덮어 저장했습니다/.test(msg),'1 본문 없는 슬롯 덮어쓰기: '+msg);
  const day1=await pg.evaluate(()=>G.day);
  await reload(); ok(await pg.evaluate(async()=>{ const ok=await A.slotLoad(3); return ok&&curSlot()===3; }),'1 덮어쓴 슬롯 3을 새로고침 뒤 열기');
  ok(await pg.evaluate(d=>G&&G.day===d,day1),'1 덮어쓴 슬롯 3 내용');

  /* 2) 본문 읽기 오류: 삭제는 된다 */
  await reload(); ok(await plant(4),'2 준비');
  msg=await pg.evaluate(async()=>{ const w=SaveStore.web; SaveStore.use(Object.assign({},w,{big:Object.assign({},w.big,{read:k=>String(k).startsWith('slot:4:')?Promise.reject(new Error('Failed to read large IndexedDB value')):w.big.read(k)})})); G=null; CUR_SLOT=null; UI.title=true; UI.sstep='slots'; UI.delAsk=null; render();
    await A.slotDel(4); await A.slotDel(4); const r=UI.slotMsg; SaveStore.use(w); return r+'|'+(meta().slots[4]?'left':'gone'); });
  ok(/지웠습니다/.test(msg)&&/gone$/.test(msg),'2 읽기 오류 슬롯 삭제: '+msg);

  /* 3) 지우다 멈춘 슬롯 */
  await reload(); ok(await plant(5,{deleting:{old:{name:s1.row.name}}}),'3 준비');
  await reload(); await pg.evaluate(()=>A.slotLoad(1)); await pg.waitForTimeout(800); await openSlots();
  msg=await click2('slotOver',5); ok(/덮어 저장했습니다/.test(msg),'3 지우다 멈춘 슬롯 덮어쓰기: '+msg);
  await reload(); ok(await plant(6,{deleting:{old:{name:s1.row.name}}}),'3 준비 2'); await reload(); await pg.evaluate(()=>{ UI.sstep='slots'; render(); });
  msg=await click2('slotDel',6); ok(/지웠습니다/.test(msg),'3 지우다 멈춘 슬롯 삭제: '+msg);

  /* 4) 되살리기: 같은 슬롯의 다른 확정본, 판번호만 어긋난 확정 기록 */
  await reload();
  ok(await pg.evaluate(async body=>{ const m=meta(), row=m.slots[1]; for(const n of [7,8]){ const key='slot:'+n+':old', commit=key+':commit', rev=row.rev+n; const info=Object.assign({},row,{rev,idb:true,idbKey:key,idbCommit:commit,writeKey:key}); delete info.pending;
      await SaveStore.big.put(key,body); await SaveStore.big.put(commit,JSON.stringify({saveCommit:1,n,rev,key,info}));
      m.slots[n]=n===7?Object.assign({},info,{rev:rev+1,idbKey:'slot:7:gone',idbCommit:'slot:7:gone:commit',writeKey:'slot:7:gone'}):Object.assign({},info,{rev:rev+5}); }
    return setMeta(m); },s1.body),'4 준비');
  await reload(); await pg.evaluate(()=>{ UI.sstep='slots'; render(); }); await pg.waitForTimeout(200);
  ok(await pg.evaluate(()=>slotHas(7)&&slotHas(8)),'4 남은 본문을 되살리지 못함');
  ok(await pg.evaluate(async()=>{ const a=await A.slotLoad(7); return a&&curSlot()===7; }),'4 되살린 슬롯 7 열기');
  await reload(); ok(await pg.evaluate(async()=>{ const a=await A.slotLoad(8); return a&&curSlot()===8; }),'4 되살린 슬롯 8 열기(다시 새로고침해도 같음)');
  await reload(); ok(await pg.evaluate(()=>slotHas(7)&&slotHas(8)),'4 되살리기가 한 번만이 아니라 계속 유지');

  /* 5) 큰 저장 7개 */
  await pg.evaluate(async()=>{ localStorage.clear(); for(const k of await SaveStore.big.keys())await SaveStore.big.drop(k); }); await reload();
  await pg.click('[data-a="tsGo"][data-v="mode"]'); await pg.click('[data-a="smode"][data-v="take"]',{timeout:120000}); await pg.waitForSelector('.tmk',{timeout:120000}); await pg.click('.tmk [data-a="start"].btn'); await pg.fill('#gp-name','점검'); await pg.click('[data-a="gpStart"]'); await pg.waitForTimeout(1500);
  const big=await pg.evaluate(async()=>{ G.tut={done:true,step:99}; closeSheets(); let x=12345; const a=[]; for(let i=0;i<2.9e6;i++){ x=(x*1103515245+12345)&0x7fffffff; a.push((x>>>16)%36); } G.pad=a.map(v=>v.toString(36)).join(''); saveNow(); await sbSettle(curSlot()); const out=[];
    for(let i=0;i<6;i++){ G.day++; const r=await A.slotCopy(); out.push(r); }
    G.day++; saveNow(); await sbSettle(curSlot());
    const rows=Object.keys(meta().slots).map(Number), bad=[];
    for(const n of rows){ const z=await sbCommitted(n); if(!z||!unpack(z.body))bad.push(n); }
    return {out,rows,bad,kb:SLOT_IDS.map(slotSize)}; });
  ok(big.out.every(Boolean),'5 큰 저장 복사 실패 '+JSON.stringify(big.out));
  ok(big.rows.length===7&&big.bad.length===0,'5 본문 없는 목록 항목 '+JSON.stringify(big));
  await reload(); const after=await pg.evaluate(()=>SLOT_IDS.filter(n=>meta().slots[n]&&!slotHas(n))); ok(after.length===0,'5 새로고침 뒤 본문 없음 '+JSON.stringify(after));
  /* IndexedDB 쓰기 실패: 앞 본문 유지 + 공간 안내 */
  const fail=await pg.evaluate(async()=>{ await A.slotLoad(1); const n=curSlot(), before=await sbCommitted(n); const w=SaveStore.web; SaveStore.use(Object.assign({},w,{set:(k,v)=>{ if(k===slotKey(n))throw Object.assign(new Error('QuotaExceededError'),{name:'QuotaExceededError'}); return w.set(k,v); },big:Object.assign({},w.big,{put:k=>String(k).startsWith('slot:'+n+':')?Promise.reject(Object.assign(new Error('QuotaExceededError'),{name:'QuotaExceededError'})):w.big.put(k)})}));
    G.day+=3; const r=saveNow(); await sbSettle(n); await new Promise(r=>setTimeout(r,200)); SaveStore.use(w); const z=await sbCommitted(n);
    return {r,err:SAVE_ERR,same:!!z&&!!before&&z.body===before.body,toast:[...document.querySelectorAll('.toast,[role=status]')].map(x=>x.innerText).join('|')}; });
  ok(fail.same,'5 IndexedDB 쓰기 실패 뒤 앞 본문이 사라짐 '+JSON.stringify(fail).slice(0,200));
  ok(/파일로 내보내기|지우/.test(fail.err||''),'5 실패 안내에 공간·백업 안내 없음: '+fail.err);

  /* 6) 배치 */
  for(const w of [1366,390]){ await pg.setViewportSize({width:w,height:w>800?768:844}); await reload(); await pg.evaluate(()=>{ UI.sstep='slots'; render(); }); await pg.waitForTimeout(300);
    const lay=await pg.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth})); ok(lay.sw<=lay.cw,`6 ${w}px 가로 넘침 ${JSON.stringify(lay)}`); }
  ok(!errs.length,'페이지 오류: '+errs.slice(0,3).join(' | '));
 }catch(e){ fails.push('예외: '+(e&&e.stack||e)); console.log('FAIL 예외',e); }
 finally{ if(b)await b.close(); await server.close(); }
 console.log(fails.length?`본문 없는 슬롯 점검 FAIL ${fails.length}건 (통과 ${pass})`:`본문 없는 슬롯 점검 통과 ${pass}건`); process.exit(fails.length?1:0); })();
