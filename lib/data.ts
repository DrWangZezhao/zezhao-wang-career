import identity from "@/content/identity.json";
import contacts from "@/content/contacts.json";
import organisations from "@/content/organisations.json";
import education from "@/content/education.json";
import experiences from "@/content/experiences.json";
import projects from "@/content/projects.json";
import publications from "@/content/publications.json";
import collaborations from "@/content/collaborations.json";
import languages from "@/content/languages.json";
import evidence from "@/content/evidence.json";
import skills from "@/content/skills.json";
import methods from "@/content/methods.json";
import tools from "@/content/tools.json";
import capabilities from "@/content/capabilities.json";
import caseStudies from "@/content/case-studies.json";
import dissertations from "@/content/dissertations.json";
import manuscripts from "@/content/manuscripts.json";
import general from "@/profile-config/general.json";
import aiEvaluation from "@/profile-config/ai-evaluation.json";
import dataPeopleAnalytics from "@/profile-config/data-people-analytics.json";
import customerBusinessGrowth from "@/profile-config/customer-business-growth.json";
import researchAssessment from "@/profile-config/research-assessment.json";
import en from "@/locales/en.json";
import es from "@/locales/es.json";
import zh from "@/locales/zh.json";
import fi from "@/locales/fi.json";
import type { Locale, LocaleFile, ProfileConfig, ProfileId } from "@/schemas/content";

export const masterData = {
  identity,
  contacts,
  organisations,
  education,
  experiences,
  projects,
  publications,
  collaborations,
  languages,
  evidence,
  skills,
  methods,
  tools,
  capabilities,
  caseStudies,
  dissertations,
  manuscripts,
};

export const profileConfigs = {
  general,
  "ai-evaluation": aiEvaluation,
  "data-people-analytics": dataPeopleAnalytics,
  "customer-business-growth": customerBusinessGrowth,
  "research-assessment": researchAssessment,
} as unknown as Record<ProfileId, ProfileConfig>;

export const localeFiles = { en, es, zh, fi } as unknown as Record<Locale, LocaleFile>;
