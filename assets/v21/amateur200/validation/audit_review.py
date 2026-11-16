"""Audit candidate bytes and raw cosine scores; DOES NOT validate 13 variants."""
import os
os.environ['OPENBLAS_NUM_THREADS']='1'
from pathlib import Path
import json,hashlib,collections
import numpy as np
import networkx as nx
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parent.parent;V=ROOT/'validation'
def write(path,data):path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
def main():
 m=json.loads((ROOT/'review_manifest.json').read_text());cs=m['candidates'];ids=[c['candidate_id'] for c in cs];n=len(ids)
 with np.load(V/'candidate_embeddings.npz') as z:e={s:z[f'e{s}'].copy() for s in [128,256,384]};assert z['ids'].tolist()==ids
 with np.load(V/'reference_embeddings.npz') as z:r={s:z[f'e{s}'].copy() for s in [128,256]};rids=z['ids'].tolist()
 assert len(rids)==486 and len(set(rids))==486
 rec=json.loads((V/'candidate_measurements.json').read_text());assert not rec['errors'];records={x['id']:x for x in rec['records']}
 for c in cs:
  native=ROOT/c['native']['path'];assert hashlib.sha256(native.read_bytes()).hexdigest()==c['native']['sha256']
  for s in [128,256,384]:
   row=c['photos'][str(s)];p=ROOT/row['path'];im=Image.open(p);assert im.mode=='RGB' and im.size==(s,s)
   assert hashlib.sha256(p.read_bytes()).hexdigest()==row['sha256']
   pixel=hashlib.sha256(np.asarray(im).tobytes()).hexdigest();assert pixel==row['decoded_rgb_sha256']==records[c['candidate_id']]['details'][str(s)]['pixel_sha256']
 old={s:e[s]@r[min(s,256)].T for s in e};new={s:e[s]@e[s].T for s in e};maxold=np.maximum.reduce([x.max(1) for x in old.values()]);maxnew=np.maximum.reduce(list(new.values()));np.fill_diagonal(maxnew,-1)
 sizes={}
 for s in e:
  ii,jj=np.triu_indices(n,1);vals=new[s][ii,jj];failing=np.flatnonzero(vals>=.4)
  sizes[str(s)]={'different_candidate_comparisons':len(vals),'different_candidate_violations':len(failing),'different_candidate_max':float(vals.max()),'old_gallery_comparisons':int(old[s].size),'old_gallery_violations':int((old[s]>=.4).sum()),'old_gallery_max':float(old[s].max())}
 valid=[i for i,c in enumerate(cs) if maxold[i]<.4 and c['assistant_visual_review']['status']=='assistant_base_screen_pass']
 graph=nx.Graph();graph.add_nodes_from(valid)
 for a,i in enumerate(valid):
  for j in valid[a+1:]:
   if maxnew[i,j]>=.4:graph.add_edge(i,j)
 matching=nx.max_weight_matching(graph,maxcardinality=True)
 certificate=[]
 for i,j in sorted(tuple(sorted(pair)) for pair in matching):
  scores={str(s):float(new[s][i,j]) for s in e};certificate.append({'a':ids[i],'b':ids[j],'raw_cosine_by_size':scores})
 bound=len(valid)-len(matching)
 remaining=set(valid);selected=[]
 while remaining:
  best=min(remaining,key=lambda i:(sum(j in remaining for j in graph[i]),float(maxold[i]),ids[i]));selected.append(best);remaining.discard(best);remaining.difference_update(graph[best])
 assert all(maxold[i]<.4 for i in selected)
 assert all(maxnew[i,j]<.4 for a,i in enumerate(selected) for j in selected[a+1:])
 selection={'status':'SINGLE_PHOTO_PRESCREEN_ONLY_NOT_PRODUCTION_READY','count':len(selected),'candidate_ids':[ids[i] for i in selected],'proposed_levels':dict(collections.Counter(cs[i]['proposed_level'] for i in selected)),'glasses_count':sum(cs[i]['tags']['glasses'] for i in selected),'maximum_old_gallery_cosine':float(maxold[selected].max()) if selected else None,'maximum_selected_pair_cosine':max((float(maxnew[i,j]) for a,i in enumerate(selected) for j in selected[a+1:]),default=None),'human_age_review':'pending','all_thirteen_variants':'not generated or tested','method':'deterministic minimum-current-degree heuristic; not claimed maximum independent set'}
 write(V/'provisional_single_photo_selection.json',selection)
 write(V/'disjoint_collision_certificate.json',{'scope':'These exact exported hs_home candidate pixels only. This is NOT a claim that future photographs or new fictional identities cannot solve the request.','eligible_fixed_candidate_count':len(valid),'disjoint_incompatible_pairs':len(certificate),'upper_bound_on_compatible_candidates_from_this_fixed_pool':bound,'reason':'Every disjoint pair has at least one size with raw cosine >=0.40. At most one member of each pair can belong to a valid set. Upper bound = eligible count minus pair count.','pairs':certificate})
 report={'schema_version':'front-office.v21.candidate-validation.v1','status':'INCOMPLETE_BLOCKED_AT_IDENTITY_PRESCREEN','production_complete':False,'asset_validation_passed':False,'requested':{'identities':200,'photos':2600,'runtime_sheets':78},'actual':{'candidate_hs_home_photos':n,'decoded_candidate_exports_checked':n*3,'complete_thirteen_variant_identities':0,'runtime_sheets':0,'native_original_pngs':len(set(c['native']['path'] for c in cs))},'gates_unchanged':{'same_person_all_variant_pairs_min':.6,'different_person_cosine_exclusive_max':.4},'reference_gallery':{'identity_count':486,'groups':{'v6c':100,'v13':60,'v18':200,'v7':126},'resolution_protocol':{'128':'candidate128 vs canonical128','256':'candidate256 vs canonical256','384':'candidate384 vs canonical256; legacy canonical gallery has 128/256 only'},'scope':'canonical reference photographs; not every historical runtime kit photo'},'raw_cosine_candidate_results':sizes,'old_gallery_compatible_candidates':int((maxold<.4).sum()),'visually_screened_numeric_eligible_candidates':len(valid),'compatible_set_upper_bound_for_this_fixed_pool':bound,'provisional_single_photo_selection':selection,'human_age_review':'PENDING_ACTUAL_HUMAN_REVIEW; assistant screening is not human approval','same_person_13_variant_pairs':'NOT_RUN_NO_THIRTEEN_VARIANT_FAMILIES','completion_blockers':['Current fixed candidate pool cannot provide 200 compatible hs_home photographs; see disjoint collision certificate.','Adobe source generator daily quota exhausted; resets midnight GMT.','Higgsfield source generator rejected additional requests because existing credits were insufficient; no purchase/trial started.','Basic-generator pilot candidates have old-gallery or within-group collisions.','Final 200 identity selection, thirteen variants, 78 atlases, actual atlas pixel checks, and human age review remain unfinished.']}
 write(ROOT/'validation.json',report)
 rows=(len(selected)+5)//6;canvas=Image.new('RGB',(6*264,rows*284+40),'white');d=ImageDraw.Draw(canvas);d.text((8,8),f'{len(selected)} SINGLE-PHOTO PRESCREEN CANDIDATES - NOT production ready',fill='black')
 for k,i in enumerate(selected):
  c=cs[i];x=k%6*264+4;y=k//6*284+36;canvas.paste(Image.open(ROOT/c['photos']['256']['path']),(x,y));d.text((x,y+258),f"{ids[i]} / age target {c['proposed_age']}",fill='black')
 canvas.save(ROOT/'previews/provisional_single_photo_selection_256.png',optimize=True)
 print(json.dumps({'candidate_count':n,'old_gallery_compatible':int((maxold<.4).sum()),'fixed_pool_upper_bound':bound,'provisional_single_photo_selection':len(selected),'production_complete':False}),flush=True)
if __name__=='__main__':main()
