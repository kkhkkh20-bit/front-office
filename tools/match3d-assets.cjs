const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
function modelFiles(root){return ['field','stadium','player','bat','ball'].map(key=>{const source=path.join(root,'assets/match3d',key+'.glb'),data=fs.readFileSync(source),hash=crypto.createHash('sha256').update(data).digest('hex').slice(0,12);return {key,source,filename:`assets/match3d/${key}.${hash}.glb`,bytes:data.length};});}
/* 중계 효과음(CC0, assets/match3d/audio/README.md): 경기장 모델과 같이 경기 화면에서만 받는다 */
function audioFiles(root){const dir=path.join(root,'assets/match3d/audio');return fs.readdirSync(dir).filter(f=>f.endsWith('.mp3')).sort().map(f=>{const source=path.join(dir,f),data=fs.readFileSync(source),key=f.replace(/\.mp3$/,''),hash=crypto.createHash('sha256').update(data).digest('hex').slice(0,12);return {key,source,filename:`assets/match3d/audio/${key}.${hash}.mp3`,bytes:data.length};});}
module.exports={modelFiles,audioFiles};
