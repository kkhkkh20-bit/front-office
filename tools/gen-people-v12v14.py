"""v12 응원단·프런트 48명(assets/v12/cheer01) + v13 선수 얼굴 60명(assets/v6/batch01d/production60)
 + v14 치어리더 단원 12명·단장 나이 변화(assets/v14) → src/ui/assets/00h_more_faces2_data.js
 - 128px 시트만 넣는다(256px·장면 사진은 용량 때문에 빼고, 장면은 사이트에서 따로 받는다: tools/build-site.cjs).
 - v13: FACE6에 100번부터 이어 붙인다(구단 홈 유니폼 시트 sheet2, 칸 간격·여백은 v6c와 같음).
 - v12·v14 인물: FACE8 뒤에 이어 붙인다. 역할(r): clead 응원단장, ccap 치어리더 팀장, front 프런트 직원(남), cheer 치어리더 단원, gmage 단장 나이 변화
 - 단장 나이 변화: b = v9 단장 몇 번째(0부터), s = 10·20(나이 단계). +0 사진은 쓰지 않는다(지금 v9 사진 그대로)
 사용: python3 tools/gen-people-v12v14.py  (사진을 바꿨을 때만)"""
import json, os, base64, re, sys
from source_manifest import source_file
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J=lambda p:json.load(open(os.path.join(ROOT,p),encoding='utf8'))
uri=lambda p:'data:image/webp;base64,'+base64.b64encode(open(os.path.join(ROOT,p),'rb').read()).decode()
# v13 선수 얼굴: 구단 이름으로 게임 구단 ID에 맞춘다
src=open(source_file('engine','01_rules.js'),encoding='utf8').read()
TD=re.findall(r"\{city:'([^']+)',nick:'([^']+)'",src.split('const TEAM_DEF=[')[1].split('];')[0])
M13=J('assets/v6/batch01d/production60/manifest.json'); ids13=M13['identities']; assert len(ids13)==60 and M13['grid']['pitch']['128']==144 and M13['grid']['padding']==8
for i,x in enumerate(ids13):
    r=x['variants']['seoul_comets']['sheets']['128']['rect']; assert r[0]==(i%10)*144+8 and r[1]==(i//10)*144+8, x['id']
s2={}
for t in M13['teams']:
    tid=[i for i,(c,n) in enumerate(TD) if c+' '+n==t['name']]
    if len(tid)!=1: sys.exit('게임 구단과 맞지 않는 이름: '+t['name'])
    s2[str(tid[0])]=uri(ids13[0]['variants'][t['key']]['sheets']['128']['path'])
assert len(s2)==len(TD)
m13=[{'a':x['age'],'f':0 if x['ethnicity']=='Korean' else 1,'e':x['ethnicity'],'g':int(bool(x['tags'].get('glasses'))),'b':int(bool(x['tags'].get('facial_hair')))} for x in ids13]
# v12·v14 인물(FACE8 뒤에 붙임)
ids=[]; sheets=[]
def add(base,M,row):
    pages=sorted({x['sheets']['128']['path'] for x in M['identities']})
    for p in pages: sheets.append(uri(base+p))
    o=len(sheets)-len(pages)
    for x in M['identities']:
        r=x['sheets']['128']['rect']; c=r[1]//128*10+r[0]//128
        e=row(x)
        if e: ids.append({**e,'a':x['a'],'f':int(bool(x['f'])),'p':o+pages.index(x['sheets']['128']['path']),'c':c,'v':'12'})
add('assets/v12/cheer01/',J('assets/v12/cheer01/manifest.json'),lambda x:{'r':x['r']})
add('assets/v14/cheer/portraits/',J('assets/v14/cheer/portraits/manifest.json'),lambda x:{'r':'cheer'})
v9=[x['id'] for x in J('assets/v9/gm01/manifest.json')['identities']]
add('assets/v14/gm_age/',J('assets/v14/gm_age/manifest.json'),lambda x:{'r':'gmage','b':v9.index(x['base']),'s':x['age_step']} if x['age_step'] in (10,20) else None)
assert sum(x['r']=='gmage' for x in ids)==40 and sum(x['r']=='cheer' for x in ids)==12
F={'f6':{'ids':m13,'sheet2':s2},'ids':ids,'s128':sheets}
out=os.path.join(ROOT,'src','ui','assets','00h_more_faces2_data.js')
open(out,'w',encoding='utf8').write('/* 자동 생성: python3 tools/gen-people-v12v14.py (손으로 고치지 않는다). v13 선수 얼굴 60명(FACE6 100번부터, sheet2)·v12 응원단장·치어리더 팀장·프런트 48명·v14 치어리더 단원 12명·단장 나이 변화 40장(FACE8 뒤) */\n'
  +'const FACE12='+json.dumps(F,ensure_ascii=False,separators=(',',':'))+';\n'
  +"if(typeof FACE6!=='undefined'&&FACE6.ids.length===100){ FACE6.ids.push(...FACE12.f6.ids); FACE6.sheet2=FACE12.f6.sheet2; }\n"
  +"if(typeof FACE8!=='undefined'){ const o=FACE8.s128.length, v9=FACE8.ids.findIndex(x=>x.v==='9'); for(const x of FACE12.ids)FACE8.ids.push(Object.assign({},x,{p:x.p+o},x.b!=null?{b:v9+x.b}:{})); FACE8.s128.push(...FACE12.s128); }\n")
print('완료',out,os.path.getsize(out),len(ids))
