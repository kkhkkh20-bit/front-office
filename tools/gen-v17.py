"""v17 소속 없는 외국인 선수 60명(assets/v17/foreign_free) → src/ui/assets/00i_foreign17_data.js
 - 256px 시트(피치 272·여백 8, v6c와 같은 배열)의 앞 6줄만 잘라 WebP q72로 넣는다. 작은 자리와 큰 자리 모두 이 시트에서 자른다
 - ids: a=나이, n=국가 키(US·DO·JP…), q=아시아쿼터 자격
 사용: python3 tools/gen-v17.py  (사진을 바꿨을 때만)"""
import json, os, base64, io
from PIL import Image
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
B=os.path.join(ROOT,'assets/v17/foreign_free/')
M=json.load(open(B+'manifest.json',encoding='utf8'))
ids=M['identities']; assert len(ids)==60
out_ids=[]
for i,x in enumerate(ids):
    r=x['sheets']['256']['rect']; assert r==[8+(i%10)*272,8+(i//10)*272,256,256], x['id']
    out_ids.append({'a':x['a'],'n':x['country'],'q':1 if x['asia'] else 0})
bio=io.BytesIO(); Image.open(B+'sheets/256/foreign_free.webp').convert('RGB').crop((0,0,2720,8+6*272)).save(bio,'WEBP',quality=72,method=6)
out=os.path.join(ROOT,'src/ui/assets/00i_foreign17_data.js')
open(out,'w',encoding='utf8').write('/* 자동 생성: python3 tools/gen-v17.py (손으로 고치지 않는다). v17 소속 없는 외국인 선수 60명(무지 훈련복) */\n'
  +'const FACE17='+json.dumps({'ids':out_ids,'s256':'data:image/webp;base64,'+base64.b64encode(bio.getvalue()).decode()},separators=(',',':'))+';\n')
print('완료',out,os.path.getsize(out))
