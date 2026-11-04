/* Original broadcast choreography derived from the bundled MIT player clips. */
import {AnimationClip,Quaternion,Vector3,Euler} from 'three';
export const SWING_CONTACT=.9167,SWING_FOLLOW=.6,CATCHER_PREP=.24,THROW_RELEASE=.5417;
const up=new Vector3(0,1,0),smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
function valuesAt(track,t){return Array.from(track.createInterpolant().evaluate(t));}
export function powerSwing(source){
 const C=SWING_CONTACT,tail=Math.max(.01,source.duration-C),weights={Hips:.18,Spine:.32,Spine1:.28,Spine2:.22};
 const tracks=source.tracks.map(track=>{const copy=track.clone(),sourceTimes=[...new Set([...track.times,C])].sort((a,b)=>a-b),sourceValues=sourceTimes.flatMap(t=>valuesAt(track,t)),joint=track.name.match(/(Hips|Spine[12]?)\.quaternion$/)?.[1];
  copy.times=new Float32Array(Array.from(sourceTimes,t=>t<=C?C*Math.pow(Math.max(0,t/C),.72):C+(t-C)/tail*SWING_FOLLOW));
  copy.values=new Float32Array(sourceValues);
  if(joint){const q=new Quaternion(),turn=new Quaternion();for(let i=0;i<copy.times.length;i++){const t=copy.times[i],angle=t<C?-.20*Math.sin(Math.PI*t/C):.78*smooth((t-C)/SWING_FOLLOW);q.fromArray(sourceValues,i*4);turn.setFromAxisAngle(up,angle*weights[joint]);q.premultiply(turn).normalize().toArray(copy.values,i*4);}}
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
export const FOLLOW_FLEX=.8;
export function pitchFollowThrough(source,release){const axis=new Vector3(1,0,0),q=new Quaternion(),turn=new Quaternion(),weights={Spine:.3,Spine1:.35,Spine2:.35},ramp=.22;
 const tracks=source.tracks.map(track=>{const joint=track.name.match(/(Spine[12]?)\.quaternion$/)?.[1];if(!joint)return track;const grid=[];for(let t=release;t<source.duration;t+=1/30)grid.push(t);const times=[...new Set([...track.times,...grid,source.duration])].filter(t=>t<=source.duration).sort((a,b)=>a-b),values=times.flatMap(t=>valuesAt(track,t));
  for(let i=0;i<times.length;i++){const k=smooth((times[i]-release)/ramp);if(!k)continue;q.fromArray(values,i*4);q.multiply(turn.setFromAxisAngle(axis,FOLLOW_FLEX*weights[joint]*k)).normalize().toArray(values,i*4);}
  const copy=track.clone();copy.times=new Float32Array(times);copy.values=new Float32Array(values);return copy;});
 return new AnimationClip(source.name,source.duration,tracks);}
export function athleticClips(clips,events={}){const swing=clips.find(c=>c.name==='swing'),throwing=clips.find(c=>c.name==='throw'),crouch=clips.find(c=>c.name==='catcher_crouch');if(!swing||!throwing||!crouch)return clips;return [...clips.map(c=>c===swing?powerSwing(c):/^pitch_.*_(windup|stretch)$/.test(c.name)&&events[c.name]?pitchFollowThrough(c,events[c.name].release):c),catcherThrow(throwing,crouch)];}
