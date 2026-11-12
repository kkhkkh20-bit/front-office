/* CMU 모션캡처(ASF/AMC)를 player.glb의 mixamorig 골격 클립(JSON)으로 옮긴다.
   출처: CMU Graphics Lab Motion Capture Database(mocap.cs.cmu.edu). FAQ: "may be copied, modified, or redistributed without permission".
   방식: CMU 관절 위치를 계산(FK)한 뒤, 골반은 좌우 고관절·척추로 만든 좌표계를 맞추고, 나머지 뼈는 뼈 방향(부모→자식)을 맞춘다.
   손은 손 방향과 엄지 방향으로 비틀림까지 맞춘다(배트가 오른손 Bat_Grip에 붙어 있어서).
   사용: node tools/match3d-cmu-clip.cjs <asf> <amc> <클립 이름> <시작 초> <끝 초> <접촉 초> <출력 json> */
const fs=require('node:fs'),path=require('node:path');
const T=require(path.join(__dirname,'node_modules/three/build/three.cjs'));
const [,,asfPath,amcPath,clipName,t0s,t1s,contactS,outPath]=process.argv;
const UNIT=0.0254/0.45,FPS_IN=120,FPS_OUT=30,D=Math.PI/180;
// ---------- ASF ----------
function parseAsf(text){const bones={},lines=text.split(/\r?\n/);let cur=null,mode='',hier={};
 for(const raw of lines){const l=raw.trim();if(!l||l.startsWith('#'))continue;if(l.startsWith(':')){mode=l.split(/\s+/)[0];continue;}
  if(mode===':bonedata'){if(l==='begin'){cur={dof:[]};continue;}if(l==='end'){bones[cur.name]=cur;cur=null;continue;}const [k,...v]=l.split(/\s+/);
   if(k==='name')cur.name=v[0];else if(k==='direction')cur.dir=v.map(Number);else if(k==='length')cur.len=+v[0];else if(k==='axis')cur.axis=v.slice(0,3).map(Number);else if(k==='dof')cur.dof=v;}
  else if(mode===':hierarchy'){if(l==='begin'||l==='end')continue;const [p,...c]=l.split(/\s+/);hier[p]=c;}}
 return {bones,hier};}
const eulerXYZ=(x,y,z)=>new T.Quaternion().setFromEuler(new T.Euler(x*D,y*D,z*D,'XYZ')); /* ASF 'XYZ' = X 다음 Y 다음 Z(=Rz·Ry·Rx), three의 'XYZ'는 Rx·Ry·Rz라 순서를 직접 곱한다 */
function rotXYZ(x,y,z){const qx=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),x*D),qy=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),y*D),qz=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),z*D);return qz.multiply(qy).multiply(qx);}
// ---------- AMC ----------
function parseAmc(text){const frames=[];let f=null;for(const raw of text.split(/\r?\n/)){const l=raw.trim();if(!l||l.startsWith('#')||l.startsWith(':'))continue;if(/^\d+$/.test(l)){f={};frames.push(f);continue;}const [k,...v]=l.split(/\s+/);f[k]=v.map(Number);}return frames;}
const asf=parseAsf(fs.readFileSync(asfPath,'utf8')),frames=parseAmc(fs.readFileSync(amcPath,'utf8'));
if(process.env.SCAN){/* 점검용: 0.1초마다 루트 높이, 양손의 몸 앞쪽 거리, 손 높이 */setTimeout(()=>{for(let i=0;i<frames.length;i+=12){const J=fk(frames[i]),c=J.thorax;console.log((i/FPS_IN).toFixed(2),'root',J.root.y.toFixed(2),'rh',J.rhand.clone().sub(c).toArray().map(v=>v.toFixed(2)).join(','),'lh',J.lhand.clone().sub(c).toArray().map(v=>v.toFixed(2)).join(','));}process.exit(0);});}
function fk(fr){const J={},W={},r=fr.root;J.root=new T.Vector3(r[0],r[1],r[2]).multiplyScalar(UNIT);W.root=rotXYZ(r[3],r[4],r[5]);
 const walk=(parent,name)=>{const b=asf.bones[name],C=rotXYZ(...b.axis),Ci=C.clone().invert(),v=fr[name]||[],a={rx:0,ry:0,rz:0};b.dof.forEach((d,i)=>a[d]=v[i]||0);const M=rotXYZ(a.rx,a.ry,a.rz),L=C.clone().multiply(M).multiply(Ci);W[name]=W[parent].clone().multiply(L);
  J[name]=J[parent].clone().add(new T.Vector3(...b.dir).multiplyScalar(b.len*UNIT).applyQuaternion(W[name]));for(const c of asf.hier[name]||[])walk(name,c);};
 for(const c of asf.hier.root)walk('root',c);return J;}
// ---------- player.glb 골격(정지 자세) ----------
const glb=fs.readFileSync(path.join(__dirname,'../assets/match3d/player.glb')),gj=JSON.parse(glb.slice(20,20+glb.readUInt32LE(12)));
const node=n=>gj.nodes.find(x=>x.name==='mixamorig:'+n),parentOf={};gj.nodes.forEach((n,i)=>(n.children||[]).forEach(c=>parentOf[c]=i));
const rest={};function restWorld(n){if(rest[n])return rest[n];const x=node(n),i=gj.nodes.indexOf(x),pi=parentOf[i],pn=gj.nodes[pi]?.name?.replace('mixamorig:',''),local={t:new T.Vector3(...(x.translation||[0,0,0])),q:new T.Quaternion(...(x.rotation||[0,0,0,1]))};
 const p=pn&&gj.nodes[pi].name.startsWith('mixamorig:')?restWorld(pn):{p:new T.Vector3(),q:new T.Quaternion()};rest[n]={local,parent:pn&&gj.nodes[pi].name.startsWith('mixamorig:')?pn:null,q:p.q.clone().multiply(local.q),p:p.p.clone().add(local.t.clone().applyQuaternion(p.q))};return rest[n];}
const BONES=['Hips','Spine','Spine1','Spine2','Neck','Head','LeftShoulder','LeftArm','LeftForeArm','LeftHand','RightShoulder','RightArm','RightForeArm','RightHand','LeftUpLeg','LeftLeg','LeftFoot','LeftToeBase','RightUpLeg','RightLeg','RightFoot','RightToeBase'];BONES.forEach(restWorld);
// 뼈 → (자식 뼈, CMU 구간 시작, 끝)
const MAP={Spine:['Spine1','root','lowerback'],Spine1:['Spine2','lowerback','upperback'],Spine2:['Neck','upperback','thorax'],Neck:['Head','thorax','upperneck'],
 LeftShoulder:['LeftArm','thorax','lclavicle'],LeftArm:['LeftForeArm','lclavicle','lhumerus'],LeftForeArm:['LeftHand','lhumerus','lradius'],
 RightShoulder:['RightArm','thorax','rclavicle'],RightArm:['RightForeArm','rclavicle','rhumerus'],RightForeArm:['RightHand','rhumerus','rradius'],
 LeftUpLeg:['LeftLeg','lhipjoint','lfemur'],LeftLeg:['LeftFoot','lfemur','ltibia'],LeftFoot:['LeftToeBase','ltibia','lfoot'],
 RightUpLeg:['RightLeg','rhipjoint','rfemur'],RightLeg:['RightFoot','rfemur','rtibia'],RightFoot:['RightToeBase','rtibia','rfoot']};
const basis=(x,up)=>{x=x.clone().normalize();const z=new T.Vector3().crossVectors(x,up).normalize(),y=new T.Vector3().crossVectors(z,x).normalize();return new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(x,y,z));};
const hipFrame=(L,R,up)=>basis(L.clone().sub(R),up);
const mixHip=hipFrame(rest.LeftUpLeg.p,rest.RightUpLeg.p,rest.Spine1.p.clone().sub(rest.Hips.p));
// 손: 손 방향(y)과 엄지 쪽(정지 자세에서 앞 +Z로 가정)
const handFrame=(dir,thumb)=>{const y=dir.clone().normalize(),z=thumb.clone().sub(y.clone().multiplyScalar(thumb.dot(y))).normalize(),x=new T.Vector3().crossVectors(y,z);return new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(x,y,z));};
const restHand={};for(const s of ['Left','Right']){const h=rest[s+'Hand'],dir=new T.Vector3(0,1,0).applyQuaternion(h.q);restHand[s]=handFrame(dir,new T.Vector3(0,0,1));}
// 첫 프레임 기준 수평 회전(A)과 높이 비율
const i0=Math.round(+t0s*FPS_IN),i1=Math.min(frames.length-1,Math.round(+t1s*FPS_IN));const J0=fk(frames[i0]);
const fwd=q=>{const f=new T.Vector3(0,0,1).applyQuaternion(q);f.y=0;return f.normalize();};
const cmuHip0=hipFrame(J0.lhipjoint,J0.rhipjoint,J0.lowerback.clone().sub(J0.root)),J1=fk(frames[i1]),travel=J1.root.clone().sub(J0.root).setY(0).normalize(),fa=process.env.ALIGN==='travel'?travel:fwd(cmuHip0) /* ALIGN=travel: 투구처럼 몸이 옆으로 섰다가 앞으로 나가는 동작은 이동 방향을 정면(+Z)으로 */,fb=fwd(mixHip),A=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.atan2(fb.x,fb.z)-Math.atan2(fa.x,fa.z));
const footY=J=>Math.min(J.ltoes.y,J.rtoes.y,J.lfoot.y,J.rfoot.y),hipH0=J0.root.y-footY(J0),scale=rest.Hips.local.t.y/hipH0,ground0=footY(J0);
const tracks={};BONES.forEach(b=>tracks[b]=[]);const pos=[],times=[];
for(let t=+t0s;t<=+t1s+1e-6;t+=1/FPS_OUT){const fi=Math.min(frames.length-2,Math.floor(t*FPS_IN)),w=t*FPS_IN-fi,Ja=fk(frames[fi]),Jb=fk(frames[fi+1]),J={};for(const k in Ja)J[k]=Ja[k].clone().lerp(Jb[k],w).applyQuaternion(A);
 times.push(+(t-+t0s).toFixed(5));const W={};
 W.Hips=hipFrame(J.lhipjoint,J.rhipjoint,J.lowerback.clone().sub(J.root)).multiply(mixHip.clone().invert()).multiply(rest.Hips.q);
 const local={Hips:W.Hips.clone()}; /* Hips의 부모(Armature)는 단위 회전 */
 const hp=J.root.clone();const base=J0.root.clone().applyQuaternion(A);pos.push(rest.Hips.local.t.x+(hp.x-base.x)*scale,rest.Hips.local.t.y+(hp.y-J0.root.y-0)*scale,rest.Hips.local.t.z+(hp.z-base.z)*scale);
 for(const b of BONES.slice(1)){const r=rest[b],pw=W[r.parent],prov=pw.clone().multiply(r.local.q);let world=prov;
  if(MAP[b]){const [child,a,c]=MAP[b],d0=rest[child].local.t.clone().normalize().applyQuaternion(prov),dt=J[c].clone().sub(J[a]).normalize();world=new T.Quaternion().setFromUnitVectors(d0,dt).multiply(prov);}
  else if(/Hand$/.test(b)){const s=b.startsWith('Left')?'l':'r',dir=J[s+'hand'].clone().sub(J[s+'radius']),thumb=J[s+'thumb'].clone().sub(J[s+'wrist']);world=handFrame(dir,thumb).multiply(restHand[b.startsWith('Left')?'Left':'Right'].clone().invert()).multiply(r.q);}
  W[b]=world;local[b]=pw.clone().invert().multiply(world);}
 for(const b of BONES){const q=local[b];tracks[b].push(q.x,q.y,q.z,q.w);}}
// 사원수 부호 연속
for(const b of BONES){const v=tracks[b];for(let i=4;i<v.length;i+=4)if(v[i]*v[i-4]+v[i+1]*v[i-3]+v[i+2]*v[i-2]+v[i+3]*v[i-1]<0)for(let j=0;j<4;j++)v[i+j]*=-1;}
const r5=a=>a.map(x=>+x.toFixed(5));
const clip={name:clipName,duration:times.at(-1),source:'CMU mocap subject 124 '+path.basename(amcPath),events:{[process.env.EVENT||'contact']:+(+contactS-+t0s).toFixed(4)},tracks:[{name:'mixamorigHips.position',type:'vector',times,values:r5(pos)},...BONES.map(b=>({name:'mixamorig'+b+'.quaternion',type:'quaternion',times,values:r5(tracks[b])}))]};
fs.writeFileSync(outPath,JSON.stringify(clip));console.log(clipName,'frames',times.length,'duration',clip.duration,'bytes',fs.statSync(outPath).size);
