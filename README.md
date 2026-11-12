# Isamu Noguchi — Foundation & Garden Museum

A static website extracted from the original self-contained HTML document. No build step or package installation is required.

## Structure

```text
index.html              Page content and inline SVG arrow symbol
assets/
  css/styles.css        Responsive layout, typography, animations and utilities
  js/main.js            Scroll effects, navigation and exhibition interactions
  images/               12 descriptively named original images
  fonts/                Valley Sans Light and Regular (original TTF files)
```

## Preview

Open `index.html` in a browser, or serve this directory locally:

```sh
python3 -m http.server 8000
```

Then visit http://localhost:8000. Google Fonts (Inter Tight, IBM Plex Mono and Source Serif 4) still load from the original external stylesheet and require internet access. Valley Sans and all images are local.

## Editing

- Edit page text and links in `index.html`.
- Edit styles in `assets/css/styles.css`; font paths are relative to that stylesheet.
- Edit behavior and the `EX` exhibition details array in `assets/js/main.js`.
- Replace images in `assets/images/`, or update their references in the HTML.

## Review notes

The original image and font bytes, page content, layout rules and interaction script are preserved. Static inline styles have been moved to CSS. The tiny SVG symbol stays in the HTML so arrow references work when opening the page directly. JavaScript continues to set animation styles at runtime.

The original page includes placeholder `href="#"` links and three placeholder exhibition records. These need real destinations and details before launch. This reorganization does not change those existing behaviors.
