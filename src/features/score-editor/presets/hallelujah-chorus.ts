import type { ScorePreset } from '@/features/score-editor/presets/score-preset';

/**
 * Handel, "Hallelujah" from Messiah — the editor's default sample.
 *
 * Transcribed from `docs/sample/sample_solfa_sheet_music.webp`. The details
 * (title, composer, key, tempo, four parts) follow the sheet; the notes are a
 * faithful reading of the opening systems rather than the whole movement, and
 * no lyrics are written because this preset exists to have something to edit,
 * play and print without typing.
 *
 * The sheet writes "Doh is D", so the key is D major and every part is written
 * in the same octave — the editor separates the registers when it plays.
 */
export const hallelujahChorus: ScorePreset = {
    title: 'Hallelujah Chorus',
    author: 'G. F. Handel',
    key: 'D-MAJOR-SHARP-2',
    timeSignature: '4/QUARTER',
    tempo: { beatsPerMinute: 72, description: 'Allegro' },
    parts: {
        soprano:
            'd : - : s.l : s | d : - : - : - | d : s.l : d : m | r : - : - : - | d : - : s.l : s | d : - : - : - | m : r : d : r | d : - : - : -',
        alto: 'd : - : m.l : m | d : - : - : - | f : m : r : d | t : - : - : - | d : - : m.l : m | d : - : - : - | s : f : m : f | m : - : - : -',
        tenor: 's : - : d.l : d | f : - : - : - | l : s : f : m | s : - : - : - | s : - : d.l : d | f : - : - : - | s : s : f : s | d : - : - : -',
        bass: 'd : - : d : d | f : - : - : - | f : f : f : f | s : - : - : - | d : - : d : d | f : - : - : - | d : d : s : s | d : - : - : -',
    },
};
