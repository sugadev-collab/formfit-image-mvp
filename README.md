# FormFit Image

A free, browser-only tool that resizes a photo or signature to the exact KB size and dimensions online forms ask for. Files are never uploaded.

**Status:** MVP in progress (Session 2 of about 4 done). **Contributors and AIs: start with `AI_HANDOFF.md`**, then `PROJECT_PLAN.md`.

## Done
- Mobile-first page layout
- Photo/Signature mode, preset chips (20–50 KB photo, 10–20 KB signature, under 20/50/100/200 KB)
- Custom min/max KB and width/height with validation
- Crop or fit option when exact dimensions are set
- File picker (JPG/PNG/WebP, 25 MB limit, HEIC help message) with preview
- Processing engine: target KB range, exact dimensions, JPEG output, white background
- Result card with pass/fail checklist, download button and long-press hint

## Not yet built
SEO pages, privacy page, sitemap (S3) · analytics and deployment (S4)

## Tests
Open `tests/engine-test.html` (engine) or `tests/ui-test.html` (end to end) in a browser and read the page or console output.

## Entry points
- `/` — home page with the tool. Default preset comes from `<body data-preset="...">`.

## Data
No database, no storage, no backend. Everything runs in the browser.

## Run locally
Open `index.html`, or serve the folder with any static server. Deploy to Cloudflare Pages: no build command, output directory `/`.

## Public URLs
None yet.
