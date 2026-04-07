type SectionIntroProps = {
  eyebrow?: string;
  heading: string;
  description?: string;
  /** Visual accent for index pages: distinguishes writing vs case studies without new palette. */
  accent?: "default" | "writing" | "cases";
};

const accentClass: Record<NonNullable<SectionIntroProps["accent"]>, string> = {
  default: "",
  writing: "border-l-2 border-sky-500/35 pl-5",
  cases: "border-l-2 border-zinc-600 pl-5",
};

export function SectionIntro({ eyebrow, heading, description, accent = "default" }: SectionIntroProps) {
  return (
    <div className={`space-y-3 ${accentClass[accent]}`}>
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
