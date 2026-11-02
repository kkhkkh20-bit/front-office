/* ===== 타구 모델: 인플레이 타구의 유형과 방향을 먼저 정하고, 그 방향을 맡은 야수의 수비로 안타·아웃을 가른다 =====
 - 유형: 땅볼·라인드라이브·뜬공·팝플라이. 타자 파워가 높을수록 뜬공, 컨택이 높을수록 라인드라이브, 투수 땅볼 성향(gbT)이 클수록 땅볼.
 - 방향: 당겨치기·가운데·밀어치기. 파워가 높을수록 당겨친다. 오른쪽 타석은 당기면 3루·좌익 쪽, 왼쪽 타석은 1루·우익 쪽(양타는 투수 반대편 타석).
 - 안타 확률: 타자·투수 결합으로 정한 인플레이 안타율(babip)을 유형별 상대 크기(라인드라이브가 가장 높고 팝플라이가 가장 낮음)로 나누고,
   그 자리 야수 수비력이 그 자리 보통 수준(ERRN)보다 좋으면 줄고 나쁘면 는다(땅볼·뜬공은 크게, 라인드라이브는 작게).
   유형 평균을 내면 원래 babip이 그대로 나오게 맞춰, 리그 평균(타율·장타율)은 바꾸지 않고 '누가 그 공을 받았나'가 결과를 가른다.
 - 장타: 뜬공·라인드라이브 안타가 2루타·3루타가 되기 쉽고 땅볼 안타는 대부분 단타. 타자의 장타 성향(d2·d3)과 투수 장타 억제(x2) 평균은 그대로 */
let LBIP=null; const BIP_K=.995; /* 실제 주전 수비 평균이 자리별 보통 수준(ERRN)보다 조금 낮아 생기는 차이를 되돌려 리그 BABIP를 예전과 같게 */
const BIP_TF={GB:.24,LD:.68,FB:.14,PU:.02}, BIP_XB={GB:.07,LD:.26,FB:.40,PU:0}, BIP_FK={GB:.0075,LD:.003,FB:.0065,PU:.001};
function bipMix(b,p){ const pw=cc(b.r.pow,0), cn=cc(b.r.con,0); const gb=clamp(.43-(pw-.5)*.10+hn('bgb',b.id)*.03+gbT(p)*.05,.25,.62), ld=clamp(.21+(cn-.5)*.05,.14,.28);
  const fa=Math.max(.1,1-gb-ld), pu=fa*clamp(.24-(pw-.5)*.10+hn('bpu',b.id)*.03,.1,.36); return {GB:gb,LD:ld,FB:fa-pu,PU:pu}; }
function bipSide(b,p){ return b.bt==='양'?(p.th==='좌'?'R':'L'):(b.bt==='좌'?'L':'R'); }
function bipDir(b){ const pw=cc(b.r.pow,0), h=hn('pull',b.id); const pull=clamp(.40+(pw-.5)*.18+h*.05,.28,.56), oppo=clamp(.25-(pw-.5)*.08-h*.03,.14,.33); const x=R(); return x<pull?'pull':x<pull+oppo?'oppo':'mid'; }
/* 방향 → 맡는 자리. 'L3'은 3루·좌익 쪽, 'R1'은 1루·우익 쪽 */
function bipPos(t,dir,side){ const d=dir==='mid'?'mid':(dir==='pull')===(side==='R')?'L3':'R1'; const x=R();
  if(t==='GB')return d==='L3'?(x<.5?'3B':'SS'):d==='mid'?(x<.42?'SS':x<.84?'2B':'P'):(x<.45?'2B':'1B');
  if(t==='PU')return d==='L3'?(x<.6?'3B':'SS'):d==='mid'?(x<.4?'SS':x<.75?'2B':'C'):(x<.6?'1B':'2B');
  return d==='L3'?'LF':d==='mid'?'CF':'RF'; }
function fielderAt(fs,pos){ if(!fs)return null; if(pos==='P')return fs.cur||null; for(const q of (fs.order||[]))if(fs.posOf&&fs.posOf[q.id]===pos)return q; return null; }
function bipResolve(b,p,babip,qb,qp,fs){ const M=bipMix(b,p); let x=R(), t='PU'; for(const k of ['GB','LD','FB','PU']){ x-=M[k]; if(x<=0){ t=k; break; } }
  const side=bipSide(b,p), pos=bipPos(t,bipDir(b),side), f=fielderAt(fs,pos); const base=ERRN[pos]||DEF0; const fv=f&&pos!=='P'?fieldV(f,pos):base;
  const norm=M.GB*BIP_TF.GB+M.LD*BIP_TF.LD+M.FB*BIP_TF.FB+M.PU*BIP_TF.PU; const ff=clamp(1-(fv-base)*BIP_FK[t],.7,1.35);
  const ph=clamp(babip*BIP_TF[t]/norm*ff*BIP_K,0,.95); LBIP={t,pos,side,fid:f?f.id:null};
  if(R()>=ph)return 'OUT';
  const hw=k=>M[k]*BIP_TF[k]; const E=(hw('GB')*BIP_XB.GB+hw('LD')*BIP_XB.LD+hw('FB')*BIP_XB.FB)/norm; const xm=(qp&&qp.x2)||1;
  const xbP=clamp(BIP_XB[t]*((qb.d2+qb.d3)*xm)/Math.max(.01,E),0,.92); if(R()<xbP){ const tr=qb.d3/Math.max(.001,qb.d2+qb.d3); return t!=='GB'&&R()<tr*(t==='FB'?1.55:1)?'3B':'2B'; } return '1B'; }
function bipHR(b,p){ const side=bipSide(b,p); const d=PARK!=null?parkHRDir(PARK,side):(x=>x<.6?'pull':x<.88?'mid':'oppo')(R()); return {t:'FB',pos:bipPos('FB',d,side),side,hr:true}; }
/* 방향별 타구 기록(정규시즌 1군): 타자 spr.z[자리]=[타구, 안타, 장타, 홈런], 유형 spr.t[유형]=[타구, 안타]. 투수는 맞은 타구 유형만 */
function sprAdd(b,p,o,L){ if(!L)return; const y=G.year; const ini=x=>{ if(!x.spr||x.spr.y!==y){ if(x.spr&&x.spr.y===y-1)x.sprP=x.spr; x.spr={y,z:{},t:{}}; } return x.spr; };
  const hit=o!=='OUT', xb=o==='2B'||o==='3B'||o==='HR'; const S=ini(b); const z=S.z[L.pos]||(S.z[L.pos]=[0,0,0,0]); z[0]++; if(hit)z[1]++; if(xb)z[2]++; if(o==='HR')z[3]++;
  const tt=S.t[L.t]||(S.t[L.t]=[0,0]); tt[0]++; if(hit)tt[1]++; const P=ini(p); const pt=P.t[L.t]||(P.t[L.t]=[0,0]); pt[0]++; if(hit)pt[1]++; }
