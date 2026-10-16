import React from 'react';
import type { Editor } from '@tiptap/core';
import { EditorContent } from '@tiptap/react';
import { PARTS } from '@/domain/music';
import type { EditorDocument } from '../adapters/editor-document-schema';
import { calculateScoreLayout } from '../layout/calculate-score-layout';
import type { EditorPosition } from '../state/score-commands';
import PartMeasure from './score-canvas/part-measure';

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
    onKeyDown: (event: React.KeyboardEvent) => void;
    activeSlotId?: string | null;
}) {
    const layout = calculateScoreLayout(document);
    const measureById = new Map(document.measures.map((measure) => [measure.id, measure]));

    return (
        <section
            className="overflow-hidden rounded-xl border border-line bg-paper shadow-[0_8px_18px_rgba(48,70,55,0.05)]"
            aria-label="SATB score editor"
        >
            <div
                className="relative min-h-[313px] overflow-x-auto px-4 pb-5 pt-3"
                onKeyDown={onKeyDown}
                onClick={() => editor.commands.focus()}
            >
                <div className="flex min-w-max items-end">
                    <div className="w-[84px] shrink-0" />
                    <div className="flex min-w-max items-end gap-0">
                        {layout.measures.map((measure) => (
                            <div
                                key={measure.measureId}
                                className="px-3 pb-2 text-right text-[10px] uppercase tracking-[0.08em] text-[#9aa69c]"
                                style={{ width: measure.width }}
                            >
                                {measure.number}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-0.5 flex min-w-max">
                    <div className="w-[84px] shrink-0 pt-7">
                        {PARTS.map((part) => (
                            <div
                                key={part.id}
                                className="flex h-[52px] items-center font-serif text-[15px] font-bold text-green-dark"
                                title={part.label}
                            >
                                {part.shortLabel}
                                <span className="ml-2 text-[11px] font-normal text-muted">
                                    {part.label}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="flex min-w-max gap-0">
                        {layout.measures.map((layoutMeasure, measurePosition) => (
                            <div
                                key={layoutMeasure.measureId}
                                className={`relative border-l border-r border-[#87988c] bg-[linear-gradient(180deg,rgba(93,130,109,0.03),rgba(93,130,109,0.01))] ${measurePosition === layout.measures.length - 1 ? 'border-r-[3px] border-r-[#52695a]' : ''} ${measurePosition > 0 ? 'border-l-0' : ''}`}
                                style={{ width: layoutMeasure.width }}
                            >
                                {PARTS.map((part) => {
                                    const measure =
                                        document.measures.find(
                                            (candidate) =>
                                                candidate.id ===
                                                `${part.id}-${layoutMeasure.number}`,
                                        ) ?? measureById.get(layoutMeasure.measureId);
                                    if (!measure) return null;
                                    return (
                                        <PartMeasure
                                            key={part.id}
                                            measure={measure}
                                            position={position}
                                            onPositionChange={onPositionChange}
                                            activeSlotId={
                                                part.id === 'soprano' ? activeSlotId : null
                                            }
                                        />
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>

                <EditorContent editor={editor} className="pointer-events-none absolute inset-0 opacity-0" />
            </div>
        </section>
    );
}
