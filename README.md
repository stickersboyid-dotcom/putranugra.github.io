# putranugra.com

Personal site of Nugraha Putra, Product Designer. Plain HTML, CSS, and JavaScript. No build step, no dependencies.

## Structure

```
.
├── index.html                    # homepage
├── CNAME                         # custom domain for GitHub Pages
├── .nojekyll                     # serve files as-is, skip Jekyll
├── favicon.png
├── assets/
│   ├── css/styles.css            # tokens, shell, homepage, mockup chrome
│   ├── css/case.css              # case study pages only
│   ├── css/article.css           # article pages only
│   ├── js/main.js                # device mockups, copy-to-clipboard, toast
│   ├── docs/
│   │   └── nugraha-eka-putra-resume.pdf
│   └── img/
│       ├── article/<article-slug>.webp, <article-slug>-og.jpg
│       ├── dashboard/step-1..4.png, pos-1..2.png
│       ├── hangry/splash|searching|outlet-list|home.png
│       └── loyalty/landing-page.png
├── writings/
│   └── <article-slug>/index.html
└── _reference/                   # local only, git-ignored
    └── mockup.html               # earlier draft the device mockups came from
```

### Case study pages

Each case study is a folder at the root with its own `index.html`, so the URL is
`putranugra.com/<slug>` with no `.html` extension:

```
internal-ops-dashboard/index.html
loyalty-page/index.html
hangry-app/index.html
```

All three are built, so every homepage link resolves.

A case study page loads `styles.css` then `case.css`, and reuses the laptop and
slide chrome from the homepage. Its mockups are markup-driven: put `data-mock="deck"`
on the figure with `data-dwell` (ms per slide) and `data-clicks` (`slide:x,y` ratios)
and `main.js` runs it. The other two mockup types are `data-mock="scroller"`
(pan a tall screenshot inside a phone) and `data-mock="tour"` (a deck whose
last screen scrolls before looping). Add `data-hover-freeze` only where hovering must hold the
mockup still, as the homepage boxes do.

`.cs-back` links to `../` (or `../../`) so it works with JavaScript off, but
when `document.referrer` shows the reader actually came from the homepage,
`main.js` intercepts the click and calls `history.back()` instead. That lets
the browser restore the scroll position, so someone who opened the last item
in a list lands back on it rather than at the top of the page. Arriving from
anywhere else — a search result, another article — falls through to the plain
link, because stepping back would not lead home.

Other markup hooks `main.js` looks for, all optional per page:
`[data-scroll-sync]` + `data-stops` with `[data-step]` siblings drives the
scroll-synced phone; `.cs-bar` elements animate their fill in on scroll with a 2.5s safety net; `[data-tip]` on any element shows the floating cursor
tooltip, which needs a `[data-cursor-tip]` div in the page.

Keep case study folder names distinct from `assets/` so nothing collides.

### Article pages

Writings live one level deeper, at `putranugra.com/writings/<slug>`:

```
writings/what-ai-taught-me-about-my-own-thinking/index.html      2 min
writings/the-week-i-worked-in-a-restaurant-kitchen/index.html    1 min
writings/the-newest-person-with-the-loudest-question/index.html  1 min
writings/the-insight-that-changed-how-i-see-problems/index.html  1 min
```

Listed newest first. All four are built, and nothing on the site links out to
Substack any more.

The slug matches the cover image filename in `assets/img/article/`. An article
page loads `styles.css`, then `case.css` for the back button (`.cs-back`) and
title block (`.cs-head`), then `article.css` for the cover frame and prose
rhythm. It reuses the homepage writings list (`.posts`) verbatim for the
"Read another article" section. It loads `main.js` only for the back button;
every other feature in that file no-ops when its markup is absent.

Covers are drawn 2:1 and sit in an `aspect-ratio: 2 / 1` frame; a 16:9 image
still fits, cropped the way Figma crops it.

Each cover ships twice. `<slug>.webp` is what the page loads — 1400px wide,
quality 82, roughly 2x the 700px column. `<slug>-og.jpg` is 1200px wide and
exists only for `og:image`, because not every social crawler renders WebP. The
source PNGs from Figma stay out of the repo; re-export and re-encode from Figma
rather than upscaling what is committed here.

Reading times are hardcoded, computed as words ÷ 200, rounded up. The
"Read another article" list is hardcoded too — it holds the three newest
articles other than the current one, so **adding an article means editing the
list on the existing article pages as well.**

## Design tokens

Mirrored 1:1 from the Figma variables, defined at the top of `assets/css/styles.css`:

| Token | Value |
| --- | --- |
| `--text-primary` | `#18181b` |
| `--text-secondary` | `#52525b` |
| `--border-default` | `#e4e4e7` |
| `--base-white` | `#ffffff` |
| Heading md | Geist Medium 17 / 23.8, tracking -0.1 |
| Body lg | Geist Regular 16 / 25.6 |
| Body sm | Geist Regular 13 / 19.5 |

Geist loads from Google Fonts. To drop the third-party request, put the woff2
files in `assets/fonts/` and swap the `<link>` for an `@font-face` block.

### Dark mode

The light palette is Tailwind's zinc ramp, which carries a slight blue cast.
That cast is invisible on white and turns clinical on ink, so dark drops to a
neutral grey rather than mirroring zinc. The page sits at `#111111`, not
near-black: the headroom is what separates a background that reads as unlit
from one that reads as a hole in the screen.

| Token | Light | Dark |
| --- | --- | --- |
| `--base-white` (page + cards) | `#ffffff` | `#111111` |
| `--text-primary` | `#18181b` | `#ededed` |
| `--text-secondary` (body copy) | `#52525b` | `#a3a3a3` |
| `--border-default` | `#e4e4e7` | `#262626` |
| `--border-strong` | `#d1d1d6` | `#404040` |
| `--bg-muted` | `#f4f4f5` | `#1a1a1a` |
| `--border-hover` | `#d4d4d8` | `#525252` |
| `--btn-hover` | `#3f3f46` | `#d4d4d4` |
| `--doc-fill` / `--doc-stroke` | `#eff6ff` / `#3b82f6` | `#172554` / `#60a5fa` |
| `--cover-brightness` | `1` | `0.88` |

Body copy lands at 7.5:1 against the page in dark and 7.7:1 in light; headings
at 16.1:1 and 17.7:1. Dark sits a shade below light on purpose — the same
copy at matched ratios reads harsher on a dark ground than on a light one.

Three things fall out of the existing token usage rather than needing rules of
their own. Every ink chip on the site — `.cs-back`, `.skip-link`, `.toast`,
`.cursor-tip` — is written `background: var(--text-primary); color:
var(--base-white)`, so swapping those two tokens turns it into a light plate
with dark type. The device mockups keep their hardcoded `#1a1a1a` bezels,
because a lit phone screen in a dark room is what a phone looks like. And the
article covers, drawn on cream, are knocked back by `--cover-brightness`.

Resolution order: a stored choice in `localStorage` wins, otherwise
`prefers-color-scheme` decides. That is why the dark values appear twice in
`styles.css` — once under the media query guarded by
`:root:not([data-theme="light"])`, once under `:root[data-theme="dark"]`. With
JavaScript off the media query still works; only the switch stops.

**Every page needs the guard script in its `<head>`**, before the first paint,
or a reader with dark stored will see a white flash on every navigation:

```html
<script>try{var t=localStorage.getItem('theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}</script>
```

The switch itself is a `<button role="switch">` in `.footer__row`, wired by
`main.js`, with the yellow gradient of the favicon as its on state.

The guard is not enough on its own. A page restored from the back/forward
cache comes back as the DOM the reader left, and nothing in `<head>` runs a
second time — so `main.js` also re-reads the stored choice on `pageshow`.
Without that, the homepage is the one page that goes stale, because
`.cs-back` is the one link that navigates through history: switch the theme
on a case study, click back, and the homepage returns wearing the theme it
had before. The two features have to know about each other.

## Deploying to GitHub Pages

1. Create the repo and push everything except `_reference/`.
2. Settings → Pages → Source: **Deploy from a branch**, branch `main`, folder `/ (root)`.
3. `CNAME` already sets the custom domain. At the DNS provider, point
   `putranugra.com` at the GitHub Pages apex IPs and add a `CNAME` record for
   `www` pointing to `<username>.github.io`.
4. Wait for the certificate, then enable **Enforce HTTPS**.

## Notes

- The mockup animations run on hover on pointer devices and on scroll-into-view
  on touch devices, and are disabled entirely under `prefers-reduced-motion`.
- Screenshots total roughly 3 MB. Converting them to WebP would cut that by
  about 70% with no visible loss.
