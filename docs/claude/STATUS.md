# Status (overwrite each session end; keep <4 KB)

Updated: 2026-11-21. Latest fetched origin/main: 83de5da9.

## Active motion/sound preview (not deployed)
- Worktree /workspace/front-office-broadcast-motion-sound; branch codex/broadcast-motion-sound-1121. Started origin/main, merged #336 frozen c655ddba locally as preview baseline. Do not modify parent PR branches.
- New scope: full swing returns to ready stance only after full clip at effective rate. Crowd reactions crossfade instead of stack. One-shots/organ and delayed cues stop on mute/pause/seek/speed/player view/natural game end. Existing impact timbre/volumes, engine/RNG/save/module order unchanged.
- Report: docs/updates/2026-11-21-broadcast-motion-sound/README.md. Actual audio A/B + WebGL pose captures.
- PASS: pre-fix failures reproduced; sound ownership4/4; actual rig 450/900/1400ms with full follow-through/run/bunt/seek regressions; existing scene unit10/10; actual WebGL + AudioContext six UI lifecycle controls (including natural end), records unchanged; real WebAudio impact PCM identical and post-stop RMS0; builds2/static. Engine hash 4d0eceb5a6bbd9f967e8fc7731f169e7c3053ea7628cf2c630247d9eb11b92ce identical.
- Independent motion review found no blocker. Sound reviewer found missing natural-end cleanup; fixed and actual end regression passed.
- QUICK /workspace/work/broadcast-motion-sound-1121/quick-final.log running. Full/long-season/actual-phone sustained FPS+speaker audition unrun. Do not call complete/pass without final CHECK_EXIT=0 and required GitHub checks.
- Draft preview only. No merge/deploy until user preview approval AND checks complete; refresh latest main and resolve parent dependencies first.

## Parent design holds
- #336 codex/broadcast-polish-1121 HEAD c655ddba (PC92px cards, bounded pitch visibility), draft. /workspace/work/broadcast-polish-1121/quick-final.log still running. Its local STATUS has PR link only, uncommitted; do not copy unreviewed changes from other worktrees.
- #326 codex/ingame-stadium-1121 frozen HEAD 7eee4e181f71a4b96e4087788bd1e0b8a722fc4f. Draft/open. CI44870714242 rules16/16 success, browser-and-sim/final fail (trade listing paired comparison; scouting#77 49!=76). Do not bypass these failures under user's stricter safety rules.
- #326 local QUICK/full /workspace/work/stadium-design-1121/{quick,full}-after-main.log still running, CHECK_EXIT unknown. Check results before any completion claim.
- Automation_40b1e3fa36e0819188edfceac78ca192 PAUSED. Keep paused pending preview/checks; no repeat final-result notifications.
- #328 codex/mobile-training-medical-1121 REJECTED (too much prose). No merge/deploy or resumed work without new direction. Its isolated uncommitted finance label also held. Not included here.

Prior roadmap: measure daily/rollover lag -> known-failure sweep -> incremental refactor -> mobile3D FPS/memory. Do not broaden this visual/audio task into engine fixes. Fetch single origin branches; all-ref fetch slow.
