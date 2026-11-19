#!/usr/bin/env python3
"""홈 화면 추가용 앱 아이콘(assets/app)을 카페 대표 아이콘(assets/cafe/cafe_icon_1024.png)에서 만든다.
사용: python3 tools/make-app-icons.py  (Pillow 필요). 결과 PNG는 저장소에 넣고, tools/build-site.cjs가 사이트에 올린다."""
import os
from PIL import Image
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
src = Image.open(os.path.join(root, 'assets/cafe/cafe_icon_1024.png')).convert('RGB')
out = os.path.join(root, 'assets/app')
os.makedirs(out, exist_ok=True)
for name, size in (('icon-192.png', 192), ('icon-512.png', 512)):
    im = src.resize((size, size), Image.LANCZOS).quantize(colors=255, method=Image.MEDIANCUT, dither=Image.FLOYDSTEINBERG)
    im.save(os.path.join(out, name), optimize=True)
    print(name, size)
