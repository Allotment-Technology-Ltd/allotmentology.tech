type ContactLink = {
  label: string;
  href: string;
};

type ContactCTAProps = {
  body: string;
  links: [ContactLink, ContactLink, ContactLink];
};

export function ContactCTA({ body, links }: ContactCTAProps) {
  return (
    <section className="space-y-4 rounded-xl border border-zinc-700 bg-zinc-950/50 p-6 sm:p-7">
      <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">Contact</h2>
      <p className="max-w-4xl text-sm leading-relaxed text-zinc-400 sm:text-base">
        {body}
      </p>
      <div className="flex flex-wrap gap-3 pt-1">
        {links.map((link, idx) => (
          <a
            key={link.label}
            href={link.href}
            className={
              idx === 0
                ? "rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white"
                : "rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
            }
          >
            {link.label}
          </a>
        ))}
      </div>
    </section>
  );
}
