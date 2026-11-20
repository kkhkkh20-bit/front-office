import os
os.environ['OPENBLAS_NUM_THREADS']='1'
from pathlib import Path
import json,numpy as np,hashlib,shutil
W=Path('/dev/shm/v21b-work');R=W/'repo/assets/v21/amateur200';S=[128,256,384]
def load(p):
 z=np.load(p);return {k:z[k] for k in z.files}
b=load(R/'validation/revision3/B_family_raw_embeddings.npz');a=load(R/'validation/stage_a/raw_embeddings.npz');old=load(R/'validation/reference_embeddings.npz');ids=[str(k) for k in b['ids']];bi={k:i for i,k in enumerate(ids)};people=list(dict.fromkeys(k.split('__')[0] for k in ids));ai=[i for i,k in enumerate(a['ids']) if str(k).endswith('__hs_home')];reps=[bi[p+'__hs_home'] for p in people];report={};minimum=1.;maximum=0
for s in S:
 e=b[f'e{s}'];same=1.
 for p in people:
  ix=[i for k,i in bi.items() if k.startswith(p+'__')];v=e[ix];mm=v@v.T;same=min(same,float(mm[np.triu_indices(12,1)].min()))
 r=e[reps];m=r@r.T;np.fill_diagonal(m,-1);ag=r@a[f'e{s}'][ai].T;og=r@old[f'e{min(s,256)}'].T;report[str(s)]={'same_min':same,'between_max':float(m.max()),'A_max':float(ag.max()),'old_max':float(og.max()),'passed':same>=.6 and max(float(m.max()),float(ag.max()),float(og.max()))<.4};minimum=min(minimum,same);maximum=max(maximum,float(m.max()),float(ag.max()),float(og.max()))
assert all(x['passed'] for x in report.values());p=R/'validation/revision3/B_17_family_representative_gate.json';p.write_text(json.dumps(report,indent=2)+'\n');rr=json.load(open(R/'revision3_review.json'));checkpoint={'date':'2026-11-20','revision':3,'scope':'A7 corrected in A100 final runtime; B17 complete candidate families, individually decoded exports only','stage_b_complete':False,'runtime_identity_count':0,'runtime_sheet_count':0,'review_candidate_entries':91,'excluded_review_entries':7,'individually_validated_12_variant_families':17,'individually_validated_family_photos':204,'individual_photo_same_person_min':minimum,'individual_photo_guard_max':maximum,'individual_photo_numeric_gate':report,'same_person_12_variant_gate':'partial_pass_17_of_100','final_atlas_gate':'pending','age_level_and_glasses_final_balance':'pending; no B game age or ID assigned','human_age_review':'pending','stage_a_replacement_count_requested':7,'stage_a_replacement_ids':rr['A_corrected_ids'],'stage_a_runtime_corrected':True,'A061_cap_corrected':True,'new_originals_preserved':True,'production_complete':False,'superseding_review':'revision3_review.json'};(R/'validation/stage_b/checkpoint.json').write_text(json.dumps(checkpoint,ensure_ascii=False,indent=2)+'\n');shutil.copyfile(W/'update_revision3_checkpoint.py',R/'validation/revision3/update_revision3_checkpoint.py');checks=[]
for p in sorted(R.rglob('*')):
 if p.is_file() and p.name!='checksums.sha256':checks.append(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+str(p.relative_to(R)))
(R/'checksums.sha256').write_text('\n'.join(checks)+'\n');print(json.dumps({'B17_gate':report,'checksums':len(checks)},indent=2),flush=True)
