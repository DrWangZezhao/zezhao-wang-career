# ZEZHAO WANG · multilingual career website V2

A production-oriented career website generated from one canonical evidence base. Five professional views, four languages, browser CVs, and 20 downloadable PDFs all resolve the same stable content IDs.

## Public links

- Primary site: <https://zezhao-wang-career.zedwang.chatgpt.site>
- GitHub source: <https://github.com/zedwong1998-afk/zezhao-wang-career>
- Pages CMS editor: <https://app.pagescms.org/>
- Applied project: <https://evaluation-data-inspector.streamlit.app/>

The repository includes a GitHub Actions deployment for GitHub Pages. The primary site remains the canonical URL; the Pages build is a public static mirror and recovery path.

## Edit content without touching components

Use Pages CMS after authorising this repository, or edit the JSON files directly:

- `content/identity.json`, `contacts.json`, `education.json`, `experiences.json`, `projects.json`, `publications.json`, `case-studies.json`, and related typed collections hold canonical facts.
- `profile-config/*.json` selects and prioritises canonical IDs for each professional view.
- `locales/{en,es,zh,fi}.json` contains all public wording.
- `.pages.yml` defines the structured Pages CMS fields.

Pages CMS commits edits to the repository. A commit to `main` runs validation, regenerates every PDF, builds the worker-compatible site and static mirror, and deploys GitHub Pages.

## Local development

Requirements: Node.js 22+, npm, Python 3.12+, and a font with CJK glyph coverage such as Noto Sans CJK.

```bash
npm ci
python3 -m pip install -r requirements.txt
npm run generate:cvs
npm run dev
```

Open <http://localhost:3000/en>. The four locale roots are `/en`, `/es`, `/zh`, and `/fi`.

## Validation and builds

```bash
npm run typecheck
npm run lint
npm run validate:content
npm run validate:pdfs
npm run build
node --test tests/rendered-html.test.mjs
GITHUB_REPOSITORY=zedwong1998-afk/zezhao-wang-career npm run build:static
```

`npm run generate:cvs` writes 20 deterministic files to `public/cv/` and mirrors user-facing copies to the ignored `outputs/cv/` directory. The PDF manifest records content revision, template revision, content hash, locale, profile, and file hashes.

## Content rules

1. Store a fact once and reference it by stable ID. Never paste experience records into profiles.
2. Keep dates as structured partial dates; do not invent missing months or days.
3. Put numeric claims in typed evidence records, then reference them from locale text.
4. Keep unverified or private evidence out of the public projection. The unresolved R² value remains private and is not rendered.
5. Preserve formal publication titles and author order. Translate only surrounding interface copy.
6. Add every new message key to all four locales and update the translation review register.
7. Regenerate and validate all PDFs after any canonical, profile, or locale change.

## Rollback and recovery

- Git tag `pre-v2-career-site` and branch `archive/pre-v2-career-site` preserve the V1 release.
- Revert a bad content commit on `main` to trigger a clean rebuild.
- The primary Sites deployment stores versioned releases; GitHub Pages provides an independent static build.

Internal provenance, conflict notes, private contact fields, and translation review records live under `internal/` and are never imported into public pages.
