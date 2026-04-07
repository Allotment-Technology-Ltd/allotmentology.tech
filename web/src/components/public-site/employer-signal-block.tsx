type EmployerSignalBlockProps = {
  text: string;
};

export function EmployerSignalBlock({ text }: EmployerSignalBlockProps) {
  return (
    <p className="rounded-md border border-zinc-800/90 bg-zinc-950/60 px-3 py-2 text-xs leading-relaxed text-zinc-400">
      <span className="font-medium text-zinc-200">What this reflects:</span> {text}
    </p>
  );
}
