export type Locale = "pt-BR" | "en";

export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return value === "pt-BR" || value === "en";
}
