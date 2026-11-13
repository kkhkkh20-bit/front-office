# 야구 동작 애니메이션 교본 (수치 레퍼런스) — 2026-11-12

목적: 22본 Mixamo 리그(Hips/Spine/Spine1/Spine2/Neck/Head/Shoulder/Arm/ForeArm/Hand/UpLeg/Leg/Foot/ToeBase, 손가락 없음)로 투구·타격·수비·포수·주루 키프레임을 만들 때 **실제 역학 수치**에 맞추기 위한 참고 자료.

표기 규칙
- **[V]** = VERIFIED: 이번 조사에서 원문 페이지(초록·본문·공식 데이터)를 직접 열어 수치를 확인함.
- **[U]** = UNVERIFIED: 검색 요약·2차 인용으로만 확인. 원문 대조 필요.
- **[D]** = 위 수치로부터 계산한 파생값 (원 출처 수치가 아님).
- 각도 규약은 논문마다 다름. 무릎 굴곡 0° = 완전 신전. 어깨 외회전(ER)은 팔뚝이 수평일 때 기준 각도이며 MER 170°대는 "상완골 회전 + 견갑/흉추 신전"이 합쳐진 값이라 Arm 본 하나의 로컬 회전으로 170°를 넣으면 안 됨 (아래 "리그 적용 메모" 참고).

---

## 1. 요약 — 애니메이션에 바로 쓸 핵심 수치

| 동작 | 단계/이벤트 | 시점(타이밍) | 각도·거리·속도 | 출처 |
|---|---|---|---|---|
| 투구 | 레그리프트 최고점 | 착지 약 0.9 s 전 (대학) | 무릎 높이 ≈ 신장의 68% | Kageyama 2015 [V]; 이영준·김정태 2002 [V] |
| 투구 | 스트라이드 길이 | – | 신장의 77–85% (프로 77–81%) | Dowling 2022 [V]; Kageyama 2015 [V]; Thompson 2017 [V] |
| 투구 | 앞발 착지(FC) | t = 0 | 앞무릎 굴곡 40–49°; 어깨 외전 78–95°; 팔꿈치 굴곡 74–85°; 어깨 ER 60–80°; 골반 회전 53–72°(프로, 기준 정의는 논문 참조) | Thompson 2017 [V]; Dowling 2022 [V] |
| 투구 | 골반 최대 각속도 | FC→REL 구간의 25–39% | 골반 566–680 °/s(프로·대학 평균) | Seroyer 2010 [V]; Dowling 2022 [V]; Fleisig 2017 [V] |
| 투구 | 상체(몸통) 최대 각속도 | 구간의 51–52% | 몸통 ≈ 1100 °/s | Seroyer 2010 [V]; Fleisig 2017 [V] |
| 투구 | 어깨 최대 외회전(MER) | 구간의 ~81% | MER 165–178°; 팔꿈치 굴곡 ~90–100° | Seroyer 2010 [V]; Thompson 2017 [V] |
| 투구 | 공 릴리스(REL) | FC 후 ≈ 145 ms (대학 0.2 s로 반올림 보고) | 몸통 전방 기울기 30–33°(범위 32–55° 보고도 있음); 측방 기울기 21–32°; 어깨 외전 ≈ 90°; 팔꿈치 굴곡 24–39°; 앞무릎 30–40° | Seroyer 2010 [V]; Thompson 2017 [V]; Manzi 2021 [V]; Dowling 2022 [V] |
| 투구 | MER→REL | 42–58 ms (다른 계산으로는 145 ms × 19% ≈ 28 ms [D]) | ER 175° → 내회전 | Seroyer 2010(Pappas 인용) [V] |
| 투구 | 팔로스루 | REL 후 | 어깨 내회전 최대 속도는 REL 후 3–4 ms (구간의 102–104%) | Seroyer 2010 [V] |
| 투구(세트) | 홈까지 소요 | 투구 동작 시작→포수 미트 | 1.3 s 이하가 양호; 슬라이드 스텝 1.1–1.2 s | Tognetti 2013 [V]; Baseball Prospectus [U] |
| 타격 | 스트라이드(앞발 들림→착지) | 375 ms (초크업 336 ms) | – | DeRenne et al. [V] |
| 타격 | 앞발 들림→임팩트 | 586 ms → **착지→임팩트 ≈ 211 ms** [D] | – | DeRenne et al. [V] |
| 타격 | 배트 트래킹 구간 | 임팩트 전 약 150 ms부터 | 스윙 길이(배럴 이동거리) 평균 7.3 ft(≈2.2 m), 범위 약 6–8.5 ft | MLB Statcast 용어집 [V] |
| 타격 | 전환기(착지 전후) | – | 앞무릎 굴곡 31°(성인) → 가속기에 59° 신전 | Escamilla 2009 [V] |
| 타격 | 회전 순서 | 골반 → 몸통 → 배트 | 엉덩이 714 °/s → 어깨 937 °/s → 배트 31 m/s; 성인 상체 857 °/s, 배트 30 m/s | Welch 1995 [U]; Escamilla 2009 [V] |
| 타격 | 임팩트 | – | 공격각(어택앵글) MLB 평균 ≈ 10° (선수 평균 0–20°, 이상 5–20°); 스윙 경로 기울기 평균 ≈ 32° (20–50°) | MLB Statcast 용어집 [V] |
| 타격 | 스탠스 | 투구 릴리스 1초 전 측정 | 양발 간격 8.8–45.3 in(22–115 cm); 스탠스 각 12° 클로즈드–67° 오픈 | MLB Statcast 용어집 [V] |
| 수비 | 내야 준비 | 투구가 홈플레이트 앞 3 ft(≈0.9 m)를 지날 때 준비 완료 | 크리프/셋 스텝은 투수 팔이 올라갈 때~앞발 착지 시 시작(코칭 다수설) | Phillies/MLB.com 2021 [V]; 코칭 자료 [U] |
| 수비 | 외야 첫 반응 | 투구 릴리스 후 0–1.5 s = Reaction, 1.5–3 s = Burst | 드롭스텝 → 크로스오버 → 질주 | MLB Statcast 용어집 [V]; 코칭 자료 [U] |
| 수비 | 크로우홉 송구 | – | 정지 투구 대비 공 속도 34.2 → 37.7 m/s (+10%) | Fleisig 2017 [V] |
| 포수 | 팝타임(미트→2루 베이스 중앙) | MLB 평균 2.01 s(2018); 2026 리더보드 평균 1.94 s (1.84–2.07) | – | MLB 용어집 [V]; Baseball Savant 2026 [V] |
| 포수 | 익스체인지(포구→릴리스) | 2026 평균 0.67 s (0.50–0.92) → 비행 ≈ 1.27 s [D] | 송구 속도 평균 82.8 mph(≈37 m/s) | Baseball Savant 2026 [V] |
| 포수 | 포구 자세 | – | 2024년 MLB 투구의 90%가 한쪽/양쪽 무릎 다운 포구 | MLB.com(Petriello) 2024 [V] |
| 주루 | 홈→1루 | 타격 순간→1루 터치 | 2026 MLB 선수 중앙값 4.44 s (3.96–5.09); 우타 4.48 / 좌타 4.40 | Baseball Savant 2026 [V] |
| 주루 | 스프린트 속도 | 최고 1초 구간 | 평균 27.4 ft/s(≈8.3 m/s), 30 ft/s 이상 = Bolt; 1초에 약 7보 | Baseball Savant 2026 [V]; MLB 용어집 [V] |
| 주루 | 리드 | 투수 첫 동작 시 / 릴리스 시 | 1차 리드 평균 11.6 ft(3.5 m), 2차 15.2 ft(4.6 m); 도루 시 12.1 ft → 24.1 ft(7.3 m) | Baseball Savant 2026 [V] |
| 주루 | 슬라이딩 시작 | – | 베이스 약 6–10 ft(1.8–3.0 m) 전, "자기 키 정도" | 코칭 자료 [U] |
| 주루 | 슬라이드 vs 헤드퍼스트 | – | 1루→2루 등 측정 3.67 s vs 3.65 s (차이 없음) | Hosey 2003 [V] |

---

## 2. 동작별 상세

### 2.1 투구 (오버핸드, 와인드업/세트)

**단계 정의 (ASMI/Fleisig 계열 표준)**: 와인드업 → 레그리프트 최고점(MKH, balance) → 스트라이드 → 앞발 착지(FC/SFC) → 암코킹(FC→MER) → 가속(MER→REL) → 감속(REL→어깨 최대 내회전) → 팔로스루.

**시간축**
- 레그리프트 최고점(MKH)→앞발 착지: 0.9 ± 0.2 s(청소년), 0.9 ± 0.3 s(대학). 착지→릴리스: 0.2 s(반올림). 전체 1.1 s. — Kageyama, Sugiyama, Kanehisa, Maeda (2015), "Difference Between Adolescent and Collegiate Baseball Pitchers in the Kinematics and Kinetics of the Lower Limbs and Trunk During Pitching Motion", J Sports Sci Med 14(2):246–255. https://jssm.org/volume14/iss2/XML/jssm-14-246.xml [V]
- 착지→릴리스 0.145 s (Stodden 등 인용). 이벤트 순서(착지→릴리스 구간 대비 %): 골반 최대 각속도 25–39%, 상체 최대 각속도 51–52%, MER·팔꿈치 신전 시작 81%, 팔꿈치 최대 신전속도 90–95%, 몸통 전방 기울기 최대 속도 93–96%, 어깨 최대 내회전 속도 102–104%. MER→REL 42–58 ms; 손목 굴곡은 릴리스 전 20 ms, 전완 회내 90°는 릴리스 전 10 ms. — Seroyer, Nho, Bach, Bush-Joseph, Nicholson, Romeo (2010), "The Kinetic Chain in Overhand Pitching", Sports Health 2(2):135–146. https://pmc.ncbi.nlm.nih.gov/articles/PMC3445080 [V]
- 국내 연구: 국가대표·대학 우완 4명, 총 투구 소요 1.78 ± 0.07 s(직구), 앞다리 무릎 최고 높이 125 cm = 신장의 68.4%, 스트라이드 140.4 cm = 신장의 76.9%(직구) / 79.4%(커브). — 이영준·김정태 (2002), "직구와 커브 투구동작의 운동학적 비교 분석", 한국운동역학회지 12(2):109–130. https://koreascience.kr/article/JAKO200220163389339.page [V]
- [D] 키프레임 환산: 145 ms ≈ 30 fps 기준 4.4 프레임, 60 fps 기준 8.7 프레임. MER은 FC 후 ≈117 ms(7 프레임 @60fps), 릴리스는 MER 후 ≈28–58 ms. 실시간 재생 시 암코킹~릴리스가 2–3 프레임에 지나가므로, 중계 리플레이는 슬로모션 배율을 따로 두는 게 현실적.

**FC·MER·REL 시점 관절각 (청소년 체계적 문헌고찰, 범위)** — Thompson, Guess, Plackis, Sherman, Gray (2017), "Youth Baseball Pitching Mechanics: A Systematic Review", Sports Health 10(2):133–140. https://pmc.ncbi.nlm.nih.gov/articles/PMC5857730 [V]

| 변수 | FC | MER | REL |
|---|---|---|---|
| 스트라이드 길이 | 신장의 66–85% | – | – |
| 앞무릎 굴곡 | 40–49° | – | 31–41° |
| 어깨 외전 | 78–95° | 66–92° | 70–94° |
| 어깨 수평 굴곡(+ = 팔꿈치가 어깨 앞) | −18 ~ −30° | −4 ~ −20° | 0 ~ 23° |
| 어깨 외회전 | 60–80° | **166–178° (최대)** | 109–143° |
| 팔꿈치 굴곡 | 74–85° | 57–95° (최대 95–101°) | 24–39° |
| 몸통 전방 기울기 | – | – | 30–33° |
| 몸통 측방 기울기 | – | – | 21–30° |
| 최대 각속도 | 골반 602–1202 °/s, 팔꿈치 신전 1742–2272 °/s, 어깨 내회전 3396–9000 °/s | | |

**대학 투수 (Kageyama 2015) [V]**: 스트라이드 1.5 m = 신장의 84.6%; 앞무릎 굴곡 FC 46.8° → REL 38.0°; 몸통 전방 기울기 MKH −15.7°(뒤로 젖힘) → FC −4.0° → MER 12.9° → REL 25.4°; 골반 회전 FC 14.8° → MER 90.2° → REL 101.9°; 상체 회전 FC −33.4° → MER 79.8° → REL 122.5° (논문의 좌표계 기준; 즉 FC 시점 골반-상체 차이 ≈ 48° [D]).

**프로 투수**
- 골반 회전(착지 시) 열린 그룹 53 ± 7° / 닫힌 그룹 72 ± 7°; 스트라이드 81 ± 5% / 77 ± 5% 신장; 앞무릎 굴곡 FC 49 ± 6° / 47 ± 10°, MER 39° / 47°, REL 30 ± 17° / 40 ± 17°; FC→REL 무릎 신전량 20° / 7°; 골반 최대 각속도 680 / 666 °/s; 구속 39.1 / 38.4 m/s. — Dowling, Knapik, Luera, Garrigues, Nicholson, Verma (2022), "Influence of Pelvic Rotation on Lower Extremity Kinematics, Elbow Varus Torque, and Ball Velocity in Professional Baseball Pitchers", Orthop J Sports Med 10(11). https://pmc.ncbi.nlm.nih.gov/articles/PMC9720809 [V]
- 릴리스 시 어깨 외전 90.7 ± 8.3° / 92.0 ± 8.3°, 몸통 측굴 −27.1 ± 9.3° / −31.8 ± 9.0°, 암슬롯 59.7 ± 13.5° / 54.7 ± 12.4°(일관성 높음/낮음 그룹). — Manzi, Dowling, Wang 외 (2021), "Kinematic and kinetic findings in high vs. low consistency professional baseball pitchers", J Orthop 27:28–33. https://pmc.ncbi.nlm.nih.gov/articles/PMC8387831 [V] (암슬롯 각의 정확한 정의는 본문 확인 필요 [U])
- 어깨 외전 80–100°(던지는 자세), 후기 코킹 90–95°; MER 165–175°; 몸통 전방 기울기 릴리스 시 평균 32–55°, 최대 각속도 300–450 °/s. — Seroyer 2010 [V]

**와인드업 vs 세트**: 프로에서 와인드업과 세트 직구 간 관절 운동역학·운동학·타이밍에 통계적 차이 없음. — Dun, Fleisig, Kingsley, Loftice, Andrews (2008), "Biomechanical comparison of the fastball from wind-up and the fastball from stretch in professional baseball pitchers", Am J Sports Med 36:137–141. [U] (검색 초록 요약으로만 확인). 즉 **FC 이후 키프레임은 공유**하고, 차이는 FC 이전(세트 자세 정지 2–3 s, 레그리프트 높이/슬라이드 스텝)에만 두면 됨. 세트 포지션에서 2–3초 정지 후 투구, 홈까지 1.3 s 이하 양호 — Tognetti (2013), "A Pitcher's Guide to Preventing Stolen Bases", Coaches Insider. https://coachesinsider.com/baseball/a-pitchers-guide-to-preventing-stolen-bases-article/ [V]

**사이드암/언더핸드(잠수함)**
- 프로 207명(오버 30, 스리쿼터 156, 사이드 21): 릴리스 시 몸통 반대쪽 측방 기울기와 어깨 외전은 오버핸드 최대, 사이드암 최소. — Escamilla, Slowik, Diffendaffer, Fleisig (2018), "Differences Among Overhand, 3-Quarter, and Sidearm Pitching Biomechanics in Professional Baseball Players", J Appl Biomech 34(5):377–385. https://scholars.csus.edu/esploro/outputs/journalArticle/Differences-Among-Overhand-3-Quarter-and-Sidearm/99257880232301671 [V — 질적 결과만, 그룹별 수치는 초록에 없음]
- 대학 엘리트: 릴리스 시 몸통 측굴 오버핸드 −23°, 사이드암 −12° (Nagami et al. 2024, J Shoulder Elbow Surg) [U]
- 암슬롯은 몸통 측방 기울기 + 어깨 외전 + 팔꿈치 굴곡의 조합으로 결정됨 (OJSM 2022, doi 10.1177/23259671221147874) [U]
- **잠수함(언더핸드) 투수의 정량 연구는 찾지 못함.** 애니메이션 상으로는 어깨 외전을 크게 바꾸기보다 몸통 측방 기울기를 반대 방향(투구팔 쪽)으로 크게 주고 상체를 깊이 숙이는 방식이 위 연구의 "암슬롯 = 몸통 기울기 + 외전" 구조와 일관됨 [D, 해석].

### 2.2 타격

**단계**: 스탠스 → 로드(뒤로 체중 이동·몸통 코일) → 스트라이드(앞발 들림 → 착지/토터치) → 전환(착지 → 손 출발) → 가속(→ 임팩트) → 익스텐션 → 팔로스루. (Welch 1995의 3대 이벤트: foot off, foot down, ball contact [U])

**타이밍**
- 대학·프로 14명: 스트라이드(앞발 들림→착지) 0.375 ± 0.075 s; 스윙(앞발 들림→임팩트) 0.586 ± 0.078 s. 초크업 시 각각 0.336 s / 0.535 s. — DeRenne, Morgan, Escamilla, Fleisig, "A Choke-Up Grip Facilitates Faster Swing and Stride Times Without Compromising Bat Velocity and Bat Control", The Sport Journal (2010 게재). https://thesportjournal.org/article/a-choke-up-grip-facilitates-faster-swing-and-stride-times-without-compromising-bat-velocity-and-bat-control/ [V]
- [D] 착지→임팩트 ≈ 0.211 s (60 fps 기준 약 13 프레임). MLB 배트 트래킹은 임팩트 전 약 150 ms부터 배럴을 추적 — 이 구간이 "배트가 본격적으로 나오는" 시간의 대략치. — MLB Statcast 용어집 "Swing Length". https://www.mlb.com/glossary/statcast/swing-length [V]

**각도·속도**
- 성인(대학/프로) vs 청소년: 전환기 앞무릎 굴곡 31° vs 13°, 가속기 앞무릎 신전 59° vs 32°; 상체 최대 각속도 857 vs 717 °/s; 앞팔(좌타 기준 왼팔) 팔꿈치 신전 752 vs 598 °/s; 앞무릎 신전 386 vs 303 °/s; 임팩트 시 배트 선속도 30 vs 25 m/s; 성인은 임팩트 시 상체가 더 닫혀 있음. — Escamilla, Fleisig, DeRenne 외 (2009), "A Comparison of Age Level on Baseball Hitting Kinematics", J Appl Biomech 25(3):210–218. https://scholars.csus.edu/esploro/outputs/journalArticle/A-Comparison-of-Age-Level-on/99257847088101671 [V]
- 엉덩이 최대 회전속도 714 °/s(착지 직후) → 어깨 937 °/s → 배트 최대 31 m/s(임팩트 직전); 앞발이 체중의 123% 힘으로 지면을 밀어냄. — Welch, Banks, Cook, Draovitch (1995), "Hitting a Baseball: A Biomechanical Description", JOSPT 22(5):193–201. doi 10.2519/jospt.1995.22.5.193 [U]
- 골반→몸통→배트 순서 (골반 389 °/s < 몸통 601 °/s < 배트 1953 °/s), 몸통-골반 분리 최대 ≈ 22° (아마추어 3명, ISBS 2015 학회 논문) [U]
- 공격각: MLB 평균 ≈ 10°, 이상 범위 5–20°. 스윙 경로 기울기: 평균 ≈ 32°, 높은 공에는 평평하게/낮은 공에는 가파르게. — MLB Statcast 용어집 "Attack Angle", "Ideal Attack Angle", "Swing Path (Tilt)". https://www.mlb.com/glossary/statcast/swing-path-tilt [V]
- 배트 스피드 리그 평균 71.5 mph(≈32 m/s), 스윗스팟(배트 끝에서 6 in) 기준 [U — MLB 원문 페이지 로드 실패, 2차 인용]
- 스탠스: 홈플레이트 앞에서 타자 엉덩이 중심까지 11.2–37.2 in, 플레이트 안쪽에서 20.9–34.5 in, 발 간격 8.8–45.3 in, 스탠스 각 12° 클로즈드~67° 오픈 (2024 극단값). — MLB Statcast 용어집 "Batting Stance". https://www.mlb.com/glossary/statcast/batting-stance [V]

**찾지 못한 타격 수치**: 임팩트 시 앞무릎 절대 각도, 착지 시 골반-어깨 분리각(프로), 머리 이동량(cm), 체중 분배 %(로드 시 뒷발 %), 타자 스트라이드 길이(신장 %). 국내외 원문(Escamilla 2009 본문 표, Sports Biomech 2024 하체 연구) 확인 필요.

**번트(희생번트) 자세** — 코칭 자료만 확인 [U]
- 피벗(앞발 기준 양발 회전) 방식이 주류, 스퀘어(양발을 투수 쪽으로 정렬)는 커버리지 넓지만 몸쪽 공 회피가 어려움.
- 무릎 굽혀 눈높이를 스트라이크존 상단에 맞추고, 배트는 눈높이보다 약간 낮게, 배트 각도는 약 45°(또는 거의 수평) — 높이는 무릎으로 조절하고 배트 각도는 유지. — Human Kinetics "Sacrifice Bunting" 발췌, Horton "Sacrifice Bunting" (Jugs Sports PDF), Baseball Canada "The Art of Bunting" [U]

### 2.3 수비

- **내야 프리피치**: 필리스 내야 코치 Juan Castro — "공이 홈플레이트를 지나기 전 마지막 3피트가 내야수에게 가장 중요"; 매 투구 'engage'. — Todd Zolecki, "'Engage': Infielders work on pre-pitch setup", MLB.com, 2021-02-27. https://www.mlb.com/news/phillies-infielders-work-on-setup-drills [V]
- 크리프/셋 스텝 시작 시점: 투수 팔이 올라갈 때 또는 앞발 착지 시(투수 팔이 귀 높이를 지날 때 작은 한 걸음 후 스탠스 넓히기); 공이 타격 구역에 들어올 때 양발이 지면에, 발볼에 체중. 오른발-왼발 순서가 흔함. — 코칭 사이트 다수(Coaches Insider, Little League University, 포럼) [U]
- **땅볼 포구 자세**: 정량 각도 연구는 찾지 못함. 일본 연구는 포구→왼발 이지→디딤발 착지 간격이 송구 릴리스 시간과 상관 (내야수 14명, 5 m 굴린 공, 20 m 송구) — 수치는 초록에 없음. Kita, Yamamoto, Maeda (2014), "Relationship between Lower Extremity Motions and Release Time of Baseball Infielders while Fielding Grounders", Int J Sport Health Sci 12:17–23. https://www.jstage.jst.go.jp/article/ijshs/12/0/12_201316/_article/-char/en [V — 설계만]
- **크로우홉**: 목표 방향으로 몸을 옆으로 돌린 채 몇 걸음(뒷발이 앞발 뒤로 교차 또는 셔플). 마운드 투구 대비 공 속도 34.2 → 37.7 m/s, 골반 572 °/s, 상체 1105 °/s, 어깨 내회전 6705 °/s(5 oz 공). — Fleisig, Diffendaffer, Aune, Ivey, Laughlin (2017), "Biomechanical Analysis of Weighted-Ball Exercises for Baseball Pitchers", Sports Health 9(3):210–215. https://pmc.ncbi.nlm.nih.gov/articles/PMC5435148 [V]
- **외야 첫 스텝**: Statcast Jump = 투구 릴리스 후 3초간 올바른 방향 이동거리; Reaction = 첫 1.5 s 이동거리(첫 스텝), Burst = 다음 1.5 s(가속), Route = 직선 대비 효율. — MLB Statcast 용어집 "Jump". https://www.mlb.com/glossary/statcast/jump [V]
- 머리 위로 넘어가는 타구: 공 쪽 발을 뒤로 빼는 드롭스텝 → 크로스오버 → 질주, 백페달 금지. 송구할 경우 던지는 팔 쪽 어깨 위에서 포구. — 코칭 자료(Stanford Softball/STACK, Dugout Captain, TeamSnap) [U]
- **반응 시간(ms)**: 야수 첫 스텝 반응 시간을 ms로 보고한 동료심사 연구는 찾지 못함. Statcast는 시간이 아닌 거리로 측정.

### 2.4 포수

- **팝타임 정의**: 투구가 미트에 닿은 순간 → 지정 야수가 베이스 중앙에서 받는 순간(추정). 구성 = 풋워크 + 익스체인지(글러브→릴리스) + 송구 속도. MLB 2루 도루 시 평균 2.01 s (2018), 최상위 1.90 s. — MLB Statcast 용어집 "Pop Time". https://www.mlb.com/glossary/statcast/pop-time [V]
- **2026 Baseball Savant 포수 리더보드 (94명, 단순평균 [D])**: 2루 팝타임 1.94 s (1.84–2.07), 익스체인지 0.67 s (0.50–0.92), 최대노력 송구 82.8 mph (76.6–90.1). https://baseballsavant.mlb.com/leaderboard/poptime [V]
  - [D] 송구 비행 시간 ≈ 1.94 − 0.67 ≈ 1.27 s. 애니메이션: 포구 → 0.67 s 이내에 오른발 이동·팔 테이크백·릴리스 완료.
- 청소년 포수 21명(평균 12세) 단계 비중: 시작(동작 개시→디딤발 착지) 76–82%, 암코킹 14–19%, 가속 4–6%; 빠른 시도의 시작 단계 0.77 s vs 느린 1.17 s. — "Differences in Throwing Phase Durations Between Fast and Slow Transfer Times in Youth Baseball Catchers", IJESAB 16(3). https://digitalcommons.wku.edu/ijesab/vol16/iss3/113 [V — 청소년이라 프로 수치로 쓰면 안 됨, 비율 참고용]
- **포구 스탠스**: 2024년 MLB 투구의 90%가 한쪽 또는 양쪽 무릎 다운으로 포구(무릎 높이 9 in 미만 기준), 2021년엔 약 50:50. Jerry Weinstein: 가치의 90%+ 는 프레이밍(리시빙), 블로킹 6%, 송구 1%. — Mike Petriello, "Why the World Series catchers will be on one knee", MLB.com, 2024. https://www.mlb.com/news/why-the-world-series-catchers-will-be-on-one-knee [V]
- 주자 없을 때 1차 스탠스 / 주자 있거나 2스트라이크 시 2차 스탠스(발 더 넓게, 엉덩이 더 높게). — Little League University 등 코칭 자료 [U]
- **블로킹**: 점프 없이 양 무릎을 공 쪽으로 빠르게 떨어뜨리기, 글러브로 다리 사이 막기(맨손은 글러브 뒤), 턱을 가슴으로 당김, 어깨를 둥글게 말아 공 위로 — 공이 앞으로 떨어지게. — Little League "Blocking Tips" 등 [U]. 블로킹 정량 연구는 찾지 못함.

### 2.5 주루·슬라이딩

- **홈→1루** (타격 순간→1루 첫 터치): 2026 Savant 509명 평균 4.46 s, 중앙값 4.44 s, 범위 3.96–5.09 s; 우타 중앙값 4.48 / 좌타 4.40 s. https://baseballsavant.mlb.com/leaderboard/sprint_speed [V]
- **스프린트 속도**: 567명 평균 27.4 ft/s(8.3 m/s), 최고 30.5 ft/s. 1초 창에 전력 보폭 약 7보. — MLB 용어집 "Sprint Speed" [V], Savant 2026 [V]
  - [D] 7보/s → 보폭 주기 ≈ 143 ms/보 (60 fps 약 8.6 프레임). 27 ft/s ÷ 7 ≈ 3.9 ft(1.2 m)/보 — 실제 보폭은 선수별 상이.
- **리드 거리** (베이스→주자 무게중심, 투수 첫 동작 시): 2026 Savant 주자 435명 단순평균 1차 리드 11.6 ft(3.5 m), 2차(릴리스 시) 15.2 ft(4.6 m), 2차−1차 3.5 ft. 도루 시도 시 1차 12.1 ft, 2차 24.1 ft(7.3 m). https://baseballsavant.mlb.com/leaderboard/basestealing-run-value [V]; 정의는 MLB 용어집 "Lead Distance" [V]
- **슬라이딩 시간**: 대학 20명, 발 먼저 3.67 s vs 머리 먼저 3.65 s (P = 0.357, 차이 없음); 90%가 발 먼저가 안전하다고 인식. — Hosey, Mattacola, Shapiro (2003), "High-speed video analysis of head-first and feet-first sliding techniques", Clin J Sport Med 13(4):242–244. https://scholars.uky.edu/en/publications/high-speed-video-analysis-of-head-first-and-feet-first-sliding-te/ [V] (측정 구간 거리는 초록에 없음)
- 1루 도달: 달려서 통과 > 헤드퍼스트 > 발 먼저 > 멈추기 순으로 빠름. — Ficklin, Dapena, Brunfeldt (2016), J Sport Health Sci [U]
- 계획된 발 먼저 슬라이드는 비계획 슬라이드·달리기보다 느림, 마지막 25 ft(7.62 m) 분석. — Hanson & Hsieh (2015), "Baseball Feet-First Sliding Technique", ISBS. https://ojs.ub.uni-konstanz.de/cpa/article/view/6561 [V — 수치 없음]
- **슬라이드 시작 거리**: 코칭상 6–8 ft(일부 9–10 ft, 3–5 ft) 또는 "자기 키 정도" — 속도에 따라 다름, 점프하지 말고 앉듯이. [U]. 슬라이드 지속 시간 연구는 찾지 못함.
- **팝업 슬라이드**: 굽힌 다리(밑다리)를 베이스에 대고 뻗은 다리 무릎을 굽혀 관성으로 일어남 — 코칭 자료(CoachUp "How To Pop-Up Slide") [U], 정량 자료 없음.

---

## 3. 리그 적용 메모 (Mixamo 22본)

- **앞무릎**: Leg 본 굴곡 = 위 "무릎 굴곡" 값을 그대로 사용 (투구 FC 45° → REL 30–40°, 신전 블록). 타격은 착지 후 굴곡 → 임팩트까지 크게 신전(성인 59° 신전 폭).
- **골반·몸통 분리**: Hips(골반)와 Spine2(상체) 요(yaw) 차이로 표현. 투구 FC 시점 골반은 이미 열리고(프로 53–72°) 상체는 닫힌 상태 → 골반 최대속도(25–39%) 후 상체 최대속도(51–52%). Spine/Spine1/Spine2에 분산.
- **어깨 외전 ≈ 90°** 유지가 핵심. 오버핸드/사이드 차이는 Arm 외전보다 **Spine 측방 기울기**(오버 −23~−32°, 사이드 −12°)로 주는 것이 연구와 일치.
- **MER 165–178°**: 단일 Arm 로컬 회전으로 넣으면 관절이 깨져 보임. 일부는 Spine2 신전(가슴 열기)·Shoulder 본 후인으로 분담 [D, 리깅 해석].
- **손목/전완**: 손가락 없음. 릴리스 전 20 ms 손목 굴곡, 10 ms 회내는 Hand 본 1–2 프레임 스냅으로 표현.
- **"뻣뻣함" 해소 포인트**: 이벤트 간 속도 프로파일이 근위→원위로 순차적으로 정점(골반 → 몸통 → 팔꿈치 → 어깨 내회전)이 되도록 키 간격을 엇갈리게 두면 기계적인 동시 회전을 피할 수 있음. "흐물거림" 해소: 착지 후 앞다리 신전(블록)과 머리 고정.

---

## 4. 참고 영상·데이터 (시각 레퍼런스 전용 — 재배포·게임 내 사용 금지)

| 자료 | 내용 | 사용 조건 |
|---|---|---|
| MLB Film Room (https://www.mlb.com/video) | 2017년 이후 모든 투구 영상 검색·클립 생성 | MLB 저작물. MLB.com 이용약관(https://mlb.com/tou) 적용. 키프레임 참고용 시청만, 프레임 추출 재배포 금지 |
| Baseball Savant (https://baseballsavant.mlb.com) | 선수별 투구 영상, 팝타임·스프린트·리드 리더보드, Illustrator | MLB 데이터·영상. 수치 참고는 가능, 영상 재배포 불가 [약관 세부는 미확인] |
| KBO 공식 유튜브 — 유소년 타격 교육 영상 (박용택 해설위원, 10회: 스탠스·중심 모으기·중심이동·키네마틱 시퀀스·스윙 플레인·팔로스루) | 2023-01 공개. 출처: 뉴스서울 2023-01-20 https://newsseoul.co.kr/news/view/1065572407938783 [V] | KBO 저작물. 시청 참고만 |
| KBO 공식 유튜브 — 유소년 투수 교육(2021), 부상방지 교육(2023), '크레레' 레전드 특강(윤석민 투수편 등, 2026) | 투구 동작 시범 | KBO 저작물. 시청 참고만 [U — 채널 내 재생목록 직접 확인 안 함] |
| OpenBiomechanics Project (Driveline) https://github.com/drivelineresearch/openbiomechanics | 투구 411회(100명)·타격 677회(98명) C3D 마커 + 관절각 시계열(360 Hz) | 데이터 CC BY-NC-SA 4.0 + **비상업 전용**, 프로 구단·관련 종사자 사용 금지 조항. 상업 게임에 사용하려면 별도 상업 라이선스 필요 [V]. 수치 대조용 내부 참고로만 검토 권장 |
| MLB.com 기사 영상 (Petriello 원-니 포수, Phillies 내야 셋업) | 포수 원-니 포구, 내야 프리피치 | MLB 저작물, 참고만 |

---

## 5. 확인 못 한 것 / 한계

- **Fleisig 1999 (J Biomech 32:1371) 프로 투수 표 수치**와 **Escamilla 1998 구종별 프로 수치**: 원문 접근 불가. 위 프로 수치는 Dowling 2022, Manzi 2021, Seroyer 2010 리뷰로 대체.
- **MER→REL 시간**: 42–58 ms(Pappas 인용) vs 145 ms × 19% ≈ 28 ms [D] 사이 불일치. 표본 차이로 추정.
- **투구 무게중심 이동량, 머리 안정성(머리 이동 cm)**: 수치 미발견.
- **사이드암/잠수함 그룹별 각도**: Escamilla 2018 본문 수치 미확인, 잠수함 전용 연구 미발견.
- **타격**: 임팩트 시 앞무릎 절대각, 프로 골반-어깨 분리각, 체중 분배 %, 머리 이동량, 스트라이드 길이(신장 %) 미확인. Welch 1995 수치는 2차 인용 [U].
- **배트 스피드 평균 71.5 mph**: MLB 원문 페이지가 로드되지 않아 [U].
- **내야수 첫 스텝 반응 시간(ms)**, 땅볼 포구 관절각, 크로우홉 보폭: 동료심사 수치 미발견.
- **포수 프로 단계별(풋워크/암코킹/가속) 시간 분해**와 블로킹 정량 연구: 미발견 (청소년 비율만).
- **슬라이드 시작 거리·슬라이드 지속 시간·팝업 슬라이드**: 코칭 의견만 있고 연구 수치 없음.
- **국내(KBO) 프로 대상 운동학 논문**: 2002 국가대표급 4명 외에 본문 수치 확인 못 함 (한국운동역학회지·한국체육과학회지 추가 검색 필요).
- Savant 2026 평균은 선수별 평균의 단순평균이며 시즌 진행 중/종료 시점 데이터임(조회일 2026-11-12).
