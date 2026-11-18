# 세계 단일 능력 척도 감사 (origin/main 1ee1c5e7, 2026-11-18)

읽기 전용 감사. 인용은 모두 origin/main 기준 `파일:줄`.
수치 측정: 로컬 dist/engine.js(HEAD 353a3ee7, origin/main보다 57커밋 뒤. 능력 관련 파일 차이는 01_rules.js 13줄뿐)로 `newGame(6)`과 창단 드래프트를 끝까지 한 세계 1개(seed 7). 근사치로 보면 된다.

## 1. KBO 선수 능력 모델

### 능력치·범위
- 내부 척도는 20~80 하나다. `genRatings`(src/engine/league/01_rules.js:148)는 각 툴을 `clamp(N(base,7),20,80)`로 만든다.
  - 타자: con·pow·eye·spd·def에 vit(체력)가 더 있다. vit은 OVR에 들어가지 않는다.
  - 투수: stf·ctl·sta.
  - 포지션별 보정: SS·CF·2B는 수비·주력 +, 1B·코너는 파워 +, 포수는 수비 +9.
- `setOvr`(01_rules.js:158)는 목표 OVR에 맞춰 모든 툴을 같은 폭으로 옮긴다.
- `TOPK`(01_rules.js:163)는 C·SS·2B·CF 상위 재능의 위쪽 끝을 누른다.

### OVR·POT 계산
- OVR(01_rules.js:118)
  - 투수: stf×.44 + ctl×.44 + sta×.12
  - 타자: con×.3 + pow×.25 + eye×.15 + spd×.1 + def×.2
- 보조 값: `offV`, `spV`(stf .45/ctl .4/sta .15), `penV`(stf .55/ctl .45)는 01_rules.js:119-121에 있다.
- POT은 `p.pot = clamp(max(ovr, o.pot), 20, 80)`이다(newPlayer, 01_rules.js:164~). 숨은 재능은 `hidT`로 따로 둔다(10_draft.js:94).

### 실제로 나오는 값(측정, 내부 척도)
- 리그 주전 평균(lgStartAvg): ALL 49.9, BAT 49.4, SP 51.8, RP 48.6. 100점 화면으로는 약 62다.
- 국내 1군·2군 소속 분포
  - 중앙값 41.3, p75 47.1, p90 51.8, p97 56.3, p99 59.6
  - 국내 상위 10명: 58.7~66.4
- 외국인(6명): 중앙값 58.1
- 코드에 박힌 기준
  - "1군 주전 평균 약 53, 리그 상위 5% 약 60"(src/engine/players/64_pot_tier.js:4)
  - curBand 경계: 60 상위 5% / 56 확실한 주전 / 52 주전 평균 / 48 백업 / 44 경계(src/engine/players/65_cur_eval.js:6)
- 시작 세계는 주전 평균이 약 50이다. 이후 `LV_UP=3`(10_draft.js:72)만큼 국내 상위 300명 평균을 끌어올리므로, 몇 시즌 뒤 정상 상태는 주전 평균 약 52~53(화면 64~65)이다.
- 10_draft.js:70 주석에 적힌 목표: 화면 기준 주전 70대 초중반, 리그 상위 10명 80대 중후반.

### 화면 척도
- 기본은 100점 척도다. `DV_PTS` 조각 선형 변환(src/core/ratings.mjs:2-4)으로 바꾼다.
  - 20→30, 24→42, 35→52, 45→58, 51→63, 58→73, 65→84, 72→95, 78→100
- '20-80' 옵션은 `G.cfg.scale==='2080'`일 때 켜진다(src/engine/runtime/00_base.js:34-36). 내부 값을 반올림만 해서 그대로 보인다.
  - 설정 화면: src/ui/finance/35_club.js:140
  - 패치 노트 문구 "50이 리그 평균"(src/ui/media/75_patch_notes.js:718)과 달리 다시 정규화하지 않는다.
  - 실제로는 KBO 주전 평균이 약 50~53이라, 이미 '한국 기준 50'에 가깝다.
- 등급 S~F는 리그 순위로 정한다. 경계는 그날 분포에서 구한다(00_base.js:45-50, GRD_RANK).

### 능력 인플레이션 보정(리그 수준 유지, 국내 선수만 센다)
- `lgTopDom`(10_draft.js:67): 국내 상위 300명 평균. 기준값은 시작 때 `G.lgBaseT`에 저장하고, 목표는 기준 + LV_UP다.
- `draftLevelAdj`(10_draft.js:75): 리그 평균이나 상위 300명이 목표보다 높으면 신인 잠재력을 -4~+8 범위에서 깎는다(아마 코호트 생성에도 쓴다. 13_amateur_league.js:66).
- `growLevelF`(10_draft.js:77): 겨울 성장 계수 0.6~1.15. 목표보다 1점 높을 때마다 15%씩 줄인다.
- `eliteN80`·`eliteGrowF`(10_draft.js:82-84): 국내 화면 80+ 선수가 ELITE_N0=7명을 넘으면 76+ 선수의 성장을 줄이고, 86+는 0.55배를 더 곱한다. 04_growth·31_dev_medical·76_dev_plan·79_camps에서 쓴다.
- 진단 도구: tools/analyze-rating-inflation.cjs, 참고 문서 docs/reviews/2026-11-10-rating-inflation-status.md

### 리그 주전 평균
- `lgStartAvg`(src/engine/market/26_trade_ai.js:7-10): 10개 구단 뎁스의 주전(야수 9자리, 선발 5, 불펜 상위 4)의 ovr 평균을 자리별로 낸다.
- 화면 상자 `startAvgBox`(src/ui/components/30_card_common.js:2-4)는 홈·스쿼드·프로필에 붙는다.
- 표시 전용이다. 엔진 판단에는 쓰지 않는다.

## 2. 해외 리그

### 리그 자체(35a_ovs_league.js:1-7, ovlInit)
- 경기도 로스터도 없다. 구단마다 전력 값 하나(무작위 걸음)만 두고, 승수는 이항 근사로, 가을야구는 시리즈 단위로 굴린다.
- 리그: MLB 30, AAA 30(MLB 산하), NPB 12, CPBL 6, LMB 20.

### 선수 형태(세 갈래)
1. 해외로 나간 국내 선수(G.abroad, `!foreign`)
   - 전체 선수 객체를 JSON(`a.pj`, `ovsPj`, src/engine/market/35_abroad.js:41)으로 보관한다.
   - 새해에 `develop(p)`를 `p.ovsEnv=a.lg`로 그대로 돌린다(35_abroad.js:166-167, src/engine/players/04_growth.js:49).
2. KBO를 떠난 외국인과 관찰하던 후보
   - `ovsSlim` 사본(35a:116: r, age, pos, nat 등)을 둔다.
   - 성장 규칙 없이 `ovsAgeFr` 나이 곡선만 탄다(35a:192).
3. 상주 외국인 후보군 G.ovp
   - 약 80명, 최대 100명(OVP, 35b_ovs_world.js:57). 측정 세계에서는 66명, 30KB(1명 약 0.45KB).
   - 경량 레코드(`ovpE`, 35b:66: r, pot, 나이, 성향, 2시즌 기록)다. 만들 때는 `newForeign`과 같은 식을 쓴다(ovpFresh, 35b:70).
   - 시장에 나올 때 `ovpP`(35b:74)가 전체 객체로 펼친다. 경량 레코드 → 지연 확장의 선례다.

이 밖에 MLB/NPB 스타, 일반 AAA 선수 같은 '세계 선수'는 존재하지 않는다.

### 기록 생성
- KBO와 같은 `simBat`/`simPit`(src/engine/league/02_records.js:12, 37)를 쓴다. 능력 단위의 리그 보정을 b 인자로 넣는다.
  - 빅리그: `OVS_ADJ` MLB [-19,-18], NPB [-10,-8](35a:110)
  - 그 밖: `LG_ADJ`(src/engine/contracts/12_foreign.js:14). 예: 트리플A [-1,-2], 더블A [7,13], CPBL [7,2], 멕시코리그 [8,-4], MLB [-12,-26](후보용)
  - 여기에 `FENV` 리그 환경 잡음을 더한다(12_foreign.js:24).
- 소속 수준은 `OVS_THR` MLB 62, NPB 57(국내 기준 능력, 35a:104)로 정한다. 못 미치면 트리플A나 NPB 2군으로 간다.
  - 큰 계약은 문턱을 2~3 낮춘다(ovsGt).
  - 경계선 선수는 한 시즌을 MLB와 AAA로 나눈다(ovsLine, 35a:119).
- 시즌 가치는 `OVS_NORM`(35a:113)으로 계산한다.

### KBO↔해외 이동 시 능력
- 변환이 없다. 같은 r을 그대로 쓰므로 내부 척도가 이미 '국내 기준 절대 척도' 노릇을 한다.
- 포스팅: 문턱 `POST_T.o=56`. 응찰 확률·보장액·연수는 ovr로 정한다(`postPm`, `postAmt0`, `postYrs`). 이적료는 `postFee`(35_abroad.js:101-120)다.
- 복귀(abroadYear, 35_abroad.js:148~)
  - 같은 객체를 국내로 되돌린다.
  - 보류권 또는 우선협상: `retAsk`
  - 직행 선수: 2년 뒤 드래프트(규약 107조)
- 시작 해외파(`OVS_SEED`·`ovsSeedKr`, 35b:17-23)는 국내 능력 범위로 만든다(MLB 스타 66~69, NPB 57~60).

### 리그 강도 계수
- 사실상 LG_ADJ/OVS_ADJ다. 다만 능력 그 자체가 아니라 '기록을 만들 때의 오프셋'이다.
- 두 표가 MLB 값에서 어긋난다: 후보용 [-12,-26], KBO 출신용 [-19,-18].
- 거꾸로(기록 → KBO 능력) 추정하는 회귀가 있다: `FREC`/`fRecEst`(12_foreign.js:83-84, tools/fit-frec.js로 맞춤).
- 해외 리그 화면(src/ui/league/16b_ovs_league.js)은 기록만 보여 주고 능력은 보여 주지 않는다.

## 3. 외국인 시장

### 후보 출처
- `fCandNew`(35b:84)는 확률 OVP.p=.6으로 G.ovp에서 먼저 꺼내고, 없으면 `newForeign`(12_foreign.js:24~)으로 새로 만든다.
- `newForeign`의 능력(전체 newPlayer, KBO 내부 척도)
  - 기준값: 미국 N(54,5), 중남미 N(52,5), 아시아 N(48.5,4)
  - 리그 보정: NPB 1군 +5, MLB +2, 더블A·독립리그 -2.5
  - 꼬리 압축: 59 초과분 ×.55, 아시아 54 초과분 ×.5
  - 숨은 실전 감각 `sx`: ±6
  - 지난 기록은 LG_ADJ+FENV로 만든다.
- 해외 영입 문의 `ovsInquire`(src/engine/market/35d_ovs_act.js:48)
  - 대상: G.abroad의 옛 외국인과 관찰 후보(`ovsRevive`), G.ovp 선수(`ovpP`). 같은 번호·같은 기록으로 시장에 불러낸다.
  - `withRng(rngHash('ovsInq',...))`를 쓰므로 본 난수와 G.nextId를 쓰지 않는다.
  - MLB에서 뛰는 선수는 제외한다(OVQ_LV). 시장 기간마다 문의 3회.
  - 계약은 기존 외국인 협상(정원, 총액 400만, 신규 100만, 아시아 20만 달러(01_rules.js:34), 보류권 fRes)을 그대로 거친다.

### 스카우트 발견·정확도
- 해외 지역 `IREG` us/la/jp/tw/au(01_rules.js:102)
- 해외망 단계 `INET` 0~3, sd 9.5/6.5/4.5/3(01_rules.js:103)
- `intlLv` = 구단 투자 G.intl[r] + 파견 스카우트(role 'intl', 30일 적응) +1(01_rules.js:108)
- 오차 계산
  - `fCandSd`/`fCandBias`/`fCandMix`(12_foreign.js:112-117): 툴 오차, 실전 감각을 못 보는 정도, '조사 전 흐림'
  - 여기에 기록 회귀 fRecEst를 역분산 가중으로 섞는다.
  - 관찰 명단 파악도 k(fwatchRate, 35_abroad.js:210), 직접 발굴(src='scout'면 base + flv×1.3), KBO 경력 후보 배율 F_KBO_K가 오차를 줄인다.
  - 조사 단계 FSTEP(12_foreign.js:77)
- AI는 `fScoutLv`를 망 단계로 쓰고 최대 2까지다(fInfo, 12_foreign.js:106).
- '프로 담당'(role 'pro')은 국내 권역(수도권·영남·호남·충청) 구단 선수의 잠재력과 다른 구단 선수 평가를 맡는다(src/engine/market/17_scouting.js:55-85, coverOf).
  - 해외 선수에는 쓰지 않는다. intl 스카우트는 국내 선수를 보지 않는다(17_scouting.js:14).
- 스카우트 팀장 자동 배치: src/engine/market/66_scout_chief.js:18-21

## 4. 아마추어·고교·대학
- 같은 내부 20~80 척도다.
  - 졸업 학년 잠재력 T = N(43,8) - lvAdj, 범위 26~77
  - 현재 능력 = T - (27-age)×2.2~3.4
  - 근거: 10_draft.js:91, src/engine/draft/13_amateur_league.js:54
- 저학년은 경량 레코드 G.amU(측정 322명, 79KB)에 둔다. 툴이 20 아래(2까지)로도 내려간다. 졸업 학년에 전체 선수로 펼친다(또 하나의 지연 확장 선례).
- 경기에는 '아마 척도' `AMC`(13_amateur_league.js:13: 고교 m 12, s 2.9 / 대학 m 20, s 2.2)를 쓴다. 능력을 그 무대 평균 기준으로 늘린 값이다. 리그 수준 변환의 선례다.

## 5. 단일 척도의 공백과 위험

### 공백
- 해외 리그에 선수층이 없다. MLB/NPB 스타와 일반 AAA 선수가 없다.
- 리그 강도 표가 둘이고 서로 어긋난다(LG_ADJ vs OVS_ADJ).
- 지역별 지식은 '외국인 후보'에만 있다. 해외 리그 선수를 찾아보는 구조가 없다.

### 척도 상한
- 모든 곳이 clamp 20~80이다. KBO 상위가 66 안팎이고 MLB 주전 문턱이 62이니, MLB 정상급(75~80+)은 80에 붙어 압축된다.
- 상한을 바꾸면 OVR·성장·표시(DV_PTS 78→100)·등급을 모두 건드린다.

### 난수
- newPlayer는 본 R을 쓴다(이름, 성격, 투구 폼, injRoll 등).
- 세계 생성은 반드시 35b `ovsWorldStart`처럼 해야 한다: `withRng(seed)`, 별도 번호(OVS_NID0=800001), G.nextId 복원.
- 판단과 추첨은 `rngHash`로 한다.
- check-logic.js에 난수 흐름 고정 시나리오가 다수 있다(`__rngState`, 예: #599·#603 해외, #480 등).
- fCandNew/ovpPick의 `R()<OVP.p` 슬롯도 지켜야 한다.

### 밸런스
- KBO 경기 확률식(02_records batProbs, 06_game LGP·TWB·TWP)과 보정 장치(draftLevelAdj, eliteN80의 dv 80 기준, fAsk 금액식)가 모두 지금 내부 값에 맞춰져 있다.
- 따라서 내부 척도를 다시 매기면 전부 재보정해야 한다. 내부 척도는 그대로 두고 리그 오프셋으로 풀어야 한다.
- FREC는 후보 생성식에 맞춘 회귀라, 생성이 바뀌면 다시 맞춰야 한다.

### 저장 크기
- 측정 세계 전체 3.0MB JSON. 그중 players가 2.3MB / 845명, 1명 약 2.7KB.
- 해외 4000명을 전체 객체로 두면 약 11MB로 불가능하다. 경량(0.45KB)이면 약 1.8MB, '주목 선수'만 500명이면 약 0.25MB.

### 성능·오염
- 매일 도는 많은 함수가 `Object.values(G.players)`를 돈다: grdCuts, slotsRosterKey, nameTaken, lgMeanDom, playersOf.
- 세계 선수를 G.players에 넣으면 등급 경계, 리그 수준 보정, 이름 중복, 속도가 모두 영향을 받는다. 별도 저장소(G.ovp처럼)에 두어야 한다.

### 저장 이전
- 선례는 ovsMigrate(G.ovl.v), amMigrate(G.amV), ovsTrackMigrate다.
- 새 세계 저장소에는 판 번호를 두고, 예전 저장은 다음 날짜 진행 때 시드 난수로 만든다(ovsDaily 방식, 불러오기만으로는 난수를 쓰지 않는다).

### 래더
- 단장 대전 풀(src/engine/ladder/01_ladder_pool.js)은 newPlayer 내부 척도 tier(N(61)/N(52.5)/N(46)/N(41))와 marketSal을 쓴다.
- uladder 덱도 커리어 r을 쓴다.
- 내부 척도나 OVR 식을 바꾸면 덱 가치와 공유 덱 비교가 깨진다. 표시 변환만 바꾸면 안전하다.

## 6. 설계 개요

### 척도
- 절대 척도: 지금 내부 20~80을 '세계 절대 척도'로 공식화한다(내부 값과 식은 바꾸지 않는다).
  - 현재 기준점: KBO 주전 평균 약 52, MLB 정착 문턱 62, NPB 57
  - 상한 80은 유지하고 MLB 최상위만 80 근처에 압축한다. 상한 확장은 나중 과제다.
- 한국 기준 표시: 20-80 옵션을 'KBO 기준'으로 바꾼다.
  - 식: disp = 50 + (x - K)
  - K는 시작 세계 KBO 주전 평균 + LV_UP를 저장한 고정 상수(G.lgBaseT 계열). 화면이 날마다 흔들리지 않게 고정한다.
  - 100점 척도는 그대로 둔다. 계산 경로는 손대지 않는다.

### 리그 수준 계수
- LG_ADJ와 OVS_ADJ를 한 표 `LEAGUE_LV`로 합친다: {타자 오프셋, 투수 오프셋, 주전 평균, 분포 폭, 환경 잡음}.
- 주전 평균 대략값: MLB 62~64, NPB 57, AAA 52, KBO 52, CPBL 46, LMB 47, 더블A 45.
- 같은 표로 세 가지를 한다: 세계 선수 생성, 기록 생성, 리그 이동 판단.

### 해외 선수 형태
- 경량 레코드 + 지연 확장. ovpE/ovpP와 G.amU 선례를 쓴다.
- 처음에는 구단마다 '주목 선수' 3~5명만 둔다(약 400~600명). 나머지 구단 전력은 지금처럼 값 하나다.
- 확장 시점: 스카우트가 깊게 보거나, 문의하거나, 계약할 때. withRng(rngHash(id))로 펼친다.

### 스카우트 지식(FM식)
- 지역(IREG) × 리그별 '지식 %'를 둔다. 해외망 투자, 파견 스카우트, 기간으로 오른다.
- 지식이 낮으면 선수가 안 보이거나 기록만 보인다.
- 오차는 fCandSd/fCandMix를 그대로 쓴다. AI도 같은 식이고 상한은 2다.

### 획득 규칙
- 지금 있는 것: 외국인 정원과 금액 한도, 아시아쿼터, 보류권 5년, 해외파 국내 보류권, 2년 유예(107조)
- 더할 것
  - MLB 40인/메이저 계약 선수는 불가, 마이너 계약은 바이아웃(이적료)
  - NPB·CPBL은 이적료와 구단 동의
  - 계약 만료 선수는 자유
  - 이적료는 예산에만 넣고 캡에서는 뺀다(검토 필요).

### 단계 계획
1. P1 척도·표 정리: LEAGUE_LV 통합(값 보존) + KBO 기준 20-80 표시 + 문서화.
   - 난수 불변. 밸런스 불변(표시만 바뀜).
2. P2 세계 선수 저장소: 리그별 주목 선수 경량 레코드, 별도 번호, withRng 생성, 저장 판 이전, 해외 리그 화면에 표시.
   - 본 난수 불변. KBO 밸런스 불변. 저장 +0.3MB 안팎.
3. P3 지역 스카우트 지식: 리그·지역 지식 %, 스카우트 배치(66_scout_chief 확장), 발견 소식.
   - 본 난수 불변(해시). 밸런스: 정보 비대칭만, 우리와 AI가 같은 식.
4. P4 영입 경로: 세계 레코드 → 외국인 시장(ovsInquire 확장), 이적료와 바이아웃, 지연 확장.
   - 난수: fCandNew 슬롯을 지켜야 한다. 밸런스 변경 있음: 외국인 수준 분포가 바뀐다 → check-balance, FREC 다시 맞춤.
5. P5 (선택) 국내 해외파·외국인 이동을 세계 로스터에 통합하고, 세계 선수 성장(ovsAgeFr에서 develop 경량판으로).
   - 밸런스 변경: 해외 문턱과 귀국 흐름. 래더는 손대지 않는다.
