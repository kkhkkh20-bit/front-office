# Status (overwrite each session end; keep <4 KB)

Updated: 2026-11-21. Latest merged origin/main: ada3fc9f (#327).

## Active sound-only preview (not deployed)
- Draft PR #337 https://github.com/kkhkkh20-bit/front-office/pull/337; branch codex/broadcast-motion-sound-1121 in /workspace/front-office-broadcast-motion-sound. Parent #336 c655ddba.
- USER REJECTED swing auto-return: batters pause/spin, original pose is preferred. Restore scene.mjs byte-for-byte to c655ddba. Do not reintroduce auto-return or claim the spin cause is fixed. User APPROVED sound changes; four sound-related source files remain byte-identical to829c0a69.
- Keep crowd crossfade and active/delayed cue cleanup (mute/pause/seek/speed/player/end). Engine/RNG/save/module order unchanged.
- New tests preserve original held swing pose plus explicit stance/run/bunt/seek transitions. This expectation change is user-directed, not a test workaround. Candidate failed new expectation; restored source passed450/900/1400ms and sound4/4. Build2/static and ONLY11-09b 4/4 passed after main merge. Engine bytes equal latest main.
- Native-clock3D harness PASS actual-main.log CHECK_EXIT=0: held pose, actual ended + late-cue rejection on mute/pause/seek/speed/end/player, records unchanged. Kept original3sec limit and assertions. Prior virtual/native same-page timeout diagnosed ended=true/voices0/running; internal polling cause not fully established. Test pages separated; no production audio changes.
- Current QUICK /workspace/work/broadcast-motion-sound-1121/revert-swing/quick-main.log running. Earlier QUICK runs superseded/stopped, not pass. Full/long-season/GitHub incomplete.
- Current report/preview docs/updates/2026-11-21-broadcast-motion-sound/README.md and preview.html show SOUND ONLY. Old motion captures/logs are history, not the selected design.
- Full/long-season/actual-phone sustained FPS+speaker audition unrun. Draft only; no merge/deploy before required checks and final approval. Refresh main and resolve #326->#336 dependencies first.

## Required reference workflow
- Owner requires real broadcast references: inspect continuous footage, record URL+verified timestamps, compare missing game sequences before implementing. CLAUDE.md updated. Research docs/asset-research/2026-11-21-real-broadcast/README.md currently candidate-only: video playback tool is blocked (requirements error), media/API proxy403. No footage directly watched; do not invent timestamps or implement guessed motion. Code candidates: mid-PA foul flight, catcher return throw; fielder readiness already exists.

## Parent design holds
- #336 codex/broadcast-polish-1121 HEAD c655ddba (PC92px cards, bounded pitch visibility), draft. /workspace/work/broadcast-polish-1121/quick-final.log still running. Its local STATUS has PR link only, uncommitted; do not copy unreviewed changes from other worktrees.
- #326 codex/ingame-stadium-1121 frozen HEAD 7eee4e181f71a4b96e4087788bd1e0b8a722fc4f. Draft/open. CI44870714242 rules16/16 success, browser-and-sim/final fail (trade listing paired comparison; scouting#77 49!=76). Do not bypass these failures under user's stricter safety rules.
- #326 local QUICK/full /workspace/work/stadium-design-1121/{quick,full}-after-main.log still running, CHECK_EXIT unknown. Check results before any completion claim.
- Automation_40b1e3fa36e0819188edfceac78ca192 PAUSED. Keep paused pending preview/checks; no repeat final-result notifications.
- #328 codex/mobile-training-medical-1121 REJECTED (too much prose). No merge/deploy or resumed work without new direction. Its isolated uncommitted finance label also held. Not included here.

Prior roadmap: measure daily/rollover lag -> known-failure sweep -> incremental refactor -> mobile3D FPS/memory. Do not broaden this visual/audio task into engine fixes. Fetch single origin branches; all-ref fetch slow.
