import { NoteValue, Tempo } from '@/domain/music';
import type { ScoreDocument } from '@/domain/music';

export type MetadataPatch = Partial<
    Pick<
        ScoreDocument,
        'title' | 'subtitle' | 'author' | 'timeSignature' | 'key' | 'tempo' | 'lyrics'
    >
>;

export function patchMetadata(document: ScoreDocument, patch: MetadataPatch): ScoreDocument {
    return { ...document, ...patch };
}

export function makeTempo(beatUnit: NoteValue, bpm: number, description: string): Tempo {
    return new Tempo(beatUnit, bpm, description);
}
