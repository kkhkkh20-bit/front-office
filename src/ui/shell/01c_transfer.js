/* 기기 옮기기: 저장을 게임 서버(worker/index.js, /api/transfer)에 잠시 올리고 8자리 코드로 다른 기기에서 받는다.
   서버가 준비되지 않았거나(503 not_configured·정적 호스팅의 404) 내려받은 index.html(file://)이면 카드를 숨기거나 짧게 안내만 한다.
   올리는 내용은 '코드 만들기'와 같은 LZString base64, 받은 내용은 importText(같은 검사·같은 저장 절차)로 가져온다. docs/save-transfer.md */
const XF={st:'',probing:false,busy:false,out:null,inData:null,fail:0,until:0,msg:'',bad:false,overAsk:false};
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
  const pend=XF.inData?`<div class="note">받은 저장이 아직 슬롯에 들어가지 않았습니다. 서버에서는 이미 지워졌으니 아래에서 넣을 곳을 고르세요.</div><div class="row">${empty?`<button class="btn primary" data-a="xfImp" data-v="empty">빈 슬롯 ${empty}에 불러오기</button>`:''}${inGame&&!(m.slots[curSlot()]||{}).lock?`<button class="btn${XF.overAsk?' danger':''}" data-a="xfImp" data-v="cur">${XF.overAsk?'한 번 더 눌러 덮어쓰기':`지금 슬롯 ${curSlot()}에 덮어쓰기`}</button>`:''}<button class="btn" data-a="xfFile">파일로 받아 두기</button></div>${empty?'':`<div class="small muted xf-t">빈 슬롯이 없습니다. ${inGame?'지금 슬롯에 덮어쓰거나, ':''}저장 슬롯에서 하나를 지운 뒤 다시 누르세요.</div>`}`:'';
  return `<section class="card xf"><h2 class="sec">기기 옮기기</h2><div class="small muted xf-t">PC와 휴대폰 사이에 저장을 8자리 코드로 옮깁니다. 저장은 게임 서버에 잠시 보관됩니다.</div>${up}
  <h3 class="small" style="margin-top:10px"><b>다른 기기에서 옮겨 오기</b></h3>${pend}
  <div class="row"><input type="text" id="xfIn" maxlength="12" inputmode="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXX-XXXX" value="${esc(XF.typed||'')}" aria-label="기기 옮기기 코드" style="width:9.5em;letter-spacing:.08em;text-transform:uppercase"><button class="btn primary" data-a="xfGet"${XF.busy?' disabled':''}>옮겨 오기</button></div>
  <div class="small muted xf-t">빈 슬롯이 있으면 빈 슬롯에, 없으면 넣을 곳을 묻습니다.${wait?` 코드가 틀려 ${wait}초 뒤 다시 시도할 수 있습니다.`:''}</div>
  ${XF.msg?`<div class="note${XF.bad?' bad':''}">${esc(XF.msg)}</div>`:''}</section>`; }
Object.assign(A,{
  async xfUp(){ if(XF.busy||!G)return; let t; try{ t=LZString.compressToBase64(prepG()); }catch(e){ return xfSay('저장을 준비하지 못했습니다. 파일로 내보내기를 써 주세요.',true); }
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
      if(r.ok&&typeof j.data==='string'){ XF.fail=0; XF.until=0; XF.inData=j.data; XF.msg=''; XF.typed=''; return xfPlace(); }
      if(r.status===404){ XF.fail++; const s=Math.min(60,2**XF.fail); XF.until=Date.now()+s*1000; setTimeout(()=>{ try{ render(); }catch(e){} },s*1000+50); return xfSay(`${j.message||'코드를 찾지 못했습니다.'} 코드를 확인하고 ${s}초 뒤 다시 시도해 주세요.`,true); }
      if(r.status===503)XF.st='off'; xfSay(j.message||'저장을 받지 못했습니다. 잠시 뒤 다시 시도해 주세요.',true); }
    catch(e){ XF.busy=false; xfSay('서버에 연결하지 못했습니다. 인터넷 연결을 확인해 주세요.',true); } },
  xfImp(v){ if(!XF.inData)return; if(v==='cur'&&!XF.overAsk){ XF.overAsk=true; render(); return; } XF.overAsk=false; xfPlace(v==='cur'?'cur':'empty'); },
  xfFile(){ const t=XF.inData; if(!t)return; try{ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([t],{type:'text/plain'})); a.download='danjang-transfer.txt'; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1000); xfSay('파일로 받았습니다. "파일 불러오기"로 언제든 넣을 수 있습니다.'); }catch(e){ xfSay('파일로 받지 못했습니다.',true); } },
});
/* 받은 저장 넣기: 빈 슬롯이 있으면 바로 빈 슬롯에. 없으면 넣을 곳을 묻는다(카드의 버튼). 지금 슬롯 덮어쓰기는 기존 '코드로 불러오기'와 같은 경로 */
function xfPlace(how){ const t=XF.inData; if(!t)return; const m=meta(), empty=SLOT_IDS.find(n=>!slotUsed(n,m));
  if(!how){ if(!empty){ xfSay('받은 저장을 넣을 빈 슬롯이 없습니다. 넣을 곳을 골라 주세요.'); return; } how='empty'; }
  if(how==='empty'&&!empty){ xfSay('빈 슬롯이 없습니다. 저장 슬롯에서 하나를 지운 뒤 다시 누르세요.',true); return; }
  const g0=G; UI.impMsg=''; importText(t,null,how==='empty'?{empty:true}:null);
  if(G!==g0&&!UI.title){ XF.inData=null; XF.msg=''; const s=curSlot(); toast(`다른 기기의 저장을 슬롯 ${s}에 불러왔습니다.`); }
  else xfSay(UI.impMsg||'불러오지 못했습니다.',true); }
