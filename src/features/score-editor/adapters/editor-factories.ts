import type { NoteValue, PartId, TimeSignature } from '@/domain/music';
import type {
    EditorMeasure,
    EditorSlot,
} from '@/features/score-editor/adapters/editor-document-schema';

/** An empty, undivided beat. */
export function emptyBeat(id: string, noteValue: NoteValue): EditorSlot {
    return { id, noteValue, division: 1, notes: [] };
}

/** An empty measure whose beats match its time signature. */
export function emptyMeasure(
    part: PartId,
    number: number,
    timeSignature: TimeSignature,
): EditorMeasure {
    return {
        id: `${part}-${number}`,
        part,
        number,
        timeSignature,
        slots: Array.from({ length: timeSignature.count }, (_, index) =>
            emptyBeat(`${part}-${number}-${index}`, timeSignature.note),
        ),
    };
}
