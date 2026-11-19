"""선수 얼굴 칸별 가로 중심표 → src/ui/assets/00j2_face_centers_data.js
 - 왜: v18 시트 일부 칸은 원본 그림에서 사람이 왼쪽으로 밀려 있다(4명씩 묶어 만든 그림을 자를 때 칸마다 조금씩 더 왼쪽으로 밀림,
   묶음 안 3·4번째 칸이 칸 너비의 13~22%까지). 오른쪽 끝에는 옆 사람 어깨가 살짝 보이기도 한다. 화면 자르기(77_assets_ui.js face6Cut)는
   칸 가운데를 기준으로 자르므로 이런 칸은 얼굴이 한쪽으로 쏠려 보였다(사용자 11-16 "중앙 안맞는놈들").
 - 무엇을: 칸마다 머리(모자~눈 높이)의 가로 중심을 잰다. 배경(채도 낮은 회색)을 줄마다 직선으로 맞추고, 배경과 다른 가장 긴 구간의 가운데를
   줄마다 구해 중앙값을 쓴다. 칸 너비의 4%(v13은 6%) 넘게 벗어난 칸만 적는다(값은 칸 너비의 천분율, 500이 한가운데).
 - v18은 128 시트로 잰다(384·128 측정 차이 평균 0.3%, 최대 1%). v13은 256 시트. v6c는 어두운 배경·검은 모자에서 이 방법이 틀리게 재고,
   눈으로 봐도 가운데라 넣지 않는다.
 - 화면은 77_assets_ui.js fcAt·face6Cut이 이 값으로 자르는 창을 옮긴다(칸 밖으로는 못 나가므로 모자라면 조금 확대).
 사용: python3 tools/gen-face-centers.py  (얼굴 에셋을 바꿨을 때만, PIL·numpy 필요)"""
import json, os
import numpy as np
from PIL import Image
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(ROOT,'src/ui/assets/00j2_face_centers_data.js')

def center(a):
    n=a.shape[0]; xx=np.arange(n)
    ch=a.max(2)-a.min(2); lum=a.mean(2); top=slice(0,int(n*.45))
    h=np.histogram(lum[top][ch[top]<16],bins=64,range=(0,256))[0]; mode=(np.argmax(h)+.5)*4
    mids=[]
    for y in range(int(n*.04),int(n*.42)):
        c=(ch[y]<16)&(np.abs(lum[y]-mode)<35)
        if c.sum()<n*.08: continue
        X=xx[c]; coef,*_=np.linalg.lstsq(np.c_[np.ones(len(X)),X],a[y][c],rcond=None)
        d=np.abs(a[y]-(coef[0]+coef[1]*xx[:,None])).sum(1); m=np.where(d>60)[0]
        if len(m)<n*.10: continue
        runs=[]; st=pv=m[0]
        for q in m[1:]:
            if q-pv>n*.06: runs.append((st,pv)); st=q
            pv=q
        runs.append((st,pv)); r=max(runs,key=lambda r:r[1]-r[0]); mids.append((r[0]+r[1])/2)
    return float(np.median(mids))/n if mids else .5

def sheet(p): return np.asarray(Image.open(os.path.join(ROOT,p)).convert('RGB')).astype(np.float32)

def v18(th=.04):
    M=json.load(open(os.path.join(ROOT,'assets/v18/production200/manifest.json'),encoding='utf8'))
    F=open(os.path.join(ROOT,'src/ui/assets/00j_faces_v18_data.js'),encoding='utf8').read()
    T=json.loads(F[F.index('const FACE18=')+13:F.index(';\n')])['teams']; tid={v:k for k,v in T.items()}
    out={}; S={}
    for x in M['identities']:
        for key,v in x['variants'].items():
            v=v['sheets']['128']; X,Y,w,h=v['rect']
            if v['path'] not in S: S.clear(); S[v['path']]=sheet(v['path'])
            cx=center(S[v['path']][Y:Y+h,X:X+w])
            if abs(cx-.5)>=th: out.setdefault(x['sheet']+tid[key],{})[str(x['index'])]=round(cx*1000)
    return out

def v13(th=.06):
    out={}
    for t in range(10):
        p='assets/v13/face256/%d.webp'%t
        if not os.path.isfile(os.path.join(ROOT,p)): continue
        S=sheet(p)
        for c in range(60):
            X=(c%10)*272+8; Y=(c//10)*272+8; cx=center(S[Y:Y+256,X:X+256])
            if abs(cx-.5)>=th: out.setdefault(str(t),{})[str(c)]=round(cx*1000)
    return out

def v23(D):
    """신생 구단(v23 전용 유니폼, 00l_faces_v23_data.js FACE23): 같은 사람·같은 구도로 다시 그렸지만 칸마다 잰다(v18은 128, v13은 256 시트). 키는 원년 구단과 같은 꼴(시트+구단 번호·구단 번호)"""
    B='assets/v23/expansion_kits/'; M=json.load(open(os.path.join(ROOT,B,'manifest.json'),encoding='utf8'))
    F=open(os.path.join(ROOT,'src/ui/assets/00l_faces_v23_data.js'),encoding='utf8').read()
    T=json.loads(F[F.index('const FACE23=')+13:F.index(';\n',F.index('const FACE23='))])['teams']
    for tid,key in T.items():
        for x in M['identities']:
            if x['set'] not in ('v18','v13'): continue
            cs,th='128',.04
            if x['set']=='v13': cs,th='256',.06
            v=x['variants'][key]['sheets'][cs]; X,Y,w,h=v['rect']; p=B+v['path']
            if p not in S23: S23.clear(); S23[p]=sheet(p)
            cx=center(S23[p][Y:Y+h,X:X+w])
            if abs(cx-.5)>=th:
                if x['set']=='v18': D['v18'].setdefault(x['sheet'][-1]+tid,{})[str(x['index'])]=round(cx*1000)
                else: D['v13'].setdefault(tid,{})[str(x['index'])]=round(cx*1000)
S23={}
D={'v18':v18(),'v13':v13()}; v23(D)
n=sum(len(v) for s in D.values() for v in s.values())
open(OUT,'w',encoding='utf8').write('/* 자동 생성: python3 tools/gen-face-centers.py (손으로 고치지 않는다). 얼굴 칸별 머리 가로 중심(칸 너비 천분율, 500=가운데)이 4%(v13 6%) 넘게 벗어난 칸만.\n'
 '   v18[시트(A|B)+구단 ID][칸 번호], v13[구단 ID][칸 번호](신생 구단 10·11 = v23 전용 유니폼 시트). 77_assets_ui.js fcAt이 읽어 자르는 창을 옮긴다. 원본 그림 고침 요청: docs/asset-requests/2026-11-17-codex-face-centering.md */\n'
 'const FACECTR='+json.dumps(D,separators=(',',':'),sort_keys=True)+';\n')
print('완료',OUT,n,'칸')
