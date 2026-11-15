"""Finalize only after actual compressed pixels and required previews pass review."""
from pathlib import Path
import json,hashlib,subprocess,datetime
P=Path(__file__).resolve().parent;OUT=P.parents[1];ROOT=P.parents[4]
def sha(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def dump(path,value):path.write_text(json.dumps(value,ensure_ascii=False,indent=2))
def main():
 m=json.loads((OUT/'manifest.json').read_text());v=json.loads((OUT/'validation.json').read_text());options=json.loads((P/'pack_options.json').read_text());photos=json.loads((P/'approved_photos.json').read_text());review=json.loads((P/'final_preview_review.json').read_text())
 assert v['passed'] and v['revision']=='v18b' and v['actual_decoded_webp_portrait_count']==6000
 assert options.get('distinctness_gallery','canonical')==v.get('distinctness_policy','canonical'),'Validation must match the requested comparison gallery'
 assert photos['complete'] and photos['selected_photo_count']==2000 and all(x['visual_review_passed'] for x in photos['photos'])
 assert review['passed'] and review['native384_preview_count']==10 and review['before_after_identity_count']==4
 for x in review['files']:assert sha(ROOT/x['path'])==x['sha256']
 assert len(m['sheets'])==60 and len([s for s in m['sheets'] if s['cell_size']==384])==20 and len(m['runtime_files'])==40
 assert m['runtime_sheet_bytes']==sum((ROOT/f).stat().st_size for f in m['runtime_files'])
 sample=json.loads((OUT/'previews/v18b/random10/index.json').read_text());assert sample['seed']==1802 and len(sample['identities'])==10
 for x in sample['identities']:assert (OUT/x['path']).exists() and sha(OUT/x['path'])==x['sha256']
 for rid in ['v18_165','v18_169','v18_170','v18_174']:assert (OUT/f'previews/v18b/{rid}_before_after_10clubs.png').exists()
 assert all((OUT/'previews'/f).exists() for f in ['A_all100_256.png','B_all100_256.png','B_by_age_256.png'])
 metrics=[]
 for s in ['128','256','384']:
  a=v['metrics'][s];b=v['background_revision_validation'][s];assert a['passed'] and b['passed']
  assert a['same_identity_pairs']==9000 and a['same_identity_min']>=.6 and a['original_same_identity_min']>=.6 and a['mutual_cross_team_own_identity_top1']
  metrics.append(f"| {s} | {a['same_identity_min']:.6f} | {a['original_same_identity_min']:.6f} | {b['other199_max']:.6f} | {b['legacy160_max']:.6f} |")
 size_rows=[]
 for s in [128,256,384]:
  group=[x for x in m['sheets'] if x['cell_size']==s];size_rows.append(f"| {s} | {len(group)} | {sum(x['bytes'] for x in group):,} | {max(x['bytes'] for x in group):,} |")
 people=[]
 for x in m['identities']:
  if x['id'] in ['v18_165','v18_169','v18_170','v18_174']:people.append(f"| {x['id']} | {x['age']} | B / {x['index']} | {200+int(x['id'].split('_')[1])-1} |")
 native=v['native_provenance']['minimum_native_photo_side'];note128='A12810장은 원본 바이트를 유지하고, B12810장은 대상4명의 회색 배경만 반영하여 기존 q80 설정으로 내보냈습니다. 다른 인물의128 원본 사진과 규격은 유지했습니다.' if options['update128_targets'] else '12820장은 요청에 따라 원본 바이트를 유지했습니다. 이 경우 배경 수정은256·384에 적용됩니다.'
 gallery='0.40 중복 기준은 이전v18과 같은 최초 인물 선검수 원본 갤러리에 적용했습니다. v18의 원본200명에서 자기 인물을 제외한199명, 기존v6c100명·v1360명의 원본160명을 사용했습니다.' if options.get('distinctness_gallery','canonical')=='canonical' else '중복 기준은 validation.json에 명시한 기존10구단 사진 갤러리를 사용했습니다.'
 handoff=f'''# v18b 인수 안내

가상 선수200명·10구단 사진2,000장의 ID·나이·순서를 유지하며, 흰 배경4명을 회색 배경으로 보완하고 선수 상세용384 시트20장을 추가했습니다. 전체 납품은128·256·384 RGB WebP60장입니다.

- 브랜치: `assets/v18-review`
- 상태: `asset_validation_passed: true`, `production_complete: true`, `review_status: pending_game_review`
- 기준 파일: [manifest.json](manifest.json), [validation.json](validation.json), [checksums.sha256](checksums.sha256)
- 기존 v18 기준 커밋: `849709747d556129311dbffd677de35ad9662db4`
- 게임 코드와 기존v6·v12~v17 에셋은 수정하지 않았으며 main 병합은 하지 않았습니다.

## 바뀐 인물

| ID | 나이 | 시트 / index | FACE6 |
| --- | ---: | --- | ---: |
{chr(10).join(people)}

위4명에만 `revision: v18b`를 표시했습니다. 얼굴·헤어·수염·안경과 깊게 눌러쓴 모자 착용을 유지했습니다. {note128}

## 시트와 rect

사진 경로는 저장소 루트 기준입니다. `path_base`를 다시 붙이지 않습니다.

- 128:1440×1440, pitch144, `[col*144+8,row*144+8,128,128]`
- 256:2720×2720, pitch272, `[col*272+8,row*272+8,256,256]`
- 384:4000×4000, pitch400, `[col*400+8,row*400+8,384,384]`

모두10×10이며8px 검은 여백을 rect에 포함하지 않습니다. 모든 WebP는 RGB·알파 없음입니다.384 경로는 `sheets/{{A|B}}/384/{{team_key}}.webp`입니다.

384는 q88~90으로 내보냈습니다.256은 원본 사진에서 q88로 다시 출력했습니다.128은 기존 품질 설정을 유지했습니다.

| 크기 | 장수 | 합계 bytes | 최대 bytes |
| --- | ---: | ---: | ---: |
{chr(10).join(size_rows)}

`runtime_files`는12820장과38420장, 총40개이며 합계 **{m['runtime_sheet_bytes']:,} bytes**입니다.256은 호환·검토용으로 유지합니다.384는 상세 화면에서 필요한 구단·시트만 지연 로딩합니다.

## 고해상도 제작

기존 생성 원본은 한 인물당 약280px이었습니다. 이 원본들을 참조해 더 큰 고해상도 복원 사진을 추가 생성했습니다. 사진칸 경계를 정리한 뒤에도 최소 **{native}px**인 원본을384로 축소했습니다.

완성 사진 전체를 크롭·축소했습니다. 얼굴 비율 변형이나 얼굴·공통 몸통 합성은 하지 않았습니다. 원본 해상도·크롭 좌표·픽셀 해시는 [native provenance](validation/v18b_native_provenance.json)에 있습니다.

검수용 원본은 `sources/v18b_native/`에 무손실 RGB WebP로 보관했습니다. [원본 목록과 해시](validation/v18b_native_source_archive.json), 모든2,000장 크롭의 원본 픽셀 일치 검증을 제공합니다. 게임은 `runtime_files`에 지정한40개 시트를 사용합니다.

## 실제 압축 결과 검수

| 크기 | 새10구단 동일인 최저 | 기존10구단 동일인 최저 | 수정4명 대199명 최고 | 수정4명 대기존160명 최고 |
| --- | ---: | ---: | ---: | ---: |
{chr(10).join(metrics)}

각 크기에서 새 구단 간 동일인9,000쌍과 기존10구단과의 동일인20,000쌍을 모두 검사했습니다. 자기 인물1순위도 통과했습니다. 마지막 검사는 최종 WebP의 실제128·256·384 픽셀을 각각 사용했습니다.

{gallery}384의 기존 참조 특징 벡터는256 원본에서 측정한 값입니다. 동일인 유지는 기존 납품10구단 사진 모두와0.60이상인지 별도로 확인했습니다. 모델은 기존 buffalo_l ArcFace와 동일하며 점수 보정·백색화·기준 완화를 하지 않았습니다.

- 현재 임베딩: `validation/v18b_delivered_embeddings.npz`
- 실제 검출·픽셀 해시: `validation/v18b_detection_records.json`
- 전체 원점수: `validation/v18b_same_identity_*.csv.gz`, `v18b_old_retention_*.csv.gz`, `v18b_background_distinctness_*.csv.gz`
- 전체1순위 판정: `validation/v18b_cross_team_top1_*.csv.gz`, `v18b_source_top1_*.csv.gz`
- `identity_prescreen/`와 기존 이름의 검수 파일은 원래v18의 제작·검수 기록입니다. 최신 결과는 `v18b_` 접두사와 루트 `validation.json`을 사용합니다.

## 미리보기와 연결

- 4명의10구단 전후 비교: `previews/v18b/v18_165_before_after_10clubs.png`와169·170·174 파일
- [무작위10명384 원본 크기](previews/v18b/random10_384.png), [추출 목록](previews/v18b/random10/index.json)
- `previews/v18b/random10/`의 개별 PNG10개는 실제384 셀을 크기 변경 없이 추출했습니다.
- 기존A·B 전원256과 무작위20명10구단 미리보기도 최신256 시트에서 다시 만들었습니다.

게임의4명 제외 해제와384 선택 적용은 Claude가 별도로 합니다. 기존128·256 URL을 재사용할 때는 v18b 버전 또는 해시로 이미지 캐시를 갱신합니다.

저장소 루트에서 `sha256sum -c assets/v18/production200/checksums.sha256`로 파일을 확인합니다.
'''
 (OUT/'CLAUDE_HANDOFF.md').write_text(handoff)
 m.update(production_complete=True,asset_validation_passed=True,review_status='pending_game_review');dump(OUT/'manifest.json',m)
 status={'production_complete':True,'asset_validation_passed':True,'review_status':'pending_game_review','revision':'v18b','identity_count':200,'accepted_identity_count':200,'completed_variant_count':2000,'completed_sheet_count':60,'new384_sheet_count':20,'revised_identities':['v18_165','v18_169','v18_170','v18_174'],'runtime_file_count':40,'runtime_sheet_bytes':m['runtime_sheet_bytes'],'completed_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'validation':'validation.json'};dump(OUT/'production_status.json',status)
 dump(P/'SESSION_STATE.json',{'completed':True,'revision':'v18b','next_task':'Resume v19 secretary portraits after committing and pushing this validated v18b delivery.','status':status})
 dump(P/'ACTIVE_STATE.json',{'completed':True,'revision':'v18b','pending_generation_cells':{},'next_task':'v19 secretary20','status':status})
 original_state=OUT/'work/SESSION_STATE.json'
 if original_state.exists():
  baseline_state=P/'baseline/original_work_SESSION_STATE.json'
  if not baseline_state.exists():baseline_state.write_text(original_state.read_text())
  dump(original_state,{'task':'v18b player background corrections and native384 delivery completed','branch':'assets/v18-review','revision':'v18b','production_complete':True,'asset_validation_passed':True,'review_status':'pending_game_review','accepted_identity_count':200,'completed_variant_count':2000,'completed_sheet_count':60,'runtime_file_count':40,'source_roster_frozen':True,'natural_proportions_mandatory':True,'active_generation_cells':{},'pending_sessions':{},'final_flags_still_false':False,'latest_handoff':'../CLAUDE_HANDOFF.md','latest_validation':'../validation.json','native_proof':'../validation/v18b_native_provenance.json','next_step':'Game integration is a separate Claude task. No automatic main merge.'})
 tracked=subprocess.check_output(['git','ls-files','--',str(OUT.relative_to(ROOT))],cwd=ROOT,text=True).splitlines();entries=[]
 for name in sorted(set(tracked)):
  path=ROOT/name
  if path.is_file() and path!=OUT/'checksums.sha256':entries.append(f'{sha(path)}  {name}')
 (OUT/'checksums.sha256').write_text(chr(10).join(entries)+chr(10));subprocess.run(['sha256sum','--check','--status',str(OUT.relative_to(ROOT)/'checksums.sha256')],cwd=ROOT,check=True)
 print('v18b complete:200 identities,2000 photos,60 sheets,20 new384 sheets;',len(entries),'file hashes verified.')
if __name__=='__main__':main()
