import {
    Duration,
    Measure,
    Note,
    Score,
    SOLFA_TO_PITCH,
    TimeSignature,
    validateScore,
} from '@/domain/music';
import type {
    EditorDocument,
    EditorMeasure,
} from '@/features/score-editor/adapters/editor-document-schema';

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
        if (!slot.syllable) return [];
        return [
            new Note(
                SOLFA_TO_PITCH[slot.syllable],
                new Duration(slot.noteValue),
                slot.syllable,
                slot.continuation ?? false,
                slot.lyric ?? '',
            ),
        ];
    });
    return new Measure(
        new TimeSignature(measure.timeSignature.note, measure.timeSignature.count),
        events,
        measure.part,
        measure.number,
    );
}
