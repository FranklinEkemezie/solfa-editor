import type { PartId } from '@/domain/parts';

/**
 * The settings a voice brings to its notation.
 *
 * The reference octave is where a bare pitch sits before any octave modifier.
 * It lives with the voice, not in the DSL, so the same written line can be
 * given to different parts without rewriting a single syllable.
 */
export type VoiceSettings = {
    readonly referenceOctave: number;
};

/**
 * The editor's four voices, spread across their natural registers.
 *
 * Soprano and alto sit an octave apart, and the men's voices another one and
 * two below the alto, which keeps the four parts from colliding when they are
 * played together.
 */
export const VOICE_SETTINGS: Record<PartId, VoiceSettings> = {
    soprano: { referenceOctave: 5 },
    alto: { referenceOctave: 4 },
    tenor: { referenceOctave: 3 },
    bass: { referenceOctave: 2 },
};

/** The octave a bare pitch in this voice starts from. */
export function referenceOctave(part: PartId): number {
    return VOICE_SETTINGS[part].referenceOctave;
}
