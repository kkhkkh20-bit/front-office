/* ---------- 빈 상태·불러오는 중 공통 부품(UI 3단계 3-8) ----------
   emptyState(문구, 동작): 문구 한 줄 + 다음에 할 일 보조 버튼 0~1개. 동작은 [글자, data-a, data-v].
   loadingState(문구): 불러오는 동안 한 줄(움직이는 점). 새 빈 문구는 '<p class="small muted">…없습니다'로 직접 쓰지 말고 이 부품을 쓴다(check-ui-patterns). */
function emptyState(text,act){ return `<div class="empty-state" role="status"><p>${text}</p>${act?`<button type="button" class="btn small" data-a="${act[1]}"${act[2]!=null?` data-v="${esc(String(act[2]))}"`:''}>${esc(act[0])}</button>`:''}</div>`; }
function loadingState(text){ return `<div class="loading-state" role="status" aria-live="polite"><i aria-hidden="true"></i><i aria-hidden="true"></i><i aria-hidden="true"></i><span>${esc(text||'불러오는 중입니다')}</span></div>`; }
