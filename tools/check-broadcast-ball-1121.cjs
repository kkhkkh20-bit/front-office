// GPU-free projection and adapter regression; the authoritative flight path stays unchanged.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),T=require('three'),esbuild=require('esbuild');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'src/scene3d/scene.mjs'),'utf8');
const moduleBox={exports:{}},sandbox={module:moduleBox,exports:moduleBox.exports,require,AbortController};
vm.runInNewContext(esbuild.buildSync({entryPoints:[path.join(root,'src/scene3d/visibility.mjs')],bundle:true,write:false,format:'cjs',platform:'node',nodePaths:[path.join(__dirname,'node_modules')]}).outputFiles[0].text,sandbox);
const scale=moduleBox.exports.pitchBallScale,pixels=(k,d,f,h)=>.074*k*h/(2*d*Math.tan(f*Math.PI/360));
let failures=0;const check=(name,fn)=>{try{fn();console.log('PASS '+name);}catch(e){failures++;console.error('FAIL '+name+': '+e.message);}};
check('Portrait pitches have a readable minimum without enlarging already-readable desktop pitches',()=>{
 assert.equal(typeof scale,'function','a pure pitch projection helper is required');
 const legacy=pixels(1.45,26,65,560),next=scale(26,65,560);assert.ok(legacy<2,'legacy pitch is under two CSS pixels');
 assert.ok(Math.abs(next-2.1983843459331935)<1e-12);assert.ok(Math.abs(pixels(next,26,65,560)-2.75)<1e-12);
 assert.equal(scale(28,46,620),1.45,'already-readable desktop pitch keeps its old size');assert.equal(scale(12,65,560),1.45,'near-camera pitch keeps its old size');
});
check('Visual scale stays bounded and hidden or legacy viewports retain the old size',()=>{
 assert.equal(typeof scale,'function');assert.equal(scale(30,65,400),2.4,'very small portrait stage respects the world-scale cap');
 for(const args of [[0,65,560],[-1,65,560],[Infinity,65,560],[26,0,560],[26,180,560],[26,NaN,560],[26,65,0],[26,65,undefined],[26,65,Infinity]])assert.equal(scale(...args),1.45,JSON.stringify(args));
 for(const d of [1,8,18,28,100])for(const f of [20,46,65,110])for(const h of [220,390,560,900]){const k=scale(d,f,h);assert.ok(k>=1.45&&k<=2.4);const target=2.75*2*d*Math.tan(f*Math.PI/360)/(.074*h);if(target>=1.45&&target<=2.4)assert.ok(Math.abs(pixels(k,d,f,h)-2.75)<1e-10);}
});
function adapter(){let height=560,renderCalls=0;const ball=new T.Group(),camera=new T.PerspectiveCamera(65,390/560,.3,700);camera.position.set(0,4.4,-9.8);
 const grip=new T.Vector3(.23,1.86,17.45),pitcher={pitcher:true,root:{updateMatrixWorld(){}},releaseGrip:{getWorldPosition:out=>out.copy(grip)},heldBall:{visible:true}};
 const state={ready:true,host:{isConnected:true,getBoundingClientRect:()=>({width:390,height})},camera,ball,actors:new Map([['P',pitcher]]),props:[],last:1000,cameraMode:'pitch',cameraFrames:0,scene:{},renderer:{render(){renderCalls++;}},renderFrames:0,labelAt:1000};
 const noop=()=>{},ctx=vm.createContext({active:state,T,pitchBallScale:scale,v:(x,y,z)=>new T.Vector3(x,y,z),clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),point:(p,y)=>new T.Vector3(p[0]-50,y,p[1]-88),performance:{now:()=>1000},advanceActor:noop,poseWorld:noop,umpireAvoid:noop,setCamera:noop,cullStands:noop,tickBench:()=>false,layoutLabels:noop,requestAnimationFrame:()=>1,R:()=>{throw Error('Visual sizing must not consume game RNG');}});
 const cut=(a,b)=>{const start=source.indexOf(a),end=source.indexOf(b,start);assert.ok(start>=0&&end>start);return source.slice(start,end);};
 vm.runInContext(cut('function flight(','function hideBall(')+cut('const PITCH_BRK=','// 낙하 뒤 굴러가기:')+cut('function tick(now)','\nfunction dispose('),ctx);
 return {state,ctx,grip,pitcher,height:v=>height=v,calls:()=>renderCalls,run:code=>vm.runInContext(code,ctx)};
}
check('Release and every pitch frame resize only the ball visual, not motion, contact, camera or draw count',()=>{
 const a=adapter(),s=a.state;assert.equal(a.run("flight([50,72],[50,88],900,false,false,{x:.2,y:1.8,t:'커브',th:'좌',res:'타격'})"),true);
 assert.ok(s.ball.scale.x>1.45&&s.ball.scale.x<=2.4,'release frame already has readable pitch sizing');assert.equal(a.pitcher.heldBall.visible,false);assert.deepEqual(s.ballMotion.from.toArray(),a.grip.toArray());
 const motion=s.ballMotion,from=motion.from.toArray(),to=motion.to.toArray(),contact=s.contactPoint.toArray(),camera=s.camera.position.toArray(),fov=s.camera.fov;
 for(const now of [1000,1100,1450,1800,1900]){const expected=new T.Vector3();a.ctx.testPoint=expected;a.ctx.testFraction=(now-1000)/900;a.run('ballAt(active.ballMotion,testFraction,testPoint)');a.run('tick('+now+')');assert.ok(expected.distanceTo(s.ball.position)<1e-12,'pitch path changes at '+now);assert.deepEqual(motion.from.toArray(),from);assert.deepEqual(motion.to.toArray(),to);assert.deepEqual(s.contactPoint.toArray(),contact);assert.equal(motion.start,1000);assert.equal(motion.duration,900);assert.equal(motion.pitch,true);assert.equal(s.cameraMode,'pitch');assert.deepEqual(s.camera.position.toArray(),camera);assert.equal(s.camera.fov,fov);}
 assert.equal(a.calls(),5,'one existing render per tick, no extra render pass');assert.equal(s.ball.position.y,to[1],'low pitch is not lifted off its original path');
 a.height(400);a.run('tick(1000)');assert.equal(s.ball.scale.x,2.4,'CSS stage resizing changes visual size');a.height(2000);a.run('tick(1000)');assert.equal(s.ball.scale.x,1.45);a.height(0);a.run('tick(1000)');assert.equal(s.ball.scale.x,1.45);
});
check('Existing batted-ball scaling and ground lift remain unchanged',()=>{
 const a=adapter(),s=a.state;s.ballMotion={from:new T.Vector3(0,.01,0),to:new T.Vector3(4,.01,0),start:1000,duration:1000,pitch:false};s.follow=null;a.run('tick(1500)');
 const k=Math.max(2,Math.min(9,s.camera.position.distanceTo(new T.Vector3(2,.01,0))*Math.tan(s.camera.fov*Math.PI/360)*.26));assert.equal(s.ball.scale.x,k);assert.ok(Math.abs(s.ball.position.y-Math.max(.01,.037*k))<1e-12);
});
if(failures)process.exitCode=1;
