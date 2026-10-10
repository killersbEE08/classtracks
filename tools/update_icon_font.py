"""
Rebuilds fonts/material-symbols-rounded.woff2 — a tiny subset of the
Material Symbols Rounded icon font that contains ONLY the icons this site uses.

Why: the full icon font is ~3 MB and was the #1 reason the site was slow.
The subset is ~20 KB.

When to run: every time you use a NEW icon name (e.g. <span class="ms">new_icon</span>)
in any HTML/JS file. Otherwise the new icon will show as plain text.

    python tools/update_icon_font.py
"""
import pathlib
import re
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "fonts" / "material-symbols-rounded.woff2"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"

# <span class="ms ...">icon_name</span>  (also matches escaped quotes inside JS strings)
ICON_RE = re.compile(r'class=\\?["\'](?:[^"\']*\s)?ms(?:\s[^"\']*)?\\?["\'][^>]*>\s*([a-z0-9_]+)\s*<')
# Extra names used dynamically from JS (add here if you set icon text from code).
EXTRA = {"star"}


def collect_icons():
    names = set(EXTRA)
    for path in list(ROOT.rglob("*.html")) + list(ROOT.rglob("*.js")):
        if "node_modules" in path.parts:
            continue
        names.update(ICON_RE.findall(path.read_text(encoding="utf-8")))
    return sorted(names)


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def main():
    icons = collect_icons()
    # Axes are pinned to what styles.css uses (opsz 24, wght 500, GRAD 0); FILL stays 0..1
    # because .ms--fill switches FILL to 1. Google requires icon_names to be sorted.
    css_url = (
        "https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:"
        "opsz,wght,FILL,GRAD@24,500,0..1,0&icon_names=" + ",".join(icons) + "&display=block"
    )
    css = fetch(css_url).decode("utf-8")
    m = re.search(r"url\((https://[^)]+)\)\s*format\('woff2'\)", css)
    if not m:
        raise SystemExit("Could not find the woff2 URL in Google's response:\n" + css)
    data = fetch(m.group(1))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_bytes(data)
    print(f"{len(icons)} icons -> {OUT.relative_to(ROOT)} ({len(data) / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
