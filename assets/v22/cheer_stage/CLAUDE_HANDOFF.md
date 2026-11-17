# v22 중간 인계 — 아직 게임 연결 금지

브랜치 assets/v22-cheer-review, 경로 assets/v22/cheer_stage/. 현재는48명 최종 납품이 아닌 캐스팅 중간 저장입니다. checkpoints/casting_001/manifest.json 의 production_complete=false, runtime_ready=0 을 확인하세요. 최종판 전에는 이 중간 사진 번호를 게임 저장 데이터에 연결하지 마세요.

완료 시 예정 규격:512 시트8열×6행,256/128 시트10열×10행. 같은 index라도 해상도별 열 수가 다릅니다.512 rect=[(index%8)*512,floor(index/8)*512,512,512],256/128 rect=[(index%10)*n,floor(index/10)*n,n,n]. 여백·패딩0.48칸 이후는 검정.

uc 계열 순서: red,navy,blue,black,orange,green,purple,sky. 현재 계획은 계열마다 index=colorIndex*6+slot. slot0–4 단원 cheer22, slot5 팀장 ccap22. 최종 manifest가 확정되면 그 값을 우선하세요. 대표색과 가까운 uc6명을 우선 배정하고 부족한 단원은 비슷한 색 계열에서 보충합니다. m.ph15는 새 m.ph22로 재배정해야 하며 기존 번호를 그대로 해석하지 않습니다. 팀장도 ccap22로 별도 재배정합니다. 카드에는512 시트를 사용합니다.

main 병합과 게임 코드는 Codex 작업 범위가 아닙니다. 현재 초안은 실측·이미지 비교용이며 최종 시트의 WebP 재압축 후에는 반드시 최종 rect에서 다시 검사합니다.
