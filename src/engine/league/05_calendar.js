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
  const brk=new Set([asg-2,asg-1,asg,asg+1]);
  const rest=new Set(); while(rest.size<9){ const n=ri(open+10,dnum(y,9,5)); if(dobj(n).w!==1&&!brk.has(n))rest.add(n); }
  /* 구단 수에 따라(리그 확장, 88_league_expansion): 10개 구단 상대별 16경기(144), 11개 구단 14경기(140, 라운드마다 한 구단 휴식), 12개 구단 12경기(132) */
  const NT=typeof G!=='undefined'&&G&&G.teams&&G.teams.length?G.teams.length:10, LEN=NT<=10?[3,3,3,3,2,2]:NT===11?[3,3,2,2,2,2]:[3,3,3,3];
  const T=NT%2?NT+1:NT; let arr=[...Array(T).keys()]; const rounds=[];
  for(let r=0;r<T-1;r++){ const pr=[]; for(let i=0;i<T/2;i++){ const x=arr[i], z=arr[T-1-i]; if(x<NT&&z<NT)pr.push([x,z]); } rounds.push(pr); arr=[arr[0],arr[T-1],...arr.slice(1,T-1)]; } /* 홀수면 가짜 구단(NT)과 짝지어진 구단이 그 라운드에 쉰다 */
  const nDays=rounds.length*LEN.reduce((a,b)=>a+b,0);
  const days=[]; for(let n=open;days.length<nDays;n++){ const o=dobj(n); if(o.w===1||brk.has(n)||rest.has(n))continue; days.push(n); }
  const series=[]; rounds.forEach((pr,r)=>LEN.forEach((len,k)=>series.push({r,len,flip:k%2})));
  shuffle(series);
  // 같은 상대와 연속 시리즈가 붙지 않게 순서를 정한다
  const ord=[]; let l1=-1,l2=-1; while(series.length){ let i=series.findIndex(s=>s.r!==l1&&s.r!==l2); if(i<0)i=series.findIndex(s=>s.r!==l1); if(i<0)i=0; const s=series.splice(i,1)[0]; ord.push(s); l2=l1; l1=s.r; }
  const sched={}; let di=0;
  for(const s of ord) for(let g=0;g<s.len;g++){ sched[days[di++]]=rounds[s.r].map(([a,b])=>s.flip?[b,a]:[a,b]); }
  return {y,open,asg,end:days[days.length-1],sched,draft:onOrAfter(y,9,14,3),camp:dnum(y,1,25),campEnd:dnum(y,3,5),exh:dnum(y,3,12)};
}
function period(){
  const c=G.cal, d=G.day;
  if(d<c.open)return 'pre'; if(d<=c.end)return 'season';
  if(G.ps&&!G.ps.done)return 'post'; return 'off';
}
const PERIOD={pre:'시즌 준비',season:'정규시즌',post:'포스트시즌',off:'스토브리그'};

