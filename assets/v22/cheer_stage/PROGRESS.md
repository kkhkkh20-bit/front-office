# v22 최종 배치 검수 중

48명 배치의512/256/128 시트와 전체 비교판을 중간 저장했습니다. 최종 압축 후 얼굴 유사도 또는 눈높이 기준을 넘긴 사진이 있어 교체·검수 중입니다. 완료본이 아니며 manifest.json과 validation.json의 production_complete=false를 확인하세요.

현재 시트는 미리보기용이며 게임 연결은 아직 하지 않습니다. 최초 실제 시트 검수 탈락은 validation/atlas_preflight001_failed.json, 두 번째는 validation/atlas_preflight002_failed.json에 기록했습니다. 최종 codec은 용량만 보고 정한q80 method6으로 고정했고 ArcFace0.40·구도 기준은 유지합니다.

checkpoints/casting_004/는41명 개별 후보의 이전 중간 저장입니다. 최종 검수 완료 후 CLAUDE_HANDOFF.md와 이 문서를 다시 확정합니다. main 병합과 게임 코드는 변경하지 않았습니다.
