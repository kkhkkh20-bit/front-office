/* Native disclosures survive renders; browser chrome resizing must not close what is being read. */
function readingContext(host){return host.id==='sheet'?'detail:'+(host.querySelector('.sheet,.cast')?.dataset.detailKey||UI.sheet||UI.person||''):JSON.stringify([UI.tab,UI.sub?.[UI.tab],UI.lseg,UI.it?.[UI.tab],UI.ibOpen||UI.ibSel,UI.homePanel,UI.homeFocus,UI.meet?[UI.meet.k,UI.meet.id,G.day]:null]);}
function rememberReading(host){if(!host?.dataset.readingContext)return;const context=host.dataset.readingContext;UI.readingOpen=UI.readingOpen||{};UI.readingScroll=UI.readingScroll||{};
 host.querySelectorAll('details[data-reading-key]').forEach(d=>UI.readingOpen[d.dataset.readingKey]=d.open);
 host.querySelectorAll('.ws-scroll,.ibm,.ibx-read,.sheet,.fmmain,.mt-log').forEach((el,i)=>{if(el.matches('.meet-page .mt-log'))return;if(el.scrollHeight>el.clientHeight+2)UI.readingScroll[context+':'+el.className+':'+i]=el.scrollTop;});
}
function restoreReading(host){if(!host)return;const context=readingContext(host),seen={};host.dataset.readingContext=context;UI.readingOpen=UI.readingOpen||{};
 host.querySelectorAll('details').forEach(d=>{const summary=d.querySelector('summary')?.textContent.trim().replace(/\d+/g,'#')||'상세',index=seen[summary]||0;seen[summary]=index+1;const key=context+':'+(d.dataset.k||summary+':'+index);d.dataset.readingKey=key;if(Object.hasOwn(UI.readingOpen,key))d.open=UI.readingOpen[key];});
 host.querySelectorAll('.ws-scroll,.ibm,.ibx-read,.sheet,.fmmain,.mt-log').forEach((el,i)=>{if(el.matches('.meet-page .mt-log'))return;const y=UI.readingScroll?.[context+':'+el.className+':'+i];if(y!=null)el.scrollTop=y;});
}
