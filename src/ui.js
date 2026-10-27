'use strict';
function wOf(h,p){ return warPub(h,p); }
const SAVE='danjang-v4';
const UI={open:{},mail:null,mf:'all',talkMsg:null,tab:'home',sheet:null,posSheet:null,game:null,seg:'bat',lseg:'stand',lf:{team:'all',kind:'bat',sort:'war'},trade:{tid:null,give:[],get:[],msg:'',seg:'bat',side:'get',sort:'cur'},leagueTeam:null,confirmNew:false,offer:null,ext:null,fmsg:'',confirmRel:null};
/* 저장: 슬롯 3개, lz-string 압축 */
const SLOTS=3, META='danjang-meta';
function meta(){ try{ const m=JSON.parse(localStorage.getItem(META)||'null'); if(m)return m; }catch(e){} return {active:1,slots:{}}; }
function setMeta(m){ try{localStorage.setItem(META,JSON.stringify(m));}catch(e){} }
const slotKey=n=>`${SAVE}-s${n}`;
function packG(){ for(const p of Object.values(G.players)){ if(p.team==null){ delete p.l10; delete p.use; } } return LZString.compressToUTF16(JSON.stringify(G)); }
function unpack(s){ if(!s)return null; try{ const txt=s[0]==='{'?s:LZString.decompressFromUTF16(s); const g=JSON.parse(txt); return g&&g.ver===4?g:null; }catch(e){ return null; } }
let SAVE_ERR='';
function save(){ if(G){ G.stops=G.stops||[]; tutTick(); } if(!G)return; const m=meta(); const n=m.active||1;
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
const ICO={mail:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/><rect x="2" y="4" width="20" height="16" rx="2"/></svg>',brief:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12h.01"/><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M22 13a18.15 18.15 0 0 1-20 0"/><rect width="20" height="14" x="2" y="6" rx="2"/></svg>',users:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/></svg>',trophy:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14.66V17a1 1 0 0 1-1 1 2 2 0 0 0-2 2v2"/><path d="M14 14.66V17a1 1 0 0 0 1 1 2 2 0 0 1 2 2v2"/><path d="M17.916 10H19.5A2.5 2.5 0 0 0 22 7.5V5a1 1 0 0 0-1-1h-3"/><path d="M4 22h16"/><path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z"/><path d="M6.084 10H4.5A2.5 2.5 0 0 1 2 7.5V5a1 1 0 0 1 1-1h3"/></svg>',wallet:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>',ff:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 17 5-5-5-5"/><path d="m13 17 5-5-5-5"/></svg>'};
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
const rchip=v=>v==null?'<b class="rc q" title="알 수 없음">-</b>':`<b class="rc" style="--c:${rcol(v)}">${v}</b>`;
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
  const g=EMB[t.nick]; const big=sz>=34;
  const inner=g?g.replace(/C1/g,c1).replace(/C3/g,c3):`<text x="12" y="14.4" text-anchor="middle" font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="700" font-size="8.2" fill="#fff">${t.code}</text>`;
  return `<svg class="badge" width="${sz}" height="${sz}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.2 21.4 4.4V11c0 5.8-4 9.9-9.4 11.8C6.6 20.9 2.6 16.8 2.6 11V4.4Z" fill="${c3}"/><path d="M12 2.4 20.2 5.2V11c0 5-3.4 8.6-8.2 10.4C7.2 19.6 3.8 16 3.8 11V5.2Z" fill="${c1}" stroke="${c2}" stroke-width=".7"/>${big?`<path d="M3.8 15.2h16.4" stroke="${c2}" stroke-width=".35" opacity=".5"/>`:''}<g transform="translate(12 11.2) scale(${big?.86:.92}) translate(-12 -11)">${inner}</g>${big?`<text x="12" y="19.4" text-anchor="middle" font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="700" font-size="2.6" letter-spacing=".25" fill="#fff" opacity=".85">${t.code}</text>`:''}</svg>`; }
const tb=(tid,label)=>`<span class="tname">${badge(tid,18)}${label??tname(tid)}</span>`;
/* 구단 고유색: 주색(헤더·강조), 밝은색(버튼·포인트), 어두운색(배경) */
const TCOL=new Proxy({},{get:(o,code)=>{ const p=TPAL[code]; return p?[p[0],p[3],p[2]]:undefined; }});
function setTeamVars(t){ const r=document.documentElement.style; const c=t&&TCOL[t.code]; const h=t?t.hue:212;
  r.setProperty('--team',c?c[0]:hslHex(h,52,34)); r.setProperty('--team-hi',c?c[1]:hslHex(h,60,50)); r.setProperty('--team-dk',c?c[2]:hslHex(h,42,16)); }
const TITLE={home:'홈',inbox:'소식함',roster:'선수단',trade:'트레이드',transfer:'영입·계약',scout:'스카우팅',staff:'스태프·육성',league:'리그',club:'구단·재정'};
function metaChips(){ const t=team(G.user); const per=period(); const ci=capInfo(G.user); const r=myRec(); const c=[];
  if(per==='season'||per==='post')c.push(`<span class="chipn"><b>${r.w}-${r.l}${r.t?'-'+r.t:''}</b> · ${myRank()}위</span>`);
  if(!G.unemp){ const b=budget(); const R=G.roomSeen; if(!R||R.y!==G.year){ G.roomSeen={y:G.year,v:b.roomGoal,d:G.day,dv:0}; } else if(R.d!==G.day){ const dv=b.roomGoal-R.v; G.roomSeen={y:G.year,v:b.roomGoal,d:G.day,dv:Math.abs(dv)>=5000?dv:0}; } const dv=G.roomSeen.dv||0;
    c.push(`<button class="chipn lk" data-a="go" data-v="club:fin" title="예산 여유 = 올해 예상 수입 + 모기업 지원 목표 - 올해 예상 지출. 관중·성적 전망, 새 계약, 외국인 배정 예산(개막 때 쓰지 않은 만큼 풀림)에 따라 바뀝니다. 누르면 재정 화면.">예산 여유 <b style="color:${b.roomGoal>=0?'var(--good)':'var(--bad)'}">${b.roomGoal>=0?money(b.roomGoal):'-'+money(-b.roomGoal)}</b>${dv?`<em class="small" style="font-style:normal;color:${dv>0?'var(--good)':'var(--bad)'}"> ${dv>0?'▲':'▼'}${money(Math.abs(dv))}</em>`:''}</button>`); } void ci;
  return c.join(''); }
function blkLink(b){ if(b.includes('창단'))return '<button data-a="tab" data-v="home">드래프트로</button>'; if(G.draft&&!G.draft.done)return '<button data-a="goWork" data-v="신인드래프트">드래프트로</button>'; if(b.includes('감독'))return '<button data-a="goWork" data-v="감독">감독 후보</button>'; if(G.live)return '<button data-a="tab" data-v="home">경기 보기</button>'; if(b.includes('로스터'))return '<button data-a="tab" data-v="roster">선수단</button>'; if(b.includes('보상'))return '<button data-a="go" data-v="transfer:fa">FA 보상 처리</button>'; return ''; }
const det=(title,body,open,extra,key)=>{ const k=key||title.replace(/\s/g,''); const o=UI.open[k]??open; return `<details class="card" data-k="${k}" ${o?'open':''}><summary class="sumh"><span class="sec">${title}</span>${extra||''}</summary>${body}</details>`; };

/* ---------- 화면 조립 ---------- */
function render(){
  const app=$('#app');
  if(!G||UI.title){ setTeamVars(null); app.innerHTML=startScreen(); renderSheet(); return; }
  try{ annCheck(); }catch(e){}
  setTimeout(()=>{ try{ document.querySelectorAll('.chips').forEach(el=>el.classList.toggle('ovf',el.scrollWidth>el.clientWidth+2)); }catch(e){} },0);
  if(UI.tab==='roster'){ G.tutFlags=G.tutFlags||{}; G.tutFlags.roster=true; } if(G.tut&&!G.tut.done){ try{ tutTick(); }catch(e){} }
  const t=team(G.user); setTeamVars(t);
  const per=period(); const unread=G.mail.filter(mailNeeds).length; const b=blockNow();
  /* 창단 드래프트 동안은 드래프트만: 날짜 진행·메뉴·예산 표시를 숨긴다 */
  if(((G.fd&&!G.fd.done)||G.fdWait)&&UI.tab!=='inbox'){ const F=G.fd; const pk=F&&F.picks[F.cur];
    const KS=['.fdt-w','#sheet .sheet']; const keep=KS.map(q=>{ const e=document.querySelector(q); return e?[e.scrollTop,e.scrollLeft]:null; });
    app.innerHTML=`<div class="dshell"><header class="dtop"><div class="gut"><div class="wrap dtbar">${badge(G.user,30)}<div class="dti"><b>${esc(t.city)} ${esc(t.nick)}</b><span>창단 드래프트${F?(F.open===false?' · 탐색 시간':pk?` · ${pk.rd}/${FD_ROUNDS}라운드`:''):' · 준비'}</span></div>
      <button class="mailbtn" data-a="inbox" aria-label="소식함">${ICO.mail}${unread?`<i>${unread>99?'99+':unread}</i>`:''}</button><button class="btn small" data-a="toTitle">처음 화면</button></div>${F&&!G.fdWait?`<div class="wrap">${fdTicker()}</div>`:''}</div></header>
      <div class="gut"><div class="wrap"><main class="content dcontent">${G.fdWait?fdWaitView():fdView()}</main></div></div></div>`;
    document.body.classList.toggle('help',helpOn()); markHints(app); renderSheet(); KS.forEach((q,i)=>{ const e=document.querySelector(q); if(e&&keep[i]){ e.scrollTop=keep[i][0]; e.scrollLeft=keep[i][1]; } }); return; }
  const nav=NAV; const ic=i=>ICO[i]||ICO2[i]; const inMenu=!BNAV.includes(UI.tab); const menuAlert=NAV.some(([k])=>!BNAV.includes(k)&&tabAlert(k));
  app.innerHTML=`<div class="shell">
  <aside class="rail" aria-label="메뉴"><div class="brand">${badge(G.user,38)}<b>${esc(t.city)}<br>${esc(t.nick)}</b></div>${nav.map(([k,l,i])=>`<button data-a="tab" data-v="${k}" class="${UI.tab===k?'on':''}">${ic(i)}${l}${k==='inbox'&&unread?`<span class="cnt">${unread}</span>`:tabAlert(k)?'<i class="sdot"></i>':''}</button>`).join('')}<button class="railset" data-a="go" data-v="club:set">${ICO2.cog}새 게임 · 설정</button></aside>
  <div class="mainc">
   <header class="top"><div class="gut"><div class="tbar wrap">
     <div class="club${G.unemp?'':' clubbtn'}" ${G.unemp?'':'data-a="myRos" role="button" tabindex="0" title="우리 팀 현황"'}>${G.unemp?'<span class="tdi">야</span>':badge(G.user,30)}<div><b>${G.unemp?`야인 · 명성 ${G.rep}`:`${esc(t.city)} ${esc(t.nick)}<i class="cb-v">▾</i>`}</b><span>${wide()?dstr(G.day):`${dobj(G.day).y}.${dsh(G.day)} ${WD[dobj(G.day).w]}`} · ${PERIOD[per]}</span></div></div>
     ${`<button class="mailbtn" data-a="inbox" aria-label="소식함${unread?` 안 읽음 ${unread}`:''}">${ICO.mail}${unread?`<i>${unread>99?'99+':unread}</i>`:''}</button>`}<div class="goset">${G.unemp?`<button class="continue" data-a="adv" data-v="event" ${b?'disabled':''}><span class="cl"><b>계속</b><i>제의가 오거나 2주가 지날 때까지</i></span>${ICO.ff}</button>`:per==='season'?`<button class="step" data-a="adv" data-v="next" ${b?'disabled':''} aria-label="한 경기 진행">1경기</button><button class="continue" data-a="adv" data-v="event" ${b?'disabled':''}><span class="cl"><b>계속</b><i>${esc(b?nextLabel():'다음 소식까지 · 최대 한 주')}</i></span>${ICO.ff}</button>`:`<button class="step" data-a="adv" data-v="day" ${b?'disabled':''} aria-label="하루 진행">하루</button><button class="continue" data-a="adv" data-v="next" ${b?'disabled':''}><span class="cl"><b>${per==='post'?'다음 경기':'계속'}</b><i>${esc(nextLabel())}</i></span>${ICO.ff}</button>`}</div>
   </div></div>${wide()&&UI.tab!=='home'?`<div class="gut sbwrap"><div class="wrap">${stripBar()}</div></div>`:''}${b?`<div class="blk gut"><div class="wrap">${esc(b)}${blkLink(b)}</div></div>`:''}</header>
   <div class="gut"><div class="wrap">
     <div class="subhead"><h1>${TITLE[UI.tab]}</h1><div class="meta">${metaChips()}<button class="helpbtn${helpOn()?' on':''}" data-a="help" aria-label="설명 ${helpOn()?'숨기기':'보기'}" title="설명 ${helpOn()?'숨기기':'보기'}">?</button></div></div>
     <main class="content">${tabBody()}</main>
   </div></div>
  </div>
  <nav class="bnav" aria-label="메뉴"><div class="in">${nav.filter(([k])=>BNAV.includes(k)).map(([k,l,i])=>`<button data-a="tab" data-v="${k}" class="${UI.tab===k?'on':''}">${ic(i)}<span>${l}</span>${(k==='inbox'&&unread)||(k!=='inbox'&&tabAlert(k))?'<span class="dot"></span>':''}</button>`).join('')}<button data-a="menu" class="${inMenu?'on':''}">${ICO2.menu}<span>${inMenu?esc(TITLE[UI.tab].split('·')[0]):'메뉴'}</span>${menuAlert?'<span class="dot"></span>':''}</button></div></nav>
  </div>`;
  document.body.classList.toggle('help',helpOn()); markHints(app);
  renderSheet(); try{ autoLink($('#app')); }catch(e){}
  if(UI.tab==='inbox')inboxWire();
  /* 도장(거래 성사·지명)은 4초 뒤 저절로 닫혀 아래 버튼을 가리지 않는다 */
  if(UI.stamp&&!UI.stamp._t){ const st=UI.stamp; st._t=setTimeout(()=>{ if(UI.stamp===st){ UI.stamp=null; render(); } },4000); }
}
function tabBody(){
  if(G.gameOver&&(UI.tab==='inbox'||UI.tab==='home'))return gameOverView();
  if(UI.tab==='roster')G.tutFlags.roster=true;
  if(!TITLE[UI.tab])UI.tab='home';
  if(G.unemp&&!['home','inbox','league'].includes(UI.tab))return csec('야인입니다',`<p>지금은 맡은 구단이 없습니다. 리그 탭에서 판도를 보고, 제의가 오면 홈에서 답하세요.</p><button class="btn primary" data-a="tab" data-v="home">홈으로</button>`);
  return {home:homeView,inbox:inboxView,roster:rosterView,trade:tradeCenter,transfer:transferView,scout:scoutView,staff:staffView,league:leagueView,club:clubView}[UI.tab]();
}
function anySave(){ try{ const m=meta(); return [1,2,3].some(n=>m.slots&&m.slots[n]); }catch(e){ return false; } }
function slotsCard(start){ const m=meta(); const rows=[1,2,3].map(n=>{ const s=m.slots[n]; const cur=G&&m.active===n;
    return `<div class="slot ${cur?'on':''}"><div><b>슬롯 ${n}${cur?' · 진행 중':''}</b><div class="small muted">${s?`${esc(s.name||'')} · ${esc(s.date||s.y+'년')}${s.over?' · 경질됨':''} · ${slotSize(n)}KB`:'비어 있음'}</div></div>
      <div class="row">${s&&!cur?`<button class="btn small primary" data-a="slotLoad" data-v="${n}">이어하기</button>`:''}${start?`<button class="btn small" data-a="slotNew" data-v="${n}">${s?'덮어쓰고 새 게임':'새 게임'}</button>`:''}${s&&!cur?`<button class="btn small danger" data-a="slotDel" data-v="${n}">삭제</button>`:''}</div></div>`; }).join('');
  return `<section class="card"><h2 class="sec">저장 슬롯</h2><div class="slots">${rows}</div>${UI.slotMsg?`<div class="note">${esc(UI.slotMsg)}</div>`:''}</section>`; }
function exportCard(){ return `<section class="card"><h2 class="sec">내보내기 · 불러오기</h2>
  <p class="small muted">진행 상황은 이 브라우저에만 저장됩니다. 브라우저 데이터를 지우면 사라지니, 가끔 내보내 두세요. 다른 기기에서는 내보낸 코드를 붙여 넣어 이어 할 수 있습니다.</p>
  <div class="row"><button class="btn" data-a="expFile">파일로 내보내기</button><button class="btn" data-a="expCode">코드 만들기</button><label class="btn">파일 불러오기<input type="file" accept=".txt,.json" data-a="impFile" style="display:none"></label></div>
  ${UI.expCode?`<textarea class="code" readonly>${UI.expCode}</textarea><p class="small muted">이 코드를 복사해 보관하세요. 길이 ${Math.round(UI.expCode.length/1024)}KB.</p>`:''}
  <textarea class="code" id="impCode" placeholder="내보낸 코드를 여기에 붙여 넣으세요"></textarea>
  <button class="btn primary" data-a="impCode">코드로 불러오기 (현재 슬롯에 덮어씀)</button>
  ${UI.impMsg?`<div class="note">${esc(UI.impMsg)}</div>`:''}${SAVE_ERR?`<div class="note bad">${esc(SAVE_ERR)}</div>`:''}</section>`; }
function importText(t){ let g=null; try{ g=JSON.parse(t[0]==='{'?t:LZString.decompressFromBase64(t)); }catch(e){} if(!g||g.ver!==4){ UI.impMsg='코드를 읽지 못했습니다. 내보낸 코드 전체를 붙여 넣었는지 확인하세요.'; render(); return; } G=g; try{migrateDraft();}catch(e){} save(); UI.impMsg='불러왔습니다.'; UI.tab='home'; render(); }
function ensureWorld(){ if(UI.world||UI.worldBusy)return; UI.worldBusy=true; setTimeout(()=>{ const G0=G; try{ buildWorld(); UI.world=G;
    /* 구단마다 취임 첫날 예산을 미리 계산해 재정 압박 구단을 표시한다 */
    try{ const js=JSON.stringify(UI.world); for(const x of UI.world.preview){ G=JSON.parse(js); claimTeam(x.tid); x.room=Math.round(budget().roomGoal); try{ x.fin=fdFin(x.tid); x.ownN=bossOf(x.tid).own.name; }catch(e){} } }catch(e){ console.error(e); }
  }catch(e){ console.error(e); UI.worldErr=true; } finally{ G=G0; UI.worldBusy=false; render(); } },60); }
const SLK={C:'포수','1B':'1루','2B':'2루','3B':'3루',SS:'유격',LF:'좌익',CF:'중견',RF:'우익',DH:'지명',SP:'선발',RP:'불펜',P:'투수'};
const G0Y=()=>2026; const eok=v=>`${Math.round(v/100)}억`;
function pickTeams(){ if(UI.worldErr)return `<div class="list">${TEAM_DEF.map((d,i)=>`<button class="item wa" data-a="start" data-v="${i}">${badge(i,34)}<span class="nm"><b>${d.city} ${d.nick}</b></span><span class="rt small muted">선택</span></button>`).join('')}</div>`;
  if(!UI.world){ ensureWorld(); return `<div class="worldload"><span class="spin"></span><p>리그를 만드는 중입니다. 10개 구단 선수단을 만들고 지난 시즌 144경기를 치르고 있습니다.</p></div>`; }
  const P=[...UI.world.preview].sort((a,b)=>a.proj-b.proj); const OL={win:'성적 우선',profit:'수익 우선',pr:'홍보 우선'};
  const card=x=>{ const d=TEAM_DEF[x.tid]; const over=x.pay>x.cap; const mv=x.prev-x.proj; const tight=over||(x.room!=null&&x.room<0);
    return `<div class="tmk" role="button" tabindex="0" data-a="start" data-v="${x.tid}"><div class="tp-h">${badge(x.tid,38)}<div><b>${d.city} ${d.nick}</b><span>${d.indie?'독립구단':'모기업 구단'} · ${d.region} · 시장 ${Math.round(d.market*100)}</span></div>
      <div class="tp-r ${x.proj<=3?'hi':x.proj<=6?'mid':'lo'}"><i>예상</i><b>${x.proj}<em>위</em></b><span>${x.mode}</span></div></div>
      <div class="tp-g"><span><i>지난 시즌</i><b>${x.prev}위 · ${x.w}승 ${x.l}패</b>${mv?`<em class="${mv<0?'dn':'up'}">${mv>0?'▲':'▼'}${Math.abs(mv)}</em>`:''}</span><span><i>구단주</i><b>${OL[x.owner]}</b></span>
        <span><i>강점</i><b>${x.best.map(([k,r])=>`${SLK[k]} ${r}위`).join(' · ')}</b></span><span><i>약점</i><b class="wk">${x.worst.map(([k,r])=>`${SLK[k]} ${r}위`).join(' · ')}</b></span>
        <span><i>간판</i><b>${x.top.map(p=>`${esc(p.name)}(${p.pos} ${p.o})`).join(', ')}</b></span><span><i>연봉 총액</i><b class="${over?'wk':''}">${money(x.pay)} / 캡 ${money(x.cap)}${over?' 초과':''}</b></span><span><i>첫해 예산</i><b class="${tight?'wk':''}">${x.room==null?'-':x.room<0?`지원 한도 ${money(-x.room)} 초과`:`여유 ${money(x.room)}`}</b></span></div>
      <div class="tp-t">${tight?'<span class="pill bad">재정 압박 구단</span>':''}${[x.age<=27.8?'젊은 선수단':x.age>=28.8?'노장 위주':'', x.young?`24세 이하 1군급 ${x.young}명`:'', x.vets>=2?`33세 이상 주전급 ${x.vets}명`:'', x.faSoon?`FA 앞둔 주전 ${x.faSoon}명`:'', d.indie?'모기업 지원 없음':''].filter(Boolean).map(t=>`<span class="pill">${t}</span>`).join('')}</div></div>`; };
  if(UI.smode==='fd'){ const OLV={win:'성적 우선',profit:'수익 우선',pr:'홍보 우선'};
    const P2=[...UI.world.preview].sort((a,b)=>((b.fin||{}).avail||0)-((a.fin||{}).avail||0));
    const ORD=[...UI.world.preview].map(x=>({tid:x.tid,v:((x.fin||{}).avail||0)+hn('fdo'+G0Y(),x.tid)*30})).sort((a,b)=>a.v-b.v).map(x=>x.tid);
    const fcard=x=>{ const d=TEAM_DEF[x.tid]; const f=x.fin||{}; const ok=f.avail>=f.cap, mid=f.avail>=f.cap*.75; const age=G0Y()-(STAD_BUILT[x.tid]||2000);
      return `<div class="tmk" role="button" tabindex="0" data-a="start" data-v="${x.tid}"><div class="tp-h">${badge(x.tid,38)}<div><b>${d.city} ${d.nick}</b><span>${d.indie?'독립구단':'모기업 구단'} · ${d.region} · 시장 ${Math.round(d.market*100)}</span></div>
        <div class="tp-r ${ok?'hi':mid?'mid':'lo'}"><i>캡까지 쓰면</i><b style="font-size:18px">${(f.avail||0)>=(f.cap||0)?'+':'-'}${eok(Math.abs((f.avail||0)-(f.cap||0)))}</b><span>연봉 여력 ${eok(Math.max(0,f.avail||0))}</span></div></div>
        <div class="tp-g"><span><i>창단 지명 순서</i><b>1라운드 ${ORD.indexOf(x.tid)+1}번째</b></span><span><i>구단주</i><b>${esc(x.ownN||'')} 회장 · ${OLV[x.owner]}</b></span><span><i>예상 수입</i><b>${eok(f.I||0)}</b></span>
          <span><i>모기업 지원 한도</i><b class="${d.indie?'wk':''}">${d.indie?'없음':eok(f.sup||0)}</b></span><span><i>선수 연봉 외 지출</i><b>${eok(f.other||0)}</b></span>
          <span><i>보유 현금</i><b>${eok(f.cash||0)}</b></span><span><i>홈구장</i><b>${(STAD_NM&&STAD_NM[x.tid])?esc(STAD_NM[x.tid])+' · ':''}${(STAD_CAP[x.tid]||0).toLocaleString()}석 · ${age}년 된 구장</b></span></div>
        <div class="tp-t"><span class="pill ${ok?'good':mid?'':'bad'}">난이도 ${ok?'쉬움':mid?'보통':'어려움'}</span>${ok?'<span class="pill good">캡까지 써도 버팀</span>':mid?'<span class="pill">캡 75% 이상 가능</span>':'<span class="pill bad">재정 빠듯</span>'}${d.indie?'<span class="pill">모기업 지원 없음</span>':''}</div></div>`; };
    return `<p class="small muted">선수는 드래프트로 새로 뽑으므로 전력은 같은 출발선입니다. 차이는 돈과 시장입니다. 연봉 여력이 적은 구단일수록 먼저 지명하고, 라운드마다 순서가 뒤집힙니다. 연봉 여력은 예상 수입과 모기업 지원 한도에서 선수 연봉 외 지출을 뺀 값으로, 국내 선수 연봉에 쓸 수 있는 돈입니다. 큰 숫자는 샐러리캡(${eok((P2[0]&&P2[0].fin&&P2[0].fin.cap)||0)})까지 채웠을 때 남거나 모자라는 돈입니다. 연봉 여력은 모기업 지원을 한도까지 받는다고 가정한 최대치입니다. 창단 뒤 화면 위 <b>예산 여유</b>는 구단주가 정한 지원 목표 기준이라 이보다 훨씬 작게 나옵니다.</p>
    <div class="tpg">${P2.map(fcard).join('')}</div><div class="row" style="margin-top:10px"><button class="btn" data-a="reroll">다른 리그로 다시 만들기</button></div>`; }
  return `<p class="small muted">예상 순위는 전력분석팀 추정치입니다. 외국인 선수는 취임 후 새로 뽑아야 하며, 예상은 비슷한 수준의 외국인을 데려온다고 보고 계산했습니다. 감독도 취임 후 새로 선임합니다.</p>
    <div class="tpg">${P.map(card).join('')}</div><div class="row" style="margin-top:10px"><button class="btn" data-a="reroll">다른 리그로 다시 만들기</button><span class="small muted">선수단은 새 게임마다 무작위로 만들어집니다.</span></div>`; }
function inFrame(){ try{ return window.self!==window.top; }catch(e){ return true; } }
function creditsLine(){ return `<p class="small muted" style="text-align:center;margin-top:6px">크레딧: 선수 얼굴 faces.js (ZenGM, Apache License 2.0) · 경기장 선수 그림 Kenney Sports Pack (CC0) · 저장 압축 lz-string (MIT) · 글꼴 Noto Sans KR, Black Han Sans, Barlow Condensed (SIL OFL) · 구단·선수·인물은 모두 가상입니다.</p>`; }
function startScreen(){ const st=UI.sstep||'main'; const m=meta(); const act=m.slots&&m.slots[m.active]; const canCont=!!(G||act);
  const foot=`<p class="small muted" style="margin-top:14px">구단과 선수는 모두 가상입니다. 일정 흐름, 샐러리캡, FA 등급과 보상, 외국인 선수 한도, 트레이드 마감, 포스트시즌 배당은 실제 KBO 규정을 단순화해 반영했습니다.</p>`;
  const back=(v,l)=>`<button class="lnk tsback" data-a="tsGo" data-v="${v}">← ${l}</button>`;
  if(st==='main'){ const tn=act&&act.tid!=null&&TEAM_DEF[act.tid]?`${TEAM_DEF[act.tid].city} ${TEAM_DEF[act.tid].nick}`:(act&&act.name)||'';
    return `<div class="gut"><div class="wrap ts-wrap"><div class="ts">
      <div class="ts-bg" aria-hidden="true">${TEAM_DEF.map((d,i)=>badge(i,30)).join('')}</div>
      <div class="kicker">KBO형 가상 리그 · 단장 시뮬레이션</div><h1>단장의 시간</h1>
      <p class="ts-sub">경기는 감독이 합니다. 단장은 선수를 모으고, 팀을 만들고, 돈을 지킵니다.</p>
      <div class="ts-menu">
        ${canCont?`<button class="tsb primary" data-a="tsCont"><b>이어하기</b><span>슬롯 ${m.active}${tn?` · ${esc(tn)}`:''}${act&&(act.date||act.y)?` · ${esc(act.date||act.y+'년')}`:''}</span></button>`:''}
        <button class="tsb ${canCont?'':'primary'}" data-a="tsGo" data-v="team"><b>새 게임</b><span>창단 드래프트로 처음부터 팀을 만듭니다</span></button>
        ${anySave()?`<button class="tsb" data-a="tsGo" data-v="slots"><b>저장 슬롯</b><span>불러오기 · 덮어쓰기 · 삭제</span></button>`:''}
      </div><p class="ts-ver">버전 ${GAME_VER} · 무료 게임</p>
      ${inFrame()?`<p class="small ts-warn">iPhone·iPad의 Safari는 이 화면 안에서 저장이 지워질 수 있습니다. <a href="${esc(location.href)}" target="_blank" rel="noopener">새 탭에서 열기</a>를 권하고, 가끔 설정의 "파일로 내보내기"로 백업하세요.</p>`:''}</div>${foot}${creditsLine()}</div></div>`; }
  if(st==='slots')return `<div class="gut"><div class="wrap" style="max-width:760px">${back('main','처음 화면')}${slotsCard(true)}</div></div>`;
  if(st==='mode'&&false){ ensureWorld();
    return `<div class="gut"><div class="wrap" style="max-width:760px">${back('main','처음 화면')}
    <h2 class="ts-h">${UI.newSlot?`슬롯 ${UI.newSlot} · `:''}어떻게 시작할까요</h2><div class="mbg">
      <button class="mbig" data-a="smode" data-v="take"><em>현실적인 시작</em><b>단장 취임</b><span>10개 구단 중 하나의 단장으로 부임합니다. 지금 선수단과 계약, 재정을 그대로 이어받아 고쳐 나갑니다.</span></button>
      <button class="mbig mfd" data-a="smode" data-v="fd"><em>드래프트 게임</em><b>창단 드래프트</b><span>리그 국내 선수 전원을 한데 모아 10개 구단이 25라운드에 걸쳐 새로 뽑습니다. 능력치는 숨겨져 있고 기록으로 고릅니다. 빈 포지션을 채워 가며 처음부터 내 팀을 만듭니다.</span></button>
    </div>${foot}</div></div>`; }
  UI.smode='fd'; const fd=true;
  return `<div class="gut"><div class="wrap" style="max-width:760px">${back('main','처음 화면')}
  <h2 class="ts-h">${fd?'창단 드래프트 · 함께할 구단을 고르세요':'단장 취임 · 맡을 구단을 고르세요'}</h2>

  ${UI.slotMsg?`<div class="note">${esc(UI.slotMsg)} <button class="lnk" data-a="tsGo" data-v="slots">저장 슬롯 보기</button></div>`:''}<section class="card">${pickTeams()}</section>${foot}</div></div>`;
}
function gameOverView(){
  return `<div class="card hero"><div class="eyebrow">${G.gameOver.y}시즌 종료</div><h2 class="sec">경질 통보</h2><p>${esc(G.gameOver.msg)}</p>
  <p class="small muted">재임 ${G.history.filter(h=>h.user).length}시즌. 재정 탭에서 시즌별 기록을 볼 수 있습니다.</p>
  <button class="btn primary" data-a="newgame">새 구단 맡기</button></div>`;
}

/* ---------- 업무 탭 ---------- */
function upcoming(){
  const c=G.cal, y=G.year, d=G.day; const L=[];
  const add=(n,t)=>{ if(n>d)L.push([n,t]); };
  add(c.camp,'스프링캠프 시작'); add(c.campEnd,'캠프 종료'); add(c.exh,'시범경기'); add(c.open,'개막'); add(c.asg,'올스타전');
  add(KD(7,31),'트레이드 마감'); add(KD(8,15),'외국인 등록 마감'); add(c.draft,'신인 드래프트'); add(c.end,'정규시즌 종료');
  if(G.ps&&G.ps.cur)add(G.ps.cur.days[G.ps.cur.gi],ROUNDK[G.ps.cur.round]+' '+(G.ps.cur.gi+1)+'차전');
  add(KD(11,2),'FA 공시'); add(KD(12,1),'연봉 협상 시작'); add(dnum(y+1,1,1),'새해');
  return L.sort((a,b)=>a[0]-b[0]).slice(0,3);
}
function nextGameText(){
  const c=G.cal; for(let n=G.day+1;n<=c.end;n++){ const gs=c.sched[n]; if(!gs)continue; const m=gs.find(x=>x.includes(G.user)); if(m){ const home=m[0]===G.user; return `${dmd(n)} ${home?'홈':'원정'} · ${tname(home?m[1]:m[0])}`; } }
  return '';
}
function calendarCard(){
  const per=period(); const la=G.lastAdv; const hid=liveHidden();
  const ng=per==='season'||per==='pre'?nextGameText():'';
  return `<section class="card"><div class="row between"><h2 class="sec">일정</h2><span class="small muted">${dstr(G.day)}</span></div>
    ${ng?`<p class="small">다음 경기 <b>${ng}</b></p>`:''}
    <div class="log">${upcoming().map(([n,t])=>`<p><span class="ticker">D-${n-G.day}</span> ${dmd(n)} · ${t}</p>`).join('')}</div>
    ${la&&la.days?`<p class="small muted">지난 진행 ${la.days}일${la.w+la.l&&!hid?` · ${la.w}승 ${la.l}패`:''}${G.stops.length?' · 중요한 메일이 와서 멈췄습니다':''}</p>`:'<p class="small muted">오른쪽 위 계속 버튼을 누르면 다음 일정까지 시간이 흐릅니다.</p>'}
  </section>`;
}
function stopsCard(){ return ''; }
function lineScore(g,upto,cur){ // cur: 진행 중인 반 이닝 {half,r,h}
  const n=Math.max(9,g.line.a.length,g.line.h.length); const cols=[...Array(n).keys()];
  const cell=(k,i)=>{ const half=i*2+(k==='h'?1:0); if(cur&&half===cur.half)return `<b>${cur.r}</b>`; if(upto!=null&&half>=upto)return '·'; const v=g.line[k][i]; return v==null?'':v; };
  const tot=(k)=>{ if(upto==null)return [k==='h'?g.hs:g.as, sum(g.hits[k])]; let r=0,h=0; for(let i=0;i<n;i++){ const half=i*2+(k==='h'?1:0); if(half<upto){ const v=g.line[k][i]; if(typeof v==='number')r+=v; h+=g.hits[k][i]||0; } else if(cur&&half===cur.half){ r+=cur.r; h+=cur.h; } } return [r,h]; };
  const row=(k,tid)=>{ const [r,h]=tot(k); return `<tr class="${tid===G.user?'me':''}"><td>${tshort(tid)}</td>${cols.map(i=>`<td>${cell(k,i)}</td>`).join('')}<td class="key">${r}</td><td>${h}</td></tr>`; };
  return `<div class="tw"><table class="ls"><thead><tr><th></th>${cols.map(i=>`<th>${i+1}</th>`).join('')}<th class="key">R</th><th>H</th></tr></thead><tbody>${row('a',g.away)}${row('h',g.home)}</tbody></table></div>`;
}
function liveCard(){
  if(!G.live)return ''; const g=G.games[G.live.i]; if(!g){G.live=null;return '';}
  const total=g.line.a.length+g.line.h.length; const up=Math.min(G.live.upto,total); const done=up>=total;
  const inn=Math.floor(up/2)+1, top=up%2===0;
  const evs=g.ev.filter(e=>e.h<up).slice(-8).reverse();
  return `<section class="card hero"><div class="row between"><span class="eyebrow">${esc(g.kind||'경기')} · ${dmd(g.day)}</span><span class="pill ${done?(g.res==='승'?'good':g.res==='패'?'bad':''):'warn'}">${done?`경기 종료 · ${g.res}`:`${inn}회${top?'초':'말'} 시작 전`}</span></div>
    <h2 class="sec">${tname(g.away)} 대 ${tname(g.home)}</h2>
    ${lineScore(g,done?null:up)}
    <div class="log">${evs.map(e=>`<p><span class="ticker">${Math.floor(e.h/2)+1}회${e.h%2?'말':'초'}</span> ${esc(e.t)}</p>`).join('')||'<p class="small muted">아직 득점이 없습니다.</p>'}</div>
    ${done?`<div class="btns"><button class="btn" data-a="openGame" data-v="${G.live.i}">박스스코어</button><button class="btn primary" data-a="liveDone">확인</button></div>`:`<div class="btns"><button class="btn primary" data-a="liveNext">다음 이닝</button><button class="btn" data-a="liveEnd">경기 끝까지</button></div>`}
  </section>`;
}
function offersCard(){
  const OS=(G.offers||[]).filter(o=>!o.blk); if(!OS.length)return '';
  return OS.map(offerOne).join('');
}
function offerOne(o){ { const t=team(o.from); const li=id=>{const p=G.players[id]; return p?pcard(p,{foot:rosterFoot(p)}):''};
    return `<section class="card hero"><div class="row between"><span class="eyebrow">트레이드 제안 · ${dmd(o.exp)}까지</span><span class="small muted">관계 ${t.rel}</span></div>
    <h2 class="sec">${tname(o.from)}</h2>
    <div class="tcols2"><div><div class="eyebrow">받는 선수</div><div class="tgrid">${o.give.map(li).join('')}</div></div><div><div class="eyebrow">보내는 선수</div><div class="tgrid">${o.get.map(li).join('')}</div></div></div>
    <div class="btns"><button class="btn primary" data-a="offerYes" data-v="${o.id}">수락</button><button class="btn" data-a="offerNo" data-v="${o.id}">거절</button></div></section>`; }
}
function campCard(){
  if(!G.camp||G.camp.done)return '';
  return `<section class="card hero" data-k="스프링캠프"><span class="eyebrow">스프링캠프 · 3월 5일 종료</span><h2 class="sec">훈련 방향</h2>
    <div class="seg">${Object.entries(CAMP).map(([k,l])=>`<button data-a="camp" data-v="${k}" class="${G.camp.focus===k?'on':''}">${l}</button>`).join('')}</div>
    <p class="small muted">${{balance:'젊은 선수 성장과 부상 방지를 조금씩 챙깁니다.',skill:'26세 이하 선수의 기술이 늘어납니다.',fitness:'올 시즌 부상 위험이 줄어듭니다.',game:'4월까지 경기 감각이 올라갑니다.'}[G.camp.focus]}</p></section>`;
}
function mailPane(id){ const m=G.mail.find(x=>x.id===id); if(!m)return '';
  return `<section class="card"><div class="row between"><h2 class="sec">${lk(m.subj)}</h2><span class="small muted">${dsh(m.day)}</span></div>
  <div class="row" style="flex-wrap:nowrap">${senderAv(m)}<div><b>${esc(m.from)}</b><p class="small muted">${dstr(m.day)}</p></div></div>
  <div class="mailbody">${m.body.split('\n').filter(Boolean).map(t=>`<p>${lk(t)}</p>`).join('')}</div>
  ${m.acts.length?`<div class="btns">${m.acts.map((a,i)=>`<button class="btn ${i===0?'primary':''}" data-a="mailAct" data-v="${m.id}:${i}">${esc(a.l)}</button>`).join('')}</div>`:''}</section>${m.oid&&(G.offers||[]).some(o=>o.id===m.oid)?offerOne(G.offers.find(o=>o.id===m.oid)):m.oid?'<p class="small muted">이미 답했거나 만료된 제안입니다.</p>':''}`; }
function avImg(o,big){ const src=faceSVG(o); const nm=o==='sec'?SEC:(o.name||'?'); return src?`<img class="av${big?' big':''}" src="${src}" alt="">`:`<span class="av ini${big?' big':''}">${esc(nm.slice(0,1))}</span>`; }
const PERSONA={'구단주실':['own',63,false],'홍보팀':['staff',36,true],'마케팅팀':['staff',33,true],'운영팀':['staff',44,false],'스카우트팀장':['staff',53,false],'전력분석팀':['staff',31,false],'팀 닥터 · 의무팀':['doc',49,false],'육성팀':['staff',47,false],'에이전트':['agent',45,false],'코칭스태프':['coach',50,false],'선수단':['coach',50,false]};
function personaOf(from){ if(!G)return null; if(from&&from.startsWith('비서'))return 'sec'; if(from==='감독실'){ const m=G.mgr[G.user]; return m?{persona:'mgr',pid:m.id,team:G.user,age:m.age}:null; }
  if(from==='수석코치'||from==='코칭스태프'){ const c=G.coach&&coachesOf(G.user).hc; if(c)return {persona:'coach',pid:c.id,team:G.user,age:c.age}; }
  const x=PERSONA[from]; return x?{persona:x[0],pid:'st:'+from+':'+G.user,team:G.user,age:x[1],female:x[2]}:null; }
function senderAv(m){ if(typeof m.face==='string'&&m.face.startsWith('ob:')){ const o=obOf(m.face.slice(3)); if(o)return obAv(o,{k:'free'}); } if(m.face!=='sec'&&typeof m.face!=='number'&&!(m.kind==='부상'&&m.ref!=null&&G.players[m.ref])){ const pz=personaOf(m.from); if(pz)return avImg(pz); } if(m.face==='sec')return avImg('sec'); if(typeof m.face==='number'&&G.players[m.face])return avImg(G.players[m.face]); if(m.kind==='부상'&&m.ref!=null&&G.players[m.ref])return avImg(G.players[m.ref]); return `<span class="av ini">${esc((m.from||'?').replace('비서 ','').slice(0,1))}</span>`; }
function mailItem(m){ return `<button class="item wa mail${m.read?'':' unread'}${UI.mail===m.id?' sel':''}" data-a="openMail" data-v="${m.id}">${senderAv(m)}<span class="nm">${m.imp?'<span class="pill acc">중요</span> ':''}${esc(m.subj)}</span><span class="sub">${esc(m.from)} · ${esc(m.body.split('\n')[0].slice(0,44))}</span><span class="rt small muted">${dsh(m.day)}</span></button>`; }
function mailSheet(id){ const m=G.mail.find(x=>x.id===id); if(!m)return '';
  return `<div class="scrim" data-a="closeSheet"><div class="sheet gut" data-stop="1" role="dialog" aria-label="메일">
  <div class="sheet-head"><div class="row" style="flex-wrap:nowrap;align-items:flex-start">${senderAv(m)}<div><div class="eyebrow">${esc(m.from)} · ${dstr(m.day)}</div><h2 class="sec">${lk(m.subj)}</h2></div></div><button class="x" data-a="closeSheet" aria-label="닫기">×</button></div>
  <div class="mailbody">${m.body.split('\n').filter(Boolean).map(t=>`<p>${lk(t)}</p>`).join('')}</div>
  ${m.acts.length?`<div class="btns">${m.acts.map((a,i)=>`<button class="btn ${i===0?'primary':''}" data-a="mailAct" data-v="${m.id}:${i}">${esc(a.l)}</button>`).join('')}</div>`:''}
  </div></div>`; }
function tutCard(){ const t=G.tut; if(!t||t.done)return ''; const s=TUT[t.step]; if(!s||s.k==='welcome')return '';
  return `<section class="card hero"><div class="row between"><span class="eyebrow">비서 업무 안내 · ${t.step}/${TUT.length-1}</span><button class="btn small" data-a="tutSkip">건너뛰기</button></div>
  <div class="row" style="flex-wrap:nowrap;align-items:center">${avImg('sec')}<div><b>${esc(s.subj)}</b>${s.prog?`<p class="small">${esc(s.prog())}</p>`:''}</div></div>
  ${s.btn?`<button class="btn primary block" data-a="${s.go[0]}" data-v="${s.go[1]}">${esc(s.btn)}</button>`:''}</section>`; }
function mgrRow(x,act){ mgrFix(x); return `<div class="item wa" style="cursor:default">${avImg({persona:'mgr',pid:x.id,name:x.name,age:x.age,team:G.user})}<span class="nm">${esc(x.name)} <span class="small muted">${x.age}세</span>${x.fame>=70?' <span class="pill warn">스타 감독</span>':''}${obTag(x.ob)}${x.ego>=70?' <span class="pill bad">고집</span>':''}</span><span class="sub">${esc(x.career)} · ${esc(mgrStyle(x))}</span><span class="rt num">${money(x.sal)}</span></div>
  <div class="tools">${(mgrAttr(x),[['작전',x.small],['불펜',x.pen],['육성',x.youth],['장악력',x.disc],['운영',x.tac],['고집',x.ego],['스타성',x.fame],['휴식 관리',x.rest],['투수 혹사',x.arm],['안목',x.eye]]).map(([l,v])=>{ const inv=l==='고집'||l==='투수 혹사', neu=l==='작전'||l==='스타성'; return `<div class="tool" style="--c:${neu?'var(--dim)':rcol(inv?100-v:v)}"><span>${l}</span>${neu||inv?`<b class="num" style="font-size:13px;color:${neu?'var(--ink)':rcol(100-v)}">${v}</b>`:rchip(v)}<span class="track"><span class="mid"></span><span class="now" style="width:${v}%"></span></span><span></span></div>`; }).join('')}</div><p class="small muted" style="margin:2px 0 0">고집·투수 혹사는 낮을수록 좋습니다. 작전(번트·도루 선호)과 스타성(관중·홍보 효과)은 성향입니다.</p>${act||''}`; }
function policyCard(m){
  const p=G.policy; const lean=teamLean(G.user); const cd=p&&G.day-p.day<14;
  const leanTxt=lean>.35?'육성 쪽':lean<-.35?'성적 쪽':'균형';
  return `<section class="card polc"><div class="row between"><span class="eyebrow">운영 기조 지시</span>${p?`<span class="small muted">감독 수용도 ${Math.round(p.follow*100)}% · 관계 ${m.rel}</span>`:`<span class="small muted">지시 없음 · 감독 본래 성향대로 운영 · 관계 ${m.rel}</span>`}</div>
    <div class="seg">${Object.entries(POL).map(([k,x])=>`<button data-a="setPol" data-v="${k}" class="${p&&p.k===k?'on':''}" ${cd?'disabled':''}>${x.l}</button>`).join('')}</div>
    <p class="small">${p?esc(POL[p.k].d):'단장이 방향을 정하면 감독이 성향에 따라 받아들입니다. 출전 시간이 곧 성장이므로, 유망주를 키우려면 육성 기조가 필요합니다.'}</p>
    <div class="leanbar"><span>성적</span><div><i style="left:${(lean+1)*50}%"></i></div><span>육성</span></div>
    <p class="small muted">실제 운영: <b>${leanTxt}</b>. 고집이 센 감독일수록, 본래 성향과 다른 지시일수록, 관계가 나쁠수록 덜 따릅니다. 2주에 한 번 바꿀 수 있습니다.${cd?` 다음 변경 ${dmd(p.day+14)}.`:''}</p>
    ${UI.polMsg?`<div class="note">${esc(UI.polMsg)}</div>`:''}</section>`;
}
function mgrChatCard(compact){ const m=G.mgr[G.user]; if(!m||m.interim||G.unemp)return ''; const C=(G.mgrChat||[]).filter(c=>!compact||G.day-c.d<=14).slice(0,compact?1:4);
  const T=[['now','지금 팀 상황은?'],['foreign','어떤 용병을 원하나?'],['need','가장 급한 자리는?'],['young','눈여겨보는 젊은 선수는?']];
  const tt=G.ttDay!=null&&G.day-G.ttDay<14;
  return `<section class="card mchat"><div class="row between"><h2 class="sec">${compact?'감독실':'감독과 대화'}</h2><span class="small muted">${esc(m.name)} 감독 · 관계 ${m.rel}</span></div>
    <div class="chips">${T.map(([k,l])=>`<button data-a="mgrAsk" data-v="${k}">${l}</button>`).join('')}</div>
    ${C.length?`<div class="mc-l">${C.map(c=>`<div class="mc-a"><i>${dsh(c.d)}${G.day-c.d>30?' (지난 답변, 다시 물어보세요)':''} · ${esc((T.find(x=>x[0]===c.t)||['',''])[1])}</i><p>${esc(c.a)}</p></div>`).join('')}</div>`:'<p class="small muted">자주 물어볼수록 감독과의 관계가 좋아집니다(한 주에 한 번 반영).</p>'}
    ${compact?'':`<div class="eyebrow" style="margin-top:8px">선수단 미팅 ${tt?`· ${dmd(G.ttDay+14)}부터 다시 가능`:'· 2주에 한 번'}</div><div class="chips">${Object.entries(TEAMTALK).map(([k,l])=>`<button data-a="teamTalk" data-v="${k}" ${tt?'disabled':''}>${l}</button>`).join('')}</div>`}
    ${UI.mgrMsg?`<div class="note">${esc(UI.mgrMsg)}</div>`:''}</section>`; }
function pactCard(m){ const P=G.pact&&G.pact.y===G.year&&G.pact.on?G.pact:null; const sel=UI.pactSel||[];
  const dd=depth(G.user); const REGS=new Set([...dd.start,...dd.sp,...dd.pen.slice(0,4)].map(x=>x.id)); const cands=playersOf(G.user).filter(p=>!p.foreign&&p.age<=25&&!REGS.has(p.id)).sort((a,b)=>(scoutReport(b).ofp||0)-(scoutReport(a).ofp||0)).slice(0,12);
  const cur=P?`<ul class="rec-w">${P.t.map(x=>{ const p=G.players[x.id]; return p?`<li><b>${esc(p.name)}</b> ${x.lv==='full'?'<span class="pill good">합의</span>':x.lv==='part'?'<span class="pill warn">부분 합의</span>':'<span class="pill bad">거절</span>'} ${esc(x.why)}</li>`:''; }).join('')}</ul>${P.log.length?`<p class="small muted">최근 점검: ${esc(P.log[P.log.length-1].m)}월 · ${esc(P.log[P.log.length-1].L.join(' / '))}</p>`:''}<div class="row"><button class="btn small" data-a="pactEnd">합의 끝내기</button></div>`:'';
  const pick=cands.length?`<div class="chips">${cands.map(p=>`<button data-a="pactSel" data-v="${p.id}" class="${sel.includes(p.id)?'on':''}">${esc(p.name)} <i>${posLabel(p)} ${p.age}세</i></button>`).join('')}</div><div class="row"><button class="btn small primary" data-a="pactGo" ${sel.length?'':'disabled'}>감독과 합의하기 (${sel.length}/2)</button></div>`:'<p class="small muted">기회를 줄 만한 25세 이하 비주전 선수가 없습니다.</p>';
  return `<section class="card"><div class="row between"><span class="eyebrow">유망주 기회 합의</span><span class="small muted">감독 관계 ${m.rel} · 육성 ${m.youth??'-'}</span></div>
    <p class="small">1군 기회를 줄 유망주를 2명까지 정해 감독과 합의합니다. 감독은 실력 차이와 성향에 따라 받아들이거나 일부만 받아들이고, 매달 근거와 함께 보고합니다. 결과만으로 감독을 자동 평가하지 않습니다.</p>
    ${cur}${P?`<div class="eyebrow" style="margin-top:8px">대상 다시 정하기</div>`:''}${pick}${UI.pactMsg?`<div class="note">${esc(UI.pactMsg).replace(/\n/g,'<br>')}</div>`:''}</section>`; }
function mgrBody(){
  const m=G.mgr[G.user];
  const pol=m?policyCard(m)+(m.interim?'':pactCard(m)):'';
  const cur=m?`<div class="eyebrow">현재 감독</div>${mgrRow(m,`<p class="small muted">${m.interim?'감독대행 체제입니다.':`계약 잔여 ${Math.max(0,m.yrs)}년`}</p>${m.interim?'':UI.confirmFire?`<div class="row"><button class="btn danger" data-a="fireMgr">정말 경질 (잔여 연봉 지급)</button><button class="btn" data-a="fireCancel">취소</button></div>`:`<div class="row">${m.yrs<=0?'<button class="btn" data-a="renewMgr" data-v="2">2년 재계약</button>':''}<button class="btn danger" data-a="fireAsk">경질</button></div>`}`)}`:'<div class="note bad">감독이 없습니다. 개막 전까지 반드시 선임해야 합니다.</div>';
  const mgrCandCard=x=>`<div class="tcard mgrc" style="cursor:default">${mgrRow(x,`${G.coach?clanBox(x):''}<div class="row">${(()=>{ const b=budget(); const cur=G.mgr[G.user]; const pay=cur&&!cur.interim?Math.round(cur.sal*Math.max(0,cur.yrs-.5)):0; const clan=G.coach&&(x.clan||[]).length?sum(x.clan.map(c=>c.sal)):0; return budgetTag(Math.round(x.sal*b.rem)+pay+Math.round(clan*b.rem)+(clan?clanSev(x):0))+(pay?`<span class="small muted">현 감독 경질 정산금 ${money(pay)} 포함</span>`:''); })()}</div><div class="row">${G.coach&&(x.clan||[]).length?`<button class="btn small primary" data-a="hireMgr" data-v="${x.id}:2:1">사단과 2년</button><button class="btn small" data-a="hireMgr" data-v="${x.id}:3:1">사단과 3년</button><button class="btn small" data-a="hireMgr" data-v="${x.id}:2:0">감독만 2년</button>`:`<button class="btn small primary" data-a="hireMgr" data-v="${x.id}:2">2년 계약</button><button class="btn small" data-a="hireMgr" data-v="${x.id}:3">3년 계약</button>`}</div>`)}</div>`;
  const mv=inTabs('mgrv',[...(m&&!m.interim?[['talk','대화']]:[]),['cur','현재 감독'],...(m&&!m.interim?[['rel','관계·요청'],['pol','지시·합의']]:[]),['cand',`후보 ${(G.mmarket||[]).length}`]],m&&!m.interim?'talk':'cand');
  if(mv.cur==='talk')return mv.bar+mgrChatCard(false);
  const PGm=pager('mgc',(G.mmarket||[]),3);
  if(mv.cur==='rel')return mv.bar+mgrBondView()+mreqView();
  return mv.bar+(mv.cur==='cur'?cur+`<p class="small muted">고집이 셀수록 단장의 지시를 덜 받아들이고, 스타 감독은 팬 관심과 구단 인기를 끌어올리지만 연봉이 비싸고 자기 방식이 강합니다. 작전 수치가 높으면 도루를 많이 시도하고, 불펜 운용 수치가 높으면 선발을 일찍 내립니다. 육성은 26세 이하 선수 성장, 장악력은 선수단 기분, 경기 운영은 전반적인 경기력에 영향을 줍니다. 감독을 바꾸면 남은 계약 연봉은 그대로 나갑니다.</p>`:mv.cur==='pol'?pol:((G.mmarket||[]).length?`<div class="tgrid" data-pg="mgc">${PGm.items.map(mgrCandCard).join('')}</div>${PGm.bar}`:'<p class="small muted">후보가 없습니다. 11월에 새 후보가 나옵니다.</p>'));
}
function medBody(){
  return `<div class="eyebrow">부상 방지 프로그램</div>
  <div class="seg">${PREV.map((x,i)=>`<button data-a="setPrev" data-v="${i}" class="${G.med.prev===i?'on':''}">${x.l}</button>`).join('')}</div>
  <p class="small muted">연 ${money(PREV[G.med.prev].c)} · 경기 중 부상 위험 ${Math.round((1-PREV[G.med.prev].m)*100)}% 감소</p>
  <div class="eyebrow">제휴 병원</div>
  <div class="list">${Object.entries(HOSP).map(([k,h])=>`<button class="item" data-a="setHosp" data-v="${k}"><span class="nm">${G.med.hosp===k?'<span class="pill good">선택됨</span> ':''}${esc(h.name)}</span><span class="sub">${esc(h.d)}${h.rec?` 재활 기간 ${Math.round(h.rec*100)}% 단축.`:''}</span><span class="rt num">${h.c?money(h.c):'-'}</span></button>`).join('')}</div>
  <p class="small muted">병원 이름은 모두 가상입니다. 비용은 하루 단위로 쌓여 시즌 결산 때 나갑니다. 지난 결산 이후 ${money(G.spend.med+G.spend.hosp)}.</p>
  ${G.medSet?'':'<button class="btn primary block" data-a="medOk">이대로 운영</button>'}`;
}
function devBody(){
  const rows=(G.devProg||[]).map(x=>{const p=G.players[x.pid]; return p?`<div class="item wa" style="cursor:default">${avImg(p)}<button class="nm lnk" data-a="player" data-v="${p.id}">${esc(p.name)} <span class="small muted">${posLabel(p)} · ${p.age}세</span></button><span class="sub">${DEVP[x.prog].l} · ${Math.max(0,Math.floor((G.day-x.since)/7))}주째${isRegular(p)?' · 1군 출전 중(효과 절반)':''}</span><span class="rt"><button class="btn small danger" data-a="devOff" data-v="${p.id}">해제</button></span></div>`:''}).join('');
  const cands=domestic(G.user).filter(p=>p.age<=26&&!(G.devProg||[]).some(x=>x.pid===p.id)).map(p=>({p,rp:scoutReport(p)})).sort((a,b)=>((b.rp.ofp||0)-b.rp.cur)-((a.rp.ofp||0)-a.rp.cur)).slice(0,8);
  const full=(G.devProg||[]).length>=6;
  const ov=(G.ovs||[]).map(x=>{const p=G.players[x.pid]; return p?`<div class="item wa" style="cursor:default">${avImg(p)}<span class="nm">${esc(p.name)}</span><span class="sub">${OVS[x.prog].l} · 1월 1일 결과 발표</span></div>`:''}).join('');
  const dv=inTabs('devv',[['on',`배정 중 ${(G.devProg||[]).length}/6`],['rec','추천 대상'],['ovs','해외 연수']],(G.devProg||[]).length?'on':'rec');
  return dv.bar+(dv.cur==='on'?`<p class="small muted">배정한 선수는 매주 해당 능력이 조금씩 오릅니다. 1군에서 뛰는 선수는 효과가 절반이고, 감독의 육성 성향도 영향을 줍니다. 추천 선수 카드 아래 버튼을 누르면 바로 배정됩니다(최대 6명).</p>${UI.devMsg?`<div class="note bad">${esc(UI.devMsg)}</div>`:''}
  ${(G.devProg||[]).length?`<div class="eyebrow">배정 중</div>${cgrid((G.devProg||[]).map(x=>G.players[x.pid]).filter(Boolean),p=>{const x=G.devProg.find(q=>q.pid===p.id); return {tags:`<span class="pill good">${DEVP[x.prog].l} · ${Math.max(0,Math.floor((G.day-x.since)/7))}주째</span>`,foot:`${rosterFoot(p)}<button class="tc-i" data-a="devOff" data-v="${p.id}">해제</button>`};})}`:''}`||'':dv.cur==='rec'?`  <div class="eyebrow">추천 대상 (스카우트가 본 성장 여지 순)</div>
  ${cgrid(cands.map(x=>x.p),p=>({foot:`<div class="devpick">${Object.entries(DEVP).filter(([k,v])=>v.P===!!p.isP).map(([k,v])=>`<button class="tc-i" data-a="devSet" data-v="${p.id}:${k}" ${full?'disabled':''}>${v.l}</button>`).join('')}</div>`}))}`:`  <div class="eyebrow">해외 연수 ${ovsOpen()?'· 신청 가능':'· 9월부터 신청'}</div>
  ${ov?`<div class="list">${ov}</div>`:''}
  <p class="small muted">${Object.values(OVS).map(o=>`${o.l} ${money(o.c)}: ${o.d}`).join(' ')}</p>`);
}
function logBody(){ return `<div class="log">${G.log.slice(0,20).map(l=>`<p><span class="ticker">${l.d!=null?dsh(l.d):l.y}</span> ${lk(l.t)}</p>`).join('')||'<p class="small muted">기록이 없습니다.</p>'}</div>`; }
function marketingBody(){
  return `<div class="row between"><span class="small">올 시즌 예산</span><b class="num" id="mktv">${money(G.marketing)}</b></div>
    <input type="range" id="mkt" min="500" max="6000" step="250" value="${G.marketing}" data-a="mkt" aria-label="마케팅 예산">
    <p class="small muted">광고·상품 수입과 인기에 영향을 줍니다. 개막 전에만 바꿀 수 있고, 비용은 시즌 결산 때 나갑니다.</p>`;
}
function capCard(ci){
  const pct=Math.min(100,ci.pay/ci.cap*100), fl=ci.floor/ci.cap*100;
  return `<section class="card">
    <div class="row between"><h2 class="sec">샐러리캡</h2><span class="pill ${ci.over?'bad':'good'}">${ci.over?'초과 '+money(ci.over):'여유 '+money(ci.cap-ci.pay)}</span></div>
    <div class="bar"><i class="${ci.over?'over':''}" style="width:${pct}%"></i><b style="left:${fl}%"></b></div>
    <p class="small muted">외국인과 신인을 뺀 연봉 상위 40명 합계 ${money(ci.pay)} · 상한 ${money(ci.cap)} · 하한 ${money(ci.floor)}(세로선). 넘기면 초과분의 30%, 2년 연속이면 50%를 야구발전기금으로 냅니다.${G.year>2028?' 2029년 이후 상한액은 연 3% 인상으로 가정했습니다.':''}</p>
  </section>`;
}
function scoutBody(){
  const L=scoutLoad(); const cell=(role,key,label)=>{ const sc=role==='intl'?null:scoutOf(role,key); const n=L[role+':'+key]||0; const lv=role==='intl'?intlLv(key):null;
    return `<div class="cov ${(role==='intl'?lv>=1:n)?'on':''}"><span>${label}${role==='intl'&&n?' · 파견':''}</span><b>${role==='intl'?lv+'단계':n?'★'.repeat(sc.skill):'공백'}</b></div>`; };
  const matrix=`<div class="covm"><div class="covr"><i>아마추어</i>${REG.map(r=>cell('am',r,r)).join('')}</div><div class="covr"><i>프로</i>${REG.map(r=>cell('pro',r,r)).join('')}</div><div class="covr"><i>해외</i>${Object.keys(IREG).map(r=>cell('intl',r,IREG[r].l)).join('')}</div></div>`;
  const opt=s=>{ const cur=(s.role||'am')+':'+s.region; const os=[...REG.map(r=>['am:'+r,'아마추어 · '+r]),...REG.map(r=>['pro:'+r,'프로 · '+r+' 구단']),...Object.keys(IREG).map(r=>['intl:'+r,'해외 · '+IREG[r].l])];
    return `<select data-a="sAssign" data-v="${s.id}" aria-label="담당 업무">${os.map(([v,l])=>`<option value="${v}" ${v===cur?'selected':''}>${l}</option>`).join('')}</select>`; };
  return `<p class="small muted">스카우트 한 명은 한 가지 업무만 맡습니다. 아마추어는 그 지역 고교·대학 선수(드래프트), 프로는 그 지역 연고 구단 선수, 해외는 그 나라 외국인 시장을 봅니다. 해외 담당을 보내면 그 나라 정보 수준이 한 단계 올라갑니다. 업무를 바꾸면 30일 동안 적응 기간이라 능력이 1 낮게 적용됩니다. 최대 ${SCOUT_MAX}명.</p>
    ${matrix}
    <div class="tgrid">${G.scouts.map(s=>scoutCard(s,`${opt(s)}${G.day-(s.since??-999)<30?`<span class="pill warn">적응 중 · ${dmd(s.since+30)}까지</span>`:''}<button class="tc-i" data-a="fireScout" data-v="${s.id}">해고</button>`)).join('')||'<p class="small muted">스카우트가 없습니다.</p>'}</div>
    <div class="eyebrow">영입 가능 · ${G.scouts.length}/${SCOUT_MAX}명</div>
    <div class="tgrid">${G.scoutMarket.map(s=>scoutCard(s,`<button class="tc-i go" data-a="hireScout" data-v="${s.id}" ${G.scouts.length>=SCOUT_MAX?'disabled':''}>영입</button>`)).join('')}</div>`;
}
/* ---------- FM식 메뉴: 섹션과 하위 탭 ---------- */
const ICO2={home:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',swap:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/></svg>',
 search:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
 clip:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>',
 club:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 22h18"/><path d="M6 18v-7"/><path d="M10 18v-7"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="M12 2 20 7H4z"/></svg>',
 cog:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>',
 menu:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></svg>'};
const NAV=[['home','홈','home'],['inbox','소식함','mail'],['roster','선수단','users'],['trade','트레이드','swap'],['transfer','영입·계약','brief'],['staff','스태프·육성','clip'],['league','리그','trophy'],['club','구단·재정','club']];
const BNAV=['home','inbox','roster','trade','league'];
const SUBS={
  trade:[['block','트레이드 블록'],['table','협상 테이블'],['market','추천·선수 찾기'],['gms','단장들']],
  transfer:[['fa','FA 시장'],['foreign','외국인'],['draft','신인 드래프트'],['contract','계약']],
  staff:[['mgr','감독'],['coach','코치진'],['scouts','스카우트'],['data','전력분석'],['dev','육성'],['fac','시설'],['med','의무·병역']],
  league:[['stand','순위'],['score','일정·결과'],['rec','기록'],['news','뉴스·팬'],['hist','역사']],
  club:[['owner','구단주·목표'],['fin','재정'],['stad','구장'],['chron','연대기'],['set','설정']]};
/* 탭 정리: 보이는 탭 하나가 예전 화면 여러 개를 이어서 보여 준다 */
const MERGE={trade:{block:['block'],gms:['gms','report']},staff:{med:['med','mil']},
  league:{rec:['rec','feat']},club:{owner:['owner','media','rel'],chron:['chron','result','ob','log']}};
const ALIAS={}; for(const t in MERGE){ ALIAS[t]={}; for(const v in MERGE[t])for(const k of MERGE[t][v])ALIAS[t][k]=v; } ALIAS.trade.offers='block';
/* 합친 탭에서 부가 화면은 접어 둔다(제목만 보이고 누르면 펼침) */
const MFOLD={'trade:find':'선수 찾기','trade:report':'트레이드 성적표','league:teams':'구단 둘러보기','league:feat':'진기록','league:abroad':'해외파','club:rel':'관계도','club:ob':'OB·레전드','club:log':'구단 일지','club:result':'지난 시즌 결산','staff:fac':'훈련 시설','staff:mil':'병역','staff:coach':'코치진'};
/* 합쳐진 메뉴는 세로로 쌓지 않고 안쪽 탭으로 나눈다: 한 화면에 한 주제 */
const MLBL={'club:media':'언론·여론','club:mkt':'마케팅','trade:market':'추천·영입 요청','trade:gms':'단장들','staff:mgr':'감독','staff:dev':'육성','staff:med':'의무','league:stand':'순위','league:rec':'기록','league:hist':'역사','club:owner':'구단주·목표','club:fin':'재정','club:chron':'연대기'};
function mergedBody(tab,s,H){ const ks=((MERGE[tab]&&MERGE[tab][s])||[s]).filter(k=>H[k]); if(!ks.length)return H[SUBS[tab][0][0]]?H[SUBS[tab][0][0]]():'';
  if(ks.length===1)return H[ks[0]]();
  const lab=k=>MLBL[tab+':'+k]||MFOLD[tab+':'+k]||((SUBS[tab].find(x=>x[0]===k)||[])[1])||k;
  const it=inTabs(`mg_${tab}_${s}`,ks.map(k=>[k,lab(k)]),s); return it.bar+H[it.cur](); }
const GW={구장:['club','stad'],감독:['staff','mgr'],코치진:['staff','coach'],외국인선수:['transfer','foreign'],'부상방지·병원':['staff','med'],'2군연수':['staff','dev'],트레이드:['transfer','trade'],비FA다년계약:['transfer','contract'],드래프트후보:['transfer','draft'],스카우트팀:['staff','scouts'],해외스카우트망:['scout','intl'],전력분석:['staff','data'],마케팅:['club','mkt'],일지:['club','log'],연봉협상:['transfer','contract'],신인드래프트:['transfer','draft'],FA시장:['transfer','fa'],시즌결산:['club','result'],스프링캠프:['staff','dev'],순위:['league','stand']};
function curSub(tab){ if(tab==='league')return (ALIAS.league[UI.lseg]||UI.lseg); UI.sub=UI.sub||{}; const raw=UI.sub[tab]||SUBS[tab][0][0]; return (ALIAS[tab]&&ALIAS[tab][raw])||raw; }
function faLive(){ return !!(G.fa&&!G.fa.closed&&G.day>=KD(11,1)); }
function subAlert(tab,k){
  const f=foreignOf(G.user);
  const A2={
    'trade:block':!!(G.offers&&G.offers.length),
    'transfer:foreign':foreignOpen()&&f.length<4&&period()!=='season',
    'transfer:fa':faLive(),
    'transfer:contract':!!(G.contract&&!G.contract.done),
    'transfer:draft':!!(G.draft&&!G.draft.done),
    'staff:scouts':new Set(G.scouts.filter(s=>(s.role||'am')==='am').map(s=>s.region)).size<3,
    'staff:mgr':!G.mgr[G.user],
    'staff:coach':!!G.coach&&CKEYS.some(k=>!coachesOf(G.user)[k]),
    'staff:dev':!!(G.camp&&!G.camp.done&&!G.camp.seen),
    'staff:med':!G.medSet,
    'staff:mil':!!sangmuWave()&&domestic(G.user).some(p=>milFree(p)&&p.age>=27&&!(p.mil&&p.mil.app))};
  return !!A2[tab+':'+k];
}
function tabAlert(tab){ return (SUBS[tab]||[]).some(([k])=>subAlert(tab,k)); }
function subTabs(tab){
  const cur=curSub(tab);
  return `<nav class="subtabs" aria-label="${TITLE[tab]} 하위 메뉴">${SUBS[tab].map(([k,l])=>`<button data-a="${tab==='league'?'lseg':'sub'}" data-v="${tab==='league'?k:tab+':'+k}" class="${cur===k?'on':''}">${l}${((MERGE[tab]&&MERGE[tab][k])||[k]).some(x=>subAlert(tab,x))?'<i class="sdot"></i>':''}</button>`).join('')}</nav>`;
}
const csec=(title,body,extra)=>`<section class="card"><div class="row between"><h2 class="sec">${title}</h2>${extra||''}</div>${body}</section>`;
function menuSheet(){
  return `<div class="scrim" data-a="closeSheet"><div class="sheet gut" data-stop="1" role="dialog" aria-label="전체 메뉴"><div class="sheet-head"><h2 class="sec">전체 메뉴</h2><button class="x" data-a="closeSheet" aria-label="닫기">×</button></div>
  <div class="menu-grid">${NAV.map(([k,l,i])=>`<div class="menu-sec"><button class="menu-h ${UI.tab===k?'on':''}" data-a="tab" data-v="${k}">${ICO[i]||ICO2[i]}<b>${l}</b>${tabAlert(k)?'<i class="sdot"></i>':''}</button>${SUBS[k]?`<div class="menu-subs">${SUBS[k].map(([s,sl])=>`<button data-a="go" data-v="${k}:${s}">${sl}${subAlert(k,s)?'<i class="sdot"></i>':''}</button>`).join('')}</div>`:''}</div>`).join('')}</div><button class="btn block" data-a="go" data-v="club:set" style="margin-top:8px">${ICO2.cog} 새 게임 · 게임 설정</button></div></div>`;
}

/* ---------- 리그 집계 도우미 ---------- */
const tlOf=tid=>((G.sea&&G.sea.tl)||[])[tid]||[];
function wlOf(L){ return {w:L.filter(x=>x[0]>0).length,l:L.filter(x=>x[0]<0).length,t:L.filter(x=>x[0]===0).length}; }
function l10Of(tid){ const L=tlOf(tid).slice(-10); return Object.assign(wlOf(L),{n:L.length}); }
function streakOf(tid){ const L=tlOf(tid); if(!L.length)return ''; const s=L[L.length-1][0]; let n=0; for(let i=L.length-1;i>=0&&L[i][0]===s;i--)n++; return s>0?`${n}연승`:s<0?`${n}연패`:`${n}무`; }
function splitOf(tid){ const L=tlOf(tid); const f=h=>{ const r=wlOf(L.filter(x=>x[3]===h)); return `${r.w}-${r.l}${r.t?'-'+r.t:''}`; }; return {home:f(1),away:f(0),rs:sum(L.map(x=>x[1])),ra:sum(L.map(x=>x[2])),n:L.length}; }
function h2hOf(tid,opp){ return wlOf(tlOf(tid).filter(x=>x[4]===opp)); }
const wlStr=r=>`${r.w}-${r.l}${r.t?'-'+r.t:''}`;
const pctStr=o=>o.w+o.l?fmt3(o.w/(o.w+o.l)):'-';
function standOrder(){ const per=period(); if(per==='season'||per==='post')return {live:true,y:G.year,order:standingsNow()}; const lh=G.history[G.history.length-1]; return {live:false,y:lh?lh.y:G.year-1,order:lh?lh.order:standingsNow()}; }
const gbOf=(top,o)=>((top.w-o.w)-(top.l-o.l))/2;
const gbStr=v=>v<=0?'-':v.toFixed(1);
function strkPill(tid){ const s=streakOf(tid); if(!s)return ''; return `<span class="strk ${s.includes('승')?'w':s.includes('패')?'l':''}" data-a="go" data-v="league:stand">${s}</span>`; }
function blockNow(){ const r=G.res; G.res=null; const b=blocker(); G.res=r; return b; }

let _tsC=null;
function teamStats(y){ const key=y+':'+G.day+':'+G.games.length; if(_tsC&&_tsC.k===key)return _tsC.v;
  const T=G.teams.map(t=>({tid:t.id,b:Object.assign({},ZB),p:Object.assign({},ZP)}));
  for(const p of Object.values(G.players)) for(const h of p.hist){ if(h.y!==y||h.lvl!=='1군'||h.t==null||!T[h.t])continue; const X=p.isP?T[h.t].p:T[h.t].b; for(const k in X)X[k]+=h[k]||0; }
  for(const t of T){ const L=tlOf(t.tid); t.g=L.length; t.rs=sum(L.map(x=>x[1])); t.ra=sum(L.map(x=>x[2])); const br=bRate(t.b), pr=pRate(t.p); Object.assign(t,{avg:br.avg,obp:br.obp,slg:br.slg,ops:br.ops,era:pr.era,whip:pr.whip,hr:t.b.hr,sb:t.b.sb,so:t.p.so,hra:t.p.hr}); }
  _tsC={k:key,v:T}; return T; }
function rankIn(T,tid,k,asc){ const s=[...T].sort((a,b)=>asc?a[k]-b[k]:b[k]-a[k]); return s.findIndex(x=>x.tid===tid)+1; }
const rkPill=(r)=>`<span class="rk ${r<=3?'hi':r>=8?'lo':''}">${r}위</span>`;

/* 시즌 개인 기록(리그 전체) */
let _prC=null;
function playerRows(y){ const key=y+':'+G.day+':'+G.games.length; if(_prC&&_prC.k===key)return _prC.v;
  const rows=[]; for(const p of Object.values(G.players)){ const h=seasonTotal(p,y,'1군'); if(!h)continue; if(p.isP?!h.outs:!h.pa)continue; rows.push({p,h,w:wOf(h,p),r:p.isP?pRate(h):bRate(h)}); }
  _prC={k:key,v:rows}; return rows; }
function qualOf(tid){ const r=G.sea.rec[tid]; const g=r?r.w+r.l+(r.t||0):0; return g; }
function isQual(x,y){ const live=y===G.year&&(period()==='season'||period()==='post'); const g=live?qualOf(x.h.t??x.p.team):144; return x.p.isP?x.h.outs>=Math.max(3,g*3):x.h.pa>=Math.max(3,g*3.1); }

/* ---------- 홈 ---------- */
/* 다음 일까지 진행한 동안의 요약 */
function digestCard(){ const D=G.dig; if(!D||!D.games||!D.games.length||G.res)return '';
  const gs=D.games.map(d=>{ const i=G.games.findIndex(g=>g.day===d&&(g.home===G.user||g.away===G.user)); return i>=0?{i,g:G.games[i]}:null; }).filter(Boolean);
  const w=gs.filter(x=>x.g.res==='승').length, l=gs.filter(x=>x.g.res==='패').length; const rk=userRank();
  const chips=gs.map(x=>{ const g=x.g; const home=g.home===G.user; const ms=home?g.hs:g.as, os=home?g.as:g.hs; const op=home?g.away:g.home;
    return `<button class="dg-g ${g.res==='승'?'w':g.res==='패'?'l':''}" data-a="openGame" data-v="${x.i}"><i>${dsh(g.day)}</i><b>${g.res}</b><span>${ms}:${os}</span><em>${home?'vs':'@'} ${esc(team(op).nick)}</em></button>`; }).join('');
  const rows=[]; for(const p of playersOf(G.user)){ const h=seasonTotal(p,G.year,'1군'); if(!h)continue; const a=D.snap[p.id]||DIGK.map(()=>0); const d={}; DIGK.forEach((k,i)=>d[k]=(h[k]||0)-a[i]);
    if(p.isP){ if(d.outs<3)continue; const era=d.er*27/d.outs; rows.push({p,isP:true,sc:(d.outs/3)*(4.5-era)/9+d.w*.3+d.sv*.3+d.hld*.15,t:`${ipStr(d.outs)}이닝 ${d.er}자책${d.w?` ${d.w}승`:''}${d.l?` ${d.l}패`:''}${d.sv?` ${d.sv}세`:''}${d.hld?` ${d.hld}홀`:''}`}); }
    else { if(d.pa<5)continue; const ops=d.ab?(d.h+d.bb)/Math.max(1,d.pa)+(d.h+d.d+2*d.tr+3*d.hr)/d.ab:0; rows.push({p,isP:false,sc:(ops-.72)*d.pa/10+d.hr*.2,t:`${d.pa}타석 ${d.h}안타${d.hr?` ${d.hr}홈런`:''} ${d.rbi}타점 · OPS ${fmt3(ops)}`}); } }
  rows.sort((a,b)=>b.sc-a.sc); const B=rows.filter(x=>!x.isP), P=rows.filter(x=>x.isP); const hot=[...B.slice(0,2),...P.slice(0,1)].filter(x=>x.sc>0).sort((a,b)=>b.sc-a.sc), cold=[B[B.length-1],P[P.length-1]].filter(x=>x&&x.sc<0&&!hot.includes(x));
  const li=x=>`<button class="dg-p" data-a="player" data-v="${x.p.id}">${avImg(x.p)}<span><b>${esc(x.p.name)}</b><i>${posLabel(x.p)} · ${x.t}</i></span></button>`;
  const inj=playersOf(G.user).filter(p=>p.injOut>0&&(p.injHist||[]).some(h=>h.y===G.year)&&p.injOut>=5).slice(0,3);
  return `<section class="card digest"><div class="row between"><span class="eyebrow">${dmd(D.from)} ~ ${dmd(D.to)} · ${gs.length}경기</span><span class="pill ${w>l?'good':w<l?'bad':''}">${w}승 ${l}패</span></div>
    <h2 class="sec">${w>l?'좋은 흐름':w<l?'아쉬운 한 주':'반타작'} · ${D.rk&&rk?(rk<D.rk?`${D.rk}위 → <b>${rk}위</b>`:rk>D.rk?`${D.rk}위 → <b class="bad">${rk}위</b>`:`${rk}위 유지`):''}</h2>
    <div class="dg-gs">${chips}</div>
    ${(()=>{ const A=(G.autoLog||[]).filter(x=>x.d>=D.from&&x.d<=D.to); return A.length?`<p class="small"><b>자동 처리 ${A.length}건</b> · ${A.map(x=>`${esc(x.t)}: ${esc(x.c)}${x.r?` (${esc(x.r.replace(/\.$/,''))})`:''}`).join(' / ')}</p>`:''; })()}
    ${hot.length?`<div class="eyebrow">잘한 선수</div><div class="dg-ps">${hot.map(li).join('')}</div>`:''}
    ${cold.length?`<div class="eyebrow">부진한 선수</div><div class="dg-ps">${cold.map(li).join('')}</div>`:''}
    ${inj.length?`<p class="small">부상: ${inj.map(p=>`${esc(p.name)}(${p.injOut}일)`).join(', ')}</p>`:''}
    <p class="small sdesc">경기를 누르면 박스스코어를 볼 수 있습니다. 한 경기씩 보려면 위의 "1경기"를 누르세요.</p></section>`; }
function resultHome(){
  if(!G.res||G.live)return ''; const g=G.games[G.res.i]; if(!g){G.res=null;return '';}
  const me=g.home===G.user?'h':'a'; const ms=g.box[me];
  const n=(G.sea.ulog||[]).filter(x=>!/차전/.test(x.k)).length; const reg=!/차전/.test(g.kind||'')&&period()==='season';
  const star=[...ms.bat].sort((a,b)=>(b.h*2+b.hr*3+b.rbi*1.5)-(a.h*2+a.hr*3+a.rbi*1.5))[0];
  const sp=ms.pit[0]; const dec=ms.pit.filter(q=>q.d&&q!==sp);
  const pf=[]; if(star&&star.h)pf.push(`<button class="pf" data-a="player" data-v="${star.id}">${G.players[star.id]?avImg(G.players[star.id]):''}<span><b>${esc(star.n)}</b><i>${star.ab}타수 ${star.h}안타${star.hr?` ${star.hr}홈런`:''}${star.rbi?` ${star.rbi}타점`:''}</i></span></button>`);
  if(sp)pf.push(`<button class="pf" data-a="player" data-v="${sp.id}">${G.players[sp.id]?avImg(G.players[sp.id]):''}<span><b>${esc(sp.n)}${sp.d?` <em class="${sp.d==='승'?'g':sp.d==='패'?'b':''}">${sp.d}</em>`:''}</b><i>선발 ${ipStr(sp.outs)}이닝 ${sp.er}실점 ${sp.so}K</i></span></button>`);
  for(const q of dec.slice(0,1))pf.push(`<button class="pf" data-a="player" data-v="${q.id}">${G.players[q.id]?avImg(G.players[q.id]):''}<span><b>${esc(q.n)} <em class="${q.d==='승'?'g':q.d==='패'?'b':''}">${q.d==='세'?'세이브':q.d==='홀'?'홀드':q.d}</em></b><i>${ipStr(q.outs)}이닝 ${q.er}실점</i></span></button>`);
  const runs=g.ev.filter(e=>e.run).slice(-3);
  const others=tlOf(g.home).length?otherScores(g.day,[g.home,g.away]):'';
  return `<section class="card hero rescard">
    <div class="row between"><span class="eyebrow">${g.kind?esc(g.kind)+' · ':''}${dmd(g.day)} ${WD[dobj(g.day).w]}${reg?` · ${n}/144경기`:''}${g.att?` · 관중 ${g.att.toLocaleString('ko-KR')}${g.so?'(매진)':''}`:''}</span><span class="pill ${g.res==='승'?'good':g.res==='패'?'bad':''}">${g.res}</span></div>
    <div class="scoreline">${badge(g.away,34)}<b class="tn2"><i>${team(g.away).city}</i>${team(g.away).nick}</b><span class="num">${g.as}</span><i>:</i><span class="num">${g.hs}</span><b class="tn2"><i>${team(g.home).city}</i>${team(g.home).nick}</b>${badge(g.home,34)}</div>
    ${lineScore(g,null)}
    ${pf.length?`<div class="pfs">${pf.join('')}</div>`:''}
    ${others}
    ${(()=>{ try{ return fanLinesHtml(gameFanLines(g),'팬 반응'); }catch(e){ return ''; } })()}
    <div class="btns3">${g.pbp&&g.pbp.length?`<button class="btn primary" data-a="cast" data-v="${G.res.i}">카드 중계</button><button class="btn" data-a="watch" data-v="${G.res.i}">문자 중계</button>`:''}<button class="btn" data-a="openGame" data-v="${G.res.i}">박스스코어</button><button class="btn primary" data-a="resNext" ${blockNow()?'disabled':''}>다음 경기</button></div>
  </section>`;
}
function otherScores(day,skip){
  const gs=[]; for(const t of G.teams){ for(const x of tlOf(t.id)) if(x[5]===day&&x[3]===1&&!(skip||[]).includes(t.id))gs.push({h:t.id,a:x[4],hs:x[1],as:x[2]}); }
  if(!gs.length)return '';
  return `<div class="oscores"><span class="eyebrow">다른 구장</span>${gs.map(s=>`<span class="os"><b class="${s.as>s.hs?'w':''}">${tshort(s.a)} ${s.as}</b><i>:</i><b class="${s.hs>s.as?'w':''}">${s.hs} ${tshort(s.h)}</b></span>`).join('')}</div>`;
}
const TODO={
  'trade:offers':['트레이드 제안이 와 있습니다','트레이드 → 제안·블록에서 답하세요'],
  'transfer:foreign':['외국인 선수 자리가 비어 있습니다','외국인 슬롯 4개 중 빈 자리를 채우세요'],
  'transfer:fa':['FA 시장이 열려 있습니다','에이전트와 협상할 선수를 고르세요'],
  'transfer:contract':['연봉 협상이 남아 있습니다','계약 화면에서 확정하세요'],
  'transfer:draft':['신인 드래프트 진행 중','우리 순번에 지명하세요'],
  'staff:scouts':['스카우트 배치가 부족합니다','아마추어 담당을 3곳 이상 맡기세요'],
  'staff:mgr':['감독이 없습니다','개막 전에 감독을 선임해야 합니다'],
  'staff:coach':['코치 자리가 비어 있습니다','스태프·육성 → 코치진에서 채우세요'],
  'staff:med':['의무 체계를 정하지 않았습니다','부상 방지 투자와 지정 병원'],
  'staff:mil':['상무 지원 기간입니다','입대 대상 선수를 확인하세요']};
/* ---------- 단장 데스크: 전력 한눈에 + 추천 트레이드 ---------- */
const SLOTS_S={C:'포수','1B':'1루','2B':'2루','3B':'3루',SS:'유격',LF:'좌익',CF:'중견',RF:'우익',DH:'지명',SP:'선발',RP:'불펜'};
const rkCls=r=>r<=3?'hi':r<=7?'md':'lo';
function pMini(p,tag){ const rp=scoutReport(p); const h=curLine(p); const st=!h?'기록 없음':p.isP?(h.outs?`ERA ${pRate(h).era.toFixed(2)}`:'-'):(h.pa?`OPS ${fmt3(bRate(h).ops)}`:'-');
  return `<button class="pm" data-a="player" data-v="${p.id}">${avImg(p)}<span><b>${esc(p.name)}${p.team!=null&&team(p.team).cap===p.id?' <em class="capb">C</em>':''}${p.fr&&p.fr.tid===p.team?' <em class="frb">프랜차이즈</em>':''}</b><i>${posLabel(p)} · ${p.age}세 · ${st}</i><i>${money(p.sal)} · ${tContract(p)}</i></span><span class="pm-o">${rchip(rp.cur)}${condChip(p)}</span></button>`; }
function condChip(p){ const c=condOf(p); if(Math.abs(c)<2)return ''; return `<i class="cnd ${c>0?'up':'dn'}" title="컨디션 ${c>0?'+':''}${c}">${c>0?'▲':'▼'}${Math.abs(c)}</i>`; }
function roomAfter(give,get){ const b0=budget(); const sv=[]; const mv=(id,t)=>{ const p=G.players[id]; if(!p)return; sv.push([p,p.team]); p.team=t; };
  const other=get.length&&G.players[get[0]]?G.players[get[0]].team:-9; give.forEach(id=>mv(id,other)); get.forEach(id=>mv(id,G.user));
  let b1=b0; try{ b1=budget(); }finally{ sv.reverse().forEach(([p,t])=>p.team=t); } return {before:Math.round(b0.roomGoal),after:Math.round(b1.roomGoal)}; }
function dealMoney(give,get){ const inS=sum(get.map(id=>G.players[id]?G.players[id].sal:0)), outS=sum(give.map(id=>G.players[id]?G.players[id].sal:0)); const d=inS-outS; const ra=roomAfter(give,get); const cost=ra.before-ra.after;
  const yrs=id=>{ const p=G.players[id]; return p?ctrlYears(p):1; }; const commit=sum(get.map(id=>(G.players[id]?G.players[id].sal:0)*yrs(id)))-sum(give.map(id=>(G.players[id]?G.players[id].sal:0)*yrs(id)));
  return `<div class="deal-m"><span>연봉 ${d>=0?'+':''}${money(d)}/년</span><span class="small muted">남은 계약 총액 ${commit>=0?'+':''}${money(commit)}</span><span class="pill ${ra.after>=0?(cost>0?'warn':'good'):'bad'}" title="경쟁균형세 변화 포함">예산 여유 ${money(ra.before)} → ${money(ra.after)}</span></div>`; }
function dealCard(s,i,src){ const p=G.players[s.id]; if(!p)return ''; const op=asstOpinion(s.tid,s.give,[s.id]);
  return `<div class="deal"><div class="deal-h"><b>${SLOTK[s.k]} 보강${(()=>{ const q=G.players[s.id]; if(!q)return ''; const sl=pSlot(q); return sl&&sl!==s.k&&SLOTK[sl]?` <span class="small muted">(${SLOTK[sl]} 자원)</span>`:''; })()}</b><span class="small muted">리그 ${s.rank0}위${s.rank1?` → 약 ${s.rank1}위`:''}</span><span class="deal-t">${badge(s.tid,16)}${tshort(s.tid)}</span></div>
    <div class="deal-b"><div><span class="eyebrow">받는 선수</span>${pMini(p)}</div><div><span class="eyebrow">주는 선수</span>${s.give.map(id=>G.players[id]?pMini(G.players[id]):'').join('')}</div></div>
    ${dealMoney(s.give,[s.id])}${(()=>{ const mv=mgrTradeView(s.tid,s.give,[s.id]); return mv?`<p class="deal-o">${esc(mv.txt)}</p>`:''; })()}
    ${op.length?`<p class="deal-o">부단장: ${esc(op.slice(0,2).join(' '))}</p>`:''}
    <div class="row"><button class="btn small primary" data-a="tsugGo" data-v="${src}:${i}">이 조건으로 제안</button><button class="btn small" data-a="tsugEdit" data-v="${src}:${i}">조건 고치기</button></div></div>`; }
function deskCard(){ const per=period(); if(G.gameOver)return ''; const rk=slotRanks(G.user);
  const bar=`<div class="slotbar">${PSLOTS.map(k=>`<button class="sl ${rkCls(rk[k].rank)}" data-a="cmpGo" data-v="${k}"><span>${SLOTS_S[k]}</span><b>${rk[k].rank}</b></button>`).join('')}</div>`;
  const setup=!G.mgr[G.user]||(foreignOpen()&&foreignOf(G.user).length<3&&period()!=='season');
  const open=tradeOpen()&&!setup; const L=open?tradeSuggest(false):[]; UI._tsug=L; const S=open?sellSuggest():[];
  const deals=setup?`<p class="small muted">감독 선임과 외국인 선수 구성을 먼저 마치면 트레이드 추천을 드립니다.</p>`:!open?`<p class="small muted">트레이드 기간이 아닙니다(7월 31일 마감, 포스트시즌 뒤 다시 열림).</p>`:L.length?(()=>{ const oi=UI.dealOpen!=null&&UI.dealOpen<L.length?UI.dealOpen:0; return dealCard(L[oi],oi,'d')+L.map((x,i)=>{ if(i===oi)return ''; const q=G.players[x.id]; return `<button class="dealmini" data-a="dealOpen" data-v="${i}"><b>${SLOTK[x.k]} 보강</b><span>${badge(x.tid,14)} ${q?esc(q.name):''} 받고 ${x.give.map(id=>G.players[id]?esc(G.players[id].name):'').join('·')} 주기</span><i>보기</i></button>`; }).join(''); })():'<p class="small muted">지금 바로 성사될 만한 보강 트레이드가 없습니다. "다른 추천"을 눌러 보세요.</p>';
  return `<section class="card desk"><div class="row between"><h2 class="sec">단장 데스크</h2><span class="row"><button class="btn small" data-a="cmpT" data-v="">전력 비교</button><button class="btn small primary" data-a="go" data-v="trade:market">트레이드 센터</button></span></div>${deadlineBanner()}
    <div class="eyebrow">우리 전력 · 자리별 리그 순위 (누르면 비교)</div>${bar}
    ${UI.deskMsg?`<div class="note ${UI.deskOk?'':'bad'}">${esc(UI.deskMsg)}</div>`:''}
    <div class="row between"><span class="eyebrow">추천 트레이드 · 상대가 받아들일 조건</span>${open?'<button class="tc-i" data-a="tsugMore">다른 추천</button>':''}</div>${deals}
    ${S.length?`<div class="eyebrow">팔 만한 벤치 자원 · 블록에 올리면 제안이 옵니다</div><div class="sells">${S.map(x=>`<div class="sell">${pMini(x.p)}<span class="small muted">${tshort(x.t.id)} 관심</span><button class="tc-i go" data-a="listP" data-v="${x.p.id}">블록에 올리기</button></div>`).join('')}</div>`:''}
  </section>`; }
/* 전력 비교 */
function cmpView(){ const L=nextGames(1); const def=L.length?L[0].op:standOrder().order.find(o=>o.tid!==G.user).tid;
  const T=UI.cmpT!=null&&UI.cmpT!==G.user?UI.cmpT:def; const a=slotRanks(G.user), b=slotRanks(T);
  const chips=`<div class="chips cmpchips">${G.teams.filter(t=>t.id!==G.user).map(t=>`<button data-a="cmpT" data-v="${t.id}" class="${t.id===T?'on':''}">${badge(t.id,16)} ${tshort(t.id)}</button>`).join('')}</div>`;
  const side=(x,k)=>{ const ps=x.ps; const nm=ps.length?(k==='SP'||k==='RP'?`${esc(ps[0].name)} 외 ${ps.length-1}명`:esc(ps[0].name)):'공석'; const p=ps[0];
    return `<div class="cmp-s">${p?avImg(p):''}<span><b>${nm}</b><i>${x.rank}위</i></span>${rchip(Math.round(x.v))}</div>`; };
  let w=0,l=0; const rows=PSLOTS.map(k=>{ const d=a[k].v-b[k].v; const c=d>=2?'win':d<=-2?'lose':''; if(c==='win')w++; if(c==='lose')l++;
    return `<button class="cmp-r ${c}${UI.cmpK===k?' on':''}" data-a="cmpK" data-v="${k}">${side(a[k],k)}<span class="cmp-k">${SLOTS_S[k]}<i>${d>=2?'우위':d<=-2?'열세':'비슷'}</i></span>${side(b[k],k)}</button>`; }).join('');
  const hh=h2hOf(G.user,T);
  let help=''; if(UI.cmpK){ const k=UI.cmpK; const LL=tradeOpen()?tradeSuggest(false,k):[]; UI._tsugK=LL;
    help=`<section class="card"><div class="row between"><h2 class="sec">${SLOTK[k]} 보강 추천</h2><span class="small muted">우리 ${a[k].rank}위</span></div>${!tradeOpen()?'<p class="small muted">트레이드 기간이 아닙니다.</p>':LL.length?LL.map((x,i)=>dealCard(x,i,'k')).join(''):'<p class="small muted">이 자리를 바로 보강할 만한 조건이 보이지 않습니다.</p>'}</section>`; }
  return `<section class="card cmp"><div class="row between"><h2 class="sec">전력 비교</h2><span class="small muted">상대 전적 ${hh.w}승 ${hh.l}패${hh.t?` ${hh.t}무`:''}</span></div>${chips}
    <div class="cmp-hd"><span>${badge(G.user,22)} ${esc(tshort(G.user))} <b class="ok">우위 ${w}</b></span><span>${badge(T,22)} ${esc(tshort(T))} <b class="bad">우위 ${l}</b></span></div>
    <div class="cmp-rows">${rows}</div><p class="small muted">숫자는 자리별 전력(현재 능력 기준), 순위는 10개 구단 중 순위입니다. 자리를 누르면 그 자리 보강 트레이드를 찾습니다.</p></section>${help}`; }
/* ---------- FA 센터 ---------- */
function agentAv(p,expr){ const ag=agentOf(p); return avImg({persona:'agent',pid:'ag:'+ag.name+ag.firm,age:46,female:u01('agf',p.id)>.8,expr:expr||null,name:ag.name}); }
function faHeat(id){ return Object.keys((G.fa&&G.fa.ai[id])||{}).length; }
function faBig(p){ const o=G.fa.offers[p.id]; const ai=Object.keys(G.fa.ai[p.id]||{}).map(Number); const rp=scoutReport(p); const h=curLine(p);
  const st=!h?'기록 없음':p.isP?(h.outs?`ERA ${pRate(h).era.toFixed(2)} · ${ipStr(h.outs)}이닝`:'-'):(h.pa?`OPS ${fmt3(bRate(h).ops)} · ${h.hr}홈런`:'-');
  return `<div class="fab-c ${UI.faSel===p.id?'on':''}"><div class="fab-h">${avImg(p,true)}<div><span class="pill acc">${p.faGrade}등급</span><b>${esc(p.name)}</b><span>${posLabel(p)} · ${p.age}세 · ${tshort(p.faFrom)}</span><span>${st}</span></div><b class="pc-ov" style="--c:${rcol(rp.cur)}">${rp.cur}</b></div>
    <div class="fab-r"><span class="small muted">요구</span><b>${p.ask.years}년 연 ${money(p.ask.annual)}</b>${p.ask0&&p.ask.annual<p.ask0?`<span class="small muted">처음 ${money(p.ask0)}에서 낮춤</span>`:""}</div>
    <div class="fab-r"><span class="small muted">영입 경쟁</span><span class="heat"><i style="width:${Math.min(100,ai.length*20)}%"></i></span><span class="fab-t">${ai.slice(0,5).map(t=>badge(t,16)).join('')||'<span class="small muted">아직 없음</span>'}</span></div>
    ${o?`<div class="note good">우리 제시 ${o.years}년 연 ${money(o.annual)}</div>`:''}
    <button class="btn small ${UI.faSel===p.id?'':'primary'}" data-a="faSel" data-v="${p.id}">${UI.faSel===p.id?'협상실 닫기':'협상실 열기'}</button></div>`; }
function faRoom(p){ const ag=agentOf(p); const n=G.fa.neg&&G.fa.neg[p.id]; const expr=n?(n.counter?'flat':n.hot||n.deal?'smile':n.mood<40?'angry':null):null; const ai=Object.keys(G.fa.ai[p.id]||{}).map(Number); const b=budget();
  return `<section class="card faroom"><div class="tgm">${agentAv(p,expr)}<div><b>${esc(ag.name)} 에이전트 · ${esc(ag.firm)}</b><span class="small muted">${ag.style==='hard'?'깐깐한 협상가':ag.style==='soft'?'유연한 편':'보통'} · ${esc(p.name)} 담당${ai.length?` · 경쟁 구단 ${ai.length}곳: ${ai.map(t=>esc(tshort(t))).join(', ')}`:''}</span></div></div>
    ${UI.faMsg&&UI.faMsg.id===p.id?`<div class="note">${esc(UI.faMsg.t)}</div>`:''}
    <div class="row">${budgetTag(Math.round(((UI.offer&&UI.offer.id===p.id?UI.offer:(G.fa.offers[p.id]||p.ask)).annual)*b.rem))}<span class="small muted">예산 여유 ${money(b.roomGoal)}</span></div>
    ${offerForm(p)}${negPanel(p)}</section>`; }
function faCelebrate(){ const F=G.fa; if(!F||!F.results)return; G.faCel=G.faCel||[]; const r=F.results.find(x=>x.to===G.user&&x.from!==G.user&&!G.faCel.includes(x.id+':'+x.day)); if(!r)return;
  G.faCel.push(r.id+':'+r.day); if(G.faCel.length>40)G.faCel.splice(0,10); UI.stamp={title:'FA 영입',msg:`${r.name} · ${r.years}년 연 ${money(r.annual)}${r.compPlayer?` · 보상선수 ${r.compPlayer} 이탈`:''}`}; sfx('cheer_big',.7); }
function faCenter(){ return compView()+faCenter0(); }
function faCenter0(){ const F=G.fa;
  if(!faLive()){ const nx=domestic(G.user).filter(p=>!p.foreign&&p.svc>=faSvc(p)-1&&!p.faC).sort((a,b)=>ovr(b)-ovr(a));
    const res=F&&F.results&&F.results.length?`<div class="feed">${F.results.slice(0,10).map(r=>`<div class="fd"><span class="pill">${r.grade}</span><span>${esc(r.name)} · ${esc(tshort(r.from))} → <b>${esc(tshort(r.to))}</b> ${r.years}년 ${money(r.annual)}</span><i>${dsh(r.day)}</i></div>`).join('')}</div>`:'';
    return `<div class="fahero"><b>FA 시장</b><span>포스트시즌 뒤 11월 2일 공시 · 11월 6일 협상 시작 · 1월 24일(캠프 전날) 사실상 마감</span></div>
      <section class="card"><h2 class="sec">올겨울 FA가 될 우리 선수</h2>${nx.length?`<div class="fl">${nx.map(p=>`<div class="flr">${pMini(p)}<span class="small muted">예상 ${faGradeOf(p,Object.values(G.players).filter(q=>q.team!=null))}등급(FA 보상 기준)</span>${canExtend(p)?`<button class="tc-i go" data-a="player" data-v="${p.id}">다년계약 검토</button>`:'<span class="flx"></span>'}</div>`).join('')}</div>`:'<p class="small muted">없습니다.</p>'}<p class="small muted">FA가 되기 전에 비FA 다년계약으로 묶어 둘 수 있습니다.</p></section>
      ${res?`<section class="card"><h2 class="sec">지난 FA 계약</h2>${res}</section>`:''}`; }
  const ids=F.pool.filter(id=>G.players[id]&&G.players[id].team==null).sort((a,b)=>G.players[b].ask.annual-G.players[a].ask.annual);
  const open=G.day>=F.openDay; const d1=open?G.day-F.openDay+1:F.openDay-G.day; const left=KD(1,24)>G.day?KD(1,24)-G.day:dnum(G.year+1,1,24)-G.day;
  const mine=Object.keys(F.offers).length; const signed=F.results.length; const b=budget();
  const pf=UI.faPos||'all'; const list=ids.map(id=>G.players[id]).filter(p=>pf==='all'||(pf==='P'?p.isP:pf==='H'?!p.isP:p.faGrade===pf.slice(1)));
  const sel=UI.faSel&&G.players[UI.faSel]&&ids.includes(UI.faSel)?G.players[UI.faSel]:null;
  const ours=ids.map(id=>G.players[id]).filter(p=>p.faFrom===G.user);
  return `<div class="fahero live"><b>FA 시장 ${open?`협상 ${d1}일째`:`협상 시작까지 ${d1}일`}</b><span>${open?`캠프 전 마감까지 ${Math.max(0,left)}일 · `:''} 남은 FA ${ids.length}명 · 계약 ${signed}건 · 우리 제시 ${mine}건 · 예산 여유 ${money(b.roomGoal)}</span></div>
    ${sel?faRoom(sel):''}
    <section class="card"><div class="row between"><h2 class="sec">빅 네임</h2><span class="small muted">선수는 매일 제안을 비교하다가 계약합니다. 관심 구단이 많을수록 빨리 결정합니다.</span></div><div class="fabg">${ids.filter(id=>G.players[id]&&ovr(G.players[id])>=55).slice(0,3).map(id=>faBig(G.players[id])).join('')||'<p class="small muted">능력 55 이상인 대어는 남아 있지 않습니다.</p>'}</div></section>
    ${ours.length?`<section class="card"><h2 class="sec">우리 구단 FA · 잔류 협상</h2><div class="fl">${ours.map(p=>`<div class="flr">${pMini(p)}<span class="small muted">요구 ${p.ask.years}년 ${money(p.ask.annual)} · 관심 ${faHeat(p.id)}곳</span><button class="tc-i go" data-a="faSel" data-v="${p.id}">협상</button></div>`).join('')}</div></section>`:''}
    <section class="card"><div class="row between"><h2 class="sec">전체 FA</h2><div class="chips">${[['all','전체'],['H','타자'],['P','투수'],['gA','A등급'],['gB','B등급'],['gC','C등급']].map(([k,l])=>`<button data-a="faPos" data-v="${k}" class="${pf===k?'on':''}">${l}</button>`).join('')}</div></div>
      <div class="fl">${list.slice(0,40).map(p=>{ const o=F.offers[p.id]; return `<div class="flr">${pMini(p)}<span class="small"><span class="pill acc">${p.faGrade}</span> ${p.ask.years}년 ${money(p.ask.annual)}${faHeat(p.id)?` · <b style="color:#ffb547">경쟁 ${faHeat(p.id)}</b>`:''}${o?' · <b style="color:#6fe39a">제시함</b>':''}</span><button class="tc-i ${o?'':'go'}" data-a="faSel" data-v="${p.id}">협상</button></div>`; }).join('')||'<p class="small muted">조건에 맞는 FA가 없습니다.</p>'}</div>
      <p class="small muted">${compRuleTxt()}</p></section>
    <section class="card"><h2 class="sec">FA 계약 소식</h2>${F.results.length?`<div class="feed">${F.results.slice(0,14).map(r=>`<div class="fd"><span class="pill ${r.to===G.user?'good':''}">${r.grade}</span><span>${esc(r.name)} · ${esc(tshort(r.from))} → <b>${badge(r.to,14)} ${esc(tshort(r.to))}</b> ${r.years}년 ${money(r.annual)}${r.kind==='cheap'?' <span class="pill warn">헐값</span>':''}${r.ask0&&r.kind!=='cheap'&&r.annual<r.ask0*.85?` <span class="small muted">요구 ${money(r.ask0)}</span>`:''}${r.compPlayer?` · 보상 ${esc(r.compPlayer)}`:''}</span><i>${dsh(r.day)}</i></div>`).join('')}</div>`:'<p class="small muted">아직 계약 소식이 없습니다.</p>'}</section>`; }
function faHomeCard(){ if(!faLive())return ''; const F=G.fa; const ids=F.pool.filter(id=>G.players[id]&&G.players[id].team==null); if(!ids.length)return ''; const top=ids.sort((a,b)=>G.players[b].ask.annual-G.players[a].ask.annual).slice(0,3).map(id=>G.players[id]);
  return `<section class="card fahome"><div class="row between"><h2 class="sec">FA 시장 ${G.day>=F.openDay?'진행 중':'개장 임박'}</h2><button class="btn small primary" data-a="go" data-v="transfer:fa">FA 시장으로</button></div><div class="fl">${top.map(p=>`<div class="flr">${pMini(p)}<span class="small muted">경쟁 ${faHeat(p.id)}곳</span><button class="tc-i go" data-a="faOpen" data-v="${p.id}">협상</button></div>`).join('')}</div></section>`; }
/* ---------- 인물 관계도 ---------- */
const relEx=r=>r==null?null:r>=65?'smile':r<35?'angry':'flat';
const relCol=r=>r==null?'#5b6675':r>=65?'#3fbf6a':r>=45?'#e6b93b':'#e0564f';
function fanLabel(v){ return v>=70?'열광적':v>=55?'호의적':v>=40?'반신반의':v>=25?'싸늘함':'등 돌림'; }
function pressLabel(v){ return v>=70?'우호적':v>=55?'호의적':v>=40?'중립':v>=25?'비판적':'적대적'; }
function relPeople(){
  prInit(); const t=team(G.user); const B=bossOf(G.user); const m=G.mgr[G.user]; const C=G.coach?coachesOf(G.user):{};
  const top=[
    {k:'own',name:B.own.name,role:'구단주 · 모기업 회장',av:{persona:'own',pid:B.own.id,team:G.user,age:B.own.age,expr:relEx(t.trust),name:B.own.name},rel:t.trust,rl:'신뢰',lab:t.trust>=60?'두터운 신임':t.trust>=40?'지켜보는 중':t.trust>=25?'불신':'경질 검토',sub:OWNER[t.owner].label},
    {k:'ceo',name:B.ceo.name,role:'대표이사 사장',av:{persona:'staff',pid:B.ceo.id,team:G.user,age:B.ceo.age,name:B.ceo.name},rel:null,lab:'예산 창구',sub:`예산 여유 ${money(budget().roomGoal)}`}];
  const field=[];
  if(m)field.push({k:'mgr',name:m.name,role:m.interim?'감독대행':'1군 감독',av:{persona:'mgr',pid:m.id,team:G.user,age:m.age,expr:relEx(m.rel),name:m.name},rel:m.rel,rl:'관계',lab:relLabel(m.rel),sub:m.fame>=70?'스타 감독':m.ego>=70?'고집 센 편':'무난한 성격'});
  for(const r of CKEYS){ const c=C[r]; if(!c)continue; const clan=m&&c.clan===m.id;
    field.push({k:'c:'+r,name:c.name,role:CROLE[r].l,av:{persona:'coach',pid:c.id,team:G.user,age:c.age,name:c.name},rel:null,lab:clan?'감독 사단':'구단 코치',sub:`지도 ${c.sk} · 육성 ${c.dv}`}); }
  const mine=playersOf(G.user).filter(p=>!p.ys);
  const core=[...mine].sort((a,b)=>ovr(b)-ovr(a)).slice(0,6); const sad=mine.filter(p=>(p.mor??60)<40&&!core.includes(p)).sort((a,b)=>(a.mor??60)-(b.mor??60)).slice(0,4);
  const pl=[...core,...sad].map(p=>({k:'p:'+p.id,name:p.name,role:`${posLabel(p)} · ${p.age}세${p.promise&&p.promise.until>=G.day?' · 약속 중':''}`,av:p,rel:Math.round(p.mor??60),rl:'기분',lab:moodLabel(p.mor??60),sub:core.includes(p)?'핵심 전력':'불만 선수'}));
  const gms=G.teams.filter(x=>x.id!==G.user).map(x=>{ const g=gmOf(x.id); const ni=negInfo(x.id);
    return {k:'gm:'+x.id,name:g?g.name:'단장대행',role:`${x.city} ${x.nick} 단장`,av:g?{persona:'gm',pid:g.id,team:x.id,age:g.age,female:g.f,expr:relEx(x.rel),name:g.name}:{name:'?'},rel:x.rel,rl:'친분',lab:relLabel(x.rel),sub:`${g?GMT[g.trait].l:''}${g&&g.ob&&obOf(g.ob)&&obOf(g.ob).mine?' · 우리 구단 출신':''} · ${ni.free?'맞대결 중':`협상 ${ni.left}/${ni.cap}`}`,tid:x.id}; }).sort((a,b)=>b.rel-a.rel);
  const fan=Math.round(G.pr.fan), pr=Math.round(G.pr.press);
  const out=[
    {k:'fan',name:'팬',role:`${t.city} ${t.nick} 팬덤`,av:{persona:'staff',pid:'fan'+G.user,team:G.user,age:24,female:true,expr:relEx(fan),name:'팬'},rel:fan,rl:'여론',lab:fanLabel(fan),sub:`구단 인기 ${Math.round(t.pop*100)}`},
    {k:'press',name:'언론',role:'야구 담당 기자단',av:{persona:'agent',pid:'press'+G.user,team:G.user,age:38,expr:relEx(pr),name:'언론'},rel:pr,rl:'논조',lab:pressLabel(pr),sub:`최근 기사 ${(G.news||[]).filter(n=>n.d>=G.day-14).length}건`}];
  if(G.fa&&G.fa.neg&&faLive())for(const id in G.fa.neg){ const n=G.fa.neg[id]; const p=G.players[id]; if(!p||p.team!=null||n.closed)continue; const ag=agentOf(p);
    out.push({k:'ag:'+id,name:ag.name,role:`${ag.firm} · ${p.name} 담당`,av:{persona:'agent',pid:'ag'+id,age:45,expr:relEx(n.mood),name:ag.name},rel:Math.round(n.mood),rl:'분위기',lab:n.mood>=60?'우호적':n.mood>=40?'신중함':'냉랭함',sub:ag.style==='hard'?'강성 에이전트':ag.style==='soft'?'유연한 편':'보통'}); }
  return [['구단 수뇌부',top],['현장 · 코칭스태프',field],['선수단',pl],['다른 구단 단장',gms],['바깥',out]];
}
function relKey(x){ return x.k.startsWith('p:')?['player',x.k.slice(2)]:['person',x.k]; }
function dChip(k){ const d=relDelta(k); return d?`<i class="rd ${d>0?'up':'dn'}">${d>0?'▲':'▼'}${Math.abs(d)}</i>`:''; }
function relCard(x){ const [a,v]=relKey(x);
  return `<button class="rp" data-a="${a}" data-v="${v}">${avImg(x.av)}<span class="rp-t"><b>${esc(x.name)}</b><i>${esc(x.role)}</i><em>${esc(x.sub||'')}</em></span>
    <span class="rp-r">${x.rel!=null?`<span class="rp-n"><b class="num" style="color:${relCol(x.rel)}">${x.rel}</b>${dChip(x.k)}</span>${relBar(x.rel)}<i>${esc(x.rl)} · ${esc(x.lab)}</i>`:`<i class="rp-tag">${esc(x.lab)}</i>`}</span></button>`; }
/* 관계 지도: 나를 가운데 두고 안쪽은 구단 사람, 바깥 오른쪽은 다른 구단 단장 */
function relMap(groups){ const by={}; for(const [,L] of groups)for(const x of L)by[x.k]=x;
  const cx=158, cy=214; const nodes=[];
  const inner=[['own',-90],['ceo',-138],['mgr',180],['c:hc',142],[ (groups[2][1][0]||{}).k,104],['fan',58],['press',-42]];
  for(const [k,deg] of inner){ const x=by[k]; if(!x)continue; const r=deg===-90?100:94; nodes.push({x,px:cx+r*1.02*Math.cos(deg*Math.PI/180),py:cy+r*1.12*Math.sin(deg*Math.PI/180),s:22}); }
  const g=groups[3][1].slice().sort((a,b)=>a.tid-b.tid); g.forEach((x,i)=>{ const dy=-184+i*(368/Math.max(1,g.length-1)); nodes.push({x,gm:1,px:cx+82+58*Math.sqrt(Math.max(0,1-(dy/196)**2)),py:cy+dy,s:18}); });
  const line=n=>`<line x1="${cx}" y1="${cy}" x2="${n.px.toFixed(1)}" y2="${n.py.toFixed(1)}" stroke="${relCol(n.x.rel)}" stroke-opacity="${n.x.rel==null?.35:.75}" stroke-width="${n.x.rel==null?1.2:1+Math.max(0,n.x.rel-30)/22}" ${n.x.rel==null?'stroke-dasharray="3 3"':''}/>`;
  const node=(n,i)=>{ const [a,v]=relKey(n.x); const src=faceSVG(n.x.av); const lab=n.x.k.startsWith('gm:')?tshort(n.x.tid):n.x.k==='c:hc'?'수석코치':n.x.k==='mgr'?'감독':n.x.k==='own'?'구단주':n.x.k==='ceo'?'사장':n.x.name;
    return `<g class="rm-n" data-a="${a}" data-v="${v}"><circle cx="${n.px.toFixed(1)}" cy="${n.py.toFixed(1)}" r="${n.s+2.5}" fill="#0f141a" stroke="${relCol(n.x.rel)}" stroke-width="2.5"/>
      ${src?`<image href="${src}" x="${(n.px-n.s).toFixed(1)}" y="${(n.py-n.s).toFixed(1)}" width="${n.s*2}" height="${n.s*2}" clip-path="url(#rmc${i})"/>`:''}
      <clipPath id="rmc${i}"><circle cx="${n.px.toFixed(1)}" cy="${n.py.toFixed(1)}" r="${n.s}"/></clipPath>
      <text x="${(n.gm?n.px+n.s+6:n.px).toFixed(1)}" y="${(n.gm?n.py+4:n.py+n.s+14).toFixed(1)}" text-anchor="${n.gm?'start':'middle'}" class="rm-l">${esc(lab)}${n.x.rel!=null?` <tspan fill="${relCol(n.x.rel)}">${n.x.rel}</tspan>`:''}</text></g>`; };
  const t=team(G.user);
  return `<svg class="relmap" style="max-width:520px" viewBox="0 0 400 432" role="img" aria-label="관계 지도">
    <ellipse cx="${cx}" cy="${cy}" rx="96" ry="105" fill="none" stroke="#2a333e" stroke-dasharray="2 4"/>
    <text x="8" y="18" class="rm-g">구단 안</text><text x="392" y="18" text-anchor="end" class="rm-g">다른 구단 단장</text>
    ${nodes.map(line).join('')}
    <circle cx="${cx}" cy="${cy}" r="27" fill="${tpal(t)[0]}" stroke="#e8ecf3" stroke-width="2"/><text x="${cx}" y="${cy-2}" text-anchor="middle" class="rm-me">단장</text><text x="${cx}" y="${cy+12}" text-anchor="middle" class="rm-me2">${esc(t.city)}</text>
    ${nodes.map(node).join('')}</svg>
    <p class="small muted">선 색은 관계(초록 좋음 · 노랑 보통 · 빨강 나쁨), 굵기는 관계의 깊이입니다. 점선은 수치로 관리하지 않는 관계입니다. 얼굴을 누르면 인물 카드가 열립니다.</p>`; }
function relView(){ const groups=relPeople();
  const warn=[]; const t=team(G.user); const m=G.mgr[G.user];
  if(t.trust<25)warn.push(`구단주 신뢰 ${t.trust}: 시즌 종료 때 12 아래면 경질됩니다.`); if(m&&m.rel<35)warn.push(`감독과의 관계 ${m.rel}: 콜업·말소 요청과 운영 기조가 잘 먹히지 않습니다.`);
  const sad=groups[2][1].filter(x=>x.rel<40).length; if(sad)warn.push(`불만 선수 ${sad}명: 기분이 낮으면 경기력이 떨어집니다.`);
  return csec('관계 지도',relMap(groups))+(warn.length?`<div class="note bad">${warn.map(esc).join('<br>')}</div>`:'')
    +groups.filter(([,L])=>L.length).map(([h,L])=>csec(h,`<div class="rpg">${L.map(relCard).join('')}</div>`)).join(''); }
/* 홈: 핵심 관계 한 줄 */
function relStrip(){ if(G.gameOver||G.unemp)return ''; const gs=relPeople(); const pick2=k=>{ for(const [,L] of gs)for(const x of L)if(x.k===k)return x; return null; };
  const L=['own','mgr','fan','press'].map(pick2).filter(Boolean); const g=gs[3][1]; if(g.length)L.push(g[0],g[g.length-1]);
  return `<section class="card relstrip"><div class="row between"><h2 class="sec">관계</h2><button class="btn small" data-a="go" data-v="club:rel">관계도</button></div>
    <div class="rs">${L.map(x=>{ const [a,v]=relKey(x); return `<button data-a="${a}" data-v="${v}">${avImg(x.av)}<b>${esc(x.k==='own'?'구단주':x.k==='mgr'?'감독':x.k==='fan'?'팬':x.k==='press'?'언론':tshort(x.tid)+' 단장')}</b><span style="color:${relCol(x.rel)}">${x.rel}${dChip(x.k)}</span></button>`; }).join('')}</div></section>`; }
/* 인물 카드 시트 */
function personSheet(k){ const gs=relPeople(); let x=null; for(const [,L] of gs)for(const y of L)if(y.k===k)x=y; if(!x)return '';
  const t=team(G.user); const sec=(h,b)=>b?`<div class="ps-s"><div class="eyebrow">${h}</div>${b}</div>`:''; const li=a=>`<ul class="ps-l">${a.map(s=>`<li>${s}</li>`).join('')}</ul>`;
  const btn=(l,a,v,pri)=>`<button class="btn ${pri?'primary':''}" data-a="${a}" data-v="${v}">${l}</button>`;
  let info='', moves=[], fx=[], acts=[], recent='';
  if(k==='own'){ const B=bossOf(G.user); const s=goalStatus(); const w=OWNER[t.owner].w;
    info=`<p>${esc(OWNER[t.owner].msg)} ${esc(OWNTRAIT[t.owner])}</p><p class="small muted">평가 비중 · 순위 ${w[0]} · 재정 ${w[2]} · 여론 ${w[3]}</p>${s?`<p class="small">목표: ${s.rank.t}위 이내 ${s.rank.ok==null?'':s.rank.ok?'(달성 중)':'(미달)'} · 팬 여론 ${s.fan.t} 이상 ${s.fan.ok?'(달성 중)':'(미달)'}</p>`:''}`;
    moves=['매달 말 보고: 순위, 팬 여론, 언론 논조, 예상 적자 보전','시즌 결산: 목표 달성 여부와 언론 논조가 크게 반영'];
    fx=[`모기업 지원 한도가 신뢰에 따라 달라집니다. 지금 한도 ${money(supportCap(t))}`,'시즌이 끝날 때 12 아래면 경질됩니다'];
    recent=(G.ownerLog||[]).slice(0,3).map(o=>`<div class="ps-r"><span class="pill ${o.mood==='만족'?'good':o.mood==='관망'?'':'bad'}">${o.m}월 ${o.mood}</span> <span class="small">신뢰 ${o.trust} (${o.delta>=0?'+':''}${o.delta})</span></div>`).join('');
    acts=[btn('구단주에게 요청','go','club:owner',1),btn('재정','go','club:fin')]; }
  else if(k==='ceo'){ const B=bossOf(G.user); const b=budget();
    info=`<p>${esc(B.ceo.car)}. 구단주의 뜻을 단장에게 전하고, 연봉·운영비 집행을 맡습니다.</p><p class="small">올해 예산 여유 <b>${money(b.roomGoal)}</b> · 지원 한도 ${money(supportCap(t))}</p>`;
    moves=['사장과의 관계는 따로 수치가 없습니다. 구단주 신뢰가 오르면 사장이 쓸 수 있는 돈(지원 한도)도 커집니다'];
    fx=['예산을 넘겨 쓰면 구단주 재정 평가가 나빠집니다'];
    acts=[btn('재정','go','club:fin',1),btn('구단주·목표','go','club:owner')]; }
  else if(k==='mgr'){ const m=G.mgr[G.user]; const C=coachesOf(G.user); const clan=CKEYS.filter(r=>C[r]&&C[r].clan===m.id).map(r=>C[r].name);
    info=`<p class="small">${esc(m.career||'')} · ${m.age}세 · 계약 ${m.yrs}년 남음 · 연봉 ${money(m.sal)}</p><p class="small muted">자존심 ${m.ego} · 명성 ${m.fame} · 작전 ${m.small} · 불펜 운용 ${m.pen} · 젊은 선수 기용 ${m.youth}</p>${clan.length?`<p class="small">사단: ${clan.map(esc).join(', ')}</p>`:''}`;
    moves=['트레이드: 포지션별 전력이 좋아지면 오르고, 약해지거나 주전·유망주(육성형 감독)를 내주면 내려갑니다','결정 이벤트: 연패 때 감독을 믿어 주면 오르고, 출전을 약속하는 등 감독 권한에 끼어들면 내려갑니다','보강 약속: 지키면 크게 오르고, 어기면 크게 내려갑니다','운영 기조 지시: 감독이 받아들이면 +2, 거부하면 -6'];
    fx=['선수단 경기력 보정(관계 55 기준, 최대 +0.4 / -0.5)','콜업·말소 요청, 운영 기조, 휴식·투수 관리 지시를 따르는 정도','관계 30 이상이면 선수 카드에서 감독의 장래 예측을 볼 수 있음','자존심이 높고 명성이 높을수록 같은 관계에서도 덜 따릅니다'];
    acts=[btn('감독·요청','go','staff:mreq',1),btn('코치진','go','staff:coach')];
    recent=(G.mail||[]).filter(x=>x.from==='감독실').slice(0,3).map(x=>`<div class="ps-r small">${dsh(x.day)} · ${esc(x.subj)}</div>`).join(''); }
  else if(k.startsWith('c:')){ const r=k.slice(2); const c=coachesOf(G.user)[r]; const m=G.mgr[G.user];
    info=`<p class="small">${esc(c.car)} · ${c.age}세 · 연봉 ${money(c.sal)}</p><p>${esc(CROLE[r].d)}</p><p class="small">지도력 ${c.sk} · 육성 ${c.dv}</p>`;
    moves=[c.clan&&m&&c.clan===m.id?`${m.name} 감독 사단입니다. 감독이 바뀌면 함께 떠날 수 있습니다`:'감독 사단이 아닌 구단 코치입니다'];
    fx=[CROLE[r].g===2?'퓨처스 선수 성장 속도':'1군 경기력과 성장 속도'];
    acts=[btn('코치진','go','staff:coach',1)]; }
  else if(k.startsWith('gm:')){ const tid=+k.slice(3); const o=team(tid); const g=gmOf(tid); const ni=negInfo(tid); const c=(G.gmc||{})[tid]||{};
    info=`<p class="small">${g?`${g.age}세 · ${esc(g.car)} · ${g.since}년부터 재임`:'단장대행 체제'}${g&&g.ob?obTag(g.ob):''}</p>${g&&g.ob&&obOf(g.ob)?`<p class="small muted">선수 시절: ${esc(tshort(obOf(g.ob).team))} ${esc(obOf(g.ob).pos)} · ${obOf(g.ob).seasons}시즌 · 통산 WAR ${obOf(g.ob).war}</p>`:''}${g?`<p><span class="pill acc">${GMT[g.trait].l}</span> ${esc(GMT[g.trait].d)}</p>`:''}<p class="small">${esc(needText(tid))}</p>
      <p class="small">${ni.free?'<b style="color:#6fe39a">맞대결 중 · 협상 제한 없음</b>':`이번 달 협상 <b>${ni.left}</b>/${ni.cap} ${ni.cap>NEG_MONTH?' (기본 4회, 친분 70 이상 +1)':ni.cap<NEG_MONTH?' (기본 4회, 친분 30 미만 -1)':''}`}</p>`;
    moves=['안부 연락(2주 1회) 보통 +1~2 · 식사(한 달 1회, 1천만 원) 보통 +3~5. 의리파는 더 오르고 강경파는 덜 오릅니다','거래 성사 +2 · 헐값 제안 -2','강경파 단장에게 한 달 3번 이상 거절당하면 -1'];
    fx=['친분이 높을수록 같은 선수를 덜 비싸게 넘깁니다','친분 70 이상이면 월 협상 1회 추가, 30 미만이면 1회 감소','친분 35 미만이면 상대가 원하는 것을 읽기 어렵습니다'];
    const tr=(G.trades||[]).filter(z=>z.with===tid).slice(-3).reverse(); recent=tr.map(z=>`<div class="ps-r small">${z.y} ${dsh(z.d)} · 보냄 ${esc(z.give.join(', ')||'없음')} ↔ 받음 ${esc(z.get.join(', ')||'없음')}</div>`).join('');
    acts=[btn('협상 테이블','tpartnerGo',tid,1),`<button class="btn" data-a="gmCall" data-v="${tid}" ${c.call!=null&&c.call>G.day-14?'disabled':''}>안부 연락</button>`,`<button class="btn" data-a="gmMeal" data-v="${tid}" ${c.meal!=null&&c.meal>G.day-30?'disabled':''}>식사 (1천만)</button>`]; }
  else if(k==='fan'){ const g=G.goals;
    info=`<p>팬 여론 ${x.rel} · ${x.lab}. 구단 인기 ${Math.round(t.pop*100)}.</p>${g&&g.y===G.year?`<p class="small">구단주 목표: 여론 ${g.fan} 이상</p>`:''}`;
    moves=['승패와 연승·연패','트레이드·FA 평가 기사, 신인 활약, 외국인 부진','콜업 여론 같은 결정 이벤트, 팬 행사'];
    fx=['관중 수입과 광고·상품 수입','구단주 월말 평가와 시즌 목표'];
    acts=[btn('언론·여론','go','club:media',1),btn('마케팅','go','club:mkt')]; }
  else if(k==='press'){ info=`<p>언론 논조 ${x.rel} · ${x.lab}.</p>`;
    moves=['기사 하나하나가 논조를 움직입니다. 우호적 기사 +, 비판 기사 -','감독·선수의 불만 표출, 트레이드 평점이 기사가 됩니다'];
    fx=['스폰서(광고) 수입','시즌 결산 때 구단주 신뢰에 직접 반영 (50 기준 10점당 신뢰 1)'];
    recent=(G.news||[]).slice(0,3).map(n=>`<div class="ps-r small">${dsh(n.d)} · ${esc(n.o)} · ${esc(n.t)}</div>`).join('');
    acts=[btn('언론·여론','go','club:media',1)]; }
  else if(k.startsWith('ag:')){ const id=+k.slice(3); const p=G.players[id]; const ag=agentOf(p); const n=negOf(id);
    info=`<p class="small">${esc(ag.firm)} · ${esc(p.name)} 담당 · ${ag.style==='hard'?'강성':ag.style==='soft'?'유연':'보통'}</p><p class="small">협상 ${n.rounds}/4회 사용</p>`;
    moves=['요구에 가까운 제시는 분위기를 올리고, 큰 차이는 크게 떨어뜨립니다','25 아래로 떨어지면 우리와의 협상을 끝냅니다'];
    fx=['역제안을 줄지, 협상을 접을지'];
    acts=[btn('협상실','faOpen',id,1)]; }
  const d=relDelta(k);
  return `<div class="scrim" data-a="closeSheet"><div class="sheet gut ps" data-stop="1" role="dialog" aria-label="인물 카드">
    <div class="sheet-head"><div class="row" style="flex-wrap:nowrap">${avImg(x.av,true)}<div><div class="eyebrow">${esc(x.role)}</div><h2 class="sec">${esc(x.name)}</h2><span class="small muted">${esc(x.sub||'')}</span></div></div><button class="x" data-a="closeSheet" aria-label="닫기">×</button></div>
    ${x.rel!=null?`<div class="ps-rel"><b class="num" style="color:${relCol(x.rel)}">${x.rel}</b><div>${relBar(x.rel)}<span>${esc(x.rl)} · ${esc(x.lab)}${d?` · 최근 4주 ${d>0?'+':''}${d}`:''}</span></div></div>`:`<div class="ps-rel"><span class="rp-tag">${esc(x.lab)}</span></div>`}
    ${info}${sec('관계를 움직이는 것',moves.length?li(moves.map(esc)):'')}${sec('관계가 주는 영향',fx.length?li(fx.map(esc)):'')}${sec('최근',recent)}
    <div class="btns">${acts.join('')}</div>${UI.personMsg?`<p class="note">${esc(UI.personMsg)}</p>`:''}</div></div>`; }

/* ---------- OB·레전드 ---------- */
function obOf(id){ return id&&G.ob?G.ob.find(o=>o.id===id):null; }
function obTag(id){ const o=obOf(id); if(!o)return ''; return o.mine?` <span class="pill good">우리 구단 출신</span>`:` <span class="pill">${esc(tshort(o.team))} 출신</span>`; }
function obAv(ob,w,big){ const per=w.k==='mgr'?'mgr':w.k==='coach'?'coach':w.k==='gm'?'gm':w.k==='scout'||w.k==='front'?'staff':ob.path==='media'?'agent':'staff'; const pid='obv'+ob.id+per; G.obFace=G.obFace||{}; G.obFace[pid]=ob.fid;
  return avImg({persona:per,pid,team:w.tid??null,age:ob.age,name:ob.name},big); }
function obView(){ obInit(); const t=team(G.user); const RN=G.retNos||[];
  const wall=RN.length?`<div class="rnw">${RN.map(r=>`<div class="rn"><b>${r.no}</b><span>${esc(r.name)}</span><i>${r.y}년 지정</i></div>`).join('')}</div>`:'<p class="small muted">아직 영구결번이 없습니다. 우리 구단에서 8시즌 이상 뛰고 WAR 20 이상을 남긴 선수가 은퇴하면 지정할 수 있습니다.</p>';
  const cand=(G.legends||[]).map((r,i)=>({r,i})).filter(x=>x.r.canRetNo&&!x.r.retNo);
  const candH=cand.length?`<div class="eyebrow" style="margin-top:10px">영구결번 후보</div>${cand.map(({r,i})=>`<div class="obr"><b class="num">${r.no}</b><span><b>${esc(r.name)}</b><i>${r.pos} · ${r.y}년 은퇴 · 우리 구단 ${r.mine.ys}시즌 WAR ${r.mine.war}</i></span><button class="btn small primary" data-a="retNo" data-v="${i}">영구결번 지정</button></div>`).join('')}`:'';
  const mine=G.ob.filter(o=>o.mine).map(o=>({o,w:obWhere(o)})).sort((a,b)=>(b.o.retNo?1:0)-(a.o.retNo?1:0)||b.o.mineWar-a.o.mineWar||b.o.war-a.o.war);
  const mgrC=new Set(obMgrCands().map(o=>o.id));
  const act=(o,w)=>{ if(w.k==='free'||w.k==='wait'&&o.path==='media'){ if(mgrC.has(o.id))return `<button class="btn small primary" data-a="obAct" data-v="${o.id}:mgr">감독 후보로</button>`;
      if(w.k==='free'&&(o.path==='coach'||o.path==='media'&&o.my>=3))return `<button class="btn small primary" data-a="obAct" data-v="${o.id}:coach">코치로 영입</button>`;
      if(w.k==='free'&&o.path==='scout')return `<button class="btn small primary" data-a="obAct" data-v="${o.id}:scout" ${G.scouts.length>=SCOUT_MAX?'disabled':''}>스카우트로 영입</button>`;
      if(w.k==='free'&&o.path==='front')return `<button class="btn small" data-a="obAct" data-v="${o.id}:front">프런트로 채용</button>`; }
    if(w.k==='front'&&w.tid!==G.user&&o.path!=='media')return `<button class="btn small" data-a="obAct" data-v="${o.id}:front">우리 프런트로</button>`; return ''; };
  const row=({o,w})=>`<div class="obc">${obAv(o,w)}<div class="obc-t"><b>${esc(o.name)}${o.retNo?` <span class="pill acc">${o.no||''}번 영구결번</span>`:''}${o.hof?' <span class="pill warn">명예의 전당</span>':''}</b>
      <i>${esc(o.pos)} · ${o.retY}년 은퇴 · ${o.age}세 · 우리 구단 ${o.ys}시즌${o.mineWar?` · WAR ${o.mineWar}`:''}</i>
      <span class="obc-w ${w.k}">${esc(w.t)}${w.k==='coach'||w.k==='mgr'?` · 지도자 ${o.cy}년차`:w.k==='scout'||w.k==='front'?` · ${o.sy+o.fy}년차`:''}</span>
      <em>${OBPATH[o.path]}의 길${o.aim?` · ${o.aim==='mgr'?'감독':'단장'}을 꿈꿈`:''}${o.bond>=20?' · 구단과 각별함':''}</em></div><div class="obc-a">${act(o,w)}</div></div>`;
  const league=G.ob.map(o=>({o,w:obWhere(o)})).filter(x=>(x.w.k==='mgr'||x.w.k==='gm'||x.w.k==='coach')&&x.w.tid!==G.user).sort((a,b)=>({gm:0,mgr:1,coach:2}[a.w.k]-{gm:0,mgr:1,coach:2}[b.w.k])||(b.o.mine?1:0)-(a.o.mine?1:0));
  return csec('영구결번',wall+candH)
    +csec(`${t.city} ${t.nick} 출신 OB ${mine.length}명`,(mine.length?`<div class="obg">${mine.map(row).join('')}</div>`:'<p class="small muted">아직 기록된 OB가 없습니다.</p>')+`<p class="small muted">은퇴한 선수는 지도자, 스카우트, 프런트, 해설위원의 길을 갑니다. 지도자 경력이 쌓이면 감독 후보가 되고, 프런트·스카우트 경력이 쌓이면 다른 구단 단장이 되기도 합니다. 우리 구단 출신이 다른 구단 단장이 되면 첫 친분이 높게 시작합니다. 은퇴식을 열어 주거나 구단에 남겨 둔 선수는 훗날 돌아올 가능성이 커집니다.</p>`)
    +csec('리그의 OB 출신 지도자·단장',league.length?`<div class="obg">${league.slice(0,24).map(({o,w})=>`<div class="obc">${obAv(o,w)}<div class="obc-t"><b>${esc(o.name)}${o.mine?' <span class="pill good">우리 구단 출신</span>':''}</b><i>${esc(tshort(o.team))} ${esc(o.pos)} 출신 · 통산 WAR ${o.war}</i><span class="obc-w ${w.k}">${esc(w.t)}</span></div></div>`).join('')}</div>`:'<p class="small muted">아직 없습니다.</p>'); }

/* ---------- 진기록 ---------- */
const FEATI={cyc:'◎',hr4:'4',hr3:'3',h6:'6',h5:'5',rbi8:'타',pg:'P',nh:'N',tnh:'N',k15:'K',cg0:'완',r20:'20',hs:'연',mile:'★',s3030:'30',s4040:'40',hr50:'50',h200:'200',avg400:'.4',tcB:'3',tcP:'3',w20:'20',sv40:'40',k200:'K',era1:'1',srec:'신',ovs:'해'};
function featView(){ const F=G.feats||[]; const f=UI.ftf||'all'; const yr=UI.fy||'all';
  const ys=[...new Set(F.map(x=>x.y))].sort((a,b)=>b-a);
  const L=F.filter(x=>(yr==='all'||x.y===+yr)&&(f==='all'||f==='mine'&&x.tid===G.user||f==='maj'&&x.maj||f==='g'&&FEATG[x.k]==='g'||f==='s'&&!FEATG[x.k]||f==='m'&&x.k==='mile'));
  const SB=G.sbest||{}; const sbl=[['hr','홈런',v=>v],['rbi','타점',v=>v],['h','안타',v=>v],['sb','도루',v=>v],['avg','타율',v=>fmt3(v)],['w','승',v=>v],['sv','세이브',v=>v],['so','탈삼진',v=>v],['era','평균자책점',v=>(+v).toFixed(2)]];
  const best=`<div class="sbbest">${sbl.filter(([k])=>SB[k]).map(([k,l,fm])=>{ const b=SB[k]; const p=G.players[b.pid]; return `<div class="sb"${p?` data-a="player" data-v="${b.pid}" role="button" tabindex="0"`:''}><i>시즌 최다 ${l}${k==='era'?'(최저)':k==='avg'?'(최고)':''}</i><b class="num">${fm(b.v)}</b><span>${b.tid!=null?badge(b.tid,13):''} ${esc(b.name)} · ${b.y}</span></div>`; }).join('')}</div>`;
  const cnt={}; for(const x of F.filter(x=>x.y===G.year))cnt[x.k]=(cnt[x.k]||0)+1;
  const row=x=>{ const p=x.pid!=null?G.players[x.pid]:null; const ob=!p&&x.pid!=null&&G.ob?G.ob.find(o=>o.fid===x.pid):null;
    return `<div class="ft ${x.maj?'maj':''} ${x.tid===G.user?'me':''}"${p?` data-a="player" data-v="${x.pid}" role="button" tabindex="0"`:''}><span class="ft-i k-${x.k}">${FEATI[x.k]||'·'}</span>${p?avImg(p):x.tid!=null?badge(x.tid,30):''}<div><b>${esc(x.name)}${x.tid!=null&&p?` <span class="small muted">${esc(tshort(x.tid))}</span>`:''}${!p&&x.pid!=null?` <span class="small muted">${ob?'은퇴':'리그 떠남'}</span>`:''}</b><span><em class="pill ${x.maj?'acc':''}">${FEATK[x.k]}</em> ${esc(x.txt.startsWith(FEATK[x.k])?x.txt.slice(FEATK[x.k].length).trim():x.txt)}</span></div><i>${x.y}<br>${x.vs?esc(x.vs.split(' vs ')[0]):'시즌'}</i></div>`; };
  return csec('리그 단일 시즌 최고 기록',best+'<p class="small muted">2025시즌부터 이 리그에서 나온 기록입니다. 깨지면 "시즌 신기록"으로 남습니다.</p>')
   +csec(`진기록 · ${F.length}건`,`<div class="chips">${[['all','전체'],['maj','대기록'],['mine','우리 팀'],['g','경기'],['s','시즌'],['m','통산 이정표']].map(([k,l])=>`<button data-a="featF" data-v="${k}" class="${f===k?'on':''}">${l}</button>`).join('')}</div>
      <div class="chips">${['all',...ys].map(y=>`<button data-a="featY" data-v="${y}" class="${String(yr)===String(y)?'on':''}">${y==='all'?'전 시즌':y}</button>`).join('')}</div>
      ${Object.keys(cnt).length?`<p class="small muted">${G.year}시즌: ${Object.entries(cnt).map(([k,n])=>`${FEATK[k]} ${n}`).join(' · ')}</p>`:''}
      <div class="ftl">${L.slice(0,150).map(row).join('')||'<p class="small muted">조건에 맞는 기록이 없습니다.</p>'}</div>`); }

/* ---------- 해외파 · 대체 외국인 관찰 ---------- */
function lineTxt(h,isP){ if(!h)return '-'; if(isP){ const e=h.outs?h.er*27/h.outs:0; return `${ipStr(h.outs)}이닝 · ERA ${e.toFixed(2)} · ${h.so}K`; } const r=bRate(h); return `${h.pa}타석 · 타율 ${fmt3(r.avg)} · ${h.hr}홈런 · OPS ${fmt3(r.ops)}`; }
function fwatchBox(asia){ const W=(G.fwatch||[]).map(w=>({w,p:G.players[w.id]})).filter(x=>x.p&&(x.p.foreign==='아시아')===asia);
  const n=(G.fwatch||[]).length;
  return `<section class="card fwbox"><div class="row between"><h2 class="sec">대체 후보 관찰 명단</h2><span class="small muted">${n}/8명</span></div>
    ${W.length?`<div class="fwl">${W.map(({w,p})=>{ const rp=scoutReport(p); return `<div class="fw" data-a="player" data-v="${p.id}" role="button" tabindex="0">${avImg(p)}<div><b>${esc(p.name)} <span class="small muted">${esc(p.nat)} · ${p.age}세 · ${posLabel(p)}</span>${w.auto?' <span class="pill">스카우트 추천</span>':''}</b>
      <span class="small">${p.now&&p.now.y===G.year?`올해 ${esc(p.now.lvl||'')} ${lineTxt(p.now,p.isP)}`:`지난 시즌 ${esc(p.prevLvl||'')} ${lineTxt(p.prev,p.isP)}`}</span>
      <span class="fwk"><i style="width:${w.k}%"></i></span><em>스카우트 파악도 ${w.k}% · 평가 ${rp.cur??'-'}${rp.ofp?`/${rp.ofp}`:''} · ${money(p.ask)}</em>${(()=>{ const same=foreignOf(G.user).filter(q=>q.foreign===p.foreign&&(asia||q.isP===p.isP)).sort((a,b)=>ovr(a)-ovr(b))[0]; const n=fInterest(p); const bits=[]; if(same&&rp.cur!=null){ const d=rp.cur-Math.round(ovr(same)); bits.push(`우리 ${esc(same.name)}(${Math.round(ovr(same))})보다 ${d>0?'+':''}${d}`); } if(n)bits.push(`<b class="${n>=2?'bad':''}">${n}개 구단 관심</b>`); return bits.length?`<span class="small fw-cmp">${bits.join(' · ')}</span>`:''; })()}</div><button class="tc-i" data-a="fwatch" data-v="${p.id}">빼기</button></div>`; }).join('')}</div>`
      :`<p class="small muted">아래 후보 카드의 "관찰"을 누르면 명단에 올라갑니다.</p>`}
    <p class="small muted">관찰 중인 후보는 매주 스카우트 보고가 쌓여 평가 오차가 줄어듭니다(해외 스카우트망 단계와 파견 스카우트 능력이 높을수록 빠름). 시장 후보가 바뀔 때도 사라지지 않습니다. 외국인 시장은 10개 구단이 함께 씁니다. 다른 구단이 먼저 계약하면 사라지고, 여러 구단이 노리는 선수는 몸값이 오릅니다. 시즌 중에는 MLB 콜업이나 일본 계약으로도 빠질 수 있습니다. 우리 외국인이 부상이나 부진에 빠지면 스카우트팀장이 같은 유형의 관찰 후보를 올려 줍니다.</p></section>`; }
function abroadView(){ const A=G.abroad||[]; const f=UI.abf||'all';
  const L=A.filter(a=>f==='all'||f==='mine'&&a.from===G.user||f==='kr'&&!a.foreign||f==='fo'&&a.foreign);
  const mine=domestic(G.user).map(p=>({p,m:mlbOf(p)})).filter(x=>x.p.age<=33&&ovr(x.p)>=56&&x.m>=35).sort((a,b)=>b.m-a.m).slice(0,8);
  const row=a=>{ const last=a.lines[a.lines.length-1]; const yrs=(a.back?a.backY:G.year)-a.y;
    return `<div class="abr">${a.from!=null?badge(a.from,26):''}<div><b>${esc(a.name)} <span class="small muted">${esc(a.pos)}${a.foreign?` · 외국인`:''}</span></b>
      <span class="small">${a.y}년 ${a.how} → <b>${esc(a.club)}(${a.lg})</b> ${a.yrs}년 ${a.amt*a.yrs}만 달러${a.fee?` · 포스팅 비용 ${money(a.fee)}`:''}</span>
      ${a.lines.length?`<span class="small muted">${a.lines.slice(-3).map(l=>`${l.y} ${esc(l.lvl)}: ${lineTxt(l,a.isP)}`).join('<br>')}</span>`:''}</div>
      <span class="pill ${a.back?'good':a.foreign?'':'acc'}">${a.back?`${a.backY} 복귀`:a.foreign?'역수출':`해외 ${Math.max(0,yrs)}년차`}</span></div>`; };
  return csec('우리 선수의 해외 진출 의지',mine.length?`<div class="mlbl">${mine.map(({p,m})=>`<div class="mlb" data-a="player" data-v="${p.id}" role="button" tabindex="0">${avImg(p)}<div><b>${esc(p.name)} <span class="small muted">${posLabel(p)} · ${p.age}세 · 서비스 ${p.svc}년</span></b>
      <span class="fwk"><i style="width:${m}%;background:${m>=55?'#ff8a5b':'#e6b93b'}"></i></span><em>의지 ${m}${m>=55?' · 비시즌에 포스팅을 요청할 수 있음':''} · ${p.svc>=9?'해외 FA 가능':p.svc>=7?'포스팅 자격 있음':`포스팅까지 ${7-p.svc}년`}${p.postPromise?` · ${p.postPromise}년 포스팅 약속`:''}</em></div></div>`).join('')}</div>`:'<p class="small muted">해외 진출 의지가 눈에 띄는 선수가 없습니다.</p>')
    +`<p class="small muted">야망이 큰 선수일수록 의지가 높고, 활약할 때 언론이 "메이저리그 스카우트 집결" 같은 기사를 내면 더 오릅니다. 서비스 7년부터 구단 동의로 포스팅, 9년부터 해외 FA가 가능합니다. 포스팅이 성사되면 계약 보장액에 따라 포스팅 비용(2,500만 달러까지 20%, 다음 2,500만 달러 17.5%, 그 이상 15%)을 받습니다.</p>`
    +csec(`해외파 · 역수출 ${A.length}명`,`<div class="chips">${[['all','전체'],['mine','우리 구단 출신'],['kr','국내 선수'],['fo','외국인 역수출']].map(([k,l])=>`<button data-a="abf" data-v="${k}" class="${f===k?'on':''}">${l}</button>`).join('')}</div>
      <div class="abl">${L.map(row).join('')||'<p class="small muted">아직 해외로 나간 선수가 없습니다.</p>'}</div>`); }

/* ---------- 세부 능력치 · 레이더 · 성장 차트 ---------- */
const PITCHES=['슬라이더','커브','체인지업','포크','커터','투심','스위퍼'];
function detailOf(p,rp){ const tv={}, tf={}; for(const t of rp.tools){ tv[t.k]=t.cur; tf[t.k]=t.fut; } const id=p.id; const o=(k,s)=>hn('dt'+k,id)*(s||4);
  const c=v=>clamp(Math.round(v),20,80); const pers=p.pers||{pro:12,amb:12,loy:12,temp:12}; const ps=v=>c(20+(v-4)/16*60);
  const G2=[];
  if(!p.isP){ const L=p.bt==='좌'?-4:p.bt==='양'?0:2, Rr=p.bt==='좌'?2:p.bt==='양'?0:-1;
    G2.push(['타격',[['평균 타구속도',evOf(p)+'km/h','t'],['컨택',c(tv.con)],['갭 파워',c((tv.con+tv.pow)/2+o('gap'))],['홈런 파워',c(tv.pow)],['선구안',c(tv.eye)],['삼진 회피',c(tv.con*.6+tv.eye*.4+o('k'))],['좌투수 상대',c(tv.con+L+o('vl',3))],['우투수 상대',c(tv.con+Rr+o('vr',3))]]]);
    G2.push(['주루',[['스피드',c(tv.spd)],['도루',c(tv.spd+o('sb'))],['주루 센스',c(tv.spd*.6+tv.eye*.4+o('br'))]]]);
    const arm=['C','RF','SS','3B'].includes(p.pos)?3:p.pos==='1B'?-4:0;
    G2.push(['수비',[['수비 범위',c(tv.def+(['SS','CF'].includes(p.pos)?2:0)+o('rng'))],['포구',c(tv.def+o('fld'))],['송구(어깨)',c(tv.def+arm+o('arm'))],p.pos==='C'?['블로킹·도루 저지',c(tv.def+o('cat'))]:['병살·중계',c(tv.def+o('dp'))]]]); }
  else { const velo=veloOf(p); const sp=isSPr(p); const n=sp?3+(u01('np',id)>.5?1:0):1+(u01('np',id)>.4?1:0);
    const pool=[...PITCHES].sort((a,b)=>hn('pt'+a,id)-hn('pt'+b,id)).slice(0,n);
    const arsenal=[['직구',c(tv.stf+(velo-145)*.8+o('fb',3))],...pool.map(k=>[k,c(tv.stf+o('p'+k,6))])]; const best=[...arsenal].sort((a,b)=>b[1]-a[1])[0][0];
    const L=p.th==='좌'?3:-2;
    G2.push(['투구',[['구위',c(tv.stf)],['무브먼트',c((tv.stf+tv.ctl)/2+o('mv'))],['제구',c(tv.ctl)],['스태미나',c(tv.sta)],['좌타자 상대',c(tv.stf+L+o('vl',3))],['우타자 상대',c(tv.stf-L/2+o('vr',3))],['견제·수비',c(50+o('hold',8))]]]);
    G2.push(['구종',arsenal.map(([k,v])=>[k+(k===best?' · 결정구':''),v])]);
    G2.push(['투구 정보',[['직구 평균',velo+'km/h','t'],['직구 최고',veloMax(p)+'km/h','t'],['유형',(hn('gb',id)>.5?'땅볼형':hn('gb',id)<-.5?'뜬공형':'중립'),'t'],['투구 팔',p.th==='좌'?'좌완':'우완','t']]]); }
  G2.push(['체력·몸',[['체력',c(p.isP?tv.sta:tv.vit)],['내구성',c(80-(clamp(p.inj,.03,.42)-.03)/.39*60)]]]);
  const mind=[['성실성',ps(pers.pro)],['야망',ps(pers.amb),'n'],['충성심',ps(pers.loy)],['기질 안정',ps(24-pers.temp)]];
  if(p.foreign&&p.adapt!=null)mind.push(['한국 적응력',c(p.adapt)]); if(!p.foreign&&p.team!=null)mind.push(['해외 진출 의지',c(20+mlbOf(p)*.6),'i']);
  G2.push(['성격',mind]);
  const radar=!p.isP?[['컨택',tv.con,tf.con],['파워',tv.pow,tf.pow],['선구안',tv.eye,tf.eye],['주루',tv.spd,tf.spd],['수비',tv.def,tf.def],['체력',tv.vit,tf.vit]]
    :[['구위',tv.stf,tf.stf],['제구',tv.ctl,tf.ctl],['스태미나',tv.sta,tf.sta],['무브먼트',(tv.stf+tv.ctl)/2,(tf.stf+tf.ctl)/2],['구속',c(20+(veloOf(p)-130)/25*60),c(20+(veloOf(p)-130)/25*60)],['결정구',Math.max(...G2[1][1].map(x=>x[1])),Math.max(...G2[1][1].map(x=>x[1]))]];
  return {groups:G2,radar}; }
function radarSVG(ax,showFut){ const n=ax.length, cx=110, cy=104, R=78; const pt=(i,v)=>{ const a=-Math.PI/2+i*2*Math.PI/n, r=R*clamp((v-20)/60,0,1); return [cx+r*Math.cos(a),cy+r*Math.sin(a)]; };
  const ring=v=>ax.map((_,i)=>pt(i,v).map(x=>x.toFixed(1)).join(',')).join(' ');
  const poly=k=>ax.map((a,i)=>pt(i,a[k]).map(x=>x.toFixed(1)).join(',')).join(' ');
  const lab=ax.map((a,i)=>{ const [x,y]=pt(i,92); const anc=Math.abs(x-cx)<8?'middle':x>cx?'start':'end'; return `<text x="${x.toFixed(1)}" y="${(y+4).toFixed(1)}" text-anchor="${anc}" class="rd-l">${a[0]} <tspan fill="${rcol(Math.round(a[1]))}" font-weight="800">${Math.round(a[1])}</tspan></text>`; }).join('');
  return `<svg class="radar" viewBox="-30 0 280 208" role="img" aria-label="능력치 레이더">
    ${[35,50,65,80].map(v=>`<polygon points="${ring(v)}" fill="none" stroke="${v===50?'#55606e':'#2a333e'}" stroke-dasharray="${v===50?'3 3':''}"/>`).join('')}
    ${ax.map((_,i)=>{ const [x,y]=pt(i,80); return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#2a333e"/>`; }).join('')}
    ${showFut?`<polygon points="${poly(2)}" fill="rgba(230,185,59,.08)" stroke="#e6b93b" stroke-dasharray="4 3" stroke-width="1.4"/>`:''}
    <polygon points="${poly(1)}" fill="color-mix(in srgb, var(--acc) 28%, transparent)" stroke="var(--acc)" stroke-width="2"/>${lab}</svg>`; }
function growthSVG(p){ const H=(p.oh||[]).slice(-10).filter(h=>h.y!==G.year).concat(hideOvr(p)?[]:[{y:G.year,o:Math.round(ovr(p))}]).slice(-10); const wars=[...new Set(p.hist.filter(h=>h.lvl==='1군').map(h=>h.y))].sort().slice(-10).map(y=>({y,w:wOf(seasonTotal(p,y,'1군'),p)}));
  if(H.length<2&&wars.length<2)return ''; const ys=[...new Set([...H.map(x=>x.y),...wars.map(x=>x.y)])].sort((a,b)=>a-b); const W=300, Hh=120, x=y=>14+(ys.indexOf(y))*(W-28)/Math.max(1,ys.length-1);
  const oy=v=>Hh-14-(clamp(v,20,80)-20)/60*(Hh-30); const wy=v=>Hh-14-clamp(v,-2,10)/12*(Hh-30)-(Hh-30)*2/12;
  const bars=wars.map(w=>{ const y0=wy(0), y1=wy(w.w); return `<rect x="${(x(w.y)-7).toFixed(1)}" y="${Math.min(y0,y1).toFixed(1)}" width="14" height="${Math.abs(y1-y0).toFixed(1)}" fill="${w.w>=0?'#3fbf6a55':'#e0564f55'}"/><text x="${x(w.y).toFixed(1)}" y="${(Math.min(y0,y1)-3).toFixed(1)}" text-anchor="middle" class="gr-w">${w.w.toFixed(1)}</text>`; }).join('');
  const line=H.length>=2?`<polyline points="${H.map(h=>`${x(h.y).toFixed(1)},${oy(h.o).toFixed(1)}`).join(' ')}" fill="none" stroke="var(--acc)" stroke-width="2.2"/>${H.map(h=>`<circle cx="${x(h.y).toFixed(1)}" cy="${oy(h.o).toFixed(1)}" r="3" fill="var(--acc)"/><text x="${x(h.y).toFixed(1)}" y="${(oy(h.o)-7).toFixed(1)}" text-anchor="middle" class="gr-o">${h.o}</text>`).join('')}`:'';
  return `<svg class="growth" viewBox="0 0 ${W} ${Hh+14}" role="img" aria-label="성장 추이">${bars}${line}${ys.map(y=>`<text x="${x(y).toFixed(1)}" y="${Hh+8}" text-anchor="middle" class="gr-y">${String(y).slice(2)}</text>`).join('')}</svg>
    <p class="small muted"><span class="lg" style="background:var(--acc)"></span>종합 능력(해마다 겨울 기준) <span class="lg" style="background:#3fbf6a88"></span>1군 WAR</p>`; }
/* 측정 데이터(트래킹): 능력치를 모르는 선수도 볼 수 있는 객관적 수치 */
function trackCard(p){ if(p.prospect)return ''; const T=trackOf(p); if(!T)return ''; const it=(l,v,sub)=>`<div class="kb"><span>${l}</span><b>${v}</b>${sub?`<i>${sub}</i>`:''}</div>`;
  const L=p.isP?[it('직구 평균',T.velo+'km',`최고 ${T.vmax}km`),it('직구 회전수',T.rpm+'rpm'),it('익스텐션',T.ext.toFixed(2)+'m'),it('헛스윙 유도',T.whiff+'%'),it('CSW',T.csw+'%','루킹+헛스윙'),it('땅볼 비율',T.gb+'%')]
    :[it('평균 타구속도',T.ev+'km',`최고 ${T.evmax}km`),it('강한 타구',T.hh+'%','150km 이상'),it('헛스윙률',T.whiff+'%'),it('볼 스윙률',T.chase+'%'),it('1루 도달',T.run.toFixed(2)+'초'),it('송구 속도',T.arm+'km')];
  return `<section class="card"><div class="row between"><h2 class="sec">측정 데이터</h2><span class="small muted">트래킹 · 리그 평균 대비는 드래프트 표 '측정'에서</span></div><div class="trk">${L.join('')}</div></section>`; }
function detailCard(p){ const rp=scoutReport(p); if(hideOvr(p)||!rp.tools||!rp.tools.length)return ''; const d=detailOf(p,rp); const fut=rp.ofp!=null&&rp.tools.some(t=>t.fut>t.cur);
  const bar=([l,v,t])=>t==='t'?`<div class="dt"><span>${esc(l)}</span><b class="dt-t">${esc(String(v))}</b></div>`:t==='n'||t==='i'?`<div class="dt" title="${t==='n'?'성향: 좋고 나쁨이 없습니다':'낮을수록 구단에 유리합니다'}"><span>${esc(l)}</span><b class="num" style="text-align:center;color:${t==='n'?'var(--ink)':rcol(100-v)}">${Math.round(v)}</b><span class="track"><span class="mid"></span><span class="now" style="width:${Math.round((v-20)/60*100)}%;--c:${t==='n'?'var(--dim)':rcol(100-v)}"></span></span></div>`:`<div class="dt"><span>${esc(l)}</span>${rchip(v)}<span class="track"><span class="mid"></span><span class="now" style="width:${Math.round((v-20)/60*100)}%;--c:${rcol(v)}"></span></span></div>`;
  const gr=growthSVG(p);
  return `<section class="card"><div class="row between"><h2 class="sec">능력치</h2><span class="small muted">${rp.exact?'코치진 평가':'스카우트 추정'} · 20~80, 50이 1군 평균</span></div>
    <div class="dgrid"><div class="dradar">${radarSVG(d.radar,fut)}<p class="small muted"><span class="lg" style="background:var(--acc)"></span>현재${fut?' <span class="lg" style="background:#e6b93b"></span>장래(점선)':''} · 점선 고리가 1군 평균(50)</p></div>
      <div class="dgroups">${d.groups.map(([h,L])=>`<div class="dg"><div class="eyebrow">${h}</div>${L.map(bar).join('')}</div>`).join('')}</div></div>
    ${gr?`<div class="eyebrow" style="margin-top:10px">성장 추이</div>${gr}`:''}
    <p class="small muted">세부 항목은 핵심 능력치(${p.isP?'구위·제구·스태미나':'컨택·파워·선구안·주루·수비·체력'})를 선수 특성에 따라 나눠 보여 주는 값입니다. 경기 계산은 핵심 능력치와 좌우 손잡이로 합니다. ${rp.exact?'':'영입 전 선수는 스카우트 추정이라 오차가 있습니다.'}</p></section>`; }

/* ---------- 감독 요청 · 구단주 요청 ---------- */
const RST={ask:['답변 대기','warn'],open:['진행 중','acc'],done:['들어줌','good'],no:['거절','bad'],fail:['못 지킴','bad'],half:['블록에만 올림','']};
function reqLine(r){ const p=r.data&&r.data.pid!=null?G.players[r.data.pid]:r.data&&r.data.target!=null?G.players[r.data.target]:null; const st=RST[r.st]||['',''];
  const what=r.k==='slot'?`${SLOTK[r.data.sk]} 보강${p?` · 추천 ${p.name}`:''}`:r.k==='out'?`${p?p.name:'선수'} 정리`:r.k==='frep'?`외국인 ${p?p.name:''} 교체`:r.k==='fa'?`FA ${p?p.name:''} 영입`:`드래프트 ${DPOL[r.data.pol]}`;
  const act=r.st!=='open'?'':r.k==='slot'?`${p?`<button class="btn small primary" data-a="toTrade" data-v="${p.id}">협상 테이블</button>`:''}<button class="btn small${p?'':' primary'}" data-a="rqSlot" data-v="${r.data.sk}">후보 찾기</button>`:r.k==='out'?`<button class="btn small" data-a="go" data-v="trade:offers">블록 보기</button>`:r.k==='frep'?`<button class="btn small primary" data-a="go" data-v="transfer:foreign">외국인 시장</button>`:r.k==='fa'&&p?`<button class="btn small primary" data-a="faOpen" data-v="${p.id}">협상실</button>`:r.k==='draft'?`<button class="btn small" data-a="go" data-v="scout:draft">드래프트</button>`:'';
  return `<div class="rq"><span class="pill ${st[1]}">${st[0]}</span><div><b>${MREQK[r.k]}</b><span>${esc(what)}</span><i>${dsh(r.day)}${r.st==='open'&&r.until?` · ${dmd(r.until)}까지 (D-${Math.max(0,r.until-G.day)})`:''}</i></div>${act}</div>`; }
function mreqView(){ const L=mreqs().slice(0,10); const m=G.mgr[G.user];
  return csec('감독의 요청',(L.length?`<div class="rql">${L.map(reqLine).join('')}</div>`:'<p class="small muted">아직 감독이 따로 요청한 일이 없습니다.</p>')+`<p class="small muted">감독은 시즌 중 약한 자리 보강, 부진한 선수 정리, 외국인 교체를 먼저 요청하고, 8월 말에는 드래프트 기조를, FA 기간에는 꼭 잡고 싶은 선수를 말합니다. 들어주면 관계가 오르고, 약속하고 못 지키면 크게 깎입니다.${m&&m.ego>=70?' 고집 센 감독이라 거절하면 더 서운해합니다.':''}</p>`); }
function grantLine(g){ const p=g.pur&&g.pur.pid!=null?G.players[g.pur.pid]:null; const st=g.ok?(RST[g.st]||['승인','good']):['반려','bad']; const st2=g.ok&&g.st==='done'&&!g.pur?['승인','good']:st;
  return `<div class="rq"><span class="pill ${st2[1]}">${st2[0]}</span><div><b>${g.by==='own'?'구단주 주문':'단장 요청'} · ${money(g.amt)}</b><span>${g.pur?g.pur.k==='fa'?`FA ${esc(p?p.name:'')} 영입`:g.pur.k==='frep'?'외국인 교체':'전력 보강':'운영비 증액'}</span><i>${dsh(g.d)}${g.st==='open'&&g.until?` · ${dmd(g.until)}까지`:''}</i></div></div>`; }
function ownerAskView(){ const t=team(G.user); if(t.indie)return csec('구단주에게 요청','<p class="small muted">독립구단이라 모기업 지원이 없습니다. 스폰서와 자체 수익으로 운영합니다.</p>');
  const left=ownAskLeft(); const b=budget(); const amts=[1000,2000,3000];
  const faL=G.fa&&G.fa.open&&!G.fa.closed?G.fa.pool.map(id=>G.players[id]).filter(p=>p&&p.team==null).sort((a,c)=>ovr(c)-ovr(a)).slice(0,4):[];
  const bad=foreignOf(G.user).filter(p=>{ const h=seasonTotal(p,G.year,'1군'); return h&&(p.isP?(h.outs>=60&&pRate(h).era>5):(h.pa>=100&&bRate(h).ops<.700)); });
  const btn=(l,v,amt,pur)=>{ const o=ownOdds(amt,pur); return `<button class="oa" data-a="ownAsk" data-v="${v}" ${left?'':'disabled'}><b>${l}</b><span>${money(amt)} · ${oddsTxt(o)}</span></button>`; };
  const H=grants().slice(0,8);
  return csec('구단주에게 요청',`<p class="small">지금 예산 여유 <b>${money(b.roomGoal)}</b> · 올해 추가 지원 ${money(grantAmt())} · 구단주 신뢰 ${t.trust}</p>
    <div class="oag">${amts.map(a=>btn(`운영비 증액`,`gen:${a}`,a,null)).join('')}
      ${faL.map(p=>btn(`FA ${esc(p.name)} 영입 자금`,`fa:${p.id}`,p.ask.annual,{k:'fa',pid:p.id})).join('')}
      ${bad.map(p=>btn(`외국인 ${esc(p.name)} 교체 자금`,`frep:${p.id}`,round5(Math.max(500,p.sal*.6)),{k:'frep',pid:p.id})).join('')}</div>
    <p class="small muted">${left?'한 달에 한 번 요청할 수 있습니다.':'이번 달에는 이미 요청했습니다.'} 승인 여부는 구단주 신뢰, 성향(${OWNER[t.owner].label}), 순위, 요청 금액과 목적에 따라 달라집니다. 반려되면 신뢰 -1, 한 해에 자주 요청할수록 승인이 어려워집니다. 목적을 정해 받은 돈은 그 목적을 이루면 신뢰가 오르고, 못 이루면 깎입니다. 구단주가 먼저 스타 FA 영입이나 7월 우승 보강을 주문하며 돈을 내놓기도 합니다.</p>
    ${H.length?`<div class="eyebrow" style="margin-top:8px">요청·지원 기록</div><div class="rql">${H.map(grantLine).join('')}</div>`:''}`); }
function reqHomeCard(){ const M=mreqs().filter(r=>r.st==='open'); const O=grants().filter(g=>g.st==='open'&&g.pur); if(!M.length&&!O.length)return '';
  return `<section class="card"><div class="row between"><h2 class="sec">약속한 일</h2><button class="btn small" data-a="go" data-v="staff:mgr">감독 요청</button></div><div class="rql">${M.map(reqLine).join('')}${O.map(grantLine).join('')}</div></section>`; }

/* ---------- 감독과의 공생 화면 ---------- */
function mgrUseStats(){ const ps=playersOf(G.user); const sp=ps.filter(p=>isSPr(p)); const pc=[]; for(const g of (G.games||[]).slice(0,10)){ const side=g.box&&(g.home===G.user?g.box.h:g.away===G.user?g.box.a:null); if(side&&side.pit&&side.pit[0])pc.push(side.pit[0].pc||0); }
  const tired=ps.filter(p=>(p.fat||0)>=60).length; const inj=ps.filter(p=>p.injOut>0).length; const injY=ps.reduce((a,p)=>a+(p.injHist||[]).filter(h=>h.y===G.year).length,0);
  return {avgPc:pc.length?Math.round(sum(pc)/pc.length):null,tired,inj,injY}; }
function mgrBondView(){ const m=G.mgr[G.user]; if(!m||m.interim)return ''; mgrAttr(m); const d=mgrDir(); const u=mgrUseStats(); const bo=mgrRelBoost({team:G.user});
  const dirBox=(k,l,desc,cur)=>{ const x=d[k]; const st=!x?'지시 없음':x.mid!==m.id?'지시 없음':x.ok?'따르는 중':'거부함'; return `<div class="mdir"><div><b>${l}</b><span class="small muted">${desc} · 감독 본래 ${cur}</span></div><span class="pill ${x&&x.mid===m.id?(x.ok?'good':'bad'):''}">${st}</span><button class="btn small ${x&&x.mid===m.id&&x.ok?'':'primary'}" data-a="mgrDir" data-v="${k}:${x&&x.mid===m.id&&x.ok?0:1}">${x&&x.mid===m.id&&x.ok?'지시 해제':'지시하기'}</button></div>`; };
  const P=G.mpick&&G.mpick.y===G.year&&G.mpick.mid===m.id?G.mpick:null; const picks=P?P.ids.map(id=>G.players[id]).filter(Boolean):[];
  const log=(G.mpickLog||[]).filter(x=>x.mid===m.id).slice(0,4);
  return csec('감독과의 호흡',`<div class="mbond"><div><span class="small muted">관계</span><b class="num" style="color:${relCol(m.rel)}">${m.rel}</b><i>${relLabel(m.rel)}</i></div><div><span class="small muted">선수단 경기력</span><b class="num" style="color:${bo>=0?'var(--good)':'var(--bad)'}">${bo>=0?'+':''}${bo.toFixed(2)}</b><i>관계에서 오는 보정</i></div><div><span class="small muted">선수 보는 눈</span><b class="num" style="color:${rcol(m.eye)}">${m.eye}</b><i>장래 예측 오차 ±${Math.max(1.5,9.5-m.eye/10).toFixed(1)}</i></div></div>
    <p class="small muted">관계가 좋을수록 선수단이 더 잘 뛰고(최대 +0.4), 지시를 잘 따르고, 선수 카드에서 감독의 솔직한 장래 예측을 볼 수 있습니다(관계 30 미만이면 말을 아낍니다). 관계 78 이상이면 언론에 "호흡 최고" 기사가 나고, 25 이하면 불화설이 돌며 고집 센 감독은 스스로 물러나기도 합니다.</p>
    <div class="eyebrow" style="margin-top:8px">감독이 미는 선수</div>${picks.length?`<div class="intl">${picks.map(p=>`<button class="pill ${P.back?'good':''}" data-a="player" data-v="${p.id}">${esc(p.name)} · ${posLabel(p)} ${p.age}세</button>`).join('')}</div><p class="small">${P.back?'함께 밀어주는 중 · 올해 성장 속도 +30%':P.back===false?'단장이 성적을 우선했습니다':'답변 대기'}</p>`:'<p class="small muted">시즌이 시작되면 감독이 올해 키우고 싶은 젊은 선수를 고릅니다.</p>'}
    ${log.length?`<p class="small muted">지난 안목 기록: ${log.map(x=>`${x.y} ${esc(x.txt)}${x.back?' (함께 밀어줌)':''}`).join(' / ')} (겨울 종합 능력 변화)</p>`:''}
    <div class="eyebrow" style="margin-top:8px">운용 성향과 단장 지시</div>
    ${dirBox('rest','주전 휴식 보장','피로한 주전을 일찍 쉬게 해 부상을 줄입니다. 대신 쉬는 날은 벤치가 나갑니다',`휴식 관리 ${m.rest}`)}
    ${dirBox('arm','투수 관리(혹사 금지)','선발 투구 수와 불펜 연투를 줄여 투수 부상을 막습니다. 접전에서 필승조를 덜 씁니다',`투수 혹사 ${m.arm}`)}
    <p class="small">최근 10경기 선발 평균 투구 수 <b>${u.avgPc??'-'}</b> · 피로 60 이상 ${u.tired}명 · 지금 부상 ${u.inj}명 · 올해 부상 ${u.injY}건</p>
    <p class="small muted">휴식 관리가 낮은 감독은 주전을 끝까지 써서 전력이 안정적이지만 피로와 부상이 쌓입니다. 투수 혹사가 높은 감독은 선발을 길게 끌고 필승조를 연투시켜 접전에 강하지만 투수 부상이 늘어납니다. 지시는 관계와 감독 고집에 따라 거부될 수 있고, 그래도 안 되면 시즌 중에도 감독을 교체할 수 있습니다(감독대행 체제 후 새 감독 선임).</p>
    ${UI.dirMsg?`<div class="note">${esc(UI.dirMsg)}</div>`:''}`); }
function mgrOpinion(p){ const v=mgrView(p); if(!v)return ''; const m=G.mgr[G.user]; if(v.mute)return `<div class="mop"><b>감독 의견</b><span class="small muted">${esc(m.name)} 감독이 말을 아낍니다(관계 30 미만).</span></div>`;
  const pk=G.mpick&&G.mpick.y===G.year&&G.mpick.ids.includes(p.id);
  return `<div class="mop"><b>감독 의견${pk?' · <span class="pill good">감독이 미는 선수</span>':''}</b><span>"${esc(v.line)}." 장래 예상 <b style="color:${rcol(v.fut)}">${v.fut}</b></span><span class="small muted">${esc(m.name)} 감독 · 안목 ${v.eye} (오차 ±${v.sd.toFixed(1)}). 스카우트 평가와 다르면 안목이 높은 쪽을 믿는 편이 낫습니다.</span></div>`; }
function starPanel(){ const T=teamStar(G.user); const L=T.L;
  return csec('스타 파워와 마케팅',`<p class="small">우리 팀 스타 파워 <b>${T.v}</b> · 올해 스타 마케팅 수입 예상 <b>${money(starIncome(G.user))}</b></p>${L.length?`<div class="intl">${L.map(x=>`<button class="pill good" data-a="player" data-v="${x.p.id}">${esc(x.p.name)} · ${x.s}</button>`).join('')}</div>`:''}
    <p class="small muted">최근 3년 수상(MVP 40, 신인왕 20, 골든글러브 15), 올해·작년 대기록, 올해 WAR 4 이상 활약이 스타 파워가 됩니다. 상위 3명 합계가 유니폼·광고 수입으로 이어지고, 홍보를 중시하는 구단주는 스타가 생기면 신뢰를 더 줍니다. 외국인은 60%만 반영됩니다.</p>`); }

/* ---------- FA 보상 절차: 보호선수 명단 · 보상선수 지명 ---------- */
function gradeWhy(p){ const n=p.faN||(p.lastFA!=null?1:0); if(p.age>=35)return '만 35세 이상'; if(n>=2)return `${n+1}번째 FA`; if(n===1)return `두 번째 FA (지난 FA ${p.faPrevGrade||'A·B'}등급)`; return p.faRank?`3년 평균 연봉 구단 ${p.faRank.tm}위 · 리그 ${p.faRank.lg}위`:''; }
function compRuleTxt(){ return `A등급(3년 평균 연봉 구단 3위·리그 30위 이내): 보호선수 외 1명 + 직전 연봉 200%, 또는 선수 없이 300%. B등급(구단 10위·리그 60위 이내, 또는 두 번째 FA): 보호선수 외 1명 + 100%, 또는 200%. 보호선수는 A 20명, B 25명입니다(소속선수 한도 ${ROSTER_MAX}명).`+'  C등급(그 밖, 만 35세 이상, 세 번째 이상 FA): 선수 없이 150%. 외국인, 올해 신인, 군 복무 중인 선수, 이번 겨울 FA 계약 선수는 저절로 보호됩니다. FA 자격은 고졸 8시즌, 대졸 7시즌입니다.'; }
function compView(){ const L=(G.comp||[]).filter(c=>c.from===G.user||c.to===G.user); if(!L.length)return '';
  const open=L.filter(c=>c.stage!=='done'); const done=L.filter(c=>c.stage==='done').slice(0,6);
  const one=c=>{ const g=COMP[c.grade];
    if(c.stage==='protect'&&c.to===G.user){ const pool=compPool(G.user).sort((a,b)=>ovr(b)-ovr(a)); UI.prot=UI.prot&&UI.prot.id===c.id?UI.prot:{id:c.id,ids:aiProtect(G.user,g.prot)}; const S=new Set(UI.prot.ids);
      const auto=domestic(G.user).concat(awayOf(G.user)).filter(q=>!q.foreign&&autoProt(q)&&q.id!==c.pid);
      return `<section class="card cpbox"><div class="row between"><h2 class="sec">보호선수 명단 · ${esc(c.name)} 영입 보상</h2><span class="small muted">${dmd(c.exp)}까지</span></div>
        <p class="small">${tname(c.from)}에 보상해야 합니다(${c.grade}등급). 보호할 선수 <b>${S.size}/${g.prot}</b>명. 누르면 보호·해제됩니다. 명단 밖에서 상대가 1명을 데려가거나 돈으로 받습니다.</p>
        <div class="prl">${pool.map(q=>`<button class="pr ${S.has(q.id)?'on':''}" data-a="protTog" data-v="${q.id}">${avImg(q)}<span><b>${esc(q.name)}</b><i>${posLabel(q)} · ${q.age}세 · ${money(q.sal)}</i></span>${rchip(Math.round(ovr(q)))}<em>${S.has(q.id)?'보호':'노출'}</em></button>`).join('')}</div>
        ${auto.length?`<p class="small muted">저절로 보호: ${auto.map(q=>esc(q.name)).join(', ')}</p>`:''}
        <div class="btns"><button class="btn primary" data-a="protSubmit" data-v="${c.id}" ${S.size>g.prot?'disabled':''}>명단 제출 (${S.size}/${g.prot})</button><button class="btn" data-a="protAuto" data-v="${c.id}">능력 순으로 다시 채우기</button></div></section>`; }
    if(c.stage==='pick'&&c.from===G.user){ const ft=team(G.user); const cand=compPool(c.to).filter(q=>!c.prot.includes(q.id)).sort((a,b)=>ovr(b)-ovr(a)).slice(0,24);
      return `<section class="card cpbox"><div class="row between"><h2 class="sec">보상선수 지명 · ${esc(c.name)} 이적 보상</h2><span class="small muted">${dmd(c.exp)}까지</span></div>
        <p class="small">${tname(c.to)} 보호명단 밖 선수입니다(${c.grade}등급, 보호 ${g.prot}명). 선수 1명 + 직전 연봉 ${g.withP*100}% <b>${money(c.prev*g.withP)}</b>, 또는 선수 없이 ${g.cash*100}% <b>${money(c.prev*g.cash)}</b>.</p>
        ${cand.length?'':'<p class="small muted">보호명단 밖에 데려올 만한 선수가 없습니다.</p>'}<div class="tgrid">${cand.map(q=>pcard(q,{sub:`${posLabel(q)} · ${q.age}세 · ${hand(q)}`,foot:`<b class="num">${money(q.sal)}</b><span>${q.faC?`FA계약 ${q.yrs}년`:`FA까지 ${Math.max(0,faSvc(q)-q.svc)}년`}</span><button class="tc-i go" data-a="compPick" data-v="${c.id}:${q.id}">지명</button>`})).join('')}</div>
        <div class="btns"><button class="btn" data-a="compPick" data-v="${c.id}:0">선수 없이 ${money(c.prev*g.cash)} 받기</button></div></section>`; }
    return ''; };
  return open.map(one).join('')+(done.length?csec('FA 보상 기록',`<div class="rql">${done.map(c=>`<div class="rq"><span class="pill ${c.from===G.user?'good':'warn'}">${c.from===G.user?'받음':'내줌'}</span><div><b>${esc(c.name)} (${c.grade}등급) ${c.from===G.user?`→ ${tshort(c.to)}`:`← ${tshort(c.from)}`}</b><span>${c.player?`보상선수 ${esc(c.player)} + `:'선수 없이 '}${money(c.cash||0)}</span><i>${dsh(c.done||c.day)}</i></div></div>`).join('')}</div>`):''); }

/* ---------- 중계 2: 타석 패널 · 승리 확률 · 오늘의 선수 ---------- */
const RE24={'000':[.48,.25,.10],'100':[.85,.50,.22],'010':[1.10,.65,.32],'001':[1.35,.95,.35],'110':[1.45,.90,.44],'101':[1.75,1.15,.48],'011':[1.95,1.35,.57],'111':[2.25,1.55,.75]};
function cErf(x){ const t=1/(1+.3275911*Math.abs(x)); const y=1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-.284496736)*t+.254829592)*t*Math.exp(-x*x); return x>=0?y:-y; }
/* 홈팀 승리 확률: 점수 차 + 지금 주자·아웃으로 기대되는 득점 + 남은 이닝의 불확실성 */
function wpHome(st){ const D0=st.sh-st.sa; const half=st.half; const outs=Math.min(2,st.outs); const key=st.bases.map(b=>b?1:0).join(''); const re=st.outs>=3?0:(RE24[key]||RE24['000'])[outs];
  const bot=half%2===1; if(half>=17&&bot&&D0>0)return 1; let D=D0+(bot?re:.48-re); /* 초 공격 중이면 홈팀은 아직 말 공격이 남아 있음 */ const remHalf=Math.max(0,17-half)+(st.outs>=3?0:(3-outs)/3); const v=Math.max(.25,remHalf*.95);
  return clamp(.5+.5*cErf((D+.08)/Math.sqrt(2*v)),.005,.995); }
function cOrderNo(g,half,id){ const s=g.box[half%2?'h':'a']; const i=s.bat.findIndex(b=>b.id===id); return i>=0?(i%9)+1:null; }
function cNext(g,half,id){ const s=g.box[half%2?'h':'a']; const B=s.bat.slice(0,9); const i=B.findIndex(b=>b.id===id); if(i<0)return []; return [B[(i+1)%9],B[(i+2)%9]].filter(Boolean); }
const PAK={'1B':['안타','h'],'2B':['2루타','h'],'3B':['3루타','h'],HR:['홈런','hr'],BB:['볼넷','bb'],K:['삼진','k'],OUT:['범타','o'],DP:['병살','o']};
function cChips(g,k,id){ const L=g.pbp; const out=[]; for(let i=0;i<k&&i<L.length;i++){ const x=L[i]; if(x[1]===id){ const r=PAK[x[3]]||['?','o']; out.push(`<i class="pk ${r[1]}">${cHalfTxt(x[0]).replace('회초','').replace('회말','')}${r[0]}</i>`); } } return out.join('')||'<i class="pk n">첫 타석</i>'; }
function abPanel(g,k){ const L=g.pbp; const x=L[Math.min(k,L.length-1)]; const bid=k<L.length&&typeof x[1]==='number'?x[1]:null; const pid=cPit(g,Math.min(k,L.length-1));
  const b=bid&&G.players[bid], p=pid&&G.players[pid]; if(!b||!p)return '';
  const st=cBefore(g,k); const no=cOrderNo(g,x[0],bid); const r=batAt(g,k,bid); const h=r; const ov=scoutReport(b).cur, pv=scoutReport(p).cur;
  let pitch=''; try{ const d=detailOf(p,scoutReport(p)); const ars=d.groups.find(gx=>gx[0]==='구종'); const best=ars?[...ars[1]].sort((a,c)=>c[1]-a[1])[0]:null; pitch=`직구 평균 ${veloOf(p)}·최고 ${veloMax(p)}km${best?` · ${best[0].replace(' · 결정구','')}`:''}`; }catch(e){}
  const nx=cNext(g,x[0],bid).map(n=>{ const q=G.players[n.id]; return q?`${cOrderNo(g,x[0],n.id)}번 ${esc(fname(q))}`:''; }).filter(Boolean).join(' · ');
  const risp=!!(st.bases[1]||st.bases[2]); const late=st.half>=14&&Math.abs(st.sa-st.sh)<=2;
  return `<div class="ab ${risp?'risp':''}${late?' late':''}"><button class="ab-b" data-a="castPlayer" data-v="${bid}"><span class="ab-f">${avImg(b,true)}<b class="ab-o" style="--c:${rcol(ov)}">${ov??'-'}</b><span class="ab-res" id="cs-abr"></span></span>
      <span class="ab-t"><em>${no?no+'번 타자':'타자'} · ${posLabel(b)} · ${hand(b)} ${acqTag(b)}</em><b>${esc(b.name)}</b><span class="ab-s">${r?`타율 <strong>${fmt3(r.avg)}</strong> · ${h.hr}홈런 · OPS ${fmt3(r.ops)}`:'시즌 기록 없음'}</span><span class="ab-pk">${cChips(g,k,bid)}</span></span></button>
    <button class="ab-p" data-a="castPlayer" data-v="${pid}">${avImg(p)}<span><em>투수 · ${p.th==='좌'?'좌완':'우완'} ${acqTag(p)}</em><b>${esc(fname(p))}</b><span>${rchip(pv)} ERA ${eraAt(g,k,pid)}</span><span>${esc(pitch)}</span><span>오늘 ${cToday(g,k,pid,true)}</span></span></button>
    ${nx?`<div class="ab-nx">대기 ${nx}</div>`:''}</div>`; }
function cAbRes(t,cls){ const el=document.getElementById('cs-abr'); if(!el)return; el.className='ab-res'; void el.offsetWidth; el.textContent=t; el.className='ab-res on '+(cls||''); }
function cWp(g,st,prev){ const bar=document.getElementById('cs-wpa'); const tx=document.getElementById('cs-wpt'); if(!bar)return; const w=wpHome(st); bar.style.width=(w*100).toFixed(1)+'%';
  const fav=w>=.5?g.home:g.away; const pct=Math.round((w>=.5?w:1-w)*100); let d=''; if(prev!=null){ const dd=Math.round((w-prev)*100); if(Math.abs(dd)>=8){ const who=dd>0?g.home:g.away; d=` <b class="wpd">${esc(tshort(who))} +${Math.abs(dd)}%</b>`; } }
  tx.innerHTML=`${esc(tshort(fav))} 승리 확률 ${pct}%${d}`; return w; }
/* 오늘의 선수: 승리 확률을 가장 많이 끌어올린 선수 */
function gameMvp(g){ const S=wpaMap(g); if(g.hs===g.as)return null; const win=g.hs>g.as?g.home:g.away; const pool=Object.entries(S).map(([id,v])=>({p:G.players[+id],v})).filter(o=>o.p&&o.p.team===win).sort((a,b)=>b.v-a.v); return pool[0]||null; }

/* ---------- 중계 3: 단장의 눈 — 내가 짠 선수단이 어떻게 굴러가는지 ---------- */
/* 영입 경로 꼬리표: 우리 구단으로 들어온 최근(4시즌 안) 결정만 */
function acqOf(p){ if(!p||p.team!==G.user)return null; const nm=tname(G.user); const S=p.story||[];
  for(let i=S.length-1;i>=0;i--){ const s=S[i]; if(s.k!=='move'&&s.k!=='draft')continue; if(!s.t.includes(nm))continue; if(s.y<G.year-3||(G.gmSince!=null&&s.y<G.gmSince))return null;
    const t=s.t; const k=/트레이드/.test(t)?'트레이드':/보상선수/.test(t)?'보상선수':/FA 이적/.test(t)?'FA 영입':/FA 잔류/.test(t)?'FA 잔류':/입단/.test(t)?'외국인':/지명/.test(t)?'지명':/복귀/.test(t)?'복귀':null;
    if(k)return {k,y:s.y,t}; }
  return null; }
const ACQC={'트레이드':'tr','보상선수':'tr','FA 영입':'fa','FA 잔류':'fa','외국인':'fo','지명':'dr','복귀':'fa'};
function acqTag(p){ const a=acqOf(p); return a?`<i class="acq ${ACQC[a.k]||''}" title="${esc(a.t)}">${a.k} ${String(a.y).slice(2)}</i>`:''; }
/* 타석별 승리 확률 기여 */
function wpaMap(g){ const L=g.pbp||[]; const S={}; for(let k=0;k<L.length;k++){ const x=L[k]; if(typeof x[1]!=='number')continue; const b=cBefore(g,k); const a={sa:x[7],sh:x[8],outs:x[4],bases:x[4]>=3?[0,0,0]:x[5],half:x[0]};
    if(x[4]>=3){ a.half=x[0]+1; a.outs=0; a.bases=[0,0,0]; } let d=(k===L.length-1?(g.hs>g.as?1:g.hs<g.as?0:.5):wpHome(a))-wpHome(b); if(x[0]%2===0)d=-d; S[x[1]]=(S[x[1]]||0)+d; S[x[2]]=(S[x[2]]||0)-d; }
  return S; }
function boxOf(g,id){ for(const s of ['h','a']){ const B=g.box&&g.box[s]; if(!B)continue; const b=B.bat.find(x=>x.id===id); if(b)return {s,b}; const q=B.pit.find(x=>x.id===id); if(q)return {s,q}; } return null; }
function batToday(b){ return `${b.ab}타수 ${b.h}안타${b.hr?` ${b.hr}홈런`:''}${b.rbi?` ${b.rbi}타점`:''}${b.bb?` ${b.bb}볼넷`:''}${b.so?` ${b.so}삼진`:''}`; }
function pitToday(q){ return `${Math.floor(q.outs/3)}${q.outs%3?'.'+q.outs%3:''}이닝 ${q.pc||0}구 ${q.er}자책${q.so?` ${q.so}K`:''}${q.d?` · ${q.d}`:''}`; }
/* 경기 중: 우리 타선 띠 */
function ourStrip(g,k){ const me=g.home===G.user?'h':g.away===G.user?'a':null; if(!me||!g.box)return ''; const L=g.pbp; const cur=k<L.length&&typeof L[k][1]==='number'?L[k][1]:null;
  const R={}; for(let i=0;i<k&&i<L.length;i++){ const x=L[i]; if(typeof x[1]!=='number')continue; (R[x[1]]=R[x[1]]||[]).push((PAK[x[3]]||['','o'])[1]); }
  const B=g.box[me].bat.slice(0,12); if(!B.length)return '';
  return `<div class="ostrip"><span class="ost-l">우리<br>타선</span>${B.map(b=>{ const p=G.players[b.id]; if(!p)return ''; const a=acqOf(p);
    return `<button class="ost${b.id===cur?' on':''}" data-a="castPlayer" data-v="${b.id}">${avImg(p)}${a?`<i class="ost-a ${ACQC[a.k]||''}"></i>`:''}<b>${esc(fname(p))}</b><span class="od">${(R[b.id]||[]).map(c=>`<i class="${c}"></i>`).join('')||'<em>-</em>'}</span></button>`; }).join('')}</div>`; }
/* 최근 10경기: 어디가 문제인가 */
function gmTrend(){ const G10=(G.games||[]).filter(x=>x.box&&(x.home===G.user||x.away===G.user)).slice(0,10); if(G10.length<3)return null;
  const pos={}, all={ab:0,h:0,tb:0,bb:0}; let spO=0,spE=0,rpO=0,rpE=0,spN=0;
  for(const x of G10){ const s=x.box[x.home===G.user?'h':'a'];
    for(const b of s.bat){ const k=b.pos||'?'; const o=pos[k]=pos[k]||{ab:0,h:0,tb:0,bb:0}; const tb=b.h+(b.d||0)+2*(b.tr||0)+3*(b.hr||0); for(const t of [o,all]){ t.ab+=b.ab; t.h+=b.h; t.tb+=tb; t.bb+=b.bb||0; } }
    s.pit.forEach((q,i)=>{ if(i===0){ spO+=q.outs; spE+=q.er; spN++; } else { rpO+=q.outs; rpE+=q.er; } }); }
  const ops=o=>o.ab+o.bb?(o.h+o.bb)/(o.ab+o.bb)+(o.ab?o.tb/o.ab:0):0;
  const P=Object.entries(pos).filter(([k,o])=>SLOTS_S[k]&&o.ab+o.bb>=18).map(([k,o])=>({k,ops:ops(o),pa:o.ab+o.bb})).sort((a,b)=>a.ops-b.ops);
  return {n:G10.length,tops:ops(all),weak:P[0]||null,best:P[P.length-1]||null,spEra:spO?spE*27/spO:0,rpEra:rpO?rpE*27/rpO:0,spIp:spN?spO/3/spN:0}; }
/* 연투: 같은 날짜 연속 등판 */
function relStreak(id,day){ const days=new Set((G.games||[]).filter(x=>x.box&&(x.home===G.user||x.away===G.user)&&[...x.box.h.pit,...x.box.a.pit].some(q=>q.id===id)).map(x=>x.day)); let n=0; while(days.has(day-n))n++; return n; }
function gmMemo(g){ const me=g.home===G.user?'h':g.away===G.user?'a':null; if(!me||!g.box)return ''; const op=me==='h'?'a':'h'; const S=g.pbp?wpaMap(g):{};
  const row=(p,main,sub,extra)=>`<div class="gm-r"><button class="gm-p" data-a="castPlayer" data-v="${p.id}">${avImg(p)}<span><b>${esc(p.name)} ${acqTag(p)}</b><em>${main}</em>${sub?`<i>${sub}</i>`:''}</span></button>${extra||''}</div>`;
  const ours=g.box[me].bat.map(b=>({b,p:G.players[b.id],v:S[b.id]||0})).filter(o=>o.p&&o.b.ab+(o.b.bb||0)>0);
  const best=[...ours].sort((a,c)=>c.v-a.v||c.b.h-a.b.h)[0]; const worst=[...ours].sort((a,c)=>a.v-c.v||(c.b.so-a.b.so))[0];
  let H='';
  const sec=(t,body)=>body?`<div class="gm-s"><div class="gm-h">${t}</div>${body}</div>`:'';
  /* 타선 */
  let bat=''; if(best&&(best.v>.04||best.b.h>=2||best.b.hr))bat+=row(best.p,`잘했다 · ${batToday(best.b)}`,l10Text(best.p));
  if(worst&&worst!==best&&(worst.v<-.06||(worst.b.h===0&&worst.b.ab>=3)))bat+=row(worst.p,`아쉬웠다 · ${batToday(worst.b)}`,l10Text(worst.p));
  H+=sec('우리 타선',bat);
  /* 마운드 */
  const pit=g.box[me].pit.map((q,i)=>({q,i,p:G.players[q.id]})).filter(o=>o.p); let mp='';
  if(pit[0]){ const s=pit[0]; mp+=row(s.p,`선발 · ${pitToday(s.q)}`,l10Text(s.p)); }
  const pen=pit.slice(1); if(pen.length){ const o=sum(pen.map(x=>x.q.outs)), e=sum(pen.map(x=>x.q.er)), pc=sum(pen.map(x=>x.q.pc||0));
    const bad=pen.filter(x=>x.q.er>=2).sort((a,c)=>c.q.er-a.q.er)[0];
    mp+=`<p class="gm-n">불펜 ${pen.length}명 ${Math.floor(o/3)}${o%3?'.'+o%3:''}이닝 ${pc}구 ${e}자책</p>`; if(bad)mp+=row(bad.p,`흔들렸다 · ${pitToday(bad.q)}`,l10Text(bad.p)); }
  H+=sec('마운드',mp);
  /* 내 결정 */
  const mine=[...g.box[me].bat.map(b=>({p:G.players[b.id],t:batToday(b)})),...g.box[me].pit.map(q=>({p:G.players[q.id],t:pitToday(q)}))].filter(o=>o.p&&acqOf(o.p)&&o.p!==best?.p&&o.p!==worst?.p);
  H+=sec('내가 데려온 선수',mine.slice(0,4).map(o=>row(o.p,o.t,o.p.isP?pLine(o.p):bLine(o.p))).join(''));
  /* 지친 선수 */
  const tired=[]; for(const q of g.box[me].pit.slice(1)){ const n=relStreak(q.id,g.day); const p=G.players[q.id]; if(p&&n>=3)tired.push(row(p,`${n}일 연속 등판`,`지금 상태: ${fatText(p)} ${fatBar(p)}`)); }
  const fatL=[...g.box[me].bat.map(b=>b.id),...g.box[me].pit.map(q=>q.id)].map(id=>G.players[id]).filter(p=>p&&p.team===G.user&&(p.fat||0)>=60&&!tired.some(t=>t.includes(`data-v="${p.id}"`))).sort((a,c)=>c.fat-a.fat).slice(0,2);
  for(const p of fatL)tired.push(row(p,`${fatText(p)} · 피로 ${Math.round(p.fat)} ${fatBar(p)}`,'감독이 곧 쉬게 할 가능성이 큽니다.'));
  H+=sec('지친 선수',tired.slice(0,3).join(''));
  /* 최근 10경기 흐름 */
  const T=gmTrend(); if(T){ let tr=''; const fix=(k,l)=>tradeOpen()?`<button class="tc-i go" data-a="gmFix" data-v="${k}">${l}</button>`:'';
    if(T.weak&&T.weak.ops<T.tops-.1)tr+=`<div class="gm-t bad"><span>${SLOTS_S[T.weak.k]} 자리 OPS <b>${fmt3(T.weak.ops)}</b> <i>팀 ${fmt3(T.tops)}</i></span>${fix(T.weak.k,'보강 후보')}</div>`;
    if(T.rpEra>=5.2||T.rpEra>=T.spEra+1.5)tr+=`<div class="gm-t bad"><span>불펜 평균자책 <b>${T.rpEra.toFixed(2)}</b> <i>선발 ${T.spEra.toFixed(2)}</i></span>${fix('RP','불펜 후보')}</div>`;
    if(T.spIp&&T.spIp<5)tr+=`<div class="gm-t bad"><span>선발 평균 <b>${ipStr(Math.round(T.spIp*3))}이닝</b> <i>불펜 부담</i></span>${fix('SP','선발 후보')}</div>`;
    if(!tr)tr=`<div class="gm-t"><span>팀 OPS <b>${fmt3(T.tops)}</b> · 선발 ${T.spEra.toFixed(2)} · 불펜 ${T.rpEra.toFixed(2)}</span><i class="small muted">눈에 띄는 구멍 없음</i></div>`;
    H+=sec(`최근 ${T.n}경기 흐름`,tr); }
  /* 상대 팀에서 눈에 띈 선수 */
  const opp=[...g.box[op].bat.map(b=>({id:b.id,t:batToday(b)})),...g.box[op].pit.map(q=>({id:q.id,t:pitToday(q)}))].map(o=>({...o,p:G.players[o.id],v:S[o.id]||0})).filter(o=>o.p&&o.p.team!=null&&o.p.team!==G.user&&!o.p.foreign).sort((a,c)=>c.v-a.v)[0];
  if(opp&&opp.v>.08){ const on=(G.pwatch||[]).includes(opp.p.id);
    H+=sec('상대 팀에서 눈에 띈 선수',row(opp.p,opp.t,`${opp.p.isP?pLine(opp.p):bLine(opp.p)}`,`<div class="gm-b"><button class="tc-i${on?' on':''}" data-a="pwatch" data-v="${opp.p.id}">${on?'관심 중':'관심'}</button>${tradeOpen()?`<button class="tc-i go" data-a="findT" data-v="${opp.p.id}">얻을 조건</button>`:''}</div>`)); }
  return H?`<div class="gm-memo"><div class="gm-ttl">단장 메모</div>${H}</div>`:''; }
/* 다른 구단 관심 선수 목록 */
function pwatchToggle(id){ G.pwatch=G.pwatch||[]; const i=G.pwatch.indexOf(id); if(i>=0){ G.pwatch.splice(i,1); return false; } G.pwatch.unshift(id); G.pwatch=G.pwatch.slice(0,12); return true; }
function pwatchBox(){ const L=(G.pwatch||[]).map(id=>G.players[id]).filter(p=>p&&p.team!=null&&p.team!==G.user); if(!L.length)return '';
  return `<section class="card"><div class="row between"><h2 class="sec">관심 선수</h2><span class="small muted">경기·선수 카드에서 표시</span></div><div class="pwl">${L.map(p=>`<div class="pwr"><div class="pwm">${pMini(p)}<span class="small muted">${badge(p.team,14)} ${tshort(p.team)} · ${l10Text(p)||'최근 기록 없음'}</span></div><span class="pwb"><button class="tc-i go" data-a="findT" data-v="${p.id}">조건 찾기</button><button class="tc-i" data-a="pwatch" data-v="${p.id}">빼기</button></span></div>`).join('')}</div></section>`; }

/* ---------- 팬 게시판: 야구 커뮤니티식 글과 댓글 ----------
   글과 댓글은 저장하지 않는다. 사건(기사·트레이드·감독·경기·순위)과 고정 시드로 매번 같은 내용을 만든다. */
function fRng(key){ let h=1779033703^key.length; for(let i=0;i<key.length;i++){ h=Math.imul(h^key.charCodeAt(i),3432918353); h=h<<13|h>>>19; }
  return ()=>{ h=Math.imul(h^h>>>16,2246822507); h=Math.imul(h^h>>>13,3266489909); h^=h>>>16; return (h>>>0)/4294967296; }; }
const fPick=(r,a)=>a[Math.floor(r()*a.length)];
const FNICK_A=['직관','외야석','치맥','퇴근길','주말','9회말','불펜','2군','만루','삼진','도루','번트','홈런','개막전','올드','야알못','통계','유니폼','응원가','우천취소','더블헤더','끝내기','대타','마무리','에이스','포수','외국인','신인','FA','엔트리'];
const FNICK_B=['러','요정','장인','지킴이','전문가','소식통','단골','덕후','매니아','개근','수집가','관찰자','중독','사랑','고인물','뉴비','팬','아재','청년'];
function fNick(r,tid){ const t=tid!=null?team(tid):null; const x=r();
  if(t&&x<.32)return t.city+fPick(r,['토박이','사람','직관러','올드팬','지킴이','청년','아재','댁'])+(r()<.4?Math.floor(r()*99):'');
  if(t&&x<.5)return t.nick+fPick(r,['빠','사랑','만세','덕후','외길','평생팬','지킴이'])+(r()<.5?Math.floor(r()*999):'');
  return fPick(r,FNICK_A)+fPick(r,FNICK_B)+(r()<.35?Math.floor(r()*99):''); }
/* 반응 문구: pos 좋음 · neg 나쁨 · mix 반반 · fun 잡담. {p}선수 {q}다른 선수 {T}우리 별칭 {O}상대 별칭 {m}감독 {n}숫자 {pos}포지션 */
const FB={
  win:{pos:['오늘 {p} 미쳤다 진짜','{p} 연봉 올려줘라 제발','이 맛에 야구 본다','직관 갔는데 이겼다 ㅋㅋ 집 가는 길 행복','{q} 오늘 공 좋더라','{p} 타석 들어올 때마다 뭔가 해줄 것 같음','오늘 같은 경기만 해라','{O} 상대로 이기니까 더 좋네','수훈선수 {p} 인정합니다','중계 보다가 소리 질렀다 ㅋㅋㅋ'],
       mix:['이겼으니 됐다 근데 불펜은 좀...','이긴 건 좋은데 {r} 오늘 왜 저럼','점수 차 벌릴 때 못 벌린 건 아쉽다','이겨도 불안한 이 느낌 뭐냐'],
       fun:['오늘 치킨 맛있게 먹었다','내일도 이 기세로 가자','다음 주 직관 예매 완료','응원가 아직도 귀에서 맴돈다']},
  loss:{neg:['{r} 오늘 왜 저럼','{r} 2군 한 번 보내라 제발','불펜 방화 언제까지 볼 거냐','치킨 시켰는데 체함','오늘 경기는 기억에서 지운다','투수 교체 타이밍 실화냐','득점권에서 한 방이 그렇게 어렵냐','{O}한테 이렇게 털릴 일이냐','타선 집단 슬럼프 아님?','이럴 거면 리빌딩이나 하자'],
       mix:['그래도 {p} 하나는 잘했다','질 수도 있지 내일 이기면 됨','144경기 중 하나일 뿐이다 진정하자','{p} 혼자 야구하네'],
       fun:['중계 끄고 산책 나감','오늘은 일찍 잔다','야구 끊는다 (내일 또 봄)']},
  wstreak:{pos:['{n}연승 실화냐 ㅋㅋ','이 기세면 가을야구 간다','연승할 때는 뭘 해도 됨','요즘 야구 볼 맛 난다','작년이랑 완전 다른 팀이네'],mix:['연승 끝나면 연패 올까 봐 무섭다']},
  lstreak:{neg:['{n}연패... 프런트 책임론 나와야 함','연패 끊을 생각은 있냐','분위기 너무 안 좋다','감독이랑 단장 둘 다 뭐 하냐','이 정도면 선수단 문제 맞음'],mix:['이럴 때 에이스가 끊어줘야 하는데','연패는 언젠가 끝난다... 언젠가']},
  tradeG:{pos:['와 이걸 받아준다고? 단장 협상 잘하네','{p} 데려오고 {q} 보낸 거면 이득 아님?','솔직히 이 트레이드는 박수 쳐줘야 함','상대 단장 무슨 생각임 ㅋㅋㅋ','드디어 프런트가 일을 하네','{pos} 구멍 이걸로 메웠다','{q} 아깝긴 한데 {p} 정도면 납득','단장 일 잘한다 인정'],
          mix:['일단 시즌 끝나고 판단하자','{q} 정들었는데 아쉽다 ㅠ','윈나우 하겠다는 거네']},
  tradeB:{neg:['{q} 왜 줌? 미쳤냐','이거 손해 아님? 누가 설명 좀','{p} 성적 보고 데려온 거 맞냐','단장 나가라 진짜','{q} 저쪽 가서 터지면 어쩔 건데','또 퍼주기 시작이네','트레이드 소식 보고 밥 먹다 체함','이게 맞는 트레이드냐 진짜 모르겠다'],
          mix:['{p} 우리 구장 오면 다를 수도','결과 보고 욕하자 일단','{q} 보낸 건 아깝다']},
  tradeE:{mix:['등가교환 같은데','서로 필요한 거 맞바꾼 듯','윈윈 트레이드로 보임','{q} 잘 가라 그동안 고마웠다','{p} 환영한다 잘해보자','둘 다 어떻게 될지 모르겠다'],pos:['{pos} 보강은 필요했지'],neg:['굳이 지금?']},
  rival:{pos:['{O}팬인데 우리가 이득 본 듯 ㅋㅋ','저쪽 단장 감사합니다','{p} 우리 팀 와서 잘해라'],neg:['{O}팬인데 우리 단장 뭐 하냐','{q} 보낸 거 실화냐 우리 팀','이거 우리가 손해 아님?'],mix:['{O}팬인데 일단 지켜봄']},
  mgrHire:{pos:['검증된 감독 데려왔네','경력 보니까 믿음 간다','{m} 감독 야구 스타일 좋아함','{ob}','이번엔 제대로 뽑은 듯'],neg:['처음 듣는 이름인데?','왜 하필 이 감독임','돈 아끼려고 뽑은 거 아니냐','전 팀에서 어땠는지 아는 사람?'],mix:['일단 시즌 보고 판단','선수단이랑 잘 맞으면 좋겠다','코치진은 누가 오는지가 더 중요함']},
  mgrFire:{pos:['늦었다 진짜','이제라도 바꾸네','결단 잘했다'],neg:['감독이 무슨 죄냐 선수 구성이 문제지','시즌 중에 이게 맞냐','단장도 같이 책임져라'],mix:['감독대행 체제로 버틸 수 있나','새 감독 누가 올지 궁금하다']},
  hot:{pos:['{p} 요즘 폼 미쳤다','{p} 최근 10경기 보고 놀람','{p} 국대 가자','{p} 다년 계약 잡아라 단장아','{p} 타석은 화장실도 못 감','{p} 없었으면 어쩔 뻔'],mix:['{p} 이 폼 오래 가야 할 텐데']},
  cold:{neg:['{p} 슬럼프 너무 길다','{p} 언제 살아나냐','{p} 2군 가서 조정 좀 하고 와라','{p} 라인업에서 빼라','{p} 자리 다른 선수 써보자'],mix:['{p} 원래 이런 선수 아닌데','{p} 믿고 기다려 보자','{p} 몸이 안 좋은 거 아님?']},
  forBad:{neg:['{p} 교체 언제 함?','외국인 스카우트 누가 했냐','{p} 이 돈 주고 데려온 거 맞냐','대체 외국인 알아봐라 제발'],mix:['{p} 적응 기간이라 치자','{p} 한 달만 더 보자']},
  forGood:{pos:['{p} 재계약 무조건','{p} 해외 갈까 봐 벌써 무섭다','{p} 역대급 외국인 아님?','외국인 이번엔 잘 뽑았네'],mix:['{p} 내년에도 이렇게 할까']},
  rankTop:{pos:['솔직히 올해 우승 각 아님?','{n}위 실화냐 행복하다','시즌 끝까지 이대로만','가을야구 예매 준비해라'],mix:['아직 시즌 길다 방심 금지','윗팀들도 만만치 않음']},
  rankMid:{mix:['5강 싸움 피 말린다','한 경기 한 경기가 결승이다','트레이드로 한 자리만 보강하면 될 듯','{pos} 하나만 채우면 위로 간다'],pos:['요즘 분위기 나쁘지 않다'],neg:['이도 저도 아닌 시즌 될 듯']},
  rankLow:{neg:['꼴찌 싸움 실화냐','단장 경질 언제 함?','올해도 가을야구 글렀다','리빌딩 할 거면 확실하게 해라','{pos} 자리가 구멍인데 프런트는 뭐 하냐'],mix:['내년 드래프트나 기대하자','그래도 응원은 한다']},
  feat:{pos:['ㄷㄷ {p} 미쳤다','이걸 실시간으로 봤다','{p} 이름 기록에 남겠네','역사적인 날이다'],fun:['오늘 중계 본 사람 승리자','하이라이트 열 번 돌려봄']},
  forChg:{mix:['교체 빠르네','새 외국인 영상 찾아봤는데 괜찮아 보임','이번엔 제대로 된 선수 오길'],neg:['또 바꿈? 처음부터 잘 뽑지']},
  drSteal:{pos:['{n}순위에 {p}? 이건 스틸이다','언론 {r}위를 여기서 줍네 ㅋㅋ','스카우트팀 일했다','{p} 고교 때 영상 봤는데 물건임','올해 드래프트 성공한 듯'],mix:['남아 있던 데는 이유가 있겠지','일단 몸부터 만들어라']},
  drReach:{neg:['{p}? 처음 듣는 이름인데','이 순번에 이 선수는 좀...','언론 {r}위를 {n}순위에? 오버드래프트 아님?','다른 좋은 선수 남았는데 왜','스카우트 무슨 생각이냐'],mix:['스카우트가 뭘 봤겠지 믿어보자','몇 년 뒤에 판단하자','{pos} 급했나 보네']},
  drOk:{mix:['무난한 픽','예상대로 갔네','{pos} 보강 필요했지','{p} 잘 커라','군대 문제부터 잘 풀자'],pos:['{p} 환영한다','이 정도면 괜찮은 지명']},
  drSum:{pos:['올해 드래프트 만족한다','상위 라운드 잘 뽑은 듯','몇 년 뒤가 기대된다'],neg:['올해 드래프트 망한 듯','스카우트팀 교체해라','상위 픽 아깝다'],mix:['드래프트는 5년 뒤에 평가하는 거다','신인은 키우기 나름','2군 코치들 어깨가 무겁다']},
  newsPos:{pos:['좋은 기사네','이런 기사 보고 싶었다','{p} 응원한다','기자님 일 잘하시네'],mix:['기사 제목 좀 과장 아님?']},
  newsNeg:{neg:['기사 뼈 때리네','반박 불가','프런트 이 기사 보고 있냐','팩트라 할 말이 없다'],mix:['기자가 너무 몰아가는 듯','한두 경기로 판단하긴 이르지']},
  newsNeu:{mix:['그렇구나','다음 소식 기다림','이건 좀 더 지켜보자','{p} 관련 소식 더 없냐','결국 성적으로 말하는 거지','오 이건 몰랐네','프런트 일 하긴 하네','시즌 끝나고 다시 보자','기사 잘 봤습니다','이게 우리한테 득일지 실일지'],fun:['ㅋㅋㅋ 기사 제목','댓글 1등','출근길에 읽음','점심 먹으면서 봄']}
};
const FMOOD_W={pos:{pos:.72,mix:.2,neg:.03,fun:.05},neg:{neg:.68,mix:.25,pos:.02,fun:.05},mix:{mix:.5,pos:.22,neg:.22,fun:.06}};
function fFill(t,v){ return t.replace(/\{(\w+)\}/g,(m,k)=>v[k]!=null&&v[k]!==''?v[k]:''); }
function fComments(key,bank,mood,vars,n,tid,fanAdj){ const r=fRng(key); const B=FB[bank]||FB.newsNeu; const W={...(FMOOD_W[mood]||FMOOD_W.mix)};
  if(fanAdj){ W.pos=(W.pos||0)*(1+fanAdj); W.neg=(W.neg||0)*(1-fanAdj); }
  const out=[]; const used=new Set();
  for(let i=0;i<n;i++){ let x=r()*Object.values(W).reduce((a,b)=>a+b,0), cat='mix'; for(const [k,w] of Object.entries(W)){ if((x-=w)<=0){ cat=k; break; } }
    let L=B[cat]||B.mix||B.pos||B.neg; if(!L||!L.length)L=FB.newsNeu.mix; let t=null; for(let a=0;a<4;a++){ const c=fPick(r,L); if(!used.has(c)){ t=c; break; } } if(!t)continue; used.add(t);
    const txt=fFill(t,vars).replace(/\s+/g,' ').trim(); if(!txt||/^[ ,.]/.test(txt))continue;
    const like=Math.floor(Math.pow(r(),2.2)*(cat==='fun'?60:240)); const ftid=vars.rivalTid!=null&&r()<.3?vars.rivalTid:tid;
    out.push({nick:fNick(r,ftid),tid:ftid,t:txt,like,cat,ago:Math.floor(r()*180)}); }
  out.sort((a,b)=>b.like-a.like); if(out[0]&&out[0].like>=40)out[0].best=true; if(out[1]&&out[1].like>=80)out[1].best=true; return out; }
/* 우리 팬 분위기: 여론 지수 50 기준 */
/* 지명 반응: 전체 순번과 언론 순위 차이로 스틸·오버드래프트를 가른다 */
function draftFan(p){ const d=p.draft; if(!d)return {mood:'mix',bank:'drOk',lines:[]}; const n=(d.rd-1)*10+d.no; const r=p.press||n;
  const bank=r<=n-6?'drSteal':r>=n+12&&d.rd<=3?'drReach':'drOk'; const mood=bank==='drSteal'?'pos':bank==='drReach'?'neg':'mix';
  return {bank,mood,n,r,lines:fComments('dr'+p.id,bank,mood,{p:p.name,n,r,pos:posLabel(p)},3,G.user,fanAdj())}; }
function fanAdj(){ const f=G.pr?G.pr.fan:50; return clamp((f-50)/80,-.45,.45); }
const sn=id=>{ const p=G.players[id]; return p?p.name:''; };
/* ---- 글 만들기 ---- */
function fanThreads(){ const T=[]; const me=G.user; const MN=team(me).nick; const fa=fanAdj();
  const add=(o)=>{ o.views=o.views||Math.floor(200+fRng(o.id+'v')()*(o.hot?9000:2600)); T.push(o); };
  /* 1) 최근 우리 경기 */
  for(const g of (G.games||[]).slice(0,6)){ if(!g.box)continue; const meS=g.home===me?'h':'a', op=g.home===me?g.away:g.home; const won=g.res==='승';
    const bat=g.box[meS].bat.map(b=>({b,p:G.players[b.id]})).filter(x=>x.p); const pit=g.box[meS].pit.map(q=>({q,p:G.players[q.id]})).filter(x=>x.p);
    const star=[...bat].sort((a,c)=>(c.b.h*2+c.b.hr*4+c.b.rbi*1.5)-(a.b.h*2+a.b.hr*4+a.b.rbi*1.5))[0]; const goat=[...bat].sort((a,c)=>(a.b.h*2-a.b.so)-(c.b.h*2-c.b.so))[0];
    const sp=pit[0]; const worstP=[...pit].sort((a,c)=>c.q.er-a.q.er)[0];
    const rr=won?(sp&&sp.q.er<=1?sp.p.name:star?.p.name):(worstP&&worstP.q.er>=3?worstP.p.name:goat?.p.name);
    const vars={p:star?star.p.name:'',q:sp?sp.p.name:'',r:rr||'',O:team(op).nick,T:MN};
    const sc=`${g.home===me?g.hs:g.as}:${g.home===me?g.as:g.hs}`;
    const title=won?fPick(fRng('gt'+g.day),[`${tshort(op)}전 ${sc} 승리 후기`,(vars.p?`오늘 ${vars.p} 보신 분`:'오늘 경기 총평'),`${sc} 승! 오늘 경기 총평`,`이기니까 좋네요 (${sc})`]):fPick(fRng('gt'+g.day),[`${tshort(op)}전 ${sc} 패배... 총평`,(vars.r?`${vars.r} 오늘 왜 그랬냐`:'오늘 경기 총평'),`오늘 경기 보고 화나신 분`,`${sc} 패, 할 말이 없다`]);
    add({id:'g'+g.day,d:g.day,cat:'경기',title,body:`${team(op).city} ${team(op).nick}전 ${sc} ${won?'승리':g.res==='무'?'무승부':'패배'}.${star?` ${star.p.name} ${star.b.ab}타수 ${star.b.h}안타${star.b.hr?` ${star.b.hr}홈런`:''}.`:''}`,tid:me,ref:won?star?.p.id:null,
      cm:fComments('gc'+g.day,won?'win':'loss',won?'pos':'neg',vars,6,me,fa),hot:Math.abs(g.hs-g.as)>=5}); }
  /* 2) 연승·연패 */
  try{ const st=streakOf(me)||''; const m=st.match(/(\d+)\s*(연승|연패)/); if(m&&+m[1]>=3){ const w=m[2]==='연승'; const k=`s${G.day}`; add({id:'st'+G.day,d:G.day,cat:'잡담',title:w?`${m[1]}연승 실화냐`:`${m[1]}연패... 다들 괜찮으세요`,body:'',tid:me,cm:fComments('stc'+G.day,w?'wstreak':'lstreak',w?'pos':'neg',{n:m[1]},6,me,fa),hot:true}); } }catch(e){}
  /* 3) 이번 주 순위 */
  try{ const wk=Math.floor(G.day/7); const order=standingsNow(); const rk=order.findIndex(x=>x.tid===me)+1; const gp=(G.sea.rec[me].w+G.sea.rec[me].l);
    if(gp>=10){ const T2=gmTrend(); const weak=T2&&T2.weak?SLOTS_S[T2.weak.k]:'';
      const bank=rk<=3?'rankTop':rk<=6?'rankMid':'rankLow'; add({id:'rk'+wk,d:wk*7,cat:'잡담',title:rk<=3?`${rk}위... 올해 진짜 다르다`:rk<=6?`현재 ${rk}위, 5강 가능하냐`:`${rk}위 실화냐`,body:'',tid:me,cm:fComments('rkc'+wk,bank,rk<=3?'pos':rk<=6?'mix':'neg',{n:rk,pos:weak},6,me,fa)}); } }catch(e){}
  /* 4) 요즘 잘하는·못하는 우리 선수 */
  try{ const wk0=Math.floor(G.day/7); const HC=G.fanHC=(G.fanHC&&G.fanHC.y===G.year)?G.fanHC:{y:G.year,w:{}};
    if(!HC.w[wk0]){ const L=playersOf(me).filter(p=>!p.isP&&p.l10&&p.l10.length>=6).map(p=>{ const a=p.l10; const ab=sum(a.map(x=>x[0])),h=sum(a.map(x=>x[1])),bb=sum(a.map(x=>x[3])),xb=sum(a.map(x=>x[5]||0)); return {p,ops:ab?(h+bb)/(ab+bb)+(h+xb)/ab:0}; });
      if(L.length){ const hot=[...L].sort((a,b)=>b.ops-a.ops)[0], cold=[...L].sort((a,b)=>a.ops-b.ops)[0]; HC.w[wk0]={h:hot.ops>=.95?[hot.p.id,+hot.ops.toFixed(3)]:null,c:cold.ops<.55&&cold!==hot?[cold.p.id,+cold.ops.toFixed(3)]:null};
        const ks=Object.keys(HC.w).map(Number).sort((x,y)=>y-x); ks.slice(4).forEach(k=>delete HC.w[k]); } }
    for(const [wk_,e] of Object.entries(HC.w)){ const wk=+wk_; const hp=e.h&&G.players[e.h[0]], cp=e.c&&G.players[e.c[0]];
      if(hp)add({id:'hot'+wk+hp.id,d:wk*7+1,cat:'선수',title:fPick(fRng('ht'+wk),[`${hp.name} 요즘 폼 미쳤다`,`${hp.name} 최근 10경기 OPS ${fmt3(e.h[1])}`,`${hp.name} 연봉 협상 걱정된다 (좋은 의미)`]),body:'',tid:me,ref:hp.id,cm:fComments('hc'+wk+hp.id,hp.foreign?'forGood':'hot','pos',{p:hp.name},5,me,fa)});
      if(cp)add({id:'cold'+wk+cp.id,d:wk*7+1,cat:'선수',title:fPick(fRng('ct'+wk),[`${cp.name} 언제 살아나냐`,`${cp.name} 최근 10경기 OPS ${fmt3(e.c[1])}...`,`${cp.name} 2군 보내야 하지 않나`]),body:'',tid:me,ref:cp.id,cm:fComments('cc'+wk+cp.id,cp.foreign?'forBad':'cold','neg',{p:cp.name},5,me,fa)}); } }catch(e){}
  /* 4-2) 우리 드래프트 총평 */
  try{ const mine=Object.values(G.players).filter(p=>p.team===G.user&&p.draft&&p.draft.y===G.year&&p.draft.rd<=3).sort((a,b)=>a.draft.rd-b.draft.rd||a.draft.no-b.draft.no);
    if(mine.length&&G.cal&&G.day>=G.cal.draft){ const sc=sum(mine.map(p=>{ const n=(p.draft.rd-1)*10+p.draft.no, r=p.press||n; return clamp((n-r)/10,-1.5,1.5); }))/mine.length; const mood=sc>.25?'pos':sc<-.25?'neg':'mix';
      add({id:'dr'+G.year,d:G.cal.draft,cat:'잡담',title:`${G.year} 드래프트 우리 픽 총평: ${mine.slice(0,3).map(p=>p.name).join(', ')}`,body:mine.map(p=>`${p.draft.rd}R ${p.draft.no}순위 ${p.name}(${posLabel(p)}, 언론 ${p.press||'-'}위)`).join(' / '),tid:me,ref:mine[0].id,cm:fComments('drs'+G.year,'drSum',mood,{},6,me,fa)}); } }catch(e){}
  /* 5) 우리 트레이드 */
  for(const t of (G.trades||[]).slice(-6)){ const gets=(t.gi||[]).map(sn).filter(Boolean), gives=(t.go||[]).map(sn).filter(Boolean); if(!gets.length&&!gives.length)continue;
    const gr=t.grade||'C'; const good=/[AB]/.test(gr), bad=/[DF]/.test(gr); const p0=G.players[(t.gi||[])[0]]; const pos=p0?(p0.isP?(isSPr(p0)?'선발':'불펜'):POSS[p0.pos]||''):'';
    const vars={p:gets[0]||'',q:gives[0]||'',pos,O:team(t.with).nick};
    add({id:'tr'+t.d+(t.gi||[]).join('.'),d:t.d,cat:'오피셜',title:`${gets.join('·')} ↔ ${gives.join('·')} 트레이드`,body:`${tname(t.with)}와(과) 트레이드. 언론 평점 ${gr}.`,tid:me,ref:t.gi&&t.gi[0],hot:true,
      cm:fComments('tc'+t.d+gets.join(),good?'tradeG':bad?'tradeB':'tradeE',good?'pos':bad?'neg':'mix',vars,8,me,fa).concat(fComments('tr2'+t.d,'rival',bad?'pos':good?'neg':'mix',{...vars,O:team(t.with).nick,p:gives[0]||'',q:gets[0]||''},2,t.with,0))}); }
  /* 6) 다른 구단 트레이드 */
  for(const x of (G.lgTrades||[]).slice(0,5)){ const A=x.ag.map(id=>G.players[id]).filter(Boolean), B=x.bg.map(id=>G.players[id]).filter(Boolean); if(!A.length||!B.length)continue;
    const v=s=>sum(s.map(p=>ovr(p)+(p.age<=25?4:p.age>=33?-4:0))); const dv=v(A)-v(B); const aw=dv>4?'pos':dv<-4?'neg':'mix';
    add({id:'lt'+x.d+x.a+x.b,d:x.d,cat:'트레이드',title:`${tshort(x.a)}-${tshort(x.b)} ${A[0].name}↔${B[0].name} 트레이드 어떻게 봄?`,body:`${tname(x.a)}은(는) ${A.map(p=>p.name).join('·')}을(를) 얻고 ${B.map(p=>p.name).join('·')}을(를) 내줬다.`,tid:null,
      cm:fComments('ltc'+x.d+x.a,'rival',aw,{O:team(x.a).nick,p:A[0].name,q:B[0].name},3,x.a,0).concat(fComments('ltd'+x.d+x.b,'rival',aw==='pos'?'neg':aw==='neg'?'pos':'mix',{O:team(x.b).nick,p:B[0].name,q:A[0].name},3,x.b,0))}); }
  /* 7) 리그 소식: 감독·기록·외국인 */
  for(const w of (G.wire||[]).slice(0,60)){
    if(w.k==='감독'){ const fire=w.x&&w.x.fire; const m=w.tid!=null?G.mgr[w.tid]:null; const good=m&&!fire&&((m.fame||0)>=65||(m.tac||0)>=66||m.ob); const bad=m&&!fire&&(m.fame||0)<45&&(m.tac||0)<55;
      const ours=w.tid===me; add({id:'mg'+w.d+w.tid+(fire?'f':''),d:w.d,cat:'감독',title:fire?`[속보] ${w.t}`:`${w.t.replace(/가 (.+) 감독을 새로 선임했습니다\./,' 새 감독 $1')} 어떻게 봄?`,body:m&&!fire?`${m.name} 감독 · ${m.career||'경력 정보 없음'}`:'',tid:w.tid,hot:ours,
        cm:fComments('mgc'+w.d+w.tid,fire?'mgrFire':'mgrHire',fire?'mix':good?'pos':bad?'neg':'mix',{m:m?m.name:'',ob:m&&m.ob?'우리 팀 출신 레전드 귀환 ㄷㄷ':''},ours?7:4,w.tid,ours?fa:0)}); }
    else if(w.k==='기록'){ const p=w.ref!=null?G.players[w.ref]:null; const nm=p?p.name:(w.t.split(' ')[0]); add({id:'ft'+w.d+w.t.length,d:w.d,cat:'기록',title:`ㄷㄷ ${w.t}`,body:'',tid:p?p.team:null,ref:p?p.id:null,hot:true,cm:fComments('ftc'+w.d+nm,'feat','pos',{p:nm},5,p?p.team:null,0)}); }
    else if(w.k==='외국인'&&w.tid===me){ add({id:'fo'+w.d+w.t.length,d:w.d,cat:'외국인',title:w.t,body:'',tid:me,cm:fComments('foc'+w.d,'forChg','mix',{},4,me,fa)}); } }
  /* 8) 우리 구단 기사 */
  for(const n of (G.news||[]).slice(0,14)){ if(n.k==='경기')continue; const p=n.ref!=null?G.players[n.ref]:null;
    const bank=n.k==='선수'&&p&&p.foreign?(n.v<0?'forBad':'forGood'):n.v>=1?'newsPos':n.v<=-1?'newsNeg':'newsNeu';
    add({id:'n'+n.id,d:n.d,cat:'기사',title:`[${n.o}] ${n.t}`,body:n.b||'',tid:me,ref:n.ref,nid:n.id,cm:fComments('nc'+n.id,bank,n.v>=1?'pos':n.v<=-1?'neg':'mix',{p:p?p.name:''},5,me,fa)}); }
  const seen=new Set(); return T.filter(t=>{ if(seen.has(t.id))return false; seen.add(t.id); return true; }).sort((a,b)=>b.d-a.d||(b.hot?1:0)-(a.hot?1:0)).slice(0,40); }
/* 기사 하나의 댓글 */
function newsComments(n){ const p=n.ref!=null?G.players[n.ref]:null; const bank=n.k==='선수'&&p&&p.foreign?(n.v<0?'forBad':'forGood'):n.k==='경기'?(n.v>=0?'win':'loss'):n.v>=1?'newsPos':n.v<=-1?'newsNeg':'newsNeu';
  return fComments('nc'+n.id,bank,n.v>=1?'pos':n.v<=-1?'neg':'mix',{p:p?p.name:'',r:p?p.name:'',O:''},5,G.user,fanAdj()); }
/* 최근 우리 트레이드 반응 두 줄 (트레이드 성사 도장에 붙인다) */
function tradeFanLines(){ const t=(G.trades||[])[G.trades.length-1]; if(!t)return []; const th=fanThreads().find(x=>x.id==='tr'+t.d+(t.gi||[]).join('.')); return th?th.cm.slice(0,3):[]; }
function gameFanLines(g){ if(!g)return []; const th=fanThreads().find(x=>x.id==='g'+g.day); return th?th.cm.slice(0,2):[]; }
/* ---- 화면 ---- */
const FCAT={경기:'',트레이드:'tr',오피셜:'of',감독:'mg',선수:'pl',기록:'ft',외국인:'fo',잡담:'',기사:'nw'};
function cmtRow(c){ return `<div class="fcm${c.best?' best':''}"><div class="fcm-h">${c.best?'<i class="fbest">베스트</i>':''}${c.tid!=null?badge(c.tid,12):''}<b>${esc(c.nick)}</b><span>${c.ago<60?c.ago+'분 전':Math.floor(c.ago/60)+'시간 전'}</span><em>추천 ${c.like}</em></div><p>${lk(c.t)}</p></div>`; }
function fanBoard(){ const L=fanThreads(); const f=UI.fbf||'all'; const cats=['all','경기','트레이드','감독','선수','기사'];
  const pass=t=>f==='all'||(f==='트레이드'?(t.cat==='트레이드'||t.cat==='오피셜'):f==='선수'?(t.cat==='선수'||t.cat==='외국인'||t.cat==='기록'):t.cat===f);
  const R=L.filter(pass); const open=UI.fbo;
  const row=t=>{ const o=open===t.id; const best=t.cm.filter(c=>c.best).length; return `<div class="fth${o?' open':''}"><button class="fth-h" data-a="fbo" data-v="${esc(t.id)}"><span class="fcat ${FCAT[t.cat]||''}">${t.cat}</span><span class="fth-t"><b>${lk(t.title)}</b> <i class="fcn">[${t.cm.length}]</i>${t.hot?'<i class="fhot">인기</i>':''}</span><span class="fth-m">${t.tid!=null?badge(t.tid,12):''}${esc(fNick(fRng(t.id+'w'),t.tid))} · ${dsh(Math.max(0,t.d))} · 조회 ${t.views.toLocaleString()} · 추천 ${Math.floor(t.views/40)}</span></button>
      ${o?`<div class="fth-b">${t.body?`<p class="fbody">${lk(t.body)}</p>`:''}${t.ref!=null&&G.players[t.ref]?`<button class="tc-i" data-a="player" data-v="${t.ref}">${esc(G.players[t.ref].name)} 카드</button>`:''}<div class="fcms">${t.cm.map(cmtRow).join('')}</div></div>`:''}</div>`; };
  return `<section class="card"><div class="row between"><h2 class="sec">팬 게시판</h2><span class="small muted">팬 여론 ${Math.round(G.pr?G.pr.fan:50)} · 글을 누르면 댓글</span></div>
    <div class="chips">${cats.map(k=>`<button data-a="fbf" data-v="${k}" class="${f===k?'on':''}">${k==='all'?'전체':k}</button>`).join('')}</div>
    ${R.length?`<div class="fboard">${R.map(row).join('')}</div>`:'<p class="small muted">아직 글이 없습니다. 경기가 시작되면 팬들이 글을 올립니다.</p>'}
    <p class="small muted">팬 게시판은 경기·트레이드·감독 선임·선수 성적·기사를 보고 팬들이 남기는 반응입니다. 팬 여론이 높을수록 우리 구단에 너그럽습니다.</p></section>`; }
function fanLinesHtml(L,title){ return L.length?`<div class="fanl"><span class="eyebrow">${title||'팬 반응'}</span>${L.map(c=>`<p><b>${esc(c.nick)}</b> ${lk(c.t)} <em>추천 ${c.like}</em></p>`).join('')}</div>`:''; }

/* ---------- 우리 선수단 빠르게 보기 ---------- */
/* 우리 팀 상황 요약: 성적·목표·돈·빠진 선수·다음 경기 */
function teamStatusBox(){ const per=period(); const gs=goalStatus(); const ci=capInfo(G.user); let b=null; try{ b=budget(); }catch(e){}
  const st=(per==='season'||per==='post')&&G.sea&&G.sea.rec?standingsNow():null; const i=st?st.findIndex(x=>x.tid===G.user):-1; const me=i>=0?st[i]:null;
  const gb=me&&i>0?((st[0].w-me.w)+(me.l-st[0].l))/2:0; const fifth=st&&st[4]?st[4]:null; const g5=me&&fifth&&i>4?((fifth.w-me.w)+(me.l-fifth.l))/2:null;
  const pr=G.proj?G.proj.indexOf(G.user)+1:null;
  const rec=me?`<b>${i+1}위</b> ${me.w}승 ${me.l}패${me.t?` ${me.t}무`:''} · 승률 ${fmt3(me.w/Math.max(1,me.w+me.l))}${i>0?` · 1위와 ${gb}경기`:''}${g5!=null?` · 5위와 ${g5}경기`:''}`:`${PERIOD[per]}${pr?` · 예상 ${pr}위`:''}`;
  const ok=x=>x?'<b class="good">달성 중</b>':'<b class="bad">미달</b>';
  const goal=gs?`목표 ${gs.rank.t}위 이내 ${gs.rank.cur!=null?ok(gs.rank.ok):''} · 지원 ${Math.round(gs.sup.cur*100)}%/${Math.round(gs.sup.t*100)}% ${ok(gs.sup.ok)} · 팬 ${gs.fan.cur}/${gs.fan.t} ${ok(gs.fan.ok)}`:'올해 목표 미정';
  const out=playersOf(G.user).filter(p=>!healthy(p)); const ng=(G.cal&&per!=='off')?nextGames(1)[0]:null;
  const r=(l,v)=>`<div class="tsb-r"><span>${l}</span><span>${v}</span></div>`;
  return `<div class="tsbox">${r('성적',rec)}${r('구단주',goal)}${r('돈',`캡 ${money(ci.pay)} / ${money(ci.cap)}${ci.over>0?' <b class="bad">초과</b>':''}${b?` · 예산 여유 <b class="${b.roomGoal<0?'bad':'good'}">${money(b.roomGoal)}</b>`:''}`)}
    ${r('빠진 선수',out.length?out.slice(0,5).map(p=>`<button class="lnk" data-a="player" data-v="${p.id}">${esc(p.name)}</button>(${p.injOut>0?`부상 ${p.injOut}일`:'징계'})`).join(', ')+(out.length>5?` 외 ${out.length-5}명`:''):'없음')}
    ${ng?r('다음 경기',`${dsh(ng.d)} ${ng.home?'홈':'원정'} ${esc(tshort(ng.op))}${ng.ps?` · ${ng.ps}`:''}`):''}</div>`; }
function myRosterSheet(){ const d=depth(G.user); const ci=capInfo(G.user); const b=budget(); const rk=slotRanks(G.user); const order=orderList(d.start); const posOf={}; for(const k in d.ln)posOf[d.ln[k].id]=k;
  const row=(p,lab)=>{ const rp=scoutReport(p); const h=curLine(p); const st=!h?'-':p.isP?(h.outs?`ERA ${pRate(h).era.toFixed(2)}`:'-'):(h.pa?`OPS ${fmt3(bRate(h).ops)}`:'-');
    return `<div class="mr"><span class="mr-l">${lab}</span><button class="mr-p" data-a="player" data-v="${p.id}">${avImg(p)}<span><b>${esc(p.name)}</b><i>${p.age}세 · ${st} · ${money(p.sal)}</i></span></button><span class="mr-o">${rchip(rp.cur)}${condChip(p)}</span>${tradeOpen()&&!p.foreign?`<button class="tc-i" data-a="toTradeGive" data-v="${p.id}" title="트레이드 카드로">카드</button>`:''}</div>`; };
  const fut=[...d.futB,...d.futP].filter(p=>!p.ys).map(p=>({p,f:scoutReport(p).ofp||0})).sort((a,b)=>b.f-a.f).slice(0,6).map(x=>x.p);
  return `<div class="scrim" data-a="closeSheet"><div class="sheet gut" data-stop="1" role="dialog" aria-label="우리 선수단">
    <div class="sheet-head"><div><div class="eyebrow">${esc(tname(G.user))}</div><h2 class="sec">우리 팀 현황</h2></div><button class="x" data-a="closeSheet" aria-label="닫기">×</button></div>
    ${teamStatusBox()}
    <div class="slotbar">${PSLOTS.map(k=>`<span class="sl ${rkCls(rk[k].rank)}"><span>${SLOTS_S[k]}</span><b>${rk[k].rank}</b></span>`).join('')}</div>
    <p class="small muted">캡 산정액 ${money(ci.pay)} / ${money(ci.cap)} · 예산 여유 ${money(b.roomGoal)} · "카드"를 누르면 트레이드 테이블에 올라갑니다</p>
    <div class="eyebrow">타순</div>${order.map((p,i)=>row(p,`${i+1} ${POSS[posOf[p.id]]||''}`)).join('')}
    <div class="eyebrow">선발 로테이션</div>${d.sp.map((p,i)=>row(p,`${i+1}선발`)).join('')}
    <div class="eyebrow">불펜</div>${d.pen.slice(0,7).map((p,i)=>row(p,i===0?'마무리':i<4?'필승조':'추격조')).join('')}
    <div class="eyebrow">벤치</div>${d.bench.slice(0,6).map(p=>row(p,POSS[p.pos]||posLabel(p))).join('')}
    ${fut.length?`<div class="eyebrow">퓨처스 유망주</div>${fut.map(p=>row(p,posLabel(p))).join('')}`:''}
  </div></div>`; }

/* ---------- 트레이드 센터 ---------- */
function gmAv(tid,expr){ const g=gmOf(tid); if(!g)return ''; return avImg({persona:'gm',pid:g.id,team:tid,age:g.age,female:g.f,expr:expr||null,name:g.name}); }
function relBar(r){ return `<span class="relb" title="친분 ${r}"><i style="width:${r}%;background:${r>=65?'#3fbf6a':r>=45?'#e6b93b':'#e0564f'}"></i></span>`; }
function deadlineBanner(){ const per=period(); if(per!=='season')return ''; const end=KD(7,31); const d=end-G.day; if(d<0||d>30)return '';
  return `<div class="dlb${d<=7?' hot':''}"><b>${d===0?'오늘 트레이드 마감':`트레이드 마감 D-${d}`}</b><span>7월 31일 자정까지${d<=7?' · 제안이 몰리는 시기입니다':''}</span></div>`; }
function vsBanner(){ if(!tradeOpen())return ''; const o=seriesOpp(); if(o==null)return ''; const g=gmOf(o); return `<div class="vsb">${badge(o,22)}<div><b>맞대결 중: ${esc(tshort(o))}</b><span>${g?esc(g.name)+' 단장이 경기장에 와 있습니다. 이 구단과는 횟수 제한 없이 협상할 수 있습니다.':'이 구단과는 횟수 제한 없이 협상할 수 있습니다.'}</span></div><button class="btn small primary" data-a="tpartnerGo" data-v="${o}">협상하기</button></div>`; }
function negChip(tid){ const ni=negInfo(tid); return ni.free?`<span class="negc free">맞대결 중 · 협상 제한 없음</span>`:`<span class="negc ${ni.left?'':'out'}">이번 달 협상 <b>${ni.left}</b>/${ni.cap}${ni.left?'':` · ${ni.next} 재개`}</span>`; }
function intLine(tid,short){ if(!interestKnown(tid))return short?'':'<p class="small muted">친분이 35 미만이라 이 단장이 우리 누구를 원하는지 읽기 어렵습니다.</p>';
  const L=aiInterest(tid).map(id=>G.players[id]).filter(Boolean); if(!L.length)return short?'':'<p class="small muted">지금은 우리 선수 중 눈여겨보는 선수가 없습니다.</p>';
  return `<div class="intl"><span class="small muted">${short?'관심':'우리 선수 관심'}</span>${L.map(p=>`<button class="pill good" data-a="player" data-v="${p.id}" title="${esc(interestWhy(tid,p))}">${esc(p.name)}${short?'':` · ${esc(interestWhy(tid,p))}`}</button>`).join('')}</div>`; }
function gmCard(t,full){ const g=gmOf(t.id); if(!g)return ''; const c=(G.gmc||{})[t.id]||{};
  return `<div class="gmc"><div class="gmc-h">${gmAv(t.id)}<div><b>${badge(t.id,16)} ${esc(t.city+' '+t.nick)}${g.ob?obTag(g.ob):''}</b><span>${g.interim?'단장대행 체제':`${esc(g.name)} 단장 · ${g.age}세`}</span></div><span class="pill ${g.trait==='hard'||g.trait==='miser'?'warn':g.trait==='loyal'?'good':'acc'}">${GMT[g.trait].l}</span></div>
    <div class="gmc-r"><span class="small muted">친분</span>${relBar(t.rel)}<b>${t.rel}</b><span class="small muted">${relLabel(t.rel)}</span></div>
    <p class="gmc-n">${esc(needText(t.id))}</p>${intLine(t.id)}<div class="gmc-q">${negChip(t.id)}</div>
    ${full?`<p class="small muted">${esc(GMT[g.trait].d)} ${esc(g.car)} · ${g.since}년부터 재임</p>`:''}
    <div class="row"><button class="btn small primary" data-a="tpartnerGo" data-v="${t.id}">협상 테이블</button><button class="btn small" data-a="gmCall" data-v="${t.id}" ${c.call!=null&&c.call>G.day-14?'disabled':''}>안부 연락</button><button class="btn small" data-a="gmMeal" data-v="${t.id}" ${c.meal!=null&&c.meal>G.day-30?'disabled':''}>식사 (1천만)</button></div></div>`; }
function feedList(n){ const W=(G.wire||[]).filter(w=>['트레이드','루머','단장'].includes(w.k)).slice(0,n);
  return W.length?`<div class="feed">${W.map(w=>`<div class="fd"><span class="pill ${w.k==='트레이드'?'acc':w.k==='단장'?'warn':''}">${w.k}</span><span>${lk(w.t)}</span><i>${dsh(w.d)}</i></div>`).join('')}</div>`:'<p class="small muted">아직 소식이 없습니다.</p>'; }
/* 조건을 주고 스카우트 보고를 받는다 */
function recCard(){ const c=Object.assign({k:'SS',type:'now',age:'',sal:''},UI.rec||{}); const R=UI._rec;
  const sel=(f,opts)=>`<select data-a="recF" data-v="${f}" aria-label="${f}">${opts.map(([v,l])=>`<option value="${v}" ${String(c[f])===String(v)?'selected':''}>${l}</option>`).join('')}</select>`;
  const form=`<div class="row wrapr" style="gap:6px">${sel('k',PSLOTS.filter(k=>k!=='DH').map(k=>[k,SLOTK[k]]))}${sel('type',Object.entries(RTYPE))}${sel('age',[['','나이 무관'],['30','30세 이하'],['26','26세 이하'],['23','23세 이하']])}${sel('sal',[['','연봉 무관'],['1000','10억 이하'],['500','5억 이하'],['300','3억 이하']])}<button class="btn small primary" data-a="rqGo">보고 받기</button></div>`;
  let body=''; if(R){ const pm=id=>{ const q=G.players[id]; return q?pMini(q):''; };
    body=R.list.length?`<div class="dealg">${R.list.map((x,i)=>{ const p=G.players[x.id]; if(!p)return ''; const push=x.push&&G.players[x.push], blk=x.blk&&G.players[x.blk];
      return `<div class="deal"><div class="deal-h"><b>${SLOTK[x.k]} · ${RTYPE[R.type]}</b><span class="small muted">${esc(tshort(x.tid))}</span></div>
        <div class="deal-b"><div><span class="eyebrow">후보</span>${pMini(p)}</div>${x.give.length?`<div><span class="eyebrow">상대가 원하는 선수</span>${x.give.map(pm).join('')}</div>`:''}</div>
        <ul class="rec-w">${x.why.map(w=>`<li>${esc(w)}</li>`).join('')}<li>${esc(x.cost)}</li>${push?`<li>밀려나는 선수: ${esc(push.name)}(${posLabel(push)})</li>`:''}${blk?`<li class="warn">자리가 막힐 수 있는 유망주: ${esc(blk.name)}(${blk.age}세)</li>`:''}</ul>
        <div class="row">${R.open&&x.give.length?`<button class="btn small primary" data-a="tsugGo" data-v="r:${i}">이 조건으로 제안</button><button class="btn small" data-a="tsugEdit" data-v="r:${i}">조건 고치기</button>`:''}<button class="btn small" data-a="star" data-v="${p.id}">${(G.shortlist||[]).includes(p.id)?'★ 관찰 중':'☆ 관찰 명단'}</button></div></div>`; }).join('')}</div>${R.open?'':'<p class="small muted">트레이드 기간이 아니라 관찰 명단에만 올릴 수 있습니다.</p>'}`
      :`<p class="small">${esc(R.hint)}</p>`; }
  return `<section class="card"><div class="row between"><h2 class="sec">스카우트에게 영입 요청</h2>${R?`<span class="small muted">우리 ${SLOTK[R.k]} 리그 ${R.rank}위</span>`:''}</div>${form}${body}</section>`; }
function tcMarket(){ const open=tradeOpen(); const mt=inTabs('mkv',[['sug','추천 트레이드'],['req','영입 요청'],['find','선수 찾기'],['news','시장 소식']],'sug'); const L=open&&mt.cur==='sug'?tradeSuggest(false):[]; if(mt.cur==='sug')UI._tsug=L;
  if(mt.cur==='req')return deadlineBanner()+mt.bar+recCard();
  if(mt.cur==='find')return deadlineBanner()+mt.bar+tcFind();
  if(mt.cur==='news')return deadlineBanner()+mt.bar+`<section class="card"><h2 class="sec">시장 소식</h2>${feedList(14)}</section>`;
  return `${deadlineBanner()}${mt.bar}
  <section class="card"><div class="row between"><h2 class="sec">추천 트레이드</h2>${open?'<button class="tc-i" data-a="tsugMore">다른 추천</button>':''}</div>${UI.deskMsg?`<div class="note ${UI.deskOk?'':'bad'}">${esc(UI.deskMsg)}</div>`:''}
    ${!open?'<p class="small muted">트레이드 기간이 아닙니다(7월 31일 마감, 포스트시즌 뒤 다시 열림).</p>':L.length?`<div class="dealg">${L.map((x,i)=>dealCard(x,i,'d')).join('')}</div>`:'<p class="small muted">지금 바로 성사될 만한 보강 트레이드가 없습니다.</p>'}</section>`; }
function tcFind(){ const tg=UI.findT&&G.players[UI.findT]&&G.players[UI.findT].team!=null&&G.players[UI.findT].team!==G.user?G.players[UI.findT]:null;
  const mine=UI.findM&&G.players[UI.findM]&&G.players[UI.findM].team===G.user?G.players[UI.findM]:null; const open=tradeOpen();
  const pf=UI.findPos||'all'; const chips=`<div class="chips">${[['all','전체'],...PSLOTS.filter(k=>k!=='DH').map(k=>[k,SLOTS_S[k]])].map(([k,l])=>`<button data-a="findPos" data-v="${k}" class="${pf===k?'on':''}">${l}</button>`).join('')}</div>`;
  const ft=UI.findTeam||'all', fs=UI.findSort||'cur';
  const fval=p=>{ const h=curLine(p); if(fs==='war')return h?wOf(h,p):-9; if(fs==='stat')return h?(p.isP?(h.outs>=30?-pRate(h).era:-99):(h.pa>=50?bRate(h).ops:-1)):-99; if(fs==='ofp'){const r=scoutReport(p);return r.ofp??r.cur;} if(fs==='young')return -p.age*100+ovr(p); if(fs==='sal')return -p.sal; return ovr(p); };
  const pool=Object.values(G.players).filter(p=>p.team!=null&&p.team!==G.user&&!p.foreign&&!p.ys&&!(p.joinY>G.year)&&(ft==='all'||p.team===+ft)&&(pf==='all'||pSlot(p)===pf||(!p.isP&&subsOf(p).includes(pf)))).map(p=>({p,v:fval(p)})).sort((a,b)=>b.v-a.v).slice(0,24).map(x=>x.p);
  const fsel=`<div class="row wrapr" style="gap:6px;margin:6px 0"><select data-a="findTeam" aria-label="구단"><option value="all">다른 구단 전체</option>${G.teams.filter(t=>t.id!==G.user).map(t=>`<option value="${t.id}" ${String(t.id)===String(ft)?'selected':''}>${esc(tshort(t.id))}</option>`).join('')}</select><select data-a="findSort" aria-label="정렬">${[['cur','현재 능력'],['war','WAR'],['stat','성적(OPS·평균자책)'],['ofp','장래성'],['young','어린 순'],['sal','연봉 낮은 순']].map(([k,l])=>`<option value="${k}" ${fs===k?'selected':''}>${l}</option>`).join('')}</select></div>`;
  let A='';
  if(tg){ const pk=open?findPackages(tg.id):[]; UI._find=pk.map(g=>({k:pSlot(tg),id:tg.id,tid:tg.team,give:g,rank0:slotRanks(G.user)[pSlot(tg)]?slotRanks(G.user)[pSlot(tg)].rank:null}));
    A=`<section class="card"><div class="row between"><h2 class="sec">${esc(tg.name)}을(를) 얻으려면</h2><button class="tc-i" data-a="findT" data-v="">다른 선수</button></div>${pMini(tg)}<p class="small muted">${badge(tg.team,14)} ${esc(tname(tg.team))} · ${esc(needText(tg.team))}</p>
      ${!open?'<p class="small muted">트레이드 기간이 아닙니다.</p>':UI._find.length?`<div class="dealg">${UI._find.map((x,i)=>dealCard(x,i,'f')).join('')}</div>`:'<p class="small muted">우리 선수로 맞출 수 있는 조합이 없습니다. 친분을 쌓거나, 상대가 원하는 유망주를 키운 뒤 다시 보세요.</p>'}</section>`; }
  else A=pwatchBox()+`<section class="card"><div class="row between"><h2 class="sec">선수 찾기</h2><span class="small muted">다른 구단 선수 전체에서 고르기</span></div>${chips}${fsel}${(()=>{ const P=pager('find'+ft+pf+fs,pool,10); return `<div class="fl" data-pg="${'find'+ft+pf+fs}">${P.items.map(p=>`<div class="flr">${pMini(p)}<span class="small muted">${badge(p.team,14)} ${tshort(p.team)}</span><button class="tc-i go" data-a="findT" data-v="${p.id}">조건 찾기</button></div>`).join('')}</div>${P.bar}`; })()}</section>`;
  let B='';
  if(mine){ const L=open?marketFor(mine.id):[]; UI._mkt=L;
    B=`<section class="card"><div class="row between"><h2 class="sec">${esc(mine.name)}의 시장 가치</h2><button class="tc-i" data-a="findMine" data-v="">다른 선수</button></div>${pMini(mine)}
      ${!open?'<p class="small muted">트레이드 기간이 아닙니다.</p>':L.length?L.map((x,i)=>`<div class="mko"><div class="mko-h">${gmAv(x.tid)}<b>${badge(x.tid,14)} ${esc(tshort(x.tid))}</b><span class="small muted">${esc(GMT[gmOf(x.tid).trait].l)}</span></div><div class="mko-b">${x.give.map(id=>pMini(G.players[id])).join('')}</div>${dealMoney([mine.id],x.give)}<button class="btn small primary" data-a="mktGo" data-v="${i}">이 조건으로 보내기</button></div>`).join(''):'<p class="small muted">지금 이 선수를 원하는 구단이 없습니다.</p>'}</section>`; }
  else B=`<section class="card"><h2 class="sec">우리 선수 시장 가치 보기</h2>${(()=>{ const P=pager('mval',domestic(G.user).filter(p=>!p.ys&&!(p.joinY>G.year)).sort((a,b)=>ovr(b)-ovr(a)),8); return `<div class="fl" data-pg="mval">${P.items.map(p=>`<div class="flr">${pMini(p)}<span class="small muted">${money(p.sal)}</span><button class="tc-i" data-a="findMine" data-v="${p.id}">가치 보기</button></div>`).join('')}</div>${P.bar}`; })()}</section>`;
  return (UI.deskMsg?`<div class="note ${UI.deskOk?'':'bad'}">${esc(UI.deskMsg)}</div>`:'')+A+B; }
function tcGms(){ return `<section class="card"><div class="row between"><h2 class="sec">다른 구단 단장들</h2><span class="small muted">안부 연락 2주 1회 · 식사 한 달 1회</span></div>${UI.gmMsg?`<div class="note">${esc(UI.gmMsg)}</div>`:''}${(()=>{ const P=pager('gms',G.teams.filter(t=>t.id!==G.user),3); return `<div class="gmg" data-pg="gms">${P.items.map(t=>gmCard(t,true)).join('')}</div>${P.bar}`; })()}</section>`; }
function tcReport(){ const my=(G.trades||[]).filter(t=>t.gi).slice().reverse(); const rep=G.rep??50;
  const row=t=>{ const r=tradeReport(t); return `<div class="trr"><div><b>${t.y} ${t.d!=null?dmd(t.d):''} · ${badge(t.with,14)} ${esc(tshort(t.with))}</b><span>받음 ${esc(t.get.join(', ')||'-')} · 보냄 ${esc(t.give.join(', ')||'-')}</span></div><span class="grade g${t.grade||'C'}">${t.grade||'-'}</span>${r?`<span class="trw ${r.net>=.5?'up':r.net<=-.5?'dn':''}">${r.net>=0?'+':''}${r.net.toFixed(1)} WAR</span>`:''}</div>`; };
  const lg=(G.lgTrades||[]).slice(0,10).map(x=>`<div class="fd"><span class="pill acc">${x.y}</span><span>${esc(tshort(x.a))} ← ${x.ag.map(id=>G.players[id]?G.players[id].name:'?').join(', ')} / ${esc(tshort(x.b))} ← ${x.bg.map(id=>G.players[id]?G.players[id].name:'?').join(', ')}</span><i>${dsh(x.d)}</i></div>`).join('');
  return `<section class="card"><div class="row between"><h2 class="sec">단장 명성</h2><b class="num">${rep}</b></div><div class="repb"><i style="width:${rep}%"></i></div><p class="small">${repLabel(rep)}. 명성이 높으면 시즌 뒤 단장이 바뀌는 구단에서 영입 제의가 옵니다. 경질되더라도 명성이 있으면 다른 구단이 부릅니다.</p></section>
  <section class="card"><div class="row between"><h2 class="sec">우리 트레이드 성적표</h2><span class="small muted">평점은 거래 당시 언론 평가, WAR은 이후 실제 성적 차이</span></div>${my.length?my.map(row).join(''):'<p class="small muted">아직 트레이드 기록이 없습니다.</p>'}</section>
  <section class="card"><h2 class="sec">리그 트레이드</h2>${lg?`<div class="feed">${lg}</div>`:'<p class="small muted">아직 없습니다.</p>'}</section>`; }
function tradeCenter(){ faCelebrate(); const s=curSub('trade'); const BODY={block:blockCenter,market:tcMarket,fa:faCenter,find:tcFind,table:()=>tradeView(),offers:blockCenter,gms:tcGms,report:tcReport}; const body=()=>mergedBody('trade',s,BODY);
  return subTabs('trade')+(s!=='market'&&s!=='fa'&&s!=='block'?deadlineBanner():'')+(s!=='fa'?vsBanner():'')+body()+(UI.stamp?stampView():'')+'<button class="fabtn" data-a="myRos">우리 선수단</button>'; }
function stampView(){ const s=UI.stamp; return `<div class="stamp-w" data-a="stampOff"><div class="stamp"><b>${esc(s.title||'거래 성사')}</b><span>${esc(s.msg)}</span>${s.grade?`<div class="sg">언론 평점 <i class="grade g${s.grade}">${s.grade}</i></div>`:''}${s.fans&&s.fans.length?fanLinesHtml(s.fans,'팬 게시판 반응'):''}<em>눌러서 닫기</em></div></div>`; }
function unempView(){ const J=(G.jobs||[]).filter(j=>!j.done); const U=G.unemp; const days=G.day-(U.since??G.day); const mo=Math.floor(days/30);
  const odds=G.rep>=70?'자주':G.rep>=50?'가끔':G.rep>=30?'드물게':'거의 오지 않음';
  return `<section class="card hero"><div class="eyebrow">야인 · ${mo?`${mo}개월째`:`${days}일째`}</div><h2 class="sec">${esc(tname(U.from??G.user))} 단장에서 물러났습니다</h2><p class="small">${esc(U.msg)}</p>
    <dl class="tsum"><div><dt>단장 명성</dt><dd class="num">${G.rep}</dd></div><div><dt>평판</dt><dd>${esc(repLabel(G.rep))}</dd></div><div><dt>제의 가능성</dt><dd>${odds}</dd></div></dl>
    <p class="small sdesc">시간은 그대로 흐릅니다. 다른 구단이 단장을 바꿀 때(주로 시즌이 끝난 뒤, 가끔 7월) 명성을 보고 제의가 옵니다. 쉬는 동안 명성은 50까지 조금씩 회복됩니다. 오른쪽 위 계속을 누르며 기다리세요.</p>
    ${J.length?`<div class="eyebrow">받은 제의</div>${J.map(j=>`<div class="job">${badge(j.tid,36)}<div><b>${esc(tname(j.tid))}</b><span class="small muted">${esc(needText(j.tid))} · ${dmd(j.exp)}까지 답변</span></div><button class="btn primary" data-a="jobYes" data-v="${j.tid}">수락</button><button class="btn" data-a="jobNo" data-v="${j.tid}">거절</button></div>`).join('')}`:'<p class="small">아직 받은 제의가 없습니다.</p>'}
    <div class="row" style="margin-top:8px"><button class="btn small" data-a="retireGM">단장 경력 마치기</button></div></section>`; }
/* ---------- 단장 결정 카드 ---------- */
function decisionCard(){ const open=(G.evs||[]).filter(e=>!e.done); const last=(G.evlog||[]).filter(x=>x.d>=G.day-2&&x.y===G.year).slice(0,2);
  if(!open.length&&!last.length)return '';
  const one=e=>{ const p=e.ref!=null?G.players[e.ref]:null; const pz=p?null:personaOf(e.from);
    return `<div class="dec"><div class="dec-t">${p?avImg(p):pz?avImg(pz):'<span class="tdi">!</span>'}<div><span class="eyebrow dec-k">${evIcon(e.k)} ${EV_KEY.has(e.k)?'단장 결정':'일상 결정'} · ${dmd(e.exp)}까지${e.exp-G.day<=1?' <b class="bad">내일 자동 처리</b>':''}</span><b>${esc(e.title)}</b><p>${lk(e.sit).replace(/\n/g,'<br>')}</p></div></div>
      <div class="dec-o">${e.opts.map((o,i)=>`<button class="dec-b" data-a="evPick" data-v="${e.id}:${i}"><b>${esc(o.l)}</b><span>${esc(o.fx)}</span>${i===e.def?'<i>기한이 지나면 이것으로 처리</i>':''}</button>`).join('')}</div>${!EV_KEY.has(e.k)&&EV_NAME[e.k]?`<button class="tc-i" data-a="evDeleg" data-v="${e.id}">${esc(EV_NAME[e.k])}은(는) 앞으로 비서에게 맡기기</button>`:''}</div>`; };
  const done=last.map(x=>`<div class="dec-r"><b>${lk(x.t)}</b><span>결정: ${esc(x.c)}${x.auto?' (자동)':''}</span>${x.r?`<em>${lk(x.r)}</em>`:''}${x.f?`<em class="f">${lk(x.f)}</em>`:''}</div>`).join('');
  const dl=Object.keys(G.deleg||{}).filter(k=>G.deleg[k]&&EV_NAME[k]); const dlx=dl.length?`<p class="small muted" style="margin:6px 0 0">비서에게 맡긴 일: ${dl.map(k=>EV_NAME[k]).join(', ')} <button class="tc-i" data-a="evDelegOff">모두 직접 하기</button></p>`:'';
  return `<section class="card deccard">${open.map(one).join('')}${done?`<div class="dec-rs">${done}</div>`:''}${dlx}</section>`; }
function todoCard(){
  const it=[]; const b=blockNow();
  if(b&&!G.live)it.push({t:b,s:'',btn:blkLink(b).replace('<button ','<button class="btn small" ')});
  for(const [tab,arr] of Object.entries(SUBS)) for(const [k,l] of arr){ const key=tab+':'+k; if(key==='trade:offers'||key==='staff:dev')continue; if(TODO[key]&&subAlert(tab,k)&&!(b&&key==='staff:mgr'&&/감독/.test(b)))it.push({t:TODO[key][0],s:TODO[key][1],btn:`<button class="btn small" data-a="go" data-v="${key}">${l}</button>`}); }
  for(const o of (G.offers||[]).filter(o=>o.exp!=null&&o.exp-G.day<=2&&o.exp>=G.day).slice(0,2)){ const gp=o.get&&G.players[o.get[0]]; it.push({t:`${tshort(o.from)} 트레이드 제안 ${o.exp-G.day<=0?'오늘':o.exp-G.day+'일 뒤'} 만료`,s:gp?`상대가 원하는 선수: ${gp.name}`:'',btn:'<button class="btn small" data-a="go" data-v="trade:offers">제안 보기</button>'}); }
  const imp=G.mail.filter(m=>m.imp&&!m.read&&m.kind!=='결정'&&G.day-m.day<=20&&!(m.kind==='트레이드'&&/원한다/.test(m.subj))).slice(0,4);
  for(const m of imp)it.push({t:m.subj,s:`${m.from} · ${dsh(m.day)}`,btn:`<button class="btn small" data-a="openMail" data-v="${m.id}">읽기</button>`,mail:m});
  const unread=G.mail.filter(m=>!m.read).length;
  const per=period();
  const body=it.length?`<div class="todo">${it.map(x=>`<div class="td">${x.mail?senderAv(x.mail):'<span class="tdi">!</span>'}<div><b>${esc(x.t)}</b>${x.s?`<span>${esc(x.s)}</span>`:''}</div>${x.btn||''}</div>`).join('')}</div>`
    :`<p class="small muted">급한 일이 없습니다. ${per==='season'?'오른쪽 위 <b>계속</b>은 다음 소식까지(최대 한 주), <b>1경기</b>는 한 경기씩 진행합니다.':per==='post'?'오른쪽 위 <b>다음 경기</b>로 진행하세요.':'오른쪽 위 <b>계속</b>을 누르면 다음 일정까지 진행합니다.'}</p>`;
  return `<section class="card"><div class="row between"><h2 class="sec">처리할 일${it.length?` <span class="cntb">${it.length}</span>`:''}</h2><button class="btn small" data-a="tab" data-v="inbox">소식함${unread?` ${unread}`:''}</button></div>${body}</section>`;
}
function nextGames(n){
  const c=G.cal; const L=[]; for(let d=G.day+(G.res?1:1);d<=c.end&&L.length<n;d++){ const gs=c.sched[d]; if(!gs)continue; const m=gs.find(x=>x.includes(G.user)); if(m)L.push({d,home:m[0]===G.user,op:m[0]===G.user?m[1]:m[0]}); }
  if(G.ps&&G.ps.cur){ const s=G.ps.cur; if(s.hi===G.user||s.lo===G.user){ const d=s.days[s.gi]; if(d>G.day&&!L.some(x=>x.d===d))L.unshift({d,home:s.hi===G.user?s.gi<2||s.gi>=5:!(s.gi<2||s.gi>=5),op:s.hi===G.user?s.lo:s.hi,ps:`${ROUNDK[s.round]} ${s.gi+1}차전`}); } }
  return L;
}
function miniStand(){
  const {order,live,y}=standOrder(); if(!order||!order.length)return '';
  if(!live&&G.startY===G.year){ /* 창단 첫해 개막 전: 지난 시즌 순위는 의미가 없으니 전문가 전력 평가를 보여 준다 */
    if(!UI._trk||UI._trk.k!==G.day+':'+G.user)UI._trk={k:G.day+':'+G.user,R:G.teams.map(t=>({tid:t.id,r:teamRating(t.id)})).sort((a,b)=>b.r-a.r)}; const R=UI._trk.R;
    return `<section class="card"><div class="row between"><h2 class="sec">${G.year} 전력 예상</h2><span class="small muted">외국인 영입 반영 · 매주 바뀜</span></div><div class="tw"><table class="mst"><tbody>${R.map((x,i)=>`<tr class="${x.tid===G.user?'me':''}${i===4?' cut':''}"><td class="rk">${i+1}</td><td>${badge(x.tid,16)} ${esc(tshort(x.tid))}</td></tr>`).join('')}</tbody></table></div></section>`; }
  const top=order[0]; const hasTl=tlOf(G.user).length>0&&live; const od=live?playoffOdds():null; const nar=!wide()&&!!od;
  const rows=order.map((o,i)=>{ const l=l10Of(o.tid); return `<tr class="${o.tid===G.user?'me':''}${i===4?' cut':''}"><td class="rk">${i+1}</td><td><button class="lnk tname" data-a="lteamGo" data-v="${o.tid}">${badge(o.tid,18)}${tshort(o.tid)}</button></td><td class="num">${wlStr(o)}</td><td class="num">${i?gbStr(gbOf(top,o)):'-'}</td>${hasTl?`${nar?'':`<td class="num">${l.n?wlStr(l):'-'}</td>`}<td>${strkPill(o.tid)}</td>`:''}${od?`<td class="num ppc">${pct((od.find(x=>x.tid===o.tid)||{}).ps)}</td>`:''}</tr>`; }).join('');
  return `<section class="card"><div class="row between"><h2 class="sec">${live?'현재 순위':`${y} 최종 순위`}</h2><button class="btn small" data-a="go" data-v="league:stand">순위</button></div>
    <div class="tw"><table class="mst"><thead><tr><th></th><th>구단</th><th>승-패-무</th><th>차</th>${hasTl?`${nar?'':'<th>최근10</th>'}<th>연속</th>`:''}${od?'<th>가을야구</th>':''}</tr></thead><tbody>${rows}</tbody></table></div>
    <p class="small muted">점선 위 5개 팀이 가을야구에 나갑니다.${od?' 가을야구는 남은 일정을 모의 진행한 진출 확률입니다.':''}</p></section>`;
}
function formCard(){
  const per=period(); if(per!=='season'&&per!=='post')return '';
  const L=tlOf(G.user).slice(-10); if(!L.length)return '';
  const T=teamStats(G.year); const me=T[G.user]; const sp=splitOf(G.user); const rd=sp.rs-sp.ra;
  const sq=L.map(x=>`<span class="fsq ${x[0]>0?'w':x[0]<0?'l':'t'}" title="${dsh(x[5])} ${tshort(x[4])} ${x[1]}:${x[2]}"><b>${x[0]>0?'승':x[0]<0?'패':'무'}</b><i>${x[1]}:${x[2]}</i><em class="fsqb">${badge(x[4],16)}</em></span>`).join('');
  const st=(l,v,r)=>`<div><dt>${l}</dt><dd class="num">${v}</dd>${r?rkPill(r):''}</div>`;
  return `<section class="card"><div class="row between"><h2 class="sec">최근 흐름</h2><span class="small">${strkPill(G.user)}</span></div>
    <div class="fsqs">${sq}</div>${rankChart(true)?`<div class="rmini"><span class="small muted">시즌 순위 흐름</span>${rankChart(true)}</div>`:''}
    <dl class="tstat">${st('팀 타율',fmt3(me.avg),rankIn(T,G.user,'avg'))}${st('팀 OPS',fmt3(me.ops),rankIn(T,G.user,'ops'))}${st('홈런',me.hr,rankIn(T,G.user,'hr'))}${st('팀 ERA',me.era.toFixed(2),rankIn(T,G.user,'era',true))}${st('득실차',(rd>0?'+':'')+rd,rankIn(T.map(t=>Object.assign({},t,{rd:t.rs-t.ra})),G.user,'rd'))}${st('홈 · 원정',`${sp.home} · ${sp.away}`,0)}</dl>
    <div class="row"><button class="btn small" data-a="go" data-v="league:score">일정·결과</button><button class="btn small" data-a="go" data-v="league:rec">리그 기록</button></div></section>`;
}
function myLeaders(){
  const per=period(); const y=per==='season'||per==='post'?G.year:G.year-1;
  const rows=playerRows(y).filter(x=>x.p.team===G.user); if(!rows.length)return '';
  const g=qualOf(G.user)||144;
  const bat=rows.filter(x=>!x.p.isP&&x.h.pa>=Math.max(10,g*2)).sort((a,b)=>b.r.ops-a.r.ops).slice(0,3);
  const pit=rows.filter(x=>x.p.isP).sort((a,b)=>b.w-a.w).slice(0,3);
  const li=x=>`<button class="item wa" data-a="player" data-v="${x.p.id}">${avImg(x.p)}<span class="nm">${esc(x.p.name)} <span class="small muted">${posLabel(x.p)}</span></span><span class="sub">${statLine(x.h,x.p)}</span><span class="rt num">${x.p.isP?`<b>${x.w.toFixed(1)}</b>`:`<b>${fmt3(x.r.ops)}</b>`}</span></button>`;
  return `<section class="card"><div class="row between"><h2 class="sec">${y===G.year?'우리 팀 주요 선수':`${y} 우리 팀 주요 선수`}</h2><button class="btn small" data-a="tab" data-v="roster">선수단</button></div>
    <div class="eyebrow">타자 · OPS</div><div class="list">${bat.map(li).join('')||'<p class="small muted" style="padding:6px 12px">기록이 쌓이면 표시됩니다.</p>'}</div>
    <div class="eyebrow">투수 · WAR</div><div class="list">${pit.map(li).join('')}</div></section>`;
}
function newsSeen(){ return G.newsSeen||0; }
function newsCard(){ const ns=(G.news||[]).slice(0,4); if(!ns.length)return '';
  const nn=(G.news||[]).filter(n=>(n.id||0)>newsSeen()).length;
  return `<section class="card"><div class="row between"><h2 class="sec">뉴스${nn?` <span class="cntb">${nn}</span>`:''}</h2><button class="btn small" data-a="go" data-v="league:news">전체 기사</button></div>${ns.map(n=>newsItem(n,false)).join('')}</section>`; }
function clubCard(){
  prInit(); const t=team(G.user); const ci=capInfo(G.user); const s=goalStatus();
  const g=(l,v,lo,hi)=>`<div><dt>${l}</dt><dd class="num">${v}</dd>${gauge(v,lo,hi)}</div>`;
  const goal=s?`<div class="gl">${[['순위',s.rank.cur?`${s.rank.cur}위 / 목표 ${s.rank.t}위`:`목표 ${s.rank.t}위`,s.rank.cur?s.rank.ok:null],['재정',`${Math.round(s.sup.cur*100)}% / 목표 ${Math.round(s.sup.t*100)}%`,s.sup.ok],['여론',`${s.fan.cur} / 목표 ${s.fan.t}`,s.fan.ok]].concat(s.youth?[['육성',`${s.youth.cur}명 / 목표 1명`,s.youth.ok]]:[]).map(([l,v,ok])=>`<span class="${ok==null?'':ok?'ok':'ng'}"><b>${l}</b> ${v}</span>`).join('')}</div>`:'';
  return `<section class="card"><div class="row between"><h2 class="sec">구단 상태</h2><button class="btn small" data-a="go" data-v="club:owner">구단주</button></div>
    <dl class="tsum">${g('구단주 신뢰',t.trust,25,60)}${g('팬 여론',Math.round(G.pr.fan),40,60)}${g('언론 논조',Math.round(G.pr.press),40,60)}</dl>
    ${goal}
    <p class="small muted">자금 <b class="num">${money(t.cash)}</b> · 연봉 캡 <b class="num">${money(ci.pay)}</b> / ${money(ci.cap)}</p></section>`;
}

/* ---------- 리그: 순위 ---------- */
function standView(){
  const {order,live,y}=standOrder(); const top=order[0]; const hasTl=G.teams.some(t=>tlOf(t.id).length);
  const cols=hasTl?'<th>최근10</th><th>연속</th><th>홈</th><th>원정</th><th>득점</th><th>실점</th><th>득실</th>':'';
  const rows=order.map((o,i)=>{ const sp=splitOf(o.tid); const l=l10Of(o.tid); const g=o.w+o.l+(o.t||0);
    return `<tr class="${o.tid===G.user?'me':''}${i===4?' cut':''}"><td class="stk"><button class="lnk tname" data-a="lteamGo" data-v="${o.tid}"><span class="ticker">${i+1}</span>${badge(o.tid,18)}${tname(o.tid)}</button></td><td>${g}</td><td>${o.w}</td><td>${o.l}</td><td>${o.t||0}</td><td class="key">${pctStr(o)}</td><td>${i?gbStr(gbOf(top,o)):'-'}</td>${hasTl?`<td>${l.n?wlStr(l):'-'}</td><td>${strkPill(o.tid)}</td><td>${sp.home}</td><td>${sp.away}</td><td>${sp.rs}</td><td>${sp.ra}</td><td class="${sp.rs-sp.ra>0?'pos':sp.rs-sp.ra<0?'neg':''}">${sp.rs-sp.ra>0?'+':''}${sp.rs-sp.ra}</td>`:''}</tr>`; }).join('');
  const fifth=order[4]; const mi=order.findIndex(o=>o.tid===G.user); const me=order[mi];
  const msg=live&&period()==='season'?(mi<=4?`가을야구권 ${mi+1}위 · 6위와 ${Math.max(0,gbOf(me,order[5])).toFixed(1)}경기 차`:`5위 ${tshort(fifth.tid)}와(과) ${gbOf(fifth,me).toFixed(1)}경기 차`):'';
  // 상대 전적
  const h2h=hasTl?`<div class="tw"><table class="h2h"><thead><tr><th>상대</th>${G.teams.filter(t=>t.id!==G.user).map(t=>`<th>${badge(t.id,16)}</th>`).join('')}</tr></thead><tbody><tr class="me"><td>${tshort(G.user)}</td>${G.teams.filter(t=>t.id!==G.user).map(t=>{ const r=h2hOf(G.user,t.id); return `<td class="${r.w>r.l?'pos':r.w<r.l?'neg':''}">${r.w+r.l+r.t?`${r.w}-${r.l}${r.t?'-'+r.t:''}`:'-'}</td>`; }).join('')}</tr></tbody></table></div>`:'';
  const tt=inTabs('stand',[['tbl','순위표'],...(live&&rankChart(false)?[['chart','순위 변동']]:[]),...(h2h?[['h2h','상대 전적']]:[]),['map','구단 전력'],...(G.ps?[['ps','포스트시즌']]:[]),['teams','구단 둘러보기']]);
  if(tt.cur==='teams')return tt.bar+teamsView();
  if(tt.cur==='tbl')return tt.bar+`<section class="card"><div class="row between"><h2 class="sec">${live?`${G.year} 정규시즌 순위`:`${y} 최종 순위`}</h2>${msg?`<span class="small">${msg}</span>`:''}</div>
    <div class="tw"><table class="stt"><thead><tr><th class="stk">순위 · 구단</th><th>경기</th><th>승</th><th>패</th><th>무</th><th>승률</th><th>차</th>${cols}</tr></thead><tbody>${rows}</tbody></table></div>
    <p class="small muted">점선 위 1~5위가 가을야구(와일드카드·준플레이오프·플레이오프·한국시리즈)에 나갑니다. 구단 이름을 누르면 그 구단 선수단을 봅니다.</p></section>`;
  if(tt.cur==='chart')return tt.bar+`${live&&rankChart(false)?`<section class="card"><div class="row between"><h2 class="sec">순위 변동</h2><span class="small muted">굵은 선이 우리 팀 · 점선 위가 가을야구권</span></div>${rankChart(false)}</section>`:''}`;
  if(tt.cur==='h2h')return tt.bar+`${h2h?`<section class="card"><h2 class="sec">우리 팀 상대 전적</h2>${h2h}</section>`:''}`;
  if(tt.cur==='race')return tt.bar+raceCard();
  if(tt.cur==='map')return tt.bar+powerMap();
  if(tt.cur==='ps')return tt.bar+`${G.ps?`<section class="card"><h2 class="sec">포스트시즌</h2>${psBody()}</section>`:''}`;
  const myC=G.history.filter(h=>h.champ===G.user).length;
  return tt.bar+`<section class="card"><div class="row between"><h2 class="sec">역대 우승</h2><span class="trow">${myC?`${tname(G.user)} 우승 ${myC}회 ${[...Array(Math.min(myC,8))].map(()=>ART.trophy(22)).join('')}`:''}</span></div><div class="list">${[...G.history].reverse().map(h=>`<div class="item champ${h.champ===G.user?' me':''}" style="cursor:default">${ART.trophy(28)}<span class="nm">${h.y} ${badge(h.champ,18)} ${tname(h.champ)}</span><span class="sub">준우승 ${tname(h.runner)}</span></div>`).join('')}</div></section>`;
}
function teamRecCard(){
  const per=period(); const y=per==='season'||per==='post'?G.year:G.year-1; const T=teamStats(y);
  const cols=[{k:'tm',l:'구단',v:r=>tshort(r.tid),f:r=>`${badge(r.tid,16)} ${tshort(r.tid)}`,cls:'stk'},
    {k:'avg',l:'타율',v:r=>r.avg,f:r=>fmt3(r.avg)},{k:'obp',l:'출루율',v:r=>r.obp,f:r=>fmt3(r.obp)},{k:'slg',l:'장타율',v:r=>r.slg,f:r=>fmt3(r.slg)},{k:'ops',l:'OPS',v:r=>r.ops,f:r=>fmt3(r.ops)},
    {k:'hr',l:'홈런',v:r=>r.hr},{k:'sb',l:'도루',v:r=>r.sb},{k:'rs',l:'득점',v:r=>r.rs},
    {k:'era',l:'ERA',v:r=>r.era,f:r=>r.era.toFixed(2),asc:1},{k:'whip',l:'WHIP',v:r=>r.whip,f:r=>r.whip.toFixed(2),asc:1},{k:'ra',l:'실점',v:r=>r.ra,asc:1},{k:'so',l:'탈삼진',v:r=>r.so},{k:'hra',l:'피홈런',v:r=>r.hra,asc:1}];
  return `<section class="card"><div class="row between"><h2 class="sec">${y} 팀 기록</h2><span class="small muted">머리글을 누르면 정렬</span></div>${stbl('team',cols,T,{def:{k:'ops',dir:-1},me:r=>r.tid===G.user,rank:true})}
    <p class="small muted">각 칸의 순위 색: 상위 3개 팀은 초록, 하위 3개 팀은 빨강입니다.</p></section>`;
}

/* 정렬되는 표 공용 */
function stbl(id,cols,rows,o){
  UI.ls=UI.ls||{}; const st=UI.ls[id]||o.def; const c=cols.find(x=>x.k===st.k)||cols[0];
  if(!wide()&&o.num&&c.k!=='name'&&c.k!=='tm'){ const i=cols.indexOf(c); const at=cols.findIndex(x=>x.k==='tm')+1; if(i>at){ cols=cols.slice(); cols.splice(i,1); cols.splice(at,0,c); } }
  const sorted=[...rows].sort((a,b)=>{ const va=c.v(a), vb=c.v(b); if(va==null&&vb==null)return 0; if(va==null)return 1; if(vb==null)return -1; const d=typeof va==='string'?va.localeCompare(vb):va-vb; return st.dir*d; }).slice(0,o.limit||999);
  // 열별 상·하위 표시(팀 표 등 소규모일 때)
  const tier={}; if(o.rank){ for(const cc of cols){ if(cc.k==='tm'||cc.k==='name')continue; const s=[...rows].map(r=>cc.v(r)).filter(v=>v!=null).sort((a,b)=>cc.asc?a-b:b-a); tier[cc.k]=s; } }
  const tcls=(cc,r)=>{ const s=tier[cc.k]; if(!s)return ''; const v=cc.v(r); const i=s.indexOf(v); return i<3?' t-hi':i>=s.length-3?' t-lo':''; };
  const th=cc=>`<th data-a="lsort" data-v="${id}:${cc.k}" class="sortable${cc.cls?' '+cc.cls:''}${cc.k===c.k?' on':''}">${cc.l}${cc.k===c.k?(st.dir<0?' ▼':' ▲'):''}</th>`;
  return `<div class="tw"><table class="sqt rt lst"><thead><tr>${o.num?'<th class="n">#</th>':''}${cols.map(th).join('')}</tr></thead><tbody>${sorted.map((r,i)=>`<tr class="${o.click?'click ':''}${o.me&&o.me(r)?'me':''}"${o.click?o.click(r):''}>${o.num?`<td class="n">${i+1}</td>`:''}${cols.map(cc=>`<td class="${cc.cls||''}${cc.k===c.k?' key':''}${tcls(cc,r)}">${cc.f?cc.f(r):cc.v(r)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

/* ---------- 리그: 기록 ---------- */
function recView(){
  const per=period(); const y=per==='pre'||per==='off'?(per==='off'?G.year:G.year-1):G.year;
  const seg=UI.lrec||'top';
  const head=`<div class="seg">${[['top','부문별 1위'],['bat','타자 기록'],['pit','투수 기록'],['team','팀 기록']].map(([k,l])=>`<button data-a="lrec" data-v="${k}" class="${seg===k?'on':''}">${l}</button>`).join('')}</div>`;
  const rows=playerRows(y);
  if(!rows.length)return head+csec(`${y} 기록`,'<p class="small muted">아직 기록이 없습니다.</p>');
  if(seg==='team')return head+teamRecCard();
  if(seg==='top')return head+leaderTiles(rows,y);
  const pit=seg==='pit'; const f=UI.lrf||{q:true,t:'all'};
  let R=rows.filter(x=>x.p.isP===pit&&(f.t==='all'||(f.t==='me'?x.h.t===G.user||x.p.team===G.user:String(x.h.t)===f.t)));
  if(f.q)R=R.filter(x=>isQual(x,y));
  const nameC={k:'name',l:'선수',v:x=>x.p.name,f:x=>`<span class="pn">${wide()?avImg(x.p):''}<span>${esc(x.p.name)}${x.p.foreign?' <span class="pill">외</span>':''}</span></span>`,cls:'stk'};
  const tmC={k:'tm',l:'팀',v:x=>tshort(x.h.t??x.p.team),f:x=>badge(x.h.t??x.p.team,18)};
  const cols=pit?[nameC,tmC,{k:'role',l:'역할',v:x=>posLabel(x.p)},{k:'g',l:'경기',v:x=>x.h.g||0},{k:'ip',l:'이닝',v:x=>x.h.outs,f:x=>ipStr(x.h.outs)},{k:'era',l:'ERA',v:x=>x.r.era,f:x=>rfmt('era',x.r.era),asc:1},{k:'w',l:'승',v:x=>x.h.w||0},{k:'l',l:'패',v:x=>x.h.l||0},{k:'sv',l:'세',v:x=>x.h.sv||0},{k:'hld',l:'홀',v:x=>x.h.hld||0},{k:'so',l:'탈삼진',v:x=>x.h.so},{k:'bb',l:'볼넷',v:x=>x.h.bb,asc:1},{k:'whip',l:'WHIP',v:x=>x.r.whip,f:x=>x.r.whip.toFixed(2),asc:1},{k:'k9',l:'K/9',v:x=>x.r.k9,f:x=>x.r.k9.toFixed(1)},{k:'bb9',l:'BB/9',v:x=>x.r.bb9,f:x=>x.r.bb9.toFixed(1),asc:1},{k:'war',l:'WAR',v:x=>x.w,f:x=>rfmt('war',x.w)}]
    :[nameC,tmC,{k:'pos',l:'포지션',v:x=>POSS[x.h.pos||x.p.pos]||x.p.pos},{k:'g',l:'경기',v:x=>x.h.g||0},{k:'pa',l:'타석',v:x=>x.h.pa},{k:'avg',l:'타율',v:x=>x.r.avg,f:x=>fmt3(x.r.avg)},{k:'h',l:'안타',v:x=>x.h.h},{k:'hr',l:'홈런',v:x=>x.h.hr},{k:'rbi',l:'타점',v:x=>x.h.rbi},{k:'r',l:'득점',v:x=>x.h.r},{k:'sb',l:'도루',v:x=>x.h.sb},{k:'bb',l:'볼넷',v:x=>x.h.bb},{k:'so',l:'삼진',v:x=>x.h.so,asc:1},{k:'bbk',l:'볼삼비',v:x=>x.h.so?x.h.bb/x.h.so:null,f:x=>x.h.so?(x.h.bb/x.h.so).toFixed(2):'-'},{k:'babip',l:'BABIP',v:x=>babipOf(x.h),f:x=>babipOf(x.h)!=null?fmt3(babipOf(x.h)):'-'},{k:'obp',l:'출루율',v:x=>x.r.obp,f:x=>fmt3(x.r.obp)},{k:'slg',l:'장타율',v:x=>x.r.slg,f:x=>fmt3(x.r.slg)},{k:'ops',l:'OPS',v:x=>x.r.ops,f:x=>rfmt('ops',x.r.ops)},{k:'war',l:'WAR',v:x=>x.w,f:x=>rfmt('war',x.w)}];
  const tsel=`<select data-a="lrfT" aria-label="구단">${[['all','전체 구단'],['me','우리 구단']].concat(G.teams.filter(t=>t.id!==G.user).map(t=>[String(t.id),t.city+' '+t.nick])).map(([v,l])=>`<option value="${v}" ${f.t===v?'selected':''}>${l}</option>`).join('')}</select>`;
  const g=qualOf(G.user);
  return head+`<section class="card"><div class="row between"><h2 class="sec">${y} ${pit?'투수':'타자'} 기록</h2><span class="small muted">${R.length}명</span></div>
    <div class="row">${tsel}<label class="chk"><input type="checkbox" data-a="lrfQ" ${f.q?'checked':''}> 규정${pit?'이닝':'타석'} 이상${y===G.year&&period()==='season'?` (${pit?Math.round(g):Math.round(g*3.1)}${pit?'이닝':'타석'})`:''}</label></div>
    ${stbl(pit?'pit':'bat',cols,R,{def:pit?{k:'era',dir:1}:{k:'ops',dir:-1},num:true,limit:80,me:x=>x.p.team===G.user,click:x=>` data-a="player" data-v="${x.p.id}"`})}
    <p class="small muted">머리글을 누르면 그 기록 순으로 정렬합니다. 우리 선수는 강조 표시됩니다. 규정 기준은 팀 경기 수 × 3.1타석, × 1이닝입니다.</p></section>`;
}
function leaderTiles(rows,y){
  const B=rows.filter(x=>!x.p.isP), P=rows.filter(x=>x.p.isP); const q=x=>isQual(x,y);
  const T=[['타율',B.filter(q),x=>x.r.avg,x=>fmt3(x.r.avg)],['홈런',B,x=>x.h.hr],['타점',B,x=>x.h.rbi],['안타',B,x=>x.h.h],['도루',B,x=>x.h.sb],['OPS',B.filter(q),x=>x.r.ops,x=>fmt3(x.r.ops)],['타자 WAR',B,x=>x.w,x=>x.w.toFixed(1)],
    ['평균자책점',P.filter(q),x=>-x.r.era,x=>x.r.era.toFixed(2)],['승리',P,x=>x.h.w||0],['탈삼진',P,x=>x.h.so],['세이브',P,x=>x.h.sv||0],['홀드',P,x=>x.h.hld||0],['WHIP',P.filter(q),x=>-x.r.whip,x=>x.r.whip.toFixed(2)],['투수 WAR',P,x=>x.w,x=>x.w.toFixed(1)]];
  const tile=([l,arr,v,f])=>{ const s=[...arr].sort((a,b)=>v(b)-v(a)).slice(0,5); if(!s.length)return ''; const fm=f||v; const a=s[0];
    return `<div class="ltile"><div class="lh">${l}</div><button class="l1${a.p.team===G.user?' me':''}" data-a="player" data-v="${a.p.id}">${avImg(a.p,true)}<span><b>${esc(a.p.name)}</b><i>${badge(a.p.team,14)} ${tshort(a.p.team)}</i></span><em class="num">${fm(a)}</em></button>
      <ol>${s.slice(1).map((x,i)=>`<li class="${x.p.team===G.user?'me':''}"><button data-a="player" data-v="${x.p.id}"><i>${i+2}</i>${esc(x.p.name)} <span class="muted">${tshort(x.p.team)}</span><b class="num">${fm(x)}</b></button></li>`).join('')}</ol></div>`; };
  return `<section class="card"><div class="row between"><h2 class="sec">${y} 부문별 순위</h2><span class="small muted">타율·OPS·평균자책점·WHIP는 규정 기준 이상</span></div><div class="ltiles">${T.map(tile).join('')}</div></section>`;
}

/* ---------- 리그: 경기 결과(스코어보드) ---------- */
function scoreHub(){ const t=inTabs('sres',[['mine','우리 경기'],['day','날짜별 결과'],['cal','월별 일정']]); return t.bar+(t.cur==='mine'?gamesView():t.cur==='day'?scoreView():schedView()); }
function scoreView(){
  const days=[...new Set(G.teams.flatMap(t=>tlOf(t.id).map(x=>x[5])))].sort((a,b)=>a-b);
  if(!days.length)return csec('날짜별 결과','<p class="small muted">아직 치른 경기가 없습니다.</p>');
  let d=UI.sbd; if(d==null||!days.includes(d))d=days[days.length-1];
  const i=days.indexOf(d); const gs=[]; for(const t of G.teams) for(const x of tlOf(t.id)) if(x[5]===d&&x[3]===1)gs.push({h:t.id,a:x[4],hs:x[1],as:x[2]});
  const card=s=>{ const gi=G.games.findIndex(g=>g.day===d&&g.home===s.h&&g.away===s.a); const me=s.h===G.user||s.a===G.user;
    const tr=(tid,r,o)=>`<div class="sbr ${r>o?'w':''}">${badge(tid,22)}<a class="tl" data-a="lteam" data-v="${tid}">${tshort(tid)}</a><span class="small muted">${wlStr(G.sea.rec[tid])}</span><b class="num">${r}</b></div>`;
    return `<div class="sbc${me?' me':''}"${gi>=0?` data-a="openGame" data-v="${gi}" role="button" tabindex="0"`:''}>${tr(s.a,s.as,s.hs)}${tr(s.h,s.hs,s.as)}<span class="small muted">${gi>=0?'박스스코어 보기':'종료'}</span></div>`; };
  return `<section class="card"><div class="row between"><h2 class="sec">경기 결과</h2><div class="row"><button class="btn small" data-a="sbd" data-v="${days[i-1]??''}" ${i<=0?'disabled':''}>← 이전</button><b class="num">${dmd(d)} ${WD[dobj(d).w]}</b><button class="btn small" data-a="sbd" data-v="${days[i+1]??''}" ${i>=days.length-1?'disabled':''}>다음 →</button></div></div>
    <div class="sbg">${gs.map(card).join('')}</div>
    <p class="small muted">우리 경기는 박스스코어를 볼 수 있습니다(최근 25경기 보관). 다른 구장은 최종 점수만 기록합니다.</p></section>`;
}

/* ---------- 리그: 뉴스 ---------- */
function newsView(){
  G.newsSeen=Math.max(newsSeen(),...(G.news||[]).map(n=>n.id||0));
  const seg=UI.nseg||'news';
  const head=`<div class="seg">${[['news','기사'],['fans','팬 게시판'],['wire','리그 소식']].map(([k,l])=>`<button data-a="nseg" data-v="${k}" class="${seg===k?'on':''}">${l}</button>`).join('')}</div>`;
  if(seg==='fans')return head+fanBoard();
  if(seg==='wire'){ const W=G.wire||[];
    return head+csec('리그 소식',W.length?`<div class="list">${W.slice(0,80).map(w=>`<div class="item wa" ${w.ref!=null&&G.players[w.ref]?`data-a="player" data-v="${w.ref}"`:'style="cursor:default"'}>${w.tid!=null?badge(w.tid,24):'<span class="av ini">KBO</span>'}<span class="nm">${lk(w.t)}</span><span class="sub"><span class="pill">${esc(w.k)}</span> ${dsh(w.d)}</span></div>`).join('')}</div>`:'<p class="small muted">다른 구단의 외국인 교체, 감독 선임, FA 이적 소식이 여기에 쌓입니다.</p>'); }
  const kinds=[...new Set((G.news||[]).map(n=>n.k).filter(Boolean))]; const ns=(G.news||[]).filter(n=>!UI.nk||n.k===UI.nk);
  const kc=`<div class="chips"><button data-a="nk" data-v="" class="${!UI.nk?'on':''}">전체</button>${kinds.map(k=>`<button data-a="nk" data-v="${esc(k)}" class="${UI.nk===k?'on':''}">${esc(k)}</button>`).join('')}</div>`;
  return head+csec('기사',kc+(ns.length?`<div class="newslist">${ns.slice(0,60).map(n=>newsItem(n,true)).join('')}</div>`:'<p class="small muted">기사가 없습니다.</p>'),`<button class="btn small" data-a="go" data-v="club:media">여론 현황</button>`);
}

/* ---------- A: 하루 흐름 ---------- */
function nextLabel(){ // 계속 버튼 아래 작은 글씨: 다음에 일어날 일
  if(blockNow())return '막힌 일 먼저';
  const per=period();
  if(per==='season'||per==='post'){ const n=nextGames(1)[0]; if(n)return `${dsh(n.d)} ${n.home?'vs':'@'} ${tshort(n.op)}`; }
  if(per==='post'&&G.ps&&G.ps.cur){ const c=G.ps.cur; return `${ROUNDK[c.round]} ${tshort(c.hi)}·${tshort(c.lo)} (우리 경기 아님)`; }
  const u=upcoming()[0]; return u?`${dsh(u[0])} ${u[1]}`:'';
}
function spLine(p){ if(!p)return '미정'; const h=seasonTotal(p,G.year,'1군'); return h&&h.outs?`${h.w||0}승 ${h.l||0}패 · ${pRate(h).era.toFixed(2)}`:'올해 기록 없음'; }
function oppSP(op,d){ const x=projStarters(op,4).find(y=>y.d===d); return x?x.sp:null; }
function stripBar(){ // 지난 3경기 + 다음 2경기
  const per=period(); if(per!=='season'&&per!=='post'&&per!=='pre')return '';
  const past=(G.sea.ulog||[]).slice(-3); const nx=per==='post'?nextGames(2):projStarters(G.user,2);
  if(!past.length&&!nx.length)return '';
  const pc=x=>{ const home=x.h===G.user; const op=home?x.a:x.h; const ms=home?x.hs:x.as, os=home?x.as:x.hs; const gi=G.games.findIndex(g=>g.day===x.d&&(g.home===G.user||g.away===G.user));
    return `<button class="sb-i ${x.res==='승'?'w':x.res==='패'?'l':''}" ${gi>=0?`data-a="openGame" data-v="${gi}"`:''}><span class="sb-d">${dsh(x.d)}</span><b>${x.res}</b><span class="num">${ms}:${os}</span><span>${home?'vs':'@'} ${tshort(op)}</span></button>`; };
  const nc=x=>{ const os=x.sp!==undefined?oppSP(x.op,x.d):null; return `<div class="sb-i nx"><span class="sb-d">${dsh(x.d)} ${WD[dobj(x.d).w]}</span><span>${x.home?'vs':'@'} ${badge(x.op,14)}${tshort(x.op)}</span>${x.sp!==undefined?`<span class="sb-sp">${x.sp?esc(x.sp.name):'미정'} <i>vs</i> ${os?esc(os.name):'미정'}</span>`:''}</div>`; };
  return `<div class="sbar" aria-label="지난 경기와 다음 경기">${past.map(pc).join('')}${nx.length?'<span class="sb-sep"></span>':''}${nx.map(nc).join('')}</div>`;
}
function nextCard(){
  const per=period(); if(per!=='season'&&per!=='post'&&per!=='pre')return '';
  const L=nextGames(6); if(!L.length)return '';
  const x=L[0]; const {order,live}=standOrder(); const ri=order.findIndex(o=>o.tid===x.op)+1; const r=G.sea.rec[x.op];
  const hh=h2hOf(G.user,x.op); const l10=l10Of(x.op); const dd=x.d-G.day;
  const mySP=x.ps?null:(projStarters(G.user,1)[0]||{}).sp, thSP=x.ps?null:oppSP(x.op,x.d);
  const spc=(p,tid)=>`<button class="nsp" ${p?`data-a="player" data-v="${p.id}"`:''}>${p?avImg(p):'<span class="av ini">?</span>'}<span><i>${badge(tid,14)} ${tshort(tid)} 예상 선발</i><b>${p?esc(p.name):'미정'}</b><em>${spLine(p)}</em></span></button>`;
  const cv=coverOf(x.op); let weak='';
  { const ps=posStrength(rosterList(x.op)); const ks=FIELDK.concat(['SP','RP']).filter(k=>ps[k]!=null).sort((a,b)=>ps[a]-ps[b]); if(ks.length){ const k=ks[0]; weak=`<p class="small">상대 약점: <b>${k==='SP'?'선발진':k==='RP'?'불펜':POSK[k]}</b> ${ps[k]}</p>`; } }
  return `<section class="card nextc"><div class="row between"><h2 class="sec">다음 경기</h2><span class="row"><span class="small muted">${dd<=1?'내일':`${dd}일 뒤`}</span><button class="btn small" data-a="cmpT" data-v="${x.op}">전력 비교</button></span></div>
    <div class="nx">${badge(x.op,44)}<div><span class="eyebrow">${x.ps?esc(x.ps)+' · ':''}${dmd(x.d)} ${WD[dobj(x.d).w]} · ${x.home?'홈':'원정'}</span><b>${x.home?'vs':'@'} ${tname(x.op)}</b>
      <span class="small muted">${live&&per!=='pre'?`${ri}위 · ${wlStr(r)} · 최근 10경기 ${wlStr(l10)}${streakOf(x.op)?' · '+streakOf(x.op):''}`:'개막전'}${hh.w+hh.l+hh.t?` · 상대 전적 ${hh.w}승 ${hh.l}패${hh.t?` ${hh.t}무`:''}`:''}</span></div></div>
    ${x.ps?'':`<div class="nsps">${spc(mySP,G.user)}${spc(thSP,x.op)}</div><p class="small muted">로테이션 순번과 휴식일로 본 예상입니다. 부상·피로로 바뀔 수 있습니다.</p>`}
    ${weak}
    ${L.length>1?`<div class="fx">${L.slice(1).map(y=>`<span>${dsh(y.d)} ${y.home?'vs':'@'} ${badge(y.op,16)}${tshort(y.op)}</span>`).join('')}</div>`:''}
  </section>`;
}
/* ---------- 실시간 드래프트: 다른 구단 지명을 한 명씩 보여 준다 ---------- */
const DSPD={slow:1100,norm:550,fast:180};
function dliveStart(kind){ if(UI.dl&&UI.dl.on)return; const o=UI.dl&&UI.dl.kind===kind?UI.dl:null; UI.dl={on:true,kind,feed:(o?o.feed:[])||[],stolen:o?o.stolen||[]:[],stN:o?o.stN||0:0}; dliveTick(); }
/* 우리가 노리던 선수: 관심 표시 + 지금 우리 보드 상위 3명 */
function dlTargets(kind){ const m=new Map(); (G.shortlist||[]).forEach(id=>m.set(id,'관심 선수')); return m; }
function dliveTick(){ const L=UI.dl; if(!L||!L.on||!G)return; const T=dlTargets(L.kind); const r=L.kind==='fd'?fdStep():amStep();
  if(!r||r==='user'){ L.on=false; L.just=null; save(); render(); return; }
  L.just=r.pid||null; if(r.pid){ const p=G.players[r.pid]; const tg=T.get(r.pid)||null; L.feed.unshift({tid:r.pk.tid,rd:r.pk.rd,no:r.pk.no,pid:r.pid,nm:p?p.name:'',pos:p?(L.kind==='fd'&&p.isP?'투수':posLabel(p)):'',age:p?p.age:null,tg,o:L.kind==='fd'&&p?Math.round(ovr(p)):null}); L.feed=L.feed.slice(0,12);
    if(tg){ (L.stolen=L.stolen||[]).unshift({nm:p?p.name:'',tid:r.pk.tid,rd:r.pk.rd,no:r.pk.no,tg,pid:r.pid}); L.stolen=L.stolen.slice(0,20); L.stN=(L.stN||0)+1; } }
  render(); L.t=setTimeout(dliveTick,DSPD[UI.dspeed||'norm']); }
function dlFeedAdd(kind,pk,pid){ if(!UI.dl||UI.dl.kind!==kind)UI.dl={on:false,kind,feed:[]}; const p=G.players[pid]; UI.dl.feed.unshift({tid:pk.tid,rd:pk.rd,no:pk.no,pid,nm:p?p.name:'',pos:p?posLabel(p):'',age:p?p.age:null,tg:null,me:true}); UI.dl.feed=UI.dl.feed.slice(0,12); }
function dliveStop(){ const L=UI.dl; if(L){ L.on=false; clearTimeout(L.t); } save(); render(); }
function dliveBox(kind){ if(!(UI.dl&&UI.dl.kind===kind)&&!UI.dlAuto&&!UI.rev&&!(kind==='fd'&&G.fd&&G.fd.open===false)){ UI.dlAuto=1; setTimeout(()=>{ UI.dlAuto=0; const d=kind==='fd'?G.fd:G.draft; if(d&&!d.done&&d.picks[d.cur]&&d.picks[d.cur].tid!==G.user&&!(UI.dl&&UI.dl.kind===kind))dliveStart(kind); },800); } const L=UI.dl&&UI.dl.kind===kind?UI.dl:null; const on=L&&L.on; const sp=UI.dspeed||'norm';
  const f=L&&L.feed&&L.feed.length?L.feed:[]; const top=f[0];
  return `<div class="dlive ${on?'on':''}">${on?'<span class="dl-dot"></span>':''}<div class="dl-h"><b>${on?'지명 진행 중':'다른 구단 지명'}</b><span class="chips">${[['slow','느리게'],['norm','보통'],['fast','빠르게']].map(([k,l])=>`<button data-a="dlSpd" data-v="${k}" class="${sp===k?'on':''}">${l}</button>`).join('')}${on?'<button data-a="dlStop">멈춤</button><button data-a="dlSkip">우리 차례로</button>':''}</span></div>
    ${top?`<div class="dl-now ${on?'flash':''}">${badge(top.tid,30)}<div><i>${top.rd}-${top.no} · ${esc(tshort(top.tid))}</i><b>${esc(top.nm)}</b><span>${esc(top.pos)}${top.age!=null?` · ${top.age}세`:''}${top.me?' · <em class="good">우리 지명</em>':''}</span></div>${top.o!=null&&!top.me?`<div class="dl-o"><i>실제 능력</i>${rchip(top.o)}</div>`:''}</div>`:''}
    ${L&&L.stolen&&L.stolen.length?(()=>{ const x=L.stolen[0]; const fresh=top&&top.pid===x.pid; return `<div class="dl-steal ${fresh?'fresh':''}"><b>${fresh?'뺏겼습니다':'최근 놓친 선수'}</b><span>${esc(x.tg)} <button class="lnk" data-a="player" data-v="${x.pid}">${esc(x.nm)}</button>을(를) ${esc(tshort(x.tid))}이(가) ${x.rd}라운드 ${x.no}번째로 지명</span><i>이번 드래프트에서 노리던 선수 ${L.stN}명을 놓쳤습니다</i></div>`; })():''}
    ${f.length>1?`<div class="dl-feed">${f.slice(1,8).map(x=>`<span class="${x.tg?'tg':''}${x.me?' me':''}">${badge(x.tid,14)}<i>${x.rd}-${x.no}</i>${esc(x.nm)}<em>${esc(x.pos)}</em>${x.o!=null&&!x.me?rchip(x.o):''}</span>`).join('')}</div>`:''}</div>`; }
/* ---------- 지명 후 능력 공개(복권 긁기) ---------- */
function revMake(pid,pk,n){ const p=G.players[pid]; if(!p)return null; const pool=(G.fd?G.fd.pool:[]).map(id=>G.players[id]).filter(Boolean);
  const potE=q=>{ const o=ovr(q); return q.age>=29?Math.min(Math.max(q.pot,o),o+Math.max(0,31-q.age)*2):Math.max(q.pot,o); };
  const o=ovr(p), pe=potE(p); const rc=1+pool.filter(q=>ovr(q)>o).length, rpt=1+pool.filter(q=>potE(q)>pe).length; const best=Math.min(rc,rpt);
  void best; const v=rc<=2?{k:'jack',t:'대박'}:rc<=8?{k:'good',t:'좋은 지명'}:rc<=25?{k:'ok',t:'무난'}:{k:'bad',t:'아쉬움'};
  /* 장래성은 정답 대신 코치진 추정 범위로 보여 준다. 나이가 어릴수록 범위가 넓다 */
  const w=p.age>=29?0:clamp((29-p.age)*1.1,2,8), mid=pe+hn('rvp',pid)*w*.5; const lo=Math.max(Math.round(o),Math.round(mid-w)), hi=Math.max(lo,Math.round(mid+w));
  return {pid,rd:pk.rd,no:pk.no,n,cur:Math.round(o),pot:Math.round(pe),plo:lo,phi:hi,rc,rpt,tot:pool.length+1,v,open:false}; }
function revView(){ const R=UI.rev; if(!R)return ''; const p=G.players[R.pid]; if(!p){ UI.rev=null; return ''; }
  const box=(l,v,rk)=>`<div class="rv-b ${R.open?'op':''}"><span>${l}</span><b style="${R.open?`color:${rcol(v)}`:''}">${R.open?v:'?'}</b>${R.open?`<i>남은 후보 중 ${rk}위</i>`:'<i>&nbsp;</i>'}</div>`;
  const top=R.open?Object.entries(p.r).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([k,v])=>`${TOOLK[k]||k} ${Math.round(v)}`).join(' · '):'';
  return `<div class="rv-w"><div class="rv ${R.open?'op':''} ${R.open?'v-'+R.v.k:''}">
    <div class="eyebrow">${R.rd}라운드 ${R.no}번째 · 전체 ${R.n}순위 지명</div>
    <div class="row" style="flex-wrap:nowrap">${avImg(p,true)}<div><h2 class="sec" style="font-size:24px">${esc(p.name)}</h2><p class="small muted">${posLabel(p)} · ${p.age}세${p.fdFrom!=null?` · 전 ${esc(tshort(p.fdFrom))}`:''}</p></div></div>
    ${!R.open&&R.g0?`<p class="small muted" style="text-align:center">스카우트 추정 등급 ${R.g0}</p>`:''}<div class="rv-row">${box('현재 능력',R.cur,R.rc)}${R.plo==null?box('잠재력',R.pot,R.rpt):`<div class="rv-b ${R.open?'op':''}"><span>장래성 추정</span><b style="${R.open?`color:${rcol(Math.round((R.plo+R.phi)/2))}`:''}">${R.open?(R.plo===R.phi?`${R.plo}`:`${R.plo}~${R.phi}`):'?'}</b>${R.open?`<i>${R.plo===R.phi?'완성형':'코치진 추정 범위'}</i>`:'<i>&nbsp;</i>'}</div>`}</div><p class="small muted" style="text-align:center;margin:4px 0 0">능력 50 리그 평균 · 55 1군 주전급 · 65 이상 리그 상위</p>
    ${R.open?`<div class="rv-v">${R.v.t}</div>${R.g0?`<p class="small" style="text-align:center">스카우트 추정 ${R.g0}등급 → 실제 ${GRD(R.cur)}등급${R.g0===GRD(R.cur)?' (적중)':'SABCDEF'.indexOf(GRD(R.cur))<'SABCDEF'.indexOf(R.g0)?' (기대 이상)':' (기대 이하)'}</p>`:''}<p class="small">지명 시점 남은 후보 ${R.tot}명 기준(현재 능력)${top?` · 강점 ${top}`:''}</p>${R.plo!==R.phi?'<p class="small muted">장래성이 맞았는지는 3년 뒤 창단 드래프트 회고에서 평가합니다.</p>':''}<button class="btn primary block" data-a="revClose">계속</button>`:`<button class="btn primary block rv-go" data-a="revOpen">능력 확인</button>`}
  </div></div>`; }
/* ---------- 창단 드래프트: 우리 팀 빈자리 보드 ---------- */
const FDPOS={C:[50,90],'1B':[85,62],'2B':[68,36],SS:[32,36],'3B':[15,62],LF:[14,14],CF:[50,10],RF:[86,14]};
function fdLineupOf(list){ const used=new Set(), ln={}; for(const k of ['C','SS','2B','CF','3B','RF','LF','1B']){ const ok=list.filter(p=>!used.has(p.id)&&(p.pos===k||(subsOf(p)||[]).includes(k))).sort((a,b)=>posScore(b,k)-posScore(a,k)); if(ok[0]){ ln[k]=ok[0]; used.add(ok[0].id); } }
  const rest=list.filter(p=>!used.has(p.id)).sort((a,b)=>offV(b)-offV(a)); if(rest[0]){ ln.DH=rest[0]; used.add(rest[0].id); } return {ln,bench:list.filter(p=>!used.has(p.id))}; }
function fdBoard(myPicks,ci,justId){ const bats=myPicks.filter(p=>!p.isP), pits=myPicks.filter(p=>p.isP); const {ln,bench}=fdLineupOf(bats);
  const slot=k=>{ const p=ln[k]; const [x,y]=FDPOS[k]||[0,0]; const st=k==='DH'?'':`left:${x}%;top:${y}%`;
    return p?`<button class="fbs on${p.id===justId?' just':''}" style="${st}" data-a="player" data-v="${p.id}"><i>${SLK[k]}</i><b>${esc(p.name)}</b>${rchip(Math.round(ovr(p)))}</button>`
      :`<button class="fbs empty" style="${st}" data-a="fdSlot" data-v="${k}"><i>${SLK[k]}</i><b>빈자리</b><em>찾기</em></button>`; };
  const P=[...pits].sort((a,b)=>(spV(b)+roleBias(G.user,b))-(spV(a)+roleBias(G.user,a)));
  const pc=(p,i)=>`<button class="fpp${p.id===justId?' just':''}" data-a="player" data-v="${p.id}"><i>${i<5?'선발형':'불펜형'}</i><b>${esc(p.name)}</b>${rchip(Math.round(ovr(p)))}</button>`;
  const empties=Math.max(0,FD_TGT.P-pits.length);
  const miss=['C','1B','2B','3B','SS','LF','CF','RF'].filter(k=>!ln[k]).map(k=>SLK[k]);
  const pitN=pits.length;
  return `<section class="card fdbd"><div class="row between"><h2 class="sec">우리 팀 ${myPicks.length}명</h2>${(()=>{ const M=fdMoney(); return M?`<span class="small ${M.room<0?'bad':'muted'}">연봉 ${money(M.spent)} / 한도 ${money(M.lim)}</span>`:`<span class="small muted">연봉 ${money(ci.pay)} / 상한 ${money(ci.cap)}</span>`; })()}</div>
    <p class="small ${miss.length?'':'good'}">${miss.length?`빈 수비 위치 ${['C','1B','2B','3B','SS','LF','CF','RF'].filter(k=>!ln[k]).map(k=>`<button class="pill lnkp" data-a="fdSlot" data-v="${k}">${SLK[k]}</button>`).join('')}`:'수비 위치 8곳 완료'} · <button class="pill lnkp" data-a="fdSlot" data-v="P">투수 ${pitN}/${FD_TGT.P}</button> · <span class="muted">연봉 ${money(ci.pay)}</span></p>
    <div class="fld"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M50 96 L88 58 L50 20 L12 58 Z" class="dia"/><path d="M50 96 L2 48 Q50 -14 98 48 Z" class="ofl"/></svg>${['C','1B','2B','SS','3B','LF','CF','RF'].map(slot).join('')}</div>
    <div class="fdh2"><span>지명타자</span>${slot('DH')}${bench.length?`<span>벤치</span>${bench.map(p=>`<button class="fpp${p.id===justId?' just':''}" data-a="player" data-v="${p.id}"><i>${SLK[p.pos]}</i><b>${esc(p.name)}</b>${rchip(Math.round(ovr(p)))}</button>`).join('')}`:''}</div>
    <div class="row between fdpgh" style="margin-top:8px"><b class="small">투수진 ${pits.length}/${FD_TGT.P}</b><span class="small muted">보직은 감독이 체력·투구를 보고 정합니다</span></div>
    <div class="fdpg">${P.map(pc).join('')}${empties?`<button class="fpp empty" data-a="fdSlot" data-v="P"><i>투수 빈자리</i><b>${empties}명 더 · 찾기</b></button>`:''}</div></section>`; }
/* 구단별 지명 현황: 지명된 선수는 능력이 공개된다 */
function fdTeamsView(){ const F=G.fd; const rounds=Math.max(1,...F.picks.filter(x=>x.pid).map(x=>x.rd)); const order=F.order;
  const avgO=tid=>{ const L=F.picks.filter(x=>x.tid===tid&&x.pid).map(x=>G.players[x.pid]).filter(Boolean); return L.length?L.reduce((a,p)=>a+ovr(p),0)/L.length:0; };
  const rk=[...order].sort((a,b)=>avgO(b)-avgO(a));
  const rows=[]; for(let r=1;r<=rounds;r++)rows.push(`<tr><th>${r}R</th>${order.map(tid=>{ const x=F.picks.find(q=>q.rd===r&&q.tid===tid); const q=x&&x.pid?G.players[x.pid]:null; return `<td class="${tid===G.user?'me':''}">${q?`<button class="lnk" data-a="player" data-v="${q.id}">${esc(q.name)}</button><i>${q.isP?'투수':SLK[q.pos]} ${rchip(Math.round(ovr(q)))}</i>`:'<span class="muted">-</span>'}</td>`; }).join('')}</tr>`);
  return `<section class="card"><h2 class="sec">구단별 지명 평균 능력</h2><div class="fdrk">${rk.map((t,i)=>{ const a=avgO(t); return `<span class="${t===G.user?'me':''}">${a?i+1:'-'} ${badge(t,16)} ${esc(tshort(t))} <b>${a?a.toFixed(1):'-'}</b></span>`; }).join('')}</div>
    <p class="small muted keep">지명된 선수는 능력이 공개됩니다. 다른 구단이 기록만 보고 누구를 잘 뽑았는지 비교해 보세요.</p></section>
  <section class="card"><h2 class="sec">라운드별 지명</h2><div class="tw"><table class="dres"><thead><tr><th></th>${order.map(t=>`<th>${badge(t,18)}<br>${esc(tshort(t))}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div></section>`; }
/* 창단 직후: 구단주 환영과 재정 전망, 그다음 드래프트 */
function fdWaitView(){ const t=team(G.user); const B=bossOf(G.user); const f=fdFin(); const ok=f.avail>=f.cap, mid=f.avail>=f.cap*.75;
  const row=(l,v,c)=>`<div class="row between"><span>${l}</span><b class="num ${c||''}">${v}</b></div>`;
  return `<section class="card hero"><div class="eyebrow">${tname(G.user)} 창단</div><div class="row" style="flex-wrap:nowrap;gap:12px">${badge(G.user,48)}<div><h2 class="sec">${esc(B.own.name)} 회장이 반깁니다</h2><p class="small">"${esc(OWNVOICE[t.owner])}"</p></div></div></section>
  <section class="card"><h2 class="sec">올해 재정 전망</h2>
    ${f.inc.map(x=>row(x[0],money(x[1]))).join('')}${row('<b>예상 수입 합계</b>',money(f.I))}
    <div style="height:6px"></div>${f.otherRows.map(x=>row(x[0],'-'+money(x[1]),'bad')).join('')}${row('<b>선수 연봉 외 지출</b>','-'+money(f.other),'bad')}
    <div style="height:6px"></div>${row(t.indie?'모기업 지원':'모기업 지원 한도',t.indie?'없음':money(f.sup))}${row('보유 현금',money(f.cash))}
    <div class="note ${ok?'':mid?'warn':'bad'}" style="margin-top:8px">국내 선수 연봉 여력 <b>${money(Math.max(0,f.avail))}</b> · 샐러리캡 ${money(f.cap)}. ${ok?'캡까지 채워도 버틸 수 있습니다.':mid?'캡을 꽉 채우면 적자입니다. 여력 안쪽으로 뽑는 게 안전합니다.':'비싼 선수를 여럿 뽑으면 적자가 납니다. 연봉 대비 기록이 좋은 선수를 찾아야 합니다.'} 모기업 지원을 한도까지 받는다고 가정한 값입니다. 드래프트가 끝나면 구단주가 올해 지원 목표를 정하고, 그 기준으로 남은 돈이 화면 위 예산 여유로 표시됩니다.</div></section>
  <section class="card"><h2 class="sec">다음 단계: 창단 드래프트</h2><p class="small">리그 국내 선수 전원을 10개 구단이 ${FD_ROUNDS}라운드에 걸쳐 나눕니다. 시작하면 먼저 후보를 둘러볼 시간이 있고, 준비되면 1라운드를 엽니다.</p>
    <button class="btn primary block" data-a="fdBegin">창단 드래프트 열기</button></section>`; }
/* ---------- 창단 드래프트 화면 ---------- */
function fdView(){ const F=G.fd; const pk=F.picks[F.cur]; const pre=F.open===false; const mine=!pre&&pk&&pk.tid===G.user;
  const myPicks=F.picks.filter(x=>x.tid===G.user&&x.pid).map(x=>G.players[x.pid]).filter(Boolean);
  const ci=capInfo(G.user); const sl=new Set(G.shortlist||[]);
  const TK=new Map(F.picks.filter(x=>x.pid).map(x=>[x.pid,x]));
  const gk=UI.fdG||'B', f=UI.fdF||'all', so=UI.fdS||'rec', dir=UI.fdD||0, young=!!UI.fdY, onlyS=!!UI.fdO, hide=UI.fdHide==null?true:!!UI.fdHide; const X=fdCtx(G.user); const ly=(F.y||G.year)-1;
  const posOk=p=>gk==='P'?p.isP:!p.isP&&(f==='all'||p.pos===f||(f==='OF'&&['LF','CF','RF'].includes(p.pos)));
  /* 지명된 선수도 목록에서 빠지지 않고 제자리에 회색으로 남는다 */
  const ALL=(F.all||Object.keys(F.est||{}).map(Number)).map(id=>G.players[id]).filter(p=>p&&(p.fdPool||TK.has(p.id)));
  const left=ALL.filter(p=>p.fdPool);
  let L=ALL.filter(p=>posOk(p)&&(!young||p.age<=24)&&(!onlyS||sl.has(p.id))&&(!hide||p.fdPool)).map(p=>({p,t:TK.get(p.id)||null,s:fdStatLine(p,ly),v:fdScore(G.user,p,true,X)}));
  const cntB=left.filter(p=>!p.isP).length, cntP=left.length-cntB;
  /* 열 정의: [키, 제목, 값, 표시, 높을수록 좋은가, 표본 기준] */
  const n2=x=>x.toFixed(2), ipS=n=>{ const o=Math.round(n*3); return `${Math.floor(o/3)}${o%3?'.'+o%3:''}`; };
  const W=['war','WAR',s=>s.lvl===1?s.war:-99,v=>v<=-90?'-':v.toFixed(1),1];
  const VW=UI.fdV==='trk'; const pct=v=>v+'%';
  const COLS=VW?(gk==='P'?[W,['velo','구속<i class="vmx">직구 평균·최고</i>',s=>s.velo,(v,st)=>`${v}<i class="vmx">최고 ${st&&st.vmax||'-'}</i>`,1,1],['rpm','회전수<i class="vmx">직구 RPM</i>',s=>s.t.rpm,v=>v,1,1],['ext','익스텐션',s=>s.t.ext,v=>v.toFixed(2)+'m',1,1],['pwh','헛스윙 유도',s=>s.t.whiff,pct,1,1],['csw','CSW<i class="vmx">루킹+헛스윙</i>',s=>s.t.csw,pct,1,1],['gb','땅볼 비율',s=>s.t.gb,pct,1]]
    :[W,['ev','타구속도<i class="vmx">평균</i>',s=>s.ev,v=>`${v}km`,1,1],['evm','최고 타구속도',s=>s.t.evmax,v=>`${v}km`,1,1],['hh','강한 타구<i class="vmx">150km 이상</i>',s=>s.t.hh,pct,1,1],['bwh','헛스윙률',s=>s.t.whiff,pct,0,1],['chase','볼 스윙률',s=>s.t.chase,pct,0,1],['run','1루 도달',s=>s.t.run,v=>v.toFixed(2)+'초',0,1],['arm','송구 속도',s=>s.t.arm,v=>`${v}km`,1,1]])
    :gk==='P'?[W,['velo','구속<i class="vmx">직구 평균·최고</i>',s=>s.velo,(v,st)=>`${v}<i class="vmx">최고 ${st&&st.vmax||'-'}</i>`,1,1],['era','ERA',s=>s.era,n2,0,1],['fip','FIP',s=>s.fip,n2,0,1],['whip','WHIP',s=>s.whip,n2,0,1],['ip','이닝',s=>s.n,ipS,1],['g','경기(선발)',s=>s.g,(v,s)=>`${v}${s&&s.gs?`(${s.gs})`:''}`,1],['k9','삼진/9',s=>s.k9,v=>v.toFixed(1),1,1],['bb9','볼넷/9',s=>s.h.bb*9/s.n,v=>v.toFixed(1),0,1]]
    :[W,['ev','타구속도<i class="vmx">평균</i>',s=>s.ev,v=>`${v}km`,1,1],['ops','OPS',s=>s.ops,fmt3,1,1],['obp','출루율',s=>s.obp,fmt3,1,1],['slg','장타율',s=>s.slg,fmt3,1,1],['avg','타율',s=>s.avg,fmt3,1,1],['hr','홈런',s=>s.hr,v=>v,1],['bbk','볼삼비',s=>s.bbk,n2,1,1],['sb','도루',s=>s.sb,v=>v,1],['pa','타석',s=>s.n,v=>v,1]];
  const minN=gk==='P'?20:100; const lg={};
  { const Q=ALL.filter(p=>(gk==='P')===p.isP).map(p=>fdStatLine(p,ly)).filter(s=>s&&s.lvl===1&&s.n>=minN); if(Q.length)for(const c of COLS){ if(!c[5])continue; const v=Q.map(s=>c[2](s)).sort((a,b)=>a-b); lg[c[0]]=v[Math.floor(v.length/2)]; } }
  const col=COLS.find(c=>c[0]===so);
  const key=x=>{ if(so==='rec')return x.v; if(so==='sal')return -x.p.sal; if(so==='grd'){ const g=fdGrade(x.p); return g?g.o+(g.up?1.5:0):-99; } if(!col||!x.s)return -1e9; const ok=!col[5]||x.s.n>=minN; const v=col[2](x.s); return (ok?0:-1e6)+(col[4]?v:-v)+(x.s.lvl===1?0:-5e5); };
  L.sort((a,b)=>(key(b)-key(a))*(dir?-1:1)||a.p.id-b.p.id);
  const more=UI.fdMore||60; const shown=L.slice(0,more);
  const hd=(k,l)=>`<th><button data-a="fdS" data-v="${k}" class="${so===k?'on':''}">${l}${so===k?(dir?'▲':'▼'):''}</button></th>`;
  const cell=(c,x)=>{ if(!x.s)return '<td class="muted">-</td>'; const v=c[2](x.s); let cl=''; if(!x.t){ if(c[0]==='war'&&v>-90)cl=v>=3?'hi':v<0?'lo':''; if(c[5]&&lg[c[0]]!=null&&x.s.n>=minN&&x.s.lvl===1){ const d=(v-lg[c[0]])/(Math.abs(lg[c[0]])||1)*(c[4]?1:-1); cl=d>.12?'hi':d<-.12?'lo':''; } } return `<td class="${cl}">${c[3](v,x.s)}</td>`; };
  const MM=fdMoney();
  const trow=x=>{ const p=x.p; const lv=x.s&&x.s.lvl===2; const t=x.t; const me=t&&t.tid===G.user;
    const lead=t?`<span class="fdtk">${badge(t.tid,18)}</span>`:`<button class="fds${sl.has(p.id)?' on':''}" data-a="star" data-v="${p.id}" aria-label="관심">${sl.has(p.id)?'★':'☆'}</button>${gchip(fdGrade(p))}`;
    const tail=t?`<span class="fdtk2"><i>${me?'우리':esc(tshort(t.tid))} ${t.rd}-${t.no}</i>${rchip(Math.round(ovr(p)))}</span>`:mine?`<button class="fdgo" data-a="fdPick" data-v="${p.id}">지명</button>`:'';
    return `<tr class="${lv?'f2':''}${!t&&sl.has(p.id)?' st':''}${t?(me?' gone me':' gone'):''}"><th><div class="fdn">${lead}<button class="fdnm" data-a="player" data-v="${p.id}"><b>${esc(p.name)}</b><i>${p.age}세 · ${p.isP?'투수':SLK[p.pos]||posLabel(p)}${lv?' · 2군':''}${isAway(p)?' · 군':''}</i></button>${tail}</div></th>${cell(COLS[0],x)}<td class="${!t&&MM&&p.sal>MM.room-MM.W?'lo':''}" title="${!t&&MM&&p.sal>MM.room-MM.W?'지명하면 연봉 한도를 넘을 수 있습니다':''}">${money(p.sal)}</td>${COLS.slice(1).map(c=>cell(c,x)).join('')}<td class="small">${esc(tContract(p))}</td><td class="small">${p.fdFrom!=null?esc(tshort(p.fdFrom)):''}</td></tr>`; };
  const listPane=`<section class="card"><div class="seg"><button data-a="fdG" data-v="B" class="${gk==='B'?'on':''}">야수 남은 ${cntB}</button><button data-a="fdG" data-v="P" class="${gk==='P'?'on':''}">투수 남은 ${cntP}</button></div>
    ${gk==='B'?`<div class="chips">${[['all','전체'],['C','포수'],['1B','1루'],['2B','2루'],['3B','3루'],['SS','유격'],['OF','외야'],['LF','좌익'],['CF','중견'],['RF','우익'],['DH','지명']].map(([k,l])=>`<button data-a="fdF" data-v="${k}" class="${f===k?'on':''}">${l}</button>`).join('')}</div>`:''}
    <div class="chips"><span class="seg sm" style="display:inline-flex"><button data-a="fdV" data-v="rec" class="${UI.fdV!=='trk'?'on':''}">기록</button><button data-a="fdV" data-v="trk" class="${UI.fdV==='trk'?'on':''}">측정</button></span><button data-a="fdS" data-v="rec" class="${so==='rec'?'on':''}">추천순</button><button data-a="fdS" data-v="grd" class="${so==='grd'?'on':''}">등급순${so==='grd'?(dir?'▲':'▼'):''}</button><button data-a="fdY" class="${young?'on':''}">24세 이하</button><button data-a="fdO" class="${onlyS?'on':''}">관심만 ${[...sl].filter(id=>G.players[id]&&G.players[id].fdPool).length||''}</button><button data-a="fdHide" class="${hide?'on':''}">남은 선수만</button></div>
    <p class="small muted keep">${ly}시즌 기록 · 글자는 스카우트 추정 등급(틀릴 수 있음, S 75+ · A 65+ · B 55+ · C 50+ · D 45+, 능력 50이 리그 평균) · 회색 줄은 이미 지명된 선수 · 열 제목으로 정렬</p>
    <div class="fdt-w"><table class="fdt"><thead><tr><th class="c0">선수</th>${hd(COLS[0][0],COLS[0][1])}${hd('sal','연봉')}${COLS.slice(1).map(c=>hd(c[0],c[1])).join('')}<th>계약</th><th>전 소속</th></tr></thead><tbody>${shown.map(trow).join('')}</tbody></table></div>
    ${L.length>shown.length?`<button class="btn block" data-a="fdMore">${Math.min(60,L.length-shown.length)}명 더 보기 (${shown.length}/${L.length})</button>`:''}</section>`;
  const tab=UI.fdTab==='team'?'team':'list';
  const miss=(()=>{ const {ln}=fdLineupOf(myPicks.filter(p=>!p.isP)); return ['C','1B','2B','3B','SS','LF','CF','RF'].filter(k=>!ln[k]).length; })(); const pitN=myPicks.filter(p=>p.isP).length;
  return `${UI.fdMsg?`<div class="note bad">${esc(UI.fdMsg)}</div>`:''}<div class="seg fdseg"><button data-a="fdTab" data-v="list" class="${tab==='list'?'on':''}">후보 선수</button><button data-a="fdTab" data-v="team" class="${tab==='team'?'on':''}">우리 팀 <i class="fdsg">빈자리 ${miss+Math.max(0,FD_TGT.P-pitN)}</i></button></div>
  <div class="fdlay t-${tab}"><div class="fdl-side">${fdBoard(myPicks,ci,pre?null:(UI.fdJust||null))}</div><div class="fdl-main">${listPane}</div></div>${revView()}`; }
/* 창단 드래프트 연봉 계산: 지금까지 쓴 돈, 쓸 수 있는 한도, 남은 지명과 자동 배분까지 감안한 1명당 여유 */
function fdMoney(){ const F=G.fd; if(!F)return null; const key=G.day+':'+G.user; if(!UI._fdf||UI._fdf.k!==key){ try{ UI._fdf={k:key,f:fdFin()}; }catch(e){ return null; } } const f=UI._fdf.f;
  const mine=Object.values(G.players).filter(p=>p.team===G.user&&!p.foreign); const spent=sum(mine.map(p=>p.sal));
  const lim=Math.min(f.cap,Math.max(0,f.avail)); const left=F.picks.slice(F.cur).filter(x=>x.tid===G.user).length;
  const pool=F.pool.map(id=>G.players[id]).filter(p=>p&&p.fdPool).map(p=>p.sal).sort((a,b)=>a-b); const cheap=pool.slice(0,Math.max(1,Math.round(pool.length*.4))); const avgC=cheap.length?sum(cheap)/cheap.length:MIN_SAL;
  const autoN=Math.max(0,52-mine.length-left); const W=Math.round(autoN*avgC); const room=lim-spent; const per=left?Math.max(0,(room-W)/left):0;
  const fr=(f.otherRows||[]).find(x=>/외국인/.test(x[0])); return {spent,lim,room,left,autoN,W,per,capBound:f.avail>=f.cap,fres:fr?fr[1]:0,res:f.res}; }
function fdMoneyLine(){ const M=fdMoney(); if(!M)return ''; const c=M.room-M.W<0?'bad':M.room-M.W<M.lim*.1?'warn':'good';
  return `<div class="tk0"><span>국내 연봉 <b>${money(M.spent)}</b> / 한도 <b>${money(M.lim)}</b><i>${M.capBound?'샐러리캡':'재정 여력'}</i></span><span>남은 돈 <b class="${c}">${money(M.room)}</b></span>${M.left?`<span>남은 지명 ${M.left}번 · 1명당 약 <b>${money(M.per)}</b></span>`:''}<span class="muted" title="지명이 끝나면 남은 선수 ${M.autoN}명이 자동 배분됩니다(약 ${money(M.W)}). 외국인 4명 예산 ${money(M.fres)}은 따로 잡아 두었습니다.${M.res?` 감독·코치 빈자리 채용비 ${money(M.res.vac)}와 운영 여유분 ${money(M.res.cush)}도 한도에서 미리 뺐습니다.`:''}">자동 배분 ${M.autoN}명(${money(M.W)}) 포함 · 외국인 예산·감독·코치 채용비 별도</span></div>`; }
/* 드래프트 상황판: 화면 위에 고정. 목록을 보면서 다른 구단 지명을 같이 본다 */
function fdTicker(){ const F=G.fd; if(!F||F.done)return ''; const pk=F.picks[F.cur]; const pre=F.open===false; const mine=!pre&&pk&&pk.tid===G.user;
  if(!pre&&!mine&&pk&&!(UI.dl&&UI.dl.kind==='fd')&&!UI.dlAuto&&!UI.rev){ UI.dlAuto=1; setTimeout(()=>{ UI.dlAuto=0; const p2=G.fd&&G.fd.picks[G.fd.cur]; if(G.fd&&!G.fd.done&&G.fd.open!==false&&p2&&p2.tid!==G.user&&!(UI.dl&&UI.dl.kind==='fd')&&!UI.rev)dliveStart('fd'); },700); }
  const L=UI.dl&&UI.dl.kind==='fd'?UI.dl:null; const on=!!(L&&L.on); const top=L&&L.feed&&L.feed[0]; const st=L&&L.stolen&&L.stolen[0]; const fresh=st&&top&&st.pid===top.pid;
  const k=F.picks.slice(F.cur).findIndex(x=>x.tid===G.user); const sp=UI.dspeed||'norm';
  let r1;
  if(pre){ const first=F.picks.findIndex(x=>x.tid===G.user)+1; r1=`<b>지명 전 탐색 시간</b><span class="muted">우리 첫 지명 ${first}번째</span><button class="btn small primary" data-a="fdOpen">1라운드 시작</button>`; }
  else if(mine){ const rec=fdUserRec(1)[0]; r1=`<b class="good">우리 차례 · ${pk.rd}라운드 ${pk.no}번째</b>${rec?`<button class="btn small primary" data-a="fdRec">추천 ${esc(rec.name)} 지명</button>`:''}<button class="btn small" data-a="fdAutoN" data-v="5" title="우리 지명 5번을 스카우트 추천대로 뽑고 다시 멈춥니다">5번 자동</button><button class="btn small" data-a="fdAuto">남은 자동</button>`; }
  else r1=`${on?'<span class="dl-dot"></span>':''}${badge(pk.tid,18)}<b>${esc(tshort(pk.tid))} 지명 중 · ${pk.rd}-${pk.no}</b><span class="muted">우리 차례까지 ${k<0?'-':k}번</span><span class="tk-sp"><button data-a="dlSpdC" class="on">속도 ${({slow:'느리게',norm:'보통',fast:'빠르게'})[sp]}</button>${on?'<button data-a="dlStop">멈춤</button>':'<button data-a="fdAdv">진행</button>'}</span>`;
  const r2=fresh?`<div class="tk2 steal"><b>뺏겼습니다</b><span>${esc(st.tg)} <button class="lnk" data-a="player" data-v="${st.pid}">${esc(st.nm)}</button>을(를) ${esc(tshort(st.tid))}이(가) ${st.rd}-${st.no}에 지명</span>${top.o!=null?rchip(top.o):''}</div>`
    :top?`<div class="tk2">${badge(top.tid,16)}<i>${top.rd}-${top.no}</i><button class="lnk" data-a="player" data-v="${top.pid}">${esc(top.nm)}</button><span class="muted">${esc(top.pos)}${top.age!=null?` · ${top.age}세`:''}</span>${top.me?'<em class="good">우리 지명</em>':top.o!=null?rchip(top.o):''}${L.stN?`<span class="tk-l">놓친 관심 ${L.stN}명</span>`:''}</div>`:'';
  return `<div class="tk"><div class="tk1">${r1}</div>${fdMoneyLine()}${r2}</div>`; }
function teamIdCard(){ const tid=G.user; if(G.unemp)return ''; const cap=captainOf(tid); const st=domestic(tid).filter(p=>p.fr&&p.fr.tid===tid).sort((a,b)=>ovr(b)-ovr(a)); const C=(G.chron||[]).filter(x=>x.tid===tid); const last=C.filter(x=>x.k!=='season').slice(-3).reverse();
  const champs=(G.history||[]).filter(h=>h.y>=2026&&h.champ===tid).length; const yrs=G.gmSince!=null?G.year-G.gmSince+1:1;
  return `<section class="card"><div class="row between"><h2 class="sec">우리 팀</h2><button class="btn small" data-a="go" data-v="club:chron">연대기</button></div>
    <p class="small">재임 ${yrs}년째${champs?` · 우승 ${champs}회`:''} · 주장 ${cap?`<button class="lnk" data-a="player" data-v="${cap.id}">${esc(cap.name)}</button>`:'없음'}</p>
    <p class="small">프랜차이즈 스타 ${st.length?st.map(p=>`<button class="lnk" data-a="player" data-v="${p.id}">${esc(p.name)}</button>`).join(', '):'아직 없음 · 한 팀에서 5시즌, 통산 WAR 12면 탄생'}</p>
    ${last.length?`<div class="eyebrow">최근 구단사</div>${last.map(x=>`<p class="small">${x.y} · ${esc(x.t)}</p>`).join('')}`:''}</section>`; }
/* 체험판 종료 화면: 한 시즌 기록과 다음 버전 안내 */
const FEEDBACK_URL='';
function demoEndView(){ const y=G.year; const H=(G.history||[]).find(h=>h.y===y); const u=H&&H.user; const gs=goalStatus(); const L=G.last&&G.last.y===y?G.last:null;
  const ps=L&&L.ps; const psr=ps?(ps.champ===G.user?'한국시리즈 우승':ps.runner===G.user?'한국시리즈 준우승':ps.poLose===G.user?'플레이오프 탈락':ps.spoLose===G.user?'준플레이오프 탈락':ps.wcLose===G.user?'와일드카드 탈락':'가을야구 탈락'):'';
  const best=playersOf(G.user).map(p=>({p,h:seasonTotal(p,y,'1군')})).filter(x=>x.h).map(x=>({...x,w:wOf(x.h,x.p)})).sort((a,b)=>b.w-a.w).slice(0,3);
  const tr=(G.trades||[]).filter(t=>t.y===y).length; const fdp=G.fd?G.fd.picks.filter(x=>x.tid===G.user&&x.pid).length:0;
  const row=(l,v)=>`<div class="row between"><span class="muted">${l}</span><b>${v}</b></div>`;
  return `<section class="card hero demo-end"><div class="eyebrow">무료 체험판 · 버전 ${GAME_VER}</div><h2 class="sec" style="font-size:24px">${y}시즌을 마쳤습니다</h2>
    <p>${esc(tname(G.user))} 창단 첫 시즌 기록입니다. 체험판은 여기까지입니다.</p>
    ${u?row('정규시즌',`${u.rank}위 · ${u.w}승 ${u.l}패${u.t?` ${u.t}무`:''}`):''}${psr?row('포스트시즌',psr):''}
    ${gs?row('구단주 목표',`${gs.rank.t}위 이내 ${gs.rank.ok?'<span class="good">달성</span>':'<span class="bad">미달</span>'}`):''}
    ${row('창단 드래프트 지명',`${fdp}명`)}${row('트레이드',`${tr}건`)}
    ${best.length?`<div class="eyebrow" style="margin-top:8px">올해의 우리 선수</div>${best.map(x=>`<p class="small"><button class="lnk" data-a="player" data-v="${x.p.id}">${esc(x.p.name)}</button> · ${statLine(x.h,x.p)}</p>`).join('')}`:''}
    <p class="small" style="margin-top:8px">정식판에서는 스토브리그(FA·연봉 협상·외국인 재계약), 신인 드래프트, 2년차 이후 팀 성장이 이어집니다. 저장은 그대로 남아 있습니다.</p>
    <div class="row" style="gap:6px;margin-top:6px">${FEEDBACK_URL?`<a class="btn primary" href="${FEEDBACK_URL}" target="_blank" rel="noopener">피드백 남기기</a>`:''}<button class="btn" data-a="toTitle">처음 화면</button></div></section>`; }
function homeView(){
  if(G.demoEnd)return demoEndView()+[miniStand(),newsCard()].filter(Boolean).join('');
  if(G.gameOver)return gameOverView();
  if(G.fdWait)return fdWaitView();
  if(G.fd&&!G.fd.done)return fdView();
  if(G.unemp)return unempView()+[miniStand(),newsCard()].filter(Boolean).join('');
  faCelebrate(); const dO=UI.open.homeDesk??false;
  const desk=G.gameOver?'':`<details class="moreg" data-k="homeDesk" data-lazy="${dO?0:1}" ${dO?'open':''}><summary><span>단장 데스크</span><i>자리별 전력 순위 · 추천 트레이드 · 사람들과의 관계</i></summary><div class="moreb">${dO?[deskCard(),relStrip()].filter(Boolean).join(''):''}</div></details>`;
  const today=[resultHome(),liveCard(),digestCard(),todoCard(),decisionCard(),tutCard(),offersCard(),reqHomeCard(),mgrChatCard(true),faHomeCard(),campCard(),nextCard(),desk].filter(Boolean).join('');
  const league=[miniStand(),formCard(),newsCard()].filter(Boolean).join('');
  const moreBody=[myLeaders(),clubCard(),calendarCard()].filter(Boolean).join('');
  const o=UI.open.homeMore??false;
  const more=moreBody?`<details class="moreg" data-k="homeMore" ${o?'open':''}><summary><span>더 보기</span><i>우리 팀 주요 선수 · 구단 상태 · 일정</i></summary><div class="moreb">${moreBody}</div></details>`:'';
  const gh=t=>`<h2 class="grp-t">${t}</h2>`;
  if(wide())return `${stripBar()}<div class="homeg"><div class="col">${gh('오늘 할 일')}${today}</div><div class="col">${gh('리그 현황')}${league}${more}</div></div>`;
  const todo=[todoCard(),decisionCard(),tutCard(),offersCard(),reqHomeCard(),mgrChatCard(true),faHomeCard(),campCard()].filter(Boolean).join('');
  const games=[resultHome(),liveCard(),digestCard(),nextCard()].filter(Boolean).join('');
  if(G.res&&UI._hres!==G.res.i+':'+G.day){ UI._hres=G.res.i+':'+G.day; UI.it=UI.it||{}; UI.it.home='game'; } /* 경기가 막 끝나면 경기 탭을 먼저 */
  const ht=inTabs('home',[['today','할 일'],...(games?[['game','경기']]:[]),['league','리그'],['team','우리 팀']]);
  return `${stripBar()}${ht.bar}${ht.cur==='today'?todo:ht.cur==='game'?games:ht.cur==='league'?[miniStand(),newsCard()].filter(Boolean).join(''):[desk,teamIdCard(),formCard(),myLeaders(),clubCard()].filter(Boolean).join('')}`;
}

/* 소식함: 업무 분리, 날짜별 묶음 */
function mailGroups(list){ let last=null; const out=[]; for(const m of list){ if(m.day!==last){ last=m.day; out.push(`<div class="mday">${dmd(m.day)} ${WD[dobj(m.day).w]}</div>`); } out.push(mailItem(m)); } return out.join(''); }
/* ---------- 소식함 페이지: 왼쪽 목록, 오른쪽 본문이 이어지는 피드 ---------- */
function mailCard(m){
  const o=m.oid&&(G.offers||[]).find(x=>x.id===m.oid);
  return `<article class="mfc${m.read?'':' unread'}" id="m-${m.id}" data-mid="${m.id}">
    <header class="mfc-h">${senderAv(m)}<div class="mfc-t"><div class="mfc-s">${m.imp?'<span class="pill acc">중요</span> ':''}<b>${lk(m.subj)}</b></div><span class="small muted">${esc(m.from)} · ${dsh(m.day)}</span></div></header>
    <div class="mailbody">${m.body.split('\n').filter(Boolean).map(t=>`<p>${lk(t)}</p>`).join('')}</div>
    ${m.acts.length?`<div class="btns mact">${m.acts.map((a,i)=>`<button class="btn ${i===0?'primary':''}" data-a="mailAct" data-v="${m.id}:${i}">${esc(a.l)}</button>`).join('')}</div>`:''}
    ${o?offerOne(o):m.oid?'<p class="small muted">이미 답했거나 만료된 제안입니다.</p>':''}</article>`; }
function mailRow(m){ return `<button class="mrow${m.read?'':' unread'}" data-a="mailJump" data-v="${m.id}" data-mid="${m.id}">${senderAv(m)}<span class="mrow-t">${m.imp?'<i class="mrow-imp"></i>':''}${esc(m.subj)}</span><span class="mrow-d">${dsh(m.day)}</span></button>`; }
/* 처리할 메일: 안 읽었고 중요하거나 업무·버튼·제안이 있는 것. 상단 숫자는 이것만 센다 */
const mailNeeds=m=>!m.read&&(m.imp||m.kind==='업무'||(m.acts&&m.acts.length>0)||!!m.oid);
function inboxView(){
  const f=UI.mf||'all'; const all=mailFilter(f).slice(0,150);
  /* 지난 정보: 7일이 지났고 이미 읽은 메일은 접어 둔다 */
  const isOld=m=>m.read&&G.day-m.day>7; const oldN=f==='all'?all.filter(isOld).length:0; const list=f==='all'&&!UI.ibOld?all.filter(m=>!isOld(m)):all;
  const oldBtn=oldN?`<button class="btn block ib-old" data-a="ibOld">${UI.ibOld?'지난 메일 접기':`지난 메일 ${oldN}통 펼치기 (일주일 지난 읽은 메일)`}</button>`:'';
  const unread=G.mail.filter(m=>!m.read).length, tasks=mailFilter('task').filter(m=>!m.read).length;
  const chips=`<div class="chips ib-chips">${[['all','전체'],['task',`업무${tasks?` ${tasks}`:''}`],['unread','안 읽음'],['player','선수']].map(([k,l])=>`<button data-a="mf" data-v="${k}" class="${f===k?'on':''}">${l}</button>`).join('')}</div><div class="row between" style="margin:4px 0 6px"><span class="ib-n small muted">안 읽음 <b id="ib-unread">${unread}</b></span>${unread?'<button class="btn small" data-a="readAll">모두 읽음</button>':''}</div>`;
  if(!list.length)return chips+`<section class="card"><p class="muted">${oldN?'새 메일이 없습니다.':'메일이 없습니다.'}</p></section>`+oldBtn;
  if(UI.mailFocus){ const ix=list.findIndex(m=>m.id===UI.mailFocus); if(ix<0&&f==='all'&&!UI.ibOld&&all.some(m=>m.id===UI.mailFocus)){ UI.ibOld=true; return inboxView(); } if(ix>=0){ UI.pg=UI.pg||{}; UI.pg['ib'+f+(UI.ibOld?'o':'')]=Math.floor(ix/(wide()?12:5)); } }
  const PG=pager('ib'+f+(UI.ibOld?'o':''),list,wide()?12:5); const list0=list; void list0;
  let last=null; const feed=PG.items.map(m=>{ let h=''; if(m.day!==last){ last=m.day; h=`<div class="mday">${dmd(m.day)} ${WD[dobj(m.day).w]}</div>`; } return h+mailCard(m); }).join('');
  if(!wide())return chips+`<div class="mfeed" data-pg="${'ib'+f+(UI.ibOld?'o':'')}">${feed}</div>`+PG.bar+oldBtn;
  /* 데스크톱: 왼쪽 목록에서 고른 메일 한 통만 오른쪽에 펼친다(세로로 길게 늘어놓지 않는다) */
  const ids=PG.items.map(m=>m.id); let sel=[UI.mailFocus,UI.ibSel].find(v=>v&&ids.includes(v)); if(!sel){ const u=PG.items.find(m=>!m.read); sel=(u||PG.items[0]).id; } UI.ibSel=sel;
  const si=ids.indexOf(sel), sm=PG.items[si]; setTimeout(()=>ibMark(sel),400);
  last=null; const rows=PG.items.map(m=>{ let h=''; if(m.day!==last){ last=m.day; h=`<div class="mday">${dmd(m.day)} ${WD[dobj(m.day).w]}</div>`; } return h+mailRow(m).replace('class="mrow',`class="mrow${m.id===sel?' cur':''}`); }).join('');
  const nav=`<div class="row between ib-nav"><button class="btn small" data-a="mailJump" data-v="${ids[si-1]||''}" ${si>0?'':'disabled'}>◀ 이전 메일</button><span class="small muted">${si+1} / ${ids.length}</span><button class="btn small" data-a="mailJump" data-v="${ids[si+1]||''}" ${si<ids.length-1?'':'disabled'}>다음 메일 ▶</button></div>`;
  return chips+`<div class="ib2"><nav class="ib-list" aria-label="메일 목록">${rows}${PG.bar}${oldBtn}</nav><div class="mfeed one">${nav}${mailCard(sm)}</div></div>`;
}
/* 화면에 보인 메일은 읽음으로. 다시 그리지 않고 표시만 바꾼다 */
let _ibSave=null, _ibOn=false, _ibRaf=0;
function ibMark(id){ const m=G.mail.find(x=>x.id===id); if(!m||m.read)return; m.read=true;
  document.querySelectorAll(`[data-mid="${id}"]`).forEach(el=>el.classList.remove('unread'));
  const n=G.mail.filter(x=>!x.read).length; const u=document.getElementById('ib-unread'); if(u)u.textContent=n;
  const nb=G.mail.filter(mailNeeds).length; const mb=document.querySelector('.mailbtn i'); if(mb){ if(nb)mb.textContent=nb>99?'99+':nb; else mb.remove(); }
  const rc=document.querySelector('.rail [data-v=inbox] .cnt'); if(rc){ if(n)rc.textContent=n; else rc.remove(); }
  if(!n){ const d=document.querySelector('.bnav [data-v=inbox] .dot'); if(d)d.remove(); }
  clearTimeout(_ibSave); _ibSave=setTimeout(()=>save(),700); }
function ibTop(){ const t=document.querySelector('.top'); return t?t.offsetHeight:60; }
function ibScan(){ _ibRaf=0; if(!G||UI.tab!=='inbox')return; const H=innerHeight, T=ibTop(); let cur=null;
  for(const el of document.querySelectorAll('.mfeed .mfc')){ const r=el.getBoundingClientRect(); if(r.bottom<T)continue; if(r.top>H)break;
    if(!cur&&r.bottom>T+50)cur=el.dataset.mid;
    if(r.top<H*.72&&r.bottom>T+20)ibMark(el.dataset.mid); }
  if(cur&&cur!==UI.ibCur){ UI.ibCur=cur; const L=document.querySelector('.ib-list'); if(L){ L.querySelectorAll('.mrow.cur').forEach(x=>x.classList.remove('cur')); const it=L.querySelector(`.mrow[data-mid="${cur}"]`); if(it){ it.classList.add('cur'); const a=it.offsetTop, b=a+it.offsetHeight; if(a<L.scrollTop+30||b>L.scrollTop+L.clientHeight-10)L.scrollTop=a-L.clientHeight/3; } } } }
function inboxWire(){ if(!_ibOn){ _ibOn=true; addEventListener('scroll',()=>{ if(UI.tab==='inbox'&&!_ibRaf)_ibRaf=requestAnimationFrame(ibScan); },{passive:true}); }
  UI.ibCur=null; document.documentElement.style.setProperty('--ibtop',(ibTop()+8)+'px'); const f=UI.mailFocus; UI.mailFocus=null;
  if(f){ const el=document.getElementById('m-'+f); if(el){ el.scrollIntoView({block:'start'}); el.classList.add('flash'); } }
  setTimeout(ibScan,60); }
function ibStep(d){ if(wide()&&document.querySelector('.mfeed.one')){ const ids=[...document.querySelectorAll('.ib-list .mrow')].map(e=>e.dataset.mid); const i=ids.indexOf(UI.ibSel); const n=ids[i+d]; if(n)A.mailJump(n); return; } const cards=[...document.querySelectorAll('.mfeed .mfc')]; if(!cards.length)return; const T=ibTop(); let i=cards.findIndex(el=>el.getBoundingClientRect().bottom>T+50); if(i<0)i=0; const r=cards[i].getBoundingClientRect(); const al=Math.abs(r.top-T-8)<30; const n=d>0?(r.top>T+40?i:i+1):(al?i-1:i); const el=cards[Math.max(0,Math.min(cards.length-1,n))]; el.scrollIntoView({block:'start',behavior:'smooth'}); }

/* ---------- 그림 에셋: 트로피·메달·사건 아이콘 (직접 그린 SVG) ---------- */
let ARTN=0;
const ART={
  trophy:(sz)=>{ const id='tg'+(++ARTN); return `<svg class="art" width="${sz}" height="${sz}" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="#b8862b"/><stop offset=".45" stop-color="#ffe08a"/><stop offset="1" stop-color="#c8922e"/></linearGradient></defs><path d="M20 8h24v14c0 8-5.4 14-12 14s-12-6-12-14Z" fill="url(#${id})"/><path d="M20 12h-7c0 7 3 11 8 12M44 12h7c0 7-3 11-8 12" fill="none" stroke="url(#${id})" stroke-width="3"/><path d="M28 36h8v8h-8Z" fill="url(#${id})"/><path d="M21 44h22l2 6H19Z" fill="url(#${id})"/><rect x="16" y="50" width="32" height="7" rx="1.5" fill="#3a2a12"/><rect x="22" y="52" width="20" height="3" rx=".8" fill="#c8922e"/><path d="M27 14l-2 12" stroke="#fff6cf" stroke-width="2" opacity=".6" stroke-linecap="round"/><path d="m32 15 1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5Z" fill="#fff6cf"/></svg>`; },
  medal:(sz,c)=>{ const m={gold:['#ffe08a','#c8922e'],silver:['#eef2f5','#9aa6b2'],bronze:['#f2b47a','#9a5a2a'],green:['#9be7b0','#2f8a52']}[c||'gold']; return `<svg class="art" width="${sz}" height="${sz}" viewBox="0 0 32 32" aria-hidden="true"><path d="M10 2h5l3 9h-5ZM22 2h-5l-3 9h5Z" fill="#c43a31"/><path d="M12 2h2l2.5 8h-2ZM20 2h-2l-2.5 8h2Z" fill="#2b5b8a"/><circle cx="16" cy="20" r="9" fill="${m[1]}"/><circle cx="16" cy="20" r="7" fill="${m[0]}"/><path d="m16 15 1.5 3 3.3.5-2.4 2.3.6 3.3-3-1.6-3 1.6.6-3.3-2.4-2.3 3.3-.5Z" fill="${m[1]}"/></svg>`; },
  glove:(sz)=>`<svg class="art" width="${sz}" height="${sz}" viewBox="0 0 32 32" aria-hidden="true"><path d="M8 27c-3-4-4-9-3-14l1-6c.3-1.6 2.6-1.4 2.6.2V13l1-9c.2-1.7 2.7-1.6 2.7.1V12l1.2-8.4c.3-1.7 2.8-1.4 2.7.3L16 13l1.6-6.6c.4-1.6 2.8-1.1 2.6.5L19.4 15l2.4-2.6c1.3-1.4 3.5.2 2.4 1.8L20 21c-1.4 2.3-1.6 4-1.6 6Z" fill="#d9a441" stroke="#7a5418" stroke-width="1"/><path d="M8.6 13.4h3.6M12.8 12h3M17 13.6h2.6" stroke="#7a5418" stroke-width=".9" stroke-linecap="round"/><circle cx="23.5" cy="23.5" r="4.5" fill="#f4f6f8" stroke="#c43a31" stroke-width=".8"/><path d="M20.6 21.4q2.4 2 0 4.4M26.4 21.4q-2.4 2 0 4.4" fill="none" stroke="#c43a31" stroke-width=".7"/></svg>`,
  plaque:(sz)=>`<svg class="art" width="${sz}" height="${sz}" viewBox="0 0 32 32" aria-hidden="true"><rect x="5" y="3" width="22" height="26" rx="2" fill="#5a3a1c"/><rect x="8" y="6" width="16" height="20" rx="1" fill="#c8922e"/><circle cx="16" cy="12" r="3.2" fill="#7a5418"/><path d="M11 18h10M12 21h8M13 23.6h6" stroke="#7a5418" stroke-width="1" stroke-linecap="round"/></svg>`
};
const EVI={pt:'<path d="M4 15h16M6 15v4M18 15v4M8 11h8v4H8Z"/>',call:'<path d="M12 19V5M6 11l6-6 6 6"/>',reinf:'<path d="M12 5v14M5 12h14"/>',clash:'<path d="M13 3 6 13h5l-1 8 7-10h-5Z"/>',press:'<path d="M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3ZM6 11a6 6 0 0 0 12 0M12 17v4M9 21h6"/>',slump:'<path d="M4 6l6 6 4-4 6 8M20 10v6h-6"/>',fx:'<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c2.5 2.8 2.5 13.2 0 16M12 4c-2.5 2.8-2.5 13.2 0 16"/>',inj:'<path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6Z"/>',agent:'<path d="M7 3h7l4 4v14H7Z"/><path d="M14 3v4h4M10 12h5M10 15h5M10 18h3"/>',vet:'<path d="m12 4 2.3 4.7 5.2.8-3.8 3.6.9 5.1L12 15.8 7.4 18.2l.9-5.1-3.8-3.6 5.2-.8Z"/>',fan:'<path d="M4 10v4l10 4V6Z"/><path d="M14 8a4 4 0 0 1 0 8M7 15l1 5h3l-1-4"/>'};
const evIcon=k=>`<svg class="evi" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${EVI[k]||EVI.vet}</svg>`;
function awArt(a,sz){ return a.includes('골든글러브')?ART.glove(sz):a.includes('명예의 전당')?ART.plaque(sz):a.includes('MVP')?ART.medal(sz,'gold'):a.includes('신인')?ART.medal(sz,'green'):a.includes('우승')?ART.trophy(sz):ART.medal(sz,'silver'); }
function cardTier(o){ return o==null?'':o>=64?'t-gold':o>=57?'t-silver':o>=50?'t-bronze':''; }

/* ---------- 효과음 ---------- */
const SND={ctx:null,buf:{},loops:{}};
function sndOn(){ return false; } /* 효과음 제거 */
function sndInit(){ if(SND.ctx||!sndOn())return; const AC=window.AudioContext||window.webkitAudioContext; if(!AC||typeof SNDDATA==='undefined')return;
  try{ SND.ctx=new AC(); }catch(e){ return; } SND.master=SND.ctx.createGain(); SND.master.gain.value=.85; SND.master.connect(SND.ctx.destination);
  for(const k in SNDDATA){ try{ const bin=atob(SNDDATA[k].split(',')[1]); const u=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
      SND.ctx.decodeAudioData(u.buffer,b=>{ SND.buf[k]=b; },()=>{}); }catch(e){} } }
function sndReady(){ if(!sndOn())return null; sndInit(); const c=SND.ctx; if(!c)return null; if(c.state==='suspended')c.resume(); return c; }
function sfx(k,vol,rate){ const c=sndReady(); if(!c||!SND.buf[k])return null; const s=c.createBufferSource(); s.buffer=SND.buf[k]; if(rate)s.playbackRate.value=rate;
  const g=c.createGain(); g.gain.value=vol??1; s.connect(g); g.connect(SND.master); s.start(); return {s,g}; }
function sndLoop(name,k,vol,fade){ if(SND.loops[name]&&SND.loops[name].k===k)return; sndStop(name,.2); const c=sndReady(); if(!c||!SND.buf[k])return; const s=c.createBufferSource(); s.buffer=SND.buf[k]; s.loop=true;
  const g=c.createGain(); g.gain.setValueAtTime(0,c.currentTime); g.gain.linearRampToValueAtTime(vol,c.currentTime+(fade??.8)); s.connect(g); g.connect(SND.master); s.start(); SND.loops[name]={s,g,k}; }
function sndStop(name,fade){ const L=SND.loops[name]; if(!L||!SND.ctx)return; const c=SND.ctx; const f=fade??.6; try{ L.g.gain.cancelScheduledValues(c.currentTime); L.g.gain.setValueAtTime(L.g.gain.value,c.currentTime); L.g.gain.linearRampToValueAtTime(0,c.currentTime+f); L.s.stop(c.currentTime+f+.05); }catch(e){} delete SND.loops[name]; }
function sndStopAll(){ for(const k in SND.loops)sndStop(k,.3); }
/* 오르간: 야구장 전통 나팔 신호(차지) 음형. 직접 합성 */
function organ(seq,vol){ const c=sndReady(); if(!c)return; let t=c.currentTime+.02;
  for(const [m,d] of seq){ if(m){ const f=440*Math.pow(2,(m-69)/12); const g=c.createGain(); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime((vol||.22),t+.02); g.gain.setValueAtTime((vol||.22),t+d*.85); g.gain.linearRampToValueAtTime(0,t+d);
      g.connect(SND.master); for(const [mul,a] of [[1,1],[2,.5],[3,.25],[4,.12]]){ const o=c.createOscillator(); o.type='sine'; o.frequency.value=f*mul; const og=c.createGain(); og.gain.value=a; o.connect(og); og.connect(g); o.start(t); o.stop(t+d+.05); } }
    t+=d; } }
const ORG_CHARGE=[[67,.16],[72,.16],[76,.16],[79,.3],[76,.14],[79,.6]];
const ORG_WIN=[[72,.14],[76,.14],[79,.14],[84,.5],[0,.08],[79,.14],[84,.7]];
function siren(){ const c=sndReady(); if(!c)return; const t=c.currentTime; const o=c.createOscillator(); o.type='sawtooth'; const g=c.createGain(); const lp=c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=1400;
  o.frequency.setValueAtTime(380,t); o.frequency.linearRampToValueAtTime(620,t+.9); o.frequency.linearRampToValueAtTime(560,t+1.8);
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(.12,t+.15); g.gain.setValueAtTime(.12,t+1.4); g.gain.linearRampToValueAtTime(0,t+1.9); o.connect(lp); lp.connect(g); g.connect(SND.master); o.start(t); o.stop(t+2); }
function buzz(ms){ try{ if(navigator.vibrate)navigator.vibrate(ms); }catch(e){} }
addEventListener('pointerdown',()=>{ if(sndOn())sndInit(); if(SND.ctx&&SND.ctx.state==='suspended')SND.ctx.resume(); },{passive:true});
const ICO_SND=on=>`<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/>${on?'<path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>':'<path d="m16 9 5 6M21 9l-5 6"/>'}</svg>`;

/* ---------- 카드 중계: 중계 기록을 필드 위 카드로 재생 ---------- */
const CFP={C:[50,97],'1B':[74,66],'2B':[62,50],SS:[38,50],'3B':[26,66],LF:[18,31],CF:[50,17],RF:[82,31],P:[50,72]};
const CBS=[[68,73],[50,56],[32,73]], CHM=[50,89], CBAT=[40,89], CBATL=[60,89], CDUG={h:[97,80],a:[3,80]};
/* 타석 위치: 우타자는 홈 왼쪽(3루 쪽), 좌타자는 오른쪽(1루 쪽). 양타는 투수 반대 손 */
function bSide(b,p){ if(!b)return 'R'; if(b.bt==='좌')return 'L'; if(b.bt==='양')return p&&p.th==='좌'?'R':'L'; return 'R'; }
const CPATH=[CHM,CBS[0],CBS[1],CBS[2],CHM];
let CT={tok:0,run:false};
const cSpd=()=>(UI.cast&&UI.cast.spd)||1;
addEventListener('unhandledrejection',e=>{ if(e.reason==='stop')e.preventDefault(); }); /* 중계를 닫거나 건너뛸 때 멈춘 연출 대기는 오류가 아니다 */
function cSleep(ms){ const t=CT.tok; return new Promise((res,rej)=>setTimeout(()=>t===CT.tok?res():rej('stop'),ms/cSpd())); }
function cHalfTxt(h){ return `${Math.floor(h/2)+1}회${h%2?'말':'초'}`; }
function cPit(g,k){ const L=g.pbp; const par=L[Math.min(k,L.length-1)][0]%2;
  for(let i=Math.min(k,L.length)-1;i>=0;i--){ const y=L[i]; if(y[0]%2!==par)continue; if(y[1]==='PC'||typeof y[1]==='number')return y[2]; }
  for(let i=k;i<L.length;i++){ const y=L[i]; if(y[0]%2===par&&typeof y[1]==='number')return y[2]; } return null; }
function cBefore(g,k){ const L=g.pbp; if(k<=0)return {sa:0,sh:0,outs:0,bases:[0,0,0],half:L[0][0]};
  const s=pbpState(g,Math.min(k,L.length)-1); if(k<L.length&&L[k][0]!==s.half)return {sa:s.sa,sh:s.sh,outs:0,bases:[0,0,0],half:L[k][0]}; return s; }
function cFielders(g,half){ const b=g.box[half%2===0?'h':'a'].bat; const seen={}; const out=[];
  for(const x of b){ if(!CFP[x.pos]||x.pos==='P'||seen[x.pos])continue; seen[x.pos]=1; out.push({pos:x.pos,id:x.id}); } return out; }
function cTeamCol(tid){ const t=G.teams[tid]; return t?tpal(t)[3]:'#888'; }
/* 카드 배치: 키가 같은 카드는 이동, 없어진 카드는 사라지고 새 카드는 나타남 */
function cPlace(el,pt,ms){ el.style.transition=ms?`left ${ms/cSpd()}ms linear, top ${ms/cSpd()}ms linear, opacity .25s`:'none'; el.style.left=pt[0]+'%'; el.style.top=pt[1]+'%'; }
function cSync(T,ms){ const st=document.getElementById('cs-stage'); if(!st)return; st.querySelectorAll('.cc.gone').forEach(el=>el.remove()); const have={}; st.querySelectorAll('.cc').forEach(el=>have[el.dataset.k]=el);
  const keep={}; for(const t of T){ keep[t.k]=1; let el=have[t.k]; if(!el){ el=cCard(t.k,t.id,t.cls,t.lab,t.col,t); cPlace(el,t.from||t.pt,0); st.appendChild(el); if(t.from){ el.getBoundingClientRect(); cPlace(el,t.pt,ms||400); } }
    else { el.className='cc '+t.cls; cPlace(el,t.pt,ms); const kr=el.querySelector('.kr'); if(kr&&t.u){ const sig=JSON.stringify(t.u); if(kr.dataset.s!==sig){ kr.dataset.s=sig; kr.innerHTML=kPlayer({...t.u,v:el.dataset.v%5,rot:0}); } kr.style.transform=`rotate(${t.rot||0}deg)`; } const em=el.querySelector('em.cc-h'); if(em){ if(/[좌우][타투]/.test(t.lab||'')){ em.textContent=t.lab; em.className='cc-h '+(/좌/.test(t.lab)?'l':'r'); } else em.remove(); } } }
  for(const k in have)if(!keep[k])have[k].classList.add('gone'); }
function castSheet(){ const c=UI.cast; const g=G.games[c.g]; if(!g)return '';
  const stripes=[...Array(9)].map((_,i)=>`<path d="M50 89 L${-40+i*20} -20 L${-30+i*20} -20 Z" class="st"/>`).join('');
  const hc=cTeamCol(g.home), ac=cTeamCol(g.away); const day=[0,6].includes(dobj(g.day).w);
  const crowd=(()=>{ const r=mulberry(g.day*31+g.home); let o=''; for(let i=0;i<420;i++){ const a=Math.PI*(1.0+r()*1.0), rr=50+r()*30; const x=50+Math.cos(a)*rr*1.05, y=89+Math.sin(a)*rr*1.12; if(y>44&&(x>14&&x<86))continue; if(y>58)continue; const v=r(); const col=v<.3?hc:v<.4?ac:v<.6?'#c9d1d8':v<.8?'#6b7680':'#3b444d'; o+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(.3+r()*.2).toFixed(2)}" fill="${col}" opacity="${(.5+r()*.45).toFixed(2)}"/>`; } return o; })();
  const tower=(x,y)=>`<g class="tw"><circle cx="${x}" cy="${y}" r="9" class="glow"/><rect x="${x-.4}" y="${y}" width=".8" height="13" class="pole"/><rect x="${x-3}" y="${y-1.6}" width="6" height="2.6" rx=".4" class="lamp"/></g>`;
  const fieldBg=`<svg class="cs-bg${day?' day':''}" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
    <defs><clipPath id="cs-fair"><path d="M50 92 L1 43 Q50 -16 99 43 Z"/></clipPath>
      <linearGradient id="cs-sky" x1="0" y1="0" x2="0" y2="1">${day?'<stop offset="0" stop-color="#5d8fc0"/><stop offset=".45" stop-color="#9cc1e0"/><stop offset="1" stop-color="#1c3a26"/>':'<stop offset="0" stop-color="#03060a"/><stop offset=".45" stop-color="#0b1622"/><stop offset="1" stop-color="#0d1a12"/>'}</linearGradient>
      <radialGradient id="cs-glw"><stop offset="0" stop-color="#fff7d6" stop-opacity=".55"/><stop offset="1" stop-color="#fff7d6" stop-opacity="0"/></radialGradient></defs>
    <rect width="100" height="100" fill="url(#cs-sky)"/>
    <path d="M-6 58 L-6 30 Q50 -38 106 30 L106 58 L99 43 Q50 -16 1 43 Z" class="stand"/>${crowd}
    <rect x="38" y="1.2" width="24" height="8" rx=".8" class="sb"/><rect x="39.2" y="2.4" width="21.6" height="5.6" class="sbi"/><text x="50" y="6.6" class="sbt">${esc(tshort(g.away))} : ${esc(tshort(g.home))}</text>
    ${day?'':tower(6,10)+tower(94,10)+tower(24,-2)+tower(76,-2)}
    <path d="M50 100 L-5 45 L-5 100 Z M50 100 L105 45 L105 100 Z" class="foul"/><path d="M50 92 L1 43 Q50 -16 99 43 Z" class="g1"/>
    <g clip-path="url(#cs-fair)">${stripes}<path d="M1 43 Q50 -16 99 43" class="trk"/></g>
    <path d="M1 43 Q50 -16 99 43" class="wall"/>
    <path d="M24 74 Q50 32 76 74 L50 95 Z" class="dirt"/><path d="M50 86 L65 73 L50 59 L35 73 Z" class="g3"/>
    <circle cx="50" cy="72" r="2.8" class="dirt"/><circle cx="50" cy="89" r="4.2" class="dirt"/>
    <path d="M50 89 L2 41 M50 89 L98 41" class="line"/>
    <rect x="10" y="81" width="18" height="1.6" rx=".5" fill="${ac}" opacity=".25"/><rect x="72" y="81" width="18" height="1.6" rx=".5" fill="${hc}" opacity=".25"/>
    <path d="M50 89 L68 73 L50 56 L32 73 Z" class="path"/><rect x="48.6" y="71.6" width="2.8" height=".8" fill="#f4f6f8"/>
    <rect x="38" y="86.2" width="4.4" height="5.8" class="box"/><rect x="57.6" y="86.2" width="4.4" height="5.8" class="box"/><circle cx="31" cy="93" r="1.5" class="odc"/><circle cx="69" cy="93" r="1.5" class="odc"/>
    <line x1="1.5" y1="43.5" x2="1.5" y2="36" class="pole2"/><line x1="98.5" y1="43.5" x2="98.5" y2="36" class="pole2"/>
    ${CBS.map((b,i)=>`<rect id="cs-b${i}" x="${b[0]-1.7}" y="${b[1]-1.7}" width="3.4" height="3.4" transform="rotate(45 ${b[0]} ${b[1]})" class="base"/>`).join('')}<path d="M48.4 88 h3.2 v1.4 l-1.6 1.5 l-1.6 -1.5z" class="base"/></svg>`;
  const sp=c.spd||1, md=c.mode||'all';
  return `<div class="cast" data-g="${c.g}" role="dialog" aria-label="카드 중계">
  <div class="cs-top">
    <div class="cs-board"><span class="cs-tm">${badge(g.away,24)}<i>${esc(tshort(g.away))}</i><b id="cs-sa">0</b></span><span class="cs-mid"><b id="cs-inn">1회초</b><span class="cs-cnt"><span id="cs-O"><i></i><i></i></span><em id="cs-on">0아웃</em></span></span><span class="cs-tm r"><b id="cs-sh">0</b><i>${esc(tshort(g.home))}</i>${badge(g.home,24)}</span></div>
    <div class="cs-wpw"><div class="cs-wp"><span class="wa" style="background:${ac}"></span><i id="cs-wpa" style="background:${hc}"></i><span class="cs-wpt" id="cs-wpt"></span></div></div>
    <button class="x" style="margin-left:auto" data-a="castClose" aria-label="중계 닫기">×</button></div>
  <div class="cs-body"><div class="cs-stage" id="cs-stage">${fieldBg}<svg class="cs-trail" id="cs-trail" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"></svg><div class="cs-ball" id="cs-ball"></div><div class="cs-sit" id="cs-sit"></div><div class="cs-cap" id="cs-cap"></div><div class="cs-fx" id="cs-fx"></div><div class="cs-flash" id="cs-flash"></div><div class="cs-bn" id="cs-bn"></div></div>
    <div class="cs-side"><div class="cs-vs" id="cs-vs"></div><div class="cs-log" id="cs-log"></div></div></div>
  <div class="cs-ctl"><div class="cs-mode">${[['all','전체'],['hl','하이라이트'],['risp','득점권']].map(([k,l])=>`<button data-a="castMode" data-v="${k}" class="${md===k?'on':''}">${l}</button>`).join('')}</div>
    <div class="cs-btns"><button data-a="castStep" data-v="-1" aria-label="이전 타석">◀</button><button class="pri" id="cs-play" data-a="castPlay">${c.play?'일시정지':'재생'}</button><button data-a="castStep" data-v="1" aria-label="다음 타석">▶</button><button data-a="castInn">다음 회</button><button data-a="castSpd" id="cs-spd">${sp}배</button><button data-a="castEnd">끝</button></div></div>
  </div>`; }
/* 필드 카드: 얼굴 + 이름 + 능력치 하나 */
function cCard(key,id,cls,lab,col,t){ const p=G.players[id]; const el=document.createElement('button'); el.className='cc '+cls; el.dataset.k=key; el.dataset.a='castPlayer'; el.dataset.v=id; el.style.setProperty('--tc',col);
  const ov=p&&/bat|pit/.test(cls)?scoutReport(p).cur:null; const u=(t&&t.u)||{S:col,D:'#0008'};
  el.innerHTML=`<span class="cc-f"><svg class="kp" viewBox="-24 -24 48 48" aria-hidden="true"><ellipse cx="1.5" cy="2.5" rx="15" ry="13" fill="#0004"/><g class="kr" data-s='${JSON.stringify(u)}' style="transform:rotate(${(t&&t.rot)||0}deg)">${kPlayer({...u,v:id%5,rot:0})}</g></svg>${ov!=null?`<b class="cc-o" style="--c:${rcol(ov)}">${ov}</b>`:''}</span><span class="cc-n">${esc(p?fname(p):'?')}</span>${/bat|pit/.test(cls)&&/[좌우][타투]/.test(lab||'')?`<em class="cc-h ${/좌/.test(lab)?'l':'r'}">${esc(lab)}</em>`:''}`; return el; }
/* 오늘 기록 */
function cToday(g,k,id,isP){ const L=g.pbp; let pa=0,ab=0,h=0,hr=0,rbi=0,bb=0,so=0,outs=0,r=0,half=-1,o0=0;
  for(let i=0;i<k&&i<L.length;i++){ const x=L[i]; if(x[0]!==half){ half=x[0]; o0=0; }
    if(x[1]==='SB'||x[1]==='CS'){ o0=x[3]; continue; } if(typeof x[1]!=='number')continue;
    if(isP&&x[2]===id){ outs+=Math.max(0,x[4]-o0); r+=x[6]; if(x[3]==='K')so++; if(x[3]==='BB')bb++; if(['1B','2B','3B','HR'].includes(x[3]))h++; }
    if(!isP&&x[1]===id){ pa++; if(x[3]!=='BB')ab++; if(['1B','2B','3B','HR'].includes(x[3]))h++; if(x[3]==='HR')hr++; rbi+=x[6]; }
    o0=x[4]; }
  if(isP)return outs||r||h?`${Math.floor(outs/3)}${outs%3?'.'+outs%3:''}이닝 ${r}실점 ${so}K`:'오늘 첫 등판';
  return pa?`${ab}타수 ${h}안타${hr?` ${hr}홈런`:''}${rbi?` ${rbi}타점`:''}`:'오늘 첫 타석'; }
function cMan(g,k,id,isP){ const p=G.players[id]; if(!p)return ''; const ov=scoutReport(p).cur;
  const sea=isP?`ERA ${eraAt(g,k,id)}`:(()=>{ const r=batAt(g,k,id); if(!r)return '시즌 기록 없음'; return `${fmt3(r.avg)} · ${r.hr}홈런 · OPS ${fmt3(r.ops)}`; })();
  return `<button class="cs-p" data-a="castPlayer" data-v="${id}">${avImg(p)}<span class="cs-pm"><span class="cs-pr"><i>${isP?'투수':'타자'}</i><b>${esc(p.name)}</b>${rchip(ov)}</span><span class="cs-ps">${sea}</span><span class="cs-pd">오늘 ${cToday(g,k,id,isP)}</span></span></button>`; }
function cSide(g,k){ const L=g.pbp; const v=document.getElementById('cs-vs'), lg=document.getElementById('cs-log'); if(!v)return; { const bd=document.querySelector('.cs-body'); if(bd)bd.classList.toggle('fin',k>=L.length); }
  const x=L[Math.min(k,L.length-1)]; const bid=k<L.length&&typeof x[1]==='number'?x[1]:null; const pid=cPit(g,Math.min(k,L.length-1));
  v.innerHTML=k>=L.length?(()=>{ const m=gameMvp(g); return `<div class="cs-fin"><div><b>경기 종료 · ${tshort(g.away)} ${g.as} : ${g.hs} ${tshort(g.home)}</b>${m?`<button class="mvp" data-a="castPlayer" data-v="${m.p.id}">${avImg(m.p)}<span><em>오늘의 선수</em><b>${esc(m.p.name)}</b><i>${m.p.isP?cToday(g,L.length,m.p.id,true):cToday(g,L.length,m.p.id,false)} · 승리 기여 +${Math.round(m.v*100)}%</i></span></button>`:''}</div><button class="btn small" data-a="castBox">박스스코어</button></div>${gmMemo(g)}`; })():ourStrip(g,k)+(bid?abPanel(g,k):(pid?cMan(g,k,pid,true):''));
  lg.innerHTML=L.slice(Math.max(0,k-8),k).reverse().map((y,i)=>`<p class="${i===0?'cur':''}${y[6]?' run':''}"><span>${cHalfTxt(y[0])}</span>${esc(pbpText(y))}</p>`).join('')||'<p class="muted">플레이볼</p>'; }
function cSit(st,x){ const el=document.getElementById('cs-sit'); if(!el)return; const risp=!!(st.bases[1]||st.bases[2]); const late=st.half>=16&&Math.abs(st.sa-st.sh)<=2;
  const t=risp&&st.bases[0]&&st.bases[1]&&st.bases[2]?'만루 찬스':risp?'득점권 찬스':late?'승부처':''; el.textContent=t; el.className='cs-sit'+(t&&x&&typeof x[1]==='number'?' on':''); }
function cDraw(k,ms){ const c=UI.cast; const g=G.games[c.g]; const L=g.pbp; const st=k>=L.length?{...pbpState(g,L.length-1),bases:[0,0,0]}:cBefore(g,k);
  cSync(k>=L.length?[]:cTargets(g,k,st),ms); if(k>=L.length){ st.sa=g.as; st.sh=g.hs; } cBoard(g,st,null); cSide(g,k); cSit(st,L[k]); c.wp=k>=L.length?(g.hs>g.as?1:0):wpHome(st); try{ if(k>=L.length){ const bar=document.getElementById('cs-wpa'); if(bar)bar.style.width=(c.wp*100)+'%'; const tx=document.getElementById('cs-wpt'); if(tx)tx.textContent=`${tshort(g.hs>g.as?g.home:g.away)} 승리`; } else cWp(g,st,null); }catch(e){}
  cCap(''); if(k>=L.length)cFx(`경기 종료 ${g.as} : ${g.hs}`,'end',true); else cFx(''); const pb=document.getElementById('cs-play'); if(pb)pb.textContent=c.play&&k<L.length?'일시정지':'재생'; }
/* 연출 */
function cFx(t,cls,stay){ const el=document.getElementById('cs-fx'); if(!el)return; el.className='cs-fx'; void el.offsetWidth; if(!t){ el.textContent=''; return; } el.textContent=t; el.className='cs-fx on '+(cls||'')+(stay?' stay':''); el.style.animationDuration=(1.5/cSpd())+'s'; }
function cFlash(){ const el=document.getElementById('cs-flash'); if(!el)return; el.className='cs-flash'; void el.offsetWidth; el.className='cs-flash on'; }
function cBurst(pt,col,n){ const st=document.getElementById('cs-stage'); if(!st)return; for(let i=0;i<(n||22);i++){ const d=document.createElement('i'); d.className='cs-pt'; const a=Math.random()*Math.PI*2, r=8+Math.random()*18;
  d.style.left=pt[0]+'%'; d.style.top=pt[1]+'%'; d.style.setProperty('--dx',(Math.cos(a)*r)+'cqw'); d.style.setProperty('--dy',(Math.sin(a)*r)+'cqw'); d.style.background=i%3?col:'#ffd24d'; d.style.animationDuration=(0.9+Math.random()*.5)/cSpd()+'s'; st.appendChild(d); setTimeout(()=>d.remove(),1600/cSpd()); } }
function cScorePop(side){ const el=document.getElementById(side==='h'?'cs-sh':'cs-sa'); if(!el)return; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
function cTrail(from,to,arc,ms,cls){ const sv=document.getElementById('cs-trail'); if(!sv)return; const cx=(from[0]+to[0])/2, cy=(from[1]+to[1])/2-(arc?cDist(from,to)*.28:0);
  const p=document.createElementNS('http://www.w3.org/2000/svg','path'); p.setAttribute('d',`M${from[0]} ${from[1]} Q${cx} ${cy} ${to[0]} ${to[1]}`); p.setAttribute('class','tr '+(cls||'')); sv.appendChild(p);
  const len=p.getTotalLength?p.getTotalLength():60; p.style.strokeDasharray=len; p.style.strokeDashoffset=len;
  p.animate([{strokeDashoffset:len},{strokeDashoffset:0}],{duration:ms/cSpd(),fill:'forwards'}); setTimeout(()=>{ p.style.transition='opacity .6s'; p.style.opacity=0; setTimeout(()=>p.remove(),700); },(ms+700)/cSpd()); }
function cTrailClear(){ const sv=document.getElementById('cs-trail'); if(sv)sv.innerHTML=''; }
async function cBanner(g,half){ const el=document.getElementById('cs-bn'); if(!el)return; const at=half%2?g.home:g.away;
  el.innerHTML=`<div>${badge(at,40)}<b>${cHalfTxt(half)}</b><span>${esc(tname(at))} 공격</span></div>`; el.className='cs-bn on'; sfx('bong',.55); await cSleep(850); el.className='cs-bn'; await cSleep(150); }
/* 볼 수 있는 장면 고르기 */
async function cVsx(g,k,x){ const el=document.getElementById('cs-bn'); if(!el)return; const b=G.players[x[1]], p=G.players[x[2]]; if(!b||!p)return;
  const one=(q,isP,cls)=>`<div class="vx ${cls}">${avImg(q,true)}<b>${esc(q.name)}</b>${rchip(scoutReport(q).cur)}<span>${isP?`ERA ${eraAt(g,k,q.id)}`:avgOpsAt(g,k,q.id)}</span><i>오늘 ${cToday(g,k,q.id,isP)}</i></div>`;
  el.innerHTML=`<div class="vxw">${one(b,false,'l')}<em>VS</em>${one(p,true,'r')}</div>`; el.className='cs-bn vs on'; await cSleep(1300); el.className='cs-bn vs'; await cSleep(150); }
function cKeep(g,k,mode){ if(mode==='all')return true; const L=g.pbp; const x=L[k]; if(typeof x[1]!=='number')return false; const b=cBefore(g,k); const risp=!!(b.bases[1]||b.bases[2]);
  if(mode==='risp')return risp; return x[6]>0||['HR','3B','2B','DP'].includes(x[3])||(x[3]==='K'&&risp)||k===L.length-1||(x[4]>=3&&b.half>=16&&Math.abs(x[7]-x[8])<=1); }
function cTargets(g,k,st){ const L=g.pbp; const half=st.half; const top=half%2===0; const dT=top?g.home:g.away, oT=top?g.away:g.home;
  const dc=cTeamCol(dT), oc=cTeamCol(oT); const T=[]; const dU=cUni(g,dT), oU=cUni(g,oT);
  const gl=id=>{ const q=G.players[id]; return q&&q.th==='좌'?'R':'L'; };
  for(const f of cFielders(g,half))T.push({k:'d'+f.id,id:f.id,pt:CFP[f.pos],cls:'df'+(f.pos==='C'?' ctch':''),lab:POSS[f.pos],col:dc,u:{...dU,glove:gl(f.id)},rot:f.pos==='C'?-90:cAng(CFP[f.pos],CHM)});
  const pid=cPit(g,k); const pp=pid&&G.players[pid]; if(pid)T.push({k:'d'+pid,id:pid,pt:CFP.P,cls:'df pit'+(pp&&pp.th==='좌'?' lhp':''),lab:pp&&pp.th==='좌'?'좌투':'우투',col:dc,u:{...dU,glove:gl(pid),pose:'set'},rot:90});
  st.bases.forEach((id,i)=>{ if(id)T.push({k:'o'+id,id,pt:CBS[i],cls:'of run',lab:['1루','2루','3루'][i],col:oc,u:{...oU,helm:oU.H},rot:cAng(CBS[i],CPATH[i+2])}); });
  const x=L[k]; if(x&&typeof x[1]==='number'&&x[0]===half){ const bp=G.players[x[1]]; const side=bSide(bp,pp); T.push({k:'o'+x[1],id:x[1],pt:side==='L'?CBATL:CBAT,cls:'of bat '+(side==='L'?'lhb':'rhb'),lab:side==='L'?'좌타':'우타',col:oc,u:{...oU,helm:oU.H,bat:side},rot:side==='L'?180:0}); }
  return T; }
/* 유니폼: 홈 팀은 흰 바탕에 팀 색 테두리, 원정 팀은 팀 색 바탕. 두 팀 색이 비슷해도 구분된다 */
function cLum(h){ const n=parseInt(h.slice(1),16); return (.2126*(n>>16&255)+.7152*(n>>8&255)+.0722*(n&255))/255; }
function cUni(g,tid){ const P=tpal(G.teams[tid]); if(tid===g.home)return {S:'#f2f4f6',D:P[0],H:P[0]}; const S=cLum(P[0])<.12?P[3]:P[0]; return {S,D:P[2],H:P[2]}; }
function cAng(a,b){ return Math.round(Math.atan2((b[1]-a[1]),(b[0]-a[0]))*180/Math.PI); }
function cBoard(g,st,cnt){ const s=id=>document.getElementById(id); if(!s('cs-sa'))return;
  s('cs-sa').textContent=st.sa; s('cs-sh').textContent=st.sh; s('cs-inn').textContent=cHalfTxt(st.half);
  const dots=(id,n)=>s(id).querySelectorAll('i').forEach((el,i)=>el.classList.toggle('on',i<n));
  dots('cs-O',Math.min(2,st.outs)); s('cs-on').textContent=Math.min(3,st.outs)+'아웃';
  CBS.forEach((b,i)=>{ const el=s('cs-b'+i); if(el)el.classList.toggle('on',!!st.bases[i]); }); }
function cCap(t,cls){ const el=document.getElementById('cs-cap'); if(!el)return; el.className='cs-cap'+(t?' on':'')+(cls?' '+cls:''); el.textContent=t||''; }
/* 공 */
function cBall(from,to,ms,arc){ const b=document.getElementById('cs-ball'); if(!b)return Promise.resolve(); const d=ms/cSpd();
  const mid=[(from[0]+to[0])/2,(from[1]+to[1])/2];
  const kf=[{left:from[0]+'%',top:from[1]+'%',transform:'translate(-50%,-50%) scale(1)',opacity:1},{left:mid[0]+'%',top:mid[1]+'%',transform:`translate(-50%,-50%) scale(${arc?2.1:1})`,opacity:1,offset:.5},{left:to[0]+'%',top:to[1]+'%',transform:'translate(-50%,-50%) scale(1)',opacity:1}];
  const an=b.animate(kf,{duration:d,easing:'linear',fill:'forwards'}); return new Promise(r=>{ an.onfinish=r; an.oncancel=r; }); }
function cBallHide(){ const b=document.getElementById('cs-ball'); if(b)b.getAnimations().forEach(a=>a.cancel()); }
const cPolar=(th,d)=>[50+d*Math.sin(th*Math.PI/180),89-d*Math.cos(th*Math.PI/180)];
const cDist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
async function cRunner(el,from,to,msPer){ if(!el)return; for(let i=from+1;i<=to;i++){ cPlace(el,CPATH[i],msPer); await cSleep(msPer); } }
async function cAnim(k){ const c=UI.cast; const g=G.games[c.g]; const L=g.pbp; const x=L[k]; const b=cBefore(g,k); const st=document.getElementById('cs-stage'); if(!st)return;
  const card=key=>st.querySelector(`.cc[data-k="${key}"]`);
  if(x[1]==='PC'){ const top=x[0]%2===0; const dug=CDUG[top?'h':'a']; const old=cPit(g,k); const oc=old&&card('d'+old);
    cCap(`투수 교체 · ${(G.players[x[2]]||{}).name||''}`); if(oc){ cPlace(oc,dug,700); oc.classList.add('gone'); }
    const ne=cCard('d'+x[2],x[2],'df','투',cTeamCol(top?g.home:g.away)); cPlace(ne,dug,0); st.appendChild(ne); ne.getBoundingClientRect(); cPlace(ne,CFP.P,900); await cSleep(1100); if(oc)oc.remove(); cCap(''); return; }
  if(x[1]==='SB'||x[1]==='CS'){ const i=b.bases.indexOf(x[2]); const el=card('o'+x[2]); cCap(x[1]==='SB'?'도루 시도':'도루 시도');
    const to=Math.min(3,i+1); cBall(CFP.P,CHM,300); await cSleep(300); cBall(CHM,CPATH[to],450); if(el)cPlace(el,CPATH[to],500); await cSleep(550);
    if(x[1]==='CS'&&el){ el.classList.add('gone'); cCap('도루 실패 · 아웃','bad'); } else cCap('도루 성공','good');
    cBoard(g,{...b,outs:x[3],bases:x[4]},null); await cSleep(700); cCap(''); cBallHide(); return; }
  /* 타석 */
  const o=x[3], rnd=mulberry((g.day*977+k*131+(g.home*7+g.away))|0); const bid=x[1]; const bat=card('o'+bid);
  const homeBat=x[0]%2===1; if(homeBat&&(b.bases[1]||b.bases[2]))sndLoop('chant','chant',.45,.5);
  if(c.mode&&c.mode!=='all')await cSleep(250);
  await cBall(CFP.P,[50,88],300,false); cBallHide();
  cCap('');
  const after=x[5], runs=x[6], outsA=x[4];
  const fieldCards=[...st.querySelectorAll('.cc.df')].filter(el=>!el.classList.contains('gone'));
  const posOf=el=>[parseFloat(el.style.left),parseFloat(el.style.top)];
  const nearest=pt=>{ let best=null,bd=1e9; for(const el of fieldCards){ const d=cDist(posOf(el),pt); if(d<bd){bd=d;best=el;} } return best; };
  /* 주자 이동 계산 */
  const isHR=o==='HR'; const batSafe=after.includes(bid)||isHR;
  const runners=b.bases.map((id,i)=>id?{id,i}:null).filter(Boolean).sort((p,q)=>q.i-p.i);
  let scoreLeft=runs-(isHR?1:0); const moves=[];
  for(const r of runners){ const j=after.indexOf(r.id); if(j>=0&&j!==r.i)moves.push({id:r.id,from:r.i,to:j}); else if(j<0){ if(scoreLeft>0){ scoreLeft--; moves.push({id:r.id,from:r.i,to:3,score:1}); } else moves.push({id:r.id,from:r.i,to:Math.min(3,r.i+1),out:1}); } }
  const bTo=isHR?4:after.indexOf(bid);
  // m.from은 베이스 번호(0=1루) → 경로 번호는 +1
  moves.forEach(m=>{ m.from=m.from+1; if(!m.out)m.to=m.score?4:m.to+1; else m.to=m.to+1; });
  const runAll2=async(per)=>Promise.all(moves.map(async m=>{ const el=card('o'+m.id); if(!el)return; for(let i=m.from+1;i<=Math.min(4,m.to);i++){ cPlace(el,CPATH[i],per); await cSleep(per); } if(m.out||m.score)el.classList.add('gone'); }));
  let cap='', cls='';
  const oc=cTeamCol(x[0]%2?g.home:g.away);
  cAbRes((PAK[o]||['',''])[0],(PAK[o]||['',''])[1]);
  if(o==='K'){ sfx('mitt',.9); cFx('삼진','k'); if(bat)bat.classList.add('gone'); await cSleep(900); }
  else if(o==='BB'){ cFx('볼넷','bb'); const pr=[]; if(bat){ cPlace(bat,CBS[0],700); pr.push(cSleep(700)); } pr.push(runAll2(600)); await Promise.all(pr); }
  else {
    let spot, arc=false, flight=650, kind='';
    if(o==='HR'){ const th=-38+rnd()*76; spot=cPolar(th,96); arc=true; flight=1100; kind='홈런'; }
    else if(o==='3B'){ const th=(rnd()<.5?-1:1)*(26+rnd()*14); spot=cPolar(th,70+rnd()*6); arc=true; flight=900; kind='3루타'; }
    else if(o==='2B'){ const th=(rnd()<.5?-1:1)*(10+rnd()*28); spot=cPolar(th,60+rnd()*12); arc=rnd()<.6; flight=800; kind='2루타'; }
    else if(o==='1B'){ if(rnd()<.6){ const th=-36+rnd()*72; spot=cPolar(th,44+rnd()*10); arc=rnd()<.5; } else { const th=[-28,-9,9,28][Math.floor(rnd()*4)]+rnd()*6-3; spot=cPolar(th,46); } flight=650; kind='안타'; }
    else { // 범타·병살
      const r=rnd(); const pool=o==='DP'?['SS','2B','3B','SS','2B']:r<.45?['SS','2B','3B','1B','SS','2B','P']:r<.85?['LF','CF','RF','CF']:['SS','2B','3B','1B'];
      const pos=pool[Math.floor(rnd()*pool.length)]; const base=CFP[pos]; spot=[base[0]+rnd()*8-4,base[1]+rnd()*6-3]; arc=['LF','CF','RF'].includes(pos)||(r>=.85&&rnd()<.5); flight=arc?950:520; kind=arc?(['LF','CF','RF'].includes(pos)?'뜬공 아웃':'직선타 아웃'):(o==='DP'?'병살타':'땅볼 아웃'); }
    const fl=nearest(spot); const flFrom=fl?posOf(fl):null; const outPlay=o==='OUT'||o==='DP';
    const chaseTo=fl?(outPlay?spot:[flFrom[0]+(spot[0]-flFrom[0])*.8,flFrom[1]+(spot[1]-flFrom[1])*.8]):null;
    if(fl&&o!=='HR')cPlace(fl,chaseTo,flight*.95);
    sfx('crack',1,.94+rnd()*.12); cTrail([50,88],spot,arc,flight,o==='HR'?'hr':outPlay?'out':'hit'); const pr=[cBall([50,88],spot,flight,arc)];
    if(bat&&bTo>=1){ pr.push((async()=>{ for(let i=1;i<=Math.min(4,bTo);i++){ cPlace(bat,CPATH[i],o==='HR'?520:560); await cSleep(o==='HR'?520:560); } if(bTo>=4)bat.classList.add('gone'); })()); }
    else if(bat){ pr.push((async()=>{ cPlace(bat,[(CHM[0]+CBS[0][0])/2,(CHM[1]+CBS[0][1])/2],600); await cSleep(600); })()); }
    pr.push(runAll2(o==='HR'?520:560));
    await Promise.all([pr[0]]);
    if(outPlay)sfx('mitt',.55); else if(o!=='HR')sfx('cheer_hit',homeBat?.85:.3);
    if(o==='HR'){ sfx('cheer_big',homeBat?1:.45); if(homeBat)setTimeout(()=>organ(ORG_CHARGE,.2),600/cSpd()); buzz(90); cFlash(); cBurst(spot,oc,28); cFx(runs===4?'만루 홈런':runs>1?`${runs}점 홈런`:'홈런','hr'); }
    else if(o==='DP')cFx('병살','bad'); else if(['2B','3B'].includes(o))cFx(kind,'xb');
    if(outPlay){ if(o==='DP'){ await cBall(spot,CBS[1],380,false); await cBall(CBS[1],CBS[0],380,false); } else if(!arc){ await cBall(spot,CBS[0],420,false); } if(!batSafe&&bat)bat.classList.add('gone'); }
    else if(o!=='HR'&&fl){ await cSleep(150); await cBall(spot,CBS[1],480,false); }
    await Promise.all(pr.slice(1));
    if(o!=='HR'&&o!=='DP'&&!['2B','3B'].includes(o))cFx(runs?`${kind} +${runs}`:kind,runs?'run':outPlay?'out':'hit'); else if(runs&&o!=='HR')cCap(`+${runs}점`,'good'); }
  cBallHide();
  const st2={sa:x[7],sh:x[8],outs:outsA,bases:outsA>=3?[0,0,0]:after,half:x[0]};
  sndStop('chant',.9); if(runs){ cScorePop(x[0]%2?'h':'a'); cBurst(CHM,oc,12); if(o==='OUT'||o==='BB')sfx('cheer_hit',homeBat?.6:.25); }
  cBoard(g,st2,null); { const prev=c.wp; const s3=outsA>=3?{...st2,half:x[0]+1,outs:0,bases:[0,0,0]}:st2; const w=k===L.length-1?(g.hs>g.as?1:0):wpHome(s3); c.wp=cWp(g,s3,prev)??w; if(prev!=null&&Math.abs(w-prev)>=.18&&k<L.length-1){ cCap(`승부를 흔든 한 방 · 승리 확률 ${Math.round(Math.abs(w-prev)*100)}%p 이동`,'good'); } }
  await cSleep(runs?1300:850); cCap(''); }
async function castLoop(){ if(CT.run)return; CT.run=true; const my=CT.tok;
  if(UI.cast&&UI.cast.play)sndLoop('amb','amb',.4,1.2);
  try{ while(UI.cast&&UI.cast.play&&my===CT.tok){ const c=UI.cast; const g=G.games[c.g]; const L=g.pbp; if(c.k>=L.length){ c.play=false; cDraw(c.k,300); sndStop('amb',1.8); sndStop('chant',.5); siren(); if(g.hs>g.as)sfx('cheer_big',.8); if(g.res==='승'){ setTimeout(()=>organ(ORG_WIN,.18),900); } break; }
      const x=L[c.k]; const md=c.mode||'all'; if(md!=='all'&&!cKeep(g,c.k,md)){ c.k++; continue; }
      cDraw(c.k,md==='all'?300:0); await cSleep(md==='all'?260:200);
      if(c.lastHalf!==x[0]){ c.lastHalf=x[0]; await cBanner(g,x[0]); }
      await cAnim(c.k); c.k++; } }
  catch(e){} finally{ if(my===CT.tok)CT.run=false; } }
function castMount(){ const c=UI.cast; if(!c)return; CT.tok++; CT.run=false; requestAnimationFrame(()=>{ cDraw(c.k,0); if(c.play)castLoop(); }); }
function castJump(k,play){ const c=UI.cast; const L=G.games[c.g].pbp; c.k=clamp(k,0,L.length); c.lastHalf=null; CT.tok++; CT.run=false; cBallHide(); cTrailClear(); cDraw(c.k,250); if(play!=null)c.play=play; if(c.play&&c.k<L.length)castLoop(); else { sndStop('amb'); sndStop('chant'); const pb=document.getElementById('cs-play'); if(pb)pb.textContent='재생'; } }

/* ---------- B: 중계 ---------- */
const OUTK={'1B':'안타','2B':'2루타','3B':'3루타',HR:'홈런',BB:'볼넷',K:'삼진',OUT:'범타',DP:'병살타'};
const PBPOS={C:[50,93],'1B':[71,63],'2B':[61,47],SS:[39,47],'3B':[29,63],LF:[17,27],CF:[50,13],RF:[83,27],P:[50,67]};
function pbpState(g,k){ // k번째 기록까지 반영한 상태
  const L=g.pbp; let sa=0,sh=0,outs=0,bases=[0,0,0],cur={h:null,a:null}; let half=0;
  for(let i=0;i<=k&&i<L.length;i++){ const x=L[i]; if(x[0]!==half){ half=x[0]; outs=0; bases=[0,0,0]; }
    if(x[1]==='PC'){ cur[x[0]%2?'a':'h']=x[2]; continue; }
    if(x[1]==='SB'||x[1]==='CS'){ outs=x[3]; bases=x[4]; continue; }
    outs=x[4]; bases=x[5]; sa=x[7]; sh=x[8]; cur[x[0]%2?'a':'h']=x[2]; }
  if(outs>=3)bases=[0,0,0];
  return {sa,sh,outs,bases,half,cur}; }
function pbpText(x){ const nm=id=>{ const p=G.players[id]; return p?p.name:'?'; };
  if(x[1]==='PC')return `투수 교체: ${nm(x[2])}`;
  if(x[1]==='SB')return `${nm(x[2])} 도루 성공`; if(x[1]==='CS')return `${nm(x[2])} 도루 실패`;
  return `${nm(x[1])} ${OUTK[x[3]]||x[3]}${x[6]?` · ${x[6]}점`:''}`; }
function pbpView(gi){
  const g=G.games[gi]; if(!g||!g.pbp||!g.pbp.length)return '<p class="small muted">이 경기는 중계 기록이 없습니다(최근 8경기만 보관).</p>';
  const L=g.pbp; let k=UI.pbp&&UI.pbp.g===gi?UI.pbp.k:0; k=clamp(k,0,L.length-1);
  const x=L[k]; const s=pbpState(g,k); const half=x[0]; const inn=Math.floor(half/2)+1, top=half%2===0;
  const defK=top?'h':'a', atK=top?'a':'h'; const def=g.box[defK];
  const pid=x[1]==='PC'?x[2]:(typeof x[1]==='number'?x[2]:s.cur[defK]);
  const fielders=def.bat.filter(b=>PBPOS[b.pos]).map(b=>({pos:b.pos,n:b.n}));
  const pn=G.players[pid]; if(pn)fielders.push({pos:'P',n:pn.name});
  const runner=i=>{ const id=s.bases[i]; const p=G.players[id]; return p?p.name:''; };
  const bpos=[[64,71],[50,57],[36,71]];
  const svg=`<svg class="pbpf" viewBox="0 0 100 100" role="img" aria-label="수비 위치와 주자">
    <path d="M50 96 L4 50 Q50 -4 96 50 Z" class="grass"/><path d="M50 88 L68 70 L50 52 L32 70 Z" class="dirt"/>
    ${bpos.map((b,i)=>`<rect x="${b[0]-3}" y="${b[1]-3}" width="6" height="6" transform="rotate(45 ${b[0]} ${b[1]})" class="base${s.bases[i]?' on':''}"/>`).join('')}<rect x="47.5" y="85.5" width="5" height="5" class="base home"/>
    ${fielders.map(f=>{ const c=PBPOS[f.pos]; return `<text x="${c[0]}" y="${c[1]}" class="fn">${esc(f.n)}</text><text x="${c[0]}" y="${c[1]+4}" class="fp">${POSS[f.pos]||'투'}</text>`; }).join('')}
    ${[0,1,2].map(i=>s.bases[i]?`<text x="${bpos[i][0]}" y="${bpos[i][1]-5}" class="rn">${esc(runner(i))}</text>`:'').join('')}
  </svg>`;
  const bat=typeof x[1]==='number'?G.players[x[1]]:null;
  const nxtInn=L.findIndex((y,i)=>i>k&&y[0]!==half);
  const recent=L.slice(Math.max(0,k-5),k+1).reverse();
  return `<div class="pbp">
    <div class="pbp-top"><span class="pill ${top?'':'acc'}">${inn}회${top?'초':'말'}</span><span class="num pbp-sc">${tshort(g.away)} ${s.sa} : ${s.sh} ${tshort(g.home)}</span><span class="outs">${[0,1,2].map(i=>`<i class="${i<s.outs?'on':''}"></i>`).join('')} ${s.outs}아웃</span></div>
    <div class="pbp-main">${svg}<div class="pbp-side">
      <div class="pbp-now ${x[6]?'run':''}"><b>${esc(pbpText(x))}</b></div>
      ${bat?`<div class="pbp-vs"><button data-a="player" data-v="${bat.id}">${avImg(bat)}<span><i>타자 · ${tshort(g[atK==='h'?'home':'away'])}</i><b>${esc(bat.name)}</b><em>${avgOpsAt(g,k,bat.id)}</em></span></button>${pn?`<button data-a="player" data-v="${pn.id}">${avImg(pn)}<span><i>투수 · ${tshort(g[defK==='h'?'home':'away'])}</i><b>${esc(pn.name)}</b><em>시즌 ERA ${eraAt(g,k,pn.id)}</em></span></button>`:''}</div>`:''}
      <div class="log">${recent.map((y,i)=>`<p class="${i===0?'cur':''}"><span class="ticker">${Math.floor(y[0]/2)+1}${y[0]%2?'말':'초'}</span> ${esc(pbpText(y))}</p>`).join('')}</div>
    </div></div>
    ${(()=>{ const sc=top?s.sa:s.sh; const prev=L.slice(0,k+1).reverse().find(y=>y[0]<half&&typeof y[7]==='number'); const before=prev?(top?prev[7]:prev[8]):0; const hh=L.slice(0,k+1).filter(y=>y[0]===half&&['1B','2B','3B','HR'].includes(y[3])).length; return lineScore(g,half,{half,r:sc-before,h:hh}); })()}
    <div class="pbp-ctl"><button class="btn" data-a="pbpGo" data-v="${gi}:0">처음</button><button class="btn" data-a="pbpGo" data-v="${gi}:${k-1}" ${k<=0?'disabled':''}>◀ 이전</button><button class="btn primary" data-a="pbpGo" data-v="${gi}:${k+1}" ${k>=L.length-1?'disabled':''}>다음 타석 ▶</button><button class="btn" data-a="pbpGo" data-v="${gi}:${nxtInn<0?L.length-1:nxtInn}" ${k>=L.length-1?'disabled':''}>다음 이닝</button><button class="btn" data-a="pbpGo" data-v="${gi}:${L.length-1}">끝</button></div>
    <p class="small muted">${k+1} / ${L.length} · 수비 위치는 선발 라인업 기준입니다.</p>
  </div>`;
}
function gameSheet(i){
  const g=G.games[i]; if(!g)return '';
  const tab=UI.gtab||'box'; const has=!!(g.pbp&&g.pbp.length);
  return `<div class="scrim" data-a="closeSheet"><div class="sheet gut" data-stop="1" role="dialog" aria-label="경기 기록">
    <div class="sheet-head"><div><div class="eyebrow">${dstr(g.day)}${g.kind?' · '+esc(g.kind):''}</div><h2 class="sec">${tname(g.away)} ${g.as} : ${g.hs} ${tname(g.home)}</h2></div><button class="x" data-a="closeSheet" aria-label="닫기">×</button></div>
    ${has?`<div class="row"><div class="seg" style="flex:1"><button data-a="gtab" data-v="pbp" class="${tab==='pbp'?'on':''}">문자 중계</button><button data-a="gtab" data-v="box" class="${tab!=='pbp'?'on':''}">박스스코어</button></div><button class="btn primary" data-a="cast" data-v="${i}">카드 중계</button></div>`:''}
    ${has&&tab==='pbp'?pbpView(i):fullBox(g,true)}
  </div></div>`;
}

/* 순위 변동 그래프 */
function rankChart(compact){
  const R=(G.sea&&G.sea.rh)||[]; if(R.length<3)return '';
  const W=600,H=compact?90:220,pl=compact?6:26,pr=compact?6:52,pt=8,pb=compact?6:20; const n=R.length;
  const x=i=>pl+(W-pl-pr)*i/(n-1), y=r=>pt+(H-pt-pb)*(r-1)/9;
  const tids=compact?[G.user]:G.teams.map(t=>t.id).sort((a,b)=>(a===G.user)-(b===G.user));
  const lines=tids.map(tid=>{ const t=team(tid); const me=tid===G.user; const d=R.map((s,i)=>`${i?'L':'M'}${x(i).toFixed(1)} ${y(s[1][tid]).toFixed(1)}`).join(' ');
    return `<path d="${d}" fill="none" stroke="${me?'var(--team-hi)':tpal(t)[3]}" stroke-width="${me?3:1.2}" stroke-opacity="${me?1:.55}" stroke-linejoin="round"/>`+(compact?'':`<text x="${W-pr+4}" y="${y(R[n-1][1][tid])+3}" class="rc-l${me?' me':''}">${esc(tshort(tid))}</text>`); }).join('');
  const months=[]; let lm=null; R.forEach((s,i)=>{ const m=dobj(s[0]).m; if(m!==lm){ lm=m; months.push([i,m]); } });
  return `<div class="rcw"><svg class="rchart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="날짜별 순위 변화">
    ${compact?'':[1,5,10].map(r=>`<text x="2" y="${y(r)+3}" class="rc-a">${r}위</text>`).join('')}
    <line x1="${pl}" x2="${W-pr}" y1="${(y(5)+y(6))/2}" y2="${(y(5)+y(6))/2}" class="rc-cut"/>
    ${compact?'':months.map(([i,m])=>`<line x1="${x(i)}" x2="${x(i)}" y1="${pt}" y2="${H-pb}" class="rc-g"/><text x="${x(i)+2}" y="${H-6}" class="rc-a">${m}월</text>`).join('')}
    ${lines}</svg></div>`;
}

/* 뉴스: 얼굴과 종류 */
const NKC={선수:'acc',경기:'',분석:'warn',트레이드:'good',FA:'good',팬:'',구단:'bad'};
function newsItem(n,full){ const nw=(n.id||0)>newsSeen(); const p=n.ref!=null?G.players[n.ref]:null;
  return `<div class="news ${n.v>=2?'pos':n.v<=-2?'neg':''}${full?'':' sm'}${p?' wf':''}"${p?` data-a="player" data-v="${p.id}" role="button" tabindex="0"`:''}>${p?avImg(p):''}<div><span class="small muted">${nw?'<i class="nwdot"></i>':''}${n.k?`<span class="pill tag ${NKC[n.k]||''}" data-a="nk" data-v="${esc(n.k)}">${esc(n.k)}</span> `:''}${esc(n.o)} · ${dsh(n.d)}</span><b>${lk(n.t)}</b>${n.b?`<p class="small">${lk(n.b)}</p>`:''}${full?(()=>{ const C=newsComments(n); const o=(UI.nco||{})[n.id]; return `<button class="ncm-b" data-a="nco" data-v="${n.id}">댓글 ${C.length}${o?' 접기':''}</button>${o?`<div class="fcms">${C.map(cmtRow).join('')}</div>`:C[0]?`<p class="ncm1"><b>${esc(C[0].nick)}</b> ${lk(C[0].t)}</p>`:''}`; })():''}</div></div>`; }

/* 연도별 시즌 요약 */
function seasonSummary(){
  const H=[...G.history].reverse(); if(!H.length)return '';
  const who=x=>x?`${esc(x.name)} <span class="muted">${tshort(x.t)}</span>`:'-';
  return csec('연도별 시즌 요약',`<div class="tw"><table class="ssum"><thead><tr><th>연도</th><th>우승</th><th>준우승</th><th>정규 1위</th><th>MVP</th><th>신인왕</th><th>우리 팀</th></tr></thead><tbody>${H.map(h=>{ const A=(G.awards||{})[h.y]; const ui=h.order.findIndex(o=>o.tid===G.user); const uo=h.order[ui];
    return `<tr class="${h.champ===G.user?'me':''}"><td>${h.y}</td><td>${badge(h.champ,16)} ${tshort(h.champ)}</td><td>${h.runner!=null?tshort(h.runner):'-'}</td><td>${tshort(h.order[0].tid)}</td><td>${A?who(A.mvp):'-'}</td><td>${A?who(A.roy):'-'}</td><td>${G.startY!=null&&h.y<G.startY?'<span class="muted">창단 전</span>':`${ui+1}위${uo?` · ${uo.w}-${uo.l}`:''}${h.champ===G.user?' · 우승':''}`}</td></tr>`; }).join('')}</tbody></table></div>`); }

/* ---------- C: 트레이드 비교판 ---------- */
function tradeInsight(tid,give,get){
  if(!give.length&&!get.length)return '';
  const c=tradeCompare(tid,give,get); const keys=FIELDK.concat(['SP','RP']); const lab=k=>k==='SP'?'선발':k==='RP'?'불펜':POSS[k];
  const cell=(b,a)=>{ if(b==null&&a==null)return '<td class="muted">-</td>'; const d=(a??0)-(b??0); return `<td class="${d>=3?'up':d<=-3?'dn':''}">${a??'-'}${d?`<i>${d>0?'+':''}${d}</i>`:''}</td>`; };
  const tbl=`<div class="tw"><table class="tcmp"><thead><tr><th></th>${keys.map(k=>`<th>${lab(k)}</th>`).join('')}</tr></thead><tbody>
    <tr><td>${badge(G.user,16)} 우리</td>${keys.map(k=>cell(c.my[0][k],c.my[1][k])).join('')}</tr>
    <tr><td>${badge(tid,16)} 상대</td>${keys.map(k=>cell(c.th[0][k],c.th[1][k])).join('')}</tr></tbody></table></div>`;
  const op=asstOpinion(tid,give,get); const hint=tradeHint(tid,give,get);
  const hintH=hint?(hint.txt?`<p class="small muted">${esc(hint.txt)}</p>`:`<div class="thint">${hint.big?'<span class="small">차이가 커서 한두 명으로는 어려워 보입니다.</span>':''}${hint.add?`<span class="small">상대는 <b>${esc(hint.add.name)}</b>(${posLabel(hint.add)})을(를) 더 얹으면 받아들일 것 같습니다.</span><button class="btn small" data-a="tpick" data-v="give:${hint.add.id}">얹기</button>`:''}${hint.drop?`<span class="small">또는 받을 선수에서 <b>${esc(hint.drop.name)}</b>을(를) 빼면 될 것 같습니다.</span><button class="btn small" data-a="tpick" data-v="get:${hint.drop.id}">빼기</button>`:''}${!hint.add&&!hint.drop&&!hint.big?'<span class="small muted">맞춰 줄 만한 선수가 보이지 않습니다.</span>':''}</div>`):'';
  const mv=mgrTradeView(tid,give,get);
  return `<div class="tins">${dealMoney(give,get)}${mv?`<p class="small">${esc(mv.txt)}</p>`:''}<div class="eyebrow">포지션별 주전 평가 (트레이드 후, 괄호 숫자는 변화)</div>${tbl}
    <div class="asst"><span class="eyebrow">부단장 의견</span>${op.map(t=>`<p class="small">${esc(t)}</p>`).join('')}</div>${hintH}
    <p class="small muted">숫자는 포지션별 주전의 현재 능력(오버롤)입니다.</p></div>`;
}

/* 드래프트 센터: 스카우트 추천과 모의 지명 */
function draftCenter(all,mine){
  const top=all.slice(0,3);
  const rec=`<div class="dc-rec"><div class="eyebrow">스카우트 추천 3명</div>${top.map(x=>`<div class="dc-r"><button class="dc-p" data-a="player" data-v="${x.p.id}">${avImg(x.p)}<span><b>${esc(x.p.name)}</b><i>${posLabel(x.p)} · ${x.p.age}세 · ${x.p.college?'대졸':'고졸'} · ${esc(x.p.region)}</i><em>${esc(x.rp.arch)}${x.rp.role?` · 장래 ${esc(x.rp.role)}`:''}</em></span></button><span class="dc-st small">${esc(amShort(x.p))}</span><span></span>${mine?`<button class="btn small primary" data-a="pick" data-v="${x.p.id}">지명</button>`:''}</div>`).join('')}</div>`;
  const mk=mockDraft(12); const live=G.draft&&!G.draft.done;
  const mock=mk.length?`<div class="dc-mock"><div class="eyebrow">${live?'우리 다음 순번까지 예상 지명':'1라운드 모의 드래프트'}</div><ol>${mk.map(m=>{ const p=G.players[m.id]; return `<li class="${m.mine?'me':''}"><span class="num">${m.pk.rd}-${m.pk.no}</span>${badge(m.pk.tid,16)}<button class="lnk" data-a="player" data-v="${p.id}">${esc(p.name)}</button><i>${posLabel(p)}</i></li>`; }).join('')}</ol><p class="small muted">우리 스카우트가 본 평가와 각 구단 성향으로 짐작한 예상입니다. 실제 지명과 다를 수 있습니다.</p></div>`:'';
  const rn=rosterN(G.user); const nw=Object.values(G.players).filter(p=>p.team===G.user&&p.joinY>G.year&&!p.ys).length; const tot=rn+nw;
  const rl=`<p class="small ${tot>ROSTER_MAX?'bad':'muted'}" style="margin:8px 0 0">지금 로스터 ${rn}명 + 내년 입단 ${nw}명 = ${tot}명 (상한 ${ROSTER_MAX}명).${tot>ROSTER_MAX?` 개막 전까지 ${tot-ROSTER_MAX}명을 줄여야 합니다. 계약 만료·방출로 정리하세요.`:''}</p>`;
  const lost=(live&&G.draft.lost||[]).slice(-3).reverse(); const left=live?(G.shortlist||[]).filter(id=>G.players[id]&&G.players[id].prospect).length:0;
  const ll=lost.length?`<div class="note warn">${lost.map(x=>`관심 선수 <b>${esc(x.nm)}</b>을(를) ${esc(tshort(x.tid))}이(가) ${x.rd}-${x.no}에 지명`).join('<br>')}${live?` · 관심 목록 남은 선수 ${left}명`:''}</div>`:'';
  return `<section class="card dcenter">${ll}<div class="dc-g">${rec}${mock}</div>${rl}</section>`;
}

/* 선수 카드: 스태프 의견과 빠른 행동 */
function staffCardP(p){ const L=staffNotes(p); if(!L.length)return '';
  return `<div class="stn">${L.map(x=>`<div><span>${esc(x.w)}</span><p>${esc(x.t)}</p></div>`).join('')}</div>`; }
function quickActs(p){
  const b=[]; const d=G.draft;
  if(p.prospect){ if(d&&!d.done&&d.picks[d.cur].tid===G.user)b.push(`<button class="btn small primary" data-a="pick" data-v="${p.id}">지명</button>`); b.push(`<button class="btn small" data-a="star" data-v="${p.id}">${(G.shortlist||[]).includes(p.id)?'★ 관심 해제':'☆ 관심'}</button>`); }
  else if(p.team===G.user&&!(p.joinY>G.year)){
    b.push(`<button class="btn small" data-a="jump" data-v="bond">면담</button>`);
    if(!p.foreign&&p.age>=23&&team(G.user).cap!==p.id)b.push(`<button class="btn small" data-a="setCap" data-v="${p.id}">주장 임명</button>`);
    if(!p.foreign&&tradeOpen()){ b.push(`<button class="btn small" data-a="findMine" data-v="${p.id}">시장 가치</button>`); b.push(`<button class="btn small" data-a="toTradeGive" data-v="${p.id}">트레이드 카드로</button>`); }
    if(!p.foreign)b.push(p.listed?`<button class="btn small" data-a="blkOff" data-v="${p.id}">블록 내리기</button>`:`<button class="btn small" data-a="blkOn" data-v="${p.id}">트레이드 블록</button>`);
    if(entryOn()&&!p.ys)b.push(`<button class="btn small" data-a="${p.e1?'reqDown':'reqUp'}" data-v="${p.id}">${p.e1?'말소 요청':'1군 요청'}</button>`);
    if(canExtend(p))b.push(`<button class="btn small" data-a="jump" data-v="ext">다년 계약</button>`);
  } else if(p.team!=null&&p.team!==G.user&&!p.foreign&&!(p.joinY>G.year)){ if(tradeOpen()){ b.push(`<button class="btn small primary" data-a="findT" data-v="${p.id}">이 선수 얻을 조건</button>`); b.push(`<button class="btn small" data-a="toTrade" data-v="${p.id}">협상 테이블에 올리기</button>`); } b.push(`<button class="btn small" data-a="pwatch" data-v="${p.id}">${(G.pwatch||[]).includes(p.id)?'관심 해제':'관심 선수'}</button>`); }
  return b.length?`<div class="qacts">${b.join('')}</div>`:''; }

/* ---------- 아마추어 기록: 학년별 ---------- */
function amYearTable(p){ const Y=p.amY; if(!Y||!Y.length)return `<p class="small">${esc(amLine(p))}</p>`;
  const sch=p.college?'대':'고'; const rows=Y.concat([Object.assign({gr:'합계',tot:true},p.am)]);
  if(p.isP)return `<div class="tw"><table class="amy"><thead><tr><th>학년</th><th>경기</th><th>이닝</th><th class="key">ERA</th><th>탈삼진</th><th>볼넷</th><th class="key">K/9</th><th class="key">BB/9</th><th>K/BB</th></tr></thead><tbody>${rows.map(x=>`<tr class="${x.tot?'tot':''}"><td>${x.tot?'합계':sch+x.gr}</td><td>${x.g}</td><td>${ipStr(x.outs)}</td><td>${x.outs?((x.er||0)*27/x.outs).toFixed(2):'-'}</td><td>${x.so}</td><td>${x.bb}</td><td>${x.outs?(x.so*27/x.outs).toFixed(1):'-'}</td><td>${x.outs?(x.bb*27/x.outs).toFixed(1):'-'}</td><td>${x.bb?(x.so/x.bb).toFixed(2):'-'}</td></tr>`).join('')}</tbody></table></div>`;
  return `<div class="tw"><table class="amy"><thead><tr><th>학년</th><th>경기</th><th>타석</th><th>타율</th><th class="key">OPS</th><th>홈런</th><th>볼넷</th><th>삼진</th><th class="key">볼삼비</th><th>도루</th></tr></thead><tbody>${rows.map(x=>{ const r=bRate(x); return `<tr class="${x.tot?'tot':''}"><td>${x.tot?'합계':sch+x.gr}</td><td>${x.g}</td><td>${x.pa}</td><td>${fmt3(r.avg)}</td><td>${fmt3(r.ops)}</td><td>${x.hr}</td><td>${x.bb}</td><td>${x.so}</td><td>${x.so?(x.bb/x.so).toFixed(2):'-'}</td><td>${x.sb}</td></tr>`; }).join('')}</tbody></table></div>`; }
function amLine(p){ const h=p.am; if(!h)return '기록 없음';
  if(p.isP){ const r=pRate(h); return `ERA ${h.outs?r.era.toFixed(2):'-'} · ${ipStr(h.outs)}이닝 · K/9 ${h.outs?(h.so*27/h.outs).toFixed(1):'-'} · BB/9 ${h.outs?(h.bb*27/h.outs).toFixed(1):'-'} · 최고 ${p.amVelo||veloOf(p)}km/h`; }
  const r=bRate(h); return `타율 ${fmt3(r.avg)} · OPS ${fmt3(r.ops)} · 홈런 ${h.hr} · 볼삼비 ${h.so?(h.bb/h.so).toFixed(2):'-'} · 1루 ${p.amRun||runOf(p)}초`; }

/* ---------- 선수 이야기 ---------- */
const STK={draft:'지명',debut:'데뷔',first:'첫 기록',mile:'기록',high:'커리어 하이',award:'수상',move:'이적·계약',inj:'부상',mil:'병역'};
const STC={draft:'acc',debut:'good',first:'good',mile:'warn',high:'warn',award:'warn',move:'',inj:'bad',mil:''};
function careerStory(p){
  const ev=(p.story||[]).slice(); const one=[...new Set(p.hist.filter(h=>h.lvl==='1군').map(h=>h.y))].sort((a,b)=>a-b);
  const fut=[...new Set(p.hist.filter(h=>h.lvl==='퓨처스'&&!h.y2).map(h=>h.y))];
  if(!ev.length&&!one.length&&!p.draft&&!fut.length)return '';
  const wars=one.map(y=>wOf(seasonTotal(p,y,'1군'),p)); const best=wars.length>1?one[wars.indexOf(Math.max(...wars))]:null;
  const years=[...new Set(ev.map(e=>e.y).concat(one).concat(fut).concat(p.draft&&!ev.some(e=>e.k==='draft')?[p.draft.y]:[]))].sort((a,b)=>b-a);
  const row=y=>{ const h=seasonTotal(p,y,'1군'), f=seasonTotal(p,y,'퓨처스'); const es=ev.filter(e=>e.y===y).sort((a,b)=>b.d-a.d);
    if(p.draft&&p.draft.y===y&&!es.some(e=>e.k==='draft'))es.push({t:`${y} 신인 드래프트 ${p.draft.rd}라운드 ${p.draft.no}순위`,k:'draft'});
    const line=h?`${tshort(h.t)} · ${statLine(h,p)}`:f?`퓨처스 · ${statLine(f,p)}`:'';
    const aw=(p.aw||[]).filter(a=>a.startsWith(String(y)));
    return `<li class="${y===best?'best':''}"><div class="sy"><b>${y}</b>${p.age!=null?`<i>${p.age-(G.year-y)}세</i>`:''}</div><div class="sb">${line?`<p class="sl">${esc(line)}${y===best?' <span class="pill warn">최고 시즌</span>':''}${aw.map(a=>` <span class="pill warn">${esc(a.replace(String(y)+' ',''))}</span>`).join('')}</p>`:''}${es.filter(e=>e.k!=='award').map(e=>`<p class="se"><span class="pill ${STC[e.k]||''}">${STK[e.k]||'소식'}</span> ${lk(e.t)}</p>`).join('')}</div></li>`; };
  const c=careerOf(p);
  const head=one.length?`<p class="small muted">1군 ${one.length}시즌 · ${p.isP?`${c.w}승 ${c.sv}세이브 · 탈삼진 ${c.so}`:`${c.h}안타 · ${c.hr}홈런`} · 통산 WAR ${c.war.toFixed(1)}${p.school?` · ${esc(p.school)} 출신`:''}</p>`:p.school?`<p class="small muted">${esc(p.school)} 출신</p>`:'';
  return `<section class="card"><div class="row between"><span class="eyebrow">커리어 이야기</span><span class="small muted">최근 시즌부터</span></div>${head}<ol class="story">${years.map(row).join('')}</ol></section>`; }

/* ---------- 상황판: 리그 판도 · 우리 구단 진단 · 구단별 전력 ---------- */
let _psC={k:null};
function allStrength(){ const k=G.day+':'+G.games.length+':'+G.year; if(_psC.k===k)return _psC.v; const v={}; for(const t of G.teams)v[t.id]=posStrength(rosterList(t.id)); _psC={k,v}; return v; }
function pct(v){ return v==null?'-':v>=.995?'99%+':v<=.005&&v>0?'1% 미만':v===0?'0%':Math.round(v*100)+'%'; }
function raceCard(){
  const per=period(); const {order,live,y}=standOrder(); const odds=playoffOdds(); const top=order[0];
  if(!live||!odds)return csec(live?`${G.year} 현재 순위`:`${y} 최종 순위`,`<div class="tw">${standingsTable(order)}</div>${live?'<p class="small muted">가을야구 확률은 팀당 20경기를 치른 뒤부터 계산합니다.</p>':''}`);
  const om=new Map(odds.map(o=>[o.tid,o]));
  const zone=o=>{ const x=om.get(o.tid); return x.first>=.15?'선두 경쟁':x.ps>=.08?'가을야구 경쟁':'하위권'; };
  const groups=['선두 경쟁','가을야구 경쟁','하위권'].map(z=>[z,order.filter(o=>zone(o)===z)]).filter(g=>g[1].length);
  const left=144-(G.sea.rec[G.user].w+G.sea.rec[G.user].l+(G.sea.rec[G.user].t||0));
  return `<section class="card"><div class="row between"><h2 class="sec">리그 판도</h2><span class="small muted">남은 경기 ${left} · 남은 일정을 400번 모의 진행</span></div>
    ${groups.map(([z,arr])=>`<div class="zone"><div class="eyebrow">${z}</div>${arr.map(o=>{ const x=om.get(o.tid); const i=order.indexOf(o); return `<button class="race${o.tid===G.user?' me':''}" data-a="lteamGo" data-v="${o.tid}"><span class="rk">${i+1}</span>${badge(o.tid,20)}<b>${tshort(o.tid)}</b><span class="num rcd">${wlStr(o)}</span><span class="num gb">${i?gbStr(gbOf(top,o)):'-'}</span><span class="bar"><i style="width:${Math.max(2,x.ps*100)}%"></i></span><span class="num ppc">${pct(x.ps)}</span>${strkPill(o.tid)}</button>`; }).join('')}</div>`).join('')}
    <p class="small muted">막대는 가을야구(5위 안) 진출 확률입니다. 지금 성적과 개막 전 전력 평가를 섞은 팀 전력으로 남은 경기를 모의 진행한 결과이고, 실제 결과와 다를 수 있습니다.</p></section>`; }
function myDiag(){
  const S=allStrength(); const keys=FIELDK.concat(['SP','RP']); const lab=k=>k==='SP'?'선발진':k==='RP'?'불펜':POSK[k];
  const rk=k=>{ const vals=G.teams.map(t=>S[t.id][k]).filter(v=>v!=null); const me=S[G.user][k]; if(me==null)return null; return {r:vals.filter(v=>v>me).length+1,n:vals.length,v:me,avg:Math.round(avg(vals))}; };
  const rows=keys.map(k=>({k,x:rk(k)})).filter(o=>o.x);
  const strong=[...rows].sort((a,b)=>a.x.r-b.x.r||b.x.v-a.x.v).slice(0,2), weak=[...rows].sort((a,b)=>b.x.r-a.x.r||a.x.v-b.x.v).slice(0,2);
  const ps=rosterList(G.user); const ag=avg(ps.map(p=>p.age)); const lgAg=avg(Object.values(G.players).filter(p=>p.team!=null&&!(p.joinY>G.year)).map(p=>p.age));
  const ci=capInfo(G.user); const faN=domestic(G.user).filter(p=>!p.faC&&Math.max(0,faSvc(p)-p.svc)===0||p.faC&&p.yrs<=1).length;
  const pros=domestic(G.user).filter(p=>p.age<=23).map(p=>({p,rp:scoutReport(p)})).filter(x=>x.rp.ofp!=null).sort((a,b)=>b.rp.ofp-a.rp.ofp).slice(0,3);
  const odds=playoffOdds(); const me=odds?odds.find(o=>o.tid===G.user):null;
  const bar=o=>`<div class="pr"><span>${lab(o.k)}</span><span class="pbar"><i style="width:${(o.x.n-o.x.r+1)/o.x.n*100}%;background:${o.x.r<=3?'var(--good)':o.x.r>=o.x.n-2?'var(--bad)':'var(--warn)'}"></i></span><b class="num">${o.x.r}위</b><i class="num">${o.x.v} (평균 ${o.x.avg})</i></div>`;
  return `<section class="card"><div class="row between"><h2 class="sec">${badge(G.user,18)} 우리 구단 진단</h2>${me?`<span class="small">가을야구 확률 <b>${pct(me.ps)}</b></span>`:''}</div>
    <dl class="tsum"><div><dt>강점</dt><dd>${strong.map(o=>`${lab(o.k)} ${o.x.r}위`).join(' · ')||'-'}</dd></div><div><dt>약점</dt><dd>${weak.map(o=>`${lab(o.k)} ${o.x.r}위`).join(' · ')||'-'}</dd></div><div><dt>평균 나이</dt><dd>${ag.toFixed(1)}세 <span class="muted">(리그 ${lgAg.toFixed(1)})</span></dd></div></dl>
    <div class="eyebrow">포지션별 주전 평가 · 10개 구단 중 순위</div><div class="prs">${rows.map(bar).join('')}</div>
    <dl class="tsum"><div><dt>연봉 캡</dt><dd>${money(ci.pay)} / ${money(ci.cap)}</dd></div><div><dt>올해 FA·계약 만료</dt><dd>${faN}명</dd></div><div><dt>유망주(23세 이하)</dt><dd>${pros.map(x=>`<button class="lnk" data-a="player" data-v="${x.p.id}">${esc(x.p.name)}</button> ${x.rp.ofp}`).join(' · ')||'-'}</dd></div></dl>
    <p class="small muted">숫자는 포지션별 주전의 현재 능력(오버롤)입니다. 장래성은 우리 선수만 보입니다.</p></section>`; }
function powerMap(){
  const S=allStrength(); const keys=FIELDK.concat(['SP','RP']); const lab=k=>k==='SP'?'선발':k==='RP'?'불펜':POSS[k];
  const {order,live}=standOrder(); const odds=playoffOdds(); const om=new Map((odds||[]).map(o=>[o.tid,o]));
  const cell=v=>v==null?'<td class="hm q">?</td>':`<td class="hm" style="--c:${rcol(v)}">${v}</td>`;
  const sell=t=>{ const o=om.get(t.id); if(!live||!o)return t.mode==='contend'?'우승 도전':'리빌딩'; return o.ps>=.6?'영입 쪽(우승 도전)':o.ps<=.1?'판매 쪽(정리)':'관망'; };
  return `<section class="card"><div class="row between"><h2 class="sec">구단별 전력 지도</h2><span class="small muted">포지션별 주전 평가 · 구단 이름을 누르면 선수단</span></div>
    <div class="tw"><table class="pmap"><thead><tr><th class="stk">구단</th>${live?'<th>순위</th><th>가을야구</th>':''}${keys.map(k=>`<th>${lab(k)}</th>`).join('')}<th>트레이드 성향</th><th>담당 스카우트</th></tr></thead><tbody>
    ${order.map((o,i)=>{ const t=team(o.tid); const cv=coverOf(o.tid); const x=om.get(o.tid); return `<tr class="${o.tid===G.user?'me':''}"><td class="stk"><button class="lnk tname" data-a="lteamGo" data-v="${o.tid}">${badge(o.tid,16)}${tshort(o.tid)}</button></td>${live?`<td>${i+1}</td><td>${x?pct(x.ps):'-'}</td>`:''}${keys.map(k=>cell(S[o.tid][k])).join('')}<td class="tx">${o.tid===G.user?'-':sell(t)}</td><td class="tx">${o.tid===G.user?'-':cv.sc?esc(cv.sc.name):'<span class="muted">없음</span>'}</td></tr>`; }).join('')}
    </tbody></table></div>
    <p class="small muted">색이 진할수록 강합니다. 담당 스카우트가 있는 지역 구단은 선수 장래성까지 보입니다. 트레이드 성향은 가을야구 확률로 짐작한 것입니다.</p></section>`; }
function boardView(){ const t=inTabs('board',[['race','리그 판도'],['me','우리 구단 진단'],['map','구단별 전력 지도']]); return t.bar+(t.cur==='race'?raceCard():t.cur==='me'?myDiag():powerMap()); }

/* ---------- 소식함 서랍: 옆에서 열고 바로 다음 메일 ---------- */
function mailFilter(f){ const isTask=m=>m.imp&&!(m.kind==='트레이드'&&/원한다/.test(m.subj)&&!(G.offers||[]).some(o=>o.id===m.oid));
  return G.mail.filter(m=>f==='all'||(f==='task'&&isTask(m))||(f==='unread'&&!m.read)||(f==='player'&&typeof m.face==='number')); }
/* ---------- 도움말 문장 접기 ---------- */
function toast(t){ let el=document.getElementById('toast'); if(!el){ el=document.createElement('div'); el.id='toast'; el.setAttribute('role','status'); document.body.appendChild(el); } el.textContent=t; el.classList.add('on'); clearTimeout(toast._t); toast._t=setTimeout(()=>el.classList.remove('on'),2400); }
/* 설명 문단은 기본으로 보인다. 익숙해지면 ? 버튼으로 숨긴다 */
function helpOn(){ try{ return localStorage.getItem('danjang-help')!=='0'; }catch(e){ return true; } }
function markHints(root){ if(!root)return; root.querySelectorAll('p.small.muted, p.muted.small').forEach(el=>{ if(el.closest('.mailbody,.news,.dl-empty,.td,.quote'))return; const t=el.textContent||''; if(el.classList.contains('keep')||/없습니다|수 없|아닙니다|만 시작|기한|마감/.test(t))return; if(t.length>=42)el.classList.add('hint'); }); }

/* ---------- 화면 안 탭 ---------- */
function inTabs(key,tabs,def){ const cur=(UI.it||{})[key]||def||tabs[0][0]; const ok=tabs.some(t=>t[0]===cur)?cur:tabs[0][0];
  return {cur:ok,bar:`<div class="seg itabs">${tabs.map(([k,l])=>`<button data-a="itab" data-v="${key}:${k}" class="${ok===k?'on':''}">${l}</button>`).join('')}</div>`}; }

/* 긴 목록은 쪽으로 나눈다: 스크롤 대신 넘기기 */
function pager(key,arr,per){ UI.pg=UI.pg||{}; const n=Math.max(1,Math.ceil(arr.length/per)); let i=Math.min(UI.pg[key]||0,n-1); if(i<0)i=0;
  const items=arr.slice(i*per,i*per+per); const bar=n<=1?'':`<div class="pgr"><button class="btn small" data-a="pgGo" data-v="${key}:${i-1}" ${i<=0?'disabled':''} aria-label="이전">‹ 이전</button><span class="num">${i+1} / ${n}</span><button class="btn small" data-a="pgGo" data-v="${key}:${i+1}" ${i>=n-1?'disabled':''} aria-label="다음">다음 ›</button></div>`;
  return {items,bar,i,n}; }
/* ---------- 공용 선수 카드 ---------- */
function amShort(p){ const h=p.am; if(!h)return ''; if(p.isP){ const o=h.outs||0; return o?`ERA ${((h.er||0)*27/o).toFixed(2)} · K/9 ${(h.so*27/o).toFixed(1)} · BB/9 ${(h.bb*27/o).toFixed(1)}`:''; } const r=bRate(h); return `OPS ${fmt3(r.ops)} · 볼삼비 ${h.so?(h.bb/h.so).toFixed(2):'-'} · ${h.hr}홈런`; }
const hideOvr=p=>!!(p&&(p.prospect||p.fdPool||(p.foreign&&p.team==null)));
function statCells(p){ // 신인·외국인 후보: 능력치 대신 기록 5칸
  const h=p.prospect?p.am:p.prev; if(!h)return '';
  const c=(l,v,cls)=>`<div><span>${l}</span><b class="${cls||''}">${v}</b></div>`;
  if(p.isP){ const o=h.outs||0; const k9=o?h.so*27/o:0, b9=o?h.bb*27/o:0, era=o?(h.er||0)*27/o:0;
    return `<div class="tc-tools sc5">${c('ERA',o?era.toFixed(2):'-')}${c('K/9',o?k9.toFixed(1):'-',k9>=9?'gd':k9<6?'bd':'')}${c('BB/9',o?b9.toFixed(1):'-',b9<=3?'gd':b9>=5?'bd':'')}${c('이닝',ipStr(o))}${p.prospect?c('최고 구속',(p.amVelo?p.amVelo+5:veloMax(p))+''):c('WHIP',o?((h.h+h.bb)*3/o).toFixed(2):'-')}</div>`; }
  const r=bRate(h); const bk=h.so?h.bb/h.so:0;
  const ev=evOf(p)-(p.prospect?(p.college?2:5):0);
  return `<div class="tc-tools sc5">${c('타구속도',ev+'',ev>=140?'gd':ev<130?'bd':'')}${c('OPS',fmt3(r.ops),r.ops>=.9?'gd':r.ops<.65?'bd':'')}${c('홈런',h.hr)}${c('볼삼비',h.so?bk.toFixed(2):'-',bk>=.8?'gd':bk<=.3?'bd':'')}${p.prospect?c('1루',(p.amRun||runOf(p))+''):c('타석',h.pa)}</div>`; }
/* 선수 카드: 능력치와 성적이 핵심, 나머지는 한 줄 */
function pcRec(p,hid){ // 성적 블록: 큰 숫자 하나 + 보조 한 줄
  let h, tag='';
  if(hid){ h=p.prospect?p.am:p.prev; tag=p.prospect?'아마추어 통산':(p.prevLvl||'지난 시즌'); }
  else { h=curLine(p); if(h)tag=(h.y===G.year?'올해':h.y+'')+(h.lvl==='퓨처스'?' 퓨처스':''); }
  if(!h||(p.isP?!h.outs:!h.pa))return `<div class="pc-rec"><span class="pc-l">성적</span><b class="pc-big muted">-</b><span class="pc-s">기록 없음</span></div>`;
  if(p.isP){ const o=h.outs, era=(h.er||0)*27/o, k9=h.so*27/o; const c=era<=3.3?'var(--good)':era<=4.2?'var(--r50)':era>=5.8?'var(--bad)':'var(--ink)';
    const sub=hid?`${ipStr(o)}이닝 · K/9 ${k9.toFixed(1)}`:`${ipStr(o)}이닝${h.sv?` · ${h.sv}세`:h.hld?` · ${h.hld}홀`:` · ${h.w||0}승`} · WAR ${wOf(h,p).toFixed(1)}`;
    return `<div class="pc-rec"><span class="pc-l">${tag} ERA</span><b class="pc-big" style="color:${c}">${era.toFixed(2)}</b><span class="pc-s">${sub}</span></div>`; }
  const r=bRate(h); const c=r.ops>=.9?'var(--good)':r.ops>=.78?'var(--r50)':r.ops<.62?'var(--bad)':'var(--ink)';
  const sub=hid?`${fmt3(r.avg)} · ${h.hr}홈런 · 볼삼비 ${h.so?(h.bb/h.so).toFixed(2):'-'}`:`${fmt3(r.avg)} · ${h.hr}홈런 · WAR ${wOf(h,p).toFixed(1)}`;
  return `<div class="pc-rec"><span class="pc-l">${tag} OPS</span><b class="pc-big" style="color:${c}">${fmt3(r.ops)}</b><span class="pc-s">${sub}</span></div>`; }
function pcard(p,o){ o=o||{}; const rp=o.rp||scoutReport(p); const hid=hideOvr(p);
  const ab=hid?'':`<div class="pc-ab"><span class="pc-l">능력</span>${rp.cur==null?'<b class="pc-ov q">?</b>':`<b class="pc-ov" style="--c:${rcol(rp.cur)}">${rp.cur}</b>${condChip(p)}`}<span class="pc-s">${rp.ofp!=null&&rp.ofp>rp.cur?`장래 <b style="color:${rcol(rp.ofp)}">${rp.ofp}</b>`:rp.ofp!=null?'완성형':'장래 ?'}</span></div>`;
  const pos=p.isP?`<span class="pp main">${posLabel(p)}</span>`:`<span class="pp main"${p.team===G.user?` data-a="posSheet" data-v="${p.pos}"`:''}>${POSS[p.pos]}</span>`;
  return `<div class="tcard pc ${hid?'':cardTier(rp.cur)}${o.on?' on':''}${hid?' hid':''}" data-a="${o.act||'player'}" data-v="${o.v??p.id}" role="button" tabindex="0"${o.on!=null?` aria-pressed="${!!o.on}"`:''}>
    <div class="pc-top">${avImg(p)}<div class="pc-id"><b>${esc(p.name)}</b><span>${pos}${o.sub||`${p.age}세 · ${hand(p)}`}</span></div></div>
    <div class="pc-core">${ab}${pcRec(p,hid)}</div>
    ${o.tags||o.stat?`<div class="pc-x">${o.tags||''}${o.stat?`<span>${o.stat}</span>`:''}</div>`:''}
    ${o.foot?`<div class="tc-ft">${o.foot}</div>`:''}
    ${o.mark?`<span class="tc-mark">${o.mark}</span>`:''}
  </div>`;
}

/* ---------- 포지션 표시와 감독 라인업 ---------- */
function posChips(p){ const go=k=>p.team===G.user?` data-a="posSheet" data-v="${k}" title="${k==='P'?'투수진':POSK[k]} 후보 보기"`:''; if(p.isP)return `<span class="pp main"${go('P')}>${posLabel(p)}</span>`; return `<span class="pp main"${go(p.pos)}>${POSS[p.pos]}</span>${subsOf(p).map(k=>`<span class="pp"${go(k)}>${POSS[k]}</span>`).join('')}`; }
function posText(p){ if(p.isP)return posLabel(p); const s=subsOf(p); return POSK[p.pos]+(s.length?` · 서브 ${s.map(k=>POSS[k]).join('·')}`:''); }
function useText(p){ const u=p.use&&p.use.y===G.year?p.use:null; if(!u||!u.g)return '이번 시즌 선발 출장 없음';
  const ps=Object.entries(u.pos).sort((a,b)=>b[1]-a[1]).map(([k,n])=>`${POSS[k]||k} ${n}`).join(' · ');
  const sl=Object.entries(u.slot).sort((a,b)=>b[1]-a[1])[0];
  return `선발 ${u.g}경기 · 주로 ${sl[0]}번 · ${ps}`; }
function bLine(p){ const h=seasonTotal(p,G.year,'1군'); if(!h||!h.pa){ const l=curLine(p); return l&&l.pa?`<span class="muted">${l.y===G.year?'퓨처스':l.y} OPS ${fmt3(bRate(l).ops)}</span>`:'<span class="muted">기록 없음</span>'; }
  const r=bRate(h); const c=r.ops>=.9?'var(--good)':r.ops>=.78?'var(--r50)':r.ops<.62?'var(--bad)':'inherit';
  return `<b class="num">${fmt3(r.avg)}</b> · OPS <b class="num" style="color:${c}">${fmt3(r.ops)}</b> · ${h.hr}홈런 ${h.rbi}타점${h.sb?` ${h.sb}도루`:''}`; }
function pLine(p){ const h=seasonTotal(p,G.year,'1군'); if(!h||!h.outs)return '<span class="muted">이번 시즌 기록 없음</span>'; const r=pRate(h); const c=r.era<=3.3?'var(--good)':r.era<=4.2?'var(--r50)':r.era>=5.8?'var(--bad)':'inherit';
  return `ERA <b class="num" style="color:${c}">${r.era.toFixed(2)}</b> · ${ipStr(h.outs)}이닝 · ${h.w||0}승 ${h.l||0}패${h.sv?` ${h.sv}세`:''}${h.hld?` ${h.hld}홀`:''} · 탈삼진 ${h.so}`; }
function l10Text(p){ const L=p.l10||[]; if(!L.length)return '';
  if(p.isP){ const o=sum(L.map(x=>x[0])), er=sum(L.map(x=>x[1])); if(!o)return ''; const era=er*27/o; return `최근 ${L.length}경기 ERA <b style="color:${era<=3.3?'var(--good)':era>=5.8?'var(--bad)':'inherit'}">${era.toFixed(2)}</b>`; }
  const ab=sum(L.map(x=>x[0])),h=sum(L.map(x=>x[1])),hr=sum(L.map(x=>x[2])),bb=sum(L.map(x=>x[3])),xb=sum(L.map(x=>x[5]||0)); if(!ab)return '';
  const ops=(h+bb)/(ab+bb)+(h+xb)/ab; const s=seasonTotal(p,G.year,'1군'); const so=s&&s.pa?bRate(s).ops:null;
  const tr=so==null?'':ops>so+.08?' <span class="trend up">상승</span>':ops<so-.08?' <span class="trend dn">하락</span>':'';
  return `최근 ${L.length}경기 ${fmt3(h/ab)} ${hr?hr+'홈런 ':''}OPS <b style="color:${ops>=.9?'var(--good)':ops<.6?'var(--bad)':'inherit'}">${fmt3(ops)}</b>${tr}`; }
function fatBar(p){ const f=Math.round(p.fat||0); const c=f>=70?'var(--bad)':f>=45?'var(--warn)':'var(--good)'; return `<span class="fat" title="피로 ${f}"><i style="width:${Math.max(4,f)}%;background:${c}"></i></span>`; }
function fatText(p){ const f=p.fat||0; return f>=70?'많이 지침':f>=45?'피로 누적':f>=20?'보통':'좋음'; }
/* ---------- 선수단 한눈에: 1군·2군 라인업, 성장 표시 ---------- */
const GPOS=['C','SS','2B','CF','3B','RF','LF','1B','DH'];
function futLineup(list){ const used=new Set(), ln={}; for(const k of GPOS){ const free=list.filter(p=>!used.has(p.id)); const ok=k==='DH'?free:free.filter(p=>p.pos===k||(subsOf(p)||[]).includes(k)); const c=(ok.length?ok:free).sort((a,b)=>posScore(b,k)-posScore(a,k))[0]; if(c){ ln[k]=c; used.add(c.id); } } return ln; }
function growDelta(p){ const g=G.ovr0&&G.ovr0.y===G.year?G.ovr0.m[p.id]:null; return g==null?null:ovr(p)-g; }
/* 우리 팀에 어떻게 왔나: 쌓아 온 과정이 보이게 */
function originOf(p){ if(!p||p.team!==G.user)return ''; if(p.foreign)return '외국인'; const nm=tname(G.user);
  const S=(p.story||[]).slice().reverse().find(x=>x.t&&x.t.includes(nm)&&(x.k==='move'||x.k==='draft'));
  if(S){ const m=S.t.match(/(\d+)라운드/); if(S.t.includes('창단 드래프트'))return `창단 ${m?m[1]:''}R`; if(S.t.includes('신인 드래프트'))return `${String(S.y).slice(2)}신인 ${m?m[1]:''}R`; if(S.t.includes('트레이드'))return `${String(S.y).slice(2)} 트레이드`; if(S.t.includes('FA'))return `${String(S.y).slice(2)} FA`; }
  if(p.draft&&p.draft.tid===G.user)return `${String(p.draft.y).slice(2)}신인 ${p.draft.rd}R`;
  if(G.fd&&(G.fd.all||[]).includes(p.id))return '창단 배분'; return '자체 영입'; }
/* 앞으로 몇 년의 예상 능력: 어리면 잠재 쪽으로, 31세부터 하락 */
function projO(p,k){ let o=ovr(p), a=p.age; const pot=Math.max(p.pot||o,o); for(let i=0;i<k;i++){ a++; o+=a<=24?(pot-o)*.3:a<=27?(pot-o)*.22:a<=30?0:a<=33?-1.5:-3; } return o; }
function plannerCard(){ const Y=G.year; const ps=Object.values(G.players).filter(p=>p.team===G.user);
  if(!G.plEx||G.plEx.y!==Y)G.plEx={y:Y,ids:[]}; const EX=new Set(G.plEx.ids);
  const col=k=>{ const av=ps.filter(p=>k>0||!(p.joinY>Y)).filter(p=>!(p.joinY>Y+k)).filter(p=>k===0||!EX.has(p.id));
    const leave=p=>p.foreign?(k>=1?'재계약':''):k>=ctrlYears(p)?'FA':''; const v=p=>projO(p,k);
    const bats=av.filter(p=>!p.isP), pits=av.filter(p=>p.isP); const used=new Set(), ln={}, bk={};
    for(const pos of ['C','SS','2B','CF','3B','RF','LF','1B']){ const el=bats.filter(p=>!used.has(p.id)&&(p.pos===pos||(subsOf(p)||[]).includes(pos))).sort((a,b)=>(v(b)-(b.pos===pos?0:2))-(v(a)-(a.pos===pos?0:2))); if(el[0]){ ln[pos]=el[0]; used.add(el[0].id); } }
    { const r=bats.filter(p=>!used.has(p.id)).sort((a,b)=>v(b)-v(a)); if(r[0]){ ln.DH=r[0]; used.add(r[0].id); } }
    for(const pos of ['C','1B','2B','3B','SS','LF','CF','RF']){ const el=bats.filter(p=>!used.has(p.id)&&(p.pos===pos||(subsOf(p)||[]).includes(pos))).sort((a,b)=>v(b)-v(a)); if(el[0])bk[pos]=el[0]; }
    const sp=[...pits].sort((a,b)=>(v(b)+roleBias(G.user,b))-(v(a)+roleBias(G.user,a))).slice(0,5); const rp=pits.filter(p=>!sp.includes(p)).sort((a,b)=>v(b)-v(a)).slice(0,7);
    return {ln,bk,sp,rp,v,leave}; };
  const C=[0,1].map(col);
  const cls=o=>o==null?'gap':o<45?'weak':o<52?'mid':o>=60?'top':'ok';
  /* 내년 예상은 젊은 선수일수록 범위로 보여 준다(코치진 추정) */
  const rng=(p,k)=>{ const v=projO(p,k); if(k===0||p.age+k>27)return rchip(Math.round(v)); const w=clamp((28-p.age-k)*.8,1.5,5); const m=v+hn('plr'+Y,p.id)*w*.4; return `<span class="pl-r" style="--c:${rcol(Math.round(m))}">${Math.round(m-w)}~${Math.round(m+w)}</span>`; };
  const nm=(c,p,k)=>{ const lv=c.leave(p); return `<span class="pl-pw"><button class="pl-p" data-a="player" data-v="${p.id}"><b>${esc(p.name)}</b>${rng(p,k||0)}${lv?`<em class="pl-f">${lv}</em>`:''}${p.joinY>Y?'<em class="pl-n">신인</em>':''}</button>${k?`<button class="pl-x" data-a="plEx" data-v="${p.id}" title="내년 계획에서 빼기" aria-label="${esc(p.name)} 내년 계획에서 빼기">×</button>`:''}</span>`; };
  const cell=(c,k,ci)=>{ if(k==='SP'||k==='RP'){ const L=k==='SP'?c.sp:c.rp; if(!L.length)return `<td class="gap"><span class="pl-g">공백</span></td>`; const a=L.reduce((t,p)=>t+c.v(p),0)/L.length; return `<td class="${cls(a)}">${nm(c,L[0],ci)}<i class="pl-s">${L.length}명 평균 ${Math.round(a)}${L.length<(k==='SP'?5:6)?' · 부족':''}</i></td>`; }
    const p=c.ln[k], b=c.bk[k]; if(!p)return `<td class="gap"><span class="pl-g">공백</span></td>`; return `<td class="${cls(c.v(p))}">${nm(c,p,ci)}${b?`<i class="pl-s">백업 ${esc(b.name)} ${Math.round(c.v(b))}</i>`:''}</td>`; };
  const rows=PSLOTS.map(k=>`<tr><th>${SLOTS_S[k]}</th>${C.map((c,ci)=>cell(c,k,ci)).join('')}</tr>`).join('');
  /* 내년 공백 요약 */
  const nx=C[1]; const holes=PSLOTS.filter(k=>{ if(k==='SP'||k==='RP'){ const L=k==='SP'?nx.sp:nx.rp; return L.length<(k==='SP'?5:6)||L.reduce((t,p)=>t+nx.v(p),0)/Math.max(1,L.length)<46; } const p=nx.ln[k]; return !p||nx.v(p)<45||nx.leave(p); }).map(k=>{ const p=nx.ln[k]; return `${SLOTS_S[k]}${p&&nx.leave(p)?`(${nx.leave(p)==='FA'?'FA 예정':'외국인 재계약'})`:''}`; });
  /* 2년 뒤 위험: 노화·계약 만료·고액 장기 부담, 그리고 내부 후계 후보 */
  const succ=k=>{ const L=ps.filter(p=>!p.foreign&&p.age<=24&&projO(p,2)>=45&&!EX.has(p.id)&&(k==='SP'?p.isP&&isSPr(p):k==='RP'?p.isP:!p.isP&&(p.pos===k||(subsOf(p)||[]).includes(k)))).filter(p=>!(nx.ln[k]&&nx.ln[k].id===p.id)).sort((a,b)=>projO(b,2)-projO(a,2)); return L[0]||null; };
  const risk=[]; for(const k of PSLOTS){ if(k==='DH')continue; const p=k==='SP'?nx.sp[0]:k==='RP'?nx.rp[0]:nx.ln[k]; if(!p)continue; const r=[];
    if(p.age+2>=33)r.push(`${p.age+2}세가 됨`); if(!p.foreign&&ctrlYears(p)===2)r.push('2년 뒤 FA'); if(p.sal>=1500&&p.age>=31&&(p.faC&&p.yrs>=3))r.push(`연 ${money(p.sal)} 계약이 남음`);
    if(!r.length)continue; const s2=succ(k); risk.push(`<li><b>${SLOTS_S[k]}</b> ${esc(p.name)}: ${r.join(' · ')} → ${s2?`후계 후보 ${esc(s2.name)}(${s2.age}세, 2년 뒤 ${rng(s2,2)})`:'<span class="bad">내부 후계자 없음</span>'}</li>`); }
  /* 연봉 전망: 확정(남은 다년·FA 계약)과 예상(보류권 선수 연봉 협상)을 나눈다 */
  const fr=p=>p.svc<3?.35:p.svc<6?.55:p.svc<faSvc(p)?.78:1;
  const pay=k=>{ const D=ps.filter(p=>!p.foreign&&!p.prospect&&!(p.joinY>Y+k)&&!(k>0&&EX.has(p.id))); let fix=0,est=0,fa=0,faN=0;
    for(const p of D){ if(k===0){ fix+=p.sal; continue; } const cy=ctrlYears(p); if(p.faC&&p.yrs>k){ fix+=p.sal; continue; } if(!p.faC&&cy>k){ est+=round5(marketSal(projO(p,k))*Math.min(1,fr({svc:(p.svc||0)+k,college:p.college}))); continue; } if(projO(p,k)>=50){ fa+=round5(marketSal(projO(p,k))); faN++; } }
    return {fix,est,fa,faN,cap:capOf(Y+k)}; };
  const PY=[0,1,2].map(pay);
  const payT=`<div class="tw"><table class="pl-pay"><thead><tr><th></th>${PY.map((_,k)=>`<th>${Y+k}</th>`).join('')}</tr></thead><tbody>
    <tr><th>확정 연봉</th>${PY.map(x=>`<td>${money(x.fix)}</td>`).join('')}</tr>
    <tr><th>예상(연봉 협상)</th>${PY.map((x,k)=>`<td>${k?money(x.est):'-'}</td>`).join('')}</tr>
    <tr><th>FA 재계약 시</th>${PY.map((x,k)=>`<td>${k&&x.faN?`${money(x.fa)} <i class="muted">(${x.faN}명)</i>`:'-'}</td>`).join('')}</tr>
    <tr><th>샐러리캡</th>${PY.map(x=>`<td>${money(x.cap)}</td>`).join('')}</tr></tbody></table></div>`;
  const exL=G.plEx.ids.map(id=>G.players[id]).filter(Boolean);
  /* 세대 구성 */
  const dom=ps.filter(p=>!p.foreign&&!(p.joinY>Y)); const st=[['성장기','~23세',p=>p.age<=23],['도약기','24~26세',p=>p.age>=24&&p.age<=26],['전성기','27~31세',p=>p.age>=27&&p.age<=31],['노장','32세~',p=>p.age>=32]];
  const gen=st.map(([l,a,f])=>{ const L=dom.filter(f); const g=L.filter(p=>ovr(p)>=52).length; return `<div class="gen-c"><b>${l}</b><i>${a}</i><span>${L.length}명</span><em>1군급 ${g}</em></div>`; }).join('');
  return `<section class="card"><div class="row between"><h2 class="sec">스쿼드 플래너</h2><span class="small muted">숫자는 그해 예상 능력</span></div>
    <div class="tw"><table class="pl-t"><thead><tr><th></th>${[0,1].map(k=>`<th>${Y+k} ${k===0?'(올해)':'(내년)'}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>
    <p class="small ${holes.length?'':'good'} keep">${holes.length?`내년 보강이 필요한 자리: <b>${holes.join(' · ')}</b>`:'내년까지 모든 자리가 채워져 있습니다.'}</p>
    ${exL.length?`<p class="small keep">내년 계획에서 뺀 선수: ${exL.map(p=>esc(p.name)).join(', ')} <button class="tc-i" data-a="plExClear">되돌리기</button></p>`:''}
    <p class="small muted keep">FA는 계약이 끝나 그해 떠날 수 있는 선수, 재계약은 1년 계약 외국인입니다. 젊은 선수의 내년 값은 코치진 추정 범위입니다. 내년 칸의 ×로 계획에서 빼면 빈자리와 연봉 전망이 다시 계산됩니다. 실제 기용이나 선수 기분에는 영향이 없습니다.</p>
    ${risk.length?`<div class="eyebrow" style="margin-top:6px">2년 뒤 위험</div><ul class="pl-risk">${risk.slice(0,6).join('')}</ul>`:''}
    <div class="eyebrow" style="margin-top:6px">국내 선수 연봉 전망</div>${payT}<p class="small muted keep">확정은 남은 다년·FA 계약, 예상은 보류권 선수의 연봉 협상 추정, FA 재계약 시는 계약이 끝나는 주축(예상 능력 50 이상)을 시장가로 잡을 때입니다.</p>
    <div class="eyebrow" style="margin-top:6px">세대 구성 (국내 선수)</div><div class="gen">${gen}</div></section>`; }
function glanceRow(p,lab,own,lvl){ const rp=scoutReport(p); const y=G.year; const h=lvl==='2'?seasonTotal(p,y,'퓨처스'):curLine(p);
  const st=!h?'기록 없음':p.isP?(h.outs?`ERA ${pRate(h).era.toFixed(2)} · ${ipStr(h.outs)}이닝`:'-'):(h.pa?`OPS ${fmt3(bRate(h).ops)} · ${h.hr}홈런`:'-');
  const gd=own?growDelta(p):null; const gt=gd==null||Math.abs(gd)<.5?'':`<em class="gr ${gd>0?'up':'dn'}">${gd>0?'▲':'▼'}${Math.abs(gd).toFixed(1)}</em>`;
  const tag=(team(p.team).cap===p.id?'<em class="capb">C</em>':'')+(p.fr&&p.fr.tid===p.team?'<em class="frb">프</em>':'')+(p.age<=24&&(rp.ofp??0)>=(rp.cur??0)+6?`<em class="potb">잠재 ${rp.ofp}</em>`:'');
  const org=own?originOf(p):'';
  return `<button class="gl-r" data-a="player" data-v="${p.id}"><span class="gl-l">${lab}</span>${avImg(p)}<span class="gl-m"><b>${esc(p.name)}${tag}</b><i>${posLabel(p)} · ${p.age}세 · ${money(p.sal)} · ${st}${org?` · <span class="org">${org}</span>`:''}</i></span><span class="gl-o">${rchip(rp.cur)}${gt}</span></button>`; }
function glanceView(tid){ const own=tid===G.user; if(own&&!G.ovr0)try{ ovrSnap(); growSnap(); }catch(e){} const d=depth(tid); const order=orderList(d.start); const posOf={}; for(const k in d.ln)posOf[d.ln[k].id]=k;
  const R=(p,lab,l)=>glanceRow(p,lab,own,l);
  const roles=['마무리','필승조','필승조','추격조','추격조','롱릴리프','롱릴리프'];
  const one=`<div class="gl-g"><div><div class="eyebrow">타순</div>${order.map((p,i)=>R(p,`${i+1} ${SLK[posOf[p.id]]||''}`,'1')).join('')}</div>
    <div><div class="eyebrow">선발 로테이션</div>${d.sp.map((p,i)=>R(p,`${i+1}선발`,'1')).join('')}<div class="eyebrow">불펜</div>${d.pen.slice(0,7).map((p,i)=>R(p,roles[i]||'불펜','1')).join('')}</div></div>
    ${d.bench.length?`<div class="eyebrow">벤치</div><div class="gl-chips">${d.bench.map(p=>`<button class="lnk" data-a="player" data-v="${p.id}">${esc(p.name)}<i>${SLK[pSlot(p)]||posLabel(p)} ${rchip(scoutReport(p).cur)}</i></button>`).join('')}</div>`:''}`;
  const fb=d.futB.filter(p=>!p.ys||own), fp=d.futP; const fl=futLineup(fb); const fstart=GPOS.filter(k=>fl[k]).map(k=>fl[k]); const forder=orderList(fstart); const fpo={}; for(const k in fl)fpo[fl[k].id]=k;
  const fsp=[...fp].sort((a,b)=>(spV(b)+roleBias(G.user,b))-(spV(a)+roleBias(G.user,a))).slice(0,5); const fpen=fp.filter(p=>!fsp.includes(p)).sort((a,b)=>penV(b)-penV(a)).slice(0,5);
  const two=`<div class="gl-g"><div><div class="eyebrow">퓨처스 타순</div>${forder.map((p,i)=>R(p,`${i+1} ${SLK[fpo[p.id]]||''}`,'2')).join('')||'<p class="small muted">야수가 없습니다.</p>'}</div>
    <div><div class="eyebrow">퓨처스 선발</div>${fsp.map((p,i)=>R(p,`${i+1}선발`,'2')).join('')}<div class="eyebrow">퓨처스 불펜</div>${fpen.map(p=>R(p,'불펜','2')).join('')}</div></div>`;
  const away=playersOf(tid).filter(p=>!healthy(p)||isAway(p)); const awayT=away.length?`<p class="small">${away.map(p=>`${esc(p.name)}(${isAway(p)?'군 복무':`부상 ${p.injOut}일`})`).join(', ')}</p>`:'';
  const gN=own?playersOf(tid).filter(p=>(growDelta(p)||0)>=1).length:0;
  const glt=inTabs('gl'+(own?'':'o'),[...(own?[['st','현황']]:[]),['one','1군'],['two','2군'],...(own?[['plan','스쿼드 플래너']]:[])],own?'st':'one');
  if(own&&glt.cur==='st')return glt.bar+`<section class="card"><h2 class="sec">우리 팀 현황</h2>${teamStatusBox()}</section>`+(awayT?csec('빠진 선수',awayT):'')+teamGrowCard();
  if(own&&glt.cur==='plan')return glt.bar+plannerCard();
  if(glt.cur==='two')return glt.bar+csec('2군(퓨처스)',two+`<p class="small sdesc">퓨처스 라인업은 1군에 없는 선수 중 자리별로 가장 나은 선수로 짠 예상입니다.</p>`);
  return glt.bar+csec(`1군 ${own?'감독 라인업':'예상 라인업'} <span class="small muted">${G.mgr[tid]?esc(G.mgr[tid].name)+' 감독 · ':''}${entryOn()?playersOf(tid).filter(p=>p.e1).length+'명':''}</span>`,one,own?`<span class="small muted">▲▼ 올해 들어 능력 변화</span>`:''); }
/* 팀 성장 추이: 매달 1군 전력과 유망주 잠재를 기록 */
function teamGrowCard(){ const T=(G.tgrow||[]).slice(-24); if(T.length<2)return '';
  const W=320,H=70; const xs=i=>8+i*(W-16)/(T.length-1); const r1=T.map(x=>x.r1), r2=T.map(x=>x.pot); const lo=Math.min(...r1,...r2)-1, hi=Math.max(...r1,...r2)+1; const yv=v=>H-6-(v-lo)/(hi-lo)*(H-12);
  const line=(arr,c)=>`<polyline fill="none" stroke="${c}" stroke-width="2" points="${arr.map((v,i)=>`${xs(i).toFixed(1)},${yv(v).toFixed(1)}`).join(' ')}"/>`;
  const a=T[0], b=T[T.length-1];
  return csec('팀 성장 추이',`<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="팀 전력과 유망주 잠재 추이">${line(r1,'var(--tc,#e0564f)')}${line(r2,'var(--good)')}</svg>
    <div class="row between small"><span>${a.y}.${a.m}</span><span>${b.y}.${b.m}</span></div>
    <p class="small"><b style="color:var(--tc,#e0564f)">1군 전력</b> ${a.r1.toFixed(1)} → <b>${b.r1.toFixed(1)}</b> · <b style="color:var(--good)">유망주 상위 10명 잠재</b> ${a.pot.toFixed(1)} → <b>${b.pot.toFixed(1)}</b></p>`); }
function lineupCard(tid){
  const d=depth(tid); const order=orderList(d.start); const posOf={}; for(const k in d.ln)posOf[d.ln[k].id]=k; const m=G.mgr[tid];
  const row=(p,i)=>{ const pos=posOf[p.id]; const off=pos!=='DH'&&pos!==p.pos;
    return `<div class="lu" data-a="player" data-v="${p.id}" role="button" tabindex="0"><span class="lu-n">${i+1}</span>${avImg(p)}<div class="lu-m"><b>${esc(p.name)}</b><span class="lu-p"><span class="pp main${off?' off':''}">${POSS[pos]}</span>${off?`<i>본래 ${POSS[p.pos]}</i>`:''} <i>${hand(p)}</i></span><span class="lu-s">${bLine(p)}</span><span class="lu-u">${l10Text(p)?l10Text(p)+' · ':''}${useText(p)}</span></div>${tid===G.user?fatBar(p):(()=>{const r=scoutReport(p); return r.cur!=null?rchip(r.cur):'<span></span>';})()}</div>`; };
  const bench=d.bench.map(p=>`<div class="lu sm" data-a="player" data-v="${p.id}" role="button" tabindex="0">${avImg(p)}<div class="lu-m"><b>${esc(p.name)}</b><span class="lu-p">${posChips(p)}</span><span class="lu-s">${bLine(p)}</span><span class="lu-u">${useText(p)}</span></div></div>`).join('');
  return `<section class="card"><div class="row between"><h2 class="sec">${tid===G.user?'감독 라인업':'예상 라인업'}</h2><span class="small muted">${m?esc(m.name)+' 감독 · ':''}${tid===G.user&&G.policy?POL[G.policy.k].l+' 지시 · ':''}다음 경기 기준</span></div>
    <div class="lus">${order.map(row).join('')}</div>
    ${bench?`<div class="eyebrow">벤치 (대타·대수비·휴식일 선발)</div><div class="lus two">${bench}</div>`:''}
    <p class="small muted">타순과 수비 위치는 감독이 타격·수비 적합도로 정합니다. 노란 위치는 본래 포지션이 아닌 자리입니다. 출장 기록은 이번 시즌 실제 선발 기록입니다.</p></section>`;
}
function staffCard(tid){
  const d=depth(tid); const t=team(tid); const next=d.sp.length?d.sp[(t.rot||0)%d.sp.length]:null;
  const row=(p,label,hl)=>`<div class="lu${hl?' nx':''}" data-a="player" data-v="${p.id}" role="button" tabindex="0"><span class="lu-n sm">${label}</span>${avImg(p)}<div class="lu-m"><b>${esc(p.name)}</b><span class="lu-p"><i>${p.th}투</i> <i>${p.age}세</i>${hl?' <span class="pp main">다음 선발</span>':''}</span><span class="lu-s">${pLine(p)}</span>${l10Text(p)?`<span class="lu-u">${l10Text(p)}</span>`:''}</div>${tid===G.user?fatBar(p):(()=>{const r=scoutReport(p); return r.cur!=null?rchip(r.cur):'<span></span>';})()}</div>`;
  return `<section class="card"><div class="row between"><h2 class="sec">감독의 투수 운용</h2><span class="small muted">선발은 5일 간격</span></div>
    <div class="eyebrow">선발 로테이션</div><div class="lus">${d.sp.map((p,i)=>row(p,(i+1)+'선발',next&&p.id===next.id)).join('')}</div>
    <div class="eyebrow">불펜</div><div class="lus two">${d.pen.map((p,i)=>row(p,i===0?'마무리':i<4?'필승조':'추격조')).join('')}</div></section>`;
}

/* ---------- 경기 결과 확인 ---------- */
/* 중계 시점 기록: 이 경기 시작 전 누적 + 지금 타석 직전까지의 오늘 기록. 경기 결과가 미리 새지 않게 한다 */
function seasonAt(g,k,id,isP){ const p=G.players[id]; if(!p)return null; const tot=seasonTotal(p,G.year,'1군'); const z=isP?{outs:0,er:0,h:0,bb:0,so:0,hr:0}:{pa:0,ab:0,h:0,d:0,tr:0,hr:0,bb:0,so:0};
  const o=Object.assign({},z); if(tot)for(const key in z)o[key]=tot[key]||0;
  const gi=g?G.games.indexOf(g):-1; const yr=dobj(G.day).y;
  if(gi>=0)for(let i=0;i<=gi;i++){ const r=G.games[i]; if(!r||!r.box||/차전/.test(r.kind||'')||dobj(r.day).y!==yr)continue; for(const sd of ['h','a']){ const S=r.box[sd]; if(!S)continue;
      if(isP){ const q=(S.pit||[]).find(x=>x.id===id); if(q){ o.outs-=q.outs||0; o.er-=q.er||0; o.h-=q.h||0; o.bb-=q.bb||0; o.so-=q.so||0; o.hr-=q.hr||0; } }
      else { const q=(S.bat||[]).find(x=>x.id===id); if(q){ o.ab-=q.ab||0; o.h-=q.h||0; o.d-=q.d||0; o.tr-=q.tr||0; o.hr-=q.hr||0; o.bb-=q.bb||0; o.so-=q.so||0; o.pa-=(q.ab||0)+(q.bb||0); } } } }
  if(g&&g.pbp){ const L=g.pbp; let half=-1,o0=0; for(let i=0;i<k&&i<L.length;i++){ const x=L[i]; if(x[0]!==half){ half=x[0]; o0=0; } if(x[1]==='SB'||x[1]==='CS'){ o0=x[3]; continue; } if(typeof x[1]!=='number')continue;
      if(isP&&x[2]===id){ o.outs+=Math.max(0,x[4]-o0); o.er+=x[6]||0; if(x[3]==='K')o.so++; if(x[3]==='BB')o.bb++; if(['1B','2B','3B','HR'].includes(x[3]))o.h++; if(x[3]==='HR')o.hr++; }
      if(!isP&&x[1]===id){ o.pa++; if(x[3]!=='BB')o.ab++; else o.bb++; if(['1B','2B','3B','HR'].includes(x[3]))o.h++; if(x[3]==='2B')o.d++; if(x[3]==='3B')o.tr++; if(x[3]==='HR')o.hr++; if(x[3]==='K')o.so++; }
      o0=x[4]; } }
  for(const key in o)o[key]=Math.max(0,o[key]); return o; }
function eraAt(g,k,id){ const o=seasonAt(g,k,id,true); return o&&o.outs?(o.er*27/o.outs).toFixed(2):'-'; }
function batAt(g,k,id){ const o=seasonAt(g,k,id,false); if(!o||!o.pa)return null; const avg=o.ab?o.h/o.ab:0, obp=o.pa?(o.h+o.bb)/o.pa:0, slg=o.ab?(o.h+o.d+2*o.tr+3*o.hr)/o.ab:0; return {avg,ops:obp+slg,hr:o.hr}; }
function avgOpsAt(g,k,id){ const r=batAt(g,k,id); return r?`${fmt3(r.avg)} / ${fmt3(r.ops)}`:'-'; }
function seasonAvgOps(id){ const p=G.players[id]; if(!p)return ''; const h=seasonTotal(p,G.year,'1군'); if(!h||!h.pa)return '-'; const r=bRate(h); return `${fmt3(r.avg)} / ${fmt3(r.ops)}`; }
function seasonEra(id){ const p=G.players[id]; if(!p)return '-'; const h=seasonTotal(p,G.year,'1군'); return h&&h.outs?pRate(h).era.toFixed(2):'-'; }
function hBadge(id,isP){ const p=G.players[id]; if(!p)return ''; const h=isP?p.th:p.bt; if(!h)return ''; return `<em class="cc-h sm ${h==='좌'?'l':h==='양'?'s':'r'}">${h}${isP?'투':'타'}</em>`; }
function batBox(s,mine){
  const t=s.bat.reduce((a,x)=>{ for(const k of ['ab','h','d','tr','hr','rbi','r','bb','so','sb'])a[k]=(a[k]||0)+(x[k]||0); return a; },{});
  return `<div class="tw"><table class="box"><thead><tr><th class="opt">#</th><th class="stk">타자</th><th>타수</th><th class="key">안타</th><th class="opt">2루타</th><th class="opt">3루타</th><th>홈런</th><th class="key">타점</th><th>득점</th><th>볼넷</th><th>삼진</th><th class="opt">도루</th><th class="opt">시즌 타율/OPS</th></tr></thead><tbody>
    ${s.bat.map((x,i)=>`<tr class="${x.h>=3||x.hr?'hot':x.ab>=3&&!x.h?'cold':''}"><td class="opt">${i+1}</td><td class="stk"><button class="lnk" data-a="player" data-v="${x.id}">${esc(x.n)}</button> ${hBadge(x.id,false)} <span class="muted">${POSS[x.pos]||''}</span></td><td>${x.ab}</td><td class="key">${x.h}</td><td class="opt">${x.d||0}</td><td class="opt">${x.tr||0}</td><td class="${x.hr?'bhl':''}">${x.hr}</td><td class="key${x.rbi?' bhl':''}">${x.rbi}</td><td>${x.r}</td><td>${x.bb}</td><td>${x.so}</td><td class="opt">${x.sb||0}</td><td class="muted opt">${seasonAvgOps(x.id)}</td></tr>`).join('')}
    <tr class="tot"><td class="opt"></td><td class="stk">합계</td><td>${t.ab}</td><td class="key">${t.h}</td><td class="opt">${t.d}</td><td class="opt">${t.tr}</td><td>${t.hr}</td><td class="key">${t.rbi}</td><td>${t.r}</td><td>${t.bb}</td><td>${t.so}</td><td class="opt">${t.sb}</td><td class="opt"></td></tr></tbody></table></div>`;
}
function pitBox(s){
  return `<div class="tw"><table class="box"><thead><tr><th class="stk">투수</th><th></th><th class="key">이닝</th><th>투구수</th><th>피안타</th><th class="opt">피홈런</th><th>볼넷</th><th>삼진</th><th class="key">실점</th><th class="opt">시즌 ERA</th></tr></thead><tbody>
    ${s.pit.map(q=>`<tr><td class="stk"><button class="lnk" data-a="player" data-v="${q.id}">${esc(q.n)}</button> ${hBadge(q.id,true)}</td><td>${q.d?`<span class="pill ${q.d==='승'?'good':q.d==='패'?'bad':'acc'}">${q.d}</span>`:''}</td><td class="key">${ipStr(q.outs)}</td><td class="${q.pc>=100?'warn':''}">${q.pc}</td><td>${q.h}</td><td class="opt">${q.hr||0}</td><td>${q.bb}</td><td>${q.so}</td><td class="key">${q.er}</td><td class="muted opt">${seasonEra(q.id)}</td></tr>`).join('')}</tbody></table></div>`;
}
function fullBox(g,openOpp){
  const me=g.home===G.user?'h':g.away===G.user?'a':'h', op=me==='h'?'a':'h';
  const hl=[]; const ms=g.box[me];
  const star=[...ms.bat].sort((a,b)=>(b.h*2+b.hr*3+b.rbi*1.5)-(a.h*2+a.hr*3+a.rbi*1.5))[0];
  if(star&&star.h)hl.push(`${esc(star.n)} ${star.ab}타수 ${star.h}안타${star.hr?` ${star.hr}홈런`:''}${star.rbi?` ${star.rbi}타점`:''}`);
  const sp=ms.pit[0]; if(sp)hl.push(`선발 ${esc(sp.n)} ${ipStr(sp.outs)}이닝 ${sp.er}실점 ${sp.so}탈삼진${sp.d?` (${sp.d})`:''}`);
  const sv=ms.pit.find(q=>q.d==='세'); if(sv)hl.push(`${esc(sv.n)} 세이브`);
  return `${lineScore(g,null)}
    ${hl.length?`<div class="hl">${hl.map(x=>`<span>${x}</span>`).join('')}</div>`:''}
    <details class="evs"><summary class="eyebrow">득점 상황 ${g.ev.filter(e=>e.run).length}건</summary><div class="log">${g.ev.filter(e=>e.run).map(e=>`<p><span class="ticker">${Math.floor(e.h/2)+1}회${e.h%2?'말':'초'}</span> ${esc(e.t)}</p>`).join('')||'<p class="small muted">득점이 없었습니다.</p>'}</div></details>
    <div class="eyebrow">${badge(ms.tid,16)} ${tname(ms.tid)} 타자</div>${batBox(ms,true)}
    <div class="eyebrow">${tname(ms.tid)} 투수</div>${pitBox(ms)}
    <details ${openOpp?'open':''}><summary class="eyebrow" style="cursor:pointer">${badge(g.box[op].tid,16)} ${tname(g.box[op].tid)} 기록 보기</summary>${batBox(g.box[op])}${pitBox(g.box[op])}</details>`;
}
function resultCard(){
  if(!G.res)return ''; const g=G.games[G.res.i]; if(!g){G.res=null;return '';}
  const me=g.home===G.user?'h':'a'; const ms=me==='h'?g.hs:g.as, os=me==='h'?g.as:g.hs; const opp=me==='h'?g.away:g.home;
  const r=G.sea.rec[G.user]; const rk=period()==='season'?standingsNow().findIndex(x=>x.tid===G.user)+1:null;
  const n=(G.sea.ulog||[]).filter(x=>!/차전/.test(x.k)).length;
  return `<section class="card hero rescard">
    <div class="row between"><span class="eyebrow">${g.kind?esc(g.kind)+' · ':''}${dstr(g.day)}${!/차전/.test(g.kind||'')&&period()==='season'?` · 시즌 ${n}/144경기`:''}</span><span class="pill ${g.res==='승'?'good':g.res==='패'?'bad':''}">${g.res}</span></div>
    <div class="scoreline">${badge(g.away,34)}<b>${tshort(g.away)}</b><span class="num">${g.as}</span><i>:</i><span class="num">${g.hs}</span><b>${tshort(g.home)}</b>${badge(g.home,34)}</div>
    <p class="small muted" style="text-align:center;margin:0">${me==='h'?'홈':'원정'} 경기${g.inn>9?` · 연장 ${g.inn}회`:''}${rk?` · 시즌 ${r.w}승 ${r.l}패${r.t?` ${r.t}무`:''} · ${rk}위`:''}</p>
    ${fullBox(g,false)}
    <div class="btns"><button class="btn primary" data-a="resNext">확인 · 다음 경기</button><button class="btn" data-a="resOk">확인</button></div>
  </section>`;
}
function schedView(){
  const c=G.cal; const ms=[3,4,5,6,7,8,9,10]; const cm=UI.smon||Math.min(10,Math.max(3,dobj(G.day).m));
  const log=new Map((G.sea.ulog||[]).filter(x=>!/차전/.test(x.k)).map(x=>[x.d,x]));
  const days=Object.keys(c.sched).map(Number).filter(d=>dobj(d).m===cm&&c.sched[d].some(m=>m.includes(G.user))).sort((a,b)=>a-b);
  const played=(G.sea.ulog||[]).filter(x=>!/차전/.test(x.k)); const w=played.filter(x=>x.res==='승').length,l=played.filter(x=>x.res==='패').length;
  const rows=days.map(d=>{ const m=c.sched[d].find(x=>x.includes(G.user)); const home=m[0]===G.user; const op=home?m[1]:m[0]; const r=log.get(d); const gi=G.games.findIndex(g=>g.day===d);
    const o=dobj(d); return `<div class="srow${d===G.day?' today':''}${r?'':' up'}" ${gi>=0?`data-a="openGame" data-v="${gi}" role="button" tabindex="0"`:''}><span class="sd">${o.m}/${o.d} <i>${WD[o.w]}</i></span><span class="so">${home?'vs':'@'} ${badge(op,20)} ${esc(tshort(op))}</span>${r?`<span class="sr"><span class="pill ${r.res==='승'?'good':r.res==='패'?'bad':''}">${r.res}</span> <b class="num">${home?r.hs:r.as}:${home?r.as:r.hs}</b></span>`:`<span class="sr muted">${d<G.day?'-':home?'홈':'원정'}</span>`}</div>`; }).join('');
  return csec(`${G.year} 정규시즌 일정`,`<p class="small">정규시즌 144경기 중 <b>${played.length}</b>경기 · ${w}승 ${l}패${played.length-w-l?` ${played.length-w-l}무`:''} · 남은 경기 ${144-played.length}</p>
    <div class="chips">${ms.map(m=>`<button data-a="smon" data-v="${m}" class="${cm===m?'on':''}">${m}월</button>`).join('')}</div>
    <div class="sched">${rows||'<p class="small muted">이 달에는 경기가 없습니다.</p>'}</div>
    <p class="small muted">월요일은 휴식일입니다. 결과를 누르면 최근 경기의 박스스코어를 볼 수 있습니다(최근 25경기 보관). 정규시즌 1~5위가 와일드카드·준플레이오프·플레이오프·한국시리즈로 이어지는 가을야구에 나갑니다.</p>`)
   +(G.ps?csec('포스트시즌',psBody()):'');
}
function facView(){ facInit(); const F=G.fac; const t=team(G.user); const nb=Object.keys(F.bld).length;
  const league=G.teams.map(x=>({x,lv:facLv(x.id)})); const rk=league.filter(q=>q.lv>F.lv).length+1;
  const card=k=>{ const D=FACI[k], lv=F.it[k], b=F.bld[k], nx=lv+1;
    const pips=[1,2,3].map(i=>`<i class="${i<=lv?'on':''}${b&&i===b.lv?' bld':''}"></i>`).join('');
    return `<div class="tcard fci" style="cursor:default"><div class="row between" style="flex-wrap:nowrap;align-items:flex-start"><div style="min-width:0"><b>${D.l}</b><div class="small muted">${D.lv[lv]}</div></div><span class="fpip" title="${lv}/3단계">${pips}</span></div>
      <p class="dnote">${esc(D.d)}</p>
      <div class="tc-ft">${b?`<span class="pill warn">${D.lv[b.lv]} 공사 중 · ${dmd(b.done)} 완공</span>`:lv>=3?'<span class="pill good">최고 단계</span>':`<span class="small">다음: <b>${D.lv[nx]}</b> · 공사비 <b class="num">${money(D.c[nx])}</b> · ${D.days[nx]}일 · 유지비 연 ${money(D.up[nx])}</span><button class="btn small primary" data-a="buildFacItem" data-v="${k}" ${nb>=2||t.cash<D.c[nx]?'disabled':''}>공사</button>`}</div></div>`; };
  return csec('훈련·육성 시설',`<p class="small muted">실제 구단의 2군 훈련장·재활센터·트래킹 장비 투자를 항목별로 나눴습니다. 공사비는 구단 보유 자금에서 바로 나가고, 완공되면 유지비가 매년 듭니다. 공사는 동시에 2곳까지 할 수 있습니다. 성장 효과는 매년 겨울 성장 때 반영되고, 부상·회복 효과는 바로 적용됩니다.</p>
    <dl class="tsum"><div><dt>종합 등급</dt><dd>${F.lv}단계 · 리그 ${rk}위</dd></div><div><dt>연 유지비</dt><dd class="num">${money(facUpkeep())}</dd></div><div><dt>보유 자금</dt><dd class="num">${money(t.cash)}</dd></div><div><dt>공사 중</dt><dd>${nb}/2</dd></div></dl>
    ${UI.facMsg?`<div class="note bad">${esc(UI.facMsg)}</div>`:''}
    <div class="tgrid">${FACK.map(card).join('')}</div>
    <div class="eyebrow" style="margin-top:8px">성장에 영향을 주는 것</div>
    <p class="small muted">1) 출전 시간: 1군에서 많이 뛸수록 잘 큽니다(퓨처스 출전은 2군 구장 수준에 따라 60~75% 인정). 2) 시설. 3) 감독의 육성 성향. 4) 2군 연수. 선수마다 숨은 성장 유형이 있습니다.</p>`); }

/* ---------- 역사·시상 ---------- */
function histView(){
  const ys=Object.keys(G.awards||{}).map(Number).sort((a,b)=>b-a); const y=UI.hy&&G.awards&&G.awards[UI.hy]?UI.hy:ys[0];
  const A=y?G.awards[y]:null;
  const who=x=>x?`<button class="lnk" ${G.players[x.id]?`data-a="player" data-v="${x.id}"`:''}>${esc(x.name)}</button> <span class="small muted">${tshort(x.t)} · ${esc(x.line)}</span>`:'-';
  const ggName=k=>k.startsWith('OF')?'외야수':k==='P'?'투수':POSK[k];
  const aw=A?`<div class="chips">${ys.map(v=>`<button data-a="hy" data-v="${v}" class="${v===y?'on':''}">${v}</button>`).join('')}</div>
    <div class="awd"><div><span class="pill warn">MVP</span> ${who(A.mvp)}</div><div><span class="pill acc">신인왕</span> ${who(A.roy)}</div></div>
    <div class="eyebrow">골든글러브</div><div class="list">${['P','C','1B','2B','3B','SS','OF0','OF1','OF2','DH'].filter(k=>A.gg[k]).map(k=>`<div class="item" style="cursor:default"><span class="nm">${ggName(k)}</span><span class="sub">${who(A.gg[k])}</span></div>`).join('')}</div>`
    :'<p class="small muted">첫 시즌이 끝나면 시상 결과가 쌓입니다.</p>';
  const actives=Object.values(G.players).filter(p=>p.team!=null&&p.hist.some(h=>h.lvl==='1군')).map(p=>{ const c=careerOf(p); return {name:p.name,id:p.id,t:p.team,isP:p.isP,war:c.war,h:c.h,hr:c.hr,w:c.w,sv:c.sv,act:true}; });
  const all=actives.concat((G.legends||[]).map(r=>({name:r.name,isP:r.isP,war:r.war,h:r.h,hr:r.hr,w:r.w,sv:r.sv,act:false,y:r.y})));
  const board=(label,f,fmt,flt)=>`<div class="ldr"><div class="eyebrow">${label}</div>${all.filter(flt||(()=>true)).sort((a,b)=>f(b)-f(a)).slice(0,8).map((x,i)=>`<div class="ldr-r"><i>${i+1}</i><span>${x.act&&G.players[x.id]?`<button class="lnk" data-a="player" data-v="${x.id}">${esc(x.name)}</button>`:esc(x.name)} <span class="small muted">${x.act?tshort(x.t):`${x.y} 은퇴`}</span></span><b class="num">${fmt(f(x))}</b></div>`).join('')}</div>`;
  const hof=(G.hof||[]);
  const champs=G.history.filter(h=>h.champ===G.user).map(h=>h.y);
  const hv=inTabs('histv',[['sum','지난 시즌'],['aw','시상'],['ldr','통산 순위'],['hof','명예의 전당·우리 역사'],['abroad','해외파']],'sum');
  if(hv.cur==='abroad')return hv.bar+abroadView();
  if(hv.cur==='sum')return hv.bar+seasonSummary();
  if(hv.cur==='aw')return hv.bar+csec('시즌 시상',aw);
  if(hv.cur==='ldr')return hv.bar+csec('통산 기록 순위',`<p class="small muted">현역과 은퇴 선수를 함께 비교합니다(1군 기록, 이 리그 기준).</p><div class="ldrs">${board('WAR',x=>x.war,v=>v.toFixed(1))}${board('안타',x=>x.h||0,v=>v,x=>!x.isP)}${board('홈런',x=>x.hr||0,v=>v,x=>!x.isP)}${board('승',x=>x.w||0,v=>v,x=>x.isP)}${board('세이브',x=>x.sv||0,v=>v,x=>x.isP)}</div>`);
  return hv.bar+csec(`명예의 전당 ${hof.length}명`,hof.length?`<div class="list">${hof.map(r=>`<div class="item" style="cursor:default"><span class="nm"><b>${esc(r.name)}</b> <span class="small muted">${r.pos} · ${r.y} 은퇴 · ${r.seasons}시즌</span></span><span class="sub">WAR ${r.war}${r.isP?` · ${r.w}승 ${r.sv}세이브 ${r.so}탈삼진`:` · ${r.h}안타 ${r.hr}홈런 ${r.rbi}타점`}${r.mvp?` · MVP ${r.mvp}회`:''}${r.gg?` · 골든글러브 ${r.gg}회`:''}</span></div>`).join('')}</div>`:'<p class="small muted">아직 헌액자가 없습니다. 통산 WAR 38 이상, MVP 2회, 골든글러브 6회 등을 남기고 은퇴한 선수가 오릅니다(게임 기준).</p>')
   +csec(`${tshort(G.user)} 역사`,`<p class="small">우승: ${champs.length?champs.join(', '):'아직 없음'}</p><p class="small">영구결번: ${(G.retNos||[]).length?(G.retNos||[]).map(r=>`${r.no}번 ${esc(r.name)}`).join(', '):'없음'}</p>`);
}

/* ---------- 트레이드 블록 ---------- */
/* 트레이드 블록 센터: 받은 제안 → 우리 블록 → 리그 블록. 블록끼리 맞교환 후보를 바로 보여 준다 */
function blockCenter(){ const open=tradeOpen(); const OS=(G.offers||[]);
  const mine=domestic(G.user).filter(p=>p.listed); const f=UI.blkF||'all';
  const ai=Object.values(G.players).filter(p=>p.aiListed&&p.team!=null&&p.team!==G.user).filter(p=>f==='all'||(f==='urg'&&p.aiUrg)||(f==='p'&&p.isP)||(f==='b'&&!p.isP)).sort((a,b)=>(b.aiUrg?1:0)-(a.aiUrg?1:0)||ovr(b)-ovr(a));
  const sw={}; if(open)for(const q of ai)for(const m of mine){ try{ const e=evalTrade(q.team,[m.id],[q.id]); if(e.ok){ (sw[q.id]=sw[q.id]||[]).push(m); } }catch(err){} }
  const pRow=(p,right,extra)=>`<div class="bk-r">${avImg(p)}<button class="bk-m" data-a="player" data-v="${p.id}"><b>${esc(p.name)}</b><i>${posLabel(p)} · ${p.age}세 · ${esc(tContract(p))}</i>${extra||''}</button><span class="bk-o">${rchip(Math.round(scoutReport(p).cur))}<em>${money(p.sal)}</em></span>${right||''}</div>`;
  const offs=OS.map(o=>{ const t=team(o.from); const nm=ids=>ids.map(id=>G.players[id]?`${esc(G.players[id].name)} ${rchip(Math.round(scoutReport(G.players[id]).cur))}`:'').join(' · ');
    return `<div class="bk-of">${badge(o.from,24)}<div class="bk-om"><b>${esc(tshort(o.from))}${o.blk?' · 블록 제안':''}</b><span>받기 ${nm(o.give)}</span><span>주기 ${nm(o.get)}</span><i>${dmd(o.exp)}까지${gmHeat(o.from)>=.4?' · 단장이 급합니다':''}</i></div><div class="bk-ob"><button class="btn small primary" data-a="offerYes" data-v="${o.id}">수락</button>${o.blk?`<button class="btn small" data-a="offerMore" data-v="${o.id}" ${o.more?'disabled':''}>더 올려 달라</button>`:''}<button class="btn small" data-a="offerNo" data-v="${o.id}">거절</button></div>${UI.blkMsg&&UI.blkMsg.id===o.id?`<div class="note">${esc(UI.blkMsg.t)}</div>`:''}</div>`; }).join('');
  const cand=domestic(G.user).filter(p=>!p.listed&&!p.ys&&!(p.joinY>G.year)).sort((a,b)=>ovr(b)-ovr(a));
  const mineRows=mine.map(p=>{ const n=OS.filter(o=>o.get.includes(p.id)).length; return pRow(p,`<div class="bk-c"><select data-a="blkWant" data-v="${p.id}" aria-label="원하는 대가">${Object.entries(WANT).map(([k,l])=>`<option value="${k}" ${(p.lw||'any')===k?'selected':''}>${l}</option>`).join('')}</select><button class="bk-u${p.urgent?' on':''}" data-a="blkUrg" data-v="${p.id}">${p.urgent?'급매 중':'급매'}</button><button class="tc-i" data-a="blkOff" data-v="${p.id}">내리기</button></div>`,n?`<span class="pill acc">제안 ${n}건</span>`:''); }).join('');
  const aiRowsA=ai.map(p=>{ const days=G.day-(p.aiLd||G.day); const s2=sw[p.id]||[];
    return pRow(p,`<div class="bk-c"><button class="btn small primary" data-a="toTrade" data-v="${p.id}">제안하기</button>${s2.length?`<button class="btn small" data-a="blkSwap" data-v="${p.id}:${s2[0].id}">${esc(s2[0].name)}과(와) 맞교환</button>`:''}</div>`,`<span class="bk-t">${badge(p.team,14)} ${esc(tshort(p.team))}${p.aiUrg?' <em class="bk-urg">급매</em>':''} <span class="pill">${BLKWHY[p.aiWhy]||'매물'}</span> <span class="small muted">${days}일째</span></span>${s2.length?`<span class="small good">우리 블록 ${esc(s2.map(m=>m.name).join(', '))}와(과) 맞교환 가능</span>`:''}`); });
  const PGb=pager('blk'+f,aiRowsA,8);
  const bt=inTabs('blkv',[['off',`받은 제안 ${OS.length}`],['mine',`우리 블록 ${mine.length}`],['lg',`리그 블록 ${ai.length}`]],OS.length?'off':'lg');
  return `${!open?'<div class="note">지금은 트레이드 기간이 아닙니다. 블록 정리는 미리 해 둘 수 있습니다.</div>':deadlineBanner()}`+bt.bar+(bt.cur==='off'?`  <section class="card"><div class="row between"><h2 class="sec">받은 제안 ${OS.length}건</h2></div>${offs||'<p class="small muted">받은 제안이 없습니다. 블록에 선수를 올리면 관심 있는 구단이 제안을 보냅니다.</p>'}</section>`:bt.cur==='mine'?`  <section class="card"><div class="row between"><h2 class="sec">우리 블록 ${mine.length}명</h2></div>
    ${mineRows||'<p class="small muted">블록에 올린 선수가 없습니다.</p>'}
    <div class="row" style="gap:6px;margin-top:6px"><select id="blkAddSel" aria-label="블록에 올릴 선수">${cand.map(p=>`<option value="${p.id}">${esc(p.name)} · ${posLabel(p)} · ${Math.round(ovr(p))} · ${money(p.sal)}</option>`).join('')}</select><button class="btn small" data-a="blkAdd">블록에 올리기</button></div>
    <p class="small muted keep">급매로 표시하면 제안이 더 자주 오지만, 상대도 우리가 급한 걸 알고 조금 덜 줍니다.</p></section>`:`  <section class="card"><div class="row between"><h2 class="sec">리그 블록 ${ai.length}명</h2><div class="chips">${[['all','전체'],['urg','급매'],['p','투수'],['b','야수']].map(([k,l])=>`<button data-a="blkF" data-v="${k}" class="${f===k?'on':''}">${l}</button>`).join('')}</div></div>
    ${PGb.items.join('')||'<p class="small muted">조건에 맞는 매물이 없습니다.</p>'}${PGb.bar}
    <p class="small muted keep">블록에 오른 선수는 그 구단이 정리하고 싶은 선수라 시세보다 싸게 거래됩니다. 급매는 더 쌉니다. 블록은 최대 6주 동안 유지됩니다.</p></section>`); }
function blockView(){
  const mine=domestic(G.user).filter(p=>p.listed);
  const offs=(G.offers||[]).filter(o=>o.blk);
  const offCard=o=>{ const t=team(o.from); const p=G.players[o.get[0]]; if(!p)return '';
    return `<section class="card blkoff"><div class="row between"><div class="row">${badge(t.id,28)}<div><b>${tname(t.id)}</b><div class="small muted">관계 ${t.rel} · ${dmd(o.exp)}까지${o.more?' · 조건 조정 끝':''}</div></div></div><span class="small">→ <b>${esc(p.name)}</b> 영입 희망</span></div>
      <div class="eyebrow">받는 선수</div><div class="tgrid">${o.give.map(id=>G.players[id]?pcard(G.players[id],{foot:rosterFoot(G.players[id])}):'').join('')}</div>
      <div class="btns"><button class="btn primary" data-a="offerYes" data-v="${o.id}">수락</button><button class="btn" data-a="offerMore" data-v="${o.id}" ${o.more?'disabled':''}>조건 더 올려 달라</button><button class="btn" data-a="offerNo" data-v="${o.id}">거절</button></div>
      ${UI.blkMsg&&UI.blkMsg.id===o.id?`<div class="note">${esc(UI.blkMsg.t)}</div>`:''}</section>`; };
  const ai=Object.values(G.players).filter(p=>p.aiListed&&p.team!=null&&p.team!==G.user);
  return csec('우리 매물',`<p class="small muted">선수를 블록에 올리고 원하는 대가를 정하면, 관심 있는 구단이 매주 제안을 보냅니다. 제안마다 한 번은 "조건을 더 올려 달라"고 할 수 있습니다. 대신 거절하고 제안을 거둬 갈 수도 있습니다. 블록에 올린 선수는 자기가 매물이라는 걸 압니다.${tradeOpen()?'':' <b>지금은 트레이드 기간이 아닙니다.</b>'}</p>
      ${mine.length?`<div class="tgrid">${mine.map(p=>pcard(p,{foot:`${rosterFoot(p)}<select data-a="blkWant" data-v="${p.id}" aria-label="원하는 대가">${Object.entries(WANT).map(([k,l])=>`<option value="${k}" ${(p.lw||'any')===k?'selected':''}>${l}</option>`).join('')}</select><button class="tc-i" data-a="blkOff" data-v="${p.id}">내리기</button>`})).join('')}</div>`:'<p class="small muted">블록에 올린 선수가 없습니다. 선수 상세에서 "트레이드 블록에 올리기"를 누르세요.</p>'}`)
   +csec(`받은 제안 ${offs.length}건`,offs.length?offs.map(offCard).join(''):'<p class="small muted">아직 제안이 없습니다.</p>')
   +csec('다른 구단 매물',ai.length?`<p class="small muted">다른 구단이 내놓은 선수입니다. 리빌딩 구단은 베테랑을, 우승 경쟁 구단은 자리가 없는 유망주를 내놓습니다. 매물로 나온 선수는 구단이 정리하고 싶은 선수라 시세보다 훨씬 싸게 데려올 수 있습니다. 그 구단이 관심 있는 우리 선수를 함께 보내면 더 쉽게 성사됩니다.</p><div class="tgrid">${ai.map(p=>pcard(p,{sub:`${tshort(p.team)} · ${posLabel(p)} · ${p.age}세 · ${hand(p)}`,tags:`<span class="pill warn">${esc(listWant(p))}</span>`,foot:`${intLine(p.team,true)}${rosterFoot(p)}<button class="tc-i go" data-a="toTrade" data-v="${p.id}">트레이드 테이블</button>`})).join('')}</div>`:'<p class="small muted">이번 주에 나온 매물이 없습니다.</p>');
}
function negPanel(p){ const F=G.fa; if(!F||!F.neg)return ''; const n=F.neg[p.id]; const ag=agentOf(p);
  const log=n?n.log.slice(-8).map(x=>x.w==='구단'?`<div class="chat me"><span>우리 제안</span><b>${x.y}년 연 ${money(x.a)}${x.acc?' (역제안 수락)':''}</b></div>`:`<div class="chat ag"><span>${esc(ag.name)}</span><p>${esc(x.t)}</p></div>`).join(''):'';
  return `<section class="card"><div class="row between"><span class="eyebrow">에이전트 협상 · ${esc(ag.name)} (${esc(ag.firm)})</span><span class="small muted">${ag.style==='hard'?'깐깐한 협상가':ag.style==='soft'?'유연한 편':'보통'}${n?` · 협상 ${n.rounds}/4회 · 분위기 ${n.mood}`:''}</span></div>
    ${n?`<span class="gauge"><i style="width:${n.mood}%;background:${n.mood>=60?'var(--good)':n.mood>=35?'var(--warn)':'var(--bad)'}"></i></span>`:''}
    ${log?`<div class="chats">${log}</div>`:'<p class="small muted">아직 제안하지 않았습니다. 조건을 내면 에이전트가 바로 답합니다. 너무 낮은 조건을 계속 내면 협상이 깨집니다.</p>'}
    ${n&&n.counter?`<div class="row"><button class="btn primary" data-a="faAccept" data-v="${p.id}">역제안 수락 (${n.counter.years}년 연 ${money(n.counter.annual)})</button></div>`:''}
    ${n&&n.closed?'<div class="note bad">에이전트가 우리와의 협상을 끝냈습니다.</div>':''}</section>`; }

/* ---------- 구단주·목표, 언론·여론 ---------- */
function gauge(v,lo,hi){ const c=v>=hi?'var(--good)':v<=lo?'var(--bad)':'var(--warn)'; return `<span class="gauge"><i style="width:${clamp(v,0,100)}%;background:${c}"></i></span>`; }
function milView(){
  const mine=domestic(G.user); const free=mine.filter(p=>milFree(p)).sort((a,b)=>b.age-a.age); const serving=awayOf(G.user).filter(p=>p.mil&&p.mil.until>G.day);
  const pending=Object.values(G.players).filter(p=>p.team===G.user&&p.mil&&p.mil.until&&p.mil.from>G.day);
  const w=sangmuWave();
  const card=p=>pcard(p,{sub:`${p.age}세 · ${esc(milText(p))}`,tags:p.age>=27&&milFree(p)?'<span class="pill bad">올해 입대해야 함</span>':'',foot:`${rosterFoot(p)}${milFree(p)&&!(p.mil&&p.mil.app)?`${w&&p.age<=27?`<button class="tc-i go" data-a="sangmu" data-v="${p.id}">상무 지원</button>`:''}<button class="tc-i" data-a="enlist" data-v="${p.id}">현역 입대</button>`:''}`});
  const oy=[0,1,2,3,4].map(k=>G.year+k).find(olyYear);
  return csec('병역 관리',`<p class="small muted">국내 선수는 군 복무를 해야 합니다. 상무(국군체육부대)는 1년 6개월 동안 퓨처스리그에서 뛰며 기량을 유지하고, 현역은 야구를 거의 못 해 기량이 떨어집니다. 상무는 지원자 중 기량 순으로 한 번에 ${SANGMU_SLOTS}명만 합격합니다. 28세가 되는 해까지 입대하지 않으면 현역으로 갑니다(게임 규칙). 복무 중인 선수는 로스터에서 빠졌다가 전역하면 돌아옵니다.</p>
    <dl class="tsum"><div><dt>미필</dt><dd class="num">${free.length}명</dd></div><div><dt>복무 중</dt><dd class="num">${serving.length}명</dd></div><div><dt>상무 지원</dt><dd>${w?(w==='dec'?'지금 가능 · 12월 입대':'지금 가능 · 6월 입대'):'3~4월, 9~10월'}</dd></div></dl>
    ${UI.milMsg?`<div class="note">${esc(UI.milMsg)}</div>`:''}`)
   +(serving.length||pending.length?csec('복무 중 · 입대 예정',`<div class="tgrid">${serving.concat(pending).map(p=>pcard(p,{sub:`${p.age}세`,tags:`<span class="pill ${p.mil.unit==='상무'?'good':'warn'}">${p.mil.unit}</span>`,stat:esc(milText(p)),foot:rosterFoot(p)})).join('')}</div>`):'')
   +csec('미필 선수',free.length?`<div class="tgrid">${(UI.milAll?free:free.slice(0,8)).map(card).join('')}</div>${free.length>8?`<button class="btn block" data-a="milAll" style="margin-top:8px">${UI.milAll?'접기':`나머지 ${free.length-8}명 더 보기 (나이 어린 순)`}</button>`:''}`:'<p class="small muted">미필 선수가 없습니다.</p>')
   +csec('올림픽',`<p class="small">${oy?`다음 올림픽 야구: <b>${oy}년 7월</b>${oy===2028?' (LA, 다저스타디움, 6개국)':' (게임 가정)'}`:'예정 없음'}. 6월 10일에 KBO 선수 24명이 대표로 뽑히고, 7월 13~22일 팀을 떠납니다. 동메달 이상이면 대표팀의 미필 선수는 체육요원으로 병역 특례를 받습니다. 아시안게임 특례는 넣지 않았습니다.</p>${G.oly&&G.oly.res?`<p class="small muted">${G.oly.y} 결과: ${G.oly.res}</p>`:''}`);
}
function ownerView(){
  prInit(); const t=team(G.user); const s=goalStatus(); const g=G.goals; const ow=OWNER[t.owner];
  const row=(label,cur,tgt,ok,pct,note)=>`<div class="goal ${ok==null?'':ok?'ok':'ng'}"><div class="row between"><b>${label}</b><span class="pill ${ok==null?'':ok?'good':'bad'}">${ok==null?'시즌 전':ok?'달성 중':'미달'}</span></div><div class="row between small"><span>현재 ${cur}</span><span class="muted">목표 ${tgt}</span></div>${pct!=null?`<span class="gauge"><i style="width:${clamp(pct,2,100)}%;background:${ok?'var(--good)':'var(--warn)'}"></i></span>`:''}${note?`<p class="small muted">${note}</p>`:''}</div>`;
  const goals=s?`${row('정규시즌 순위',s.rank.cur?s.rank.cur+'위':'-',s.rank.t+'위 이내',s.rank.cur?s.rank.ok:null,s.rank.cur?(11-s.rank.cur)/(11-s.rank.t)*100:null,'')}
    ${row('재정(모기업 적자 보전)',Math.round(s.sup.cur*100)+'% 예상',Math.round(s.sup.t*100)+'% 이하',s.sup.ok,s.sup.t/Math.max(.01,s.sup.cur)*100,'연봉·운영비와 예상 관중·광고 수입으로 추정한 값입니다. 결산 때 실제 금액으로 다시 평가합니다.')}
    ${row('팬 여론',s.fan.cur,s.fan.t+' 이상',s.fan.ok,s.fan.cur/s.fan.t*100,'')}
    ${s.youth?row('육성',`${s.youth.cur}명`,'24세 이하 주전급 1명 이상',s.youth.ok,s.youth.cur*100,'규정 타석의 절반(223타석) 또는 80이닝 이상'):''}`
    :'<p class="small muted">시즌 목표는 개막일에 구단주가 정합니다.</p>';
  const log=(G.ownerLog||[]).map(x=>`<div class="olog"><span class="pill ${x.mood==='만족'?'good':x.mood==='관망'?'':'bad'}">${x.m}월 ${x.mood}</span><p class="small">${esc(x.txt)}</p><span class="small muted">신뢰 ${x.trust} (${x.delta>=0?'+':''}${x.delta})</span></div>`).join('');
  return csec('구단주와 시즌 목표',`<div class="row between"><div><b>구단주 성향: ${ow.label}</b><p class="small muted">${ow.msg}</p></div><div class="trustbox"><span class="small muted">구단주 신뢰</span><b class="num">${t.trust}</b>${gauge(t.trust,25,60)}</div></div>
    ${t.trust<25?'<div class="note bad">신뢰가 매우 낮습니다. 시즌이 끝날 때 12 아래로 떨어지면 경질됩니다.</div>':''}
    <div class="goals">${goals}</div>
    <p class="small muted">구단주는 매달 말 보고를 받고 순위·여론·언론·재정을 함께 봅니다. 시즌이 끝나면 목표 달성 여부와 언론 논조가 신뢰에 크게 반영됩니다. 성향에 따라 무엇을 더 중시하는지가 다릅니다.</p>`)
   +(log?csec('월간 보고 기록',`<div class="ologs">${log}</div>`):'');
}
function mediaView(){
  prInit(); const P=G.pr; const f=Math.round(P.fan), pr=Math.round(P.press);
  const hist=P.hist.slice(-12);
  const chart=hist.length?`<div class="prchart">${hist.map(x=>`<div><i class="f" style="height:${x.fan*.8}px"></i><i class="p" style="height:${x.press*.8}px"></i><span>${x.m.split('.')[1]}</span></div>`).join('')}</div><p class="small muted"><span class="lg f"></span>팬 여론 <span class="lg p"></span>언론 논조 (월말 기준)</p>`:'';
  const items=(G.news||[]).slice(0,8).map(n=>`<div class="news ${n.v>=2?'pos':n.v<=-2?'neg':''}"${n.ref!=null&&G.players[n.ref]?` data-a="player" data-v="${n.ref}" role="button" tabindex="0"`:''}><div class="row between"><span class="small muted">${esc(n.o)} · ${dsh(n.d)}</span><span class="tone">${n.v>0?'+'.repeat(Math.min(3,n.v)):n.v<0?'−'.repeat(Math.min(3,-n.v)):'·'}</span></div><b>${lk(n.t)}</b><p class="small">${lk(n.b)}</p></div>`).join('');
  return csec('여론 현황',`<dl class="tsum"><div><dt>팬 여론</dt><dd class="num">${f}</dd>${gauge(f,40,60)}</div><div><dt>언론 논조</dt><dd class="num">${pr}</dd>${gauge(pr,40,60)}</div><div><dt>구단 인기</dt><dd class="num">${Math.round(team(G.user).pop*100)}</dd></div></dl>
    ${chart}<p class="small muted">팬 여론은 관중 수입과 광고·상품 수입을 움직이고, 언론 논조는 스폰서와 구단주 평가에 영향을 줍니다. 승패, 연승·연패, 트레이드·FA 평가, 신인 활약, 외국인 부진, 감독·선수의 불만 표출이 기사가 됩니다.</p>`)
   +csec('우리 구단 기사',items?`<div class="newslist">${items}</div>`:'<p class="small muted">아직 기사가 없습니다.</p>',`<button class="btn small" data-a="go" data-v="league:news">리그 전체 뉴스</button>`);
}
function headlinesCard(){ const ns=(G.news||[]).slice(0,3); if(!ns.length)return '';
  return `<section class="card"><div class="row between"><h2 class="sec">오늘의 기사</h2><button class="btn small" data-a="go" data-v="club:media">전체 보기</button></div>${ns.map(n=>`<div class="news sm ${n.v>=2?'pos':n.v<=-2?'neg':''}"><span class="small muted">${esc(n.o)} · ${dsh(n.d)}</span><b>${esc(n.t)}</b></div>`).join('')}</section>`; }

/* ---------- 카드 공용 ---------- */
function rosterFoot(p){ const m=p.mor??60; const own=p.team===G.user;
  return `<span class="pc-sal"><b class="num">${money(p.sal)}</b> ${p.foreign?(p.foreign==='아시아'?'아시아쿼터':'외국인'):tContract(p)}</span>${p.injOut>0?`<span class="pill bad">부상 ${p.injOut}일</span>`:''}${p.listed?'<span class="pill warn">트레이드 명단</span>':''}${own?`<span class="mood" style="--c:${m>=65?'var(--good)':m>=45?'var(--r50)':m>=30?'var(--warn)':'var(--bad)'}" title="기분: ${moodLabel(m)}"></span>`:''}`; }
function cgrid(ps,o){ o=o||{}; return `<div class="tgrid">${ps.map(p=>pcard(p,Object.assign({foot:rosterFoot(p)},typeof o==='function'?o(p):o))).join('')}</div>`; }
function sqCards(groups){
  return groups.filter(g=>g[1].length).map(([g,arr,posf])=>`<div class="grp-h"><span>${g}</span><i>${arr.length}명</i></div>${cgrid(arr,p=>({sub:`${posf&&p.isP?posf(p)+' · ':''}${p.age}세 · ${hand(p)}`}))}`).join('');
}
function trimCard(){
  const n=rosterN(G.user); if(n<=ROSTER_MAX)return '';
  const over=n-ROSTER_MAX; const c=trimCands(over+4);
  return `<section class="card hero"><div class="row between"><h2 class="sec">로스터 정리</h2><span class="pill bad">${n}/${ROSTER_MAX} · ${over}명 초과</span></div>
    <p class="small">개막 전까지 ${ROSTER_MAX}명 이하로 줄여야 합니다. 아래는 코치진이 꼽은 방출 후보(현재 기량과 성장 여지가 낮은 순)입니다. FA·다년계약 선수를 방출하면 남은 계약의 절반을 정산합니다. 연봉 1억 원 이하 선수는 방출 대신 육성선수(정식 로스터 밖, 최대 15명)로 돌릴 수 있습니다.</p>
    <div class="tgrid">${c.map(p=>pcard(p,{foot:`${rosterFoot(p)}${!p.faC&&p.sal<=100&&ysN(G.user)<YS_MAX?`<button class="tc-i" data-a="ysNow" data-v="${p.id}">육성 전환</button>`:''}<button class="tc-i" data-a="relNow" data-v="${p.id}">방출${p.faC?` (정산 ${money(Math.round(p.sal*p.yrs*.5))})`:''}</button>`})).join('')}</div>
    <button class="btn danger" data-a="autoTrim">추천대로 ${over}명 방출</button></section>`;
}
function teamCard(t){
  const live=period()==='season'||period()==='post'; const st=live?standingsNow():(G.history[G.history.length-1]||{}).order||[];
  const rk=st.findIndex(o=>o.tid===t.id)+1; const rec=st.find(o=>o.tid===t.id);
  const top=playersOf(t.id).map(p=>({p,v:ovr(p)})).sort((a,b)=>b.v-a.v).slice(0,3).map(x=>x.p);
  const m=G.mgr[t.id]; const ci=capInfo(t.id); const me=t.id===G.user;
  return `<div class="tcard teamc${me?' me':''}" data-a="${me?'tab':'lteam'}" data-v="${me?'roster':t.id}" role="button" tabindex="0" style="--th:${tpal(t)[0]}">
    <div class="tc-top">${badge(t.id,46)}<div class="tc-id"><b>${esc(t.city)} ${esc(t.nick)}</b><span>${rk?`${live?'현재':'지난 시즌'} ${rk}위 · ${rec.w}승 ${rec.l}패${rec.t?` ${rec.t}무`:''}`:''}</span></div>
      <div class="tc-rt"><div><span>전력</span>${(()=>{const k=[...G.teams].sort((x,y)=>teamRating(y.id)-teamRating(x.id)).findIndex(x=>x.id===t.id)+1; return `<b class="rc" style="--c:${k<=2?'var(--r65)':k<=5?'var(--r55)':k<=8?'var(--r45)':'var(--r35)'}">${k}위</b>`;})()}</div></div></div>
    <div class="tc-arch"><span class="pill ${t.mode==='contend'?'good':'warn'}">${t.mode==='contend'?'우승 경쟁':'리빌딩'}</span><span class="pill">구단주 ${OWNER[t.owner].label}</span>${me?'<span class="pill acc">우리 구단</span>':''}</div>
    <div class="teamc-top">${top.map(p=>`<span>${avImg(p)}<b>${esc(p.name)}</b><i>${posLabel(p)}</i></span>`).join('')}</div>
    <dl class="tsum"><div><dt>감독</dt><dd>${m?esc(m.name):'공석'}</dd></div><div><dt>캡 산정액</dt><dd class="num" style="color:${ci.over?'var(--bad)':'inherit'}">${money(ci.pay)}</dd></div><div><dt>${me?'자금':'단장 관계'}</dt><dd class="num">${me?money(t.cash):t.rel}</dd></div></dl>
    ${me?'':`<div class="tc-ft"><span class="relbar"><i style="width:${t.rel}%"></i></span><button class="tc-i go" data-a="tpartnerGo" data-v="${t.id}">트레이드</button></div>`}
  </div>`;
}
function scoutCard(s,btn){
  return `<div class="tcard" style="cursor:default"><div class="tc-top">${avImg({id:s.fid??s.id,name:s.name,team:null,mor:66})}<div class="tc-id"><b>${esc(s.name)}${obTag(s.ob)}</b><span>${SROLE[s.role||'am']} · ${(s.role==='intl'?IREG[s.region].l:s.region)} 담당 · 연봉 ${money(s.sal)}</span></div>
    <div class="tc-rt"><div><span>능력</span><b class="stars">${'★'.repeat(s.skill)}<i>${'★'.repeat(5-s.skill)}</i></b></div></div></div>
    <p class="dnote">${['','오차가 매우 큽니다.','오차가 큰 편입니다.','평균적인 눈썰미입니다.','정확한 편입니다. 면담 평가도 가능합니다.','리그 최고 수준의 눈입니다.'][s.skill]}${s.skill>=3?' 담당 지역 선수 면담 평가를 받을 수 있습니다.':''}</p>
    <div class="tc-ft">${btn}</div></div>`;
}

/* ---------- 신인 드래프트 보드 ---------- */
const DPOS={all:'전체',P:'투수',C:'포수',IF:'내야',OF:'외야'};
function dposOf(p){ return p.isP?'P':p.pos==='C'?'C':['1B','2B','3B','SS'].includes(p.pos)?'IF':'OF'; }
function dval(rp){ return (rp.ofp??rp.cur+6)+rp.cur*.2; }
function draftPool(){ const live=G.draft&&!G.draft.done; return ((live?G.draft.cls:G.draftClass)||[]).map(id=>G.players[id]).filter(p=>p&&p.prospect); }
function dcard(p,rp,rk,mine){
  const star=(G.shortlist||[]).includes(p.id);
  const gap=rp.ofp!=null&&p.press?p.press-rk:0;
  const tags=`${G.draftPol&&G.draftPol.y===G.year&&draftFit(p,G.draftPol.k)?'<span class="pill acc">감독 추천</span>':''}<span class="pill ${rk<=10?'good':''}">스카우트 #${rk}</span><span class="pill">언론 #${p.press||'-'}</span>${gap>=25?'<span class="pill good">숨은 진주</span>':gap<=-25?'<span class="pill warn">과대평가 주의</span>':''}${p.amInj?'<span class="pill bad">부상 이력</span>':''}`;
  const sc=rp.sc?esc(rp.sc.name):'';
  const note=rp.notes[1]||rp.notes[0];
  return `<div class="tcard dcard${star?' star':''}" data-a="player" data-v="${p.id}" role="button" tabindex="0">
    <div class="tc-top">${avImg(p)}<div class="tc-id"><b>${esc(p.name)}</b><span>${esc(p.school||'')} · ${p.college?'대학 4년':'고교 3년'}</span><span>${posLabel(p)} · ${p.ht||'-'}cm ${p.wt||'-'}kg · ${hand(p)}</span></div>
</div>
    <div class="tc-arch">${tags}</div>
    <div class="tc-arch">${posChips(p)}<span class="pill acc">${esc(rp.arch)}</span>${rp.role?`<span class="small muted">장래 ${esc(rp.role)}</span>`:'<span class="small muted">장래성 판단 불가</span>'}</div>
    ${statCells(p)}
    <div class="tc-st">${p.college?'대학 4년':'고교 3년'} ${p.am?p.am.g:0}경기 · ${p.isP?`${p.am?p.am.so:0}탈삼진 ${p.am?p.am.bb:0}볼넷`:`${p.am?p.am.pa:0}타석 ${p.am?p.am.bb:0}볼넷 ${p.am?p.am.so:0}삼진`} · ${p.ht||'-'}cm ${p.wt||'-'}kg</div>
    ${amNotes(p)[0]?`<p class="dnote st"><b>기록</b> ${esc(amNotes(p)[0])}</p>`:''}
    <p class="dnote"><b>${sc?sc+' 스카우트':'스카우트 없음'}</b> ${esc(note)}${p.amInj?` <span class="bad-t">${esc(p.amInj)}.</span>`:''}</p>
    <div class="tc-ft"><span class="pill ${rp.risk==='높음'?'bad':rp.risk==='낮음'?'good':''}">위험도 ${rp.risk}</span><span>${p.region}</span>
      <button class="tc-i${star?' on':''}" data-a="star" data-v="${p.id}" aria-pressed="${star}">${star?'★ 관심':'☆ 관심'}</button>${mine?`<button class="tc-i go" data-a="pick" data-v="${p.id}">지명</button>`:''}</div>
  </div>`;
}
function draftBoard(){
  const live=G.draft&&!G.draft.done; const d=G.draft; const pk=live?d.picks[d.cur]:null; const mine=!!(pk&&pk.tid===G.user);
  const pool=draftPool();
  if(!pool.length&&!live)return csec('신인 드래프트',`<p class="small muted">올해 드래프트는 끝났습니다. 다음 해 참가 선수 명단은 새해에 나옵니다.</p>`)+(d&&d.done?draftResults():'');
  const all=pool.map(p=>({p,rp:scoutReport(p)})).sort((a,b)=>dval(b.rp)-dval(a.rp)); all.forEach((x,i)=>x.rk=i+1);
  const f=UI.df||(UI.df={pos:'all',typ:'all',reg:'all',star:false,sort:'rk',seg:'board',more:20});
  const noScout=REG.filter(r=>!G.scouts.some(s=>s.region===r));
  let head;
  if(live){
    const myLeft=d.picks.slice(d.cur).filter(x=>x.tid===G.user).length;
    const recent=d.picks.slice(Math.max(0,d.cur-8),d.cur).reverse();
    const firstStar=(G.shortlist||[]).map(id=>G.players[id]).find(p=>p&&p.prospect);
    const proj=rosterProj(G.user); const cut=trimCands(1)[0]; const crp=cut?scoutReport(cut):null;
    head=`<section class="card hero dhead"><div class="row between"><span class="eyebrow">${d.y||G.year} 신인 드래프트 · ${DRAFT_ROUNDS}라운드 ${d.picks.length}명</span><span class="small muted">우리 남은 지명 ${myLeft}번</span></div>
      <div class="cap-line"><span>정식 로스터 ${rosterN(G.user)}명 + 이번 지명 ${draftedBy(G.user)}명 = <b style="color:${proj>=ROSTER_MAX?'var(--bad)':proj>=ROSTER_MAX-3?'var(--warn)':'var(--good)'}">${proj}</b> / ${ROSTER_MAX}</span>${proj>=ROSTER_MAX&&cut?`<span class="small">더 뽑으면 개막 전 방출이 필요합니다. 1순위 정리 후보: <button class="lnk" data-a="player" data-v="${cut.id}">${esc(cut.name)}</button> (${posLabel(cut)} · ${cut.age}세 · 현재 ${crp.cur} / 장래 ${crp.ofp??'?'})</span>`:''}</div>
      <div class="row">${badge(pk.tid,40)}<div><div class="dnow">${pk.rd}라운드 ${pk.no}순위</div><div class="small ${mine?'':'muted'}">${mine?'<b>우리 차례입니다.</b> 카드의 지명 버튼으로 고르세요.':tname(pk.tid)+' 차례'}</div></div></div>
      <div class="row">${mine?`${firstStar?`<button class="btn primary" data-a="pick" data-v="${firstStar.id}">관심 1순위 ${esc(firstStar.name)} 지명</button>`:''}<button class="btn" data-a="autoPick">스카우트 추천 지명</button>${pk.rd>=3?'<button class="btn" data-a="passPick">이번 지명 건너뛰기</button>':''}`:`<button class="btn primary" data-a="advDraft" ${UI.dl&&UI.dl.on?'disabled':''}>${UI.dl&&UI.dl.on?'다른 구단 지명 중…':'다른 구단 지명 보기'}</button>`}</div>
      ${dliveBox('am')}
      ${recent.length&&!(UI.dl&&UI.dl.kind==='am'&&UI.dl.feed&&UI.dl.feed.length)?`<div class="dlog">${recent.map(x=>{const q=G.players[x.pid]; return `<span>${badge(x.tid,18)}<i>${x.rd}-${x.no}</i>${x.pass?'<em>건너뜀</em>':q?`<b>${esc(q.name)}</b> <em>${posLabel(q)}</em>`:''}</span>`}).join('')}</div>`:''}
    </section>`;
  } else {
    const left=Math.max(0,G.cal.draft-G.day);
    const st=standingsNow?standingsNow():[]; const myNo=st.length?[...st].reverse().findIndex(o=>o.tid===G.user)+1:null;
    head=`<section class="card hero dhead"><div class="row between"><span class="eyebrow">${G.year} 신인 드래프트 · ${dmd(G.cal.draft)}</span><span class="pill">D-${left}</span></div>
      <p>참가 선수 ${pool.length}명 중 ${DRAFT_ROUNDS}라운드 ${DRAFT_ROUNDS*10}명이 지명됩니다. 지명 순서는 정규시즌 성적의 역순입니다.${myNo&&period()==='season'?` 지금 순위대로면 우리는 ${myNo}순위입니다.`:''}</p>
      <details class="frule"><summary class="small">로스터·순위 안내</summary><p class="small">지금 정식 로스터는 ${rosterN(G.user)}/${ROSTER_MAX}명입니다. 지명한 신인은 내년 1월에 합류하므로, 그만큼 기존 선수를 방출해야 합니다. 3라운드부터는 지명을 건너뛸 수 있고, 다른 구단도 로스터가 차면 건너뜁니다.</p>
      <p class="small muted">언론 순위는 성적과 체격만 본 평가이고, 우리 순위는 스카우트가 본 숨은 능력 기준입니다. 리포트는 드래프트가 가까워질수록 정확해집니다.${noScout.length?` <b>${noScout.join(', ')}</b> 지역은 담당 스카우트가 없어 장래성이 ?로 나옵니다.`:''} 관심 표시한 선수는 지명 때 바로 고를 수 있습니다.</p>
      </details>
    </section>`;
  }
  const seg=`<div class="seg"><button data-a="dset" data-v="seg:board" class="${f.seg==='board'?'on':''}">후보 보드</button><button data-a="dset" data-v="seg:sum" class="${f.seg==='sum'?'on':''}">스카우트 요약</button><button data-a="dset" data-v="seg:res" class="${f.seg==='res'?'on':''}">지명 현황</button><button data-a="dset" data-v="seg:mine" class="${f.seg==='mine'?'on':''}">관심 목록 (${(G.shortlist||[]).filter(id=>G.players[id]&&G.players[id].prospect).length})</button></div>`;
  if(f.seg==='res')return head+seg+draftResults();
  if(f.seg==='sum')return head+seg+draftCenter(all,mine);
  const center='';
  let list=all.filter(({p})=>(f.pos==='all'||dposOf(p)===f.pos)&&(f.typ==='all'||(f.typ==='hs')!==p.college)&&(f.reg==='all'||p.region===f.reg)&&(f.seg!=='mine'||(G.shortlist||[]).includes(p.id)));
  const sorts={rk:(a,b)=>a.rk-b.rk,press:(a,b)=>(a.p.press||999)-(b.p.press||999),stat:(a,b)=>amScore(b.p)-amScore(a.p),fut:(a,b)=>(b.rp.ofp??0)-(a.rp.ofp??0),cur:(a,b)=>b.rp.cur-a.rp.cur};
  list.sort(sorts[f.sort]||sorts.rk);
  const chips=(k,opts)=>`<div class="chips">${opts.map(([v,l])=>`<button data-a="dset" data-v="${k}:${v}" class="${f[k]===v?'on':''}">${l}</button>`).join('')}</div>`;
  const filt=`<section class="card dfilt">
    ${chips('pos',Object.entries(DPOS))}
    <div class="row wrapr">${chips('typ',[['all','고졸·대졸'],['hs','고졸'],['col','대졸']])}${chips('reg',[['all','전 지역'],...REG.map(r=>[r,r])])}</div>
    <div class="row between wrapr"><span class="small muted">정렬</span>${chips('sort',[['rk','스카우트 순위'],['press','언론 순위'],['stat','아마 성적']])}</div>
    <p class="small muted">${list.length}명 표시 · 남은 참가자 ${pool.length}명</p></section>`;
  const pk2='dr'+f.seg+f.pos+f.typ+f.reg+f.sort; const PG=pager(pk2,list,wide()?6:4);
  return head+center+seg+filt+`<div class="tgrid dgrid" data-pg="${pk2}">${PG.items.map(x=>dcard(x.p,x.rp,x.rk,mine)).join('')||'<p class="small muted">조건에 맞는 선수가 없습니다.</p>'}</div>${PG.bar}`;
}
function amScore(p){ const h=p.am; if(!h)return -99; if(p.isP){ const r=pRate(h); return 10-r.era+(h.so/Math.max(1,h.outs/3))*.8; } return bRate(h).ops*10; }
function draftResults(){
  const d=G.draft; if(!d)return csec('지명 현황','<p class="small muted">드래프트가 시작되면 라운드별 지명 결과가 여기에 쌓입니다.</p>');
  const order=d.picks.filter(x=>x.rd===1).map(x=>x.tid);
  const rows=[]; for(let r=1;r<=DRAFT_ROUNDS;r++){ rows.push(`<tr><th>${r}R</th>${order.map(tid=>{ const x=d.picks.find(q=>q.rd===r&&q.tid===tid); const q=x&&x.pid>0?G.players[x.pid]:null;
    return `<td class="${tid===G.user?'me':''}">${x&&x.pass?'<span class="muted">건너뜀</span>':q?`<button class="lnk" data-a="player" data-v="${q.id}">${esc(q.name)}</button><i>${posLabel(q)}</i>`:'<span class="muted">-</span>'}</td>`; }).join('')}</tr>`); }
  const mine=d.picks.filter(x=>x.tid===G.user&&x.pid>0).map(x=>G.players[x.pid]).filter(Boolean);
  return `${mine.length?`<section class="card"><div class="row between"><h2 class="sec">우리 지명 선수</h2><span class="small muted">${mine.length}명 · 내년 1월 합류</span></div><div class="tgrid">${mine.map(p=>pcard(p,{sub:`${esc(p.school||'')} · ${p.age}세`,stat:`${p.draft.rd}라운드 ${p.draft.no}순위 · ${amLine(p)}`,foot:`<b class="num">${money(BONUS[p.draft.rd-1]||30)}</b><span>계약금</span>`})).join('')}</div></section>`:''}
  <section class="card"><h2 class="sec">라운드별 지명</h2><div class="tw"><table class="dres"><thead><tr><th></th>${order.map(t=>`<th>${badge(t,18)}<br>${esc(tshort(t))}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div></section>`;
}

/* ---------- 영입·계약 ---------- */
function transferView(){
  const s=curSub('transfer');
  return subTabs('transfer')+({foreign:foreignView,fa:faCenter,contract:contractPage,draft:draftPage}[s]||faCenter)()+(UI.stamp?stampView():'');
}
function netPill(r){ const lv=intlLv(r); return `<span class="pill net${lv}" title="${esc(INET[lv].d)}">${IREG[r].l} · ${INET[lv].l}</span>`; }
function foreignView(){
  const fs=foreignOf(G.user); const yb=fs.filter(p=>p.foreign==='용병'); const as=fs.filter(p=>p.foreign==='아시아'); const tot=sum(yb.map(p=>p.sal));
  const per=period(); const mid=per==='season'; const used=G.sea.repl[G.user]||0; const open=foreignOpen();
  const ff=Object.assign({t:'yb',r:'all',s:'rk'},UI.ff||{}); const asia=ff.t==='asia';
  const regs=Object.keys(IREG).filter(r=>IREG[r].asia===asia);
  let market=(G.fmarket||[]).map(id=>G.players[id]).filter(p=>p&&p.team==null&&fKnows(G.user,p)&&(p.foreign==='아시아')===asia)
    .filter(p=>ff.r==='all'||(ff.r==='p'?p.isP:ff.r==='b'?!p.isP:origOf(p)===ff.r))
    .map(p=>({p,rp:scoutReport(p)}));
  const fsc=p=>{ const h=p.prev; if(!h)return -9; return p.isP?(h.outs?1.6-(h.er*27/h.outs)/5:-9):bRate(h).ops; };
  market.sort(({stat:(a,b)=>fsc(b.p)-fsc(a.p),rk:(a,b)=>dval(b.rp)-dval(a.rp),ask:(a,b)=>a.p.ask-b.p.ask,age:(a,b)=>a.p.age-b.p.age})[ff.s]||((a,b)=>dval(b.rp)-dval(a.rp)));
  const tabs=`<div class="seg"><button data-a="ffset" data-v="t:yb" class="${!asia?'on':''}">외국인 선수(용병) ${yb.length}/3</button><button data-a="ffset" data-v="t:asia" class="${asia?'on':''}">아시아쿼터 ${as.length}/1</button></div>`;
  const capT=fCap(G.user), rsyN=sum(yb.map(x=>x.rsy||0)); const pct=Math.min(100,tot/capT*100);
  const rule=asia
    ?`<dl class="tsum"><div><dt>아시아쿼터</dt><dd class="num" style="color:${as.length?'var(--good)':'var(--warn)'}">${as.length} / 1</dd></div><div><dt>연봉 상한</dt><dd class="num">20만 달러</dd></div><div><dt>대상</dt><dd>일본·대만·호주</dd></div></dl>
      <p class="small muted">아시아쿼터는 일반 외국인 3명과 별도로 1명을 더 쓸 수 있는 자리입니다. 연봉은 20만 달러(약 ${money(ASIA_CAP)})까지이고 용병 연봉 총액 400만 달러에는 들어가지 않습니다.</p>`
    :`<dl class="tsum"><div><dt>용병</dt><dd class="num" style="color:${yb.length<3?'var(--warn)':'var(--good)'}">${yb.length} / 3</dd></div><div><dt>투수 · 타자</dt><dd class="num">${yb.filter(p=>p.isP).length} · ${yb.filter(p=>!p.isP).length}</dd></div><div><dt>총액 / 한도</dt><dd class="num">${Math.round(tot/USD)}만 / ${Math.round(capT/USD)}만 달러</dd></div></dl>
      <div class="bar"><i class="${tot>capT?'over':''}" style="width:${pct}%"></i></div>
      <details class="frule"><summary class="small">KBO 외국인 규정 보기</summary><p class="small muted">신규 계약은 1인 100만 달러(연봉·계약금·이적료·인센티브 포함)까지입니다. 재계약 선수는 개인 상한이 없습니다. 3명 총액 한도는 400만 달러이고, 재계약 선수의 재계약 연차 1년마다 10만 달러씩 늘어납니다(지금 연차 합 ${rsyN}년 → 한도 ${Math.round(capT/USD)}만 달러). 3명을 모두 투수나 모두 타자로 채울 수 없습니다.</p></details>`;
  const summary=`<section class="card">${rule}
    <p class="small muted">${mid?`시즌 중 교체 ${used}/${F_REPL_MAX}회, 영입하면 남은 경기 비율만큼 연봉을 냅니다. `:''}${open?'후보는 매달 1일 일부 바뀝니다. 8월 15일 이후에는 영입할 수 없습니다.':'<b>지금은 영입 기간이 아닙니다.</b> (12월~8월 15일)'}</p>
    <div class="netrow">${regs.map(netPill).join('')}<button class="tc-i" data-a="itab" data-v="fview${asia?'a':''}:net">해외 스카우트망 관리</button></div>
    ${(()=>{ const b=budget(); if(!b.fR)return ''; const fsU=sum(foreignOf(G.user).map(p=>p.sal)); return `<p class="small"><b>외국인 배정 예산</b> ${money(b.fR)} 중 ${money(fsU)} 사용 · 남은 배정 ${money(b.fRoom)}${G.gmSince===G.year?' <span class="muted">(첫 시즌: 규정 한도만큼 구단주가 미리 배정)</span>':' <span class="muted">(지난 시즌 리그 평균 외국인 지출 기준)</span>'}</p>`; })()}
    ${UI.fmsg2?`<div class="note bad">${esc(UI.fmsg2)}</div>`:''}</section>`;
  const mine=(asia?as:yb).map(p=>pcard(p,{sub:`${esc(p.nat)} · ${p.age}세 · ${hand(p)}`,tags:p.fy===G.year||p.fy===G.year+1?'<span class="pill">KBO 첫 시즌</span>':'',foot:`<b class="num">${money(p.sal)}</b><span>${Math.round(p.sal/USD)}만 달러 · ${p.rsy?`재계약 ${p.rsy}년차`:'첫 계약'}</span><button class="tc-i" data-a="player" data-v="${p.id}">상세·방출</button>`})).join('');
  const cards=market.map(({p,rp})=>{ const err=open?foreignCheck(G.user,p):'영입 기간이 아닙니다.'; const repl=mid&&used>=F_REPL_MAX; const pay=mid?Math.round(p.ask*remainFrac()):p.ask;
    const srcP=p.fsrc==='scout'?((p.fknow||[]).includes(G.user)?(G.day<(p.fpub||0)?'<span class="pill good">우리 스카우트 발굴 · 아직 우리만 앎</span>':'<span class="pill">우리 발굴 · 소문 퍼짐</span>'):'<span class="pill">다른 구단 발굴 · 소문으로 앎</span>'):'<span class="pill">에이전트 제안</span>';
    return pcard(p,{rp,sub:`${esc(p.nat)} · ${p.age}세 · ${hand(p)} · ${esc(p.prevLvl||'')}`,
      tags:(G.mgrWant&&G.mgrWant.y===G.year&&mgrFitF(p,{want:G.mgrWant})?`<span class="pill good" title="감독이 원한 유형: ${esc(G.mgrWant.style||'')}">감독 선호</span>`:'')+srcP+(p.flaw?`<span class="pill bad">${FFLAW[p.flaw]}</span>`:'')+netPill(origOf(p))+(p.inj>.24&&rp.sd<=7.5&&p.flaw!=='inj'?'<span class="pill bad">부상 체질</span>':'')+(()=>{ const n=fInterest(p); return n>=2?`<span class="pill bad">인기 · ${n}개 구단 관심</span>`:n===1?'<span class="pill">1개 구단 관심</span>':''; })()+(p.ask0&&p.ask>p.ask0?`<span class="pill warn">몸값 +${Math.round((p.ask/p.ask0-1)*100)}%</span>`:''),
      foot:`<b class="num">${money(p.ask)}</b><span>${Math.round(p.ask/USD)}만 달러${mid?` · 실지급 ${money(pay)}`:''}</span>${err||repl?`<span class="pill bad" title="${esc(repl?'교체 횟수 소진':err)}">${repl?'교체 소진':'계약 불가'}</span>`:''}${fBudgetTag(pay)}<span class="tc-bt"><button class="tc-i${fwatchOn(p.id)?' on':''}" data-a="fwatch" data-v="${p.id}">${fwatchOn(p.id)?'관찰 중':'관찰'}</button><button class="tc-i ${err||repl?'':'go'}" data-a="signFc" data-v="${p.id}" ${err||repl?'disabled':''}>계약</button></span>`}); });
  const fchips=[['all','전체'],...(!asia?[['p','투수'],['b','타자']]:[]),...regs.map(r=>[r,IREG[r].l])];
  const full=asia?as.length>=1:yb.length>=3; const ft=inTabs('fview'+(asia?'a':''),[['market',`후보 ${market.length}`],['mine',`우리 선수 ${asia?as.length+'/1':yb.length+'/3'}`],['watch','관찰 명단'],['net','스카우트망'],['rule','규정']],full?'mine':'market');
  const mineS=`<section class="card"><div class="row between"><h2 class="sec">우리 ${asia?'아시아쿼터':'외국인 선수'}</h2><span class="small muted">${asia?as.length+'/1':yb.length+'/3'}</span></div>${mine?`<div class="tgrid">${mine}</div>`:'<p class="small muted">아직 없습니다.</p>'}</section>`;
  const PG=pager('fm'+(asia?'a':'')+ff.r+ff.s,cards,6);
  const mkS=`<section class="card" data-pg="${'fm'+(asia?'a':'')+ff.r+ff.s}"><div class="row between"><h2 class="sec">${asia?'아시아쿼터 후보':'용병 후보'}</h2><span class="small muted">${market.length}명</span></div>
    <div class="row between wrapr"><div class="chips">${fchips.map(([k,l])=>`<button data-a="ffset" data-v="r:${k}" class="${ff.r===k?'on':''}">${l}</button>`).join('')}</div>
    <div class="chips">${[['rk','스카우트 추천순'],['stat','지난 리그 기록순'],['ask','연봉 낮은순'],['age','어린 순']].map(([k,l])=>`<button data-a="ffset" data-v="s:${k}" class="${ff.s===k?'on':''}">${l}</button>`).join('')}</div></div>
    <p class="small muted">후보는 능력치 대신 지난 리그 기록과 스카우트 의견으로 판단합니다. 스카우트망이 넓은 지역일수록 의견(유형·장래 역할·메모)이 정확합니다. 지난 리그 기록은 리그 수준 차이를 감안해서 보세요. 영입하면 우리 코치진이 능력치를 정확히 파악합니다.</p>
    <div class="tgrid">${PG.items.join('')||'<p class="small muted">조건에 맞는 후보가 없습니다.</p>'}</div>${PG.bar}</section>`;
  return tabs+ft.bar+(ft.cur==='net'?intlView():ft.cur==='market'?mkS:ft.cur==='mine'?mineS:ft.cur==='watch'?(fwatchBox(asia)||'<section class="card"><p class="small muted">관찰 명단이 비어 있습니다. 후보 카드에서 관찰을 눌러 두면 여기서 비교합니다.</p></section>'):summary);
}

function intlView(){
  const tot=sum(Object.keys(IREG).map(r=>INET[intlLv(r)].c));
  const cnt=r=>(G.fmarket||[]).filter(id=>G.players[id]&&G.players[id].team==null&&origOf(G.players[id])===r).length;
  const card=r=>{ const lv=intlLv(r); return `<div class="tcard" style="cursor:default"><div class="row between" style="flex-wrap:nowrap;align-items:flex-start;gap:8px"><div style="min-width:0"><b style="font-size:16px">${IREG[r].l}</b><div class="small muted">${IREG[r].lg} · ${IREG[r].asia?'아시아쿼터':'용병'} 후보</div></div><span class="pill net${lv}" style="flex:none">${INET[lv].l}</span></div>
    <div class="seg">${INET.map((x,i)=>`<button data-a="setIntl" data-v="${r}:${i}" class="${lv===i?'on':''}">${i}</button>`).join('')}</div>
    <p class="dnote">${esc(INET[lv].d)}</p>
    <div class="tc-ft"><b class="num">${INET[lv].c?'연 '+money(INET[lv].c):'무료'}</b><span>현재 후보 ${cnt(r)}명</span>${G.scouts.some(s=>s.role==='intl'&&s.region===r)?'<span class="pill good">스카우트 파견 +1단계</span>':''}</div></div>`; };
  return csec('해외 스카우트망',`<p class="small muted">외국인 후보는 그 나라에 우리 정보망이 얼마나 있느냐에 따라 보이는 정도가 다릅니다. 단계를 올리면 그 지역 후보의 리포트가 바로 정확해지고, 다음 달 1일 후보 교체부터 그 지역에서 더 많고 좋은 후보가 들어옵니다. 비용은 하루 단위로 쌓여 시즌 결산 때 나갑니다.</p>
    <dl class="tsum"><div><dt>연간 비용</dt><dd class="num">${money(tot)}</dd></div><div><dt>지난 결산 이후</dt><dd class="num">${money(G.spend.intl||0)}</dd></div><div><dt>외국인 후보</dt><dd class="num">${(G.fmarket||[]).length}명</dd></div></dl>
    <div class="eyebrow">용병 시장</div><div class="tgrid">${['us','la'].map(card).join('')}</div>
    <div class="eyebrow">아시아쿼터 시장</div><div class="tgrid">${['jp','tw','au'].map(card).join('')}</div>
    <p class="small muted">단계: 0 에이전트 자료 · 1 현지 통신원 · 2 전담 스카우트(적응력 확인) · 3 현지 사무소. 스카우트 팀에서 스카우트를 해외 담당으로 보내면 그 나라 정보 수준이 한 단계 더 올라갑니다(최대 3).</p>`);
}
function faPage(){
  if(!faLive()){
    const F=G.fa; const res=F&&F.results&&F.results.length?`<div class="list">${F.results.slice(0,12).map(r=>`<div class="item" style="cursor:default"><span class="nm">${esc(r.name)} <span class="pill">${r.grade}</span></span><span class="sub">${tshort(r.from)} → <b>${tshort(r.to)}</b>${r.compPlayer?` · 보상선수 ${esc(r.compPlayer)}`:''}</span><span class="rt num">${r.years}년 ${money(r.annual)}</span></div>`).join('')}</div>`:'';
    return csec('FA 시장',`<p class="small muted">FA 시장은 포스트시즌이 끝난 뒤 11월 2일 공시, 11월 6일부터 협상이 시작됩니다. 그 전까지는 비FA 다년계약으로 우리 선수를 미리 묶어 둘 수 있습니다.</p>${res?`<div class="eyebrow">지난 FA 계약</div>${res}`:''}`);
  }
  const F=G.fa; const ids=F.pool.filter(id=>G.players[id]&&G.players[id].team==null).sort((a,b)=>G.players[b].ask.annual-G.players[a].ask.annual);
  const myOffers=Object.entries(F.offers); const offSum=sum(myOffers.map(([,o])=>o.annual));
  const cards=ids.slice(0,40).map(id=>{const p=G.players[id]; const o=F.offers[id]; const n=Object.keys(F.ai[id]||{}).length;
    return pcard(p,{sub:`${tshort(p.faFrom)} · ${p.age}세 · ${hand(p)}`,tags:`<span class="pill acc">${p.faGrade}등급</span>${o?'<span class="pill good">제시함</span>':''}${n?`<span class="pill">관심 ${n}곳</span>`:''}`,
      foot:`<b class="num">${money(p.ask.annual)}</b><span>요구 ${p.ask.years}년${o?` · 우리 제시 ${o.years}년 ${money(o.annual)}`:''}</span><button class="tc-i go" data-a="player" data-v="${p.id}">조건 제시</button>`});}).join('');
  return `<section class="card hero" data-k="FA시장"><div class="eyebrow">FA 시장 · ${G.day>=F.openDay?'협상 중':'11월 6일 협상 시작'} · 1월 24일(캠프 전날) 사실상 마감</div>
    <p>남은 FA ${ids.length}명. 선수는 날마다 들어온 제안을 비교하다가 계약합니다. 관심 구단이 많을수록 빨리 결정합니다.</p>
    <p class="small muted">A등급 영입 시 원소속 구단에 직전 연봉 200%와 보호선수 20인 외 보상선수 1명, B등급은 100%와 25인 외 1명, C등급은 150%만 내줍니다.</p>
    <p class="small">제시 중 ${myOffers.length}건 · 연 ${money(offSum)} · 성사 시 캡 산정액 최대 <b class="num">${money(capPay(G.user)+offSum)}</b> / ${money(capOf(G.year))}</p></section>
    <section class="card"><div class="tgrid">${cards||'<p class="small muted">남은 FA가 없습니다.</p>'}</div></section>
    ${F.results.length?csec('최근 계약',`<div class="list">${F.results.slice(0,8).map(r=>`<div class="item" style="cursor:default"><span class="nm">${esc(r.name)} <span class="pill">${r.grade}</span></span><span class="sub">${dsh(r.day)} · ${tshort(r.from)} → <b>${tshort(r.to)}</b>${r.compPlayer?` · 보상선수 ${esc(r.compPlayer)}`:''}</span><span class="rt num">${r.years}년 ${money(r.annual)}</span></div>`).join('')}</div>`):''}`;
}
function contractPage(){
  return (G.contract&&!G.contract.done?contractView():csec('연봉 협상','<p class="small muted">연봉 협상은 매년 1월에 열립니다. 계약이 끝난 선수의 재계약안이 이곳에 올라옵니다.</p>'))+csec('비FA 다년계약',extBody());
}

/* ---------- 스카우팅 ---------- */
function draftYears(){ const S=new Set(Object.keys(G.dlog||{}).map(Number)); for(const p of Object.values(G.players))if(p.draft&&p.draft.y)S.add(p.draft.y); const cur=G.draft&&!G.draft.done?G.draft.y:null; return [...S].filter(y=>y!==cur&&y<=G.year).sort((a,b)=>b-a).slice(0,12); }
function draftHist(ys){ const y=UI.dhy&&ys.includes(UI.dhy)?UI.dhy:ys[0]; const L=draftClass(y); const yrs=G.year-y;
  const chips=`<div class="chips">${ys.map(v=>`<button data-a="dhy" data-v="${v}" class="${v===y?'on':''}">${v}</button>`).join('')}</div>`;
  const g=draftGrades(y); const rk=g.findIndex(x=>x.t===G.user)+1; const mine=L.filter(x=>x.t===G.user).sort((a,b)=>a.n-b.n); const mw=mine.reduce((a,x)=>a+x.war,0);
  const best=[...L].filter(x=>x.p).sort((a,b)=>b.war-a.war).slice(0,10);
  const row=x=>`<tr class="${x.t===G.user?'me':''}"><td class="num">${x.rd}-${x.no}</td><td>${x.t!=null?badge(x.t,14):''}</td><td style="text-align:left">${x.p?`<button class="lnk" data-a="player" data-v="${x.id}">${esc(x.nm)}</button>`:`${esc(x.nm)} <span class="small muted">은퇴</span>`}<br><span class="small muted">${esc(x.pos||'')}${x.p&&x.now!=null&&x.now!==x.t?` · 현 ${esc(tshort(x.now))}`:''}</span></td><td class="num">${x.p?rchip(scoutReport(x.p).cur):'-'}</td><td class="num">${x.war.toFixed(1)}</td></tr>`;
  const tbl=rows=>`<table><thead><tr><th>순번</th><th></th><th style="text-align:left">선수</th><th>능력</th><th>통산 WAR</th></tr></thead><tbody>${rows.map(row).join('')}</tbody></table>`;
  const grade=rk?(rk<=2?'A':rk<=4?'B':rk<=7?'C':'D'):'-';
  return csec(`${y} 드래프트 성적표`,`${chips}<p class="small sdesc">${yrs<=0?'올해 지명한 선수들입니다. 평가는 몇 년 뒤에 의미가 있습니다.':`${yrs}년이 지났습니다. 통산 WAR는 1군 기록 기준입니다.`}</p>
    <dl class="tsum"><div><dt>우리 지명</dt><dd class="num">${mine.length}명</dd></div><div><dt>우리 WAR 합</dt><dd class="num">${mw.toFixed(1)}</dd></div><div><dt>리그 순위</dt><dd class="num">${rk?rk+'위 · '+grade:'-'}</dd></div></dl>
    <div class="eyebrow">우리 지명자</div>${mine.length?tbl(mine):'<p class="small muted">기록이 없습니다.</p>'}
    <div class="eyebrow">이 해 최고 선수 10명</div>${tbl(best)}`); }
function draftPage(){ const ys=draftYears(); const it=ys.length?inTabs('dr',[['now',G.draft&&!G.draft.done?'드래프트 진행':'올해 드래프트'],['hist','지난 드래프트 성적표']]):null;
  return (it?it.bar:'')+(it&&it.cur==='hist'?draftHist(ys):draftBoard()); }
function dataPage(){ const L=anaList(); const E=anaEff(G.user); const M=anaMarket(); const stars=k=>'★'.repeat(k)+'<i class="off">'+'★'.repeat(5-k)+'</i>';
  const pw=r=>anaPow(r); const last=(G.mail||[]).find(m=>m.from==='전력분석팀');
  const card=(a,mine)=>`<div class="tcard anc" style="cursor:default"><div class="row between" style="flex-wrap:nowrap"><div style="min-width:0">${avImg({persona:'staff',pid:a.id,name:a.name,age:a.age})}<b> ${esc(a.name)}</b> <span class="small muted">${a.age}세 · 연 ${money(a.sal)}</span></div><span class="anstar">${stars(a.skill)}</span></div>
    ${mine?`<div class="row" style="gap:6px;margin-top:6px"><select data-a="anaRole" data-v="${a.id}" aria-label="역할">${Object.entries(AROLE).map(([k,r])=>`<option value="${k}" ${a.role===k?'selected':''}>${r.l}</option>`).join('')}</select>${G.day-a.since<30?'<span class="pill warn">적응 중</span>':''}<button class="btn small" data-a="anaFire" data-v="${a.id}" style="margin-left:auto">정리</button></div>`
      :`<p class="small muted" style="margin:6px 0">${AROLE[a.role].l} 전문</p><button class="btn small primary" data-a="anaHire" data-v="${a.id}" ${L.length>=ANA_MAX?'disabled':''}>채용</button>`}</div>`;
  const it=inTabs('ana',[['mine',`우리 분석원 ${L.length}/${ANA_MAX}`],['mk','채용 후보'],['rep','분석 보고']],'mine');
  const eff=`<dl class="tsum"><div><dt>상대 전력분석</dt><dd>${pw('opp').toFixed(1)} · 실점 억제</dd></div><div><dt>트래킹 데이터</dt><dd>${pw('trk').toFixed(1)} · 평가 오차 -${Math.round((1-E.sdm)*100)}%</dd></div><div><dt>영상 분석</dt><dd>${pw('vid').toFixed(1)} · 타격 공략</dd></div></dl>`;
  const body=it.cur==='mk'?`<p class="small muted">매달 1일 후보가 일부 바뀝니다. 능력 별이 높을수록 연봉이 높습니다(★1 3천만 ~ ★5 1.7억).</p><div class="tgrid">${M.map(a=>card(a,false)).join('')}</div>`
    :it.cur==='rep'?(last?`<div class="eyebrow">${dsh(last.day)} 보고</div><p class="small" style="white-space:pre-line">${esc(last.body)}</p>`:'<p class="small muted">시즌 중 매달 말 보고가 옵니다.</p>')
    :`${eff}<p class="small muted">역할마다 가장 뛰어난 분석원의 능력이 가장 크게, 두 번째는 60%, 세 번째는 30%만 반영됩니다. 새로 오거나 역할을 바꾼 분석원은 30일 동안 절반만 일합니다.</p>${L.length?`<div class="tgrid">${L.map(a=>card(a,true)).join('')}</div>`:'<p class="small muted">분석원이 없습니다. 채용 후보에서 뽑으세요.</p>'}
      <div class="eyebrow" style="margin-top:8px">역할</div><div class="list">${Object.entries(AROLE).map(([k,r])=>`<div class="item" style="cursor:default"><span class="nm"><b>${r.l}</b></span><span class="sub">${esc(r.d)}</span></div>`).join('')}</div>`;
  return csec('전력분석·데이터팀',it.bar+body,`<span class="small muted">연 ${money(anaSal())}</span>`); }
function scoutTeamPage(){ return csec('스카우트 팀',scoutBody(),`<span class="small muted">${G.scouts.length}/${SCOUT_MAX}</span>`); }
/* 예전 '스카우팅' 탭: 드래프트는 영입·계약, 스카우트 팀은 스태프, 해외 스카우트망은 외국인 화면으로 옮겼다 */
function scoutView(){ return transferView(); }
/* ---------- 스태프·육성 ---------- */
function staffView(){
  const s=curSub('staff'); const m=G.mgr[G.user];
  const H0={mgr:()=>csec('감독',mgrBody(),`<span class="small muted">${m?esc(m.name):'공석'}</span>`),
    dev:()=>(G.camp&&!G.camp.done&&(G.camp.seen=true),campCard())+csec('2군 연수',devBody(),`<span class="small muted">${(G.devProg||[]).length}/6</span>`),
    coach:coachView,
    scouts:scoutTeamPage,
    data:dataPage,
    fac:facView,
    mil:milView,
    med:()=>csec('부상 방지·병원',medBody(),`<span class="small muted">${PREV[G.med.prev].l} · ${esc(HOSP[G.med.hosp].name)}</span>`)}; const h=mergedBody('staff',s,H0);
  return subTabs('staff')+h;
}
/* ---------- 코치진 ---------- */
function clanName(id){ if(!id)return ''; const m=Object.values(G.mgr).find(x=>x&&x.id===id)||(G.mmarket||[]).find(x=>x.id===id); return m?m.name:''; }
function coachTag(c){ const m=G.mgr[G.user]; if(!c||!c.clan)return ''; if(m&&c.clan===m.id)return '<span class="pill good">감독 사단 +6</span>'; const n=clanName(c.clan); return n?`<span class="pill">${esc(n)} 사단</span>`:''; }
function coachStats(c,tid){ const e=k=>effC(c,tid,k); const d=k=>{ const v=e(k)-c[k]; return v?`<i class="${v>0?'up':'dn'}">${v>0?'+':''}${v}</i>`:''; };
  return `<span class="cst"><span>지도</span>${rchip(e('sk'))}${d('sk')}</span><span class="cst"><span>육성</span>${rchip(e('dv'))}${d('dv')}</span>`; }
function coachSlot(k){ const C=coachesOf(G.user); const c=C[k]; const r=CROLE[k];
  if(!c)return `<div class="csl empty"><div class="csl-h"><b>${r.l}</b><span class="pill bad">공석</span></div><p class="small muted">${r.d}</p><button class="btn small primary" data-a="coachFind" data-v="${k}">후보 보기</button></div>`;
  return `<div class="csl"><div class="csl-h"><b>${r.l}</b>${coachTag(c)}</div>
    <div class="csl-n">${avImg({persona:'coach',pid:c.id,name:c.name,age:c.age,team:G.user})}${esc(c.name)} <span class="small muted">${c.age}세</span></div>
    <div class="csl-s">${coachStats(c,G.user)}</div>
    <div class="small muted">${esc(c.car)} · 연 ${money(c.sal)} · 잔여 ${Math.max(0,c.yrs)}년</div>
    <div class="row"><button class="btn small" data-a="coachFind" data-v="${k}">교체</button>${UI.cfire===k?`<button class="btn small danger" data-a="fireCoach" data-v="${k}">정말 내보내기</button>`:`<button class="btn small" data-a="cfireAsk" data-v="${k}">내보내기</button>`}</div></div>`; }
function chanceTxt(p){ return p>=.65?'응할 가능성 큼':p>=.45?'반반':p>=.25?'쉽지 않음':'거의 어려움'; }
function coachOther(role,srt){ const C=coachesOf(G.user); const SF={tot:c=>-(c.sk+c.dv),sk:c=>-c.sk,dv:c=>-c.dv,sal:c=>c.sal};
  const L=[]; for(const t of G.teams){ if(t.id===G.user)continue; const TC=G.coach&&G.coach[t.id]; if(!TC)continue; for(const k of CKEYS){ const c=TC[k]; if(c&&(role==='all'||k===role))L.push({t,k,c}); } }
  L.sort((a,b)=>SF[srt](a.c)-SF[srt](b.c));
  const card=({t,k,c})=>{ const cur=C[k]; const diff=cur?(c.sk+c.dv)-(cur.sk+cur.dv):null; const T1=poachTerms(t.id,k,k); const pr=PROMO[k]; const T2=pr?poachTerms(t.id,k,pr):null; const cd=G.poachCd&&G.poachCd[c.id]>G.day;
    const m=G.mgr[t.id]; const clan=c.clan&&m&&c.clan===m.id;
    const b=(T,l)=>`<button class="btn small ${T.promo?'':'primary'}" data-a="poach" data-v="${t.id}:${k}:${T.toRole}" ${cd?'disabled':''}>${l}<i class="pc-s">연 ${money(T.sal)}${T.comp?` · 보상 ${money(T.comp)}`:''} · ${chanceTxt(T.chance)}</i></button>`;
    return `<div class="csl"><div class="csl-h"><b>${badge(t.id,14)} ${esc(t.city+' '+t.nick)} ${CROLE[k].l}</b>${cur?`<span class="small muted">우리 ${esc(cur.name)} 대비 ${diff>0?'+':''}${diff}</span>`:'<span class="pill bad">우리 공석</span>'}</div>
      <div class="csl-n">${avImg({persona:'coach',pid:c.id,name:c.name,age:c.age,team:t.id})}${esc(c.name)} <span class="small muted">${c.age}세</span>${c.star?' <span class="pill acc">스타 코치</span>':''}${obTag(c.ob)}${clan?` <span class="pill warn">${esc(m.name)} 감독 사단</span>`:''}</div><div class="csl-s">${coachStats({...c,clan:null},G.user)}</div>
      <div class="small muted">${esc(c.car)} · 현재 연 ${money(c.sal)} · 계약 ${Math.max(0,c.yrs)}년 남음</div>
      <div class="pcb">${b(T1,'같은 자리로 영입')}${T2?b(T2,`${CROLE[pr].l}로 승격 제의`):''}</div>${cd?`<p class="small muted">${dmd(G.poachCd[c.id])}까지 다시 만나 주지 않습니다.</p>`:''}</div>`; };
  return `<p class="small muted">다른 구단 코치는 연봉을 올려 주거나(+35%) 한 단계 높은 자리를 주면(+15%, 응할 가능성 크게 오름) 옮겨 옵니다. ${poachOff()?'지금은 비시즌이라 계약이 1년 이하 남은 코치는 보상금 없이 데려올 수 있습니다.':'시즌 중에는 남은 계약에 대한 보상금을 원 소속 구단에 냅니다.'} 감독 사단 코치는 감독 곁을 잘 떠나지 않고, 우리 구단 출신은 잘 돌아옵니다. 빼 오면 그 구단 단장과 친분이 떨어집니다. 거절당하면 30일 동안 다시 제의할 수 없습니다.</p>
    ${(()=>{ const P=pager('cpo',L.slice(0,40),wide()?12:6); return `<div class="cgrid" data-pg="cpo">${P.items.map(card).join('')}</div>${P.bar}`; })()}`; }
function coachMarket(){ const role=UI.crole||'all'; const C=coachesOf(G.user); const mode=UI.cmode||'free';
  const srt=UI.csort||'tot'; const SF={tot:c=>-(c.sk+c.dv),sk:c=>-c.sk,dv:c=>-c.dv,sal:c=>c.sal}; const otherN=G.teams.filter(t=>t.id!==G.user).reduce((a,t)=>a+CKEYS.filter(k=>G.coach&&G.coach[t.id]&&G.coach[t.id][k]).length,0);
  const modeBar=''; const _mb=`<div class="seg"><button data-a="cmode" data-v="free" class="${mode==='free'?'on':''}">자유 계약 후보 ${(G.cmarket||[]).length}</button><button data-a="cmode" data-v="other" class="${mode==='other'?'on':''}">다른 구단 코치 ${otherN}</button></div>`;
  const M=G.cmarket||[]; const L=M.filter(c=>role==='all'||c.role===role).sort((a,b)=>SF[srt](a)-SF[srt](b));
  const chips=`<div class="chips">${[['all','전체'],...CKEYS.map(k=>[k,CROLE[k].l])].map(([k,l])=>`<button data-a="crole" data-v="${k}" class="${role===k?'on':''}">${l} <i class="cnt">${k==='all'?M.length:M.filter(c=>c.role===k).length}</i>${k!=='all'&&!C[k]?' <i class="cnt" style="background:var(--bad)">공석</i>':''}</button>`).join('')}</div>
    <div class="chips">${[['tot','종합순'],['sk','지도력순'],['dv','육성력순'],['sal','연봉 낮은 순']].map(([k,l])=>`<button data-a="csort" data-v="${k}" class="${srt===k?'on':''}">${l}</button>`).join('')}</div>
    <p class="small muted">자리마다 4~5명이 있고, 매달 초 새 후보가 들어오고 일부는 떠납니다. 겨울에는 다른 구단에서 정리된 코치도 시장에 나옵니다.</p>`;
  const card=c=>{ const cur=C[c.role]; const diff=cur?(c.sk+c.dv)-(cur.sk+cur.dv):null;
    return `<div class="csl"><div class="csl-h"><b>${CROLE[c.role].l}</b>${cur?`<span class="small muted">현 ${esc(cur.name)} 대비 ${diff>0?'+':''}${diff}</span>`:'<span class="pill bad">공석 자리</span>'}</div>
    <div class="csl-n">${avImg({persona:'coach',pid:c.id,name:c.name,age:c.age,team:c.from!=null&&c.from!==G.user?c.from:null})}${esc(c.name)} <span class="small muted">${c.age}세</span>${c.star?' <span class="pill acc">스타 코치</span>':''}${obTag(c.ob)}${c.res===G.user?' <span class="pill warn">우선 협상</span>':''}${c.age<=41?' <span class="pill">젊은 지도자</span>':''}${c.from!=null&&c.from!==G.user&&G.teams[c.from]?` <span class="pill">전 ${esc(tshort(c.from))}</span>`:''}</div><div class="csl-s">${coachStats({...c,clan:null},G.user)}</div>
    <div class="small muted">${esc(c.car)} · 연 ${money(c.sal)}</div>
    <div class="row"><button class="btn small primary" data-a="hireCoach" data-v="${c.id}:1">1년</button><button class="btn small" data-a="hireCoach" data-v="${c.id}:2">2년</button></div></div>`; };
  if(mode==='other')return modeBar+`<div class="chips">${[['all','전체'],...CKEYS.map(k=>[k,CROLE[k].l])].map(([k,l])=>`<button data-a="crole" data-v="${k}" class="${role===k?'on':''}">${l}${k!=='all'&&!C[k]?' <i class="cnt" style="background:var(--bad)">공석</i>':''}</button>`).join('')}</div><div class="chips">${[['tot','종합순'],['sk','지도력순'],['dv','육성력순'],['sal','연봉 낮은 순']].map(([k,l])=>`<button data-a="csort" data-v="${k}" class="${srt===k?'on':''}">${l}</button>`).join('')}</div>${UI.poachMsg?`<div class="note">${esc(UI.poachMsg)}</div>`:''}`+coachOther(role,srt);
  return modeBar+chips+(L.length?(()=>{ const P=pager('cmk'+role+srt,L,wide()?12:6); return `<div class="cgrid" data-pg="${'cmk'+role+srt}">${P.items.map(card).join('')}</div>${P.bar}`; })():'<p class="small muted">이 자리 후보가 없습니다. 겨울에 새 후보가 나옵니다.</p>'); }
function coachView(){ const C=coachesOf(G.user); const m=G.mgr[G.user]; const g=coachGrade(G.user); const cn=clanCount(G.user);
  const empty=CKEYS.filter(k=>!C[k]).length;
  const gc=(l,x)=>`<div class="cg"><span>${l}</span><b class="g${x.l}">${x.l}</b></div>`;
  const sumC=`<section class="card"><div class="row between"><h2 class="sec">코치진</h2><span class="small muted">연봉 합계 ${money(coachSal(G.user))}${empty?` · <b style="color:var(--bad)">공석 ${empty}</b>`:''}</span></div>
    <div class="cgr">${gc('타격',g.bat)}${gc('투수',g.pit)}${gc('주루',g.run)}${gc('수비',g.def)}${gc('1군 육성',g.dev1)}${gc('2군 육성',g.dev2)}</div>
    <p class="small">${m?`${esc(m.name)} 감독 사단 코치 <b>${cn}명</b>${cn?' · 사단 코치는 지도·육성 +6':''}${(m.ego||0)>=70?' · 고집 센 감독이라 사단 밖 코치는 -2':''}`:'감독이 없습니다.'}</p>
    <p class="small muted">지도력은 1군 경기력(투수·타격·주루·수비)에, 육성력은 선수 성장 속도에 반영됩니다. 1군에서 많이 뛴 선수는 1군 코치, 나머지는 2군 코치진이 키웁니다. 비어 있는 자리는 낮은 수준으로 계산됩니다.</p></section>`;
  const cs=coachesOf(G.user); const vac1=CKEYS.some(k=>CROLE[k].g===1&&!cs[k]), vac2=CKEYS.some(k=>CROLE[k].g===2&&!cs[k]);
  const it=inTabs('coach',[['g1',`1군 코치${vac1?' ·빈자리':''}`],['g2',`2군 코치${vac2?' ·빈자리':''}`],['mk',`자유 계약 후보 ${(G.cmarket||[]).length}`],['po','다른 구단 코치']],!vac1&&vac2?'g2':'g1');
  const body=it.cur==='mk'||it.cur==='po'?(UI.cmode=it.cur==='po'?'other':'free',coachMarket()):`<div class="cgrid">${CKEYS.filter(k=>CROLE[k].g===(it.cur==='g2'?2:1)).map(coachSlot).join('')}</div>`;
  return sumC+it.bar+(UI.cMsg?`<div class="note">${esc(UI.cMsg)}</div>`:'')+body; }
/* 감독 후보의 사단 */
function clanBox(x){ const L=x.clan||[]; if(!L.length)return '<p class="small muted">사단 없음 · 코치진은 그대로 유지됩니다.</p>';
  return `<div class="clan"><div class="eyebrow">${esc(x.name)} 사단 ${L.length}명</div><span class="clan-c hd"><b></b><span></span><em>지도</em><i></i><em>육성</em></span>${L.map(c=>`<span class="clan-c"><b>${CROLE[c.role].l}</b><span>${esc(c.name)}</span>${rchip(c.sk+6)}<i>/</i>${rchip(c.dv+6)}</span>`).join('')}<p class="small muted">연봉 합계 ${money(sum(L.map(c=>c.sal)))} · 함께 오면 지도·육성 +6. 같은 자리 기존 코치는 정리됩니다(잔여 연봉 절반 정산).</p></div>`; }
/* ---------- 구단·재정 ---------- */

/* ---------- 구장 ---------- */
function stadView(){ const tid=G.user, S=stadOf(tid), cap=stadCap(tid), P=stadProj(tid), A=(G.sea.att&&G.sea.att[tid])||{n:0,sum:0,so:0,best:0}; const per=period(); const can=per!=='season'&&per!=='post';
  const occ=A.n?A.sum/A.n/cap:0;
  const lg=G.teams.map(t=>{ const x=(G.sea.att&&G.sea.att[t.id])||{n:0,sum:0,so:0}; const c=stadCap(t.id); return {t,c,avg:x.n?Math.round(x.sum/x.n):0,occ:x.n?x.sum/x.n/c:0,so:x.so,n:x.n}; }).sort((a,b)=>b.avg-a.avg||b.c-a.c);
  const top=`<dl class="tsum"><div><dt>수용 인원</dt><dd class="num">${cap.toLocaleString('ko-KR')}석</dd></div><div><dt>올해 홈 평균</dt><dd class="num">${A.n?Math.round(A.sum/A.n).toLocaleString('ko-KR')+'명':P.n?'예상 '+P.avg.toLocaleString('ko-KR')+'명':'-'}</dd></div><div><dt>좌석 점유율</dt><dd class="num">${A.n?Math.round(occ*100)+'%':'-'}</dd></div><div><dt>매진</dt><dd class="num">${A.so}회 / ${A.n}경기</dd></div></dl>
    <p class="small sdesc">시즌 예상 관중 ${P.att.toLocaleString('ko-KR')}명(홈 ${P.n}경기) · 표값 수입 ${money(P.ticket)}${P.fnb+P.prem+P.ad>0?` · 구장 부대 수입 ${money(P.fnb+P.prem+P.ad)}`:''}${P.up?` · 시설 유지비 ${money(P.up)}`:''}</p>`;
  const price=`<div class="eyebrow">티켓 가격</div><div class="chips">${PRICE.map((x,i)=>`<button data-a="stadPrice" data-v="${i}" class="${S.price===i?'on':''}">${x.l}</button>`).join('')}</div><p class="small sdesc">${PRICE[S.price].l}: ${PRICE[S.price].d} 언제든 바꿀 수 있고, 다음 홈경기부터 반영됩니다.</p>`;
  const yr=x=>x.ticket+x.fnb+x.prem+x.ad; const base=yr(stadProj(tid,true)); const gain={}; for(const it of STAD_ITEMS){ if(it.k==='turf'){ gain.turf=null; continue; } const lv=S.lv[it.k]; if(lv>=5){ gain[it.k]=0; continue; } S.lv[it.k]=lv+1; try{ gain[it.k]=Math.round(yr(stadProj(tid,true))-base); }finally{ S.lv[it.k]=lv; } }
  const gtxt=k=>gain[k]==null?'홈경기 부상 약 5% 감소':`연 수입 약 +${money(gain[k])}${k==='seat'?' · 팬 여론 상승':''}${(k==='seat'||k==='vis')&&gain[k]<200?' (매진이 잦아 효과 작음)':''}`;
  const items=STAD_ITEMS.map(it=>{ const lv=S.lv[it.k]; const b=(S.build||[]).find(x=>x.k===it.k); const nx=lv+1;
    return `<div class="stad-i"><div class="row between"><b>${it.l}</b><span class="lvdots">${[1,2,3,4,5].map(i=>`<i class="${i<=lv?'on':''}"></i>`).join('')}</span></div><p class="small sdesc">${it.d}</p>
      <div class="row between"><span class="small">${b?`${b.lv}단계 공사 중 · ${dmd(b.done)} 완공`:lv>=5?'최고 단계':`${nx}단계 공사비 <b class="num">${money(STAD_COST[nx])}</b> · ${STAD_DAYS[nx]}일 · 유지비 연 +${money(STAD_UP[nx]-STAD_UP[lv])} · 효과: ${gtxt(it.k)}`}</span>${!b&&lv<5?`<button class="btn small${can?' primary':''}" data-a="stadBuild" data-v="${it.k}" ${can?'':'disabled'}>공사</button>`:''}</div></div>`; }).join('');
  const lgT=`<table class="tbl"><thead><tr><th>구단</th><th class="num">평균</th><th class="num">점유율</th><th class="num">매진</th></tr></thead><tbody>${lg.map(x=>`<tr class="${x.t.id===tid?'me':''}"><td>${badge(x.t.id,16)} ${esc(tshort(x.t.id))}</td><td class="num">${x.n?x.avg.toLocaleString('ko-KR'):'-'}</td><td class="num">${x.n?Math.round(x.occ*100)+'%':'-'}</td><td class="num">${x.so}</td></tr>`).join('')}</tbody></table>`;
  const sv=inTabs('stadv',[['now','구장·관중'],['fac','시설 투자'],['new','신구장'],['lg','리그 관중']],'now');
  if(sv.cur==='now')return sv.bar+csec(esc(stadName(tid)),top+price);
  if(sv.cur==='fac')return sv.bar+csec('시설 투자',`<p class="small muted">구장은 시 소유이고 구단이 임대해 운영합니다. 공사는 시즌이 끝난 뒤(10월~2월)에 시작할 수 있고, 공사비는 보유 자금에서 바로 나갑니다.</p><p class="small">보유 자금 <b class="num">${money(team(tid).cash)}</b>${can?'':' · 지금은 시즌 중이라 공사를 시작할 수 없습니다.'}</p>${UI.stadMsg?`<div class="note bad">${esc(UI.stadMsg)}</div>`:''}<div class="stad-l">${items}</div>`);
  if(sv.cur==='new')return sv.bar+csec('신구장',(()=>{ const N=S.proj; const age=G.year-stadBuilt(tid); const head=`<p class="small">${esc(stadName(tid))} · ${stadBuilt(tid)}년 개장(${age}년째)${age>=30?' · <b class="bad">노후 구장: 관중 수요 -4%</b>':age<3?' · 새 구장 효과로 관중 증가':''}</p>`;
      if(!N){ if(age<20)return head+'<p class="small sdesc">개장 20년이 지나야 신구장을 추진할 수 있습니다.</p>'; if(S.retry&&G.year<S.retry)return head+`<p class="small sdesc">협상이 결렬됐습니다. ${S.retry}년에 다시 시도할 수 있습니다.</p>`;
        return head+`<p class="small sdesc">시와 협상해 새 구장을 짓습니다. 시가 공사비 대부분을 내고 구단은 분담금(90억~160억)을 3년에 나눠 냅니다. 분담금의 70%는 모기업이 출자합니다. 협상은 6개월 걸리고, 구단주 신뢰·연고 시장 크기·단장 명성에 따라 성사 가능성이 달라집니다. 구단주 신뢰 45 이상 필요.</p><button class="btn primary" data-a="nsTalk">시에 신구장 협상 제안</button>`; }
      if(N.stage==='talk')return head+`<div class="note">협상 중 · ${dmd(N.res)}쯤 결과</div>`;
      if(N.stage==='plan')return head+`<div class="note good">시와 합의했습니다. 규모를 고르세요.</div><div class="stad-l">${NEWSTAD.map(o=>`<div class="stad-i"><b>${o.l} · ${o.cap.toLocaleString('ko-KR')}석</b><p class="small sdesc">${o.d} 공사 3년, 개장 후 시설은 모두 4단계 이상.</p><button class="btn small primary" data-a="nsPick" data-v="${o.k}">${o.l}으로 착공</button></div>`).join('')}</div>`;
      return head+`<div class="note">${NEWSTAD.find(o=>o.k===N.k).l} 신구장 공사 중 · ${dmd(N.done)} ${dobj(N.done).y}년 개장 예정 · 분담금 ${money(N.paid||0)} / ${money(N.cost)} 납부 · 공사 기간 관중 수요 -2%</div>`; })());
  return sv.bar+csec('리그 관중',lgT+'<p class="small muted">2025년 실제 KBO는 경기당 평균 17,101명, 좌석 점유율 82.9%였습니다.</p>');
}
/* ---------- 구단 연대기 ---------- */
const CHK={season:'시즌',trade:'트레이드',fa:'FA',draft:'신인 지명',found:'창단',mgr:'감독',stad:'구장',cap:'주장',award:'수상',star:'프랜차이즈',legend:'레전드',fired:'단장',join:'단장'};
function chronView(){ const tid=G.user; const t=team(tid); const C=(G.chron||[]).filter(x=>x.tid===tid); const H=(G.history||[]).filter(h=>h.y>=2026);
  const champs=H.filter(h=>h.champ===tid).map(h=>h.y); const ps=C.filter(x=>x.k==='season'&&/진출|우승|준우승/.test(x.t)).length;
  const stars=domestic(tid).filter(p=>p.fr&&p.fr.tid===tid); const leg=(G.frLeg||[]).filter(x=>x.tid===tid); const cap=captainOf(tid);
  const ys=[...new Set(C.map(x=>x.y))].sort((a,b)=>b-a);
  const top=`<dl class="tsum"><div><dt>우승</dt><dd class="num">${champs.length}회${champs.length?` <span class="small muted">(${champs.join(', ')})</span>`:''}</dd></div><div><dt>가을야구</dt><dd class="num">${ps}회</dd></div><div><dt>기록된 시즌</dt><dd class="num">${ys.length}</dd></div></dl>
    <p class="small">주장 ${cap?`<button class="lnk" data-a="player" data-v="${cap.id}">${esc(cap.name)}</button>`:'없음'}${t.cap==null?'':''} · 프랜차이즈 스타 ${stars.length?stars.map(p=>`<button class="lnk" data-a="player" data-v="${p.id}">${esc(p.name)}</button>`).join(', '):'아직 없음'}</p>
    ${leg.length?`<p class="small">은퇴한 프랜차이즈 스타: ${leg.map(x=>`${esc(x.name)}(${x.pos}, ${x.n}시즌·WAR ${x.war})`).join(', ')}</p>`:''}
    <p class="small sdesc">한 팀에서 5시즌 이상 뛰며 통산 WAR 12 이상을 쌓은 선수는 프랜차이즈 스타가 됩니다. 트레이드하면 팬들이 크게 반발하고, 은퇴하면 은퇴식을 엽니다. 영구결번은 OB·레전드 메뉴에서 정합니다. 주장은 선수 카드에서 임명할 수 있습니다.</p>`;
  const yc=y=>{ const L=C.filter(x=>x.y===y); const se=L.find(x=>x.k==='season'); const rest=L.filter(x=>x.k!=='season');
    return `<div class="chy"><div class="chy-h"><b>${y}</b><span>${se?esc(se.t):'진행 중'}</span>${champs.includes(y)?'<span class="pill good">우승</span>':''}</div>${rest.length?`<ul>${rest.map(x=>`<li><i>${CHK[x.k]||x.k}</i>${x.ref!=null&&G.players[x.ref]?`<button class="lnk" data-a="player" data-v="${x.ref}">${esc(x.t)}</button>`:esc(x.t)}</li>`).join('')}</ul>`:''}</div>`; };
  return csec(`${esc(t.city)} ${esc(t.nick)} 연대기`,top)+csec('해마다 일어난 일',ys.length?ys.map(yc).join(''):'<p class="small muted">아직 기록이 없습니다. 시즌을 치르며 트레이드·지명·FA·수상·감독 교체가 여기에 쌓입니다.</p>'); }
function clubView(){
  const s=curSub('club');
  const H0={rel:relView,ob:obView,owner:()=>ownerView()+starPanel()+ownerAskView(),media:mediaView,fin:moneyView,stad:stadView,chron:chronView,
    result:()=>G.last?csec(`${G.last.y} 시즌 결산`,resultBody()):csec('시즌 결산','<p class="small muted">첫 시즌을 마치면 결산이 올라옵니다.</p>'),
    mkt:()=>csec('마케팅 예산',period()==='pre'?marketingBody():`<p>올 시즌 예산 <b class="num">${money(G.marketing)}</b></p><p class="small muted">마케팅 예산은 개막 전(스프링캠프 기간)에만 바꿀 수 있습니다.</p>`),
    log:()=>csec('구단 일지',`<div class="log">${G.log.slice(0,60).map(l=>`<p><span class="ticker">${l.d!=null?dsh(l.d):l.y}</span> ${lk(l.t)}</p>`).join('')||'<p class="small muted">기록이 없습니다.</p>'}</div>`),
    set:()=>`<section class="card"><div class="row between"><span class="small muted">버전 ${GAME_VER} · 진행 상황은 자동 저장됩니다.</span><button class="btn small" data-a="toTitle">처음 화면으로</button></div></section>`+slotsCard(false)+exportCard()+`<section class="card">${creditsLine()}</section>`+`<section class="card"><h2 class="sec">영구결번 기준</h2><div class="chips">${[[40,'WAR 40 · 8시즌'],[60,'WAR 60 · 10시즌'],[100,'WAR 100 · 10시즌']].map(([v,l])=>`<button data-a="retWar" data-v="${v}" class="${retWarT()===v?'on':''}">${l}</button>`).join('')}</div><p class="small muted">우리 구단에서 쌓은 WAR와 시즌 수가 기준을 넘는 선수가 은퇴할 때 영구결번을 지정할 수 있습니다. 이 게임의 시즌 WAR는 리그 1위가 7~9 정도라, 100은 15년 내내 리그 최상위급이어야 닿는 수치입니다.</p></section>`+`<section class="card"><h2 class="sec">게임 관리</h2><p class="small muted">진행 상황은 이 브라우저의 현재 슬롯에 자동 저장됩니다(압축 저장). 선수 얼굴은 faces.js(ZenGM, Apache License 2.0), 메뉴 아이콘은 Lucide(ISC), 저장 압축은 lz-string(MIT)을 썼습니다. 효과음: 관중 함성·관중석 소리 Gregor Quendel "Free Crowd Cheering Sounds"(CC-BY 4.0, OpenGameArt), 타격음 Jordan Irwin "Thwack Sounds"(CC0), 미트·알림음 Kenney(CC0). 구단 엠블럼·경기장·트로피 그림과 오르간·사이렌 소리는 이 게임을 위해 직접 만든 것입니다.</p>
    ${UI.confirmNew?`<div class="note bad">지금 구단을 포기하고 새로 시작합니다. 저장된 진행이 지워집니다.</div><div class="row"><button class="btn danger" data-a="newgame">새로 시작</button><button class="btn" data-a="cancelNew">취소</button></div>`:`<button class="btn" data-a="askNew">새 게임</button>`}</section>`}; const h=mergedBody('club',s,H0);
  return subTabs('club')+h;
}
function gamesView(){
  if(!G.games.length)return csec('우리 경기','<p class="small muted">아직 치른 경기가 없습니다.</p>');
  return csec('우리 경기',`<div class="list">${G.games.slice(0,30).map((g,i)=>{ const home=g.home===G.user; const op=home?g.away:g.home; return `<button class="item wa" data-a="openGame" data-v="${i}">${badge(op,26)}<span class="nm"><span class="pill ${g.res==='승'?'good':g.res==='패'?'bad':''}">${g.res}</span> ${home?'vs':'@'} ${tname(op)}${g.kind?` <span class="small muted">${esc(g.kind)}</span>`:''}</span><span class="sub">${dmd(g.day)}${g.inn>9?` · 연장 ${g.inn}회`:''}</span><span class="rt num">${home?g.hs:g.as} : ${home?g.as:g.hs}</span></button>`; }).join('')}</div>`);
}

function tradeMood(tid,give,get){
  if(!give.length&&!get.length)return null;
  const t=team(tid); const e=evalTrade(tid,give,get);
  const sd=1.2+Math.max(0,75-t.rel)/10; // 관계가 좋을수록 상대 속내를 정확히 읽는다
  const key=[...give].sort((a,b)=>a-b).join('-')+'|'+[...get].sort((a,b)=>a-b).join('-');
  const x=e.gain-e.need+hn('tm'+tid+'|'+key,G.year)*sd;
  const lv=x>=3?{l:'받아들일 것 같습니다',c:'var(--good)'}:x>=0?{l:'긍정적으로 검토할 것 같습니다',c:'var(--r50)'}:x>=-4?{l:'조금 더 원할 것 같습니다',c:'var(--warn)'}:x>=-12?{l:'많이 부족하다고 볼 것 같습니다',c:'var(--r35)'}:{l:'불쾌하게 여길 수 있습니다',c:'var(--bad)'};
  return {...lv,w:Math.round(clamp((x+14)/20,0.03,1)*100),sd};
}
function tContract(p){ if(p.faC)return `FA계약 ${Math.max(1,p.yrs)}년 남음`; if(p.extNext)return '다년계약 합의'; const n=Math.max(0,faSvc(p)-p.svc); return n>=2?`FA까지 ${n}시즌`:n===1?'이번 시즌 뛰면 FA':(p.team==null&&G.fa&&(G.fa.pool||[]).includes(p.id))?'FA 시장':(G.last&&G.last.y>=G.year)?'FA 자격 취득':'시즌 끝나면 FA'; }
function tcard(p,side,on,hot){
  return pcard(p,{act:'tpick',v:side+':'+p.id,on,mark:on?(side==='give'?'보냄':'받음'):'+ 추가',
    tags:hot?`<span class="pill good">상대 관심 · ${esc(hot)}</span>`:p.aiListed?'<span class="pill warn">매물</span>':'',foot:`<b class="num">${money(p.sal)}</b><span>${tContract(p)}</span>${p.injOut>0?'<span class="pill bad">부상</span>':''}${p.mor!=null&&p.mor<35?'<span class="pill warn">불만</span>':''}<button class="tc-i" data-a="player" data-v="${p.id}">상세</button>`});
}
function tmini(p,side){ const rp=scoutReport(p);
  return `<div class="tmini">${avImg(p)}<div class="tm-id"><b>${esc(p.name)}</b><span>${posLabel(p)} · ${p.age}세 · ${money(p.sal)}</span></div><span class="tm-r">${rchip(rp.cur)}${rchip(rp.ofp)}</span><button class="x" data-a="tpick" data-v="${side}:${p.id}" aria-label="${esc(p.name)} 빼기">×</button></div>`; }
function tradeView(){
  const tr=UI.trade;
  if(!tradeOpen())return `<section class="card"><h2 class="sec">트레이드 기간이 아닙니다</h2><p class="small muted">7월 31일 트레이드 마감 이후에는 포스트시즌이 끝날 때까지 트레이드할 수 없습니다.</p></section>`;
  const strip=`<div class="tstrip">${G.teams.filter(t=>t.id!==G.user).map(t=>`<button data-a="tpartner" data-v="${t.id}" class="${tr.tid===t.id?'on':''}">${gmAv(t.id)}<span><b>${badge(t.id,14)} ${esc(t.city+' '+t.nick)}</b><i>${esc(gmOf(t.id).name)} · ${GMT[gmOf(t.id).trait].l} · 친분 ${t.rel}</i><em class="${negInfo(t.id).free?'free':negInfo(t.id).left?'':'out'}">${negInfo(t.id).free?'맞대결 · 제한 없음':`이번 달 ${negInfo(t.id).left}/${negInfo(t.id).cap}`}</em></span></button>`).join('')}</div>`;
  if(tr.tid==null)return `<section class="card"><div class="eyebrow">상대 구단</div>${strip.replace('class="tstrip"','class="tstrip grid"')}<p class="small muted">상대 구단을 고르면 그 팀 선수 카드가 펼쳐집니다. 관계 숫자가 높을수록 상대 단장의 반응을 정확히 읽을 수 있습니다.</p></section>`;
  const t=team(tr.tid);
  const ok=p=>p&&!p.foreign&&!(p.joinY>G.year);
  tr.give=tr.give.filter(id=>ok(G.players[id])&&G.players[id].team===G.user);
  tr.get=tr.get.filter(id=>ok(G.players[id])&&G.players[id].team===tr.tid);
  const gv=tr.give.map(id=>G.players[id]), gt=tr.get.map(id=>G.players[id]);
  const dPay=sum(gt.map(p=>p.sal))-sum(gv.map(p=>p.sal));
  const capAfter=capPay(G.user)+dPay, cap=capOf(G.year);
  const myN=playersOf(G.user).length-gv.length+gt.length, thN=playersOf(tr.tid).length+gv.length-gt.length;
  const mood=tradeMood(tr.tid,tr.give,tr.get);
  const want=tr.want&&G.players[tr.want]&&G.players[tr.want].team===G.user&&!tr.give.includes(tr.want)?G.players[tr.want]:null;
  const board=`<section class="card tboard">
    <div class="tgm">${gmAv(t.id,mood?(mood.l.includes('받아들일')?'smile':mood.l.includes('긍정')?null:mood.l.includes('조금')?'flat':'angry'):null)}<div><b>${badge(t.id,16)} ${esc(tname(t.id))} · ${esc(gmOf(t.id).name)} 단장</b><span class="small muted">${GMT[gmOf(t.id).trait].l} · 친분 ${t.rel}(${relLabel(t.rel)}) · ${esc(needText(t.id))}</span></div></div>
    ${(()=>{ if(!interestKnown(t.id))return '<p class="small muted">친분이 35 미만이라 상대가 우리 누구를 원하는지 읽기 어렵습니다.</p>'; const L=aiInterest(t.id).map(id=>G.players[id]).filter(Boolean); return L.length?`<div class="intl"><span class="small muted">상대가 원하는 우리 선수</span>${L.map(p=>`<button class="pill ${tr.give.includes(p.id)?'acc':'good'}" data-a="tpick" data-v="give:${p.id}">${tr.give.includes(p.id)?'보냄 ':'+ '}${esc(p.name)} · ${esc(interestWhy(t.id,p))}</button>`).join('')}</div><p class="small muted">이 선수를 넣으면 상대가 20% 더 높게 쳐 주고 요구 조건도 조금 낮아집니다.</p>`:''; })()}
    <div class="tcols">
      <div><div class="eyebrow">보냄 · ${gv.length}명</div>${gv.map(p=>tmini(p,'give')).join('')||'<p class="small muted tempty">아래 "우리 선수"에서 고르세요</p>'}</div>
      <div><div class="eyebrow">받음 · ${gt.length}명</div>${gt.map(p=>tmini(p,'get')).join('')||'<p class="small muted tempty">아래 "상대 선수"에서 고르세요</p>'}</div>
    </div>
    <dl class="tsum"><div><dt>연봉 변화</dt><dd class="num" style="color:${dPay>0?'var(--warn)':dPay<0?'var(--good)':'inherit'}">${dPay>=0?'+':''}${money(dPay)}</dd></div><div><dt>트레이드 후 캡</dt><dd class="num" style="color:${capAfter>cap?'var(--bad)':'inherit'}">${money(capAfter)} / ${money(cap)}</dd></div><div><dt>로스터</dt><dd class="num">우리 ${myN} · 상대 ${thN}</dd></div></dl>
    ${mood?`<div class="tmood"><div class="row between"><span class="small muted">상대 단장 반응 예상</span><b style="color:${mood.c}">${mood.l}</b></div><div class="tbarm"><span style="width:${mood.w}%;background:${mood.c}"></span><i></i></div><p class="small muted">관계 ${t.rel} 기준 예측입니다. ${mood.sd>3.5?'관계가 낮아 오차가 큽니다.':'비교적 정확합니다.'}</p></div>`:''}
    ${tr.msg?`<div class="note ${tr.ok?'good':''}">${esc(tr.msg)}${want?` <button class="btn small" data-a="tpick" data-v="give:${want.id}">${esc(want.name)} 얹기</button>`:''}</div>`:''}
    ${tr.counters&&tr.counters.length?`<div class="ctr"><span class="eyebrow">역제안</span>${tr.counters.map((c,i)=>`<div class="ctr-o"><p>${esc(c.why)}</p><span class="small muted">보냄 ${c.give.map(id=>G.players[id]?G.players[id].name:'?').join(', ')||'-'} · 받음 ${c.get.map(id=>G.players[id]?G.players[id].name:'?').join(', ')||'-'}</span><button class="btn small primary" data-a="tcounter" data-v="${i}">이 조건 수락</button></div>`).join('')}</div>`:''}
    ${tradeInsight(tr.tid,tr.give,tr.get)}
    ${(()=>{ const ni=negInfo(tr.tid); const nt=negTurn(tr.tid); const sg=tsig(tr.give,tr.get); const isC=nt.ctr&&nt.ctr[sg]===G.day; const dup=!isC&&(gv.length||gt.length)&&nt.seen[sg]!=null; const left=ni.left||isC; return `<div class="row"><button class="btn primary" data-a="tpropose" ${(gv.length||gt.length)&&left&&!dup?'':'disabled'}>제안하기</button><button class="btn" data-a="treset">비우기</button>${negChip(tr.tid)}</div>${dup?'<p class="small" style="color:#ffb547">이미 거절된 안과 같습니다. 선수를 바꾸거나 더해야 제안할 수 있습니다.</p>':''}`; })()}
  </section>`;
  const side=tr.side||'get', seg=tr.seg||'bat', sort=tr.sort||'cur';
  let pool=(side==='get'?domestic(tr.tid):domestic(G.user)).filter(p=>ok(p)&&(seg==='bat'?!p.isP:p.isP)).map(p=>({p,rp:scoutReport(p)}));
  const sf={cur:(a,b)=>(b.rp.cur??-1)-(a.rp.cur??-1)||(b.rp.ofp??0)-(a.rp.ofp??0),fut:(a,b)=>(b.rp.ofp??0)-(a.rp.ofp??0)||(b.rp.cur??-1)-(a.rp.cur??-1),sal:(a,b)=>b.p.sal-a.p.sal,age:(a,b)=>a.p.age-b.p.age}[sort];
  pool.sort(sf); const INT=side==='give'&&interestKnown(tr.tid)?aiInterest(tr.tid):[]; if(INT.length)pool.sort((a,b)=>(INT.includes(b.p.id)?1:0)-(INT.includes(a.p.id)?1:0));
  const sel=tr[side];
  const poolCard=`<section class="card">
    <div class="seg"><button data-a="tside" data-v="get" class="${side==='get'?'on':''}">상대 선수 (${esc(t.city+' '+t.nick)})</button><button data-a="tside" data-v="give" class="${side==='give'?'on':''}">우리 선수</button></div>
    <div class="row between wrapr"><div class="seg sm"><button data-a="tseg" data-v="bat" class="${seg==='bat'?'on':''}">야수</button><button data-a="tseg" data-v="pit" class="${seg==='pit'?'on':''}">투수</button></div>
    <div class="chips">${[['cur','현재순'],['fut','장래순'],['sal','연봉순'],['age','나이순']].map(([k,l])=>`<button data-a="tsort" data-v="${k}" class="${sort===k?'on':''}">${l}</button>`).join('')}</div></div>
    <p class="small muted">카드를 누르면 ${side==='get'?'받을':'보낼'} 선수에 올라갑니다. 현재 능력은 정확한 값이고, 장래는 우리 선수와 프로 담당 스카우트가 있는 지역 구단만 보입니다. 외국인 선수와 올해 입단 신인은 제외됩니다.</p>
    <div class="tgrid">${pool.map(({p})=>tcard(p,side,sel.includes(p.id),INT.includes(p.id)?interestWhy(tr.tid,p):'')).join('')||'<p class="small muted">대상 선수가 없습니다.</p>'}</div>
  </section>`;
  return `<section class="card"><div class="eyebrow">상대 구단</div>${strip}</section><div class="tlay">${board}${poolCard}</div>`;
}
function prevShort(p){ const h=p.prev; if(!h)return ''; return p.isP?`ERA ${pRate(h).era.toFixed(2)} · ${ipStr(h.outs)}이닝`:`OPS ${fmt3(bRate(h).ops)} · ${h.hr}홈런`; }
function extBody(){
  const c=domestic(G.user).filter(canExtend).sort((a,b)=>scoutReport(b).ofp-scoutReport(a).ofp).slice(0,6);
  const done=domestic(G.user).filter(p=>p.extNext);
  return `<p class="small muted">FA가 되기 전에 핵심 선수를 묶어 둘 수 있습니다. 선수는 자기 실력을 알고 요구하므로, 스카우트 평가가 높을수록 비쌉니다. 한 선수와는 일주일에 한 번 협상할 수 있습니다.</p>
    ${done.length?`<div class="note good">합의 완료: ${done.map(p=>`${esc(p.name)} ${p.extNext.years}년 연 ${money(p.extNext.annual)}`).join(', ')}</div>`:''}
    ${cgrid(c,p=>({sub:`${p.age}세 · ${p.svc}년차`,foot:`<b class="num">${money(p.sal)}</b><span>FA까지 ${Math.max(0,faSvc(p)-p.svc)}년</span><button class="tc-i go" data-a="player" data-v="${p.id}">협상</button>`}))}`;
}
function standingsTable(order){
  return `<table><thead><tr><th>순위 · 구단</th><th>승</th><th>패</th><th>무</th><th>승률</th><th>차</th></tr></thead><tbody>${order.map((o,i)=>`<tr class="${o.tid===G.user?'me':''}"><td><button class="lnk tname" data-a="lteamGo" data-v="${o.tid}"><span class="ticker">${i+1}</span>${badge(o.tid,18)}${tname(o.tid)}</button></td><td>${o.w}</td><td>${o.l}</td><td>${o.t||0}</td><td>${o.w+o.l?fmt3(o.w/(o.w+o.l)):'-'}</td><td>${i?((order[0].w-o.w-(order[0].l-o.l))/2).toFixed(1):'-'}</td></tr>`).join('')}</tbody></table>`;
}
function psBody(){
  const P=G.ps; const rows=[]; for(const k of ['wc','spo','po','ks']){ const r=P.res[k]; if(r)rows.push(`<div class="item" style="cursor:default"><span class="nm">${ROUNDK[k]}</span><span class="sub">${tname(r[0])} ${r[2]}-${r[3]} ${tname(r[1])}</span></div>`); }
  const s=P.cur; if(s)rows.push(`<div class="item" style="cursor:default"><span class="nm">${ROUNDK[s.round]} 진행 중</span><span class="sub">${tname(s.hi)} ${s.wh}-${s.wl} ${tname(s.lo)} · 다음 경기 ${dmd(s.days[s.gi])}</span></div>`);
  return `<div class="list">${rows.join('')}</div><p class="small muted">정규시즌 1~5위가 진출합니다. 4위는 와일드카드에서 1승만 하면 올라갑니다. 한국시리즈는 2-3-2 방식입니다.</p>`;
}
function resultBody(){ return champHero()+resultBody0(); }
function champHero(){ const L=G.last; if(!L)return ''; const h=G.history.find(x=>x.y===L.y); if(!h||h.champ!==G.user)return ''; const n=G.history.filter(x=>x.champ===G.user&&x.y<=L.y).length;
  return `<div class="champ-hero">${ART.trophy(96)}<div><span class="eyebrow">${L.y} 한국시리즈</span><b>${esc(tname(G.user))} 우승</b><span>구단 통산 ${n}번째 우승</span></div></div>`; }
function resultBody0(){
  const L=G.last; const ps=L.ps; const f=L.fins[G.user]; const uo=L.order.find(o=>o.tid===G.user);
  const rank=L.order.findIndex(o=>o.tid===G.user)+1; const tr=L.trust;
  const psRow=(label,s)=>s?`<div class="item" style="cursor:default"><span class="nm">${label}</span><span class="sub">${tname(s[0])} ${s[2]}-${s[3]} ${tname(s[1])}</span></div>`:'';
  return `<p><b>${recStr(uo)} · ${rank}위</b> · ${ps.champ===G.user?'한국시리즈 우승':rank<=5?'가을야구 진출':'가을야구 탈락'}</p>
    <div class="months">${(L.months||[]).map(x=>`<div><span>${x.m}</span><b>${x.w}-${x.l}${x.t?`-${x.t}`:''}</b></div>`).join('')}${(()=>{ const M=L.months||[]; if(!M.length)return ''; const w=sum(M.map(x=>x.w)), l=sum(M.map(x=>x.l)), t=sum(M.map(x=>x.t||0)); return `<div class="tot"><span>합계</span><b>${w}-${l}${t?`-${t}`:''}</b></div>`; })()}</div>
    <p class="small">구단주 신뢰 ${tr.before} → <b>${tr.after}</b> <span class="pill ${tr.delta>=0?'good':'bad'}">${tr.delta>=0?'+':''}${tr.delta}</span></p>
    ${L.notes.map(n=>`<div class="note bad">${esc(n)}</div>`).join('')}
    ${L.awards?`<div class="eyebrow">시상</div><p class="small">MVP ${L.awards.mvp?esc(L.awards.mvp.name)+'('+tshort(L.awards.mvp.t)+')':'-'} · 신인왕 ${L.awards.roy?esc(L.awards.roy.name)+'('+tshort(L.awards.roy.t)+')':'-'} · 우리 골든글러브 ${Object.values(L.awards.gg).filter(x=>x.t===G.user).map(x=>esc(x.name)).join(', ')||'없음'}</p>`:''}
    ${L.goals&&L.goals.length?`<div class="eyebrow">구단주 목표 평가</div><div class="list">${L.goals.map(g=>`<div class="item" style="cursor:default"><span class="nm">${esc(g)}</span></div>`).join('')}</div>`:''}${L.pr?`<p class="small">시즌 말 팬 여론 ${L.pr.fan} · 언론 논조 ${L.pr.press}</p>`:''}
    <div class="eyebrow">포스트시즌</div><div class="list">${psRow('와일드카드',ps.wc)}${psRow('준플레이오프',ps.spo)}${psRow('플레이오프',ps.po)}${psRow('한국시리즈',ps.ks)}</div>
    <p class="small muted">포스트시즌 입장 수입 ${money(L.gate)} 중 운영비를 뺀 ${money(L.pool)}을 배당. 정규시즌 1위 20%, 나머지는 우승 50%, 준우승 24%, 플레이오프 14%, 준플레이오프 9%, 와일드카드 3%.</p>
    <div class="eyebrow">결산</div>${finTable(f)}
    <div class="eyebrow">시즌 리더</div><div class="list">${L.leaders.map(l=>{const p=G.players[l.id]; return `<button class="item" data-a="player" data-v="${l.id}" ${p?'':'disabled'}><span class="nm">${l.k} · ${esc(l.nm||(p?p.name:'은퇴 선수'))}</span><span class="sub">${l.t!=null&&G.teams[l.t]?tname(l.t):p&&p.team!=null?tname(p.team):''}</span><span class="rt num">${l.v}</span></button>`}).join('')}</div>`;
}
function finTable(f){
  return `<dl class="kv">${f.inc.map(x=>`<dt>${x[0]}</dt><dd>+${money(x[1])}</dd>`).join('')}${f.exp.map(x=>`<dt>${x[0]}</dt><dd>-${money(x[1])}</dd>`).join('')}
    <dt class="tot">순이익</dt><dd class="tot" style="color:${f.net>=0?'var(--good)':'var(--bad)'}">${f.net>=0?'+':''}${money(f.net)}</dd>${f.selfC?`<dt>적자 자체 충당(보유 자금)</dt><dd>${money(f.selfC)}</dd>`:''}${f.div?`<dt>투자사 배당(80억 초과분의 절반)</dt><dd>${money(f.div)}</dd>`:''}
    <dt>관중</dt><dd>${Math.round(f.att/1e4)}만 명</dd>${f.supCap?`<dt>모기업 적자 보전 한도</dt><dd>${money(f.supCap)}</dd>`:''}<dt>시즌 후 보유 자금</dt><dd>${money(f.cash)}</dd></dl>`;
}
function contractView(){
  const C=G.contract;
  const ended=C.ended.map(id=>G.players[id]).filter(Boolean).sort((a,b)=>b.newSal-a.newSal);
  const fEnd=C.foreignEnd.map(id=>G.players[id]).filter(Boolean);
  const raise=sum(ended.map(p=>p.newSal-p.sal));
  return `
  <section class="card hero" data-k="연봉협상">
    <div class="eyebrow">연봉 협상 · 1월 31일 마감</div>
    <p>계약이 끝난 국내 선수 ${ended.length}명, 외국인 ${fEnd.length}명의 재계약안입니다. 최근 1군 기록을 기준으로 산정했습니다. 남길 수 없는 선수는 방출하세요.</p>
    <p class="small">국내 선수 인상 총액 <b class="num">${raise>=0?'+':''}${money(raise)}</b></p>
    ${UI.ctMsg?`<div class="note ${/넘습니다|거절/.test(UI.ctMsg)?'bad':''}">${esc(UI.ctMsg)}</div>`:''}
    <button class="btn primary block" data-a="confirmContracts">연봉 계약 확정</button>
    ${fEnd.length?`<div class="eyebrow">외국인 재계약</div>${(()=>{ const f=fReCapInfo(); const keep=fEnd.filter(p=>!C.foreignDrop.includes(p.id)); const dRaise=sum(keep.map(p=>p.newSal-p.sal)); let room=null; try{ room=budget().roomGoal; }catch(e){}
  return f?`<p class="small ${f.over>0?'bad':''}"><b>용병 3명 총액 ${money(f.tot)} / 리그 한도 ${money(f.cap)}</b> (${Math.round(f.tot/USD)}만 / ${Math.round(f.cap/USD)}만 달러)${f.over>0?` · ${money(f.over)} 초과: 결별하거나 깎아서 협상해야 확정됩니다`:''}</p><p class="small">재계약 인상 합계 <b class="${dRaise>0?'bad':'good'}">${dRaise>=0?'+':''}${money(dRaise)}</b>${room!=null?` · 예산 여유 ${money(room)} → <b class="${room-dRaise<0?'bad':''}">${money(room-dRaise)}</b>${room-dRaise<0?' (구단주 지원 한도를 넘습니다)':''}`:''}</p>`:''; })()}<p class="small muted">잘한 선수는 더 달라고 합니다(최대 1.7배). 재계약은 100만 달러 상한이 없지만 3명 총액 한도가 있습니다. "15% 깎아 협상"은 한 번만 할 수 있고, 거절당하면 그 선수는 떠납니다. 결별한 선수 중 쓸 만한 선수는 시장에 나와 다른 구단이 데려갈 수 있습니다.</p><div class="list">${fEnd.map(p=>{const drop=C.foreignDrop.includes(p.id); return `<div class="item" style="cursor:default"><button class="nm lnk" data-a="player" data-v="${p.id}">${esc(p.name)} <span class="small muted">${posLabel(p)} · ${p.age}세</span></button><span class="sub">${statLine(curLine(p),p)}</span><span class="rt"><span class="num">${money(p.sal)} → <b>${money(p.newSal)}</b></span><br>${!drop&&!(C.fneg||{})[p.id]?`<button class="btn small" data-a="fneg" data-v="${p.id}">15% 깎아 협상</button> `:''}${p.fleft?'<span class="pill bad">떠남</span>':`<button class="btn small ${drop?'':'danger'}" data-a="fdrop" data-v="${p.id}">${drop?'재계약으로 변경':'결별'}</button>`}</span></div>`}).join('')}</div>`:''}
    <div class="eyebrow">국내 선수 연봉안</div>
    <div class="list">${ended.map(p=>{const d=p.newSal-p.sal; return `<div class="item" style="cursor:default"><button class="nm lnk" data-a="player" data-v="${p.id}">${esc(p.name)} <span class="small muted">${posLabel(p)} · ${p.age}세</span></button><span class="sub">${statLine(curLine(p),p)}</span><span class="rt"><span class="num">${money(p.sal)} → <b>${money(p.newSal)}</b></span><br><span class="pill ${d>0?'warn':d<0?'good':''}">${d>0?'+':''}${Math.round(d/p.sal*100)}%</span> <button class="btn small danger" data-a="relNow" data-v="${p.id}">방출</button></span></div>`}).join('')}</div>
  </section>`;
}
function faView(){
  const F=G.fa; const ids=F.pool.filter(id=>G.players[id]&&G.players[id].team==null).sort((a,b)=>G.players[b].ask.annual-G.players[a].ask.annual);
  const myOffers=Object.entries(F.offers); const offSum=sum(myOffers.map(([,o])=>o.annual));
  return `<section class="card hero" data-k="FA시장">
    <div class="eyebrow">FA 시장 · ${F.open?(G.day>=F.openDay?'협상 중':'11월 6일 협상 시작'):'11월 2일 공시'} · 1월 24일(캠프 전날) 사실상 마감</div>
    <p>남은 FA ${ids.length}명. 선수를 눌러 스카우트 의견을 보고 조건을 제시하세요. 선수는 날마다 들어온 제안을 비교하다가 계약합니다. 관심 구단이 많을수록 빨리 결정합니다.</p>
    <p class="small muted">A등급 영입 시 원소속 구단에 직전 연봉 200%와 보호선수 20인 외 보상선수 1명, B등급은 100%와 25인 외 1명, C등급은 150%만 내줍니다. 원소속 구단 재계약에는 보상이 없습니다.</p>
    <p class="small">제시 중 ${myOffers.length}건 · 연 ${money(offSum)} · 성사 시 캡 산정액 최대 <b class="num">${money(capPay(G.user)+offSum)}</b> / ${money(capOf(G.year))}</p>
    <div class="list">${ids.slice(0,30).map(id=>{const p=G.players[id]; const o=F.offers[id]; const rp=scoutReport(p); const n=Object.keys(F.ai[id]||{}).length; return `<button class="item" data-a="player" data-v="${id}"><span class="nm">${esc(p.name)} <span class="pill acc">${p.faGrade}</span>${o?' <span class="pill good">제시함</span>':''}${n?` <span class="pill">관심 ${n}곳</span>`:''}</span><span class="sub">${posLabel(p)} · ${p.age}세 · ${tshort(p.faFrom)} · ${esc(rp.arch)} · ${statLine(curLine(p),p)}</span><span class="rt num">${money(p.ask.annual)}<br><span class="small muted">${p.ask.years}년</span></span></button>`}).join('')}</div>
    ${F.results.length?`<div class="eyebrow">최근 계약</div><div class="list">${F.results.slice(0,8).map(r=>`<div class="item" style="cursor:default"><span class="nm">${esc(r.name)} <span class="pill">${r.grade}</span></span><span class="sub">${dsh(r.day)} · ${tshort(r.from)} → <b>${tshort(r.to)}</b>${r.compPlayer?` · 보상선수 ${esc(r.compPlayer)}`:''}</span><span class="rt num">${r.years}년 ${money(r.annual)}</span></div>`).join('')}</div>`:''}
  </section>`;
}
/* ---------- 선수단 탭: 야구장 배치도 ---------- */
const FPOS={CF:[180,40],LF:[62,92],RF:[298,92],SS:[118,152],'2B':[242,152],'3B':[62,212],'1B':[298,212],P:[180,240],C:[180,298],DH:[60,298]};
const fname=p=>{ let n=p.name.includes(' ')?p.name.split(' ').pop():p.name; return n.length>4?n.slice(0,4):n; };
/* 배치도에서 고른 자리에 쓸 수 있는 선수들: 능력과 연봉을 먼저 */
function fposList(tid,pos){ if(!pos)return '';
  const d=depth(tid); const own=tid===G.user; const ps=playersOf(tid).filter(p=>own||!scoutReport(p).unseen||publicP(p)); const startIds=new Set(Object.values(d.ln).map(p=>p.id)); const y=G.year;
  const where=p=>!healthy(p)?`<span class="pill bad">부상 ${p.injOut}일</span>`:isAway(p)?'<span class="pill">군 복무</span>':startIds.has(p.id)?`<span class="pill good">${d.ln[pos]&&d.ln[pos].id===p.id?'이 자리 주전':'다른 자리 주전'}</span>`:d.sp.includes(p)?`<span class="pill good">${d.sp.indexOf(p)+1}선발</span>`:d.pen.includes(p)?`<span class="pill">${d.pen.indexOf(p)===0?'마무리':'불펜'}</span>`:(entryOn()&&!p.e1)||d.futB.includes(p)||d.futP.includes(p)?'<span class="pill">퓨처스</span>':'<span class="pill">벤치</span>';
  const st=p=>{ const h0=seasonTotal(p,y,'1군'); const h=(p.isP?h0&&h0.outs:h0&&h0.pa)?h0:seasonTotal(p,y,'퓨처스'); if(!h)return '기록 없음'; const f=h===h0?'':'2군 '; return p.isP?(h.outs?`${f}ERA ${pRate(h).era.toFixed(2)} · ${ipStr(h.outs)}이닝`:'-'):(h.pa?`${f}${fmt3(bRate(h).avg)} · OPS ${fmt3(bRate(h).ops)} · ${h.hr}홈런`:'-'); };
  const row=(p,extra)=>`<button class="fpl-r" data-a="player" data-v="${p.id}">${avImg(p)}<span class="fpl-m"><b>${esc(p.name)}</b><i>${p.isP?`${p.th}투 · 체력 ${Math.round(p.r.sta)}`:`${POSS[p.pos]}${subsOf(p).length?' · '+subsOf(p).map(k=>POSS[k]).join('·'):''}`} · ${p.age}세 · ${st(p)}</i></span><span class="fpl-r2">${where(p)}${extra||''}</span><span class="fpl-o">${rchip(Math.round(scoutReport(p).cur))}<em>${money(p.sal)}</em></span></button>`;
  let L, title;
  if(pos==='P'){ const pit=ps.filter(p=>p.isP); const ord=p=>d.sp.includes(p)?d.sp.indexOf(p):d.pen.includes(p)?10+d.pen.indexOf(p):100-ovr(p); L=pit.sort((a,b)=>ord(a)-ord(b)); title=`투수 ${L.length}명`; }
  else { L=ps.filter(p=>!p.isP&&(pos==='DH'||p.pos===pos||(subsOf(p)||[]).includes(pos))).sort((a,b)=>posScore(b,pos)-posScore(a,pos)); title=`${POSK[pos]} 가능 ${L.length}명`; }
  const [fx,fy]=FPOS[pos]||[180,160]; const up=fy>200; const pos2=up?`bottom:${((330-(fy-26))/330*100).toFixed(1)}%`:`top:${((fy+26)/330*100).toFixed(1)}%`;
  return `<div class="fdd ${up?'up':''}" style="${pos2};--cx:${(fx/360*100).toFixed(1)}%"><div class="fdd-h"><b>${title}</b><button class="x" data-a="fpos" data-v="" aria-label="닫기">×</button></div><div class="fdd-l">${L.map(p=>row(p,!p.isP&&pos!=='DH'?`<span class="small muted">수비 ${Math.round(defAt(p,pos))}</span>`:'')).join('')||'<p class="small muted">선수가 없습니다.</p>'}</div></div>`; }
function fieldSVG(tid,interactive,inline){
  const d=depth(tid); const ps=playersOf(tid); const order=orderList(d.start); const t=team(tid);
  const next=d.sp.length?d.sp[(t.rot||0)%d.sp.length]:null;
  const node=(pos)=>{ const [x,y]=FPOS[pos];
    let name='공석',stat='',cnt=0,face='',no=0,off=false,ov=null;
    if(pos==='P'){ const p=next; name=p?fname(p):'선발 미정'; face=p?faceSVG(p):''; ov=p?scoutReport(p).cur:null; const h0=p?seasonTotal(p,G.year,'1군'):null; const h=h0&&h0.outs?h0:p?seasonTotal(p,G.year-1,'1군'):null; stat=h&&h.outs?`${h===h0?'':String(G.year-1).slice(2)+'년 '}ERA ${pRate(h).era.toFixed(2)}`:'기록 없음'; }
    else { const p=d.ln[pos]; if(p){ name=fname(p); face=faceSVG(p); ov=scoutReport(p).cur; no=order.indexOf(p)+1; off=pos!=='DH'&&p.pos!==pos; const h0=seasonTotal(p,G.year,'1군'); const h=h0&&h0.pa?h0:seasonTotal(p,G.year-1,'1군'); stat=h&&h.pa?`${h===h0?'':String(G.year-1).slice(2)+'년 '}${fmt3(bRate(h).avg)} ${h.hr}홈런`:'기록 없음'; }
      cnt=pos==='DH'?0:ps.filter(q=>!q.isP&&q.pos===pos&&(!p||q.id!==p.id)).length; }
    const da=inline?`data-a="fpos" data-v="${pos}"`:interactive?`data-a="posSheet" data-v="${pos}"`:`data-a="tposSheet" data-v="${tid}:${pos}"`;
    const bx=x-59, by=y-24;
    const salP=pos==='P'?next:d.ln[pos]; if(salP)stat=`연봉 ${money(salP.sal)}`;
    return `<g class="pos${off?' ov':''}${inline&&UI.fpos===pos?' sel':''}" ${da} tabindex="0" role="button" aria-label="${POSK[pos]||'투수'} ${esc(name)}">
      <rect class="box" x="${bx}" y="${by}" width="118" height="48" rx="8"></rect>
      ${face?`<rect x="${bx+4}" y="${by+5}" width="38" height="38" rx="4" fill="#0a0f13"></rect><image href="${face}" x="${bx+4}" y="${by+5}" width="38" height="38"></image>`:''}
      <text class="pl" x="${bx+46}" y="${by+13}">${pos==='P'?'다음 선발':POSS[pos]}${off?' *':''}</text>
      <text class="pn" x="${bx+46}" y="${by+28}">${esc(name)}</text>
      <text class="ps" x="${bx+46}" y="${by+40}">${stat}</text>
      ${ov!=null?`<rect x="${bx+90}" y="${by+17}" width="24" height="16" rx="2" fill="${rcol(ov)}"></rect><text class="ovt" x="${bx+102}" y="${by+29}" text-anchor="middle">${ov}</text>`:''}
      ${no?`<circle class="ord" cx="${bx+4}" cy="${by+5}" r="8"></circle><text class="ordt" x="${bx+4}" y="${by+8.5}" text-anchor="middle">${no}</text>`:''}
      ${cnt?`<circle class="bd" cx="${bx+114}" cy="${by+4}" r="8"></circle><text class="bdt" x="${bx+114}" y="${by+7.5}" text-anchor="middle">+${cnt}</text>`:''}
    </g>`; };
  return `<svg class="field" viewBox="-14 -10 388 350" role="group" aria-label="포지션 배치도">
    <path d="M180 322 L14 156 A234 234 0 0 1 346 156 Z" fill="var(--grass)"></path>
    <path d="M180 312 L272 220 L180 128 L88 220 Z" fill="var(--dirt)"></path>
    <path d="M180 290 L250 220 L180 150 L110 220 Z" fill="var(--grass2)"></path>
    <circle cx="180" cy="220" r="11" fill="var(--dirt)"></circle>
    ${[[180,302],[262,220],[180,138],[98,220]].map(([x,y])=>`<rect x="${x-5}" y="${y-5}" width="10" height="10" transform="rotate(45 ${x} ${y})" fill="var(--chalk)"></rect>`).join('')}
    ${inline&&UI.fpos?'<rect x="0" y="0" width="360" height="330" fill="transparent" data-a="fpos" data-v=""></rect>':''}${Object.keys(FPOS).map(node).join('')}
  </svg>`;
}
function sqTable(groups,pit){
  if((UI.rview||'card')==='card')return sqCards(groups);
  const head=pit?['선수','역할','나이','현재','장래','기분','ERA','이닝','WAR','연봉']:['선수','포지션','나이','현재','장래','기분','OPS','홈런','WAR','연봉'];
  const row=(p,pos)=>{ const rp=scoutReport(p); const h=curLine(p); const m=p.mor??60;
    const st=p.isP?[h&&h.outs?pRate(h).era.toFixed(2):'-',h?ipStr(h.outs):'-']:[h&&h.pa?fmt3(bRate(h).ops):'-',h?h.hr:'-'];
    const tags=[p.injOut>0?`<span class="pill bad">부상 ${p.injOut}일</span>`:'',p.foreign?'<span class="pill">외</span>':'',isRookie(p)?'<span class="pill acc">신인</span>':'',p.listed?'<span class="pill warn">명단</span>':''].join('');
    return `<tr class="click" data-a="player" data-v="${p.id}"><td><span class="pn">${avImg(p)}<span>${esc(p.name)} ${tags}</span></span></td><td>${pos||posLabel(p)}</td><td>${p.age}</td><td>${rchip(rp.cur)}</td><td>${rchip(rp.ofp)}</td><td><span class="mood" style="--c:${m>=65?'var(--good)':m>=45?'var(--r50)':m>=30?'var(--warn)':'var(--bad)'}" title="${moodLabel(m)}"></span></td><td>${st[0]}</td><td>${st[1]}</td><td>${h?wOf(h,p).toFixed(1):'-'}</td><td>${money(p.sal)}</td></tr>`; };
  return `<div class="tw"><table class="sqt"><thead><tr>${head.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${groups.filter(g=>g[1].length).map(([g,arr,posf])=>`<tr class="grp"><td colspan="10">${g} · ${arr.length}명</td></tr>`+arr.map(p=>row(p,posf?posf(p):null)).join('')).join('')}</tbody></table></div>`;
}
function rosterView(){
  const tid=UI.rosterTeam??G.user; const own=tid===G.user; const t=team(tid);
  const d=depth(tid); const rv=UI.rview||'table';
  const vis0=p=>tid===G.user||!scoutReport(p).unseen||publicP(p);
  const RT=[['field','배치도'],['glance','한눈에'],...(tid===G.user?[['cmp','전력 비교']]:[]),['bat',`야수 ${playersOf(tid).filter(p=>!p.isP&&vis0(p)).length}`],['pit',`투수 ${playersOf(tid).filter(p=>p.isP&&vis0(p)).length}`],...(tid===G.user?[['diag','포지션 진단']]:[])];
  const it=inTabs('roster',RT,'field'); if(it.cur==='bat'||it.cur==='pit')UI.seg=it.cur; const seg=UI.seg==='pit'?'pit':'bat';
  const rookies=own?Object.values(G.players).filter(p=>p.team===G.user&&p.joinY>G.year):[];
  const pf=(UI.rpos=UI.rpos||{bat:'all',pit:'all'})[seg];
  const cv=own?null:coverOf(tid);
  const vis=p=>own||!scoutReport(p).unseen||publicP(p);
  const hidden=own?0:playersOf(tid).filter(p=>!vis(p)).length;
  const sel=`<select data-a="rosterTeam" aria-label="구단 선택">${G.teams.map(x=>`<option value="${x.id}" ${x.id===tid?'selected':''}>${x.id===G.user?'우리 구단':esc(x.city+' '+x.nick)}${x.id!==G.user&&!coverOf(x.id).sc?' (스카우트 없음)':''}</option>`).join('')}</select>`;
  const cover=own?'':`<section class="card covc"><div class="row between"><div class="row">${badge(tid,32)}<div><b>${tname(tid)}</b><div class="small muted">${t.mode==='contend'?'우승 경쟁':'리빌딩'} · 구단주 ${OWNER[t.owner].label} · 단장 관계 ${t.rel}</div></div></div><button class="btn small" data-a="tpartnerGo" data-v="${tid}">트레이드 테이블</button></div>
    <p class="small">${cv.sc?`<b>${esc(cv.sc.name)} 스카우트</b>(${cv.reg} · 능력 ${'★'.repeat(cv.sc.skill)})가 담당합니다. ${cv.sc.skill>=3?'1군과 퓨처스 선수까지 현재 능력을 평가합니다.':'1군 선수만 평가합니다. 퓨처스까지 보려면 능력 3 이상 스카우트가 필요합니다.'}`:`<b>${cv.reg}</b> 지역을 맡은 스카우트가 없습니다. 1군 기록만 볼 수 있고 능력 평가는 없습니다.`} 다른 구단 선수의 장래성은 알 수 없습니다.${hidden?` 파악하지 못한 퓨처스 선수 ${hidden}명은 명단에서 빠졌습니다.`:''}</p></section>`;
  const eN=playersOf(tid).filter(p=>p.e1).length;
  const head=(own?trimCard():'')+`<div class="row between wrapr"><div class="row" style="flex:1;min-width:0">${sel}</div><div class="row small"><span class="chipn">1군 <b>${entryOn()?eN:'-'}</b>/${entryLimit()}</span><span class="chipn">정식 <b>${rosterN(tid)}</b>/${ROSTER_MAX}</span><span class="chipn">육성 <b>${ysN(tid)}</b>/${YS_MAX}</span></div></div>`+cover;
  const fieldC=`<section class="card"><div class="row between"><h2 class="sec">포지션 배치도</h2><span class="small muted">${own?'':'현재 능력 기준'}</span></div><div class="fwrap">${fieldSVG(tid,own,true)}${fposList(tid,UI.fpos||null)}</div><p class="small keep fpl-h">자리를 누르면 그 자리에 쓸 수 있는 선수가 펼쳐집니다. 투수 자리를 누르면 투수 전원이 나옵니다.</p><p class="small muted">오른쪽 색 숫자는 현재 능력(종합)입니다. 원 숫자는 타순, +는 같은 포지션 선수 수, *는 본래 포지션이 아닌 자리입니다.${own?'':' 평가가 없는 선수는 숫자가 비어 있습니다.'}</p></section>`;
  if(it.cur==='glance')return head+it.bar+glanceView(tid);
  if(it.cur==='lineup')return head+it.bar+lineupCard(tid);
  if(it.cur==='staff')return head+it.bar+staffCard(tid);
  if(it.cur==='field')return head+it.bar+fieldC;
  if(it.cur==='cmp')return head+it.bar+cmpView();
  if(it.cur==='diag')return head+it.bar+posDiag('bat')+posDiag('pit');
  const posOf={}; for(const k in d.ln)posOf[d.ln[k].id]=k;
  let groups;
  if(seg==='bat'){
    const lineup=orderList(d.start);
    const posf=p=>posOf[p.id]?POSS[posOf[p.id]]+(posOf[p.id]!==p.pos&&posOf[p.id]!=='DH'?`(${POSS[p.pos]})`:''):POSS[p.pos];
    groups=[['주전 (타순)',lineup,posf],[entryOn()?'1군 백업':'백업',d.bench],['퓨처스',d.futB.filter(p=>!p.ys)],['육성선수',d.futB.filter(p=>p.ys)],['부상',d.inj.filter(p=>!p.isP)],['군 복무',awayOf(tid).filter(p=>!p.isP&&p.mil&&p.mil.until)],['입단 예정',rookies.filter(p=>!p.isP)]];
  } else {
    const role=arr=>p=>arr===d.pen?(arr.indexOf(p)===0?'마무리':arr.indexOf(p)<4?'필승조':'추격조'):arr===d.sp?(arr.indexOf(p)+1)+'선발':posLabel(p);
    groups=[['선발 로테이션',d.sp,role(d.sp)],[entryOn()?'1군 불펜':'불펜',d.pen,role(d.pen)],['퓨처스',d.futP.filter(p=>!p.ys)],['육성선수',d.futP.filter(p=>p.ys)],['부상',d.inj.filter(p=>p.isP)],['군 복무',awayOf(tid).filter(p=>p.isP&&p.mil&&p.mil.until)],['입단 예정',rookies.filter(p=>p.isP)]];
  }
  const keep=p=>vis(p)&&(pf==='all'||(seg==='bat'?p.pos===pf:(pf==='SP'?isSPr(p):!isSPr(p))));
  groups=groups.map(([g,arr,f])=>[g,arr.filter(keep),f]);
  const chipsP=seg==='bat'?[['all','전체'],...['C','1B','2B','3B','SS','LF','CF','RF'].map(k=>[k,POSS[k]])]:[['all','전체'],['SP','선발형'],['RP','불펜형']];
  const filt=`<div class="chips">${chipsP.map(([k,l])=>`<button data-a="rpos" data-v="${k}" class="${pf===k?'on':''}">${l}${k!=='all'?` <i class="cnt">${playersOf(tid).filter(p=>vis(p)&&(seg==='bat'?!p.isP&&p.pos===k:p.isP&&(k==='SP'?isSPr(p):!isSPr(p)))).length}</i>`:''}</button>`).join('')}</div>`;
  UI._own=own;
  const body=rv==='card'?sqCards(groups):rosterTable(groups,seg==='pit');
  return head+it.bar+`<section class="card"><div class="row between"><h2 class="sec">${seg==='bat'?'야수':'투수'} 명단</h2><div class="row"><span class="small muted">${statBasis()}</span><div class="seg sm"><button data-a="rview" data-v="table" class="${rv==='table'?'on':''}">표</button><button data-a="rview" data-v="card" class="${rv==='card'?'on':''}">카드</button></div></div></div>${filt}${body}
    <p class="small muted">열 제목을 누르면 그 기준으로 정렬합니다(한 번 더 누르면 반대로). 현재는 정확한 능력, 장래는 코치진·스카우트 평가입니다.${own?' 기분 점은 선수 만족도, 막대는 피로입니다.':' 다른 구단 선수의 장래성·기분·피로는 알 수 없습니다.'} 주전과 타순은 감독이 정합니다.</p></section>`;
}
function statBasis(){ const per=period(); return per==='season'||per==='post'?`${G.year} 1군 성적 (퓨처스는 F)`:`${G.year-1} 성적 기준`; }
const RCOL_B=[['g','경기'],['pa','타석'],['avg','타율'],['obp','출루율'],['slg','장타율'],['ops','OPS'],['hr','홈런'],['rbi','타점'],['sb','도루'],['bb','볼넷'],['so','삼진'],['bbk','볼삼비'],['war','WAR']];
const RCOL_P=[['g','경기'],['gs','선발'],['ip','이닝'],['era','ERA'],['whip','WHIP'],['w','승'],['l','패'],['sv','세'],['hld','홀'],['so','탈삼진'],['bb','볼넷'],['k9','K/9'],['bb9','BB/9'],['war','WAR']];
function rline(p){ const per=period(); const y=per==='season'||per==='post'?G.year:G.year-1; return seasonTotal(p,y,'1군')||seasonTotal(p,y,'퓨처스'); }
function rstat(p,k){ const h=rline(p); if(!h)return null;
  if(k==='war')return wOf(h,p);
  if(p.isP){ const r=pRate(h); return {g:h.g||0,gs:h.gs||0,ip:h.outs,era:h.outs?r.era:null,whip:h.outs?r.whip:null,w:h.w||0,l:h.l||0,sv:h.sv||0,hld:h.hld||0,so:h.so,bb:h.bb,k9:h.outs?r.k9:null,bb9:h.outs?r.bb9:null}[k]; }
  const r=bRate(h); return {g:h.g||0,pa:h.pa,avg:h.pa?r.avg:null,obp:h.pa?r.obp:null,slg:h.pa?r.slg:null,ops:h.pa?r.ops:null,hr:h.hr,rbi:h.rbi,sb:h.sb,bb:h.bb,so:h.so,bbk:h.so?h.bb/h.so:(h.bb?9:null)}[k]; }
function rfmt(k,v,p){ if(v==null)return '-';
  if(['avg','obp','slg','ops'].includes(k)){ const s=fmt3(v); if(k==='ops'){ const c=v>=.9?'var(--good)':v>=.78?'var(--r50)':v<.62?'var(--bad)':'inherit'; return `<b style="color:${c}">${s}</b>`; } return s; }
  if(k==='era'){ const c=v<=3.3?'var(--good)':v<=4.2?'var(--r50)':v>=5.8?'var(--bad)':'inherit'; return `<b style="color:${c}">${v.toFixed(2)}</b>`; }
  if(k==='bbk')return `<span style="color:${v>=.8?'var(--good)':v<=.3?'var(--bad)':'inherit'}">${v.toFixed(2)}</span>`; if(k==='k9'||k==='bb9')return v.toFixed(1);
  if(k==='whip')return v.toFixed(2); if(k==='ip')return ipStr(v); if(k==='war')return `<b style="color:${v>=3?'var(--good)':v<0?'var(--bad)':'inherit'}">${v.toFixed(1)}</b>`; return v; }
function rosterTable(groups,pit){
  const cols=pit?RCOL_P:RCOL_B; const rs=UI.rs||{}; const sk=rs[pit?'pit':'bat'];
  const th=(k,l)=>`<th data-a="rsort" data-v="${k}" class="sortable${sk&&sk.k===k?' on':''}">${l}${sk&&sk.k===k?(sk.dir<0?' ▼':' ▲'):''}</th>`;
  const head=`<tr>${th('name','선수')}${th('cur','현재')}${th('sal','연봉')}${th('pos',pit?'역할':'포지션')}${th('age','나이')}${th('fut','장래')}${th('mor','기분')}${th('fat','피로')}${cols.map(([k,l])=>th(k,l)).join('')}${UI._own?'<th>계약</th><th>입단</th>':''}</tr>`;
  const row=(p,pos,grp)=>{ const rp=scoutReport(p); const m=p.mor??60; const h=rline(p); const fut=h&&h.lvl==='퓨처스';
    const tags=[p.injOut>0?`<span class="pill bad">부상 ${p.injOut}일</span>`:'',p.foreign?'<span class="pill">외</span>':'',isRookie(p)?'<span class="pill acc">신인</span>':''].join('');
    return `<tr class="click${fut?' fut':''}" data-a="player" data-v="${p.id}"><td><span class="pn">${avImg(p)}<span>${esc(p.name)} ${tags}</span></span></td><td class="ovc"><span class="ovw">${rchip(rp.cur)}${condChip(p)}</span></td><td class="num">${money(p.sal)}</td><td>${grp?`<span class="muted">${grp}</span> `:''}${pos||posLabel(p)}${!p.isP&&subsOf(p).length?` <i class="f">${subsOf(p).map(k=>POSS[k]).join('·')}</i>`:''}</td><td>${p.age}</td><td>${rchip(rp.ofp)}</td><td>${p.team===G.user?`<span class="mood" style="--c:${m>=65?'var(--good)':m>=45?'var(--r50)':m>=30?'var(--warn)':'var(--bad)'}" title="${moodLabel(m)}"></span>`:'-'}</td><td>${p.team===G.user?fatBar(p):'-'}</td>${cols.map(([k])=>`<td>${rfmt(k,rstat(p,k),p)}${fut&&k===(pit?'era':'ops')?' <i class="f">F</i>':''}</td>`).join('')}${UI._own?`<td class="small">${esc(tContract(p))}</td><td class="small"><span class="org">${esc(originOf(p))}</span></td>`:''}</tr>`; };
  const n=cols.length+8+(UI._own?2:0);
  if(!sk){ return `<div class="tw"><table class="sqt rt"><thead>${head}</thead><tbody>${groups.filter(g=>g[1].length).map(([g,arr,posf])=>`<tr class="grp"><td colspan="${n}">${g} · ${arr.length}명</td></tr>`+arr.map(p=>row(p,posf?posf(p):null)).join('')).join('')}</tbody></table></div>`; }
  const all=[]; for(const [g,arr,posf] of groups)for(const p of arr)all.push({p,g,pos:posf?posf(p):null});
  const rpC=new Map(); const rpv=p=>{ if(!rpC.has(p.id))rpC.set(p.id,scoutReport(p)); return rpC.get(p.id); };
  const val=x=>{ const p=x.p; switch(sk.k){ case 'name':return p.name; case 'pos':return x.pos||posLabel(p); case 'age':return p.age; case 'cur':return rpv(p).cur; case 'fut':return rpv(p).ofp??0; case 'mor':return p.mor??60; case 'fat':return p.fat||0; case 'sal':return p.sal; default:{ const v=rstat(p,sk.k); return v==null?null:v; } } };
  const asc=['era','whip','l','bb9'].includes(sk.k)&&pit;
  all.sort((a,b)=>{ const va=val(a),vb=val(b); if(va==null&&vb==null)return 0; if(va==null)return 1; if(vb==null)return -1; const c=typeof va==='string'?va.localeCompare(vb):va-vb; let s=sk.dir<0?-c:c; if(asc)s=-s; return s; });
  return `<div class="row between"><span class="small muted">${all.length}명 · ${cols.concat([['name','선수'],['pos','포지션'],['age','나이'],['cur','현재'],['fut','장래'],['mor','기분'],['fat','피로'],['sal','연봉']]).find(c=>c[0]===sk.k)[1]} 기준 정렬</span><button class="tc-i" data-a="rsort" data-v="">기본 배치로</button></div>
    <div class="tw"><table class="sqt rt"><thead>${head}</thead><tbody>${all.map(x=>row(x.p,x.pos,x.g.split(' ')[0])).join('')}</tbody></table></div>`;
}
function posDiag(seg){
  const all=G.teams.map(t=>({t:t.id,d:depth(t.id)}));
  const rankOf=f=>{ const vs=all.map(x=>({t:x.t,v:f(x.d)})).sort((a,b)=>b.v-a.v); return vs.findIndex(x=>x.t===G.user)+1; };
  const rc=k=>k<=3?'var(--good)':k<=7?'var(--warn)':'var(--bad)';
  const me=all.find(x=>x.t===G.user).d; const ps=playersOf(G.user);
  let cells;
  if(seg==='bat'){
    cells=['C','1B','2B','3B','SS','LF','CF','RF','DH'].map(pos=>{ const p=me.ln[pos]; const rk=rankOf(d=>d.ln[pos]?posScore(d.ln[pos],pos):0);
      const bk=pos==='DH'?0:ps.filter(q=>!q.isP&&q.pos===pos&&(!p||q.id!==p.id)).length; const h=p?curLine(p):null; const rp=p?scoutReport(p):null;
      return `<button class="dg" data-a="posSheet" data-v="${pos}" style="--rc:${rc(rk)}"><span class="dg-h"><b>${POSS[pos]}</b><i>리그 ${rk}위</i></span><span class="dg-n">${p?esc(p.name):'공석'}</span><span class="dg-s">${rp?rchip(rp.cur):''} ${h&&h.pa?'OPS '+fmt3(bRate(h).ops):''}</span><span class="dg-b ${pos!=='DH'&&bk===0?'warn':''}">${pos==='DH'?'타격 전담':bk?`백업 ${bk}명`:'백업 없음'}</span></button>`; });
  } else {
    const spR=rankOf(d=>avg(d.sp.slice(0,5).map(spV))), rpR=rankOf(d=>avg(d.pen.slice(0,5).map(penV))), clR=rankOf(d=>d.pen[0]?penV(d.pen[0]):0);
    const era=arr=>{ const hs=arr.map(curLine).filter(h=>h&&h.outs); const o=sum(hs.map(h=>h.outs)); return o?(sum(hs.map(h=>h.er))*27/o).toFixed(2):'-'; };
    const cell=(l,rk,n,s,b)=>`<div class="dg" style="--rc:${rc(rk)}"><span class="dg-h"><b>${l}</b><i>리그 ${rk}위</i></span><span class="dg-n">${n}</span><span class="dg-s">${s}</span><span class="dg-b">${b}</span></div>`;
    cells=[cell('선발진',spR,`${me.sp.length}명 로테이션`,`ERA ${era(me.sp)}`,`퓨처스 선발형 ${me.futP.filter(isSP).length}명`),
      cell('불펜',rpR,`${me.pen.length}명`,`ERA ${era(me.pen)}`,`필승조 ${me.pen.slice(1,4).map(p=>esc(p.name)).join(', ')}`),
      cell('마무리',clR,me.pen[0]?esc(me.pen[0].name):'없음',me.pen[0]?`${rchip(scoutReport(me.pen[0]).cur)} ${(curLine(me.pen[0])||{}).sv||0}세이브`:'',' ')];
  }
  return `<section class="card"><div class="row between"><h2 class="sec">${seg==='bat'?'야수':'투수'} 포지션 진단</h2><span class="small muted">주전 기준 10개 구단 중 순위 · 초록 상위 / 노랑 중위 / 빨강 하위</span></div><div class="dgrid2">${cells.join('')}</div></section>`;
}
function playerRow(p,showTeam){
  const h=curLine(p); const rp=scoutReport(p);
  const tags=[p.foreign?`<span class="pill">${p.foreign==='아시아'?'아시아':'외국인'}</span>`:'',p.faC?`<span class="pill">${p.ext?'다년':'FA'} ${p.yrs}년</span>`:'',p.extNext?'<span class="pill good">다년 합의</span>':'',p.injOut>0?`<span class="pill bad">부상 ${p.injOut}일</span>`:'',isRookie(p)?'<span class="pill acc">신인</span>':'',p.team===G.user&&p.mor!=null&&p.mor<45?`<span class="pill ${moodClass(p.mor)}">${moodLabel(p.mor)}</span>`:'',p.listed?'<span class="pill warn">트레이드 명단</span>':''].join(' ');
  return `<button class="item wa" data-a="player" data-v="${p.id}">${avImg(p)}<span class="nm">${esc(p.name)} <span class="small muted">${showTeam?tshort(p.team)+' · ':''}${posLabel(p)} · ${p.age}세</span> ${tags}</span><span class="sub">${esc(rp.arch)} · ${statLine(h,p)}</span><span class="rt num">${money(p.sal)}</span></button>`;
}
/* ---------- 리그 탭 ---------- */
/* 예전 하위 탭 이름 → 지금 자리 */
function lsegFix(s){ if(s==='board'||!s)return 'stand'; if(s==='sched'){ UI.it=UI.it||{}; UI.it.sres='cal'; return 'score'; } if(s==='games')return 'score'; if(s==='lead')return 'rec'; return s; }
function leagueView(){ UI.lseg=lsegFix(UI.lseg); UI.lseg=ALIAS.league[UI.lseg]||UI.lseg; if(!SUBS.league.some(x=>x[0]===UI.lseg))UI.lseg='stand';
  const s=UI.lseg;
  return subTabs('league')+mergedBody('league',s,{feat:featView,abroad:abroadView,hist:histView,stand:standView,score:scoreHub,news:newsView,teams:teamsView,rec:recView});
}
function findView(){
  const f=UI.lf;
  let ps=Object.values(G.players).filter(p=>p.team!=null&&!(p.joinY>G.year)&&(f.team==='all'?p.team!==G.user:p.team===+f.team)&&(f.kind==='bat'?!p.isP:p.isP));
  const val=p=>{ const h=curLine(p); if(f.sort==='war')return h?wOf(h,p):-9; if(f.sort==='stat')return h?(p.isP?(h.outs>=30?-pRate(h).era:-99):(h.pa>=50?bRate(h).ops:-1)):-99; if(f.sort==='ofp'){const r=scoutReport(p);return r.ofp??r.cur;} if(f.sort==='young')return -p.age; if(f.sort==='sal')return p.sal; return 0; };
  ps=ps.map(p=>({p,v:val(p)})).sort((a,b)=>b.v-a.v).slice(0,50).map(x=>x.p);
  const tc=`<select data-a="lfTeam" aria-label="구단"><option value="all" ${f.team==='all'?'selected':''}>다른 구단 전체</option>${G.teams.filter(t=>t.id!==G.user).map(t=>`<option value="${t.id}" ${+f.team===t.id&&f.team!=='all'?'selected':''}>${t.city} ${t.nick}</option>`).join('')}</select>`;
  const sc=`<select data-a="lfSort" aria-label="정렬">${[['war','WAR'],['stat',f.kind==='bat'?'OPS':'평균자책점'],['ofp','스카우트 장래성'],['young','어린 순'],['sal','연봉']].map(([k,l])=>`<option value="${k}" ${f.sort===k?'selected':''}>${l}</option>`).join('')}</select>`;
  return `<section class="card"><h2 class="sec">선수 찾기</h2>
    <div class="row">${tc}${sc}</div>
    <div class="row between wrapr"><div class="seg" style="flex:1"><button data-a="lfKind" data-v="bat" class="${f.kind==='bat'?'on':''}">야수</button><button data-a="lfKind" data-v="pit" class="${f.kind==='pit'?'on':''}">투수</button></div><div class="seg sm"><button data-a="rview" data-v="card" class="${(UI.rview||'card')==='card'?'on':''}">카드</button><button data-a="rview" data-v="table" class="${UI.rview==='table'?'on':''}">표</button></div></div>
    <p class="small muted">다른 구단 선수도 현재 능력은 정확히 보입니다. 장래성은 그 지역 프로 담당 스카우트가 있어야 보입니다. 선수를 눌러 트레이드 대상에 올리세요.</p>
    ${(UI.rview||'card')==='card'?cgrid(ps.slice(0,30),p=>({sub:`${tshort(p.team)} · ${posLabel(p)} · ${p.age}세 · ${hand(p)}`,foot:`${rosterFoot(p)}<button class="tc-i go" data-a="toTrade" data-v="${p.id}">트레이드</button>`})):findTable(ps)}</section>`;
}
function findTable(ps){
  const pit=UI.lf.kind==='pit';
  return `<div class="tw"><table class="sqt"><thead><tr><th>선수</th><th>구단</th><th>${pit?'역할':'포지션'}</th><th>나이</th><th>현재</th><th>장래</th><th>${pit?'ERA':'OPS'}</th><th>WAR</th><th>연봉</th></tr></thead><tbody>${ps.map(p=>{ const rp=scoutReport(p); const h=curLine(p);
    return `<tr class="click" data-a="player" data-v="${p.id}"><td><span class="pn">${avImg(p)}<span>${esc(p.name)}${p.foreign?' <span class="pill">외</span>':''}</span></span></td><td>${badge(p.team,18)}</td><td>${posLabel(p)}</td><td>${p.age}</td><td>${rchip(rp.cur)}</td><td>${rchip(rp.ofp)}</td><td>${h?(pit?(h.outs?pRate(h).era.toFixed(2):'-'):(h.pa?fmt3(bRate(h).ops):'-')):'-'}</td><td>${h?wOf(h,p).toFixed(1):'-'}</td><td>${money(p.sal)}</td></tr>`; }).join('')}</tbody></table></div>`;
}
function teamsView(){
  const sel=UI.leagueTeam;
  const list=`<section class="card"><div class="row between"><h2 class="sec">10개 구단</h2><span class="small muted">카드를 누르면 선수단을 봅니다</span></div><div class="tgrid">${[...G.teams].sort((a,b)=>(a.id===G.user?-1:b.id===G.user?1:0)).map(teamCard).join('')}</div></section>`;
  if(sel==null)return list;
  const t=team(sel); const d=depth(sel);
  const grp=(title,arr)=>arr.length?`<div class="grp-h"><span>${title}</span><i>${arr.length}명</i></div>${cgrid(arr)}`:'';
  return `<section class="card"><div class="row between"><h2 class="sec">${tname(sel)}</h2><button class="x" data-a="lteam" data-v="" aria-label="닫기">×</button></div>
    <p class="small muted">${t.mode==='contend'?'우승 경쟁':'리빌딩'} · 구단주 ${OWNER[t.owner].label} · 관계 ${t.rel} · 캡 산정액 ${money(capPay(sel))}</p>
    ${(()=>{ const tt=inTabs('team',[['field','배치·라인업'],['cards','선수 카드']]); return tt.bar+(tt.cur==='field'?fieldSVG(sel,false)+lineupCard(sel):`${grp('주전',d.start)}${grp('선발 로테이션',d.sp)}${grp('불펜',d.pen)}${grp('백업',d.bench)}${grp('퓨처스',d.futB.concat(d.futP))}${grp('부상',d.inj)}`); })()}
  </section>`+list;
}
function leaderBoard(){
  const y=period()==='pre'?G.year-1:G.year;
  const rows=[]; for(const p of Object.values(G.players)){ if(p.team==null)continue; const h=seasonTotal(p,y,'1군'); if(h)rows.push({p,h,w:wOf(h,p)}); }
  const li=(x,v)=>`<button class="item" data-a="player" data-v="${x.p.id}"><span class="nm">${esc(x.p.name)} <span class="small muted">${tshort(x.p.team)} · ${posLabel(x.p)}</span></span><span class="sub">${statLine(x.h,x.p)}</span><span class="rt num"><b>${v}</b></span></button>`;
  const b=rows.filter(x=>!x.p.isP), q=rows.filter(x=>x.p.isP);
  const blk=(title,arr,f,flt,asc)=>`<div class="eyebrow">${title}</div><div class="list">${arr.filter(flt).sort((a,c)=>asc?f(a)-f(c):f(c)-f(a)).slice(0,5).map(x=>li(x,typeof f(x)==='number'&&f(x)%1?f(x).toFixed(title.includes('OPS')||title.includes('타율')?3:title.includes('평균자책')?2:1).replace(/^0\./,'.'):f(x))).join('')}</div>`;
  const qb=x=>x.h.pa>=(period()==='season'?Math.max(30,(G.sea.rec[x.p.team]?.w+G.sea.rec[x.p.team]?.l)*3.1):446);
  const qp=x=>x.h.outs>=(period()==='season'?Math.max(30,(G.sea.rec[x.p.team]?.w+G.sea.rec[x.p.team]?.l)*3):432);
  return `<section class="card"><h2 class="sec">${y} 개인 기록</h2>
    ${blk('타자 WAR',b,x=>x.w,()=>true)}${blk('OPS',b,x=>bRate(x.h).ops,qb)}${blk('홈런',b,x=>x.h.hr,()=>true)}${blk('도루',b,x=>x.h.sb,()=>true)}
    ${blk('투수 WAR',q,x=>x.w,()=>true)}${blk('평균자책점',q,x=>pRate(x.h).era,qp,true)}${blk('탈삼진',q,x=>x.h.so,()=>true)}${blk('세이브',q,x=>x.h.sv,()=>true)}
    <p class="small muted">규정 타석·이닝은 경기 수에 맞춰 적용합니다.</p></section>`;
}

/* ---------- 재정 탭 ---------- */
function moneyView(){
  const t=team(G.user); const ci=capInfo(G.user);
  const f=G.last&&G.last.fins?G.last.fins[G.user]:null; const hs=G.history.filter(h=>h.user);
  const it=inTabs('fin',[['bud','올해 예산'],['flow','수입·지출'],['lim','용도별 한도'],['last','지난 결산'],['cap','샐러리캡'],['hist','재임 기록'],['mkt','마케팅']]);
  if(it.cur==='mkt')return it.bar+csec('마케팅 예산',period()==='pre'?marketingBody():`<p>올 시즌 예산 <b class="num">${money(G.marketing)}</b></p><p class="small muted">마케팅 예산은 개막 전(스프링캠프 기간)에만 바꿀 수 있습니다.</p>`);
  if(it.cur==='flow'||it.cur==='lim'){ const parts=budgetCards().split('<section class="card'); const pick=it.cur==='flow'?parts.find(x=>x.includes('어디에 쓰고 어디서 버나')):parts.find(x=>x.includes('용도별 한도')); return it.bar+(pick?'<section class="card'+pick:''); }
  if(it.cur==='last')return it.bar+(f?`<section class="card"><h2 class="sec">${G.last.y} 결산</h2>${finTable(f)}</section>`:'<section class="card"><p class="small muted">첫 시즌을 마치면 결산이 올라옵니다.</p></section>');
  if(it.cur==='cap')return it.bar+capCard(ci);
  if(it.cur==='hist')return it.bar+`<section class="card"><h2 class="sec">재임 기록</h2>${hs.length?`<div class="tw"><table><thead><tr><th>시즌</th><th>성적</th><th>순위</th><th>순이익</th><th>신뢰</th></tr></thead><tbody>${hs.map(h=>`<tr><td>${h.y}</td><td>${h.user.w}-${h.user.l}${h.user.t?'-'+h.user.t:''}</td><td>${h.user.rank}</td><td>${money(h.user.net)}</td><td>${h.user.trust}</td></tr>`).join('')}</tbody></table></div>`:'<p class="small muted">첫 시즌을 마치면 기록이 쌓입니다.</p>'}</section>`;
  { const parts=budgetCards().split('<section class="card'); return it.bar+parts.filter(x=>x&&!x.includes('어디에 쓰고 어디서 버나')&&!x.includes('용도별 한도')).map(x=>'<section class="card'+x).join(''); }
}
function budgetCards(){ const b=budget(); const t=team(G.user); const m=G.mgr[G.user];
  const total=Math.max(b.E,b.I+b.cap+Math.max(0,b.cash))*1.04; const w=v=>Math.max(0,v/total*100).toFixed(2)+'%';
  const segs=[['in',b.I,'예상 수입'],['sup',Math.min(b.goalSup,b.cap),'지원(목표 안)'],['sup2',Math.max(0,b.cap-b.goalSup),'지원(목표 초과)'],['cash',Math.max(0,b.cash),'보유 자금']];
  const big=b.roomGoal>=0?`<b class="ok">${money(b.roomGoal)}</b>`:`<b class="bad">목표 초과 ${money(-b.roomGoal)}</b>`;
  const supTxt=b.indie?'독립구단이라 모기업 지원이 없습니다. 수입 안에서 운영해야 하고, 모자라면 보유 자금이 줄어듭니다.'
    :`모기업이 적자를 <b>${money(b.cap)}</b>까지 메워 줍니다(구단주 신뢰 ${b.trust}에 비례). 구단주 목표는 한도의 <b>${Math.round((b.goalFrac??.5)*100)}%(${money(b.goalSup)})</b> 이하만 쓰는 것입니다. 많이 받을수록 구단주 평가가 깎입니다.`;
  const yb=foreignOf(G.user).filter(p=>p.foreign==='용병'); const as=foreignOf(G.user).filter(p=>p.foreign==='아시아');
  const mm=(G.mmarket||[]).map(x=>x.sal); const pay=m&&!m.interim?Math.round(m.sal*Math.max(0,m.yrs-.5)):0;
  const row=(l,v,max,cls)=>`<div class="bud-r"><span>${l}</span><i><em class="${cls||''}" style="width:${Math.min(100,v/max*100).toFixed(1)}%"></em></i><b>${money(v)}</b></div>`;
  const emax=Math.max(...b.exp.map(x=>x[1]),1), imax=Math.max(...b.inc.map(x=>x[1]),1);
  return `<section class="card budc"><div class="row between"><span class="eyebrow">${G.last&&G.last.y>=G.year?G.year+1:G.year} 예산 · ${dmd(finYearEnd())} 결산까지 연간 예상</span><span class="small muted">보유 자금 ${money(b.cash)}</span></div>
    <div class="bud-big"><span>${b.indie?'적자 없이':'구단주 목표 안에서'} 더 쓸 수 있는 돈</span>${big}</div>
    <div class="bud-bar">${segs.map(([k,v,l])=>v>0?`<span class="sg ${k}" style="width:${w(v)}" title="${l} ${money(v)}"></span>`:'').join('')}<span class="mk" style="left:${w(b.E)}"><i>예상 지출 ${money(b.E)}</i></span></div>
    <div class="bud-lg">${segs.map(([k,v,l])=>v>0?`<span><i class="${k}"></i>${l} ${money(v)}</span>`:'').join('')}</div>
    <div class="bud-t"><div><span>예상 수입</span><b>${money(b.I)}</b></div><div><span>예상 지출</span><b>${money(b.E)}</b></div><div><span>모기업 지원 예상</span><b class="${!b.indie&&b.support>b.goalSup?'bad':''}">${b.indie?'없음':money(b.support)}</b>${b.indie?'':`<em>한도 ${money(b.cap)}</em>`}</div><div><span>결산 후 예상 자금</span><b class="${b.endCash<0?'bad':''}">${money(b.endCash)}</b></div></div>
    <p class="small">${supTxt}</p>
    <p class="small muted">자금이 마이너스가 되면 구단주 신뢰가 크게 떨어집니다. 지원 한도와 보유 자금까지 모두 쓰면 최대 ${money(b.roomMax)}까지 더 쓸 수 있습니다. 새로 맺는 계약은 올해 남은 기간(${Math.round(b.rem*100)}%)만큼만 올해 예산에 잡힙니다.</p></section>
  <section class="card"><h2 class="sec">용도별 한도</h2><div class="bud-u">
    <div><span class="eyebrow">외국인 선수 (용병 3명)</span><b>${b.fUsed?`${Math.round(b.fUsed/USD)}만 / ${Math.round(b.fCap/USD)}만 달러`:`계약 없음 · 한도 ${Math.round(b.fCap/USD)}만 달러`}</b><i class="bar"><em style="width:${Math.min(100,b.fUsed/b.fCap*100)}%"></em></i><span class="small muted">남은 총액 ${Math.round((b.fCap-b.fUsed)/USD)}만 달러(약 ${money(b.fCap-b.fUsed)}) · 새 계약 1명당 ${Math.round(F_NEW_CAP/USD)}만 달러 이하 · ${yb.length}/3명</span></div>
    <div><span class="eyebrow">아시아쿼터 (1명)</span><b>${as.length?`${Math.round(b.aUsed/USD)}만 달러`:'비어 있음'}</b><span class="small muted">1명당 ${Math.round(ASIA_CAP/USD)}만 달러 이하</span></div>
    <div><span class="eyebrow">감독</span><b>${m?`${esc(m.name)} 연 ${money(m.sal)}`:'공석'}</b><span class="small muted">${m&&!m.interim?`잔여 ${Math.max(0,m.yrs)}년 · 경질하면 정산금 ${money(pay)}`:'감독대행 체제'}${mm.length?` · 후보 연봉 ${money(Math.min(...mm))}~${money(Math.max(...mm))}`:''}</span></div>
    <div><span class="eyebrow">국내 선수 연봉 (샐러리캡)</span><b>${money(b.ci.pay)} / ${money(b.ci.cap)}</b><i class="bar"><em class="${b.ci.over?'bad':''}" style="width:${Math.min(100,b.ci.pay/b.ci.cap*100)}%"></em></i><span class="small muted">${b.ci.over?`초과 ${money(b.ci.over)} · 경쟁균형세 부과`:`여유 ${money(b.ci.cap-b.ci.pay)}`}</span></div>
  </div><p class="small muted">한도는 계약 규정입니다. 실제로 쓸 수 있는지는 위의 "더 쓸 수 있는 돈"으로 판단하세요.</p></section>
  <section class="card"><h2 class="sec">어디에 쓰고 어디서 버나</h2><div class="eyebrow">지출 (연간 예상)</div>${[...b.exp].sort((x,y)=>y[1]-x[1]).map(x=>row(x[0],x[1],emax,'ex')).join('')}
    <div class="eyebrow">수입 (연간 예상, 포스트시즌 배당 제외)</div>${b.inc.map(x=>row(x[0],x[1],imax,'in')).join('')}</section>`;
}
function fBudgetTag(cost){ const b=budget(); if(cost<=b.fRoom)return '<span class="pill good">배정 예산 안</span>'; const ex=cost-b.fRoom; return b.roomGoal>=ex?`<span class="pill warn" title="외국인 배정 예산을 넘는 ${money(ex)}는 일반 예산에서 씁니다">배정 초과 ${money(ex)}</span>`:b.roomMax>=ex?`<span class="pill warn">예산 초과 ${money(ex)}</span>`:'<span class="pill bad">자금 부족</span>'; }
function budgetWarn(cost){ const b=budget(); return b.roomGoal>=cost?'':b.roomMax>=cost?'<span class="pill warn" title="구단주 목표보다 지원을 더 받게 됩니다">예산 초과</span>':'<span class="pill bad">자금 부족</span>'; }
function budgetTag(cost){ const b=budget(); if(b.roomGoal>=cost)return `<span class="pill good">올해 부담 ${money(cost)} · 예산 안</span>`; if(b.roomCap>=cost||b.roomMax>=cost)return `<span class="pill warn">올해 부담 ${money(cost)} · 구단주 목표 초과</span>`; return `<span class="pill bad">올해 부담 ${money(cost)} · 자금 부족</span>`; }

/* ---------- 선수 카드와 경기 기록 ---------- */
function statTable(p){
  const rows=[...p.hist].sort((a,b)=>b.y-a.y||(a.lvl<b.lvl?-1:1));
  const pre=p.prev?[Object.assign({y:G.year-1,pre:p.prev.lvl},p.prev)]:p.am?[Object.assign({y:G.year,pre:'아마'},p.am)]:[];
  const one=p.hist.filter(h=>h.lvl==='1군'); let tot=null; if(one.length>1){ tot=Object.assign({},p.isP?ZP:ZB,{y:'통산',tot:true,war:sum(one.map(h=>wOf(h,p)))}); for(const h of one)addTo(tot,h); tot.y='통산'; }
  const all=[...(tot?[tot]:[]),...rows,...pre]; if(!all.length)return '<p class="small muted">기록이 없습니다.</p>';
  const lab=h=>h.tot?'1군 합계':h.pre?h.pre:`${tshort(h.t)}${h.lvl==='퓨처스'?' F':''}`;
  if(p.isP){
    return `<table><thead><tr><th>시즌</th><th>구단</th><th class="key">ERA</th><th class="key">WAR</th><th>경기</th><th>선발</th><th>이닝</th><th>승</th><th>패</th><th>세</th><th>홀</th><th>탈삼진</th><th>볼넷</th><th>피안타</th><th>피홈런</th><th>WHIP</th><th>K/9</th><th>BB/9</th></tr></thead><tbody>${all.map(h=>{const r=pRate(h); return `<tr><td>${h.y2?`${h.y}~${String(h.y2).slice(2)}`:h.y}</td><td>${lab(h)}</td><td class="key">${h.outs?r.era.toFixed(2):'-'}</td><td class="key">${h.tot?h.war.toFixed(1):h.pre?'-':wOf(h,p).toFixed(1)}</td><td>${h.g||0}</td><td>${h.gs||0}</td><td>${ipStr(h.outs)}</td><td>${h.w||0}</td><td>${h.l||0}</td><td>${h.sv||0}</td><td>${h.hld||0}</td><td>${h.so}</td><td>${h.bb}</td><td>${h.h}</td><td>${h.hr}</td><td>${h.outs?r.whip.toFixed(2):'-'}</td><td>${h.outs?r.k9.toFixed(1):'-'}</td><td>${h.outs?r.bb9.toFixed(1):'-'}</td></tr>`}).join('')}</tbody></table>`;
  }
  return `<table><thead><tr><th>시즌</th><th>구단</th><th class="key">OPS</th><th class="key">WAR</th><th>경기</th><th>타석</th><th>타율</th><th>출루율</th><th>장타율</th><th>안타</th><th>2루타</th><th>3루타</th><th>홈런</th><th>타점</th><th>득점</th><th>도루</th><th>볼넷</th><th>삼진</th><th>볼삼비</th><th>BABIP</th></tr></thead><tbody>${all.map(h=>{const r=bRate(h); return `<tr><td>${h.y2?`${h.y}~${String(h.y2).slice(2)}`:h.y}</td><td>${lab(h)}</td><td class="key">${h.pa?fmt3(r.ops):'-'}</td><td class="key">${h.tot?h.war.toFixed(1):h.pre?'-':wOf(h,p).toFixed(1)}</td><td>${h.g||0}</td><td>${h.pa}</td><td>${fmt3(r.avg)}</td><td>${fmt3(r.obp)}</td><td>${fmt3(r.slg)}</td><td>${h.h}</td><td>${h.d}</td><td>${h.tr}</td><td>${h.hr}</td><td>${h.rbi}</td><td>${h.r}</td><td>${h.sb}</td><td>${h.bb}</td><td>${h.so}</td><td>${h.so?(h.bb/h.so).toFixed(2):'-'}</td><td>${babipOf(h)!=null?fmt3(babipOf(h)):'-'}</td></tr>`}).join('')}</tbody></table>`;
}
function keyBar(p,rp,isFA,isFM){ const cur=p.fdPool?null:rp.cur, pot=p.fdPool?null:rp.ofp; const fg=p.fdPool?fdGrade(p):null; const sal=isFM?p.ask:isFA&&p.ask?p.ask.annual:p.sal;
  const ct=p.prospect?'드래프트 대상':p.fdPool?tContract(p):isFM?`요구 · ${Math.round(p.ask/USD)}만 달러`:isFA?`FA 요구 ${p.ask?p.ask.years+'년':''}`:p.extNext?`다년 합의 ${p.extNext.years}년`:p.faC?`${p.ext?'다년':'FA'} 잔여 ${p.yrs}년`:p.foreign?'1년 계약':`FA까지 ${Math.max(0,faSvc(p)-p.svc)}년`;
  const box=(l,v,c,sub)=>`<div class="kb"><span>${l}</span><b style="color:${c}">${v}</b>${sub?`<i>${sub}</i>`:''}</div>`;
  return `<div class="kbar">${box(fg?'추정 등급':'현재',fg?fg.g:cur??'?',fg?fg.c:cur!=null?rcol(cur):'var(--muted)',fg?'스카우트 추정 · 지명 후 공개':rp.exact?'정확':'추정')}${box('포텐',fg?(fg.up?'↑':'-'):pot??'?',pot!=null?rcol(pot):'var(--muted)',pot==null?(p.fdPool?(fg&&fg.up?'성장 여지 있음':'지명 후 공개'):'알 수 없음'):pot-(cur||0)>=8?'성장 여지 큼':pot-(cur||0)>=3?'조금 더 성장':p.age>=33?'하락 시작':p.age>=29?'전성기':'거의 완성')}${box('연봉',p.prospect?'-':money(sal||0),'#e8ecf3',ct)}</div>${valueLine(p,rp)}`; }
/* 현재 전력·장래 예상·구단 기여를 나눠 보여 준다. 우리 젊은 선수는 스카우트와 감독의 시각을 함께 */
function valueLine(p,rp){ if(p.prospect||p.fdPool||p.team==null)return ''; const L=[];
  const hs=p.hist.filter(h=>h.lvl==='1군'&&h.t===p.team&&h.y>=(G.startY||0)); const ys=[...new Set(hs.map(h=>h.y))]; const w=sum(ys.map(y=>{ const h=seasonTotal(p,y,'1군'); return h&&h.t===p.team?wOf(h,p):0; }));
  L.push(`<span><i>구단 기여</i>${ys.length?`${esc(tshort(p.team))} ${ys.length}시즌 · 1군 WAR <b>${w.toFixed(1)}</b>`:`${esc(tshort(p.team))} 첫 시즌`}</span>`);
  if(p.team===G.user&&!p.foreign&&p.age<=25){ if(rp.ofp!=null)L.push(`<span><i>스카우트</i>장래 ${rp.ofp} 전망 · 확신 ${esc(rp.conf||'보통')}</span>`);
    try{ const d=depth(G.user); const k=pSlot(p); const st=k==='SP'?d.sp[4]:k==='RP'?d.pen[3]:d.ln[k]; const reg=[...d.start,...d.sp,...d.pen.slice(0,4)].some(x=>x.id===p.id);
      const v=reg?'주전으로 씁니다':st&&ovr(st)-ovr(p)>=6?`지금은 ${esc(st.name)}(${Math.round(ovr(st))}) 뒤입니다. 1군 기용은 어렵다고 봅니다`:st?`${esc(st.name)}(${Math.round(ovr(st))})와 경쟁할 수 있다고 봅니다`:'기회를 줄 수 있다고 봅니다'; L.push(`<span><i>감독</i>${v}</span>`); }catch(e){} }
  return `<div class="vline">${L.join('')}</div>`; }
function reportCard(p,noTools){
  const rp=scoutReport(p);
  if(hideOvr(p))return `<section class="card"><div class="row between"><h2 class="sec">스카우트 의견</h2><span class="small muted">${esc(rp.who)} · 정확도 ${rp.conf}</span></div>
    <div class="row">${p.team!=null&&team(p.team).cap===p.id?'<span class="pill good">주장</span>':''}${p.team!=null&&isFranchise(p)?`<span class="pill acc">${esc(tshort(p.team))} 프랜차이즈 스타 · ${teamTenure(p,p.team).n}시즌</span>`:''}<span class="pill acc">${esc(rp.arch)}</span>${rp.role?`<span class="pill">장래 ${esc(rp.role)}</span>`:'<span class="pill">장래 판단 불가</span>'}<span class="pill ${rp.risk==='높음'?'bad':rp.risk==='낮음'?'good':''}">위험도 ${rp.risk}</span>${rp.eta?`<span class="pill">1군까지 약 ${rp.eta}년</span>`:''}</div>
    <div class="quote">${rp.notes.map(n=>`<p>${esc(n)}</p>`).join('')}</div>
    <p class="small muted">${p.fdPool?'창단 드래프트 후보는 능력치가 공개되지 않습니다. 지난 시즌 기록과 나이, 스카우트 의견으로 판단하세요. 지명하는 순간 공개됩니다.':p.prospect?'아마추어 선수는 능력치를 알 수 없습니다. 학년별 기록과 스카우트 의견으로 판단하세요. 지명하면 우리 코치진이 능력치를 파악합니다.':'영입 전에는 능력치를 알 수 없습니다. 지난 리그 기록과 스카우트 의견으로 판단하세요.'}</p></section>`;
  const bar=t=>{ const w=v=>Math.round((v-20)/60*100); const fut=rp.ofp!=null&&t.fut>t.cur; return `<div class="tool" style="--c:${rcol(t.cur)};--c2:${rcol(t.fut)}"><span>${TOOLK[t.k]}</span>${rchip(t.cur)}<span class="track"><span class="mid"></span>${fut?`<span class="fut" style="width:${w(t.fut)}%"></span>`:''}<span class="now" style="width:${w(t.cur)}%"></span></span>${fut?rchip(t.fut):'<span></span>'}</div>`; };
  return `<section class="card">
    <div class="row between"><h2 class="sec">스카우트 리포트</h2><span class="small muted">${esc(rp.who)} · 정확도 ${rp.conf}</span></div>
    <div class="tiles"><div class="tile"><span class="g" style="color:${rcol(rp.cur)}">${rp.cur}</span><span class="l">현재 종합</span></div><div class="tile key"><span class="g" style="color:${rp.ofp!=null?rcol(rp.ofp):'var(--muted)'}">${rp.ofp??'?'}</span><span class="l">장래성</span></div><div class="tile"><span class="g" style="font-size:16px">${rp.risk}</span><span class="l">위험도</span></div>${rp.eta?`<div class="tile"><span class="g" style="font-size:16px">${rp.eta}년</span><span class="l">1군 도달 예상</span></div>`:''}</div>
    ${rp.role?`<p class="small"><span class="muted">장래 역할</span> <b>${esc(rp.role)}</b></p>`:''}
    ${noTools?'':`<div class="tools">${rp.tools.map(bar).join('')}</div>
    <p class="small muted">20~80 척도, 50이 1군 평균. 왼쪽 숫자는 현재, 오른쪽은 스카우트가 보는 미래입니다.</p>`}
    <div class="quote">${rp.notes.map(n=>`<p>${esc(n)}</p>`).join('')}</div>
  </section>`;
}
function entryForm(p){
  const on=entryOn(); let st;
  if(p.ys)st=`<b>육성선수</b> · 정식 로스터(40명) 밖에서 퓨처스 경기에 나갑니다.`;
  else if(!on)st='시즌 중이 아니라 1군 엔트리가 없습니다.';
  else if(p.e1)st=`<b>1군 등록</b> · ${p.upDay!=null?dmd(p.upDay)+' 등록':''}`;
  else st=`<b>퓨처스</b>${p.downDay!=null?` · ${dmd(p.downDay)} 말소 · ${G.day-p.downDay>=10?'재등록 가능':dmd(p.downDay+10)+'부터 재등록 가능'}`:''}`;
  const btns=[];
  if(on&&!p.ys)btns.push(p.e1?`<button class="btn small" data-a="reqDown" data-v="${p.id}">2군 말소 요청</button>`:`<button class="btn small" data-a="reqUp" data-v="${p.id}" ${canUp(p)?'':'disabled'}>1군 콜업 요청</button>`);
  if(p.ys)btns.push(`<button class="btn small" data-a="fromYS" data-v="${p.id}">정식 선수로 등록</button>`);
  else if(!p.foreign&&!p.faC&&p.sal<=100)btns.push(`<button class="btn small" data-a="toYS" data-v="${p.id}">육성선수로 전환</button>`);
  return `<section class="card"><span class="eyebrow">엔트리</span><p class="small">${st}</p><div class="row">${btns.join('')}</div>${UI.entMsg&&UI.entMsg.id===p.id?`<div class="note">${esc(UI.entMsg.t)}</div>`:''}<p class="small muted">1군 엔트리(${entryLimit()}명)는 감독이 관리합니다. 단장은 콜업·말소를 요청할 수 있고, 감독 성향과 관계에 따라 받아들여지지 않을 수 있습니다. 말소된 선수는 10일이 지나야 다시 올라옵니다. 육성선수는 5월 1일부터 정식 선수로 등록할 수 있습니다.</p></section>`;
}
function growthCard(p){
  if(p.prospect||p.team!==G.user||!p.oh||!p.oh.length)return '';
  const pts=p.oh.map(x=>({y:x.y,v:clamp(r5(x.o+hn('gh'+x.y,p.id)*1.5),20,80)}));
  const lg=p.devLog; const pl=lg?(lg.play>=1.08?'주전급 출전':lg.play>=1?'충분한 출전':lg.play>=.92?'출전 부족':'거의 못 뜀'):'';
  return `<section class="card"><div class="row between"><span class="eyebrow">연도별 코치진 평가</span><span class="small muted">매년 겨울 성장 반영</span></div>
    <div class="growth">${pts.map(x=>`<div><i style="height:${Math.max(6,(x.v-20)*1.6)}px;background:${rcol(x.v)}"></i><b>${x.v}</b><span>${String(x.y).slice(2)}</span></div>`).join('')}</div>
    ${lg?`<p class="small muted">지난 겨울 성장 요인: ${lg.y}시즌 ${pl} · ${esc(lg.fac)}${G.mgr[G.user]?` · ${esc(G.mgr[G.user].name)} 감독 육성 ${G.mgr[G.user].youth}`:''}</p>`:''}</section>`;
}
function renderSheet(){ const el=$('#sheet'); const had=el&&!!el.querySelector('.sheet'); renderSheet0(); try{ autoLink(el); }catch(e){} if(had){ const sh=el.querySelector('.sheet'); if(sh)sh.classList.add('noanim'); } markHints(el); }
function renderSheet0(){
  const el=$('#sheet');
  if(!G){ el.innerHTML=''; return; }
  if(UI.cast&&UI.sheet==null&&!UI.menu){ const ex=el.querySelector('.cast'); if(!ex||+ex.dataset.g!==UI.cast.g){ el.innerHTML=castSheet(); castMount(); } return; }
  if(UI.menu){ el.innerHTML=menuSheet(); return; }
  if(UI.myRos&&UI.sheet==null){ G.tutFlags=G.tutFlags||{}; G.tutFlags.roster=true; el.innerHTML=myRosterSheet(); return; }
  if(UI.person&&UI.sheet==null){ el.innerHTML=personSheet(UI.person); return; }
  if(UI.game!=null){ el.innerHTML=gameSheet(UI.game); return; }
  if(UI.posSheet){ el.innerHTML=UI.posSheet.includes(':')?teamPosSheet(UI.posSheet):posSheet(UI.posSheet); return; }
  if(UI.sheet==null){ el.innerHTML=''; return; }
  const p=G.players[UI.sheet]; if(!p){UI.sheet=null; el.innerHTML=''; return;}
  const rp=scoutReport(p); const h=curLine(p); const per=period();
  const isFA=G.fa&&G.fa.open&&!G.fa.closed&&G.fa.pool.includes(p.id)&&p.team==null;
  const isFM=p.foreign&&p.team==null&&(G.fmarket||[]).includes(p.id);
  const d=G.draft; const canPick=p.prospect&&d&&!d.done&&d.picks[d.cur].tid===G.user;
  let actions='';
  if(canPick)actions=`<button class="btn primary block" data-a="pick" data-v="${p.id}">${d.picks[d.cur].rd}라운드 ${d.picks[d.cur].no}순위로 지명</button>`;
  if(p.fdPool&&G.fd&&!G.fd.done){ const fk=G.fd.picks[G.fd.cur]; actions=`<div class="row" style="gap:6px">${fk&&fk.tid===G.user&&G.fd.open!==false?`<button class="btn primary" style="flex:1" data-a="fdPick" data-v="${p.id}">${fk.rd}라운드 ${fk.no}번째로 지명</button>`:''}<button class="btn" data-a="star" data-v="${p.id}">${(G.shortlist||[]).includes(p.id)?'★ 관심 해제':'☆ 관심'}</button></div>`; }
  if(isFA)actions=negPanel(p)+offerForm(p)+(UI.faMsg&&UI.faMsg.id===p.id?`<div class="note">${esc(UI.faMsg.t)}</div>`:'');
  if(isFM){ const err=foreignOpen()?foreignCheck(G.user,p):'지금은 외국인 선수를 영입할 수 없습니다.'; const mid=per==='season'; const repl=mid&&(G.sea.repl[G.user]||0)>=F_REPL_MAX;
    actions=`<section class="card"><p class="small">요구 연봉 <b class="num">${money(p.ask)}</b> (약 ${Math.round(p.ask/USD)}만 달러)${mid?` · 남은 기간분 ${money(Math.round(p.ask*remainFrac()))}`:''}</p>${err||repl?`<div class="note bad">${repl?'이번 시즌 외국인 교체 횟수를 다 썼습니다.':esc(err)}</div>`:''}<button class="btn primary block" data-a="signF" data-v="${p.id}" ${err||repl?'disabled':''}>계약하기</button>${UI.fmsg?`<div class="note">${esc(UI.fmsg)}</div>`:''}</section>`; }
  if(p.team!=null&&p.team!==G.user&&!p.foreign&&!(p.joinY>G.year)){ actions=tradeOpen()?`<button class="btn block" data-a="toTrade" data-v="${p.id}">트레이드 대상에 추가</button>`:'<p class="small muted">트레이드 기간이 아닙니다.</p>'; }
  if(isFM)actions+=`<div class="row"><button class="btn" data-a="fwatch" data-v="${p.id}">${fwatchOn(p.id)?'관찰 명단에서 빼기':'대체 후보 관찰 명단에 올리기'}</button>${fwatchOn(p.id)?`<span class="small muted">스카우트 파악도 ${fwatchK(p.id)}%</span>`:''}</div>${UI.fwMsg?`<p class="small muted">${esc(UI.fwMsg)}</p>`:''}`;
  if(p.team===G.user&&!(p.joinY>G.year)){
    const parts=[];
    parts.push(entryForm(p));
    if(!p.foreign&&p.age<=28)parts.push(devForm(p));
    if(canExtend(p))parts.push(extForm(p));
    else if(UI.ext&&UI.ext.id===p.id&&UI.ext.msg)parts.push(`<div class="note ${UI.ext.ok?'good':''}">${esc(UI.ext.msg)}</div>`);
    parts.push(`<div class="row">${!p.foreign&&tradeOpen()?`<button class="btn" data-a="toTradeGive" data-v="${p.id}">트레이드 카드로</button>`:''}${!p.foreign?(p.listed?`<button class="btn" data-a="blkOff" data-v="${p.id}">블록에서 내리기</button>`:`<button class="btn" data-a="blkOn" data-v="${p.id}">트레이드 블록에 올리기</button>`):''}${UI.confirmRel===p.id?`<button class="btn danger" data-a="release" data-v="${p.id}">정말 방출${p.faC?` (정산 ${money(Math.round(p.sal*p.yrs*.5))})`:''}</button><button class="btn" data-a="relCancel">취소</button>`:`<button class="btn danger" data-a="relAsk" data-v="${p.id}">방출</button>`}</div>`);
    actions=parts.join('');
  }
  const status=p.injOut>0?`<span class="pill bad">부상 · 복귀까지 약 ${p.injOut}일</span>`:'';
  const meas=p.isP?`직구 평균 ${veloOf(p)}km/h · 최고 ${veloMax(p)}km/h`:`타구속도 평균 ${evOf(p)}km/h · 홈→1루 ${runOf(p)}초`;
  const tiles=h?(p.isP?[['ERA',h.outs?pRate(h).era.toFixed(2):'-',1],['WAR',wOf(h,p).toFixed(1),1],['이닝',ipStr(h.outs)],['탈삼진',h.so],[h.sv?'세이브':h.hld?'홀드':'승',h.sv||h.hld||h.w]]
    :[['OPS',h.pa?fmt3(bRate(h).ops):'-',1],['WAR',wOf(h,p).toFixed(1),1],['타율',fmt3(bRate(h).avg)],['홈런',h.hr],['타점',h.rbi]]):null;
  const where=p.prospect?`드래프트 대상 · ${p.region}`:p.fdPool?`창단 드래프트 후보${p.fdFrom!=null?` · 전 ${tshort(p.fdFrom)}`:''}`:p.foreign&&!p.team?`외국인 영입 후보 · ${p.nat}`:p.joinY>G.year?`${tname(p.team)} 입단 예정`:tname(p.team??p.faFrom);
  const pt=p.team!=null?team(p.team):null; const pst=pt?`--pt:${tpal(pt)[2]};--pt2:${tpal(pt)[3]}`:'';
  const ownP=p.team===G.user&&!(p.joinY>G.year); const st=careerStory(p);
  const hasM=ownP;
  const tabs=[...(p.prospect||p.fdPool||isFM?[]:[['abil','능력']]),['sum','요약'],['rec','기록'],...(st?[['story','이야기']]:[]),...(hasM?[['mgmt','관리']]:[])];
  let T=UI.ptab||'abil'; if(!tabs.some(t=>t[0]===T))T='sum';
  const tabBar=`<div class="seg ptabs">${tabs.map(([k,l])=>`<button data-a="ptab" data-v="${k}" class="${T===k?'on':''}">${l}</button>`).join('')}</div>`;
  el.innerHTML=`<div class="scrim" data-a="closeSheet"><div class="sheet gut" style="${pst}" role="dialog" aria-label="${esc(p.name)} 선수 정보" data-stop="1">
   <div class="sheet-head"><div class="row" style="flex-wrap:nowrap;align-items:flex-start">${avImg(p,true)}<div><div class="eyebrow">${where}${isFA?' · FA':''}${p.foreign&&p.team?` · ${p.foreign==='아시아'?'아시아쿼터':'외국인'} · ${p.nat}`:''}</div>
    <h2 class="sec" style="font-size:24px">${esc(p.name)}</h2>${p.aw&&p.aw.length?`<div class="row" style="gap:4px;margin:2px 0">${p.aw.slice(-6).map(a=>`<span class="awp">${awArt(a,18)}${esc(a)}</span>`).join('')}</div>`:''}
    <p class="small muted">${posLabel(p)} · ${p.age}세 · ${hand(p)}${p.foreign?'':` · ${p.college?'대졸':'고졸'} · ${esc(milText(p))}`}${p.draft?` · ${p.draft.y} ${p.draft.rd}R ${p.draft.no}순위`:''}${p.dev?' · 육성선수 출신':''}</p></div></div><button class="x" data-a="closeSheet" aria-label="닫기">×</button></div>
   ${keyBar(p,rp,isFA,isFM)}
   <div class="row"><span class="pill acc">${esc(rp.arch)}</span>${rp.role?`<span class="pill">장래 ${esc(rp.role)}</span>`:''}<span class="pill">${meas}</span>${status}</div>
   ${tabBar}
   ${T==='sum'?`
   ${quickActs(p)}${staffCardP(p)}
   ${tiles?`<div><div class="eyebrow" style="margin-bottom:6px">${h.y} ${h.lvl==='퓨처스'?'퓨처스':'1군'} 성적</div><div class="tiles">${tiles.map(t=>`<div class="tile${t[2]?' key':''}" data-a="recGo" data-v="${p.isP?'pit':'bat'}:${({OPS:'ops',WAR:'war',타율:'avg',홈런:'hr',타점:'rbi',ERA:'era',이닝:'ip',탈삼진:'so',세이브:'sv',홀드:'hld',승:'w'})[t[0]]||'war'}" role="button" title="리그 순위 보기"><span class="g">${t[1]}</span><span class="l">${t[0]}</span></div>`).join('')}</div></div>`:''}
   ${p.prospect?`<section class="card"><div class="row between"><span class="eyebrow">아마추어 프로필</span><button class="btn small${(G.shortlist||[]).includes(p.id)?' primary':''}" data-a="star" data-v="${p.id}">${(G.shortlist||[]).includes(p.id)?'★ 관심 선수':'☆ 관심 표시'}</button></div><dl class="kv"><dt>학교</dt><dd>${esc(p.school||'-')} (${p.college?'대학 4년':'고교 3년'})</dd><dt>체격</dt><dd>${p.ht||'-'}cm · ${p.wt||'-'}kg</dd><dt>${p.isP?'최고 구속':'1루 도달'}</dt><dd>${p.isP?(p.amVelo||veloOf(p))+'km/h':(p.amRun||runOf(p))+'초'}</dd><dt>언론 순위</dt><dd>${p.press||'-'}위</dd><dt>의료 기록</dt><dd>${p.amInj?esc(p.amInj):'특이 사항 없음'}</dd>${(()=>{const sc=bestScout(p.region); return sc&&sc.skill>=3?`<dt>면담 평가</dt><dd>${esc(persText(p))}</dd>`:'';})()}</dl><div class="eyebrow">학년별 기록</div>${amYearTable(p)}${amNotes(p).map(t=>`<p class="small amn">${esc(t)}</p>`).join('')}</section>`:''}
   ${p.prospect||isFM?reportCard(p):''}
   ${hideOvr(p)&&!p.prospect?trackCard(p):''}
   ${!p.prospect&&!isFM?`<dl class="kv"><dt>연봉</dt><dd>${money(p.sal)}</dd><dt>계약</dt><dd>${p.extNext?`다년 합의(${p.extNext.years}년, 다음 시즌부터)`:p.faC?`${p.ext?'비FA 다년':'FA'} 계약 잔여 ${p.yrs}년`:p.foreign?'1년':'단년'}</dd>${p.foreign?'':`<dt>등록 연차</dt><dd>${p.svc}년 (FA 자격 ${faSvc(p)}시즌 · ${p.college?'대졸':'고졸'})</dd><dt>샐러리캡 산정</dt><dd>${isRookie(p)?'신인이라 제외':'포함'}</dd>`}</dl>`:''}
   ${!hasM&&!(p.team!=null&&p.team!==G.user)?actions:''}
   `:''}
   ${T==='abil'?`
   ${mgrOpinion(p)}${trackCard(p)}${detailCard(p)}${reportCard(p,true)}
   ${!p.isP?`<section class="card"><div class="row between"><span class="eyebrow">수비 위치</span>${p.use&&p.use.y===G.year&&p.use.g?`<span class="small muted">${esc(useText(p))}</span>`:''}</div><div class="posfit">${['C','1B','2B','3B','SS','LF','CF','RF'].map(k=>{ const main=p.pos===k, sub=subsOf(p).includes(k); const v=(main||sub)&&!hideOvr(p)?clamp(r5(defAt(p,k)+hn('pf'+k,p.id)*2),20,80):null; return `<div class="${main?'main':sub?'sub':''}"><span>${POSS[k]}</span>${v!=null?rchip(v):`<b class="rc q">${main||sub?'○':'-'}</b>`}<i>${main?'주':sub?'서브':''}</i></div>`; }).join('')}</div><p class="small muted">주 포지션과 서브 포지션만 감독이 무리 없이 맡깁니다. 숫자는 그 자리 수비 평가입니다.</p></section>`:''}
   ${p.team===G.user&&!(p.joinY>G.year)?`<section class="card"><div class="row between"><span class="eyebrow">컨디션</span><span class="small muted">피로 ${Math.round(p.fat||0)} · ${fatText(p)}</span></div>${fatBar(p)}<p class="small">${l10Text(p)||'최근 1군 경기 기록이 없습니다.'}</p><p class="small muted">연속 출장하면 피로가 쌓여 성적이 떨어지고 부상 위험이 커집니다. 감독은 지친 선수를 쉬게 합니다. ${p.isP?'투수는 투구 수만큼 지치고 체력(스태미나)이 좋을수록 빨리 회복합니다.':'포수는 더 빨리 지칩니다. 체력이 좋을수록 덜 지치고 빨리 회복하며, 시즌 후반 성적 하락도 적습니다.'}</p></section>`:''}
   ${growthCard(p)}
   `:''}
   ${T==='rec'?`
   <div><div class="row between" style="margin-bottom:6px"><span class="eyebrow">기록</span><span class="small muted">F는 퓨처스</span></div><div class="tw">${statTable(p)}</div></div>
   ${p.injHist.length?`<p class="small"><b>부상 이력</b> ${p.injHist.map(i=>`${i.y}년 ${i.days}일`).join(' · ')}</p>`:''}
   `:''}
   ${T==='story'?`
   ${st}
   `:''}
   ${T==='mgmt'?`
   <div id="s-bond"></div>${p.team===G.user&&!(p.joinY>G.year)?bondCard(p):''}
   <div id="s-ext"></div>${actions}
   `:''}
  </div></div>`;
}
function posSheet(pos){
  const d=depth(G.user);
  if(pos==='P'){
    const li=(p,role)=>`<button class="item" data-a="player" data-v="${p.id}"><span class="nm">${role} · ${esc(p.name)} <span class="small muted">${p.age}세</span></span><span class="sub">${esc(scoutReport(p).arch)} · ${statLine(curLine(p),p)}</span><span class="rt num">${money(p.sal)}</span></button>`;
    return `<div class="scrim" data-a="closeSheet"><div class="sheet gut" data-stop="1"><div class="sheet-head"><h2 class="sec">투수진</h2><button class="x" data-a="closeSheet" aria-label="닫기">×</button></div>
      <section class="card"><div class="eyebrow">선발 로테이션</div><div class="list">${d.sp.map((p,i)=>li(p,(i+1)+'선발')).join('')}</div></section>
      <section class="card"><div class="eyebrow">불펜</div><div class="list">${d.pen.map((p,i)=>li(p,i===0?'마무리':i<4?'필승조':'추격조')).join('')}</div></section></div></div>`;
  }
  const cur=d.ln[pos]; const role=p=>d.start.includes(p)?'주전':d.bench.includes(p)?'1군 백업':d.futB.includes(p)?'퓨처스':'부상';
  const ok=p=>pos==='DH'?true:p.pos===pos||subsOf(p).includes(pos);
  const all=playersOf(G.user).filter(p=>!p.isP);
  const cands=all.filter(ok).sort((a,b)=>(b===cur)-(a===cur)||posScore(b,pos)-posScore(a,pos)).slice(0,pos==='DH'?8:99);
  const others=pos==='DH'?[]:all.filter(p=>!ok(p));
  const card=p=>{ const rp=scoutReport(p); const fitv=pos==='DH'?null:clamp(r5(defAt(p,pos)+hn('pf'+pos,p.id)*2),20,80);
    return pcard(p,{rp,on:cur&&cur.id===p.id,mark:role(p),sub:`${pos==='DH'?posLabel(p):p.pos===pos?'주 포지션':'서브 포지션'} · ${p.age}세 · ${hand(p)}`,
      tags:pos==='DH'?'':`<span class="pill">이 자리 수비 ${fitv}</span>`,stat:`${bLine(p)}`,foot:`<span>${esc(useText(p))}</span><button class="tc-i" data-a="player" data-v="${p.id}">프로필</button>`}); };
  return `<div class="scrim" data-a="closeSheet"><div class="sheet gut" data-stop="1">
    <div class="sheet-head"><div><div class="eyebrow">포지션 · 감독 결정</div><h2 class="sec">${POSK[pos]}</h2><p class="small muted">${pos==='DH'?'타격이 좋은 순으로 보여 줍니다.':`이 자리를 맡을 수 있는 선수 ${cands.length}명 (주 포지션·서브 포지션)`}</p></div><button class="x" data-a="closeSheet" aria-label="닫기">×</button></div>
    <div class="tgrid">${cands.map(card).join('')||'<p class="small muted">이 포지션을 맡을 선수가 없습니다. 영입이 필요합니다.</p>'}</div>
    ${cands.length<=1&&pos!=='DH'?'<div class="note bad">이 포지션은 백업이 없습니다. 주전이 다치면 다른 포지션 선수가 무리해서 맡게 됩니다.</div>':''}
    ${others.length?`<details><summary class="small muted" style="cursor:pointer">이 자리를 맡기 어려운 선수 ${others.length}명 보기</summary><div class="list">${others.map(p=>`<button class="item" data-a="player" data-v="${p.id}"><span class="nm">${esc(p.name)} <span class="small muted">${POSS[p.pos]} · ${p.age}세</span></span><span class="sub">${bLine(p)}</span></button>`).join('')}</div></details>`:''}
  </div></div>`;
}
function teamPosSheet(v){
  const [tid,pos]=v.split(':'); const t=+tid; const d=depth(t);
  const arr=pos==='P'?d.sp.concat(d.pen):playersOf(t).filter(p=>!p.isP&&(p.pos===pos||subsOf(p).includes(pos)||d.ln[pos]===p)).sort((a,b)=>posScore(b,pos)-posScore(a,pos));
  return `<div class="scrim" data-a="closeSheet"><div class="sheet gut" data-stop="1"><div class="sheet-head"><div><div class="eyebrow">${tname(t)}</div><h2 class="sec">${pos==='P'?'투수진':POSK[pos]}</h2></div><button class="x" data-a="closeSheet" aria-label="닫기">×</button></div>
    <section class="card"><div class="list">${arr.map(p=>playerRow(p)).join('')}</div></section></div></div>`;
}
function offerForm(p){
  const cur=(UI.offer&&UI.offer.id===p.id)?UI.offer:(G.fa.offers[p.id]||p.ask); const ann=cur.annual, yrs=cur.years;
  const min=round5(p.ask.annual*.6), max=round5(p.ask.annual*1.6); const n=Object.keys(G.fa.ai[p.id]||{}).length;
  const comp=p.faFrom===G.user?'원소속 구단이라 보상 없음':p.faGrade==='A'?`보상: 보호 ${COMP.A.prot}명 외 1명 + ${money(p.faPrevSal*2)}, 또는 선수 없이 ${money(p.faPrevSal*3)} (상대 선택)`:p.faGrade==='B'?`보상: 보호 ${COMP.B.prot}명 외 1명 + ${money(p.faPrevSal)}, 또는 선수 없이 ${money(p.faPrevSal*2)} (상대 선택)`:`보상: 현금 ${money(Math.round(p.faPrevSal*1.5))}만`;
  return `<section class="card"><div class="eyebrow">FA 조건 제시 · 선수 요구 ${p.ask.years}년 연 ${money(p.ask.annual)} · 관심 구단 ${n}곳</div>
    <label class="small" for="offA">연봉 <b class="num" id="offAv">${money(ann)}</b></label>
    <input type="range" id="offA" min="${min}" max="${max}" step="5" value="${ann}" data-a="offA" data-v="${p.id}">
    <div class="seg">${[1,2,3,4,5,6].map(y=>`<button data-a="offY" data-v="${p.id}:${y}" class="${yrs===y?'on':''}">${y}년</button>`).join('')}</div>
    <p class="small sdesc"><span id="offTot">총액 ${money(ann*yrs)}</span> · ${comp}</p>
    ${G.day<G.fa.openDay?'<p class="small muted">11월 6일부터 선수가 제안을 검토합니다.</p>':''}
    <div class="row"><button class="btn primary" data-a="offer" data-v="${p.id}">${G.fa.offers[p.id]?'조건 수정':'제시하기'}</button>${G.fa.offers[p.id]?`<button class="btn danger" data-a="unoffer" data-v="${p.id}">철회</button>`:''}</div></section>`;
}
function extForm(p){
  const e=UI.ext&&UI.ext.id===p.id?UI.ext:{id:p.id,years:4,annual:round5(p.sal*1.3),msg:''};
  UI.ext=e;
  const min=round5(Math.max(MIN_SAL,e.annual*.4)), max=round5(Math.max(e.annual*2.2,500));
  return `<section class="card"><div class="eyebrow">비FA 다년계약 제안 · FA까지 ${Math.max(0,faSvc(p)-p.svc)}년</div>
    <label class="small" for="extA">연봉 <b class="num" id="extAv">${money(e.annual)}</b></label>
    <input type="range" id="extA" min="${min}" max="${max}" step="5" value="${e.annual}" data-a="extA" data-v="${p.id}">
    <div class="seg">${[2,3,4,5,6].map(y=>`<button data-a="extY" data-v="${p.id}:${y}" class="${e.years===y?'on':''}">${y}년</button>`).join('')}</div>
    <p class="small muted"><span id="extTot">총액 ${money(e.annual*e.years)}</span> · 합의하면 다음 시즌부터 적용됩니다. 한 선수와는 일주일에 한 번 협상할 수 있습니다.</p>
    ${e.msg?`<div class="note ${e.ok?'good':''}">${esc(e.msg)}</div>`:''}
    <button class="btn primary" data-a="extOffer" data-v="${p.id}">제안하기</button></section>`;
}

/* ---------- 동작 ---------- */
function bondCard(p){
  initPers(p); const m=p.mor;
  return `<section class="card"><div class="row between"><span class="eyebrow">선수와의 관계</span><span class="pill ${moodClass(m)}">기분 ${moodLabel(m)}</span></div>
  <p class="small">${esc(moraleWhy(p))}</p>
  <p class="small muted">코치진이 본 성향: ${esc(persText(p))}${p.promise?` · 출전 약속 ${dmd(p.promise.until)}까지`:''}${p.listed?' · 트레이드 명단':''}${G.med.hosp==='a'?` · 정밀 검진: 부상 체질 ${p.inj>.24?'취약':p.inj>.15?'보통':'튼튼'}`:''}</p>
  <details class="frule"${UI.talkMsg&&UI.talkMsg.id===p.id?' open':''}><summary class="small">개인 면담</summary><div class="talk">${Object.entries(TALK).map(([k,l])=>`<button class="btn small" data-a="talk" data-v="${p.id}:${k}">${l}</button>`).join('')}</div></details>
  ${UI.talkMsg&&UI.talkMsg.id===p.id?`<div class="note ${UI.talkMsg.d>0?'good':UI.talkMsg.d<0?'bad':''}">${esc(UI.talkMsg.msg)}</div>`:''}
  </section>`;
}
function devForm(p){
  const cur=(G.devProg||[]).find(x=>x.pid===p.id); const ov=(G.ovs||[]).find(x=>x.pid===p.id);
  const progs=Object.entries(DEVP).filter(([,v])=>v.P===p.isP);
  return `<section class="card"><div class="eyebrow">2군 연수 프로그램 ${cur?'· '+DEVP[cur.prog].l+' 진행 중':''}</div>
  <div class="talk"><button class="btn small ${!cur?'on':''}" data-a="devSet" data-v="${p.id}:">없음</button>${progs.map(([k,v])=>`<button class="btn small ${cur&&cur.prog===k?'on':''}" data-a="devSet" data-v="${p.id}:${k}">${v.l}</button>`).join('')}</div>
  ${ovsOpen()&&p.age<=27?`<div class="eyebrow">해외 연수 ${ov?'· '+OVS[ov.prog].l+' 신청됨':''}</div><div class="talk">${Object.entries(OVS).map(([k,v])=>`<button class="btn small ${ov&&ov.prog===k?'on':''}" data-a="ovsSet" data-v="${p.id}:${k}">${v.l} ${money(v.c)}</button>`).join('')}${ov?`<button class="btn small danger" data-a="ovsSet" data-v="${p.id}:">취소</button>`:''}</div>`:''}
  ${UI.devMsg?`<div class="note bad">${esc(UI.devMsg)}</div>`:''}</section>`;
}
function closeSheets(){UI.myRos=false;UI.person=null;UI.personMsg=null;if(UI.cast||UI.castRet){CT.tok++;CT.run=false;}UI.cast=null;UI.castRet=null;UI.drawer=false;UI.menu=false;UI.sheet=null;UI.posSheet=null;UI.game=null;UI.mail=null;UI.confirmRel=null;UI.talkMsg=null;UI.devMsg=null;renderSheet();}
const A={
  dlSpd(v){ UI.dspeed=v; render(); },
  dlStop(){ dliveStop(); },
  dlSkip(){ const L=UI.dl; if(L){ L.on=false; clearTimeout(L.t); } if(G.fd&&!G.fd.done)fdAdvance(true); else if(G.draft&&!G.draft.done)advanceDraft(true); save(); render(); },
  setCap(v){ UI.capMsg=setCaptain(+v); save(); render(); if(UI.sheet!=null)renderSheet(); },
  smode(v){ UI.smode=v; UI.sstep='team'; render(); window.scrollTo(0,0); },
  tsGo(v){ UI.sstep=v; if(v==='main'){ UI.newSlot=null; UI.slotMsg=''; } render(); window.scrollTo(0,0); },
  toTitle(){ save(); closeSheets(); UI.title=true; UI.sstep='main'; render(); window.scrollTo(0,0); },
  tsCont(){ if(G){ UI.title=false; render(); return; } const m=meta(); A.slotLoad(m.active); },
  fdPick(v){ const pk0=G.fd&&G.fd.picks[G.fd.cur]; const id=+v; const n0=G.fd?G.fd.cur+1:0; const g0=fdGrade(G.players[id]); const r=fdPick(id); UI.sheet=null; renderSheet(); if(!r&&pk0){ dlFeedAdd('fd',pk0,id); UI.rev=revMake(id,pk0,n0); if(UI.rev&&g0)UI.rev.g0=g0.g; } UI.fdMsg=r; save(); render(); },
  fdBegin(){ if(!G.fdWait)return; G.fdWait=false; G.mail.forEach(m=>{ if(m.from==='구단주실'&&(m.acts||[]).some(a=>a.a==='fdBegin')){ m.read=true; m.acts=[]; } }); fdStart(); UI.mail=null; UI.tab='home'; save(); render(); window.scrollTo(0,0); },
  fdOpen(){ if(G.fd){ G.fd.open=true; G.stops=(G.stops||[]).filter(m=>!String(m.subj||'').startsWith('창단 드래프트: 모든')); G.mail.forEach(m=>{ if(String(m.subj||'').startsWith('창단 드래프트: 모든'))m.read=true; }); save(); render(); window.scrollTo(0,0); } },
  fdBd(){ UI.fdBd=!UI.fdBd; render(); },
  fdHide(){ UI.fdHide=!(UI.fdHide==null?true:UI.fdHide); UI.fdMore=60; render(); },
  dlSpdC(){ const o=['slow','norm','fast']; const i=o.indexOf(UI.dspeed||'norm'); A.dlSpd(o[(i+1)%3]); },
  fdTab(v){ UI.fdTab=v; render(); window.scrollTo(0,0); },
  fdSlot(v){ UI.fdTab='list'; if(v==='P'){ UI.fdG='P'; UI.fdF='all'; } else { UI.fdG='B'; UI.fdF=v==='DH'?'all':v; } UI.fdMore=60; if(!['rec','age','sal','grd'].includes(UI.fdS))UI.fdS='rec'; render(); const el=document.querySelector('.fdt-w'); if(el)el.closest('.card').scrollIntoView({behavior:'smooth',block:'start'}); },
  revOpen(){ if(UI.rev){ UI.rev.open=true; render(); } },
  revClose(){ UI.fdJust=UI.rev?UI.rev.pid:null; UI.rev=null; render(); if(G.fd&&!G.fd.done&&G.fd.picks[G.fd.cur]&&G.fd.picks[G.fd.cur].tid!==G.user)setTimeout(()=>dliveStart('fd'),250); },
  fdRec(){ const p=fdUserRec(1)[0]; if(p)A.fdPick(p.id); },
  fdAdv(){ dliveStart('fd'); },
  fdAuto(){ fdAdvance(false); save(); render(); window.scrollTo(0,0); },
  fdV(v){ UI.fdV=v; if(!['rec','grd','sal','age'].includes(UI.fdS))UI.fdS='rec'; render(); },
  mgrAsk(v){ const r=mgrTalk(v); UI.mgrMsg=''; save(); render(); if(/관계 \+1/.test(r.a||''))try{ toast('자주 의논해 주셔서 감독 관계 +1'); }catch(e){} },
  teamTalk(v){ UI.mgrMsg=teamTalk(v); save(); render(); },
  annClose(){ (UI.annQ||[]).shift(); annRender(); },
  annPlayer(v){ (UI.annQ||[]).shift(); annRender(); A.player(+v); },
  pactSel(v){ const id=+v; let L=UI.pactSel||[]; L=L.includes(id)?L.filter(x=>x!==id):L.concat(id).slice(-2); UI.pactSel=L; render(); },
  pactGo(){ UI.pactMsg=pactPropose(UI.pactSel||[]); UI.pactSel=[]; save(); render(); },
  pactKeep(){ try{ toast('유망주 기회 합의를 그대로 이어갑니다.'); }catch(e){} render(); },
  pactEnd(){ if(G.pact)G.pact.on=false; UI.pactMsg='합의를 끝냈습니다. 감독은 본래 판단대로 기용합니다.'; save(); render(); },
  rqSlot(v){ const k=v==='SP'||v==='RP'?v:v==='DH'?'1B':v; UI.rec=Object.assign({type:'now',age:'',sal:''},UI.rec||{},{k}); A.rqGo(); A.go('trade:req'); },
  rqGo(){ const c=Object.assign({k:'SS',type:'now',age:'',sal:''},UI.rec||{}); const R=recruitReport({k:c.k,type:c.type,age:+c.age||0,sal:+c.sal||0}); UI._rec=Object.assign(R,{k:c.k,type:c.type}); render(); },
  plEx(v){ const id=+v; if(!G.plEx||G.plEx.y!==G.year)G.plEx={y:G.year,ids:[]}; if(!G.plEx.ids.includes(id))G.plEx.ids.push(id); save(); render(); },
  plExClear(){ if(G.plEx)G.plEx.ids=[]; save(); render(); },
  evDeleg(v){ const e=(G.evs||[]).find(x=>x.id===v); if(!e||EV_KEY.has(e.k))return; G.deleg=G.deleg||{}; G.deleg[e.k]=true; e.deleg=true; evPick(e.id,e.def,true); save(); render(); try{ toast(`${EV_NAME[e.k]||'이 일'}은(는) 이제 비서가 기본안으로 처리하고 보고합니다.`); }catch(err){} },
  evDelegOff(){ G.deleg={}; save(); render(); try{ toast('일상 결정도 다시 직접 정합니다.'); }catch(err){} },
  fdAutoN(v){ const F=G.fd; if(!F||F.done)return; let n=+v||5, g=0; while(!F.done&&g++<500){ const pk=F.picks[F.cur]; if(!pk)break; if(pk.tid!==G.user){ fdAdvance(true); continue; } if(n<=0)break; const id=fdBest(G.user,true); if(id==null){ fdFinish(); break; } pk.auto=true; fdPick(id); n--; }
    UI.rev=null; save(); render(); try{ toast(F.done?'창단 드래프트가 끝났습니다.':'자동 지명을 마쳤습니다. 다시 우리 차례입니다.'); }catch(e){} },
  fdF(v){ UI.fdF=v; UI.fdMore=60; render(); }, fdS(v){ if(UI.fdS===v&&v!=='rec')UI.fdD=UI.fdD?0:1; else { UI.fdS=v; UI.fdD=0; } UI.fdMore=60; render(); },
  fdG(v){ UI.fdG=v; UI.fdF='all'; if(!['rec','age','sal','grd'].includes(UI.fdS))UI.fdS='rec'; UI.fdMore=60; render(); }, fdY(){ UI.fdY=!UI.fdY; render(); }, fdO(){ UI.fdO=!UI.fdO; render(); }, fdMore(){ UI.fdMore=(UI.fdMore||60)+60; render(); },
  nsTalk(){ UI.stadMsg=newStadTalk(); save(); render(); },
  nsPick(v){ UI.stadMsg=newStadPick(v); save(); render(); },
  retireGM(){ retireGM(); save(); render(); },
  dhy(v){ UI.dhy=+v; render(); },
  dealOpen(v){ UI.dealOpen=+v; render(); },
  stadPrice(v){ stadOf(G.user).price=+v; save(); render(); },
  stadBuild(v){ UI.stadMsg=stadStart(v); save(); render(); },
  openMail(v){ if(!v)return; const m=G.mail.find(x=>x.id===v); if(!m)return; m.read=true; if(!mailFilter(UI.mf||'all').some(x=>x.id===v))UI.mf='all'; UI.mailFocus=v; UI.tab='inbox'; closeSheets(); save(); render(); },
  mailJump(v){ if(!v)return; if(wide()&&UI.tab==='inbox'){ UI.ibSel=v; const m=G.mail.find(x=>x.id===v); if(m)m.read=true; save(); render(); window.scrollTo(0,0); return; } const el=document.getElementById('m-'+v); if(!el)return; el.scrollIntoView({block:'start',behavior:'smooth'}); ibMark(v); },
  inbox(){ UI.tab='inbox'; closeSheets(); render(); window.scrollTo(0,0); },
  dmf(v){ A.mf(v); },
  itab(v){ const [k,t]=v.split(':'); UI.it=UI.it||{}; UI.it[k]=t; render(); },
  pgGo(v){ const i=v.lastIndexOf(':'); const k=v.slice(0,i), n=+v.slice(i+1); UI.pg=UI.pg||{}; UI.pg[k]=Math.max(0,n); render(); const el=document.querySelector(`[data-pg="${k}"]`); if(el)el.scrollIntoView({block:'start'}); else window.scrollTo(0,0); },
  sndToggle(){ const on=!sndOn(); try{ localStorage.setItem('danjang-snd',on?'1':'0'); }catch(e){} if(!on)sndStopAll(); else { sndInit(); sfx('confirm',.5); if(UI.cast&&UI.cast.play)sndLoop('amb','amb',.4,1); } const b=document.getElementById('cs-snd'); if(b)b.innerHTML=ICO_SND(on); render(); },
  help(){ const on=!helpOn(); try{ localStorage.setItem('danjang-help',on?'1':'0'); }catch(e){} render(); try{ toast(on?'화면 설명을 다시 보입니다.':'화면 설명을 숨깁니다. ? 버튼으로 다시 켤 수 있습니다.'); }catch(e){} },
  nk(v){ UI.nk=v; UI.nseg='news'; A.go('league:news'); },
  recGo(v){ const [seg,k]=v.split(':'); UI.lrec=seg; UI.ls=UI.ls||{}; UI.ls[seg]={k,dir:['era','whip','bb9'].includes(k)?1:-1}; A.go('league:rec'); },
  closeMail(){ UI.mail=null; render(); },
  pmgmt(v){ A.player(v); UI.ptab='mgmt'; renderSheet(); },
  mailAct(v){ const [id,i]=v.split(':'); const m=G.mail.find(x=>x.id===id); if(!m)return; const a=m.acts[+i]; m.read=true; if(a&&A[a.a])A[a.a](a.v); else render(); },
  evPick(v){ sfx('confirm',.6); const [id,i]=v.split(':'); const e=(G.evs||[]).find(x=>x.id===id); evPick(id,+i); save(); if(e&&e.k==='agent'&&+i===0&&G.players[e.data.pid]){ A.player(e.data.pid); UI.ptab='mgmt'; renderSheet(); render(); return; } if(e&&e.k==='fx'&&+i===0){ A.go('transfer:foreign'); return; } render(); },
  readAll(){ G.mail.forEach(m=>m.read=true); save(); render(); },
  mf(v){ UI.mf=v; render(); window.scrollTo(0,0); },
  goWork(v){ const g=GW[v]||['home']; A.go(g.join(':')); },
  go(v){ v=String(v); if(v==='scout'||v==='scout:draft')v='transfer:draft'; else if(v==='scout:scouts')v='staff:scouts'; else if(v==='scout:intl'){ UI.it=UI.it||{}; UI.it.fview='net'; UI.it.fviewa='net'; v='transfer:foreign'; }
    { const [t0,s0]=String(v).split(':'); const par=ALIAS[t0]&&ALIAS[t0][s0]; UI.it=UI.it||{}; if(par)UI.it['mg_'+t0+'_'+par]=s0; }
    { const IG={'club:mkt':['club:fin','fin','mkt'],'league:abroad':['league:hist','histv','abroad'],'league:teams':['league:stand','stand','teams'],'trade:find':['trade:market','mkv','find'],'trade:req':['trade:market','mkv','req'],'transfer:watch':['transfer:foreign','fview','watch'],'transfer:net':['transfer:foreign','fview','net'],'league:find':['trade:market','mkv','find']}; if(IG[v]){ UI.it=UI.it||{}; UI.it[IG[v][1]]=IG[v][2]; v=IG[v][0]; } }
    if(v==='roster:plan'){ UI.it=UI.it||{}; UI.it.gl='plan'; v='roster:glance'; }
    if(v==='staff:pact'||v==='staff:mreq'){ UI.it=UI.it||{}; UI.it.mgrv=v==='staff:pact'?'pol':'rel'; v='staff:mgr'; }
    if(v==='league:find')v='trade:find'; if(v==='trade:fa')v='transfer:fa'; if(v==='transfer:trade')v='trade:table'; if(v==='transfer:block')v='trade:offers'; const [t,s]=v.split(':'); closeSheets(); UI.tab=t; if(t==='roster'&&s){ UI.it=UI.it||{}; UI.it.roster=s; } if(s){ if(t==='league')UI.lseg=s; else {UI.sub=UI.sub||{}; UI.sub[t]=s;} } render(); window.scrollTo(0,0); },
  sub(v){ A.go(v); },
  menu(){ UI.sheet=null;UI.mail=null;UI.game=null;UI.posSheet=null; UI.menu=true; renderSheet(); },
  ffset(v){ const [k,x]=v.split(':'); UI.ff=Object.assign({t:'yb',r:'all',s:'cur'},UI.ff||{}); UI.ff[k]=x; if(k==='t')UI.ff.r='all'; UI.fmsg2=''; render(); },
  setIntl(v){ const [r,l]=v.split(':'); G.intl[r]=+l; addLog(`${IREG[r].l} 스카우트망을 ${INET[+l].l} 단계로 조정했습니다.`); save(); render(); },
  ffk(v){ UI.ff=Object.assign({k:'all',s:'cur'},UI.ff,{k:v}); render(); },
  ffs(v){ UI.ff=Object.assign({k:'all',s:'cur'},UI.ff,{s:v}); render(); },
  signFc(v){ const p=G.players[+v]; const err=foreignCheck(G.user,p); if(err){UI.fmsg2=err;render();return;} UI.fmsg2=''; signForeign(G.user,p.id); save(); render(); },
  tutSkip(){ tutSkip(); save(); render(); },
  hireMgr(v){ const [id,y,c]=v.split(':'); const err=hireMgr(id,+y,c==='1'); UI.confirmFire=false; save(); render(); },
  fireAsk(){ UI.confirmFire=true; render(); }, fireCancel(){ UI.confirmFire=false; render(); },
  fireMgr(){ fireMgr(); UI.confirmFire=false; save(); render(); },
  renewMgr(v){ renewMgr(v||2); save(); render(); },
  setPrev(v){ G.med.prev=+v; G.medSet=true; save(); render(); },
  setHosp(v){ G.med.hosp=v; G.medSet=true; save(); render(); },
  medOk(){ G.medSet=true; save(); render(); },
  talk(v){ const [id,k]=v.split(':'); const r=talk(+id,k); UI.talkMsg={id:+id,msg:r.msg,d:r.d||0}; save(); render(); },
  devSet(v){ const [id,k]=v.split(':'); UI.devMsg=setDev(+id,k||null); if(!UI.devMsg&&k)sfx('confirm',.5); save(); if(UI.sheet!=null)renderSheet(); render(); },
  devOff(v){ setDev(+v,null); save(); render(); },
  ovsSet(v){ const [id,k]=v.split(':'); UI.devMsg=setOvs(+id,k||null); save(); render(); },
  listP(v){ listPlayer(+v); save(); render(); },
  tsugGo(v){ const [src,i]=v.split(':'); const s=(src==='k'?UI._tsugK:src==='f'?UI._find:src==='r'?((UI._rec&&UI._rec.list)||[]):UI._tsug||[])[+i]; if(!s||!tsugValid(s)){ UI.deskMsg='상황이 바뀌어 다시 찾아야 합니다.'; UI.deskOk=false; render(); return; }
    const r=proposeTrade(s.tid,s.give,[s.id]); UI.deskMsg=r.msg; UI.deskOk=r.ok; if(r.ok){ sfx('cheer_hit',.5); UI.stamp={fans:(()=>{ try{ return tradeFanLines(); }catch(e){ return []; } })(),msg:r.msg,grade:r.grade}; G.tsug=null; UI.cmpK=null; if(src==='f')UI.findT=null; } save(); render(); },
  tsugEdit(v){ const [src,i]=v.split(':'); const s=(src==='k'?UI._tsugK:src==='f'?UI._find:src==='r'?((UI._rec&&UI._rec.list)||[]):UI._tsug||[])[+i]; if(!s)return; const p=G.players[s.id]; UI.trade={tid:s.tid,give:[...s.give],get:[s.id],msg:'',seg:p&&p.isP?'pit':'bat',side:'give',sort:'cur'}; A.go('trade:table'); },
  tsugMore(){ tradeSuggest(true); UI.deskMsg=null; UI.dealOpen=null; render(); },
  cmpT(v){ if(v!=='')UI.cmpT=+v; UI.it=UI.it||{}; UI.it.roster='cmp'; if(UI.tab!=='roster'){ UI.tab='roster'; closeSheets(); } UI.rosterTeam=null; render(); window.scrollTo(0,0); },
  cmpGo(v){ UI.cmpK=v; A.cmpT(''); },
  cmpK(v){ UI.cmpK=UI.cmpK===v?null:v; render(); },
  keepP(v){ keepPlayer(+v); save(); render(); },
  tab(v){ if(v==='inbox'){ A.inbox(); return; } if(v==='scout'){ A.go('transfer:draft'); return; } if(v==='trade'&&faLive()&&UI.tab!=='trade'){ UI.sub=UI.sub||{}; if(!UI.sub.trade||UI.sub.trade==='market')UI.sub.trade='fa'; } if(v==='roster'&&UI.tab!=='roster')UI.rosterTeam=null; UI.tab=v;closeSheets();render();window.scrollTo(0,0);},
  start(v){ const m=meta(); if(!UI.newSlot){ const free=[1,2,3].find(n=>!m.slots[n]); if(!free){ UI.slotMsg='슬롯 3개가 모두 찼습니다. 덮어쓸 슬롯의 "덮어쓰고 새 게임"을 먼저 누르세요.'; render(); window.scrollTo(0,0); return; } m.active=free; setMeta(m); } UI.newSlot=null; UI.slotMsg=''; UI.title=false; UI.sstep='main'; if(UI.world){ G=UI.world; UI.world=null; claimTeam(+v); } else newGame(+v); fdWelcome(); UI.tab='home';save();render();window.scrollTo(0,0);},
  adv(v,el){ const nw=Date.now(); if(el){ if(UI._advT&&nw-UI._advT<450)return; UI._advT=nw; } if(G.res&&!G.live)G.res=null; if(blocker())return; if(UI._cfmPass)G.fOkY=G.year; const ev0=(G.evs||[]).filter(e=>!e.done).length; advance(v); if((G.evs||[]).filter(e=>!e.done).length>ev0)setTimeout(()=>sfx('alert',.7),120); else if(G.res&&G.games[G.res.i]&&G.games[G.res.i].res==='승')setTimeout(()=>sfx('cheer_hit',.45),120); if(G.res||G.live||G.stops.length||G.dig){ closeSheets(); UI.tab='home'; UI.mail=null; } save(); render(); window.scrollTo(0,0); },
  resOk(){ G.res=null; save(); render(); },
  resNext(){ G.res=null; A.adv('next'); },
  smon(v){ UI.smon=+v; render(); },
  buildFac(){ UI.facMsg=buildFac(); save(); render(); },
  clearStops(){G.stops=[];save();render();},
  liveNext(){ if(!G.live)return; G.live.upto+=2; save(); render(); },
  liveEnd(){ if(!G.live)return; G.live.upto=999; save(); render(); },
  liveDone(){ G.live=null; save(); render(); },
  openGame(v){ UI.sheet=null; UI.posSheet=null; UI.game=+v; UI.gtab='box'; renderSheet(); },
  offerYes(v){ offerMailDone(v); const r=answerOffer(v,true); note('트레이드',r.msg); G.stops=G.stops.filter(s=>s.kind!=='트레이드'); save(); render(); },
  offerNo(v){ offerMailDone(v); answerOffer(v,false); G.stops=G.stops.filter(s=>s.kind!=='트레이드'); save(); render(); },
  buildFacItem(v){ UI.facMsg=buildFacItem(v)||null; save(); render(); },
  anaHire(v){ UI.cMsg=hireAna(v)||null; save(); render(); },
  anaFire(v){ fireAna(v); save(); render(); },
  camp(v){ if(G.camp){G.camp.focus=v; G.camp.seen=true; save(); render();} },
  confirmContracts(){ const r=confirmContracts(); UI.ctMsg=r||''; save(); render(); },
  fneg(v){ UI.ctMsg=fReNeg(+v); save(); render(); },
  fdrop(v){const id=+v; const a=G.contract.foreignDrop; const i=a.indexOf(id); i>=0?a.splice(i,1):a.push(id); save(); render();},
  relAsk(v){UI.confirmRel=+v;renderSheet();},
  relCancel(){UI.confirmRel=null;renderSheet();},
  release(v){releasePlayer(+v);UI.sheet=null;UI.confirmRel=null;save();render();},
  advDraft(){ dliveStart('am'); },
  passPick(){passPick();save();render();},
  star(v){G.shortlist=G.shortlist||[]; const id=+v; const i=G.shortlist.indexOf(id); i>=0?G.shortlist.splice(i,1):G.shortlist.push(id); save(); render(); renderSheet();},
  dset(v){const [k,x]=v.split(':'); UI.df=UI.df||{pos:'all',typ:'all',reg:'all',sort:'rk',seg:'board',more:20}; UI.df[k]=k==='more'?+x:x; if(k!=='more')UI.df.more=30; render();},
  autoPick(){const id=userAutoPick(); if(id)return A.pick(id); save();render();},
  pick(v){ const id=+v; const pk0=G.draft&&G.draft.picks[G.draft.cur]; doPick(id); if(pk0)dlFeedAdd('am',pk0,id); UI.sheet=null; const p=G.players[id]; if(p&&p.team===G.user&&p.draft&&p.draft.rd<=3){ const f=draftFan(p); UI.stamp={title:f.bank==='drSteal'?'스틸 지명':'지명',msg:`${p.draft.rd}라운드 ${p.draft.no}순위 · ${p.name} (${posLabel(p)}, ${p.school||''}) · 언론 순위 ${p.press||'-'}위`,fans:f.lines}; } save(); render(); if(G.draft&&!G.draft.done&&G.draft.picks[G.draft.cur]&&G.draft.picks[G.draft.cur].tid!==G.user)setTimeout(()=>dliveStart('am'),UI.stamp?1600:350); },
  player(v){UI.myRos=false;UI.drawer=false;UI.mail=null;UI.posSheet=null;UI.game=null;if(UI.sheet!==+v)UI.ptab=(UI.tab==='staff'&&curSub('staff')==='dev'&&G.players[+v]&&G.players[+v].team===G.user)?'mgmt':'abil';UI.sheet=+v;UI.talkMsg=null;UI.devMsg=null;UI.offer=null;UI.fmsg='';UI.confirmRel=null;if(!UI.ext||UI.ext.id!==+v)UI.ext=null;renderSheet();},
  fpos(v){ UI.fpos=(v&&UI.fpos!==v)?v:null; render(); if(UI.fpos){ const el=document.querySelector('.fdd'); if(el)el.scrollIntoView({behavior:'smooth',block:'nearest'}); } },
  posSheet(v){UI.sheet=null;UI.game=null;UI.posSheet=v;renderSheet();},
  tposSheet(v){UI.sheet=null;UI.game=null;UI.posSheet=v;renderSheet();},
  seg(v){UI.seg=v;render();},
  rview(v){UI.rview=v;render();},
  coachFind(v){ UI.crole=v; UI.it=UI.it||{}; UI.it.coach='mk'; UI.cMsg=null; UI.cfire=null; render(); },
  crole(v){ UI.crole=v; render(); },
  cfireAsk(v){ UI.cfire=v; render(); },
  fireCoach(v){ fireCoach(v); UI.cfire=null; UI.cMsg=`${CROLE[v].l} 자리를 비웠습니다.`; save(); render(); },
  hireCoach(v){ const [id,y]=v.split(':'); const c=(G.cmarket||[]).find(x=>x.id===id); const e=hireCoach(id,+y); UI.cMsg=e||(c?`${CROLE[c.role].l} ${c.name} 영입 (${y}년)`:''); if(!e&&c){ UI.it=UI.it||{}; UI.it.coach=CROLE[c.role].g===2?'g2':'g1'; } save(); render(); },
  hy(v){UI.hy=+v;render();},
  retNo(v){ note('기록',retireNumber(v)); save(); render(); },
  blkOn(v){ blockAdd(+v,'any'); UI.sheet=null; save(); A.go('trade:block'); },
  blkOff(v){ blockRemove(+v); save(); render(); },
  blkAdd(){ const el=document.getElementById('blkAddSel'); if(!el||!el.value)return; blockAdd(+el.value,'any'); save(); render(); },
  blkUrg(v){ const p=G.players[+v]; if(p){ p.urgent=!p.urgent; save(); render(); } },
  blkF(v){ UI.blkF=v; render(); },
  blkSwap(v){ const [a,b]=v.split(':').map(Number); const q=G.players[a], m=G.players[b]; if(!q||!m)return; UI.trade={tid:q.team,give:[m.id],get:[q.id],msg:'',seg:q.isP?'pit':'bat',side:'give',sort:'cur'}; A.go('trade:table'); },
  offerMore(v){ UI.blkMsg={id:v,t:offerMore(v)}; save(); render(); },
  sangmu(v){ UI.milMsg=sangmuApply(+v)||`${G.players[+v].name} 상무 지원 완료. 합격자는 ${sangmuWave()==='dec'?'10월 15일':'4월 15일'}에 발표됩니다.`; save(); render(); },
  enlist(v){ UI.milMsg=enlistNow(+v)||`${G.players[+v].name} 현역 입대가 확정됐습니다(2주 뒤 입대).`; save(); render(); },
  reqUp(v){ UI.entMsg={id:+v,t:reqEntry(+v,true)}; save(); render(); },
  reqDown(v){ UI.entMsg={id:+v,t:reqEntry(+v,false)}; save(); render(); },
  toYS(v){ UI.entMsg={id:+v,t:toYS(+v)||'육성선수로 돌렸습니다.'}; save(); render(); },
  fromYS(v){ UI.entMsg={id:+v,t:fromYS(+v)||'정식 선수로 등록했습니다.'}; save(); render(); },
  ysNow(v){ const r=toYS(+v); if(r)UI.trimMsg=r; save(); render(); },
  setPol(v){ const r=setPolicy(v); UI.polMsg=r.msg; save(); render(); },
  rsort(v){ const k=UI.seg==='pit'?'pit':'bat'; UI.rs=UI.rs||{}; if(!v){UI.rs[k]=null;} else { const c=UI.rs[k]; UI.rs[k]={k:v,dir:c&&c.k===v?-c.dir:-1}; } render(); },
  rpos(v){ UI.rpos=UI.rpos||{bat:'all',pit:'all'}; UI.rpos[UI.seg==='pit'?'pit':'bat']=v; render(); },
  relNow(v){releasePlayer(+v);save();render();},
  autoTrim(){const n=rosterN(G.user)-ROSTER_MAX; trimCands(n).forEach(p=>releasePlayer(p.id)); save(); render();},
  tpartnerGo(v){UI.trade={tid:+v,give:[],get:[],msg:'',seg:'bat',side:'get',sort:'cur'}; A.go('trade:table');},
  lseg(v){ if(v==='find'){ A.go('trade:find'); return; } UI.lseg=lsegFix(v);render();window.scrollTo(0,0);},
  gtab(v){ UI.gtab=v; renderSheet(); },
  pbpGo(v){ const [g,k]=v.split(':').map(Number); UI.pbp={g,k:Math.max(0,k)}; UI.gtab='pbp'; renderSheet(); },
  cast(v){ const gi=+v; const g=G.games[gi]; if(!g||!g.pbp||!g.pbp.length)return; UI.sheet=null;UI.posSheet=null;UI.game=null;UI.menu=false;UI.castRet=null; UI.cast={g:gi,k:0,play:true,spd:UI.castSpd||1,mode:UI.castMode||'all'}; renderSheet(); },
  castClose(){ sndStopAll(); CT.tok++; CT.run=false; UI.cast=null; UI.castRet=null; renderSheet(); },
  castPlay(){ const c=UI.cast; if(!c)return; const L=G.games[c.g].pbp; if(c.k>=L.length)c.k=0; c.play=!c.play; CT.tok++; CT.run=false; cBallHide(); if(c.play)castLoop(); else { cDraw(c.k,250); sndStop('amb'); sndStop('chant'); } const pb=document.getElementById('cs-play'); if(pb)pb.textContent=c.play?'일시정지':'재생'; },
  castStep(v){ const c=UI.cast; if(c)castJump(c.k+(+v)); },
  castInn(){ const c=UI.cast; if(!c)return; const L=G.games[c.g].pbp; const h=L[Math.min(c.k,L.length-1)][0]; const i=L.findIndex((y,j)=>j>c.k&&y[0]!==h); castJump(i<0?L.length:i); },
  castSpd(){ const c=UI.cast; if(!c)return; c.spd=c.spd===1?2:c.spd===2?4:1; UI.castSpd=c.spd; const b=document.getElementById('cs-spd'); if(b)b.textContent=c.spd+'배'; },
  castMode(v){ const c=UI.cast; if(!c)return; c.mode=v; UI.castMode=v; document.querySelectorAll('.cs-mode button').forEach(b=>b.classList.toggle('on',b.dataset.v===v)); if(c.play){ CT.tok++; CT.run=false; cBallHide(); castLoop(); } },
  castEnd(){ const c=UI.cast; if(c)castJump(G.games[c.g].pbp.length,false); },
  castBox(){ const gi=UI.cast?UI.cast.g:null; A.castClose(); if(gi!=null)A.openGame(gi); },
  castPlayer(v){ const c=UI.cast; if(!c)return; c.play=false; CT.tok++; CT.run=false; UI.castRet=c; UI.cast=null; A.player(v); },
  watch(v){ UI.sheet=null; UI.posSheet=null; UI.game=+v; UI.gtab='pbp'; UI.pbp={g:+v,k:0}; renderSheet(); },
  jump(v){ UI.ptab='mgmt'; renderSheet(); const el=document.getElementById('s-'+v); if(el)el.scrollIntoView({block:'start'}); },
  ptab(v){ UI.ptab=v; renderSheet(); const sh=document.querySelector('#sheet .sheet'); if(sh)sh.scrollTop=0; },
  lsort(v){ const [id,k]=v.split(':'); UI.ls=UI.ls||{}; const c=UI.ls[id]; const asc=['era','whip','ra','hra','bb','so','name','tm','pos','role'].includes(k)&&!(id==='bat'&&k==='bb')&&!(id==='pit'&&k==='so')&&!(id==='team'&&k==='so'); UI.ls[id]={k,dir:c&&c.k===k?-c.dir:(asc?1:-1)}; render(); },
  lrec(v){ UI.lrec=v; render(); },
  lrfQ(){ UI.lrf=Object.assign({q:true,t:'all'},UI.lrf); UI.lrf.q=!UI.lrf.q; render(); },
  sbd(v){ if(v==='')return; UI.sbd=+v; render(); },
  nseg(v){ UI.nseg=v; UI.fbo=null; render(); },
  ibOld(){ UI.ibOld=!UI.ibOld; render(); },
  milAll(){ UI.milAll=!UI.milAll; render(); },
  fbo(v){ UI.fbo=UI.fbo===v?null:v; render(); },
  fbf(v){ UI.fbf=v; UI.fbo=null; render(); },
  nco(v){ UI.nco=UI.nco||{}; UI.nco[v]=!UI.nco[v]; render(); },
  lfKind(v){UI.lf.kind=v; if(UI.lf.sort==='stat'){} render();},
  lteam(v){ if(v===''){UI.leagueTeam=null;render();return;} UI.rosterTeam=+v; closeSheets(); UI.tab='roster'; render(); window.scrollTo(0,0); },
  lteamGo(v){ UI.rosterTeam=+v; UI.tab='roster'; closeSheets(); render(); window.scrollTo(0,0);},
  tpartner(v){ if(UI.trade.tid===+v)return; UI.trade={tid:+v,give:[],get:[],msg:'',seg:UI.trade.seg||'bat',side:'get',sort:UI.trade.sort||'cur'};render();},
  tseg(v){UI.trade.seg=v;render();},
  tside(v){UI.trade.side=v;render();},
  tsort(v){UI.trade.sort=v;render();},
  tpick(v){const [side,id]=v.split(':');const arr=UI.trade[side];const i=arr.indexOf(+id);i>=0?arr.splice(i,1):arr.push(+id);UI.trade.msg='';UI.trade.want=null;render();},
  treset(){UI.trade.give=[];UI.trade.get=[];UI.trade.msg='';UI.trade.want=null;render();},
  tpropose(){const tr=UI.trade;const r=proposeTrade(tr.tid,tr.give,tr.get);tr.msg=r.msg;tr.ok=r.ok;tr.want=r.want||null;tr.counters=r.counters||null;if(r.ok){tr.give=[];tr.get=[];UI.stamp={fans:(()=>{ try{ return tradeFanLines(); }catch(e){ return []; } })(),msg:r.msg,grade:r.grade};sfx('cheer_hit',.5);sfx('confirm',.7);G.tsug=null;} else sfx('mitt',.4); save();render();},
  tcounter(v){ const tr=UI.trade; const c=(tr.counters||[])[+v]; if(!c)return; tr.give=[...c.give]; tr.get=[...c.get]; tr.counters=null; A.tpropose(); },
  stampOff(){ UI.stamp=null; render(); },
  faSel(v){ UI.faSel=UI.faSel===+v?null:+v; UI.offer=null; render(); if(UI.faSel){ const el=document.querySelector('.faroom'); if(el)el.scrollIntoView({block:'start'}); } },
  faPos(v){ UI.faPos=v; render(); },
  faOpen(v){ UI.faSel=+v; UI.offer=null; A.go('transfer:fa'); },
  myRos(){ UI.myRos=true; renderSheet(); },
  csort(v){ UI.csort=v; render(); },
  protTog(v){ const id=+v; if(!UI.prot)return; const S=new Set(UI.prot.ids); if(S.has(id))S.delete(id); else S.add(id); UI.prot.ids=[...S]; render(); },
  protAuto(v){ const c=(G.comp||[]).find(x=>x.id===v); if(!c)return; UI.prot={id:c.id,ids:aiProtect(G.user,COMP[c.grade].prot)}; render(); },
  protSubmit(v){ const c=(G.comp||[]).find(x=>x.id===v); if(!c)return; const g=COMP[c.grade]; if((UI.prot.ids||[]).length>g.prot)return; const r=compSubmit(v,UI.prot.ids); UI.prot=null; UI.stamp={title:'보상 절차 완료',msg:r}; save(); render(); },
  compPick(v){ const [id,pid]=v.split(':'); const c=(G.comp||[]).find(x=>x.id===id); if(!c||c.stage!=='pick')return; compResolve(c,+pid||null); UI.stamp={title:+pid?'보상선수 지명':'보상금 선택',msg:+pid?`${G.players[+pid].name}을(를) 보상선수로 데려옵니다. 보상금 ${money(c.cash)}.`:`선수 대신 보상금 ${money(c.cash)}을(를) 받습니다.`}; save(); render(); },
  cmode(v){ UI.cmode=v; UI.it=UI.it||{}; UI.it.coach=v==='other'?'po':'mk'; UI.poachMsg=null; render(); },
  poach(v){ const [t,k,to]=v.split(':'); UI.poachMsg=poachCoach(+t,k,to); note('감독',UI.poachMsg); save(); render(); },
  mgrDir(v){ const [k,on]=v.split(':'); UI.dirMsg=setMgrDir(k,on==='1'); note('감독',UI.dirMsg); save(); render(); },
  ownAsk(v){ const [k,x]=v.split(':'); let r; if(k==='gen')r=ownerAsk(+x,null); else if(k==='fa'){ const p=G.players[+x]; r=ownerAsk(p.ask.annual,{k:'fa',pid:+x}); } else { const p=G.players[+x]; r=ownerAsk(round5(Math.max(500,p.sal*.6)),{k:'frep',pid:+x}); } UI.ownMsg=r; note('구단주',r); save(); render(); },
  featF(v){ UI.ftf=v; render(); },
  abf(v){ UI.abf=v; render(); },
  fwatch(v){ UI.fmsg2=null; const r=fwatchToggle(+v); UI.fwMsg=r; save(); render(); },
  featY(v){ UI.fy=v==='all'?'all':+v; render(); },
  retWar(v){ G.cfg=G.cfg||{}; G.cfg.retWar=+v; save(); render(); },
  obAct(v){ const [id,k]=v.split(':'); const ob=obOf(id); if(!ob)return; G.obFace=G.obFace||{};
    if(k==='coach'){ let c=(G.cmarket||[]).find(x=>x.ob===id); if(!c){ c=obCoach(ob); G.cmarket.unshift(c); } UI.crole=c.role; UI.it=UI.it||{}; UI.it.coach='mk'; A.go('staff:coach'); return; }
    if(k==='mgr'){ if(!(G.mmarket||[]).some(m=>m.ob===id))G.mmarket.unshift(obMgr(ob)); A.go('staff:mgr'); return; }
    if(k==='scout'){ if(G.scouts.length>=SCOUT_MAX)return; const s=(G.scoutMarket||[]).find(x=>x.ob===id)||obScout(ob); G.scoutMarket=(G.scoutMarket||[]).filter(x=>x.ob!==id); s.since=G.day; G.scouts.push(s); obHireBonus(id,'스카우트'); addLog(`OB ${ob.name}을(를) 스카우트로 영입했습니다.`); save(); render(); return; }
    if(k==='front'){ ob.alt={k:'front',tid:G.user,t:`${tshort(G.user)} 프런트`}; ob.bond+=5; obHireBonus(id,'프런트'); addLog(`OB ${ob.name}이(가) 우리 프런트에 합류했습니다.`); save(); render(); } },
  reroll(){ UI.world=null; render(); },
  person(v){ UI.person=v; UI.personMsg=null; renderSheet(); },
  gmCall(v){ const r=gmContact(+v,'call'); UI.gmMsg=r.msg; UI.personMsg=r.msg; if(r.ok)sfx('confirm',.5); save(); render(); },
  gmMeal(v){ const r=gmContact(+v,'meal'); UI.gmMsg=r.msg; UI.personMsg=r.msg; if(r.ok)sfx('confirm',.5); save(); render(); },
  findT(v){ UI.findT=v===''?null:+v; UI.deskMsg=null; A.go('trade:find'); },
  findMine(v){ UI.findM=v===''?null:+v; UI.deskMsg=null; A.go('trade:find'); },
  findPos(v){ UI.findPos=v; render(); },
  gmFix(v){ UI.findPos=v; UI.findT=null; UI.castRet=null; if(UI.cast){ UI.cast.play=false; CT.tok++; CT.run=false; UI.cast=null; } A.go('trade:find'); },
  pwatch(v){ pwatchToggle(+v); save(); const c=UI.cast; if(c&&G.games[c.g]){ cSide(G.games[c.g],c.k); } else { render(); renderSheet(); } },
  mktGo(v){ const x=(UI._mkt||[])[+v]; const m=UI.findM; if(!x||m==null)return; const r=proposeTrade(x.tid,[m],x.give); UI.deskMsg=r.msg; UI.deskOk=r.ok; if(r.ok){ UI.stamp={fans:(()=>{ try{ return tradeFanLines(); }catch(e){ return []; } })(),msg:r.msg,grade:r.grade}; sfx('cheer_hit',.5); UI.findM=null; G.tsug=null; } save(); render(); },
  jobYes(v){ const r=jobAnswer(+v,true); UI.tab='home'; closeSheets(); UI.gmMsg=r; save(); render(); window.scrollTo(0,0); },
  jobNo(v){ jobAnswer(+v,false); save(); render(); },
  toTrade(v){const p=G.players[+v]; if(UI.trade.tid!==p.team)UI.trade={tid:p.team,give:[],get:[],msg:'',sort:UI.trade.sort||'cur'}; if(!UI.trade.get.includes(p.id))UI.trade.get.push(p.id); UI.trade.seg=p.isP?'pit':'bat'; UI.trade.side='give'; UI.trade.msg=''; closeSheets(); A.go('trade:table');},
  toTradeGive(v){const p=G.players[+v]; if(!UI.trade.give.includes(p.id))UI.trade.give.push(p.id);UI.trade.seg=p.isP?'pit':'bat';UI.trade.side='get';closeSheets(); A.go('trade:table');},
  hireScout(v){const s=G.scoutMarket.find(x=>x.id===v); if(s&&G.scouts.length<SCOUT_MAX){ s.since=G.day; G.scouts.push(s);G.scoutMarket=G.scoutMarket.filter(x=>x.id!==v);try{obHireBonus(s.ob,'스카우트');}catch(e){}addLog(`스카우트 ${s.name}(${s.region}·능력 ${s.skill})을 영입했습니다.`);save();render();}},
  fireScout(v){const s=G.scouts.find(x=>x.id===v); G.scouts=G.scouts.filter(x=>x.id!==v); if(s)addLog(`스카우트 ${s.name}와(과) 계약을 끝냈습니다.`); save();render();},
  signF(v){const p=G.players[+v]; const err=foreignCheck(G.user,p); if(err){UI.fmsg=err;renderSheet();return;} signForeign(G.user,p.id); UI.sheet=null; save(); render();},
  offA(v,el){UI.offer={id:+v,annual:+el.value,years:(UI.offer&&UI.offer.id===+v?UI.offer.years:(G.fa.offers[+v]||G.players[+v].ask).years)};
    const a=document.getElementById('offAv'), t=document.getElementById('offTot'); if(a)a.textContent=money(UI.offer.annual); if(t)t.textContent='총액 '+money(UI.offer.annual*UI.offer.years);},
  offY(v){const [id,y]=v.split(':').map(Number);const base=UI.offer&&UI.offer.id===id?UI.offer:(G.fa.offers[id]||G.players[id].ask);UI.offer={id,annual:base.annual,years:y};render();},
  offer(v){const id=+v;const o=UI.offer&&UI.offer.id===id?UI.offer:(G.fa.offers[id]||G.players[id].ask); if(faOutBlocked(G.user,G.players[id])){ UI.faMsg={id,t:`이번 겨울 다른 구단 FA는 ${faCapN()}명까지만 영입할 수 있습니다(KBO 규약 제173조).`}; render(); return; } if(G.day<G.fa.openDay){G.fa.offers[id]={annual:o.annual,years:o.years}; UI.faMsg={id,t:'11월 6일 협상이 열리면 에이전트가 답합니다.'};} else { const r=faNegotiate(id,{annual:o.annual,years:o.years}); UI.faMsg={id,t:r.msg}; } UI.offer=null; save(); render();},
  faAccept(v){ UI.faMsg={id:+v,t:faAcceptCounter(+v)}; save(); render(); },
  unoffer(v){delete G.fa.offers[+v];UI.offer=null;UI.sheet=null;save();render();},
  extA(v,el){ if(!UI.ext)return; UI.ext.annual=+el.value; UI.ext.msg=''; const a=document.getElementById('extAv'), t=document.getElementById('extTot'); if(a)a.textContent=money(UI.ext.annual); if(t)t.textContent='총액 '+money(UI.ext.annual*UI.ext.years); },
  extY(v){ const [,y]=v.split(':').map(Number); if(UI.ext){UI.ext.years=y;UI.ext.msg='';} renderSheet(); },
  extOffer(v){ const e=UI.ext; if(!e)return; const r=offerExtension(+v,e.annual,e.years); e.msg=r.msg; e.ok=r.ok; save(); render(); },
  mkt(v,el){G.marketing=+el.value;save();render();},
  askNew(){UI.confirmNew=true;render();},
  cancelNew(){UI.confirmNew=false;render();},
  newgame(){ save(); G=null; UI.confirmNew=false; UI.newSlot=null; UI.tab='home'; closeSheets(); render(); window.scrollTo(0,0); },
  slotLoad(v){ if(G)save(); const m=meta(); const g=unpack(localStorage.getItem(slotKey(+v))); if(!g){UI.slotMsg='불러오지 못했습니다.';render();return;} m.active=+v; setMeta(m); G=g; try{migrateDraft();}catch(e){} UI.tab='home'; UI.slotMsg=''; UI.title=false; UI.sstep='main'; closeSheets(); render(); window.scrollTo(0,0); },
  slotNew(v){ if(G)save(); UI.newSlot=+v; const m=meta(); m.active=+v; setMeta(m); G=null; UI.slotMsg=''; UI.title=true; UI.sstep='team'; render(); window.scrollTo(0,0); },
  slotDel(v){ const m=meta(); if(UI.delAsk!==+v){ UI.delAsk=+v; UI.slotMsg=`슬롯 ${v}을(를) 지우려면 삭제를 한 번 더 누르세요.`; render(); return; } try{localStorage.removeItem(slotKey(+v));}catch(e){} delete m.slots[+v]; setMeta(m); UI.delAsk=null; UI.slotMsg=`슬롯 ${v}을(를) 지웠습니다.`; render(); },
  async expFile(){ const code=LZString.compressToBase64(JSON.stringify(G)); if(!DL){ try{ const blob=new Blob([code],{type:'text/plain'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`danjang-${G.year}.txt`; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1000); UI.impMsg='파일을 내려받았습니다. 내려받기가 막혀 있으면 "코드 만들기"를 쓰세요.'; }catch(err){ UI.impMsg='이 화면에서는 파일 저장을 쓸 수 없습니다. "코드 만들기"를 쓰세요.'; } render(); return; } if(false){ render(); return; }
    try{ await DL.save({filename:`danjang-${tshort(G.user)}-${G.year}.txt`,data:code}); UI.impMsg='파일을 저장했습니다.'; }catch(err){ UI.impMsg=err&&err.code==='declined'?'파일 저장을 취소했습니다.':err&&err.code==='rate_limited'?'잠시 뒤 다시 눌러 주세요.':'파일로 저장하지 못했습니다. "코드 만들기"를 쓰세요.'; } render(); },
  expCode(){ UI.expCode=LZString.compressToBase64(JSON.stringify(G)); render(); },
  impCode(){ const el=document.getElementById('impCode'); const t=(el&&el.value||'').trim(); importText(t); },
};
/* ===== 결재: 되돌릴 수 없는 결정은 결재 문서로 한 번 더 확인하고, 결과를 소식함에 남긴다 ===== */
function roomWith(mut){ const b0=budget(); const undo=mut(); let b1=b0; try{ b1=budget(); }finally{ undo(); } return [Math.round(b0.roomGoal),Math.round(b1.roomGoal)]; }
const pnm=id=>{ const p=G.players[id]; return p?`${p.name}(${posLabel(p)}, ${p.age}세, ${money(p.sal)})`:''; };
function tradeDoc(tid,give,get){ give=give.filter(id=>G.players[id]); get=get.filter(id=>G.players[id]); if(!give.length&&!get.length)return null;
  const inS=sum(get.map(id=>G.players[id].sal)), outS=sum(give.map(id=>G.players[id].sal)); const ra=roomAfter(give,get);
  const cp0=capPay(G.user), cp1=cp0+sum(get.map(id=>isRookie(G.players[id])?0:G.players[id].sal))-sum(give.map(id=>isRookie(G.players[id])?0:G.players[id].sal)), cap=capOf(G.year);
  return {subj:`${tshort(tid)}와(과) 트레이드`,kind:'트레이드',lines:[`보내는 선수: ${give.map(pnm).join(', ')||'없음'}`,`받는 선수: ${get.map(pnm).join(', ')||'없음'}`,`연봉 ${inS-outS>=0?'+':''}${money(inS-outS)}/년 · 예산 여유 ${money(ra.before)} → ${money(ra.after)}`,cp1>cap&&cp1>cp0?`샐러리캡 초과: 상위 40명 연봉 ${money(cp1)} / 상한 ${money(cap)} (시즌 끝까지 넘으면 경쟁균형세)`:''],warn:'상대가 받아들이면 바로 성사되고 되돌릴 수 없습니다.',chk:()=>(G.trades||[]).length}; }
const GUARD={
  signFc(v){ const p=G.players[+v]; if(!p||foreignCheck(G.user,p))return null; const [a,b]=roomWith(()=>{ const t0=p.team,s0=p.sal; p.team=G.user; p.sal=p.ask; return ()=>{p.team=t0;p.sal=s0;}; }); const bb=budget();
    return {subj:`외국인 선수 ${p.name} 계약`,kind:'외국인',lines:[`${p.nat||''} · ${posLabel(p)} · ${p.age}세`,`연봉 ${money(p.ask)} (${Math.round(p.ask/USD)}만 달러)`,`외국인 배정 예산 남은 ${money(bb.fRoom)} → ${money(Math.max(0,bb.fRoom-p.ask))}`,`예산 여유 ${money(a)} → ${money(b)}`],warn:'계약하면 되돌릴 수 없습니다. 방출해도 계약은 정리해야 합니다.'}; },
  signF(v){ return GUARD.signFc(v); },
  tsugGo(v){ const [src,i]=v.split(':'); const x=(src==='k'?UI._tsugK:src==='f'?UI._find:src==='r'?((UI._rec&&UI._rec.list)||[]):UI._tsug||[])[+i]; if(!x||!tsugValid(x))return null; return tradeDoc(x.tid,x.give,[x.id]); },
  mktGo(v){ const x=(UI._mkt||[])[+v]; const m=UI.findM; if(!x||m==null)return null; return tradeDoc(x.tid,[m],x.give); },
  tpropose(){ const tr=UI.trade; if(!tr||(!tr.give.length&&!tr.get.length))return null; return tradeDoc(tr.tid,tr.give,tr.get); },
  offerYes(v){ const o=(G.offers||[]).find(x=>x.id===v); if(!o)return null; const d=tradeDoc(o.from,o.get,o.give); if(d){ d.subj=`${tshort(o.from)} 제안 수락`; d.warn='수락하면 바로 성사되고 되돌릴 수 없습니다.'; } return d; },
  confirmContracts(){ const C=G.contract; if(!C)return null; { const f=fReCapInfo(); if(f&&f.over>0)return null; } const L=(C.ended||[]).map(id=>G.players[id]).filter(p=>p&&p.newSal!=null); const d=sum(L.map(p=>p.newSal-p.sal));
    return {subj:'연봉 계약 일괄 확정',kind:'연봉',lines:[`대상 ${L.length}명 · 연봉 합계 ${d>=0?'+':''}${money(d)}`,...L.sort((a,b)=>Math.abs(b.newSal-b.sal)-Math.abs(a.newSal-a.sal)).slice(0,5).map(p=>`${p.name}: ${money(p.sal)} → ${money(p.newSal)}`)],warn:'확정하면 올해 연봉이 정해지고 되돌릴 수 없습니다.'}; },
  hireMgr(v){ const [id,y,c]=v.split(':'); const m=(G.mmarket||[]).find(x=>x.id===id); if(!m)return null; const cur=G.mgr[G.user]; const cl=c==='1'&&m.clan&&m.clan.length?m.clan:null; const b=budget();
    return {subj:`${m.name} 감독 선임`,kind:'감독',lines:[`계약 ${y}년 · 연봉 ${money(m.sal)}`,cl?`사단 코치 ${cl.length}명 함께 영입 · 연봉 합계 ${money(sum(cl.map(x=>x.sal)))}`:'',`지금 예산 여유 ${money(b.roomGoal)} (올해 남은 기간 연봉 약 ${money(Math.round((m.sal+(cl?sum(cl.map(x=>x.sal)):0))*b.rem))}${cl?` + 밀려나는 코치 정산금 ${money(clanSev(m))}`:''} 추가)`,cur&&!cur.interim?`현 ${cur.name} 감독은 경질되고 잔여 연봉 약 ${money(Math.round(cur.sal*Math.max(0,cur.yrs-.5)))}을 냅니다.`:'감독 자리가 비어 있습니다.'],warn:'선임하면 되돌릴 수 없습니다.'}; },
  extOffer(v){ const e=UI.ext; const p=G.players[+v]; if(!e||!p)return null; return {subj:`${p.name} 비FA 다년계약 제안`,kind:'연봉',lines:[`${e.years}년 · 연 ${money(e.annual)} · 총 ${money(e.annual*e.years)}`,`지금 연봉 ${money(p.sal)}`],warn:'선수가 받아들이면 바로 확정되고 되돌릴 수 없습니다.'}; },
  offer(v){ const id=+v; const p=G.players[id]; if(!p||!G.fa||p.faFrom===G.user||G.fa.offers[id]||faOutBlocked(G.user,p))return null; const o=UI.offer&&UI.offer.id===id?UI.offer:p.ask; const g=COMP[p.faGrade]; const ps=p.faPrevSal||0;
    const comp=p.faGrade==='C'?`보상금 ${money(Math.round(ps*1.5))}`:`보호 ${g.prot}명 밖 선수 1명 + ${money(ps*g.withP)}, 또는 선수 없이 ${money(ps*g.cash)} (상대 구단 선택)`;
    return {subj:`FA ${p.name} 영입 제안`,kind:'FA',lines:[`${posLabel(p)} · ${p.age}세 · ${p.faGrade}등급 · 원소속 ${tshort(p.faFrom)}`,`제시 ${o.years}년 · 연 ${money(o.annual)} · 총 ${money(o.annual*o.years)}`,`계약하면 보상: ${comp}`,'보상금은 올해 결산 지출로 잡혀 예산 여유가 그만큼 줄어듭니다.'],warn:'선수가 받아들이면 바로 계약되고 되돌릴 수 없습니다. 첫 제안 때만 묻습니다.'}; },
  buildFacItem(v){ facInit(); const D=FACI[v]; if(!D)return null; const lv=G.fac.it[v]; if(lv>=3||G.fac.bld[v])return null; const c=D.c[lv+1]; return {subj:`${D.l} 공사: ${D.lv[lv+1]}`,kind:'시설',lines:[`공사비 ${money(c)} (보유 자금 ${money(team(G.user).cash)}에서 바로 지출)`,`공사 기간 ${D.days[lv+1]}일 · 완공 후 유지비 연 ${money(D.up[lv+1])}`,D.d],warn:'시작하면 되돌릴 수 없습니다.'}; },
  stadBuild(v){ const S=stadOf(G.user); const it=STAD_ITEMS.find(x=>x.k===v); if(!it)return null; const lv=S.lv[v]; if(lv>=5||(S.build||[]).some(b=>b.k===v))return null; const per=period(); if(per==='season'||per==='post')return null;
    const c=STAD_COST[lv+1]; if(team(G.user).cash<c)return null; return {subj:`${it.l} ${lv+1}단계 공사`,kind:'구장',lines:[`공사비 ${money(c)} (보유 자금 ${money(team(G.user).cash)} → ${money(team(G.user).cash-c)})`,`공사 ${STAD_DAYS[lv+1]}일 · 유지비 연 +${money(STAD_UP[lv+1]-STAD_UP[lv])}`],warn:'공사비는 바로 나가고 되돌릴 수 없습니다.'}; },
  protSubmit(v){ const c=(G.comp||[]).find(x=>x.id===v); if(!c||!UI.prot)return null; const g=COMP[c.grade]; const ids=UI.prot.ids||[]; if(ids.length>g.prot)return null; const out=compPool(G.user).filter(q=>!ids.includes(q.id)).sort((a,b)=>ovr(b)-ovr(a)).slice(0,4);
    return {subj:`보호선수 ${ids.length}명 명단 제출`,kind:'FA',lines:[`${tshort(c.from)}이(가) 명단 밖에서 1명을 데려가거나 보상금을 받습니다.`,`명단 밖 주요 선수: ${out.map(q=>`${q.name}(${posLabel(q)}, ${Math.round(ovr(q))})`).join(', ')||'없음'}`],warn:'제출하면 바꿀 수 없습니다.'}; },
  jobYes(v){ const tid=+v; const t=team(tid); const o=G.last&&G.last.order?G.last.order.findIndex(x=>x.tid===tid)+1:0; return {subj:`${t.city} ${t.nick} 단장 취임`,kind:'경력',lines:[`지난 시즌 ${o||'-'}위 · ${needText(tid)}`,'선수단·감독·코치진·재정은 이 구단 것을 그대로 이어받습니다.'],warn:'취임하면 되돌릴 수 없습니다.'}; },
  retireGM(){ return G.unemp?{subj:'단장 경력 마치기',kind:'경력',lines:[`명성 ${G.rep} · 야인 ${Math.floor((G.day-(G.unemp.since??G.day))/30)}개월`],warn:'경력을 마치면 이 게임은 끝납니다. 새 게임은 시작 화면에서 할 수 있습니다.'}:null; },
  nsPick(v){ const o=NEWSTAD.find(x=>x.k===v); if(!o)return null; return {subj:`신구장 ${o.l}(${o.cap.toLocaleString('ko-KR')}석) 착공`,kind:'구장',lines:[`분담금 ${money(o.cost)}을 3년간 결산 때 나눠 냅니다(연 ${money(Math.round(o.cost/3))}, 그중 70%는 모기업 출자).`,'공사 3년 · 개장 후 시설 4단계 이상 · 개장 초 관중 크게 증가'],warn:'착공하면 되돌릴 수 없습니다.'}; },
  relNow(v){ const p=G.players[+v]; if(!p)return null; const cost=p.faC?Math.round(p.sal*p.yrs*.5):0; return {subj:`${p.name} 방출`,kind:'선수',lines:[pnm(p.id),cost?`남은 계약 정산금 ${money(cost)}`:'정산금 없음'],warn:'방출하면 되돌릴 수 없습니다.'}; },
  adv(v){ if(G.fOkY===G.year||period()!=='pre'||G.day<G.cal.open-35||blocker()||!G.mgr[G.user])return null; const f=foreignOf(G.user); const m=f.filter(p=>p.foreign==='용병').length, as=f.filter(p=>p.foreign==='아시아').length; if(m>=3&&as>=1)return null;
    UI._advT=0; return {subj:'외국인 선수 자리가 비어 있습니다',kind:'외국인',lines:[`용병 ${m}/3 · 아시아쿼터 ${as}/1`,'빈 자리는 시즌 중에도 채울 수 있지만, 좋은 후보는 다른 구단이 먼저 데려갑니다.','그대로 진행하려면 결재, 먼저 채우려면 반려 후 영입 → 외국인 시장으로 가세요.'],warn:'이번 시즌에는 다시 묻지 않습니다.'}; },
  fdAuto(){ const F=G.fd; if(!F||F.done)return null; const n=F.picks.slice(F.cur).filter(x=>x.tid===G.user).length; if(n<2)return null;
    return {subj:`남은 ${n}번 지명을 자동으로`,kind:'드래프트',lines:[`우리 남은 지명 ${n}번을 스카우트 추천대로 뽑습니다.`,'관심 선수(★)가 남아 있으면 먼저 고릅니다.','끝나면 지명 결과를 소식함으로 보고합니다.'],warn:'자동 지명은 되돌릴 수 없습니다.'}; },
  fdPick(v){ const p=G.players[+v]; const M=fdMoney(); if(!p||!M||p.sal<=M.room-M.W)return null;
    return {subj:`${p.name} 지명: 연봉 한도 확인`,kind:'드래프트',lines:[`${p.name} 연봉 ${money(p.sal)} · ${tContract(p)}`,`지명 후 국내 연봉 ${money(M.spent+p.sal)} / 한도 ${money(M.lim)}`,`남은 지명 ${Math.max(0,M.left-1)}번과 자동 배분 ${M.autoN}명(약 ${money(M.W)})을 더하면 한도를 넘을 수 있습니다.`,M.capBound?'샐러리캡을 넘기면 시즌 끝에 초과분의 30%를 경쟁균형세로 냅니다.':'재정 여력을 넘기면 적자가 나고 구단주 신뢰가 떨어집니다.'],warn:'그래도 지명하려면 결재하세요.'}; },
  autoTrim(){ const n=rosterN(G.user)-ROSTER_MAX; if(n<=0)return null; const L=trimCands(n); return {subj:`로스터 정리 ${L.length}명`,kind:'선수',lines:L.slice(0,12).map(p=>pnm(p.id)),warn:'정리 대상은 방출되거나 육성선수로 돌아갑니다. 되돌릴 수 없습니다.'}; },
};
/* 영입 발표: 새로 온 선수가 왜 필요한지, 무엇을 맡고, 무엇을 감수하는지 한 장으로 */
function annCheck(){ if(!G||G.gameOver||G.unemp||G.fdWait||(G.fd&&!G.fd.done))return; if(navigator.webdriver&&!UI.annTest)return; /* 자동화 테스트에서는 끈다 */ const ids=[]; for(const p of Object.values(G.players))if(p.team===G.user)ids.push(p.id);
  if(!UI._annPrev||UI._annY!==G.user){ UI._annPrev=new Set(ids); UI._annY=G.user; return; } const nw=ids.filter(id=>!UI._annPrev.has(id)); UI._annPrev=new Set(ids); if(!nw.length)return;
  for(const id of nw){ const p=G.players[id]; const st=(p.story||[]).filter(x=>x.k==='move').slice(-1)[0]; if(!st||st.y!==G.year||st.d<G.day-14)continue; if(/드래프트|지명/.test(st.t)&&!/트레이드|FA/.test(st.t))continue; (UI.annQ=UI.annQ||[]).push(id); }
  if(UI.annQ&&UI.annQ.length)annRender(); }
function annRender(){ let el=document.getElementById('ann'); if(!el){ el=document.createElement('div'); el.id='ann'; document.body.appendChild(el); }
  const id=(UI.annQ||[])[0]; const p=id!=null&&G.players[id]; if(!p||p.team!==G.user){ if(UI.annQ&&UI.annQ.length){ UI.annQ.shift(); return annRender(); } el.innerHTML=''; return; }
  const st=(p.story||[]).filter(x=>x.k==='move').slice(-1)[0]; const k=pSlot(p); let role='엔트리 경쟁', why='', blk=[];
  try{ const d=depth(G.user); const inS=d.start.some(x=>x.id===p.id), inSP=d.sp.some(x=>x.id===p.id), inP=d.pen.slice(0,4).some(x=>x.id===p.id);
    role=inS?`주전 ${posLabel(p)}`:inSP?'선발 로테이션':inP?'필승조':p.isP?'불펜 경쟁':'백업·대타';
    const rk=slotRanks(G.user)[k]; const others=k==='SP'?d.sp.filter(x=>x.id!==p.id):k==='RP'?d.pen.filter(x=>x.id!==p.id):[d.ln[k],...d.bench.filter(x=>x.pos===k)].filter(x=>x&&x.id!==p.id); const o2=others[0];
    why=`우리 ${SLOTK[k]||posLabel(p)} 리그 ${rk.rank}위.${o2?` 기존 ${o2.name}(${Math.round(ovr(o2))})${ovr(p)>ovr(o2)+1?'보다 낫습니다':ovr(p)<ovr(o2)-1?'의 뒤를 받칩니다':'와 비슷한 수준으로 경쟁합니다'}.`:''}`;
    blk=playersOf(G.user).filter(q=>q.id!==p.id&&!q.foreign&&q.age<=24&&pSlot(q)===k&&(scoutReport(q).ofp||0)>=52).slice(0,2); }catch(e){}
  const risk=[p.inj>=.2?'부상이 잦은 편':'',p.foreign&&p.adapt!=null&&p.adapt<45?'한국 적응 변수':'',p.age>=33?`${p.age}세, 하락 시작 나이`:''].filter(Boolean);
  const h=curLine(p); const stat=h?(p.isP?(h.outs?`ERA ${pRate(h).era.toFixed(2)} · ${ipStr(h.outs)}이닝`:''):(h.pa?`OPS ${fmt3(bRate(h).ops)} · ${h.hr}홈런`:'')):'';
  el.innerHTML=`<div class="cfm-w"><div class="cfm ann" role="dialog" aria-modal="true"><div class="cfm-h"><span>영입 발표</span><span>${dsh(G.day)}</span></div>
    <div class="row" style="flex-wrap:nowrap;gap:12px">${avImg(p,true)}<div><h3 style="margin:0">${esc(p.name)}</h3><p class="small muted" style="margin:2px 0">${posLabel(p)} · ${p.age}세 · ${hand(p)}${st?` · ${esc(st.t)}`:''}</p>${rchip(scoutReport(p).cur)}${stat?` <span class="small">${stat}</span>`:''}</div></div>
    <ul class="rec-w"><li><b>예상 역할</b> 감독은 ${esc(role)}(으)로 볼 것 같습니다.</li><li><b>보강 이유</b> ${esc(why)}</li><li><b>비용</b> 연봉 ${money(p.sal)} · ${p.foreign?'1년 계약':p.faC?`계약 ${p.yrs}년`:`FA까지 ${ctrlYears(p)}년`}</li>${risk.length?`<li class="warn"><b>위험</b> ${risk.join(' · ')}</li>`:''}${blk.length?`<li><b>미래 경로</b> 같은 자리 유망주 ${blk.map(q=>`${esc(q.name)}(${q.age}세)`).join(', ')}의 기회가 줄 수 있습니다.</li>`:''}</ul>
    <div class="cfm-b"><button class="btn" data-a="annPlayer" data-v="${p.id}">선수 보기</button><button class="btn primary" data-a="annClose">확인${UI.annQ.length>1?` (${UI.annQ.length-1}명 더)`:''}</button></div></div></div>`;
  try{ josaFix(el); }catch(e){} }
function cfmRender(){ let el=document.getElementById('cfm'); if(!el){ el=document.createElement('div'); el.id='cfm'; document.body.appendChild(el); }
  const c=UI.cfm; if(!c){ el.innerHTML=''; return; } const d=c.doc;
  el.innerHTML=`<div class="cfm-w"><div class="cfm" role="dialog" aria-modal="true"><div class="cfm-h"><span>결재 요청</span><span>운영팀 · ${dsh(G.day)}</span></div><h3>${esc(d.subj)}</h3><ul>${d.lines.filter(Boolean).map(l=>`<li>${esc(l)}</li>`).join('')}</ul>${d.warn?`<p class="cfm-x">${esc(d.warn)}</p>`:''}<div class="cfm-b"><button class="btn" data-a="cfmNo">반려</button><button class="btn primary" data-a="cfmOk">결재</button></div></div></div>`;
  try{ josaFix(el); }catch(e){} }
for(const k of Object.keys(GUARD)){ const f=A[k]; if(!f)continue; A[k]=function(v,el,e){ if(UI._cfmPass)return f.call(A,v,el,e); let d=null; try{ d=GUARD[k](v); }catch(err){ d=null; } if(!d)return f.call(A,v,el,e); UI.cfm={k,v,doc:d}; cfmRender(); }; }
A.cfmNo=function(){ UI.cfm=null; cfmRender(); };
A.cfmOk=function(){ const c=UI.cfm; if(!c)return; UI.cfm=null; cfmRender(); const n0=c.doc.chk?c.doc.chk():null; UI._cfmPass=true; try{ A[c.k](c.v); }finally{ UI._cfmPass=false; }
  const done=c.doc.chk?c.doc.chk()>n0:true; const m=mail('운영팀',`결재 ${done?'완료':'(불발)'}: ${c.doc.subj}`,c.doc.lines.filter(Boolean).join('\n')+(c.doc.chk&&!done?'\n\n상대 구단이 받아들이지 않아 성사되지 않았습니다.':''),{kind:'결재'}); m.read=true; save(); };
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-a]'); if(!el)return;
  const a=el.dataset.a;
  if(['tsel','mkt','offA','extA','lfTeam','lrfT','lfSort','rosterTeam','sAssign','blkWant','impFile','recF','anaRole'].includes(a))return;
  if(a==='closeSheet'){ if(e.target.closest('.x')||!e.target.closest('[data-stop]')){ const back=UI.sheet!=null&&UI.castRet; closeSheets(); if(back){ UI.cast=back; renderSheet(); } } return; }
  if(A[a]){ e.preventDefault(); A[a](el.dataset.v,el,e); }
});
document.addEventListener('change',e=>{ const el=e.target.closest('[data-a]'); if(!el)return; const a=el.dataset.a;
  if(a==='tsel'||a==='mkt')A[a](el.dataset.v,el,e);
  if(a==='lfTeam'){UI.lf.team=el.value;render();}
  if(a==='anaRole'){ setAnaRole(el.dataset.v,el.value); save(); render(); return; }
  if(a==='recF'){ UI.rec=Object.assign({k:'SS',type:'now',age:'',sal:''},UI.rec||{}); UI.rec[el.dataset.v]=el.value; UI._rec=null; render(); }
  if(a==='findTeam'){UI.findTeam=el.value;render();}
  if(a==='findSort'){UI.findSort=el.value;render();}
  if(a==='lrfT'){UI.lrf=Object.assign({q:true,t:'all'},UI.lrf,{t:el.value});render();}
  if(a==='impFile'){ const f=el.files&&el.files[0]; if(f){ const r=new FileReader(); r.onload=()=>importText(String(r.result).trim()); r.readAsText(f); } }
  if(a==='blkWant'){ const p=G.players[+el.dataset.v]; if(p){p.lw=el.value; save(); render();} }
  if(a==='sAssign'){ const [r,k]=el.value.split(':'); assignScout(el.dataset.v,r,k); save(); render(); }
  if(a==='rosterTeam'){UI.rosterTeam=+el.value;render();window.scrollTo(0,0);}
  if(a==='lfSort'){UI.lf.sort=el.value;render();} });
document.addEventListener('input',e=>{ const el=e.target.closest('[data-a]'); if(!el)return;
  if(el.dataset.a==='offA')A.offA(el.dataset.v,el);
  if(el.dataset.a==='extA')A.extA(el.dataset.v,el);
  if(el.dataset.a==='mkt'){ const o=document.getElementById('mktv'); if(o)o.textContent=money(+el.value); } });
window.addEventListener('resize',()=>{ clearTimeout(window.__rz); window.__rz=setTimeout(()=>{ if(G)render(); },150); });
document.addEventListener('toggle',e=>{ const d=e.target; if(d&&d.matches&&d.matches('details[data-k]')){ UI.open[d.dataset.k]=d.open; if(d.open&&d.dataset.lazy==='1'){ const y=window.scrollY; render(); window.scrollTo(0,y); } } },true);
document.addEventListener('keydown',e=>{
  if(UI.cast&&UI.sheet==null){ if(e.key==='Escape'){ A.castClose(); return; } if(e.key===' '){ e.preventDefault(); A.castPlay(); return; } if(e.key==='ArrowRight'){ A.castStep('1'); return; } if(e.key==='ArrowLeft'){ A.castStep('-1'); return; } }
  if(e.key==='Escape'&&(UI.sheet!=null||UI.posSheet||UI.game!=null||UI.menu))closeSheets();
  if(UI.tab==='inbox'&&UI.sheet==null&&!UI.menu&&!UI.game&&!(e.target.matches&&e.target.matches('input,select,textarea'))&&(e.key==='j'||e.key==='k')){ e.preventDefault(); ibStep(e.key==='j'?1:-1); }
  if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('g.pos[data-a],.tcard[data-a]')){ e.preventDefault(); const a=e.target.dataset.a; A[a](e.target.dataset.v); }
});

G=load(); if(G){ try{migrateDraft();}catch(e){} } UI.title=true; UI.sstep='main';
let DL=null; try{ if(window.claude&&window.claude.use)window.claude.use('downloads').then(d=>{ DL=d; if(G&&UI.tab==='club')render(); }).catch(()=>{}); }catch(e){}
render();
