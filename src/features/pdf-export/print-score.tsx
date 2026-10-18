import { PARTS } from '@/domain/music';
import type { EditorDocument } from '@/features/score-editor/adapters/editor-document-schema';
import { PrintMeasureHeadings } from '@/features/pdf-export/print/print-measure-headings';
import { PrintPartRow } from '@/features/pdf-export/print/print-part-row';
import { PrintScoreFooter } from '@/features/pdf-export/print/print-score-footer';
import { PrintScoreHeader } from '@/features/pdf-export/print/print-score-header';

export function PrintScore({ document }: { document: EditorDocument }) {
    const measures = document.measures
        .filter((measure) => measure.part === 'soprano')
        .sort((left, right) => left.number - right.number);

    return (
        <main className="print-sheet" id="print-view">
            <PrintScoreHeader document={document} />
            <div
                className="overflow-hidden rounded-lg border border-line-soft"
                style={{ ['--print-measures' as string]: String(measures.length) }}
            >
                <PrintMeasureHeadings measures={measures} />
                {PARTS.map((part) => (
                    <PrintPartRow
                        key={part.id}
                        part={part}
                        measures={measures}
                        document={document}
                    />
                ))}
            </div>
            <PrintScoreFooter />
        </main>
    );
}
