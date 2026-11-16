/* ===== 드래프트 예상: 소문과 확률 (스카우트 1단계, 사용자 결정 11-17) =====
   예전 '예상 지명'은 AI의 실제 지명 함수(aiDraftChoose)를 돌려 거의 정답을 보여 줬다. 이제는 그 구단이 정당하게 아는 것만 쓴다.
   - 재료: 우리 평가(스카우트 보고서·신뢰도), 공개 정보(언론 순위·공개 아마 성적 amDraftAdj), 각 구단 로스터로 짐작한 자리 필요(draftNeed),
     구단 운영 방향(우승 도전·재건, 공개), 소문(그 구단 관심 명단에서 흘러나온 이름. 우리 정보망이 좋을수록 맞는 소문이 많다).
   - 방법: 후보의 '진짜 값'을 우리 평가와 언론 평가를 신뢰도만큼 섞어 뽑고, 다른 구단마다 제 눈의 오차를 더해 앞 순번부터 고르게 하는 모의를 240번 돌린다.
     우리 차례에는 우리 보드(관심 목록 순서, 없으면 스카우트 순위) 1순위를 고른다. 남은 횟수가 곧 '우리 차례까지 남을 확률'이다.
   - AI 구단의 숨은 평가(aiDraftScore·aiDraftChoose)는 읽지 않는다. 다른 구단(tid)도 같은 함수로 자기 평가를 넣어 쓸 수 있다. */
const DO_N=240, DO_PUB_SD=8, DO_CLUB_SD=6, DO_RUM_B=2.5;
/* 그 구단이 보는 후보 값과 오차: 우리는 스카우트 보고서, AI는 자기 추정(aiDraftEst) */
function doOwn(tid,p){ if(tid===G.user){ const rp=scoutReport(p); return {v:rp.ofp??(rp.cur+4),sd:rp.ofp==null?11:Math.sqrt(clamp(rp.sd||6,2,10)**2+9),cur:rp.cur}; } /* 스카우트 버릇·인상 오차(약 3)는 확신도에 안 보이므로 더한다 */ const e=aiDraftEst(tid,p); return {v:e.v,sd:clamp(e.sd,2,10),cur:ovr(p)}; }
/* 언론 순위를 잠재력 척도로(1위 60 안팎, 10위 48, 30위 43, 100위 37) */
const doPress=p=>p.press?60-5*Math.log(p.press):36;
/* 소문: 한 주에 한 번 새로 돈다. 구단마다 1~2개. 맞을 확률 q = 그 구단 연고 권역 정보망과 그 지역 프로 담당 스카우트 */
function draftRumors(tid){ tid=tid??G.user; const wk=Math.floor(G.day/7); const live=G.draft&&!G.draft.done; const pool=((live?G.draft.cls:G.draftClass)||[]).map(id=>G.players[id]).filter(p=>p&&p.prospect&&!p.ovsRet);
  if(pool.length<10)return []; const top=[...pool].sort((a,b)=>(a.press||999)-(b.press||999)).slice(0,30); const out=[];
  for(const t of G.teams){ const c=t.id; if(c===tid)continue; const rr=seededRand('rum:'+G.year+':'+wk+':'+tid+':'+c);
    const pro=tid===G.user?!!coverOf(c).sc:true; const q=clamp(.3+areaNet(tid,teamArea(c))/200+(pro?.15:0),.3,.85);
    const fw=amFollowL(c).filter(id=>typeof id==='number'&&pool.some(p=>p.id===id)).slice(0,5); const k=rr()<.5?2:1;
    for(let i=0;i<k;i++){ const truth=fw.length&&rr()<q; const id=truth?fw[Math.floor(rr()*fw.length)]:top[Math.floor(rr()*top.length)].id; if(out.some(x=>x.tid===c&&x.id===id))continue; out.push({tid:c,id,q:Math.round(q*100)/100}); } }
  return out; }
const doRelL=q=>q>=.65?'믿을 만한 소문':q>=.5?'반쯤 믿을 소문':'흘려들을 소문';
let _doc=null; /* 저장하지 않는 계산 캐시 */
/* 앞으로 남은 지명 순번(우리 차례 두 번째까지) */
function doPicks(tid){ const d=G.draft, live=d&&!d.done; const L=live?d.picks.slice(d.cur):(draftPlan()||[]); const out=[]; let mine=0; for(const k of L){ out.push(k); if(k.tid===tid&&++mine>=2)break; } return out; }
function draftOdds(tid){ tid=tid??G.user; const d=G.draft, live=d&&!d.done; const pool=((live?d.cls:G.draftClass)||[]).map(id=>G.players[id]).filter(p=>p&&p.prospect&&!p.ovsRet);
  const picks=doPicks(tid); const key=JSON.stringify([tid,G.year,G.day,live?d.cur:-1,pool.length,(G.shortlist||[]).join(','),(G.scouts||[]).map(s=>s.id+s.region+s.skill).join(','),pool.reduce((a,p)=>a+obsCount(p,tid),0)]);
  if(_doc&&_doc.g===G&&_doc.k===key)return _doc.r;
  const own=new Map(pool.map(p=>[p.id,doOwn(tid,p)])); const rum=draftRumors(tid); const RB={}; for(const r of rum)RB[r.tid+':'+r.id]=DO_RUM_B*r.q;
  const base=pool.map(p=>{ const o=own.get(p.id), w1=1/(o.sd*o.sd), w2=1/(DO_PUB_SD*DO_PUB_SD); const m=(o.v*w1+doPress(p)*w2)/(w1+w2); return {p,m,s:Math.sqrt(1/(w1+w2)),cur:o.cur??40,adj:amDraftAdj(p),g:dGrp(p)}; });
  const clubs=[...new Set(picks.map(k=>k.tid))]; const need={}, cw={}; for(const c of clubs){ need[c]=draftNeed(c); const t=team(c); cw[c]=t.mode==='contend'?.5:.25; } /* 자리 필요는 각 구단 로스터(공개)로, 성향은 운영 방향(공개)으로 */
  const board=(G.shortlist||[]).filter(id=>pool.some(p=>p.id===id)); const ourV=new Map(pool.map(p=>{ const rp=scoutReport(p); return [p.id,draftVal(rp,p)]; }));
  const rr=seededRand('dodds:'+G.year+':'+G.day+':'+tid+':'+(live?d.cur:-1)); const gn=()=>{ let u=0; while(!u)u=rr(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*rr()); };
  const P={}; for(const p of pool)P[p.id]={av:0,av2:0,by:{},r1:0};
  const myIdx=picks.map((k,i)=>k.tid===tid?i:-1).filter(i=>i>=0); const slot=picks.map(()=>({}));
  for(let n=0;n<DO_N;n++){ const T=new Map(base.map(b=>[b.p.id,b.m+gn()*b.s])); const left=new Set(pool.map(p=>p.id));
    for(let i=0;i<picks.length;i++){ const k=picks[i]; if(i===myIdx[0])for(const id of left)P[id].av++; if(i===myIdx[1])for(const id of left)P[id].av2++;
      let best=null,bs=-1e9;
      if(k.tid===tid){ best=board.find(id=>left.has(id))??[...left].sort((a,b)=>ourV.get(b)-ourV.get(a))[0]; }
      else for(const b of base){ if(!left.has(b.p.id))continue; const v=T.get(b.p.id)+gn()*DO_CLUB_SD+(b.cur-35)*cw[k.tid]+(need[k.tid][b.g]||0)+b.adj+(RB[k.tid+':'+b.p.id]||0); if(v>bs){ bs=v; best=b.p.id; } }
      if(best==null)break; left.delete(best); if(k.tid!==tid){ const o=P[best].by; o[k.tid]=(o[k.tid]||0)+1; if(k.rd===1)P[best].r1++; } slot[i][best]=(slot[i][best]||0)+1; } }
  for(const id in P){ const o=P[id]; o.av/=DO_N; o.av2/=DO_N; o.r1/=DO_N; const b=Object.entries(o.by).sort((a,b)=>b[1]-a[1])[0]; o.top=b?{tid:+b[0],s:b[1]/DO_N}:null; delete o.by; }
  const r={at:G.day,tid,live,pick:myIdx.length?picks[myIdx[0]]:null,pick2:myIdx.length>1?picks[myIdx[1]]:null,picks,slot:slot.map(o=>Object.entries(o).sort((a,b)=>b[1]-a[1])[0]).map(x=>x?{id:+x[0],s:x[1]/DO_N}:null),P,rum};
  _doc={g:G,k:key,r}; return r; }
/* '1라운드에 남을 확률 40%' 같은 말 */
const doPct=v=>v>=.995?'99%':v<=.005?'1% 미만':Math.round(v*100)+'%';
/* 예전 모의 지명 자리(드래프트 센터): 순번마다 가장 자주 나온 이름(확률 표시용). 우리 다음 차례까지 */
function mockDraft(n){ const O=draftOdds(G.user); const out=[]; const used=new Set(); for(let i=0;i<O.picks.length&&out.length<(n||12);i++){ const k=O.picks[i]; if(O.live&&k.tid===G.user)break; if(!O.live&&k.rd>1)break; const s=O.slot[i]; if(!s||used.has(s.id))continue; used.add(s.id); out.push({pk:k,id:s.id,mine:k.tid===G.user,s:s.s}); } return out; }
/* 보정 측정: 드래프트 시작 때 우리 첫 순번에 남을 확률을 남기고, 끝나면 실제와 견준다(브라이어 점수·구간별 적중) */
function draftOddsSnap(){ try{ if(G.unemp)return; const O=draftOdds(G.user); if(!O.pick)return; const top=Object.entries(O.P).filter(([,v])=>v.av>.02&&v.av<.98).map(([id,v])=>[+id,Math.round(v.av*1000)/1000]); G.dOddsS={y:G.year,no:O.pick.no,rd:O.pick.rd,L:top}; }catch(e){} }
function draftOddsCal(){ const S=G.dOddsS, d=G.draft; if(!S||!d||S.y!==(d.y||G.year))return null; const i0=d.picks.findIndex(k=>k.rd===S.rd&&k.no===S.no); if(i0<0)return null;
  const R=S.L.map(([id,p])=>{ const j=d.picks.findIndex(k=>k.pid===id); return {p,o:j<0||j>=i0?1:0}; }); if(!R.length)return null;
  const br=R.reduce((a,x)=>a+(x.p-x.o)**2,0)/R.length; const bins=[[0,.2],[.2,.4],[.4,.6],[.6,.8],[.8,1.01]].map(([a,b])=>{ const L=R.filter(x=>x.p>=a&&x.p<b); return {a,b,n:L.length,p:L.length?L.reduce((s,x)=>s+x.p,0)/L.length:null,o:L.length?L.reduce((s,x)=>s+x.o,0)/L.length:null}; });
  const c={y:S.y,n:R.length,brier:Math.round(br*1000)/1000,bins}; G.dOddsC=c; delete G.dOddsS; return c; }
