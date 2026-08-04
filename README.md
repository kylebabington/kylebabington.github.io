# Kyle Babington — Portfolio

Personal portfolio site (static HTML, CSS, and JS). Wilderness-led brand with projects as proof of craft.

## Local preview

Open `index.html` in a browser, or from this folder:

```bash
npx --yes serve .
```

Then visit the URL shown in the terminal.

Pages:

- Home — `index.html`
- Developer Stats — `stats/` (reads `data/github-stats.json`)

## Placeholders to replace

Drop your real assets and update the matching links in `index.html`:

| Placeholder | Path / value |
| --- | --- |
| Hero wilderness photo | `assets/about/hero-wilderness.jpg` (set — LinkedIn banner) |
| About / portrait | `assets/about/portrait-or-trail.jpg` (set) |
| Open Graph share image | `assets/og-image.svg` → optional `assets/og-image.jpg` and update meta tags |
| Email | `mailto:kyle.babington.dev@gmail.com` (set) |
| LinkedIn | `https://www.linkedin.com/in/kyle-babington` (set) |
| Resume | `assets/resume.pdf` (set) |

GitHub is already wired to `https://github.com/kylebabington`.

## Contact form

The contact form posts to Formspree (`https://formspree.io/f/xzdnjzej`) via AJAX from `js/personalPortfolio.js`.

## GitHub stats automation

`data/github-stats.json` powers the Stats page (contribution graph, repo counts, recent activity).

A GitHub Action (`.github/workflows/github-stats.yml`) refreshes that file daily and on manual `workflow_dispatch`. It runs `node scripts/update-github-stats.cjs` with `GITHUB_TOKEN` and commits changes when the data changes.

To regenerate locally (requires `gh` auth or `GITHUB_TOKEN`):

```bash
node scripts/update-github-stats.cjs
```

## Site features

- Sticky nav with Indianapolis clock, theme toggle (dark / light / system), and GitHub link
- Ctrl/Cmd+K command palette
- Developer Stats page with contribution activity

## GitHub Pages

Live site: **https://kylebabington.github.io**

Repo: `kylebabington/kylebabington.github.io` — Pages deploys from `main` / `/ (root)`.
