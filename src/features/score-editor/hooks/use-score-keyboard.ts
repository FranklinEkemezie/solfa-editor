import { useCallback, useRef, type KeyboardEvent } from 'react';
import type { ToastTone } from '@/components/feedback/toast-message';
import type { EditorDocument } from '@/features/score-editor/adapters/editor-document-schema';
import { playErrorTone } from '@/features/score-editor/audio/play-error-tone';
import { interpretInput, type InputResult } from '@/features/score-editor/editor/input-rules';
import { composeKey, type PendingSyllable } from '@/features/score-editor/editor/syllable-input';
import { advanceCursor } from '@/features/score-editor/state/advance-cursor';
import {
    findMeasure,
    previousPosition,
    type EditorPosition,
} from '@/features/score-editor/state/editor-position';
import {
    canClearBeat,
    canClearLastNote,
    clearBeat,
    clearLastNote,
} from '@/features/score-editor/state/score-slot-commands';

type ScoreKeyboardOptions = {
    document: EditorDocument;
    position: EditorPosition;
    commit: (document: EditorDocument, position?: EditorPosition) => void;
    moveTo: (position: EditorPosition) => void;
    undo: () => void;
    redo: () => void;
    onMessage: (message: string, tone?: ToastTone) => void;
};

const SUSTAIN_MESSAGE =
    'The next beat continues this note, so it cannot be cleared yet — remove that continuation first.';

export type ScoreKeyboard = {
    /** Key handler for the physical keyboard, attached to the score canvas. */
    handleKeyDown: (event: KeyboardEvent) => void;
    /** Apply a complete sol-fa token (`.`, `,`, `-`, or a syllable) at the caret. */
    input: (token: string) => void;
    /** Remove the last note of the caret's beat, stepping back a beat when it is empty. */
    backspace: () => void;
};

export function useScoreKeyboard({
    document,
    position,
    commit,
    moveTo,
    undo,
    redo,
    onMessage,
}: ScoreKeyboardOptions): ScoreKeyboard {
    // A first letter that only becomes a syllable once its second letter
    // arrives (`b` → `ba`). Reset whenever the caret moves or the edit fails.
    const pending = useRef<PendingSyllable>(null);

    const apply = useCallback(
        (result: InputResult) => {
            if (result.rejected) {
                onMessage(result.rejected);
                void playErrorTone();
                return;
            }
            if (result.document !== document) commit(result.document, result.position);
            if (result.status) onMessage(result.status, 'info');
        },
        [commit, document, onMessage],
    );

    const input = useCallback(
        (token: string) => {
            pending.current = null;
            apply(interpretInput(document, position, token));
        },
        [apply, document, position],
    );

    const backspace = useCallback(() => {
        pending.current = null;
        const beat = findMeasure(document, position.measureId)?.slots[position.slotIndex];

        if (beat && beat.notes.length > 0) {
            if (!canClearLastNote(document, position)) {
                onMessage(SUSTAIN_MESSAGE);
                void playErrorTone();
                return;
            }
            commit(clearLastNote(document, position), position);
            return;
        }

        const previous = previousPosition(document, position);
        const previousBeat = findMeasure(document, previous.measureId)?.slots[previous.slotIndex];
        if (previousBeat && previousBeat.notes.length > 0) {
            if (!canClearLastNote(document, previous)) {
                onMessage(SUSTAIN_MESSAGE);
                void playErrorTone();
                return;
            }
            commit(clearLastNote(document, previous), previous);
        }
    }, [commit, document, onMessage, position]);

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (event.metaKey || event.ctrlKey) {
                pending.current = null;
                if (event.key.toLowerCase() === 'z') {
                    event.preventDefault();
                    if (event.shiftKey) redo();
                    else undo();
                }
                if (event.key.toLowerCase() === 'y') {
                    event.preventDefault();
                    redo();
                }
                return;
            }

            if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                event.preventDefault();
                pending.current = null;
                const step = advanceCursor(document, position);
                if (step.document !== document) commit(step.document, step.position);
                else moveTo(step.position);
                return;
            }
            if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                event.preventDefault();
                pending.current = null;
                moveTo(previousPosition(document, position));
                return;
            }
            if (event.key === 'Backspace') {
                event.preventDefault();
                backspace();
                return;
            }
            if (event.key === 'Delete') {
                event.preventDefault();
                pending.current = null;
                if (!canClearBeat(document, position)) {
                    onMessage(SUSTAIN_MESSAGE);
                    void playErrorTone();
                    return;
                }
                commit(clearBeat(document, position), position);
                return;
            }

            if (event.key.length !== 1) return;
            event.preventDefault();
            const result = composeKey(document, position, pending.current, event.key);
            pending.current = result.pending;
            apply(result);
        },
        [apply, backspace, commit, document, moveTo, onMessage, position, redo, undo],
    );

    return { handleKeyDown, input, backspace };
}
