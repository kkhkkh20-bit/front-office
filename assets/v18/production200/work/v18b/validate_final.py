"""Validate actual compressed-pixel embeddings, geometry, and unchanged identities."""
import os
os.environ['OMP_NUM_THREADS']='1';os.environ['OPENBLAS_NUM_THREADS']='1'
from pathlib import Path
import json,hashlib,itertools,gzip,csv
import numpy as np
from PIL import Image
P=Path(__file__).resolve().parent;OUT=P.parents[1];ROOT=P.parents[4]
TARGETS=['v18_165','v18_169','v18_170','v18_174']
def dump(path,value):path.write_text(json.dumps(value,ensure_ascii=False,indent=2))
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def main():
 options=json.loads((P/'pack_options.json').read_text());assert options['distinctness_gallery']=='canonical','This validator implements the established canonical source gallery; another policy needs its own explicit validation'
 m=json.loads((OUT/'manifest.json').read_text());base=json.loads((P/'baseline/manifest.json').read_text());d=OUT/'validation';z=np.load(d/'v18b_delivered_embeddings.npz');old=np.load(P/'baseline/delivered_embeddings.npz');src=np.load(OUT/'identity_prescreen/embeddings.npz');ids=[x['id'] for x in m['identities']];teams=[x['key'] for x in m['teams']]
 assert list(z['ids'])==ids==list(old['ids'])==list(src['ids']);assert list(z['teams'])==teams==list(old['teams']);assert len(ids)==200 and len(teams)==10
 assert len(m['sheets'])==60 and len(m['runtime_files'])==40 and m['runtime_sheet_bytes']==sum((ROOT/f).stat().st_size for f in m['runtime_files'])
 assert m['teams']==base['teams']
 for a,b in zip(base['identities'],m['identities']):
  assert {k:v for k,v in a.items() if k not in ['variants','revision']}=={k:v for k,v in b.items() if k not in ['variants','revision']}
  assert (b.get('revision')=='v18b')==(b['id'] in TARGETS)
 for item in m['sheets']:
  path=ROOT/item['path'];im=Image.open(path);size=item['cell_size'];pitch=size+16;assert im.mode=='RGB' and im.format=='WEBP' and im.size==(pitch*10,pitch*10);assert sha(path)==item['sha256'] and path.stat().st_size==item['bytes'];a=np.asarray(im)
  for edge in range(11):
   pos=min(edge*pitch,im.width-1);assert a[:,pos,:].max()<=8 and a[pos,:,:].max()<=8
  if size==384:assert 88<=item['encoding']['quality']<=90
 for x in m['identities']:
  for t in teams:
   for s in [128,256,384]:
    r,c=divmod(x['index'],10);assert x['variants'][t]['sheets'][str(s)]['rect']==[c*(s+16)+8,r*(s+16)+8,s,s]
 prov=json.loads((d/'v18b_native_provenance.json').read_text());assert prov['count']==2000 and prov['minimum_native_photo_side']>=384 and prov['archived_native_crop_verification_passed']
 archive=json.loads((d/'v18b_native_source_archive.json').read_text());assert archive['passed'] and archive['whole_photo_crop_count']==2000
 for source in archive['sources']:assert sha(ROOT/source['path'])==source['sha256']
 errors=json.loads((d/'v18b_detection_errors.json').read_text());assert not errors
 detections=json.loads((d/'v18b_detection_records.json').read_text());assert len(detections)==2000
 results={};background={};all_passed=True;failures=[]
 for s in [128,256,384]:
  e=z[f'e{s}'];ss=min(s,256);masters=src[f'e{ss}'];refs=src[f'ref{ss}'];assert e.shape==(10,200,512) and np.allclose(np.linalg.norm(e,axis=-1),1,atol=1e-4)
  scores=[];own_top1=True;top1_rows=[]
  for a,b in itertools.combinations(range(10),2):
   matrix=e[a]@e[b].T;diagonal=np.diag(matrix);scores.extend((ids[k],teams[a],teams[b],float(diagonal[k])) for k in range(200))
   for aa,bb,table in [(a,b,matrix),(b,a,matrix.T)]:
    predicted=np.argmax(table,axis=1);own_top1&=bool(np.all(predicted==np.arange(200)))
    for k in range(200):
     other=table[k].copy();other[k]=-2;top1_rows.append((ids[k],teams[aa],teams[bb],ids[int(predicted[k])],float(table[k,k]),float(other.max()),bool(predicted[k]==k)))
  assert len(scores)==9000 and len(top1_rows)==18000
  old_same=np.einsum('tif,uif->tui',e,old[f'e{ss}']);assert old_same.shape==(10,10,200)
  old_top1=True;source_top1=True;source_rows=[]
  for t in range(10):
   old_matrix=e[t]@old[f'e{ss}'][t].T;source_matrix=e[t]@masters.T;old_pred=np.argmax(old_matrix,axis=1);source_pred=np.argmax(source_matrix,axis=1)
   old_top1&=bool(np.all(old_pred==np.arange(200)));source_top1&=bool(np.all(source_pred==np.arange(200)))
   source_rows.extend((ids[k],teams[t],ids[int(source_pred[k])],float(source_matrix[k,k]),bool(source_pred[k]==k)) for k in range(200))
  same_min=min(x[3] for x in scores);same_max=max(x[3] for x in scores);passed=bool(same_min>=.6 and own_top1 and old_same.min()>=.6 and old_top1 and (source_top1 if s in [128,256] else True))
  if not passed:failures.append({'size':s,'same_min':same_min,'mutual_top1':own_top1,'old_same_min':float(old_same.min()),'old_top1':old_top1,'source_top1':source_top1})
  result={'passed':passed,'same_identity_pairs':9000,'same_identity_min':same_min,'same_identity_max':same_max,'mutual_cross_team_own_identity_top1':own_top1,'original_same_identity_pairs':20000,'original_same_identity_min':float(old_same.min()),'original_same_identity_max':float(old_same.max()),'original_same_team_own_identity_top1':old_top1}
  if s in [128,256]:
   w=masters@masters.T;c=masters@refs.T;upper=np.triu(np.ones((200,200),bool),1);assert upper.sum()==19900 and c.size==32000
   pre=bool(w[upper].max()<.4 and c.max()<.4);passed&=pre;result.update(passed=passed,prescreen_own_identity_top1=source_top1,within_pairs=19900,reference_pairs=32000,within_min=float(w[upper].min()),within_max=float(w[upper].max()),reference_min=float(c.min()),reference_max=float(c.max()))
  def log(name,header,rows):
   with gzip.open(d/f'v18b_{name}_{s}.csv.gz','wt') as f:
    writer=csv.writer(f);writer.writerow(header);writer.writerows(rows)
  log('same_identity',['id','team_a','team_b','cosine'],scores);log('cross_team_top1',['id','query_team','gallery_team','predicted_id','own_cosine','best_other_cosine','passed'],top1_rows)
  log('old_retention',['id','new_team','old_team','cosine'],((ids[k],teams[t],teams[u],float(old_same[t,u,k])) for t in range(10) for u in range(10) for k in range(200)))
  if s in [128,256]:log('source_top1',['id','team','predicted_id','own_cosine','passed'],source_rows)
  others_max=-1.;legacy_max=-1.;retention_min=1.;bg_ok=True;raw=[]
  for rid in TARGETS:
   k=ids.index(rid)
   for t in range(10):
    photo=e[t,k];cross=photo@masters.T;legacy=photo@refs.T;mask=np.arange(200)!=k;others_max=max(others_max,float(cross[mask].max()));legacy_max=max(legacy_max,float(legacy.max()));retention_min=min(retention_min,float(old_same[t,:,k].min()));bg_ok&=bool(cross[mask].max()<.4 and legacy.max()<.4 and old_same[t,:,k].min()>=.6 and cross.argmax()==k)
    raw.extend(('v18_canonical',rid,teams[t],ids[j],float(cross[j])) for j in range(200) if j!=k);raw.extend(('legacy_canonical',rid,teams[t],str(src['reference_ids'][j]),float(legacy[j])) for j in range(160))
  assert len(raw)==40*(199+160);log('background_distinctness',['gallery','id','team','reference_id','cosine'],raw)
  background[str(s)]={'passed':bool(bg_ok),'revised_photo_count':40,'v18_other_pairs':7960,'legacy_pairs':6400,'other199_max':others_max,'legacy160_max':legacy_max,'original_same_identity_min':retention_min,'reference_embedding_resolution':ss,'reference_gallery':'original v18 canonical identity_prescreen masters200 excluding own identity; original v6c/v13 canonical masters160'}
  all_passed&=bool(passed and bg_ok);results[str(s)]=result
  if not bg_ok:failures.append({'size':s,'background_gate':background[str(s)]})
 v={'passed':bool(all_passed),'revision':'v18b','identity_count':200,'variant_count':2000,'sheet_count':60,'runtime_file_count':40,'actual_decoded_webp_portrait_count':6000,'metrics':results,'background_revision_validation':background,'native_provenance':{'path':'validation/v18b_native_provenance.json','minimum_native_photo_side':prov['minimum_native_photo_side'],'all384_sources_at_least384px':True},'protocol':json.loads((OUT/'identity_prescreen/protocol.json').read_text()),'baseline_commit':'849709747d556129311dbffd677de35ad9662db4','current_embeddings':'validation/v18b_delivered_embeddings.npz','current_detections':'validation/v18b_detection_records.json','score_logs':'validation/v18b_*.csv.gz','unchanged_identity_metadata':True,'failures':failures}
 v['distinctness_policy']='canonical';v['packing_options']=options
 dump(OUT/'validation.json',v);print(json.dumps({'passed':v['passed'],'metrics':results,'background_revision_validation':background,'failures':failures},indent=2));assert all_passed,'Final compressed-pixel criteria failed; flags remain false'
 print('All final v18b numerical and pixel gates passed; handoff, previews, checksums and final flags still required.')
if __name__=='__main__':main()
