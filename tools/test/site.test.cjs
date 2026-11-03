const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {buildSite,MAX_ASSET_BYTES}=require('../build-site.cjs');
const root=path.resolve(__dirname,'../..');
test('Cloudflare 배포 파일은 25 MiB 이하이고 버전별 모델·라이선스·새로고침 정책을 포함한다',()=>{
 const before=fs.readFileSync(path.join(root,'index.html'));const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'front-office-site-'));try{const {release}=buildSite({root,out:path.join(tmp,'site')}),html=fs.readFileSync(path.join(tmp,'site/index.html'),'utf8');
  assert.deepEqual(fs.readFileSync(path.join(root,'index.html')),before,'사이트 빌드는 단독 다운로드 파일을 바꾸지 않는다');
  for(const f of release.files)assert.ok(fs.statSync(path.join(tmp,'site',f.path)).size<=MAX_ASSET_BYTES,f.path);
  assert.ok(Buffer.byteLength(html)<10*1024*1024,'HTML에 모델 원본을 다시 포함하지 않는다');assert.equal(release.models.length,5);assert.ok(html.includes(`name="fronttime-build" content="${release.build}"`));
  for(const m of release.models){assert.match(m.path,/\.[a-f0-9]{12}\.glb$/);assert.ok(html.includes('./'+m.path));assert.equal(fs.statSync(path.join(tmp,'site',m.path)).size,m.bytes);}
  assert.ok(fs.readFileSync(path.join(tmp,'site/_headers'),'utf8').includes('Cache-Control: no-cache'));assert.ok(fs.existsSync(path.join(tmp,'site/licenses/match3d.txt')));
  const config=fs.readFileSync(path.join(root,'wrangler.jsonc'),'utf8');assert.match(config,/"build"\s*:/);assert.match(config,/node tools\/build-site\.cjs/,'실제 배포 도구가 사이트 빌드를 실행한다');assert.match(config,/"directory":\s*"\.\/site"/);
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
