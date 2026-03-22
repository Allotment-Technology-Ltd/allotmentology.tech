/**
 * Parse model output that should be JSON; tolerate optional ```json fences.
 */
export function parseModelJson(text: string): unknown {
  const t = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/im.exec(t);
  const inner = fence ? fence[1].trim() : t;
  try {
    return JSON.parse(inner);
  } catch {
    throw new SyntaxError("Model output is not valid JSON.");
  }
}
