# AI_HANDOFF.md — start here (for any AI or human)

This repo is edited by several AIs and tools (Genspark, VS Code + various models, humans).
**The code is the source of truth.** Docs may be stale, so check the actual files before acting.

## Read order
1. This file
2. `PROJECT_PLAN.md`: goals, architecture, **interfaces**, decisions, SSC rules
3. Only the files your task touches

## Session start checklist
- [ ] Look at the file list, and at `git log` / `git diff` if you have it, to see what changed since the last session log entry
- [ ] Open `tests/engine-test.html` in a browser. Expect `SUMMARY: N passed, 0 failed`.
- [ ] Pick ONE task (the "Next task" below) and finish it, or split it

## Rules
- Static site: HTML + CSS + vanilla JS. **No frameworks, no build step, no backend, no paid services.**
- **Image data must never leave the browser** (no fetch/XHR with file contents).
- Mobile-first: check at a 390px width. Inputs at least 16px font, tap targets at least 44px.
- Make small targeted edits. Don't rewrite working files or rename the IDs and globals listed in PROJECT_PLAN §3.
- No `<script>`, `</script>` or `<!--` text inside inline JS. Prefer external `js/*.js` files.
- No exam-specific numbers without an official source and a verified date (PROJECT_PLAN §12).
- Don't add features outside the MVP before launch; put them in the PROJECT_PLAN §9 backlog instead.

## Session end checklist
- [ ] Run `tests/engine-test.html` (and `tests/ui-test.html` if you touched the UI)
- [ ] Update PROJECT_PLAN §2, §5, §6, §7 (plus §3 if interfaces changed)
- [ ] Add a row to the session log below

## Current state (after Session 2)
Tool works end to end: choose a preset or custom values → pick an image → process → checklist → download.
Missing: SEO landing pages, privacy page, 404, robots/sitemap, analytics, deployment.

## Next task — Session 3: SEO + static pages
1. Create landing pages as folders with `index.html`: `resize-image-to-20kb/`, `resize-image-to-50kb/`, `resize-image-to-100kb/`, `signature-resize-10kb-to-20kb/`.
   - Copy the root `index.html` and change: `<body data-preset>` (`under-20`, `under-50`, `under-100`, `sig-10-20`), title, meta description, H1, and the guide/FAQ text (150–300 words, unique per page).
   - Use `../` relative paths for css/js, or switch to root-absolute `/css/...` paths (fine on Cloudflare Pages, but then the preview needs a server).
   - Add canonical, Open Graph tags and FAQPage JSON-LD (inside `<script type="application/ld+json">`).
2. `ssc-photo-signature-resize/`: follow the **SSC rules** in PROJECT_PLAN §12. Name the specific exam, link the official notice, include a last-verified date, otherwise general guidance only.
3. `privacy/index.html`: no uploads, no cookies; mention the analytics planned for S4.
4. `404.html`, `robots.txt`, `sitemap.xml` (domain placeholder `https://formfit-image.pages.dev`, updated after deploy).
5. Add a small footer nav linking the pages.

**Done when:** every page loads without console errors, the tool works on each page with the correct preset, and a mobile screenshot passes.

## Later
- S4: GoatCounter via `window.FF_track` (the engine already calls it), a network check that no image is uploaded, a real Android test, Cloudflare Pages deploy, Search Console + sitemap. **Then STOP building and start validating.**

## Session log
| # | Date | Tool/AI | Changed | Tests | Notes |
|---|---|---|---|---|---|
| 1 | 2026-10-01 | Genspark | index.html, css/style.css, js/presets.js, js/ui.js, docs | console check + mobile screenshot | `:has()` highlight needs a modern browser |
| 2 | 2026-10-01 | Genspark | +js/engine.js, +tests/*, index.html (script tag), css (result styles), ui.js (hide old result on new file) | engine 9/9 pass; UI end-to-end pass (21.5 KB, 200×230); mobile screenshot OK | not yet tested on a real Android device |
