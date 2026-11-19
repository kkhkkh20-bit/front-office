"""신생 구단 배지(v23 납품 assets/v23/expansion_kits/badges, 320px 투명 PNG) → src/ui/assets/00a2_badges_exp_data.js
 - 원년 구단 배지(00a_badges_data.js, tools/gen-badges.js)와 같은 꼴로 BADGE_IMG[구단 번호]에 더한다: s=64px(32px 이하 자리), l=128px(33~63px), c=256px(64px 이상).
   키 k는 키트 이름(expansion_a|expansion_b). 구단 번호는 엔진 EXP_KIT 순서(11구단=번호 10).
 - 신생 구단 엠블럼은 이 파일 하나와 배지 PNG 두 장에만 있다. 새 시안으로 바꿀 때는 PNG만 바꾸고 이 스크립트를 다시 돌린다(구단주 피드백: 별·방패 엠블럼 다시 그리기 예정).
 - 용량: 투명 WebP(q90)로 줄여 넣는다. manifest의 sha256으로 납품 파일이 그대로인지 확인한다.
 사용: python3 tools/gen-badges-v23.py  (배지 이미지를 바꿨을 때만, PIL 필요)"""
import base64, hashlib, io, json, os, re
from PIL import Image
from source_manifest import source_file
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE='assets/v23/expansion_kits'
M=json.load(open(os.path.join(ROOT,BASE,'manifest.json'),encoding='utf8'))
src=open(source_file('engine','01_rules.js'),encoding='utf8').read()
NT=len(re.findall(r"\{city:'([^']+)',nick:'([^']+)'",src.split('const TEAM_DEF=[')[1].split('];')[0])); assert NT==10
KIT=re.findall(r"\{key:'([a-z_]+)'",src.split('const EXP_KIT=[')[1].split('];')[0]); assert KIT==['expansion_a','expansion_b'], KIT
out={}
for i,k in enumerate(KIT):
    b=M['badges'][k]; raw=open(os.path.join(ROOT,BASE,b['path']),'rb').read()
    assert hashlib.sha256(raw).hexdigest()==b['sha256'], ('체크섬(파일이 바뀜)',k)
    im=Image.open(io.BytesIO(raw)).convert('RGBA'); assert im.size==(320,320), im.size
    def uri(n):
        o=io.BytesIO(); im.resize((n,n),Image.LANCZOS).save(o,'WEBP',quality=90,method=6,exact=False)
        return 'data:image/webp;base64,'+base64.b64encode(o.getvalue()).decode()
    out[str(NT+i)]={'k':k,'n':'','s':uri(64),'l':uri(128),'c':uri(256)}
body=('/* 자동 생성: python3 tools/gen-badges-v23.py (손으로 고치지 않는다). 신생 구단 배지(assets/v23/expansion_kits/badges, 키트 = 엔진 EXP_KIT 순서). '
  'BADGE_IMG(00a_badges_data.js)와 같은 꼴: 키는 구단 번호, s=64px·l=128px·c=256px. 신생 구단 엠블럼은 여기 한 곳에만 있다(시안 교체 = PNG 바꾸고 다시 생성) */\n'
  'const BADGE_EXP='+json.dumps(out,ensure_ascii=False,separators=(',',':'))+';\n'
  "if(typeof BADGE_IMG!=='undefined')for(const k in BADGE_EXP)if(!BADGE_IMG[k])BADGE_IMG[k]=BADGE_EXP[k];\n")
p=os.path.join(ROOT,'src','ui','assets','00a2_badges_exp_data.js'); open(p,'w',encoding='utf8').write(body)
print('완료',p,len(body),{k:{z:len(v[z]) for z in 'slc'} for k,v in out.items()})
