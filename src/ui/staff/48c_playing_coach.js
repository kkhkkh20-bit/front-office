/* 플레잉코치(99c_playing_coach): 선수 화면 배지·코칭 수치, 선수 화면 행동(제안·해제) */
function pcBadge(p){ const r=p&&pcLive(p); return r?` <span class="pill acc pc-tag" title="지도 ${dv(r.sk)} · 육성 ${dv(r.dv)}">플레잉코치 (${r.isP?'투수':'야수'})</span>`:''; }
/* 현재 상태 칸 한 줄: 코칭 지도·육성(주전이면 효과가 줄어드는 것은 코치진 화면에서) */
function pcBio(p,row){ const r=p&&pcLive(p); if(!r)return ''; return row('코칭',`지도 ${dv(r.sk)} · 육성 ${dv(r.dv)}`); }
Object.assign(A,{
  pcOffer(v){ const r=pcOffer(+v); toast(r.msg); save(); render(); try{ if(UI.sheet!=null)renderSheet(); }catch(e){} },
  pcStop(v){ const why=pcStop(+v); toast(why||'플레잉코치 역할을 끝냈습니다. 보조 코치 자리 하나가 비었습니다.'); save(); render(); try{ if(UI.sheet!=null)renderSheet(); }catch(e){} }
});
