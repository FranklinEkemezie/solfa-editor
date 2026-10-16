import type { Editor } from '@tiptap/core';
import { EditorContent } from '@tiptap/react';
import type { EditorDocument } from '../adapters/editor-document-schema';
import type { EditorPosition } from '../state/score-commands';
import { calculateScoreLayout } from '../layout/calculate-score-layout';
import { PARTS } from '@/domain/music';
import PartMeasure from './score-canvas/part-measure';
import React from 'react';

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
        <section className="score-card" aria-label="SATB score editor">
            <div
                className="score-scroll"
                onKeyDown={onKeyDown}
                onClick={() => editor.commands.focus()}
            >
                <div className="score-ruler">
                    <div className="part-label-spacer" />
                    <div className="measure-sequence measure-sequence-ruler">
                        {layout.measures.map((measure) => (
                            <div
                                key={measure.measureId}
                                className="measure-ruler-cell text-base"
                                style={{ width: measure.width }}
                            >
                                {measure.number}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="score-body">
                    <div className="part-labels">
                        {PARTS.map((part) => (
                            <div key={part.id} className="part-label" title={part.label}>
                                {part.shortLabel}
                                <span>{part.label}</span>
                            </div>
                        ))}
                    </div>
                    <div className="measure-sequence">
                        {layout.measures.map((layoutMeasure, measurePosition) => (
                            <div
                                key={layoutMeasure.measureId}
                                className={`measure-block ${measurePosition === layout.measures.length - 1 ? 'measure-block-final' : ''}`}
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
                <EditorContent editor={editor} className="editor-capture" />
            </div>
        </section>
    );
}
