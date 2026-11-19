/* 플레잉코치(99c_playing_coach): 선수 화면 배지·코칭 수치, 선수 화면 행동(제안·해제) */
function pcBadge(p){ const r=p&&pcLive(p); return r?` <span class="pill acc pc-tag" title="지도 ${dv(r.sk)} · 육성 ${dv(r.dv)}">플레잉코치 (${r.isP?'투수':'야수'}${pcIdleTxt(p,r)?' · '+pcIdleTxt(p,r):''})</span>`:''; }
/* 현재 상태 칸 한 줄: 코칭 지도·육성(주전이면 효과가 줄어드는 것은 코치진 화면에서) */
function pcBio(p,row){ const r=p&&pcLive(p); if(!r)return ''; return row('코칭',`지도 ${dv(r.sk)} · 육성 ${dv(r.dv)}`); }
/* 선수 화면 '플레잉코치 제안'(카페 랄프111112 11-19 '어디서 하나여'): 33세 이상 우리 국내 선수면 시즌 중에도 늘 보인다.
   지금 제안할 수 없으면 꺼진 모양(aria-disabled)에 이유를 붙인다: title(마우스), ⋯ 메뉴는 항목 아래 한 줄, 누르면 이유를 알림 줄로(휴대폰은 hover가 없다). 규칙은 pcWhy 그대로 */
function pcWhyTxt(p){ const w=pcWhy(p,G.user); return w?w+(pcOffWin()?'':' 시즌이 끝난 뒤(스토브리그)부터 개막 전까지 이 버튼으로 제안합니다.'):''; }
function pcActItem(p){ const w=pcWhyTxt(p); return w?{a:'pcWhyTip',v:p.id,l:'플레잉코치 제안 (지금 불가)',s:w,title:w,off:true}:{a:'pcOffer',v:p.id,l:'플레잉코치 제안',title:'보조 코치 한 자리를 쓰고, 같은 쪽(투수/야수) 선수 성장을 조금 돕습니다'}; }
Object.assign(A,{
  pcWhyTip(v){ const p=G.players[+v]; const w=p?pcWhyTxt(p):''; if(!w){ render(); try{ if(UI.sheet!=null)renderSheet(); }catch(e){} return; } toast('플레잉코치 제안: '+w); },
  pcOffer(v){ const r=pcOffer(+v); toast(r.msg); save(); render(); try{ if(UI.sheet!=null)renderSheet(); }catch(e){} },
  pcStop(v){ const why=pcStop(+v); toast(why||'플레잉코치 역할을 끝냈습니다. 보조 코치 자리 하나가 비었습니다.'); save(); render(); try{ if(UI.sheet!=null)renderSheet(); }catch(e){} }
});
