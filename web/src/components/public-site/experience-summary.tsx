type ExperienceSummaryProps = {
  heading: string;
  body: string;
};

export function ExperienceSummary({ heading, body }: ExperienceSummaryProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-950/40">
      <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-zinc-500/60 via-zinc-600/40 to-transparent" aria-hidden />
      <div className="p-6 pl-8 sm:p-8 sm:pl-10">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">{heading}</h2>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-zinc-400 sm:text-base">{body}</p>
      </div>
    </section>
  );
}
