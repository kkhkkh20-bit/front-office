/* ===== KBO 경기 규정: ABS(자동 투구 판정 시스템)·피치 클락 =====
   출처: KBO 실행위원회 2024.1.24 의결(뉴스서울 2024.1.25): ABS 존은 홈플레이트 좌우 각 2cm 확대, 상단 타자 키의 56.35%·하단 27.64%,
         홈플레이트 중간면과 끝면을 모두 통과해야 스트라이크(포수 포구 위치와 무관). 피치 클락 위반은 투수 볼·타자 스트라이크, 2024년 1군은 시범 운영(경고만).
         스포츠경향 2024.12.4: 2025년 ABS 상·하단 0.6%p 하향(55.75%·27.04%), 피치 클락 정식 도입(주자 없을 때 20초·있을 때 25초, 타석 간 33초), 견제 제한은 넣지 않음.
         서울신문·데일리안 2025.12.19: 2026년 피치 클락 18초·23초로 2초씩 단축.
         다음(2026.8.24 보도): 9이닝 평균 경기 시간 2024년 3시간 10분 → 2025년 3시간 2분(8분 감소), 2026년(8월까지) 3시간 6분.
   - 이 게임의 볼·스트라이크는 처음부터 정해진 존으로만 가르므로(심판 편차·포수 프레이밍 없음) 2024년 이후 ABS와 같다. 규정 안내에 존 기준을 보여 준다.
   - 피치 클락은 경기 시간으로 반영한다: 그 경기 투구 수에 비례하고, 정식 도입(2025~) 뒤에는 기준 시간이 8분 짧다.
   shortcut: 피치 클락 위반(볼·스트라이크 선언)은 경기당 0.4회 수준이라 따로 만들지 않았다. 2026년 2초 단축은 실제 평균 경기 시간이 오히려 늘어(3시간 6분) 단축 효과를 따로 넣지 않았다 */
const GT_PC=315; /* 이 게임 9이닝 경기의 평균 투구 수(양 팀 합) */
const absZone=y=>y<2024?null:y===2024?{top:56.35,bot:27.64,side:2}:{top:55.75,bot:27.04,side:2};
const pClock=y=>y<2024?null:y===2024?{none:18,on:23,bat:30,trial:true}:y===2025?{none:20,on:25,bat:33}:{none:18,on:23,bat:33};
const gtBase=y=>{ const c=pClock(y); return c&&!c.trial?182:190; }; /* 9이닝 평균(분): 2024년 3시간 10분, 2025년 3시간 2분 */
function gameMin(g){ let pc=0; for(const k of ['h','a']){ const S=g.S[k]; for(const id of S.pitchers)pc+=(S.box.get(id)||{}).pc||0; } return Math.round(gtBase(G.year)*pc/GT_PC); }
const gtTxt=m=>`${Math.floor(m/60)}시간 ${m%60}분`;
/* 리그 평균 경기 시간(정규시즌) */
function gtAdd(m){ if(period()!=='season')return; if(!G.gt||G.gt.y!==G.year){ if(G.gt&&G.gt.n)G.gtPrev={y:G.gt.y,avg:Math.round(G.gt.sum/G.gt.n)}; G.gt={y:G.year,n:0,sum:0}; } G.gt.n++; G.gt.sum+=m; }
function gtAvg(){ return G.gt&&G.gt.y===G.year&&G.gt.n?Math.round(G.gt.sum/G.gt.n):null; }
function gameRulesTxt(y){ const z=absZone(y), c=pClock(y); if(!z&&!c)return '';
  return [(()=>{ try{ return lgrTxt(y); }catch(e){ return ''; } })(),z?`ABS(자동 투구 판정): 홈플레이트 좌우 각 ${z.side}cm 확대, 높이는 타자 키의 ${z.bot}%~${z.top}%. 공이 홈플레이트 중간면과 끝면을 모두 통과해야 스트라이크이고 포수 포구 위치와는 상관없습니다(포수 프레이밍 효과 없음).`:'',
    c?`피치 클락${c.trial?'(시범 운영, 위반해도 경고만)':''}: 주자 없을 때 ${c.none}초, 주자 있을 때 ${c.on}초 안에 던져야 하고 타석 사이는 ${c.bat}초입니다. 실제 규정은 위반하면 투수는 볼, 타자는 스트라이크입니다. 이 게임은 위반이 경기당 0.4회 안팎으로 드물어 볼·스트라이크에는 반영하지 않고 경기 시간에만 반영합니다. 견제(투구판 이탈) 횟수 제한은 없습니다.`:''].filter(Boolean).join('\n'); }
/* 개막일: 올 시즌 경기 규정 안내 */
function gameRulesMail(day){ if(!G.cal||day!==G.cal.open||G.unemp)return; const t=gameRulesTxt(G.year); if(!t)return; const pv=G.gtPrev&&G.gtPrev.y===G.year-1?G.gtPrev.avg:G.gt&&G.gt.y===G.year-1&&G.gt.n?Math.round(G.gt.sum/G.gt.n):null; /* 개막 메일이 첫 경기 집계(gtAdd)보다 먼저 나가므로 지난 시즌 집계를 직접 읽는다(검수 11-06) */
  mail('운영팀',`${G.year} 리그 경기 규정: ABS·피치 클락`,`올 시즌 1군 경기에 적용되는 판정·시간 규정입니다.\n\n${t}\n\n${pv?`지난 시즌 리그 평균 경기 시간은 ${gtTxt(pv)}였습니다. `:''}경기 시간은 경기 결과 카드에 나오고, 투구 수가 많을수록 길어집니다.`,{kind:'일반'}); }
