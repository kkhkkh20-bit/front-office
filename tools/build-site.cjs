/* Cloudflare Workers has a 25 MiB per-asset limit. Keep downloadable HTML self-contained,
 * but publish same-origin, versioned GLBs for the website; fetch only on opening a match. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {splitWebsite}=require('./lib/site-runtime.cjs');
const {build}=require('./build.cjs'),{modelFiles,audioFiles}=require('./match3d-assets.cjs');
const MAX_ASSET_BYTES=25*1024*1024;
/* v14 장면 사진(응원 무대·행사·스카우트 출장): HTML에 넣지 않고 같은 경로로 따로 올린다. 화면은 받아지면 그리고 못 받으면 생략(77_assets_ui.js sceneImg) */
function sceneFiles(root){ const M=JSON.parse(fs.readFileSync(path.join(root,'assets/v14/scene_manifest.json'),'utf8')); return [...M.scenes.map(x=>({filename:'assets/v14/'+x.file.path,data:fs.readFileSync(path.join(root,'assets/v14',x.file.path))})),...champFiles(root),...v13Faces(root),...v18Faces(root),...v19People(root),...v23Faces(root),...operationsPhotos(root)]; }
/* v13 선수 얼굴 60명 256px 시트(구단 ID.webp, 납품 f6bce76 무손실본을 WebP q85로 줄임). 앱 HTML에는 128px만 넣고 사이트에서만 받는다(77_assets_ui.js faceSheets) */
function v13Faces(root){ const b='assets/v13/face256/'; return fs.readdirSync(path.join(root,b)).filter(f=>f.endsWith('.webp')).map(f=>({filename:b+f,data:fs.readFileSync(path.join(root,b,f))})); }
/* v18 선수 얼굴 200명 시트(구단 홈 유니폼 A·B × 128·256·384, v18b 납품 그대로 60장). 앱 HTML에는 넣지 않고(00j_faces_v18_data.js는 번호표만) 같은 경로로 받는다(77_assets_ui.js faceSheets).
   manifest의 sheets 목록이 기준이다: 미리보기·검수 자료는 저장소에 들이지 않았다. 384는 선수 상세를 열 때 그 구단·시트 한 장만 받는다 */
function v18Faces(root){ const M=JSON.parse(fs.readFileSync(path.join(root,'assets/v18/production200/manifest.json'),'utf8')); const L=M.sheets.map(x=>({filename:x.path,data:fs.readFileSync(path.join(root,x.path))}));
 for(const cs of [128,256,384])if(L.filter(f=>f.filename.includes('/'+cs+'/')).length!==20)throw Error('v18 '+cs+' 시트가 20장이 아님'); return L; }
/* v19 비서 20명 시트(128·256 두 장, 납품 그대로). 앱 HTML에는 넣지 않고(00k_people_v19_data.js는 번호표만) 같은 경로로 받는다(77_assets_ui.js faceSheets). manifest의 runtime_files가 기준 */
function v19People(root){ const b='assets/v19/secretary20/', M=JSON.parse(fs.readFileSync(path.join(root,b,'manifest.json'),'utf8')); return M.runtime_files.map(p=>({filename:b+p,data:fs.readFileSync(path.join(root,b,p))})); }
/* 신생 구단 전용 유니폼 얼굴(v23b = v23에서 엠블럼만 교체. 11·12구단, 시트 20장 중 HTML에 넣지 않은 14장: 256px 전부·v18 128px). 00l_faces_v23_data.js의 h(시트별 해시)가 목록이다.
   manifest runtime_files 밖(미리보기·검수·체크포인트)은 저장소에 들이지 않았다. HTML에 넣은 128px(v6c·v13·staff)은 올리지 않는다 */
function v23Faces(root){ const F=fs.readFileSync(path.join(root,'src/ui/assets/00l_faces_v23_data.js'),'utf8'), i=F.indexOf('const FACE23=')+13, J=JSON.parse(F.slice(i,F.indexOf(';\n',i))), b=J.base; if(!/^assets\/v23b?\/expansion_kits\/sheets\/$/.test(b))throw Error('신생 구단 시트 경로가 이상함: '+b); /* 게임이 받는 판(FACE23.base, 지금은 v23b)만 올린다 */
 const L=Object.keys(J.h).map(k=>{ const p=b+k+'.webp'; return {filename:p,data:fs.readFileSync(path.join(root,p))}; }); if(L.length!==14)throw Error('v23 파일 시트가 14장이 아님: '+L.length); return L; }
/* v16 우승 장면·배너·256px 트로피(52_champion.js champPic, 77_assets_ui.js tro16). 1024 트로피·투명 PNG·검수 자료는 올리지 않는다 */
function champFiles(root){ const b='assets/v16/champ/', M=JSON.parse(fs.readFileSync(path.join(root,b,'manifest.json'),'utf8'));
 const L=[...M.assets.filter(x=>x.group!=='trophy').map(x=>x.file.path),...['series','season','ring'].map(k=>`trophy/app/trophy_${k}_256.webp`)];
 return L.map(p=>({filename:b+p,data:fs.readFileSync(path.join(root,b,p))})); }
/* 운영·육성 사진만 배포한다. 시안·문서·검수 자료는 런타임에 포함하지 않는다. */
function operationsPhotos(root){ const base='assets/design-review/2026-11-10/', m=JSON.parse(fs.readFileSync(path.join(root,base,'manifest.json'),'utf8'));
 return m.assets.flatMap(a=>Object.values(a.variants).map(v=>({filename:base+v.path,data:fs.readFileSync(path.join(root,base,v.path))}))); }
/* 제보용 정보에 실을 커밋(검수 11-17 #19): Workers Builds·GitHub Actions가 주는 값, 없으면 로컬 git. 못 찾으면 비운다 */
function buildCommit(root){ const e=process.env, v=e.WORKERS_CI_COMMIT_SHA||e.CF_PAGES_COMMIT_SHA||e.GITHUB_SHA; if(v&&/^[0-9a-f]{7,40}$/i.test(v))return v.slice(0,12).toLowerCase();
 try{ const r=require('node:child_process').execFileSync('git',['rev-parse','--short=12','HEAD'],{cwd:root,stdio:['ignore','pipe','ignore']}).toString().trim(); return /^[0-9a-f]{7,40}$/.test(r)?r:''; }catch(x){ return ''; } }
/* 홈 화면에 추가(카페 부올 11-19 '모바일 크롬 주소창'): 웹 앱 매니페스트와 아이콘은 사이트판에만 올린다(내려받는 index.html은 파일 하나 그대로).
   display:standalone이라 홈 화면 아이콘으로 열면 브라우저 주소창 없이 뜬다. 서비스 워커는 두지 않는다. 아이콘은 tools/make-app-icons.py로 만든 assets/app/*.png */
const APP_BG='#0d1217'; /* src/css/foundation/00_layout_shell.css --bg */
function appManifest(){ return {name:'프런트야구',short_name:'프런트야구',description:'KBO 단장이 되어 구단을 운영하는 야구 게임',lang:'ko',dir:'ltr',start_url:'./',scope:'./',display:'standalone',orientation:'any',background_color:APP_BG,theme_color:APP_BG,
  icons:[192,512].map(n=>({src:`icons/icon-${n}.png`,sizes:`${n}x${n}`,type:'image/png',purpose:'any'}))}; }
function appFiles(root){ return [{filename:'manifest.webmanifest',data:Buffer.from(JSON.stringify(appManifest(),null,1)+'\n')},...[192,512].map(n=>({filename:`icons/icon-${n}.png`,data:fs.readFileSync(path.join(root,`assets/app/icon-${n}.png`))}))]; }
function buildSite({root=path.resolve(__dirname,'..'),out=path.join(root,'site')}={}){
 const {html}=build({root,write:false,embedded3d:false}),web=splitWebsite(html);const buildId=crypto.createHash('sha256').update(web.document).digest('hex').slice(0,16),staging=out+'.tmp-'+process.pid;
 commit=buildCommit(root),document=web.document.replace('</head>',`<link rel="manifest" href="./manifest.webmanifest">\n<meta name="fronttime-build" content="${buildId}">\n${commit?`<meta name="fronttime-commit" content="${commit}">\n`:''}</head>`),models=modelFiles(root);
 const headers='/\n  Cache-Control: no-cache\n/index.html\n  Cache-Control: no-cache\n/release.json\n  Cache-Control: no-store\n/manifest.webmanifest\n  Content-Type: application/manifest+json; charset=utf-8\n  Cache-Control: no-cache\n/icons/*\n  Cache-Control: public, max-age=86400\n/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n';
 const files=[{filename:'_headers',data:Buffer.from(headers)},{filename:'index.html',data:Buffer.from(document)},...appFiles(root),...web.files,...models.map(f=>({filename:f.filename,data:fs.readFileSync(f.source)})),...audioFiles(root).map(f=>({filename:f.filename,data:fs.readFileSync(f.source)})),...sceneFiles(root),...fs.readdirSync(path.join(root,'docs/licenses')).filter(f=>f.endsWith('.txt')).map(f=>({filename:'licenses/'+f,data:fs.readFileSync(path.join(root,'docs/licenses',f))}))]; /* 사이트판은 본문(라이선스 템플릿)을 버리므로 고지 전문을 파일로 올린다(크레딧의 전문 링크) */
 for(const f of files)if(f.data.length>MAX_ASSET_BYTES)throw Error(`Cloudflare 파일 한도 초과: ${f.filename} (${f.data.length})`);
 const release={build:buildId,...(commit?{commit}:{}),rendering:'3d',lazy3d:web.lazy3d,eager:web.eager,models:models.map(({key,filename,bytes})=>({key,path:filename,bytes})),files:files.map(f=>({path:f.filename,bytes:f.data.length}))};files.push({filename:'release.json',data:Buffer.from(JSON.stringify(release,null,2)+'\n')});
 try{fs.mkdirSync(staging,{recursive:true});for(const f of files){const target=path.join(staging,f.filename);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,f.data);}fs.rmSync(out,{recursive:true,force:true});fs.renameSync(staging,out);}finally{fs.rmSync(staging,{recursive:true,force:true});}
 return {out,release};
}
module.exports={appManifest,buildSite,MAX_ASSET_BYTES};
if(require.main===module){try{const {release}=buildSite();console.log(`Cloudflare 배포 생성: ${release.build}; HTML ${release.files.find(f=>f.path==='index.html').bytes} bytes; 최대 ${Math.max(...release.files.map(f=>f.bytes))} bytes; 모든 파일 25 MiB 이하`);}catch(e){console.error(e);process.exitCode=1;}}
