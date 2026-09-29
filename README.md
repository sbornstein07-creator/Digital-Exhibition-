# Road of Resistance

*Three Women’s Journeys in Defying the Nazis*: a scroll-driven digital exhibition on Frumka Płotnicka, Vladka Meed, and Hannah Senesh.

Plain HTML, CSS, and JavaScript. No build step, no frameworks.

```
index.html        the exhibition (all text, labels, notes, bibliography)
css/style.css     design: colors and fonts are tokens at the top of the file
js/main.js        parallax, scroll reveals, sticky image stories, count-ups
assets/images/    images extracted from the slides and paper
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
- **Accent color:** change `--accent` in `css/style.css`.
- **Motion:** parallax strength is the `data-speed` attribute on each `.parallax` element. Visitors with “reduce motion” turned on get a static page. Phones get about 40% of the desktop motion.
