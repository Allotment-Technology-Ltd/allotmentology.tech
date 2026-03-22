export function EmptyState({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-dashed border-zinc-700/80 bg-zinc-950/50 px-6 py-10 text-center sm:px-10 sm:py-12 ${className}`}
    >
      <p className="text-sm font-medium text-zinc-200">{title}</p>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-500">
          {description}
        </p>
      ) : null}
      {children ? <div className="mt-6 flex flex-wrap justify-center gap-2">{children}</div> : null}
    </div>
  );
}
