"""v9 젊은 단장 60명(assets/v9/gm01) + v10 여성 스태프 40명(assets/v10/women01) → src/ui/assets/00g_more_faces_data.js
 - 128px 시트만 넣는다. 실행 때 FACE8 뒤에 이어 붙여(칸 번호 그대로) 같은 방식으로 쓴다.
 - 역할(r): gm 단장, front 프런트 직원(여), staff 분석원·코치 보조(여)
 사용: python3 tools/gen-people-v9v10.py  (사진을 바꿨을 때만)"""
import json, os, base64
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ids=[]; sheets=[]
for v,d in (('9','assets/v9/gm01'),('10','assets/v10/women01')):
    D=os.path.join(ROOT,d); M=json.load(open(os.path.join(D,'manifest.json'),encoding='utf8'))
    pages=sorted({x['sheets']['128']['path'] for x in M['identities']})
    for p in pages: sheets.append('data:image/webp;base64,'+base64.b64encode(open(os.path.join(D,p),'rb').read()).decode())
    base=len(sheets)-len(pages)
    for x in M['identities']: ids.append({'r':x['r'],'a':x['age'],'f':int(bool(x['f'])),'p':base+pages.index(x['sheets']['128']['path']),'c':x['sheets']['128']['index'],'v':v})
F={'ids':ids,'s128':sheets}
out=os.path.join(ROOT,'src','ui','assets','00g_more_faces_data.js')
open(out,'w',encoding='utf8').write('/* 자동 생성: python3 tools/gen-people-v9v10.py (손으로 고치지 않는다). v9 단장 60명·v10 여성 스태프 40명. FACE8 뒤에 이어 붙인다 */\nconst FACE9='+json.dumps(F,ensure_ascii=False,separators=(',',':'))+';\nif(typeof FACE8!==\'undefined\'){ const o=FACE8.s128.length; for(const x of FACE9.ids)FACE8.ids.push(Object.assign({},x,{p:x.p+o})); FACE8.s128.push(...FACE9.s128); }\n')
print('완료',out,os.path.getsize(out),len(ids))
