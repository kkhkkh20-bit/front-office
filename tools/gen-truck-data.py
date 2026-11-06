"""코덱스 트럭 시위 사진(assets/truck-protest, 480px) → src/ui/assets/00e_truck_data.js
 - 구단 × 장면(stadium_day·stadium_night·headquarters_day) 30장을 data URI로 넣는다. 전광판 문구는 text_safe_rect(비율) 위에 화면이 얹는다.
 사용: python3 tools/gen-truck-data.py  (트럭 사진을 바꿨을 때만)"""
import json, os, base64, re, sys
from source_manifest import source_file
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D=os.path.join(ROOT,'assets','truck-protest')
M=json.load(open(os.path.join(D,'manifest.json'),encoding='utf8'))
src=open(source_file('engine','01_rules.js'),encoding='utf8').read()
TD=re.findall(r"\{city:'([^']+)',nick:'([^']+)'",src.split('const TEAM_DEF=[')[1].split('];')[0])
key2tid={}
for t in M['teams']:
    tid=[i for i,(c,n) in enumerate(TD) if c+' '+n==t['name']]
    if len(tid)!=1: sys.exit('게임 구단과 맞지 않는 이름: '+t['name'])
    key2tid[t['key']]=tid[0]
img={}; rect={}
for x in M['images']:
    v=x['variants']['480']; W,H=v['width'],v['height']; r=v['text_safe_rect']
    rect[x['scene']]=[round(r[0]/W,4),round(r[1]/H,4),round(r[2]/W,4),round(r[3]/H,4)]
    img.setdefault(str(key2tid[x['team']]),{})[x['scene']]='data:image/webp;base64,'+base64.b64encode(open(os.path.join(D,v['path']),'rb').read()).decode()
assert len(img)==10 and all(len(v)==3 for v in img.values())
out=os.path.join(ROOT,'src','ui','assets','00e_truck_data.js')
open(out,'w',encoding='utf8').write('/* 자동 생성: python3 tools/gen-truck-data.py (손으로 고치지 않는다). 팬 트럭 시위 가상 보도 사진 480x270, 구단 id → 장면 → data URI. rect는 장면별 전광판 문구 칸(왼쪽·위·너비·높이 비율) */\nconst TRUCK6='+json.dumps({'rect':rect,'img':img},ensure_ascii=False,separators=(',',':'))+';\n')
print('완료',out,os.path.getsize(out))
