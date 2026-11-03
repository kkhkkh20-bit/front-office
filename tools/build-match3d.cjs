const fs=require('node:fs'),path=require('node:path'),esbuild=require('esbuild');
function buildMatch3d(root,manifest){
 const bytes=p=>fs.readFileSync(p).toString('base64'),dir=path.join(root,'assets/match3d'),three=path.join(__dirname,'node_modules/three');
 const assets={};for(const name of ['field','stadium','player','bat','ball'])assets[name]=bytes(path.join(dir,name+'.glb'));
 assets.events=JSON.parse(fs.readFileSync(path.join(dir,'animation-events.json'),'utf8'));
 assets.gear=JSON.parse(fs.readFileSync(path.join(dir,'gear_defaults.json'),'utf8'));
 assets.basisJS=fs.readFileSync(path.join(three,'examples/jsm/libs/basis/basis_transcoder.js'),'utf8');assets.basisWasm=bytes(path.join(three,'examples/jsm/libs/basis/basis_transcoder.wasm'));
 return esbuild.buildSync({absWorkingDir:root,entryPoints:manifest.bundles.scene3d,bundle:true,write:false,format:'iife',globalName:'Match3D',platform:'browser',target:'es2020',minify:true,nodePaths:[path.join(__dirname,'node_modules')],define:{FO3D_PACK:JSON.stringify(assets)},banner:{js:'/*\n'+fs.readFileSync(path.join(root,'docs/licenses/match3d.txt'),'utf8')+'\n*/'},legalComments:'eof'}).outputFiles[0].text.replace(/<\/script/gi,'<\\/script').replace(/[ \t]+$/gm,'');
}
module.exports={buildMatch3d};
