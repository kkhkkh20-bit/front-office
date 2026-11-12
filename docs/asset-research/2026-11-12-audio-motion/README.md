# 중계 오디오·동작 에셋 후보 조사 (2026-11-12)

조사만 했다. 파일을 내려받거나 게임에 넣지 않았다. 기존 사용 에셋은 [3D 경기장과 선수](../../../assets/match3d/README.md), [11월 3일 검토](../2026-11-03/README.md)를 참고한다. Claudeball 모델·118개 클립은 다시 제안하지 않았다.

표기:
- **VERIFIED**: 이번 조사에서 해당 페이지를 직접 열어 라이선스 문구를 확인했다.
- **필터 확인**: Freesound 검색에서 `license:"Creative Commons 0"` 필터를 걸었을 때 나온 결과다. 개별 페이지는 열지 않았다.
- **UNVERIFIED**: 2차 자료나 검색 요약으로만 확인했다.

Freesound 라이선스는 파일마다 다르다. 같은 업로더나 같은 팩이라도 다를 수 있으므로 넣기 전에 파일 페이지를 다시 확인한다.

## 요약 (용도별 추천)

| 필요 | 1순위 | 라이선스 | 비고 |
| --- | --- | --- | --- |
| 나무 배트 타격음 | Freesound martinimeniscus "Bat Hit 9 FF095" [162886](https://freesound.org/people/martinimeniscus/sounds/162886/) 외 같은 업로더의 Bat Hit 시리즈(검색 결과 18개) | CC0 (162886 VERIFIED) | 근접 녹음 약 0.97초. 세기별로 쓰려면 시리즈 중 몇 개를 골라 레이어·EQ로 조정 |
| | 보조: CGEffex "Hitting baseball w. wooden bat" [93136](https://freesound.org/people/CGEffex/sounds/93136/) | CC BY 4.0 (VERIFIED) | 나무 배트 여러 타격, 23.2초. 표기 필요 |
| 포수 미트 | martinimeniscus "Glove Catch 1 FF014" [164499](https://freesound.org/people/martinimeniscus/sounds/164499/), "Glove Catch 12 FF003" [164536](https://freesound.org/people/martinimeniscus/sounds/164536/) | CC0 (VERIFIED) | 0.8~1.3초. 같은 시리즈 12개 |
| 관중 기본음 (바람처럼 들리지 않는 웅성임) | craigsmith "S14-02 Baseball walla from high in stands" [675194](https://freesound.org/people/craigsmith/sounds/675194/), "S15-02 Big League baseball game walla" [675325](https://freesound.org/people/craigsmith/sounds/675325/) | CC0 (VERIFIED) | 실제 대화음이 들리는 야구장 웅성임. 모노, 옛 필름 효과음이라 잡음 가능 |
| | Fenway Ambience 1 [424295](https://freesound.org/people/Douglas711/sounds/424295/) | CC0 (VERIFIED) | 25초, 실제 MLB 구장 |
| 함성·홈런 | bmadore Target Field 홈런 녹음 [691975](https://freesound.org/people/bmadore/sounds/691975/) | CC0 (VERIFIED) | 61초 바이노럴. 웅성임→타격음→함성→잔향까지 포함. **구장 음악이 섞여 있을 수 있다고 업로더가 직접 경고** |
| 큰 플라이 "우와… 아~" | GameSoundCon 2024 Walla "Excitement Build Up, Let Down" [763884](https://freesound.org/people/ShangusBurger/sounds/763884/) | CC0 (VERIFIED) | 6.6초. 기대→실망 흐름이 담장 앞 잡힌 타구에 맞음. 실내 녹음이라 야외 잔향 처리 필요 |
| 탄식 | 같은 팩 "Crowd Sigh In Disappointment" [763880](https://freesound.org/people/ShangusBurger/sounds/763880/), craigsmith "Unhappy baseball crowd" [675066](https://freesound.org/people/craigsmith/sounds/675066/) | CC0 (VERIFIED) | |
| 오르간 | vckhaze "Baseball cavalry sting" short [380695](https://freesound.org/people/vckhaze/sounds/380695/), long [380696](https://freesound.org/people/vckhaze/sounds/380696/) | CC0 (VERIFIED) | 3.0초/4.6초, 96 kHz. 이른바 "Charge" 계열 선율 |
| 심판 콜 | jcookvoice "American Baseball The Umpire" [625473](https://freesound.org/people/jcookvoice/sounds/625473/) | CC0 (VERIFIED) | 영어 "Safe", "You're out", "Strike 3 you're out". 24.7초. **strike/ball 단독 콜과 한국어 콜은 찾지 못함** |
| 한국어 캐스터·심판 TTS | MeloTTS Korean ([GitHub](https://github.com/myshell-ai/MeloTTS), [모델](https://huggingface.co/myshell-ai/MeloTTS-Korean)) | MIT (VERIFIED) | 상업 이용 명시. 미리 생성한 짧은 음성 파일을 포함하는 방식 권장 |
| 한국식 응원가·북 | **바로 쓸 수 있는 공개 음원 없음** | — | 아래 "라이선스 주의점" 참고. 자체 제작 권장 |
| 동작: 번트·스윙·투구 mocap | CMU Graphics Lab Subject #124 (124_01·02 투구, 124_07 스윙, 124_08 번트, 124_13 언더핸드) | CMU FAQ: 복사·수정·재배포 허가 불필요 (VERIFIED) | BVH 변환본 있음. 리타깃·정리 작업 큼 |
| 동작: 빠진 클립 추가 | Claudeball 원본 Blender 스크립트(`assets/src/player_anim.py`, `player_clips.py`, MIT)를 확장해 직접 키프레임 | MIT | 같은 골격·같은 화풍 유지. 가장 위험이 적음 |
| 동작: 일반 이동·감정 | Quaternius Universal Animation Library 1·2 | CC0 (VERIFIED) | 야구 동작은 없음. 리타깃 필요 |

현재 `player.glb`에 없는 동작: 번트, 체크 스윙, 루킹(타격하지 않는 테이크) 전용 반응, 다이빙 캐치, 펜스 점프 캐치, 포수 프레이밍, 홈런 세리머니 변형(배트 플립, 하이파이브 줄, 끝내기 세리머니). 투구 4종·슬라이드 5종·주루·심판 제스처·덕아웃(bench_sit/cheer)·trot·celebrate는 이미 있다.

## 오디오 후보

| 이름 / ID | URL | 라이선스 | 내용 | 품질·주의 | 확인 |
| --- | --- | --- | --- | --- | --- |
| Bat Hit 9 FF095 (martinimeniscus, Florentine Films SFX 팩) | https://freesound.org/people/martinimeniscus/sounds/162886/ | CC0 1.0 | 배트 타격 근접·실외, 0.967초, AIFF 48 kHz | 업로더 검색 "bat hit" 결과 18개. 재질(나무) 표기는 없음. 귀로 확인 필요 | VERIFIED (162886만), 나머지 17개는 미확인 |
| Hitting baseball w. wooden bat (CGEffex) | https://freesound.org/people/CGEffex/sounds/93136/ | CC BY 4.0 | 나무 배트 여러 번 타격, 23.2초, WAV 48 kHz 스테레오 | 구간을 잘라 약·중·강 타구로 사용 가능 | VERIFIED |
| BaseballHitAndCrowdCheer (AmishRob) | https://freesound.org/people/AmishRob/sounds/214989/ | CC BY 4.0 | 나무 배트 타격 + 함성, 7.8초, MP3 128 kbps | 93136과 AshFox "WALLA Ballpark Cheer William Tell Overture Organ"의 리믹스. 원본 표기도 필요하고 오르간(윌리엄 텔 서곡) 포함. 우선순위 낮음 | VERIFIED |
| Glove Catch 1 FF014 / Glove Catch 12 FF003 (martinimeniscus) | https://freesound.org/people/martinimeniscus/sounds/164499/ , https://freesound.org/people/martinimeniscus/sounds/164536/ | CC0 1.0 | 글러브 포구 0.83초 / 1.3초, AIFF 48 kHz | 같은 업로더 "glove" 검색 12개. 미트 팝의 저음을 보강하면 포수용으로 사용 가능 | VERIFIED |
| Baseball Glove Sounds (MPooman) | https://freesound.org/people/MPooman/sounds/649084/ | CC0 1.0 | 글러브 소리 여러 개, 36.2초, MP3 128 kbps | 한국 업로더. MP3 품질 | VERIFIED |
| Catching a baseball glove (Luisa_Sanchez) | https://freesound.org/s/816984/ , https://freesound.org/s/813394/ | CC0 | 피에조 마이크 포구음 | 길이·품질 미확인 | 필터 확인 |
| S14-02 Baseball walla from high in stands (craigsmith) | https://freesound.org/people/craigsmith/sounds/675194/ | CC0 1.0 | 45.4초, WAV 모노 | 1930~60년대 할리우드 필름 효과음을 USC Cinema 이전본에서 디지털화했다고 설명. 잡음 가능. 원 권리 출처가 옛 스튜디오 효과음이라는 점은 업로더의 CC0 선언에 의존 | VERIFIED |
| S15-02 Big League baseball game walla; 4 takes (craigsmith) | https://freesound.org/people/craigsmith/sounds/675325/ | CC0 1.0 | 1분 31.8초, WAV 24-bit 48 kHz 모노 | 위와 같은 출처. 루프 소재로 가장 적합 | VERIFIED |
| S30-19 Unhappy baseball crowd (craigsmith) | https://freesound.org/people/craigsmith/sounds/675066/ | CC0 1.0 | 13.5초, 모노 | 야유·불만 | VERIFIED |
| S12-01 Crowd reactions; oohs; ahh; cheering (craigsmith) | https://freesound.org/people/craigsmith/sounds/675056/ | CC0 1.0 | 1분 55초, 모노 | "ooh/ahh" 소재. 실외 | VERIFIED |
| S30-06 Baseball crowd yells at umpire (craigsmith) | https://freesound.org/s/675060/ | CC0 | 심판 향한 관중 고함 | | 필터 확인 |
| Fenway Ambience 1 (Douglas711) | https://freesound.org/people/Douglas711/sounds/424295/ | CC0 1.0 | 25.4초, M4A 44.1 kHz | 실제 구장 대화·박수. 루프 길이가 짧음 | VERIFIED |
| MLB Crowd Cheer – Busch Stadium (tylermyers1992) | https://freesound.org/people/tylermyers1992/sounds/649156/ | CC0 1.0 | 26초, WAV 44.1 kHz | 점점 커지는 함성. 근처 대화 몇 초 포함 | VERIFIED |
| Crowd and field noise … homerun hit at MLB stadium (bmadore) | https://freesound.org/people/bmadore/sounds/691975/ | CC0 1.0 | 61.3초, 24-bit 48 kHz 바이노럴, 16.8 MB | 홈런 직전부터 함성까지 전부 담김. 업로더가 "저작권 있는 구장 음악이 들릴 수 있다"고 적음. 음악 구간은 잘라 쓸 것 | VERIFIED |
| korea_baseball.flac (nikitralala) | https://freesound.org/people/nikitralala/sounds/239936/ | CC0 1.0 | 광주 KIA vs 롯데, 3분 54초 바이노럴 FLAC | KBO 현장음으로 유일. **응원가(원곡이 대중가요인 경우)·앰프 음악이 섞였을 가능성이 높음**. 음악이 들리지 않는 구간만 쓰거나 참고용 | VERIFIED |
| little league baseball game (SteeLManure) | https://freesound.org/people/SteeLManure/sounds/430924/ | CC0 1.0 | 2분 34.6초, M4A | 소규모 관중·구호·심판·타격음. 규모가 작아 프로 중계엔 부적합 | VERIFIED |
| GameSoundCon 2024 Walla (ShangusBurger) | 예: https://freesound.org/people/ShangusBurger/sounds/763884/ (기대→실망), https://freesound.org/people/ShangusBurger/sounds/763880/ (탄식), https://freesound.org/s/763876/ (놀람 탄성) | CC0 1.0 | 같은 연기를 마이크 5종(XY, 바이노럴, FUMA 등)으로 녹음. 96 kHz 24-bit. 검색상 1,000개 이상 | 실내 컨벤션 녹음이라 방 울림이 있다. 큰 구장 느낌은 리버브·레이어로 만들어야 함. 반응 종류가 다양함 | VERIFIED (763884, 763880), 그 외 필터·검색 |
| Millerntor Stadium Crowd Reaction Excited 01 (itmightgetloud) | https://freesound.org/people/itmightgetloud/sounds/829453/ | CC0 1.0 | 축구장 약 2.9만 명, 1분 3초, 24-bit 48 kHz | 대형 함성 레이어용. 독일어 구호가 들릴 수 있음 | VERIFIED |
| Baseball cavalry sting short / long (vckhaze) | https://freesound.org/people/vckhaze/sounds/380695/ , https://freesound.org/people/vckhaze/sounds/380696/ | CC0 1.0 | 3.0초 / 4.6초, WAV 96 kHz | 오르간 "Charge" 스팅. 이 짧은 팡파르는 전통 응원 선율로 쓰이지만 작곡 저작권 상태는 따로 확인하지 않았다 | VERIFIED |
| American Baseball The Umpire (jcookvoice) | https://freesound.org/people/jcookvoice/sounds/625473/ | CC0 1.0 | 성우의 "Safe", "You're out", "Strike 3 you're out", 24.7초, WAV 44.1 kHz | 영어. strike·ball 단독 콜 없음 | VERIFIED |
| Sonniss GDC Game Audio Bundle | https://sonniss.com/gdc-bundle-license/ | Sonniss 자체 라이선스 | 연도별 대용량 효과음 묶음. 군중·스포츠 포함 여부는 확인하지 않음 | 상업 게임 사용·무표기 허용. 단 효과음을 "효과음으로서" 배포·재라이선스 금지, AI 학습 금지. 게임 안에 넣는 것은 허용되지만 공개 저장소에 원본 WAV를 그대로 두는 것은 피해야 함 | VERIFIED (라이선스 페이지) |

### 한국어 캐스터·심판 음성

| 엔진 | URL | 라이선스 / 생성물 조건 | 한국어 | 확인 |
| --- | --- | --- | --- | --- |
| MeloTTS (MyShell) | https://github.com/myshell-ai/MeloTTS , https://huggingface.co/myshell-ai/MeloTTS-Korean | MIT. README에 "free for both commercial and non-commercial use" | 있음 (KR 화자 1명으로 보임) | VERIFIED |
| Supertonic 3 (Supertone) | https://huggingface.co/Supertone/supertonic-3 | OpenRAIL-M. 사용 제한 조항(동의 없는 사칭 금지, 기계 생성 사실 미고지 금지 등)이 생성물에 따라감. 상업 이용 금지 조항은 없음 | 있음 (31개 언어, 고정 음성 스타일) | 라이선스명·한국어 VERIFIED. 사용 제한 세부 내용과 "회사 해산·저장소 보관" 소식은 제3자 미러 기준 UNVERIFIED |
| Google Cloud Text-to-Speech | https://cloud.google.com/text-to-speech/quotas | 생성한 오디오를 애플리케이션·미디어에 사용할 수 있다는 문구(검색 요약 기준). 경쟁 TTS 학습 금지 | 있음 | UNVERIFIED |
| 타입캐스트 | https://typecast.ai/kr/policy | 유료 플랜에서 상업 이용 가능. API·커스텀 음성은 별도 계약. 게임 내장 조건은 공개 문서에서 확인하지 못함 | 있음 | UNVERIFIED (검색 요약) |
| 브라우저 Web Speech API (`speechSynthesis`) | — | 파일을 포함하지 않으므로 재배포 문제는 없음. 기기·OS별 한국어 음성 유무와 품질이 다름 | 기기마다 다름 | 기술 선택지, 라이선스 조사 대상 아님 |

Coqui XTTS-v2는 비상업 라이선스(CPML)로 알려져 제외했다(이번 조사에서 원문 미확인). 실제 사람 목소리 녹음(동의서 포함)이 품질·권리 면에서 가장 확실하다. 심판 콜은 단어 수가 적어 녹음 비용이 작다("스트라이크", "볼", "아웃", "세이프", "파울", "볼넷" 등).

## 동작 후보

| 이름 | URL | 라이선스 | 내용 | 리타깃 작업 | 확인 |
| --- | --- | --- | --- | --- | --- |
| CMU Graphics Lab Motion Capture Database | http://mocap.cs.cmu.edu/ , FAQ http://mocap.cs.cmu.edu/faqs.php | FAQ 원문: "The motion capture data may be copied, modified, or redistributed without permission." 논문 발표 시 감사 문구 요청 | Subject #124 (Sports Related Motions): 01·02 Baseball Pitch, 07 Baseball Swing, 08 Baseball Bunt, 12 Underhand Toss, 13 Underhand Fast Pitch, 11 2 Foot Jump. #141·#143: Run, Start to Run, Run to Stop, Throw and Catch, Catch And Throw, High Five, Waiting, Sit on Stool. #33·#34: 미식축구공 던지기·받기. 120 Hz, ASF/AMC·C3D | 큼. 원본은 T포즈가 없고 정리되지 않음(관절 뒤집힘 있음). 손가락·손목 회전 정보 부족. 배트·공 접촉 타이밍을 다시 맞춰야 함 | VERIFIED (FAQ와 subject 124·141·143 목록을 직접 조회) |
| CMU BVH 변환본 (Bruce Hahne / cgspeed) | https://github.com/una-dinosauria/cmu-mocap (미러), https://github.com/sfd158/cmu-mocap | READMEFIRST: "CMU places no restrictions … I (Bruce) place no additional restrictions on the use of this particular BVH conversion." | 약 2,500개 BVH, 첫 프레임 T포즈 추가, MotionBuilder 관절명, 색인 파일 | Blender에서 BVH 불러오기 → Rokoko/Auto-Rig Pro 등으로 `mixamorig:*` 골격에 리타깃 → glTF 클립 내보내기. 120 fps를 30 fps로 줄이고 루트 이동 정리 필요 | VERIFIED (READMEFIRST.txt 원문) |
| Claudeball 원본 클립 스크립트 확장 | https://github.com/TaylorBeeston/claudeball (`assets/src/player_anim.py`, `player_clips.py`) | MIT (기존 확인) | 지금 쓰는 118개 클립을 만든 Blender 파이썬 스크립트 | 리타깃 없음. 같은 골격·같은 스타일로 번트·체크 스윙·다이빙·펜스 캐치를 추가 가능. 키프레임 제작 시간은 필요 | 기존 문서에서 확인 |
| Quaternius Universal Animation Library | https://quaternius.com/packs/universalanimationlibrary.html | CC0 ("Free to use in personal, educational and commercial projects") | 120개 이상: 8방향 이동, 조깅, 질주, 앉기, 기어가기, 감정 표현 등. FBX/GLB/Blend | 자체 범용 휴머노이드 골격. 본 이름 대응표 필요. 야구 동작 없음. 관중·덕아웃 대기·감정 표현용 | VERIFIED |
| Quaternius Universal Animation Library 2 | https://quaternius.com/packs/universalanimationlibrary2.html | CC0 | 130개 이상: 근접 전투, 파쿠르, 농사·낚시 등 | 위와 같음. 야구 관련성 낮음 | VERIFIED |
| 100STYLE (Ian Mason) | https://www.ianxmason.com/100style/ | CC BY 4.0. 표기 예: "The 100STYLE Dataset - Ian Mason" | 약 100가지 스타일 × 걷기·달리기·옆걸음·대기. Xsens, 60 fps, 28본 BVH, 400만 프레임 이상 | BVH 리타깃. Proud, Elated, Crouched, StartStop 등이 주자·감독 이동 변형에 쓸 만함 | VERIFIED |
| Rokoko 무료 스포츠 애니메이션 12개 | https://rokoko.com/resources/rokoko-mocap-12-free-sports-animations | 페이지: 상업 프로젝트 사용 가능. 원본 파일 재배포 조항은 확인하지 못함. 가입 후 다운로드 | FBX, Mixamo 골격, 30 fps. 종목 목록 미공개 | Mixamo 골격이라 리타깃은 쉬움. 단일 HTML에 클립을 넣는 것이 "재배포"에 해당하는지 서면 확인 전에는 보류 | UNVERIFIED (재배포 조건) |
| FreeMoCap | https://github.com/freemocap/freemocap | 소프트웨어 AGPL-3.0. 촬영 데이터 소유 조항은 README에 없음 | 일반 카메라로 직접 동작 촬영 | 직접 촬영한 야구 동작을 만드는 경로. 결과물 정리·리타깃 작업 큼 | 라이선스명 VERIFIED |

### 제외한 동작 자료

| 자료 | 제외 이유 | 확인 |
| --- | --- | --- |
| Mixamo | 프로젝트 사용은 무료지만 원본 캐릭터·애니메이션 파일 배포 금지(Adobe 커뮤니티 FAQ). 단일 HTML에 클립을 포함하면 추출이 쉬워 위험. 공식 helpx 페이지는 이번 환경에서 403 | 커뮤니티 FAQ 기준 UNVERIFIED |
| OpenBiomechanics (Driveline) | 실제 투구 411건·타격 677건 C3D가 있지만 데이터는 CC BY-NC-SA 4.0 + 프로 스포츠 관계자 사용 금지 | VERIFIED |
| Bandai Namco Research Motiondataset | CC BY-NC 4.0 | VERIFIED |
| SFU Motion Capture Database | "cannot be used for commercial products or resale" | VERIFIED |
| AMASS·HumanML3D 기반 텍스트→동작 생성 모델 | 학습 데이터가 비상업 조건. 생성물 권리 불명확 | UNVERIFIED (이번 조사에서 원문 미확인) |
| Xsens 무료 스포츠 팩 | 페이지에 라이선스 문구 없음 | VERIFIED (문구 없음 확인) |

GitHub에서 `baseball` 저장소를 검색했지만 Claudeball 외에 허용적 라이선스와 쓸 만한 3D 야구 동작을 함께 제공하는 공개 게임은 찾지 못했다.

## 라이선스 주의점

1. **Freesound는 파일별 라이선스**다. 같은 사용자 계정에 CC0·CC BY·CC BY-NC가 섞여 있다(예: bmadore 계정 필터에 Attribution NonCommercial 1건). 넣는 파일마다 페이지 URL과 라이선스를 기록한다. CC BY 4.0 파일은 게임 크레딧에 작성자·제목·URL·라이선스를 표기한다.
2. **현장 녹음 속 음악**: 691975(구장 음악 포함 가능성을 업로더가 명시), 239936(KBO 응원가 가능성), 398258(MSG 오르간)은 녹음 자체가 CC0여도 그 안의 음악 저작권까지 풀리지는 않는다. 음악이 들리는 구간은 쓰지 않는다.
3. **KBO 응원가**: 대중가요를 개사·편곡한 응원가는 2016~2018년 저작인격권 소송과 등장곡 중단 사태가 있었다. 구단 응원가·선수 응원가는 구단과 원작자 권리가 얽혀 있어 게임에 쓰면 안 된다. 구단명·응원 구호도 상표·퍼블리시티 문제가 있다. 자체 작곡한 북·나팔 리듬과 일반 구호("안타!", "홈런!")만 녹음하거나 합성하는 것이 안전하다.
4. **옛 필름 효과음**: craigsmith의 SSE Vintage 팩은 1930~60년대 할리우드 효과음을 디지털화했다고 설명한다. Freesound 표기는 CC0지만 원 권리 관계는 업로더의 선언에 의존한다. 대체할 수 있는 현대 녹음(424295, 649156, GSC24)이 있으면 그쪽을 우선한다.
5. **Sonniss**: 게임에 넣는 것은 허용되지만 효과음을 효과음 자체로 배포하는 것은 금지다. 저장소·사이트 빌드에서 원본 WAV를 내려받을 수 있는 경로로 두지 않는다.
6. **TTS**: OpenRAIL-M(Supertonic)은 "기계 생성임을 숨기지 말 것" 같은 사용 조건이 생성물에 따라간다. 크레딧이나 설정 화면에 "AI 합성 음성" 고지를 넣는다. 상용 클라우드 TTS는 약관이 바뀔 수 있으므로 생성 당시 약관 사본을 보관한다.
7. **CMU mocap**: 재배포 허용이 FAQ에 명시되어 있다. 다만 "변환본도 재판매 불가"라는 문구가 일부 2차 자료에 인용되어 있었고, 현재 CMU FAQ 원문에서는 확인되지 않았다. 동작을 게임에 포함하는 데에는 지장이 없다.

## 다음 단계 제안

1. **포구·타격음 교체 시험**: 162886 계열 Bat Hit 시리즈와 164499·164536을 받아 귀로 비교한다. 지금의 합성음과 A/B 비교하고, 짧은 원샷 몇 개만 Opus/OGG로 줄여 단일 HTML 크기 증가를 수백 KB 이내로 유지한다.
2. **관중 기본음 재도입**: 675325·675194·424295를 섞어 20~30초 루프를 만들고, 대화음이 들리는 중역(약 300 Hz~3 kHz)을 살린다. 이전에 "바람 같다"는 지적은 저역·광대역 노이즈 위주의 합성음 탓으로 보이므로 실제 웅성임 녹음으로 바꾸는 것이 핵심이다. 음량은 낮게 둔다.
3. **반응 사운드 연결**: 큰 플라이 → 763884, 아웃 → 763880/675066, 홈런 → 691975의 함성 구간 + 829453 레이어, 득점 → 649156, 이닝 교대 → 380695.
4. **심판 콜**: 한국어 콜은 직접 녹음(동의서 포함)을 1순위로 하고, 임시로 MeloTTS Korean으로 "스트라이크/볼/아웃/세이프/파울"을 미리 생성해 `umpCall`에 연결한다. 영어 모드는 625473을 잘라 쓴다.
5. **캐스터**: 실시간 생성 대신 정해진 문장(타순 소개, "홈런입니다" 등)을 MeloTTS로 미리 만들어 넣는다. 자유 문장은 Web Speech API를 선택 기능으로 두고, 지원하지 않는 기기에서는 끈다.
6. **동작 보강**: 번트·체크 스윙·다이빙 캐치·펜스 캐치·포수 프레이밍은 Claudeball 스크립트를 확장해 같은 골격으로 만든다. 투구·스윙 사실감이 더 필요하면 CMU 124_01·07·08을 Blender에서 `mixamorig:*`로 리타깃해 기준 자세 참고나 블렌딩용으로 쓴다.
7. **기록**: 실제로 넣는 파일마다 `assets/` 아래 CREDITS에 URL·작성자·라이선스·수정 내용을 남긴다.

## 이번 조사에서 접근하지 못한 곳

OpenGameArt(403), Adobe helpx Mixamo FAQ(403), web.archive.org는 이 환경에서 열리지 않았다. Kenney·itch.io는 11월 3일 조사에서도 차단되어 이번에는 다시 시도하지 않았다.
