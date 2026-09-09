export const LOCALES = ["en", "es", "zh", "fi"] as const;
export const PROFILE_IDS = [
  "general",
  "ai-evaluation",
  "data-people-analytics",
  "customer-business-growth",
  "research-assessment",
] as const;

export type Locale = (typeof LOCALES)[number];
export type ProfileId = (typeof PROFILE_IDS)[number];
export type DatePrecision = "year" | "month" | "day";

export type PartialDate = {
  year: number;
  month: number | null;
  day: number | null;
  precision: DatePrecision;
};

export type Metric = {
  value: number;
  operator: ">=" | "=" | ">" | "<=" | "<";
  displayOperator: string;
  unit: string;
  population: string | null;
  period: string | null;
  denominator: string | null;
};

export type Evidence = {
  id: string;
  entityId: string;
  kind: "activity" | "output" | "measured-result" | "capability" | "interpretation";
  statementKey: string;
  metric?: Metric;
  interpretationLimits?: string;
  sourceRefs: Array<{ sourceId: string; locator: string }>;
  status: "source_supported" | "owner_confirmed" | "primary_verified" | "unresolved" | "superseded";
  visibility: "public" | "private";
};

export type ProfileConfig = {
  id: ProfileId;
  slug: string;
  nameKey: string;
  headlineKey: string;
  summaryKey: string;
  targetRoleKeys: string[];
  experienceIds: string[];
  evidencePriorityIds: string[];
  caseStudyIds: string[];
  projectIds: string[];
  publicationIds: string[];
  educationIds: string[];
  skillGroupIds: string[];
  toolIds: string[];
  sectionOrder: string[];
  cv: { template: string; evidenceLimits: Record<string, number>; projectEvidenceLimit: number };
};

export type LocaleFile = {
  locale: Locale;
  documentLanguage: string;
  label: string;
  messages: Record<string, string>;
};

export type ResolvedEvidence = Evidence & { text: string };

export type ResolvedProfile = {
  revision: string;
  locale: Locale;
  documentLanguage: string;
  profile: { id: ProfileId; slug: string; name: string; headline: string; summary: string; targetRoles: string[] };
  identity: {
    displayName: string;
    professionalPrefix: string;
    professionalTitle: string;
    specialisation: string;
    location: string;
    email: string;
    links: Array<{ id: string; label: string; url: string }>;
  };
  experiences: Array<{
    id: string;
    type: string;
    title: string;
    organisations: string;
    location: string;
    dateRange: string;
    qualification?: string;
    evidence: ResolvedEvidence[];
    cvEvidenceLimit: number;
  }>;
  projects: Array<{
    id: string;
    title: string;
    summary: string;
    url: string | null;
    repositoryUrl: string | null;
    dateRange: string;
    evidence: ResolvedEvidence[];
  }>;
  education: Array<{
    id: string;
    degree: string;
    field: string;
    organisation: string;
    dateRange: string;
    honours: string[];
    dissertation?: string;
  }>;
  skillGroups: Array<{ id: string; label: string; items: string[] }>;
  tools: Array<{ id: string; label: string; level: string }>;
  languages: Array<{ id: string; name: string; detail: string }>;
  publications: Array<{ id: string; citation: string; url: string | null; status: string }>;
  caseStudies: Array<{
    id: string;
    index: string;
    title: string;
    kicker: string;
    problem: string;
    context: string;
    role: string;
    analysis: string;
    deliverable: string;
    interpretation: string;
    evidence: ResolvedEvidence[];
    methods: string[];
    tools: string[];
    url: string | null;
  }>;
  labels: Record<string, string>;
  pdfFilename: string;
};
