"""v15 젊은 치어리더 단원 40명(assets/v15/cheer_young) + v16 우승 트로피 작은 사진 3장(assets/v16/champ/trophy/app)
 → src/ui/assets/00h_cheer15_data.js
 - 단원: 256px 시트의 앞 4줄(40칸)만 잘라 WebP q72로 넣는다(카드가 크게 보여 128px은 흐렸다, 사용자 11-09). FACE8 뒤에 r:'cheer15'로 붙는다
 - 트로피: 128px WebP(투명) 3장을 그대로 넣는다(TRO16). 장면·배너·큰 트로피는 사이트에서 따로 받는다(tools/build-site.cjs)
 사용: python3 tools/gen-v15v16.py  (사진을 바꿨을 때만)"""
import json, os, base64, io
from PIL import Image
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P=lambda p:os.path.join(ROOT,p)
M=json.load(open(P('assets/v15/cheer_young/manifest.json'),encoding='utf8'))
ids=M['identities']; assert len(ids)==40
sheet='sheets/256/cheer_young.webp'
ids_out=[]
for i,x in enumerate(ids):
    s=x['sheets']['256']; r=s['rect']; assert s['path']==sheet and r==[(i%10)*256,(i//10)*256,256,256], x['id']
    ids_out.append({'r':'cheer15','a':x['a'],'f':1,'p':0,'c':i,'v':'15','z':256})
bio=io.BytesIO(); Image.open(P('assets/v15/cheer_young/'+sheet)).convert('RGB').crop((0,0,2560,1024)).save(bio,'WEBP',quality=72,method=6)
s128=['data:image/webp;base64,'+base64.b64encode(bio.getvalue()).decode()]
tro={k:'data:image/webp;base64,'+base64.b64encode(open(P(f'assets/v16/champ/trophy/app/trophy_{k}_128.webp'),'rb').read()).decode() for k in ('series','season','ring')}
out=P('src/ui/assets/00h_cheer15_data.js')
open(out,'w',encoding='utf8').write('/* 자동 생성: python3 tools/gen-v15v16.py (손으로 고치지 않는다). v15 치어리더 단원 40명(FACE8 뒤, r:cheer15)·v16 우승 트로피 128px 3장(TRO16) */\n'
  +'const FACE15='+json.dumps({'ids':ids_out,'s128':s128},separators=(',',':'))+';\n'
  +'const TRO16='+json.dumps(tro,separators=(',',':'))+';\n'
  +"if(typeof FACE8!=='undefined'){ const o=FACE8.s128.length; for(const x of FACE15.ids)FACE8.ids.push(Object.assign({},x,{p:x.p+o})); FACE8.s128.push(...FACE15.s128); }\n")
print('완료',out,os.path.getsize(out))
