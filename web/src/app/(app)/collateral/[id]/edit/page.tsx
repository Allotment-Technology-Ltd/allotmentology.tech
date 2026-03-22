import Link from "next/link";
import { notFound } from "next/navigation";

import { loadCollateralDetail } from "../../actions";
import { CollateralFormClient } from "../../collateral-form-client";

export const dynamic = "force-dynamic";

export default async function EditCollateralPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await loadCollateralDetail(id);
  if (!data) notFound();

  const item = data.item;
  const tags = (item.tags ?? []).join(", ");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            Edit collateral
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Current version v{item.version} · saving creates v{item.version + 1}
          </p>
        </div>
        <Link
          href={`/collateral/${id}`}
          className="text-sm text-zinc-400 hover:text-zinc-200"
        >
          ← View
        </Link>
      </div>
      <CollateralFormClient
        collateralId={id}
        defaultTitle={item.title}
        defaultKind={item.kind}
        defaultBody={item.body}
        defaultTags={tags}
        defaultApproved={item.approved}
        submitLabel="Save changes"
      />
    </div>
  );
}
