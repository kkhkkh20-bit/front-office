const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const art=read('src/ui/assets/77_assets_ui.js'),start=art.indexOf('const SCENE_N='),end=art.indexOf('/* 운영·육성 실사 장면',start);
assert.ok(start>=0&&end>start);
const context=vm.createContext({A:{},UI:{},G:{user:6,year:2026,day:0,spend:{}},esc:String,
  FAN_OPS:{cheer:{l:'응원단',d:'',lv:['기본'],m:[0]},yt:{l:'채널',d:'',lv:['없음'],m:[0]}},
  FAN_EV:Object.fromEntries(['pitch','theme','meet','collab','retro','sup'].map(k=>[k,{l:k,d:'',c:30,cd:20}])),
  fanOps:()=>({log:[]}),team:()=>({}),fanEvLeft:()=>'',fanPlanY:()=>2026,fanGameDays:()=>[],period:()=> 'pre',
  money:String,sponSeason:()=>2026,crewOf:()=>({}),CREW_JOB:{},csec:(_,body)=>body});
vm.runInContext(art.slice(start,end)+'\nSCENE_OK=true;',context);
vm.runInContext(read('src/ui/finance/44_fan_ops.js'),context);
const before=JSON.stringify(context.G),html=vm.runInContext('fanOpsCard()',context),images=[...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map(m=>m[1]);
assert.equal(images.length,6,'All six existing game events have a matching thumbnail');
for(const id of ['event_theme_day','event_collab_uniform','event_supporters']){
  const src=vm.runInContext(`scenePath(${JSON.stringify(id)})`,context);
  assert.ok(images.includes(src),id+' is used by its event');
  assert.ok(fs.existsSync(path.join(root,src)),src+' exists');
}
assert.equal(JSON.stringify(context.G),before,'Artwork rendering does not change game state');
const manifest=JSON.parse(read('assets/v24/game_events/manifest.json'));
assert.equal(manifest.assets.length,3);
const build=read('tools/build-site.cjs');
assert.match(build,/eventPhotos\(root\)/,'Site builder includes the new standalone images');
for(const item of manifest.assets){
  const file=path.join(root,manifest.path_base,item.file),bytes=fs.readFileSync(file);
  assert.equal(bytes.subarray(0,4).toString(),'RIFF');assert.equal(bytes.subarray(8,12).toString(),'WEBP');
  assert.equal(bytes.length,item.bytes);assert.ok(item.bytes<200000,'Thumbnail is lightweight');
}
console.log('Event art: six matching images, three delivered WebPs, state unchanged, site packaging covered');
