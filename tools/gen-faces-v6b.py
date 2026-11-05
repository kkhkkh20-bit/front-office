#!/usr/bin/env python3
"""v6b 실사 얼굴(시범 100명) → 구단별 홈 유니폼 합성 시트 → src/ui/assets/00d_faces_data.js
 - 합성식은 assets/v6/batch01b/CLAUDE_HANDOFF.md 4절 그대로(판256 RGB + 정렬 시트 UV로 v5b 홈 유니폼·가슴 심벌·모자색·모자 심벌).
 - 브라우저에서 WebGL로 합성하지 않고 빌드 전에 한 번 만든다: Safari 비결합 알파 문제가 없고, 화면은 그림 한 장만 잘라 쓴다.
 - 구단마다 128px 10x10 시트 1장(WebP). 검수 미통과 시범판(사용자 결정 2026-11-05: 품질이 좋으니 먼저 연결해 보고 다양성은 다음 회차)
 사용: python3 tools/gen-faces-v6b.py  (얼굴·유니폼 에셋을 바꿨을 때만)"""
import json, io, os, base64, re, sys
import numpy as np
from PIL import Image
from source_manifest import source_file
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D6=os.path.join(ROOT,'assets','v6','batch01b'); D5B=os.path.join(ROOT,'assets','v5b')
M6=json.load(open(os.path.join(D6,'manifest.json'),encoding='utf8')); M5=json.load(open(os.path.join(D5B,'manifest.json'),encoding='utf8')); A5=M5['assets']
src=open(source_file('engine','01_rules.js'),encoding='utf8').read()
TD=re.findall(r"\{city:'([^']+)',nick:'([^']+)'",src.split('const TEAM_DEF=[')[1].split('];')[0])
def load(rel,base=D5B,mode='RGBA'): return np.asarray(Image.open(os.path.join(base,rel)).convert(mode)).astype(np.float32)
def samp(img,x,y):
    """bilinear: img[H,W,C], x,y 같은 모양의 픽셀 좌표(픽셀 중심=정수)"""
    H,W=img.shape[:2]; x=np.clip(x,0,W-1); y=np.clip(y,0,H-1); x0=np.floor(x).astype(int); y0=np.floor(y).astype(int); x1=np.minimum(x0+1,W-1); y1=np.minimum(y0+1,H-1); fx=(x-x0)[...,None]; fy=(y-y0)[...,None]
    return (img[y0,x0]*(1-fx)+img[y0,x1]*fx)*(1-fy)+(img[y1,x0]*(1-fx)+img[y1,x1]*fx)*fy
P256=np.asarray(Image.open(os.path.join(D6,'sheets/256/b01b_s01.webp')).convert('RGBA')).astype(np.float32)
REG=np.asarray(Image.open(os.path.join(D6,'sheets/registration/b01b_s01.webp')).convert('RGB')).astype(np.float32)
NEU=load(A5['ko_late20s_01']['png']['512'])[...,0]
yy,xx=np.mgrid[0:256,0:256].astype(np.float32)
EYEB=143/2-14 # 256 기준 눈썹 바로 위(코덱스 카메라 규격: 512 기준 눈높이 y≈143)
def person(ident,kit,chest,capmark,capRGB):
    x0,y0,_,_=ident['sheets']['256']['rect']; rx,ry,_,_=ident['registration']['rect']
    pl=P256[y0:y0+256,x0:x0+256]; rgb=pl[...,:3]; capM=pl[...,3]/255; R=rgb[...,0]; G=rgb[...,1]; B=rgb[...,2]
    cell=REG[ry:ry+128,rx:rx+128]; q=lambda v:np.clip((v+.5)*128/256-.5,0,127)
    rg=samp(cell,q(xx),q(yy)); gm=rg[...,0]/255; sx=rg[...,1]/255*511; sy=rg[...,2]/255*511
    kc=np.clip((R-1.65*np.maximum(G,B)-12)/28,0,1)*np.clip((R-35)/35,0,1); m=gm*kc
    wk=samp(kit,sx,sy); m=m*np.clip(wk[...,3]/255*4,0,1) # 유니폼 그림 밖(투명)은 원래 사진을 남긴다
    cn=samp(NEU[...,None],sx,sy)[...,0]; shade=np.clip(R/np.maximum(cn,50),.55,1.45)[...,None]
    cloth=np.clip(wk[...,:3]*shade,0,255); out=rgb*(1-m[...,None])+cloth*m[...,None]
    wc=samp(chest,sx,sy); ca=(wc[...,3]/255*m)[...,None]; out=out*(1-ca)+wc[...,:3]*ca
    # 모자 층: 모자색(원본 R 명암) + 심벌. 심벌은 중심 기준 78%로 줄이고 크라운(모자 높이 위 62%)에만(챙으로 튀어나오지 않게)
    capC=np.array(capRGB,np.float32)*(R/255)[...,None]
    s_x,s_y,tx,ty=ident['cap_mark_transform_512']; cm=capmark # 256으로 줄인 심벌
    ys,xs=np.nonzero(cm[...,3]>20); cx=s_x*(xs.min()+xs.max())/2+tx/2; cy=s_y*(ys.min()+ys.max())/2+ty/2; K=.78
    dx=cx+(xx-cx)/K; dy=cy+(yy-cy)/K; mx=(dx-tx/2)/s_x; my=(dy-ty/2)/s_y; wm=samp(cm,mx,my); inside=((mx>=0)&(mx<=255)&(my>=0)&(my<=255)).astype(np.float32)
    cr=np.nonzero(capM.max(axis=1)>.5)[0]; T,B=(int(cr.min()),int(cr.max())) if len(cr) else (0,0); crown=(yy<T+.62*(B-T)).astype(np.float32)
    ma=(wm[...,3]/255*capM*inside*crown)[...,None]; capC=capC*(1-ma)+wm[...,:3]*ma
    # 모자를 깊게 눌러 쓴 모양(사용자 11-05: 걸쳐 쓴 느낌): 모자 윗선은 그대로 두고 아래(챙)를 모자 높이의 20%만큼 늘려 이마를 더 덮는다
    if B>T:
        # 실제 KBO 프로필처럼 챙 끝을 눈썹 바로 위(눈 높이 y≈71.5에서 14px 위)까지. 너무 늘어나지 않게 모자 높이의 75%까지만
        d=min(max(.2*(B-T),EYEB-B),.75*(B-T)); sy_=np.where(yy<=T,yy,T+(yy-T)*(B-T)/(B+d-T)); capCw=samp(capC,xx,sy_); capMw=samp(capM[...,None],xx,sy_)[...,0]
        capMw=np.where(yy<=B+d+1,capMw,0)
        # 원래 모자 자리의 빨간 키 색이 가장자리에 비치지 않게: 원래 자리와 늘린 자리 모두 가장자리 알파를 키워 덮는다
        a0=np.clip(capM*1.8,0,1)[...,None]; out=out*(1-a0)+capC*a0; a=np.clip(capMw*1.8,0,1)[...,None]; out=out*(1-a)+capCw*a
    return Image.fromarray(np.clip(out+.5,0,255).astype(np.uint8),'RGB')
ids=M6['identities']; assert len(ids)==100
sheets={}; big={}; seen=set()
for t in M5['teams']:
    if t['key']=='korea': continue
    tid=[i for i,(c,n) in enumerate(TD) if c+' '+n==t['name']]
    if len(tid)!=1: sys.exit('게임 구단과 맞지 않는 이름: '+t['name'])
    K=M5['kits'][t['key']]['home']; kit=load(A5[K['kit_overlay']]['png']['512']); chest=load(A5[K['chest']]['png']['512'])
    capmark=np.asarray(Image.open(os.path.join(D5B,A5[K['cap']]['png']['512'])).convert('RGBA').resize((256,256),Image.LANCZOS)).astype(np.float32)
    h=K['cap_color'].lstrip('#'); capRGB=[int(h[i:i+2],16) for i in (0,2,4)]
    sh=Image.new('RGB',(1280,1280)); bg=Image.new('RGB',(2560,2560))
    for i,ident in enumerate(ids): im=person(ident,kit,chest,capmark,capRGB); sh.paste(im.resize((128,128),Image.LANCZOS),((i%10)*128,(i//10)*128)); bg.paste(im,((i%10)*256,(i//10)*256))
    o=io.BytesIO(); sh.save(o,'WEBP',quality=80,method=6); sheets[tid[0]]='data:image/webp;base64,'+base64.b64encode(o.getvalue()).decode(); seen.add(tid[0])
    o=io.BytesIO(); bg.save(o,'WEBP',quality=86,method=6); big[tid[0]]='data:image/webp;base64,'+base64.b64encode(o.getvalue()).decode() # 선수 상세 큰 사진용(256px 칸 원본 그대로. 사이트는 따로 받는 파일이라 우리 구단 시트 하나만 내려받는다)
    if os.environ.get('PREVIEW'): sh.save(os.path.join(os.environ['PREVIEW'],t['key']+'.png'))
if len(seen)!=len(TD): sys.exit('얼굴 시트가 없는 구단이 있음')
meta=[{'a':x['age'],'f':0 if x['ethnicity']=='Korean' else 1,'e':x['ethnicity'],'g':int(bool(x['tags'].get('glasses'))),'b':int(bool(x['tags'].get('beard')))} for x in ids]
body='/* 자동 생성: python3 tools/gen-faces-v6b.py (손으로 고치지 않는다). v6b 실사 얼굴 시범 100명 × 구단 홈 유니폼 10x10 시트(sheet 128px 칸, big 256px 칸: 선수 상세 큰 사진). ids[i]는 시트 i번째 칸(a 나이·f 외국인·e 출신·g 안경·b 수염) */\nconst FACE6='+json.dumps({'ids':meta,'sheet':{str(k):v for k,v in sorted(sheets.items())},'big':{str(k):v for k,v in sorted(big.items())}},ensure_ascii=False,separators=(',',':'))+';\n'
open(source_file('ui','00d_faces_data.js'),'w',encoding='utf8').write(body)
print('얼굴 시트 %d개 구단 · %dKB'%(len(sheets),len(body)//1024))
