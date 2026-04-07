export const siteIdentity = {
  name: "Adam Boon",
  location: "Devon, United Kingdom",
  role: "Senior Product Leader",
  email: "admin@usesophia.app",
  githubUrl: "https://github.com/Allotment-Technology-Ltd/allotmentology.tech",
} as const;

/** Default title/description for pages that do not override metadata. */
export const siteMetadataDefaults = {
  title: "Adam Boon — Product leadership and independent building",
  description:
    "Adam Boon, based in Devon, United Kingdom: senior product leadership in NHS and public services, independent products (Restormel, SOPHIA, PLOT), and writing on AI, systems, and method.",
} as const;

export const heroContent = {
  eyebrow: "Allotment Works",
  name: siteIdentity.name,
  location: siteIdentity.location,
  headline:
    "Senior product leadership in high-accountability public services, and independent building that keeps judgment honest.",
  subheading:
    "I lead products where governance, safety, accessibility, and delivery pace have to hold together — mainly in NHS and wider public-service contexts. I also build and ship my own products across AI infrastructure, structured learning, and household software.",
  supporting:
    "Case studies and writing here are deliberate evidence: how I think under constraint, how I translate complexity into clear decisions, and how I sustain quality from discovery through live operation. Useful if you hire for senior product roles, want a serious collaborator, or care about disciplined AI and systems work.",
  primaryCta: { label: "Read case studies", href: "/case-studies" },
  secondaryCta: { label: "Get in touch", href: "/contact" },
} as const;

export const productsIntro =
  "Restormel, SOPHIA, and PLOT are practical expressions of the same habits I bring to public-service delivery: sharp problem framing, restraint under ambiguity, and end-to-end ownership. They are evidence of approach — not a portfolio of unrelated experiments.";

export const products = [
  {
    id: "restormel-keys",
    visualId: "restormel" as const,
    name: "Restormel Keys",
    href: "https://restormel.dev",
    tagline: "A governable control plane between your product and model providers.",
    description:
      "A control layer for AI applications that handles routing, fallback policy, and BYOK governance above existing provider infrastructure.",
    employerSignal:
      "Shows systems-level product thinking: translating technical complexity into practical controls, integration paths, and operational confidence.",
    /** Add `/site/products/restormel.png` when available — see public/site/products/README.md */
    screenshotSrc: undefined as string | undefined,
  },
  {
    id: "sophia",
    visualId: "sophia" as const,
    name: "SOPHIA",
    href: "https://usesophia.app",
    tagline: "Structured philosophy learning with inquiry, writing, and careful model use.",
    description:
      "A structured philosophy learning product that combines guided inquiry, writing feedback, and AI-assisted reasoning.",
    employerSignal:
      "Shows product judgment in nuanced domains where trust, pedagogy, and interface clarity matter as much as feature capability.",
    screenshotSrc: undefined as string | undefined,
  },
  {
    id: "plot",
    visualId: "plot" as const,
    name: "PLOT",
    href: "https://plotbudget.com",
    tagline: "Privacy-first household operations, starting from money rituals that stick.",
    description:
      "A privacy-first household operating system that starts with budgeting rituals and extends into shared household operations.",
    employerSignal:
      "Shows user-centred execution: designing around real behaviour, cognitive load, and sustained adoption instead of feature volume.",
    screenshotSrc: undefined as string | undefined,
  },
] as const;

export type ProductEntry = (typeof products)[number];
export type ProductRef = (typeof products)[number]["id"];

export const employerRelevance = {
  heading: "Why this matters if you are hiring",
  intro:
    "NHS and public-service work teaches consequence-shaped judgment. Building my own products teaches whether that judgment still holds when there is no institution to hide behind. Together they are a single profile: calm under constraint, explicit about trade-offs, and allergic to theatre.",
  points: [
    "Comfort in regulated and high-stakes settings where safety, assurance, and live operations cannot be hand-waved away.",
    "Discovery through live service: alpha, beta, and continuous improvement with real users and real governance.",
    "Research and design wired into prioritisation — not decoration layered onto a fixed roadmap.",
    "Backlog and MVP choices named honestly: what we are deferring, what risk we accept, and how we will know if we were wrong.",
    "Stakeholder work across clinical, operational, engineering, and assurance audiences without collapsing into generic “alignment”.",
  ],
} as const;

export const experienceSummary = {
  heading: "Selected experience",
  body:
    "I am Adam Boon, based in Devon. My recent senior product work sits in NHS and national public-service contexts: cyber assurance tooling, clinically safe triage, live service improvement alongside cloud migration, accessibility, and the grind of keeping complex services coherent while priorities shift. Independently, I ship products that force the same standards — clear boundaries, interpretable behaviour, and maintenance I cannot outsource to a slide deck.",
} as const;

export type ArticleSeries = {
  name: string;
  part: number;
  total: number;
  order: number;
};

export type ArticleEntry = {
  slug: string;
  title: string;
  subtitle?: string;
  standfirst: string;
  summary: string;
  publishedAt: string;
  readingTime: string;
  section: "case-studies" | "writing";
  category: string;
  tags: string[];
  metaDescription?: string;
  series?: ArticleSeries;
  body: string[];
  relatedProducts: ProductRef[];
  relatedReading: string[];
  whatThisShows?: string;
  ctaLabel?: string;
  /** Editorial pull quote inserted after the first body paragraph when set. */
  pullQuote?: string;
};

export const caseStudies: ArticleEntry[] = [
  {
    slug: "dspt-redesign",
    title: "Redesigning a national cyber service without making users relearn everything",
    subtitle:
      "DSPT, CAF, and the product discipline of continuity under institutional change",
    standfirst:
      "Redesigning a live public service is difficult even when the interface is stable. Redesigning one around a major framework shift is harder: users still need orientation, confidence, and continuity while the conceptual model beneath them changes.",
    summary:
      "A reflective case-study on redesigning DSPT around the Cyber Assessment Framework while preserving trust and familiarity for users at national scale.",
    publishedAt: "2026-04-07",
    readingTime: "10 min read",
    section: "case-studies",
    category: "Cyber service redesign",
    tags: [
      "NHS",
      "Public Service",
      "Cyber",
      "Governance",
      "Service Design",
      "User Research",
    ],
    metaDescription:
      "A reflective case-study essay on redesigning DSPT around the Cyber Assessment Framework while preserving trust, familiarity, and user confidence in a nationally used service.",
    body: [
      "A redesign sounds clean in planning language. New framework. New structure. Updated product. In reality, this one started with a more uncomfortable question: how do you change a trusted national service without making people feel they have to learn it from scratch?",
      "The Data Security and Protection Toolkit was already established and used at scale. At the same time, the underlying reference point was shifting from the National Data Guardian Standards toward the Cyber Assessment Framework. That was not cosmetic. It changed how assurance needed to be framed and interpreted.",
      "For users, framework transitions are interpretation events. They ask practical questions: what changed, what stayed stable, and what can still be trusted? If the product cannot answer clearly, uncertainty spreads fast.",
      "Discovery here was less about feature ideation and more about assumption exposure. Stakeholder workshops and Lean UX Canvas work helped surface where confusion risk was highest, and where continuity was non-negotiable.",
      "Research, prototype testing, and playback shaped direction, but this was not a context for purely incremental release. A larger coordinated change made more sense than parallel partial states that would have produced competing interpretations.",
      "The NHS design system helped preserve familiar interaction patterns and legibility while deeper structural shifts happened underneath. That familiarity was not conservatism. It was risk control.",
      "This reinforced a principle I now carry into products like Restormel and SOPHIA: continuity is often part of quality. Good change protects user confidence while improving system integrity.",
    ],
    relatedProducts: ["restormel-keys"],
    relatedReading: [
      "/case-studies/rtanca",
      "/case-studies/product-management-when-mistakes-actually-matter",
      "/writing/ai-coding-part-3-what-we-lose",
    ],
    whatThisShows:
      "Shows cyber-product fluency and the ability to translate governance requirements into usable product decisions.",
    ctaLabel: "Read the DSPT case study",
    pullQuote:
      "For users, framework transitions are interpretation events — the product has to answer what changed, what stayed stable, and what can still be trusted.",
  },
  {
    slug: "rtanca",
    title: "What it takes to improve a live service while also moving it to the cloud",
    subtitle: "RtaNCa, MVP discipline, and the product reality of migration under pressure",
    standfirst:
      "Live services do not pause while strategy catches up. This piece reflects on product work in RtaNCa where user-facing improvement, backlog pressure, governance expectations, and AWS migration all had to move together.",
    summary:
      "A reflective case-study on improving a live cyber service while managing MVP delivery, migration ambiguity, and stakeholder confidence.",
    publishedAt: "2026-04-08",
    readingTime: "10 min read",
    section: "case-studies",
    category: "Live service and migration",
    tags: [
      "NHS",
      "Public Service",
      "AWS",
      "MVP",
      "Live Service",
      "Delivery",
    ],
    metaDescription:
      "A reflective case-study essay on improving a live cyber service while managing MVP delivery, cloud migration, trade-offs, and stakeholder confidence.",
    body: [
      "There is a clean version of product management where roadmap work, platform work, and service operations can be neatly separated. In live services, that separation rarely holds.",
      "The RtaNCa context required continual improvement while the service was already in active use. User needs did not pause because migration work was underway, and migration risk did not disappear because users needed immediate improvements.",
      "User-management functionality became a practical MVP discipline test. The question was not how much we could ship, but which changes reduced meaningful friction without creating avoidable continuity risk.",
      "The AWS migration mattered, but not as a standalone technical milestone. Its product value depended on decision quality, close collaboration with developers, and transparent trade-off framing.",
      "Moving from Scrum to Kanban was a pragmatic response to work shape, not ideology. With live interruptions, variable task sizing, and dependency-driven flow, Kanban gave clearer visibility and reduced process friction.",
      "Avoiding analysis paralysis mattered. We needed enough certainty to move responsibly, but not so much pre-analysis that value stalled. Stakeholder confidence came from explicit reasoning, not from false certainty.",
      "The migration delivered cost savings and improved resilience, but the deeper lesson was about maturity under constraint: product work includes service posture, infrastructure decisions, and the discipline to keep moving with coherence.",
    ],
    relatedProducts: ["plot", "restormel-keys"],
    relatedReading: [
      "/writing/ai-coding-part-2-development-costs",
      "/case-studies/dspt-redesign",
      "/case-studies/product-management-when-mistakes-actually-matter",
    ],
    whatThisShows:
      "Shows delivery leadership across platform change, product quality, and stakeholder coordination.",
    ctaLabel: "Explore the RtaNCa work",
    pullQuote:
      "In live services, the separation between roadmap work, platform work, and operations rarely holds — the product question is what moves without lying about risk.",
  },
  {
    slug: "product-management-when-mistakes-actually-matter",
    title: "Product management changes when mistakes actually matter",
    subtitle:
      "What clinically safe triage taught me about evidence, translation, and disciplined product judgment",
    standfirst:
      "In some products, a weak decision means inconvenience. In clinically safe triage, it can mean much more than that. This piece reflects on how that context changes product practice.",
    summary:
      "A reflective essay on product leadership in clinically safe triage, and how consequence reshapes evidence, governance, and judgment.",
    publishedAt: "2026-04-09",
    readingTime: "10 min read",
    section: "case-studies",
    category: "Clinical safety and triage",
    tags: [
      "NHS",
      "Clinical Safety",
      "Triage",
      "Governance",
      "Product Leadership",
      "Risk",
    ],
    metaDescription:
      "A reflective case-study essay on product leadership in clinically safe triage and how high-consequence environments reshape evidence and judgment.",
    body: [
      "A lot of product culture is built around speed and confidence. In clinically safe triage work, those instincts are still relevant, but they are not enough.",
      "When decisions sit near care pathways, the burden of reasoning changes. You still make product decisions, but evidence thresholds rise and assumptions must be explicit.",
      "Working with clinicians and analysts reshaped what product expertise looked like. It became less performative and more relational: combining domain perspectives into decisions that were practical, safe, and accountable.",
      "Data mattered, but only when tied to the right questions and interpreted with discipline. A metric without framing can create confidence without clarity.",
      "The primary care clinical triage review work involved show-and-tells, workshops, governance artefacts, and sustained relationship-building. Much of the meaningful progress was translational: aligning language and assumptions across expertise boundaries.",
      "Important product work here was often infrastructural rather than flashy: backlog clarity, workflow refinement, risk framing, and better conditions for decision quality.",
      "This changed how I build now. It helps explain why I care about disciplined reasoning in SOPHIA, and governance/interpretability in Restormel, and why shallow move-fast rhetoric feels increasingly unhelpful.",
    ],
    relatedProducts: ["sophia", "restormel-keys"],
    relatedReading: [
      "/writing/ai-coding-part-3-what-we-lose",
      "/case-studies/dspt-redesign",
      "/case-studies/rtanca",
    ],
    whatThisShows:
      "Shows calm decision-making in high-consequence service environments.",
    ctaLabel: "View this case study",
    pullQuote:
      "When decisions sit near care pathways, evidence thresholds rise — and performative confidence becomes a liability.",
  },
] as const;

export const writingPosts: ArticleEntry[] = [
  {
    slug: "ai-coding-part-1-why-i-stopped-feeling-guilty",
    title: "AI Coding Part 1: Why I Stopped Feeling Guilty",
    subtitle:
      "On legitimacy, assistance, and the difference between building software and performing purity",
    standfirst:
      "For a while, using AI to build software felt faintly illegitimate - as if the work only counted when it looked difficult in familiar ways. This essay is about that discomfort, where it comes from, and why I eventually stopped performing anxiety about tooling and started asking a better question: what kind of product work am I actually trying to do?",
    summary:
      "Part 1 of the AI Coding trilogy on guilt, legitimacy, and why AI-assisted building still depends on human judgment.",
    publishedAt: "2026-04-10",
    readingTime: "9 min read",
    section: "writing",
    category: "AI and software practice",
    tags: ["AI", "Software Building", "Product Practice", "Authorship", "Craft", "Series"],
    metaDescription:
      "Part 1 of an AI Coding series on guilt, legitimacy, and why AI-assisted building is less about purity and more about judgment.",
    series: { name: "AI Coding", part: 1, total: 3, order: 1 },
    body: [
      "The first reaction I had to AI-assisted coding was not excitement. It was embarrassment.",
      "Not because the output was bad. Often it was useful. The discomfort came from somewhere else: a feeling that if the work became easier, maybe it counted less.",
      "When people talk about AI coding, they usually argue at the level of capability: speed, quality, reliability, risk. All of that matters. But there is a social layer underneath it that we pretend is not there.",
      "Tool choice has always carried status signals in software culture. How hard something looked, how much you did manually, how visibly craft a workflow appeared - these were often treated as proxies for seriousness.",
      "AI unsettles those proxies. That can feel like liberation. It can also feel like loss. The early guilt, at least for me, was less about ethics and more about identity.",
      "I stopped asking whether AI use made the work legit, and started asking whether I still owned the decisions. If I can still explain the architecture choices, defend the trade-offs, understand the failure modes, and carry responsibility for outcomes, then assistance is exactly that: assistance.",
      "This shift changed how I build. AI did not just make existing work faster; it changed how quickly I could test options before overcommitting. That became part of how products like PLOT, Restormel, and SOPHIA could be explored in practice.",
      "Part 2 is about the cost side of this shift. Part 3 is about what we may lose if fluent generation replaces careful thinking.",
    ],
    relatedProducts: ["restormel-keys", "sophia", "plot"],
    relatedReading: [
      "/writing/ai-coding-part-2-development-costs",
      "/writing/ai-coding-part-3-what-we-lose",
      "/case-studies/product-management-when-mistakes-actually-matter",
    ],
    pullQuote:
      "I stopped asking whether AI use made the work legit, and started asking whether I still owned the decisions.",
  },
  {
    slug: "ai-coding-part-2-development-costs",
    title: "AI Coding Part 2: Development Costs",
    subtitle:
      "What got cheaper, what got riskier, and why cost discipline now matters more",
    standfirst:
      "AI-assisted coding has changed software economics, but not by making cost irrelevant. It has moved cost around: lowering some barriers, raising others, and changing what feels possible before we've done the hard thinking.",
    summary:
      "Part 2 of the AI Coding trilogy on shifted software economics: speed gains, hidden costs, and scope discipline.",
    publishedAt: "2026-04-11",
    readingTime: "10 min read",
    section: "writing",
    category: "AI and software practice",
    tags: ["AI", "Software Economics", "Product Development", "Scope", "Maintenance", "Series"],
    metaDescription:
      "Part 2 of an AI Coding series on how AI shifts software development costs across time, complexity, scope, and maintenance.",
    series: { name: "AI Coding", part: 2, total: 3, order: 2 },
    body: [
      "In Part 1, I wrote about guilt and legitimacy. Part 2 is less emotional and more structural: cost.",
      "Not just money. Cost as time, complexity, attention, maintenance burden, and the cognitive load of keeping a product coherent over time.",
      "AI has changed that cost profile. Certain things are faster and genuinely cheaper in the short term: boilerplate, rough prototypes, and first-pass implementation.",
      "But first-pass speed is only one part of total cost. The harder costs often arrive later: integration friction, review and verification time, architecture drift, and maintenance overhead.",
      "The key shift is that prototyping got cheaper while finishing got more strategic. When starting is cheap, starting too much becomes easy. You can generate plausible momentum without building durable shape.",
      "I increasingly treat false abundance as a delivery risk. Lower build friction should tighten scope discipline, not dissolve it.",
      "A practical model is four cost buckets: generation, validation, integration, maintenance. AI usually improves generation. It can improve validation. It can quietly worsen integration and maintenance if standards are loose.",
      "This is why founder-builder realism matters more now, not less. The question is no longer can I build this at all - it is should this exist, can I sustain it, and what complexity am I importing.",
      "Part 3 is about loss: what we may thin out culturally and cognitively if speed becomes fluent substitution for understanding.",
    ],
    relatedProducts: ["plot", "restormel-keys"],
    relatedReading: [
      "/writing/ai-coding-part-1-why-i-stopped-feeling-guilty",
      "/writing/ai-coding-part-3-what-we-lose",
      "/case-studies/rtanca",
    ],
    pullQuote:
      "When starting is cheap, starting too much becomes easy — you can generate plausible momentum without building durable shape.",
  },
  {
    slug: "ai-coding-part-3-what-we-lose",
    title: "AI Coding Part 3: What We Lose",
    subtitle:
      "On craft, memory, and the disciplines worth preserving in AI-assisted software work",
    standfirst:
      "AI has expanded what we can build. That is real. But expansion has a shadow: some forms of understanding, patience, and craft become easier to bypass. This final essay is about that tension, and about choosing a disciplined relationship to AI that preserves depth instead of replacing it with fluent output.",
    summary:
      "Part 3 of the AI Coding trilogy on what AI-assisted building can thin out, and what disciplined teams should deliberately preserve.",
    publishedAt: "2026-04-12",
    readingTime: "10 min read",
    section: "writing",
    category: "AI and software practice",
    tags: ["AI", "Software Craft", "Product Judgment", "Interpretation", "Attention", "Series"],
    metaDescription:
      "Part 3 of the AI Coding trilogy: a reflective essay on what AI-assisted software building can thin out, and what to preserve.",
    series: { name: "AI Coding", part: 3, total: 3, order: 3 },
    body: [
      "Part 1 was about guilt. Part 2 was about cost. Part 3 is about loss.",
      "Not collapse or nostalgia. A more difficult question: what gets thinner when software becomes easier to produce?",
      "One risk is that output grows while understanding shrinks. You can ship code that works while your relationship to the system weakens - you know less about why it works and where it will break.",
      "Some friction is waste, but some friction is memory. The debugging trail, the rewrite, the slower boundary decision - these are often part of how judgment is formed.",
      "The risk is not AI writes code. The risk is role drift: builders becoming editors of generated possibility rather than authors of coherent systems.",
      "Craft here is not nostalgia. It is operational responsibility: explicit assumptions, readable decisions, meaningful boundaries, and maintainable systems.",
      "This matters at product level too. If teams become fast but shallow, products become persuasive but brittle. Interpretation quality falls even while output volume rises.",
      "That is why I care about structure and disciplined reasoning in SOPHIA, and interpretability/governance in Restormel. The aim is not anti-AI caution. It is anti-shallowness discipline.",
      "The conclusion of this trilogy is simple: build with AI, but preserve the parts of practice that keep good work possible - attention, reasoning, structure, and responsibility.",
    ],
    relatedProducts: ["restormel-keys", "sophia", "plot"],
    relatedReading: [
      "/writing/ai-coding-part-1-why-i-stopped-feeling-guilty",
      "/writing/ai-coding-part-2-development-costs",
      "/case-studies/product-management-when-mistakes-actually-matter",
    ],
    pullQuote:
      "Craft here is not nostalgia. It is operational responsibility: explicit assumptions, readable decisions, and maintainable systems.",
  },
];

export type CaseStudy = (typeof caseStudies)[number];
export type WritingPost = (typeof writingPosts)[number];

export function getCaseStudyBySlug(slug: string): CaseStudy | null {
  return caseStudies.find((study) => study.slug === slug) ?? null;
}

export function getWritingPostBySlug(slug: string): WritingPost | null {
  return writingPosts.find((post) => post.slug === slug) ?? null;
}

export function getAnyArticleBySlug(section: "case-studies" | "writing", slug: string) {
  return section === "case-studies" ? getCaseStudyBySlug(slug) : getWritingPostBySlug(slug);
}

export function getSeriesPosts(seriesName: string) {
  return writingPosts
    .filter((post) => post.series?.name === seriesName)
    .sort((a, b) => (a.series?.order ?? 0) - (b.series?.order ?? 0));
}

export function getArticleByPath(path: string): ArticleEntry | null {
  if (path.startsWith("/case-studies/")) {
    const slug = path.replace("/case-studies/", "");
    return getCaseStudyBySlug(slug);
  }
  if (path.startsWith("/writing/")) {
    const slug = path.replace("/writing/", "");
    return getWritingPostBySlug(slug);
  }
  return null;
}

export const featuredCaseStudySlugs = [
  "dspt-redesign",
  "rtanca",
  "product-management-when-mistakes-actually-matter",
] as const;

export const featuredWritingSlugs = [
  "ai-coding-part-1-why-i-stopped-feeling-guilty",
  "ai-coding-part-2-development-costs",
  "ai-coding-part-3-what-we-lose",
] as const;

export const aboutShort =
  "I am Adam Boon, based in Devon. I lead senior product work where public institutions meet messy reality — NHS cyber services, clinically weighted triage, live migration, assurance — and I build my own products so my judgment stays grounded in shipping, not only in meetings. This site ties that work into one readable line of thought.";

export type AboutSection = { title: string; paragraphs: readonly string[] };

export const aboutPageLead =
  "I am Adam Boon. I live and work in Devon, United Kingdom. I am a senior product leader with a long arc in NHS and national public-service delivery, and an independent builder across AI systems, structured learning, and consumer software. The two sides reinforce each other: the institution teaches consequence; independent building tests whether I still mean what I say when the safety net is smaller.";

export const aboutPageSections: readonly AboutSection[] = [
  {
    title: "Background",
    paragraphs: [
      "My product work has lived inside environments where “move fast” is not a moral slogan. I have led and shaped digital products through discovery, alpha, beta, and live operation while cyber frameworks shift, clinical safety matters, migration risk sits next to user pain, and governance is part of the product surface — not an afterthought.",
      "That context rewards a particular temperament: patience with ambiguity, impatience with vagueness, and a habit of making assumptions visible before they become incidents. It also rewards fluency across disciplines — not claiming expertise everywhere, but knowing enough to ask better questions and to broker decisions that survive contact with reality.",
    ],
  },
  {
    title: "How I work",
    paragraphs: [
      "I am user-centred in the unglamorous sense: research and design tied to prioritisation, roadmaps that admit trade-offs, backlogs that reflect what we decided not to do, and live metrics that inform the next increment rather than decorate a report.",
      "I care about narrative coherence inside teams — shared language between clinical, operational, engineering, and assurance partners — because most delivery failures are translation failures that hardened too early.",
      "I am sceptical of product theatre: workshops that substitute for decisions, roadmaps that pretend certainty, and AI features that exist to signal modernity. I prefer small honest slices of value to large fictional ones.",
    ],
  },
  {
    title: "Why I build independently",
    paragraphs: [
      "Restormel, SOPHIA, and PLOT are not a separate hobby lane. They are where I stress-test execution: architecture boundaries, governance UX, pedagogy and trust, and household behaviour over time. If I cannot maintain a product thoughtfully, that is information — it tightens how I lead inside larger organisations too.",
      "Writing on this site extends the same instinct: public, slow reasoning as a check on private certainty. Essays on AI and software economics sit next to case studies from NHS delivery because the through-line is judgment under constraint, not a tidy personal brand vertical.",
    ],
  },
  {
    title: "Problems I care about",
    paragraphs: [
      "Complex services that must stay safe, legible, and improvable while policy and technology move underneath them.",
      "AI in operational products where interpretability, accountability, and proportionate governance matter more than demo polish.",
      "Teams that need a senior product partner who can hold strategy and delivery in the same conversation — without collapsing either into slogans.",
    ],
  },
] as const;

export type NowSection = { title: string; paragraphs: readonly string[] };

export const nowPageIntro =
  "A short, current snapshot. I am Adam Boon, based in Devon — the details below are what I would tell you in a first conversation.";

export const nowPageSections: readonly NowSection[] = [
  {
    title: "Focus right now",
    paragraphs: [
      "Deepening the independent products as serious artefacts: Restormel (governance and routing for AI applications), SOPHIA (structured philosophy learning with disciplined use of models), and PLOT (privacy-first household operations starting from money rituals).",
      "Writing that stays slow and exacting — method in public, not content cadence for its own sake.",
      "Staying close to NHS and public-service shaped problems even when the immediate work is broader: assurance, safety, accessibility, and the ethics of shipping under institutional responsibility.",
    ],
  },
  {
    title: "Build themes",
    paragraphs: [
      "Interpretable control planes over opaque model behaviour.",
      "Products where trust is structural — pedagogy, consent, and clarity — not a marketing wrapper.",
      "Household-scale software that respects cognitive load and longevity over feature checklists.",
    ],
  },
  {
    title: "Roles and opportunities",
    paragraphs: [
      "I am open to senior product leadership (Head of Product, Director-level IC+leadership hybrids, or equivalent) where the work is genuinely complex: regulated or high-accountability services, multi-year roadmaps, live operations, and grown-up stakeholder landscapes.",
      "I am also open to selective collaborations — advisory or hands-on — where product judgment and delivery depth both matter, and where timelines respect the problem.",
    ],
  },
  {
    title: "The right fit",
    paragraphs: [
      "You value calm, evidence-led decisions and can tolerate plain language about risk.",
      "You want someone who has led in settings where mistakes are costly, and who still ships.",
      "You are not looking for a cheerleader for the latest toolkit; you want disciplined use of AI and platforms in real services.",
      "Remote-first or hybrid with sensible travel works; I am based in Devon and have long worked effectively with distributed national teams.",
    ],
  },
] as const;

/** Short paragraph for homepage “Now” preview card. */
export const nowContent =
  "Building out Restormel, SOPHIA, and PLOT with the same rigour I expect in public-service delivery; writing slowly on AI, cost, and craft; open to senior product roles and serious collaborations where complexity and accountability are real. Details on the Now page.";

export const contactPage = {
  heading: "Get in touch",
  intro:
    "I am Adam Boon, based in Devon, United Kingdom. If you are hiring for senior product leadership in a complex service environment, or exploring collaboration where strategy and execution are equally load-bearing, a direct conversation is the best next step.",
  conversationNote:
    "Useful emails tend to name the context (organisation, service area, seniority), what you are trying to decide in the next three to six months, and whether the role is delivery-heavy, discovery-heavy, or genuinely both.",
  ctaBridge: "Email for a considered first exchange; GitHub for code and artefacts; request a CV by email if you need the formal record.",
  closing:
    "I read everything that reflects that level of care. If there is a mutual fit, I will reply with the same.",
} as const;

export const contactContent = {
  body:
    "Adam Boon · Devon, United Kingdom. Hiring for a senior product role, or exploring collaboration where judgment and shipping both matter? Email is best for a substantive first exchange.",
  email: { label: "Email", href: `mailto:${siteIdentity.email}` },
  github: { label: "GitHub", href: siteIdentity.githubUrl },
  cv: {
    label: "Request CV",
    href: `mailto:${siteIdentity.email}?subject=CV%20request`,
  },
} as const;

/** Internal nav labels for article footers and cross-links. */
export const workCrossLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/now", label: "Now" },
  { href: "/case-studies", label: "Case studies" },
  { href: "/writing", label: "Writing" },
  { href: "/contact", label: "Contact" },
] as const;

export const writingIndexIntro = {
  eyebrow: "Essays",
  heading: "Writing",
  description:
    "Long-form pieces on AI-assisted software work, economics of delivery, craft, and product method. These are essays, not posts: written to clarify my own thinking and to leave a public trail of how conclusions were reached.",
} as const;

export const caseStudiesIndexIntro = {
  eyebrow: "Delivery",
  heading: "Case studies",
  description:
    "Reflective essays grounded in NHS and national public-service product work — cyber redesign, live migration, clinically weighted triage. Each piece is a delivery story with the politics and governance left in: what was at stake, what was traded off, and what stayed honest.",
} as const;
