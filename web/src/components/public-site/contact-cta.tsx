type ContactLink = {
  label: string;
  href: string;
};

type ContactCTAProps = {
  body: string;
  links: [ContactLink, ContactLink, ContactLink];
  /** When false, omit the section heading (e.g. contact page already has a page title). */
  showHeading?: boolean;
  heading?: string;
};

export function ContactCTA({
  body,
  links,
  showHeading = true,
  heading = "Contact",
}: ContactCTAProps) {
  return (
    <section className="space-y-4 rounded-2xl border border-zinc-700/90 bg-gradient-to-br from-zinc-950/80 to-zinc-950/40 p-6 sm:p-7">
      {showHeading ? (
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">{heading}</h2>
      ) : null}
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
