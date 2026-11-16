"""Rerun recognition on the actual review WebPs with the recorded model hashes."""
import os
os.environ['OMP_NUM_THREADS']='1'
os.environ['OPENBLAS_NUM_THREADS']='1'
from pathlib import Path
import json,hashlib,sys
import measure_candidates_lib
ROOT=Path(__file__).resolve().parent.parent
def main():
 modelroot=Path(sys.argv[1]) if len(sys.argv)>1 else Path('/workspace')
 os.environ['V21_MODEL_ROOT']=str(modelroot)
 protocol=json.loads((ROOT/'validation/protocol.json').read_text())
 for kind in ['detector','recognizer']:
  path=modelroot/'models'/protocol[kind];assert hashlib.sha256(path.read_bytes()).hexdigest()==protocol[kind+'_sha256'],f'Model hash mismatch: {kind}'
 manifest=json.loads((ROOT/'review_manifest.json').read_text());jobs=[]
 for candidate in manifest['candidates']:
  jobs.append({'id':candidate['candidate_id'],**{s:str(ROOT/candidate['photos'][s]['path']) for s in ['128','256','384']}})
 measure_candidates_lib.run(jobs,ROOT/'validation/candidate_embeddings')
if __name__=='__main__':main()
