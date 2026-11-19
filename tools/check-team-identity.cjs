/* 구단 표시 이름·올린 로고 화면 점검(마인2 11-16: "로고를 넣으면 방패 모양에 들어가서 사진이 짤리고, 앞에 지역명이 고정되어 있어서 구단명이 실제 크보 구단이랑 맞지 않습니다")
   - 가로로 긴 투명 PNG를 설정의 '이미지 올리기'로 올리면 배지(24·48px)에 방패 없이 그림 전체가 보인다(잘리지 않고, 투명 유지)
   - 구단 표시 이름을 적고 저장하면 순위표·윗줄(구단 이름)·일정에 그 이름(좁은 자리는 약칭)이 보이고, 연고지는 그대로다
   - 예전 96px 정사각형으로 저장된 로고도 그대로 보인다
   사용: node tools/check-team-identity.cjs (index.html 필요: bash build.sh). SHOTS=디렉터리 를 주면 화면을 찍어 둔다 */
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
(async()=>{ const server=await startHtmlServer(path.resolve(__dirname,'../index.html')); let browser; const failures=[],errors=[]; const check=(v,m)=>{ if(!v)failures.push(m); };
  const SH=process.env.SHOTS||''; if(SH)fs.mkdirSync(SH,{recursive:true}); const shot=async(p,n,el)=>{ if(!SH)return; if(el)await el.screenshot({path:path.join(SH,n)}); else await p.screenshot({path:path.join(SH,n)}); };
  try{ browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'}); const p=await browser.newPage({viewport:{width:1366,height:900}});
    p.on('pageerror',e=>errors.push(e.message)); await p.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'})); await p.route('https://www.googletagmanager.com/**',r=>r.fulfill({body:'',contentType:'text/javascript'}));
    await p.goto(server.url,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>performance.getEntriesByName('fronttime-menu-ready').length>0);
    await p.evaluate(()=>{ DEMO.on=false; newGame(6); fdStart(); fdAdvance(false); let n=0; while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true); hireMgr(G.mmarket[0].id,3); G.tut={done:true,step:99}; G.medSet=true; UI.title=false; UI.menu=false; UI._clk=null; });
    const city0=await p.evaluate(()=>({city:team(G.user).city,region:team(G.user).region,market:team(G.user).market}));
    /* 1) 가로로 긴(3:1) 투명 PNG: 양 끝에 빨강·파랑 막대를 그려, 잘리면 끝 색이 사라진다 */
    const png=await p.evaluate(()=>{ const c=document.createElement('canvas'); c.width=300; c.height=100; const x=c.getContext('2d'); x.clearRect(0,0,300,100); x.fillStyle='#ff0000'; x.fillRect(0,20,40,60); x.fillStyle='#0000ff'; x.fillRect(260,20,40,60); x.fillStyle='#00aa00'; x.fillRect(120,30,60,40); return c.toDataURL('image/png').split(',')[1]; });
    await p.evaluate(()=>{ UI._clk=null; A.go('club:set'); UI.lgEdit=G.user; render(); });
    const inp=p.locator(`input[data-lgimg="${await p.evaluate(()=>G.user)}"]`); check(await inp.count()===1,'로고 이미지 올리기 칸이 없음');
    await inp.setInputFiles({name:'wide.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
    await p.waitForFunction(()=>team(G.user).logo&&team(G.user).logo.img,null,{timeout:5000});
    const info=await p.evaluate(()=>new Promise(res=>{ const u=team(G.user).logo.img; const im=new Image(); im.onload=()=>{ const c=document.createElement('canvas'); c.width=im.width; c.height=im.height; const x=c.getContext('2d'); x.drawImage(im,0,0); const px=(a,b)=>Array.from(x.getImageData(a,b,1,1).data); res({w:im.width,h:im.height,left:px(4,96),right:px(187,96),mid:px(96,96),top:px(96,10),u:u.slice(0,16)}); }; im.src=u; }));
    check(info.w===192&&info.h===192,'올린 로고가 192px 정사각형이 아님: '+info.w+'x'+info.h);
    check(info.left[0]>200&&info.left[3]>200,'왼쪽 끝(빨강)이 잘림: '+info.left); check(info.right[2]>200&&info.right[3]>200,'오른쪽 끝(파랑)이 잘림: '+info.right);
    check(info.top[3]===0,'남는 곳이 투명하지 않음(배경이 칠해짐): '+info.top); check(/^data:image\/(webp|png)/.test(info.u),'webp/png가 아님: '+info.u);
    for(const sz of [24,48]){ const r=await p.evaluate(sz=>{ const d=document.createElement('div'); d.id='bprobe'+sz; d.style.cssText='position:fixed;left:10px;top:10px;z-index:99999;background:#fff;padding:6px'; d.innerHTML=badge(G.user,sz); document.body.appendChild(d); const el=d.firstElementChild, b=el.getBoundingClientRect(), cs=getComputedStyle(el);
        return {tag:el.tagName, w:Math.round(b.width), h:Math.round(b.height), fit:cs.objectFit, clip:!!d.querySelector('clipPath,[clip-path]'), path:!!d.querySelector('path')}; },sz);
      check(r.tag==='IMG'&&r.fit==='contain','배지 '+sz+'px가 그림(object-fit contain)이 아님: '+JSON.stringify(r)); check(!r.clip&&!r.path,'배지 '+sz+'px가 방패로 잘림'); check(r.w===sz&&r.h===sz,'배지 '+sz+'px 크기가 틀림: '+r.w+'x'+r.h);
      await shot(p,'badge-'+sz+'.png',p.locator('#bprobe'+sz)); await p.evaluate(sz=>document.getElementById('bprobe'+sz).remove(),sz); }
    await shot(p,'logo-editor.png',p.locator('.lg-ed').first());
    /* 2) 예전 96px 정사각형 로고(잘라 넣던 때 저장)도 보인다 */
    const old=await p.evaluate(()=>{ const c=document.createElement('canvas'); c.width=96; c.height=96; const x=c.getContext('2d'); x.fillStyle='#123456'; x.fillRect(0,0,96,96); const u=c.toDataURL('image/png'); const t=G.teams.find(t=>t.id!==G.user); const r=setTeamLogo(t.id,{img:u}); const h=badge(t.id,24); setTeamLogo(t.id,null); return {r,ok:/<img class="badge bimg bup"/.test(h)&&h.includes(u)}; });
    check(old.r===''&&old.ok,'예전 96px 로고가 안 보임');
    /* 3) 구단 표시 이름·약칭: 설정 칸에 적고 저장 */
    const uid=await p.evaluate(()=>G.user); const ops=await p.evaluate(()=>G.teams.filter(t=>t.id!==G.user).map(t=>t.id));
    await p.locator(`input.tn-d[data-tn="${uid}"]`).fill('점검 라이온즈'); /* 상대 구단은 모두 '상대 타이거n'(약칭은 직접 '타이거n') */
    for(const [i,op] of ops.entries()){ await p.locator(`input.tn-d[data-tn="${op}"]`).fill('상대 타이거즈'+i); await p.locator(`input.tn-a[data-tn="${op}"]`).fill('타이거'+i); }
    check(await p.locator('.tn-note').count()===1&&(await p.locator('.tn-note').innerText()).includes('연고지'),'연고지 안내 줄이 없음');
    await p.locator('[data-a="tnSave"]').click(); await p.waitForTimeout(150);
    const nm=await p.evaluate(()=>({me:tshort(G.user),msg:UI.tnMsg}));
    check(nm.me==='점검 라이온즈','저장 뒤 tshort가 표시 이름이 아님: '+JSON.stringify(nm));
    const c1=await p.evaluate(()=>({city:team(G.user).city,region:team(G.user).region,market:team(G.user).market})); check(JSON.stringify(c1)===JSON.stringify(city0),'표시 이름을 저장했더니 연고지가 바뀜');
    await p.locator('.tn-l').scrollIntoViewIfNeeded(); await shot(p,'settings-names.png',p.locator('section:has(.tn-l)'));
    const TOP='.fm-context, .club'; const top=await p.locator(TOP).first().innerText(); check(top.replace(/\s+/g,' ').includes('점검 라이온즈'),'윗줄 구단 이름에 표시 이름이 없음: '+top);
    await shot(p,'topbar.png',p.locator('header').first());
    await p.evaluate(()=>{ UI._clk=null; A.go('league:stand'); });
    const main=await p.locator('main, #app').first().innerText(); check(main.includes('점검 라이온즈'),'순위표에 표시 이름이 없음'); check(/타이거\d/.test(main),'순위표에 상대 약칭이 없음');
    check(!main.includes(city0.city+' 점검'),'순위표에 연고지가 앞에 붙음');
    await shot(p,'standings.png');
    await p.evaluate(()=>{ UI._clk=null; A.go('cal'); A.calJump(G.cal.open+3); }); /* 개막 달로 */ const cal=await p.locator('main, #app').first().innerText(); check(/상대 타이거즈\d|타이거\d/.test(cal),'일정(캘린더)에 상대 구단 표시 이름이 없음: '+cal.slice(0,120)); check(!/(^|\s)(?!상대)[가-힣]{2} 타이거즈\d/.test(cal),'일정에 연고지가 앞에 붙음');
    await shot(p,'schedule.png');
    /* 휴대폰: 순위표·윗줄 넘침 없이 */
    await p.setViewportSize({width:390,height:844}); await p.evaluate(()=>{ UI._clk=null; A.go('league:stand'); });
    check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'휴대폰 순위표 가로 넘침'); const mtxt=await p.locator('main, #app').first().innerText(); check(mtxt.includes('라이온즈'),'휴대폰 순위표에 약칭이 없음'); await p.evaluate(()=>{ UI._clk=null; A.tab('home'); }); const mtop=await p.locator(TOP).first().innerText(); await shot(p,'topbar-mobile.png',p.locator('header').first()); check(mtop.replace(/\s+/g,' ').includes('라이온즈')&&!mtop.includes(city0.city+' '),'휴대폰 윗줄 구단 이름: '+mtop);
    await shot(p,'standings-mobile.png');
    await p.evaluate(()=>{ UI._clk=null; UI.it=Object.assign(UI.it||{},{setg:'view'}); A.go('club:set'); }); check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'휴대폰 설정 가로 넘침'); await p.locator('.tn-l').scrollIntoViewIfNeeded(); await shot(p,'settings-mobile.png');
    /* 4) 새 게임에도 쓰기: 저장·복원 */
    await p.setViewportSize({width:1366,height:900}); await p.evaluate(()=>{ UI._clk=null; A.go('club:set'); });
    const pre=await p.evaluate(()=>{ localStorage.removeItem(TN_KEY); tnStore(true); const o=JSON.parse(localStorage.getItem(TN_KEY)); const me=o.L.find(x=>x.id===G.user); const u=G.user; newGame(u); const r={disp:me.disp,abbr:me.abbr,img:!!(me.logo&&me.logo.img),after:tshort(u),afterLogo:!!(team(u).logo&&team(u).logo.img)}; tnStore(false); localStorage.removeItem(TN_KEY); return r; });
    check(pre.disp==='점검 라이온즈'&&pre.after==='점검 라이온즈'&&pre.afterLogo,'새 게임에도 쓰기가 표시 이름·로고를 저장·복원하지 않음: '+JSON.stringify(pre));
    assert.deepEqual(errors,[]); assert.deepEqual(failures,[]); console.log('구단 표시 이름·올린 로고(자르지 않음) 화면 점검 통과');
  }finally{ await browser?.close(); await server.close(); } })().catch(e=>{ console.error(e); process.exit(1); });
