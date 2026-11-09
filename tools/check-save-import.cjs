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
  for(const [w,f] of [['시즌 기록 없음',g=>{ delete g.sea; }],['없는 사용자 구단',g=>{ g.user=999; }],['선수 없음',g=>{ g.players={}; }],['구단 기록 없음',g=>{ g.sea.rec=[]; }],['구단 순서 뒤바뀜(검수 11-09zr #12)',g=>{ g.teams.reverse(); }],['일정표 없음(11-09zr #12)',g=>{ delete g.cal.sched; }],['상대 구단 전적 없음(11-09zr #12)',g=>{ g.sea.rec[(g.user+1)%g.sea.rec.length]=null; }]]){ importText(mk(f)); same(w); if(!/가져오지 않았습니다/.test(UI.impMsg||''))bad.push(w+': 거절 안내 없음'); }
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
  /* 검수 11-09zr #18: 목록에 빠진 정상 본문은 옮기고, 목록에 없는 손상 본문은 옮기지 않는다 */
  localStorage.clear(); if(!ftMigrateAccept(ev({[META]:JSON.stringify({active:1,slots:{}}),[slotKey(3)]:B1})))bad.push('itch: 목록에 빠진 정상 본문을 거절'); else { const m=meta(); if(!m.slots[3]||m.active!==3||!unpack(localStorage.getItem(slotKey(3))))bad.push('itch: 목록에 빠진 본문 목록 정보 없음 '+JSON.stringify(m)); }
  localStorage.clear(); if(!ftMigrateAccept(ev({[META]:mt,[slotKey(1)]:B1,[slotKey(4)]:'망가진 본문'})))bad.push('itch: 정상 슬롯과 손상 본문 함께 이전 실패'); else if(localStorage.getItem(slotKey(4))!=null||meta().slots[4])bad.push('itch: 손상 본문이 슬롯을 차지');
  localStorage.clear(); if(!ftMigrateAccept(ev({[META]:mt,[slotKey(1)]:B1})))bad.push('itch: 정상 이전 실패'); else { const m=meta(); if(Object.keys(m.slots).join()!=='1'||m.active!==1)bad.push('itch: 본문이 없는 슬롯이 목록에 남음 '+JSON.stringify(m)); }
  return bad; });
 /* 검수 11-09zzc: 중계 재개 상태, 가져오기·슬롯 전환 때 이전 게임 화면 상태, 결과가 든 당일 소식, 정지 알림 원본 연결, 만료 결정 */
 bad.push(...await pg.evaluate(async()=>{ const bad=[]; localStorage.clear(); CUR_SLOT=1; slotRevSync(1); SAVE_CONFL=false; if(!saveNow())bad.push('zzc 준비: 저장 실패');
  if(!G.games.some(g=>g.pbp&&g.pbp.length>20)){ try{ for(const t of G.teams)setEntry(t.id); const op=G.teams.find(t=>t.id!==G.user).id, x=simGame(G.day,G.user,op,false); keepGame(gameRecord(G.day,G.user,op,x,null)); }catch(e){ bad.push('zzc 준비: 경기 생성 실패 '+e.message); } }
  const gi=G.games.findIndex(g=>g.pbp&&g.pbp.length>20); if(gi<0)return ['zzc 준비: 중계 기록이 있는 경기가 없음']; const g=G.games[gi]; if(g.gid==null)g.gid=9e6;
  const body=()=>unpack(localStorage.getItem(slotKey(curSlot())));
  /* #1: 다른 게임에서 16번째 장면을 보던 중 2번째 장면 백업을 가져온다 */
  const b2=JSON.parse(prepG()); b2.castHold={g:gi,gid:g.gid,k:2}; const b0=JSON.parse(prepG()); delete b0.castHold;
  UI.cast={g:gi,k:16,play:true,pre:0,spd:1,mode:'hl',hold:1}; importText(JSON.stringify(b2)); if(!G.castHold||G.castHold.k!==2)bad.push('#1 가져온 중계 위치가 바뀜: '+JSON.stringify(G.castHold)); if((body().castHold||{}).k!==2)bad.push('#1 디스크의 중계 위치가 바뀜'); if(UI.cast&&UI.cast.k!==2)bad.push('#1 가져온 경기가 '+UI.cast.k+'번째 장면에서 열림');
  UI.cast={g:gi,k:16,play:true,pre:0,spd:1,mode:'hl',hold:1}; importText(JSON.stringify(b0)); if(G.castHold||body().castHold)bad.push('#1 중계 정보 없는 백업에 이전 중계 위치가 생김'); if(UI.cast)bad.push('#1 중계 정보 없는 백업에서 중계가 열림');
  /* #6·#7·#8·#9: 재개 상태 */
  UI.cast=null; G.castHold={g:gi,gid:g.gid,k:7,play:false,spd:3,mode:'all',pre:1,pi:2}; spoilG(); const c=UI.cast; if(!c||c.k!==7||c.play||c.spd!==3||c.mode!=='all'||!c.pre||!c.pitch||c.pitch.shown!==2)bad.push('#6~#8 재개 상태가 초기화됨: '+JSON.stringify(c));
  UI.cast=null; G.castHold={g:gi,gid:g.gid,k:-15}; if(spoilG()||UI.cast||G.castHold)bad.push('#9 잘못된 장면 번호를 받아들임');
  /* #4·#5: 자동 재생으로 지나간 장면, 경기 끝 */
  UI.cast={g:gi,k:1,play:true,pre:0,spd:1,mode:'hl',hold:1}; saveNow(); UI.cast.k=17; saveFlush(); if((body().castHold||{}).k!==17)bad.push('#4 탭을 숨길 때 지나간 장면을 저장하지 않음');
  UI.cast.k=g.pbp.length; saveFlush(); if(body().castHold)bad.push('#5 끝까지 본 중계가 미완료로 남음'); UI.cast=null; delete G.castHold;
  /* #11·#12: 결과가 든 당일 소식 */
  UI.cast={g:gi,k:3,play:false,pre:0,spd:1,mode:'hl',hold:1}; G.news=G.news||[]; G.news.unshift({id:9e8,d:g.day,t:'a'}); spoilNews(); G.news.unshift({id:9e8+1,d:g.day,t:'b'}); const cm=mail('구단주실','구단주와 함께 본 경기: 패배','본문'); cm.sgid=g.gid; spoilNews();
  if(G.news.some(n=>n.d>=g.day))bad.push('#12 숨긴 뒤 새 당일 기사가 공개됨'); if(G.mail.includes(cm))bad.push('#11 동석 보고 결과가 소식함에 남음'); UI.cast=null; spoilNews(); if(!G.mail.includes(cm)||!G.news.some(n=>n.id===9e8+1))bad.push('#11·#12 중계를 마친 뒤 소식이 돌아오지 않음');
  /* #2·#20·#21·#25·#27~#30: 세이브가 바뀌면 */
  UI.wkres={from:G.day-3,to:G.day,rk0:1}; const sm=mail('운영팀','정지 시험','본문',{imp:true}); G.stops=[sm,{id:'m999999',subj:'지운 알림'}]; const j=prepG(); const nx=JSON.parse(j); if(!nx.wkHold)bad.push('#20 확인 전 경기 요약을 저장하지 않음');
  SPOIL_SNAP={day:G.day,y:G.year,P:{}}; UI.fromMail='m1'; UI._ibJumpSig='x'; UI.cwAuto='cw1'; UI.wkres={from:1,to:2,rk0:9}; G=nx; uiSaveSync();
  if(SPOIL_SNAP)bad.push('#2 이전 슬롯의 경기 전 사본이 남음'); if(UI.fromMail||UI._ibJumpSig||UI.cwAuto)bad.push('#28~#30 이전 슬롯의 소식함·확인·동석 상태가 남음'); if(!UI.wkres||UI.wkres.rk0!==1)bad.push('#20·#21 경기 요약이 새 세이브 것이 아님: '+JSON.stringify(UI.wkres));
  if(G.stops.length!==1||G.stops[0]!==G.mail.find(m=>m.id===sm.id))bad.push('#25·#27 정지 알림이 원본 소식과 분리되거나 지운 알림이 남음'); UI.wkres=null;
  /* #26: 기한 지난 결정은 홈 카드에서도 실행 버튼이 없다 */
  const ev=evNew('cwInv','시험 결정','본문',[{l:'가',fx:''},{l:'나',fx:''}],{exp:1,def:1,data:{d:G.day+9,who:'own',why:'self'}}); G.day+=2; if(decisionCard().includes(ev.id+':'))bad.push('#26 만료 결정이 홈 결정 카드에서 실행 가능'); G.day-=2;
  return bad; }));
 const ok=!bad.length&&!errs.length; console.log(ok?'가져오기·슬롯 전환·itch 이전 점검 통과':'가져오기 점검 실패\n- '+bad.concat(errs).join('\n- ')); await b.close(); process.exit(ok?0:1); })();
