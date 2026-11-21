/* Stadium appearance reads the completed venue, without changing saves or simulation RNG. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),context={Math,console};
vm.createContext(context);
vm.runInContext(`
const G={day:100,user:0,year:2026};
const STAD_MAX=12,STAD_DAYS=[0,0,60,90,120,150,210,270,330,345,360,365,365];
const STAD_ITEMS=['seat','fnb','prem','vis','turf'].map(k=>({k}));
const NEWSTAD=[{k:'mid',l:'실속형',cap:21000},{k:'big',l:'대형',cap:25000},{k:'dome',l:'돔구장',cap:23000},{k:'mega',l:'초대형',cap:30000}];
let current={lv:{seat:4,fnb:4,prem:4,vis:4,turf:4},build:[],cap:23000,dome:false};
const stadOf=()=>current,clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),dobj=()=>({y:2029});
const newStadKind=()=>current.nk||null,stadCap=()=>current.cap||23000,cTeamCol=()=>'#b9273b';
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
`,context);
vm.runInContext(fs.readFileSync(path.join(root,'src/gfx/facilities/iso.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(root,'src/ui/facilities/62_iso_views.js'),'utf8'),context);
const run=s=>vm.runInContext(s,context),plain=v=>JSON.parse(JSON.stringify(v));
const before=run('JSON.stringify(current)');
assert.equal(run('stadIsoOpts(0).kind'),'classic','existing open venue has a safe classic appearance');
run("current.proj={stage:'build',k:'dome',start:50,done:200}");
assert.equal(run('stadIsoOpts(0).dome'),false,'dome construction must not roof the current open venue');
assert.equal(run('stadIsoOpts(0).kind'),'classic','pending project does not replace current stadium design');
const renderings=[];
for(const [kind,cap] of [['mid',21000],['big',25000],['dome',23000],['mega',30000]]){
 run(`current={lv:{seat:4,fnb:4,prem:4,vis:4,turf:4},build:[],nk:'${kind}',cap:${cap},dome:${kind==='dome'},mega:${kind==='mega'}}`);
 const snapshot=run('JSON.stringify(current)'),o=plain(run('stadIsoOpts(0)')),svg=run('isoStadiumSvg(stadIsoOpts(0))');
 assert.equal(o.kind,kind);assert.equal(o.cap,cap);
 assert.match(svg,new RegExp(`data-stadium-kind="${kind}"`));
 assert.match(svg,/iso-adboards/,'stadium includes decorative advertising boards');
 assert.equal(/class="iso-dome-roof"/.test(svg),kind==='dome','roof only appears on the current dome');
 assert.doesNotMatch(svg,/NaN|undefined|Infinity/);
 assert.equal(run('JSON.stringify(current)'),snapshot,'render does not mutate save state');
 assert.equal(run('isoStadiumSvg(stadIsoOpts(0))'),svg,'same venue renders deterministically');
 renderings.push(svg);
}
assert.equal(new Set(renderings).size,4,'all completed venue types have distinct appearances');
run('current={lv:{seat:12,fnb:12,prem:12,vis:12,turf:12},build:[],dome:false}');
assert.match(run('stadIsoPic(0)'),/<b>12<\/b>\/12/,'facility captions use the actual level cap');
assert.doesNotMatch(run('stadIsoPic(0)'),/\/5(?:<|\s)/,'no obsolete five-level captions');
run('current={lv:{seat:2,fnb:2,prem:2,vis:2,turf:2},build:[],dome:false,proj:{stage:"build",k:"dome",start:50,done:200}}');
assert.match(run('isoStadiumSvg(stadIsoOpts(0))'),/iso-new-site/,'future stadium has its own construction site');
run('current={lv:{seat:2,fnb:2,prem:2,vis:2,turf:2},build:[]}');
assert.doesNotThrow(()=>run('isoStadiumSvg(stadIsoOpts(0))'),'old save with missing optional venue fields renders');
assert.match(run('isoFarmField(0,0,80,2,"#123456")'),/<g/,'farm field remains available');
assert.match(run('isoBus(1,{col:"#123456"})'),/<polygon/,'bus remains available');
console.log('Stadium SVG: completed types, pending projects, legacy saves, levels12, deterministic read-only rendering passed');
