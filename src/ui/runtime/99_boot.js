/* ===== 부팅: 모든 화면 파일이 읽힌 뒤 맨 마지막에 실행 =====
 앞 번호 파일에서 첫 화면을 그리면, 뒤 번호 파일의 상수(const)가 아직 만들어지지 않아 'before initialization' 오류로 화면이 빈다.
 그래서 저장 불러오기와 첫 화면 그리기는 항상 이 파일(가장 뒤)에서 한다. */
G=load(); if(G){ try{migrateDraft();}catch(e){} } UI.title=true; UI.sstep='main';
let DL=null; try{ if(window.claude&&window.claude.use)window.claude.use('downloads').then(d=>{ DL=d; if(G&&UI.tab==='club')render(); }).catch(()=>{}); }catch(e){}
render();
