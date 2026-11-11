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
if [ "${SKIP_RULE_CHECK:-0}" != "1" ]; then
  step "규칙 점검(결과가 맞는지)"; node tools/check-logic.js || fail=1
fi
step "개인 활동·시설·해외연수·저장 규칙"; node tools/check-feature-rules.cjs || fail=1
step "개인 인맥·단장 교체·상황별 면담 규칙"; node tools/check-career-rules.cjs || fail=1
step "커뮤니티·시즌 행사·FA 만료·자동 지명 규칙"; node tools/check-community-rules.cjs || fail=1
step "독립 감사: 레거시·훈련·결번/상품·미디어·약속/위임"
for audit in legacy training family media-day promises; do
 node "tools/check-audit-${audit}.cjs" || fail=1
done
END=2029; [ "${QUICK:-0}" = "1" ] && END=2027
step "상대 트레이드 제안·투구폼 저장"; node tools/check-offer-review.cjs || fail=1
step "첫 접속·초기 파일 분리"; node tools/check-startup.cjs || fail=1
step "계속·날짜 표시·스카우트 위임"; node tools/check-continue.cjs || fail=1
step "동기·분할 진행 결과 일치"; node tools/check-advance-steps.cjs || fail=1
step "캘린더 기간·실제 진행·중도 중단"; node tools/check-calendar-progress.cjs || fail=1
step "시즌 말 국내 선수 보충"; node tools/check-roster-recovery.cjs || fail=1
step "인원 부족 안내·국내 선수 계약·경기 재개"; node tools/check-roster-recovery-ui.cjs || fail=1
step "AI 구단 자동 영구결번"; node tools/check-ai-retired-numbers.cjs || fail=1
step "전 구단 영구 연대기·인사·이적·시설·개인 기록"
for audit in archive executives staff-history player-history facilities-history records; do
 node "tools/check-club-${audit}.cjs" || fail=1
done
step "구단 소유권·인물 승계·발생 간격"
for audit in ownership ownership-people ownership-frequency ownership-ui; do
 node "tools/check-${audit}.cjs" || fail=1
done
step "전력분석원 정원·보강 요청"; node tools/check-analyst-capacity.cjs || fail=1
step "감독 요청·약속의 실제 이행 조건"
for audit in dialogue event promises; do
 node "tools/check-manager-${audit}-conditions.cjs" || fail=1
done
step "커뮤니티 제보: 일괄면담·성장·척도·급매·목록·읽기"
node tools/check-bulk-talk.cjs || fail=1
node tools/check-bulk-relations-ui.cjs || fail=1
node tools/check-young-development-feedback.cjs || fail=1
node tools/check-coach-display-scale.cjs || fail=1
node tools/check-trade-listing-feedback.cjs || fail=1
node tools/check-free-agent-workspace.cjs || fail=1
node tools/check-inbox-reading-feedback.cjs || fail=1
step "검수 126~157: 결산·시상 성과의 주인·업적 조건·통산·구장 재정·개인 활동"; node tools/check-feedback-126157.cjs || fail=1
step "PR #4 이식: 단장 재임 구간·사장 제안·구단별 훈련 방침·위임 메일"; node tools/check-pr4-port.cjs || fail=1
step "기사 본문·댓글·발행 당시 맥락 일치"
node tools/check-news-comment-context.cjs || fail=1
node tools/check-news-comment-boundaries.cjs || fail=1
node tools/check-news-comment-context-ui.cjs || fail=1
step "개인 인맥·선수 은퇴·지도자 경력 관계 계승"
for audit in personal-network personal-network-boundaries personal-network-ui; do
 node "tools/check-${audit}.cjs" || fail=1
done
step "코치 구단 지원 연수·성장·잔류 선호"
for audit in training training-loyalty training-boundaries training-ui; do
 node "tools/check-coach-${audit}.cjs" || fail=1
done
step "후속 50건·연수/계약 경계 검증"
for audit in sister camp records operations boundaries; do
 node "tools/check-feedback-${audit}-20261110.cjs" || fail=1
done
step "추가 검수 63–95: 저장·관찰·학교·시장·기록·동행"
for audit in draft-data scouting schools staff-market records ownership ui coach-layout; do
 node "tools/check-feedback-${audit}-6395.cjs" || fail=1
done
step "추가 검수 96–125: 저장·중계·연기·퓨처스·병역·기록 보존"
for audit in save broadcast spoiler match futures military archive links; do
 node "tools/check-feedback-${audit}-96125.cjs" || fail=1
done
step "캠프 예약 표시·경기 수 선택"; node tools/check-feedback-camp-ui-20261110.cjs || fail=1
step "검색표 잠재력 반별·글리프 높이"; node tools/check-rating-stars-tables.cjs || fail=1
step "타 구단 공개 프로필·통산 기록·연대기·재정 장부"; CLUB_PROFILE_HTML="$PWD/index.html" node tests/tools/check-club-profile-ui.cjs || fail=1
step "3경기 진행·중계 선택"; node tools/check-match-entry.cjs || fail=1
step "홈 카드·반응형·페이지"; node tools/check-home-fit.cjs || fail=1
step "터치 기기·날짜 효과·실제 조작"; node tools/check-touch.cjs || fail=1
step "선수 카드·모바일 읽기·검색 공간·파일 불러오기"; node tools/check-experience.cjs || fail=1
step "백업 가져오기·슬롯 전환·itch 이전"; node tools/check-save-import.cjs || fail=1
step "개인 활동 상대·검색·빠른 설정 변경"; node tools/check-career-review.cjs || fail=1
step "인물 이전·다음·연속 면담"; node tools/check-people-navigation.cjs || fail=1
step "사진·소식함·코치 표시·시즌 행사·영구결번"; node tools/check-community-ui.cjs || fail=1
step "전체 구단 영구결번·이직·모바일 이동"; node tools/check-retired-navigation.cjs || fail=1
step "현재·잠재력 별과 드래프트 별 배치"; node tools/check-player-stars.cjs || fail=1
step "선수단 정리 모드 실행·종료"; node tools/check-roster-cleanup.cjs || fail=1
step "긴 대화·관전 보고·읽기 위치"; node tools/check-reading-navigation.cjs || fail=1
step "트레이드 제안 카드 레이아웃"; node tools/check-trade-layout.cjs || fail=1
step "공통 글꼴·패널 정렬"; node tools/check-design-system.cjs || fail=1
step "표·목록 내부 스크롤"; node tools/check-workspace.cjs || fail=1
step "전체 업무 화면·하위 모드·필터 공간"; node tools/check-workspace-space.cjs || fail=1
step "PC 전체 화면 높이"; node tools/check-desktop-fit.cjs || fail=1
step "화면 비율(휴대폰 세로·가로·태블릿·PC·대형 화면)"; node tools/check-viewport.cjs || fail=1
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
if [ "${LONG_PLAY:-0}" = "1" ]; then
 step "실제 조작으로 휴대폰·태블릿·PC 한 시즌"; node tools/check-season-playthrough.cjs || fail=1
fi
step "연수·의료 에셋 실제 연결"; node tools/check-operations-art.cjs || fail=1
echo
if [ $fail = 0 ]; then echo "전체 점검: 통과"; else echo "전체 점검: 실패 — 위 내용을 확인하세요"; fi
exit $fail
