export const COLLATERAL_KINDS = [
  "founder_bio",
  "company_overview",
  "restormel_summary",
  "restormel_keys_summary",
  "sophia_summary",
  "traction_note",
  "budget_assumption",
  "standard_answer",
  "asset_reference",
] as const;

export type CollateralKind = (typeof COLLATERAL_KINDS)[number];

export const COLLATERAL_KIND_LABEL: Record<CollateralKind, string> = {
  founder_bio: "Founder bio",
  company_overview: "Company overview",
  restormel_summary: "Restormel summary",
  restormel_keys_summary: "Restormel Keys summary",
  sophia_summary: "SOPHIA summary",
  traction_note: "Traction note",
  budget_assumption: "Budget assumption",
  standard_answer: "Standard answer",
  asset_reference: "Asset reference",
};
