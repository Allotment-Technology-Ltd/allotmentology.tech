ALTER TYPE "public"."collateral_kind" RENAME TO "collateral_kind_old";--> statement-breakpoint
CREATE TYPE "public"."collateral_kind" AS ENUM('founder_bio', 'company_overview', 'restormel_summary', 'restormel_keys_summary', 'sophia_summary', 'traction_note', 'budget_assumption', 'standard_answer', 'asset_reference');--> statement-breakpoint
ALTER TABLE "collateral_items" ALTER COLUMN "kind" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "collateral_items" ALTER COLUMN "kind" TYPE "public"."collateral_kind" USING (
  CASE "kind"::text
    WHEN 'bio' THEN 'founder_bio'::"public"."collateral_kind"
    WHEN 'executive_summary' THEN 'company_overview'::"public"."collateral_kind"
    WHEN 'impact_narrative' THEN 'company_overview'::"public"."collateral_kind"
    WHEN 'budget_summary' THEN 'budget_assumption'::"public"."collateral_kind"
    WHEN 'timeline' THEN 'standard_answer'::"public"."collateral_kind"
    WHEN 'other' THEN 'standard_answer'::"public"."collateral_kind"
    ELSE 'standard_answer'::"public"."collateral_kind"
  END
);--> statement-breakpoint
ALTER TABLE "collateral_items" ALTER COLUMN "kind" SET DEFAULT 'standard_answer'::"public"."collateral_kind";--> statement-breakpoint
DROP TYPE "public"."collateral_kind_old";--> statement-breakpoint
ALTER TABLE "collateral_items" ADD COLUMN "approved" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "collateral_items" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE TABLE "submission_pack_collateral_items" (
	"submission_pack_id" uuid NOT NULL,
	"collateral_item_id" uuid NOT NULL,
	CONSTRAINT "submission_pack_collateral_items_submission_pack_id_submission_packs_id_fk" FOREIGN KEY ("submission_pack_id") REFERENCES "public"."submission_packs"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "submission_pack_collateral_items_collateral_item_id_collateral_items_id_fk" FOREIGN KEY ("collateral_item_id") REFERENCES "public"."collateral_items"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "submission_pack_collateral_items_pkey" PRIMARY KEY("submission_pack_id","collateral_item_id")
);
