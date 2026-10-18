import { NoteValue, type SolfaSyllable } from '@/domain/music';
import type { EditorDocument } from '@/features/score-editor/adapters/editor-document-schema';
import { findMeasure, type EditorPosition } from '@/features/score-editor/state/editor-position';
import { mapMeasure } from '@/features/score-editor/state/measure-mapping';

export function replaceSlot(
    document: EditorDocument,
    position: EditorPosition,
    syllable: SolfaSyllable,
): EditorDocument {
    return mapMeasure(document, position.measureId, (measure) => ({
        ...measure,
        slots: measure.slots.map((slot, index) =>
            index === position.slotIndex ? { ...slot, syllable, continuation: false } : slot,
        ),
    }));
}

export function setSlotDuration(
    document: EditorDocument,
    position: EditorPosition,
    noteValue: NoteValue,
): EditorDocument | null {
    const measure = findMeasure(document, position.measureId);
    if (!measure || !measure.slots[position.slotIndex]) return null;

    return mapMeasure(document, position.measureId, (current) => ({
        ...current,
        slots: current.slots.map((slot, index) =>
            index === position.slotIndex ? { ...slot, noteValue } : slot,
        ),
    }));
}

export function clearSlot(document: EditorDocument, position: EditorPosition): EditorDocument {
    return mapMeasure(document, position.measureId, (measure) => ({
        ...measure,
        slots: measure.slots.map((slot, index) =>
            index === position.slotIndex ? { id: slot.id, noteValue: slot.noteValue } : slot,
        ),
    }));
}

export function continueSlot(
    document: EditorDocument,
    position: EditorPosition,
): EditorDocument | null {
    const measure = findMeasure(document, position.measureId);
    const previous = measure?.slots[position.slotIndex - 1];
    if (!previous?.syllable) return null;

    return mapMeasure(document, position.measureId, (current) => ({
        ...current,
        slots: current.slots.map((slot, index) =>
            index === position.slotIndex
                ? { ...slot, syllable: previous.syllable, continuation: true }
                : slot,
        ),
    }));
}
