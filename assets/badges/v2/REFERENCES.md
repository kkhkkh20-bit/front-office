# 조사 출처와 이번 수정 범위

실제 KBO 10구단·MLB 12구단 공개 SVG를 이전 시안 조사 때 렌더링하여 확인했다. 이번 수정은 그 조사에서 얻은 글자 위계·조판·심벌 역할 분담 원칙을 사용하되, 사용자 지시에 따라 **이미 제작한 모자 마크 자체를 고정**한다. 기존 심벌을 실존 구단처럼 다시 그리는 작업이 아니다.

## 확인 자료

- [react-kbo-logos](https://github.com/Gwanghun-Im/react-kbo-logos), npm 1.2.1: 두산, 한화, KIA, 키움, KT, LG, 롯데, NC, 삼성, SSG.
- [react-mlb-logos](https://github.com/ChrisKatsaras/react-mlb-logos), npm 1.1.2: Orioles, Cubs, White Sox, Dodgers, Brewers, Mets, Yankees, Phillies, Pirates, Mariners, Cardinals, Blue Jays.

공개 패키지의 로고 판본이며 2026년 최신 공식 CI 인증 자료라고 표기하지 않는다. 코드는 실행하지 않고 SVG 도형만 정적으로 읽었다. 실제 구단 아트와 조사용 비교판은 납품에 넣지 않았다.

출처 tar SHA-256:

- KBO: `ee7e3ef1bb65153c70d160aa4c8c5a3ba81cb6007e7d775bfdad59903c6901d5`
- MLB: `51c305f706877aabe16ebd5e70ebe00e3812d811930363bb35be3cf0ae00e0a7`

## 관찰과 적용

- LG·KIA 등의 큰 레터링, 두산·한화·삼성의 워드마크 중심 인상: 닉네임을 크게, 도시명은 작게 두고 실제 글꼴의 간격과 배치를 조정했다.
- NC·롯데·Cubs·Mariners의 원형 문장: 기존 심벌을 받치는 원형 문장을 일부 구단에만 사용한다. 실제 배치나 글자 경로는 옮기지 않는다.
- SSG·KT 등 강한 기울기와 방향감: 일부 개방형 로고에 경사 조판과 짧은 보조 방향선을 사용한다.
- MLB 이니셜과 단순 심벌의 작은 크기 식별성: 32px에서는 기존 모자 마크만 남기고 여백을 조정한다. 실존 이니셜 도형을 가져오지 않는다.

구단 심벌은 v3 원본에서 이어져 실제 v5 모자에 쓰인 도형이다. [cap_provenance.json](cap_provenance.json)과 [검수](validation.json)에 출처와 일치를 기록했다. 실제 구단의 경로·이니셜·캐릭터를 새로 가져오지 않았으며 조사 SVG의 긴 path 문자열이 납품에 그대로 포함되지 않았는지도 검사했다. 이는 상표 데이터베이스 전수 대조를 의미하지 않는다.

## 조판

[Alfa Slab One](https://github.com/google/fonts/tree/main/ofl/alfaslabone) Regular 한 글꼴로 HarfBuzz 커닝 조판 후 FontTools로 외곽선 변환. 자간·폭·기울기·얕은 아치 배치는 구단별로 조정한다. [OFL](licenses/AlfaSlabOne-OFL.txt)과 [typography.json](typography.json)을 제공한다. 실제 구단 레터링과 같은 수준의 맞춤 활자 설계를 했다고 주장하지 않는다.

이미지 생성은 내부 구성 탐색에만 사용했으며 생성 이미지나 생성 글자는 최종 로고 파일에 포함하지 않았다. 심벌은 기존 도형, 글자는 실제 글꼴 외곽선이다. 최종 시안의 디자인 승인은 사용자 검토를 따른다.
