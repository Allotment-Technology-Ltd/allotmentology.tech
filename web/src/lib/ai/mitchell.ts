import { buildLayeredSystemPrompt } from "@/lib/ai/constitution";

export { MITCHELL_VOICE_OVERLAY } from "@/lib/ai/constitution";

/**
 * @deprecated Same as {@link buildLayeredSystemPrompt}; Mitchell is the default app voice.
 * Kept for call sites that still import this name.
 */
export function buildMitchellSystemPrompt(moduleDirective: string): string {
  return buildLayeredSystemPrompt(moduleDirective);
}
