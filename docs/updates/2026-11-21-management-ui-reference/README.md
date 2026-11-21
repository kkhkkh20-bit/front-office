# 관리 화면 — 공식 야구 게임 문서 비교 후 개선

2026-11-21 · 기준 main `ada3fc9f` · 브랜치 `codex/management-ui-reference-1121` · 미배포

[실제 화면 전후 비교](preview.html)

## 수정한 화면과 이유

| 화면 · 파일 | 확인한 문제 | 변경 |
|---|---|---|
| 계약 · `src/ui/contracts/54_contract_neg.js` | ‘협상 취소’는 창만 닫고 제출한 제안은 유지 | 버튼을 ‘닫기’로 표시. ‘제안 철회’는 그대로 구분 |
| PC 일정 · `src/ui/league/27_calendar.js` | 중계 확인 전 완료 경기의 결과 칸이 빈칸 | 주간 일정과 결과 표에 ‘미확인’. 점수·승패·선발은 계속 숨김 |
| PC 메디컬 · `src/ui/staff/34b_staff_fm.js` | 부상 복귀 30일이 지나도 실전 회복이 진행 중인 선수가 현재 목록에서 빠짐 | 모바일과 같은 현재 상태·회복률을 기존 표에 표시 |

선수단·훈련도 PC/390px에서 확인했다. 기존 능력/기록 보기, 필터, 훈련 추천·선택·신청 상태를 유지했다. 이번 범위에서 검증하지 않은 훈련 결함을 수정했다고 주장하지 않는다.

## 레퍼런스와 적용 범위

현재 OOTP/Mogul을 직접 플레이한 비교가 아니라 **공식 문서의 동작 설명을 확인한 비교**다. 게임 화면은 이 저장소의 실제 렌더링을 캡처했다.

- [OOTP Roster](https://wiki.ootpdevelopments.com/index.php?title=OOTP_Baseball:Screens_and_Menus/Team_Menu/Organization/Roster): 명단 안에 선수 상태와 조작을 함께 배치.
- [OOTP Filters](https://wiki.ootpdevelopments.com/index.php?title=OOTP_Baseball:Controls/Filters): 표시 항목과 대상 필터 구분. 기존 기능에 중복 안내를 추가하지 않음.
- [OOTP After the Contract Offer](https://manuals.ootpdevelopments.com/index.php?man=ootp23&page=after_contract_offer): 제출한 제안 상태와 의도적인 철회 구분.
- [Baseball Mogul Calendar](https://files.sportsmogul.com/help/Calendar.htm): 예정 경기와 완료 경기의 상태·동작 구분. 이 게임의 중계 결과 숨김 규칙은 유지.
- [Baseball Mogul Lineup](https://files.sportsmogul.com/help/Lineup.htm): 선수 목록에서 피로/몸 상태를 확인하는 구조.

이들 게임의 인원 제한·계약·예산·부상 판정을 도입한 작업은 아니다. 화면 문구와 기존 상태의 표시만 수정했다.

## 버튼 정렬 후속 수정

이전 시안 `3a43e473`에서 모바일 계약창의 ‘닫기’만 `inline-flex` 기본 정렬을 사용해 왼쪽에 붙었다. 실제 글자 중심이 버튼 중심에서 약 63.3px 벗어나는 실패를 먼저 확인했다. `src/css/contracts/10_fa_and_patches.css`의 해당 선택자에 가로·세로 가운데 정렬만 추가했다. 버튼 너비·순서·기능은 그대로다.

PC/모바일 계약창의 모든 표시 중인 실행 버튼(비활성 포함)의 실제 글자 영역과 버튼 영역 중심을 비교하는 회귀를 기존 UI 검사에 추가했다. 선수단·훈련·의무·일정의 표시 방식도 함께 점검했다. 구단/선수 행이나 정보 카드의 별도 정렬은 이번 수정 범위가 아니다.

[정렬 전 실패](button-align-before-test.txt) → [PC/모바일 정렬 및 기능 검사 통과](button-align-after-test.txt). [빌드 2종](button-align-build.txt)·[정적 검사](button-align-static.txt)·[의무 화면 6/6](button-align-medical.txt) 통과. [필수 규칙 재검사](button-align-migration.txt)도 4/4 통과했다. 최신 정렬 변경을 포함한 QUICK은 진행 중이다. 전체 검사·별도 장기 시뮬은 미실행이며 GitHub 결과도 확정 전이다. 배포하지 않았다.

## 영향과 경계

`src/modules.json`의 기존 로딩 순서와 `ngtClose`/`ngtWithdraw`, `calGames`, `injNowList` 호출 관계를 확인했다. 모듈 추가/순서 변경은 없다. 엔진·저장 구조·난수·AI·계약 실행·부상 판정은 수정하지 않았다. 두 종류 빌드 후 엔진은 기준 main과 바이트 단위로 동일하다([해시](engine-parity.json)).

변경 가능성이 있는 기존 기능은 계약 창 닫기/철회, 중계 결과 숨김, PC 의무 명단이다. 기존 공통 상태를 재사용하고 렌더링 전후 게임 데이터 보존을 검사했다.

## 검증

| 검사 | 결과 |
|---|---|
| 변경 전 정적 검사 | 통과 |
| 변경 전 재현 | PC 회복 상태·미확인 결과 두 영역·닫기 이름 PC/모바일 총 5건 실패 확인 |
| 의무 화면 독립 회귀 | 변경 전 3실패/3통과 → 변경 후 6/6 통과 |
| 빌드 2종 · 변경 후 정적 검사 | 통과 |
| PC 1440 / 모바일 390 실제 브라우저 | 계약 닫기·철회, 미공개/공개/예정 경기, 회복률, 상태 불변, 페이지 넘침 검사 통과 |
| 기존 계약 현금 UI 회귀 | 통과 |
| 기존 #1054~1056 일정 회귀 | 더블헤더·박스·중계 중 집계·교육리그 일정 통과 |
| 독립 코드 검토 | 세 소스 파일의 추가 결함 확인 없음 |
| `ONLY="11-09b"` | 4/4 통과 · CHECK_EXIT=0 |
| `QUICK=1 bash tools/check.sh` | 실행 중 — 결과 확정 전 |
| GitHub 검사 | 초안 PR 생성 후 확인 |
| 전체 `bash tools/check.sh` / 별도 장기 시즌 시뮬 | 미실행 |

[필수 11-09b](migration.txt) · [변경 전 UI 재현](ui-before-final.txt) · [변경 후 UI](ui-after-final.txt) · [의무 화면](medical-final.txt) · [계약 회귀](contract-regression.txt) · [일정 회귀](calendar-regression.txt) · [빌드](build.txt) · [정적 검사](static-after.txt)

## 남은 위험과 적용 상태

순수 화면 수정이지만 종합 검사·GitHub 검사 결과는 아직 확정되지 않았다. 실제 이용자 저장, 모든 해상도·긴 이름·모든 계약 유형의 조합은 확인하지 않았다. PC 내부 표는 기존처럼 내부 스크롤을 사용한다. 회복 안내는 공통 명단의 기존 문구를 그대로 사용한다.

`tools/check.sh`에 두 회귀 검사를 연결했다. 기존 검사 삭제·우회는 없다. `index.html`은 소스에서 재빌드했다. main 병합과 배포는 사용자 비교 확인 및 승인 후 진행한다.
