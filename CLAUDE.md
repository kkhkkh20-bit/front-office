# Front Office (프런트야구) — agent guide

Korean KBO GM web game. Players are Korean; answers to the owner in Korean (fact-based, concise). Files only agents read (this file, memos, agent prompts, code comments meant for agents) stay in English to save tokens.

Current state / open PRs / pending replies: `docs/claude/STATUS.md` (read it first, overwrite it at session end, keep < 4 KB).

## Build & check
- Build: `bash build.sh && bash build.sh --engine-out dist/engine.js`. `index.html` is a committed build artifact: rebuild after any `src/` change.
- Site for browser checks: `node -e "require('./tools/build-site.cjs').buildSite({root:process.cwd()})"`.
- Static: `node tools/check-static.js`. Rules: `ONLY="<name part>" node tools/check-logic.js` (full run is slow; CI runs 16 shards).
- New rule tests go INSIDE the template string, right before "`);\ntry{ env(T); }". Helpers: `fresh()`, `ok(cond,msg)`.
- Browser checks: `CHROMIUM_EXECUTABLE_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`; in a worktree symlink `tools/node_modules`.

## Game rules (never break)
- User team and AI follow the same rules (parity).
- Never add/remove main RNG `R()` calls; use `withRng(rngHash(...))` for new randomness.
- New-game world must stay identical to main: gate new behavior off during `buildWorld` if it touches pre-season sims.
- Old-save migrations: idempotent, RNG-free. `ONLY="11-09b"` must pass.
- Never weaken tests. Fix scenario setup, or update a world-dependent baseline with an old→new comment.
- UI: PC has no page scroll; 390px has no horizontal overflow.

## Git / deploy
- Branch per change, draft PR, CI = 16 `rules` shards + `browser-and-sim` (~70 min). No force-push/rebase; bring main in with `git merge origin/main`.
- Merge only when rules 16/16 pass and browser failures are known ones (see STATUS). Set draft→ready before merge.
- Deploy = merge to main; verify `https://fronttime.kkhkkh-20.workers.dev/release.json` `"commit"`.
- No model IDs in commits/PRs/code. Never commit secrets; never change/hardcode the CUP_ADMIN secret.
- Ladder/transfer responses never expose account ids, tokens, device ids, emails or IPs.

## Token discipline
- Do small fixes directly; use a subagent only for long independent work, give one complete brief, avoid repeated resume/interim reports.
- CI logs: download, then grep `FAIL |AssertionError|Error:` and section headers `== `; never read whole logs.
- Read files by range/grep, not whole large files (`src/` files have very long lines).
