#!/usr/bin/env python3
"""에셋 패키지 v2.1(assets/v2_1)·v3(assets/v3) → src/ui/assets/00b_assets_data.js
 - 트로피·대기록은 v4 실사 렌더 WebP, 국가대표 배지·대회 마크·구장 배경은 v2.1
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
def v3():
    """에셋 v3(assets/v3): 시상식 무대·포스트시즌 대진표 배경만(트로피·대기록은 v4로 바뀜)"""
    def w3(id,w,q=70): im=Image.open(io.BytesIO(r3(A3[id]['webp']['1920']))).convert('RGB'); im=im.resize((w,round(im.height*w/im.width)),Image.LANCZOS); o=io.BytesIO(); im.save(o,'WEBP',quality=q,method=6); return 'data:image/webp;base64,'+base64.b64encode(o.getvalue()).decode()
    return {'stage':w3('awards_stage',1280),'bracket':w3('postseason_bracket_background',1280)}
D4=os.path.join(ROOT,'assets','v4'); M4=json.load(open(os.path.join(D4,'manifest.json'),encoding='utf8')); A4=M4['assets']
S4=json.load(open(os.path.join(D4,'checksums.json'),encoding='utf8'))['files']
V4W={'championship_trophy':192,'golden_glove':320,'mvp_trophy':112,'rookie_trophy':112} # 화면 최대 표시(96·160·56px)의 약 2배. 나머지는 48px 이하라 96px
def v4():
    """에셋 v4(assets/v4) 실사 PBR 렌더(투명 PNG 512) → 표시 크기의 약 2배 WebP. ID는 v3와 같다. 글자가 구워진 상패(batting_title·pitching_title)는 빼고 _blank를 쓴다.
    글자 자리는 512 기준 [x,윗변 y,w,옆변 높이,최대 글자 크기,색,512,기울기(도)]: v4 명판은 3/4 투시라 윗변·밑변이 같은 각도로 기운 평행사변형(quad)"""
    import math
    def img(k,w):
        rel=A4[k]['png']['512']; b=open(os.path.join(D4,rel),'rb').read()
        if hashlib.sha256(b).hexdigest()!=S4[rel]['sha256']: sys.exit('체크섬 불일치: '+rel)
        im=Image.open(io.BytesIO(b)).convert('RGBA').resize((w,w),Image.LANCZOS); o=io.BytesIO(); im.save(o,'WEBP',quality=78,method=6,alpha_quality=90); return 'data:image/webp;base64,'+base64.b64encode(o.getvalue()).decode()
    def sl(v): q=v['quad']; (a,b),(c,d)=v['baseline_segment']; return [round(q[0][0],1),round(q[0][1],1),round(q[1][0]-q[0][0],1),round(q[3][1]-q[0][1],1),v['max_font_size'],v['fill'],512,round(math.degrees(math.atan2(d-b,c-a)),2)]
    ids=[k for k in M4['collections']['trophies'] if k not in ('batting_title','pitching_title')]+M4['collections']['feats']
    slot={k:{n:sl(v) for n,v in A4[k]['text_slots'].items() if n in ('department','honoree_name','record_value')} for k in ids}
    return {'img':{k:img(k,V4W.get(k,96)) for k in ids},'slot':{k:v for k,v in slot.items() if v}}
D5=os.path.join(ROOT,'assets','v5'); A5=json.load(open(os.path.join(D5,'manifest.json'),encoding='utf8'))['assets']
D5B=os.path.join(ROOT,'assets','v5b'); A5B=json.load(open(os.path.join(D5B,'manifest.json'),encoding='utf8'))['assets']
D5C=os.path.join(ROOT,'assets','v5c'); A5C=json.load(open(os.path.join(D5C,'manifest.json'),encoding='utf8'))['assets']
def w5(id,w,base=None):
    """v5 실사 PNG(투명) → 표시 크기의 약 2배 WebP. 원본 512를 줄여 넣는다"""
    A,DD={'b':(A5B,D5B),'c':(A5C,D5C)}.get(base,(A5,D5)); im=Image.open(os.path.join(DD,A[id]['png'][max(A[id]['png'],key=int)])).convert('RGBA'); im=im.resize((w,round(im.height*w/im.width)),Image.LANCZOS); o=io.BytesIO(); im.save(o,'WEBP',quality=78,method=6); return 'data:image/webp;base64,'+base64.b64encode(o.getvalue()).decode()
def kit(t):
    """v5b 실사 유니폼(주름 수정판, 번호 없는 앞면)·v5 모자. 구단 key로 찾는다. 홈/원정 구분"""
    k=t['key']; b='c' if k=='korea' else 'b'; return {'h':w5(k+'_home_front',240,b),'a':w5(k+'_away_front',240,b),'c':w5(k,240,'c' if k=='korea' else None)} # 국가대표는 v5c(필기체 Korea·K)
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
 'v3':v3(),'v4':v4()}
body='/* 자동 생성: python3 tools/gen-assets.py (손으로 고치지 않는다). 에셋 패키지 v2.1(assets/v2_1)·v3(assets/v3 무대·대진표 배경)·v4 실사 트로피·대기록(assets/v4)·v5 유니폼·모자(assets/v5). uni 키는 게임 구단 ID(TEAM_DEF 순서, 구단명으로 대조). 구장 배경은 공용 분위기 이미지(특정 구장·구장 효과와 무관) */\nconst ASSET='+json.dumps(out,ensure_ascii=False)+';\n'
open(source_file('ui','00b_assets_data.js'),'w',encoding='utf8').write(body)
print('유니폼·모자 %d개 구단: %s · %dKB'%(len(uni),', '.join(f"{i}={u['n']}" for i,u in sorted(uni.items())),len(body)//1024))
