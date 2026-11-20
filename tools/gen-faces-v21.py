#!/usr/bin/env python3
# Auto-generates src/ui/assets/00m_faces_v21_data.js from assets/v21/amateur200/manifest.json (v21b amateur faces, 200 identities).
import json, hashlib, os
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
M=json.load(open(os.path.join(R,'assets/v21/amateur200/manifest.json')))
base='assets/v21/amateur200/sheets/'
ids=sorted(M['identities'],key=lambda x:(x['sheet'],x['index']))
assert len(ids)==200 and [x['sheet']=='A' for x in ids].count(True)==100
h={}
for sh in ('A','B'):
  for cs in ('128','256','384'):
    for v in M['variant_keys']:
      p=os.path.join(R,base,sh,cs,v+'.webp'); h[f'{sh}{cs}/{v}']=hashlib.sha256(open(p,'rb').read()).hexdigest()[:8]
teams={"0":"seoul_comets","1":"seoul_hounds","2":"incheon_seagulls","3":"suwon_sparks","4":"goyang_storm","5":"daejeon_redfox","6":"gwangju_blazes","7":"daegu_thunders","8":"busan_waves","9":"changwon_anchors"}
J={"v":"21","r":M['revision'],"base":base,"pitch":{"128":144,"256":272,"384":400},"h":h,"teams":teams,
   "ids":[{"a":x['age'],"g":1 if x['tags'].get('glasses') else 0,"u":1 if x['level']!='hs' else 0} for x in ids]}
out='/* 자동 생성: python3 tools/gen-faces-v21.py (손으로 고치지 않는다). v21b 고교·대학 선수 사진 200명(A 0~99, B 100~199). 사진은 파일로 받는다: base+시트+"/"+크기+"/"+변형+".webp?v="+h[시트+크기+"/"+변형], 10x10 칸(pitch 144·272·400, 칸 안 8px). 변형: hs_home(고교)·univ(대학)·구단 열쇠(teams). ids[i]: a 나이·g 안경·u 대학 */\nconst FACE21='+json.dumps(J,ensure_ascii=False,separators=(',',':'))+';\n'
open(os.path.join(R,'src/ui/assets/00m_faces_v21_data.js'),'w').write(out)
print(len(h),'sheets', sum(1 for x in J['ids'] if x['u']),'univ')
