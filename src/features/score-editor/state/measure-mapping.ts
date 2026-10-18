import type {
    EditorDocument,
    EditorMeasure,
} from '@/features/score-editor/adapters/editor-document-schema';

export function mapMeasure(
    document: EditorDocument,
    measureId: string,
    mapper: (measure: EditorMeasure) => EditorMeasure,
): EditorDocument {
    return {
        ...document,
        measures: document.measures.map((measure) =>
            measure.id === measureId ? mapper(measure) : measure,
        ),
    };
}
