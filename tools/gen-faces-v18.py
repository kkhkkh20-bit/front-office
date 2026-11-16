"""v18 선수 얼굴 200명(assets/v18/production200) → src/ui/assets/00j_faces_v18_data.js
 - FACE6에 160번부터 이어 붙인다(v6c 0~99, v13 100~159 다음 칸, 빈 번호 없이). v18_001 → 160, v18_200 → 359.
 - 시트 A(외국인 60·아시아쿼터 20·국내 20) = 160~259, 시트 B(국내 100, 어린 선수 위주) = 260~359. 칸 순서 = manifest 순서(rect로 확인).
 - 사진은 HTML에 넣지 않는다(index.html이 이미 무겁다). 화면은 같은 경로의 파일을 받는다:
   목록·카드는 128px 시트, 선수 상세 큰 사진은 384px 시트(v18b, 받는 동안·못 받으면 256→128, 77_assets_ui.js face18Src·face18Bust). 사이트 배포는 tools/build-site.cjs v18Faces.
 - v18b 재납품(1fb16fd2): 흰 배경 4명(v18_165·169·170·174 = 324·328·329·333)을 회색 배경으로 고쳐 배정 제외를 풀었다. 256은 다시 내보냈고 384가 새로 생겼다.
   시트 파일 이름이 그대로라 브라우저 캐시(사이트 /assets/* immutable)가 옛 사진을 쓰지 않게 크기·시트별 해시 h를 주소 뒤 ?v=로 붙인다.
 - 구단은 이름으로 게임 구단 ID에 맞춘다(엔진 TEAM_DEF). 확장 구단(11·12)은 유니폼 시트가 없어 기존처럼 사진 없음.
 - ids[i]: a 나이·f 외국인·e 출신·g 안경·b 수염, x=1이면 배정 후보에서 뺌(SKIP).
 사용: python3 tools/gen-faces-v18.py  (얼굴 에셋을 바꿨을 때만)"""
import json, os, re, sys
from source_manifest import source_file
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE='assets/v18/production200'
M=json.load(open(os.path.join(ROOT,BASE,'manifest.json'),encoding='utf8'))
OFFSET=160  # v13까지 160명(00h_more_faces2_data.js)
# 새 배정에서 뺄 얼굴(x=1). v18 첫 연결 때 흰 배경 4명을 뺐고 v18b에서 회색 배경으로 고쳐 다시 넣었다. 지금은 없음
SKIP=set()
SIZES=(('128',144),('256',272),('384',400))
src=open(source_file('engine','01_rules.js'),encoding='utf8').read()
TD=re.findall(r"\{city:'([^']+)',nick:'([^']+)'",src.split('const TEAM_DEF=[')[1].split('];')[0])
g=M['grid']; assert g['columns']==10 and g['rows']==10 and g['padding']==8 and g['pitch']['128']==144 and g['pitch']['256']==272 and g['pitch']['384']==400
ids=M['identities']; assert len(ids)==200
for k,x in enumerate(ids):
    sh='A' if k<100 else 'B'; c=k%100
    assert x['id']=='v18_%03d'%(k+1) and x['sheet']==sh and x['index']==c, x['id']
    for t in M['teams']:
        for cs,P in SIZES:
            v=x['variants'][t['key']]['sheets'][cs]
            assert v['path']==f"{BASE}/sheets/{sh}/{cs}/{t['key']}.webp" and v['rect']==[(c%10)*P+8,(c//10)*P+8,int(cs),int(cs)], (x['id'],t['key'],cs)
assert SKIP<={x['id'] for x in ids}
teams={}
for t in M['teams']:
    tid=[i for i,(c,n) in enumerate(TD) if c+' '+n==t['name']]
    if len(tid)!=1: sys.exit('게임 구단과 맞지 않는 이름: '+t['name'])
    for sh in 'AB':
        for cs,_ in SIZES:
            if not os.path.isfile(os.path.join(ROOT,BASE,'sheets',sh,cs,t['key']+'.webp')): sys.exit('시트 없음: '+sh+'/'+cs+'/'+t['key'])
    teams[str(tid[0])]=t['key']
assert len(teams)==len(TD)==10
meta=[]
for x in ids:
    e={'a':x['age'],'f':0 if x['ethnicity']=='Korean' else 1,'e':x['ethnicity'],'g':int(bool(x['tags'].get('glasses'))),'b':int(bool(x['tags'].get('facial_hair')))}
    if x['id'] in SKIP: e['x']=1
    meta.append(e)
import hashlib
h={}
for sh in 'AB':
    for cs,_ in SIZES:
        L=sorted(x['sha256'] for x in M['sheets'] if x['sheet']==sh and str(x['cell_size'])==cs); assert len(L)==10,(sh,cs)
        for x in M['sheets']:
            if x['sheet']==sh and str(x['cell_size'])==cs: assert hashlib.sha256(open(os.path.join(ROOT,x['path']),'rb').read()).hexdigest()==x['sha256'], x['path']
        h[sh+cs]=hashlib.sha256(''.join(L).encode()).hexdigest()[:8]
F={'v':'18','r':M.get('revision','v18'),'o':OFFSET,'base':BASE+'/sheets/','pitch':{cs:P for cs,P in SIZES},'h':h,'teams':teams,'ids':meta}
out=os.path.join(ROOT,'src','ui','assets','00j_faces_v18_data.js')
open(out,'w',encoding='utf8').write('/* 자동 생성: python3 tools/gen-faces-v18.py (손으로 고치지 않는다). v18 선수 얼굴 200명(FACE6 160번부터). 사진은 파일로 받는다: '
  +"base+'A|B/128|256|384/'+teams[구단 ID]+'.webp?v='+h[시트+크기], 10x10 칸(pitch 144·272·400, 칸 안 8px). ids[i]: a 나이·f 외국인·e 출신·g 안경·b 수염·x 배정 제외 */\n"
  +'const FACE18='+json.dumps(F,ensure_ascii=False,separators=(',',':'))+';\n'
  +"if(typeof FACE6!=='undefined'&&FACE6.ids.length===FACE18.o){ FACE6.ids.push(...FACE18.ids); FACE6.v18=FACE18; }\n")
print('완료',out,os.path.getsize(out),len(meta),'제외',sorted(SKIP))
