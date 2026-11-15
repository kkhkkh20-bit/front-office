"""Correct visible contact-sheet edge contamination using integer whole-frame crops."""
from pathlib import Path
from PIL import Image,ImageDraw
import json,numpy as np
P=Path(__file__).resolve().parent
def main():
 flags=json.loads((P/'top_edge_diagnostic.json').read_text());preview=Image.new('RGB',(1206,852),'white');draw=ImageDraw.Draw(preview);changes=[]
 for i,x in enumerate(flags):
  parent=Image.open(x['original_generation_path']).convert('RGB');box=x['crop_xyxy'];original=parent.crop(box);a=np.array(original,dtype=float);edge=np.concatenate([a[:20,:24],a[:20,-24:]],axis=1);base=edge[15:20].mean(axis=0)
  shift=next(k for k in range(1,13) if np.abs(edge[k]-base).mean()<8);newbox=[box[0],box[1]+shift,box[2],box[3]+shift];row=round(box[1]/(parent.height/3));assert newbox[3]<=parent.height and newbox[3]<=round((row+1)*parent.height/3)+8
  clean=parent.crop(newbox);assert clean.width==clean.height>=384;folder=P/'native_edge_fixes';folder.mkdir(exist_ok=True);dst=folder/f"{x['team']}_{x['id']}.png";clean.save(dst)
  job={'id':x['id'],'team':x['team'],'kind':'hires','path':str(dst.resolve()),'whole_native_photo':True,'source_grid_side':1,'generation_origin':{'source_render':x['original_generation_path'],'source_render_sha256':x['original_generation_sha256'],'crop_xyxy':newbox},'reason':'Remove a visible residual previous-photo strip by translating the complete square crop downward; preserve native pixels and human proportions.','integer_top_shift':shift};(P/'single_repairs'/f"{x['team']}_{x['id']}_edgeframe.json").write_text(json.dumps(job,indent=2));changes.append({**x,'new_crop_xyxy':newbox,'integer_top_shift':shift})
  for r,im in enumerate([original,clean]):preview.paste(im,(i*402,r*426));draw.text((i*402+5,r*426+405),f"{x['id']} {'before' if r==0 else 'clean whole frame'}",fill='black')
 preview.save(P/'native_edge_fixes/before_after.jpg',quality=95);(P/'native_edge_fixes/plan.json').write_text(json.dumps(changes,indent=2));print('Whole-frame boundary corrections:',[(x['id'],x['integer_top_shift']) for x in changes],flush=True)
if __name__=='__main__':main()
