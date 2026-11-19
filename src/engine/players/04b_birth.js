/* ===== 생년월일(구단주 11-19) =====
   - 저장은 월일 하나(p.bd=MMDD, 예 314 = 3월 14일). 태어난 해는 저장하지 않고 '올해 − 나이'로 읽는다(bdYear).
     게임의 나이(p.age)는 새해에 모두 함께 한 살 먹는 연 나이라, 나이와 해가 같이 올라 태어난 해는 그대로다.
   - 월일은 선수 번호로 정하는 해시(rngHash)로 고른다: 본게임 난수(R)를 쓰지 않아 경기·성장 결과가 바뀌지 않는다.
     그해 날짜 가운데 고르게 하나(bdPick). 2월 29일은 태어난 해가 윤년일 때만 나온다.
   - 나이·새해 나이 먹기·드래프트·군 복무·은퇴 계산은 그대로 p.age를 쓴다. 만 나이는 화면에만 쓴다(manAge).
   - 채우는 때: 새 게임 끝(newGame)·불러오기(migrateDraft)·매일(processDay)에 bdMigrate가 빈 값만 채운다. 선수를 만든 직후가 아니라
     번호가 확정된 뒤에 정한다(만들 때 임시 번호를 썼다가 되돌리는 경로가 있어 같은 번호 해시가 몰렸다). 난수 없이 이미 있는 값은 건드리지 않아 몇 번 불러도 같다.
   - 코치·감독·단장·스카우트는 저장하지 않고 번호로 그때그때 같은 값을 읽는다(bdOf). */
function bdLeap(y){ return y%4===0&&(y%100!==0||y%400===0); }
function bdMD(k,lp){ for(let m=1;m<=12;m++){ const L=m===2?(lp?29:28):[4,6,9,11].includes(m)?30:31; if(k<L)return m*100+k+1; k-=L; } return 101; } /* 그해 k번째 날(0부터) → MMDD */
/* 윤년 달력 366칸에서 고른다: 2월 29일이 아니면 해와 상관없이 번호만으로 같은 날. 2월 29일이 나왔는데 평년이면 평년 365칸에서 다시 고른다 */
function bdPick(key,y){ const d=bdMD(rngHash('bd',key)%366,true); return d!==229||bdLeap(y)?d:bdMD(rngHash('bd2',key)%365,false); }
function bdYear(p){ return p&&p.age!=null&&Number.isFinite(+p.age)?G.year-p.age:null; } /* 연 나이: 올해 − 나이 */
function bdSet(p){ if(!p||p.bd!=null||p.id==null)return; const y=bdYear(p); if(y==null)return; p.bd=bdPick(p.id,y); }
function bdSetW(e){ if(!e||e.bd!=null||e.i==null||e.a==null)return; e.bd=bdPick('w'+e.i,G.year-e.a); } /* 해외 주목 선수(G.wps) */
function bdMigrate(){ if(!G)return; for(const p of Object.values(G.players||{}))bdSet(p); for(const e of (G.wps&&G.wps.L)||[])bdSetW(e); }
/* 생년월일 {y,m,d}. x: 선수·해외 주목 선수(e.a)·사람(코치·감독·단장, 저장 없이 번호로) */
function bdOf(x){ if(!x)return null; const age=x.age??x.a; if(age==null||!Number.isFinite(+age))return null; const y=G.year-age;
  let bd=x.bd; if(bd==null){ const key=x.i!=null&&x.a!=null?'w'+x.i:(x.id??x.name); if(key==null)return null; bd=bdPick(key,y); }
  let m=Math.floor(bd/100), d=bd%100; if(m===2&&d===29&&!bdLeap(y))d=28; /* 나이가 멈춰 있던 후보는 해가 바뀌어 윤년이 아닐 수 있다 */ return {y,m,d}; }
function bdText(x){ const b=bdOf(x); return b?`${b.y}.${String(b.m).padStart(2,'0')}.${String(b.d).padStart(2,'0')}`:''; }
/* 만 나이: 게임 날짜 기준으로 생일이 지났으면 (해 − 태어난 해), 아니면 하나 적게 */
function manAge(x,day){ const b=bdOf(x); if(!b)return null; const t=dobj(day??G.day); return t.y-b.y-((t.m<b.m||(t.m===b.m&&t.d<b.d))?1:0); }
/* 그날이 생일인가(2월 29일생은 평년에 2월 28일) */
function bdIsDay(x,day){ const b=bdOf(x); if(!b)return false; const t=dobj(day); const d=b.m===2&&b.d===29&&!bdLeap(t.y)?28:b.d; return t.m===b.m&&t.d===d; }
