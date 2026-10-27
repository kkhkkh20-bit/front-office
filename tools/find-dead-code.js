// 쓰이지 않는 최상위 함수·상수를 찾아(옵션: 지운다). 자기 자신 안에서만 부르는 경우는 안 쓰는 것으로 본다.
const fs=require('fs'), path=require('path'), acorn=require('acorn'), walk=require('acorn-walk');
const R=require('path').join(__dirname,'..','src')+'/';
const ls=d=>fs.readdirSync(R+d).filter(f=>f.endsWith('.js')).sort().map(f=>R+d+'/'+f);
const groups=[ls('engine'), [R+'gfx/kart.js',R+'gfx/campus.js',R+'gfx/rig.js',...ls('ui')]];
const KEEP=new Set((process.env.KEEP||'').split(',').filter(Boolean));
const apply=process.argv.includes('--apply');
function load(){ return groups.map(fl=>{ let off=0, text=''; const map=[]; for(const f of fl){ const t=fs.readFileSync(f,'utf8'); map.push({f,s:off,e:off+t.length}); text+=t; off+=t.length; } return {text,map,ast:acorn.parse(text,{ecmaVersion:'latest',sourceType:'script',ranges:true})}; }); }
function analyze(G){ const decls=[]; const refs=[];
  G.forEach((g,gi)=>{ for(const n of g.ast.body){ if(n.type==='FunctionDeclaration')decls.push({name:n.id.name,gi,s:n.start,e:n.end,idS:n.id.start});
      else if(n.type==='VariableDeclaration'&&n.declarations.length===1&&n.declarations[0].id.type==='Identifier')decls.push({name:n.declarations[0].id.name,gi,s:n.start,e:n.end,idS:n.declarations[0].id.start}); }
    walk.fullAncestor(g.ast,(node,anc)=>{ if(node.type!=='Identifier')return; const p=anc[anc.length-2];
      if(p&&p.type==='MemberExpression'&&p.property===node&&!p.computed)return; if(p&&(p.type==='Property'||p.type==='MethodDefinition')&&p.key===node&&!p.computed&&!p.shorthand)return;
      refs.push({name:node.name,gi,pos:node.start}); }); });
  return {decls,refs}; }
let G=load(); let removed=[];
for(let round=0;round<6;round++){ const {decls,refs}=analyze(G); const byName={}; for(const r of refs)(byName[r.name]=byName[r.name]||[]).push(r);
  const dead=decls.filter(d=>!KEEP.has(d.name)&&!(byName[d.name]||[]).some(r=>r.pos!==d.idS&&!(r.gi===d.gi&&r.pos>=d.s&&r.pos<d.e)));
  if(!dead.length)break;
  // 같은 이름이 여러 번 선언된 경우는 사람이 본다
  const cnt={}; decls.forEach(d=>cnt[d.name]=(cnt[d.name]||0)+1);
  const del=dead.filter(d=>cnt[d.name]===1);
  for(const d of del){ const g=G[d.gi]; const m=g.map.find(x=>d.s>=x.s&&d.s<x.e); removed.push(`${path.relative(R,m.f)}: ${d.name}`); }
  if(!apply){ console.log(removed.join('\n')); console.log('dup:',Object.keys(cnt).filter(k=>cnt[k]>1).join(',')); return; }
  // 파일별로 뒤에서부터 지운다(뒤따르는 줄바꿈 하나 포함)
  for(const g of G){ for(const fm of g.map){ let t=fs.readFileSync(fm.f,'utf8'); const ds=del.filter(d=>G[d.gi]===g&&d.s>=fm.s&&d.s<fm.e).sort((a,b)=>b.s-a.s);
      for(const d of ds){ let s=d.s-fm.s, e=d.e-fm.s; if(t[e]==='\n')e++; /* 바로 위 한 줄 주석도 함께 */ const ls=t.lastIndexOf('\n',s-2)+1; const prev=t.slice(ls,s); if(/^\/\*[^\n]*\*\/\s*$/.test(prev)||/^\/\/[^\n]*\n?$/.test(prev))s=ls; t=t.slice(0,s)+t.slice(e); }
      if(ds.length)fs.writeFileSync(fm.f,t); } }
  G=load(); }
console.log(removed.join('\n')); console.log('removed',removed.length);
