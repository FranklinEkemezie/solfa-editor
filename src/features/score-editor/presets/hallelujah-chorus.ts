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
 * The sheet writes "Doh is D", so the key is D major. Every part is written at
 * its own register, which is what lets the four voices sound apart.
 *
 * Each line is ordinary notation: `:` is a quarter, `.` an eighth, `,` a
 * sixteenth, `-` holds the note before it, and a space is a rest. Measures are
 * not written — the bars fall where the time signature says they do.
 */
export const hallelujahChorus: ScorePreset = {
    title: 'Hallelujah Chorus',
    author: 'G. F. Handel',
    key: 'D-MAJOR-SHARP-2',
    timeSignature: '4/QUARTER',
    tempo: { beatsPerMinute: 72, description: 'Allegro' },
    parts: {
        soprano: ':d-.sl:sd---d.sl:dmr---d-.sl:sd---mrdrd---',
        alto: ':d-.ml:md---fmrdt---d-.ml:md---sfmfm---',
        tenor: ':s-.dl:df---lsfms---s-.dl:df---ssfsd---',
        bass: ':d-ddf---ffffs---d-ddf---ddssd---',
    },
};
