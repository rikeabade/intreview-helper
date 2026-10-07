"use client";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/locale-provider";

export function LocaleToggle() {
  const { locale, setLocale, t, mounted } = useLocale();

  if (!mounted) {
    return <Button variant="ghost" size="icon" aria-label="Toggle language" />;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={t.common.toggleLanguage}
      onClick={() => setLocale(locale === "pt-BR" ? "en" : "pt-BR")}
      className="text-xs font-semibold"
    >
      {locale === "pt-BR" ? "PT" : "EN"}
    </Button>
  );
}
