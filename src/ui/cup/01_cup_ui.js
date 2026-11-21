/* ===== 프런트컵(유저 대회) 화면: 구단 › 프런트컵 =====
   참가 신청: 버튼 하나로 지금 1군(타순·선발·불펜·부상 그대로, 투수 피로만 0)을 게임 서버(worker/cup.js, /api/cup/entry)에 보낸다. 세계 id(G.wid)당 대회마다 1개, 다시 내면 덮어쓰기.
   출전 로스터 앨범(엔진 cupAlbum): 시즌이 끝날 때마다 자동 저장, 지난 로스터로도 신청할 수 있다. 대회 경기 보기: 주최자가 돌려 올린 기록(중계·박스·줄 점수)을 받아 그대로 보여 준다.
   프런트컵 명예의 전당: 주최자가 올린 공개 결과(/api/cup/results). 처음 화면·설정 › 정보·이 화면에서 누구나 본다. 받은 결과는 이 기기(localStorage)에 남겨 연결이 없을 때 보여 준다.
   우리 세계 id가 우승·준우승이면 칭호를 저장에 붙인다(전력에 영향 없음, AI 구단은 칭호 없음).
   참가: '대회 참가 신청'(서버) 또는 '참가 파일 저장'(파일을 주최자에게 보내면 주최 도구 add로 넣는다). 대회는 회차마다 한 번 여는 행사다 */
const CUP={pub:null,pubSt:'',st:'',probing:false,cfg:null,my:null,busy:false,msg:'',bad:false,res:null,resSt:'',view:null,name:''};
/* 응답 본문(JSON이 아니면 빈 객체: 내려받은 게임·점검 서버처럼 /api가 없는 곳) */
async function cupJson(r){ try{ const t=await r.text(); return t?JSON.parse(t):{}; }catch(e){ return {}; } }
/* 시간 제한(외부 검수 11-17): 12초 안에 답이 없으면 끊는다(연결 실패로 처리, 단추는 다시 풀린다) */
function cupFetchT(u,o,ms){ const ac=typeof AbortController!=='undefined'?new AbortController():null, t=ac?setTimeout(()=>ac.abort(),ms||12e3):null; return fetch(u,Object.assign({},o,ac?{signal:ac.signal}:{})).finally(()=>{ if(t)clearTimeout(t); }); }
const cupApi=(p,o)=>cupFetchT('/api/cup'+p,Object.assign({cache:'no-store',credentials:'same-origin'},o||{})).then(async r=>{ const j=await cupJson(r); return {r,j}; });
function cupSay(m,bad){ CUP.msg=m; CUP.bad=!!bad; render(); }
/* 서버는 받았는데 응답을 잃은 경우(외부 검수 11-17 #27): 내 신청 상태를 다시 읽어, 방금 낸 덱이 들어가 있으면 성공으로 보여 준다 */
async function cupRecover(g0,e,recent){ try{ const {r,j}=await cupApi('/entry/'+cupWid()); if(G!==g0||!r.ok||!j||!j.entered)return false; if(recent&&!(e&&j.name===e.name&&String(j.year)===String(e.year)&&Date.now()-(+j.at||0)<120e3&&!(CUP.my&&CUP.my.at===j.at)))return false; /* 이미 받은 성공(같은 at)이면 진짜 하루 1회 */ CUP.my=Object.assign({entered:true},j);
  const same=!!e&&j.name===e.name&&String(j.year)===String(e.year); if(same)try{ G.cupMine={cup:CUP.cfg.id,at:Date.now(),e:FrontOfficeCore.ulSlim(e)}; save(); }catch(x){}
  cupSay(same?`신청이 들어가 있습니다. ${j.name} ${j.year} · OVR ${FrontOfficeCore.cupOvrTxt(j.ovr)}`:`이미 오늘 신청한 덱이 있습니다(${j.name} ${j.year}). 내일 다시 바꿀 수 있습니다.`,!same); return true; }catch(x){ return false; } }
function cupProbe(){ if(CUP.st||CUP.probing||!xfAvail())return; CUP.probing=true;
  cupApi('').then(({r,j})=>{ CUP.cfg=r.ok&&j.cup?j.cup:null; CUP.st=r.ok?'ok':r.status===404?'none':'off'; if(CUP.cfg&&G&&G.wid)return cupApi('/entry/'+G.wid).then(({j})=>{ CUP.my=j&&j.entered?j:null; }); },()=>{ CUP.st='off'; })
    .then(()=>cupApi('/results').then(({r,j})=>{ CUP.res=r.ok?j:null; if(r.ok&&j&&Array.isArray(j.cups)){ HOF.data=j; HOF.at=Date.now(); HOF.st='live'; cupHofSave(j); } cupTitleSync(); },()=>{}))
    .finally(()=>{ CUP.probing=false; try{ render(); }catch(e){} }); }
/* 칭호: 공개 결과에 우리 세계 id(해시)가 우승·준우승·4강으로 있으면 저장에 남긴다 */
function cupTitleSync(){ if(!CUP.res&&HOF.data)CUP.res=HOF.data; if(!G||!G.wid||!CUP.res||!Array.isArray(CUP.res.cups))return; const me=FrontOfficeCore.cupHashStr('wid:'+G.wid); const T=G.cupTt||[];
  for(const c of CUP.res.cups)for(const [k,lab] of [['champ','우승'],['runner','준우승']]){ const x=c[k]; if(x&&x.wh===me&&!T.some(t=>t.cup===c.id&&t.k===k))T.push({cup:c.id,k,t:`${c.title} ${lab} 단장`,y:G.year}); }
  if(T.length&&JSON.stringify(G.cupTt||[])!==JSON.stringify(T)){ G.cupTt=T; try{ save(); }catch(e){} } }
const cupDate=ms=>{ try{ const d=new Date(+ms+9*36e5); return `${d.getUTCMonth()+1}월 ${d.getUTCDate()}일`; }catch(e){ return ''; } }; /* 대회 날짜는 늘 한국시간(외부 검수 11-17) */
/* 얼굴 사진을 64px로 줄여 엔트리에 붙인다(카드 이미지용). 아직 못 불러온 사진은 빼고 보낸다(주최 도구가 같은 얼굴 묶음에서 다시 고른다) */
async function cupFaces(e){ const tid=e.club.tid; for(const s of e.P){ const p=G.players[s.id]; if(!p)continue; let u=null; for(let k=0;k<24;k++){ try{ u=face6Src(p.team===tid?p:Object.assign({},p,{team:tid})); }catch(x){ u=null; } if(u!==F6WAIT)break; await new Promise(r=>setTimeout(r,250)); } /* 얼굴 시트를 아직 못 불러왔으면 잠깐 기다린다 */ if(!u||u===F6WAIT||!/^data:/.test(u))continue;
    try{ const im=new Image(); await new Promise((ok,no)=>{ im.onload=ok; im.onerror=no; im.src=u; }); const c=document.createElement('canvas'); c.width=c.height=64; c.getContext('2d').drawImage(im,0,0,64,64); s.f=c.toDataURL('image/webp',.72); if(!/^data:image\/webp/.test(s.f))s.f=c.toDataURL('image/jpeg',.7); }catch(x){} }
  try{ const t=team(tid); e.club.pal=tpal(t).slice(0,4); const B=typeof BADGE_IMG!=='undefined'?BADGE_IMG[tid]:null; if(B&&B.k)e.club.badge=B.k; }catch(x){}
  return e; }
function cupNameIn(){ const el=document.getElementById('cupName'); const v=el?el.value:CUP.name; CUP.name=v; return FrontOfficeCore.cupName(v||team(G.user).nick); }
/* 신청 보내기. 첫 await 전에 잠그고(외부 검수 11-17 P2: 얼굴 사진을 만드는 동안 단추가 살아 있어 두 번 보내던 것) 어느 길로 끝나든 푼다. 저장 칸이 바뀌면 응답을 버린다 */
/* 편집된 저장은 대회 신청·참가 파일을 막는다(엔진 22d_edited) */
function cupEdited(){ try{ return typeof editedBlock==='function'?editedBlock():''; }catch(e){ return ''; } }
async function cupSend(e){ const C=FrontOfficeCore; if(CUP.busy)return; { const ed=cupEdited(); if(ed)return cupSay(ed,true); } /* 편집된 저장은 대회 신청 불가(22d_edited) */ if(C.cupBadName(e.name))return cupSay('팀명에 쓸 수 없는 말이 들어 있습니다.',true);
  CUP.busy=true; const g0=G, cfg=CUP.cfg; cupSay('신청서를 준비하는 중입니다(선수 사진).');
  try{ e.wid=cupWid(); e.cup=cfg.id; e.ts=Date.now(); await cupFaces(e); if(G!==g0)return; e.h=C.cupEntryHash(e);
    const v=C.cupValidate(e,cfg); if(!v.ok)return cupSay(v.errors[0].msg,true); if(v.elig.length)return cupSay(v.elig[0].msg,true);
    cupSay('신청서를 보내는 중입니다.');
    const {r,j}=await cupApi('/entry',{method:'POST',body:JSON.stringify(e),headers:{'Content-Type':'application/json'}}); if(G!==g0)return;
    if(r.status===201){ CUP.my=Object.assign({entered:true},j); try{ G.cupMine={cup:cfg.id,at:Date.now(),e:C.ulSlim(e)}; save(); }catch(x){} CUP.ents=null; CUP.entsSt=''; CUP.drop=null; return cupSay(`신청했습니다. ${j.name} ${j.year} · OVR ${C.cupOvrTxt(j.ovr)}`); }
    if(r.status===429&&await cupRecover(g0,e,true))return; /* 방금(2분 안) 들어간 같은 덱이면 응답을 잃은 것 */
    cupSay((j.errors&&j.errors[0])||j.message||'신청하지 못했습니다. 잠시 뒤 다시 시도해 주세요.',true); }
  catch(x){ if(G===g0&&!(await cupRecover(g0,e)))cupSay('서버에 연결하지 못했습니다. 인터넷 연결을 확인해 주세요.',true); }
  finally{ if(G===g0){ CUP.busy=false; try{ render(); }catch(x){} } } }
/* 참가 파일 저장(서버 신청의 예비 길): 같은 엔트리를 파일로. 주최자는 node tools/cup-host.cjs add DIR 파일 로 넣는다 */
function cupFile(e,name){ try{ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([JSON.stringify(e)],{type:'application/json'})); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1000); toast('참가 파일을 저장했습니다. 주최자에게 보내 주세요.'); }catch(x){ toast('파일을 만들지 못했습니다.'); } }
const cupFileName=e=>`frontcup-${(CUP.cfg&&CUP.cfg.id)||'entry'}-${e.year}-${String(e.wid||'').slice(-6)}.json`; /* 영문·숫자만(한글 파일 이름은 일부 브라우저가 'download'로 바꾼다) */
Object.assign(A,{
  async cupApply(){ if(CUP.busy||!G||G.unemp||!CUP.cfg)return; const R=cupNowEntry(cupNameIn()); if(!R.e)return cupSay(R.err||'이 덱을 만들 수 없습니다.',true); await cupSend(R.e); },
  /* 대회 연봉 상한 맞추기(래더 v3, 사용자 11-17): 선수 빼기·되돌리기·추천대로 빼기 */
  cupCapDrop(v){ const id=+v, was=(CUP.drop||[]).slice(); CUP.drop=was.includes(id)?was.filter(x=>x!==id):was.concat(id); const R=cupNowEntry(); if(!R.e){ CUP.drop=was; return cupSay(R.err||'이 선수는 뺄 수 없습니다.',true); } CUP.msg=''; render(); },
  cupCapAuto(){ const R=cupNowEntry(); if(!R.e||!CUP.cfg)return; const s=FrontOfficeCore.ulCapSuggestX(R.e,CUP.cfg.payCapX); if(!s.ids.length)return cupSay('뺄 선수를 찾지 못했습니다. 본게임에서 1군을 바꿔 주세요.',true); CUP.drop=(CUP.drop||[]).concat(s.ids); cupSay(s.ok?`${s.ids.length}명을 빼면 상한 안에 들어갑니다. 이대로 신청하면 됩니다.`:`${s.ids.length}명을 빼도 상한을 넘습니다. 본게임에서 1군을 바꿔 주세요.`,!s.ok); },
  cupCapReset(){ CUP.drop=null; CUP.msg=''; render(); },
  cupMineT(){ CUP.mineOpen=!CUP.mineOpen; render(); },
  async cupApplyAlb(v){ if(CUP.busy||!CUP.cfg)return; const x=cupAlbum().find(a=>a.id===+v); if(!x)return; const e=JSON.parse(JSON.stringify(x.e)); e.name=cupNameIn(); e.ovr=cupOvr(e); await cupSend(e); },
  cupFileNow(){ if(!G||G.unemp)return; { const ed=cupEdited(); if(ed)return cupSay(ed,true); } const e=cupNowEntry(cupNameIn()).e; if(!e)return; if(FrontOfficeCore.cupBadName(e.name))return cupSay('팀명에 쓸 수 없는 말이 들어 있습니다.',true); e.wid=cupWid(); e.cup=CUP.cfg?CUP.cfg.id:''; e.ts=Date.now(); cupFaces(e).then(()=>{ e.h=FrontOfficeCore.cupEntryHash(e); cupFile(e,cupFileName(e)); }); },
  cupFileAlb(v){ { const ed=cupEdited(); if(ed)return cupSay(ed,true); } const x=cupAlbum().find(a=>a.id===+v); if(!x)return; const e=JSON.parse(JSON.stringify(x.e)); e.name=cupNameIn(); if(FrontOfficeCore.cupBadName(e.name))return cupSay('팀명에 쓸 수 없는 말이 들어 있습니다.',true); e.wid=cupWid(); e.cup=CUP.cfg?CUP.cfg.id:''; e.ts=Date.now(); e.ovr=cupOvr(e); cupFaces(e).then(()=>{ e.h=FrontOfficeCore.cupEntryHash(e); cupFile(e,cupFileName(e)); }); },
  cupWithdraw(){ if(CUP.busy||!G||!G.wid)return; CUP.busy=true; cupApi('/entry/'+G.wid,{method:'DELETE'}).then(({r,j})=>{ CUP.busy=false; if(r.ok){ CUP.my=null; cupSay('신청을 취소했습니다.'); } else cupSay(j.message||'취소하지 못했습니다.',true); },()=>{ CUP.busy=false; cupSay('서버에 연결하지 못했습니다.',true); }); },
  cupAlbSave(){ if(!G||G.unemp)return; const full=cupAlbum().length>=CUP_ALB_MAX, nx=full?cupAlbumNext():null, gone=nx!=null?cupAlbum()[nx]:null;
    if(full&&!gone)return toast('앨범이 모두 보관 고정이라 더 담을 수 없습니다. 고정을 풀거나 지워 주세요.');
    if(gone&&!confirm(`앨범이 가득 찼습니다(${CUP_ALB_MAX}개). 담으면 ${gone.y} ${gone.k==='auto'?'시즌 종료':'직접 저장'} 로스터가 지워집니다. 담을까요?`))return;
    const x=cupAlbumAdd('hand',null); if(x)save(); toast(x?`${G.year} 로스터를 앨범에 담았습니다.`:'앨범에 담지 못했습니다.'); render(); }, /* 저장을 건다(외부 검수 11-17 P1). 저장 실패는 저장 쪽이 따로 알린다 */
  cupAlbDel(v){ const r=cupAlbumDel(v); if(r){ CUP.albUndo=Object.assign(r,{at:Date.now()}); save(); render(); } }, /* 지운 뒤 '되돌리기'(외부 검수 11-17) */
  cupAlbUndo(){ const u=CUP.albUndo; if(!u)return; const A=cupAlbum(); if(!A.some(a=>a.id===u.x.id))A.splice(Math.min(u.i,A.length),0,u.x); CUP.albUndo=null; save(); toast('앨범에 되돌렸습니다.'); render(); },
  cupAlbPin(v){ if(cupAlbumPin(v)){ save(); render(); } },
  /* 대회 경기 보기: 주최자가 돌려 올린 기록을 그대로 받아 보여 준다(다시 돌리지 않는다). 시리즈 요약을 먼저 받고, 차전 기록(중계·박스·줄 점수)은 고를 때 그 차전만 받는다 */
  async cupWatch(){ const el=document.getElementById('cupGame'), id=(el?el.value:'').trim(); if(!id)return;
    if(!/^[A-Za-z0-9_-]{1,60}$/.test(id))return cupSay('경기 번호를 확인해 주세요.',true); const rq=CUP.wq=(CUP.wq|0)+1; /* 늦게 온 앞 요청이 나중 화면을 덮지 않게(외부 검수 11-17) */
    try{ const {r,j}=await cupApi('/game/'+id); if(rq!==CUP.wq)return; if(!r.ok)return cupSay(j.message||'경기를 찾지 못했습니다.',true);
      if(!j||!Array.isArray(j.g)||!j.g.length)return cupSay('이 경기 기록은 지금 게임에서 볼 수 없는 형식입니다.',true);
      CUP.view={id,idx:j,gi:0,tab:'log',recs:{}}; CUP.msg=''; cupRec(0); }
    catch(x){ if(rq===CUP.wq)cupSay('서버에 연결하지 못했습니다.',true); } },
  cupVG(v){ if(CUP.view){ CUP.view.gi=+v; cupRec(+v); } }, cupVT(v){ if(CUP.view){ CUP.view.tab=v; render(); } },
  cupWatchId(v){ const el=document.getElementById('cupGame'); if(el)el.value=v; return A.cupWatch(); },
  cupRetry(){ Object.assign(CUP,{st:'',probing:false,pubSt:'',entsSt:''}); HOF.st=''; render(); },
  cupVClose(){ CUP.view=null; CUP.wq=(CUP.wq|0)+1; render(); }, /* 닫은 뒤 늦은 응답으로 다시 열리지 않게 */
});
/* 차전 기록 한 개 받기(한 번 받으면 화면을 닫을 때까지 둔다) */
function cupRec(i){ const V=CUP.view; if(!V)return render(); if(V.recs[i]){ render(); return; } V.recs[i]='loading'; render();
  cupApi('/game/'+V.id+'-g'+(i+1)).then(({r,j})=>{ if(CUP.view!==V)return; V.recs[i]=r.ok&&j&&typeof j.log==='string'?j:'bad'; render(); },()=>{ if(CUP.view!==V)return; V.recs[i]='bad'; render(); }); }
/* 연재로 공개된 대회 진행(관리자 페이지 '결과 공개'): 날짜별 글·순위·경기 번호 */
function cupPubLoad(){ if(CUP.pubSt||!xfAvail())return; CUP.pubSt='loading'; cupApi('/pub').then(({r,j})=>{ CUP.pub=r.ok&&j&&j.v?j:null; CUP.pubSt='ok'; },()=>{ CUP.pubSt='off'; }).finally(()=>{ try{ render(); }catch(e){} }); }
function cupPubCard(){ cupPubLoad(); return cupPubHtml(CUP.pub); }
/* 공개분 카드(관리자 미리보기도 같은 그림): pv면 경기 단추를 누르지 못하게 */
function cupPubHtml(P,pv){ if(!P||!P.day)return '';
  const st=P.stand&&P.stand.length?`<table class="hof-tb small"><tr><th>순위</th><th>팀</th><th>승</th><th>패</th><th>무</th><th>승률</th></tr>${P.stand.map(x=>`<tr><td class="num">${x.rank}</td><td>${esc(x.name)}${x.ai?' <span class="muted">AI</span>':''}</td><td class="num">${x.w}</td><td class="num">${x.l}</td><td class="num">${x.t||0}</td><td class="num">${esc(x.pct)}</td></tr>`).join('')}</table>`:'';
  const last=P.days[P.days.length-1]; const gl=(P.games||[]).filter(g=>g.day===P.day);
  return `<section class="card cup-pub"><h2 class="sec">${esc(P.title)} 진행</h2><p class="small">${esc(last.t)}까지 공개${P.champ?` · 우승 <b>${esc(P.champ)}</b>`:''}</p>${st}
    ${gl.length?`<p class="small muted">이날 경기(누르면 기록을 봅니다)</p><div class="chips">${gl.map(g=>`<button${pv?' disabled':` data-a="cupWatchId" data-v="${esc(g.id)}"`}>${esc(g.a)} ${g.g.map(x=>x.join(':')).join(' ')} ${esc(g.b)}</button>`).join('')}</div>`:''}
    ${P.days.slice().reverse().map(d=>`<details class="hof-d"><summary class="small">${esc(d.t)}</summary><pre class="cup-pre">${esc(d.post)}</pre></details>`).join('')}</section>`; }
/* ===== 래더 v3(사용자 11-17 "레더랑 대회 쪽 유아이랑 시스템 제대로 더 개선해야하고"): 대회 상태 단계 · 내 신청 카드 · 연봉 상한 선수 빼기 ===== */
/* 신청할 덱: 지금 1군에서 CUP.drop 선수를 뺀 것(래더와 같은 ulCapDrop: 빠진 타순은 벤치, 선발은 불펜이 채움). {e, err} */
function cupNowEntry(name){ let e=null; try{ if(G&&!G.unemp)e=cupEntryNow({name:name||CUP.name||team(G.user).nick}); }catch(x){ console.error(x); } if(!e)return {e:null,err:''};
  const D=CUP.drop||[]; if(!D.length)return {e,err:''}; const r=FrontOfficeCore.ulCapDrop(e,D); if(r.err)return {e:null,err:r.err}; r.e.ovr=cupOvr(r.e); return {e:r.e,err:''}; }
const cupDl=d=>FrontOfficeCore.cupKstMs(d)||0; /* 마감(한국시간 글) → ms. 없는 날짜는 0(마감 없음으로 보지 않게 화면은 '접수 중'만) */
/* 지금 대회 단계: 0 없음 · 1 접수 중 · 2 마감(주최자 준비) · 3 진행(연재 공개 중) · 4 결과 공개 */
function cupStage(){ const c=CUP.cfg, P=CUP.pub&&c&&CUP.pub.id===c.id?CUP.pub:null; if(!c)return 0; if(P&&P.day>=7)return 4; if(P&&P.day)return 3; const dl=cupDl(c.deadline); return c.open!==false&&(!dl||Date.now()<dl)?1:2; }
/* 처음 화면의 프런트컵 메뉴는 대회가 진행 중일 때만(구단주 11-21): 접수 중·마감·1~6일차 공개(cupStage 1~3). 대회가 없거나 7일차까지 다 공개되면 숨긴다(명예의 전당은 설정 › 정보에서 늘 본다) */
const CUP_T={st:'',on:false};
const CUP_HOF_BTN='<button class="fb-button" data-a="tsGo" data-v="cuphof"><b>프런트컵 명예의 전당</b><span>유저 대회 역대 우승 팀과 로스터</span></button>';
function cupEventOn(){ cupTitleProbe(); return CUP_T.on; }
/* 처음 화면 전용 조용한 확인: 화면 전체를 다시 그리지 않는다(시작 배경·로고 디코딩을 끊지 않게, check-startup). 대회 중이면 메뉴에 단추만 끼워 넣는다 */
function cupTitleProbe(){ if(CUP_T.st)return; CUP_T.st='wait'; if(typeof xfAvail==='function'&&!xfAvail()){ CUP_T.st='off'; return; }
  Promise.all([cupApi(''),cupApi('/pub').catch(()=>null)]).then(([a,b])=>{ if(a&&a.r.ok&&a.j&&a.j.cup)CUP.cfg=a.j.cup; if(b&&b.r.ok&&b.j&&b.j.v)CUP.pub=b.j; const s=cupStage(); CUP_T.on=!!(a&&a.r.ok&&a.j&&a.j.cup)&&s>=1&&s<=3; CUP_T.st=CUP_T.on?'on':'none';
    if(CUP_T.on){ const nav=document.querySelector('.fb-menu'); if(nav&&!nav.querySelector('[data-v="cuphof"]')){ const set=nav.querySelector('[data-v="settings"]'); if(set)set.insertAdjacentHTML('beforebegin',CUP_HOF_BTN); } } },()=>{ CUP_T.st='off'; }); }
function cupEntsLoad(){ if(CUP.entsSt||!xfAvail()||cupStage()!==1)return; CUP.entsSt='loading'; cupApi('/entries').then(({r,j})=>{ CUP.ents=r.ok&&j&&Array.isArray(j.entries)?j:null; },()=>{}).finally(()=>{ CUP.entsSt='ok'; try{ render(); }catch(e){} }); }
function cupStatusHtml(){ const c=CUP.cfg; if(!c)return ''; const k=cupStage(), P=CUP.pub&&CUP.pub.id===c.id?CUP.pub:null, dl=cupDl(c.deadline), left=dl-Date.now();
  const lt=left>0&&left<365*864e5?(left>864e5?`D-${Math.floor(left/864e5)}`:`${Math.floor(left/36e5)}시간 ${Math.floor(left%36e5/6e4)}분`):'';
  const S=[[1,'접수 중'],[2,'마감'],[3,'진행'],[4,'결과 공개']], E=CUP.ents;
  const what=k===1?`접수 중입니다${lt?` · 마감까지 <b>${lt}</b>`:''}${E?` · 지금 <b>${E.n}팀</b> 신청(정원 ${c.teams||10}팀${E.n<(c.teams||10)?', 모자란 자리는 AI 구단':', 넘으면 OVR 순'})`:''}.`
    :k===2?'접수를 마감했습니다. 주최자가 시드를 정하고 대회를 돌린 뒤 하루씩 공개합니다.':k===3?`진행 중입니다 · <b>${P.day}/7일차</b>까지 공개(${esc(P.days[P.days.length-1].t)}). 아래 '진행' 칸에서 그날 결과와 경기를 봅니다.`:`대회가 끝났습니다${P&&P.champ?` · 우승 <b>${esc(P.champ)}</b>`:''}. 명예의 전당에서 우승 덱을 보고 붙어 볼 수 있습니다.`;
  return `<div class="cup-st"><ol class="cup-steps">${S.map(([i,t])=>`<li class="${i<k?'done':i===k?'now':''}"><b>${i<k?'✓':i}</b><span>${t}</span></li>`).join('')}</ol><p class="small">${what}</p></div>`; }
/* 내 신청 카드: 서버가 아는 신청(이름·OVR·시각) + 이 저장에 남긴 덱 사본(펼쳐 보기) + 시드 예상 */
function cupMineHtml(){ const C=FrontOfficeCore, M=CUP.my, c=CUP.cfg; if(!M)return '<p class="cup-my">아직 신청하지 않았습니다.</p>'; const mine=G.cupMine&&c&&G.cupMine.cup===c.id?G.cupMine.e:null, E=CUP.ents;
  const seed=E&&E.entries?(E.entries.find(x=>x.name===M.name&&String(x.year)===String(M.year))||{}).seed:null;
  return `<div class="cup-mine"><p><span class="pill">접수됨</span> <b>${esc(M.name)} ${esc(String(M.year))}</b> · OVR <b class="num">${C.cupOvrTxt(M.ovr)}</b></p><p class="small muted">${cupDate(M.at)} 신청${seed?` · 지금 시드 <b>${seed}번</b>${seed>(c.teams||10)?'(정원 밖)':''}`:''}${cupStage()>1?' · 마감되어 바꿀 수 없습니다':' · 마감 전까지 다시 신청하면 덮어씁니다'}</p>
    ${mine?`<button class="lnk small" data-a="cupMineT">${CUP.mineOpen?'내 덱 접기':'낸 덱 보기(타순·선발·불펜)'}</button>${CUP.mineOpen?cupDeckHtml(mine):''}`:''}</div>`; }
/* 연봉 상한 칸: 넘으면 추천·선수마다 빼기(래더 덱 화면과 같은 규칙) */
function cupCapHtml(e,cfg){ const C=FrontOfficeCore; if(!e||!cfg||!cfg.payCapX)return ''; const c=C.cupPayCheck(e,cfg.payCapX), D=CUP.drop||[], base=(()=>{ try{ return cupEntryNow({name:CUP.name||team(G.user).nick}); }catch(x){ return null; } })(), byId=new Map(((base&&base.P)||[]).map(p=>[p.id,p]));
  const pr=(p,on)=>p?`<div class="ul-cr"><b>${esc(p.name)}</b><span class="small muted">${p.isP?'투수':CUP_POSK[p.pos]||p.pos} · OVR ${cupPOvr(p)}</span><em class="num">${money(p.sal||0)}</em><button class="btn small" data-a="cupCapDrop" data-v="${p.id}">${on?'되돌리기':'빼기'}</button></div>`:'';
  const sg=c.ok?{ids:[]}:C.ulCapSuggestX(e,cfg.payCapX), top=e.P.slice().sort((a,b)=>(b.sal||0)-(a.sal||0)).slice(0,8);
  return `<div class="ul-cap${c.ok?'':' ul-cap-over'}"><p class="small cup-cap${c.ok?'':' bad'}">연봉 상한 <b>${money(c.cap)}</b> · 신청할 덱 <b>${money(c.pay)}</b> · ${c.ok?`여유 ${money(c.room)}`:`<b>${money(-c.room)} 초과</b>`}</p>
    ${c.ok?'':`<p class="small">상한을 넘어 신청할 수 없습니다. ${sg.ids.length?(sg.ok?'이 선수를 빼면 들어갑니다:':'이 선수를 빼도 모자랍니다(본게임에서 1군을 바꿔 주세요):'):''}</p><div class="ul-crs">${sg.ids.map(id=>pr(byId.get(id),false)).join('')}</div>${sg.ids.length?'<div class="btns"><button class="btn small primary" data-a="cupCapAuto">추천대로 빼기</button></div>':''}`}
    ${D.length?`<p class="small">뺀 선수 ${D.length}명 <button class="lnk small" data-a="cupCapReset">모두 되돌리기</button></p><div class="ul-crs">${D.map(id=>pr(byId.get(id),true)).join('')}</div>`:''}
    <details class="hof-d"><summary class="small">연봉 상위 8명 · 직접 빼기</summary><div class="ul-crs">${top.map(p=>pr(p,false)).join('')}</div></details><p class="small muted">뺀 선수는 대회 덱에서만 빠집니다(본게임 1군은 그대로). 빠진 타순은 벤치 야수, 선발은 불펜 투수가 채웁니다.</p></div>`; }
function cupView(){ if(!G)return ''; cupProbe(); cupPubLoad(); cupEntsLoad(); const C=FrontOfficeCore, t=team(G.user), on=xfAvail(), cfg=CUP.cfg;
  let now=null, nowErr=''; { const R=cupNowEntry(); now=R.e; nowErr=R.err; }
  const title=(G.cupTt||[]).map(x=>`<span class="cup-tt">${esc(x.t)}</span>`).join('');
  const st=!on?'<p class="small muted">서버 신청은 웹 사이트에서 할 수 있습니다. 내려받은 게임에서는 \'참가 파일 저장\'으로 받은 파일을 주최자에게 보내 주세요.</p>':!CUP.st?'<p class="small muted">대회 정보를 불러오는 중입니다.</p>':CUP.st==='off'?'<p class="small">지금은 대회 서버에 연결할 수 없습니다. <button class="lnk small" data-a="cupRetry">다시 연결</button></p>':!cfg?'<p class="small muted">지금 열린 대회가 없습니다.</p>':
    `<p class="cup-h"><b>${esc(cfg.title)}</b>${cfg.deadline?` · 접수 마감 ${esc(cfg.deadline)}(한국시간)`:''}</p>${cfg.format==='league'?`<p class="small muted">이번 한 번 여는 대회입니다. ${cfg.teams||10}팀 리그(팀당 ${((cfg.teams||10)-1)*3}경기) 뒤 와일드카드·준플레이오프·플레이오프·한국시리즈로 우승을 가립니다. 모자란 자리는 리그 평균 AI 구단이 채웁니다.</p>`:''}${cfg.minSeasons||cfg.payCap||cfg.payCapX?`<p class="small muted">참가 자격: ${[cfg.minSeasons?`${cfg.minSeasons}시즌 이상 치른 저장`:'',cfg.payCap?`1군 연봉 합 ${money(cfg.payCap)} 이하`:'',cfg.payCapX?`덱 연봉 합 ${money(Math.floor(C.CUP_CAP_WON*cfg.payCapX))} 이하(첫 시즌 샐러리캡${+cfg.payCapX!==1?` × ${cfg.payCapX}`:''})`:''].filter(Boolean).join(' · ')}</p>`:''}
    ${cupStatusHtml()}${cupMineHtml()}`;
  const form=G.unemp?'<p class="small muted">구단을 맡고 있을 때 신청할 수 있습니다.</p>':`<label class="cup-in"><span>팀명(12자)</span><input id="cupName" maxlength="12" value="${esc(CUP.name||t.nick)}" autocomplete="off"></label>
    ${now?`<p class="small">${(CUP.drop||[]).length?'신청할 덱':'지금 1군'} ${now.P.length}명 · OVR <b class="num">${C.cupOvrTxt(now.ovr)}</b> <span class="muted">(총|투수 타자)</span></p>`:nowErr?`<div class="note bad">${esc(nowErr)}</div>`:''}${cupCapHtml(now,cfg)}
    <div class="btns">${on&&cfg&&cupStage()===1?`<button class="btn primary" data-a="cupApply"${CUP.busy||(now&&cfg.payCapX&&!C.cupPayCheck(now,cfg.payCapX).ok)?' disabled':''}>${CUP.my?'다시 신청(덮어쓰기)':'대회 참가 신청'}</button>`:''}<button class="btn" data-a="cupFileNow">참가 파일 저장</button>${CUP.my&&cupStage()===1?`<button class="btn" data-a="cupWithdraw"${CUP.busy?' disabled':''}>신청 취소</button>`:''}</div>
    <p class="small muted">신청하면 그 순간의 타순·선발·불펜·부상 상태가 그대로 들어갑니다(투수 피로만 0). 다시 신청하면 덮어쓰고, 하루에 한 번 할 수 있습니다. 신청이 안 되면 '참가 파일 저장'으로 받은 파일을 주최자에게 보내 주세요.</p>`;
  const apply=`<section class="card"><h2 class="sec">프런트컵 참가</h2>${title?`<p class="cup-tts">${title}</p>`:''}${st}${form}${CUP.msg?`<div class="note${CUP.bad?' bad':''}">${esc(CUP.msg)}</div>`:''}</section>`;
  const AL=cupAlbum().slice().reverse();
  const alb=`<section class="card"><h2 class="sec">출전 로스터 앨범</h2><p class="small muted">시즌이 끝날 때마다 1군 로스터를 자동으로 남깁니다(${AL.length}/${CUP_ALB_MAX}개). 지난 로스터로도 신청할 수 있습니다.</p>
    <div class="btns"><button class="btn" data-a="cupAlbSave"${G.unemp?' disabled':''}>지금 로스터 저장</button></div>
    ${(()=>{ const U=CUP.albUndo; return U&&Date.now()-U.at<60e3?`<div class="note">${U.x.y} 로스터를 지웠습니다. <button class="lnk small" data-a="cupAlbUndo">되돌리기</button></div>`:''; })()}
    ${(()=>{ const n=cupAlbumNext(), g=n!=null?cupAlbum()[n]:null; return AL.length>=CUP_ALB_MAX-2?`<p class="small cup-warn">${g?`가득 차면 <b>${g.y} ${g.k==='auto'?'시즌 종료':'직접 저장'}</b> 로스터부터 지웁니다. 남기려면 '보관 고정'을 누르세요.`:'모두 보관 고정이라 가득 차면 더 담지 않습니다.'}</p>`:''; })()}
    <div class="cup-alb">${AL.map(x=>{ const e=x.e, r=e.res; return `<div class="cup-a${x.pin?' cup-pin':''}"><div><b>${x.pin?'[고정] ':''}${x.y} ${esc(e.club.nick||e.name)}</b><span class="small muted">${x.k==='auto'?'시즌 종료':'직접 저장'}${r?` · ${r.rank}위${r.champ?' · 우승':''} · ${r.w}승 ${r.l}패`:''} · OVR ${C.cupOvrTxt(e.ovr)}</span></div>
      <div class="btns">${on&&cfg&&cupStage()===1?`<button class="btn small" data-a="cupApplyAlb" data-v="${x.id}"${CUP.busy?' disabled':''}>이 로스터로 신청</button>`:''}<button class="btn small" data-a="cupFileAlb" data-v="${x.id}">참가 파일</button><button class="btn small" data-a="cupAlbPin" data-v="${x.id}" aria-pressed="${!!x.pin}">${x.pin?'고정 풀기':'보관 고정'}</button><button class="btn small" data-a="cupAlbDel" data-v="${x.id}">삭제</button></div></div>`; }).join('')||'<p class="small muted">아직 저장한 로스터가 없습니다.</p>'}</div></section>`;
  const DK=ulDecks(); const got=DK.length?`<section class="card"><h2 class="sec">가져온 덱</h2><p class="small muted">명예의 전당에서 가져온 우승 덱입니다. 유저 래더에서 도전 덱으로 만납니다. 내 덱으로는 등록할 수 없습니다.</p>
    ${DK.map(x=>`<details class="hof-d"><summary class="small"><b>${esc(x.name)} ${esc(x.year)}</b> · ${esc(x.src)} · OVR ${esc(C.cupOvrTxt(x.ovr))}</summary>${cupDeckHtml(x.e)}<div class="btns"><button class="btn small" data-a="cupDeckDrop" data-v="${esc(x.h)}">지우기</button></div></details>`).join('')}</section>`:'';
  const V=CUP.view; let vw='';
  if(V){ const X=V.idx, g=X.g[V.gi]||[], rec=V.recs[V.gi]; const body=rec==='loading'||!rec?'<p class="small muted">기록을 받는 중입니다.</p>':rec==='bad'?'<p class="small muted">이 차전 기록을 받지 못했습니다. 잠시 뒤 다시 골라 주세요.</p>':V.tab==='log'?`<pre class="cup-pre">${esc(rec.log||'')}</pre>`:ulTabTbl(rec[V.tab]);
    vw=`<div class="cup-v"><p class="small">${X.title?`<span class="muted">${esc(X.title)}</span> `:''}<b>${esc(X.a)}</b> vs <b>${esc(X.b)}</b></p>
    <div class="chips">${X.g.map((x,i)=>`<button data-a="cupVG" data-v="${i}" class="${i===V.gi?'on':''}">${X.g.length>1?(i+1)+'차전 ':''}${x[0]}:${x[1]}${x[3]?' 끝내기':x[2]>9?` ${x[2]}회`:''}</button>`).join('')}</div>
    <div class="chips">${[['log','중계'],['bat','타자'],['pit','투수'],['line','점수']].map(([k,l])=>`<button data-a="cupVT" data-v="${k}" class="${V.tab===k?'on':''}">${l}</button>`).join('')}<button data-a="cupVClose">닫기</button></div>
    ${body}</div>`; }
  const watch=`<section class="card"><h2 class="sec">대회 경기 보기</h2><p class="small muted">주최자가 알린 경기 번호를 넣으면 그 경기의 문자 중계·박스 스코어·줄 점수를 보여 줍니다.</p>
    <div class="row"><input id="cupGame" placeholder="경기 번호(예: cup1-KS)" autocomplete="off" style="flex:1;min-width:0"><button class="btn" data-a="cupWatch">보기</button></div>${vw}</section>`;
  const hall=`<section class="card"><h2 class="sec">프런트컵 명예의 전당</h2>${cupHofBody()}</section>`;
  return `<div class="setx ws-own cupx"><div class="setc">${apply}${hall}</div><div class="setc">${alb}${got}</div><div class="setc">${ulExHtml('cup')}${cupPubCard()}${watch}</div></div>`; }

/* ===== 프런트컵 명예의 전당: 처음 화면(tsGo cuphof)·설정 › 정보·구단 › 프런트컵. 게임을 열지 않아도(G 없이) 그린다 ===== */
const CUP_HOF_KEY='fo-cup-hof';
const HOF={st:'',data:null,at:0};
function cupHofCache(){ try{ const t=localStorage.getItem(CUP_HOF_KEY); if(t){ const j=JSON.parse(t); if(j&&Array.isArray(j.cups))return j; } }catch(e){} return null; }
function cupHofSave(j){ try{ localStorage.setItem(CUP_HOF_KEY,JSON.stringify(Object.assign({},j,{at:Date.now()}))); }catch(e){} }
function cupHofLoad(){ if(HOF.st)return; const c=cupHofCache(); if(c){ HOF.data=c; HOF.at=c.at||0; }
  if(!xfAvail()){ HOF.st=c?'cache':'none'; return; }
  HOF.st='loading';
  fetch('/api/cup/results',{cache:'no-store',credentials:'same-origin'}).then(r=>r.ok?cupJson(r).then(j=>j&&Array.isArray(j.cups)?j:Promise.reject(0)):r.status===404?{v:1,cups:[],none:1}:Promise.reject(r.status))
    .then(j=>{ if(j&&Array.isArray(j.cups)&&!j.none){ HOF.data=j; HOF.at=Date.now(); HOF.st='live'; cupHofSave(j); CUP.res=j; } else HOF.st=c?'cache':'live'; },()=>{ HOF.st=c?'cache':'off'; })
    .finally(()=>{ try{ cupTitleSync(); }catch(e){} try{ render(); }catch(e){} }); }
/* ===== 덱 보기(명예의 전당 우승 덱·유저 래더 공용): 엔트리 하나를 타순·선발·불펜·감독·OVR(총|투|타)·얼굴로 =====
   얼굴: 엔트리에 실린 사진(f)이 있으면 그것, 없으면 이 기기의 얼굴 묶음에서 선수 번호로 고른다(지금 커리어의 얼굴 배정은 건드리지 않는다) */
function cupFaceOf(s,e){ if(s&&s.f)return s.f; if(!G||typeof face6Src!=='function')return null; { const q=G.players&&G.players[s.id]; if(q&&q.name===s.name&&q.team!=null){ try{ const u=face6Src(q); if(u&&u!==F6WAIT)return u; }catch(x){} } } /* 이 저장의 선수(내 덱·앨범)는 게임에서 보던 얼굴 */ const tid=e&&e.club&&e.club.tid!=null?+e.club.tid%10:0;
  const k=['f6','f6r','f6v','f17','fam'], keep=k.map(x=>G[x]); G.f6={}; G.f6r={}; delete G.f17; delete G.fam;
  try{ const u=face6Src(Object.assign({},s,{team:tid})); return u&&u!==F6WAIT?u:null; }catch(x){ return null; } finally{ k.forEach((x,i)=>{ if(keep[i]===undefined)delete G[x]; else G[x]=keep[i]; }); } }
const cupPOvr=p=>{ try{ return FrontOfficeCore.dv(ovr(p)); }catch(x){ return '-'; } };
const CUP_POSK={C:'포수','1B':'1루수','2B':'2루수','3B':'3루수',SS:'유격수',LF:'좌익수',CF:'중견수',RF:'우익수',DH:'지명'};
const CUP_PROLE={cl:'마무리',su:'필승조',mr:'추격조',lr:'롱릴리프'};
/* 불펜 역할: 단장이 정한 역할(bp) 먼저, 없으면 순서(첫째 마무리, 둘째~넷째 필승조, 나머지 추격조) */
function cupPenRole(e,id,i){ const k=e.bp&&e.bp[id]; return CUP_PROLE[k]||(i===0?'마무리':i<=3?'필승조':'추격조'); }
function cupDeckRow(e,s,lab){ if(!s)return ''; const f=cupFaceOf(s,e);
  return `<div class="dk-r">${f?`<img class="dk-f" src="${esc(f)}" alt="" loading="lazy">`:'<span class="dk-f dk-f0"></span>'}<span class="dk-l">${esc(lab)}</span><b class="dk-n">${esc(s.name)}</b><span class="dk-o num">${cupPOvr(s)}</span>${s.injOut>0?'<span class="dk-x">부상</span>':''}</div>`; }
function cupDeckHtml(e,o){ o=o||{}; if(!e||!Array.isArray(e.P))return ''; const P=new Map(e.P.map(p=>[p.id,p])), O=e.ovr||(typeof cupOvr==='function'?cupOvr(e):null);
  const ln=(e.ln||[]).map(([id,pos],i)=>cupDeckRow(e,P.get(id),`${i+1} ${CUP_POSK[pos]||pos}`)).join('');
  const rot=(e.rot||[]).map((id,i)=>cupDeckRow(e,P.get(id),`선발${i+1}`)).join('');
  const pen=(e.pen||[]).map((id,i)=>cupDeckRow(e,P.get(id),cupPenRole(e,id,i))).join('');
  const bn=(e.bn||[]).map(id=>P.get(id)).filter(Boolean);
  return `<div class="dk${o.cls?' '+o.cls:''}"><div class="dk-h">${o.head||''}<span class="dk-ovr num">OVR 총 <b>${O?O.t:'-'}</b> | 투 <b>${O?O.p:'-'}</b> | 타 <b>${O?O.b:'-'}</b></span>${e.mgr&&e.mgr.name?`<span class="small muted">감독 ${esc(e.mgr.name)}</span>`:''}</div>
    <div class="dk-c"><div><p class="dk-t">타순</p>${ln}</div><div><p class="dk-t">선발</p>${rot}<p class="dk-t">불펜</p>${pen}</div></div>
    ${bn.length?`<p class="small muted dk-bn">벤치 ${bn.map(p=>`${esc(p.name)}(${CUP_POSK[p.pos]||p.pos} ${cupPOvr(p)})`).join(' · ')}</p>`:''}</div>`; }
/* ===== 가져온 덱(유저 래더 도전 덱): 이 기기에 둔다(처음 화면에서도 가져올 수 있게). 남의 덱이라 내 덱으로 등록할 수 없다 ===== */
const UL_DECKS_KEY='fo-ul-decks', UL_DECKS_MAX=12;
function ulDecks(){ try{ const j=JSON.parse(localStorage.getItem(UL_DECKS_KEY)||'[]'); return Array.isArray(j)?j.filter(x=>x&&x.e&&Array.isArray(x.e.P)):[]; }catch(e){ return []; } }
function ulDecksPut(L){ try{ localStorage.setItem(UL_DECKS_KEY,JSON.stringify(L.slice(-UL_DECKS_MAX))); return true; }catch(e){ return false; } }
function ulDeckImport(e,src){ if(!e||!Array.isArray(e.P))return '덱이 비어 있습니다.'; const C=FrontOfficeCore, h=e.h||C.cupEntryHash(e); const L=ulDecks();
  if(L.some(x=>x.h===h))return '이미 가져온 덱입니다.';
  const x={h,ro:1,src:String(src||''),name:e.name,year:e.year,ovr:e.ovr||null,at:Date.now(),e:Object.assign(JSON.parse(JSON.stringify(e)),{h})}; delete x.e.wid;
  L.push(x); return ulDecksPut(L)?'':'이 기기에 저장할 자리가 없습니다.'; }
function ulDeckDel(h){ const L=ulDecks(), n=L.length; const M=L.filter(x=>x.h!==h); if(M.length===n)return false; ulDecksPut(M); return true; }
Object.assign(A,{
  cupDeckGet(v){ const c=(HOF.data&&HOF.data.cups||[]).find(x=>x.id===v), d=c&&c.champ&&c.champ.deck; if(!d)return toast('이 대회는 우승 덱이 올라와 있지 않습니다.');
    const m=ulDeckImport(d,`${c.title} 우승`); toast(m||`${d.name} 덱을 가져왔습니다. 유저 래더에서 도전 덱으로 만날 수 있습니다(내 덱으로 등록은 안 됩니다).`); render(); },
  cupDeckDrop(v){ if(ulDeckDel(v)){ toast('가져온 덱을 지웠습니다.'); render(); } },
});
function cupHofTeam(lab,x,c){ if(!x)return ''; const C=FrontOfficeCore, win=lab==='우승';
  const got=win&&x.deck&&ulDecks().some(d=>d.h===(x.deck.h||C.cupEntryHash(x.deck)));
  const deck=win&&x.deck&&Array.isArray(x.deck.P)?`<details class="hof-d"><summary class="small">우승 덱 보기(타순·선발·불펜)</summary>${cupDeckHtml(x.deck)}
      <div class="btns">${typeof G!=='undefined'&&G&&!UI.title?`<button class="btn small primary" data-a="ulEx" data-k="hof" data-v="${esc(c.id)}">이 덱과 붙어 보기</button>`:''}${got?'<span class="small muted">가져온 덱에 있습니다.</span>':`<button class="btn small" data-a="cupDeckGet" data-v="${esc(c.id)}">이 덱 가져오기</button>`}</div></details>`:
    Array.isArray(x.roster)&&x.roster.length?`<details class="hof-d"><summary class="small">로스터</summary><div class="hof-ros small">${x.roster.map(r=>`<span>${esc(r.pos)} ${esc(r.n)} <b class="num">${esc(r.o)}</b></span>`).join('')}</div></details>`:'';
  return `<div class="hof-team${win?' hof-win':''}"><p>${win?'<span class="hof-badge">우승</span> <span class="hof-k">우승 단장</span>':`<span class="hof-k">${lab}${x.gm?' 단장':''}</span>`} ${x.gm?`<b>${esc(x.gm)}</b> <span class="small">${esc(x.name)}${x.ai?'':' '+esc(x.year)}</span>`:`<b>${esc(x.name)}${x.ai?'':' '+esc(x.year)}</b>`}${x.ai?' <span class="pill">AI</span>':''} <span class="small muted">OVR ${esc(C.cupOvrTxt(x.ovr))}</span></p>${deck}</div>`; }
function cupHofCup(c){
  const st=Array.isArray(c.stand)&&c.stand.length?`<details class="hof-d"><summary class="small">정규리그 순위</summary><table class="hof-tb small"><tr><th>순위</th><th>팀</th><th>승</th><th>패</th><th>무</th><th>승률</th></tr>${c.stand.map(x=>`<tr><td class="num">${x.rank}</td><td>${esc(x.name)}${x.ai?' <span class="muted">AI</span>':''}</td><td class="num">${x.w}</td><td class="num">${x.l}</td><td class="num">${x.t||0}</td><td class="num">${esc(x.pct)}</td></tr>`).join('')}</table></details>`:'';
  const ps=Array.isArray(c.post)&&c.post.length?`<p class="small muted">${c.post.map(p=>`${esc(p.name)} ${esc(p.win)}`).join(' → ')}</p>`:'';
  const ti=Array.isArray(c.titles)&&c.titles.length?`<details class="hof-d"><summary class="small">개인 타이틀</summary><p class="small">${c.titles.map(t=>`${esc(t.k)} ${esc(t.name)}(${esc(t.team)}) ${esc(t.v)}`).join(' · ')}</p></details>`:'';
  return `<div class="hof-cup"><p class="hof-h"><b>${esc(c.title)}</b> <span class="small muted">${esc(c.date||'')}${c.n?` · ${c.n}팀${c.ai?` + AI ${c.ai}팀`:''}`:''}</span></p>
    ${cupHofTeam('우승',c.champ,c)}${cupHofTeam('준우승',c.runner,c)}${ps}${st}${ti}
    ${(c.missions||[]).length?`<p class="small muted">미션상: ${c.missions.map(m=>esc(m.msg)).join(' · ')}</p>`:''}</div>`; }
function cupHofBody(){ cupHofLoad(); const D=HOF.data, R=D&&Array.isArray(D.cups)?D.cups:[];
  const d=HOF.at?(()=>{ try{ const x=new Date(HOF.at); return `${x.getMonth()+1}월 ${x.getDate()}일`; }catch(e){ return ''; } })():'';
  const note=HOF.st==='loading'&&!D?'<p class="small muted">명예의 전당을 불러오는 중입니다.</p>':(HOF.st==='cache'||HOF.st==='off')&&D?`<p class="small muted">서버에 연결하지 못해 이 기기에 마지막으로 받은 결과${d?`(${d})`:''}를 보여 줍니다.</p>`:!D&&HOF.st==='none'?'<p class="small muted">명예의 전당은 웹 사이트에서 열면 받아 옵니다. 한 번 받으면 이 기기에 남아 연결 없이도 볼 수 있습니다.</p>':!D&&HOF.st==='off'?'<p class="small muted">지금은 대회 서버에 연결할 수 없습니다.</p>':'';
  return `<div class="cuphof">${note}${R.length?R.slice().reverse().map(cupHofCup).join(''):HOF.st==='loading'?'':'<p class="small muted">아직 끝난 대회가 없습니다.</p>'}</div>`; }
function cupHofCard(){ return `<section class="card"><details class="mfold"><summary>프런트컵 명예의 전당</summary><p class="small muted">유저 대회 프런트컵의 역대 우승·준우승 팀과 로스터입니다. 참가하지 않았어도 볼 수 있습니다.</p>${cupHofBody()}</details></section>`; }
