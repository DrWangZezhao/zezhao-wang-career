"use client";

import { useEffect } from "react";

export function DocumentLanguage({ lang, title }: { lang: string; title: string }) {
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = title;
  }, [lang, title]);
  return null;
}
