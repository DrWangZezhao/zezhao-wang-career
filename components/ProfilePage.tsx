import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { Locale, ProfileId, ResolvedProfile } from "@/schemas/content";

const profiles: ProfileId[] = ["general", "ai-evaluation", "data-people-analytics", "customer-business-growth", "research-assessment"];
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function profileHref(locale: Locale, id: ProfileId) {
  return id === "general" ? `/${locale}` : `/${locale}/${id}`;
}

export function ProfilePage({ view }: { view: ResolvedProfile }) {
  const { labels: t } = view;
  const pathSuffix = view.profile.id === "general" ? "" : `/${view.profile.id}`;
  const project = view.projects[0];
  const linkedin = view.identity.links.find((link) => link.id === "link-linkedin");
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: view.identity.displayName,
    honorificPrefix: view.identity.professionalPrefix,
    jobTitle: view.identity.professionalTitle,
    url: `https://drwangzezhao.github.io/zezhao-wang-career/${view.locale}${pathSuffix}`,
    email: `mailto:${view.identity.email}`,
    address: { "@type": "PostalAddress", addressLocality: "Helsinki", addressCountry: "FI" },
    sameAs: view.identity.links.map((link) => link.url),
    alumniOf: ["Universitat de València", "Yunnan Normal University"],
  };

  return (
    <main className="site-shell" lang={view.documentLanguage}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
      <a className="skip-link" href="#main-content">{t["nav.skip"]}</a>
      <header className="site-header">
        <Link href={`/${view.locale}`} className="brand" aria-label="ZEZHAO WANG home">
          <span className="brand-mark" aria-hidden="true">ZW</span>
          <span>ZEZHAO WANG</span>
        </Link>
        <div className="header-actions">
          <a href="#contact">{t["nav.contact"]}</a>
          <LanguageSwitcher locale={view.locale} pathSuffix={pathSuffix} label={t["nav.language"]} />
        </div>
      </header>

      <nav className="profile-nav" aria-label={t["nav.profile"]}>
        <span className="profile-nav-label">{t["nav.profile"]}</span>
        <div className="profile-nav-links">
          {profiles.map((id, index) => (
            <Link key={id} href={profileHref(view.locale, id)} aria-current={id === view.profile.id ? "page" : undefined}>
              <span>{String(index + 1).padStart(2, "0")}</span>{view.labels[`profile.${id}.name`]}
            </Link>
          ))}
        </div>
      </nav>

      <div id="main-content">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">{view.identity.professionalTitle}</p>
            <p className="specialisation">{view.identity.specialisation}</p>
            <h1 id="hero-title">{view.profile.headline}</h1>
            <p className="hero-summary">{view.profile.summary}</p>
            <div className="hero-actions">
              <a className="button button-primary" href="#case-studies">{t["nav.viewCases"]}<span aria-hidden="true">↓</span></a>
              <a className="button button-secondary" href={`${basePath}/cv/${view.pdfFilename}`} download={view.pdfFilename}>{t["nav.downloadPdf"]}<span aria-hidden="true">↓</span></a>
              <a className="button button-text" href={`mailto:${view.identity.email}`}>{t["nav.contact"]}<span aria-hidden="true">↗</span></a>
            </div>
          </div>
          <aside className="hero-card" aria-label={t["section.roleFit"]}>
            <p className="card-kicker">{view.profile.name}</p>
            <h2>{t["section.roleFit"]}</h2>
            <ul>{view.profile.targetRoles.map((role) => <li key={role}>{role}</li>)}</ul>
            <div className="card-meta"><span>{view.identity.location}</span><span>{view.identity.professionalPrefix}</span></div>
          </aside>
        </section>

        <section className="evidence-grid" aria-labelledby="evidence-title">
          <div className="evidence-heading"><p className="section-number">01</p><h2 id="evidence-title">{t["section.evidence"]}</h2></div>
          {view.caseStudies.slice(0, 3).map((item) => (
            <a className="evidence-card" href={`#${item.id}`} key={item.id}>
              <span>{item.index}</span><strong>{item.kicker}</strong><h3>{item.title}</h3><p>{item.deliverable}</p>
            </a>
          ))}
        </section>

        <section className="content-section experience-section" id="experience" aria-labelledby="experience-title">
          <div className="section-intro"><p className="section-number">02</p><h2 id="experience-title">{t["section.experience"]}</h2><p>{view.identity.specialisation}</p></div>
          <div className="experience-list">
            {view.experiences.map((experience) => (
              <article className="experience-card" key={experience.id}>
                <div className="experience-meta"><time>{experience.dateRange}</time><span>{experience.location}</span></div>
                <div><h3>{experience.title}</h3><p className="organisation">{experience.organisations}</p><ul>{experience.evidence.slice(0, 4).map((evidence) => <li key={evidence.id}>{evidence.text}</li>)}</ul></div>
              </article>
            ))}
          </div>
        </section>

        <section className="case-section" id="case-studies" aria-labelledby="cases-title">
          <div className="content-section case-section-inner">
            <div className="section-intro inverse"><p className="section-number">03</p><h2 id="cases-title">{t["section.cases"]}</h2><p>{view.profile.summary}</p></div>
            <div className="case-list">
              {view.caseStudies.map((item) => (
                <article className="case-card" id={item.id} key={item.id}>
                  <header><span>{item.index}</span><div><p>{item.kicker}</p><h3>{item.title}</h3></div></header>
                  <div className="case-grid">
                    <div><strong>{t["field.problem"]}</strong><p>{item.problem}</p></div>
                    <div><strong>{t["field.context"]}</strong><p>{item.context}</p></div>
                    <div><strong>{t["field.role"]}</strong><p>{item.role}</p></div>
                    <div><strong>{t["field.analysis"]}</strong><p>{item.analysis}</p></div>
                    <div><strong>{t["field.methods"]}</strong><p>{[...item.methods, ...item.tools].join(" · ")}</p></div>
                    <div><strong>{t["field.deliverable"]}</strong><p>{item.deliverable}</p></div>
                  </div>
                  <p className="case-interpretation"><strong>{t["field.interpretation"]}</strong>{item.interpretation}</p>
                  {item.url && <a href={item.url} target="_blank" rel="noreferrer">{t["nav.viewProject"]}<span aria-hidden="true">↗</span></a>}
                </article>
              ))}
            </div>
          </div>
        </section>

        {project && <section className="content-section project-section" id="projects" aria-labelledby="project-title">
          <div className="section-intro inverse"><p className="section-number">04</p><h2 id="project-title">{t["section.projects"]}</h2><p>{project.summary}</p></div>
          <article className="project-card"><div className="project-heading"><span className="project-index">PY / DATA / UI</span><h3>{project.title}</h3><p>{project.summary}</p>{project.url && <a href={project.url} target="_blank" rel="noreferrer">{t["nav.viewProject"]}<span aria-hidden="true">↗</span></a>}</div><ul className="project-evidence">{project.evidence.slice(0, 5).map((evidence) => <li key={evidence.id}>{evidence.text}</li>)}</ul></article>
        </section>}

        <section className="content-section split-section" id="skills" aria-labelledby="skills-title">
          <div className="section-intro"><p className="section-number">05</p><h2 id="skills-title">{t["section.skills"]}</h2></div>
          <div><div className="skill-grid">{view.skillGroups.map((group) => <article key={group.id}><h3>{group.label}</h3><p>{group.items.join(" · ")}</p></article>)}</div><div className="tool-list"><h3>{t["section.tools"]}</h3>{view.tools.map((tool) => <p key={tool.id}><strong>{tool.label}</strong><span>{tool.level}</span></p>)}</div></div>
        </section>

        <section className="content-section credentials" id="education" aria-labelledby="education-title">
          <div className="section-intro"><p className="section-number">06</p><h2 id="education-title">{t["section.education"]}</h2></div>
          <div className="education-list">{view.education.map((item) => <article key={item.id}><time>{item.dateRange}</time><div><h3>{item.degree} · {item.field}</h3><p>{item.organisation}</p>{item.honours.map((honour) => <small key={honour}>{honour}</small>)}{item.dissertation && <p className="dissertation"><strong>{t["education.dissertation"]}:</strong> {item.dissertation}</p>}</div></article>)}</div>
          <div className="language-panel"><h3>{t["section.languages"]}</h3><div>{view.languages.map((language) => <p key={language.id}><strong>{language.name}</strong><span>{language.detail}</span></p>)}</div></div>
        </section>

        {view.publications.length > 0 && <section className="content-section publication-section" id="publications" aria-labelledby="publication-title"><div className="section-intro"><p className="section-number">07</p><h2 id="publication-title">{t["section.publications"]}</h2></div>{view.publications.map((publication) => <article key={publication.id}><span>{publication.status}</span><p>{publication.citation}</p>{publication.url && <a href={publication.url} target="_blank" rel="noreferrer">{t["publication.read"]} ↗</a>}</article>)}</section>}

        <section className="contact-section" id="contact" aria-labelledby="contact-title">
          <p className="eyebrow">{t["site.availability"]}</p><h2 id="contact-title">{t["section.contact"]}</h2><p>{t["contact.prompt"]}</p>
          <div className="contact-actions"><a href={`mailto:${view.identity.email}`}>{view.identity.email}</a>{linkedin && <a href={linkedin.url} target="_blank" rel="noreferrer">LinkedIn ↗</a>}<a href={`${basePath}/cv/${view.pdfFilename}`} download={view.pdfFilename}>{t["nav.downloadPdf"]} ↓</a></div>
        </section>
      </div>
      <footer><span>{t["footer.note"]}</span><span>{t["footer.revision"]}</span></footer>
    </main>
  );
}
