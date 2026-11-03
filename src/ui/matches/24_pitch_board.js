/* 포수 시점: x=0..1은 존 왼쪽→오른쪽, y=0..1은 높음→낮음.
   공이 존 밖으로 빠진 위치도 표시한다. 공개되는 공은 재생한 순서까지만. */
function mdPitchDock(){return `<section class="md-pitch-dock md-panel" aria-label="투구판과 볼카운트"><header><b>투구 위치 <small>포수 시점</small></b><span id="cs-pitch-source">포수 시점</span></header><div class="md-zone-map" role="img" aria-label="9칸 스트라이크존 · 투구 대기"><div class="md-zone-grid">${Array.from({length:9},()=>'<i></i>').join('')}</div><div id="md-pitch-dots"></div></div><div class="cs-pitch" id="cs-pitch" aria-live="polite"></div><ol class="md-pitch-history" id="md-pitch-history" aria-label="이번 타석 투구 기록"></ol><div class="md-count-panel"><div class="md-base-state" id="cs-bases" aria-label="현재 주자"></div><div class="cs-bso" id="cs-bso" aria-label="볼카운트"><div><b>B</b><span id="cs-B"><i></i><i></i><i></i></span></div><div><b>S</b><span id="cs-S"><i></i><i></i></span></div><div><b>O</b><span id="cs-Ob"><i></i><i></i></span></div></div><div id="cs-count-summary">0볼 · 0스트라이크 · 0아웃</div></div></section>`;}
function cPitchTotalBefore(g,k,pid){
  let total=0;for(let i=0;i<k;i++){const x=g.pbp[i];if(typeof x[1]!=='number'||x[2]!==pid)continue;const seq=storedPitchSequence(x);if(!seq)return null;total+=seq.length;}return total;
}
function cPitchLocationText(q){
  const side=q.x<0?'존 왼쪽 바깥':q.x>1?'존 오른쪽 바깥':q.x<1/3?'왼쪽':q.x>2/3?'오른쪽':'가운데';
  const height=q.y<0?'높게 벗어남':q.y>1?'낮게 벗어남':q.y<1/3?'높은 코스':q.y>2/3?'낮은 코스':'중간 높이';
  return side+' · '+height;
}
function cPitchClass(q){return /볼/.test(q.res)?'ball':/타격|번트/.test(q.res)?'contact':'strike';}
function cPitchPanel(g,k,seq,shown){
  const x=g.pbp[k],q=seq[shown-1],saved=!!storedPitchSequence(x),source=document.getElementById('cs-pitch-source'),info=document.getElementById('cs-pitch');
  if(!info)return;
  if(source){source.textContent=!x?'경기 종료':typeof x[1]!=='number'?'투구 대기':saved?'투구 기록':'투구 재현';source.title=saved?'시뮬레이션에서 생성·저장한 투구 기록입니다. 타석 결과에 맞춰 구성한 좌표이며 실측 자료는 아닙니다.':'기존 경기에는 공별 기록이 없어 타석 결과를 바탕으로 재현합니다.';}
  const list=seq.slice(0,shown),start=Math.max(0,list.length-6);
  mdSet('md-pitch-dots',list.slice(start).map((p,i)=>`<span class="md-pitch-dot ${cPitchClass(p)}${i===list.length-start-1?' latest':''}" style="left:${20+60*p.x}%;top:${15+70*p.y}%" title="${esc((start+i+1)+'구 '+p.t+' '+p.v+'km/h · '+p.res+' · '+cPitchLocationText(p))}" data-index="${start+i+1}" data-x="${p.x}" data-y="${p.y}">${start+i+1}</span>`).join(''));
  mdSet('md-pitch-history',list.slice(-4).map((p,i)=>`<li><i>${list.length-Math.min(4,list.length)+i+1}</i><b>${esc(p.t)}</b><span>${p.v}<small> km/h</small></span><em class="${cPitchClass(p)}">${esc(p.res)}</em></li>`).join(''));
  const history=document.getElementById('md-pitch-history');if(history)history.scrollTop=history.scrollHeight;
  const map=document.querySelector('.md-zone-map');if(map)map.setAttribute('aria-label',q?`${shown}구 ${q.t} ${q.v}km/h · ${q.res} · ${cPitchLocationText(q)}`:'9칸 스트라이크존 · 투구 대기');
  info.innerHTML=q?cPitchTxt(q,shown-1):`<span class="md-pitch-wait">${x?typeof x[1]==='number'?'첫 공을 기다립니다':x[1]==='PC'?'투수 교체':'주루 상황':'경기 종료'}</span>`;info.className='cs-pitch'+(q?' on':'');
  if(q){const terminal=shown===seq.length,n=terminal?{b:q.b,s:q.s}:cCountAfter(q);cCount(n.b,n.s);if(c3DActive())Match3D.scoreboard({b:n.b,s:n.s,pitch:{t:q.t,v:q.v},playText:q.res});}
  else cCount(0,0);
  const count=document.getElementById('cs-pitcher-count');if(count&&x&&typeof x[1]==='number'){const total=cPitchTotalBefore(g,k,x[2]);count.textContent=total==null?'투구 수 미기록':(total+shown)+'구';}
}
function cShowPitch(g,k,seq,index){if(!UI.cast)return;UI.cast.pitch={k,shown:index+1};cPitchPanel(g,k,seq,index+1);}
function cPitchReset(g,k){const state=UI.cast?.pitch,seq=cPitchSeq(g,k);cPitchPanel(g,k,seq,state?.k===k?Math.min(seq.length,state.shown):0);}
