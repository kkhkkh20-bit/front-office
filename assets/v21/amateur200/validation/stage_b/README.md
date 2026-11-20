# Stage B complete runtime validation

B100,12variants,3sizes:36 official runtime atlases. A100+B100:200 identities and72 atlases. A062/A047/A038/A083/A061/A069/A093 were corrected in revision3 without changing IDs, indices, ages or levels.

Current acceptance: root `validation.json`, `manifest.json`, and this directory's `numeric_validation.json`. All same-person12-variant pairs >=0.60 and all200 hs_home representatives <0.40 against each other and legacy486 at128/256/384. The fixed raw protocol is unchanged. Exact decoded final RGB cells correspond to `raw_embeddings.npz` and `photo_measurements.json`; see `runtime_pixel_equivalence.json`. B native source photographs and crop/whole-photo integer positioning recipes are in `photo_provenance.json`. `identity_age_lock.json` freezes all200 delivery identities.

Human age review remains pending. Historical Q candidate lists,17-family individual review, master screens and uniform carriers under review/revision3 and validation/revision3 are retained as production records, not alternative runtime definitions. No prior numerical threshold was relaxed.
