import type { ReactNode } from 'react';
import type { EditorMeasure } from '@/features/score-editor/adapters/editor-document-schema';
import { ScoreSystem } from '@/features/score-editor/components/score-canvas/score-system';
import { STAGE_INTERACTIVE_CLASS } from '@/features/score-editor/components/score-stage';
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
import type { EditorPosition } from '@/features/score-editor/state/editor-position';

/**
 * One sheet of A4.
 *
 * The sheet holds a fixed page, so it never grows a scrollbar of its own: a
 * score that does not fit is broken onto further sheets, and the stage is
 * panned and zoomed around them. Only the first sheet carries the title block.
 */
export function ScorePage({
    page,
    layout,
    measureById,
    position,
    onPositionChange,
    activeSlotId,
    children,
}: {
    page: PageLayout;
    layout: ScoreLayout;
    measureById: Map<string, EditorMeasure>;
    position: EditorPosition;
    onPositionChange: (position: EditorPosition) => void;
    activeSlotId?: string | null;
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
                <div className={STAGE_INTERACTIVE_CLASS} style={{ marginBottom: SYSTEM_GAP_PX }}>
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
                        measureById={measureById}
                        position={position}
                        onPositionChange={onPositionChange}
                        activeSlotId={activeSlotId}
                    />
                ))}
            </div>
        </div>
    );
}
