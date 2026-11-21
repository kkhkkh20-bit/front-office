// Render real inbox functions with independent read/action/deadline fixtures.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.resolve(__dirname,'../src/ui/media/19_inbox.js'),'utf8');
const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const make=(id,rest={})=>({id,from:'운영팀',subj:'소식 '+id,body:'새 소식입니다.',day:100,kind:'운영',read:false,acts:[],...rest});
const mails=[
 make('report'),
 make('important',{imp:true,stop:true}),
 make('read-pending',{read:true,stop:true,kind:'결정',acts:[{a:'evPick',v:'e1:0',l:'행사 진행 · 5천만 원'}],body:'배경\n첫 효과\n둘째 효과\n셋째 효과\n주의\n선택 시 구단 비용 5천만 원'}),
 make('unread-pending',{stop:true,kind:'결정',acts:[{a:'evPick',v:'e2:0',l:'제안 수락'}]}),
 make('resolved',{read:true,kind:'결정',acts:[{a:'evPick',v:'e3:0',l:'처리한 선택',done:true,res:'처리 결과'}],status:{label:'처리 완료',text:'이미 답했습니다.'}}),
 make('expired',{kind:'결정',acts:[{a:'evPick',v:'e4:0',l:'기한 지난 선택'}],status:{label:'기한 종료',text:'답변 기한이 지났습니다.'}}),
 make('read-report',{read:true})
];
const G={year:2026,day:100,mail:mails,ibFold:{},cfg:{bdayOff:true},offers:[],spon:{off:[]},evs:[{id:'e1',mid:'read-pending',exp:103},{id:'e2',mid:'unread-pending',exp:100}],players:{}};
const ctx=vm.createContext({G,UI:{mf:'all',open:{}},window:{_ibFitOn:1},esc,lk:esc,spoilG:()=>null,mailStatus:m=>m.status||null,stopOn:m=>!!m.stop,mailActionStatus:()=>null,evCanLate:()=>false,evChoiceLabel:()=>'',senderAv:()=>'<i></i>',dsh:d=>'D'+d,dmd:d=>'D'+d,dobj:()=>({y:2026,w:0}),WD:['일'],wide:()=>false,fmOn:()=>false,tkAt:()=>'',phWrap:s=>s,senderPhotoKey:()=>'',mailScene:()=>'',handOffActs:()=>({b:'',d:''}),mailActionHTML:(m,a)=>`<button data-a="${a.a}" data-v="${a.v}">${esc(a.l)}</button>`,EV_GM:new Set(),evOwn:()=>true});
// Only resize wiring runs at top level, and the fixture disables it.
vm.runInContext(source,ctx);
const run=s=>vm.runInContext(s,ctx),ids=s=>JSON.parse(JSON.stringify(run(s)));
let failures=0;const check=(name,fn)=>{try{fn();console.log('PASS '+name);}catch(e){failures++;console.error('FAIL '+name+': '+e.message);}};
check('Existing filter membership, required counts and read state remain distinct',()=>{
 assert.deepEqual(ids("mailFilter('all').map(m=>m.id)"),mails.map(m=>m.id));
 assert.deepEqual(ids("mailFilter('task').map(m=>m.id)"),['important','read-pending','unread-pending']);
 assert.deepEqual(ids("mailFilter('unread').map(m=>m.id)"),['report','important','unread-pending','expired']);
 assert.deepEqual(ids('ibDecideList().map(m=>m.id)'),['unread-pending','read-pending']);
 assert.deepEqual(ids('ibNeedList().map(m=>m.id)'),['important','read-pending','unread-pending']);
 assert.equal(run('ibDue(G.mail[2])'),103);assert.equal(run('ibDue(G.mail[3])'),100);
});
check('Read and unread live decisions show reply status and the actual deadline',()=>{
 const read=run('mailRow(G.mail[2],false)'),unread=run('mailRow(G.mail[3],false)');
 assert.match(read,/답변 필요/);assert.match(read,/D-3/);assert.doesNotMatch(read,/class="ibr unread/);
 assert.match(unread,/답변 필요/);assert.match(unread,/오늘까지/);assert.match(unread,/class="ibr unread/);
 assert.match(run('mailRow(G.mail[1],false)'),/확인 필요/);
 assert.match(run('mailRow(G.mail[4],false)'),/처리 완료/);assert.doesNotMatch(run('mailRow(G.mail[4],false)'),/답변 필요/);
 assert.match(run('mailRow(G.mail[5],false)'),/기한 종료/);assert.doesNotMatch(run('mailRow(G.mail[5],false)'),/답변 필요/);
});
check('Pending card preserves all effect text, costs and original action values',()=>{
 const before=JSON.stringify(G),html=run('mailCard(G.mail[2])');
 assert.match(html,/답변 필요/);assert.match(html,/D-3/);assert.match(html,/선택 시 구단 비용 5천만 원/);assert.match(html,/data-a="evPick" data-v="e1:0"/);assert.doesNotMatch(html,/class="mfold"/);
 assert.equal(JSON.stringify(G),before);
});
check('Navigation describes task scope without changing its filter or unread count',()=>{
 run("UI.mf='task'");const before=JSON.stringify(G),html=run('inboxView()');
 assert.match(html,/처리할 일/);assert.match(html,/답변할 일 · 확인하지 않은 중요 소식/);assert.match(html,/미읽음/);assert.match(html,/id="ib-unread">4</);
 assert.equal((html.match(/data-mid="read-pending"/g)||[]).length,1);assert.equal((html.match(/data-mid="expired"/g)||[]).length,0);
 assert.equal(JSON.stringify(G),before);
 const dash=run('ibDash(3)');assert.match(dash,/처리할 일/);assert.match(dash,/답변 필요/);
});
if(failures)process.exitCode=1;
