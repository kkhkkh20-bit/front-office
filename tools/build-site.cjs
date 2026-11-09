/* Cloudflare Workers has a 25 MiB per-asset limit. Keep downloadable HTML self-contained,
 * but publish same-origin, versioned GLBs for the website; fetch only on opening a match. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {splitWebsite}=require('./lib/site-runtime.cjs');
const {build}=require('./build.cjs'),{modelFiles}=require('./match3d-assets.cjs');
const MAX_ASSET_BYTES=25*1024*1024;
/* v14 장면 사진(응원 무대·행사·스카우트 출장): HTML에 넣지 않고 같은 경로로 따로 올린다. 화면은 받아지면 그리고 못 받으면 생략(77_assets_ui.js sceneImg) */
function sceneFiles(root){ const M=JSON.parse(fs.readFileSync(path.join(root,'assets/v14/scene_manifest.json'),'utf8')); return [...M.scenes.map(x=>({filename:'assets/v14/'+x.file.path,data:fs.readFileSync(path.join(root,'assets/v14',x.file.path))})),...champFiles(root),...v13Faces(root)]; }
/* v13 선수 얼굴 60명 256px 시트(구단 ID.webp, 납품 f6bce76 무손실본을 WebP q85로 줄임). 앱 HTML에는 128px만 넣고 사이트에서만 받는다(77_assets_ui.js face6Src2) */
function v13Faces(root){ const b='assets/v13/face256/'; return fs.readdirSync(path.join(root,b)).filter(f=>f.endsWith('.webp')).map(f=>({filename:b+f,data:fs.readFileSync(path.join(root,b,f))})); }
/* v16 우승 장면·배너·256px 트로피(52_champion.js champPic, 77_assets_ui.js tro16). 1024 트로피·투명 PNG·검수 자료는 올리지 않는다 */
function champFiles(root){ const b='assets/v16/champ/', M=JSON.parse(fs.readFileSync(path.join(root,b,'manifest.json'),'utf8'));
 const L=[...M.assets.filter(x=>x.group!=='trophy').map(x=>x.file.path),...['series','season','ring'].map(k=>`trophy/app/trophy_${k}_256.webp`)];
 return L.map(p=>({filename:b+p,data:fs.readFileSync(path.join(root,b,p))})); }
function buildSite({root=path.resolve(__dirname,'..'),out=path.join(root,'site')}={}){
 const {html}=build({root,write:false,embedded3d:false}),web=splitWebsite(html);const buildId=crypto.createHash('sha256').update(web.document).digest('hex').slice(0,16),staging=out+'.tmp-'+process.pid;
 const document=web.document.replace('</head>',`<meta name="fronttime-build" content="${buildId}">\n</head>`),models=modelFiles(root);
 const headers='/\n  Cache-Control: no-cache\n/index.html\n  Cache-Control: no-cache\n/release.json\n  Cache-Control: no-store\n/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n';
 const files=[{filename:'_headers',data:Buffer.from(headers)},{filename:'index.html',data:Buffer.from(document)},...web.files,...models.map(f=>({filename:f.filename,data:fs.readFileSync(f.source)})),...sceneFiles(root),...fs.readdirSync(path.join(root,'docs/licenses')).filter(f=>f.endsWith('.txt')).map(f=>({filename:'licenses/'+f,data:fs.readFileSync(path.join(root,'docs/licenses',f))}))]; /* 사이트판은 본문(라이선스 템플릿)을 버리므로 고지 전문을 파일로 올린다(크레딧의 전문 링크) */
 for(const f of files)if(f.data.length>MAX_ASSET_BYTES)throw Error(`Cloudflare 파일 한도 초과: ${f.filename} (${f.data.length})`);
 const release={build:buildId,rendering:'3d',lazy3d:web.lazy3d,eager:web.eager,models:models.map(({key,filename,bytes})=>({key,path:filename,bytes})),files:files.map(f=>({path:f.filename,bytes:f.data.length}))};files.push({filename:'release.json',data:Buffer.from(JSON.stringify(release,null,2)+'\n')});
 try{fs.mkdirSync(staging,{recursive:true});for(const f of files){const target=path.join(staging,f.filename);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,f.data);}fs.rmSync(out,{recursive:true,force:true});fs.renameSync(staging,out);}finally{fs.rmSync(staging,{recursive:true,force:true});}
 return {out,release};
}
module.exports={buildSite,MAX_ASSET_BYTES};
if(require.main===module){try{const {release}=buildSite();console.log(`Cloudflare 배포 생성: ${release.build}; HTML ${release.files.find(f=>f.path==='index.html').bytes} bytes; 최대 ${Math.max(...release.files.map(f=>f.bytes))} bytes; 모든 파일 25 MiB 이하`);}catch(e){console.error(e);process.exitCode=1;}}
