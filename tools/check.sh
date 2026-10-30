#!/usr/bin/env bash
# 단장의 시간 전체 점검: 고친 뒤 커밋·배포 전에 한 번 돌린다.
#   1) 빌드  2) 문법  3) 정적 점검(이름 충돌·초기화 전 사용)  3-2) 규칙 점검(버그 재현 시나리오)  4) 장기 시뮬(시드 2개 + 바쁜 단장 1개, 불변식 검사 포함)  5) 화면 점검(넓은 화면·휴대폰)
# 사용: bash tools/check.sh        빠르게(시뮬 1시즌·화면은 시즌 준비만): QUICK=1 bash tools/check.sh
set -uo pipefail
cd "$(dirname "$0")/.."
fail=0
step(){ echo; echo "== $1"; }
step "빌드"; bash build.sh || exit 1
step "문법"; node -e "const fs=require('fs');const h=fs.readFileSync('index.html','utf8');const s=[...h.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');new Function(s);console.log('문법 OK')" || fail=1
step "정적 점검"; node tools/check-static.js || fail=1
step "규칙 점검(결과가 맞는지)"; node tools/check-logic.js || fail=1
END=2029; [ "${QUICK:-0}" = "1" ] && END=2027
step "장기 시뮬"; export STRICT=1; SEED=7 node tools/check-sim.js $END || fail=1
[ "${QUICK:-0}" = "1" ] || { SEED=21 TEAM=2 node tools/check-sim.js $END || fail=1; SEED=3 ACT=1 node tools/check-sim.js $END || fail=1; }
step "화면 점검(넓은 화면)"; node tools/check-ui.js || fail=1
step "화면 점검(휴대폰)"; W=390 QUICK=1 node tools/check-ui.js || fail=1
echo
if [ $fail = 0 ]; then echo "전체 점검: 통과"; else echo "전체 점검: 실패 — 위 내용을 확인하세요"; fi
exit $fail
