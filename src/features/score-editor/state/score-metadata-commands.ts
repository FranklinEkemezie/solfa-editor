import { Accidental, Key, NoteValue, Tempo, TimeSignature } from '@/domain/music';
import type { EditorDocument } from '@/features/score-editor/adapters/editor-document-schema';

export type MetadataPatch = Partial<
    Pick<EditorDocument, 'title' | 'author' | 'timeSignature' | 'key' | 'tempo' | 'lyrics'>
>;

export function patchMetadata(document: EditorDocument, patch: MetadataPatch): EditorDocument {
    return { ...document, ...patch };
}

export function makeKey(
    letter: EditorDocument['key']['letter'],
    mode: EditorDocument['key']['mode'],
    accidental: Accidental,
    count: number,
): Key {
    return new Key(letter, { accidental, count } as never, mode);
}

export function makeTimeSignature(note: NoteValue, count: number): TimeSignature {
    return new TimeSignature(note, count);
}

export function makeTempo(beatUnit: NoteValue, bpm: number, description: string): Tempo {
    return new Tempo(beatUnit, bpm, description);
}
