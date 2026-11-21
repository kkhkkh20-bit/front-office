# In-game event photographs

Three fictional documentary scenes for the existing theme-day, collaboration-uniform and supporters-registration actions. They extend the existing event photographs without changing event rules, costs, scheduling or outcomes.

- Runtime: three individual RGB WebP files, 1280 × 720, quality 84; 298,194 bytes combined.
- Generated originals remain outside the repository. Source filenames and runtime SHA-256 digests are recorded in `manifest.json`.
- No captions, real team marks, licensed characters or real sponsor brands are baked into the images. Titles and costs remain live HTML.
- The existing scene loader hides scene slots when standalone assets are unavailable. The downloadable single-file game continues to use that fallback.
- Site packaging explicitly copies these files. They are lazy-loaded at their in-game locations and are not embedded into the initial HTML.

Validation: `node tools/check-event-art-1121.cjs`; actual desktop/mobile evidence is collected with the stadium design review.
