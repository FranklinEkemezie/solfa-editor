import type { PARTS } from '@/domain/music';
import type {
    EditorDocument,
    EditorMeasure,
} from '@/features/score-editor/adapters/editor-document-schema';
import { PrintMeasureCell } from '@/features/pdf-export/print/print-measure-cell';

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
            className="grid min-h-[34pt] items-center border-t border-line-soft"
            style={{
                gridTemplateColumns: `26pt repeat(${measures.length}, minmax(48pt, 1fr))`,
            }}
        >
            <strong className="self-center px-2 text-[11pt] font-bold uppercase tracking-[0.08em] text-ink">
                {part.shortLabel}
            </strong>
            {measures.map((measure) => {
                const partMeasure = document.measures.find(
                    (candidate) =>
                        candidate.part === part.id && candidate.number === measure.number,
                );
                return (
                    <PrintMeasureCell key={`${part.id}-${measure.number}`} measure={partMeasure} />
                );
            })}
        </div>
    );
}
