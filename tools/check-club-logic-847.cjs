/* 847~863 회귀만 선택한다. 시나리오 본문과 단정은 check-logic.js를 그대로 실행한다. */
const fs=require('node:fs'),path=require('node:path');
const file=path.join(__dirname,'check-logic.js'),source=fs.readFileSync(file,'utf8');
const begin=source.indexOf('/* REVIEW_847_863_BEGIN */'),end=source.indexOf('/* REVIEW_847_863_END */',begin);
if(begin<0||end<=begin)throw new Error('구단·구장 회귀 시나리오 범위를 찾지 못했습니다.');
const selectedNames=new Set([...source.slice(begin,end).matchAll(/\bT\('([^']+)'/g)].map(x=>x[1]));
const registration='const T=(name,fn)=>results.push({name,fn});';
if(!selectedNames.size||!source.includes(registration))throw new Error('규칙 점검의 시나리오 등록 형식을 확인해 주세요.');
const scoped=source.replace(registration,'const T=(name,fn)=>{ if(selectedNames.has(name))results.push({name,fn}); };');
console.log('검수 847~863: '+selectedNames.size+'개 시나리오 선택');
new Function('require','__dirname','process','selectedNames',scoped)(require,__dirname,process,selectedNames);
