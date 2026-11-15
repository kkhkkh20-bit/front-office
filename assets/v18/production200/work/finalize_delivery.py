"""Finish only after source, visual, pixel, and actual WebP identity validation."""
from pathlib import Path
import json, hashlib, subprocess, datetime
from build_delivery import quota_check, validate_pixels

P = Path(__file__).resolve().parent
OUT = P.parent
ROOT = P.parents[3]
manifest = json.loads((OUT / 'manifest.json').read_text())
validation = json.loads((OUT / 'validation.json').read_text())
assert validation['passed'] is True
assert manifest['identity_count'] == 200 and manifest['variant_count'] == 2000
quota_check(manifest['identities'])
validate_pixels(manifest)
for size in ['128', '256']:
    m = validation['metrics'][size]
    assert m['passed'] and m['within_pairs'] == 19900 and m['reference_pairs'] == 32000
    assert m['within_max'] < .4 and m['reference_max'] < .4
    assert m['same_identity_pairs'] == 9000 and m['same_identity_min'] >= .6
    assert m['mutual_cross_team_own_identity_top1'] and m['prescreen_own_identity_top1']

photos = json.loads((P / 'approved_wardrobe_photos.json').read_text())
assert len(photos) == 2000
assert all(x['visual_review_passed'] and x['cap_fit_passed'] and x['uniform_review_passed'] for x in photos)
for x in photos:
    assert hashlib.sha256((ROOT / x['path']).read_bytes()).hexdigest() == x['photograph_sha256']
    review = json.loads((ROOT / x['visual_review_path']).read_text())
    assert hashlib.sha256((ROOT / x['render_source']).read_bytes()).hexdigest() == review['render_sha256']

random20 = json.loads((OUT / 'previews/random20/index.json').read_text())
assert random20['seed'] == 18 and len(random20['identities']) == 20
preview_review = json.loads((OUT / 'validation/final_preview_review.json').read_text())
assert preview_review['passed'] and preview_review['all_people_overview_review_passed']
assert preview_review['reviewed_team_photos'] == 200
for item in preview_review['files'] + preview_review['all_people_overview_files']:
    assert hashlib.sha256((ROOT / item['path']).read_bytes()).hexdigest() == item['sha256']
assert all((OUT / x['path']).exists() for x in random20['identities'])
assert all((OUT / 'previews' / name).exists() for name in ['A_all100_256.png', 'B_all100_256.png', 'B_by_age_256.png'])
assert len(manifest['sheets']) == 40 and len(manifest['runtime_files']) == 20
assert max(x['bytes'] for x in manifest['sheets'] if x['cell_size'] == 256) <= 600000
assert all(x['encoding']['quality'] == 80 for x in manifest['sheets'] if x['cell_size'] == 128)
assert manifest['runtime_sheet_bytes'] == sum((ROOT / p).stat().st_size for p in manifest['runtime_files'])

source = json.loads((OUT / 'identity_prescreen/validation.json').read_text())
provenance = json.loads((OUT / 'identity_prescreen/provenance.json').read_text())
cap_fit = '모자를 이마와 관자놀이까지 깊게 눌러 쓰고 앞머리를 가렸으며, 모자 앞선은 눈썹 바로 위에 맞춤.'
rows = []
for size in ['128', '256']:
    m = validation['metrics'][size]
    rows.append(f"| {size} | {m['within_max']:.6f} | {m['reference_max']:.6f} | {m['same_identity_min']:.6f} | 통과 |")
table = '\n'.join(rows)
team_order = ', '.join(t['key'] for t in manifest['teams'])
sheet_bytes = sum(x['bytes'] for x in manifest['sheets'])
ages = ', '.join(f"{x['id']} {x['generation_age']}→{x['final_age']}세" for x in provenance['age_assignments'])
handoff = f'''# v18 production200 인수 안내

가상 남성 선수 200명과 10구단 홈 유니폼 사진 2,000장, RGB WebP 시트 40장을 제작하고 실제 압축 결과까지 검수했습니다.

- 브랜치: `assets/v18-review`
- 상태: `asset_validation_passed: true`, `production_complete: true`, `review_status: pending_game_review`
- 납품 기준 파일: [manifest.json](manifest.json), [validation.json](validation.json), [checksums.sha256](checksums.sha256)
- 모자 착용: {cap_fit}
- 게임 코드와 기존 v6·v12~v17 에셋은 변경하지 않았으며, main 병합은 하지 않았습니다.

## 게임에서 읽을 파일

`manifest.json`의 `runtime_files` 20개만 런타임에 사용합니다. 모두 128 시트이며 합계 **{manifest['runtime_sheet_bytes']:,} bytes**입니다. 256 시트는 검토용입니다. 전체 시트 40개의 합계는 **{sheet_bytes:,} bytes**입니다.

사진 경로는 저장소 루트 기준입니다. `path_base`를 경로에 다시 붙이지 않습니다. 시트 A·B는 각각 100칸이며, ID는 `v18_001`~`v18_200`입니다.

- 128: 1440×1440, pitch144, rect `[col*144+8, row*144+8, 128, 128]`
- 256: 2720×2720, pitch272, rect `[col*272+8, row*272+8, 256, 256]`
- 검은 8px 패딩은 사진 rect에 포함되지 않습니다. 모든 WebP는 RGB이며 알파가 없습니다.
- 게임 연결 시 FACE6 200번부터 이어 붙입니다. `v18_001`은200, `v18_200`은399에 대응합니다. 연결 코드는 별도 적용 대상입니다.

구단 순서: `{team_order}`.

홈 유니폼은 `assets/v6/batch01d/production60/manifest.json`의 `home_kit`, `design_spec`, `cap_color`를 따릅니다. 얼굴이나 공통 몸통을 붙이지 않고, 각 인물의 머리·목·어깨가 이어지는 완성 사진으로 제작했습니다.

## 인원과 외형

A는 외국인60명·아시아쿼터20명·국내20명이고 B는 국내100명입니다. 국내 연령대는 A `[4,8,5,2,1]`, B `[22,38,24,11,5]`명으로 각각18~20·21~24·25~28·29~33·34~38세에 대응합니다. `Japanese`, `Taiwanese`, `Filipino`, `Australian`은 아시아쿼터 분류용 표기를 유지했습니다.

국내 수염19/120명, 외국인 수염30/80명, 안경21/200명입니다. 국내18~22세는 모두 수염이 없습니다. 자연스러운 얼굴 비율과 표정을 유지하고, 모자는 사용자가 제시한 선수 명단 사진처럼 깊게 눌러 썼습니다.

가상 인물의 최종 나이는 사진 외형을 검수해 확정했습니다. 연령대 경계의5명은 생성 가이드 나이에서1살만 조정했습니다: {ages}. 원래 값은 `generation_age`와 [provenance.json](identity_prescreen/provenance.json)에 남겼으며 사진·임베딩은 나이 설정을 위해 변경하지 않았습니다.

## 실제 검수 결과

| 해상도 | 새200명 간 최고 | 기존160명 교차 최고 | 구단 간 동일인 최저 | 자기 인물1순위 |
| --- | ---: | ---: | ---: | --- |
{table}

각 해상도에서 새 인물19,900쌍과 기존160명과의32,000쌍을 모두 검사했습니다. 구단 간 동일인도 각 해상도9,000쌍 전체를 검사했으며, 모든 쌍0.60이상이고 자기 인물이1순위입니다. 마지막 검사는 납품 WebP에서 rect대로 꺼낸 실제128·256 픽셀을 각각 사용했습니다.

원래 v6c/v13과 같은 buffalo_l ArcFace 모델, detector640/threshold0.55, LMEDS 정렬과 원래 L2 정규화 코사인을 사용했습니다. 점수 보정·백색화·기준 완화는 하지 않았습니다. 정렬은 검사용112 입력에만 적용했으며 납품 사진의 얼굴 비율을 변형하지 않았습니다. 모델 해시, 원본160명 출처, 기존 임베딩 재현 결과는 `identity_prescreen/`에 있습니다.

- `validation/prescreen_128.csv.gz`, `prescreen_256.csv.gz`: 전체 선검수 원점수
- `validation/same_identity_128.json`, `same_identity_256.json`: 구단 간 전체 동일인 점수
- `validation/cross_team_top1_*.json`, `source_top1_*.json`: 전체1순위 판정
- `validation/delivered_embeddings.npz`: 실제 WebP에서 측정한 임베딩
- `validation/detection_records.json`: 실제 사진 검출·정렬 기록

## 미리보기와 해시

- [A 전원](previews/A_all100_256.png), [B 전원](previews/B_all100_256.png), [B 나이순](previews/B_by_age_256.png)
- `previews/random20/`: seed18로 고른20명 각각의10구단256 확대판. 추출 목록은 `index.json`에 있습니다.
- 미리보기는 실제 납품256 WebP에서 추출했습니다.
- 저장소 루트에서 `sha256sum -c assets/v18/production200/checksums.sha256`로 파일을 확인합니다.

`work/`에는 제작·검수 기록이 있습니다. 최종 게임 사진은 `sheets/`와 manifest rect를 사용합니다. `work/wardrobe`의 초기 모자 착용 시안은 폐기된 중간 자료이며 납품에 사용하지 않았습니다.
'''
(OUT / 'CLAUDE_HANDOFF.md').write_text(handoff)
manifest.update(production_complete=True, asset_validation_passed=True, review_status='pending_game_review', cap_fit=cap_fit)
(OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
status = {'production_complete': True, 'asset_validation_passed': True, 'review_status': 'pending_game_review', 'identity_count': 200, 'accepted_identity_count': 200, 'completed_variant_count': 2000, 'completed_sheet_count': 40, 'runtime_file_count': 20, 'runtime_sheet_bytes': manifest['runtime_sheet_bytes'], 'cap_fit': cap_fit, 'validation': validation, 'completed_utc': datetime.datetime.now(datetime.timezone.utc).isoformat()}
(OUT / 'production_status.json').write_text(json.dumps(status, ensure_ascii=False, indent=2))
state = json.loads((P / 'SESSION_STATE.json').read_text())
state.update(completion=True, accepted_identity_count=200, completed_variant_count=2000, completed_sheet_count=40, active_generation_cells={}, pending_solvers={}, next_step='Asset production complete. Game integration is a separate Claude task; do not merge main automatically.')
(P / 'SESSION_STATE.json').write_text(json.dumps(state, ensure_ascii=False, indent=2))
tracked = subprocess.check_output(['git', 'ls-files', '--', str(OUT.relative_to(ROOT))], cwd=ROOT, text=True).splitlines()
entries = []
for name in sorted(set(tracked)):
    path = ROOT / name
    if path.is_file() and path != OUT / 'checksums.sha256':
        entries.append(f"{hashlib.sha256(path.read_bytes()).hexdigest()}  {name}")
(OUT / 'checksums.sha256').write_text('\n'.join(entries) + '\n')
subprocess.run(['sha256sum', '--check', '--status', str(OUT.relative_to(ROOT) / 'checksums.sha256')], cwd=ROOT, check=True)
print(f'Completed200 identities,2000 deeply fitted uniform photos,40 WebP sheets; {len(entries)} file hashes verified.')
