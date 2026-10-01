# FormFit Image

A free, browser-only tool that resizes a photo or signature to the exact KB size and dimensions online forms ask for. Files are never uploaded.

**Status:** MVP in progress (Session 3 of 4 done). **Contributors and AIs: start with `AI_HANDOFF.md`**, then `PROJECT_PLAN.md`.

## Done
- Mobile-first page layout
- Photo/Signature mode, preset chips (20–50 KB photo, 10–20 KB signature, under 20/50/100/200 KB)
- Custom min/max KB and width/height with validation
- Crop or fit option when exact dimensions are set
- File picker (JPG/PNG/WebP, 25 MB limit, HEIC help message) with preview
- Processing engine: target KB range, exact dimensions, JPEG output, white background
- Result card with pass/fail checklist, download button and long-press hint

- Landing pages (each has the full tool): `/resize-image-to-20kb/`, `/resize-image-to-50kb/`, `/resize-image-to-100kb/`, `/signature-resize-10kb-to-20kb/`, `/ssc-photo-signature-resize/` (SSC CGL 2026, general guidance only, not yet verified)
- `/privacy/`, `404.html`, `robots.txt`, `sitemap.xml`, FAQ structured data and canonical/Open Graph tags

## Not yet built
Analytics, deployment, Search Console (S4)

## Tests
Open in a browser and check that each shows 0 failed:
- `tests/engine-test.html` (engine)
- `tests/ui-test.html` (end to end)
- `tests/pages-test.html` (all pages)

## Entry points
- `/` — home page with the tool. Default preset comes from `<body data-preset="...">`.

## Data
No database, no storage, no backend. Everything runs in the browser.

## Run locally
Open `index.html`, or serve the folder with any static server. Deploy to Cloudflare Pages: no build command, output directory `/`.

## Public URLs
None yet.
