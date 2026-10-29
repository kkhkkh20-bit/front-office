/* 정적 점검: 실행하지 않고 소스만 읽어서 찾는 오류
 1) 이름 충돌: 같은 최상위 함수·상수 이름이 두 번 이상 선언됨. 엔진과 화면 파일은 한 전역 공간을 쓰므로,
    나중 선언이 앞 선언을 조용히 덮어쓴다(예: originOf가 화면 쪽 같은 이름 함수에 덮여 '내가 꾸린 팀'이 0명으로 나왔던 일).
    일부러 덮어쓰는 경우는 tools/dup-allow.txt에 이름을 적는다.
    상수(const/let)가 두 스크립트에 걸쳐 같은 이름이면 두 번째 스크립트 전체가 실행되지 않으므로 오류.
 2) 초기화 전 사용: 파일 맨 위에서 바로 실행되는 코드가 뒤 번호 파일의 상수(const/let)를 쓰면 'before initialization' 오류.
    (예: 첫 화면이 TELE를 읽어 화면이 비었던 일, 앞 파일에서 Object.assign(A, …)를 부른 일)
 사용: node tools/check-static.js  (acorn, acorn-walk 필요: cd tools && npm i) */
const fs=require('fs'), path=require('path');
let acorn, walk; try{ acorn=require('acorn'); walk=require('acorn-walk'); }catch(e){ console.error('acorn이 없습니다. cd tools && npm i 를 먼저 실행하세요.'); process.exit(2); }
const ROOT=path.join(__dirname,'..');
const ls=d=>fs.readdirSync(path.join(ROOT,'src',d)).filter(f=>f.endsWith('.js')).sort().map(f=>path.join('src',d,f));
/* build.sh와 같은 순서: 엔진 스크립트 하나, 그림·화면 스크립트 하나 */
const GROUPS=[{name:'engine',files:ls('engine')},{name:'ui',files:['src/gfx/kart.js','src/gfx/campus.js','src/gfx/iso.js',...ls('ui')]}];
const allow=new Set((fs.existsSync(path.join(__dirname,'dup-allow.txt'))?fs.readFileSync(path.join(__dirname,'dup-allow.txt'),'utf8'):'').split(/\s+/).map(s=>s.trim()).filter(s=>s&&!s.startsWith('#')));
const errors=[], warns=[];
const decls=[]; /* {name, kind:'function'|'const'|'let'|'var'|'class', g, file, pos} */
const parsed=GROUPS.map((G,gi)=>{ let text='', map=[]; for(const f of G.files){ const t=fs.readFileSync(path.join(ROOT,f),'utf8'); map.push({f,s:text.length,e:text.length+t.length}); text+=t+'\n'; }
  let ast; try{ ast=acorn.parse(text,{ecmaVersion:'latest',sourceType:'script',allowHashBang:true}); }catch(e){ const m=map.find(x=>e.pos>=x.s&&e.pos<x.e); errors.push(`[문법] ${m?m.f:G.name}: ${e.message}`); return null; }
  const fileOf=pos=>{ const m=map.find(x=>pos>=x.s&&pos<x.e); return m?m.f:'?'; };
  for(const n of ast.body){
    if(n.type==='FunctionDeclaration')decls.push({name:n.id.name,kind:'function',g:gi,file:fileOf(n.start),pos:n.start});
    else if(n.type==='ClassDeclaration')decls.push({name:n.id.name,kind:'class',g:gi,file:fileOf(n.start),pos:n.start});
    else if(n.type==='VariableDeclaration')for(const d of n.declarations){ if(d.id.type==='Identifier')decls.push({name:d.id.name,kind:n.kind,g:gi,file:fileOf(n.start),pos:n.start}); } }
  return {ast,fileOf}; });
if(parsed.some(p=>!p)){ console.log(errors.join('\n')); process.exit(1); }
/* 1) 이름 충돌 */
const by={}; for(const d of decls)(by[d.name]=by[d.name]||[]).push(d);
for(const [name,L] of Object.entries(by)){ if(L.length<2)continue; const where=L.map(d=>`${d.file}(${d.kind})`).join(', ');
  const lex=L.filter(d=>d.kind!=='function'&&d.kind!=='var');
  if(lex.length&&L.length>1){ errors.push(`[이름 충돌·상수] ${name}: ${where} — 같은 이름의 상수가 있으면 뒤 스크립트가 통째로 실행되지 않거나 덮어쓰기가 됩니다`); continue; }
  if(!allow.has(name))errors.push(`[이름 충돌] ${name}: ${where} — 나중 선언이 앞을 덮어씁니다. 일부러라면 tools/dup-allow.txt에 추가`); }
/* 2) 초기화 전 사용: 맨 위 실행 코드(함수 선언 몸통·나중에 부르는 함수 몸통 제외)가 같은 스크립트의 뒤쪽 상수를 쓰는지 */
parsed.forEach((P,gi)=>{ const lexPos={}; for(const d of decls)if(d.g===gi&&(d.kind==='const'||d.kind==='let'||d.kind==='class'))lexPos[d.name]=d.pos;
  for(const n of P.ast.body){ if(n.type==='FunctionDeclaration')continue;
    const seen=new Set();
    walk.recursive(n,null,{ Function(){ /* 함수 몸통은 나중에 실행되므로 건너뜀 */ },
      Identifier(node){ const p=lexPos[node.name]; if(p!=null&&p>n.start&&!seen.has(node.name)){ seen.add(node.name); errors.push(`[초기화 전 사용] ${P.fileOf(n.start)}의 맨 위 코드가 ${node.name}(뒤 파일 ${P.fileOf(p)}의 상수)을 씁니다`); } } }); } });
/* 2-2) 맨 위에서 바로 부르는 함수가(그 함수가 부르는 함수까지) 뒤쪽 상수를 쓰는지: 첫 화면이 비었던 TELE 오류가 이 경우 */
parsed.forEach((P,gi)=>{ const lexPos={}, fnBody={}; for(const d of decls)if(d.g===gi&&(d.kind==='const'||d.kind==='let'||d.kind==='class'))lexPos[d.name]=d.pos;
  for(const n of P.ast.body)if(n.type==='FunctionDeclaration')fnBody[n.id.name]=n;
  const idsIn=node=>{ const S=new Set(); walk.full(node,x=>{ if(x.type==='Identifier')S.add(x.name); }); return S; };
  const cache={};
  const reach=name=>{ if(cache[name])return cache[name]; const out=new Set(); const q=[name]; const vis=new Set();
    while(q.length){ const f=q.shift(); if(vis.has(f)||!fnBody[f])continue; vis.add(f); for(const id of idsIn(fnBody[f].body)){ out.add(id); if(fnBody[id]&&!vis.has(id))q.push(id); } }
    return cache[name]=out; };
  for(const n of P.ast.body){ if(n.type==='FunctionDeclaration')continue; const calls=new Set();
    walk.recursive(n,null,{ Function(){}, CallExpression(node,st,c){ if(node.callee.type==='Identifier')calls.add(node.callee.name); c(node.callee,st); for(const a of node.arguments)c(a,st); } });
    const hit=new Set(); for(const f of calls)for(const id of reach(f)){ const p=lexPos[id]; if(p!=null&&p>n.start)hit.add(id); }
    if(hit.size)errors.push(`[초기화 전 사용 가능성] ${P.fileOf(n.start)}의 맨 위 코드가 부르는 함수(${[...calls].filter(f=>fnBody[f]).join(', ')})가 뒤 파일의 상수 ${[...hit].slice(0,6).join(', ')}${hit.size>6?' 외':''}를 씁니다. 부팅은 99_boot.js에서 하세요`); } });
/* 결과 */
const nDecl=decls.length;
if(warns.length)console.log(warns.join('\n'));
if(errors.length){ console.log(errors.join('\n')); console.log(`정적 점검: 오류 ${errors.length}건 (최상위 선언 ${nDecl}개)`); process.exit(1); }
console.log(`정적 점검: 문제 없음 (최상위 선언 ${nDecl}개)`);
