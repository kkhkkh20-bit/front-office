/* ===== 날짜 ===== */
const D0=Date.UTC(2024,0,1);
const dnum=(y,m,d)=>Math.round((Date.UTC(y,m-1,d)-D0)/864e5);
function dobj(n){const t=new Date(D0+n*864e5);return {y:t.getUTCFullYear(),m:t.getUTCMonth()+1,d:t.getUTCDate(),w:t.getUTCDay()};}
const WD='일월화수목금토';
const dstr=n=>{const o=dobj(n);return `${o.y}년 ${o.m}월 ${o.d}일 ${WD[o.w]}요일`;};
const dmd=n=>{const o=dobj(n);return `${o.m}월 ${o.d}일`;};
const dsh=n=>{const o=dobj(n);return `${o.m}/${o.d}`;};
function onOrAfter(y,m,d,w){ let n=dnum(y,m,d); while(dobj(n).w!==w)n++; return n; }
function shuffle(a){ for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
const KD=(m,d)=>dnum(G.year,m,d);

/* ===== 시즌 일정: 3연전·2연전, 월요일 휴식, 올스타 휴식기 ===== */
function buildCalendar(y){
  const open=onOrAfter(y,3,25,6);
  const asg=onOrAfter(y,7,8,6);
  const brk=new Set([asg-2,asg-1,asg,asg+1]);
  const rest=new Set(); while(rest.size<9){ const n=ri(open+10,dnum(y,9,5)); if(dobj(n).w!==1&&!brk.has(n))rest.add(n); }
  const days=[]; for(let n=open;days.length<144;n++){ const o=dobj(n); if(o.w===1||brk.has(n)||rest.has(n))continue; days.push(n); }
  const T=10; let arr=[...Array(T).keys()]; const rounds=[];
  for(let r=0;r<T-1;r++){ const pr=[]; for(let i=0;i<T/2;i++)pr.push([arr[i],arr[T-1-i]]); rounds.push(pr); arr=[arr[0],arr[T-1],...arr.slice(1,T-1)]; }
  const series=[]; rounds.forEach((pr,r)=>[3,3,3,3,2,2].forEach((len,k)=>series.push({r,len,flip:k%2})));
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

