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
│   ├── css/styles.css            # tokens, shell, homepage, experiments, mockup chrome
│   ├── css/case.css              # case study pages only
│   ├── css/article.css           # article pages only
│   ├── js/main.js                # device mockups, experiments, copy-to-clipboard, toast
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

### Homepage heading

The intro ends in a row of five 16px icons: mail, LinkedIn, Dribbble, Threads,
resume. They reuse two hooks that already existed — `data-tip` for the cursor
tooltip and `data-copy` on the mail link, which keeps its `mailto:` href so it
still reaches a mail client with JavaScript off.

Each icon is a 16px target inside a 40px one. `.social__link::after` is an
inset overlay of -12px, which is exactly half the 24px gap, so neighbouring
targets meet without overlapping and nothing moves in the layout. Icon-only
links carry an `aria-label` matching the tooltip, so the visible label is
contained in the accessible name.

The icons are Figma's exports, which crop each one to its own bounding box and
so arrive at five different viewBox sizes. One export unit happens to equal one
rendered pixel, so re-centring each in a `16 16` viewBox lines them up at a
common scale — the offsets in each `viewBox` are what does that. `#52525B` was
swapped for `currentColor` so they follow the palette: `stroke` on the four
Lucide outlines, `fill` on the Threads glyph, which is a brand mark and the one
solid shape in the row. Figma exports the outlines at 1.2; they run at 1.3
here, which sits closer to the glyph's weight at 16px.

Company names in the prose use `.emph`. Figma draws the linked one and the
unlinked one identically, so only a hover underline separates them; that keeps
a sentence from turning into a row of buttons.

### Homepage tabs

Experiment, Project and Writing share one panel behind three pills. Real tab
semantics — `role="tablist"` / `role="tab"` / `role="tabpanel"`, roving
tabindex, arrows and Home/End to move — so the set is one stop in the tab
order rather than three buttons a keyboard has to hunt through.

**Experiment is first and is the tab the page opens on**, which is what the
Figma frame shows. To lead with Project instead, swap the first two buttons in
`.tabs__list` and move the `hidden` attribute from `#panel-project` to
`#panel-experiment` — the plate and the pre-paint rules below both derive their
positions from the row, so nothing else needs touching.

The active pill is `.tabs__thumb`, a single plate that translates between the
buttons rather than a background that swaps. It is a sibling of the buttons,
not their background, which is what lets it move; it moves on `transform`, so
the row never reflows. All three pills are a fixed 100px, so the plate only
ever has to travel, never resize — the pre-paint offsets (104px, 208px) are
written out as literals for that reason. A tab of a different width would need
the width handled too.

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
per child at init, and the CSS reads it as an animation delay. The selector is
`.tabs__panel.is-entering [data-stagger] > *`, a descendant rather than a
child, because the Experiment panel puts its `[data-stagger]` on each of its
two columns so the cards count off within their own column.

The chosen tab lives in `sessionStorage`, so opening an article and coming
back does not drop the reader on Experiment again. It is session-scoped on
purpose: a tab is where you were, not a preference.

That memory needs the same pre-paint treatment as the theme, and for a
sharper reason: every article sits behind Writing, so a reader coming back
from one is always returning to a remembered Writing tab. Left to `main.js`
alone the page would paint Experiment and swap — a visible blink on the way
back from every article. The homepage `<head>` writes the remembered tab onto
`<html>` as `data-tab`, and a short block in `styles.css` renders that state
directly. The markup ships with Experiment up, so only `project` and `writing`
need stating there. Those rules are scoped `:not(.tabs-ready)`; `main.js` adds
`tabs-ready` once it has taken over, which stops them from revealing the
incoming panel early and breaking the swap animation.

With JavaScript off, a `<noscript>` block hides the pills and shows all three
panels — better an honest list than a control that does nothing. The
experiments degrade with it: the coupon still draws intact, the pills still
show their active state, and nothing else moves.

### Homepage experiments

The Experiment panel is five small interaction studies. Each one is a
`.lab-card`: two white panels floating on a 6px `--bg-subtle` tray — a stage
holding the thing you can touch, and a note under it saying what it does.

The panel is `.lab`, a two-column grid holding two `.lab__col` flex columns
rather than laying the cards out in grid rows. The cards are deliberately
unequal heights (170 / 170 / 266 on the left, 181 / 278 on the right, matching
Figma) and rows would tie each pair together, growing a gap under the shorter
one instead of letting the next card slide up. Below 720px the grid drops to
one column and the columns simply stack.

**Scaling.** The two drawings are authored at Figma's 276px width. Rather than
letting the type stay put while the frame closes in on it, `.lab-card__stage`
is a `container-type: inline-size` container and the coupon and tilt card
derive one unit from it:

```css
--u: calc(min(276px, 100cqw) / 276);
```

Every dimension inside those two is written `calc(N * var(--u))`, so below
276px the whole drawing — type, strokes, spacing, corner radii — shrinks on one
factor. It has to be declared on a child of the stage: an element is never its
own query container. At a 320px viewport they land at 234px wide and nothing
overflows.

**Confetti.** 44 pieces are spawned into the stage, not the card, so the shower
is bounded by the white panel; the stage's `overflow: hidden` is what stops
them at the bottom edge. Each piece carries its own fall distance, drift, spin,
duration and delay as custom properties and they all share one keyframe. The
fall distance is measured (`stage.clientHeight + 40`) rather than assumed,
because the stage grows once the cards stack. Cleared after 2s, and the button
locks until then. Under `prefers-reduced-motion` the layer is `display: none` —
a shower of paper has no calm version of itself.

**Randomize.** The characters do not all stop at once: five frames of pure
churn, then one slot locks per frame from the left, which is the difference
between a slot machine coming to rest and a string being replaced. The code
shape is a mask read off the design, `LLDD - LLDDLLDD`; anything that is not
`L` or `D` is a literal. `I` and `O` are left out of the letter set, since at
12px nobody can tell them from `1` and `0`. `.fn__result` has a `min-width` and
`tabular-nums` so the box cannot breathe while characters churn. The refresh
icon spins only while rolling, becomes a green tick, then steps back out after
2.6s — the tick is an answer, not a state.

**Pills.** The same travelling plate as the tabs above, in ink rather than the
accent, because these carry no page state. Unlike the tabs the three labels are
different widths, so the plate is measured from `offsetWidth`/`offsetLeft` and
`width` transitions alongside `transform`. Two things re-measure it: a
`document.fonts.ready` handler, because Geist arrives after the script does and
"Music" is eight pixels wider in Geist than in the fallback, and a
`ResizeObserver` on the row, which covers both window resizes and the moment a
hidden panel is revealed (a hidden panel measures zero, so a reader returning
on Writing would otherwise find the plate parked at the origin).

**Tilt.** Rotation is a direct readout of pointer position, capped at 11° per
axis — past about 12° the near corner reads as a fold rather than a tip. Three
things sell the depth: the rotation itself, a highlight that stays where the
pointer is while the card turns under it, and the logo pushed 40px off the
card's own plane so the same rotation carries it further than the surface
travels. While tracking, the transition drops to `90ms linear`; on leave the
class comes off first so the reset settles on the long `--ease-out` curve.
Pointer sampling is throttled through `requestAnimationFrame`. Skipped
entirely under `prefers-reduced-motion` or without a fine pointer.

The card in Figma is three blurred circles under a 30% black wash. A 100px
backdrop filter on every frame of a transform is not worth it, so the same
shape is painted as three radial gradients with the wash folded into their
stops, and the 13% grain is an inline `feTurbulence` data URI rather than a
request.

**Coupon.** The coupon is drawn twice and each copy clipped to one side of the
same ragged `clip-path` polygon. Both polygons list the same twelve boundary
vertices, so in the intact state the halves compose back into one ticket with
no seam to hide — and the tear needs no JavaScript to *exist*, only to fire.
The ragged line runs either side of 31.34%, which is where the perforation is:
the tear has to start from the dashes, not from the middle of the paper.

The clip sits on an inner `.coupon__clip` rather than on `.coupon__half`,
because `filter` is applied before `clip-path` in the rendering model and the
lifted-paper drop-shadow would otherwise be cut off by the very edge it exists
to describe. Travel is 11px and 5° at most, which keeps the rotated halves
inside the stage's 24px of side padding so nothing is clipped mid-swing. It
mends after 2s.

The paper outline is Figma's boolean path, rotated into place with
`translate(275 1) scale(0.9927536 0.984375) rotate(90)`. The scale is the
one-unit inset that keeps a centred 2px stroke fully inside the 276×128 box; a
stroke hanging over the edge would be shaved off by the clip. The barcode is
the same export rotated `translate(55 0) rotate(90)`. Both take their paint
from tokens — `stroke` and bars from `var(--text-primary)`, the paper from
`var(--coupon-paper)` — so the ticket inverts with the theme. See the dark
mode section for why the paper needs a token of its own rather than
`var(--base-white)`.

The coupon is also the one place a UA button default bit hard. It is a
`<button>`, and a button neither inherits `font-family` nor leaves
`text-align` alone: the whole ticket was set in the UA's own face, wide enough
to break `50% OFF` onto a second line, and centred rather than ranged left.
`font: inherit` and `text-align: left` fix it. `.coupon__deal` also carries
`white-space: nowrap`, because its fixed height means a second line lands on
top of the sentence below rather than pushing it down — the headline is one
line by design, so it is nailed to one line in code.

One typographic trap worth remembering: `50%` at 36px and `OFF` at 24px on one
31.2px line make a line box taller than either, because they align on the
baseline and their half-leading differs. Left alone that pushed everything
under it down three pixels, so `.coupon__deal` is held at the 32px the design
gives it and the line is allowed to sit proud of it.

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
| `--bg-subtle` | `#fafafa` |
| Heading md | Geist Medium 17 / 23.8, tracking -0.1 |
| Body lg | Geist Regular 16 / 25.6 |
| Body sm | Geist Regular 13 / 19.5 |

Geist loads from Google Fonts at weights 200, 300, 400, 500 and 700. The homepage
needs all five: 300 and 700 exist only for the coupon's `50% OFF`, and 200 for
its expiry line and the article excerpts. To drop the third-party request, put
the woff2 files in `assets/fonts/` and swap the `<link>` for an `@font-face`
block.

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
| `--bg-subtle` (experiment card tray) | `#fafafa` | `#171717` |
| `--coupon-paper` | `var(--base-white)` | `var(--bg-muted)` |
| `--border-hover` | `#d4d4d8` | `#525252` |
| `--btn-hover` | `#3f3f46` | `#d4d4d4` |
| `--doc-fill` / `--doc-stroke` | `#eff6ff` / `#3b82f6` | `#172554` / `#60a5fa` |
| `--cover-brightness` | `1` | `0.88` |

Body copy lands at 7.5:1 against the page in dark and 7.7:1 in light; headings
at 16.1:1 and 17.7:1. Dark sits a shade below light on purpose — the same
copy at matched ratios reads harsher on a dark ground than on a light one.

Three things fall out of the existing token usage rather than needing rules of
their own. Every ink chip on the site — `.cs-back`, `.skip-link`, `.toast`,
`.cursor-tip`, `.lab-btn`, `.mini-pills__thumb` — is written `background:
var(--text-primary); color: var(--base-white)`, so swapping those two tokens
turns it into a light plate with dark type. The device mockups keep their
hardcoded `#1a1a1a` bezels, and the tilt card keeps its own dark gradient for
the same reason: a lit phone screen in a dark room is what a phone looks like,
and that card is artwork, not a surface. And the article covers, drawn on
cream, are knocked back by `--cover-brightness`.

Two things need their own handling. The confetti's colours are fixed, and none
of them may be near-black or near-white, or half the shower would vanish in one
theme or the other.

And the coupon has `--coupon-paper`, the one token that is not simply the
inverse of its light value. Everywhere else the page ground and a card surface
are meant to be the same colour; the coupon is a sheet of paper laid *on* the
panel, and paper that matches the panel is just an outline floating in nothing.
On white that resolves itself, so the token is `var(--base-white)`. On ink it
does not — both would be `#111` — so dark lifts it to `var(--bg-muted)`, the
same surface the randomize result chip sits on, which makes the two inset
panels in the section read as one material. It clears the stage by only
1.08:1, which is the point: the 2px outline is what draws the shape, the fill
only has to stop the paper from vanishing.

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
- Under `prefers-reduced-motion` the experiments still answer, they just stop
  moving: the confetti layer is hidden, the randomize result jumps straight to
  its value, and the global rule at the end of `styles.css` flattens the tear
  and the pill plate to instant. The tilt is skipped outright, as it is on any
  device without a fine pointer.
- Screenshots total roughly 3 MB. Converting them to WebP would cut that by
  about 70% with no visible loss.
