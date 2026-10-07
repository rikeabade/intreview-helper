export type Locale = "pt-BR" | "en";

export const DEFAULT_LOCALE: Locale = "pt-BR";

export function isLocale(value: unknown): value is Locale {
  return value === "pt-BR" || value === "en";
}
