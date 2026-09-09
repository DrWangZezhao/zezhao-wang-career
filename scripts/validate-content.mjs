import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const load = async (file) => JSON.parse(await readFile(path.join(root, file), "utf8"));
const locales = ["en", "es", "zh", "fi"];
const profiles = ["general", "ai-evaluation", "data-people-analytics", "customer-business-growth", "research-assessment"];
const expectedName = "ZEZHAO WANG";
const expectedEmail = "zezwang@alumni.uv.es";

const data = {
  identity: await load("content/identity.json"), contacts: await load("content/contacts.json"), organisations: await load("content/organisations.json"),
  education: await load("content/education.json"), experiences: await load("content/experiences.json"), projects: await load("content/projects.json"),
  publications: await load("content/publications.json"), manuscripts: await load("content/manuscripts.json"), dissertations: await load("content/dissertations.json"), collaborations: await load("content/collaborations.json"),
  caseStudies: await load("content/case-studies.json"), evidence: await load("content/evidence.json"), languages: await load("content/languages.json"),
  skills: await load("content/skills.json"), methods: await load("content/methods.json"), tools: await load("content/tools.json"), capabilities: await load("content/capabilities.json"),
};
const configs = Object.fromEntries(await Promise.all(profiles.map(async (id) => [id, await load(`profile-config/${id}.json`)])));
const localeFiles = Object.fromEntries(await Promise.all(locales.map(async (id) => [id, await load(`locales/${id}.json`)])));
const ids = (items) => new Set(items.map((item) => item.id));
const unique = (items, label) => assert.equal(ids(items).size, items.length, `Duplicate ${label} ID`);

for (const [label, items] of Object.entries(data)) if (Array.isArray(items)) unique(items, label);
unique(data.skills.groups, "skill group");
assert.equal(data.identity.displayName, expectedName, "Canonical public name must be uppercase ZEZHAO WANG");

const publicEmail = data.contacts.filter((item) => item.public && item.type === "email" && item.value);
assert.equal(publicEmail.length, 1, "Exactly one public email is required");
assert.equal(publicEmail[0].value, expectedEmail, "Canonical email changed");
assert.equal(data.contacts.find((item) => item.id === "link-linkedin")?.value, "https://www.linkedin.com/in/zezhao-wang-phd-068519170/");
assert.equal(data.contacts.find((item) => item.id === "link-github")?.value, "https://github.com/zedwong1998-afk");
assert(!data.contacts.some((item) => item.public && item.type === "phone"), "Private phone exposed");

const orgIds = ids(data.organisations), evidenceIds = ids(data.evidence), experienceIds = ids(data.experiences), projectIds = ids(data.projects);
const educationIds = ids(data.education), publicationIds = ids(data.publications), skillGroupIds = ids(data.skills.groups), caseStudyIds = ids(data.caseStudies), toolIds = ids(data.tools);
for (const item of data.experiences) {
  item.organisationIds.forEach((id) => assert(orgIds.has(id), `${item.id} -> missing ${id}`));
  item.evidenceIds.forEach((id) => assert(evidenceIds.has(id), `${item.id} -> missing ${id}`));
  assert(["year", "month", "day"].includes(item.start.precision));
  assert(["year", "month", "day"].includes(item.end.precision));
}
for (const item of data.projects) item.evidenceIds.forEach((id) => assert(evidenceIds.has(id), `${item.id} -> missing ${id}`));
for (const item of data.education) assert(orgIds.has(item.organisationId), `${item.id} missing organisation`);
for (const item of data.caseStudies) {
  item.evidenceIds.forEach((id) => assert(evidenceIds.has(id), `${item.id} -> missing ${id}`));
  item.toolIds.forEach((id) => assert(toolIds.has(id), `${item.id} -> missing ${id}`));
}

for (const id of profiles) {
  const config = configs[id];
  assert.equal(config.id, id);
  config.experienceIds.forEach((ref) => assert(experienceIds.has(ref), `${id} -> missing ${ref}`));
  config.evidencePriorityIds.forEach((ref) => assert(evidenceIds.has(ref), `${id} -> missing ${ref}`));
  config.caseStudyIds.forEach((ref) => assert(caseStudyIds.has(ref), `${id} -> missing ${ref}`));
  config.projectIds.forEach((ref) => assert(projectIds.has(ref), `${id} -> missing ${ref}`));
  config.educationIds.forEach((ref) => assert(educationIds.has(ref), `${id} -> missing ${ref}`));
  config.publicationIds.forEach((ref) => assert(publicationIds.has(ref), `${id} -> missing ${ref}`));
  config.skillGroupIds.forEach((ref) => assert(skillGroupIds.has(ref), `${id} -> missing ${ref}`));
  config.toolIds.forEach((ref) => assert(toolIds.has(ref), `${id} -> missing ${ref}`));
  assert(!("maxEvidencePerExperience" in config.cv), `${id} still uses global one-bullet limit`);
  assert(Object.keys(config.cv.evidenceLimits).length >= 4, `${id} lacks profile-aware evidence allocation`);
}

const sourceKeys = Object.keys(localeFiles.en.messages).sort();
for (const locale of locales) {
  assert.deepEqual(Object.keys(localeFiles[locale].messages).sort(), sourceKeys, `${locale} key set differs from English`);
  assert.equal(localeFiles[locale].locale, locale);
}
assert.equal(localeFiles.zh.documentLanguage, "zh-Hans");

const metricPattern = /\{metric:([^}]+)\}/g;
for (const locale of locales) for (const [key, value] of Object.entries(localeFiles[locale].messages)) for (const match of value.matchAll(metricPattern)) assert(data.evidence.find((item) => item.id === match[1])?.metric, `${locale}.${key} references missing metric ${match[1]}`);

const proficiencyLevels = new Set(["practical", "research", "working", "configuration"]);
for (const tool of data.tools) assert(proficiencyLevels.has(tool.proficiency), `${tool.id} invalid proficiency`);
assert.equal(data.education.find((item) => item.id === "edu-bachelors")?.organisationId, "org-yunnan-normal");
assert.equal(data.organisations.find((item) => item.id === "org-evalcomplin")?.projectId, "PID2021-128745NB-I00");
assert(data.collaborations.some((item) => item.namedCollaborators.includes("Professor Guillermo Solano-Flores")), "Stanford collaborator missing");
assert(data.collaborations.some((item) => item.namedCollaborators.includes("Professor Ana Gimeno-Sanz")), "UPV collaborator missing");
assert(data.dissertations[0].title.startsWith("A Study on Error-Preserving Automatic Transcription"));
assert.equal(data.publications.length, 1, "Expected one source-supported formal publication");
assert(data.manuscripts.every((item) => item.visibility === "internal"), "Incomplete manuscripts must remain internal");
const r2 = data.evidence.find((item) => item.id === "ev-r2-calibration");
assert.equal(r2.visibility, "private", "Contextless R² must remain private");
assert.equal(r2.status, "unresolved", "Contextless R² must remain unresolved");

const forbidden = /\bnot claimed\b|\bno claim\b|source-stated|owner-supplied|interpretation limit|not presented as|\bZEZAO WANG\b/i;
for (const locale of locales) for (const [key, value] of Object.entries(localeFiles[locale].messages)) assert(!forbidden.test(value), `Forbidden public wording in ${locale}.${key}`);
for (const file of ["components/ProfilePage.tsx", "components/CvPage.tsx"]) assert(!forbidden.test(await readFile(path.join(root, file), "utf8")), `Forbidden public wording in ${file}`);

for (const item of data.contacts.filter((entry) => entry.public && entry.value)) {
  if (item.type === "url") assert.doesNotThrow(() => new URL(item.value));
}
assert.doesNotThrow(() => new URL(data.projects[0].url));
assert.doesNotThrow(() => new URL(data.publications[0].url));

const pdfs = (await readdir(path.join(root, "public/cv"))).filter((file) => file.endsWith(".pdf"));
assert.equal(pdfs.length, 20, "Expected 20 generated PDFs");
console.log(`Validated V2: ${profiles.length} profiles × ${locales.length} locales, ${data.evidence.length} evidence records, ${data.caseStudies.length} case studies, and ${pdfs.length} PDFs.`);
