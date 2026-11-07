/* ===== 신인 지명권 트레이드 (KBO 2020 시즌부터) =====
   출처: 엑스포츠뉴스 2020.4.30(2020 시즌부터 다음 연도 신인 지명권을 선수와 맞바꿀 수 있게 됨),
         노컷뉴스 2022.9.8(넘겨받은 지명권을 원래 구단 순번에 행사: 키움 2라운드 12번(KIA), 삼성 3라운드 23번(롯데), LG 5라운드 50번(KT)).
   - 주고받을 수 있는 것은 다음에 열릴 신인 드래프트의 지명권뿐이다(드래프트가 끝나면 그다음 해 지명권).
   - 지명권만 따로 사고팔 수는 없고 선수와 맞바꿔야 한다.
   - 넘겨받은 지명권은 원래 구단의 순번에 쓴다.
   shortcut: AI 구단끼리의 지명권 거래와 AI가 먼저 지명권을 제안하는 일은 없다. 필요해지면 AI 트레이드 쪽에 붙인다 */
const PK_V=[15,4.5,2.2,1.4,1,.7,.5,.4,.3,.25,.2]; /* 1라운드는 순번이 앞설수록 훨씬 비싸다(커뮤니티 피드백 11-07: 상위 지명권을 너무 싸게 모음) */ /* 라운드별 가치(트레이드 가치 단위, 현금 1억 ≈ 0.9) */
const PK_R1_MAX=2; /* 게임 규정: 1라운드 지명권은 자기 것 포함 두 장까지(커뮤니티 피드백 11-07) */
const pkYear=()=>G.draft&&G.draft.y===G.year?G.year+1:G.year;
function pkOwner(y,rd,orig){ const o=G.pkOwn&&G.pkOwn[y+':'+rd+':'+orig]; return o??orig; }
/* 그 구단이 가진 다음 드래프트 지명권: 'rd:원래 구단' 목록 */
function pkHeld(tid){ const y=pkYear(), L=[]; for(let rd=1;rd<=DRAFT_ROUNDS;rd++)for(const t of G.teams)if(pkOwner(y,rd,t.id)===tid)L.push(rd+':'+t.id); return L; }
function pkName(k){ const [rd,o]=k.split(':').map(Number); return `${pkYear()} 드래프트 ${rd}라운드(${tshort(o)} 순번)`; }
/* 예상 순번(0이 첫 순번): 올해 드래프트 전이면 정해진 순서, 끝났으면 지금 순위의 역순 */
function pkSlot(orig,rd){ const D=pkYear()===G.year?draftOrders():null; const o=D?(rd===1?D.r1:D.r2):standingsNow().map(x=>x.tid).reverse(); let i=o.indexOf(orig); if(i<0)i=5; if(!D&&rd===1&&team(orig).pickPen===pkYear())i=Math.min(o.length-1,i+9); /* 이미 확정된 다음 드래프트 순번 하락 제재(검수 11-07) */ return i; } /* 1라운드는 경쟁균형세 페널티가 반영된 순서 */
function pkVal(t,k){ const [rd,o]=k.split(':').map(Number); const m=t.mode==='rebuild'?1.3:teamCtx(t).contend?.8:1; const sl=pkSlot(o,rd); const own=rd===1&&o===t.id&&sl<3?PK_TOP3:1; /* 상위 3순번 자기 1라운드 지명권: 안 파는 게 아니라 아주 비싸게 판다(유저 피드백 11-07) */ return (PK_V[rd-1]||.2)*(rd===1?1.6-.1*sl:1.3-.06*sl)*m*own; }
const PK_TOP3=2;
const pkNorm=pk=>({give:[...new Set((pk&&pk.give)||[])],get:[...new Set((pk&&pk.get)||[])],y:pk&&pk.y!=null?pk.y:pkYear()}); /* y: 거래안에 넣을 때의 드래프트 연도. 드래프트가 끝나도 다음 해 것으로 바뀌지 않게(검수 11-06) */ /* 같은 지명권을 두 번 넣어도 한 장(검수 11-06) */
const pkSig=pk=>{ pk=pkNorm(pk); return pk.give.length||pk.get.length?'|p'+pk.y+':'+[...pk.give].sort().join(',')+'/'+[...pk.get].sort().join(','):''; };
function pkCheck(tid,give,get,pk){ pk=pkNorm(pk); if(!pk.give.length&&!pk.get.length)return '';
  if(G.draft&&!G.draft.done)return '신인 드래프트가 진행 중이라 지명권을 주고받을 수 없습니다.';
  if(pk.y!==pkYear())return `거래안의 지명권은 ${pk.y} 드래프트 것입니다. 지금 주고받을 수 있는 것은 ${pkYear()} 드래프트 지명권입니다. 다시 골라 주세요.`;
  const mine=pkHeld(G.user), their=pkHeld(tid); if(pk.give.some(k=>!mine.includes(k))||pk.get.some(k=>!their.includes(k)))return '지명권 보유 구단이 바뀌었습니다. 다시 골라 주세요.';
  if(mine.filter(k=>+k.split(':')[0]===1).length-pk.give.filter(k=>+k.split(':')[0]===1).length+pk.get.filter(k=>+k.split(':')[0]===1).length>PK_R1_MAX)return `한 드래프트에서 1라운드 지명권은 ${PK_R1_MAX}장까지 가질 수 있습니다(게임 규정: 지명권 독점 방지).`;
  if((pk.give.length&&!get.length)||(pk.get.length&&!give.length))return 'KBO 규약상 지명권은 선수와 맞바꿀 때만 넘길 수 있습니다. 지명권을 주려면 선수를 받고, 지명권을 받으려면 선수를 보내야 합니다.';
  return ''; }
function pkMove(pk,tid){ pk=pkNorm(pk); const y=pkYear(); G.pkOwn=G.pkOwn||{};
  const mv=(k,to)=>{ const [rd,o]=k.split(':').map(Number); if(to===o)delete G.pkOwn[y+':'+rd+':'+o]; else G.pkOwn[y+':'+rd+':'+o]=to; };
  pk.give.forEach(k=>mv(k,tid)); pk.get.forEach(k=>mv(k,G.user)); }
/* 드래프트를 열 때: 지난 해 이전 기록은 지운다 */
function pkClean(){ if(!G.pkOwn)return; for(const k in G.pkOwn)if(+k.split(':')[0]<G.year)delete G.pkOwn[k]; }
