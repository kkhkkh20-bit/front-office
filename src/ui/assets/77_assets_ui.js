/* ===== 에셋 패키지 v2.1·v3 화면 연결(00b_assets_data.js의 ASSET) =====
 - 유니폼·모자(v3, 번호 없는 앞면): 구단 소개(구단 선택 자세히·구단 연대기)·국가대표 화면에만. 선수 얼굴 위에 합성하지 않는다(기존 얼굴 그대로)
 - 대회 마크·트로피: 포스트시즌·한국시리즈·우승 화면에만. 리그 이름(가칭 '프런트리그')과 리그 마크는 쓰지 않는다(기존 이름 유지)
 - 구장 배경: 공용 분위기 이미지. 특정 구장 외형·구장 효과와 연결하지 않고, 글자 뒤에는 어두운 겹침
 - 모든 숫자(진출 순위·시리즈 전적·우승 팀)는 엔진 상태(G.ps)에서 읽는다 */
function hasAsset(){ return typeof ASSET!=='undefined'&&ASSET; }
function uniRow(tid,opt){ if(!hasAsset())return ''; const U=tid==='kr'?ASSET.nat:ASSET.uni[tid]; if(!U)return ''; const sz=(opt&&opt.sz)||84; const nm=tid==='kr'?'국가대표':(G&&G.teams&&G.teams[tid]?tname(tid):U.n); /* 구단 선택(게임 전)은 G가 없다 */
  return `<div class="uni-row" aria-label="${esc(nm)} 유니폼과 모자">${[['h','홈 유니폼'],['a','원정 유니폼'],['c','모자']].map(([k,l])=>`<figure><img src="${U[k]}" width="${sz}" height="${sz}" alt="" loading="lazy" decoding="async"><figcaption>${l}</figcaption></figure>`).join('')}</div>`; }
function compMark(k,sz){ if(!hasAsset()||!ASSET.comp[k])return ''; return `<img class="cmark" src="${ASSET.comp[k]}" width="${sz}" height="${sz}" alt="" decoding="async">`; }
/* 에셋 v3(ASSET.v3): 시상식 무대·대진표 배경. v4(ASSET.v4): 트로피·상·대기록 실사 렌더(v3와 같은 manifest ID). 없으면 '' 또는 예전 그림으로 */
const v3=k=>hasAsset()&&ASSET.v3?ASSET.v3[k]:null, v4=k=>hasAsset()&&ASSET.v4?ASSET.v4[k]:null;
/* 트로피·대기록 그림 한 장(v4). txt가 있으면 manifest text_slots 자리(512 기준 비율)에 HTML 글자를 겹치고, 명판의 3/4 투시 기울기만큼 세로로 민다. 글자가 너무 작아지는 크기에서는 생략 */
function v3Img(id,sz,cls,alt,txt,slot){ const S=v4('img'), u=S&&S[id]; if(!u)return '';
  const img=`<img class="v3 ${cls||''}" src="${u}" width="${sz}" height="${sz}" alt="${esc(alt||'')}" decoding="async">`;
  const R=txt!=null&&(v4('slot')||{})[id], r=R&&R[slot||Object.keys(R)[0]]; if(!r)return img;
  const [x,y,w,h,f,c,vb,sk]=r, k=sz/vb, t=String(txt), em=[...t].reduce((a,ch)=>a+(/[가-힣]/.test(ch)?1:.6),0), fs=Math.min(f*k,h*k*.95,w*k/Math.max(1,em));
  if(fs<5)return img;
  return `<span class="v3w" style="width:${sz}px;height:${sz}px">${img}<b class="v3t" style="left:${x/vb*100}%;top:${y/vb*100}%;width:${w/vb*100}%;height:${h/vb*100}%;font-size:${fs.toFixed(1)}px;color:${c}${sk?`;transform:skewY(${sk}deg);transform-origin:0 0`:''}">${esc(t)}</b></span>`; }
function trophyImg(sz){ return v3Img('championship_trophy',sz,'trophy-img','우승 트로피')||(hasAsset()?`<img class="trophy-img" src="${ASSET.comp.trophy}" width="${sz}" height="${sz}" alt="우승 트로피" decoding="async">`:trophySvg()); }
const champTrophyImg=trophyImg;
function ggTrophyImg(sz){ return v3Img('golden_glove',sz,'gg-tro-img')||ART.glove(sz); }
/* 진열장 트로피: c 한국시리즈 우승 · r 준우승 · f 정규시즌 1위(페넌트). 없으면 예전 그림 */
function cupImg(k,sz){ return k==='c'?trophyImg(sz):v3Img(k==='r'?'runner_up_trophy':'regular_season_pennant',sz,'trophy-img',k==='r'?'준우승 트로피':'정규시즌 1위 페넌트')||ART.trophy(sz); }
/* 수상 이름 → v3 트로피 ID와 상패 글자(부문). 선수 수상(p.aw)·우승 반지·명예의 전당 문구 기준 */
function awV3(l){ const t=typeof TITLES!=='undefined'&&TITLES.find(t=>l===t[0]);
  if(t)return [t[2]?'pitching_title_blank':'batting_title_blank',t[0]];
  return [l.includes('골든글러브')?'golden_glove':l.includes('명예의 전당')?'hall_of_fame_plaque':l.includes('우승 반지')?'championship_ring':l.includes('감독상')?'manager_trophy'
    :l.includes('올스타')?(l.includes('MVP')?'all_star_mvp':l.includes('드림')?'all_star_dream_badge':'all_star_nanum_badge')
    :/WBC|올림픽|아시안게임|프리미어12/.test(l)?(/금메달|우승/.test(l)&&!l.includes('준우승')?'national_gold_medal':/은메달|준우승/.test(l)?'national_silver_medal':/동메달|4강/.test(l)?'national_bronze_medal':l.includes('영웅')?'mvp_trophy':null)
    :/(^|\s)MVP|최우수선수/.test(l)?'mvp_trophy':l.includes('신인')?'rookie_trophy':l.includes('준우승')?'runner_up_trophy':l.includes('우승')?'championship_trophy':null]; }
/* 대기록 배지: 경기 대기록은 전용 그림, 통산 이정표·시즌 기록은 공용 틀에 실제 기록값(문구 속 숫자). 전용 그림이 없는 기록은 예전 글자 아이콘 */
const FEAT_V3={cyc:'cycling_hit',nh:'no_hitter',tnh:'no_hitter',pg:'perfect_game',hr4:'four_home_runs',hrc:'consecutive_home_runs',wohr:'walk_off_home_run',gs:'grand_slam',k15:'fifteen_strikeouts',hs:'hitting_streak'};
const FEAT_SEASON=new Set(['s3030','s4040','hr40','hr50','h200','avg400','w20','sv40','k200','era1','srec']);
function featIcon(x,sz){ const old=`<span class="ft-i k-${x.k}">${FEATI[x.k]||'·'}</span>`; sz=sz||40;
  const num=(String(x.txt||'').match(/\d*\.\d+|\d+/)||[])[0], v=x.k==='s3030'?'30-30':x.k==='s4040'?'40-40':num;
  const im=FEAT_V3[x.k]?v3Img(FEAT_V3[x.k],sz,'ft-v3',FEATK[x.k]):x.k==='mile'&&num?v3Img('career_milestone_frame',sz,'ft-v3',FEATK[x.k],num):FEAT_SEASON.has(x.k)&&v?v3Img('season_record_frame',sz,'ft-v3',FEATK[x.k],v):'';
  return im?`<span class="ft-i ft-im k-${x.k}">${im}</span>`:old; }
function bgHero(k,inner,cls){ const u=hasAsset()&&ASSET.stad[k]; if(!u)return inner; return `<div class="bg-hero ${cls||''}" style="background-image:linear-gradient(180deg,rgba(8,12,16,.55),rgba(8,12,16,.86)),url(${u})">${inner}</div>`; }
function natHead(){ if(!hasAsset())return ''; return `<div class="nt-id"><img src="${ASSET.nat.b128}" width="56" height="56" alt="" decoding="async"><div><b>대한민국 야구 국가대표</b><span class="small muted">국제대회 소집 명단·차출 현황</span></div>${uniRow('kr',{sz:64})}</div>`; }
/* ===== v6b 실사 얼굴(시범 100명, 00d_faces_data.js의 FACE6) =====
 사용자 결정(2026-11-05): 검수 미통과지만 품질이 좋으니 먼저 연결. 100명뿐이라 '우리 구단' 선수만 사진으로(구단 안에서는 겹치지 않게), 나머지는 기존 그림 얼굴.
 - 국내 선수는 한국인 얼굴, 외국인은 출신에 맞춰(아시아쿼터: 일본·대만, 용병: 그 밖) 나이가 가까운 얼굴을 하나 정해 저장(G.f6 선수→칸, G.f6r 칸→선수)
 - 시트는 구단 홈 유니폼으로 미리 합성돼 있다(tools/gen-faces-v6b.py). 화면에서는 칸 하나를 잘라 작은 그림으로 캐시한다
 - 설정에서 끌 수 있다(G.f6off) */
const F6IMG={}, F6C=new Map(), F6B=new Map();
function face6Load(tid){ const k=String(tid); if(F6IMG[k]||typeof FACE6==='undefined'||!FACE6.sheet[k])return F6IMG[k]; const im=new Image(); F6IMG[k]=im; im.onload=()=>{ im.ok=true; clearTimeout(face6Load.t); face6Load.t=setTimeout(()=>{ try{ render(); }catch(e){} },30); }; im.src=FACE6.sheet[k]; return im; }
function face6Pool(p){ return FACE6.ids.map((x,i)=>i).filter(i=>{ const x=FACE6.ids[i]; if(!p.foreign)return !x.f; if(!x.f)return false; const asia=x.e==='Japanese'||x.e==='Taiwanese'; return p.foreign==='아시아'?asia:!asia; }); }
function face6Idx(p){ if(!G||G.f6off||!p||p.persona||p.id==null||p.team!==G.user||typeof FACE6==='undefined')return null;
  const M=G.f6=G.f6||{}, Rv=G.f6r=G.f6r||{}; const cur=M[p.id]; if(cur!=null&&Rv[cur]===p.id)return cur;
  const free=i=>{ const o=Rv[i]; if(o==null||o===p.id)return true; const q=G.players[o]; return !q||q.team!==G.user; };
  const C=face6Pool(p).filter(free); if(!C.length)return null;
  C.sort((a,b)=>Math.abs(FACE6.ids[a].a-p.age)-Math.abs(FACE6.ids[b].a-p.age)||hn('f6'+a,p.id)-hn('f6'+b,p.id)); const i=C[0]; if(cur!=null&&Rv[cur]===p.id)delete Rv[cur]; M[p.id]=i; Rv[i]=p.id; return i; }
function face6Src(o){ const i=face6Idx(o); if(i==null)return null; const tid=G.user, k=tid+':'+i; if(F6C.has(k))return F6C.get(k);
  const im=face6Load(tid); if(!im||!im.ok)return null; try{ const sx=(i%10)*128, sy=Math.floor(i/10)*128; const cut=(x,y,w,o)=>{ const c=document.createElement('canvas'); c.width=c.height=o; c.getContext('2d').drawImage(im,sx+x,sy+y,w,w,0,0,o,o); return c.toDataURL('image/jpeg',.88); };
    const u=cut(30,3,68,96), bu=cut(0,0,128,128); F6C.set(k,u); F6B.set(u,bu); return u; }catch(e){ return null; } } /* 작은 자리(목록·카드)는 모자~턱 확대, 큰 자리(faceBust)는 가슴까지 */
Object.assign(A,{ f6Tog(){ G.f6off=!G.f6off; try{ FACEC.clear(); }catch(e){} save(); render(); } });
