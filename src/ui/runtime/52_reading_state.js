/* Native disclosures survive renders; browser chrome resizing must not close what is being read. */
function readingContext(host){return host.id==='sheet'?'detail:'+(host.querySelector('.sheet,.cast')?.dataset.detailKey||UI.sheet||UI.person||''):JSON.stringify([UI.tab,UI.sub?.[UI.tab],UI.lseg,UI.it?.[UI.tab],UI.ibOpen||UI.ibSel,UI.homePanel,UI.homeFocus,UI.meet?[UI.meet.k,UI.meet.id,G.day]:null]);}
function rememberReading(host){if(!host?.dataset.readingContext)return;const context=host.dataset.readingContext;UI.readingOpen=UI.readingOpen||{};UI.readingScroll=UI.readingScroll||{};
 host.querySelectorAll('details[data-reading-key]').forEach(d=>UI.readingOpen[d.dataset.readingKey]=d.open);
 host.querySelectorAll('.ws-scroll,.tf-scroll,.ibm,.ibx-read,.sheet,.fmmain,.mt-log,.setx').forEach((el,i)=>{if(el.matches('.meet-page .mt-log'))return;if(el.scrollHeight>el.clientHeight+2)UI.readingScroll[context+':'+el.className+':'+i]=el.scrollTop;});
 const wf=host.querySelector('main.ws-frame');if(wf&&wf.scrollHeight>wf.clientHeight+2)UI.readingScroll[context+':frame']=wf.scrollTop;
 /* 휴대폰: 스크롤로 접힌 위쪽 머리(wsSet)도 기억한다. 다시 그릴 때 펼쳐지면 목록이 그만큼 밀려 '맨 위로 튄다'(카페 11-13: 학교 후원·인맥 관리) */
 const mn=host.querySelector('main.ws-frame,main.inbox-workspace');UI._wsKeep=UI._wsKeep||{};UI._wsKeep[host.id]=mn&&mn._wsy?{c:context,y:mn._wsy,mx:mn._wsMx}:null;
}
function restoreReading(host){if(!host)return;const context=readingContext(host),seen={};host.dataset.readingContext=context;UI.readingOpen=UI.readingOpen||{};
 host.querySelectorAll('details').forEach(d=>{const summary=d.querySelector('summary')?.textContent.trim().replace(/\d+/g,'#')||'상세',index=seen[summary]||0;seen[summary]=index+1;const key=context+':'+(d.dataset.k||summary+':'+index);d.dataset.readingKey=key;if(Object.hasOwn(UI.readingOpen,key))d.open=UI.readingOpen[key];});
 host.querySelectorAll('.ws-scroll,.tf-scroll,.ibm,.ibx-read,.sheet,.fmmain,.mt-log,.setx').forEach((el,i)=>{if(el.matches('.meet-page .mt-log'))return;const y=UI.readingScroll?.[context+':'+el.className+':'+i];if(y!=null)el.scrollTop=y;});
 /* 휴대폰 작업 공간 전체 스크롤(감독 채용·신인 드래프트): 다시 그려도 읽던 위치 유지. 드래프트는 처음 열 때 영입 탭 줄을 위로 밀어 후보 목록부터 보인다 */
 {const K=(UI._wsKeep||{})[host.id],mn=host.querySelector('main.ws-frame,main.inbox-workspace');if(K&&mn&&K.c===context&&typeof wsSet==='function'&&wsMobile()){mn._wsMx=K.mx;wsSet(mn,K.y);}}
 const wf=host.querySelector('main.ws-frame');if(wf){const y=UI.readingScroll?.[context+':frame'],d=wf.querySelector('.draft-page');if(y!=null)wf.scrollTop=y;else if(d&&innerWidth<600)wf.scrollTop=d.getBoundingClientRect().top-wf.getBoundingClientRect().top;}
}
