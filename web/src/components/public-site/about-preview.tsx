import Link from "next/link";

type AboutPreviewProps = {
  text: string;
};

export function AboutPreview({ text }: AboutPreviewProps) {
  return (
    <section className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-950/35 p-6">
      <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">About</h2>
      <p className="max-w-4xl text-sm leading-relaxed text-zinc-400 sm:text-base">
        {text}
      </p>
      <Link
        href="/about"
        className="inline-block text-sm font-medium text-sky-400 hover:text-sky-300 hover:underline"
      >
        Read full background
      </Link>
    </section>
  );
}
