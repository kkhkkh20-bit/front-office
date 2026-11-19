"""신생 구단 배지 → src/ui/assets/00a2_badges_exp_data.js
 - 기본 v23b(assets/v23b/crests, 사용자 선택 A1·B7): 원년 구단 배지(00a_badges_data.js, tools/gen-badges.js)와 같은 꼴로 BADGE_IMG[구단 번호]에 더한다.
   s=글자 없는 마크 64px, l=마크 128px, c=메인 크레스트 256px(리본에 로마 숫자 XI·XII). m=40: 크레스트는 40px 이상 자리에만 쓰고 그보다 작은 자리(순위표·목록)는 마크를 쓴다
   (리본 글자가 32px 이하에서 뭉개진다. 00_core.js badge). 원년 구단은 m이 없어 예전처럼 크기와 관계없이 크레스트.
   teams.json의 wordmark가 XI·XII인지, checksums.sha256으로 납품 파일이 그대로인지 확인한다.
 - 예전 v23(assets/v23/expansion_kits/badges, 320px 별·방패 한 장을 세 크기로): EXPKIT_VER=v23 로 다시 만들 수 있다. 두 판을 함께 넣지 않는다.
 - 키 k는 키트 이름(expansion_a|expansion_b). 구단 번호는 엔진 EXP_KIT 순서(11구단=번호 10). 신생 구단 엠블럼은 이 파일 하나에만 있다.
 - 용량: 투명 WebP(q90)로 줄여 넣는다.
 사용: python3 tools/gen-badges-v23.py  (배지 이미지를 바꿨을 때만, PIL 필요)"""
import base64, hashlib, io, json, os, re
from PIL import Image
from source_manifest import source_file
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VER=os.environ.get('EXPKIT_VER','v23b'); assert VER in ('v23','v23b'), VER
src=open(source_file('engine','01_rules.js'),encoding='utf8').read()
NT=len(re.findall(r"\{city:'([^']+)',nick:'([^']+)'",src.split('const TEAM_DEF=[')[1].split('];')[0])); assert NT==10
KIT=re.findall(r"\{key:'([a-z_]+)'",src.split('const EXP_KIT=[')[1].split('];')[0]); assert KIT==['expansion_a','expansion_b'], KIT
def webp(im,n=None):
    o=io.BytesIO(); (im if n is None or im.size==(n,n) else im.resize((n,n),Image.LANCZOS)).save(o,'WEBP',quality=90,method=6,exact=False)
    return 'data:image/webp;base64,'+base64.b64encode(o.getvalue()).decode()
out={}
if VER=='v23':
    BASE='assets/v23/expansion_kits'; M=json.load(open(os.path.join(ROOT,BASE,'manifest.json'),encoding='utf8'))
    for i,k in enumerate(KIT):
        b=M['badges'][k]; raw=open(os.path.join(ROOT,BASE,b['path']),'rb').read()
        assert hashlib.sha256(raw).hexdigest()==b['sha256'], ('체크섬(파일이 바뀜)',k)
        im=Image.open(io.BytesIO(raw)).convert('RGBA'); assert im.size==(320,320), im.size
        out[str(NT+i)]={'k':k,'n':'','s':webp(im,64),'l':webp(im,128),'c':webp(im,256)}
else:
    BASE='assets/v23b/crests'; J=json.load(open(os.path.join(ROOT,BASE,'teams.json'),encoding='utf8'))
    assert J['approved'] and J['production_complete'] and J['selection']=={'expansion_a':'A1','expansion_b':'B7'}, '납품 상태'
    SUM=dict(reversed(l.rstrip('\n').split('  ',1)) for l in open(os.path.join(ROOT,BASE,'checksums.sha256'),encoding='utf8') if l.strip())
    T={t['key']:t for t in J['teams']}; WM={'expansion_a':'XI','expansion_b':'XII'}
    def load(k,kind,sz):
        rel=T[k]['assets'][kind][sz]; raw=open(os.path.join(ROOT,BASE,rel),'rb').read()
        assert hashlib.sha256(raw).hexdigest()==SUM[rel], ('체크섬(파일이 바뀜)',rel)
        im=Image.open(io.BytesIO(raw)).convert('RGBA'); assert im.size==(int(sz),)*2, (rel,im.size); return im
    for i,k in enumerate(KIT):
        assert T[k]['wordmark']==WM[k], (k,T[k]['wordmark'])
        out[str(NT+i)]={'k':k,'n':'','s':webp(load(k,'mark','64')),'l':webp(load(k,'mark','128')),'c':webp(load(k,'crest','256')),'m':40}
body=('/* 자동 생성: python3 tools/gen-badges-v23.py (손으로 고치지 않는다). 신생 구단 배지('+BASE+', 키트 = 엔진 EXP_KIT 순서). '
  'BADGE_IMG(00a_badges_data.js)와 같은 꼴: 키는 구단 번호, s=마크 64px·l=마크 128px·c=크레스트 256px, m=크레스트를 쓰는 가장 작은 자리(px, 없으면 항상 크레스트). 신생 구단 엠블럼은 여기 한 곳에만 있다 */\n'
  'const BADGE_EXP='+json.dumps(out,ensure_ascii=False,separators=(',',':'))+';\n'
  "if(typeof BADGE_IMG!=='undefined')for(const k in BADGE_EXP)if(!BADGE_IMG[k])BADGE_IMG[k]=BADGE_EXP[k];\n")
p=os.path.join(ROOT,'src','ui','assets','00a2_badges_exp_data.js'); open(p,'w',encoding='utf8').write(body)
print('완료',p,len(body),{k:{z:len(v[z]) for z in 'slc'} for k,v in out.items()})
