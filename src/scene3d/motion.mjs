import {LoopOnce,LoopRepeat,AnimationClip} from 'three';
// Keep the original rig and four deliveries; re-time their load, plant and release phases.
// 와인드업은 다리를 허리 높이로 든 자세(원본 손 분리 직전 구간)를 늘려 균형 잡는 순간을 보여 준다.
export function retimeBaseballClips(clips,events){const updated={...events},result=clips.map(source=>{
 let knots;if(source.name==='swing'){const contact=events.swing.contact;knots=[[0,0],[contact*.45,.48],[contact*.78,.74],[contact,.90],[source.duration,1.52]];updated.swing={...events.swing,contact:.90};}
 else if(/^pitch_.*_(windup|stretch)$/.test(source.name)){const e=events[source.name];if(!e)return source;const stretch=source.name.endsWith('stretch'),hand=stretch?.34:.64,release=stretch?.79:1.23,plant=release-.145 /* 디딤발 착지→공 놓기 145ms(교본: Fleisig 계열 측정, docs/asset-research/2026-11-12-mechanics). 예전 220ms는 팔이 느려 힘없어 보였다 */,end=stretch?1.48:2.02;knots=[[0,0],...(stretch?[]:[[e.hand_break*.51,hand*.34],[e.hand_break*.87,hand*.9]]),[e.hand_break,hand],[e.foot_plant,plant],[e.release,release],[source.duration,end]];updated[source.name]={...e,hand_break:hand,foot_plant:plant,release};}
 if(!knots)return source;const map=t=>{let i=1;while(i<knots.length-1&&t>knots[i][0])i++;const [a,x]=knots[i-1],[b,y]=knots[i];return x+(y-x)*Math.max(0,Math.min(1,(t-a)/Math.max(1e-6,b-a)));};const clip=source.clone();for(const track of clip.tracks)track.times=Float32Array.from(track.times,map);clip.duration=knots.at(-1)[1];return clip;
 });return {clips:result,events:updated};}
export function idleClip(a){return a.role==='batter'?'batting_stance':a.role==='catcher'?'catcher_crouch':a.role==='runner'?'idle':a.pitcher?'pitcher_set':a.zone==='of'?'field_ready_outfield':'field_ready_infield';} /* 내야·외야 준비 자세(원본 클립) */
export function advanceActor(a,now){const dt=Math.max(0,(now-(a.updatedAt??now))/1000);a.updatedAt=now;if(a.action&&(!a.action.paused||a.blendUntil)){a.mixer.update(dt);a.post?.(a);} /* post: 클립이 만든 자세 위에 덧붙이는 보정(투구 역학) */if(a.blendUntil&&now>=a.blendUntil)a.blendUntil=0;if(a.returnAt&&now>=a.returnAt){a.returnAt=0;playPose(a,idleClip(a),{freeze:true,fade:.16});}}
export function playPose(a,name,{freeze=false,loop=false,rate=1,fade=.12,returnIdle=false}={}){
 const clip=AnimationClip.findByName(a.clips,name)||AnimationClip.findByName(a.clips,'idle');if(!clip)return null;
 const now=performance.now();advanceActor(a,now);
 // A seek/cancel is immediate: fading clips must not keep twisting the frozen pose.
 if(freeze&&fade===0){a.mixer.stopAllAction();a.blendUntil=0;}
 const previous=a.action,action=a.mixer.clipAction(clip);
 if(previous===action&&loop&&!action.paused&&action.isRunning()){action.setEffectiveTimeScale(rate);return action;}
 action.stopFading().stopWarping().reset().setEffectiveTimeScale(rate).setEffectiveWeight(1).setLoop(loop?LoopRepeat:LoopOnce,loop?Infinity:1);action.clampWhenFinished=true;action.play();
 if(previous&&previous!==action&&fade>0){previous.fadeOut(fade);action.fadeIn(fade);a.blendUntil=now+fade*1000;}else if(previous&&previous!==action)previous.stop();
 a.motionHistory=(a.motionHistory||[]).concat({name,at:now}).slice(-16);a.action=action;a.motion=name;a.release=null;a.returnAt=returnIdle?now+clip.duration/rate*1000:0;
 if(freeze){a.mixer.update(.04);a.post?.(a);action.paused=true;}return action;
}
