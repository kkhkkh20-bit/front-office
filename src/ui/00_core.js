'use strict';
function wOf(h,p){ return warPub(h,p); }
const SAVE='danjang-v4';
const UI={open:{},mail:null,mf:'all',talkMsg:null,tab:'home',sheet:null,posSheet:null,game:null,seg:'bat',lseg:'stand',lf:{team:'all',kind:'bat',sort:'war'},trade:{tid:null,give:[],get:[],msg:'',seg:'bat',side:'get',sort:'cur'},leagueTeam:null,confirmNew:false,offer:null,ext:null,fmsg:'',confirmRel:null};
/* 저장: 슬롯 10개, lz-string 압축. 브라우저 저장 공간(보통 5MB 안팎)을 넘으면 저장 오류를 띄우고 파일 내보내기를 권한다 */
const SLOTS=10, META='danjang-meta'; const SLOT_IDS=Array.from({length:SLOTS},(_,i)=>i+1);
function meta(){ try{ const m=JSON.parse(localStorage.getItem(META)||'null'); if(m)return m; }catch(e){} return {active:1,slots:{}}; }
function setMeta(m){ try{localStorage.setItem(META,JSON.stringify(m));}catch(e){} }
const slotKey=n=>`${SAVE}-s${n}`;
function packG(){ for(const p of Object.values(G.players)){ if(p.team==null){ delete p.l10; delete p.use; } } return LZString.compressToUTF16(JSON.stringify(G)); }
function unpack(s){ if(!s)return null; try{ const txt=s[0]==='{'?s:LZString.decompressFromUTF16(s); const g=JSON.parse(txt); return g&&g.ver===4?g:null; }catch(e){ return null; } }
let SAVE_ERR='';
/* 저장은 몰아서 한다: 저장 한 번에 압축(LZ)이 수백 ms 걸리고 시즌이 쌓일수록 길어져, 하루 진행·버튼마다 바로 저장하면 게임이 굼떠졌다.
   save()는 0.7초 안에 들어온 요청을 한 번으로 묶고, 슬롯 바꾸기·내보내기·처음 화면 같은 곳은 saveNow()로 바로 저장한다.
   탭을 닫거나 숨기면(pagehide·visibilitychange) 남은 저장을 바로 끝낸다 */
let _svT=null;
function save(){ if(G){ G.stops=G.stops||[]; tutTick(); } if(!G)return; if(_svT)clearTimeout(_svT); _svT=setTimeout(()=>{ _svT=null; saveStore(); },700); }
function saveNow(){ if(G){ G.stops=G.stops||[]; tutTick(); } if(_svT){ clearTimeout(_svT); _svT=null; } saveStore(); }
function saveFlush(){ if(_svT){ clearTimeout(_svT); _svT=null; saveStore(); } }
try{ window.addEventListener('pagehide',saveFlush); document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='hidden')saveFlush(); }); window.addEventListener('beforeunload',saveFlush); }catch(e){}
function saveStore(){ if(!G)return; const m=meta(); const n=m.active||1;
  try{ localStorage.setItem(slotKey(n),packG()); m.slots[n]={tid:G.user,name:tname(G.user),date:dstr(G.day),y:G.year,at:Date.now(),over:!!G.gameOver}; setMeta(m); SAVE_ERR=''; }catch(e){ SAVE_ERR='저장 공간이 부족해 저장하지 못했습니다. 다른 슬롯을 지우거나 내보내기로 백업하세요.'; } }
function load(){ const m=meta();
  try{ const old=localStorage.getItem(SAVE); if(old&&!Object.keys(m.slots).length){ const g=unpack(old); if(g){ localStorage.setItem(slotKey(1),LZString.compressToUTF16(old)); m.active=1; m.slots[1]={tid:g.user,name:'',date:'',y:g.year,at:Date.now()}; setMeta(m); localStorage.removeItem(SAVE); return g; } } }catch(e){}
  try{ return unpack(localStorage.getItem(slotKey(m.active||1))); }catch(e){ return null; } }
function slotSize(n){ try{ const s=localStorage.getItem(slotKey(n)); return s?Math.round(s.length*2/1024):0; }catch(e){ return 0; } }
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const $=s=>document.querySelector(s);
const hand=p=>p.isP?`${p.th}투`:`${p.th}투${p.bt}타`;
const recStr=r=>`${r.w}승 ${r.l}패${r.t?` ${r.t}무`:''}`;
function liveHidden(){ if(!G||!G.live)return false; const g=G.games[G.live.i]; return g&&G.live.upto<g.line.a.length+g.line.h.length; }
function myRec(){ const r=Object.assign({},G.sea.rec[G.user]); if(liveHidden()){ const g=G.games[G.live.i]; if(!/차전/.test(g.kind||'')){ if(g.res==='승')r.w--; else if(g.res==='패')r.l--; else r.t--; } } return r; }
function myRank(){ return liveHidden()?'-':standingsNow().findIndex(x=>x.tid===G.user)+1; }
const ICO={cal:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',mail:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/><rect x="2" y="4" width="20" height="16" rx="2"/></svg>',brief:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12h.01"/><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M22 13a18.15 18.15 0 0 1-20 0"/><rect width="20" height="14" x="2" y="6" rx="2"/></svg>',users:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/></svg>',trophy:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14.66V17a1 1 0 0 1-1 1 2 2 0 0 0-2 2v2"/><path d="M14 14.66V17a1 1 0 0 0 1 1 2 2 0 0 1 2 2v2"/><path d="M17.916 10H19.5A2.5 2.5 0 0 0 22 7.5V5a1 1 0 0 0-1-1h-3"/><path d="M4 22h16"/><path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z"/><path d="M6.084 10H4.5A2.5 2.5 0 0 1 2 7.5V5a1 1 0 0 1 1-1h3"/></svg>',wallet:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>',ff:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 17 5-5-5-5"/><path d="m13 17 5-5-5-5"/></svg>'};
const wide=()=>typeof matchMedia!=='undefined'&&matchMedia('(min-width:980px)').matches;
function rcol(v){ return v>=75?'var(--r75)':v>=65?'var(--r65)':v>=55?'var(--r55)':v>=50?'var(--r50)':v>=45?'var(--r45)':v>=35?'var(--r35)':'var(--r20)'; }
/* 글 속 선수·구단 이름을 누를 수 있게 */
let _lk={k:null};
function linkMap(){ const n=Object.keys(G.players).length; const k=G.year+':'+G.day+':'+n+':'+G.user; if(_lk.k===k)return _lk;
  const names={}; const sc=p=>(p.team===G.user?3:p.team!=null?2:p.foreign?1:0);
  for(const p of Object.values(G.players)){ if(!p.name||p.name.length<2||p.prospect&&!(G.draft&&!G.draft.done))continue; const c=names[p.name]; if(c==null||sc(p)>sc(G.players[c]))names[p.name]=p.id; }
  const teams={}; for(const t of G.teams){ teams[t.city+' '+t.nick]=t.id; teams[t.nick]=t.id; }
  const ppl={}; const addP=(n,a,v)=>{ if(n&&n.length>=2&&names[n]==null&&!ppl[n])ppl[n]={a,v}; };
  try{ const B=bossOf(G.user); addP(B.own.name,'person','own'); addP(B.ceo.name,'person','ceo'); }catch(e){}
  for(const t of G.teams){ const m=G.mgr[t.id]; if(m&&m.name)addP(m.name,t.id===G.user?'person':'lteam',t.id===G.user?'mgr':t.id);
    if(t.id!==G.user&&t.gm&&!t.gm.interim)addP(t.gm.name,'person','gm:'+t.id);
    const C=G.coach&&G.coach[t.id]; if(C)for(const r of CKEYS)if(C[r])addP(C[r].name,t.id===G.user?'person':'lteam',t.id===G.user?'c:'+r:t.id); }
  const er=x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); const tk=Object.keys(teams).sort((a,b)=>b.length-a.length).map(er); const pk=[...Object.keys(names),...Object.keys(ppl)].sort((a,b)=>b.length-a.length).map(er);
  const src=`(${tk.join('|')})|(?<![가-힣A-Za-z])(${pk.join('|')})`; _lk={k,names,teams,ppl,re:new RegExp(src,'g'),re1:new RegExp(src)}; return _lk; }
function linkify(h){ if(!G||!h)return h; const L=linkMap(); return h.replace(L.re,(m,t,pn)=>{ if(t)return `<a class="tl" data-a="lteam" data-v="${L.teams[t]}">${t}</a>`; if(L.names[pn]!=null)return `<a class="pl" data-a="player" data-v="${L.names[pn]}">${pn}</a>`; const q=L.ppl[pn]; return q?`<a class="ml" data-a="${q.a}" data-v="${q.v}">${pn}</a>`:pn; }); }
/* 조사 자동 맞춤: 화면에 "을(를)·이(가)·은(는)·와(과)·(으)로·(이)라"가 남으면 앞 글자 받침을 보고 고른다 */
const JOSA_RE=/을\(를\)|이\(가\)|은\(는\)|와\(과\)|\(으\)로|\(이\)라/g;
function josaTail(s){ for(let i=s.length-1;i>=0;i--){ const c=s[i]; if(c===')'){ let d=1; for(i--;i>=0;i--){ if(s[i]===')')d++; else if(s[i]==='('&&--d===0)break; } continue; } if(/["'”’」』\]\s.·]/.test(c))continue; return c; } return ''; }
function josaPick(prev,j){ const c=josaTail(prev); let jong=-1; if(/[가-힣]/.test(c))jong=(c.charCodeAt(0)-0xAC00)%28; else if(/[0-9]/.test(c))jong=[1,1,0,1,0,0,1,1,1,0][+c]?8:0; else if(/[A-Za-z]/.test(c))jong=/[lmnr]/i.test(c)?4:0; else return null;
  const has=jong>0; switch(j){ case '을(를)':return has?'을':'를'; case '이(가)':return has?'이':'가'; case '은(는)':return has?'은':'는'; case '와(과)':return has?'과':'와'; case '(으)로':return has&&jong!==8?'으로':'로'; case '(이)라':return has?'이라':'라'; } return null; }
function josaFix(root){ if(!root)return; const W=document.createTreeWalker(root,NodeFilter.SHOW_TEXT); let prev=''; let n;
  while((n=W.nextNode())){ const v=n.nodeValue; if(v&&JOSA_RE.test(v)){ JOSA_RE.lastIndex=0; let out='', last=0, m; while((m=JOSA_RE.exec(v))){ const before=prev+v.slice(0,m.index); const r=josaPick(before.slice(-40),m[0]); out+=v.slice(last,m.index)+(r??m[0]); last=m.index+m[0].length; } out+=v.slice(last); n.nodeValue=out; }
    if(v&&v.trim())prev=(prev+n.nodeValue).slice(-60); } }
/* 화면을 그린 뒤, 누를 수 없는 글자 속 이름을 찾아 링크로 바꾼다 */
const NOLINK='a,button,[data-a],select,option,textarea,input,svg,script,style,.nolink,.kbar,.seg,.chips,.bnav,.sbar,.cast,label';
function autoLink(root){ try{ josaFix(root); }catch(e){} if(!G||!root||UI.cast)return; const L=linkMap(); const W=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>{ const v=n.nodeValue; if(!v||v.length<2||!/[가-힣A-Za-z]/.test(v))return NodeFilter.FILTER_REJECT; const pe=n.parentElement; if(!pe||pe.closest(NOLINK))return NodeFilter.FILTER_REJECT; return L.re1.test(v)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT; }});
  const list=[]; let n; while((n=W.nextNode()))list.push(n); for(const t of list){ const sp=document.createElement('span'); sp.innerHTML=linkify(esc(t.nodeValue)); const f=document.createDocumentFragment(); while(sp.firstChild)f.appendChild(sp.firstChild); t.parentNode.replaceChild(f,t); } }
const lk=t=>linkify(esc(t));
/* 창단 드래프트 등급: 숫자 대신 색 구간만. 우리 스카우트 추정이라 틀릴 수 있다 */
const GRD=v=>v>=75?'S':v>=65?'A':v>=55?'B':v>=50?'C':v>=45?'D':v>=35?'E':'F';
function fdGrade(p){ if(!G.fd||!p)return null; const S=fdSeenBy(G.user,p); return {g:GRD(S.o),c:rcol(S.o),up:p.age<=26&&S.pot-S.o>=6,o:S.o}; }
const gchip=x=>x?`<b class="gch" style="--c:${x.c}" title="스카우트 추정 등급">${x.g}${x.up?'<i>↑</i>':''}</b>`:'';
const rchip=v=>v==null?'<b class="rc q" title="알 수 없음">-</b>':`<b class="rc" style="--c:${rcol(v)}">${dv(v)}</b>`;
/* 구단 엠블럼: 구단 상징을 직접 그린 오리지널 SVG */
const EMB={
  코메츠:'<circle cx="15.2" cy="8" r="2.7" fill="#fff"/><path d="M13.3 6.4 4.8 14.6l1.6 1.4 8.3-7.4Z" fill="#fff" opacity=".9"/><path d="M14.6 9.8 7.6 16.4l.9.9 7.4-6.3Z" fill="#fff" opacity=".55"/><path d="M12.2 5.6 6.4 10.2l.6.8 6.2-4.1Z" fill="#fff" opacity=".45"/>',
  하운즈:'<path d="M7.2 16.2V11L9 8l.6-3.4 2 2.6 2.6.3 3 2.4.2 1.8-2.8.6-1.7 2.2v2.7Z" fill="#fff"/><circle cx="12.6" cy="8.9" r=".7" fill="C3"/><path d="M9.6 4.6 8.6 9.2 10.6 7.4Z" fill="C3" opacity=".55"/>',
  시걸스:'<path d="M4.4 10.6Q8 6.4 12 10.2 16 6.4 19.6 10.6 16 9 12 12.6 8 9 4.4 10.6Z" fill="#fff"/><path d="M6 14.6Q9 13.2 12 15.2 15 13.2 18 14.6" fill="none" stroke="#fff" stroke-width="1.1" opacity=".6" stroke-linecap="round"/>',
  스파크스:'<path d="M12 3.8 13.5 9.4 19 11 13.5 12.6 12 18.2 10.5 12.6 5 11 10.5 9.4Z" fill="#fff"/><path d="M17.2 4.8 17.8 6.6 19.6 7.2 17.8 7.8 17.2 9.6 16.6 7.8 14.8 7.2 16.6 6.6Z" fill="#fff" opacity=".7"/>',
  스톰:'<path d="M7.4 11.6a3 3 0 0 1 1-5.8 3.7 3.7 0 0 1 7 1.1 2.4 2.4 0 0 1 .9 4.7Z" fill="#fff"/><path d="M12.4 11.6 10.2 15.4h2l-1.2 3 3.6-4.6h-2.1l1.3-2.2Z" fill="#ffe27a"/>',
  레드폭스:'<path d="M5.8 5.4 9.6 8.8h4.8l3.8-3.4-.9 6L12 16.8l-5.3-5.4Z" fill="#fff"/><path d="M8.2 11.6 12 15.2l3.8-3.6-1.8.2L12 13.4l-2-1.6Z" fill="C3" opacity=".55"/><circle cx="10" cy="10.8" r=".75" fill="C3"/><circle cx="14" cy="10.8" r=".75" fill="C3"/>',
  블레이즈:'<path d="M12 3.6c2.6 3.4 5.2 5.2 4.6 9.1-.4 3-2.5 4.6-4.6 4.6-2.5 0-4.6-1.9-4.6-4.5 0-2.3 1.4-3.5 2-4.9.8 1.6 1.4 2.2 2 2.4-.4-2.4-.2-4.5.6-6.7Z" fill="#fff"/><path d="M12 10.4c1 1.4 2 2.3 1.8 3.8-.2 1.2-1 1.9-1.8 1.9-1 0-1.9-.8-1.9-1.8 0-1 .7-1.6 1-2.3.4.6.6.8.8.9-.1-.9 0-1.6.1-2.5Z" fill="C1"/>',
  썬더스:'<path d="M13.8 3.6 7.4 12.2h3.9l-1.5 6.4 7-9h-4Z" fill="#fff"/>',
  웨이브스:'<path d="M5 16.4C5 10.6 10 6.6 14.8 7.4c-2.6 1-3.6 3-2.2 4.6 1.6 1.6 4 .6 6-.8-.6 3.6-3.2 5.2-6.6 5.2Z" fill="#fff"/><path d="M5.2 18.2q1.7-1.2 3.4 0t3.4 0 3.4 0 3.4 0" fill="none" stroke="#fff" stroke-width="1" opacity=".6" stroke-linecap="round"/>',
  앵커스:'<circle cx="12" cy="5.6" r="1.5" fill="none" stroke="#fff" stroke-width="1.2"/><path d="M12 7.1v9.4M9.2 9.4h5.6" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/><path d="M6.4 12.2c.4 2.8 2.8 4.6 5.6 4.6s5.2-1.8 5.6-4.6" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/><path d="M5.2 13.4 6.4 11.4l1.6 1.6ZM18.8 13.4l-1.2-2-1.6 1.6Z" fill="#fff"/>'
};
function badge(tid,sz){ const t=(G&&G.teams[tid])||TEAM_DEF[tid]; if(!t)return ''; const P=tpal(t); const c1=P[0],c2=P[1]==='#ffffff'?'#e8ecf2':P[1],c3=P[2];
  const g=EMB[(TEAM_DEF[t.id]||t).nick]||EMB[t.nick]; const big=sz>=34; /* 구단 이름을 바꿔도 엠블럼은 원래 구단 것 */
  const inner=g?g.replace(/C1/g,c1).replace(/C3/g,c3):`<text x="12" y="14.4" text-anchor="middle" font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="700" font-size="8.2" fill="#fff">${t.code}</text>`;
  return `<svg class="badge" width="${sz}" height="${sz}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.2 21.4 4.4V11c0 5.8-4 9.9-9.4 11.8C6.6 20.9 2.6 16.8 2.6 11V4.4Z" fill="${c3}"/><path d="M12 2.4 20.2 5.2V11c0 5-3.4 8.6-8.2 10.4C7.2 19.6 3.8 16 3.8 11V5.2Z" fill="${c1}" stroke="${c2}" stroke-width=".7"/>${big?`<path d="M3.8 15.2h16.4" stroke="${c2}" stroke-width=".35" opacity=".5"/>`:''}<g transform="translate(12 11.2) scale(${big?.86:.92}) translate(-12 -11)">${inner}</g>${big?`<text x="12" y="19.4" text-anchor="middle" font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="700" font-size="2.6" letter-spacing=".25" fill="#fff" opacity=".85">${t.code}</text>`:''}</svg>`; }
const tb=(tid,label)=>`<span class="tname">${badge(tid,18)}${label??tname(tid)}</span>`;
/* 구단 고유색: 주색(헤더·강조), 밝은색(버튼·포인트), 어두운색(배경) */
const TCOL=new Proxy({},{get:(o,code)=>{ const p=TPAL[code]; return p?[p[0],p[3],p[2]]:undefined; }});
function setTeamVars(t){ const r=document.documentElement.style; const c=t&&TCOL[t.code]; const h=t?t.hue:212;
  r.setProperty('--team',c?c[0]:hslHex(h,52,34)); r.setProperty('--team-hi',c?c[1]:hslHex(h,60,50)); r.setProperty('--team-dk',c?c[2]:hslHex(h,42,16)); }
const TITLE={cal:'캘린더',home:'홈',inbox:'소식함',roster:'선수단',trade:'트레이드',transfer:'영입·계약',scout:'스카우팅',train:'훈련',staff:'스태프·육성',cfg:'설정 · 권한',me:'단장 프로필',league:'리그',club:'구단·재정'};
function metaChips(){ const t=team(G.user); const per=period(); const ci=capInfo(G.user); const r=myRec(); const c=[];
  if(per==='season'||per==='post')c.push(`<span class="chipn"><b>${r.w}-${r.l}${r.t?'-'+r.t:''}</b> · ${myRank()}위</span>`);
  if(!G.unemp){ const b=budget(); const R=G.roomSeen; if(!R||R.y!==G.year){ G.roomSeen={y:G.year,v:b.roomGoal,d:G.day,dv:0}; } else if(R.d!==G.day){ const dv=b.roomGoal-R.v; G.roomSeen={y:G.year,v:b.roomGoal,d:G.day,dv:Math.abs(dv)>=5000?dv:0}; } const dv=G.roomSeen.dv||0;
    c.push(`<button class="chipn lk" data-a="go" data-v="club:fin" title="예산 여유 = 올해 예상 수입 + 모기업 지원 목표 - 올해 예상 지출. 관중·성적 전망, 새 계약, 외국인 배정 예산(개막 때 쓰지 않은 만큼 풀림)에 따라 바뀝니다. 누르면 재정 화면.">예산 여유 <b style="color:${b.roomGoal>=0?'var(--good)':'var(--bad)'}">${b.roomGoal>=0?money(b.roomGoal):'-'+money(-b.roomGoal)}</b>${dv?`<em class="small" style="font-style:normal;color:${dv>0?'var(--good)':'var(--bad)'}"> ${dv>0?'▲':'▼'}${money(Math.abs(dv))}</em>`:''}</button>`); } void ci;
  return c.join(''); }
function blkLink(b){ if(b.includes('창단'))return '<button data-a="tab" data-v="home">드래프트로</button>'; if(G.draft&&!G.draft.done)return '<button data-a="goWork" data-v="신인드래프트">드래프트로</button>'; if(b.includes('감독'))return '<button data-a="goWork" data-v="감독">감독 후보</button>'; if(G.live)return '<button data-a="tab" data-v="home">경기 보기</button>'; if(b.includes('로스터'))return '<button data-a="tab" data-v="roster">선수단</button>'; if(b.includes('보상'))return '<button data-a="go" data-v="transfer:fa">FA 보상 처리</button>'; return ''; }

