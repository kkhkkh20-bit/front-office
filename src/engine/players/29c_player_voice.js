/* ===== 선수 면담 말투와 쓸모 있는 고민(사용자 11-14: "대화가 너무 반복되면 지루하다. 도움 되는 정보를 주게") =====
   1) 말투: 성향(프로의식·야망·충성심·예민도)·나이·연차·외국인 여부로 선수마다 정해진 말투 하나(pvVoice). 같은 결과라도 말투마다 다른 문장.
   2) 상황: 최근 10경기(투수는 최근 등판) 기록, 보직(주전·벤치·2군), FA·계약, 부상 복귀, 이적 직후, 고향 팀, 약속, 팀 연승·연패를 문장에 넣는다.
   3) 반복 피하기: 선수마다 최근 4개 문장 번호(p.pvM)를 저장해 다시 고르지 않고, 리그 전체로도 바로 앞 문장(G.pvLast)은 피한다.
   4) 고민 묻기는 실제 상태에서 고민을 꺼낸다(출전·약속·트레이드 명단·다른 구단 관심·군 문제·FA·이적 적응·부상·피로·타격감·자리 경쟁).
      친분이 낮고 말수가 적은 선수는 같은 고민을 두루뭉술하게 말한다(사실은 같다). 숨은 능력치는 숫자로 말하지 않는다.
   효과(기분 변화·약속·분발)는 29_mood.js talk()가 정하고, 여기서는 문장만 고른다. 고르는 데 경기 난수(R)는 쓰지 않는다 */
const PV_LABEL={rookie:'신인(긴장)',leader:'베테랑 리더',vet:'베테랑',bold:'자신감형',touchy:'예민형',quiet:'과묵형',foreign:'외국인',plain:'성실형'};
function pvVoice(p){ const s=p&&p.pers||{}, a=p&&p.age||25;
  if(p.foreign)return 'foreign';
  if(a<=22||(a<=24&&(p.svc||0)<=1))return 'rookie';
  if((s.temp||0)>=15)return 'touchy';
  if(a>=31&&((s.pro||0)>=12||(s.loy||0)>=13))return 'leader';
  if((s.amb||0)>=14)return 'bold';
  if(a>=31)return 'vet';
  if((s.temp||10)<=7&&(s.amb||10)<=11)return 'quiet';
  return 'plain'; }
/* 최근 기록(보이는 기록만): 타자 최근 10경기, 선발 최근 3경기, 불펜 최근 5경기 */
function pvForm(p){ const G0=p&&p.gl&&p.gl.y===G.year?p.gl.g||[]:[]; if(!G0.length)return {k:null,t:''};
  if(p.isP){ const sp=isSPr(p), L=G0.slice(sp?-3:-5); const outs=sum(L.map(x=>x[2]||0)), er=sum(L.map(x=>x[7]||0)); if(outs<(sp?24:9))return {k:null,t:''};
    const era=er*27/outs, t=`최근 ${L.length}경기 ${ipStr(outs)}이닝 ${er}자책`; return {k:era<=2.4?'hot':era>=6.5?'cold':null,t}; }
  const L=G0.slice(-10); const ab=sum(L.map(x=>x[2]||0)), h=sum(L.map(x=>x[3]||0)), hr=sum(L.map(x=>x[7]||0)); if(ab<20)return {k:null,t:''};
  const avg=h/ab, t=`최근 ${L.length}경기 ${ab}타수 ${h}안타${hr?` ${hr}홈런`:''}`; return {k:avg>=.34||(hr>=3&&avg>=.26)?'hot':avg<=.19?'cold':null,t}; }
/* 최근 부상에서 돌아왔나(복귀 14일 안) */
function pvInjBack(p){ if(!p||p.injOut>0)return false; const h=(p.injHist||[]).slice(-1)[0]; if(!h||h.d==null)return false; const back=h.d+(h.days||0); return back<=G.day&&G.day-back<=14; }
/* 이적해 온 지 30일 안: 데려온 구단 이름 */
function pvTradeIn(p){ const a=p&&p.acq; if(!a||a.tid!==G.user||G.day-a.d>30||a.k==='draft'||a.k==='fd')return null; return a.from!=null?tshort(a.from):''; }
function pvTeamNow(){ const L=(G.sea&&G.sea.tl&&G.sea.tl[G.user])||[]; let k=0; const s0=L.length?L[L.length-1][0]:0; for(let j=L.length-1;j>=0&&L[j][0]===s0&&s0!==0;j--)k++; const r=G.sea&&G.sea.rec&&G.sea.rec[G.user]; const n=r?r.w+r.l:0;
  return {st:s0>0?k:s0<0?-k:0,bad:!!(r&&n>20&&r.w/n<.44),good:!!(r&&n>20&&r.w/n>=.56)}; }
/* 다른 구단이 이 선수를 원한다는 실제 신호: 받은 트레이드 제안에 이름이 있다 */
function pvWanted(p){ return (G.offers||[]).some(o=>o&&o.from!==G.user&&[...(o.give||[]),...(o.get||[])].includes(p.id)); }
/* 같은 포지션 주전(벤치 야수에게 자리를 막고 있는 선수) */
function pvBlocker(p){ if(!p||p.isP)return null; try{ const d=depth(G.user); const q=d.ln[p.pos]; return q&&q.id!==p.id?q:null; }catch(e){ return null; } }
function pvCtx(p,ev){ const c={nm:p.name,isP:!!p.isP,nx:p.isP?'등판':'경기',at:p.isP?'마운드':'타석',ev:ev?ev.t:'',role:'',reg:true,e2:false,form:{k:null,t:''},faY:null,injBack:false,trade:null,home:'',prom:null,promUntil:'',team:{st:0},star:false,cap:false};
  try{ const per=period(), live=per==='season'||per==='post'; c.role=squadRole(p)||''; c.reg=!live||isRegular(p)||playedReg(p); c.e2=entryOn()&&!p.e1&&!(p.injOut>0); c.form=pvForm(p);
    c.faY=!p.foreign&&!p.faC?Math.max(0,faSvc(p)-(p.svc||0)):null; c.injBack=pvInjBack(p); c.trade=pvTradeIn(p); const h=homeTie(p,G.user); c.home=h?h.sch||'고향':'';
    if(p.promise){ c.prom=playPromKept(p)?'kept':'wait'; c.promUntil=dmd(p.promise.until); } c.team=pvTeamNow(); c.star=ovr(p)>=55||(p.sal||0)>=500; c.cap=team(G.user).cap===p.id; }catch(e){}
  return c; }
/* 상황 문장 표시: pvS(f)는 상황이 맞을 때만 나오는 문장(고를 때 세 배로 무겁다) */
const pvS=f=>({s:1,f});
/* 문장 고르기: 맞는 후보 중 이 선수 최근 4개·리그 바로 앞 문장은 빼고, 상황 문장을 먼저. 후보: {id,s,f} */
function pvPick(p,key,cands,c){ const L=[]; for(const x of cands){ const t=typeof x.f==='function'?x.f(c):x.f; if(t)L.push({id:x.id,t,w:x.s?3:1}); }
  if(!L.length)return null; const M=p.pvM||[]; let P=L.filter(x=>!M.includes(x.id)&&x.id!==G.pvLast); if(!P.length)P=L.filter(x=>x.id!==G.pvLast); if(!P.length)P=L;
  const n=p.pvN||0; let r=u01('pv:'+p.id+':'+key+':'+n,G.day)*sum(P.map(x=>x.w)), x=P[P.length-1]; for(const y of P){ r-=y.w; if(r<=0){ x=y; break; } }
  p.pvN=(n+1)%9973; p.pvM=[x.id,...M.filter(i=>i!==x.id)].slice(0,4); G.pvLast=x.id; return x.t; }
/* 말투별 후보 + 모두 쓰는 후보(all). 후보마다 고유 번호(key.말투.순번) */
function pvCands(bank,v,key){ const B=bank||{}, out=[]; for(const g of [v,'all'])(B[g]||[]).forEach((x,i)=>{ const isS=!!(x&&typeof x==='object'&&x.s); out.push({id:key+'.'+g+'.'+i,s:isS?1:0,f:isS?x.f:x}); }); return out; }
function pvFrom(p,bank,key,c){ return pvPick(p,key,pvCands(bank,pvVoice(p),key),c); }
/* ---- 결과별 문장 은행: 키는 talk()의 결과(칭찬이 먹힘·분발 거부 등), 안쪽 키는 말투 ---- */
const PV_BANK={
  pr_good:{
    all:['고맙습니다. 계속 잘하겠습니다.',pvS(c=>c.form.k==='hot'?`${c.form.t}. 감이 좋을 때 더 조심하겠습니다. 감사합니다.`:''),pvS(c=>c.home?`${c.home} 시절 친구들이 다 보고 있어서 더 힘이 납니다. 감사합니다.`:''),
      pvS(c=>c.trade!=null?`${c.trade||'전 팀'}에 있을 때보다 마음이 편해서 그런가 봅니다. 데려와 주셔서 감사합니다.`:''),pvS(c=>c.injBack?'다치고 돌아와서 걱정 많았는데 이제 몸이 따라옵니다. 감사합니다.':'')],
    rookie:['가, 감사합니다! 들뜨지 않고 더 열심히 하겠습니다!','단장님께서 직접 말씀해 주시니... 정말 감사합니다. 하던 대로 하겠습니다.',pvS(c=>c.form.k==='hot'?`${c.form.t}... 저도 아직 실감이 안 납니다. 운이 아니라는 걸 보여 드리겠습니다.`:'')],
    leader:['고마워요, 단장님. 후배들이 잘 받쳐 줘서 그렇습니다.','칭찬은 감사히 받겠습니다. 어린 친구들한테도 한마디 해 주시면 더 좋고요.',pvS(c=>c.team.st>=3?`${c.team.st}연승 중이라 덕아웃이 신났어요. 이럴 때 제가 더 중심을 잡겠습니다.`:'')],
    vet:['이 나이에 칭찬 들으니 쑥스럽네요. 그래도 기분은 좋습니다.','하하, 오래 하다 보니 이런 날도 오네요. 감사합니다.'],
    bold:['감사합니다. 원래 이 정도는 해야죠. 아직 보여 드릴 게 남았습니다.','지금 감이면 누구 공이든 자신 있습니다. 계속 내보내 주시기만 하면 됩니다.',pvS(c=>c.form.k==='hot'?`${c.form.t}. 이 정도는 시즌 끝까지 할 수 있습니다.`:'')],
    touchy:['감사합니다... 사실 언제 떨어질지 몰라 불안했는데, 그 말씀 들으니 좀 놓입니다.','잘될 때가 더 무섭습니다. 그래도 말씀 감사합니다.'],
    quiet:['감사합니다.','네. 계속하겠습니다.',pvS(c=>c.form.k==='hot'?`${c.form.t}... 운도 따랐습니다. 감사합니다.`:'')],
    foreign:['고마워요, 단장님. 한국 야구에 점점 익숙해지고 있어요.','감사합니다. 팀이 이기는 게 제일 좋아요.',pvS(c=>c.form.k==='hot'?`${c.form.t}. 요즘 공이 잘 보여요. 계속 이렇게 할게요.`:'')],
    plain:['감사합니다. 들뜨지 않고 하던 대로 하겠습니다.','말씀 감사합니다. 힘이 납니다.']},
  pr_bad_t:{
    all:['요즘 못하는 건 저도 압니다. 빈말은 괜찮습니다.','지금 제 성적에 칭찬은 오히려 부담됩니다.',pvS(c=>c.form.k==='cold'?`${c.form.t}인데 칭찬은 좀... 위로라면 괜찮습니다.`:'')],
    touchy:['...그런 말씀 들으면 더 작아집니다. 차라리 그냥 두세요.','못하는 거 다 압니다. 괜히 신경 쓰시게 해서 죄송합니다.'],
    rookie:['아... 감사하긴 한데, 지금은 그런 말씀 들을 때가 아닌 것 같습니다.']},
  pr_bad:{
    all:['감사합니다. 분발하겠습니다.',pvS(c=>c.form.k==='cold'?`${c.form.t}(이)라 면목이 없습니다. 그래도 말씀 감사합니다.`:'')],
    rookie:['감사합니다! 요즘 부족한데... 꼭 보답하겠습니다.'],
    leader:['못할 때 그런 말씀 해 주시니 고맙네요. 고참이 먼저 살아나야죠.'],
    vet:['요즘 영 안 맞는데도 챙겨 주시네요. 곧 올라옵니다. 몇 년 해 봐서 압니다.'],
    bold:['지금 기록은 신경 안 씁니다. 곧 원래대로 돌아갑니다. 믿어 주셔서 감사합니다.'],
    quiet:['...감사합니다. 분발하겠습니다.'],
    foreign:['고마워요. 요즘 잘 안 되는데, 계속 노력하고 있어요.']},
  pr_mid:{
    all:['감사합니다. 힘이 됩니다.',pvS(c=>c.e2?'2군에 있어도 지켜봐 주신다니 힘이 납니다.':''),pvS(c=>!c.reg&&!c.e2?'자주 못 나가는데도 신경 써 주셔서 감사합니다.':''),pvS(c=>c.team.st<=-3?`${-c.team.st}연패라 다들 처져 있었는데, 그 말씀 전하겠습니다.`:'')],
    rookie:['감사합니다! 더 열심히 하겠습니다!','아, 감사합니다... 아직 보여 드린 것도 없는데요.'],
    leader:['고마워요. 그 말씀은 선수단에도 전하겠습니다.'],
    vet:['허허, 무슨 좋은 일 있으세요? 감사히 받겠습니다.'],
    bold:['감사합니다. 더 큰 걸로 보답하겠습니다.'],
    touchy:['감사합니다. 사실 요즘 제가 잘하고 있는 건지 잘 몰랐는데, 힘이 됩니다.'],
    quiet:['감사합니다.'],
    foreign:['고마워요, 단장님. 오늘 기분 좋네요.'],
    plain:['말씀만으로도 힘이 납니다. 감사합니다.']},
  /* 칭찬이 잦아 효과가 줄었을 때: cap 이미 충분히 좋음, rep2 자꾸 칭찬, rep1 지난번에도(앞 문장 뒤에 붙인다) */
  pr_cap:{all:['말씀은 감사합니다. 지금도 충분히 좋습니다.','요즘 기분은 더 좋을 수가 없습니다. 걱정 안 하셔도 됩니다.'],quiet:['지금 좋습니다. 감사합니다.'],foreign:['나는 지금 아주 좋아요. 걱정 마세요.'],bold:['지금보다 더 좋을 수는 없습니다. 경기로 보여 드리죠.']},
  pr_rep2:{all:['자꾸 그러시면 민망합니다. 경기로 보여 드리겠습니다.','이러다 버릇 나빠지겠습니다. 이제 경기로 말하겠습니다.'],rookie:['아, 자꾸 칭찬해 주시면... 몸 둘 바를 모르겠습니다.'],vet:['허허, 요즘 칭찬을 너무 자주 들어서 이제 됐습니다.'],foreign:['또요? 고마워요. 이제 경기로 보여 줄게요.']},
  pr_rep1:{all:['지난번에도 같은 말씀을 해 주셨습니다.','지난번에 해 주신 말씀도 기억하고 있습니다.'],quiet:['지난번에도 들었습니다.']},
  pu_ok:{
    all:['맞는 말씀입니다. 훈련량을 늘리겠습니다.',pvS(c=>c.form.k==='cold'?`${c.form.t}... 핑계 없습니다. ${c.isP?'불펜 피칭':'특타'}부터 다시 하겠습니다.`:'')],
    rookie:['네! 내일부터 제일 먼저 나와서 훈련하겠습니다!'],
    leader:['제가 먼저 특훈 자청하겠습니다. 후배들 보는 눈도 있으니까요.'],
    vet:['알겠습니다. 오랜만에 젊은 애들처럼 땀 좀 흘려 보죠.'],
    bold:['자존심은 상하지만 맞는 말씀입니다. 바로 돌려놓겠습니다.'],
    touchy:['...네. 저도 밤에 잠이 안 옵니다. 더 하겠습니다.'],
    quiet:['알겠습니다. 더 하겠습니다.'],
    foreign:['알아요. 코치님이랑 영상 더 보면서 고칠게요.']},
  pu_no:{
    all:['저도 최선을 다하고 있습니다.'],
    rookie:['...죄송합니다. 그런데 저도 정말 하고 있습니다.'],
    leader:['저도 하는 데까지 하고 있어요. 다그치는 것보다 믿어 주는 게 낫습니다.'],
    vet:['이 나이에 그런 말 들으니 좀 서운하네요. 저도 하고 있습니다.'],
    bold:['저도 압니다. 몰아붙인다고 더 잘되는 건 아닙니다.'],
    touchy:['...안 그래도 힘든데 그런 말씀까지 들으니 더 답답합니다.'],
    quiet:['...하고 있습니다.'],
    foreign:['나도 노력하고 있어요. 조금 시간이 필요해요.']},
  pu_unfair:{
    all:['제가 뭘 더 해야 합니까? 납득하기 어렵습니다.',pvS(c=>c.form.k==='hot'?`${c.form.t}인데 분발하라고요? 납득하기 어렵습니다.`:'')],
    rookie:['네? 제가... 뭘 놓쳤는지 모르겠습니다.'],
    leader:['단장님, 그 말씀은 선수단 앞에서는 하지 마십시오. 저도 납득이 안 됩니다.'],
    vet:['허허, 이건 좀 아니지 않습니까. 제 기록 한번 보시죠.'],
    bold:['지금 저보다 잘하는 선수가 몇이나 됩니까? 납득이 안 됩니다.'],
    touchy:['제가 뭘 잘못했나요? 갑자기 그런 말씀을 들으니 당황스럽습니다.'],
    quiet:['...이유를 모르겠습니다.'],
    foreign:['왜요? 나는 잘하고 있다고 생각해요. 이해가 안 돼요.']},
  pm_reg:{
    all:['이미 주전으로 뛰고 있습니다. 마음만 받겠습니다.',pvS(c=>c.role?`지금도 ${c.role} 자리에서 뛰고 있습니다. 마음만 받겠습니다.`:'')],
    leader:['저는 충분히 뛰고 있어요. 그 말씀은 벤치에 있는 후배들한테 해 주세요.'],
    bold:['이미 주전입니다. 그 기회는 다른 친구한테 써 주세요.'],
    foreign:['나는 매일 나가고 있어요. 고마워요.'],
    quiet:['지금도 나가고 있습니다.']},
  pm_dup:{
    all:['지난번 약속부터 지켜 주세요.',pvS(c=>c.promUntil?`${c.promUntil}까지 기다려 보기로 했잖아요. 그 약속부터 지켜 주세요.`:'')],
    touchy:['또 말씀만 하시는 건 아니죠? 지난번 약속부터 봐야겠습니다.'],
    quiet:['...지난번 약속부터요.'],
    foreign:['지난번에도 말했어요. 먼저 그 약속을 기다릴게요.']},
  pm_new:{
    all:['감독님께 말씀해 주신다니 감사합니다. 기회가 오면 보여 드리겠습니다.',pvS(c=>c.e2?'1군에서 부르면 바로 올라갈 수 있게 몸 만들어 두겠습니다. 감사합니다.':''),pvS(c=>c.injBack?'복귀하고 감각 찾는 중이었는데, 기회가 오면 꼭 보여 드리겠습니다.':'')],
    rookie:['정말요? 감사합니다! 기회 오면 절대 놓치지 않겠습니다!'],
    leader:['고맙습니다. 저도 아직 할 수 있다는 걸 보여 드리겠습니다.'],
    vet:['이 나이에 기회 한 번이 얼마나 큰지 압니다. 고맙습니다.'],
    bold:['한 번이면 됩니다. 한 번 나가면 자리 안 내줍니다.'],
    touchy:['감사합니다... 막상 기회가 오면 떨릴 것 같지만, 준비하겠습니다.'],
    quiet:['감사합니다. 준비하고 있겠습니다.'],
    foreign:['고마워요! 언제든 나갈 준비 돼 있어요.']},
  fr_e1:{all:['지금은 1군에 있습니다. 2군 감독님께 따로 말씀하실 필요는 없을 것 같습니다.','저 지금 1군 엔트리에 있습니다. 그 말씀은 나중에 해 주셔도 됩니다.']},
  fr_full:{all:[c=>`2군 감독님이 이미 ${c.fmax}명을 챙기고 계신다고 들었습니다. 자리가 나면 다시 말씀해 주십시오.`,c=>`2군에서 꾸준히 기용하는 선수가 벌써 ${c.fmax}명이라고 하더라고요. 자리가 나면 그때 부탁드립니다.`]},
  fr_ok:{
    all:[c=>`2군에서 꾸준히 ${c.isP?'선발로 던지면서':'주전으로 나가면서'} 보여 드리겠습니다.`],
    rookie:[c=>`2군에서 매일 ${c.isP?'던지면서':'나가면서'} 많이 배우겠습니다!`],
    vet:['2군이라도 꾸준히 나가는 게 낫죠. 감 찾아서 올라가겠습니다.'],
    bold:['2군에서 기록으로 보여 드리겠습니다. 오래 있을 생각은 없습니다.'],
    touchy:['꾸준히 나가면 마음이 좀 편해질 것 같습니다. 감사합니다.'],
    quiet:[c=>`알겠습니다. 2군에서 ${c.isP?'던지면서':'뛰면서'} 준비하겠습니다.`],
    foreign:['좋아요. 경기에 나가야 감이 와요.']},
  ct_for:{all:['재계약은 성적으로 말씀드리겠습니다.','내년에도 여기서 뛰고 싶어요. 그러려면 성적이 먼저겠죠.',pvS(c=>c.form.k==='hot'?`${c.form.t}. 이대로 가면 재계약 얘기도 자신 있어요.`:''),pvS(c=>c.form.k==='cold'?'요즘 성적으로는 재계약 얘기할 때가 아니에요. 먼저 살아날게요.':'')]},
  ct_multi:{all:['계약 기간이 남았으니 야구에만 집중하겠습니다.',pvS(c=>c.yrs>1?`계약이 ${c.yrs}년 남았으니 지금은 야구만 하겠습니다.`:'')],vet:['계약 얘기는 아직 이르죠. 남은 기간 동안 값어치를 하겠습니다.'],bold:['계약 기간이 남았습니다. 그사이에 몸값을 올려 놓겠습니다.']},
  ct_fa_loy:{
    all:[c=>`${c.faTxt}. 가능하면 이 팀에서 오래 뛰고 싶습니다. 다년계약 제안이면 진지하게 듣겠습니다.`],
    leader:[c=>`${c.faTxt}. 저는 여기서 끝을 보고 싶습니다. 다년계약이면 얼마든지 이야기하죠.`],
    vet:[c=>`${c.faTxt}. 이 팀에서 오래 뛰었는데 다른 데 갈 생각은 별로 없어요. 조건만 맞으면요.`],
    quiet:[c=>`${c.faTxt}. 남고 싶습니다. 제안 주시면 듣겠습니다.`],
    touchy:[c=>`${c.faTxt}. 솔직히 옮기는 게 겁나기도 합니다. 여기서 길게 하고 싶어요.`]},
  ct_fa_mkt:{
    all:[c=>`${c.faTxt}. 솔직히 시장 평가도 받아 보고 싶습니다.`],
    bold:[c=>`${c.faTxt}. 제 가치를 시장에서 확인해 보고 싶습니다. 구단도 그걸 기준으로 생각해 주셨으면 합니다.`],
    touchy:[c=>`${c.faTxt}. ...아직 마음을 못 정했습니다. 다른 데서 무슨 말이 나올지도 궁금하고요.`],
    vet:[c=>`${c.faTxt}. 마지막 큰 계약일 수도 있어서, 시장 얘기는 들어 보려고요.`],
    quiet:[c=>`${c.faTxt}. 시장 얘기도 들어 보겠습니다.`]},
  ct_young:{all:['아직은 1군에서 자리 잡는 게 먼저입니다.','계약 얘기는 제가 자리 잡고 나서 해도 늦지 않습니다.'],rookie:['네? 계, 계약이요? 아직은 1군에서 살아남는 게 먼저입니다!'],bold:['지금은 자리 잡는 게 먼저입니다. 몇 년 뒤엔 제가 먼저 찾아오겠습니다.']},
  ct_other:{all:['좋은 대우를 받으려면 성적부터 내야죠.',pvS(c=>c.form.k==='hot'?`${c.form.t}. 이대로면 연봉 얘기할 때 할 말이 좀 있겠네요.`:''),pvS(c=>c.form.k==='cold'?'지금 기록으로는 계약 얘기 꺼낼 염치가 없습니다.':'')],vet:['이 나이엔 한 해 한 해가 계약이죠. 성적으로 말하겠습니다.'],bold:['성적은 제가 낼 테니, 대우는 그때 섭섭하지 않게 해 주세요.']},
  /* 고민 묻기: 방금 경기에 대한 반응(성격대로) */
  ev_bad_t:{all:[c=>`${c.ev}... 마지막 ${c.isP?'타구':'타석'}가 계속 생각납니다.`,c=>`${c.ev}. 어젯밤에 잠을 거의 못 잤습니다.`],rookie:[c=>`${c.ev}... 선배님들 볼 면목이 없습니다.`]},
  ev_bad_b:{all:[c=>`${c.ev}. 그래도 다음에도 같은 상황이면 저한테 맡겨 주십시오.`,c=>`${c.ev}. 한 번 졌다고 물러설 생각 없습니다. 다음엔 제가 끝내겠습니다.`]},
  ev_bad_c:{all:[c=>`${c.ev}, 아쉽지만 털어 버렸습니다. 다음 ${c.nx}에서 만회하겠습니다.`,c=>`${c.ev}. 지나간 건 지나간 거죠. 다음 ${c.nx}에서 만회하면 됩니다.`],vet:[c=>`${c.ev}. 이런 날도 있어야 시즌이죠. 다음에 만회하겠습니다.`],quiet:[c=>`${c.ev}. 다음에 만회하겠습니다.`],foreign:[c=>`${c.ev}. 괜찮아요. 다음 ${c.nx}에서 만회할게요.`]},
  ev_bad:{all:[c=>`${c.ev}, 제 책임입니다. 다음 ${c.nx}에서 만회하겠습니다.`,c=>`${c.ev}. 영상 다시 보고 있습니다. 다음엔 다르게 하겠습니다.`],leader:[c=>`${c.ev}. 고참이 그러면 안 되는데... 다음 ${c.nx}에서 만회하겠습니다.`],rookie:[c=>`${c.ev}... 죄송합니다. 다음엔 꼭 만회하겠습니다.`],foreign:[c=>`${c.ev}. 내 실수예요. 다음엔 더 잘할게요.`]},
  ev_good_t:{all:[c=>`${c.ev}. 이제야 마음이 좀 놓입니다.`,c=>`${c.ev}. 솔직히 그 전까지는 불안했는데, 한숨 돌렸습니다.`]},
  ev_good:{all:[c=>`${c.ev}. 감이 좋습니다. 이 흐름 이어 가겠습니다.`],rookie:[c=>`${c.ev}! 아직도 손이 떨립니다. 이 흐름 이어 가겠습니다.`],leader:[c=>`${c.ev}. 덕분에 덕아웃 분위기가 좀 살았어요.`],bold:[c=>`${c.ev}. 이제 시작입니다.`],vet:[c=>`${c.ev}. 몸이 기억하더라고요.`],quiet:[c=>`${c.ev}. 다행입니다.`],foreign:[c=>`${c.ev}. 기분 좋아요! 이 느낌 계속 갈게요.`]}
};
