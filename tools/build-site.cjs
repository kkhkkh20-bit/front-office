/* Cloudflare Workers has a 25 MiB per-asset limit. Keep downloadable HTML self-contained,
 * but publish same-origin, versioned GLBs for the website; fetch only on opening a match. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {build}=require('./build.cjs'),{modelFiles}=require('./match3d-assets.cjs');
const MAX_ASSET_BYTES=25*1024*1024;
function buildSite({root=path.resolve(__dirname,'..'),out=path.join(root,'site')}={}){
 const {html}=build({root,write:false,embedded3d:false});const buildId=crypto.createHash('sha256').update(html).digest('hex').slice(0,16),staging=out+'.tmp-'+process.pid;
 const document=html.replace('</head>',`<meta name="fronttime-build" content="${buildId}">\n</head>`),models=modelFiles(root);
 const headers='/\n  Cache-Control: no-cache\n/index.html\n  Cache-Control: no-cache\n/release.json\n  Cache-Control: no-store\n/assets/match3d/*\n  Cache-Control: public, max-age=31536000, immutable\n';
 const files=[{filename:'_headers',data:Buffer.from(headers)},{filename:'index.html',data:Buffer.from(document)},...models.map(f=>({filename:f.filename,data:fs.readFileSync(f.source)})),{filename:'licenses/match3d.txt',data:fs.readFileSync(path.join(root,'docs/licenses/match3d.txt'))}];
 for(const f of files)if(f.data.length>MAX_ASSET_BYTES)throw Error(`Cloudflare 파일 한도 초과: ${f.filename} (${f.data.length})`);
 const release={build:buildId,rendering:'3d',models:models.map(({key,filename,bytes})=>({key,path:filename,bytes})),files:files.map(f=>({path:f.filename,bytes:f.data.length}))};files.push({filename:'release.json',data:Buffer.from(JSON.stringify(release,null,2)+'\n')});
 try{fs.mkdirSync(staging,{recursive:true});for(const f of files){const target=path.join(staging,f.filename);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,f.data);}fs.rmSync(out,{recursive:true,force:true});fs.renameSync(staging,out);}finally{fs.rmSync(staging,{recursive:true,force:true});}
 return {out,release};
}
module.exports={buildSite,MAX_ASSET_BYTES};
if(require.main===module){try{const {release}=buildSite();console.log(`Cloudflare 배포 생성: ${release.build}; HTML ${release.files.find(f=>f.path==='index.html').bytes} bytes; 최대 ${Math.max(...release.files.map(f=>f.bytes))} bytes; 모든 파일 25 MiB 이하`);}catch(e){console.error(e);process.exitCode=1;}}
