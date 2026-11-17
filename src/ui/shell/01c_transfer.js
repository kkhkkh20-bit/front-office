/* 기기 옮기기: 저장을 게임 서버(worker/index.js, /api/transfer)에 잠시 올리고 8자리 코드로 다른 기기에서 받는다.
   서버가 준비되지 않았거나(503 not_configured·정적 호스팅의 404) 내려받은 index.html(file://)이면 카드를 숨기거나 짧게 안내만 한다.
   올리는 내용은 '코드 만들기'와 같은 LZString base64, 받은 내용은 importText(같은 검사·같은 저장 절차)로 가져온다. docs/save-transfer.md
   저장은 계정이 아니라 기기·브라우저마다 따로 남는다(카페 11-17: A→B→A로 돌아오면 A의 옛 저장이 열림). 그래서 받은 저장이 이 기기의 같은 게임(세계 번호 G.wid) 슬롯과 겹치면
   게임 날짜·저장 시각을 나란히 보여 주고 고르게 한다: 받은 쪽이 더 나중이면 '그 슬롯을 받은 저장으로 바꾸기'를 먼저, 같거나 앞이면 경고하고 '새 슬롯에 넣기'를 먼저. 말없이 덮어쓰지 않는다 */
const XF={st:'',probing:false,busy:false,out:null,inData:null,inAt:null,ask:null,fail:0,until:0,msg:'',bad:false,overAsk:false};
const XF_ABC='ABCDEFGHJKMNPQRSTUVWXYZ23456789', XF_MAX=8*1024*1024;
function xfAvail(){ try{ return /^https?:$/.test(location.protocol)&&typeof fetch==='function'; }catch(e){ return false; } }
function xfNorm(s){ const c=String(s||'').toUpperCase().replace(/[\s-]/g,''); return c.length===8&&[...c].every(ch=>XF_ABC.includes(ch))?c:''; }
const xfFmt=c=>c.slice(0,4)+'-'+c.slice(4);
function xfProbe(){ if(XF.st||XF.probing||!xfAvail())return; XF.probing=true;
  fetch('/api/transfer',{cache:'no-store',credentials:'same-origin'}).then(r=>r.ok?r.json():null).then(j=>{ XF.st=j&&j.ok?'ok':'off'; },()=>{ XF.st='off'; }).then(()=>{ XF.probing=false; try{ render(); }catch(e){} }); }
async function xfJson(r){ try{ return await r.json(); }catch(e){ return {}; } }
function xfSay(msg,bad){ XF.msg=msg; XF.bad=!!bad; render(); }
function transferCard(){ if(!xfAvail())return ''; xfProbe(); if(!XF.st)return '';
  if(XF.st!=='ok')return `<section class="card xf"><h2 class="sec">기기 옮기기</h2><div class="small muted xf-t">지금은 기기 옮기기를 쓸 수 없습니다. 파일로 내보내기를 써 주세요.</div></section>`;
  const inGame=!!G&&!UI.title, out=XF.out&&XF.out.g===G?XF.out:null, m=meta(), empty=SLOT_IDS.find(n=>!slotUsed(n,m)), wait=Math.max(0,Math.ceil((XF.until-Date.now())/1000));
  const up=inGame?`<h3 class="small"><b>이 기기에서 보내기</b></h3>${out?`<div class="xf-out" style="margin:6px 0"><b class="xf-code" style="display:block;font:700 28px/1.2 var(--f-num,monospace);letter-spacing:.12em">${xfFmt(out.code)}</b><span class="small muted">7일 뒤 자동 삭제 · 한 번 불러오면 바로 삭제</span></div>
    <div class="row"><button class="btn primary" data-a="xfCopy">코드 복사</button><button class="btn" data-a="xfDel">코드 지우기</button></div>`:`<div class="row"><button class="btn" data-a="xfUp"${XF.busy?' disabled':''}>기기 옮기기 코드 만들기</button></div>`}`:'';
  const pend=XF.inData&&XF.ask?xfAskHtml(XF.ask,m,empty,inGame):XF.inData?`<div class="note">받은 저장이 아직 슬롯에 들어가지 않았습니다. 서버에서는 이미 지워졌으니 아래에서 넣을 곳을 고르세요.</div><div class="row">${empty?`<button class="btn primary" data-a="xfImp" data-v="empty">빈 슬롯 ${empty}에 불러오기</button>`:''}${inGame&&!(m.slots[curSlot()]||{}).lock?`<button class="btn${XF.overAsk?' danger':''}" data-a="xfImp" data-v="cur">${XF.overAsk?'한 번 더 눌러 덮어쓰기':`지금 슬롯 ${curSlot()}에 덮어쓰기`}</button>`:''}<button class="btn" data-a="xfFile">파일로 받아 두기</button></div>${empty?'':`<div class="small muted xf-t">빈 슬롯이 없습니다. ${inGame?'지금 슬롯에 덮어쓰거나, ':''}저장 슬롯에서 하나를 지운 뒤 다시 누르세요.</div>`}`:'';
  return `<section class="card xf"><h2 class="sec">기기 옮기기</h2><div class="small muted xf-t">PC와 휴대폰 사이에 저장을 8자리 코드로 옮깁니다. 저장은 게임 서버에 잠시 보관됩니다.</div><div class="small muted xf-t xf-dev">저장은 기기·브라우저마다 따로 남고 계정(itch.io 계정 포함)과 연결되지 않습니다. 다른 기기에서 이어 하려면, 마지막으로 플레이한 기기에서 코드를 만들어 지금 기기로 옮겨 오세요. 원래 기기로 돌아갈 때도 같습니다.</div>${up}
  <h3 class="small" style="margin-top:10px"><b>다른 기기에서 옮겨 오기</b></h3>${pend}
  <div class="row"><input type="text" id="xfIn" maxlength="12" inputmode="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXX-XXXX" value="${esc(XF.typed||'')}" aria-label="기기 옮기기 코드" style="width:9.5em;letter-spacing:.08em;text-transform:uppercase"><button class="btn primary" data-a="xfGet"${XF.busy?' disabled':''}>옮겨 오기</button></div>
  <div class="small muted xf-t">빈 슬롯이 있으면 빈 슬롯에, 없으면 넣을 곳을 묻습니다.${wait?` 코드가 틀려 ${wait}초 뒤 다시 시도할 수 있습니다.`:''}</div>
  ${XF.msg?`<div class="note${XF.bad?' bad':''}">${esc(XF.msg)}</div>`:''}</section>`; }
Object.assign(A,{
  async xfUp(){ if(XF.busy||!G)return; let t; try{ if(!G.wid&&typeof cupWid==='function'){ cupWid(); save(); } /* 세계 번호: 받는 기기·돌아온 기기에서 같은 게임 슬롯을 알아보게(이 기기 슬롯에도 저장) */ t=LZString.compressToBase64(prepG()); }catch(e){ return xfSay('저장을 준비하지 못했습니다. 파일로 내보내기를 써 주세요.',true); }
    if(t.length>XF_MAX)return xfSay('저장이 너무 커서 올릴 수 없습니다(8MB 이하). 파일로 내보내기를 써 주세요.',true);
    const g0=G; XF.busy=true; xfSay('코드를 만드는 중입니다.');
    try{ const r=await fetch('/api/transfer',{method:'POST',body:t,headers:{'Content-Type':'text/plain'},cache:'no-store',credentials:'same-origin'}), j=await xfJson(r);
      if(r.status===201&&xfNorm(j.code)){ XF.out={code:xfNorm(j.code),g:g0,exp:j.expiresAt}; XF.busy=false; xfSay('코드를 만들었습니다. 다른 기기의 "다른 기기에서 옮겨 오기"에 넣으세요.'); return; }
      if(r.status===503)XF.st='off'; XF.busy=false; xfSay(j.message||'코드를 만들지 못했습니다. 잠시 뒤 다시 시도해 주세요.',true); }
    catch(e){ XF.busy=false; xfSay('서버에 연결하지 못했습니다. 인터넷 연결을 확인해 주세요.',true); } },
  async xfCopy(){ const c=XF.out&&xfFmt(XF.out.code); if(!c)return; let ok=false; try{ await navigator.clipboard.writeText(c); ok=true; }catch(e){} toast(ok?`${c} 코드를 복사했습니다.`:`복사가 막혀 있습니다. ${c}를 직접 적어 두세요.`); },
  async xfDel(){ const o=XF.out; if(!o||XF.busy)return; XF.busy=true;
    try{ const r=await fetch('/api/transfer/'+o.code,{method:'DELETE',cache:'no-store',credentials:'same-origin'}); XF.busy=false; if(r.ok){ XF.out=null; xfSay('코드를 지웠습니다. 서버에 남은 저장이 없습니다.'); } else xfSay((await xfJson(r)).message||'코드를 지우지 못했습니다. 7일 뒤에는 자동으로 지워집니다.',true); }
    catch(e){ XF.busy=false; xfSay('서버에 연결하지 못했습니다. 7일 뒤에는 자동으로 지워집니다.',true); } },
  async xfGet(){ if(XF.busy)return; const el=document.getElementById('xfIn'), raw=el?el.value:'', c=xfNorm(raw); XF.typed=raw.trim().slice(0,12);
    const wait=Math.ceil((XF.until-Date.now())/1000); if(wait>0)return xfSay(`${wait}초 뒤 다시 시도해 주세요.`,true);
    if(!c)return xfSay('코드는 8자리입니다(0·O·1·I·L은 쓰지 않습니다). 다시 확인해 주세요.',true);
    if(XF.inData)return xfSay('먼저 받은 저장을 슬롯에 넣거나 파일로 받아 두세요.',true);
    XF.busy=true; xfSay('저장을 받는 중입니다.');
    try{ const r=await fetch('/api/transfer/'+c,{cache:'no-store',credentials:'same-origin'}), j=await xfJson(r); XF.busy=false;
      if(r.ok&&typeof j.data==='string'){ XF.fail=0; XF.until=0; XF.inData=j.data; XF.inAt=Number.isFinite(j.createdAt)?j.createdAt:null; XF.ask=null; XF.msg=''; XF.typed=''; return xfPlace(); }
      if(r.status===404){ XF.fail++; const s=Math.min(60,2**XF.fail); XF.until=Date.now()+s*1000; setTimeout(()=>{ try{ render(); }catch(e){} },s*1000+50); return xfSay(`${j.message||'코드를 찾지 못했습니다.'} 코드를 확인하고 ${s}초 뒤 다시 시도해 주세요.`,true); }
      if(r.status===503)XF.st='off'; xfSay(j.message||'저장을 받지 못했습니다. 잠시 뒤 다시 시도해 주세요.',true); }
    catch(e){ XF.busy=false; xfSay('서버에 연결하지 못했습니다. 인터넷 연결을 확인해 주세요.',true); } },
  xfImp(v){ if(!XF.inData)return;
    if(v==='rep'){ const k=XF.ask; if(!k)return; try{ if(G)saveFlush(); }catch(e){} const now=xfMatch(XF.inData); /* 고른 사이 슬롯이 다시 저장됐으면 다시 비교해 묻는다 */
      if(!now||now.slot!==k.slot||now.rev!==k.rev||now.lDay!==k.lDay){ XF.ask=now; XF.overAsk=false; return xfSay(now?'그사이 이 기기 저장이 바뀌어 다시 비교했습니다. 다시 골라 주세요.':'같은 게임 슬롯이 사라졌습니다. 빈 슬롯에 넣어 주세요.',true); }
      if(!k.newer&&XF.overAsk!=='rep'){ XF.overAsk='rep'; render(); return; } XF.overAsk=false; return xfPlace('rep'); }
    if(v==='cur'&&XF.overAsk!==true){ XF.overAsk=true; render(); return; } XF.overAsk=false; xfPlace(v==='cur'?'cur':'empty'); },
  xfFile(){ const t=XF.inData; if(!t)return; try{ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([t],{type:'text/plain'})); a.download='danjang-transfer.txt'; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1000); xfSay('파일로 받았습니다. "파일 불러오기"로 언제든 넣을 수 있습니다.'); }catch(e){ xfSay('파일로 받지 못했습니다.',true); } },
});
/* 받은 저장 넣기: 빈 슬롯이 있으면 바로 빈 슬롯에. 없으면 넣을 곳을 묻는다(카드의 버튼). 지금 슬롯 덮어쓰기는 기존 '코드로 불러오기'와 같은 경로 */
function xfPlace(how){ const t=XF.inData; if(!t)return; const m=meta(), empty=SLOT_IDS.find(n=>!slotUsed(n,m));
  if(!how){ const k=xfMatch(t); if(k){ XF.ask=k; XF.overAsk=false; xfSay(''); return; } if(!empty){ xfSay('받은 저장을 넣을 빈 슬롯이 없습니다. 넣을 곳을 골라 주세요.'); return; } how='empty'; }
  if(how==='rep'){ const k=XF.ask; if(!k)return; const g0=G; UI.impMsg=''; importText(t,null,{slot:k.slot,rev:k.rev});
    if(G!==g0&&!UI.title&&curSlot()===k.slot){ XF.inData=null; XF.ask=null; XF.msg=''; toast(`슬롯 ${k.slot}을(를) 받은 저장(${xfD(k.rDay)})으로 바꿨습니다. 이어하기도 이 슬롯을 엽니다.`); }
    else xfSay(UI.impMsg||'바꾸지 못했습니다.',true); return; }
  if(how==='empty'&&!empty){ xfSay('빈 슬롯이 없습니다. 저장 슬롯에서 하나를 지운 뒤 다시 누르세요.',true); return; }
  const g0=G; UI.impMsg=''; importText(t,null,how==='empty'?{empty:true}:null);
  if(G!==g0&&!UI.title){ XF.inData=null; XF.ask=null; XF.msg=''; const s=curSlot(); toast(`다른 기기의 저장을 슬롯 ${s}에 불러왔습니다.`); }
  else xfSay(UI.impMsg||'불러오지 못했습니다.',true); }
/* 받은 저장과 같은 게임인 이 기기 슬롯 찾기. 세계 번호(G.wid)가 둘 다 있으면 그것으로만 맞춘다.
   한쪽에 없으면(번호가 생기기 전의 저장) 단장 이름·취임 해·시작 해가 모두 같을 때 '같은 게임으로 보이는' 슬롯으로 본다(바꾸기는 늘 사용자가 고르므로 잘못 맞춰도 말없이 덮지 않는다).
   여러 슬롯이 맞으면 게임 날짜가 가장 나중인 슬롯(같으면 이어하기 대상)과 비교한다 */
function xfKey(g){ const p=g&&g.gmP||{}; return p.name&&(p.y0!=null||g.startY!=null)?[p.name,p.y0,g.startY].join('|'):''; }
function xfD(day){ try{ const o=FrontOfficeCore.dobj(day); return `${o.y}년 ${o.m}월 ${o.d}일`; }catch(e){ return ''; } }
function xfT(ms){ return Number.isFinite(ms)?new Date(ms).toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):'알 수 없음'; }
function xfMatch(t){ let r=null; try{ const j=LZString.decompressFromBase64(String(t||'').trim()); r=j&&JSON.parse(j); }catch(e){ r=null; } if(!r||!Number.isFinite(r.day))return null;
  const m=meta(), rk=xfKey(r), hit=[];
  for(const n of SLOT_IDS){ if(!slotHas(n))continue; const s=m.slots[n]||{}; let wid=s.wid, day=s.day, key='';
    if(!wid||!Number.isFinite(day)||!r.wid){ const h=unpack(sbGet(n)); if(!h)continue; wid=h.wid; day=h.day; key=xfKey(h); }
    const same=wid&&r.wid?wid===r.wid:!!rk&&key===rk; if(same&&Number.isFinite(day))hit.push({n,day,s,guess:!(wid&&r.wid)}); }
  if(!hit.length)return null; hit.sort((a,b)=>b.day-a.day||(b.n===m.active)-(a.n===m.active)); const h=hit[0];
  return {slot:h.n,rev:revOf(m,h.n),lDay:h.day,lAt:h.s.at,name:h.s.name||'',lock:!!h.s.lock,rDay:r.day,rAt:XF.inAt,newer:r.day>h.day,same:r.day===h.day,guess:h.guess,more:hit.length-1}; }
function xfAskHtml(k,m,empty,inGame){ const L=xfD(k.lDay), R=xfD(k.rDay), rep=!k.lock;
  const tbl=`<div class="xf-cmp small" style="margin:6px 0"><div>이 기기 슬롯 ${k.slot}${k.name?` (${esc(k.name)})`:''}: <b>${L}</b> · 저장 ${xfT(k.lAt)}</div><div>받은 저장: <b>${R}</b> · 다른 기기에서 보낸 시각 ${xfT(k.rAt)}</div></div>`;
  const head=k.newer?`<div class="note">받은 저장이 이 기기의 같은 게임보다 더 나중 날짜입니다${k.guess?'(같은 단장·같은 시작 해로 보아 같은 게임으로 판단)':''}. 슬롯 ${k.slot}을(를) 받은 저장으로 바꾸면 이어하기가 ${R}부터 열립니다.</div>`
    :`<div class="note bad">받은 저장(${R})이 이 기기 슬롯 ${k.slot}(${L})${k.same?'과 같은 날짜입니다':'보다 앞 날짜입니다'}. 바꾸면 이 기기의 진행${k.same?'':`(${L}까지)`}이 사라집니다. 그대로 두려면 새 슬롯에 넣으세요.</div>`;
  const repBtn=rep?`<button class="btn${k.newer?' primary':XF.overAsk==='rep'?' danger':''}" data-a="xfImp" data-v="rep">${!k.newer&&XF.overAsk==='rep'?'한 번 더 눌러 바꾸기':`이 슬롯(${L})을 받은 저장(${R})으로 바꾸기`}</button>`:'';
  const newBtn=empty?`<button class="btn${k.newer&&rep?'':' primary'}" data-a="xfImp" data-v="empty">새 슬롯에 넣기(슬롯 ${empty})</button>`:'';
  return `<div class="xf-ask">${head}${tbl}<div class="row">${k.newer?repBtn+newBtn:newBtn+repBtn}<button class="btn" data-a="xfFile">파일로 받아 두기</button></div>${k.lock?`<div class="small muted xf-t">슬롯 ${k.slot}은(는) 보관 슬롯이라 바꿀 수 없습니다.</div>`:''}${empty?'':`<div class="small muted xf-t">빈 슬롯이 없습니다.${rep?' 바꾸거나, ':' '}저장 슬롯에서 하나를 지운 뒤 다시 누르세요.</div>`}<div class="small muted xf-t">서버에서는 이미 지워졌으니 새로고침 전에 고르세요.</div></div>`; }
