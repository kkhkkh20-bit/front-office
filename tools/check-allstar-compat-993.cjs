/* 기존 관련 회귀만 선택한다. 시나리오 본문과 단정은 check-logic.js를 그대로 실행한다. */
const fs=require('node:fs'),path=require('node:path');
const file=path.join(__dirname,'check-logic.js'),source=fs.readFileSync(file,'utf8');
const begin=source.indexOf('/* REVIEW_993_1006_BEGIN */'),end=source.indexOf('/* REVIEW_993_1006_END */',begin);
if(begin<0||end<=begin)throw new Error('외국인·올스타 회귀 시나리오 범위를 찾지 못했습니다.');
const selectedNames=new Set([...(source.slice(0,begin)+source.slice(end)).matchAll(/\bT\('([^']+)'/g)].map(x=>x[1]).filter(x=>x.includes('올스타')||x.includes('시상 레이스')||x.startsWith('[공통 점검] 부상 대체:')||x.startsWith('[검수 11-17 #228]')||x.startsWith('[검수 11-17 #230]')||[229,231,232,233,234,235,236].some(n=>x.startsWith('[검수 11-17 #'+n+']'))||x.startsWith('[공통 점검] 부상 대체 외국인 정식 전환 직후')));
const registration='const T=(name,fn)=>results.push({name,fn});';
if(!selectedNames.size||!source.includes(registration))throw new Error('규칙 점검의 시나리오 등록 형식을 확인해 주세요.');
const scoped=source.replace(registration,'const T=(name,fn)=>{ if(selectedNames.has(name))results.push({name,fn}); };');
console.log('기존 외국인·시상 호환: '+selectedNames.size+'개 시나리오 선택');
new Function('require','__dirname','process','selectedNames',scoped)(require,__dirname,process,selectedNames);
