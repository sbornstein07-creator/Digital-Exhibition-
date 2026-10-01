# Road of Resistance

*Three Women’s Journeys in Defying the Nazis*: a scroll-driven digital exhibition on Frumka Płotnicka, Vladka Meed, and Hannah Senesh.

Plain HTML, CSS, and JavaScript. No build step, no frameworks.

```
index.html        the exhibition (all text, labels, notes, bibliography)
css/style.css     design: colors and fonts are tokens at the top of the file
js/main.js        scroll scenes, parallax, reveals, sticky image stories, choices
assets/images/    photos extracted from the slides and paper (not used on the page; kept for reference)
```

## Preview locally

From this folder, run:

```
python3 -m http.server 8000
```

Then open <http://localhost:8000>. You can also double-click `index.html`, but a local server behaves most like the live site.

## Publish on GitHub Pages

1. Push this repository to GitHub.
2. On GitHub, go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, pick `main` and `/ (root)`, and click **Save**.
4. After a minute the site is live at `https://<your-username>.github.io/<repository-name>/`.

To put it on a portfolio site instead, upload `index.html`, `css/`, `js/`, and `assets/` together, keeping the same folder structure.

## Editing

- **Text:** edit `index.html`. Each chapter is a clearly commented `<section>`.
- **Footnotes:** superscript numbers are links such as `<a href="#fn-12">12</a>` pointing at the numbered notes in the Sources section.
- **Sketches:** every illustration is an inline SVG line drawing in `index.html`. Each `<path>` has `pathLength="1"`, which lets it draw itself line by line. Sketches inside scroll scenes (class `sketch--scrub`) draw as you scroll; the rest draw when they come into view.
- **Accent color:** change `--accent` in `css/style.css`.
- **Scroll scenes:** sections marked `data-scene` pin in place while scrolling plays their animation (hero, words lighting up, the closing walls, the last letter, the ID card, the suitcase journey, the closing questions). Each scene's length is its `--len` value, and its animation is the matching function in `js/main.js`.
- **“Stand in her place”:** each woman's chapter opens with a choice. The reader picks an answer, then sees what she did. Scrolling past without choosing reveals it too.
- **Motion:** parallax strength is the `data-speed` attribute on each `.parallax` element. Visitors with “reduce motion” turned on get a static page with every scene shown in its final state. Phones get lighter motion.
