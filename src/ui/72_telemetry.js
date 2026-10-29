/* ---------- 플레이 기록(익명, 테스트용) ----------
 테스트 배포 때 '단장을 만들고 어디까지, 몇 년 차까지 하는지'와 어느 기능을 쓰는지, 어디서 막히는지를 보기 위한 기록.
 - TELE.ph에 PostHog 프로젝트 키(phc_…)를 넣어야 켜진다. 비어 있으면 아무것도 보내지 않는다(GA4 측정 ID도 넣을 수 있다).
 - 이름·얼굴·저장 내용은 보내지 않는다. 기기마다 무작위 익명 번호만 쓴다. 세션 녹화에서는 입력칸을 가린다.
 - 설정 > 게임 설정에서 언제든 끌 수 있다.
 기록하는 것
 1) 시작 퍼널: title_view → team_list → team_pick → gm_created → draft_begin → draft_done → season_open → season_end(몇 년 차) → gm_out
 2) 기능: trade_propose · trade_offer_answer · fa_negotiate · fa_accept_counter · fa_signed · foreign_sign · draft_pick · train_set · role_set · pos_conv
          mgr_request · mgr_hire · mgr_fire · interview_done · interview_skip · press_play · scoop · overseas_program · mail_action · advance
 3) 화면: screen(어느 화면에서 어느 화면으로, 머문 초)
 4) 세션: session_start · session_end(플레이 시간, 읽은 소식 수, 진행 횟수, 마지막 화면과 게임 날짜)
 5) 오류: js_error(메시지, 위치, 화면, 게임 날짜) */
var TELE={ph:'',phHost:'https://us.i.posthog.com',replay:true,ga:'',lib:'https://cdn.jsdelivr.net/npm/posthog-js@1.435.5/dist/array.full.js'};
var TELE_GA=TELE.ga; /* 예전 이름 호환 */
function teleOn(){ if(!TELE.ph&&!TELE.ga)return false; const m=meta(); return m.tele!==false; }
function teleUid(){ try{ let u=localStorage.getItem('dsj_uid'); if(!u){ u='u'+Math.random().toString(36).slice(2,10)+Date.now().toString(36); localStorage.setItem('dsj_uid',u); } return u; }catch(e){ return 'anon'; } }
var TS={q:[],ready:false,fail:false,t0:Date.now(),reads:0,adv:0,space:0,acts:0,err:0,scr:null,scrT:Date.now()};
function teleBase(){ const b={ver:typeof GAME_VER!=='undefined'?GAME_VER:'',tab:UI&&UI.tab||'',sub:UI&&UI.tab&&UI.sub?UI.sub[UI.tab]||'':''};
  try{ if(G){ b.game_year=G.year; b.game_date=dobj(G.day).m+'/'+dobj(G.day).d; b.period=period(); b.gm_year=(G.year-((G.gmP&&G.gmP.y0)||G.startY||G.year))+1; b.team=G.user; b.unemp=!!G.unemp; b.gm_bg=G.gmP?G.gmP.bg:''; } }catch(e){} return b; }
function teleLoad(){ if(window._teleL||!teleOn())return; window._teleL=1;
  if(TELE.ph){ try{ const s=document.createElement('script'); s.async=true; s.crossOrigin='anonymous'; s.src=TELE.lib;
      s.onload=()=>{ try{ window.posthog.init(TELE.ph,{api_host:TELE.phHost,person_profiles:'always',autocapture:false,capture_pageview:false,capture_pageleave:false,persistence:'localStorage',disable_session_recording:!TELE.replay,session_recording:{maskAllInputs:true},loaded:ph=>{ try{ ph.identify(teleUid()); }catch(e){} TS.ready=true; teleFlush(); }}); }catch(e){ TS.fail=true; teleFlush(); } };
      s.onerror=()=>{ TS.fail=true; teleFlush(); }; document.head.appendChild(s); setTimeout(()=>{ if(!TS.ready){ TS.fail=true; teleFlush(); } },8000); }catch(e){ TS.fail=true; } }
  if(TELE.ga){ try{ window.dataLayer=window.dataLayer||[]; window.gtag=function(){ dataLayer.push(arguments); }; gtag('js',new Date()); gtag('config',TELE.ga,{user_id:teleUid(),send_page_view:false,cookie_flags:'SameSite=None;Secure'}); const s=document.createElement('script'); s.async=true; s.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(TELE.ga); document.head.appendChild(s); }catch(e){} } }
/* PostHog 스크립트를 못 불러오면 직접 묶어 보낸다 */
function telePost(evs,beacon){ if(!TELE.ph||!evs.length)return; const body=JSON.stringify({api_key:TELE.ph,batch:evs.map(e=>({event:e.n,timestamp:e.ts,properties:Object.assign({distinct_id:teleUid(),$lib:'dsj-lite'},e.p)}))});
  try{ if(beacon&&navigator.sendBeacon){ navigator.sendBeacon(TELE.phHost+'/batch/',new Blob([body],{type:'application/json'})); return; } fetch(TELE.phHost+'/batch/',{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true}).catch(()=>{}); }catch(e){} }
function teleFlush(beacon){ const Q=TS.q.splice(0); if(!Q.length)return; if(TS.ready&&window.posthog&&window.posthog.capture){ for(const e of Q)try{ window.posthog.capture(e.n,e.p,beacon?{transport:'sendBeacon'}:undefined); }catch(x){} } else if(TS.fail)telePost(Q,beacon); else TS.q.unshift(...Q); }
function teleEv(name,p,beacon){ try{ if(!teleOn())return; teleLoad(); const e={n:name,p:Object.assign(teleBase(),p||{}),ts:new Date().toISOString()};
  if(TELE.ga&&window.gtag)try{ gtag('event',name,e.p); }catch(x){} if(!TELE.ph)return; TS.q.push(e); if(TS.ready||TS.fail)teleFlush(beacon); }catch(x){} }
/* 함수 감싸기: 원래 함수는 그대로 실행하고 끝난 뒤 기록만 남긴다 */
function teleWrap(name,fn){ const f=window[name]; if(typeof f!=='function'||f._tw)return; const w=function(...a){ const pre={tr:(G&&G.trades||[]).length,fa:(G&&G.fa&&G.fa.results||[]).length,iv:G&&G.iv&&!G.iv.done}; const r=f.apply(this,a); try{ fn(a,r,pre); }catch(e){} return r; }; w._tw=1; window[name]=w; }
function teleActWrap(k,fn){ const f=A[k]; if(typeof f!=='function'||f._tw)return; const w=function(...a){ let pre=null; try{ pre=fn.pre?fn.pre(a):null; }catch(e){} const r=f.apply(this,a); try{ fn(a,r,pre); }catch(e){} return r; }; w._tw=1; A[k]=w; }
function teleHooks(){ if(window._teleH)return; window._teleH=1; const ev=teleEv, me=()=>!G||G.unemp?false:true;
  /* 기능 사용 */
  teleWrap('proposeTrade',(a,r,pre)=>ev('trade_propose',{partner:a[0],give_n:(a[1]||[]).length,get_n:(a[2]||[]).length,cash:a[3]||0,done:(G.trades||[]).length>pre.tr}));
  teleWrap('answerOffer',(a)=>ev('trade_offer_answer',{yes:!!a[1]}));
  teleWrap('faNegotiate',(a)=>ev('fa_negotiate',{pid:a[0]}));
  teleWrap('faAcceptCounter',(a)=>ev('fa_accept_counter',{pid:a[0]}));
  teleWrap('faSign',(a,r,pre)=>{ const R=G.fa&&G.fa.results||[]; if(R.length>pre.fa&&R[0].to===G.user&&R[0].from!==G.user)ev('fa_signed',{annual:R[0].annual,years:R[0].years,grade:R[0].grade||''}); });
  teleWrap('signForeign',(a)=>{ if(a[0]===G.user&&!UI.title&&G.gmP)ev('foreign_sign',{}); });
  /* 단장이 직접 누른 것만(엔진이 스스로 부르는 경우는 빼려고 화면 동작을 감싼다) */
  teleActWrap('trnSet',(a)=>ev('train_set',{focus:String(a[0]).split(':')[1]}));
  teleActWrap('trnApply',()=>ev('train_set',{bulk:true}));
  teleActWrap('proleSet',(a)=>ev('role_set',{role:String(a[0]).split(':')[1]}));
  teleActWrap('posConv',(a)=>ev('pos_conv',{pos:String(a[0]).split(':')[1]||'stop'}));
  teleActWrap('reqUp',()=>ev('mgr_request',{up:true}));
  teleActWrap('reqDown',()=>ev('mgr_request',{up:false}));
  teleWrap('hireMgr',(a)=>{ if(me())ev('mgr_hire',{years:a[1],pledges:(a[3]||[]).length}); });
  teleWrap('fireMgr',()=>ev('mgr_fire',{}));
  teleWrap('ivAnswer',(a,r,pre)=>{ if(pre.iv&&G.iv&&G.iv.done)ev('interview_done',{topic:G.iv.k}); });
  teleWrap('ivSkip',(a,r,pre)=>{ if(pre.iv)ev('interview_skip',{topic:G.iv&&G.iv.k,lapse:!!(G.iv&&G.iv.lapse)}); });
  teleWrap('pressPlay',(a)=>ev('press_play',{kind:a[1]}));
  teleWrap('repScoop',()=>ev('scoop',{}));
  teleWrap('setOvs',(a)=>ev('overseas_program',{prog:a[1]||'none'}));
  teleWrap('fdFinish',()=>{ const F=G.fd; ev('draft_done',{manual:F?F.picks.filter(x=>x.tid===G.user&&x.pid&&!x.auto).length:0}); });
  teleWrap('openingDay',()=>ev('season_open',{}));
  teleActWrap('fdPick',Object.assign((a,r,pre)=>{ if(pre!=null&&G.fd&&G.fd.cur>pre)ev('draft_pick',{rd:G.fd.picks[G.fd.cur-1].rd}); },{pre:()=>G.fd?G.fd.cur:null}));
  teleActWrap('fdBegin',()=>ev('draft_begin',{}));
  teleActWrap('mailAct',(a)=>{ TS.acts++; const [id,i]=String(a[0]).split(':'); const m=G.mail.find(x=>x.id===id); const ac=m&&m.acts&&m.acts[+i]; ev('mail_action',{act:ac?ac.a:'',kind:m?m.kind:''}); });
  teleActWrap('mailJump',()=>{ TS.reads++; });
  teleActWrap('adv',Object.assign((a,r,pre)=>{ if(!pre)return; const d=G.day-pre.d; if(d>0){ TS.adv++; ev('advance',{mode:a[0],days:d,stopped:!!(G.stops&&G.stops.length)}); } },{pre:()=>G?{d:G.day}:null}));
  teleActWrap('tsGo',(a)=>{ if(a[0]==='team')ev('team_list',{}); });
  teleActWrap('start',(a)=>ev('team_pick',{pick:+a[0]}));
  /* 화면 이동: 렌더할 때 화면이 바뀌었으면 이전 화면에 머문 시간과 함께 */
  const R0=window.render; if(typeof R0==='function'&&!R0._tw){ const w=function(...a){ const r=R0.apply(this,a); try{ const k=UI.title?'title':(UI.tab||'')+(UI.sub&&UI.sub[UI.tab]?':'+UI.sub[UI.tab]:''); if(k!==TS.scr){ const now=Date.now(); if(TS.scr)ev('screen',{from:TS.scr,to:k,dwell_s:Math.round((now-TS.scrT)/1000)}); TS.scr=k; TS.scrT=now; } }catch(e){} return r; }; w._tw=1; window.render=w; }
  /* 오류 */
  window.addEventListener('error',e=>{ if(TS.err++>=10)return; ev('js_error',{msg:String(e.message||'').slice(0,200),src:String(e.filename||'').split('/').pop()+':'+(e.lineno||0)}); });
  window.addEventListener('unhandledrejection',e=>{ if(TS.err++>=10)return; ev('js_error',{msg:String(e.reason&&e.reason.message||e.reason||'').slice(0,200),src:'promise'}); });
  /* 세션 끝: 창을 닫거나 다른 탭으로 갈 때 */
  const end=()=>{ if(!teleOn()||TS.ended)return; TS.ended=true; ev('session_end',{dur_s:Math.round((Date.now()-TS.t0)/1000),reads:TS.reads,advances:TS.adv,mail_actions:TS.acts,last_screen:TS.scr||''},true); teleFlush(true); };
  window.addEventListener('pagehide',end); document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='hidden')end(); else if(TS.ended){ TS.ended=false; TS.t0=Date.now(); TS.reads=TS.adv=TS.acts=0; } });
  teleSession(); ev('title_view',{returning:!!(G||(typeof anySave==='function'&&anySave()))}); }
function teleSession(){ if(TS.sess)return; TS.sess=1; teleEv('session_start',{}); }
function teleCard(){ if(!TELE.ph&&!TELE.ga)return ''; const on=teleOn();
  return `<section class="card"><div class="row between"><h2 class="sec">익명 플레이 기록</h2><button class="btn small" data-a="teleTog">${on?'끄기':'켜기'}</button></div><p class="small muted">게임을 다듬기 위해 시작한 구단, 몇 년 차까지 했는지, 어떤 기능을 쓰는지, 오류가 난 화면 같은 기록을 익명으로 보냅니다. 이름·얼굴·저장 내용은 보내지 않고, 화면 녹화에서는 입력칸을 가립니다. 지금: <b>${on?'켜짐':'꺼짐'}</b></p></section>`; }
Object.assign(A,{ teleTog(){ const m=meta(); m.tele=!teleOn(); setMeta(m); try{ if(!m.tele&&window.posthog&&window.posthog.opt_out_capturing)window.posthog.opt_out_capturing(); }catch(e){} render(); } });
/* 부팅 뒤 걸어 둔다(다른 파일의 함수가 모두 정의된 다음) */
setTimeout(()=>{ try{ if(TELE.ph||TELE.ga)teleHooks(); }catch(e){} },0);
