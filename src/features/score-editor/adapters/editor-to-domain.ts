import {
    divideNoteValue,
    Duration,
    Measure,
    Note,
    Score,
    solfaPitch,
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
        document.subtitle,
    );
    const errors = validateScore(score);
    if (errors.length > 0) throw new EditorDocumentError(errors.join(' '));
    return score;
}

function toDomainMeasure(measure: EditorMeasure): Measure {
    const events = measure.slots.flatMap((slot) => {
        const duration = new Duration(divideNoteValue(slot.noteValue, slot.division));
        return slot.notes.flatMap((note) =>
            note.syllable
                ? [
                      new Note(
                          solfaPitch(note.syllable),
                          duration.toQuarterUnits(),
                          note.syllable,
                          note.continuation ?? false,
                          note.lyric ?? '',
                      ),
                  ]
                : [],
        );
    });

    return new Measure(
        new TimeSignature(measure.timeSignature.note, measure.timeSignature.count),
        events,
        measure.part,
        measure.number,
    );
}
