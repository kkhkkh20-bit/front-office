/* 더그아웃 인원(사용자 11-13·11-14). 선수 모델을 자세별로 굳힌 정적 메시를 인스턴싱한다(뼈대 계산 없음).
 * 벤치에 앉은 선수(가슴 번호·피부 밝기 반영)와 난간 쪽에 선 감독·코치.
 * 장면 좌표: 홈 더그아웃 = 1루 쪽(x<0), 원정 = 3루 쪽(x>0). 벤치는 파울선과 나란한 대각선. */
import * as T from 'three';
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';
const BODY=['Gear_Cap','Jersey','Undershirt','Pants','Socks','Cleats','Gear_Belt'],SKIN=['Head','Hand_L_Relaxed','Hand_R_Relaxed'],DECAL=['Jersey_FrontNumberDecal'];
const TINT={uniform_jersey:'S',cap:'H',uniform_socks:'H',uniform_undershirt:'H',piping:'H'};
const FIXED={skin:'#c69472',cleats:'#1b1d22',belt:'#1b1d22'};
const SEATS=9,STAFF=4,GAP=1.28,BENCH=[23.74,6.45],FLOOR_Y=-.6,BACK=.3,FRONT=1.05; /* BACK: 벤치 쪽으로 물려 앉힌다. FRONT: 코치진은 난간 쪽에 선다 */
const STAFF_T=[-6.6,6.6,-7.7,7.7],ORDER=[4,2,6,1,7,3,5,0,8];
const rnd=(i,salt)=>{const x=Math.sin(i*127.1+salt*311.7)*43758.5453;return x-Math.floor(x);};
/* 굳힌 자세에서 이름이 names에 든 메시만 모아 하나의 지오메트리로 만든다. slot: 0 상의, 1 모자·양말·언더셔츠, 2 고정색 */
function collect(o,names,uvs){const pos=[],col=[],uv=[],slot=[],index=[],p=new T.Vector3(),c=new T.Color();
 o.traverse(n=>{if(!n.isSkinnedMesh||!names.includes(n.name))return;n.skeleton.update();const g=n.geometry,base=pos.length/3,m=Array.isArray(n.material)?n.material[0]:n.material,key=TINT[m.name],s=key==='S'?0:key==='H'?1:2;c.set(FIXED[m.name]||(s===2?'#'+m.color.getHexString():'#ffffff'));
  for(let i=0;i<g.attributes.position.count;i++){n.getVertexPosition(i,p).applyMatrix4(n.matrixWorld);pos.push(p.x,p.y,p.z);col.push(c.r,c.g,c.b);slot.push(s);if(uvs)uv.push(g.attributes.uv.getX(i),g.attributes.uv.getY(i));}
  const ix=g.index;if(ix)for(let i=0;i<ix.count;i++)index.push(base+ix.getX(i));else for(let i=0;i<g.attributes.position.count;i++)index.push(base+i);});
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));if(uvs)g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));else g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.userData.slot=Uint8Array.from(slot);g.setIndex(index);g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();return g;}
function bake(player,clip,time){const o=cloneSkeleton(player.scene),mixer=new T.AnimationMixer(o);if(clip){mixer.clipAction(clip).play();mixer.setTime(time);}o.updateMatrixWorld(true);
 const out={body:collect(o,BODY),skin:collect(o,SKIN),decal:collect(o,DECAL,true)};mixer.stopAllAction();mixer.uncacheRoot(o);out.floor=Math.min(out.body.boundingBox.min.y,out.skin.boundingBox.min.y);return out;}
function paint(g,u){const a=g.attributes.color,slot=g.userData.slot,base=g.userData.base||(g.userData.base=a.array.slice()),S=new T.Color(u?.S||'#eeeeee'),H=new T.Color(u?.H||'#273650');
 for(let i=0;i<slot.length;i++){const c=slot[i]===0?S:slot[i]===1?H:null;if(c)a.setXYZ(i,c.r,c.g,c.b);else a.setXYZ(i,base[i*3],base[i*3+1],base[i*3+2]);}a.needsUpdate=true;}
export function createBench(scene,player){const find=n=>player.animations.find(c=>c.name===n),sit=find('bench_sit'),up=find('bench_cheer'),stand=find('idle'); /* coach_ready는 무릎에 손을 짚은 자세라 더그아웃 안에서는 앉은 사람보다 낮아 보인다 */if(!sit)return null;
 /* 자세: 0·1 앉음, 2 환호, 3·4 서 있는 코치진 */
 const poses=[bake(player,sit,sit.duration*.1),bake(player,sit,sit.duration*.55),up?bake(player,up,up.duration*.5):null,stand?bake(player,stand,stand.duration*.2):null,stand?bake(player,stand,stand.duration*.7):null];
 const state={sides:{},uniform:{},count:{},people:{},staff:{},poses,floorY:FLOOR_Y,opts:{}},dummy=new T.Object3D(),tone=new T.Color();
 for(const side of ['h','a']){const sign=side==='h'?-1:1,along=new T.Vector3(sign,0,1).normalize(),yaw=Math.atan2(-sign,1); /* 내야(대각선 안쪽)를 본다 */
  const sets=poses.map((pose,v)=>{if(!pose)return null;const cap=v>=3?STAFF:SEATS,body=new T.InstancedMesh(pose.body.clone(),new T.MeshLambertMaterial({vertexColors:true}),cap),skin=new T.InstancedMesh(pose.skin,new T.MeshLambertMaterial({vertexColors:true}),cap);body.geometry.userData.slot=pose.body.userData.slot;
   for(const m of [body,skin]){m.name='Bench_'+side+v;m.castShadow=false;m.receiveShadow=false;m.count=0;scene.add(m);}return {body,skin,pose};});
  const seats=[];for(let i=0;i<SEATS;i++){const t=(i-(SEATS-1)/2)*GAP+(rnd(i,sign)-.5)*.3;seats.push({x:sign*BENCH[0]+along.x*t+sign*BACK,z:BENCH[1]+along.z*t-BACK,yaw:yaw+(rnd(i,7)-.5)*.35,variant:rnd(i,3)>.5?1:0});}
  const stands=STAFF_T.map((t,i)=>({x:sign*BENCH[0]+along.x*t-sign*FRONT,z:BENCH[1]+along.z*t+FRONT,yaw:yaw+(rnd(i,11)-.5)*.5,variant:sets[4]&&i%2?4:3}));
  const decals=[];for(let i=0;i<SEATS;i++){const mesh=new T.Mesh(poses[0].decal,new T.MeshLambertMaterial({alphaTest:.5,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));mesh.name='BenchNo_'+side+i;mesh.visible=false;mesh.matrixAutoUpdate=false;mesh.castShadow=false;scene.add(mesh);decals.push(mesh);}
  state.sides[side]={sets,seats,stands,decals,sign,on:true};}
 state.place=(side,now=0)=>{const b=state.sides[side],people=state.people[side]||[],staff=Math.min(STAFF,state.staff[side]||0),used=b.sets.map(()=>0),cheer=state.cheer?.side===side&&b.sets[2]?state.cheer:null;
  const put=(spot,v,hop,shade)=>{const set=b.sets[v],i=used[v]++;dummy.position.set(spot.x,state.floorY-set.pose.floor+hop,spot.z);dummy.rotation.set(0,spot.yaw,0);dummy.updateMatrix();set.body.setMatrixAt(i,dummy.matrix);set.skin.setMatrixAt(i,dummy.matrix);set.skin.setColorAt(i,tone.setScalar(shade));};
  b.decals.forEach(d=>d.visible=false);
  people.slice(0,SEATS).forEach((person,j)=>{const i=ORDER[j],seat=b.seats[i],v=cheer&&i%3!==1?2:seat.variant,hop=v===2?Math.abs(Math.sin((now-(cheer.start??now))/170+i*1.7))*.09:0; /* 환호: 셋 중 둘이 일어나 조금씩 뛴다 */
   put(seat,v,hop,person.tone??1);const map=person.no!=null&&state.opts.tex?state.opts.tex(person.no,state.uniformOf?.[side]):null,d=b.decals[j];if(map&&b.on){if(d.material.map!==map){const fresh=!d.material.map;d.material.map=map;if(fresh)d.material.needsUpdate=true;}d.geometry=b.sets[v].pose.decal;d.matrix.copy(dummy.matrix);d.visible=true;}});
  for(let k=0;k<staff;k++)if(b.sets[b.stands[k].variant])put(b.stands[k],b.stands[k].variant,0,.94);
  b.sets.forEach((set,v)=>{if(!set)return;for(const m of [set.body,set.skin]){m.count=used[v];m.instanceMatrix.needsUpdate=true;m.computeBoundingSphere();}if(set.skin.instanceColor)set.skin.instanceColor.needsUpdate=true;});state.count[side]=Math.min(SEATS,people.length);};
 return state;}
/* 벤치: 경기에서 받은 명단(data.bench)이 있으면 그 선수들(번호·피부 밝기), 없으면 공격 9명·수비 6명. 유니폼은 그 순간 경기장 선수의 것 */
export function syncBench(state,data,opts){if(!state||!data)return;if(opts)state.opts=opts;const top=(data.half??0)%2===0,bat=top?'a':'h',fld=top?'h':'a',o=data.targets?.find(t=>t.k[0]==='o'),d=data.targets?.find(t=>t.k[0]==='d');state.uniformOf=state.uniformOf||{};
 const set=(side,u,n)=>{if(u){state.uniformOf[side]=u;const key=JSON.stringify([u.S,u.H]);if(state.uniform[side]!==key){state.uniform[side]=key;state.sides[side].sets.forEach(s=>s&&paint(s.body.geometry,u));}}
  const list=data.bench?.[side];state.people[side]=list?list.players.slice(0,n).map(p=>({no:p.no,tone:state.opts.tone?state.opts.tone(p):1})):Array.from({length:n},()=>({no:null,tone:1}));state.staff[side]=list?list.staff:0;if(state.uniform[side])state.place(side);};
 set(bat,o?.u,9);set(fld,d?.u,6);showBench(state,true);}
const meshesOf=b=>b.sets.flatMap(s=>s?[s.body,s.skin]:[]);
export function showBench(state,on){if(!state)return;for(const b of Object.values(state.sides)){b.on=on;meshesOf(b).forEach(m=>m.visible=on);if(!on)b.decals.forEach(d=>d.visible=false);}if(on)for(const side of Object.keys(state.sides))if(state.uniform[side])state.place(side);}
export function disposeBench(state){if(!state)return;for(const b of Object.values(state.sides)){for(const s of b.sets)if(s){s.body.removeFromParent();s.skin.removeFromParent();s.body.geometry.dispose();s.body.material.dispose();s.skin.material.dispose();}b.decals.forEach(d=>{d.removeFromParent();d.material.dispose();});}for(const p of state.poses)if(p){p.body.dispose();p.skin.dispose();p.decal.dispose();}}
export function benchInfo(state){return state?{h:state.count.h||0,a:state.count.a||0,staff:{h:state.staff.h||0,a:state.staff.a||0},numbers:Object.values(state.sides).reduce((n,b)=>n+b.decals.filter(d=>d.visible).length,0),cheer:state.cheer?.side||null,visible:Object.values(state.sides).every(b=>b.on)}:null;}
/* 득점·홈런 함성 때 그 팀 벤치가 일어난다. tickBench가 true를 돌려주는 동안은 계속 그려야 한다 */
export function cheerBench(state,home,ms=2600){if(!state)return;const prev=state.cheer;state.cheer={side:home?'h':'a',start:null,end:0,ms};if(prev&&prev.side!==state.cheer.side)state.place(prev.side);} /* 시작 시각은 그리기 시계로 tickBench가 찍는다(관중 환호와 같은 방식) */
export function tickBench(state,now){const c=state?.cheer;if(!c)return false;if(c.start==null){c.start=now;c.end=now+c.ms;}if(now>=c.end){state.cheer=null;state.place(c.side);return false;}state.place(c.side,now);return true;}
