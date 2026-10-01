# AI_HANDOFF.md — quick start for any AI session

**Read order:** this file → `PROJECT_PLAN.md` → only the files you need to touch.

## Rules (credit-efficient)
- One objective per session. Finish it or split it.
- Inspect before editing. Make small targeted edits. Never rewrite working files.
- No frameworks, no backend, no paid services. Image data must never leave the browser.
- Mobile-first: test at 390px width.
- At the end of a session, update the **Session log** below and sections 2, 5, 6, 7 of `PROJECT_PLAN.md`.

## Current state
- Session 1 done: UI shell works (presets, validation, file picker, preview).
- Missing: processing engine, result/download, SEO pages, privacy page, analytics, deploy.

## Next task — Session 2: processing engine
Create `js/engine.js` (load it in `index.html` **before** `js/ui.js`) that defines `window.FF_process(state, settings)`:
1. Decode `state.file` (`createImageBitmap`, falling back to `<img>`). Pre-downscale so the longest side is ≤ 4000 px.
2. Target dimensions: if W and H are both set, use `crop` (cover, centred) or `pad` (contain on white). If only one is set, keep the aspect ratio.
3. Always paint a white background (handles PNG transparency) → `canvas.toBlob('image/jpeg', q)`.
4. Binary-search q (0.05–0.95, about 8 steps) for the largest size ≤ maxKb×1000 bytes.
5. If still too big at q=0.05 and dimensions are not fixed, scale down by 0.85× and repeat.
6. If below minKb×1024 at q=0.95 and dimensions are not fixed, upscale (≤ 2×) and repeat. Otherwise report "minimum not reachable".
7. Render into `#result-section`: preview, KB + bytes, W×H, a checklist (✅/❌ size, dims, JPG), a Download link (`download="photo_48kb.jpg"`), a "long-press the image to save" hint, and a "Process again" button.
8. Show a spinner and disable the button while working; use try/catch with a friendly error.
**Done when:** test images land in 20–50 KB and 10–20 KB at 200×230 and 140×60, on desktop and in a mobile screenshot.

## Upcoming sessions
- S3: error polish, 5 landing pages (copy index with a different `data-preset`, title/meta/H1/FAQ), `privacy/`, `404.html`, `robots.txt`, `sitemap.xml`.
- S4: GoatCounter events, no-upload check, mobile pass, deploy to Cloudflare Pages, Search Console. **Then STOP building and start validating.**

## Session log
| # | Date | Changed | Tests | Bugs / notes |
|---|---|---|---|---|
| 1 | 2026-10-01 | index.html, css/style.css, js/presets.js, js/ui.js, docs | Console check + desktop/mobile screenshots | `:has()` highlight needs a modern browser |
