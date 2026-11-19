# v23 확장 구단 홈 유니폼 — 최종 인계

작성: 2026-11-19. 납품 브랜치: `assets/v23-review`. 경로: `assets/v23/expansion_kits/`.

기존420명 × 확장2구단 = **840종**, 128/256 RGB WebP 시트 **20장**입니다. 새 인물은 없습니다. `schema_version="v23-expansion-kits-1"`, `asset_validation_passed=true`, `production_complete=true`, `review_status="pending_game_review"`입니다. 게임 연결은 아직 하지 않았으며 Claude 담당입니다. **main에는 병합하지 않았습니다.**

요청서: `docs/asset-requests/2026-11-19-codex-v23-expansion-kits.md`, 소스 브랜치 `claude/kind-albattani-6wb1vz`, 소스 커밋 `8466bbe2fa8ea0089da4eba4573deb8d9405226f`. 변경은 이번 v23 에셋 디렉터리에만 있습니다. 게임 코드·기존 에셋 수정/삭제가 없습니다.

## 구단과 배지

| team_key | primary/cap | secondary | 유니폼·단순 자수 모티프 | 최종320px 배지 |
|---|---|---|---|---|
| expansion_a | #0B5D3B | #C9A227 | 흰 몸판·녹색 래글런·골드 파이핑·별, 코치 녹색 상의 | badges/expansion_a.png |
| expansion_b | #4B2A7B | #A7A9AC | 흰 몸판·퍼플 어깨·실버 핀스트라이프·방패 윤곽, 코치 퍼플 상의 | badges/expansion_b.png |

구단 이름·도시는 게임마다 달라 모든 사진·배지에 글자가 없습니다. 선수의 모자/가슴에는 자수용 단순 별/방패, 단독 구단 배지에는 같은 중심 모티프를 확장한 야구 문장을 씁니다. 모자 별은 골드, 방패는 실버로 대비를 확보했습니다.

사용자의 로고 품질 피드백에 따라 **GitHub 기존 로고 v2를 직접 열어 비교**하고 단순 첫 시안을 교체했습니다. A는 별·다이아몬드·겹 테두리·봉제선, B는 방패·야구공·다이아몬드·봉제선입니다. 기존10구단의 마크·글자 도형을 복제하지 않았습니다. 배지는320×320 RGBA PNG, 바깥 배경은 투명입니다. `previews/badges_dark_light_actual_sizes.png`에 밝은/어두운 바탕과32/64px 확인본, `validation/badge_design_reference.md`에 참고 경로가 있습니다. 최종 디자인/게임 검토는 대기 상태입니다.

## 기존 인물 연결

| set | 원본 manifest | 인원 | 기존 게임 묶음 |
|---|---|---:|---|
| v6c | assets/v6/batch01c/production100/manifest.json | 100 | FACE6 |
| v13 | assets/v6/batch01d/production60/manifest.json | 60 | FACE12.f6 |
| v18 | assets/v18/production200/manifest.json | 200 | FACE18 |
| staff | assets/v7/staff01/manifest.json의 manager_coach만 | 60 | FACE7.coach |

`identities[]`는 원본 인물 순서와 id를 유지합니다. v6c=`v6c100_001`…, v13=`v6d60_001`…, v18=`v18_001`…, staff=`v7_staff01_coach_001`…입니다. `set`은4종, `sheet`는 `v6c/v13/v18A/v18B/staff`5종입니다. `index`는 시트 안0~99이며, v18의101번째 인물은 `sheet=v18B,index=0`입니다. 원래 인물 번호를 새로 뽑지 말고 기존 id/배열 순서로 대응해 주세요.

11번째 구단은 `expansion_a`,12번째 구단은 `expansion_b`를 고정해서 원년 구단 유니폼 대여 경로 대신 사용합니다. 구단 대표색 연결과 게임 코드는 Claude 작업입니다.

```js
const item = manifest.identities.find(x => x.id === originalIdentityId);
const cell = item.variants[teamKey].sheets[String(size)];
const url = 'assets/v23/expansion_kits/' + cell.path;
// cell.rect: 패딩을 제외한 사진 영역. 별도 얼굴 확대/이동 없이 기존 FACECTR 적용.
```

## 시트·rect·용량

모든 시트는10열×10행. `pitch=n+16`, 좌우/상하 패딩8px. `rect=[(index%10)*pitch+8,Math.floor(index/10)*pitch+8,n,n]`.128은1440²,256은2720²입니다. 사진은 RGB이며 알파가 없습니다. v13/staff는 앞60칸을 쓰고 뒤40칸은 검정입니다.

경로: `sheets/{v6c|v13|v18A|v18B|staff}/{128|256}/{expansion_a|expansion_b}.webp`. 모든20장 합계 **5,606,042 bytes**.256 최대 **520,114 bytes**, 전부600KB 이하입니다. 실제 인코딩 품질과 SHA-256은 manifest/validation에 있습니다.

| sheet | 사용 칸 | 128 A bytes | 128 B bytes | 256 A bytes | 256 B bytes |
|---|---:|---:|---:|---:|---:|
| v6c | 100 | 176,880 | 180,428 | 446,248 | 451,158 |
| v13 | 60 | 104,876 | 108,502 | 260,004 | 266,886 |
| v18A | 100 | 200,300 | 206,810 | 515,110 | 517,792 |
| v18B | 100 | 201,138 | 200,964 | 520,114 | 503,932 |
| staff | 60 | 108,320 | 97,488 | 283,036 | 256,056 |

## 동일 인물·구도 검수

최종 압축 WebP에서 manifest의 실제 칸을 잘라 **420명 ×2구단 ×2크기 =1,680건**을 검사했습니다. 비교 갤러리는 기존420명 전체입니다.128/256 모두 원본 자기 인물이1순위이며, raw ArcFace cosine **최저 0.625631273**, 얼굴 중심 오차(256 환산) **최대 3.158599854px**입니다. 기준은 cosine≥0.60, 자기 인물1순위, 중심 각 축±4px로 그대로 유지했습니다. 점수 보정·epsilon·기준 완화가 없습니다.

모델: InsightFace buffalo_l `w600k_r50.onnx`(ArcFace), `det_10g.onnx`(SCRFD).5점 norm_crop112는 임베딩 분석에만 사용하며 런타임 얼굴을 워핑하지 않습니다. 얼굴 중심은5점 평균과검출 상자 중심을 모두 확인했습니다. 모델 SHA-256, 원본/최종 임베딩, 검출 좌표와 픽셀 SHA는 `validation/`에 있습니다.

**원본 해상도 차이:** 소스 Git에는 v13 manifest에 적힌256 시트가 실제로 없고128만 있습니다. v13은 실제 원본128을 기준으로 인물·구도를 대조했고, 최종 출력128/256을 각각 검사했습니다. 이를 원본 native256이라고 표시하지 않았습니다. 입력 가이드의 확대와 실제 새 렌더의 출력 크기를 구분했습니다. 나머지 묶음은 각각 원본 native128/256을 사용했습니다.

수정 이력은 숨기지 않았습니다. b02의 한 선수 상의 오류는 같은 인물의 흰 홈 유니폼으로 다시 렌더했습니다. `v18_055/expansion_b`는 사진 전체만256 기준 아래2px 이동해 두 중심 기준을 맞췄습니다(가장자리 픽셀 연장, 얼굴 변형 없음). `v7_staff01_coach_026/expansion_b`의 첫128 점수0.539는 탈락으로 보존하고 같은 원본 코치만 재렌더했습니다. 두 크기 모두 같은 최종256 마스터에서 파생하고 최종 시트로 재검사했습니다. 실패 이력은 `validation/initial_full_validation_failed.json` 등, 현재 판정은 루트 `validation.json`이 기준입니다.

## 검토·감사 자료

- `previews/{v6c|v13|v18|staff}_{expansion_a|expansion_b}_all256.jpg`: 묶음별 전원256 미리보기. v18 A/B 분할본도 포함합니다.
- `previews/random10_original_vs_expansions.jpg`: 시드230011로 전체420명에서 균등 무작위로 고른10명. 원본/A/B 비교이며 표본을 점수로 골라 바꾸지 않았습니다.
- `previews/qc/`: 최종 디코딩 칸에 인물 id를 붙인25명 단위 검토판.
- `validation/visual_review.json`: 전체 native 렌더 시각 확인과 최종 비교판 검토 범위, 사진/로고의 확인 항목.
- `validation/audit_delivery.py`: 읽기 전용 독립 감사. Pillow/numpy가 있으면 `python assets/v23/expansion_kits/validation/audit_delivery.py`로 실행합니다. 최종 디코딩 픽셀과 저장된 임베딩의 연결,420명 전체1순위·raw 점수·구도·원본 보존·20시트·320RGBA·체크섬을 다시 확인합니다.
- `checksums.sha256`: 자기 자신을 제외한 납품 파일 전체의 SHA-256.
- `checkpoints/`: 제작 재개/출처 확인용 native 렌더와 대응표입니다. **게임 런타임에는 넣지 않습니다.** 런타임 사진은 manifest `runtime_files`20장, 선택 배지는 `badges`2장만 연결하세요. 예전 체크포인트 판정으로 현재 검수를 대체하지 마세요.

기존 에셋의 실제 native RGB 셀 해시도 작업 시작 기록과 대조했습니다. 숫자 통과는 사용자 디자인 승인이나 게임 연결 검수 완료를 뜻하지 않습니다. 다음 단계는 Claude의 게임 연결 및 화면 검토입니다.
