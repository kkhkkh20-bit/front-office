/* 얼굴 재사용 쉬는 기간(77_assets_ui.js F6CD·f6Gone·face6Idx) 규칙 점검: 한 구단에서 30시즌 동안 해마다 은퇴·새 선수를 돌려
   - 은퇴(또는 KBO를 떠난) 선수의 얼굴이 같은 구단 새 선수에게 20시즌 안에 다시 가지 않는다
   - 선수 출신 지도자가 쓰는 얼굴(G.f6s)은 잡아 둔다 · 같은 구단 현역끼리 얼굴이 겹치지 않는다
   - 칸이 모자라면(해마다 많이 은퇴) 멈추지 않고 가장 오래 쉰 칸부터 쓴다
   - 예전 저장(쉬는 기록 없이 주인이 사라진 칸)은 지금 배정을 바꾸지 않고 그해부터 쉰다
   구단별 여유(현역+쉬는 칸 / 후보 수)를 출력한다. 사용: node tools/check-face-cooldown.cjs */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{const {hn}=await import(path.join(__dirname,'../src/core/math.mjs'));
const R=f=>fs.readFileSync(path.join(__dirname,'../src/ui/assets',f),'utf8').replace(/"data:image\/[^"]*"/g,'"x"'),ui=R('77_assets_ui.js');
const src=R('00d_faces_data.js')+'\n'+R('00h_more_faces2_data.js')+'\n'+R('00j_faces_v18_data.js')+'\n'+ui.slice(ui.indexOf('function face6Pool('),ui.indexOf('function face6Cut('))+'\n;({FACE6,face6Pool,face6Idx,f6Gone,F6CD,F6OB})';
const world=()=>{const G={year:2026,day:0,f6:{},f6r:{},f6s:{},f6v:3,players:{}};const F=new Function('G','hn','return eval(arguments[2])')(G,hn,src);return {G,F};};
const domPool=world().F.face6Pool({}).length,forPool=world().F.face6Pool({foreign:'용병'}).length;
/* 한 구단(0) 시뮬: 해마다 out명 은퇴(나이 많은 순), 같은 수의 신인. 다른 구단(1)도 같이 돌려 리그 전체 사용을 섞는다 */
function sim(out,years,opt={}){const {G,F}=world();let id=1,fallback=0,maxUse=0;const freed={},claimed=new Map();const mk=(t,age,foreign)=>{const p={id:id++,team:t,age,foreign:foreign||null};G.players[p.id]=p;return p;};
 for(const t of [0,1])for(let k=0;k<(opt.n||62);k++)mk(t,19+k%19);for(const t of [0,1])for(let k=0;k<(opt.foreign||0);k++)mk(t,24+k,'용병');
 for(const p of Object.values(G.players))F.face6Idx(p);
 for(let y=0;y<years;y++){G.year++;for(const p of Object.values(G.players))p.age++;for(const [k,u] of claimed){if(u>=G.year)G.f6sY[k]=G.year;else if(!G.f6s[k]){claimed.delete(k);freed[k]=Math.max(freed[k]||0,u+F.F6OB+1);}} /* 일하는 동안은 해마다 화면에 나온다. 떠난 지 F6OB시즌 뒤부터 쉰다 */
  for(const t of [0,1])for(const fo of [false,true]){const n=fo?(opt.fout||0):out;const L=Object.values(G.players).filter(p=>p.team===t&&!!p.foreign===fo).sort((a,b)=>b.age-a.age||a.id-b.id).slice(0,n);
   for(const p of L){const k=t+':'+G.f6[p.id];if(t===0)freed[k]=G.year;F.f6Gone(p.id);delete G.players[p.id];
    if(opt.ob&&t===0&&p.id%5===0){G.f6s[k]='coach:ob'+p.id;(G.f6sY=G.f6sY||{})[k]=G.year;claimed.set(k,G.year+8);} /* 선수 출신 지도자로 남아 8시즌 일한다(그동안 화면에 나옴) */}
   for(let k=0;k<n;k++){const p=mk(t,fo?25:19+k%4,fo?'용병':null);const i=F.face6Idx(p);assert.notEqual(i,null,'얼굴 배정 실패');const key=t+':'+i;
    if(t===0){if(claimed.has(key)&&claimed.get(key)+F.F6OB>=G.year)assert.fail('선수 출신 지도자 얼굴을 새 선수에게 줌 '+key);if(freed[key]!=null&&G.year-freed[key]<F.F6CD)fallback++;}}}
  const act=Object.values(G.players).filter(p=>p.team===0);const ks=act.map(p=>G.f6[p.id]);assert.equal(new Set(ks).size,ks.length,'같은 구단 현역끼리 같은 얼굴 '+G.year);
  const cool=Object.entries(G.f6cd||{}).filter(([k,v])=>k.startsWith('0:')&&G.year-v<F.F6CD).length;maxUse=Math.max(maxUse,act.length+cool+claimed.size);}
 const cool=Object.entries(G.f6cd||{}).filter(([k,v])=>k.startsWith('0:')&&G.year-v<F.F6CD).length;
 return {fallback,maxUse,act:Object.values(G.players).filter(p=>p.team===0).length,cool,claimed:claimed.size,cdKeys:Object.keys(G.f6cd||{}).length};}
/* 1) 실제 시뮬 수준(구단 국내 현역 80명, 해마다 5명 은퇴·이탈, 그중 일부는 지도자로 남음): 20시즌 안 재사용 없음.
   참고: tools/check-sim.js 2026~2027 기록에서 구단마다 dropP로 떠난 국내 선수는 한 해 1~6명, 국내 등록 인원은 52~83명 */
const d=sim(5,30,{ob:true,n:80});assert.equal(d.fallback,0,'국내 보통 은퇴에서 20시즌 안 재사용 '+d.fallback);assert.ok(d.maxUse<=domPool,'국내 후보 부족');
console.log(`국내(현역 80·해마다 5명): 후보 ${domPool}칸 · 최대 사용(현역+쉬는+지도자) ${d.maxUse} · 여유 ${domPool-d.maxUse}칸 · 20시즌 안 재사용 0`);
/* 많이 떠나는 구단(해마다 9명): 여유를 넘으면 가장 오래 쉰 칸부터(재사용 횟수만 보고) */
const a=sim(9,30,{ob:true,n:80});console.log(`국내(현역 80·해마다 9명): 최대 필요 ${a.maxUse}/${domPool}칸 · 20시즌 안 재사용 ${a.fallback}회(가장 오래 쉰 칸부터)`);
/* 2) 칸이 모자람(해마다 30명 은퇴): 멈추지 않고 가장 오래 쉰 칸부터 */
const b=sim(30,30);assert.ok(b.fallback>0,'칸이 모자란데 재사용이 없음(시험 조건 확인)');console.log(`빡빡함(해마다 30명): 재사용 ${b.fallback}회, 멈춤 없음`);
/* 3) 외국인: 해마다 3명 떠남 */
const c=sim(0,30,{foreign:3,fout:3});console.log(`외국인(해마다 3명): 후보 ${forPool}칸 · 쉬는 기간 안 재사용 ${c.fallback}회`);
/* 가장 오래 쉰 칸부터: 모두 쉬는 중이면 떠난 해가 가장 이른 칸 */
{const {G,F}=world();const pool=F.face6Pool({});G.year=2040;G.f6cd={};pool.forEach((i,n)=>{G.f6cd['0:'+i]=2030+(n%9);});const old=pool.filter((i,n)=>n%9===0);const p={id:1,team:0,age:22};G.players[1]=p;const i=F.face6Idx(p);assert.ok(old.includes(i),'가장 오래 쉰 칸이 아님 '+i);assert.equal(G.f6cd['0:'+i],undefined,'다시 쓰는 칸의 쉬는 기록이 남음');}
/* 4) 예전 저장: 쉬는 기록이 없고 주인이 사라진 칸 → 지금 배정 그대로, 그 칸은 그해부터 쉰다 */
{const {G,F}=world();for(let k=1;k<=60;k++){G.players[k]={id:k,team:0,age:20+k%15};F.face6Idx(G.players[k]);}const before={...G.f6};const gone=[1,2,3,4,5].map(k=>G.f6[k]);for(const k of [1,2,3,4,5])delete G.players[k];delete G.f6cd;
 G.year=2030;for(let k=61;k<=100;k++){G.players[k]={id:k,team:0,age:20+k%4};const i=F.face6Idx(G.players[k]);assert.ok(!gone.includes(i),'예전 저장: 떠난 선수 얼굴을 바로 다시 줌');}
 for(let k=6;k<=60;k++)assert.equal(G.f6[k],before[k],'예전 저장: 지금 선수 얼굴이 바뀜');assert.ok(gone.every(i=>G.f6cd['0:'+i]===2030),'예전 저장: 떠난 칸을 그해부터 쉬게 적지 않음');}
console.log('얼굴 쉬는 기간 점검 통과');})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
