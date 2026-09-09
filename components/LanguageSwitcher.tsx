"use client";

import type { Locale } from "@/schemas/content";

const options: Array<{ id: Locale; label: string }> = [
  { id: "en", label: "English" },
  { id: "es", label: "Español" },
  { id: "zh", label: "简体中文" },
  { id: "fi", label: "Suomi" },
];

export function LanguageSwitcher({ locale, pathSuffix, label }: { locale: Locale; pathSuffix: string; label: string }) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const target = (id: Locale) => `${basePath}/${id}${pathSuffix}`;

  function follow(event: React.MouseEvent<HTMLAnchorElement>, id: Locale) {
    event.preventDefault();
    localStorage.setItem("preferred-locale", id);
    const url = new URL(target(id), window.location.origin);
    url.search = window.location.search;
    url.hash = window.location.hash;
    window.location.assign(url.toString());
  }

  return (
    <div className="language-switcher" role="group" aria-label={label}>
      {options.map((option) => (
        <a
          key={option.id}
          href={target(option.id)}
          onClick={(event) => follow(event, option.id)}
          aria-current={option.id === locale ? "page" : undefined}
          hrefLang={option.id === "zh" ? "zh-Hans" : option.id}
        >
          {option.label}
        </a>
      ))}
    </div>
  );
}
