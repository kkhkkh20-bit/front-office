"""신생 구단 홈 유니폼 얼굴(기본 v23b: assets/v23b/expansion_kits, 엠블럼만 바꾼 판) → src/ui/assets/00l_faces_v23_data.js (FACE23)
 - 납품 판: 기본은 v23b(A1 방패·B7 왕관 마크). 예전 v23(별·방패)은 EXPKIT_VER=v23 로 다시 만들 수 있다. 두 판은 인물·칸 번호·시트 구조가 같아 데이터 모듈 하나(FACE23)를 갈아 끼운다(HTML에 두 판을 함께 넣지 않는다).
 - 기존 인물 420명(v6c 100·v13 60·v18 200·감독·코치 60)을 11·12구단 전용 유니폼으로 다시 렌더한 시트 20장. 새 인물은 없다.
   칸 번호 = 원래 묶음의 칸 번호(FACE6 0~99 v6c, 100~159 v13, 160~359 v18, FACE7.coach 칸)라 같은 사람이 그대로 옷만 바뀐다.
   manifest identities의 id 순서·칸 번호·원본 칸(source_reference)을 원본 묶음과 대조한다.
 - 구단: 엔진 EXP_KIT(01_rules.js) 순서대로 11구단(번호 10)=expansion_a, 12구단(번호 11)=expansion_b. 키트 색이 manifest 구단 색과 같은지도 확인한다.
 - 담는 방식은 원년 구단 시트와 같게: 128px v6c·v13·감독·코치는 HTML에 넣는다(손실 WebP q60, 00h_more_faces2_data.js와 같은 압축).
   256px 전부와 v18(128·256)은 HTML에 넣지 않고 같은 경로의 파일을 받는다(v13 256·FACE18처럼, 사이트 배포 tools/build-site.cjs v23Faces).
   파일 이름이 바뀌지 않아도 브라우저 캐시가 옛 사진을 쓰지 않게 시트별 해시 h를 주소 뒤 ?v=로 붙인다.
 - 화면 연결: 77_assets_ui.js f23Key·faceSheets(선수 'p'·감독·코치 'f7c'). 시트를 못 받으면 예전처럼 원년 구단 시트를 빌린다(faceTeamOf).
 사용: python3 tools/gen-faces-v23.py  (얼굴 에셋을 바꿨을 때만, PIL 필요. 예전 판: EXPKIT_VER=v23 python3 tools/gen-faces-v23.py). 그 뒤 python3 tools/gen-face-centers.py(신생 구단 머리 중심표)"""
import base64, hashlib, io, json, os, re, sys
from PIL import Image
from source_manifest import source_file
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VER=os.environ.get('EXPKIT_VER','v23b'); assert VER in ('v23','v23b'), VER
BASE=f'assets/{VER}/expansion_kits'
M=json.load(open(os.path.join(ROOT,BASE,'manifest.json'),encoding='utf8'))
assert M['schema_version']==VER+'-expansion-kits-1' and M['asset_validation_passed'] and M['production_complete'], '납품 상태'
src=open(source_file('engine','01_rules.js'),encoding='utf8').read()
NT=len(re.findall(r"\{city:'([^']+)',nick:'([^']+)'",src.split('const TEAM_DEF=[')[1].split('];')[0])); assert NT==10
KIT=re.findall(r"\{key:'([a-z_]+)',hue:(\d+),pal:\['(#[0-9A-Fa-f]{6})','(#[0-9A-Fa-f]{6})'",src.split('const EXP_KIT=[')[1].split('];')[0])
assert [k[0] for k in KIT]==['expansion_a','expansion_b'], KIT
MT={t['key']:t for t in M['teams']}
for k,h,c1,c2 in KIT: assert MT[k]['primary'].upper()==c1.upper() and MT[k]['secondary'].upper()==c2.upper(), ('키트 색이 납품과 다름',k)
teams={str(NT+i):k[0] for i,k in enumerate(KIT)}
g=M['grid']; assert g['columns']==10 and g['rows']==10 and g['padding']==8 and g['pitch']=={'128':144,'256':272}
PITCH={'128':144,'256':272}
J=lambda p:json.load(open(os.path.join(ROOT,p),encoding='utf8'))
# 원본 묶음 순서(게임 칸 번호)와 대조
src_ids={'v6c':[x['id'] for x in J('assets/v6/batch01c/production100/manifest.json')['identities']],
         'v13':[x['id'] for x in J('assets/v6/batch01d/production60/manifest.json')['identities']],
         'v18':[x['id'] for x in J('assets/v18/production200/manifest.json')['identities']]}
co=sorted([x for x in J('assets/v7/staff01/manifest.json')['identities'] if x['role_group']=='manager_coach'],key=lambda x:x['cell_index'])
assert [x['cell_index'] for x in co]==list(range(60)); src_ids['staff']=[x['identity_id'] for x in co]  # FACE7.coach 칸 = cell_index(tools/gen-staff-v7.py)
N={'v6c':100,'v13':60,'v18':200,'staff':60}
for st,n in N.items():
    L=[x for x in M['identities'] if x['set']==st]; assert len(L)==n==len(src_ids[st]), st
    for k,x in enumerate(L):
        assert x['id']==src_ids[st][k], ('원본 순서와 다름',st,k,x['id'])
        sh=('A' if k<100 else 'B') if st=='v18' else ''; c=k%100
        assert x['sheet']==st+sh and x['index']==c, x['id']
        for t in teams.values():
            for cs,P in PITCH.items():
                v=x['variants'][t]['sheets'][cs]
                assert v['path']==f"sheets/{st}{sh}/{cs}/{t}.webp" and v['rect']==[(c%10)*P+8,(c//10)*P+8,int(cs),int(cs)], (x['id'],t,cs)
# 시트 파일·체크섬(manifest sets[].sheets의 sha256)
files={}
for st in ('v6c','v13','v18A','v18B','staff'):
    for cs in PITCH:
        for t in teams.values():
            rel=f'sheets/{st}/{cs}/{t}.webp'; b=open(os.path.join(ROOT,BASE,rel),'rb').read(); files[(st,cs,t)]=b
            im=Image.open(io.BytesIO(b)); assert im.size==(10*PITCH[cs],)*2 and im.mode=='RGB', rel
assert sorted(M['runtime_files'])==sorted(f'sheets/{st}/{cs}/{t}.webp' for (st,cs,t) in files), 'runtime_files'
def walk(o):
    if isinstance(o,dict):
        if 'path' in o and 'sha256' in o: yield o
        for v in o.values(): yield from walk(v)
    elif isinstance(o,list):
        for v in o: yield from walk(v)
SHA={v['path']:v['sha256'] for v in walk(M['sets'])}; assert len(SHA)==20, len(SHA)
for (st,cs,t),b in files.items():
    assert hashlib.sha256(b).hexdigest()==SHA[f'sheets/{st}/{cs}/{t}.webp'], ('체크섬',st,cs,t)
def uri(b):
    # 128px 얼굴은 손실 WebP q60(00h_more_faces2_data.js uri와 같은 압축). 납품 q80보다 HTML 용량을 줄인다
    o=io.BytesIO(); Image.open(io.BytesIO(b)).convert('RGB').save(o,'WEBP',quality=60,method=6)
    return 'data:image/webp;base64,'+base64.b64encode(o.getvalue()).decode()
emb={st:{t:uri(files[(st,'128',t)]) for t in teams.values()} for st in ('v6c','v13','staff')}
h={f'{st}/{cs}/{t}':hashlib.sha256(b).hexdigest()[:8] for (st,cs,t),b in files.items() if not (cs=='128' and st in emb)}
F={'v':VER[1:],'base':BASE+'/sheets/','pitch':PITCH,'teams':teams,'h':h,'s128':emb}
out=os.path.join(ROOT,'src','ui','assets','00l_faces_v23_data.js')
open(out,'w',encoding='utf8').write('/* 자동 생성: python3 tools/gen-faces-v23.py (손으로 고치지 않는다). '+VER+' 신생 구단 홈 유니폼 얼굴(기존 420명, 칸 번호 그대로). teams[구단 번호]=키트(엔진 EXP_KIT 순서). '
  +"s128[묶음][키트]=HTML에 넣은 128px 시트(v6c·v13·staff, q60). 나머지는 파일로 받는다: base+묶음(v6c|v13|v18A|v18B|staff)+'/'+크기+'/'+키트+'.webp?v='+h[묶음/크기/키트]. 10x10 칸(pitch 144·272, 칸 안 8px) */\n"
  +'const FACE23='+json.dumps(F,ensure_ascii=False,separators=(',',':'))+';\n')
print('완료',out,os.path.getsize(out),'파일로 받는 시트',len(h),'HTML 128px',sum(len(u) for d in emb.values() for u in d.values()))
