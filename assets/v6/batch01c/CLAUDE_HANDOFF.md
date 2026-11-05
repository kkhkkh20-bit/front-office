# Claude 인계 · v6c B안 시범

release_ready=false / accepted_identity_count=0. 얼굴 중복 기준 미통과이므로 자동 배포하지 않습니다. game 코드는 변경하지 않았습니다.

이 시범은 RGB 완성 사진입니다. manifest.identities[].variants[team].sheets[128|256]의 path와 rect(x,y,w,h)를 읽어 그대로 표시합니다.5열×4행이고 각 셀 둘레8px 여백이 있습니다(128 pitch144 /256 pitch272). manifest의 rect만 사용하고 고정 크기 나눗셈이나 v6b의10열 가정은 적용하지 않습니다. 얼굴 사진에 의상 UV·키 색 제거·모자 마스크·아래쪽 늘리기·심벌 재부착을 추가 적용하면 안 됩니다.

512 보관본·낱장·생성 원본은 archive ZIP에만 있고 런타임 allowlist는 manifest.runtime_files의 이미지6장+manifest1개입니다. 구단별 의상이 사진에 이미 들어 있으므로 identity_id뿐 아니라 team/kit/version까지 캐시 키에 포함해야 합니다.

B안은 같은 사람의 옷을 생성 도구로 바꾸는 방식입니다. 이번 최소 동일인 코사인은0.848919이지만 중복 기준0.40은 별도로 실패했습니다. 심벌 형태가 묶음별로 달라지는 한계도 README와 validation에 명시했습니다. 1,000장 확대 전에 원본 심벌 도형·얼굴 다양성을 해결해야 합니다.

시트 용량·실제 입력 모델 SHA·초과 쌍·256px 카드 검수·배경 여백 정규화는 README/validation/production_plan/framing_validation을 참조합니다. 기존 v6b100명이나 v7직원 에셋은 바꾸지 않았습니다.
