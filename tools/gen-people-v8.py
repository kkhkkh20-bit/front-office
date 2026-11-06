"""v8 남은 인물 실사 얼굴(코덱스 납품 assets/v8/people01, 120명) → src/ui/assets/00f_people_faces_data.js
 - 역할(r): agent 에이전트, doc 팀 닥터, sec 비서, scout 스카우트, ana 전력분석원, ceo 사장, fan 팬, press 기자, front 직원
 - 128px 시트 2장만 넣는다(256px는 용량이 커서 뺐다). 칸 = index%100, 시트 = index//100
 사용: python3 tools/gen-people-v8.py  (사진을 바꿨을 때만)"""
import json, os, base64
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D=os.path.join(ROOT,'assets','v8','people01')
M=json.load(open(os.path.join(D,'manifest.json'),encoding='utf8'))
ids=M['identities']; assert len(ids)==120
pages=sorted({x['sheets']['128']['path'] for x in ids})
uri=lambda p:'data:image/webp;base64,'+base64.b64encode(open(os.path.join(D,p),'rb').read()).decode()
meta=[{'r':x['r'],'a':x['age'],'f':int(bool(x['f'])),'p':pages.index(x['sheets']['128']['path']),'c':x['sheets']['128']['index']} for x in ids]
F={'v':'8','ids':meta,'s128':[uri(p) for p in pages]}
out=os.path.join(ROOT,'src','ui','assets','00f_people_faces_data.js')
open(out,'w',encoding='utf8').write('/* 자동 생성: python3 tools/gen-people-v8.py (손으로 고치지 않는다). v8 실사 얼굴 120명(에이전트·팀 닥터·비서·스카우트·분석원·사장·팬·기자·직원). ids[i]: r 역할·a 나이·f 여성·p 시트·c 칸 */\nconst FACE8='+json.dumps(F,ensure_ascii=False,separators=(',',':'))+';\n')
print('완료',out,os.path.getsize(out))
