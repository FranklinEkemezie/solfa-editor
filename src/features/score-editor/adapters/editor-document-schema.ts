import type { Key, NoteValue, PartId, SolfaSyllable, Tempo, TimeSignature } from '@/domain/music';

export type EditorSlot = {
    id: string;
    noteValue: NoteValue;
    syllable?: SolfaSyllable;
    continuation?: boolean;
    lyric?: string;
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
    author: string;
    timeSignature: TimeSignature;
    key: Key;
    tempo: Tempo;
    lyrics: string;
    measures: EditorMeasure[];
};
