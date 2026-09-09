import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CvPage } from "@/components/CvPage";
import { DocumentLanguage } from "@/components/DocumentLanguage";
import { ProfilePage } from "@/components/ProfilePage";
import { isLocale, isProfileId, resolveProfile } from "@/lib/resolve-profile";
import type { ProfileId } from "@/schemas/content";

type Props = { params: Promise<{ locale: string; segments?: string[] }> };

export const dynamicParams = false;

export function generateStaticParams() {
  const locales = ["en", "es", "zh", "fi"];
  const profiles: ProfileId[] = ["general", "ai-evaluation", "data-people-analytics", "customer-business-growth", "research-assessment"];
  return locales.flatMap((locale) => [
    { locale, segments: [] as string[] },
    ...profiles.filter((profile) => profile !== "general").map((profile) => ({ locale, segments: [profile] })),
    ...profiles.map((profile) => ({ locale, segments: ["cv", profile] })),
  ]);
}

function resolveRoute(locale: string, segments: string[] = []) {
  if (!isLocale(locale)) return null;
  if (segments.length === 0) return { locale, profileId: "general" as ProfileId, cv: false };
  if (segments.length === 1 && isProfileId(segments[0]) && segments[0] !== "general") {
    return { locale, profileId: segments[0], cv: false };
  }
  if (segments.length === 2 && segments[0] === "cv" && isProfileId(segments[1])) {
    return { locale, profileId: segments[1], cv: true };
  }
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, segments } = await params;
  const route = resolveRoute(locale, segments);
  if (!route) return { title: "Page not found · ZEZHAO WANG" };
  const view = resolveProfile(route.profileId, route.locale);
  const canonical = route.cv ? `/${route.locale}/cv/${route.profileId}` : route.profileId === "general" ? `/${route.locale}` : `/${route.locale}/${route.profileId}`;
  return {
    title: `${route.cv ? `${view.labels["cv.label"]} · ` : ""}${view.profile.name} · ZEZHAO WANG`,
    description: view.profile.summary,
    alternates: {
      canonical,
      languages: {
        en: route.cv ? `/en/cv/${route.profileId}` : route.profileId === "general" ? "/en" : `/en/${route.profileId}`,
        es: route.cv ? `/es/cv/${route.profileId}` : route.profileId === "general" ? "/es" : `/es/${route.profileId}`,
        "zh-Hans": route.cv ? `/zh/cv/${route.profileId}` : route.profileId === "general" ? "/zh" : `/zh/${route.profileId}`,
        fi: route.cv ? `/fi/cv/${route.profileId}` : route.profileId === "general" ? "/fi" : `/fi/${route.profileId}`,
      },
    },
  };
}

export default async function LocalizedPage({ params }: Props) {
  const { locale, segments } = await params;
  const route = resolveRoute(locale, segments);
  if (!route) notFound();
  const view = resolveProfile(route.profileId, route.locale);
  const title = `${route.cv ? `${view.labels["cv.label"]} · ` : ""}${view.profile.name} · ZEZHAO WANG`;
  return <><DocumentLanguage lang={view.documentLanguage} title={title} />{route.cv ? <CvPage view={view} /> : <ProfilePage view={view} />}</>;
}
