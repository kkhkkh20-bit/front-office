/* ===== 에셋 패키지 v2.1 화면 연결(00b_assets_data.js의 ASSET) =====
 - 유니폼·모자: 구단 소개(구단 선택 자세히·구단 연대기)·국가대표 화면에만. 선수 얼굴 위에 합성하지 않는다(기존 얼굴 그대로)
 - 대회 마크·트로피: 포스트시즌·한국시리즈·우승 화면에만. 리그 이름(가칭 '프런트리그')과 리그 마크는 쓰지 않는다(기존 이름 유지)
 - 구장 배경: 공용 분위기 이미지. 특정 구장 외형·구장 효과와 연결하지 않고, 글자 뒤에는 어두운 겹침
 - 모든 숫자(진출 순위·시리즈 전적·우승 팀)는 엔진 상태(G.ps)에서 읽는다 */
function hasAsset(){ return typeof ASSET!=='undefined'&&ASSET; }
function uniRow(tid,opt){ if(!hasAsset())return ''; const U=tid==='kr'?ASSET.nat:ASSET.uni[tid]; if(!U)return ''; const sz=(opt&&opt.sz)||84; const nm=tid==='kr'?'국가대표':(G&&G.teams&&G.teams[tid]?tname(tid):U.n); /* 구단 선택(게임 전)은 G가 없다 */
  return `<div class="uni-row" aria-label="${esc(nm)} 유니폼과 모자">${[['h','홈 유니폼'],['a','원정 유니폼'],['c','모자']].map(([k,l])=>`<figure><img src="${U[k]}" width="${sz}" height="${sz}" alt="" loading="lazy" decoding="async"><figcaption>${l}</figcaption></figure>`).join('')}</div>`; }
function compMark(k,sz){ if(!hasAsset()||!ASSET.comp[k])return ''; return `<img class="cmark" src="${ASSET.comp[k]}" width="${sz}" height="${sz}" alt="" decoding="async">`; }
function trophyImg(sz){ return hasAsset()?`<img class="trophy-img" src="${ASSET.comp.trophy}" width="${sz}" height="${sz}" alt="우승 트로피" decoding="async">`:trophySvg(); }
function bgHero(k,inner,cls){ const u=hasAsset()&&ASSET.stad[k]; if(!u)return inner; return `<div class="bg-hero ${cls||''}" style="background-image:linear-gradient(180deg,rgba(8,12,16,.55),rgba(8,12,16,.86)),url(${u})">${inner}</div>`; }
function natHead(){ if(!hasAsset())return ''; return `<div class="nt-id"><img src="${ASSET.nat.b128}" width="56" height="56" alt="" decoding="async"><div><b>대한민국 야구 국가대표</b><span class="small muted">국제대회 소집 명단·차출 현황</span></div>${uniRow('kr',{sz:64})}</div>`; }
