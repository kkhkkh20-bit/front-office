#!/usr/bin/env python3
"""고교·대학 선수(드래프트 대상) 임시 사진 시트.

v6c 완성본 100명의 신원 검수용 원본(identity_prescreen/masters256: 회색 무지 티셔츠, 모자·글자·로고 없음) 가운데
국내 선수·25세 이하만 골라 10열 시트(128·256)로 묶는다. 같은 신원이 FACE6 i번 칸(구단 홈 유니폼)에도 있으므로
지명되면 같은 얼굴이 구단 유니폼으로 이어진다(77_assets_ui.js amIdx·face6Idx).

v21 아마추어 전용 얼굴(docs/asset-requests/2026-11-17-codex-v21-amateur-faces.md)이 들어오면 이 임시 시트는 쓰지 않는다.

실행: python3 tools/gen-amateur-interim.py
"""
import hashlib, json, os, re, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets/v6/batch01c/production100')
OUT = os.path.join(SRC, 'amateur_interim')
DATA = os.path.join(ROOT, 'src/ui/assets/00l_amateur_faces_data.js')
MAX_AGE = 25
SIZES = (128, 256)
PAD = 8
BG = (13, 18, 23)


def face6_ids():
    s = open(os.path.join(ROOT, 'src/ui/assets/00d_faces_data.js'), encoding='utf-8').read()
    m = re.search(r'"ids":(\[.*?\])', s)
    return json.loads(m.group(1))


def main():
    man = json.load(open(os.path.join(SRC, 'manifest.json'), encoding='utf-8'))
    f6 = face6_ids()
    picks = []
    for i, x in enumerate(man['identities']):
        if i >= 100:
            break
        f = f6[i]
        assert f['a'] == x['age'], (i, f, x['age'])  # FACE6 i번 칸 = v6c100_(i+1)
        if f.get('f') or f.get('x') or x['ethnicity'] != 'Korean' or x['age'] > MAX_AGE:
            continue
        picks.append((i, x))
    os.makedirs(os.path.join(OUT, 'sheets'), exist_ok=True)
    rows = (len(picks) + 9) // 10
    h = {}
    for cs in SIZES:
        pitch = cs + PAD * 2
        sheet = Image.new('RGB', (pitch * 10, pitch * rows), BG)
        for n, (i, x) in enumerate(picks):
            im = Image.open(os.path.join(SRC, x['prescreen']['path'])).convert('RGB')
            if im.size != (cs, cs):
                im = im.resize((cs, cs), Image.LANCZOS)
            sheet.paste(im, ((n % 10) * pitch + PAD, (n // 10) * pitch + PAD))
        path = os.path.join(OUT, 'sheets', f'{cs}.webp')
        sheet.save(path, 'WEBP', quality=88, method=6)
        h[str(cs)] = hashlib.sha256(open(path, 'rb').read()).hexdigest()[:8]
    ids = [{'i': i, 'a': x['age'], 'g': 1 if x['tags'].get('glasses') else 0} for i, x in picks]
    meta = {
        'source': 'assets/v6/batch01c/production100/identity_prescreen/masters256',
        'note': 'v6c identities, plain gray tee, no cap/text/logo. Interim faces for amateur draft prospects; cell n = FACE6 index ids[n].i',
        'count': len(ids), 'grid': {'columns': 10, 'rows': rows, 'pad': PAD, 'pitch': {str(c): c + PAD * 2 for c in SIZES}},
        'runtime_files': [f'sheets/{c}.webp' for c in SIZES], 'ids': ids,
    }
    json.dump(meta, open(os.path.join(OUT, 'manifest.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    data = {'v': 'am6c', 'base': 'assets/v6/batch01c/production100/amateur_interim/sheets/',
            'pitch': {str(c): c + PAD * 2 for c in SIZES}, 'h': h, 'ids': ids}
    open(DATA, 'w', encoding='utf-8').write(
        '/* 자동 생성: python3 tools/gen-amateur-interim.py (손으로 고치지 않는다). 고교·대학 선수 임시 사진: v6c 신원 검수 원본(회색 무지 티셔츠) 중 국내·25세 이하 '
        f'{len(ids)}명. 사진은 파일로 받는다: base+\'128|256.webp?v=\'+h[크기], 10열(pitch 144·272, 칸 안 8px). ids[n]: i FACE6 번호(지명되면 같은 얼굴이 구단 유니폼으로)·a 나이·g 안경 */\n'
        'const FACEAM=' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
    print(len(ids), 'identities', h)


if __name__ == '__main__':
    sys.exit(main())
