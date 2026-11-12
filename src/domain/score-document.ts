import { Accidental } from '@/domain/accidental';
import { Key } from '@/domain/key';
import { KeySignature } from '@/domain/key-signature';
import { Letter } from '@/domain/letter';
import { Mode } from '@/domain/mode';
import { NoteValue } from '@/domain/note-value';
import { PARTS, type PartId } from '@/domain/parts';
import { Tempo } from '@/domain/tempo';
import { TimeSignature } from '@/domain/time-signature';

/**
 * The score as the editor stores it.
 *
 * The voices' notation sources are the document. Measures, beats and sounding
 * pitches are derived from them and are never edited directly, which is what
 * keeps the musical state and the text from drifting apart. `measureCount` is
 * a floor: a voice may need more measures than the writer asked the page to
 * show, in which case the score grows to fit it.
 */
export type ScoreDocument = {
    readonly title: string;
    readonly subtitle: string;
    readonly author: string;
    /** A whole-score lyric text, kept for documents written before part lyrics. */
    readonly lyrics: string;
    /**
     * One lyric line per part: a syllable for each note that begins, in the
     * order the notes appear. Rests and held notes do not take a syllable —
     * the score draws an em dash under a held note instead.
     */
    readonly lyricsByPart: Readonly<Record<PartId, readonly string[]>>;
    readonly timeSignature: TimeSignature;
    readonly key: Key;
    readonly tempo: Tempo;
    readonly voices: Readonly<Record<PartId, string>>;
    readonly measureCount: number;
};

const DEFAULT_TIME_SIGNATURE = new TimeSignature(NoteValue.QUARTER, 4);
const DEFAULT_MEASURE_COUNT = 4;

/** The name a score carries until the writer gives it one. */
export const UNTITLED_SCORE_TITLE = 'Untitled sheet';

/** The name shown for a score, falling back when its title is blank. */
export function scoreDisplayTitle(document: Pick<ScoreDocument, 'title'>): string {
    return document.title.trim() || UNTITLED_SCORE_TITLE;
}

export function emptyVoices(): Record<PartId, string> {
    const voices = {} as Record<PartId, string>;
    for (const part of PARTS) voices[part.id] = '';
    return voices;
}

/** No part has a lyric line yet. */
export function emptyLyricsByPart(): Record<PartId, string[]> {
    const lyrics = {} as Record<PartId, string[]>;
    for (const part of PARTS) lyrics[part.id] = [];
    return lyrics;
}

/** The document the editor opens with when no sample is selected. */
export function createEmptyScoreDocument(): ScoreDocument {
    return {
        title: UNTITLED_SCORE_TITLE,
        subtitle: '',
        author: 'Composer',
        lyrics: '',
        lyricsByPart: emptyLyricsByPart(),
        timeSignature: DEFAULT_TIME_SIGNATURE,
        key: new Key(Letter.C, new KeySignature(Accidental.NATURAL, 0), Mode.MAJOR),
        tempo: new Tempo(NoteValue.QUARTER, 100, 'Andante'),
        voices: emptyVoices(),
        measureCount: DEFAULT_MEASURE_COUNT,
    };
}

export function voiceSource(document: ScoreDocument, part: PartId): string {
    return document.voices[part];
}

export function withVoice(document: ScoreDocument, part: PartId, source: string): ScoreDocument {
    if (document.voices[part] === source) return document;
    return { ...document, voices: { ...document.voices, [part]: source } };
}

/** The syllable line written under one part. */
export function lyricLine(document: ScoreDocument, part: PartId): readonly string[] {
    return document.lyricsByPart[part];
}

/** Replace one part's lyric line; the rest of the document is untouched. */
export function withLyricLine(
    document: ScoreDocument,
    part: PartId,
    line: readonly string[],
): ScoreDocument {
    const current = document.lyricsByPart[part];
    if (current.length === line.length && current.every((value, index) => value === line[index])) {
        return document;
    }
    return {
        ...document,
        lyricsByPart: { ...document.lyricsByPart, [part]: [...line] },
    };
}

export function withMeasureCount(document: ScoreDocument, measureCount: number): ScoreDocument {
    const next = Math.max(1, Math.floor(measureCount));
    return next === document.measureCount ? document : { ...document, measureCount: next };
}
