import type {
    BeatDivision,
    Key,
    NoteValue,
    PartId,
    SolfaSyllable,
    Tempo,
    TimeSignature,
} from '@/domain/music';

/** One written note inside a beat. Empty beats simply have no notes. */
export type EditorNote = {
    id: string;
    syllable?: SolfaSyllable;
    continuation?: boolean;
    lyric?: string;
};

/**
 * One beat of a measure.
 *
 * A beat holds up to `division` notes: one when it is a plain beat, two when a
 * dot halves it, four when a comma quarters it. The division is the beat's
 * rhythmic shape, so it is stored instead of being inferred from the notes.
 */
export type EditorSlot = {
    id: string;
    noteValue: NoteValue;
    division: BeatDivision;
    notes: EditorNote[];
};

export type EditorMeasure = {
    id: string;
    part: PartId;
    number: number;
    timeSignature: TimeSignature;
    slots: EditorSlot[];
};

export type EditorDocument = {
    type: 'sol-fa-document';
    title: string;
    subtitle: string;
    author: string;
    timeSignature: TimeSignature;
    key: Key;
    tempo: Tempo;
    lyrics: string;
    measures: EditorMeasure[];
};
