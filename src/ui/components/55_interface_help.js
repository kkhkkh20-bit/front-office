/* Decorative scenes are optional; faces, logos and match graphics are separate. */
function decorPhotosOn(){try{return localStorage.getItem('fronttime-decor-photos')==='1';}catch(e){return false;}}
function decorPhotosCard(){return csec('장식 사진',`<label class="chk"><input type="checkbox" data-a="decorPhotos"${decorPhotosOn()?' checked':''}> 의료·연수·출장·행사 사진 표시</label><p class="small muted">기본은 숨김입니다. 선수 얼굴과 구단 로고는 계속 표시합니다.</p>`);}
Object.assign(A,{decorPhotos(){try{localStorage.setItem('fronttime-decor-photos',decorPhotosOn()?'0':'1');}catch(e){}render();}});
