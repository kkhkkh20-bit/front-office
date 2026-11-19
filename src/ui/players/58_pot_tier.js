/* 잠재력 표시: 숫자 대신 스카우트 등급 말 + 말풍선에 근거와 변수 */
function potChip(rp,p){ if(!rp||rp.ofp==null)return '<span class="ptier q" title="담당 스카우트가 없어 잠재력을 판단할 수 없습니다">판단 불가</span>'; const T=potTierP(rp,p);
  return `<span class="ptier t${T.n}" data-tip="${esc((p?potLine(p,rp):T.l)+'\n\n'+POT_HELP)}">${potStars(T.st)}</span>`; }

/* 우리가 지명한 선수(지명 직후, 합류 전 포함)의 리포트 표시: 값은 기존 규칙(scoutReport의 지명 당시 평가 유지) 그대로 두고,
   화면 문구만 우리 기존 선수와 같은 꼴로(구단주 11-19: "평가가 어떻다느니 이런 건 왜 나와? 이제 실전인데"). 아마추어 스카우트의 '지명 당시 평가(현재 관찰과 구분)'·'지명 당시에는 … 기대' 문장을 내지 않는다 */
function rpOwnView(p,rp){ if(!rp||!p||!G||p.team!==G.user||p.prospect||!rp.draftEstimate)return rp; let sc=null; try{ sc=bestScout(); }catch(e){} return Object.assign({},rp,{who:`전력분석팀·${sc?`${sc.name} 스카우트`:'코치진'} 합동 · 우리 팀에서 관찰 시작`,notes:(rp.notes||[]).filter(n=>!/지명 당시|과거 지명 평가/.test(n))}); }
/* 이름 옆 잠재력 칩(계약·연봉 협상·무적 선수 목록, 카페 피드백 11-08) */
function potChipP(p){ try{ return ' '+potChip(rpOwnView(p,scoutReport(p)),p); }catch(e){ return ''; } }

/* 별 그림: 회색 별 5개 위에 금색 별을 비율만큼 덮는다(반 칸) */
function potStars(st){ if(st==null)return ''; return `<span class="pst" aria-label="별 ${st}개"><i class="pst-fill" aria-hidden="true" style="width:${st*20}%">★★★★★</i>★★★★★</span>`; }
/* 현재와 잠재력은 같은 내부 등급표로 비교한다. 화면 환산점수를 다시 별로 바꾸지 않는다. */
function currentAbilityStars(rp){ const known=rp&&typeof rp.cur==='number'&&isFinite(rp.cur),label=rp&&rp.exact?'현재 능력':'현재 능력 · 스카우트 추정'; return `<span class="current-rating-stars" data-tip="${esc(label+'\n\n'+POT_HELP)}" aria-label="${esc(label)}">${known?potStars(potStarN(rp.cur)):'?'}</span>`; }

/* 1년 전 대비 종합 능력 증감(카페 11-18: 지난 시즌 대비 증감을 다시 보고 싶다). 우리 선수만, 매달 남기는 능력치 기록(rmBase '1y')과 비교.
   1년 치 기록이 없으면 가장 오래된 기록과 비교하고, 말풍선에 기준 날짜를 적는다 */
function yrDelta(p){ if(!p||p.team!==G.user||p.prospect||!p.r)return null; const b=typeof rmBase==='function'?rmBase(p,'1y'):null; if(!b||b.d>=G.day)return null; const o=dv(ovr({isP:p.isP,r:b.r})), n=dv(ovr(p)); return {x:n-o,o,n,from:b.d}; }
function yrDTag(p,cls){ const D=yrDelta(p); if(!D||!D.x)return ''; const up=D.x>0; return `<i class="ovd pf-dl ${up?'up':'dn'}${cls?' '+cls:''}" title="${esc(`${dsh(D.from)} 대비 종합 ${D.o} → 지금 ${D.n}`)}" aria-label="${esc(`${dsh(D.from)} 대비 ${up?'상승':'하락'} ${Math.abs(D.x)}`)}">${up?'+':'−'}${Math.abs(D.x)}</i>`; }

/* 목록 줄의 능력 칸(카페 11-19): 색 꼬리표 · 컨디션 · 1년 전 대비 증감을 저마다 폭이 정해진 자리에 놓는다. 증감·컨디션이 없는 줄도 자리는 남아 꼬리표가 한 줄로 선다.
   선수 명단 '현재' 열 · 엔트리 관리 · 트라이아웃이 같이 쓴다. solo는 컨디션·증감이 있을 수 없는 목록(계약 전 선수)용: 꼬리표 자리만 */
function abilSlots(tag,cond,delta,solo){ return `<span class="abc${solo?' abc-solo':''}"><span class="abc-t">${tag}</span>${solo?'':`<span class="abc-c">${cond||''}</span><span class="abc-d">${delta||''}</span>`}</span>`; }
function abilCell(p,rp){ rp=rp||scoutReport(p); return abilSlots(rchipG(rp.cur,rp.exact),condChip(p),yrDTag(p)); }
/* 꼬리표 + 잠재력 별(이름 옆에 붙이는 묶음) */
function abilPot(p,rp){ rp=rp||scoutReport(p); return `<span class="abp">${abilCell(p,rp)}${potChip(rp,p)}</span>`; }
