import { describe, expect, it } from 'vitest';
import {
    Accidental,
    createEmptyScoreDocument,
    Key,
    KeySignature,
    Letter,
    Mode,
    NoteValue,
    Tempo,
    TimeSignature,
    type ScoreDocument,
} from '@/domain/music';
import {
    decodeSolfaFile,
    encodeSolfaFile,
    SOLFA_FILE_FORMAT,
    SOLFA_FILE_VERSION,
    SolfaFileError,
    solfaFileName,
} from '@/features/document-file/solfa-file';

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

describe('the .solfa file codec', () => {
    it('round-trips every part of the document', () => {
        const document = sampleDocument();
        const text = encodeSolfaFile(document);
        const restored = decodeSolfaFile(text);

        expect(restored.title).toBe('Gloria');
        expect(restored.subtitle).toBe('Jude Nnam');
        expect(restored.author).toBe('A. Composer');
        expect(restored.lyrics).toBe('Gloria in excelsis Deo');
        expect(restored.measureCount).toBe(6);
        expect(restored.voices).toEqual(document.voices);
        expect(restored.key.letter).toBe(Letter.D);
        expect(restored.key.signature.count).toBe(2);
        expect(restored.timeSignature.count).toBe(4);
        expect(restored.tempo.beatsPerMinute).toBe(120);
        expect(restored.tempo.description).toBe('Allegro');
    });

    it('writes only document data, never workspace settings', () => {
        const parsed = JSON.parse(encodeSolfaFile(sampleDocument())) as Record<string, unknown>;

        expect(parsed.format).toBe(SOLFA_FILE_FORMAT);
        expect(parsed.version).toBe(SOLFA_FILE_VERSION);
        expect(parsed.document).toBeTypeOf('object');
        expect(parsed).not.toHaveProperty('zoom');
        expect(parsed).not.toHaveProperty('theme');
        expect(parsed).not.toHaveProperty('caret');
        expect(parsed.document).not.toHaveProperty('zoom');
        expect(parsed.document).not.toHaveProperty('theme');
    });

    it('refuses another format or version', () => {
        const file = JSON.parse(encodeSolfaFile(sampleDocument())) as Record<string, unknown>;

        expect(() => decodeSolfaFile(JSON.stringify({ ...file, format: 'other' }))).toThrow(
            SolfaFileError,
        );
        expect(() => decodeSolfaFile(JSON.stringify({ ...file, version: 99 }))).toThrow(
            SolfaFileError,
        );
    });

    it('refuses unreadable or incomplete documents', () => {
        expect(() => decodeSolfaFile('not json')).toThrow(SolfaFileError);

        const file = JSON.parse(encodeSolfaFile(sampleDocument())) as {
            document: Record<string, unknown>;
        };
        delete file.document.voices;
        expect(() => decodeSolfaFile(JSON.stringify(file))).toThrow(SolfaFileError);
    });

    it('builds a readable filename', () => {
        expect(solfaFileName({ title: 'Gloria — Sir Jude Nnam' })).toBe(
            'gloria-sir-jude-nnam.solfa',
        );
        expect(solfaFileName({ title: '   ' })).toBe('untitled-sheet.solfa');
    });
});
