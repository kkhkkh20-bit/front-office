/* ===== 얼굴 (faces.js, Apache-2.0 · ZenGM) ===== */
const FACEC=new Map();
function seededRand(seed){ let h=2166136261>>>0; const s=String(seed); for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;} return ()=>{ h=Math.imul(h^(h>>>15),2246822507)>>>0; h=Math.imul(h^(h>>>13),3266489909)>>>0; h^=h>>>16; return (h>>>0)/4294967296; }; }
function hslHex(h,s,l){ s/=100;l/=100; const k=n=>(n+h/30)%12, a=s*Math.min(l,1-l); const f=n=>l-a*Math.max(-1,Math.min(k(n)-3,9-k(n),1)); return '#'+[f(0),f(8),f(4)].map(x=>Math.round(x*255).toString(16).padStart(2,'0')).join(''); }
const u01=(k,id)=>clamp((hn(k,id)+3)/6,0,.9999);
function raceOf(o){ if(o==='sec')return 'asian'; const nat=o.nat; if(!o.foreign||nat==='일본'||nat==='대만')return 'asian'; const u=u01('race',o.id);
  if(nat==='호주')return u<.8?'white':'brown'; if(nat==='미국')return u<.5?'white':u<.8?'black':'brown'; return u<.15?'white':u<.55?'brown':'black'; }
function moodMouth(m){ return m>=74?'smile':m>=62?'smile-closed':m>=46?null:m>=32?'straight':'closed'; } /* 이를 드러낸 angry는 우스꽝스러워 처진 입으로 */
const ageB=a=>a==null?0:a<=23?0:a<=29?1:a<=33?2:3;
const ageP=a=>a==null?1:a<40?0:a<50?1:a<60?2:3; /* 단장·감독·코치 얼굴 나이 구간 */
const grayB=a=>a==null||a<35?0:Math.min(a,41)-34; /* 35세부터 해마다 흰머리 단계 */
function faceKey(o){ return o==='sec'?'sec':o.persona?'P:'+o.persona+':'+o.pid+':'+(o.team??'x')+':'+(o.expr||'')+(o.female?':f':'')+':a'+ageP(o.age)+(o.mod?':'+JSON.stringify(o.mod):''):o.id+':'+(o.team??'x')+':'+(moodMouth(o.mor??60)||'n')+':'+ageB(o.age)+':g'+grayB(o.age); }
/* 머리색을 회색 쪽으로 섞는다(k: 0~1) */
function grayMix(hex,k){ const m=/^#?([0-9a-f]{6})$/i.exec(hex||''); if(!m)return hex; const n=parseInt(m[1],16); const c=[n>>16&255,n>>8&255,n&255].map(v=>Math.round(v+(168-v)*k)); return '#'+c.map(v=>v.toString(16).padStart(2,'0')).join(''); }
/* 촌스러워 보이는 부위(왕눈·주먹코·이 드러난 입·굵은 눈썹)를 자연스러운 모양으로 바꾸고 크기를 줄인다(같은 사람은 늘 같은 결과) */
const FACE_SWAP={eye:[['eye1','eye3','eye5','eye8','eye10'],['eye12','eye13','eye14','eye15','eye16','eye17','eye18','eye19','eye2','eye6','eye9','eye4']],
  nose:[['honker','nose12','nose13','nose6','nose5','pinocchio'],['nose10','nose14','nose7','nose8','nose9','nose2','nose4','small','nose11']],
  mouth:[['angry','mouth','mouth7','mouth8','smile2','smile4'],['smile-closed','closed','straight','mouth3','mouth2','smile-closed']],
  eyebrow:[['eyebrow6','eyebrow7','eyebrow8','eyebrow10'],['eyebrow1','eyebrow2','eyebrow3','eyebrow4','eyebrow5','eyebrow11','eyebrow13','eyebrow15']]};
function faceTone(f,rr){ for(const k in FACE_SWAP){ const [bad,ok]=FACE_SWAP[k], x=rr(); if(f[k]&&bad.includes(f[k].id))f[k].id=ok[Math.floor(x*ok.length)]; }
  if(f.ear)f.ear.size=.6+((f.ear.size||1)-.5)*.35; if(f.nose)f.nose.size=Math.min(1,f.nose.size||1); if(f.eye)f.eye.angle=clamp(f.eye.angle||0,-4,8); if(f.eyebrow)f.eyebrow.angle=clamp(f.eyebrow.angle||0,-6,8);
  if(f.smileLine)f.smileLine.size=Math.min(1.1,f.smileLine.size||1); if(f.head&&f.head.shave)f.head.shave=f.head.shave.replace(/[\d.]+\)$/,m=>Math.min(parseFloat(m),.05)+')'); }
/* 단장·구단주·직원은 농구 민소매(jersey3) 대신 정장: 셔츠 깃·넥타이·재킷을 유니폼 자리에 그린다(머리·귀보다 아래 층) */
const SUIT_MARK='#010203';
function suitSVG(jk,tie,female){ const sh='#f3f5f7';
  return `<g stroke="#000" stroke-linejoin="round"><path fill="${jk}" stroke-width="6" d="M-5 610s0-55 30-72c30-17 80-22 112-44l63 116 63-116c32 22 82 27 112 44 30 17 30 72 30 72z"/>`
   +`<path fill="${sh}" stroke-width="4" d="M138 492 200 612 262 492c-20-10-42-14-62-14s-42 4-62 14z"/>`
   +(female?`<path fill="none" stroke-width="3" d="M168 500 200 548 232 500"/>`:`<path fill="${tie}" stroke-width="4" d="M190 516h20l-3 14 11 82h-36l11-82z"/><path fill="${tie}" stroke-width="4" d="M188 503h24l-4 15h-16z"/>`)
   +`<path fill="${sh}" stroke-width="4" d="M140 490 186 503 170 538zM260 490 214 503 230 538z"/>`
   +`<path fill="${jk}" stroke-width="5" d="M132 494l38 58-12 8 42 52-60-60 10-10-34-44zM268 494l-38 58 12 8-42 52 60-60-10-10 34-44z"/></g>`; }
function suitSwap(svg,jk,tie,female){ const L=svg.split('\n'); let i=L.findIndex(l=>l.includes(SUIT_MARK)); if(i<0)return svg;
  while(i>0&&!/^<g[ >]/.test(L[i]))i--; let d=0,j=i; for(;j<L.length;j++){ if(/^<g[ >]/.test(L[j]))d++; else if(L[j]==='</g>'&&--d===0)break; }
  L.splice(i,j-i+1,suitSVG(jk,tie,female)); return L.join('\n'); }
/* 큰 얼굴 자리용 흉상: 같은 그림을 더 넓게 잡아 가슴(칼라·단추·넥타이)까지 보인다 */
function faceBust(src){ if(src&&typeof F6B!=='undefined'&&F6B.has(src)){ const u=face6Bust(F6B.get(src)); if(u)return u; } /* 실사 얼굴: 큰 자리는 가슴까지 */ return src&&src.replace('-30%2070%20460%20460','-65%2075%20530%20530'); }
/* 사용자가 직접 넣은 사진(G.cimg): 선수는 p:id, 인물(감독·코치·단장·구단주·직원)은 P:역할:pid */
function cimgKey(o){ if(!o||o==='sec')return null; return o.persona?'P:'+o.persona+':'+o.pid:o.id!=null?'p:'+o.id:null; }
function faceSVG(o){ { const k=cimgKey(o); if(k&&typeof G!=='undefined'&&G&&G.cimg&&G.cimg[k])return G.cimg[k]; }
  if(typeof face6Src==='function'&&o&&o.id!=null&&!o.persona){ const ph=face6Src(o); if(ph)return ph; }
  if(typeof face7Src==='function'&&o&&o.persona){ const ph=face7Src(o); if(ph)return ph; } /* 감독·코치·단장·구단주·직원: v7 실사 얼굴 시범 */ /* 우리 구단 선수: v6b 실사 얼굴 시범(77_assets_ui.js) */
  const key=faceKey(o); if(FACEC.has(key))return FACEC.get(key);
  let out='';
  try{ if(typeof window!=='undefined'&&window.FJS){
    const orig=Math.random; let f;
    const seed=o==='sec'?'sec':o.persona?(G&&G.obFace&&G.obFace[o.pid]!=null?G.obFace[o.pid]:'P'+o.pid):o.id; Math.random=seededRand('face'+seed);
    try{ f=window.FJS.generate(undefined,{race:o.persona?'asian':raceOf(o),gender:o==='sec'||o.female?'female':'male'}); } finally{ Math.random=orig; }
    faceTone(f,seededRand('tone'+seed)); let suit=null;
    if(o.persona){ const t=o.team!=null&&G.teams[o.team]?G.teams[o.team]:null; const rr=seededRand('pz'+o.pid); const tp=t?tpal(t):null; const dk=t?tp[2]:'#26313c', mid=t?tp[0]:'#4b5b6c';
      if(o.persona==='mgr'||o.persona==='coach'){ f.teamColors=[mid,mid,tp&&tp[1]!=='#ffffff'?tp[1]:'#f2f4f6']; f.jersey={id:t?['baseball','baseball2','baseball3','baseball4'][t.id%4]:'baseball'}; f.accessories={id:'hat'}; }
      else { f.accessories={id:'none'}; f.jersey={id:'jersey'}; f.teamColors=[SUIT_MARK,SUIT_MARK,SUIT_MARK]; /* 재킷·넥타이: 구단주 남색·금색, 에이전트 검정, 팀 닥터 흰 가운, 단장·직원은 짙은 회색에 구단 색 넥타이 */
        suit=o.persona==='doc'?['#e9eef2','#2f4a63']:o.persona==='own'?['#1b2533','#c9a24a']:o.persona==='agent'?['#16191d','#7d8a97']:['#2b323a',mid]; }
      if((o.age||45)>=52&&f.hair){ const rg=seededRand('pg'+o.pid); f.hair.color=['#8d8d8d','#a7a7a7','#6e6e6e'][Math.floor(rg()*3)]; } /* 따로 뽑아야 나이가 들어도 안경·수염이 바뀌지 않는다 */
      f.glasses={id:o.persona==='doc'||rr()<.22?'glasses2-black':'none'}; if(!o.female&&rr()<.5)f.facialHair={id:'none'};
      /* 단장·직원은 40~60대 사무직: 머리는 단정한 짧은 머리, 수염은 얇은 콧수염·턱수염 정도만 */
      if(!o.female&&o.persona!=='mgr'&&o.persona!=='coach'&&f.hair&&!['short','short2','short3','crop','crop-fade','crop-fade2','short-fade','middle-part','parted','short-bald','bald'].includes(f.hair.id)){ f.hair.id=['short','short2','crop','middle-part','parted','short-fade'][Math.floor(rr()*6)]; }
      if(!o.female&&f.facialHair&&f.facialHair.id!=='none')f.facialHair={id:['none','mustache-thin','goatee-thin','none'][Math.floor(rr()*4)]};
      f.fatness=(f.fatness||.3)*.5; const m0=rr()<.5?'smile-closed':'closed'; f.mouth={id:o.expr==='smile'?'smile':o.expr==='angry'?'closed':o.expr==='flat'?'straight':m0,flip:false}; 
      /* 나이 들수록 주름: 40대 눈가, 50대 팔자·이마, 60대 이상 더 깊게(사람마다 정해진 모양) */
      { const ap=ageP(o.age), ra=seededRand('pa'+o.pid);
        if(ap===0){ f.eyeLine={id:'none'}; f.smileLine={id:'none',size:1}; f.miscLine={id:'none'}; }
        else if(ap===1){ f.eyeLine={id:ra()<.6?'line1':'none'}; f.smileLine={id:ra()<.3?'line1':'none',size:1}; f.miscLine={id:'none'}; }
        else if(ap===2){ f.eyeLine={id:['line1','line2','line3'][Math.floor(ra()*3)]}; f.smileLine={id:['line1','line2'][Math.floor(ra()*2)],size:1}; f.miscLine={id:ra()<.5?'forehead1':'none'}; }
        else { f.eyeLine={id:['line3','line4','line5','line6'][Math.floor(ra()*4)]}; f.smileLine={id:['line2','line3','line4'][Math.floor(ra()*3)],size:1}; f.miscLine={id:['forehead2','forehead3','forehead4','chin1'][Math.floor(ra()*4)]}; } }
      /* 단장 얼굴 꾸미기: 고른 부위로 덮어쓴다 */
      const M=o.mod; if(M){ if(M.hair&&f.hair)f.hair.id=M.hair; if(M.hc&&f.hair)f.hair.color=M.hc; if(M.fh)f.facialHair={id:M.fh}; if(M.gl)f.glasses={id:M.gl}; if(M.mouth)f.mouth={id:M.mouth,flip:false}; if(M.eb)f.eyebrow={id:M.eb,rotation:(f.eyebrow&&f.eyebrow.rotation)||0}; } }
    else if(o==='sec'){ f.jersey={id:'jersey'}; f.teamColors=[SUIT_MARK,SUIT_MARK,SUIT_MARK]; suit=['#4b5b6c','#2a3642']; f.accessories={id:'none'}; f.glasses={id:'none'}; }
    else {
      const t=o.team!=null&&G.teams[o.team]?G.teams[o.team]:null;
      f.teamColors=t?[tpal(t)[0],tpal(t)[0],tpal(t)[1]==='#ffffff'?'#f2f4f6':tpal(t)[1]]:o.schoolHue!=null?[hslHex(o.schoolHue,42,36),'#f2f4f6',hslHex(o.schoolHue,40,20)]:['#6b7785','#3a4652','#e3e9ee'];
      f.jersey={id:t?['baseball','baseball2','baseball3','baseball4'][t.id%4]:'baseball'};
      f.accessories={id:'hat'}; f.glasses={id:u01('gl',o.id)>.94?'glasses2-black':'none'};
      if(raceOf(o)==='asian'&&u01('fh',o.id)>.12)f.facialHair={id:'none'};
      f.fatness=(f.fatness||.3)*.45;
      const mm=moodMouth(o.mor??60); if(mm)f.mouth={id:mm,flip:false};
      /* 나이에 따라 얼굴이 변한다: 해가 갈수록 눈가·이마 주름이 생긴다 */
      const ab=ageB(o.age), ra=seededRand('age'+o.id);
      /* 35세부터 흰머리: 선수마다 잘 세는 정도가 다르다(절반쯤은 거의 안 셈) */
      { const gb=grayB(o.age); const gp=u01('gray',o.id); if(gb&&gp>.45&&f.hair&&f.hair.color)f.hair.color=grayMix(f.hair.color,Math.min(.75,gb*.12*(gp+.4))); }
      if(ab===0){ f.eyeLine={id:'none'}; f.smileLine={id:'none',size:1}; f.miscLine={id:ra()<.12?'freckles1':'none'}; }
      else if(ab===1){ f.eyeLine={id:ra()<.4?'line1':'none'}; f.smileLine={id:'none',size:1}; f.miscLine={id:'none'}; }
      else if(ab===2){ f.eyeLine={id:['line1','line2'][Math.floor(ra()*2)]}; f.smileLine={id:'line1',size:1}; f.miscLine={id:ra()<.35?'forehead1':'none'}; }
      else { f.eyeLine={id:['line3','line4','line5','line6'][Math.floor(ra()*4)]}; f.smileLine={id:['line2','line3','line4'][Math.floor(ra()*3)],size:1}; f.miscLine={id:['forehead2','forehead3','forehead4','chin1'][Math.floor(ra()*4)]}; f.fatness=Math.min(1,(f.fatness||.2)+.08); }
    }
    let svg=window.FJS.faceToSvgString(f); if(suit)svg=suitSwap(svg,suit[0],suit[1],o==='sec'||!!o.female);
    out='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
  } }catch(err){ out=''; }
  FACEC.set(key,out); return out;
}
function offseasonMgr(){
  try{ obYear(); }catch(e){}
  if(G.coach)coachYear(); try{ gmTurnover(); }catch(e){} try{ mgrFireOff(); }catch(e){}
  for(const t of G.teams){ const m=G.mgr[t.id]; if(!m)continue; if(m.age)m.age++; if(m.cs!=null&&m.cs>G.year)continue; /* 시즌이 끝난 뒤 맺은 계약은 다음 시즌부터 센다 */ m.yrs--;
    if(t.id!==ME()&&m.yrs<=0){ if((m.age||0)<70&&R()<.6)staffCt(m,2,G.year+1); else { const n=(()=>{ try{ return obAiMgr(t.id); }catch(e){ return null; } })()||(()=>{ try{ return aiMgrHire(t); }catch(e){ return mkMgr(); } })(); /* 선수단에 맞는 감독을 고른다(86_ai_plan) */ staffCt(n,n.yrs||ri(2,3),G.year+1); G.mgr[t.id]=n; n.clan=n.ob?[]:mkClan(n); if(G.coach&&G.coach[t.id])for(const c of n.clan){ staffCt(c,n.yrs,G.year+1); G.coach[t.id][c.role]=c; } wire('감독',`${tname(t.id)}이(가) ${n.name} 감독을 새로 선임했습니다.`,{tid:t.id,x:{mid:n.id,hire:1}}); try{ news('리그',`${tshort(t.id)}, 새 감독에 ${n.name}`,`${tname(t.id)}이(가) 계약이 끝난 감독 대신 ${n.name} 감독(${n.yrs}년)을 선임했습니다.`,0); }catch(e){} } } }
  refreshMgrMarket();
  const m=G.mgr[G.user];
  if(m&&!m.interim&&m.yrs<=0) mail('운영팀','감독 계약이 끝납니다',`${m.name} 감독의 계약이 올해로 끝납니다. 재계약하거나 새 감독을 선임해야 합니다. 연말까지 정하지 않으면 감독 자리가 비게 됩니다.`,{imp:true,kind:'감독',acts:[{l:'2년 재계약',a:'renewMgr',v:'2:'+G.user+':'+m.id},{l:'감독 후보 보기',a:'goWork',v:'감독'}]});
}
/* 감독 중도 재계약: 계약 중 언제든 1~3년 연장(남은 계약 합계 최대 5년), 한 해 한 번. 감독은 명성·성적·관계를 보고 연봉 인상을 요구한다.
   관계 30 미만이면 응하지 않는다. 연장하면 감독은 안정감에 관계 +5, 대신 경질할 때 정산금(남은 연봉)이 커진다 */
function mgrExtTerms(add){ const m=G.mgr[G.user]; if(!m||m.interim)return null; mgrFix(m); const per=period(); const r=G.sea&&G.sea.rec&&G.sea.rec[G.user]; const rk=(per==='season'||per==='post')&&r&&r.w+r.l>=20?uRank():null;
  const up=Math.max(.02,.04*add+(m.fame>=70?.06:0)+(rk!=null&&rk<=3?.05:0)-(rk!=null&&rk>=8?.03:0)+(m.rel<50?.04:0)); const sal=round5(m.sal*(1+up)); const yrs=Math.max(0,m.yrs)+add; let why='';
  if(m.extY===G.year)why=`${m.name} 감독과는 올해 이미 계약을 손봤습니다. 다음 해에 다시 이야기할 수 있습니다.`; else if(yrs>5)why='감독 계약은 남은 기간 합계 최대 5년까지입니다.'; else if(m.rel<30)why=`${m.name} 감독이 "지금은 계약 이야기를 할 때가 아닙니다"라며 응하지 않습니다(관계 ${Math.round(m.rel)}).`;
  return {m,add,sal,yrs,why,up,rk,sev0:mgrSevPay(m).pay,sev1:mgrSevPay(Object.assign({},m,{sal,yrs})).pay}; } /* 정산금은 실제 경질과 같은 계산(mgrSevPay) */
function extendMgr(add){ if(G.unemp)return '구단을 맡고 있지 않습니다.'; const T=mgrExtTerms(+add); if(!T)return '감독이 없습니다.'; if(T.why)return T.why; const m=T.m; const re=m.yrs<=0;
  staffCtExtend(m,T.add); m.sal=T.sal; m.extY=G.year; m.rel=clamp(m.rel+5,0,100); addLog(`${m.name} 감독과 ${T.add}년 ${re?'재계약':'연장 계약'}했습니다(연 ${money(m.sal)}, 계약 ${m.yrs}년 남음).`); try{ chron('mgr',`${m.name} 감독과 ${T.add}년 ${re?'재계약':'연장'}(연 ${money(m.sal)})`); }catch(e){} return ''; }
function renewMgr(y,tid,mid){ if(G.unemp)return '구단을 맡고 있지 않습니다.'; const m=G.mgr[G.user]; if(!m||m.interim)return; if((tid!=null&&+tid!==G.user)||(mid!=null&&mid!==m.id))return '이 재계약 요청은 현재 구단·감독의 요청이 아닙니다.'; if(m.yrs>0)return `${m.name} 감독과는 이미 계약 기간이 남아 있습니다(${m.yrs}년).`; /* 이미 처리한 재계약 제안을 다시 눌러도 연봉이 또 오르지 않게 */ staffCt(m,+y); m.sal=round5(m.sal*1.1); addLog(`${m.name} 감독과 ${y}년 재계약했습니다(연 ${money(m.sal)}).`); }

/* ===== 인물 관계도: 구단주·사장·감독·코치·선수·타 구단 단장·팬·언론 ===== */
function nameH(k){ for(let i=0;i<9;i++){ const a=u01(k+'s'+i,7),b=u01(k+'a'+i,11),c=u01(k+'b'+i,13); const n=surAt(a)+G1[Math.floor(b*G1.length)]+G2[Math.floor(c*G2.length)]; if(!BLOCK.has(n)&&n[1]!==n[2])return n; } return SUR[0]+'도윤'; }
const OWNTRAIT={win:'우승 트로피를 직접 들고 싶어 합니다. 성적이 나면 지갑을 엽니다.',profit:'숫자에 밝습니다. 적자 보고서를 가장 먼저 펼쳐 봅니다.',pr:'그룹 이미지와 관중석을 봅니다. 화제가 되는 구단을 원합니다.'};
function bossOf(tid){ G.boss=G.boss||{}; const k=tid??G.user; if(!G.boss[k]){ const s='boss'+k+':'+(team(k).code||k)+(team(k).bseed?':'+team(k).bseed:'');
    G.boss[k]={own:{name:nameH(s+'o'),age:58+Math.floor(u01(s,'oa')*18),id:'own'+k},ceo:{name:nameH(s+'c'),age:52+Math.floor(u01(s,'ca')*12),id:'ceo'+k,car:['그룹 전략실 출신','재무 담당 임원 출신','마케팅 임원 출신','계열사 대표 출신'][Math.floor(u01(s,'cc')*4)]}}; }
  return G.boss[k]; }
/* 단장별 월 협상 횟수: 친분이 높으면 1회 더, 낮으면 1회 덜 */
function negCap(tid){ const r=team(tid).rel; return NEG_MONTH+(r>=70?1:0)-(r<30?1:0); }
/* 주간 관계 스냅샷: 최근 4주 변화 표시용 */
function relSnap(){ prInit(); const m=G.mgr[G.user]; const s={d:G.day,own:team(G.user).trust,mgr:m?m.rel:null,fan:Math.round(G.pr.fan),press:Math.round(G.pr.press),gm:G.teams.map(t=>t.rel)};
  G.relHist=G.relHist||[]; G.relHist.push(s); if(G.relHist.length>10)G.relHist.shift(); }
function relNow(k){ prInit(); if(k==='own')return team(G.user).trust; if(k==='mgr'){ const m=G.mgr[G.user]; return m?m.rel:null; } if(k==='fan')return Math.round(G.pr.fan); if(k==='press')return Math.round(G.pr.press); if(k.startsWith('gm:'))return team(+k.slice(3)).rel; return null; }
function relDelta(k){ const H=G.relHist||[]; if(!H.length)return 0; const base=H.find(s=>s.d>=G.day-30)||H[H.length-1]; const now=relNow(k); if(now==null)return 0;
  const was=k.startsWith('gm:')?base.gm[+k.slice(3)]:base[k]; return was==null?0:Math.round(now-was); }

/* 구단 선택 화면용 미리보기: 예상 순위와 팀 특징 */
function worldPreview(){ const H=G.history[G.history.length-1]; const st=H.order; const n=G.teams.length;
  return G.teams.map(t=>{ const rk=slotRanks(t.id); const ps=playersOf(t.id).filter(p=>!p.ys); const dom=ps.filter(p=>!p.foreign);
    const sl=PSLOTS.map(k=>({k,r:rk[k].rank})).sort((a,b)=>a.r-b.r);
    const top=[...dom].sort((a,b)=>ovr(b)-ovr(a)).slice(0,2).map(p=>({id:p.id,name:p.name,pos:posLabel(p),o:Math.round(ovr(p)),age:p.age}));
    const rec=st.find(x=>x.tid===t.id); const ci=capInfo(t.id); const ageAvg=avg(dom.map(p=>p.age));
    const young=dom.filter(p=>p.age<=24&&ovr(p)>=45).length; const vets=dom.filter(p=>p.age>=33&&ovr(p)>=50).length; const faSoon=dom.filter(p=>p.svc>=FA_SVC-1&&!p.faC&&ovr(p)>=52).length;
    const pr=G.proj.indexOf(t.id)+1;
    return {tid:t.id,proj:pr,prev:st.findIndex(x=>x.tid===t.id)+1,w:rec?rec.w:0,l:rec?rec.l:0,expW:t.expW,owner:t.owner,indie:!!t.indie,market:t.market,
      best:sl.slice(0,2).map(x=>[x.k,x.r]),worst:sl.slice(-2).reverse().map(x=>[x.k,x.r]),top,age:+ageAvg.toFixed(1),young,vets,faSoon,pay:ci.pay,cap:ci.cap,cash:t.cash,
      mode:pr<=3?'우승 후보':pr<=6?'중위권':'하위권'}; }); }

