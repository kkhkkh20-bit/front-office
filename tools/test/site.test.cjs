const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {buildSite,MAX_ASSET_BYTES}=require('../build-site.cjs');
const root=path.resolve(__dirname,'../..');
test('Cloudflare 배포 파일은 25 MiB 이하이고 버전별 모델·라이선스·새로고침 정책을 포함한다',()=>{
 const before=fs.readFileSync(path.join(root,'index.html'));const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'front-office-site-'));try{const {release}=buildSite({root,out:path.join(tmp,'site')}),html=fs.readFileSync(path.join(tmp,'site/index.html'),'utf8');
  assert.deepEqual(fs.readFileSync(path.join(root,'index.html')),before,'사이트 빌드는 단독 다운로드 파일을 바꾸지 않는다');
  for(const f of release.files)assert.ok(fs.statSync(path.join(tmp,'site',f.path)).size<=MAX_ASSET_BYTES,f.path);
  assert.ok(Buffer.byteLength(html)<10*1024*1024,'HTML에 모델 원본을 다시 포함하지 않는다');assert.ok(Buffer.byteLength(html)<12000,'첫 문서는 가벼운 로딩 화면만 포함');assert.ok(!/<script[^>]+src=[^>]+match3d/.test(html),'3D 스크립트는 첫 접속에 받지 않음');assert.ok(release.eager.every(f=>fs.existsSync(path.join(tmp,'site',f))));assert.ok(fs.readFileSync(path.join(tmp,'site',release.eager.find(f=>/faces\./.test(f))),'utf8').includes('ZenGM'),'얼굴 출처 표기 유지');assert.ok(fs.readFileSync(path.join(tmp,'site',release.eager.find(f=>/lz\./.test(f))),'utf8').includes('pieroxy'),'압축 라이브러리 출처 유지');assert.equal(release.models.length,5);assert.ok(html.includes(`name="fronttime-build" content="${release.build}"`));
  for(const m of release.models){assert.match(m.path,/\.[a-f0-9]{12}\.glb$/);assert.ok(fs.readFileSync(path.join(tmp,'site',release.lazy3d),'utf8').includes('./'+m.path));assert.equal(fs.statSync(path.join(tmp,'site',m.path)).size,m.bytes);}
  assert.ok(fs.readFileSync(path.join(tmp,'site/_headers'),'utf8').includes('Cache-Control: no-cache'));assert.ok(fs.existsSync(path.join(tmp,'site/licenses/match3d.txt')));
  const cssFile=release.files.find(f=>f.path.endsWith('.css')).path,css=fs.readFileSync(path.join(tmp,'site',cssFile),'utf8');
  const images=[...css.matchAll(/url\(["']?([^)'"\s]+)["']?\)/g)].map(m=>m[1]).filter(url=>url.includes('images/'));
  assert.ok(images.length>0,'웹 CSS의 실제 분리 이미지 검사');
  for(const image of images){const resolved=path.resolve(tmp,'site',path.dirname(cssFile),image);assert.ok(fs.existsSync(resolved),cssFile+'의 이미지 경로 '+image);}
  const config=fs.readFileSync(path.join(root,'wrangler.jsonc'),'utf8');assert.match(config,/"build"\s*:/);assert.match(config,/node tools\/build-site\.cjs/,'실제 배포 도구가 사이트 빌드를 실행한다');assert.match(config,/"directory":\s*"\.\/site"/);
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
