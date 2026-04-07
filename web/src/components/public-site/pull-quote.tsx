type PullQuoteProps = {
  quote: string;
  /** Case studies vs writing — subtle colour shift */
  variant?: "writing" | "case-studies";
};

export function PullQuote({ quote, variant = "writing" }: PullQuoteProps) {
  const border =
    variant === "case-studies"
      ? "border-l-zinc-500/80 bg-zinc-900/40"
      : "border-l-sky-500/50 bg-sky-950/25";

  return (
    <figure
      className={`my-10 border-l-2 py-4 pl-6 pr-4 ${border} rounded-r-lg`}
      aria-label="Highlighted passage"
    >
      <blockquote className="text-base font-medium leading-relaxed tracking-tight text-zinc-100 sm:text-lg">
        {quote}
      </blockquote>
    </figure>
  );
}
