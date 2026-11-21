/* Rendering-only venue regression: home ownership, completed construction and legacy saves. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),src=fs.readFileSync(path.join(root,'src/ui/matches/21_cast.js'),'utf8');
const states=[{dome:false,lv:{}},{nk:'dome',dome:true,ncap:25000,lv:{vis:5}},{dome:false,lv:{}}];
const ctx={G:{user:0,teams:states.map((stad,id)=>({id,stad}))},A:{},addEventListener(){},stadOf:id=>states[id],newStadKind:id=>states[id].nk||null,stadCap:id=>states[id].ncap||18000,stadName:id=>'구장 '+id,cTeamCol:()=> '#a12639',tname:id=>'구단 '+id,tshort:id=>'구단 '+id,tpal:()=>['','','','#a12639']};
vm.createContext(ctx);vm.runInContext(src,ctx);const venue=g=>JSON.parse(JSON.stringify(vm.runInContext(`cVenue(${JSON.stringify(g)})`,ctx)));
const first=venue({home:1,away:0});assert.equal(first.kind,'dome');assert.equal(first.dome,true);assert.equal(first.cap,25000);assert.equal(first.home,1);
const before=JSON.stringify(states);assert.deepEqual(venue({home:1,away:0}),first);assert.equal(JSON.stringify(states),before,'drawing must not change stadium/save data');
states[2].proj={stage:'build',k:'dome',cap:25000};assert.equal(venue({home:2}).dome,false,'pending dome must not replace open home park');
states[2].nk='big';states[2].ncap=25000;assert.equal(venue({home:2}).kind,'big');assert.equal(venue({home:2}).dome,false);
states[2].nk='dome';states[2].dome=true;assert.equal(venue({home:2}).dome,true);
states[2].nk='mega';states[2].dome=false;assert.equal(venue({home:2}).kind,'mega');assert.equal(venue({home:2}).dome,false,'open replacement after dome must lose roof');
states[2]={nk:'dome',built:2030,ncap:25000,lv:{}};ctx.G.teams[2].stad=states[2];assert.equal(venue({home:2}).dome,true,'legacy completed dome with no boolean still has roof');
states[2]={built:2030,cap:25600,names:[{n:'old'}],lv:{}};ctx.G.teams[2].stad=states[2];ctx.STAD_BUILT=[1982,1982,1989];assert.equal(venue({home:2,cap:23800}).kind,'big','premium-seat attendance capacity cannot downgrade completed design');
states[2]={nk:'dome',dome:false,built:2030,ncap:25000,lv:{}};ctx.G.teams[2].stad=states[2];assert.equal(venue({home:2}).dome,false,'explicit open flag remains authoritative');
ctx.stadOf=()=>undefined;assert.doesNotThrow(()=>venue({home:2}),'legacy missing optional venue fields');
assert.match(src,/venue:cVenue\(g\)/,'3D must receive the same home venue');assert.match(src,/data-venue-kind/,'fallback must expose the same venue kind');
console.log('Stadium match venue: home team, completed roof/size, legacy fallback and read-only display passed');
/* Exercise real Three geometry/material ownership without a GPU or game engine. */
const esbuild=require('esbuild');
const bundle=esbuild.buildSync({entryPoints:[path.join(root,'src/scene3d/stadium.mjs')],bundle:true,write:false,format:'cjs',platform:'node',nodePaths:[path.join(__dirname,'node_modules')]}).outputFiles[0].text;
const fakeCanvas=()=>({width:0,height:0,getContext:()=>({fillRect(){},fillText(){}})}),sandbox={module:{exports:{}},exports:{},require,document:{createElement:fakeCanvas},console,AbortController};sandbox.exports=sandbox.module.exports;vm.runInNewContext(bundle,sandbox);const mod=sandbox.module.exports;
const scene={add(o){o.parent=this;},remove(o){o.parent=null;}};
for(const kind of ['classic','mid','big','dome','mega']){const v=mod.createVenue(scene,{kind,dome:kind==='dome',cap:kind==='mid'?18000:30000,color:'#a12639',modern:kind!=='classic'});assert.equal(v.plan.kind,kind);const board=v.root.getObjectByName('Venue_AdBoards');assert.equal(board.geometry.attributes.position.count,24,'six real advertising quads');board.geometry.computeBoundingBox();assert.ok(board.geometry.boundingBox.max.z < -12,'backstop ads stay physically behind home plate, not in the outfield');assert.ok(board.geometry.boundingBox.min.z > -22,'backstop follows the existing home grandstand wall');assert.ok(board.geometry.boundingBox.min.y >= .15 && board.geometry.boundingBox.max.y <= 2.2,'low horizontal boards stay on the backstop padding');assert.ok(board.geometry.attributes.normal.getZ(0) > .8,'advert front faces the field, not the stands');assert.equal(!!v.root.getObjectByName('Venue_DomeCutaway'),kind==='dome');if(kind==='dome'){const roof=v.root.getObjectByName('Venue_DomeCutaway');roof.geometry.computeBoundingBox();assert.ok(roof.geometry.boundingBox.min.z>=33.9,'roof cutaway stays behind the foreground camera/diamond');}const disposed=[];v.root.traverse(o=>{o.geometry?.addEventListener('dispose',()=>disposed.push(o.name));});v.dispose();const n=disposed.length;assert.ok(n>0);v.dispose();assert.equal(disposed.length,n,'venue cleanup is idempotent');assert.equal(v.root.parent,null);}
assert.match(src,/data-ad-location=\"backstop\"/,'2D fallback uses the same physical ad placement');
console.log('Stadium geometry: five venue types, six low backstop panels, front-facing text, cutaway roof and idempotent GPU cleanup passed');
