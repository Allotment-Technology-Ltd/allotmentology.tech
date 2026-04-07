import type { Metadata } from "next";

import { ContactCTA } from "@/components/public-site/contact-cta";
import { PublicNav } from "@/components/public-site/public-nav";
import { SectionIntro } from "@/components/public-site/section-intro";
import { contactContent } from "@/lib/public-site/content";

export const metadata: Metadata = {
  title: "Contact — Allotment Works",
  description: "Contact details for hiring and collaboration conversations.",
};

export default function ContactPage() {
  return (
    <main className="mx-auto w-full max-w-4xl space-y-10 px-6 py-14 sm:px-10 sm:py-20">
      <PublicNav />
      <SectionIntro
        heading="Contact"
        description="Open to conversations about senior product roles and collaboration where strategy and execution both matter."
      />
      <ContactCTA
        body={contactContent.body}
        links={[contactContent.email, contactContent.github, contactContent.cv]}
      />
    </main>
  );
}
