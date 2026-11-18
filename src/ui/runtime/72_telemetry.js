/* ---------- 플레이 기록(익명, 테스트용) ----------
 테스트 배포 때 '단장을 만들고 어디까지, 몇 년 차까지 하는지'와 어느 기능을 쓰는지, 어디서 막히는지를 보기 위한 기록.
 - TELE.ga(GA4 측정 ID)가 들어 있어 웹 배포판은 기본으로 켜진다(사용자 결정 11-09). TELE.ph(PostHog)는 비어 있어 꺼져 있다. 둘 다 비면 아무것도 보내지 않는다.
 - 이름·얼굴·저장 내용은 보내지 않는다. 기기마다 무작위 익명 번호만 쓴다. 세션 녹화에서는 입력칸을 가린다.
 - 설정 > 게임 설정에서 언제든 끌 수 있다.
 기록하는 것
 0) 로딩(사이트판만, tools/lib/site-runtime.cjs): boot_start → title_view(load_s 여는 데 걸린 초) / boot_fail(파일 못 받음)·boot_error(여는 중 오류)·boot_slow(20초 넘음)·boot_leave(열리기 전에 떠남)
 1) 시작 퍼널: title_view → team_list → team_pick → gm_created(mode 시작 방식 take/fd, diff, easy, guide) → draft_begin(드래프트 게임만) → draft_done → season_open → season_end(몇 년 차) → gm_out
 2) 기능: trade_propose · trade_offer_answer · fa_negotiate · fa_accept_counter · fa_signed · foreign_sign · draft_pick · train_set · role_set · pos_conv
          mgr_request · mgr_hire · mgr_fire · interview_done · interview_skip · press_play · scoop · overseas_program · mail_action · advance
 3) 화면: screen(어느 화면에서 어느 화면으로, 머문 초)
 4) 세션: session_start · session_end(플레이 시간, 읽은 소식 수, 진행 횟수, 마지막 화면과 게임 날짜)
 5) 오류: js_error(메시지, 위치, 화면, 게임 날짜)
 6) 앱 안 브라우저 안내(00_core.js inappBanner): inapp_notice_shown(app 앱 종류, os) · inapp_notice_click(app, act chrome/copy/close, os)
 모든 기록의 ver: 게임 버전-배포 커밋(없으면 빌드 번호 앞 8자). 단독 파일은 게임 버전만 */
var TELE={ph:'',phHost:'https://us.i.posthog.com',replay:true,ga:'G-78C5MN0LHM',lib:'https://cdn.jsdelivr.net/npm/posthog-js@1.435.5/dist/array.full.js'};
var TELE_GA=TELE.ga; /* 예전 이름 호환 */
function teleOn(){ if(!TELE.ph&&!TELE.ga)return false; try{ if(navigator.webdriver||/^(127\.|localhost$|0\.0\.0\.0$|\[::1\]$)/.test(location.hostname)||location.protocol==='file:')return false; }catch(e){} const m=meta(); return m.tele!==false; } /* 자동 점검·로컬 실행은 보내지 않는다(GA에 127.0.0.1 사용자 510명이 섞여 있었음, 11-08) */
function teleUid(){ try{ let u=localStorage.getItem('dsj_uid'); if(!u){ u='u'+Math.random().toString(36).slice(2,10)+Date.now().toString(36); localStorage.setItem('dsj_uid',u); } return u; }catch(e){ return 'anon'; } }
var TS={q:[],ready:false,fail:false,t0:Date.now(),reads:0,adv:0,space:0,acts:0,err:0,scr:null,scrT:Date.now()};
/* 배포 판별용 버전(11-17): GAME_VER만으로는 배포마다 같은 '0.9'라 어느 배포에서 생긴 일인지 몰랐다 */
function teleVer(){ if(TS.ver!=null)return TS.ver; let v=typeof GAME_VER!=='undefined'?GAME_VER:''; try{ const q=n=>(document.querySelector('meta[name="fronttime-'+n+'"]')||{}).content||''; const c=q('commit'), b=q('build'); if(c||b)v+='-'+(c?c.slice(0,7):b.slice(0,8)); }catch(e){} return TS.ver=v; }
function teleBase(){ const b={ver:teleVer(),tab:UI&&UI.tab||'',sub:UI&&UI.tab&&UI.sub?UI.sub[UI.tab]||'':''};
  try{ if(G){ b.game_year=G.year; b.game_date=dobj(G.day).m+'/'+dobj(G.day).d; b.period=period(); b.gm_year=(G.year-((G.gmP&&G.gmP.y0)||G.startY||G.year))+1; b.team=G.user; b.unemp=!!G.unemp; b.gm_bg=G.gmP?G.gmP.bg:''; } }catch(e){} return b; }
function teleLoad(){ if(window._teleL||!teleOn())return; window._teleL=1;
  if(TELE.ph){ try{ const s=document.createElement('script'); s.async=true; s.crossOrigin='anonymous'; s.src=TELE.lib;
      s.onload=()=>{ try{ window.posthog.init(TELE.ph,{api_host:TELE.phHost,person_profiles:'always',autocapture:false,capture_pageview:false,capture_pageleave:false,persistence:'localStorage',disable_session_recording:!TELE.replay,session_recording:{maskAllInputs:true},loaded:ph=>{ try{ ph.identify(teleUid()); }catch(e){} TS.ready=true; teleFlush(); }}); }catch(e){ TS.fail=true; teleFlush(); } };
      s.onerror=()=>{ TS.fail=true; teleFlush(); }; document.head.appendChild(s); setTimeout(()=>{ if(!TS.ready){ TS.fail=true; teleFlush(); } },8000); }catch(e){ TS.fail=true; } }
  if(TELE.ga){ try{ const pre=!!window._gaBoot; /* 사이트 첫 페이지가 로딩 기록용으로 gtag를 먼저 불렀다(tools/lib/site-runtime.cjs) */ window.dataLayer=window.dataLayer||[]; if(!pre){ window.gtag=function(){ dataLayer.push(arguments); }; gtag('js',new Date()); } if(pre){ gtag('event','page_view',{page_title:'프런트타임'}); return; } /* 첫 페이지가 이미 config를 했다(send_page_view:false): config를 두 번 하지 않고 페이지뷰만 한 번(11-17) */ gtag('config',TELE.ga,{user_id:teleUid(),send_page_view:true,page_title:'프런트타임',cookie_flags:'SameSite=None;Secure'}); /* 처음 한 번 페이지뷰를 보내야 유입 경로(첫 사용자 소스)와 페이지 보고서가 채워진다 */ const s=document.createElement('script'); s.async=true; s.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(TELE.ga); document.head.appendChild(s); }catch(e){} } }
/* PostHog 스크립트를 못 불러오면 직접 묶어 보낸다 */
function telePost(evs,beacon){ if(!TELE.ph||!evs.length)return; const body=JSON.stringify({api_key:TELE.ph,batch:evs.map(e=>({event:e.n,timestamp:e.ts,properties:Object.assign({distinct_id:teleUid(),$lib:'dsj-lite'},e.p)}))});
  try{ if(beacon&&navigator.sendBeacon){ navigator.sendBeacon(TELE.phHost+'/batch/',new Blob([body],{type:'application/json'})); return; } fetch(TELE.phHost+'/batch/',{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true}).catch(()=>{}); }catch(e){} }
function teleFlush(beacon){ const Q=TS.q.splice(0); if(!Q.length)return; if(TS.ready&&window.posthog&&window.posthog.capture){ for(const e of Q)try{ window.posthog.capture(e.n,e.p,beacon?{transport:'sendBeacon'}:undefined); }catch(x){} } else if(TS.fail)telePost(Q,beacon); else TS.q.unshift(...Q); }
function teleEv(name,p,beacon){ try{ if(!teleOn())return; teleLoad(); const e={n:name,p:Object.assign(teleBase(),p||{}),ts:new Date().toISOString()};
  if(TELE.ga&&window.gtag)try{ gtag('event',name,e.p); }catch(x){} if(!TELE.ph)return; TS.q.push(e); if(TS.ready||TS.fail)teleFlush(beacon); }catch(x){} }
/* 함수 감싸기: 원래 함수는 그대로 실행하고 끝난 뒤 기록만 남긴다 */
function teleWrap(name,fn){ const f=window[name]; if(typeof f!=='function'||f._tw)return; const w=function(...a){ const pre={tr:(G&&G.trades||[]).length,fa:(G&&G.fa&&G.fa.results||[]).length,iv:G&&G.iv&&!G.iv.done}; const r=f.apply(this,a); try{ fn(a,r,pre); }catch(e){} return r; }; w._tw=1; window[name]=w; }
function teleActWrap(k,fn){ const f=A[k]; if(typeof f!=='function'||f._tw)return; const w=function(...a){ let pre=null; try{ pre=fn.pre?fn.pre(a):null; }catch(e){} const r=f.apply(this,a); try{ fn(a,r,pre); }catch(e){} return r; }; w._tw=1; w._gw=f._gw; A[k]=w; } /* 결재창 감싸기 표시(_gw)를 물려받아 guardWrap이 두 번 감싸지 않게 */
function teleHooks(){ if(window._teleH)return; window._teleH=1; const ev=teleEv, me=()=>!G||G.unemp?false:true;
  /* 기능 사용 */
  teleWrap('proposeTrade',(a,r,pre)=>ev('trade_propose',{partner:a[0],give_n:(a[1]||[]).length,get_n:(a[2]||[]).length,cash:a[3]||0,done:(G.trades||[]).length>pre.tr}));
  teleWrap('answerOffer',(a)=>ev('trade_offer_answer',{yes:!!a[1]}));
  teleWrap('faNegotiate',(a)=>ev('fa_negotiate',{pid:a[0]}));
  teleWrap('faAcceptCounter',(a)=>ev('fa_accept_counter',{pid:a[0]}));
  teleWrap('faSign',(a,r,pre)=>{ const R=G.fa&&G.fa.results||[]; if(R.length>pre.fa&&R[0].to===G.user&&R[0].from!==G.user)ev('fa_signed',{annual:R[0].annual,years:R[0].years,grade:R[0].grade||''}); });
  teleWrap('signForeign',(a)=>{ if(a[0]===G.user&&!UI.title&&G.gmP)ev('foreign_sign',{}); });
  /* 단장이 직접 누른 것만(엔진이 스스로 부르는 경우는 빼려고 화면 동작을 감싼다) */
  /* 실제로 바뀐 때만 보낸다(11-17): 같은 버튼을 다시 누르거나 막힌 요청(군 복무·합류 전 등)은 빼려고 누르기 전후 상태를 비교한다 */
  const js=x=>{ try{ return JSON.stringify(x===undefined?null:x); }catch(e){ return ''; } }, pid=a=>+String(a[0]).split(':')[0];
  teleActWrap('trnSet',Object.assign((a,r,pre)=>{ if(pre!=null&&pre!==js(G.trn&&G.trn[pid(a)]))ev('train_set',{focus:String(a[0]).split(':')[1]}); },{pre:a=>js(G.trn&&G.trn[pid(a)])}));
  teleActWrap('trnApply',Object.assign((a,r,pre)=>{ if(!pre)return; const n=pre.ids.filter(id=>pre.v[id]!==js(G.trn&&G.trn[id])).length; if(n)ev('train_set',{bulk:true,n}); },{pre:()=>{ const ids=Object.keys(UI.trnPend||{}), v={}; for(const id of ids)v[id]=js(G.trn&&G.trn[id]); return {ids,v}; }}));
  teleActWrap('proleSet',Object.assign((a,r,pre)=>{ if(pre!=null&&pre!==js(G.prole&&G.prole[pid(a)]))ev('role_set',{role:String(a[0]).split(':')[1]}); },{pre:a=>js(G.prole&&G.prole[pid(a)])}));
  teleActWrap('posConv',Object.assign((a,r,pre)=>{ const p=G.players[pid(a)]; if(pre!=null&&p&&pre!==js(p.pconv))ev('pos_conv',{pos:String(a[0]).split(':')[1]||'stop'}); },{pre:a=>{ const p=G.players[pid(a)]; return p?js(p.pconv):null; }}));
  /* 엔트리 건의: 감독에게 실제로 전달된 때만(받아들임·거절 모두). 시즌 밖·대상 아님 같은 안내는 빼고, ok=받아들여 엔트리가 바뀌었는지 */
  const reqPre=a=>{ const p=G.players[+a[0]], m=G.mgr&&G.mgr[G.user]; return p?{e1:!!p.e1,rel:m?m.rel:null,mail:(G.mail||[]).length}:null; };
  const reqPost=up=>(a,r,pre)=>{ const p=G.players[+a[0]], m=G.mgr&&G.mgr[G.user]; if(!pre||!p)return; const ok=!!p.e1!==pre.e1; if(ok||(m&&m.rel!==pre.rel)||(G.mail||[]).length!==pre.mail)ev('mgr_request',{up,ok}); };
  teleActWrap('reqUp',Object.assign(reqPost(true),{pre:reqPre}));
  teleActWrap('reqDown',Object.assign(reqPost(false),{pre:reqPre}));
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
  teleActWrap('fdBegin',Object.assign((a,r,pre)=>{ if(pre&&!G.fdWait)ev('draft_begin',{}); },{pre:()=>!!(G&&G.fdWait)})); /* 이미 시작한 뒤 다시 눌러도 기록하지 않는다(1인당 최대 29.7회로 부풀던 문제, 11-17 대시보드) */
  teleActWrap('mailAct',Object.assign((a,r,pre)=>{ if(!pre)return; TS.acts++; ev('mail_action',pre); },{pre:a=>{ const [id,i]=String(a[0]).split(':'); const m=G&&G.mail.find(x=>x.id===id); const ac=m&&m.acts&&m.acts[+i]; if(!ac)return null; let end=null; try{ end=typeof mailButtonStatus==='function'?mailButtonStatus(m,ac):null; }catch(e){} return end?null:{act:ac.a,kind:m.kind||''}; }})); /* 없는 버튼·이미 끝난 일(mailButtonStatus)은 빼고(11-17) */
  teleActWrap('mailJump',()=>{ TS.reads++; });
  teleActWrap('adv',Object.assign((a,r,pre)=>{ if(!pre)return; const d=G.day-pre.d; if(d>0){ TS.adv++; ev('advance',{mode:a[0],days:d,stopped:!!(G.stops&&G.stops.length)}); } },{pre:()=>G?{d:G.day}:null}));
  teleActWrap('smode',Object.assign((a,r,pre)=>{ if(UI.sstep==='team'&&pre!=='team')ev('team_list',{mode:UI.smode==='take'?'take':'fd'}); },{pre:()=>UI.sstep})); /* 구단 목록은 시작 방식(smode)을 고를 때 열린다. 예전엔 tsGo('team')(단장 만들기에서 '구단 다시 고르기')만 걸려 거의 기록되지 않았다(11-17) */
  teleActWrap('tsGo',Object.assign((a,r,pre)=>{ if(a[0]==='team'&&pre!=='team')ev('team_list',{mode:UI.smode==='take'?'take':'fd'}); },{pre:()=>UI.sstep}));
  teleActWrap('start',Object.assign((a,r,pre)=>{ if(UI.sstep==='prof'&&UI.pickT===+a[0]&&pre!==UI.sstep+':'+UI.pickT)ev('team_pick',{pick:+a[0],mode:UI.smode==='take'?'take':'fd'}); },{pre:()=>UI.sstep+':'+UI.pickT})); /* 창단 지명 순서를 안 고르면 막힌다(fdNeed): 그때는 빼고 */
  /* 화면 이동: 렌더할 때 화면이 바뀌었으면 이전 화면에 머문 시간과 함께 */
  const R0=window.render; if(typeof R0==='function'&&!R0._tw){ const w=function(...a){ const r=R0.apply(this,a); try{ const k=UI.title?'title':(UI.tab||'')+(UI.sub&&UI.sub[UI.tab]?':'+UI.sub[UI.tab]:''); if(k!==TS.scr){ const now=Date.now(); if(TS.scr)ev('screen',{from:TS.scr,to:k,dwell_s:Math.round((now-TS.scrT)/1000)}); TS.scr=k; TS.scrT=now; } }catch(e){} return r; }; w._tw=1; window.render=w; }
  /* 오류 */
  window.addEventListener('error',e=>{ if(TS.err++>=10)return; ev('js_error',{msg:String(e.message||'').slice(0,200),src:String(e.filename||'').split('/').pop()+':'+(e.lineno||0)}); });
  window.addEventListener('unhandledrejection',e=>{ if(TS.err++>=10)return; ev('js_error',{msg:String(e.reason&&e.reason.message||e.reason||'').slice(0,200),src:'promise'}); });
  /* 세션 끝: 창을 닫거나 다른 탭으로 갈 때 */
  const end=()=>{ if(!teleOn()||TS.ended)return; TS.ended=true; ev('session_end',{dur_s:Math.round((Date.now()-TS.t0)/1000),reads:TS.reads,advances:TS.adv,mail_actions:TS.acts,last_screen:TS.scr||''},true); teleFlush(true); };
  window.addEventListener('pagehide',end); document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='hidden')end(); else if(TS.ended){ TS.ended=false; TS.t0=Date.now(); TS.reads=TS.adv=TS.acts=0; } });
  teleSession(); ev('title_view',{returning:!!(G||(typeof anySave==='function'&&anySave())),load_s:Math.round(performance.now()/100)/10}); }
function teleSession(){ if(TS.sess)return; TS.sess=1; teleEv('session_start',{}); }
/* 개인정보 처리 안내(설정 카드·크레딧 공용). 보내는 항목이 바뀌면 이 문구와 docs/privacy.md를 같이 고친다 */
function telePrivacyTxt(){ const by=[TELE.ga&&'Google Analytics(Google)',TELE.ph&&'PostHog'].filter(Boolean).join('와 ');
  return `웹판은 게임을 다듬기 위해 ${by}로 플레이 기록을 보냅니다: 기기마다 무작위로 만든 번호, 화면 이동과 머문 시간, 기능 사용(트레이드·FA 금액 같은 게임 수치 포함), 게임 날짜·연차·구단과 시작 방식, 오류 메시지와 게임을 여는 데 걸린 시간, 앱 안 브라우저 안내를 눌렀는지. ${TELE.ga?'Google은 접속 IP·쿠키·브라우저 정보를 함께 처리합니다. ':''}이름·얼굴·저장 내용은 보내지 않습니다.${TELE.ph&&TELE.replay?' 화면 녹화에서는 입력칸을 가립니다.':''} 내려받은 파일이나 내 컴퓨터에서 실행하면 보내지 않습니다. 설정의 '플레이 기록' 카드에서 언제든 끌 수 있습니다.`; }
function teleCard(){ if(!TELE.ph&&!TELE.ga)return ''; const on=teleOn();
  return `<section class="card"><div class="row between"><h2 class="sec">플레이 기록</h2><button class="btn small" data-a="teleTog">${on?'끄기':'켜기'}</button></div><p class="small muted">${telePrivacyTxt()} 지금: <b>${on?'켜짐':'꺼짐'}</b></p></section>`; }
Object.assign(A,{ inappGo(v){ const k=inappKind(); try{ teleEv('inapp_notice_click',{app:k,act:v,os:inappOs()}); }catch(e){}
    if(v==='close'){ UI.inappX=true; try{ sessionStorage.setItem('fo_inapp_x','1'); }catch(e){} render(); return; }
    if(v==='chrome'){ const u=inappIntent(); if(u)setTimeout(()=>{ location.href=u; },60); return; } /* 기록이 나간 뒤 이동(intent 링크는 Chrome을 연다) */
    if(v==='copy'){ let u=''; try{ u=location.href.split('#')[0]; }catch(e){} inappCopy(u).then(ok=>toast(ok?'게임 주소를 복사했습니다. Safari나 Chrome 주소창에 붙여 넣어 열어 주세요.':`복사하지 못했습니다. 주소를 직접 입력해 주세요: ${u}`)); } },
  licShow(){ UI.licOpen=!UI.licOpen; render(); }, teleTog(){ const m=meta(); m.tele=!teleOn(); setMeta(m); try{ if(!m.tele&&window.posthog&&window.posthog.opt_out_capturing)window.posthog.opt_out_capturing(); }catch(e){} render(); } });
/* 부팅 뒤 걸어 둔다(다른 파일의 함수가 모두 정의된 다음) */
setTimeout(()=>{ try{ if(TELE.ph||TELE.ga)teleHooks(); }catch(e){} },0);
