# V2 implementation notes

- Canonical identity: `ZEZHAO WANG`; public title `Research & Data Analyst`; specialisation `AI Evaluation · User & Customer Insights · Measurement`.
- Public routes: root English overview, 20 professional profile routes, and 20 browser CV routes across `en`, `es`, `zh`, and `fi`.
- Five stable profile IDs: `general`, `ai-evaluation`, `data-people-analytics`, `customer-business-growth`, and `research-assessment`.
- Four structured case studies: user/learning analytics, multilingual AI speech evaluation, Evaluation Data Inspector, and multilingual assessment/validation.
- `lib/resolve-profile.ts` is the public allowlist and shared web view-model resolver. Private evidence is filtered before rendering.
- PDF generation applies profile-specific evidence limits and produces exactly 20 two-page A4 PDFs. `public/cv/manifest.json` binds each file to content and template revisions plus hashes.
- `.pages.yml` exposes structured canonical records, profile selection, and locale messages in Pages CMS; it intentionally excludes internal audit files.
- GitHub Actions regenerates and validates content/PDFs, type-checks, lints, tests worker routes, exports 45 static pages, and deploys GitHub Pages.
- SEO includes canonical metadata, language alternates, Open Graph metadata, JSON-LD Person data, `robots.txt`, and a 40-URL sitemap.
- V1 is recoverable through the `pre-v2-career-site` tag and `archive/pre-v2-career-site` branch.

Evidence boundary:

- Two prior CV PDFs were located and hashed during the source audit. They support identity, education, publication metadata, named collaborators, EVALCOMPLIN project ID, edX scale, and doctoral AI-evaluation workflow details.
- The exact five requested V2 source CV filenames were not present. Unsupported claims were not invented.
- The supplied R² value remains an unresolved private evidence record and is excluded from web pages and PDFs.
- The project URL currently reaches a Streamlit authentication screen when checked from this environment; the source and documented deployment paths were audited, but anonymous project access still requires owner verification.
- Spanish, Simplified Chinese, and Finnish are complete professional drafts, not represented as owner-approved translations.
