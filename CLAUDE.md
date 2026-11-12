# CLAUDE.md

A small static site for the Isamu Noguchi Foundation & Garden Museum (GDES 3240 final project). Plain HTML, CSS and JavaScript: no framework, no build step, no package manager.

## Files

- `index.html`: all page content. Also holds the inline SVG `<symbol id="ar">` arrow that each `<use href="#ar">` points to. Keep it inline so the arrows still work when the page is opened from `file://`.
- `assets/css/styles.css`: every style. Desktop rules come first, then one `@media(max-width:760px)` block for mobile, then the reduced-motion and utility rules.
- `works.html` + `assets/js/works.js`: the All Works page (filter menus, chips, search, slot-based image grid). It has its own script because `main.js` expects home-page elements. Its nav starts at the top with the title visible (`nav.top.stuck`).
- `assets/js/main.js`: scroll effects, sticky-nav title, parallax, reveal animations and the exhibition gallery.
- `assets/images/`: JPGs with descriptive kebab-case names.
- `assets/fonts/`: Valley Sans Light (300) and Regular (400) as local TTFs. Inter Tight, IBM Plex Mono and Source Serif 4 load from Google Fonts, so they need a network connection.

## Preview

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000. Check every change at desktop width and at 760px or narrower.

## Design system

- **12-column grid**: `.g` sets up `repeat(12,1fr)` with `--m` as the side margin and `--g` as the gutter. Both are in `vw` and change at the mobile breakpoint. The nav, `.info` and the footer repeat the same grid.
- **Type roles**: `--sans` (Valley Sans) for headings and body, `--serif` (Source Serif 4, often italic) for the quote, captions and exhibition values, `--mono` (IBM Plex Mono, uppercase) for the nav, labels, CTAs and buttons.
- **Color**: white page, `--bg:#1f1f1f` for the dark blocks (h1, hero panel, footer), `--line:#aaa896` for the animated rule lines.
- **Sizing**: almost everything is in `vw`, with `max(Npx, …)` minimums on small text. Stick with that approach rather than switching to fixed px.
- **Line CTAs**: `.lines` elements contain `.row` divs that draw in once `.in` is added. Each row needs a `row-index-N` class, which sets `--i` for the stagger. `--d` adds a base delay.

## Coupled values (change these together)

- **Breakpoint**: CSS uses `max-width:760px`. `main.js` hard-codes 760 in `measureExhibition()` (`<= 760`) and in `par()` (`< 760`). Note the two JS checks don't agree exactly.
- **Margin and gutter**: `measureExhibition()` repeats `--m` and `--g` as fractions (`.029`/`.015` on desktop, `.05`/`.03` on mobile). If you change the CSS variables, update these too.
- **Exhibition count**: the `#trk .it` images, the `EX` array in `main.js` (`[title, location, year]` per image, in the same order) and the `#ex` height `calc(100svh + 3*75svh)` all depend on the number of exhibitions. The `3` is the image count minus 1.
- **Gallery classes**: the one-letter classes `.w .a .s .f .m .t .p2 .por` set grid placement in CSS and are also listed in the parallax table `pi` in `main.js`. Renaming one means updating both.
- **Nav order**: nav links are positioned with `nth-child`. The `.nt` title is child 3 and only appears once `#sent` scrolls past.
- **Footer signature**: `sg()` measures the font with a canvas to tuck `.sign` against the footer. It assumes the text is "ISAMU NOGUCHI" in Valley Sans 300.
- **h1 offset**: `margin-left:-.093em` corrects for the side bearing of the "I" in Valley Sans. Leave it alone unless the font or text changes.
- **Works grid**: `DESKTOP_TEMPLATE`/`MOBILE_TEMPLATE` in `works.js` list slots as [columns, P/L]. Each work fills the next open slot matching its orientation; the `.s2`–`.s12` width classes in CSS must cover every column count used. Placeholders take their shape from `data-w`/`data-h`; real `<img>`s should carry `width`/`height`.
- **Works filters**: the option text in each `.wf-ls` must match the `data-medium`/`data-category`/`data-period` values on the figures exactly.

## Conventions

- `main.js` mixes compact one-liners (from the original file) with longer commented functions (newer work). Match the style of whatever you're editing and don't reformat code you aren't changing.
- Scroll work runs through one `requestAnimationFrame` loop (`requestUpdate` → `update`). Add new scroll effects there instead of adding more scroll listeners. Do DOM reads before writes.
- Respect `prefers-reduced-motion`: CSS shortens all transitions, and the JS checks `reducedMotion.matches`.
- Write meaningful `alt` text for every new image.
- Put styles in the stylesheet, not inline. JS sets only runtime animation values.

## Known placeholders

- Many `href="#"` links: "View all works", "See all exhibitions", the socials, the footer utility links and Donate.
- `EX` entries 2–4 are placeholders ("Exhibition title / Location / Year").

## Git

The repo is this folder. `.DS_Store` is ignored. Commit only when asked.
