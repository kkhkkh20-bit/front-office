/* ===== 부팅: 모든 화면 파일이 읽힌 뒤 맨 마지막에 실행 =====
 앞 번호 파일에서 첫 화면을 그리면, 뒤 번호 파일의 상수(const)가 아직 만들어지지 않아 'before initialization' 오류로 화면이 빈다.
 그래서 저장 불러오기와 첫 화면 그리기는 항상 이 파일(가장 뒤)에서 한다. */
function bootLoad(){ { let bad=''; for(let i=0;i<=SLOTS&&(G=load());i++){ try{ migrateDraft(); svMark(); if(bad)UI.slotMsg=`${bad} 대신 슬롯 ${curSlot()}을(를) 열었습니다.`; break; }catch(e){ const n=curSlot(); slotBad(n,'복원 오류'); bad=UI.slotMsg=`슬롯 ${n}의 데이터를 복원하다 오류가 나 열지 않았습니다(${String(e&&e.message||e).slice(0,60)}). 내보내기 백업이 있으면 그걸로 가져오세요.`; G=null; CUR_SLOT=null; } } } UI.title=true; UI.sstep='main'; /* 복원에 실패한 세이브는 이어하기 대상으로 남기지 않고, 정상인 다음 슬롯을 연다(검수 11-09 #16, 11-09zr #10) */

render(); /* 공간이 빠듯하면(본문 합계 약 3MB 이상) 진행 중이 아닌 슬롯을 IndexedDB로 미리 옮긴다 */ try{ if(sbOk()&&SLOT_IDS.reduce((a,k)=>a+((sbLsGet(k)||'').length),0)>1.5e6)setTimeout(()=>sbOffload(CUR_SLOT),3000); }catch(e){} }
let DL=null; try{ if(window.claude&&window.claude.use)window.claude.use('downloads').then(d=>{ DL=d; if(G&&UI.tab==='club')render(); }).catch(()=>{}); }catch(e){}
/* IndexedDB에 둔 슬롯이 있으면 먼저 읽어 온 뒤 연다. 없으면 예전처럼 바로 연다(사용자 11-12) */
if(sbNeedBoot())sbRefresh().catch(()=>{}).then(bootLoad); else bootLoad();
try{ savePersistAsk(); }catch(e){} /* 저장 영구 보관 요청(모바일 정리로 지워지지 않게) */

try{performance.mark('fronttime-menu-ready');}catch(e){}
