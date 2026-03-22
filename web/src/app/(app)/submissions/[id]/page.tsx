import { redirect } from "next/navigation";

/** @deprecated Use `/submission-packs/[id]`. */
export default async function SubmissionPackAliasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/submission-packs/${id}`);
}
