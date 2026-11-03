#!/usr/bin/env bash
# 프런트타임 전체 점검: 고친 뒤 커밋·배포 전에 한 번 돌린다.
#   1) 빌드  2) 문법  3) 정적 점검(이름 충돌·초기화 전 사용)  3-2) 규칙 점검(버그 재현 시나리오)  3-3) 능력치 반영(능력치마다 맡은 기록이 움직이는지)  4) 장기 시뮬(시드 2개 + 바쁜 단장 1개, 불변식 검사 포함)  5) 화면 점검(넓은 화면·휴대폰)
# 사용: bash tools/check.sh        빠르게(시뮬 1시즌·화면은 시즌 준비만): QUICK=1 bash tools/check.sh
set -uo pipefail
cd "$(dirname "$0")/.."
fail=0
step(){ echo; echo "== $1"; }
step "빌드"; bash build.sh || exit 1
step "모듈·빌드 계약"; node --test tools/test/*.test.cjs || fail=1
step "문법"; node -e "const fs=require('fs');const h=fs.readFileSync('index.html','utf8');const s=[...h.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');new Function(s);console.log('문법 OK')" || fail=1
step "정적 점검"; node tools/check-static.js || fail=1
step "규칙 점검(결과가 맞는지)"; node tools/check-logic.js || fail=1
END=2029; [ "${QUICK:-0}" = "1" ] && END=2027
step "상대 트레이드 제안·투구폼 저장"; node tools/check-offer-review.cjs || fail=1
step "첫 접속·초기 파일 분리"; node tools/check-startup.cjs || fail=1
step "계속·날짜 표시·스카우트 위임"; node tools/check-continue.cjs || fail=1
step "3경기 진행·중계 선택"; node tools/check-match-entry.cjs || fail=1
step "홈 카드·반응형·페이지"; node tools/check-home-fit.cjs || fail=1
step "터치 기기·날짜 효과·실제 조작"; node tools/check-touch.cjs || fail=1
step "트레이드 제안 카드 레이아웃"; node tools/check-trade-layout.cjs || fail=1
step "공통 글꼴·패널 정렬"; node tools/check-design-system.cjs || fail=1
step "표·목록 내부 스크롤"; node tools/check-workspace.cjs || fail=1
step "PC 전체 화면 높이"; node tools/check-desktop-fit.cjs || fail=1
step "능력치 반영"; node tools/check-sens.js || fail=1
step "장기 시뮬"; export STRICT=1; SEED=7 node tools/check-sim.js $END || fail=1
[ "${QUICK:-0}" = "1" ] || { SEED=21 TEAM=2 node tools/check-sim.js $END || fail=1; SEED=3 ACT=1 node tools/check-sim.js $END || fail=1; }
step "화면 점검(넓은 화면)"; node tools/check-ui.js || fail=1
step "화면 점검(휴대폰)"; W=390 QUICK=1 node tools/check-ui.js || fail=1
step "노트북 배치·상세 이동"; node tools/check-layout.cjs || fail=1
step "경기 대시보드·재생 기록"; node tools/check-match.cjs || fail=1
step "사이트 배포·파일 크기·3D 재시도"; node tools/check-site.cjs || fail=1
step "인게임 동작·이름·수비·전광판"; node tools/check-gameplay.cjs || fail=1
step "3D 경기장·동작·오프라인"; node tools/check-match3d.cjs || fail=1
step "계약 금액 직접 입력"; node tools/check-contract-input.cjs || fail=1
step "3D 상태·공 연결·메모리"; node tools/check-match3d-state.cjs || fail=1
step "3D 플레이 리뷰·시선·릴리스"; node tools/check-match3d-review.cjs || fail=1
step "공별 중계·투구판"; node tools/check-pitches.cjs || fail=1
step "모바일 메뉴·트레이드·코치 보직 버튼"; node tools/check-mobile-workspace.cjs || fail=1
step "직원 카드·관계·희망 보직"; node tools/check-staff.cjs || fail=1
step "결재 키 입력·상세 복귀 리뷰"; node tools/check-review.cjs || fail=1
step "모든 상세 화면 상단바"; node tools/check-topbar.cjs || fail=1
step "면담 본문·셸 유지"; node tools/check-meeting.cjs || fail=1
step "소식함 완료·기한·지난 업무"; node tools/check-inbox.cjs || fail=1
echo
if [ $fail = 0 ]; then echo "전체 점검: 통과"; else echo "전체 점검: 실패 — 위 내용을 확인하세요"; fi
exit $fail
