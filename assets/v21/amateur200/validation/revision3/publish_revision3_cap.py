import os
os.environ['OPENBLAS_NUM_THREADS']='1'
from pathlib import Path
import json,hashlib,shutil,numpy as np
from PIL import Image,ImageDraw
W=Path('/dev/shm/v21b-work');R=W/'repo/assets/v21/amateur200';V=R/'validation/revision3';V.mkdir(exist_ok=True);H=R/'validation/history/stage_a_before_revision3';H.mkdir(exist_ok=True);PRE=R/'previews';S=[128,256,384]
def digest(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def dump(p,x):Path(p).parent.mkdir(parents=True,exist_ok=True);Path(p).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def arrs(p):
 z=np.load(p);return {k:z[k] for k in z.files}
assert json.load(open(W/'A61final_validation.json'))[0]['passes']
manifest=json.load(open(R/'manifest.json'));old_validation=json.load(open(R/'validation.json'));people=manifest['identities'];lock=json.load(open(R/'validation/stage_a/identity_age_lock.json'));assert [{k:p[k] for k in ['id','sheet','index','age','level']} for p in people]==lock['identities'];wanted=['A062','A047','A038','A083','A061','A069','A093']
# Archive all generation originals byte for byte. Native generation files stay in place.
parents={}
for path in (R/'native').rglob('*.png'):parents[digest(path)]=path
original_paths=set()
for name in ['r2_initial','r2_b_repairs','a7_singles','a2_hair','bg2','cohort_r3','B_r3_new','B_next','A061_cap']:
 path=W/(name+'_normalization.json')
 if path.exists():
  for c in json.load(open(path)):
   p=Path(c['native_path'])
   if p.is_file() and str(p).startswith('/workspace/generated_images/'):original_paths.add(str(p))
for name in ['cohort_r3_a7_q001_registry.json','B_cohort_r3_next_registry.json','B_glasses_generation_registry.json','B_r3_new_generation_registry.json','A061_cap_generation_registry.json']:
 path=W/name
 if path.exists():
  for c in json.load(open(path)):
   if c.get('native_path'):original_paths.add(c['native_path'])
native_receipts=[];original_map={}
for name in sorted(original_paths):
 p=Path(name);sha=digest(p)
 if sha not in parents:
  target=R/'native/revision3'/p.name;target.parent.mkdir(exist_ok=True);shutil.copyfile(p,target);assert digest(target)==sha;parents[sha]=target
 original_map[name]=str(parents[sha].relative_to(R));native_receipts.append({'original_local_path':name,'archived_path':original_map[name],'sha256':sha,'bytes':p.stat().st_size,'dimensions':list(Image.open(p).size),'original_preserved':True})
dump(V/'native_trials.json',native_receipts)
def archive_native(c):
 p=Path(c['native_path'])
 if str(p) in original_map:return original_map[str(p)]
 if p.is_relative_to(R):return str(p.relative_to(R))
 sha=digest(p)
 if sha not in parents:
  target=R/'native/revision3'/p.name;target.parent.mkdir(exist_ok=True);shutil.copyfile(p,target);parents[sha]=target
 return str(parents[sha].relative_to(R))
# Preserve baseline evidence before replacing A's 36 runtime sheets.
for p in (R/'validation/stage_a').iterdir():
 if p.is_file() and not (H/p.name).exists():shutil.copyfile(p,H/p.name)
for name in ['manifest.json','validation.json','CLAUDE_HANDOFF.md']:
 if not (H/name).exists():shutil.copyfile(R/name,H/name)
for size,variant in [(128,'hs_home'),(384,'hs_home'),(384,'suwon_sparks')]:
 dst=H/'retained_canvas_reference'/f'{variant}_{size}.webp';dst.parent.mkdir(exist_ok=True)
 if not dst.exists():shutil.copyfile(R/f'sheets/A/{size}/{variant}.webp',dst)
old_sheets={}
for p in people:
 for v in manifest['variant_keys']:
  if (128,v) not in old_sheets:old_sheets[(128,v)]=Image.open(R/f'sheets/A/128/{v}.webp').convert('RGB')
inputs=json.load(open(W/'A61final_sheet_inputs.json'));encoding=[]
for c in inputs:
 dst=R/f'sheets/A/{c["size"]}/{c["variant"]}.webp';shutil.copyfile(c['path'],dst);assert digest(dst)==c['sha256'];im=Image.open(dst);assert im.size==((c['size']+16)*10,)*2 and im.mode=='RGB';encoding.append({'path':str(dst.relative_to(R)),'size':c['size'],'quality':{128:85,256:88,384:89}[c['size']],'method':0,'segments':1,'sns_strength':0,'filter_strength':0,'sharp_yuv':True,'bytes':dst.stat().st_size,'sha256':digest(dst)})
z=arrs(W/'A61final_embeddings.npz');zi={str(k):i for i,k in enumerate(z['ids'])};meas=json.load(open(W/'A61final_measurements.json'));assert not meas['errors'] and len(z['ids'])==1200;old=arrs(R/'validation/reference_embeddings.npz');numeric={'scope':'Stage A revision3; all66 same-person variant pairs per person, hs_home representatives against A100 and old486; actual decoded final lossy runtime atlas pixels','photo_count':1200,'expected_photo_count':1200,'measurement_errors':[],'resolutions':{}};centers=[];verification=[]
md={p['id']:p for p in meas['records']}
for ss in S:
 e=z[f'e{ss}'];worst=(2,None)
 for p in people:
  keys=[p['source_person_id']+'__'+v for v in manifest['variant_keys']];inds=[zi[k] for k in keys];sim=e[inds]@e[inds].T;sim[np.tril_indices(12)]=2;i,j=np.unravel_index(sim.argmin(),sim.shape)
  if sim[i,j]<worst[0]:worst=(float(sim[i,j]),[keys[i],keys[j]])
 keys=[p['source_person_id']+'__hs_home' for p in people];ee=e[[zi[k] for k in keys]];sim=ee@ee.T;np.fill_diagonal(sim,-1);i,j=np.unravel_index(sim.argmax(),sim.shape);og=ee@old[f'e{min(ss,256)}'].T;oi,oj=np.unravel_index(og.argmax(),og.shape);numeric['resolutions'][str(ss)]={'same_identity_all_pairs':{'comparison_count':6600,'minimum':worst[0],'worst_pair':worst[1],'passed':worst[0]>=.6},'different_representatives':{'comparison_count':4950,'maximum':float(sim[i,j]),'nearest_pair':[keys[i],keys[j]],'passed':float(sim[i,j])<.4},'existing_representatives':{'gallery_count':486,'comparison_count':48600,'gallery_resolution':min(ss,256),'maximum':float(og[oi,oj]),'nearest_pair':[keys[oi],str(old['ids'][oj])],'passed':float(og[oi,oj])<.4}}
 for v in manifest['variant_keys']:
  sheet=Image.open(R/f'sheets/A/{ss}/{v}.webp').convert('RGB')
  for p in people:
   key=p['source_person_id']+'__'+v;i=p['index'];x=i%10*(ss+16)+8;y=i//10*(ss+16)+8;sha=hashlib.sha256(np.asarray(sheet.crop((x,y,x+ss,y+ss))).tobytes()).hexdigest();assert sha==md[key]['details'][str(ss)]['pixel_sha256'];center=np.mean(md[key]['details'][str(ss)]['landmarks'],axis=0)*256/ss;deviation=float(abs(center-np.array([130.98235626,118.22048492])).max());assert deviation<=4;centers.append({'photo_id':key,'size':ss,'center_256':center.tolist(),'max_axis_deviation_256':deviation});verification.append({'photo_id':key,'size':ss,'actual_decoded_rgb_sha256':sha,'measured_decoded_rgb_sha256':sha,'equal':True})
assert all(all(q['passed'] for q in r.values()) for r in numeric['resolutions'].values());numeric['passed']=True
shutil.copyfile(W/'A61final_embeddings.npz',R/'validation/stage_a/raw_embeddings.npz');dump(R/'validation/stage_a/photo_measurements.json',meas);dump(R/'validation/stage_a/numeric_validation.json',numeric);dump(R/'validation/stage_a/face_centers.json',centers);dump(R/'validation/stage_a/sheet_encoding_receipts.json',encoding);dump(R/'validation/stage_a/runtime_pixel_equivalence.json',{'cells':3600,'equal_cells':3600,'different_cells':0,'details':verification,'scope':'Published atlas pixels equal the measured actual-atlas pixels; exact RGB hashing required for every reused vector.'})
# Update native derivation records, keeping identity/index/age/level unchanged.
provenance=json.load(open(H/'photo_provenance.json'));hs=json.load(open(W/'A_hs_revision3_cases.json'))[0]['A_sources'];new={c['person_key']+'__'+c['variant']:c for c in json.load(open(W/'cohort_r3_normalization.json')) if c.get('kind')=='A'};caps={c['variant']:c for c in json.load(open(W/'A061_cap_normalization.json'))};hs['A061']=caps['hs_home'];new.update({'A061__'+v:c for v,c in caps.items()});bgmode={p['photo_id']:p['mode'] for p in json.load(open(W/'A_hs_native_gradient_restoration_map.json'))};bg_receipts=json.load(open(W/'A_revision3_recenter_restoration_receipt.json'));native_files={};baseline_fields={k:{f:v for f,v in p.items()} for k,p in enumerate(provenance)}
for p in provenance:
 aid=p['game_id'].split('_')[-1];v=p['variant'];c=(hs[aid] if v=='hs_home' else new[aid+'__'+v]) if aid in wanted else None
 if c:
  native=archive_native(c);x0,y0,x1,y1=c['crop'];n=c['native_edge'];ox,oy=c['translation_origin_xy'];p.update(native_path=native,native_sha256=digest(R/native),native_cell_xyxy=[x0,y0,x0+n,y0+n],selection='revision3_whole_native_photo_correction',whole_photo_frame={'normalized_native_edge':n,'whole_photo_crop_origin':[ox,oy],'canvas_edge_inset':0,'retained_native_source_edge':n,'edge_extension_pixels_tblr':[max(-oy,0),max(oy,0),max(-ox,0),max(ox,0)]},retained_native_minimum_edge=n,no_photo_upscale=True,face_warp=False,body_pasting=False)
 else:
  p['revision3_retained_original_photograph']=True
  if v=='hs_home':p['revision3_added_canvas_reconstruction_mode']=bgmode[p['photo_id']]
  related=[r for r in bg_receipts if r['photo_id']==p['photo_id']]
  if related:p['revision3_artificial_canvas_restoration']=related
  if p['photo_id']=='c004_p08__suwon_sparks':p['whole_photo_frame']['whole_photo_crop_origin'][1]+=1;p['whole_photo_frame']['edge_extension_pixels_tblr'][0]-=1
 native_files[p['native_path']]={'path':p['native_path'],'sha256':p['native_sha256'],'original_filename':Path(p['native_path']).name,'dimensions':list(Image.open(R/p['native_path']).size),'bytes':(R/p['native_path']).stat().st_size}
dump(R/'validation/stage_a/photo_provenance.json',provenance);dump(R/'validation/stage_a/native_files.json',list(native_files.values()));assert min(p['retained_native_minimum_edge'] for p in provenance)>=384
manifest.update(revision='v21b-stage-A-3',production_complete=False,stage_a_complete=True,asset_validation_passed=True,revision3_corrected_A_review_ids=wanted);dump(R/'manifest.json',manifest)
validation=old_validation;validation.update(revision='v21b-stage-A-3',resolutions=numeric['resolutions'],same_identity_minimum=min(r['same_identity_all_pairs']['minimum'] for r in numeric['resolutions'].values()),different_representatives_maximum=max(r['different_representatives']['maximum'] for r in numeric['resolutions'].values()),existing_representatives_maximum=max(r['existing_representatives']['maximum'] for r in numeric['resolutions'].values()),revision3_corrected_A_review_ids=wanted);validation['face_center']['maximum_deviation_256_px']=max(p['max_axis_deviation_256'] for p in centers);validation['native_sources']['unique_files']=len(native_files);dump(R/'validation.json',validation)
# B review extends8 to17 full12-variant candidate families. No runtime B IDs are assigned.
raw={};normal={}
for stem in ['b','extra','r2_initial','r2_b_repairs','a7_singles','a2_hair','bg2','family_b_000','cohort_r3','B_next']:
 zz=arrs(W/(stem+'_embeddings.npz'));details={p['id']:p for p in json.load(open(W/(stem+'_embeddings.json')))['records']};norm={p['id']:p for p in json.load(open(W/(stem+'_normalization.json')))}
 for i,k in enumerate(zz['ids']):k=str(k);raw[k]=(details[k],{ss:zz[f'e{ss}'][i] for ss in S});normal[k]=norm[k]
bm=json.load(open(R/'stage_b_family_review_manifest.json'));candidate_manifest=json.load(open(R/'stage_b_candidate_manifest.json'));qold=candidate_manifest['identities'];q_by_seed={p['seed_id']:f'Q{i+1:03}' for i,p in enumerate(qold)};q_by_label={f'Q{i+1:03}':p for i,p in enumerate(qold)};out=[];allfeatures={s:[] for s in S};all_details=[]
def add_B(person,v,c,age,level,glasses,seed):
 sourcekey=Path(c['normalized_path']).stem;details,features=raw[sourcekey];target_id=person+'__'+v;folder=R/'review/revision3/B';photos={};native=archive_native(c)
 for ss in S:
  src=Path(c['normalized_path']).with_name(sourcekey+f'_{ss}.webp');dest=folder/str(ss)/(target_id+'.webp');dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(src,dest);sha=hashlib.sha256(np.asarray(Image.open(dest).convert('RGB')).tobytes()).hexdigest();assert sha==details['details'][str(ss)]['pixel_sha256'];photos[str(ss)]={'path':str(dest.relative_to(R)),'decoded_rgb_sha256':sha};allfeatures[ss].append(features[ss])
 dest=folder/'normalized'/(target_id+'.png');dest.parent.mkdir(exist_ok=True);shutil.copyfile(c['normalized_path'],dest);row={'id':target_id,'person_id':person,'variant':v,'seed_id':seed,'review_id':q_by_seed.get(seed),'age':age,'level':level,'glasses':glasses,'native':{'path':native,'sha256':digest(R/native)},'crop':c['crop'],'native_edge':c['native_edge'],'translation_origin_xy':c['translation_origin_xy'],'normalized_native_path':str(dest.relative_to(R)),'photos':photos,'source_measured_photo_id':sourcekey,'status':'FULL_FAMILY_INDIVIDUAL_EXPORT_PASS_NOT_FINAL_RUNTIME_ATLAS'};out.append(row);all_details.append({**details,'id':target_id})
first_people=json.load(open(W/'b_uniform_pilot_people.json'));first={p['id']:p for p in json.load(open(W/'family_b_000_normalization.json'))};bg=next(p['source'] for p in json.load(open(W/'a7_actual_hs_selection.json'))['selected'] if p['group']=='B8_BG')
for i,p in enumerate(first_people):
 for v in manifest['variant_keys']:
  c=bg if i==7 and v=='hs_home' else first[p['id']+'__'+v];add_B(p['id'],v,c,p['age'],p['level'],p['glasses'],p['seed_id'])
q1=next(p for p in json.load(open(W/'cohort_r3_a7_q001_people.json')) if p['person_key']=='Q001');newco={p['id']:p for p in json.load(open(W/'cohort_r3_normalization.json'))}
for v in manifest['variant_keys']:add_B(q_by_label['Q001']['id'],v,q1 if v=='hs_home' else newco['r3_Q001__'+v],q1['age'],q1['level'],False,q1['seed_id'])
bp=json.load(open(W/'B_cohort_r3_next_people.json'));bn={p['id']:p for p in json.load(open(W/'B_next_normalization.json'))}
for i,p in enumerate(bp):
 person=q_by_label[p['review_id']]['id'] if p.get('review_id') else p['id']
 for v in manifest['variant_keys']:add_B(person,v,p if v=='hs_home' else bn[f'bnext_r3_{i:02}__'+v],p['age'],p['level'],p['glasses'],p['seed_id'])
assert len(out)==204 and len({p['person_id'] for p in out})==17
bm.update(family_count=17,photo_count=204,photos=out,revision=3,production_complete=False,game_ids_assigned=False);dump(R/'stage_b_family_review_manifest.json',bm);np.savez_compressed(V/'B_family_raw_embeddings.npz',ids=np.array([p['id'] for p in out]),**{f'e{ss}':np.stack(v) for ss,v in allfeatures.items()});dump(V/'B_family_measurements.json',{'records':all_details,'errors':[]});dump(V/'B_17_family_representative_gate.json',json.load(open(W/'B_17_family_representative_gate.json')))
changes={};corrected={'Q001','Q024','Q033','Q054','Q055','Q083'};requested=list(json.load(open(W/'user_revision_request_20261120.json'))['b_review_changes'])
for q in requested:changes[q]={'status':'corrected_full12_individual_exports_pass' if q in corrected else 'excluded_from_final_selection','original_photo_id':q_by_label[q]['id'],'replacement_person_id':q_by_label[q]['id'] if q in corrected else None}
changes['candidate8_hs_home']={'status':'corrected','person_id':first_people[7]['id'],'background_rgb_before':[138.5,138.5,137],'background_rgb_after':[102,102,102],'other_variant_corner_luma_range':[100,118]}
dump(R/'revision3_review.json',{'revision':3,'baseline_commit':'82c948056ed72f9cc4d02baba3510a3c91eb4445','A_corrected_ids':wanted,'A_runtime_sheet_count':36,'A_validation_passed':True,'A061_cap_corrected':True,'visual_followup':[],'A_identity_age_lock_sha256':lock['sha256'],'B_runtime_sheet_count':0,'B_complete_candidate_families':17,'B_candidate_family_photos':204,'B_changes':changes,'production_complete':False,'human_age_review':'pending'})
# Contact sheets keep the user's Q labels stable.
canvas=Image.new('RGB',(12*132,7*156),'white');draw=ImageDraw.Draw(canvas)
for row,aid in enumerate(wanted):
 p=next(p for p in people if p['review_id']==aid);i=p['index']
 for col,v in enumerate(manifest['variant_keys']):
  image=Image.open(R/f'sheets/A/128/{v}.webp').convert('RGB').crop((i%10*144+8,i//10*144+8,i%10*144+136,i//10*144+136));canvas.paste(image,(col*132,row*156));draw.text((col*132+2,row*156+130),aid+' '+v[:15],fill='black')
canvas.save(PRE/'revision3_A7_all12.jpg',quality=92)
canvas=Image.new('RGB',(420,len(requested)*150),'white');draw=ImageDraw.Draw(canvas)
for row,q in enumerate(requested):
 oldq=q_by_label[q];canvas.paste(Image.open(R/oldq['photos']['128']['path']).convert('RGB'),(0,row*150));draw.text((2,row*150+130),q+' BEFORE',fill='black')
 if q in corrected:
  c=next(p for p in out if p['review_id']==q and p['variant']=='hs_home');canvas.paste(Image.open(R/c['photos']['128']['path']).convert('RGB'),(140,row*150));draw.text((142,row*150+130),q+' CORRECTED',fill='black')
 else:draw.rectangle((140,row*150,268,row*150+128),fill=(38,38,38));draw.text((150,row*150+54),'EXCLUDED',fill='white');draw.text((142,row*150+130),q+' HELD',fill='black')
canvas.save(PRE/'revision3_B_requested_changes.jpg',quality=92)
canvas=Image.new('RGB',(12*132,17*150),'white');draw=ImageDraw.Draw(canvas)
for row,pid in enumerate(dict.fromkeys(p['person_id'] for p in out)):
 for col,v in enumerate(manifest['variant_keys']):
  c=next(p for p in out if p['person_id']==pid and p['variant']==v);canvas.paste(Image.open(R/c['photos']['128']['path']).convert('RGB'),(col*132,row*150));draw.text((col*132+2,row*150+130),(c.get('review_id') or f'B-ref{row+1}')+' '+v[:13],fill='black')
canvas.save(PRE/'revision3_B17_all12.jpg',quality=92)
for name in ['user_revision_request_20261120.json','a7_actual_hs_selection.json','cohort_r3_validation.json','B_next_validation.json','candidate8_background_target.json','head_scale_calibration.json','A_hs_native_gradient_restoration_map.json','A_revision3_recenter_restoration_receipt.json','A61final_validation.json','cohort_r3_a7_q001_registry.json','B_cohort_r3_next_registry.json','B_r3_new_generation_registry.json','B_glasses_generation_registry.json','A061_cap_generation_registry.json','A061_cap_normalization.json']:
 if (W/name).exists():shutil.copyfile(W/name,V/name)
for name in ['measure.py','measure_A_revision3.py','measure_A_restored.py','measure_A_recentered.py','reconstruct_A_native.py','build_A_revision3.py','build_A_revision3_restore_canvas.py','build_A_recentered.py','validate_A_restored.py','validate_A_recentered.py','validate_A_revision3_cases.py','validate_B_next.py','select_a7_hs.py','plan_B_cohort_r3_next.py','publish_revision3.py','prepare_A061_cap.py','normalize_A061_cap.py','measure_A61final.py','validate_A61final.py','build_A61final.py']:
 shutil.copyfile(W/name,V/name)
# Replace stale numbers in the handoff and explicitly describe B's remaining work.
text=(H/'CLAUDE_HANDOFF.md').read_text();text='# v21b 시트 A revision3 — A 7명 교체 및 B 수정 중간본\n\n'+'A062·A047·A038·A083·A061·A069·A093의 12변형을 교체했습니다. A061은 12변형 모두 모자 윗부분이 잘리지 않도록 낮은 크라운과 여백을 추가 보완했습니다. A100 번호·나이·level은 모두 유지합니다. 같은 인물 최저 0.606188, A 대표끼리 최고 0.398291, 기존486명과 최고 0.392386입니다. 최종 손실 시트에서 잘라낸 RGB 3600칸을 직접 측정값과 대조해 통과했습니다. 배경 캔버스 재구성과 A041 수원 사진의 1 native px 전체 사진 중심 보정은 얼굴 변형 없이 기존 사진을 유지하기 위한 처리이며 상세 기록은 validation/revision3/에 있습니다.\n\nB는 공식 런타임 시트가 아직 없습니다. 17명×12종=204장의 개별 사진 검수본이며, 최종 B100과 B 시트36장의 완료를 뜻하지 않습니다. game ID는 배정하지 않았습니다. production_complete=false, human_age_review=pending입니다.\n\nQ001·Q024·Q033은 머리 크기를 보정했고, Q054·Q055는 무지 아마추어 유니폼, Q083은 검은 머리로 수정했습니다. 이 6명의 12변형은 개별 사진 검사를 통과했습니다. Q071·Q042·Q047·Q064·Q074·Q067·Q075는 최종 선정에서 제외합니다. 첫8명의 candidate8 hs_home 배경은 다른 변형과 가까운 중립 회색으로 맞췄습니다. Q 번호는 82c94805의 리뷰 번호를 그대로 씁니다.\n\n미리보기: previews/revision3_A7_all12.jpg, previews/revision3_B_requested_changes.jpg, previews/revision3_B17_all12.jpg. 변경표는 revision3_review.json, B 전체12종 후보는 stage_b_family_review_manifest.json입니다. 후보판을 공식 B 시트로 연결하지 마세요.\n\n' + text
# Keep legacy instructions as history, clearly marked to avoid stale validation figures.
text=text.replace('# v21b 시트 A — Claude 연결 안내','## 이전 A1 납품 기록 (수치와 소스는 validation/history/stage_a_before_revision3/에 보존)');(R/'CLAUDE_HANDOFF.md').write_text(text)
checks=[]
for p in sorted(R.rglob('*')):
 if p.is_file() and p.name!='checksums.sha256' and '/.git/' not in str(p):checks.append(digest(p)+'  '+str(p.relative_to(R)))
(R/'checksums.sha256').write_text('\n'.join(checks)+'\n');print(json.dumps({'A_runtime_sheets':len(encoding),'A_photos':1200,'A_identity_lock_unchanged':True,'B_full_candidate_families':17,'B_review_photos':204,'new_originals_preserved':len(native_receipts),'checksums':len(checks),'production_complete':False},indent=2),flush=True)
