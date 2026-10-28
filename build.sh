#!/usr/bin/env bash
# 단장의 시간: src 아래 조각 파일을 순서대로 묶어 index.html 한 파일로 만든다.
# 파일 이름 앞 숫자(00_, 01_ …)가 묶는 순서다. CSS는 뒤에 오는 규칙이 앞을 덮으므로 순서를 바꾸지 않는다.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p dist
cat src/engine/*.js > dist/engine.js   # 노드 시뮬레이션 검사용 엔진 묶음
{
  cat src/html/head.html
  cat src/css/*.css
  cat src/html/body.html
  echo '<script id="faces">'
  echo '/* 선수 얼굴: faces.js (c) ZenGM, Apache License 2.0 — https://github.com/zengm-games/facesjs */'
  cat vendor/faces.min.js
  echo '</script>'
  echo '<script id="lz">'
  echo '/* 저장 압축: lz-string (c) 2013 pieroxy, MIT License — https://github.com/pieroxy/lz-string */'
  cat vendor/lz-string.min.js
  echo '</script>'
  echo '<script id="engine">'
  cat dist/engine.js
  echo '</script>'
  echo '<script>'
  cat src/gfx/kart.js src/gfx/campus.js src/gfx/iso.js
  cat src/ui/*.js
  echo '</script>'
} > index.html
echo "index.html 생성: $(wc -c < index.html) bytes"
