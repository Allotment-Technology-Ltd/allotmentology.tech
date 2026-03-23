import Link from "next/link";

export default function SetupPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-lg flex-col justify-center gap-6 px-6 py-12">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Funding ops
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-50">
          Configure Neon Auth
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          This deployment does not have a valid{" "}
          <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-200">
            NEON_AUTH_BASE_URL
          </code>{" "}
          in Vercel (or it is still a placeholder). Add the Auth URL from Neon
          Console → Branch → Auth → Configuration, then redeploy.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          You also need{" "}
          <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-200">
            DATABASE_URL
          </code>{" "}
          for the app shell and data. See{" "}
          <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-200">
            DEPLOYMENT.md
          </code>{" "}
          in the repo.
        </p>
      </div>
      <p className="text-xs text-zinc-500">
        After variables are set, open the app again — you should be redirected
        to sign-in.
      </p>
      <Link
        href="https://github.com/Allotment-Technology-Ltd/allotmentology.tech"
        className="text-sm text-sky-400 underline-offset-2 hover:text-sky-300 hover:underline"
      >
        Repository
      </Link>
    </main>
  );
}
