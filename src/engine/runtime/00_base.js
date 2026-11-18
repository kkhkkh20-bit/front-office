/* 구형 모바일 브라우저 보완(iOS 15.3 이하 등): Array/String .at() */
if(!Array.prototype.at)Object.defineProperty(Array.prototype,'at',{value:function(i){ i=Math.trunc(i)||0; if(i<0)i+=this.length; return i<0||i>=this.length?undefined:this[i]; },writable:true,configurable:true});
if(!Object.hasOwn)Object.hasOwn=(o,k)=>Object.prototype.hasOwnProperty.call(o,k); /* iOS 15.3 이하 */
if(!String.prototype.at)Object.defineProperty(String.prototype,'at',{value:function(i){ i=Math.trunc(i)||0; if(i<0)i+=this.length; return i<0||i>=this.length?undefined:this.charAt(i); },writable:true,configurable:true});
'use strict';
/* ===== 기본 도구 ===== */
const FO_RNG0=Math.random; let FO_RNG=null; /* FO_RNG: 잠깐 바꿔 끼우는 난수원(withRng). 평소에는 비어 있어 처음 묶인 난수원을 그대로 쓴다 */
const FO_RANDOM=FrontOfficeCore.createRandom(()=>(FO_RNG||FO_RNG0)());
/* 따로 씨앗을 둔 난수로 fn을 돌린다: 본 난수 흐름을 한 번도 쓰지 않는다(해외 활성화 3-1: 새 게임 해외파·후보군을 만들어도 시작 세계·이후 난수가 그대로) */
function withRng(seed,fn){ const o=FO_RNG; FO_RNG=FrontOfficeCore.createSeededRandom(seed|0); try{ return fn(); }finally{ FO_RNG=o; } }
/* 해시(문자열 여러 개 → 32비트). 난수가 아니다: 대회·래더의 키·결과 요약용. 본게임·대회·래더 경기는 모두 평범한 난수(Math.random)로 돈다(구단주 11-17: 같은 전력이어도 돌릴 때마다 결과가 달라야 한다) */
function rngHash(){ let h=2166136261>>>0; for(let k=0;k<arguments.length;k++){ const s=String(arguments[k]); for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619)>>>0; } h^=124; h=Math.imul(h,16777619)>>>0; }
  h^=h>>>16; h=Math.imul(h,2246822507)>>>0; h^=h>>>13; h=Math.imul(h,3266489909)>>>0; h^=h>>>16; return h>>>0; }
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
