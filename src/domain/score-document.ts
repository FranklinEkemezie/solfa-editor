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
    readonly lyrics: string;
    readonly timeSignature: TimeSignature;
    readonly key: Key;
    readonly tempo: Tempo;
    readonly voices: Readonly<Record<PartId, string>>;
    readonly measureCount: number;
};

const DEFAULT_TIME_SIGNATURE = new TimeSignature(NoteValue.QUARTER, 4);
const DEFAULT_MEASURE_COUNT = 2;

export function emptyVoices(): Record<PartId, string> {
    const voices = {} as Record<PartId, string>;
    for (const part of PARTS) voices[part.id] = '';
    return voices;
}

/** The document the editor opens with when no sample is selected. */
export function createEmptyScoreDocument(): ScoreDocument {
    return {
        title: 'Untitled solfa',
        subtitle: '',
        author: 'Composer',
        lyrics: '',
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

export function withMeasureCount(document: ScoreDocument, measureCount: number): ScoreDocument {
    const next = Math.max(1, Math.floor(measureCount));
    return next === document.measureCount ? document : { ...document, measureCount: next };
}
