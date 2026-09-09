import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const base = "https://drwangzezhao.github.io/zezhao-wang-career";

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ["en", "es", "zh", "fi"];
  const profiles = ["general", "ai-evaluation", "data-people-analytics", "customer-business-growth", "research-assessment"];
  return locales.flatMap((locale) => profiles.flatMap((profile) => {
    const profilePath = profile === "general" ? `/${locale}` : `/${locale}/${profile}`;
    return [{ url: `${base}${profilePath}`, changeFrequency: "monthly" as const, priority: profile === "general" ? 1 : .8 }, { url: `${base}/${locale}/cv/${profile}`, changeFrequency: "monthly" as const, priority: .6 }];
  }));
}
