import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  smallint,
  numeric,
  boolean,
  integer,
  primaryKey,
  jsonb,
} from "drizzle-orm/pg-core";
import {
  opportunityStatusEnum,
  collateralKindEnum,
  submissionPackStatusEnum,
  taskStatusEnum,
  conflictSeverityEnum,
  watchlistSourceTypeEnum,
  knowledgeAssetTypeEnum,
} from "./enums";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  displayName: varchar("display_name", { length: 255 }),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const opportunities = pgTable("opportunities", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  summary: text("summary"),
  funderName: varchar("funder_name", { length: 255 }),
  closesAt: timestamp("closes_at", { withTimezone: true }),
  status: opportunityStatusEnum("status").notNull().default("draft"),
  eligibilityNotes: text("eligibility_notes"),
  internalNotes: text("internal_notes"),
  estimatedValue: numeric("estimated_value", { precision: 14, scale: 2 }),
  currencyCode: varchar("currency_code", { length: 3 }).notNull().default("GBP"),
  ownerUserId: uuid("owner_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  /** Official funding call / programme page URL */
  grantUrl: text("grant_url"),
  /** AI-generated product eligibility weighting and rationale (markdown) */
  productFitAssessmentMd: text("product_fit_assessment_md"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const opportunityScores = pgTable("opportunity_scores", {
  id: uuid("id").primaryKey().defaultRandom(),
  opportunityId: uuid("opportunity_id")
    .notNull()
    .unique()
    .references(() => opportunities.id, { onDelete: "cascade" }),
  /** 1–5: how well we meet stated eligibility */
  eligibilityFit: smallint("eligibility_fit"),
  /** 1–5: alignment with Restormel / community access narrative */
  restormelFit: smallint("restormel_fit"),
  /** 1–5: alignment with SOPHIA / product evidence story */
  sophiaFit: smallint("sophia_fit"),
  /** 1–5: relative cash / funding value of the award */
  cashValue: smallint("cash_value"),
  /** 1–5: how much this reduces burn or runway pressure */
  burnReductionValue: smallint("burn_reduction_value"),
  /** 1–5: effort required (1 = light, 5 = heavy); heavy reduces weighted score */
  effortRequired: smallint("effort_required"),
  /** 1–5: strategic importance beyond cash */
  strategicValue: smallint("strategic_value"),
  /** 1–5: time sensitivity / deadline pressure */
  timeSensitivity: smallint("time_sensitivity"),
  rationale: text("rationale"),
  scoredByUserId: uuid("scored_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  scoredAt: timestamp("scored_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const collateralItems = pgTable("collateral_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 512 }).notNull(),
  kind: collateralKindEnum("kind").notNull().default("standard_answer"),
  /** Markdown body */
  body: text("body").notNull(),
  tags: text("tags").array(),
  approved: boolean("approved").notNull().default(false),
  version: integer("version").notNull().default(1),
  createdByUserId: uuid("created_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const submissionPacks = pgTable("submission_packs", {
  id: uuid("id").primaryKey().defaultRandom(),
  opportunityId: uuid("opportunity_id")
    .notNull()
    .references(() => opportunities.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 512 }).notNull(),
  status: submissionPackStatusEnum("status").notNull().default("draft"),
  workingThesis: text("working_thesis").notNull().default(""),
  projectFraming: text("project_framing").notNull().default(""),
  summary100: text("summary_100").notNull().default(""),
  summary250: text("summary_250").notNull().default(""),
  /** Single Markdown workbook for funder forms: limits, checkboxes, uploads, etc. */
  applicationFormsMd: text("application_forms_md").notNull().default(""),
  draftAnswersMd: text("draft_answers_md").notNull().default(""),
  missingInputsMd: text("missing_inputs_md").notNull().default(""),
  risksMd: text("risks_md").notNull().default(""),
  checklistMd: text("checklist_md").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Links submission packs to collateral items they reuse (many-to-many). */
export const submissionPackCollateralItems = pgTable(
  "submission_pack_collateral_items",
  {
    submissionPackId: uuid("submission_pack_id")
      .notNull()
      .references(() => submissionPacks.id, { onDelete: "cascade" }),
    collateralItemId: uuid("collateral_item_id")
      .notNull()
      .references(() => collateralItems.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({
      columns: [t.submissionPackId, t.collateralItemId],
    }),
  ],
);

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  dueAt: timestamp("due_at", { withTimezone: true }),
  status: taskStatusEnum("status").notNull().default("todo"),
  opportunityId: uuid("opportunity_id").references(() => opportunities.id, {
    onDelete: "set null",
  }),
  submissionPackId: uuid("submission_pack_id").references(
    () => submissionPacks.id,
    { onDelete: "set null" },
  ),
  assigneeUserId: uuid("assignee_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const applicationConflicts = pgTable("application_conflicts", {
  id: uuid("id").primaryKey().defaultRandom(),
  opportunityId: uuid("opportunity_id").references(() => opportunities.id, {
    onDelete: "set null",
  }),
  title: varchar("title", { length: 512 }).notNull(),
  detail: text("detail"),
  severity: conflictSeverityEnum("severity").notNull().default("medium"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sourceWatchlist = pgTable("source_watchlist", {
  id: uuid("id").primaryKey().defaultRandom(),
  url: text("url").notNull(),
  label: varchar("label", { length: 512 }),
  sourceType: watchlistSourceTypeEnum("source_type").notNull().default("manual"),
  lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const knowledgeAssets = pgTable("knowledge_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 512 }).notNull(),
  sourceType: knowledgeAssetTypeEnum("source_type").notNull().default("document"),
  url: text("url").notNull(),
  summary: text("summary"),
  tags: text("tags").array(),
  createdByUserId: uuid("created_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const opportunityKnowledgeAssets = pgTable(
  "opportunity_knowledge_assets",
  {
    opportunityId: uuid("opportunity_id")
      .notNull()
      .references(() => opportunities.id, { onDelete: "cascade" }),
    knowledgeAssetId: uuid("knowledge_asset_id")
      .notNull()
      .references(() => knowledgeAssets.id, { onDelete: "cascade" }),
    relevanceNote: text("relevance_note"),
    priority: smallint("priority").notNull().default(3),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({
      columns: [t.opportunityId, t.knowledgeAssetId],
    }),
  ],
);

export const writingStyleProfiles = pgTable("writing_style_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerUserId: uuid("owner_user_id")
    .notNull()
    .references(() => users.id, {
      onDelete: "cascade",
    })
    .unique(),
  profileName: varchar("profile_name", { length: 255 }).notNull().default("Default"),
  voiceDescription: text("voice_description").notNull().default(""),
  styleGuardrailsMd: text("style_guardrails_md").notNull().default(""),
  bannedPhrases: text("banned_phrases").array(),
  preferredStructure: text("preferred_structure"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const writingStyleSamples = pgTable("writing_style_samples", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => writingStyleProfiles.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 512 }).notNull(),
  sourceUrl: text("source_url"),
  sampleText: text("sample_text").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Per-user OpenAI-compatible API keys (one or many). Revoked rows stay for audit;
 * `is_default` picks which key the writing agent uses.
 * `api_key_stored` is plaintext unless BYOK_ENCRYPTION_KEY is set (see byok-secret).
 */
export const userAiProviderKeys = pgTable("user_ai_provider_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 255 }),
  providerName: varchar("provider_name", { length: 255 }).notNull().default("Custom"),
  baseUrl: text("base_url").notNull(),
  model: varchar("model", { length: 512 }).notNull(),
  apiKeyStored: text("api_key_stored").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Audit trail for AI subagent/skill calls (Phase 8). */
export const aiGenerationLogs = pgTable("ai_generation_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  opportunityId: uuid("opportunity_id").references(() => opportunities.id, {
    onDelete: "set null",
  }),
  moduleKind: varchar("module_kind", { length: 32 }).notNull(),
  moduleName: varchar("module_name", { length: 64 }).notNull(),
  providerModel: varchar("provider_model", { length: 128 }).notNull(),
  inputJson: jsonb("input_json").$type<Record<string, unknown>>().notNull(),
  outputJson: jsonb("output_json").$type<Record<string, unknown>>().notNull(),
  usageJson: jsonb("usage_json").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
