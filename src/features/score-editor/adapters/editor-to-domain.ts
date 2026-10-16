import {
    Accidental,
    Duration,
    Key,
    Measure,
    Note,
    Score,
    SOLFA_TO_PITCH,
    TimeSignature,
    validateScore,
} from '@/domain/music';
import type { EditorDocument, EditorMeasure } from './editor-document-schema';

export class EditorDocumentError extends Error {
    public constructor(message: string) {
        super(message);
        this.name = 'EditorDocumentError';
    }
}

export function editorToDomain(document: EditorDocument): Score {
    const measures = document.measures.map(toDomainMeasure);
    const score = new Score(
        document.title,
        document.timeSignature,
        document.key,
        document.tempo,
        measures,
        document.author,
        document.lyrics,
    );
    const errors = validateScore(score);
    if (errors.length > 0) throw new EditorDocumentError(errors.join(' '));
    return score;
}

function toDomainMeasure(measure: EditorMeasure): Measure {
    const events = measure.slots.flatMap((slot) => {
        if (slot.syllable) {
            return [
                new Note(
                    SOLFA_TO_PITCH[slot.syllable],
                    new Duration(slot.noteValue),
                    slot.syllable,
                    slot.continuation ?? false,
                    slot.lyric ?? '',
                ),
            ];
        }
        return [];
    });
    return new Measure(
        new TimeSignature(measure.timeSignature.note, measure.timeSignature.count),
        events,
        measure.part,
        measure.number,
    );
}

export function semanticScoreKey(score: Score): string {
    return JSON.stringify({
        title: score.title,
        author: score.author,
        timeSignature: score.timeSignature,
        key: score.key,
        tempo: score.tempo,
        measures: score.measures.map((measure) => ({
            part: measure.part,
            number: measure.number,
            events: measure.events.map((event) => ({
                duration: event.duration,
                ...(event instanceof Note
                    ? {
                          syllable: event.syllable,
                          pitch: event.pitch,
                          continuation: event.continuation,
                      }
                    : {}),
            })),
        })),
    });
}

export function metadataKeyLabel(document: EditorDocument): string {
    const accidental = document.key.signature.accidental;
    const symbol =
        accidental === Accidental.SHARP ? '♯' : accidental === Accidental.FLAT ? '♭' : '';
    return `${document.key.letter}${symbol} ${document.key.mode === 'MAJOR' ? 'Major' : 'Minor'}`;
}

export function ensureValidTimeSignature(
    note: EditorDocument['timeSignature']['note'],
    count: number,
): TimeSignature {
    return new TimeSignature(note, count);
}

export function keyFromValues(
    letter: EditorDocument['key']['letter'],
    mode: EditorDocument['key']['mode'],
    accidental: EditorDocument['key']['signature']['accidental'],
    count: number,
): Key {
    return new Key(letter, { accidental, count } as never, mode);
}
