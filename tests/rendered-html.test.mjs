import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("root renders the canonical English overview", async () => {
  const response = await render("/");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /ZEZHAO WANG/);
  assert.match(html, /Research &amp; Data Analyst/);
});

test("all 20 professional profile and 20 CV routes render", async () => {
  const locales = ["en", "es", "zh", "fi"];
  const profiles = ["general", "ai-evaluation", "data-people-analytics", "customer-business-growth", "research-assessment"];
  for (const locale of locales) {
    for (const profile of profiles) {
      const profilePath = profile === "general" ? `/${locale}` : `/${locale}/${profile}`;
      const [profileResponse, cvResponse] = await Promise.all([render(profilePath), render(`/${locale}/cv/${profile}`)]);
      assert.equal(profileResponse.status, 200, profilePath);
      assert.equal(cvResponse.status, 200, `/${locale}/cv/${profile}`);
      const [profileHtml, cvHtml] = await Promise.all([profileResponse.text(), cvResponse.text()]);
      assert.match(profileHtml, /ZEZHAO WANG/);
      assert.match(cvHtml, /ZEZHAO WANG/);
      assert.match(profileHtml, new RegExp(`/cv/Zezhao_Wang_.*_CV_${locale.toUpperCase()}\\.pdf`));
      assert.match(profileHtml, /application\/ld\+json/);
      assert.doesNotMatch(profileHtml + cvHtml, /not claimed|no claim|source-stated|owner-supplied|interpretation limit|not presented as|ZEZAO WANG/i);
    }
  }
});

test("case studies and professional contact actions are public", async () => {
  const response = await render("/en/research-assessment");
  const html = await response.text();
  assert.match(html, /Multilingual AI Speech Evaluation/);
  assert.match(html, /EVALCOMPLIN/);
  assert.match(html, /20,000\+ users/);
  assert.match(html, /linkedin\.com\/in\/zezhao-wang/);
  assert.match(html, /hdl\.handle\.net\/10550\/128559/);
});

test("unsupported locales and routes return not found", async () => {
  for (const path of ["/de", "/en/general", "/en/cv/not-a-profile", "/en/extra/path"]) {
    const response = await render(path);
    assert.equal(response.status, 404, path);
  }
});

test("starter preview and private phone are absent from public output", async () => {
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
  const response = await render("/en");
  const html = await response.text();
  assert.doesNotMatch(html, /\+34 647|sourceRefs|reviewNote|interpretationLimits/);
  const manifest = await readFile(new URL("../public/cv/manifest.json", import.meta.url), "utf8");
  assert.doesNotMatch(manifest, /\+34 647|sourceRefs|reviewNote|interpretationLimits/);
});
