import { localeFiles, masterData, profileConfigs } from "@/lib/data";
import type { Evidence, Locale, Metric, PartialDate, ProfileId, ResolvedProfile } from "@/schemas/content";

const CONTENT_REVISION = "2026-09-09-v2";

const monthLocales: Record<Locale, string> = { en: "en-GB", es: "es-ES", zh: "zh-CN", fi: "fi-FI" };
const unitLabels: Record<Locale, Record<string, string>> = {
  en: { users: "users" }, es: { users: "usuarios" }, zh: { users: "名用户" }, fi: { users: "käyttäjää" },
};

function getById<T extends { id: string }>(items: T[], id: string): T {
  const item = items.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`Missing canonical record: ${id}`);
  return item;
}

function formatMetric(metric: Metric, locale: Locale) {
  if (metric.unit === "R²") {
    const value = new Intl.NumberFormat(monthLocales[locale], { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(metric.value);
    return `R² ${metric.displayOperator} ${value}`;
  }
  const value = new Intl.NumberFormat(monthLocales[locale], { maximumFractionDigits: 3 }).format(metric.value);
  const suffix = metric.displayOperator === "+" ? "+" : ` ${metric.displayOperator}`;
  return `${value}${suffix} ${unitLabels[locale][metric.unit] ?? metric.unit}`;
}

function resolveText(text: string, locale: Locale, evidenceItems: Evidence[]) {
  return text.replace(/\{metric:([^}]+)\}/g, (_, id: string) => {
    const item = getById(evidenceItems, id);
    if (!item.metric) throw new Error(`Metric placeholder references non-metric evidence: ${id}`);
    return formatMetric(item.metric, locale);
  });
}

function formatPartialDate(value: PartialDate, locale: Locale) {
  if (value.precision === "year") return String(value.year);
  const date = new Date(Date.UTC(value.year, (value.month ?? 1) - 1, value.day ?? 1));
  if (value.precision === "month") return new Intl.DateTimeFormat(monthLocales[locale], { month: "short", year: "numeric", timeZone: "UTC" }).format(date);
  return new Intl.DateTimeFormat(monthLocales[locale], { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

function formatRange(start: PartialDate, end: PartialDate, locale: Locale) {
  const startText = formatPartialDate(start, locale);
  const endText = formatPartialDate(end, locale);
  return startText === endText ? startText : `${startText}–${endText}`;
}

function filename(profileId: ProfileId, locale: Locale) {
  const profileNames: Record<ProfileId, string> = {
    general: "Overview",
    "ai-evaluation": "AI_Evaluation_Data_Quality",
    "data-people-analytics": "Data_User_Insights",
    "customer-business-growth": "Customer_Insights_Growth_Support",
    "research-assessment": "Research_Assessment",
  };
  return `Zezhao_Wang_${profileNames[profileId]}_CV_${locale.toUpperCase()}.pdf`;
}

export function resolveProfile(profileId: ProfileId, locale: Locale, contentRevision = CONTENT_REVISION): ResolvedProfile {
  const config = profileConfigs[profileId];
  const localeFile = localeFiles[locale];
  const messages = localeFile.messages;
  const t = (key: string) => {
    const value = messages[key];
    if (!value) throw new Error(`Missing ${locale} translation key: ${key}`);
    return value;
  };

  const evidenceItems = masterData.evidence as Evidence[];
  const evidenceRank = new Map(config.evidencePriorityIds.map((id, index) => [id, index]));
  const resolveEvidenceIds = (ids: string[], requirePriority = false) => ids
    .filter((id) => {
      const item = getById(evidenceItems, id);
      return item.visibility === "public" && (!requirePriority || evidenceRank.has(id));
    })
    .sort((a, b) => (evidenceRank.get(a) ?? 999) - (evidenceRank.get(b) ?? 999))
    .map((id) => {
      const item = getById(evidenceItems, id);
      return { ...item, text: resolveText(t(item.statementKey), locale, evidenceItems) };
    });

  const organisations = masterData.organisations;
  const experiences = config.experienceIds.map((id) => {
    const item = getById(masterData.experiences, id);
    return {
      id: item.id,
      type: item.type,
      title: t(item.titleKey),
      organisations: item.organisationIds.map((orgId) => getById(organisations, orgId).canonicalName).join(" · "),
      location: t(item.locationKey),
      dateRange: formatRange(item.start as PartialDate, item.end as PartialDate, locale),
      evidence: resolveEvidenceIds(item.evidenceIds, true),
      cvEvidenceLimit: config.cv.evidenceLimits[item.id] ?? 1,
    };
  });

  const projects = config.projectIds.map((id) => {
    const item = getById(masterData.projects, id);
    return {
      id: item.id,
      title: t(item.titleKey), summary: t(item.summaryKey), url: item.url, repositoryUrl: item.repositoryUrl,
      dateRange: formatRange(item.start as PartialDate, item.end as PartialDate, locale),
      evidence: resolveEvidenceIds(item.evidenceIds),
    };
  });

  const dissertations = masterData.dissertations;
  const education = config.educationIds.map((id) => {
    const item = getById(masterData.education, id);
    const organisation = item.organisationId ? getById(organisations, item.organisationId).canonicalName : "";
    const dissertation = "dissertationId" in item && item.dissertationId ? getById(dissertations, item.dissertationId).title : undefined;
    return {
      id: item.id, degree: t(item.degreeKey), field: t(item.fieldKey), organisation,
      dateRange: formatRange(item.start as PartialDate, item.end as PartialDate, locale), honours: item.honoursKeys.map(t), dissertation,
    };
  });

  const methodItems = [...masterData.methods, ...masterData.capabilities];
  const skillGroups = config.skillGroupIds.map((id) => {
    const group = getById(masterData.skills.groups, id);
    return { id, label: t(group.labelKey), items: group.itemIds.map((itemId) => t(getById(methodItems, itemId).labelKey)) };
  });

  const tools = config.toolIds.map((id) => {
    const item = getById(masterData.tools, id);
    return { id, label: item.label, level: t(`tool.level.${item.proficiency}`) };
  });
  const languages = masterData.languages.map((item) => ({
    id: item.id, name: t(item.nameKey), detail: item.proficiency === "native" ? t("language.native") : item.proficiency,
  }));

  const publications = config.publicationIds.map((id) => {
    const item = getById(masterData.publications, id);
    return {
      id: item.id,
      citation: `${item.authors} (${item.year}). ${item.title}. ${item.venue}, ${item.volume}, ${item.pages}.`,
      url: item.url,
      status: t("publication.published"),
    };
  });

  const cases = masterData.caseStudies;
  const caseStudies = config.caseStudyIds.map((id) => {
    const item = getById(cases, id);
    return {
      id: item.id, index: item.index, title: t(item.titleKey), kicker: t(item.kickerKey), problem: t(item.problemKey),
      context: t(item.contextKey), role: t(item.roleKey), analysis: t(item.analysisKey), deliverable: t(item.deliverableKey),
      interpretation: t(item.interpretationKey), evidence: resolveEvidenceIds(item.evidenceIds),
      methods: item.methodIds.map((methodId) => t(getById(masterData.methods, methodId).labelKey)),
      tools: item.toolIds.map((toolId) => getById(masterData.tools, toolId).label), url: item.url,
    };
  });

  const publicContacts = masterData.contacts.filter((contact) => contact.public && contact.value);
  const email = publicContacts.find((contact) => contact.type === "email")?.value ?? "";
  const links = publicContacts.filter((contact) => contact.type === "url").map((contact) => ({ id: contact.id, label: t(contact.labelKey), url: contact.value! }));

  return {
    revision: contentRevision,
    locale, documentLanguage: localeFile.documentLanguage,
    profile: { id: config.id, slug: config.slug, name: t(config.nameKey), headline: t(config.headlineKey), summary: t(config.summaryKey), targetRoles: config.targetRoleKeys.map(t) },
    identity: {
      displayName: masterData.identity.displayName, professionalPrefix: masterData.identity.professionalPrefix,
      professionalTitle: t(masterData.identity.professionalTitleKey), specialisation: t(masterData.identity.specialisationKey),
      location: t("site.location"), email, links,
    },
    experiences, projects, education, skillGroups, tools, languages, publications, caseStudies,
    labels: messages, pdfFilename: filename(config.id, locale),
  };
}

export function isLocale(value: string): value is Locale { return ["en", "es", "zh", "fi"].includes(value); }
export function isProfileId(value: string): value is ProfileId { return ["general", "ai-evaluation", "data-people-analytics", "customer-business-growth", "research-assessment"].includes(value); }
