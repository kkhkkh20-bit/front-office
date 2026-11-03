/* 생성한 관중석 원화를 단일 HTML 배포에 넣는다. 픽셀 편집 없이 WebP를 포함한다. */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets/match/grandstand.webp'));
const output='/* 자동 생성: node tools/embed-match-stand.cjs · 프로젝트 전용 관중석 원화 */\nconst MATCH_STADIUM_IMAGE='+JSON.stringify('data:image/webp;base64,'+source.toString('base64'))+';\n';
fs.writeFileSync(path.join(root,'src/ui/assets/00c_match_stadium_data.js'),output);
console.log('관중석 이미지 포함: '+source.length+' bytes');
