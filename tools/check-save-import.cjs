/* 백업 가져오기·슬롯 전환·itch 이전 점검(검수 11-09 #17~#30): 잘못된 백업은 저장소와 진행 중 게임을 건드리지 않고, 저장 실패는 실패로 알리고, itch 이전은 기존 본문을 지우지 않는다.
   사용: bash build.sh 뒤 node tools/check-save-import.cjs */
const {chromium}=require('playwright');
(async()=>{ const b=await chromium.launch(); const pg=await (await b.newContext({viewport:{width:390,height:844}})).newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+require('path').resolve(__dirname,'../index.html')); await pg.waitForTimeout(800);
 await pg.click('[data-a="tsGo"][data-v="mode"]'); await pg.click('[data-a="smode"][data-v="take"]',{timeout:120000}); await pg.waitForSelector('.tmk',{timeout:120000}); await pg.click('.tmk [data-a="start"].btn'); await pg.fill('#gp-name','점검'); await pg.click('[data-a="gpStart"]'); await pg.waitForTimeout(1500);
 const bad=await pg.evaluate(async()=>{ const bad=[], LS=Storage.prototype, si=LS.setItem; const block=f=>{ LS.setItem=function(k,v){ if(f(k))throw new Error('quota'); return si.call(this,k,v); }; }, unblock=()=>{ LS.setItem=si; };
  if(!saveNow())bad.push('준비: 첫 저장 실패');
  const g0=G, s1=curSlot(), body0=localStorage.getItem(slotKey(s1)), meta0=localStorage.getItem(META), txt=prepG(), ms0=MIN_SAL;
  const same=w=>{ if(G!==g0)bad.push(w+': 진행 중 게임이 바뀜'); if(localStorage.getItem(slotKey(s1))!==body0)bad.push(w+': 슬롯 본문이 바뀜'); if(localStorage.getItem(META)!==meta0)bad.push(w+': 저장 목록이 바뀜'); if(G&&G.user!==g0.user)bad.push(w+': 사용자 구단이 바뀜'); };
  const mk=f=>{ const g=JSON.parse(txt); f(g); return JSON.stringify(g); };
  /* #19·#20: 필수 항목이 빠진 백업 */
  for(const [w,f] of [['시즌 기록 없음',g=>{ delete g.sea; }],['없는 사용자 구단',g=>{ g.user=999; }],['선수 없음',g=>{ g.players={}; }],['구단 기록 없음',g=>{ g.sea.rec=[]; }]]){ importText(mk(f)); same(w); if(!/가져오지 않았습니다/.test(UI.impMsg||''))bad.push(w+': 거절 안내 없음'); }
  /* #21: 복원에 실패한 2027년 백업은 최저 연봉을 바꾸지 않는다 */
  importText(mk(g=>{ g.year=2027; delete g.scouts; })); same('복원 실패'); if(MIN_SAL!==ms0)bad.push(`복원 실패 뒤 최저 연봉이 ${ms0}에서 ${MIN_SAL}(으)로 남음`);
  /* #22: 파일을 고른 뒤 슬롯이 바뀌면 거절 */
  importText(txt,{title:false,slot:s1+1,g:G}); same('읽는 사이 슬롯 변경');
  /* #17: 같은 날짜·구단이지만 내용이 다른 백업, 슬롯 쓰기가 막힘 */
  block(k=>k===slotKey(s1)); importText(mk(g=>{ const p=Object.values(g.players)[0]; p.name=p.name+'가'; })); unblock();
  if(localStorage.getItem(slotKey(s1))!==body0)bad.push('쓰기 실패인데 본문이 바뀜'); if(/다시 열어도 가져온 백업이 열립니다|^불러왔습니다/.test(UI.impMsg||''))bad.push('쓰기 실패인데 저장됐다고 안내: '+UI.impMsg);
  importText(txt); if(UI.impMsg!=='불러왔습니다.')bad.push('정상 가져오기 실패: '+UI.impMsg);
  /* #18: 처음 화면 가져오기에서 활성 슬롯 기록이 실패하면 알린다 */
  UI.title=true; block(k=>k===META); importText(txt); unblock(); const s2=curSlot();
  if(s2===s1&&!/가져오지 않았습니다/.test(UI.impMsg||''))bad.push('처음 화면 가져오기가 기존 슬롯에 씀'); if(localStorage.getItem(slotKey(s1))==null)bad.push('기존 슬롯 본문이 사라짐'); if(!/슬롯 \d+을\(를\) 고르세요|가져오지 않았습니다/.test(UI.impMsg||''))bad.push('활성 슬롯 기록 실패를 알리지 않음: '+UI.impMsg); if(meta().active!==s1)bad.push('목록 기록이 막혔는데 활성 슬롯이 바뀜');
  /* #23~#26: 슬롯을 바꾸면 이전 게임의 화면 상태를 비운다 */
  let fired=0; UI.expCode='이전 코드'; UI.trnPend={1:'con'}; UI.pcmp=[1,2]; UI.dl={on:true,kind:'am',y:G.year,feed:[],t:setTimeout(()=>{ fired=1; },60)};
  A.slotLoad(s1); await new Promise(z=>setTimeout(z,150));
  if(curSlot()!==s1)bad.push('슬롯 전환 실패: '+UI.slotMsg); if(UI.expCode)bad.push('이전 슬롯의 백업 코드가 남음'); if(Object.keys(UI.trnPend||{}).length)bad.push('적용 대기 훈련이 남음'); if((UI.pcmp||[]).length)bad.push('비교 목록이 남음'); if(fired||(UI.dl&&UI.dl.t))bad.push('이전 세이브의 드래프트 타이머가 남음');
  /* #30: 파일 저장을 취소하면 마지막 백업일을 바꾸지 않는다 */
  G.bkAt=G.day-61; const bk=G.bkAt; const dl0=DL; DL={save:async()=>{ throw {code:'declined'}; }}; await A.expFile(); if(G.bkAt!==bk)bad.push('파일 저장을 취소했는데 마지막 백업일이 바뀜');
  DL={save:async()=>{}}; await A.expFile(); if(G.bkAt!==G.day)bad.push('파일 저장에 성공했는데 마지막 백업일이 그대로'); DL=dl0;
  /* #28·#29: itch 이전 */
  const A1=localStorage.getItem(slotKey(s1)), B1=packJ(mk(g=>{ g.day+=3; })), mt=JSON.stringify({active:1,slots:{1:{name:'itch',y:2026},2:{name:'itch',y:2026}}});
  const ev=items=>({data:{type:'ft-migrate',items},source:window.parent,origin:'https://html.itch.zone'});
  localStorage.clear(); localStorage.setItem(slotKey(1),A1);
  if(ftMigrateAccept(ev({[META]:mt,[slotKey(1)]:B1})))bad.push('itch: 본문만 있는 슬롯을 비었다고 보고 옮김'); if(localStorage.getItem(slotKey(1))!==A1)bad.push('itch: 본문만 있는 기존 슬롯을 덮어씀');
  localStorage.clear(); if(ftMigrateAccept(ev({[META]:mt})))bad.push('itch: 슬롯 본문 없이 이전 성공'); if(localStorage.getItem(META)!=null)bad.push('itch: 본문 없이 목록을 씀');
  localStorage.clear(); const em='{"active":1,"slots":{}}'; localStorage.setItem(META,em); localStorage.setItem('danjang-pref','x'); block(k=>k===slotKey(2));
  if(ftMigrateAccept(ev({[META]:mt,[slotKey(1)]:B1,[slotKey(2)]:B1,'danjang-pref':'y'})))bad.push('itch: 쓰기 실패인데 성공'); unblock();
  if(localStorage.getItem(slotKey(1))!=null||localStorage.getItem(slotKey(2))!=null)bad.push('itch: 실패 뒤 옮기던 본문이 남음'); if(localStorage.getItem(META)!==em)bad.push('itch: 실패 뒤 기존 목록을 원래대로 돌리지 않음'); if(localStorage.getItem('danjang-pref')!=='x')bad.push('itch: 기존 항목을 덮어쓰거나 지움');
  localStorage.clear(); if(!ftMigrateAccept(ev({[META]:mt,[slotKey(1)]:B1})))bad.push('itch: 정상 이전 실패'); else { const m=meta(); if(Object.keys(m.slots).join()!=='1'||m.active!==1)bad.push('itch: 본문이 없는 슬롯이 목록에 남음 '+JSON.stringify(m)); }
  return bad; });
 const ok=!bad.length&&!errs.length; console.log(ok?'가져오기·슬롯 전환·itch 이전 점검 통과':'가져오기 점검 실패\n- '+bad.concat(errs).join('\n- ')); await b.close(); process.exit(ok?0:1); })();
