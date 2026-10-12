# Mate Nikić — Portfolio V2

Static, bilingual portfolio built with semantic HTML, CSS, and vanilla JavaScript. The production site is served directly from the repository root and is compatible with Cloudflare Pages.

## Local preview

From the repository root, run:

```sh
python3 -m http.server 8000
```

Open <http://localhost:8000>. Use `Ctrl+C` to stop the server. Case studies use shareable URLs such as `case-study.html?id=cyntegrity&lang=en`; the language can be changed in the header and is remembered for later navigation.

## Editing content

- `index.html` contains the six homepage sections and the reusable page shell.
- `case-study.html` is the shared, URL-addressable case-study page.
- `assets/v2.css` contains the V2 black/orange design system, responsive layouts, and timeline styling.
- `assets/v2.js` renders project cards, expertise, the translated timeline, and case-study details.
- `assets/projects.js` is the source for project names, Croatian descriptions, imagery, links, technologies, and case-study details.
- `assets/i18n.js` contains English project translations, Croatian/English interface copy, and the bilingual career milestones.
- `assets/screenshot-*.webp` are the existing project visuals used by the cards and case studies. Projects without a confirmed visual display an explicit placeholder instead.
- `assets/mate-portrait.png` is used for the hero and About portrait.

Keep missing facts clearly marked until verified. In particular, replace `EMAIL_ADRESA_OVDJE` and the LinkedIn profile placeholder in `index.html` before publishing. Add confirmed imagery for NK Gavran Lanište and Zauvijek si tu when available. Review career dates and employer names, the exact scope of each project contribution, and case-study outcomes before publication; numerical results are intentionally not claimed.

## Cloudflare Pages

Connect the repository to Cloudflare Pages, leave the build command empty, and set the output directory to `.`. No framework, package install, or build step is required. Preview the branch locally before choosing any deployment settings; this branch is not deployed automatically.

## Versioning

Portfolio V2 work is on the `portfolio-v2` branch. The production `main` branch was left unchanged and is locally tagged as `portfolio-v9-backup`. The supplied `v2-reference/` directory is reference material and is not used as the deployed page root.

## Manual review checklist

- Confirm the real email address and LinkedIn profile URL.
- Confirm career dates and employer names; only details present in the source timeline are currently shown.
- Add approved screenshots for the two projects that do not yet have them.
- Review project responsibilities and any future outcome copy with verified facts.
- Check desktop, tablet, and mobile rendering in a browser before publishing.
