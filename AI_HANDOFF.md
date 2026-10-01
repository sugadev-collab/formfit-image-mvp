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
- [ ] Run `tests/engine-test.html`, plus `tests/ui-test.html` and `tests/pages-test.html` if you touched HTML or UI. Each must show 0 failed.
- [ ] Update PROJECT_PLAN §2, §5, §6, §7 (plus §3 if interfaces changed)
- [ ] Add a row to the session log below

## Current state (after Session 3)
The tool works end to end on 6 pages (home + 5 landing pages), plus privacy, 404, robots and sitemap.
**Heads-up:** the tool markup is copied into all 6 tool pages. Edit them together.
Missing: analytics, deployment, Search Console. The SSC page is unverified (general guidance only).

## Next task — Session 4: analytics + deploy (last MVP session)
1. **Analytics:** create `js/analytics.js` with GoatCounter (free, no cookies). Define `window.FF_track(name, data)` that calls `goatcounter.count({ path: 'event-' + name, title: name, event: true })`. Load it on all 6 tool pages, before `engine.js`.
   - The engine already fires `process_success`, `process_error` and `download_click`.
   - Add `file_selected` and `preset_used` in `ui.js` (one line each).
   - Never send file names or image data.
2. **No-upload check:** process a file with the network inspector open. Only GoatCounter pings are allowed, with no image payload.
3. **Deploy:** the user creates the GitHub repo and connects it to Cloudflare Pages (no build command, output `/`).
   - Then replace `https://formfit-image.pages.dev` in all HTML, robots and sitemap if the real URL differs.
4. **Production checks:** every URL loads, 404 works, robots and sitemap are reachable, and the download works on a real Android phone in Chrome and in the WhatsApp in-app browser.
5. **Search Console:** add a verification meta tag to `index.html`, submit `sitemap.xml`. Optionally do the same in Bing Webmaster Tools.
6. **Optional, only if the user verifies it:** fill in the SSC CGL 2026 values plus the exact notice URL and date on the SSC page.

**Done when:** the live URL works on Android, events show in GoatCounter, and the sitemap is submitted. **Then STOP building. Phase 4 validation starts.**

## Session log
| # | Date | Tool/AI | Changed | Tests | Notes |
|---|---|---|---|---|---|
| 1 | 2026-10-01 | Genspark | index.html, css/style.css, js/presets.js, js/ui.js, docs | console check + mobile screenshot | `:has()` highlight needs a modern browser |
| 2 | 2026-10-01 | Genspark | +js/engine.js, +tests/*, index.html (script tag), css (result styles), ui.js (hide old result on new file) | engine 9/9 pass; UI end-to-end pass (21.5 KB, 200×230); mobile screenshot OK | not yet tested on a real Android device |
| 3 | 2026-10-01 | Genspark | +5 landing folders, +privacy/, +404.html, +robots.txt, +sitemap.xml, +tests/pages-test.*; index.html (SEO tags, FAQ, footer nav); css (FAQ, spec box, footer); ui.js (unknown preset → validate) | pages 15/15; UI end-to-end pass; SSC mobile screenshot OK | SSC page unverified; domain is a placeholder |
