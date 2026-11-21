/* 해외 활성화 5: 해외 리그 화면·해외파 인물 카드의 단추(관찰 등록/해제 · 영입 문의 · 구단 순위). 엔진은 35d_ovs_act(우리와 AI 구단이 같은 함수) */
const ovqId=v=>{ const n=+v; return Number.isFinite(n)&&String(n)===String(v)?n:v; };
Object.assign(A,{
  ovwT(v){ const r=ovwToggle(ovqId(v)); save(); if(UI.person)renderSheet(); render(); if(r&&typeof toast==='function')toast(r); },
  ovqAsk(v){ const r=ovsInquire(G.user,ovqId(v)); if(!r.p||r.why){ if(typeof toast==='function')toast(r.why||'지금은 문의할 수 없습니다.'); if(UI.person)renderSheet(); render(); return; }
    save(); if(typeof toast==='function')toast(`${r.p.name}이(가) 외국인 시장에 나왔습니다. 영입 협상 창을 엽니다.`); closeSheets(); UI.negWin={k:'fm',id:r.p.id}; render(); renderSheet(); },
  ovlTeam(v){ const [lg,c]=String(v).split(':'), ci=+c; UI.it=UI.it||{}; UI.it.ovlv='stand'; UI.it.ovls=lg; UI.it.ovlh='stand'; UI.ovlHi=lg+':'+ci; const ys=G.ovl&&G.ovl[lg]?ovlYears(lg):[]; if(ys.length)UI.it['ovly'+lg]=String(ys[0]); closeSheets(); A.go('league:ovs'); },
  ovlWp(v){ const e=wpsGet(v); if(!e)return; UI.it=UI.it||{}; UI.it.ovlv='world'; UI.it.wpsl=e.lg; UI.open=UI.open||{}; UI.open['wp_'+e.i]=true; UI.open[`wpc_${e.lg}_${e.c}`]=true; closeSheets(); A.go('league:ovs'); if(typeof workspaceReveal==='function')setTimeout(()=>workspaceReveal(`details.wp[data-k="wp_${e.i}"]`),0); } /* 리그 허브의 세계 주목 선수 → 세계 선수 탭에서 그 선수를 펼친다 */
});
