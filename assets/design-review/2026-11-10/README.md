# 플레이 리뷰 기반 운영·육성 에셋

2026-11-10(KST). main `8b4b902`를 직접 플레이한 뒤 제작했고, 사용자 요청으로 연수·의료 화면에 실제 연결했습니다. 최초 에셋 리뷰 브랜치는 `assets/gameplay-design-review`이며, 게임 연결은 main에 반영했습니다.

**새 사진 8장, 960×540·480×270 RGB WebP q84 각 1벌**, 연수 5종·의료 3종입니다. 실제 게임에는 연수 목록/상세, 의료 사진, 모바일 필수 탭 노출을 적용했습니다. `preview.html`은 최초의 별도 디자인 시안으로 남겨 두었습니다. 연결 검증은 저장소의 `docs/updates/2026-11-10-operations-art/README.md`에서 확인할 수 있습니다.

- [8장 비교판](previews/contact_8.jpg)
- [PC 배치 시안](previews/mock-desktop-training.webp), [태블릿](previews/mock-tablet-training.webp), [모바일 목록](previews/mock-mobile-list.webp), [모바일 상세](previews/mock-mobile-detail.webp)
- [직접 선택해 보는 배치 시안](preview.html): 연수/의료 묶음과 항목을 선택할 수 있습니다. 모바일에서는 상세 → 목록으로 돌아갑니다. 게임 저장을 읽거나 수정하지 않습니다. 폴더 전체를 내려받으면 preview.html을 직접 열 수 있습니다.
- [기획·리뷰](DESIGN_PROPOSAL.md), [연결 인계](CLAUDE_HANDOFF.md), [파일·좌표·해시](manifest.json), [검수](validation.json)

두 크기 합계 798,960bytes. 사진에는 글자·로고·구단 심벌·비용·능력치를 넣지 않았습니다. 인물은 가상 성인이며 배경 장면용입니다. 인물 선택용 얼굴 풀을 새로 만든 작업은 아닙니다.

폰트·비용·능력·확률·정원은 HTML과 실제 게임 데이터로 표시하도록 제안했습니다. 시안의 참가비·출발일은 main의 OVS를 읽은 예시 스냅샷이며, 게임 연결 시 현재 OVS와 선수별 계산을 다시 사용해야 합니다.

플레이 증거는 review/evidence/에, 검수 범위와 한계는 review/gameplay_review.json에 있습니다. 실서비스 배포판이나 실제 iPhone/iPad에서 검수했다고 주장하지 않습니다.
