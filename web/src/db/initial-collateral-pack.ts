import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import type { CollateralKind } from "@/lib/collateral/constants";

export type ParsedCollateralSection = {
  slug: string;
  title: string;
  kind: CollateralKind;
  body: string;
};

/** Resolve `funding-collateral-initial-pack-refined.md` from repo root or cwd. */
export function resolveInitialCollateralPackPath(): string | null {
  const candidates = [
    path.resolve(process.cwd(), "..", "funding-collateral-initial-pack-refined.md"),
    path.resolve(process.cwd(), "funding-collateral-initial-pack-refined.md"),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

function cleanSectionBody(raw: string): string {
  return raw
    .split("\n")
    .filter((line) => !/^\s*---\s*$/.test(line))
    .join("\n")
    .trim();
}

/** Split markdown on `## slug` headings (first chunk before first ## is ignored). */
export function parseCollateralPackMarkdown(md: string): { slug: string; body: string }[] {
  const chunks = md.split(/^## /m);
  const out: { slug: string; body: string }[] = [];
  for (let i = 1; i < chunks.length; i++) {
    const chunk = chunks[i];
    const nl = chunk.indexOf("\n");
    if (nl === -1) continue;
    const slug = chunk.slice(0, nl).trim();
    if (!slug || /\s/.test(slug)) continue;
    const body = cleanSectionBody(chunk.slice(nl + 1));
    if (body.length > 0) out.push({ slug, body });
  }
  return out;
}

function slugToKindAndTitle(slug: string): { kind: CollateralKind; title: string } {
  const human = (s: string) =>
    s
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  switch (slug) {
    case "founder_bio":
      return { kind: "founder_bio", title: "Founder bio (full)" };
    case "founder_bio_short":
      return { kind: "founder_bio", title: "Founder bio (short)" };
    case "founder_bio_competition_version":
      return { kind: "founder_bio", title: "Founder bio (competition)" };
    case "founder_relevant_experience_bullets":
      return {
        kind: "traction_note",
        title: "Founder relevant experience (bullets)",
      };
    case "company_overview":
      return { kind: "company_overview", title: "Company overview" };
    case "restormel_summary":
      return { kind: "restormel_summary", title: "Restormel summary" };
    case "restormel_keys_summary":
      return {
        kind: "restormel_keys_summary",
        title: "Restormel Keys summary",
      };
    case "sophia_summary":
      return { kind: "sophia_summary", title: "SOPHIA summary" };
    case "current_product_status":
      return { kind: "traction_note", title: "Current product status" };
    case "funding_goal_and_runway_target":
      return {
        kind: "budget_assumption",
        title: "Funding goal and runway target",
      };
    case "budget_assumptions":
      return { kind: "budget_assumption", title: "Budget assumptions" };
    case "notes_for_use":
      return { kind: "standard_answer", title: "Notes for use (library)" };
    default:
      if (slug.startsWith("standard_answer_")) {
        const rest = human(slug.replace(/^standard_answer_/, ""));
        return {
          kind: "standard_answer",
          title: `Standard answer: ${rest}`,
        };
      }
      return { kind: "standard_answer", title: human(slug) };
  }
}

export function loadInitialCollateralPackFromDisk(
  filePath: string,
): ParsedCollateralSection[] {
  const md = readFileSync(filePath, "utf8");
  return parseCollateralPackMarkdown(md).map(({ slug, body }) => {
    const { kind, title } = slugToKindAndTitle(slug);
    return { slug, title, kind, body };
  });
}
