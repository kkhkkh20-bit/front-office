/* 잠재력 표시: 숫자 대신 스카우트 등급 말 + 말풍선에 근거와 변수 */
function potChip(rp,p){ if(!rp||rp.ofp==null)return '<span class="ptier q" title="담당 스카우트가 없어 잠재력을 판단할 수 없습니다">판단 불가</span>'; const T=potTierP(rp,p);
  return `<span class="ptier t${T.n}" title="${esc(p?potLine(p,rp):T.l)}">${T.s}</span>`; }

/* 이름 옆 잠재력 칩(계약·연봉 협상·무적 선수 목록, 카페 피드백 11-08) */
function potChipP(p){ try{ return ' '+potChip(scoutReport(p),p); }catch(e){ return ''; } }
