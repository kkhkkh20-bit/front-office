/* ===== 래더 v4 자동 등록(구단주 11-18, docs/design/ladder-v4-2026-11-18.md §1) =====
   커리어 게임을 하는 모든 유저의 지금 구단 1군(26명)을 래더 덱으로 자동 등록한다. 등록 단추는 없다(설정 › 래더에서 끌 수 있다).
   갱신: 하루 한 번(그날 처음 켜거나 날짜를 넘길 때)과 시즌이 끝날 때(시즌 종료 앨범이 새로 생김). 덱이 그대로면 올리지 않는다.
   이 파일은 이 저장(G.uld)만 다룬다: 덱 만들기(cupEntryNow)는 난수를 쓰지 않고 커리어 세계를 바꾸지 않는다. 진행 중인 래더 리그는 건드리지 않는다(다음 리그부터 새 덱).
   상태 G.uld.ar = {day(마지막으로 본 날, 한국시간 날 번호), h(서버에 올린 덱 해시), alb(본 시즌 종료 앨범 번호), pend(못 올려 다시 보낼 것), at(서버 확정), localAt(기기 확인), cap(상한 초과 1), err(서버 거절), rosterErr/rosterAt(현재 1군 실패), man(직접 다시 등록한 날), drop(직접 등록 때 뺀 선수)}.
   서버 보내기·끄기·첫 안내는 화면 쪽(src/ui/uladder/05_uladder_auto.js) */
function ulAutoAlb(){ let m=0; for(const a of cupAlbum())if(a&&a.k==='auto'&&(a.id|0)>m)m=a.id|0; return m; }
/* 지금 1군 덱(구단을 맡고 있을 때만). 이름은 지금 등록한 덱 이름 → 구단 별칭. 직접 등록 때 상한을 맞추려고 뺀 선수(ar.drop)는 지금도 1군에 있으면 똑같이 뺀다 */
function ulAutoEntry(info){ if(!G||G.unemp||G.user==null||!team(G.user))return null; const C=FrontOfficeCore, U=uld(), A=U.ar||{};
  const nm=(U.deck&&U.deck.e&&U.deck.e.name)||team(G.user).nick; let e=null;
  /* 등번호(jno)는 처음 볼 때 정해지며 G에 적힌다. 자동 등록은 커리어 세계를 바꾸지 않게 우리 선수 등번호 칸을 되돌린다(같은 규칙이라 나중에 정해져도 같은 번호) */
  const K=['no','noT','noBy'], keep=Object.values(G.players).filter(p=>p&&p.team===G.user).map(p=>[p,K.map(k=>k in p?[1,k==='noBy'&&p[k]?JSON.stringify(p[k]):p[k]]:[0])]);
  try{ e=cupEntryNow({name:nm}); } finally { for(const [p,v] of keep)K.forEach((k,i)=>{ if(v[i][0])p[k]=k==='noBy'&&v[i][1]?JSON.parse(v[i][1]):v[i][1]; else delete p[k]; }); }
  if(!e){ if(info)info.msg='현재 1군 명단을 만들 수 없습니다. 1군 등록 인원을 확인해 주세요.'; return null; }
  if(Array.isArray(A.drop)&&A.drop.length){ const ids=A.drop.filter(id=>e.P.some(p=>p.id===id)); if(ids.length){ const r=C.ulCapDrop(e,ids); if(!r.err&&r.e)e=r.e; } }
  const x=C.ulSlim(e); x.h=C.cupEntryHash(x); x.ovr=cupOvr(x); const v=C.cupValidate(x,{}); if(!v.ok&&info)info.msg=v.errors&&v.errors[0]&&v.errors[0].msg||'현재 1군 덱의 선수 구성을 확인해 주세요.'; return v.ok?x:null; }
/* 지금 볼 차례인지 정하고, 차례면 이 저장의 내 덱(U.deck)을 지금 1군으로 바꾼다(바뀐 경우만). 연봉 상한을 넘어도 덱은 등록한다(그 단계 리그 시작이 '상한 초과'로 막는다).
   앨범 시즌 덱을 직접 골라 등록했으면 자동 갱신을 멈춘다(지금 1군으로 다시 등록하면 이어진다). force: 날짜와 상관없이(설정의 '지금 덱으로 다시 등록').
   → {skip:'album'|'noteam'|'roster', msg?} | {due, why, upload, day, alb, x, cap} */
function ulAutoPlan(now,force,opt){ const U=uld(), C=FrontOfficeCore; if(!U)return {skip:'noteam'}; const A=U.ar||(U.ar={}); now=now??Date.now();
  if(U.deck&&U.deck.src&&U.deck.src!=='now'&&!(force&&opt&&opt.src==='now'))return {skip:'album'};
  if(!G||G.unemp||G.user==null||!team(G.user))return {skip:'noteam'};
  { const ed=editedBlock(); if(ed)return {skip:'edited',msg:ed}; } /* 편집된 저장은 자동 등록하지 않는다(22d_edited). 덱도 만들지 않는다 */
  if(!force&&G&&!G.unemp&&G.user!=null&&team(G.user)){ const alb0=ulAutoAlb(), d0=C.ulAutoDue(A,now,null,alb0); if(!d0.due)return {...d0,upload:false,alb:alb0}; } /* 차례가 아니면 덱(1군 26명 사본)을 만들지 않는다: 1분마다 확인할 때 무거웠다(성능 11-18). 차례 판정(날·시즌 앨범·재전송)은 덱 해시와 무관 */
  const info={}; let x=null, why=''; try{ x=ulAutoEntry(info); why=x?ulDeckReady(x):info.msg||'현재 1군 덱을 만들 수 없습니다. 1군 등록 인원과 선수 구성을 확인해 주세요.'; }catch(e){ why='현재 1군 덱을 만들 수 없습니다. 1군 등록 인원과 선수 구성을 확인해 주세요.'; }
  if(why){ A.rosterErr=why; A.rosterAt=now; return {skip:'roster',msg:why}; }
  delete A.rosterErr; delete A.rosterAt;
  const alb=ulAutoAlb(), d=C.ulAutoDue(A,now,x.h,alb); if(force){ d.due=true; d.why='force'; d.upload=true; }
  d.alb=alb; d.x=x; d.cap=C.ulCapGate(x,U.tier|0,now).ok?0:1; if(!d.due)return d;
  if(!U.deck||U.deck.e.h!==x.h){ U.dn=(U.dn||0)+1; U.deck={id:U.dn,src:'now',auto:1,at:G.day,y:G.year,e:x}; } else { U.deck.src='now'; U.deck.auto=1; }
  A.cap=d.cap; return d; }
/* 보낸 결과 적기. r: 'ok'(올림) · 'same'(바뀐 게 없음·서버 없음: 오늘은 끝) · 'fail'(연결 끊김·서버 오류: 다음에 다시) · 'reject'(서버가 거절: 오늘은 끝, 사유 msg) */
function ulAutoDone(p,r,msg,now,capturedU){ const U=capturedU||uld(); if(!U||!p||p.skip)return; const A=U.ar||(U.ar={}); now=now??Date.now();
  A.day=p.day; A.alb=p.alb;
  if(r==='ok'){ A.h=p.x.h; A.pend=0; A.at=now; A.err=''; delete A.localAt; if(A.manualReject&&A.manualReject.h===p.x.h)delete A.manualReject; }
  else if(r==='fail'){ A.pend=1; }
  else { A.pend=0; A.err=r==='reject'?String(msg||''):''; if(r==='same')A.localAt=now; } }
/* 직접 등록(내 덱 화면 '덱 등록·갱신', 설정 '지금 덱으로 다시 등록')을 했을 때: 하루 1회 표시, 뺀 선수 기억(지금 1군일 때) */
function ulAutoManual(src,drop,now){ const U=uld(); if(!U)return; const A=U.ar||(U.ar={}); A.man=FrontOfficeCore.ulDayId(now??Date.now()); A.drop=src==='now'&&Array.isArray(drop)?drop.slice(0,26):[]; if(U.deck){ U.deck.auto=src==='now'?1:0; } }
