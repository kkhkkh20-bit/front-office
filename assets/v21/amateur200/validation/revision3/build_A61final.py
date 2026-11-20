from reconstruct_A_native import *
H=R/'validation/history/stage_a_before_revision3';rows=json.load(open(H/'photo_provenance.json'));hs=json.load(open(W/'A_hs_revision3_cases.json'))[0]['A_sources'];family={c['person_key']+'__'+c['variant']:c for c in json.load(open(W/'cohort_r3_normalization.json')) if c.get('kind')=='A'};caps={c['variant']:c for c in json.load(open(W/'A061_cap_normalization.json'))};modes={p['photo_id']:p['mode'] for p in json.load(open(W/'A_hs_native_gradient_restoration_map.json'))};targets={('v21_amateur_A022','hs_home'),('v21_amateur_A029','hs_home'),('v21_amateur_A041','suwon_sparks')};D=W/'A61final_sheets';D.mkdir(exist_ok=True);receipts=[]
for variant in json.load(open(R/'manifest.json'))['variant_keys']:
 cs={s:Image.new('RGB',((s+16)*10,(s+16)*10),(128,128,128)) for s in [128,256,384]}
 for p in [p for p in rows if p['variant']==variant]:
  aid=p['game_id'].split('_')[-1];c=(caps[variant] if aid=='A061' else hs.get(aid)) if variant=='hs_home' else (caps[variant] if aid=='A061' else family.get(aid+'__'+variant));im=Image.open(c['normalized_path']).convert('RGB') if c else render(p,modes[p['photo_id']] if variant=='hs_home' else 0)
  if (p['game_id'],variant) in targets:
   assert c is None;f=p['whole_photo_frame'];n=f['normalized_native_edge'];t=f['added_top_canvas_background']['height_native_px'];i=p['index'];old=Image.open(H/f'retained_canvas_reference/{variant}_384.webp').convert('RGB').crop((i%10*400+8,i//10*400+8,i%10*400+392,i//10*400+392));im.paste(old.resize((n,n),Image.Resampling.BICUBIC).crop((0,0,n,t)),(0,0))
  if p['photo_id']=='c004_p08__suwon_sparks':
   aa=np.asarray(im);n=im.width;im=Image.fromarray(aa[np.clip(np.arange(n)+1,0,n-1)])
  for s,canvas in cs.items():canvas.paste(im.resize((s,s),Image.Resampling.LANCZOS),(p['index']%10*(s+16)+8,p['index']//10*(s+16)+8))
 for s,canvas in cs.items():
  d=D/str(s);d.mkdir(exist_ok=True);path=d/(variant+'.webp');encode(canvas,path,s);receipts.append({'variant':variant,'size':s,'path':str(path),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
 print('A061 cap atlas',variant,flush=True)
(W/'A61final_sheet_inputs.json').write_text(json.dumps(receipts,indent=2))
