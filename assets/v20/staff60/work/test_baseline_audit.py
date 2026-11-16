import unittest
import numpy as np
from baseline_audit import evaluate
def case(baseline,new,same=.8):
 b=np.float32(baseline);ref=np.array([[1,0,0],[b,np.sqrt(1-b*b),0]],np.float32)
 y=(new-b*same)/ref[1,1];v=np.array([same,y,np.sqrt(1-same*same-y*y)],np.float32)
 return evaluate({'ids':np.array(['person__team']),'e256':v[None,:]}, {'ids':np.array(['person','other']),'e256':ref})[0]
class BaselineRules(unittest.TestCase):
 def test_existing_similarity_within_allowance(self):self.assertTrue(case(.5,.51)['passed'])
 def test_existing_similarity_exceeds_allowance(self):self.assertFalse(case(.5,.53)['passed'])
 def test_new_collision_fails_even_below_point42(self):
  r=case(.3,.41);self.assertFalse(r['passed']);self.assertEqual(r['sizes']['256']['baseline_limit_failure_count'],0);self.assertEqual(r['sizes']['256']['new_collision_count'],1)
 def test_below_collision_threshold(self):self.assertTrue(case(.3,.399)['passed'])
 def test_new_collision_threshold_is_inclusive(self):self.assertFalse(case(.3,.40)['passed'])
 def test_original_at_threshold_is_existing_similarity(self):self.assertTrue(case(.4,.419)['passed'])
 def test_same_identity_gate_not_relaxed(self):self.assertFalse(case(.3,.3,.59)['passed'])
if __name__=='__main__':unittest.main()
