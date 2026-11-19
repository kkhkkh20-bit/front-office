/* 외부 검수 11-17e 회귀 점검(실제 브라우저, 9건):
   1) 이름·얼굴 일괄 수정 › 가져오기: 실제 CSV 파일(setInputFiles, LF · BOM+LF · BOM+CRLF)을 고르면 그 내용으로 미리보기(옛 칸 값으로 덮이지 않음)
   2) 아마추어 학교(고교·대학) 모든 부원·추적 선수 화면이 오류 없이 그려진다(기록 없는 부원 runOf 오류)
   3) 래더 지난 시즌 결산 '확인'이 먹는다(시즌 id 'S22'를 글자로 저장, NaN·숫자 옛 값 옮기기)
   4) 선수 고치기: 등번호가 틀리면 이름도 바뀌지 않는다(모두 검사한 뒤 한꺼번에)
   5) 선수 고치기: 얼굴을 골라도 적던 이름·등번호가 남는다
   6) 서버 기록 지우기: 예전 덱 서버 DELETE가 503이면 '지웠습니다'가 아니라 어느 서버가 남았는지 + 다시 지우기(저장해 둠)
   7) 일괄 수정 찾기 칸에 적고 바로 '내보내기·가져오기'를 한 번 누르면 열린다(blur 다시 그리기로 첫 클릭이 사라지지 않음)
   8) '파일 불러오기'를 키보드로: 글 칸 → Tab → 파일 불러오기 → Tab → 미리보기, Enter로 파일 창이 열린다
   9) 지난 경기 중계 라인업 시즌 칸: 그 경기 전 기록 + 지금 장면까지(개막전 시작은 '-', 마지막 경기 끝은 지금 시즌 합계)
   사용: bash build.sh 후 node tools/check-review-1117e.cjs (CHROMIUM_EXECUTABLE_PATH, HTML=다른 index.html로 재현) */
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),os=require('node:os');
const {chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
const boot=()=>{ DEMO.on=false; newGame(6); fdStart(); fdAdvance(false); let n=0; while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true); hireMgr(G.mmarket[0].id,3); G.tut={done:true,step:99}; G.medSet=true; UI.title=false; UI.patchClosed=true; render(); };
const ONLY=(process.env.ONLY||'').split(',').filter(Boolean), on=k=>!ONLY.length||ONLY.includes(String(k));
(async()=>{ const server=await startHtmlServer(path.resolve(process.env.HTML||path.resolve(__dirname,'../index.html'))), b=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/opt/pw-browsers/chromium',args:['--disable-webgl']}), fails=[];
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'rv1117e-'));
  const open=async()=>{ const ctx=await b.newContext({viewport:{width:1366,height:900}}), p=await ctx.newPage(), errs=[]; p.setDefaultTimeout(30000); p.on('pageerror',e=>errs.push(String(e))); p.on('dialog',d=>d.accept()); await p.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'})); await p.goto(server.url);await p.waitForFunction(()=>performance.getEntriesByName('fronttime-menu-ready').length>0); await p.waitForFunction(()=>typeof newGame==='function',null,{timeout:60000}); await p.evaluate(boot); return {ctx,p,errs}; };
  const T=async(k,name,fn)=>{ if(!on(k))return; const {ctx,p,errs}=await open(); try{ await fn(p); assert.deepEqual(errs,[],'페이지 오류: '+errs.join(' | ')); console.log(`통과  ${k}) ${name}`); }catch(e){ fails.push(k); console.log(`실패  ${k}) ${name}: ${String(e&&e.message||e).split('\n')[0].slice(0,300)}`); } finally { await ctx.close(); } };
  const cosmOpen=async p=>{ await p.evaluate(()=>{ closeSheets(); A.cosmOpen(); }); await p.waitForSelector('#sheet .cosm-sheet'); };
  try{
    await T(1,'일괄 수정 CSV 파일 가져오기(LF·BOM·CRLF)',async p=>{ await cosmOpen(p); await p.click('#sheet [data-a="cosmIo"]'); await p.waitForSelector('#sheet .cosm-txt');
      const base=await p.evaluate(()=>{ const L=playersOf(G.user).slice(0,3); return {csv:cosmRowsCsv(L),id:L[0].id,name:L[0].name}; });
      const variants=[['lf',s=>s],['bom-lf',s=>'﻿'+s],['bom-crlf',s=>'﻿'+s.replace(/\n/g,'\r\n')],['crlf',s=>s.replace(/\n/g,'\r\n')]];
      for(const [i,[tag,f]] of variants.entries()){ const nm='파일이름'+'가나다라'[i], L=base.csv.split('\n'), c=L[1].split(','); c[3]=nm; L[1]=c.join(','); const file=path.join(tmp,`names-${tag}.csv`); fs.writeFileSync(file,f(L.join('\n')),'utf8');
        await p.fill('#sheet .cosm-txt','예전에 적어 둔 글'); /* 옛 칸 값이 파일 내용을 덮던 문제 */
        await p.setInputFiles('#sheet input[data-cosmfile]',file); await p.waitForSelector('#sheet .cosm-pv',{timeout:10000});
        const pv=await p.locator('#sheet .cosm-pv').innerText(), tx=await p.locator('#sheet .cosm-txt').inputValue();
        assert.match(pv,/바뀜 1명/,`${tag}: 미리보기 `+pv.slice(0,80)); assert.doesNotMatch(pv,/읽을 줄이 없습니다|문제 [1-9]/,tag+': 문제 줄'); assert.ok(tx.includes(nm)&&!tx.includes('\r')&&tx.charCodeAt(0)!==0xFEFF,tag+': 칸 내용');
        await p.click('#sheet [data-a="cosmPvX"]'); }
      /* 마지막 것을 적용 */
      await p.setInputFiles('#sheet input[data-cosmfile]',path.join(tmp,'names-bom-crlf.csv')); await p.waitForSelector('#sheet .cosm-pv'); await p.click('#sheet [data-a="cosmApply"]');
      assert.equal(await p.evaluate(id=>G.players[id].name,base.id),'파일이름다'); });

    await T(2,'아마추어 학교 부원·선수 화면 전부(고교·대학, 타자·투수)',async p=>{ const r=await p.evaluate(()=>{ const out={n:0,bad:[],hs:0,col:0,f:0,P:0,B:0,kim:null}; const Ss=amSeasonOf(), Y=G.year, yy=Ss&&Ss.y===Y?Y:Y-1;
        const sch=[...Object.keys(schList()).map(n=>[n,false]),...Object.keys(amCols()).map(n=>[n,true])];
        for(const [n,col] of sch){ let h=''; try{ h=amSchoolView(n); }catch(e){ out.bad.push(n+' 학교: '+e.message); continue; } const ids=[...h.matchAll(/data-a="amP" data-v="([^"]+)"/g)].map(m=>m[1]);
          for(const v of ids){ const id=v[0]==='f'?v:+v; out.n++; col?out.col++:out.hs++; if(v[0]==='f')out.f++; try{ const e=amPipe().L[id]||(v[0]==='f'?amDepE(id):null); if(e&&e.P)out.P++; else out.B++; const x=amPlayerView(id); if(!/학년별 기록/.test(x))out.bad.push(v+': 화면 없음'); }catch(e){ out.bad.push(v+': '+e.message); } } }
        try{ const k=amPlayerView('f덕수고#2024b1'); out.kim=/학년별 기록/.test(k); }catch(e){ out.bad.push('f덕수고#2024b1: '+e.message); }
        /* 화면으로도: 덕수고 → 부원 */ UI.amSch=null; UI.amP='f덕수고#2024b1'; UI.it=Object.assign(UI.it||{},{scoutpg:'am'}); A.go('staff:scouts'); out.dom=!/그리지 못했습니다/.test(document.body.innerText); return out; });
      console.log(`   학교 화면에서 ${r.n}명(고교 ${r.hs} · 대학 ${r.col} · 부원 ${r.f} · 타자 ${r.B} · 투수 ${r.P}), 김성민(f덕수고#2024b1) ${r.kim}`);
      assert.deepEqual(r.bad.slice(0,10),[],'그리지 못한 선수 '+r.bad.length); assert.ok(r.n>500&&r.hs&&r.col&&r.f&&r.B&&r.P,'훑은 수 '+JSON.stringify(r)); assert.ok(r.dom,'스카우트 화면 오류 문구'); });

    await T(3,'래더 지난 시즌 결산 확인(문자 시즌 id·옛 값 옮기기)',async p=>{ const r=await p.evaluate(()=>{ const C=FrontOfficeCore, se=C.ulSeason(Date.now()), prev='S'+(se.n-1), U=uld(); U.seas={id:prev,n:3,up:1,win:0,top:120,best:2,label:'지난',w:5,l:4,rk:12}; delete U.seenS; A.go('uld:lobby'); return {prev,card:!!document.querySelector('.ul-send [data-a="ulSeenS"]')}; });
      assert.ok(r.card,'결산 카드'); await p.click('.ul-send [data-a="ulSeenS"]'); await p.waitForTimeout(200);
      const a=await p.evaluate(()=>({seen:uld().seenS,card:!!document.querySelector('.ul-send')})); assert.equal(a.seen,r.prev,'저장된 시즌 id'); assert.equal(a.card,false,'확인 뒤에도 카드가 남음');
      const m=await p.evaluate(()=>{ const U=G.uld; U.seenS=NaN; const x=uld(); const nan=('seenS' in x); x.seenS=7; uld(); return {nan,num:G.uld.seenS}; }); assert.equal(m.nan,false,'NaN을 버림'); assert.equal(m.num,'S7','옛 숫자 값'); });

    const pEdit=async p=>{ const pid=await p.evaluate(()=>{ const q=playersOf(G.user).find(x=>!x.foreign&&cosmFace(x)); closeSheets(); UI.sheet=q.id; UI.ptab='sum'; renderSheet(); A.pEditOpen(q.id); return q.id; }); await p.waitForSelector('#sheet .pe-box #pe-no'); return pid; };
    const freeNo=p=>p.evaluate(()=>{ const q=G.players[UI.pEdit]; for(let n=99;n>=0;n--){ if(Object.values(G.players).some(o=>o!==q&&o.team===q.team&&jno(o)===n))continue; if(retNosOf(q.team).some(r=>r.no===n))continue; return String(n); } });
    await T(4,'고치기: 등번호 오류면 이름도 그대로(한꺼번에 저장)',async p=>{ const pid=await pEdit(p), old=await p.evaluate(id=>({n:G.players[id].name,no:jno(G.players[id])}),pid);
      await p.fill('#pe-nm','바꿀이름'); await p.fill('#pe-no','aa'); await p.click('#sheet [data-a="pEditSave"]');
      assert.match(await p.locator('#sheet .pe-box .bad').innerText(),/등번호/); assert.deepEqual(await p.evaluate(id=>({n:G.players[id].name,no:jno(G.players[id])}),pid),old,'오류인데 바뀜');
      assert.equal(await p.inputValue('#pe-nm'),'바꿀이름','오류 뒤 입력이 사라짐'); assert.equal(await p.inputValue('#pe-no'),'aa');
      /* 이름이 틀리면 등번호도 그대로 */ const n2=await freeNo(p); await p.fill('#pe-nm','시발놈'); await p.fill('#pe-no',n2); await p.click('#sheet [data-a="pEditSave"]'); assert.deepEqual(await p.evaluate(id=>({n:G.players[id].name,no:jno(G.players[id])}),pid),old,'이름 오류인데 등번호 바뀜');
      await p.fill('#pe-nm','바꿀이름'); await p.fill('#pe-no',n2); await p.click('#sheet [data-a="pEditSave"]'); assert.deepEqual(await p.evaluate(id=>({n:G.players[id].name,no:String(jno(G.players[id]))}),pid),{n:'바꿀이름',no:n2}); });

    await T(5,'고치기: 얼굴을 골라도 적던 이름·등번호가 남음',async p=>{ const pid=await pEdit(p), old=await p.evaluate(id=>G.players[id].name,pid), n2=await freeNo(p);
      await p.fill('#pe-nm','적던이름'); await p.fill('#pe-no',n2); const n=await p.evaluate(()=>{ const b=[...document.querySelectorAll('#sheet .pe-box .pe-face:not(.on)')][1]; return b.dataset.v; }); await p.click(`#sheet .pe-box .pe-face[data-v="${n}"]`);
      await p.waitForFunction(v=>{ const b=document.querySelector(`#sheet .pe-box .pe-face[data-v="${v}"]`); return b&&b.classList.contains('on'); },n);
      assert.equal(await p.inputValue('#pe-nm'),'적던이름','이름 입력이 되돌아감'); assert.equal(await p.inputValue('#pe-no'),n2,'등번호 입력이 되돌아감'); assert.equal(await p.evaluate(id=>G.players[id].name,pid),old,'저장 전인데 이름이 바뀜');
      await p.click('#sheet [data-a="pEditSave"]'); assert.equal(await p.evaluate(id=>G.players[id].name,pid),'적던이름');
      await p.evaluate(id=>A.pEditOpen(id),pid); assert.equal(await p.inputValue('#pe-nm'),'적던이름','다시 열면 저장된 이름'); });

    await T(6,'서버 기록 지우기: 예전 서버 503이면 일부 실패 안내·다시 지우기',async p=>{ let kv=0, v1=0, kvOk=false;
      await p.route('**/api/v1/player',r=>{ if(r.request().method()!=='DELETE')return r.fulfill({status:404,body:'{}'}); v1++; return r.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'}); });
      await p.route('**/api/ladder/deck/**',r=>{ if(r.request().method()!=='DELETE')return r.fulfill({status:404,body:'{}'}); kv++; return kvOk?r.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'}):r.fulfill({status:503,contentType:'text/html',body:'<h1>503</h1>'}); });
      const wid=await p.evaluate(()=>{ localStorage.setItem('fo-net-v1-token','tok'); localStorage.setItem('fo-net-v1-player',JSON.stringify({id:'p1',nickname:'나'})); UL.N=null; if(!G.wid)G.wid='wTest1'; return G.wid; });
      await p.evaluate(()=>A.ulSvDel()); await p.waitForFunction(()=>!UL.busy);
      const a=await p.evaluate(()=>({msg:UL.msg,bad:UL.bad,pend:uld().svDel})); assert.equal(v1,1); assert.equal(kv,1);
      assert.doesNotMatch(a.msg,/^서버 기록을 지웠습니다/,'일부 실패인데 다 지웠다고 함'); assert.match(a.msg,/예전 덱 서버/); assert.equal(a.bad,true); assert.deepEqual(a.pend,{v1:false,kv:wid},'남은 지우기 저장');
      await p.evaluate(()=>{ A.go('uld:rank'); }); await p.waitForSelector('.ul-svdel [data-a="ulSvDel"][data-v="retry"]'); assert.match(await p.locator('.ul-svdel').innerText(),/예전 덱 서버/);
      kvOk=true; await p.click('.ul-svdel [data-a="ulSvDel"]'); await p.waitForFunction(()=>!UL.busy&&!uld().svDel);
      const c=await p.evaluate(()=>({msg:UL.msg,pend:uld().svDel,box:!!document.querySelector('.ul-svdel')})); assert.equal(v1,1,'다시 지우기에서 이미 지운 새 서버는 건너뜀'); assert.equal(kv,2); assert.match(c.msg,/^서버 기록을 지웠습니다/); assert.equal(c.box,false); });

    await T(7,'일괄 수정: 찾기 입력 직후 버튼 한 번 클릭',async p=>{ await cosmOpen(p); const n0=await p.evaluate(()=>cosmList(UI.cosm.sc,'').length);
      await p.fill('#sheet input[data-cosm="q"]','김'); await p.click('#sheet [data-a="cosmIo"]');
      const r=await p.evaluate(()=>({io:!!UI.cosm.io,q:UI.cosm.q,box:!!document.querySelector('#sheet .cosm-io'),rows:document.querySelectorAll('#sheet .cosm-nm').length,qv:document.querySelector('#sheet input[data-cosm="q"]').value}));
      assert.ok(r.io&&r.box,'첫 클릭이 먹지 않음 '+JSON.stringify(r)); assert.equal(r.q,'김'); assert.equal(r.qv,'김');
      /* 입력을 멈추면(쉼) 거르고, 찾기 칸 초점은 그대로 */ await p.click('#sheet input[data-cosm="q"]'); await p.keyboard.press('End'); await p.keyboard.press('Backspace'); await p.waitForTimeout(600);
      const s=await p.evaluate(()=>({q:UI.cosm.q,foc:document.activeElement&&document.activeElement.dataset.cosm})); assert.equal(s.q,''); assert.equal(s.foc,'q','다시 그린 뒤 찾기 칸 초점');
      assert.equal(await p.evaluate(()=>cosmList(UI.cosm.sc,UI.cosm.q).length),n0); });

    await T(8,'일괄 수정: 파일 불러오기를 키보드로',async p=>{ await cosmOpen(p); await p.click('#sheet [data-a="cosmIo"]'); await p.focus('#sheet .cosm-txt'); await p.keyboard.press('Tab');
      const a=await p.evaluate(()=>{ const e=document.activeElement; return {a:e&&e.dataset.a,t:e&&e.textContent}; }); assert.equal(a.a,'cosmFile','글 칸 다음 Tab이 파일 불러오기가 아님 '+JSON.stringify(a));
      await p.evaluate(()=>renderSheet()); assert.equal(await p.evaluate(()=>document.activeElement&&document.activeElement.dataset.a),'cosmFile','창을 다시 그리면 초점이 사라짐(늦게 온 얼굴 그림 등)');
      const chooser=async(key,what)=>{ try{ const [c]=await Promise.all([p.waitForEvent('filechooser',{timeout:10000}),p.keyboard.press(key)]); return c; }catch(e){ throw new Error(what+'로 파일 창이 열리지 않음 (초점 '+await p.evaluate(()=>document.activeElement&&(document.activeElement.dataset.a||document.activeElement.tagName))+')'); } };
      const fc=await chooser('Enter','Enter');
      const file=path.join(tmp,'kbd.csv'); const csv=await p.evaluate(()=>{ const L=playersOf(G.user).slice(0,2); const s=cosmRowsCsv(L).split('\n'); const c=s[1].split(','); c[3]='키보드이름'; s[1]=c.join(','); return s.join('\n'); }); fs.writeFileSync(file,csv); await fc.setFiles(file);
      await p.waitForSelector('#sheet .cosm-pv'); assert.match(await p.locator('#sheet .cosm-pv').innerText(),/바뀜 1명/);
      await p.focus('#sheet [data-a="cosmFile"]'); const fc2=await chooser(' ','Space'); await fc2.setFiles([]);
      await p.focus('#sheet [data-a="cosmFile"]'); await p.keyboard.press('Tab'); assert.equal(await p.evaluate(()=>document.activeElement.dataset.a),'cosmPv','파일 불러오기 다음 Tab이 미리보기가 아님'); });

    await T(9,'지난 경기 중계 라인업: 그 경기 전 시즌 기록',async p=>{ const r=await p.evaluate(()=>{ G.day=G.cal.open+2; for(const t of G.teams)setEntry(t.id); const op=G.teams.find(t=>t.id!==G.user).id; G.games=[];
        for(let i=0;i<6;i++){ G.day++; const g=simGame(G.day,G.user,op,false); applyGame(G.day,G.user,op,g,false); keepGame(gameRecord(G.day,G.user,op,g,'')); }
        const cell=(g,k)=>{ const s=castSnapshot(g,k), o={}; for(const sd of ['a','h']){ const h=mdLineup(g,sd,s); const ids=[...h.matchAll(/data-v="(\d+)"/g)].map(m=>+m[1]), sm=[...h.matchAll(/<small>([^<]*)<\/small>/g)].map(m=>m[1]); ids.forEach((id,i)=>o[id]=sm[i]); } return o; };
        const op1=G.games[G.games.length-1], last=G.games[0], a=cell(op1,0), z=cell(last,last.pbp.length);
        const want={}; for(const id in z){ const t=seasonTotal(G.players[id],G.year,'1군'); want[id]=t&&t.ab?`${fmt3(t.h/t.ab)} · ${t.hr||0}홈런`:'-'; }
        /* 개막전 도중: 이 장면까지 오늘 기록만 */ const mid=Math.floor(op1.pbp.length/2), m=cell(op1,mid), snap=castSnapshot(op1,mid), wantM={}; for(const id in m){ const r=snap.players[id]; wantM[id]=r&&r.ab?`${fmt3(r.h/r.ab)} · ${r.hr||0}홈런`:'-'; }
        return {a,z,want,m,wantM,cur:mdSeasonBat(+Object.keys(a)[0])}; });
      const bad=Object.entries(r.a).filter(([,v])=>!(v==='-'||/^\.000 · 0홈런$/.test(v))); assert.deepEqual(bad,[],'개막전 시작에 시즌 기록이 보임(지금 시즌 '+r.cur+')');
      assert.deepEqual(r.m,r.wantM,'개막전 도중 = 이 장면까지'); assert.deepEqual(r.z,r.want,'마지막 경기 끝 = 지금 시즌 합계'); });
  } finally { await b.close(); server.close(); fs.rmSync(tmp,{recursive:true,force:true}); }
  if(fails.length){ console.log('실패: '+fails.join(', ')); process.exit(1); } console.log('외부 검수 11-17e 점검: 모두 통과'); })().catch(e=>{ console.error(e); process.exit(1); });
