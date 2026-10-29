import { PrintMasthead } from '@/features/pdf-export/print/print-masthead';
import { PrintSystem } from '@/features/pdf-export/print/print-system';
import { calculateScoreLayout } from '@/features/score-editor/layout/score-layout';
import type { ScoreView } from '@/features/score-editor/model/score-view';
import { cn } from '@/lib/utils';

/**
 * The score as it goes to paper.
 *
 * The pages are the editor's own pages: the same module decides where the
 * music breaks, so what is printed is what was being looked at, one sheet at a
 * time. The sheet carries no colour of its own — ink, hairlines and barlines
 * only — because that is what a score looks like printed, and what a printer
 * can be trusted to reproduce.
 *
 * `paper` draws each page as a real A4 sheet for preview and image capture. The
 * ordinary print path leaves the page box to `@page`, so the two do not double
 * the margin.
 */
export function PrintScore({
    view,
    paper = false,
    className,
    id,
}: {
    view: ScoreView;
    paper?: boolean;
    className?: string;
    id?: string;
}) {
    const layout = calculateScoreLayout(view);
    const finalPage = layout.pages.length;

    return (
        <main className={cn('print-sheet', className)} id={id}>
            {layout.pages.map((page) => (
                <section
                    key={page.number}
                    className={cn('print-page', paper && 'print-page--paper')}
                >
                    {page.showsMasthead ? <PrintMasthead document={view.document} /> : null}
                    {page.systems.map((system, index) => (
                        <PrintSystem
                            key={system.measureNumbers[0]}
                            system={system}
                            measureWidth={layout.measureWidth}
                            isFinalSystem={
                                page.number === finalPage && index === page.systems.length - 1
                            }
                            view={view}
                        />
                    ))}
                </section>
            ))}
        </main>
    );
}
