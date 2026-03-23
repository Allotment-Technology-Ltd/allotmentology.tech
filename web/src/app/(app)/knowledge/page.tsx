import { createKnowledgeAsset, addWritingStyleSample, deleteKnowledgeAsset, deleteWritingStyleSample, loadKnowledgePageData, saveWritingStyleProfile } from "./actions";

export const dynamic = "force-dynamic";

const card = "space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/30 p-5";
const input =
  "w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100";

export default async function KnowledgePage() {
  const data = await loadKnowledgePageData();
  if (!data) return null;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Knowledge base
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">
          Materials and writing style
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">
          Store reusable source material (including repository links), then maintain a style profile and samples so AI drafts match your voice.
        </p>
      </div>

      <section className={card}>
        <h2 className="text-lg font-medium text-zinc-100">Add knowledge asset</h2>
        <form action={createKnowledgeAsset} className="space-y-2">
          <input name="title" required placeholder="Title" className={input} />
          <input name="url" required type="url" placeholder="https://…" className={input} />
          <div className="grid gap-2 sm:grid-cols-2">
            <select name="sourceType" className={input} defaultValue="repository">
              <option value="repository">repository</option>
              <option value="document">document</option>
              <option value="file">file</option>
              <option value="portal">portal</option>
              <option value="other">other</option>
            </select>
            <input name="tags" placeholder="tag1, tag2" className={input} />
          </div>
          <textarea
            name="summary"
            rows={2}
            placeholder="Short summary (optional)"
            className={input}
          />
          <button
            type="submit"
            className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-white"
          >
            Save asset
          </button>
        </form>
      </section>

      <section className={card}>
        <h2 className="text-lg font-medium text-zinc-100">Asset library</h2>
        {data.assets.length === 0 ? (
          <p className="text-sm text-zinc-500">No assets yet.</p>
        ) : (
          <ul className="space-y-2">
            {data.assets.map((a) => (
              <li
                key={a.id}
                className="flex items-start justify-between gap-3 rounded-md border border-zinc-800 p-3 text-sm"
              >
                <div>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-sky-400 hover:text-sky-300 hover:underline"
                  >
                    {a.title}
                  </a>
                  <p className="text-xs text-zinc-500">{a.sourceType}</p>
                  {a.summary ? <p className="mt-1 text-zinc-400">{a.summary}</p> : null}
                </div>
                <form action={deleteKnowledgeAsset}>
                  <input type="hidden" name="id" value={a.id} />
                  <button className="text-xs text-red-400 hover:text-red-300">
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={card}>
        <h2 className="text-lg font-medium text-zinc-100">Writing style profile</h2>
        <form action={saveWritingStyleProfile} className="space-y-2">
          <input
            name="profileName"
            required
            defaultValue={data.profile?.profileName ?? "Default"}
            className={input}
          />
          <textarea
            name="voiceDescription"
            required
            rows={3}
            defaultValue={data.profile?.voiceDescription ?? ""}
            placeholder="Describe your default voice/tone."
            className={input}
          />
          <textarea
            name="styleGuardrailsMd"
            required
            rows={4}
            defaultValue={data.profile?.styleGuardrailsMd ?? ""}
            placeholder="Markdown guardrails (must/avoid)."
            className={input}
          />
          <textarea
            name="bannedPhrases"
            rows={3}
            defaultValue={(data.profile?.bannedPhrases ?? []).join("\n")}
            placeholder="One banned phrase per line."
            className={input}
          />
          <textarea
            name="preferredStructure"
            rows={2}
            defaultValue={data.profile?.preferredStructure ?? ""}
            placeholder="Preferred structure (optional)."
            className={input}
          />
          <button
            type="submit"
            className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-white"
          >
            Save style profile
          </button>
        </form>
      </section>

      <section className={card}>
        <h2 className="text-lg font-medium text-zinc-100">Writing samples</h2>
        <form action={addWritingStyleSample} className="space-y-2">
          <input name="title" required placeholder="Sample title" className={input} />
          <input name="sourceUrl" type="url" placeholder="Source URL (optional)" className={input} />
          <textarea
            name="sampleText"
            required
            rows={5}
            placeholder="Paste a representative writing sample."
            className={input}
          />
          <textarea name="notes" rows={2} placeholder="Notes (optional)" className={input} />
          <button
            type="submit"
            className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-white"
          >
            Add sample
          </button>
        </form>
        {data.samples.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {data.samples.map((s) => (
              <li key={s.id} className="rounded-md border border-zinc-800 p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-zinc-200">{s.title}</p>
                  <form action={deleteWritingStyleSample}>
                    <input type="hidden" name="id" value={s.id} />
                    <button className="text-xs text-red-400 hover:text-red-300">Delete</button>
                  </form>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-zinc-400">{s.sampleText}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
