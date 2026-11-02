/* ---------- 감독이 먼저 찾아온다: 시즌 중 2~3주에 한 번 단장실 방문, 비시즌엔 외국인 구성 상의 ---------- */
function mgrVisit(){ const m=G.mgr[G.user]; if(!m||m.interim||G.unemp||G.gameOver)return; const per=period(); const last=G.mgrVisitD??-99;
  if(per==='season'){ if(G.day-last<14||R()>.12)return; G.mgrVisitD=G.day; mgrAttr(m);
    const a=mgrNowTalk(m); if(!a)return;
    mail('감독실',`${m.name} 감독이 단장실에 들렀습니다`,`${m.name} 감독: "${a}"\n\n더 이야기하려면 감독실로 가세요. 자주 의논할수록 감독과의 관계가 좋아집니다.`,{kind:'감독',acts:[{l:'감독실 들어가기',a:'meetOpen',v:'mgr'}]}); return; }
  if(!foreignOpen()||per==='post')return; const yb=foreignOf(G.user).filter(p=>p.foreign==='용병').length; if(yb>=3||G.day-last<20)return;
  const W=mgrWantForeign(); if(!W||!W.want)return; G.mgrVisitD=G.day;
  mail('감독실',`${m.name} 감독: "외국인 이야기 좀 하시죠"`,`${m.name} 감독: "${W.txt} 후보 명단을 같이 보면서 정하고 싶습니다."\n\n외국인 ${yb}/3명. 감독실에서 후보별 의견을 들을 수 있습니다.`,{kind:'감독',acts:[{l:'감독실에서 후보 상의',a:'meetOpen',v:'mgr|cand'},{l:'외국인 후보 보기',a:'goWork',v:'외국인선수'}]}); }
