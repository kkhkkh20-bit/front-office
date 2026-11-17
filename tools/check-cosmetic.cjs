/* 이름·얼굴 꾸미기(구단주 결정 11-17) 규칙 점검: 이름 바꾸기 저장·전파, 금칙어·길이, 가져오기 미리보기·적용, 능력 불변, 얼굴 번호 유효성, 대회 덱 이름, 난수 미사용.
 사용: node tools/check-cosmetic.cjs (빌드 없이 소스에서 엔진을 만든다) */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {build}=require('./build.cjs');
const ROOT=path.resolve(__dirname,'..'), A=f=>fs.readFileSync(path.join(ROOT,'src','ui',f),'utf8').replace(/"data:image\/[^"]*"/g,'"x"');
const engine=build({root:ROOT,write:false}).engine;
const ui77=A('assets/77_assets_ui.js'), ui72=A('players/72_cosmetic.js'), cut=(s,a,b)=>{ const i=s.indexOf(a), j=s.indexOf(b); assert.ok(i>=0&&j>i,'소스 조각 없음: '+a); return s.slice(i,j); };
/* 화면 쪽 얼굴 번호표·배정 함수와 72_cosmetic.js의 얼굴 규칙 부분만(그림 그리기·DOM 빼고) */
const faceSrc=[A('assets/00d_faces_data.js'),A('assets/00h_more_faces2_data.js'),A('assets/00j_faces_v18_data.js'),A('assets/00i_foreign17_data.js'),
  cut(ui77,'function face6Pool(','function face6Cut('),cut(ui77,'const F17N=','function face17Load('),cut(ui77,'function amFaceOn(','function amLoad('),
  cut(ui72,'const COSM_PG=','function cosmThumb(')].join('\n');
const pyA=fs.readFileSync(path.join(ROOT,'src','ui','cup','01_cup_ui.js'),'utf8'), ulA=fs.readFileSync(path.join(ROOT,'src','core','uladder.mjs'),'utf8');
const oe=console.error; console.error=()=>{};
new Function('assert','cupUi','ulSrc',engine+'\n;'+faceSrc+`
{
const log=m=>console.log('통과  '+m);
DEMO.on=false; newGame(6); fdStart(); fdAdvance(false); { let g=0; while(G.fd&&!G.fd.done&&g++<500)fdAdvance(true); } hireMgr(G.mmarket[0].id,3);
const others=G.teams.filter(t=>t.id!==G.user).map(t=>t.id);
const snap=()=>JSON.stringify(Object.values(G.players).map(p=>[p.id,p.r,p.pot,p.age,p.sal,p.yrs,p.team,p.ovrC??null]));
const before=snap();
let rnd=0; const MR=Math.random; Math.random=function(){ rnd++; return MR.apply(this,arguments); };

/* 1) 이름 검사 */
assert.equal(cosmNameErr('로하스 주니어'),''); assert.equal(cosmNameErr('A.J. 폴락'),''); assert.equal(cosmNameErr('김·철수'),'');
assert.ok(cosmNameErr('')); assert.ok(cosmNameErr('가'.repeat(13))); assert.equal(cosmNameErr('가'.repeat(12)),'');
assert.ok(/쓸 수 없는 말/.test(cosmNameErr('시발이'))); assert.ok(/쓸 수 없는 말/.test(cosmNameErr('관리자'))); assert.ok(cosmNameErr('a/b')); assert.ok(cosmNameErr('123'));
assert.equal(cosmNameClean('  홍  길동 '),'홍 길동'); assert.equal(cosmNameClean('<b>x</b>').includes('<'),false);
log('이름 검사: 길이 12자·금칙어(대회 팀명 표)·기호·글자 없는 이름을 막는다');

/* 2) 다른 구단 선수 이름 바꾸기가 저장·전파된다(기록 조각은 바뀌고 기사 문장은 그대로) */
const p=playersOf(others[0]).find(x=>!x.foreign), old=p.name, nw='새이름'+(p.id%10);
G.legends=G.legends||[]; G.legends.push({pid:p.id,name:old,tid:p.team,no:7});
G.ob=G.ob||[]; G.ob.push({id:'obT1',fid:p.id,name:old}); G.cosmTest={coach:{id:'cobT1',name:old},school:{id:'h'+'obT1',ob:'obT1',name:old},other:{id:p.id,name:'다른사람'},deep:[{x:[{pid:p.id,nm:old}]}]};
const news={t:old+' 선수가 홈런을 쳤다',id:'n1'}; G.news=G.news||[]; G.news.unshift(news);
assert.equal(setPlayerName(p.id,nw),''); assert.equal(G.players[p.id].name,nw); assert.equal(p.renamed.at(-1).from,old);
assert.equal(G.legends.at(-1).name,nw,'영구결번 후보 기록'); assert.equal(G.ob.at(-1).name,nw,'OB'); assert.equal(G.cosmTest.coach.name,nw,'OB 출신 지도자'); assert.equal(G.cosmTest.school.name,nw,'OB 학교 감독');
assert.equal(G.cosmTest.deep[0].x[0].nm,nw,'깊은 기록 조각(nm)'); assert.equal(G.cosmTest.other.name,'다른사람','같은 번호 다른 이름은 그대로'); assert.ok(news.t.startsWith(old),'기사 문장은 그대로');
const G2=JSON.parse(JSON.stringify(G)); assert.equal(G2.players[p.id].name,nw,'저장(직렬화) 뒤에도 새 이름');
delete G.cosmTest; G.ob.pop(); G.legends.pop();
log('이름 바꾸기: 다른 구단 선수도 저장되고, id로 가리키는 기록(영구결번·OB·OB 출신 지도자·깊은 기록)도 새 이름, 기사 문장은 그대로');

/* 3) 은퇴(보관 기록만 남은) 선수 */
G.arch=G.arch||{}; G.arch[999901]={id:999901,name:'옛선수',isP:true,rows:[{y:2020,t:G.user,g:3}]};
assert.equal(setPlayerName(999901,'전설투수'),''); assert.equal(G.arch[999901].name,'전설투수');
log('은퇴 선수(G.arch)는 이름만 바꿀 수 있다');

/* 4) 얼굴 번호 유효성: 모든 구단 선수의 고를 수 있는 얼굴이 그 선수 묶음(국내/외국인/아시아쿼터) 안이고, 지도자가 쓰는 얼굴은 빠진다 */
let nChecked=0;
for(const q of Object.values(G.players)){ if(q.team==null)continue; const F=cosmFace(q); assert.ok(F&&F.k==='6','구단 선수는 FACE6 묶음: '+q.name); const pool=new Set(face6Pool(q));
  for(const i of F.L){ const x=FACE6.ids[i]; assert.ok(x&&!x.x&&pool.has(i),'묶음 밖 얼굴 '+i); assert.equal(!!x.f,!!q.foreign,'국내/외국인 얼굴 섞임 '+q.name+' '+i); }
  const c=cosmFaceCur(q); assert.ok(c==null||F.L.includes(c)||(G.f6s&&G.f6s[q.team+':'+c]),'지금 얼굴이 묶음 밖: '+q.name+' '+c); nChecked++; }
{ const q=playersOf(G.user).find(x=>!x.foreign), F=cosmFace(q), k=G.user+':'+F.L[0]; G.f6s=Object.assign(G.f6s||{},{[k]:1}); assert.ok(!cosmFace(q).L.includes(F.L[0]),'지도자 얼굴이 후보에 남음'); assert.ok(cosmFaceErr(q,F.L[0])); delete G.f6s[k]; }
const dom=playersOf(G.user).filter(x=>!x.foreign), a=dom[0], b=dom[1]; const fb=cosmFaceCur(b); assert.ok(fb!=null);
assert.equal(cosmFaceErr(a,fb),''); assert.ok(cosmFaceErr(a,99999)); assert.ok(cosmFaceErr(a,-1)); const fgn=FACE6.ids.findIndex(x=>x.f&&!x.x); assert.ok(cosmFaceErr(a,fgn),'국내 선수에게 외국인 얼굴');
assert.ok(cosmSetFace(a,fb)); assert.equal(face6Idx(a),fb,'고른 얼굴'); const nb=face6Idx(b); assert.notEqual(nb,fb,'같은 구단 중복');
const used=playersOf(G.user).map(face6Idx).filter(x=>x!=null); assert.equal(new Set(used).size,used.length,'구단 안 얼굴 중복');
const fa=Object.values(G.players).find(x=>x.foreign&&x.team==null);
if(fa){ const F=cosmFace(fa); assert.equal(F.k,'17'); assert.ok(F.L.every(i=>FACE17.ids[i].q===(fa.foreign==='아시아'?1:0))); const n=F.L.find(i=>i!==cosmFaceCur(fa)); assert.ok(cosmSetFace(fa,n)); assert.equal(face17Idx(fa),n); }
const dfa=Object.values(G.players).find(x=>!x.foreign&&x.team==null&&!x.prospect); if(dfa){ assert.equal(cosmFace(dfa),null); assert.ok(cosmFaceErr(dfa,1)); }
log('얼굴 번호: 구단 선수 '+nChecked+'명 모두 자기 묶음 안 번호만, 고르면 그 번호·같은 구단 중복 없음, 소속 없는 외국인은 훈련복 묶음, 범위 밖 번호는 거절');

/* 5) 가져오기: 미리보기(바뀜·그대로·문제 줄) → 적용 */
const T0=playersOf(others[1]).filter(x=>!x.foreign).slice(0,6), csv=cosmCsv(T0.slice(0,3).map(q=>({id:q.id,team:tshort(q.team),name:q.name,face:cosmFaceCur(q)??''})));
const lines=csv.split('\\n'); assert.equal(lines[0],'id,구단,현재 이름,새 이름,얼굴 번호');
const f2=cosmFace(T0[1]).L.find(i=>i!==cosmFaceCur(T0[1]));
lines[1]=[T0[0].id,'x',T0[0].name,'가져온이름',''].join(','); lines[2]=[T0[1].id,'x',T0[1].name,'',f2].join(',');
lines.push('424242,x,없는선수,누구,'); lines.push([T0[0].id,'x','','두번째',''].join(',')); lines.push([T0[3].id,'x','','시발놈',''].join(',')); lines.push([T0[4].id,'x','','',99999].join(',')); lines.push('"'+T0[5].id+'"\\t\\t\\t"따옴표, 이름"\\t');
const rows=cosmParse(lines.join('\\n')); const pv=cosmPreview(rows,COSM_F);
assert.equal(pv.chg.length,3,'바뀜 3명: '+JSON.stringify(pv.chg)); assert.equal(pv.bad.length,4,'문제 4줄: '+JSON.stringify(pv.bad)); assert.equal(pv.same,1);
assert.ok(pv.bad.some(b=>/찾을 수 없/.test(b.why))&&pv.bad.some(b=>/앞 줄/.test(b.why))&&pv.bad.some(b=>/쓸 수 없는 말/.test(b.why))&&pv.bad.some(b=>/얼굴 번호 99999/.test(b.why)));
assert.notEqual(T0[0].name,'가져온이름','미리보기는 바꾸지 않는다');
const r=cosmApply(pv,COSM_F); assert.equal(r.names,2); assert.equal(r.faces,1); assert.equal(r.errs.length,0);
assert.equal(T0[0].name,'가져온이름'); assert.equal(T0[5].name,'따옴표 이름'); assert.equal(face6Idx(T0[1]),f2); assert.notEqual(T0[3].name,'시발놈');
const pv2=cosmPreview(cosmParse(cosmCsv(T0.map(q=>({id:q.id,team:'',name:q.name,face:cosmFaceCur(q)??''})))),COSM_F); assert.equal(pv2.chg.length,0); assert.equal(pv2.same,T0.length,'내보낸 그대로 가져오면 바뀜 없음');
assert.equal(cosmParse('12\\t새 이름\\t3')[0].face,'3'); assert.equal(cosmParse('12,새이름')[0].name,'새이름');
log('가져오기: 미리보기는 바꾸지 않고 바뀜 3(탭·따옴표 줄 포함)·그대로 1·문제 4(없는 id·중복 id·금칙어·범위 밖 얼굴)를 가르고, 적용하면 이름·얼굴만 바뀐다. 내보낸 그대로는 바뀜 없음');

/* 6) 여러 명 한꺼번에(전 구단) — 능력·잠재력·나이·연봉·계약 불변, 에디터 흔적 없음 */
const many=Object.values(G.players).filter(q=>q.team!=null).slice(0,300).map((q,i)=>({id:q.id,name:'선수'+i}));
const rm=cosmRenameMany(many); assert.equal(rm.errs.length,0); assert.ok(rm.n>=many.length-2);
assert.equal(snap(),before,'능력·잠재력·나이·연봉·계약·소속이 바뀜'); assert.equal(G.edited,undefined,'에디터 사용 표시'); assert.equal(typeof setPlayerRatings,'undefined','능력 에디터 함수가 남아 있음');
assert.equal(rnd,0,'이름·얼굴 바꾸기가 난수를 씀: '+rnd); Math.random=MR;
log('일괄 이름 '+rm.n+'명: 능력·잠재력·나이·연봉·계약·소속 그대로, 에디터 함수 없음, 난수 0회');

/* 7) 대회·래더 덱: 바꾼 이름이 실리고, 직접 넣은 사진(G.cimg)은 보내지 않는다 */
const u=G.players[cupEntryNow({name:'테스트'}).P[0].id]; setPlayerName(u.id,'덱이름'); G.cimg={['p:'+u.id]:'data:image/webp;base64,AAAA'};
const e=cupEntryNow({name:'테스트'}); const s=e.P.find(x=>x.id===u.id); assert.ok(s,'덱에 선수가 없음'); assert.equal(s.name,'덱이름'); assert.equal(s.f,undefined);
assert.ok(!JSON.stringify(e).includes('AAAA'),'직접 넣은 사진이 덱에 들어감');
const cf=cupUi.slice(cupUi.indexOf('async function cupFaces('),cupUi.indexOf('function cupNameIn(')); assert.ok(cf.includes('face6Src(')&&!/cimg|faceSVG/.test(cf),'대회 사진은 템플릿 얼굴(face6Src)만');
assert.ok(/for \\(const p of x\\.P \\|\\| \\[\\]\\) delete p\\.f/.test(ulSrc),'래더 덱(ulSlim)은 사진을 뺀다');
log('대회·래더 덱: 바꾼 이름이 실리고, 직접 넣은 사진은 들어가지 않는다(대회는 템플릿 얼굴만, 래더는 사진 없음)');
}`)(assert,pyA,ulA);
console.error=oe; console.log('이름·얼굴 꾸미기 점검: 모두 통과');
