#!/usr/bin/env python3
"""v7 감독·코치·단장·구단주·직원 실사 얼굴(시범 126명) → src/ui/assets/00e_staff_faces_data.js
 - 감독·코치 60명: assets/v7/staff01/CLAUDE_HANDOFF.md 합성 식으로 구단별 홈 유니폼·모자색·모자 심벌을 입힌 128px 시트(10x10). 모자는 생성 단계에서 깊게 썼으므로 v6b의 모자 늘리기·심벌 축소를 쓰지 않는다.
 - 단장·구단주·직원 66명: 합성 없이 RGB 시트(128·256) 그대로.
 - 검수 미통과 시범판(사용자 결정 2026-11-05: 적용).
 사용: python3 tools/gen-staff-v7.py"""
import json, io, os, base64, re, sys
import numpy as np
from PIL import Image
from source_manifest import source_file
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D7=os.path.join(ROOT,'assets','v7','staff01'); D5B=os.path.join(ROOT,'assets','v5b')
M7=json.load(open(os.path.join(D7,'manifest.json'),encoding='utf8')); M5=json.load(open(os.path.join(D5B,'manifest.json'),encoding='utf8')); A5=M5['assets']
src=open(source_file('engine','01_rules.js'),encoding='utf8').read()
TD=re.findall(r"\{city:'([^']+)',nick:'([^']+)'",src.split('const TEAM_DEF=[')[1].split('];')[0])
def load(rel,base=D5B,mode='RGBA'): return np.asarray(Image.open(os.path.join(base,rel)).convert(mode)).astype(np.float32)
def samp(img,x,y):
    H,W=img.shape[:2]; x=np.clip(x,0,W-1); y=np.clip(y,0,H-1); x0=np.floor(x).astype(int); y0=np.floor(y).astype(int); x1=np.minimum(x0+1,W-1); y1=np.minimum(y0+1,H-1); fx=(x-x0)[...,None]; fy=(y-y0)[...,None]
    return (img[y0,x0]*(1-fx)+img[y0,x1]*fx)*(1-fy)+(img[y1,x0]*(1-fx)+img[y1,x1]*fx)*fy
P256=np.asarray(Image.open(os.path.join(D7,'sheets/coaches/256/staff01.webp')).convert('RGBA')).astype(np.float32)
REG=np.asarray(Image.open(os.path.join(D7,'sheets/coaches/registration/staff01.webp')).convert('RGB')).astype(np.float32)
NEU=load(A5['ko_late20s_01']['png']['512'])[...,0]
yy,xx=np.mgrid[0:256,0:256].astype(np.float32)
def coach(ident,kit,chest,capmark,capRGB):
    x0,y0,_,_=ident['sheets']['256']['rect']; rx,ry,_,_=ident['registration']['rect']
    pl=P256[y0:y0+256,x0:x0+256]; rgb=pl[...,:3]; capM=pl[...,3]/255; R=rgb[...,0]; G=rgb[...,1]; B=rgb[...,2]
    q=lambda v:np.clip((v+.5)*128/256-.5,0,127); rg=samp(REG[ry:ry+128,rx:rx+128],q(xx),q(yy)); gm=rg[...,0]/255; sx=rg[...,1]/255*511; sy=rg[...,2]/255*511
    kc=np.clip((R-1.65*np.maximum(G,B)-12)/28,0,1)*np.clip((R-35)/35,0,1); wk=samp(kit,sx,sy); m=gm*kc*np.clip(wk[...,3]/255*4,0,1)
    cn=samp(NEU[...,None],sx,sy)[...,0]; shade=np.clip(R/np.maximum(cn,50),.55,1.45)[...,None]
    out=rgb*(1-m[...,None])+np.clip(wk[...,:3]*shade,0,255)*m[...,None]
    wc=samp(chest,sx,sy); ca=(wc[...,3]/255*m)[...,None]; out=out*(1-ca)+wc[...,:3]*ca
    a=np.clip(capM*1.8,0,1)[...,None] # 모자 가장자리 붉은 테(인계 문서에 언급)를 덮도록 가장자리 알파를 키운다
    out=out*(1-a)+np.array(capRGB,np.float32)*(R/255)[...,None]*a
    s_x,s_y,tx,ty=ident['cap_mark_transform_512']; mx=(xx-tx/2)/s_x; my=(yy-ty/2)/s_y; wm=samp(capmark,mx,my); inside=((mx>=0)&(mx<=255)&(my>=0)&(my<=255)).astype(np.float32)
    ma=(wm[...,3]/255*capM*inside)[...,None]; out=out*(1-ma)+wm[...,:3]*ma
    return Image.fromarray(np.clip(out+.5,0,255).astype(np.uint8),'RGB')
I=M7['identities']; CO=sorted([x for x in I if x['role_group']=='manager_coach'],key=lambda x:x['cell_index']); CV=sorted([x for x in I if x['sheet_group']=='civilian'],key=lambda x:x['cell_index'])
assert len(CO)==60 and len(CV)==66
sheets={}
for t in M5['teams']:
    if t['key']=='korea': continue
    tid=[i for i,(c,n) in enumerate(TD) if c+' '+n==t['name']]
    if len(tid)!=1: sys.exit('게임 구단과 맞지 않는 이름: '+t['name'])
    K=M5['kits'][t['key']]['home']; kit=load(A5[K['kit_overlay']]['png']['512']); chest=load(A5[K['chest']]['png']['512'])
    capmark=np.asarray(Image.open(os.path.join(D5B,A5[K['cap']]['png']['512'])).convert('RGBA').resize((256,256),Image.LANCZOS)).astype(np.float32)
    h=K['cap_color'].lstrip('#'); capRGB=[int(h[i:i+2],16) for i in (0,2,4)]
    sh=Image.new('RGB',(1280,1280))
    for x in CO: i=x['cell_index']; sh.paste(coach(x,kit,chest,capmark,capRGB).resize((128,128),Image.LANCZOS),((i%10)*128,(i//10)*128))
    o=io.BytesIO(); sh.save(o,'WEBP',quality=80,method=6); sheets[str(tid[0])]='data:image/webp;base64,'+base64.b64encode(o.getvalue()).decode()
    if os.environ.get('PREVIEW'): sh.save(os.path.join(os.environ['PREVIEW'],'coach_'+t['key']+'.png'))
def raw(rel): return 'data:image/webp;base64,'+base64.b64encode(open(os.path.join(D7,rel),'rb').read()).decode()
data={'coach':{'ids':[{'c':x['cell_index'],'a':x['age'],'g':int(bool(x['tags'].get('glasses')))} for x in CO],'sheet':sheets},
      'civ':{'ids':[{'c':x['cell_index'],'r':x['role_group'],'a':x['age'],'f':int(x['sex']=='female')} for x in CV],'s128':raw('sheets/civilian/128/staff01.webp'),'s256':raw('sheets/civilian/256/staff01.webp')}}
body='/* 자동 생성: python3 tools/gen-staff-v7.py (손으로 고치지 않는다). v7 실사 얼굴 시범: coach(감독·코치 60, 구단 홈 유니폼 128px 시트, c=칸), civ(단장 gm·구단주 owner·직원 front 66, RGB 128·256 시트, f=여성) */\nconst FACE7='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n'
open(source_file('ui','00e_staff_faces_data.js'),'w',encoding='utf8').write(body)
print('감독·코치 시트 %d개 구단, 시민 %d명 · %dKB'%(len(sheets),len(CV),len(body)//1024))
