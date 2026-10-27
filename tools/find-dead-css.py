import re,glob,sys
import os
R=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','src')+'/'
js='\n'.join(open(f).read() for f in glob.glob(R+'engine/*.js')+glob.glob(R+'ui/*.js')+glob.glob(R+'gfx/*.js')+glob.glob(R+'html/*.html'))
apply='--apply' in sys.argv; tot=0; removed=0
for f in sorted(glob.glob(R+'css/*.css')):
    css=open(f).read()
    # 규칙 단위로 나누기(중괄호 깊이 0의 선택자{...}); @media 안쪽도 처리
    out=[]; i=0; n=len(css); changed=False
    def scan(s):
        global tot,removed
        res=''; i=0
        while i<len(s):
            j=s.find('{',i)
            if j<0: res+=s[i:]; break
            sel=s[i:j]; # 블록 끝 찾기
            d=0; k=j
            while k<len(s):
                if s[k]=='{': d+=1
                elif s[k]=='}':
                    d-=1
                    if d==0: break
                k+=1
            body=s[j+1:k]
            if sel.strip().startswith('@media') or sel.strip().startswith('@supports'):
                inner=scan(body); res+=sel+'{'+inner+'}'
            elif sel.strip().startswith('@'):
                res+=s[i:k+1]
            else:
                tot+=1
                # 주석 제거 후 선택자 목록
                selc=re.sub(r'/\*.*?\*/','',sel,flags=re.S)
                parts=[p.strip() for p in selc.split(',')]
                keep=[]
                for p in parts:
                    cls=re.findall(r'\.([A-Za-z_][\w-]*)',p)
                    dead=[c for c in cls if c not in js and not re.match(r'^(net\d|t-|v-)',c)]
                    if not dead: keep.append(p)
                if len(keep)==len(parts): res+=s[i:k+1]
                elif not keep:
                    removed+=1
                    # 선택자 앞 주석은 남긴다
                    cm=re.match(r'(\s*(?:/\*.*?\*/\s*)*)',sel,re.S).group(1); res+=cm
                else:
                    removed+=1; cm=re.match(r'(\s*(?:/\*.*?\*/\s*)*)',sel,re.S).group(1); res+=cm+','.join(keep)+'{'+body+'}'
            i=k+1
        return res
    new=scan(css)
    if apply and new!=css: open(f,'w').write(new)
print('rules',tot,'changed',removed)
