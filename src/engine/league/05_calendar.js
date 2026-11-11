/* ===== 날짜 ===== */
const D0=FrontOfficeCore.D0;
const dnum=FrontOfficeCore.dnum;
const dobj=FrontOfficeCore.dobj;
const WD=FrontOfficeCore.WD;
const dstr=FrontOfficeCore.dstr;
const dmd=FrontOfficeCore.dmd;
const dsh=FrontOfficeCore.dsh;
const onOrAfter=FrontOfficeCore.onOrAfter;
function shuffle(a){ for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
const KD=(m,d)=>dnum(G.year,m,d);
/* 시즌 주요 마감일(KBO 규정): 트레이드 7월 31일, 외국인 선수 등록·교체 8월 15일 */
const tradeDL=()=>KD(7,31), foreignDL=()=>KD(8,15);

/* ===== 시즌 일정: 3연전·2연전, 월요일 휴식, 올스타 휴식기 ===== */
/* 구단당 정규시즌 경기 수(구단 수에 따라) */
function seasonG(){ const n=typeof G!=='undefined'&&G&&G.teams?G.teams.length:10; return n<=10?144:n===11?140:132; }
function buildCalendar(y){
  const open=onOrAfter(y,3,25,6);
  const asg=onOrAfter(y,7,8,6);
  /* 시리즈 일정(KBO 방식, 사용자 11-11: 시리즈가 요일과 어긋나 2연전이 아무 때나 끼던 문제): 월요일 휴식, 3연전은 화~목·금~일, 2연전은 화·수/목·금/토·일.
     개막은 토·일 2연전, 2연전 주간은 주로 시즌 후반(올스타 뒤), 올스타 주간(화~일)은 쉰다. 시즌 중 임의 휴식일은 두지 않는다(우천 취소는 따로 재편성).
     구단 수에 따라(리그 확장): 10개 구단 상대별 16경기(144), 11개 구단 14경기(140, 라운드마다 한 구단 휴식), 12개 구단 12경기(132) */
  const NT=typeof G!=='undefined'&&G&&G.teams&&G.teams.length?G.teams.length:10, LEN=NT<=10?[3,3,3,3,2,2]:NT===11?[3,3,2,2,2,2]:[3,3,3,3];
  const T=NT%2?NT+1:NT; let arr=[...Array(T).keys()]; const rounds=[];
  for(let r=0;r<T-1;r++){ const pr=[]; for(let i=0;i<T/2;i++){ const x=arr[i], z=arr[T-1-i]; if(x<NT&&z<NT)pr.push([x,z]); } rounds.push(pr); arr=[arr[0],arr[T-1],...arr.slice(1,T-1)]; } /* 홀수면 가짜 구단(NT)과 짝지어진 구단이 그 라운드에 쉰다 */
  const n3=LEN.filter(x=>x===3).length*rounds.length, n2=LEN.filter(x=>x===2).length*rounds.length;
  /* 주 단위 틀: A=3연전 2개, B=2연전 3개. 개막 주말(토·일)은 2연전 하나 */
  const open2=n2>0?1:0; let s3=n3, s2=n2-open2; const nA=Math.floor(s3/2), nB=Math.floor(s2/3); const tail=[...(s3%2?[3]:[]),...Array(s2%3).fill(2)];
  const asgWk=asg-5; /* 올스타 토요일이 든 주의 화요일 */ const firstTue=open+3; /* 개막 토요일 다음 화요일 */
  let wkAfter=0; for(let w=firstTue;w<firstTue+7*60;w+=7){ if(w>asgWk)wkAfter++; if(w>dnum(y,10,10))break; }
  const plan=[]; const N=nA+nB; const bAfter=Math.min(nB,Math.max(0,wkAfter-2)); /* 2연전 주간은 올스타 뒤에 먼저 배치하고, 넘치면 앞쪽에 고르게 */
  for(let k=0;k<N;k++)plan.push('A'); { const pre=nB-bAfter; let placed=0; for(let k=0;k<pre;k++){ const at=Math.round((k+1)*(N-bAfter)/(pre+1)); plan[Math.min(at,N-1)]='B'; placed++; } for(let k=0;k<bAfter;k++)plan[N-1-k*Math.max(1,Math.floor(Math.min(N,wkAfter)/Math.max(1,bAfter)))]='B'; }
  { let cb=plan.filter(x=>x==='B').length; for(let k=N-1;k>=0&&cb<nB;k--)if(plan[k]==='A'){ plan[k]='B'; cb++; } for(let k=0;k<N&&cb>nB;k++)if(plan[k]==='B'){ plan[k]='A'; cb--; } }
  const slots=[]; /* {len, days[]} 시간순 */
  if(open2)slots.push({len:2,days:[open,open+1]});
  let w=firstTue; const take=pat=>{ let d=w; for(const len of pat){ slots.push({len,days:Array.from({length:len},(_,i)=>d+i)}); d+=len; } };
  for(const P of plan){ if(w<=asg&&asg<=w+5)w+=7; take(P==='A'?[3,3]:[2,2,2]); w+=7; }
  if(tail.length){ if(w<=asg&&asg<=w+5)w+=7; take(tail); }
  /* 라운드 배정: 같은 상대 시리즈가 연달아 오지 않게, 3연전·2연전 묶음별로 라운드를 나눠 쓴다. 홈·원정은 같은 라운드·길이가 나올 때마다 번갈아 */
  const pool={3:[],2:[]}; for(let r=0;r<rounds.length;r++)LEN.forEach(len=>pool[len].push(r)); shuffle(pool[3]); shuffle(pool[2]);
  const cnt={}; const sched={}; let l1=-1,l2=-1;
  for(const sl of slots){ const P=pool[sl.len]; let i=P.findIndex(r=>r!==l1&&r!==l2); if(i<0)i=P.findIndex(r=>r!==l1); if(i<0)i=0; const r=P.splice(i,1)[0]; const ck=r+':'+sl.len; const flip=(cnt[ck]=(cnt[ck]||0)+1)%2===0;
    for(const d of sl.days)sched[d]=rounds[r].map(([a,b])=>flip?[b,a]:[a,b]); l2=l1; l1=r; }
  const days=Object.keys(sched).map(Number).sort((a,b)=>a-b);
  return {y,open,asg,end:days[days.length-1],sched,draft:onOrAfter(y,9,14,3),camp:dnum(y,1,25),campEnd:dnum(y,3,5),exh:dnum(y,3,12)};
}
function period(){
  const c=G.cal, d=G.day;
  if(d<c.open)return 'pre'; if(d<=c.end)return 'season';
  if(G.ps&&!G.ps.done)return 'post'; return 'off';
}
const PERIOD={pre:'시즌 준비',season:'정규시즌',post:'포스트시즌',off:'스토브리그'};

