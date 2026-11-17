/* 얼굴 처리 통합(77_assets_ui.js faceAddr·faceCut·faceBust) 회귀 점검: 고정 시드 세계에서 선수·외국인 후보·고교생·감독·코치·단장·구단주·직원·비서·기자·
   선수 출신 지도자 약 300명의 faceSVG를 그리고, 사람마다 고른 (사진 묶음, 시트, 칸)과 배정표(G.f6·G.f7·G.f17·G.f19s·G.obFace·G.f6s)를
   tools/fixtures/face-assign.json(통합 전 빌드에서 만든 기준)과 비교한다. 화소는 비교하지 않는다.
   - 큰 자리(faceBust)가 실사 흉상을 돌려주는지, 큰 시트를 받는 중이면 다 받은 뒤 다시 그려 큰 시트 결과로 바뀌는지도 본다(소식함 발신자 큰 사진).
   사용: node tools/check-face-pipeline.cjs [--write] [html 경로]   (사진 시트는 저장소 assets/에서 읽는다) */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
const root=path.resolve(__dirname,'..'),FIX=path.join(__dirname,'fixtures/face-assign.json');
const write=process.argv.includes('--write'),html=path.resolve(process.argv.slice(2).find(a=>!a.startsWith('--'))||path.join(root,'index.html'));
const TYPES={'.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg'};
(async()=>{const server=await startHtmlServer(html);let browser;const errors=[];
try{browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||(fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':'/usr/bin/chromium')});
 const p=await browser.newPage({viewport:{width:1366,height:768}});p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{let s=20261117;Math.random=()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};});
 await p.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
 let delay=0;await p.route(u=>new URL(u).pathname.startsWith('/assets/'),async r=>{const f=path.join(root,decodeURIComponent(new URL(r.request().url()).pathname));if(!f.startsWith(path.join(root,'assets'))||!fs.existsSync(f))return r.fulfill({status:404,body:''});if(delay)await new Promise(z=>setTimeout(z,delay));r.fulfill({body:fs.readFileSync(f),contentType:TYPES[path.extname(f)]||'application/octet-stream'});});
 await p.goto(server.url);
 await p.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);UI.title=false;G.tut={done:true,step:99};});
 /* 사람 목록: 순서가 배정 결과를 정하므로 늘 같은 순서로 */
 await p.evaluate(()=>{const L=[],P=Object.values(G.players).sort((a,b)=>a.id-b.id);
  const inT=P.filter(q=>q.team!=null);for(let i=0;i<inT.length&&L.length<150;i+=Math.max(1,Math.floor(inT.length/150)))L.push(['pl',inT[i]]);
  for(const q of inT.filter(q=>q.foreign).slice(0,20))L.push(['plf',q]);
  for(const q of P.filter(q=>q.team==null&&q.foreign).slice(0,20))L.push(['fa-f',q]);
  for(const q of P.filter(q=>q.team==null&&!q.foreign).slice(0,8))L.push(['fa-d',q]);
  G.teams.forEach((t,ti)=>{const m=G.mgr[ti];if(m)L.push(['mgr',{persona:'mgr',pid:m.id,team:ti,age:m.age}]);const C=coachesOf(ti);for(const k of Object.keys(C).sort().slice(0,3)){const c=C[k];if(c&&c.id!=null)L.push(['coach',{persona:'coach',pid:c.id,team:ti,age:c.age,female:c.f}]);}
   const g=typeof gmOf==='function'&&gmOf(ti);if(g&&ti!==G.user)L.push(['gm',{persona:'gm',pid:g.id,team:ti,age:g.age,female:g.f}]);
   L.push(['sec',{persona:'staff',pid:'st:비서:'+ti,team:ti,age:29,female:true}]);L.push(['doc',{persona:'staff',pid:'doc'+ti,team:ti,age:49}]);});
  for(let i=0;i<8;i++){L.push(['own',{persona:'own',pid:'tOwn'+i,age:55+i*2,female:i===5}]);L.push(['gmx',{persona:'gm',pid:'tGm'+i,age:34+i*4,female:i%3===0}]);L.push(['front',{persona:'staff',pid:'st:t'+i+':0',age:30+i*3,female:i%2===0}]);
   L.push(['agent',{persona:'agent',pid:'agt'+i,age:40}]);L.push(['press',{persona:'agent',pid:'press'+i,age:35}]);L.push(['fan',{persona:'staff',pid:'fan'+i,age:25}]);L.push(['ceo',{persona:'staff',pid:'ceo'+i,age:60}]);
   L.push(['fcoach',{persona:'coach',pid:'tFc'+i,team:i%10,age:40,female:true}]);}
  for(const f of Object.keys(PERSONA))L.push(['inbox',personaOf(f)]);L.push(['inbox',personaOf('비서')]);L.push(['inbox',personaOf('팀 닥터 · 의무팀')]);L.push(['inbox',personaOf('감독실')]);
  L.push(['pick',{persona:'staff',pid:'p7:3',age:50}]);L.push(['pick',{persona:'staff',pid:'p8:130',age:40}]);
  /* 선수 출신 지도자: 사진이 있는 선수를 고른다(선수 사진과 같은 칸) */
  const withFace=inT.filter(q=>!q.foreign).slice(0,400).filter((q,i)=>i%37===0).slice(0,8);G.obFace=G.obFace||{};
  withFace.forEach((q,i)=>{const per=['coach','mgr','gm','staff'][i%4],pid='tOb'+i;G.obFace[pid]=q.id;L.push(['ob-'+per,{persona:per,pid,team:i%2?q.team:(q.team+1)%10,age:45},q]);});
  window.__FL=L.filter(x=>x[1]);});
 const run=()=>p.evaluate(()=>{const N=a=>a==null?null:a.s?[a.s==='f8'?'f78':a.s,a.s==='f7v'||a.s==='f8'||a.s==='f17'||a.s==='f19'?'':String(a.t??''),a.c]:a.am?['am',a.am.vk,a.am.c]:a.f7?['f7'+a.f7.k,a.f7.k==='c'?String(a.f7.team):'',a.f7.c]:a.f19!=null?['f19','',a.f19]:a.f17!=null?['f17','',a.f17]:a.tid!=null?['p',String(a.tid),a.i]:['?'];
  let wait=0;const out=window.__FL.map(([k,o,pl])=>{if(pl)faceSVG(pl);const u=faceSVG(o);if(u===F6WAIT){wait++;return [k,'wait'];}const a=u&&typeof F6B!=='undefined'&&F6B.get(u);const b=u?faceBust(u):null;
   return [k,a?N(a):u&&u.startsWith('data:image/svg')?'svg':u?'other':'none',a?(b&&b!==u&&/^data:image\/webp/.test(b)?'bust':'nobust'):'-'];});
  const S=o=>{const r={};for(const k of Object.keys(o||{}).sort())r[k]=o[k];return r;};
  return {wait,out,maps:JSON.stringify({f6:S(G.f6),f6r:S(G.f6r),f6s:S(G.f6s),f7:S(G.f7),f7r:S(G.f7r),f17:S(G.f17),f19s:S(G.f19s),obFace:S(G.obFace)})};});
 let r;for(let n=0;n<60;n++){r=await run();if(!r.wait)break;await p.waitForTimeout(300);}
 assert.equal(r.wait,0,'사진 시트를 모두 받음');
 const kinds={};for(const [k,a] of r.out){kinds[k]=kinds[k]||{};const s=Array.isArray(a)?a[0]:a;kinds[k][s]=(kinds[k][s]||0)+1;}
 const snap={n:r.out.length,out:r.out,maps:r.maps};
 if(write){fs.mkdirSync(path.dirname(FIX),{recursive:true});fs.writeFileSync(FIX,JSON.stringify(snap)+'\n');console.log('기준 저장',FIX,r.out.length+'명',JSON.stringify(kinds));}
 else{const base=JSON.parse(fs.readFileSync(FIX,'utf8'));assert.ok(r.out.length>=280,'점검 인원 '+r.out.length);
  const diff=r.out.map((x,i)=>JSON.stringify(x)===JSON.stringify(base.out[i])?null:[i,base.out[i],x]).filter(Boolean);
  assert.deepEqual(diff,[],'사람마다 같은 사진 칸');assert.equal(r.maps,base.maps,'배정표(G.f6·f7·f17·f19s·obFace·f6s) 같음');
  console.log('얼굴 배정 같음',r.out.length+'명',JSON.stringify(kinds));}
 /* 선수 출신 지도자는 선수 시절 사진 칸 그대로 */
 const ob=await p.evaluate(()=>window.__FL.filter(x=>x[0].startsWith('ob-')).map(([k,o,pl])=>{const a=F6B.get(faceSVG(o)),b=F6B.get(faceSVG(pl));return [a&&(a.c??a.i),b&&(b.c??b.i)];}));
 for(const [a,b] of ob)assert.equal(a,b,'선수 출신 지도자 = 선수 시절 얼굴 칸');
 /* 큰 자리: 큰 시트를 늦게 받아도 받은 뒤에는 큰 시트에서 자른 흉상(소식함 발신자 큰 사진) */
 if(!write){delay=1500;const big=await p.evaluate(()=>{for(const k of Object.keys(F6IMG))delete F6IMG[k];F6C.clear();F6B.clear();UI.tab='inbox';render();
   const m={from:'비서 서하린',face:'sec',subj:'t',body:'',day:G.day,id:-1};const one=()=>{const d=document.createElement('div');d.innerHTML=senderAv(m,true);const im=d.querySelector('img');return im?im.src:'';};
   return new Promise(res=>{const seen=[];const t0=Date.now();const tick=()=>{const s=one();seen.push(s===F6WAIT?'wait':s.slice(0,30)+s.length);if(Date.now()-t0>9000)return res({seen,last:s});setTimeout(tick,250);};tick();});});
  const im=await p.evaluate(src=>new Promise(r=>{const i=new Image();i.onload=()=>r([i.naturalWidth,i.naturalHeight]);i.onerror=()=>r(null);i.src=src;}),big.last);
  assert.ok(im&&im[0]>=240,'비서 큰 사진이 256px 시트에서 잘림 '+JSON.stringify(im));
  const inbox=await p.evaluate(()=>{const s=document.querySelector('#app .ibs-face img');return s?s.naturalWidth:null;});
  console.log('큰 자리 흉상',JSON.stringify(im),'소식함 큰 사진 폭',inbox);}
 assert.deepEqual(errors,[]);console.log('얼굴 처리 점검 통과');
}finally{await browser?.close();await server.close();}})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
