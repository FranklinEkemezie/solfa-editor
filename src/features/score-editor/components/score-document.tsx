import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { ScorePage } from '@/features/score-editor/components/score-canvas/score-page';
import type { EditorPosition } from '@/features/score-editor/editing/caret';
import { calculateScoreLayout } from '@/features/score-editor/layout/score-layout';
import type { ScoreView } from '@/features/score-editor/model/score-view';

/**
 * The score, as a document of A4 sheets.
 *
 * The page breaks are decided here and nowhere else, so the editor and the
 * printer agree on where the music falls. The sheets are stacked in reading
 * order and scroll past the reader; how large they are drawn is the viewport's
 * business, not this component's.
 *
 * The section itself is the writing surface. It is focusable and holds the
 * physical keyboard handler, so clicking the music puts the caret back in the
 * score without moving the page: the browser is asked to focus without
 * scrolling, and the sheets stay where they were.
 */
export function ScoreDocument({
    view,
    position,
    masthead,
    onPositionChange,
    onKeyDown,
    activeNoteKey,
}: {
    view: ScoreView;
    position: EditorPosition;
    /** The editable title block, drawn on the first sheet. */
    masthead: ReactNode;
    onPositionChange: (position: EditorPosition) => void;
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
    activeNoteKey?: string | null;
}) {
    const sectionRef = useRef<HTMLElement>(null);
    const layout = calculateScoreLayout(view);

    return (
        <section
            ref={sectionRef}
            tabIndex={0}
            className="relative outline-none"
            aria-label="SATB score editor"
            onKeyDown={onKeyDown}
            onClick={() => sectionRef.current?.focus({ preventScroll: true })}
        >
            <div className="flex flex-col items-start gap-8">
                {layout.pages.map((page) => (
                    <ScorePage
                        key={page.number}
                        page={page}
                        layout={layout}
                        view={view}
                        position={position}
                        onPositionChange={onPositionChange}
                        activeNoteKey={activeNoteKey}
                    >
                        {masthead}
                    </ScorePage>
                ))}
            </div>
        </section>
    );
}
