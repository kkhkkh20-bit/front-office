/* 3D broadcast adapter. Rendering only: game simulation and pitch records stay authoritative.
 * Models / field look: Copyright (c) 2026 Taylor Beeston, MIT; see assets/match3d/LICENSE.txt. */
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {KTX2Loader} from 'three/addons/loaders/KTX2Loader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';
import {tuneParkMaterial} from '../../assets/match3d/field-look.ts';
const pack=FO3D_PACK;
let active=null,loaded=null;
const v=(x,y,z)=>new T.Vector3(x,y,z),clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function decode(s){const b=atob(s),a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a;}
function fallback(host,text){host.dataset.state='fallback';host.parentElement?.classList.remove('has-3d');const el=host.querySelector('.cs-3d-status');if(el)el.textContent=text;}
function status(text){if(active?.host){const el=active.host.querySelector('.cs-3d-status');if(el)el.textContent=text;}}
async function modelBuffer(source){if(typeof source==='string')return decode(source).buffer;const response=await fetch(new URL(source.url,document.baseURI));if(!response.ok)throw new Error('경기장 파일 응답 '+response.status);return response.arrayBuffer();}
async function load(renderer){
 if(loaded)return loaded;
 loaded=(async()=>{const urls=[];const blob=(b,type)=>{const u=URL.createObjectURL(new Blob([b],{type}));urls.push(u);return u;};
 const manager=new T.LoadingManager(),js=blob(pack.basisJS,'text/javascript'),wasm=blob(decode(pack.basisWasm),'application/wasm');manager.setURLModifier(u=>u.endsWith('basis_transcoder.js')?js:u.endsWith('basis_transcoder.wasm')?wasm:u);
 const ktx=new KTX2Loader(manager).setTranscoderPath('fo3d-basis/').setWorkerLimit(2).detectSupport(renderer),loader=new GLTFLoader(manager).setMeshoptDecoder(MeshoptDecoder).setKTX2Loader(ktx);
 try{const result={};for(const key of ['field','stadium','player','bat','ball'])result[key]=await loader.parseAsync(await modelBuffer(pack[key]),'');return result;}finally{ktx.dispose();urls.forEach(u=>URL.revokeObjectURL(u));}
 })().catch(e=>{loaded=null;throw e;});return loaded;
}
// Shared virtual board coordinates map to the same measured 3D diamond (metres).
const controls=[[[50,89],[0,0]],[[68,73],[-19.3975,19.3975]],[[50,56],[0,38.795]],[[32,73],[19.3975,19.3975]],[[50,72],[0,18.44]],[[50,97],[0,-1.45]],[[40,89],[.95,0]],[[60,89],[-.95,0]],[[74,66],[-25,25]],[[62,50],[-12,38]],[[38,50],[12,38]],[[26,66],[25,25]],[[18,31],[48,75]],[[50,17],[0,98]],[[82,31],[-48,75]]];
function point(pt,y=0){const exact=controls.find(([a])=>Math.hypot(a[0]-pt[0],a[1]-pt[1])<.02);if(exact)return v(exact[1][0],y,exact[1][1]);const z=(89-pt[1])*(pt[1]>56?38.795/33:98/72);return v(-(pt[0]-50)*(pt[1]>56?19.3975/18:1.5),y,z);}
function sky(day){const c=document.createElement('canvas');c.width=512;c.height=512;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,512);g.addColorStop(0,day?'#397aaa':'#050b19');g.addColorStop(.65,day?'#9cbfd3':'#172b49');g.addColorStop(1,day?'#dae0cd':'#40566b');x.fillStyle=g;x.fillRect(0,0,512,512);if(!day){x.fillStyle='#cdd9e9';for(let i=0;i<100;i++){x.globalAlpha=.12+((i*37)%60)/100;x.fillRect((i*193)%512,(i*73)%285,1,1);}}const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;}
function idle(a){return a.role==='batter'?'batting_stance':a.role==='catcher'?'catch_pitch':a.role==='runner'?'idle':a.pitcher?'pitcher_set':'field_ready';}
function pose(a,name,freeze=false){let clip=T.AnimationClip.findByName(active.assets.player.animations,name);if(!clip)clip=T.AnimationClip.findByName(active.assets.player.animations,a.pitcher?'pitch_overhand_stretch':'idle');if(!clip)return null;a.mixer.stopAllAction();const action=a.mixer.clipAction(clip);action.reset().setLoop(freeze?T.LoopRepeat:T.LoopOnce,freeze?Infinity:1);action.clampWhenFinished=true;action.play();a.action=action;a.motion=name;a.release=null;if(freeze){a.mixer.update(.05);action.paused=true;}return action;}
function roleOf(t){return /ctch/.test(t.cls)?'catcher':/bat/.test(t.cls)?'batter':/of run/.test(t.cls)?'runner':'field';}
function makeActor(t){const s=active,role=roleOf(t),o=cloneSkeleton(s.assets.player.scene),allowed=new Set(pack.gear[role==='runner'?'batter':role]),materials=new Map();
 o.traverse(n=>{if(n.userData.cb_group)n.visible=allowed.has(n.name);if(n.isMesh){n.castShadow=true;n.receiveShadow=true;const paint=m=>{if(materials.has(m))return materials.get(m);const q=m.clone();if(q.name==='uniform_jersey')q.color.set(t.u?.S||'#eeeeee');if(['uniform_socks','cap','helmet','uniform_undershirt','piping','batting_glove'].includes(q.name))q.color.set(t.u?.H||t.col||'#273650');if(/jersey_decal|cap_logo|helmet_logo/.test(q.name))n.visible=false;materials.set(m,q);return q;};n.material=Array.isArray(n.material)?n.material.map(paint):paint(n.material);}});
 const group=new T.Group();group.add(o);s.scene.add(group);const a={key:t.k,id:t.id,role,pitcher:/pit/.test(t.cls),root:group,model:o,mixer:new T.AnimationMixer(o),materials:[...materials.values()],uniform:JSON.stringify(t.u),motion:'',move:null};
 if(role==='batter'){const grip=o.getObjectByName('Bat_Grip');if(grip){a.bat=s.assets.bat.scene.clone();grip.add(a.bat);}}
 if(a.pitcher){a.releaseGrip=o.getObjectByName('Ball_Grip');if(a.releaseGrip){a.heldBall=s.assets.ball.scene.clone();a.releaseGrip.add(a.heldBall);}}
 o.traverse(n=>{if(n.isBone&&/Head$/.test(n.name))a.head=n;});
 actorSide(a,t);pose(a,idle(a),true);return a;
}
// The source stance looks over the model's LEFT shoulder. Turn the chest toward
// home plate: RHB at +X faces -X; mirrored LHB at -X faces +X. Both look toward +Z.
function actorSide(a,t){a.left=a.role==='batter'?/lhb/.test(t.cls):/lhp/.test(t.cls)||t.u?.glove==='R';a.model.scale.x=a.left?-1:1;}
function actorFacing(a){if(a.role==='batter')return a.left?Math.PI/2:-Math.PI/2;if(a.pitcher)return Math.PI;if(a.role==='catcher')return 0;return Math.atan2(-a.root.position.x,-a.root.position.z);}
function clearActor(a){a.mixer.stopAllAction();a.root.removeFromParent();a.materials.forEach(m=>m.dispose());}
function scoreboard(data){const s=active;if(!s?.board)return;const c=s.boardCanvas,x=c.getContext('2d');x.fillStyle='#07161d';x.fillRect(0,0,c.width,c.height);x.fillStyle='#dfbc72';x.font='bold 32px sans-serif';x.fillText('FRONT OFFICE BASEBALL',28,47);x.fillStyle='#fff';x.font='bold 44px sans-serif';x.fillText(`${data.away}   ${data.sa} : ${data.sh}   ${data.home}`,28,112);x.fillStyle='#8cbfcf';x.font='25px sans-serif';x.fillText(`${data.inning}  ·  ${data.outs} OUT`,28,161);s.board.needsUpdate=true;}
function cancelMotion(){const s=active;if(!s)return;s.ballMotion=null;s.ball.visible=false;s.cameraMode='pitch';s.follow=null;for(const a of s.actors.values()){a.move=null;a.root.visible=true;if(a.bat)a.bat.visible=true;if(a.heldBall)a.heldBall.visible=true;pose(a,idle(a),true);}}
function resize(){const s=active;if(!s)return;const r=s.host.getBoundingClientRect();if(!r.width||!r.height)return;s.renderer.setSize(r.width,r.height,false);s.camera.aspect=r.width/r.height;s.camera.fov=r.width/r.height<1?65:46;s.camera.updateProjectionMatrix();s.dirty=true;}
async function mount(host,options={}){
 if(active?.host===host&&active.ready)return true;
 dispose();let renderer;try{renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance',alpha:false});}catch(e){fallback(host,'브라우저에서 3D 그래픽을 시작하지 못해 기본 중계로 표시 중입니다.');return false;}
 const gl=renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info'),software=debug&&/swiftshader|llvmpipe|software/i.test(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL));renderer.setPixelRatio(Math.min(devicePixelRatio||1,software?1:1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=options.day?1:.95;renderer.shadowMap.enabled=innerWidth>700&&!software;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(46,1,.3,700),s={host,renderer,scene,camera,actors:new Map(),ready:false,frame:0,last:performance.now(),day:!!options.day,ballMotion:null,cameraMode:'pitch',follow:null,fieldShots:0,dirty:true,cameraFrames:0,desired:null,customMaterials:[],ownedTextures:[]};active=s;host.appendChild(renderer.domElement);host.dataset.state='loading';resize();s.resizeObserver=new ResizeObserver(resize);s.resizeObserver.observe(host);
 const pmrem=new T.PMREMGenerator(renderer),env=pmrem.fromScene(new RoomEnvironment(),.04);scene.environment=env.texture;pmrem.dispose();s.env=env;scene.environmentIntensity=s.day?.65:.35;scene.background=sky(s.day);s.ownedTextures.push(scene.background);scene.fog=new T.Fog(s.day?0xa6becd:0x1c3048,170,430);
 scene.add(new T.HemisphereLight(s.day?0xd9ebff:0xc6d8ff,0x4b4a35,s.day?1.1:.65));const light=new T.DirectionalLight(s.day?0xfff3d9:0xf4f5ff,s.day?2:2.6);light.position.set(-35,70,-40);light.castShadow=true;Object.assign(light.shadow.camera,{left:-42,right:42,top:52,bottom:-35,near:1,far:200});light.shadow.mapSize.set(2048,2048);light.shadow.bias=-.00025;light.shadow.normalBias=.035;scene.add(light);s.light=light;
 if(!s.day){for(const [x,z]of [[-70,45],[70,45],[0,120]]){const l=new T.DirectionalLight(0xc5d8ff,1.25);l.position.set(x,60,z);l.target.position.set(0,0,30);scene.add(l,l.target);}}
 try{s.assets=await load(renderer);if(active!==s)return false;
 for(const name of ['field','stadium']){const o=s.assets[name].scene.clone();const tuned=new Map();o.traverse(n=>{if(!n.isMesh)return;n.receiveShadow=true;n.castShadow=/Dugout|Mound/.test(n.name);const apply=m=>{if(tuned.has(m))return tuned.get(m);const q=m.clone();const patch=tuneParkMaterial(q);if(patch)q.onBeforeCompile=patch;s.customMaterials.push(q);tuned.set(m,q);return q;};n.material=Array.isArray(n.material)?n.material.map(apply):apply(n.material);
 // Keep the infield layers separated even at the broadcast camera's far plane.
 if(name==='field'&&['Dirt','Dirt_Cutouts','WarningTrack'].includes(n.name))n.position.y+=.018;if(n.name==='Grass_Infield')n.position.y+=.04;if(n.name==='Chalk')n.position.y+=.06;
 if(n.name==='BackstopNetting')n.visible=false;
 if(/^LightTower_/.test(n.name)){n.position.y*=.55;n.scale.y*=.55;}
 if(n.name==='Scoreboard_Screen'){const c=document.createElement('canvas');c.width=1024;c.height=192;const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;s.board=tx;s.boardCanvas=c;s.ownedTextures.push(tx);const m=new T.MeshBasicMaterial({map:tx});s.customMaterials.push(m);n.material=m;}
 });scene.add(o);}
 s.ball=new T.Group();const real=s.assets.ball.scene.clone();s.ball.add(real);s.ball.scale.setScalar(1.8);s.ball.visible=false;scene.add(s.ball);
 const floor=new T.Mesh(new T.PlaneGeometry(1500,1500),new T.MeshStandardMaterial({color:0x344c3b,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.2;scene.add(floor);s.floor=floor;
 s.cardObserver=new MutationObserver(rows=>{for(const row of rows){const el=row.target;if(el.classList?.contains('gone')&&el.dataset.k)hide(el.dataset.k);}});s.cardObserver.observe(host.parentElement,{subtree:true,attributes:true,attributeFilter:['class']});
 s.ready=true;host.dataset.state='ready';host.parentElement.classList.add('has-3d');status('');if(s.desired)sync(s.desired);setCamera(true);tick(performance.now());return true;
 }catch(e){if(active===s){console.error('3D 경기장 로드 실패',e);fallback(host,'3D 경기장 파일을 불러오지 못해 기본 중계로 표시 중입니다.');}return false;}
}
function setCamera(snap=false,dt=1/60){const s=active;if(!s)return;let pos,look;if(s.cameraMode==='field'&&s.follow){const target=s.follow;pos=v(clamp(target.x*.2,-12,12),8.5,-10);look=target.clone();look.y=Math.max(1.5,look.y);}else{pos=v(0,3.4,-8.8);look=v(0,1.1,24);}
 if(snap){s.camera.position.copy(pos);s.look=look;}else{s.camera.position.lerp(pos,1-Math.exp(-5*dt));s.look.lerp(look,1-Math.exp(-7*dt));}s.camera.lookAt(s.look);
}
function sync(data){const s=active;if(!s)return;s.dirty=true;s.desired=data;if(!s.ready)return;cancelMotion();const keep=new Set();for(const t of data.targets){keep.add(t.k);let a=s.actors.get(t.k);if(a&&(a.role!==roleOf(t)||a.uniform!==JSON.stringify(t.u))){clearActor(a);s.actors.delete(t.k);a=null;}if(!a){a=makeActor(t);s.actors.set(t.k,a);}actorSide(a,t);a.root.position.copy(point(t.pt));if(a.pitcher)a.root.position.y=.26;a.root.rotation.y=actorFacing(a);}
 for(const [key,a]of s.actors)if(!keep.has(key)){clearActor(a);s.actors.delete(key);}scoreboard(data);setCamera(true);
}
function move(key,pt,ms){const s=active,a=s?.actors.get(key);if(!a)return;a.root.visible=true;const to=point(pt);if(!ms){a.root.position.copy(to);return;}a.move={from:a.root.position.clone(),to,start:performance.now(),duration:ms};a.root.rotation.y=Math.atan2(to.x-a.root.position.x,to.z-a.root.position.z);if(a.bat)a.bat.visible=false;pose(a,'run',false);a.action?.setLoop(T.LoopRepeat,Infinity);}
function hide(key){const a=active?.actors.get(key);if(a){a.root.visible=false;a.move=null;a.mixer.stopAllAction();if(a.action)a.action.paused=true;active.dirty=true;}}
function windup(ms,style='overhand'){const s=active;if(!s?.ready)return;const a=[...s.actors.values()].find(a=>a.pitcher);if(!a)return;const name=`pitch_${style}_stretch`,action=pose(a,name,false);if(action){a.release=pack.events[name]?.release||.375;action.setEffectiveTimeScale(a.release/(ms/1000));}if(a.heldBall)a.heldBall.visible=true;s.dirty=true;}
function swing(ms=420){const a=[...(active?.actors.values()||[])].find(a=>a.role==='batter');if(!a)return;const action=pose(a,'swing',false);if(action)action.setEffectiveTimeScale((pack.events.swing?.contact||.9167)/(ms/1000));if(active)active.dirty=true;}
function flight(from,to,ms,arc=false,ground=false,pitch=null){const s=active;if(!s?.ready)return false;const isPitch=from[0]===50&&from[1]===72&&to[1]>85;let a=point(from,isPitch?1.7:1),b=point(to,ground?.08:arc?1.4:1);if(isPitch){const pitcher=[...s.actors.values()].find(a=>a.pitcher);if(pitcher?.releaseGrip){
  // Anchor release to the recorded clip event, including the mirrored throwing arm.
  if(pitcher.release!=null&&pitcher.action){pitcher.action.time=pitcher.release;pitcher.mixer.update(0);pitcher.action.setEffectiveTimeScale((pitcher.action.getClip().duration-pitcher.release)/(ms/1000+.35));}
  pitcher.root.updateMatrixWorld(true);a=pitcher.releaseGrip.getWorldPosition(new T.Vector3());if(pitcher.heldBall)pitcher.heldBall.visible=false;
 }else a=v(0,1.85,17.8);b=v(pitch?(.5-pitch.x)*.8:b.x,pitch?1.65-pitch.y*1.05:1,-.3);}
 s.dirty=true;s.cameraFrames=isPitch?0:14;s.ballMotion={from:a,to:b,start:performance.now(),duration:ms,arc,ground,pitch:isPitch};s.ball.position.copy(a);s.ball.visible=true;s.ball.scale.setScalar(isPitch?2.4:2);if(!isPitch&&from[1]>85){s.cameraMode='field';s.fieldShots++;s.follow=a.clone();}
 return true;
}
function hideBall(){if(active?.ready){active.ball.visible=false;active.ballMotion=null;active.dirty=true;}}
function tick(now){const s=active;if(!s?.ready)return;if(!s.host.isConnected){dispose();return;}const dt=Math.max(0,(now-s.last)/1000);s.last=now;
 if(s.host.getBoundingClientRect().width){const moving=!!s.ballMotion||[...s.actors.values()].some(a=>a.move||(a.action&&!a.action.paused));for(const a of s.actors.values()){if(a.move){const m=a.move,f=clamp((now-m.start)/m.duration,0,1);a.root.position.lerpVectors(m.from,m.to,f);if(f>=1){a.move=null;pose(a,a.role==='batter'?'idle':idle(a),true);a.root.rotation.y=actorFacing(a);}}a.mixer.update(dt);}
 const m=s.ballMotion;if(m){const f=clamp((now-m.start)/m.duration,0,1);s.ball.position.lerpVectors(m.from,m.to,f);if(m.arc)s.ball.position.y+=Math.sin(Math.PI*f)*Math.min(32,m.from.distanceTo(m.to)*.28);if(m.ground)s.ball.position.y=.1+Math.abs(Math.sin(f*Math.PI*5))*(1-f)*.45;if(m.pitch)s.ball.position.x+=Math.sin(Math.PI*f)*.13;s.ball.rotation.x+=dt*30;if(!m.pitch&&s.follow)s.follow.copy(s.ball.position);}
 if(s.dirty||moving||s.cameraFrames>0){setCamera(false,dt);s.renderer.render(s.scene,s.camera);s.dirty=false;if(s.cameraFrames>0)s.cameraFrames--;}}
 s.frame=requestAnimationFrame(tick);
}
function dispose(){const s=active;if(!s)return;active=null;cancelAnimationFrame(s.frame);s.resizeObserver?.disconnect();s.cardObserver?.disconnect();for(const a of s.actors.values())clearActor(a);s.customMaterials.forEach(m=>m.dispose());s.ownedTextures.forEach(t=>t.dispose());s.floor?.geometry.dispose();s.floor?.material.dispose();s.env.dispose();s.light.shadow.map?.dispose();s.renderer.dispose();s.renderer.forceContextLoss();s.renderer.domElement.remove();}
function ready(){return !!active?.ready;}
function info(details=false){const s=active;if(!s)return null;const r={ready:s.ready,actors:s.actors.size,camera:s.cameraMode,fieldShots:s.fieldShots,position:s.camera.position.toArray(),calls:s.renderer.info.render.calls,triangles:s.renderer.info.render.triangles};
 if(details&&s.ready){s.scene.updateMatrixWorld(true);r.players=[...s.actors.values()].map(a=>({key:a.key,id:a.id,role:a.role,pitcher:a.pitcher,left:a.left,visible:a.root.visible,moving:!!a.move,playing:!!a.action&&!a.action.paused&&a.action.isRunning(),yaw:a.root.rotation.y,position:a.root.position.toArray(),headForward:a.head?v(0,0,1).transformDirection(a.head.matrixWorld).toArray():null,headPosition:a.head?.getWorldPosition(new T.Vector3()).toArray(),batVisible:a.bat?.visible,heldBallVisible:a.heldBall?.visible,grip:a.releaseGrip?.getWorldPosition(new T.Vector3()).toArray()}));r.ball=s.ball.position.toArray();r.flight=s.ballMotion?{from:s.ballMotion.from.toArray(),to:s.ballMotion.to.toArray(),pitch:s.ballMotion.pitch}:null;r.look=s.look.toArray();}
 return r;}

export {mount,sync,move,hide,windup,swing,flight,hideBall,cancelMotion,dispose,ready,info};
