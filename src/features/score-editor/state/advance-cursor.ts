import type { EditorDocument } from '@/features/score-editor/adapters/editor-document-schema';
import {
    advancePosition,
    findMeasure,
    measuresForPart,
    type EditorPosition,
} from '@/features/score-editor/state/editor-position';
import { addMeasure } from '@/features/score-editor/state/score-measure-commands';

/** A cursor move that may also have grown the score. */
export type CursorStep = {
    document: EditorDocument;
    position: EditorPosition;
};

/**
 * Step the caret one rhythmic position to the right.
 *
 * When the caret already rests on the final slot of the final measure, a new
 * measure is appended for every part and the caret lands on its first slot.
 * That way input never dead-ends at the end of the score: the score grows to
 * follow the caret instead of the caret stopping at the last slot.
 */
export function advanceCursor(document: EditorDocument, position: EditorPosition): CursorStep {
    const measure = findMeasure(document, position.measureId);
    if (!measure) return { document, position };

    const isFinalSlot = position.slotIndex + 1 >= measure.slots.length;
    const partMeasures = measuresForPart(document, measure.part);
    const isFinalMeasure = partMeasures[partMeasures.length - 1]?.id === measure.id;

    if (!isFinalSlot || !isFinalMeasure) {
        return { document, position: advancePosition(document, position) };
    }

    const grown = addMeasure(document);
    return {
        document: grown,
        position: { measureId: `${measure.part}-${measure.number + 1}`, slotIndex: 0 },
    };
}
