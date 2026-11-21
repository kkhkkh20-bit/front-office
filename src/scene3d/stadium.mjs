/* Venue dressing only. Home stadium metadata is supplied by the UI; no game state or RNG access. */
import * as T from 'three';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const VENUE_ADS=['FRONT COFFEE','DIAMOND SPORTS','NINE MOTORS','BASE CAMP','FRONT BANK','PLAY BALL'];
export function venuePlan(input={}){
 const kind=['classic','mid','big','dome','mega'].includes(input.kind)?input.kind:'classic',dome=!!input.dome,cap=clamp(+input.cap||20000,5000,60000);
 return {kind,dome,cap,color:/^#[0-9a-f]{6}$/i.test(input.color||'')?input.color:'#a12639',modern:!!input.modern,home:input.home??null,
  tier:kind==='mega'?3:kind==='big'||dome||cap>=25000?2:1,roofHeight:31,adCount:VENUE_ADS.length};
}
function strip(points,low,high){const pos=[],uv=[],idx=[];for(let i=0;i<points.length;i++){const p=points[i];pos.push(p[0],low,p[1],p[0],high,p[1]);uv.push(i/(points.length-1),0,i/(points.length-1),1);if(i){const k=i*2;idx.push(k-2,k,k-1,k-1,k,k+1);}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;}
function arc(rx,rz,cz,start=-1.38,end=1.38,n=40){return Array.from({length:n+1},(_,i)=>{const a=start+(end-start)*i/n;return [Math.sin(a)*rx,cz+Math.cos(a)*rz];});}
function adAtlas(){const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=128;const g=canvas.getContext('2d');
 VENUE_ADS.forEach((label,i)=>{const x=i*256;g.fillStyle=i%2?'#204b67':'#102d42';g.fillRect(x,0,256,128);g.fillStyle='#0a1d2a';g.fillRect(x,0,256,5);g.fillRect(x,123,256,5);g.textAlign='center';g.textBaseline='middle';g.font='900 26px Arial,sans-serif';g.fillStyle='#f2f4ed';g.fillText(label,x+128,64,232);});
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=2;return {canvas,texture};}
/* Low boards follow the home-plate backstop wall, as in the KIA venue media guide.
 * Home plate is z=0 and the outfield is +Z. Keep the existing pitching camera unchanged. */
function boards(){const positions=[],uv=[],indices=[];for(let i=0;i<VENUE_ADS.length;i++){
 const cx=-18+i*7.2,cz=-17.75+cx*cx/100,tx=3.45,tz=2*cx/100*tx,k=i*4;
 positions.push(cx-tx,.35,cz-tz,cx+tx,.35,cz+tz,cx-tx,1.95,cz-tz,cx+tx,1.95,cz+tz);uv.push(i/6,0,(i+1)/6,0,i/6,1,(i+1)/6,1);indices.push(k,k+1,k+2,k+2,k+1,k+3);}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;}
export function createVenue(scene,input={}){
 const plan=venuePlan(input),root=new T.Group();root.name='VenueDressing';root.userData={...plan};const geometries=[],materials=[],textures=[],canvases=[];
 const add=(geometry,material,name)=>{geometries.push(geometry);if(!materials.includes(material))materials.push(material);const mesh=new T.Mesh(geometry,material);mesh.name=name;mesh.frustumCulled=true;root.add(mesh);return mesh;};
 const atlas=adAtlas();textures.push(atlas.texture);canvases.push(atlas.canvas);
 const panel=(roof=false)=>{const c=document.createElement('canvas');c.width=256;c.height=128;const g=c.getContext('2d');g.fillStyle=roof?'#a5b6bd':'#172d3a';g.fillRect(0,0,256,128);
  if(roof){g.fillStyle='#7c939f';for(let x=0;x<256;x+=64)g.fillRect(x,0,2,128);g.fillRect(0,0,256,2);g.fillStyle='#b9c8cd';g.fillRect(3,3,59,122);g.fillRect(131,3,59,122);}
  else for(let x=8;x<256;x+=48){g.fillStyle=x===104?'#b7ab83':'#587d90';g.fillRect(x,18,39,91);g.fillStyle='#90a9b2';g.fillRect(x,18,39,5);g.fillStyle='#243c4b';g.fillRect(x,61,39,3);}
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=T.RepeatWrapping;tex.wrapT=T.RepeatWrapping;tex.repeat.set(roof?12:10,roof?3:1);textures.push(tex);canvases.push(c);return tex;};
 const adMaterial=new T.MeshBasicMaterial({map:atlas.texture,side:T.DoubleSide,toneMapped:false});add(boards(),adMaterial,'Venue_AdBoards');
 const stone=new T.MeshStandardMaterial({color:0x1a2935,roughness:.78,metalness:.22,side:T.DoubleSide}),steel=new T.MeshStandardMaterial({color:0x9daeb4,roughness:.46,metalness:.58,side:T.DoubleSide}),team=new T.MeshStandardMaterial({color:plan.color,roughness:.7,metalness:.2,side:T.DoubleSide});
 const rear=arc(118,104,34);add(strip(rear,20,21),team,'Venue_ClubFascia');
 if(plan.tier>1){const gallery=arc(126,112,34);add(strip(gallery,22,plan.tier===3?30:26),new T.MeshStandardMaterial({color:0xd2dee2,map:panel(),roughness:.5,metalness:.25,side:T.DoubleSide}),'Venue_UpperGallery');add(strip(gallery,plan.tier===3?30:26,plan.tier===3?30.5:26.5),steel,'Venue_GalleryTrim');}
 if(plan.dome){
  /* Rear half-shell is a deliberate broadcast cutaway: no roof over the camera or playing area. */
  const roof=new T.SphereGeometry(1,40,12,0,Math.PI,0,Math.PI/2);roof.scale(145,34,132);roof.translate(0,plan.roofHeight,34);
  add(roof,new T.MeshStandardMaterial({color:0xd6e0e4,map:panel(true),roughness:.66,metalness:.18,side:T.DoubleSide}),'Venue_DomeCutaway');
  const ribs=[];for(let k=0;k<=10;k++){const phi=k*Math.PI/10;for(let j=0;j<12;j++){const a=j*Math.PI/24,b=(j+1)*Math.PI/24;for(const q of [a,b])ribs.push(-145*Math.cos(phi)*Math.sin(q),plan.roofHeight+34.3*Math.cos(q),34+132*Math.sin(phi)*Math.sin(q));}}
  const rg=new T.BufferGeometry();rg.setAttribute('position',new T.Float32BufferAttribute(ribs,3));geometries.push(rg);const rm=new T.LineBasicMaterial({color:0xd1d9dc,transparent:true,opacity:.8});materials.push(rm);const lines=new T.LineSegments(rg,rm);lines.name='Venue_DomeRibs';root.add(lines);
  const trussPoints=[];for(let j=0;j<=40;j++){const x=-112+224*j/40;trussPoints.push(new T.Vector3(x,31+12*Math.sqrt(Math.max(0,1-x*x/(112*112))),139));}
  add(new T.TubeGeometry(new T.CatmullRomCurve3(trussPoints),40,.45,5,false),steel,'Venue_DomeTruss');
  const rim=arc(145,132,34,-Math.PI/2,Math.PI/2,64);add(strip(rim,plan.roofHeight-.6,plan.roofHeight+.2),steel,'Venue_DomeRim');
 }else if(plan.modern){const canopy=arc(130,116,34);add(strip(canopy,plan.tier===3?32:28,plan.tier===3?33:29),steel,'Venue_OpenCanopy');}
 // Materials allocated for optional parts are still owned and released.
 for(const m of [stone,steel,team])if(!materials.includes(m))materials.push(m);
 scene.add(root);let disposed=false;return {root,plan,dispose(){if(disposed)return;disposed=true;root.removeFromParent();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());canvases.forEach(c=>{c.width=0;c.height=0;});}};
}
export function styleVenueModel(root,plan){root.traverse(n=>{if(!n.isMesh)return;if(n.name==='AdBoards'){n.visible=false;return;}
 const paint=m=>{if(!m?.color)return;if(!m.userData.venueBaseColor)m.userData.venueBaseColor=m.color.clone();m.color.copy(m.userData.venueBaseColor);
 if(n.name==='Wall_Padding')m.color.set('#163e49');else if(n.name==='BattersEye')m.color.set('#0c232a');else if(/FasciaSignage|DugoutRoof.*Fascia/.test(n.name))m.color.set(plan.color).lerp(new T.Color('#203748'),.35);
 };if(Array.isArray(n.material))n.material.forEach(paint);else paint(n.material);});}
