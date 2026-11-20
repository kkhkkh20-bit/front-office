import os
os.environ['OPENBLAS_NUM_THREADS']='1'
from pathlib import Path
import json,itertools,numpy as np
W=Path('/dev/shm/v21b-work');R=W/'repo/assets/v21/amateur200';SIZES=[128,256,384]
z=np.load(W/'family_b_000_embeddings.npz');ix={str(k):i for i,k in enumerate(z['ids'])};records={c['id']:c for c in json.load(open(W/'family_b_000_embeddings.json'))['records']};people=json.load(open(W/'b_uniform_pilot_people.json'));variants=list(json.load(open(W/'family_b_000_registry.json'))['variants']);assert len(ix)==96 and len(variants)==12
old=np.load(R/'validation/reference_embeddings.npz');a=np.load(R/'validation/stage_a/raw_embeddings.npz');ai=[i for i,p in enumerate(a['ids']) if p.endswith('__hs_home')];b=np.load(W/'b_embeddings.npz');ex=np.load(W/'extra_embeddings.npz');bi={str(k):i for i,k in enumerate(b['ids'])};ei={str(k):i for i,k in enumerate(ex['ids'])};peers=[c for c in json.load(open(W/'b_visual_screen.json'))['records'] if c['selected_after_assistant_face_review']];em={c['id']:c for c in json.load(open(W/'extra_screen.json'))};peers.extend(em[k] for k in ['b_recast_004','b_recast_009','b_recast_010','b_firefly_002_0']);anchor=np.array([130.98235626,118.22048492]);out=[]
for p in people:
 pid=p['id'];rows=[];centers=[];different=[]
 for s in SIZES:
  e=np.stack([z[f'e{s}'][ix[pid+'__'+v]] for v in variants]);assert np.allclose(np.linalg.norm(e,axis=1),1,atol=1e-6)
  for i,j in itertools.combinations(range(12),2):rows.append({'size':s,'a':variants[i],'b':variants[j],'cosine':float(e[i]@e[j])})
  rep=e[0];o=rep@old[f'e{min(s,256)}'].T;aa=rep@a[f'e{s}'][ai].T;pc=[c for c in peers if c['id']!=pid];pe=np.stack([(b[f'e{s}'][bi[c['id']]] if c['id'] in bi else ex[f'e{s}'][ei[c['id']]]) for c in pc]);bb=rep@pe.T;new=[q for q in people if q['id']!=pid];nn=rep@np.stack([z[f'e{s}'][ix[q['id']+'__hs_home']] for q in new]).T
  different.extend([{'size':s,'scope':'existing_486','max':float(o.max()),'nearest':str(old['ids'][int(o.argmax())])},{'size':s,'scope':'stage_a_100','max':float(aa.max()),'nearest':str(a['ids'][ai[int(aa.argmax())]])},{'size':s,'scope':'other_b_candidates','max':float(bb.max()),'nearest':pc[int(bb.argmax())]['id']},{'size':s,'scope':'new_hs_reps_in_this_batch','max':float(nn.max()),'nearest':new[int(nn.argmax())]['id']}])
  for v in variants:
   center=np.mean(records[pid+'__'+v]['details'][str(s)]['landmarks'],axis=0)*256/s;centers.append({'size':s,'variant':v,'center_256':center.tolist(),'max_axis_deviation':float(np.max(np.abs(center-anchor)))})
 mn=min(r['cosine'] for r in rows);mx=max(r['max'] for r in different);dev=max(r['max_axis_deviation'] for r in centers)
 out.append({'candidate_id':pid,'same_person_min':mn,'different_representative_max':mx,'face_center_max_axis_deviation_256':dev,'passed_individual_photo_gate':mn>=.6 and mx<.4 and dev<=4,'same_pairs':rows,'different_comparisons':different,'face_centers':centers})
report={'status':'INDIVIDUAL_PHOTO_GATE_NOT_FINAL_ATLASES','family_count':8,'photo_count':96,'same_pair_count_per_size':528,'passed_family_count':sum(c['passed_individual_photo_gate'] for c in out),'all_12_variant_same_person_min':min(c['same_person_min'] for c in out),'final_atlas_validation':'pending','human_age_review':'pending','records':out};(W/'family_b_000_validation.json').write_text(json.dumps(report,indent=2));print({k:v for k,v in report.items() if k!='records'});print([(c['candidate_id'],c['same_person_min'],c['different_representative_max'],c['passed_individual_photo_gate']) for c in out])
