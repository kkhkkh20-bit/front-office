# Status (overwrite each session end; keep <4 KB)

Updated: 2026-11-21. Current origin/main: 83de5da9.

## Active broadcast preview
- Worktree /workspace/front-office-broadcast-polish, branch codex/broadcast-polish-1121.
- Started latest main, locally included frozen stadium PR #326 HEAD 7eee4e18 as preview baseline. Never modify that frozen branch for this work. Merge #326 first, then refresh this branch against main before any proposed final merge.
- Changes: desktop pointer/fine 3D cards 264->92px (128 with alerts), existing full details on hover/keyboard; bounded projected pitch-ball sizing only. Engine bytes unchanged; no RNG/save/camera/flight-path changes.
- Preview/report: docs/updates/2026-11-21-broadcast-polish/README.md and preview.html.
- PASS: pre-fix failures reproduced, new HUD/ball/WebGL pitch tests; existing scene unit 10/10; cast info 626 PA; 3D state/continuity/memory; portrait/landscape 20 scenes; paused/playing late face-sheet refresh. Coordinates/camera identical in 16 before/after samples.
- QUICK running: /workspace/work/broadcast-polish-1121/quick-final.log. Do not claim pass without CHECK_EXIT=0. Full suite/long season not run for this new branch; actual-phone sustained FPS/heat untested.
- User requested predeploy comparison. Draft only; NO MERGE/DEPLOY until new preview approval AND required checks completed. Keep automation paused.

## Other design holds
- #326 codex/ingame-stadium-1121, frozen HEAD 7eee4e181f71a4b96e4087788bd1e0b8a722fc4f. Still draft/open. CI run 44870714242: rules 16/16 success, browser-and-sim and final check failure (trade listing paired comparison, scouting #77 49!=76). Do not bypass failures under this user's stricter safety rules.
- #326 local QUICK/full still running: /workspace/work/stadium-design-1121/{quick,full}-after-main.log, final CHECK_EXIT unknown. Read final result before any completion claim.
- Automation_40b1e3fa36e0819188edfceac78ca192 PAUSED. No repeat final-result notifications.
- #328 codex/mobile-training-medical-1121 REJECTED by user (too much prose). No merge/deploy, no further design work without new direction. Uncommitted finance label in its isolated worktree also held. Do not carry its files here.

## Known baseline failures / prior roadmap
Trade listing same-player normal/listed/urgent; scouting #73/#77; cafe-1119 button height; check-match3d/in-game; FA nameFont; operations-20261110; contract-input 120!=123; calendar Space stop; budget-chip; trade-filters-small0b; community-rules 30!=80. These are not permission to waive this user's required checks.
Prior roadmap: measure daily/rollover lag -> error sweep -> incremental refactor -> mobile 3D FPS/memory. Do not broaden this visual task into those engine changes. Fetch single origin branches; all-ref fetch is slow.
