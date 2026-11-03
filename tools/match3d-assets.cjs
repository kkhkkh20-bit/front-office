const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
function modelFiles(root){return ['field','stadium','player','bat','ball'].map(key=>{const source=path.join(root,'assets/match3d',key+'.glb'),data=fs.readFileSync(source),hash=crypto.createHash('sha256').update(data).digest('hex').slice(0,12);return {key,source,filename:`assets/match3d/${key}.${hash}.glb`,bytes:data.length};});}
module.exports={modelFiles};
