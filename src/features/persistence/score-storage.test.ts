import { describe, expect, it } from 'vitest';
import {
    Accidental,
    Key,
    KeySignature,
    Letter,
    Mode,
    NoteValue,
    Tempo,
    TimeSignature,
    createEmptyScoreDocument,
    type ScoreDocument,
} from '@/domain/music';
import {
    decodeLegacyScore,
    decodeScore,
    encodeScore,
    ScoreStorageError,
    summarizeScore,
    type LegacyStoredScore,
    type StoredScore,
} from '@/features/persistence/score-storage';

function sampleDocument(): ScoreDocument {
    return {
        ...createEmptyScoreDocument(),
        title: 'Gloria',
        subtitle: 'Jude Nnam',
        author: 'A. Composer',
        lyrics: 'Gloria in excelsis Deo',
        timeSignature: new TimeSignature(NoteValue.QUARTER, 4),
        key: new Key(Letter.D, new KeySignature(Accidental.SHARP, 2), Mode.MAJOR),
        tempo: new Tempo(NoteValue.QUARTER, 120, 'Allegro'),
        voices: {
            soprano: ":drmfs''lt",
            alto: ':l,sfmrd',
            tenor: ':d,f,m',
            bass: ':d,',
        },
        measureCount: 6,
    };
}

describe('score storage codec', () => {
    it('keeps every detail of the document, caret and zoom', () => {
        const document = sampleDocument();
        const stored = encodeScore(
            document,
            { part: 'tenor', offset: 4 },
            1.25,
            'score-1',
            1700,
            1200,
        );

        const restored = decodeScore(stored);

        expect(restored.id).toBe('score-1');
        expect(restored.savedAt).toBe(1700);
        expect(restored.createdAt).toBe(1200);
        expect(restored.zoom).toBe(1.25);
        expect(restored.caret).toEqual({ part: 'tenor', offset: 4 });
        expect(restored.document.title).toBe('Gloria');
        expect(restored.document.subtitle).toBe('Jude Nnam');
        expect(restored.document.author).toBe('A. Composer');
        expect(restored.document.lyrics).toBe('Gloria in excelsis Deo');
        expect(restored.document.measureCount).toBe(6);
        expect(restored.document.voices).toEqual(document.voices);
        expect(restored.document.key.letter).toBe(Letter.D);
        expect(restored.document.key.mode).toBe(Mode.MAJOR);
        expect(restored.document.key.signature.accidental).toBe(Accidental.SHARP);
        expect(restored.document.key.signature.count).toBe(2);
        expect(restored.document.timeSignature.note).toBe(NoteValue.QUARTER);
        expect(restored.document.timeSignature.count).toBe(4);
        expect(restored.document.tempo.beatUnit).toBe(NoteValue.QUARTER);
        expect(restored.document.tempo.beatsPerMinute).toBe(120);
        expect(restored.document.tempo.description).toBe('Allegro');
    });

    it('keeps the note value that the tempo counts', () => {
        const document = {
            ...sampleDocument(),
            tempo: new Tempo(NoteValue.HALF, 72, 'Largo'),
        };
        const stored = encodeScore(document, { part: 'soprano', offset: 0 }, 1, 'score-2', 1);

        const restored = decodeScore(stored);

        expect(restored.document.tempo.beatUnit).toBe(NoteValue.HALF);
        expect(restored.document.tempo.beatsPerMinute).toBe(72);
    });

    it('writes plain data that structured clone can carry', () => {
        const stored = encodeScore(sampleDocument(), { part: 'soprano', offset: 0 }, 1, 'x', 1);

        expect(JSON.parse(JSON.stringify(stored))).toEqual(stored);
        expect(stored.document.key).not.toBeInstanceOf(Key);
        expect(stored.document.tempo).not.toBeInstanceOf(Tempo);
        expect(stored.document.timeSignature).not.toBeInstanceOf(TimeSignature);
    });

    it('refuses a score written by another version', () => {
        const stored = encodeScore(sampleDocument(), { part: 'soprano', offset: 0 }, 1, 'x', 1);

        expect(() => decodeScore({ ...stored, version: 99 })).toThrow(ScoreStorageError);
    });

    it('reads a version 1 record during migration, dating it from its save', () => {
        const current = encodeScore(
            sampleDocument(),
            { part: 'soprano', offset: 0 },
            1,
            'old-score',
            1700,
        );
        const legacy = {
            ...current,
            version: 1,
        } as unknown as LegacyStoredScore;

        const restored = decodeLegacyScore(legacy);

        expect(restored.id).toBe('old-score');
        expect(restored.document.title).toBe('Gloria');
        expect(restored.savedAt).toBe(1700);
        expect(restored.createdAt).toBe(1700);
    });

    it('refuses a current record with no creation time', () => {
        const stored = encodeScore(sampleDocument(), { part: 'soprano', offset: 0 }, 1, 'x', 1);
        const { createdAt, ...withoutCreatedAt } = stored;
        void createdAt;

        expect(() => decodeScore(withoutCreatedAt)).toThrow(ScoreStorageError);
    });

    it('projects just the details the document list needs', () => {
        const restored = decodeScore(
            encodeScore(sampleDocument(), { part: 'soprano', offset: 0 }, 1, 'score-1', 1700, 1200),
        );

        expect(summarizeScore(restored)).toMatchObject({
            id: 'score-1',
            title: 'Gloria',
            subtitle: 'Jude Nnam',
            author: 'A. Composer',
            measureCount: 6,
            createdAt: 1200,
            savedAt: 1700,
        });
        expect(summarizeScore(restored).key.letter).toBe(Letter.D);
        expect(summarizeScore(restored).timeSignature.count).toBe(4);
    });

    it('refuses a score whose voices are missing a part', () => {
        const stored = encodeScore(sampleDocument(), { part: 'soprano', offset: 0 }, 1, 'x', 1);
        const voices = { ...stored.document.voices } as Record<string, string>;
        delete voices.bass;

        expect(() => decodeScore({ ...stored, document: { ...stored.document, voices } })).toThrow(
            ScoreStorageError,
        );
    });

    it('refuses musical values that are out of range', () => {
        const stored = encodeScore(sampleDocument(), { part: 'soprano', offset: 0 }, 1, 'x', 1);
        const document = stored.document as StoredScore['document'];
        const broken = {
            ...stored,
            document: {
                ...document,
                tempo: { ...document.tempo, beatsPerMinute: 900 },
            },
        };

        expect(() => decodeScore(broken)).toThrow(ScoreStorageError);
    });

    it('refuses a caret in a voice that does not exist', () => {
        const stored = encodeScore(sampleDocument(), { part: 'soprano', offset: 0 }, 1, 'x', 1);

        expect(() => decodeScore({ ...stored, caret: { part: 'flute', offset: 0 } })).toThrow(
            ScoreStorageError,
        );
    });

    it('refuses an impossible measure count', () => {
        const stored = encodeScore(sampleDocument(), { part: 'soprano', offset: 0 }, 1, 'x', 1);

        expect(() =>
            decodeScore({
                ...stored,
                document: { ...stored.document, measureCount: 1_000_000_000 },
            }),
        ).toThrow(ScoreStorageError);
    });

    it('refuses a negative caret position', () => {
        const stored = encodeScore(sampleDocument(), { part: 'soprano', offset: 0 }, 1, 'x', 1);

        expect(() => decodeScore({ ...stored, caret: { part: 'soprano', offset: -3 } })).toThrow(
            ScoreStorageError,
        );
    });
});
