/* ===== 얼굴 (faces.js, Apache-2.0 · ZenGM) ===== */
const FACEC=new Map();
function seededRand(seed){ let h=2166136261>>>0; const s=String(seed); for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;} return ()=>{ h=Math.imul(h^(h>>>15),2246822507)>>>0; h=Math.imul(h^(h>>>13),3266489909)>>>0; h^=h>>>16; return (h>>>0)/4294967296; }; }
function hslHex(h,s,l){ s/=100;l/=100; const k=n=>(n+h/30)%12, a=s*Math.min(l,1-l); const f=n=>l-a*Math.max(-1,Math.min(k(n)-3,9-k(n),1)); return '#'+[f(0),f(8),f(4)].map(x=>Math.round(x*255).toString(16).padStart(2,'0')).join(''); }
const u01=(k,id)=>clamp((hn(k,id)+3)/6,0,.9999);
function raceOf(o){ if(o==='sec')return 'asian'; const nat=o.nat; if(!o.foreign||nat==='일본'||nat==='대만')return 'asian'; const u=u01('race',o.id);
  if(nat==='호주')return u<.8?'white':'brown'; if(nat==='미국')return u<.5?'white':u<.8?'black':'brown'; return u<.15?'white':u<.55?'brown':'black'; }
function moodMouth(m){ return m>=74?'smile':m>=62?'smile-closed':m>=46?null:m>=32?'straight':'angry'; }
const ageB=a=>a==null?0:a<=23?0:a<=29?1:a<=33?2:3;
function faceKey(o){ return o==='sec'?'sec':o.persona?'P:'+o.persona+':'+o.pid+':'+(o.team??'x')+':'+(o.expr||'')+(o.female?':f':'')+(o.mod?':'+JSON.stringify(o.mod):''):o.id+':'+(o.team??'x')+':'+(moodMouth(o.mor??60)||'n')+':'+ageB(o.age); }
function faceSVG(o){
  const key=faceKey(o); if(FACEC.has(key))return FACEC.get(key);
  let out='';
  try{ if(typeof window!=='undefined'&&window.FJS){
    const orig=Math.random; let f;
    const seed=o==='sec'?'sec':o.persona?(G&&G.obFace&&G.obFace[o.pid]!=null?G.obFace[o.pid]:'P'+o.pid):o.id; Math.random=seededRand('face'+seed);
    try{ f=window.FJS.generate(undefined,{race:o.persona?'asian':raceOf(o),gender:o==='sec'||o.female?'female':'male'}); } finally{ Math.random=orig; }
    if(o.persona){ const t=o.team!=null&&G.teams[o.team]?G.teams[o.team]:null; const rr=seededRand('pz'+o.pid); const tp=t?tpal(t):null; const dk=t?tp[2]:'#26313c', mid=t?tp[0]:'#4b5b6c';
      if(o.persona==='mgr'||o.persona==='coach'){ f.teamColors=[mid,mid,tp&&tp[1]!=='#ffffff'?tp[1]:'#f2f4f6']; f.jersey={id:t?['baseball','baseball2','baseball3','baseball4'][t.id%4]:'baseball'}; f.accessories={id:'hat'}; }
      else { f.accessories={id:'none'}; f.jersey={id:'jersey3'}; f.teamColors=o.persona==='doc'?['#e9eef2','#c9d3da','#7a8794']:o.persona==='own'?['#1d2733','#11161c','#c9a24a']:o.persona==='agent'?['#15191e','#0b0e11','#9aa6b2']:[dk,'#11161c',mid]; }
      if((o.age||45)>=52&&f.hair){ f.hair.color=['#8d8d8d','#a7a7a7','#6e6e6e'][Math.floor(rr()*3)]; }
      f.glasses={id:o.persona==='doc'||rr()<.22?'glasses2-black':'none'}; if(!o.female&&rr()<.5)f.facialHair={id:'none'};
      f.fatness=(f.fatness||.3)*.8; const m0=rr()<.5?'smile-closed':'closed'; f.mouth={id:o.expr==='smile'?'smile':o.expr==='angry'?'angry':o.expr==='flat'?'straight':m0,flip:false}; 
      /* 단장 얼굴 꾸미기: 고른 부위로 덮어쓴다 */
      const M=o.mod; if(M){ if(M.hair&&f.hair)f.hair.id=M.hair; if(M.hc&&f.hair)f.hair.color=M.hc; if(M.fh)f.facialHair={id:M.fh}; if(M.gl)f.glasses={id:M.gl}; if(M.mouth)f.mouth={id:M.mouth,flip:false}; if(M.eb)f.eyebrow={id:M.eb,rotation:(f.eyebrow&&f.eyebrow.rotation)||0}; } }
    else if(o==='sec'){ f.jersey={id:'jersey3'}; f.teamColors=['#4b5b6c','#e3e9ee','#2a3642']; f.accessories={id:'none'}; f.glasses={id:'none'}; }
    else {
      const t=o.team!=null&&G.teams[o.team]?G.teams[o.team]:null;
      f.teamColors=t?[tpal(t)[0],tpal(t)[0],tpal(t)[1]==='#ffffff'?'#f2f4f6':tpal(t)[1]]:o.schoolHue!=null?[hslHex(o.schoolHue,42,36),'#f2f4f6',hslHex(o.schoolHue,40,20)]:['#6b7785','#3a4652','#e3e9ee'];
      f.jersey={id:t?['baseball','baseball2','baseball3','baseball4'][t.id%4]:'baseball'};
      f.accessories={id:'hat'}; f.glasses={id:u01('gl',o.id)>.94?'glasses2-black':'none'};
      if(raceOf(o)==='asian'&&u01('fh',o.id)>.12)f.facialHair={id:'none'};
      f.fatness=(f.fatness||.3)*.55;
      const mm=moodMouth(o.mor??60); if(mm)f.mouth={id:mm,flip:false};
      /* 나이에 따라 얼굴이 변한다: 해가 갈수록 눈가·이마 주름이 생긴다 */
      const ab=ageB(o.age), ra=seededRand('age'+o.id);
      if(ab===0){ f.eyeLine={id:'none'}; f.smileLine={id:'none',size:1}; f.miscLine={id:ra()<.12?'freckles1':'none'}; }
      else if(ab===1){ f.eyeLine={id:ra()<.4?'line1':'none'}; f.smileLine={id:'none',size:1}; f.miscLine={id:'none'}; }
      else if(ab===2){ f.eyeLine={id:['line1','line2'][Math.floor(ra()*2)]}; f.smileLine={id:'line1',size:1}; f.miscLine={id:ra()<.35?'forehead1':'none'}; }
      else { f.eyeLine={id:['line3','line4','line5','line6'][Math.floor(ra()*4)]}; f.smileLine={id:['line2','line3','line4'][Math.floor(ra()*3)],size:1}; f.miscLine={id:['forehead2','forehead3','forehead4','chin1'][Math.floor(ra()*4)]}; f.fatness=Math.min(1,(f.fatness||.2)+.08); }
    }
    out='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(window.FJS.faceToSvgString(f));
  } }catch(err){ out=''; }
  FACEC.set(key,out); return out;
}
function offseasonMgr(){
  try{ obYear(); }catch(e){}
  if(G.coach)coachYear(); try{ gmTurnover(); }catch(e){} try{ mgrFireOff(); }catch(e){}
  for(const t of G.teams){ const m=G.mgr[t.id]; if(!m)continue; m.yrs--; if(m.age)m.age++;
    if(t.id!==ME()&&m.yrs<=0){ if((m.age||0)<70&&R()<.6)m.yrs=2; else { const n=(()=>{ try{ return obAiMgr(t.id); }catch(e){ return null; } })()||mkMgr(); n.yrs=n.yrs||ri(2,3); G.mgr[t.id]=n; n.clan=n.ob?[]:mkClan(n); if(G.coach&&G.coach[t.id])for(const c of n.clan){ c.yrs=n.yrs; G.coach[t.id][c.role]=c; } wire('감독',`${tname(t.id)}이(가) ${n.name} 감독을 새로 선임했습니다.`,{tid:t.id,x:{mid:n.id,hire:1}}); try{ news('리그',`${tshort(t.id)}, 새 감독에 ${n.name}`,`${tname(t.id)}이(가) 계약이 끝난 감독 대신 ${n.name} 감독(${n.yrs}년)을 선임했습니다.`,0); }catch(e){} } } }
  refreshMgrMarket();
  const m=G.mgr[G.user];
  if(m&&!m.interim&&m.yrs<=0) mail('운영팀','감독 계약이 끝납니다',`${m.name} 감독의 계약이 올해로 끝납니다. 재계약하거나 새 감독을 선임해야 합니다. 연말까지 정하지 않으면 감독 자리가 비게 됩니다.`,{imp:true,kind:'감독',acts:[{l:'2년 재계약',a:'renewMgr',v:'2'},{l:'감독 후보 보기',a:'goWork',v:'감독'}]});
}
function renewMgr(y){ const m=G.mgr[G.user]; if(!m||m.interim)return; m.yrs=+y; m.sal=round5(m.sal*1.1); addLog(`${m.name} 감독과 ${y}년 재계약했습니다(연 ${money(m.sal)}).`); }

/* ===== 인물 관계도: 구단주·사장·감독·코치·선수·타 구단 단장·팬·언론 ===== */
function nameH(k){ for(let i=0;i<9;i++){ const a=u01(k+'s'+i,7),b=u01(k+'a'+i,11),c=u01(k+'b'+i,13); const n=SUR[Math.floor(a*SUR.length)]+G1[Math.floor(b*G1.length)]+G2[Math.floor(c*G2.length)]; if(!BLOCK.has(n)&&n[1]!==n[2])return n; } return SUR[0]+'도윤'; }
const OWNTRAIT={win:'우승 트로피를 직접 들고 싶어 합니다. 성적이 나면 지갑을 엽니다.',profit:'숫자에 밝습니다. 적자 보고서를 가장 먼저 펼쳐 봅니다.',pr:'그룹 이미지와 관중석을 봅니다. 화제가 되는 구단을 원합니다.'};
function bossOf(tid){ G.boss=G.boss||{}; const k=tid??G.user; if(!G.boss[k]){ const s='boss'+k+':'+(team(k).code||k);
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

