import {LoopOnce,LoopRepeat,AnimationClip} from 'three';
export function idleClip(a){return a.role==='batter'?'batting_stance':a.role==='catcher'?'catcher_crouch':a.role==='runner'?'idle':a.pitcher?'pitcher_set':'field_ready';}
export function advanceActor(a,now){const dt=Math.max(0,(now-(a.updatedAt??now))/1000);a.updatedAt=now;if(a.action&&(!a.action.paused||a.blendUntil))a.mixer.update(dt);if(a.blendUntil&&now>=a.blendUntil)a.blendUntil=0;if(a.returnAt&&now>=a.returnAt){a.returnAt=0;playPose(a,idleClip(a),{freeze:true,fade:.16});}}
export function playPose(a,name,{freeze=false,loop=false,rate=1,fade=.12,returnIdle=false}={}){
 const clip=AnimationClip.findByName(a.clips,name)||AnimationClip.findByName(a.clips,'idle');if(!clip)return null;
 const now=performance.now();advanceActor(a,now);const previous=a.action,action=a.mixer.clipAction(clip);
 if(previous===action&&loop&&!action.paused&&action.isRunning()){action.setEffectiveTimeScale(rate);return action;}
 action.reset().setEffectiveTimeScale(rate).setEffectiveWeight(1).setLoop(loop?LoopRepeat:LoopOnce,loop?Infinity:1);action.clampWhenFinished=true;action.play();
 if(previous&&previous!==action&&fade>0){previous.fadeOut(fade);action.fadeIn(fade);a.blendUntil=now+fade*1000;}else if(previous&&previous!==action)previous.stop();
 a.motionHistory=(a.motionHistory||[]).concat({name,at:now}).slice(-16);a.action=action;a.motion=name;a.release=null;a.returnAt=returnIdle?now+clip.duration/rate*1000:0;
 if(freeze){a.mixer.update(.04);action.paused=true;}return action;
}
