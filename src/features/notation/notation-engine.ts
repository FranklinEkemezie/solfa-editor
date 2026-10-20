import type { Diagnostic } from '@/features/notation/diagnostics';
import type { VoiceNotation } from '@/features/notation/musical-ir';
import { parseVoiceSource } from '@/features/notation/parser';
import { analyseVoice } from '@/features/notation/semantic-analysis';
import type { VoiceSettings } from '@/domain/voice';

export type VoiceNotationResult =
    | { readonly ok: true; readonly notation: VoiceNotation }
    | { readonly ok: false; readonly diagnostics: readonly Diagnostic[] };

/**
 * Read one voice's source into musical events.
 *
 * This is the engine's public entry point: tokenisation, parsing and semantic
 * analysis happen behind it, and a caller sees either a complete voice or the
 * diagnostic that stopped it. The source is not modified in any way — it is the
 * document's single editable truth.
 */
export function parseVoice(source: string, settings: VoiceSettings): VoiceNotationResult {
    const parsed = parseVoiceSource(source);
    if (!parsed.ok) {
        return { ok: false, diagnostics: [parsed.diagnostic] };
    }
    return { ok: true, notation: analyseVoice(source, parsed.tree, settings) };
}
