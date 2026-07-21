# ClassTrack — Landing Site

Premium, animation-rich marketing site for the ClassTrack student app.
Static (HTML/CSS/JS) — no build step, deploys anywhere.

## Structure

```
/                 → index.html (home)
/support/         → support/index.html (contact form)
/privacy/         → privacy/index.html
/terms/           → terms/index.html
/404.html         → custom not-found page
styles.css, script.js, favicon.svg
robots.txt, sitemap.xml, llms.txt   (SEO / AEO / GEO)
.nojekyll                            (serve files as-is on GitHub Pages)
```

Clean URLs (no `.html`) come from the folder-per-page layout: GitHub Pages
serves `support/index.html` at `/support/` automatically.

## Deploy to GitHub Pages

1. Create a repo and push these files to the default branch (e.g. `main`).
2. Repo → **Settings → Pages** → Source: **Deploy from a branch** →
   Branch: `main`, Folder: `/ (root)` → Save.
3. Your site goes live at `https://<user>.github.io/<repo>/` in ~1 minute.

### Custom domain (recommended — this site is configured for `classtrack.app`)
- In **Settings → Pages → Custom domain**, enter your domain and save
  (this creates a `CNAME` file).
- Point your DNS to GitHub Pages, then enable **Enforce HTTPS**.
- Hosting at the domain root keeps every absolute URL in the SEO tags correct.

## Before you go live (required)

1. **Web3Forms key** — in `support/index.html`, replace
   `YOUR_WEB3FORMS_ACCESS_KEY` with your free key from https://web3forms.com
   so the contact form delivers messages.
2. **Social image** — add `og-image.png` (1200×630) at the root; it's already
   referenced by the Open Graph / Twitter tags.
3. **Domain** — all canonical/OG/sitemap/llms URLs use `https://classtrack.app`.
   If your domain differs, find-and-replace it across the files.
4. **Truthful proof** — replace placeholder ratings (4.9 / 12,000 students) and
   testimonials with real figures before publishing.

## Local preview

```
python -m http.server 8000
# open http://localhost:8000  (clean URLs like /support/ work locally too)
```
