/** User- or system-supplied facts (database, documents, forms). */
export type VerifiedContent<T> = {
  readonly provenance: "verified";
  /** Short label, e.g. "opportunity row", "collateral v3", "founder upload". */
  readonly sourceLabel: string;
  readonly value: T;
};

/** Model-generated content; always review before external use. */
export type GeneratedContent<T> = {
  readonly provenance: "generated";
  readonly model: string;
  readonly logId: string;
  readonly value: T;
};

export function asVerified<T>(value: T, sourceLabel: string): VerifiedContent<T> {
  return { provenance: "verified", sourceLabel, value };
}

export function asGenerated<T>(
  value: T,
  meta: { model: string; logId: string },
): GeneratedContent<T> {
  return {
    provenance: "generated",
    model: meta.model,
    logId: meta.logId,
    value,
  };
}

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AiModuleKind = "subagent" | "skill";
