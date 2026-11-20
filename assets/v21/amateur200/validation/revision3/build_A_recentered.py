from reconstruct_A_native import *
import shutil
allrows=json.load(open(R/'validation/stage_a/photo_provenance.json'));origcases=json.load(open(W/'A_hs_revision3_cases.json'));case=origcases[0];sources=case['A_sources'];modes={p['photo_id']:p['mode'] for p in json.load(open(W/'A_hs_native_gradient_restoration_map.json'))};family={c['person_key']+'__'+c['variant']:c for c in json.load(open(W/'cohort_r3_normalization.json')) if c.get('kind')=='A'};target={('v21_amateur_A022','hs_home'),('v21_amateur_A029','hs_home'),('v21_amateur_A041','suwon_sparks')};D=W/'A_revision3_recentered_sheets';D.mkdir(exist_ok=True);receipt=[]
for variant in ['hs_home','suwon_sparks']:
 cs={s:Image.new('RGB',((s+16)*10,(s+16)*10),(128,128,128)) for s in [128,256,384]}
 for p in [p for p in allrows if p['variant']==variant]:
  aid=p['game_id'].split('_')[-1];c=(sources.get(aid) if variant=='hs_home' else family.get(aid+'__'+variant));im=Image.open(c['normalized_path']).convert('RGB') if c else render(p,modes[p['photo_id']] if variant=='hs_home' else 0)
  if (p['game_id'],variant) in target:
   assert c is None;f=p['whole_photo_frame'];n=f['normalized_native_edge'];t=f['added_top_canvas_background']['height_native_px'];i=p['index'];old=Image.open(R/f'sheets/A/384/{variant}.webp').convert('RGB').crop((i%10*400+8,i//10*400+8,i%10*400+392,i//10*400+392));bg=old.resize((n,n),Image.Resampling.BICUBIC).crop((0,0,n,t));im.paste(bg,(0,0));receipt.append({'photo_id':p['photo_id'],'restoration':'restore only previously artificial top canvas from existing384px background; retained native photograph including face, hair, cap and body untouched','canvas_top_native_px':t,'photograph_upscale':False,'face_warp':False})
  if p['photo_id']=='c004_p08__suwon_sparks':
   import numpy as np
   m=next(q for q in json.load(open(W/'A_restored_measurements.json'))['records'] if q['id']==p['photo_id']);anchor=np.array([130.98235626,118.22048492]);deltas=[np.mean(m['details'][str(ss)]['landmarks'],axis=0)*256/ss-anchor for ss in [128,256,384]];delta=np.rint(np.median(deltas,axis=0)*im.width/256).astype(int);arr=np.asarray(im);nn=im.width;im=Image.fromarray(arr[np.clip(np.arange(nn)+delta[1],0,nn-1)[:,None],np.clip(np.arange(nn)+delta[0],0,nn-1)[None,:]]);receipt.append({'photo_id':p['photo_id'],'whole_photo_native_integer_translation':delta.tolist(),'criterion':'deterministic median landmark-center residual across128/256/384, no recognition-score search','photograph_upscale':False,'face_warp':False})
  for s,canvas in cs.items():canvas.paste(im.resize((s,s),Image.Resampling.LANCZOS),(p['index']%10*(s+16)+8,p['index']//10*(s+16)+8))
 for s,canvas in cs.items():
  folder=D/str(s);folder.mkdir(exist_ok=True);path=folder/(variant+'.webp');encode(canvas,path,s);print(variant,s,flush=True)
(W/'A_revision3_recenter_restoration_receipt.json').write_text(json.dumps(receipt,indent=2))
