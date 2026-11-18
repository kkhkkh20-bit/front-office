/* ===== 편집됨 표시(G.edited)·능력치 지문(G.rdg): 에디터 기획 1단계(docs/design/editor-plan-2026-11-18.md §8, 구단주 11-18) =====
 - G.edited = {d(처음 편집한 날 G.day), y(그 해), k:[종류], n(편집 횟수)}. 한 번 붙으면 지우는 길이 없다(영구). 예전 저장은 undefined = 편집 안 함(이주 없음).
   예전 능력 에디터(11-17에 없앰)가 남긴 true도 편집됨으로 보고, 다음 표시 때 객체로 바꾼다(종류 'legacy').
 - 붙이는 길은 markEdited(kind) 하나. 종류: rating·contract·roster(앞으로 만들 에디터) · external(게임 밖에서 고친 저장 파일) · legacy.
 - 이름·얼굴·등번호 바꾸기(22c_cosmetic·72_cosmetic)는 편집으로 보지 않는다(능력·계약·명단이 그대로라 공정성과 무관).
 - 편집된 저장은 래더 등록(자동·직접)·프런트컵 신청·서버 리그 결과/기록실·도전과제에서 빠진다. 서버도 덱의 edited 표시를 거부한다(worker/v1/ladder.js·worker/uladder.js·worker/cup.js).
 - 에디터 본체는 아직 없다. 숨김 기능 플래그(EDITOR_FLAG, 기본 꺼짐) 뒤의 editorSet만 둔다. 화면 진입점은 없다. 엔진 난수(R)를 쓰지 않는다.
 - 능력치 지문(G.rdg): 정상 저장(화면 prepG·가져오기 savePrepareGame)이 문자열로 만들기 직전에 모든 선수 능력치(r)·잠재력(pot)의 가벼운 해시를 적는다.
   불러올 때(saveCheck: 이주 전 원본) 지문이 있는데 능력치가 다르면 markEdited('external'). 지문이 없는 예전 저장은 보지 않는다.
   지문을 모르는 예전 판 게임(다른 탭·내려받은 게임)이 지문을 그대로 실은 채 진행해 저장하면 능력치가 바뀌어도 지문이 그대로다: 진행 표(날짜·경기·소식 수)가 지문을 적을 때와 다르면 판단하지 않는다(헛표시 방지). */
const EDITED_KINDS=['rating','contract','roster','external','legacy'];
function markEdited(kind,g){ g=g||G; if(!g||typeof g!=='object')return null; const k=EDITED_KINDS.includes(kind)?kind:'other'; let e=g.edited;
  if(!e||typeof e!=='object'||Array.isArray(e)){ const was=!!e; e={d:Number.isFinite(g.day)?g.day:0,y:Number.isFinite(g.year)?g.year:0,k:was?['legacy']:[],n:was?1:0}; g.edited=e; }
  if(!Array.isArray(e.k))e.k=[]; if(!e.k.includes(k))e.k.push(k); e.n=(e.n|0)+1; return e; }
function isEdited(g){ g=g===undefined?G:g; return !!(g&&g.edited); }
const EDITED_MSG='이 저장은 능력·계약·명단을 바꾼 편집 기록(또는 게임 밖에서 고친 저장 파일)이 있어 래더 등록과 프런트컵 신청을 할 수 없습니다. 서버 순위·기록에도 올라가지 않습니다. 이 기기에서의 플레이는 그대로 할 수 있습니다.';
/* 래더·대회·서버 기록을 막을 이유(편집 안 한 저장은 빈 문자열) */
function editedBlock(g){ return isEdited(g)?EDITED_MSG:''; }

/* 숨김 기능 플래그: 공개 전에는 꺼 둔다(구단주 11-18 "만들어도 공개하지 않는다"). 켜는 화면은 없다 */
let EDITOR_FLAG=false;
const editorOn=()=>EDITOR_FLAG===true;
/* 앞으로 만들 에디터의 공통 입구: 선수 능력치(r.키)·잠재력(pot)·연봉(sal). 꺼져 있으면 아무것도 바꾸지 않고 이유를 돌려준다. 바꾸면 markEdited */
function editorSet(id,field,v){ if(!editorOn())return '편집 기능이 꺼져 있습니다.'; const p=G&&G.players&&G.players[id]; if(!p)return '선수를 찾을 수 없습니다.'; const x=+v; if(!Number.isFinite(x))return '숫자를 넣어 주세요.';
  if(field==='pot'){ p.pot=clamp(Math.round(x*10)/10,20,80); markEdited('rating'); return ''; }
  if(field==='sal'){ p.sal=Math.max(0,Math.round(x)); markEdited('contract'); return ''; }
  const k=String(field||'').replace(/^r\./,''); if(!p.r||!(k in p.r))return '그 능력치는 없습니다.'; p.r[k]=clamp(Math.round(x*10)/10,20,80); markEdited('rating'); return ''; }

/* 능력치 지문: 선수마다(번호·능력치 키·값×100 반올림·잠재력) 섞은 32비트 값을 더한다(선수 순서와 무관). 값이 undefined인 칸은 JSON에서 빠지므로 세지 않는다 */
const RDG_V=1;
function rdgOf(g){ const P=g&&g.players; if(!P||typeof P!=='object')return null; let s=0,n=0;
  for(const id in P){ const p=P[id]; if(!p||typeof p!=='object')continue; let h=Math.imul((+id|0)^0x9e3779b9,0x85ebca6b); const r=p.r;
    if(r&&typeof r==='object')for(const k in r){ const v=r[k]; if(v===undefined||typeof v==='function')continue; h=Math.imul(h^(k.charCodeAt(0)|k.length<<8|k.charCodeAt(k.length-1)<<16),0x01000193); h=Math.imul(h^Math.round(v*100),0x85ebca6b); h^=h>>>13; n++; }
    if(p.pot!=null){ h=Math.imul(h^Math.round(p.pot*100),0xc2b2ae35); h^=h>>>16; }
    s=(s+(h>>>0))%4294967296; }
  return {v:RDG_V,h:(s>>>0).toString(16).padStart(8,'0'),n,pg:rdgProg(g)}; }
/* 진행 표: 지문을 적은 뒤 이 판이 아닌 게임이 진행했는지 가늠한다 */
function rdgProg(g){ const L=x=>Array.isArray(x)?x.length:0; return [g.year|0,g.day|0,L(g.games),L(g.mail),L(g.news),Object.keys(g.players||{}).length].join('.'); }
function rdgStamp(g){ g=g||G; if(!g||!g.players)return null; return g.rdg=rdgOf(g); }
/* 불러온 원본(이주 전) 검사: 지문이 있고 진행 표가 같은데 능력치가 다르면 게임 밖에서 고친 파일 → 편집됨. 표시했으면 true */
function rdgCheck(g){ const d=g&&g.rdg; if(!d||typeof d!=='object'||d.v!==RDG_V||typeof d.h!=='string')return false; let now=null; try{ now=rdgOf(g); }catch(e){ return false; }
  if(!now||d.pg!==now.pg)return false; if(now.h===d.h&&now.n===d.n)return false; markEdited('external',g); return true; }
