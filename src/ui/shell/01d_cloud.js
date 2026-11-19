/* 클라우드 저장(사용자 11-18, 설계 docs/design/cloud-save-2026-11-17.md): 켠 기기만 저장을 서버(R2)에 올리고, 같은 플레이어로 연결한 다른 기기에서 받는다.
   - 가입 없음: 서버 v1 익명 플레이어(래더와 같은 토큰 fo-net-v1-token)를 쓰고, 없으면 켤 때 조용히 만든다. 켜지 않은 기기는 아무것도 바뀌지 않는다.
   - 켜기(설정 › 저장): 'fo-cloud-on'=1. 그 뒤 지금 게임을 올리고, 진행 중에는 게임 날짜가 바뀌고 10분이 지났을 때·탭을 떠날 때·'지금 클라우드에 저장'을 누를 때만 올린다.
   - 클라우드 슬롯 = 게임의 세계 번호(G.wid). 기기마다 마지막으로 맞춘 판번호(base)를 'fo-cloud-base'에 둔다: {wid:{rev, lrev(그때 이 기기 슬롯 판번호), n(슬롯), day, at}}.
   - 올리기는 늘 If-Match "<base>"(처음은 If-None-Match: *). 서버가 409면 덮지 않고, 두 저장(날짜·구단·저장 시각)을 나란히 보여 주고 고르게 한다. 고를 때까지 올리지 않는다.
   - 다른 기기 연결: 연결된 기기에서 '기기 연결 코드'(8자리, 10분, 한 번) → 새 기기에서 입력 → 같은 플레이어의 새 토큰. 모든 기기를 잃을 때를 위한 '복구 코드'(24자리)는 만들 때 한 번만 보여 준다.
   - 서버에 R2가 없으면(503 not_configured)·정적 호스팅·file://이면 카드를 그리지 않는다(설정에는 '준비 중' 한 줄). 게임 진행·로컬 저장에는 영향이 없다 */
const CL={st:'',probing:false,busy:false,upBusy:false,msg:'',bad:false,list:null,listAt:0,listBusy:false,link:null,rec:null,recHas:null,devs:null,ask:null,over:false,delAsk:'',unAsk:'',confl:{},toasted:{},upAt:0,upDay:null,waitUntil:0,typed:''};
const CL_ON='fo-cloud-on', CL_BASE='fo-cloud-base', CL_MAGIC=[70,84,83,49]; /* 'FTS1' */
function clLs(k,v){ try{ if(v===undefined)return localStorage.getItem(k); if(v===null)localStorage.removeItem(k); else localStorage.setItem(k,v); }catch(e){} return null; }
function clOn(){ return clLs(CL_ON)==='1'; }
function clBase(){ try{ const b=JSON.parse(clLs(CL_BASE)||'{}'); return b&&typeof b==='object'&&!Array.isArray(b)?b:{}; }catch(e){ return {}; } }
function clBaseSet(f){ const b=clBase(); f(b); clLs(CL_BASE,JSON.stringify(b)); }
function clTok(){ try{ return localStorage.getItem(FrontOfficeCore.NET_TOKEN)||''; }catch(e){ return ''; } }
function clSay(msg,bad){ CL.msg=msg||''; CL.bad=!!bad; try{ render(); }catch(e){} }
const clFmt=c=>String(c||'').match(/.{1,4}/g).join('-');
function clDevName(){ let u='',tp=0; try{ u=navigator.userAgent||''; tp=navigator.maxTouchPoints||0; }catch(e){}
  const os=/Android/.test(u)?'안드로이드':/iPhone|iPad|iPod/.test(u)||(/Macintosh/.test(u)&&tp>1)?'아이폰·아이패드':/Windows/.test(u)?'Windows':/Mac OS X/.test(u)?'Mac':/Linux/.test(u)?'Linux':'기기';
  const br=/SamsungBrowser/.test(u)?'삼성 인터넷':/Edg\//.test(u)?'Edge':/Firefox\//.test(u)?'Firefox':/Chrome\//.test(u)?'Chrome':/Safari\//.test(u)?'Safari':'브라우저'; return os+' · '+br; }
/* 응답 본문 읽기(던지지 않는다): 비어 있거나 JSON이 아니면(404 빈 응답·중간 서버의 HTML 오류 쪽 등) data=null, bad=true.
   r.json()이 빈 본문에서 던지던 예외를 조용히 삼키지 않고, 호출하는 쪽이 안내 문구(CL_BAD_BODY 또는 각자의 실패 문구)를 보이게 한다 */
const CL_BAD_BODY='서버 응답을 읽지 못했습니다. 잠시 뒤 다시 시도해 주세요.';
async function clBody(r){ let t=''; try{ t=await r.text(); }catch(e){ return {data:null,bad:true}; } if(!t||!t.trim())return {data:null,bad:true};
  try{ const d=JSON.parse(t); return d&&typeof d==='object'?{data:d,bad:false}:{data:null,bad:true}; }catch(e){ return {data:null,bad:true}; } }
/* 요청: 던지지 않는다 → {ok,status,data,res,offline} */
async function clReq(method,path,o){ o=o||{}; const h=Object.assign({},o.headers||{}), t=clTok(); if(t&&o.auth!==false)h.Authorization='Bearer '+t; if(o.json!=null)h['Content-Type']='application/json';
  let r=null,data=null; try{ r=await fetch('/api/v1'+path,{method,headers:h,body:o.json!=null?JSON.stringify(o.json):o.body,cache:'no-store',credentials:'same-origin'}); }catch(e){ return {ok:false,status:0,offline:true}; }
  if(o.raw&&r.ok)return {ok:true,status:r.status,res:r}; const b=await clBody(r); data=b.data; if(b.bad&&!r.ok&&!data)data={message:CL_BAD_BODY}; if(r.status===503&&data&&data.error==='not_configured')CL.st='off'; return {ok:r.ok,status:r.status,data,res:r}; }
function clProbe(){ if(CL.st||CL.probing||!xfAvail())return; CL.probing=true;
  clReq('GET','/cloud',{auth:false}).then(r=>{ CL.st=r.ok&&r.data&&r.data.ok?'ok':'off'; },()=>{ CL.st='off'; }).then(()=>{ CL.probing=false; if(CL.st==='ok'&&clOn()&&clTok())clList(true); try{ render(); }catch(e){} }); }
/* 익명 플레이어(래더와 같은 것). 없으면 조용히 만든다 */
async function clPlayer(){ const N=ulNet(); if(N.signedIn())return true; let nick='단장'+(1000+Math.floor(Math.random()*9000)); try{ if(G&&typeof ulNick==='function')nick=ulNick(); }catch(e){}
  let r=await N.ensurePlayer(nick,G&&G.wid?{wid:G.wid}:{}); if(!r.ok&&r.status===400)r=await N.ensurePlayer('단장'+(1000+Math.floor(Math.random()*9000))); return !!r.ok; }
/* 토큰이 서버에서 사라짐(연결 끊김·서버 기록 지우기): 이 기기 클라우드 저장을 끈다. 플레이어를 새로 만들지 않는다(다른 기기의 코드로 다시 연결하게) */
function clAuthLost(){ try{ ulNet().forget(); }catch(e){} clLs(CL_ON,null); clLs(CL_BASE,null); CL.list=null; CL.devs=null; CL.ask=null; CL.confl={};
  clSay('이 기기의 클라우드 연결이 끊겼습니다(다른 기기에서 연결을 끊었거나 서버 기록을 지웠습니다). 이 기기 저장은 그대로입니다. 다시 쓰려면 연결된 기기에서 기기 연결 코드를 만들어 넣거나 클라우드 저장을 다시 켜세요.',true); }
/* 서버 기록 지우기(래더) 뒤: 클라우드 저장도 서버에서 지워졌으니 이 기기 설정을 끈다 */
function clForgetAll(){ clLs(CL_ON,null); clLs(CL_BASE,null); Object.assign(CL,{list:null,devs:null,ask:null,confl:{},link:null,rec:null,recHas:null}); }
async function clList(quiet){ if(CL.listBusy||!clTok())return; CL.listBusy=true; const r=await clReq('GET','/saves'); CL.listBusy=false;
  if(r.ok&&r.data){ CL.list=r.data.slots||[]; CL.listAt=Date.now(); CL.daily=r.data.daily||null; clCheckNewer(); }
  else if(r.status===401)clAuthLost(); else if(!quiet)clSay(r.offline?'서버에 연결하지 못했습니다. 인터넷 연결을 확인해 주세요.':(r.data&&r.data.message)||'클라우드 목록을 받지 못했습니다.',true);
  try{ render(); }catch(e){} }
/* 진행 중인 게임이 클라우드에서 더 새로 저장됐는지(다른 기기가 올림): 올리기를 멈추고 알린다 */
function clCheckNewer(){ if(!G||!G.wid||!CL.list)return; const c=CL.list.find(x=>x.slot===G.wid), b=clBase()[G.wid]; if(!c)return;
  if(b&&b.n===curSlot()&&c.rev>b.rev&&!CL.confl[G.wid]){ CL.confl[G.wid]=c; clToast(G.wid); } }
function clToast(wid){ if(CL.toasted[wid])return; CL.toasted[wid]=1; try{ toast('다른 기기가 이 게임을 클라우드에 더 최근에 저장했습니다. 이 기기 진행은 클라우드에 올리지 않습니다. 설정 › 저장에서 어느 쪽으로 이어 할지 골라 주세요.'); }catch(e){} }
/* 이 기기 슬롯 본문 → 'FTS1' + deflate 바이트(브라우저 저장 형식이면 그대로 풀어 쓴다) */
function clBytes(body){ let u; if(body[0]===ZMK)u=unz15(body); else { const txt=body[0]==='{'?body:LZString.decompressFromUTF16(body); u=fflate.deflateSync(new TextEncoder().encode(txt),{level:6}); }
  const out=new Uint8Array(u.length+4); out.set(CL_MAGIC,0); out.set(u,4); return out; }
/* 올리기. force: 날짜·시간 조건 없이(직접·떠날 때). opt.over: 사용자가 본 서버 판번호로 덮기(고른 뒤에만) → 'ok'|'same'|'conflict'|'' */
async function clUpload(force,opt){ opt=opt||{}; if(CL.upBusy||!G||UI.title||!clOn()||CL.st!=='ok'||!clTok())return ''; if(typeof SAVE_CONFL!=='undefined'&&SAVE_CONFL)return '';
  if(Date.now()<CL.waitUntil&&!opt.manual)return ''; if(!G.wid){ try{ cupWid(); saveNow(); }catch(e){ return ''; } }
  const wid=G.wid, n=curSlot(), m=meta(), s=m.slots[n]; if(!s||savePend())return '';
  if(CL.confl[wid]&&opt.over==null)return 'conflict';
  const lrev=revOf(m,n), b=clBase()[wid], line=b&&b.n===n; if(opt.over==null&&line&&b.lrev===lrev){ if(!sbGet(n))return ''; return 'same'; }
  if(!force&&opt.over==null&&!(s.day!==CL.upDay&&Date.now()-CL.upAt>=600e3))return ''; /* 1분 확인은 시간 조건부터 본다: 본문(수 MB)을 매분 읽지 않게(성능 11-18) */
  const body=sbGet(n); if(!body)return '';
  let bytes; try{ bytes=clBytes(body); }catch(e){ if(opt.manual)clSay('저장을 준비하지 못했습니다. 파일로 내보내기를 써 주세요.',true); return ''; }
  const base=opt.over!=null?opt.over:line?b.rev:0, ver=String(typeof GAME_VER!=='undefined'?GAME_VER:'').replace(/[^\w.-]/g,'').slice(0,24);
  const h={'Content-Type':'application/octet-stream','X-Save-Wid':wid,'X-Save-Day':String(s.day==null?G.day:s.day),'X-Save-Date':encodeURIComponent(s.date||''),'X-Save-Team':encodeURIComponent(s.name||''),'X-Save-At':String(s.at||Date.now())};
  if(ver)h['X-Save-Ver']=ver; if(base>0)h['If-Match']=`"${base}"`; else h['If-None-Match']='*';
  CL.upBusy=true; if(opt.manual)clSay('클라우드에 올리는 중입니다.'); const r=await clReq('PUT','/saves/'+wid,{body:bytes,headers:h}); CL.upBusy=false;
  if(r.ok&&r.data){ clBaseSet(B=>{ B[wid]={rev:r.data.rev,lrev,n,day:s.day,at:Date.now()}; }); delete CL.confl[wid]; CL.toasted[wid]=0; CL.upAt=Date.now(); CL.upDay=s.day; CL.ask=null; CL.over=false;
    if(CL.list){ const it={slot:wid,rev:r.data.rev,wid,day:s.day,date:s.date||'',team:s.name||'',device_name:clDevName(),updated:r.data.updated,saved_at:s.at,bytes:r.data.bytes}; const i=CL.list.findIndex(x=>x.slot===wid); if(i>=0)CL.list[i]=Object.assign({},CL.list[i],it); else CL.list.unshift(it); }
    if(opt.manual||opt.over!=null)clSay(`클라우드에 저장했습니다(${xfD(s.day)}).`); else try{ render(); }catch(e){} return 'ok'; }
  if(r.status===409){ const cur=r.data&&r.data.current; if(!cur){ CL.waitUntil=Date.now()+30e3; if(opt.manual)clSay('다른 기기가 지금 이 게임을 올리는 중입니다. 잠시 뒤 다시 눌러 주세요.',true); return ''; }
    CL.confl[wid]=cur; CL.ask=clAskFor(wid,cur); CL.over=false; clToast(wid); if(CL.list){ const i=CL.list.findIndex(x=>x.slot===wid); if(i>=0)CL.list[i]=cur; else CL.list.unshift(cur); } clSay(''); return 'conflict'; }
  if(r.status===401){ clAuthLost(); return ''; }
  if(r.status===429){ let ra=0; try{ ra=+r.res.headers.get('Retry-After')||0; }catch(e){} CL.waitUntil=Date.now()+1000*Math.max(60,ra); if(opt.manual)clSay((r.data&&r.data.message)||'요청이 너무 잦습니다. 잠시 뒤 다시 시도해 주세요.',true); return ''; }
  if(r.status===403&&r.data&&r.data.error==='slot_limit'){ CL.waitUntil=Date.now()+600e3; clSay(r.data.message,true); return ''; }
  if(opt.manual||r.status===413)clSay(r.offline?'서버에 연결하지 못했습니다. 이 기기 저장은 그대로이고, 연결되면 다시 올립니다.':(r.data&&r.data.message)||'클라우드에 올리지 못했습니다. 잠시 뒤 다시 시도해 주세요.',true);
  return ''; }
/* 같은 게임(세계 번호)의 이 기기 슬롯과 클라우드 저장 비교 → 묻는 화면 데이터 */
function clLocal(wid){ const m=meta(); let n=G&&G.wid===wid&&!UI.title?curSlot():null; if(n==null||!(m.slots[n]&&m.slots[n].wid===wid)){ const hit=SLOT_IDS.filter(k=>slotHas(k)&&m.slots[k]&&m.slots[k].wid===wid).sort((a,b)=>(m.slots[b].day||0)-(m.slots[a].day||0)); n=hit[0]??null; }
  if(n==null)return null; const s=m.slots[n]; return {slot:n,lrev:revOf(m,n),lDay:s.day,lAt:s.at,lName:s.name||'',lock:!!s.lock}; }
function clAskFor(wid,c){ const l=clLocal(wid); if(!l||!c)return null; return Object.assign({wid,c,newer:Number.isFinite(c.day)&&Number.isFinite(l.lDay)?c.day>l.lDay:false,older:Number.isFinite(c.day)&&Number.isFinite(l.lDay)?l.lDay<c.day:false},l); }
async function clDownload(wid){ const r=await clReq('GET','/saves/'+encodeURIComponent(wid),{raw:true});
  if(!r.ok){ if(r.status===401){ clAuthLost(); return null; } let d=r.data; if(!d&&r.res)d=(await clBody(r.res)).data; clSay(r.offline?'서버에 연결하지 못했습니다.':(d&&d.message)||'클라우드 저장을 받지 못했습니다.',true); return null; }
  try{ const u=new Uint8Array(await r.res.arrayBuffer()); if(CL_MAGIC.some((x,i)=>u[i]!==x))throw 0; const txt=new TextDecoder().decode(fflate.inflateSync(u.subarray(4))); return {txt,rev:+r.res.headers.get('X-Save-Rev')||0}; }
  catch(e){ clSay('클라우드 저장을 읽지 못했습니다. 새 버전에서 저장한 기록이면 새로고침해 업데이트한 뒤 다시 받아 주세요.',true); return null; } }
/* 받은 저장 넣기: how 'rep' = 같은 게임 슬롯을 바꾸기(고른 뒤에만), 'empty' = 빈 슬롯. importText가 검사(saveCheck)·판번호 확인·저장을 한다 */
function clApply(d,wid,how,k){ const g0=G; UI.impMsg=''; importText(d.txt,null,how==='rep'?{slot:k.slot,rev:k.lrev}:{empty:true});
  if(G!==g0&&!UI.title){ const n=curSlot(), m=meta(); clBaseSet(B=>{ B[wid]={rev:d.rev,lrev:revOf(m,n),n,day:G.day,at:Date.now()}; }); delete CL.confl[wid]; CL.toasted[wid]=0; CL.ask=null; CL.over=false; CL.upDay=G.day; CL.upAt=Date.now();
    CL.msg=''; try{ toast(`클라우드 저장(${xfD(G.day)})을 슬롯 ${n}에 받았습니다. 이어하기도 이 슬롯을 엽니다.`); }catch(e){} return true; }
  clSay(UI.impMsg||'받은 저장을 넣지 못했습니다.',true); return false; }
function clDevLine(c){ return `${esc(c.device_name||'다른 기기')} · ${xfT(c.updated)} 저장`; }
function clAskHtml(k){ const c=k.c, empty=SLOT_IDS.find(n=>!slotUsed(n,meta()));
  const tbl=`<div class="cl-cmp small"><div>클라우드: <b>${xfD(c.day)}</b>${c.team?` · ${esc(c.team)}`:''} · ${clDevLine(c)}</div><div>이 기기 슬롯 ${k.slot}: <b>${xfD(k.lDay)}</b>${k.lName?` · ${esc(k.lName)}`:''} · ${xfT(k.lAt)} 저장</div></div>`;
  const head=k.newer?'<div class="note">다른 기기에서 더 나중 날짜까지 진행한 기록이 클라우드에 있습니다.</div>':`<div class="note">클라우드 저장과 이 기기 저장이 다릅니다${k.older?'':Number.isFinite(c.day)&&c.day===k.lDay?'(같은 날짜)':'(이 기기가 더 나중 날짜)'}. 어느 쪽으로 이어 할지 골라 주세요.</div>`;
  const loc=`<button class="btn${k.newer?(CL.over?' danger':''):' primary'}" data-a="clUse" data-v="local">${k.newer&&CL.over?'한 번 더 눌러 클라우드 덮어쓰기':'이 기기 저장으로 이어 하기(클라우드를 덮음)'}</button>`;
  const cl=k.lock?'':`<button class="btn${k.newer?' primary':''}" data-a="clUse" data-v="cloud">클라우드 저장으로 이어 하기</button>`;
  const nw=empty?`<button class="btn" data-a="clUse" data-v="new">이 기기 저장을 남기고 클라우드는 새 슬롯 ${empty}에</button>`:'';
  return `<div class="cl-ask">${head}${tbl}<div class="row">${k.newer?cl+loc:loc+cl}${nw}<button class="btn" data-a="clUse" data-v="later">나중에</button></div>${k.newer?'<div class="small muted cl-t">이 기기 저장으로 덮으면 클라우드의 더 나중 진행이 사라집니다(최근 3판은 서버에 남습니다).</div>':''}${k.lock?`<div class="small muted cl-t">슬롯 ${k.slot}은(는) 보관 슬롯이라 바꿀 수 없습니다.</div>`:''}</div>`; }
function cloudCard(){ if(!xfAvail())return ''; clProbe(); if(CL.st!=='ok')return '';
  const on=clOn()&&!!clTok(), inGame=!!G&&!UI.title;
  if(on&&!CL.list&&!CL.listBusy&&Date.now()-CL.listAt>60e3){ CL.listAt=Date.now(); clList(true); }
  const msg=CL.msg?`<div class="note${CL.bad?' bad':''}">${esc(CL.msg)}</div>`:'';
  const join=`<h3 class="small cl-h"><b>다른 기기와 연결하기</b></h3><div class="row"><input type="text" id="clIn" maxlength="40" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="연결 코드 XXXX-XXXX 또는 복구 코드" value="${esc(CL.typed||'')}" aria-label="기기 연결 코드 또는 복구 코드" style="flex:1 1 12em;min-width:0;text-transform:uppercase"><button class="btn" data-a="clJoin"${CL.busy?' disabled':''}>연결</button></div><div class="small muted cl-t">이미 클라우드 저장을 쓰는 기기의 설정 › 저장에서 '기기 연결 코드 만들기'를 누르고 그 코드를 넣으세요.</div>`;
  if(!on)return `<section class="card cld"><h2 class="sec">클라우드 저장</h2><div class="small muted cl-t">켜면 이 기기의 게임 저장을 게임 서버(Cloudflare)에 올려, 연결한 다른 기기에서 이어 할 수 있습니다. 가입은 필요 없습니다. 켜지 않으면 지금처럼 이 기기에만 저장합니다.</div>
    <div class="small muted cl-t">올리는 것: 저장 본문(단장 이름·메모 포함), 게임 날짜·구단 이름·세계 번호, 기기 이름(예: ${esc(clDevName())}), 올린 시각. 끄거나 지우면 더 올리지 않습니다.</div>
    <div class="row"><button class="btn primary" data-a="clOn"${CL.busy?' disabled':''}>클라우드 저장 켜기</button></div>${join}${msg}</section>`;
  const L=CL.list||[], B=clBase(), wid=inGame?G.wid:null, k=CL.ask&&CL.ask.c?CL.ask:null;
  const cur=wid&&L.find(x=>x.slot===wid), b=wid&&B[wid], cf=wid&&CL.confl[wid];
  const stat=inGame?`<div class="small cl-t cl-stat">${cf?'<b class="bad">다른 기기가 이 게임을 더 최근에 저장해 이 기기 진행은 클라우드에 올리지 않고 있습니다.</b>':cur&&b&&b.n===curSlot()?`이 게임 클라우드 마지막 저장: <b>${xfD(cur.day)}</b> · ${xfT(cur.updated)}`:cur?'이 게임이 클라우드에 있지만 이 기기 슬롯과 아직 맞추지 않았습니다.':'이 게임은 아직 클라우드에 없습니다.'}</div>
    ${cf&&!k?`<div class="row"><button class="btn primary" data-a="clAsk" data-v="${esc(wid)}">어느 쪽으로 이어 할지 고르기</button></div>`:''}<div class="row"><button class="btn${cf?'':' primary'}" data-a="clUp"${CL.upBusy||cf?' disabled':''}>지금 클라우드에 저장</button><button class="btn" data-a="clList"${CL.listBusy?' disabled':''}>목록 새로 보기</button></div>`:`<div class="row"><button class="btn" data-a="clList"${CL.listBusy?' disabled':''}>목록 새로 보기</button></div>`;
  const rows=L.map(c=>{ const l=clLocal(c.slot), bb=B[c.slot], mine=inGame&&c.slot===wid, newer=l&&bb&&bb.n===l.slot&&c.rev>bb.rev;
    return `<div class="slot cl-slot${mine?' on':''}" data-slot="${esc(c.slot)}"><div><b>${esc(c.team||'구단')}</b> · ${xfD(c.day)}${mine?' · 진행 중':''}<div class="small muted">${clDevLine(c)}${newer?' · <b>클라우드가 더 최근</b>':l?'':' · 이 기기에 없음'}</div></div>
      <div class="row">${mine&&!cf?'':`<button class="btn small${newer||!l?' primary':''}" data-a="clGet" data-v="${esc(c.slot)}">이 기기로 받기</button>`}<button class="btn small${CL.delAsk===c.slot?' danger':''}" data-a="clDel" data-v="${esc(c.slot)}">${CL.delAsk===c.slot?'한 번 더 눌러 클라우드에서 지우기':'지우기'}</button></div></div>`; }).join('');
  const list=`<h3 class="small cl-h"><b>클라우드 슬롯</b> <span class="muted">${L.length}/3</span></h3>${CL.list?rows||'<div class="small muted cl-t">아직 올린 저장이 없습니다.</div>':'<div class="small muted cl-t">목록을 받는 중입니다.</div>'}`;
  const link=CL.link&&CL.link.exp>Date.now()?`<div class="cl-code"><b class="cl-link" style="display:block;font:700 26px/1.2 var(--f-num,monospace);letter-spacing:.1em">${clFmt(CL.link.code)}</b><span class="small muted">10분 안에 새 기기의 '다른 기기와 연결하기'에 넣으세요. 한 번만 쓸 수 있습니다.</span></div><div class="row"><button class="btn" data-a="clCopy" data-v="link">코드 복사</button></div>`:`<div class="row"><button class="btn" data-a="clLink"${CL.busy?' disabled':''}>기기 연결 코드 만들기</button></div>`;
  const rec=CL.rec?`<div class="note warn cl-rec-box"><b>복구 코드(지금 한 번만 보입니다)</b><div class="cl-rec" style="font:700 17px/1.4 var(--f-num,monospace);letter-spacing:.06em;overflow-wrap:anywhere;margin:4px 0">${clFmt(CL.rec)}</div><span class="small">연결된 기기를 모두 잃었을 때 이 코드로 클라우드 저장에 다시 연결합니다. 종이·메모 앱 등 안전한 곳에 적어 두세요. 서버에는 이 코드의 해시만 남아 다시 보여 줄 수 없습니다.</span><div class="row"><button class="btn" data-a="clCopy" data-v="rec">복사</button><button class="btn primary" data-a="clRecDone">적어 두었습니다</button></div></div>`
    :`<div class="small muted cl-t">${CL.recHas?'복구 코드를 만들어 두었습니다. 잃어버렸으면 새로 만드세요(예전 코드는 쓸 수 없게 됩니다).':'기기를 모두 잃을 때를 대비해 복구 코드를 만들어 두세요.'}</div><div class="row"><button class="btn" data-a="clRec"${CL.busy?' disabled':''}>${CL.recHas?'복구 코드 새로 만들기':'복구 코드 만들기'}</button></div>`;
  const devs=CL.devs?`<div class="cl-devs">${CL.devs.map(d=>`<div class="slot"><div><b>${esc(d.name||(d.platform==='android'?'안드로이드':d.platform==='steam'?'스팀':'웹'))}</b>${d.current?' · 이 기기':''}<div class="small muted">마지막 사용 ${xfT(d.last_seen)}</div></div><div class="row"><button class="btn small${CL.unAsk===d.id?' danger':''}" data-a="clUnlink" data-v="${esc(d.id)}">${CL.unAsk===d.id?'한 번 더 눌러 연결 끊기':'연결 끊기'}</button></div></div>`).join('')}</div>`:`<div class="row"><button class="btn small" data-a="clDevs">연결된 기기 보기</button></div>`;
  return `<section class="card cld"><h2 class="sec">클라우드 저장 <span class="small muted" style="margin-left:6px;font-weight:400">켜짐</span></h2>${k?clAskHtml(k):''}${stat}${msg}${list}
    <h3 class="small cl-h"><b>다른 기기 연결</b></h3>${link}${rec}${devs}${join}
    <div class="small muted cl-t">진행 중에는 게임 날짜가 바뀌고 10분이 지났을 때와 탭을 떠날 때 올립니다. 휴대폰은 탭을 닫을 때 마지막 몇 분이 빠질 수 있으니 기기를 옮기기 전에 '지금 클라우드에 저장'을 눌러 주세요.</div>
    <div class="row"><button class="btn small" data-a="clOff">이 기기에서 클라우드 저장 끄기</button></div></section>`; }
Object.assign(A,{
  async clOn(){ if(CL.busy)return; CL.busy=true; clSay('클라우드 저장을 켜는 중입니다.');
    const ok=await clPlayer(); if(!ok){ CL.busy=false; return clSay('서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요.',true); }
    await clReq('PUT','/player/devices/me',{json:{name:clDevName()}}); clLs(CL_ON,'1'); CL.busy=false; CL.msg=''; await clList(true);
    if(G&&!UI.title){ try{ if(!G.wid){ cupWid(); saveNow(); } }catch(e){} const c=CL.list&&CL.list.find(x=>x.slot===G.wid);
      if(c){ CL.confl[G.wid]=c; CL.ask=clAskFor(G.wid,c); return clSay('클라우드에 이 게임의 다른 저장이 있습니다. 어느 쪽으로 이어 할지 골라 주세요.'); }
      try{ saveNow(); }catch(e){} const r=await clUpload(true,{manual:true}); if(r==='ok')return clSay(`클라우드 저장을 켰습니다. 지금 게임(${xfD(G.day)})을 올렸습니다.`); return; }
    clSay('클라우드 저장을 켰습니다. 게임을 열면 그 게임을 올립니다.'); },
  clOff(){ clLs(CL_ON,null); CL.ask=null; CL.link=null; CL.rec=null; clSay('이 기기에서 클라우드 저장을 껐습니다. 이미 올린 저장은 클라우드에 남고, 다른 기기에서는 그대로 받을 수 있습니다.'); },
  async clUp(){ if(!G)return; try{ saveNow(); }catch(e){} if(savePend()){ return clSay('이 기기 저장이 아직 끝나지 않았습니다. 잠시 뒤 다시 눌러 주세요.',true); }
    const r=await clUpload(true,{manual:true}); if(r==='same')clSay('클라우드 저장이 이미 최신입니다.'); },
  clList(){ CL.msg=''; clList(false); },
  clAsk(v){ const c=CL.confl[v]||(CL.list||[]).find(x=>x.slot===v); CL.ask=c?clAskFor(v,c):null; CL.over=false; render(); },
  async clGet(v){ if(CL.busy)return; const c=(CL.list||[]).find(x=>x.slot===v); if(!c)return; const l=clLocal(v), b=clBase()[v];
    if(l){ const same=b&&b.n===l.slot&&b.lrev===l.lrev; if(!same||!(c.rev>(b?b.rev:0))){ CL.ask=clAskFor(v,c); CL.over=false; return clSay(''); } } /* 이 기기 진행이 맞춘 뒤 바뀌지 않았고 클라우드가 더 새것이면 바로 바꾼다. 아니면 묻는다 */
    CL.busy=true; clSay('클라우드 저장을 받는 중입니다.'); try{ if(G)saveFlush(); }catch(e){} const d=await clDownload(v); CL.busy=false; if(!d)return;
    const l2=clLocal(v); clApply(d,v,l2?'rep':'empty',l2); render(); },
  async clUse(v){ const k=CL.ask; if(!k||CL.busy)return;
    if(v==='later'){ CL.ask=null; CL.over=false; return clSay(''); }
    if(v==='local'){ if(k.newer&&!CL.over){ CL.over=true; return render(); } CL.over=false;
      if(!G||UI.title||G.wid!==k.wid||curSlot()!==k.slot)return clSay(`먼저 슬롯 ${k.slot}을(를) 열고 다시 골라 주세요(처음 화면 › 불러오기).`,true);
      try{ saveNow(); }catch(e){} delete CL.confl[k.wid]; const r=await clUpload(true,{manual:true,over:k.c.rev}); if(r!=='ok'&&!CL.confl[k.wid])CL.confl[k.wid]=k.c; return; }
    CL.busy=true; clSay('클라우드 저장을 받는 중입니다.'); try{ if(G)saveFlush(); }catch(e){} const d=await clDownload(k.wid); CL.busy=false; if(!d)return;
    if(v==='cloud'){ const l=clLocal(k.wid); if(!l||l.slot!==k.slot){ CL.ask=null; return clSay('같은 게임 슬롯이 바뀌었습니다. 목록에서 다시 받아 주세요.',true); } clApply(d,k.wid,'rep',l); }
    else if(v==='new')clApply(d,k.wid,'empty',null);
    render(); },
  async clDel(v){ const c=(CL.list||[]).find(x=>x.slot===v); if(!c)return; if(CL.delAsk!==v){ CL.delAsk=v; return render(); } CL.delAsk='';
    const r=await clReq('DELETE','/saves/'+encodeURIComponent(v),{headers:{'If-Match':`"${c.rev}"`}});
    if(r.ok){ CL.list=CL.list.filter(x=>x.slot!==v); clBaseSet(B=>{ delete B[v]; }); delete CL.confl[v]; if(CL.ask&&CL.ask.wid===v)CL.ask=null; return clSay('클라우드에서 지웠습니다. 이 기기 저장은 그대로입니다.'); }
    if(r.status===409){ await clList(true); return clSay('그사이 다른 기기가 이 슬롯을 다시 저장해 지우지 않았습니다. 목록을 확인해 주세요.',true); }
    if(r.status===401)return clAuthLost(); clSay((r.data&&r.data.message)||'지우지 못했습니다.',true); },
  async clLink(){ if(CL.busy)return; CL.busy=true; const r=await clReq('POST','/player/link-code'); CL.busy=false;
    if(r.ok&&r.data&&r.data.code){ CL.link={code:r.data.code,exp:r.data.expiresAt||Date.now()+600e3}; setTimeout(()=>{ try{ render(); }catch(e){} },600e3+500); return clSay(''); }
    if(r.status===401)return clAuthLost(); clSay((r.data&&r.data.message)||'코드를 만들지 못했습니다.',true); },
  async clRec(){ if(CL.busy)return; CL.busy=true; const r=await clReq('POST','/player/recovery'); CL.busy=false;
    if(r.ok&&r.data&&r.data.code){ CL.rec=r.data.code; CL.recHas=true; return clSay(''); }
    if(r.status===401)return clAuthLost(); clSay((r.data&&r.data.message)||'복구 코드를 만들지 못했습니다.',true); },
  clRecDone(){ CL.rec=null; clSay('복구 코드를 닫았습니다. 다시 보여 줄 수 없으니 적어 둔 코드를 잘 보관하세요.'); },
  async clCopy(v){ const c=v==='rec'?CL.rec&&clFmt(CL.rec):CL.link&&clFmt(CL.link.code); if(!c)return; let ok=false; try{ await navigator.clipboard.writeText(c); ok=true; }catch(e){} toast(ok?'코드를 복사했습니다.':`복사가 막혀 있습니다. ${c}를 직접 적어 두세요.`); },
  async clDevs(){ const r=await clReq('GET','/player/devices'); if(r.ok&&r.data){ CL.devs=r.data.devices||[]; const g=await clReq('GET','/player/recovery'); if(g.ok&&g.data)CL.recHas=!!g.data.has; return render(); } if(r.status===401)return clAuthLost(); clSay((r.data&&r.data.message)||'기기 목록을 받지 못했습니다.',true); },
  async clUnlink(v){ if(CL.unAsk!==v){ CL.unAsk=v; return render(); } CL.unAsk=''; const r=await clReq('DELETE','/player/devices/'+encodeURIComponent(v));
    if(r.ok){ if(r.data&&r.data.current){ clAuthLost(); return clSay('이 기기의 연결을 끊었습니다. 이 기기 저장은 그대로입니다.'); } CL.devs=(CL.devs||[]).filter(d=>d.id!==v); return clSay('그 기기의 연결을 끊었습니다. 그 기기는 더 이상 클라우드 저장에 닿지 않습니다.'); }
    if(r.status===401)return clAuthLost(); clSay((r.data&&r.data.message)||'연결을 끊지 못했습니다.',true); },
  async clJoin(){ if(CL.busy)return; const el=document.getElementById('clIn'), raw=String(el?el.value:'').trim(); CL.typed=raw.slice(0,40); const c=raw.toUpperCase().replace(/[\s-]/g,'');
    const kind=c.length===8?'link':c.length===24?'rec':''; if(!kind||![...c].every(ch=>XF_ABC.includes(ch)))return clSay('기기 연결 코드는 8자리, 복구 코드는 24자리입니다(0·O·1·I·L은 쓰지 않습니다). 다시 확인해 주세요.',true);
    const prev=ulNet().player(); CL.busy=true; clSay('연결하는 중입니다.');
    const r=await clReq('POST',kind==='link'?'/player/link-code/redeem':'/player/recovery/redeem',{auth:false,json:{code:c,platform:FrontOfficeCore.netPlatform(),name:clDevName()}}); CL.busy=false;
    if(r.ok&&r.data&&r.data.token){ try{ localStorage.setItem(FrontOfficeCore.NET_TOKEN,r.data.token); localStorage.setItem(FrontOfficeCore.NET_PLAYER,JSON.stringify(r.data.player)); }catch(e){ return clSay('이 브라우저에 연결 정보를 저장하지 못했습니다.',true); }
      clLs(CL_ON,'1'); clLs(CL_BASE,null); Object.assign(CL,{typed:'',confl:{},ask:null,devs:null,link:null,list:null,recHas:kind==='rec'?false:CL.recHas}); try{ if(typeof UL!=='undefined'){ UL.v1sync=''; if(UL.sv)UL.sv.me=null; } }catch(e){}
      await clList(true); const other=prev&&prev.id&&prev.id!==r.data.player.id;
      return clSay(`다른 기기와 연결했습니다. 아래 클라우드 슬롯에서 '이 기기로 받기'를 누르면 이어 할 수 있습니다.${kind==='rec'?' 쓴 복구 코드는 더 쓸 수 없으니 복구 코드를 새로 만들어 두세요.':''}${other?' 이 기기에 있던 래더 기록은 원래 플레이어에 남습니다.':''}`); }
    if(r.status===429)return clSay('코드 입력이 너무 잦습니다. 한 시간 뒤 다시 시도해 주세요.',true);
    clSay(r.offline?'서버에 연결하지 못했습니다.':(r.data&&r.data.message)||'연결하지 못했습니다.',true); },
});
/* 올리는 때: 1분마다 확인(날짜가 바뀌고 10분이 지났을 때만 올림), 탭을 떠날 때(1분 넘었으면), 탭으로 돌아오면 목록 다시 보기(1분 넘었으면) */
try{ setInterval(()=>{ if(clOn()&&CL.st==='ok')clUpload(false).catch(()=>{}); },60e3);
  document.addEventListener('visibilitychange',()=>{ if(!clOn()||CL.st!=='ok')return; if(document.visibilityState==='hidden'){ if(Date.now()-CL.upAt>60e3)clUpload(true).catch(()=>{}); } else if(Date.now()-CL.listAt>60e3)clList(true); }); }catch(e){}
