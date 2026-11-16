/* UI 공통 패턴 점검(UI 3단계 3-8). 사용: node tools/check-ui-patterns.cjs
   1) 위험 버튼(.danger·위험 표시 data-a)은 결재창(GUARD)을 거친다. 예전부터 있던 '정말 …' 두 번 누르기 흐름만 아래 목록으로 허용하고, 새 위험 동작은 GUARD에 넣어야 통과한다.
   2) 빈 상태는 emptyState() 부품을 쓴다. '<p class="small muted">…없습니다' 한 줄 문구가 기준보다 늘면 실패. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
const root=path.resolve(__dirname,'..');
/* 두 번 누르기(되묻기) 흐름: 첫 버튼(…Ask)이 '정말 …' 버튼을 띄우고 그 버튼이 실행한다. 결재창으로 옮기기 전까지 이 목록만 허용 */
const TWO_STEP=new Set(['cfireAsk','fireCoach','relAsk','release','fireAsk','fireMgr','slotDel','resignGo']);
/* 위험 표시(빨간 테두리)는 있지만 결재창이 아직 없는 기존 동작: 협상 철회·외국인 명단 제외·매물 해제·저장 슬롯 덮어쓰기·코드 불러오기·해외 설정·포지션 전향. 결재창으로 옮기면 여기서 뺀다. 새 동작은 이 목록에 넣지 말고 GUARD에 넣는다 */
const LEGACY=new Set(['ngtWithdraw','fdrop','unoffer','slotOver','xfImp','ovsSet','posConv']);
const EMPTY_BASE=148; /* 2026-11-17 기준 */
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):e.name.endsWith('.js')?[path.join(d,e.name)]:[]);
(async()=>{
 const src=walk(path.join(root,'src/ui')).map(f=>fs.readFileSync(f,'utf8')).join('\n');
 const empty=(src.match(/small muted[^"]*">[^<]{0,80}없습니다/g)||[]).length;
 assert.ok(empty<=EMPTY_BASE,`빈 상태 한 줄 문구가 늘었습니다(${empty} > ${EMPTY_BASE}). emptyState(문구, 동작)를 쓰세요`);
 assert.ok(/function emptyState\(/.test(src)&&/function loadingState\(/.test(src),'빈 상태·불러오는 중 부품');
 const server=await startHtmlServer(path.join(root,'index.html'));let browser;
 try{browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});const p=await browser.newPage();await p.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));await p.goto(server.url);await p.waitForFunction(()=>typeof GUARD==='object');
  const r=await p.evaluate(()=>{const css=[...document.styleSheets].flatMap(s=>{try{return [...s.cssRules].map(r=>r.cssText)}catch(e){return []}}).join('\n');
   const lines=css.split('\n').filter(l=>/\.danger/.test(l));const acts=[...new Set(lines.flatMap(l=>[...l.matchAll(/\[data-a="?([a-zA-Z]+)"?\]/g)].map(m=>m[1])))];
   return {acts,guard:Object.keys(GUARD)};});
  const G=new Set(r.guard),miss=r.acts.filter(a=>!G.has(a)&&!TWO_STEP.has(a));
  assert.ok(r.acts.length>=5,'위험 버튼 목록을 찾지 못함');
  assert.deepEqual(miss,[],'결재창(GUARD)도 두 번 누르기도 없는 위험 동작');
  /* 소스에서 class에 danger가 붙은 버튼의 동작도 같은 규칙 */
  const srcDanger=[...new Set([...src.matchAll(/class="[^"]*\bdanger\b[^"]*"[^>]*?data-a="([a-zA-Z]+)"/g),...src.matchAll(/data-a="([a-zA-Z]+)"[^>]*?class="[^"]*\bdanger\b[^"]*"/g)].map(m=>m[1]))];
  const miss2=srcDanger.filter(a=>!G.has(a)&&!TWO_STEP.has(a)&&!LEGACY.has(a)&&!/Ask$/.test(a)&&!/^(closeSheet|ngtClose|cancel)/.test(a));
  assert.deepEqual(miss2,[],'class="danger" 버튼인데 결재창이 없는 동작');
  console.log(`UI 패턴 점검 통과: 위험 동작 ${r.acts.length+srcDanger.length}개(결재창 ${[...r.acts,...srcDanger].filter(a=>G.has(a)).length}, 두 번 누르기 ${[...r.acts,...srcDanger].filter(a=>TWO_STEP.has(a)||/Ask$/.test(a)).length}) · 빈 상태 한 줄 문구 ${empty}/${EMPTY_BASE}`);
 }finally{await browser?.close();await server.close();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
