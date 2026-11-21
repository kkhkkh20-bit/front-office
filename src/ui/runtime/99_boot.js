/* ===== 부팅: 모든 화면 파일이 읽힌 뒤 맨 마지막에 실행 =====
 앞 번호 파일에서 첫 화면을 그리면, 뒤 번호 파일의 상수(const)가 아직 만들어지지 않아 'before initialization' 오류로 화면이 빈다.
 그래서 저장 불러오기와 첫 화면 그리기는 항상 이 파일(가장 뒤)에서 한다. */
guardAll(); /* 41_guard_boot보다 뒤 파일에서 정의한 결재 액션(crewFire·sisEnd·coachStudySend·acadUp 등)도 직접 호출까지 결재창으로 감싼다 */
function bootLoad(){ try{ bootLoad0(); }catch(e){ /* 카페 11-21(시작 화면에서 안 넘어감): 저장 읽기·첫 화면 그리기에서 예외가 나도 메뉴는 뜨게 한다. 저장은 지우지 않는다 */ try{ console.error(e); }catch(x){} G=null; CUR_SLOT=null; UI.title=true; UI.sstep='main'; UI.slotMsg=`저장을 여는 중 오류가 나 처음 화면만 열었습니다(${String(e&&e.message||e).slice(0,60)}). 불러오기에서 다른 슬롯을 열거나, 설정 › 질문·피드백의 '제보용 정보 복사'로 알려 주세요.`; try{ render(); }catch(x){ try{ document.body.insertAdjacentHTML('beforeend','<div style="position:fixed;left:16px;right:16px;bottom:16px;padding:12px;background:#300;color:#fff;z-index:99999">첫 화면을 그리지 못했습니다. 새로고침해 보세요. '+esc(String(x&&x.message||x).slice(0,80))+'</div>'); }catch(y){} } try{performance.mark('fronttime-menu-ready');}catch(x){} } }
function bootLoad0(){ { let bad=''; for(let i=0;i<=SLOTS&&(G=load());i++){ try{ migrateDraft(); svMark(); if(bad)UI.slotMsg=`${bad} 대신 슬롯 ${curSlot()}을(를) 열었습니다.`; break; }catch(e){ const n=curSlot(); slotBad(n,'복원 오류'); bad=UI.slotMsg=`슬롯 ${n}의 데이터를 복원하다 오류가 나 열지 않았습니다(${String(e&&e.message||e).slice(0,60)}). 내보내기 백업이 있으면 그걸로 가져오세요.`; G=null; CUR_SLOT=null; } } } UI.title=true; UI.sstep='main'; /* 복원에 실패한 세이브는 이어하기 대상으로 남기지 않고, 정상인 다음 슬롯을 연다(검수 11-09 #16, 11-09zr #10) */

render(); /* 공간이 빠듯하면(본문 합계 약 3MB 이상) 진행 중이 아닌 슬롯을 IndexedDB로 미리 옮긴다 */ try{ if(sbOk()&&SLOT_IDS.reduce((a,k)=>a+((sbLsGet(k)||'').length),0)>1.5e6)setTimeout(()=>sbOffload(CUR_SLOT),3000); }catch(e){}
 try{performance.mark('fronttime-menu-ready');}catch(e){} /* 첫 화면 준비 표시: 저장을 읽고 첫 화면을 그린 뒤에 남긴다. IndexedDB를 기다리는 부팅(sbNeedBoot)에서는 이 시점이 스크립트 끝보다 늦다 */ }
let DL=null; try{ if(window.claude&&window.claude.use)window.claude.use('downloads').then(d=>{ DL=d; if(G&&UI.tab==='club')render(); }).catch(()=>{}); }catch(e){}
/* IndexedDB에 둔 슬롯이 있으면 먼저 읽어 온 뒤 연다. 없으면 예전처럼 바로 연다(사용자 11-12) */
if(sbNeedBoot()){ let done=false; const go=()=>{ if(done)return; done=true; bootLoad(); }; sbRefresh().catch(()=>{}).then(()=>{ if(done){ try{ render(); }catch(e){} } go(); }); /* 늦게 끝나도(본문이 크고 많을 때) 슬롯 목록을 다시 그려 '본문 없음'으로 남지 않게 */ setTimeout(()=>{ if(!done){ go(); try{ toast('보조 저장소(IndexedDB)가 응답하지 않아 일부 슬롯을 읽지 못했을 수 있습니다. 새로고침해 보세요.'); }catch(e){} } },2500); } else bootLoad(); /* 일부 Safari에서 indexedDB.open이 응답하지 않으면 첫 화면이 영영 안 뜨던 문제(UI 리뷰 11-13) */
try{ savePersistAsk(); }catch(e){} /* 저장 영구 보관 요청(모바일 정리로 지워지지 않게) */

