// Render the real guide/home functions with fixed tasks, then exercise the unchanged UI action contracts.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const tasks=[
 {k:'trade',t:'트레이드 마감 전 보강',why:'7월 31일 이후에는 시즌이 끝날 때까지 트레이드할 수 없습니다.',ok:false,go:['goWork','트레이드'],prog:'7월 31일까지',deleg:['tro']},
 {k:'fdl',t:'외국인 교체 마감',why:'8월 15일 전에 확인합니다.',ok:false,go:['goWork','외국인선수'],prog:'8월 15일까지'},
 {k:'draft',t:'신인 드래프트',why:'선수 지명은 단장이 직접 합니다.',ok:false,go:['goWork','신인드래프트'],prog:'9월 16일',deleg:['scout']},
 {k:'ev',t:'결정·요청에 답하기',ok:true,go:['tab','inbox']}
];
let active=new Set(),calls=[],failed=0;
const ctx=vm.createContext({G:{year:2026,startY:2026,day:150,cal:{open:100},tut:{done:true},cfg:{}},UI:{tab:'home'},A:{goWork:v=>calls.push(['goWork',v]),tab:v=>calls.push(['tab',v])},
 AUTO_AREAS:[['sal','국내 연봉 협상'],['fre','외국인 재계약'],['ev','일상 결정'],['mgr','감독 요청'],['scout','스카우트 배치'],['tro','받은 트레이드 제안'],['cvac','코치 빈자리'],['fall','교육리그']],AUTO_OPTIN:new Set(['fall']),AUTO_WHO:{tro:'부단장',scout:'스카우트팀장'},
 autoOn:k=>active.has(k),autoAll:on=>calls.push(['autoAll',on]),handOff:k=>{calls.push(['handOff',k]);return '위임했습니다.';},period:()=> 'season',dmd:d=>'3월 28일',curSub:()=>'',save:()=>{},render:()=>{},toast:()=>{},R:()=>{throw Error('Home display must not consume main RNG');},esc:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;')});
vm.runInContext(read('src/ui/components/55_guide_bar.js'),ctx);
ctx.guideItems=()=>tasks;
const home=read('src/ui/home/06_home_workspace.js');vm.runInContext(home.slice(home.indexOf('function homeStartPanel()'),home.indexOf('function homeWorkspace()')),ctx);
const run=code=>vm.runInContext(code,ctx),test=(name,fn)=>{try{fn();console.log('PASS '+name);}catch(e){failed++;console.error('FAIL '+name+': '+e.message);}};
test('Home tasks show action names while keeping their exact destinations and deadlines',()=>{const html=run('homeStartPanel()');
 for(const [key,label] of [['trade','트레이드 열기'],['fdl','외국인 확인'],['draft','드래프트 열기']])assert.match(html,new RegExp('data-a="guideGo" data-v="'+key+'">'+label+'<'));
 assert.doesNotMatch(html,/>하기<|>쉬운 진행<|>쉬운 진행 켜기</);assert.match(html,/7월 31일까지/);assert.match(html,/8월 15일까지/);assert.match(html,/시즌이 끝날 때까지 트레이드할 수 없습니다/);
 run("A.guideGo('trade')");assert.deepEqual(calls.pop(),['goWork','트레이드']);
});
test('Delegation is shown once, with scope and an honest partial state',()=>{const before=JSON.stringify(ctx.G);active=new Set(['sal']);const html=run('homeStartPanel()');
 assert.equal((html.match(/data-a="easyMode"/g)||[]).length,1,'there is one bulk delegation control');assert.match(html,/반복 업무 위임/);assert.match(html,/일부 위임/);assert.match(html,/data-a="easyMode" data-v="1"/);
 assert.match(html,/드래프트·FA·외국인 영입·트레이드 협상은 직접/);assert.match(html,/<details[^>]*>\s*<summary[^>]*>위임 범위/);assert.equal(JSON.stringify(ctx.G),before,'display does not alter the game');
 assert.match(html,/data-a="guideDeleg" data-v="trade"/);assert.match(html,/부단장에게 맡기기/);
});
test('Bulk and per-task delegation retain their existing action payloads',()=>{calls=[];run("A.easyMode('1'); A.easyMode('0'); A.guideDeleg('trade')");assert.deepEqual(calls,[['autoAll',true],['autoAll',false],['handOff','tro']]);
 active=new Set(['sal','fre','ev','mgr','scout','tro','cvac']);const html=run('guideEasyLine()');assert.match(html,/켜짐/);assert.match(html,/data-a="easyMode" data-v="0"/);active=new Set();assert.match(run('guideEasyLine()'),/꺼짐/);
});
if(failed)process.exitCode=1;
