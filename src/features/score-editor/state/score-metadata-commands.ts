import { NoteValue, Tempo } from '@/domain/music';
import type { EditorDocument } from '@/features/score-editor/adapters/editor-document-schema';

export type MetadataPatch = Partial<
    Pick<
        EditorDocument,
        'title' | 'subtitle' | 'author' | 'timeSignature' | 'key' | 'tempo' | 'lyrics'
    >
>;

export function patchMetadata(document: EditorDocument, patch: MetadataPatch): EditorDocument {
    return { ...document, ...patch };
}

export function makeTempo(beatUnit: NoteValue, bpm: number, description: string): Tempo {
    return new Tempo(beatUnit, bpm, description);
}
