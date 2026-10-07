const COLORS = [
  "bg-primary",
  "bg-pink-400",
  "bg-amber-400",
  "bg-emerald-400",
  "bg-sky-400",
  "bg-violet-400",
];

export function Confetti({ count = 40 }: { count?: number }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 z-20 h-0 overflow-visible"
    >
      {Array.from({ length: count }, (_, i) => {
        const wobble = Math.sin(i * 12.9898) * 43758.5453;
        const frac = wobble - Math.floor(wobble);
        return (
          <span
            key={i}
            className={`confetti-piece ${COLORS[i % COLORS.length]}`}
            style={
              {
                left: `${(i * 97) % 100}%`,
                "--dx": `${Math.round((frac - 0.5) * 160)}px`,
                "--rot": `${Math.round(360 + frac * 540)}deg`,
                "--delay": `${(i % 10) * 70}ms`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
