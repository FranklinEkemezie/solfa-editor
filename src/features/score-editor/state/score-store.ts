import { useCallback, useMemo, useState } from 'react';
import { PARTS } from '@/domain/parts';
import {
    createEmptyScoreDocument,
    withMeasureCount,
    type ScoreDocument,
} from '@/domain/score-document';
import { caretAt, caretAtEnd, type EditorPosition } from '@/features/score-editor/editing/caret';
import { buildScoreView } from '@/features/score-editor/model/build-score';
import type { ScoreView } from '@/features/score-editor/model/score-view';
import { ACTIVE_PRESET, presetDocument } from '@/features/score-editor/presets';
import {
    canRedo as historyCanRedo,
    canUndo as historyCanUndo,
    commitHistory,
    createHistory,
    redoHistory,
    undoHistory,
    type History,
} from '@/features/score-editor/state/history';

/** The state an undo step restores: the whole document, and where the writer was. */
type Snapshot = {
    readonly document: ScoreDocument;
    readonly position: EditorPosition;
};

export type MeasureRemoval = { ok: true } | { ok: false; message: string };

export type ScoreStore = {
    document: ScoreDocument;
    /** Measures, beats and diagnostics derived from the sources. */
    view: ScoreView;
    position: EditorPosition;
    canUndo: boolean;
    canRedo: boolean;
    /** Record a new document; a document that did not change only moves the caret. */
    commit: (next: ScoreDocument, position?: EditorPosition) => void;
    setPosition: (position: EditorPosition) => void;
    undo: () => void;
    redo: () => void;
    addMeasure: () => void;
    removeMeasure: () => MeasureRemoval;
};

/**
 * The document the editor opens with: the active sample when one is selected,
 * otherwise the empty default of an untitled score with two silent measures.
 */
function initialDocument(): ScoreDocument {
    return ACTIVE_PRESET ? presetDocument(ACTIVE_PRESET) : createEmptyScoreDocument();
}

/**
 * The editor's whole state.
 *
 * The document (metadata and four notation sources) is the only thing stored;
 * the page view is derived from it on every change. Undo history keeps the pair
 * of document and caret, so undoing returns the writer to where they were, and
 * moving the caret alone never becomes an undo step.
 */
export function useScoreStore(): ScoreStore {
    const [history, setHistory] = useState<History<Snapshot>>(() => {
        const document = initialDocument();
        return createHistory({ document, position: caretAtEnd(document) });
    });

    const { document, position } = history.present;
    const view = useMemo(() => buildScoreView(document), [document]);

    const commit = useCallback((next: ScoreDocument, nextPosition?: EditorPosition) => {
        setHistory((current) => {
            const target = nextPosition ?? current.present.position;
            const caret = caretAt(target.part, next.voices[target.part], target.offset);

            if (next === current.present.document) {
                if (
                    caret.part === current.present.position.part &&
                    caret.offset === current.present.position.offset
                ) {
                    return current;
                }
                return { ...current, present: { ...current.present, position: caret } };
            }

            return commitHistory(current, { document: next, position: caret });
        });
    }, []);

    const setPosition = useCallback((next: EditorPosition) => {
        setHistory((current) => {
            const caret = caretAt(
                next.part,
                current.present.document.voices[next.part],
                next.offset,
            );
            if (
                caret.part === current.present.position.part &&
                caret.offset === current.present.position.offset
            ) {
                return current;
            }
            return { ...current, present: { ...current.present, position: caret } };
        });
    }, []);

    const undo = useCallback(() => setHistory((current) => undoHistory(current)), []);
    const redo = useCallback(() => setHistory((current) => redoHistory(current)), []);

    const addMeasure = useCallback(() => {
        commit(withMeasureCount(document, Math.max(document.measureCount, view.measureCount) + 1));
    }, [commit, document, view.measureCount]);

    const removeMeasure = useCallback((): MeasureRemoval => {
        if (view.measureCount <= 1) {
            return { ok: false, message: 'Keep at least one measure in the score.' };
        }

        const hasMusic = PARTS.some((part) =>
            view.parts[part.id].measures[view.measureCount - 1]?.beats.some(
                (beat) => beat.items.length > 0,
            ),
        );

        if (hasMusic) {
            return {
                ok: false,
                message: 'The last measure still has music. Delete its notes first.',
            };
        }

        commit(withMeasureCount(document, Math.max(document.measureCount, view.measureCount) - 1));
        return { ok: true };
    }, [commit, document, view]);

    return {
        document,
        view,
        position,
        canUndo: historyCanUndo(history),
        canRedo: historyCanRedo(history),
        commit,
        setPosition,
        undo,
        redo,
        addMeasure,
        removeMeasure,
    };
}
