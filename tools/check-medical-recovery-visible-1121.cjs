// Source-level rendering regression: PC and phone must retain the same recovery status.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const shell=fs.readFileSync(path.join(root,'src/ui/shell/02_work_tabs.js'),'utf8');
const staff=fs.readFileSync(path.join(root,'src/ui/staff/34b_staff_fm.js'),'utf8');
const common=shell.slice(shell.indexOf('function injNowList()'),shell.indexOf('function devPage()'));
const desktop=staff.slice(staff.indexOf('function medRisk('),staff.indexOf('/* PC 데이터 허브'));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const player=(id,extra={})=>({id,name:'검증선수'+id,team:1,age:27,isP:false,e1:false,inj:.1,fat:0,injOut:0,injHist:[],injFx:[],...extra});
const injured=player(2,{injOut:18,injK:'elbow'});
const recovery=player(1,{injHist:[{y:2026,d:900,days:40,bk:940,k:'elbow',tid:1}],injFx:[{n:'수술',need:50,got:10}]});
function render(players){
  const G={user:1,year:2026,day:1000,players:Object.fromEntries(players.map(p=>[p.id,structuredClone(p)])),teams:[{id:1},{id:2}],med:{prev:0,hosp:'none'},medSet:true,spend:{med:0,hosp:0},games:[{day:999,hs:3,as:2}]};
  // Presentation helpers are inert; the common recovery collector and both renderers are real source.
  const helpers={esc,playersOf:tid=>Object.values(G.players).filter(p=>p.team===tid),ownedOf:tid=>Object.values(G.players).filter(p=>p.team===tid),milServing:p=>!!p.mil?.unit,consecDays:()=>0,loadMult:()=>1,injMult:()=>1,staI:()=>1,armRatio:()=>0,seasonTotal:()=>null,injTm:(p,x)=>x.tid??p.team,injNow:p=>p.injOut>0?'팔꿈치 부상':'',injName:()=> '팔꿈치 부상',sum:L=>L.reduce((a,b)=>a+b,0),avg:L=>L.reduce((a,b)=>a+b,0)/L.length,clamp:(x,a,b)=>Math.min(b,Math.max(a,x)),dmd:d=>'날짜'+d,posLabel:()=> '외야수',avImg:()=>'',opsPhoto:()=>'',hiI:()=>'',teamDoc:()=>({name:'의무팀장',age:45}),money:n=>String(n),effWord:()=>'',PREV:[{l:'기본',c:0,m:1}],HOSP:{none:{name:'제휴 없음',c:0,d:'',rec:0}},INJ:{elbow:{part:'팔꿈치'}}};
  const api=new Function('G','h',`const {${Object.keys(helpers).join(',')}}=h;\n${common}\n${desktop}\nreturn {injNowList,medBody,medFM};`)(G,helpers);
  const before=JSON.stringify(G),phone=api.medBody(),pc=api.medFM();
  assert.equal(JSON.stringify(G),before,'medical rendering changed game state or records');
  const section=pc.match(/<section class="card md-in">([\s\S]*?)<\/section>/)?.[1]||'';
  const rows=[...section.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map(x=>x[1]);
  return {G,phone,pc,section,rows,status:api.injNowList()};
}
let failures=0,passed=0;
function test(name,run){try{run();passed++;console.log('PASS '+name);}catch(e){failures++;console.error('FAIL '+name+'\n'+e.stack);}}
test('PC retains 20% practical recovery after a return 60 days ago',()=>{const r=render([recovery]);assert.ok(!r.pc.includes('최근 부상에서 복귀 <em>1명'),'fixture must be outside recent-30-day history');const row=r.rows.find(x=>x.includes('data-v="1"'));assert.ok(row,'recovering player absent from current medical table');assert.ok(row.includes(esc(r.status[0].t)),'PC must reuse the common current status and progress');assert.doesNotMatch(r.section,/지금 부상자가 없습니다/);});
test('injured player appears once with remaining days; healthy player stays out',()=>{const r=render([recovery,injured,player(3)]);for(const id of [1,2])assert.equal(r.rows.filter(x=>x.includes('data-v="'+id+'"')).length,1,'one current row per player '+id);assert.equal(r.rows.filter(x=>x.includes('data-v="3"')).length,0);assert.match(r.rows.find(x=>x.includes('data-v="2"')),/18일/);});
test('phone retains existing recovery text and 20% progress',()=>{const r=render([recovery,injured]);assert.ok(r.phone.includes(esc(r.status.find(x=>x.p.id===1).t)));assert.match(r.phone,/수술 뒤 실전 회복 중 20%/);assert.match(r.phone,/복귀까지 18일/);});
test('PC preserves current ineligibility and military qualifiers',()=>{for(const extra of [{hold:true},{susp:1001},{frehab:true},{mil:{unit:'상무'}}]){const r=render([{...recovery,...extra}]),row=r.rows.find(x=>x.includes('data-v="1"'));assert.ok(row?.includes(esc(r.status[0].t)),'current status hidden: '+JSON.stringify(extra));}});
test('completed aftereffects stay out of the current recovery rows',()=>{const r=render([{...recovery,injFx:[{n:'수술',need:50,got:50}]},player(3)]);assert.equal(r.rows.filter(x=>x.includes('data-a="player"')).length,0);assert.match(r.section,/지금 부상자가 없습니다/);});
test('foreign-team and future-join recovery stays outside our current medical list',()=>{const r=render([{...recovery,team:2},player(4,{joinY:2027,injFx:recovery.injFx})]);assert.equal(r.status.length,0);assert.equal(r.rows.filter(x=>x.includes('data-a="player"')).length,0);});
console.log(`${passed} passed, ${failures} failed`);if(failures)process.exitCode=1;
