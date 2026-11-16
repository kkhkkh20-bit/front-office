"""v19 비서 20명(assets/v19/secretary20, 여 16·남 4) → src/ui/assets/00k_people_v19_data.js
 - 사진은 HTML에 넣지 않는다(index.html이 이미 무겁다). 화면은 같은 경로의 파일을 받는다: 작은 자리 128px, 큰 자리 256px 시트.
   사이트 배포는 tools/build-site.cjs v19People. 내려받은 HTML처럼 파일을 못 받으면 예전 v8 비서 사진(FACE8, HTML에 들어 있음)으로 돌아간다.
 - 칸: 10x10 중 앞 20칸, pitch 144·272, 칸 안 8px 검은 여백. 칸 번호 = ids 순서(manifest index, rect로 확인)
 - ids[i]: a 나이·f 여성·g 안경. 배정·고르기는 77_assets_ui.js secIdx(새 배정은 v19, v8 비서 8명은 소식함 '템플릿' 고르기 후보로 남김)
 - 주소 뒤 ?v=는 시트 해시(같은 이름으로 다시 납품돼도 사이트 캐시가 옛 사진을 쓰지 않게)
 사용: python3 tools/gen-people-v19.py  (사진을 바꿨을 때만)"""
import json, os, hashlib
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE='assets/v19/secretary20/'
M=json.load(open(os.path.join(ROOT,BASE,'manifest.json'),encoding='utf8'))
g=M['grid']; assert g['columns']==10 and g['rows']==10 and g['padding']==8 and g['pitch']['128']==144 and g['pitch']['256']==272
ids=M['identities']; assert len(ids)==20 and M['role_counts']['sec']=={'count':20,'female':16,'male':4}
h={}
for cs,P in (('128',144),('256',272)):
    sh=M['sheets'][cs]; assert sh['path']=='sheets/'+cs+'.webp' and sh['pitch']==P and sh['cell_size']==int(cs)
    data=open(os.path.join(ROOT,BASE,sh['path']),'rb').read(); assert hashlib.sha256(data).hexdigest()==sh['sha256'], sh['path']
    h[cs]=sh['sha256'][:8]
    for k,x in enumerate(ids):
        assert x['id']=='v19_sec_%02d'%(k+1) and x['index']==k and x['r']=='sec', x['id']
        assert x['sheets'][cs]['path']==sh['path'] and x['sheets'][cs]['rect']==[(k%10)*P+8,(k//10)*P+8,int(cs),int(cs)], (x['id'],cs)
meta=[{'a':x['age'],'f':int(bool(x['f'])),'g':int(bool(x['tags'].get('glasses')))} for x in ids]
F={'v':'19','base':BASE+'sheets/','pitch':{'128':144,'256':272},'h':h,'ids':meta}
out=os.path.join(ROOT,'src','ui','assets','00k_people_v19_data.js')
open(out,'w',encoding='utf8').write('/* 자동 생성: python3 tools/gen-people-v19.py (손으로 고치지 않는다). v19 비서 20명(여 16·남 4). 사진은 파일로 받는다: '
  +"base+'128|256.webp?v='+h[크기], 10x10 중 앞 20칸(pitch 144·272, 칸 안 8px). ids[i]: a 나이·f 여성·g 안경 */\n"
  +'const FACE19='+json.dumps(F,ensure_ascii=False,separators=(',',':'))+';\n')
print('완료',out,os.path.getsize(out),len(meta),'여',sum(x['f'] for x in meta))
