import type { KeyboardEvent, ReactNode } from 'react';
import type { Editor } from '@tiptap/core';
import { EditorContent } from '@tiptap/react';
import type {
    EditorDocument,
    EditorMeasure,
} from '@/features/score-editor/adapters/editor-document-schema';
import { ScorePage } from '@/features/score-editor/components/score-canvas/score-page';
import { calculateScoreLayout } from '@/features/score-editor/layout/score-layout';
import type { EditorPosition } from '@/features/score-editor/state/editor-position';

/**
 * The score, as a document of A4 sheets.
 *
 * The page breaks are decided here and nowhere else, so the editor and the
 * printer agree on where the music falls. The sheets are stacked in reading
 * order and scroll past the reader; how large they are drawn is the viewport's
 * business, not this component's.
 *
 * The hidden Tiptap surface stays in the tree because it is what the physical
 * keyboard is captured by, and what undo and redo are kept in.
 */
export function ScoreDocument({
    document,
    position,
    editor,
    masthead,
    onPositionChange,
    onKeyDown,
    activeSlotId,
}: {
    document: EditorDocument;
    position: EditorPosition;
    editor: Editor;
    /** The editable title block, drawn on the first sheet. */
    masthead: ReactNode;
    onPositionChange: (position: EditorPosition) => void;
    onKeyDown: (event: KeyboardEvent) => void;
    activeSlotId?: string | null;
}) {
    const layout = calculateScoreLayout(document);
    const measureById: Map<string, EditorMeasure> = new Map(
        document.measures.map((measure) => [measure.id, measure]),
    );

    return (
        <section
            className="relative"
            aria-label="SATB score editor"
            onKeyDown={onKeyDown}
            onClick={() => editor.commands.focus()}
        >
            <div className="flex flex-col items-start gap-8">
                {layout.pages.map((page) => (
                    <ScorePage
                        key={page.number}
                        page={page}
                        layout={layout}
                        measureById={measureById}
                        position={position}
                        onPositionChange={onPositionChange}
                        activeSlotId={activeSlotId}
                    >
                        {masthead}
                    </ScorePage>
                ))}
            </div>
            <EditorContent
                editor={editor}
                className="pointer-events-none absolute h-0 w-0 opacity-0"
            />
        </section>
    );
}
