// Verify the real shared finance renderer with distinct budget and regulatory values.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),file=process.env.FINANCE_SOURCE||path.join(root,'src/ui/finance/38_finance_tab.js'),source=fs.readFileSync(file,'utf8');
const begin=source.indexOf('function bspCards('),end=source.indexOf('function finMonthCard(',begin);assert.ok(begin>=0&&end>begin);
const base={indie:false,buy:{avail:11164,spent:100,cash:4000,room:7164},pay:{room:2345,capLeft:9182,pay:5585,cap:14767,spent:5585,fRoom:123,floor:8500,floorGap:2915},ops:{left:28498,spent:266,budget:28764}};
let failed=0;const check=(name,fn)=>{try{fn();console.log('PASS '+name);}catch(e){failed++;console.error('FAIL '+name+': '+e.message);}};
const render=(state,home=false)=>{const before=JSON.stringify(state),ctx=vm.createContext({budgetSplit:()=>state,money:n=>n+'원',clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),R:()=>{throw Error('Finance display must not consume main RNG');}});vm.runInContext(source.slice(begin,end),ctx);const html=vm.runInContext('bspCards('+JSON.stringify(home)+')',ctx);assert.equal(JSON.stringify(state),before,'rendering must not mutate financial data');assert.equal((html.match(/class="bsp-c"/g)||[]).length,3,'keep the shared three-card layout');assert.doesNotMatch(html,/data-a=/,'summary must not gain spending actions');return{html,middle:html.split('<div class="bsp-c">')[2]};};
check('Budget room and salary-cap headroom remain separate, labelled and equally prominent',()=>{
 const {html,middle}=render(structuredClone(base));
 assert.match(middle,/샐러리캡 여유[\s\S]*예산과 별개/,'the regulatory limit needs a visible local caveat');
 assert.match(middle,/<b class="bsp-big ">9182원<\/b>/,'cap headroom must retain its existing value');
 assert.match(middle,/추가 연봉 예산[\s\S]*class="bsp-big[^\"]*">2345원/,'actual budget room must remain prominent and distinct');
 assert.match(middle,/하한까지 부족[\s\S]*2915원/);assert.match(middle,/외국인 배정 남음[\s\S]*123원/);
 assert.match(html,/11164원/);assert.match(html,/28498원/);assert.match(middle,/width:37\.8%/,'preserve the existing cap-consumption bar');
});
check('Negative budget, exceeded cap, floor shortfall and operating deficit stay visible',()=>{
 const s=structuredClone(base);s.pay.room=-321;s.pay.capLeft=-57;s.pay.floorGap=780;s.ops.left=-7;const {html,middle}=render(s);
 assert.match(middle,/<b class="bsp-big bad">상한 초과 57원<\/b>/);assert.match(middle,/추가 연봉 예산[\s\S]*class="bsp-big bad">-321원/);
 assert.match(middle,/하한까지 부족[\s\S]*class="bad">780원/);assert.match(html,/<b class="bsp-big bad">-7원<\/b>/);
});
check('Home cards preserve budget room, and independent clubs warn that both budgets share cash',()=>{
 const s=structuredClone(base);s.indie=true;for(const home of [false,true]){const {html,middle}=render(s,home);assert.match(middle,/샐러리캡 여유[\s\S]*예산과 별개/);assert.match(middle,/추가 연봉 예산[\s\S]*2345원/);assert.match(html,/class="small muted bsp-n keep">선수 영입 자금·추가 연봉 예산은 같은 현금을 씁니다\./,'the shared-cash warning must not be collected into generic help');if(!home)assert.match(html,/자금원[\s\S]*보유 현금만/);}
});
if(failed)process.exitCode=1;
