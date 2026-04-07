import { EmployerSignalBlock } from "./employer-signal-block";

type ProductCardProps = {
  name: string;
  href: string;
  description: string;
  employerSignal: string;
};

export function ProductCard({
  name,
  href,
  description,
  employerSignal,
}: ProductCardProps) {
  return (
    <article className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-950/45 p-5">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-zinc-100">{name}</h3>
        <p className="text-sm leading-relaxed text-zinc-400">{description}</p>
      </div>
      <EmployerSignalBlock text={employerSignal} />
      <a
        href={href}
        className="inline-block text-sm font-medium text-sky-400 hover:text-sky-300 hover:underline"
      >
        Visit product
      </a>
    </article>
  );
}
