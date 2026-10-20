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
        soprano: ':dmsls-m-fmrdr---dmsls-l-mrdrd---',
        alto: ':mdmfm-d-lsfmf---mdmfm-f-sfmfm---',
        tenor: ':ssddd-s-sssss---ssddd-d-dtdtd---',
        bass: ':ddddf-f-mmsds---ddddf-f-dsdsd---',
    },
};
