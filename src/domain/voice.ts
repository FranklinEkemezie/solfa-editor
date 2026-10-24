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
 * Soprano and alto share the middle octave, while tenor and bass sit an octave
 * below them. The parts keep their own written lines; the reference octave only
 * decides where a bare pitch sounds when the score is played.
 */
export const VOICE_SETTINGS: Record<PartId, VoiceSettings> = {
    soprano: { referenceOctave: 4 },
    alto: { referenceOctave: 4 },
    tenor: { referenceOctave: 3 },
    bass: { referenceOctave: 3 },
};

/** The octave a bare pitch in this voice starts from. */
export function referenceOctave(part: PartId): number {
    return VOICE_SETTINGS[part].referenceOctave;
}
