import type { Metadata } from "next";

import { ContactCTA } from "@/components/public-site/contact-cta";
import { PublicNav } from "@/components/public-site/public-nav";
import { contactContent, contactPage, siteIdentity } from "@/lib/public-site/content";

export const metadata: Metadata = {
  title: "Contact — Adam Boon",
  description:
    "Contact Adam Boon in Devon, UK for senior product leadership roles and substantive collaboration.",
};

export default function ContactPage() {
  return (
    <main className="mx-auto w-full max-w-4xl space-y-10 px-6 py-14 sm:px-10 sm:py-20">
      <PublicNav />

      <header className="relative overflow-hidden rounded-2xl border border-zinc-800/90 bg-gradient-to-br from-zinc-950/90 via-zinc-950/50 to-sky-950/15 p-6 sm:p-8">
        <div className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.2]" aria-hidden />
        <div className="relative space-y-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
            {siteIdentity.name} · {siteIdentity.location}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
            {contactPage.heading}
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-zinc-300 sm:text-base">
            {contactPage.intro}
          </p>
          <p className="max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            {contactPage.conversationNote}
          </p>
        </div>
      </header>

      <ContactCTA
        showHeading={false}
        body={contactPage.ctaBridge}
        links={[contactContent.email, contactContent.github, contactContent.cv]}
      />

      <p className="max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
        {contactPage.closing}
      </p>
    </main>
  );
}
