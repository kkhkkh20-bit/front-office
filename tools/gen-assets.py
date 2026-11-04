#!/usr/bin/env python3
"""에셋 패키지 v2.1(assets/v2_1)·v3(assets/v3) → src/ui/assets/00b_assets_data.js
 - 유니폼·모자·트로피·대기록은 v3 SVG, 국가대표 배지·대회 마크·구장 배경은 v2.1
 - manifest.json의 구단명(예: "서울 코메츠")을 엔진 TEAM_DEF의 원래 '연고지 별칭'과 맞춰 구단 ID에 연결(배열 순서·파일 이름 순서를 ID로 쓰지 않음)
 - 단일 HTML 배포라 data URI로 넣는다. v2.1 PNG는 표시 크기의 약 2배로 줄여 넣는다: 국가대표 배지 64/128px, 구장 배경 960px(webp)
 - 대회 마크·트로피는 작은 SVG 그대로(밝은 글자색 버전: 이 게임은 어두운 화면)
 사용: python3 tools/gen-assets.py  (에셋을 바꿨을 때만 다시 실행)"""
import json, re, io, base64, hashlib, os, sys
from PIL import Image
from source_manifest import source_file
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); D=os.path.join(ROOT,'assets','v2_1')
src=open(source_file('engine','01_rules.js'),encoding='utf8').read()
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
D3=os.path.join(ROOT,'assets','v3'); M3=json.load(open(os.path.join(D3,'manifest.json'),encoding='utf8')); A3=M3['assets']
S3=json.load(open(os.path.join(D3,'checksums.json'),encoding='utf8'))['files'] if os.path.exists(os.path.join(D3,'checksums.json')) else {}
def r3(rel):
    b=open(os.path.join(D3,rel),'rb').read(); h=(S3.get(rel) or {}).get('sha256')
    if h and hashlib.sha256(b).hexdigest()!=h: sys.exit('체크섬 불일치: '+rel)
    return b
def s3(id): return 'data:image/svg+xml;base64,'+base64.b64encode(r3(A3[id]['svg'])).decode()
def v3():
    """에셋 v3(assets/v3): manifest ID로 찾는다. 트로피·대기록은 SVG 그대로(작은 아이콘부터 큰 무대까지 한 장, PNG보다 작음).
    글자 자리(text_slots)는 [x,y,w,h,최대 글자 크기,색,viewBox 폭]으로 넘겨 화면에서 HTML로 겹친다. 글자가 구워진 상패(batting_title·pitching_title)는 넣지 않는다"""
    def w3(id,w,q=70): im=Image.open(io.BytesIO(r3(A3[id]['webp']['1920']))).convert('RGB'); im=im.resize((w,round(im.height*w/im.width)),Image.LANCZOS); o=io.BytesIO(); im.save(o,'WEBP',quality=q,method=6); return 'data:image/webp;base64,'+base64.b64encode(o.getvalue()).decode()
    ids=[k for k in M3['collections']['trophies'] if k not in ('batting_title','pitching_title')]+M3['collections']['feats']
    slot={k:{n:v['rect']+[v['max_font_size'],v['fill'],A3[k]['view_box'][2]] for n,v in A3[k]['text_slots'].items() if n in ('department','honoree_name','record_value')} for k in ids}
    return {'svg':{k:s3(k) for k in ids},'slot':{k:v for k,v in slot.items() if v},'stage':w3('awards_stage',1280),'bracket':w3('postseason_bracket_background',1280)}
def kit(t):
    """v3 유니폼(번호 없는 앞면: 24는 디자인 예시라 쓰지 않는다)·모자. 홈/원정 구분"""
    U=t['uniform_sets']; return {'h':s3(U['home']['front']),'a':s3(U['away']['front']),'c':s3(t['cap'])}
uni={}; seen=set()
for t in M3['teams']:
    ids=[i for i,(c,n) in enumerate(TD) if c+' '+n==t['name']]
    if len(ids)!=1: sys.exit('게임 구단과 맞지 않는 이름: '+t['name'])
    i=ids[0]; seen.add(i)
    uni[i]={'k':t['key'],'n':t['name'],**kit(t)}
if len(seen)!=len(TD): sys.exit('유니폼이 없는 구단이 있음')
out={'uni':uni,
 'nat':{'b64':png('national/korea_badge_64.png',64),'b128':png('national/korea_badge_128.png',128),**kit(M3['national'])},
 'comp':{'ps':svg('competition/postseason_mark_light.svg'),'ks':svg('competition/korean_series_mark_light.svg'),'trophy':svg('competition/championship_trophy.svg')},
 'stad':{k:webp(v,960) for k,v in M['backgrounds'].items()},
 'v3':v3()}
body='/* 자동 생성: python3 tools/gen-assets.py (손으로 고치지 않는다). 에셋 패키지 v2.1(assets/v2_1)·v3(assets/v3). uni 키는 게임 구단 ID(TEAM_DEF 순서, 구단명으로 대조). 구장 배경은 공용 분위기 이미지(특정 구장·구장 효과와 무관) */\nconst ASSET='+json.dumps(out,ensure_ascii=False)+';\n'
open(source_file('ui','00b_assets_data.js'),'w',encoding='utf8').write(body)
print('유니폼·모자 %d개 구단: %s · %dKB'%(len(uni),', '.join(f"{i}={u['n']}" for i,u in sorted(uni.items())),len(body)//1024))
