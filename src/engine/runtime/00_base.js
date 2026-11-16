/* 구형 모바일 브라우저 보완(iOS 15.3 이하 등): Array/String .at() */
if(!Array.prototype.at)Object.defineProperty(Array.prototype,'at',{value:function(i){ i=Math.trunc(i)||0; if(i<0)i+=this.length; return i<0||i>=this.length?undefined:this[i]; },writable:true,configurable:true});
if(!Object.hasOwn)Object.hasOwn=(o,k)=>Object.prototype.hasOwnProperty.call(o,k); /* iOS 15.3 이하 */
if(!String.prototype.at)Object.defineProperty(String.prototype,'at',{value:function(i){ i=Math.trunc(i)||0; if(i<0)i+=this.length; return i<0||i>=this.length?undefined:this.charAt(i); },writable:true,configurable:true});
'use strict';
/* ===== 기본 도구 ===== */
/* 엔진 난수(단장 대전 준비, 11-17). 세계마다 시드를 G.rng에 두고, 상태도 G.rng에 둔다: 저장하면 난수 상태도 함께 저장되어 같은 시드·같은 결정이면 브라우저에서도 같은 결과가 나온다.
   새 게임 시드는 기본 난수원(Math.random)에서 뽑으므로 평소 커리어는 지금처럼 판마다 다르다. 옛 저장(G.rng 없음)은 처음 쓸 때 새 시드를 만든다.
   검사 도구가 엔진을 읽기 전에 Math.random을 바꿔 두었으면(시드형 검사·강제 난수 시나리오) 예전처럼 그 난수원을 그대로 쓴다(legacy). rngSetMode로 바꿀 수 있다.
   용도별 흐름: rngWith(키, 함수)는 그 함수 안의 난수를 hash(세계 시드, 키)에서 새로 시작하는 따로 흐름으로 돌린다(경기마다 하나). 본 흐름은 건드리지 않는다 */
const FO_RANDOM_BASE=FrontOfficeCore.createRandom(Math.random);
const RNG_NATIVE=(()=>{ try{ return FO_RANDOM_BASE.R===Math.random&&/\[native code\]/.test(Function.prototype.toString.call(Math.random)); }catch(e){ return false; } })();
let RNG_SEEDED=(()=>{ try{ const m=globalThis.FO_RNG_MODE; if(m==='seeded')return true; if(m==='legacy')return false; }catch(e){} return RNG_NATIVE; })();
let RNG_SUB=null; /* 지금 쓰는 따로 흐름 {s} */
function rngSetMode(m){ RNG_SEEDED=m==='seeded'; return RNG_SEEDED; }
function rngMode(){ return RNG_SEEDED?'seeded':'legacy'; }
/* 문자열·숫자 여러 개를 32비트 해시 하나로(FNV-1a + 마무리 섞기) */
function rngHash(){ let h=2166136261>>>0; for(let k=0;k<arguments.length;k++){ const s=String(arguments[k]); for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619)>>>0; } h^=124; h=Math.imul(h,16777619)>>>0; }
  h^=h>>>16; h=Math.imul(h,2246822507)>>>0; h^=h>>>13; h=Math.imul(h,3266489909)>>>0; h^=h>>>16; return h>>>0; }
function rngNew(seed){ seed=(seed==null?Math.floor(FO_RANDOM_BASE.R()*4294967296):+seed)>>>0; return {v:1,seed,s:rngHash('main',seed)|0}; }
function rngStep(st){ const a=st.s=(st.s+0x6D2B79F5)|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }
function rngEnsure(){ if(G&&typeof G==='object'&&!(G.rng&&Number.isFinite(G.rng.s)&&Number.isFinite(G.rng.seed)))G.rng=rngNew(); return G?G.rng:null; }
function rngSeed(){ const r=rngEnsure(); return r?r.seed:0; }
function rngNext(){ if(RNG_SUB)return rngStep(RNG_SUB); if(!RNG_SEEDED||!G||typeof G!=='object')return FO_RANDOM_BASE.R(); const st=G.rng; return rngStep(st&&Number.isFinite(st.s)?st:rngEnsure()); }
/* 따로 흐름: fn 안의 난수는 hash(세계 시드, 키)에서 시작한다. 시드형일 때만(legacy는 예전 그대로 한 흐름) */
function rngWith(key,fn){ if(!RNG_SEEDED)return fn(); const prev=RNG_SUB; RNG_SUB={s:rngHash('sub',rngSeed(),key)|0}; try{ return fn(); } finally{ RNG_SUB=prev; } }
/* 정해진 시드로 fn을 돌린다(방식과 무관하게 시드형, 안의 경기도 경기별 흐름). 단장 대전 선수 풀·시리즈처럼 입력만으로 결과가 정해져야 하는 곳 */
function rngForce(seed,fn){ const prev=RNG_SUB, m=RNG_SEEDED; RNG_SUB={s:(+seed)|0}; RNG_SEEDED=true; try{ return fn(); } finally{ RNG_SUB=prev; RNG_SEEDED=m; } }
/* 시드에서 바로 정해지는 값(보는 시점과 무관): 화면이 처음 부를 때 본 흐름을 쓰지 않게 */
function rngDerived(key){ const st={s:rngHash('der',rngSeed(),key)|0}; return ()=>rngStep(st); }
function rngGauss(key){ const f=rngDerived(key); let u=0,v=0; while(!u)u=f(); while(!v)v=f(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }
const FO_RANDOM=FrontOfficeCore.createRandom(rngNext);
const R=FO_RANDOM.R;
const rnd=FO_RANDOM.rnd;
const ri=FO_RANDOM.ri;
const gauss=FO_RANDOM.gauss;
const N=FO_RANDOM.N;
const clamp=FrontOfficeCore.clamp;
const pick=FO_RANDOM.pick;
const avg=FrontOfficeCore.avg;
const sum=FrontOfficeCore.sum;
const r5=FrontOfficeCore.r5;
const rr=FO_RANDOM.rr;
/* 숨은 효과 크기를 말로: 크게/꽤/조금 (화면에 정확한 수치를 보이지 않는다) */
function effWord(x,big,mid){x=Math.abs(+x||0);return x>=big?'크게':x>=mid?'꽤':'조금';}
/* 능력치 화면 표시: 내부 계산은 20~80 스카우트 척도 그대로 두고, 보여 줄 때만 100점 척도로 바꾼다.
   1군 평균(51)=63, 상급(58)=73, 대박(65)=84, 초대형(72)=95, 유망주 평균(24)=42 */
const DV_PTS=FrontOfficeCore.DV_PTS;
const dvRaw=FrontOfficeCore.dvRaw;
/* 능력치 표기 선택(설정, 사용자 11-12): 기본은 100점 척도, '20-80'이면 내부 스카우트 척도를 그대로 보여 준다(계산은 같다) */
/* 하드 모드(11-12): 새 게임에서 고른다. AI에게 보너스를 주지 않고 우리 구단 환경을 까다롭게(거래 웃돈·FA 선호·수입·구단주 인내) */
const HARD=()=>typeof G!=='undefined'&&!!G&&!!G.cfg&&!!G.cfg.hard;
const dv20=()=>typeof G!=='undefined'&&!!G&&!!G.cfg&&G.cfg.scale==='2080';
const dv=x=>dv20()?(typeof x==='number'&&isFinite(x)?Math.round(x):x):FrontOfficeCore.dv(x);
const dvSd=(c,sd)=>dv20()?Math.max(1,Math.round(sd||0)):FrontOfficeCore.dvSd(c,sd);
const dvMax=()=>dv20()?80:100, dvMin=()=>dv20()?20:20; /* 화면 범위 끝값 */
function dvo(p){ return p?dv(ovr(p)):'-'; }
function dvInv(d){ d=+d; if(!Number.isFinite(d))return null; if(dv20())return Math.max(20,Math.min(80,d)); const P=DV_PTS; if(d<=P[0][1])return P[0][0]; for(let i=1;i<P.length;i++){ const [a,b]=P[i-1],[c,e]=P[i]; if(d<=e)return a+(d-b)*(c-a)/(e-b); } return P[P.length-1][0]; } /* 화면 100점 척도 → 내부 20~80(에디터 입력용) */
const hn=FrontOfficeCore.hn;


/* 종합 능력 등급(게임 공통, 원래 능력 단위): 화면과 엔진(창단 지명 평가) 모두 쓴다 */
/* 등급은 리그 순위 기준(외국인 포함 리그 선수 능력 순위): S 상위 5명 · A 상위 25명 · B 상위 90명(주전급) · C 상위 280명(1군급) · D 상위 450명 · E 상위 560명 · 그 아래 F.
   경계값은 그날 리그 분포에서 정한다(장래성도 같은 경계로 본다 — 지금 리그 기준으로 그 정도 선수가 될 수 있는가). 리그가 아직 없으면 예전 고정 경계 */
const GRD_RANK=[['S',5],['A',25],['B',90],['C',280],['D',450],['E',560]];
let _grdC={k:null};
function grdCuts(){ if(typeof G==='undefined'||!G||!G.players)return null; const k=G.day+':'+G.year+':'+Object.keys(G.players).length; if(_grdC.k===k)return _grdC.v;
  const V=Object.values(G.players).filter(p=>!p.prospect&&(p.team!=null||p.fdPool)).map(p=>ovr(p)).sort((a,b)=>b-a); let v=null;
  if(V.length>=150){ v={}; for(const [g,n] of GRD_RANK)v[g]=V[Math.min(V.length-1,n-1)]; } _grdC={k,v}; return v; }
function GRD(v){ const c=grdCuts(); if(!c)return v>=75?'S':v>=65?'A':v>=55?'B':v>=50?'C':v>=45?'D':v>=35?'E':'F'; for(const [g] of GRD_RANK)if(v>=c[g])return g; return 'F'; }

/* 새 게임·불러오기·가져오기로 G가 바뀌면 계산 캐시를 모두 비운다(캐시 열쇠가 연도·날짜라 다른 세계의 값을 그대로 쓰던 문제).
   화면 쪽 캐시는 엔진만 도는 점검에선 없으므로 있을 때만 비운다 */
function worldReset(){ const L=x=>{ try{ return x(); }catch(e){ return null; } };
  L(()=>{ _spC={k:null}; _poC={k:null}; _dcc=null; _ftr=null; _xhrC=null; _ak.clear(); _lgbC={k:'',m:{}}; _subC.clear(); _pvC.clear(); _slC={k:null}; _grdC={k:null}; _franC={k:null}; _pjC={}; _faCtx=null; _intC={}; _lkC={k:'',m:new Map()}; _tcC={k:null,m:{}}; _evOut=null; _stC={k:'',m:{}}; _ldC.clear(); _nmSet=null; _nmDay=null; _pctC={k:null}; });
  if(typeof _lk!=='undefined')L(()=>{ _lk={k:null}; _psC={k:null}; _tsC=null; _prC=null; _fdAllSet=null; });
  /* 열쇠가 날짜·선수 id뿐인 캐시: 다른 세계에서 같은 id·같은 날이면 남의 값을 썼다(구종 수·FA 잠금·중계 사본, 안정화 점검) */
  for(const f of [()=>_pn.clear(),()=>{ _faLk={k:null,s:null}; },()=>{ _domSeen={d:-1,s:new Set()}; },()=>{ SPOIL_SNAP=null; },()=>{ _lsaC={v:null,k:null}; },()=>{ _faPC=null; }])L(f); }

/* 이름 뒤에 보이지 않는 선수 번호 표시(⁣ + 0/1 비트 + ⁤). 화면에서 이름을 링크할 때 동명이인 대신 그 선수로 잇는다(네오클라우드 11-11: 단장 식사에서 동명이인 링크) */
const PNM_A='\u2063', PNM_Z='\u2064';
function pidName(p){ if(!p||!p.name)return ''; if(typeof p.id!=='number')return p.name; return p.name+PNM_A+p.id.toString(2).replace(/0/g,'\u200b').replace(/1/g,'\u200c')+PNM_Z; }
function pnmId(m){ if(!m)return null; const b=m.slice(1,-1).replace(/\u200b/g,'0').replace(/\u200c/g,'1'); return b?parseInt(b,2):null; }
