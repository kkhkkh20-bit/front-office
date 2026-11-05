"""v6c 실사 얼굴(완성본 100명 × 10구단 홈) → src/ui/assets/00d_faces_data.js
 - 코덱스 납품(assets/v6/batch01c/production100)의 WebP 시트를 다시 압축하지 않고 그대로 넣는다(합성·모자 처리 없음).
 - 시트 칸 간격은 manifest grid.pitch(128→144, 256→272), 사진은 칸 안 8px 안쪽(rect). 화면은 FACE6.pitch·FACE6.off로 자른다.
 - 원정 유니폼 시트는 없다(원정 중계에서도 홈 사진).
 사용: python3 tools/gen-faces-v6c.py  (얼굴 에셋을 바꿨을 때만)"""
import json, os, base64, re, sys
from source_manifest import source_file
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D=os.path.join(ROOT,'assets','v6','batch01c','production100')
M=json.load(open(os.path.join(D,'manifest.json'),encoding='utf8'))
src=open(source_file('engine','01_rules.js'),encoding='utf8').read()
TD=re.findall(r"\{city:'([^']+)',nick:'([^']+)'",src.split('const TEAM_DEF=[')[1].split('];')[0])
ids=M['identities']; assert len(ids)==100
for i,x in enumerate(ids):  # 시트 칸 순서 = manifest 순서(rect로 확인)
    r=x['variants']['seoul_comets']['sheets']['128']['rect']; assert r[0]==(i%10)*144+8 and r[1]==(i//10)*144+8, x['id']
uri=lambda p:'data:image/webp;base64,'+base64.b64encode(open(os.path.join(D,p),'rb').read()).decode()
sheet={}; big={}
for t in M['teams']:
    tid=[i for i,(c,n) in enumerate(TD) if c+' '+n==t['name']]
    if len(tid)!=1: sys.exit('게임 구단과 맞지 않는 이름: '+t['name'])
    v=ids[0]['variants'][t['key']]['sheets']; sheet[tid[0]]=uri(v['128']['path']); big[tid[0]]=uri(v['256']['path'])
assert len(sheet)==len(TD)==10
meta=[{'a':x['age'],'f':0 if x['ethnicity']=='Korean' else 1,'e':x['ethnicity'],'g':int(bool(x['tags'].get('glasses'))),'b':int(bool(x['tags'].get('facial_hair')))} for x in ids]
F={'v':'6c','pitch':{'128':144,'256':272},'off':8,'ids':meta,'sheet':{str(k):v for k,v in sheet.items()},'big':{str(k):v for k,v in big.items()}}
out=os.path.join(ROOT,'src','ui','assets','00d_faces_data.js')
open(out,'w',encoding='utf8').write('/* 자동 생성: python3 tools/gen-faces-v6c.py (손으로 고치지 않는다). v6c 실사 얼굴 완성본 100명 × 구단 홈 유니폼 10x10 시트(sheet 128px, big 256px: 선수 상세 큰 사진). 칸 간격 pitch, 사진은 칸 안 off px부터. ids[i]는 i번째 칸(a 나이·f 외국인·e 출신·g 안경·b 수염) */\nconst FACE6='+json.dumps(F,ensure_ascii=False,separators=(',',':'))+';\n')
print('완료',out,os.path.getsize(out))
