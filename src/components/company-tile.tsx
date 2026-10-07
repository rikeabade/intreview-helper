import { cn } from "cn";

const TILE_STYLES = [
  "bg-violet-500/15 text-violet-600 dark:text-violet-300",
  "bg-sky-500/15 text-sky-600 dark:text-sky-300",
  "bg-pink-500/15 text-pink-600 dark:text-pink-300",
  "bg-amber-500/20 text-amber-600 dark:text-amber-300",
  "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300",
];

function styleFor(key: string): string {
  let hash = 0;
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return TILE_STYLES[hash % TILE_STYLES.length];
}

export function CompanyTile({
  name,
  slug,
  className,
}: {
  name: string;
  slug: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex size-12 shrink-0 items-center justify-center rounded-2xl text-xl font-semibold",
        styleFor(slug),
        className
      )}
    >
      {name.trim().charAt(0).toUpperCase()}
    </div>
  );
}
