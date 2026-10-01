# FormFit Image

A free, browser-only tool that resizes a photo or signature to the exact KB size and dimensions online forms ask for. Files are never uploaded.

**Status:** MVP in progress (Session 1 of about 4). See `PROJECT_PLAN.md` (full plan) and `AI_HANDOFF.md` (next task).

## Done
- Mobile-first page layout
- Photo/Signature mode, preset chips (20–50 KB photo, 10–20 KB signature, under 20/50/100/200 KB)
- Custom min/max KB and width/height with validation
- Crop or fit option when exact dimensions are set
- File picker (JPG/PNG/WebP, 25 MB limit, HEIC help message) with preview

## Not yet built
Processing engine and download (S2) · SEO pages, privacy page, sitemap (S3) · analytics and deployment (S4)

## Entry points
- `/` — home page with the tool. Default preset comes from `<body data-preset="...">`.

## Data
No database, no storage, no backend. Everything runs in the browser.

## Run locally
Open `index.html`, or serve the folder with any static server. Deploy to Cloudflare Pages: no build command, output directory `/`.

## Public URLs
None yet.
