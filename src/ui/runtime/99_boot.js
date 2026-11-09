/* ===== 부팅: 모든 화면 파일이 읽힌 뒤 맨 마지막에 실행 =====
 앞 번호 파일에서 첫 화면을 그리면, 뒤 번호 파일의 상수(const)가 아직 만들어지지 않아 'before initialization' 오류로 화면이 빈다.
 그래서 저장 불러오기와 첫 화면 그리기는 항상 이 파일(가장 뒤)에서 한다. */
{ let bad=''; for(let i=0;i<=SLOTS&&(G=load());i++){ try{ migrateDraft(); svMark(); if(bad)UI.slotMsg=`${bad} 대신 슬롯 ${curSlot()}을(를) 열었습니다.`; break; }catch(e){ const n=curSlot(); SLOT_BAD[n]='복원 오류'; bad=UI.slotMsg=`슬롯 ${n}의 데이터를 복원하다 오류가 나 열지 않았습니다(${String(e&&e.message||e).slice(0,60)}). 내보내기 백업이 있으면 그걸로 가져오세요.`; G=null; CUR_SLOT=null; } } } UI.title=true; UI.sstep='main'; /* 복원에 실패한 세이브는 이어하기 대상으로 남기지 않고, 정상인 다음 슬롯을 연다(검수 11-09 #16, 11-09zr #10) */
let DL=null; try{ if(window.claude&&window.claude.use)window.claude.use('downloads').then(d=>{ DL=d; if(G&&UI.tab==='club')render(); }).catch(()=>{}); }catch(e){}
render();

try{performance.mark('fronttime-menu-ready');}catch(e){}
