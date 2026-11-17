/* ===== 이름·얼굴 꾸미기(구단주 결정 11-17: "선수편집기는 당연히 없어야하고 이름 얼굴등은 가능해야해. 나중에 대량으로 수정도 가능한 기능") =====
 - 바꿀 수 있는 것: 이름·얼굴 사진(이미 있는 템플릿 사진 번호 또는 직접 넣은 사진)·등번호. 능력·잠재력·나이·계약은 어떤 길로도 바꾸지 않는다(에디터 없음)
 - 대상: 세계의 모든 선수(다른 구단·외국인 후보·드래프트 대상·은퇴해 기록만 남은 선수 G.arch). 은퇴 선수는 이름만
 - 이름을 바꾸면 선수 객체와 함께, id로 이 선수를 가리키는 기록 조각(보관 기록·OB·영구결번·진기록 최고 기록 등 {id|pid|fid, name|nm})도 새 이름으로 바꾼다.
   이미 쓰인 기사·소식 문장은 그대로 둔다(그때의 이름). 화면 대부분은 p.name을 바로 읽어서 앞으로 나오는 기록·기사는 새 이름
 - 얼굴 번호의 뜻(어느 사진 묶음인지)은 화면 쪽(src/ui/players/72_cosmetic.js)이 안다. 여기는 이름과 가져오기·미리보기 틀만 둔다
 - 난수(R·Math.random)는 쓰지 않는다. 래더·대회 덱은 p.name을 그대로 담으므로 바꾼 이름이 실린다(능력은 그대로라 공정성 영향 없음) */
const COSM_NAME_MAX=12;
function cosmNameClean(v){ return String(v??'').replace(/[\u0000-\u001f\u007f<>&"'`\\,;]/g,'').replace(/\s+/g,' ').trim(); }
function cosmBadWord(nm){ try{ return typeof FrontOfficeCore!=='undefined'&&FrontOfficeCore.cupBadName?!!FrontOfficeCore.cupBadName(nm):false; }catch(e){ return false; } }
/* 이름 검사: 빈 이름·12자 초과·글자/숫자/공백/가운뎃점/마침표/하이픈 밖의 기호·금칙어(대회 팀명과 같은 표) */
function cosmNameErr(v){ const nm=cosmNameClean(v); if(!nm)return '이름을 입력하세요.'; if([...nm].length>COSM_NAME_MAX)return `이름은 ${COSM_NAME_MAX}자까지 쓸 수 있습니다.`;
  if(!/^[\p{L}\p{M}\p{N} .·\-]+$/u.test(nm))return '이름에는 글자·숫자·띄어쓰기·가운뎃점(·)·하이픈만 쓸 수 있습니다.'; if(!/\p{L}/u.test(nm))return '이름에 글자가 하나는 있어야 합니다.';
  if(cosmBadWord(nm))return '이름에 쓸 수 없는 말이 들어 있습니다.'; return ''; }
/* 이름을 바꿀 대상: 현역(G.players) 또는 리그를 떠나 기록만 남은 선수(G.arch) */
function cosmTarget(id){ if(id==null||id==='')return null; const p=G.players&&G.players[id]; if(p)return {o:p,arch:false}; const a=G.arch&&G.arch[id]; return a?{o:a,arch:true}:null; }
/* 기록 조각 이름 바꾸기: M = Map(문자열 id → {from,to}). {id|pid|fid}가 그 선수이고 이름이 옛 이름일 때만 바꾼다(같은 번호의 다른 사람은 이름이 달라 건드리지 않는다).
   은퇴 뒤 OB(G.ob, fid)로 남았으면 그 OB를 가리키는 지도자·학교 감독 기록({ob}·id 'c'+OB·'h'+OB)도 같이 */
function cosmSync(M){ if(!M||!M.size)return 0; let n=0;
  for(const o of G.ob||[]){ const m=o&&o.fid!=null&&M.get(String(o.fid)); if(m)for(const k of [o.id,'c'+o.id,'h'+o.id])if(!M.has(k))M.set(k,m); }
  const seen=new Set(), ID=['id','pid','fid','ob'];
  const fix=o=>{ for(const k of ID){ const v=o[k]; if(v==null||typeof v==='object')continue; const m=M.get(String(v)); if(!m)continue; if(o.name===m.from){ o.name=m.to; n++; } if(o.nm===m.from){ o.nm=m.to; n++; } } };
  const walk=(o,d)=>{ if(!o||typeof o!=='object'||d>14||seen.has(o))return; seen.add(o); if(Array.isArray(o)){ for(const x of o)if(x&&typeof x==='object')walk(x,d+1); return; } fix(o); for(const k in o){ const x=o[k]; if(x&&typeof x==='object')walk(x,d+1); } };
  for(const k in G){ if(k==='players'||k==='cimg'||k==='cimgO')continue; walk(G[k],0); }
  return n; }
/* 여러 명 이름 한꺼번에(한 번만 훑는다). L: [{id,name}] → {n, errs:[문장]} */
function cosmRenameMany(L){ const M=new Map(), errs=[]; let n=0;
  for(const x of L||[]){ const t=cosmTarget(x.id); if(!t){ errs.push(`${x.id}: 선수를 찾을 수 없습니다.`); continue; } const e=cosmNameErr(x.name); if(e){ errs.push(`${t.o.name}: ${e}`); continue; }
    const nm=cosmNameClean(x.name), o=t.o, old=o.name; if(nm===old)continue; o.name=nm; (o.renamed=o.renamed||[]).push({y:G.year,from:old}); if(o.renamed.length>5)o.renamed.shift(); n++;
    const k=String(o.id), m=M.get(k); M.set(k,{from:m?m.from:old,to:nm}); }
  if(M.size){ const M2=new Map(); for(const [k,v] of M)M2.set(k,v); cosmSync(M2); }
  return {n,errs}; }
/* 이름 고치기(선수 화면·일괄 화면 공용). 성공하면 '' */
function setPlayerName(id,v){ const t=cosmTarget(id); if(!t)return '선수를 찾을 수 없습니다.'; const e=cosmNameErr(v); if(e)return e; const r=cosmRenameMany([{id:t.o.id,name:v}]); return r.errs[0]||''; }

/* ----- 내보내기·가져오기(CSV/탭 텍스트): id, 구단, 현재 이름, 새 이름, 얼굴 번호 ----- */
const COSM_HEAD=['id','구단','현재 이름','새 이름','얼굴 번호'];
function cosmCell(s){ s=String(s??''); return /[",\n\r\t]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; }
/* rows: [{id, team(표시), name, face(번호 또는 '')}] → CSV 문자열(첫 줄 머리말). 새 이름 칸은 지금 이름으로 채워 둔다(고칠 칸만 바꾸면 된다) */
function cosmCsv(rows){ return [COSM_HEAD.join(','),...rows.map(r=>[r.id,r.team,r.name,r.name,r.face??''].map(cosmCell).join(','))].join('\n'); }
/* 한 줄 나누기: 쉼표 또는 탭(스프레드시트 복사), 큰따옴표 묶음 */
function cosmSplit(line){ const sep=(line.split('\t').length>line.split(',').length)?'\t':','; const out=[]; let cur='', q=false;
  for(let i=0;i<line.length;i++){ const c=line[i];
    if(q){ if(c!=='"')cur+=c; else if(line[i+1]==='"'){ cur+='"'; i++; } else q=false; }
    else if(c==='"'&&cur.trim()===''){ q=true; cur=''; } else if(c===sep){ out.push(cur); cur=''; } else cur+=c; }
  out.push(cur); return out.map(s=>s.trim()); }
/* 텍스트 → 줄 목록 [{line(1부터), id, name, face}]. 머리말 줄은 건너뛴다. 칸이 2개면 id,새 이름 · 3개면 id,새 이름,얼굴 번호 · 4개 이상이면 머리말 순서(id,구단,현재 이름,새 이름,얼굴 번호) */
function cosmParse(text){ const L=String(text??'').replace(/^﻿/,'').split(/\r?\n/), out=[];
  L.forEach((raw,i)=>{ if(!raw.trim()||/^\s*#/.test(raw))return; const c=cosmSplit(raw); if(i===0&&!/^\d+$/.test(c[0]||''))return; /* 머리말 */
    const r=c.length<=2?{id:c[0],name:c[1]??''}:c.length===3?{id:c[0],name:c[1],face:c[2]}:{id:c[0],name:c[3]??'',face:c[4]??'',cur:c[2]};
    out.push(Object.assign({line:i+1},r)); });
  return out; }
/* 미리보기: rows(cosmParse) → {chg:[{id,line,arch,from,to,faceFrom,faceTo}], bad:[{line,why}], same(바뀐 것 없는 줄 수)}.
   F(선택): 얼굴 검사 {cur(p)→번호|null, err(p,번호)→''|문장}. 없으면 얼굴 칸이 채워진 줄은 '얼굴을 확인할 수 없음' */
function cosmPreview(rows,F){ const chg=[], bad=[], seen=new Set(); let same=0;
  for(const r of rows||[]){ const sid=String(r.id??'').trim(); if(!/^\d+$/.test(sid)){ bad.push({line:r.line,why:`id '${sid}'가 숫자가 아닙니다.`}); continue; }
    if(seen.has(sid)){ bad.push({line:r.line,why:`id ${sid}가 앞 줄에도 있습니다.`}); continue; } seen.add(sid);
    const t=cosmTarget(+sid); if(!t){ bad.push({line:r.line,why:`id ${sid} 선수를 찾을 수 없습니다.`}); continue; } const o=t.o;
    const nm=String(r.name??'').trim()===''?o.name:cosmNameClean(r.name); let why=nm===o.name?'':cosmNameErr(r.name);
    const fs=String(r.face??'').trim(); let fTo=null, fFrom=null;
    if(!why&&fs!==''){ if(t.arch)why='은퇴 선수는 얼굴을 바꿀 수 없습니다(이름만 바꿀 수 있음).'; else if(!/^\d+$/.test(fs))why=`얼굴 번호 '${fs}'가 숫자가 아닙니다.`; else if(!F)why='이 화면에서는 얼굴 번호를 확인할 수 없습니다.'; else { fFrom=F.cur(o); const n=+fs; if(n!==fFrom){ const fe=F.err(o,n); if(fe)why=fe; else fTo=n; } } }
    if(why){ bad.push({line:r.line,why:`${o.name}(${sid}): ${why}`}); continue; }
    if(nm===o.name&&fTo==null){ same++; continue; }
    chg.push({id:+sid,line:r.line,arch:t.arch,from:o.name,to:nm,faceFrom:fFrom,faceTo:fTo}); }
  return {chg,bad,same}; }
/* 미리보기 적용: 이름은 한 번에, 얼굴은 F.set(p,번호)로(화면 쪽). → {names, faces, errs} */
function cosmApply(pv,F){ const r=cosmRenameMany((pv&&pv.chg||[]).filter(x=>x.to!==x.from).map(x=>({id:x.id,name:x.to}))); let faces=0; const errs=r.errs.slice();
  for(const x of pv&&pv.chg||[])if(x.faceTo!=null){ const p=G.players[x.id]; if(!p||!F){ errs.push(`${x.to}: 얼굴을 바꾸지 못했습니다.`); continue; } const e=F.err(p,x.faceTo); if(e){ errs.push(`${p.name}: ${e}`); continue; } F.set(p,x.faceTo); faces++; }
  return {names:r.n,faces,errs}; }
