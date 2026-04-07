type SectionIntroProps = {
  eyebrow?: string;
  heading: string;
  description?: string;
};

export function SectionIntro({ eyebrow, heading, description }: SectionIntroProps) {
  return (
    <div className="space-y-3">
      {eyebrow ? (
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
        {heading}
      </h2>
      {description ? (
        <p className="max-w-3xl text-sm leading-relaxed text-zinc-400 sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}
