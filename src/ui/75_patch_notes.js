/* ---------- 패치 노트: 업데이트마다 무엇이 바뀌었는지 공지처럼 알린다 ----------
   - PATCH 맨 앞이 가장 최근. 배포할 때마다 한 항목을 앞에 붙인다(플레이어가 느낄 변화만, 짧게).
   - 게임 화면에 들어왔을 때 아직 안 본 패치가 있으면 한 번 띄운다(본 기록은 이 기기의 브라우저에만 남는다).
   - 처음 화면과 게임 설정에서 언제든 다시 볼 수 있다 */
const PATCH=[
  {id:'2026-10-31b',d:'10월 31일 저녁',t:'투수 능력치 개편 · 나이 곡선 · 데이터 연결',items:[
    '투수 능력치의 역할을 나눴습니다. 구위는 삼진과 강한 타구(홈런·2루타·3루타) 억제, 제구는 볼넷 억제와 맞춰 잡기(피안타·피홈런 감소)·투구 수 절약, 체력은 투구 수가 늘어도 덜 지치고 이닝을 더 먹습니다.',
    '투수 종합 능력 공식을 실제 성적 기여에 맞췄습니다(구위·제구 비중을 같게, 체력 비중은 낮게). 구위형 투수가 종합 능력보다 훨씬 잘 던지던 쏠림이 줄었습니다.',
    '나이 곡선을 실제 KBO에 맞췄습니다. 전성기는 20대 후반이고 35세 무렵부터 크게 떨어집니다. 18세 유망주도 20대 중반에 정점에 이릅니다(진행 중인 저장은 다음 겨울 성장부터 적용).',
    '트래킹 데이터(타구속도·강한타구%·헛스윙%·CSW% 등)가 실제 실력을 더 정확하게 보여 줍니다. 땅볼형 투수는 피홈런·장타를 더 잘 막습니다.',
    '단장 재계약을 거절할 때 한 번 더 확인합니다. 야인일 때도 게임 설정에서 저장·불러오기를 쓸 수 있습니다.',
    '게임 개선을 위해 익명 플레이 기록(구글 애널리틱스)을 모읍니다. 이름·저장 내용은 보내지 않고, 게임 설정에서 끌 수 있습니다.'
  ]},
  {id:'2026-10-31a',d:'10월 31일',t:'창단 드래프트·스카우트·기록',items:[
    '스카우트 오차를 바로잡았습니다. 구위·체력·파워·주력·수비는 눈으로 거의 정확히 보이고, 컨택·선구·제구만 오차가 큽니다. 우리 스카우트의 성향(어느 툴을 후하게·짜게 보는지)을 지명 전에 보여 줍니다.',
    '툴 점수와 등급을 한 기준으로 맞췄습니다. 1군 주전 평균이 74점(C 중급)이고 S 특급 · A 상급 · B 중상급 · C 중급 · D 하급 · E 최하급입니다.',
    '데이터팀이 지난 2년 기록과 타구 질로 기대 홈런을 냅니다. 한 해 홈런 거품·불운을 짚어 줍니다. 성적 탭에서 최근 3년 합산을 볼 수 있습니다.',
    '구속을 실제 리그에 맞췄습니다. 리그 평균 146km, 구위가 아주 높으면 155km 안팎에 최고 160km 가까이 찍습니다.',
    'wRC+를 창단 드래프트·선수 정보·선수 카드·기록 순위에도 넣었습니다.',
    '저장 속도를 개선했습니다. 저장할 때 화면이 멈추던 시간이 크게 줄었습니다(기존 저장 그대로 열림).',
    '가을야구 중에는 팬 게시판에 정규시즌 연패 대신 시리즈 결과(업셋·탈락·우승) 글이 올라옵니다.',
    '감독 경기 후 인터뷰가 상황에 따라 다양해졌습니다. 저장 코드 복사·붙여넣기 버튼을 추가했습니다.'
  ]}
];
const PATCH_KEY='fronttime-patch-seen';
function patchSeen(){ try{ return localStorage.getItem(PATCH_KEY)||''; }catch(e){ return ''; } }
function patchMark(){ try{ localStorage.setItem(PATCH_KEY,PATCH[0].id); }catch(e){ UI.patchSeenMem=PATCH[0].id; } }
function patchUnseen(){ const s=patchSeen()||UI.patchSeenMem||''; const i=PATCH.findIndex(x=>x.id===s); return i<0?PATCH.slice(0,2):PATCH.slice(0,i); }
function patchBlock(x){ return `<div class="pn-i"><div class="row between"><b>${esc(x.t)}</b><span class="small muted">${esc(x.d)}</span></div><ul class="pn-l">${x.items.map(t=>`<li>${esc(t)}</li>`).join('')}</ul></div>`; }
/* 게임 화면에서 한 번 띄우는 공지(자동화 점검에서는 UI.patchTest일 때만) */
function patchPop(){ if(!G||UI.title||!PATCH.length)return ''; if(navigator.webdriver&&!UI.patchTest)return ''; if(UI.patchClosed)return ''; const L=patchUnseen(); if(!L.length)return '';
  return `<div class="rv-w pn-w"><div class="rv pn"><div class="eyebrow">업데이트 소식</div>${L.map(patchBlock).join('')}<button class="btn primary block" data-a="patchOk">확인</button></div></div>`; }
/* 처음 화면·게임 설정용 카드 */
function patchCard(){ const all=!!UI.patchAll; const L=all?PATCH:PATCH.slice(0,1); return `<section class="card pn-card"><div class="row between"><h2 class="sec">패치 노트</h2>${PATCH.length>1?`<button class="btn small" data-a="patchAll">${all?'접기':'지난 패치도 보기'}</button>`:''}</div>${L.map(patchBlock).join('')}</section>`; }
Object.assign(A,{ patchOk(){ patchMark(); UI.patchClosed=true; render(); }, patchAll(){ UI.patchAll=!UI.patchAll; render(); }, patchShow(){ UI.patchClosed=false; try{ localStorage.removeItem(PATCH_KEY); }catch(e){ UI.patchSeenMem=''; } render(); } });
