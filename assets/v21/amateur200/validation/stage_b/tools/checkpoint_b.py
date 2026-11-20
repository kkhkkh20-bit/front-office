import os
os.environ['OPENBLAS_NUM_THREADS']='1'
from pathlib import Path
import json,hashlib,shutil,numpy as np
from PIL import Image,ImageDraw,ImageFont
W=Path('/dev/shm/v21b-work');R=W/'repo/assets/v21/amateur200';D=R/'validation/stage_b'
def write(p,x):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def main():
 D.mkdir(parents=True,exist_ok=True)
 b=[c for c in json.load(open(W/'b_visual_screen.json'))['records'] if c['selected_after_assistant_face_review']]
 extra={c['id']:c for c in json.load(open(W/'extra_screen.json'))};b.extend(extra[k] for k in ['b_recast_004','b_recast_009','b_recast_010','b_firefly_002_0']);assert len(b)==91
 arrays={};features={};measurement={}
 for stem in ['b','extra']:
  z=np.load(W/(stem+'_embeddings.npz'))
  for i,p in enumerate(z['ids']):features[str(p)]={s:z[f'e{s}'][i] for s in [128,256,384]}
  measurement.update({c['id']:c for c in json.load(open(W/(stem+'_embeddings.json')))['records']})
 gallery=np.load(R/'validation/reference_embeddings.npz');a=np.load(R/'validation/stage_a/raw_embeddings.npz');ai=[i for i,p in enumerate(a['ids']) if p.endswith('__hs_home')];metrics={}
 for s in [128,256,384]:
  e=np.stack([features[c['id']][s] for c in b]);cross=e@e.T;np.fill_diagonal(cross,-np.inf);old=e@gallery[f'e{min(s,256)}'].T;ca=e@a[f'e{s}'][ai].T
  assert cross.max()<.4 and old.max()<.4 and ca.max()<.4
  metrics[str(s)]={'between_candidate_max':float(cross.max()),'existing_486_gallery_max':float(old.max()),'stage_a_100_max':float(ca.max())}
 native_index={}
 for p in (R/'native').rglob('*.png'):native_index.setdefault(sha(p),p)
 def archive(p):
  digest=sha(p)
  if digest not in native_index:
   dst=R/'native/stage_b'/f'{digest[:12]}_{p.name}';dst.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,dst);assert sha(dst)==digest;native_index[digest]=dst
  return str(native_index[digest].relative_to(R)),digest
 manifest=[]
 for k,c in enumerate(b):
  p=Path(c['native_path']);native,digest=archive(p);item={key:c.get(key) for key in ['id','seed_id','age','level','glasses','source','crop','native_edge','translation_origin_xy']};item['proposed_age']=item.pop('age');item['proposed_level']=item.pop('level');item['native']={'path':native,'sha256':digest};item['game_identity_assigned']=False;item['status']='FACE_MASTER_CANDIDATE_NOT_RUNTIME_PHOTOGRAPH';item['human_age_review']='pending';item['photos']={}
  for s in [128,256,384]:
   folder='normalized' if s==0 else str(s);src=Path(c['normalized_path']).with_name(f'{c["id"]}_{s}.webp');dst=R/'review/stage_b'/folder/src.name;dst.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(src,dst)
   pixel=hashlib.sha256(np.asarray(Image.open(dst).convert('RGB')).tobytes()).hexdigest();assert pixel==measurement[c['id']]['details'][str(s)]['pixel_sha256'];item['photos'][str(s)]={'path':str(dst.relative_to(R)),'decoded_rgb_sha256':pixel}
  src=Path(c['normalized_path']);dst=R/'review/stage_b/normalized'/src.name;dst.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(src,dst);item['normalized_native_path']=str(dst.relative_to(R));manifest.append(item)
 # Protect every newly generated original, including held trials, for an honest audit trail.
 native_trials=[]
 for p in [W/'b_firefly_001.png',W/'b_firefly_002.png',W/'b_firefly_003.png',W/'b_firefly_grid_01.png',W/'b_firefly_grid_02.png',Path('/workspace/generated_images/exec-c4df3705-e898-46a0-96eb-31d347fc2662.png'),Path('/workspace/generated_images/exec-4b1a8648-1e3f-4deb-8b79-a39ad05ca376.png'),Path('/workspace/generated_images/exec-ff8eccfa-8f51-42bb-a6ca-5b600dbc1fdf.png'),Path('/workspace/generated_images/exec-7f9834ec-e614-45f1-9fde-6bad06c3de6c.png'),Path('/workspace/generated_images/exec-c37108d5-bca5-404f-b596-df3baee5d944.png')]:
  if p.exists():
   path,digest=archive(p);native_trials.append({'path':path,'sha256':digest,'production_approved':False})
 write(R/'stage_b_candidate_manifest.json',{'status':'INCOMPLETE_FACE_MASTER_REVIEW_NOT_RUNTIME','candidate_count':len(manifest),'production_complete':False,'human_age_review':'pending','game_ids_assigned':False,'identities':manifest})
 for stem in ['b','extra','pilot']:
  for suffix in ['_embeddings.npz','_embeddings.json']:
   p=W/(stem+suffix)
   if p.exists():shutil.copyfile(p,D/p.name)
 for name in ['b_candidates.json','b_normalization.json','b_prescreen.json','b_visual_screen.json','extra_candidates.json','extra_normalization.json','extra_screen.json','b_recast_plan.json','b_uniform_pilot_people.json','pilot_candidates.json','pilot_normalization.json','pilot_validation.json','family_b_000_registry.json','family_b_000_candidates.json','family_b_000_normalization.json','family_b_000_validation.json','family_b_000_new_hs_proposal_validation.json','family_b_000_hs_selection_pixel_proof.json','single_repair_candidates.json','single_repair_normalization.json']:
  if (W/name).exists():shutil.copyfile(W/name,D/name)
 for p in W.glob('*.py'):
  if p.name in ['prepare_b_candidates.py','measure.py','normalize_b.py','normalize_extra.py','normalize_pilot.py','screen_b.py','visual_screen_b.py','checkpoint_b.py','normalize_family_b_000.py','validate_family_b_000.py','normalize_single_repair.py']:
   dst=D/'tools'/p.name;dst.parent.mkdir(exist_ok=True);shutil.copyfile(p,dst)
 family_manifest=[]
 if (W/'family_b_000_validation.json').exists():
  for name in ['family_b_000_embeddings.npz','family_b_000_embeddings.json']:shutil.copyfile(W/name,D/name)
  fm={c['id']:c for c in json.load(open(W/'family_b_000_embeddings.json'))['records']}
  for c in json.load(open(W/'family_b_000_normalization.json')):
   path,digest=archive(Path(c['native_path']));item={key:c[key] for key in ['id','person_id','variant','seed_id','age','level','glasses','crop','native_edge','translation_origin_xy']};item['native']={'path':path,'sha256':digest};item['photos']={};item['production_approved']=False
   src=Path(c['normalized_path']);dst=R/'review/stage_b_families/normalized'/src.name;dst.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(src,dst);item['normalized_native_path']=str(dst.relative_to(R))
   for s in [128,256,384]:
    src=Path(c['normalized_path']).with_name(f'{c["id"]}_{s}.webp');dst=R/'review/stage_b_families'/str(s)/src.name;dst.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(src,dst);pixel=hashlib.sha256(np.asarray(Image.open(dst).convert('RGB')).tobytes()).hexdigest();assert pixel==fm[c['id']]['details'][str(s)]['pixel_sha256'];item['photos'][str(s)]={'path':str(dst.relative_to(R)),'decoded_rgb_sha256':pixel}
   family_manifest.append(item)
  write(R/'stage_b_family_review_manifest.json',{'status':'INDIVIDUAL_PHOTO_FAMILY_REVIEW_NOT_RUNTIME','production_complete':False,'human_age_review':'pending','family_count':8,'photo_count':96,'game_ids_assigned':False,'photos':family_manifest})
  if (W/'family_b_000_all12_review.jpg').exists():shutil.copyfile(W/'family_b_000_all12_review.jpg',R/'previews/stage_b_first8_all12_review.jpg')
 write(D/'native_trials.json',native_trials)
 write(D/'checkpoint.json',{'date':'2026-11-20','baseline_stage_a_commit':'6b91744ee0acd3de007f5aed641c632862c4c1fd','stage_b_complete':False,'runtime_identity_count':0,'runtime_sheet_count':0,'face_master_candidates_screened':601,'retained_face_master_candidates':91,'canonical_candidate_measurements':metrics,'measurement_scope':'individually decoded candidate WebPs, not final production atlas pixels','same_person_12_variant_gate':'pending','final_atlas_gate':'pending','age_level_and_glasses_final_balance':'pending; candidate design ages are not frozen game ages','human_age_review':'pending','stage_a_replacement_count_requested':7,'stage_a_replacement_ids':'missing; user clarification pending','stage_a_runtime_unchanged':True,'new_originals_preserved':True})
 canvas=Image.new('RGB',(10*264,10*284),'#e5e7eb');draw=ImageDraw.Draw(canvas)
 for k,c in enumerate(manifest):
  x=k%10*264+4;y=k//10*284+4;canvas.paste(Image.open(R/c['photos']['256']['path']),(x,y));draw.text((x+2,y+258),f'Q{k+1:03} - candidate only',fill='black')
 canvas.save(R/'previews/stage_b_face_candidates_256.png',optimize=True)
 (D/'README.md').write_text('''# Stage B work checkpoint — not a runtime delivery\n\nThe official 100 Stage A identities and all A runtime sheets remain unchanged. Seven A replacement IDs have not been provided in the current conversation or request document; clarification is pending.\n\n601 individual candidate photos were measured using the unchanged raw ArcFace protocol. 91 face master candidates currently pass representative comparisons at 128/256/384 against each other, the frozen A 100 and the existing 486-person gallery. They are not 91 completed 12-kit identities. Candidate photographs may still need cap, jersey, framing, age-design and glasses-balance work. B has no runtime sheets yet. Every final atlas must be measured after export, and A/B comparisons must be repeated after the seven A replacements.\n\n`stage_b_candidate_manifest.json` contains draft source IDs, not assigned game IDs. Q numbers in the preview are temporary review labels. All proposed B ages remain unfrozen. See checkpoint.json for raw maxima and the pending gates. Newly generated originals, including held trials, are archived byte for byte. No numerical acceptance threshold has been relaxed.\n''')
 files=sorted(p for p in R.rglob('*') if p.is_file() and p!=R/'checksums.sha256')
 (R/'checksums.sha256').write_text(''.join(f'{sha(p)}  {p.relative_to(R)}\n' for p in files))
 print('Checkpoint saved',len(manifest),'candidates;',len(files),'checksummed files;',json.dumps(metrics))
if __name__=='__main__':main()
