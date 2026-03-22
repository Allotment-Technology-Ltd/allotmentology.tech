import { redirect } from "next/navigation";

/** @deprecated Use `/submission-packs` (delivery plan route name). */
export default function SubmissionsAliasPage() {
  redirect("/submission-packs");
}
