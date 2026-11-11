/* ===== 팀 카드 공유(사용자 11-11: 내 팀을 자랑하게) =====
   서버 없이: 카드를 이미지(PNG)로 저장하고, 공유 코드(압축 문자열)를 복사한다. 다른 사람은 코드를 붙여 넣어 같은 카드를 본다.
   카드에는 화면에 이미 보이는 정보만 담는다(숨은 능력·잠재력 원값은 넣지 않는다: 능력은 화면 표시 수치) */
function tcData(){ const t=team(G.user); if(!t)return null; const y=G.year; const P=tpal(t);
  const st=(()=>{ try{ const {order}=standOrder(); const i=order.findIndex(o=>o.tid===G.user); const o=order[i]; return o?{w:o.w,l:o.l,t:o.t||0,rk:i+1}:null; }catch(e){ return null; } })();
  const champs=(G.history||[]).filter(h=>h.champ===G.user).map(h=>h.y);
  let gm=null; try{ const a=legPeople().find(x=>x.k===legMeK()); gm={n:legMeName(),s:a?a.s:1,c:a?a.c:0,w:a?a.w:0,l:a?a.l:0}; }catch(e){ gm={n:legMeName(),s:1,c:0,w:0,l:0}; }
  const d=depth(G.user); const posOf={}; for(const k in d.ln)posOf[d.ln[k].id]=k; const order=orderList(d.start,G.user);
  const bat=p=>{ const h=seasonTotal(p,y,'1군'); return h&&h.pa?`${bRate(h).avg.toFixed(3).replace(/^0/,'')} · ${h.hr}홈런`:''; };
  const pit=p=>{ const h=seasonTotal(p,y,'1군'); return h&&h.outs?`ERA ${pRate(h).era.toFixed(2)} · ${h.sv?h.sv+'세이브':h.w+'승'}`:''; };
  const ov=p=>{ const r=scoutReport(p).cur; return r!=null?dv(r):null; };
  const L=order.map(p=>({n:p.name,pos:POSS[posOf[p.id]]||posLabel(p),o:ov(p),s:bat(p)}));
  const SP=d.sp.slice(0,5).map(p=>({n:p.name,o:ov(p),s:pit(p)})); const CL=d.pen[0]?{n:d.pen[0].name,o:ov(d.pen[0]),s:pit(d.pen[0])}:null;
  let star=null; try{ const W=playersOf(G.user).map(p=>({p,w:(()=>{ const h=seasonTotal(p,y,'1군'); return h?warOf(h,p):0; })()})).sort((a,b)=>b.w-a.w)[0]; if(W&&W.w>0)star={n:W.p.name,pos:posLabel(W.p),w:+W.w.toFixed(1)}; }catch(e){}
  return {v:1,y,city:t.city,nick:t.nick,code:t.code||'',tid:G.user,pal:P.slice(0,4),st,champs,gm,L,SP,CL,star,stad:(()=>{ try{ return stadName(G.user); }catch(e){ return ''; } })()}; }
const tcGmTxt=g=>`단장${g.n&&g.n!=='단장'?' '+g.n:''} · ${g.s}시즌째`; /* 통산 승패는 시즌이 끝나야 갱신되므로 시즌 수만 */
function tcEncode(d){ return 'FT1:'+LZString.compressToEncodedURIComponent(JSON.stringify(d)); }
function tcDecode(s){ try{ s=String(s||'').trim(); if(!s.startsWith('FT1:'))return null; const d=JSON.parse(LZString.decompressFromEncodedURIComponent(s.slice(4))); return d&&d.v===1&&d.nick?d:null; }catch(e){ return null; } }
function tcCardHtml(d){ const P=d.pal||['#334','#ddd','#223','#889']; const rec=d.st?`${d.st.w}승 ${d.st.l}패${d.st.t?` ${d.st.t}무`:''} · ${d.st.rk}위`:'';
  const row=(a,b,c,e)=>`<div class="tcd-r"><span class="tcd-p">${esc(a)}</span><b>${esc(b)}</b>${c!=null?`<em>${c}</em>`:''}<i>${esc(e||'')}</i></div>`;
  const mine=d.tid===G?.user&&d.nick===team(G.user)?.nick;
  return `<div class="tcd" style="--c1:${P[0]};--c2:${P[1]};--c3:${P[2]}"><header class="tcd-h">${mine?badge(d.tid,56):`<span class="tcd-em">${esc((d.code||d.nick).slice(0,3))}</span>`}<div><span class="tcd-y">${d.y} 시즌 · 프런트야구</span><h2>${esc(d.city)} ${esc(d.nick)}</h2><span class="tcd-rec">${esc(rec)}${d.stad?` · ${esc(d.stad)}`:''}</span></div></header>
    <div class="tcd-meta"><span>${esc(tcGmTxt(d.gm))}</span><span>우승 <b>${d.champs.length}회</b>${d.champs.length?` (${d.champs.slice(-4).join(', ')})`:''}</span>${d.star?`<span>올해의 스타 <b>${esc(d.star.n)}</b> ${esc(d.star.pos)} · WAR ${d.star.w}</span>`:''}</div>
    <div class="tcd-g"><section><h3>주전 라인업</h3>${d.L.map((x,i)=>row(`${i+1} ${x.pos}`,x.n,x.o,x.s)).join('')}</section><section><h3>선발 로테이션</h3>${d.SP.map((x,i)=>row(`${i+1}선발`,x.n,x.o,x.s)).join('')}${d.CL?`<h3>마무리</h3>${row('마무리',d.CL.n,d.CL.o,d.CL.s)}`:''}</section></div></div>`; }
function teamShareView(){ const own=G.unemp?null:tcData(); const imp=UI.tcImp?tcDecode(UI.tcImp):null;
  const ownSec=own?csec('우리 팀 카드',`<div class="btns" style="margin-bottom:10px"><button class="btn primary" data-a="tcPng">이미지로 저장</button><button class="btn" data-a="tcCopy">공유 코드 복사</button></div>`+tcCardHtml(own)+`<p class="small muted">이미지는 카페에 바로 올릴 수 있습니다. 공유 코드를 받은 사람은 아래 칸에 붙여 넣으면 같은 카드를 볼 수 있습니다. 카드에는 화면에 보이는 정보(스카우트 평가 기준 능력)만 담깁니다.</p>${UI.tcMsg?`<p class="small">${esc(UI.tcMsg)}</p>`:''}`):'';
  const impSec=csec('다른 단장의 팀 카드 보기',`<textarea id="tc-in" rows="3" placeholder="FT1:로 시작하는 공유 코드를 붙여 넣으세요" style="width:100%">${esc(UI.tcImp||'')}</textarea><div class="btns"><button class="btn" data-a="tcImport">카드 보기</button>${UI.tcImp?'<button class="btn" data-a="tcClear">지우기</button>':''}</div>${UI.tcImp?(imp?tcCardHtml(imp):'<p class="small bad">공유 코드를 읽을 수 없습니다.</p>'):''}`);
  return ownSec+impSec; }
/* 카드 이미지: 캔버스에 직접 그린다(외부 라이브러리 없이). 1080×1350 세로 */
async function tcPng(d){ const W=1080,H=1350, c=document.createElement('canvas'); c.width=W; c.height=H; const x=c.getContext('2d'); const P=d.pal; const F='"Noto Sans KR","Malgun Gothic",sans-serif';
  const g=x.createLinearGradient(0,0,0,H); g.addColorStop(0,P[0]); g.addColorStop(.32,P[2]||'#111'); g.addColorStop(1,'#0b0f14'); x.fillStyle=g; x.fillRect(0,0,W,H);
  try{ const B=typeof BADGE_IMG!=='undefined'?BADGE_IMG[d.tid]:null; const src=B&&(B.c||B.s||B.src); if(src&&d.tid===G.user){ const im=new Image(); im.src=src; await new Promise(r=>{ im.onload=r; im.onerror=r; setTimeout(r,1500); }); if(im.naturalWidth)x.drawImage(im,60,60,150,150); } }catch(e){}
  x.fillStyle='rgba(255,255,255,.85)'; x.font=`600 30px ${F}`; x.fillText(`${d.y} 시즌 · 프런트야구`,240,100);
  x.fillStyle='#fff'; x.font=`800 72px ${F}`; x.fillText(`${d.city} ${d.nick}`,240,175);
  x.font=`500 32px ${F}`; x.fillStyle='rgba(255,255,255,.9)'; x.fillText(d.st?`${d.st.w}승 ${d.st.l}패${d.st.t?` ${d.st.t}무`:''} · ${d.st.rk}위`:'',240,225);
  let yy=290; x.font=`500 30px ${F}`; for(const s of [tcGmTxt(d.gm),`우승 ${d.champs.length}회${d.champs.length?` (${d.champs.slice(-4).join(', ')})`:''}`,d.star?`올해의 스타 ${d.star.n} ${d.star.pos} · WAR ${d.star.w}`:'']){ if(!s)continue; x.fillText(s,60,yy); yy+=44; }
  const col=(t,L,x0,y0)=>{ x.fillStyle='#fff'; x.font=`800 34px ${F}`; x.fillText(t,x0,y0); let y1=y0+16; x.font=`500 28px ${F}`;
    for(const r of L){ y1+=52; x.fillStyle='rgba(255,255,255,.07)'; x.fillRect(x0-8,y1-36,470,46); x.fillStyle='rgba(255,255,255,.65)'; x.fillText(r[0],x0,y1); x.fillStyle='#fff'; x.fillText(r[1],x0+120,y1); if(r[2]!=null){ x.fillStyle='#ffd166'; x.fillText(String(r[2]),x0+410,y1); } }
    return y1; };
  const yL=yy+40; const y1=col('주전 라인업',d.L.map((r,i)=>[`${i+1} ${r.pos}`,r.n,r.o]),60,yL); let y2=col('선발 로테이션',d.SP.map((r,i)=>[`${i+1}선발`,r.n,r.o]),560,yL);
  if(d.CL)y2=col('마무리',[['마무리',d.CL.n,d.CL.o]],560,y2+70);
  const Hc=Math.min(H,Math.max(y1,y2)+110); x.fillStyle='rgba(255,255,255,.55)'; x.font=`500 24px ${F}`; x.fillText('프런트야구 · 숫자는 스카우트 평가 기준 능력',60,Hc-40);
  const o=document.createElement('canvas'); o.width=W; o.height=Hc; o.getContext('2d').drawImage(c,0,0); return o.toDataURL('image/png'); } /* 내용 높이에 맞춰 자른다 */
Object.assign(A,{
  async tcPng(){ const d=tcData(); if(!d)return; try{ const url=await tcPng(d); const a=document.createElement('a'); a.href=url; a.download=`프런트야구_${d.nick}_${d.y}.png`; document.body.appendChild(a); a.click(); a.remove(); UI.tcMsg='이미지를 저장했습니다.'; }catch(e){ UI.tcMsg='이미지를 만들지 못했습니다.'; } render(); },
  async tcCopy(){ const d=tcData(); if(!d)return; const s=tcEncode(d); try{ await navigator.clipboard.writeText(s); UI.tcMsg=`공유 코드를 복사했습니다(${s.length}자).`; }catch(e){ UI.tcImp=s; UI.tcMsg='클립보드에 쓸 수 없어 아래 칸에 코드를 넣었습니다. 직접 복사하세요.'; } render(); },
  tcImport(){ const el=document.getElementById('tc-in'); UI.tcImp=el?el.value.trim():''; render(); },
  tcClear(){ UI.tcImp=''; render(); } });
