import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { ProfileId, ResolvedProfile } from "@/schemas/content";

const profiles: ProfileId[] = ["general", "ai-evaluation", "data-people-analytics", "customer-business-growth", "research-assessment"];
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function CvPage({ view }: { view: ResolvedProfile }) {
  const { labels: t } = view;
  const profilePath = view.profile.id === "general" ? `/${view.locale}` : `/${view.locale}/${view.profile.id}`;
  return (
    <main className="cv-shell" lang={view.documentLanguage}>
      <a className="skip-link" href="#cv-content">{t["nav.skip"]}</a>
      <header className="cv-toolbar"><Link href={profilePath}>← {t["nav.backToProfile"]}</Link><div className="cv-toolbar-actions"><LanguageSwitcher locale={view.locale} pathSuffix={`/cv/${view.profile.id}`} label={t["nav.language"]} /><a className="button button-primary" href={`${basePath}/cv/${view.pdfFilename}`} download={view.pdfFilename}>{t["nav.downloadPdf"]} ↓</a></div></header>
      <nav className="cv-profile-tabs" aria-label={t["nav.profile"]}>{profiles.map((id) => <Link key={id} href={`/${view.locale}/cv/${id}`} aria-current={id === view.profile.id ? "page" : undefined}>{view.labels[`profile.${id}.name`]}</Link>)}</nav>
      <article className="cv-paper" id="cv-content">
        <header className="cv-heading"><div><p className="eyebrow">{t["cv.label"]} · {view.profile.name}</p><h1>{view.identity.displayName}</h1><p className="cv-headline">{view.identity.professionalTitle} · {view.identity.specialisation}</p></div><address><span>{view.identity.location}</span><a href={`mailto:${view.identity.email}`}>{view.identity.email}</a>{view.identity.links.map((link) => <a href={link.url} key={link.id}>{link.label}</a>)}</address></header>
        <p className="cv-summary">{view.profile.summary}</p>
        <section className="cv-role-fit"><h2>{t["section.roleFit"]}</h2><p>{view.profile.targetRoles.join(" · ")}</p></section>
        <section className="cv-section"><h2>{t["section.experience"]}</h2>{view.experiences.map((experience) => <article className="cv-entry" key={experience.id}><div className="cv-entry-heading"><div><h3>{experience.title}</h3><p>{experience.organisations}</p></div><time>{experience.dateRange}</time></div><ul>{experience.evidence.slice(0, experience.cvEvidenceLimit).map((evidence) => <li key={evidence.id}>{evidence.text}</li>)}</ul></article>)}</section>
        {view.projects.map((project) => <section className="cv-section" key={project.id}><h2>{t["cv.selectedProject"]}</h2><article className="cv-entry"><div className="cv-entry-heading"><div><h3>{project.title}</h3><p>{project.summary}</p></div><time>{project.dateRange}</time></div><ul>{project.evidence.slice(0, 3).map((evidence) => <li key={evidence.id}>{evidence.text}</li>)}</ul>{project.url && <a href={project.url}>{project.url.replace("https://", "")}</a>}</article></section>)}
        <div className="cv-columns"><section className="cv-section"><h2>{t["section.education"]}</h2>{view.education.map((item) => <article className="cv-mini-entry" key={item.id}><div><h3>{item.degree} · {item.field}</h3><p>{item.organisation}</p>{item.honours.map((honour) => <small key={honour}>{honour}</small>)}{item.dissertation && <small>{t["education.dissertation"]}: {item.dissertation}</small>}</div><time>{item.dateRange}</time></article>)}</section><section className="cv-section"><h2>{t["section.languages"]}</h2>{view.languages.map((language) => <p className="cv-language" key={language.id}><strong>{language.name}</strong><span>{language.detail}</span></p>)}</section></div>
        <section className="cv-section cv-skills"><h2>{t["cv.coreCapabilities"]}</h2>{view.skillGroups.map((group) => <p key={group.id}><strong>{group.label}</strong><span>{group.items.join(" · ")}</span></p>)}<p><strong>{t["section.tools"]}</strong><span>{view.tools.map((tool) => tool.label).join(" · ")}</span></p></section>
        {view.publications.length > 0 && <section className="cv-section"><h2>{t["section.publications"]}</h2>{view.publications.map((publication) => <p key={publication.id}>{publication.citation}</p>)}</section>}
      </article>
    </main>
  );
}
