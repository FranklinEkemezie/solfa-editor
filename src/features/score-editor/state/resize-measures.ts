import { NoteValue, TimeSignature } from '@/domain/music';
import type { EditorDocument } from '@/features/score-editor/adapters/editor-document-schema';

export function resizeMeasuresToTimeSignature(document: EditorDocument): EditorDocument {
    const { count, note } = document.timeSignature;
    const defaultNoteValue = note === NoteValue.EIGHTH ? NoteValue.EIGHTH : NoteValue.QUARTER;

    return {
        ...document,
        measures: document.measures.map((measure) => ({
            ...measure,
            timeSignature: new TimeSignature(note, count),
            slots:
                measure.slots.length === count
                    ? measure.slots
                    : Array.from(
                          { length: count },
                          (_, index) =>
                              measure.slots[index] ?? {
                                  id: `${measure.part}-${measure.number}-${index}`,
                                  noteValue: defaultNoteValue,
                              },
                      ),
        })),
    };
}
