import {
    Accidental,
    Key,
    KeySignature,
    Letter,
    Mode,
    NoteValue,
    PARTS,
    Tempo,
    TimeSignature,
    type PartId,
    type ScoreDocument,
} from '@/domain/music';
import type { EditorPosition } from '@/features/score-editor/editing/caret';

/**
 * The shape of a score as it is written to browser storage.
 *
 * Only plain data crosses the storage boundary: the musical value classes are
 * broken down into their fields and rebuilt by the constructors on the way
 * back. That keeps IndexedDB's structured clone from having to preserve class
 * prototypes, and it gives every saved score a version to migrate from later.
 *
 * Version 2 adds a creation time so the library can distinguish a score's age
 * from when it was last written. Version 1 records are still readable through
 * `decodeLegacyScore`, which is what the database migration uses.
 */
export const SCORE_STORAGE_VERSION = 2 as const;
export const LEGACY_SCORE_STORAGE_VERSION = 1 as const;

/** A corrupt measure count must not be able to make the editor build forever. */
const MAX_RESTORABLE_MEASURES = 10_000;

export type StoredScoreDocument = {
    readonly title: string;
    readonly subtitle: string;
    readonly author: string;
    readonly lyrics: string;
    readonly timeSignature: {
        readonly note: NoteValue;
        readonly count: number;
    };
    readonly key: {
        readonly letter: Letter;
        readonly mode: Mode;
        readonly signature: {
            readonly accidental: Accidental;
            readonly count: number;
        };
    };
    readonly tempo: {
        readonly beatUnit: NoteValue;
        readonly beatsPerMinute: number;
        readonly description: string;
    };
    readonly voices: Readonly<Record<PartId, string>>;
    readonly measureCount: number;
};

/** A saved score exactly as it is stored, before validation. */
export type StoredScore = {
    readonly version: typeof SCORE_STORAGE_VERSION;
    readonly id: string;
    readonly document: StoredScoreDocument;
    readonly caret: EditorPosition;
    readonly zoom: number;
    /** When the score was first created. */
    readonly createdAt: number;
    /** When this particular write happened. */
    readonly savedAt: number;
};

/** The previous single-document record, kept only for reading during migration. */
export type LegacyStoredScore = {
    readonly version: typeof LEGACY_SCORE_STORAGE_VERSION;
    readonly id: string;
    readonly document: StoredScoreDocument;
    readonly caret: EditorPosition;
    readonly zoom: number;
    readonly savedAt: number;
};

/** A saved score that has been validated and rebuilt into the editor's types. */
export type RestoredScore = {
    readonly id: string;
    readonly document: ScoreDocument;
    readonly caret: EditorPosition;
    readonly zoom: number;
    readonly createdAt: number;
    readonly savedAt: number;
};

/** The plain details the Open dialog needs without rebuilding a whole score. */
export type ScoreSummary = {
    readonly id: string;
    readonly title: string;
    readonly subtitle: string;
    readonly author: string;
    readonly measureCount: number;
    readonly key: Key;
    readonly timeSignature: TimeSignature;
    readonly createdAt: number;
    readonly savedAt: number;
};

export class ScoreStorageError extends Error {
    public constructor(message: string) {
        super(message);
        this.name = 'ScoreStorageError';
    }
}

export function encodeScore(
    document: ScoreDocument,
    caret: EditorPosition,
    zoom: number,
    id: string,
    savedAt: number,
    createdAt = savedAt,
): StoredScore {
    return {
        version: SCORE_STORAGE_VERSION,
        id,
        document: {
            title: document.title,
            subtitle: document.subtitle,
            author: document.author,
            lyrics: document.lyrics,
            timeSignature: {
                note: document.timeSignature.note,
                count: document.timeSignature.count,
            },
            key: {
                letter: document.key.letter,
                mode: document.key.mode,
                signature: {
                    accidental: document.key.signature.accidental,
                    count: document.key.signature.count,
                },
            },
            tempo: {
                beatUnit: document.tempo.beatUnit,
                beatsPerMinute: document.tempo.beatsPerMinute,
                description: document.tempo.description,
            },
            voices: { ...document.voices },
            measureCount: document.measureCount,
        },
        caret: { part: caret.part, offset: caret.offset },
        zoom,
        createdAt,
        savedAt,
    };
}

/**
 * Validate a value read from storage and rebuild the editor's document.
 *
 * A saved score is untrusted input: it may have been written by an older
 * version, edited in devtools, or left half-written. Every field is checked
 * before it reaches a constructor, and failures carry a message the interface
 * can show instead of silently opening a broken score.
 */
export function decodeScore(value: unknown): RestoredScore {
    return decodeScoreRecord(value, SCORE_STORAGE_VERSION);
}

/**
 * Read a version 1 record on its way into the current schema.
 *
 * Old records had no creation time, so the time they were saved is the best
 * date the library can show. Nothing else about them changes.
 */
export function decodeLegacyScore(value: unknown): RestoredScore {
    return decodeScoreRecord(value, LEGACY_SCORE_STORAGE_VERSION);
}

function decodeScoreRecord(value: unknown, expectedVersion: number): RestoredScore {
    const record = asRecord(value, 'saved score');

    if (record.version !== expectedVersion) {
        throw new ScoreStorageError(
            'This score was saved by a different version of the editor and cannot be opened.',
        );
    }

    const id = asNonEmptyString(record.id, 'score id');
    const savedAt = asFiniteNumber(record.savedAt, 'save time');
    const createdAt =
        expectedVersion === LEGACY_SCORE_STORAGE_VERSION
            ? savedAt
            : asFiniteNumber(record.createdAt, 'creation time');
    const zoom = asPositiveNumber(record.zoom, 'zoom');
    const caretRecord = asRecord(record.caret, 'caret');
    const caret = {
        part: asPartId(caretRecord.part, 'caret voice'),
        offset: asNonNegativeInteger(caretRecord.offset, 'caret position'),
    };
    const documentRecord = asRecord(record.document, 'score document');

    const timeRecord = asRecord(documentRecord.timeSignature, 'time signature');
    const keyRecord = asRecord(documentRecord.key, 'key');
    const signatureRecord = asRecord(keyRecord.signature, 'key signature');
    const tempoRecord = asRecord(documentRecord.tempo, 'tempo');
    const voiceRecord = asRecord(documentRecord.voices, 'voices');

    const voices = {} as Record<PartId, string>;
    for (const part of PARTS) {
        voices[part.id] = asString(voiceRecord[part.id], `${part.label} source`);
    }

    try {
        return {
            id,
            document: {
                title: asString(documentRecord.title, 'title'),
                subtitle: asString(documentRecord.subtitle, 'subtitle'),
                author: asString(documentRecord.author, 'composer'),
                lyrics: asString(documentRecord.lyrics, 'lyrics'),
                timeSignature: new TimeSignature(
                    asNoteValue(timeRecord.note, 'time signature note value'),
                    asRangeInteger(timeRecord.count, 'time signature count', 1, 32),
                ),
                key: new Key(
                    asLetter(keyRecord.letter, 'key letter'),
                    new KeySignature(
                        asAccidental(signatureRecord.accidental, 'key signature accidental'),
                        asRangeInteger(signatureRecord.count, 'key signature count', 0, 7),
                    ),
                    asMode(keyRecord.mode, 'key mode'),
                ),
                tempo: new Tempo(
                    asNoteValue(tempoRecord.beatUnit, 'tempo beat unit'),
                    asRangeInteger(tempoRecord.beatsPerMinute, 'tempo', 20, 320),
                    asString(tempoRecord.description, 'tempo description'),
                ),
                voices,
                measureCount: asRangeInteger(
                    documentRecord.measureCount,
                    'measure count',
                    1,
                    MAX_RESTORABLE_MEASURES,
                ),
            },
            caret,
            zoom,
            createdAt,
            savedAt,
        };
    } catch (error) {
        if (error instanceof ScoreStorageError) throw error;
        throw new ScoreStorageError('The saved score contains invalid musical details.');
    }
}

/** The list-view projection of a restored score. */
export function summarizeScore(score: RestoredScore): ScoreSummary {
    return {
        id: score.id,
        title: score.document.title,
        subtitle: score.document.subtitle,
        author: score.document.author,
        measureCount: score.document.measureCount,
        key: score.document.key,
        timeSignature: score.document.timeSignature,
        createdAt: score.createdAt,
        savedAt: score.savedAt,
    };
}

function asRecord(value: unknown, what: string): Record<string, unknown> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new ScoreStorageError(`The saved ${what} is not readable.`);
    }
    return value as Record<string, unknown>;
}

function asString(value: unknown, what: string): string {
    if (typeof value !== 'string') {
        throw new ScoreStorageError(`The saved ${what} is not readable.`);
    }
    return value;
}

function asNonEmptyString(value: unknown, what: string): string {
    const text = asString(value, what);
    if (!text) throw new ScoreStorageError(`The saved ${what} is not readable.`);
    return text;
}

function asFiniteNumber(value: unknown, what: string): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new ScoreStorageError(`The saved ${what} is not readable.`);
    }
    return value;
}

function asPositiveNumber(value: unknown, what: string): number {
    const number = asFiniteNumber(value, what);
    if (number <= 0) throw new ScoreStorageError(`The saved ${what} is not readable.`);
    return number;
}

function asNonNegativeInteger(value: unknown, what: string): number {
    return asRangeInteger(value, what, 0, Number.MAX_SAFE_INTEGER);
}

function asRangeInteger(value: unknown, what: string, min: number, max: number): number {
    if (!Number.isInteger(value) || (value as number) < min || (value as number) > max) {
        throw new ScoreStorageError(`The saved ${what} is out of range.`);
    }
    return value as number;
}

function asPartId(value: unknown, what: string): PartId {
    if (typeof value !== 'string' || !PARTS.some((part) => part.id === value)) {
        throw new ScoreStorageError(`The saved ${what} is not readable.`);
    }
    return value as PartId;
}

function asNoteValue(value: unknown, what: string): NoteValue {
    if (typeof value !== 'string' || !Object.values(NoteValue).includes(value as NoteValue)) {
        throw new ScoreStorageError(`The saved ${what} is not readable.`);
    }
    return value as NoteValue;
}

function asLetter(value: unknown, what: string): Letter {
    if (typeof value !== 'string' || !Object.values(Letter).includes(value as Letter)) {
        throw new ScoreStorageError(`The saved ${what} is not readable.`);
    }
    return value as Letter;
}

function asMode(value: unknown, what: string): Mode {
    if (typeof value !== 'string' || !Object.values(Mode).includes(value as Mode)) {
        throw new ScoreStorageError(`The saved ${what} is not readable.`);
    }
    return value as Mode;
}

function asAccidental(value: unknown, what: string): Accidental {
    if (typeof value !== 'string' || !Object.values(Accidental).includes(value as Accidental)) {
        throw new ScoreStorageError(`The saved ${what} is not readable.`);
    }
    return value as Accidental;
}
