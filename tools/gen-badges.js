/* 구단 배지 데이터 만들기: assets/badges/v2(모자 심벌 그대로, 메인 레터링 새로: 마크 64·128, 큰 로고 crest 256)를 data URI로 바꿔 src/ui/assets/00a_badges_data.js에 넣는다.
   teams.json의 name(예: "서울 코메츠")을 엔진 TEAM_DEF의 원래 '연고지 별칭'과 맞춰 실제 구단 ID에 연결한다(JSON 배열 순서는 쓰지 않음).
   사용: node tools/gen-badges.js  (이미지·teams.json을 바꿨을 때만 다시 실행) */
const fs=require('fs'), path=require('path'), crypto=require('crypto');
const root=path.join(__dirname,'..'), dir=path.join(root,'assets','badges','v2');
const {sourceFile}=require('./lib/sources.cjs');
const src=fs.readFileSync(sourceFile(root,'engine','01_rules.js'),'utf8'); const m=src.match(/const TEAM_DEF=(\[[\s\S]*?\]);/); if(!m)throw new Error('TEAM_DEF를 찾지 못함');
const TEAM_DEF=Function('return '+m[1])(); const J=JSON.parse(fs.readFileSync(path.join(dir,'teams.json'),'utf8'));
const sums=fs.existsSync(path.join(dir,'checksums.json'))?JSON.parse(fs.readFileSync(path.join(dir,'checksums.json'),'utf8')):null;
const out={}; const seen=new Set();
for(const t of J.teams){ const id=TEAM_DEF.findIndex(d=>d.city+' '+d.nick===t.name); if(id<0)throw new Error('게임 구단과 맞지 않는 이름: '+t.name); if(seen.has(id))throw new Error('같은 구단에 두 배지: '+t.name); seen.add(id);
  const uri=(kind,sz)=>{ const rel=t.assets[kind][sz]; const f=path.join(dir,rel); if(!fs.existsSync(f))throw new Error('이미지 없음: '+rel); const b=fs.readFileSync(f); const SF=sums&&(sums.files||sums), sum=SF&&SF[rel]; const h=crypto.createHash('sha256').update(b).digest('hex'); if(sum&&(typeof sum==='string'?sum:sum.sha256)!==h)throw new Error('체크섬 불일치(파일이 바뀜): '+rel); return 'data:image/png;base64,'+b.toString('base64'); };
  out[id]={k:t.key,n:t.name,s:uri('mark','64'),l:uri('mark','128'),c:uri('crest','256')}; }
if(seen.size!==TEAM_DEF.length)throw new Error('배지가 없는 구단: '+TEAM_DEF.map((d,i)=>seen.has(i)?null:d.city+' '+d.nick).filter(Boolean).join(', '));
const body='/* 자동 생성: node tools/gen-badges.js (손으로 고치지 않는다). 구단 배지 v2(assets/badges/v2, cap-locked-03). 키는 게임 구단 ID(TEAM_DEF 순서), s=마크 64px(32px 이하), l=마크 128px(33~63px), c=메인 로고 256px(64px 이상) */\nconst BADGE_IMG='+JSON.stringify(out)+';\n';
fs.writeFileSync(sourceFile(root,'ui','00a_badges_data.js'),body); console.log('배지 '+seen.size+'개: '+Object.entries(out).map(([i,x])=>i+'='+x.n).join(', ')+' · '+Math.round(body.length/1024)+'KB');
