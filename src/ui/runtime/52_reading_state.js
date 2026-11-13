/* Native disclosures survive renders; browser chrome resizing must not close what is being read. */
/* 다시 그려도 스크롤 위치를 기억하는 칸. ws-own(스스로 스크롤하는 작업 칸: 훈련 코치·부상 관리·전력분석·자매구단·구단 정보 등)이 빠져 있어 버튼을 누르면 맨 위로 튀었다(모바일 점검 11-13) */
const READING_SCROLL='.ws-scroll,.ws-own,.tf-scroll,.ibm,.ibx-read,.sheet,.fmmain,.mt-log,.setx';
function readingContext(host){return host.id==='sheet'?'detail:'+(host.querySelector('.sheet,.cast')?.dataset.detailKey||UI.sheet||UI.person||''):JSON.stringify([UI.tab,UI.sub?.[UI.tab],UI.lseg,UI.it?.[UI.tab],UI.ibOpen||UI.ibSel,UI.homePanel,UI.homeFocus,UI.meet?[UI.meet.k,UI.meet.id,G.day]:null]);}
function rememberReading(host){if(!host?.dataset.readingContext)return;const context=host.dataset.readingContext;UI.readingOpen=UI.readingOpen||{};UI.readingScroll=UI.readingScroll||{};
 host.querySelectorAll('details[data-reading-key]').forEach(d=>UI.readingOpen[d.dataset.readingKey]=d.open);
 host.querySelectorAll(READING_SCROLL).forEach((el,i)=>{if(el.matches('.meet-page .mt-log'))return;if(el.scrollHeight>el.clientHeight+2)UI.readingScroll[context+':'+el.className+':'+i]=el.scrollTop;});
 const wf=host.querySelector('main.ws-frame');if(wf&&wf.scrollHeight>wf.clientHeight+2)UI.readingScroll[context+':frame']=wf.scrollTop;
 /* 휴대폰: 스크롤로 접힌 위쪽 머리(wsSet)도 기억한다. 다시 그릴 때 펼쳐지면 목록이 그만큼 밀려 '맨 위로 튄다'(카페 11-13: 학교 후원·인맥 관리) */
 const mn=host.querySelector('main.ws-frame,main.inbox-workspace');UI._wsKeep=UI._wsKeep||{};UI._wsKeep[host.id]=mn&&mn._wsy?{c:context,y:mn._wsy,mx:mn._wsMx}:null;
 /* 위 목록에 없는 안쪽 스크롤 칸(관계도 여러 명 선택 목록·인물 카드 묶음 등)도 기억한다. 같은 모양(태그·클래스)의 몇 번째 칸인지로 다시 찾는다(모바일 점검 11-13: 체크할 때마다 맨 위로) */
 UI.readingScrollX=UI.readingScrollX||{};const X=[];for(const el of host.querySelectorAll('[class]')){if(el.scrollTop<=0||el.matches(READING_SCROLL)||el.matches('main.ws-frame'))continue;const cls=el.getAttribute('class');X.push({t:el.tagName,c:cls,i:readingSameIndex(host,el,cls),y:el.scrollTop});if(X.length>=12)break;}UI.readingScrollX[context]=X;
}
function readingSameAll(host,tag,cls){return [...host.getElementsByClassName(cls.trim().split(/\s+/)[0]||'')].filter(e=>e.tagName===tag&&e.getAttribute('class')===cls);}
function readingSameIndex(host,el,cls){return readingSameAll(host,el.tagName,cls).indexOf(el);}
function restoreReading(host){if(!host)return;const context=readingContext(host),seen={};host.dataset.readingContext=context;UI.readingOpen=UI.readingOpen||{};
 host.querySelectorAll('details').forEach(d=>{const summary=d.querySelector('summary')?.textContent.trim().replace(/\d+/g,'#')||'상세',index=seen[summary]||0;seen[summary]=index+1;const key=context+':'+(d.dataset.k||summary+':'+index);d.dataset.readingKey=key;if(Object.hasOwn(UI.readingOpen,key))d.open=UI.readingOpen[key];});
 host.querySelectorAll(READING_SCROLL).forEach((el,i)=>{if(el.matches('.meet-page .mt-log'))return;const y=UI.readingScroll?.[context+':'+el.className+':'+i];if(y!=null)el.scrollTop=y;});
 for(const x of (UI.readingScrollX||{})[context]||[]){const el=readingSameAll(host,x.t,x.c)[x.i];if(el&&!el.scrollTop)el.scrollTop=x.y;}
 /* 휴대폰 작업 공간 전체 스크롤(감독 채용·신인 드래프트): 다시 그려도 읽던 위치 유지. 드래프트는 처음 열 때 영입 탭 줄을 위로 밀어 후보 목록부터 보인다 */
 {const K=(UI._wsKeep||{})[host.id],mn=host.querySelector('main.ws-frame,main.inbox-workspace');if(K&&mn&&K.c===context&&typeof wsSet==='function'&&wsMobile()){mn._wsMx=K.mx;wsSet(mn,K.y);}}
 const wf=host.querySelector('main.ws-frame');if(wf){const y=UI.readingScroll?.[context+':frame'],d=wf.querySelector('.draft-page');if(y!=null)wf.scrollTop=y;else if(d&&innerWidth<600)wf.scrollTop=d.getBoundingClientRect().top-wf.getBoundingClientRect().top;}
 tapAnchorKeep(host,context);
}
/* 누른 버튼을 손가락 밑에 둔다: 같은 화면에서 다시 그린 뒤 위쪽에 안내·선택 막대가 끼거나 빠지면 스크롤 숫자는 같아도 목록이 밀렸다
   (모바일 점검 11-13: 훈련 방향 버튼을 누르면 위에 '감독에게 제안하기' 막대가 생겨 56px 밀림). 누른 버튼을 다시 찾아 그 칸의 스크롤만 차이만큼 옮긴다 */
function tapAnchor(el){const host=el?.closest('#app,#sheet');if(!host||!host.dataset.readingContext||!el.isConnected)return null;const sel=`[data-a="${CSS.escape(el.dataset.a||'')}"]`+(el.dataset.v!=null?`[data-v="${CSS.escape(el.dataset.v)}"]`:':not([data-v])'),L=[...host.querySelectorAll(sel)];
 return {host:host.id,ctx:host.dataset.readingContext,sel,k:L.indexOf(el),n:L.length,top:el.getBoundingClientRect().top};}
function tapAnchorKeep(host,context){const T=UI._tapAnchor;if(!T||T.host!==host.id||T.ctx!==context)return;const L=host.querySelectorAll(T.sel),el=L.length===T.n?L[T.k]:null;if(!el)return;
 const d=Math.round(el.getBoundingClientRect().top-T.top);if(Math.abs(d)<2)return;
 let s=el.parentElement;while(s&&s!==host&&!(s.scrollHeight>s.clientHeight+2&&/(auto|scroll)/.test(getComputedStyle(s).overflowY)))s=s.parentElement;
 if(s&&s!==host&&host.contains(s))s.scrollTop+=d;}
