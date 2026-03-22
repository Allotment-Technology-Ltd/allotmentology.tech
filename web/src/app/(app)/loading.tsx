export default function AppLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pt-1">
      <div className="animate-pulse space-y-3">
        <div className="h-8 w-56 rounded-md bg-zinc-800/90" />
        <div className="h-4 w-full max-w-xl rounded-md bg-zinc-800/50" />
        <div className="h-4 w-2/3 max-w-lg rounded-md bg-zinc-800/40" />
      </div>
      <div className="animate-pulse rounded-lg border border-zinc-800/80 bg-zinc-900/20 p-6">
        <div className="space-y-3">
          <div className="h-4 w-full rounded bg-zinc-800/60" />
          <div className="h-4 w-full rounded bg-zinc-800/50" />
          <div className="h-4 w-4/5 rounded bg-zinc-800/40" />
        </div>
      </div>
      <p className="text-center text-xs text-zinc-600">Loading…</p>
    </div>
  );
}
