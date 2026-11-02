# 인수인계 (2026-11-02, 커밋 85a12c6 기준)

## 프로젝트
- 프런트야구: KBO 구단 단장 시뮬레이션. 단일 index.html(빌드 결과물).
- 저장소: github.com/kkhkkh20-bit/front-office (main). 푸시하면 Cloudflare(https://fronttime.kkhkkh-20.workers.dev/)에 자동 배포.
- 아티팩트: https://claude.ai/code/artifact/9f1GBoUuCoHwaWHmKt9CwB (index.html을 같은 URL로 다시 게시, 현재 Version 323).
- itch.io(kkhkkh20.itch.io)는 사용자가 직접 index.html을 올림.

## 구조
- src/engine/*.js → dist/engine.js, src/html·css·ui → index.html. `bash build.sh`로 합친다.
- 패치 노트: src/ui/75_patch_notes.js 맨 앞에 항목 추가(최근 id '2026-11-02v').
- 리뷰·작업 기록: docs/feedback-backlog.md (끝에 [ ] 항목이 남은 일).

## 작업 규칙(사용자 지시)
- 한국어로만, 이모지 금지, 객관적·사실 기반. 작업 안내·커밋 메시지도 한국어.
- 커밋 메시지 끝 두 줄: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` / `Claude-Session: <세션 링크>`.
- 순서: 수정 전 실패하는 테스트 먼저 → 고치기 → 빠른 확인 → `bash tools/check.sh` 전체 점검(30분 안팎, 배경 실행 시간 제한 주의) → 통과하면 커밋·푸시 → 아티팩트 게시 → 패치 노트·백로그.
- 규칙이 애매하면 실제 KBO 규정을 찾아 그대로 따른다. 규정이 없는 게임 고유 기능만 사용자에게 선택지로 묻는다.
- 모든 데이터는 능력치와 유기적으로 연결. 리팩터링은 나중으로 미룸.
- 게시판(D1)은 사용자가 Cloudflare에 ADMIN_KEY를 등록하고 D1 ID를 줄 때까지 대기.
- check.sh가 도는 동안 index.html/dist를 다시 빌드하지 않는다(뒤 단계가 새 빌드를 읽는다).

## 검사 도구
- tools/check-logic.js: 규칙 테스트(현재 346개). 앞부분 `T('리그 수준: 트리플A는` 앞에 새 테스트를 넣는다. 테스트 코드는 템플릿 문자열 안이라 백틱을 쓰면 안 된다.
- 일부만: `ONLY=문구 node tools/check-logic.js`(0개 선택이면 실패). src를 빌드 없이 시험: `cat src/engine/*.js > /tmp/e.js` 후 ENGINE 경로만 바꾼 복사본으로 실행.
- [공통 점검] 테스트 + src/engine/95_audit.js(stateAudit·auditMoney·leaveSweep): 이동 정리·감독 교체·안내한 기한·시즌 구분을 여러 전환 뒤 한꺼번에 본다.
- tools/check-sens.js: 능력치 반영(세계 2개 평균). check-sim.js: 장기 시뮬 불변식. check-ui.js: 넓은 화면(FM 모드 1280)·휴대폰(W=390).

## 최근 반영(오늘)
- 외부 리뷰 11-02k~r 약 50건, 공통 상태 점검, 등급(GRD)을 리그 순위 기준(S 5·A 25·B 90·C 280명)으로.
- 선수단·스태프 탭 정리(스태프 시장 신설), 감독 후보 넓은 화면.
- KBO 맞춤: 시상 자격, 순위 동률(상대 전적→다득점, 1위·5위 결정전), 하한 제재 30/50/100%, 프랜차이즈 예외, FA 1시즌=1군 등록 145일, 고액 연봉 2군 1/600 감액, 아시안게임 해 후반기 엔트리 30명.
- 멘탈(득점권·접전·포스트시즌), 꾸준함(기복), 포수 리드·배터리 호흡, 포수 수비 비중 0.92. 리그 평균 유지 확인(R/G 4.46→4.50). wRC+ 1위 범위가 160~222로 약간 넓어짐(목표 175 안팎) — 계속 관찰.

## 남은 일
1. 네 제도 모두 사용자 승인 완료. 아시아쿼터 교체 연 1회 분리와 기존 보류권의 실제 계약 검사 연결은 반영. 2차 드래프트·부상 대체 외국인은 미구현이며, 최신 공식/대체 자료의 네트워크 접근이 차단되어 세부 조건 확인이 남음. 기존 보류 만료 연도 규칙은 유지하며 규정 재검증 완료로 간주하지 않음.
2. 확인 못 한 KBO 규정(웨이버 기간, 방출 후 재계약 제한, 연봉조정 마감, 육성선수 인원)은 현 설정 유지 중.
3. 공통 점검 확장 후보: 거절된 행동 부작용 없음, 완료 결정 중복 실행/저장 후 재시도, 캐시 유무 동일 조회, 화면 안내 ↔ 처리 결과 대조.
4. 정책 결정 필요: 트레이드 후 68명 초과(시즌 구분), AI 하한 맞추기 재협상 기록, 군 복무 중 성장 환경, 복무 중 자기관리 사건.
5. FM 2단계: 소식함 분류를 2번째 줄로, 재정·스폰서·스태프 카드 그리드, 2번째 줄 빠른 버튼.
6. 백로그: 데이터 출처 표기, 20시즌 시뮬, 전략 비교, 홈 할 일 분류, 차트 후속, 다른 구단 경기 기록, 감독 영향, 구장 리모델링, 주소창 FM 단축키 추가 정리.
7. 멘탈 효과 크기 관찰(상위 wRC+), 필요하면 2.0에서 조정(src/engine/06_game.js outcome의 CLUTCH 계수).

## 도구
- ponytail 플러그인과 security-audit 스킬을 사용자 범위(~/.claude)에 설치함. 클라우드 작업 공간이 새로 만들어지면 없을 수 있음(설치: `claude plugin marketplace add DietrichGebert/ponytail` → `claude plugin install ponytail@ponytail`, `DISABLE_TELEMETRY=1 npx -y skills add https://github.com/cloudflare/security-audit-skill --skill security-audit --global --agent claude-code -y`).

## 외국인 오류 검수 인계(2026-11-02, Codex)
- 수정 전 규칙 테스트 5개·종류별 교체 화면 검사 실패 확인 후 수정. 전체 bash tools/check.sh 통과(346개 규칙·능력치·시뮬 3개·데스크톱·휴대폰).
- 일반 외국인 교체와 아시아쿼터를 별도 계산. 직접 계약·AI·시장·협상·방출 안내·교체 요청에 같은 기준 적용. 새해에는 각각 초기화.
- 보류권은 새 기록의 선수 식별자로 검사, 옛 이름·국적 기록은 호환. 유효 기록 40명 제한·중복 기록 제거.
- 옛 저장에서 과거 일반 합계에 섞인 아시아 교체는 종류별 정보가 없으면 복구 불가. 기존 일반 합계는 유지하며 이후부터 분리 기록.
- 현재 환경은 시스템 Chromium과 로컬 HTTP를 사용: /workspace/front-office-setup/start.sh 실행 후 env.sh를 로드하고 전체 검사. 검사 도중 빌드 금지.
- 아티팩트 URL 갱신 도구가 현재 제공되지 않아 재게시 미완료. 커밋·푸시와 실제 아티팩트 게시를 구분해서 보고할 것.
