# FormFit Image

A free, browser-only tool that resizes a photo or signature to the exact KB size and dimensions online forms ask for. Files are never uploaded.

**[Try FormFit Image](https://formfit-image.pages.dev/)**

**Status:** Public MVP deployed on Cloudflare Pages. Image resizing and dimensions have been checked by the developer; additional cross-device testing and optional discovery/analytics setup remain. **Contributors and AIs: start with `AI_HANDOFF.md`**, then `PROJECT_PLAN.md`.

## Done
- Mobile-first page layout
- Photo/Signature mode, preset chips (20–50 KB photo, 10–20 KB signature, under 20/50/100/200 KB)
- Custom min/max KB and width/height with validation
- Crop or fit option when exact dimensions are set
- File picker (JPG/PNG/WebP, 25 MB limit, HEIC help message) with preview
- Processing engine: target KB range, exact dimensions, JPEG output, white background
- Result card with pass/fail checklist, download button and long-press hint

- Landing pages (each has the full tool): `/resize-image-to-20kb/`, `/resize-image-to-50kb/`, `/resize-image-to-100kb/`, `/signature-resize-10kb-to-20kb/`, `/exam-photo-signature-resize/` (generic guidance; user supplies values from their official notice)
- `/privacy/`, `404.html`, `robots.txt`, `sitemap.xml`, FAQ structured data and canonical/Open Graph tags

## Not yet built
Optional analytics and Search Console setup; deployment is complete.

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
Open `index.html`, or serve the folder with any static server. Cloudflare Pages deploys the repository as static files (no framework or build required; output directory `.`).

## Public URLs

- Production: **https://formfit-image.pages.dev/**
