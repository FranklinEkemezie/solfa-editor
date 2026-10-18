import { NoteValue, PARTS } from '@/domain/music';
import type {
    EditorDocument,
    EditorMeasure,
} from '@/features/score-editor/adapters/editor-document-schema';

function sopranoMeasureNumbers(document: EditorDocument): number[] {
    return document.measures
        .filter((measure) => measure.part === 'soprano')
        .map((measure) => measure.number);
}

export function addMeasure(document: EditorDocument): EditorDocument {
    const nextNumber = Math.max(0, ...sopranoMeasureNumbers(document)) + 1;
    const measures: EditorMeasure[] = PARTS.map((part) => ({
        id: `${part.id}-${nextNumber}`,
        part: part.id,
        number: nextNumber,
        timeSignature: document.timeSignature,
        slots: Array.from({ length: document.timeSignature.count }, (_, index) => ({
            id: `${part.id}-${nextNumber}-${index}`,
            noteValue: NoteValue.QUARTER,
        })),
    }));
    return { ...document, measures: [...document.measures, ...measures] };
}

export function removeLastMeasure(document: EditorDocument): EditorDocument | null {
    const numbers = sopranoMeasureNumbers(document);
    if (numbers.length <= 1) return null;
    const lastNumber = Math.max(...numbers);
    return {
        ...document,
        measures: document.measures.filter((measure) => measure.number !== lastNumber),
    };
}
