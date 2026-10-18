import type { ScorePreset } from '@/features/score-editor/presets/score-preset';

/**
 * Sir Jude Nnam, "Gloria" — a second sample, kept as an alternative to the
 * default so the editor can be pointed at a different score by editing one
 * line in `presets/index.ts`.
 *
 * Transcribed from `docs/sample/sample_solfa_sheet_music_gloria_jude_nnam.webp`.
 * The details (title, composer, key, tempo, four parts) follow the sheet; the
 * handwritten notes are read as a plausible opening of the same shape rather
 * than as a critical edition, and no lyrics are written.
 */
export const gloriaJudeNnam: ScorePreset = {
    title: 'Gloria',
    author: 'Sir Jude Nnam',
    key: 'E-MAJOR-FLAT-3',
    timeSignature: '4/QUARTER',
    tempo: { beatsPerMinute: 110, description: 'Allegretto' },
    parts: {
        soprano:
            'd : m : s : l | s : - : m : - | f : m : r : d | r : - : - : - | d : m : s : l | s : - : l : - | m : r : d : r | d : - : - : -',
        alto: 'm : d : m : f | m : - : d : - | l : s : f : m | f : - : - : - | m : d : m : f | m : - : f : - | s : f : m : f | m : - : - : -',
        tenor: 's : s : d : d | d : - : s : - | s : s : s : s | s : - : - : - | s : s : d : d | d : - : d : - | d : t : d : t | d : - : - : -',
        bass: 'd : d : d : d | f : - : f : - | m : m : s : d | s : - : - : - | d : d : d : d | f : - : f : - | d : s : d : s | d : - : - : -',
    },
};
