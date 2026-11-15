"""Select entire reviewed photos. No face, body, or background compositing."""
from pathlib import Path
import sys,json,hashlib
import numpy as np
P=Path(__file__).resolve().parent;OUT=P.parents[1]
TARGETS={'v18_165','v18_169','v18_170','v18_174'}
def collect(require_visual=True):
 m=json.loads((P/'baseline/manifest.json').read_text());ids=[x['id'] for x in m['identities']];teams=[x['key'] for x in m['teams']];chosen={};all_candidates=[]
 excluded=set(json.loads((P/'visual_exclusions.json').read_text()).get('excluded_render_keys',[])) if (P/'visual_exclusions.json').exists() else set()
 pixel_excluded={(x['id'],x['team'],x['measurement_key']) for x in json.loads((P/'actual_pixel_exclusions.json').read_text())} if (P/'actual_pixel_exclusions.json').exists() else set()
 for f in sorted((P/'measurements').glob('*.json')):
  try:batch=json.loads(f.read_text())
  except json.JSONDecodeError:continue
  key=batch['key'];reviewfile=P/'reviews'/f'{key}.json'
  reviewed=False
  if reviewfile.exists():
   review=json.loads(reviewfile.read_text());reviewed=bool(review['passed'])
  if key in excluded or (require_visual and not reviewed):continue
  for n,x in enumerate(batch.get('photos',[])):
   if (x['id'],x['team'],key) in pixel_excluded:continue
   if not x['numerical_passed']:continue
   if (x['id'] in TARGETS)!=(batch['kind']=='gray'):continue
   score=min(v['same_original_all10_min'] for v in x['metrics'].values()) if batch['kind']=='gray' else x['metrics']['384']['same_original_all10_min']
   if batch['kind']=='gray':score+=3*(.4-max(max(v['other199_max'],v['legacy160_max']) for v in x['metrics'].values()))
   candidate={**x,'measurement_key':key,'embedding_row':n,'visual_review_passed':reviewed,'selection_score':float(score)};k=(x['team'],x['id']);all_candidates.append(candidate)
   if k not in chosen or score>chosen[k]['selection_score']:chosen[k]=candidate
 missing=[{'id':rid,'team':t} for t in teams for rid in ids if (t,rid) not in chosen]
 metrics={};failures=[]
 for s in [128,256,384]:
  complete_ids=[rid for rid in ids if all((t,rid) in chosen for t in teams)];minscore=1.;count=0
  loaded={};E=[]
  for t in teams:
   values=[]
   for rid in complete_ids:
    row=chosen[t,rid];key=row['measurement_key']
    if key not in loaded:loaded[key]=np.load(P/'measurements'/f'{key}.npz')
    values.append(loaded[key][f'e{s}'][row['embedding_row']])
   E.append(np.array(values))
  if complete_ids:
   E=np.array(E)
   for a in range(10):
    for b in range(a+1,10):
     diag=np.sum(E[a]*E[b],axis=1);minscore=min(minscore,float(diag.min()));count+=len(complete_ids)
     if s==384:
      for j in np.flatnonzero(diag<.6):failures.append({'id':complete_ids[j],'team_a':teams[a],'team_b':teams[b],'cosine':float(diag[j]),'size':s})
  metrics[str(s)]={'complete_identities':len(complete_ids),'same_new_pairs':count,'same_new_min':minscore if count else None}
 rows=[chosen[t,rid] for t in teams for rid in ids if (t,rid) in chosen]
 result={'complete':not missing and not failures,'require_visual_review':require_visual,'selected_photo_count':len(rows),'missing':missing,'metrics':metrics,'same_identity_failures':failures,'photos':rows}
 name='approved_photos.json' if require_visual else 'numerical_photo_progress.json';(P/name).write_text(json.dumps(result,indent=2));print(json.dumps({k:v for k,v in result.items() if k not in ['photos','missing']},indent=2));print('Missing photos:',len(missing))
 if require_visual and result['complete']:
  provenance_file=OUT/'validation/v18b_native_provenance.json';proof=json.loads(provenance_file.read_text()) if provenance_file.exists() else None;archived={(x['id'],x['team']):x for x in proof['photos']} if proof else {};verified_archives=set()
  for x in rows:
   if Path(x['path']).exists():assert hashlib.sha256(Path(x['path']).read_bytes()).hexdigest()==x['native_sha256']
   else:
    a=archived[x['id'],x['team']];assert a['measurement_key']==x['measurement_key'] and a['archived_native_crop_verified'] and proof['archived_native_crop_verification_passed']
    archive=P.parents[4]/a['source_render']
    if str(archive) not in verified_archives:assert hashlib.sha256(archive.read_bytes()).hexdigest()==a['source_render_sha256'];verified_archives.add(str(archive))
 return result
if __name__=='__main__':collect('--allow-unreviewed' not in sys.argv)
