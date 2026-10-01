# FormFit Image — PROJECT_PLAN.md

> Project memory. Any AI/human session: read this file + `AI_HANDOFF.md` first.

## 1. Product goal
Market experiment ($0 budget): a browser-only tool that resizes/compresses a photo or signature to a required **KB range** and **pixel dimensions** for online forms (exam/job/visa portals). Goal: find out if strangers use it (SEO traffic → downloads), then maybe test small ad revenue.

**Decision (Phase 0):** Proceed with a *modified* version. The difference from generic compressors is a min–max KB range, a pass/fail requirement checklist, form-oriented presets, no upload, and no fake download buttons.

## 2. Current status
- Phase: **2 — Rapid MVP build**
- Session 1: ✅ done (layout, presets, settings validation, file select + preview)
- Live URL: _not deployed yet_

## 3. Architecture
- Static HTML + CSS + vanilla JS. No framework, no build step, no backend, no database.
- All image processing happens client-side (Canvas → JPEG via `toBlob`). No network requests carry image data.
- Hosting: Cloudflare Pages (free, `*.pages.dev`) from GitHub. Optional staging via the Genspark Publish tab.
- Domain: none for now. Buy one only after a "promising" signal (needed for AdSense).

```
index.html          home page + tool (body[data-preset] selects default preset)
css/style.css       mobile-first styles
js/presets.js       window.FF_PRESETS (generic presets only)
js/ui.js            UI: presets, validation, file select, preview; exposes FF_STATE, FF_getSettings
js/engine.js        (Session 2) defines window.FF_process(state, settings)
```

**Engine contract (for Session 2):**
`window.FF_process(state, settings)`
- `state = { file, previewUrl, imgWidth, imgHeight }`
- `settings = { mode, minKb|null, maxKb, width|null, height|null, fit: 'crop'|'pad' }`
- Renders into `#result-section` (currently a placeholder message when the engine is missing).

## 4. MVP scope
1. JPG/PNG/WebP input (camera or gallery) ✅
2. Photo / Signature mode + preset chips ✅
3. Custom min KB, max KB, width, height ✅ (UI + validation)
4. Crop-to-fill / fit-with-white-border option (shown only when both W and H are set) ✅ UI
5. Engine: pre-downscale large input, binary-search JPEG quality, shrink dims if needed, raise quality/upscale for min KB ⏳ S2
6. Result card: preview, bytes/KB, dimensions, pass/fail checklist, honest failure message ⏳ S2
7. Download (`photo_48kb.jpg`) + long-press fallback for in-app browsers ⏳ S2
8. Error handling (type, HEIC, >25 MB, corrupt) ✅ partial; processing errors ⏳ S2/S3
9. Privacy note ✅ / privacy page ⏳ S3
10. SEO landing pages, robots, sitemap ⏳ S3
11. Analytics (GoatCounter) + deploy ⏳ S4

**KB rule:** max is checked as `maxKb × 1000` bytes; min is checked as `minKb × 1024` bytes. This satisfies portals that use either definition.

## 5. Completed tasks
| Session | Date | Outcome |
|---|---|---|
| 1 | 2026-10-01 | Project setup, layout, presets, settings validation, file picker + preview, docs |

## 6. Current task
**Next: Session 2 — processing engine** (see `AI_HANDOFF.md` → Next task).

## 7. Known bugs / limitations
- The checked state of the segmented radios relies on CSS `:has()` (Chrome 105+, Safari 15.4+). Older browsers still work but show no highlight. Fix only if analytics show old browsers.
- HEIC is rejected with a help message (by design for the MVP).
- `#process-btn` shows a placeholder until `js/engine.js` exists.

## 8. Validation metrics (Phase 4, after launch)
Events: `file_selected`, `preset_used`, `process_success` (met / min-miss / max-miss), `process_error` (reason), `download_click`, `fallback_shown`.
Funnel: views → file_selected → process_success → download_click.
SEO: Search Console impressions, clicks, CTR, queries, indexed pages.
- **Weak:** flat or near-zero impressions after 8–12 weeks, or most users who select a file don't download.
- **Promising:** impressions rising week over week on long-tail or exam queries, some clicks, most file selections lead to a download.
- **Strong:** growing clicks across several pages, new related queries appearing (exam / PDF / DPI).

## 9. Feature backlog (evidence-gated)
Template: Feature / User problem / Evidence / Search demand / Traffic benefit / Retention benefit / Difficulty / Dev time / Infra cost / Privacy risk / Priority / Reason

| Feature | Trigger evidence | Priority now |
|---|---|---|
| Drag-to-position crop | Heavy crop usage or repeated processing | Low |
| Signature whitening | Signature page traffic | Low |
| Exam preset pages | Exam queries in Search Console | Low |
| DPI metadata | "dpi" queries | Low |
| HEIC input | HEIC failure events | Low |
| Batch processing | Multiple files per session | Low |
| PDF compress to KB | Related queries or high traffic | Low |
| Web Worker processing | Mobile slowness or crashes | Low |
| Hindi UI | Language signals | Low |

## 10. Long-term roadmap
MVP → post-launch fixes (from data only) → evidence-driven improvements → advanced free features → optional monetization (domain → AdSense → ads below the result only, never between file pick and download, never ads that look like download buttons).

## 11. Deployment
- Target: Cloudflare Pages → connect the GitHub repo, framework preset "None", build command empty, output dir `/`.
- After deploy: Search Console (meta-tag verification), submit `sitemap.xml`, Bing Webmaster Tools.

## 12. Decisions & reasons
| Decision | Reason |
|---|---|
| No framework / no Tailwind CDN | Speed on slow mobile, zero build, low credit cost |
| JPEG-only output | What almost all form portals accept; keeps the engine simple |
| Min KB as ×1024, max as ×1000 | Works for both KB definitions |
| No ads at launch | Measure real usage first; AdSense needs a domain anyway |
| Generic presets only (no exam values yet) | Exam specs change; values must be verified against official notices |
| SSC landing page pending | Verify specs before Session 3, or swap for another exam |
