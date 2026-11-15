"""Finalize the secretary delivery only after actual runtime validation and review."""
from pathlib import Path
import json,hashlib,subprocess,datetime
from PIL import Image
P=Path(__file__).resolve().parent;OUT=P.parent;ROOT=P.parents[3]
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def dump(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2))
def main():
 m=json.loads((OUT/'manifest.json').read_text());v=json.loads((OUT/'validation.json').read_text());selection=json.loads((P/'selection.json').read_text());review=json.loads((P/'final_preview_review.json').read_text())
 assert v['passed'] and v['actual_decoded_runtime_pixels'] and selection['count']==20 and selection['female_count']==16 and selection['male_count']==4 and selection['glasses_count']==3
 assert review['passed'] and review['portrait_count']==20 and sha(OUT/'previews/all20_256.png')==review['preview_sha256']
 assert m['identity_count']==20 and len(m['identities'])==20 and len(m['runtime_files'])==2
 assert all(24<=x['age']<=28 for x in m['identities'] if x['f']) and sum(x['tags']['glasses'] for x in m['identities'])==3
 for size in ['128','256']:
  a=v['metrics'][size];assert a['passed'] and a['within_pairs']==190 and a['unique_reference_identity_count']==406 and a['reference_photo_count']==1406 and a['within_max']<.4 and a['reference_max']<.4
  assert v['cached_protocol_reproduction'][size]['cached_reference_reproduction_min_cosine']>.9999
  info=m['sheets'][size];im=Image.open(OUT/info['path']);assert im.mode=='RGB' and im.size==((int(size)+16)*10,)*2 and sha(OUT/info['path'])==info['sha256']
 assert m['runtime_sheet_bytes']==sum((OUT/f).stat().st_size for f in m['runtime_files'])
 measurements=[];sizes=[]
 for size in ['128','256']:
  a=v['metrics'][size];measurements.append(f"| {size} | {a['within_max']:.6f} | {a['reference_max']:.6f} | {a['within_pairs']} | {a['cross_photo_pairs']:,} |")
  info=m['sheets'][size];sizes.append(f"| {size} | {info['width']}×{info['height']} | {info['pitch']} | {info['bytes']:,} |")
 handoff=f'''# v19 비서 사진 인수 안내

가상 비서20명(여16·남4)의 실사풍 사진입니다. 여성은 사용자 요청에 맞춰24~28세, 남성은26~30세로 구성했습니다. 안경은3명(15%)입니다. 자연스러운 미소, 피부 질감과 잔머리, 부드러운 창가광과 흐린 사무실·구장 배경을 유지했습니다.

- 브랜치: `assets/v19-review`
- 상태: `asset_validation_passed: true`, `production_complete: true`, `review_status: pending_game_review`
- [20명 미리보기](previews/all20_256.png), [manifest](manifest.json), [validation](validation.json), [checksums](checksums.sha256)
- 선택한20명은 모두 개별 생성한 완성 인물 사진입니다. 원본은 `sources/v19_sec_01.png`~`v19_sec_20.png`에 있습니다.

## 연결 규격

`path_base`는 `assets/v19/secretary20/`입니다. 이미지 경로는 이 위치를 기준으로 합니다. `identities[].sheets["128"|"256"]`의 `path`, `rect`를 사용합니다.

ID는 `v19_sec_01`~`v19_sec_20`, 역할은 `r: "sec"`, 여성은 `f: 1`, 남성은 `f: 0`입니다. `age`, `tags.glasses`, `sheet`, `index`, 크기별 `rect`를 제공합니다. `index`는0~19이며10×10 중 앞20칸만 사용합니다.

| 크기 | 시트 | pitch | bytes |
| --- | --- | ---: | ---: |
{chr(10).join(sizes)}

좌표는 `[index%10*pitch+8, floor(index/10)*pitch+8, size, size]`입니다.8px 검은 여백은 사진 rect에서 제외합니다. 남은80칸과 여백은 검정이며, 두 WebP 모두 무손실 RGB·알파 없음입니다. 총 런타임 용량은 **{m['runtime_sheet_bytes']:,} bytes**입니다.

Claude 연결 시 비서 풀을 v19 20명으로 갱신하고, v8 비서8명은 사용자 선택 후보로 유지합니다. 한 구단에서 비서 얼굴이 겹치지 않게 배정하며 소식함 사진 변경 기능을 유지합니다. 게임 연결은 별도 단계이며 이 브랜치는 에셋 납품용입니다.

## 검수 결과

사진 자체는 완성 사진의 정사각 크롭과 비율을 유지한 축소만 적용했습니다. 얼굴 비율 변형, 얼굴·몸통 합성은 하지 않았습니다. 실존 인물 사진이나 구단 로고를 원본으로 사용하지 않았습니다.

최종 WebP에서 실제128·256 픽셀을 각각 다시 추출해 검사했습니다. buffalo_l ArcFace의 원시 L2 정규화 코사인에0.40 미만 기준을 적용했으며 점수 보정·백색화·기준 완화를 하지 않았습니다. 정렬은 얼굴 인식 입력112px에만 사용합니다.

| 크기 | 새20명 내부 최고 | 기존 사진 대비 최고 | 내부 쌍 | 기존 사진 비교 쌍 |
| --- | ---: | ---: | ---: | ---: |
{chr(10).join(measurements)}

기존 비교 범위는 v8 120명·v7 126명·v6c 100명·v13 60명으로, 고유406명입니다. 구단별 사진을 포함해1,406개 사진과 비교했고, 인물별 최댓값으로 묶은8,120쌍도 제공합니다. 기존 참조 캐시 재현 검사는128·256 모두 최소 코사인0.9999998로 일치했습니다.

- 최종 임베딩과 검출 기록: `validation/delivered_embeddings.npz`, `validation/delivered_embeddings.json`
- 모든 원점수: `validation/all_pairs_128.csv.gz`, `all_pairs_256.csv.gz`
- 기존406명 기준 최대 점수: `validation/cross406_128.csv.gz`, `cross406_256.csv.gz`
- 참조 출처·모델·정렬 방식: `validation/reference_provenance.json`, `protocol_reproduction_summary.json`
- 육안 검수: `work/visual_review.json`, `work/final_preview_review.json`

저장소 루트에서 `sha256sum -c assets/v19/secretary20/checksums.sha256`로 납품 파일을 확인합니다. `src/`, `index.html`, 빌드·검사 설정은 변경하지 않았습니다.
'''
 (OUT/'CLAUDE_HANDOFF.md').write_text(handoff)
 m.update(production_complete=True,asset_validation_passed=True,review_status='pending_game_review');dump(OUT/'manifest.json',m)
 status={'production_complete':True,'asset_validation_passed':True,'review_status':'pending_game_review','identity_count':20,'female_count':16,'male_count':4,'glasses_count':3,'sheet_count':2,'runtime_sheet_bytes':m['runtime_sheet_bytes'],'completed_utc':datetime.datetime.now(datetime.timezone.utc).isoformat()};dump(OUT/'production_status.json',status)
 dump(P/'SESSION_STATE.json',{'completed':True,'status':status,'selection_count':20,'source_candidate_count':selection['source_candidates'],'next_task':'Commit and push assets/v19-review after the v18b delivery. No game code changes or main merge.'})
 tracked=subprocess.check_output(['git','ls-files','--',str(OUT.relative_to(ROOT))],cwd=ROOT,text=True).splitlines();entries=[]
 for name in sorted(set(tracked)):
  f=ROOT/name
  if f.is_file() and f!=OUT/'checksums.sha256':entries.append(f'{sha(f)}  {name}')
 (OUT/'checksums.sha256').write_text(chr(10).join(entries)+chr(10));subprocess.run(['sha256sum','--check','--status',str(OUT.relative_to(ROOT)/'checksums.sha256')],cwd=ROOT,check=True);print('v19 complete:20 portraits, two verified sheets,',len(entries),'file hashes checked.')
if __name__=='__main__':main()
