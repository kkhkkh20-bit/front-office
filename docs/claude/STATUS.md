# Status (overwrite each session end; keep short)

UI preview (2026-11-21): draft #328 `codex/mobile-training-medical-1121`, main base `83de5da9`. User asked to apply first group and compare BEFORE deployment: do not merge/deploy until preview approval. Stadium #326 auto-merge automation `Automation_40b1e3fa36e0819188edfceac78ca192` PAUSED for this new gate; its frozen approved HEAD remains `7eee4e18`. Home/inbox/finance added to training/medical/funding UI. Preview: `docs/updates/2026-11-21-ui-comparison/comparison.html` (24 real shots, 12 same-save pairs; before 83de5da9, code 5ca108f5). Engine byte-identical. Renderer tests 10/10, home DOM 4 widths incl row bounds/future tasks, first-season flow, comparison state parity and gallery pass. Other training/medical/staff regressions recorded in prior report. Latest QUICK: `/workspace/work/ui-comparison-1121/quick.log`, RUNNING, not passed. Prior QUICKs superseded. Full check, independent multi-year sim and devices unrun. Keep draft; after approval merge #326 first, refresh main/retest #328. No force merge or known-failure bypass.

Updated: 2026-11-21. Live: 082c544 (#300). All of #299-#314 merged.

## Open PRs
- #315 trade allowed when over-limit team shrinks (cafe 마스터쉐프) and #316 (this STATUS) — owner approved merge once rules 16/16 + only known browser fails. If still open in a new session: check CI, merge, verify release.json commit.
- Next session starts roadmap step 2 (lag stage 2).

## Known flaky/browser failures (not blockers)
trade listing "same-player normal/listed/urgent"; scouting #73/#77; cafe-1119 button height; check-match3d/in-game; FA nameFont; check-feedback-operations-20261110; check-contract-input 120≠123; calendar "Space로 중단" (reduced motion, intermittent); budget-chip (budget room unchanged after coach hire); trade-filters-small0b; community-rules 30≠80 (once).

## Roadmap (owner-agreed order: lag → errors → refactor → 3D)
1. Lag stage 1 (trade center / listings / inbox render) DONE (#313).
2. Lag stage 2: measure + cut time of daily sim (day advance) and season rollover (offseason processing). Measure first (node, engine.js), report numbers before/after.
3. Error sweep: fix the known-flaky list above. Real bugs → fix; world-random tests → fixed seed / setup fix. Never weaken tests. Includes budget-chip, trade-filters-small0b.
4. Refactor (incremental): stop committing index.html (62 MB, causes PR conflicts) → build at deploy time; then split large files gradually.
5. 3D check: mobile broadcast FPS + memory.

## Pending cafe replies (all deployed, owner posts)
쌉싸코 scout mail · 리아네트 budget + offer keep · 23152152 pick no. · 야구왕 military · 댄싱고구마 names · 마스터쉐프 recent stats (+ trade once #315 live) · FC서울 overseas-return military (#312) · 담배값만 rating drop: sim shows no drop, need save file.

## Notes
- `git fetch origin` (all refs) is very slow; fetch single branches by name.
