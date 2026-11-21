# Status (overwrite each session end; keep short)

Updated: 2026-11-21. This worktree only: codex/management-ui-reference-1121, base main ada3fc9f. No merge/deploy approval for this batch. Owner wants comparison first and no added prose.

## Management UI reference batch
- Official OOTP/Mogul written docs checked; no direct gameplay claim.
- UI only: ngtClose label becomes Close; PC calendar labels hidden completed games; PC medical reuses common practical-recovery rows. Engine byte-identical to base main; no RNG/save/rules changes.
- Report and actual screenshots: docs/updates/2026-11-21-management-ui-reference/README.md and preview.html.
- Passed: before/after reproduction, medical 6/6, actual PC/mobile UI, existing calendar and contract UI regression, both builds, static, independent source review.
- Migration 11-09b passed 4/4 (CHECK_EXIT=0); QUICK running; do not claim success without final CHECK_EXIT=0. Full/independent long-season test unrun. GitHub checks required before approval.
- Do not commit tools/node_modules symlink. Do not skip/weaken tests or merge known failures under old guide exceptions; owner safety rules prevail.

## Separate branches on hold (do not mix)
- #326 codex/ingame-stadium-1121 frozen approved HEAD 7eee4e181f71a4b96e4087788bd1e0b8a722fc4f. Draft; CI browser-and-sim failed, local QUICK/full not confirmed. Automation paused; no bypass/merge.
- #336 codex/broadcast-polish-1121 c655ddbaa1fea91335a0b503eee2ffbe0b07ac87: compact broadcast cards / bounded pitch projection; draft, checks pending, no deploy.
- #337 codex/broadcast-motion-sound-1121 611dd3b4f3e4f609b2dc2f58feb3e721ff68b199: sound only, draft. Swing auto-return rejected and fully reverted; preserve old batting pose. QUICK/GitHub pending. Do not reintroduce motion without actual continuous broadcast reference.
- #328 broad mobile/training UI rejected by owner as too much text. No merge/deploy/reuse.

Owner final approval required before merge/deploy. Do not send others messages or merge unrelated work.
