'use strict';
/* ===== 기본 도구 ===== */
const FO_RANDOM=FrontOfficeCore.createRandom(Math.random);
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
/* 능력치 화면 표시: 내부 계산은 20~80 스카우트 척도 그대로 두고, 보여 줄 때만 100점 척도로 바꾼다.
   1군 평균(51)=63, 상급(58)=73, 대박(65)=84, 초대형(72)=95, 유망주 평균(24)=42 */
const DV_PTS=FrontOfficeCore.DV_PTS;
const dvRaw=FrontOfficeCore.dvRaw;
const dv=FrontOfficeCore.dv;
const dvSd=FrontOfficeCore.dvSd;
function dvo(p){ return p?dv(ovr(p)):'-'; }
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
  if(typeof _lk!=='undefined')L(()=>{ _lk={k:null}; _psC={k:null}; _tsC=null; _prC=null; _fdAllSet=null; }); }
