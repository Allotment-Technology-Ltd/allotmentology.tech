import Link from "next/link";

type SeriesNavigationProps = {
  seriesName: string;
  currentPart: number;
  totalParts: number;
  previousHref?: string;
  nextHref?: string;
};

export function SeriesNavigation({
  seriesName,
  currentPart,
  totalParts,
  previousHref,
  nextHref,
}: SeriesNavigationProps) {
  return (
    <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/35 p-5">
      <p className="text-xs text-zinc-500">
        {seriesName} · Part {currentPart} of {totalParts}
      </p>
      <div className="flex flex-wrap gap-4 text-sm">
        {previousHref ? (
          <Link
            href={previousHref}
            className="text-sky-400 hover:text-sky-300 hover:underline"
          >
            Previous part
          </Link>
        ) : null}
        {nextHref ? (
          <Link
            href={nextHref}
            className="text-sky-400 hover:text-sky-300 hover:underline"
          >
            Next part
          </Link>
        ) : null}
      </div>
    </div>
  );
}
