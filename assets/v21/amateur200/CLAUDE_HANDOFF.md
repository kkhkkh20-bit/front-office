# v21b complete: A100 + B100 (revision3)

Delivery branch: `assets/v21-review`. Assets only; no main merge or game-code changes.

## Runtime

`manifest.json`: schema `v21-amateur-1`, 200 identities, 2400 photos, `sheets_ready:["A","B"]`, `production_complete:true`, `asset_validation_passed:true`, `human_age_review:"pending"`.

72 RGB lossy WebP sheets: `assets/v21/amateur200/sheets/{A|B}/{128|256|384}/{variant}.webp`. Variants in fixed manifest order: hs_home, univ, seoul_comets, seoul_hounds, incheon_seagulls, suwon_sparks, goyang_storm, daejeon_redfox, gwangju_blazes, daegu_thunders, busan_waves, changwon_anchors. No hs_away runtime.

Local cell index = global index %100; col=local%10, row=floor(local/10). `rect=[col*(size+16)+8,row*(size+16)+8,size,size]`; eight-pixel padding around every tile. Use manifest paths/rects directly.

A IDs, indices, ages and levels remain exactly as first A delivery. A062, A047, A038, A083, A061, A069 and A093 have their corrected revision3 photos in all12 variants; all other A runtime bytes remain at the validated revision3 state. B001–B100 are now first delivered as official runtime identities (global indices100–199); full identity-age lock is in `validation/stage_b/identity_age_lock.json`.

## B review feedback

Q071, Q042, Q047, Q064, Q074, Q067 and Q075 were excluded, including same-seed aliases. Q054/Q055 now have plain high-school jerseys. Q083 has dark hair. Q001/Q024/Q033 use the reviewed larger natural head framing near the A median. Candidate8 (B008) has hs_home gray-background brightness matched to the remaining family. Full B master selection, original trials and repair provenance remain under review/revision3 and validation/revision3.

## Validation and review

Each100 has60 high-school and40 university identities; A11/B12 wear glasses (23/200, about10%). Actual final decoded128/256/384 photos were measured with the fixed raw ArcFace protocol. Every same-person pair among12 variants is >=0.60; all200 hs_home representatives are <0.40 against each other and legacy486. Full results and nearest pairs are in `validation.json`; raw vectors, exact decoded RGB SHA256, face centers, original native provenance and encoding receipts are under `validation/stage_a` and `validation/stage_b`. All final7200 decoded photo cells have corresponding raw measurement proof.

The original native images remain unchanged. Delivered photos use square crops, integer whole-photo positioning and reduction only; native edges are >=384. No face warps or upsampling.

Human age review remains pending. Review `previews/age_review_A_256.png` and `previews/age_review_B_256.png`; the owner can identify age-appearance replacements by stable A/B label. `previews/all200_hs_home_256.png`, random10 comparisons and all-family B comparison books are also included. Historical screening/partial statuses under validation/history and review are not current runtime status.

Source code, index.html and build tools were not changed. Game integration belongs to Claude.
