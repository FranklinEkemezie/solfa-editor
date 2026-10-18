import { useState } from 'react';
import { createEmptyScore } from '@/domain/music';
import { domainToEditor } from '@/features/score-editor/adapters/domain-to-editor';
import type { EditorDocument } from '@/features/score-editor/adapters/editor-document-schema';
import {
    addMeasure,
    removeLastMeasure,
} from '@/features/score-editor/state/score-measure-commands';
import type { EditorPosition } from '@/features/score-editor/state/editor-position';

export type ScoreStore = {
    document: EditorDocument;
    position: EditorPosition;
    canUndo: boolean;
    canRedo: boolean;
    commit: (next: EditorDocument, position?: EditorPosition) => void;
    undo: () => void;
    redo: () => void;
    addMeasure: () => void;
    removeMeasure: () => boolean;
};

export function useScoreStore(): ScoreStore {
    const [document, setDocument] = useState<EditorDocument>(() =>
        domainToEditor(createEmptyScore()),
    );
    const [position, setPosition] = useState<EditorPosition>(() => ({
        measureId: 'soprano-1',
        slotIndex: 0,
    }));
    const [undoStack, setUndoStack] = useState<EditorDocument[]>([]);
    const [redoStack, setRedoStack] = useState<EditorDocument[]>([]);

    const commit = (next: EditorDocument, nextPosition?: EditorPosition) => {
        setUndoStack((stack) => [...stack.slice(-39), document]);
        setRedoStack([]);
        setDocument(next);
        if (nextPosition) setPosition(nextPosition);
    };

    const undo = () => {
        const previous = undoStack.at(-1);
        if (!previous) return;
        setUndoStack((stack) => stack.slice(0, -1));
        setRedoStack((stack) => [...stack, document]);
        setDocument(previous);
    };

    const redo = () => {
        const next = redoStack.at(-1);
        if (!next) return;
        setRedoStack((stack) => stack.slice(0, -1));
        setUndoStack((stack) => [...stack, document]);
        setDocument(next);
    };

    const appendMeasure = () => {
        const nextNumber =
            Math.max(
                0,
                ...document.measures
                    .filter((measure) => measure.part === 'soprano')
                    .map((measure) => measure.number),
            ) + 1;
        const next = addMeasure(document);
        commit(next, { measureId: `soprano-${nextNumber}`, slotIndex: 0 });
    };
    const removeMeasure = () => {
        const next = removeLastMeasure(document);
        if (!next) return false;
        commit(next);
        return true;
    };

    return {
        document,
        position,
        canUndo: undoStack.length > 0,
        canRedo: redoStack.length > 0,
        commit,
        undo,
        redo,
        addMeasure: appendMeasure,
        removeMeasure,
    };
}
