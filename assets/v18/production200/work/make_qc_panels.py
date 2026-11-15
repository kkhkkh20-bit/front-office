from pathlib import Path
import json
from PIL import Image, ImageDraw

P = Path(__file__).resolve().parent
ROOT = P.parents[3]
D = P / 'wardrobe_lowcaps'
Q = D / 'qc_panels'
Q.mkdir(exist_ok=True)
pending = []
for f in sorted(D.glob('render_*_validation.json')):
    v = json.loads(f.read_text())
    job = v['job']
    review = D / 'reviews' / (Path(job['path']).stem + '.json')
    if v['passed'] and not review.exists():
        pending.append(job)

index = []
for b in range((len(pending) + 3) // 4):
    jobs = pending[b * 4:(b + 1) * 4]
    canvas = Image.new('RGB', (1600, 2028), 'white')
    draw = ImageDraw.Draw(canvas)
    for i, job in enumerate(jobs):
        left, top = (i % 2) * 800, (i // 2) * 1014
        draw.text((left + 6, top + 1), f"{job['team']} batch{job['batch']:02d}", fill='black')
        photo = Image.open(ROOT / job['path']).convert('RGB')
        photo.thumbnail((800, 1000))
        canvas.paste(photo, (left, top + 14))
    out = Q / f'panel{b:02d}.jpg'
    canvas.save(out, quality=90)
    index.append({'panel': b, 'path': str(out.resolve()), 'jobs': jobs})
(Q / 'index.json').write_text(json.dumps(index, indent=2))
print(json.dumps([{'panel': x['panel'], 'jobs': [(j['team'], j['batch']) for j in x['jobs']]} for x in index], indent=2))
