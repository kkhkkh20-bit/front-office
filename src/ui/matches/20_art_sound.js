/* ---------- 그림 에셋: 트로피·메달·사건 아이콘 (직접 그린 SVG) ---------- */
let ARTN=0;
const ART={
  trophy:(sz)=>{ const id='tg'+(++ARTN); return `<svg class="art" width="${sz}" height="${sz}" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="#b8862b"/><stop offset=".45" stop-color="#ffe08a"/><stop offset="1" stop-color="#c8922e"/></linearGradient></defs><path d="M20 8h24v14c0 8-5.4 14-12 14s-12-6-12-14Z" fill="url(#${id})"/><path d="M20 12h-7c0 7 3 11 8 12M44 12h7c0 7-3 11-8 12" fill="none" stroke="url(#${id})" stroke-width="3"/><path d="M28 36h8v8h-8Z" fill="url(#${id})"/><path d="M21 44h22l2 6H19Z" fill="url(#${id})"/><rect x="16" y="50" width="32" height="7" rx="1.5" fill="#3a2a12"/><rect x="22" y="52" width="20" height="3" rx=".8" fill="#c8922e"/><path d="M27 14l-2 12" stroke="#fff6cf" stroke-width="2" opacity=".6" stroke-linecap="round"/><path d="m32 15 1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5Z" fill="#fff6cf"/></svg>`; },
  medal:(sz,c)=>{ const m={gold:['#ffe08a','#c8922e'],silver:['#eef2f5','#9aa6b2'],bronze:['#f2b47a','#9a5a2a'],green:['#9be7b0','#2f8a52']}[c||'gold']; return `<svg class="art" width="${sz}" height="${sz}" viewBox="0 0 32 32" aria-hidden="true"><path d="M10 2h5l3 9h-5ZM22 2h-5l-3 9h5Z" fill="#c43a31"/><path d="M12 2h2l2.5 8h-2ZM20 2h-2l-2.5 8h2Z" fill="#2b5b8a"/><circle cx="16" cy="20" r="9" fill="${m[1]}"/><circle cx="16" cy="20" r="7" fill="${m[0]}"/><path d="m16 15 1.5 3 3.3.5-2.4 2.3.6 3.3-3-1.6-3 1.6.6-3.3-2.4-2.3 3.3-.5Z" fill="${m[1]}"/></svg>`; },
  glove:(sz)=>`<svg class="art" width="${sz}" height="${sz}" viewBox="0 0 32 32" aria-hidden="true"><path d="M8 27c-3-4-4-9-3-14l1-6c.3-1.6 2.6-1.4 2.6.2V13l1-9c.2-1.7 2.7-1.6 2.7.1V12l1.2-8.4c.3-1.7 2.8-1.4 2.7.3L16 13l1.6-6.6c.4-1.6 2.8-1.1 2.6.5L19.4 15l2.4-2.6c1.3-1.4 3.5.2 2.4 1.8L20 21c-1.4 2.3-1.6 4-1.6 6Z" fill="#d9a441" stroke="#7a5418" stroke-width="1"/><path d="M8.6 13.4h3.6M12.8 12h3M17 13.6h2.6" stroke="#7a5418" stroke-width=".9" stroke-linecap="round"/><circle cx="23.5" cy="23.5" r="4.5" fill="#f4f6f8" stroke="#c43a31" stroke-width=".8"/><path d="M20.6 21.4q2.4 2 0 4.4M26.4 21.4q-2.4 2 0 4.4" fill="none" stroke="#c43a31" stroke-width=".7"/></svg>`,
  plaque:(sz)=>`<svg class="art" width="${sz}" height="${sz}" viewBox="0 0 32 32" aria-hidden="true"><rect x="5" y="3" width="22" height="26" rx="2" fill="#5a3a1c"/><rect x="8" y="6" width="16" height="20" rx="1" fill="#c8922e"/><circle cx="16" cy="12" r="3.2" fill="#7a5418"/><path d="M11 18h10M12 21h8M13 23.6h6" stroke="#7a5418" stroke-width="1" stroke-linecap="round"/></svg>`
};
const EVI={pt:'<path d="M4 15h16M6 15v4M18 15v4M8 11h8v4H8Z"/>',call:'<path d="M12 19V5M6 11l6-6 6 6"/>',reinf:'<path d="M12 5v14M5 12h14"/>',clash:'<path d="M13 3 6 13h5l-1 8 7-10h-5Z"/>',press:'<path d="M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3ZM6 11a6 6 0 0 0 12 0M12 17v4M9 21h6"/>',slump:'<path d="M4 6l6 6 4-4 6 8M20 10v6h-6"/>',fx:'<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c2.5 2.8 2.5 13.2 0 16M12 4c-2.5 2.8-2.5 13.2 0 16"/>',inj:'<path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6Z"/>',agent:'<path d="M7 3h7l4 4v14H7Z"/><path d="M14 3v4h4M10 12h5M10 15h5M10 18h3"/>',vet:'<path d="m12 4 2.3 4.7 5.2.8-3.8 3.6.9 5.1L12 15.8 7.4 18.2l.9-5.1-3.8-3.6 5.2-.8Z"/>',fan:'<path d="M4 10v4l10 4V6Z"/><path d="M14 8a4 4 0 0 1 0 8M7 15l1 5h3l-1-4"/>'};
const evIcon=k=>`<svg class="evi" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${EVI[k]||EVI.vet}</svg>`;
function awArt(a,sz){ return a.includes('골든글러브')?ART.glove(sz):a.includes('명예의 전당')?ART.plaque(sz):a.includes('MVP')?ART.medal(sz,'gold'):a.includes('신인')?ART.medal(sz,'green'):a.includes('우승')?ART.trophy(sz):ART.medal(sz,'silver'); }
function cardTier(o){ return o==null?'':o>=64?'t-gold':o>=57?'t-silver':o>=50?'t-bronze':''; }

/* ---------- 효과음 ---------- */
const SND={ctx:null,buf:{},loops:{}};
function sndOn(){ return false; } /* 효과음 제거 */
function sndInit(){ if(SND.ctx||!sndOn())return; const AC=window.AudioContext||window.webkitAudioContext; if(!AC||typeof SNDDATA==='undefined')return;
  try{ SND.ctx=new AC(); }catch(e){ return; } SND.master=SND.ctx.createGain(); SND.master.gain.value=.85; SND.master.connect(SND.ctx.destination);
  for(const k in SNDDATA){ try{ const bin=atob(SNDDATA[k].split(',')[1]); const u=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
      SND.ctx.decodeAudioData(u.buffer,b=>{ SND.buf[k]=b; },()=>{}); }catch(e){} } }
function sndReady(){ if(!sndOn())return null; sndInit(); const c=SND.ctx; if(!c)return null; if(c.state==='suspended')c.resume(); return c; }
function sfx(k,vol,rate){ const c=sndReady(); if(!c||!SND.buf[k])return null; const s=c.createBufferSource(); s.buffer=SND.buf[k]; if(rate)s.playbackRate.value=rate;
  const g=c.createGain(); g.gain.value=vol??1; s.connect(g); g.connect(SND.master); s.start(); return {s,g}; }
function sndLoop(name,k,vol,fade){ if(SND.loops[name]&&SND.loops[name].k===k)return; sndStop(name,.2); const c=sndReady(); if(!c||!SND.buf[k])return; const s=c.createBufferSource(); s.buffer=SND.buf[k]; s.loop=true;
  const g=c.createGain(); g.gain.setValueAtTime(0,c.currentTime); g.gain.linearRampToValueAtTime(vol,c.currentTime+(fade??.8)); s.connect(g); g.connect(SND.master); s.start(); SND.loops[name]={s,g,k}; }
function sndStop(name,fade){ const L=SND.loops[name]; if(!L||!SND.ctx)return; const c=SND.ctx; const f=fade??.6; try{ L.g.gain.cancelScheduledValues(c.currentTime); L.g.gain.setValueAtTime(L.g.gain.value,c.currentTime); L.g.gain.linearRampToValueAtTime(0,c.currentTime+f); L.s.stop(c.currentTime+f+.05); }catch(e){} delete SND.loops[name]; }
function sndStopAll(){ for(const k in SND.loops)sndStop(k,.3); }
/* 오르간: 야구장 전통 나팔 신호(차지) 음형. 직접 합성 */
function organ(seq,vol){ const c=sndReady(); if(!c)return; let t=c.currentTime+.02;
  for(const [m,d] of seq){ if(m){ const f=440*Math.pow(2,(m-69)/12); const g=c.createGain(); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime((vol||.22),t+.02); g.gain.setValueAtTime((vol||.22),t+d*.85); g.gain.linearRampToValueAtTime(0,t+d);
      g.connect(SND.master); for(const [mul,a] of [[1,1],[2,.5],[3,.25],[4,.12]]){ const o=c.createOscillator(); o.type='sine'; o.frequency.value=f*mul; const og=c.createGain(); og.gain.value=a; o.connect(og); og.connect(g); o.start(t); o.stop(t+d+.05); } }
    t+=d; } }
const ORG_CHARGE=[[67,.16],[72,.16],[76,.16],[79,.3],[76,.14],[79,.6]];
const ORG_WIN=[[72,.14],[76,.14],[79,.14],[84,.5],[0,.08],[79,.14],[84,.7]];
function siren(){ const c=sndReady(); if(!c)return; const t=c.currentTime; const o=c.createOscillator(); o.type='sawtooth'; const g=c.createGain(); const lp=c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=1400;
  o.frequency.setValueAtTime(380,t); o.frequency.linearRampToValueAtTime(620,t+.9); o.frequency.linearRampToValueAtTime(560,t+1.8);
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(.12,t+.15); g.gain.setValueAtTime(.12,t+1.4); g.gain.linearRampToValueAtTime(0,t+1.9); o.connect(lp); lp.connect(g); g.connect(SND.master); o.start(t); o.stop(t+2); }
function buzz(ms){ try{ if(navigator.vibrate)navigator.vibrate(ms); }catch(e){} }
addEventListener('pointerdown',()=>{ if(sndOn())sndInit(); if(SND.ctx&&SND.ctx.state==='suspended')SND.ctx.resume(); },{passive:true});

