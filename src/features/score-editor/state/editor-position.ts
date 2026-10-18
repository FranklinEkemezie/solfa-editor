import type {
    EditorDocument,
    EditorMeasure,
} from '@/features/score-editor/adapters/editor-document-schema';

export type EditorPosition = { measureId: string; slotIndex: number };

export function findMeasure(
    document: EditorDocument,
    measureId: string,
): EditorMeasure | undefined {
    return document.measures.find((measure) => measure.id === measureId);
}

function measuresForPart(document: EditorDocument, part: EditorMeasure['part']): EditorMeasure[] {
    return document.measures
        .filter((measure) => measure.part === part)
        .sort((left, right) => left.number - right.number);
}

export function advancePosition(
    document: EditorDocument,
    position: EditorPosition,
): EditorPosition {
    const measure = findMeasure(document, position.measureId);
    if (!measure) return position;

    if (position.slotIndex + 1 < measure.slots.length) {
        return { measureId: measure.id, slotIndex: position.slotIndex + 1 };
    }

    const partMeasures = measuresForPart(document, measure.part);
    const currentIndex = partMeasures.findIndex((candidate) => candidate.id === measure.id);
    const nextMeasure = partMeasures[currentIndex + 1];
    if (nextMeasure) return { measureId: nextMeasure.id, slotIndex: 0 };

    return { measureId: measure.id, slotIndex: Math.max(0, measure.slots.length - 1) };
}

export function previousPosition(
    document: EditorDocument,
    position: EditorPosition,
): EditorPosition {
    const measure = findMeasure(document, position.measureId);
    if (!measure) return position;
    if (position.slotIndex > 0) {
        return { measureId: position.measureId, slotIndex: position.slotIndex - 1 };
    }

    const partMeasures = measuresForPart(document, measure.part);
    const currentIndex = partMeasures.findIndex((candidate) => candidate.id === measure.id);
    const previousMeasure = partMeasures[currentIndex - 1];
    if (previousMeasure) {
        return {
            measureId: previousMeasure.id,
            slotIndex: Math.max(0, previousMeasure.slots.length - 1),
        };
    }

    return { measureId: measure.id, slotIndex: 0 };
}
