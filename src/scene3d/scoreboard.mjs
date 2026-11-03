import {CanvasTexture,SRGBColorSpace} from 'three';
// Match the physical board's aspect, and draw only the snapshot supplied by the replay UI.
export function createScoreboard(){const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=625;const texture=new CanvasTexture(canvas);texture.colorSpace=SRGBColorSpace;texture.flipY=false;let data={};
 function update(next){data={...data,...next};const x=canvas.getContext('2d'),d=data;x.fillStyle='#04121a';x.fillRect(0,0,1600,625);
 const text=(s,px,py,size=38,color='#e3eced',align='left')=>{x.fillStyle=color;x.font=`700 ${size}px "Noto Sans KR",sans-serif`;x.textAlign=align;x.fillText(String(s??''),px,py);};
 x.fillStyle='#123947';x.fillRect(0,0,1600,80);text('FRONT OFFICE  ·  LIVE BASEBALL',45,56,37,'#dcc58d');text(d.inning||'경기 준비',1550,56,38,'#fff','right');
 const innings=Math.max(9,Math.min(12,Math.floor((d.half??0)/2)+1)),cell=Math.min(80,850/Math.max(9,Math.floor((d.half??0)/2)+1)),start=405;
 text('TEAM',45,130,32,'#89a6b1');for(let i=0;i<innings;i++)text(i+1,start+i*cell,130,30,'#89a6b1','center');['R','H','E'].forEach((s,i)=>text(s,1310+i*100,130,34,'#d0b978','center'));
 for(const [row,side,name,score] of [[0,'a',d.away,d.sa],[1,'h',d.home,d.sh]]){const y=205+row*90;x.fillStyle=row?'#112c37':'#0b222d';x.fillRect(24,y-54,1552,82);text(name||'—',45,y,44,'#fff');for(let i=0;i<innings;i++){const entered=2*i+(side==='h'?1:0)<=(d.half??0);text(entered?(d.innings?.[side]?.[i]||0):'–',start+i*cell,y,42,'#dde8df','center');}text(score??0,1310,y,66,'#fff09c','center');text(d.hits?.[side]??0,1410,y,42,'#d4e8ef','center');text(d.errors?.[side]??0,1510,y,42,'#d4e8ef','center');}
 x.fillStyle='#23424d';x.fillRect(24,337,1552,2);
 const lamps=(label,n,max,px,color)=>{text(label,px,399,36,'#8eabb3');for(let i=0;i<max;i++){x.beginPath();x.arc(px+100+i*63,386,20,0,Math.PI*2);x.fillStyle=i<n?color:'#182e38';x.fill();}};lamps('B',d.b||0,3,45,'#75e4a0');lamps('S',d.s||0,2,450,'#ffd875');lamps('O',d.outs||0,2,800,'#ff8b76');text(d.pitch?`${d.pitch.t}  ${d.pitch.v} km/h`:'PLAY BALL',1550,399,38,'#ffe3a4','right');
 text('타자',45,468,31,'#7e9ba8');text(d.batter||'—',165,468,43,'#fff');text('투수',835,468,31,'#7e9ba8');text(d.pitcher||'—',955,468,43,'#fff');
 text(d.batterLine||'',165,518,30,'#b3cbd4');text(d.pitcherLine||'',955,518,30,'#b3cbd4');
 x.fillStyle='#122e3a';x.fillRect(24,548,1552,62);text(d.playText||'경기 중계',50,590,36,'#f0d890');
 texture.needsUpdate=true;return data;
 }update({});return {canvas,texture,update,get data(){return data;}};
}
