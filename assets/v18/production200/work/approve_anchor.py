"""Run only after seeing the prepared anchor and confirming the user's deep cap fit."""
from pathlib import Path
import json,hashlib,sys,datetime
P=Path(__file__).resolve().parent;ROOT=P.parents[3];D=P/'wardrobe_lowcaps';A=D/'anchors'
for arg in sys.argv[1:]:
 b=int(arg);path=A/f'batch{b:02d}.png';validation=D/f'render_seoul_comets_batch{b:02d}_validation.json';v=json.loads(validation.read_text());assert v['passed'] and len(v['photos'])==20;assert path.exists()
 record={'batch':b,'team':'seoul_comets','anchor_path':str(path.relative_to(ROOT)),'anchor_sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'render_source':v['job']['path'],'render_sha256':hashlib.sha256((ROOT/v['job']['path']).read_bytes()).hexdigest(),'visual_review_passed':True,'cap_fit_passed':True,'cap_fit':'fully/deeply pulled down, front fringe hidden, brim just above eyebrows','identity_top1_passed':True,'reviewed_utc':datetime.datetime.now(datetime.timezone.utc).isoformat()};(A/f'batch{b:02d}.READY.json').write_text(json.dumps(record,indent=2))
 print('Approved deep cap anchor',b,flush=True)
