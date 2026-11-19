from pathlib import Path
from PIL import Image,ImageDraw
import json,hashlib,datetime,random,shutil
W=Path('/dev/shm/v23-work');R=W/'repo/assets/v23/expansion_kits';R.mkdir(parents=True,exist_ok=True)
people=json.load(open(W/'people.json'));reg=json.load(open(W/'generated_registry.json'));jobs={x['batch']:x for x in json.load(open(W/'jobs.json'))};cache={};teams={'expansion_a':{'primary':'#0B5D3B','secondary':'#C9A227','cap_color':'#0B5D3B','design_spec':'White home jersey, forest-green raglan sleeves, gold piping, small green five-point chest star. Forest-green cap with matching five-point star, gold for visibility. Coaches retain original garment construction in green/gold.'},'expansion_b':{'primary':'#4B2A7B','secondary':'#A7A9AC','cap_color':'#4B2A7B','design_spec':'White home jersey, purple shoulder blocks, fine silver pinstripes, purple shield-outline chest emblem. Purple cap with small silver shield outline. Coaches retain original garment construction in purple/silver.'}}
for b,variants in reg.items():
 for t,p in variants.items():
  g=4 if b=='b00' else jobs[b]['grid'];im=Image.open(p).convert('RGB');cache[b,t]=im.resize((g*256,g*256),Image.Resampling.LANCZOS)
  f=R/'checkpoints/rendered_batches'/b/(t+'.png');f.parent.mkdir(parents=True,exist_ok=True)
  if not f.exists():shutil.copyfile(p,f)
overrides=json.load(open(W/'overrides.json')) if (W/'overrides.json').exists() else {}
def photo(c,t):
 o=overrides.get(c['id'],{}).get(t)
 if o:
  im=Image.open(o['path']).convert('RGB');g=o['grid'];im=im.resize((g*256,g*256),Image.Resampling.LANCZOS);j=o['slot'];return im.crop((j%g*256,j//g*256,j%g*256+256,j//g*256+256))
 im=cache.get((c['batch'],t))
 if im is None:return None
 g=4 if c['batch']=='b00' else jobs[c['batch']]['grid'];x=c['slot']%g*256;y=c['slot']//g*256;return im.crop((x,y,x+256,y+256))
sets=[];sheets=[];runtime=[];check_jobs=[]
for name in ['v6c','v13','v18A','v18B','staff']:
 ps=[c for c in people if c['sheet']==name];sd={'key':name,'source_manifest':ps[0]['source_manifest'],'count':len(ps),'sheets':{},'ready_counts':{}}
 for t in teams:
  ready=sum(photo(c,t)is not None for c in ps);sd['ready_counts'][t]=ready
  if ready!=len(ps):continue
  sd['sheets'][t]={}
  for n in [128,256]:
   pitch=n+16;atlas=Image.new('RGB',(10*pitch,10*pitch));
   for c in ps:
    i=c['index']%100;atlas.paste(photo(c,t).resize((n,n),Image.Resampling.LANCZOS),(i%10*pitch+8,i//10*pitch+8))
   rel=f'sheets/{name}/{n}/{t}.webp';f=R/rel;f.parent.mkdir(parents=True,exist_ok=True);q=80
   while True:
    atlas.save(f,format='WEBP',quality=q,method=6,exact=True)
    if n!=256 or f.stat().st_size<=600000 or q<=60:break
    q-=2
   s={'path':rel,'size':list(atlas.size),'cell_size':n,'pitch':pitch,'padding':8,'mode':'RGB','quality':q,'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()};sd['sheets'][t][str(n)]=s;sheets.append(s);runtime.append(rel)
   for c in ps:
    i=c['index']%100;check_jobs.append({'id':c['id'],'team':t,'resolution':n,'path':str(f),'rect':[i%10*pitch+8,i//10*pitch+8,n,n]})
  preview=Image.new('RGB',(2560,((len(ps)+9)//10)*256))
  for j,c in enumerate(ps):preview.paste(photo(c,t),(j%10*256,j//10*256))
  f=R/f'previews/{name}_{t}_all256.jpg';f.parent.mkdir(parents=True,exist_ok=True);preview.save(f,quality=90,subsampling=0)
 sets.append(sd)
identities=[]
for c in people:
 rec={k:c[k] for k in ['id','set','sheet','source_manifest']};rec['index']=c['index']%100;rec['source_reference']={'native_resolution':c['source_native'],'sheets':c['source_sheets'],'pixel_sha256':c['source_photo_sha256']};rec['variants']={}
 for t in teams:
  v={'generated':photo(c,t)is not None,'sheets':{},'batch':c['batch'],'batch_slot':c['slot']};i=c['index']%100
  for n in [128,256]:
   rel=f"sheets/{c['sheet']}/{n}/{t}.webp"
   if rel in runtime:v['sheets'][str(n)]={'path':rel,'rect':[i%10*(n+16)+8,i//10*(n+16)+8,n,n]}
  rec['variants'][t]=v
 identities.append(rec)
count=sum(v['generated'] for c in identities for v in c['variants'].values());m={'schema_version':'v23-expansion-kits-1','path_base':'assets/v23/expansion_kits/','delivery_branch':'assets/v23-review','request':'docs/asset-requests/2026-11-19-codex-v23-expansion-kits.md','source_commit':'8466bbe','teams':[{'key':k,**v} for k,v in teams.items()],'sets':sets,'identities':identities,'identity_count':420,'variant_count':840,'rendered_variants':count,'sheet_count':len(sheets),'grid':{'columns':10,'rows':10,'padding':8,'pitch':{'128':144,'256':272}},'runtime_files':runtime,'asset_validation_passed':False,'production_complete':False,'review_status':'production_in_progress','rendering_method':'Wardrobe-only image_gen reference edits of original portraits. Whole atlas resampling/cell packing only; no face replacement, face warp, face/body paste or facial enhancement.','source_notes':['v13 original manifest names 256 files absent from source Git tree. Available original 128 RGB cells used for identity reference and unchanged framing. Runtime output sizes are 128 and 256; do not describe original reference as native256.'],'generated_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat()}
(R/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n');(W/'final_jobs.json').write_text(json.dumps(check_jobs))
(R/'checkpoints/progress.json').write_text(json.dumps({'rendered_variants':count,'requested_variants':840,'runtime_sheet_count':len(sheets),'production_complete':False,'pending_visual_repairs':[],'completed_visual_repairs':[{'batch':'b02','slot':3,'id':'v6c100_023','teams':list(teams),'repair_original':'/workspace/generated_images/exec-5de3d72b-4025-4fcb-b58e-4dd274014522.png'}]},indent=2)+'\n')
(R/'CLAUDE_HANDOFF.md').write_text(f'# v23 expansion kits — 제작 중, 게임 연결 금지\n\n요청 420명 × 2구단 = 840장 중 {count}장 렌더. 완성 묶음 시트 {len(sheets)}/20장. 아직 최종 검수를 마치지 않았습니다. `production_complete=false`, `asset_validation_passed=false`입니다.\n\n선수 유니폼 2종과 코치 원형을 유지한 색상 변형을 제작합니다. 최종 rect는 `[col*(n+16)+8,row*(n+16)+8,n,n]`, 10×10, 128=1440² / 256=2720² RGB WebP입니다.\n\nv13 원본256 파일이 소스 Git에 없으므로 실제128을 기준으로 삼았습니다. 원본 해상도를 허위 표기하지 않습니다. 코드·기존 에셋 수정 없음. main 병합 금지. 최종 납품 시 이 문서를 검수 결과와 함께 갱신합니다.\n')
print('PACKED',count,'/840 variants',len(sheets),'/20 runtime sheets',flush=True)
