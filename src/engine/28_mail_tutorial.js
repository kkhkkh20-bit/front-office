/* ===== 메일 ===== */
const SEC='서하린';
const FROM={병역:'운영팀',엔트리:'감독실',언론:'홍보팀',구단주:'구단주실',부상:'팀 닥터 · 의무팀',복귀:'팀 닥터 · 의무팀',트레이드:'운영팀',일정:`비서 ${SEC}`,FA:'운영팀',연봉:'운영팀',결산:'구단주실',경기:'전력분석팀',기록:'홍보팀',월간:`비서 ${SEC}`,드래프트:'스카우트팀장',새해:`비서 ${SEC}`,캠프:'코칭스태프',스토브리그:`비서 ${SEC}`,외국인:'운영팀',포스트시즌:`비서 ${SEC}`,취임:`비서 ${SEC}`,면담:'선수단',감독:'운영팀',연수:'육성팀',의무:'팀 닥터 · 의무팀'};
const GOTO={구장:'구장',연봉:'연봉협상',드래프트:'신인드래프트',FA:'FA시장',결산:'시즌결산',캠프:'스프링캠프',감독:'감독',스토브리그:'FA시장',외국인:'외국인선수',용병:'외국인선수',트레이드:'트레이드'};
function mail(from,subj,body,o){ o=o||{}; if(G.unemp&&o.kind!=='경력'&&from!=='야인')return {read:true,acts:[]}; /* 야인일 때는 전 소속 구단 업무 메일을 받지 않는다 */
  { const d=G.mail.slice(0,60).find(x=>!x.read&&x.subj===subj&&x.body===body&&G.day-x.day<=7); if(d)return d; } /* 같은 소식이 아직 안 읽힌 채 있으면 다시 보내지 않는다 */
  const m={id:'m'+(G.mailSeq=(G.mailSeq||0)+1),day:G.day,from,subj,body,read:false,imp:!!o.imp,acts:o.acts||[],ref:o.ref??null,kind:o.kind||'일반',face:o.face??null};
  G.mail.unshift(m); mailPrune(); if(m.imp)G.stops.push(m); return m; }
/* 이미 보낸 소식을 다시 알릴 때: 새 소식을 만들지 않고 원래 소식을 오늘로 끌어올려 안 읽음으로 되돌린다 */
function mailBump(m,warn){ const i=G.mail.indexOf(m); if(i<0)return null; G.mail.splice(i,1); G.mail.unshift(m); if(m.day0==null)m.day0=m.day; m.day=G.day; m.read=false; m.imp=true; m.warn=warn||m.warn||''; G.stops.push(m); return m; }
/* 소식함 한도: 160건을 넘으면 오래된 '읽은' 소식부터 지운다. 안 읽은 소식은 남기고, 그래도 240건을 넘을 때만 가장 오래된 것을 지운다 */
function mailPrune(){ if(G.mail.length<=160)return; for(let i=G.mail.length-1;i>=0&&G.mail.length>160;i--)if(G.mail[i].read)G.mail.splice(i,1); if(G.mail.length>240)G.mail.length=240; }
function headline(t){ const i=t.search(/[.!?](\s|$)/); return i>0&&i<46?t.slice(0,i):t.length>40?t.slice(0,38)+'…':t; }
function kindActs(kind,ref){ const a=[]; if(ref!=null&&G.players[ref])a.push({l:'선수 보기',a:'player',v:ref}); if(GOTO[kind])a.push({l:'해당 화면으로',a:'goWork',v:GOTO[kind]}); return a; }
function stop(kind,t,ref){ mail(FROM[kind]||'프런트',headline(t),t,{imp:true,ref,kind,acts:kindActs(kind,ref),face:ref!=null&&kind!=='부상'?ref:null}); }
function note(kind,t,ref){ mail(FROM[kind]||'프런트',headline(t),t,{ref,kind,acts:kindActs(kind,ref)}); }

/* ===== 비서 업무 안내(튜토리얼) ===== */
const TUT=[
  {k:'welcome',title:'취임 인사',subj:'단장님, 취임을 축하드립니다',body:`비서 ${SEC}입니다. 구단에 보고되는 모든 소식은 이 소식함으로 옵니다. 일은 소식함에서 시작해 소식함에서 끝납니다.\n\n하루 흐름은 이렇습니다. 첫째, 새 소식을 읽습니다. 버튼이 있는 소식은 눌러서 처리하세요. 다른 화면으로 가면 제목 옆 '◀ 소식함으로'를 눌러 돌아오면 됩니다. 둘째, 다 읽었으면 스페이스바(또는 오른쪽 위 '계속')로 시간을 넘깁니다. 진행 전에 어디까지 갈지 한 번 묻습니다. 셋째, 시즌 중에는 중요한 소식이 생기거나 한 주가 끝날 때까지 경기를 몰아서 진행하고, 그 기간 경기 정리를 소식으로 남깁니다. 한 경기씩 보려면 '1경기 진행'을 누르세요.\n\n스페이스바만 눌러도 소식을 차례로 읽고 진행할 수 있습니다.`,check:()=>true},
  {k:'mgr',title:'감독 선임',subj:'감독 자리가 비어 있습니다',body:'사령탑이 빈자리입니다. 외국인 선수보다 감독을 먼저 정하시길 권합니다. 감독이 와야 어떤 외국인이 필요한지 함께 상의할 수 있습니다. 개막 전까지는 반드시 선임해야 합니다.\n\n감독마다 성향이 다릅니다. 스몰볼 감독은 도루와 작전을 많이 쓰고, 불펜을 적극 쓰는 감독은 선발을 일찍 내립니다. 육성형 감독은 젊은 선수 성장을 돕고, 장악력이 강한 감독은 선수단 분위기를 안정시킵니다. 연봉이 높을수록 경기 운영 능력이 좋은 편입니다. 감독을 뽑은 뒤에는 홈의 감독실에서 팀 상황과 원하는 외국인 선수를 자주 물어보세요. 감독이 원한 유형은 외국인 시장에 "감독 선호"로 표시됩니다.',btn:'감독 후보 보기',go:['goWork','감독'],check:()=>!!G.mgr[G.user]},
  {k:'foreign',title:'외국인 선수 구성',subj:'외국인 선수를 구성하세요',body:'외국인 선수 네 자리가 모두 비어 있습니다. 외국인 선수 3명과 아시아쿼터 1명을 채울 수 있습니다.\n\n감독실에 들러 어떤 유형이 필요한지 먼저 물어보세요. 후보 카드의 감독 의견 버튼을 누르면 감독이 그 선수를 어떻게 보는지 들을 수 있습니다.\n\n보통은 선발 투수 2명과 타자 1명으로 구성합니다. 규정상 3명을 모두 투수나 모두 타자로 채울 수는 없습니다. 신규 계약은 1인 100만 달러, 아시아쿼터는 20만 달러까지이고, 외국인 선수 3명 합계는 400만 달러를 넘을 수 없습니다.\n\n화면 위쪽에서 외국인과 아시아쿼터 탭이 나뉩니다. 후보 정보가 얼마나 정확한지는 그 나라에 우리 스카우트망이 얼마나 있느냐에 달려 있습니다. 지금은 미국에만 현지 통신원이 있고, 나머지 지역은 에이전트 자료뿐입니다. 스카우팅 메뉴의 해외 스카우트망에서 지역별로 늘릴 수 있습니다.\n\n지난 리그 기록은 리그 수준 차이를 감안해서 보세요.',btn:'외국인 후보 보기',go:['goWork','외국인선수'],check:()=>{const f=foreignOf(G.user); return f.filter(p=>p.foreign==='용병').length>=3&&f.some(p=>p.foreign==='아시아');},prog:()=>{const f=foreignOf(G.user); return `외국인 ${f.filter(p=>p.foreign==='용병').length}/3 · 아시아쿼터 ${f.filter(p=>p.foreign==='아시아').length}/1`;}},
  {k:'med',from:'팀 닥터 · 의무팀',title:'의무 체계',subj:'부상 방지 프로그램과 병원 제휴를 정해 주세요',body:'의무팀에서 올 시즌 운영안을 올렸습니다. 부상 방지 프로그램 단계가 높을수록 부상이 줄고, 제휴 병원이 좋을수록 재활 기간이 짧아집니다. 종합 스포츠의학센터와 제휴하면 정밀 검진으로 선수의 부상 체질도 알 수 있습니다.\n\n비용은 하루 단위로 쌓여 시즌 결산 때 나갑니다.',btn:'의무 운영안 보기',go:['goWork','부상방지·병원'],check:()=>!!G.medSet},
  {k:'dev',from:'육성팀',title:'선수 육성',subj:'훈련 방향과 해외 연수 안내',body:'육성팀입니다. 선수들의 훈련 주안점(구위·제구·장타·수비 등)은 감독과 코치진이 상의해 정합니다. 단장님은 선수 정보의 육성 탭이나 스태프·육성 > 훈련·육성에서 바꿔 달라고 요청할 수 있습니다.\n\n성장 속도는 1군 출장, 잠재력과 성장 의지, 훈련 시설, 코치 수준에 따라 다릅니다.\n\n가을에는 교육리그(일본 미야자키·국내 울산)와 호주리그 파견, 미국·일본 단기 연수 같은 해외 연수를 보낼 수 있습니다. 돈이 들고 결과는 선수마다 크게 갈립니다.',btn:'선수 육성 보기',go:['goWork','2군연수'],check:()=>Object.keys(G.trn||{}).length>=1},
  {k:'scout',from:'스카우트팀장',title:'스카우트 공백',subj:'스카우트 담당 지역에 공백이 있습니다',body:'스카우트팀장입니다. 스카우트는 한 사람이 한 가지 업무만 맡습니다. 아마추어(지역 고교·대학 선수), 프로(그 지역 연고 구단 선수), 해외(외국인 선수 시장) 중 하나입니다. 최대 6명까지 둘 수 있으니, 드래프트를 위해 먼저 수도권·영남·호남·충청 세 지역에 아마추어 스카우트를 배치해 주세요. 업무를 바꾸면 30일 동안 적응 기간이 있습니다.',btn:'스카우트 팀 보기',go:['goWork','스카우트팀'],check:()=>new Set(G.scouts.filter(s=>(s.role||'am')==='am').map(s=>s.region)).size>=3},
  {k:'lineup',from:'코칭스태프',title:'배치 확인',subj:'감독이 정한 선수단 배치를 확인해 주세요',body:'선수단 탭에서 야구장 그림으로 포지션별 주전을 볼 수 있습니다. 주전 기용과 타순, 투수 운용은 감독 권한입니다. 단장은 선수 구성과 감독 선임으로 팀을 바꿉니다. 자리를 누르면 그 포지션 후보를 비교해 볼 수 있습니다.',btn:'선수단 보기',go:['tab','roster'],check:()=>!!(G.tutFlags&&G.tutFlags.roster)||(G.cal&&G.day>G.cal.open+7)},
  {k:'go',title:'캠프 준비',subj:'개막 준비가 끝났습니다',body:'기본 업무 안내는 여기까지입니다. 소식함의 확인할 소식과 홈의 처리할 일(코치 빈자리 등)을 마저 정리하고 스페이스바로 시간을 넘겨 보세요. 1월 25일에 스프링캠프가 시작되면 훈련 방향을 정해 주셔야 합니다.\n\n그 밖에 비FA 다년계약과 트레이드는 영입·계약 메뉴, 마케팅 예산은 구단·재정 메뉴에서 언제든 볼 수 있습니다.',btn:'캠프까지 넘기기',go:['adv','next'],check:()=>G.day>=G.cal.camp},
];
function sendTut(){ const s=TUT[G.tut.step]; mail(s.from||`비서 ${SEC}`,s.subj,s.body,{kind:'업무',acts:s.btn?[{l:s.btn,a:s.go[0],v:s.go[1]}]:[],face:s.from?null:'sec'}); }
function tutTick(){
  const t=G.tut; if(!t||t.done)return; if(G.fdWait||(G.fd&&!G.fd.done))return; if(G.cal&&G.day>G.cal.end){ t.done=true; return; } /* 시즌이 끝나면 첫해 안내는 정리한다 */
  let guard=0;
  while(guard++<12&&!t.done){ const s=TUT[t.step]; if(!s.check())break;
    if(s.k!=='welcome'&&s.k!=='go'){ const m=mail(`비서 ${SEC}`,`완료: ${s.title}`,`${s.title} 업무가 끝났습니다. 다음 업무를 안내해 드리겠습니다.`,{kind:'업무',face:'sec'}); m.read=true; }
    t.step++; if(t.step>=TUT.length){ t.done=true; mail(`비서 ${SEC}`,'업무 안내를 마칩니다','기본 업무 안내를 모두 마쳤습니다. 앞으로도 중요한 소식은 이곳으로 보내 드리겠습니다. 좋은 시즌 되십시오.',{kind:'업무',face:'sec'}); break; }
    sendTut(); }
}
function tutSkip(){ const t=G.tut; if(!t||t.done)return; t.step++; if(t.step>=TUT.length){t.done=true;return;} sendTut(); }

