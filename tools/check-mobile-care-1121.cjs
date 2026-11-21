const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
let failed=0;const check=(name,fn)=>{try{fn();console.log('PASS '+name);}catch(e){failed++;console.error('FAIL '+name+': '+e.message);}};
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const players=[.1,.1,.1,.17,.35,1,1].map((inj,id)=>({id:id+1,name:'선수 '+(id+1),team:6,inj,injOut:id===5?7:0,ys:id===6,fat:10,isP:false,e1:true,injHist:[]}));
players[0].injHist=[{d:80,days:10,bk:90}];players[1].injHist=[{d:30,days:10,bk:40}];players[5].injHist=[{d:80,days:10,bk:90}];
const ctx=vm.createContext({G:{user:6,day:100,year:2026},players,esc,playersOf:()=>players,ownedOf:()=>players,injMult:()=>1,staI:()=>1,consecDays:()=>0,loadMult:()=>1,armRatio:()=>0,posLabel:()=> '내야수',dmd:n=>'날짜 '+n,injName:k=>k,R:()=>{throw Error('Display must not consume main RNG');}});
const med=read('src/ui/staff/34b_staff_fm.js'),a=med.indexOf('function medRisk('),b=med.indexOf('/* PC 데이터 허브',a);assert.ok(a>=0&&b>a);vm.runInContext(med.slice(a,b),ctx);
check('Mobile medical lists expose the same high-risk players and recent recovery details',()=>{
 const before=JSON.stringify({G:ctx.G,players}),html=vm.runInContext('medMobileLists()',ctx);
 assert.match(html,/위험 선수\s*2명/);assert.match(html,/data-med-player="4"/);assert.match(html,/data-med-player="5"/);
 assert.doesNotMatch(html,/data-med-player="6"|data-med-player="7"/,'injured/future players do not enter risk review');
 assert.match(html,/최근 복귀/);assert.match(html,/data-med-return="1"/);assert.doesNotMatch(html,/data-med-return="2"|data-med-return="6"/,'old recoveries and currently injured players stay excluded');
 assert.match(html,/날짜 90/);assert.match(html,/data-a="player"/);assert.equal(JSON.stringify({G:ctx.G,players}),before);
 assert.match(read('src/ui/staff/34_staff.js'),/medMobileLists\(\)/);
});
check('Mobile medical empty and legacy states are readable without modifying records',()=>{
 const saved=ctx.players.splice(0);assert.match(vm.runInContext('medMobileLists()',ctx),/위험 높은 선수가 없습니다/);assert.match(vm.runInContext('medMobileLists()',ctx),/최근 30일 안에 복귀한 선수가 없습니다/);ctx.players.push(...saved);
 const first=players[0].injHist;players[0].injHist=[{d:80,days:10}];assert.match(vm.runInContext('medMobileLists()',ctx),/날짜 90/,'legacy return date is inferred from the existing record');players[0].injHist=[{bk:90}];const partial=vm.runInContext('medMobileLists()',ctx);assert.match(partial,/기간 기록 없음/);assert.doesNotMatch(partial,/undefined|NaN/);players[0].injHist=first;
});
const funding=vm.createContext({G:{user:6},A:{},esc,FACI:{indoor:{c:[0,0,4000]}},team:()=>({indie:false}),facOf:()=>1,facCanStart:()=>'',facBig:()=>false,oddsWord:()=> '보통',money:n=>n+'백만원',R:()=>{throw Error('Display must not consume main RNG');}});
const econ=read('src/engine/finance/57_club_econ.js');vm.runInContext(econ.split('\n').filter(l=>/^const FAC_SPON=|^const facOwnPart=|^const FAC_CITY=/.test(l)).join('\n'),funding);
const info={cash:{ok:true},cap:{ok:true,p:.5},spon:{ok:true,p:.5},city:{ok:true,p:.5}};funding.facRouteInfo=()=>info;
vm.runInContext(read('src/ui/facilities/61_fac_routes.js'),funding);
check('Funding disclosure shows the upfront instalment and obligations without changing action buttons',()=>{
 const before=JSON.stringify(info),html=vm.runInContext("facRouteBtns('indoor')",funding);
 assert.match(html,/<details[^>]*fac-funding-help/);assert.match(html,/3333백만원/,'sponsor upfront cost uses only the first instalment');
 assert.match(html,/2400백만원/,'city upfront share matches the payment helper');assert.match(html,/3시즌/);assert.match(html,/80%/);assert.match(html,/지역 야구 교실/);
 assert.equal((html.match(/data-a="(?:buildFacItem|capex|facFund)"/g)||[]).length,4,'disclosure adds no executable funding action');assert.equal(JSON.stringify(info),before);
 info.spon={ok:false,why:'이미 명명권 계약이 있습니다.'};assert.match(vm.runInContext("facRouteBtns('indoor')",funding),/현재 신청 불가: 이미 명명권 계약이 있습니다\./);
});
if(failed)process.exitCode=1;
