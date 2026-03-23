import "dotenv/config";
import { createDb } from "./index";
import {
  loadInitialCollateralPackFromDisk,
  resolveInitialCollateralPackPath,
} from "./initial-collateral-pack";
import {
  users,
  opportunities,
  opportunityScores,
  collateralItems,
  knowledgeAssets,
  opportunityKnowledgeAssets,
  submissionPacks,
  tasks,
  applicationConflicts,
  sourceWatchlist,
  writingStyleProfiles,
  writingStyleSamples,
} from "./schema";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required to seed.");
  process.exit(1);
}

const db = createDb(url);

async function main() {
  const [u1] = await db
    .insert(users)
    .values({
      email: "founder@allotment.technology",
      displayName: "Founder",
    })
    .returning({ id: users.id });

  const [u2] = await db
    .insert(users)
    .values({
      email: "ops@allotment.technology",
      displayName: "Funding ops",
    })
    .returning({ id: users.id });

  const [opp1] = await db
    .insert(opportunities)
    .values({
      title: "Innovate UK Smart grant — SOPHIA-aligned R&D",
      summary:
        "Competitive R&D grant; strong fit if we frame delivery evidence and risk controls clearly.",
      funderName: "Innovate UK",
      status: "shortlisted",
      ownerUserId: u1.id,
      closesAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21),
    })
    .returning({ id: opportunities.id });

  const [opp2] = await db
    .insert(opportunities)
    .values({
      title: "Foundations programme — Restormel community tooling",
      summary:
        "Smaller programme; useful for narrative alignment and partner references.",
      funderName: "Regional trust",
      status: "in_progress",
      ownerUserId: u2.id,
      closesAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45),
    })
    .returning({ id: opportunities.id });

  await db.insert(opportunityScores).values({
    opportunityId: opp1.id,
    eligibilityFit: 4,
    restormelFit: 3,
    sophiaFit: 5,
    cashValue: 4,
    burnReductionValue: 4,
    effortRequired: 4,
    strategicValue: 4,
    timeSensitivity: 4,
    rationale:
      "Strong SOPHIA story; eligibility solid; heavier effort and tight timeline.",
    scoredByUserId: u1.id,
  });

  await db.insert(opportunityScores).values({
    opportunityId: opp2.id,
    eligibilityFit: 4,
    restormelFit: 5,
    sophiaFit: 2,
    cashValue: 2,
    burnReductionValue: 3,
    effortRequired: 2,
    strategicValue: 3,
    timeSensitivity: 2,
    rationale: "Lower lift; good for pipeline balance while larger bids mature.",
    scoredByUserId: u2.id,
  });

  const packPath = resolveInitialCollateralPackPath();
  const fromPack =
    packPath != null ? loadInitialCollateralPackFromDisk(packPath) : [];

  if (fromPack.length > 0) {
    console.log(
      `Seeding ${fromPack.length} collateral items from initial pack:`,
      packPath,
    );
    await db.insert(collateralItems).values(
      fromPack.map((row) => ({
        title: row.title,
        kind: row.kind,
        body: row.body,
        tags: ["initial-pack", row.slug],
        approved: true,
        version: 1,
        createdByUserId: u1.id,
      })),
    );
  } else {
    console.warn(
      "funding-collateral-initial-pack-refined.md not found next to web/ or in cwd — using minimal demo collateral.",
    );
    await db.insert(collateralItems).values([
      {
        title: "Company bio — 180 words",
        kind: "founder_bio",
        body: "Allotment Technology Ltd builds operator-grade tools for community infrastructure…",
        tags: ["bio", "general"],
        approved: true,
        version: 1,
        createdByUserId: u1.id,
      },
      {
        title: "Impact narrative — keys and access",
        kind: "restormel_keys_summary",
        body: "We reduce friction for councils and residents by making allocation and access auditable…",
        tags: ["restormel", "keys"],
        approved: true,
        version: 2,
        createdByUserId: u1.id,
      },
    ]);
  }

  const [pack1] = await db
    .insert(submissionPacks)
    .values({
      opportunityId: opp1.id,
      title: "Innovate UK — first draft pack",
      status: "in_review",
      workingThesis:
        "We will use this award to harden Restormel Keys for multi-tenant council rollout while preserving auditability.",
      projectFraming:
        "Phase 1: integration and security review. Phase 2: pilot with two partner councils. Phase 3: scale playbook.",
      summary100:
        "Allotment Technology delivers operator-grade allocation and access tooling for councils. This bid funds product hardening and a structured pilot so we can evidence adoption, support burden, and compliance outcomes before national rollout.",
      summary250:
        "Community infrastructure programmes depend on fair allocation and traceable access to physical assets (e.g. allotment keys). Our platform, Restormel Keys, gives councils a controlled workflow from application to handover with an audit trail. The requested funding covers engineering time to finish multi-tenant controls, improve operator UX for high-volume sites, and run a two-council pilot with success metrics agreed up front. Outputs include a deployment guide, training materials, and a short impact note suitable for follow-on public-sector bids.",
      draftAnswersMd:
        "## Q: What problem are you solving?\nCouncils lose time reconciling who holds which keys and whether returns happened on time.\n\n## Q: Why your team?\nWe ship production software and have operator feedback loops from live pilots.\n",
      missingInputsMd: "- Signed partner MOU (draft in progress)\n- Final budget line for external security review",
      risksMd:
        "- **Pilot uptake**: Mitigation — pre-commit slot time with council ops leads.\n- **Integration variance**: Mitigation — scope pilot sites to similar access-control setups.",
      checklistMd:
        "- [ ] Confirm match funding letters of support\n- [x] Export financial annex from accountant\n- [ ] Paste portal answers into draft_answers_md",
    })
    .returning({ id: submissionPacks.id });

  await db.insert(tasks).values([
    {
      title: "Confirm match funding letters of support",
      status: "blocked",
      dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      opportunityId: opp1.id,
      submissionPackId: pack1.id,
      assigneeUserId: u2.id,
    },
    {
      title: "Export financial annex from accountant",
      status: "todo",
      dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10),
      opportunityId: opp1.id,
      assigneeUserId: u1.id,
    },
    {
      title: "Draft partner quotes for community outcomes",
      status: "in_progress",
      opportunityId: opp2.id,
      assigneeUserId: u2.id,
    },
  ]);

  await db.insert(applicationConflicts).values([
    {
      opportunityId: opp1.id,
      title: "Eligibility — UK entity vs subcontracting",
      detail:
        "Question whether subcontract structure meets programme rules; needs programme manager clarification.",
      severity: "high",
    },
    {
      opportunityId: opp2.id,
      title: "Budget line mapping",
      detail: "Travel line may need splitting across milestones.",
      severity: "low",
      resolvedAt: new Date(),
    },
  ]);

  await db.insert(sourceWatchlist).values([
    {
      url: "https://apply-for-innovation-funding.service.gov.uk/",
      label: "UK Gov funding finder",
      sourceType: "funder_portal",
      notes: "Check weekly for Smart and related competitions.",
    },
    {
      url: "https://example.org/funding-digest",
      label: "Sector newsletter (demo)",
      sourceType: "newsletter",
      lastCheckedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    },
  ]);

  const knowledgeRows = await db
    .insert(knowledgeAssets)
    .values([
      {
        title: "Restormel Keys repository",
        sourceType: "repository",
        url: "https://github.com/Allotment-Technology-Ltd/allotmentology.tech",
        summary: "Primary product codebase for funding operations and submissions.",
        tags: ["restormel", "repo", "core"],
        createdByUserId: u1.id,
      },
      {
        title: "Delivery plan",
        sourceType: "document",
        url: "file://allotment-technology-funding-ops-sequenced-delivery-plan.md",
        summary: "Sequenced scope, phases, and operating constraints.",
        tags: ["plan", "scope"],
        createdByUserId: u1.id,
      },
      {
        title: "Initial collateral pack",
        sourceType: "document",
        url: "file://funding-collateral-initial-pack-refined.md",
        summary: "Baseline reusable content for grant applications.",
        tags: ["collateral", "seed"],
        createdByUserId: u2.id,
      },
    ])
    .returning({ id: knowledgeAssets.id });

  await db.insert(opportunityKnowledgeAssets).values([
    {
      opportunityId: opp1.id,
      knowledgeAssetId: knowledgeRows[0].id,
      relevanceNote: "Reference delivery evidence and operational readiness.",
      priority: 5,
    },
    {
      opportunityId: opp1.id,
      knowledgeAssetId: knowledgeRows[2].id,
      relevanceNote: "Use for reusable narrative snippets and factual background.",
      priority: 4,
    },
    {
      opportunityId: opp2.id,
      knowledgeAssetId: knowledgeRows[1].id,
      relevanceNote: "Align narrative with the staged delivery roadmap.",
      priority: 3,
    },
  ]);

  const [styleProfile] = await db
    .insert(writingStyleProfiles)
    .values({
      ownerUserId: u1.id,
      profileName: "Founder default style",
      voiceDescription:
        "Plainspoken UK operator tone: specific, evidence-led, no hype or inflated claims.",
      styleGuardrailsMd:
        "- Keep claims tied to evidence.\n- Prefer short declarative sentences.\n- Avoid generic AI phrases and marketing filler.",
      bannedPhrases: [
        "world-class solution",
        "game-changing platform",
        "revolutionary",
      ],
      preferredStructure:
        "Problem -> evidence -> delivery approach -> measurable outcomes -> risks.",
    })
    .returning({ id: writingStyleProfiles.id });

  await db.insert(writingStyleSamples).values([
    {
      profileId: styleProfile.id,
      title: "Sample founder paragraph",
      sampleText:
        "We are solving an operational reliability problem, not a branding problem. Councils need a clear audit trail for key allocation and returns. Our approach is to keep workflows short, visible, and measurable so officers can defend decisions with evidence.",
      notes: "Crisp, practical tone.",
    },
    {
      profileId: styleProfile.id,
      title: "Sample risk framing",
      sampleText:
        "The main risk is delivery variance between pilot sites. We mitigate this by scoping integrations early and agreeing minimum readiness criteria before implementation starts.",
      notes: "Explicit risk and mitigation style.",
    },
  ]);

  console.log("Seed completed.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
