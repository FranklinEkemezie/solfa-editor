import type { PARTS } from '@/domain/music';
import type {
    EditorDocument,
    EditorMeasure,
} from '@/features/score-editor/adapters/editor-document-schema';
import { PrintMeasureCell } from '@/features/pdf-export/print/print-measure-cell';
import { printGridTemplate } from '@/features/pdf-export/print/print-layout';

type Part = (typeof PARTS)[number];

export function PrintPartRow({
    part,
    measures,
    document,
}: {
    part: Part;
    measures: EditorMeasure[];
    document: EditorDocument;
}) {
    return (
        <div
            className="print-part-row grid min-h-[42pt] items-stretch border-t border-line-soft"
            style={{ gridTemplateColumns: printGridTemplate(document, measures) }}
        >
            <strong className="flex items-center justify-center">
                <span className="inline-flex h-[16pt] w-[16pt] items-center justify-center rounded-full bg-green-wash text-[9pt] font-bold uppercase text-green-dark">
                    {part.shortLabel}
                </span>
            </strong>
            {measures.map((measure, index) => (
                <PrintMeasureCell
                    key={`${part.id}-${measure.number}`}
                    measure={document.measures.find(
                        (candidate) =>
                            candidate.part === part.id && candidate.number === measure.number,
                    )}
                    isLast={index === measures.length - 1}
                />
            ))}
        </div>
    );
}
