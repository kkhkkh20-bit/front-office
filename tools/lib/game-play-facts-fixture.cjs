const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
/* Standalone UI fixtures use the same recorded-play readers as the full bundle. */
function loadPlayFacts(context,root,{coordinates=false}={}){
 const read=f=>fs.readFileSync(path.join(root,'src',f),'utf8'),range=(s,start,end)=>{const a=s.indexOf(start),b=s.indexOf(end,a+start.length);if(a<0||b<0)throw Error('Production play reader not found: '+start);return s.slice(a,b);},game=read('engine/matches/06_game.js'),cast=read('ui/matches/21_cast.js'),pbp=read('ui/matches/22_pbp.js');
 const source=(coordinates?range(cast,'const CFP=','let CT='):'')+range(game,'function gamePA(','function earnedBasesStep(')+range(pbp,'function pbpState(','function pNmAny(')+range(cast,'function cBefore(','function cFielders(')+range(cast,'function cOutTarget(','function cContactPlan(');
 vm.runInContext(source,context,{filename:'production recorded-play readers'});
}
module.exports={loadPlayFacts};
