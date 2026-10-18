import type {
    EditorDocument,
    EditorMeasure,
} from '@/features/score-editor/adapters/editor-document-schema';
import { printGridTemplate } from '@/features/pdf-export/print/print-layout';

export function PrintMeasureHeadings({
    document,
    measures,
}: {
    document: EditorDocument;
    measures: EditorMeasure[];
}) {
    return (
        <div
            className="grid items-end border-b border-line bg-cream pt-[5pt] pb-[3pt] text-[7.5pt] font-bold uppercase tracking-[0.16em] text-muted"
            style={{ gridTemplateColumns: printGridTemplate(document, measures) }}
        >
            <span className="pl-[7pt] text-left text-[6.5pt] tracking-[0.14em]">Part</span>
            {measures.map((measure) => (
                <span key={measure.id} className="text-center">
                    m{measure.number}
                </span>
            ))}
        </div>
    );
}
