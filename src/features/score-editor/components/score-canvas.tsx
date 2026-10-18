import type { KeyboardEvent } from 'react';
import type { Editor } from '@tiptap/core';
import { EditorContent } from '@tiptap/react';
import type {
    EditorDocument,
    EditorMeasure,
} from '@/features/score-editor/adapters/editor-document-schema';
import { MeasureColumn } from '@/features/score-editor/components/score-canvas/measure-column';
import { MeasureHeadings } from '@/features/score-editor/components/score-canvas/measure-headings';
import { PartLabels } from '@/features/score-editor/components/score-canvas/part-labels';
import { calculateScoreLayout } from '@/features/score-editor/layout/calculate-score-layout';
import type { EditorPosition } from '@/features/score-editor/state/editor-position';

export function ScoreCanvas({
    document,
    position,
    editor,
    onPositionChange,
    onKeyDown,
    activeSlotId,
}: {
    document: EditorDocument;
    position: EditorPosition;
    editor: Editor;
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
            className="overflow-hidden rounded-xl border border-line bg-paper shadow-panel"
            aria-label="SATB score editor"
        >
            <div
                className="relative min-h-[313px] overflow-x-auto px-2 pb-4 pt-3 sm:px-4 sm:pb-5"
                onKeyDown={onKeyDown}
                onClick={() => editor.commands.focus()}
            >
                <MeasureHeadings measures={layout.measures} />

                <div className="mt-0.5 flex min-w-max">
                    <PartLabels />
                    <div className="flex min-w-max gap-0">
                        {layout.measures.map((layoutMeasure, index) => (
                            <MeasureColumn
                                key={layoutMeasure.measureId}
                                layoutMeasure={layoutMeasure}
                                isFirst={index === 0}
                                isLast={index === layout.measures.length - 1}
                                measureById={measureById}
                                position={position}
                                onPositionChange={onPositionChange}
                                activeSlotId={activeSlotId}
                            />
                        ))}
                    </div>
                </div>

                <EditorContent
                    editor={editor}
                    className="pointer-events-none absolute inset-0 opacity-0"
                />
            </div>
        </section>
    );
}
