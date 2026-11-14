/* 더그아웃 벤치 인원(사용자 11-13). 선수 모델을 앉은 자세로 굳힌 정적 메시를 인스턴싱한다(뼈대 계산 없음, 팀당 그리기 2회).
 * 장면 좌표: 홈 더그아웃 = 1루 쪽(x<0), 원정 = 3루 쪽(x>0). 벤치는 파울선과 나란한 대각선. */
import * as T from 'three';
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';
const PARTS=['Head','Gear_Cap','Jersey','Undershirt','Pants','Socks','Cleats','Gear_Belt','Hand_L_Relaxed','Hand_R_Relaxed'];
const TINT={uniform_jersey:'S',cap:'H',uniform_socks:'H',uniform_undershirt:'H',piping:'H'};
const FIXED={skin:'#c69472',cleats:'#1b1d22',belt:'#1b1d22'};
const SEATS=9,GAP=1.28,BENCH=[23.74,6.45],FLOOR_Y=-.6,BACK=.3; /* BACK: 벤치 쪽(내야 반대)으로 물려 앉힌다 */
const rnd=(i,salt)=>{const x=Math.sin(i*127.1+salt*311.7)*43758.5453;return x-Math.floor(x);};
/* 한 자세를 굳혀 하나의 지오메트리로 합친다. slot 속성: 0 상의·하의, 1 모자·양말·언더셔츠, 2 고정색 */
function bake(player,clip,time){const o=cloneSkeleton(player.scene),mixer=new T.AnimationMixer(o);if(clip){mixer.clipAction(clip).play();mixer.setTime(time);}o.updateMatrixWorld(true);
 const pos=[],col=[],slot=[],index=[],p=new T.Vector3(),c=new T.Color();
 o.traverse(n=>{if(!n.isSkinnedMesh||!PARTS.includes(n.name))return;n.skeleton.update();const g=n.geometry,base=pos.length/3,m=Array.isArray(n.material)?n.material[0]:n.material,key=TINT[m.name],s=key==='S'?0:key==='H'?1:2;c.set(FIXED[m.name]||(s===2?'#'+m.color.getHexString():'#ffffff'));
  for(let i=0;i<g.attributes.position.count;i++){n.getVertexPosition(i,p).applyMatrix4(n.matrixWorld);pos.push(p.x,p.y,p.z);col.push(c.r,c.g,c.b);slot.push(s);}
  const ix=g.index;if(ix)for(let i=0;i<ix.count;i++)index.push(base+ix.getX(i));else for(let i=0;i<g.attributes.position.count;i++)index.push(base+i);});
 mixer.stopAllAction();mixer.uncacheRoot(o);
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.userData.slot=Uint8Array.from(slot);g.setIndex(index);g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();return g;}
function paint(g,u){const a=g.attributes.color,slot=g.userData.slot,base=g.userData.base||(g.userData.base=a.array.slice()),S=new T.Color(u?.S||'#eeeeee'),H=new T.Color(u?.H||'#273650');
 for(let i=0;i<slot.length;i++){const c=slot[i]===0?S:slot[i]===1?H:null;if(c)a.setXYZ(i,c.r,c.g,c.b);else a.setXYZ(i,base[i*3],base[i*3+1],base[i*3+2]);}a.needsUpdate=true;}
export function createBench(scene,player){const clip=player.animations.find(c=>c.name==='bench_sit');if(!clip)return null;
 const state={sides:{},uniform:{},count:{}},dummy=new T.Object3D();
 for(const side of ['h','a']){const sign=side==='h'?-1:1,along=new T.Vector3(sign,0,1).normalize(),yaw=Math.atan2(-sign,1); /* 앉은 사람은 내야(대각선 안쪽)를 본다 */
  const meshes=[0,1].map(variant=>{const g=bake(player,clip,variant?clip.duration*.55:clip.duration*.1),mesh=new T.InstancedMesh(g,new T.MeshLambertMaterial({vertexColors:true}),SEATS);mesh.name='Bench_'+side+variant;mesh.castShadow=false;mesh.receiveShadow=false;mesh.count=0;scene.add(mesh);return mesh;});
  const seats=[];for(let i=0;i<SEATS;i++){const t=(i-(SEATS-1)/2)*GAP+(rnd(i,sign)-.5)*.3;seats.push({x:sign*BENCH[0]+along.x*t+sign*BACK,z:BENCH[1]+along.z*t-BACK,yaw:yaw+(rnd(i,7)-.5)*.35,variant:rnd(i,3)>.5?1:0});}
  state.sides[side]={meshes,seats,sign};}
 state.place=(side,n)=>{const b=state.sides[side],order=[4,2,6,1,7,3,5,0,8].slice(0,Math.max(0,Math.min(SEATS,n))),used=[0,0];
  for(const i of order){const seat=b.seats[i],mesh=b.meshes[seat.variant],floor=mesh.geometry.boundingBox.min.y;dummy.position.set(seat.x,state.floorY-floor,seat.z);dummy.rotation.set(0,seat.yaw,0);dummy.updateMatrix();mesh.setMatrixAt(used[seat.variant]++,dummy.matrix);}
  b.meshes.forEach((m,v)=>{m.count=used[v];m.instanceMatrix.needsUpdate=true;m.computeBoundingSphere();});state.count[side]=order.length;};
 state.floorY=FLOOR_Y;return state;}
/* 공격 팀은 9명, 수비 팀은 6명이 벤치에 앉는다. 유니폼은 그 순간 경기장에 있는 선수의 것을 따른다 */
export function syncBench(state,data){if(!state||!data)return;const top=(data.half??0)%2===0,bat=top?'a':'h',fld=top?'h':'a',o=data.targets?.find(t=>t.k[0]==='o'),d=data.targets?.find(t=>t.k[0]==='d');
 const set=(side,u,n)=>{if(u){const key=JSON.stringify([u.S,u.H]);if(state.uniform[side]!==key){state.uniform[side]=key;state.sides[side].meshes.forEach(m=>paint(m.geometry,u));}}if(state.uniform[side])state.place(side,n);};
 set(bat,o?.u,9);set(fld,d?.u,6);showBench(state,true);}
export function showBench(state,on){if(!state)return;for(const b of Object.values(state.sides))b.meshes.forEach(m=>m.visible=on);}
export function disposeBench(state){if(!state)return;for(const b of Object.values(state.sides))b.meshes.forEach(m=>{m.removeFromParent();m.geometry.dispose();m.material.dispose();});}
export function benchInfo(state){return state?{h:state.count.h||0,a:state.count.a||0,visible:Object.values(state.sides).every(b=>b.meshes.every(m=>m.visible))}:null;}
