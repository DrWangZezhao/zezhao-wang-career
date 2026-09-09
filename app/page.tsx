import { DocumentLanguage } from "@/components/DocumentLanguage";
import { ProfilePage } from "@/components/ProfilePage";
import { resolveProfile } from "@/lib/resolve-profile";

export default function Home() {
  const view = resolveProfile("general", "en");
  return <><DocumentLanguage lang="en" title="Overview · ZEZHAO WANG" /><ProfilePage view={view} /></>;
}
