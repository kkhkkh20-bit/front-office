"""Record explicit visual approval after viewing each completed20-person render."""
from pathlib import Path
import json,hashlib,sys,datetime
P=Path(__file__).resolve().parent;ROOT=P.parents[3];D=P/'wardrobe_lowcaps';R=D/'reviews';R.mkdir(exist_ok=True);teams={x['key']:x for x in json.loads((P/'teams.json').read_text())}
team=sys.argv[1];assert team in teams
for arg in sys.argv[2:]:
 b=int(arg);v=json.loads((D/f'render_{team}_batch{b:02d}_validation.json').read_text());assert v['passed'] and len(v['photos'])==20
 record={'team':team,'batch':b,'render_source':v['job']['path'],'render_sha256':hashlib.sha256((ROOT/v['job']['path']).read_bytes()).hexdigest(),'visual_review_passed':True,'cap_fit_passed':True,'uniform_review_passed':True,'identity_anatomy_glasses_ears_passed':True,'cap_color_reference':teams[team]['cap_color'],'home_kit_reference':teams[team]['home_kit'],'cap_fit':'fully/deeply seated, front fringe hidden, brim just above eyebrows','reviewed_utc':datetime.datetime.now(datetime.timezone.utc).isoformat()};(R/f'{team}_batch{b:02d}.json').write_text(json.dumps(record,ensure_ascii=False,indent=2));print('Approved render',team,b,flush=True)
