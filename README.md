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

### Homepage tabs

Projects and writing share one panel behind two pills. Real tab semantics —
`role="tablist"` / `role="tab"` / `role="tabpanel"`, roving tabindex, arrows
and Home/End to move — so the pair is one stop in the tab order rather than
two buttons a keyboard has to hunt through.

The active pill is `.tabs__thumb`, a single plate that translates between the
buttons rather than a background that swaps. It is a sibling of the buttons,
not their background, which is what lets it move; it moves on `transform`, so
the row never reflows. Both pills are a fixed 100px, so the plate only ever
has to travel, never resize. A third tab of a different width would need the
width handled too.

The plate is lit by three layers, each on its own cycle.

The **base gradient** sweeps across the pill every 6s, swelling brightness 6%
and saturation 8% at the top of the pass; `background-size: 240%` gives the
light 112px of travel, more than the pill is wide, so it moves between the gold
end of the gradient and the lime end rather than shimmering in place.
`.tabs__thumb::before` carries **two soft blooms**, one amber and one cream,
wandering opposite diagonals every 8.5s — they widen the colour, because amber
deepens whatever it crosses and cream lifts it, so the eye reads a range wider
than the two gradient stops actually contain. One animation drives both:
`background-position` takes a value per layer, so a single timeline can send
them different ways. `.tabs__thumb::after` adds a **sheen that turns** rather
than travels, 19s per revolution, `linear`.

The periods matter as much as the layers. 6, 8.5 and 19 share no useful
factors, so the arrangement does not repeat for about half an hour. 17s was the
first choice for the sheen and was wrong: exactly twice 8.5, the two would have
realigned every 17 seconds, which is the repeat the third layer exists to break.

**Only the sheen animates geometry, and only because it cannot show an edge.**
That layer is 140px square inside a 100x40 pill with `overflow: hidden`, past
the 108px diagonal it must cover at every angle, so no edge of it is ever on
screen to re-antialias. An earlier version wobbled the pill itself — uneven
`border-radius`, a little float and scale — and read as stuttering rather than
living: `border-radius` cannot be composited, and at that size a 2% scale lands
the edges on sub-pixel boundaries that shimmer. Small crisp boxes animate well
by paint and badly by shape.

Another trap: CSS applies the timing function between each *pair* of keyframes,
not across the loop, so a cycle with stops at 33% and 66% decelerates to a halt
three times over. Keep ambient loops to two or three keyframes, and keep
rotation `linear`.

The label holds 4.64:1 at its worst moment, the amber bloom at full strength
over the gold end of the base. The sheen cannot make that worse — every one of
its stops is lighter than the base, never darker. Deepening the amber past 0.5
alpha is what would eat into it. The theme switch shares the gradient but stays
still, on purpose: one ambient loop on a page is alive, three on one 100x40
control is the most it will carry.

The panels are very different heights, so nothing animates height. The
outgoing panel fades in 110ms, the swap happens while it is transparent, and
the incoming panel's children rise in sequence — `[data-stagger]` gets a `--i`
per child at init, and the CSS reads it as an animation delay.

The chosen tab lives in `sessionStorage`, so opening an article and coming
back does not drop the reader on Project again. It is session-scoped on
purpose: a tab is where you were, not a preference.

That memory needs the same pre-paint treatment as the theme, and for a
sharper reason: every article sits behind Writing, so a reader coming back
from one is always returning to a remembered Writing tab. Left to `main.js`
alone the page would paint Project and swap — a visible blink on the way back
from every article. The homepage `<head>` writes the remembered tab onto
`<html>` as `data-tab`, and a short block in `styles.css` renders that state
directly. Those rules are scoped `:not(.tabs-ready)`; `main.js` adds
`tabs-ready` once it has taken over, which stops them from revealing the
incoming panel early and breaking the swap animation.

With JavaScript off, a `<noscript>` block hides the pills and shows both
panels — better an honest list than a control that does nothing.

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
"Read another article" section. It loads `main.js` only for the theme switch;
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
second time, so it would still be wearing the theme it had before the reader
switched on another page. Every link on the site is an ordinary link, but the
browser's own back button still takes that path and no markup can opt out of
it — so `main.js` re-reads the stored choice on `pageshow` as well.

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
