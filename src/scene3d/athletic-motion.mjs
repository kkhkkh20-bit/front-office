/* Original broadcast choreography derived from the bundled MIT player clips. */
import {AnimationClip,Quaternion,Vector3,Euler} from 'three';
export const SWING_CONTACT=.9167,SWING_FOLLOW=.6,CATCHER_PREP=.24,THROW_RELEASE=.5417;
const up=new Vector3(0,1,0),smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
function valuesAt(track,t){return Array.from(track.createInterpolant().evaluate(t));}
export function powerSwing(source){
 const C=SWING_CONTACT,tail=Math.max(.01,source.duration-C),weights={Hips:.24,Spine:.34,Spine1:.28,Spine2:.22};
 const tracks=source.tracks.map(track=>{const copy=track.clone(),sourceTimes=[...new Set([...track.times,C,...Array.from({length:Math.ceil(source.duration*60)},(_,i)=>i/60).filter(g=>!track.times.some(k=>Math.abs(k-g)<.004)&&Math.abs(g-C)>.004)])].filter(t=>t<=source.duration).sort((a,b)=>a-b) /* 60Hz로 촘촘히: 스윙 프레임이 끊겨 보이지 않게(사용자 피드백 11-07) */,sourceValues=sourceTimes.flatMap(t=>valuesAt(track,t)),joint=track.name.match(/(Hips|Spine[12]?)\.quaternion$/)?.[1];
  copy.times=new Float32Array(Array.from(sourceTimes,t=>t<=C?C*Math.pow(Math.max(0,t/C),.6):C+(t-C)/tail*SWING_FOLLOW));
  copy.values=new Float32Array(sourceValues);
  if(joint){const q=new Quaternion(),turn=new Quaternion();for(let i=0;i<copy.times.length;i++){const t=copy.times[i],angle=t<C?-.30*Math.sin(Math.PI*t/C):1.12*smooth((t-C)/SWING_FOLLOW) /* 꼬임(로드)을 더 깊게, 접촉 뒤 몸통 회전을 크게: 호쾌한 풀스윙(사용자 피드백 11-07) */;q.fromArray(sourceValues,i*4);turn.setFromAxisAngle(up,angle*weights[joint]);q.premultiply(turn).normalize().toArray(copy.values,i*4);}}
  return copy;
 });
 return new AnimationClip('swing',C+SWING_FOLLOW,tracks);
}
export function catcherThrow(source,crouch){
 const tracks=source.tracks.map(track=>{const n=track.getValueSize(),start=crouch.tracks.find(t=>t.name===track.name),c=start?valuesAt(start,.04):valuesAt(track,0),first=valuesAt(track,0),times=[0,CATCHER_PREP],values=[...c,...first];
  for(let i=0;i<track.times.length;i++){if(track.times[i]===0)continue;times.push(CATCHER_PREP+track.times[i]);for(let j=0;j<n;j++)values.push(track.values[i*n+j]);}
  if(/Hips\.quaternion$/.test(track.name)){const q=new Quaternion(),turn=new Quaternion(),e=new Euler();q.fromArray(first);e.setFromQuaternion(q,'YXZ');const side=Math.PI/2-e.y;for(let i=1;i<times.length;i++){const progress=(times[i]-CATCHER_PREP)/THROW_RELEASE,angle=side*(1-smooth(progress));q.fromArray(values,i*4);q.premultiply(turn.setFromAxisAngle(up,angle)).normalize().toArray(values,i*4);}}
  const copy=track.clone();copy.times=new Float32Array(times);copy.values=new Float32Array(values);return copy;
 });
 return new AnimationClip('catcher_throw',CATCHER_PREP+source.duration,tracks);
}
// 투구 팔로스루: 릴리스 뒤 상체를 홈 쪽으로 깊게 숙인다(척추 세 마디에 나눠 로컬 축으로 더함). 릴리스 순간 자세는 그대로.
export const FOLLOW_FLEX=1.05; /* 투구 뒤 상체를 더 깊게 숙인다(사용자 피드백 11-07) */
export function pitchFollowThrough(source,release){const axis=new Vector3(1,0,0),q=new Quaternion(),turn=new Quaternion(),weights={Spine:.3,Spine1:.35,Spine2:.35},ramp=.22;
 const tracks=source.tracks.map(track=>{const joint=track.name.match(/(Spine[12]?)\.quaternion$/)?.[1];if(!joint)return track;const grid=[];for(let t=release;t<source.duration;t+=1/30)grid.push(t);const times=[...new Set([...track.times,...grid,source.duration])].filter(t=>t<=source.duration).sort((a,b)=>a-b),values=times.flatMap(t=>valuesAt(track,t));
  for(let i=0;i<times.length;i++){const k=smooth((times[i]-release)/ramp)*(1-.65*smooth((times[i]-release-.3)/.4));if(!k)continue; /* 깊이 숙였다가 0.3초 뒤부터 일어나 수비 준비 자세로(끝까지 숙이면 쪼그려 앉은 모양, 사용자 11-12) */q.fromArray(values,i*4);q.multiply(turn.setFromAxisAngle(axis,FOLLOW_FLEX*weights[joint]*k)).normalize().toArray(values,i*4);}
  const copy=track.clone();copy.times=new Float32Array(times);copy.values=new Float32Array(values);return copy;});
 return new AnimationClip(source.name,source.duration,tracks);}
/* 세트 포지션: 투수는 글러브 쪽 어깨를 홈으로 두고 옆으로 선다(우투수는 3루 쪽을 본다). 원본 세트·킥이 반쯤 정면이라
   골반 방향을 정확히 옆(SIDE_YAW)으로 맞추고, 다리 정점(hand_break) 뒤 릴리스까지 풀어 정면으로 던지게 한다. 고개는 홈을 보게 되돌린다(사용자 피드백 11-07) */
export const SIDE_YAW=-Math.PI/2;
const yawOf=q=>{const f=new Vector3(0,0,1).applyQuaternion(q);return Math.atan2(f.x,f.z);},wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
export function pitchSideOn(source,e,windup=false){const q=new Quaternion(),turn=new Quaternion(),head={Neck:.5,Head:.4};
 /* 세트: 처음부터 옆. 와인드업: 정면에서 시작해 다리를 들 때까지 옆으로 꼬고, 다리 정점 뒤 릴리스까지 풀며 정면으로 던진다 */
 const hb=e?e.hand_break:null,rel=e?e.release:null,end=e?rel:source.duration;
 const k=t=>!e?1:t<=hb?(windup?smooth(t/Math.max(.05,hb*.75)):1):1-smooth((t-hb)/Math.max(.05,rel-hb));
 const hipTrack=source.tracks.find(t=>/Hips\.quaternion$/.test(t.name));if(!hipTrack)return source;
 const delta=t=>{const f=k(t);return f?wrap(SIDE_YAW-yawOf(q.fromArray(valuesAt(hipTrack,t))))*f:0;}; /* 원본 골반 방향과 목표의 차이만큼만 돌린다(과회전 방지) */
 const tracks=source.tracks.map(track=>{const hip=track===hipTrack,hj=track.name.match(/(Neck|Head)\.quaternion$/)?.[1];if(!hip&&!hj)return track;
  const grid=[];for(let t=0;t<=end+1e-6;t+=1/30)grid.push(t);const times=[...new Set([...track.times,...grid,source.duration])].filter(t=>t<=source.duration).sort((a,b)=>a-b),values=times.flatMap(t=>valuesAt(track,t)),d=times.map(delta);
  for(let i=0;i<times.length;i++){if(!d[i])continue;const ang=hip?d[i]:-d[i]*head[hj];q.fromArray(values,i*4);q.premultiply(turn.setFromAxisAngle(up,ang)).normalize().toArray(values,i*4);}
  const copy=track.clone();copy.times=new Float32Array(times);copy.values=new Float32Array(values);return copy;});
 return new AnimationClip(source.name,source.duration,tracks);}
/* 투구 마무리: 릴리스 뒤 끌려오던 뒷다리(축발)가 앞으로 나와 디딤발 옆에 내려서고, 던진 팔은 몸 반대쪽 무릎 쪽으로 감기며 글러브는 가슴으로 당긴다(사용자 피드백 11-07).
   로컬 축 값은 player.glb 리그에서 잰 것(오른손 기준, 좌투는 모델 좌우 반전으로 같이 맞는다) */
export const PITCH_FINISH={RightUpLeg:[[1,0,0,-.2]],RightLeg:[[1,0,0,-.4]],RightArm:[[1,0,0,-.9]],LeftArm:[[0,0,1,-.6]],LeftForeArm:[[0,0,1,-.4]]};
/* 뼈별 로컬 회전 덧셈(가중치 k(t, 뼈이름)로 섞는다): 투구 마무리·타격 준비 자세가 같이 쓴다 */
function boneOffsets(source,map,kf,from=0){const q=new Quaternion(),turn=new Quaternion(),axis=new Vector3();
 const tracks=source.tracks.map(track=>{const j=track.name.match(/(?:^|[:.\/])(\w+)\.quaternion$/)?.[1]?.replace(/^mixamorig:?/,''),rots=j&&map[j];if(!rots)return track;
  const t0=typeof from==='function'?from(j):from,grid=[];for(let t=t0;t<source.duration;t+=1/30)grid.push(t);const times=[...new Set([...track.times,...grid,source.duration])].filter(t=>t<=source.duration).sort((a,b)=>a-b),values=times.flatMap(t=>valuesAt(track,t));
  for(let i=0;i<times.length;i++){const k=kf(times[i],j);if(!k)continue;q.fromArray(values,i*4);for(const [x,y,z,a] of rots)q.multiply(turn.setFromAxisAngle(axis.set(x,y,z),a*k));q.normalize().toArray(values,i*4);}
  const copy=track.clone();copy.times=new Float32Array(times);copy.values=new Float32Array(values);return copy;});
 return new AnimationClip(source.name,source.duration,tracks);}
export function pitchFinish(source,e){if(!e)return source;const rel=e.release,ramp=j=>/Leg/.test(j)?[rel+.08,.3]:[rel,.25]; /* 다리는 릴리스 직후 차고 나와 0.3초에 걸쳐 내려선다 */
 return boneOffsets(source,PITCH_FINISH,(t,j)=>{const [t0,len]=ramp(j);return smooth((t-t0)/len);},j=>ramp(j)[0]);}
/* 타격 준비 자세: KBO 타자처럼 두 손을 뒤쪽 귀 높이로 모아 올린다(사용자 레퍼런스 11-07). 손 목표점에 맞춰 잰 값(오른손 타자 기준, 좌타는 좌우 반전).
   스윙은 같은 자세에서 시작해 테이크백(원본 0.35초)부터 원래 궤적으로 풀어 준다 */
export const BAT_STANCE={RightArm:[[1,0,0,-.671],[0,0,1,.544],[0,1,0,-.146]],RightForeArm:[[1,0,0,.083],[0,0,1,-.094]],LeftArm:[[0,1,0,.109],[0,0,1,-.586],[1,0,0,-.313]],LeftForeArm:[[1,0,0,.267],[0,0,1,-.001]],RightHand:[[.695,.654,-.298,.72]],LeftHand:[[.796,-.378,.472,.443]]}; /* 손목은 원본 손 방향을 되돌려 배트가 원래처럼 비스듬히 선다 */
export function batStance(source,fade=null){return boneOffsets(source,BAT_STANCE,t=>fade?1-smooth((t-fade[0])/(fade[1]-fade[0])):1);}
/* 호쾌한 스윙: 맞히는 순간 두 팔을 쭉 뻗어(번트처럼 팔을 접은 채 밀지 않게) 배트 끝이 큰 원을 그리고, 팔로스루에서 다시 접어 어깨 위로 감는다(사용자 피드백 11-07). 접촉 순간 손 위치를 어깨에서 12cm 더 멀리 뻗도록 잰 값 */
export const SWING_EXT={RightForeArm:[[1,0,0,.691],[0,0,1,-.053]],LeftForeArm:[[1,0,0,.761],[0,0,1,-.279]],RightArm:[[1,0,0,-.059],[0,0,1,.331]],LeftArm:[[0,1,0,.327],[0,0,1,-.376],[1,0,0,-.094]]};
export function swingExtend(source){const C=SWING_CONTACT,a=C-.03,p=C+.1,b=C+.4;return boneOffsets(source,SWING_EXT,t=>t<a||t>b?0:t<p?smooth((t-a)/(p-a)):1-smooth((t-p)/(b-p)));} /* 두 팔이 쭉 펴지는 것은 맞힌 뒤(최대 0.1초 뒤), 그 전에는 굽힌 채 몸에 붙여 돈다(사용자 11-12) */
export function athleticClips(clips,events={}){const swing=clips.find(c=>c.name==='swing'),throwing=clips.find(c=>c.name==='throw'),crouch=clips.find(c=>c.name==='catcher_crouch');if(!swing||!throwing||!crouch)return clips;return [...clips.map(c=>c===swing?swingExtend(powerSwing(batStance(c,[.35,.7]))):c.name==='batting_stance'?batStance(c):c.name==='pitcher_set'?pitchSideOn(c,null):/^pitch_.*_stretch$/.test(c.name)&&events[c.name]?pitchSideOn(pitchFinish(pitchFollowThrough(c,events[c.name].release),events[c.name]),events[c.name]):/^pitch_.*_windup$/.test(c.name)&&events[c.name]?pitchSideOn(pitchFinish(pitchFollowThrough(c,events[c.name].release),events[c.name]),events[c.name],true):c),catcherThrow(throwing,crouch)];}
