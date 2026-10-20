import type { ReactNode } from 'react';
import { ScoreSystem } from '@/features/score-editor/components/score-canvas/score-system';
import {
    A4_HEIGHT_PX,
    A4_WIDTH_PX,
    PAGE_MARGIN_PX,
    SYSTEM_GAP_PX,
} from '@/features/score-editor/layout/page-geometry';
import type {
    ScoreLayout,
    ScorePage as PageLayout,
} from '@/features/score-editor/layout/score-layout';
import type { ScoreView } from '@/features/score-editor/model/score-view';
import type { EditorPosition } from '@/features/score-editor/editing/caret';

/**
 * One sheet of A4.
 *
 * A fixed page, so the sheet never grows a scrollbar of its own: a score that
 * does not fit is broken onto a further sheet, and the document scrolls past
 * them. Only the first sheet carries the title block.
 */
export function ScorePage({
    page,
    layout,
    view,
    position,
    onPositionChange,
    activeNoteKey,
    children,
}: {
    page: PageLayout;
    layout: ScoreLayout;
    view: ScoreView;
    position: EditorPosition;
    onPositionChange: (position: EditorPosition) => void;
    activeNoteKey?: string | null;
    /** The title block, drawn above the first system of the first sheet. */
    children?: ReactNode;
}) {
    const finalPage = page.number === layout.pages.length;

    return (
        <div
            className="sheet relative shrink-0 bg-paper shadow-sheet"
            style={{ width: A4_WIDTH_PX, height: A4_HEIGHT_PX, padding: PAGE_MARGIN_PX }}
        >
            {page.showsMasthead && children ? (
                <div
                    style={{ marginBottom: SYSTEM_GAP_PX }}
                    // The heading edits itself. A click here must not also put
                    // the caret in the score, which is what would scroll the sheet.
                    onClick={(event) => event.stopPropagation()}
                >
                    {children}
                </div>
            ) : null}
            <div className="flex flex-col" style={{ gap: SYSTEM_GAP_PX }}>
                {page.systems.map((system, index) => (
                    <ScoreSystem
                        key={system.measureNumbers[0]}
                        system={system}
                        measureWidth={layout.measureWidth}
                        isFinalSystem={finalPage && index === page.systems.length - 1}
                        view={view}
                        position={position}
                        onPositionChange={onPositionChange}
                        activeNoteKey={activeNoteKey}
                    />
                ))}
            </div>
        </div>
    );
}
