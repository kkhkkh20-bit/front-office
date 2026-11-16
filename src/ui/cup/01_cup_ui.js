/* ===== 프런트컵(유저 대회) 화면: 구단 › 프런트컵 =====
   참가 신청: 버튼 하나로 지금 1군(타순·선발·불펜·부상 그대로, 투수 피로만 0)을 게임 서버(worker/cup.js, /api/cup/entry)에 보낸다. 세계 id(G.wid)당 대회마다 1개, 다시 내면 덮어쓰기.
   출전 로스터 앨범(엔진 cupAlbum): 시즌이 끝날 때마다 자동 저장, 지난 로스터로도 신청할 수 있다. 대회 경기 보기: 주최자가 올린 경기 묶음을 이 기기에서 같은 엔진으로 다시 돌린다.
   유저의 전당: 주최자가 올린 공개 결과(/api/cup/results). 우리 세계 id가 우승·준우승이면 칭호를 저장에 붙인다(전력에 영향 없음) */
const CUP={st:'',probing:false,cfg:null,my:null,busy:false,msg:'',bad:false,res:null,resSt:'',view:null,open:null,name:''};
const cupApi=(p,o)=>fetch('/api/cup'+p,Object.assign({cache:'no-store',credentials:'same-origin'},o||{})).then(async r=>{ let j={}; try{ j=await r.json(); }catch(e){} return {r,j}; });
function cupSay(m,bad){ CUP.msg=m; CUP.bad=!!bad; render(); }
function cupProbe(){ if(CUP.st||CUP.probing||!xfAvail())return; CUP.probing=true;
  cupApi('').then(({r,j})=>{ CUP.cfg=r.ok&&j.cup?j.cup:null; CUP.st=r.ok?'ok':r.status===404?'none':'off'; if(CUP.cfg&&G&&G.wid)return cupApi('/entry/'+G.wid).then(({j})=>{ CUP.my=j&&j.entered?j:null; }); },()=>{ CUP.st='off'; })
    .then(()=>cupApi('/results').then(({r,j})=>{ CUP.res=r.ok?j:null; cupTitleSync(); },()=>{}))
    .finally(()=>{ CUP.probing=false; try{ render(); }catch(e){} }); }
/* 칭호: 공개 결과에 우리 세계 id(해시)가 우승·준우승·4강으로 있으면 저장에 남긴다 */
function cupTitleSync(){ if(!G||!G.wid||!CUP.res||!Array.isArray(CUP.res.cups))return; const me=FrontOfficeCore.cupHashStr('wid:'+G.wid); const T=G.cupTt||[];
  for(const c of CUP.res.cups)for(const [k,lab] of [['champ','우승'],['runner','준우승']]){ const x=c[k]; if(x&&x.wh===me&&!T.some(t=>t.cup===c.id&&t.k===k))T.push({cup:c.id,k,t:`${c.title} ${lab} 단장`,y:G.year}); }
  if(T.length)G.cupTt=T; }
const cupDate=ms=>{ try{ const d=new Date(ms); return `${d.getMonth()+1}월 ${d.getDate()}일`; }catch(e){ return ''; } };
/* 얼굴 사진을 64px로 줄여 엔트리에 붙인다(카드 이미지용). 아직 못 불러온 사진은 빼고 보낸다(주최 도구가 같은 얼굴 묶음에서 다시 고른다) */
async function cupFaces(e){ const tid=e.club.tid; for(const s of e.P){ const p=G.players[s.id]; if(!p)continue; let u=null; try{ u=face6Src(p.team===tid?p:Object.assign({},p,{team:tid})); }catch(x){} if(!u||u===F6WAIT||!/^data:/.test(u))continue;
    try{ const im=new Image(); await new Promise((ok,no)=>{ im.onload=ok; im.onerror=no; im.src=u; }); const c=document.createElement('canvas'); c.width=c.height=64; c.getContext('2d').drawImage(im,0,0,64,64); s.f=c.toDataURL('image/webp',.72); if(!/^data:image\/webp/.test(s.f))s.f=c.toDataURL('image/jpeg',.7); }catch(x){} }
  try{ const t=team(tid); e.club.pal=tpal(t).slice(0,4); const B=typeof BADGE_IMG!=='undefined'?BADGE_IMG[tid]:null; if(B&&B.k)e.club.badge=B.k; }catch(x){}
  return e; }
function cupNameIn(){ const el=document.getElementById('cupName'); const v=el?el.value:CUP.name; CUP.name=v; return FrontOfficeCore.cupName(v||team(G.user).nick); }
async function cupSend(e){ const C=FrontOfficeCore; if(C.cupBadName(e.name))return cupSay('팀명에 쓸 수 없는 말이 들어 있습니다.',true);
  e.wid=cupWid(); e.cup=CUP.cfg.id; e.ts=Date.now(); await cupFaces(e); e.h=C.cupEntryHash(e);
  const v=C.cupValidate(e,CUP.cfg); if(!v.ok)return cupSay(v.errors[0].msg,true); if(v.elig.length)return cupSay(v.elig[0].msg,true);
  CUP.busy=true; cupSay('신청서를 보내는 중입니다.');
  try{ const {r,j}=await cupApi('/entry',{method:'POST',body:JSON.stringify(e),headers:{'Content-Type':'application/json'}}); CUP.busy=false;
    if(r.status===201){ CUP.my=Object.assign({entered:true},j); return cupSay(`신청했습니다. ${j.name} ${j.year} · OVR ${C.cupOvrTxt(j.ovr)}`); }
    cupSay((j.errors&&j.errors[0])||j.message||'신청하지 못했습니다. 잠시 뒤 다시 시도해 주세요.',true); }
  catch(x){ CUP.busy=false; cupSay('서버에 연결하지 못했습니다. 인터넷 연결을 확인해 주세요.',true); } }
function cupFile(e,name){ try{ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([JSON.stringify(e)],{type:'application/json'})); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1000); toast('엔트리 파일을 받았습니다.'); }catch(x){ toast('파일을 만들지 못했습니다.'); } }
Object.assign(A,{
  async cupApply(){ if(CUP.busy||!G||G.unemp||!CUP.cfg)return; const e=cupEntryNow({name:cupNameIn()}); if(!e)return; await cupSend(e); },
  async cupApplyAlb(v){ if(CUP.busy||!CUP.cfg)return; const x=cupAlbum().find(a=>a.id===+v); if(!x)return; const e=JSON.parse(JSON.stringify(x.e)); e.name=cupNameIn(); e.ovr=cupOvr(e); await cupSend(e); },
  cupFileNow(){ if(!G||G.unemp)return; const e=cupEntryNow({name:cupNameIn()}); if(!e)return; e.wid=cupWid(); cupFaces(e).then(()=>{ e.h=FrontOfficeCore.cupEntryHash(e); cupFile(e,`cup-entry-${e.year}.json`); }); },
  cupFileAlb(v){ const x=cupAlbum().find(a=>a.id===+v); if(!x)return; const e=JSON.parse(JSON.stringify(x.e)); e.name=cupNameIn(); e.wid=cupWid(); cupFaces(e).then(()=>{ e.h=FrontOfficeCore.cupEntryHash(e); cupFile(e,`cup-entry-${e.year}.json`); }); },
  cupWithdraw(){ if(CUP.busy||!G||!G.wid)return; CUP.busy=true; cupApi('/entry/'+G.wid,{method:'DELETE'}).then(({r,j})=>{ CUP.busy=false; if(r.ok){ CUP.my=null; cupSay('신청을 취소했습니다.'); } else cupSay(j.message||'취소하지 못했습니다.',true); },()=>{ CUP.busy=false; cupSay('서버에 연결하지 못했습니다.',true); }); },
  cupAlbSave(){ if(!G||G.unemp)return; const x=cupAlbumAdd('hand',null); toast(x?`${G.year} 로스터를 앨범에 저장했습니다.`:'저장하지 못했습니다.'); render(); },
  cupAlbDel(v){ if(cupAlbumDel(v)){ toast('앨범에서 지웠습니다.'); render(); } },
  cupRoster(v){ CUP.open=CUP.open===v?null:v; render(); },
  /* 대회 경기 보기: 경기 id(서버) 또는 붙여 넣은 묶음(JSON) → 이 기기 엔진으로 같은 경기를 다시 돌린다 */
  async cupWatch(){ const el=document.getElementById('cupGame'), raw=(el?el.value:'').trim(); if(!raw)return; let pk=null;
    if(raw.startsWith('{')){ try{ pk=JSON.parse(raw); }catch(x){ return cupSay('경기 묶음 형식이 아닙니다.',true); } }
    else { if(!/^[A-Za-z0-9_-]{1,64}$/.test(raw))return cupSay('경기 번호를 확인해 주세요.',true); try{ const {r,j}=await cupApi('/game/'+raw); if(!r.ok)return cupSay(j.message||'경기를 찾지 못했습니다.',true); pk=j; }catch(x){ return cupSay('서버에 연결하지 못했습니다.',true); } }
    if(!pk||!pk.a||!pk.b||!pk.o)return cupSay('경기 묶음이 비어 있습니다.',true);
    cupSay('경기를 다시 돌리는 중입니다.'); setTimeout(()=>{ let res; try{ res=cupMatch(pk.a,pk.b,pk.o); }catch(x){ console.error(x); res={ok:false}; }
      if(!res.ok)return cupSay('경기를 다시 돌리지 못했습니다.',true);
      const same=!pk.sum||pk.sum.every((s,i)=>res.games[i]&&res.games[i].sa===s[0]&&res.games[i].sb===s[1]);
      CUP.view={res,gi:0,tab:'log',same}; cupSay(same?'주최자 결과와 같은 경기입니다.':'주최자 결과와 다릅니다. 게임 판이 다를 수 있습니다.',!same); },30); },
  cupVG(v){ if(CUP.view){ CUP.view.gi=+v; render(); } }, cupVT(v){ if(CUP.view){ CUP.view.tab=v; render(); } },
  cupVClose(){ CUP.view=null; render(); },
});
function cupView(){ if(!G)return ''; cupProbe(); const C=FrontOfficeCore, t=team(G.user), on=xfAvail(), cfg=CUP.cfg;
  let now=null; try{ if(!G.unemp)now=cupEntryNow({name:CUP.name||t.nick}); }catch(e){ console.error(e); }
  const title=(G.cupTt||[]).map(x=>`<span class="cup-tt">${esc(x.t)}</span>`).join('');
  const st=!on?'<p class="small muted">대회 신청은 웹 사이트에서 할 수 있습니다. 내려받은 게임에서는 엔트리 파일을 받아 주최자에게 보내 주세요.</p>':!CUP.st?'<p class="small muted">대회 정보를 불러오는 중입니다.</p>':CUP.st==='off'?'<p class="small muted">지금은 대회 서버에 연결할 수 없습니다.</p>':!cfg?'<p class="small muted">지금 열린 대회가 없습니다.</p>':
    `<p class="cup-h"><b>${esc(cfg.title)}</b>${cfg.deadline?` · 접수 마감 ${esc(cfg.deadline)}`:''}</p>${cfg.minSeasons||cfg.payCap?`<p class="small muted">참가 자격: ${[cfg.minSeasons?`${cfg.minSeasons}시즌 이상 치른 저장`:'',cfg.payCap?`1군 연봉 합 ${money(cfg.payCap)} 이하`:''].filter(Boolean).join(' · ')}</p>`:''}
    <p class="cup-my">${CUP.my?`내 신청: <b>${esc(CUP.my.name)} ${CUP.my.year}</b> · OVR ${C.cupOvrTxt(CUP.my.ovr)} · ${cupDate(CUP.my.at)} 신청`:'아직 신청하지 않았습니다.'}</p>`;
  const form=G.unemp?'<p class="small muted">구단을 맡고 있을 때 신청할 수 있습니다.</p>':`<label class="cup-in"><span>팀명(12자)</span><input id="cupName" maxlength="12" value="${esc(CUP.name||t.nick)}" autocomplete="off"></label>
    ${now?`<p class="small">지금 1군 ${now.P.length}명 · OVR <b class="num">${C.cupOvrTxt(now.ovr)}</b> <span class="muted">(총|투수 타자)</span></p>`:''}
    <div class="btns">${on&&cfg?`<button class="btn primary" data-a="cupApply"${CUP.busy?' disabled':''}>대회 참가 신청</button>`:''}<button class="btn" data-a="cupFileNow">엔트리 파일 받기</button>${CUP.my?`<button class="btn" data-a="cupWithdraw"${CUP.busy?' disabled':''}>신청 취소</button>`:''}</div>
    <p class="small muted">신청하면 그 순간의 타순·선발·불펜·부상 상태가 그대로 들어갑니다(투수 피로만 0). 다시 신청하면 덮어쓰고, 하루에 한 번 할 수 있습니다.</p>`;
  const apply=`<section class="card"><h2 class="sec">프런트컵 참가</h2>${title?`<p class="cup-tts">${title}</p>`:''}${st}${form}${CUP.msg?`<div class="note${CUP.bad?' bad':''}">${esc(CUP.msg)}</div>`:''}</section>`;
  const AL=cupAlbum().slice().reverse();
  const alb=`<section class="card"><h2 class="sec">출전 로스터 앨범 <small class="muted">${AL.length}/${CUP_ALB_MAX}</small></h2><p class="small muted">시즌이 끝날 때마다 1군 로스터를 자동으로 남깁니다. 지난 로스터로도 신청할 수 있습니다.</p>
    <div class="btns"><button class="btn" data-a="cupAlbSave"${G.unemp?' disabled':''}>지금 로스터 저장</button></div>
    <div class="cup-alb">${AL.map(x=>{ const e=x.e, r=e.res; return `<div class="cup-a"><div><b>${x.y} ${esc(e.club.nick||e.name)}</b><span class="small muted">${x.k==='auto'?'시즌 종료':'직접 저장'}${r?` · ${r.rank}위${r.champ?' · 우승':''} · ${r.w}승 ${r.l}패`:''} · OVR ${C.cupOvrTxt(e.ovr)}</span></div>
      <div class="btns">${on&&cfg?`<button class="btn small" data-a="cupApplyAlb" data-v="${x.id}"${CUP.busy?' disabled':''}>이 로스터로 신청</button>`:''}<button class="btn small" data-a="cupFileAlb" data-v="${x.id}">파일</button><button class="btn small" data-a="cupAlbDel" data-v="${x.id}">삭제</button></div></div>`; }).join('')||'<p class="small muted">아직 저장한 로스터가 없습니다.</p>'}</div></section>`;
  const V=CUP.view; let vw='';
  if(V){ const g=V.res.games[V.gi]; vw=`<div class="cup-v"><p class="small"><b>${esc(V.res.a.name)} ${V.res.a.year}</b> ${V.res.wa}:${V.res.wb} <b>${esc(V.res.b.name)} ${V.res.b.year}</b></p>
    ${V.res.games.length>1?`<div class="chips">${V.res.games.map((x,i)=>`<button data-a="cupVG" data-v="${i}" class="${i===V.gi?'on':''}">${i+1}차전 ${x.sa}:${x.sb}</button>`).join('')}</div>`:''}
    <div class="chips">${[['log','중계'],['bat','타자'],['pit','투수'],['line','점수']].map(([k,l])=>`<button data-a="cupVT" data-v="${k}" class="${V.tab===k?'on':''}">${l}</button>`).join('')}<button data-a="cupVClose">닫기</button></div>
    <pre class="cup-pre">${esc(g[V.tab]||'')}</pre></div>`; }
  const watch=`<section class="card"><h2 class="sec">대회 경기 보기</h2><p class="small muted">주최자가 올린 경기 번호를 넣으면 이 기기에서 같은 경기를 다시 돌려 중계와 기록을 보여 줍니다.</p>
    <div class="row"><input id="cupGame" placeholder="경기 번호(예: cup1-R1M3)" autocomplete="off" style="flex:1;min-width:0"><button class="btn" data-a="cupWatch">보기</button></div>${vw}</section>`;
  const R=CUP.res&&Array.isArray(CUP.res.cups)?CUP.res.cups:[];
  const ros=(c,k,x)=>{ const id=c.id+':'+k; return `<button class="btn small" data-a="cupRoster" data-v="${esc(id)}">${CUP.open===id?'로스터 닫기':'로스터 보기'}</button>${CUP.open===id&&x.roster?`<div class="cup-ros small">${x.roster.map(r=>`<span>${esc(r.pos)} ${esc(r.n)} <b class="num">${r.o}</b></span>`).join('')}</div>`:''}`; };
  const hall=`<section class="card"><h2 class="sec">유저의 전당</h2>${R.length?R.slice().reverse().map(c=>`<div class="cup-hof"><p><b>${esc(c.title)}</b> <span class="small muted">${esc(c.date||'')} · ${c.n||''}팀</span></p>
    ${c.champ?`<p>우승 <b>${esc(c.champ.name)} ${c.champ.year}</b> <span class="small muted">OVR ${C.cupOvrTxt(c.champ.ovr)}</span> ${ros(c,'champ',c.champ)}</p>`:''}${c.runner?`<p>준우승 <b>${esc(c.runner.name)} ${c.runner.year}</b> ${ros(c,'runner',c.runner)}</p>`:''}
    ${(c.missions||[]).length?`<p class="small muted">미션상: ${c.missions.map(m=>esc(m.msg)).join(' · ')}</p>`:''}</div>`).join(''):'<p class="small muted">아직 끝난 대회가 없습니다.</p>'}</section>`;
  return `<div class="setx ws-own cupx"><div class="setc">${apply}${hall}</div><div class="setc">${alb}</div><div class="setc">${watch}</div></div>`; }
