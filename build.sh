#!/usr/bin/env bash
# 단장의 시간: 소스를 한 파일(index.html)로 묶는다
set -euo pipefail
cd "$(dirname "$0")"
{
  cat src/head.html
  echo '<script id="faces">'
  echo '/* 선수 얼굴: faces.js (c) ZenGM, Apache License 2.0 — https://github.com/zengm-games/facesjs */'
  cat vendor/faces.min.js
  echo '</script>'
  echo '<script id="lz">'
  echo '/* 저장 압축: lz-string (c) 2013 pieroxy, MIT License — https://github.com/pieroxy/lz-string */'
  cat vendor/lz-string.min.js
  echo '</script>'
  echo '<script id="engine">'
  cat src/engine.js
  echo '</script>'
  echo '<script>'
  cat src/kart.js
  cat src/campus.js
  cat src/ui.js
  echo '</script>'
} > index.html
echo "index.html 생성: $(wc -c < index.html) bytes"
