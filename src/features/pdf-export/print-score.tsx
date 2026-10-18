import type {
    EditorDocument,
    EditorMeasure,
} from '@/features/score-editor/adapters/editor-document-schema';
import { PrintMasthead } from '@/features/pdf-export/print/print-masthead';
import { PrintSystem } from '@/features/pdf-export/print/print-system';
import { calculateScoreLayout } from '@/features/score-editor/layout/score-layout';

/**
 * The score as it goes to paper.
 *
 * The pages are the editor's own pages: the same module decides where the
 * music breaks, so what is printed is what was being looked at, one sheet at a
 * time. The sheet carries no colour of its own — ink, hairlines and barlines
 * only — because that is what a score looks like printed, and what a printer
 * can be trusted to reproduce.
 */
export function PrintScore({ document }: { document: EditorDocument }) {
    const layout = calculateScoreLayout(document);
    const measureById = new Map(
        document.measures.map((measure): [string, EditorMeasure] => [measure.id, measure]),
    );
    const lastPage = layout.pages.length - 1;

    return (
        <main className="print-sheet" id="print-view">
            {layout.pages.map((page) => (
                <section key={page.number} className="print-page">
                    {page.showsMasthead ? <PrintMasthead document={document} /> : null}
                    {page.systems.map((system, index) => (
                        <PrintSystem
                            key={system.measureNumbers[0]}
                            system={system}
                            measureWidth={layout.measureWidth}
                            isFinalSystem={
                                page.number === lastPage && index === page.systems.length - 1
                            }
                            measureById={measureById}
                        />
                    ))}
                </section>
            ))}
        </main>
    );
}
