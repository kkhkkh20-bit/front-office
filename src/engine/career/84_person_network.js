/* 개인 친분은 구단 유대(OB.bond)·선수 기분과 별개다. 선수 출신은 기존 pl:원ID를 계속 쓴다. */
const personNetworkList=L=>Array.isArray(L)?L.filter(x=>x&&typeof x==='object'):[];
function personNetworkOb(s,kind){return s&&(kind==='ob'||s.fid!=null&&String(s.id).startsWith('ob'))?s:s&&s.ob?(G.ob||[]).find(o=>o.id===s.ob)||null:null;}
function personNetworkKey(s,kind){
  if(!s)return null;
  if(kind==='player'||typeof s.id==='number')return 'pl:'+s.id;
  const ob=personNetworkOb(s,kind);
  if(ob)return typeof ob.fid==='number'?'pl:'+ob.fid:'ob:'+ob.id;
  if(typeof s.fid==='number')return 'pl:'+s.fid;
  const face=G.obFace&&G.obFace[s.id];if(typeof face==='number')return 'pl:'+face;
  if(s.cid)return 'staff:'+s.cid;
  return s.personKey||'staff:'+s.id;
}
function personNetworkKnown(c){return !!c&&(c.known===true||c.bond!=null&&c.bond!==30||(c.history||[]).length>0||(c.networkLog||[]).length>0);}
function personNetworkLegacyRel(s){const R=s&&s.staff&&s.staff.rels;if(!R)return null;if(R.me!=null)return R.me;const L=Object.values(R).map(x=>x&&typeof x==='object'?x.gm:null).filter(x=>x!=null);return L.length?Math.max(...L):null;}
/* 조회는 생성·별칭 이동·난수 소비를 하지 않는다. */
function personNetworkEvidence(s,kind){const key=personNetworkKey(s,kind),C=G.personal&&G.personal.contacts&&G.personal.contacts[key];if(personNetworkKnown(C))return {key,c:C,source:key&&key.startsWith('pl:')?'선수 시절 개인 교류':'개인 교류 기록'};const rel=personNetworkLegacyRel(s);if(rel!=null)return {key,c:{bond:rel,known:true,history:s.staff&&s.staff.talk?[{day:s.staff.talk.day,kind:'staff',text:'업무·희망 보직 면담'}]:[]},source:'직원 면담 기록'};return {key,c:null,source:null};}
function personNetworkEnsure(s,kind){const e=personNetworkEvidence(s,kind);if(!e.c||!e.key)return null;const C=contactRecord(e.key);if(!personNetworkKnown(C)){C.bond=e.c.bond;C.known=true;if(!personNetworkList(C.history).length)C.history=personNetworkList(e.c.history).map(x=>({...x}));}C.networkSource=C.networkSource||e.source;return C;}
function personNetworkWorkBond(s,kind){const e=personNetworkEvidence(s,kind);return e.c?clamp(e.c.workRel??e.c.bond,0,100):null;}
function personNetworkNote(C,entry){if(!C)return;C.known=true;const L=C.networkTalk=personNetworkList(C.networkTalk);if(!L.some(x=>x.day===entry.day&&x.kind===entry.kind&&x.text===entry.text))L.unshift({...entry,y:G.year});}
function personNetworkStaffProfile(s,kind,P){const e=personNetworkEvidence(s,kind),C=e.c;if(!C)return P;const old=personNetworkLegacyRel(s),rels=Object.assign({},C.staffRels||{},P.rels||{});if(rels.me==null)rels.me=old??C.workRel??C.bond;return {...(C.staffTalk?{talk:{...C.staffTalk}}:{}),...P,identity:s.id,mental:{...(C.staffBio&&C.staffBio.mental||P.mental)},office:{...(C.staffBio&&C.staffBio.office||P.office)},rels};}
function personNetworkRememberStaff(s,kind){const C=personNetworkEnsure(s,kind);if(!C||!s.staff)return;const R=s.staff.rels||{};if(R.me!=null)C.workRel=clamp(R.me,0,100);C.staffRels=JSON.parse(JSON.stringify(R));C.staffBio={mental:{...s.staff.mental},office:{...s.staff.office}};if(s.staff.talk){C.staffTalk={...s.staff.talk};if(s.staff.talk.day===G.day)personNetworkNote(C,{day:G.day,kind:'staff',text:s.name+' · '+(s.staff.talk.topic==='coord'?'감독 업무 조율':'업무·희망 보직 면담')});}C.staffCareer={};for(const k of ['study','studyHist'])if(s[k]!=null)C.staffCareer[k]=JSON.parse(JSON.stringify(s[k]));}
/* 후보 생성 시에는 관계 연결만 한다. 채용·승진 경력을 만들지 않는다. */
function personNetworkCoachState(s,C){const H=C.coachState,ob=personNetworkOb(s,'coach');if(!H||!ob||!s.ab||!H.ab)return;if(H.role===s.role&&H.obSk===ob.sk&&H.obDv===ob.dv){s.ab={...H.ab};s.sk=H.sk;s.dv=H.dv;return;}/* OB 자체의 최신 경력 성장은 새 기본판에, 실제 교육 등으로 얻은 차이만 1회 얹는다. */const fresh=obAb(ob,s.role);for(const k of Object.keys(fresh))s.ab[k]=Number.isFinite(H.ab[k])&&Number.isFinite(H.baseAb&&H.baseAb[k])?clamp(+(fresh[k]+H.ab[k]-H.baseAb[k]).toFixed(1),25,90):fresh[k];coachSync(s);}
function applyPersonRelation(s,kind){const C=personNetworkEvidence(s,kind).c;if(!C)return s;s.personKey=personNetworkKey(s,kind);if(kind==='coach')personNetworkCoachState(s,C);for(const [k,v] of Object.entries(C.staffCareer||{}))if(s[k]==null)s[k]=JSON.parse(JSON.stringify(v));if(kind==='mgr'){s.rel=clamp(C.workRel??C.bond,0,100);}else if(['coach','scout','analyst'].includes(kind)){staffAttach(s,kind);}return s;}
/* 실제 은퇴·인사 완료 경로에서만 부른다. 최근 대화 12개와 별도로 경력 연결을 보관한다. */
function personNetworkTrace(kind,s,action,tid,detail){const C=personNetworkEnsure(s,kind);if(!C)return;if(kind==='mgr'&&tid===G.user&&s.rel!=null)C.workRel=clamp(s.rel,0,100);else if(['coach','scout','analyst'].includes(kind))personNetworkRememberStaff(s,kind);
  const ob=personNetworkOb(s,kind);if(kind==='coach'&&ob&&s.ab)C.coachState={day:G.day,y:G.year,role:s.role,obSk:ob.sk,obDv:ob.dv,baseAb:obAb(ob,s.role),ab:{...s.ab},sk:s.sk,dv:s.dv};const key=personNetworkKey(s,kind),signature=[G.year,G.day,kind,action,tid,s.role||''].join(':');C.networkPerson={name:s.name,playerId:typeof ob?.fid==='number'?ob.fid:kind==='player'?s.id:null,obId:ob?ob.id:null};
  const L=C.networkLog=personNetworkList(C.networkLog);if(L[0]&&L[0].signature===signature)return;C.networkSeq=(C.networkSeq||0)+1;L.unshift({id:key+':'+C.networkSeq,day:G.day,y:G.year,kind:'career',role:kind,tid:tid??null,signature,bond:C.bond,text:s.name+' '+action+(detail?' · '+detail:'')});
}
function personNetworkContract(s,kind){if(!s)return null;if(kind==='player')return {label:ctText(s),salary:s.sal??null,pending:s.joinY>G.year};const years=s.yrs||0,start=s.cs??s.jy??null,end=s.ce??(years>0?(typeof ctEndY==='function'?ctEndY(s):G.year+years-1):null);if(!years&&start==null&&end==null)return null;return {startYear:start,endYear:end,salary:s.sal??null,pending:s.jy>G.year};}
function personNetworkRecruit(ob){if(!ob||G.unemp||obWhere(ob).k!=='free')return null;if(obMgrCands().some(o=>o.id===ob.id))return {a:'obAct',v:ob.id+':mgr'};if(obCands('coach').some(o=>o.id===ob.id))return {a:'obAct',v:ob.id+':coach'};return null;}
function personalNetworkView(){
  const M=new Map(),rows=[],contacts=G.personal&&G.personal.contacts||{},push=(s,kind,tid,extra={})=>{if(!s)return;const e=personNetworkEvidence(s,kind);if(!e.c)return;const key=e.key,existing=M.get(key),priority=extra.active?100:kind==='ob'?40:kind==='front'?50:10;if(existing&&existing.priority>priority)return;const ob=personNetworkOb(s,kind),playerId=typeof ob?.fid==='number'?ob.fid:kind==='player'?s.id:key.startsWith('pl:')?+key.slice(3):null;
    const labels={player:'현역 선수',ob:'은퇴·진로 준비',coach:'코치',mgr:'감독',scout:'스카우트',analyst:'전력분석원',front:'프런트',gm:'단장'},mgr=tid!=null&&G.mgr&&G.mgr[tid],clan=s.clan&&mgr&&s.clan===mgr.id?{managerId:mgr.id,name:mgr.name}:null,roleLabel=extra.roleLabel||labels[kind]||kind;
    const seen=new Set(),history=[...personNetworkList(e.c.networkLog),...personNetworkList(e.c.networkTalk),...personNetworkList(e.c.history)].filter(x=>{const k=[x.day??x.d,x.kind,x.text].join('|');if(seen.has(k))return false;seen.add(k);return true;}).map(x=>({...x})).sort((a,b)=>(b.day??b.d??-Infinity)-(a.day??a.d??-Infinity));
    const row={key,personId:key,name:s.name,playerId,obId:ob&&ob.id||null,role:kind,currentKind:kind,staffRole:s.role||null,path:ob&&ob.path||null,tid:tid??null,roleLabel,bond:e.c.bond,workRelation:kind==='mgr'&&!G.unemp&&extra.active&&tid===G.user?s.rel??e.c.workRel:e.c.workRel??personNetworkLegacyRel(s),known:true,sourceLabel:e.c.networkSource||e.source,history,contract:extra.active?personNetworkContract(s,kind):null,clan,circle:!G.unemp&&extra.active&&tid===G.user&&e.c.bond>=75&&['coach','mgr','scout','analyst'].includes(kind)?{member:true,label:'단장 인맥'}:null,aliases:[s.id,ob&&ob.id].filter(x=>x!=null),link:ob?{a:'person',v:'ob:'+ob.id}:playerId!=null&&(G.players[playerId]||G.arch&&G.arch[playerId])?{a:'player',v:String(playerId)}:null,recruit:ob&&!extra.active?personNetworkRecruit(ob):null,priority};M.set(key,row);};
  for(const p of Object.values(G.players||{}))if(!p.prospect)push(p,'player',p.team,{active:p.team!=null,roleLabel:p.team==null?'무적 선수':'현역 선수'});
  for(const o of G.ob||[]){const w=obWhere(o);push(o,w.k==='front'?'front':'ob',w.tid??null,{roleLabel:w.t});}
  for(const [tid,C] of Object.entries(G.coach||{}))for(const c of Object.values(C||{}))push(c,'coach',+tid,{active:true});
  for(const [tid,m] of Object.entries(G.mgr||{}))if(m&&!m.interim)push(m,'mgr',+tid,{active:true});
  for(const t of G.teams||[])if(t.gm&&!t.gm.interim)push(t.gm,'gm',t.id,{active:true});
  for(const c of G.coachX||[])push(c,'coach',G.user,{active:true,roleLabel:'보조 코치'});
  for(const [tid,o] of Object.entries(G.orgT||{}))for(const c of o&&o.coachX||[])push(c,'coach',+tid,{active:true,roleLabel:'보조 코치'});
  for(const [kind,L] of [['scout',G.scouts],['analyst',G.analysts]])for(const s of L||[])push(s,kind,G.user,{active:true});
  for(const [tid,L] of Object.entries(G.lgStaff||{})){for(const s of L.sc||[])push(s,'scout',+tid,{active:true});for(const s of L.an||[])push(s,'analyst',+tid,{active:true});}
  for(const [kind,L] of [['coach',G.cmarket],['mgr',G.mmarket],['scout',G.scoutMarket],['analyst',G.amarket]])for(const s of L||[])if(!M.has(personNetworkKey(s,kind)))push(s,kind,null,{roleLabel:(['coach','mgr'].includes(kind)?labelsForNetwork(kind):'직원')+' · 구직 중'});
  for(const [key,C] of Object.entries(contacts)){if(M.has(key)||!personNetworkKnown(C)||!key.startsWith('pl:'))continue;const id=+key.slice(3),a=G.arch&&G.arch[id],snap=C.networkPerson;if(!a&&!snap)continue;const p={id,name:a?a.name:snap.name};push(p,'player',null,{roleLabel:'은퇴 · 최근 근황 없음'});}
  for(const r of M.values()){delete r.priority;rows.push(r);}return rows.sort((a,b)=>b.bond-a.bond||a.name.localeCompare(b.name,'ko')||a.key.localeCompare(b.key));
}
const labelsForNetwork=kind=>kind==='mgr'?'감독':'코치';
