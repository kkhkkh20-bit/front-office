#!/usr/bin/env python3
"""에셋 패키지 v2.1(assets/v2_1) → src/ui/00b_assets_data.js
 - manifest.json의 구단명(예: "서울 코메츠")을 엔진 TEAM_DEF의 원래 '연고지 별칭'과 맞춰 구단 ID에 연결(배열 순서·파일 이름 순서를 ID로 쓰지 않음)
 - 단일 HTML 배포라 data URI로 넣는다. 표시 크기의 약 2배로 줄여 넣는다: 유니폼 192px, 모자 160px, 국가대표 배지 64/128px, 구장 배경 960px(webp)
 - 대회 마크·트로피는 작은 SVG 그대로(밝은 글자색 버전: 이 게임은 어두운 화면)
 사용: python3 tools/gen-assets.py  (에셋을 바꿨을 때만 다시 실행)"""
import json, re, io, base64, hashlib, os, sys
from PIL import Image
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); D=os.path.join(ROOT,'assets','v2_1')
src=open(os.path.join(ROOT,'src','engine','01_rules.js'),encoding='utf8').read()
TD=re.findall(r"\{city:'([^']+)',nick:'([^']+)'",src.split('const TEAM_DEF=[')[1].split('];')[0])
M=json.load(open(os.path.join(D,'manifest.json'),encoding='utf8'))
sums=json.load(open(os.path.join(D,'checksums.json'),encoding='utf8')) if os.path.exists(os.path.join(D,'checksums.json')) else {}
def raw(rel):
    p=os.path.join(D,rel); b=open(p,'rb').read()
    if rel in sums and hashlib.sha256(b).hexdigest()!=sums[rel]: sys.exit('체크섬 불일치: '+rel)
    return b
def png(rel,w):
    im=Image.open(io.BytesIO(raw(rel))).convert('RGBA'); h=round(im.height*w/im.width); im=im.resize((w,h),Image.LANCZOS); o=io.BytesIO(); im.save(o,'PNG',optimize=True); return 'data:image/png;base64,'+base64.b64encode(o.getvalue()).decode()
def webp(rel,w,q=72):
    im=Image.open(io.BytesIO(raw(rel))).convert('RGB'); h=round(im.height*w/im.width); im=im.resize((w,h),Image.LANCZOS); o=io.BytesIO(); im.save(o,'WEBP',quality=q,method=6); return 'data:image/webp;base64,'+base64.b64encode(o.getvalue()).decode()
def svg(rel): return 'data:image/svg+xml;base64,'+base64.b64encode(raw(rel)).decode()
uni={}; seen=set()
for t in M['teams']:
    ids=[i for i,(c,n) in enumerate(TD) if c+' '+n==t['name']]
    if len(ids)!=1: sys.exit('게임 구단과 맞지 않는 이름: '+t['name'])
    i=ids[0]; k=t['key']; seen.add(i)
    uni[i]={'k':k,'n':t['name'],'h':png(f'uniforms/{k}_home.png',192),'a':png(f'uniforms/{k}_away.png',192),'c':png(f'caps/{k}.png',160)}
if len(seen)!=len(TD): sys.exit('유니폼이 없는 구단이 있음')
out={'uni':uni,
 'nat':{'b64':png('national/korea_badge_64.png',64),'b128':png('national/korea_badge_128.png',128),'h':png('uniforms/korea_home.png',192),'a':png('uniforms/korea_away.png',192),'c':png('caps/korea.png',160)},
 'comp':{'ps':svg('competition/postseason_mark_light.svg'),'ks':svg('competition/korean_series_mark_light.svg'),'trophy':svg('competition/championship_trophy.svg')},
 'stad':{k:webp(v,960) for k,v in M['backgrounds'].items()}}
body='/* 자동 생성: python3 tools/gen-assets.py (손으로 고치지 않는다). 에셋 패키지 v2.1(assets/v2_1). uni 키는 게임 구단 ID(TEAM_DEF 순서, 구단명으로 대조). 구장 배경은 공용 분위기 이미지(특정 구장·구장 효과와 무관) */\nconst ASSET='+json.dumps(out,ensure_ascii=False)+';\n'
open(os.path.join(ROOT,'src','ui','00b_assets_data.js'),'w',encoding='utf8').write(body)
print('유니폼·모자 %d개 구단: %s · %dKB'%(len(uni),', '.join(f"{i}={u['n']}" for i,u in sorted(uni.items())),len(body)//1024))
