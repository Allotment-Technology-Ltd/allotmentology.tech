type ExperienceSummaryProps = {
  heading: string;
  body: string;
};

export function ExperienceSummary({ heading, body }: ExperienceSummaryProps) {
  return (
    <section className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-950/35 p-6">
      <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">{heading}</h2>
      <p className="max-w-4xl text-sm leading-relaxed text-zinc-400 sm:text-base">
        {body}
      </p>
    </section>
  );
}
