/* 훈련 시설 비교: 경쟁 구단과 우리 구단의 시설별 단계를 한 표로. 열 머리를 누르면 그 시설 순으로 정렬한다 */
const FCMP_H={indoor:'실내',weight:'근력',rehab:'재활',lab:'랩',fut:'2군',dorm:'숙소'};
function facCompare(){ try{ aiFacAll(); }catch(e){} if(!G||!G.teams)return '';
  const rows=G.teams.map(t=>{ const S=facSt(t.id); return S&&S.it?{t,S,mine:t.id===G.user}:null; }).filter(Boolean); if(!rows.length)return '';
  const sk=UI.facCmp||'lv'; const val=(r,k)=>k==='lv'?sum(FACK.map(x=>r.S.it[x]||0)):(r.S.it[k]||0);
  rows.sort((a,b)=>(b.mine-a.mine)||(val(b,sk)-val(a,sk))||(b.S.lv-a.S.lv));
  const me=rows.find(r=>r.mine); const rank=k=>me?rows.filter(r=>val(r,k)>val(me,k)).length+1:'-';
  const cell=(r,k)=>{ const lv=r.S.it[k]||0, b=r.S.bld&&r.S.bld[k], dn=r.S.dn&&r.S.dn[k];
    const tip=`${FACI[k].l}: ${FACI[k].lv[lv]}${dn!=null?` (${dobj(dn).y}년 ${dmd(dn)} 완공)`:''}${b?` · ${FACI[k].lv[b.lv]} 공사 중, ${dmd(b.done)} 완공 예정`:''}`;
    return `<td class="fcl${lv}" title="${esc(tip)}">${lv}${b?'<sup>↑</sup>':''}</td>`; };
  const head=`<tr><th>구단</th>${FACK.map(k=>`<th><button data-a="facCmpSort" data-v="${k}" class="${sk===k?'on':''}" title="${esc(FACI[k].l)} 순으로 보기">${FCMP_H[k]}</button></th>`).join('')}<th><button data-a="facCmpSort" data-v="lv" class="${sk==='lv'?'on':''}" title="종합 등급 순으로 보기">종합</button></th></tr>`;
  const body=rows.map(r=>`<tr class="${r.mine?'me':''}"><td title="${esc(tname(r.t.id))}">${esc(r.t.nick)}</td>${FACK.map(k=>cell(r,k)).join('')}<td class="fcg">${r.S.lv}${Object.keys(r.S.bld||{}).length?'<sup>↑</sup>':''}</td></tr>`).join('');
  const avg=k=>(sum(rows.map(r=>r.S.it[k]||0))/rows.length).toFixed(1);
  const foot=`<tr class="fav"><td>리그 평균</td>${FACK.map(k=>`<td>${avg(k)}</td>`).join('')}<td>${(sum(rows.map(r=>r.S.lv))/rows.length).toFixed(1)}</td></tr>${me?`<tr class="frk"><td>우리 순위</td>${FACK.map(k=>`<td>${rank(k)}</td>`).join('')}<td>${rank('lv')}</td></tr>`:''}`;
  const H=[]; for(const r of rows)if(!r.mine)for(const h of (r.S.hist||[]))H.push({...h,t:r.t}); H.sort((a,b)=>b.d-a.d);
  const recent=H.slice(0,6).map(h=>`<li><span class="muted">${dobj(h.d).y}년 ${dmd(h.d)}</span> ${esc(h.t.city)} ${esc(h.t.nick)} · ${esc(FACI[h.k].lv[h.lv])} 착공 <span class="muted">${money(h.c)}${h.src==='cap'?' · 모기업 투자':''}</span></li>`).join('');
  return `<div class="eyebrow" style="margin-top:10px">리그 시설 비교</div>
    <table class="fcmp">${head}${body}${foot}</table>
    <p class="small muted">0~3단계. ↑는 공사 중입니다. 칸을 누르고 있거나 마우스를 올리면 시설 이름과 완공일이 보입니다. 다른 구단도 재정과 전략에 따라 시설에 투자합니다.</p>
    ${recent?`<details class="moreg"><summary><span>최근 다른 구단 시설 투자</span></summary><div class="moreb"><ul class="fcmp-l">${recent}</ul></div></details>`:''}`; }
Object.assign(A,{ facCmpSort(v){ UI.facCmp=v&&(v==='lv'||FACI[v])?v:'lv'; render(); } });
