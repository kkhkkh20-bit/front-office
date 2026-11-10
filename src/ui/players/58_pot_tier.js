/* 잠재력 표시: 숫자 대신 스카우트 등급 말 + 말풍선에 근거와 변수 */
function potChip(rp,p){ if(!rp||rp.ofp==null)return '<span class="ptier q" title="담당 스카우트가 없어 잠재력을 판단할 수 없습니다">판단 불가</span>'; const T=potTierP(rp,p);
  return `<span class="ptier t${T.n}" data-tip="${esc((p?potLine(p,rp):T.l)+'\n\n'+POT_HELP)}">${potStars(T.st)}</span>`; }

/* 이름 옆 잠재력 칩(계약·연봉 협상·무적 선수 목록, 카페 피드백 11-08) */
function potChipP(p){ try{ return ' '+potChip(scoutReport(p),p); }catch(e){ return ''; } }

/* 별 그림: 회색 별 5개 위에 금색 별을 비율만큼 덮는다(반 칸) */
function potStars(st){ if(st==null)return ''; return `<span class="pst" aria-label="별 ${st}개"><i class="pst-fill" aria-hidden="true" style="width:${st*20}%">★★★★★</i>★★★★★</span>`; }
/* 현재와 잠재력은 같은 내부 등급표로 비교한다. 화면 환산점수를 다시 별로 바꾸지 않는다. */
function currentAbilityStars(rp){ const known=rp&&typeof rp.cur==='number'&&isFinite(rp.cur),label=rp&&rp.exact?'현재 능력':'현재 능력 · 스카우트 추정'; return `<span class="current-rating-stars" data-tip="${esc(label+'\n\n'+POT_HELP)}" aria-label="${esc(label)}">${known?potStars(potStarN(rp.cur)):'?'}</span>`; }
