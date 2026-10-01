# FormFit Image — PROJECT_PLAN.md

> Project memory. Any AI/human session (Genspark, VS Code, Copilot, Claude, Cursor…): read `AI_HANDOFF.md` first, then this file.
> **The code is the source of truth.** Several AIs and humans edit this repo, so if this doc disagrees with the code, trust the code and fix the doc.

## 1. Product goal
Market experiment ($0 budget): a browser-only tool that resizes/compresses a photo or signature to a required **KB range** and **pixel dimensions** for online forms (exam/job/visa portals). Goal: find out if strangers use it (SEO traffic → downloads), then maybe test small ad revenue.

**Decision (Phase 0):** Proceed with a *modified* version. The difference from generic compressors is a min–max KB range, a pass/fail requirement checklist, form-oriented presets, no upload, and no fake download buttons.

## 2. Current status
- Phase: **2 — Rapid MVP build**
- Session 1: ✅ done (layout, presets, settings validation, file select + preview)
- Session 2: ✅ done (processing engine, result card, checklist, download, self-tests)
- Session 3: ✅ done (5 landing pages, privacy, 404, robots, sitemap, footer nav, SEO tags, pages test)
- Live URL: _not deployed yet_

## 3. Architecture
- Static HTML + CSS + vanilla JS. No framework, no build step, no backend, no database.
- All image processing happens client-side (Canvas → JPEG via `toBlob`). No network requests carry image data.
- Hosting: Cloudflare Pages (free, `*.pages.dev`) from GitHub. Optional staging via the Genspark Publish tab.
- Domain: none for now. Buy one only after a "promising" signal (needed for AdSense).

```
index.html          home page + tool (body[data-preset] selects default preset)
resize-image-to-20kb/ | resize-image-to-50kb/ | resize-image-to-100kb/ | signature-resize-10kb-to-20kb/ | ssc-photo-signature-resize/
                    landing pages: copies of the tool markup with ../ paths, their own preset, title/meta/H1/guide/FAQ
privacy/index.html  privacy policy (no tool)
404.html            uses root-absolute /css/ paths (served at any depth)
robots.txt, sitemap.xml   domain placeholder https://formfit-image.pages.dev
css/style.css       mobile-first styles
js/presets.js       window.FF_PRESETS (generic presets only)
js/engine.js        processing + result rendering; defines FF_engine.fitImage and FF_process
js/ui.js            UI: presets, validation, file select, preview; exposes FF_STATE, FF_getSettings
tests/engine-test.html   engine self-test (open in a browser → "SUMMARY: N passed, 0 failed")
tests/ui-test.html       end-to-end test: loads index.html in an iframe, injects a photo, logs UI_RESULT
tests/pages-test.html    every page: preset, SEO tags, footer, full process run, static pages
```
Script load order in HTML: `presets.js` → `engine.js` → `ui.js`.

**Interfaces (keep these stable; if you change them, update this section):**
- `window.FF_PRESETS[key] = { label, mode|null, minKb|null, maxKb, width?, height? }`
- `<body data-preset="KEY">` picks the default preset. An unknown key (such as `custom`) leaves the fields empty and asks the user for Max KB.
- **Every tool page duplicates the tool markup.** If you change the tool HTML or IDs, change all 6 pages (index + 5 folders). `tests/pages-test.html` catches mismatches.
- `window.FF_getSettings()` → `{ mode:'photo'|'signature', minKb|null, maxKb, width|null, height|null, fit:'crop'|'pad' }`
- `window.FF_STATE` → `{ file, previewUrl, imgWidth, imgHeight }`
- `window.FF_engine.fitImage(file, settings)` → Promise of `{ blob, width, height, quality, padded, status:'ok'|'max-miss', ms }`. Pure, no DOM output.
- `window.FF_process(state, settings)` → runs fitImage and renders into `#result-section`
- `window.FF_track(name, data)` → optional analytics hook (S4). The engine already calls it if it exists.

**Engine algorithm:**
1. Decode the file (`createImageBitmap`, falling back to `<img>`).
2. Work out the target size: exact W×H, one side with the aspect ratio kept, or free (longest side ≤ 4000).
3. Render on a white background, using crop (centred cover) or pad (contain), with step-down halving.
4. Binary-search JPEG quality (0.05–1.0, 8 steps) for the largest result ≤ max.
5. With free dimensions, if the result needs quality < 0.5 or doesn't fit, shrink and retry (up to 12 rounds).
6. If the result is below min, pad with blank JPEG COM segments (pixels unchanged; the user is told).
7. With fixed dimensions where max can't be reached → `status:'max-miss'`, and the UI shows an honest message.

## 4. MVP scope
1. JPG/PNG/WebP input (camera or gallery) ✅
2. Photo / Signature mode + preset chips ✅
3. Custom min KB, max KB, width, height ✅ (UI + validation)
4. Crop-to-fill / fit-with-white-border option (shown only when both W and H are set) ✅ UI
5. Engine: quality search, shrink when needed, min-KB padding ✅
6. Result card: preview, bytes/KB, dimensions, pass/fail checklist, honest failure message ✅
7. Download (`photo_21kb.jpg`) + long-press hint + Change settings / New image ✅
8. Error handling: file type, HEIC, >25 MB, corrupt files, decode/memory errors during processing ✅ (polish in S3)
9. Privacy note ✅ / privacy page ✅
10. SEO landing pages, robots, sitemap ✅ S3
11. Analytics (GoatCounter) + deploy ⏳ S4

**KB rule:** max is checked as `maxKb × 1000` bytes; min is checked as `minKb × 1024` bytes. This satisfies portals that use either definition.

## 5. Completed tasks
| Session | Date | Outcome |
|---|---|---|
| 1 | 2026-10-01 | Project setup, layout, presets, settings validation, file picker + preview, docs |
| 2 | 2026-10-01 | `js/engine.js` (fit/encode/pad/render result), result CSS, `tests/` self-tests. Engine test 9/9 pass; UI end-to-end pass; mobile screenshot OK |
| 3 | 2026-10-01 | 5 landing pages, privacy, 404, robots, sitemap, footer nav, FAQ + JSON-LD + canonical/OG on all pages. Pages test 15/15; UI end-to-end pass; SSC mobile screenshot OK |

## 6. Current task
**Next: Session 4 — analytics, no-upload check, Android test, deploy, Search Console** (see `AI_HANDOFF.md` → Next task).

## 7. Known bugs / limitations
- The checked state of the segmented radios relies on CSS `:has()` (Chrome 105+, Safari 15.4+). Older browsers still work but show no highlight. Fix only if analytics show old browsers.
- HEIC is rejected with a help message (by design for the MVP).
- Min-KB padding adds blank metadata bytes. Valid JPEG and the picture is unchanged, but a very strict portal could in theory inspect it. Watch for user complaints.
- Free-dimension photos are shrunk (for example 3000×4000 → about 960×1280 for 50 KB) to stay sharp. That's intended.
- Processing runs on the main thread: about 1–3 s for 12 MP photos on desktop, possibly slower on low-end Android. Move to a Web Worker only if data shows a problem.
- Not yet tested on a real Android device or in WhatsApp/Telegram in-app browsers (S4).
- Fixed W×H crop is always centred; there's no manual positioning (deferred).
- The SSC page names **SSC CGL 2026** but is **not verified**. It has no numbers, only a link to ssc.gov.in (home page, not the exact notice PDF) and "Last verified: not yet verified". To verify: open the official CGL 2026 notice, add its values and the exact PDF URL, and set the date. Until then it's general guidance only.
- `404.html` uses `/css/style.css`, which shows unstyled in the Genspark preview but works on Cloudflare Pages (served from the site root).
- `https://formfit-image.pages.dev` is a placeholder in canonical, OG, robots and sitemap on all pages. Search and replace it once the real URL is known (S4).
- Tool markup is duplicated in 6 pages (no build step). Accepted for the MVP; revisit if the page count grows.

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
| SSC landing page stays planned (decided 2026-10-01) | See the SSC rules below |
| SSC page built as unverified general guidance for CGL 2026 (S3) | The notice wasn't verified in-session, so no numbers are shown, per the SSC rules |
| Landing pages are full HTML copies, not JS-injected | Static HTML is best for SEO and needs no build step |
| Min KB reached by JPEG COM padding, not by worsening the image | Keeps the picture sharp; honest message shown to the user |
| Free dims: shrink rather than go below q=0.5 | Blurry photos get rejected by verifiers; most forms don't need large pixel sizes |

### SSC / exam page rules (mandatory)
- Never claim one universal "SSC" spec. Requirements differ by exam and year (for example, CGL 2026 uses a live photo and a 10–20 KB signature of about 4 cm × 2 cm, while other notices use different signature dimensions).
- Each exam page must name the exact exam and year (for example, "SSC CGL 2026"), link the official notice on ssc.gov.in, and show a "Last verified: YYYY-MM-DD" date.
- If the notice can't be verified, use general guidance ("enter the values from your notice") with no specific numbers.
- Exam presets are added to `js/presets.js` only after verification, with a `source` URL and `verified` date in a comment.
