const SPARKLES = [
  { top: "14%", left: "8%", size: "size-1.5", delay: "0s" },
  { top: "22%", left: "88%", size: "size-2", delay: "0.8s" },
  { top: "46%", left: "94%", size: "size-1.5", delay: "1.6s" },
  { top: "62%", left: "5%", size: "size-2", delay: "2.2s" },
  { top: "78%", left: "82%", size: "size-1.5", delay: "0.4s" },
  { top: "34%", left: "46%", size: "size-1", delay: "1.2s" },
];

export function BackgroundDecoration() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.09] via-transparent to-transparent dark:from-primary/[0.16]" />
      <div className="ambient-drift-a absolute -top-32 -right-32 size-[40rem] rounded-full bg-violet-400/40 blur-[110px] dark:bg-violet-500/35" />
      <div className="ambient-drift-b absolute top-[38%] -left-40 size-[34rem] rounded-full bg-sky-300/35 blur-[110px] dark:bg-indigo-500/30" />
      <div className="ambient-drift-b absolute -bottom-40 right-[18%] size-[30rem] rounded-full bg-pink-300/30 blur-[120px] dark:bg-pink-500/20" />
      <div className="ambient-drift-a absolute top-[8%] left-[30%] size-[22rem] rounded-full bg-amber-200/30 blur-[120px] dark:bg-amber-400/10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,var(--border)_1px,transparent_0)] bg-[size:28px_28px] opacity-50 [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black_40%,transparent_100%)]" />
      {SPARKLES.map((s, i) => (
        <span
          key={i}
          className={`twinkle absolute rounded-full bg-primary/70 ${s.size}`}
          style={{ top: s.top, left: s.left, animationDelay: s.delay }}
        />
      ))}
    </div>
  );
}
