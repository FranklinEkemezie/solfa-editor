import { scoreDisplayTitle, type ScoreDocument } from '@/domain/music';
import {
    decodeDocument,
    encodeDocument,
    ScoreStorageError,
    type StoredScoreDocument,
} from '@/features/persistence/score-storage';

/**
 * The portable score file.
 *
 * A `.solfa` file is the document and nothing else: no caret, no zoom, no
 * theme, no device preferences. That keeps the file a score rather than a copy
 * of somebody's workspace, and means importing it on another machine starts
 * from that machine's own settings.
 */
export const SOLFA_FILE_FORMAT = 'solfa';
export const SOLFA_FILE_VERSION = 1 as const;

export type SolfaFile = {
    readonly format: typeof SOLFA_FILE_FORMAT;
    readonly version: typeof SOLFA_FILE_VERSION;
    readonly document: StoredScoreDocument;
};

export class SolfaFileError extends Error {
    public constructor(message: string) {
        super(message);
        this.name = 'SolfaFileError';
    }
}

export function encodeSolfaFile(document: ScoreDocument): string {
    const file: SolfaFile = {
        format: SOLFA_FILE_FORMAT,
        version: SOLFA_FILE_VERSION,
        document: encodeDocument(document),
    };
    return `${JSON.stringify(file, null, 2)}\n`;
}

export function decodeSolfaFile(text: string): ScoreDocument {
    let parsed: unknown;
    try {
        parsed = JSON.parse(text);
    } catch {
        throw new SolfaFileError('That file is not readable as a .solfa document.');
    }

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new SolfaFileError('That file is not readable as a .solfa document.');
    }

    const file = parsed as Record<string, unknown>;
    if (file.format !== SOLFA_FILE_FORMAT) {
        throw new SolfaFileError('That file is not a .solfa document.');
    }
    if (file.version !== SOLFA_FILE_VERSION) {
        throw new SolfaFileError('That .solfa file was written by a different version of the editor.');
    }

    try {
        return decodeDocument(file.document);
    } catch (error) {
        if (error instanceof ScoreStorageError) {
            throw new SolfaFileError(error.message);
        }
        throw new SolfaFileError('That .solfa document contains invalid musical details.');
    }
}

/** A safe, readable file name for a score. */
export function solfaFileName(document: Pick<ScoreDocument, 'title'>): string {
    const slug = scoreDisplayTitle(document)
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 64);
    return `${slug || 'solfa-score'}.solfa`;
}
