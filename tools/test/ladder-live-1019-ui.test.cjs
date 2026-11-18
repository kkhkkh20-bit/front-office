/* Actual UI functions with controlled network and storage; no replacement implementation. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
function ui(storage=new Map()){
 const U={league:null,car:{w:83,l:59},hist:[{id:1}],last:{id:0}},calls=[],who={id:'player-one'},N={signedIn:()=>true,player:()=>who,live:async b=>{calls.push(b);return {ok:false,status:0};}};
 const ctx={console,A:{},G:{},UI:{},FrontOfficeCore:{netEnabled:()=>true},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},document:{addEventListener(){}},setInterval(){},setTimeout(){},save(){},render(){},confirm:()=>true,cupWid:()=> 'world',uld:()=>U,xfAvail:()=>true,ulStand:()=>[{key:0,w:1,l:0,t:0}]};vm.createContext(ctx);
 for(const f of ['01_uladder_ui.js','05_uladder_auto.js'])vm.runInContext(fs.readFileSync(path.join(root,'src/ui/uladder',f),'utf8'),ctx);
 ctx.N=N;vm.runInContext("UL.N=N;UL.v1='ok';",ctx);return {ctx,U,calls,who,N,storage};
}
const league=()=>({net:1,nk:'world.league1019',tier:0,next:1,sched:[{r:9}],teams:[{name:'우리',kind:'me'}],post:{next:0}});
test('1019 actual quit durably queues offline close; reload only retries under original player, preserving local records',async()=>{
 const x=ui(),L=x.U.league=league();L.livePid=x.who.id;const raw=JSON.stringify([x.U.car,x.U.hist,x.U.last]);x.ctx.A.ulQuit();await x.ctx.ulLiveFlush();assert.equal(x.U.league,null);assert.equal(JSON.stringify([x.U.car,x.U.hist,x.U.last]),raw);assert.equal(x.ctx.ulLiveQueue().length,1);assert.equal(x.calls[0].ended,1);
 const reloaded=ui(x.storage);reloaded.who.id='different-player';reloaded.N.live=async b=>{reloaded.calls.push(b);return {ok:true};};await reloaded.ctx.ulLiveFlush();assert.equal(reloaded.calls.length,0,'old player close is not sent under new auth');assert.equal(reloaded.ctx.ulLiveQueue().length,1);
 reloaded.who.id='player-one';await reloaded.ctx.ulLiveFlush();assert.equal(reloaded.calls.length,1);assert.equal(reloaded.calls[0].key,L.nk);assert.equal(reloaded.ctx.ulLiveQueue().length,0);
});
test('1019 inactive world, changed player and closed league cannot send active reports',async()=>{
 const x=ui(),old=league();x.U.league=league();x.ctx.ulLive(old);assert.equal(x.calls.length,0,'inactive world report blocked');x.U.league.livePid='another-player';x.ctx.ulLive(x.U.league);assert.equal(x.calls.length,0,'identity mismatch blocked');x.U.league.livePid=x.who.id;x.ctx.ulLiveEnd(x.U.league);await x.ctx.ulLiveFlush();const n=x.calls.length;x.ctx.ulLive(x.U.league);assert.equal(x.calls.length,n,'queued close blocks new active report');
});
test('1020 actual live reports carry only current completed series with increasing revision and stable opened time',async()=>{
 const x=ui(),L=x.U.league=league();x.ctx.ulLive(L);L.post.next=2;x.ctx.ulLive(L);assert.equal(x.calls.length,2);assert.equal(x.calls[0].stage,'semi-ready');assert.equal(x.calls[1].stage,'final-ready');assert.equal(x.calls[1].postDone,2);assert.equal(x.calls[1].postTotal,3);assert.ok(x.calls[1].revision>x.calls[0].revision);assert.equal(x.calls[0].opened,x.calls[1].opened);assert.equal(L.livePid,x.who.id);assert.equal(x.calls[1].champ,undefined,'unreported future champion is absent');
});
